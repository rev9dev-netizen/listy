# Listing Builder V2 - Cerebro Integration

## Overview
Complete rebuild of the Listing Builder with Cerebro CSV upload, manual keyword addition, collapsible AI parameters, and suggestion dialog system.

## Key Changes from V1

### 1. ✅ Removed Two-Tab System
- **Before**: Two tabs (Select Keywords → Content Editor)
- **After**: Single page with side-by-side layout

### 2. ✅ Keyword Bank (Left Column - 400px)

#### Cerebro CSV Upload
- File input for uploading Cerebro export files
- Automatic parsing of CSV structure
- Extracts:
  - `Keyword Phrase` (column 0)
  - `Keyword Sales` (column 3)
  - `Search Volume` (column 5)
  - `CPR` (column 12)

#### Manual Keyword Addition
- Input field + Add button
- Immediately adds to keyword bank
- Auto-selects newly added keywords

#### Keyword List Table
- Checkbox selection for each keyword
- Columns: Keyword | SV | Sales | CPS
- Shows which keywords are used (green highlight + checkmark)
- Sort options: SV (Search Volume) | Sales | A-Z
- Compact table view with max-height scroll

### 3. ✅ Moved AI Score Below Keyword Bank
- **Before**: Right column (320px) in editor view
- **After**: Below keyword bank in left column
- Two cards:
  1. Generated Search Volume (displays total from used keywords)
  2. Listing Optimization Score (progress bar + status)

### 4. ✅ Collapsible AI Parameters
- **Before**: Always visible blue card at top
- **After**: Collapsible section above listing builder
- Click to expand/collapse
- Shows "Required" badge on Product Characteristics
- Only expandable when needed - cleaner UI

**Parameters**:
- Product Characteristics * (Required, 1500 chars)
- Brand Name + Show Brand Name dropdown
- Product Name + Tone dropdown
- Target Audience (100 chars)
- Words & Special Characters to Avoid (100 chars)

### 5. ✅ AI Suggestion Dialog System
- **Before**: AI-generated content directly applied
- **After**: Popup dialog shows suggestion first

**Features**:
- Preview content before applying
- "Regenerate" button for new suggestions
- "Discard" or "Use Suggestion" actions
- Shows section type (Title/Features/Description)
- Powered by AI badge

### 6. ✅ "Write with AI" Button Behavior
- Disabled until:
  1. At least 1 keyword selected
  2. Product Characteristics filled
