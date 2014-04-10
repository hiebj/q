// Page load handler
Q.on(window, 'load', function() {
	var feed = new Q.HoverFeed({
		renderTo: document.body
	});
	flickrSpoof({ // spoof function with the same arity as Q.ajax()
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