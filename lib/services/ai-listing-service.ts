/* eslint-disable @typescript-eslint/no-explicit-any */
import { mistral } from '../models/mistral';
import { getTemplate, AMAZON_BANNED_WORDS } from '../listing-templates';
import { buildSystemPrompt, buildUserPrompt } from './prompt-builder';

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

export async function generateAmazonListing(params: GenerateListingParams, template?: any): Promise<GeneratedListing> {
    // Use provided template or load default
    const activeTemplate = template || getTemplate(params.templateId || 'professional-seo');
    const selectedKeywords = params.keywords.filter(k => k.selected).map(k => k.phrase);
    const section = params.section || 'all';

    // Sort keywords by search volume (primary to tertiary)
    const sortedKeywords = [...params.keywords]
        .filter(k => k.selected)
        .sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0));

    const primaryKeywords = sortedKeywords.slice(0, 3).map(k => k.phrase);
    const secondaryKeywords = sortedKeywords.slice(3, 8).map(k => k.phrase);
    const tertiaryKeywords = sortedKeywords.slice(8).map(k => k.phrase);

    // Generate prompts using the new Human-Centric Prompt Builder
    const systemPrompt = buildSystemPrompt(activeTemplate, section);
    const userPrompt = buildUserPrompt(params, activeTemplate, primaryKeywords, secondaryKeywords, tertiaryKeywords, section);

    // Retry logic with exponential backoff
    let lastError: Error | null = null;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // response is already the content string from MistralClient
            const content = await mistral.chat({
                model: 'mistral-large-latest',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.7,
                max_tokens: section === 'all' ? 4000 : 1500,
            });

            if (!content) {
                throw new Error('No content in AI response');
            }

            const parsed = parseListingResponse(content, section, activeTemplate);

            // Validate and check for banned words
            const warnings: string[] = [];

            if (parsed.title) {
                // FIX #5: Case-insensitive banned word check
                const titleBanned = checkBannedWordsCaseInsensitive(parsed.title);
                if (titleBanned.length > 0) {
                    warnings.push(`Title contains banned words: ${titleBanned.join(', ')}`);
                }
                
                // FIX #3: Validate character count
                const titleMin = activeTemplate.titleMinChars || 150;
                const titleMax = activeTemplate.titleMaxChars || 200;
                if (parsed.title.length < titleMin || parsed.title.length > titleMax) {
                    warnings.push(`Title length ${parsed.title.length} outside range ${titleMin}-${titleMax}`);
                    // Truncate if over limit
                    if (parsed.title.length > titleMax) {
                        parsed.title = parsed.title.substring(0, titleMax);
                    }
                }
                
                // FIX #8: Enforce capitalization
                const titleCap = activeTemplate.titleCapitalization || 'title';
                parsed.title = enforceCapitalization(parsed.title, titleCap);
            }

            if (parsed.bullets.length > 0) {
                const bulletMin = activeTemplate.bulletMinChars || 180;
                const bulletMax = activeTemplate.bulletMaxChars || 220;
                
                parsed.bullets = parsed.bullets.map((bullet, index) => {
                    const bulletBanned = checkBannedWordsCaseInsensitive(bullet);
                    if (bulletBanned.length > 0) {
                        warnings.push(`Bullet ${index + 1} contains banned words: ${bulletBanned.join(', ')}`);
                    }
                    
                    // Validate length
                    if (bullet.length < bulletMin || bullet.length > bulletMax) {
                        warnings.push(`Bullet ${index + 1} length ${bullet.length} outside range ${bulletMin}-${bulletMax}`);
                        // Truncate if over
                        if (bullet.length > bulletMax) {
                            return bullet.substring(0, bulletMax);
                        }
                    }
                    
                    return bullet;
                });
            }

            if (parsed.description) {
                // Sanitize special characters
                parsed.description = sanitizeSpecialChars(parsed.description);
                
                const descBanned = checkBannedWordsCaseInsensitive(parsed.description);
                if (descBanned.length > 0) {
                    warnings.push(`Description contains banned words: ${descBanned.join(', ')}`);
                }
                
                // Validate length
                const descMax = activeTemplate.descriptionMaxChars || 2000;
                // Count without HTML tags for length
                const plainLength = parsed.description.replace(/<[^>]*>/g, '').length;
                if (plainLength > descMax) {
                    warnings.push(`Description length ${plainLength} exceeds max ${descMax}`);
                }
            }
            
            // FIX #6: Validate backend search terms
            if (parsed.backendTerms) {
                parsed.backendTerms = validateBackendTerms(parsed.backendTerms, params.brand);
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
            lastError = error as Error;
            console.error(`Attempt ${attempt}/${maxRetries} failed:`, error instanceof Error ? error.message : 'Unknown error');
            
            // Don't retry on last attempt
            if (attempt < maxRetries) {
                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, attempt - 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    // All retries failed
    throw new Error(`Failed to generate listing after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}



function parseListingResponse(content: string, section: 'title' | 'bullets' | 'description' | 'all', template?: any): Omit<GeneratedListing, 'warnings' | 'keywordUsage'> {
    try {
        // Remove markdown code blocks if present
        let cleaned = content.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/```\n?/g, '');
        }

        // Handle section-specific responses
        const shouldPreserveHtml = template?.useHtmlFormatting ?? true;

        // Helper to conditionally strip HTML tags
        function processText(str: string): string {
            if (!str) return '';
            // FIX #2: Only strip HTML if template doesn't want it
            if (shouldPreserveHtml) {
                return str.trim();
            }
            return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        }

        if (section === 'title') {
            // Plain text response for title (no HTML needed)
            return {
                title: cleaned.replace(/<[^>]*>/g, '').trim(),
                bullets: [],
                description: '',
                backendTerms: '',
            };
        }

        if (section === 'bullets') {
            // FIX #4: Robust JSON parsing with fallbacks
            let bulletsArray: string[];
            try {
                bulletsArray = JSON.parse(cleaned);
            } catch {
                // Fallback 1: Try extracting JSON from markdown
                const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    try {
                        bulletsArray = JSON.parse(jsonMatch[0]);
                    } catch {
                        // Fallback 2: Split by newlines
                        bulletsArray = cleaned
                            .split('\n')
                            .map(line => line.trim())
                            .filter(line => line && !line.startsWith('[') && !line.startsWith(']'))
                            .map(line => line.replace(/^["']|["']$/g, '').replace(/^-\s*/, ''))
                            .slice(0, 5); // Max 5 bullets
                    }
                } else {
                    // Fallback 3: Split by common separators
                    bulletsArray = cleaned.split(/\n\n|\|/).map(b => b.trim()).filter(Boolean).slice(0, 5);
                }
            }
            
            if (!Array.isArray(bulletsArray) || bulletsArray.length === 0) {
                // If parsing failed, just return empty array and let the UI handle/retry or show error
                 bulletsArray = [];
            }
            
            return {
                title: '',
                bullets: bulletsArray.map(processText),
                description: '',
                backendTerms: '',
            };
        }

        if (section === 'description') {
            return {
                title: '',
                bullets: [],
                description: processText(cleaned),
                backendTerms: '',
            };
        }

        // section === 'all' - full JSON object
        const parsed = JSON.parse(cleaned);
        return {
            title: parsed.title ? processText(parsed.title) : '',
            bullets: Array.isArray(parsed.bullets) ? parsed.bullets.map(processText) : [],
            description: parsed.description ? processText(parsed.description) : '',
            backendTerms: parsed.backendTerms || '',
        };
    } catch (error) {
        console.error('Parse error:', error instanceof Error ? error.message : 'Unknown');
        throw new Error(`Invalid response format from AI: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
}

// FIX #5: Case-insensitive banned word detection
function checkBannedWordsCaseInsensitive(text: string): string[] {
    return AMAZON_BANNED_WORDS.filter(word => {
        const lowerWord = word.toLowerCase();
        // Check for whole word matches using word boundaries
        const regex = new RegExp(`\\b${lowerWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(text);
    });
}

// FIX #8: Enforce capitalization rules
function enforceCapitalization(text: string, style: string): string {
    if (!text) return text;
    
    switch(style) {
        case 'all-caps':
            return text.toUpperCase();
        case 'sentence':
            return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
        case 'title':
            // Title Case: capitalize first letter of each major word
            return text.split(' ').map((word, index) => {
                // Don't capitalize small words unless they're first
                const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with'];
                if (index > 0 && smallWords.includes(word.toLowerCase())) {
                    return word.toLowerCase();
                }
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }).join(' ');
        default:
            return text;
    }
}

// FIX #6: Validate backend search terms
function validateBackendTerms(terms: string, brand?: string): string {
    if (!terms) return '';
    
    let cleaned = terms
        .toLowerCase()
        .trim();
    
    // Remove brand name
    if (brand) {
        const brandRegex = new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        cleaned = cleaned.replace(brandRegex, '');
    }
    
    // Split, trim, and remove punctuation
    let termsList = cleaned
        .split(',')
        .map(t => t.trim().replace(/[^\w\s]/g, ''))
        .filter(t => t.length > 0);
    
    // Remove duplicates
    termsList = [...new Set(termsList)];
    
    // Rejoin
    cleaned = termsList.join(',');
    
    // Enforce 250 byte limit
    while (new Blob([cleaned]).size > 250 && termsList.length > 0) {
        termsList.pop();
        cleaned = termsList.join(',');
    }
    
    return cleaned;
}

// FIX #9: Improved keyword matching with word boundaries
function countKeywordUsage(text: string, keywords: string[]): number {
    let count = 0;

    for (const keyword of keywords) {
        // Use word boundaries to avoid partial matches
        const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        const matches = text.match(regex);
        count += matches ? matches.length : 0;
    }

    return count;
}

// Sanitize special characters (em dashes, fancy quotes, etc.)
function sanitizeSpecialChars(text: string): string {
    if (!text) return text;
    
    return text
        // Em dashes and en dashes to hyphens
        .replace(/—/g, '-')
        .replace(/–/g, '-')
        // Fancy double quotes to regular quotes
        .replace(/"/g, '"')
        .replace(/"/g, '"')
        .replace(/„/g, '"')
        // Fancy single quotes to apostrophes
        .replace(/'/g, "'")
        .replace(/'/g, "'")
        .replace(/‚/g, "'")
        // Ellipsis to dots
        .replace(/…/g, '...')
        // Non-breaking spaces to regular spaces
        .replace(/\u00A0/g, ' ')
        // Other common special chars
        .replace(/•/g, '-')
        .replace(/©/g, '(c)')
        .replace(/®/g, '(R)')
        .replace(/™/g, '(TM)');
}
