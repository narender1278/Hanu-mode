"""🚀 Study Companion - Full-Stack Web App
Powered by Streamlit + Supabase + Gemini API.

Run locally:
    streamlit run study_app.py
"""
import datetime
import json
import os
import streamlit as st
from streamlit.errors import StreamlitSecretNotFoundError
from dotenv import load_dotenv

load_dotenv()

# ---- CONFIG & CREDENTIALS ---------------------------------------------------
st.set_page_config(
    page_title="Study Companion",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="expanded"
)

def get_setting(name: str) -> str:
    value = os.getenv(name)
    if value:
        return value
    try:
        return st.secrets.get(name, "")
    except StreamlitSecretNotFoundError:
        return ""


GEMINI_API_KEY = get_setting("GOOGLE_API_KEY")
SUPABASE_URL = get_setting("SUPABASE_URL")
SUPABASE_KEY = get_setting("SUPABASE_ANON_KEY") or get_setting("SUPABASE_KEY")
GEMINI_MODEL = "gemini-3.8-flash"

if not GEMINI_API_KEY:
    st.error("⚠️ Missing GOOGLE_API_KEY in your environment or Streamlit secrets.")
    st.stop()

# Initialize Supabase client
def get_supabase_client():
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_KEY)

if "supabase_client" not in st.session_state:
    st.session_state.supabase_client = get_supabase_client()
supabase = st.session_state.supabase_client

# Initialize Gemini client
@st.cache_resource
def get_gemini_client():
    from google import genai
    return genai.Client(api_key=GEMINI_API_KEY)

gemini = get_gemini_client()


# ---- GEMINI HELPERS ---------------------------------------------------------
def generate_study_notes(topic_id: str, title: str, section: str, subsection: str) -> str:
    prompt = f"""You are a principal software engineer and CS educator.
Generate comprehensive, master-level study notes for:

Topic: {title} (ID: {topic_id})
Section: {section} / {subsection}

Format with clear Markdown:
# {topic_id}: {title}

## 1. Core Mental Model & Overview
- What problem does this solve? Why does it exist? Use clear intuitive analogies.

## 2. Technical Deep Dive & Code Examples
- Syntax, internals, and idiomatic Python code snippets with expected outputs.

## 3. Common Pitfalls, Gotchas & Anti-Patterns
- Real bugs developers introduce, performance edge cases, and how to avoid them.

## 4. Key Takeaways & Cheat Sheet
- Concise bullet points summarizing the essentials.

## 5. Top Interview Questions
- 3 tricky interview questions with concise, model answers."""

    response = gemini.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt
    )
    return response.text


def generate_quiz(topic_id: str, title: str, section: str, is_revision: bool = False) -> dict:
    prompt = (
        f"Generate a jumbled revision quiz of 3 tricky multiple-choice questions (including code-tracing and edge-cases) for:\n"
        f"Topic: '{title}' ({section}, ID: {topic_id})."
        if is_revision
        else
        f"Generate a foundational quiz of 3 multiple-choice questions testing conceptual understanding for:\n"
        f"Topic: '{title}' ({section}, ID: {topic_id})."
    )

    system_instruction = (
        "You are an automated technical quiz generator. Output ONLY raw JSON. "
        "Do NOT include markdown formatting like ```json. Match this exact JSON structure:\n"
        "{\n"
        '  "questions": [\n'
        '    {\n'
        '      "id": 1,\n'
        '      "question": "Question text here (can include code snippets)",\n'
        '      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],\n'
        '      "correctIndex": 0,\n'
        '      "explanation": "Why this answer is correct..."\n'
        '    }\n'
        '  ]\n'
        '}'
    )

    response = gemini.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config={"system_instruction": system_instruction, "temperature": 0.2}
    )
    raw = response.text.replace("```json", "").replace("```", "").strip()
    return json.loads(raw)


# ---- SPACED REPETITION HELPER -----------------------------------------------
def get_next_revision_date(revisions_count: int) -> datetime.date:
    intervals = [1, 3, 7, 14, 30]
    days = intervals[revisions_count] if revisions_count < len(intervals) else 30
    return datetime.date.today() + datetime.timedelta(days=days)


# ---- DATABASE / TOPIC ACCESS ------------------------------------------------
def load_curriculum_and_progress(user_id: str):
    if not supabase:
        st.warning("Supabase credentials not configured in .env. Running in offline demo mode.")
        return [], {}

    # Fetch all topics
    topics_res = supabase.table("topics").select("*").order("id").execute()
    topics = topics_res.data or []

    # Fetch progress for this user
    prog_res = supabase.table("user_progress").select("*").eq("user_id", user_id).execute()
    prog_map = {row["topic_id"]: row for row in (prog_res.data or [])}

    return topics, prog_map


