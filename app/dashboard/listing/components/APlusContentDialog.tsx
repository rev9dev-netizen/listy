/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { ImageIcon, SparklesIcon } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function APlusContentDialog({ open, onOpenChange }: Props) {
  const [formData, setFormData] = useState({
    brandStory: "",
    headline: "",
    keyMessages: ["", "", ""],
    layoutStyle: "banner",
  });

  const handleKeyMessageChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      keyMessages: prev.keyMessages.map((msg, i) => (i === index ? value : msg)),
    }));
  };

  const handleGenerate = () => {
    console.log("A+ Content generation requested:", formData);
    alert("A+ Content generation coming soon! This feature is under development.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-h-[90vh] overflow-hidden flex flex-col w-[95vw]"
        style={{ maxWidth: '95vw' }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ImageIcon className="h-6 w-6" />
            Create A+ Content
          </DialogTitle>
          <DialogDescription>
            Configure your Amazon A+ Content. Watch the preview update in real-time as you type.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden py-4">
          {/* Left Column: Form Inputs */}
          <div className="space-y-4 overflow-y-auto pr-4">
            {/* Headline */}
            <div className="space-y-2">
              <Label htmlFor="headline" className="font-medium text-sm">
                Main Headline
              </Label>
              <Input
                id="headline"
                placeholder="e.g., 'Happea Snacking' or 'Better for You, Better for the Earth'"
                value={formData.headline}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, headline: e.target.value }))
                }
              />
            </div>

            {/* Brand Story */}
            <div className="space-y-2">
              <Label htmlFor="brandStory" className="font-medium text-sm">
                Brand Story / Overview
              </Label>
              <Textarea
                id="brandStory"
                placeholder="Tell your brand's story... What makes your product unique?"
                value={formData.brandStory}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, brandStory: e.target.value }))
                }
                rows={3}
                className="text-sm"
              />
            </div>

            {/* Layout Style */}
            <div className="space-y-2">
              <Label className="font-medium text-sm">Layout Style</Label>
              <Select
                value={formData.layoutStyle}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, layoutStyle: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select layout style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">Hero Banner + Feature Grid</SelectItem>
                  <SelectItem value="comparison">Comparison Table</SelectItem>
                  <SelectItem value="story">Brand Story Carousel</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle + Benefits</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Key Selling Messages */}
            <div className="space-y-3">
              <Label className="font-medium text-sm">Key Selling Messages (3)</Label>
              {formData.keyMessages.map((msg, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6">
                    {index + 1}.
                  </span>
                  <Input
                    placeholder={`Key message ${index + 1}...`}
                    value={msg}
                    onChange={(e) => handleKeyMessageChange(index, e.target.value)}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Live Preview */}
          <div className="border-2 border-dashed rounded-lg p-4 overflow-y-auto bg-muted/20">
            <div className="text-xs font-medium text-muted-foreground mb-3 flex items-center justify-between">
              <span>LIVE PREVIEW</span>
              <span className="text-[10px] uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded">
                {formData.layoutStyle.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-md overflow-hidden shadow-sm min-h-[500px]">
              {formData.layoutStyle === 'banner' && (
                <BannerPreview data={formData} />
              )}
              {formData.layoutStyle === 'comparison' && (
                <ComparisonPreview data={formData} />
              )}
              {formData.layoutStyle === 'story' && (
                <StoryPreview data={formData} />
              )}
              {formData.layoutStyle === 'lifestyle' && (
                <LifestylePreview data={formData} />
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} className="gap-2">
            <SparklesIcon className="h-4 w-4" />
            Generate A+ Content
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Banner Layout Preview
function BannerPreview({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {data.headline || "YOUR HEADLINE HERE"}
        </h1>
        <p className="text-sm text-gray-800 max-w-2xl mx-auto">
          {data.brandStory || "Your brand story will appear here..."}
        </p>
      </div>
      
      {/* Feature Grid */}
      <div className="grid grid-cols-3 gap-4 p-4">
        {data.keyMessages.map((msg: string, i: number) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-center">
            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-2"></div>
            <p className="text-xs font-medium">
              {msg || `Feature ${i + 1}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Comparison Table Preview
function ComparisonPreview({ data }: { data: any }) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-center mb-4">
        {data.headline || "PRODUCT COMPARISON"}
      </h2>
      <table className="w-full text-xs border">
        <thead className="bg-primary/10">
          <tr>
            <th className="border p-2 text-left">Feature</th>
            <th className="border p-2">Our Product</th>
            <th className="border p-2">Competitor</th>
          </tr>
        </thead>
        <tbody>
          {data.keyMessages.map((msg: string, i: number) => (
            <tr key={i}>
              <td className="border p-2">{msg || `Feature ${i + 1}`}</td>
              <td className="border p-2 text-center">✓</td>
              <td className="border p-2 text-center">✗</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Story Carousel Preview
function StoryPreview({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* Slide 1 */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">
          {data.headline || "OUR STORY"}
        </h2>
        <p className="text-sm opacity-90">
          {data.brandStory || "Your brand narrative..."}
        </p>
      </div>
      
      {/* Slides 2-4 */}
      <div className="grid grid-cols-3 gap-2 px-4">
        {data.keyMessages.map((msg: string, i: number) => (
          <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-800 rounded p-3 flex items-center justify-center text-center">
            <p className="text-[10px] font-medium">
              {msg || `Story Point ${i + 1}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Lifestyle Layout Preview
function LifestylePreview({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {/* Left: Lifestyle Image */}
      <div className="bg-gradient-to-br from-green-400 to-blue-400 rounded aspect-square flex items-center justify-center">
        <ImageIcon className="h-16 w-16 text-white/50" />
      </div>
      
      {/* Right: Benefits */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">
          {data.headline || "BETTER FOR YOU"}
        </h2>
        <p className="text-xs text-muted-foreground">
          {data.brandStory || "Lifestyle description..."}
        </p>
        <div className="space-y-2">
          {data.keyMessages.map((msg: string, i: number) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-1"></div>
              <p className="text-xs">{msg || `Benefit ${i + 1}`}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
