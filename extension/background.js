var settings = {
    enabled: false,
    interval: 1,
    zendeskDomain: 'zendesk-domain',
    viewID: 12345678,
    showErrors: false,

    load: function() {
        var that = this;
        chrome.storage.local.get(null, function(loaded) {
            that.enabled = loaded.enabled;
            that.interval = loaded.interval;
            that.zendeskDomain = loaded.zendeskDomain;
            that.viewID = loaded.viewID;
            that.showErrors = loaded.showErrors;

            if (that.interval < 1) {
                that.interval = 1;
            }
            autoCheck();
        });
        update_icon();

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
            'interval': this.interval,
            'zendeskDomain': this.zendeskDomain,
            'viewID': this.viewID,
            'showErrors': this.showErrors
        });
    },
    clear: function() {
        chrome.storage.local.clear(function() {
            console.log('settings cleared');
        })
    }
}

var ticketIDArrayPrev = [];
var ticketIDArrayCurrent = [];
var ticketIDArrayNew = [];
var ticketSubjects = [];
var ticketPriorities = [];

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

function doRequest(callback) {

    var url = 'https://' + settings.zendeskDomain + '.zendesk.com/api/v2/views/' + settings.viewID + '/tickets.json'

    console.log('Performing request');
    var xml = new XMLHttpRequest();
    xml.open('GET', url);
    xml.send();

    xml.onreadystatechange = function() {

        var debug = "firing xml readystate handler..." + xml.readyState;
        console.log(debug);

        if (xml.readyState === 4) {

            if (xml.status === 200) {

                process_tickets(JSON.parse(xml.responseText));
                compare_tickets();

                if (ticketIDArrayNew.length == 0 && callback) {
                    callback();
                } else {
                    notify_new_tickets();
                }

                badge_icon();

            } else {

                if (settings.showErrors == true || callback) {
                    chrome_notify_error(error_message(xml.status));
                }
            }
            autoCheck();
        }
    };
};

function doRequestInvoked() { // when "Check Now" is clicked

    if (myTimer) {  // reset autocheck timer
        console.log("invoked, timer cleared");
        clearTimeout(myTimer);
    }

    ticketIDArrayPrev = []; // reset tickets

    doRequest(function() {
        chrome_notify('No new cases!', null);
    });
}

function process_tickets(response) {

    ticketIDArrayCurrent = [];
    ticketSubjects = [];
    ticketPriorities = [];

    tickets = response.tickets;
    for (var i = 0; i < tickets.length; i++) {
        ticketIDArrayCurrent.push(tickets[i].id); // add ticket ID to ticketIDArrayCurrent
        ticketSubjects[tickets[i].id] = tickets[i].subject;
        ticketPriorities[tickets[i].id] = tickets[i].priority;
    }
};

function compare_tickets() {

    var thisTicket;
    ticketIDArrayNew = [];

    // compare current with previous
    for (var i = 0; i < ticketIDArrayCurrent.length; i++) {
        thisTicket = ticketIDArrayCurrent[i];
        if (ticketIDArrayPrev.indexOf(thisTicket) == -1) { // if a current ticket is not found in previous array...
            ticketIDArrayNew.push(thisTicket); // ...it's new
        }
    };

    // replace previous with current
    ticketIDArrayPrev = ticketIDArrayCurrent.slice(0); // .slice(0) returns new array (like a copy function)
}

function notify_new_tickets() {

    if (ticketIDArrayNew.length > 3) {
        chrome_notify_multi(ticketIDArrayNew.length);
        return;
    }

    for (var i = 0; i < ticketIDArrayNew.length; i++) {
        chrome_notify_tickets(ticketIDArrayNew[i]);
    };
}

function chrome_notify(title, msg) {

    if (msg == null) {

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
        console.info('notification ' + notificationID + ' created');
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
        console.info('notification ' + notificationID + ' created');
    });
}

