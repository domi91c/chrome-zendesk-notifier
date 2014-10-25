// =================
// Debug functions:

function printObj(object) {
    return JSON.stringify(object, null, 4);
}
// console.log = function(){};
// =================

var settings = {
    enabled: true,
    showNotifications: true,
    interval: 1,
    zendeskDomain: 'zendesk-domain',
    viewID: 12345678,
    showErrors: false,

    load: function() {
        var that = this;
        chrome.storage.local.get(null, function(loaded) {
            that.enabled = loaded.enabled;
            that.showNotifications = loaded.showNotifications;
            that.interval = loaded.interval;
            that.zendeskDomain = loaded.zendeskDomain;
            that.viewID = loaded.viewID;
            that.showErrors = loaded.showErrors;

            if (that.interval < 1) {
                that.interval = 1;
            }
            autoCheck();
            update_icon();
        });
    },
    getInterval: function() {
        if (this.interval < 1) {
            this.interval = 1;
        }
        return this.interval;
    },
    save: function() {
        chrome.storage.local.set({
            'enabled': this.enabled,
            'showNotifications': this.showNotifications,
            'interval': this.interval,
            'zendeskDomain': this.zendeskDomain,
            'viewID': this.viewID,
            'showErrors': this.showErrors
        });
        console.log("Settings saved");
    },
    clear: function() {
        chrome.storage.local.clear(function() {
            console.log('settings cleared');
        });
    }
};

var ticketsCurrent = [];
var ticketsPrevious = [];
var ticketsNew = [];
var ticketsExample = [{
            "url": "https://wdc7.zendesk.com/api/v2/tickets/3.json",
            "id": 3,
            "external_id": null,
            "via": {
                "channel": "web",
                "source": {
                    "from": {},
                    "to": {},
                    "rel": null
                }
            },
            "created_at": "2014-09-01T04:42:13Z",
            "updated_at": "2014-09-01T04:42:13Z",
            "type": null,
            "subject": "Baboom this is a new ticket",
            "raw_subject": "Baboom this is a new ticket",
            "description": "hey there sweetheart!",
            "priority": null,
            "status": "open",
            "recipient": null,
            "requester_id": 364410045,
            "submitter_id": 364410045,
            "assignee_id": 364410045,
            "organization_id": 27307765,
            "group_id": 21951885,
            "collaborator_ids": [],
            "forum_topic_id": null,
            "problem_id": null,
            "has_incidents": false,
            "due_at": null,
            "tags": [],
            "custom_fields": [],
            "satisfaction_rating": null,
            "sharing_agreement_ids": [],
            "fields": []
        }];

var myTimer;

function error_message(status) {

    var possibleErrors = {
        0: 'Request Unsent',
        400: 'Bad Request',
        401: 'Not Authorized. Please log in to Zendesk',
        403: 'Forbidden',
        404: 'Not Found. Check your Domain and View ID',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
    };

    var errorMsg;

    if (status in possibleErrors) {
        errorMsg = status + ": " + possibleErrors[status];
    } else {
        errorMsg = status;
    }

    return errorMsg.toString();
}

function doRequest(callback, invoked) {

    var url = 'https://' + settings.zendeskDomain + '.zendesk.com/api/v2/views/' + settings.viewID + '/tickets.json';

    console.log('Performing request');
    var xml = new XMLHttpRequest();
    xml.open('GET', url);
    xml.send();

    xml.onreadystatechange = function() {

        var debug = "firing xml readystate handler..." + xml.readyState;
        // console.log(debug);

        if (xml.readyState === 4) {

            if (xml.status === 200) {

                process_tickets(JSON.parse(xml.responseText));
                compare_tickets();

                if (ticketsNew.length === 0 && invoked === true) {

                    chrome_notify('No new cases!', null);

                } else if (settings.showNotifications === true) {

                    notify_new_tickets();
                }

                if (callback) {
                    callback();
                }
                badge_icon();

            } else {

                if (settings.showErrors === true || invoked === true) {
                    chrome_notify_error(error_message(xml.status));
                }

                ticketsCurrent = [];
                ticketsPrevious = [];
                badge_icon("?");

                if (callback) {
                    callback(error_message(xml.status));
                }
            }
            autoCheck();
        }
    };
}

