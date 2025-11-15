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
    section?: 'title' | 'bullets' | 'description' | 'all'; // NEW: specify which section to generate
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
    const section = params.section || 'all';

    // Sort keywords by search volume (primary to tertiary)
    const sortedKeywords = [...params.keywords]
        .filter(k => k.selected)
        .sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0));

    const primaryKeywords = sortedKeywords.slice(0, 3).map(k => k.phrase);
    const secondaryKeywords = sortedKeywords.slice(3, 8).map(k => k.phrase);
    const tertiaryKeywords = sortedKeywords.slice(8).map(k => k.phrase);

    const systemPrompt = buildSystemPrompt(template, section);
    const userPrompt = buildUserPrompt(params, template, primaryKeywords, secondaryKeywords, tertiaryKeywords, section);

    try {
        const response = await mistral.chat({
            model: 'mistral-large-latest',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: section === 'all' ? 4000 : 1500,
        });

        const parsed = parseListingResponse(response, section);

        // Validate and check for banned words
        const warnings: string[] = [];

        if (parsed.title) {
            const titleBanned = checkBannedWords(parsed.title);
            if (titleBanned.length > 0) {
                warnings.push(`Title contains banned words: ${titleBanned.join(', ')}`);
            }
        }

        if (parsed.bullets.length > 0) {
            const bulletsBanned = parsed.bullets.flatMap(b => checkBannedWords(b));
            if (bulletsBanned.length > 0) {
                warnings.push(`Bullets contain banned words: ${[...new Set(bulletsBanned)].join(', ')}`);
            }
        }

        if (parsed.description) {
            const descBanned = checkBannedWords(parsed.description);
            if (descBanned.length > 0) {
                warnings.push(`Description contains banned words: ${[...new Set(descBanned)].join(', ')}`);
            }
        }

        return {
            ...parsed,
            warnings,
            keywordUsage: {
                title: parsed.title ? countKeywordUsage(parsed.title, selectedKeywords) : 0,
                bullets: parsed.bullets.reduce((sum, bullet) => sum + countKeywordUsage(bullet, selectedKeywords), 0),
                description: parsed.description ? countKeywordUsage(parsed.description, selectedKeywords) : 0,
            },
        };
    } catch (error) {
        console.error('Error generating listing:', error);
        throw new Error('Failed to generate listing with AI');
    }
}

function buildSystemPrompt(template: ListingTemplate, section: 'title' | 'bullets' | 'description' | 'all'): string {
    const baseRules = `You are an EXPERT Amazon SEO copywriter with 15+ years of experience creating top-performing listings.

## CRITICAL RULES - NEVER VIOLATE:

### 1. AMAZON BANNED CONTENT (INSTANT REJECTION):
NEVER use these words: ${AMAZON_BANNED_WORDS.slice(0, 20).join(', ')}, etc.
- NO superlatives (best, #1, top-rated, perfect)
- NO guarantees or medical claims
- NO time-sensitive language (sale, limited time, deal)
- NO competitor mentions

### 2. KEYWORD INTEGRATION (NATURAL & STRATEGIC):
- Keywords must flow NATURALLY in sentences
- NEVER list keywords comma-separated
- Use variations and long-tail combinations
- Density target: ${template.keywords.titleDensity} for title, ${template.keywords.bulletDensity} for bullets, ${template.keywords.descriptionDensity} for description

### 3. WRITING STYLE:
- Professional yet engaging tone
- Active voice, present tense
- Customer-benefit focused (not just features)`;

    if (section === 'title') {
        return `${baseRules}

## GENERATE ONLY: TITLE

**TITLE REQUIREMENTS (${template.titleFormat}):**
- 150-200 characters (not exceeding 200)
- Primary keyword in first 5 words
- Clear product identification
- Key features/benefits
- No promotional language

## OUTPUT FORMAT:
Return ONLY plain text - the title itself. NO JSON, NO quotes, NO explanations.`;
    }

    if (section === 'bullets') {
        return `${baseRules}

## GENERATE ONLY: 5 BULLET POINTS

**BULLET REQUIREMENTS (${template.bulletFormat}):**
- Exactly 5 bullets
- Each 200-250 characters
- Start with BENEFIT/RESULT (what customer gets)
- Support with FEATURES (how it works)
- Integrate 2-3 keywords PER bullet naturally
- Proper capitalization (not all caps)

## OUTPUT FORMAT:
Return ONLY valid JSON array:
["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"]`;
    }

    if (section === 'description') {
        return `${baseRules}

## GENERATE ONLY: PRODUCT DESCRIPTION

**DESCRIPTION REQUIREMENTS (${template.descriptionFormat}):**
- 1500-2000 characters
- Opening hook with primary keyword
- 3-4 feature sections with subheadings
- Naturally weave keywords throughout
- Use HTML tags: <b>bold</b>, <br> for breaks

## OUTPUT FORMAT:
Return ONLY plain text - the HTML-formatted description. NO JSON, NO quotes, NO explanations.`;
    }

    // section === 'all'
    return `${baseRules}

## GENERATE: COMPLETE LISTING (Title, Bullets, Description, Backend Terms)

**STRUCTURE REQUIREMENTS:**

**TITLE (${template.titleFormat}):**
- 150-200 characters
- Primary keyword in first 5 words

**BULLETS (${template.bulletFormat}):**
- Exactly 5 bullets, 200-250 chars each
- Benefit-driven with feature support

**DESCRIPTION (${template.descriptionFormat}):**
- 1500-2000 characters
- HTML formatted with <b> and <br>

**BACKEND SEARCH TERMS:**
- Comma-separated unused keywords
- Variations, synonyms
- Under 250 bytes

## OUTPUT FORMAT:
Return ONLY valid JSON:
{
  "title": "exact title text",
  "bullets": ["bullet1", "bullet2", "bullet3", "bullet4", "bullet5"],
  "description": "HTML description",
  "backendTerms": "keyword1, keyword2, keyword3"
}`;
}

