const urlParams = new URLSearchParams(window.location.search);
const targetUrl = urlParams.get('url');
const reasons = urlParams.get('reasons') ? urlParams.get('reasons').split(',') : [];

// Display reasons
const reasonsList = document.getElementById('reasons-list');
if (reasonsList) {
    reasons.forEach(reason => {
        const li = document.createElement('li');
        li.textContent = reason;
        reasonsList.appendChild(li);
    });
}

// Handle YES (Proceed)
document.getElementById('yes').addEventListener('click', () => {
    if (targetUrl) {
        chrome.runtime.sendMessage({ action: "allow_url", url: targetUrl });
        window.location.href = targetUrl;
    } else {
        alert("Error: Target URL not found.");
    }
});

// Handle NO (Go Back / Close)
document.getElementById('no').addEventListener('click', () => {
    window.location.href = "https://www.google.com";
});
