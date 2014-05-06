Q.Container = Q.define({
	extend: Q.Component,
	
	idPrefix: 'q-container-',
	baseCls: 'q-container',
	
	constructor: 'Container',
	
	render: function(renderTo) {
		var content = this.content;
		this.content = '';
		this.$super(arguments);
		this.add(content);
	},
	
	add: function(content, data) {
		this.content = this.content || [];
		if (!Q.isEmpty(content)) {
			Q.each(content, function(item) {
				if (Q.isDom(item) || item instanceof Q) {
					item = Q(item).dom;
					this.el.add(item);
					this.content.push(item);
				} else if (typeof item === 'object') {
					if (!(item instanceof Q.Component)) {
						var constructor = (item.hasOwnProperty('constructor') ? item.constructor : Q.Component);
						item = new constructor(item);
					}
					item.render(this.el);
					this.content.push(item);
				} else {
					// It should be an HTML or template string
					// Run Q.tpl on the item using our data.
					// If there are no variables, nothing will happen.
					item = Q.dom(Q.tpl(item, data || this.getData()));
					this.el.add(item);
					this.content = this.content.concat(item);
				}
			}, this);
		}
	},
	
	remove: function(content) {
		Q.each(content, function(item) {
			if (item instanceof Q.Component) {
				item = item.getEl();
			}
			if (item instanceof Q) {
				item = item.dom;
			}
			this.el.remove(item);
			Q.remove(this.content, item);
		}, this);
	},
	
	clear: function() {
		this.remove(this.content.slice());
	}
});