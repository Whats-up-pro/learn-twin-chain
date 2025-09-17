
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { QuizQuestion } from '../types';
import { quizService, ApiQuiz, ApiQuizQuestion } from '../services/quizService';
import toast from 'react-hot-toast';
import { useTranslation } from '../src/hooks/useTranslation';

interface QuizProps {
  quizId?: string;
  moduleId?: string;
  questions?: QuizQuestion[]; // Fallback for legacy usage
  onQuizComplete: (score: number) => void;
}

const QuizComponent: React.FC<QuizProps> = ({ quizId, moduleId, questions: propQuestions, onQuizComplete }) => {
  const { t } = useTranslation();
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
          const response = await quizService.getQuiz(quizId) as any;
          quizData = (response as any).quiz;
        } else if (moduleId) {
          // Load quizzes for module and use the first one
          const response = await quizService.getModuleQuizzes(moduleId) as any;
          if ((response as any).quizzes && (response as any).quizzes.length > 0) {
            quizData = (response as any).quizzes[0];
          }
        }

        if (quizData) {
          setQuiz(quizData);
          
          // Convert API questions to frontend format
          const convertedQuestions: QuizQuestion[] = quizData.questions.map((apiQ: ApiQuizQuestion) => {
            // Handle MongoDB structure where options are strings and correct_answer is separate
            let options: Array<{ id: string; text: string } | any> = [];
            let correctOptionId = '';
            
            if (Array.isArray(apiQ.options)) {
              if (typeof apiQ.options[0] === 'string') {
                // MongoDB format: options are array of strings
                options = (apiQ.options as string[]).map((optText: string, index: number) => ({
                  id: `option_${index}`,
                  text: optText
                }));
                
                // Find correct option by matching correct_answer with option text
                const correctIndex = (apiQ.options as string[]).findIndex((opt: string) => opt === (apiQ as any).correct_answer);
                correctOptionId = correctIndex >= 0 ? `option_${correctIndex}` : '';
              } else {
                // Legacy format: options are objects with id/text/is_correct
                options = (apiQ.options as any[]).map((opt: any) => ({
                  id: opt.option_id || opt.id,
                  text: opt.text
                }));
                const found = (apiQ.options as any[]).find((opt: any) => opt.is_correct);
                correctOptionId = found?.option_id || found?.id || '';
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
          throw new Error(t('components.quizComponent.noQuizFound'));
        }
      } catch (error) {
        console.error(`${t('components.quizComponent.FailedToLoadQuiz')}:`, error);
        toast.error(t('components.quizComponent.FailedToLoadQuiz'));
        
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
      toast.error(t('components.quizComponent.PleaseAnswer'));
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
      toast.success(`${t('components.quizComponent.QuizSubmitted')} Score: ${scorePercentage}%`);
    } catch (error) {
      console.error(`${t('components.quizComponent.FailedToSubmitQuiz')}:`, error);
      toast.error(t('components.quizComponent.FailedToSubmitQuiz'));
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
      console.error(`${t('components.quizComponent.FailedToStart')}:`, error);
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
        <span className="ml-3 text-slate-600">{t('components.quizComponent.loadingQuiz')}</span>
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
          <h3 className="text-3xl font-bold text-slate-900 mb-2">{t('components.quizComponent.quizCompleted')}</h3>
          <p className={`text-lg font-medium ${
            passed ? 'text-green-600' : 'text-red-600'
          }`}>
            {passed ? `${t('components.quizComponent.Excellent')}` : `${t('components.quizComponent.Keep')}`}
          </p>
          <p className="text-slate-600 mt-2">
            {t('components.quizComponent.YouGot', {count: correctCount, value: questions.length})}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-slate-600 mb-2">
            <span>{t('components.quizComponent.YourScore')}</span>
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
                <div className="font-medium text-slate-800 mb-2 prose max-w-none">
                  <ReactMarkdown
                    components={{
                      code({ className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <SyntaxHighlighter style={oneDark as any} language={match[1]} PreTag="div" {...props}>
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {`${index + 1}. ${q.text}`}
                  </ReactMarkdown>
                </div>
                <p className="text-sm text-slate-600 mb-1">
                  <span className="font-medium">{t('components.quizComponent.YourAnswer')}:</span> {
                    q.options.find(opt => opt.id === selectedAnswers[q.id])?.text || 'Not answered'
                  }
                </p>
                {!isCorrect && (
                  <p className="text-sm text-green-700 mb-1">
                    <span className="font-medium">{t('components.quizComponent.CorrectAnswer')}:</span> {
                      q.options.find(opt => opt.id === q.correctOptionId)?.text
                    }
                  </p>
                )}
                {q.explanation && (
                  <div className="text-xs text-slate-700 mt-3 p-3 bg-white/70 rounded border border-slate-200">
                    <div className="font-semibold mb-1">💡 {t('components.quizComponent.Explanation') || 'Explanation'}</div>
                    <ReactMarkdown
                      components={{
                        code({ className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return match ? (
                            <SyntaxHighlighter style={oneDark as any} language={match[1]} PreTag="div" {...props}>
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {q.explanation}
                    </ReactMarkdown>
                  </div>
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
            {t('components.quizComponent.RetakeQuiz')}
          </button>
          <button 
            onClick={() => onQuizComplete(scorePercentage)}
            className="btn-primary flex-1"
          >
            {t('components.quizComponent.ContinueLearning')}
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="p-8 bg-white rounded-xl shadow-lg border border-slate-200 text-center">
        <p className="text-slate-600">{t('components.quizComponent.NoQuizQuestions')}</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white rounded-xl shadow-lg border border-slate-200">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-slate-900">
            {quiz?.title || t('components.quizComponent.Quiz')}
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
          {t('components.quizComponent.Progress', {value: Math.round(((currentQuestionIndex + 1) / questions.length) * 100)})}
        </p>
      </div>

      {/* Question */}
      <div className="mb-8">
        <div className="mb-6">
          <div className="text-xl font-semibold text-slate-900 leading-relaxed prose max-w-none">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return match ? (
                    <SyntaxHighlighter style={oneDark as any} language={match[1]} PreTag="div" {...props}>
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
          {currentQuestion.text}
            </ReactMarkdown>
          </div>
        </div>
        
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
                <div className="flex items-start space-x-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${isSelected 
                      ? 'bg-white text-blue-600' 
                      : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100'}
                  `}>
                    {optionLetter}
                  </div>
                  <div className="flex-1 text-base prose max-w-none">
                    <ReactMarkdown
                      components={{
                        code({ className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return match ? (
                            <SyntaxHighlighter style={oneDark as any} language={match[1]} PreTag="div" {...props}>
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {option.text}
                    </ReactMarkdown>
                  </div>
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
          ← {t('components.quizComponent.Previous')}
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
            {t('components.quizComponent.SubmitQuiz')} →
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
            className="btn-primary"
          >
            {t('components.quizComponent.Next')} →
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizComponent;
