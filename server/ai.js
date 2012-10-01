var configs = require('../json/configs.json');
var aiPassword = configs.aipassword;

/* handles messages from PARENT */
process.on('message', function(message) {

    switch(message.name) {
        case 'AI_INIT':
            ai.init();
            break;

        case 'CHALLENGE_REQ':
            ai.replyChallenge(message,true); // always accept challenge, add random delay before accepting? Should people know they af
            
            break;
        case 'CHALLENGE_RES':
            ai.handleChallengeResponse( message );
        break;
        case 'CREATE_USER_RESP':
            process.send(JSON.stringify({type:"LOGIN_REQ", name:"LOGIN_REQ",data:{username: message.username, "password": aiPassword }}));
            break;

        case 'WAKE_UP':
           ai.enterArena(message.username, message.ingame);
        break;
        case 'MOVE_UPDATE':
           ai.handleMoveUpdate(message);
        break;
        case 'UPDATE':
           ai.update(message.tick);
        break;
        case 'BATTLE_START':
           ai.handleBattleStart(message);
        break;
        case 'STAND_DOWN':
           ai.handleBattleExit(message);
        break;
       case 'ATTACK_RESP':
           ai.handleAttackResp(message);
        break;
    default:
          ai.handleMessage(message);
    }

});



var ai = {

    teams: {}, /* player teams */
    
    
    init: function(){

        for( var i in configs.npcs ){
            console.log("Registering computer team: "+ configs.npcs[i]);
            process.send(JSON.stringify({type:"CREATE_USER_REQ", name:"CREATE_USER_REQ",data:{ username:configs.npcs[i], "password": aiPassword, "ai": true }}));
        }
    },
    
    handleChallengeResponse: function(msg){
        // select battle team - this needs to be handled before live player 
        // enters arena, otherwise (s)he won't see AI enemy players.
        if ( msg.response == "READY_FOR_WAR" ){
	        this.selectBattleTeam(msg.battle.defender.name, [ msg.battle.defender.gladiators[0].name] );
        }
    },

    handleMoveUpdate: function(msg)
    {
        console.log('AI is handling move update...');
        for( var ai in this.teams ){
            if ( this.teams[ai].ingame == msg.battleid )
            {
                if ( msg.username == this.teams[ai].battle.challenger.name ) {
                    
                    var gladiators = this.teams[ai].battle.challenger.gladiators;
                    for( var g in gladiators)
                    {
                        if ( gladiators[g].name == msg.gladiator )
                        {
                            console.log('Gladiator',  gladiators[g].name, "now in", msg.pos );

                            var pos = gladiators[g].battledata.pos;
                            this.teams[ai].battle.map[pos[1]][pos[0]] = 0;
                            pos = gladiators[g].battledata.pos = msg.pos;
                            this.teams[ai].battle.map[pos[1]][pos[0]] = gladiators[g].name;
                        }
                    }
                } else if ( msg.username == this.teams[ai].battle.defender.name ) {
                    
                    var gladiators = this.teams[ai].battle.defender.gladiators;
                    for( var g in gladiators)
                    {
                        if ( gladiators[g].name == msg.gladiator )
                        {
                            console.log('Gladiator',  gladiators[g].name, "now in", msg.pos );
                            var pos = gladiators[g].battledata.pos;
                            this.teams[ai].battle.map[pos[1]][pos[0]] = 0;
                            pos = gladiators[g].battledata.pos = msg.pos;
                            this.teams[ai].battle.map[pos[1]][pos[0]] = gladiators[g].name;
                        }
                    }
                }
            }
        }
    },

    handleBattleStart: function(battle)
    {
        console.log('AI received BATTLE_START:' /*+ data[0]*/);



        // convert battle map into spatial positioning map
        for(var g in battle.challenger.gladiators)
        {
            for( var bg in battle.challenger.battleteam ){
                var gladiator = battle.challenger.gladiators[g];
                if ( gladiator.name == battle.challenger.battleteam[bg] )
                {
                    var row = gladiator.battledata.pos[1];
                    var column = gladiator.battledata.pos[0];
                    battle.map[row][column] = gladiator.name;
                }
            }
        }

        for(var g in battle.defender.gladiators)
        {
            for( var bg in battle.defender.battleteam ){
                var gladiator = battle.defender.gladiators[g];
                if ( gladiator.name == battle.defender.battleteam[bg] )
                {
                    var row = gladiator.battledata.pos[1];
                    var column = gladiator.battledata.pos[0];
                    battle.map[row][column] = gladiator.name;
                }
            }
        }
        // store battle into ai team property
        this.teams[battle.defender.name]["battle"] = battle;
    },
    
    handleBattleExit: function( msg ){
        delete this.teams[msg.username]["battle"];
        console.log('AI battle exit: ', msg.username, "now idle.");
    },
    
    handleAttackResp: function(msg) {

        console.log('AI ATTACK_RESP custom handler');
        
        for( var ai in this.teams ){
            if ( this.teams[ai].ingame == msg.ingame )
            {
                var g = this.getGladiatorByName(this.teams[ai], msg.targetid);
		if ( g ) {
                    g.health -= msg.damage;
		}
            }
        }
        
    },
    
    // AI enemy will always be a challenger.
    isEnemy: function( battleid, gladiatorname )
    {
        for( var ai in this.teams ){
            if ( this.teams[ai].ingame == battleid )
            {
                for( var g in this.teams[ai].battle.challenger.gladiators)
                {
                    if ( this.teams[ai].battle.challenger.gladiators[g].name == gladiatorname)
                        return true;
                }
            }
        }
        return false;
    },

    getGladiatorByName: function(ai, gladiatorname)
    {
        for(var g in ai.battle.defender.gladiators)
        {
            if ( ai.battle.defender.gladiators[g].name == gladiatorname ) 
                return ai.battle.defender.gladiators[g];
        }

        for(var g in ai.battle.challenger.gladiators)
        {
            if ( ai.battle.challenger.gladiators[g].name == gladiatorname ) 
                return ai.battle.challenger.gladiators[g];
        }

        return null;
    },
   

    update: function(tick){

        for( var ai in this.teams ){

            if ( this.teams[ai].battle === undefined ) continue;

            console.log(ai, 'seeking enemies...');
            var team = this.teams[ai].battle.defender.battleteam;
            for( var bt in team)
            {
                var g = this.getGladiatorByName( this.teams[ai], team[bt] );
                // skip gladiators that aren't alive anymore.
		if ( g == null ) continue;
                if ( g.health <= 0 ) continue;

                var target = this.teams[ai].battle.map[g.battledata.pos[1]][g.battledata.pos[0]-1];
                
                if ( target != 0 && target != 1 ){

                    if ( this.isEnemy(this.teams[ai].ingame, target) )   
                    {
                        console.log('AI found an enemy nearby!', target);
                        var attackMsg = {
                            type: "ATTACK_REQ",
                            name: "ATTACK_REQ",
                            username: this.teams[ai].name,
                            attackerid: g.name,
                            targetid: target,
                            battleid: this.teams[ai].ingame
                        }
                        
                        process.send( JSON.stringify({name: "ATTACK_REQ", type: "ATTACK_REQ", data: attackMsg}) );
                    }
                    else {
                        console.log('Something there, but its our own', name);
                    }

                }
            }
        }
    },

    /* Registers a game for AI to be handled.  */
    registerPlayerToGame: function(aiPlayer, battleid) {
        this.teams[aiPlayer] = { ingame: battleid, name: aiPlayer };
    },

    selectBattleTeam: function(uname, names){

        // pretty straightforward and crude battle team selection logic. Only single ai.
        var msg = {
            username: uname,
            password: "pass",
            gladiators: []
        }
        for ( var i = 0;i<4;i++){
            if ( names[i] !== undefined )
                msg.gladiators.push(names[i]);
        }
        console.log('AI selecting battle team:', JSON.stringify(names));
        process.send( JSON.stringify({type:"BATTLETEAM_SELECT_REQ", name:"BATTLETEAM_SELECT_REQ",data: msg}));
    },
    
    enterArena: function(uname, battleid) {
        console.log('AI entering arena as ' + uname);
        // enter arena, only single ai.
        process.send(JSON.stringify({type:'ENTER_ARENA_REQ', name:'ENTER_ARENA_REQ', data: {username: uname, ingame: battleid}}));
        this.registerPlayerToGame(uname, battleid);
    },

    replyChallenge: function(msg,reply)
    {
        //console.log("Ai Replying to challenge: "+msg+","+reply);
        for( i in configs.npcs ) {
            if(msg.defender == configs.npcs[i]) {
                process.send(JSON.stringify({
                    type:"CHALLENGE_RES",
                    name:"CHALLENGE_RES",
                    data:{
                    username:configs.npcs[i],
                    challenger:msg.challenger,
                    response:(reply == true ? "OK" : "NOK")
                    }
                }));

            }
        }
    },

    handleMessage: function(message) {
        console.log('ai is handling message ' + JSON.stringify(message.name));


        // Do some message handling here
        /* ... */

        // Send message back to PARENT process
        //process.send(JSON.stringify({type:"SOME_RESPONSE", name: "SOME_RESPONSE", data: "Thank you for your " + message.name}));

  }
}