// ! async function (window) {
//     do {
//         await new Promise((resolve) => setTimeout(resolve, 100));
//     } while(!("MPPE" in window) || !("$" in window));

//     const { MPPE, $ } = window;
//     console.log($)
//     function center (){

//     };

//     function dialog ({ header, innerText, buttons, center }){
//         const prompt = $('<div class="dialog" style="width: 400px; height: 400px; text-align: center;"></div>');
//         const buttonContainer = $('<div style="display: flex; justify-content: center;"></div>');
//         const relative = $(".relative");


//         if (center){
//             prompt.toggleClass("center");
//         };
//         prompt.text(header);


//         for (let i = 0 ; i < buttons.length ; i++){
//             const buttonName = buttons[i]
//             const button = $(`<div class="ugly-button" id="${buttonName}">${buttonName}</div>`);

//             prompt.append(button);
//         };

//         relative.append(prompt);
//     };

//     dialog({
//         header: "Get into MPPE",
//         innerText: "Login to the MPP Extension to use it!",
//         buttons: ["Login / Signup"]
//     })

//     window.onresize = center;

// } (window)