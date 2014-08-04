
var zendeskDomain = 'wdc5'
var viewID = '32751499'
// var url = 'https://' + zendeskDomain + '.zendesk.com/api/v2/views.json'
var url = 'https://' + zendeskDomain + '.zendesk.com/api/v2/views/' + viewID + '/tickets.json'
var ticketIDArrayPrev = [];
var ticketIDArrayCurrent = [];
var ticketIDArrayNew = [];


var doRequest = function() {

    var xml = new XMLHttpRequest();
    xml.open('GET', url);
    xml.send();

    xml.onreadystatechange = function() {
        if (xml.readyState === 4) {
            if (xml.status === 200) {
                process_tickets(JSON.parse(xml.responseText));
                compare_tickets();
                notify_new_tickets();
            } else {
                console.error("Request failed with error: " + xml.status);
            }
        }
    };
};

var process_tickets = function(response) {

    ticketIDArrayCurrent = [];

    tickets = response.tickets;
    for (var i = 0; i < tickets.length; i++) {
        ticketIDArrayCurrent.push(tickets[i].id); // add ticket ID to ticketIDArrayCurrent
    }
    console.log('current tickets: ' + ticketIDArrayCurrent);

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
    console.log('new tickets: ' + ticketIDArrayNew);

    // replace previous with current
    ticketIDArrayPrev = ticketIDArrayCurrent.slice(0);
    console.log('updated previous tickets: ' + ticketIDArrayPrev);

}

function notify_new_tickets() {

    for (var i = 0; i < ticketIDArrayNew.length; i++) {
        chrome_notify(ticketIDArrayNew[i]);    
    };
}

function chrome_notify(ticketID) {

    var notificationID = "notif-" + ticketID;
    var opt = {
        type: "basic",
        title: "New Ticket Submitted: #" + ticketID,
        message: "Primary message to display",
        iconUrl: "icons/ticket-38.png",
    };

    chrome.notifications.create(notificationID, opt, function (notificationID) {
        console.info('notification ' + notificationID + ' launched!');
    });
}


chrome.notifications.onClicked.addListener(ticket_notif_click);

function ticket_notif_click(notificationID) {

    var ticketID = notificationID.split('-')[1];
    var newURL = 'https://' + zendeskDomain + '.zendesk.com/agent/#/tickets/' + ticketID;
    chrome.tabs.create({ url: newURL });

}



// doRequest();