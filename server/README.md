# AImposter Server

## Overview

This Python flask server wraps the Google Forms API and the arcane process of submitting user responses in an automated way. API endpoints are provided to retrieve the AImposter Google Form questions via a GET and submit answers via POST.

## Installation

1. Install dependencies from `server/requirements.txt`:

    ```bash
    pip install -r server/requirements.txt
    ```

## Start Flask Server

1. Start the Flask server:

    ```bash
    python3 server/server.py --port 7777 --cred_path server/google-credentials.json
    ```

2. The Flask server will start on `http://0.0.0.0:7777`. This means you can call the server endpoints on `localhost:7777` or any publically exposed IP addresses such as `129.97.167.42:7777`. The server will also authenticate with Google Forms API using the credentials JSON file at `server/google-credentials.json`.

## API Endpoints

### GET `/questions`

- **Description:** Retrieves questions, answer choices, and the correct answer with feedback for the Goole form.
- **Response Format:** JSON
- **Response Example:**

    ```json
    {
        "formId": "1j9tE3lK_XIeS9PuNW0Qhg_i7N-NOyQn1smISprhPqYI",
        "formUri": "https://docs.google.com/forms/d/e/1FAIpQLScGIUwXXMirgdkcFhEwFQhgnPqTFglVdEje_DIEpM99bkkAyA/viewform",
        "questions": [
            {
                "choices": [
                    {
                        "choiceId": "1",
                        "value": "True"
                    },
                    {
                        "choiceId": "2",
                        "value": "False"
                    }
                ],
                "correct": {
                    "feedback": "True is correct!",
                    "value": "True"
                },
                "questionId": "1052298206",
                "text": "Are you Human?"
            },
            {
                "choices": [
                    {
                        "choiceId": "1",
                        "value": "Hotdog"
                    },
                    {
                        "choiceId": "2",
                        "value": "Not Hot"
                    },
                    {
                        "choiceId": "3",
                        "value": "Not Dog"
                    }
                ],
                "correct": {
                    "feedback": "Not dog is correct!",
                    "value": "Hotdog"
                },
                "questionId": "137205999",
                "text": "Hotdog or not Hotdog?"
            },
            {
                "choices": [
                    {
                        "choiceId": "1",
                        "value": "Indeed, plans to direct voters to a site with legitimate voting information – and ensuring ChatGPT doesn’t misrepresent democratic processes – would suggest, at least on the surface, that OpenAI may have enforced tighter regulations on itself than many of the other channels we use to source information, where disinformation often festers."
                    },
                    {
                        "choiceId": "2",
                        "value": "Once in a tranquil village nestled between verdant hills and crystal-clear streams, there lived a curious young boy named Eli. Eli was known throughout the village for his insatiable curiosity and adventurous spirit. Despite the peaceful life the village offered, he dreamed of exploring the world beyond the hills that cradled their homes."
                    }
                ],
                "correct": {
                    "feedback": "Second one is correct!",
                    "value": "Indeed, plans to direct voters to a site with legitimate voting information – and ensuring ChatGPT doesn’t misrepresent democratic processes – would suggest, at least on the surface, that OpenAI may have enforced tighter regulations on itself than many of the other channels we use to source information, where disinformation often festers."
                },
                "questionId": "137635383",
                "text": "What is AI Generated?"
            }
        ],
        "title": "AImposter?"
    }
    ```

### POST `/submission`

- **Description:** Submits user answers to the form, where each choice is referenced by a `choiceId` provided in the GET `/questions` response object.
- **Method:** POST
- **Request Format:** JSON
- **Request Example:**

    ```json
    {
        "answers": [
            {
                "questionId": "1052298206",
                "choiceId": "2"
            },
            {
                "questionId": "137205999",
                "choiceId": "3"
            },
            {
                "questionId": "137635383",
                "choiceId": "1"
            }
        ]
    }
    ```

- **Response Format:** JSON
- **Response Example:**

    ```json
    {
        "message": "Answers processed successfully"
    }
    ```

## Usage

1. Access the `/questions` endpoint to retrieve the form questions in JSON format.
2. Fill out the form with your answers.
3. Submit your answers to the `/submit` endpoint in the specified JSON format, the server submits your response to Google Forms.
4. Receive a success message upon successful submission.

## Docker
The server can be containerized to host on various infrastructure
- Build and tag the Docker image: `docker build -t cs492-server:0.1.0 .`
- Run the container: `docker run -p 7777:7777 --name cs492-server cs492-server:0.1.0`

## Deployment (Lightsail)
**Prerequisites:** Follow the instructions at https://docs.aws.amazon.com/en_us/lightsail/latest/userguide/amazon-lightsail-install-software.html 
to install Docker, the AWS CLI and the Lightsail Control plugin. You will also need the access key and secret key for a profile called **cs492-server**.

1. After rebuilding the latest Docker image, push it to the container service:
    ```bash
    aws lightsail push-container-image --profile cs492-server --service-name cs492-server --label cs492-server --image cs492-server:0.1.0
    ```

2. Update **containers.json** with the latest "image", which is outputted from the previous command.
3. Create the deployment:
    ```bash
    aws lightsail create-container-service-deployment --profile cs492-server --service-name cs492-server --containers file://containers.json --public-endpoint file://public-endpoint.json
    ```
4. Monitor the status of the deployment: ```aws lightsail get-container-services --profile cs492-server --service-name cs492-server```

## Server Public Domain
`cs492-server.s4mi89p5qv8n8.ca-central-1.cs.amazonlightsail.com`

Requests from the client should allow this origin for CORS.

### Example HTTP requests
Get questions:
```
curl https://cs492-server.s4mi89p5qv8n8.ca-central-1.cs.amazonlightsail.com/questions
```

Submit responses:
```
curl -X POST \
  -H "Content-Type: application/json" \
  -d @answers.example.json \
  https://cs492-server.s4mi89p5qv8n8.ca-central-1.cs.amazonlightsail.com/submission
```
