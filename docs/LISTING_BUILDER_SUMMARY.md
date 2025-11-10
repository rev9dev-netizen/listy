# Listing Builder Rebuild Summary

## What Was Changed

Completely rebuilt the Listing Builder page (`app/dashboard/listing/page.tsx`) to match the Helium 10 interface shown in your screenshots.

## Key Features

### Two-Tab Workflow

**Tab 1: Select Keywords**

- 🔍 Find Keywords using AI + Amazon (mock data for now)
- ➕ Manually Add Keywords (instant addition)
- ✓ Checkbox selection for each keyword
- 📊 Search volume display
- 🔀 Sort by volume or alphabetical
- ➡️ Continue button to move to editor

**Tab 2: Content Editor**

- **Three-column layout**:
  - **Left**: Selected keywords with usage tracking (green when used)
  - **Center**: Listing editor with AI parameters + content fields
  - **Right**: AI score and optimization details

### AI Parameters (Blue Card at Top)

Located prominently in the center column:

- Product Characteristics (1500 chars)
- Brand Name + Show Brand Name dropdown
- Product Name + Tone dropdown
- Target Audience (100 chars)
- Words & Special Characters to Avoid (100 chars)

### Individual AI Buttons

Each section has its own "AI Assist" button:

- **Title** (200 char limit)
- **Features** (5 bullets, 200 chars each)
- **Description** (2000 char limit)

### Real-Time Features

- ✅ Keyword usage tracking (green highlight + checkmark when used)
- 🎯 Character counters with color coding (green/yellow/red)
- 📈 Generated search volume calculation
- 🏆 Listing optimization score
- 📋 Detailed score breakdown (6 criteria)

## Layout Measurements

```
Tab 1: Select Keywords
- Full width card with two sections
- Keyword list with checkboxes

Tab 2: Content Editor
┌──────────────┬─────────────────────────┬──────────────┐
│  280px       │       Flexible          │    320px     │
│  Keywords    │    Content Editor       │   AI Score   │
└──────────────┴─────────────────────────┴──────────────┘
```

## What Works Now

1. ✅ Switch between tabs
2. ✅ Find keywords (mock data - therapy putty example)
3. ✅ Add keywords manually
4. ✅ Select/deselect keywords
5. ✅ Sort keywords by volume/alphabetical
6. ✅ Continue to editor when keywords selected
7. ✅ Fill AI parameters
8. ✅ Click AI Assist to generate title/bullets/description
9. ✅ Edit content manually
10. ✅ See real-time keyword usage in left column
11. ✅ See character counts update
12. ✅ See score update automatically
13. ✅ See which keywords are used (green highlight)

## What Needs Real API Integration

Currently using mock data:

- Keyword discovery returns 7 therapy putty keywords
- AI generation calls `/api/listing/draft` but needs section parameter support
- Search volumes are hardcoded

## Files Changed

- ✏️ **Replaced**: `app/dashboard/listing/page.tsx` (750 lines)
- 📄 **Created**: `LISTING_BUILDER_REBUILD.md` (detailed documentation)
- 📄 **Created**: `LISTING_BUILDER_SUMMARY.md` (this file)

## Character Limits

| Field | Limit | Color Coding |
|-------|-------|-------------|
| Title | 200 | Green < 180, Yellow 180-200, Red > 200 |
| Bullet Point | 200 | Green < 180, Yellow 180-200, Red > 200 |
| Description | 2000 | Green < 1800, Yellow 1800-2000, Red > 2000 |
| Product Characteristics | 1500 | Display only |
| Target Audience | 100 | Display only |
| Avoid Words | 100 | Display only |

## Score Criteria

1. **Product Title**: 80-200 characters
2. **Product Features**: Minimum 5 features, 85-100 chars each
3. **Description**: 1000-2000 characters
4. **Keywords Used**: Minimum 70% of selected keywords used
5. **Backend Search Terms**: 200-249 characters (placeholder)
6. **Product Images**: 7-9 images, min 1000px (placeholder)

## Usage Flow

1. User clicks on "Listing Builder" in navbar
2. Lands on "Select Keywords" tab
3. Either:
   - Enters product characteristics and clicks "Find Keywords"
   - OR manually adds keywords one by one
4. Selects keywords using checkboxes
5. Clicks "Continue to Content Editor"
6. Fills AI parameters (product name, brand, tone, etc.)
7. Clicks "AI Assist" on title → AI generates title
8. Clicks "AI Assist" on features → AI generates 5 bullets
9. Clicks "AI Assist" on description → AI generates description
10. Edits content manually as needed
11. Sees real-time feedback:
    - Left column: Which keywords are used (green)
    - Right column: Score updates automatically
12. Clicks "Sync to Amazon" when done (to be implemented)

## Next Steps

To make it fully functional:

1. **Update API endpoint** (`/api/listing/draft`):
   - Add support for `section` parameter
   - Return only requested section
   - Use AI parameters (showBrandName, targetAudience, avoidWords)

2. **Real keyword discovery**:
   - Integrate Helium 10 API or DataForSEO
   - Real search volume data
   - Competitor ASIN analysis

3. **Backend search terms**:
   - Generate from unused keywords
   - 200-249 character limit
   - Add to score calculation

4. **Image upload**:
   - Upload interface
   - Image analysis (dimensions, quality)
   - Add to score calculation

5. **Export/Sync**:
   - Export to CSV/JSON
   - Sync directly to Amazon Seller Central (via SP-API)

## Testing

The page is ready to test! Navigate to:

- <http://localhost:3000/dashboard/listing>

Try:

1. Click "Find Keywords" (mock data will load)
2. Add a manual keyword
3. Select some keywords
4. Click "Continue to Content Editor"
5. Fill in product characteristics
6. Click "AI Assist" on any section (will call API)
7. Type manually and watch the score update
8. See keywords turn green in left column when used

---

**Status**: ✅ Complete
**Date**: November 10, 2025
**Ready for**: User testing and API integration
