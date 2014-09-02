var bg = chrome.extension.getBackgroundPage();

window.onload = function() {

    function create_list_item(id, content, subtext, highlight) {

        var list = $('.tickets');
        var ticket = '<li id="' + id + '"' + 'class=tickets-li' + '>' + content + '</li>';
        list.append(ticket);

        var listItem = $('#' + id);

        if (subtext && !highlight) {
            listItem.prepend('<div class="info-created">' + subtext + '</div>');
        } else if (subtext && highlight) {
            listItem.prepend('<div class="info-created highlight">' + subtext + '</div>');
        } else {
            return;
        };

        listItem[0].onclick = click_handler;
    }


    function show_tickets(error) {

        if (error) {
            create_list_item("error_msg", error);
            return;
        };

        var ticketsCurrent = bg.ticketsCurrent
        ticketsCurrent.sort(compare_time);

        if (ticketsCurrent.length == 0) {
            create_list_item("no_tickets", "Nothing in the queue!");
        }

        for (var i = 0; i < ticketsCurrent.length; i++) {

            var dateCreated = new Date(ticketsCurrent[i].created_at);
            var highlight = null;

            if (time_since_created(dateCreated) > (60000 * 45)) {   // if more than 45 minutes have passed
                highlight = true;
            }

            create_list_item(
                ticketsCurrent[i].id,
                ticketsCurrent[i].subject,
                time_delta_str(time_since_created(dateCreated)),
                highlight);
        };
    }

    function time_since_created(date) {

        var timeString;
        var dateNow = new Date();

        return dateNow - date;
    }

    function time_delta_str(delta) {

        var timeString;
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

        // console.log(deltaMin + " min");

        return timeString;
    }

    function compare_time(ticketA, ticketB) {
        dateA = new Date(ticketA.created_at);
        dateB = new Date(ticketB.created_at);

        return dateA - dateB;
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