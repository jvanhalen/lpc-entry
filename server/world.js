
var worldconfig = require('../json/world');

var api = require('./api');
var server = 0;

var world = {

    server: 0,
    cupState: false,

    init: function(server) {
        console.log("world: init()");
        this.server = server;
        setInterval(this.keepOnRocking, 1000,null);
    },

    // The server cycle
    keepOnRocking: function() {
        var day = new Date;
        //console.log("reality check");
        for(var i=0; i<worldconfig.cupdays.length; i++) {
            if(worldconfig.cupdays[i] == day.getDay()) {
                // Cup day - check time
                for(var j=0; j<worldconfig.cuphours.length; j++) {
                    if(((worldconfig.cuphours[j] - day.getHours()) == 0) && (day.getMinutes() == 33) && (day.getSeconds() == 0)) {
                        console.log("INITIATE THE CUP PLZ!");
                        world.prepareCup();
                    }
                }
            }
        }
    },

    globalNotification: function() {
        // Send a global notification to all connected (or logged in?) players
    },

    prepareCup: function() {

        // Send "invitations" to all players
        var msg = api.message.CUP_INVITATION_REQ.init();
        this.server.sendGlobalMessage(msg);

        // Generate cup
        cup.init();
        // Wait for attendees, then start the cup server
        setTimeout(cup.start, worldconfig.replytimeout*3600, null);
        setTimeout(cup.end, worldconfig.replytimeout*10000, null);
    },

    handleInvitationResp: function(message) {
        //console.log("world.handleInvitationResp:", message);
        // Route messages to the active cup
        if("apply" == cup.status) {
            cup.handleInvitationResp(message);
        }
        else {
            console.log("ERROR: world.cup.handleInvitationResp message received while no ongoing Cup: ", message);
        }
    },

    cupStatus: function() {
        return cup.status;
    }

}

var cup = {

    status: "closed",  // "closed", "apply", "ongoing"
    cupcount: 0,
    attendees: [],

    init: function() {
        cup.status = "apply";
    },

    start: function() {
        console.log("cup.start");
        if(cup.attendees.length)
        cup.status = "ongoing";
        cup.cupcount++;
        cup.server.start();
    },

    handleInvitationResp: function(message) {
        console.log("cup.handleInvitationResp:", message.response, "from", message.username);
        if("OK" == message.response) {
            cup.attendees.push(message);
        }
    },

    end: function() {
        console.log("cup.end");
        // Publish cup chart

        // Share awards

        // Store Cup statistics to DB or just the matches?

        // Clear stats
        cup.attendees = [];

        // Keep the status server up and running
        cup.status = "closed";
    },

    server: {
        chart: 0,
        port: 0,

        start: function() {
            if(this.port == 0) {
                this.port = worldconfig.webserver.port;
                this.startweb(this);
            }
        },

        update: function() {
            console.log("cup.server.update");
        },

        generateCharts: function() {
            var chart =
                '<table>'+

                '<tr><th>CUP</th><th>&nbsp;</th></tr>'+
                '<tr><td>Name:</td><td>' + worldconfig.name + ' Cup #' + cup.cupcount + '</td></tr>'+
                '<tr><td>Started:</td><td>' + new Date() + ' (' + Date.now() + ')</td></tr>'+
                '<tr><td>#teams:</td><td>' + cup.attendees.length + '</td></tr>'+
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

module.exports = world;
