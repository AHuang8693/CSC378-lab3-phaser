import { Scene } from 'phaser';

// var titleText;
// var subText;
var player;
var zoneStart; 

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.add.image(512, 970, 'facBackground').setScale(2);

        // this.add.image(512, 300, 'logo');
        var titleTxt = this.add.text(512, 300, 'PACKERMAN', {
            fontFamily: 'Impact', fontSize: 70, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        var subText = this.add.text(512, 460, 'Press Any Key to Start', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        player = this.physics.add.sprite(512, 300, 'player').setVisible(false);
        player.body.setAllowGravity(false);

        this.cameras.main.setBackgroundColor('black');  
        this.cameras.main.setBounds(0, 0, 1024, 1944);
        this.cameras.main.startFollow(player, false, 1, 1, 0, 0);

        // var zoneStart = this.add.zone(512, 2200, 1024, 1);
        // this.physics.overlap(player, zoneStart);

        zoneStart = this.physics.add.sprite(512, 1900, 'star').setVisible(false).setSize(1024, 1);
        zoneStart.body.setAllowGravity(false);
        this.physics.add.collider(player, zoneStart, this.startGame, null, this);

        this.input.keyboard.on('keydown', () => {

            titleTxt.setVisible(false);
            subText.setVisible(false);
            player.body.setAllowGravity(true);

            //for testing, skip animation -----
            this.scene.start('Game');

        });
    }
    startGame() {
        console.log('test');
        this.scene.start('Game');
    }    
}
