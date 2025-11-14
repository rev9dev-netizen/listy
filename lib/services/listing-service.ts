import { openai } from '../models/openai'
import { cache } from '../databse/redis'
import type { ListingDraft, ListingDraftRequest, ValidationIssue } from '../types'

/**
 * Listing Generator Service
 * Implements GPT-based listing generation with keyword weaving and compliance
 */

// System prompt for listing generation
const SYSTEM_PROMPT = `You are an expert Amazon product listing copywriter. Your task is to create compelling, compliant, and keyword-optimized product listings that follow Amazon's policies.

Key principles:
- Write naturally and avoid keyword stuffing
- Follow character limits strictly
- Use keywords organically within natural sentences
- Maintain readability and persuasive tone
- Never repeat keywords excessively (max 2 times total across all fields)
- Avoid prohibited claims (medical, therapeutic, FDA-related)
- Focus on features, benefits, and use cases`

// Generate developer prompt with constraints
function buildDeveloperPrompt(request: ListingDraftRequest): string {
    const limits = request.limits || {
        title: 180,
        bullet: 220,
        description: 1500,
    }

    const disallowed = request.disallowed || []

    return `FORMAT REQUIREMENTS:
- TITLE: Maximum ${limits.title} characters (including spaces)
- BULLETS: Exactly 5 bullet points, each maximum ${limits.bullet} characters
- DESCRIPTION: Maximum ${limits.description} characters

KEYWORD STRATEGY:
- Primary keywords (use exactly once): ${request.keywords.primary.join(', ')}
- Secondary keywords (use at most once): ${request.keywords.secondary.join(', ')}

PROHIBITED TERMS:
${disallowed.length > 0 ? `- Never use: ${disallowed.join(', ')}` : '- No specific prohibited terms'}

COMPLIANCE RULES:
- No medical or health claims
- No competitor brand names
- No excessive capitalization
- No special characters in title
- Natural keyword placement only
- Maintain professional tone`
}

// Generate user prompt with product details
function buildUserPrompt(request: ListingDraftRequest): string {
    const attributes = Object.entries(request.attributes)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')

    return `Create an Amazon product listing for:

BRAND: ${request.brand}
PRODUCT TYPE: ${request.product_type}
MARKETPLACE: ${request.marketplace}
TONE: ${request.tone || 'standard'}

PRODUCT ATTRIBUTES:
${attributes}

Generate a complete listing with:
1. A compelling title that includes primary keywords naturally
2. Five benefit-focused bullet points that highlight features and use cases
3. A detailed description that tells the product story

Format your response as JSON:
{
  "title": "...",
  "bullets": ["...", "...", "...", "...", "..."],
  "description": "..."
}`
}

// Generate listing draft using GPT
export async function generateListingDraft(
    request: ListingDraftRequest
): Promise<ListingDraft> {
    const cacheKey = `listing:draft:${JSON.stringify(request)}`
    const cached = await cache.get<ListingDraft>(cacheKey)
    if (cached) return cached

    try {
        const systemPrompt = SYSTEM_PROMPT
        const developerPrompt = buildDeveloperPrompt(request)
        const userPrompt = buildUserPrompt(request)

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'developer', content: developerPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 2000,
            response_format: { type: 'json_object' },
        })

        const content = response.choices[0]?.message?.content || '{}'
        const parsed = JSON.parse(content) as ListingDraft

        // Validate and fix if needed
        const validated = await validateAndFix(parsed, request)

        await cache.set(cacheKey, validated, 3600) // 1 hour cache
        return validated
    } catch (error) {
        console.error('Error generating listing:', error)
        throw new Error('Failed to generate listing')
    }
}

// Validate listing and attempt auto-fix
async function validateAndFix(
    draft: ListingDraft,
    request: ListingDraftRequest
): Promise<ListingDraft> {
    const limits = request.limits || {
        title: 180,
        bullet: 220,
        description: 1500,
    }

    const fixed = { ...draft }

    // Fix title length
    if (fixed.title.length > limits.title) {
        fixed.title = fixed.title.substring(0, limits.title).trim()
    }

    // Fix bullet lengths
    fixed.bullets = fixed.bullets.map((bullet) => {
        if (bullet.length > limits.bullet) {
            return bullet.substring(0, limits.bullet).trim()
        }
        return bullet
    })

    // Fix description length
    if (fixed.description.length > limits.description) {
        fixed.description = fixed.description.substring(0, limits.description).trim()
    }

    return fixed
}

