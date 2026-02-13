# Eidify Frontend

React + TypeScript + Vite frontend for Eidify image editing application.

## Quick Deploy to Vercel

### Via Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. **Set Root Directory to `web_app`**
4. Add environment variables:
   - `VITE_BACKEND` - Your Railway backend URL
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
5. Deploy

### Via CLI

```bash
# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_BACKEND=https://your-backend.railway.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
EOF

# Deploy
npx vercel --prod
```

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file:

```bash
VITE_BACKEND=http://localhost:8080
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- Zustand (state management)
- Supabase (auth & storage)
