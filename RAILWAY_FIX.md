# Railway Backend Fix - OpenCV libGL Error

## Problem

Backend was crashing on Railway with error:
```
ImportError: libGL.so.1: cannot open shared object file: No such file or directory
```

This happens because `opencv-python` requires GUI libraries (libGL, X11) that aren't available in Railway's headless environment.

## Solution

Replaced `opencv-python` with `opencv-python-headless` in `requirements.txt`.

The headless version:
- Doesn't require GUI libraries
- Works in server/container environments
- Has all the image processing features we need
- Smaller package size

## Changes Made

### 1. requirements.txt
```diff
- opencv-python
+ opencv-python-headless
```

### 2. nixpacks.toml
Simplified to let Railway auto-detect Python and use defaults:
```toml
[start]
cmd = "python -m iopaint start --host 0.0.0.0 --port $PORT --model lama --device cpu --no-half --low-mem"
```

Railway will automatically:
- Detect Python from `runtime.txt` (python-3.11)
- Install dependencies from `requirements.txt`
- Use the start command from nixpacks.toml

## Deploy the Fix

### Option 1: Push to GitHub (Automatic)

```bash
git add requirements.txt nixpacks.toml
git commit -m "Fix: Use opencv-python-headless for Railway deployment"
git push origin main
```

Railway will automatically detect the push and redeploy.

### Option 2: Manual Redeploy

1. Go to Railway dashboard
2. Click on your service
3. Click "Redeploy" button
4. Wait 5-10 minutes for build

## Verify Fix

After deployment, check Railway logs. You should see:
```
INFO     | iopaint.runtime:setup_model_dir:81 - Model directory: /root/.cache
- Platform: Linux...
- Python version: 3.11.10
- opencv-python: 4.11.0.86
...
INFO: Started server process
INFO: Uvicorn running on http://0.0.0.0:8080
```

No more `ImportError: libGL.so.1` errors!

## Test the API

```bash
curl https://web-production-66480.up.railway.app/api/v1/server-config
```

Should return JSON with model info.

## Why This Works

`opencv-python-headless`:
- Compiled without GUI support (no Qt, GTK)
- Doesn't link against libGL, X11, etc.
- Perfect for server environments
- Same image processing capabilities
- Used by many production deployments

## Alternative Solutions (Not Needed)

We could have:
1. ❌ Installed system packages (libGL, mesa, X11) - bloated, unnecessary
2. ❌ Used Docker with full graphics stack - overkill
3. ✅ Used opencv-python-headless - clean, simple, correct

## Related Files

- `requirements.txt` - Python dependencies
- `nixpacks.toml` - Railway build configuration
- `DEPLOYMENT.md` - Deployment guide
- `Procfile` - Railway start command

## Next Steps

1. Push changes to GitHub
2. Wait for Railway to redeploy
3. Verify backend is running
4. Deploy frontend to Vercel (see DEPLOY_NOW.md)

---

**Status**: Fix ready to deploy
**Impact**: Backend will start successfully on Railway
**Breaking Changes**: None (opencv-python-headless is a drop-in replacement)
