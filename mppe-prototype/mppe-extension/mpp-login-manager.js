const exportPromise = new Promise(Construct);

async function Construct(resolve, reject) {
    do {
        await new Promise((resolve) => setTimeout(resolve, 100));
    } while (!window?.MPPE?.WebSocketInterface);

    const { MPPE } = window;
    const { sendCallback, sendData } = MPPE.WebSocketInterface;

    function encrypt(t) {
        const r = t => t.split("").map(t => t.charCodeAt(0)),
            p = t => ("0" + Number(t).toString(16)).substr(-2),
            e = p => r(t).reduce((t, r) => t ^ r, p);
        return t => t.split("").map(r).map(e).map(p).join("")
    };

    async function authenticate(username, password, email) {
        if (MPPE.authenticated) {
            signOut(true);
        };

        let { encryptor: encryptionSalt, message: failure } = await sendCallback({ request: "getEncryptor" });
        
        if (failure) return failure;

        const encryptor = encrypt(encryptionSalt);
        password = btoa(encryptor(password));

        let { authToken, message: Failure } = await sendCallback({
            request: "authenticate",
            username: username,
            password: password,
            email: email || null
        });

        if (Failure) return Failure;

        if (authToken) {
            MPPE.authToken = authToken;
            MPPE.authenticated = true;
            dispatchEvent(new CustomEvent("signIn", { detail: { username, email: email || null } }));
        };
        
        return // Return undefined on success!
    };
    
    function signOut(internal) {
        const confirmed = internal || confirm("MPPE: Are you sure you want to signout?");
        if (confirmed) {
            MPPE.authenticated = false;
            MPPE.authToken = null;
            sendData({ request: "signOut" });
            dispatchEvent(new CustomEvent("signOut"));
        };
    };

    const LoginManager = Object.freeze({
        authenticate,
        Name: "LoginManager"
    });

    resolve(LoginManager);
};

export default exportPromise;