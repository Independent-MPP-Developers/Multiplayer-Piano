/*
    Written by MajorH#6304 - 09 / 06 / 2021
    Script handles majority of direct messaging.
*/

const exportPromise = new Promise(Construct);

async function Construct(resolve) {
    do {
        await new Promise((resolve) => {
            setTimeout(_ => resolve(true), 1000);
        });
    } while (!window.MPPE);

    function sendDM() {
        if (MPPE.authenticated) {

        };
    };

    function sendGroupMessage() {

    };

};

export default exportPromise;