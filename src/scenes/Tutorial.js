import { Scene } from 'phaser';
import Player from '../player.js';

//prevents tweens from repeating in later code, which would hide the signs
var canReadSign = true;

export class Tutorial extends Scene
{
    constructor ()
    {
        super('Tutorial');
    }
        
    create ()
    {
        this.levelNum = 0;
        this.gameOver = false;
        
        // ---Map---
        
            const map = this.make.tilemap({key: 'tutorialMap'});

            const tileset  = map.addTilesetImage("IndustrialTilesV2", 'tiles');

            this.backgroundLayer = map.createLayer("Background", tileset, 0, 0);
            this.worldLayer = map.createLayer("World", tileset, 0, 0);
            

            this.worldLayer.setCollisionByProperty({collides: true});
            
            this.cameras.main.setBackgroundColor('0x00ff00'); //green color

            // ---platforms---
            {
                //  The platforms group 
                this.platforms = this.physics.add.staticGroup();
                this.platformsPass = this.physics.add.staticGroup();
                //This code looks at the tile index and replaces tiles with resized static objects
                this.worldLayer.forEachTile(tile => {
                    if (tile.index === 85 || tile.index === 86 || tile.index === 87) {
                        // A sprite has its origin at the center, so place the sprite at the center of the tile
                        const x = tile.getCenterX();
                        const y = tile.getCenterY();
                        var plat;
                        if(tile.index === 85) {plat = this.platforms.create(x, y, "plat1");}
                        else if(tile.index === 86) {plat = this.platforms.create(x, y, "plat2");}
                        else if(tile.index === 87) {plat = this.platforms.create(x, y, "plat3");}

                        plat.body.setSize(32, 10).setOffset(0, 0);

                        // And lastly, remove the spike tile from the layer
                        this.worldLayer.removeTileAt(tile.x, tile.y);
                    }
                    //passable platforms
                    else if(tile.index === 26) {
                        const x = tile.getCenterX();
                        const y = tile.getCenterY();
                        var plat = this.platformsPass.create(x, y, "platPass");
                        plat.body.setSize(32, 10).setOffset(0, 0);
                        plat.body.checkCollision.down = false;
                        plat.body.checkCollision.left = false;
                        plat.body.checkCollision.right = false;

                        this.worldLayer.removeTileAt(tile.x, tile.y);
                    }
                });

            }
        
        
        // The player and its settings

        this.player = new Player(this, 160, 660);

        //emote (ignores gravity and is initially invisible) {
        this.emote = this.physics.add.sprite(this.player.sprite.x, this.player.sprite.y, "emote");
        this.emote.body.setAllowGravity(false);
        this.emote.setVisible(false);
        
        //explode object to play animation (since the explosion sprites aren't in the player sprite sheet, sizes are off)
        this.explode = this.physics.add.sprite(this.player.sprite.x, this.player.sprite.y, "explode");
        this.explode.body.setAllowGravity(false);
        this.explode.setVisible(false);

        //  Some boxes to collect, 3 in total
        this.boxes = this.physics.add.group();
        this.boxes.create(464, 656, 'box');
        this.boxes.create(400, 375, 'box');
        this.boxes.create(512, 245, 'box');
        this.boxes.create(990, 666, 'box');

        this.boxes.children.iterate(function (child) {

            //  Give each box a slightly different bounce
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
            child.setSize(24, 14).setOffset(0, 18) //resize to sprite size
            // child.disableBody(true, true); // disable for now -----

        });

        this.bombs = this.physics.add.group();
        this.bombs.create(111, 375, 'bomb');

        //---Hint Sign---
        {
        //invisible collision bodies to trigger sign code
        this.signs = this.physics.add.staticGroup();
        this.sign1 = this.signs.create(336, 656, 'box');
        this.sign2 = this.signs.create(272, 368, 'box');
        this.sign3 = this.signs.create(752, 240, 'box');

        this.signs.children.iterate(function (child) {
            child.setSize(32, 32).setVisible(false);
        });

        //the actualy background & text of signs, set invisible initially
        var textConfig = {fontSize:'20px', color:'white', fontFamily: 'Graviton'};
        this.hintSign1 =  this.add.rectangle(77, 556, 550, 50, 0x008000).setOrigin(0);
        this.hintSign1Text = this.add.text(87, 560, 'Uh oh, looks like factory pipes have broken! Time to get to work.\nUse arrows keys to move and jump. Collect all the boxes you can!', textConfig).setOrigin(0);
        this.hintSign2 =  this.add.rectangle(63, 268, 415, 50, 0x008000).setOrigin(0);
        this.hintSign2Text = this.add.text(73, 270, 'Look like some explosive packages got mixed in.\n                  Careful not to touch them!', textConfig).setOrigin(0);
        this.hintSign3 =  this.add.rectangle(559, 140, 390, 50, 0x008000).setOrigin(0);
        this.hintSign3Text = this.add.text(569, 142, ' Press down to drop through these platforms.\nBombs pass right through them, so be careful!', textConfig).setOrigin(0);
        this.hintSign1.alpha = 0;
        this.hintSign1Text.alpha=0;
        this.hintSign2.alpha = 0;
        this.hintSign2Text.alpha=0;
        this.hintSign3.alpha = 0;
        this.hintSign3Text.alpha=0;
        }

        // ---Collision---
        {
            //  Collide the player and the boxes with map tiles
            this.physics.add.collider(this.player.sprite, this.worldLayer, hitGround, null, this);
            this.physics.add.collider(this.player.sprite, this.platforms, hitGround, null, this);
            this.physics.add.collider(this.player.sprite, this.platformsPass, hitPlatPass, null, this);
            this.physics.add.collider(this.boxes, this.worldLayer);
            this.physics.add.collider(this.boxes, this.platforms);
            this.physics.add.collider(this.boxes, this.platformsPass);
            this.physics.add.collider(this.bombs, this.worldLayer);
            this.physics.add.collider(this.bombs, this.platforms);
            // this.physics.add.collider(this.bombs, this.platformsPass);

            //  Checks to see if the player overlaps with any of the boxes, if they do call the collectBox function
            this.physics.add.overlap(this.player.sprite, this.boxes, collectBox, null, this);
            this.physics.add.collider(this.player.sprite, this.bombs, hitBomb, null, this);
            this.physics.add.overlap(this.player.sprite, this.signs, showHint, null, this);
        }
        // ---Camera---
        {
        this.cameras.main.setSize(1024, 768);
        this.cameras.main.setBounds(0, 0, 800, 600);
        this.cameras.main.startFollow(this.player.sprite, false, 1, 1, 0, 0);
        }

        // ---Sound---
        {
            this.landing = this.sound.add('landing', {volume: 0.05});
            this.step = this.sound.add('step', {volume: 0.04});
            this.jump = this.sound.add('jump', {volume: 0.015});
            this.explodeSound = this.sound.add('explodeSound', {volume: 0.01});
        }

        // dev skip
        // this.input.once('pointerdown', () => {
        //     this.scene.start('Game');
        // });

        // ---Timer---
        {
            this.idleTimer = this.time.addEvent({ delay: 5000, callback: this.onIdle, callbackScope: this});
            this.sleepTimer = new Phaser.Time.TimerEvent({ delay: 2000, callback: this.onSleep, callbackScope: this});
            this.sleepEmoteTimer = new Phaser.Time.TimerEvent({ delay: 5000, callback: this.onSleepEmote, callbackScope: this});
            this.hintTimer = new Phaser.Time.TimerEvent({ delay: 250, callback: this.onHint, callbackScope: this});
        }
        
    }
    // ---Timer Functions---
    //restarts idle related timers and marks player as not idle. Function is called when a movement key is pressed
    resetIdle() {
        this.idleTimer.reset({ delay: 5000, callback: this.onIdle, callbackScope: this});
        this.sleepTimer.reset({ delay: 2000, callback: this.onSleep, callbackScope: this});
        this.sleepEmoteTimer.reset({ delay: 5000, callback: this.onSleepEmote, callbackScope: this});
        this.time.addEvent(this.idleTimer);
        this.player.playerIdle = false;
    }
    //after time triggers, mark the player as idle, start 2s sleep timer
    onIdle() {
        this.player.playerIdle = true;
        this.time.addEvent(this.sleepTimer);
    }
    //For transitioning between the two sleep frames, start 5s sleep Emote timer
    onSleep() {
        this.player.isAsleep = true;
        //another reset here because the one in resetIdle() doesn't seem to stop this timer in-progress for some reason
        this.sleepEmoteTimer.reset({ delay: 5000, callback: this.onSleepEmote, callbackScope: this});
        this.time.addEvent(this.sleepEmoteTimer);
    }
    //For playing the waiting emote while sleeping
    onSleepEmote() {
        if(this.player.playerIdle) {
            this.emote.setVisible(true);
            this.emote.anims.play('ellipsis', true);
            this.emote.on("animationcomplete", ()=>{ //listen to when an animation completes, then run
                this.emote.setVisible(false);
                this.sleepEmoteTimer.reset({ delay: 5000, callback: this.onSleepEmote, callbackScope: this});
                this.time.addEvent(this.sleepEmoteTimer);
            });
        }
    }
    //resets the canReadSign var, and makes sign text invisible
    onHint() {
        canReadSign = true;
        if(this.hintSign1.alpha != 0) { 
            this.tweens.add({
                targets: [this.hintSign1, this.hintSign1Text],
                alpha: {from:1, to:0},
                repeat: 0,
                duration: 500
            });
        }
        if(this.hintSign2.alpha != 0) { 
            this.tweens.add({
                targets: [this.hintSign2, this.hintSign2Text],
                alpha: {from:1, to:0},
                repeat: 0,
                duration: 500
            });
        }
        if(this.hintSign3.alpha != 0) { 
            this.tweens.add({
                targets: [this.hintSign3, this.hintSign3Text],
                alpha: {from:1, to:0},
                repeat: 0,
                duration: 500
            });
        }
    }

