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

    init: function()
    {
        for(var i in this.walk ) this.thrust[i] = null;
        for(var i in this.thrust ) this.thrust[i] = null;    
        for(var i in this.slash ) this.slash[i] = null;
        for(var i in this.bow ) this.bow[i] = null;    
        for(var i in this.hurt ) this.hurt[i] = null;    
        for(var i in this.spellcast ) this.spellcast[i] = null;    
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