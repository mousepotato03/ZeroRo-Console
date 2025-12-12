import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY || '';

  if (!apiKey) {
    return NextResponse.json({ missions: [] });
  }

  try {
    const { campaignTitle } = await request.json();

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Suggest 3 simple gamified missions for the campaign "${campaignTitle}".
      Format strictly as a JSON array of strings. Example: ["Take a photo of a tree", "Pick up 3 pieces of trash", "Walk 1km"]`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const missions = JSON.parse(response.text || "[]");
    return NextResponse.json({ missions });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ missions: [] });
  }
}
