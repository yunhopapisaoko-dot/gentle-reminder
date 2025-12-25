
import { GoogleGenAI, Chat } from "@google/genai";

// Fix: Always use process.env.API_KEY directly and instantiate inside functions.
export const getCommunityChat = (): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: 'You are Miku, a cheerful and helpful digital idol acting as the mascot for the Mikudom community. You love music, art, and connecting fans. Keep your responses short, upbeat, and use occasional emojis or anime-style expressions (e.g., ^_^, !).',
    },
  });
};

export const generateLatestFeed = async () => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Generate 3 creative titles and short excerpts for an anime community feed. Focus on topics like digital art, cosplay, and vocaloid music.',
    });
    // Fix: Access .text property directly.
    return response.text;
  } catch (error) {
    console.error("Error generating feed:", error);
    return null;
  }
};
