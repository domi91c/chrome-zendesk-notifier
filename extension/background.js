var settings = {
    enabled: null,
    interval: null,
    zendeskDomain: null,
    viewID: null,
    showErrors: null,

    load: function() {
        var that = this;
        chrome.storage.local.get(null, function(loaded) {
            that.enabled = loaded.enabled;
            that.interval = loaded.interval;
            that.zendeskDomain = loaded.zendeskDomain;
            that.viewID = loaded.viewID;
            that.showErrors = loaded.showErrors;
        })
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

function badge_icon(number) {
    chrome.browserAction.setBadgeBackgroundColor({
        color: [0, 185, 242, 255]
    });
    chrome.browserAction.setBadgeText({
        text: number.toString()
    });
}


settings.load();

// save settings when popup closes
chrome.runtime.onConnect.addListener(function(port) {
    port.onDisconnect.addListener(function() {
        settings.save();
    })
})


var ticketIDArrayPrev = [];
var ticketIDArrayCurrent = [];
var ticketIDArrayNew = [];
var ticketSubjects = [];


var doRequest = function(callback) {

    var url = 'https://' + settings.zendeskDomain + '.zendesk.com/api/v2/views/' + settings.viewID + '/tickets.json'

    console.log('Performing request');
    var xml = new XMLHttpRequest();
    xml.open('GET', url);
    xml.send();

    xml.onreadystatechange = function() {
        if (xml.readyState === 4) {
            if (xml.status === 200) {
                process_tickets(JSON.parse(xml.responseText));
                compare_tickets();
                if (ticketIDArrayNew.length == 0 && callback) {
                    callback();
                };
                notify_new_tickets();
            } else {
                chrome_notify_error(error_message(xml.status));
            }
        }
    };
};

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

function doRequestInvoked() {

    doRequest(function() {
        chrome_notify('No new cases!', null);
    });
}

var process_tickets = function(response) {

    ticketIDArrayCurrent = [];
    ticketSubjects = [];

    tickets = response.tickets;
    for (var i = 0; i < tickets.length; i++) {
        ticketIDArrayCurrent.push(tickets[i].id); // add ticket ID to ticketIDArrayCurrent
        ticketSubjects[tickets[i].id] = tickets[i].subject;
    }
    // console.log('previous tickets: ' + ticketIDArrayPrev);
    // console.log('current tickets: ' + ticketIDArrayCurrent);
    // console.log('current ticket subjects: ' + ticketSubjects);

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
    // console.log('new tickets: ' + ticketIDArrayNew);

    // replace previous with current
    ticketIDArrayPrev = ticketIDArrayCurrent.slice(0);
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
        iconUrl: "icons/ticket-38.png",
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

    var notificationID = "notif-" + ticketID;
    var opt = {
        type: "basic",
        title: "New Case Submitted: #" + ticketID,
        message: '"' + ticketSubjects[ticketID] + '"',
        iconUrl: "icons/ticket-38.png",
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
        iconUrl: "icons/ticket-38.png",
    };

    chrome.notifications.create(notificationID, opt, function(notificationID) {
        console.info('notification ' + notificationID + ' created');
    });
}

function ticket_notif_click(notificationID) {

    if (notificationID.indexOf('notif') !== -1) {

        var ticketID = notificationID.split('-')[1];
        var newURL = 'https://' + zendeskDomain + '.zendesk.com/agent/#/tickets/' + ticketID;
        chrome.tabs.create({
            url: newURL
        });
        return;

    } else if (notificationID.indexOf('multi-tickets') !== -1) {

        var newURL = 'https://' + zendeskDomain + '.zendesk.com/agent/#/filters/' + viewID;
        chrome.tabs.create({
            url: newURL
        });

    } else {

        return;
    };

}

chrome.notifications.onClicked.addListener(ticket_notif_click);

// setInterval(doRequest, 600000); // every 600 seconds
