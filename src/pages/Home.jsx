import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { TrendingUp, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";

function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">

      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-sky-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[120px]" />

      <div className="relative max-w-5xl mx-auto px-6 pt-28 pb-20 flex flex-col items-center text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium mb-6">
          <Sparkles size={14} />
          AI-Powered Finance
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-5">
          FINO <span className="text-sky-400">AI</span>
        </h1>

        <p className="text-lg text-slate-400 max-w-xl mb-10">
          Smart expense tracking with AI-driven forecasts, anomaly detection, and
          personalized spending insights.
        </p>

        {/* CTA */}
        <SignedOut>
          <SignInButton mode="modal">
            <button className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 transition-colors text-slate-950 font-semibold px-8 py-3 rounded-xl">
              Sign In to Get Started
              <ArrowRight size={18} />
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <a
            href="/dashboard"
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 transition-colors text-slate-950 font-semibold px-8 py-3 rounded-xl"
          >
            Go to Dashboard
            <ArrowRight size={18} />
          </a>
        </SignedIn>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full">

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 text-left">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center mb-4">
              <TrendingUp size={18} className="text-sky-400" />
            </div>
            <h3 className="font-semibold text-white mb-1">Spending Forecasts</h3>
            <p className="text-sm text-slate-400">
              AI predicts your future spending based on real historical patterns.
            </p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 text-left">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center mb-4">
              <Sparkles size={18} className="text-violet-400" />
            </div>
            <h3 className="font-semibold text-white mb-1">Smart Suggestions</h3>
            <p className="text-sm text-slate-400">
              Personalized tips to help you save more, based on your habits.
            </p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 text-left">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
              <ShieldCheck size={18} className="text-amber-400" />
            </div>
            <h3 className="font-semibold text-white mb-1">Anomaly Detection</h3>
            <p className="text-sm text-slate-400">
              Automatically flags unusual expenses so nothing slips by unnoticed.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Home;