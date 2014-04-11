Q.on(window, 'load', function() {
	var feed = new Q.HoverFeed({
		renderTo: document.body
	});
	// flickrSpoof is a spoof function to emulate Q.ajax()
	flickrSpoof({
		url: 'feed.json',
		callback: function (response) {
            feed.updateFeed(JSON.parse(response.responseText));
        }
	});
});