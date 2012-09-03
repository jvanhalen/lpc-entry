var g_currentView = '';
var g_gladiatorPit = {};
var g_Animations = {}; /* storage of all animations objects used in pre-loading */
var g_pitMessage = null;
var g_currentGrid = null;
var g_currentGladiator = null;
var g_gladiatorShowCase = null;	// Gladiator at gladiatorView
var g_enterArenaButton = null;
var g_gladiators = [];
var g_timer = { view: null, time: 0};
var loadAudio = true;
var g_ingame = null;

var g_battleTeam = {

    _team: [],
    _TEAM_MAX_SIZE: 4,

    toggle: function(name) {

        var index = this._team.indexOf(name);
        if ( index != -1 )
        {
            this._team.splice(index,1); 
        } 
        else if ( this._team.length < this._TEAM_MAX_SIZE )
        {
            this._team.push(name);
        } 
        else 
        {
            console.log('Battle team full');
        }
    },

    get: function(){
        return JSON.parse(JSON.stringify(this._team));
    },
    
    has: function(name){
        return (this._team.indexOf(name)!=-1);
    }
    
};

// Audio switches
var muted = false;
var nowPlaying = undefined;

Crafty.c('Dummy', {
    dummyIndex: 0,
    setDummyIndex: function(i)
    {
        this.dummyIndex = i;
        return this;
    }
});

// grid component responsible for "griddy" game object movement.
Crafty.c('Grid', {
    tile_x: null,
    tile_y: null,
    movePattern: null, // [[x,y], [,], ...]
    moving: false,
    targetPos:null,
    orig_x: null, // used for manager view for return to dummy
    orig_y: null,

    init: function()
    {
        this.requires('Tween');
        this.movePattern = new Queue();
        this.moving = false;
    },
    Grid: function(xc,yc){
        this.tile_x = xc;
        this.tile_y = yc;
        this.attr({x:this.tile_x*32-16, y:this.tile_y*32-32, z:7})
        this.orig_x = xc;
        this.orig_y = yc;
        return this;
    },
    SetMovePattern: function(path){
        //console.log('setting new pattern, length:' + path.length);
        for(var i in path ){
            this.movePattern.enqueue(path[i]);
        }
        return this;
    },
    ClearMovePattern: function()
    {
        while(!this.movePattern.isEmpty())
            this.movePattern.dequeue();
    },
    coordinatesMatch: function(tx,ty)
    {
        if (this.x == tx*32-16 &&
            this.y == ty*32-32)
            return true;
        else
            return false;
    },
    UpdateMovement: function(){

        if ( !this.movePattern.isEmpty() )
        {
            if ( !this.targetPos )
            {
                // get first position to move into
                var pos = this.movePattern.peek();
                this.targetPos = pos;
                this.Step(pos[0], pos[1]);

            }
            else if ( this.coordinatesMatch(this.targetPos[0], this.targetPos[1]) )
            {
                // remove coordinate since we have reached it.
                this.movePattern.dequeue();
                //update tile position.
                this.tile_x = this.targetPos[0];
                this.tile_y = this.targetPos[1];

                this.targetPos = null;

            }
        }
        else
        {
            this.startWalking({x:0,y:0},0);
        }
        return this;
    },
    Step: function(x,y) {

        var dirx = x-this.tile_x;
        var diry = y-this.tile_y;
        var steps_x = 0;
        var steps_y = 0;
        // move object gradually
        this.tween({x:this.x+(dirx*32), y:this.y+(diry*32)}, 10);
        // animate walking
        this.startWalking({x:dirx,y:diry},20);

        return this;
    }


});

function SetArenaEnabled(value){
    // destroy old one
    if ( g_enterArenaButton ) g_enterArenaButton.destroy();
    
    if ( value == true) {
        g_enterArenaButton = Crafty.e("2D, DOM, Mouse, Text")
            .attr( {w:130, h:20, x:340, y:100, z:9})
            .text("Battle awaits you...")
            .css({
                "text-align": "center",
                "font-family": "Fanwood",
                "font-size": "13pt",
            })
            .bind('Click', function(){
                Crafty.scene("arenaView");
            });
        
    } else {
        g_enterArenaButton = Crafty.e("2D, DOM, Mouse, Text")
            .attr( {w:130, h:20, x:340, y:100, z:9})
            .text("Thou shall not pass!")
            .css({
                "text-align": "center",
                "font-family": "Fanwood",
                "font-size": "13pt",
            })
            .bind('Click', function(){
                
                if ( g_pitMessage ) g_pitMessage.destroy();
                g_pitMessage = Crafty.e("2D, DOM, Text")
                    .attr({w:200, h:232, x:100, y:300, z:8})
                    .css({
                        "text-align": "left",
                        "font-family": "Fanwood-Text",
                        "font-size": "15pt",
                        "color": "#5c3111"
                    })
                    .text("Please challenge someone first!");
            });
        
    }
    
}

