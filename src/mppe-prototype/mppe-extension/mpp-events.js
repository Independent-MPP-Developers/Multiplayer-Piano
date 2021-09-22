(async function (window) {
    const GLOBAL_EVENTS = [
        "directMessage",
        "playerOnline",
        "playerOffline",
        "gameRequest",
        "userLoaded",
        "serverError"
    ];

    do {
        await new Promise((resolve) => {
            setTimeout(_ => resolve(true), 1000);
            console.log(window.MPPE)
        });
    } while (!window.MPPE?.WebSocketInterface);

    const { sendCallback, sendData } = MPPE.WebSocketInterface;

    async function requestUserData() {
        const CurrentRoom = MPP.client.channel.id;
        const AuthenticateBot = "618b560d9145e082b9aac7f1";
        const { AuthenticationRoom, AuthenticationCode } = await sendCallback({
            request: "userAuth",
            Id: MPP.client.getOwnParticipant().id
        });
        if (!AuthenticationRoom || !AuthenticationRoom) {
            return console.error("Failed to get authentication parameters!");
        };
        MPP.client.setChannel(AuthenticationRoom);
        function SendCode(p) {
            if (p.id === AuthenticateBot) {
                MPP.client.sendArray([{ m: "a", message: AuthenticationCode }]);
                MPP.client.setChannel(CurrentRoom);
                MPP.client.off("participant added", SendCode);
            }
        };
        MPP.client.on("participant added", SendCode);
    };

    function signIn(evt) {
        const username = evt.detail.username;
        new MPP.Notification({
            title: "MPPE Extension",
            target: "#mppe-btn",
            html: `Signed In as, <a>${username}</a>.`,
            id: "mppe-sigin-notif",
            duration: 5000
        });
        $("#mppe-error-inputs").text("⠀");
        $("#mppe-email-input").val("");
        $("#mppe-username-input").val("");
        $("#mppe-password-input").val("");
        $(".bg").click();
    };

    function sockDisconnection() {
        MPPE.authenticated = null;
        MPPE.authToken = null;
        new MPP.Notification({ title: "MPPE Extension", target: "#mppe-btn", html: `<a>MPPE</a> has lost connection to the server!`, id: "mppe-sock-status", duration: 5000 });

    };

    /* # 1 script.js 2330 - 2355 - mppclone.com */
    (function () {
        function submit() {
            const set = { name: $("#rename input[name=name]").val(), color: $("#rename input[name=color]").val() }
            sendData({ request: "userset", values: set });
        };
        $("#rename .submit").click(submit);
        $("#rename .text[name=name]").keypress(evt => evt.keyCode === 13 || evt.keyCode === 27 ? (submit(), evt.preventDefault(), evt.stopPropagation()) : null);
    })();
    /* END # 1 */

    window.addEventListener("sockDisconnection", sockDisconnection);
    window.addEventListener("signIn", signIn);
    window.addEventListener("requestUserData", requestUserData);
})(window);