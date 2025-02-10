
// lib/game/menus.js
ig.baked = true;
ig.module('game.menus').requires('impact.font').defines(function() {
    MenuItem = ig.Class.extend({
        getText: function() {
            return 'none'
        },
        left: function() {},
        right: function() {},
        ok: function() {},
        click: function() {
            this.ok();
            ig.system.canvas.style.cursor = 'auto';
        }
    });
    Menu = ig.Class.extend({
        clearColor: null,
        name: null,
        font: new ig.Font('media/fonts/tungsten-18.png'),
        fontSelected: new ig.Font('media/fonts/tungsten-18-orange.png'),
        fontTitle: new ig.Font('media/fonts/tungsten-48.png'),
        current: 0,
        itemClasses: [],
        items: [],
        init: function() {
            this.y = ig.system.height / 4 + 160;
            for (var i = 0; i < this.itemClasses.length; i++) {
                this.items.push(new this.itemClasses[i]());
            }
        },
        update: function() {
            if (ig.input.pressed('up')) {
                this.current--;
            }
            if (ig.input.pressed('down')) {
                this.current++;
            }
            this.current = this.current.limit(0, this.items.length - 1);
            if (ig.input.pressed('left')) {
                this.items[this.current].left();
            }
            if (ig.input.pressed('right')) {
                this.items[this.current].right();
            }
            if (ig.input.pressed('ok')) {
                this.items[this.current].ok();
            }
            var ys = this.y;
            var xs = ig.system.width / 2;
            var hoverItem = null;
            for (var i = 0; i < this.items.length; i++) {
                var item = this.items[i];
                var w = this.font.widthForString(item.getText()) / 2;
                if (ig.input.mouse.x > xs - w && ig.input.mouse.x < xs + w && ig.input.mouse.y > ys && ig.input.mouse.y < ys + 24) {
                    hoverItem = item;
                    this.current = i;
                }
                ys += 30;
            }
            if (hoverItem) {
                ig.system.canvas.style.cursor = 'pointer';
                if (ig.input.pressed('click')) {
                    hoverItem.click();
                }
            } else {
                ig.system.canvas.style.cursor = 'auto';
            }
        },
        draw: function() {
            if (this.clearColor) {
                ig.system.context.fillStyle = this.clearColor;
                ig.system.context.fillRect(0, 0, ig.system.width, ig.system.height);
            }
            var xs = ig.system.width / 2;
            var ys = this.y;
            if (this.name) {
                this.fontTitle.draw(this.name, xs, ys - 160, ig.Font.ALIGN.CENTER);
            }
            for (var i = 0; i < this.items.length; i++) {
                var t = this.items[i].getText();
                if (i == this.current) {
                    this.fontSelected.draw(t, xs, ys, ig.Font.ALIGN.CENTER);
                } else {
                    this.font.draw(t, xs, ys, ig.Font.ALIGN.CENTER);
                }
                ys += 30;
            }
        }
    });
    MenuItemSoundVolume = MenuItem.extend({
        getText: function() {
            return String.fromCharCode(131) + ' < ' + (ig.soundManager.volume * 100).round() + '% >';
        },
        left: function() {
            ig.soundManager.volume = (ig.soundManager.volume - 0.1).limit(0, 1);
        },
        right: function() {
            ig.soundManager.volume = (ig.soundManager.volume + 0.1).limit(0, 1);
        },
        click: function() {
            if (ig.input.mouse.x > 220) {
                this.right();
            } else {
                this.left();
            }
        }
    });
    MenuItemMusicVolume = MenuItem.extend({
        getText: function() {
            return String.fromCharCode(132) + ' < ' + (ig.music.volume * 100).round() + '% >';
        },
        left: function() {
            ig.music.volume = (ig.music.volume - 0.1).limit(0, 1);
        },
        right: function() {
            ig.music.volume = (ig.music.volume + 0.1).limit(0, 1);
        },
        click: function() {
            if (ig.input.mouse.x > 220) {
                this.right();
            } else {
                this.left();
            }
        }
    });
    MenuItemResume = MenuItem.extend({
        getText: function() {
            return String.fromCharCode(133);
        },
        ok: function() {
            ig.game.toggleMenu();
        }
    });
    PauseMenu = Menu.extend({
        name: String.fromCharCode(141),
        clearColor: 'rgba(0,0,0,0.9)',
        itemClasses: [MenuItemSoundVolume, MenuItemMusicVolume, MenuItemResume]
    });
    MenuItemNormalMode = MenuItem.extend({
        getText: function() {
            return String.fromCharCode(128);
        },
        ok: function() {
            ig.game.difficulty = 'NORMAL';
            ig.game.setGame();
        }
    });
    MenuItemExpertMode = MenuItem.extend({
        getText: function() {
            return String.fromCharCode(129);
        },
        ok: function() {
            ig.game.difficulty = 'EXPERT';
            ig.game.setGame();
        }
    });
    MenuItemSoundMenu = MenuItem.extend({
        getText: function() {
            return String.fromCharCode(130);
        },
        ok: function() {
            ig.game.toggleMenu();
        }
    });
    TitleMenu = Menu.extend({
        itemClasses: [MenuItemNormalMode, MenuItemExpertMode, MenuItemSoundMenu]
    });
    MenuItemBack = MenuItem.extend({
        getText: function() {
            return String.fromCharCode(140);
        },
        ok: function() {
            ig.game.setTitle();
        }
    });
    GameOverMenu = Menu.extend({
        init: function() {
            this.parent();
            this.y = ig.system.height / 4 + 240;
        },
        itemClasses: [MenuItemBack]
    });
});