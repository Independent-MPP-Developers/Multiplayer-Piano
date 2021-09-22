! async function () {
    do {
        await new Promise((resolve) => {
            setTimeout(_ => resolve(true), 1000);
        });
    } while (!window?.MPPE?.LoginManager);

    const { authenticate } = window.MPPE.LoginManager;

    const MPPE_HTML = {
        LOGIN_MODAL: '<div class="dialog mppe" style="display: none;height: 400px;text-align: -webkit-center;margin-top: -200px;" id="mppe-login"><div id="mppe-auth-load" style=" display: none; width: 100%; height: 100%; background-color: black; opacity: 0.4; position: absolute; margin-left: -10px; margin-top: -10px; text-align: center;"><span style="line-height: 428px;">LOADING</span></div><form><h8>MPPE Extension</h8><h5>_______________________</h5><p style="font-size: 16px;">Welcome to the MPPE extension! Please Sign In / Create Account to use.</p><p id="mppe-auth-mode">SIGN IN</p><p style="text-align-last: justify;"><label>Username: <input type="text" placeholder="Username" id="mppe-username-input"></label></p><p style="text-align-last: justify;"><label>Password: <input type="password" placeholder="Password" id="mppe-password-input"></label></p><p style="text-align-last: justify;"><label><span style="opacity: 0.4;" id="mppe-email-span">Email: </span><input type="text" placeholder="Email" id="mppe-email-input" disabled></label></p><span style="font-size: 13px;"><a>Forgot Password?</a><span> | </span><a>Forgot Username?</a></span><p style="font-size: 15px; color: red;" id="mppe-error-inputs">⠀</p><div class="ugly-button mppe" id="mppe-sign-up" style="width: 200px;font-size: 14px;margin-bottom: 12px; opacity: 0.4;">Sign Up</div><div class="ugly-button mppe" id="mppe-sign-in" style="width: 200px;font-size: 14px; opacity: 1;">Sign In</div></form></div>',
        MPPE_BTN: '<div id="mppe-btn" class="ugly-button mppe mppe-btn" style="text-align: center;width: 200px;left: 1157px;top: 15px;position: absolute;">MPPE Extension</div>',
        MPPE_WINDOW: '<div id="mppe-window" class="dialog" style="overflow: hidden scroll;visibility: visible;position: absolute;display: block;height: 400px;top: -319px;left: 1659px;text-align: center;font-size: 21px;z-index: 1;"><div style="""    background: rgba(0,0,0,0.6);    border: solid 7px transparent;"><span><a>Friends</a><span>     |     </span></span><span><a>Scripts</a><span>     |     </span></span><span><a>Settings</a></span></div><div><div class="mppe-message-div" style="background-color: rgb(80, 119, 8);margin-top: 10px;margin-bottom: 10px;border: solid 10px transparent;text-align: left;"><span style="    display: flex;"><div class="mppe-name" style="font-size: 20px;">Anonymous</div><div class="ugly-button" style="    text-align: center;    margin-left: auto;">Message</div></span><span style="display: flex;"><div class="mppe-username" style="font-size: 12px; color: #c3c3c3; cursor: pointer;">@MajorH5</div><div class="ugly-button" style="text-align: center;    margin-left: auto; margin-top: 10px;">Unfriend</div></span><div class="mppe-status" style="font-size: 12px; color: #c3c3c3;">Status: Offline</div><div class="mppe-last-seen" style="font-size: 12px; color: #c3c3c3;;">Last Seen: 3 days ago</div></div></div></div>'
    };

    $('#modals').append(MPPE_HTML.LOGIN_MODAL);
    $('.relative').append(MPPE_HTML.MPPE_BTN);
    // $(".relative").append(MPPE_HTML.MPPE_WINDOW);

    let mode = "Sign In";
    const mppeInputs = ["#mppe-username-input", "#mppe-password-input", "#mppe-email-input"];

    function toggleEmail(state) {
        const opacity = state ? "0.4" : "1";
        const toggled = state ? "" : null;

        $("#mppe-email-input").attr("disabled", toggled);
        $("#mppe-email-span").css("opacity", opacity);
    };

    function hasInputs(ignoreEmail) {
        let message = false;
        ["mppe-username-input", "mppe-password-input", "mppe-email-input"].forEach(id => {
            if (ignoreEmail && id === "mppe-email-input") return;
            if ($("#" + id).val().trim() === "") {
                message = "The " + id.split("-")[1] + " field is empty.";
            };
        });
        return message;
    };

    function getInputs() {
        return {
            email: $("#mppe-email-input").val(),
            password: $("#mppe-password-input").val(),
            username: $("#mppe-username-input").val()
        };
    };

    $('#mppe-sign-up').click(async _ => {
        if (mode === "Sign In") {
            mode = "Sign Up";
            $("#mppe-auth-mode").text("SIGN UP");
            toggleEmail(true);
            return;
        };

        const invalid = hasInputs();

        if (invalid) {
            $("#mppe-error-inputs").text("ERROR: " + invalid);
            return;
        } else {
            $("#mppe-error-inputs").text("⠀");
        };

        const inputs = getInputs();
        $("#mppe-auth-load").css("display", "block");
        const failure = await authenticate(inputs.username, inputs.password, inputs.email);
        $("#mppe-auth-load").css("display", "none");

        if (failure) {
            $("#mppe-error-inputs").text("ERROR: " + failure);
        };
    });

    $("#mppe-sign-in").click(async _ => {
        if (mode === "Sign Up") {
            mode = "Sign In";
            $("#mppe-auth-mode").text("SIGN IN");
            toggleEmail(false);
            return
        };

        const invalid = hasInputs(true);

        if (invalid) {
            $("#mppe-error-inputs").text("ERROR: " + invalid);
            return;
        } else {
            $("#mppe-error-inputs").text("⠀");
        };

        const inputs = getInputs();
        $("#mppe-auth-load").css("display", "block");
        const failure = await authenticate(inputs.username, inputs.password);
        $("#mppe-auth-load").css("display", "none");

        if (failure) {
            $("#mppe-error-inputs").text("ERROR: " + failure);
        };
    });

    ["#mppe-sign-in", "#mppe-sign-up"].forEach(id => {
        const other = $(id === "#mppe-sign-in" ? "#mppe-sign-up" : "#mppe-sign-in");
        const self = $(id);

        self.hover(_ => {
            self.css("opacity", "1");
            other.css("opacity", "0.4");
            toggleEmail(id === "#mppe-sign-in");
        });

        self.mouseleave(_ => {
            const state = mode === "Sign In";
            toggleEmail(state);
            if (state) {
                $("#mppe-sign-in").css("opacity", "1");
                $("#mppe-sign-up").css("opacity", "0.4");
            } else {
                $("#mppe-sign-up").css("opacity", "1");
                $("#mppe-sign-in").css("opacity", "0.4");
            };
        });
    });

    mppeInputs.forEach(id => {
        function focus() {
            $("#chat input").focus();
            $("#chat").toggleClass("chatting");
            $(id).off();
            $(id).focus();
            $(id).on("focus", focus);
        };

        $(id).on("focus", focus);
    });

    $("#mppe-btn").click(_ => {
        if (MPPE.authenticated) {

        } else {
            $("#modal #modals > *").hide();
            $("#modal").fadeIn(250);
            $("#mppe-login").show();
        };
    });
}()
export default {};