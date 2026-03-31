# Campaign UX Overhaul - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the upload page into a 3-step campaign wizard with sender context, tone controls, CSV support, and improved AI prompts so companies can send truly customized emails with minimal effort.

**Architecture:** Add a "Business Profile" section to Settings that stores sender context (company, product, role) in the existing `users.settings` JSONB column. Rebuild the upload page as a stepper wizard (Step 1: Campaign Config, Step 2: Upload, Step 3: Preview & Send). Pass sender context + tone + custom instructions through the API to the AI service, which injects them into prompts. No database schema changes needed.

**Tech Stack:** Next.js 14 App Router, React, Tailwind CSS, shadcn/ui components, OpenRouter AI API, XLSX + Papa Parse for file parsing.

---

### Task 1: Add CSV support to file parsing

**Files:**
- Modify: `app/(dashboard)/dashboard/upload/page.tsx` (lines 331-338 dropzone config, line 73 processExcelFile)
- Modify: `package.json` (add papaparse dependency)

**Step 1: Install papaparse**

Run: `npm install papaparse && npm install -D @types/papaparse`

**Step 2: Update the dropzone to accept CSV files**

In `upload/page.tsx`, update the `useDropzone` config (lines 331-338):

```tsx
const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  accept: {
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-excel': ['.xls'],
    'text/csv': ['.csv'],
  },
  maxFiles: 1
})
```

**Step 3: Add CSV parsing alongside Excel parsing**

In `processExcelFile`, detect file type and parse accordingly:

```tsx
import Papa from 'papaparse'

const processFile = useCallback(async (file: File) => {
  // ... existing validation ...

  const isCSV = file.name.toLowerCase().endsWith('.csv')

  let headers: string[]
  let dataRows: any[][]

  if (isCSV) {
    const text = await file.text()
    const parsed = Papa.parse(text, { header: false, skipEmptyLines: true })
    headers = (parsed.data[0] as string[])
    dataRows = parsed.data.slice(1) as any[][]
  } else {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
    headers = jsonData[0] as string[]
    dataRows = jsonData.slice(1) as any[][]
  }

  // ... rest of parsing logic uses headers + dataRows ...
})
```

**Step 4: Update UI text**

Change "Upload Excel File" to "Upload Leads File" and ".xlsx or .xls file" to ".xlsx, .xls, or .csv file" in the dropzone text.

**Step 5: Commit**

```bash
git add package.json package-lock.json app/(dashboard)/dashboard/upload/page.tsx
git commit -m "feat: add CSV file support to lead upload"
```

---

### Task 2: Add Business Profile to Settings page

**Files:**
- Modify: `app/(dashboard)/dashboard/settings/page.tsx` (add Business Profile card)

**Step 1: Extend the SettingsData interface**

Add a new `businessProfile` section to the interface and defaults:

```tsx
interface SettingsData {
  businessProfile: {
    senderName: string
    senderRole: string
    companyName: string
    productDescription: string
    valueProposition: string
    defaultTone: 'friendly' | 'professional' | 'casual' | 'bold'
    customInstructions: string
  }
  emailSettings: { /* existing */ }
  // ... rest unchanged
}
```

Default values:
```tsx
businessProfile: {
  senderName: '',
  senderRole: '',
  companyName: '',
  productDescription: '',
  valueProposition: '',
  defaultTone: 'friendly',
  customInstructions: ''
}
```

**Step 2: Add Business Profile card UI**

Add as the FIRST card in the settings page, above Email Settings:

