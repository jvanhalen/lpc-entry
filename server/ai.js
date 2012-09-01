var configs = require('../json/configs.json');
/* handles messages from PARENT */ 
process.on('message', function(message) {

    switch(message.name) {
       case 'AI_INIT':
        ai.init();
        break;
    case 'CHALLENGE_REQ':
        ai.replyChallenge(message,true); // always accept challenge
        break;
    default:
        ai.handleMessage(message);
    }

});

var ai = {

    teams: [], /* player teams */
    
    init: function(){
        for( i in configs.npcs ){
            console.log("Registering computer team: "+ configs.npcs[i]);
        }
        process.send(JSON.stringify({type:"LOGIN_REQ", name:"LOGIN_REQ",data:{username:"Morons"}}));
    },
    
    /* Registers a game for AI to be handled.  */
    registerPlayerToGame: function(battleid) {
    
    },

    

    replyChallenge: function(msg,reply)
    {
       process.send(JSON.stringify({
           type:"CHALLENGE_RES", 
           name:"CHALLENGE_RES", 
           data:{
               username:"Morons",
               challenger:msg.challenger,
               response:(reply == true ? "OK" : "NOK")
           }
       }));

    },
    
    handleMessage: function(message) {
        console.log('ai is handling message ' + JSON.stringify(message.name));
        
        
        // Do some message handling here
        /* ... */

        // Send message back to PARENT process
        //process.send(JSON.stringify({type:"SOME_RESPONSE", name: "SOME_RESPONSE", data: "Thank you for your " + message.name}));

  }
}