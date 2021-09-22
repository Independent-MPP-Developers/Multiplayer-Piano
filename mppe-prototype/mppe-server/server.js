const WebSocket = require("ws");
const Base64 = require("base-64");
const MultiplayerPiano = require("mpp-client-xt");
const sqlstring = require("sqlstring");
const fs = require("fs");

const Authenticator = require("./login.js");
const Validator = require("./validate.js");
const Friendor = require("./friends.js");
const Messengor = require("./message.js");

const BannedIps = [];

const WebSocketServer = new WebSocket.Server({
    port: "8080",
    verifyClient: (ConnectionData, AcceptStatus) => {
        let Ip = ConnectionData.req.socket.remoteAddress.split(":");
        Ip = Ip[Ip.length - 1];

        const BanStatus = BannedIps.indexOf(Ip) === -1;

        AcceptStatus(BanStatus, 403, "This IP has been permanently banned by Admin from accessing this WebSocket connection.");
    }
});
const WebSocketInterfaceServer = new WebSocket.Server({
    port: "7070",
});

const ConnectedClients = {};
const OnlineUsers = {};

let WebSocketInterface;

function ParseMessage(Input) {
    let parsed;
    try {
        parsed = JSON.parse(Input);
    } catch (e) { console.log("ParsedMessage: Invalid input recieved to parse message: ", Input); };

    return parsed;
};

function AuthenticateId(AuthenticationRoom, ExpectedAuthCode, ExpectedUserId) {
    const MultiplayerPianoClient = new MultiplayerPiano();
    MultiplayerPianoClient.desiredChannelSettings = { visible: false };

    const VerificationPromise = new Promise((resolve) => {
        MultiplayerPianoClient.setChannel(AuthenticationRoom);
        MultiplayerPianoClient.start();
        MultiplayerPianoClient.on("a", ({ a: AuthenticationCode, p: PlayerDetails }) => {
            const { id } = PlayerDetails;
            if (id === ExpectedUserId && ExpectedAuthCode === AuthenticationCode) {
                MultiplayerPianoClient.stop();
                console.log(`AuthenticateId: User @${ExpectedUserId}'s identity has been verified.`);
                resolve({ Verified: true, PlayerObject: PlayerDetails });
            };
        });
    });

    const Timeout = 15 * 1000; // Stop verification after 15 seconds.
    const TimeoutPromise = new Promise((resolve) => {
        const TimeoutWait = setTimeout(_ => {
            MultiplayerPianoClient.stop();
            clearTimeout(TimeoutWait);
            resolve({ Verified: false });
        }, Timeout);
    });

    return Promise.race([TimeoutPromise, VerificationPromise]);
};

function UnloadClients(Websocket, Clients) {
    for (const IpAddress in Clients) {
        const { ClientObject } = Clients[IpAddress];
        try {
            Websocket.send(JSON.stringify({
                Command: "newClient",
                IpAddress: IpAddress,
                ConnectTime: ClientObject.ConnectTime,
                PacketsSent: 0,
                PacketsReceived: 0,
                IsConnected: true
            }));
        } catch (e) { console.log(`UnloadClients: Failed to send client @${IpAddress} to interface.`) };
    };
};

function SendData(Websocket, Data) {
    const SendingPayload = {
        Key: "mppewebsocket",
        ...Data
    };

    SendingPayload.Events ||= [];
    SendingPayload.Type ||= "default";
    SendingPayload.CallbackId ||= 0;

    try {
        Websocket.send(JSON.stringify(SendingPayload));
    } catch (e) { console.log(`WebsocketSend: Failed to send data to client @${Websocket.ClientObject.IpAddress}.`); };
};

function OnlineUser(userConnection) {
    const { ClientObject } = userConnection;
    const { UserId, FriendUsers } = ClientObject.UserInfo;

    if (UserId !== "000000000000000000000000") {
        console.log(`OnlineUser: User @${UserId} is now online!`);
        OnlineUsers[UserId] = userConnection;
        for (const userid of FriendUsers) {
            const FriendOnline = OnlineUsers[userid];
            if (FriendOnline) {
                SendData(FriendOnline, { Events: ["playerOnline"], Payload: { UserId } });
            };
        };
    };

};

