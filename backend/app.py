from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import socket
import ssl
from datetime import datetime
from urllib.parse import urlparse
import whois
import requests

app = Flask(__name__)
CORS(app)

# --- CONFIGURATION ---
THRESHOLD = 50 

# Mock external blacklists for Threat Intelligence
LOCAL_BLACKLIST = ['phish-update-secure.com', 'fake-login-bank.net']

def is_valid_url(url):
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

# --- LAYER 2: THREAT INTELLIGENCE ---
def check_threat_intelligence(url, hostname):
    """
    Checks the URL against blacklists. 
    In production, replace this with actual API calls to Google Safe Browsing or PhishTank.
    """
    # 1. Local/Hardcoded Blacklist Check
    if hostname in LOCAL_BLACKLIST:
        return True, "Domain found in local threat intelligence blacklist."
    
    # 2. External API Example (Placeholder)
    # try:
    #     response = requests.post("https://api.safebrowsing.google.com...", json={"url": url}, timeout=3)
    #     if response.json().get('matches'):
    #         return True, "Flagged by Google Safe Browsing."
    # except:
    #     pass

    return False, ""

# --- LAYER 3: DOMAIN AND SSL CHECKS ---
def check_domain_age(hostname):
    """Fetches WHOIS data to determine domain age. New domains are suspicious."""
    try:
        # Strip subdomains for WHOIS (e.g., www.example.com -> example.com)
        domain_parts = hostname.split('.')
        if len(domain_parts) > 2:
            base_domain = '.'.join(domain_parts[-2:])
        else:
            base_domain = hostname

        domain_info = whois.whois(base_domain)
        creation_date = domain_info.creation_date
        
        if type(creation_date) is list:
            creation_date = creation_date[0]
            
        if creation_date:
            age_days = (datetime.now() - creation_date).days
            return age_days
    except Exception as e:
        return -1 # Unable to fetch WHOIS (often true for malicious sites hiding data)
    return -1

def check_ssl_certificate(hostname):
    """Checks if the SSL certificate is valid and issued properly."""
    try:
        context = ssl.create_default_context()
        with socket.create_connection((hostname, 443), timeout=3) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                # If we get here, a valid cert exists. We could check issuer/expiry here.
                return True, "Valid SSL Certificate"
    except Exception as e:
        return False, f"SSL Error or No valid certificate: {str(e)}"

# --- MAIN SCORING FUNCTION ---
def calculate_phishing_score(url):
    score = 0
    reasons = []
    ml_prob = 0.0

    if not is_valid_url(url):
        return 0, [], 0.0

    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    path = parsed.path.lower()

    # ========================================================
    # LAYER 1: ENHANCED RULE-BASED DETECTION (Lexical & Heuristic)
    # ========================================================
    rules_score = 0

    # Rule 1.1: IP Address in Hostname
    if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", hostname):
        rules_score += 80
        reasons.append("Hostname is an IP address")

    # Rule 1.2: Unusually Long URL
    if len(url) > 75:
        rules_score += 20
        reasons.append(f"URL is unusually long ({len(url)} chars)")

    # Rule 1.3: Suspicious Keywords
    suspicious_keywords = ['confirm', 'account', 'verify', 'secure', 'login', 'banking', 'update']
    if any(keyword in url.lower() for keyword in suspicious_keywords):
        rules_score += 15
        reasons.append("Suspicious keyword found in URL")

    # Rule 1.4: Protocol Check
    if parsed.scheme != 'https':
        rules_score += 30
        reasons.append("Connection is not secure (HTTP only)")

    # Rule 1.5: Too Many Subdomains (e.g., login.verify.paypal.com.scam.net)
    if hostname.count('.') > 3:
        rules_score += 25
        reasons.append("Excessive number of subdomains detected")

    # Rule 1.6: Suspicious Path/File Extensions
    suspicious_extensions = ['.exe', '.zip', '.apk', '.rar']
    if any(path.endswith(ext) for ext in suspicious_extensions):
        rules_score += 40
        reasons.append("URL points to a suspicious executable or archive file")

    # Rule 1.7: Lexical/Homoglyph Simulation (Basic check for mixed character sets/dashes)
    if hostname.count('-') > 2:
        rules_score += 15
        reasons.append("Multiple dashes in domain name (common in phishing)")

    # ========================================================
    # LAYER 2: THREAT INTELLIGENCE (Blacklisting)
    # ========================================================
    is_blacklisted, blacklist_reason = check_threat_intelligence(url, hostname)
    if is_blacklisted:
        rules_score += 100  # Immediate massive penalty
        reasons.append(f"BLACKLISTED: {blacklist_reason}")

    # ========================================================
    # LAYER 3: DOMAIN AND SSL CHECKS
    # ========================================================
    # Domain Age Check
    domain_age_days = check_domain_age(hostname)
    if domain_age_days == -1:
        rules_score += 20
        reasons.append("Could not verify domain WHOIS data (potentially hidden/suspicious)")
    elif domain_age_days < 30:
        rules_score += 40
        reasons.append(f"Domain is very new (Registered {domain_age_days} days ago)")

    # SSL Check (Only apply if scheme is HTTPS, HTTP is penalized above)
    if parsed.scheme == 'https':
        has_valid_ssl, ssl_msg = check_ssl_certificate(hostname)
        if not has_valid_ssl:
            rules_score += 35
            reasons.append(f"SSL Certificate Anomaly: {ssl_msg}")

    # ========================================================
    # LAYER 4: MACHINE LEARNING (Placeholder)
    # ========================================================
    if "example-phish" in hostname:
        ml_prob = 0.95
        reasons.append(f"ML Model Detected Phishing Pattern ({int(ml_prob*100)}% confidence)")
    else:
        ml_prob = 0.05

    total_score = rules_score + (ml_prob * 100)
    return total_score, reasons, ml_prob

@app.route('/', methods=['GET'])
def home():
    return "Enhanced Phishing Detection Backend is Running!"

@app.route('/analyze', methods=['POST'])
def analyze_url():
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({"error": "No URL provided"}), 400

    url = data.get('url', '')
    print(f"Analyzing URL: {url}")

    total_risk, reasons, ml_prob = calculate_phishing_score(url)
    
    ml_impact = ml_prob * 100
    rules_score = max(0, total_risk - ml_impact)
    is_unsafe = total_risk >= THRESHOLD

    print(f" -> SCORE: {total_risk}")
    print(f" -> STATUS: {'UNSAFE' if is_unsafe else 'SAFE'}")
    print(f" -> REASONS: {reasons}")
    print("-" * 30)

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