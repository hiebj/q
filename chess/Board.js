Q.ns('Q.chess').Board = Q.define({
	renderTo: undefined,
	
	boardCls: 'q-chess-board',
	rowCls: 'q-chess-row',
	altRowCls: 'q-chess-row-alt',
	cellCls: 'q-chess-cell',
	altCellCls: 'q-chess-cell-alt',
	selectedCellCls: 'q-chess-cell-selected',
	legalCellCls: 'q-chess-cell-legal',
	
	tpl: '<table class="{boardCls}">{rows}</table>',
	rowsTpl: [
		'<tr class="{rowCls}">{cells}</tr>',
		'<tr class="{altRowCls}">{cells}</tr>'
	],
	cellsTpl: [
		'<td class="{cellCls}"></td>',
		'<td class="{altCellCls}"></td>'
	],
	
	constructor: function Board(config) {
		Q.copy(this, config);
		if (this.renderTo) {
			this.render(this.renderTo);
		}
	},
	
	repeatTpl: function(tpl, times) {
		var original = tpl;
		for (i = 0; i < times; i++) {
			tpl = tpl.concat(original);
		}
		return tpl;
	},
	
	render: function(renderTo) {
		this.renderTo = renderTo = renderTo || this.renderTo;
		if (this.el) {
			this.el.removeSelf();
		}
		this.el = new Q(Q.tpl(this.tpl, {
			boardCls: this.boardCls,
			rows: Q.tpl(this.repeatTpl(this.rowsTpl, 3), {
				rowCls: this.rowCls,
				altRowCls: this.altRowCls,
				cells: Q.tpl(this.repeatTpl(this.cellsTpl, 3), {
					cellCls: this.cellCls,
					altCellCls: this.altCellCls
				})
			})
		}));
		Q(renderTo).add(this.el);
	},
	
	getCells: function() {
		// TODO use querying once implemented
		var cells = [];
		Q.each(this.el.first().children(), function(row) {
			cells = cells.concat(Q(row).children());
		});
		return cells;
	},
	
	// Get the XY location of a cell
	getXY: function(cell) {
		cell = Q(cell);
		return {
			x: cell.index(),
			y: cell.up().index()
		};
	},
	
	getCell: function(pos) {
		return Q(this.el.first().children()[pos.y]).children()[pos.x];
	},
	
	selectCell: function(pos, legalMoves) {
		this.clearSelected();
		Q(this.getCell(pos)).addCls(this.selectedCellCls);
		Q.each(legalMoves, function(move) {
			Q(this.getCell(move)).addCls(this.legalCellCls);
		}, this);
		this.selected = pos;
		this.legalMoves = legalMoves;
	},
	
	clearSelected: function() {
		// TODO use querying when it is implemented
		if (this.selected) {
			Q(this.getCell(this.selected)).removeCls(this.selectedCellCls);
			Q.each(this.legalMoves, function(move) {
				Q(this.getCell(move)).removeCls(this.legalCellCls);
			}, this);
			delete this.selected;
			delete this.legalMoves;
		}
	}
});