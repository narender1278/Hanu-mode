# 🚀 Study Companion - Google Web App Setup Guide

This guide shows you how to deploy the **Study Companion** as a live, hosted web application on Google's infrastructure in under 3 minutes. Once deployed, you get a public URL you can open on any phone/laptop and share with friends!

---

## What It Does
- **Curriculum Tracker**: Reads your Python topics directly from your Google Sheet.
- **Multi-Friend Support**: Friends can select or add their name to track their own progress without overwriting yours.
- **AI Notes in Google Docs**: Gemini drafts comprehensive study notes and saves them to a Google Doc in your Drive, linking it automatically in Column L.
- **Interactive Quizzes**: 3-question conceptual and code-tracing quizzes generated on the fly.
- **Spaced Repetition Engine**: Calculates revision dates (+1d, +3d, +7d, +14d, +30d) and presents jumbled revision quizzes.

---

## 3-Minute Deployment Instructions

### Step 1: Open Apps Script in Your Google Sheet
1. Open your Google Sheet: [Curriculum Spreadsheet](https://docs.google.com/spreadsheets/d/1tlFXJrv100umuJU7m0l2Ixt7-AxbFtuhtJUIAfeCrsQ/edit)
2. In the top menu, click **Extensions** $\rightarrow$ **Apps Script**.

### Step 2: Copy the Code Files
1. In the Apps Script editor, open the existing file named `Code.gs` (or replace its content).
   - Copy all content from [`apps_script/Code.gs`](./Code.gs) and paste it into `Code.gs`.
2. Click the **+** (plus icon) next to **Files** $\rightarrow$ select **HTML**.
   - Name the file: `Index` (it will become `Index.html`).
   - Copy all content from [`apps_script/Index.html`](./Index.html) and paste it into `Index.html`.
3. Click the **💾 Save project** icon (or press `Ctrl + S`).

### Step 3: Add Your Gemini API Key
1. In the Apps Script left sidebar, click the **⚙️ Project Settings** icon (gear icon).
2. Scroll down to **Script Properties** and click **Add script property**:
   - **Property**: `GEMINI_API_KEY`
   - **Value**: *(Paste your Gemini API key from [aistudio.google.com](https://aistudio.google.com/))*
3. Click **Save script properties**.

### Step 4: Deploy as a Web App (Get Shareable Link)
1. At the top right of the Apps Script editor, click the blue **Deploy** button $\rightarrow$ **New deployment**.
2. Click the **Select type** gear icon $\rightarrow$ choose **Web app**.
3. Fill in the fields:
   - **Description**: `Study Companion v1`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone` *(so your friends can open the link without complex permission prompts)*
4. Click **Deploy**.
5. Google will ask you to **Authorize access**:
   - Choose your Google account.
   - Click *Advanced* $\rightarrow$ *Go to Study Companion (unsafe)* $\rightarrow$ *Allow*.
6. Copy the **Web App URL** provided (e.g., `https://script.google.com/macros/s/AKfycb.../exec`).

---

## 🎉 You're Done!
Send the **Web App URL** to your friends or bookmark it on your phone/browser. Everyone can:
1. Select or click **+ Add Friend** to enter their name.
2. Read the syllabus and click **✨ Generate Notes with Gemini** (creates the Google Doc).
3. Click **❓ Take Quiz** to test their understanding and mark topics as mastered!