```tsx
{/* Business Profile - for AI email personalization */}
<Card className="p-6">
  <div className="flex items-center space-x-2 mb-2">
    <Building2 className="h-5 w-5 text-gray-400" />
    <h2 className="text-xl font-semibold text-gray-900">Business Profile</h2>
  </div>
  <p className="text-sm text-gray-500 mb-6">
    This information is used by AI to write personalized emails on your behalf. Fill this once and it applies to all campaigns.
  </p>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
      <input type="text" value={settings.businessProfile.senderName}
        onChange={(e) => handleInputChange('businessProfile', 'senderName', e.target.value)}
        placeholder="e.g. Alex Johnson"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Your Role</label>
      <input type="text" value={settings.businessProfile.senderRole}
        onChange={(e) => handleInputChange('businessProfile', 'senderRole', e.target.value)}
        placeholder="e.g. Head of Sales"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
      <input type="text" value={settings.businessProfile.companyName}
        onChange={(e) => handleInputChange('businessProfile', 'companyName', e.target.value)}
        placeholder="e.g. Acme Solutions"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Default Tone</label>
      <select value={settings.businessProfile.defaultTone}
        onChange={(e) => handleInputChange('businessProfile', 'defaultTone', e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="friendly">Friendly - Like a helpful colleague</option>
        <option value="professional">Professional - Polished and business-like</option>
        <option value="casual">Casual - Relaxed and conversational</option>
        <option value="bold">Bold - Direct and confident</option>
      </select>
    </div>
  </div>

  <div className="mt-6">
    <label className="block text-sm font-medium text-gray-700 mb-2">What do you offer?</label>
    <textarea value={settings.businessProfile.productDescription}
      onChange={(e) => handleInputChange('businessProfile', 'productDescription', e.target.value)}
      rows={2} placeholder="e.g. We help SaaS companies automate their outbound sales with AI-powered email campaigns."
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
    <p className="text-xs text-gray-400 mt-1">1-2 sentences about your product or service</p>
  </div>

  <div className="mt-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">Key benefit for prospects</label>
    <textarea value={settings.businessProfile.valueProposition}
      onChange={(e) => handleInputChange('businessProfile', 'valueProposition', e.target.value)}
      rows={2} placeholder="e.g. Our clients typically see 3x more replies and save 10 hours per week on outreach."
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
    <p className="text-xs text-gray-400 mt-1">What makes prospects want to reply?</p>
  </div>

  <div className="mt-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">Custom AI Instructions (optional)</label>
    <textarea value={settings.businessProfile.customInstructions}
      onChange={(e) => handleInputChange('businessProfile', 'customInstructions', e.target.value)}
      rows={2} placeholder="e.g. Always mention our free trial. Never use the word 'innovative'. Reference the prospect's company size if available."
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
    <p className="text-xs text-gray-400 mt-1">Extra instructions the AI should follow when writing emails</p>
  </div>
</Card>
```

Import `Building2` from lucide-react.

**Step 3: Commit**

```bash
git add app/(dashboard)/dashboard/settings/page.tsx
git commit -m "feat: add business profile section to settings for AI personalization"
```

---

### Task 3: Rebuild upload page as 3-step campaign wizard

**Files:**
- Modify: `app/(dashboard)/dashboard/upload/page.tsx` (full rewrite of the page)

**Step 1: Add stepper state and sender context state**

Replace the existing flat layout with a step-based wizard. Add state for:

```tsx
const [step, setStep] = useState<1 | 2 | 3>(1)

// Step 1: Campaign config (existing + new fields)
const [campaignName, setCampaignName] = useState('')
const [campaignDescription, setCampaignDescription] = useState('')
const [senderContext, setSenderContext] = useState({
  senderName: '',
  senderRole: '',
  companyName: '',
  productDescription: '',
  valueProposition: '',
  tone: 'friendly' as 'friendly' | 'professional' | 'casual' | 'bold',
  customInstructions: ''
})
```

**Step 2: Fetch business profile defaults on mount**

