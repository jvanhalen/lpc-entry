Crafty.sprite(1, "../pics/arena-characters.png", {
    char1: [1, 0, 36, 53],
    char2: [37, 0, 36, 53],
    char3: [72, 0, 36, 53],
    char4: [108, 0, 36, 53],
    char5: [155, 0, 36, 53],
    char6: [190, 0, 36, 53],
    char7: [226, 0, 36, 53],
    char8: [262, 0, 36, 53],
    char9: [298, 0, 36, 53],
    char10: [334, 0, 36, 53],
    char11: [370, 0, 36, 53],
    char12: [442, 0, 36, 53]
});

Crafty.c("LeftControls", {
    init: function() {
        this.requires('Multiway');
    },
    
    leftControls: function(speed) {
        this.multiway(speed, {W: -90, S: 90, D: 0, A: 180})
        return this;
    }
    

});



