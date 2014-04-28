/* ImageFeed is component that will generate HTML for an image feed using a given data object.
 * It was designed to be used as a Flickr feed, but it is generalized for any collection of pictures.
 * Feeds in a different data format could be easily transformed to match this format.
 */
Q.ImageFeed = Q.define({
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
	
	// HTML templates
	// Main layout template for the component. Used by #render.
	tpl: [
		'<div id="{id}" class="{cls}">',
			'<div class="{titleCls}"></div>',
			'<div class="{bodyCls}"></div>',
			'<div class="{titleCls}"></div>',
		'</div>'
	],
	
	// Template for the title bars. Used by #updateTitlebar.
	titleTpl: [
		'<a href="{link}">',
			'<span class="{logoCls}"/>',
		'</a>',
		'<a href="{link}">{title}</a>'
	],
	
	// Template for the individual image cards. Used by #addImage.
	cardTpl: [
		'<div id="{cardId}" class="{cardCls}">',
			'<a href="{link}">',
				'<img id="{imgId}" src="{src}"/>',
				'<div {titleHidden}><span>{title}</span></div>',
			'</a>',
		'</div>'
	],
	
	constructor: function ImageFeed(config) {
		Q.copy(this, config);
		this.id = this.id || Q.id(this.idPrefix);
		this.cardIdPrefix = this.id + '-' + this.cardIdPrefix;
		this.imgIdPrefix = this.id + '-' + this.imgIdPrefix;
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
		this.renderTo = new Q(renderTo).add(Q.tpl(this.tpl, this));
		this.el = new Q(this.id);
	},
	
	// Clears and reloads the feed for a new collection of pictures.
	// The 'feed' parameter's format should match the format described for the #feed property.
	updateFeed: function(feed) {
		var images = feed.items;
		this.clear();
		this.feed = feed;
		this.updateTitlebar(feed);
		for (var i = 0; i < images.length; i++) {
			this.addImage(images[i]);
		}
	},
	
	updateTitlebar: function(feed) {
		// TODO use querying rather than traversal once it is implemented
		feed = {
			logoCls: this.logoCls,
			link: feed.link,
			title: feed.title
		};
		if (feed.link && feed.title) {
			this.el.first().add(Q.tpl(this.titleTpl, feed)).show();	// head
			this.el.last().add(Q.tpl(this.titleTpl, feed)).show();	// foot
		} else {
			this.el.first().hide();	// head
			this.el.last().hide();	// foot
		}
	},
	
	// Clears all generated HTML and resets the image id sequence.
	clear: function() {
		this.el.down().clear().	// head
				next().clear().	// body
				next().clear();	// foot
		// Reset id sequence
		this.idSeq = 0;
		delete this.feed;
	},
	
	// Renders an image into the collection.
	// The format for the 'image' parameter should match the format described for an item in the #feed collection.
	addImage: function(image) {
		// If this were reused for a non-flickr feed, the image object may have a src string rather than a media object (see #feed)
		this.el.down().next(). // body
				// Copy the entire image object into our tpl params
				add(Q.tpl(this.cardTpl, Q.copy({
					src: image.src || image.media.m,
					cardId: Q.id(this.cardIdPrefix),
					cardCls: this.cardCls,
					imgId: Q.id(this.imgIdPrefix),
					titleHidden: Q.isEmpty(image.title) ? 'hidden' : ''
				}, image)));
	}
});