# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from backend.app.services.graph_services import mule_graph_engine
from backend.app.services.copilot_services import copilot_service
import joblib
import json
import numpy as np
import os

app = FastAPI(
    title="upay Shield: Bilingual AI Risk & Scam Interceptor",
    description="Real-time transaction risk scoring and bilingual warning system for upay MFS.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Model and Config
MODEL_PATH = os.path.join(os.path.dirname(
    __file__), "../../ml_engine/artifacts/upay_risk_lgbm.joblib")
META_PATH = os.path.join(os.path.dirname(
    __file__), "../../ml_engine/artifacts/model_metadata.json")

# Fallback if running directly inside backend/app
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = "upay_risk_lgbm.joblib"
    META_PATH = "model_metadata.json"

model = joblib.load(MODEL_PATH)
with open(META_PATH, "r") as f:
    metadata = json.load(f)
FEATURES = metadata["features"]

# Input Schema


class TransactionPayload(BaseModel):
    sender_wallet: str = Field(..., example="01712345678")
    receiver_wallet: str = Field(..., example="01987654321")
    amount: float = Field(..., example=18500.0)
    hour_of_day: int = Field(default=14, example=14)
    velocity_1h: int = Field(default=1, example=5)
    velocity_24h: int = Field(default=2, example=8)
    recipient_age_days: int = Field(default=180, example=2)
    device_changed: int = Field(default=0, example=1)
    is_new_recipient: int = Field(default=1, example=1)
    failed_pin_attempts: int = Field(default=0, example=0)
    time_to_cashout_mins: int = Field(default=600, example=8)
    # 'bn' for Bangla, 'en' for English
    lang: str = Field(default="bn", example="bn")


class CopilotRequest(BaseModel):
    tx_id: str = "UPY_991823"
    sender_wallet: str = "01711223344"
    receiver_wallet: str = "01999887766"
    amount: float = 24500.0
    risk_score: float = 88.5
    top_factors: list[str] = [
        "New recipient registered 1 hour ago", "Immediate cash-out pattern"]
    mule_detected: bool = True
    lang: str = "bn"  # 'bn' or 'en'


# Bilingual Message Dictionary
BILINGUAL_DICT = {
    "bn": {
        "action_block": "লেনদেন সাময়িক স্থগিত",
        "action_warn": "গ্রাহক সতর্কতা ও নিশ্চিতকরণ",
        "action_allow": "লেনদেন নিরাপদ ও অনুমোদিত",
        "reason_recipient_new": "প্রাপকের অ্যাকাউন্টটি মাত্র কয়েক দিন আগে খোলা হয়েছে।",
        "reason_device_switch": "গত ২৪ ঘণ্টায় নতুন ডিভাইস থেকে লেনদেন করা হচ্ছে।",
        "reason_cashout_speed": "টাকা পাওয়ার পরপরই দ্রুত ক্যাশ-আউটের প্রবণতা রয়েছে।",
        "reason_velocity_spike": "স্বাভাবিকের চেয়ে দ্রুত গতিতে ঘনঘন লেনদেন হচ্ছে।",
        "warning_headline": "সাবধানতা অবলম্বন করুন!",
        "customer_prompt": "আপনি কি কোনো লটারি বা অফারের কলে প্রলুব্ধ হয়ে টাকা পাঠাচ্ছেন? অপরিচিত কারও কথায় টাকা পাঠানো থেকে বিরত থাকুন।"
    },
    "en": {
        "action_block": "TRANSACTION_HELD_FOR_VERIFICATION",
        "action_warn": "CUSTOMER_SAFETY_CONFIRMATION_REQUIRED",
        "action_allow": "TRANSACTION_PERMITTED",
        "reason_recipient_new": "Recipient account was created less than 72 hours ago.",
        "reason_device_switch": "Transaction initiated from a recently switched handset.",
        "reason_cashout_speed": "Funds are scheduled for immediate agent cash-out.",
        "reason_velocity_spike": "Unusual hourly transaction burst detected.",
        "warning_headline": "Security Precaution!",
        "customer_prompt": "Are you being instructed over a phone call to make this transfer? Verify the recipient before proceeding."
    }
}


@app.get("/")
def root():
    return {
        "service": "upay Shield API",
        "status": "online",
        "supported_languages": ["bn", "en"],
        "model_accuracy_roc_auc": metadata.get("roc_auc")
    }


@app.post("/api/v1/score")
def evaluate_transaction(tx: TransactionPayload):
    # Prepare vector matching exact training feature order
    feature_vector = np.array([[getattr(tx, feat) for feat in FEATURES]])

    # Calculate Risk Probability (0 - 100)
    risk_prob = float(model.predict_proba(feature_vector)[0][1] * 100)

    lang = "bn" if tx.lang.lower() == "bn" else "en"
    lexicon = BILINGUAL_DICT[lang]

    # Rule-assisted Decision Engine
    reasons = []
    if tx.recipient_age_days <= 3:
        reasons.append(lexicon["reason_recipient_new"])
    if tx.device_changed == 1:
        reasons.append(lexicon["reason_device_switch"])
    if tx.time_to_cashout_mins <= 15:
        reasons.append(lexicon["reason_cashout_speed"])
    if tx.velocity_1h >= 4:
        reasons.append(lexicon["reason_velocity_spike"])

    if risk_prob >= 70.0:
        action = lexicon["action_block"]
        status = "HIGH_RISK"
        show_customer_modal = True
    elif risk_prob >= 40.0:
        action = lexicon["action_warn"]
        status = "MEDIUM_RISK"
        show_customer_modal = True
    else:
        action = lexicon["action_allow"]
        status = "LOW_RISK"
        show_customer_modal = False

    return {
        "transaction_id": f"SIM_{abs(hash(tx.sender_wallet + tx.receiver_wallet)) % 10000000}",
        "risk_score": round(risk_prob, 2),
        "status": status,
        "action": action,
        "language": lang,
        "top_contributing_factors": reasons,
        "customer_ui_alert": {
            "show_modal": show_customer_modal,
            "headline": lexicon["warning_headline"] if show_customer_modal else "",
            "message": lexicon["customer_prompt"] if show_customer_modal else ""
        }
    }


@app.get("/api/v1/graph/trace/{wallet_id}")
def get_wallet_network_trace(wallet_id: str):
    """
    Returns the network graph and mule transit chain for any flagged wallet.
    """
    graph_data = mule_graph_engine.trace_mule_chain(wallet_id)
    return graph_data


@app.post("/api/v1/copilot/investigate")
def generate_investigation_brief(req: CopilotRequest):
    """
    Generates an AI-driven investigation brief in English or Bangla.
    """
    brief = copilot_service.generate_investigation_brief(
        req.model_dump(), lang=req.lang)
    return brief
