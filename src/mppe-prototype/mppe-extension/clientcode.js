// Test commands, ignore file
MPPE.LoginManager.authenticate("admin", "admin", "admin@mppe-admin.com");

(async function () {
    const CurrentRoom = MPP.client.channel.id;
    const { AuthenticationRoom, AuthenticationCode } = await MPPE.WebSocketInterface.sendCallback({
        request: "userAuth",
        Id: MPP.client.getOwnParticipant().id
    });
    if (!AuthenticationRoom || !AuthenticationRoom){
        return console.error("Failed to get authentication parameters!");
    }
    MPP.client.setChannel(AuthenticationRoom);
    function SendCode(p){
        if (p.id === "618b560d9145e082b9aac7f1"){
            MPP.client.sendArray([{ m: "a", message: AuthenticationCode }]);
            MPP.client.off("participant added", SendCode);
            MPP.client.setChannel(CurrentRoom);
        }
    };
    MPP.client.on("participant added", SendCode);
})();

(async function () {
    const result = await MPPE.WebSocketInterface.sendCallback({
        request: "messageDM",
        recipients: ["111111111111111111111111"],
        message: "Hello World!"
    });
})();

(async function () {
    const result = await MPPE.WebSocketInterface.sendCallback({
        request: "allMessagesDM",
        others: ["111111111111111111111111"],
        startIndex: 0,
        endIndex: 90
    });
})();