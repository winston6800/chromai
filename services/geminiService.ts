
import { GoogleGenAI } from "@google/genai";
import { Settings } from '../types';
import { DEFAULT_PROMPT, CONSISTENCY_PROMPT } from '../constants';

interface GenerateImageParams {
  imageBase64: string;
  mimeType: string;
  settings: Settings;
  specificPrompt?: string;
}

const SYSTEM_INSTRUCTION = `You are an expert manga colorist AI. Your ONLY job is to add color to black-and-white ink drawings.

RULES:
1. **PRESERVE LINE ART**: Do not change the drawing, composition, or characters of the Target Image. Your output must line up perfectly with the original black-and-white input.
2. **STYLE TRANSFER**: If a Reference Image is provided, copy its color palette (skin, hair, clothes, lighting) exactly, but apply it to the geometry of the Target Image.
3. **INFERENCE**: If user instructions (e.g. "Yotsuba style") contradict the Reference Image, prioritize the Reference Image for colors but the Text for specific mood adjustments.

OUTPUT:
Return ONLY the generated image.`;

export const colorizeMangaPage = async ({ imageBase64, mimeType, settings, specificPrompt }: GenerateImageParams): Promise<string> => {
  // CRITICAL: Initialize the client inside the function to ensure it uses the latest selected API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Combine global and specific instructions
  const globalInst = settings.instructions ? `USER INSTRUCTIONS: ${settings.instructions}` : '';
  const pageInst = specificPrompt ? `PAGE SPECIFIC OVERRIDES: ${specificPrompt}` : '';
  
  const combinedInstructions = `${globalInst}\n${pageInst}`;
  
  // Construct content parts
  const parts: any[] = [];
  let promptText = "";

  if (settings.referenceImage) {
    // Reference Image Mode - STRICT ORDERING
    
    // 1. Reference Image (Style Source)
    parts.push({
      inlineData: {
        mimeType: "image/png", 
        data: settings.referenceImage
      }
    });

    // 2. Target Image (Content Source)
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: imageBase64
      }
    });

    promptText = `${CONSISTENCY_PROMPT} \n\n ${combinedInstructions} \n\n REMEMBER: IMAGE 2 IS THE TARGET. DO NOT CHANGE THE DRAWING OF IMAGE 2.`;
  } else {
    // Single Image Mode
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: imageBase64
      }
    });

    promptText = `${DEFAULT_PROMPT} \n\n ${combinedInstructions}`;
  }

  // Add text prompt last
  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: settings.model,
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    // Parse response to find the image part
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No candidates returned from Gemini.");
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      throw new Error("No content parts returned.");
    }

    for (const part of content.parts) {
      if (part.inlineData && part.inlineData.data) {
        // Found the image
        const base64Data = part.inlineData.data;
        const outMimeType = part.inlineData.mimeType || 'image/png';
        return `data:${outMimeType};base64,${base64Data}`;
      }
    }

    // If we got text but no image
    const textPart = content.parts.find(p => p.text);
    if (textPart) {
      console.warn("Model returned text instead of image:", textPart.text);
      throw new Error("The model returned text analysis instead of an image. Try refining your instruction or using a simpler prompt.");
    }

    throw new Error("No image data found in the response.");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};
