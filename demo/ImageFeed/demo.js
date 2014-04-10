// Page load handler
Q.on(window, 'load', function() {
	var feed = new Q.HoverFeed({
		renderTo: 'flickrPanel'
	});
	// I am using a spoof function instead of an ajax call because I can't make cross-domain requests and have no local proxy.
	flickrSpoof({ // T.ajax({
		url: 'feed.json',
		callback: updateFeed
	});
		
	function updateFeed(response) {
		var data = response.responseText;
		// Just cut out that callback function name
		data = data.substring(data.indexOf('{'), data.lastIndexOf('}') + 1);
		data = JSON.parse(data);
		feed.updateFeed(data);
	}
});