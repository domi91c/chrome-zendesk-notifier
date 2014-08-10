var previousStorageValue;

chrome.storage.local.get("key1", function(items) {
    if (items.key1) {
        console.log("retrieval successful: " + items.key1);
        previousStorageValue = items.key1;    
    }
    prompt_user();
})

function prompt_user() {
    testStorageValue = window.prompt('input a value to store', previousStorageValue);
    store_value();
}

function store_value() {
    chrome.storage.local.set({"key1": testStorageValue}, function() {
        console.log("storage successful: " + testStorageValue);
    })
}












var zendeskDomain = 'wdc5'
var viewID = '32751499'
// var url = 'https://' + zendeskDomain + '.zendesk.com/api/v2/views.json'
var url = 'https://' + zendeskDomain + '.zendesk.com/api/v2/views/' + viewID + '/tickets.json'

var ticketIDArrayPrev = [];
var ticketIDArrayCurrent = [];
var ticketIDArrayNew = [];
var ticketSubjects = [];


var doRequest = function(callback) {

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
                chrome_notify_error("Request failed with error: " + xml.status);
            }
        }
    };
};

var doRequestInvoked = function() {

    doRequest(function() {
        chrome_notify('No new tickets!', null);
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
            ticketIDArrayNew.push(thisTicket);  // ...it's new
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

    chrome.notifications.create(notificationID, opt, function (notificationID) {
        console.info('notification ' + notificationID + ' created');
    });
}

function chrome_notify_error(errorMsg) {

    var notificationID = "";
    var opt = {
        type: "basic",
        title: "Error retrieving tickets",
        message: errorMsg,
        iconUrl: "icons/sad-face.png",
    };

    chrome.notifications.create(notificationID, opt, function (notificationID) {
        console.info('notification ' + notificationID + ' created');
    });
}

function chrome_notify_tickets(ticketID) {

    var notificationID = "notif-" + ticketID;
    var opt = {
        type: "basic",
        title: "New Ticket Submitted: #" + ticketID,
        message: '"' + ticketSubjects[ticketID] + '"',
        iconUrl: "icons/ticket-38.png",
    };

    chrome.notifications.create(notificationID, opt, function (notificationID) {
        console.info('notification ' + notificationID + ' created');
    });
}

function chrome_notify_multi(numTickets) {

    var notificationID = "multi-tickets"
    var opt = {
        type: "basic",
        title: numTickets + " new tickets",
        message: "Click me to go see them!",
        iconUrl: "icons/ticket-38.png",
    };

    chrome.notifications.create(notificationID, opt, function (notificationID) {
        console.info('notification ' + notificationID + ' created');
    });
}


chrome.notifications.onClicked.addListener(ticket_notif_click);

function ticket_notif_click(notificationID) {

    if (notificationID.indexOf('notif') !== -1) {
        
        var ticketID = notificationID.split('-')[1];
        var newURL = 'https://' + zendeskDomain + '.zendesk.com/agent/#/tickets/' + ticketID;
        chrome.tabs.create({ url: newURL });
        return;

    } else if (notificationID.indexOf('multi-tickets') !== -1) {

        var newURL = 'https://' + zendeskDomain + '.zendesk.com/agent/#/filters/' + viewID;
        chrome.tabs.create({ url: newURL });

    } else {

        return;
    };

}

setInterval(doRequest, 60000); // every 60 seconds

