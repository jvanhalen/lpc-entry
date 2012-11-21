
var worldconfig = require('../json/world');

var api = require('./api');
var server = require ('./server');

var world = {

    globalNotification: function() {
        // Send a global notification to all connected (or logged in?) players
    },

    prepareCup: function() {

        // Send "invitations" to all players

        // Generate cup
        var nextCup = cup.init(worldconfig.webserver.port, Date.now());
        if(nextCup) {
            nextCup.server.start();
        }
        else {
            console.log("ERROR: world.prepareCup: Could not init a new Cup!");
        }
    }

}

var cup = {

    init: function(port, startAt) {
        this.server.port = port;
        this.server.initiated = new Date();
        return this;
    },

    server: {
        attendees: [],
        chart: 0,
        initiated: 0,
        startAt: 0,
        port: 0,

        sendInvitations: function() {

        },

        start: function() {
            // Send notifications to all attendees

            // Handle and update cup matches
            this.startweb(this);
        },

        update: function() {

        },

        end: function() {
            // Publish cup chart

            // Share awards

            // Free resources
        },

        generateCharts: function() {
            var chart =
                '<table>'+

                '<tr><th>CUP</th><th>&nbsp;</th></tr>'+
                '<tr><td>Name:</td><td>' + worldconfig.name + '</td></tr>'+
                '<tr><td>Started:</td><td>' + new Date() + ' (' + Date.now() + ')</td></tr>'+
                '<tr><td>#teams:</td><td>' + this.attendees.length + '</td></tr>'+
                '<tr><td>&nbsp;</td><td>&nbsp;</td></tr>'+

                '<tr><th>Chart</th><th>&nbsp;</th></tr>'+

                '<tr><td>&nbsp;</td><td>&nbsp;</td></tr>'+
                '</table>'
                return chart;
        },


        startweb: function() {
            console.log("cup.server.webserver.start: ", this.port)
            var http = require("http");

            function onRequest(request, response) {
              response.writeHead(200, {"Content-Type": "text/html"});
              response.write(cup.server.generateCharts());
              response.end();
            }
            http.createServer(onRequest).listen(this.port);
        }
    }
}


world.prepareCup();
