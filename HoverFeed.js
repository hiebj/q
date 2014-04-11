// HoverFeed is an ImageFeed which overlays the image's title onto the card when it is hovered.
Q.HoverFeed = Q.ImageFeed.extend({
	addImage: function(image) {
		this.$super.addImage.call(this, image);
		var imageEl = this.getImage(this.body.childNodes.length - 1);
		imageEl.parentNode.title = '';
		Q.add(imageEl.parentNode, {
			tag: 'span',
			hidden: true,
			items: image.title
		}, 0);
		Q.on(imageEl, 'mouseover', this.onMouseover, this);
	},
	
	onMouseover: function(e) {
		var overlay = Q.getTarget(e).previousSibling;
		if (overlay !== this.overlay) {
			if (this.overlay) {
				this.hide(this.overlay);
			}
			this.show(overlay);
			this.overlay = overlay;
		}
	}
});