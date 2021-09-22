const mysql = require("mysql");
const shajs = require("sha.js");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "MPPE@Server-1",
    database: "mppe_UP_db"
});

function hash(input) {
    const hasher = shajs("sha256");
    const result = hasher.update(input).digest("hex");
    return result
};

function promiseQuery(query) {
    const returnPromise = new Promise((resolve) => {
        db.query(query, (error, result) => {
            resolve({
                Failure: error ? true : false,
                Error: error ? error : null,
                Result: result || null
            });
        });
    });
    return returnPromise;
};

function decrypt(r) {
    const a = a => (r => r.split("").map(r => r.charCodeAt(0)))(r).reduce((r, a) => r ^ a, a);
    return r => r.match(/.{1,2}/g).map(r => parseInt(r, 16)).map(a).map(r => String.fromCharCode(r)).join("")
};

async function ipOwnedAccounts(ipAddress) {
    const query = `SELECT * from mppe_up_db.user WHERE LASTIP = '${ipAddress}'`;
    const result = await promiseQuery(query);

    return result
};

async function getUserObject(username) {
    const query = `SELECT * from mppe_up_db.user WHERE USERNAME = '${username}'`;
    const queryResult = await promiseQuery(query);

    return queryResult;
};

async function editUserObject(username, editParameters) {
    let set = [];
    for (const property in editParameters){
        const value = editParameters[property];
        set.push(`${property} = ${value}`);
    };
    set = set.join(", ");

    const query = `UPDATE mppe_up_db.user SET ${set} WHERE USERNAME = '${username}'`;

    const queryResult = await promiseQuery(query);

    return queryResult;
}

function generateEncryptor(size, limited) {
    const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890" + (limited ? "" : "!@#$%^&*()-=+");
    let returnStr = "";
    for (let i = 0; i < size; i++) {
        const randomInt = Math.floor(Math.random() * (characters.length - 0) + 0);
        const randomChar = characters[randomInt];
        returnStr += randomChar;
    };
    return returnStr;
};

async function canMakeAccount(ipAddress, username, email) {
    const accountQuery = `SELECT * from mppe_up_db.user WHERE USERNAME = '${username}' or EMAIL = '${email}'`;
    const hasAccount = await promiseQuery(accountQuery);

    if (!hasAccount.Result) {
        return false;
    };

    if (hasAccount.Result.length !== 0) {
        return false;
    };

    const ipQuery = `SELECT * from mppe_up_db.user WHERE LASTIP = '${ipAddress}'`
    const ipAccounts = await promiseQuery(ipQuery);

    if (!ipQuery) {
        return false;
    };

    if (ipAccounts.Result.length >= 10) {
        return false
    };

    return true;
};

async function createAccount({ IpAddress, Username, Password, UserId, Color, Name, Email, }, isAdmin) {
    const error = { Failure: true, Reason: "Multiple accounts found with this username or email." };

    const cipher = generateEncryptor(30);
    const hashedPassword = hash(Password);
    const accountQuery = `CALL mppe_up_db.CREATE_USER('${UserId}', '${Username}', '${hashedPassword}', '${Color}', '${Name}', '${IpAddress}', '${Email}', '${cipher}'` + (isAdmin ? ", 2);" : ", 1);");

    const canMake = await canMakeAccount(IpAddress, Username, Email);

    if (!canMake) {
        return error;
    };

    const { Failure, Error, Result } = await promiseQuery(accountQuery);

    if (!Result) {
        console.log(`@${IpAddress} Failed to generate account: `, Error)
        return {
            Failure: true,
            Reason: "Internal Server Error!"
        }
    };

    return { Success: true };
};

db.connect(async (error) => {
    if (error) {
        throw error;
    };
})

module.exports = Object.freeze({
    createAccount,
    getUserObject,
    canMakeAccount,
    ipOwnedAccounts,
    generateEncryptor,
    decrypt,
    hash,
    editUserObject,
    promiseQuery
});