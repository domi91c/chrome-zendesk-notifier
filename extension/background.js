
var zendeskDomain = 'wdc5'
var viewID = '1234'
var url = 'https://' + zendeskDomain + '.zendesk.com/api/v2/views.json'


var doRequest = function() {

    var xml = new XMLHttpRequest();
    xml.open('GET', url);
    xml.send();

    xml.onreadystatechange = function() {
        if (xml.readyState === 4) {
            if (xml.status === 200) {
                var response = JSON.parse(xml.responseText);
                console.log(response);
            } else {
                console.error("Request failed with error: " + xml.status);
            }
        }
    };
};

doRequest();









var opt = {
  type: "basic",
  title: "Primary Title",
  message: "Primary message to display",
  iconUrl: "icons/ticket-38.png"
};

// chrome.notifications.create("", opt, function (notificationID) {
//     console.info('notification ' + notificationID + ' launched!');
// });

chrome.notifications.onClicked.addListener(ticket_notif_click);

function ticket_notif_click() {
    console.log('notification was clicked');
}