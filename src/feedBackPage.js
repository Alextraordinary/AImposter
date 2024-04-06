import React from 'react';
import { useState, useEffect } from 'react';
import './FeedbackPage.css';

function getWindowWidth() {
  const { innerWidth: width } = window;
  return width;
}

// FeedbackPage component
const FeedbackPage = ({ isCorrect, correctAnswer, onNextQuestion, feedback }) => {
  const [windowWidth, setWindowWidth] = useState(getWindowWidth());

  useEffect(() => {
    window.addEventListener('resize', setWindowWidth(getWindowWidth));
  }, []);  
  
  return (
        <div className="feedback-container">
            {isCorrect ? (
                <p style={{maxWidth: windowWidth > 600 ? '1200px' : '300px'}} className="feedback-message correct">Correct! Well done.</p>
            ) : (
                <p style={{maxWidth: windowWidth > 600 ? '1200px' : '300px'}} className="feedback-message incorrect">
                    Incorrect. You have been fooled by the AImposter...
                </p>
            )}
            <div className="feedback-details">
                <strong>AI-Generated Response</strong> 
                <p style={{maxWidth: windowWidth < 600 ? '1200px' : '350px'}}>{correctAnswer}</p>
            </div>
            {/* <div>
                <strong>Source:</strong>{' '}
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.name}
                </a>
            </div> */}
            <div className="feedback-details">
                <strong>Feedback</strong> 
                <p style={{maxWidth: windowWidth > 600 ? '1200px' : '350px'}}>{feedback}</p>
            </div>
            <button onClick={onNextQuestion} className="next-button">
                Next
            </button>
        </div>
    );
};

export default FeedbackPage;
