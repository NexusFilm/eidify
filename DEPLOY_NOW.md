# 🚀 Deploy Eidify Frontend to Vercel

Your backend is already running on Railway. Now let's deploy the frontend!

## ✅ Pre-Deployment Checklist

- [x] Backend deployed to Railway: https://web-production-66480.up.railway.app
- [x] Supabase database configured
- [x] Frontend build passing
- [x] TypeScript errors fixed
- [ ] Deploy to Vercel (you're about to do this!)

## 🎯 Deploy Now (2 Options)

### Option 1: Vercel Dashboard (Easiest - 5 minutes)

1. **Go to Vercel**: https://vercel.com/new

2. **Import Repository**:
   - Click "Import Git Repository"
   - Select `NexusFilm/eidify`
   - Click "Import"

3. **Configure Project**:
   - Click "Edit" next to "Root Directory"
   - Type: `web_app`
   - Click "Continue"

4. **Add Environment Variables**:
   Click "Environment Variables" and add these 3 variables:
   
   | Name | Value |
   |------|-------|
   | `VITE_BACKEND` | `https://web-production-66480.up.railway.app` |
   | `VITE_SUPABASE_URL` | `https://ozzjcuamqslxjcfgtfhj.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | Get from [Supabase Dashboard](https://supabase.com/dashboard/project/ozzjcuamqslxjcfgtfhj/settings/api) |

5. **Deploy**:
   - Click "Deploy"
   - Wait ~2 minutes
   - Done! 🎉

### Option 2: CLI (For Developers)

```bash
# Navigate to frontend directory
cd web_app

# Install dependencies (if not already done)
npm install

# Deploy to Vercel
npx vercel --prod
```

When prompted:
- **Set up and deploy?** Yes
- **Which scope?** Your account
- **Link to existing project?** No
- **Project name?** eidify (or your choice)
- **Directory?** ./ (you're already in web_app)
- **Override settings?** No

Then add environment variables when prompted or in the Vercel dashboard.

## 🧪 Test Your Deployment

After deployment completes, Vercel will give you a URL like:
`https://eidify-xyz123.vercel.app`

### Quick Tests:

1. **Visit the URL** - Should see Eidify interface
2. **Upload an image** - Drag & drop or click to upload
3. **Check browser console** (F12) - Should see no errors
4. **Test authentication** - Click "Sign In" button
5. **Try the chatbot** - Upload image, type "remove background"

## 🐛 Troubleshooting

### "Cannot connect to backend"
- Check that `VITE_BACKEND` is set correctly in Vercel
- Verify Railway backend is running: https://web-production-66480.up.railway.app/api/v1/server-config

### "Supabase connection failed"
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check Supabase project is not paused

### Build fails
- Check Vercel build logs
- Ensure Root Directory is set to `web_app`
- Verify all environment variables are set

### CORS errors
- Backend should already have CORS configured for all origins
- If issues persist, check Railway logs

## 📊 What You'll Have After Deployment

```
┌─────────────────────────────────────┐
│  Frontend (Vercel)                  │
│  https://eidify-xyz.vercel.app      │
│  - React UI                         │
│  - Image upload                     │
│  - Chatbot interface                │
│  - Multi-image gallery              │
└──────────────┬──────────────────────┘
               │
               ↓ API calls
┌─────────────────────────────────────┐
│  Backend (Railway)                  │
│  https://web-production-66480...    │
│  - FastAPI server                   │
│  - AI models (LaMa, etc.)           │
│  - Image processing                 │
└──────────────┬──────────────────────┘
               │
               ↓ Database & Storage
┌─────────────────────────────────────┐
│  Supabase                           │
│  - PostgreSQL database              │
│  - Authentication                   │
│  - File storage                     │
└─────────────────────────────────────┘
```

## 💰 Cost

- **Vercel**: $0 (Free tier - 100GB bandwidth)
- **Railway**: $5/month (Hobby plan)
- **Supabase**: $0 (Free tier)

**Total: $5/month**

## 🎓 Next Steps After Deployment

1. ✅ Test all features
2. ⏳ Set up custom domain (optional)
3. ⏳ Invite team members
4. ⏳ Create your first project
5. ⏳ Process some images
6. ⏳ Monitor usage in dashboards

## 📚 More Help

- **Deployment Guide**: See `DEPLOYMENT.md`
- **Quick Start**: See `QUICKSTART.md`
- **Progress**: See `PROGRESS.md`
- **Vercel Docs**: https://vercel.com/docs
- **Railway Logs**: Check your Railway dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard/project/ozzjcuamqslxjcfgtfhj

---

**Ready?** Go to https://vercel.com/new and deploy! 🚀
