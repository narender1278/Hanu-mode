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
   - `NEXT_PUBLIC_SUPABASE_URL`: *(your Supabase URL)*
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: *(your Supabase publishable key)*
6. Click **Deploy**. In ~30 seconds, you get a free `https://<your-app>.vercel.app` link.

### Public portfolio and private tracker

The site root is the public portfolio and can be shared with anyone. The **Go to tracker** button opens the sign-in/create-account page for signed-out visitors, and the tracker itself is shown only after Supabase authenticates the visitor. A direct `#tracker` link also redirects signed-out visitors to sign-in; signed-in visitors opening `#login` are sent to the tracker. Use the root URL when sharing the portfolio.

In Supabase, open **Authentication → URL Configuration** and set **Site URL** to your deployed public site URL (for example, `https://your-app.vercel.app`). Add that same URL to **Redirect URLs**. Email confirmation links return to the site root; users can then sign in to reach the tracker.

Tracker visibility is a frontend navigation rule, not the data security boundary. Keep the Supabase Row Level Security policies enabled: they ensure each authenticated user can only access their own tracker rows.

### Private expense tracker setup

Run `supabase_expenses_schema.sql` in the Supabase SQL Editor to create the expense table and enable per-user row-level security. Each signed-in account can only read and change its own rows. Other accounts start with an empty tracker and can add their own categories.

If you are migrating the original tracker for `kattanarender167@gmail.com`, run the local, Git-ignored `supabase_expenses_seed.private.sql` once after creating that account and running the schema. Do not commit or share the private seed file.

### Synchronized habits, todos, roadmaps, and study progress

Run `supabase_user_data_schema.sql` in the Supabase SQL Editor. It creates a private per-user JSON data table with row-level security and enables Realtime updates. Habits, habit checks, todos, imported roadmaps, the selected roadmap, study progress, and generated notes then sync through Supabase across devices signed into the same account. Existing browser-only values are migrated to Supabase on the original account's next sign-in; other users start with their own data.

The private resume editor is shown only to `kattanarender167@gmail.com`. After running the user-data schema, run the local, Git-ignored `supabase_resume_seed.private.sql` once to load the starting HTML into that account. The HTML is stored in the account's Supabase row, not shipped in the public frontend bundle. Do not commit or share the private seed file.

Do not put a private Gemini API key in a `VITE_` or `NEXT_PUBLIC_` frontend variable; those values are visible to website visitors. Use a server-side function for Gemini requests.

---

## 3. Running Locally (Right Now)

To run and test the app on your computer:
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser!
