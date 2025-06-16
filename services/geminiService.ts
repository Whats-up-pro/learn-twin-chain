
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


export const startChatSession = (digitalTwin?: DigitalTwin): void => {
  if (!ai) {
    console.error("Gemini API not initialized because API_KEY is missing.");
    return;
  }
  const systemInstruction = getSystemInstruction(digitalTwin);
  chatInstance = ai.chats.create({
    model: GEMINI_MODEL_NAME,
    config: {
      systemInstruction: systemInstruction,
    }
  });
};


export const sendMessageToGemini = async (message: string, history: ChatMessage[]): Promise<string> => {
  if (!ai) {
    console.error("Gemini API not initialized because API_KEY is missing.");
    return "Gemini API is not available. Please check the API key configuration.";
  }
  if (!chatInstance) {
    console.warn("Chat session not started. Starting a new one with default context.");
    startChatSession(); // Start with default context if not already started
    if (!chatInstance) return "Failed to start chat session."; // Guard if startChatSession also fails
  }

  try {
    // Note: The @google/genai Chat object manages history internally based on `chat.sendMessage`.
    // However, if you want to explicitly resend history or use a stateless model approach,
    // you would construct the `contents` array differently.
    // For this example, we rely on the stateful `chatInstance`.

    const response: GenerateContentResponse = await chatInstance.sendMessage({ message: message });
    return response.text;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    // More specific error handling can be added here
    if (error instanceof Error) {
        return `Error interacting with AI Tutor: ${error.message}. Please try again.`;
    }
    return "An unknown error occurred while contacting the AI Tutor.";
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
    return response.text;
  } catch (error) {
    console.error("Error generating content from Gemini:", error);
     if (error instanceof Error) {
        return `Error: ${error.message}`;
    }
    return "An unknown error occurred.";
  }
};
