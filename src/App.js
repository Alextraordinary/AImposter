import logo from './AImposter.png';

import React from 'react';
import './App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import QuizStateContext from './QuizState';
import Question from './Question';
import Ending from './Ending';

function App() {
    const startApp = () => {
        console.log('App started!');
        setCurrentQuestion(0);
    };

    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(-1);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [answered, setAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const quizState = {
        questions,
        setQuestions,
        currentQuestion,
        setCurrentQuestion,
        totalQuestions,
        answers,
        setAnswers,
        answered,
        setAnswered,
        score,
        setScore,
    };

    useEffect(() => {
        axios
            .get(
                `https://cs492-server.s4mi89p5qv8n8.ca-central-1.cs.amazonlightsail.com/questions`
            )
            .then((res) => {
                const data = res.data;
                setQuestions(data.questions);
                setTotalQuestions(data.questions.length);
            });
    }, []);

    return (
        <QuizStateContext.Provider value={quizState}>
            <div className="App">
                {currentQuestion == -1 && (
                    <header className="App-header">
                        <img src={logo} className="App-logo" alt="logo" />
                        <h1>Welcome to AImposter</h1>
                        <p>
                            <strong style={{color: "#ffd54f"}}>Instructions</strong>
                            <br />
                            <br />
                            For each prompt we show you, please identify which one of the listed
                            responses you think is <strong>AI-generated</strong>.
                            <br />
                            <span className='amongus'>ඞ</span> Click the button below to start the quiz <span className='amongus'>ඞ</span> 
                        </p>
                        <button className="start-button" onClick={startApp}>
                            <div className="triangle"></div>
                        </button>
                    </header>
                )}
                {currentQuestion >= 0 && currentQuestion < totalQuestions && (
                    <div>
                        <Question question={currentQuestion} />
                    </div>
                )}
                {currentQuestion >= totalQuestions && <Ending />}
            </div>
        </QuizStateContext.Provider>
    );
}

export default App;
