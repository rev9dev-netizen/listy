// Keyword Generation Types
export interface KeywordGenerationRequest {
    marketplace: string
    asin_list?: string[]
    seeds?: string[]
    category?: string
}

export interface Keyword {
    term: string
    score: number
    cluster_id: string
    class: 'primary' | 'secondary' | 'tertiary'
    source: 'competitor' | 'seed' | 'extracted'
}

export interface KeywordGenerationResponse {
    keywords: Keyword[]
}

// Listing Generation Types
export interface ListingDraftRequest {
    marketplace: string
    brand: string
    product_type: string
    attributes: Record<string, string>
    tone?: 'standard' | 'professional' | 'casual' | 'luxury'
    disallowed?: string[]
    keywords: {
        primary: string[]
        secondary: string[]
    }
    limits?: {
        title: number
        bullet: number
        description: number
    }
}

export interface ListingDraft {
    title: string
    bullets: string[]
    description: string
}

export type ListingDraftResponse = ListingDraft

// Validation Types
export interface ValidationIssue {
    field: 'title' | 'bullets' | 'description'
    type: 'length' | 'policy' | 'stuffing' | 'readability'
    severity: 'error' | 'warning' | 'info'
    message: string
    suggestion?: string
}

export interface ValidationResponse {
    valid: boolean
    issues: ValidationIssue[]
}

// Export Types
export interface ExportRequest {
    format: 'amazon' | 'csv' | 'json'
    listing: ListingDraft
    productData?: Record<string, string>
}

export interface ExportResponse {
    data: string | object
    filename: string
}

// Project Types
export interface Project {
    id: string
    userId: string
    marketplace: string
    brand?: string
    productType?: string
    createdAt: Date
    updatedAt: Date
}

// Cluster Types
export interface Cluster {
    id: string
    keywords: string[]
    primaryTerm: string
    avgScore: number
}
