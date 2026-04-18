# Slique — Premium Chauffeur Service Website

## Tech Stack
- **React 18** + Vite
- **Tailwind CSS** + shadcn/ui components
- **Framer Motion** for animations
- **Supabase** for database (bookings + availability)
- **Netlify** for hosting

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase URL, anon key, and admin password

# 3. Set up the database
# Go to Supabase dashboard → SQL Editor → paste supabase-schema.sql → Run

# 4. Start development server
npm run dev
# Open http://localhost:5173
```

## Project Structure

```
src/
├── components/
│   ├── landing/          # Page sections (Hero, Fleet, Booking, etc.)
│   └── ui/               # shadcn/ui base components
├── lib/
│   ├── supabaseClient.js  # Supabase connection
│   ├── query-client.js    # TanStack Query config
│   └── utils.js           # Tailwind class helper
├── pages/
│   ├── Home.jsx           # Public landing page
│   └── Admin.jsx          # Booking management dashboard
├── App.jsx
├── Layout.jsx             # Sticky nav wrapper
└── main.jsx
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `VITE_ADMIN_PASSWORD` | Password to access /Admin dashboard |

## Deploy to Netlify

1. Push to GitHub
2. Connect repo in Netlify dashboard
3. Add environment variables in Netlify → Site Settings → Environment Variables
4. Deploy — `netlify.toml` handles build settings and SPA routing automatically

## Connect Your Domain

In Netlify: Domain Management → Add custom domain → `sliquemoves.com`
Netlify provides free SSL automatically.
