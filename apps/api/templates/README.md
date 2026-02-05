# Course Report Templates

This directory contains the EJS template for generating course PDF reports and development preview files.

## Files

- **`course_report.ejs`** - The main template used by the API to generate PDFs
- **`course_report_preview.html`** - Standalone HTML preview with dummy data for rapid development
- **`generate_preview.js`** - Script to regenerate preview from the .ejs template (optional)

## Development Workflow

### Quick Method (Recommended)

1. **Open the preview in your browser:**
   ```bash
   open course_report_preview.html
   # Or just drag the file into your browser
   ```

2. **Edit the template directly in browser DevTools:**
   - Right-click → Inspect Element
   - Modify HTML/CSS in the Elements tab
   - See changes instantly
   - Use "Edit as HTML" for larger sections

3. **Copy changes back to the .ejs template:**
   - Once happy with your changes, copy the modified HTML
   - Update the corresponding sections in `course_report.ejs`
   - Replace EJS tags (`<%= data.xxx %>`) with your dynamic data placeholders

### Alternative: Generate from Template

If you want to test the actual EJS template with different dummy data:

```bash
# From the templates directory
node generate_preview.js

# Open the generated file
open course_report_preview_generated.html
```

Edit `generate_preview.js` to customize the dummy data.

## Testing the Full PDF Generation

Once you're happy with the template, test the actual PDF generation:

```bash
# From the API directory
pnpm run dev

# Make a request to the endpoint (using curl, Postman, etc.)
curl -X POST http://localhost:8787/admin/reports/course \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId": 123, "schoolYear": 2024}' \
  --output test_report.pdf

open test_report.pdf
```

## Template Data Structure

The template expects a `data` object with the following structure:

```typescript
interface ReportData {
  schoolYear: number              // e.g., 2024
  courseName: string              // e.g., "Artificial Intelligence"
  courseCode: string              // e.g., "CS-101"
  ects: number                    // e.g., 6.0
  degree: string                  // e.g., "Computer Science"
  avgRating: string               // e.g., "4.3"
  distribution: {                 // Rating distribution
    1: number, 2: number, 3: number, 4: number, 5: number
  }
  totalResponses: number          // Total feedback count
  avgWorkloadText: string         // e.g., "Moderate"
  aiSummary: string               // AI-generated summary
  emotions: string[]              // 3 emotions, e.g., ["Happy", "Excited", "Motivated"]
  persona: string                 // Student persona description
  pros: string[]                  // 3-5 positive points
  cons: string[]                  // 3-5 improvement areas
  submissions: Array<{
    rating: number                // 1-5
    workload: string              // e.g., "Heavy"
    date: string                  // e.g., "Jan 15, 2024"
    comment: string | null        // Feedback text or null
  }>
}
```

## Tips

- **Print Preview**: Use browser's print preview (Cmd+P) to see how it looks as a PDF
- **Page Breaks**: The `.page-break` class creates a new page between sections
- **Colors**: Use `printBackground: true` in Puppeteer to preserve background colors
- **Fonts**: Google Fonts (Inter) load from CDN, ensure internet connection for testing
- **Tailwind**: Uses Tailwind CDN, classes work immediately without build step

## Common Tasks

### Change color scheme
Edit the Tailwind classes in the template. Main colors used:
- Black: `bg-black`, `text-black`
- Slate: `bg-slate-50`, `text-slate-500`, `border-slate-100`
- Green: `text-green-600` (for highlights)

### Adjust spacing
Modify padding/margin classes:
- `p-10` = padding: 2.5rem
- `mb-8` = margin-bottom: 2rem
- `gap-8` = gap: 2rem

### Change fonts
Update the Google Fonts URL in `<head>` and the `font-family` in the style block.

### Add/remove sections
Edit the HTML structure. For new dynamic data, add the field to `ReportData` interface in `courseReportService.ts`.
