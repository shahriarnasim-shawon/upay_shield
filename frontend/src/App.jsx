import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, ArrowRight, UserCheck, 
  Lock, RefreshCw, Send, Globe, Server, CheckCircle2, XCircle
} from 'lucide-react';

const API_BASE = "http://localhost:8000";

export default function App() {
  const [lang, setLang] = useState("bn"); // 'bn' | 'en'
  const [loading, setLoading] = useState(false);
  
  // Transaction Form State
  const [sender, setSender] = useState("01712345678");
  const [receiver, setReceiver] = useState("01999887766");
  const [amount, setAmount] = useState(18500);
  const [recipientAge, setRecipientAge] = useState(2);
  const [velocity1h, setVelocity1h] = useState(5);
  const [deviceChanged, setDeviceChanged] = useState(1);
  const [timeToCashout, setTimeToCashout] = useState(8);

  // Analysis Result State
  const [evaluation, setEvaluation] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [copilotBrief, setCopilotBrief] = useState(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [analystDecision, setAnalystDecision] = useState(null);

  // Preset Scenario Loader
  const loadScenario = (type) => {
    setAnalystDecision(null);
    if (type === "NORMAL") {
      setSender("01711223344");
      setReceiver("01833445566");
      setAmount(800);
      setRecipientAge(240);
      setVelocity1h(0);
      setDeviceChanged(0);
      setTimeToCashout(1200);
    } else if (type === "LOTTERY_SCAM") {
      setSender("01755667788");
      setReceiver("01622334455");
      setAmount(22000);
      setRecipientAge(1); // 1 day old wallet
      setVelocity1h(2);
      setDeviceChanged(0);
      setTimeToCashout(5); // instant cashout
    } else if (type === "MULE_RING") {
      setSender("01911992233");
      setReceiver("01544332211");
      setAmount(25000);
      setRecipientAge(0);
      setVelocity1h(8);
      setDeviceChanged(1);
      setTimeToCashout(2);
    }
  };

  // Run the full AI Pipeline
  const runEvaluation = async () => {
    setLoading(true);
    setAnalystDecision(null);
    try {
      // 1. Tabular Risk ML Evaluation
      const scoreRes = await fetch(`${API_BASE}/api/v1/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_wallet: sender,
          receiver_wallet: receiver,
          amount: parseFloat(amount),
          hour_of_day: 14,
          velocity_1h: parseInt(velocity1h),
          velocity_24h: parseInt(velocity1h) + 3,
          recipient_age_days: parseInt(recipientAge),
          device_changed: parseInt(deviceChanged),
          is_new_recipient: 1,
          failed_pin_attempts: 0,
          time_to_cashout_mins: parseInt(timeToCashout),
          lang: lang
        })
      });
      const scoreData = await scoreRes.json();
      setEvaluation(scoreData);

      if (scoreData.customer_ui_alert.show_modal) {
        setCustomerModalOpen(true);
      } else {
        setCustomerModalOpen(false);
      }

      // 2. Fetch Network Graph Trace
      const graphRes = await fetch(`${API_BASE}/api/v1/graph/trace/${receiver}`);
      const graphJson = await graphRes.json();
      setGraphData(graphJson);

      // 3. Generate Copilot Investigation Brief
      const copilotRes = await fetch(`${API_BASE}/api/v1/copilot/investigate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_id: scoreData.transaction_id,
          sender_wallet: sender,
          receiver_wallet: receiver,
          amount: parseFloat(amount),
          risk_score: scoreData.risk_score,
          top_factors: scoreData.top_contributing_factors,
          mule_detected: graphJson.is_syndicate_detected,
          lang: lang
        })
      });
      const briefData = await copilotRes.json();
      setCopilotBrief(briefData);

    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runEvaluation();
  }, [lang]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6">
      {/* Top Header Bar */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pb-4 mb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-400 p-2.5 rounded-xl shadow-lg shadow-amber-400/20 text-slate-950 font-black text-xl tracking-tight">
            upay
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              upay Shield <span className="text-xs bg-blue-600/30 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">v1.0-prod</span>
            </h1>
            <p className="text-xs text-slate-400">
              {lang === "bn" ? "রিয়েল-টাইম এমএফএস প্রতারণা প্রতিরোধ ও এআই অডিট ইঞ্জিন" : "Real-Time Scam & Money Mule Interception Engine"}
            </p>
          </div>
        </div>

        {/* Quick Scenario Buttons & Bilingual Switch */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <button 
              onClick={() => loadScenario("NORMAL")} 
              className="text-xs px-2.5 py-1 rounded hover:bg-slate-800 text-slate-300 transition"
            >
              {lang === "bn" ? "স্বাভাবিক লেনদেন" : "Normal Tx"}
            </button>
            <button 
              onClick={() => loadScenario("LOTTERY_SCAM")} 
              className="text-xs px-2.5 py-1 rounded hover:bg-slate-800 text-amber-400 transition"
            >
              {lang === "bn" ? "লটারি প্রতারণা" : "Lottery Scam"}
            </button>
            <button 
              onClick={() => loadScenario("MULE_RING")} 
              className="text-xs px-2.5 py-1 rounded hover:bg-slate-800 text-rose-400 transition"
            >
              {lang === "bn" ? "মিউল চেইন" : "Mule Syndicate"}
            </button>
          </div>

          {/* Bilingual Toggle */}
          <button 
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === "bn" ? "English" : "বাংলা"}
          </button>
        </div>
      </header>

      {/* Main Split Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Customer Mobile Simulator (4 Cols) */}
        <section className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-blue-400" />
                {lang === "bn" ? "গ্রাহক অ্যাপ সিমুলেটর" : "Customer App View"}
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            {/* Simulated upay Mobile Screen Container */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-inner space-y-4">
              <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-lg p-3 text-white flex justify-between items-center shadow-md">
                <div>
                  <div className="text-[10px] text-blue-200 uppercase font-semibold">{lang === "bn" ? "উপায় ব্যালেন্স" : "upay Balance"}</div>
                  <div className="text-lg font-bold font-mono">৳ 48,250.00</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-blue-200">{sender}</div>
                  <div className="text-xs font-semibold text-emerald-300">Verified NID</div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">{lang === "bn" ? "প্রাপক নম্বর (Receiver)" : "Recipient Number"}</label>
                  <input 
                    type="text" 
                    value={receiver} 
                    onChange={(e) => setReceiver(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">{lang === "bn" ? "টাকার পরিমাণ (BDT)" : "Transfer Amount"}</label>
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-bold font-mono text-base focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Behavioral Simulation Sliders */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{lang === "bn" ? "প্রাপক অ্যাকাউন্টের বয়স" : "Recipient Account Age"}:</span>
                    <span className="font-semibold text-slate-200">{recipientAge} {lang === "bn" ? "দিন" : "days"}</span>
                  </div>
                  <input 
                    type="range" min="0" max="60" value={recipientAge} 
                    onChange={(e) => setRecipientAge(e.target.value)}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />

                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{lang === "bn" ? "১ ঘণ্টায় লেনদেন সংখ্যা" : "1h Tx Velocity"}:</span>
                    <span className="font-semibold text-slate-200">{velocity1h} tx/hr</span>
                  </div>
                  <input 
                    type="range" min="0" max="15" value={velocity1h} 
                    onChange={(e) => setVelocity1h(e.target.value)}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={runEvaluation}
                disabled={loading}
                className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/10 transition mt-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {lang === "bn" ? "টাকা পাঠাতে এগিয়ে যান" : "Simulate Send Money"}
              </button>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-500 text-center">
            {lang === "bn" 
              ? "প্রতারণামূলক লেনদেন শনাক্ত হলে গ্রাহকের স্ক্রিনে তাৎক্ষণিক বাংলায় নিরাপত্তা সতর্কতা প্রদর্শিত হয়।" 
              : "High-risk transactions trigger native customer safety interventions in real time."}
          </div>
        </section>

        {/* RIGHT COLUMN: Fraud Operations Cockpit (8 Cols) */}
        <section className="lg:col-span-8 space-y-6">
          
          {/* Top Row: Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Risk Gauge Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-semibold">{lang === "bn" ? "ঝুঁকি সম্ভাব্যতা" : "AI Risk Score"}</span>
              <div className="my-2 flex items-baseline gap-2">
                <span className={`text-3xl font-black font-mono ${
                  (evaluation?.risk_score || 0) >= 70 ? "text-rose-500" : 
                  (evaluation?.risk_score || 0) >= 40 ? "text-amber-400" : "text-emerald-400"
                }`}>
                  {evaluation ? `${evaluation.risk_score}%` : "--"}
                </span>
                <span className="text-xs uppercase font-semibold text-slate-400">
                  {evaluation?.status || "Analyzing"}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    (evaluation?.risk_score || 0) >= 70 ? "bg-rose-500" : 
                    (evaluation?.risk_score || 0) >= 40 ? "bg-amber-400" : "bg-emerald-400"
                  }`} 
                  style={{ width: `${evaluation?.risk_score || 5}%` }}
                />
              </div>
            </div>

            {/* Model Action Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-semibold">{lang === "bn" ? "সিস্টেম নির্দেশিকা" : "Engine Verdict"}</span>
              <div className="my-2">
                <span className="text-sm font-bold text-slate-200">
                  {evaluation?.action || "Awaiting Evaluation"}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                <Server className="w-3 h-3 text-blue-400" />
                Latency: &lt; 45ms (LightGBM)
              </span>
            </div>

            {/* Syndicate Detection Status */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-semibold">{lang === "bn" ? "মিউল চেইন অবস্থা" : "Graph Syndicate Status"}</span>
              <div className="my-2 flex items-center gap-2">
                {graphData?.is_syndicate_detected ? (
                  <span className="text-rose-400 font-bold text-sm flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    {lang === "bn" ? "সক্রিয় মিউল সিন্ডিকেট" : "Active Mule Network"}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    {lang === "bn" ? "কোনো চেইন পাওয়া যায়নি" : "Isolated Transfer"}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Trace Depth: {graphData?.chain_length || 0} hops
              </span>
            </div>
          </div>

          {/* Network Graph Visualizer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              {lang === "bn" ? "মানি মিউল ট্রেইল ও নেটওয়ার্ক গ্রাফ" : "Money Mule Network Trace (Directed Graph)"}
            </h3>
            <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 overflow-x-auto">
              <div className="flex items-center justify-between min-w-[500px] gap-3">
                {graphData?.nodes?.map((node, idx) => (
                  <React.Fragment key={node.id}>
                    <div className={`p-3 rounded-lg border flex flex-col items-center text-center ${
                      node.risk === "CRITICAL" ? "bg-rose-950/40 border-rose-600/50 text-rose-300" :
                      node.risk === "HIGH" ? "bg-amber-950/40 border-amber-600/50 text-amber-300" :
                      node.risk === "SUSPECT" ? "bg-purple-950/40 border-purple-600/50 text-purple-300" :
                      "bg-slate-900 border-slate-700 text-slate-300"
                    }`}>
                      <span className="text-[10px] uppercase font-bold tracking-wider">{node.type}</span>
                      <span className="text-xs font-mono font-semibold my-1">{node.id}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 font-mono">{node.risk}</span>
                    </div>

                    {idx < (graphData.nodes.length - 1) && (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-amber-400 font-mono font-semibold">
                          {graphData.edges[idx]?.label}
                        </span>
                        <ArrowRight className="w-5 h-5 text-slate-600" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* AI Copilot Briefing Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400" />
                {lang === "bn" ? "এআই অডিট ইনভেস্টিগেশন মেমো" : "AI Copilot Investigation Memo"}
              </h3>
              <span className="text-[11px] bg-blue-950 text-blue-400 border border-blue-800/60 px-2 py-0.5 rounded">
                Responsible AI (Human-in-the-loop)
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 space-y-3 text-xs">
              <div className="font-semibold text-slate-200 text-sm">
                {copilotBrief?.headline}
              </div>
              <p className="text-slate-400 leading-relaxed">
                {copilotBrief?.summary}
              </p>
              
              <div className="pt-2 border-t border-slate-800">
                <div className="font-semibold text-slate-300 mb-1">
                  {lang === "bn" ? "প্রস্তাবিত পদক্ষেপ:" : "Recommended Actions:"}
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  {copilotBrief?.recommended_actions?.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>

              {/* One-Click Analyst Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2 items-center justify-between">
                <div className="text-[11px] text-slate-500 font-mono">
                  Analyst Decision: <span className="text-amber-400 font-semibold">{analystDecision || "PENDING"}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setAnalystDecision("CASH_OUT_HELD")}
                    className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    {lang === "bn" ? "ক্যাশ-আউট স্থগিত করুন" : "Hold Cash-Out (2h)"}
                  </button>
                  <button 
                    onClick={() => setAnalystDecision("KYC_REQUESTED")}
                    className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  >
                    {lang === "bn" ? "এনআইডি যাচাই তলব" : "Request Biometric KYC"}
                  </button>
                  <button 
                    onClick={() => setAnalystDecision("MANUALLY_APPROVED")}
                    className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {lang === "bn" ? "অনুমোদন" : "Approve"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Interactive Customer Warning Modal (Simulating In-App Pop-up) */}
      {customerModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border-2 border-rose-500 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-950/80 rounded-full border border-rose-500/40">
                <ShieldAlert className="w-6 h-6 text-rose-500" />
              </div>
              <h2 className="font-bold text-base text-white">
                {evaluation?.customer_ui_alert?.headline}
              </h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              {evaluation?.customer_ui_alert?.message}
            </p>

            <div className="space-y-1.5 text-[11px] text-amber-300 bg-amber-950/30 border border-amber-800/40 p-2.5 rounded-lg">
              <div className="font-semibold text-amber-200">
                {lang === "bn" ? "সনাক্তকৃত ঝুঁকি কারণসমূহ:" : "Identified Risk Drivers:"}
              </div>
              {evaluation?.top_contributing_factors?.map((factor, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {factor}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setCustomerModalOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 rounded-lg text-xs transition"
              >
                {lang === "bn" ? "বাতিল করুন (নিরাপদ)" : "Cancel Transfer"}
              </button>
              <button 
                onClick={() => setCustomerModalOpen(false)}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2 rounded-lg text-xs transition"
              >
                {lang === "bn" ? "ঝুঁকি নিয়েও পাঠান" : "Verify & Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}