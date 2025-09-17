// export default AiTutorPage;
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sendMessageToGemini, startChatSession } from '../services/geminiService';
import { ChatMessage } from '../types';
import {
  PaperAirplaneIcon,
  PlusCircleIcon,
  TrashIcon,
  LightBulbIcon,
  CodeBracketIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts/AppContext';
import FeatureAccessGate from '../components/FeatureAccessGate';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getCurrentVietnamTimeISO } from '../utils/dateUtils';
import { useTranslation } from '../src/hooks/useTranslation';

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
  const [isNewSession, setIsNewSession] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sample conversation tree data
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
      <div className="flex h-[calc(100vh-100px)] max-w-7xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        {/* Conversation Tree Sidebar */}
        <div className="hidden lg:block w-1/4 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold text-lg mb-4 text-gray-800 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              Conversation Topics
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Explore common questions and learning paths
            </p>

            <div className="space-y-2">
              {conversationTree.map((node) => (
                <div key={node.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    className="w-full p-3 text-left font-medium text-gray-800 hover:bg-gray-100 flex items-center justify-between"
                    onClick={() => toggleNodeExpansion(node.id)}
                  >
                    <span>{node.question}</span>
                    {node.expanded ? (
                      <ChevronDownIcon className="w-4 h-4" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4" />
                    )}
                  </button>

                  {node.expanded && (
                    <div className="px-3 pb-2">
                      {node.responses.map((response) => (
                        <button
                          key={response.id}
                          className="block w-full text-left p-2 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700 rounded-md transition-colors truncate"
                          onClick={() => handleSuggestionClick(response.text)}
                          title={response.text}
                        >
                          {response.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 bg-sky-50 rounded-lg border border-sky-200">
              <h3 className="font-medium text-sky-800 mb-2 flex items-center gap-2">
                <LightBulbIcon className="w-4 h-4" />
                Pro Tip
              </h3>
              <p className="text-sm text-sky-700">
                Use the conversation tree to explore related topics and build upon your learning journey.
              </p>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-col flex-1">
          {/* Header */}
          <header className="bg-gradient-to-r from-sky-600 to-sky-500 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-full">
                <ChatBubbleLeftRightIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">AI Tutor (Gemini)</h1>
                <p className="text-sm opacity-90">Personalized Learning Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearChat}
                className="flex items-center gap-1 text-sm bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                title="Start new conversation"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span className="hidden sm:inline">New Chat</span>
              </button>
              <div className="h-6 w-px bg-white/40"></div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Online</span>
              </div>
            </div>
          </header>

          {/* Chat area */}
          <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100">
            {messages.length === 1 && (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md border border-gray-200">
                  <div className="bg-sky-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-sky-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Hello, {learnerProfile?.name || 'Learner'}!</h2>
                  <p className="text-gray-600 mb-4">I'm your AI tutor. How can I help you with your learning today?</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                    {quickSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setInput(suggestion.text)}
                        className="flex items-center gap-2 text-left p-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg text-sm text-sky-700 transition-colors"
                      >
                        {suggestion.icon}
                        <span className="flex-1">{suggestion.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`relative group max-w-lg lg:max-w-xl px-4 py-3 rounded-2xl shadow transition-all duration-300 ${msg.sender === 'user'
                    ? 'bg-sky-500 text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    {msg.sender === 'ai' && (
                      <div className="bg-sky-100 p-1.5 rounded-full flex-shrink-0 mt-0.5">
                        <ChatBubbleLeftRightIcon className="w-4 h-4 text-sky-600" />
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeId = `code-${msg.id}-${Math.random().toString(36).substring(7)}`;

                            if (!inline && match) {
                              const codeText = String(children).replace(/\n$/, '');
                              return (
                                <div className="relative my-2 rounded-md overflow-hidden">
                                  <div className="flex justify-between items-center bg-gray-800 text-gray-200 px-3 py-1 text-xs">
                                    <span>{match[1]}</span>
                                    <button
                                      onClick={() => handleCopyCode(codeText, codeId)}
                                      className="flex items-center gap-1 hover:text-white transition-colors"
                                    >
                                      {copiedCodeId === codeId ? (
                                        <CheckIcon className="w-4 h-4 text-green-400" />
                                      ) : (
                                        <ClipboardDocumentIcon className="w-4 h-4" />
                                      )}
                                      {copiedCodeId === codeId ? 'Copied!' : 'Copy'}
                                    </button>
                                  </div>
                                  <SyntaxHighlighter
                                    style={dracula as any}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                    customStyle={{ margin: 0, borderRadius: '0 0 0.375rem 0.375rem' }}
                                  >
                                    {codeText}
                                  </SyntaxHighlighter>
                                </div>
                              );
                            } else {
                              return (
                                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                  {children}
                                </code>
                              );
                            }
                          },
                        }}
                      >
                        {msg.text}
                      </Markdown>
                    </div>
                    {msg.sender === 'user' && (
                      <div className="bg-sky-600 p-1.5 rounded-full flex-shrink-0 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-2 ${msg.sender === 'user' ? 'text-sky-200' : 'text-gray-400'
                      }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center justify-start p-4">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-gray-600 text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="💡 Ask about Python, concepts, or paste code... (Shift+Enter for new line)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-shadow shadow-sm resize-none min-h-[44px] max-h-32"
                  disabled={isLoading}
                  rows={1}
                />
                {input.length > 0 && (
                  <button
                    onClick={() => setInput('')}
                    className="absolute right-2 bottom-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={handleSendMessage}
                disabled={isLoading || input.trim() === ''}
                className="bg-sky-500 hover:bg-sky-600 text-white p-3 rounded-lg disabled:opacity-50 transition-all shadow hover:shadow-md flex items-center justify-center h-11 w-11 flex-shrink-0"
                aria-label={t('pages.aiTutorPage.sendMessage')}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <PaperAirplaneIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Quick suggestion buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion.text)}
                  disabled={isLoading}
                  className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full text-gray-600 transition flex items-center gap-1 disabled:opacity-50"
                >
                  {suggestion.icon}
                  <span>{suggestion.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FeatureAccessGate>
  );
};

export default AiTutorPage;