import { Scene } from 'phaser';

var player;
var emote;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;

var fastFall = 0;

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

        
    create ()
    {
        this.cameras.main.setBackgroundColor(0x00ff00);

        this.add.image(512, 384, 'background').setAlpha(0.5);

        // this.add.text(512, 384, 'Make something fun!\nand share it with us:\nsupport@phaser.io', {
        //     fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
        //     stroke: '#000000', strokeThickness: 8,
        //     align: 'center'
        // }).setOrigin(0.5);

        // ---platforms---
        {
        //  The platforms group contains the ground and the 2 ledges we can jump on
        var platforms = this.physics.add.staticGroup();

        //  Here we create the ground.
        //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
        platforms.create(400, 568, 'ground').setScale(2).refreshBody();

        //  Now let's create some ledges
        platforms.create(600, 400, 'ground');
        platforms.create(50, 250, 'ground');
        platforms.create(750, 220, 'ground');
        }
        // The player and its settings
        player = this.physics.add.sprite(100, 450, 'player');

        //  Player physics properties. Give the little guy a slight bounce.
        player.setBounce(0.15);
        player.setCollideWorldBounds(true);

        //  Input Events
        cursors = this.input.keyboard.createCursorKeys();

        //emote (ignores gravity and is initially invisible) {
        emote = this.physics.add.sprite(player.x, player.y, "emote");
        emote.body.setAllowGravity(false);
        emote.setVisible(false);
        

        //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
        stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 }
        });

        stars.children.iterate(function (child) {

            //  Give each star a slightly different bounce
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

        });

        bombs = this.physics.add.group();

        //  The score
        scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

        // ---Collision---
        {
            //  Collide the player and the stars with the platforms
            this.physics.add.collider(player, platforms, hitGround, null, this);
            this.physics.add.collider(stars, platforms);
            this.physics.add.collider(bombs, platforms);

            //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
            this.physics.add.overlap(player, stars, collectStar, null, this);

            this.physics.add.collider(player, bombs, hitBomb, null, this);
        }
        // ---Camera---
        {
        this.cameras.main.setSize(1024, 768);
        this.cameras.main.setBounds(0, 0, 800, 600);
        this.cameras.main.startFollow(player, false, 1, 1, 0, 0);
        }

        this.input.once('pointerdown', () => {

            this.scene.start('GameOver');

        });
    }

    update ()
    {
        if (gameOver)
        {
            return;
        }

        if (cursors.left.isDown)
        {
            player.setFlipX(true);
            player.setVelocityX(-160);
            player.anims.play('run', true);
        }
        else if (cursors.right.isDown)
        {
            player.setFlipX(false);
            player.setVelocityX(160);
            player.anims.play('run', true);
        }
        else // no key press
        {
            player.setVelocityX(0);
            player.anims.play('idle', true);
        }

        if (!player.body.touching.down) {
            if (player.body.velocity.y < 0) { //up is negative y
                player.anims.play('jump');
            }
            else if (275 >= player.body.velocity.y > 0) {
                player.anims.play('fall');
            }
            else if (player.body.velocity.y > 275) {
                fastFall = 1;
                player.anims.play('fallFast');
            }
        }

        if (cursors.up.isDown && player.body.touching.down)
        {
            player.setVelocityY(-330);
        }
        
        // emote sprite follows player
        emote.setX(player.x);
        emote.setY(player.y - 40);
    }

}

//currently doesn't overide other animations, so never visible to player
function hitGround (player, platforms) {
    if (fastFall == 1) {
        fastFall = 0;
        emote.setVisible(true);
        emote.anims.play('exclaim');
        emote.on("animationcomplete", ()=>{ //listen to when an animation completes, then run
        emote.setVisible(false);
        });
    }
}

function collectStar (player, star)
{
    star.disableBody(true, true);

    //  Add and update the score
    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0)
    {
        //  A new batch of stars to collect
        stars.children.iterate(function (child) {

            child.enableBody(true, child.x, 0, true, true);

        });

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;

    }
}

function hitBomb (player, bomb)
{
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play('turn');

    gameOver = true;
}