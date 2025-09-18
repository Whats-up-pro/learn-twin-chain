import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon, 
  PlayIcon, 
  CheckCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts/AppContext';

interface StudySession {
  session_id: string;
  topic: string;
  difficulty: string;
  estimated_duration: number;
  learning_objectives: string[];
  content_type: string;
  adaptive_questions: Array<{
    question_id: string;
    question_text: string;
    question_type: string;
    options?: string[];
    correct_answer: string;
    explanation: string;
    difficulty_level: string;
    learning_objective: string;
    hints: string[];
  }>;
  personalized_feedback: string;
  next_recommendations: string[];
}

interface LearningCompanion {
  companion_id: string;
  personality: string;
  learning_style: string;
  current_focus: string;
  session_history: StudySession[];
  user_preferences: Record<string, any>;
}

const AILearningCompanionComponent: React.FC = () => {
  const { learnerProfile } = useAppContext();
  const [companion, setCompanion] = useState<LearningCompanion | null>(null);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionProgress, setSessionProgress] = useState(0);

  const startNewSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/ai/companion/start-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          topic: companion?.current_focus || 'Python Programming',
          difficulty_preference: 'adaptive',
          session_type: 'mixed',
          duration: 30,
          learning_goals: ['Improve problem-solving skills', 'Learn new concepts']
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      const data = await response.json();
      setCompanion(data.companion);
      setCurrentSession(data.current_session);
      setSessionStarted(true);
      setCurrentQuestionIndex(0);
      setSessionProgress(0);
    } catch (err) {
      console.error('Error starting session:', err);
      setError('Failed to start learning session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentSession || !userAnswer.trim()) return;

    try {
      const response = await fetch('/api/v1/ai/companion/answer-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          session_id: currentSession.session_id,
          question_id: currentSession.adaptive_questions[currentQuestionIndex].question_id,
          answer: userAnswer
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const data = await response.json();
      setShowFeedback(true);
      
      // Move to next question or complete session
      if (currentQuestionIndex < currentSession.adaptive_questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setUserAnswer('');
          setShowFeedback(false);
          setSessionProgress(((currentQuestionIndex + 1) / currentSession.adaptive_questions.length) * 100);
        }, 3000);
      } else {
        // Session completed
        setTimeout(() => {
          setSessionStarted(false);
          setCurrentSession(null);
          setCurrentQuestionIndex(0);
          setSessionProgress(0);
        }, 3000);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer. Please try again.');
    }
  };

  const getPersonalityColor = (personality: string) => {
    switch (personality) {
      case 'encouraging': return 'bg-green-100 text-green-800';
      case 'challenging': return 'bg-red-100 text-red-800';
      case 'patient': return 'bg-blue-100 text-blue-800';
      case 'analytical': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <SparklesIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={startNewSession}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <SparklesIcon className="h-8 w-8 text-purple-500" />
          <h2 className="text-2xl font-bold text-gray-900">
            AI Learning Companion
          </h2>
        </div>
        <p className="text-gray-600">
          Your personalized AI tutor that adapts to your learning style and pace
        </p>
      </div>

      {!sessionStarted ? (
        /* Session Start Screen */
        <div className="text-center">
          {companion && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white mb-4">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <ChatBubbleLeftRightIcon className="h-8 w-8" />
                  <h3 className="text-xl font-semibold">Your AI Companion</h3>
                </div>
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <span className={`px-3 py-1 rounded-full ${getPersonalityColor(companion.personality)}`}>
                    {companion.personality} personality
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full">
                    {companion.learning_style} learner
                  </span>
                </div>
              </div>
              
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-2">
                  <strong>Current Focus:</strong> {companion.current_focus}
                </p>
                <p className="text-sm text-gray-500">
                  Ready to start a personalized learning session?
                </p>
              </div>
            </div>
          )}

          <button
            onClick={startNewSession}
            disabled={loading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 mx-auto"
          >
            <PlayIcon className="h-6 w-6" />
            <span className="text-lg font-semibold">Start Learning Session</span>
          </button>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <AcademicCapIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900">Adaptive Learning</h4>
              <p className="text-sm text-gray-600">Questions adjust to your level</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <LightBulbIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900">Personalized Feedback</h4>
              <p className="text-sm text-gray-600">Tailored to your learning style</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <TrophyIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900">Progress Tracking</h4>
              <p className="text-sm text-gray-600">Monitor your improvement</p>
            </div>
          </div>
        </div>
      ) : (
        /* Active Session */
        <div>
          {currentSession && (
            <>
              {/* Session Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{currentSession.topic}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getDifficultyColor(currentSession.difficulty)}`}>
                        {currentSession.difficulty}
                      </span>
                      <span className="text-sm text-gray-600">
                        {currentSession.estimated_duration} minutes
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Progress</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {Math.round(sessionProgress)}%
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full h-2 transition-all duration-500"
                    style={{ width: `${sessionProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Learning Objectives */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Learning Objectives</h4>
                <div className="flex flex-wrap gap-2">
                  {currentSession.learning_objectives.map((objective, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {objective}
                    </span>
                  ))}
                </div>
              </div>

              {/* Current Question */}
              {currentSession.adaptive_questions[currentQuestionIndex] && (
                <div className="mb-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Question {currentQuestionIndex + 1} of {currentSession.adaptive_questions.length}
                      </h4>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getDifficultyColor(currentSession.adaptive_questions[currentQuestionIndex].difficulty_level)}`}>
                        {currentSession.adaptive_questions[currentQuestionIndex].difficulty_level}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-4">
                      {currentSession.adaptive_questions[currentQuestionIndex].question_text}
                    </p>

                    {/* Answer Input */}
                    <div className="mb-4">
                      <textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        rows={4}
                      />
                    </div>

                    <button
                      onClick={submitAnswer}
                      disabled={!userAnswer.trim()}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Answer
                    </button>
                  </div>
                </div>
              )}

              {/* Feedback */}
              {showFeedback && (
                <div className="mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <h4 className="font-semibold text-green-800">Feedback</h4>
                    </div>
                    <p className="text-green-700 mb-3">
                      {currentSession.adaptive_questions[currentQuestionIndex]?.explanation}
                    </p>
                    <p className="text-sm text-green-600 italic">
                      {currentSession.personalized_feedback}
                    </p>
                  </div>
                </div>
              )}

              {/* Next Recommendations */}
              {currentQuestionIndex === currentSession.adaptive_questions.length - 1 && showFeedback && (
                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-800 mb-3">Next Steps</h4>
                    <ul className="space-y-2">
                      {currentSession.next_recommendations.map((recommendation, index) => (
                        <li key={index} className="text-blue-700 flex items-center space-x-2">
                          <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                          <span>{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Session History */}
      {companion && companion.session_history.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h3>
          <div className="space-y-3">
            {companion.session_history.slice(-3).map((session, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{session.topic}</h4>
                  <p className="text-sm text-gray-600">
                    {session.estimated_duration} minutes • {session.difficulty}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AILearningCompanionComponent;
