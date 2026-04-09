from flask import Flask, request, jsonify
from flask_cors import CORS
import re
from urllib.parse import urlparse

app = Flask(__name__)
CORS(app)  # Cho phép Extension giao tiếp với Server này

# --- CẤU HÌNH ---
THRESHOLD = 50  # Ngưỡng điểm: Lớn hơn 50 là KHÔNG AN TOÀN
# model = joblib.load('phishing_model.pkl') # (Dành cho sau này load Model thật)

def is_valid_url(url):
    """Kiểm tra xem input có phải cấu trúc URL hợp lệ không."""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

def calculate_phishing_score(url):
    """
    Hệ thống tính điểm lai (Hybrid):
    Kết hợp Luật (Rules) + Model Machine Learning.
    """
    score = 0
    reasons = []
    ml_prob = 0.0

    # 1. INPUT VALIDATION
    if not is_valid_url(url):
        return 0, [], 0.0

    parsed = urlparse(url)
    hostname = parsed.hostname or ""

    # --- TRÍCH XUẤT ĐẶC TRƯNG & TÍNH ĐIỂM (RULES) ---
    rules_score = 0

    # Rule 1: Kiểm tra IP Address (VD: http://1.2.3.4)
    if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", hostname):
        rules_score += 80
        reasons.append("Hostname is an IP address")

    # Rule 2: Kiểm tra độ dài
    if len(url) > 75:
        rules_score += 20
        reasons.append("URL is unusually long")

    # Rule 3: Từ khóa nghi ngờ
    suspicious_keywords = ['confirm', 'account', 'verify', 'secure', 'login', 'banking']
    if any(keyword in url.lower() for keyword in suspicious_keywords):
        rules_score += 10
        reasons.append(f"Suspicious keyword found in URL")

    # Rule 4: Giao thức (Protocol)
    if parsed.scheme != 'https':
        rules_score += 30
        reasons.append("Connection is not secure (HTTP only)")

    # --- MACHINE LEARNING INTEGRATION (Giả lập) ---
    # Ví dụ: Nếu domain chứa chữ "example-phish" thì AI báo nguy hiểm
    if "example-phish" in hostname:
        ml_prob = 0.95
        reasons.append(f"ML Model Detected Phishing Pattern ({int(ml_prob*100)}% confidence)")
    else:
        # Giả lập xác suất thấp cho các trang khác
        ml_prob = 0.05

    total_score = rules_score + (ml_prob * 100)
    return total_score, reasons, ml_prob

@app.route('/analyze', methods=['POST'])
def analyze_url():
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({"error": "No URL provided"}), 400

    url = data.get('url', '')

    print(f"Received URL: {url}") # Log để debug

    total_risk, reasons, ml_prob = calculate_phishing_score(url)
    
    # rules_score is total - ml_impact
    ml_impact = ml_prob * 100
    rules_score = max(0, total_risk - ml_impact)

    is_unsafe = total_risk >= THRESHOLD

    # --- IN LOG RA TERMINAL CHO DỄ NHÌN ---
    print(f" -> SCORE: {total_risk}")
    print(f" -> STATUS: {'UNSAFE' if is_unsafe else 'SAFE'}")
    print(f" -> REASONS: {reasons}")
    print("-" * 30)
    # --------------------------------------

    response = {
        "url": url,
        "total_risk": total_risk,
        "rules_score": rules_score,
        "ml_probability": ml_prob,
        "is_unsafe": is_unsafe,
        "reasons": reasons
    }
    
    return jsonify(response)

import os
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', debug=True, port=port)
