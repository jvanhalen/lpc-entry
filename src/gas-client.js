var g_currentView = '';
var g_gladiatorPit = {};
var g_Animations = {}; /* storage of all animations objects used in pre-loading */
var g_pitMessage = null;

function PreloadAnimation(animFile) {

	console.log('calling PreloadAnimation for = '+'../assets/equipment/'+animFile);
	$.ajax({
        url: '../assets/equipment/'+animFile,
        dataType: 'json',
        data: undefined,
        async: false,
        success: function(a) {     
            g_Animations[a.name] = a;
            console.log('Preload Done for '+a.name);
        }
    });
}

function GetLoadableAssetsFromTileMap( file, assetArray )
{
    var ASSET_PREFIX = '../assets/maps/';
    // try to read json tile map
    $.getJSON( ASSET_PREFIX+file, function(map) {                 
        
        for ( var i=0;i<map.tilesets.length;i++)
        {
            var assetFile = ASSET_PREFIX+map.tilesets[i].image;
            if ( jQuery.inArray(assetFile, assetArray) == -1)
                assetArray.push(assetFile);
        }
    });
}

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

var text = "Känsä the Skeleton<br>Health: 20<br>Strength:2<br>Dexterity: 5<br>Mana:7<br>Age:5/35<br>Salary:32<br>Fights: 0<br>KOs:2<br>Injury: 0<br>Melee weapon: Fist<br>missile weapon: None<br>Spell: None<br>Dodge: Dart<br>Magic res: 20%<br>Armour: None";

var shopListObjs = [];
var magicItems = [
    {
        name:'Rain Ward',
        mana:1,
        duration:10,
        effect: 'Subtracts damage by 1 point(s)',
        cost:100,
        desc:'This spell has made rain capes unnecessary'
    },
    {                
        name:'Punch Ward',
        mana:2,
	    duration:10,
	    effect:'Subtracts damage by 2 point(s)',
	    cost:200,
	    desc:'Wards from a punch'
    }
];
var mightItems = [
    {
        name:'Sharp Stick',
        effect:'2-5',
	    cost:70
    },
	{
        name:'Cheap Spear',
	    effect:'2-7',
	    cost:129
    }
];

function showMagicView()
{
    var _y = 200;
    for( var i in shopListObjs )
    {
        shopListObjs[i].destroy();
    }
    shopListObjs = [];
    for( var i in magicItems )
    {
        var item = magicItems[i];
        _y = _y + 32;
        shopListObjs.push( 
            Crafty.e("2D, DOM, Text, Mouse").attr({w:300,h:32, x: 102, y: _y, z: 3 })
                .text(item.name+' ' + item.mana + ' ' + item.duration + ' ' + item.effect + ' ' + item.cost + ' ' + item.desc)
                .css({ 
                    "text-align": "left",
                    "font-family": "Arial",
                    "font-size": "8pt",
                    "color": "#000000"
                })
                .bind('Click', function(){
                    alert('Selected spell'+this[0]);
                })
        );
        shopListObjs.push( 
            Crafty.e("2D, DOM, Sprite, Mouse, staff"+i)
                .attr({x: 54, y: _y, z: 3 })
                .bind('Click', function(){
                    alert('Selected equipment'+this[0]);
                }));
    }
}

function showMightView()
{
    var _y = 200;
    for( var i in shopListObjs )
    {
        shopListObjs[i].destroy();
    }
    shopListObjs = [];
    for( var i in mightItems )
    {
        var item = mightItems[i];
        _y = _y + 32;
        shopListObjs.push( 
            Crafty.e("2D, DOM, Text, Mouse").attr({w:200, h:32, x: 102, y: _y, z: 3 })
                .text(item.name+' ' +item.effect + ' ' + item.cost )
                .css({ 
                    "text-align": "left",
                    "font-family": "Arial",
                    "font-size": "8pt",
                    "color": "#000000"
                })
                .bind('Click', function(){
                    alert('Selected equipment'+this[0]);
                })
        ); 
        shopListObjs.push( 
            Crafty.e("2D, DOM, Sprite, Mouse, spear"+i)
                .attr({x: 54, y: _y, z: 3 })
                .bind('Click', function(){
                    alert('Selected equipment'+this[0]);
                }));
    }
}