```tsx
useEffect(() => {
  const fetchDefaults = async () => {
    try {
      const res = await fetch('/api/user/settings')
      if (res.ok) {
        const data = await res.json()
        const bp = data.settings?.businessProfile
        if (bp) {
          setSenderContext(prev => ({
            senderName: bp.senderName || prev.senderName,
            senderRole: bp.senderRole || prev.senderRole,
            companyName: bp.companyName || prev.companyName,
            productDescription: bp.productDescription || prev.productDescription,
            valueProposition: bp.valueProposition || prev.valueProposition,
            tone: bp.defaultTone || prev.tone,
            customInstructions: bp.customInstructions || prev.customInstructions,
          }))
        }
      }
    } catch (e) { /* silent fail, user fills manually */ }
  }
  fetchDefaults()
}, [])
```

**Step 3: Build the 3-step UI layout**

Top of page: Step indicator bar showing steps 1-2-3 with active/completed states.

```
Step 1: "Campaign Setup" — Campaign name, description, sender context (pre-filled from settings), tone dropdown, custom instructions text box
Step 2: "Upload Leads" — File dropzone (CSV/XLSX/XLS), parsed data preview table
Step 3: "Preview & Send" — AI-generated email previews, confirm send or save draft
```

Step 1 card fields:
- Campaign Name (required)
- Campaign Description (optional)
- Collapsible "Sender & AI Settings" section (pre-filled from settings, user can override):
  - Your Name, Your Role, Company Name (row of 3)
  - What you offer (textarea)
  - Key benefit (textarea)
  - Tone (dropdown: Friendly/Professional/Casual/Bold)
  - Custom Instructions (textarea)
- "Next" button (disabled if campaign name is empty)

Step 2: Existing dropzone + parsed data preview table (show first 5 rows with column headers). "Back" and "Process with AI" buttons.

Step 3: The existing preview dialog content but inline on the page instead of a modal. Show 3 sample AI emails. "Back", "Save as Draft", and "Send All Emails" buttons.

**Step 4: Pass sender context to campaign creation API**

When creating the campaign, include sender context in the request body:

```tsx
body: JSON.stringify({
  name: campaignName,
  description: campaignDescription,
  leads: processedData.leads,
  from_email: 'onboarding@resend.dev',
  from_name: senderContext.companyName || campaignName || 'LeadsTeNet',
  sender_context: senderContext
})
```

**Step 5: Pass sender context to process-campaign API**

```tsx
body: JSON.stringify({
  campaignId: campaignData.campaign.id,
  sendEmails: false,
  senderContext: senderContext
})
```

**Step 6: Commit**

```bash
git add app/(dashboard)/dashboard/upload/page.tsx
git commit -m "feat: rebuild upload page as 3-step campaign wizard with sender context"
```

---

### Task 4: Update campaign API to accept and store sender context

**Files:**
- Modify: `app/api/campaigns/route.ts` (accept sender_context in POST body)
- Modify: `app/api/process-campaign/route.ts` (accept senderContext, pass to AI service)

**Step 1: Update campaign creation to store sender context**

In `app/api/campaigns/route.ts` POST handler, extract `sender_context` from body and pass it to `createCampaign`:

```tsx
const { name, description, leads, domain_id, local_part, from_name, reply_to_email, template_id, sender_context } = body

const campaign = await dbService.createCampaign({
  name,
  description: JSON.stringify({ text: description || '', sender_context: sender_context || {} }),
  from_email: fromEmail,
  from_name: from_name || undefined,
  reply_to_email: reply_to_email || undefined
})
```

Note: We store sender_context inside the description field as JSON. This avoids schema changes. The description field is `TEXT` type in the DB which can hold JSON strings.

**Step 2: Update process-campaign to pass sender context to AI**

In `app/api/process-campaign/route.ts`:

