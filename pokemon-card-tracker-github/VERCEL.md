
# Deploy to Vercel

1) Go to https://vercel.com/new
2) Drag-and-drop this folder.
3) In "Environment Variables", add:
   - NAME: COUNTDOWN_API_KEY
   - VALUE: your_key_here
   - ENV: Production (and Preview if you want)
4) Deploy. Done.

Notes
- This is a Next.js 14 App Router project; Vercel auto-detects settings.
- API routes: /api/og (scrapes title/image) and /api/prices (fetches sold prices).
- If you don't set COUNTDOWN_API_KEY, the app still works but prices will show "—".


**Note:** Do not set a custom 'Output Directory' for Next.js. Leave it blank so Vercel auto-detects.
