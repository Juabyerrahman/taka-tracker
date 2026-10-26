
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Car,
  ChevronRight,
  HeartPulse,
  Plus,
  Receipt,
  ShoppingBag,
  Trash2,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { db, type Expense } from "@/lib/db";

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Education",
  "Health",
  "Bills",
  "Other",
];

const icons: Record<string, typeof Wallet> = {
  Food: Utensils,
  Transport: Car,
  Shopping: ShoppingBag,
  Education: BookOpen,
  Health: HeartPulse,
  Bills: Receipt,
  Other: Wallet,
};

const money = (amount: number) =>
  "৳" +
  amount.toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  });

function localDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date: string) {
  if (!date) return "";
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState("");
  const [monday, setMonday] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const now = new Date();
    setToday(localDate(now));

    const start = new Date(now);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    setMonday(localDate(start));

    db.expenses
      .orderBy("date")
      .reverse()
      .toArray()
      .then(setExpenses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function loadExpenses() {
    const all = await db.expenses.orderBy("date").reverse().toArray();
    setExpenses(all);
  }

  async function addExpense(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      alert("Enter an amount greater than zero.");
      return;
    }

    await db.expenses.add({
      amount: value,
      category,
      description: description.trim(),
      date: today || localDate(new Date()),
      paymentMethod: "Cash",
      createdAt: Date.now(),
    });

    setAmount("");
    setDescription("");
    setShowForm(false);
    await loadExpenses();
  }

  async function deleteExpense(id: number) {
    if (!window.confirm("Delete this expense?")) return;
    await db.expenses.delete(id);
    await loadExpenses();
  }

  const weekExpenses = useMemo(
    () => expenses.filter((e) => e.date >= monday && e.date <= today),
    [expenses, monday, today]
  );

  const todayTotal = expenses
    .filter((e) => e.date === today)
    .reduce((sum, e) => sum + e.amount, 0);

  const weekTotal = weekExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  const categoryTotals = weekExpenses.reduce<Record<string, number>>(
    (totals, e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
      return totals;
    },
    {}
  );

  const sortedCategories = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  );

  const biggestCategory = sortedCategories[0];

  const chartData = useMemo(() => {
    const result = [];
    const start = monday
      ? new Date(`${monday}T12:00:00`)
      : new Date("2000-01-03T12:00:00");

    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const dateKey = localDate(day);
      const total = expenses
        .filter((e) => e.date === dateKey)
        .reduce((sum, e) => sum + e.amount, 0);

      result.push({
        day: day.toLocaleDateString("en-US", { weekday: "short" }),
        total,
        isToday: dateKey === today,
      });
    }

    return result;
  }, [expenses, monday, today]);

  const expenseCount = weekExpenses.length;

  return (
    <main className="min-h-screen bg-[#F6F6F4] text-[#171717]">
      <div className="mx-auto min-h-screen max-w-6xl md:px-8">
        <header className="flex items-center justify-between border-b border-black/10 px-5 py-5 md:px-0">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
              <Wallet size={20} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">taka tracker</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">
                Personal finance
              </p>
            </div>
          </a>

          <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-xs text-neutral-600">
            <span className="h-2 w-2 rounded-full bg-black" />
            Local storage
          </div>
        </header>

        <section className="px-5 pb-7 pt-8 md:px-0 md:pt-12">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Your money, in focus
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
                Spending overview<span className="text-neutral-400">.</span>
              </h1>
              <p className="mt-3 text-sm text-neutral-500">
                A clearer picture of where your taka goes.
              </p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 sm:w-auto"
            >
              {showForm ? <X size={17} /> : <Plus size={17} />}
              {showForm ? "Close form" : "Add expense"}
            </button>
          </div>
        </section>

        {showForm && (
          <section className="mx-5 mb-6 rounded-3xl border border-black/10 bg-white p-5 sm:p-7 md:mx-0">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                  New transaction
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  Add an expense
                </h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                aria-label="Close form"
                className="rounded-full p-2 hover:bg-neutral-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={addExpense} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-medium text-neutral-600">
                  Amount (BDT)
                </label>
                <div className="flex items-center rounded-xl border border-neutral-200 px-4 focus-within:border-black">
                  <span className="mr-3 text-xl text-neutral-400">৳</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent py-4 text-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-neutral-600">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white p-3.5 text-sm outline-none focus:border-black"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-neutral-600">
                  Description
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Lunch at university"
                  className="w-full rounded-xl border border-neutral-200 p-3.5 text-sm outline-none focus:border-black"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-black p-4 text-sm font-medium text-white transition hover:bg-neutral-800 sm:col-span-2"
              >
                Save expense
              </button>
            </form>
          </section>
        )}

        <section className="grid gap-4 px-5 md:grid-cols-3 md:px-0">
          <div className="rounded-3xl bg-[#171717] p-6 text-white sm:p-8 md:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">Total spent this week</p>
              <CalendarDays size={19} className="text-neutral-400" />
            </div>

            <p className="mt-7 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
              {money(weekTotal)}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/15 pt-5">
              <div>
                <p className="text-xs text-neutral-400">Transactions</p>
                <p className="mt-1 text-lg font-medium">{expenseCount}</p>
              </div>
              <div className="h-9 w-px bg-white/15" />
              <div>
                <p className="text-xs text-neutral-400">Daily average</p>
                <p className="mt-1 text-lg font-medium">
                  {money(weekTotal / Math.max(
                    1,
                    chartData.filter((d) => d.day && d.total >= 0).length
                      ? Math.min(
                          7,
                          Math.max(
                            1,
                            Math.floor(
                              (new Date(`${today}T12:00:00`).getTime() -
                                new Date(`${monday}T12:00:00`).getTime()) /
                                86400000
                            ) + 1
                          )
                        )
                      : 1
                  ))}
                </p>
              </div>
              <div className="ml-auto hidden items-center gap-2 text-xs text-neutral-400 sm:flex">
                <Activity size={15} />
                Week at a glance
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-black/10 bg-white p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">Spent today</p>
              <ArrowDownRight size={19} className="text-neutral-400" />
            </div>
            <div>
              <p className="mt-8 text-3xl font-semibold tracking-[-0.04em]">
                {money(todayTotal)}
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                {today ? formatDate(today) : "Loading date"}
              </p>
            </div>
            <div className="mt-7 border-t border-black/10 pt-4 text-xs text-neutral-500">
              {todayTotal === 0
                ? "No spending recorded today."
                : "Every taka accounted for."}
            </div>
          </div>
        </section>

        <section className="grid gap-5 px-5 py-5 md:grid-cols-5 md:px-0 md:py-7">
          <div className="rounded-3xl border border-black/10 bg-white p-5 sm:p-7 md:col-span-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                  Your activity
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">
                  This week
                </h2>
              </div>
              <span className="rounded-full bg-[#F3F3F1] px-3 py-1.5 text-xs text-neutral-600">
                Mon – Sun
              </span>
            </div>

            <div className="mt-6 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 12, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    vertical={false}
                    stroke="#EEEEEC"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#888888", fontSize: 12 }}
                    dy={10}
                  />
                  <Tooltip
                    cursor={{ fill: "#F5F5F3" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E5E5E5",
                      boxShadow: "none",
                      fontSize: 12,
                    }}
                    formatter={(value) => [money(Number(value)), "Spent"]}
                  />
                  <Bar
                    dataKey="total"
                    fill="#171717"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={34}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-5 sm:p-7 md:col-span-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                Breakdown
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                By category
              </h2>
            </div>

            {sortedCategories.length === 0 ? (
              <div className="py-12 text-center">
                <Wallet className="mx-auto text-neutral-300" size={28} />
                <p className="mt-3 text-sm text-neutral-500">
                  Your spending breakdown will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {sortedCategories.map(([name, total]) => {
                  const Icon = icons[name] || Wallet;
                  const percentage = weekTotal ? (total / weekTotal) * 100 : 0;

                  return (
                    <div key={name}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="rounded-lg bg-[#F3F3F1] p-2">
                            <Icon size={15} />
                          </div>
                          <span className="truncate text-sm font-medium">{name}</span>
                        </div>
                        <span className="shrink-0 text-sm font-medium">
                          {money(total)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#EEEEEC]">
                        <div
                          className="h-full rounded-full bg-black transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-right text-[11px] text-neutral-400">
                        {percentage.toFixed(0)}%
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {biggestCategory && (
              <div className="mt-6 rounded-2xl bg-[#F6F6F4] p-4">
                <p className="text-xs text-neutral-500">Top category this week</p>
                <p className="mt-1 font-semibold">{biggestCategory[0]}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {money(biggestCategory[1])} spent here
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="px-5 pb-10 md:px-0">
          <div className="rounded-3xl border border-black/10 bg-white p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                  Your records
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">
                  Recent expenses
                </h2>
              </div>
              <span className="rounded-full bg-[#F3F3F1] px-3 py-1.5 text-xs text-neutral-600">
                {expenses.length} total
              </span>
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-neutral-500">
                Loading your expenses...
              </p>
            ) : expenses.length === 0 ? (
              <div className="py-12 text-center">
                <Receipt className="mx-auto text-neutral-300" size={30} />
                <p className="mt-3 text-sm text-neutral-500">
                  Nothing here yet. Add your first expense.
                </p>
              </div>
            ) : (
              <div className="mt-5 divide-y divide-black/[0.06]">
                {expenses.slice(0, 20).map((expense) => {
                  const Icon = icons[expense.category] || Wallet;

                  return (
                    <div
                      key={expense.id}
                      className="flex items-center gap-3 py-4"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3F3F1]">
                        <Icon size={19} strokeWidth={1.7} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {expense.description || expense.category}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {expense.category} · {formatDate(expense.date)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {money(expense.amount)}
                        </p>
                        {expense.id !== undefined && (
                          <button
                            onClick={() => deleteExpense(expense.id!)}
                            aria-label="Delete expense"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-neutral-400 transition hover:text-red-600"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <footer className="border-t border-black/10 px-5 py-6 text-center md:px-0">
          <p className="text-xs tracking-wide text-neutral-500">
            Made for your money. Stored on your device.
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
            Taka Tracker · Personal finance
          </p>
        </footer>
      </div>
    </main>
  );
}
