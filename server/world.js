
var worldconfig = require('../json/world');

var api = require('./api');
var server = require ('./server');

var world = {

    globalNotification: function() {

    },

    prepareCup: function() {

        // Send "invitations" to all players

        // Create cup chart

    }

}

var cup = {
    attendees: {},
    chart: {},

    init: function() {
        // Init chart (wait until enough players)

        // Start webserver, publish chart
    },

    start: function() {
        // Send notifications to all attendees

        // Handle and update cup matches
    },

    update: function() {

    },

    end: function() {
        // Publish cup chart

        // Share awards

        // Free resources
    },


    webserver: {
        cup: null,

        start: function(cup) {
            this.cup = cup;

            //console.log("webserver.launch")
            var http = require("http");

            function onRequest(request, response) {
              console.log("webserver.onRequest");
              response.writeHead(200, {"Content-Type": "text/plain"});
              response.write(this.cup.generateCharts());
              response.end();
            }

            http.createServer(onRequest).listen(8888);
        }
    }
}