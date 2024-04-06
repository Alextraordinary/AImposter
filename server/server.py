import argparse
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from google.auth.transport.requests import Request
from googleapiclient import discovery
from google.oauth2 import service_account
import requests
from bs4 import BeautifulSoup
import re
from waitress import serve
import pprint


SERViCE_ACCOUNT_EMAIL = "aimposter@aimposter.iam.gserviceaccount.com"
SERVICE_ACCOUNT_SCOPES = [
    "https://www.googleapis.com/auth/forms",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/cloud-platform",
]

PRIVATE_FORM_ID = "1j9tE3lK_XIeS9PuNW0Qhg_i7N-NOyQn1smISprhPqYI"
PUBLIC_FORM_ID = "1FAIpQLScGIUwXXMirgdkcFhEwFQhgnPqTFglVdEje_DIEpM99bkkAyA"


FORM_QUESTION_ID_REGEX = re.compile("entry\.(\d+)")
AIMPOSTER_FORM = {}

"""
Stores URL-encoded text of each multiple-choice option for all form questions.

This dictionary mapping enables the client to reference a question's choice id (ex. "1"), instead
of handling potentially long swaths of text values to uiquely identify each questions choice.

Structure
- Key: <question id>:<choice id>
- Value: Plain choice value text (case sensitive), which will later be encoed and be sent as query
  parameter when submitted as the chosen user answer for a Google Form response.

Usage Example
```
    QUESTION_CHOICES[f"{question_id}:{choice_id}"] = "Some google form answer choice..."
```

Note:
Use the same delimiter ":" when concatenating question and choice IDs!
"""
QUESTION_CHOICES: dict[str, str] = dict()

app = Flask(__name__)
CORS(app)


@app.route("/questions", methods=["GET"])
def get_questions():
    try:
        return jsonify(AIMPOSTER_FORM)
    except Exception as err:
        return (
            jsonify({"error": "Internal server error"}),
            500,
        )


@app.route("/submission", methods=["POST"])
def post_submission():
    try:
        submission = request.get_json()

        if "answers" not in submission:
            return jsonify({"error": "Missing 'answers' in request body"}), 400

        if not isinstance(submission["answers"], list):
            return jsonify({"error": "'answers' must be a list in request body"}), 400

        if len(submission["answers"]) != len(AIMPOSTER_FORM["questions"]):
            return (
                jsonify({"error": "Inccorect number of 'answers' in request body"}),
                400,
            )

        submit_user_form_response(PUBLIC_FORM_ID, submission)
        return jsonify({"message": "Answers processed successfully"}), 200
    except Exception as err:
        return (
            jsonify({"error": "Invalid request form submission in request body"}),
            400,
        )


def create_google_jwt(credentials_path):
    try:
        credentials = service_account.Credentials.from_service_account_file(
            credentials_path, scopes=SERVICE_ACCOUNT_SCOPES
        )
        credentials.refresh(Request())
        return credentials.with_subject(SERViCE_ACCOUNT_EMAIL)
    except Exception as err:
        return err


def scrape_question_ids(public_form_id, question_id_regex):
    """
    Scrapes a Google Form's raw HTML to find input field identifiers, which are necessary for constructing
    a parameterized query string. This string is then used to submit a user response to the form. This method
    is required because the Google Forms API does not provide a way to submit responses programmatically; it
    only allows for viewing and modifying forms as an administrator.

    Parameters:
    - public_form_id (str): The public facing ID of the Google Form to be scraped.
    - question_id_regex (str): Rgular expression pattern used to identify the input field tags within the
      form's HTML. This pattern should match input tags 'entry.<number>' and only extract '<number>'.

    Returns:
    - ex. ['1234567890', '0987654321'] for tags "entry.1234567890" and "entry.0987654321".
    """

    # Send a GET request to retrieve the Google Form's raw HTML
    response = requests.get(
        f"https://docs.google.com/forms/d/e/{public_form_id}/viewform"
    )
    if response.status_code != 200:
        raise ValueError("cannot retrieve Google Form raw HTML, double check the URL")

    # Parse out all question inut tag ids from raw Google Form HTML.
    form_html = BeautifulSoup(response.text, "html.parser")
    html_question_ids = re.findall(question_id_regex, str(form_html))

    return html_question_ids