def save_quiz_result(user_id: str, topic_id: str, score: int, total: int, is_revision: bool):
    if not supabase:
        return

    today = datetime.date.today()
    # Check current progress
    res = supabase.table("user_progress").select("*").eq("user_id", user_id).eq("topic_id", topic_id).execute()
    existing = res.data[0] if res.data else None

    current_revs = (existing["revisions_done"] if existing else 0)
    new_revs = current_revs + 1 if is_revision else 0
    next_rev = get_next_revision_date(new_revs)

    progress_payload = {
        "user_id": user_id,
        "topic_id": topic_id,
        "status": "Can explain",
        "revisions_done": new_revs,
        "next_revision": str(next_rev),
        "last_score": f"{score}/{total}",
        "updated_at": str(datetime.datetime.now())
    }

    if not is_revision:
        progress_payload["date_learned"] = str(today)
    else:
        progress_payload["last_revised"] = str(today)

    supabase.table("user_progress").upsert(progress_payload, on_conflict="user_id,topic_id").execute()

    # Log history
    supabase.table("quiz_history").insert({
        "user_id": user_id,
        "topic_id": topic_id,
        "score": score,
        "total": total,
        "is_revision": is_revision
    }).execute()


# ---- AUTHENTICATION ---------------------------------------------------------
if not supabase:
    st.error("Supabase credentials are missing. Add SUPABASE_URL and SUPABASE_ANON_KEY to Streamlit secrets.")
    st.stop()

with st.sidebar:
    st.title("🚀 Study Companion")
    st.markdown("Python Mastery & Spaced Repetition")

session_user = None
if "supabase_session" in st.session_state:
    saved_session = st.session_state.supabase_session
    try:
        auth_response = supabase.auth.set_session(
            saved_session["access_token"],
            saved_session["refresh_token"]
        )
        session_user = auth_response.user
        if auth_response.session:
            st.session_state.supabase_session = {
                "access_token": auth_response.session.access_token,
                "refresh_token": auth_response.session.refresh_token
            }
    except Exception as error:
        st.session_state.pop("supabase_session", None)
        st.sidebar.warning(f"Your session expired. Please sign in again. ({error})")

if session_user is None:
    with st.sidebar:
        auth_mode = st.radio("Account", ["Sign in", "Create account"])
        with st.form("auth_form"):
            display_name = ""
            if auth_mode == "Create account":
                display_name = st.text_input("Name")
            email = st.text_input("Email")
            password = st.text_input("Password", type="password")
            submitted = st.form_submit_button(auth_mode)

        if submitted:
            try:
                if auth_mode == "Create account":
                    response = supabase.auth.sign_up({
                        "email": email,
                        "password": password,
                        "options": {"data": {"full_name": display_name.strip()}}
                    })
                    if response.session:
                        session = response.session
                    else:
                        st.success("Account created. Check your email to confirm it, then sign in.")
                        session = None
                else:
                    response = supabase.auth.sign_in_with_password({
                        "email": email,
                        "password": password
                    })
                    session = response.session

                if session:
                    st.session_state.supabase_session = {
                        "access_token": session.access_token,
                        "refresh_token": session.refresh_token
                    }
                    st.rerun()
            except Exception as error:
                st.error(f"Authentication failed: {error}")
    st.stop()

current_user_id = str(session_user.id)
user_metadata = getattr(session_user, "user_metadata", None) or {}
current_user_name = user_metadata.get("full_name") or session_user.email or "Account"

with st.sidebar:
    st.write(f"Signed in as **{current_user_name}**")
    if st.button("Sign out"):
        supabase.auth.sign_out()
        st.session_state.pop("supabase_session", None)
        st.rerun()

    st.divider()
    filter_status = st.selectbox(
        "🎯 Filter by Status",
        options=["All Topics", "🔔 Due for Revision", "Not Started", "✅ Mastered ('Can explain')"]
    )
    search_query = st.text_input("🔍 Search Topics", placeholder="e.g. slicing, bytecode...")


# ---- MAIN DASHBOARD ---------------------------------------------------------
st.header(f"Study Dashboard for: `{current_user_name}`")

topics, prog_map = load_curriculum_and_progress(current_user_id)

# Metrics calculation
today = datetime.date.today()
mastered_count = sum(1 for t in topics if prog_map.get(t["id"], {}).get("status") == "Can explain")
due_count = 0
for t in topics:
    p = prog_map.get(t["id"])
    if p and p.get("status") == "Can explain" and p.get("next_revision"):
        try:
            rev_date = datetime.date.fromisoformat(p["next_revision"])
            if rev_date <= today:
                due_count += 1
        except Exception:
            pass

