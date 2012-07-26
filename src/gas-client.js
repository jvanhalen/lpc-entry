var _g_Objects = [];

Crafty.c('Ape', {
    Ape: function() {
            //setup animations
            this.requires("SpriteAnimation, Collision, Grid")
          
        //change direction when a direction change event is received
            .bind("NewDirection",
                  function (direction) {
                      if (direction.x < 0) {
                          if (!this.isPlaying("walk_left"))
                              this.stop().animate("walk_left", 10, -1);
                      }
                      if (direction.x > 0) {
                          if (!this.isPlaying("walk_right"))
                              this.stop().animate("walk_right", 10, -1);
                      }
                      if (direction.y < 0) {
                          if (!this.isPlaying("walk_up"))
                              this.stop().animate("walk_up", 10, -1);
                      }
                      if (direction.y > 0) {
                          if (!this.isPlaying("walk_down"))
                              this.stop().animate("walk_down", 10, -1);
                      }
                      if(!direction.x && !direction.y) {
                          this.stop();
                      }
                  })
            .bind('Moved', function(from) {
                if(this.hit('solid')){
                    this.attr({x: from.x, y:from.y});
                }
            })
            .onHit("fire", function() {
                this.destroy();
  			    // Subtract life and play scream sound :-)
            });
        return this;
    }
});



/* A very crude code for displaying arena */
function DisplayArena()
{

    var ASSET_PREFIX = '../assets/maps/';
    var MAP_NAME = "valhalla";
    
    // try to read json tile map
    $.getJSON('../assets/maps/test.json', function(map) {         
        // process first tileset
        var tileset = map.tilesets[0];

        console.log('Map:'+map.height+'x'+map.width);
        console.log('Tile size:'+map.tileheight+'x'+map.tilewidth);
        console.log(tileset.image);
        console.log(map.layers[0].name);

        // add name dynamically so this can be made as proper function
        var tmp = {};
        tmp[MAP_NAME] = '[0,0]';
        
        // register sprite
        Crafty.sprite(map.tilewidth, map.tilewidth, ASSET_PREFIX+tileset.image, tmp, tileset.spacing);

        // How many columns does our tileset contain
        var cols = Math.floor(tileset.imagewidth/(tileset.tileheight+tileset.spacing));
        var currRow = 0;
        var currColumn = 0;

        // Process first layer (ground layer)
        for(var i in map.layers[0].data)
        {
            // indices in JSON format are:
            // 0: no tile.
            // 1: first tile in tileset, coordinates [0,0]
            var index = map.layers[0].data[i]-1;
            var yc = Math.floor(index/cols);
            var xc = index - (cols*yc);

            // Create Crafty entity with plain sprite to be drawn.
            // attr x,y are expressed in pixels.
            var GROUND_Z = -1;
            Crafty.e("2D, DOM, Sprite, "+MAP_NAME)
                .sprite(xc,yc)
                .attr({x:currColumn*tileset.tilewidth, y:currRow*tileset.tileheight, z:GROUND_Z});       

            // next tile, take care of indices.
            currColumn++;
            if ( currColumn >= map.width ) {
                currColumn = 0;
                currRow++;
            }

        }
        
    });
    // Add a title
    Crafty.e("2D, DOM, Text").attr({ w: 400, h: 20, x: 150, y: 10 })
        .text("Kalevala Heroes / GAS Valhalla")
        .css({ 
            "text-align": "center",
            "font-family": "Impact",
            "font-size": "24pt"
        });
    // Add some author info
    Crafty.e("2D, DOM, Text").attr({ w: 400, h: 20, x: 150, y: 45 })
        .text("by Team Oldman & Green (c) 2012")
        .css({ 
            "text-align": "center",
            "font-family": "Arial",
            "font-size": "8pt"
        });
    // Our happy skeleton 
    var skel = Crafty.e("2D, DOM, Keyboard, LeftControls, Mouse, Ape, SpriteAnimation, skel_walk_back")
        .attr({x:300, y:300, z:1})
        .leftControls(1)
        .animate("walk_up",1,0,8)
        .animate("walk_left",1,1,8)
        .animate("walk_down",1,2,8)
        .animate("walk_right",1,3,8)
        .animate("stand_up",0,0,0)
        .animate("stand_left",0,1,1)
        .animate("stand_down",0,2,2)
        .animate("stand_right",0,3,3)
        .Ape()
        .bind("Click", function() {
            alert("Clicked");
        });
    
        
    //console.log("skel id:"+skel[0]);
    
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




