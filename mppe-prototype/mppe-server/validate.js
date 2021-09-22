const ajv = new (require("ajv"));
const BANNED_PASSWORD_CHARS = / -=.,\//;
const VALID_EMAIL = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
const VALID_COLOR = /^#(?:[0-9a-fA-F]{3}){1,2}$/i;

const packetValidators = {
    defaultPacket: {
        type: "object",
        properties: {
            Key: { type: "string" },
            Token: { type: ["string", "null"] },
            CallbackId: { type: ["number", "null"] },
            Data: {
                type: "object",
                properties: {
                    request: { type: "string" }
                },
                required: ["request"],
                additionalProperties: true
            },
        },
        required: ["Key", "Token", "CallbackId", "Data"],
        additionalProperties: false
    },
    authenticatePacket: {
        type: "object",
        properties: {
            request: { type: "string" },
            username: {
                type: "string",
                minLength: 1,
                maxLength: 20
            },
            password: {
                type: "string"
            },
            email: {
                type: ["string", "null"],
                pattern: VALID_EMAIL.source
            }
        },
        required: ["username", "password"],
        additionalProperties: false
    },
    userAuthPacket: {
        type: "object",
        properties: {
            request: { type: "string" },
            Id: { type: "string", minLength: 24, maxLength: 24 }
        },
        required: ["Id"],
        additionalProperties: false
    },
    dmPacket: {
        type: "object",
        properties: {
            request: { type: "string" },
            recipients: { type: "array", maxItems: 10, minItems: 1 },
            message: { type: "string", maxLength: 500 }
        },
        required: ["recipient", "message"],
        additionalProperties: false
    },
    totalDmPacket: {
        type: "object",
        properties: {
            request: { type: "string" },
            others: { type: "array", maxItems: 10, minItems: 1 },
            startIndex: { type: "number", minimum: 0 },
            endIndex: { type: "number", minimum: 0 }
        },
        required: [],
        additionalProperties: false
    },
    usersetPacket: {
        type: "object",
        properties: {
            request: { type: "string" },
            values: {
                type: "object",
                properties: {
                    name: { type: "string", maxLength: 40, minLength: 1 },
                    color: { type: "string", maxLength: 7, minLength: 7, pattern: VALID_COLOR.source }
                },
                required: ["name", "color"],
                additionalProperties: false
            }
        },
        required: ["values"],
        additionalProperties: false
    }
}

const Validator = {
    VALIDATE_PACKET: (Packet) => {
        const v = ajv.compile(packetValidators.defaultPacket);
        return v(Packet);
    },
    getEncryptor: (Packet) => {
        return true;
    },
    authenticate: (Packet) => {
        const v = ajv.compile(packetValidators.authenticatePacket);
        return v(Packet);
    },
    messageDM: (Packet) => {
        const v = ajv.compile(packetValidators.dmPacket);
        return v(Packet);
    },
    userAuth: (Packet) => {
        const v = ajv.compile(packetValidators.userAuthPacket);
        return v(Packet);
    },
    allMessagesDM: (Packet) => {
        const v = ajv.compile(packetValidators.totalDmPacket);
        return v(Packet) && Packet.endIndex - Packet.startIndex <= 100;
    },
    userset: (Packet) => {
        const v = ajv.compile(packetValidators.usersetPacket);
        return v(Packet);
    }
};

module.exports = Validator;