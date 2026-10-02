# ml_engine/generate_synthetic_data.py
import numpy as np
import pandas as pd
import random
from datetime import datetime, timedelta


def generate_mfs_dataset(n_samples=50000, seed=42):
    np.random.seed(seed)
    random.seed(seed)

    print(
        f"[*] Generating {n_samples} synthetic Bangladeshi MFS transactions...")

    records = []
    base_time = datetime(2026, 10, 1, 0, 0, 0)

    # Simulating Bangladeshi 11-digit mobile numbers (Grameenphone, Banglalink, Robi/Airtel, Teletalk)
    prefixes = ["017", "019", "018", "016", "015"]
    wallets = [
        f"{random.choice(prefixes)}{random.randint(10000000, 99999999)}" for _ in range(3000)]
    agents = [f"AGT_DHAKA_{i:03d}" for i in range(
        100)] + [f"AGT_RURAL_{i:03d}" for i in range(100)]

    for i in range(n_samples):
        tx_id = f"UPY{i:08d}"
        sender = random.choice(wallets)
        receiver = random.choice(wallets)
        while receiver == sender:
            receiver = random.choice(wallets)

        timestamp = base_time + \
            timedelta(seconds=random.randint(0, 86400 * 7))  # 7 days window
        hour = timestamp.hour

        # 4% fraudulent / suspicious pattern distribution
        is_fraud = 1 if np.random.rand() < 0.04 else 0

        if not is_fraud:
            # Normal Daily Usage (Send Money, Merchant Pay, Utility)
            amount = float(np.random.choice([100, 200, 500, 1200, 2500, 5000], p=[
                           0.3, 0.25, 0.2, 0.15, 0.07, 0.03]))
            channel = np.random.choice(["App", "USSD"], p=[0.75, 0.25])
            recipient_age_days = random.randint(30, 900)
            velocity_1h = np.random.poisson(lam=0.4)
            velocity_24h = velocity_1h + np.random.poisson(lam=1.8)
            device_changed = np.random.choice([0, 1], p=[0.98, 0.02])
            is_new_recipient = np.random.choice([0, 1], p=[0.88, 0.12])
            failed_pin_attempts = np.random.choice([0, 1], p=[0.97, 0.03])
            time_to_cashout_mins = random.randint(240, 7200)
            assigned_agent = random.choice(
                agents) if np.random.rand() < 0.15 else "NONE"
            pattern_type = "NORMAL"

            alert_bn = "লেনদেন স্বাভাবিক।"
            alert_en = "Transaction is normal."

        else:
            # Fraud Scenarios
            pattern = np.random.choice(
                ["LOTTERY_SCAM", "MULE_HOP", "ATO"], p=[0.45, 0.35, 0.20])
            channel = np.random.choice(["App", "USSD"], p=[0.4, 0.6])
            failed_pin_attempts = np.random.choice(
                [0, 1, 2, 3], p=[0.3, 0.3, 0.25, 0.15])
            assigned_agent = random.choice(agents)

            if pattern == "LOTTERY_SCAM":
                # User sending high balance to newly formed scammer account
                amount = float(random.randint(8000, 25000))
                recipient_age_days = random.randint(
                    0, 5)  # Opened within 5 days
                velocity_1h = random.randint(1, 3)
                velocity_24h = velocity_1h + random.randint(1, 4)
                device_changed = 0
                is_new_recipient = 1
                time_to_cashout_mins = random.randint(
                    2, 12)  # Scammer cashes out instantly
                pattern_type = "LOTTERY_SCAM"
                alert_bn = "সাবধান! প্রাপকের অ্যাকাউন্টটি নতুন। কোনো লটারি বা অফারের কলে প্রলুব্ধ হয়ে টাকা পাঠাবেন না।"
                alert_en = "Warning! Recipient account is brand new. Do not send money under phone call instructions."

            elif pattern == "MULE_HOP":
                # High velocity chain moving between multiple wallets
                amount = float(random.randint(10000, 25000))
                recipient_age_days = random.randint(
                    0, 2)  # Instant mule account
                velocity_1h = random.randint(5, 14)
                velocity_24h = velocity_1h + random.randint(5, 20)
                device_changed = np.random.choice([0, 1], p=[0.5, 0.5])
                is_new_recipient = 1
                time_to_cashout_mins = random.randint(1, 6)
                pattern_type = "MULE_HOP"
                alert_bn = "সন্দেহজনক দ্রুত লেনদেন শনাক্ত হয়েছে। মিউল অ্যাকাউন্টের মাধ্যমে টাকা সরানোর সম্ভাবনা।"
                alert_en = "Suspicious velocity detected. Potential money mule routing pattern."

            else:  # ATO (Account Takeover)
                amount = float(random.randint(15000, 25000))
                recipient_age_days = random.randint(1, 15)
                velocity_1h = random.randint(3, 7)
                velocity_24h = velocity_1h + random.randint(3, 10)
                device_changed = 1  # New handset
                is_new_recipient = 1
                time_to_cashout_mins = random.randint(2, 10)
                pattern_type = "ATO"
                alert_bn = "নতুন ডিভাইস থেকে অস্বাভাবিক উচ্চ লেনদেন। অ্যাকাউন্ট সুরক্ষায় ওটিপি ভেরিফিকেশন প্রয়োজন।"
                alert_en = "Unusual high-value transfer from a new device. Step-up OTP required."

        records.append({
            "tx_id": tx_id,
            "sender_wallet": sender,
            "receiver_wallet": receiver,
            "agent_id": assigned_agent,
            "amount": amount,
            "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "hour_of_day": hour,
            "channel": channel,
            "velocity_1h": velocity_1h,
            "velocity_24h": velocity_24h,
            "recipient_age_days": recipient_age_days,
            "device_changed": device_changed,
            "is_new_recipient": is_new_recipient,
            "failed_pin_attempts": failed_pin_attempts,
            "time_to_cashout_mins": time_to_cashout_mins,
            "pattern_type": pattern_type,
            "alert_msg_bn": alert_bn,
            "alert_msg_en": alert_en,
            "is_fraud": is_fraud
        })

    df = pd.DataFrame(records)
    output_path = "data/mfs_transactions.csv"
    df.to_csv(output_path, index=False)
    print(f"[✓] Successfully saved {len(df)} records to {output_path}")
    print(
        f"[✓] Fraud class distribution:\n{df['pattern_type'].value_counts()}")


if __name__ == "__main__":
    generate_mfs_dataset()
