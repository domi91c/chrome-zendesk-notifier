chrome.runtime.connect();

var bg = chrome.extension.getBackgroundPage();

var view;

window.onload = function() {

    checkboxInterval = document.getElementById('checkbox-interval');
    inputInterval = document.getElementById('input-interval');
    inputDomain = document.getElementById('input-domain');
    inputViewID = document.getElementById('input-viewid');
    checkboxShowErrors = document.getElementById('checkbox-showerror');

    view = {
        enabled: null,
        interval: null,
        zendeskDomain: null,
        viewID: null,
        showErrors: null,

        load: function() {
            checkboxInterval.checked = bg.settings.enabled;
            inputInterval.value = bg.settings.interval;
            inputDomain.value = bg.settings.zendeskDomain;
            inputViewID.value = bg.settings.viewID;
            checkboxShowErrors.checked = bg.settings.showErrors;
        },
        update: function() {
            // get new values from form and push to settings
            enable_transition();
            bg.settings.enabled = checkboxInterval.checked;
            bg.settings.interval = inputInterval.value;
            bg.settings.zendeskDomain = inputDomain.value;
            bg.settings.viewID = inputViewID.value;
            bg.settings.showErrors = checkboxShowErrors.checked;

        },
    }

    view.load();


    // detect when form changes
    var forms = [
        'input-interval',
        'input-domain',
        'input-viewid',

    ]

    var checkboxes = [
        'checkbox-interval',
        'checkbox-showerror'
    ]

    for (var i = 0; i < forms.length; i++) {
        document.getElementById(forms[i]).oninput = function() {
            view.update();
        };
    }
    for (var i = 0; i < checkboxes.length; i++) {
        document.getElementById(checkboxes[i]).onchange = function() {
            view.update();
        };
    }

    function enable_transition() {
        document.getElementById('interval-switch').style.WebkitTransition = 'margin-left 0.15s ease-in-out';
    }

}
