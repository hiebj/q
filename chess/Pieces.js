Q.ns('Q.chess').Piece = Q.define({
	pos: undefined,
	origin: undefined,
	player: undefined,
	
	clsPrefix: 'q-chess-piece',
	
	constructor: function Piece(config) {
		Q.copy(this, config);
		this.origin = Q.copy({}, this.pos);
	},
	
	// pos is an { x, y } object
	isAt: function(pos) {
		return this.pos.x === pos.x && this.pos.y === pos.y;
	},
	
	// Placeholder; subclasses will implement
	isMoveLegal: function(move, attack) {
		return true;
	},
	
	// move is an { x, y } object
	delta: function(move) {
		return {
			x: Math.abs(this.pos.x - move.x),
			y: Math.abs(this.pos.y - move.y)
		};
	},
	
	getCls: function() {
		return this.clsPrefix + ' ' +
				this.clsPrefix + '-' + this.player + ' ' +
				this.clsPrefix + '-' + this.player + '-' + this.getName().toLowerCase();
	},
	
	getName: function() {
		return this.constructor.name;
	},
	
	getHTML: function() {
		// TODO use icons
		return '<span>' + this.getName().charAt(0) + '</span>';
	}
});

Q.ns('Q.chess').King = Q.define({
	extend: Q.chess.Piece,
	constructor: 'King',
	isMoveLegal: function(move) {
		var d = this.delta(move);
		return this.$super.isMoveLegal.apply(this, arguments) &&
			// Can move one pace in any direction
			(d.x <= 1 && d.y <= 1);
	}
});

Q.ns('Q.chess').Queen = Q.define({
	extend: Q.chess.Piece,
	constructor: 'Queen',
	isMoveLegal: function(move) {
		var d = this.delta(move);
		return this.$super.isMoveLegal.apply(this, arguments) &&
			// Can move in perfectly straight or diagonal lines
			((d.x === 0 || d.y === 0) || (d.x === d.y));
	}
});

Q.ns('Q.chess').Bishop = Q.define({
	extend: Q.chess.Piece,
	constructor: 'Bishop',
	isMoveLegal: function(move) {
		var d = this.delta(move);
		return this.$super.isMoveLegal.apply(this, arguments) &&
			// Can move only in perfectly diagonal lines
			(d.x === d.y);
	}
});

Q.ns('Q.chess').Knight = Q.define({
	extend: Q.chess.Piece,
	constructor: 'Knight',
	isMoveLegal: function(move) {
		var d = this.delta(move);
		return this.$super.isMoveLegal.apply(this, arguments) &&
			// Moves only in the characteristic 'L' shape
			((d.x === 2 && d.y === 1) || (d.y === 2 && d.x === 1));
	},
	getHTML: function() {
		// TODO use icons
		return '<span>' + this.getName().substr(0, 2) + '</span>';
	}
});

Q.ns('Q.chess').Rook = Q.define({
	extend: Q.chess.Piece,
	constructor: 'Rook',		
	isMoveLegal: function(move) {
		var d = this.delta(move);
		return this.$super.isMoveLegal.apply(this, arguments) &&
			// Can move only in perfectly straight lines
			(d.x === 0 || d.y === 0);
	}
});

Q.ns('Q.chess').Pawn = Q.define({
	extend: Q.chess.Piece,
	constructor: 'Pawn',
	isMoveLegal: function(move, attack) {
		var first = this.pos.y === this.origin.y,
			d = this.delta(move);
		return this.$super.isMoveLegal.apply(this, arguments) &&
			// Pawns can only move forward (black is on top)
			((this.player === 'black' && move.y > this.pos.y) || (this.player === 'white' && move.y < this.pos.y)) &&
			// Pawns can normally only move forward one, and can move laterally if and only if they are attacking
			(((d.y === 1 && ((d.x === 0 && !attack) || (d.x === 1 && attack))) ||
			// On the first move they can move two spaces, so long as they are not attacking
			(first && d.y === 2 && d.x === 0 && !attack)));
	}
});