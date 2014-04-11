// HoverFeed is an ImageFeed which overlays the image's title onto the card when it is hovered.
// @author hiebj
Q.HoverFeed = Q.ImageFeed.extend({
	addImage: function(image) {
		this.$super.addImage.call(this, image);
		var imageEl = this.getImage(this.body.childNodes.length - 1);
		imageEl.parentNode.title = '';
		Q.add(imageEl.parentNode, {
			tag: 'div',
			items: {
				tag: 'span',
				items: image.title
			}
		});
	}
});