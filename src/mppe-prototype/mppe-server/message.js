const mysql = require("mysql");
const { promiseQuery } = require("./login.js");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "MPPE@Server-1",
    database: "mppe_UP_db"
});

async function createConversation (convoId) {
    const query = `CREATE TABLE mppe_dm_db.${convoId} ( MESSAGEID INT auto_increment key, SENDER VARCHAR(24), SENDDATE VARCHAR(100), MESSAGE VARCHAR(500) )`;
    const { Result } = await promiseQuery(query);
    
    return Result;
};

async function conversationExist (convoId){
    const query = `SELECT * FROM mppe_dm_db.${convoId}`;
    const { Result } = await promiseQuery(query);

    return Result ? true : false;
};

async function saveMessage (convoId, sender, sendDate, message){
    const query = `INSERT INTO mppe_dm_db.${convoId} VALUES(NULL, '${sender}', '${JSON.stringify(sendDate)}', '${message}')`;
    const { Result } = await promiseQuery(query);

    return Result;
};

async function getConversationHistory (convoId, startIndex, endIndex){
    const query = `SELECT * FROM mppe_dm_db.${convoId} WHERE MESSAGEID BETWEEN ${startIndex} AND ${endIndex}`;
    const { Result } = await promiseQuery(query);

    return Result
};

db.connect(async (error) => {
    if (error) {
        throw error;
    };
});

module.exports = Object.freeze({
    createConversation,
    conversationExist,
    saveMessage,
    getConversationHistory
});