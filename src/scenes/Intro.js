import { Scene } from 'phaser';

var player;
var emote;
var step = 0;
var runNoise;
var explode;
var explodeSound;
var boxes;

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

        this.bots = this.physics.add.staticGroup(); 
        // The player, its settings, and animations
        {
            this.bot3 = this.bots.create(208, 624, 'player').setSize(36, 39).setOffset(0, 8).setTint(0x808080); 
            player = this.physics.add.sprite(176, 624, 'player').setCollideWorldBounds(false).setSize(36, 39).setOffset(0, 8).setTint(0x808080);
            this.bot1 = this.bots.create(144, 624, 'player').setSize(36, 39).setOffset(0, 8).setTint(0x808080);  
            this.bot6 = this.bots.create(208, 464, 'player').setSize(36, 39).setOffset(0, 8).setTint(0x808080);
            this.bot5 = this.bots.create(176, 464, 'player').setSize(36, 39).setOffset(0, 8).setTint(0x808080);     
            this.bot4 = this.bots.create(144, 464, 'player').setSize(36, 39).setOffset(0, 8).setTint(0x808080);        

            this.anims.create({
                key: 'run',
                frames: this.anims.generateFrameNumbers('player', { start: 9, end: 13 }),
                frameRate: 8,
                repeat: -1
            });

            this.anims.create({
                key: 'idle',
                frames: this.anims.generateFrameNumbers('player', { start: 0, end: 2 }),
                frameRate: 5,
                repeat: -1
            });

            this.anims.create({
                key: 'still',
                frames: [ { key: 'player', frame: 0 } ],
                frameRate: 20
            });

            this.anims.create({
                key: 'sleep1',
                frames: [ { key: 'player', frame: 18} ],
                frameRate: 1
            });
            
            this.anims.create({
                key: 'sleep2',
                frames: [ { key: 'player', frame: 19} ],
                frameRate: 1
            });

            this.anims.create({
                key: 'jump',
                frames: [ { key: 'player', frame: 3 } ],
                frameRate: 20
            });

            this.anims.create({
                key: 'fall',
                frames: [ { key: 'player', frame: 4 } ],
                frameRate: 20
            });

            //start the player and other bots asleep
            player.anims.play('sleep2');

            this.bots.children.iterate(function (child) {

                child.anims.play('sleep2');
    
            });
        }

        //emote (ignores gravity and is initially invisible) {
        emote = this.physics.add.sprite(player.x, player.y, "emote");
        emote.body.setAllowGravity(false);
        emote.setVisible(false);
        
        //explode object to play animation (since the explosion sprites aren't in the player sprite sheet, sizes are off)
        explode = this.physics.add.sprite(656, 592, "explode");
        explode.body.setAllowGravity(false);
        explode.setVisible(false);

        //  Some boxes to collect
        boxes = this.physics.add.group();



        // ---Collision---
        {
            //  Collide the player and the boxes with map tiles
            this.physics.add.collider(player, this.worldLayer);
            this.physics.add.collider(player, this.platforms);
            this.physics.add.collider(player, this.platformsPass, hitPlatPass, null, this);
            this.physics.add.collider(boxes, this.worldLayer);
            this.physics.add.collider(boxes, this.platforms);
            this.physics.add.collider(boxes, this.platformsPass);

            //  Checks to see if the player overlaps with any of the boxes, if they do call the collectBox function
            this.physics.add.overlap(player, boxes, collectBox, null, this);
        }
        // ---Camera---
        {
        this.cameras.main.setSize(1024, 768);
        this.cameras.main.setBounds(0, 0, 800, 600);
        this.cameras.main.startFollow(player, false, 1, 1, 0, 0);
        }

        // ---Sound---
        {
            // this.gameMusic = this.sound.add("gameMusic");
            // this.gameMusic.play({loop: true, volume: 0.05});
            
            this.landing = this.sound.add('landing', {volume: 0.05});
            runNoise = this.sound.add('step', {volume: 0.04});
            this.jump = this.sound.add('jump', {volume: 0.015});
            explodeSound = this.sound.add('explodeSound', {volume: 0.015});
            this.pickUp = this.sound.add('pickUp', {volume: 0.025});

            this.firstLanding = true;
        }

        //for some reason, needs that x line or else onComplete fires immediately.
        //All it does is move the sprite to the sprite's current position, so does nothing.

        //This tween chain handles timing on cutscene events, played by playStep().
        //player speed is 170
        const chain = this.tweens.chain({
            targets: player,
            tweens: [
                { //1, 2 - explode & wakeup, standup
                    x: player.x,
                    onRepeat: this.playStep,
                    duration: 1500,
                    repeat: 2
                },
                { //3, 4, 5 - look left, right, start run anim
                    x: player.x,
                    onRepeat: this.playStep,
                    onComplete: this.playStep,
                    duration: 500,
                    repeat: 2
                },
                {//6 - move player near boxes then exclaim & idle in place
                    x: 576,
                    onUpdate: this.makeRunNoise,
                    onComplete: this.playStep,
                    duration: 2353
                },
                {//7 - waits for exclaim anim to finish, onComplete starts run anim
                    x: 576,
                    onComplete: this.playStep,
                    duration: 800
                },
                {//8 - move player to box and stop
                    x: 656,
                    onUpdate: this.makeRunNoise,
                    onComplete: this.playStep,
                    duration: 471
                },
                {//9 - wait a bit after picking up box, onComplete starts run anim
                    x: 656,
                    onComplete: this.playStep,
                    duration: 300
                },
                {//10 - move to next box
                    x: 752,
                    onUpdate: this.makeRunNoise,
                    onComplete: this.playStep,
                    duration: 565
                },
                {//11 - wait a bit after picking up box, onComplete starts run anim
                    x: 752,
                    onComplete: this.playStep,
                    duration: 300
                },
                {//12 - run off screen, start sceen
                    x: 1088,
                    onUpdate: this.makeRunNoise,
                    onComplete: this.playStep,
                    duration: 1976
                }
            ]
        });

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

    playStep() {
        step += 1;
        switch(step) {
            case 1: //explode & wakeup
                makeExplosion(); //makes explosion and spawn boxes
                player.clearTint();
                player.anims.play('sleep1');
                emote.setVisible(true);
                emote.anims.play('question');
                emote.on("animationcomplete", ()=>{ //listen to when an animation completes, then run
                    emote.setVisible(false);
                });
                break;
            case 2: //standup
                player.setDepth(100); //brings to front
                player.anims.play('still');
                break;
            case 3: //look left
                player.setFlipX(true);
                break;
            case 4: //look right
                player.setFlipX(false);
                break;
            case 5: //start run anim
                player.anims.play('run');
                break;
            case 6: //move player near boxes then exclaim & idle in place
                player.anims.play('idle');
                emote.setVisible(true);
                emote.anims.play('exclaim');
                emote.on("animationcomplete", ()=>{ //listen to when an animation completes, then run
                    emote.setVisible(false);
                });
                break;
            case 7: //after waiting for exclaim anim to finish, start run anim
                player.anims.play('run');
                break;
            case 8: //move player to box and stop
                player.anims.play('idle');
                break;
            case 9: //after waiting a bit when picking up box, start run anim
                player.anims.play('run');
                break;
            case 10: //move player to box and stop
                player.anims.play('idle');
                break;
            case 11: //after waiting a bit when picking up box, start run anim
                player.anims.play('run');
                break;
            case 12:
                startTutorial();
                break;
            default:
                break;
        }
        
    }

    makeRunNoise() {
        if(!runNoise.isPlaying && player.body.blocked.down) {
            runNoise.play();
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
    //         emote.setVisible(true);
    //         emote.anims.play('ellipsis', true);
    //         emote.on("animationcomplete", ()=>{ //listen to when an animation completes, then run
    //             emote.setVisible(false);
    //             this.sleepEmoteTimer.reset({ delay: 4000, callback: this.onSleepEmote, callbackScope: this});
    //             this.time.addEvent(this.sleepEmoteTimer);
    //         });
    //     }
    // }
    

    update ()
    {
        // emote sprite follows player
        emote.setX(player.x);
        emote.setY(player.y - 40);
        //same for explosion object
        // explode.setX(player.x);
        // explode.setY(player.y);

    }
    
}

//explode the pipe and spawn boxes
function makeExplosion() {
    explodeSound.play();
    explode.setVisible(true);
    explode.anims.play("playerExplode")
    explode.on("animationcomplete", ()=>{ //listen to when an animation completes, then run
        explode.setVisible(false);
    });
    var box1 = boxes.create(656, 592, 'box');
    var box2 = boxes.create(656, 592, 'box');
    box2.setVelocity(100, -100).setDragX(50);

    boxes.children.iterate(function (child) {

        //  Give each box a slightly different bounce
        child.setBounceY(0.6);
        child.setSize(24, 14).setOffset(0, 18) //resize to sprite size

    });
}

//function doesn't have context of the scene, using scene from global player
function startTutorial() {
    player.scene.scene.start('Tutorial');
}

function hitPlatPass(player, platform) {
    if (player.sprite.body.blocked.down){
        if (player.inAir) {
            player.inAir = false;
            this.landing.play();
        }
    }
    player.isOnPlatformPass = true;
    player.onPlatform = platform; //pass platform object to Player
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