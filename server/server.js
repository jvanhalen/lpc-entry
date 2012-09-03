/**
  * Copyright (c) 2012 GAS team.
  *
  * Permission is hereby granted, free of charge, to any person obtaining a copy
  * of this software and associated documentation files (the "Software"), to deal
  * in the Software without restriction, including without limitation the rights
  * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  * copies of the Software, and to permit persons to whom the Software is
  * furnished to do so, subject to the following conditions:
  *
  * The above copyright notice and this permission notice shall be included in
  * all copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  * THE SOFTWARE.
  */
var Maple = require('./maple/Maple');
var clientToUsername = [];
var PF = require('pathfinding');
var configs = require('../json/configs'); 			// Game configuration file

var api = require('./api');

var LOGIC_RATE = 10; // Logic rate in milliseconds
var TICK_RATE = 3; // Tick rate in milliseconds

var ONE_SECOND = 1000 / TICK_RATE;
var TWO_SECONDS = 2000 / TICK_RATE;
var FIVE_SECONDS = 1000 / TICK_RATE;
var TEN_SECONDS = 10000 / TICK_RATE;
var THIRTY_SECONDS = 30000 / TICK_RATE;

var ROUND_LENGTH = TWO_SECONDS; 					// Round length, round means the "free action" period after the management period
var INITIAL_MANAGEMENT_PERIOD = THIRTY_SECONDS; 	// Initial management period after the gladiator placement
var MANAGEMENT_PERIOD = FIVE_SECONDS; 				// Management period after the initial round

