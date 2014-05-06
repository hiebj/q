Q.Component = Q.define({
	renderTo: undefined,
	id: undefined,
	baseCls: 'q-component',
	cls: '',
	content: '',
	tpl: '<div id="{id}" class="{baseCls} {cls}">{content}</div>',
	
	constructor: function Component(config) {
		Q.copy(this, config);
		Q.id(this);
		if (this.renderTo) {
			this.render(this.renderTo);
		}
	},
	
	render: function(renderTo) {
		var tpl = this.getTpl(),
			data = this.getData();
		this.renderTo = renderTo = renderTo || this.renderTo;
		if (this.el) {
			this.el.removeSelf();
		}
		this.el = new Q(Q.tpl(this.getTpl(), this.getData()));
		if (renderTo) {
			Q(renderTo).add(this.el);
		}
	},
	
	getEl: function() {
		return this.el;
	},
	
	getTpl: function() {
		return this.tpl;
	},
	
	getData: function() {
		return this;
	}
});