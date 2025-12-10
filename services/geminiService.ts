import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateCampaignDescription = async (title: string, keywords: string): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key is missing. Returning mock data.");
    return "This is a simulated AI description because the API Key is missing. Please configure your API key to see real Gemini results.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a compelling, short (2-3 sentences) description for an environmental campaign titled "${title}". 
      Focus on these keywords: ${keywords}. 
      The tone should be encouraging and professional.`,
      config: {
        systemInstruction: "You are an expert copywriter for environmental NGOs and Government agencies.",
        temperature: 0.7,
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate description");
  }
};

export const suggestMissions = async (campaignTitle: string): Promise<string> => {
   if (!apiKey) return "";

   try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Suggest 3 simple gamified missions for the campaign "${campaignTitle}". 
      Format strictly as a JSON array of strings. Example: ["Take a photo of a tree", "Pick up 3 pieces of trash", "Walk 1km"]`,
      config: {
        responseMimeType: "application/json"
      }
    });
    return response.text || "[]";
   } catch (error) {
     console.error("Gemini API Error", error);
     return "[]";
   }
}