function showLoginView()
{

    var tmpObj = Crafty.e("2D, DOM, Mouse, Ape, Sprite, transparent")
        .attr({x:160, y:100, z:6})
        .setupAnimation('skeleton_body')
        .walk.body.animate('walk_right', 10, -1);
    
    var tmpObj2 = Crafty.e("2D, DOM, Mouse, Ape, Sprite, transparent")
        .attr({x:500, y:100, z:6})
	    .setupAnimation("human_body")
        .walk.body.animate('walk_left', 10, -1);

    Crafty.e("2D, DOM, Text")
        .text("Waiting for login...")
        .css({
            "font-family":"Fanwood",
            "font-size":"24pt",
            "text-align":"center"})
        .attr({x:170, y:100, w:400});

}

function showGladiatorView()
{

    LoadTileMap( 'inventory.json');
    

    Crafty.sprite(64,'../pics/walkcycle/BODY_skeleton.png', {
        skeleton: [0,0]
    });

    Crafty.sprite(32, '../assets/maps/items_small.png', {
        helmet0: [0,0],
        helmet1: [1,0],
        helmet2: [2,0],
        boots0: [0,1],
        boots1: [1,1],
        boots2: [2,1],
        necklace0: [0,3],
        necklace1: [1,3],
        necklace2: [2,3],
        sword0: [0,4],
        sword1: [1,4],
        sword2: [2,4],
        axe0: [0,5],
        axe1: [1,5],
        axe2: [2,5],
        mace0: [0,6],
        mace1: [1,6],
        mace2: [2,6],
        spear0: [0,7],
        spear1: [1,7],
        spear2: [2,7],
        staff0: [0,8],
        staff1: [1,8],
        staff2: [2,8],
        shield0: [0,9],
        shield1: [1,9],
        shield2: [2,9]
    });
    

    Crafty.e("2D, DOM, Sprite, Mouse, skeleton")
        .attr({x:450, y:220, z:3})
        .sprite(0,1)
        .bind('MouseOver', function(e){
            this.sprite(0,2);
        })
        .bind('MouseOut', function(e){
            this.sprite(0,1);
        });
              

    Crafty.e("2D, DOM, Text").attr({ w: 400, h: 120, x: 520, y: 170, z: 3 })
        .text(text)
        .css({ 
            "text-align": "left",
            "font-weight":"bold",
            "font-family": "Fanwood",
            "font-size": "12pt",
            "color": "#000000"
        });


    Crafty.e("2D, DOM, Text").attr({ w: 400, h: 120, x: 210, y: 50, z: 3 })
        .text("Gladiator Properties")
        .css({ 
            "text-align": "left",
            "font-weight": "bold",
            "font-family": "Fanwood",
            "font-size": "24pt",
            "color": "#000000"
        });
    Crafty.e("2D, DOM, Text").attr({ w: 400, h: 120, x: 50, y: 150, z: 3 })
        .text("Shop for Everything")
        .css({ 
            "text-align": "left",
            "font-weight": "bold",
            "font-family": "Fanwood",
            "font-size": "24pt",
            "color": "#000000"
        });

    Crafty.e("2D, DOM, Text, Mouse").attr({x: 50, y: 200, z: 3 })
        .text("Might")
        .css({ 
            "text-align": "left",
            "font-family": "Arial",
            "font-size": "12pt",
            "color": "#000000"
        })
        .areaMap([0,0],[0,60],[60,60],[60,0])
        .bind('Click', function(e){
            showMightView();
        });
    Crafty.e("2D, DOM, Text, Mouse").attr({x: 150, y: 200, z: 3 })
        .text("Magic")
        .css({ 
            "text-align": "left",
            "font-family": "Arial",
            "font-size": "12pt",
            "color": "#000000"
        })
        .areaMap([0,0],[0,60],[60,60],[60,0])
        .bind('Click', function(e){
            showMagicView();
        });
    
    
   
    
    Crafty.e("2D, DOM, Text, Mouse").attr({x: 50, y: 50, z: 3 })
        .text("Back")
        .css({ 
            "text-align": "left",
            "font-family": "Arial",
            "font-size": "12pt",
            "color": "#f00"
        })
        .areaMap([0,0],[0,60],[60,60],[60,0])
        .bind('Click', function(e){
            Crafty.scene("managerView");
        });
       
}
/* A very crude code for displaying arena */
function showManagerView()
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
    // Testing info
    Crafty.e("2D, DOM, Text").attr({ w: 140, h: 20, x: 42, y: 220, z:8 })
        .text("~Legend~")
        .css({ 
            "text-align": "center",
            "font-family": "Fanwood",
            "font-size": "18pt",
            "color":"#734212"
        });
    Crafty.e("2D, DOM, Text").attr({ w: 130, h: 300, x:52 , y: 260, z:8 })
        .text("F1: Wear Robe<br>F2: Wear Leather<br>F3: Wear Plate<br>F4: Go Nude<br>X: Bones <br>H: Flesh<br>Arrow keys: Slash!<br>WASD: move")
        .css({ 
            "text-align": "left",
            "font-family": "Fanwood-Text",
            "font-size": "10pt",
            "color": "#5c3111"
        });
    var tmpObj = Crafty.e("2D, DOM, Multiway, Keyboard, LeftControls, Mouse, Ape, Sprite, transparent")
        .attr({x:370, y:300, z:5})
        .leftControls(1)
        .setupAnimation("skeleton_body")
        .Ape()
        .bind("Click", function(){
            Crafty.scene("gladiatorView");
        })
        .bind('KeyDown', function(){
            if ( this.isDown('LEFT_ARROW')) {
                this.slashAttack('left');
            }
            if ( this.isDown('RIGHT_ARROW')) {
                this.slashAttack('right');
            }
            if ( this.isDown('DOWN_ARROW')) {
                this.slashAttack('down');
            }
            if ( this.isDown('UP_ARROW')) {
                this.slashAttack('up');
            }
            if ( this.isDown('F1'))
            {
                this.setupAnimation("robe");
            }
            if ( this.isDown('F2'))
            {
                this.setupAnimation("leather_armor");
            }
            if ( this.isDown('F3'))
            {
                this.setupAnimation("plate_armor");
            }
            if ( this.isDown('F4'))
            {
                this.setupAnimation("no_armor");
            }
            if ( this.isDown('X'))
            {
                this.setupAnimation("skeleton_body");
            }
            if ( this.isDown('H'))
            {
                this.setupAnimation("human_body");
            }
        })


    Crafty.sprite(64, '../pics/items.png', {
        big_boys_do_battle: [0,0]
    });

    Crafty.e("2D, DOM, Mouse, Sprite, big_boys_do_battle")
        .attr({x:367, y:420, z:3})
        .sprite(1,9)
        .bind('Click', function(){
            Crafty.scene("gladiatorPitView");
        });


    //console.log("skel id:"+skel[0]);
    
}

