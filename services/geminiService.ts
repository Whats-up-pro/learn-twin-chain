import { GoogleGenAI } from "@google/genai";
import { DigitalTwin } from '../types';
import { GEMINI_MODEL_NAME } from '../constants';


// Load API key from Vite environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("🔑 GEMINI API_KEY is not set.");
  console.log("📝 Please create .env.local file with: VITE_GEMINI_API_KEY=your_actual_api_key");
  console.log("🌐 Get API key from: https://makersuite.google.com/app/apikey");
}

const genAI = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Improved query classification function
const classifyQuery = (message: string): string => {
  const trimmedMsg = message.trim();

  // Empty or nonsensical queries
  if (trimmedMsg.length === 0 || /^[^a-zA-Z0-9]+$/.test(trimmedMsg)) {
    return 'INVALID';
  }

  const words = trimmedMsg.split(/\s+/);
  const lowerMsg = trimmedMsg.toLowerCase();


  // Greetings and small talk
  const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
  if (greetings.some(word => lowerMsg.startsWith(word))) {
    return 'GREETING';
  }

  // Thanks
  const thanks = ['thank', 'thanks', 'appreciate', 'grateful'];
  if (thanks.some(word => lowerMsg.includes(word))) {
    return 'THANKS';
  }

  // Farewells
  const farewells = ['bye', 'goodbye', 'see you', 'farewell'];
  if (farewells.some(word => lowerMsg.includes(word))) {
    return 'FAREWELL';
  }

  // Simple questions about the assistant itself
  const aboutBot = ['who are you', 'what are you', 'your name', 'your purpose'];
  if (aboutBot.some(phrase => lowerMsg.includes(phrase))) {
    return 'ABOUT_BOT';
  }

  // Complex queries that need detailed explanations
  const complexIndicators = ['explain', 'how to', 'why', 'what is', 'difference between', 'example of', 'tutorial', 'help with'];
  if (complexIndicators.some(word => lowerMsg.includes(word))) {
    return 'COMPLEX';
  }

  // Default to standard query
  return 'STANDARD';
};

// Response templates for different query types
const RESPONSE_TEMPLATES = {
  INVALID: "I didn't quite understand that. Could you please rephrase your question?",
  GREETING: (digitalTwin?: DigitalTwin) => {
    const name = digitalTwin?.learnerName ? `, ${digitalTwin.learnerName}` : '';
    return `👋 **Hello${name}!** I'm your Python learning assistant.\n\nHow can I help you with Python today?`;
  },
  THANKS: "I'm glad I could help. Feel free to ask if you have more questions about Python!",
  FAREWELL: "Happy coding! Come back anytime you need help.",
  ABOUT_BOT: "🤖 **AI Tutor**\n\nI'm an AI assistant specialized in helping you learn Python programming, System developing.. . I can explain concepts, provide examples, and answer your questions."
};

type TemplateKey = keyof typeof RESPONSE_TEMPLATES;
const isTemplateKey = (v: string): v is TemplateKey => v in RESPONSE_TEMPLATES;

const getSystemInstruction = (digitalTwin?: DigitalTwin, queryType?: string): string => {
  let instruction = `You are an AI Tutor for a student learning Python.
Be encouraging and clear in your explanations.
The student is currently working on Python programming.
Always respond in Markdown format.
If you provide code examples, use Python and wrap them in markdown code blocks.
If asked about topics outside of Python learning, politely steer the conversation back.`;

  // Adjust instruction based on query type
  if (queryType === 'COMPLEX') {
    instruction += '\nProvide a detailed, comprehensive explanation with examples.';
  } else if (queryType === 'STANDARD') {
    instruction += '\nProvide a concise but helpful answer.';
  }

  if (digitalTwin) {
    instruction += `\nThe student's current progress is as follows:`;
    for (const [topic, progress] of Object.entries(digitalTwin.knowledge)) {
      if (progress > 0) {
        instruction += `\n- ${topic}: ${(progress * 100).toFixed(0)}% understood.`;
      }
    }
    if (digitalTwin.behavior.mostAskedTopics && digitalTwin.behavior.mostAskedTopics.length > 0) {
      instruction += `\nThey have recently asked about: ${digitalTwin.behavior.mostAskedTopics.join(', ')}.`;
    }
    if (digitalTwin.behavior.preferredLearningStyle) {
      instruction += `\nTheir preferred learning style seems to be: ${digitalTwin.behavior.preferredLearningStyle}. Tailor explanations accordingly if possible.`;
    }
  }
  return instruction;
};

export const startChatSession = async (digitalTwin: DigitalTwin): Promise<string> => {
  const sessionId = 'session-' + Date.now();
  console.log('Chat session started:', sessionId);
  return sessionId;
};

export const sendMessageToGemini = async (message: string, digitalTwin?: DigitalTwin): Promise<string> => {
  // First classify the query
  const queryType = classifyQuery(message);

  // Handle simple queries locally without API call
  if (isTemplateKey(queryType)) {
    console.log(`Handling ${queryType} query locally`);
    const template = RESPONSE_TEMPLATES[queryType];
    return typeof template === 'function' ? template(digitalTwin) : template;
  }

  if (!genAI) {
    console.error("🔑 Gemini API not initialized because API_KEY is missing.");
    return `🤖 **AI Tutor is currently unavailable**

I'm sorry, but I cannot respond right now because the Gemini API is not properly configured.

**To fix this:**
1. Create a file called \`.env.local\` in your project root
2. Add this line: \`VITE_GEMINI_API_KEY=your_actual_api_key\`
3. Get your API key from: https://makersuite.google.com/app/apikey
4. Restart the development server

**For now, you can still:**
- Complete learning modules and quizzes
- View your progress and achievements
- Browse course content`;
  }

  try {
    const systemInstruction = getSystemInstruction(digitalTwin, queryType);
    const prompt = `${systemInstruction}\n\nUser: ${message}`;

    const result = await genAI.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        // Adjust parameters based on query complexity
        temperature: queryType === 'COMPLEX' ? 0.7 : 0.3,
        maxOutputTokens: queryType === 'COMPLEX' ? 2048 : 1024
      }
    });

    console.log('Gemini API response received successfully for', queryType, 'query');
    return result.text || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Error sending message to Gemini:', error);
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        return "I'm sorry, but there's an issue with the API key configuration. Please check your Gemini API key.";
      }
      return `Sorry, I encountered an error: ${error.message}. Please try again.`;
    }
    return 'Sorry, I encountered an error. Please try again.';
  }
};

// Stateless generation example (if needed for specific non-chat tasks)
export const generateContentStateless = async (prompt: string, digitalTwin?: DigitalTwin): Promise<string> => {
  if (!genAI) {
    console.error("Gemini API not initialized because API_KEY is missing.");
    return "Gemini API is not available.";
  }

  try {
    const systemInstruction = getSystemInstruction(digitalTwin);
    const fullPrompt = `${systemInstruction}\n\n${prompt}`;

    const result = await genAI.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: fullPrompt
    });

    return result.text || 'No response generated';
  } catch (error) {
    console.error("Error generating content from Gemini:", error);
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return "An unknown error occurred.";
  }
};