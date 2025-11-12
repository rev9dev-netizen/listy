import { clsx, type ClassValue } from "clsx"
import { createHash } from "crypto"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Stable stringify to ensure consistent hashing order
function stableStringify(value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj).sort()
    return `{${keys.map(k => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(',')}}`
  }
  if (Array.isArray(value)) {
    return `[${value.map(v => stableStringify(v)).join(',')}]`
  }
  return JSON.stringify(value)
}

export async function sha256(input: string): Promise<string> {
  return createHash('sha256').update(input).digest('hex')
}

export async function computeDraftHash(payload: {
  title: string
  bullets: string[]
  description: string
  backendTerms?: string | null
  keywords?: unknown
}) {
  const normalized = stableStringify({
    title: payload.title?.trim() || '',
    bullets: (payload.bullets || []).map(b => (b || '').trim()),
    description: payload.description?.trim() || '',
    backendTerms: payload.backendTerms ?? null,
    keywords: payload.keywords ?? []
  })
  return sha256(normalized)
}