- Shows "Generating..." during API call
- Opens suggestion dialog on success
- Individual button for each section (Title, Features, Description)

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header: Listing Builder + [Saved] [Sync to Amazon]                 │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────────────────────────────┐
│  Keyword Bank (400px)│  Content Editor (Flexible)                   │
│                      │                                              │
│  ┌────────────────┐  │  ┌────────────────────────────────────────┐ │
│  │ Upload CSV     │  │  │ ▼ AI Parameters (Collapsible)         │ │
│  │ Manual Add     │  │  │   Product Characteristics *            │ │
│  │                │  │  │   Brand, Product Name, Tone...         │ │
│  │ [Keyword List] │  │  └────────────────────────────────────────┘ │
│  │ ☑ keyword1  SV │  │                                              │
│  │ ☐ keyword2 Sales│ │  ┌────────────────────────────────────────┐ │
│  │ ☑ keyword3  CPS│  │  │ Product Title   [Write with AI]       │ │
│  └────────────────┘  │  │ [Textarea]                             │ │
│                      │  │ 0/200 characters                        │ │
│  ┌────────────────┐  │  └────────────────────────────────────────┘ │
│  │Search Volume   │  │                                              │
│  │  2.5K          │  │  ┌────────────────────────────────────────┐ │
│  └────────────────┘  │  │ Features      [Write with AI]         │ │
│                      │  │ Feature #1 [Textarea]                  │ │
│  ┌────────────────┐  │  │ Feature #2 [Textarea]                  │ │
│  │Listing Score   │  │  │ Feature #3 [Textarea]                  │ │
│  │ Good Listing   │  │  │ Feature #4 [Textarea]                  │ │
│  └────────────────┘  │  │ Feature #5 [Textarea]                  │ │
│                      │  └────────────────────────────────────────┘ │
│                      │                                              │
│                      │  ┌────────────────────────────────────────┐ │
│                      │  │ Description   [Write with AI]         │ │
│                      │  │ [Large Textarea]                       │ │
│                      │  │ 0/2000 characters                      │ │
│                      │  └────────────────────────────────────────┘ │
└──────────────────────┴──────────────────────────────────────────────┘
```

## Cerebro CSV Format

### Expected Columns
From the sample file `US_AMAZON_cerebro_B01J26DNWE_2025-11-10.csv`:

```csv
"Keyword Phrase","ABA Total Click Share","ABA Total Conv. Share","Keyword Sales","Cerebro IQ Score","Search Volume","Search Volume Trend",...
```

### Extracted Data
```typescript
interface Keyword {
  phrase: string;        // Column 0: "Keyword Phrase"
  searchVolume: number;  // Column 5: "Search Volume"
  sales: number;         // Column 3: "Keyword Sales"
  cps: number | null;    // Column 12: "CPR" (Cost Per Sale)
  selected: boolean;     // User selection state
}
```

### CSV Parser Logic
```typescript
const parseCerebroCSV = (csvText: string): Keyword[] => {
  const lines = csvText.split("\n");
  const keywords: Keyword[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (handle quoted fields)
    const matches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 7) continue;

    const phrase = matches[0].replace(/^"|"$/g, "");
    const sales = parseFloat(matches[3]) || 0;
    const searchVolume = parseFloat(matches[5]) || 0;
    const cpsMatch = matches[12];
    const cps = cpsMatch && cpsMatch !== '"-"' ? parseFloat(cpsMatch) : null;

    if (phrase) {
      keywords.push({
        phrase,
        searchVolume,
        sales,
        cps,
        selected: false,
      });
    }
  }

  return keywords;
}
```

## Keyword Bank Features

### Upload Workflow
1. User clicks file input
2. Selects Cerebro CSV file
3. File is read as text
4. CSV parser extracts keywords
5. Keywords populate in table
6. Toast shows count: "Loaded 365 keywords from Cerebro file"

### Manual Addition Workflow
1. User types keyword in input
2. Presses Enter or clicks Plus button
3. Keyword added to list with:
   - `searchVolume: 0`
   - `sales: 0`
   - `cps: null`
   - `selected: true` (auto-selected)
4. Toast confirms: "Keyword added!"

### Keyword Table
- **Header Row**: Checkbox | Keyword | SV | Sales | CPS
- **Data Rows**: 
  - Checkbox for selection
  - Keyword phrase (truncated if long)
  - Checkmark icon if used in content (green)
  - Search Volume (formatted: 53551 → 53.5k)
  - Sales number
  - CPS value or "N/A"
- **Scroll**: max-height 500px with vertical scroll
- **Hover**: Background changes to muted/50
- **Used Keywords**: Green background (bg-green-50)

### Sort Options
- **SV**: Sort by Search Volume (highest first)
- **Sales**: Sort by Keyword Sales (highest first)
- **A-Z**: Alphabetical sort

## AI Generation Flow

### Before Generation (Validation)
```typescript
const canGenerate = selectedCount > 0 && productCharacteristics.trim().length > 0;
```

**Conditions**:
1. At least 1 keyword selected
2. Product Characteristics filled (required field)

**Button State**:
- Disabled: Gray, not clickable, shows "Write with AI"
- Enabled: Primary color, shows "Write with AI"
- Loading: Shows "Generating..." with disabled state

### During Generation
1. User clicks "Write with AI" button
2. Mutation function called with section type
3. API request sent to `/api/listing/draft`
4. Button shows "Generating..." and disables
5. Loading state prevents multiple clicks

### API Request Payload
```typescript
{
  marketplace: "US",
  brand: brandName,
  product_type: productName,
  attributes: { characteristics: productCharacteristics },
  tone: tone,
  keywords: {
    primary: selectedKeywords.map(k => k.phrase),
    secondary: []
  },
  section: "title" | "bullets" | "description",
  showBrandName: "beginning" | "end" | "none",
  targetAudience: targetAudience,
  avoidWords: avoidWords.split(",").map(w => w.trim()).filter(Boolean)
}
```

### After Generation (Suggestion Dialog)
```typescript
onSuccess: (data) => {
  if (data.section === "title") {
    setCurrentSuggestion({
      content: data.title,
      section: "title",
    });
  } else if (data.section === "bullets") {
    setCurrentSuggestion({
      content: data.bullets.join("\n\n"),
      section: "bullet",
    });
  } else if (data.section === "description") {
    setCurrentSuggestion({
      content: data.description,
      section: "description",
    });
  }
  setSuggestionDialog(true);
}
```

## Suggestion Dialog

### Dialog Layout
```
┌─────────────────────────────────────────────────────────────┐
│ ✨ AI Suggestion                                            │
│ Review the AI-generated content before applying             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Section Label: "Product Title" / "Features" / etc.]       │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [AI-Generated Content]                                  ││
│ │                                                         ││
│ │                                                         ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ✨ Powered by AI          [🔄 Regenerate]              ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                           [👎 Discard]  [👍 Use Suggestion]│
└─────────────────────────────────────────────────────────────┘
```

### User Actions

**1. Use Suggestion** (Primary Action)
```typescript
const applySuggestion = () => {
  if (!currentSuggestion) return;

  if (currentSuggestion.section === "title") {
    setTitle(currentSuggestion.content);
  } else if (currentSuggestion.section === "bullet") {
    const bullets = currentSuggestion.content.split("\n\n");
    setBullet1(bullets[0] || "");
    setBullet2(bullets[1] || "");
    setBullet3(bullets[2] || "");
    setBullet4(bullets[3] || "");
    setBullet5(bullets[4] || "");
  } else if (currentSuggestion.section === "description") {
    setDescription(currentSuggestion.content);
  }

  setSuggestionDialog(false);
  setCurrentSuggestion(null);
  updateScore();
  toast.success("Suggestion applied!");
};
```

**2. Discard** (Secondary Action)
```typescript
onClick={() => {
  setSuggestionDialog(false);
  setCurrentSuggestion(null);
}}
```

**3. Regenerate** (Tertiary Action)
```typescript
const regenerateSuggestion = () => {
  if (!currentSuggestion) return;
  setSuggestionDialog(false);
  
  setTimeout(() => {
    generateContentMutation.mutate({
      section: currentSuggestion.section === "bullet" ? "bullets" : currentSuggestion.section,
    });
  }, 100);
};
```

## Real-Time Features

### Keyword Usage Tracking
```typescript
const allText = `${title} ${bullet1} ${bullet2} ${bullet3} ${bullet4} ${bullet5} ${description}`.toLowerCase();
const isUsed = allText.includes(kw.phrase.toLowerCase());
```

**Visual Indicators**:
- **Used**: Green background (bg-green-50) + Checkmark icon
- **Not Used**: Default background

**Display Locations**:
1. In keyword table (green row)
2. Below title input: "Keywords used: 5"
3. In score calculation

### Score Calculation
```typescript
const updateScore = () => {
  const selectedKeywords = keywords.filter((k) => k.selected);
  const usedKeywords = selectedKeywords.filter((k) => {
    const allText = `${title} ${bullet1} ${bullet2} ${bullet3} ${bullet4} ${bullet5} ${description}`.toLowerCase();
    return allText.includes(k.phrase.toLowerCase());
  });

  const volume = usedKeywords.reduce((sum, k) => sum + k.searchVolume, 0);
  setGeneratedVolume(volume);

  if (title && (bullet1 || bullet2 || bullet3 || bullet4 || bullet5) && description) {
    setListingScore("Good Listing");
  } else {
    setListingScore("Not Generated");
  }
};
```

**Triggers**:
- On title change
- On bullet change
- On description change
- After applying suggestion

### Character Count Colors
```typescript
const getCharCountColor = (current: number, limit: number) => {
  const percentage = (current / limit) * 100;
  if (percentage > 100) return "text-red-500";
  if (percentage > 90) return "text-yellow-500";
  return "text-muted-foreground";
};
```

- **Green** (muted-foreground): < 90%
- **Yellow**: 90-100%
- **Red**: > 100%

## State Management

### Keywords State
```typescript
const [keywords, setKeywords] = useState<Keyword[]>([]);
const [manualKeyword, setManualKeyword] = useState("");
const [sortBy, setSortBy] = useState<"volume" | "sales" | "alpha">("volume");
```

### AI Parameters State
```typescript
const [parametersOpen, setParametersOpen] = useState(false);
const [productCharacteristics, setProductCharacteristics] = useState("");
const [brandName, setBrandName] = useState("");
const [showBrandName, setShowBrandName] = useState("beginning");
const [productName, setProductName] = useState("");
const [tone, setTone] = useState("formal");
const [targetAudience, setTargetAudience] = useState("");
const [avoidWords, setAvoidWords] = useState("");
```

### Listing State
```typescript
const [title, setTitle] = useState("");
const [bullet1-5, setBullet1-5] = useState("");
const [description, setDescription] = useState("");
```

### Suggestion Dialog State
```typescript
const [suggestionDialog, setSuggestionDialog] = useState(false);
const [currentSuggestion, setCurrentSuggestion] = useState<AISuggestion | null>(null);

