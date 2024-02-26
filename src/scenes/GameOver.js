import { Scene } from 'phaser';

var toolTip; 
var toolTipText;
var objectWithToolTip;

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }
    init (data) {
        this.level = data.level;
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0xff0000);

        this.add.image(512, 384, 'background').setAlpha(0.5);

        this.add.text(512, 384, 'Game Over', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        var subText = this.add.text(512, 480, 'Press Space to Restart', {
            fontFamily: 'Arial Black', fontSize: 30, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        var credits = this.add.text(70, 740, 'Credits', {
            fontFamily: 'Arial Black', fontSize: 30, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);

        //---Credits Tooltip---
        {
            objectWithToolTip = this.add.rectangle(70, 740, 150, 60, 0xffffff).setInteractive();
            objectWithToolTip.fillAlpha = 0;

            toolTip =  this.add.rectangle( 0, 0, 835, 120, 0xffffff).setOrigin(0);
            toolTipText = this.add.text( 0, 0, 'Packerman by Andy Huang\nMade with Phaser3\nopengameart.org - Green Robot, Animated Emote Bubbles, Platformer Sounds (landing.ogg),\n    8-Bit Platformer SFX, Warped City (Explosion Sprites), 8-Bit Sound Effects Library\nCraftPix.net - Free Industiral Zone Tileset', { fontFamily: 'Arial', fontSize: 20, color: '#000' }).setOrigin(0);
            toolTip.alpha = 0;
            toolTipText.alpha = 0;
        
            this.input.setPollOnMove();
            this.input.on('gameobjectover', function (pointer, gameObject) {
                this.tweens.add({
                    targets: [toolTip, toolTipText],
                    alpha: {from:0, to:1},
                    repeat: 0,
                    duration: 500
                });
            }, this);

            this.input.on('gameobjectout', function (pointer, gameObject) {
                toolTip.alpha = 0;
                toolTipText.alpha = 0;
            });
            
            objectWithToolTip.on('pointermove', function (pointer) {
                toolTip.x = pointer.x + 2;
                toolTip.y = pointer.y - 120;
                toolTipText.x = pointer.x + 7;
                toolTipText.y = pointer.y - 115;
            });
        }
        var spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        spaceBar.on('down', () => {
            if(this.level==0) {
                this.scene.start("Tutorial");
            }
            else if(this.level==1) {
                this.gameOver = false;
                this.scene.start('Game');
            }

        });
    }
}
