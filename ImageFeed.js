/* ImageFeed is component that will generate HTML for an image feed using a given data object.
 * It was designed to be used as a Flickr feed, but it is generalized for any collection of pictures.
 * Feeds in a different data format could be easily transformed to match this format.
 */
Q.ImageFeed = Q.extend({
	// The target node into which the feed will be rendered.
	renderTo: undefined,
	// The id for the feed's main element.
	id: undefined,
	/* The image feed data object to load. This is not required; the feed can be loaded later using #updateFeed.
	 * If this property is specified at construction time, #updateFeed is called immediately.
	 * The structure for #feed and the object parameter to #updateFeed should match Flickr feed structure: {
	 *		link,			The 'href' for the anchor tag that will wrap the title link and logo in the titlebars
	 *		title,			The text for the title link in the titlebars
	 *		items: [{		A collection of image descriptor objects, one for each image
	 *			link,		The 'href' for the anchor tag that will wrap the displayed image
	 *			title,		Will be applied as a tooltip using the 'title' property of the image
	 *			src			Flickr uses an object to describe the media source, but to keep the code generalized for other collections of pictures, I think it makes sense to accept a flat 'src' property as well.
	 *			- OR -
	 *			media: {
	 *				m
	 *			}
	 *		}]
	 *	}
	 */
	feed: undefined,
	
	// CSS classes for the feed's various elements.
	cls: 'q-imagefeed',
	titleCls: 'q-imagefeed-titlebar',
	logoCls: 'q-imagefeed-logo',
	bodyCls: 'q-imagefeed-body',
	cardCls: 'q-imagefeed-card',
	// Prefix string for generated ids
	idPrefix: 'q-imagefeed-',
	cardIdPrefix: 'card-',
	imgIdPrefix: 'img-',
	
	init: function(config) {
		Q.apply(this, config);
		this.id = this.id || Q.id(this.idPrefix);
		this.cardIdPrefix = this.id + '-' + this.cardIdPrefix;
		this.imgIdPrefix = this.id + '-' + this.imgIdPrefix;
		if (!Q.isDom(this.renderTo)) {
			this.renderTo = Q.get(this.renderTo);
		}
		// Sequence for assigning ids to the generated wrappers.
		this.idSeq = 0;
		if (this.renderTo) {
			this.render(this.renderTo);
		}
		if (this.feed) {
			this.updateFeed(this.feed);
		}
	},
	
	// Creates the main DOM structure of the feed (the body and titlebars) and renders it into the renderTo target.
	render: function(renderTo) {
		this.el = Q.dom({
			tag: 'div',
			className: this.cls,
			items: [
				this.head = Q.dom({
					tag: 'div',
					className: this.titleCls
				}),
				this.body = Q.dom({
					tag: 'div',
					className: this.bodyCls
				}),
				this.foot = Q.dom({
					tag: 'div',
					className: this.titleCls
				})
			]
		});
		if (this.id) {
			this.el.id = this.id;
		}
		this.renderTo = renderTo;
		renderTo.appendChild(this.el);
	},
	
	// Clears and reloads the feed for a new collection of pictures.
	// The 'feed' parameter's format should match the format described for the #feed property.
	updateFeed: function(feed) {
		var images = feed.items,
			link = [{
				tag: 'a',
				href: feed.link,
				items: {
					tag: 'span',
					className: this.logoCls,
				}
			}, {
				tag: 'a',
				href: feed.link,
				items: feed.title
			}];
		this.clear();
		this.feed = feed;
		if (feed.link && feed.title) {
			Q.add(this.head, link);
			Q.add(this.foot, link);
			this.show(this.head);
			this.show(this.foot);
		} else {
			this.hide(this.head);
			this.hide(this.foot);
		}
		for (var i = 0; i < images.length; i++) {
			this.addImage(images[i]);
		}
	},
	
	// Clears all generated HTML and resets the image id sequence.
	clear: function() {
		Q.clear(this.head);
		Q.clear(this.body);
		Q.clear(this.foot);
		// Reset id sequence
		this.idSeq = 0;
		delete this.feed;
	},
	
	show: function(el) {
		el.hidden = false;
	},
	
	hide: function(el) {
		el.hidden = true;
	},
	
	// Renders an image into the collection.
	// The format for the 'image' parameter should match the format described for an item in the #feed collection.
	addImage: function(image) {
		Q.add(this.body, {
			tag: 'div',
			id: Q.id(this.cardIdPrefix),
			className: this.cardCls,
			items: {
				tag: 'a',
				href: image.link,
				title: image.title,
				items: {
					tag: 'img',
					id: Q.id(this.imgIdPrefix),
					// If this were reused for a non-flickr feed, the image object may have a src string rather than a media object (see #feed)
					src: image.src || image.media.m
				}
			}
		});
	},
	
	getCard: function(index) {
		return this.body.childNodes[index];
	},
	
	getImage: function(index) {
		var cardId = this.getCard(index).id;
		return Q.get(this.imgIdPrefix + cardId.substring(cardId.lastIndexOf('-') + 1));
	}
});