function chrome_notify_tickets(ticketID) {

    var notificationID = "notif_" + Math.random() + "-" + ticketID;
    var subText;
    var iconImage

    if (ticketPriorities[ticketID]) {

        subText = "#" + ticketID + " (" + ticketPriorities[ticketID] + ")";

        if (ticketPriorities[ticketID] == 'urgent') {
            iconImage = 'icons/airplane-red-48.png'
        } else if (ticketPriorities[ticketID] == 'high') {
            iconImage = 'icons/airplane-yellow-48.png'
        } else {
            iconImage = 'icons/airplane-graphite-48.png';
        }
    } else {

        subText = "#" + ticketID;
        iconImage = 'icons/airplane-graphite-48.png';
    }

    var opt = {
        type: "basic",
        title: "New Case",
        message: '"' + ticketSubjects[ticketID] + '"',
        contextMessage: subText,
        iconUrl: iconImage,
    };

    chrome.notifications.create(notificationID, opt, function(notificationID) {
        console.info('notification ' + notificationID + ' created');
    });
}

function chrome_notify_multi(numTickets) {

    var notificationID = "multi-tickets-" + Math.random();
    var opt = {
        type: "basic",
        title: numTickets + " new cases",
        message: "Click me to go see them!",
        iconUrl: "icons/airplane-graphite-48.png",
    };

    chrome.notifications.create(notificationID, opt, function(notificationID) {
        console.info('notification ' + notificationID + ' created');
    });
}

function ticket_notif_click2(notificationID) {

    if (notificationID.indexOf('notif') !== -1) {

        var ticketID = notificationID.split('-')[1];
        var newURL = 'https://' + settings.zendeskDomain + '.zendesk.com/agent/#/tickets/' + ticketID;
        chrome.tabs.create({
            url: newURL
        });
        return;

    } else if (notificationID.indexOf('multi-tickets') !== -1) {

        var newURL = 'https://' + settings.zendeskDomain + '.zendesk.com/agent/#/filters/' + settings.viewID;
        chrome.tabs.create({
            url: newURL
        });

    } else {

        return;
    };

}

function ticket_notif_click(notificationID) {

    if (notificationID.indexOf('notif') !== -1) {

        var ticketID = notificationID.split('-')[1];
        var newURL = 'https://' + settings.zendeskDomain + '.zendesk.com/agent/#/tickets/' + ticketID;
        chrome.tabs.create({
            url: newURL
        });
        return;

    } else if (notificationID.indexOf('multi-tickets') !== -1) {

        var newURL = 'https://' + settings.zendeskDomain + '.zendesk.com/agent/#/filters/' + settings.viewID;
        chrome.tabs.create({
            url: newURL
        });

    } else {

        return;
    };

}

function update_icon() {

    if (settings.enabled == true) {

        chrome.browserAction.setIcon({
            path: 'icons/ZD-logo-19.png'
        });
    } else {

        chrome.browserAction.setIcon({
            path: 'icons/ZD-logo-gray-19.png'
        });
    }
}

function badge_icon() {

    var number = ticketIDArrayCurrent.length;

    if (number > 0) {

        chrome.browserAction.setBadgeBackgroundColor({
            color: [0, 185, 242, 255]
        });
        chrome.browserAction.setBadgeText({
            text: number.toString()
        });
    } else {

        chrome.browserAction.setBadgeText({
            text: ''
        });
    }


}

function test_request() {

    console.log('interval: ' + settings.interval);
}

var myTimer;

function autoCheck() {

    console.log("firing autocheck");

// starts repeated checks if settings indicate true
// clears timer if settings indicate false

    if (settings.enabled == true) {

        // var interval = settings.getInterval() * 60000;
        var interval = settings.getInterval() * 5000;

        console.log("set new timeout.");
        myTimer = setTimeout(doRequest, interval);

    } else {

        console.log("cleared timeout.");
        clearTimeout(myTimer);
    }
}

chrome.storage.local.get(null, function(loaded) {
    if (loaded.ranBefore && loaded.setBefore) {
        console.log('app has been run and set before');
        settings.load();
        return;
    }
    console.log('first run');
})

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
    })
})

// click notifications to go to tickets
chrome.notifications.onClicked.addListener(ticket_notif_click);
