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



// Test -----------------------------------------------------------------------
var Test = Maple.Class(function(clientClass) {
    Maple.Server(this, clientClass);

}, Maple.Server, {

    pointOfReference: 0, // ticks 
    paused: false,   // state
    duration: 0, // for how long
    
    battleSessions: [], // which battles are active.
    
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


        // assuming that logicRate = 10 ticks, tickRate = 3ms.
        // update gets called every 10 ticks, and tick is increased every 3 ms.
        // this means, that within one second there is ~333 ticks, and update gets 
        // called ~33 times per second.
        var FIVE_SECONDS = 333*5;
        var ONE_SECOND = 333;
        if ( this.paused == true )
        {
            if ( tick - this.pointOfReference >= FIVE_SECONDS )
            {

                this.paused = false;
                this.pointOfReference = tick;
                
                var msg = {
                    "name":"BATTLE_CONTROL_SYNC",
                    "paused":this.paused,
                    "duration":ONE_SECOND,
                    "start":this.pointOfReference
                };
                var data = [];
                data.push(msg);
                // sends to ALL clients at the momemnt, but needs to send for
                // only battlers and potential viewers.
                for(var c = 0; c< this.getClients().length; c++)
                {
                    this.getClients().getAt(c).send(data[0].name, data);
                }
            }
        }
        else
        {
            if ( tick - this.pointOfReference >= ONE_SECOND )
            {
                this.paused = true;
                this.pointOfReference = tick;
                var msg = [{
                    "name":"BATTLE_CONTROL_SYNC",
                    "paused":this.paused,
                    "duration":FIVE_SECONDS,
                    "start":this.pointOfReference
                }];
                // sends to ALL clients at the momemnt, but needs to send for
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
		clientToUsername[client.id] = "undefined";
		console.log(clientToUsername);
		// Send initial data, e.g. ranking list?
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
        console.log('Disconnected:', client.id);
		delete clientToUsername[client.id];
		console.log(clientToUsername);
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

	    // Query database access
	    this.querydb("/", undefined, undefined, undefined);

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

		//console.log("GET:", querypath);
		var req = http.get(options, function(res) {
		  res.setEncoding('utf8');
		  res.on('data', function (chunk) {
		  srv.handleDbResponse(querypath, chunk, client, type, data);
		  });
		});

		req.on('error', function(e) {
		  console.log('GET: Cannot access database: ' + e.message);
		});

		// write data to request body
		req.write('data\n');
		req.write('data\n');
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

		console.log("CONTENT:", content);

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
					console.log("PUT ok for: " + querypath + "\n client.id: " + client.id + "\n content: " + content);
						srv.handleDbResponse(querypath, response, client, type, data);
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

    handleDbResponse: function(url, response, client, type, data) {
		console.log("handleDbResponse: " + url + " : " + response);

		switch(type)
		{
			case 'CREATE_USER_REQ':
			case 'CREATE_USER_STEP_TWO':
			case 'CREATE_USER_STEP_THREE':
				this.handleNewUserReq(url, response, client, type, data);
				break;



			case 'LOGIN_INIT_REQ':
				if(JSON.parse(response).error)
				    client.send('LOGIN_INIT_RESP', ['{"response":"NOK"}']);
				else
				    client.send('LOGIN_INIT_RESP', ['{"response":"OK"}']);
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
					console.log(clientToUsername);
					// Send also initial data to the server (team, rankings, etc.)
				}

				break;

			case 'USER_SALT_REQ':
				client.send('USER_SALT_RESP', ['{"salt":"' + JSON.parse(response).login.salt + '"}']);
				break;

			case 'GET_AVAILABLE_GLADIATORS_REQ':
				client.send('GET_AVAILABLE_GLADIATORS_RESP', [response]);
				console.log(response);
				break;
            case 'TEAM_REQ':
                client.send('TEAM_RESP', ['{"name":"TEAM_RESP", "team":'+JSON.stringify(JSON.parse(response).team)+'}']);
                console.log(response);
                break;
            case 'GET_ONLINE_PLAYERS':

                break;
            case 'START_BATTLE_REQ':
                console.log('Received battle uuid: '+response);
                this.updatedb('/battle/'+JSON.parse(response).uuids[0], client, 'START_BATTLE_STEP2_REQ', data, '{}');
            //'{ "history":[], "player1":{"name":"'+JSON.parse(data).username+'"}'
                break;
            case 'START_BATTLE_STEP2_REQ':
                console.log('Sending battle start to client: ');
                client.send('START_BATTLE_RESP', ['{"done":true}']);

                break;
			default:
				console.log("handleDbresponse : default branch reached, type: ", type);
				break;
		}

    },

    handlePitQuery: function(url, response, client, type, data) {
		console.log('handling PitQuery' + response);
		client.send(type, [response]);
    },

    handleNewUserReq: function(url, response, client, type, data) {

		switch(type)
		{
			// Check for user existence
			case 'CREATE_USER_REQ':
				if("not_found" == JSON.parse(response).error) {
					this.updatedb(url, client, 'CREATE_USER_STEP_TWO', data, '{"team":null, "history":null, "login":null}');
					console.log("Created new user:", url.substring(1));
				}
				else {
					console.log("user already exists");
					client.send('CREATE_USER_RESP', ['{"response":"NOK", "reason": "User exists"}']);
				}
			  break;

			case 'CREATE_USER_STEP_TWO':
				if(response == undefined) {
					client.send('CREATE_USER_RESP', ['{"response":"NOK", "reason": "Step two failed"}']);
					console.log("handleNewUserReq : step CREATE_NEW_USER_STEP_TWO NOT OK (" + url + ")");
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
                user.team = {"manager":url.substring(1), "ingame":null, "gladiators":[]};
                user.history = {"created": Date.now(), "from": client.id.split(":",1) };

				var salt = crypto.createHash('sha1');
				salt.update(crypto.randomBytes(128));
                user.login = {"salt": salt.digest('hex')};

                console.log("Updateing user:"+JSON.stringify(user));
                this.updatedb(url, client, 'DONT_CARE', data, JSON.stringify(user));
                
            }
              break;

			default:
				console.log("handleNewUserReq : default branch reached, type: ", type);
				break;
		}

    },

	handleHireGladiatorReq: function (url, client, type, data) {



	},

	rollDice: function(dice) {

		var roll = require('roll');
		return roll.roll(dice).result;

	},

    handleStartBattle: function( url, client, type, data)
    {
        this.querydb( '/_uuids', client, type, data);
        //this.updatedb( url, client, type, data, undefined);
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
            this.querydb('/gladiators/available', client, type, data, undefined);
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
                playerNames.players.push(clientToUsername[this.getClients().getAt(c)]);
            }

            console.log('sending now'+ JSON.stringify([playerNames]));
            client.send('GET_ONLINE_PLAYERS_RESP', [playerNames]);
            break;
        case 'START_BATTLE_REQ':
            this.handleStartBattle('/battle', client, type, data);
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

});

var srv = new Test();
srv.start({
	port: 8080,
    logicRate: 10,
    tickRate: 3
});
