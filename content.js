browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getPageContent") {
        sendResponse({
            html: document.documentElement.outerHTML,
            url: window.location.href
        });
    }
});