function HandleMouseClick(x,y,passable)
{
    console.log("Mouse click at " + x + "," + y + ":" + passable);
    if ( !g_currentGladiator) {
        console.log("there is no gladiator!");
        return;
    }
    if ( !g_currentGrid )
    {
        console.log("There is no grid!");
        return;
    }


    var backup = g_currentGrid.clone();
    var finder = new PF.AStarFinder();
    var path = finder.findPath( g_currentGladiator.tile_x,
                                g_currentGladiator.tile_y,
                                x,y, backup );
    console.log("start point:"+g_currentGladiator.tile_x +","+g_currentGladiator.tile_y);
    console.log("Path found:"+JSON.stringify(path));
    g_currentGladiator.SetMovePattern( path );

}

function PreloadAudio() {

	// use ffmpeg2theora for mp3 --> oga conversion, then rename oga to ogg
	Crafty.audio.add({
	granbatalla: ["../assets/audio/granbatalla.ogg",
	"../assets/audio/granbatalla.m4a"],
	soliloquy: ["../assets/audio/soliloquy.ogg",
	"../assets/audio/soliloquy.m4a"]
	});
	loadAudio = false;
}

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

function LoadTileMap(file, createGrid)
{

    var ASSET_PREFIX = '../assets/maps/';
    var grid = undefined;

    // try to read json tile map

    $.ajax({
        url: ASSET_PREFIX+file,
        dataType: 'json',
        data: undefined,
        async: false,
        success: function(map){

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


            if ( createGrid)
            {
                grid = new PF.Grid(map.width, map.height);
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
                    if ( map.layers[layer].data[i] == 0 &&
                         map.layers[layer].name == "Collision" )
                    {
                        Crafty.e("2D, DOM, Collision, Grid, Mouse, Sprite, transparent")
                        // custom collisions need this also in ALL other colliding entities in order to work.
                            .collision([0,0],
                                       [map.tilewidth,0],
                                       [map.tilewidth, map.tileheight],
                                       [0,map.tileheight])
                            .attr({x:currColumn*map.tilewidth, y:currRow*map.tileheight, z:6})
                            .Grid(currColumn, currRow)
                            .bind("Click", function(){
                                HandleMouseClick(this.tile_x, this.tile_y, true);
                            });
                    }
                    else if ( map.layers[layer].data[i] > 0 )
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
                        // skip collision layer

                        if ( map.layers[layer].name == "Collision" )
                        {
                            if ( grid )
                                grid.setWalkableAt(currColumn, currRow, false);

                            Crafty.e("2D, DOM, Collision, Grid, Mouse, Sprite, solid, transparent")
                            // custom collisions need this also in ALL other colliding entities in order to work.
                                .collision([0,0],
                                           [map.tilewidth,0],
                                           [map.tilewidth, map.tileheight],
                                           [0,map.tileheight])
                                .attr({x:currColumn*map.tilewidth, y:currRow*map.tileheight, z:6})
                                .Grid(currColumn, currRow)
                                .bind("Click", function(){
                                    HandleMouseClick(this.tile_x, this.tile_y, true);
                                });

                        } else {
                            // determine which layer does this thing belong to
                            var layerZ = 0;
                            switch( map.layers[layer].name )
                            {
                            case "Ground":
                                layerZ = 0;
                                break;
                            case "Overlay":
                                layerZ = 1;
                                break;
                            case "Front":
                                layerZ = 8;
                                break;
                                // ones below should not exist in tile map,
                                // but let's be prepared.
                            case "Behind":
                                layerZ = 2;
                                break;
                            case "Body":
                                layerZ = 3;
                                break;
                            case "Equipment":
                                layerZ = 4;
                                break;
                            case "Weapon":
                                layerZ = 5;
                                break;
                            case "Mouse":
                                layerZ = 7;
                                break;
                            }
                            // create tile entity
                            Crafty.e("2D, DOM, Sprite, "+spriteName)
                                .sprite(xc,yc)
                                .attr({x:currColumn*tileset.tilewidth,
                                       y:currRow*tileset.tileheight,
                                       z:layerZ});
                        }
                    }
                    // next tile, take care of indices.
                    currColumn++;
                    if ( currColumn >= map.width ) {
                        currColumn = 0;
                        currRow++;
                    }

                }
            }
        }

    });


    return grid;
}

