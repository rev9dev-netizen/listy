"use client"
import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { UIKeyword, SortBy, ListingParameters, ListingContent, ListingMetrics } from './_types'
import { parseCerebroCSV, keywordIsUsed } from './_utils'
import { enrichKeywords } from '@/lib/keyword-metrics'

export function useListingBuilder() {
    // Keywords
    const [keywords, setKeywords] = useState<UIKeyword[]>([])
    const [manualKeyword, setManualKeyword] = useState('')
    const [bulkKeywordText, setBulkKeywordText] = useState('')
    const [sortBy, setSortBy] = useState<SortBy>('volume')
    const [currentPage, setCurrentPage] = useState(1)
    const [keywordsPerPage] = useState(20)

    // UI Toggles
    const [keywordBankOpen, setKeywordBankOpen] = useState(true)
    const [rootKeywordsOpen, setRootKeywordsOpen] = useState(false)
    const [parametersOpen, setParametersOpen] = useState(false)
    const [manualKeywordDialog, setManualKeywordDialog] = useState(false)
    const [addKeywordsDialog, setAddKeywordsDialog] = useState(false)
    const [emptyStateAddOpen, setEmptyStateAddOpen] = useState(false)
    const [rootWordFilter, setRootWordFilter] = useState<'1' | '2' | '3+'>('1')
    const [isUploading, setIsUploading] = useState(false)
    const [isAiFiltering, setIsAiFiltering] = useState(false)

    // Parameters
    const [params, setParams] = useState<ListingParameters>({
        productCharacteristics: '',
        characteristicTags: [],
        characteristicInput: '',
        brandName: '',
        showBrandName: 'beginning',
        productName: '',
        tone: 'formal',
        targetAudience: '',
        avoidWords: ''
    })

    // Content
    const [content, setContent] = useState<ListingContent>({
        title: '', bullet1: '', bullet2: '', bullet3: '', bullet4: '', bullet5: '', description: ''
    })

    // // Suggestion dialog
    // const [suggestionDialog, setSuggestionDialog] = useState(false)
    // const [currentSuggestion, setCurrentSuggestion] = useState<AISuggestion | null>(null)

    // Metrics
    const [metrics, setMetrics] = useState<ListingMetrics>({ generatedVolume: 0 })

    // Limits
    const limits = { titleLimit: 200, bulletLimit: 200, descLimit: 2000 }

    // Enable AI generation if any keywords exist and product characteristics are filled
    const canGenerate = keywords.length > 0 && params.productCharacteristics.trim().length > 0

    // CSV upload
    function handleFileUpload(file: File) {
        setIsUploading(true)
        const reader = new FileReader()
        reader.onload = (e) => {
            const text = e.target?.result as string
            const parsed = parseCerebroCSV(text)
            setTimeout(() => {
                setKeywords(parsed)
                setIsUploading(false)
                setCurrentPage(1)
                toast.success(`Loaded ${parsed.length} keywords from Cerebro file`)

                // Live enrich missing metrics via DataForSEO (Labs Amazon by default)
                const marketplace = typeof window !== 'undefined' ? (new URL(window.location.href).searchParams.get('marketplace') || 'US') : 'US'
                toast.message('Fetching keyword volumes…', { description: 'Contacting DataForSEO' })
                enrichKeywords(parsed.map(k => ({ phrase: k.phrase, searchVolume: k.searchVolume })), marketplace)
                    .then(items => {
                        if (!items || items.length === 0) return
                        setKeywords(prev => prev.map(k => {
                            const hit = items.find(x => x.phrase.toLowerCase() === k.phrase.toLowerCase())
                            if (!hit) return k
                            return { ...k, searchVolume: hit.searchVolume ?? 0 }
                        }))
                        toast.success(`Updated volumes for ${items.length} keywords`)
                    })
                    .catch(() => { toast.error('Failed to fetch volumes (will use cache next time)') })
            }, 500)
        }
        reader.readAsText(file)
    }

    function addManualKeyword(phrase: string) {
        if (!phrase.trim()) return
        const newKw = { phrase: phrase.trim(), searchVolume: 0, sales: 0, cps: null, selected: true }
        setKeywords(prev => [...prev, newKw])
        setManualKeyword('')
        toast.success('Keyword added!')

        // Enrich just this keyword
        const marketplace = typeof window !== 'undefined' ? (new URL(window.location.href).searchParams.get('marketplace') || 'US') : 'US'
        toast.message('Fetching keyword volume…')
        enrichKeywords([newKw].map(k => ({ phrase: k.phrase, searchVolume: k.searchVolume })), marketplace)
            .then(items => {
                if (!items || items.length === 0) return
                const map = new Map(items.map(i => [i.phrase.toLowerCase(), i]))
                setKeywords(prev => prev.map(k => {
                    const hit = map.get(k.phrase.toLowerCase())
                    return hit ? { ...k, searchVolume: hit.searchVolume ?? 0 } : k
                }))
                toast.success('Volume updated')
            })
            .catch(() => { toast.error('Failed to fetch volume') })
    }

    function toggleKeyword(phrase: string) {
        setKeywords(prev => prev.map(k => k.phrase === phrase ? { ...k, selected: !k.selected } : k))
    }

    function updateScore() {
        const selected = keywords.filter(k => k.selected)
        const used = selected.filter(k => keywordIsUsed(k.phrase, content))
        const volume = used.reduce((sum, k) => sum + k.searchVolume, 0)
        setMetrics({ generatedVolume: volume })
    }

    function exportKeywords() {
        if (keywords.length === 0) {
            toast.error('No keywords to export')
            return
        }
        const csvContent = [
            'Keyword,Search Volume,Sales,CPS,Selected',
            ...keywords.map(k => `"${k.phrase}",${k.searchVolume},${k.sales},${k.cps ?? 'N/A'},${k.selected ? 'Yes' : 'No'}`)
        ].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `keyword-bank-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Keywords exported successfully!')
    }

    // Track pending suggestion for each section
    const [pendingSuggestion, setPendingSuggestion] = useState<{ content: string, section: string } | null>(null);

    const generateContentMutation = useMutation({
        mutationFn: async (data: { section: 'title' | 'bullets' | 'description' }) => {
            // Use all keywords for generation
            if (keywords.length === 0) throw new Error('Please add keywords first');
            if (!params.productCharacteristics.trim()) throw new Error('Please fill in product characteristics');

            const response = await fetch('/api/listing/draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName: params.productName || 'Product',
                    brand: params.brandName,
                    category: params.productCharacteristics,
                    keywords: keywords,
                    features: params.characteristicTags,
                    targetAudience: params.targetAudience,
                    marketplace: 'US',
                    templateId: 'professional-seo',
                    section: data.section // Pass the specific section to generate
                })
            })

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Failed to generate content' }))
                throw new Error(error.error || 'Failed to generate content')
            }

            return { ...(await response.json()), section: data.section }
        },
        onSuccess: (data) => {
            // Store suggestion until user applies/discards
            if (data.section === 'title') {
                setPendingSuggestion({ content: data.title, section: 'title' });
            } else if (data.section === 'bullets') {
                setPendingSuggestion({ content: data.bullets.join('\n\n'), section: 'bullet' });
            } else if (data.section === 'description') {
                setPendingSuggestion({ content: data.description, section: 'description' });
            }
            toast.success('Content generated successfully!');
        },
        onError: (e: Error) => toast.error(e.message)
    });

    // Apply suggestion and clear pending
    function applySuggestion() {
        if (!pendingSuggestion) return;
        if (pendingSuggestion.section === 'title') {
            setContent(c => ({ ...c, title: pendingSuggestion.content }));
        } else if (pendingSuggestion.section === 'bullet') {
            const bullets = pendingSuggestion.content.split('\n\n');
            setContent(c => ({ ...c, bullet1: bullets[0] || '', bullet2: bullets[1] || '', bullet3: bullets[2] || '', bullet4: bullets[3] || '', bullet5: bullets[4] || '' }));
        } else if (pendingSuggestion.section === 'description') {
            setContent(c => ({ ...c, description: pendingSuggestion.content }));
        }
        setPendingSuggestion(null);
        updateScore();
        toast.success('Suggestion applied!');
    }

    // Discard suggestion
    function discardSuggestion() {
        setPendingSuggestion(null);
    }

    // function regenerateSuggestion() {
    //     if (!currentSuggestion) return
    //     setSuggestionDialog(false)
    //     setTimeout(() => {
    //         generateContentMutation.mutate({ section: currentSuggestion.section === 'bullet' ? 'bullets' : currentSuggestion.section })
    //     }, 100)
    // }

    // Autosave: debounce content changes when a draft id exists in URL
    const autosaveRef = useRef<NodeJS.Timeout | null>(null)
    const [saving, setSaving] = useState(false)
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
    useEffect(() => {
        const draftId = typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('id') : null
        if (!draftId) return
        const hasContent = content.title || content.description || content.bullet1 || content.bullet2 || content.bullet3 || content.bullet4 || content.bullet5 || keywords.length > 0
        if (!hasContent) return
        if (autosaveRef.current) clearTimeout(autosaveRef.current)
        autosaveRef.current = setTimeout(async () => {
            try {
                setSaving(true)
                console.log('Autosaving with keywords:', keywords.length, keywords.slice(0, 3))
                const payload = {
                    title: content.title,
                    bullets: [content.bullet1, content.bullet2, content.bullet3, content.bullet4, content.bullet5],
                    description: content.description,
                    keywords: keywords,
                    params: params // Save AI parameters
                }
                console.log('Autosave payload:', payload)
                const res = await fetch(`/api/listing/draft?id=${draftId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                if (res.ok) {
                    setLastSavedAt(new Date())
                } else {
                    const err = await res.json().catch(() => ({}))
                    console.warn('Autosave failed', err)
                }
            } catch {
                // Optional toast can be noisy during typing
            } finally {
                setSaving(false)
            }
        }, 1200)
        return () => {
            if (autosaveRef.current) clearTimeout(autosaveRef.current)
        }
    }, [content.title, content.description, content.bullet1, content.bullet2, content.bullet3, content.bullet4, content.bullet5, keywords, params])

    // Auto-select keywords present in content
    useEffect(() => {
        if (keywords.length === 0) return;
        const text = [content.title, content.bullet1, content.bullet2, content.bullet3, content.bullet4, content.bullet5, content.description].join(' ').toLowerCase();
        const updated = keywords.map(k => ({
            ...k,
            selected: text.includes(k.phrase.toLowerCase())
        }));
        // If no keywords are selected, select the first one
        if (!updated.some(k => k.selected) && updated.length > 0) {
            updated[0].selected = true;
        }
        // Only update if changed
        const isDifferent = updated.some((k, i) => k.selected !== keywords[i].selected);
        if (isDifferent) {
            setKeywords(updated);
        }
    }, [content.title, content.bullet1, content.bullet2, content.bullet3, content.bullet4, content.bullet5, content.description, keywords, keywords.length]);

    return {
        // state
        keywords, manualKeyword, bulkKeywordText, sortBy, currentPage, keywordsPerPage,
        keywordBankOpen, rootKeywordsOpen, parametersOpen, manualKeywordDialog, addKeywordsDialog, emptyStateAddOpen,
        rootWordFilter, isUploading, isAiFiltering, params, content, metrics, limits, canGenerate, saving, lastSavedAt,
        pendingSuggestion,
        // setters
        setManualKeyword, setBulkKeywordText, setSortBy, setCurrentPage, setKeywordBankOpen,
        setRootKeywordsOpen, setParametersOpen, setManualKeywordDialog, setAddKeywordsDialog, setEmptyStateAddOpen,
        setRootWordFilter, setIsAiFiltering, setParams, setContent, setKeywords,
        // actions
        handleFileUpload, addManualKeyword, toggleKeyword, updateScore, exportKeywords,
        applySuggestion, discardSuggestion,
        // mutation
        generateContentMutation
    }
}