col1, col2, col3 = st.columns(3)
col1.metric("Topics Mastered", f"{mastered_count} / {len(topics)}")
col2.metric("🔔 Due for Revision Today", due_count)
col3.metric("Total Curriculum", len(topics))

st.divider()

# Filter topics
filtered_topics = []
for t in topics:
    p = prog_map.get(t["id"], {})
    is_mastered = p.get("status") == "Can explain"
    is_due = False
    if is_mastered and p.get("next_revision"):
        try:
            if datetime.date.fromisoformat(p["next_revision"]) <= today:
                is_due = True
        except Exception:
            pass

    if filter_status == "🔔 Due for Revision" and not is_due:
        continue
    if filter_status == "✅ Mastered ('Can explain')" and not is_mastered:
        continue
    if filter_status == "Not Started" and is_mastered:
        continue

    if search_query:
        q = search_query.lower()
        if q not in t["title"].lower() and q not in t["id"].lower() and q not in t["subsection"].lower():
            continue

    filtered_topics.append((t, p, is_due))

# Display Topics
if not filtered_topics:
    st.info("No topics found matching your criteria.")

for topic, progress, is_due in filtered_topics:
    t_id = topic["id"]
    t_title = topic["title"]
    t_section = topic["section"]
    t_sub = topic["subsection"]
    t_priority = topic.get("priority", "P0")
    status = progress.get("status", "Not started")
    revs = progress.get("revisions_done", 0)

    # Badges
    status_label = "⚪ Not Started"
    if is_due:
        status_label = "🔔 Revision Due"
    elif status == "Can explain":
        status_label = f"✅ Mastered ({revs} revs)"

    with st.expander(f"**{t_id}** — {t_title} | `{t_priority}` | {status_label}"):
        st.caption(f"{t_section} › {t_sub}")

        tab_notes, tab_quiz = st.tabs(["📖 Study Notes", "❓ Interactive Quiz"])

        # TAB 1: NOTES
        with tab_notes:
            notes_content = topic.get("notes_markdown")
            if not notes_content:
                if st.button("✨ Generate Comprehensive Notes with Gemini", key=f"btn_notes_{t_id}"):
                    with st.spinner("Gemini is drafting study notes with examples and gotchas..."):
                        notes_content = generate_study_notes(t_id, t_title, t_section, t_sub)
                        if supabase:
                            supabase.table("topics").update({"notes_markdown": notes_content}).eq("id", t_id).execute()
                        st.session_state[f"notes_{t_id}"] = notes_content
                        st.rerun()
            else:
                st.markdown(notes_content)

        # TAB 2: QUIZ
        with tab_quiz:
            quiz_key = f"quiz_data_{t_id}"
            is_rev = is_due or (status == "Can explain")

            if quiz_key not in st.session_state:
                button_label = "🔄 Start Spaced Revision Quiz" if is_rev else "❓ Start Topic Quiz (3 Questions)"
                if st.button(button_label, key=f"start_quiz_{t_id}"):
                    with st.spinner("Gemini is generating custom quiz questions..."):
                        st.session_state[quiz_key] = generate_quiz(t_id, t_title, t_section, is_revision=is_rev)
                        st.rerun()
            else:
                quiz_data = st.session_state[quiz_key]
                questions = quiz_data.get("questions", [])

                with st.form(key=f"form_quiz_{t_id}"):
                    user_answers = []
                    for q_idx, q in enumerate(questions):
                        st.markdown(f"**{q_idx + 1}. {q['question']}**")
                        ans = st.radio(
                            "Select answer:",
                            options=range(len(q["options"])),
                            format_func=lambda i, opts=q["options"]: opts[i],
                            key=f"q_{t_id}_{q_idx}"
                        )
                        user_answers.append(ans)
                        st.write("")

                    submitted = st.form_submit_button("Submit Answers")

                    if submitted:
                        score = 0
                        for q_idx, q in enumerate(questions):
                            user_ans = user_answers[q_idx]
                            correct = q["correctIndex"]
                            if user_ans == correct:
                                score += 1
                                st.success(f"**Q{q_idx+1}: Correct!** {q['explanation']}")
                            else:
                                st.error(f"**Q{q_idx+1}: Incorrect.** Correct: {q['options'][correct]}\n\n{q['explanation']}")

                        total = len(questions)
                        passed = score >= (total * 0.6)

                        if passed:
                            st.balloons()
                            st.success(f"🎉 Passed with {score}/{total}! Progress saved.")
                            save_quiz_result(current_user_id, t_id, score, total, is_rev)
                        else:
                            st.warning(f"Score: {score}/{total}. Review notes and try again!")