//var text = "Känsä the Skeleton<br>Health: 20<br>Strength:2<br>Dexterity: 5<br>Mana:7<br>Age:5/35<br>Salary:32<br>Fights: 0<br>KOs:2<br>Injury: 0<br>Melee weapon: Fist<br>missile weapon: None<br>Spell: None<br>Dodge: Dart<br>Magic res: 20%<br>Armour: None";

var shopListObjs = [];
var magicItems = [];
var mightItems = [];
var armourItems = [];

function handleItemSync(data) {

	magicItems = [];
	mightItems = [];
	armourItems = [];

	for(var key in data.itemlist) {
		switch(data.itemlist[key].type) {
			case "weapon":
				mightItems[mightItems.length] = data.itemlist[key];
				break;
			case "spell":
				magicItems[magicItems.length] = data.itemlist[key];
				break;
			case "armour":
				armourItems[armourItems.length] = data.itemlist[key];
				break;
			case "consumable":
				magicItems[magicItems.length] = data.itemlist[key];
				break;
			default:
				console.log("handleItemSync: Unidentified non-Flying Object (UN-FO).");
				break;
		}
	}
}

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
            Crafty.e("2D, DOM, Text, Mouse").attr({w:300,h:32, x: 102, y: _y, z: 3, item: item })
                .text('<a href="#" title="Print more specific info here">'+item.name+'</a> mana:' + item.mana + ' delay: ' + item.delay + ' price: ' + item.price + '<br /> ' + item.description)
                .css({
                    "text-align": "left",
                    "font-family": "Arial",
                    "font-size": "10pt",
                    "color": "#000000"
                })
                .bind('Click', function(){
                    //alert('Selected spell'+this[0]);
					gas.send("BUY_ITEM_REQ", [JSON.stringify({type: "BUY_ITEM_REQ", name:"BUY_ITEM_REQ", username: JSON.parse($.cookie("gas-login")).username, item: this.item })]);
					})
        );
        shopListObjs.push(
            Crafty.e("2D, DOM, Sprite, Mouse, staff"+i)
                .attr({x: 54, y: _y, z: 3 , item: item})
                .bind('Click', function(){
                    //alert('Selected equipment'+this[0]);
					gas.send("BUY_ITEM_REQ", [JSON.stringify({type: "BUY_ITEM_REQ", name:"BUY_ITEM_REQ", username: JSON.parse($.cookie("gas-login")).username, gladiator: g_gladiatorShowCase, item: this.item })]);
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
            Crafty.e("2D, DOM, Text, Mouse").attr({w:200, h:32, x: 102, y: _y, z: 3, item: item })
                .text('<a href="#" title="' + item + '">'+item.name+'</a><br />  ' +item.type + '/' +item.subtype+ ' ' + item.price + ' ' + item.damage )
                .css({
                    "text-align": "left",
                    "font-family": "Arial",
                    "font-size": "10pt",
                    "color": "#000000"
                })
                .bind('Click', function(){
                    //alert('Selected equipment'+this[0]);
					gas.send("BUY_ITEM_REQ", [JSON.stringify({type: "BUY_ITEM_REQ", name:"BUY_ITEM_REQ", username: JSON.parse($.cookie("gas-login")).username, gladiator: g_gladiatorShowCase, item: this.item })]);

                })
        );
        shopListObjs.push(
            Crafty.e("2D, DOM, Sprite, Mouse, spear"+i)
                .attr({x: 54, y: _y, z: 3, item: item })
                .bind('Click', function(){
                    //alert('Selected equipment'+this[0]);
					gas.send("BUY_ITEM_REQ", [JSON.stringify({type: "BUY_ITEM_REQ", name:"BUY_ITEM_REQ", username: JSON.parse($.cookie("gas-login")).username, gladiator: g_gladiatorShowCase, item: this.item })]);
                }));
    }
}

function showArmourView()
{
    var _y = 200;
    for( var i in shopListObjs )
    {
        shopListObjs[i].destroy();
    }
    shopListObjs = [];
    for( var i in armourItems )
    {
        var item = armourItems[i];
        _y = _y + 32;
        shopListObjs.push(
            Crafty.e("2D, DOM, Text, Mouse").attr({w:200, h:32, x: 102, y: _y, z: 3, item: item })
                .text('<a href="#" title="' + item + '">'+item.name+'</a><br />  ' +item.type + '/' +item.subtype+ ' ' + item.price + ' ' + item.armourvalue )
                .css({
                    "text-align": "left",
                    "font-family": "Arial",
                    "font-size": "10pt",
                    "color": "#000000"
                })
                .bind('Click', function(){
                    //alert('Selected equipment'+this[0]);
					gas.send("BUY_ITEM_REQ", [JSON.stringify({type: "BUY_ITEM_REQ", name:"BUY_ITEM_REQ", username: JSON.parse($.cookie("gas-login")).username, gladiator: g_gladiatorShowCase, item: this.item })]);

                })
        );
        shopListObjs.push(
            Crafty.e("2D, DOM, Sprite, Mouse, plate"+i)
                .attr({x: 54, y: _y, z: 3, item: item })
                .bind('Click', function(){
                    //alert('Selected equipment'+this[0]);
					gas.send("BUY_ITEM_REQ", [JSON.stringify({type: "BUY_ITEM_REQ", name:"BUY_ITEM_REQ", username: JSON.parse($.cookie("gas-login")).username, gladiator: g_gladiatorShowCase, item: this.item })]);
                }));
    }
}

