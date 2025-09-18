import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  LightBulbIcon, 
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts/AppContext';

interface SkillAnalysis {
  skill_name: string;
  current_level: number;
  improvement_rate: number;
  strength_areas: string[];
  improvement_areas: string[];
  recommended_actions: string[];
}

interface LearningPattern {
  pattern_type: string;
  description: string;
  frequency: string;
  peak_hours: number[];
  preferred_difficulty: string;
  completion_rate: number;
}

interface ProgressInsight {
  insight_type: string;
  title: string;
  description: string;
  impact: string;
  actionable: boolean;
  suggested_actions: string[];
}

interface DigitalTwinAnalysis {
  user_did: string;
  analysis_date: string;
  overall_progress: number;
  skill_analyses: SkillAnalysis[];
  learning_patterns: LearningPattern[];
  insights: ProgressInsight[];
  recommendations: string[];
  future_predictions: {
    skill_predictions: Record<string, any>;
    overall_progress: Record<string, any>;
    milestones: Array<{
      milestone: string;
      estimated_date: string;
      probability: number;
    }>;
  };
  comparison_with_peers: Record<string, any>;
}

const DigitalTwinAnalysisComponent: React.FC = () => {
  const { learnerProfile } = useAppContext();
  const [analysis, setAnalysis] = useState<DigitalTwinAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'patterns' | 'insights'>('overview');

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/ai/analysis/comprehensive', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setError('Failed to load analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'recommendation': return <LightBulbIcon className="h-5 w-5 text-blue-500" />;
      case 'trend': return <ArrowTrendingUpIcon className="h-5 w-5 text-purple-500" />;
      default: return <ChartBarIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'recommendation': return 'bg-blue-50 border-blue-200';
      case 'trend': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-400 to-blue-400 animate-bounce flex items-center justify-center shadow-lg">
              <span className="text-4xl">🤖</span>
            </div>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-pink-400 rounded-full animate-ping"></div>
            <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-3 right-6 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Analyzing your digital twin...</h3>
            <p className="text-gray-600 text-sm mt-1">Crunching skills, patterns and insights</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analysis</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalysis}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <ChartBarIcon className="h-8 w-8 text-purple-500" />
          <h2 className="text-2xl font-bold text-gray-900">
            Digital Twin Analysis
          </h2>
        </div>
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <ClockIcon className="h-4 w-4" />
            <span>Last updated {new Date(analysis.analysis_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <ArrowTrendingUpIcon className="h-4 w-4" />
            <span>{Math.round(analysis.overall_progress * 100)}% overall progress</span>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Overall Learning Progress</h3>
            <span className="text-2xl font-bold">{Math.round(analysis.overall_progress * 100)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 mb-4">
            <div 
              className="bg-white rounded-full h-3 transition-all duration-500"
              style={{ width: `${analysis.overall_progress * 100}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{analysis.skill_analyses.length}</div>
              <div className="text-sm opacity-90">Skills Tracked</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{analysis.learning_patterns.length}</div>
              <div className="text-sm opacity-90">Learning Patterns</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{analysis.insights.length}</div>
              <div className="text-sm opacity-90">Insights Generated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'skills', label: 'Skills', icon: AcademicCapIcon },
              { id: 'patterns', label: 'Patterns', icon: ArrowTrendingUpIcon },
              { id: 'insights', label: 'Insights', icon: LightBulbIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Future Predictions */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Future Predictions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Skill Predictions (3 months)</h4>
                <div className="space-y-3">
                  {Object.entries(analysis.future_predictions.skill_predictions).map(([skill, data]: [string, any]) => (
                    <div key={skill} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{skill}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {Math.round(data.current * 100)}% → {Math.round(data.predicted_3_months * 100)}%
                        </span>
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Upcoming Milestones</h4>
                <div className="space-y-3">
                  {analysis.future_predictions.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{milestone.milestone}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{milestone.estimated_date}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          milestone.probability > 0.7 ? 'bg-green-100 text-green-800' :
                          milestone.probability > 0.4 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(milestone.probability * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Peer Comparison */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Peer Comparison</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analysis.comparison_with_peers.percentile}%</div>
                <div className="text-sm text-gray-600">Percentile</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analysis.comparison_with_peers.above_average ? 'Above' : 'Below'}
                </div>
                <div className="text-sm text-gray-600">Average</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analysis.comparison_with_peers.comparison_metrics.learning_speed}
                </div>
                <div className="text-sm text-gray-600">Learning Speed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analysis.comparison_with_peers.comparison_metrics.consistency}
                </div>
                <div className="text-sm text-gray-600">Consistency</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <div className="space-y-4">
          {analysis.skill_analyses.map((skill, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">{skill.skill_name}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {Math.round(skill.current_level * 100)}%
                  </span>
                  <span className="text-sm text-gray-500">current level</span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-blue-500 rounded-full h-3 transition-all duration-500"
                  style={{ width: `${skill.current_level * 100}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Strengths</h4>
                  <ul className="space-y-1">
                    {skill.strength_areas.map((area, idx) => (
                      <li key={idx} className="text-sm text-green-600 flex items-center space-x-1">
                        <CheckCircleIcon className="h-3 w-3" />
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Areas for Improvement</h4>
                  <ul className="space-y-1">
                    {skill.improvement_areas.map((area, idx) => (
                      <li key={idx} className="text-sm text-orange-600 flex items-center space-x-1">
                        <ArrowTrendingUpIcon className="h-3 w-3" />
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Recommended Actions</h4>
                <div className="flex flex-wrap gap-2">
                  {skill.recommended_actions.map((action, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'patterns' && (
        <div className="space-y-4">
          {analysis.learning_patterns.map((pattern, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {pattern.pattern_type} Learning Pattern
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  pattern.completion_rate > 0.8 ? 'bg-green-100 text-green-800' :
                  pattern.completion_rate > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {Math.round(pattern.completion_rate * 100)}% completion rate
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{pattern.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 capitalize">{pattern.frequency}</div>
                  <div className="text-sm text-gray-600">Frequency</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 capitalize">{pattern.preferred_difficulty}</div>
                  <div className="text-sm text-gray-600">Preferred Difficulty</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {pattern.peak_hours.slice(0, 2).join(', ')}h
                  </div>
                  <div className="text-sm text-gray-600">Peak Hours</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-4">
          {analysis.insights.map((insight, index) => (
            <div key={index} className={`border rounded-lg p-6 ${getInsightColor(insight.insight_type)}`}>
              <div className="flex items-start space-x-3">
                {getInsightIcon(insight.insight_type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(insight.impact)}`}>
                      {insight.impact} impact
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{insight.description}</p>
                  
                  {insight.actionable && insight.suggested_actions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Suggested Actions:</h4>
                      <ul className="space-y-1">
                        {insight.suggested_actions.map((action, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-center space-x-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      <div className="mt-6 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start space-x-3">
              <LightBulbIcon className="h-5 w-5 text-blue-500 mt-0.5" />
              <span className="text-sm text-gray-700">{recommendation}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DigitalTwinAnalysisComponent;
