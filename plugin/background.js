// background.js

try {
    importScripts('checks.js');
} catch (e) {
    console.error("Failed to load checks.js:", e);
}

// --- QUẢN LÝ WHITELIST BỀN VỮNG (STORAGE + RAM) ---

// 1. Biến RAM: Để kiểm tra nhanh tốc độ cao
let allowedDomains = new Set();

// 2. Hàm nạp dữ liệu từ Storage vào RAM khi Extension khởi động
function loadWhitelist() {
    chrome.storage.local.get(["trusted_domains"], (result) => {
        if (result.trusted_domains) {
            // Chuyển từ Array (trong storage) sang Set (trong RAM)
            allowedDomains = new Set(result.trusted_domains);
            console.log("Loaded whitelist from storage:", allowedDomains);
        }
    });
}

// 3. Hàm thêm domain vào cả RAM và Storage
function addToWhitelist(domain) {
    if (!allowedDomains.has(domain)) {
        allowedDomains.add(domain);
        // Lưu mảng (Array) vào storage vì Storage không lưu được Set trực tiếp
        chrome.storage.local.set({ trusted_domains: Array.from(allowedDomains) });
        console.log(`Domain added to permanent whitelist: ${domain}`);
    }
}

// Gọi hàm load ngay lập tức
loadWhitelist();

// Lắng nghe tín hiệu từ warning.js (khi user bấm Yes)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "allow_url") {
        try {
            // Trích xuất domain và lưu vĩnh viễn
            const domain = new URL(message.url).hostname;
            addToWhitelist(domain); 
        } catch (e) {
            console.error("Error parsing URL to allow:", message.url);
        }
    }
});

chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        const url = details.url;

        // 1. BỘ LỌC (FILTER) - Loại bỏ các request hệ thống/nội bộ
        if (url.startsWith("chrome-extension://") || 
            url.startsWith("chrome://") ||
            url.includes("google.com/warmup.html") || 
            details.type !== "main_frame") {          
            return;
        }

        // 2. CHECK WHITELIST (Theo Domain)
        let hostname;
        try {
            hostname = new URL(url).hostname;
        } catch (e) {
            return; // URL lỗi thì bỏ qua
        }

        // Nếu domain đã có trong bộ nhớ (đã load từ storage hoặc mới thêm) -> BỎ QUA
        if (allowedDomains.has(hostname)) {
            console.log(`Skipped (Known Safe Domain): ${hostname}`);
            return;
        }

        console.log(`Checking security: ${url}`);

        // 3. THỰC HIỆN KIỂM TRA
        checkURL(url).then(reasons => {
            if (reasons.length > 0) {
                // PHÁT HIỆN NGUY HIỂM
                console.log(`%cBLOCKED: ${url}`, "color: red; font-weight: bold");
                
                const warningPage = chrome.runtime.getURL('warning.html') + 
                    `?url=${encodeURIComponent(url)}&reasons=${encodeURIComponent(reasons.join(','))}`;
                
                // Chuyển hướng sang trang cảnh báo
                chrome.tabs.update(details.tabId, { url: warningPage });
            } else {
                // AN TOÀN
                // Tự động thêm domain vào whitelist vĩnh viễn
                // Lần sau vào lại trang này hoặc trang con (login/profile) sẽ không bị check nữa
                addToWhitelist(hostname);
                console.log(`Auto-trusted safe domain: ${hostname}`);
            }
        });
    },
    { urls: ["<all_urls>"] }
);