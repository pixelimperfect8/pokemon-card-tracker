# Pokémon Card Tracker (Next.js 14)

Paste an eBay URL to capture the card title + image, save to your collection, and (optionally) fetch **last sold** prices for **Ungraded / PSA 8 / 9 / 10** via a server API route.

## Local dev
```bash
npm i
npm run dev
# open http://localhost:3000
```

## Deploy to Vercel
1. Push this folder to a GitHub repo (files live at repo **root**).
2. Go to https://vercel.com/new → Import Git Repository → select your repo.
3. (Optional) Add env var `COUNTDOWN_API_KEY` → Deploy.

> No `vercel.json` needed. Leave "Output Directory" blank so Vercel auto-detects Next.js.

## Notes
- Sold prices use CountdownAPI. If no key is set, prices show as "—".
- Data is stored in browser localStorage for now.
