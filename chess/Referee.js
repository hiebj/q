Q.chess = Q.chess || {};
Q.chess.Referee = Q.define({
	constructor: function Referee(chess) {
		this.chess = chess;
	},
	
	// Returns an array of { x, y } objects.
	getLegalMoves: function(piece) {
		var x,
			y,
			legal = [],
			move;
		for (y = 0; y < 8; y++) {
			for (x = 0; x < 8; x++) {
				move = { x: x, y: y };
				if (this.isMoveLegal(piece, move, this.chess.getPiece(move))) {
					legal.push(move);
				}
			}
		}
		return legal;
	},
	
	// move is an { x, y } object
	isMoveLegal: function(piece, move, enemy) {
		// These checks are ordered with the most demanding last, so that we only check them when we have to.
		// Cannot move out of bounds
		return  (move.x >= 0 && move.x < 8 && move.y >= 0 && move.y < 8) &&
				// Cannot move on top of a piece owned by the same player
				!(enemy && enemy.player === piece.player) &&
				// Check move legality based on piece type
				piece.isMoveLegal(move, !!enemy) && 
				// Cannot move through other pieces (whether owned or enemy)
				!this.isBlocked(piece, move);
	},
	
	// move is an { x, y } object
	isBlocked: function(piece, move) {
		var blocked = false,
			d = piece.delta(move),
			straight = d.x === 0 || d.y === 0,
			diagonal = d.x === d.y,
			// Only step along an axis if we moved along that axis
			stepX = d.x ? (move.x > piece.pos.x ? -1 : 1) : 0,
			stepY = d.y ? (move.y > piece.pos.y ? -1 : 1) : 0,
			// Take the first step (the target piece can't block for itself)
			pos = {
				x: move.x + stepX,
				y: move.y + stepY
			};
		// GUARANTEED: pieces that can be blocked *only* move in straight or perfectly diagonal lines
		// Any piece that does not move in this manner (e.g. Knight) is considered to be unblockable (Knights can jump).
		if (straight || diagonal) {
			// Iterate through the steps between the target (pos) and our piece.
			while (!piece.isAt(pos)) {
				if (this.chess.getPiece(pos)) {
					blocked = true;
					break;
				}
				pos.x += stepX;
				pos.y += stepY;
			}
		}
		return blocked;
	},
	
	isCheck: function(player) {
		return this.getThreatMap(this.chess.otherPlayer(player))[this.hashPos(this.chess.getKing(player).pos)];
	},
	
	// build a set of all the opposing (non-current) king's legal moves
	// subtract the combined set of all the current player's legal moves
	isMate: function() {
		var chess = this.chess,
			threatened = this.getThreatMap(chess.player),
			king = chess.getKing(chess.otherPlayer()),
			escapes = this.getLegalMoves(king);
		escapes.push(king.pos);
		// Clone the array so we can remove from it during iteration
		Q.each(escapes.slice(), function(escape) {
			if (threatened[this.hashPos(escape)]) {
				Q.remove(escapes, escape);
			}
		}, this);
		// TODO escape checkmate by blocking or killing. Use defending player's threat map to determine if the threatening piece can be killed or blocked.
		return !escapes.length;
	},
	
	getThreatMap: function(player) {
		var set = {};
		// order n3, but kind of unavoidable. We have to check every piece
		// TODO make this more efficient
		Q.each(this.chess.pieces[player], function(piece) {
			Q.each(this.getLegalMoves(piece), function(move) {
				set[this.hashPos(move)] = true;
			}, this);
		}, this);
		return set;
	},
	
	hashPos: function(pos) {
		return pos.x + ':' + pos.y;
	}
});