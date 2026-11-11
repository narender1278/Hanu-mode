"""Seed topics from Google Sheet CSV into Supabase.

Usage:
    python seed_supabase.py

Reads SUPABASE_URL and SUPABASE_KEY from .env file.
"""
import csv
import io
import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

SHEET_CSV_URL = (
    "https://docs.google.com/spreadsheets/d/1tlFXJrv100umuJU7m0l2Ixt7-AxbFtuhtJUIAfeCrsQ/export?format=csv&gid=1927836796"
)

if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit(
        "❌ Missing SUPABASE_URL or SUPABASE_KEY in .env file.\n"
        "Add them to your .env:\n"
        "SUPABASE_URL=https://your-project.supabase.co\n"
        "SUPABASE_KEY=your-supabase-service-role-or-anon-key\n"
    )

try:
    from supabase import create_client, Client
except ImportError:
    sys.exit("❌ Please install supabase-py: pip install supabase")

def fetch_sheet_topics():
    print(f"📥 Fetching topics from Google Sheet...")
    res = requests.get(SHEET_CSV_URL)
    res.raise_for_status()

    f = io.StringIO(res.text)
    reader = csv.reader(f)
    header = next(reader)
    # Header: ID, Section, Subsection, Topic, Priority, Status, Date Learned, Revisions Done, Last Revised, Next Revision, Due?, Notes / Link

    topics = []
    for row in reader:
        if not row or len(row) < 4:
            continue
        topic_id = row[0].strip()
        section = row[1].strip()
        subsection = row[2].strip()
        title = row[3].strip()
        priority = row[4].strip() if len(row) > 4 else "P0"
        note_url = row[11].strip() if len(row) > 11 else ""

        if not topic_id or not title:
            continue

        topics.append({
            "id": topic_id,
            "section": section,
            "subsection": subsection,
            "title": title,
            "priority": priority or "P0",
            "notes_doc_url": note_url or None
        })

    print(f"✅ Found {len(topics)} topics in Google Sheet.")
    return topics

def seed():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    topics = fetch_sheet_topics()

    print(f"🚀 Upserting topics into Supabase 'topics' table...")
    # Upsert in batches of 20
    batch_size = 20
    for i in range(0, len(topics), batch_size):
        batch = topics[i : i + batch_size]
        res = supabase.table("topics").upsert(batch).execute()
        print(f"  Synced topics {i + 1} to {min(i + batch_size, len(topics))}...")

    print("🎉 All topics successfully imported into Supabase!")

if __name__ == "__main__":
    seed()
