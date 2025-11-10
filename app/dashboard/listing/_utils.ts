import type { UIKeyword, ListingContent } from './_types'

// Parse Cerebro CSV content into keywords
export function parseCerebroCSV(csvText: string): UIKeyword[] {
    const lines = csvText.split('\n')
    const keywords: UIKeyword[] = []
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        const matches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
        if (!matches || matches.length < 7) continue
        const phrase = matches[0].replace(/^"|"$/g, '')
        const sales = parseFloat(matches[3]) || 0
        const searchVolume = parseFloat(matches[5]) || 0
        const cpsMatch = matches[12]
        const cps = cpsMatch && cpsMatch !== '"-"' ? parseFloat(cpsMatch) : null
        if (phrase) {
            keywords.push({ phrase, searchVolume, sales, cps, selected: false })
        }
    }
    return keywords
}

export function getCharCountColor(current: number, limit: number): string {
    const percentage = (current / limit) * 100
    if (percentage > 100) return 'text-red-500'
    if (percentage > 90) return 'text-yellow-500'
    return 'text-muted-foreground'
}

export function keywordIsUsed(phrase: string, content: ListingContent): number {
    const allText = (
        content.title + ' ' +
        content.bullet1 + ' ' +
        content.bullet2 + ' ' +
        content.bullet3 + ' ' +
        content.bullet4 + ' ' +
        content.bullet5 + ' ' +
        content.description
    ).toLowerCase()
    const escapedPhrase = phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escapedPhrase}\\b`, 'g')
    const matches = allText.match(regex)
    return matches ? matches.length : 0
}

export function paginate<T>(items: T[], page: number, perPage: number): T[] {
    const start = (page - 1) * perPage
    return items.slice(start, start + perPage)
}

export function formatSearchVolume(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
    return n.toString()
}
