import React, { useState, useContext } from 'react';
import FeedbackPage from './feedBackPage';
import QuizStateContext from "./QuizState";

const FeedbackContainer = ({ isCorrect, correctAnswer, feedback }) => {
    // Sample state
    // const source = {
    //     name: 'Wikipedia',
    //     url: 'https://en.wikipedia.org/wiki/Life,_the_Universe_and_Everything',
    // };
    const { currentQuestion, setCurrentQuestion, setAnswered } = useContext(QuizStateContext);

    const handleNextQuestion = () => {
        console.log('Next question logic goes here.');
        setCurrentQuestion(currentQuestion + 1);
        console.log(currentQuestion);
        setAnswered(false);
    };

    console.log(`Is correct value: ${isCorrect}`);

    return (
        <FeedbackPage
            isCorrect={isCorrect}
            correctAnswer={correctAnswer}
            feedback={feedback}
            // source={source}
            onNextQuestion={handleNextQuestion}
        />
    );
};

export default FeedbackContainer;
