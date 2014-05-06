/* ImageFeed is component that will generate HTML for an image feed using a given data object.
 * It was designed to be used as a Flickr feed, but it is generalized for any collection of pictures.
 * Feeds in a different data format could be easily transformed to match this format.
 */
Q.ImageFeed = Q.define({
	extend: Q.Container,
	
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
	idPrefix: 'q-imagefeed-',
	titleCls: 'q-imagefeed-titlebar',
	logoCls: 'q-imagefeed-logo',
	cardCls: 'q-imagefeed-card',
	// Prefix strings for generated ids
	cardIdPrefix: 'card-',
	imgIdPrefix: 'img-',
	
	content: [
		'<div class="{titleCls}"></div>',
		{
			constructor: Q.Container,
			cls: 'q-imagefeed-body'
		},
		'<div class="{titleCls}"></div>'
	],
	
	// HTML templates
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
		this.$super(arguments);
		this.cardIdPrefix = this.id + '-' + this.cardIdPrefix;
		this.imgIdPrefix = this.id + '-' + this.imgIdPrefix;
		if (this.feed) {
			this.updateFeed(this.feed);
		}
	},
	
	render: function(renderTo) {
		this.$super(arguments);
		this.body = this.content[1];
	},
	
	// Clears and reloads the feed for a new collection of pictures.
	// The 'feed' parameter's format should match the format described for the #feed property.
	updateFeed: function(feed) {
		var images = feed.items;
		this.clear();
		this.feed = feed;
		this.updateTitlebar(feed);
		Q.each(images, function(image) {
			this.body.add(this.createImage(image));
		}, this);
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
		this.el.first().clear();
		this.body.clear();
		this.el.last().clear();
		delete this.feed;
	},
	
	// Renders an image into the collection.
	// The format for the 'image' parameter should match the format described for an item in the #feed collection.
	createImage: function(image) {
		// If this were reused for a non-flickr feed, the image object may have a src string rather than a media object (see #feed)
		return Q.tpl(this.cardTpl, Q.copy({
				src: image.src || image.media.m,
				cardId: Q.id(this.cardIdPrefix),
				cardCls: this.cardCls,
				imgId: Q.id(this.imgIdPrefix),
				titleHidden: Q.isEmpty(image.title) ? 'hidden' : ''
			}, image));
	}
});