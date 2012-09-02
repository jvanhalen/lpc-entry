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

        case 'CREATE_USER_RESP':
            process.send(JSON.stringify({type:"LOGIN_REQ", name:"LOGIN_REQ",data:{username: message.username, "password": aiPassword }}));
            break;

        default:
            ai.handleMessage(message);
    }

});

var ai = {

    teams: [], /* player teams */

    init: function(){

        for( var i in configs.npcs ){
            console.log("Registering computer team: "+ configs.npcs[i]);
            process.send(JSON.stringify({type:"CREATE_USER_REQ", name:"CREATE_USER_REQ",data:{ username:configs.npcs[i], "password": aiPassword, "ai": true }}));
        }
    },

    /* Registers a game for AI to be handled.  */
    registerPlayerToGame: function(battleid) {

    },

    replyChallenge: function(msg,reply)
    {
        //console.log(msg, reply);
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