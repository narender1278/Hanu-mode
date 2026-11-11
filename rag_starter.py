"""Chat with your documents: minimal RAG with Gemini + Chroma.

Usage:
    python rag_starter.py sample.txt
    python rag_starter.py my_notes.md another.pdf

Pipeline:
    1. Load files  ->  2. Split into chunks  ->  3. Embed chunks (Gemini)
    4. Store in Chroma (vector DB)  ->  5. For each question: retrieve top chunks
    6. Send chunks + question to the Gemini chat model  ->  7. Stream the answer
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

# ---- Config -----------------------------------------------------------------
# The key is read from the GOOGLE_API_KEY environment variable / .env file.
# (You can also paste it here as a string, but then never push this file to GitHub.)
API_KEY = os.getenv("GOOGLE_API_KEY")
CHAT_MODEL = os.getenv("CHAT_MODEL", "gemini-3.5-flash")
EMBED_MODEL = os.getenv("EMBED_MODEL", "gemini-embedding-001")

CHUNK_SIZE = 800      # characters per chunk
CHUNK_OVERLAP = 100   # overlap so sentences cut at a boundary aren't lost
TOP_K = 4             # how many chunks to retrieve per question
DB_DIR = "chroma_db"  # vector DB is saved here

if not API_KEY or API_KEY == "paste-your-key-here":
    sys.exit("Set GOOGLE_API_KEY in your .env file (get one at aistudio.google.com).")

# ---- Models -----------------------------------------------------------------
# These two objects are the ONLY provider-specific code. Swap them for Ollama,
# OpenAI or Claude later and the rest of the file stays identical.
llm = ChatGoogleGenerativeAI(model=CHAT_MODEL, google_api_key=API_KEY, temperature=0)
embeddings = GoogleGenerativeAIEmbeddings(model=EMBED_MODEL, google_api_key=API_KEY)


# ---- 1. Load documents ------------------------------------------------------
def load_file(path: Path) -> list[Document]:
    if path.suffix.lower() == ".pdf":
        from pypdf import PdfReader

        reader = PdfReader(str(path))
        return [
            Document(page_content=page.extract_text() or "",
                     metadata={"source": path.name, "page": i + 1})
            for i, page in enumerate(reader.pages)
        ]
    return [Document(page_content=path.read_text(encoding="utf-8"),
                     metadata={"source": path.name})]


# ---- 2-4. Chunk, embed, store ----------------------------------------------
def build_vector_store(paths: list[str]) -> Chroma:
    docs: list[Document] = []
    for p in paths:
        docs.extend(load_file(Path(p)))

    splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE,
                                              chunk_overlap=CHUNK_OVERLAP)
    chunks = [c for c in splitter.split_documents(docs) if c.page_content.strip()]
    for i, c in enumerate(chunks):
        c.metadata["chunk"] = i
    print(f"Loaded {len(docs)} document part(s) -> {len(chunks)} chunks")

    store = Chroma(collection_name="docs", embedding_function=embeddings,
                   persist_directory=DB_DIR)
    store.reset_collection()  # start fresh so re-runs don't create duplicates
    store.add_documents(chunks)  # this is where embedding API calls happen
    return store


# ---- 5-7. Retrieve and answer ----------------------------------------------
CONDENSE_QUESTION_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "Given a chat history and the latest user question which might reference context in the chat history, "
        "formulate a standalone search question which can be understood without the chat history. "
        "Do NOT answer the question, just reformulate it if needed and otherwise return it as is."
    ),
    (
        "human",
        "Chat History:\n{history}\n\nFollow-up question: {question}\n\nStandalone question:"
    )
])
condense_chain = CONDENSE_QUESTION_PROMPT | llm | StrOutputParser()

PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are a helpful assistant answering questions based on the provided document context.

Guidelines:
1. Base your answers on the provided context and conversation history.
2. If the context does not explicitly mention the exact topic, state clearly what the document DOES say regarding related policies (e.g., if asked about personal travel, explain that the policy only covers travel for client visits).
3. You can draw direct, reasonable logical conclusions from the context (e.g., if an expense is reimbursable "with a bill", you may clarify that claims without a bill are not supported).
4. If a topic is completely absent from the context and cannot be deduced, say "I couldn't find that in the documents."
5. Keep your answers concise, clear, and accurate."""
    ),
    (
        "human",
        """Conversation History:
{history}

Document Context:
{context}

Question: {question}

Answer:"""
    )
])
chain = PROMPT | llm | StrOutputParser()


def format_context(docs: list[Document]) -> str:
    return "\n\n".join(
        f"[{i + 1}] (source: {d.metadata.get('source')}"
        f"{', page ' + str(d.metadata['page']) if 'page' in d.metadata else ''})\n"
        f"{d.page_content}"
        for i, d in enumerate(docs)
    )


def format_history(history: list[tuple[str, str]]) -> str:
    if not history:
        return "None"
    return "\n".join(f"User: {q}\nAI: {a}" for q, a in history[-4:])


def ask(store: Chroma, question: str, history: list[tuple[str, str]]) -> str:
    history_str = format_history(history)
    search_query = question
    if history:
        search_query = condense_chain.invoke({
            "history": history_str,
            "question": question
        }).strip()

    docs = store.similarity_search(search_query, k=TOP_K)
    print("\nAnswer: ", end="", flush=True)
    full_answer: list[str] = []
    for piece in chain.stream({
        "context": format_context(docs),
        "history": history_str,
        "question": question
    }):
        print(piece, end="", flush=True)
        full_answer.append(piece)

    print("\n\nSources used:")
    for i, d in enumerate(docs, 1):
        page = f", page {d.metadata['page']}" if "page" in d.metadata else ""
        preview = d.page_content[:80].replace("\n", " ")
        print(f"  [{i}] {d.metadata.get('source')}{page}: {preview}...")

    return "".join(full_answer)


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("Usage: python rag_starter.py <file1> [file2 ...]  (.txt, .md, .pdf)")
    store = build_vector_store(sys.argv[1:])

    history: list[tuple[str, str]] = []
    print("\nAsk questions about your documents. Type 'exit' to quit.")
    while True:
        question = input("\nYou: ").strip()
        if question.lower() in {"exit", "quit", ""}:
            break
        answer = ask(store, question, history)
        history.append((question, answer))


if __name__ == "__main__":
    main()
