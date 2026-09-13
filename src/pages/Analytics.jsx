import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Wallet, Receipt, Tag, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function Analytics() {
  const { user } = useUser();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadExpenses() {
      try {
        setError(null);
        const response = await fetch(
          `http://localhost:5000/api/expenses/${user.id}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        const expenseData = data.expenses || data;

        console.log("ANALYTICS EXPENSES:", expenseData);

        setExpenses(Array.isArray(expenseData) ? expenseData : []);
      } catch (err) {
        console.error("Failed to load expenses:", err);
        setError(
          "Couldn't load your expenses. Please check that the backend is running and refresh the page."
        );
      } finally {
        setLoading(false);
      }
    }

    loadExpenses();
  }, [user]);

  // =========================================================
  // CURRENCY FORMATTER
  // =========================================================

  const formatCurrency = (num) =>
    `₹${Number(num).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading analytics...</p>
      </div>
    );
  }

  // =========================================================
  // BASIC CALCULATIONS
  // =========================================================

  const totalSpent = expenses.reduce(
    (total, expense) => total + (Number(expense.amount) || 0),
    0
  );

  const averageExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;

  // =========================================================
  // CATEGORY ANALYSIS
  // =========================================================

  const categoryTotals = {};
  const categoryTransactions = {};

  expenses.forEach((expense) => {
    const category = expense.category || "Other";
    const amount = Number(expense.amount) || 0;

    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    categoryTransactions[category] = (categoryTransactions[category] || 0) + 1;
  });

  const categoryData = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
      transactions: categoryTransactions[category] || 0,
      percentage:
        totalSpent > 0 ? Number(((amount / totalSpent) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const highestCategory = categoryData.length > 0 ? categoryData[0] : null;

  // =========================================================
  // MONTHLY ANALYSIS
  // =========================================================

  const monthlyTotals = {};

  expenses.forEach((expense) => {
    if (!expense.date) return;

    const date = new Date(expense.date);
    if (isNaN(date.getTime())) return;

    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    const amount = Number(expense.amount) || 0;

    monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + amount;
  });

  const monthlyData = Object.entries(monthlyTotals)
    .map(([monthKey, amount]) => {
      const [year, month] = monthKey.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);

      return {
        month: date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        amount: Number(amount.toFixed(2)),
        sortDate: date.getTime(),
      };
    })
    .sort((a, b) => a.sortDate - b.sortDate);

  // =========================================================
  // CURRENT VS PREVIOUS MONTH
  // =========================================================

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const previousMonth = previousMonthDate.getMonth();
  const previousYear = previousMonthDate.getFullYear();

  const currentMonthSpending = expenses
    .filter((expense) => {
      const date = new Date(expense.date);
      if (isNaN(date.getTime())) return false;
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

  const previousMonthSpending = expenses
    .filter((expense) => {
      const date = new Date(expense.date);
      if (isNaN(date.getTime())) return false;
      return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
    })
    .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

  let percentageChange = 0;

  if (previousMonthSpending > 0) {
    percentageChange =
      ((currentMonthSpending - previousMonthSpending) / previousMonthSpending) * 100;
  }

  const currentMonthName = now.toLocaleString("default", { month: "long" });
  const previousMonthName = previousMonthDate.toLocaleString("default", {
    month: "long",
  });

  // =========================================================
  // COLORS
  // =========================================================

  const COLORS = [
    "#38bdf8",
    "#818cf8",
    "#34d399",
    "#fbbf24",
    "#fb7185",
    "#a78bfa",
    "#22d3ee",
    "#f97316",
  ];

  // =========================================================
  // TREND BADGE (used in stat card + comparison section)
  // =========================================================

  const TrendBadge = ({ value }) => {
    if (previousMonthSpending === 0) {
      return (
        <span className="text-xs text-slate-500 mt-2 inline-block">
          No previous month data
        </span>
      );
    }

    const isUp = value > 0;
    const isFlat = value === 0;
    const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;
    const colorClasses = isFlat
      ? "bg-slate-800 text-slate-300"
      : isUp
      ? "bg-red-500/10 text-red-400"
      : "bg-emerald-500/10 text-emerald-400";

    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium mt-2 px-2 py-1 rounded-full ${colorClasses}`}
      >
        <Icon size={12} />
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-semibold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">
            Understand your spending patterns and financial habits.
          </p>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* TOP STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* TOTAL SPENDING */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-slate-700 transition-colors rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Total Spending</p>
              <div className="p-2 rounded-lg bg-sky-500/10">
                <Wallet size={16} className="text-sky-400" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-white mt-2">
              {formatCurrency(totalSpent)}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Across all recorded expenses
            </p>
          </div>

          {/* AVERAGE */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-slate-700 transition-colors rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Average Expense</p>
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <Receipt size={16} className="text-indigo-400" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-white mt-2">
              {formatCurrency(averageExpense)}
            </h2>
            <p className="text-xs text-slate-500 mt-1">Per transaction</p>
          </div>

          {/* HIGHEST CATEGORY */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-slate-700 transition-colors rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Highest Spending</p>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Tag size={16} className="text-amber-400" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-white mt-2">
              {highestCategory ? highestCategory.category : "None"}
            </h2>
            {highestCategory && (
              <p className="text-xs text-slate-500 mt-1">
                {formatCurrency(highestCategory.amount)} spent (
                {highestCategory.percentage}%)
              </p>
            )}
          </div>

          {/* MONTHLY COMPARISON */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-slate-700 transition-colors rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Monthly Comparison</p>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp size={16} className="text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-white mt-2">
              {formatCurrency(currentMonthSpending)}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {currentMonthName} spending
            </p>
            <TrendBadge value={percentageChange} />
          </div>
        </div>

        {/* MONTHLY COMPARISON DETAIL */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-white">
                Monthly Spending Comparison
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Compare your spending with the previous month.
              </p>
            </div>

            <div className="flex gap-8">
              <div>
                <p className="text-xs text-slate-500">{currentMonthName}</p>
                <p className="text-lg font-semibold text-white">
                  {formatCurrency(currentMonthSpending)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{previousMonthName}</p>
                <p className="text-lg font-semibold text-white">
                  {formatCurrency(previousMonthSpending)}
                </p>
              </div>
            </div>
          </div>

          {previousMonthSpending > 0 && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Monthly change</span>
                <span
                  className={
                    percentageChange > 0 ? "text-red-400" : "text-emerald-400"
                  }
                >
                  {percentageChange > 0 ? "+" : ""}
                  {percentageChange.toFixed(1)}%
                </span>
              </div>

              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentageChange > 0 ? "bg-red-400" : "bg-emerald-400"
                  }`}
                  style={{
                    width: `${Math.min(Math.abs(percentageChange), 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* CATEGORY CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PIE CHART */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">
              Spending by Category
            </h2>

            {categoryData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-slate-500 text-sm">No expense data available.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ category, percentage }) =>
                      `${category} ${percentage}%`
                    }
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={entry.category}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), "Spending"]}
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* BAR CHART */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">
              Category Comparison
            </h2>

            {categoryData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-slate-500 text-sm">No expense data available.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="category" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), "Spending"]}
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="amount" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* MONTHLY SPENDING CHART */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-medium text-white mb-4">Monthly Spending</h2>

          {monthlyData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-slate-500 text-sm">No monthly data available.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={12}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), "Spending"]}
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="amount" fill="#818cf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* CATEGORY BREAKDOWN */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-medium text-white">Category Breakdown</h2>
              <p className="text-sm text-slate-400 mt-1">
                See where most of your money is going.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-lg font-semibold text-white">
                {formatCurrency(totalSpent)}
              </p>
            </div>
          </div>

          {categoryData.length === 0 ? (
            <p className="text-slate-500 text-sm">No expense data available.</p>
          ) : (
            <div className="space-y-6">
              {categoryData.map((item, index) => {
                const percentage =
                  totalSpent > 0 ? (item.amount / totalSpent) * 100 : 0;
                const isTopCategory = index === 0;

                return (
                  <div
                    key={item.category}
                    className={`p-4 rounded-xl border transition-colors ${
                      isTopCategory
                        ? "border-sky-500/30 bg-sky-500/5"
                        : "border-slate-800 bg-slate-950/30 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">
                              {item.category}
                            </span>
                            {isTopCategory && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                TOP CATEGORY
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {item.transactions}{" "}
                            {item.transactions === 1
                              ? "transaction"
                              : "transactions"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">
                          {formatCurrency(item.amount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.percentage}% of total
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CATEGORY INSIGHT */}
        {highestCategory && (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs text-sky-400 uppercase tracking-wider font-medium">
                  Spending Insight
                </p>
                <h2 className="text-xl font-semibold text-white mt-2">
                  {highestCategory.category} is your biggest expense category.
                </h2>
                <p className="text-sm text-slate-400 mt-2">
                  You spent {formatCurrency(highestCategory.amount)} on{" "}
                  {highestCategory.category}, which represents{" "}
                  {highestCategory.percentage}% of your total spending.
                </p>
              </div>

              <div className="text-center md:text-right">
                <p className="text-xs text-slate-500">Transactions</p>
                <p className="text-2xl font-semibold text-white">
                  {highestCategory.transactions}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}