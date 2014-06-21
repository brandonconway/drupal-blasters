
 //based on http://www.html5rocks.com/en/tutorials/canvas/notearsgame/

$(document).ready(function(){
    var width = 500;
    var height = 700;
    var loop;
    var score = 0;
    var canvas = $('canvas').get(0).getContext('2d');
    var FPS = 30;
    
    //images and sounds
    player_img = new Image();
    player_img.src= './images/pony.png';
    
    enemy_img = new Image();
    enemy_img.src= './images/druplicon.png';
    explosion_img = new Image();
    explosion_img.src = './images/explosion.jpg';

    shoot_snd = new Audio('./sounds/shoot.mp3');
    explode_snd = new Audio('./sounds/explode.mp3');
    theme_snd = new Audio('./sounds/theme.mp3');
    game_over = new Audio('./sounds/gameover.mp3');
    
    //loop theme song
    $(theme_snd).on('ended', function(e){
        this.current_time = 0;
        this.play();
    });

    //set canvas size: this may be dynamic at some point?
    $('canvas').attr('width', width+'px');
    $('canvas').attr('height', height+'px');
    
    

    $('#start-over').on('click', function(e){
        player.x = width/2;
        player.y= height-57;
        enemies = [];
        playerBullets = [];
        score = 0;
        player.active=true;
        loop = startGame();
        $('.startover').toggle();
        });

    function startGame(){
        var i =0;
        var interval = setInterval(function() {
            update(i);
            draw();
            i++;
            }, 1000/FPS);
        theme_snd.play();
        return interval;
    }
    
        
    //objects
    var player = {
        color:'blue',
        x:width/2-36,
        y:height-57,
        width:72,
        height:57,
        img: player_img,
        active:true,
        draw: function(){
            if(this.active)
            canvas.drawImage(this.img,this.x,this.y);    
            else{
                //you died
                canvas.drawImage(explosion_img,this.x,this.y);    
                theme_snd.pause();
                game_over.play();
                $('.died').show();
                $('#score').text('Score: '+score);
                $('.startover').toggle();
                clearInterval(loop);
            }
        },
        shoot: function(){
            var bulletPosition = this.midpoint();
            shoot_snd.play();
            playerBullets.push(Bullet({
                     speed: 5,
                     x: bulletPosition.x,
                     y: bulletPosition.y
                 }));
        },
        midpoint: function() {
            return {
                x: this.x + this.width/2,
                y: this.y + this.height/2
                };
        },
        explode: function() {
            this.active = false;
            explode_snd.play();
            }
    }

    function draw(){
        canvas.clearRect(0, 0, width, height);
        player.draw();
        playerBullets.forEach(function(bullet) {
            bullet.draw();
              });
        enemies.forEach(function(enemy) {
            enemy.draw();
        
        canvas.font = '18px sans-serif';
        canvas.fillStyle='white';
        canvas.fillText('Score: '+score, 0, 15);

        });
    }
    
    
    function update(i){
        //a or h= left
        if(keysDown[65]|| keysDown[72])
            player.x -=5; 
        //d or l= right
        if(keysDown[68] || keysDown[76])
           player.x +=5; 
        //w  k= up
        if(keysDown[87] || keysDown[75])
           player.y -=5; 
        //s or j = down
        if(keysDown[83]|| keysDown[74])
           player.y +=5; 
        //Space Bar{
        if(keysDown[32]){
        //slow shooting down just a bit
            if(i%2==0){
                player.shoot();
            } 
        }
        //keep player in bounds
        player.x = clamp(player.x, 0, (width-player.width));
        player.y = clamp(player.y, (height-height/2), height-player.height);

        //bullets
        playerBullets.forEach(function(bullet) {
            bullet.update();
          });
        playerBullets = playerBullets.filter(function(bullet) {
            return bullet.active;
              });
        
        //enemies 
        enemies.forEach(function(enemy) {
            enemy.update();
        });

        enemies = enemies.filter(function(enemy) {
            return enemy.active;
        });

        if(Math.random() < 0.1) {
            enemies.push(Enemy());
        }
        
        handleCollisions();
    }
 
   var playerBullets = [];
   function Bullet(I) {
      I.active = true;

      I.xVelocity = 0;
      I.yVelocity = -I.speed;
      I.width = 3;
      I.height = 3;
      I.color = "yellow";
    
      I.inBounds = function() {
        return I.x >= 0 && I.x <= height &&
          I.y >= 0 && I.y <= height;
      };

      I.draw = function() {
        canvas.fillStyle = this.color;
        canvas.fillRect(this.x, this.y, this.width, this.height);
      };

      I.update = function() {
        I.x += I.xVelocity;
        I.y += I.yVelocity;

        I.active = I.active && I.inBounds();
      };

      return I;
    } 

    var enemies = [];
    function Enemy(I) {
      I = I || {};

      I.active = true;
      I.age = Math.floor(Math.random() * 128);
      I.points = 100;
      I.color = "#A2B";

      I.x = width / 4 + Math.random() * width / 2;
      I.y = 0;
      I.xVelocity = 0
      I.yVelocity = 2;
      I.zig_zag = 3.0;

      I.width = 52;
      I.height = 59;

      I.inBounds = function() {
        return I.x >= 0 && I.x <= width &&
          I.y >= 0 && I.y <= height;
      };
      I.img = enemy_img;
      I.draw = function() {
        if(this.active)
        canvas.drawImage(this.img, this.x, this.y);
        else
        canvas.drawImage(explosion_img, this.x, this.y);
      };

      I.update = function() {
        I.x += I.xVelocity;
        I.y += I.yVelocity;
        I.xVelocity = I.zig_zag * Math.sin(I.age * Math.PI / 64);
        I.age++;
        I.zig_zag += 1/(10 * FPS);
        I.active = I.active && I.inBounds();
      };
      
      I.explode = function(){
        explode_snd.play();
        this.active = false;  
      }
      return I;
    };


    //coliision detection util
    function collides(a, b) {
      return a.x < b.x + b.width &&
             a.x + a.width > b.x &&
             a.y < b.y + b.height &&
             a.y + a.height > b.y;
    }

    function handleCollisions() {
      playerBullets.forEach(function(bullet) {
        enemies.forEach(function(enemy) {
          if (collides(bullet, enemy)) {
            score += enemy.points;
            enemy.explode();
            bullet.active = false;
          }
        });
      });

      enemies.forEach(function(enemy) {
        if (collides(enemy, player)) {
          enemy.explode();
          player.explode();
        }
      });
    }

    //keypress utils
    window.keysDown = {};      // Tracking object

        $("body").on('keydown', function(e) {
            //don't let spacebar press trigger button
            if (e.which == 32)e.preventDefault();
            keysDown[e.which] = true;
        });

        $("body").on('keyup', function(e) {
            if (e.which == 32)e.preventDefault();
            keysDown[e.which] = false;
        });
    
    function clamp(input, min, max) {
      return Math.max(min, Math.min(input,max));
    };

});
