Q(window).on('load', function() {
	var feed = new Q.ImageFeed(),
		url = 'http://www.flickr.com/services/feeds/photos_public.gne',
		lastSearch = 'climbing, bouldering',
		lastTags,
		searchTask;
		
	function onChange(target, e) {
		if (searchTask) {
			clearTimeout(searchTask);
		}
		searchTask = setTimeout(function() {
			searchTask = null;
			doSearch(target.value);
		}, 400);
	}
	
	function doSearch(value) {
		lastSearch = value;
		value = value ? value.replace(/\s/g, '') : '';
		if (value !== lastTags) {
			lastTags = value;
			Q.jsonp({
				url: url,
				params: {
					tags: lastTags,
					format: 'json'
				},
				callbackParam: 'jsoncallback',
				callback: function(data) {
					feed.updateFeed(data);
				}
			});
		}
	}
	
	Q.intercept(feed, {
		updateTitlebar: function() {
			this.$proceed.apply(this, arguments);
			// This traversal will select the input tag after adding it to the top bar
			this.el.first().add('<label>search tags <input></label>').last().last().on({
				change: onChange,
				keyup: onChange,
				blur: onChange
			}).focus().dom.value = lastSearch;
		}
	});
	feed.render(document.body);
	doSearch(lastSearch);
});