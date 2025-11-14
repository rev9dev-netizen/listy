import { mistral } from '../models/mistral';
import { getTemplate, checkBannedWords, AMAZON_BANNED_WORDS, type ListingTemplate } from '../listing-templates';

interface GenerateListingParams {
    productName: string;
    brand?: string;
    category: string;
    keywords: Array<{
        phrase: string;
        searchVolume?: number;
        selected: boolean;
    }>;
    features?: string[];
    benefits?: string[];
    targetAudience?: string;
    uniqueSellingPoints?: string[];
    templateId?: string;
    marketplace?: string;
}

interface GeneratedListing {
    title: string;
    bullets: string[];
    description: string;
    backendTerms: string;
    warnings: string[];
    keywordUsage: {
        title: number;
        bullets: number;
        description: number;
    };
}

export async function generateAmazonListing(params: GenerateListingParams): Promise<GeneratedListing> {
    const template = getTemplate(params.templateId || 'professional-seo');
    const selectedKeywords = params.keywords.filter(k => k.selected).map(k => k.phrase);

    // Sort keywords by search volume (primary to tertiary)
    const sortedKeywords = [...params.keywords]
        .filter(k => k.selected)
        .sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0));

    const primaryKeywords = sortedKeywords.slice(0, 3).map(k => k.phrase);
    const secondaryKeywords = sortedKeywords.slice(3, 8).map(k => k.phrase);
    const tertiaryKeywords = sortedKeywords.slice(8).map(k => k.phrase);

    const systemPrompt = buildSystemPrompt(template);
    const userPrompt = buildUserPrompt(params, template, primaryKeywords, secondaryKeywords, tertiaryKeywords);

    try {
        const response = await mistral.chat({
            model: 'mistral-large-latest',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 4000,
        });

        const parsed = parseListingResponse(response);

        // Validate and check for banned words
        const warnings: string[] = [];
        const titleBanned = checkBannedWords(parsed.title);
        const bulletsBanned = parsed.bullets.flatMap(b => checkBannedWords(b));
        const descBanned = checkBannedWords(parsed.description);

        if (titleBanned.length > 0) {
            warnings.push(`Title contains banned words: ${titleBanned.join(', ')}`);
        }
        if (bulletsBanned.length > 0) {
            warnings.push(`Bullets contain banned words: ${[...new Set(bulletsBanned)].join(', ')}`);
        }
        if (descBanned.length > 0) {
            warnings.push(`Description contains banned words: ${[...new Set(descBanned)].join(', ')}`);
        }

        return {
            ...parsed,
            warnings,
            keywordUsage: {
                title: countKeywordUsage(parsed.title, selectedKeywords),
                bullets: parsed.bullets.reduce((sum, bullet) => sum + countKeywordUsage(bullet, selectedKeywords), 0),
                description: countKeywordUsage(parsed.description, selectedKeywords),
            },
        };
    } catch (error) {
        console.error('Error generating listing:', error);
        throw new Error('Failed to generate listing with AI');
    }
}

function buildSystemPrompt(template: ListingTemplate): string {
    return `You are an EXPERT Amazon SEO copywriter with 15+ years of experience creating top-performing listings. Your listings consistently rank in top 3 search results and achieve 10%+ conversion rates.

## YOUR EXPERTISE:
- Amazon A9/A10 algorithm mastery
- Keyword optimization without stuffing
- Compelling, conversion-focused copy
- Amazon TOS compliance (no banned words/claims)
- Customer psychology and buying triggers

## CRITICAL RULES - NEVER VIOLATE:

### 1. AMAZON BANNED CONTENT (INSTANT REJECTION):
NEVER use these words or similar: ${AMAZON_BANNED_WORDS.slice(0, 20).join(', ')}, etc.
- NO superlatives (best, #1, top-rated, perfect)
- NO guarantees or medical claims
- NO time-sensitive language (sale, limited time, deal)
- NO competitor mentions
- NO subjective exaggerations

### 2. KEYWORD INTEGRATION (NATURAL & STRATEGIC):
- Keywords must flow NATURALLY in sentences
- NEVER list keywords comma-separated
- Use variations and long-tail combinations
- Primary keywords in first 80 characters of title
- Secondary keywords in bullets naturally
- Tertiary keywords in description contextually
- Density target: ${template.keywords.titleDensity} for title, ${template.keywords.bulletDensity} for bullets, ${template.keywords.descriptionDensity} for description

### 3. WRITING STYLE:
- Professional yet engaging tone
- Active voice, present tense
- Specific numbers and details (not vague claims)
- Customer-benefit focused (not just features)
- Scannable formatting

### 4. STRUCTURE REQUIREMENTS:

**TITLE (${template.titleFormat}):**
- 150-200 characters (not exceeding 200)
- Primary keyword in first 5 words
- Clear product identification
- Key features/benefits
- No promotional language

**BULLETS (5 bullets, ${template.bulletFormat}):**
- Each 200-250 characters
- Start with BENEFIT/RESULT (what customer gets)
- Support with FEATURES (how it works)
- Integrate 2-3 keywords PER bullet naturally
- Use proper capitalization (not all caps)
- No emoji or special characters

**DESCRIPTION (${template.descriptionFormat}):**
- 1500-2000 characters
- Opening hook with primary keyword (problem/solution)
- 3-4 feature sections with subheadings
- Naturally weave keywords throughout
- Include use cases and applications
- End with brand trust/quality statement
- Use HTML tags: <b>bold</b> for emphasis, <br> for breaks

**BACKEND SEARCH TERMS:**
- Comma-separated keywords not used in listing
- Variations, misspellings, synonyms
- No repetition of visible keywords
- Under 250 bytes

## OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no explanations):
{
  "title": "exact title text here",
  "bullets": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"],
  "description": "full HTML-formatted description",
  "backendTerms": "keyword1, keyword2, keyword3"
}

## YOUR MISSION:
Create a COMPLIANT, CONVERTING, KEYWORD-OPTIMIZED listing that reads naturally, ranks high, and drives sales. Think like a customer - what would make YOU click "Add to Cart"?`;
}

