var _g_Objects = [];



Crafty.c('Ape', {
    head:{},
    torso:{},
    weapon:{},
    Ape: function() {
            //setup animations
            this.requires("SpriteAnimation, Collision, Grid")
          
        //change direction when a direction change event is received
            .bind("NewDirection",
                  function (direction) {
                      if (direction.x < 0) {
                          if (!this.isPlaying("walk_left")){
                              this.stop().animate("walk_left", 10, -1);
                              if ( this.head ) this.head.stop().animate("walk_left", 10, -1);
                              if ( this.torso ) this.torso.stop().animate("walk_left", 10, -1);
                              if ( this.weapon ) this.weapon.stop().animate("walk_left", 10, -1);
                          }
                      }
                      if (direction.x > 0) {
                          if (!this.isPlaying("walk_right")){
                              this.stop().animate("walk_right", 10, -1);
                              if ( this.head )this.head.stop().animate("walk_right", 10, -1);
                              if ( this.torso )this.torso.stop().animate("walk_right", 10, -1);
                              if ( this.weapon )this.weapon.stop().animate("walk_right", 10, -1);
                          }
                      }
                      if (direction.y < 0) {
                          if (!this.isPlaying("walk_up")){
                              this.stop().animate("walk_up", 10, -1);
                              if ( this.head ) this.head.stop().animate("walk_up", 10, -1);
                              if ( this.torso ) this.torso.stop().animate("walk_up", 10, -1);
                              if ( this.weapon ) this.weapon.stop().animate("walk_up", 10, -1);
                          }
                      }
                      if (direction.y > 0) {
                          if (!this.isPlaying("walk_down")){
                              this.stop().animate("walk_down", 10, -1);
                              if ( this.head ) this.head.stop().animate("walk_down", 10, -1);
                              if ( this.weapon ) this.weapon.stop().animate("walk_down", 10, -1);
                          }
                      }
                      if(!direction.x && !direction.y) {
                          this.stop();
                          if ( this.head ) this.head.stop();
                          if ( this.torso ) this.torso.stop();
                          if ( this.weapon) this.weapon.stop();
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


function LoadTileMap( file)
{
    var ASSET_PREFIX = '../assets/maps/';

    // try to read json tile map
    $.getJSON( ASSET_PREFIX+file, function(map) {                 
        var tilesetIndices = [];
        for ( var i=0;i<map.tilesets.length;i++)
        {
            // process first tileset
            var tileset = map.tilesets[i];
            
            var tmp = {};
            var newName = map.properties.name+''+i;
            tmp[newName] = '[0,0]';
            // register sprite
            Crafty.sprite(map.tilewidth, map.tilewidth, ASSET_PREFIX+tileset.image, tmp, tileset.spacing);
            
            // store first index
            tilesetIndices[i]=tileset.firstgid;
        }

        
        /*console.log('Map:'+map.height+'x'+map.width);
        console.log('Tile size:'+map.tileheight+'x'+map.tilewidth);
        console.log(tileset.image);
        console.log(map.layers[n].name);
        console.log('Map is called: '+map.properties.name);*/
 
       // add name dynamically so this can be made as proper function


        
        for( var layer=0; layer<map.layers.length;layer++)
        {
            var currRow = 0;
            var currColumn = 0;
            // Process layers 
            for(var i in map.layers[layer].data)
            {
                

                // indices in JSON format are:
                // 0: no tile.
                // X: first tile in tileset

                if ( map.layers[layer].data[i] > 0 )
                {
                    var tilesetIndex = 0;
                    // determine tileset we are using
                    while ( map.layers[layer].data[i] > tilesetIndices[tilesetIndex+1]) 
                        tilesetIndex++;
                    //console.log("Tilesetindex for "+layer+' is ' + tilesetIndex);

                    var tileset = map.tilesets[tilesetIndex];
                    
                    // How many columns does our tileset contain
                    var cols = Math.floor(tileset.imagewidth/(tileset.tileheight+tileset.spacing));

                    // reduce first index number from to get proper coordinates
                    var index = map.layers[layer].data[i]-tilesetIndices[tilesetIndex];
                    var yc = Math.floor(index/cols);
                    var xc = index - (cols*yc);
                    
                    // Create Crafty entity with plain sprite to be drawn.
                    // attr x,y are expressed in pixels.
                    var GROUND_Z = -1;
                    var spriteName = map.properties.name+tilesetIndex;
                    Crafty.e("2D, DOM, Sprite, "+spriteName)
                        .sprite(xc,yc)
                        .attr({x:currColumn*tileset.tilewidth, y:currRow*tileset.tileheight, z:GROUND_Z+layer});       
                }
                // next tile, take care of indices.
                currColumn++;
                if ( currColumn >= map.width ) {
                    currColumn = 0;
                    currRow++;
                }
                
            }
        }
    });
}


/* A very crude code for displaying arena */
function DisplayArena()
{

    LoadTileMap( 'test.json');
    
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
    /*Crafty.sprite(64, "../pics/walkcycle/BODY_skeleton.png", {
      skel_walk_back: [0, 0],
      skel_walk_left: [0, 1],
      skel_walk_front: [0, 2],
      skel_walk_right: [0, 3]
      });*/

    LoadObjectAsset( 'BODY', 'skeleton');
    LoadObjectAsset( 'HEAD', 'hair_blonde');
    LoadObjectAsset( 'TORSO', 'chain_armor_torso');

    var skel = Crafty.e("2D, DOM, Multiway, Keyboard, LeftControls, Mouse, Ape, SpriteAnimation, BODY_skeleton_walk")
        .attr({x:300, y:300, z:1})
        .leftControls(1)
        .animate("walk_up",1,0,8)
        .animate("walk_left",1,1,8)
        .animate("walk_down",1,2,8)
        .animate("walk_right",1,3,8)
       
        .Ape()
        .bind("Click", function() {
            alert("Clicked");
        });

    skel.head = Crafty.e("2D, DOM, SpriteAnimation, HEAD_hair_blonde_walk")
        .attr({x:300, y:300, z:2})
        .animate("walk_up",1,0,8)
        .animate("walk_left",1,1,8)
        .animate("walk_down",1,2,8)
        .animate("walk_right",1,3,8)
       
    skel.torso = Crafty.e("2D, DOM, SpriteAnimation, TORSO_chain_armor_torso_walk")
        .attr({x:300, y:300, z:2})
        .animate("walk_up",1,0,8)
        .animate("walk_left",1,1,8)
        .animate("walk_down",1,2,8)
        .animate("walk_right",1,3,8)



    skel.attach(skel.head,skel.torso);
    
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
	
	switch(type) {
	    // User creation and login
	    case 2: // User exists, clear fields
		console.log("User exists");
		document.getElementById('username').value = '';
		document.getElementById('password').value = '';
		break;
	    
	    case 5:
	    case 11:
		    var hash = Sha1.hash(JSON.parse(data).salt + $('#password').val());
		    this.send(type, ['{"username":"' + $('#username').val() + '", "pwdhash":"' + hash + '"}']);
		    console.log('sending: [{"username":"' + $('#username').val() + '", "pwdhash":"' + hash + '"}]');
	      break;
	    
	    case 10: // Request salt
		    this.send(type, ['{"username":"' + $('#username').val() + '"}']);
	      break;
	    
	    case 12: // Authenticated by the server - proceed to game lobby
		if(JSON.parse(data).response !== "NOK") {
		    $.cookie("gas-login", data);
		    $('#login').fadeOut(500, function(){
			$('#login').empty();
			Crafty.scene("main",DisplayArena());
		    });
		}
		else {console.log("Login failed");
		}
	    break;
	    
	    default:
	      console.log("Default branch reached in 'message handling'");
	      break;
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




