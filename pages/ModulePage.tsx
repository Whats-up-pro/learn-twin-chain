import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { LearningModule, ModuleContentItem } from '../types';
import QuizComponent from '../components/QuizComponent';
import { LightBulbIcon, CodeBracketIcon, PlayCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { blockchainService } from '../services/blockchainService';
import { getCurrentVietnamTimeISO } from '../utils/dateUtils';
import { isYouTubeUrl, createYouTubeIframeProps } from '../utils/videoUtils';
import { useTranslation } from '../src/hooks/useTranslation';

const ModulePage: React.FC = () => {
  const { t } = useTranslation();
  const { moduleId } = useParams<{ moduleId: string }>();
  const { getModuleById, digitalTwin, updateKnowledge, updateBehavior, completeCheckpoint, mintNftForModule } = useAppContext();
  const [module, setModule] = useState<LearningModule | null | undefined>(undefined); // undefined for loading, null if not found
  const navigate = useNavigate();

  useEffect(() => {
    // Require wallet connection before accessing module
    (async () => {
      const isConnected = await blockchainService.checkWalletConnection();
      if (!isConnected) {
        toast.error(t('pages.modulePage.pleaseConnectYourMetaMaskWalletBeforeLearning'));
        navigate('/dashboard');
        return;
      }
    })();
    if (moduleId) {
      const foundModule = getModuleById(moduleId);
      setModule(foundModule);
      if(foundModule) {
        updateBehavior({lastLlmSession: getCurrentVietnamTimeISO()});
      }
    }
  }, [moduleId, getModuleById, updateBehavior]);

  const handleQuizComplete = (score: number) => {
    console.log('🎯 ' + t('pages.modulePage.quizCompletedWithScore'), score);
    
    // Calculate knowledge based on quiz score
    let newKnowledge: number;
    
    if (score >= 80) {
      // If score is 80% or higher, mark module as completed (100%)
      newKnowledge = 1.0;
    } else if (score >= 60) {
      // If score is 60-79%, set knowledge to 70%
      newKnowledge = 0.7;
    } else if (score >= 40) {
      // If score is 40-59%, set knowledge to 50%
      newKnowledge = 0.5;
    } else {
      // If score is below 40%, set knowledge to 30%
      newKnowledge = 0.3;
    }
    
    // Ensure new knowledge is not lower than current knowledge
    const currentKnowledge = digitalTwin.knowledge[module?.title || ''] || 0;
    newKnowledge = Math.max(newKnowledge, currentKnowledge);
    
    console.log('📊 ' + t('pages.modulePage.KnowledgeUpdate', {
      module: module?.title,
      score,
      currentKnowledge,
      newKnowledge,
      percentage: Math.round(newKnowledge * 100)
    }));
    
    // Update knowledge
    updateKnowledge({
      [module.title]: newKnowledge
    });

    // Create checkpoint for this module completion
    if (module) {
      completeCheckpoint({
        module: module.title,
        moduleId: module.id,
        moduleName: module.title,
        completedAt: getCurrentVietnamTimeISO(),
        score: score
      });

      // If module is completed (score >= 80%), mint NFT
      if (score >= 80) {
        setTimeout(async () => {
          try {
            await mintNftForModule(module.id, module.title, score);
          } catch (error) {
            console.error(t('pages.modulePage.ErrorMintingNFT'), error);
          }
        }, 1000); // Small delay to ensure checkpoint is created first
      }
    }

    // Update behavior
    updateBehavior({
      quizAccuracy: (digitalTwin.behavior.quizAccuracy + (score / 100)) / 2,
      lastLlmSession: getCurrentVietnamTimeISO()
    });

    if (score >= 80) {
      toast.success(t('pages.modulePage.moduleCompleted', { score: score }));
    } else {
      toast.success(t('pages.modulePage.quizCompleted', { score: score }));
    }
    
    // Navigate back to dashboard after a short delay
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  if (module === undefined) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      <span className="ml-2 text-gray-600">{t('pages.modulePage.LoadingModule')}</span>
    </div>;
  }

  if (!module) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">{t('pages.modulePage.ModuleNotFound')}</h2>
        <p className="text-gray-600 mb-6">{t('pages.modulePage.TheModuleYouAreLookingForDoesNotExistOrHasBeenRemoved')}</p>
        <Link to="/dashboard" className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
          {t('pages.modulePage.BackToDashboard')}
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
      case 'video': {
        // Use our improved video utility functions
        if (isYouTubeUrl(item.value)) {
          return (
            <div key={index} className="my-4 aspect-video w-full overflow-hidden rounded-xl shadow">
              <iframe
                {...createYouTubeIframeProps(
                  item.value,
                  `Video ${index + 1}`,
                  "w-full h-full"
                )}
              />
            </div>
          );
        }
        return (
          <video key={index} controls className="my-4 w-full rounded-xl shadow">
            <source src={item.value} />
            {t('pages.modulePage.yourBrowserDoesNotSupportTheVideoTag')}
          </video>
        );
      }
      case 'video_placeholder':
         return (
          <div key={index} className="my-4 p-4 border border-dashed border-gray-400 rounded-lg bg-gray-50 text-center">
            <PlayCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">{t('pages.modulePage.Video')}: {item.value}</p>
            <p className="text-xs text-gray-400">{t('pages.modulePage.VideoPlayer')}</p>
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
            <p className="text-sm text-gray-500">{t('pages.modulePage.EstimatedTime')}: {module.estimatedTime}</p>
            <Link to="/dashboard" className="text-sm text-sky-600 hover:text-sky-800 transition-colors">
              &larr; {t('pages.modulePage.BackToDashboard')}
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <LightBulbIcon className="h-7 w-7 text-yellow-500 mr-2" />
          {t('pages.modulePage.LearningContent')}
        </h2>
        {module.content.map(renderContentItem)}
      </section>

      {module.quiz && module.quiz.length > 0 && (
        <section className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
            <CodeBracketIcon className="h-7 w-7 text-purple-500 mr-2" />
            {t('pages.modulePage.TestYourKnowledge')}
          </h2>
          <QuizComponent questions={module.quiz} onQuizComplete={handleQuizComplete} />
        </section>
      )}
      <div className="text-center mt-8">
        <button 
          onClick={() => navigate('/tutor')}
          className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg shadow-md hover:shadow-lg"
        >
          {t('pages.modulePage.NeedHelp')}
        </button>
      </div>
    </div>
  );
};

export default ModulePage;