function doRequestInvoked() { // when "Check Now" is clicked

    clearTimeout(myTimer);
    ticketsPrevious = []; // reset tickets
    doRequest(null, true);
}

function process_tickets(response) {

    var tickets = response.tickets;

    ticketsCurrent = [];

    for (var i = 0; i < tickets.length; i++) {
        ticketsCurrent.push(tickets[i]);
    }

}

function compare_tickets() {

    ticketsNew = [];

    // 1. find all the current tickets that are not in ticketsPrevious
    for (var i = 0; i < ticketsCurrent.length; i++) {
        if (!ticket_in_array(ticketsCurrent[i], ticketsPrevious)) {

            // 2. push these tickets into ticketsNew
            console.log("pushing new ticket: " + ticketsCurrent[i].id);
            ticketsNew.push(ticketsCurrent[i]);
        }
    }

    // 3. replace ticketsPrevious tickets with ticketsCurrent
    ticketsPrevious = ticketsCurrent.slice(0);
}

function ticket_in_array(ticket, array) {
    // returns whether a ticket object exists in a given array of ticket objects
    // uses ticket ID as basis of determination

    for (var i = 0; i < array.length; i++) {
        if (ticket.id === array[i].id) {
            return true;
        }
    }
    return false;
}

function notify_new_tickets() {

    if (ticketsNew.length > 1) {
        chrome_notify_multi(ticketsNew);
        return;
    }

    for (var i = 0; i < ticketsNew.length; i++) {
        chrome_notify_tickets(ticketsNew[i]);
    }
}

function chrome_notify(title, msg) {

    if (msg === null) {
        msg = "";
    }

    var notificationID = "";
    var opt = {
        type: "basic",
        title: title,
        message: msg,
        iconUrl: "icons/box-64.png",
    };

    chrome.notifications.create(notificationID, opt, function(notificationID) {
        console.log('notification ' + notificationID + ' created');
    });
}

function chrome_notify_error(errorMsg) {

    var notificationID = "";
    var opt = {
        type: "basic",
        title: "Error retrieving cases",
        message: errorMsg,
        iconUrl: "icons/sad-face.png",
    };

    chrome.notifications.create(notificationID, opt, function(notificationID) {
        console.log('notification ' + notificationID + ' created');
    });
}

function chrome_notify_tickets(ticket) {

    var notificationID = "notif_" + Math.random() + "-" + ticket.id;
    var subText;
    var iconImage;

    if (ticket.priority !== null) {

        subText = "#" + ticket.id + " (" + ticket.priority + ")";

        if (ticket.priority == 'urgent') {
            iconImage = 'icons/airplane-red-48.png';
        } else if (ticket.priority == 'high') {
            iconImage = 'icons/airplane-yellow-48.png';
        } else {
            iconImage = 'icons/airplane-graphite-48.png';
        }
    } else {

        subText = "#" + ticket.id;
        iconImage = 'icons/airplane-graphite-48.png';
    }

    var opt = {
        type: "basic",
        title: ticket.subject,
        message: ticket.description,
        // contextMessage: subText,
        iconUrl: iconImage,
    };

    chrome.notifications.create(notificationID, opt, function(notificationID) {
        console.log('notification ' + notificationID + ' created');
    });
}

function chrome_notify_multi(newTickets) {

    var iconImage = 'icons/airplane-graphite-48.png';

    for (var i = 0; i < newTickets.length; i++) {

        var ticket = newTickets[i];
        // console.log(ticket);

        if (ticket.priority !== null) {  // stop the loop after identifying urgent or high ticket

            subText = "#" + ticket.id + " (" + ticket.priority + ")";

            if (ticket.priority == 'urgent') {
                iconImage = 'icons/airplane-red-48.png';
                break;

            } else if (ticket.priority == 'high') {
                iconImage = 'icons/airplane-yellow-48.png';
                break;
            }
        }
    }

    var notificationID = "multi-tickets-" + Math.random();
    var opt = {
        type: "basic",
        title: newTickets.length + " new cases",
        message: "Click me to go see them!",
        iconUrl: iconImage,
    };

    chrome.notifications.create(notificationID, opt, function(notificationID) {
        console.log('notification ' + notificationID + ' created');
    });
}