function buildUserPrompt(
    params: GenerateListingParams,
    template: ListingTemplate,
    primaryKeywords: string[],
    secondaryKeywords: string[],
    tertiaryKeywords: string[],
    section: 'title' | 'bullets' | 'description' | 'all'
): string {
    const sectionText = section === 'all' ? 'a complete Amazon listing' : `ONLY the ${section.toUpperCase()}`;
    return `Generate ${sectionText} for:

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

## REQUIREMENTS:
✓ NO banned words (best, guaranteed, sale, etc.)
✓ NO keyword stuffing - natural integration only
✓ Focus on CUSTOMER BENEFITS, not just features
✓ Specific details and numbers
✓ Professional, confident tone

${section === 'title' ? '✓ Primary keywords in first 5 words\n✓ 150-200 characters total' : ''}
${section === 'bullets' ? '✓ Exactly 5 bullets\n✓ Each 200-250 characters\n✓ Start with benefit, support with features' : ''}
${section === 'description' ? '✓ 1500-2000 characters\n✓ Use HTML formatting (<b>, <br>)\n✓ 3-4 sections with subheadings' : ''}

Generate now. Return in the specified format.`;
}

function parseListingResponse(response: string, section: 'title' | 'bullets' | 'description' | 'all'): Omit<GeneratedListing, 'warnings' | 'keywordUsage'> {
    try {
        // Remove markdown code blocks if present
        let cleaned = response.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/```\n?/g, '');
        }

        // Handle section-specific responses

        // Helper to strip HTML tags
        function stripHtmlTags(str: string): string {
            if (!str) return '';
            return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        }

        if (section === 'title') {
            // Plain text response for title
            return {
                title: stripHtmlTags(cleaned),
                bullets: [],
                description: '',
                backendTerms: '',
            };
        }

        if (section === 'bullets') {
            // JSON array response for bullets
            const bulletsArray = JSON.parse(cleaned);
            if (!Array.isArray(bulletsArray)) {
                throw new Error('Expected array for bullets');
            }
            return {
                title: '',
                bullets: bulletsArray.map(stripHtmlTags),
                description: '',
                backendTerms: '',
            };
        }

        if (section === 'description') {
            // Plain text HTML response for description
            return {
                title: '',
                bullets: [],
                description: stripHtmlTags(cleaned),
                backendTerms: '',
            };
        }

        // section === 'all' - full JSON object
        const parsed = JSON.parse(cleaned);
        return {
            title: parsed.title || '',
            bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
            description: parsed.description || '',
            backendTerms: parsed.backendTerms || '',
        };
    } catch (error) {
        console.error('Failed to parse AI response:', response);
        console.error('Parse error:', error);
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
