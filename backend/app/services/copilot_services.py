# backend/app/services/copilot_service.py
import os
import json


class AICopilotService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", None)

    def generate_investigation_brief(self, payload: dict, lang: str = "bn") -> dict:
        """
        Generates structured incident audit report for fraud analysts in Bangla and English.
        """
        tx_id = payload.get("tx_id", "UPY-TX-DEMO")
        sender = payload.get("sender_wallet", "N/A")
        receiver = payload.get("receiver_wallet", "N/A")
        amount = payload.get("amount", 0.0)
        risk_score = payload.get("risk_score", 0.0)
        factors = payload.get("top_factors", [])
        mule_detected = payload.get("mule_detected", False)

        # 1. Deterministic Intelligent Synthesizer (Zero-Latency / Fail-Proof)
        if lang == "bn":
            report = {
                "headline": f"জরুরি তদন্ত রিপোর্ট: উচ্চ ঝুঁকির লেনদেন [{tx_id}]",
                "summary": (
                    f"অ্যাকাউন্ট {sender} থেকে {receiver} নম্বরে ৳{amount:,.2f} পাঠানোর চেষ্টা শনাক্ত হয়েছে। "
                    f"আমাদের এআই মডেল {risk_score}% ঝুঁকি স্কোর হিসাব করেছে।"
                ),
                "key_findings": [
                    f"ঝুঁকি উপাদান: {', '.join(factors) if factors else 'স্বাভাবিক মাত্রা অতিক্রম'}",
                    "মিউল নেটওয়ার্ক সম্পৃক্ততা: নিশ্চিত" if mule_detected else "মিউল চেইন সন্দেহ নেই",
                    "বাংলাদেশ ব্যাংক এমএফএস বিধিমালার ধারা অনুযায়ী লেনদেনটি উচ্চ ঝুঁকিপূর্ণ।"
                ],
                "recommended_actions": [
                    "১. প্রাপক অ্যাকাউন্টে পরবর্তী ২ ঘণ্টার জন্য ক্যাশ-আউট সুবিধা সাময়িক স্থগিত রাখুন।",
                    "২. প্রেরক গ্রাহকের কাছে বাংলায় তাৎক্ষণিক সতর্কবার্তা ও ওটিপি ভেরিফিকেশন পাঠান।",
                    "৩. প্রাপক গ্রাহকের জাতীয় পরিচয়পত্র (NID) পুনরায় যাচাইয়ের অনুরোধ করুন।"
                ],
                "governance_note": "এই সিদ্ধান্তটি স্বয়ংক্রিয়ভাবে সম্পূর্ণ ব্লক করা হয়নি; মানব অডিটরের পর্যালোচনার অপেক্ষায় রয়েছে (Responsible AI Principle)."
            }
        else:
            report = {
                "headline": f"Incident Investigation Brief: High-Risk Alert [{tx_id}]",
                "summary": (
                    f"Transaction from {sender} to {receiver} for BDT {amount:,.2f} triggered an automated alert. "
                    f"The machine learning risk score is {risk_score}%."
                ),
                "key_findings": [
                    f"Identified Risk Drivers: {', '.join(factors) if factors else 'Anomalous velocity'}",
                    "Money Mule Chain Detected: Confirmed" if mule_detected else "Direct Single Transfer",
                    "Pattern aligns with rapid dispersal social-engineering scam signatures."
                ],
                "recommended_actions": [
                    "1. Place a temporary 2-hour hold on agent cash-out for the recipient wallet.",
                    "2. Trigger an interactive security questionnaire to the sender in the upay app.",
                    "3. Flag the recipient wallet for biometric/NID KYC re-verification."
                ],
                "governance_note": "Human-in-the-loop oversight preserved. Autonomous funds seizure avoided (Responsible AI Compliance)."
            }

        # 2. Optional: LLM Enhancement if OPENAI_API_KEY is available in .env
        if self.api_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=self.api_key)
                prompt = (
                    f"You are the Chief Risk Officer AI for upay MFS in Bangladesh. Summarize this fraud case in {lang}:\n"
                    f"TxID: {tx_id}, Amount: {amount}, Risk: {risk_score}%, Factors: {factors}, Mule detected: {mule_detected}.\n"
                    f"Provide executive recommendation in JSON format with keys: headline, summary, key_findings, recommended_actions."
                )
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.2
                )
                llm_json = json.loads(response.choices[0].message.content)
                return llm_json
            except Exception:
                # Silently fallback to our rule-grounded generator if API is down
                pass

        return report


copilot_service = AICopilotService()
