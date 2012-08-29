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

	updateUser: function(username) {
		return core.updateUser(username);
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
		return JSON.parse(JSON.stringify(core.getUser(username)));
	},

	attack: function (attacker, target) {

		// Check weapon data

		// Check toHit percentage

		// Check target defense modifiers

		// If hit, calculate damage and pick a hit location

		// Modify changed attributes @ attacker / target
	},


	cast: function(caster, target) {

		// Check spells data

		// Check toHit percentage

		// Check target defense modifiers or current health if healing spell is used

		// If hit, calculate damage and pick a hit location / heal target

		// Modify changed attributes @ caster / target

	},

	practice: function(trainee, attribute) {

		// Send a gladiator to a specific training dummy for some practice or end practicing
	},

	toJSON: function(myObject) {
		return core.toJSON(myObject);
	},

	toObject: function(myJSON) {
		return core.toJSON(myJSON);
	}
}

module.exports = api;