import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { ChatMessage, DigitalTwin } from '../types';
import { GEMINI_MODEL_NAME } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY for Gemini is not set in environment variables.");
  // Potentially throw an error or handle this state in the UI
  // For this example, we'll allow the app to run but Gemini features will fail.
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

let chatInstance: Chat | null = null;

const getSystemInstruction = (digitalTwin?: DigitalTwin): string => {
  let instruction = `You are ${GEMINI_MODEL_NAME}, a friendly and helpful AI Tutor for a student learning Python.
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

export const startChatSession = async (digitalTwin: any): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/start-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        digitalTwin,
        context: 'Starting a new AI tutoring session for Python learning.'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.sessionId || 'session-' + Date.now();
  } catch (error) {
    console.error('Error starting chat session:', error);
    return 'session-' + Date.now();
  }
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context: 'You are an AI tutor helping students learn Python programming. Provide clear, helpful explanations and code examples when appropriate.'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.response || 'Sorry, I could not process your request.';
  } catch (error) {
    console.error('Error sending message to Gemini:', error);
    return 'Sorry, I encountered an error. Please try again.';
  }
};

// Stateless generation example (if needed for specific non-chat tasks)
export const generateContentStateless = async (prompt: string, digitalTwin?: DigitalTwin): Promise<string> => {
   if (!ai) {
    console.error("Gemini API not initialized because API_KEY is missing.");
    return "Gemini API is not available.";
  }
  try {
    const systemInstruction = getSystemInstruction(digitalTwin);
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });
    return response.text || 'No response generated';
  } catch (error) {
    console.error("Error generating content from Gemini:", error);
     if (error instanceof Error) {
        return `Error: ${error.message}`;
    }
    return "An unknown error occurred.";
  }
};
