"use client";
import { useListingBuilder } from "../useListingBuilder";
import { ListingHeader } from "../components/ListingHeader";
import { KeywordBank } from "../components/KeywordBank";
import { RootKeywords } from "../components/RootKeywords";
import { ListingAnalysis } from "../components/ListingAnalysis";
import { AIParameters } from "../components/AIParameters";
import { TitleEditor } from "../components/TitleEditor";
import { BulletsEditor } from "../components/BulletsEditor";
import { DescriptionEditor } from "../components/DescriptionEditor";
import { AddKeywordsDialog } from "../components/AddKeywordsDialog";
import { AISuggestionDialog } from "../components/AISuggestionDialog";

export default function ListingBuilderPage() {
  const builder = useListingBuilder();

  async function handleFinish() {
    const projectId =
      typeof window !== "undefined"
        ? new URL(window.location.href).searchParams.get("projectId")
        : null;
    if (!projectId) return;
    const bullets = [
      builder.content.bullet1,
      builder.content.bullet2,
      builder.content.bullet3,
      builder.content.bullet4,
      builder.content.bullet5,
    ];
    try {
      await fetch("/api/listing/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: builder.content.title,
          bullets,
          description: builder.content.description,
        }),
      });
    } catch {
      // noop; hook already shows autosave
    }
  }

  return (
    <div className="space-y-6">
      <ListingHeader
        saving={builder.saving}
        lastSavedAt={builder.lastSavedAt}
        onFinish={handleFinish}
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
              generate={() =>
                builder.generateContentMutation.mutate({ section: "title" })
              }
              generating={builder.generateContentMutation.isPending}
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
              generate={() =>
                builder.generateContentMutation.mutate({ section: "bullets" })
              }
              generating={builder.generateContentMutation.isPending}
            />
            <DescriptionEditor
              value={builder.content.description}
              onChange={(v) =>
                builder.setContent((c) => ({ ...c, description: v }))
              }
              limit={builder.limits.descLimit}
              canGenerate={builder.canGenerate}
              generate={() =>
                builder.generateContentMutation.mutate({
                  section: "description",
                })
              }
              generating={builder.generateContentMutation.isPending}
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
      <AISuggestionDialog
        open={builder.suggestionDialog}
        setOpen={builder.setSuggestionDialog}
        loading={builder.generateContentMutation.isPending}
        suggestion={builder.currentSuggestion?.content || null}
        onApply={builder.applySuggestion}
        onRegenerate={builder.regenerateSuggestion}
      />
    </div>
  );
}
