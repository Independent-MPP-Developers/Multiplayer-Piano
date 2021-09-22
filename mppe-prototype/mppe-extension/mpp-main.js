/*
    Written by MajorH#6304 - 09 / 06 / 2021
    Creates MPPE object.
*/
import WebSocketInterface from './mpp-ws.js';

import FMP from './mpp-friend-manager.js';
import LMP from './mpp-login-manager.js';

import MPPE_HTML from './mpp-jshtml.js';

Object.defineProperties(MPPE, {
    _internals: { value: { SEND_CALLBACKS: { } }, enumerable: false, writable: true },
    WebSocketInterface: { value: WebSocketInterface, enumerable: true }
});

MPPE.prototype

Promise.all([FMP, LMP]).then(Managers => {
    for (const Manager of Managers) {
        const { Name } = Manager;
        MPPE[Name] = Manager;
    };
});

console.log(MPPE);