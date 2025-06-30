import { GoogleGenAI } from "@google/genai";
import { ChatMessage, DigitalTwin } from '../types';
import { GEMINI_MODEL_NAME } from '../constants';

// Try different environment variable names for Vite
const API_KEY = (window as any).ENV?.VITE_GEMINI_API_KEY || 
                (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                'your_api_key_here';

if (!API_KEY || API_KEY === 'your_api_key_here') {
  console.error("GEMINI API_KEY is not set.");
  console.log("Please set VITE_GEMINI_API_KEY in your .env.local file");
}

const genAI = API_KEY && API_KEY !== 'your_api_key_here' ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const getSystemInstruction = (digitalTwin?: DigitalTwin): string => {
  let instruction = `You are an AI Tutor for a student learning Python.
Be encouraging and clear in your explanations.
The student is currently working on Python programming.
Always respond in Markdown format.
If you provide code examples, use Python and wrap them in markdown code blocks.
If asked about topics outside of Python learning, politely steer the conversation back.`;

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
  if (!genAI) {
    console.error("Gemini API not initialized because API_KEY is missing.");
    return "I'm sorry, but I cannot respond right now because the Gemini API is not properly configured. Please check your API key setup.";
  }

  try {
    const systemInstruction = getSystemInstruction(digitalTwin);
    const prompt = `${systemInstruction}\n\nUser: ${message}`;
    
    const result = await genAI.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt
    });
    
    console.log('Gemini API response received successfully');
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