```tsx
interface ProcessCampaignRequest {
  campaignId: string
  channels?: ChannelType[]
  sendEmails?: boolean
  emailConfig?: EmailConfig
  senderContext?: {
    senderName: string
    senderRole: string
    companyName: string
    productDescription: string
    valueProposition: string
    tone: string
    customInstructions: string
  }
}

// Extract from body
const { campaignId, channels = ['email'], sendEmails = false, emailConfig, senderContext } = body

// When no senderContext in request, try to extract from campaign description
let finalSenderContext = senderContext
if (!finalSenderContext) {
  try {
    const parsed = JSON.parse(campaign.description || '{}')
    finalSenderContext = parsed.sender_context
  } catch { /* not JSON, that's fine */ }
}

// Pass to AI service
const aiResponse = await processLeadsWithAI(aiLeads, channels, finalSenderContext)
```

**Step 3: Commit**

```bash
git add app/api/campaigns/route.ts app/api/process-campaign/route.ts
git commit -m "feat: pass sender context through campaign API to AI service"
```

---

### Task 5: Upgrade AI service with sender context and tone-aware prompts

**Files:**
- Modify: `lib/ai-service.ts` (accept sender context, rewrite prompts, fix fallback, remove console.logs)

**Step 1: Update function signatures to accept sender context**

```tsx
interface SenderContext {
  senderName?: string
  senderRole?: string
  companyName?: string
  productDescription?: string
  valueProposition?: string
  tone?: 'friendly' | 'professional' | 'casual' | 'bold'
  customInstructions?: string
}

processLeads = async (
  leads: LeadData[],
  channels: ChannelType[] = ['email'],
  senderContext?: SenderContext
): Promise<AIServiceResponse>
```

Pass `senderContext` down through `generatePersonalizedContent` → `generateChannelContent` → `createChannelPrompt`.

**Step 2: Rewrite email prompt with sender context injection**

The new `createChannelPrompt` for email channel:

```tsx
private createChannelPrompt = (lead: LeadData, channel: ChannelType, availableFields: string[], senderContext?: SenderContext): string => {
  const additionalInfo = availableFields
    .filter(field => !['name', 'email', 'company', 'industry'].includes(field))
    .map(field => `- ${field}: ${lead[field]}`)
    .join('\n')

  const tone = senderContext?.tone || 'friendly'
  const toneDescriptions: Record<string, string> = {
    friendly: 'Warm and approachable, like a helpful colleague. Use contractions, casual phrasing.',
    professional: 'Polished and business-like, but still human. Confident without being stiff.',
    casual: 'Very relaxed and conversational, like texting a work friend. Short sentences, informal.',
    bold: 'Direct and confident. Get straight to the point. No fluff, just value.'
  }

  const senderInfo = senderContext ? `
SENDER CONTEXT (This is who you are writing as):
- Your Name: ${senderContext.senderName || 'not provided'}
- Your Role: ${senderContext.senderRole || 'not provided'}
- Your Company: ${senderContext.companyName || 'not provided'}
- What You Offer: ${senderContext.productDescription || 'not provided'}
- Key Benefit: ${senderContext.valueProposition || 'not provided'}` : ''

  const customInstructions = senderContext?.customInstructions
    ? `\nCUSTOM INSTRUCTIONS FROM SENDER:\n${senderContext.customInstructions}`
    : ''

  const channelPrompts = {
    email: `Write a personalized cold email from the sender to this prospect.

PROSPECT INFORMATION:
- Name: ${lead.name}
- Company: ${lead.company}
- Industry: ${lead.industry}
- Email: ${lead.email}
${additionalInfo ? additionalInfo : ''}
${senderInfo}

TONE: ${tone} - ${toneDescriptions[tone]}
${customInstructions}

RULES:
- Sound like a real human, not AI or marketing software
- Use natural language with contractions
- Be specific to "${lead.company}" in the "${lead.industry}" industry
- Reference the sender's product/service naturally (do NOT pitch aggressively)
- Keep it 60-80 words MAX
- Sign off with the sender's real name and role

STRUCTURE:
1. Short greeting using prospect's first name
2. One specific observation about their company or industry
3. Brief, natural mention of how the sender helps (tied to their product description)
4. Low-pressure question or invitation
5. Sender's name and role as sign-off

