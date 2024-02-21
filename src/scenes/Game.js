import { Scene } from 'phaser';

var stars;
var bombs;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;

var fastFall = false;
var idleTimer;
var isAsleep = false;
var worldLayer;
var backgroundLayer;

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

        
    create ()
    {
        // ---Map---
        {
            const map = this.make.tilemap({key: 'map'});

            const tileset  = map.addTilesetImage("IndustrialTiles", 'tiles');

            backgroundLayer = map.createLayer("Background", tileset, 0, 0);
            worldLayer = map.createLayer("World", tileset, 0, 0);
            

            worldLayer.setCollisionByProperty({collides: true});
            
            this.cameras.main.setBackgroundColor(0x00ff00);

        // this.add.image(512, 384, 'background').setAlpha(0.5);

            // ---platforms---
            {
                //  The platforms group 
                this.platforms = this.physics.add.staticGroup();
                //This code looks at the tile index and replaces platform tiles with resized static objects
                worldLayer.forEachTile(tile => {
                    if (tile.index === 77 || tile.index === 78 || tile.index === 79) {
                        // A sprite has its origin at the center, so place the sprite at the center of the tile
                        const x = tile.getCenterX();
                        const y = tile.getCenterY();
                        var plat;
                        if(tile.index === 77) {plat = this.platforms.create(x, y, "plat1");}
                        else if(tile.index === 78) {plat = this.platforms.create(x, y, "plat2");}
                        else if(tile.index === 79) {plat = this.platforms.create(x, y, "plat3");}

                        plat.body.setSize(32, 10).setOffset(0, 0);

                        // And lastly, remove the spike tile from the layer
                        worldLayer.removeTileAt(tile.x, tile.y);
                    }
                });

                //  Here we create the ground.
                //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
                // platforms.create(400, 568, 'ground').setScale(2).refreshBody();

                //  Now let's create some ledges
                // platforms.create(600, 400, 'ground');
                // platforms.create(50, 250, 'ground');
                // platforms.create(750, 220, 'ground');
            }
        }
        
        // The player and its settings
        this.player = this.physics.add.sprite(100, 662, 'player');

        //  Player physics properties. Give the little guy a slight bounce.
        this.player.setBounce(0);
        this.player.setCollideWorldBounds(true);
        this.player.setSize(36, 39).setOffset(0, 9); //makes player hitbox a bit smaller to match sprite, more forgiving

        //  Input Events
        cursors = this.input.keyboard.createCursorKeys();

        //emote (ignores gravity and is initially invisible) {
        this.emote = this.physics.add.sprite(this.player.x, this.player.y, "emote");
        this.emote.body.setAllowGravity(false);
        this.emote.setVisible(false);
        
        //explode object to play animation (since the explosion sprites aren't in the player sprite sheet, sizes are off)
        this.explode = this.physics.add.sprite(this.player.x, this.player.y, "explode");
        this.explode.body.setAllowGravity(false);
        this.explode.setVisible(false);

        //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
        stars = this.physics.add.group({
            key: 'box',
            repeat: 9,
            setXY: { x: 192, y: 120, stepX: 80 }
        });

        stars.children.iterate(function (child) {

            //  Give each star a slightly different bounce
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
            child.setSize(24, 14).setOffset(0, 18) //resize to sprite size

        });

        bombs = this.physics.add.group();

        //  The score
        scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' }).setColor('white');

        // ---Collision---
        {
            //  Collide the player and the stars with map tiles
            this.physics.add.collider(this.player, worldLayer, hitGround, null, this);
            this.physics.add.collider(this.player, this.platforms, hitGround, null, this);
            this.physics.add.collider(stars, worldLayer);
            this.physics.add.collider(stars, this.platforms);
            this.physics.add.collider(bombs, worldLayer);
            this.physics.add.collider(bombs, this.platforms);

            //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
            this.physics.add.overlap(this.player, stars, collectStar, null, this);
            this.physics.add.collider(this.player, bombs, hitBomb, null, this);
        }
        // ---Camera---
        {
        this.cameras.main.setSize(1024, 768);
        this.cameras.main.setBounds(0, 0, 800, 600);
        this.cameras.main.startFollow(this.player, false, 1, 1, 0, 0);
        }

        // ---Sound---
        {
            this.landing = this.sound.add('landing', {volume: 0.05});
            this.step = this.sound.add('step', {volume: 0.04});
            this.jump = this.sound.add('jump', {volume: 0.015});
            this.explodeSound = this.sound.add('explodeSound', {volume: 0.01});
        }

        // ---Timer---
        {
            this.idleTimer = this.time.addEvent({ delay: 5000, callback: this.onIdle, callbackScope: this});
            this.sleepTimer = new Phaser.Time.TimerEvent({ delay: 2000, callback: this.onSleep, callbackScope: this});
            this.sleepEmoteTimer = new Phaser.Time.TimerEvent({ delay: 5000, callback: this.onSleepEmote, callbackScope: this});
        }
        
    }
    // ---Timer Functions---
    //restarts idle related timers and marks player as not idle. Function is called when a movement key is pressed
    resetIdle() {
        this.idleTimer.reset({ delay: 5000, callback: this.onIdle, callbackScope: this});
        this.sleepTimer.reset({ delay: 2000, callback: this.onSleep, callbackScope: this});
        this.sleepEmoteTimer.reset({ delay: 5000, callback: this.onSleepEmote, callbackScope: this});
        this.time.addEvent(this.idleTimer);
        this.playerIdle = false;
    }
    //after time triggers, mark the player as idle, start 2s sleep timer
    onIdle() {
        this.playerIdle = true;
        this.time.addEvent(this.sleepTimer);
    }
    //For transitioning between the two sleep frames, start 5s sleep Emote timer
    onSleep() {
        isAsleep = true;
        //another reset here because the one in resetIdle() doesn't seem to stop this timer in-progress for some reason
        this.sleepEmoteTimer.reset({ delay: 5000, callback: this.onSleepEmote, callbackScope: this});
        this.time.addEvent(this.sleepEmoteTimer);
    }
    //For playing the waiting emote while sleeping
    onSleepEmote() {
        if(this.playerIdle) {
            this.emote.setVisible(true);
            this.emote.anims.play('ellipsis', true);
            this.emote.on("animationcomplete", ()=>{ //listen to when an animation completes, then run
                    this.emote.setVisible(false);
                    this.sleepEmoteTimer.reset({ delay: 5000, callback: this.onSleepEmote, callbackScope: this});
                    this.time.addEvent(this.sleepEmoteTimer);
            });
        }
    }

    update ()
    {

        if (gameOver)
        {
            return;
        }

        // ---Player Movement---
        {
            
            if (cursors.left.isDown)
            {
                this.resetIdle();   //resets Idle timer
                this.player.setFlipX(true);
                this.player.setVelocityX(-160);
                this.player.anims.play('run', true);
                if(!this.step.isPlaying && this.player.body.blocked.down) {
                    this.step.play();
                }
            }
            else if (cursors.right.isDown)
            {
                this.resetIdle();
                this.player.setFlipX(false);
                this.player.setVelocityX(160);
                this.player.anims.play('run', true);
                if(!this.step.isPlaying && this.player.body.blocked.down) {
                    this.step.play();
                }
            }
            else //no key presses, look above in `Timer Functions` for idle logic
            {
                this.player.setVelocityX(0);
                if (this.playerIdle) {
                    if(!isAsleep) {
                        this.player.anims.play('sleep1');
                    }
                    else if(isAsleep) {
                        this.player.anims.play('sleep2');
                    }
                }
                else {
                    isAsleep = false;
                    this.player.anims.play('idle', true)
                }
            }

            //jump code
            if (cursors.up.isDown && this.player.body.blocked.down) {
                this.resetIdle();
                this.player.setVelocityY(-330);
                if(!this.jump.isPlaying && this.player.body.blocked.down) {
                    this.jump.play();
                }
            }

            if (!this.player.body.blocked.down) {
                this.inAir = true;
                if (this.player.body.velocity.y < 0) { //up is negative y
                    this.player.anims.play('jump');
                }
                else if (330 >= this.player.body.velocity.y > 0) {
                    this.player.anims.play('fall');
                }
                else if (this.player.body.velocity.y > 330) {
                    fastFall = true;
                    this.player.anims.play('fallFast');
                }
            }
        }
        
        
        // emote sprite follows player
        this.emote.setX(this.player.x);
        this.emote.setY(this.player.y - 40);
        //same for explosion object
        this.explode.setX(this.player.x);
        this.explode.setY(this.player.y);
    }
    
}

