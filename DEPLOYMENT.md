# Worthsmith Deployment Guide

## 📁 Project Structure

Your project should look like this:
```
worthsmith/
├── api/
│   └── suggest-alternatives.js    # Backend serverless function
├── src/
│   ├── App.jsx                    # Main app
│   └── ...
├── public/
├── .env.local                     # Local environment variables (NOT committed)
├── package.json
└── vercel.json                    # Vercel config (create this)
```

## 🚀 Deployment Steps

### 1. Create `vercel.json` in project root

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

### 2. Install Vercel CLI (if not already)

```bash
npm install -g vercel
```

### 3. Login to Vercel

```bash
vercel login
```

### 4. Deploy

From your project root:

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Your account
- **Link to existing project?** No (first time) or Yes (subsequent deploys)
- **Project name?** worthsmith (or your choice)
- **Directory?** ./ (current directory)
- **Override settings?** No

### 5. Add Environment Variable to Vercel

**Option A: Via CLI**
```bash
vercel env add ANTHROPIC_API_KEY
```
Then paste your API key when prompted.

**Option B: Via Dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** Your Anthropic API key (sk-ant-...)
   - **Environment:** Production (and Preview if testing)

### 6. Redeploy After Adding Env Var

```bash
vercel --prod
```

## ✅ Testing Deployment

Once deployed, you'll get a URL like: `https://worthsmith.vercel.app`

Test the AI feature:
1. Go to Step 1, fill in an outcome
2. Go to Step 4 (Alternatives)
3. Click "✨ Suggest Alternatives"
4. Should work without CORS errors!

## 🔍 Debugging

### Check Vercel Logs
```bash
vercel logs
```

Or via dashboard: Project > Deployments > [Latest] > Functions > suggest-alternatives

### Common Issues

**"API key not configured"**
- Env variable not set in Vercel
- Redeploy after adding env var

**"404 Not Found" on /api/suggest-alternatives**
- Check `vercel.json` exists
- Make sure `api/suggest-alternatives.js` is committed to git
- Redeploy

**CORS errors**
- Should NOT happen with Vercel (same domain)
- Check that you're calling `/api/...` not `http://localhost:3001/api/...`

## 🔄 Updating

After making changes:

```bash
git add .
git commit -m "Your changes"
git push

# Deploy
vercel --prod
```

Or just `git push` if you've set up Vercel GitHub integration (auto-deploys on push).

## 🔐 Security Notes

- ✅ API key is server-side only (not exposed to browser)
- ✅ No CORS issues (same domain)
- ✅ Vercel environment variables are encrypted
- ⚠️ No rate limiting yet (add later if needed)
- ⚠️ No authentication (anyone with URL can use it)

For PO demo, this is fine. For production with multiple users, you'd want to add authentication.

## 📊 Monitoring

Check usage in Vercel dashboard:
- Functions > suggest-alternatives
- See invocations, errors, duration

---

## Local Development

To test the backend locally:

1. Make sure `.env.local` has:
```
ANTHROPIC_API_KEY=your-key-here
```

2. Run Vite dev server (it will use the `/api` folder automatically):
```bash
npm run dev
```

3. Backend runs at `http://localhost:5173/api/suggest-alternatives`

That's it! The beauty of Vercel - local dev matches production. 🎉