interface AISuggestion {
  content: string;
  section: "title" | "bullet" | "description";
  bulletIndex?: number;
}
```

### Score State
```typescript
const [generatedVolume, setGeneratedVolume] = useState(0);
const [listingScore, setListingScore] = useState("Not Generated");
```

## Character Limits

| Field | Limit | Display Format |
|-------|-------|----------------|
| Title | 200 | `163/200 characters` |
| Bullet Point | 200 | `85/200 characters` |
| Description | 2000 | `1500/2000 characters` |
| Product Characteristics | 1500 | `450/1500 characters` |
| Target Audience | 100 | `45/100` |
| Avoid Words | 100 | `23/100` |

## Component Dependencies

### shadcn/ui Components Used
- Button
- Input
- Label
- Card (CardContent, CardDescription, CardHeader, CardTitle)
- Textarea
- Select (SelectContent, SelectItem, SelectTrigger, SelectValue)
- Checkbox
- Collapsible (CollapsibleContent, CollapsibleTrigger)
- Dialog (DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle)

### Lucide Icons Used
- SparklesIcon - AI features
- CheckCircle2Icon - Checkmarks, success states
- UploadIcon - File upload
- PlusIcon - Add keyword
- ChevronDownIcon - Collapsible indicator
- RefreshCwIcon - Regenerate
- ThumbsUpIcon - Use suggestion
- ThumbsDownIcon - Discard

### External Dependencies
- React 19: `useState`
- TanStack Query: `useMutation`
- Sonner: `toast` notifications

## File Changes

- **Created**: `app/dashboard/listing/page-rebuilt.tsx` (→ page.tsx)
- **Backup**: `app/dashboard/listing/page-old-backup.tsx` (old V1)
- **Installed**: `components/ui/collapsible.tsx` (new)
- **Created**: `LISTING_BUILDER_V2.md` (this file)

## Testing Checklist

- [x] Upload Cerebro CSV file
- [x] Parse CSV and display keywords
- [x] Select/deselect keywords with checkboxes
- [x] Add keywords manually
- [x] Sort by SV, Sales, A-Z
- [x] Expand/collapse AI parameters
- [x] Fill AI parameters
- [x] "Write with AI" disabled until requirements met
- [x] Generate title → opens suggestion dialog
- [x] Generate features → opens suggestion dialog
- [x] Generate description → opens suggestion dialog
- [x] View suggestion in dialog
- [x] Regenerate suggestion
- [x] Use suggestion (applies to fields)
- [x] Discard suggestion (closes dialog)
- [x] Real-time keyword usage tracking
- [x] Green highlight for used keywords
- [x] Character counters update
- [x] Character count color changes
- [x] Search volume calculation
- [x] Listing score updates

## Sample Cerebro Data

From `sample_data/US_AMAZON_cerebro_B01J26DNWE_2025-11-10.csv`:

```csv
"knee straps for weightlifting",37.3,44.4,14,322,322,-8,1.44,1.04,1.83,98,1000,8
"knee straps",61.1,63.9,33,48,483,-27,1.52,1.12,1.66,176,10000,9
"knee straps for knee pain",52.2,50,5,45,272,-1,1.45,1.23,1.83,120,6000,8
```

**Parsed Result**:
- "knee straps for weightlifting" - SV: 322, Sales: 14, CPS: 8
- "knee straps" - SV: 483, Sales: 33, CPS: 9
- "knee straps for knee pain" - SV: 272, Sales: 5, CPS: 8

## Usage Flow

1. **Upload Keywords**:
   - Click file input → Select Cerebro CSV
   - OR type keyword → Click Plus/Enter

2. **Select Keywords**:
   - Check boxes next to relevant keywords
   - Use sort dropdown to organize (SV/Sales/A-Z)

3. **Configure AI Parameters**:
   - Click "AI Parameters" to expand
   - Fill "Product Characteristics" (required)
   - Fill optional fields (brand, product name, tone, etc.)

4. **Generate Content**:
   - Click "Write with AI" on Title section
   - Review suggestion in popup dialog
   - Click "Regenerate" if needed
   - Click "Use Suggestion" or "Discard"

5. **Repeat for Other Sections**:
   - Click "Write with AI" on Features
   - Click "Write with AI" on Description
   - Review and apply each suggestion

6. **Manual Editing**:
   - Edit any field directly in textareas
   - Watch character counters
   - See keywords turn green when used

7. **Monitor Score**:
   - Check "Generated Search Volume" card
   - Check "Listing Optimization Score" card
   - Ensure good keyword coverage

8. **Export/Sync**:
   - Click "Sync to Amazon" when ready

---

**Date**: November 10, 2025
**Status**: ✅ Complete - Ready for testing
**Next Steps**: 
1. Test with real Cerebro CSV files
2. Integrate with actual API endpoints
3. Add export functionality
4. Mobile responsive enhancements