def parse_google_form_json(google_form_json, html_question_ids):
    aimposter_form = {}
    aimposter_form["formId"] = google_form_json["formId"]
    aimposter_form["title"] = google_form_json["info"]["documentTitle"]
    aimposter_form["formUri"] = google_form_json["responderUri"]
    aimposter_form["questions"] = []

    for google_item in google_form_json["items"]:
        aimposter_question = {}
        # Ignore the question id provided by Google Form backend API. We replace it with scraped
        # HTML tag id "entry.<number>" for our own use.
        aimposter_question["questionId"] = html_question_ids.pop(0)
        aimposter_question["text"] = google_item["title"]

        google_question = google_item["questionItem"]["question"]

        assert (
            "options" in google_question["choiceQuestion"]
        ), "BAD FORM: Google form must only contain a mutliple choice questions"
        assert (
            "correctAnswers" in google_question["grading"]
            and len(google_question["grading"]["correctAnswers"]["answers"]) == 1
        ), "BAD FORM: Google form questions must have exactly one correct answer"

        # Parse the multiple choice options under each question.
        aimposter_question["choices"] = []
        for index, option in enumerate(google_question["choiceQuestion"]["options"]):
            choice_id = "{}".format(index + 1)
            aimposter_question["choices"].append(
                {"choiceId": choice_id, "value": option["value"]}
            )

            # Store each question choice in global map for lookup on form submission
            choice_key = f"{aimposter_question['questionId']}:{choice_id}"
            # urllib.parse.quote(option["value"])
            QUESTION_CHOICES[choice_key] = option["value"]

        # Parse the single correct answer value and feedback for each question.
        correct_answer = google_question["grading"]["correctAnswers"]["answers"][0]
        aimposter_question["correct"] = {
            "value": correct_answer["value"],
            "feedback": google_question["grading"]["whenWrong"]["text"],
        }

        # Add the question along with it's answer choices, correct answer and feedback.
        aimposter_form["questions"].append(aimposter_question)

    return aimposter_form


def submit_user_form_response(public_form_id, submission):
    form_body = {}

    # Process each user selected answer choice in form submission json.
    for userAnswer in submission["answers"]:
        question_id = userAnswer.get("questionId")
        choice_id = userAnswer.get("choiceId")

        # Lookup actual question choice text value given provided id, to build POST request that is
        # sent to actual Google Forms endpoint;.
        choice_text = QUESTION_CHOICES[f"{question_id}:{choice_id}"]
        form_body[f"entry.{question_id}"] = choice_text

    requests.post(
        f"https://docs.google.com/forms/d/e/{public_form_id}/formResponse",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data=form_body,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Description of your program")
    parser.add_argument("-p", "--port", help="Port Number of Server", required=True)
    parser.add_argument(
        "-c",
        "--cred_path",
        help="Credentials absolute file path for Google Forms",
        required=True,
    )
    cli_args = vars(parser.parse_args())

    print("INFO: public Google Form id:", PUBLIC_FORM_ID)
    print("INFO: private Google Form id:", PRIVATE_FORM_ID)

    # Preload all Google form questions, answer choices, correct answers and feedback into memory
    # before serving any API requests.
    forms_client = discovery.build(
        "forms", "v1", credentials=create_google_jwt(cli_args["cred_path"])
    )
    google_form = forms_client.forms().get(formId=PRIVATE_FORM_ID).execute()
    html_question_ids = scrape_question_ids(PUBLIC_FORM_ID, FORM_QUESTION_ID_REGEX)

    AIMPOSTER_FORM = parse_google_form_json(google_form, html_question_ids)
    pprint.pprint(QUESTION_CHOICES)

    # Start serving API requests to get form questions or post form submisions.
    logging.basicConfig(level=logging.DEBUG, format="%(asctime)s %(message)s")
    serve(app, host="0.0.0.0", port=cli_args["port"])
