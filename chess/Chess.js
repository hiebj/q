Q.chess = Q.chess || {};
Q.chess.Chess = Q.define({
	white: 'white',
	black: 'black',
	
	constructor: function Chess(config) {
		Q.copy(this, config);
		this.board = new Q.chess.Board(config);
	},
	
	startGame: function() {
		var pieces = this.pieces = {},
			white = this.white,
			black = this.black;
		pieces[white] = this.initPieces(white);
		pieces[black] = this.initPieces(black).reverse();
		this.board.render();
		this.bindEvents();
		Q.each(pieces[white].concat(pieces[black]), function(piece) {
			this.placePiece(piece);
		}, this);
		this.nextTurn();
	},
	
	bindEvents: function() {
		Q.each(this.board.getCells(), function(cell) {
			Q(cell).on('click', this.onClick, this);
		}, this);
	},
	
	initPieces: function(player) {
		// Black is on top
		var y = player === this.black ? 0 : 7,
			x = 0,
			config = function (x) {
				return { player: player, board: this, pos: { x: x, y: y } };
			},
			king,
			// Add officers
			pieces = [
				new Q.chess.Rook(config(x++)),
				new Q.chess.Knight(config(x++)),
				new Q.chess.Bishop(config(x++)),
				new Q.chess.Queen(config(x++)),
				king = new Q.chess.King(config(x++)),
				new Q.chess.Bishop(config(x++)),
				new Q.chess.Knight(config(x++)),
				new Q.chess.Rook(config(x++))
			];
		// Add pawns
		y += player === this.black ? 1 : -1;
		for (x = 0; x < 8; x++) {
			pieces.push(new Q.chess.Pawn(config(x)));
		}
		pieces.king = king;
		return pieces;
	},
	
	// pos is an { x, y } object
	getPiece: function(pos) {
		var pieces = this.pieces,
			pieceAt = null;
		pieces = pieces[this.white].concat(pieces[this.black]);
		Q.each(pieces, function(piece) {
			if (piece.isAt(pos)) {
				pieceAt = piece;
				return false;
			}
		});
		return pieceAt;
	},
	
	getKing: function(player) {
		return this.pieces[player].king;
	},
	
	onClick: function(cell, e) {
		var player = this.player,
			pos = this.board.getXY(cell),
			piece = this.getPiece(pos),
			selected = this.selected;
		if (piece && piece.player === this.player) {
			this.selected = piece;
			this.board.selectCell(pos, this.getLegalMoves(piece));
		} else if (selected) {
			delete this.selected;
			this.board.clearSelected();
			if (this.attemptMove(selected, pos)) {
				this.nextTurn();
			}
		}
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
				if (this.isMoveLegal(piece, move, this.getPiece(move))) {
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
				if (this.getPiece(pos)) {
					blocked = true;
					break;
				}
				pos.x += stepX;
				pos.y += stepY;
			}
		}
		return blocked;
	},
	
	attemptMove: function(piece, move) {
		var turn = false;
			enemy = this.getPiece(move),
			player = this.player,
			otherPlayer = this.otherPlayer(),
			pos = piece.pos;
		if (this.isMoveLegal(piece, move, enemy)) {
			turn = true;
			if (enemy) {
				this.removePiece(enemy);
			}
			this.movePiece(piece, move);
			if (this.isCheck(player)) {
				turn = false;
				alert('Illegal move: can\'t put the King in danger');
				// Revert the move
				this.movePiece(piece, pos);
				if (enemy) {
					this.placePiece(enemy);
					this.pieces[enemy.player].push(enemy);
				}
			} else if (this.isMate()) {
				turn = false;
				alert('Checkmate: ' + player + ' wins');
				this.startGame();
			} else if (this.isCheck(otherPlayer)) {
				alert('Check: ' + otherPlayer);
			}
		}
		return turn;
	},
	
	arrayRemove: function(array, item) {
		var index = array.indexOf(item);
		if (index !== -1) {
			array.splice(index, 1);
		}
		return array;
	},
	
	removePiece: function(piece) {
		this.arrayRemove(this.pieces[piece.player], piece);
		Q(this.board.getCell(piece.pos)).removeCls(piece.getCls()).clear();
	},
	
	movePiece: function(piece, move) {
		Q(this.board.getCell(piece.pos)).removeCls(piece.getCls()).clear();
		this.placePiece(piece, move);
	},
	
	placePiece: function(piece, pos) {
		pos = pos || piece.pos;
		piece.pos = pos;
		Q(this.board.getCell(piece.pos)).addCls(piece.getCls()).add(piece.getHTML());
	},
	
	isCheck: function(player) {
		return this.getThreatMap(this.otherPlayer(player))[this.hashPos(this.getKing(player).pos)];
	},
	
	// build a set of all the opposing (non-current) king's legal moves
	// subtract the combined set of all the current player's legal moves
	isMate: function() {
		var threatened = this.getThreatMap(this.player),
			king = this.getKing(this.otherPlayer()),
			escapes = this.getLegalMoves(king);
		escapes.push(king.pos);
		// Clone the array so we can remove from it during iteration
		Q.each(escapes.slice(), function(escape) {
			if (threatened[this.hashPos(escape)]) {
				this.arrayRemove(escapes, escape);
			}
		}, this);
		// TODO escape checkmate by blocking or killing. Use defending player's threat map to determine if the threatening piece can be killed or blocked.
		return !escapes.length;
	},
	
	getThreatMap: function(player) {
		var set = {};
		// order n3, but kind of unavoidable. We have to check every piece
		// TODO make this more efficient
		Q.each(this.pieces[player], function(piece) {
			Q.each(this.getLegalMoves(piece), function(move) {
				set[this.hashPos(move)] = true;
			}, this);
		}, this);
		return set;
	},
	
	hashPos: function(pos) {
		return pos.x + ':' + pos.y;
	},
	
	otherPlayer: function(player) {
		player = player || this.player;
		if (player && player.toLowerCase() === this.white) {
			return this.black;
		} else {
			return this.white;
		}
	},
	
	nextTurn: function() {
		if (this.player) {
			Q.each(this.pieces[this.player], function(piece) {
				Q(this.board.getCell(piece.pos)).removeCls(piece.clsPrefix + '-active');
			}, this);
		}
		this.player = this.otherPlayer();
		Q.each(this.pieces[this.player], function(piece) {
			Q(this.board.getCell(piece.pos)).addCls(piece.clsPrefix + '-active');
		}, this);
	}
});