function showLoginView()
{
    g_currentView = "login";
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
    g_currentView = "gladiator";
    LoadTileMap('inventory.json');


    Crafty.sprite(64,'../pics/walkcycle/BODY_' + (g_gladiatorShowCase.race) + '.png', {
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

	//console.log(g_currentGladiator);

    Crafty.e("2D, DOM, Text").attr({ w: 400, h: 120, x: 520, y: 170, z: 3 })
        .text(gladiatorHTML(g_gladiatorShowCase))
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
    Crafty.e("2D, DOM, Text, Mouse").attr({x: 250, y: 200, z: 3 })
        .text("Armour")
        .css({
            "text-align": "left",
            "font-family": "Arial",
            "font-size": "12pt",
            "color": "#000000"
        })
        .areaMap([0,0],[0,60],[60,60],[60,0])
        .bind('Click', function(e){
            showArmourView();
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

	if(loadAudio==true)
		PreloadAudio();

	playAudio("soliloquy", -1, 0.1);

    g_currentView = "manager";
    LoadTileMap( 'manager.json');
    g_currentGrid = LoadTileMap( 'manager.json', true );

    // load dummy object sprites
    Crafty.sprite(64, "../pics/combat_dummy/BODY_animation.png", {
        dummy_move: [0,0]
    });
    Crafty.sprite(64, "../pics/combat_dummy/BODY_death.png", {
        dummy_die: [0,0]
    });
    var NUM_GLADIATORS = 8;
    // generate eight dummies for gladiators to train on
    for( var i = 0; i< NUM_GLADIATORS;i++)
    {
        // compute offsets
        var ypos = 320+i*96;
        var xpos = 48;
        // right side
        if ( i >= 4 ) {
            ypos = 320+((i-4)*96);
            xpos = 48+640;
        }
        // create actual dummy object
        Crafty.e("2D, DOM, Dummy, Mouse, Sprite, SpriteAnimation, dummy_move")
            .attr({x:xpos,y:ypos,z:7})
            .setDummyIndex(i)
            .animate("dummy_move", 0,0,7)
            .bind("Click", function(){

                // make gladiator do something, too
                if ( g_gladiators[this.dummyIndex] != undefined )
                {
                    // determine which direction object is facing
                    // by position
                    if ( this.dummyIndex < 4 )
                        g_gladiators[this.dummyIndex].thrustAttack('left');
                    else
                        g_gladiators[this.dummyIndex].thrustAttack('right');

                    // dummy rotates
                    this.animate("dummy_move", 20, 0);
                    // level goes up
                    DisplayFadingText("+1", this.x, this.y);

                }
                else
                {
                    console.log('dummy at'+this.dummyIndex+' has no gladiator');
                }

            })
            .bind("EnterFrame",function(){
                if ( this.isPlaying("dummy_move") == false)
                {
                    this.stop().sprite(0,0);
                }
            });

    }

    // Add a title
    Crafty.e("2D, DOM, Text").attr({ w: 400, h: 20, x: 15, y: 10 })
        .text("Gladiator's hall")
        .css({
            "text-align": "left",
            "font-family": "Impact",
            "font-size": "24pt"
        });
    // Add some author info
    Crafty.e("2D, DOM, Text").attr({ w: 385, h: 20, x: 400, y: 20 })
        .text("GAS Valhalla <br />by Team Oldman & Green (c) 2012")
        .css({
            "text-align": "right",
            "font-family": "Arial",
            "font-size": "8pt"
        });
    // Testing info
    Crafty.e("2D, DOM, Text").attr({ w: 140, h: 20, x: 20, y: 40, z:8 })
        .text("~Legend~")
        .css({
            "text-align": "left",
            "font-family": "Fanwood",
            "font-size": "18pt",
            "color":"#FFFFFF"
        });
    Crafty.e("2D, DOM, Keyboard, Text").attr({ w: 130, h: 300, x:25 , y: 70, z:8 })
        .text("P: Gladiator Pit<br />M: audio on/off")        .css({
            "text-align": "left",
            "font-family": "Fanwood-Text",
            "font-size": "10pt",
            "color": "#FFFFFF"
        })
        .bind('KeyDown', function () {
            if (this.isDown('P')){
                Crafty.scene("gladiatorPitView");
            }
            if (this.isDown('M')){
                Crafty.audio.mute();
            }
        });

    var data = $.cookie("gas-login");
    gas.send('TEAM_REQ', [ '{"username":"'+ JSON.parse(data).username + '"}' ]);
    gas.send('GET_ONLINE_PLAYERS_REQ', [ '{"username":"'+ JSON.parse(data).username + '"}' ]);
    gas.send('BATTLE_STATUS_REQ',[ '{"username":"'+ JSON.parse(data).username + '"}' ]);


    //console.log("skel id:"+skel[0]);

}

function showArenaView()
{
    // notify that player has entered battle
    var login = $.cookie('gas-login');
    gas.send('ENTER_ARENA_REQ', [ '{"username":"'+ JSON.parse(login).username + '"}' ]);

	playAudio("granbatalla", -1, 0.2);

    g_currentView = "arena";
    g_currentGrid = LoadTileMap( 'arena.json', true );

    if ( !g_currentGrid  )
    {
        console.log("WARNING: current grid is not set!");
    }


    Crafty.e("2D, DOM, Mouse, Text")
        .attr({w:200, h:32, x:20, y:10, z:9})
        .text('Back')
        .bind('Click', function(){
            Crafty.scene("managerView");
        });
    // resume buttons
    Crafty.e("2D, DOM, Mouse, Text")
        .attr({w:200, h:32, x:220, y:160, z:9})
        .text('A team done!')
        .bind('Click', function(){

            console.log('Resuming A');
        });
    Crafty.e("2D, DOM, Mouse, Text")
        .attr({w:200, h:32, x:480, y:160, z:9})
        .text('B team done!')
        .bind('Click', function(){
            console.log('Resuming B');
        });
    g_timer.view = Crafty.e("2D, DOM, Mouse, Text")
        .attr({w:100, h:32, x:730, y:40, z:9})
        .text('23')
        .css({"font-family":"Impact",
              "font-size":"24pt"});


    




    /*
    var tmpObj = Crafty.e("2D, DOM, Multiway, Keyboard, Grid, Mouse, Ape, Sprite, transparent")
        .Ape()
        .collision([16,32],[48,32],[48,64],[16,64])
        .attr({x:2*32-16, y:7*32-32, z:7})
        .Grid(2,7)
        .setupAnimation("skeleton_body")
        .bind("MouseOver", function(){
            console.log('mouseover');
        })
        .bind("Click", function(){
            // set for pathfinding
            g_currentGladiator = this;
        });

    var tmpObj2 = Crafty.e("2D, DOM, Multiway, Keyboard, Grid, Mouse, Ape, Sprite, transparent")
        .Ape()
        .collision([16,32],[48,32],[48,64],[16,64])
        .attr({x:12*32-16, y:7*32-32, z:7})
        .Grid(12,7)
        .setupAnimation("human_body")
        .bind("MouseOver", function(){
            console.log('mouseover');
        })
        .bind("Click", function(){
            // set for pathfinding
            g_currentGladiator = this;
        });

    g_gladiators.push(tmpObj);
    g_gladiators.push(tmpObj2);*/
}

function showGladiatorPitView()
{
    g_currentView = "gladiatorpit";

    console.log('loading tile map');

    LoadTileMap( 'gladiatorpit.json' );

    console.log('loading tile map done!');

    Crafty.e("2D, DOM, Mouse, Text")
        .attr({w:200, h:32, x:20, y:10})
        .text('Back')
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
		console.log("sending GET_AVAILABLE_GLADIATORS_REQ");
        gas.send('GET_AVAILABLE_GLADIATORS_REQ', []);
    }, 1000);

}

function gladiatorHTML(gladiator)
{
    var HTMLstr =
        'Name:'+gladiator.name+'<br />'+
        'Age:'+gladiator.age+'<br />'+
        'Health:'+gladiator.health+'<br />'+
        'Nimbleness:'+gladiator.nimbleness+'<br />'+
        'Strength:'+gladiator.strength+'<br />'+
        'Mana:'+gladiator.mana+'<br />'+
        'Salary:'+gladiator.salary+'<br />'+
        'Fights:'+gladiator.fights+'<br />'+
        'Knockouts:'+gladiator.knockouts+'<br />'+
        'Injured:'+gladiator.injured;

    return HTMLstr;
}

function pitCreateGladiators(data){

    var pos = { "x" : 414,
                "y" : 170 };
    var offset = { "x": 96,
                   "y": 128 };
    var count = 0;

    $.each(data.gladiatorlist, function(key,gladiator)
    {
        console.log('Creating gladiator showcase for ' + gladiator.name);

        var body = "human_body";
        if ( gladiator.race == "skeleton" )
            body = "skeleton_body";

		var hidden = false;

        var xPos = pos.x+(offset.x*(count%3));
        var yPos = pos.y+(offset.y*(Math.floor(count/3)));
        var obj = Crafty.e("2D, DOM, Delay, Mouse, Ape, Sprite, transparent")
            .attr({x:xPos, y:yPos, z:5})
            .setupAnimation(body)
            .bind("MouseOver", function(e){
                this.hideAll();
				if(!hidden) {
					this.enableAnimation(this.walk);
					this.walk.body.stop().animate("walk_left", 20, -1);
				}
				else {
					// TODO: Mark gladiator "hired"
					this.hideAll();
				}

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
	    .bind('Click', function(){
			var name = gladiator.name;
			var user = JSON.parse($.cookie("gas-login")).username;
			gas.send("HIRE_GLADIATOR_REQ", [JSON.stringify({ type: "HIRE_GLADIATOR_REQ", username: user, gladiator: name })]);
			this.hideAll();
	    })
            .walk.body.stop().animate('walk_down',10,-1);

        count = count + 1;

    });
}

function playAudio(audiofile, loop, volume) {

	muted = Crafty.audio.muted;

	if(!muted) {
		// Do not restart the same audio when switching between views
		if(audiofile != nowPlaying) {
			Crafty.audio.stop();
			Crafty.audio.play(audiofile, loop, volume);
			nowPlaying = audiofile;
		}
	}
}

/*global Class, Maple */
var GAS = Class(function() {
    Maple.Client(this, 110, 60);

}, Maple.Client, {
    paused: false,   // state
    pointOfReference: 0,
    started: function() {
        console.log('started');
        this.pointOfReference = 0;
    },

    update: function(t, tick) {
        // TODO fix Grid component.
        // manager view with updatemovement call breaks other animations.
        if ( this.paused == false &&
             g_currentView == 'arena' )
        {
            for ( var g in g_gladiators )
            {
                g_gladiators[g].UpdateMovement();
            }
        }


        // THIS BREAKS training animation with dummy (but needed for pathfinding)
        if ( g_currentView == 'manager' )
        {
            for ( var g in g_gladiators )
            {
                g_gladiators[g].UpdateMovement();
            }
        }
        /*if ( g_timer.view ) {
            g_timer.time = g_timer.time-(tick - this.pointOfReference);
            g_timer.view.text( g_timer.time / 333.33);
            this.pointOfReference = tick;
        }*/
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

    challengePlayer: function(defender)
    {
        this.send('CHALLENGE_REQ', [ '{ "username":"'+ JSON.parse($.cookie("gas-login")).username + '",'+
                                     '  "defender":"' + defender + '"}' ]);
    },

    replyChallenge: function(challenger, reply)
    {
        this.send('CHALLENGE_RES', [ '{ "username":"'+ JSON.parse($.cookie("gas-login")).username + '",'+
                                     '  "challenger":"' + challenger + '",'+
                                     '  "response":"'+(reply == true ? "OK" : "NOK")+'"}' ]);
        // e
        $("#challenge_"+challenger).fadeOut("slow", function(){
            $(this).remove();
        });

    },

    message: function(type, tick, data) {
        //console.log('message:', type, tick, data);


	switch(type) {

		case 'PLAYER_CONNECTED_PUSH':
			console.log(data[0]);
            $('#challenges').append('<div class="team_entry" id="'+data[0].players[0]+'">'+data[0].players[0]+' [<a href="#" title="Challenge '+data[0].players[0]+' - show player rank and team info?" onclick="gas.challengePlayer(\''+data[0].players[0]+'\');">challenge</a>]</div>');
			break;

		case 'PLAYER_DISCONNECTED_PUSH':
			console.log(data[0]);
			console.log("PLAYER", data[0].players[0], "DISCONNECTED");
			$('#'+data[0].players[0]).remove();
			break;

	    case 'CREATE_USER_RESP':
			console.log(JSON.parse(data));
			break;


		case 'LOGIN_RESP': // Authenticated by the server - proceed to game lobby
			console.log(JSON.parse(data))
			if("OK" == JSON.parse(data).response) {

				$.cookie("gas-login", data);
                g_ingame = JSON.parse(data).ingame;
				displayLogin();
				
			}
			else {
				//$.cookie("gas-login", null);
				console.log("Login failed");
                g_ingame = null;
			}
			break;

        case 'GET_AVAILABLE_GLADIATORS_RESP':
			console.log('Handling gladiator list');
			pitCreateGladiators(data[0]);
			break;

		case 'ITEM_SYNC':
			console.log('Handling item list');
			handleItemSync(data[0]);
			break;

		case 'CHAT_SYNC':
			if(JSON.parse($.cookie("gas-login")).username) {
				console.log("chat_sync");
				$('#chatbox').append('<div id="message"><a href="#" title="Some information?">'+ JSON.parse(data).username + ':</a>&nbsp;&nbsp;' + JSON.parse(data).message + '<br /></div>');
				// Chatbox auto-scroll
				var messages = $('#chatbox');
				var scrollTop = messages[0].scrollHeight - messages.height();
				if(scrollTop > 0) {
					messages.scrollTop(scrollTop);
				}
			}
			break;

	    case 50:
           console.log("Received: " + data[0].name);
			break;

		case 'HIRE_GLADIATOR_RESP':
			console.log("Received: " + JSON.stringify(data));
			break;

        case 'TEAM_RESP':
           //console.log("Received team:"+ JSON.stringify(data));
           this.handleTeamResponse((data[0]));
			break;
        case 'BATTLE_CONTROL_SYNC':
            var bc = data[0];
            this.paused = bc.paused;
            g_timer.time = bc.duration;
			break;

        case 'GET_ONLINE_PLAYERS_RESP':
			$('#managers_title').empty();
			$('#managers_body').empty();
			$('#challenges').empty();
			$('#challenges').append("Online players");
			//$('#managers_title').append("Chat:");

			console.log('received player list'+data[0].players); // Should we use the username or the team name? Also include the match statistics and gladiators in team? If so, use zlib to compress/decompress data
			// Order by rank, name or something else?
			data[0].players.sort(); // This time by name
			for(var i in data[0].players){
				// Should we prevent the challenging of lower rank players or make it "free-for-all"?
				// Later on, make server push the online activity status changes to reduce data traffic
				//console.log('online: ' +data[0].players[i]);
				if(data[0].players[i] == JSON.parse($.cookie("gas-login")).username)
					$('#challenges').append('<div class="team_entry" id="'+data[0].players[i]+'">'+data[0].players[i]+' [<a href="#" title="It\'s me! Show some stats?">my team</a>]</div>');
				else
					$('#challenges').append('<div class="team_entry" id="'+data[0].players[i]+'">'+data[0].players[i]+' [<a href="#" title="Challenge '+ data[0].players[i] +' - show player rank and team info?" onclick="gas.challengePlayer(\''+data[0].players[i]+'\');">challenge</a>]</div>');
			}

			break;
        case 'CHALLENGE_REQ':
             console.log('Received challenge request from user:' + JSON.parse(data[0]).challenger);

             $("#challenges").append("<div id=\"challenge_"+JSON.parse(data[0]).challenger+"\" class=\"challenge\">"+
                                     "Challenge from "+JSON.parse(data[0]).challenger+
                                     " <input type=\"button\" onclick=\"gas.replyChallenge('"+JSON.parse(data[0]).challenger+"', true);\" value=\"Accept\">"+
                                     "<input type=\"button\" onclick=\"gas.replyChallenge('"+JSON.parse(data[0]).challenger+"', false);\" value=\"Decline\"></div>");



            //this.send('CHALLENGE_RES', ['{"response":"OK", "defender":"'+$.cookie("gas-login").username+'", "challenger":"'+JSON.parse(data[0]).challenger+'"}']);

            break;
        case 'CHALLENGE_RES':
            if ( JSON.parse(data[0]).response === "OK" )
            {
                console.log('Challenge accepted: ' + JSON.stringify(data[0]));
            }
            else if ( JSON.parse(data[0]).response === "DELIVERED" )
            {
                console.log('Challenge delivered, waiting for response');
            }
			else if (JSON.parse(data[0]).response === "READY_FOR_WAR") {
				console.log('Time to make last minute adjustments...');
			}
            else
            {
                console.log('Challenge not accepted:' + JSON.parse(data[0]).reason);
            }

		    break;
        case 'BATTLE_STATUS_RES':
            g_ingame = JSON.parse(data[0]).ingame;
            console.log('BATTLE_STATUS_RES:'+ g_ingame);
            if ( g_ingame != null && g_ingame != undefined ) {
                console.log('Setting arena enabeld');
                SetArenaEnabled(true);
            }
            else {
                console.log('Setting arena disabled');
                SetArenaEnabled(false);
            }
        break;
        case 'BATTLETEAM_SELECT_RES':
            var resp = JSON.parse(data[0]);
            if ( resp.response ==  "OK") {
                console.log("Battle team confirmed, " + resp.gladiators);
            }
        break;
    
	    default:
	      console.log("Default branch reached in 'message handling'");
	    break;
	}

        return true; // return true to mark this message as handled

    },
    handleTeamResponse: function(data)
    {
        var team = data.team;
        // create visualization for each gladiator in team.
        if ( g_currentView == "manager")
        {

            
            g_gladiators = [];
			console.log("team.gladiators", team.gladiators);
            for (var i in team.gladiators )
            {
				console.log(i);
                var anim = "";

                switch ( team.gladiators[i].race)
                {
                case "skeleton":
                    anim = "skeleton_body";
                    break;
                case "human":
                    anim = "human_body";
                    break;
                }
                var offset = 0;
                if ( jQuery.inArray(team.gladiators[i].name, team.battleteam) != -1 )
                {
                    offset = 1;
                }

                // compute offsets
                var ypos = 320+i*96;
                var xpos = 48+80;
                var selectorxoff = 128;
                // right side
                if ( i >= 4 ) {
                    ypos = 320+((i-4)*96);
                    xpos = 640-32;	// Align gladiator to correct "slot"
                    selectorxoff = -128;
                }
                //x:xpos, y:ypos, 
                var g = Crafty.e("2D, DOM, Multiway, Grid, Mouse, Ape, Sprite, transparent")
                    .attr({z:7, gladiator: team.gladiators[i], myslot:i})
                    .Ape()
                    .Grid(4,11+(i*3))
                    .collision([16,32],[48,32],[48,64],[16,64])
                    .setupAnimation(anim)
                    .setupAnimation("long_spear")
                    .bind("Click", function(){
						g_gladiatorShowCase = this.gladiator;
                        Crafty.scene("gladiatorView");
                    })
                    .bind("MouseOver", function(){
                        DisplayFadingText(this.gladiator.name, this.x, this.y, "20pt", "Fanwood");
                    });
                g_gladiators.push(g);

                // battle team selector
                Crafty.e("2D, DOM, Mouse, Color")
                    .attr({x:xpos+selectorxoff, y:ypos, z:7, w:64, h:64, gladiatorname: team.gladiators[i].name, gladiator: g})
                    .color("#ff0000")
                    .bind("Click", function(){

                        if ( g_battleTeam.has(this.gladiatorname))
                        {
                            console.log('De-selecting ' + this.gladiatorname);
                        }
                        else {
                            console.log('Selecting ' + this.gladiatorname);
                        }

                        g_battleTeam.toggle(this.gladiatorname);
                        var user = JSON.parse($.cookie("gas-login")).username;
                        var pass = JSON.parse($.cookie("gas-login")).password;
                        var msg = {
                            username: user,
                            password: pass,
                            gladiators: g_battleTeam.get()
                        }
                        console.log("selected team: "+JSON.stringify(msg));
                        //gas.send('BATTLETEAM_SELECT_REQ', [JSON.stringify(msg)]);
                        
                        var backup = g_currentGrid.clone();
                        var finder = new PF.AStarFinder();
                        var destx = 0;
                        var desty = 0;
                        if ( g_battleTeam.has(this.gladiatorname)) {
                            destx = 7+((g_battleTeam.get().length-1)*3), 
                            desty = 8;
                        } else {
                            destx = this.gladiator.orig_x;
                            desty = this.gladiator.orig_y;
                        }
                        console.log("start point:"+this.gladiator.tile_x +","+this.gladiator.tile_y);

                        var path = finder.findPath( this.gladiator.tile_x,
                                                this.gladiator.tile_y,
                                                destx,desty, backup );                            
                        console.log("Path found:"+JSON.stringify(path));
                        this.gladiator.SetMovePattern( path );
                        
                    });
                

            }
        }
        else if ( g_currentView == "arena" )
        {
            g_gladiators = [];
            // create visualization for each gladiator in team.
            for (var i in team.gladiators )
            {
                var anim = "";

                switch ( team.gladiators[i].race)
                {
					case "skeleton":
						anim = "skeleton_body";
						break;
					case "human":
						anim = "human_body";
						break;
                }

               var o = Crafty.e("2D, DOM, Multiway, Keyboard, Grid, Mouse, Ape, Sprite, transparent")
                    .Ape()
                    .collision([16,32],[48,32],[48,64],[16,64])
                    .Grid(2,7+(i*2))
                    .setupAnimation(anim)
                    .bind("MouseOver", function(){
                        console.log('mouseover');
                    })
                    .bind("Click", function(){
                        // set for pathfinding
                        g_currentGladiator = this;
                    });

                g_gladiators.push(o);

            }
        }
    },
    syncedMessage: function(type, tick, data) {
        console.log('synced message:', type, tick, data);
    },

    closed: function(byRemote, errorCode) {
        console.log('Closed:', byRemote, errorCode);
    }

});