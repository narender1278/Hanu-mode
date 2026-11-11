/**
 * 🚀 Study Companion - Full-Stack Google Web App
 * Hosted on Google's Infrastructure (Apps Script Web App)
 *
 * Features:
 * 1. Web App Frontend accessible to you and your friends via public link
 * 2. Multi-user progress tracking (Each friend tracks their own progress separately)
 * 3. Master Google Sheet as database
 * 4. Google Docs for rich study notes
 * 5. Gemini API for AI note generation and interactive quizzes
 * 6. Spaced Repetition engine
 */

const GEMINI_MODEL = "gemini-3.8-flash";

// -----------------------------------------------------------------------------
// WEB APP ENTRY POINT (doGet)
// -----------------------------------------------------------------------------

function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Study Companion - Python Mastery')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// -----------------------------------------------------------------------------
// SPREADSHEET & USER PROGRESS DB ENGINE
// -----------------------------------------------------------------------------

function getMasterSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Assume first sheet or tab named "1. Python" or active
  return ss.getSheets()[0];
}

function getUserProgressSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let progSheet = ss.getSheetByName("User_Progress");
  if (!progSheet) {
    progSheet = ss.insertSheet("User_Progress");
    progSheet.appendRow([
      "Username",
      "Topic_ID",
      "Status",
      "Date_Learned",
      "Revisions_Done",
      "Last_Revised",
      "Next_Revision",
      "Last_Score"
    ]);
    progSheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#e8eaed");
  }
  return progSheet;
}

/**
 * Returns list of all distinct usernames who have used the app
 */
function getUsersList() {
  const progSheet = getUserProgressSheet();
  const data = progSheet.getDataRange().getValues();
  const users = new Set(["Me"]);
  for (let i = 1; i < data.length; i++) {
    const u = String(data[i][0]).trim();
    if (u) users.add(u);
  }
  return Array.from(users);
}

/**
 * Returns full curriculum merged with the given user's personal progress
 */
function getCurriculumForUser(username) {
  const masterSheet = getMasterSheet();
  const masterData = masterSheet.getDataRange().getValues();
  
  // Load user progress
  const progSheet = getUserProgressSheet();
  const progData = progSheet.getDataRange().getValues();
  
  const userProgressMap = {};
  for (let i = 1; i < progData.length; i++) {
    const rowUser = String(progData[i][0]).trim().toLowerCase();
    if (rowUser === String(username).trim().toLowerCase()) {
      const topicId = String(progData[i][1]).trim();
      userProgressMap[topicId] = {
        status: progData[i][2] || "Not started",
        dateLearned: progData[i][3] || "",
        revisionsDone: Number(progData[i][4]) || 0,
        lastRevised: progData[i][5] || "",
        nextRevision: progData[i][6] || "",
        lastScore: progData[i][7] || ""
      };
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const topics = [];
  // Row 1 is header: ID, Section, Subsection, Topic, Priority, Status, Date Learned, Revisions Done, Last Revised, Next Revision, Due?, Notes / Link
  for (let i = 1; i < masterData.length; i++) {
    const id = String(masterData[i][0] || "").trim();
    const section = String(masterData[i][1] || "").trim();
    const subsection = String(masterData[i][2] || "").trim();
    const topicTitle = String(masterData[i][3] || "").trim();
    const priority = String(masterData[i][4] || "").trim();
    const noteUrl = String(masterData[i][11] || "").trim();

    if (!id || !topicTitle) continue;

    const userProg = userProgressMap[id] || {
      status: "Not started",
      dateLearned: "",
      revisionsDone: 0,
      lastRevised: "",
      nextRevision: "",
      lastScore: ""
    };

    // Determine if due for spaced revision
    let isDue = false;
    if (userProg.status === "Can explain" && userProg.nextRevision) {
      const nextRevDate = parseDateString(userProg.nextRevision);
      if (nextRevDate && nextRevDate <= today) {
        isDue = true;
      }
    }

    topics.push({
      rowIndex: i + 1,
      id: id,
      section: section,
      subsection: subsection,
      title: topicTitle,
      priority: priority,
      noteUrl: noteUrl,
      status: userProg.status,
      dateLearned: userProg.dateLearned,
      revisionsDone: userProg.revisionsDone,
      lastRevised: userProg.lastRevised,
      nextRevision: userProg.nextRevision,
      isDue: isDue
    });
  }

  return {
    username: username,
    topics: topics
  };
}

// -----------------------------------------------------------------------------
// GEMINI API UTILITIES
// -----------------------------------------------------------------------------

function getApiKey() {
  const key = PropertiesService.getUserProperties().getProperty('GEMINI_API_KEY') 
           || PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!key) {
    throw new Error('Gemini API Key is not set in Script Properties!');
  }
  return key;
}

function callGemini(promptText, systemInstruction) {
  const apiKey = getApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ role: "user", parts: [{ text: promptText }] }],
    generationConfig: { temperature: 0.3, topP: 0.95 }
  };

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const status = response.getResponseCode();
  const body = response.getContentText();

  if (status !== 200) {
    throw new Error(`Gemini API Error (${status}): ${body}`);
  }

  const json = JSON.parse(body);
  return json.candidates[0].content.parts[0].text;
}

