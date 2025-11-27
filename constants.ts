
export const DEFAULT_PROMPT = "Analyze the ink drawing. Colorize this manga page using the style instructions provided. If no style is provided, use high-quality, modern anime coloring. PRESERVE THE ORIGINAL LINES EXACTLY.";

export const CONSISTENCY_PROMPT = `
INPUT IMAGES:
1. [STYLE REFERENCE]: The first image provided is the Source for colors, skin tones, and atmosphere.
2. [TARGET CONTENT]: The second image provided is the Black & White Manga Page to be colorized.

TASK:
Colorize the [TARGET CONTENT] (Image 2) by applying the color palette and shading style extracted from the [STYLE REFERENCE] (Image 1).

CRITICAL CONSTRAINTS:
- YOU MUST PRESERVE THE EXACT COMPOSITION AND LINEWORK OF IMAGE 2.
- DO NOT REDRAW OR HALLUCINATE NEW CONTENT.
- DO NOT OUTPUT A VARIATION OF IMAGE 1.
- YOUR OUTPUT MUST ALIGN PERFECTLY WITH IMAGE 2'S LINES.
`;

export const MAX_FILE_SIZE_MB = 10;
export const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
