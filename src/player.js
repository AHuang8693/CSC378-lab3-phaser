
export default class Player {
    constructor(scene, x, y) {
        this.scene = scene;

        //  Our player animations, still, walking, jumping, and idle
        const anims = scene.anims;
        anims.create({
            key: 'run',
            frames: anims.generateFrameNumbers('player', { start: 9, end: 13 }),
            frameRate: 8,
            repeat: -1
        });

        anims.create({
            key: 'still',
            frames: [ { key: 'player', frame: 0 } ],
            frameRate: 20
        });

        anims.create({
            key: 'idle',
            frames: anims.generateFrameNumbers('player', { start: 0, end: 2 }),
            frameRate: 5,
            repeat: -1
        });

        anims.create({
            key: 'sleep1',
            frames: [ { key: 'player', frame: 18} ],
            frameRate: 1
        });
        
        anims.create({
            key: 'sleep2',
            frames: [ { key: 'player', frame: 19} ],
            frameRate: 1
        });

        anims.create({
            key: 'jump',
            frames: [ { key: 'player', frame: 3 } ],
            frameRate: 20
        });

        anims.create({
            key: 'fall',
            frames: [ { key: 'player', frame: 4 } ],
            frameRate: 20
        });

        anims.create({
            key: 'fallFast',
            frames: [ { key: 'player', frame: 5 } ],
            frameRate: 20
        });

        anims.create({
            key: 'impact',
            frames: anims.generateFrameNumbers('player', { start: 6, end: 7 }),
            frameRate: 4
        });

        //create and add player sprite
        this.sprite = scene.physics.add.sprite(x, y, 'player').setCollideWorldBounds(true).setSize(36, 39).setOffset(0, 8);

        this.cursors = scene.input.keyboard.createCursorKeys();

        this.onPlatform; //stores platform object. See "platformPass code"
        this.isOnPlatformPass = false;
    }

    create(){
        var isAsleep = false;
        var playerIdle = false;
    }

    //Note: Sound and Timer related functions are loaded from the scene
    update() {
        const cursors = this.cursors;
        const sprite = this.sprite;

        if (cursors.left.isDown)
            {
                this.scene.resetIdle();   //resets Idle timer
                sprite.setFlipX(true);
                sprite.setVelocityX(-170);
                sprite.anims.play('run', true);
                if(!this.scene.step.isPlaying && sprite.body.blocked.down) {
                    this.scene.step.play();
                }
            }
            else if (cursors.right.isDown)
            {
                this.scene.resetIdle();
                sprite.setFlipX(false);
                sprite.setVelocityX(170);
                sprite.anims.play('run', true);
                if(!this.scene.step.isPlaying && sprite.body.blocked.down) {
                    this.scene.step.play();
                }
            }
            else //no key presses, look above in `Timer Functions` for idle logic
            {
                sprite.setVelocityX(0);
                if (this.playerIdle) {
                    if(!this.isAsleep) {
                        sprite.anims.play('sleep1');
                    }
                    else if(this.isAsleep) {
                        sprite.anims.play('sleep2');
                    }
                }
                else {
                    this.isAsleep = false;
                    sprite.anims.play('idle', true)
                }
            }

            //jump code
            if (cursors.up.isDown && sprite.body.blocked.down) {
                this.scene.resetIdle();
                sprite.setVelocityY(-330);
                if(!this.scene.jump.isPlaying) {
                    this.scene.jump.play();
                }
                //if player touches a passable platform and jumps, all platforms will have collision restored
                //uses platformPass staticGroup from this.scene. This fixes issue with dropping from one passable plat to another, but restoring incorrect platform's collision
                if (this.isOnPlatformPass) {
                    this.isOnPlatformPass = false;
                    this.onPlatform = null;
                    this.scene.platformsPass.children.iterate(function (child) {
                        child.body.checkCollision.up = true;
                    })
                }
            }

            //down, platformPass code
            if (this.cursors.down.isDown && this.isOnPlatformPass) {
                this.scene.resetIdle();
                this.onPlatform.body.checkCollision.up = false;
            }
            
            //fall code
            if (!sprite.body.blocked.down) {
                this.inAir = true;
                if (sprite.body.velocity.y < 0) { //up is negative y
                    sprite.anims.play('jump');
                }
                else if (330 >= sprite.body.velocity.y > 0) {
                    sprite.anims.play('fall');
                }
                else if (sprite.body.velocity.y > 330) {
                    sprite.anims.play('fallFast');
                }
            }

    }

}