// -----------------------------------------------------------------------------
// 1. GENERATE STUDY NOTES IN GOOGLE DOCS
// -----------------------------------------------------------------------------

function generateNotesForTopic(topicId) {
  const masterSheet = getMasterSheet();
  const data = masterSheet.getDataRange().getValues();

  let targetRow = -1;
  let topicData = null;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(topicId).trim()) {
      targetRow = i + 1;
      topicData = {
        id: data[i][0],
        section: data[i][1],
        subsection: data[i][2],
        title: data[i][3],
        currentDocUrl: data[i][11]
      };
      break;
    }
  }

  if (!topicData) {
    throw new Error("Topic not found: " + topicId);
  }

  // If notes already exist in Google Doc, return existing link
  if (topicData.currentDocUrl) {
    return {
      docUrl: topicData.currentDocUrl,
      alreadyExisted: true
    };
  }

  const prompt = `You are an elite software engineering coach.
Generate comprehensive, master-level study notes for:

Topic: ${topicData.title} (ID: ${topicData.id})
Section: ${topicData.section} / ${topicData.subsection}

Structure the notes with clear Markdown:
# ${topicData.id}: ${topicData.title}
## 1. Core Mental Model & Conceptual Overview
- What problem does this solve? Why does it exist? Clear analogies.

## 2. In-Depth Technical Deep Dive & Code Examples
- Syntax, internals, step-by-step code demonstrations with output annotations.

## 3. Common Pitfalls, Gotchas & Anti-Patterns
- Typical bugs, traps, and how to avoid them.

## 4. Key Takeaways & Cheat Sheet
- Bullet points of essentials.

## 5. Top Interview Questions & Conceptual Checks
- 3 interview questions with concise, model answers.`;

  const notesMarkdown = callGemini(prompt);

  // Create Google Doc
  const docTitle = `[Study Notes] ${topicData.id} - ${topicData.title}`;
  const doc = DocumentApp.create(docTitle);
  const body = doc.getBody();
  renderMarkdownToDoc(body, notesMarkdown);
  doc.saveAndClose();

  const docUrl = doc.getUrl();

  // Save doc link in Column L (12th column) of master sheet
  masterSheet.getRange(targetRow, 12).setValue(docUrl);

  return {
    docUrl: docUrl,
    alreadyExisted: false
  };
}

function renderMarkdownToDoc(body, mdText) {
  body.clear();
  const lines = mdText.split("\n");
  let inCode = false;
  let code = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      if (inCode) {
        const p = body.appendParagraph(code.join("\n"));
        p.setFontFamily("Consolas");
        p.setFontSize(10);
        p.setBackgroundColor("#f1f3f4");
        code = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }

    if (line.startsWith("# ")) {
      body.appendParagraph(line.replace("# ", "").trim()).setHeading(DocumentApp.ParagraphHeading.HEADING1);
    } else if (line.startsWith("## ")) {
      body.appendParagraph(line.replace("## ", "").trim()).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    } else if (line.startsWith("### ")) {
      body.appendParagraph(line.replace("### ", "").trim()).setHeading(DocumentApp.ParagraphHeading.HEADING3);
    } else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      body.appendListItem(line.trim().substring(2));
    } else if (line.trim().match(/^\d+\.\s/)) {
      body.appendListItem(line.trim().replace(/^\d+\.\s/, ""));
    } else if (line.trim() !== "") {
      body.appendParagraph(line);
    }
  }
}

