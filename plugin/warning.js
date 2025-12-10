const urlParams = new URLSearchParams(window.location.search);
const targetUrl = urlParams.get('url');
const reasons = urlParams.get('reasons') ? urlParams.get('reasons').split(',') : [];

// Hiển thị danh sách lỗi
const reasonsList = document.getElementById('reasons-list');
if (reasonsList) {
    reasons.forEach(reason => {
        const li = document.createElement('li');
        li.textContent = reason;
        reasonsList.appendChild(li);
    });
}

// Xử lý nút YES (Tiếp tục truy cập)
document.getElementById('yes').addEventListener('click', () => {
    if (targetUrl) {
        // Gửi tin nhắn cho background script để thêm URL này vào whitelist
        chrome.runtime.sendMessage({ action: "allow_url", url: targetUrl });

        // Chuyển hướng lại trang web gốc
        window.location.href = targetUrl;
    } else {
        alert("Error: Target URL not found.");
    }
});

// Xử lý nút NO (Thoát)
document.getElementById('no').addEventListener('click', () => {
    // Đóng tab hiện tại
    chrome.tabs.remove(chrome.tabs.TAB_ID_NONE);
});