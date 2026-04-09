// checks.js
// Kết nối tới Backend Python để xử lý logic (AI + Rules)

const BACKEND_API = "http://127.0.0.1:5000/analyze";

async function checkURL(url) {
    try {
        console.log("Sending to AI Backend...", url);
        
        // 1. Gửi URL về Python Backend
        const response = await fetch(BACKEND_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: url })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log("AI Result:", data);

        // 2. Xử lý kết quả trả về từ Backend
        // Backend sẽ trả về: { is_unsafe: true/false, reasons: [...] }
        if (data.is_unsafe) {
            return data.reasons; // Trả về danh sách lỗi cho người dùng
        }

        return []; // Mảng rỗng nghĩa là An toàn

    } catch (error) {
        console.error("Backend Connection Failed:", error);
        
        // --- FAIL-SAFE (DỰ PHÒNG) ---
        // Nếu Server Python chưa bật hoặc bị lỗi, ta kiểm tra sơ bộ tại Client
        // để tránh chặn nhầm hoặc bỏ lọt lỗi cơ bản.
        
        const fallbackReasons = [];
        
        // Kiểm tra HTTP cơ bản nếu không kết nối được server
        if (!url.startsWith("https")) {
            fallbackReasons.push("Warning: Backend unavailable & Connection is not secure (HTTP)");
        }

        return fallbackReasons;
    }
}