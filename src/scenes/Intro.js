import { Scene } from 'phaser';
import Player from '../player.js';

//prevents tweens from repeating in later code, which would hide the signs
var canReadSign = true;

export class Intro extends Scene
{
    constructor ()
    {
        super('Intro');
    }
        
    create ()
    {
        this.levelNum = 0;
        
        // ---Map---
        
            const map = this.make.tilemap({key: 'introMap'});

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
                //Not exactly sure why, but tile index needs to be one higher than the one given by Tiled program
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

                    else if(tile.index === 53) {
                        const x = tile.getCenterX();
                        const y = tile.getCenterY();
                        var chargeStation = this.platforms.create(x, y, "chargeStation");
                        chargeStation.body.setSize(32, 25).setOffset(0, 7);

                        this.worldLayer.removeTileAt(tile.x, tile.y);
                    }
                });

            }
        
        
        // The player and its settings

        this.player = this.physics.add.sprite(150, 608, 'player').setCollideWorldBounds(true).setSize(36, 39).setOffset(0, 8);

        //emote (ignores gravity and is initially invisible) {
        this.emote = this.physics.add.sprite(this.player.x, this.player.y, "emote");
        this.emote.body.setAllowGravity(false);
        this.emote.setVisible(false);
        
        //explode object to play animation (since the explosion sprites aren't in the player sprite sheet, sizes are off)
        this.explode = this.physics.add.sprite(this.player.x, this.player.y, "explode");
        this.explode.body.setAllowGravity(false);
        this.explode.setVisible(false);

        //  Some boxes to collect, 3 in total
        this.boxes = this.physics.add.group();
        // this.boxes.create(464, 656, 'box');
        // this.boxes.create(400, 375, 'box');
        // this.boxes.create(512, 245, 'box');
        // this.boxes.create(990, 666, 'box');

        this.boxes.children.iterate(function (child) {

            //  Give each box a slightly different bounce
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
            child.setSize(24, 14).setOffset(0, 18) //resize to sprite size
            // child.disableBody(true, true); // disable for now -----

        });

        this.bombs = this.physics.add.group();
        // this.bombs.create(111, 375, 'bomb');


        // ---Collision---
        {
            //  Collide the player and the boxes with map tiles
            this.physics.add.collider(this.player, this.worldLayer, hitGround, null, this);
            this.physics.add.collider(this.player, this.platforms, hitGround, null, this);
            this.physics.add.collider(this.player, this.platformsPass, hitPlatPass, null, this);
            this.physics.add.collider(this.boxes, this.worldLayer);
            this.physics.add.collider(this.boxes, this.platforms);
            this.physics.add.collider(this.boxes, this.platformsPass);
            this.physics.add.collider(this.bombs, this.worldLayer);
            this.physics.add.collider(this.bombs, this.platforms);
            // this.physics.add.collider(this.bombs, this.platformsPass);

            //  Checks to see if the player overlaps with any of the boxes, if they do call the collectBox function
            this.physics.add.overlap(this.player, this.boxes, collectBox, null, this);
            this.physics.add.collider(this.player, this.bombs, hitBomb, null, this);
        }
        // ---Camera---
        {
        this.cameras.main.setSize(1024, 768);
        this.cameras.main.setBounds(0, 0, 800, 600);
        this.cameras.main.startFollow(this.player, false, 1, 1, 0, 0);
        }

        // ---Sound---
        {
            // this.gameMusic = this.sound.add("gameMusic");
            // this.gameMusic.play({loop: true, volume: 0.05});
            
            this.landing = this.sound.add('landing', {volume: 0.05});
            this.step = this.sound.add('step', {volume: 0.04});
            this.jump = this.sound.add('jump', {volume: 0.015});
            this.explodeSound = this.sound.add('explodeSound', {volume: 0.015});
            this.pickUp = this.sound.add('pickUp', {volume: 0.025});

            this.firstLanding = true;
        }

        // dev skip
        // this.input.once('pointerdown', () => {
        //     this.scene.start('Game');
        // });

        // ---Timer---
        {
            // this.idleTimer = this.time.addEvent({ delay: 4000, callback: this.onIdle, callbackScope: this});
            // this.sleepTimer = new Phaser.Time.TimerEvent({ delay: 2000, callback: this.onSleep, callbackScope: this});
            // this.sleepEmoteTimer = new Phaser.Time.TimerEvent({ delay: 4000, callback: this.onSleepEmote, callbackScope: this});
        }
        
    }
    // ---Timer Functions---
    //restarts idle related timers and marks player as not idle. Function is called when a movement key is pressed
    // resetIdle() {
    //     this.idleTimer.reset({ delay: 4000, callback: this.onIdle, callbackScope: this});
    //     this.sleepTimer.reset({ delay: 2000, callback: this.onSleep, callbackScope: this});
    //     this.sleepEmoteTimer.reset({ delay: 4000, callback: this.onSleepEmote, callbackScope: this});
    //     this.time.addEvent(this.idleTimer);
    //     this.player.playerIdle = false;
    // }
    //after time triggers, mark the player as idle, start 2s sleep timer
    // onIdle() {
    //     this.player.playerIdle = true;
    //     this.time.addEvent(this.sleepTimer);
    // }
    //For transitioning between the two sleep frames, start 5s sleep Emote timer
    // onSleep() {
    //     this.player.isAsleep = true;
    //     //another reset here because the one in resetIdle() doesn't seem to stop this timer in-progress for some reason
    //     this.sleepEmoteTimer.reset({ delay: 4000, callback: this.onSleepEmote, callbackScope: this});
    //     this.time.addEvent(this.sleepEmoteTimer);
    // }
    //For playing the waiting emote while sleeping
    // onSleepEmote() {
    //     if(this.player.playerIdle) {
    //         this.emote.setVisible(true);
    //         this.emote.anims.play('ellipsis', true);
    //         this.emote.on("animationcomplete", ()=>{ //listen to when an animation completes, then run
    //             this.emote.setVisible(false);
    //             this.sleepEmoteTimer.reset({ delay: 4000, callback: this.onSleepEmote, callbackScope: this});
    //             this.time.addEvent(this.sleepEmoteTimer);
    //         });
    //     }
    // }
    

    update ()
    {

        
        // emote sprite follows player
        this.emote.setX(this.player.x);
        this.emote.setY(this.player.y - 40);
        //same for explosion object
        this.explode.setX(this.player.x);
        this.explode.setY(this.player.y);

    }
    
}

function hitGround (player, worldLayer) {
    //if makes sure we're touching the ground, othewise sound would trigger on walls
    if (this.player.body.blocked.down){
        //makes sure it only plays on a landing once
        // if (this.player.inAir) {
        //     this.player.inAir = false;
            if(this.firstLanding) {this.firstLanding = false;}
            else {this.landing.play();}
        // }
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
    this.pickUp.play();

    //collect all boxes to move to next level
    // if (this.boxes.countActive(true) === 0)
    // {
    //     this.scene.start('Game');
    // }
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


    this.explode.on("animationcomplete", ()=>{ //listen to when an animation completes, then run
        this.scene.start('GameOver', {level: 0});
    });
    
}