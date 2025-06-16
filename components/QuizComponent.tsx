
import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import toast from 'react-hot-toast';

interface QuizProps {
  questions: QuizQuestion[];
  onQuizComplete: (score: number, correctAnswers: number, totalQuestions: number) => void;
}

const QuizComponent: React.FC<QuizProps> = ({ questions, onQuizComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitQuiz = () => {
    if (Object.keys(selectedAnswers).length !== questions.length) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    let correctCount = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctOptionId) {
        correctCount++;
      }
    });
    const calculatedScore = (correctCount / questions.length);
    setScore(calculatedScore);
    setShowResults(true);
    onQuizComplete(calculatedScore, correctCount, questions.length);
    toast.success(`Quiz submitted! You got ${correctCount}/${questions.length} correct.`);
  };

  if (showResults) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold text-sky-700 mb-4">Quiz Results</h3>
        <p className="text-lg mb-2">You scored: <span className="font-bold">{(score * 100).toFixed(0)}%</span></p>
        <p className="text-gray-700 mb-6">({(score * questions.length).toFixed(0)} out of {questions.length} correct)</p>
        
        {questions.map((q, index) => (
          <div key={q.id} className={`mb-4 p-3 rounded border ${selectedAnswers[q.id] === q.correctOptionId ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
            <p className="font-medium text-gray-800">{index + 1}. {q.text}</p>
            <p className="text-sm">Your answer: {q.options.find(opt => opt.id === selectedAnswers[q.id])?.text || 'Not answered'}</p>
            {selectedAnswers[q.id] !== q.correctOptionId && (
              <p className="text-sm text-green-700">Correct answer: {q.options.find(opt => opt.id === q.correctOptionId)?.text}</p>
            )}
            {q.explanation && <p className="text-xs text-gray-600 mt-1 italic">{q.explanation}</p>}
          </div>
        ))}
        <button
          onClick={() => { setShowResults(false); setSelectedAnswers({}); setCurrentQuestionIndex(0); setScore(0);}}
          className="mt-4 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Retake Quiz
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold text-sky-700 mb-2">Quiz: Question {currentQuestionIndex + 1} of {questions.length}</h3>
      <p className="text-lg text-gray-800 mb-6">{currentQuestion.text}</p>
      <div className="space-y-3">
        {currentQuestion.options.map(option => (
          <button
            key={option.id}
            onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
            className={`
              w-full text-left p-3 border rounded-lg transition-all
              ${selectedAnswers[currentQuestion.id] === option.id 
                ? 'bg-sky-500 text-white border-sky-600 ring-2 ring-sky-400' 
                : 'bg-gray-50 hover:bg-sky-100 border-gray-300 text-gray-700'}
            `}
          >
            {option.text}
          </button>
        ))}
      </div>
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          Previous
        </button>
        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmitQuiz}
             disabled={!selectedAnswers[currentQuestion.id]}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={!selectedAnswers[currentQuestion.id]}
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizComponent;
