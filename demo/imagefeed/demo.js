Q.on(window, 'load', function() {
	var feed = new Q.ImageFeed(),
		url = 'http://www.flickr.com/services/feeds/photos_public.gne',
		lastSearch = 'climbing, bouldering',
		lastTags,
		searchTask;
		
	function onChange(e) {
		if (searchTask) {
			clearTimeout(searchTask);
		}
		searchTask = setTimeout(function() {
			searchTask = null;
			doSearch(Q.getTarget(e).value);
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
				callback: function (data) {
					feed.updateFeed(data);
					feed.search.focus();
				}
			});
		}
	}
	
	Q.intercept(feed, {
		updateTitlebar: function() {
			this.$proceed.apply(this, arguments);
			if (!this.search) {
				this.search = Q.dom({
					tag: 'label',
					items: [
						'search tags', {
						tag: 'input',
						value: lastSearch,
						listeners: {
							change: onChange,
							keyup: onChange,
							blur: onChange
						}
					}]
				});
			}
			Q.add(this.head, this.search);
		}
	});
	feed.render(document.body);
	doSearch(lastSearch);
});