// -----------------------------------------------------------------------------
// 2. QUIZ GENERATION & SUBMISSION
// -----------------------------------------------------------------------------

function fetchQuiz(topicId, isRevision) {
  const masterSheet = getMasterSheet();
  const data = masterSheet.getDataRange().getValues();
  let topicTitle = "";
  let section = "";

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(topicId).trim()) {
      topicTitle = data[i][3];
      section = data[i][1];
      break;
    }
  }

  const prompt = isRevision
    ? `Create a jumbled revision quiz of 3 questions to test retention on:
Topic: "${topicTitle}" (ID: ${topicId}, Section: ${section}).
Include tricky code-tracing and edge-case questions.

Return STRICT raw JSON matching this structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here (can include code snippets)",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctIndex": 0,
      "explanation": "Why this answer is correct..."
    }
  ]
}`
    : `Create a foundational test quiz of 3 multiple-choice questions for:
Topic: "${topicTitle}" (ID: ${topicId}, Section: ${section}).
Target conceptual clarity and standard syntax.

Return STRICT raw JSON matching this structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctIndex": 0,
      "explanation": "Why this answer is correct..."
    }
  ]
}`;

  const res = callGemini(prompt, "You are a technical quiz generator. Output ONLY valid JSON without markdown code ticks.");
  const clean = res.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(clean);
}

function submitUserQuiz(username, topicId, score, total, isRevision) {
  const progSheet = getUserProgressSheet();
  const data = progSheet.getDataRange().getValues();
  const todayStr = formatDate(new Date());

  let userRow = -1;
  let currentRev = 0;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === String(username).trim().toLowerCase() &&
        String(data[i][1]).trim() === String(topicId).trim()) {
      userRow = i + 1;
      currentRev = Number(data[i][4]) || 0;
      break;
    }
  }

  const nextRevInterval = isRevision ? currentRev + 1 : 0;
  const nextRevDateStr = calculateNextRevisionDate(nextRevInterval);
  const scoreStr = `${score}/${total}`;

  if (userRow === -1) {
    // New progress entry
    progSheet.appendRow([
      username,
      topicId,
      "Can explain",
      todayStr,
      0,
      "",
      nextRevDateStr,
      scoreStr
    ]);
  } else {
    // Update existing row
    progSheet.getRange(userRow, 3).setValue("Can explain");
    if (!isRevision) {
      progSheet.getRange(userRow, 4).setValue(todayStr); // Date Learned
      progSheet.getRange(userRow, 5).setValue(0);        // Revisions Done
    } else {
      progSheet.getRange(userRow, 5).setValue(nextRevInterval); // Revisions Done + 1
      progSheet.getRange(userRow, 6).setValue(todayStr);        // Last Revised
    }
    progSheet.getRange(userRow, 7).setValue(nextRevDateStr);    // Next Revision
    progSheet.getRange(userRow, 8).setValue(scoreStr);          // Last Score
  }

  return { success: true };
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function formatDate(date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = ("0" + date.getDate()).slice(-2);
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

function parseDateString(str) {
  if (!str) return null;
  // formats like 11-Nov-2026 or 2026-11-11
  const parts = String(str).split("-");
  if (parts.length === 3) {
    const months = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
    const m = months[parts[1].toLowerCase()];
    if (m !== undefined) {
      return new Date(parseInt(parts[2]), m, parseInt(parts[0]));
    }
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function calculateNextRevisionDate(revisionsCount) {
  const intervals = [1, 3, 7, 14, 30];
  const daysToAdd = revisionsCount < intervals.length ? intervals[revisionsCount] : 30;
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  return formatDate(nextDate);
}