function OfflineUser(ClientObject) {
    const { UserId, FriendUsers } = ClientObject.UserInfo;
    delete OnlineUsers[UserId];

    console.log(`OnlineUser: User @${UserId || "Unknown"} is now offline!`);
    for (const userid of FriendUsers) {
        const FriendOnline = OnlineUsers[userid];
        if (FriendOnline) {
            SendData(FriendOnline, { Events: ["playerOffline"], Payload: { UserId } });
        };
    };
};

function GetOrdered(UserArray) {
    const NumberedArray = [];
    for (let i = 0; i < UserArray.length; i++) {
        let StringByte = 0;
        const UserId = UserArray[i];
        for (let j = 0; j < UserId.length; j++) {
            StringByte += UserId[j].charCodeAt();
        };
        NumberedArray.push({ StringByte, UserId });
    };
    return NumberedArray.sort((a, b) => a.StringByte - b.StringByte).map(a => a.UserId);
};

async function IncomingRequest(Websocket, RequestData) {
    const { ClientObject } = Websocket;
    const AnalyzePacket = Validator.VALIDATE_PACKET(RequestData);

    if (!AnalyzePacket) {
        return { Error: true, Message: "Invalid request data." };
    };

    const { Key, Token, CallbackId, Data } = RequestData;
    const { request } = Data;

    const RequiredAuth = {
        userAuth: true,
        messageDM: true
    };

    if (request in RequiredAuth && !ClientObject.AuthToken) {
        return false;
    };

    if (Key !== "mppewebsocket") {
        return false;
    };

    let CallbackPayload;

    const ValidationFunction = Validator[request];

    if (!ValidationFunction) {
        return false;
    } else {
        const AnalysisResult = ValidationFunction(Data);
        if (!AnalysisResult) {
            return { message: "Invalid data in request." };
        };
    };

    switch (request) {
        case "getEncryptor":
            const encryptor = Authenticator.generateEncryptor(30);
            Websocket.encryptor = encryptor;
            CallbackPayload = { encryptor };
            break;
        case "authenticate":
            if (Websocket.encryptor) {
                const { username, password, email } = Data;
                const { Result } = await Authenticator.getUserObject(username);

                if (!Result) {
                    return { message: "Internal error." }; // Internal error.
                };

                const GenerateAuthToken = (size) => {
                    const authtoken = "mppe_AUTH-" + Authenticator.generateEncryptor(size, true);
                    Websocket.ClientObject.AuthToken = authtoken;
                    CallbackPayload = { authToken: authtoken };
                    return authtoken
                };

                const [existingUser] = Result;

                const decryptor = Authenticator.decrypt(Websocket.encryptor)
                const rawPassword = decryptor(Base64.decode(password));
                const hashed = Authenticator.hash(rawPassword);

                if (existingUser) {
                    if (hashed === existingUser.PASSWORD) {
                        if (email) return { message: "Account already exists. Did you mean to sign in?" };
                        const { data } = await Friendor.getUserObject(username);

                        if (!data) {
                            return { message: "Internal error." };
                        };

                        console.log(`Authenticate: Client @${ClientObject.IpAddress} has signed into an existing account.`);

                        Websocket.ClientObject.UserInfo = {
                            ...Websocket.ClientObject.UserInfo,
                            UserId: existingUser.USERID,
                            Color: existingUser.COLOR,
                            Name: existingUser.NAME,
                            Username: username,
                            FriendUsers: JSON.parse(data.FRIENDS),
                            BlockedUsers: JSON.parse(data.BLOCKED)
                        };

                        SendData(Websocket, { Events: ["requestUserData"], Payload: {} });
                        OnlineUser(Websocket);
                        GenerateAuthToken(50);
                    } else {
                        return { message: "Incorrect username or password." };
                    };
                } else {
                    if (!email) return { message: "Unknown account details." };
                    const { Success, Reason } = await Authenticator.createAccount({
                        IpAddress: ClientObject.IpAddress,
                        UserId: ClientObject.UserId || "000000000000000000000000",
                        Name: ClientObject.Name || "Anonymous",
                        Color: ClientObject.Color || "#FFFFFF",
                        Username: username,
                        Password: rawPassword,
                        Email: email
                    });
                    Websocket.ClientObject.UserInfo.Username = username;
                    if (Success) {
                        console.log(`Authenticate: Client @${ClientObject.IpAddress} has created account.`);

                        SendData(Websocket, { Events: ["requestUserData"], Payload: {} });
                        OnlineUser(Websocket);
                        GenerateAuthToken(50);
                    } else {
                        return { message: Reason || "Internal error." };
                    };

                };

            } else {
                return { message: "Password encryptor was never generated." };
            };
            break;
        case "userAuth":
            if (Websocket.UserAuth) {
                return false;
            };
            Websocket.UserAuth = true;

            const { Id } = Data;

            const AuthenticationCode = Authenticator.generateEncryptor(20, true);
            const AuthenticationRoom = "mppe-authroom_" + Authenticator.generateEncryptor(10, true);

            SendData(Websocket, {
                Type: "callback",
                CallbackId: CallbackId,
                Payload: { AuthenticationRoom, AuthenticationCode }
            });

            const { Verified, PlayerObject } = await AuthenticateId(AuthenticationRoom, AuthenticationCode, Id);

            Websocket.UserAuth = false;

            if (Verified) {
                const { _id, name, color, id } = PlayerObject;
                Websocket.ClientObject.UserInfo.UserId = id;
                Websocket.ClientObject.UserInfo.User_Id = _id;
                Websocket.ClientObject.UserInfo.Color = color;
                Websocket.ClientObject.UserInfo.Name = name;
                Authenticator.editUserObject(Websocket.ClientObject.UserInfo.Username, { COLOR: sqlstring.escape(color), USERID: sqlstring.escape(id), NAME: sqlstring.escape(name) });
                OnlineUser(Websocket);
            } else {
                return false;
            };
            break;
        case "messageDM":
            let { recipients, message } = Data;
            const { UserId, Username, FriendUsers } = Websocket.ClientObject.UserInfo;

            recipients = GetOrdered(recipients);
            recipients.push(UserId);

            const IsFriend = FriendUsers.length !== 0 && FriendUsers.indexOf(UserId) !== -1;
            const ConversationHash = Authenticator.hash(recipients.join(""));
            const ConvoExists = await Messengor.conversationExist(ConversationHash);

            if (!ConvoExists) {
                console.log(`MessageDM: Creating conversation hash: ${ConversationHash}`);
                await Messengor.createConversation(ConversationHash);
            };

            const Success = await Messengor.saveMessage(ConversationHash, UserId, new Date(), message);

            if (!Success) {
                CallbackPayload = { status: "notSent", message: "Internal error." };
                break;
            } else {
                if (!IsFriend) {
                    CallbackPayload = { status: "notFriend", message: "This message was sent however, the user needs to accept your friend request to respond." };
                } else {
                    CallbackPayload = { status: "sent" };
                };
            };

            break;
        case "allMessagesDM":
            const { other, startIndex, endIndex } = Data;

            const userid = Websocket.ClientObject.UserInfo.UserId;
            const convohash = Authenticator.hash(other + userid);
            const convoexists = await Messengor.conversationExist(convohash);

            if (!convoexists) {
                CallbackPayload = { message: "This conversation doesn't exist.", messages: [] };
                break;
            };

            const Messages = await Messengor.getConversationHistory(convohash, startIndex, endIndex);

            if (!Messages) {
                CallbackPayload = { message: "Internal error.", messages: [] };
            } else {
                CallbackPayload = { message: "OK", messages: Messages };
            };

            break;
        case "userset":
            const { name, color } = Data.values;

            Websocket.ClientObject.UserInfo.Color = color;
            Websocket.ClientObject.UserInfo.Name = name;

            const CopyInfo = Object.assign({}, Websocket.ClientObject.UserInfo);
            const PlayerFriends = Websocket.ClientObject.UserInfo.FriendUsers || [];

            CopyInfo.BlockedUsers = null;
            CopyInfo.FriendUsers = null;

            for (let i = 0; i < PlayerFriends.length; i++) {
                const OnlineFriend = OnlineUsers[PlayerFriends[i]];
                if (OnlineFriend) {
                    SendData(OnlineFriend, { Events: ["friendUserset"], Payload: { UserData: CopyInfo } });
                };
            };

            Authenticator.editUserObject(Websocket.ClientObject.UserInfo.Username, { COLOR: sqlstring.escape(color), USERID: sqlstring.escape(CopyInfo.UserId), NAME: sqlstring.escape(name) });
            console.log(`UserSet: User @${CopyInfo.UserId} has changed user info.`);
            break;
    };

    if (CallbackPayload) {
        SendData(Websocket, { Type: "callback", Payload: CallbackPayload, CallbackId: CallbackId });
    };

    return true;
};


