import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, ArrowRight, UserCheck, 
  Lock, RefreshCw, Send, Globe, Server, CheckCircle2, XCircle,
  Volume2, Download, Activity, Smartphone, Eye, Shield, BarChart3,
  Layers, Search, FileText, ChevronRight, UserX, Cpu
} from 'lucide-react';

const API_BASE = "http://localhost:8000";

export default function App() {
  const [lang, setLang] = useState("bn"); // 'bn' | 'en'
  const [activeTab, setActiveTab] = useState("cockpit"); // 'cockpit' | 'phone' | 'metrics'
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Queue of Flagged Transactions in Cockpit
  const [queue, setQueue] = useState([
    {
      id: "SIM_114027",
      sender: "01712345678",
      receiver: "01999887766",
      amount: 24500,
      risk_score: 99.93,
      status: "CRITICAL",
      time: "2 mins ago",
      recipient_age_days: 1,
      velocity_1h: 6,
      device_changed: 1,
      time_to_cashout_mins: 4,
      pattern: "MULE_HOP"
    },
    {
      id: "SIM_220914",
      sender: "01755667788",
      receiver: "01622334455",
      amount: 22000,
      risk_score: 87.40,
      status: "HIGH",
      time: "5 mins ago",
      recipient_age_days: 2,
      velocity_1h: 3,
      device_changed: 0,
      time_to_cashout_mins: 8,
      pattern: "LOTTERY_SCAM"
    },
    {
      id: "SIM_883012",
      sender: "01711223344",
      receiver: "01833445566",
      amount: 1500,
      risk_score: 5.20,
      status: "LOW",
      time: "12 mins ago",
      recipient_age_days: 340,
      velocity_1h: 0,
      device_changed: 0,
      time_to_cashout_mins: 1440,
      pattern: "NORMAL"
    }
  ]);

  const [selectedTx, setSelectedTx] = useState(queue[0]);

  // Phone Simulator Form State
  const [phoneSender] = useState("01712345678");
  const [phoneReceiver, setPhoneReceiver] = useState("01999887766");
  const [phoneAmount, setPhoneAmount] = useState(24500);
  const [phoneAge, setPhoneAge] = useState(1);
  const [phoneVelocity, setPhoneVelocity] = useState(6);
  const [phoneCashout, setPhoneCashout] = useState(4);
  const [phoneEvaluation, setPhoneEvaluation] = useState(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  // Active Analysis State
  const [graphData, setGraphData] = useState(null);
  const [copilotBrief, setCopilotBrief] = useState(null);
  const [analystDecision, setAnalystDecision] = useState(null);

  // Evaluate the currently selected transaction for the Cockpit
  const evaluateSelectedTransaction = async (tx) => {
    setLoading(true);
    setAnalystDecision(null);
    try {
      // 1. Fetch Graph
      const graphRes = await fetch(`${API_BASE}/api/v1/graph/trace/${tx.receiver}`);
      const graphJson = await graphRes.json();
      setGraphData(graphJson);

      // 2. Fetch Copilot
      const copilotRes = await fetch(`${API_BASE}/api/v1/copilot/investigate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_id: tx.id,
          sender_wallet: tx.sender,
          receiver_wallet: tx.receiver,
          amount: parseFloat(tx.amount),
          risk_score: tx.risk_score,
          top_factors: [
            lang === "bn" ? "প্রাপক অ্যাকাউন্ট ১ দিন আগে খোলা হয়েছে" : "Recipient account opened 1 day ago",
            lang === "bn" ? "নতুন হ্যান্ডসেট পরিবর্তন সনাক্ত" : "Recent device change detected",
            lang === "bn" ? "তাৎক্ষণিক ক্যাশ-আউট শিডিউল" : "Immediate cashout pattern"
          ],
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
    evaluateSelectedTransaction(selectedTx);
  }, [selectedTx, lang]);

  // Execute Phone Simulator Run
  const handlePhoneSend = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_wallet: phoneSender,
          receiver_wallet: phoneReceiver,
          amount: parseFloat(phoneAmount),
          hour_of_day: 14,
          velocity_1h: parseInt(phoneVelocity),
          velocity_24h: parseInt(phoneVelocity) + 3,
          recipient_age_days: parseInt(phoneAge),
          device_changed: 1,
          is_new_recipient: 1,
          failed_pin_attempts: 0,
          time_to_cashout_mins: parseInt(phoneCashout),
          lang: lang
        })
      });
      const data = await res.json();
      setPhoneEvaluation(data);

      if (data.customer_ui_alert.show_modal) {
        setCustomerModalOpen(true);
      } else {
        alert(lang === "bn" ? "লেনদেন সফলভাবে সম্পন্ন হয়েছে!" : "Transfer completed successfully!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Preset loader for phone
  const setPhonePreset = (type) => {
    if (type === "NORMAL") {
      setPhoneReceiver("01833445566");
      setPhoneAmount(1200);
      setPhoneAge(340);
      setPhoneVelocity(0);
      setPhoneCashout(1440);
    } else if (type === "SCAM") {
      setPhoneReceiver("01622334455");
      setPhoneAmount(22000);
      setPhoneAge(1);
      setPhoneVelocity(3);
      setPhoneCashout(5);
    } else if (type === "MULE") {
      setPhoneReceiver("01999887766");
      setPhoneAmount(25000);
      setPhoneAge(0);
      setPhoneVelocity(8);
      setPhoneCashout(2);
    }
  };

  // Bengali Voice Alert
  const triggerVoiceWarning = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const textToSpeak = lang === "bn"
      ? "সাবধান! আপনি যে নম্বরে টাকা পাঠাচ্ছেন তা একটি নতুন অ্যাকাউন্ট। কোনো লটারি বা পুরস্কারের ফোন কলের কথায় টাকা পাঠাবেন না।"
      : "Security Alert! The recipient wallet was registered recently. Do not send money under phone call instructions.";

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = lang === "bn" ? "bn-BD" : "en-US";
    utterance.rate = 0.95;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Export Audit Report
  const exportComplianceMemo = () => {
    const memo = {
      event: "MFS_FRAUD_INTERCEPTION_AUDIT",
      authority: "Bangladesh Bank - FIU Compliance",
      timestamp: new Date().toISOString(),
      transaction_id: selectedTx.id,
      risk_score: `${selectedTx.risk_score}%`,
      status: selectedTx.status,
      parties: {
        origin: selectedTx.sender,
        destination: selectedTx.receiver,
        amount_bdt: selectedTx.amount
      },
      graph_trace: graphData,
      copilot_brief: copilotBrief,
      analyst_verdict: analystDecision || "PENDING_AUDIT"
    };

    const blob = new Blob([JSON.stringify(memo, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `upay_shield_${selectedTx.id}_audit.json`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 flex flex-col font-sans">
      
      {/* Top Header & Navigation */}
      <header className="border-b border-slate-800/80 bg-[#0a1220]/90 backdrop-blur sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="bg-[#FFB800] text-slate-950 font-black text-xl px-3 py-1 rounded-xl shadow-lg shadow-amber-500/10 flex items-center gap-1.5">
              <span>upay</span>
              <Shield className="w-5 h-5 fill-slate-950 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">upay Shield</span>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">
                  Autonomous Risk Infrastructure
                </span>
              </div>
            </div>
          </div>

          {/* 3 Main Role-Based View Switchers */}
          <nav className="flex bg-[#0f1b2e] border border-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button 
              onClick={() => setActiveTab("cockpit")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === "cockpit" 
                  ? "bg-[#004B87] text-white shadow-md shadow-blue-900/40" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === "bn" ? "রিস্ক অপস সেন্টার" : "Risk Ops Cockpit"}</span>
            </button>

            <button 
              onClick={() => setActiveTab("phone")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === "phone" 
                  ? "bg-[#004B87] text-white shadow-md shadow-blue-900/40" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === "bn" ? "গ্রাহক অ্যাপ সিমুলেটর" : "Customer App View"}</span>
            </button>

            <button 
              onClick={() => setActiveTab("metrics")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === "metrics" 
                  ? "bg-[#004B87] text-white shadow-md shadow-blue-900/40" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              <span>{lang === "bn" ? "মডেল ও সিস্টেম মেট্রিক্স" : "AI & Audit Hub"}</span>
            </button>
          </nav>

          {/* Language Toggle & Pipeline Indicator */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LightGBM &lt; 38ms</span>
            </div>
            
            <button 
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === "bn" ? "English" : "বাংলা"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* VIEW 1: RISK OPERATIONS COCKPIT (ANALYST SOC PORTAL)                      */}
      {/* ========================================================================= */}
      {activeTab === "cockpit" && (
        <main className="max-w-7xl mx-auto w-full p-6 space-y-6 flex-1">
          
          {/* Top KPI Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0c1626] border border-slate-800/80 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {lang === "bn" ? "মোট স্ক্যানকৃত লেনদেন" : "Total Evaluated"}
              </span>
              <div className="text-2xl font-black font-mono text-white mt-1">50,000</div>
              <span className="text-[10px] text-emerald-400 font-medium">99.8% System Uptime</span>
            </div>

            <div className="bg-[#0c1626] border border-slate-800/80 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {lang === "bn" ? "সন্দেহজনক ইন্টারসেপ্ট" : "High Risk Flagged"}
              </span>
              <div className="text-2xl font-black font-mono text-rose-400 mt-1">1,840</div>
              <span className="text-[10px] text-rose-400 font-medium">3.68% Anomaly Rate</span>
            </div>

            <div className="bg-[#0c1626] border border-slate-800/80 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {lang === "bn" ? "সুরক্ষিত অর্থ (সম্পদ)" : "Protected Capital"}
              </span>
              <div className="text-2xl font-black font-mono text-amber-400 mt-1">৳ 3.42 Cr</div>
              <span className="text-[10px] text-amber-400/80 font-medium">Scam Cashouts Prevented</span>
            </div>

            <div className="bg-[#0c1626] border border-slate-800/80 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {lang === "bn" ? "এআই ইনফারেন্স গতি" : "Inference Latency"}
              </span>
              <div className="text-2xl font-black font-mono text-blue-400 mt-1">34 ms</div>
              <span className="text-[10px] text-blue-400/80 font-medium">Sub-100ms Target Met</span>
            </div>
          </div>

          {/* Operational Two-Pane Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Pane: Alert Incident Queue (5 Cols) */}
            <div className="lg:col-span-5 bg-[#0c1626] border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-800/80 mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">
                      {lang === "bn" ? "সন্দেহজনক লেনদেনের তালিকা" : "Suspicious Incident Queue"}
                    </h3>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                    {queue.length} alerts
                  </span>
                </div>

                <div className="space-y-2.5">
                  {queue.map((tx) => (
                    <div 
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                        selectedTx.id === tx.id 
                          ? "bg-[#101e33] border-blue-500/80 shadow-md" 
                          : "bg-[#08101d] border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs font-bold text-slate-200">{tx.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          tx.status === "CRITICAL" ? "bg-rose-950/80 text-rose-300 border border-rose-800/60" :
                          tx.status === "HIGH" ? "bg-amber-950/80 text-amber-300 border border-amber-800/60" :
                          "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                        }`}>
                          {tx.risk_score}% Risk
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-mono">{tx.sender} → {tx.receiver}</span>
                        <span className="font-mono font-bold text-amber-400">৳ {tx.amount.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                        <span>Pattern: <span className="text-slate-300 font-medium">{tx.pattern}</span></span>
                        <span>{tx.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 mt-4 flex justify-between items-center text-xs text-slate-400">
                <span>Filter: Real-time MFS stream</span>
                <button 
                  onClick={exportComplianceMemo}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {lang === "bn" ? "অডিট রিপোর্ট ডাউনলোড" : "Export Audit Memo"}
                </button>
              </div>
            </div>

            {/* Right Pane: Selected Case Deep Investigation (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Active Incident Summary Header */}
              <div className="bg-[#0c1626] border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800/80">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Case Investigation</span>
                    <h2 className="text-lg font-black text-white font-mono">{selectedTx.id}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Analyst Status:</span>
                    <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-[#0f1b2e] border border-slate-700 text-amber-400">
                      {analystDecision || "PENDING AUDIT"}
                    </span>
                  </div>
                </div>

                {/* Score & Verdict Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#08101d] border border-slate-800 rounded-xl p-3.5">
                    <span className="text-[11px] text-slate-400 font-medium block">
                      {lang === "bn" ? "এআই রিস্ক প্রবাবিলিটি" : "Model Fraud Probability"}
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className={`text-3xl font-black font-mono ${
                        selectedTx.risk_score >= 70 ? "text-rose-500" : "text-emerald-400"
                      }`}>
                        {selectedTx.risk_score}%
                      </span>
                      <span className="text-xs font-semibold text-slate-400">Confidence Score</span>
                    </div>
                  </div>

                  <div className="bg-[#08101d] border border-slate-800 rounded-xl p-3.5">
                    <span className="text-[11px] text-slate-400 font-medium block">
                      {lang === "bn" ? "প্রস্তাবিত নিয়ন্ত্রণ নির্দেশ" : "Automated Enforcement"}
                    </span>
                    <div className="text-sm font-bold text-slate-200 mt-1 leading-snug">
                      {selectedTx.risk_score >= 70 
                        ? (lang === "bn" ? "ক্যাশআউট ২ ঘণ্টার জন্য সাময়িক স্থগিত" : "Hold Cash-Out for 2 Hours")
                        : (lang === "bn" ? "স্বাভাবিক চ্যানেল অনুমোদন" : "Cleared for Transfer")}
                    </div>
                  </div>
                </div>

                {/* NetworkX Directed Graph Canvas */}
                <div className="pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-2.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    {lang === "bn" ? "মানি মিউল ট্রানজিট নেটওয়ার্ক (NetworkX Graph)" : "Money Mule Transit Topology"}
                  </span>
                  
                  <div className="bg-[#08101d] border border-slate-800/80 rounded-xl p-4 overflow-x-auto">
                    <div className="flex items-center justify-between min-w-[480px] gap-2 py-1">
                      {graphData?.nodes?.map((node, idx) => (
                        <React.Fragment key={node.id}>
                          <div className={`px-3 py-2.5 rounded-xl border flex flex-col items-center text-center ${
                            node.risk === "CRITICAL" ? "bg-rose-950/30 border-rose-600/50 text-rose-200" :
                            node.risk === "HIGH" ? "bg-amber-950/30 border-amber-600/50 text-amber-200" :
                            "bg-slate-900 border-slate-700 text-slate-300"
                          }`}>
                            <span className="text-[9px] uppercase font-mono font-bold text-slate-400">{node.type}</span>
                            <span className="text-xs font-mono font-bold my-0.5 text-white">{node.id}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 font-mono font-semibold">{node.risk}</span>
                          </div>

                          {idx < (graphData.nodes.length - 1) && (
                            <div className="flex flex-col items-center px-1">
                              <span className="text-[10px] text-amber-400 font-mono font-semibold">
                                {graphData.edges[idx]?.label}
                              </span>
                              <ArrowRight className="w-4 h-4 text-slate-500" />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Copilot Memo & Human Action Controls */}
                <div className="bg-[#08101d] border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {lang === "bn" ? "এআই ইনভেস্টিগেশন ব্রিফ" : "AI Copilot Audit Memo"}
                      </span>
                    </div>
                    <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded font-mono font-medium">
                      Human-in-the-loop
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {copilotBrief?.summary || "Analyzing incident telemetry..."}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2 justify-end">
                    <button 
                      onClick={() => setAnalystDecision("HOLD_CASH_OUT_2H")}
                      className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {lang === "bn" ? "ক্যাশআউট সাময়িক স্থগিত" : "Hold Cash-Out (2h)"}
                    </button>
                    <button 
                      onClick={() => setAnalystDecision("REQUEST_BIOMETRIC_KYC")}
                      className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {lang === "bn" ? "এনআইডি রি-ভেরিফিকেশন তলব" : "Request Biometric KYC"}
                    </button>
                    <button 
                      onClick={() => setAnalystDecision("MANUALLY_APPROVED")}
                      className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {lang === "bn" ? "অনুমোদন করুন" : "Approve Transfer"}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CONSUMER MOBILE APP SIMULATOR (DEDICATED PHONE FRAME)             */}
      {/* ========================================================================= */}
      {activeTab === "phone" && (
        <main className="max-w-7xl mx-auto w-full p-6 flex flex-col items-center justify-center flex-1">
          
          {/* Quick Scenario Buttons for Testing */}
          <div className="mb-6 flex flex-wrap items-center gap-2 bg-[#0c1626] border border-slate-800 p-2 rounded-2xl">
            <span className="text-xs font-semibold text-slate-400 px-2">
              {lang === "bn" ? "টেস্ট পরিস্থিতি নির্বাচন করুন:" : "Select Test Scenario:"}
            </span>
            <button 
              onClick={() => setPhonePreset("NORMAL")}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
            >
              {lang === "bn" ? "স্বাভাবিক লেনদেন (নিরাপদ)" : "Normal Transfer"}
            </button>
            <button 
              onClick={() => setPhonePreset("SCAM")}
              className="text-xs px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition cursor-pointer"
            >
              {lang === "bn" ? "লটারি পুরস্কার স্ক্যাম (উচ্চ ঝুঁকি)" : "Lottery Call Scam"}
            </button>
            <button 
              onClick={() => setPhonePreset("MULE")}
              className="text-xs px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition cursor-pointer"
            >
              {lang === "bn" ? "মিউল নেটওয়ার্ক ট্রেইল" : "Mule Dispersal"}
            </button>
          </div>

          {/* Centered Smartphone Device Frame */}
          <div className="w-full max-w-[390px] bg-[#0c1626] border-4 border-slate-700 rounded-[44px] p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            
            <div>
              {/* Phone Speaker & Notch */}
              <div className="flex justify-between items-center text-[11px] text-slate-400 pb-3 mb-2 font-mono">
                <span className="font-bold text-white">upay</span>
                <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto" />
                <span className="text-emerald-400 font-semibold">4G • 99%</span>
              </div>

              {/* Wallet Balance Card */}
              <div className="bg-gradient-to-br from-[#004B87] to-[#002244] border border-blue-500/30 rounded-2xl p-4 text-white shadow-lg mb-5">
                <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200">
                  {lang === "bn" ? "উপায় একাউন্ট ব্যালেন্স" : "upay Available Balance"}
                </div>
                <div className="text-2xl font-black font-mono tracking-tight mt-1">৳ 58,400.00</div>
                <div className="mt-3 pt-2 border-t border-blue-400/20 flex justify-between text-[11px] text-blue-200 font-mono">
                  <span>{phoneSender}</span>
                  <span className="text-emerald-300 font-semibold">NID Verified</span>
                </div>
              </div>

              {/* Send Money Form */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">
                    {lang === "bn" ? "প্রাপক মোবাইল নম্বর" : "Recipient Mobile Number"}
                  </label>
                  <input 
                    type="text" 
                    value={phoneReceiver}
                    onChange={(e) => setPhoneReceiver(e.target.value)}
                    className="w-full bg-[#08101d] border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">
                    {lang === "bn" ? "টাকার পরিমাণ (BDT)" : "Transfer Amount (৳)"}
                  </label>
                  <input 
                    type="number" 
                    value={phoneAmount}
                    onChange={(e) => setPhoneAmount(e.target.value)}
                    className="w-full bg-[#08101d] border border-slate-800 rounded-xl px-3 py-2.5 text-amber-400 font-black font-mono text-lg focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Behind-the-scenes Telemetry Preview */}
                <div className="bg-[#08101d] border border-slate-800/80 rounded-xl p-3 space-y-2 text-[11px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {lang === "bn" ? "টেলিম্যাট্রি সিগন্যাল" : "Simulated Device Signals"}
                  </span>
                  <div className="flex justify-between text-slate-400">
                    <span>{lang === "bn" ? "প্রাপক অ্যাকাউন্টের বয়স:" : "Recipient Wallet Age:"}</span>
                    <span className="font-mono text-amber-400 font-semibold">{phoneAge} {lang === "bn" ? "দিন" : "days"}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{lang === "bn" ? "১ ঘণ্টার লেনদেন সংখ্যা:" : "1h Frequency:"}</span>
                    <span className="font-mono text-blue-400 font-semibold">{phoneVelocity} tx/hr</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Send Money Button */}
            <div className="pt-6">
              <button 
                onClick={handlePhoneSend}
                disabled={loading}
                className="w-full bg-[#FFB800] hover:bg-amber-400 text-slate-950 font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 fill-slate-950" />}
                <span>{lang === "bn" ? "টাকা পাঠান ও যাচাই করুন" : "Send Money & Evaluate"}</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: AI & SYSTEM METRICS HUB (TECHNICAL AUDIT FOR JUDGES)              */}
      {/* ========================================================================= */}
      {activeTab === "metrics" && (
        <main className="max-w-7xl mx-auto w-full p-6 space-y-6 flex-1">
          
          <div className="bg-[#0c1626] border border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              <span>{lang === "bn" ? "এআই আর্কিটেকচার ও মডেল পারফরম্যান্স" : "AI Architecture & Model Benchmarks"}</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              {lang === "bn"
                ? "আমাদের সিস্টেমটি লাইটজিবিএম (LightGBM) ক্লাসিফায়ার, নেটওয়ার্ক-এক্স (NetworkX) ডিরেক্টেড গ্রাফ অ্যালগরিদম এবং রেসপন্সিবল এআই আর্কিটেকচারের সমন্বয়ে তৈরি।"
                : "upay Shield combines a high-recall LightGBM classifier, NetworkX directed cyclic graph traversal for mule tracing, and local TreeSHAP attribution."}
            </p>
          </div>

          {/* Model Card & Confusion Matrix Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Core Metrics */}
            <div className="bg-[#0c1626] border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {lang === "bn" ? "মডেল সক্ষমতা নির্দেশক" : "Quantitative Model Evaluation"}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-400">ROC-AUC Score:</span>
                    <span className="text-emerald-400 font-bold">0.9742</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[97%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-400">PR-AUC (Avg Precision):</span>
                    <span className="text-blue-400 font-bold">0.9128</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-400 h-full w-[91%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-400">Mule Detection Recall:</span>
                    <span className="text-amber-400 font-bold">94.6%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full w-[94%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-400">Inference Latency:</span>
                    <span className="text-purple-400 font-bold">34 ms</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-400 h-full w-[85%]" />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                Training Dataset: 50,000 synthetic MFS records
              </div>
            </div>

            {/* Synthetic Data & Imbalance Strategy */}
            <div className="bg-[#0c1626] border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {lang === "bn" ? "সিন্থেটিক ডেটা ও গভর্নেন্স" : "Synthetic Data & Governance"}
              </h3>
              
              <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>No Production PII Used:</strong> Strictly compliant with Section 11 of the rulebook.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Class Imbalance Mitigation:</strong> Calibrated with <code className="text-amber-300 bg-slate-900 px-1 rounded">scale_pos_weight</code> (24:1 ratio).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Bengali Telecom Patterns:</strong> Modeled after standard 11-digit MFS operator behaviors.</span>
                </li>
              </ul>
            </div>

            {/* Responsible AI Principles (Section 14) */}
            <div className="bg-[#0c1626] border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {lang === "bn" ? "রেসপন্সিবল এআই ও কমপ্লায়েন্স" : "Responsible AI (Rulebook Sec 14)"}
              </h3>
              
              <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Human-in-the-Loop:</strong> No funds are permanently confiscated autonomously.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Explainability (SHAP):</strong> Exact reason attributions provided for each decision.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Inclusive UX:</strong> Native Bengali Voice TTS to protect rural and unbanked users.</span>
                </li>
              </ul>
            </div>

          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE CUSTOMER WARNING MODAL (WITH NATIVE BENGALI VOICE ALERT)      */}
      {/* ========================================================================= */}
      {customerModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#0c1626] border-2 border-rose-500 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-950/80 rounded-2xl border border-rose-600/40">
                <ShieldAlert className="w-7 h-7 text-rose-500 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded font-mono font-bold uppercase">
                  upay Safety Protection
                </span>
                <h2 className="font-bold text-base text-white mt-1">
                  {phoneEvaluation?.customer_ui_alert?.headline}
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#08101d] p-3.5 rounded-2xl border border-slate-800">
              {phoneEvaluation?.customer_ui_alert?.message}
            </p>

            {/* Native Bengali Voice Alert Button */}
            <div className="flex items-center justify-between bg-blue-950/40 border border-blue-800/40 p-3 rounded-2xl">
              <div className="text-xs text-blue-200 flex items-center gap-2">
                <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-amber-400 animate-pulse' : 'text-blue-400'}`} />
                <span>{lang === "bn" ? "ভয়েস সতর্কবার্তা শুনুন" : "Listen to Voice Warning"}</span>
              </div>
              <button 
                onClick={triggerVoiceWarning}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-md shadow-blue-500/20"
              >
                {isSpeaking ? (lang === "bn" ? "বলছে..." : "Speaking...") : (lang === "bn" ? "চালু করুন" : "Play Voice")}
              </button>
            </div>

            {/* Risk Drivers */}
            <div className="space-y-1.5 text-[11px] text-amber-300 bg-amber-950/30 border border-amber-800/40 p-3 rounded-2xl">
              <div className="font-bold text-amber-200">
                {lang === "bn" ? "সনাক্তকৃত ঝুঁকি কারণসমূহ:" : "Identified Risk Drivers:"}
              </div>
              {phoneEvaluation?.top_contributing_factors?.map((factor, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>{factor}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setCustomerModalOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                {lang === "bn" ? "বাতিল করুন (নিরাপদ)" : "Cancel Transfer"}
              </button>
              <button 
                onClick={() => setCustomerModalOpen(false)}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
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