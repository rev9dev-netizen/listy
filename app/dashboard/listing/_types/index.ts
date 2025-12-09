// Shared types for Listing Builder UI

export interface UIKeyword {
    phrase: string
    searchVolume: number
    sales: number
    cps: number | null
    selected: boolean
}

export type SortBy = 'volume' | 'sales' | 'alpha'

export interface AISuggestion {
    content: string
    section: 'title' | 'bullet' | 'description'
    bulletIndex?: number
}

export interface ListingParameters {
    productCharacteristics: string
    characteristicTags: string[]
    characteristicInput: string
    brandName: string
    showBrandName: 'beginning' | 'end' | 'none'
    productName: string
    tone: 'formal' | 'casual' | 'professional' | 'luxury'
    targetAudience: string
    avoidWords: string
    selectedTemplateId?: string
}

export interface ListingContent {
    title: string
    bullet1: string
    bullet2: string
    bullet3: string
    bullet4: string
    bullet5: string
    description: string
    searchTerms: string
}

export interface ListingLimits {
    titleLimit: number
    bulletLimit: number
    descLimit: number
}

export interface ListingMetrics {
    generatedVolume: number
}
