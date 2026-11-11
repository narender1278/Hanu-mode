import React, { useState } from 'react';
import { EXPENSES_DATA } from '../expensesData';
import { IndianRupee, ArrowDownRight, ArrowUpRight, Wallet, Calendar, AlertTriangle } from 'lucide-react';

export default function ExpensesView() {
  const { months, items } = EXPENSES_DATA;
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(1); // Default to 'Nov' (current)

  const selectedMonthName = months[selectedMonthIdx] || 'Nov';

  // Calculate salary, expenses, and balance for selected month
  let salary = 0;
  let totalExpenses = 0;
  let balance = 0;

  items.forEach(item => {
    const val = item.values[selectedMonthIdx] || 0;
    const nameLower = item.name.toLowerCase();

    if (nameLower.includes('salary')) {
      salary = val;
    } else if (nameLower.includes('balance')) {
      balance = val;
    } else {
      totalExpenses += val;
    }
  });

  if (balance === 0 && salary > 0) {
    balance = salary - totalExpenses;
  }

  // Format currency with Indian comma format
  const formatINR = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <h2 className="text-xl font-bold text-slate-900">Monthly Expenses & EMI Tracker</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracked across 22 months from your spreadsheet &bull; Current Month: <span className="font-semibold text-blue-600">{selectedMonthName} 2026</span>
          </p>
        </div>

        {/* Month Selector Dropdown */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <select 
            value={selectedMonthIdx}
            onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 outline-none cursor-pointer focus:border-blue-500"
          >
            {months.map((m, idx) => (
              <option key={idx} value={idx}>
                {m} (Month {idx + 1})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MONTHLY SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Monthly Inflow (Salary)</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {formatINR(salary)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Total Outflow (EMIs & Chits)</span>
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {formatINR(totalExpenses)}
          </div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-sm ${
          balance >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600">
            <span>Net Remaining Balance</span>
            <Wallet className="w-4 h-4 text-slate-700" />
          </div>
          <div className={`text-2xl font-black mt-2 ${balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatINR(balance)}
          </div>
          {balance < 0 && (
            <div className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold mt-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Projected deficit in {selectedMonthName}</span>
            </div>
          )}
        </div>
      </div>

      {/* FULL EXPENSES MATRIX TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-800">Complete Financial Ledger (All Months)</h3>
          <span className="text-xs text-slate-500">Scroll horizontally to view future months &rarr;</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4 sticky left-0 bg-slate-100 z-10 min-w-[160px] border-r border-slate-200">
                  Category / Line Item
                </th>
                {months.map((m, idx) => (
                  <th 
                    key={idx} 
                    className={`py-3 px-3 min-w-[95px] text-right font-mono ${
                      idx === selectedMonthIdx ? 'bg-blue-100 text-blue-900 font-extrabold' : ''
                    }`}
                  >
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, rowIdx) => {
                const nameLower = item.name.toLowerCase();
                const isSalary = nameLower.includes('salary');
                const isBalance = nameLower.includes('balance');

                let rowClass = "hover:bg-slate-50 transition";
                if (isSalary) rowClass = "bg-emerald-50/60 font-bold text-emerald-950";
                if (isBalance) rowClass = "bg-slate-900 font-bold text-white border-t-2 border-slate-800";

                return (
                  <tr key={rowIdx} className={rowClass}>
                    <td className={`py-2.5 px-4 sticky left-0 z-10 border-r border-slate-200 font-medium ${
                      isBalance ? 'bg-slate-900 text-white font-bold' : isSalary ? 'bg-emerald-50 text-emerald-900 font-bold' : 'bg-white text-slate-800'
                    }`}>
                      {item.name}
                    </td>

                    {item.values.map((val, colIdx) => {
                      const isHighlightedMonth = colIdx === selectedMonthIdx;
                      let cellClass = "text-right font-mono py-2.5 px-3";

                      if (isHighlightedMonth) {
                        cellClass += isBalance ? " bg-slate-800 font-extrabold text-emerald-400" : " bg-blue-50/60 font-bold";
                      }

                      if (isBalance && val < 0) {
                        cellClass += " text-rose-400 font-bold";
                      }

                      return (
                        <td key={colIdx} className={cellClass}>
                          {val !== 0 ? val.toLocaleString('en-IN') : '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
