window.MPPE = {
    WebSocket: new window.WebSocket("ws://localhost:8080/"),
    _internals: { SEND_CALLBACKS: {} }
};

let { WebSocket } = MPPE;

function sendData(object, id) {
    const { authToken } = MPPE
    const isReady = WebSocket && WebSocket.readyState === 1;
    if (isReady) {
        const packet = {
            Key: "mppewebsocket",
            Token: authToken || null,
            CallbackId: id || null,
            Data: object || {},
        };
        const string = JSON.stringify(packet);
        try {
            WebSocket.send(string);
        } catch (e) {
            console.log(e);
            return false;
        };
    };
    return true;
};

function sendCallback(object) {
    const returnPromise = new Promise(async (resolve, reject) => {
        const { SEND_CALLBACKS } = MPPE._internals;
        let unique;
        do {
            unique = Math.floor(new Date().getUTCMilliseconds() * (Math.random() * 10000));
        } while (unique in SEND_CALLBACKS);

        SEND_CALLBACKS[unique] = { responded: false, data: null, creation: new Date() };
        const result = sendData(object, unique);

        if (result) {
            while (!SEND_CALLBACKS[unique]?.responded) {
                await new Promise((resolve) => setTimeout(_ => resolve(true), 100));
                if (!SEND_CALLBACKS[unique]) {
                    reject(false);
                    return;
                };
            };
            const { data: serverResponse } = SEND_CALLBACKS[unique];
            delete SEND_CALLBACKS[unique];
            resolve(serverResponse);
        } else {
            delete SEND_CALLBACKS[unique];
            reject(false);
        };

    });
    return returnPromise;
};

function sockData({ data }) {
    console.log("WEBSOCKMESSAGE: ", JSON.parse(data))
    const { Type, Payload, Events, CallbackId } = JSON.parse(data);
    for (const event of Events) {
        const eventObject = new CustomEvent(event, { detail: Payload });
        dispatchEvent(eventObject);
    };
    if (Type === "callback") {
        const { SEND_CALLBACKS } = MPPE._internals;
        const awaitObject = SEND_CALLBACKS[CallbackId];
        if (awaitObject) {
            SEND_CALLBACKS[CallbackId].data = Payload;
            SEND_CALLBACKS[CallbackId].responded = true;
        };
    };
};

function addListeners() {
    WebSocket.onopen = sockOpen;
    WebSocket.onclose = sockClose;
    WebSocket.onmessage = sockData;
    WebSocket.onerror = _ => { };
};

function sockOpen() {
    const openEvent = new CustomEvent("sockConnection");
    dispatchEvent(openEvent);
};

function sockClose() {
    const closeEvent = new CustomEvent("sockDisconnection");
    dispatchEvent(closeEvent);

    const { SEND_CALLBACKS } = MPPE._internals;
    for (const id in SEND_CALLBACKS) {
        delete SEND_CALLBACKS[id];
    }

    MPPE.WebSocket = new window.WebSocket("ws://localhost:8080/");
    WebSocket = MPPE.WebSocket;
    addListeners();
};

addListeners();

const websocketInterface = Object.freeze({
    sendCallback,
    sendData
});

export default websocketInterface;
