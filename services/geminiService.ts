
import { GoogleGenAI } from "@google/genai";
import { Settings } from '../types';
import { DEFAULT_PROMPT, CONSISTENCY_PROMPT } from '../constants';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

interface GenerateImageParams {
  imageBase64: string;
  mimeType: string;
  settings: Settings;
  specificPrompt?: string;
}

export const colorizeMangaPage = async ({ imageBase64, mimeType, settings, specificPrompt }: GenerateImageParams): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  // Combine global and specific instructions
  const globalInst = settings.instructions ? `Global Project Style/Instructions: ${settings.instructions}` : '';
  const pageInst = specificPrompt ? `Specific Page Request (Override global if conflicting): ${specificPrompt}` : '';
  
  const combinedInstructions = `${globalInst}\n${pageInst}`;
  
  // Construct content parts
  const parts: any[] = [];
  let promptText = "";

  if (settings.referenceImage) {
    // Reference Image Mode
    // Add Reference Image First
    parts.push({
      inlineData: {
        mimeType: "image/png", // Assuming reference is converted or same type, but generic png is usually safe for inline
        data: settings.referenceImage
      }
    });

    // Add Target Image Second
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: imageBase64
      }
    });

    promptText = `${CONSISTENCY_PROMPT} \n\n ${combinedInstructions} \n\n Return ONLY the colorized version of the TARGET image.`;
  } else {
    // Single Image Mode
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: imageBase64
      }
    });

    promptText = `${DEFAULT_PROMPT} \n\n ${combinedInstructions} \n\n Return ONLY the image.`;
  }

  // Add text prompt last
  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: settings.model,
      contents: {
        parts: parts
      },
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
        // Determine mimeType if possible, otherwise default to png as that's typical for these models
        const outMimeType = part.inlineData.mimeType || 'image/png';
        return `data:${outMimeType};base64,${base64Data}`;
      }
    }

    // If we got text but no image
    const textPart = content.parts.find(p => p.text);
    if (textPart) {
      console.warn("Model returned text instead of image:", textPart.text);
      throw new Error("The model returned text instead of an image. Try adjusting instructions or the reference image.");
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
