// background.js

try {
    importScripts('checks.js');
} catch (e) {
    console.error("Failed to load checks.js:", e);
}

// --- WHITELIST MANAGEMENT ---
let allowedDomains = new Set();

function loadWhitelist() {
    chrome.storage.local.get(["trusted_domains"], (result) => {
        if (result.trusted_domains) {
            allowedDomains = new Set(result.trusted_domains);
        }
    });
}

function addToWhitelist(domain) {
    if (!allowedDomains.has(domain)) {
        allowedDomains.add(domain);
        chrome.storage.local.set({ trusted_domains: Array.from(allowedDomains) });
    }
}

loadWhitelist();

// Handle messages from warning.html
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "allow_url") {
        try {
            const domain = new URL(message.url).hostname;
            addToWhitelist(domain); 
        } catch (e) {
            console.error("Error parsing URL:", message.url);
        }
    }
});

// --- INTERCEPT REQUESTS ---
chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        const url = details.url;

        // Filter system/internal URLs
        if (url.startsWith("chrome-extension://") || 
            url.startsWith("chrome://") ||
            details.type !== "main_frame") {          
            return;
        }

        let hostname;
        try {
            hostname = new URL(url).hostname;
        } catch (e) { return; }

        // Skip Whitelisted Domains
        if (allowedDomains.has(hostname)) {
            return;
        }

        // Call checkURL (Now connects to Python Backend)
        checkURL(url).then(reasons => {
            if (reasons.length > 0) {
                console.log(`BLOCKED: ${url}`);
                const warningPage = chrome.runtime.getURL('warning.html') + 
                    `?url=${encodeURIComponent(url)}&reasons=${encodeURIComponent(reasons.join(','))}`;
                chrome.tabs.update(details.tabId, { url: warningPage });
            } else {
                // If Safe, add to whitelist to save requests next time
                addToWhitelist(hostname);
            }
        });
    },
    { urls: ["<all_urls>"] }
);