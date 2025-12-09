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
    const [aiDisclaimerOpen, setAiDisclaimerOpen] = useState(false)
    const [pendingAISection, setPendingAISection] = useState<'title' | 'bullets' | 'description' | null>(null)


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
        title: '', bullet1: '', bullet2: '', bullet3: '', bullet4: '', bullet5: '', description: '', searchTerms: ''
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

    // Track pending suggestions for each section separately
    const [titleSuggestion, setTitleSuggestion] = useState<string | null>(null);
    const [bulletSuggestions, setBulletSuggestions] = useState<(string | null)[]>([null, null, null, null, null]);
    const [descriptionSuggestion, setDescriptionSuggestion] = useState<string | null>(null);
    const [generatingSection, setGeneratingSection] = useState<'title' | 'bullets' | 'description' | null>(null);

    const generateContentMutation = useMutation({
        mutationFn: async (data: { section: 'title' | 'bullets' | 'description' }) => {
            setGeneratingSection(data.section);
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
                    templateId: params.selectedTemplateId || 'professional-seo',
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
            setGeneratingSection(null);
            // Store suggestions by section type
            if (data.section === 'title') {
                setTitleSuggestion(data.title);
            } else if (data.section === 'bullets') {
                // Split bullets into individual suggestions
                const bullets = Array.isArray(data.bullets) ? data.bullets : [];
                setBulletSuggestions([
                    bullets[0] || null,
                    bullets[1] || null,
                    bullets[2] || null,
                    bullets[3] || null,
                    bullets[4] || null,
                ]);
            } else if (data.section === 'description') {
                setDescriptionSuggestion(data.description);
            }
            toast.success('Content generated successfully!');
        },
        onError: (e: Error) => {
            setGeneratingSection(null);
            toast.error(e.message);
        }
    });

    // Apply suggestions with optional bullet index
    function applySuggestion(bulletIndex?: number) {
        if (bulletIndex !== undefined && bulletSuggestions[bulletIndex]) {
            // Apply specific bullet suggestion
            const suggestion = bulletSuggestions[bulletIndex];
            const bulletKeys = ['bullet1', 'bullet2', 'bullet3', 'bullet4', 'bullet5'] as const;
            setContent(c => ({ ...c, [bulletKeys[bulletIndex]]: suggestion! }));
            
            // Clear only this bullet's suggestion
            setBulletSuggestions(prev => prev.map((s, i) => i === bulletIndex ? null : s));
            toast.success('Suggestion applied!');
        } else if (titleSuggestion) {
            // Apply title suggestion
            setContent(c => ({ ...c, title: titleSuggestion }));
            setTitleSuggestion(null);
            toast.success('Title suggestion applied!');
        } else if (descriptionSuggestion) {
            // Apply description suggestion
            setContent(c => ({ ...c, description: descriptionSuggestion }));
            setDescriptionSuggestion(null);
            toast.success('Description suggestion applied!');
        }
        updateScore();
    }

    // Discard suggestions with optional bullet index
    function discardSuggestion(bulletIndex?: number) {
        if (bulletIndex !== undefined) {
            // Discard specific bullet suggestion
            setBulletSuggestions(prev => prev.map((s, i) => i === bulletIndex ? null : s));
        } else {
            // Discard title or description suggestion based on what's active
            setTitleSuggestion(null);
            setDescriptionSuggestion(null);
        }
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
                    // Persist AI parameters
                    productName: params.productName,
                    brand: params.brandName,
                    targetAudience: params.targetAudience,
                    tone: params.tone,
                    features: params.characteristicTags,
                    avoidWords: params.avoidWords ? params.avoidWords.split(',').map(s => s.trim()).filter(Boolean) : []
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
        const updated = keywords.map(k => {
            // Auto-select ONLY if it's a phrase (more than 1 word)
            const isPhrase = k.phrase.trim().split(/\s+/).length > 1;
            if (isPhrase) {
                return { ...k, selected: text.includes(k.phrase.toLowerCase()) };
            }
            // For single words, keep existing manual selection state
            return k;
        });
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

    // Helper to request AI generation (shows disclaimer first)
    function requestAIGeneration(section: 'title' | 'bullets' | 'description') {
        setPendingAISection(section);
        setAiDisclaimerOpen(true);
    }

    // Handle disclaimer acceptance
    function handleAIDisclaimerAccept() {
        if (pendingAISection) {
            generateContentMutation.mutate({ section: pendingAISection });
            setPendingAISection(null);
        }
    }

    return {
        // state
        keywords, manualKeyword, bulkKeywordText, sortBy, currentPage, keywordsPerPage,
        keywordBankOpen, rootKeywordsOpen, parametersOpen, manualKeywordDialog, addKeywordsDialog, emptyStateAddOpen,
        rootWordFilter, isUploading, isAiFiltering, params, content, metrics, limits, canGenerate, saving, lastSavedAt,
        titleSuggestion, bulletSuggestions, descriptionSuggestion, generatingSection,
        aiDisclaimerOpen, pendingAISection,
        // setters
        setManualKeyword, setBulkKeywordText, setSortBy, setCurrentPage, setKeywordBankOpen,
        setRootKeywordsOpen, setParametersOpen, setManualKeywordDialog, setAddKeywordsDialog, setEmptyStateAddOpen,
        setRootWordFilter, setIsAiFiltering, setParams, setContent, setKeywords,
        setAiDisclaimerOpen,
        // actions
        handleFileUpload, addManualKeyword, toggleKeyword, updateScore, exportKeywords,
        applySuggestion, discardSuggestion,
        requestAIGeneration, handleAIDisclaimerAccept,
        // mutation
        generateContentMutation
    }
}
