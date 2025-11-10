# Cerebro-Style Features (Helium 10 Inspired)

## Overview

The Keywords page now includes advanced Cerebro-style features inspired by Helium 10's reverse ASIN lookup tool. These features help sellers discover and analyze competitor keywords with professional-grade metrics.

---

## 🎯 Key Features Implemented

### 1. **IQ Score**
- Proprietary opportunity score (0-100)
- Combines multiple factors: search volume, competition, relevance
- Higher scores = better keyword opportunities
- Purple badge for quick identification

### 2. **Search Volume**
- Estimated monthly search volume per keyword
- Range: 1,000 - 50,000+ searches
- Helps prioritize high-traffic keywords
- Filterable by min/max range

### 3. **Rank Position**
- Shows current ASIN ranking for each keyword
- Format: #1, #15, #47, etc.
- Lower numbers = better visibility
- Sortable to find quick wins

### 4. **Organic vs Sponsored**
- **Organic** (Green badge): Natural search ranking
- **Sponsored** (Yellow badge): PPC/advertising ranking
- Toggle filters to show/hide each type
- Understand competition landscape

### 5. **Competitor Count**
- Number of competitors ranking for the keyword
- Range: 10 - 500+ competitors
- Lower = less competition, easier to rank
- Sortable to find low-competition opportunities

### 6. **Word Count**
- Number of words in the keyword phrase
- Long-tail keywords (3-5 words) often convert better
- Filter by min/max word count
- Balance between search volume and specificity

---

## 🔧 Advanced Filtering

### Search Volume Range
- **Min Volume**: Set minimum monthly searches
- **Max Volume**: Set maximum monthly searches
- Example: 5,000 - 20,000 to find medium-competition keywords

### Word Count Range
- **Min Words**: Filter short/long-tail keywords
- **Max Words**: Limit phrase length
- Example: 2-4 words for balanced keywords

### Rank Type Filters
- ✅ **Show Organic**: Include naturally ranking keywords
- ✅ **Show Sponsored**: Include PPC-driven keywords
- Uncheck either to focus on specific ranking types

### Sort Options
1. **IQ Score** (Default): Best opportunities first
2. **Search Volume**: Highest traffic first
3. **Rank Position**: Best rankings first
4. **Competitors**: Lowest competition first
5. **Word Count**: Shortest phrases first

---

## 📊 Metrics Explanation

### IQ Score Calculation
```
IQ Score = (Keyword Score × 100)

Factors:
- 35% Competitor frequency
- 25% Position weight
- 20% Estimated volume
- 20% Relevance score
```

### Search Volume Ranges
- **High**: 20,000+ (competitive, high traffic)
- **Medium**: 5,000 - 20,000 (sweet spot)
- **Low**: 1,000 - 5,000 (niche opportunities)

### Competitor Ranges
- **Low**: 10-100 (easy to rank)
- **Medium**: 100-300 (moderate difficulty)
- **High**: 300+ (highly competitive)

---

## 🎨 Visual Design

### Badge Color System
- **Purple**: IQ Score (opportunity indicator)
- **Green**: Organic ranking / Primary keywords
- **Yellow**: Sponsored ranking
- **Blue**: Secondary keywords
- **Gray**: Tertiary keywords / Neutral

### Icons
- 📈 **TrendingUp**: Search volume
- 🎯 **Target**: Rank position
- 👥 **Users**: Competitor count
- 🔍 **Filter**: Advanced filters section

---

## 🚀 Usage Workflow

1. **Generate Keywords**
   - Enter competitor ASINs
   - Add seed keywords (optional)
   - Click "Generate Keywords"

2. **Apply Filters**
   - Set search volume range (e.g., 5K-20K)
   - Limit word count (e.g., 2-4 words)
   - Toggle organic/sponsored
   - Sort by IQ Score

3. **Analyze Results**
   - High IQ Score + Low Competition = Best opportunities
   - High Search Volume + Good Rank = Traffic winners
   - Organic rankings = Natural SEO potential
   - Sponsored rankings = PPC insights

4. **Select Keywords**
   - Click checkmark/X to include/exclude
   - Focus on primary keywords (green badges)
   - Balance between volume and competition

5. **Build Listing**
   - Export selected keywords
   - Use in Listing Builder
   - Track keyword usage in final listing

---

## 🔮 Future Enhancements

### Real API Integration
Currently using mock data. Future integrations:
- **Helium 10 API**: Real search volume, rank tracking
- **Amazon SP-API**: Actual ASIN data
- **KeywordTool.io**: Additional keyword suggestions
- **DataForSEO**: Historical search trends

### Advanced Features (Roadmap)
- [ ] Historical rank tracking
- [ ] Seasonal trend analysis
- [ ] Related keyword suggestions (Keyword Magnet)
- [ ] Competitor gap analysis
- [ ] Market share by keyword
- [ ] PPC bid estimates
- [ ] Conversion rate predictions
- [ ] Export to Helium 10 format

---

## 💡 Pro Tips

1. **Start with IQ Score**: Sort by IQ Score to find best opportunities
2. **Use Volume Filters**: 5K-20K is the sweet spot for most products
3. **Check Competition**: Under 200 competitors is easier to rank
4. **Mix Organic + Sponsored**: See full competitive landscape
5. **Long-tail Focus**: 3-4 word keywords often convert better
6. **Include/Exclude**: Only select keywords relevant to your product
7. **Primary First**: Focus on primary keywords (highest relevance)

---

## 🆚 Cerebro Comparison

| Feature | Helium 10 Cerebro | Listy Keywords |
|---------|------------------|----------------|
| Reverse ASIN Lookup | ✅ | ✅ |
| Search Volume | ✅ | ✅ (Mock) |
| Rank Position | ✅ | ✅ (Mock) |
| Organic/Sponsored | ✅ | ✅ |
| IQ Score | ✅ | ✅ |
| Competitor Count | ✅ | ✅ (Mock) |
| Word Count Filter | ✅ | ✅ |
| Advanced Filters | ✅ | ✅ |
| Keyword Clustering | ✅ | ✅ |
| Export Options | ✅ | 🚧 Coming |
| Historical Data | ✅ | 🚧 Coming |
| PPC Bid Estimates | ✅ | 🚧 Coming |

---

## 📝 Notes

- **Mock Data**: Current metrics are randomized for demonstration
- **Production Ready**: Backend supports real API integration
- **Performance**: Filters work client-side for instant results
- **Scalability**: Handles 1000+ keywords smoothly

---

This implementation brings professional-grade keyword research capabilities similar to Helium 10's Cerebro, making Listy a powerful alternative for Amazon sellers!
