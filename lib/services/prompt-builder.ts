/* eslint-disable @typescript-eslint/no-explicit-any */
import { ListingTemplate, AMAZON_BANNED_WORDS } from '../listing-templates';

// Types (replicated/imported to avoid circular deps if possible, or refined)
interface PromptParams {
    productName: string;
    brand?: string;
    category: string;
    features?: string[];
    benefits?: string[];
    uniqueSellingPoints?: string[];
    targetAudience?: string;
}

export function buildSystemPrompt(template: any, section: 'title' | 'bullets' | 'description' | 'all'): string {
    // 1. Role & Persona (Human-like)
    const roleDefinition = `You are a world-class Amazon Copywriting Expert. Your goal is to write a high-converting listing that sounds 100% human-written, persuasive, and completely compliant with Amazon policies.`;

    // 2. Core Philosophy (The "How")
    const writingPhilosophy = `
WRITING_PHILOSOPHY:
- **Write for Humans**: Use natural, engaging language. Avoid robotic repetition.
- **Sell the Benefit**: Don't just list specs. Explain WHY it matters.
- **Be Concise**: Cut fluff. Every word must earn its place.
- **Integrate Keywords Naturally**: They should be invisible to the reader. NEVER force a keyword if it breaks the flow.
`;

    // 3. Section-Specific Instructions (The "What")
    let specificInstructions = '';
    
    // Extract template rules
    const tone = template.tone || 'professional';
    const avoidWords = [...AMAZON_BANNED_WORDS, ...(template.avoidWords || [])];

    if (section === 'title') {
        const format = template.titleFormat || "[Brand] [Product Name] - [Key Benefits] - [Size/Color]";
        const max = template.titleMaxChars || 200;
        
        specificInstructions = `
TASK: Write a Product Title.

STYLE GUIDELINES:
- Tone: ${tone}
- Capitalization: ${template.titleCapitalization || 'Title Case'}
- **TARGET LENGTH**: Aim for ${max} characters. Be detailed and comprehensive.
- **MAXIMUM LENGTH**: Do not exceed ${max} characters.

FORMATTING RULE:
You MUST follow this structure exactly: "${format}"

CRITICAL INSTRUCTIONS:
1. Start with brand/product identifiers.
2. Include 3-4 key benefits/features separated by hyphens.
3. Be descriptive and use the full character allowance.
4. NO PROMOTIONAL TERMS (e.g. "Best", "Sale").
5. Output ONLY the raw title string, no quotes, no markdown.
`;
    } 
    else if (section === 'bullets') {
        const format = template.bulletFormat && template.bulletFormat.includes('→') 
            ? template.bulletFormat 
            : "Benefit → Feature → Meaning";
        const min = template.bulletMinChars || 180;
        const max = template.bulletMaxChars || 220;

        // Provide a LONG example that actually meets the character requirement
        const longExample180Chars = `"SCARE YOUR FRIENDS SILLY - This ultra-realistic eight-legged creepy crawler pops out of the box with lifelike movement, delivering instant shrieks and unforgettable Halloween memories for all ages."`;

        specificInstructions = `
TASK: Write 5 Bullet Points.

STYLE GUIDELINES:
- Tone: ${tone}
- **MINIMUM LENGTH**: Each bullet MUST be AT LEAST ${min} characters. Bullets under ${min} chars = FAILURE.
- **MAXIMUM LENGTH**: Do not exceed ${max} characters.
- Formatting: ${template.bulletCapitalizeFirst ? 'Capitalize the first phrase in ALL CAPS' : 'Standard sentence case'}.

FORMATTING RULE:
Follow this pattern for EVERY bullet: 
"${format}"

Here is an example of a bullet that is EXACTLY ${min}+ characters (count it yourself):
${longExample180Chars}

Notice how the example is DETAILED and ELABORATE. Your bullets must be EQUALLY LONG.

CRITICAL INSTRUCTIONS:
1. Write EXACTLY 5 bullets.
2. Each bullet MUST be ${min}-${max} characters. If your first draft is short, EXPAND IT with more detail.
3. Do NOT include literal text like "(Benefit)" or "(Meaning)". Just follow the flow.
4. After writing each bullet, mentally count: "Is this at least ${min} characters?" If not, ADD MORE DETAIL.
5. Output ONLY a valid JSON array of 5 strings.
`;
    }
    else if (section === 'description') {
        const format = template.descriptionFormat || "Hook → Features → Benefits → Conclusion";
        const max = template.descriptionMaxChars || 2000;
        const useHtml = template.useHtmlFormatting !== false;
        const isParagraph = template.descriptionStyle === 'paragraph';

        specificInstructions = `
TASK: Write a Product Description.

STYLE GUIDELINES:
- Tone: ${tone}
- **TARGET LENGTH**: Write a comprehensive description, aim for ${max} characters.
- **MAXIMUM LENGTH**: Do not exceed ${max} characters.
- Format: ${useHtml ? 'Use HTML (<b>, <br>) for readability.' : 'Plain text only.'}
${isParagraph ? '- Structure: Write as a SINGLE, cohesive essay-style paragraph. Do NOT use bullet points or lists.' : ''}

FORMATTING RULE:
Structure the text as follows: "${format}"

CRITICAL INSTRUCTIONS:
1. Start with a compelling hook.
${isParagraph ? '2. Weave features and benefits into a narrative story.' : '2. Use short paragraphs and headers.'}
3. Persuade the reader to buy.
4. **NO SPECIAL CHARACTERS**: Do NOT use em dashes (—), en dashes (–), fancy quotes (""), or other special Unicode. Use only standard ASCII: hyphens (-), regular quotes ("), apostrophes (').
5. NO emojis.
`;
    }

    // 4. Output Instruction
    const outputInstruction = section === 'bullets' 
        ? `OUTPUT FORMAT: Provide ONLY a raw JSON array of strings. No markdown formatting.`
        : `OUTPUT FORMAT: Provide ONLY the raw text string. No markdown, no quotes.`;

    return `${roleDefinition}\n\n${writingPhilosophy}\n\n${specificInstructions}\n\nAVOID THESE WORDS: ${avoidWords.slice(0, 15).join(', ')}.\n\n${outputInstruction}`;
}

