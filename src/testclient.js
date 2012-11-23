var core = require('core');

var TestClient = Class(function() {
    Maple.Client(this, 30, 60);

}, Maple.Client, {

    started: function() {
        this.log('Client started');
    },

    update: function(t, tick) {
        //this.log('Running');
    },

    render: function(t, dt, u) {

    },

    stopped: function() {
        this.log('Stopped');
    },

    connected: function() {
        this.log('Connection established');
    },

    message: function(type, tick, data) {
        //this.log('Message received:', type, data);
    },

    syncedMessage: function(type, tick, data) {
        this.log('Synced message received:', type, data);
    },

    closed: function(byRemote, errorCode) {
        this.log('Connection closed:', byRemote, errorCode);
    }

});

var client = new TestClient();
client.connect('localhost', 8080);