    update ()
    {

        if (this.gameOver)
        {
            return;
        }


        this.player.update();
        
        // emote sprite follows player
        this.emote.setX(this.player.sprite.x);
        this.emote.setY(this.player.sprite.y - 40);
        //same for explosion object
        this.explode.setX(this.player.sprite.x);
        this.explode.setY(this.player.sprite.y);

    }
    
}

function hitGround (player, worldLayer) {
    //if makes sure we're touching the ground, othewise sound would trigger on walls
    if (this.player.sprite.body.blocked.down){
        //makes sure it only plays on a landing once
        if (this.player.inAir) {
            this.player.inAir = false;
            this.landing.play();
        }
    }
}

function hitPlatPass(player, platform) {
    if (this.player.sprite.body.blocked.down){
        if (this.player.inAir) {
            this.player.inAir = false;
            this.landing.play();
        }
    }
    this.player.isOnPlatformPass = true;
    this.player.onPlatform = platform; //pass platform object to Player
}

function collectBox(player, box) {
    box.disableBody(true, true);

    //collect all boxes to move to next level
    if (this.boxes.countActive(true) === 0)
    {
        this.scene.start('Game');
    }
}

function hitBomb (player, bomb) {
    this.physics.pause();
    bomb.setVisible(false);

    this.player.sprite.setVisible(false);

    if(!this.explodeSound.isPlaying) {
        this.explodeSound.play();
    }

    this.explode.setVisible(true);
    this.explode.anims.play('playerExplode');

    this.gameOver = true;


    this.explode.on("animationcomplete", ()=>{ //listen to when an animation completes, then run
        this.scene.start('GameOver', {level: 0});
    });
    
}

function showHint(player, sign) {
    this.hintTimer.reset({ delay: 250, callback: this.onHint, callbackScope: this});
    this.time.addEvent(this.hintTimer);
    if(canReadSign) {
        //prevents tweens from repeating
        canReadSign = false;
        if(sign == this.sign1) {
            this.tweens.add({
                targets: [this.hintSign1, this.hintSign1Text],
                alpha: {from:0, to:1},
                repeat: 0,
                duration: 500
            })
        }
        if(sign == this.sign2) {
            this.tweens.add({
                targets: [this.hintSign2, this.hintSign2Text],
                alpha: {from:0, to:1},
                repeat: 0,
                duration: 500
            })
        }
        if(sign == this.sign3) {
            this.tweens.add({
                targets: [this.hintSign3, this.hintSign3Text],
                alpha: {from:0, to:1},
                repeat: 0,
                duration: 500
            })
        }
    }
        
}