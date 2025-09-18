// export default AiTutorPage;
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sendMessageToGemini, startChatSession } from '../services/geminiService';
import { ChatMessage } from '../types';
import {
  PaperAirplaneIcon,
  LightBulbIcon,
  CodeBracketIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts/AppContext';
import FeatureAccessGate from '../components/FeatureAccessGate';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getCurrentVietnamTimeISO } from '../utils/dateUtils';
import { useTranslation } from '../src/hooks/useTranslation';
import AIRoadmapComponent from '../components/AIRoadmapComponent';
import DigitalTwinAnalysisComponent from '../components/DigitalTwinAnalysisComponent';
import AILearningCompanionComponent from '../components/AILearningCompanionComponent';

// Interface for conversation tree nodes
interface ConversationNode {
  id: string;
  question: string;
  responses: ConversationResponse[];
  expanded?: boolean;
}

interface ConversationResponse {
  id: string;
  text: string;
  nextNodeId?: string;
}

const AiTutorPage: React.FC = () => {
  const { t } = useTranslation();
  const { digitalTwin, updateBehavior, learnerProfile } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'roadmap' | 'analysis' | 'companion'>('roadmap');
  const [isNewSession, setIsNewSession] = useState(true);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sample conversation tree data (unused but kept for future implementation)
  const [conversationTree, setConversationTree] = useState<ConversationNode[]>([
    {
      id: '1',
      question: 'Python Basics',
      expanded: true,
      responses: [
        { id: '1-1', text: 'What is Python?', nextNodeId: '2' },
        { id: '1-2', text: 'How to install Python?', nextNodeId: '3' },
        { id: '1-3', text: 'Python syntax basics', nextNodeId: '4' },
      ]
    },
    {
      id: '2',
      question: 'Data Structures',
      expanded: false,
      responses: [
        { id: '2-1', text: 'What is a list?', nextNodeId: '5' },
        { id: '2-2', text: 'How to use dictionaries?', nextNodeId: '6' },
        { id: '2-3', text: 'Tuple vs List differences', nextNodeId: '7' },
      ]
    },
    {
      id: '3',
      question: 'Control Flow',
      expanded: false,
      responses: [
        { id: '3-1', text: 'How to use if statements?', nextNodeId: '8' },
        { id: '3-2', text: 'What are for loops?', nextNodeId: '9' },
        { id: '3-3', text: 'While loop examples', nextNodeId: '10' },
      ]
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    startChatSession(digitalTwin);
    setMessages([
      {
        id: 'initial-ai-message',
        sender: 'ai',
        text: `${t('pages.aiTutorPage.hello')} ${learnerProfile?.name || 'User'}! ${t('pages.aiTutorPage.imYourAiTutor')}`,
        timestamp: new Date(),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digitalTwin.learnerDid, isNewSession]);

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const aiResponseText = await sendMessageToGemini(userMessage.text, digitalTwin);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      updateBehavior({
        lastLlmSession: getCurrentVietnamTimeISO(),
        mostAskedTopics: [
          ...(digitalTwin.behavior.mostAskedTopics || []),
          ...input
            .toLowerCase()
            .split(' ')
            .filter((word) => word.length > 3 && !['python', 'code', 'help'].includes(word)),
        ],
      });
    } catch (error) {
      console.error(t('pages.aiTutorPage.errorSendingMessage'), error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: t('pages.aiTutorPage.sorryIEncountered'),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, updateBehavior, digitalTwin.behavior.mostAskedTopics]);

  const handleClearChat = () => {
    setMessages([
      {
        id: 'initial-ai-message',
        sender: 'ai',
        text: `${t('pages.aiTutorPage.hello')} ${learnerProfile?.name || 'User'}! ${t('pages.aiTutorPage.imYourAiTutor')}`,
        timestamp: new Date(),
      },
    ]);
    setIsNewSession(!isNewSession);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) {
        handleSendMessage();
      }
    }
  };

  const toggleNodeExpansion = (nodeId: string) => {
    setConversationTree(prev =>
      prev.map(node =>
        node.id === nodeId
          ? { ...node, expanded: !node.expanded }
          : node
      )
    );
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    // Auto-focus on input after selecting a suggestion
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const quickSuggestions = [
    { text: 'Explain loops in Python', icon: <CodeBracketIcon className="w-4 h-4" /> },
    { text: 'How to debug this code?', icon: <LightBulbIcon className="w-4 h-4" /> },
    { text: 'Give me a coding exercise', icon: <AcademicCapIcon className="w-4 h-4" /> },
    { text: 'Explain this concept simply', icon: <ChatBubbleLeftRightIcon className="w-4 h-4" /> },
  ];

  return (
    <FeatureAccessGate feature="ai_queries" requiredPlan="basic">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Tutor Hub</h1>
          <p className="text-gray-600">
            Your comprehensive AI-powered learning companion with personalized roadmaps, analysis, and interactive sessions
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'roadmap', label: 'Learning Roadmap', icon: '🗺️' },
                { id: 'analysis', label: 'Digital Twin Analysis', icon: '📊' },
                { id: 'companion', label: 'AI Learning Companion', icon: '🤖' },
                { id: 'chat', label: 'AI Chat', icon: '💬' }
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
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            <AIRoadmapComponent />
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <DigitalTwinAnalysisComponent />
          </div>
        )}

        {activeTab === 'companion' && (
          <div className="space-y-6">
            <AILearningCompanionComponent />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-300px)] max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
            <header className="bg-sky-600 text-white p-4 flex items-center space-x-2">
              <h1 className="text-xl font-semibold">AI Chat Assistant</h1>
            </header>
            
            <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-lg lg:max-w-xl px-4 py-2 rounded-xl shadow ${
                      msg.sender === 'user' 
                      ? 'bg-sky-500 text-white' 
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}>
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={dracula as any}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
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
                      {msg.text}
                    </Markdown>
                    <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-sky-200' : 'text-gray-400'}`}>
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600">AI is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                  placeholder="Ask about Python, concepts, or code..."
                  className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-shadow"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || input.trim() === ''}
                  className="bg-sky-500 hover:bg-sky-600 text-white p-3 rounded-lg disabled:opacity-50 transition-colors shadow hover:shadow-md"
                  aria-label={t('pages.aiTutorPage.sendMessage')}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <PaperAirplaneIcon className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureAccessGate>
  );
};

export default AiTutorPage;