function buildUserPrompt(
    params: GenerateListingParams,
    template: ListingTemplate,
    primaryKeywords: string[],
    secondaryKeywords: string[],
    tertiaryKeywords: string[]
): string {
    return `Generate an Amazon listing for:

## PRODUCT INFORMATION:
- Product Name: ${params.productName}
${params.brand ? `- Brand: ${params.brand}` : ''}
- Category: ${params.category}
${params.targetAudience ? `- Target Audience: ${params.targetAudience}` : ''}
${params.marketplace ? `- Marketplace: ${params.marketplace}` : ''}

## KEYWORDS TO USE (by priority):
**Primary Keywords** (MUST use in title and bullets): ${primaryKeywords.join(', ')}
**Secondary Keywords** (use in bullets and description): ${secondaryKeywords.join(', ')}
**Tertiary Keywords** (use naturally in description): ${tertiaryKeywords.join(', ')}

${params.features && params.features.length > 0 ? `## PRODUCT FEATURES:\n${params.features.map(f => `- ${f}`).join('\n')}` : ''}

${params.benefits && params.benefits.length > 0 ? `## CUSTOMER BENEFITS:\n${params.benefits.map(b => `- ${b}`).join('\n')}` : ''}

${params.uniqueSellingPoints && params.uniqueSellingPoints.length > 0 ? `## UNIQUE SELLING POINTS:\n${params.uniqueSellingPoints.map(u => `- ${u}`).join('\n')}` : ''}

## TEMPLATE STYLE: ${template.name}
${template.description}

## REQUIREMENTS CHECKLIST:
✓ Use template format: "${template.titleFormat}" for title
✓ Follow bullet structure: "${template.bulletFormat}"
✓ Follow description structure: "${template.descriptionFormat}"
✓ Integrate ALL primary keywords naturally in title
✓ Use 2-3 keywords per bullet point (naturally, not forced)
✓ Weave keywords throughout description in context
✓ NO banned words (best, guaranteed, sale, etc.)
✓ NO keyword stuffing or unnatural phrases
✓ Focus on CUSTOMER BENEFITS, not just features
✓ Specific details and numbers (not vague claims)
✓ Professional, confident tone
✓ Backend terms include UNUSED keyword variations

Generate the listing now. Return ONLY the JSON object.`;
}

function parseListingResponse(response: string): Omit<GeneratedListing, 'warnings' | 'keywordUsage'> {
    try {
        // Remove markdown code blocks if present
        let cleaned = response.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/```\n?/g, '');
        }

        const parsed = JSON.parse(cleaned);

        return {
            title: parsed.title || '',
            bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
            description: parsed.description || '',
            backendTerms: parsed.backendTerms || '',
        };
    } catch {
        console.error('Failed to parse AI response:', response);
        throw new Error('Invalid response format from AI');
    }
}

function countKeywordUsage(text: string, keywords: string[]): number {
    const lowerText = text.toLowerCase();
    let count = 0;

    for (const keyword of keywords) {
        const regex = new RegExp(keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = lowerText.match(regex);
        count += matches ? matches.length : 0;
    }

    return count;
}
