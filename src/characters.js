Crafty.sprite(64, "../pics/walkcycle/BODY_skeleton.png", {
    skel_walk_back: [0, 0],
    skel_walk_left: [0, 1],
    skel_walk_front: [0, 2],
    skel_walk_right: [0, 3]
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


