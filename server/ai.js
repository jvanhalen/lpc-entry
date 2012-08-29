process.on('message', function(message) {

    switch(message.name) {
      case 'AI_MESSAGE_EXAMPLE':
        // Route AI related messages from the client to the ai child process
        console.log("CHILD received message from PARENT:", message);
        // Perform some magic tricks
        ai.doSomeHandling(message);
        break;
      default:
        console.log("ai message:", message);
    }

});

var ai = {

  doSomeHandling: function(message) {

    // Do some message handling here
    /* ... */

    // Send message back to PARENT process
    process.send({type: 2, name: 'SOME_RESPONSE', response: 'Thank you for your ' + message.params.name});

  }
}