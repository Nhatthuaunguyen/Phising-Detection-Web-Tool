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
    
    # 1. INPUT VALIDATION
    if not is_valid_url(url):
        return 0, [] 

    parsed = urlparse(url)
    hostname = parsed.hostname or ""

    # --- TRÍCH XUẤT ĐẶC TRƯNG & TÍNH ĐIỂM (RULES) ---
    
    # Rule 1: Kiểm tra IP Address (VD: http://1.2.3.4)
    if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", hostname):
        score += 80
        reasons.append("Hostname is an IP address")

    # Rule 2: Kiểm tra độ dài
    if len(url) > 75:
        score += 20
        reasons.append("URL is unusually long")

    # Rule 3: Từ khóa nghi ngờ
    suspicious_keywords = ['confirm', 'account', 'verify', 'secure', 'login', 'banking']
    if any(keyword in url.lower() for keyword in suspicious_keywords):
        score += 10

    # Rule 4: Giao thức (Protocol)
    if parsed.scheme != 'https':
        score += 30
        reasons.append("Connection is not secure (HTTP only)")

    # --- MACHINE LEARNING INTEGRATION (Giả lập) ---
    # Ví dụ: Nếu domain chứa chữ "example-phish" thì AI báo nguy hiểm
    if "example-phish" in hostname:
        ml_score = 90
        score += ml_score
        reasons.append(f"ML Model Detected Phishing Pattern ({ml_score}% confidence)")

    return score, reasons

@app.route('/analyze', methods=['POST'])
def analyze_url():
    data = request.get_json()
    url = data.get('url', '')

    print(f"Received URL: {url}") # Log để debug

    score, reasons = calculate_phishing_score(url)
    
    is_unsafe = score >= THRESHOLD

    # --- IN LOG RA TERMINAL CHO DỄ NHÌN ---
    print(f" -> SCORE: {score}")
    print(f" -> STATUS: {'UNSAFE' if is_unsafe else 'SAFE'}")
    print(f" -> REASONS: {reasons}")
    print("-" * 30)
    # --------------------------------------

    response = {
        "url": url,
        "score": score,
        "is_unsafe": is_unsafe,
        "reasons": reasons
    }
    
    return jsonify(response)

if __name__ == '__main__':
    # Đã chỉnh về cổng 5000 như cũ
    app.run(debug=True, port=5000)
