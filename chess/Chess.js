Q.chess = Q.chess || {};
Q.chess.Chess = Q.define({
	white: 'white',
	black: 'black',
	
	constructor: function Chess(config) {
		Q.copy(this, config);
		this.board = new Q.chess.Board(config);
		this.referee = new Q.chess.Referee(this);
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
			this.board.selectCell(pos, this.referee.getLegalMoves(piece));
		} else if (selected) {
			delete this.selected;
			this.board.clearSelected();
			if (this.attemptMove(selected, pos)) {
				this.nextTurn();
			}
		}
	},
	
	attemptMove: function(piece, move) {
		var turn = false,
			enemy = this.getPiece(move),
			player = this.player,
			otherPlayer = this.otherPlayer(),
			pos = piece.pos;
		if (this.referee.isMoveLegal(piece, move, enemy)) {
			turn = true;
			if (enemy) {
				this.removePiece(enemy);
			}
			this.movePiece(piece, move);
			if (this.referee.isCheck(player)) {
				turn = false;
				alert('Illegal move: can\'t put the King in danger');
				// Revert the move
				this.movePiece(piece, pos);
				if (enemy) {
					this.placePiece(enemy);
					this.pieces[enemy.player].push(enemy);
				}
			} else if (this.referee.isMate()) {
				turn = false;
				alert('Checkmate: ' + player + ' wins');
				this.startGame();
			} else if (this.referee.isCheck(otherPlayer)) {
				alert('Check: ' + otherPlayer);
			}
		}
		return turn;
	},
	
	removePiece: function(piece) {
		Q.remove(this.pieces[piece.player], piece);
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