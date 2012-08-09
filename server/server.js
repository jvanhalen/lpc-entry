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


// Test -----------------------------------------------------------------------
var Test = Maple.Class(function(clientClass) {
    Maple.Server(this, clientClass);

}, Maple.Server, {

    started: function() {
	console.log('Server initializing...');
	this.init();
        console.log('Server startup complete.');

    },

    update: function(t, tick) {
        //console.log(this.getClients().length, 'client(s) connected', t, tick, this.getRandom());

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

				if (dbval["password"] === undefined) {

					dbval["password"] = JSON.parse(data).pwdhash;

					console.log("First login for", JSON.parse(data).username, "Updating passwd.");
					this.updatedb(JSON.parse(data).username + '/login', client, 'DONT_CARE', data, JSON.stringify(dbval));
				}


				if(JSON.parse(data).pwdhash !== dbval["password"]) {
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
				client.send('USER_SALT_RESP', ['{"salt":"' + JSON.parse(response).salt + '"}']);
				break;

			case 'GET_AVAILABLE_GLADIATORS_REQ':
				client.send('GET_AVAILABLE_GLADIATORS_RESP', [response]);
				console.log(response);
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
					this.updatedb(url, client, 'CREATE_USER_STEP_TWO', data, undefined);
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
					var crypto = require('crypto');

					this.updatedb(url+'/team', client, 'DONT_CARE', data, '{"manager":"' + url.substring(1) + '"}');
					this.updatedb(url+'/history', client, 'DONT_CARE', data, '{"created":"' + Date.now() + '", "from":"' + client.id.split(":",1) + '"}');

					var salt = crypto.createHash('sha1');
					salt.update(crypto.randomBytes(128));

					this.updatedb(url+'/login', client, 'USER_SALT_RESP', data, '{"salt":"' + salt.digest('hex') + '"}');

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

	handleClientRequest: function (client, type, tick, data) {

		console.log("handleClientRequest '" + type + "' data: " + data);

        switch(type)
        {
		case 'CREATE_USER_REQ':
			this.querydb(JSON.parse(data).username, client, type, data);
			break;

		case 'LOGIN_INIT_REQ':
			this.querydb(JSON.parse(data).username, client, type, data);
			break;

		case 'LOGIN_REQ':
			this.querydb(JSON.parse(data).username + '/login', client, type, data, '{"password":"' + JSON.parse(data).pwdhash + '"}');
			break;

		case 'USER_SALT_REQ':
			this.querydb(JSON.parse(data).username + '/login', client, type, data);
			break;

		case 'GET_AVAILABLE_GLADIATORS_REQ':
            this.querydb('/gladiators/available', client, type, data, undefined);
	        break;

		case 'HIRE_GLADIATOR_REQ':
			this.handleHireGladiatorReq(null, client, type, data);
			break;

		default:
			console.log("message : default branch reached, type: ", type);
        }

	}

});

var srv = new Test();
srv.start({
	port: 8080,
    logicRate: 10
});
