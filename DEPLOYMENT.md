# Eidify Deployment Guide

## Architecture
- **Frontend**: Vercel (React app)
- **Backend**: Railway (Python FastAPI + AI models)
- **Database/Storage**: Supabase

## Railway Deployment

### 1. Get Supabase Credentials

Go to your Supabase project dashboard:
https://supabase.com/dashboard/project/ozzjcuamqslxjcfgtfhj

**Settings → API**:
- `SUPABASE_URL`: Project URL (e.g., https://ozzjcuamqslxjcfgtfhj.supabase.co)
- `SUPABASE_ANON_KEY`: anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: service_role key (keep secret!)

**Settings → API → JWT Settings**:
- `SUPABASE_JWT_SECRET`: JWT Secret

### 2. Deploy to Railway

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select `NexusFilm/eidify`
4. Railway will auto-detect Python and use `railway.json` config

### 3. Add Environment Variables

In Railway project settings, add:

```bash
# Required
PORT=8080
PYTHON_VERSION=3.11

# Supabase
ENABLE_SUPABASE=true
SUPABASE_URL=https://ozzjcuamqslxjcfgtfhj.supabase.co
SUPABASE_ANON_KEY=<paste-your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<paste-your-service-role-key>
SUPABASE_JWT_SECRET=<paste-your-jwt-secret>
```

### 4. Deploy

Railway will automatically:
- Install Python 3.11
- Install dependencies from `requirements.txt`
- Download the LaMa AI model (~500MB)
- Start the FastAPI server on port $PORT

**First deployment takes 5-10 minutes** (downloading AI models)

### 5. Get Your Backend URL

After deployment, Railway gives you a URL like:
`https://eidify-production.up.railway.app`

Save this - you'll need it for the frontend.

## Frontend Deployment (Vercel)

### 1. Build the Frontend

```bash
cd web_app
npm install
npm run build
```

### 2. Deploy to Vercel

```bash
cd web_app
npx vercel --prod
```

Or connect via Vercel dashboard:
1. Go to https://vercel.com/new
2. Import `NexusFilm/eidify`
3. Set root directory to `web_app`
4. Add environment variable:
   - `VITE_BACKEND`: Your Railway URL (e.g., https://eidify-production.up.railway.app)

## Cost Estimate

- **Railway Hobby Plan**: $5/month (8GB RAM, 8 vCPU)
- **Supabase Free Tier**: $0 (500MB database, 1GB storage)
- **Vercel Free Tier**: $0 (100GB bandwidth)

**Total: $5/month**

## Scaling Considerations

Railway Hobby Plan limits:
- 8GB RAM (enough for LaMa model)
- CPU-only (no GPU)
- Processing time: ~5-10 seconds per image

For faster processing or more users:
- Upgrade to Railway Pro ($20/month, 32GB RAM)
- Or add Replicate API as fallback for peak loads

## Monitoring

Railway provides:
- Real-time logs
- CPU/Memory metrics
- Deployment history
- Automatic restarts on crashes

## Troubleshooting

### Build fails with "Out of memory"
- Upgrade to Railway Pro (32GB RAM)
- Or reduce model size in `railway.json`

### Models not loading
- Check logs for download errors
- Ensure enough disk space (models are ~2GB total)

### Supabase connection fails
- Verify environment variables are set correctly
- Check Supabase project is not paused (free tier pauses after 7 days inactivity)

### Frontend can't reach backend
- Check CORS settings in `iopaint/api.py`
- Verify `VITE_BACKEND` URL is correct
- Ensure Railway service is running
