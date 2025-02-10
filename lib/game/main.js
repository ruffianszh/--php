
// lib/game/main.js
ig.baked = true;
ig.module('game.main').requires('impact.game', 'impact.font', 'game.menus', 'game.entities.enemy-missle', 'game.entities.enemy-mine', 'game.entities.enemy-destroyer', 'game.entities.enemy-oppressor', 'game.entities.player', 'plugins.impact-splash-loader').defines(function() {
    Number.zeroes = '000000000000';
    Number.prototype.zeroFill = function(d) {
        var s = this.toString();
        return Number.zeroes.substr(0, d - s.length) + s;
    };
    ZType = ig.Game.extend({
        font: new ig.Font('media/fonts/tungsten-18.png'),
        fontScore: new ig.Font('media/fonts/04b03-mono-digits.png'),
        fontTitle: new ig.Font('media/fonts/tungsten-48.png'),
        fontSelected: new ig.Font('media/fonts/tungsten-18-orange.png'),
        spawnTimer: null,
        targets: {},
        currentTarget: null,
        yScroll: 0,
        backdrop: new ig.Image('media/background/backdrop.png'),
        grid: new ig.Image('media/background/grid.png'),
        music: new ig.Sound('media/music/endure.ogg', false),
        menu: null,
        mode: 0,
        score: 0,
        streak: 0,
        hits: 0,
        misses: 0,
        multiplier: 1,
        wave: {},
        gameTime: 0,
        kills: 0,
        difficulty: 'NORMAL',
        init: function() {
            var bgmap = new ig.BackgroundMap(62, [
                [1]
            ], this.grid);
            bgmap.repeat = true;
            this.backgroundMaps.push(bgmap);
            ig.music.add(this.music);
            window.addEventListener('keydown', this.keydown.bind(this), false);
            ig.input.bind(ig.KEY.ENTER, 'ok');
            ig.input.bind(ig.KEY.SPACE, 'ok');
            ig.input.bind(ig.KEY.MOUSE1, 'click');
            ig.input.bind(ig.KEY.BACKSPACE, 'void');
            ig.input.bind(ig.KEY.ESC, 'menu');
            ig.input.bind(ig.KEY.UP_ARROW, 'up');
            ig.input.bind(ig.KEY.DOWN_ARROW, 'down');
            ig.input.bind(ig.KEY.LEFT_ARROW, 'left');
            ig.input.bind(ig.KEY.RIGHT_ARROW, 'right');
            this.setTitle();
            window.focus();
            ig.system.canvas.onclick = function() {
                window.focus();
            };
        },
        reset: function() {
            this.entities = [];
            this.currentTarget = null;
            this.wave = ig.copy(ZType.WAVES[this.difficulty]);
            var first = 'a'.charCodeAt(0),
                last = 'z'.charCodeAt(0);
            for (var i = first; i <= last; i++) {
                this.targets[String.fromCharCode(i)] = [];
            }
            this.score = 0;
            this.rs = 0;
            this.streak = 0;
            this.hits = 0;
            this.misses = 0;
            this.kills = 0;
            this.multiplier = 1;
            this.gameTime = 0;
            this.lastKillTimer = new ig.Timer();
            this.spawnTimer = new ig.Timer();
            this.waveEndTimer = null;
        },
        nextWave: function() {
            this.wave.wave++;
            this.wave.spawnWait = (this.wave.spawnWait * 0.97).limit(0.2, 1);
            this.wave.spawn = [];
            var dec = 0;
            for (var t = 0; t < this.wave.types.length; t++) {
                var type = this.wave.types[t];
                type.count -= dec;
                if (this.wave.wave % type.incEvery == 0) {
                    type.count++;
                    dec++;
                }
                for (var s = 0; s < type.count; s++) {
                    this.wave.spawn.push(t);
                }
            }
            this.wave.spawn.sort(function() {
                return Math.random() - 0.5;
            });
        },
        spawnCurrentWave: function() {
            if (!this.wave.spawn.length) {
                if (this.entities.length <= 1 && !this.waveEndTimer) {
                    this.waveEndTimer = new ig.Timer(2);
                } else if (this.waveEndTimer && this.waveEndTimer.delta() > 0) {
                    this.waveEndTimer = null;
                    this.nextWave();
                }
            } else if (this.spawnTimer.delta() > this.wave.spawnWait) {
                this.spawnTimer.reset();
                var type = this.wave.types[this.wave.spawn.pop()].type;
                var x = Math.random().map(0, 1, 10, ig.system.width - 10);
                var y = -30;
                this.spawnEntity(type, x, y, {
                    healthBoost: this.wave.healthBoost
                });
            }
        },
        registerTarget: function(letter, ent) {
            this.targets[letter].push(ent);
        },
        unregisterTarget: function(letter, ent) {
            this.targets[letter].erase(ent);
        },
        keydown: function(event) {
            if (event.target.type == 'text' || event.ctrlKey || event.shiftKey || event.altKey || this.mode != ZType.MODE.GAME || this.menu) {
                return true;
            }
            var c = event.which;
            if (!((c > 64 && c < 91) || (c > 96 && c < 123))) {
                return true;
            }
            event.stopPropagation();
            event.preventDefault();
            var letter = String.fromCharCode(c).toLowerCase();
            if (!this.currentTarget) {
                var potentialTargets = this.targets[letter];
                var nearestDistance = -1;
                var nearestTarget = null;
                for (var i = 0; i < potentialTargets.length; i++) {
                    var distance = this.player.distanceTo(potentialTargets[i]);
                    if (distance < nearestDistance || !nearestTarget) {
                        nearestDistance = distance;
                        nearestTarget = potentialTargets[i];
                    }
                }
                if (nearestTarget) {
                    nearestTarget.target();
                } else {
                    this.player.miss();
                    this.multiplier = 1;
                    this.streak = 0;
                    this.misses++;
                }
            }
            if (this.currentTarget) {
                var c = this.currentTarget;
                var hit = this.currentTarget.isHitBy(letter);
                if (hit) {
                    this.player.shoot(c);
                    this.score += this.multiplier;
                    this.hits++;
                    this.streak++;
                    if (ZType.MULTIPLIER_TIERS[this.streak]) {
                        this.multiplier += 1;
                    }
                    if (c.dead) {
                        this.kills++;
                    }
                } else {
                    this.player.miss();
                    this.multiplier = 1;
                    this.streak = 0;
                    this.misses++;
                }
            }
            return false;
        },
        setGame: function() {
            this.reset();
            this.menu = null;
            this.player = this.spawnEntity(EntityPlayer, ig.system.width / 2, ig.system.height - 50);
            this.mode = ZType.MODE.GAME;
            this.nextWave();
            ig.music.play();
        },
        setGameOver: function() {
            this.mode = ZType.MODE.GAME_OVER;
            this.menu = new GameOverMenu();
        },
        setTitle: function() {
            this.reset();
            this.mode = ZType.MODE.TITLE;
            this.menu = new TitleMenu();
        },
        toggleMenu: function() {
            if (this.mode == ZType.MODE.TITLE) {
                if (this.menu instanceof TitleMenu) {
                    this.menu = new PauseMenu();
                } else {
                    this.menu = new TitleMenu();
                }
            } else {
                if (this.menu) {
                    this.menu = null;
                } else {
                    this.menu = new PauseMenu();
                }
            }
        },
        update: function() {
            if (ig.input.pressed('menu') && !this.menu) {
                this.toggleMenu();
            }
            if (this.menu) {
                this.backgroundMaps[0].scroll.y -= 100 * ig.system.tick;
                this.menu.update();
                if (!(this.menu instanceof GameOverMenu)) {
                    return;
                }
            }
            this.parent();
            if (this.mode == ZType.MODE.GAME) {
                this.spawnCurrentWave();
            } else if (ig.input.pressed('ok')) {
                if (this.mode == ZType.MODE.TITLE) {
                    this.setGame();
                } else {
                    this.setTitle();
                }
            }
            this.yScroll -= 100 * ig.system.tick;
            this.backgroundMaps[0].scroll.y = this.yScroll;
            if (this.entities.length > 1 && this.mode == ZType.MODE.GAME) {
                this.gameTime += ig.system.tick;
            }
            if (this.score - this.rs > 100 || ig.Timer.timeScale != 1) {
                this.score = 0;
            }
            this.rs = this.score;
        },
        draw: function() {
            this.backdrop.draw(0, 0);
            var d = this.lastKillTimer.delta();
            ig.system.context.globalAlpha = d < 0 ? d * -2 + 0.3 : 0.3;
            for (var i = 0; i < this.backgroundMaps.length; i++) {
                this.backgroundMaps[i].draw();
            }
            ig.system.context.globalAlpha = 1;
            for (var i = 0; i < this.entities.length; i++) {
                this.entities[i].draw();
            }
            for (var i = 0; i < this.entities.length; i++) {
                this.entities[i].drawLabel && this.entities[i].drawLabel();
            }
            if (this.mode == ZType.MODE.GAME) {
                this.drawUI();
            } else if (this.mode == ZType.MODE.TITLE) {
                this.drawTitle();
            } else if (this.mode == ZType.MODE.GAME_OVER) {
                this.drawGameOver();
            }
            if (this.menu) {
                this.menu.draw();
            }
        },
        drawUI: function() {
            var s = '(' + this.multiplier + 'x) ' + this.score.zeroFill(6);
            this.fontScore.draw(s, ig.system.width - 4, ig.system.height - 12, ig.Font.ALIGN.RIGHT);
            if (this.waveEndTimer) {
                var d = -this.waveEndTimer.delta();
                var a = d > 1.7 ? d.map(2, 1.7, 0, 1) : d < 1 ? d.map(1, 0, 1, 0) : 1;
                var xs = ig.system.width / 2;
                var ys = ig.system.height / 3 + (d < 1 ? Math.cos(1 - d).map(1, 0, 0, 250) : 0);
                var w = this.wave.wave.zeroFill(3);
                ig.system.context.globalAlpha = a;
                this.fontTitle.draw(String.fromCharCode(134) + ' ' + w + ' ' + String.fromCharCode(135), xs, ys, ig.Font.ALIGN.CENTER);
                ig.system.context.globalAlpha = 1;
            }
        },
        drawTitle: function() {
            var xs = ig.system.width / 2;
            var ys = ig.system.height / 4;
            this.fontTitle.draw(String.fromCharCode(142), xs, ys, ig.Font.ALIGN.CENTER);
            ig.system.context.globalAlpha = 0.8;
            this.font.draw(String.fromCharCode(127), xs, ys + 90, ig.Font.ALIGN.CENTER);
            ig.system.context.globalAlpha = 1;
            var xc = 8;
            var yc = ig.system.height - 40;
            ig.system.context.globalAlpha = 0.6;
            this.font.draw('Concept, Graphics & Programming: Dominic Szablewski', xc, yc);
            this.font.draw('Music: Andreas Loesch', xc, yc + 20);
            ig.system.context.globalAlpha = 1;
        },
        drawGameOver: function() {
            var xs = ig.system.width / 2;
            var ys = ig.system.height / 4;
            var acc = this.hits ? this.hits / (this.hits + this.misses) * 100 : 0;
            var wpm = this.kills / (this.gameTime / 60);
            this.fontTitle.draw(String.fromCharCode(136), xs, ys, ig.Font.ALIGN.CENTER);
            this.fontTitle.draw(String.fromCharCode(137) + ' ' + this.score.zeroFill(6), xs, ys + 90, ig.Font.ALIGN.CENTER);
            this.font.draw(String.fromCharCode(138) + ' ' + acc.round(1) + '%', xs, ys + 144, ig.Font.ALIGN.CENTER);
            this.font.draw(String.fromCharCode(139) + ' ' + wpm.round(1), xs, ys + 168, ig.Font.ALIGN.CENTER);
        }
    });
    ZType.MODE = {
        TITLE: 0,
        GAME: 1,
        GAME_OVER: 2
    };
    ZType.MULTIPLIER_TIERS = {
        25: 2,
        50: 3,
        100: 4
    };
    ZType.WAVES = {
        NORMAL: {
            wave: 0,
            spawn: [],
            spawnWait: 1,
            healthBoost: 0,
            types: [{
                type: EntityEnemyOppressor,
                count: 0,
                incEvery: 13
            }, {
                type: EntityEnemyDestroyer,
                count: 0,
                incEvery: 5
            }, {
                type: EntityEnemyMine,
                count: 3,
                incEvery: 2
            }]
        },
        EXPERT: {
            wave: 0,
            spawn: [],
            spawnWait: 0.7,
            healthBoost: 0,
            types: [{
                type: EntityEnemyOppressor,
                count: 1,
                incEvery: 7
            }, {
                type: EntityEnemyDestroyer,
                count: 2,
                incEvery: 3
            }, {
                type: EntityEnemyMine,
                count: 9,
                incEvery: 1
            }]
        }
    };
    ig.System.drawMode = ig.System.DRAW.SMOOTH;

    ZType.startGame = function() {
        ig.main('#canvas', ZType, 60, 360, 640, 1, ig.ImpactSplashLoader);
    }

});