AVOID: "I hope this finds you well", "Reaching out to...", "I'd love to pick your brain", any template-sounding phrases, multiple exclamation marks, marketing speak.

Return ONLY valid JSON:
{
  "subject": "short, curiosity-driven subject line",
  "body": "the email body",
  "tone": "${tone}",
  "callToAction": "the closing question or invitation"
}`,
    // linkedin and twitter prompts follow same pattern with senderInfo injected
    linkedin: `Write a short LinkedIn connection message.

PROSPECT: ${lead.name} at ${lead.company} (${lead.industry})
${senderInfo}

Keep under 60 words. Be ${tone}. Mention their company specifically. Reference what you offer naturally.
${customInstructions}

Return JSON: { "subject": "...", "body": "...", "tone": "${tone}", "callToAction": "..." }`,

    twitter: `Write a casual Twitter DM.

PROSPECT: ${lead.name}, ${lead.industry} industry
${senderInfo}

Under 40 words. Very ${tone}. Reference their industry.
${customInstructions}

Return JSON: { "subject": "...", "body": "...", "tone": "${tone}", "callToAction": "..." }`
  }

  return channelPrompts[channel]
}
```

**Step 3: Fix fallback content to use sender context**

Replace hardcoded "Sarah" with sender context:

```tsx
private createFallbackContent = (lead: LeadData, channel: ChannelType, senderContext?: SenderContext): PersonalizedContent => {
  const firstName = lead.name?.split(' ')[0] || lead.name
  const senderName = senderContext?.senderName?.split(' ')[0] || 'The Team'
  const senderRole = senderContext?.senderRole || 'Business Development'
  const senderCompany = senderContext?.companyName || 'LeadsTeNet'

  const fallbackTemplates = {
    email: {
      subject: `Quick question about ${lead.company}`,
      body: `Hi ${firstName},\n\nI've been looking at companies in ${lead.industry} and came across ${lead.company}. We've helped a few teams in your space save time on lead gen and outreach.\n\nWould it make sense to chat for 10 minutes? No pressure.\n\nBest,\n${senderName}\n${senderRole}, ${senderCompany}`,
      tone: senderContext?.tone || 'friendly',
      callToAction: 'Would it make sense to chat for 10 minutes?'
    },
    // ... linkedin and twitter fallbacks similarly updated
  }
}
```

**Step 4: Remove all console.log statements**

Remove every `console.log` call from the file. Keep `console.error` for actual errors only.

**Step 5: Export SenderContext type**

Add to the exports at the bottom:
```tsx
export type { LeadData, PersonalizedContent, ChannelContent, ProcessedLead, AIServiceResponse, ChannelType, SenderContext }
```

**Step 6: Commit**

```bash
git add lib/ai-service.ts
git commit -m "feat: inject sender context and tone into AI prompts, fix fallback, remove debug logs"
```

---

### Task 6: Update processLeadsWithAI helper to pass sender context

**Files:**
- Modify: `lib/ai-service.ts` (update helper function signature)

**Step 1: Update the exported helper function**

```tsx
export const processLeadsWithAI = async (
  leads: LeadData[],
  channels: ChannelType[] = ['email'],
  senderContext?: SenderContext
): Promise<AIServiceResponse> => {
  return await aiService.processLeads(leads, channels, senderContext)
}
```

**Step 2: Commit**

```bash
git add lib/ai-service.ts
git commit -m "feat: update processLeadsWithAI helper to accept sender context"
```

Note: This can be combined with Task 5's commit.

---

### Task 7: Remove console.logs from API routes and services

**Files:**
- Modify: `app/api/process-campaign/route.ts` (remove ~15 console.log lines)
- Modify: `app/(dashboard)/dashboard/upload/page.tsx` (remove ~5 console.log lines)
- Modify: `lib/email-service.ts` (remove ~20 console.log lines, especially the one logging API key)
- Modify: `lib/domain-service.ts` (remove console.log lines)