function showArenaView()
{
    LoadTileMap( 'arena.json');
    Crafty.e("2D, DOM, Mouse, Text")
        .attr({w:200, h:32, x:20, y:10})
        .text('Quit')
        .bind('Click', function(){
            Crafty.scene("managerView");
        });
}

function showGladiatorPitView()
{
    console.log('loading tile map');
    
    LoadTileMap( 'gladiatorpit.json' );

    console.log('loading tile map done!');

    Crafty.e("2D, DOM, Mouse, Text")
        .attr({w:200, h:32, x:20, y:10})
        .text('Quit')
        .bind('Click', function(){
            Crafty.scene("managerView");
        }); 
    // Some info
    Crafty.e("2D, DOM, Mouse, Text")
        .attr({w:200, h:232, x:100, y:200, z:8})
        .css({ 
            "text-align": "left",
            "font-family": "Fanwood-Text",
            "font-size": "10pt",
            "color": "#5c3111"
        })
        .text('Welcome to the Pit! Our finest warriors are at your disposal...for a price.');
    // Header
    Crafty.e("2D, DOM, Mouse, Text")
        .attr({w:340, h:64, x:200, y:50, z:8})
        .css({ 
            "text-align": "center",
            "font-family": "Fanwood",
            "font-size": "24pt",
            "color": "#5c3111"
           
        })
        .text('Gladiator Pit');
    

    window.setTimeout(function(){
        // pray tell, server, best deals for today?
        gas.send(13, ['{ "name":"LIST_AVAILABLE_GLADIATORS"}']);
    }, 1000);

}

