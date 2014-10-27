var bg = chrome.extension.getBackgroundPage();

window.onload = function() {

    function create_list_item(id, content, subtext, highlight) {

        var clickable = true;

        var list = $('.tickets');
        var ticket = $('<li id="' + id + '"' + 'class=tickets-li' + '>' + content + '</li>');

        if (subtext && !highlight) {
            ticket.prepend('<div class="info-created">' + subtext + '</div>');
        } else if (subtext && highlight) {
            ticket.prepend('<div class="info-created highlight">' + subtext + '</div>');
        } else {
            clickable = false;
        };

        if (clickable) {
            ticket[0].onclick = click_handler;
        };

        list.append(ticket);

        ticket.fadeTo(200, 1);  // this has a bug!
    }

    function clear_loading() {

        $('#loading').animate({
            opacity: '0'
        }, 250, function() {
            $(this).remove();
        });
    }

    function show_tickets(error) {

        if (error) {
            create_list_item("status", error);
            clear_loading();
            return;
        };

        var ticketsCurrent = bg.ticketsCurrent
        ticketsCurrent.sort(compare_time);

        if (ticketsCurrent.length == 0) {
            create_list_item("status", "Nothing in the queue!");
            clear_loading();
            return;
        }

        // populate the list
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
                highlight
            );
        };

        clear_loading();
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

}