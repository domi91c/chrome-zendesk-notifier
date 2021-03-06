# Process
* Get ID of view
	* `GET /api/v2/views.json`
	* http://developer.zendesk.com/documentation/rest_api/views.html
* declare empty array: array_prev
* run ticket-check iteration

### Iteration
* check view and get ticket IDs
 	* `GET /api/v2/views/{id}/tickets.json`
	* Use URL parameters to sort:
		* sort_by: created_at
		* sort_order: desc
	* sorting may not be necessary for small ticket quanity
		* need to implement quantity checker
* put these tickets into array_new
* compare these ticket IDs with array_prev
	* if ID from array_new not in array_prev: alert_new_ticket()
	* if ID from array_prev not in array_new: delete_answered_ticket()
		
		
		

### Other Methods		
* `GET /api/v2/views/{id}/execute.json`
	* *"The view execution system is designed for periodic rather than high-frequency API usage. In particular, views that are called very frequently by an API client (more often than once every 5 minutes on average) may be cached by our software. This means that the API client will still receive a result, but that result may have been computed at any time within the last 10 minutes."*		
* alternate method: **incremental tickets API** (admins only)
	* Get tickets that changed "since last asked"
	* http://developer.zendesk.com/documentation/rest_api/ticket_export.html
	
# Bugs

### Outdated notifications showing
* Hypothesis: when extension fails to get response, something resets new_tickets array. Therefore, the next time an update is requested, these notifications will show again
	* to confirm this hypothesis, log all array changes


# Features to implement
* ~~if number of notification exceeds N, display a notification saying "N new tickets" instead of pushing all N on screen separately.~~
* ~~allow user to turn on/off~~* 
* ~~allow user to specify domain and refresh interval~~
* ~~option to open in new tab or current zendesk window/tab~~
	* ~~to open in current zendesk tab: `window.location.hash = "#/tickets/4"`~~
* "check now" button should have option to show any tickets in view, or just new tickets from last check
* **option to make notifications "stick" on screen**
* dequeue requests so that error message don't pile up when unable to connect (or computer goes to sleep)
* Triage mode
	* checks for unassigned tickets in a specific view

### V1.1.0
* ~~More functional "check now" button~~
	* ~~also resets. No need for extra "reset" button~~
	* button shows feedback overlay
		* green check if succeed
		* red x if failed
* ~~on/off shows feedback~~
	* ~~disables internal text input when off~~
* ~~smart interval text-input~~
	* ~~only 2 digits, auto corrects invalid input to 1 min~~
* ~~show error messages off by default~~
* ~~extension icon shows feedback (gray, on/off state)~~

### V1.1.2
* remove interval setting, only leave notification toggle switch.
* [maybe] remove option to show errors. Only show errors during check now, and use the "?" badge icon to indicate errors otherwise
* **Include notification of tickets that are about to expire**

### V2.x
* new ticket view page, accessed by clicking app icon
	* move options to separate page
* make tickets appear one at a time, instead of all at once (blocking screen)
	* or, batch them (N new cases)
* add quick on/off to enable/disable notifications
	* this should not affect refresh interval; refresh should always be on
* make badge icon auto-update at 1 min intervals regardless of rich notification on/off settings
	* **exponential backoff on failure**
	* stop showing error chrome notifications after first error
	* show red "?" on failure
* multi-view support
	* different notifications for each view?
	* icon popup should show organized list of tickets in each view


# Resources
### in use:
* sad face icon:
	* author: CrimsonAngelofShadow
	* http://crimsonangelofshadow.deviantart.com/art/Innocent-Sad-Face-Icon-272714484
* sparrow colored icons:
	* author: YaroManzarek
	* http://jacusan.deviantart.com/art/Sparrow-flavors-199914081
	
### to consider:

* suitcase icons: http://rskys.deviantart.com/art/suitcase-icon-150587853
* plastic colored boxes: http://tomeqq.deviantart.com/art/Plastic-Box-152707591
* alert icons: http://www.shutterstock.com/pic-183631826/stock-vector-information-and-notification-simple-color-icons.html?src=umY9C-uI97QVwrouZyKKag-1-14