import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY || '';

  if (!apiKey) {
    return NextResponse.json({
      description: "This is a simulated AI description because the API Key is missing. Please configure your API key to see real Gemini results."
    });
  }

  try {
    const { title, keywords } = await request.json();

    const ai = new GoogleGenAI({ apiKey });
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

    return NextResponse.json({ description: response.text || "" });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 }
    );
  }
}
