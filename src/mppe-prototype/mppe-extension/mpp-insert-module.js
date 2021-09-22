'use strict';

const insertScripts = [
    "mpp-main.js",
    "mpp-events.js"
].forEach(scriptName => {
    const script = document.createElement('script');
    script.setAttribute("type", "module");
    script.setAttribute("src", chrome.extension.getURL(scriptName));
    const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
    head.insertBefore(script, head.lastChild);
});


