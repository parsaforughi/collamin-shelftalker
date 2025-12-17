# IceBall Winter Portrait Generator

A minimalist Next.js 14 + TailwindCSS experience that pairs your portrait with Luxirana's Ice Ball reference and relays both to the NanoBanana API for cinematic winter campaign imagery.

## Features
- App Router architecture with a custom API route that streams portraits to NanoBanana alongside the included Ice Ball reference asset.
- Calm white interface inspired by Apple aesthetics, Framer Motion snowflake loader, and responsive layout for mobile + desktop.
- Ready for Vercel deployment with TypeScript, TailwindCSS, and environment-driven configuration.

## Getting Started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment**
   Copy the template and update the NanoBanana key if needed:
   ```bash
   cp .env.local.example .env.local
   ```
3. **Run the dev server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` and upload a portrait.

## Deployment
- Push the project to GitHub and deploy with [Vercel](https://vercel.com/). The included settings (App Router + `/app/api/generate`) work out-of-the-box.
- Set the `NANOBANANA_KEY` secret in the Vercel dashboard.
- Target domain: `iceball.luxirana.ir` (configure as a custom domain once the Vercel project is live).

## Project Structure
```
app/
  layout.tsx        // Global layout & fonts
  page.tsx          // Upload UI + Framer Motion interactions
  api/generate/     // Serverless route calling NanoBanana
public/
  iceball_ref.png   // Ice Ball reference asset sent to the API
```

## Notes
- The API route validates uploads, injects the provided cinematic prompt, and attaches the bundled reference before calling NanoBanana.
- For production, consider rate limiting and stronger file validation (file type/size) before forwarding to the provider.
