import { Scene } from 'phaser';
import Player from '../player.js';

var boxes;
var bombs;
var score = 0;
var scoreText;

var idleTimer;

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }
        
    create ()
    {
        score = 0;
        this.gameOver = false;
        
        // ---Map---
        {
            const map = this.make.tilemap({key: 'map1'});

            const tileset  = map.addTilesetImage("IndustrialTilesV2", 'tiles');

            this.backgroundLayer = map.createLayer("Background", tileset, 0, 0);
            this.worldLayer = map.createLayer("World", tileset, 0, 0);
            

            this.worldLayer.setCollisionByProperty({collides: true});
            
            this.cameras.main.setBackgroundColor('0x00ff00'); //green color

        // this.add.image(512, 384, 'background').setAlpha(0.5);

            // ---platforms---
            {
                //  The platforms group 
                this.platforms = this.physics.add.staticGroup();
                this.platformsPass = this.physics.add.staticGroup();
                //This code looks at the tile index and replaces platform tiles with resized static objects
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
        }
        
        // The player and its settings
        this.player = new Player(this, 100, 662);

        //emote (ignores gravity and is initially invisible) {
        this.emote = this.physics.add.sprite(this.player.sprite.x, this.player.sprite.y, "emote");
        this.emote.body.setAllowGravity(false);
        this.emote.setVisible(false);
        
        //explode object to play animation (since the explosion sprites aren't in the player sprite sheet, sizes are off)
        this.explode = this.physics.add.sprite(this.player.sprite.x, this.player.sprite.y, "explode");
        this.explode.body.setAllowGravity(false);
        this.explode.setVisible(false);

        //  Some boxes to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
        boxes = this.physics.add.group({
            key: 'box',
            repeat: 9,
            setXY: { x: 192, y: 120, stepX: 80 }
        });

        boxes.children.iterate(function (child) {

            //  Give each box a slightly different bounce
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
            child.setSize(24, 14).setOffset(0, 18) //resize to sprite size

        });

        bombs = this.physics.add.group();

        //  The score
        scoreText = this.add.text(16, 0, 'Score: 0', { fontSize: '32px', fill: '#000' }).setColor('white');

        // ---Collision---
        {
            //  Collide the player and the boxes with map tiles
            this.physics.add.collider(this.player.sprite, this.worldLayer, hitGround, null, this);
            this.physics.add.collider(this.player.sprite, this.platforms, hitGround, null, this);
            this.physics.add.collider(this.player.sprite, this.platformsPass, hitPlatPass, null, this);
            this.physics.add.collider(boxes, this.worldLayer);
            this.physics.add.collider(boxes, this.platforms);
            this.physics.add.collider(boxes, this.platformsPass);
            this.physics.add.collider(bombs, this.worldLayer);
            this.physics.add.collider(bombs, this.platforms);
            // this.physics.add.collider(bombs, this.platformsPass);

            //  Checks to see if the player overlaps with any of the boxes, if he does call the collectBox function
            this.physics.add.overlap(this.player.sprite, boxes, collectBox, null, this);
            this.physics.add.collider(this.player.sprite, bombs, hitBomb, null, this);
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
            this.explodeSound = this.sound.add('explodeSound', {volume: 0.015});
            this.pickUp = this.sound.add('pickUp', {volume: 0.025});

            this.firstLanding = true;
        }

        // dev skip
        // this.input.once('pointerdown', () => {
        //     this.gameOver = true;
        //     this.scene.start('GameOver');
        // });

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
            if(this.firstLanding) {this.firstLanding = false;}
            else {this.landing.play();}
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

function collectBox(player, box)
{
    box.disableBody(true, true);
    this.pickUp.play();

    //  Add and update the score
    score += 10;
    scoreText.setText('Score: ' + score);

    if (boxes.countActive(true) === 0)
    {
        //  A new batch of boxes to collect
        boxes.children.iterate(function (child) {

            child.enableBody(true, child.x, 120, true, true);

        });
        var x = (this.player.x < 512) ? Phaser.Math.Between(512, 832) : Phaser.Math.Between(192, 512);
        var bomb = bombs.create(x, 120, 'bomb');
        bomb.setSize(28,22).setOffset(0, 10); //resize to sprite size
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-160, 160), 20);
        bomb.allowGravity = false;
        this.emote.setVisible(true);
        this.emote.anims.play('exclaim', true);
        this.emote.on("animationcomplete", ()=>{ //listen to when an animation completes, then run
            this.emote.setVisible(false);
        });

    }
}

function hitBomb (player, bomb)
{
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
        this.scene.start('GameOver', {level: 1});
    });
    
}