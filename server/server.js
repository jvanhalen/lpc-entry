/**
  * Copyright (c) 2012 Ivo Wetzel.
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

var cachedGladiators = [];		// ["gladi_name": gladi_object], syntax: var attrib = cachedGladiators["name"].attribute
var cachedPlayers = [];		// ["gladi_name": gladi_object], syntax: var attrib = cachedGladiators["name"].attribute
var initialGladiatorsList = [];

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
var Test = Maple.Class(function(clientClass) {
    Maple.Server(this, clientClass);

}, Maple.Server, {

    pointOfReference: 0, // ticks
    paused: false,   // state
    duration: 0, // for how long

    battleSessions: [], // which battles are active.
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
                // only battlers and potential viewers.
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
                // only battlers and potential viewers.
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
	    //tty.setRawMode(true);


		// Create database for gladiators, if empty fill it with new gladiators
		this.querydb('/' + configs.gladiatordb, {'id': 'localhost'}, 'INIT_GLADIATOR_DATABASE', {'id': 'localhost'});
		this.updatedb('/' + configs.usersdb, {'id': 'localhost'}, 'DONT_CARE', {'id': 'localhost'});
		this.updatedb('/' + configs.battledb, {'id': 'localhost'}, 'DONT_CARE', {'id': 'localhost'});

		// Load gladiators to main memory for better performance
		this.querydb('/' + configs.gladiatordb + '/_all_docs?include_docs=true', {'id': 'localhost'}, 'LOAD_GLADIATORS', {'id': 'localhost'});

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
			case 'CREATE_USER_REQ':
			case 'CREATE_USER_STEP_TWO':
			case 'CREATE_USER_STEP_THREE':
				this.handleNewUserReq(querypath, client, type, data, response);
				break;



			case 'LOGIN_INIT_REQ':
				if(JSON.parse(response).error) {
				    client.send('LOGIN_INIT_RESP', ['{"response":"NOK"}']);
				}
				else {
					// Check if user has already logged in
					var logged = false;
					for(user in clientToUsername) {
						if(clientToUsername[user] == JSON.parse(data).username) {
							logged = true;
							break;
						}
					}
					if(true == logged)
						client.send('LOGIN_INIT_RESP', ['{"response":"NOK", "reason":"user already in game"}']);
					else
						client.send('LOGIN_INIT_RESP', ['{"response":"OK"}']);
				}
				break;

			case 'LOGIN_REQ':

			    var dbval = JSON.parse(response);

     			if (dbval.login["password"] === undefined) {

					dbval.login["password"] = JSON.parse(data).pwdhash;

					console.log("First login for", JSON.parse(data).username, "Updating passwd.");
					this.updatedb('/users/'+JSON.parse(data).username, client, 'DONT_CARE', data, JSON.stringify(dbval));
				}

				if(JSON.parse(data).pwdhash !== dbval.login["password"]) {
					console.log("pwd did not match, login failed");
					client.send('LOGIN_RESP', ['{"response":"NOK", "username":"' + JSON.parse(data).username + '"}']);
				}
				else {
					console.log("pwd matched, login successful");
					client.send('LOGIN_RESP', ['{"response":"OK", "username":"' + JSON.parse(data).username + '"}']);
					clientToUsername[client.id] = JSON.parse(data).username;
					//console.log(clientToUsername);
					// Send also initial data to the server (team, rankings, etc.)
            				var playerNames = { players:[] }
                			playerNames.players.push(JSON.parse(data).username);

					for( var c=0; c < this.getClients().length; c++)
					{
						console.log("Updating:", this.getClients().getAt(c).id);
						this.getClients().getAt(c).send("PLAYER_CONNECTED_PUSH", [playerNames]);
					}
				}

				break;

			case 'USER_SALT_REQ':
				client.send('USER_SALT_RESP', ['{"salt":"' + JSON.parse(response).login.salt + '"}']);
				break;

			case 'GET_AVAILABLE_GLADIATORS_REQ':
				client.send('GET_AVAILABLE_GLADIATORS_RESP', [data]);
				break;

			case 'INIT_GLADIATOR_DATABASE':
				// Always try to init the gladiator db
				this.updatedb('/' + configs.gladiatordb, {"id": "localhost"}, 'CREATE_GLADIATORS');
				break;

			case 'CREATE_GLADIATORS':
				this.generateGladiators();
				break;
			case 'TEAM_REQ':
				client.send('TEAM_RESP', ['{"name":"TEAM_RESP", "team":'+JSON.stringify(JSON.parse(response).team)+'}']);
				console.log(response);
				break;




			case 'HIRE_GLADIATOR_QUERY':
				this.querydb('/' + configs.gladiatordb + '/' + JSON.parse(data).name, client, "HIRE_GLADIATOR_OK", data);
				//console.log(data);
				break;

			case 'HIRE_GLADIATOR_OK':
				client.send("HIRE_GLADIATOR_RESP", [{"type": "HIRE_GLADIATOR_RESP", "response": "OK", "name":  this.pickGladiator(JSON.parse(data).name), "reason": "Ready to serve."}]);
				console.log(data);
				break;

			case 'LOAD_GLADIATORS':
				this.loadGladiators(response);
				break;
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
                if ( JSON.parse(response) != null && JSON.parse(response).team.ingame == null )
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
                            this.getClients().getAt(c).send('CHALLENGE_RES', ['{"response":"NOK", "reason":"defender already in battle. "}']);
						    break;
                        }
                    }
                }
            break;
        case 'CHALLENGE_REQ_ONLINE_CHECK':

            if ( JSON.parse(response) == null ||
                 JSON.parse(response).team.ingame != null )
            {
                for(var c=0; c<this.getClients().length;c++)
                {
                    if (clientToUsername[this.getClients().getAt(c).id] == JSON.parse(data).username)
                    {
                        this.getClients().getAt(c).send('CHALLENGE_RES', ['{"response":"NOK", "reason":"challenger already in battle. "}']);
						break;
                    }
                }
                break;
            }

            // check whether user is online.
            var defender = JSON.parse(data).defender;
            var defenderClient = null;
            
            for(user in clientToUsername) {
				if(clientToUsername[user] == defender) 
                {
                    for(var c=0; c<this.getClients().length;c++)
                    {
                        if (this.getClients().getAt(c).id == user)
                        {
 			                defenderClient = this.getClients().getAt(c);
						    break;
                        }
                    }
				}
			}
            
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
                                    ['{"challenger":"'+ clientToUsername[client.id] + '"}']);
                // notify challenger for delivery
                client.send('CHALLENGE_RES', 
                            ['{"response":"DELIVERED", "defender":"'+defender+'" }']);
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

    handleNewUserReq: function(querypath, client, type, data, response) {
		console.log("handleNewUserReq,: ", data, response);
		switch(type)
		{
			// Check for user existence
			case 'CREATE_USER_REQ':
				if("not_found" == JSON.parse(response).error) {
					this.updatedb(querypath, client, 'CREATE_USER_STEP_TWO', data, '{"team":null, "history":null, "login":null}');
					console.log("Created new user:", querypath.substring(1));
				}
				else {
					console.log("user already exists");
					client.send('CREATE_USER_RESP', ['{"response":"NOK", "reason": "User exists"}']);
				}
				break;

			case 'CREATE_USER_STEP_TWO':
				if(response == undefined) {
					client.send('CREATE_USER_RESP', ['{"response":"NOK", "reason": "Step two failed"}']);
					console.log("handleNewUserReq : step CREATE_NEW_USER_STEP_TWO NOT OK (" + querypath + ")");
				}
				else {
                    			this.querydb('/users/'+JSON.parse(data).username, client, 'CREATE_USER_STEP_THREE', data);

				}
			  break;

		   	case 'CREATE_USER_STEP_THREE':
				if ( response !=  undefined )
				{

					// create user
					var crypto = require('crypto');
					var obj = {};

					var user = JSON.parse(response);
					var gladis = this.pickRandomGladiators(4);
					console.log(gladis);
					console.log(JSON.stringify(gladis));

					user.team = {"manager": JSON.parse(data).username, "ingame": null, "gladiators": gladis};
					user.history = {"created": Date.now(), "from": client.id.split(":",1) };


					var salt = crypto.createHash('sha1');
					salt.update(crypto.randomBytes(128));
					user.login = {"salt": salt.digest('hex')};

					console.log("Updating user:" + JSON.stringify(user));
					this.updatedb(querypath, client, 'DONT_CARE', data, JSON.stringify(user));

				}
            break;

			case 'DONT_CARE':
				break;

			default:
				console.log("handleNewUserReq : default branch reached, type: ", type);
				break;
		}

    },

	handleHireGladiatorReq: function (querypath, client, type, data) {
/*
		//console.log("handleHireGladiatorReq: ", data);
		//console.log("data.name: ", JSON.parse(data).name);
		if(reservedGladiatorsList[JSON.parse(data).name]) {
			client.send("HIRE_GLADIATOR_RESP", [{"type": "HIRE_GLADIATOR_RESP", "response": "NOK", "name": JSON.parse(data).name, "reason": "Already hired."}]);
		}
		else {
			reservedGladiatorsList.push(JSON.parse(data).name);
        		this.querydb('/' + configs.gladiatordb + '/' + JSON.parse(data).name, client, "HIRE_GLADIATOR_QUERY", data);

		}
*/
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
            data["path"]='/battle/'+JSON.parse(response).uuids[0];

            // create battle doc
            this.updatedb('/battle/'+JSON.parse(response).uuids[0], null, 
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
            var battle = JSON.parse(response);
            // create crude "copies"
            battle.defender = JSON.parse(JSON.stringify(data.defender));
            battle.challenger = JSON.parse(JSON.stringify(data.challenger));
            
            battle.initial_state.challenger = battle.challenger;
            battle.initial_state.defender = battle.defender;

            // cleanup unnecessary details
            delete battle.challenger._rev;
            battle.challenger["name"] = battle.challenger._id;
            delete battle.challenger._id;
            delete battle.defender._rev;
            battle.defender["name"] = battle.defender._id;
            delete battle.defender._id;

            var battleStr = JSON.stringify(battle);
            console.log(battleStr);
            // set both players into game 
            data.defender.team.ingame = battle._id;
            data.challenger.team.ingame = battle._id;

            // create battle doc
            this.updatedb(data.path, null, 'BATTLE_START_STORE_PLAYERS_RES', data, battleStr );

            
            // Update player ingame property
            this.updatedb('/users/'+data.challenger._id, null, 
                          'BATTLE_START_UPDATE_CHALLENGER', data, 
                          JSON.stringify(data.challenger));
            
            this.updatedb('/users/'+data.defender._id, null, 
                          'BATTLE_START_UPDATE_DEFENDER', data, 
                          JSON.stringify(data.defender));

            break;
        case 'BATTLE_START_STORE_PLAYERS_RES':
            console.log('Players stored into battle doc, yay!');
            break;
        case 'BATTLE_START_UPDATE_CHALLENGER':

            console.log('Challenger ingame updated');
            // send info that game is ready
            for(var c=0;c< this.getClients().length; c++) {
				if(clientToUsername[this.getClients().getAt(c).id] == data.challenger._id) {
					this.getClients().getAt(c).send('CHALLENGE_RES', 
                     ['{"response":"READY_FOR_WAR", "battle":"'+data.challenger.team.ingame+'"}']);
					break;
				}
			}
            break;
        case 'BATTLE_START_UPDATE_DEFENDER':
            console.log('Defender ingame updated');
            // send info that game is ready  
            for(var c=0;c< this.getClients().length; c++) {
				if(clientToUsername[this.getClients().getAt(c).id] == data.defender._id) {
					this.getClients().getAt(c).send('CHALLENGE_RES', 
                     ['{"response":"READY_FOR_WAR", "battle":"'+data.defender.team.ingame+'"}']);
					break;
				}
			}
            break;
        }
    },

	handleClientRequest: function (client, type, tick, data) {

		console.log("handleClientRequest '" + type + "' data: " + data);

        switch(type)
        {
		case 'CREATE_USER_REQ':
			this.querydb('/users/'+JSON.parse(data).username, client, type, data);
			break;

		case 'LOGIN_INIT_REQ':
            if ( !JSON.parse(data).username || JSON.parse(data).username == '')
            {
                client.send('LOGIN_INIT_RESP', ['{"response":"NOK"}']);
            }
            else {
			    this.querydb('/users/'+JSON.parse(data).username, client, type, data);
            }

			break;

		case 'LOGIN_REQ':
			this.querydb('/users/'+JSON.parse(data).username, client, type, data, '{"password":"' + JSON.parse(data).pwdhash + '"}');
			break;

		case 'USER_SALT_REQ':
			this.querydb('/users/'+JSON.parse(data).username, client, type, data);
			break;

		case 'GET_AVAILABLE_GLADIATORS_REQ':
			// Return random gladiators to every request or the same set for everyone?
			var gladilist = "";
			for(var i = 0; i< configs.hirelistlength; i++) {
				//var rand = this.rollDice("1d" + initialGladiatorsList.length + "-" + configs.hirelistlength);
				gladilist += '"' + initialGladiatorsList[i] + '",';
			}
			gladilist = gladilist.substr(0, gladilist.length-1); // Trim the trailing ,
			console.log('{"keys":[' + gladilist + ']}')
            this.postRequest('/gladiators/_all_docs?include_docs=true', client, type, data, '{"keys":[' + gladilist + ']}');
	        break;

		case 'HIRE_GLADIATOR_REQ':
			this.handleHireGladiatorReq(null, client, type, data);
			break;

        case 'TEAM_REQ':
            this.querydb('/users/'+JSON.parse(data).username, client, type, data);
            break;

        case 'GET_ONLINE_PLAYERS_REQ':


            var playerNames = { players:[] }
            for( var c=0; c < this.getClients().length;c++)
            {
                playerNames.players.push(clientToUsername[this.getClients().getAt(c).id]);
            }
            console.log('sending now'+ JSON.stringify([playerNames]));
            client.send('GET_ONLINE_PLAYERS_RESP', [playerNames]);
            break;



        case 'CLIENT_CHAT_REQ':
		for( var c=0; c < this.getClients().length; c++)
		{
			//console.log("Updating:", this.getClients().getAt(c).id);
			this.getClients().getAt(c).send("CHAT_SYNC", [data]);
		}
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
                    
                    for( var c=0; c < this.getClients().length;c++)
                    {
                        if ( clientToUsername[this.getClients().getAt(c).id] == this.challenges[challenge].challenger )
                        {
                            


                            // if challenge was accepted, initiate battle
                            if ( this.challenges[challenge].state == "ACCEPTED")
                            {
                                this.getClients().getAt(c).send('CHALLENGE_RES', ['{ "response":"'+res+'", "defender":"'+ch.defender+'"}']);
                                // initiate battle start
                                this.handleCreateNewBattle(null, null, 'BATTLE_START_REQ', {
                                    "challenger":ch.challenger, 
                                    "defender":ch.defender
                                });
                                // remove challenge, no longer needed
                            } else {
                                this.getClients().getAt(c).send('CHALLENGE_RES', ['{ "response":"'+res+'", "defender":"'+ch.defender+'", "reason":"defender turned down the challenge"}']);
                            }
				            delete this.challenges[challenge];
                            break;
                        }
                    }
                }
            }
                
			break;
            
	case 'DONT_CARE':
		break;

		default:

			console.log("message : default branch reached, type: ", type);
        }

	},

	rollDice: function(dice) {
		var roll = require('roll');
		return roll.roll(dice).result;
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
    },

	generateGladiators: function () {
		var fs = require('fs');
		var races = require('../json/races'); // read races.json
		var gladiator = [];
		var racecount = 0;

		//console.log("Available races:");
		for(key in races.race) {
			//console.log(races.race[key].name);
			racecount += 1;
		}

		var bulk_set = parseInt(configs.gladiatorsindatabase); // Write the whole set one or two writes

		for(i in initialGladiatorsList) {
			if(i < parseInt(configs.gladiatorsindatabase)) {
				var race = this.rollDice("1d"+racecount+"-1");
				gladiator[i%bulk_set] = {
					"_id": initialGladiatorsList[i],
					"name": initialGladiatorsList[i],
					"race": races.race[race].name,
					"team": null,
					"age": 0,
					"health": this.rollDice(races.race[race].health),
					"nimbleness": this.rollDice(races.race[race].nimbleness),
					"strength": this.rollDice(races.race[race].strength),
					"mana": this.rollDice(races.race[race].mana),
					"salary": this.rollDice(configs.basesalary),
					"fights": "0",
					"knockouts": "0",
					"injured": "0",
					"icon": races.race[race].icon
				}
			}

			// Store gladiator to database

			//this.updatedb('/' + configs.gladiatordb + '/' + gladiator.name, {"id": "localhost"}, 'DONT_CARE', null, JSON.stringify(gladiator));

			// Use the bulk-write for better performance
			if(i%bulk_set==0) {
				var request = require('request');
				var options = {
					'host': 'localhost',
					'port': 5984,
					'path': '/' + configs.gladiatordb + '/_bulk_docs',
					'method': 'POST',
					headers: {
						'Content-Type': 'application/json',
					}

				};

				var http = require('http');
				var req = http.request(options, function(res) {
				  console.log('STATUS: ' + res.statusCode);
				  //console.log('HEADERS: ' + JSON.stringify(res.headers));
				  res.setEncoding('utf8');
				  res.on('data', function (chunk) {
					//console.log('BODY: ' + chunk);
				  });
				});

				req.on('error', function(e) {
				  console.log('problem with request: ' + e.message);
				});

				// write data to request body
				req.write('{"docs":' + JSON.stringify(gladiator) + '}\n');
				req.end();

				//console.log("i%bulk_set", i%bulk_set);
				//this.updatedb('/' + configs.gladiatordb + '/_bulk_docs', {"id": "localhost"}, 'DONT_CARE', null, '{"docs":' + JSON.stringify(gladiator) + '}');
			}

		}
	},

	postRequest: function(querypath, client, type, data, postdata) {
		console.log("querypath", querypath, "\nclient:", client, "\ntype:", type, "\ndata", data, "\npostdata", postdata);
		var request = require('request');
		var options = {
			'host': 'localhost',
			'port': 5984,
			'path': querypath,
			'method': 'POST',
			headers: {
				'Content-Type': 'application/json',
			}

		};

		var http = require('http');
		var req = http.request(options, function(res) {
		var response = "";
		  //console.log('STATUS: ' + res.statusCode);
		  //console.log('HEADERS: ' + JSON.stringify(res.headers));
		  res.setEncoding('utf8');
		  res.on('data', function (chunk) {
			//console.log(chunk);
			response += chunk;	// Collect the bits and pieces of the POST response
			//srv.handleDbResponse(querypath, res, client, type, chunk);
		  });
		  res.on('end', function () {
			// Finally handle the whole response message
			//console.log(response);
			srv.handleDbResponse(querypath, client, type, response, data);
			response = "";
		  });
		});

		req.on('error', function(e) {
		  console.log('problem with request: ' + e.message);
		});

		// write data to request body
		req.write(postdata);
		req.end();

	},

	pickRandomGladiators: function(amount) {
		console.log("pickRandomGladiators: pick", amount,"gladiators");

		var i=0;
		var keys = [];
		var reservedGladiators = [];
		var gladis = [];
		while(Object.keys(reservedGladiators).length < amount) {	// Count the amount of hash keys  (not reservedGladiators.length!!!)
		    	var temp_key;
		    	for(temp_key in cachedGladiators) {
				if(cachedGladiators.hasOwnProperty(temp_key)) {
					keys.push(temp_key);
				}
			}

			i += 1;
			var gladi = cachedGladiators[keys[Math.floor(Math.random() * keys.length)]];
	    		reservedGladiators[cachedGladiators[gladi.name].name] = cachedGladiators[gladi.name];
		}

		// Delete the cached entries
		for(key in reservedGladiators) {
			delete cachedGladiators[reservedGladiators[key].name];
			gladis.push(reservedGladiators[key]);
		}

		console.log("Reserved", Object.keys(reservedGladiators).length, "Free:", Object.keys(cachedGladiators).length);
		console.log("Iterated", i, "times");
		console.log(gladis);

		return gladis;
	},

	pickGladiator: function(name) {
		console.log("pickGladiator:", name);

		var gladiator = cachedGladiators[name];
		delete cachedGladiators[name];

		return gladiator;
	},

	loadGladiators: function(http_response) {

		// Now this is a bit more complicated structure...
		var data = JSON.parse(JSON.stringify(http_response));
		mydata = JSON.parse(data, function (key, value) {
		    var type;
		    if (value && typeof value === 'object') {
			type = value.type;
			if (typeof type === 'string' && typeof window[type] === 'function') {
			    return new (window[type])(value);
			}
		    }
		    return value;
		});

		// Finally iterate through the data we need
		cachedGladiators = [];
		for(var key in mydata.rows) {
			//console.log(mydata.rows[key].doc.name);
			var name = mydata.rows[key].doc.name;
			cachedGladiators[name] = mydata.rows[key].doc; // Create ["name": gladi_object] hash
		}
		//this.pickRandomGladiators(10);
	}

});

	var srv = new Test();
	// Read gladiator names
	var fs = require('fs');
	initialGladiatorsList = fs.readFileSync('./rulesets/gladiatornames.txt').toString().split("\n");

	srv.start({
		port: 8080,
		logicRate: LOGIC_RATE,
		tickRate: TICK_RATE
	});