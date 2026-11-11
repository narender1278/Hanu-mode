# 🚀 Deployment Guide: Hosting Your React Study App

This guide explains how to host your React application so you can give the link to your friends.

---

## 1. Hosting on Google: Firebase Hosting (Google's Free Web Hosting)

Google's official platform for hosting web applications for free is **Firebase Hosting** (part of Google Cloud).

### Steps:
1. In `frontend/`, install the Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```
2. Log in with your Google Account:
   ```bash
   firebase login
   ```
3. Initialize Firebase Hosting in the `frontend` folder:
   ```bash
   firebase init hosting
   ```
   - Select **Use an existing project** or **Create a new project**.
   - What do you want to use as your public directory? Type: `dist`
   - Configure as a single-page app? Type: `Yes`
   - Set up automatic builds with GitHub? Type: `No` (or Yes if desired)
4. Build and deploy:
   ```bash
   npm run build
   firebase deploy
   ```
5. Google will give you a live URL:
   `https://<your-project-id>.web.app`
   Share this URL with your friends!

---

## 2. 1-Click Hosting: Vercel (Fastest & Most Popular)

Vercel is the most popular hosting platform for React and Supabase apps.

1. Push this repository to **GitHub**.
2. Go to [vercel.com](https://vercel.com) and click **Add New** $\rightarrow$ **Project**.
3. Import your GitHub repository.
4. Set **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   - `VITE_GEMINI_API_KEY`: *(your Gemini key)*
   - `VITE_SUPABASE_URL`: *(your Supabase URL)*
   - `VITE_SUPABASE_ANON_KEY`: *(your Supabase anon key)*
6. Click **Deploy**. In ~30 seconds, you get a free `https://<your-app>.vercel.app` link.

---

## 3. Running Locally (Right Now)

To run and test the app on your computer:
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser!
