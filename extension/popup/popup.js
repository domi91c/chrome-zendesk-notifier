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
            this.enabled = bg.settings.enabled;
            this.interval = bg.settings.interval;
            this.zendeskDomain = bg.settings.zendeskDomain;
            this.viewID = bg.settings.viewID;
            this.showErrors = bg.settings.showErrors;
        },
        update: function() {
            // get new values from form and push to settings
            this.enabled = checkboxInterval.checked;
            this.interval = inputInterval.value;
            this.zendeskDomain = inputDomain.value;
            this.viewID = inputViewID.value;
            this.showErrors = checkboxShowErrors.checked;

        },
        updateUI: function() {
            checkboxInterval.checked = this.enabled;
            inputInterval.value = this.interval;
            inputDomain.value = this.zendeskDomain;
            inputViewID.value = this.viewID
            checkboxShowErrors.checked = this.showErrors;
        }
    }

    view.load();
    view.updateUI();



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
}
