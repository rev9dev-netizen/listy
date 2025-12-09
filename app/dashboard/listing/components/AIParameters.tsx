"use client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SparklesIcon, ChevronDownIcon, XIcon } from "lucide-react";
import type { ListingParameters } from "../_types";
import { useState, useEffect } from "react";
import { TemplateDialog } from "./TemplateDialog";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  params: ListingParameters;
  setParams: (value: ListingParameters) => void;
}

export function AIParameters({ open, onOpenChange, params, setParams }: Props) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  // Load templates on mount
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);
  
  async function loadTemplates() {
    try {
      setLoadingTemplates(true);
      const res = await fetch('/api/listing/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  }
  
  async function handleSaveTemplate(templateData: any) {
    try {
      const res = await fetch('/api/listing/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...templateData,
          avoidWords: templateData.avoidWords.split(',').map((w: string) => w.trim()).filter(Boolean),
        }),
      });
      
      if (!res.ok) throw new Error('Failed to save template');
      
      const { template } = await res.json();
      toast.success('Template created successfully');
      await loadTemplates(); // Reload templates
      setField('selectedTemplateId', template.id); // Select the new template
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  }
  
  const setField = <K extends keyof ListingParameters>(
    key: K,
    value: ListingParameters[K]
  ) => {
    setParams({ ...params, [key]: value });
  };

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === " " || e.key === "," || e.key === "Enter") {
      e.preventDefault();
      const value = params.characteristicInput.trim();
      if (value && !params.characteristicTags.includes(value)) {
        const newTags = [...params.characteristicTags, value];
        setParams({
          ...params,
          characteristicTags: newTags,
          characteristicInput: "",
          productCharacteristics: newTags.join(", "),
        });
      }
    } else if (e.key === "Backspace" && !params.characteristicInput) {
      const newTags = params.characteristicTags.slice(0, -1);
      setParams({
        ...params,
        characteristicTags: newTags,
        productCharacteristics: newTags.join(", "),
      });
    }
  }

  function removeTag(tag: string) {
    const newTags = params.characteristicTags.filter((t) => t !== tag);
    setParams({
      ...params,
      characteristicTags: newTags,
      productCharacteristics: newTags.join(", "),
    });
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <Card className="border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950/30">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                <CardTitle className="text-base">AI Parameters</CardTitle>
              </div>
              <ChevronDownIcon
                className={`h-5 w-5 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </div>
            <CardDescription className="text-left">
              {open
                ? "Enter product characteristics, add your keywords, and automatically generate copy."
                : "Click to expand and configure AI parameters"}
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {/* Template Selector */}
            <div className="space-y-2 pb-3 border-b">
              <Label className="font-medium text-sm">Writing Template</Label>
              <div className="flex gap-2">
                <Select
                  value={params.selectedTemplateId || 'professional-seo'}
                  onValueChange={(v) => {
                    if (v === '__create__') {
                      setTemplateDialogOpen(true);
                    } else {
                      setField('selectedTemplateId', v);
                    }
                  }}
                  disabled={loadingTemplates}
                >
                  <SelectTrigger className="h-9 flex-1">
                    <SelectValue placeholder={loadingTemplates ? "Loading..." : "Select template"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__create__" className="font-medium text-primary">
                      + Create New Template
                    </SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} {template.isSystem && '(Built-in)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 grid-cols-1 lg:grid-cols-[200px_1fr]">
              <div className="space-y-2">
                <Label className="font-medium text-sm">Brand Name</Label>
                <Input
                  value={params.brandName}
                  placeholder="Optional"
                  onChange={(e) => setField("brandName", e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-sm">
                    Product Characteristics *{" "}
                    <span className="text-red-600 font-semibold dark:text-red-400">
                      Required
                    </span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {params.productCharacteristics.length}/1500
                  </p>
                </div>
                <div className="relative min-h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {params.characteristicTags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={params.characteristicInput}
                      onChange={(e) =>
                        setField("characteristicInput", e.target.value)
                      }
                      onKeyDown={handleTagKeyDown}
                      placeholder={
                        params.characteristicTags.length === 0
                          ? "Type and press space or comma to add tags..."
                          : ""
                      }
                      className="flex-1 min-w-[120px] outline-none bg-transparent placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-3 grid-cols-1 lg:grid-cols-[1fr_180px_220px]">
              <div className="space-y-2">
                <Label className="font-medium text-sm">Product Name</Label>
                <Input
                  value={params.productName}
                  placeholder="e.g., Knee Straps"
                  onChange={(e) => setField("productName", e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-sm">Tone</Label>
                <Select
                  value={params.tone}
                  onValueChange={(v) =>
                    setField("tone", v as ListingParameters["tone"])
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-sm">Show Brand Name</Label>
                <Select
                  value={params.showBrandName}
                  onValueChange={(v) =>
                    setField(
                      "showBrandName",
                      v as ListingParameters["showBrandName"]
                    )
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginning">
                      At beginning of title
                    </SelectItem>
                    <SelectItem value="end">At end of title</SelectItem>
                    <SelectItem value="none">Don&apos;t show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-sm">Target Audience</Label>
                  <p className="text-xs text-muted-foreground">
                    {params.targetAudience.length}/100
                  </p>
                </div>
                <Input
                  value={params.targetAudience}
                  placeholder="e.g., Athletes, fitness enthusiasts"
                  onChange={(e) => setField("targetAudience", e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-sm">
                    Words & Special Characters to Avoid
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {params.avoidWords.length}/100
                  </p>
                </div>
                <Input
                  value={params.avoidWords}
                  placeholder="e.g., cheap, bad, expensive, !, @, #"
                  onChange={(e) => setField("avoidWords", e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
      
      <TemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        onSave={handleSaveTemplate}
      />
    </Collapsible>
  );
}
