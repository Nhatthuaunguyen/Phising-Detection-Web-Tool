// checks.js

// Heuristic checks
function heuristicCheck(url) {
    const reasons = [];
    let parsedUrl;

    try {
        parsedUrl = new URL(url);
    } catch (e) {
        return ["Invalid URL format"];
    }

    // 1. Kiểm tra độ dài URL
    if (url.length > 200) {
        reasons.push("URL is unusually long");
    }

    // 2. Kiểm tra IP (Ví dụ: http://1.2.3.4)
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipRegex.test(parsedUrl.hostname)) {
        reasons.push("Hostname is an IP address (unsafe)");
    }
    // 3. Kiểm tra ký tự đặc biệt trong hostname
    const specialCharRegex = /[!@#$%^&*(),?":{}|<>]/;
    if (specialCharRegex.test(parsedUrl.hostname)) {
        reasons.push("Hostname contains special characters");
    }

    return reasons;
}



// Domain & SSL checks
async function domainSSLCheck(url) {
    const reasons = [];
    if (!url.startsWith('https')) {
        reasons.push("Connection is not secure (HTTP only)");
    }
    return reasons;
}

// Main check function
async function checkURL(url) {
    const allReasons = [];

    // Tổng hợp lỗi từ các hàm con
    allReasons.push(...heuristicCheck(url));
    allReasons.push(...await domainSSLCheck(url));
    return allReasons;
}