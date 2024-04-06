import { createContext } from 'react';

const QuizStateContext = createContext({
  questions: [],
  setQuestions: () => {},
  currentQuestion: -1,
  setCurrentQuestion: () => {},
  totalQuestions: 0,
  setTotalQuestions: () => {},
  answers: [],
  setAnswers: (answers) => {answers = answers},
  answered: false,
  setAnswered: () => {},
  score: 0,
  setScore: () => {},
});
export default QuizStateContext;
