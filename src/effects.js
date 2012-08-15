
Crafty.c('Targetpos', {
    targetx: 0,
    targety: 0,
    setTarget: function(x,y){
        this.targetx = x;
        this.targety = y;
        return this;
    }
});

function DisplayFadingText( text, xpos, ypos )
{

    var e = Crafty.e("2D, DOM, Targetpos, Tween, Text")
        .attr({alpha: 1.0, x:xpos, y:ypos,z:8})
        .setTarget(xpos,ypos-100)
        .text(text)
        .css({
            "font-family":"Impact",
            "font-size":"34pt",
            "font-weight":"bold"
        })
        .bind("TweenEnd", function(){
            this.destroy();
        });
    e.tween({alpha: 0.0, x:e.targetx, y:e.targety}, 100);
}

