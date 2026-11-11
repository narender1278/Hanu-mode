import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, Calendar, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';

const DEFAULT_TODOS = [
  { id: 1, text: "Revise Python execution model & bytecode", category: "Study", priority: "P0", done: true, due: "Today" },
  { id: 2, text: "Solve 2 LeetCode medium questions (Two Pointers)", category: "Study", priority: "P0", done: false, due: "Today" },
  { id: 3, text: "Pay Axis Bank EMI & check hostel dues", category: "Expense", priority: "P1", done: false, due: "Tomorrow" },
  { id: 4, text: "Complete GATE Discrete Math Logic questions", category: "Study", priority: "P1", done: false, due: "This Week" },
  { id: 5, text: "Drink 3L of water and complete 30m yoga", category: "Habit", priority: "P2", done: false, due: "Daily" }
];

export default function TodoTracker() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('study_todos_list');
    return saved ? JSON.parse(saved) : DEFAULT_TODOS;
  });

  const [text, setText] = useState('');
  const [category, setCategory] = useState('Study');
  const [priority, setPriority] = useState('P0');
  const [due, setDue] = useState('Today');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    localStorage.setItem('study_todos_list', JSON.stringify(todos));
  }, [todos]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (text.trim()) {
      const newTodo = {
        id: Date.now(),
        text: text.trim(),
        category,
        priority,
        due,
        done: false,
        createdAt: new Date().toLocaleDateString()
      };
      setTodos([newTodo, ...todos]);
      setText('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'completed') return t.done;
    return true;
  });

  const completedCount = todos.filter(t => t.done).length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <h2 className="text-xl font-bold text-slate-900">Personal Action & To-Do Tracker</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Organize daily revision, problem sets, and pending action items.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-center">
            <span className="text-xs font-semibold text-emerald-700">Completed</span>
            <div className="text-lg font-bold text-emerald-800">{completedCount} / {todos.length}</div>
          </div>
        </div>
      </div>

      {/* ADD TODO FORM */}
      <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <input 
          type="text"
          placeholder="What do you need to accomplish today?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <div className="flex flex-wrap gap-2">
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="Study">📚 Study</option>
            <option value="DSA">💻 DSA</option>
            <option value="Expense">💰 Expense</option>
            <option value="Habit">🎯 Habit</option>
            <option value="Personal">👤 Personal</option>
          </select>

          <select 
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="P0">🔴 P0 Urgent</option>
            <option value="P1">🟡 P1 Medium</option>
            <option value="P2">🟢 P2 Low</option>
          </select>

          <select 
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="Today">Today</option>
            <option value="Tomorrow">Tomorrow</option>
            <option value="This Week">This Week</option>
            <option value="Daily">Daily Routine</option>
          </select>

          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2 rounded-xl transition inline-flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </form>

      {/* FILTER TABS */}
      <div className="flex gap-2">
        {['all', 'active', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
              filter === f 
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f} {f === 'all' ? `(${todos.length})` : f === 'active' ? `(${todos.length - completedCount})` : `(${completedCount})`}
          </button>
        ))}
      </div>

      {/* TASK LIST */}
      <div className="space-y-2">
        {filteredTodos.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
            No tasks found in this view. Add one above!
          </div>
        )}

        {filteredTodos.map(todo => {
          const isDone = todo.done;

          const pBadge = 
            todo.priority === 'P0' ? 'bg-rose-50 text-rose-700 border-rose-200' :
            todo.priority === 'P1' ? 'bg-amber-50 text-amber-700 border-amber-200' :
            'bg-slate-100 text-slate-600 border-slate-200';

          return (
            <div 
              key={todo.id}
              className={`bg-white border rounded-xl p-4 transition flex items-center justify-between gap-3 ${
                isDone ? 'border-slate-200 bg-slate-50/60 opacity-70' : 'border-slate-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <button 
                  onClick={() => toggleTodo(todo.id)}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition flex-shrink-0 ${
                    isDone 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'border-slate-300 hover:border-slate-500 bg-white'
                  }`}
                >
                  {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {todo.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {todo.category}
                    </span>
                    <span className={`text-[10px] font-bold border px-2 py-0.5 rounded ${pBadge}`}>
                      {todo.priority}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {todo.due}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => deleteTodo(todo.id)}
                className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg transition flex-shrink-0"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
