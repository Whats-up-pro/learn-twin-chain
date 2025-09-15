import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sendMessageToGemini, startChatSession } from '../services/geminiService';
import { ChatMessage } from '../types';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts/AppContext';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown (tables, etc.)
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getCurrentVietnamTimeISO } from '../utils/dateUtils';
import { useTranslation } from '../src/hooks/useTranslation';

const AiTutorPage: React.FC = () => {
  const { t } = useTranslation();
  const { digitalTwin, updateBehavior, learnerProfile } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

 useEffect(() => {
    startChatSession(digitalTwin); // Initialize or update chat session with current DT context
    setMessages([
      { 
        id: 'initial-ai-message', 
        sender: 'ai', 
        text: `${t('pages.aiTutorPage.hello')} ${learnerProfile?.name || 'User'}! ${t('pages.aiTutorPage.imYourAiTutor')}`, 
        timestamp: new Date() 
      }
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digitalTwin.learnerDid]); // Re-initialize if learner changes, though unlikely in this app structure

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponseText = await sendMessageToGemini(userMessage.text, digitalTwin);
      const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'ai', text: aiResponseText, timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
      updateBehavior({
        lastLlmSession: getCurrentVietnamTimeISO(),
        mostAskedTopics: [...(digitalTwin.behavior.mostAskedTopics || []), ...input.toLowerCase().split(' ').filter(word => word.length > 3 && !['python', 'code', 'help'].includes(word))]
      });
    } catch (error) {
      console.error(t('pages.aiTutorPage.errorSendingMessage'), error);
      const errorMessage: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        text: t('pages.aiTutorPage.sorryIEncountered'),
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, updateBehavior, digitalTwin.behavior.mostAskedTopics]);

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] max-w-3xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
      <header className="bg-sky-600 text-white p-4 flex items-center space-x-2">
        <h1 className="text-xl font-semibold">AI Tutor (Gemini)</h1>
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
  );
};

export default AiTutorPage;
