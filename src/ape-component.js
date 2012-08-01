// transparent frame for collision with complex objects
Crafty.sprite(64, '../pics/transparent.png', {
    transparent: [0,0]
});

// Animation name, followed by sprites for required components.
Crafty.c('Ape', {
    walk: {
        body: null,
        quiver: null,
        head: null,
        torso: null,
        belt: null,
        hands: null,
        legs: null,
        feet: null,
        shield: null,
        arms:null
    },
    thrust: {
        body: null,
        quiver: null,
        head: null,
        torso: null,
        belt: null,
        hands: null,
        legs: null,
        feet: null,
        shield: null,
        weapon: null,
        arms:null
    },
    slash: {
        body: null,
        quiver: null,
        head: null,
        torso: null,
        belt: null,
        hands: null,
        legs: null,
        feet: null,
        shield: null,
        weapon: null,
        arms:null
    },
    bow: {
        body: null,
        quiver: null,
        head: null,
        torso: null,
        belt: null,
        hands: null,
        legs: null,
        feet: null,
        shield: null,
        weapon: null,
        arms:null
    },
    hurt: {
        body: null,
        quiver: null,
        head: null,
        torso: null,
        belt: null,
        hands: null,
        legs: null,
        feet: null,
        arms:null
    },
    spellcast: {
        body: null,
        quiver: null,
        head: null,
        torso: null,
        belt: null,
        hands: null,
        legs: null,
        feet: null,
        arms:null
    },
    loadAnimation: function(animFile){
        console.log('calling loadAnimation for = '+'../assets/equipment/'+animFile);
        // this gets pretty weird in javascript... we need, err, 'myself' to keep track.
        var myself = this;
        
        $.getJSON( '../assets/equipment/'+animFile, function(a) {                 

            $.each( a.walk, function(key,val){
                if ( a.walk[key] )
                {
                    var spriteDef = {};
                    var propname = a.name + '_' + key + '_walk_cycle';
                    spriteDef[propname] = [0,2];
                    console.log(spriteDef);
                    // load sprite
                    Crafty.sprite(64, '../pics/walkcycle/'+val.image, spriteDef);

                    // remove previous one if it exists.
                    if ( myself.walk[key] ) { 
                        myself.walk[key].destroy();
                    }
                    // this must contain an entity.
                    myself.walk[key] =  Crafty.e('2D, DOM, SpriteAnimation, Mouse, '+propname);
                    myself.walk[key].visible = true;
                    myself.walk[key]
                        .animate("walk_up",1,0,8)
                        .animate("walk_left",1,1,8)
                        .animate("walk_down",1,2,8)
                        .animate("walk_right",1,3,8)
                        .animate("stand_up",0,0,1)
                        .animate("stand_left",0,1,1)
                        .animate("stand_down",0,2,1)
                        .animate("stand_right",0,3,1)
                        .attr({x:myself.x, y:myself.y, z:val.z});
                    myself.attach(myself.walk[key]);
                } else {
                    if ( myself.walk[key] ) { 
                        myself.walk[key].destroy();
                    }
                }

            })
            $.each( a.thrust, function(key,val){
                if ( a.thrust[key] )
                {
                   var spriteDef = {};
                    var propname = a.name + '_' + key + '_thrust_cycle';
                    spriteDef[propname] = [0,2];
                    console.log(spriteDef);
                    // load sprite
                    Crafty.sprite(64, '../pics/thrust/'+val.image, spriteDef);

                    // remove previous one if it exists.
                    if ( myself.thrust[key] ) { 
                        myself.thrust[key].destroy();
                    }
                    // this must contain an entity.
                    myself.thrust[key] =  Crafty.e('2D, DOM, SpriteAnimation, Mouse, '+propname);
                    // by default, invisible
                    myself.thrust[key].visible = false;
                    myself.thrust[key]
                        .animate("thrust_up",1,0,7)
                        .animate("thrust_left",1,1,7)
                        .animate("thrust_down",1,2,7)
                        .animate("thrust_right",1,3,7)
                        .attr({x:myself.x, y:myself.y, z:val.z});
                    myself.attach(myself.thrust[key]);
                } else {
                    if ( myself.thrust[key] ) { 
                        myself.thrust[key].destroy();
                    }
                }

            });
            $.each( a.slash, function(key,val){
                if ( a.slash[key] )
                {
                   var spriteDef = {};
                    var propname = a.name + '_' + key + '_slash_cycle';
                    spriteDef[propname] = [0,2];
                    console.log(spriteDef);
                    // load sprite
                    Crafty.sprite(64, '../pics/slash/'+val.image, spriteDef);

                    // remove previous one if it exists.
                    if ( myself.slash[key] ) { 
                        myself.slash[key].destroy();
                    }
                    // this must contain an entity.
                    myself.slash[key] =  Crafty.e('2D, DOM, SpriteAnimation, Mouse, '+propname);
                    // by default, invisible
                    myself.slash[key].visible = false;
                    myself.slash[key]
                        .animate("slash_up",1,0,5)
                        .animate("slash_left",1,1,5)
                        .animate("slash_down",1,2,5)
                        .animate("slash_right",1,3,5)
                        .attr({x:myself.x, y:myself.y, z:val.z});
                    myself.attach(myself.slash[key]);
                } else {
                    if ( myself.slash[key] ) { 
                        myself.slash[key].destroy();
                    }
                }

            });
            $.each( a.bow, function(key,val){
                if ( a.bow[key] )
                {
                    var spriteDef = {};
                    var propname = a.name + '_' + key + '_bow_cycle';
                    spriteDef[propname] = [0,2];
                    console.log(spriteDef);
                    // load sprite
                    Crafty.sprite(64, '../pics/bow/'+val.image, spriteDef);

                    // remove previous one if it exists.
                    if ( myself.bow[key] ) { 
                        myself.bow[key].destroy();
                    }
                    // this must contain an entity.
                    myself.bow[key] =  Crafty.e('2D, DOM, SpriteAnimation, Mouse, '+propname);
                    // by default, invisible
                    myself.bow[key].visible = false;
                    myself.bow[key]
                        .animate("bow_up",1,0,12)
                        .animate("bow_left",1,1,12)
                        .animate("bow_down",1,2,12)
                        .animate("bow_right",1,3,12)
                        .attr({x:myself.x, y:myself.y, z:val.z});
                    myself.attach(myself.bow[key]);
                } else {
                    if ( myself.bow[key] ) { 
                        myself.bow[key].destroy();
                    }
                }

            });
            $.each( a.hurt, function(key,val){
                if ( a.hurt[key] )
                {
                    var spriteDef = {};
                    var propname = a.name + '_' + key + '_hurt_cycle';
                    spriteDef[propname] = [0,2];
                    console.log(spriteDef);
                    // load sprite
                    Crafty.sprite(64, '../pics/hurt/'+val.image, spriteDef);

                    // remove previous one if it exists.
                    if ( myself.hurt[key] ) { 
                        myself.hurt[key].destroy();
                    }
                    // this must contain an entity.
                    myself.hurt[key] =  Crafty.e('2D, DOM, SpriteAnimation, Mouse, '+propname);
                    // by default, invisible
                    myself.hurt[key].visible = false;
                    myself.hurt[key]
                        .animate("hurt",1,0,6)
                        .attr({x:myself.x, y:myself.y, z:val.z});
                    myself.attach(myself.hurt[key]);
                } else {
                    if ( myself.hurt[key] ) { 
                        myself.hurt[key].destroy();
                    }
                }

            });
            $.each( a.spellcast, function(key,val){
                if ( a.spellcast[key] )
                {
                   var spriteDef = {};
                    var propname = a.name + '_' + key + '_spellcast_cycle';
                    spriteDef[propname] = [0,2];
                    console.log(spriteDef);
                    // load sprite
                    Crafty.sprite(64, '../pics/spellcast/'+val.image, spriteDef);

                    // remove previous one if it exists.
                    if ( myself.spellcast[key] ) { 
                        myself.spellcast[key].destroy();
                    }
                    // this must contain an entity.
                    myself.spellcast[key] =  Crafty.e('2D, DOM, SpriteAnimation, Mouse, '+propname);
                    // by default, invisible
                    myself.spellcast[key].visible = false;
                    myself.spellcast[key]
                        .animate("spellcast_up",1,0,6)
                        .animate("spellcast_left",1,1,6)
                        .animate("spellcast_down",1,2,6)
                        .animate("spellcast_right",1,3,6)
                        .attr({x:myself.x, y:myself.y, z:val.z});
                    myself.attach(myself.spellcast[key]);
                } else {
                    if ( myself.spellcast[key] ) { 
                        myself.spellcast[key].destroy();
                    }
                }
            });
        });
        return this;
    }, 
    enableAnimation: function(anim){
        $.each( anim, function(key,val){
            if ( anim[key] ) anim[key].visible = true;
        });
    },
    disableAnimation: function(anim){
        $.each( anim, function(key,val){
            if ( anim[key] ) anim[key].visible = false;
        });
    },
    hideAll: function(){
        var myself = this;
        this.disableAnimation(this.walk);
        this.disableAnimation(this.thrust);
        this.disableAnimation(this.slash);
        this.disableAnimation(this.bow);
        this.disableAnimation(this.hurt);
        this.disableAnimation(this.spellcast);
       /* $.each( myself.walk, function(key,val){
            if ( myself.walk[key] ) myself.walk[key].visible = false;
        });
        $.each( myself.thrust, function(key,val){
            if ( myself.thrust[key] ) myself.thrust[key].visible = false;
        });
        $.each( myself.slash, function(key,val){
            if ( myself.slash[key] ) myself.slash[key].visible = false;
        });
        $.each( myself.bow, function(key,val){
            if ( myself.bow[key] ) myself.bow[key].visible = false;
        });
        $.each( myself.hurt, function(key,val){
            if( myself.hurt[key] ) myself.hurt[key].visible = false;
        });
        $.each( myself.spellcast, function(key,val){
            if ( myself.spellcast[key] ) myself.spellcast[key].visible = false;
        });*/
        return this;
    },
    thrustAttack: function(direction) {
        console.log('attack!');
        this.hideAll();
        this.enableAnimation(this.thrust);
        if ( direction == 'left') 
        {
            console.log('Lefty1');
            for(var i in this.thrust)
            {
             
                if ( this.thrust[i] ) {
                    this.thrust[i].stop().animate("thrust_left", 10, 1);
                }
            }
        } 
        if ( direction == 'right' )
        {
            for(var i in this.thrust)
            {
                if ( this.thrust[i] ) {
                    this.thrust[i].stop().animate("thrust_right", 10, 1);
                }
            }
        }
        if ( direction == 'up' )
        {
            for(var i in this.thrust)
            {
                if ( this.thrust[i] ) {
                    this.thrust[i].stop().animate("thrust_up", 10, 1);
                }
            }
        }
        if ( direction == 'down' )
        {
            for(var i in this.thrust)
            {
                if ( this.thrust[i] ) {
                    this.thrust[i].stop().animate("thrust_down", 24, 1);
                }
            }
        }
        return this;
    }, 
    slashAttack: function(direction) {
        console.log('attack!');
        this.hideAll();
        this.enableAnimation(this.slash);
        if ( direction == 'left') 
        {
            for(var i in this.slash)
            {
                if ( this.slash[i] ) {
                    this.slash[i].stop().animate("slash_left", 20, 1);
                }
            }
        } 
        if ( direction == 'right' )
        {
            for(var i in this.slash)
            {
                if ( this.slash[i] ) {
                    this.slash[i].stop().animate("slash_right", 20, 1);
                }
            }
        }
        if ( direction == 'up' )
        {
            for(var i in this.slash)
            {
                if ( this.slash[i] ) {
                    this.slash[i].stop().animate("slash_up", 20, 1);
                }
            }
        }
        if ( direction == 'down' )
        {
            for(var i in this.slash)
            {
                if ( this.slash[i] ) {
                    this.slash[i].stop().animate("slash_down", 20, 1);
                }
            }
        }
        return this;
    },
    Ape: function() {
        //setup animations
        this.requires("Collision, Grid")
        //change direction when a direction change event is received
            .bind("NewDirection",
                  function (direction) {
                      this.hideAll();
                      this.enableAnimation(this.walk);
                      if (direction.x < 0) {
                          if (!this.walk.body.isPlaying("walk_left")){
                              for(var i in this.walk)
                              {
                                  if ( this.walk[i] ) this.walk[i].stop().animate("walk_left", 10, -1);
                              }
                          }
                      }
                      if (direction.x > 0) {
                          if (!this.walk.body.isPlaying("walk_right")){
                              for(var i in this.walk)
                              {
                                  if ( this.walk[i]) this.walk[i].stop().animate("walk_right", 10, -1);
                              }
                          }
                      }
                      if (direction.y < 0) {
                          if (!this.walk.body.isPlaying("walk_up")){
                              for(var i in this.walk)
                              {
                                  if ( this.walk[i]) this.walk[i].stop().animate("walk_up", 10, -1);
                              }
                          }
                      }
                      if (direction.y > 0) {
                          if (!this.walk.body.isPlaying("walk_down")){
                              for(var i in this.walk)
                              {
                                  if ( this.walk[i]) this.walk[i].stop().animate("walk_down", 10, -1);
                              }
                          }
                      }
                      if(!direction.x && !direction.y) {
                          for(var i in this.walk)
                          {
                              if ( this.walk[i]) this.walk[i].stop();
                          }
                      }
                  })
            .bind('Moved', function(from) {

                if(this.hit('solid')){
                    this.attr({x: from.x, y:from.y});
                } 

            })
            .onHit("fire", function() {
                this.destroy();
  			    // Subtract life and play scream sound :-)
            });
        return this;
    }
});