function gladiatorHTML(gladiator)
{
    var HTMLstr = 
        'Name:'+gladiator.name+'<br>'+
        'Age:'+gladiator.age+'<br>'+
        'Health:'+gladiator.health+'<br>'+
        'Nimbleness:'+gladiator.nimbleness+'<br>'+
        'Strength:'+gladiator.strength+'<br>'+
        'Mana:'+gladiator.mana+'<br>'+
        'Salary:'+gladiator.salary+'<br>'+
        'Fights:'+gladiator.fights+'<br>'+
        'Knockouts:'+gladiator.knockouts+'<br>'+
        'Injured:'+gladiator.injured;

    return HTMLstr;
}

function pitCreateGladiators(gladiatorData){


    var pos = { "x" : 414,
                "y" : 170 };
    var offset = { "x": 96, 
                   "y": 128 };
    var count = 0;

    // parse gladiator JSON
    $.each(gladiatorData, function(key,gladiator)
    {
        console.log('Creating gladiator showcase for ' + gladiator.name);

        var body = "human_body";
        if ( gladiator.race == "skeleton" ) 
            body = "skeleton_body";

        var xPos = pos.x+(offset.x*count);
        var obj = Crafty.e("2D, DOM, Delay, Mouse, Ape, Sprite, transparent")
            .attr({x:xPos, y:170, z:5})
            .setupAnimation(body)
            .bind("MouseOver", function(e){
                this.hideAll();
                this.enableAnimation(this.walk);
                this.walk.body.stop().animate("walk_left", 20, -1);

                // remove previous and replace with new description
                if ( g_pitMessage ) g_pitMessage.destroy();
                g_pitMessage = Crafty.e("2D, DOM, Text")
                    .attr({w:200, h:232, x:100, y:300, z:8})
                    .css({ 
                        "text-align": "left",
                        "font-family": "Fanwood-Text",
                        "font-size": "10pt",
                        "color": "#5c3111"
                    })
                    .text(gladiatorHTML(gladiator));
            })
            .bind("MouseOut", function(e){
                this.hideAll();
                this.enableAnimation(this.walk);
                this.walk.body.stop().sprite(0,3);
                // remove message
                if ( g_pitMessage ) g_pitMessage.destroy();
                g_pitMessage = null;
            })
            .walk.body.stop().animate('walk_down',10,-1);

        count = count + 1;

    });
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
		    displayLogin();
            /*$('#login').fadeOut(500, function(){
			    $('#login').empty();
                $('#login').text('<h1>Welcome back, '+data.username+'!</h1>');
                $('#login').fadeIn('slow', function(){
                    Crafty.scene("managerView");
                });
		    });*/
		}
		else {console.log("Login failed");
		}
	    break;
        case 13:
                console.log('Handling gladiator list');
                pitCreateGladiators(JSON.parse(data[0]).free);
        break;
	    case 50:
           console.log("Received: " + data[0].name);
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