// Test -----------------------------------------------------------------------
var GASServer = Maple.Class(function(clientClass) {
    Maple.Server(this, clientClass);

}, Maple.Server, {

	pointOfReference: 0, 	// ticks
	paused: false,   		// state
	duration: 0, 			// for how long
	ai: {
        proc: null, // AI process, must be set before calling send()
        id: "computer",
        /* Fancy wrapper for compatibility with Maple client message sending */
        send: function( name, mydata ){

            //console.log('AI SEND: ' + name+ ',' + JSON.stringify(mydata));
            var msg = "";

            // workaround for messaging differences
            if ( typeof mydata[0] == "string" )
                msg = JSON.parse(mydata[0]);
            else
                msg = JSON.parse(JSON.stringify(mydata[0]));


            msg["name"] = name;
            //console.log('From AI: '+JSON.stringify(msg));
            this.proc.send(msg);
        }
    },					// Game ai

	battleSessions: {}, // which battless are active.
	challenges: [], // which challenges are currently active
	started: function() {
	console.log('Server initializing...');
	this.init();
		console.log('Server startup complete.');
		/*
		  how to use createGridFromFile:
		  -----------------------------
		  var grid = this.createGridFromFile('arena');

		  how to use A* to get path from point a to point b:
		  -------------------------------------------------
		  var finder = new PF.AStarFinder();
		  var path = finder.findPath( 8,13,  8,14,  grid.clone() );
		  console.log('Path:'+JSON.stringify(path));
		  path = finder.findPath( 8,13,   9,13,   grid.clone() );
		  console.log('Path:'+JSON.stringify(path));
		*/

    },

    /* returns Maple client by username.              
     * when parameter for withAIplayers is passed, checks also 
     * AI players.
     */
    getClientByUsername: function(username, withAIplayers) {
        for( var c=0; c < this.getClients().length; c++)
        {
            if ( clientToUsername[this.getClients().getAt(c).id] === username ){
                return this.getClients().getAt(c);
            }
        }

        if ( withAIplayers ) {
            for( user in configs.npcs )
            {
                if ( configs.npcs[user] == username )
                {
                    return this.ai;
                }
            }
        }
        
        return null;
    },


    update: function(t, tick) {
        //console.log(this.getClients().length, 'client(s) connected', t, tick, this.getRandom());

        if ( this.paused == true )
        {
            if ( tick - this.pointOfReference >= MANAGEMENT_PERIOD )
            {

                this.paused = false;
                this.pointOfReference = tick;

                var msg = {
                    "name":"BATTLE_CONTROL_SYNC",
                    "paused":this.paused,
                    "duration":ROUND_LENGTH,
                    "start":this.pointOfReference
                };
                var data = [];
                data.push(msg);
                // sends to ALL clients at the moment, but needs to send for
                // only battlesrs and potential viewers.
                for(var c = 0; c< this.getClients().length; c++)
                {
                    this.getClients().getAt(c).send(data[0].name, data);
                }
            }
        }
        else
        {
            if ( tick - this.pointOfReference >= ROUND_LENGTH )
            {
                this.paused = true;
                this.pointOfReference = tick;
                var msg = [{
                    "name":"BATTLE_CONTROL_SYNC",
                    "paused":this.paused,
                    "duration":MANAGEMENT_PERIOD,
                    "start":this.pointOfReference
                }];
                // sends to ALL clients at the moment, but needs to send for
                // only battlesrs and potential viewers.
                for(var c = 0; c< this.getClients().length; c++)
                {
                    this.getClients().getAt(c).send(msg[0].name, msg);
                }
            }

        }

        // make object move on client side.
        /*if ( this.getClients().length > 0 )
        {
            var moveCmd = {
                "name": "MOVE_REQUEST",
                "type": 50,
                "username": "oldman",
                "oldpos":
                [{"x": 1,
                  "y": 1}],
                "newpos":
                [{"x": 1,
                  "y": 1}],
                "id":"objectid"
            }
            var data = [];
            data[0] = moveCmd;
            this.getClients().getAt(0).send(moveCmd.type, data );
        }*/
    },

    stopped: function() {
        console.log('Server stopped');
		this.broadcast(0, ['-- server halted --']);
    },

    connected: function(client) {
        console.log('Connected:', client.id);
    },

    message: function(client, type, tick, data) {

		//console.log("message:", type, "data", data);
		// TODO: Ugly JSON data will crash our server - fix it
		this.handleClientRequest(client, type, tick, data);

    },

    requested: function(req, res) {
        console.log('HTTP Request');
		//console.log(req);
		//console.log(res);
    },

    disconnected: function(client) {

		var playerNames = { players:[] }
		playerNames.players.push( clientToUsername[client.id]);

		for( var c=0; c < this.getClients().length; c++)
		{
		console.log("Updating:", this.getClients().getAt(c).id);
		this.getClients().getAt(c).send("PLAYER_DISCONNECTED_PUSH", [playerNames]);
		}
		delete clientToUsername[client.id];
			console.log('Disconnected:', client.id);
    },

    init: function() {

	    // Handle CTRL-C in server
	    var tty = require("tty");

	    process.openStdin().on("keypress", function(chunk, key) {
	        if(key && key.name === "c" && key.ctrl) {
	            console.log("CTRL-C shut down the server");
	            srv.broadcast(1, ['Server shutdown detected']);
	            process.exit();
	        }
	    });

		// Init game AI
		if(this.ai != null) {
			var aiProcess = require('child_process');
            var that = this;
			this.ai.proc = aiProcess.fork('./server/ai');

			// Handle messages coming from the CHILD process
			this.ai.proc.on('message', function(message) {
			    //console.log('PARENT received message from ai CHILD process', message);
                message = JSON.parse(message);
			    switch(message.name) {
                default:
                    console.log("Handling message from CHILD process:", message.type);
                    that.handleClientRequest(that.ai, message.type, that.getTime(), JSON.stringify(message.data));

			  }

			});
            // Delay AI init so usercache is ready
            setTimeout(function(){
                that.ai.send('AI_INIT', ['{}']);
            }, 2500 );

			// Send a message to the CHILD process
			/*this.ai.send('AI_MESSAGE_EXAMPLE', [{action: "cast a nice spell", params: {name: "Magic missile", type: "attack", damage: "2d4" } }]);*/
		}

		// Initialize api
		api.init();

    },
    querydb: function(querypath, client, type, data) {
		var options = {host: '127.0.0.1', port: 5984, path: '/'};
		var http = require('http');
		var respdata = "";
		// check that the querypath is valid or it will hang our socket
		if(querypath[0] !== "/") {
		   querypath = '/' + querypath;
		}
		options.path = querypath;
		var response = "";
		console.log("GET:", querypath);
		var req = http.get(options, function(res) {
		  res.setEncoding('utf8');
		  res.on('data', function (chunk) {
			//console.log(chunk);
			response += chunk;	// Collect the bits and pieces of the POST response
		  });
		  res.on('end', function () {
			// Finally handle the whole response message
			  console.log(response);
		  	srv.handleDbResponse(querypath, client, type, data, response);
			response = "";
		  });
		});

		req.on('error', function(e) {
		  console.log('GET: Cannot access database: ' + e.message);
		});

		// write data to request body
		//req.write('data\n');
		//req.write('data\n');
		req.end();
    },

    updatedb: function(querypath, client, type, data, content) {
		var request = require('request')

		//console.log("PUT to: " + querypath + "\n client.id: " + client.id + "\n content: " + content + "\n data: " + data);

		if(undefined === content) {
		  content = '{"foo":"bar"}';
		}

		if(querypath[0] != '/') {
		  console.log("WARNING: updatedb: received invalid querypath", querypath);
		  querypath = '/' + querypath;
		}

		//console.log("CONTENT:", content);
		//console.log("QUERYPATH:", querypath);


		request({
		  method: 'PUT',
		  uri: 'http://localhost:5984' + querypath,
		  'content-type': 'application/json',
		  'content-length': content.length,
		  'body': content

		}, function (error, response, body) {
		//console.log("BODY:", body);
			if(response) {
				if(response.statusCode == 201){
					//console.log("PUT ok for: " + querypath + "\n client.id: " + client.id + "\n content: " + content);
						srv.handleDbResponse(querypath, client, type, data, response);
					}
					else {
						console.log("PUT failed for: " + querypath + "\n client.id: " + client.id + "\n content: " + content + " with status code:" + response.statusCode);
					}
				}
				else {
					console.log("ERROR: updatedb response undefined for: " + querypath + "\n client.id: " + client.id + "\n content: " + content);
				}
			})
    },
    
    handleDbResponse: function(querypath, client, type, data, response) {
		console.log("handleDbResponse: ", type, "querypath", querypath + " : " + data+ " : " + response);
        
		switch(type)
		{
			case 'BATTLE_START_CREATE_BATTLE_REQ':
			case 'BATTLE_START_LOAD_CHALLENGER_REQ':
			case 'BATTLE_START_LOAD_DEFENDER_REQ':
			case 'BATTLE_START_LOAD_BATTLE_REQ':
			case 'BATTLE_START_STORE_PLAYERS_REQ':
			case 'BATTLE_START_STORE_PLAYERS_RES':
			case 'BATTLE_START_UPDATE_CHALLENGER':
			case 'BATTLE_START_UPDATE_DEFENDER':
				 this.handleCreateNewBattle(null, null, type, data, response);
			break;

			case 'CHALLENGE_REQ_DEFENDER_CHECK':
				console.log(response);
				 if ( JSON.parse(response) != null && JSON.parse(response).ingame == null )
				 {
					 console.log('About to check  challenger...');
					 this.querydb('/users/'+JSON.parse(data).username, client, 'CHALLENGE_REQ_ONLINE_CHECK', data);
				 }
				 else
				 {
					 console.log('Seeking challenger, negative response...');
					 for(var c=0; c<this.getClients().length;c++)
					 {
						 if (clientToUsername[this.getClients().getAt(c).id] == JSON.parse(data).username)
						 {
							 console.log('Sending response to challenger');
							 this.getClients().getAt(c).send('CHALLENGE_RES', ['{"response":"NOK", "reason":"defender already in battles. "}']);
							 break;
						 }
					 }
				 }
			break;

        case 'CHALLENGE_REQ_ONLINE_CHECK':
            
            if ( JSON.parse(response) == null || JSON.parse(response).ingame != null )
            {
                var cli = this.getClientByUsername( JSON.parse(data).username)
                if ( cli != null ) {
                    cli.send('CHALLENGE_RES', ['{"response":"NOK", "reason":"challenger already in battle. "}']);
                    break;
                }
            }

            // check whether user is online.
            var defender = JSON.parse(data).defender;
            // check both live and AI players
            var defenderClient = this.getClientByUsername(defender,true);

            if ( defenderClient == null )
            {
                // user marked as defender is offline, cannot accept.
                client.send('CHALLENGE_RES',
                            ['{"response":"NOK", "reason":"Defender not available."}'])

            }
            else
            {
                // user is online, ask for acceptance.
                this.challenges.push( {
                    "state":"WAITING_ACCEPTANCE",
                    "tick":this.getTick(),
                    "defenderclient":defenderClient,
                    "defender":defender,
                    "challenger":clientToUsername[client.id]
                });
                // send challenge request for defender
                defenderClient.send('CHALLENGE_REQ',
                                    ['{"challenger":"'+ clientToUsername[client.id] + '", "defender":"'+defender+'"}']);
                // notify challenger for delivery
                client.send('CHALLENGE_RES',
                            ['{"response":"DELIVERED", "challenger":"'+clientToUsername[client.id]+'","defender":"'+defender+'" }']);
            }
		        break;

		    case 'DONT_CARE':
		break;

		default:
			console.log("handleDbresponse : default branch reached, type: ", type);
			break;
		}

    },

    handlePitQuery: function(querypath, response, client, type, data) {
		console.log('handling PitQuery' + response);
		client.send(type, [response]);
    },

    handleCreateNewBattle: function(querypath, client, type, data, response)
    {
        switch(type)
        {
            case 'BATTLE_START_REQ':
                // get unique id for battle document
                this.querydb( '/_uuids', null, 'BATTLE_START_CREATE_BATTLE_REQ', data);
            break;
			case 'BATTLE_START_CREATE_BATTLE_REQ':
				data["path"]=configs.battledb + '/' + JSON.parse(response).uuids[0];

				// create battles doc
				this.updatedb(configs.battledb + '/' + JSON.parse(response).uuids[0], null,
							  'BATTLE_START_LOAD_CHALLENGER_REQ', data, '{ \
									"history":[], \
									"initial_state":{\
										  "basetick":0, \
										  "challenger": null, \
										  "defender": null\
									}, \
									"challenger":null, \
									"defender":null\
							}');
			break;

			case 'BATTLE_START_LOAD_CHALLENGER_REQ':

				this.querydb('/users/'+data.challenger, null,
							 'BATTLE_START_LOAD_DEFENDER_REQ', data);
			break;

			case 'BATTLE_START_LOAD_DEFENDER_REQ':

				var challenger = JSON.parse(response);
				data.challenger = challenger;
				console.log(data);
				this.querydb('/users/'+data.defender, null,
							 'BATTLE_START_LOAD_BATTLE_REQ', data);
			break;

			case 'BATTLE_START_LOAD_BATTLE_REQ':
				var defender = JSON.parse(response);
				data.defender = defender;
				console.log(data);
				this.querydb(data.path, null,
							 'BATTLE_START_STORE_PLAYERS_REQ', data);
			break;

			case 'BATTLE_START_STORE_PLAYERS_REQ':
				var battles = JSON.parse(response);
				// create crude "copies"
				battles.defender = JSON.parse(JSON.stringify(data.defender));
				battles.challenger = JSON.parse(JSON.stringify(data.challenger));

				battles.initial_state.challenger = battles.challenger;
				battles.initial_state.defender = battles.defender;

				// cleanup unnecessary details
				delete battles.challenger._rev;
				battles.challenger["name"] = battles.challenger._id;
				delete battles.challenger._id;
				delete battles.defender._rev;
				battles.defender["name"] = battles.defender._id;
				delete battles.defender._id;

				var battlesStr = JSON.stringify(battles);
				console.log(battlesStr);
				// set both players into game
				data.defender.ingame = battles._id;
				data.challenger.ingame = battles._id;

				// create battles doc
				this.updatedb(data.path, null, 'BATTLE_START_STORE_PLAYERS_RES', data, battlesStr );


				// Update player ingame property
				this.updatedb('/users/'+data.challenger._id, null,
							  'BATTLE_START_UPDATE_CHALLENGER', data,
							  JSON.stringify(data.challenger));

				this.updatedb('/users/'+data.defender._id, null,
							  'BATTLE_START_UPDATE_DEFENDER', data,
							  JSON.stringify(data.defender));

			break;

			case 'BATTLE_START_STORE_PLAYERS_RES':
				console.log('Players stored into battles doc, yay!');
			break;

			case 'BATTLE_START_UPDATE_CHALLENGER':

				console.log('Challenger ingame updated');
			    // send info that game is ready
                var cli = this.getClientByUsername(data.challenger._id);

               if ( cli ) {
                    cli.send('CHALLENGE_RES',
						 ['{"response":"READY_FOR_WAR", "battles":"'+data.challenger.ingame+'"}']);
                   
                   cli.send('BATTLE_STATUS_RES', [ JSON.stringify({username:data.challenger._id, ingame:data.challenger.ingame}) ]);
               }
			    
                // NPCs never throw a challenge

			break;

			case 'BATTLE_START_UPDATE_DEFENDER':
				console.log('Defender ingame updated');

                // Defender, check also NPCs since they may be on the receiving end
                var cli = this.getClientByUsername(data.defender._id, true);
                if ( cli ) {
                    cli.send('CHALLENGE_RES',
						     ['{"response":"READY_FOR_WAR", "battles":"'+data.defender.ingame+'"}']);

				}
			break;
		}
    },

	handleClientRequest: function (client, type, tick, data) {

		console.log("handleClientRequest '" + type + "' data: " + data);

        switch(type)
        {
			case 'CREATE_USER_REQ':
				// First alternative for response messages
				var username = JSON.parse(data).username;
				var newuser = api.createUser(username, JSON.parse(data).password);

				if(newuser)
					client.send(api.message.CREATE_USER_RESP.message.name, [ api.toJSON(api.message.CREATE_USER_RESP.init(username, "OK", "User created.")) ]);
				else
					client.send(api.message.CREATE_USER_RESP.message.name, [ api.toJSON(api.message.CREATE_USER_RESP.init(username, "NOK", "Something went wrong.")) ]);

				// Tag AI controlled player
				if(JSON.parse(data).ai)
					api.setAiPlayer(username);

			break;

			case 'LOGIN_REQ':
				//TODO: make more secure login and detect/blacklist malicious login attempts (block ip, username, etc.)
				var username = JSON.parse(data).username;
   			    var userdata = api.getUser(username);
				var logged = false;
            
				for(user in clientToUsername) {
					if(clientToUsername[user] == JSON.parse(data).username) {
						logged = true;
						client.send(api.message.LOGIN_RESP.message.name, [ api.toJSON(api.message.LOGIN_RESP.init(username, "NOK", "User has already logged in game.")) ]);
						break;
					}
				}

				if(userdata && logged == false) {

                    var passwdOk = (userdata.login.password == JSON.parse(data).password); // regular users
                    var isAI = (userdata.ai == true && client == this.ai); // computer AI
                    
					if( passwdOk || isAI )  {
						client.send(api.message.LOGIN_RESP.message.name, [ api.toJSON(api.message.LOGIN_RESP.init(username, "OK", "Login succeeded.")) ]);
						clientToUsername[client.id] = JSON.parse(data).username;
						//console.log(clientToUsername);

						// Send also initial data to the server (team, rankings, etc.)
						client.send(api.message.ITEM_SYNC.message.name, [ api.message.ITEM_SYNC.getItems() ]);

						var playerNames = { players:[] }
						playerNames.players.push(JSON.parse(data).username);

						for( var c=0; c < this.getClients().length; c++)
						{
							console.log("Updating:", this.getClients().getAt(c).id);
							this.getClients().getAt(c).send("PLAYER_CONNECTED_PUSH", [playerNames]);
						}
					}
					else {

						client.send(api.message.LOGIN_RESP.message.name, [ api.toJSON(api.message.LOGIN_RESP.init(username, "NOK", "Login failed.")) ]);
					}
				}
				else {
                    console.log('Userdata was missing');
					client.send(api.message.LOGIN_RESP.message.name, [ api.toJSON(api.message.LOGIN_RESP.init(username, "NOK", "Login failed.")) ]);
				}
			break;

			case 'HIRE_GLADIATOR_REQ':
				// Second alternative for response messages
				if(null != api.hireGladiator(JSON.parse(data).username, JSON.parse(data).gladiator)) {
					client.send(api.message.HIRE_GLADIATOR_RESP.message.name, [api.message.HIRE_GLADIATOR_RESP.ok(JSON.parse(data).gladiator)]);
				}
				else {
					client.send(api.message.HIRE_GLADIATOR_RESP.message.name, [api.message.HIRE_GLADIATOR_RESP.nok(JSON.parse(data).gladiator)]);
				}
			break;

			case 'TEAM_REQ':
				// Third alternative
				client.send(api.message.TEAM_RESP.message.name, [api.message.TEAM_RESP.init(JSON.parse(data).username)]);
			break;

			case 'BUY_ITEM_REQ':
				// Fourth alternative, let the api crunch the whole message
				api.buyItem(JSON.parse(data).username, JSON.parse(data).gladiator, JSON.parse(data).item);
			break;

			case 'GET_AVAILABLE_GLADIATORS_REQ':
				// Return random gladiators to every request or the same set for everyone?
				client.send(api.message.GET_AVAILABLE_GLADIATORS_RESP.message.name, [api.message.GET_AVAILABLE_GLADIATORS_RESP.init()]);
			break;

			case 'CLIENT_CHAT_REQ':
				// Check if message was ment to some specific player:
				var msg = JSON.parse(data).message;
				var username = "";
				var toUser = "";

				console.log(msg, msg.substring(0,1));
				if(msg.substring(0,1) == "@" && msg.length > 2) {
					username = msg.split(":");
					toUser = username[0];
					toUser = toUser.substring(1, toUser.length);
					console.log("username:", toUser);
				}
                
				for( var c=0; c < this.getClients().length; c++ )
				{
					//console.log("Updating:", this.getClients().getAt(c).id);
					if(toUser){
						// Send to a specific user only
						console.log(this.getClients().getAt(c).id);
						if(clientToUsername[this.getClients().getAt(c).id] == toUser) {
							console.log("Private msg to", toUser, ":", JSON.parse(data).message);
							this.getClients().getAt(c).send("CHAT_SYNC", [data]);
							break;
						}

					}
					else {
						// A global message, send to all users
						this.getClients().getAt(c).send("CHAT_SYNC", [data]);
					}
				}
			break;

			case 'GET_ONLINE_PLAYERS_REQ':

				var playerNames = { players:[] }
				for( var c=0; c < this.getClients().length;c++)
				{
					playerNames.players.push(clientToUsername[this.getClients().getAt(c).id]);
				}
                // add computer players to list
                for( i in configs.npcs )
                {
                    playerNames.players.push(configs.npcs[i]);
                }

				console.log('sending now'+ JSON.stringify([playerNames]));
				client.send('GET_ONLINE_PLAYERS_RESP', [playerNames]);
			break;


			case 'CHALLENGE_REQ':
				console.log('Challenge started, asking defender\'s opinion');
				this.querydb('/users/'+JSON.parse(data).defender, client, 'CHALLENGE_REQ_DEFENDER_CHECK', data);
			break;

			case 'CHALLENGE_RES':

				var res = JSON.parse(data).response;
				console.log('CHALLENGE_RES HERE' + JSON.stringify(data));

				for(challenge in this.challenges)
				{

					var ch  = this.challenges[challenge];
					console.log('Processing:' + (ch.state) + "/"+ch.defender);
					if ( ch.state === "WAITING_ACCEPTANCE" &&
						 ch.defender === JSON.parse(data).username )
					{
						console.log('Found challenge!');
						if ( res == "OK" ) this.challenges[challenge].state = "ACCEPTED";
						else               this.challenges[challenge].state = "NOT_ACCEPTED";

                        // search client from live players (AI does not throw a challenge)
                        var challengerClient = this.getClientByUsername(this.challenges[challenge].challenger);
                        
                        // TODO: add safety check for challenger client that does not exist?
                        if ( challengerClient == null ) {
                            console.log("CHALLENGER IS MISSING: SOMETHING IS VERY BADLY WRONG HERE!!!!");
                        }

						// if challenge was accepted, initiate battles
						if ( this.challenges[challenge].state == "ACCEPTED")
						{
							challengerClient.send('CHALLENGE_RES', ['{ "response":"'+res+'", "defender":"'+ch.defender+'"}']);
							// initiate battles start
							this.handleCreateNewBattle(null, null, 'BATTLE_START_REQ', {
								"challenger":ch.challenger,
								"defender":ch.defender
							});
							// remove challenge, no longer needed
						} else {
							challengerClient.send('CHALLENGE_RES', ['{ "response":"'+res+'", "defender":"'+ch.defender+'", "reason":"defender turned down the challenge"}']);
						}

						delete this.challenges[challenge];

					}
				}

			break;
            case 'ENTER_ARENA_REQ':
               var user = api.getUser(JSON.parse(data).username);
               var battle = api.getBattle( user.ingame );
               
               if ( battle != null ) {
                   if ( !this.battleSessions[user.ingame] ) {
                       this.battleSessions[user.ingame] = {}
                   }

                   if ( battle.defender == user ) { 
                       this.battleSessions[user.ingame]["defender"] = user;
                       client.send('ENTER_ARENA_RES', ['{"response":"OK", "defender":"'+user+'","battleid":"'+user.ingame+'"}']);
                   }
                   
                   if ( battle.challenger == user ) {
                       this.battleSessions[user.ingame]["challenger"] = user;
                       client.send('ENTER_ARENA_RES', ['{"response":"OK", "challenger":"'+user+'","battleid":"'+user.ingame+'"}']);
                   }
                   
                   // if both parties have joined the arena
                   if ( this.battleSessions[user.ingame].defender  &&
                        this.battleSessions[user.ingame].challenger ){

                       // enable challenger
                       var chal = this.getClientByUsername(battle.challenger);
                       if ( chal ) chal.send('BATTLE_START', [JSON.stringify(battle)]);

                       // enable defender
                       var def = this.getClientByUsername(battle.defender,true);
                       if ( def ) def.send('BATTLE_START', [JSON.stringify(battle)]);

                   }
                        
               }

            break;
        case 'BATTLE_STATUS_REQ':
            var user = api.getUser(JSON.parse(data).username);
            console.log('user '+user.name +' is in : ' + user.ingame );
            client.send('BATTLE_STATUS_RES', [ JSON.stringify({username:user.name, ingame:user.ingame}) ]);
            break;
   		case 'DONT_CARE':
			break;

			default:
				console.log("message : default branch reached, type: ", type);
		}
	},

    // creates a pathfinding grid from given tilemap.json file.
    createGridFromFile: function(file) {

        var asset = './../assets/maps/'+file;

        // try to read json tile map
        var map = require(asset);
        if ( !map ) return null;

        var grid = new PF.Grid(map.width, map.height);

        for( var layer=0; layer<map.layers.length;layer++)
        {
            // process only collision layer
            if ( map.layers[layer].name == "Collision" ) {

                var currRow = 0;
                var currColumn = 0;
                // Process layer data
                for(var i in map.layers[layer].data)
                {
                    // non-zero means a set tile and on collision
                    // layer it means 'blocked'
                    if ( map.layers[layer].data[i] > 0 )
                    {
                        grid.setWalkableAt(currColumn, currRow, false);
                    }
                    // next tile, take care of indices.
                    currColumn++;
                    if ( currColumn >= map.width ) {
                        currColumn = 0;
                        currRow++;
                    }

                }
            }
        }

        return grid;
    }

})

	// Create server
	var srv = new GASServer();

	srv.start({
		port: 8080,
		logicRate: LOGIC_RATE,
		tickRate: TICK_RATE
	});