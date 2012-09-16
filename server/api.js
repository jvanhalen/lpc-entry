/**
  * Copyright (c) 2012 GAS team.
  *
  * Permission is hereby granted, free of charge, to any person obtaining a copy
  * of this software and associated documentation files (the "Software"), to deal
  * in the Software without restriction, including without limitation the rights
  * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  * copies of the Software, and to permit persons to whom the Software is
  * furnished to do so, subject to the following conditions:
  *
  * The above copyright notice and this permission notice shall be included in
  * all copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  * THE SOFTWARE.
  */

var configs = require('../json/configs'); 		// Game configuration file

var core = require('./core');					// Require game core functions
var PF = require('pathfinding');                // pathfinding for grid creation.

/* GAS server api */
var api = {

	user: core.user,
	message: core.message,
	gladiator: core.gladiator,

	init: function() {
		console.log("api: init()");
		core.init();
	},

	rollDice: function(dice) {
		return core.rollDice(dice);
	},

	createUser: function(username, password) {
		return core.createUser(username, password);
	},

	setAiPlayer: function(username) {
		return core.setAiPlayer(username);
	},

	hireGladiator: function(username, gladiators_name) {
		// Make sure that we don't hire too many gladiators
		if(parseInt(configs.teamsizemax) > core.getTeamSize(username))
		{
			return core.hireGladiator(username, gladiators_name);
		}
		else {
			return null;
		}
	},

	getGladiator: function(name) {
		return core.getGladiator(name);
	},

	editGladiator: function(name, attributelist) {
		return core.editGladiator(name, attributelist);
	},

	getUser: function(username) {
        return core.getUser(username);
	},

    updateUser: function(userdata) {
        core.updateUser(userdata);
    },

    createBattle: function(battledata){
        return core.createBattle( core.dbcore.getUUID(), battledata);
    },

    getBattle: function(battleid) {
        var battle = core.getBattle(battleid);
        if ( battle == undefined ) return battle;
        else                  return JSON.parse(JSON.stringify(battle));
    },

    editBattle: function(battleid, attributelist){
        return core.editBattle(battleid,attributelist);
    },
    
    move: function(battleid, playername, gladiatorname, from, to ) {

        var battle = core.getBattle(battleid);
        var player = null;
        // find out which player is it for
        if ( battle.defender.name == playername ) 
            player = battle.defender;
        else if ( battle.challenger.name == playername ) 
            player = battle.challenger;
        else {
            console.log('Whatta heck? player name does not match');
            return [];
        }
 
        var finder = new PF.AStarFinder();
        var gladiator = null;

        // verify that gladiator is in battle team
        for( var gid in player.battleteam){
            if (player.battleteam[gid] == gladiatorname) {
                for( var gid2 in player.gladiators ){
                    if ( player.gladiators[gid2].name == gladiatorname) {
                        gladiator = player.gladiators[gid2];
                        break;
                    }
                }
                break;
            }
        }

        if ( gladiator ) {
            // find path 
            gladiator.battledata.path = finder.findPath(from.x, from.y, 
                                                        to.x, to.y, 
                                                        battle.map.clone());
            // save changes and return path
            core.editBattle( battleid, battle );
            return gladiator.battledata.path;
        }
        else {
            // no gladiator, no path either.
            return [];
        }
    },
    
	attack: function (attacker, target) {

		// Attacker and defender data
		var att = null;
		var tgt = null;

		// Check weapon data
		var shield = 0;
		var weapon = 0;
		var def = 0;

		// Check user validity
		var validparams = attacker.name && target.name;
		if(validparams) {
			// Check gladiator existence
			att = core.gladiatorcache.read(attacker.name);
			tgt = core.gladiatorcache.read(target.name);
		}
		else {
			console.log("ERROR: api.attack failed, params:", attacker, target);
			return null;
		}

		console.log("asdf", att, tgt);
		var valid = (att && tgt);


		if(valid) {
			// Check hit / miss
			weapon = core.itemcache.read(att.offhand);
			shield = core.itemcache.read(tgt.defhand);

			console.log(weapon, "against", shield);

			// Check target defense modifiers
			if(shield)
				def = shield.toblock;

			def += tgt.nimbleness;
			var dice = core.rollDice("d100");
			console.log(attacker, "rolled", dice, "while def was", def);
			if(dice < def) {

				if(shield) {
					console.log(target, "blocked the attack!");
				}
				else {
					console.log(target, "dodged the attack!");
				}
				return null;
			}

			// If hit, calculate damage and pick a hit location
			var dmg = 0;
			if(weapon) {
				dmg = core.rollDice(weapon.damage);
			}
			else {
				console.log(attacker, "uses bare hands to attack", target)
				dmg = att.strength - 10;	// TODO: Bare hands, calculate some dmg ???
			}

			if(dmg < 1)
				dmg = 1;

			var armourvalue = 0;

			/* Per slot armor is not yet available, use slot "body"
			for(var item in target.armour) {
				armourvalue += core.rollDice(target.armour[item].armourvalue);
			}*/
			var armourvalue = target.armour["body"].armourvalue;
			if(armourvalue)
				armourvalue = core.rollDice(armourvalue);
			else
				armourvalue = 0;

			dmg -= armourvalue;

			if(dmg < 0)
				dmg = 0;

			// Modify changed attributes @ attacker / target

			// "Illustrate/stringify" the action ,e.g. "Ouch! Mauri hit Hermanni with astalo to location for xx points of damage"
			console.log(attacker.name, "hit", target.name, "for", dmg, "points of damage. That must have hurt!");
			return true;
		}
		else {
			console.log("ERROR: api.attack failed, params:", attacker, target, att, tgt);
			return null;
		}
	},

	cast: function(caster, target) {

		// Check spells data
		var cast = core.usercache.read(caster);

		if(cst) {
		// Check toHit percentage

		// Check target defense modifiers or current health if healing spell is used

		// If hit, calculate damage and pick a hit location / heal target

		// Modify changed attributes @ caster / target

		}
		else {

		}

	},

	practice: function(trainee, attribute) {

		// Send a gladiator to a specific training dummy for some practice or end practicing
	},

	toJSON: function(myObject) {
		return core.toJSON(myObject);
	},

	toObject: function(myJSON) {
		return core.toJSON(myJSON);
	},

	buyItem: function(username, gladiator, item) {
		console.log("api.buyItem", username, item);

		var isValid = (item._id && username);

		if(isValid) {
			// Check if user has enough money for the item
			var cachedgladiator = core.getGladiator(gladiator._id);
			var cacheditem = core.getItem(item._id);
			var cacheduser = core.getUser(username);
			isValid = (cachedgladiator && cacheditem && cacheduser);

			if(isValid) {
				//console.log(cacheditem);
				switch(cacheditem.slot) {
					case 'body':
						cachedgladiator.armour.body = item._id;
						core.gladiatorcache.write(cachedgladiator._id, cachedgladiator);
						break;
					default:
						console.log("api.buyItem, default branch:", username, item);
				}
				// Update also the users database
				console.log("USER:", cacheduser);
				for(var index in cacheduser.gladiators) {
					//console.log(cacheduser.gladiators[index]);
					var gladi = cacheduser.gladiators[index];
					if(gladi._id == gladiator._id) {
						console.log("found", gladi._id, index);
						cacheduser.gladiators[index] = cachedgladiator;
						//console.log("after delete", cacheduser.gladiators);
						//cacheduser.gladiators.push(cachedgladiator);
						core.usercache.write(cacheduser._id, cacheduser);
						break;
					}
				}
				console.log("after update", cacheduser);
			}
		}
		else {
			console.log("api.buyItem failed", isValid);
			return null;
		}
		return true;
	},

    // creates a pathfinding grid from given tilemap.json file.
    createGridFromFile: function(file) {

        var asset = './../assets/maps/'+file;

        // try to read json tile map
        var map = require(asset);
        if ( !map ) return null;

        var grid = new PF.Grid(map.width, map.height);

        for( var layer=0; layer<map.layers.length;layer++)
        {
            // process only collision layer
            if ( map.layers[layer].name == "Collision" ) {

                var currRow = 0;
                var currColumn = 0;
                // Process layer data
                for(var i in map.layers[layer].data)
                {
                    // non-zero means a set tile and on collision
                    // layer it means 'blocked'
                    if ( map.layers[layer].data[i] > 0 )
                    {
                        grid.setWalkableAt(currColumn, currRow, false);
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

        return grid;
    }

}

module.exports = api;