const exportPromise = new Promise(Construct);

async function Construct(resolve, reject) {
    do {
        await new Promise((resolve) => setTimeout(resolve, 100));
    } while (!window?.MPPE?.WebSocketInterface);

    const { MPPE } = window;
    const { sendData, sendCallback } = MPPE.WebSocketInterface;

    function getFriend(userId) {
        const { friendsList: list } = this;
        for (let i = 0; i < list.length; i++) {
            const friendObject = list[i];
            const { userId: id } = list[i];
            if (id === userId) {
                return friendObject
            }
        };
        return null;
    };

    async function updateList() {
        const serverList = await sendCallback({
            request: "friendsList"
        })

        const { serverSaveTime } = serverList;
        const { lastUpdated, friendsList } = this;

        const latest = serverSaveTime > lastUpdated ? serverList : friendsList.length === 0 ? serverList : friendsList
        this.friendsList = latest;

        return latest;
    };

    function addFriend({ _id, id, color, name }) {
        if (getFriend(id)) {
            return;
        };

        const list = JSON.parse(localStorage.getItem(localStorageToken)) || [];
        const friendObject = {
            timeAdded: new Date(),
            userId: id,
            user_Id: _id,
            color,
            name
        };

        list.push(friendObject);
        const stringified = JSON.stringify(list);
        localStorage.setItem(localStorageToken, stringified);

        setState(id, true);
    };

    function removeFriend({ id }) {
        const list = JSON.parse(localStorage.getItem(localStorageToken)) || [];
        for (let i = 0; i < list.length; i++) {
            const { userId } = list[i];
            if (userId === id) {
                list.splice(i, 1);
                const stringified = JSON.stringify(list);
                localStorage.setItem(localStorageToken, stringified);
                return;
            };
        };
        setState(id, false);
    };

    function clearFriends() {
        const confirmed = confirm("Are you sure you want to clear all your friends?! This action is irreversible.");
        if (confirmed) {
            localStorage.setItem(localStorageToken, JSON.stringify([]));
            updateRoom();
        };
    };

    function setState(userId, isFriended) {
        const MPP = window.MPP;
        const ppl = MPP?.client?.ppl
        if (!MPP || !ppl) {
            return;
        };

        const user = ppl[userId];
        const color = isFriended ? "lime" : "white";
        const friendPrefix = " \\(Friend\\)";

        if (user) {
            const { nameDiv, cursorDiv } = user;
            const [nameCursor] = cursorDiv.querySelector(".name");
            const [nameText] = nameDiv.querySelector(".nameText");

            if (nameCursor && nameText) {
                [nameCursor, nameText].forEach(elem => {
                    const currentlyFriended = elem.style.color === "lime";
                    // Remove friend tag if we are adding them as a friend

                    if (currentlyFriended && !isFriended) {
                        const innerText = elem.innerText;
                        let lastIndex = innerText.lastIndexOf(friendPrefix);
                        if (lastIndex !== -1) {
                            const result = innerText.replace(RegExp(friendPrefix, "g"), (string, index) => {
                                if (index - 1 === lastIndex) {
                                    return ""; // basically get the last index of the " (friend)" string and replace it
                                };
                                return string;
                            });
                            elem.innerText = result;
                        };

                    } else if (isFriended && !currentlyFriended) {
                        elem.innerText += friendPrefix;
                    };

                });
                elem.style.color = color;
            };
        };
    };

    function updateRoom() {
        const MPP = window.MPP;
        const ppl = MPP?.client?.ppl
        if (!MPP || !ppl) {
            return false;
        };

        const { ppl: inRoom } = ppl;

        for (const userId in inRoom) {
            const friendObject = getFriend(userId);
            if (friendObject) {
                setState(id, true);
            };
        };

        return true;
    };

    const friendManager = {
        getFriend,
        addFriend,
        clearFriends,
        updateRoom,
        setState,
        removeFriend,
        lastUpdated: 0,
        Name: "FriendsManager"
    };

    resolve(friendManager);
}

export default exportPromise;