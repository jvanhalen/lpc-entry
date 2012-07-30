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
var Maple = require('../Maple');
var eventQueue = [];

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
        //this.broadcast(5, ['GAS leak detected']);
    },

    stopped: function() {
        console.log('Server stopped');
	this.broadcast(0, ['-- server halted --']);
    },

    connected: function(client) {
        console.log('Connected:', client.id);
	//client.send(5, ['{"asdf":"asdf"}']);
    },

    message: function(client, type, tick, data) {
	
	console.log("message:", type, "data", data);

        switch(type)
        {
		case 2:
			console.log("*** Creating new user " + '(' + JSON.parse(data).username + ')' + " *** ");
			// Query DB for user existence
			this.querydb(JSON.parse(data).username, client, type, data);
		  break;

		case 4: // Login request (login -> salt -> sha1(password+salt) -> compare -> response
			console.log("*** User " + '(' + JSON.parse(data).username + ')' + " requested login *** ");

			// Query DB for user existence
			this.querydb(JSON.parse(data).username, client, type, data);
		  break;

		case 5:
			this.querydb(JSON.parse(data).username + '/login', client, 6, data, '{"password":"' + JSON.parse(data).pwdhash + '"}');
		  break;

		case 10:
			this.querydb(JSON.parse(data).username + '/login', client, type, data, undefined);
		  break;
		case 11:
			this.querydb(JSON.parse(data).username + '/login', client, 12, data, undefined);
		  break;
			
		default:
			console.log("message : default branch reached, type: ", type);
        }
    },

    requested: function(req, res) {
        console.log('HTTP Request');
	//console.log(req);
	//console.log(res);
    },

    disconnected: function(client) {
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
	tty.setRawMode(true);
	
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

	console.log("GET:", querypath);
	var req = http.get(options, function(res) {
	  res.setEncoding('utf8');
	  res.on('data', function (chunk) {
	  srv.handledbresp(querypath, chunk, client, type, data);
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
	  querypath = '/' + querypath;
	  console.log("WARNING: updatedb: received invalid querypath", querypath);
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
		    srv.handledbresp(querypath, response, client, type, data);
		  } else {
		    console.log("PUT failed for: " + querypath + "\n client.id: " + client.id + "\n content: " + content + " with status code:" + response.statusCode);
		  }
	  }
	  else {
		console.log("ERROR: updatedb response undefined for: " + querypath + "\n client.id: " + client.id + "\n content: " + content);
	  }
	})
    },

    handledbresp: function(url, response, client, type, data) {
	console.log("handledbresp: function(url, response, client, type, data)");
	//console.log("url:", url);
	//console.log("type", type);

	switch(type)
	{
		case 2:
		case 3:
		case 4:
		case 5:
		case 6:
		  this.handlenewuser(url, response, client, type, data);
		  break;
		case 10:
		case 11:
		case 12:
		  this.handlelogin(url, response, client, type, data);
		  break;
		default:
		  console.log("handledbresp : default branch reached, type: ", type);
		break;
	}
    },

    handlenewuser: function(url, response, client, type, data) {
	console.log("handlenewuser: function(url, response, client, type, data)");
	//console.log("response", response);
	console.log("url:", url);
	console.log("type", type);

	switch(type)
	{
		// Check for user existence
		case 2:
			if("not_found" == JSON.parse(response).error) {
				this.updatedb(url, client, 3, data, undefined);  // Change 'type' 2 -> 3 for next step of the user creation
				console.log("Created new user:", url.substring(1));
			}
			else {
				console.log("username already exists");
				client.send(type, ['{"Response":"User exists"}']);
			}
		  break;

		case 3:
			if(response == undefined) {
				client.send(type, ['{"Response":"NOK"}']);
				console.log("handlenewuser : step 3 NOT OK (" + url + ")");
				//TODO: remove user
			}
			else {
				var crypto = require('crypto');
				//console.log(salt);

				this.updatedb(url+'/team', client, 0, data, '{"manager":"' + url.substring(1) + '"}');
				this.updatedb(url+'/history', client, 0, data, '{"created":"' + Date.now() + '", "from":"' + client.id.split(":",1) + '"}');

				var salt = crypto.createHash('sha1');
				salt.update(crypto.randomBytes(128));

				this.updatedb(url+'/login', client, 4, data, '{"salt":"' + salt.digest('hex') + '"}');

			} 
		  break;

		// Request salt from database
		case 4:
			console.log("handlenewuser : step 4 querying salt from:" + url);
			this.querydb(JSON.parse(data).username + '/login', client, 5, data); // Set type to 5 for the last step of the login process
		  break;

		// Update user password and send confirmation to client
		case 5:
			if(response == undefined) {
				console.log("handlenewuser : step 5 NOT OK (" + url + ")");
				//TODO: remove user
			}
			else {
				console.log("handlenewuser : step 5 (sending salt to the client for password generation) ");
			} 
			//console.log(data);
			//console.log('[{"salt":"' + JSON.parse(response).salt + '"}]');
			client.send(type, ['{"salt":"' + JSON.parse(response).salt + '"}']);
		  break;

		case 6:
			//console.log("JSON.stringify(response)", JSON.stringify(response));
			var update = JSON.parse(response);
			update["password"] = JSON.parse(data).pwdhash;

			// For some reason, the following function does not work properly (HTTP GET returns empty set)
			this.updatedb(JSON.parse(data).username + '/login', client, 0, data, JSON.stringify(update));


		  break;
		default:
		  console.log("handlenewuser : default branch reached, type: ", type);
		break;
	}
    },

    handlelogin: function(url, response, client, type, data) {
	console.log("handlelogin: function(url, response, client, type, data)");
	console.log("url:", url);
	console.log("type", type);
	switch(type)
	{
		// Check for user existence
		case 10:
			if("not_found" == JSON.parse(response).error) {
				console.log("not_found");
				client.send(12, ['{"response":"NOK"}']);
			}
			else {
				console.log("db found, querying salt");
				this.querydb(JSON.parse(data).username + "/login", client, 11);
			}
		  break;

		// Forward salt
		case 11:
		  	client.send(11, ['{"salt":"' + JSON.parse(response).salt + '"}']);
		  break;

		// Verify user
		case 12:
		   //Connection OK / NOK
			if(JSON.parse(data).pwdhash === JSON.parse(response).password) {
				console.log("User", JSON.parse(data).username, "logged in.");
				client.send(12, ['{"response":"OK - Connection established"}']);
			}
			else {
				console.log("User", JSON.parse(data).username, "login failed (password mismatch).");
				console.log(JSON.parse(data).pwdhash + " != " + JSON.parse(response).password);
			}
		  break;

		default:
		  console.log("handlelogin : default branch reached, type: ", type);
		  break;
	}
	
    } 

});

var srv = new Test();
srv.start({
    port: 8282,
    logicRate: 10
});
