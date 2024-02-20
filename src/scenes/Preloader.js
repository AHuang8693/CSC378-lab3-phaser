import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'facBackground');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        this.load.image('tiles', 'IndustrialTiles.png');
        this.load.tilemapTiledJSON('map', "PackerMap.json");

        this.load.image('ground', 'platform.png');
        this.load.image('star', 'star.png');
        this.load.spritesheet('player', 'Greenbot_sprites.png', {frameWidth:48, frameHeight: 48});
        this.load.spritesheet('emote', 'emote_sprites.png', {frameWidth:32, frameHeight:32});
        this.load.spritesheet('explode', 'explode_sprites.png', {frameWidth:55, frameHeight:52});

        this.load.setPath('assets/industrial-zone/1 Tiles'); //Industrial Zone assets
        this.load.image('plat1', "IndustrialTile_77.png");
        this.load.image('plat2', "IndustrialTile_78.png");
        this.load.image('plat3', "IndustrialTile_79.png");

        this.load.setPath('assets/industrial-zone/3 Objects');
        this.load.image('box', 'Box4.png');
        this.load.image('bomb', 'Box8.png')

        this.load.setPath('assets/SFX');
        this.load.audio("landing", 'landing.ogg');
        this.load.audio("step", "step.mp3");
        this.load.audio("jump", "Jump.wav");
        this.load.audio("explodeSound", "Explosion2.wav");
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Our player animations, still, walking, jumping, and idle
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('player', { start: 9, end: 13 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'still',
            frames: [ { key: 'player', frame: 0 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 2 }),
            frameRate: 5,
            repeat: -1
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

        this.anims.create({
            key: 'fallFast',
            frames: [ { key: 'player', frame: 5 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'impact',
            frames: this.anims.generateFrameNumbers('player', { start: 6, end: 7 }),
            frameRate: 4
        });

        // explode animation
        this.anims.create({
            key: 'playerExplode',
            frames: this.anims.generateFrameNumbers('explode', { start: 0, end: 5 }),
            frameRate: 10
        });

        // emote animations
        this.anims.create({
            key: 'ellipsis',
            frames: this.anims.generateFrameNumbers('emote', { start: 8, end: 15 }),
            frameRate: 5
        });

        this.anims.create({
            key: 'exclaim',
            frames: this.anims.generateFrameNumbers('emote', { start: 16, end: 23 }),
            frameRate: 10
        });

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