export function buildUserPrompt(
    params: PromptParams,
    template: any, // ListingTemplate equivalent
    primaryKeywords: string[],
    secondaryKeywords: string[],
    tertiaryKeywords: string[],
    section: 'title' | 'bullets' | 'description' | 'all'
): string {
    const context = `
PRODUCT CONTEXT:
- **Name**: ${params.productName}
- **Category**: ${params.category}
${params.brand ? `- **Brand**: ${params.brand}` : ''}
${params.targetAudience ? `- **Target Audience**: ${params.targetAudience}` : ''}

KEY FEATURES:
${(params.features || []).map(f => `- ${f}`).join('\n')}

KEY BENEFITS:
${(params.benefits || []).map(b => `- ${b}`).join('\n')}

UNIQUE SELLING POINTS:
${(params.uniqueSellingPoints || []).map(u => `- ${u}`).join('\n')}
`;

    const keywordStrategy = `
KEYWORD STRATEGY:
- **Must Include** (Primary): ${primaryKeywords.join(', ')}
- **Nice to Have** (Secondary): ${secondaryKeywords.join(', ')}
- **Contextual** (Tertiary): ${tertiaryKeywords.join(', ')}

Instruction: Integrate "Must Include" keywords naturally. Use others only if they fit the sentence flow. DO NOT STUFF KEYWORDS.
`;

    // Extract constraints to reinforce in User Prompt (Recency Bias)
    let constraints = '';
    if (section === 'title') {
        const min = template.titleMinChars || 150;
        const max = template.titleMaxChars || 200;
        const format = template.titleFormat || "[Brand] [Product Name] - [Key Benefits] - [Size/Color]";
        constraints = `
- **Length**: STRICTLY between ${min} and ${max} characters. (Current: 0)
- **Format**: You MUST use: "${format}"
- **Check**: result.length >= ${min} && result.length <= ${max}`;
    } else if (section === 'bullets') {
        const min = template.bulletMinChars || 180;
        const max = template.bulletMaxChars || 220;
        const format = template.bulletFormat || "Benefit - Feature - Meaning";
        constraints = `
- **Length**: STRICTLY between ${min} and ${max} characters PER bullet.
- **Structure**: "${format}"
- **Example**: ${template.id === 'killer-copywriter' ? '"START STRONG - Feature details here so you get the benefit."' : '"Benefit (Feature) - Meaning"'}
- **Crucial**: Do NOT just write sentences. Use the defined structure.`;
    } else if (section === 'description') {
        const min = template.descriptionMinChars || 1500;
        const max = template.descriptionMaxChars || 2000;
        const isParagraph = template.descriptionStyle === 'paragraph';
        constraints = `
- **Length**: ${min}-${max} characters.
- **Style**: ${isParagraph ? 'Single cohesive paragraph (Essay style).' : 'Standard HTML format with headers.'}`;
    }

    const finalDirective = `
ACTION:
Write the ${section.toUpperCase()} for this product now. 

CRITICAL CONSTRAINTS (MUST FOLLOW):
${constraints}

Follow the System Prompt rules for Format and Tone rigorously.
`;

    return `${context}\n\n${keywordStrategy}\n\n${finalDirective}`;
}
