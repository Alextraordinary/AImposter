import React, { useEffect } from 'react';
import { useState, useContext } from 'react';
import './Question.css';
import QuizStateContext from './QuizState';
import FeedbackContainer from './feedBackContainer';
import logo from './AImposter.png';

function getWindowWidth() {
  const { innerWidth: width } = window;
  return width;
}

export default function Question({ question }) {
    // question: index of the question from the array of questions
    // currentAnswer: array index of the choice that the user picked
    const [currentAnswer, setCurrentAnswer] = useState(-1);
    const [windowWidth, setWindowWidth] = useState(getWindowWidth());
    const {
        currentQuestion,
        questions,
        answered,
        setAnswered,
        answers,
        setAnswers,
        score,
        setScore,
    } = useContext(QuizStateContext);
    const [isCorrect, setIsCorrect] = useState(false);

    const currentQuestionObject = questions[currentQuestion];
    const prompt = currentQuestionObject.text;
    const questionId = currentQuestionObject.questionId;
    const correctAnswer = currentQuestionObject.correct.value;
    const feedback = currentQuestionObject.correct.feedback;

    const nextButtonClick = () => {
        console.log(`Correct answer: ${correctAnswer}`);
        console.log(
            `Current answer: ${currentQuestionObject.choices[currentAnswer].value}`
        );
        const checkIfCorrect =
            correctAnswer ===
            currentQuestionObject.choices[currentAnswer].value;
        console.log(checkIfCorrect);
        if (checkIfCorrect) {
            setIsCorrect(true);
            setScore(score + 1);
        } else {
            setIsCorrect(false);
        }
        const answer = {
            questionId: questionId,
            choiceId: currentQuestionObject.choices[currentAnswer].choiceId,
        };
        setAnswers([...answers, answer]);
        setAnswered(true);
        setCurrentAnswer(-1);
    };

    useEffect(() => {
      window.addEventListener('resize', setWindowWidth(getWindowWidth));
    }, []);

    return (
        <>
            <div className="header">
                <img src={logo} alt="Logo" className="quiz-logo" />
                <div className="current-question-display">
                    Question {currentQuestion + 1}/{questions.length}
                </div>
            </div>
            {answered ? (
                <FeedbackContainer
                    isCorrect={isCorrect}
                    correctAnswer={correctAnswer}
                    feedback={feedback}
                />
            ) : (
                <div>
                    <h1 style={{maxWidth: windowWidth > 600 ? '1200px' : '350px'}}>{prompt}</h1>
                    <div
                        className="button-container"
                        style={{
                            display: 'flex',
                            flexDirection: windowWidth > 600 ? 'row' : 'column',
                            alignItems: 'center',
                            marginLeft: '50px',
                            marginRight: '50px',
                            maxWidth: windowWidth > 600 ? '1000px' : '350px',
                            gap: '20px',
                        }}
                    >
                        {currentQuestionObject.choices.map((option, index) => (
                            <button
                                className={
                                    currentAnswer === index
                                        ? 'active'
                                        : 'inactive'
                                }
                                style={{
                                    fontSize: '18px',
                                    maxWidth: windowWidth > 600 ? '1000px' : '350px'
                                }}
                                onClick={() => setCurrentAnswer(index)}
                            >
                                {option.value}
                            </button>
                        ))}
                    </div>
                    <div>
                        {currentAnswer != -1 && (
                            <button style={{margin: '50px'}} onClick={nextButtonClick}>Next</button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
