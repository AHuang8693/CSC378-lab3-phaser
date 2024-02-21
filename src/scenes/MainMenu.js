import { Scene } from 'phaser';

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

        this.player = this.physics.add.sprite(512, 300, 'player').setVisible(false);
        this.player.body.setAllowGravity(false);

        this.cameras.main.setBackgroundColor('black');  
        this.cameras.main.setBounds(0, 0, 1024, 1944);
        this.cameras.main.startFollow(this.player, false, 1, 1, 0, 0);

        // var zoneStart = this.add.zone(512, 2200, 1024, 1);
        // this.physics.overlap(player, zoneStart);

        var zoneStart = this.physics.add.sprite(512, 1900, 'star').setVisible(false).setSize(1024, 1);
        zoneStart.body.setAllowGravity(false);
        this.physics.add.collider(this.player, zoneStart, this.startGame, null, this);

        var skipFlag = false;
        this.input.keyboard.on('keydown', () => {
            titleTxt.setVisible(false);
            subText.setVisible(false);
            this.player.body.setAllowGravity(true);

            //skip animation with second key press
            if(skipFlag) {
                this.scene.start('Game');
            }
            skipFlag = true;

        });
    }
    startGame() {
        console.log('test');
        this.scene.start('Game');
    }    
}