//currently doesn't overide other animations, so never visible to player
function hitGround (player, worldLayer) {
    if (this.player.body.blocked.down){
        if (this.inAir) {
            this.inAir = false;
            this.landing.play();
        }
        // if (fastFall) {
        //     fastFall = false;
        //     this.input.keyboard.enabled = false;
        //     isPlayerMovable = false;
        //     emote.setVisible(true);
        //     emote.anims.play('exclaim');
        //     emote.on("animationcomplete", ()=>{ //listen to when an animation completes, then run
        //     emote.setVisible(false);
        //     this.input.keyboard.enabled = true;
        //     isPlayerMovable = true;
        //     });
        // }
    }
}

function collectStar(player, star)
{
    star.disableBody(true, true);

    //  Add and update the score
    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0)
    {
        //  A new batch of stars to collect
        stars.children.iterate(function (child) {

            child.enableBody(true, child.x, 120, true, true);

        });

        var x = (this.player.x < 512) ? Phaser.Math.Between(512, 832) : Phaser.Math.Between(192, 512);

        var bomb = bombs.create(x, 120, 'bomb');
        bomb.setSize(28,22).setOffset(0, 10); //resize to sprite size
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-160, 160), 20);
        bomb.allowGravity = false;

    }
}

function hitBomb (player, bomb)
{
    this.physics.pause();

    this.player.setTint(0xff0000);
    this.player.setVisible(false);

    if(!this.explodeSound.isPlaying) {
        this.explodeSound.play();
    }

    this.explode.setVisible(true);
    this.explode.anims.play('playerExplode');

    gameOver = true;


    this.explode.on("animationcomplete", ()=>{ //listen to when an animation completes, then run
        this.scene.start('GameOver');
    });
    
}