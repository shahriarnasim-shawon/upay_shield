# ml_engine/train_model.py
import pandas as pd
import numpy as np
import lightgbm as lgb
import joblib
import json
import os
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, average_precision_score


def train_risk_engine():
    data_path = "data/mfs_transactions.csv"
    if not os.path.exists(data_path):
        raise FileNotFoundError(
            f"{data_path} not found! Run generate_synthetic_data.py first.")

    print("[*] Loading dataset...")
    df = pd.read_csv(data_path)

    # Core predictive features
    features = [
        "amount",
        "hour_of_day",
        "velocity_1h",
        "velocity_24h",
        "recipient_age_days",
        "device_changed",
        "is_new_recipient",
        "failed_pin_attempts",
        "time_to_cashout_mins"
    ]
    target = "is_fraud"

    X = df[features]
    y = df[target]

    # Stratified Train/Test Split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # Calculate class weighting for severe imbalance
    neg_count = len(y_train) - sum(y_train)
    pos_count = sum(y_train)
    scale_weight = neg_count / pos_count

    print(
        f"[*] Training LightGBM Risk Model (scale_pos_weight: {scale_weight:.2f})...")

    model = lgb.LGBMClassifier(
        n_estimators=180,
        learning_rate=0.04,
        max_depth=6,
        num_leaves=31,
        scale_pos_weight=scale_weight,
        random_state=42
    )

    model.fit(X_train, y_train)

    # Evaluation
    y_probs = model.predict_proba(X_test)[:, 1]
    # High precision threshold for financial safety
    y_preds = (y_probs >= 0.70).astype(int)

    roc_auc = roc_auc_score(y_test, y_probs)
    pr_auc = average_precision_score(y_test, y_probs)

    print("\n========== MODEL EVALUATION REPORT ==========")
    print(f"ROC-AUC Score: {roc_auc:.4f}")
    print(f"PR-AUC (Precision-Recall AUC): {pr_auc:.4f}")
    print(classification_report(y_test, y_preds,
          target_names=["Normal", "Fraud"]))
    print("=============================================\n")

    # Ensure artifacts directory exists
    os.makedirs("artifacts", exist_ok=True)

    # Save Model Artifacts
    model_path = "artifacts/upay_risk_lgbm.joblib"
    joblib.dump(model, model_path)

    metadata = {
        "features": features,
        "optimal_threshold": 0.70,
        "roc_auc": round(float(roc_auc), 4),
        "pr_auc": round(float(pr_auc), 4)
    }
    with open("artifacts/model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=4)

    print(f"[✓] Model exported to {model_path}")
    print("[✓] Feature metadata exported to artifacts/model_metadata.json")


if __name__ == "__main__":
    train_risk_engine()
