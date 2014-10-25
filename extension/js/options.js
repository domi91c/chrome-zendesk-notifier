chrome.runtime.connect();

var bg = chrome.extension.getBackgroundPage();
var controller;

window.onload = function() {

    checkboxInterval = document.getElementById('checkbox-interval');
    // inputInterval = document.getElementById('input-interval');
    inputDomain = document.getElementById('input-domain');
    inputViewID = document.getElementById('input-viewid');
    checkboxShowErrors = document.getElementById('checkbox-showerror');
    checkNowButton = document.getElementById('checknow');

    controller = {

        load: function() {
            checkboxInterval.checked = bg.settings.showNotifications;
            // inputInterval.value = bg.settings.interval;
            inputDomain.value = bg.settings.zendeskDomain;
            inputViewID.value = bg.settings.viewID;
            checkboxShowErrors.checked = bg.settings.showErrors;

            // if (bg.settings.showNotifications === false) {
            //     inputInterval.disabled = true;
            // } else {
            //     inputInterval.disabled = false;
            // }
        },
        update: function() {
            // get new values from form and push to settings
            enable_transition();
            bg.settings.showNotifications = checkboxInterval.checked;
            // bg.settings.interval = parse_interval(inputInterval.value);
            bg.settings.zendeskDomain = inputDomain.value;
            bg.settings.viewID = parse_viewID(inputViewID.value);
            bg.settings.showErrors = checkboxShowErrors.checked;

            this.load();
            bg.update_icon();
            bg.badge_icon();
            bg.autoCheck();

            bg.settings.save();
        },
    };

    function enable_transition() {

        document.getElementById('interval-switch').style.WebkitTransition = 'margin-left 0.15s ease-in-out';
    }

    function parse_interval(interval) { // DEPRECIATED

        console.error('Use of depreciated function "parse_interval()"');

        if (interval.length > 2) {
            interval = interval.substring(0, 2);
        }
        if (isNaN(interval)) {
            interval = 1;
        }
        return interval;
    }

    function parse_viewID(viewID) {

        if (isNaN(viewID)) {
            viewID = null;
        }
        return viewID;
    }


    controller.load();

    // detect when form changes
    var forms = [
        // 'input-interval',
        'input-domain',
        'input-viewid',
    ];

    var checkboxes = [
        'checkbox-interval',
        'checkbox-showerror'
    ];

    var i;

    for (i = 0; i < forms.length; i++) {
        document.getElementById(forms[i]).oninput = function() {
            controller.update();
        };
    }
    for (i = 0; i < checkboxes.length; i++) {
        document.getElementById(checkboxes[i]).onchange = function() {
            controller.update();
        };
    }

    checkNowButton.onclick = function() {
        bg.doRequestInvoked();
    };

};
