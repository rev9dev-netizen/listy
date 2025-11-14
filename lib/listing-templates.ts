// Amazon's banned and restricted words/phrases
export const AMAZON_BANNED_WORDS = [
    // Superlatives and guarantees
    'best', 'best-selling', 'best seller', '#1', 'number 1', 'number one',
    'top-rated', 'top rated', 'highest quality', 'guaranteed', 'guarantee',

    // Medical/health claims
    'cure', 'cures', 'treat', 'treatment', 'heal', 'heals', 'diagnose',
    'prevent', 'prevents', 'disease', 'therapy', 'therapeutic',

    // Time-sensitive claims
    'sale', 'discount', 'deal', 'limited time', 'limited offer', 'promotion',
    'special offer', 'clearance', 'liquidation', 'closeout',

    // Competitor references
    'amazon', 'amazon\'s choice', 'prime', 'ebay', 'walmart', 'target',

    // Subjective claims
    'perfect', 'revolutionary', 'amazing', 'incredible', 'unbelievable',
    'magical', 'miracle', 'breakthrough',

    // Inappropriate content
    'free', 'free shipping', 'bonus', 'gift', 'prize', 'warranty',

    // Prohibited phrases
    'compare to', 'as seen on tv', 'buy now', 'click here', 'order now',
    'limited quantity', 'while supplies last', 'act now'
];

// Listing format templates
export interface ListingTemplate {
    id: string;
    name: string;
    description: string;
    titleFormat: string;
    bulletFormat: string;
    descriptionFormat: string;
    keywords: {
        titleDensity: 'high' | 'medium' | 'low';
        bulletDensity: 'high' | 'medium' | 'low';
        descriptionDensity: 'high' | 'medium' | 'low';
    };
}

export const LISTING_TEMPLATES: ListingTemplate[] = [
    {
        id: 'professional-seo',
        name: 'Professional SEO Optimized',
        description: 'Balanced keyword density with professional tone. Best for most products.',
        titleFormat: '[Primary Keyword] - [Key Features] - [Variant/Size/Color]',
        bulletFormat: 'Start with benefit, support with features, end with result. Use primary & secondary keywords naturally.',
        descriptionFormat: 'Opening hook with primary keyword → Feature sections with keywords → Benefits → Trust signals → Call to value',
        keywords: {
            titleDensity: 'high',
            bulletDensity: 'medium',
            descriptionDensity: 'medium',
        },
    },
    {
        id: 'feature-focused',
        name: 'Feature-Focused',
        description: 'Emphasizes technical specifications and features. Good for tech/electronics.',
        titleFormat: '[Brand] [Product Type] | [Key Specs] | [Model/Version]',
        bulletFormat: 'Lead with specific feature → Technical details → Practical application → Keywords in context',
        descriptionFormat: 'Tech specs overview → Detailed feature breakdown → Use cases → Compatibility → Technical keywords',
        keywords: {
            titleDensity: 'medium',
            bulletDensity: 'high',
            descriptionDensity: 'high',
        },
    },
    {
        id: 'benefit-driven',
        name: 'Benefit-Driven',
        description: 'Focuses on customer benefits and solutions. Great for lifestyle products.',
        titleFormat: '[Solution] [Product Type] - [Primary Benefit] for [Target Audience]',
        bulletFormat: 'Problem statement → Solution/Benefit → How it works → Keywords describing benefit',
        descriptionFormat: 'Emotional hook → Problem-solution narrative → Lifestyle benefits → Social proof elements → Keywords in benefits',
        keywords: {
            titleDensity: 'medium',
            bulletDensity: 'low',
            descriptionDensity: 'low',
        },
    },
    {
        id: 'premium-luxury',
        name: 'Premium/Luxury',
        description: 'Elegant, sophisticated tone with emphasis on quality and craftsmanship.',
        titleFormat: '[Brand] [Premium Descriptor] [Product] - [Unique Value Proposition]',
        bulletFormat: 'Sophisticated benefit → Quality/craftsmanship detail → Premium materials → Keywords with elegance',
        descriptionFormat: 'Brand story → Craftsmanship details → Premium materials → Exclusive benefits → Refined keywords',
        keywords: {
            titleDensity: 'low',
            bulletDensity: 'low',
            descriptionDensity: 'low',
        },
    },
    {
        id: 'conversion-optimized',
        name: 'Conversion-Optimized',
        description: 'Aggressive keyword usage while maintaining readability. Maximum visibility.',
        titleFormat: '[Primary KW] [Secondary KW] - [Feature] [Feature] - [Category KW]',
        bulletFormat: 'Keyword-rich opening → Feature with keywords → Benefit with keywords → Secondary keywords',
        descriptionFormat: 'Keyword-dense intro → Feature sections loaded with keywords → Benefit-keyword combos → Keyword variations',
        keywords: {
            titleDensity: 'high',
            bulletDensity: 'high',
            descriptionDensity: 'high',
        },
    },
    {
        id: 'storytelling',
        name: 'Storytelling/Brand',
        description: 'Narrative-driven with brand personality. Keywords woven naturally into story.',
        titleFormat: '[Brand] [Product] - [Brand Promise/Tagline]',
        bulletFormat: 'Story-based benefit → Real-world scenario → Emotional connection → Natural keyword integration',
        descriptionFormat: 'Brand narrative → Customer journey → Product role in story → Natural keyword flow',
        keywords: {
            titleDensity: 'low',
            bulletDensity: 'low',
            descriptionDensity: 'low',
        },
    },
];

// Get template by ID
export function getTemplate(templateId: string): ListingTemplate {
    const template = LISTING_TEMPLATES.find(t => t.id === templateId);
    return template || LISTING_TEMPLATES[0]; // Default to professional-seo
}

// Check if text contains banned words
export function checkBannedWords(text: string): string[] {
    const lowerText = text.toLowerCase();
    const found: string[] = [];

    for (const word of AMAZON_BANNED_WORDS) {
        if (lowerText.includes(word.toLowerCase())) {
            found.push(word);
        }
    }

    return found;
}

// Calculate keyword density
export function calculateKeywordDensity(text: string, keywords: string[]): number {
    const words = text.toLowerCase().split(/\s+/);
    let keywordCount = 0;

    for (const keyword of keywords) {
        const keywordWords = keyword.toLowerCase().split(/\s+/);
        for (let i = 0; i <= words.length - keywordWords.length; i++) {
            const slice = words.slice(i, i + keywordWords.length).join(' ');
            if (slice === keywordWords.join(' ')) {
                keywordCount++;
            }
        }
    }

    return words.length > 0 ? (keywordCount / words.length) * 100 : 0;
}
