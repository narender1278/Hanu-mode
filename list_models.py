"""Print the Gemini models your API key can use.

Model names change often, so run this if you get a 404 / "model not found" error,
then put a valid name in CHAT_MODEL / EMBED_MODEL in your .env file.
"""
import os

from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

for m in client.models.list():
    actions = ", ".join(m.supported_actions or [])
    print(f"{m.name:55s} {actions}")
