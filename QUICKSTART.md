# Eidify - Quick Start Guide

## 🚀 Getting Started (5 minutes)

### Step 1: Check Railway Deployment

1. Go to your Railway dashboard
2. Find the "eidify" project
3. Check if status shows "Deployed" (green checkmark)
4. Copy the deployment URL (e.g., `https://eidify-production.up.railway.app`)

### Step 2: Test Backend API

Open your browser and visit:
```
https://your-railway-url.up.railway.app/api/v1/server-config
```

You should see JSON with model information. If you see this, backend is working! ✅

### Step 3: Deploy Frontend to Vercel

**Method 1: Vercel Dashboard (Easiest)**

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select `NexusFilm/eidify`
4. **IMPORTANT**: Click "Edit" next to "Root Directory"
5. Set Root Directory to: `web_app`
6. Click "Environment Variables"
7. Add these three variables:
   - `VITE_BACKEND` = `https://web-production-66480.up.railway.app`
   - `VITE_SUPABASE_URL` = `https://ozzjcuamqslxjcfgtfhj.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = Get from [Supabase Dashboard](https://supabase.com/dashboard/project/ozzjcuamqslxjcfgtfhj/settings/api)
8. Click "Deploy"
9. Wait ~2 minutes

**Method 2: CLI**

```bash
cd web_app
npm install
```

Create `web_app/.env`:
```bash
VITE_BACKEND=https://web-production-66480.up.railway.app
VITE_SUPABASE_URL=https://ozzjcuamqslxjcfgtfhj.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key-from-supabase>
```

Deploy:
```bash
npx vercel --prod
```

Follow prompts and confirm settings.

### Step 4: Test the App

1. Visit your Vercel URL
2. You should see the Eidify interface
3. Try uploading an image
4. Test the chatbot: "Remove the background"

## 🎯 Quick Feature Tour

### Single Image Editing
1. Drop an image on the canvas
2. Use brush tools to mark areas
3. Click "Run" to process
4. Download result

### Multi-Image Batch Processing
1. Click "Or upload multiple" on home screen
2. Drop 5-10 images
3. Select images in gallery
4. Click "Process Selected"
5. Choose operation (e.g., "Remove Background")
6. Watch progress
7. Download results

### AI Chatbot
1. Upload an image
2. Chat panel appears at bottom
3. Type: "Make it brighter"
4. AI processes your request
5. See result instantly

### Projects (Coming Soon)
1. Create a project
2. Add images to project
3. Organize by category
4. Share with team

## 🔧 Troubleshooting

### Backend Issues

**"Cannot connect to backend"**
- Check Railway deployment status
- Verify `VITE_BACKEND` URL is correct
- Check Railway logs for errors

**"Model not found"**
- Wait for models to download (first deploy takes 10-15 min)
- Check Railway logs: `Downloading model...`

**"Out of memory"**
- Upgrade Railway plan to Pro (32GB RAM)
- Or reduce concurrent requests

### Frontend Issues

**"Supabase connection failed"**
- Verify environment variables in Vercel
- Check Supabase project is not paused
- Confirm anon key is correct

**"Image upload fails"**
- Check file size (max 10MB)
- Verify file type (JPG, PNG, WebP, BMP, TIFF)
- Check browser console for errors

**"Chatbot not responding"**
- Ensure image is loaded first
- Check backend API is reachable
- Try simpler commands first

## 📱 Usage Tips

### Best Practices
- Use JPG/PNG for best compatibility
- Keep images under 5MB for faster processing
- Use descriptive project names
- Save frequently used commands as quick actions

### Performance Tips
- Process images in batches of 10-20 for best speed
- Use lower resolution for testing
- Close unused browser tabs
- Clear browser cache if slow

### Command Examples

**Remove Objects**:
- "Remove the person on the left"
- "Delete the watermark"
- "Erase the text in the corner"

**Adjust Properties**:
- "Make it brighter"
- "Increase contrast"
- "Make the sky more blue"

**Enhance Quality**:
- "Upscale 2x"
- "Restore old photo"
- "Enhance quality"

**Background**:
- "Remove the background"
- "Transparent background"
- "Delete background"

## 🆘 Getting Help

### Check Logs

**Railway Backend**:
1. Go to Railway dashboard
2. Click on your service
3. Click "View Logs"
4. Look for errors in red

**Vercel Frontend**:
1. Go to Vercel dashboard
2. Click on deployment
3. Click "Functions" tab
4. Check for errors

**Browser Console**:
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red errors
4. Copy error message

### Common Error Messages

**"Authentication required"**
→ Sign up or log in first

**"Tenant not found"**
→ Sign out and sign in again

**"Storage quota exceeded"**
→ Delete old images or upgrade plan

**"Processing timeout"**
→ Image too large, try smaller size

## 📊 Monitoring

### Check System Health

**Backend Status**:
```
https://your-railway-url.up.railway.app/api/v1/server-config
```

**Database Status**:
- Go to Supabase dashboard
- Check "Database" tab
- Verify tables exist

**Storage Usage**:
- Go to Supabase dashboard
- Check "Storage" tab
- Monitor quota usage

## 🎓 Next Steps

1. ✅ Deploy and test
2. ⏳ Invite team members
3. ⏳ Create first project
4. ⏳ Process batch of images
5. ⏳ Explore chatbot commands
6. ⏳ Set up custom domain (optional)
7. ⏳ Configure usage alerts

## 💡 Pro Tips

- Use keyboard shortcuts (see Shortcuts button)
- Save frequently used masks
- Create projects for different clients
- Use chatbot for quick edits
- Batch process similar images together
- Download originals before processing

---

**Need more help?** Check:
- `DEPLOYMENT.md` - Detailed deployment guide
- `SUMMARY.md` - Feature overview
- `PROGRESS.md` - Development status
- Railway logs - Backend errors
- Browser console - Frontend errors
