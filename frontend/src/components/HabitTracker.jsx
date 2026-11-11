import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Flame, Calendar, Award } from 'lucide-react';

const DEFAULT_HABITS = [
  "Do 30 min yoga",
  "Drink 3L of water",
  "Solve 2 DSA problems",
  "Study 1 Roadmap topic",
  "Read 15 mins tech docs",
  "Daily walk / workout",
  "Track daily expenses",
  "Sleep before 11:30 PM"
];

export default function HabitTracker() {
  const today = new Date();
  const currentDay = today.getDate(); // 1 - 31
  const daysInMonth = 31; // Days 1 to 31 as in spreadsheet
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Month & year label
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthName = monthNames[today.getMonth()] + " " + today.getFullYear();

  // Load habits list
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('study_habits_list');
    return saved ? JSON.parse(saved) : DEFAULT_HABITS;
  });

  // Load grid state: { [habitIdx]: { [day]: boolean } }
  const [grid, setGrid] = useState(() => {
    const saved = localStorage.getItem('study_habits_grid');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Initialize default checks
    const initial = {};
    DEFAULT_HABITS.forEach((_, hIdx) => {
      initial[hIdx] = {};
    });
    return initial;
  });

  const [newHabitText, setNewHabitText] = useState('');

  // Save changes
  useEffect(() => {
    localStorage.setItem('study_habits_list', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('study_habits_grid', JSON.stringify(grid));
  }, [grid]);

  // Toggle habit for a day
  const toggleCheck = (hIdx, day) => {
    setGrid(prev => {
      const habitDays = prev[hIdx] || {};
      const nextChecked = !habitDays[day];
      return {
        ...prev,
        [hIdx]: {
          ...habitDays,
          [day]: nextChecked
        }
      };
    });
  };

  // Add new habit
  const handleAddHabit = (e) => {
    e.preventDefault();
    if (newHabitText.trim()) {
      setHabits(prev => [...prev, newHabitText.trim()]);
      setNewHabitText('');
    }
  };

  // Delete habit
  const handleDeleteHabit = (idx) => {
    if (confirm("Delete this habit row?")) {
      setHabits(prev => prev.filter((_, i) => i !== idx));
      setGrid(prev => {
        const next = {};
        let newIdx = 0;
        habits.forEach((_, oldIdx) => {
          if (oldIdx !== idx) {
            next[newIdx] = prev[oldIdx] || {};
            newIdx++;
          }
        });
        return next;
      });
    }
  };

  // Calculate statistics per day
  const totalHabits = habits.length;

  const getDayStats = (day) => {
    if (totalHabits === 0) return { completed: 0, uncompleted: 0, percent: 0 };
    let completed = 0;
    habits.forEach((_, hIdx) => {
      if (grid[hIdx]?.[day]) completed++;
    });
    const uncompleted = totalHabits - completed;
    const percent = Math.round((completed / totalHabits) * 100);
    return { completed, uncompleted, percent };
  };

  // Calculate today's completion
  const todayStats = getDayStats(currentDay);

  // Overall monthly score
  let totalPossible = totalHabits * daysInMonth;
  let totalDoneAllMonth = 0;
  daysArray.forEach(d => {
    habits.forEach((_, hIdx) => {
      if (grid[hIdx]?.[d]) totalDoneAllMonth++;
    });
  });
  const overallMonthPercent = totalPossible > 0 ? Math.round((totalDoneAllMonth / totalPossible) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h2 className="text-xl font-bold text-slate-900">The Momentum — Daily Habit Tracker</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking for: <span className="font-semibold text-blue-600">{currentMonthName}</span> &bull; Day {currentDay} of {daysInMonth}
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Today's Progress</div>
            <div className="text-lg font-extrabold text-emerald-800">{todayStats.percent}% <span className="text-xs font-normal">({todayStats.completed}/{totalHabits})</span></div>
          </div>

          <div className="bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-xl text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Monthly Average</div>
            <div className="text-lg font-extrabold text-blue-800">{overallMonthPercent}%</div>
          </div>
        </div>
      </div>

      {/* ADD HABIT FORM */}
      <form onSubmit={handleAddHabit} className="flex gap-2">
        <input 
          type="text"
          placeholder="Add a new daily habit (e.g. Read 20 mins, Drink 3L water, 50 pushups)..."
          value={newHabitText}
          onChange={(e) => setNewHabitText(e.target.value)}
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button 
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition inline-flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Habit</span>
        </button>
      </form>

      {/* HABIT TRACKER MATRIX TABLE (Pixel-perfect matching spreadsheet screenshot) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                <th className="py-3 px-3 text-left w-10 text-slate-400">#</th>
                <th className="py-3 px-4 text-left min-w-[200px] text-slate-800">Habits</th>
                {daysArray.map(day => (
                  <th 
                    key={day} 
                    className={`py-3 px-1.5 min-w-[32px] text-xs font-mono font-bold ${
                      day === currentDay ? 'bg-blue-100 text-blue-800 font-extrabold' : ''
                    }`}
                  >
                    {day}
                  </th>
                ))}
                <th className="py-3 px-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {habits.map((habit, hIdx) => {
                return (
                  <tr key={hIdx} className="hover:bg-slate-50/70 transition">
                    <td className="py-2 px-3 text-left text-xs font-mono text-slate-400 font-semibold">{hIdx + 1}</td>
                    <td className="py-2 px-4 text-left font-medium text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                      {habit}
                    </td>
                    {daysArray.map(day => {
                      const isChecked = Boolean(grid[hIdx]?.[day]);
                      const isToday = day === currentDay;

                      return (
                        <td 
                          key={day} 
                          onClick={() => toggleCheck(hIdx, day)}
                          className={`p-1 cursor-pointer transition select-none ${
                            isToday ? 'bg-blue-50/60' : ''
                          } hover:bg-slate-100`}
                        >
                          <div className={`w-5 h-5 mx-auto rounded flex items-center justify-center transition border ${
                            isChecked 
                              ? 'bg-slate-900 border-slate-900 text-white' 
                              : 'bg-white border-slate-300 hover:border-slate-500'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-2 px-3 text-center">
                      <button 
                        onClick={() => handleDeleteHabit(hIdx)}
                        className="text-slate-300 hover:text-rose-600 p-1 rounded transition"
                        title="Delete habit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* SUMMARY ROW 1: COMPLETED COUNT */}
              <tr className="bg-slate-50 font-semibold text-xs text-slate-700 border-t-2 border-slate-300">
                <td className="py-2 px-3 text-left text-slate-400 font-bold">&Sigma;</td>
                <td className="py-2 px-4 text-left font-bold text-slate-800">Completed</td>
                {daysArray.map(day => {
                  const { completed } = getDayStats(day);
                  const isToday = day === currentDay;
                  return (
                    <td key={day} className={`py-2 px-1 font-mono text-center font-bold ${isToday ? 'bg-blue-100/70' : ''}`}>
                      {completed}
                    </td>
                  );
                })}
                <td></td>
              </tr>

              {/* SUMMARY ROW 2: UNCOMPLETED COUNT */}
              <tr className="bg-slate-50 font-semibold text-xs text-slate-500">
                <td className="py-2 px-3"></td>
                <td className="py-2 px-4 text-left font-semibold text-slate-600">Uncompleted</td>
                {daysArray.map(day => {
                  const { uncompleted } = getDayStats(day);
                  const isToday = day === currentDay;
                  return (
                    <td key={day} className={`py-2 px-1 font-mono text-center text-slate-500 ${isToday ? 'bg-blue-100/70' : ''}`}>
                      {uncompleted}
                    </td>
                  );
                })}
                <td></td>
              </tr>

              {/* SUMMARY ROW 3: PERCENT (%) WITH COLOR CODING */}
              <tr className="border-t border-slate-200 font-bold text-xs">
                <td className="py-2 px-3"></td>
                <td className="py-2 px-4 text-left font-bold text-slate-900">Percent (%)</td>
                {daysArray.map(day => {
                  const { percent } = getDayStats(day);
                  const isToday = day === currentDay;

                  // Conditional color background like spreadsheet image
                  let bgClass = "bg-slate-50 text-slate-400";
                  if (percent >= 80) bgClass = "bg-emerald-100 text-emerald-900 font-extrabold";
                  else if (percent >= 50) bgClass = "bg-teal-50 text-teal-800";
                  else if (percent >= 25) bgClass = "bg-rose-50 text-rose-800";
                  else if (percent > 0) bgClass = "bg-rose-100 text-rose-900";

                  return (
                    <td 
                      key={day} 
                      className={`py-2 px-1 font-mono text-[11px] text-center ${bgClass} ${
                        isToday ? 'ring-2 ring-blue-500 ring-inset' : ''
                      }`}
                    >
                      {percent}%
                    </td>
                  );
                })}
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
