import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import ReactMarkdown from 'react-markdown';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  RotateCw, 
  Search, 
  Sparkles, 
  User, 
  Database,
  Award,
  AlertCircle,
  Copy,
  Download,
  CalendarCheck,
  CheckSquare,
  DollarSign,
  PlusCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { generateStudyNotes, generateQuiz } from './geminiClient';
import { DEFAULT_TOPICS } from './curriculumData';
import { GATE_TOPICS } from './curriculumGate';
import { NEETCODE_TOPICS } from './curriculumNeetcode';
import HabitTracker from './components/HabitTracker';
import TodoTracker from './components/TodoTracker';
import ExpensesView from './components/ExpensesView';

// Pre-packaged Roadmaps
const INITIAL_ROADMAPS = {
  'fullstack': { id: 'fullstack', name: '🎓 Full-Stack & AI Engineering', topics: DEFAULT_TOPICS },
  'gate_cse': { id: 'gate_cse', name: '🏛️ GATE CSE 2027', topics: GATE_TOPICS },
  'neetcode': { id: 'neetcode', name: '💻 NeetCode 150 / DSA', topics: NEETCODE_TOPICS },
};

export default function App() {
  // Top Navigation View: 'roadmaps' | 'habits' | 'todos' | 'expenses'
  const [activeTab, setActiveTab] = useState('roadmaps');

  // Roadmaps state
  const [customRoadmaps, setCustomRoadmaps] = useState(() => {
    const saved = localStorage.getItem('custom_roadmaps');
    return saved ? JSON.parse(saved) : {};
  });
  const [activeRoadmapId, setActiveRoadmapId] = useState('fullstack');

  // Import Modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSheetUrl, setImportSheetUrl] = useState('');
  const [importRoadmapTitle, setImportRoadmapTitle] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  // Active roadmap object
  const currentRoadmap = useMemo(() => {
    if (INITIAL_ROADMAPS[activeRoadmapId]) return INITIAL_ROADMAPS[activeRoadmapId];
    if (customRoadmaps[activeRoadmapId]) return customRoadmaps[activeRoadmapId];
    return INITIAL_ROADMAPS['fullstack'];
  }, [activeRoadmapId, customRoadmaps]);

  const topics = currentRoadmap.topics || [];

  // User Profile
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('study_user') || 'Narender';
  });
  const [usersList, setUsersList] = useState(['Narender', 'Friend 1', 'Friend 2']);
  const [progressMap, setProgressMap] = useState({});

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(30);

  // Modals
  const [activeNotesTopic, setActiveNotesTopic] = useState(null);
  const [activeQuizTopic, setActiveQuizTopic] = useState(null);
  const [isRevisionQuiz, setIsRevisionQuiz] = useState(false);
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [notesContent, setNotesContent] = useState('');
  const [copiedNotes, setCopiedNotes] = useState(false);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Spaced repetition interval helper
  const calculateNextRevision = (revCount) => {
    const intervals = [1, 3, 7, 14, 30];
    const days = revCount < intervals.length ? intervals[revCount] : 30;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Group sections and counts
  const sectionStats = useMemo(() => {
    const counts = {};
    topics.forEach(t => {
      if (t.section) {
        counts[t.section] = (counts[t.section] || 0) + 1;
      }
    });
    return counts;
  }, [topics]);

  // Load progress
  useEffect(() => {
    localStorage.setItem('study_user', currentUser);
    const saved = localStorage.getItem(`study_progress_${activeRoadmapId}_${currentUser}`);
    if (saved) {
      try { setProgressMap(JSON.parse(saved)); } catch (e) { setProgressMap({}); }
    } else {
      setProgressMap({});
    }
    setSectionFilter('all');
    setVisibleCount(30);
  }, [currentUser, activeRoadmapId]);

  const saveLocalProgress = (newMap) => {
    setProgressMap(newMap);
    localStorage.setItem(`study_progress_${activeRoadmapId}_${currentUser}`, JSON.stringify(newMap));
  };

  // Add friend
  const handleAddFriend = () => {
    const name = prompt("Enter your friend's name (e.g. Rahul, Priya):");
    if (name && name.trim()) {
      const clean = name.trim();
      if (!usersList.includes(clean)) {
        setUsersList([...usersList, clean]);
      }
      setCurrentUser(clean);
    }
  };

  // Import custom Google Sheet Roadmap
  const handleImportSheet = async (e) => {
    e.preventDefault();
    if (!importSheetUrl.trim()) return;

    setImportLoading(true);
    try {
      let exportUrl = importSheetUrl.trim();
      if (exportUrl.includes('/edit')) {
        exportUrl = exportUrl.replace(/\/edit.*$/, '/export?format=csv');
      } else if (!exportUrl.includes('export?format=csv')) {
        exportUrl += '/export?format=csv';
      }

      const res = await fetch(exportUrl);
      if (!res.ok) throw new Error("Could not fetch Google Sheet. Make sure 'Anyone with the link can view' is enabled.");

      const text = await res.text();
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length < 2) throw new Error("Spreadsheet contains no data rows.");

      // Parse CSV rows
      const parsedTopics = [];
      for (let i = 1; i < lines.length; i++) {
        // Simple regex to split comma separated CSV
        const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length >= 2 && (cols[0] || cols[1])) {
          parsedTopics.push({
            id: cols[0] || `${i}`,
            section: cols[1] || 'General',
            subsection: cols[2] || '',
            title: cols[3] || cols[1] || `Topic ${i}`,
            priority: cols[4] || 'P0',
            noteUrl: cols[11] || ''
          });
        }
      }

      if (parsedTopics.length === 0) throw new Error("No valid topics extracted from sheet.");

      const newId = `custom_${Date.now()}`;
      const title = importRoadmapTitle.trim() || `Imported Roadmap (${parsedTopics.length} topics)`;

      const updated = {
        ...customRoadmaps,
        [newId]: {
          id: newId,
          name: `📑 ${title}`,
          topics: parsedTopics
        }
      };

      setCustomRoadmaps(updated);
      localStorage.setItem('custom_roadmaps', JSON.stringify(updated));
      setActiveRoadmapId(newId);
      setShowImportModal(false);
      setImportSheetUrl('');
      setImportRoadmapTitle('');
      alert(`🎉 Successfully imported "${title}" with ${parsedTopics.length} topics!`);
    } catch (err) {
      alert("Import Error: " + err.message);
    } finally {
      setImportLoading(false);
    }
  };

  // Open Notes
  const handleOpenNotes = async (topic) => {
    setActiveNotesTopic(topic);
    const cached = topic.notes_markdown || localStorage.getItem(`study_notes_${topic.id}`);
    if (cached) {
      setNotesContent(cached);
      return;
    }

    setGeneratingNotes(true);
    setNotesContent('');
    try {
      const generated = await generateStudyNotes(topic);
      setNotesContent(generated);
      localStorage.setItem(`study_notes_${topic.id}`, generated);
    } catch (err) {
      alert('Error generating notes: ' + err.message);
    } finally {
      setGeneratingNotes(false);
    }
  };

  const handleCopyNotes = () => {
    if (notesContent) {
      navigator.clipboard.writeText(notesContent);
      setCopiedNotes(true);
      setTimeout(() => setCopiedNotes(false), 2000);
    }
  };

  const handleDownloadNotes = () => {
    if (notesContent && activeNotesTopic) {
      const blob = new Blob([notesContent], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeNotesTopic.id}_notes.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Start Quiz
  const handleStartQuiz = async (topic, isRev = false) => {
    setActiveQuizTopic(topic);
    setIsRevisionQuiz(isRev);
    setQuizQuestions(null);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizLoading(true);

    try {
      const data = await generateQuiz(topic, isRev);
      setQuizQuestions(data.questions || []);
    } catch (err) {
      alert('Error generating quiz: ' + err.message);
      setActiveQuizTopic(null);
    } finally {
      setQuizLoading(false);
    }
  };

  // Submit Quiz
  const handleSubmitQuiz = async () => {
    if (!quizQuestions) return;

    for (let i = 0; i < quizQuestions.length; i++) {
      if (selectedAnswers[i] === undefined) {
        alert('Please answer all questions before submitting.');
        return;
      }
    }

    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) score++;
    });

    setQuizScore(score);
    setQuizSubmitted(true);

    const total = quizQuestions.length;
    const passed = score >= Math.ceil(total * 0.6);

    if (passed) {
      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });

      const currentProg = progressMap[activeQuizTopic.id] || {};
      const currentRevs = currentProg.revisions_done || 0;
      const nextRevs = isRevisionQuiz ? currentRevs + 1 : 0;
      const nextRevDate = calculateNextRevision(nextRevs);

      const updatedRow = {
        topic_id: activeQuizTopic.id,
        status: 'Can explain',
        revisions_done: nextRevs,
        date_learned: isRevisionQuiz ? currentProg.date_learned : todayStr,
        last_revised: isRevisionQuiz ? todayStr : null,
        next_revision: nextRevDate,
        last_score: `${score}/${total}`
      };

      const newMap = { ...progressMap, [activeQuizTopic.id]: updatedRow };
      saveLocalProgress(newMap);
    }
  };

  // Filtered topics
  const filteredTopics = topics.filter(t => {
    const p = progressMap[t.id] || {};
    const isMastered = p.status === 'Can explain';
    const isDue = isMastered && p.next_revision && p.next_revision <= todayStr;

    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      (t.subsection && t.subsection.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (sectionFilter !== 'all' && t.section !== sectionFilter) return false;
    if (statusFilter === 'due') return isDue;
    if (statusFilter === 'mastered') return isMastered;
    if (statusFilter === 'notstarted') return !isMastered;
    return true;
  });

  // Calculate metrics
  const masteredCount = Object.values(progressMap).filter(p => p.status === 'Can explain').length;
  const dueCount = Object.values(progressMap).filter(p => p.status === 'Can explain' && p.next_revision && p.next_revision <= todayStr).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-slate-900">Life & Study Command Center</h1>
              <p className="text-xs text-slate-500 font-medium">Roadmaps &bull; Habits &bull; Tasks &bull; Finances</p>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* User selector */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
              <User className="w-4 h-4 text-slate-500 ml-2" />
              <select 
                value={currentUser} 
                onChange={(e) => setCurrentUser(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none pr-2 cursor-pointer"
              >
                {usersList.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <button 
                onClick={handleAddFriend}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-2.5 py-1 rounded-md transition"
              >
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* PRIMARY VIEW NAVIGATION TABS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto border-t border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('roadmaps')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'roadmaps'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Study Roadmaps ({topics.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('habits')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'habits'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Daily Habits (Momentum)</span>
          </button>

          <button
            onClick={() => setActiveTab('todos')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'todos'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>To-Do Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'expenses'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Monthly Expenses</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* VIEW 1: ROADMAPS */}
        {activeTab === 'roadmaps' && (
          <div className="space-y-6">
            {/* ROADMAP SELECTOR BANNER */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">🗺️</span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Study Roadmap</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <select
                      value={activeRoadmapId}
                      onChange={(e) => setActiveRoadmapId(e.target.value)}
                      className="text-base font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none cursor-pointer focus:border-blue-500"
                    >
                      {Object.values(INITIAL_ROADMAPS).map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.topics.length} topics)</option>
                      ))}
                      {Object.values(customRoadmaps).map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.topics.length} topics)</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowImportModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition inline-flex items-center gap-2 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Import Google Sheet Roadmap</span>
              </button>
            </div>

            {/* STATS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Topics Mastered</span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-600 mt-2">
                  {masteredCount} <span className="text-sm font-normal text-slate-400">/ {topics.length}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">🔔 Revisions Due Today</span>
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-3xl font-extrabold text-amber-600 mt-2">
                  {dueCount}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Curriculum Size</span>
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-extrabold text-slate-900 mt-2">
                  {topics.length} <span className="text-sm font-normal text-slate-400">Topics</span>
                </div>
              </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="text" 
                  placeholder={`Search ${topics.length} topics (e.g. slicing, logic, trees, docker)...`}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setVisibleCount(30);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select 
                value={sectionFilter}
                onChange={(e) => {
                  setSectionFilter(e.target.value);
                  setVisibleCount(30);
                }}
                className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 outline-none cursor-pointer focus:border-blue-500"
              >
                <option value="all">📚 All Sections ({topics.length})</option>
                {Object.entries(sectionStats).map(([sec, count]) => (
                  <option key={sec} value={sec}>{sec} ({count})</option>
                ))}
              </select>

              <select 
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setVisibleCount(30);
                }}
                className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 outline-none cursor-pointer focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="due">🔔 Due for Revision</option>
                <option value="notstarted">⚪ Not Started</option>
                <option value="mastered">✅ Mastered ('Can explain')</option>
              </select>
            </div>

            {/* TOPICS LIST */}
            <div className="space-y-3">
              {filteredTopics.slice(0, visibleCount).map((topic) => {
                const p = progressMap[topic.id] || {};
                const isMastered = p.status === 'Can explain';
                const isDue = isMastered && p.next_revision && p.next_revision <= todayStr;
                const revs = p.revisions_done || 0;

                return (
                  <div 
                    key={topic.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {topic.id}
                        </span>
                        <span className="text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">
                          {topic.priority || 'P0'}
                        </span>
                        
                        {isDue ? (
                          <span className="text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full animate-pulse">
                            🔔 Revision Due
                          </span>
                        ) : isMastered ? (
                          <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Mastered ({revs} revs)
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">
                            Not Started
                          </span>
                        )}

                        {p.next_revision && (
                          <span className="text-xs text-slate-400">
                            &bull; Next Rev: {p.next_revision}
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-base text-slate-900 leading-snug">
                        {topic.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {topic.section} {topic.subsection ? `› ${topic.subsection}` : ''}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button 
                        onClick={() => handleOpenNotes(topic)}
                        className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold px-3.5 py-2 rounded-lg transition"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Study Notes</span>
                      </button>

                      <button 
                        onClick={() => handleStartQuiz(topic, false)}
                        className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3.5 py-2 rounded-lg transition"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>Take Quiz</span>
                      </button>

                      {isMastered && (
                        <button 
                          onClick={() => handleStartQuiz(topic, true)}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition border ${
                            isDue 
                              ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-sm'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>{isDue ? '⚡ Revise Now' : 'Revise'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SHOW MORE BUTTON */}
            {filteredTopics.length > visibleCount && (
              <div className="text-center pt-8">
                <button
                  onClick={() => setVisibleCount(prev => prev + 30)}
                  className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs px-6 py-3 rounded-xl shadow-sm transition inline-flex items-center gap-2"
                >
                  <span>Load More Topics</span>
                  <span className="text-slate-400">({visibleCount} of {filteredTopics.length})</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: DAILY HABIT TRACKER */}
        {activeTab === 'habits' && (
          <HabitTracker />
        )}

        {/* VIEW 3: TO-DO TRACKER */}
        {activeTab === 'todos' && (
          <TodoTracker />
        )}

        {/* VIEW 4: MONTHLY EXPENSES */}
        {activeTab === 'expenses' && (
          <ExpensesView />
        )}

      </main>

      {/* IMPORT GOOGLE SHEET MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Import Roadmap from Google Sheet</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Paste the link to any Google Sheet containing your study syllabus. Make sure the spreadsheet has <b>"Anyone with the link can view"</b> enabled.
            </p>

            <form onSubmit={handleImportSheet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Roadmap Title (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. System Design Mastery, Data Science Roadmap"
                  value={importRoadmapTitle}
                  onChange={(e) => setImportRoadmapTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Google Sheet URL</label>
                <input 
                  type="url"
                  required
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={importSheetUrl}
                  onChange={(e) => setImportSheetUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition inline-flex items-center gap-1.5 shadow-sm"
                >
                  {importLoading ? "Fetching Sheet..." : "Import Roadmap"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTES MODAL */}
      {activeNotesTopic && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{activeNotesTopic.id}</span>
                <h3 className="font-bold text-base text-slate-900">{activeNotesTopic.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                {notesContent && !generatingNotes && (
                  <>
                    <button 
                      onClick={handleCopyNotes}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition"
                      title="Copy Markdown"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedNotes ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button 
                      onClick={handleDownloadNotes}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition"
                      title="Download Markdown file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .md</span>
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setActiveNotesTopic(null)}
                  className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 ml-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-white">
              {generatingNotes ? (
                <div className="py-20 text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-700 font-semibold text-sm">⚡ Generating notes with Gemini Flash-Lite...</p>
                  <p className="text-slate-400 text-xs mt-1">Usually takes 2–3 seconds</p>
                </div>
              ) : (
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <div className="mb-6 pb-3 border-b border-slate-200">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                          {children}
                        </h1>
                      </div>
                    ),
                    h2: ({ children }) => {
                      const text = String(children);
                      let badge = "📘";
                      let style = "bg-blue-50 text-blue-900 border-blue-200";
                      const lower = text.toLowerCase();
                      if (lower.includes("mental model") || lower.includes("overview")) {
                        badge = "🧠";
                        style = "bg-indigo-50 text-indigo-950 border-indigo-200";
                      } else if (lower.includes("code") || lower.includes("deep dive")) {
                        badge = "💻";
                        style = "bg-sky-50 text-sky-950 border-sky-200";
                      } else if (lower.includes("pitfall") || lower.includes("anti-pattern")) {
                        badge = "⚠️";
                        style = "bg-amber-50 text-amber-950 border-amber-300";
                      } else if (lower.includes("takeaway") || lower.includes("cheat sheet")) {
                        badge = "📌";
                        style = "bg-emerald-50 text-emerald-950 border-emerald-200";
                      } else if (lower.includes("interview")) {
                        badge = "🎯";
                        style = "bg-purple-50 text-purple-950 border-purple-200";
                      }

                      return (
                        <div className={`mt-8 mb-3 p-3 rounded-xl border font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-sm ${style}`}>
                          <span className="text-lg">{badge}</span>
                          <span>{children}</span>
                        </div>
                      );
                    },
                    h3: ({ children }) => (
                      <h3 className="text-sm sm:text-base font-bold text-slate-800 mt-5 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-blue-600 rounded-full inline-block"></span>
                        <span>{children}</span>
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-sm leading-relaxed text-slate-700 my-2.5">
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-slate-900">
                        {children}
                      </strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="my-2.5 space-y-1.5 pl-5 list-disc text-sm text-slate-700">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="my-2.5 space-y-1.5 pl-5 list-decimal text-sm text-slate-700 font-medium">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed">
                        {children}
                      </li>
                    ),
                    code: ({ node, inline, className, children, ...props }) => {
                      const isInline = inline || !String(children).includes("\n");
                      if (isInline) {
                        return (
                          <code className="bg-slate-100 text-rose-600 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-xs font-semibold" {...props}>
                            {children}
                          </code>
                        );
                      }
                      return (
                        <div className="my-4 rounded-xl overflow-hidden border border-slate-800 shadow-md">
                          <div className="bg-slate-800 px-4 py-1.5 flex justify-between items-center text-xs text-slate-300 font-mono">
                            <span>python</span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400">code block</span>
                          </div>
                          <pre className="bg-slate-900 text-slate-100 p-4 text-xs font-mono overflow-x-auto leading-relaxed m-0">
                            <code>{children}</code>
                          </pre>
                        </div>
                      );
                    },
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 bg-blue-50/60 p-3.5 rounded-r-lg my-3 text-sm text-slate-800 italic">
                        {children}
                      </blockquote>
                    )
                  }}
                >
                  {notesContent}
                </ReactMarkdown>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 flex justify-between items-center bg-slate-50">
              <span className="text-xs text-slate-500">⚡ Powered by Gemini 3.1 Flash-Lite (Turbo)</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const t = activeNotesTopic;
                    setActiveNotesTopic(null);
                    handleStartQuiz(t, false);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition"
                >
                  Ready! Take Quiz &rsaquo;
                </button>
                <button 
                  onClick={() => setActiveNotesTopic(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs px-4 py-2 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUIZ MODAL */}
      {activeQuizTopic && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  {isRevisionQuiz ? '🔄 Spaced Revision Quiz' : '❓ Topic Mastery Quiz'}
                </span>
                <h3 className="font-bold text-base text-slate-900">{activeQuizTopic.title}</h3>
              </div>
              <button 
                onClick={() => setActiveQuizTopic(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {quizLoading ? (
                <div className="py-20 text-center">
                  <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-700 font-semibold text-sm">⚡ Generating questions with Gemini Flash-Lite...</p>
                  <p className="text-slate-400 text-xs mt-1">Usually takes 1–2 seconds</p>
                </div>
              ) : quizQuestions && (
                quizQuestions.map((q, qIdx) => {
                  const userAnswer = selectedAnswers[qIdx];
                  const isCorrect = userAnswer === q.correctIndex;

                  return (
                    <div key={q.id || qIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="font-semibold text-sm text-slate-900 mb-3 whitespace-pre-wrap">
                        {qIdx + 1}. {q.question}
                      </p>

                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <label 
                            key={optIdx}
                            className={`flex items-start gap-3 p-3 rounded-lg border text-sm cursor-pointer transition ${
                              selectedAnswers[qIdx] === optIdx
                                ? 'bg-blue-50 border-blue-300 text-blue-900 font-medium'
                                : 'bg-white border-slate-200 hover:bg-slate-100/70 text-slate-700'
                            }`}
                          >
                            <input 
                              type="radio" 
                              name={`q_${qIdx}`}
                              disabled={quizSubmitted}
                              checked={selectedAnswers[qIdx] === optIdx}
                              onChange={() => setSelectedAnswers({ ...selectedAnswers, [qIdx]: optIdx })}
                              className="mt-0.5 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>

                      {quizSubmitted && (
                        <div className={`mt-3 p-3 rounded-lg text-xs leading-relaxed border ${
                          isCorrect 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}>
                          <div className="font-bold mb-1">
                            {isCorrect ? '✅ Correct!' : `❌ Incorrect (Correct: ${q.options[q.correctIndex]})`}
                          </div>
                          <div>{q.explanation}</div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                {quizSubmitted && (
                  <span className="font-bold text-sm text-slate-800">
                    Score: {quizScore} / {quizQuestions?.length} {quizScore >= Math.ceil(quizQuestions?.length * 0.6) ? '🎉 Passed!' : '⚠️ Needs Review'}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {!quizSubmitted ? (
                  <button 
                    disabled={quizLoading}
                    onClick={handleSubmitQuiz}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition"
                  >
                    Submit Answers
                  </button>
                ) : (
                  <button 
                    onClick={() => setActiveQuizTopic(null)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
