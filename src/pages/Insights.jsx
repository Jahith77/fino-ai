import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { AlertTriangle, TrendingDown, TrendingUp, Wallet } from "lucide-react";

const ML_BASE_URL = import.meta.env.VITE_ML_URL;

export default function Insights() {
  const { user } = useUser();
  const [forecast, setForecast] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    async function loadInsights() {
      try {
        const expensesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/expenses/${user.id}`);
        const expensesData = await expensesRes.json();
        const expenses = expensesData.expenses || expensesData;
        console.log("EXPENSES BEING SENT:", expenses);

        const [predictRes, anomaliesRes, suggestionsRes] = await Promise.all([
          fetch(`${ML_BASE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expenses }),
          }),
          fetch(`${ML_BASE_URL}/anomalies`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expenses, sensitivity: 2 }),
          }),
          fetch(`${ML_BASE_URL}/suggestions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expenses }),
          }),
        ]);

        const predictData = await predictRes.json();
        const anomaliesData = await anomaliesRes.json();
        const suggestionsData = await suggestionsRes.json();

        setForecast(predictData);
        setAnomalies(anomaliesData.anomalies || []);
        setSuggestions(suggestionsData.suggestions || []);
      } catch (err) {
        setError("Couldn't load insights. Check that the ML service is running.");
      } finally {
        setLoading(false);
      }
    }

    loadInsights();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading insights…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Insights</h1>
          <p className="text-slate-400 text-sm mt-1">
            Forecasts, unusual spending, and ways to save — built from your expense history.
          </p>
        </div>

        {/* Forecast — full width */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-medium text-white mb-4">Spending forecast</h2>
          {forecast?.predictions?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={forecast.predictions}>
                <defs>
                  <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fill="url(#forecastFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm">Not enough data yet to forecast.</p>
          )}
        </div>

        {/* Bottom grid: Anomalies + Suggestions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Anomalies */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Unusual spending</h2>
            {anomalies.length === 0 ? (
              <p className="text-slate-500 text-sm">Nothing out of the ordinary this period.</p>
            ) : (
              <div className="space-y-3">
                {anomalies.map((a, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 rounded-xl p-3 border ${
                      a.severity === "high"
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-amber-500/10 border-amber-500/30"
                    }`}
                  >
                    <AlertTriangle
                      size={18}
                      className={a.severity === "high" ? "text-red-400" : "text-amber-400"}
                    />
                    <div>
                      <p className="text-sm text-slate-200 capitalize">{a.category}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{a.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Suggestions</h2>
            {suggestions.length === 0 ? (
              <p className="text-slate-500 text-sm">No suggestions yet — add more expenses to unlock these.</p>
            ) : (
              <div className="space-y-3">
                {suggestions.map((s, i) => {
                  const Icon =
                    s.type === "budget"
                      ? Wallet
                      : s.severity === "positive"
                      ? TrendingDown
                      : TrendingUp;

                  const color =
                    s.severity === "positive"
                      ? "text-emerald-400"
                      : s.severity === "warning"
                      ? "text-amber-400"
                      : "text-sky-400";

                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl p-3 border border-slate-800 bg-slate-800/30"
                    >
                      <Icon size={18} className={color} />
                      <div>
                        <p className="text-sm text-slate-200 capitalize">{s.category}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{s.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}