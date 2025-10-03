# 🚨 Deployment Fix Guide - AWS Amplify

## Issue Summary

**Problem**: Login works on localhost but returns 401 error on live Amplify deployment

**Live URL**: https://aws-build-deploy.dxbzcf9vo1xes.amplifyapp.com

**Root Cause**: Missing or incorrect environment variables in Amplify

---

## 🔍 Analysis from Build Logs

### ✅ What's Working:
- Build completed successfully ✅
- Frontend deployed ✅
- Next.js SSR working ✅
- All API routes compiled ✅

### ❌ What's NOT Working:
1. **Database connection** - Using "placeholder database config" during build
2. **Environment variables** - Build logs show warnings:
   - `WARNING: ! Unable to write cache`
   - `WARNING: !Failed to set up process.env.secrets`
3. **Authentication fails (401)** - NextAuth not configured properly

### 🎯 The Problem:

The build logs show:
```
Build phase detected, using placeholder database config
```

This means **DATABASE_URL and other env vars are NOT properly set** in Amplify, causing:
- ❌ Database connection fails
- ❌ NextAuth can't verify sessions
- ❌ Login returns 401 error

---

## ✅ SOLUTION: Configure Environment Variables in Amplify

### Step 1: Go to Amplify Environment Variables

1. Open AWS Amplify Console
2. Click on your app: **smart-chat**
3. Go to **"Environment variables"** in left sidebar
4. Click **"Manage variables"**

### Step 2: Add ALL Required Environment Variables

Add these variables (get values from your local `.env.local`):

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database
DATABASE_SSL=false

# NextAuth
NEXTAUTH_URL=https://aws-build-deploy.dxbzcf9vo1xes.amplifyapp.com
NEXTAUTH_SECRET=your-secret-here-generate-new-one

# OpenAI
OPENAI_API_KEY=sk-...your-key...

# Stripe (if testing payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (if using)
EMAIL_SERVER=smtp://...
EMAIL_FROM=noreply@yourdomain.com

# Google OAuth (if using)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# App URL
NEXT_PUBLIC_APP_URL=https://aws-build-deploy.dxbzcf9vo1xes.amplifyapp.com
```

### Step 3: Generate New NEXTAUTH_SECRET

**IMPORTANT**: Don't use your local one. Generate a new secret for production:

```bash
openssl rand -base64 32
```

Or use this online: https://generate-secret.vercel.app/32

### Step 4: Update Supabase Settings (If Using Supabase)

If your database is on Supabase:

1. Go to Supabase Project Settings
2. Navigate to **Database** → **Connection Pooling**
3. Copy the **Connection string** (use the one for connection pooling)
4. Make sure SSL is disabled or set to `?sslmode=require` at the end

Example:
```
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-eu-north-1.pooler.supabase.com:5432/postgres
```

### Step 5: Redeploy

After adding all environment variables:

1. Go back to **Deployments**
2. Click **"Redeploy this version"**
3. Wait for build to complete (3-4 minutes)
4. Test login again

---

## 🐛 Common Issues & Fixes

### Issue 1: Still Getting 401 Error

**Check:**
```bash
# Verify NEXTAUTH_URL matches your deployment URL exactly
NEXTAUTH_URL=https://aws-build-deploy.dxbzcf9vo1xes.amplifyapp.com
# NO trailing slash!
```

### Issue 2: Database Connection Fails

**Check:**
```bash
# Make sure DATABASE_URL is correct
# For Supabase, use connection pooling URL
# For regular PostgreSQL, ensure it's publicly accessible
```

### Issue 3: Build Still Shows "Placeholder Database Config"

**This is NORMAL during build phase!**

The important part is runtime. After deployment, check:

1. Go to your deployed app
2. Open browser console
3. Try to login
4. If you see database errors, check the variables again

### Issue 4: Google OAuth Not Working

Add to Amplify environment variables:
```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

Also update Google OAuth settings:
- Authorized JavaScript origins: `https://aws-build-deploy.dxbzcf9vo1xes.amplifyapp.com`
- Authorized redirect URIs: `https://aws-build-deploy.dxbzcf9vo1xes.amplifyapp.com/api/auth/callback/google`

---

## 📋 Quick Checklist

Before redeploying, verify you have these set in Amplify:

```
☐ DATABASE_URL (from Supabase or your PostgreSQL)
☐ NEXTAUTH_URL (your Amplify URL)
☐ NEXTAUTH_SECRET (generate new one)
☐ OPENAI_API_KEY
☐ NEXT_PUBLIC_APP_URL (your Amplify URL)
☐ STRIPE_SECRET_KEY (if using Stripe)
☐ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (if using Stripe)
```

---

## 🔧 How to Get Your Environment Variables

### From Local .env.local:

Run this command in your project:

```bash
cat .env.local
```

Copy all values EXCEPT:
- Don't copy `DATABASE_URL` if it points to localhost
- Generate NEW `NEXTAUTH_SECRET` for production
- Update all URLs from `localhost:3000` to your Amplify URL

---

## 🚀 After Fixing

Once environment variables are set correctly:

1. **Redeploy** the app
2. **Test login** - Should work now! ✅
3. **Test bot creation** - Should save to database ✅
4. **Test chat** - Should get AI responses ✅

---

## 📞 Need More Help?

### To Debug Further:

1. **Check Amplify Logs:**
   - Go to Amplify Console
   - Click on latest deployment
   - Click "View logs"
   - Look for runtime errors

2. **Check Browser Console:**
   - Open your deployed site
   - Press F12
   - Go to Console tab
   - Try to login
   - Share any errors you see

3. **Test Database Connection:**

   Create a test endpoint to verify database:

   File: `src/app/api/test-db/route.ts`
   ```typescript
   import { NextResponse } from 'next/server';
   import pool from '@/utils/db';

   export async function GET() {
     try {
       const result = await pool.query('SELECT NOW()');
       return NextResponse.json({
         success: true,
         time: result.rows[0].now,
         env: {
           hasDbUrl: !!process.env.DATABASE_URL,
           hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
           hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
         }
       });
     } catch (error: any) {
       return NextResponse.json({
         success: false,
         error: error.message
       }, { status: 500 });
     }
   }
   ```

   Then visit: `https://aws-build-deploy.dxbzcf9vo1xes.amplifyapp.com/api/test-db`

---

## 🎯 Expected Result After Fix

**Before Fix:**
```
❌ Login → 401 Unauthorized
❌ Database connection fails
❌ Environment variables missing
```

**After Fix:**
```
✅ Login → Success! Redirects to dashboard
✅ Database connection works
✅ Can create bots
✅ Chat works with AI
✅ All features functional
```

---

## 📝 Summary

**The Issue**: Environment variables not configured in Amplify

**The Fix**: Add all required env vars in Amplify Console → Environment variables

**Time Required**: 5-10 minutes

**After Fix**: Full app works on production! 🎉

---

**Let me know if you need help with:**
1. Finding your Supabase DATABASE_URL
2. Generating NEXTAUTH_SECRET
3. Getting any other environment variable
4. Debugging specific errors after deployment

I can guide you through each step! 🚀
