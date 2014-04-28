Q(window).on('load', function() {
	new Q.chess.Chess({
		renderTo: document.body
	}).startGame();
});