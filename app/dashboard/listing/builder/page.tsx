"use client";
import { useListingBuilder } from "../useListingBuilder";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense, useMemo } from "react";
import { toast } from "sonner";
import { ListingHeader } from "../components/ListingHeader";
import { KeywordBank } from "../components/KeywordBank";
import { RootKeywords } from "../components/RootKeywords";
import { ListingAnalysis } from "../components/ListingAnalysis";
import { AIParameters } from "../components/AIParameters";
import { TitleEditor } from "../components/TitleEditor";
import { BulletsEditor } from "../components/BulletsEditor";
import { DescriptionEditor } from "../components/DescriptionEditor";
import { SearchTermsEditor } from "../components/SearchTermsEditor";
import { AIDisclaimerDialog } from "../components/AIDisclaimerDialog";
import { AddKeywordsDialog } from "../components/AddKeywordsDialog";

function ListingBuilderContent() {
  const builder = useListingBuilder();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [finishing, setFinishing] = useState(false);
  const hasLoadedRef = useRef(false);

  // Load existing draft content when id parameter is present (only once)
  useEffect(() => {
    const draftId = searchParams.get("id");
    if (!draftId || hasLoadedRef.current) return;

    const loadDraft = async () => {
      try {
        const res = await fetch(`/api/listing/draft?id=${draftId}`);
        if (!res.ok) return; // No draft yet, that's ok

        const draft = await res.json();
        console.log("Loaded draft:", draft);
        console.log("Draft keywords:", draft.keywords);

        // Load content into builder
        const bullets = Array.isArray(draft.bullets) ? draft.bullets : [];
        builder.setContent({
          title: draft.title || "",
          bullet1: bullets[0] || "",
          bullet2: bullets[1] || "",
          bullet3: bullets[2] || "",
          bullet4: bullets[3] || "",
          bullet5: bullets[4] || "",
          description: draft.description || "",
        });

        // Load AI parameters into builder
        // Map persistent fields back to builder state
        const savedParams = { ...builder.params }
        let hasUpdates = false
        
        if (draft.productName) { savedParams.productName = draft.productName; hasUpdates = true }
        if (draft.brand) { savedParams.brandName = draft.brand; hasUpdates = true }
        if (draft.targetAudience) { savedParams.targetAudience = draft.targetAudience; hasUpdates = true }
        if (draft.tone) { savedParams.tone = draft.tone; hasUpdates = true }
        if (Array.isArray(draft.features)) { savedParams.characteristicTags = draft.features; hasUpdates = true }
        if (Array.isArray(draft.avoidWords)) { savedParams.avoidWords = draft.avoidWords.join(', '); hasUpdates = true }
        
        // Backward compatibility with old params object if exists
        if (draft.params) {
             builder.setParams({ ...savedParams, ...draft.params })
        } else if (hasUpdates) {
             builder.setParams(savedParams)
        }

        // Load keywords into builder
        if (Array.isArray(draft.keywords) && draft.keywords.length > 0) {
          console.log(
            "Loading keywords:",
            draft.keywords.length,
            draft.keywords
          );
          builder.setKeywords(draft.keywords);
        } else {
          console.log("No keywords to load or invalid format:", draft.keywords);
        }
        hasLoadedRef.current = true;
      } catch (err) {
        console.error("Failed to load draft:", err);
      }
    };

    loadDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleFinish() {
    const draftId =
      typeof window !== "undefined"
        ? new URL(window.location.href).searchParams.get("id")
        : null;

    const bullets = [
      builder.content.bullet1,
      builder.content.bullet2,
      builder.content.bullet3,
      builder.content.bullet4,
      builder.content.bullet5,
    ];
    try {
      setFinishing(true);
      const res = await fetch("/api/listing/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: draftId || undefined,
          title: builder.content.title,
          bullets,
          description: builder.content.description,
          keywords: builder.keywords,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Finalize failed (${res.status})`);
      }
      toast.success("Listing finalized successfully");
      router.push("/dashboard/listing");
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not finish. Please try again.";
      toast.error(msg);
    } finally {
      setFinishing(false);
    }
  }

  // Get selected keywords for highlighting
  const selectedKeywordPhrases = useMemo(
    () => builder.keywords.filter((k) => k.selected).map((k) => k.phrase),
    [builder.keywords]
  );

  // Get all keywords for autocomplete (phrases only or all?)
  // User said "anything from keyword bank".
  const allKeywordPhrases = useMemo(
    () => builder.keywords.map((k) => k.phrase),
    [builder.keywords]
  );

  return (
    <div className="space-y-6">
      <ListingHeader
        saving={builder.saving}
        lastSavedAt={builder.lastSavedAt}
        onFinish={handleFinish}
        finishing={finishing}
      />
      <div className="grid gap-3 lg:grid-cols-[480px_1fr] h-[calc(100vh-180px)]">
        {/* Left pane */}
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <KeywordBank
              open={builder.keywordBankOpen}
              onOpenChange={builder.setKeywordBankOpen}
              keywords={builder.keywords}
              setKeywords={builder.setKeywords}
              manualKeyword={builder.manualKeyword}
              setManualKeyword={builder.setManualKeyword}
              manualKeywordDialog={builder.manualKeywordDialog}
              setManualKeywordDialog={builder.setManualKeywordDialog}
              emptyStateAddOpen={builder.emptyStateAddOpen}
              setEmptyStateAddOpen={builder.setEmptyStateAddOpen}
              isUploading={builder.isUploading}
              onUpload={builder.handleFileUpload}
              onExport={builder.exportKeywords}
              sortBy={builder.sortBy}
              setSortBy={builder.setSortBy}
              currentPage={builder.currentPage}
              setCurrentPage={builder.setCurrentPage}
              perPage={builder.keywordsPerPage}
              content={builder.content}
              canGenerate={builder.canGenerate}
              generateTitle={() =>
                builder.generateContentMutation.mutate({ section: "title" })
              }
              generateBullets={() =>
                builder.generateContentMutation.mutate({ section: "bullets" })
              }
              generateDescription={() =>
                builder.generateContentMutation.mutate({
                  section: "description",
                })
              }
              generating={builder.generateContentMutation.isPending}
              onToggleKeyword={builder.toggleKeyword}
            />
            {builder.keywords.length > 0 && (
              <div className="space-y-6">
                <RootKeywords
                  open={builder.rootKeywordsOpen}
                  onOpenChange={builder.setRootKeywordsOpen}
                  keywords={builder.keywords}
                  filter={builder.rootWordFilter}
                  setFilter={builder.setRootWordFilter}
                  onToggleKeyword={builder.toggleKeyword}
                  content={builder.content}
                />
                <ListingAnalysis
                  keywords={builder.keywords}
                  content={builder.content}
                  generatedVolume={builder.metrics.generatedVolume}
                />
              </div>
            )}
          </div>
        </div>
        {/* Right pane */}
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            <AIParameters
              open={builder.parametersOpen}
              onOpenChange={builder.setParametersOpen}
              params={builder.params}
              setParams={builder.setParams}
            />
            <TitleEditor
              value={builder.content.title}
              onChange={(v) => builder.setContent((c) => ({ ...c, title: v }))}
              limit={builder.limits.titleLimit}
              keywordsUsed={
                builder.keywords.filter(
                  (k) =>
                    k.selected &&
                    builder.content.title
                      .toLowerCase()
                      .includes(k.phrase.toLowerCase())
                ).length
              }
              canGenerate={builder.canGenerate}
              generate={() => builder.requestAIGeneration("title")}
              generating={builder.generatingSection === "title"}
              pendingSuggestion={builder.titleSuggestion}
              applySuggestion={() => builder.applySuggestion()}
              discardSuggestion={() => builder.discardSuggestion()}
              selectedKeywords={selectedKeywordPhrases}
              allKeywords={allKeywordPhrases}
            />
            <BulletsEditor
              bullets={[
                builder.content.bullet1,
                builder.content.bullet2,
                builder.content.bullet3,
                builder.content.bullet4,
                builder.content.bullet5,
              ]}
              onChange={(i, v) =>
                builder.setContent((c) => ({
                  ...c,
                  bullet1: i === 0 ? v : c.bullet1,
                  bullet2: i === 1 ? v : c.bullet2,
                  bullet3: i === 2 ? v : c.bullet3,
                  bullet4: i === 3 ? v : c.bullet4,
                  bullet5: i === 4 ? v : c.bullet5,
                }))
              }
              limit={builder.limits.bulletLimit}
              canGenerate={builder.canGenerate}
              generate={() => builder.requestAIGeneration("bullets")}
              generating={builder.generatingSection === "bullets"}
              bulletSuggestions={builder.bulletSuggestions}
              applySuggestion={(bulletIndex) => builder.applySuggestion(bulletIndex)}
              discardSuggestion={(bulletIndex) => builder.discardSuggestion(bulletIndex)}
              selectedKeywords={selectedKeywordPhrases}
              allKeywords={allKeywordPhrases}
            />
            <DescriptionEditor
              value={builder.content.description}
              onChange={(v) =>
                builder.setContent((c) => ({ ...c, description: v }))
              }
              limit={builder.limits.descLimit}
              canGenerate={builder.canGenerate}
              generate={() => builder.requestAIGeneration("description")}
              generating={builder.generatingSection === "description"}
              pendingSuggestion={builder.descriptionSuggestion}
              applySuggestion={() => builder.applySuggestion()}
              discardSuggestion={() => builder.discardSuggestion()}
              selectedKeywords={selectedKeywordPhrases}
              allKeywords={allKeywordPhrases}
            />
            <SearchTermsEditor
              value={builder.content.searchTerms}
              onChange={(v) =>
                builder.setContent((c) => ({ ...c, searchTerms: v }))
              }
            />
          </div>
        </div>
      </div>
      <AddKeywordsDialog
        open={builder.addKeywordsDialog}
        setOpen={builder.setAddKeywordsDialog}
        bulkText={builder.bulkKeywordText}
        setBulkText={builder.setBulkKeywordText}
        onAdd={(phrases) => phrases.forEach((p) => builder.addManualKeyword(p))}
      />
      <AIDisclaimerDialog
        open={builder.aiDisclaimerOpen}
        onOpenChange={builder.setAiDisclaimerOpen}
        onAccept={builder.handleAIDisclaimerAccept}
      />
      {/* Inline AI suggestion UI will be handled in editors */}
    </div>
  );
}

export default function ListingBuilderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ListingBuilderContent />
    </Suspense>
  );
}