// Validate listing for compliance and issues
export function validateListing(
    draft: ListingDraft,
    request: ListingDraftRequest
): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    const limits = request.limits || {
        title: 180,
        bullet: 220,
        description: 1500,
    }

    // Check title length
    if (draft.title.length > limits.title) {
        issues.push({
            field: 'title',
            type: 'length',
            severity: 'error',
            message: `Title exceeds ${limits.title} characters (${draft.title.length})`,
            suggestion: 'Shorten the title by removing less important words',
        })
    }

    // Check bullets length
    draft.bullets.forEach((bullet, index) => {
        if (bullet.length > limits.bullet) {
            issues.push({
                field: 'bullets',
                type: 'length',
                severity: 'error',
                message: `Bullet ${index + 1} exceeds ${limits.bullet} characters (${bullet.length})`,
                suggestion: 'Shorten this bullet point',
            })
        }
    })

    // Check description length
    if (draft.description.length > limits.description) {
        issues.push({
            field: 'description',
            type: 'length',
            severity: 'error',
            message: `Description exceeds ${limits.description} characters (${draft.description.length})`,
            suggestion: 'Reduce description length',
        })
    }

    // Check for keyword stuffing
    const allText = `${draft.title} ${draft.bullets.join(' ')} ${draft.description}`.toLowerCase()
    const allKeywords = [...request.keywords.primary, ...request.keywords.secondary]

    for (const keyword of allKeywords) {
        const regex = new RegExp(keyword.toLowerCase(), 'g')
        const matches = allText.match(regex)
        const count = matches ? matches.length : 0

        if (count > 2) {
            issues.push({
                field: 'title',
                type: 'stuffing',
                severity: 'warning',
                message: `Keyword "${keyword}" appears ${count} times (max 2 recommended)`,
                suggestion: 'Remove some instances to avoid keyword stuffing',
            })
        }
    }

    // Check for disallowed terms
    if (request.disallowed) {
        for (const term of request.disallowed) {
            if (allText.includes(term.toLowerCase())) {
                issues.push({
                    field: 'title',
                    type: 'policy',
                    severity: 'error',
                    message: `Prohibited term found: "${term}"`,
                    suggestion: `Remove or replace "${term}"`,
                })
            }
        }
    }

    // Check for common policy violations
    const policyPatterns = [
        { pattern: /\b(cure|treat|diagnose|prevent)\b/i, message: 'Avoid medical claims' },
        { pattern: /\b(FDA|clinical|medical)\b/i, message: 'Avoid FDA/medical references' },
        { pattern: /[A-Z]{3,}/g, message: 'Excessive capitalization detected' },
    ]

    for (const policy of policyPatterns) {
        if (policy.pattern.test(allText)) {
            issues.push({
                field: 'title',
                type: 'policy',
                severity: 'warning',
                message: policy.message,
                suggestion: 'Review and modify text to comply with Amazon policies',
            })
        }
    }

    return issues
}

// Auto-fix listing issues
export function autoFixListing(draft: ListingDraft, request: ListingDraftRequest): ListingDraft {
    const limits = request.limits || {
        title: 180,
        bullet: 220,
        description: 1500,
    }

    const fixed: ListingDraft = {
        title: draft.title,
        bullets: [...draft.bullets],
        description: draft.description,
    }

    // Fix length issues
    if (fixed.title.length > limits.title) {
        // Try to cut at last complete word
        const truncated = fixed.title.substring(0, limits.title)
        const lastSpace = truncated.lastIndexOf(' ')
        fixed.title = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated
    }

    fixed.bullets = fixed.bullets.map((bullet) => {
        if (bullet.length > limits.bullet) {
            const truncated = bullet.substring(0, limits.bullet)
            const lastSpace = truncated.lastIndexOf(' ')
            return lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated
        }
        return bullet
    })

    if (fixed.description.length > limits.description) {
        const truncated = fixed.description.substring(0, limits.description)
        const lastPeriod = truncated.lastIndexOf('.')
        const lastSpace = truncated.lastIndexOf(' ')
        const cutPoint = lastPeriod > 0 ? lastPeriod + 1 : lastSpace > 0 ? lastSpace : limits.description
        fixed.description = fixed.description.substring(0, cutPoint)
    }

    // Remove disallowed terms
    if (request.disallowed) {
        for (const term of request.disallowed) {
            const regex = new RegExp(term, 'gi')
            fixed.title = fixed.title.replace(regex, '')
            fixed.bullets = fixed.bullets.map((b) => b.replace(regex, ''))
            fixed.description = fixed.description.replace(regex, '')
        }
    }

    return fixed
}

// Calculate keyword usage statistics
export function calculateKeywordUsage(
    draft: ListingDraft,
    keywords: string[]
): Record<string, number> {
    const allText = `${draft.title} ${draft.bullets.join(' ')} ${draft.description}`.toLowerCase()
    const usage: Record<string, number> = {}

    for (const keyword of keywords) {
        const regex = new RegExp(keyword.toLowerCase(), 'g')
        const matches = allText.match(regex)
        usage[keyword] = matches ? matches.length : 0
    }

    return usage
}
