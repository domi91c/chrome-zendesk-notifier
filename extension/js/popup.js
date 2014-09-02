var bg = chrome.extension.getBackgroundPage();

window.onload = function() {

    function create_list_item(id, content, subtext) {

        var list = $('.tickets');
        var ticket = '<li id="' + id + '"' + 'class=tickets-li' + '>' + content + '</li>';
        list.append(ticket);

        var listItem = $('#' + id);
        listItem.prepend('<div class=info-created>' + subtext + '</div>');

        listItem[0].onclick = click_handler;
    }

    function show_tickets(error) {

        if (error) {
            create_list_item("error_msg", error);
            return;
        };

        var ticketsCurrent = bg.ticketsCurrent

        for (var i = 0; i < ticketsCurrent.length; i++) {

            var dateCreated = new Date(ticketsCurrent[i].created_at);

            create_list_item(ticketsCurrent[i].id, ticketsCurrent[i].subject, time_since_created(dateCreated));
        };
    }

    function time_since_created(date) {

        var timeString;
        var dateNow = new Date();
        var delta = (dateNow - date);
        var deltaMin = Math.floor(delta / 60000);
        var deltaHour = Math.floor(deltaMin / 60);
        var remainMin = deltaMin / deltaHour % 60;

        if (deltaMin > 120) {
            timeString = deltaHour + " hr";
        } else if (deltaMin > 60) {
            timeString = deltaHour + " hr " + remainMin + " m";
        } else {
            timeString = deltaMin + " min";
        };

        console.log(deltaMin + " min");
        return timeString;
    }

    function click_handler(event) {
        var ID = event.target.id;
        bg.launch_zd_link(ID);
    }

    bg.doRequest(show_tickets, null, true); // silent refresh when popup opens

    document.getElementById('checknow').onclick = function() {
        bg.doRequestInvoked();
    }
}