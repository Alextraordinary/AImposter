import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import './Ending.css';
import nice from './nice.gif';
import why from './why.gif';
import QuizStateContext from './QuizState';

/**
 * The ending page of the game
 * score: the number of questions the player answered correctly
 * answers: the user's repsonses to all questions
 */
function Ending() {
    const [responsesSubmitted, setResponsesSubmitted] = useState(false);
    const { answers, score, totalQuestions } = useContext(QuizStateContext);
    const submitResponses = async () => {
        try {
            const response = await axios.post(
                'https://cs492-server.s4mi89p5qv8n8.ca-central-1.cs.amazonlightsail.com/submission',
                {
                    answers: answers,
                }
            );
            if (response.data.message === 'Answers processed successfully') {
                setResponsesSubmitted(true);
            }
        } catch (error) {
            console.error('Error submitting responses:', error);
        }
    };
    useEffect(() => {
        submitResponses();
        console.log(answers);
    }, []);
    const passingScore = totalQuestions / 2;

    return (
        <div className="centered-container">
            <div>
                <h1>
                    YOUR SCORE:{' '}
                    <span>
                        {score}/{totalQuestions}
                    </span>
                </h1>
            </div>
            <div>
                {score > passingScore ? (
                    <img src={nice} alt="nice" />
                ) : (
                    <img src={why} alt="why" />
                )}
            </div>
            <div>
                {score > passingScore ? (
                    <p>
                        Nice! The AImposter had a hard time fooling you. You
                        have a keen eye for spotting chatbots.
                    </p>
                ) : (
                    <p>
                        Yikes... The AImposter fooled you many times. Remember
                        that anything written online could have been generated
                        by a chatbot!
                    </p>
                )}
            </div>
            {responsesSubmitted && (
                <div>
                    <button onClick={() => window.location.reload()}>
                        Play again
                    </button>
                </div>
            )}
        </div>
    );
}

export default Ending;
