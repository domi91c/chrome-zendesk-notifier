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

# Feature to implement
* if number of notification exceeds N, display a notification saying "N new tickets" instead of pushing all N on screen separately.