function ticket_notif_click(notificationID) {

    if (notificationID.indexOf('notif') !== -1) {

        var ticketID = notificationID.split('-')[1];
        launch_zd_link(ticketID);

    } else if (notificationID.indexOf('multi-tickets') !== -1) {

        launch_zd_link(settings.viewID, true);

    } else {

        return;
    }
}

function launch_zd_link(objectID, isView) {

    var property;
    var typeUrl;

    if (isView) {
        property = 'show_filter';
        typeUrl = 'filters/';
    } else {
        property = 'ticket.index';
        typeUrl = 'tickets/';
    }

    var tabQuery = {
        url: '*://' + settings.zendeskDomain + '.zendesk.com/agent/*',
        // active: false
    };

    function open_and_focus(tabs) {

        var ZDtab = tabs[0];

        if (ZDtab) {

            var actualCode = ['\'Zendesk.router.transitionTo("' + property + '",' + objectID + ');\''].join();
            // console.log(actualCode); 

            var js = ['var script = document.createElement("script");',
                      'script.textContent = ' + actualCode + ';',
                      'console.log(script);',
                      'document.head.appendChild(script);'].join('\n');

            chrome.tabs.executeScript(ZDtab.id, {
                code: js
            });
            chrome.tabs.update(ZDtab.id, {
                active: true
            });
            chrome.windows.update(ZDtab.windowId, {
                focused: true
            });
        } else {

            var newURL = 'https://' + settings.zendeskDomain + '.zendesk.com/agent/' + typeUrl + objectID;
            chrome.tabs.create({
                url: newURL
            });
        }
    }

    chrome.tabs.query(tabQuery, open_and_focus);
}

function update_icon() {

    if (settings.enabled === true) {

        chrome.browserAction.setIcon({
            path: 'icons/ZD-logo-19.png'
        });
    } else {

        chrome.browserAction.setIcon({
            path: 'icons/ZD-logo-gray-19.png'
        });
    }
}

function badge_icon(custom_string) {

    var number = ticketsCurrent.length;
    var badgeColor = [150, 150, 150, 255];
    var badgeText = "";

    if (custom_string) {
        badgeColor = [255, 0, 0, 255];
        badgeText = custom_string;

    } else if (number > 0) {

        if (settings.enabled === true) {
            badgeColor = [0, 185, 242, 255];    
        } else {
            badgeColor = [150, 150, 150, 255];    
        }
        badgeText = number.toString();
    }

    chrome.browserAction.setBadgeBackgroundColor({color: badgeColor});
    chrome.browserAction.setBadgeText({text: badgeText});

}

function test_request() {

    console.log('interval: ' + settings.interval);
}

function autoCheck() {

    // calls doRequest again if interval checking is enabled
    // clears timer before setting new one to ensure no duplicate timers

    console.log("autocheck invoked");

    clearTimeout(myTimer);
    
    if (settings.enabled === true) {

        var interval = settings.getInterval() * 5000;

        console.log("set new timeout");
        myTimer = setTimeout(doRequest, interval);

    }
}

chrome.storage.local.get(null, function(loaded) {
    if (loaded.ranBefore && loaded.setBefore) {
        console.log('app has been run and set before');
        settings.load();
        return;
    }
    console.log('first run');
});

chrome.storage.local.set({
    'ranBefore': true
});

badge_icon(); // clear badge icon on start

// save settings when popup closes
chrome.runtime.onConnect.addListener(function(port) {
    port.onDisconnect.addListener(function() {
        settings.save();
        chrome.storage.local.set({
            'setBefore': true
        });
    });
});

// click notifications to go to tickets
chrome.notifications.onClicked.addListener(ticket_notif_click);