**Step 1: Remove all `console.log` from process-campaign/route.ts**

Remove lines 17, 29-32, 46-48, 83, 86-89, 119, 128, 142, 147-150, 187. Keep console.error on line 202.

**Step 2: Remove all `console.log` from upload/page.tsx**

Remove lines 118-124, 189-193. Keep console.error on lines 201, 269, 312.

**Step 3: Remove console.log from email-service.ts**

CRITICAL: Remove the API key logging line (line ~50 that logs first 10 chars of Resend key). Remove all other console.log. Keep console.error.

**Step 4: Remove console.log from domain-service.ts**

Remove all console.log. Keep console.error.

**Step 5: Commit**

```bash
git add app/api/process-campaign/route.ts app/(dashboard)/dashboard/upload/page.tsx lib/email-service.ts lib/domain-service.ts
git commit -m "chore: remove debug console.log statements from production code"
```

---

### Task 8: Convert sample file to XLSX and update download link

**Files:**
- Modify: `public/sample-leads.csv` (keep for backward compat)
- Create: `public/sample-leads.xlsx` (new sample file in Excel format)
- Modify: `app/(dashboard)/dashboard/upload/page.tsx` (update download link)

**Step 1: Update the download button to offer both formats**

Replace the single download link with:
```tsx
<div className="flex gap-2">
  <a href="/sample-leads.csv" download="sample-leads.csv">
    <Button variant="outline" size="sm">
      <Download className="mr-2 h-4 w-4" />
      Sample CSV
    </Button>
  </a>
  <a href="/sample-leads.xlsx" download="sample-leads.xlsx">
    <Button variant="outline" size="sm">
      <Download className="mr-2 h-4 w-4" />
      Sample XLSX
    </Button>
  </a>
</div>
```

**Step 2: Create the XLSX sample file programmatically**

Write a small script or generate it during build. Or simply note that the CSV sample works now since we added CSV support in Task 1.

Actually, since Task 1 adds CSV support, the existing sample-leads.csv download already works. Just keep both download options.

**Step 3: Commit**

```bash
git add public/ app/(dashboard)/dashboard/upload/page.tsx
git commit -m "feat: update sample download to support both CSV and XLSX formats"
```

---

### Task 9: Final integration test and build verification

**Step 1: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 2: Run lint**

Run: `npm run lint`
Expected: No errors (warnings acceptable).

**Step 3: Manual test checklist**

1. Go to Settings → Business Profile → Fill in sender details → Save
2. Go to Upload Leads → Verify Step 1 shows pre-filled sender context from settings
3. Override tone to "Professional" for this campaign
4. Upload sample-leads.csv → Verify it parses correctly
5. Upload sample-leads.xlsx → Verify it parses correctly
6. Check parsed data preview table shows correct columns
7. Click "Process with AI" → Verify AI-generated emails reference:
   - The prospect's company name
   - The prospect's industry
   - YOUR product/service description
   - YOUR sender name in the sign-off
   - The selected tone
8. Verify custom instructions are reflected in output
9. Save as draft OR send emails

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete campaign wizard UX overhaul with sender context and AI personalization"
```

---

## Summary of All Changes

| # | Task | Files Changed | Effort |
|---|------|---------------|--------|
| 1 | CSV support | upload/page.tsx, package.json | Small |
| 2 | Business Profile in Settings | settings/page.tsx | Small |
| 3 | 3-step wizard UI | upload/page.tsx (major rewrite) | Large |
| 4 | API updates for sender context | campaigns/route.ts, process-campaign/route.ts | Small |
| 5 | AI prompt rewrite with sender context | ai-service.ts | Medium |
| 6 | Helper function update | ai-service.ts | Tiny |
| 7 | Remove console.logs | 4 files | Small |
| 8 | Sample file updates | upload/page.tsx, public/ | Tiny |
| 9 | Build verification | - | Small |
