import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Check,
  Plus,
  Trash2,
  Wallet
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { EXPENSE_MONTHS } from '../expensesData';
const EMPTY_STATUS = { loading: true, error: '', saving: false };

function rowsToItems(rows) {
  const categories = new Map();
  rows.forEach((row) => {
    if (!categories.has(row.category_name)) {
      categories.set(row.category_name, {
        name: row.category_name,
        type: row.category_type,
        values: Array(EXPENSE_MONTHS.length).fill(0)
      });
    }

    const category = categories.get(row.category_name);
    if (row.month_index >= 0 && row.month_index < category.values.length) {
      category.values[row.month_index] = Number(row.amount) || 0;
    }
  });

  return [...categories.values()];
}

const formatINR = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(value);

export default function ExpensesView({ userId }) {
  const months = EXPENSE_MONTHS;
  const [items, setItems] = useState([]);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(1);
  const [status, setStatus] = useState(EMPTY_STATUS);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('expense');
  const [dirtyCells, setDirtyCells] = useState({});
  const [pendingSaves, setPendingSaves] = useState({});

  const loadExpenses = async () => {
    setStatus({ loading: true, error: '', saving: false });
    const { data, error } = await supabase
      .from('user_expenses')
      .select('category_name, category_type, month_index, amount')
      .eq('user_id', userId)
      .order('month_index')
      .order('category_name');

    if (error) {
      setItems([]);
      setStatus({
        loading: false,
        saving: false,
        error: `Could not load expenses: ${error.message}. Run supabase_expenses_schema.sql in your Supabase SQL Editor, then reload.`
      });
      return;
    }

    setItems(rowsToItems(data || []));
    setStatus({ loading: false, error: '', saving: false });
  };

  useEffect(() => {
    loadExpenses();
  }, [userId]);

  useEffect(() => {
    const channel = supabase
      .channel(`expenses-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_expenses',
        filter: `user_id=eq.${userId}`
      }, () => {
        loadExpenses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const selectedMonthName = months[selectedMonthIdx] || 'Month';
  const monthItems = useMemo(
    () => items.map((item) => ({
      ...item,
      amount: Number(item.values[selectedMonthIdx]) || 0
    })),
    [items, selectedMonthIdx]
  );
  const salary = monthItems
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = monthItems
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);
  const balanceItems = monthItems.filter((item) => item.type === 'balance');
  const balance = balanceItems.length
    ? balanceItems.reduce((sum, item) => sum + item.amount, 0)
    : salary - totalExpenses;

  const persistCell = async (itemName, monthIndex, rawValue) => {
    const amount = rawValue === '' ? 0 : Number(rawValue);
    if (!Number.isFinite(amount)) return;
    const item = items.find((entry) => entry.name === itemName);
    if (!item) return;

    const changeKey = `${itemName}:${monthIndex}`;
    setStatus((current) => ({ ...current, saving: true }));
    setDirtyCells((current) => ({ ...current, [changeKey]: true }));

    const { error } = await supabase.from('user_expenses').upsert({
      user_id: userId,
      category_name: item.name,
      category_type: item.type,
      month_index: monthIndex,
      amount
    }, { onConflict: 'user_id,category_name,month_index' });

    if (error) {
      setPendingSaves((current) => ({ ...current, [changeKey]: { itemName, monthIndex, amount } }));
      setStatus((current) => ({
        ...current,
        saving: false,
        error: `Could not save ${itemName}: ${error.message}. Your edit is still on screen; retry the save.`
      }));
      return;
    }

    setPendingSaves((current) => {
      const next = { ...current };
      delete next[changeKey];
      return next;
    });
    setDirtyCells((current) => {
      const next = { ...current };
      delete next[changeKey];
      return next;
    });
    setStatus((current) => ({ ...current, saving: false, error: '' }));
  };

  const retryPendingSaves = async () => {
    const pending = Object.values(pendingSaves);
    for (const change of pending) {
      await persistCell(change.itemName, change.monthIndex, String(change.amount));
    }
  };

  const addCategory = async (event) => {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) return;
    if (items.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      setStatus((current) => ({ ...current, error: 'A category with this name already exists.' }));
      return;
    }

    const newItem = { name, type: categoryType, values: Array(months.length).fill(0) };
    const nextItems = [...items, newItem];
    setItems(nextItems);
    setCategoryName('');
    setStatus((current) => ({ ...current, saving: true, error: '' }));

    const rows = newItem.values.map((amount, monthIndex) => ({
      user_id: userId,
      category_name: name,
      category_type: categoryType,
      month_index: monthIndex,
      amount
    }));
    const { error } = await supabase.from('user_expenses').insert(rows);

    if (error) {
      setItems(items);
      setStatus((current) => ({
        ...current,
        saving: false,
        error: `Could not add category: ${error.message}`
      }));
      return;
    }
    setStatus((current) => ({ ...current, saving: false, error: '' }));
  };

  const deleteCategory = async (item) => {
    if (!window.confirm(`Delete "${item.name}" and all its monthly values?`)) return;
    const previousItems = items;
    setItems((current) => current.filter((entry) => entry.name !== item.name));
    setStatus((current) => ({ ...current, saving: true, error: '' }));

    const { error } = await supabase
      .from('user_expenses')
      .delete()
      .eq('user_id', userId)
      .eq('category_name', item.name);

    if (error) {
      setItems(previousItems);
      setStatus((current) => ({
        ...current,
        saving: false,
        error: `Could not delete category: ${error.message}`
      }));
      return;
    }
    setStatus((current) => ({ ...current, saving: false, error: '' }));
  };

  if (status.loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading your private expense data...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">Money overview</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Monthly expense tracker</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Your expense data is saved to your private Supabase account. Edit an amount and leave the field to save.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2">
              <Calendar className="h-4 w-4 text-blue-200" />
              <span className="text-xs font-medium text-slate-200">Month</span>
              <select
                aria-label="Select month"
                value={selectedMonthIdx}
                onChange={(event) => setSelectedMonthIdx(Number(event.target.value))}
                className="max-w-28 cursor-pointer bg-transparent text-sm font-bold text-white outline-none [&>option]:text-slate-900"
              >
                {months.map((month, index) => (
                  <option key={`${month}-${index}`} value={index}>{month} {index + 1}</option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-1.5 text-xs text-slate-300" role="status">
              {status.saving ? null : <Check className="h-4 w-4 text-emerald-400" />}
              {status.saving ? 'Saving...' : 'Saved to your account'}
            </div>
          </div>
        </div>
      </section>

      {status.error && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{status.error}</span>
          {Object.keys(pendingSaves).length > 0 && (
            <button type="button" onClick={retryPendingSaves} className="shrink-0 rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-800">
              Retry save
            </button>
          )}
          {status.error.includes('Could not load expenses') && (
            <button type="button" onClick={loadExpenses} className="shrink-0 rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-800">
              Retry loading
            </button>
          )}
        </div>
      )}

      {!items.length && !status.error && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-900">
          This account has no expense categories yet. Add your first income, expense, or balance category below.
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Income</p>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><ArrowUpRight className="h-4 w-4" /></span>
          </div>
          <p className="mt-4 text-2xl font-extrabold text-emerald-700">{formatINR(salary)}</p>
          <p className="mt-1 text-xs text-slate-500">Income for {selectedMonthName}</p>
        </article>
        <article className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total outflow</p>
            <span className="rounded-lg bg-rose-50 p-2 text-rose-700"><ArrowDownRight className="h-4 w-4" /></span>
          </div>
          <p className="mt-4 text-2xl font-extrabold text-rose-700">{formatINR(totalExpenses)}</p>
          <p className="mt-1 text-xs text-slate-500">All expense categories</p>
        </article>
        <article className={`rounded-2xl border p-5 shadow-sm ${balance >= 0 ? 'border-blue-100 bg-blue-50/60' : 'border-amber-200 bg-amber-50'}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Balance</p>
            <span className={`rounded-lg p-2 ${balance >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
              {balance < 0 ? <AlertTriangle className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
            </span>
          </div>
          <p className={`mt-4 text-2xl font-extrabold ${balance >= 0 ? 'text-blue-800' : 'text-amber-800'}`}>{formatINR(balance)}</p>
          <p className="mt-1 text-xs text-slate-500">{balanceItems.length ? 'Recorded balance' : 'Income minus outflow'}</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Breakdown for {selectedMonthName}</h3>
            <p className="mt-1 text-xs text-slate-500">Edit an amount and leave the field to save it to Supabase.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {monthItems.map((item) => {
            const changeKey = `${item.name}:${selectedMonthIdx}`;
            const isIncome = item.type === 'income';
            const isBalance = item.type === 'balance';
            return (
              <div key={item.name} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50 sm:gap-5 sm:px-5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                  isBalance ? 'bg-blue-50 text-blue-700' : isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {isBalance ? <Wallet className="h-4 w-4" /> : isIncome ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                  <p className="mt-0.5 text-xs capitalize text-slate-500">{item.type}</p>
                </div>
                <label className="flex w-40 max-w-[48%] items-center rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
                  <span className="mr-2 text-xs font-semibold text-slate-400">₹</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="1"
                    aria-label={`${item.name} amount for ${selectedMonthName}`}
                    value={dirtyCells[changeKey] ?? item.amount}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDirtyCells((current) => ({ ...current, [changeKey]: value }));
                      setItems((current) => current.map((entry) => {
                        if (entry.name !== item.name) return entry;
                        const values = [...entry.values];
                        values[selectedMonthIdx] = value === '' ? 0 : Number(value);
                        return { ...entry, values };
                      }));
                    }}
                    onBlur={(event) => {
                      const value = dirtyCells[changeKey];
                      if (value !== undefined) persistCell(item.name, selectedMonthIdx, String(value));
                    }}
                    className="w-full min-w-0 bg-transparent py-2.5 text-right text-sm font-bold text-slate-900 outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => deleteCategory(item)}
                  aria-label={`Delete ${item.name}`}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
        <form onSubmit={addCategory} className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center">
          <input
            type="text"
            maxLength={80}
            required
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="Add a category (e.g. Rent, Groceries)"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <select
            value={categoryType}
            onChange={(event) => setCategoryType(event.target.value)}
            aria-label="New category type"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="balance">Balance</option>
          </select>
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Add category
          </button>
        </form>
      </section>

      {items.length > 0 && (
        <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm">
          <summary className="cursor-pointer list-none p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900">All-month ledger</h3>
                <p className="mt-1 text-xs text-slate-500">View the full history. Select a month above to edit its amounts.</p>
              </div>
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 group-open:hidden">Show</span>
              <span className="hidden rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 group-open:inline">Hide</span>
            </div>
          </summary>
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-left font-bold text-slate-600">
                  <th className="sticky left-0 z-10 min-w-36 border-r border-slate-200 bg-slate-50 px-4 py-3">Category</th>
                  {months.map((month, index) => (
                    <th key={`${month}-${index}`} className={`min-w-24 px-3 py-3 text-right ${index === selectedMonthIdx ? 'bg-blue-50 text-blue-800' : ''}`}>
                      {month} {index + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.name} className="text-slate-700 hover:bg-slate-50">
                    <th className="sticky left-0 z-10 border-r border-slate-100 bg-white px-4 py-2.5 text-left font-medium">{item.name}</th>
                    {item.values.map((value, index) => (
                      <td key={index} className={`px-3 py-2.5 text-right font-mono ${index === selectedMonthIdx ? 'bg-blue-50/60 font-bold' : ''}`}>
                        {Number(value) !== 0 ? Number(value).toLocaleString('en-IN') : '–'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