function WebSocketConnection(Connection, Request) {
    const RawIp = Request.socket.remoteAddress.split(":");
    const ClientObject = {
        IpAddress: RawIp[RawIp.length - 1],
        ConnectTime: new Date(),
        AuthToken: null,
        UserInfo: {
            Username: null,
            UserId: null,
            User_Id: null,
            Color: null,
            Name: null,
            Room: null,
            BlockedUsers: [],
            FriendUsers: []
        },
    };
    console.log(`WebsocketConnect: Client @${ClientObject.IpAddress} has connected!`);
    WebSocketServer.pin
    Connection.ClientObject = ClientObject;
    ConnectedClients[ClientObject.IpAddress] = Connection;

    if (WebSocketInterface) {
        UnloadClients(WebSocketInterface, { [ClientObject.IpAddress]: Connection })
    };

    Connection.on("message", async function WebsocketMessage(Data) {
        const ParsedMessage = ParseMessage(Data);
        if (ParsedMessage) {
            const { CallbackId } = ParsedMessage;
            const Result = await IncomingRequest(Connection, ParsedMessage);

            if (typeof Result === "boolean" && !Result && CallbackId) {
                SendData(Connection, { Type: "callback", CallbackId: CallbackId, Payload: { Error: true } });
            } else if (typeof Result === "object" && CallbackId) {
                SendData(Connection, { Type: "callback", CallbackId: CallbackId, Payload: Result })
            };
        } else {
            Connection.close();
        };
    });

    Connection.on("close", function WebSocketClose() {
        console.log(`WebsocketDisconnect: Client @${ClientObject.IpAddress} has disconnected!`);

        delete ConnectedClients[ClientObject.IpAddress];
        OfflineUser(Connection.ClientObject);

        if (WebSocketInterface) {
            WebSocketInterface.send(JSON.stringify({
                Command: "removeClient",
                Target: ClientObject.IpAddress
            }));
        };
    });
    Connection.on("error", function WebSocketError(Error) {
        console.log(`WebSocketError: Client @${ClientObject.IpAddress} experienced a fatal error!`);
    });
};

WebSocketServer.on("connection", WebSocketConnection);

/* WEBSOCKET SERVER INTERFACE CODE */

WebSocketInterfaceServer.on("connection", function WebSocketInterfaceConnection(Interface) {
    UnloadClients(Interface, ConnectedClients);

    WebSocketInterface = Interface;
    Interface.on("message", function WebSocketInterfaceCommand(CommandObject) {
        CommandObject = JSON.parse(CommandObject);
        const { Target } = CommandObject;
        const TargetConnection = ConnectedClients[Target];
        try {
            TargetConnection.send(JSON.stringify({
                ServerSideDisconnection: "localhost:7070",
                Message: "Your connection was terminated by Admin."
            }));
        } catch (e) { console.log(`InterfaceDisconnect: Failed to send disconnect message to client @${Target}.`) }
        TargetConnection.terminate();
        console.log(`InterfaceDisconnect: Admin has disconnected client: ${Target}.`);

    });
    Interface.on("close", function WebSocketDisconnectInterface() {
        WebSocketInterface = null;
    });
});

/* WEBSOCKET SERVER INTERFACE CODE */