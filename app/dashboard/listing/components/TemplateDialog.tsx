"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TemplateFormData {
  name: string;
  description: string;
  titleMinChars: number;
  titleMaxChars: number;
  titleRequireKeyword: boolean;
  titleCapitalization: string;
  bulletMinChars: number;
  bulletMaxChars: number;
  bulletCapitalizeFirst: boolean;
  bulletFormat: string;
  descriptionMinChars: number;
  descriptionMaxChars: number;
  useHtmlFormatting: boolean;
  avoidWords: string;
  tone: string;
  includeEmojis: boolean;
  keywordDensity: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (template: TemplateFormData) => void;
  initialData?: Partial<TemplateFormData>;
}

export function TemplateDialog({ open, onOpenChange, onSave, initialData }: Props) {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    titleMinChars: initialData?.titleMinChars || 150,
    titleMaxChars: initialData?.titleMaxChars || 200,
    titleRequireKeyword: initialData?.titleRequireKeyword ?? true,
    titleCapitalization: initialData?.titleCapitalization || "title",
    bulletMinChars: initialData?.bulletMinChars || 180,
    bulletMaxChars: initialData?.bulletMaxChars || 220,
    bulletCapitalizeFirst: initialData?.bulletCapitalizeFirst ?? true,
    bulletFormat: initialData?.bulletFormat || "benefit-feature",
    descriptionMinChars: initialData?.descriptionMinChars || 1500,
    descriptionMaxChars: initialData?.descriptionMaxChars || 2000,
    useHtmlFormatting: initialData?.useHtmlFormatting ?? true,
    avoidWords: initialData?.avoidWords || "",
    tone: initialData?.tone || "professional",
    includeEmojis: initialData?.includeEmojis || false,
    keywordDensity: initialData?.keywordDensity || "medium",
  });

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert("Please enter a template name");
      return;
    }
    onSave(formData);
    onOpenChange(false);
  };

  const updateField = <K extends keyof TemplateFormData>(
    key: K,
    value: TemplateFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Template</DialogTitle>
          <DialogDescription>
            Define how AI should write your listing content
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="title">Title</TabsTrigger>
            <TabsTrigger value="bullets">Bullets</TabsTrigger>
            <TabsTrigger value="description">Description</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g., My Custom Template"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Brief description of when to use this template"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Writing Tone</Label>
                <Select value={formData.tone} onValueChange={(v) => updateField("tone", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Keyword Density</Label>
                <Select value={formData.keywordDensity} onValueChange={(v) => updateField("keywordDensity", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Natural)</SelectItem>
                    <SelectItem value="medium">Medium (Balanced)</SelectItem>
                    <SelectItem value="high">High (SEO Focused)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Include Emojis</Label>
              <Switch
                checked={formData.includeEmojis}
                onCheckedChange={(checked) => updateField("includeEmojis", checked)}
              />
            </div>
            <div className="space-y-2">
              <Label>Words to Avoid (comma-separated)</Label>
              <Input
                value={formData.avoidWords}
                onChange={(e) => updateField("avoidWords", e.target.value)}
                placeholder="cheap, bad, expensive"
              />
            </div>
          </TabsContent>

          {/* Title Tab */}
          <TabsContent value="title" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Characters</Label>
                <Input
                  type="number"
                  value={formData.titleMinChars}
                  onChange={(e) => updateField("titleMinChars", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Characters</Label>
                <Input
                  type="number"
                  value={formData.titleMaxChars}
                  onChange={(e) => updateField("titleMaxChars", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Capitalization Style</Label>
              <Select value={formData.titleCapitalization} onValueChange={(v) => updateField("titleCapitalization", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sentence">Sentence case</SelectItem>
                  <SelectItem value="title">Title Case</SelectItem>
                  <SelectItem value="all-caps">ALL CAPS</SelectItem>
                  <SelectItem value="none">No specific style</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Require Primary Keyword in Title</Label>
              <Switch
                checked={formData.titleRequireKeyword}
                onCheckedChange={(checked) => updateField("titleRequireKeyword", checked)}
              />
            </div>
          </TabsContent>

          {/* Bullets Tab */}
          <TabsContent value="bullets" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Characters per Bullet</Label>
                <Input
                  type="number"
                  value={formData.bulletMinChars}
                  onChange={(e) => updateField("bulletMinChars", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Characters per Bullet</Label>
                <Input
                  type="number"
                  value={formData.bulletMaxChars}
                  onChange={(e) => updateField("bulletMaxChars", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bullet Format</Label>
              <Select value={formData.bulletFormat} onValueChange={(v) => updateField("bulletFormat", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="benefit-feature">Benefit → Feature</SelectItem>
                  <SelectItem value="feature-only">Features Only</SelectItem>
                  <SelectItem value="descriptive">Descriptive Story</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Capitalize First Word</Label>
              <Switch
                checked={formData.bulletCapitalizeFirst}
                onCheckedChange={(checked) => updateField("bulletCapitalizeFirst", checked)}
              />
            </div>
          </TabsContent>

          {/* Description Tab */}
          <TabsContent value="description" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Characters</Label>
                <Input
                  type="number"
                  value={formData.descriptionMinChars}
                  onChange={(e) => updateField("descriptionMinChars", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Characters</Label>
                <Input
                  type="number"
                  value={formData.descriptionMaxChars}
                  onChange={(e) => updateField("descriptionMaxChars", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Use HTML Formatting (Bold, Line Breaks)</Label>
              <Switch
                checked={formData.useHtmlFormatting}
                onCheckedChange={(checked) => updateField("useHtmlFormatting", checked)}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
