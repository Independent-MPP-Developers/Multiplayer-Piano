const mysql = require("mysql");
const { promiseQuery } = require("./login.js");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "MPPE@Server-1",
    database: "mppe_UP_db"
});

async function getUserObject(username) {
    const query = `SELECT * FROM mppe_f_db.global_friends WHERE USERNAME = '${username}'`;
    let { Result } = await promiseQuery(query);

    if (!Result) {
        console.log(`GetFriendsList: Call to get friends list for @${username} failed. @RETURN 1`);
        return { error: true };
    };

    if (Result.length === 0) {
        const createQuery = `INSERT INTO mppe_f_db.global_friends VALUES('${username}', '[]', '[]')`;
        let { Result } = await promiseQuery(createQuery);

        if (!Result) {
            console.log(`GetFriendsList: Call to get friends list for @${username} failed. @RETURN 2`);
            return { error: true };
        };

        return { data: { FRIENDS: [], BLOCKED: [] } };
    };

    const [dataObject] = Result;

    return { data: { FRIENDS: dataObject.FRIENDS, BLOCKED: dataObject.BLOCKED } };
};

async function setUserProperty(username, property, newList) {
    newList = JSON.stringify(newList);
    const query = `UPDATE mppe_f_db.global_friends SET ${property} = '${newList}' WHERE USERNAME = ${username}`;
    const { Result } = await promiseQuery(query);

    if (!Result) {
        console.log(`SetUserProperty: Call to set user property failed for ${username} failed.`);
        return { error: true };
    };

    return { };
};

db.connect(async (error) => {
    if (error) {
        throw error;
    };
});

module.exports = Object.freeze({
    getUserObject,
    setUserProperty
});