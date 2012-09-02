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
		// The objects are passed as reference, so editing the returned object would cause the original object to change too - that is not what we want,
		// so make and return a copy of the original object
		var retval = eval(core.getGladiator(name).toSource());
		return retval;
	},

	editGladiator: function(name, attributelist) {
		return core.editGladiator(name, attributelist);
	},

	getUser: function(username) {
		// The objects are passed as reference, so editing the returned object would cause the original object to change too - that is not what we want,
		// so make and return a copy of the original object
        var user = core.getUser(username);
        if ( user == undefined )
			return user;
		else
			return JSON.parse(JSON.stringify(user));
	},

	attack: function (attacker, target) {

		// Check weapon data
		var def = 0;
		var weapon = 0;

		// Check user validity
		var validparams = attacker.name && target.name;
		if(validparams) {
			// Check gladiator existence
			var att = core.gladiatorcache.read(attacker.name);
			var tgt = core.gladiatorcache.read(target.name);
		}
		else {
			console.log("ERROR: api.attack failed, params:", attacker, target);
			return null;
		}

		var valid = (att && target);

		if(valid) {
			// Check hit / miss
			weapon = att.melee;

			// Check target defense modifiers
			if(tgt.armour.shield)
				def = tgt.armour.shield.toblock
			def += tgt.nimbleness;

			// If hit, calculate damage and pick a hit location
			var dmg = core.rollDice(weapon.damage);
			var armourvalue = 0;
			for(var item in target.armour) {
				armourvalue += core.rollDice(target.armour[item].armourvalue);
			}
			dmg -= armourvalue;

			if(dmg < 0)
				dmg = 0;

			// Modify changed attributes @ attacker / target

			// "Illustrate/stringify" the action ,e.g. "Ouch! Mauri hit Hermanni with astalo to location for xx points of damage"
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

	buyItem: function(BUY_ITEM_REQ_msg) {
		console.log(BUY_ITEM_REQ_msg);

		var isValid = null;

		if(BUY_ITEM_REQ_msg) {
			isValid = (BUY_ITEM_REQ_msg.item && BUY_ITEM_REQ_msg.user)
		}

		if(isValid) {
			// Check if user has enough money for the item
			var user = core.getUser(BUY_ITEM_REQ_msg.user);
			var item = core.getItem(BUY_ITEM_REQ_msg.item);
			if(user) {
				console.log(item, user);
			}
		}
		else {
			return null;
		}
	}
}

module.exports = api;