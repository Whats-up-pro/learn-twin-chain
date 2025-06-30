import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { LearningModule, ModuleContentItem } from '../types';
import QuizComponent from '../components/QuizComponent';
import { LightBulbIcon, CodeBracketIcon, PlayCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getCurrentVietnamTimeISO } from '../utils/dateUtils';

const ModulePage: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { getModuleById, digitalTwin, updateKnowledge, updateBehavior, completeCheckpoint, mintNftForModule } = useAppContext();
  const [module, setModule] = useState<LearningModule | null | undefined>(undefined); // undefined for loading, null if not found
  const navigate = useNavigate();

  useEffect(() => {
    if (moduleId) {
      const foundModule = getModuleById(moduleId);
      setModule(foundModule);
      if(foundModule) {
        updateBehavior({lastLlmSession: getCurrentVietnamTimeISO()}); // Update interaction log
      }
    }
  }, [moduleId, getModuleById, updateBehavior]);

  const handleQuizComplete = (score: number) => {
    if (!module) return;

    // Set knowledge to 1.0 (100%) when quiz is completed, regardless of score
    const newKnowledge = 1.0;
    
    // Update knowledge
    updateKnowledge({
      [module.title]: newKnowledge
    });

    // Update behavior
    updateBehavior({
      quizAccuracy: (digitalTwin.behavior.quizAccuracy + (score / 100)) / 2,
      lastLlmSession: getCurrentVietnamTimeISO()
    });

    // Mark module as completed by creating a checkpoint
    completeCheckpoint({
      module: module.title,
      moduleId: module.id,
      moduleName: module.title,
      score: score,
      completedAt: getCurrentVietnamTimeISO()
    });

    // Automatically mint NFT for module completion
    mintNftForModule(module.id, module.title);

    toast.success(`Quiz completed! Score: ${score}% - Module marked as completed! NFT minted!`);
    
    // Navigate back to dashboard after a short delay
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  if (module === undefined) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      <span className="ml-2 text-gray-600">Loading module...</span>
    </div>;
  }

  if (!module) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Module Not Found</h2>
        <p className="text-gray-600 mb-6">The module you are looking for does not exist or could not be loaded.</p>
        <Link to="/dashboard" className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const renderContentItem = (item: ModuleContentItem, index: number) => {
    switch (item.type) {
      case 'text':
        return <p key={index} className="text-gray-700 leading-relaxed my-4 whitespace-pre-line">{item.value}</p>;
      case 'code':
        return (
          <div key={index} className="my-4 bg-gray-900 text-white p-4 rounded-md shadow-md overflow-x-auto">
            <pre><code className={`language-${item.language || 'plaintext'}`}>{item.value}</code></pre>
          </div>
        );
      case 'image':
        return <img key={index} src={item.value} alt={`Module content ${index + 1}`} className="my-4 rounded-lg shadow-md max-w-full h-auto mx-auto" />;
      case 'video_placeholder':
         return (
          <div key={index} className="my-4 p-4 border border-dashed border-gray-400 rounded-lg bg-gray-50 text-center">
            <PlayCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Video: {item.value}</p>
            <p className="text-xs text-gray-400">(Video player not implemented in this demo)</p>
          </div>
        );
      default:
        return null;
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-sky-700">{module.title}</h1>
            <p className="text-gray-600 mt-1">{module.description}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Estimated Time: {module.estimatedTime}</p>
            <Link to="/dashboard" className="text-sm text-sky-600 hover:text-sky-800 transition-colors">
              &larr; Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <LightBulbIcon className="h-7 w-7 text-yellow-500 mr-2" />
          Learning Content
        </h2>
        {module.content.map(renderContentItem)}
      </section>

      {module.quiz && module.quiz.length > 0 && (
        <section className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
            <CodeBracketIcon className="h-7 w-7 text-purple-500 mr-2" />
            Test Your Knowledge
          </h2>
          <QuizComponent questions={module.quiz} onQuizComplete={handleQuizComplete} />
        </section>
      )}
      <div className="text-center mt-8">
        <button 
          onClick={() => navigate('/tutor')}
          className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg shadow-md hover:shadow-lg"
        >
          Need help? Ask the AI Tutor!
        </button>
      </div>
    </div>
  );
};

export default ModulePage;