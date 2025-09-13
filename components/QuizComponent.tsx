
import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '../types';
import { quizService, ApiQuiz, ApiQuizQuestion } from '../services/quizService';
import toast from 'react-hot-toast';

interface QuizProps {
  quizId?: string;
  moduleId?: string;
  questions?: QuizQuestion[]; // Fallback for legacy usage
  onQuizComplete: (score: number) => void;
}

const QuizComponent: React.FC<QuizProps> = ({ quizId, moduleId, questions: propQuestions, onQuizComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [quiz, setQuiz] = useState<ApiQuiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Load quiz data from API
  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId && !moduleId && propQuestions) {
        // Use legacy prop questions
        setQuestions(propQuestions);
        return;
      }

      try {
        setLoading(true);
        
        let quizData;
        if (quizId) {
          // Load specific quiz
          const response = await quizService.getQuiz(quizId);
          quizData = response.quiz;
        } else if (moduleId) {
          // Load quizzes for module and use the first one
          const response = await quizService.getModuleQuizzes(moduleId);
          if (response.quizzes && response.quizzes.length > 0) {
            quizData = response.quizzes[0];
          }
        }

        if (quizData) {
          setQuiz(quizData);
          
          // Convert API questions to frontend format
          const convertedQuestions: QuizQuestion[] = quizData.questions.map((apiQ: ApiQuizQuestion) => {
            // Handle MongoDB structure where options are strings and correct_answer is separate
            let options = [];
            let correctOptionId = '';
            
            if (Array.isArray(apiQ.options)) {
              if (typeof apiQ.options[0] === 'string') {
                // MongoDB format: options are array of strings
                options = apiQ.options.map((optText: string, index: number) => ({
                  id: `option_${index}`,
                  text: optText
                }));
                
                // Find correct option by matching correct_answer with option text
                const correctIndex = apiQ.options.findIndex(opt => opt === apiQ.correct_answer);
                correctOptionId = correctIndex >= 0 ? `option_${correctIndex}` : '';
              } else {
                // Legacy format: options are objects with id/text/is_correct
                options = apiQ.options.map((opt: any) => ({
                  id: opt.option_id || opt.id,
                  text: opt.text
                }));
                correctOptionId = apiQ.options.find((opt: any) => opt.is_correct)?.option_id || apiQ.options.find((opt: any) => opt.is_correct)?.id || '';
              }
            }

            return {
              id: apiQ.question_id,
              text: apiQ.question_text,
              options,
              correctOptionId,
              explanation: apiQ.explanation
            };
          });
          
          setQuestions(convertedQuestions);
        } else if (!propQuestions) {
          throw new Error('No quiz found');
        }
      } catch (error) {
        console.error('Failed to load quiz:', error);
        toast.error('Failed to load quiz');
        
        // Fallback to demo questions if provided
        if (propQuestions) {
          setQuestions(propQuestions);
        }
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId, moduleId, propQuestions]);

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(selectedAnswers).length !== questions.length) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    try {
      let scorePercentage = 0;
      
      if (quiz && attemptId) {
        // Convert option IDs to actual answer text for API submission
        const answerTexts: Record<string, string> = {};
        Object.entries(selectedAnswers).forEach(([questionId, optionId]) => {
          const question = questions.find(q => q.id === questionId);
          if (question) {
            const selectedOption = question.options.find(opt => opt.id === optionId);
            if (selectedOption) {
              answerTexts[questionId] = selectedOption.text;
            }
          }
        });

        // Submit via API
        const response = await quizService.submitQuizAttempt(attemptId, answerTexts);
        if (response && response.attempt) {
          scorePercentage = response.attempt.percentage;
          setScore(response.attempt.percentage / 100);
        }
      } else {
        // Fallback: calculate locally for legacy usage
        let correctCount = 0;
        questions.forEach(q => {
          if (selectedAnswers[q.id] === q.correctOptionId) {
            correctCount++;
          }
        });
        const calculatedScore = (correctCount / questions.length);
        scorePercentage = Math.round(calculatedScore * 100);
        setScore(calculatedScore);
      }

      setShowResults(true);
      onQuizComplete(scorePercentage);
      toast.success(`Quiz submitted! Score: ${scorePercentage}%`);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      toast.error('Failed to submit quiz. Please try again.');
    }
  };

  const startQuizAttempt = async () => {
    if (!quiz) return;
    
    try {
      const response = await quizService.startQuizAttempt(quiz.quiz_id);
      if (response && response.attempt) {
        setAttemptId(response.attempt.attempt_id);
      }
    } catch (error) {
      console.error('Failed to start quiz attempt:', error);
      // Continue without attempt tracking for demo purposes
    }
  };

  // Start quiz attempt when quiz is loaded
  useEffect(() => {
    if (quiz && !attemptId) {
      startQuizAttempt();
    }
  }, [quiz, attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white rounded-xl shadow-lg border border-slate-200">
        <div className="loading-spinner w-8 h-8"></div>
        <span className="ml-3 text-slate-600">Loading quiz...</span>
      </div>
    );
  }

  if (showResults) {
    const scorePercentage = Math.round(score * 100);
    const passed = score >= 0.7;
    const correctCount = Math.round(score * questions.length);
    
    return (
      <div className="p-8 bg-white rounded-xl shadow-lg border border-slate-200">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
            passed ? 'bg-green-100 border-4 border-green-200' : 'bg-red-100 border-4 border-red-200'
          }`}>
            <span className={`text-2xl font-bold ${
              passed ? 'text-green-600' : 'text-red-600'
            }`}>
              {scorePercentage}%
            </span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-2">Quiz Completed!</h3>
          <p className={`text-lg font-medium ${
            passed ? 'text-green-600' : 'text-red-600'
          }`}>
            {passed ? "🎉 Excellent work! You passed!" : "📚 Keep studying and try again."}
          </p>
          <p className="text-slate-600 mt-2">
            You got {correctCount} out of {questions.length} questions correct
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-slate-600 mb-2">
            <span>Your Score</span>
            <span>{scorePercentage}% ({correctCount}/{questions.length})</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4">
            <div 
              className={`h-4 rounded-full transition-all duration-1000 ${
                passed ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${scorePercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Question Review */}
        <div className="space-y-4 mb-8 max-h-64 overflow-y-auto">
          {questions.map((q, index) => {
            const isCorrect = selectedAnswers[q.id] === q.correctOptionId;
            return (
              <div key={q.id} className={`p-4 rounded-lg border ${
                isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
              }`}>
                <p className="font-medium text-slate-800 mb-2">{index + 1}. {q.text}</p>
                <p className="text-sm text-slate-600 mb-1">
                  <span className="font-medium">Your answer:</span> {
                    q.options.find(opt => opt.id === selectedAnswers[q.id])?.text || 'Not answered'
                  }
                </p>
                {!isCorrect && (
                  <p className="text-sm text-green-700 mb-1">
                    <span className="font-medium">Correct answer:</span> {
                      q.options.find(opt => opt.id === q.correctOptionId)?.text
                    }
                  </p>
                )}
                {q.explanation && (
                  <p className="text-xs text-slate-600 mt-2 p-2 bg-slate-100 rounded italic">
                    💡 {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setShowResults(false);
              setCurrentQuestionIndex(0);
              setSelectedAnswers({});
              setScore(0);
              setAttemptId(null);
              if (quiz) {
                startQuizAttempt();
              }
            }}
            className="btn-secondary flex-1"
          >
            Retake Quiz
          </button>
          <button 
            onClick={() => onQuizComplete(scorePercentage)}
            className="btn-primary flex-1"
          >
            Continue Learning
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="p-8 bg-white rounded-xl shadow-lg border border-slate-200 text-center">
        <p className="text-slate-600">No quiz questions available.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white rounded-xl shadow-lg border border-slate-200">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-slate-900">
            {quiz?.title || 'Quiz'}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
        <p className="text-sm text-slate-600">
          Progress: {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% complete
        </p>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h4 className="text-xl font-semibold text-slate-900 mb-6 leading-relaxed">
          {currentQuestion.text}
        </h4>
        
        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestion.id] === option.id;
            const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...
            
            return (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                className={`
                  w-full text-left p-4 border-2 rounded-lg transition-all duration-200 group
                  ${isSelected 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg transform scale-[1.02]' 
                    : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400 hover:bg-blue-50'}
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${isSelected 
                      ? 'bg-white text-blue-600' 
                      : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100'}
                  `}>
                    {optionLetter}
                  </div>
                  <span className="flex-1 text-base">{option.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        
        <div className="flex space-x-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentQuestionIndex
                  ? 'bg-blue-600'
                  : selectedAnswers[questions[index]?.id]
                  ? 'bg-green-400'
                  : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
        
        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            disabled={Object.keys(selectedAnswers).length !== questions.length}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Quiz →
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
            className="btn-primary"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizComponent;
