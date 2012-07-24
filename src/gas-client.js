/* A very crude code for displaying arena */
function DisplayArena()
{
		Crafty.init(800, 800);
        Crafty.background('rgb(255,127,0)');
		// YOUR GAME CODE
        for (var i = 0; i < 12; i++) {
             Crafty.e("2D, DOM, LeftControls, Mouse, char" + i)
             .attr({x:0, y:i*53, z:1})
             .leftControls(1)
             .bind("Click", function() {
                            alert("Clicked");
                            });
       }
}

/*global Class, Maple */
var GAS = Class(function() {
    Maple.Client(this, 30, 60);

}, Maple.Client, {

    started: function() {
        console.log('started');
    },

    update: function(t, tick) {
        //console.log(t, tick, this.getRandom());
        //this.send(4, ['Hello world!']);
    },

    render: function(t, dt, u) {
        
    },

    stopped: function() {
        console.log('stopped');
    },

    connected: function() {
        console.log('connected');
    },

    message: function(type, tick, data) {
        console.log('message:', type, tick, data);
        /* Authenticated by server */
        if ( type == 6)
        {
            $('#login').fadeOut(500, function(){
                $('#login').empty();
                DisplayArena();
            });

        }
        return true; // return true to mark this message as handled
    },

    syncedMessage: function(type, tick, data) {
        console.log('synced message:', type, tick, data);
    },

    closed: function(byRemote, errorCode) {
        console.log('Closed:', byRemote, errorCode);
    }

});




