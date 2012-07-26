var _g_Objects = [];



/* A very crude code for displaying arena */
function DisplayArena()
{



    // try to read json tile map
    $.getJSON('../assets/maps/test.json', function(map) {         
        // process first tileset
        var tileset = map.tilesets[0];

        console.log('Map:'+map.height+'x'+map.width);
        console.log('Tile size:'+map.tileheight+'x'+map.tilewidth);
        console.log(tileset.image);
        console.log(map.layers[0].name);

        // register as sprite
        Crafty.sprite(map.tilewidth, map.tilewidth, '../assets/maps/'+tileset.image, {
          valhalla: [0, 0]
        }, tileset.spacing);
        
        /*var rows = Math.floor(tileset.imagewidth/(tileset.tileheight+tileset.spacing));
        for(var i in map.layers[0].data)
        {
            
            var x = Math.floor((i/rows));
            var y = i - (rows*x);
            console.log(i +' = x:'+x+', y:'+y);
        }*/

       // TEST top left corner tile
       Crafty.e("2D, DOM, Sprite, valhalla")
         .sprite(2,0)
         .attr({x:0, y:0, z:-1});
       Crafty.e("2D, DOM, Sprite, valhalla")
         .sprite(3,0)
         .attr({x:32, y:0, z:-1});
    });


        var skel = Crafty.e("2D, DOM, Keyboard, LeftControls, Mouse, SpriteAnimation, skel_walk_back")
             .attr({x:0, y:0, z:1})
             .leftControls(1)
             .animate("walk_back",1,0,8)
             .animate("walk_left",1,1,8)
             .animate("walk_front",1,2,8)
             .animate("walk_right",1,3,8)
             .animate("stand_back",0,0,0)
             .animate("stand_left",0,1,1)
             .animate("stand_front",0,2,2)
             .animate("stand_right",0,3,3)
             .bind("Click", function() {

                 alert("Clicked");
             })
            .bind('KeyDown', function(){
                this.stop();
                if ( this.isDown('W')){
                    if( !this.isPlaying("walk_back"))
                        this.animate("walk_back", 15,1);
                } else if ( this.isDown('S')){
                    if ( !this.isPlaying("walk_front"))
                        this.animate("walk_front", 15,1);
                } else if ( this.isDown('A')){
                    if ( !this.isPlaying("walk_left"))
                        this.animate("walk_left", 15,1);
                } else if ( this.isDown('D')){
                    if ( !this.isPlaying("walk_right"))
                        this.animate("walk_right", 15,1);
                } 
            })
        .bind('KeyUp', function(){
            this.stop();
            if ( this.isDown('W')){
                this.animate("stand_back",15,1);
            } else if ( this.isDown('S')){
                this.animate("stand_front",15,1);
            } else if ( this.isDown('A')){
                this.animate("stand_left ",15,1);
            } else if ( this.isDown('D')){
                this.animate("stand_right ",15,1);
            } 

        });
        console.log("skel id:"+skel[0]);
    
         
        
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
            $.cookie("gas-login", data);
            $('#login').fadeOut(500, function(){
                $('#login').empty();

                Crafty.scene("main",DisplayArena());
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




