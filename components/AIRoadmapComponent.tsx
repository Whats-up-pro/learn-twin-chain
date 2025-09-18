import React, { useState, useEffect } from 'react';
import { 
  MapIcon, 
  ClockIcon, 
  AcademicCapIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts/AppContext';

interface RoadmapCheckpoint {
  id: string;
  title: string;
  completed: boolean;
}

interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  estimated_hours: number;
  prerequisites: string[];
  resources: Array<{ type: string; title: string; url: string }>;
  is_available: boolean;
  course_id?: string;
  status: string;
  checkpoints: RoadmapCheckpoint[];
}

interface LearningRoadmap {
  roadmap_id: string;
  program: string;
  total_steps: number;
  estimated_total_hours: number;
  difficulty_progression: string[];
  steps: RoadmapStep[];
  generated_at: string;
  personalized_for: string;
}

const AIRoadmapComponent: React.FC = () => {
  const { learnerProfile } = useAppContext();
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  useEffect(() => {
    generateRoadmap();
  }, [learnerProfile?.program]);

  const generateRoadmap = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/ai/roadmap/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          program: learnerProfile?.program || 'Computer Science',
          current_level: 'beginner',
          time_commitment: 'moderate'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate roadmap');
      }

      const data = await response.json();
      // Merge saved checkpoint completion from localStorage
      const rm: LearningRoadmap = data.roadmap;
      const saved = localStorage.getItem(`roadmap_checkpoints_${rm.roadmap_id}`);
      if (saved) {
        const map: Record<string, Record<string, boolean>> = JSON.parse(saved);
        rm.steps = rm.steps.map(step => ({
          ...step,
          checkpoints: step.checkpoints?.map(cp => ({
            ...cp,
            completed: Boolean(map[step.id]?.[cp.id])
          })) || []
        }));
      }
      setRoadmap(rm);
    } catch (err) {
      console.error('Error generating roadmap:', err);
      setError('Failed to generate roadmap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const persistCheckpoint = (roadmapId: string, stepId: string, cpId: string, completed: boolean) => {
    const key = `roadmap_checkpoints_${roadmapId}`;
    const saved = localStorage.getItem(key);
    const map: Record<string, Record<string, boolean>> = saved ? JSON.parse(saved) : {};
    map[stepId] = map[stepId] || {};
    map[stepId][cpId] = completed;
    localStorage.setItem(key, JSON.stringify(map));
  };

  const toggleCheckpoint = async (stepId: string, cpId: string) => {
    if (!roadmap) return;
    const updatedSteps = roadmap.steps.map(step => {
      if (step.id !== stepId) return step;
      const updatedCps = step.checkpoints.map(cp => cp.id === cpId ? { ...cp, completed: !cp.completed } : cp);
      return { ...step, checkpoints: updatedCps };
    });
    const updated = { ...roadmap, steps: updatedSteps };
    setRoadmap(updated);
    const cp = updatedSteps.find(s => s.id === stepId)!.checkpoints.find(c => c.id === cpId)!;
    persistCheckpoint(roadmap.roadmap_id, stepId, cpId, cp.completed);

    // If all checkpoints done, mark step complete via backend
    const stepAfter = updatedSteps.find(s => s.id === stepId)!;
    const allDone = stepAfter.checkpoints.length > 0 && stepAfter.checkpoints.every(c => c.completed);
    if (allDone) {
      try {
        await fetch(`/api/v1/ai/roadmap/${encodeURIComponent(roadmap.roadmap_id)}/step/${encodeURIComponent(stepId)}/complete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } catch (e) {
        // non-blocking
      }
    }
  };

  const calcStepProgress = (step: RoadmapStep) => {
    if (!step.checkpoints || step.checkpoints.length === 0) return 0;
    const done = step.checkpoints.filter(c => c.completed).length;
    return Math.round((done / step.checkpoints.length) * 100);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'skill': return <AcademicCapIcon className="h-5 w-5" />;
      case 'course': return <PlayCircleIcon className="h-5 w-5" />;
      case 'technology': return <MapIcon className="h-5 w-5" />;
      case 'certification': return <CheckCircleIcon className="h-5 w-5" />;
      default: return <MapIcon className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string, isAvailable: boolean) => {
    if (!isAvailable) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
    }
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'in_progress': return <PlayCircleIcon className="h-5 w-5 text-blue-500" />;
      default: return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          {/* Cute AI Brain Animation */}
          <div className="relative mb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center animate-bounce">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            {/* Floating particles */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-ping absolute -top-2 left-4"></div>
              <div className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-ping absolute -top-1 right-6 animation-delay-200"></div>
              <div className="w-1 h-1 bg-pink-300 rounded-full animate-ping absolute top-2 left-2 animation-delay-400"></div>
            </div>
          </div>
          
          {/* Loading Text with Typewriter Effect */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              <span className="inline-block animate-pulse">🤖</span> AI is crafting your roadmap...
            </h3>
            <p className="text-sm text-gray-600 animate-pulse">
              Analyzing your program and learning preferences
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-3 max-w-md mx-auto">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-gray-700">Analyzing your program</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center animate-pulse animation-delay-200">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-gray-700">Generating learning path</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-4 h-4 bg-purple-400 rounded-full flex items-center justify-center animate-pulse animation-delay-400">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-gray-700">Adding checkpoints & resources</span>
            </div>
          </div>

          {/* Animated Roadmap Preview */}
          <div className="mt-8 space-y-4">
            <div className="text-xs text-gray-500 mb-2">Preview of your roadmap:</div>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-purple-300 animate-pulse"></div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative flex items-center space-x-4 mb-4">
                  <div className="relative z-10 w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center animate-bounce" style={{animationDelay: `${i * 0.2}s`}}>
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <div className="flex-1 h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg animate-pulse" style={{animationDelay: `${i * 0.1}s`}}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Roadmap</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={generateRoadmap}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <MapIcon className="h-8 w-8 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900">
            Learning Roadmap: {roadmap.program}
          </h2>
        </div>
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <ClockIcon className="h-4 w-4" />
            <span>{roadmap.estimated_total_hours} hours total</span>
          </div>
          <div className="flex items-center space-x-1">
            <AcademicCapIcon className="h-4 w-4" />
            <span>{roadmap.total_steps} steps</span>
          </div>
          <div className="text-xs text-gray-500">
            Generated {new Date(roadmap.generated_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Roadmap Path */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-400 to-blue-600"></div>
        
        {/* Steps */}
        <div className="space-y-8">
          {roadmap.steps.map((step, index) => (
            <div key={step.id} className="relative flex items-start space-x-6 group">
              {/* Step Number & Icon */}
              <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-white border-4 border-blue-500 rounded-full shadow-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full text-white font-bold text-sm">
                  {index + 1}
                </div>
              </div>

              {/* Step Content */}
              <div className="flex-1 bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 transition-transform group-hover:shadow-md">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-blue-500">
                      {getTypeIcon(step.type)}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {step.title}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(step.status, step.is_available)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(step.difficulty)}`}>
                      {step.difficulty}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{step.description}</p>

                {/* Collapsible details toggle */}
                <div className="mb-3">
                  <button
                    onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {expandedStep === step.id ? 'Hide details' : 'Show details'}
                  </button>
                </div>

                {expandedStep === step.id && (
                  <div className="animate-fade-in">
                    {/* Step Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4" />
                        <span>{step.estimated_hours} hours</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <AcademicCapIcon className="h-4 w-4" />
                        <span className="capitalize">{step.type}</span>
                      </div>
                    </div>

                    {/* Prerequisites */}
                    {step.prerequisites.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Prerequisites:</h4>
                        <div className="flex flex-wrap gap-2">
                          {step.prerequisites.map((prereq, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                              {prereq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resources */}
                    {step.resources.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Resources:</h4>
                        <div className="space-y-2">
                          {step.resources.map((resource, idx) => (
                            <div key={idx} className="flex items-center space-x-2 text-sm">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs capitalize">
                                {resource.type}
                              </span>
                              <span className="text-gray-600">{resource.title}</span>
                              {resource.url !== '#' && (
                                <a 
                                  href={resource.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-600"
                                >
                                  View →
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Availability Notice */}
                {!step.is_available && (
                  <div className="flex items-center space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                    <span className="text-sm text-orange-700">
                      Course coming soon! Resources available for self-study.
                    </span>
                  </div>
                )}

                {/* Checkpoints + Progress */}
                {step.checkpoints && step.checkpoints.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Checkpoints</h4>
                      <span className="text-xs text-gray-500">{calcStepProgress(step)}% complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${calcStepProgress(step)}%` }}
                      />
                    </div>
                    <div className="space-y-2">
                      {step.checkpoints.map((cp) => (
                        <label key={cp.id} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cp.completed}
                            onChange={() => toggleCheckpoint(step.id, cp.id)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className={`text-sm ${cp.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{cp.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="mt-4">
                  {step.is_available ? (
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
                      <PlayCircleIcon className="h-4 w-4" />
                      <span>Start Learning</span>
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed flex items-center space-x-2"
                    >
                      <ClockIcon className="h-4 w-4" />
                      <span>Available Soon</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-blue-700">
            <strong>Personalized for:</strong> {learnerProfile?.name || 'You'}
          </div>
          <button
            onClick={generateRoadmap}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Regenerate Roadmap
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIRoadmapComponent;
