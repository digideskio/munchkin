$(document).ready(function() {
	var socket;
	
	function add_player(player) {
		var new_player = $(".player.template").clone();
		new_player.removeClass("template");
		new_player.find(".player_name").text(player.name);
		new_player.attr("player_id", player.id);
		new_player.find(".player_level").text(player.level);
		new_player.find(".player_bonus").text(player.bonus);
		new_player.find(".player_total").text(player.total);

		for( var i in player.hand ) {
			new_player.find('.player_hand').append(create_card(player.hand[i]));
		}

		for( var i in player.carried ) {
			new_player.find('.player_carry').append(create_card(player.carried[i]));
		}

		existing_player = $('.player[player_id='+player.id+']');
		if( existing_player.length ) {
			existing_player.before(new_player);
			existing_player.remove()
		} else {
			$('#game_board').append(new_player);
		}
	};

	function set_players(players) {
		clear_players();

		for(var i in players) {
			add_player(players[i]);
		}
	};

	function clear_players() {
		$(".player").not(".template").remove();
	};

	function add_card(player, card) {
		$(".player[player_id="+player+"] .player_hand").append(create_card(card));
	};

	function create_card(card) {
		var new_card = $('.card.template').clone();
		new_card.removeClass("template");
		new_card.css('background-image', 'url('+card.image+')');
		new_card.attr('card_id', card.id);
		new_card.find('.action_CARRY').click(function() {
			socket.send(JSON.stringify({
				'type': 'ACTION',
				'action': {
					'move_type': 'CARRY',
					'card':card.id,
					'target': null,
					'player': parseInt(new_card.parents('.player').attr('player_id')),
				}
			}));
		});
		return new_card;
	};

	$("#connect").click(function() {
		if (socket) {
			socket.close();
		}

		socket = new WebSocket("ws://localhost:800/socket/"+$("#username").val()+"/"+$("#game_name").val());

		socket.onopen = function(){
		};

		socket.onmessage = function(msg) {
			var msg = JSON.parse(msg.data);

			if (msg.type == "players") {
				set_players(msg.players);
			} else if (msg.type == "player") {
				add_player(msg.player);
			} else if (msg.type == "draw") {
				add_card(msg.player, msg.card);
			} else if (msg.type == "valid_moves") {
				$('.action').hide();
				for(var card_id in msg.moves) {
					var moves = msg.moves[card_id];

					for( var i in moves ) {
						var move = moves[i];
						$('.card[card_id='+card_id+'] .action_'+move.type).show();
					}
				}
			} else if (msg.type == "message") {
				if( msg.message.from == "system" ) {
					$('#console').append($('<div class="console_message system_message">'+msg.message.text+'</div>'));
				}
			}
		};

	});
});