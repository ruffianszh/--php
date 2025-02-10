
// lib/game/entities/enemy.js
ig.baked = true;
ig.module('game.entities.enemy').requires('impact.entity', 'impact.font', 'game.words', 'game.entities.particle').defines(function() {
    EntityEnemy = ig.Entity.extend({
        word: 'none',
        remainingWord: 'none',
        health: 8,
        currentLetter: 0,
        targeted: false,
        font: new ig.Font('media/fonts/deja-vu-12.png'),
        fontActive: new ig.Font('media/fonts/deja-vu-12-orange.png'),
        speed: 10,
        friction: {
            x: 100,
            y: 100
        },
        hitTimer: null,
        dead: false,
        angle: 0,
        wordLength: {
            min: 8,
            max: 8
        },
        soundHit: new ig.Sound('media/sounds/hit.ogg'),
        type: ig.Entity.TYPE.B,
        checkAgainst: ig.Entity.TYPE.A,
        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.health = Math.random().map(0, 1, this.wordLength.min, this.wordLength.max).round();
            this.word = this.getWordWithLength(this.health);
            this.remainingWord = this.word;
            this.hitTimer = new ig.Timer(0);
            this.dieTimer = new ig.Timer(0);
            ig.game.registerTarget(this.word.charAt(0), this);
            this.angle = this.angleTo(ig.game.player);
            //////添加help
            this.drawContentLabel(this.word);
        },
        drawContentLabel: function(word) {
            const filePath = 'word/' + word + '.md'; // 构建文件路径

            fetch(filePath)
                .then(response => {
                    if (!response.ok) {
                        // 直接返回空而不抛出错误
                        console.warn('File not found:', filePath);
                        return null; // 返回 null 表示文件不存在
                    }
                    return response.text(); // 获取文件内容
                })
                .then(data => {
                    if (data) {
                        // 将内容插入到 DOM 中
                        document.getElementById("content_label").innerHTML += "<div id='" + word + "'>" + data + "</div>";
                    } else {
                        return;
                        // 可选：如果文件不存在，可以在这里处理
                        console.log('No content to display for:', word);
                    }
                })
                .catch(error => {
                    // 捕获任何其他错误
                    console.error('There was a problem with the fetch operation:', error);
                    // 可选：在这里显示错误信息
                });
        },
        getWordWithLength: function(l) {
            var w = 'wtf';
            for (var i = 0; i < 20; i++) {
                if (l >= 2 && l <= 12) {
                    w = WORDS[l].random();
                } else {
                    w = String.fromCharCode('a'.charCodeAt(0) + (Math.random() * 26).floor());
                }
                if (!ig.game.targets[w.charAt(0)].length) {
                    return w;
                    return this.formatString(w);
                }
            }
            return w;
        },
        formatString:function(input){
            input=input.toLowerCase();
            const shiftToNormalMap = {
                '!': '1',
                '@': '2',
                '#': '3',
                '$': '4',
                '%': '5',
                '^': '6',
                '&': '7',
                '*': '8',
                '(': '9',
                ')': '0',
                '_': '-',
                '+': '=',
                ':': ';',
                '"': '\'',
                '<': ',',
                '>': '.',
                '?': '/',
                '{': '[',
                '}': ']',
                '|': '\\'
            };
            return input.split('').map(char => shiftToNormalMap[char] || char).join('');
        },
        target: function() {
            this.targeted = true;
            ig.game.currentTarget = this;
            ig.game.unregisterTarget(this.word.charAt(0), this);
            ig.game.entities.erase(this);
            ig.game.entities.push(this);
        },
        draw: function() {
            ig.system.context.globalCompositeOperation = 'lighter';
            this.parent();
            ig.system.context.globalCompositeOperation = 'source-over';
        },
        drawLabel: function() {
            if (!this.remainingWord.length) {
                return;
            }
            var w = this.font.widthForString(this.word);
            var x = (this.pos.x - 6).limit(w + 2, ig.system.width - 1);
            var y = (this.pos.y + this.size.y - 10).limit(2, ig.system.height - 19);
            var bx = ig.system.getDrawPos(x - w - 2);
            var by = ig.system.getDrawPos(y - 3);
            ig.system.context.fillStyle = 'rgba(0,0,0,0.5)';
            ig.system.context.fillRect(bx, by, w + 3, 19);
            if (this.targeted) {
                this.fontActive.draw(this.remainingWord, x, y, ig.Font.ALIGN.RIGHT);
            } else {
                this.font.draw(this.remainingWord, x, y, ig.Font.ALIGN.RIGHT);
            }
        },
        kill: function() {
            ig.game.unregisterTarget(this.word.charAt(0), this);
            if (ig.game.currentTarget == this) {
                ig.game.currentTarget = null;
            }
            this.parent();
        },
        update: function() {
            if (this.hitTimer.delta() > 0) {
                this.vel.x = Math.cos(this.angle) * this.speed;
                this.vel.y = Math.sin(this.angle) * this.speed;
            }
            this.parent();
            if (this.pos.x < -this.animSheet.width || this.pos.x > ig.system.width + 10 || this.pos.y > ig.system.height + 10 || this.pos.y < -this.animSheet.height - 30) {
                this.kill();
            }
        },
        hit: function() {
            var numParticles = this.health <= 1 ? 10 : 4;
            for (var i = 0; i < numParticles; i++) {
                ig.game.spawnEntity(EntityExplosionParticle, this.pos.x, this.pos.y);
            }
            this.vel.x = -Math.cos(this.angle) * 20;
            this.vel.y = -Math.sin(this.angle) * 20;
            this.hitTimer.set(0.3);
            this.receiveDamage(1);
            ig.game.lastKillTimer.set(0.3);
            this.soundHit.play();
        },
        isHitBy: function(letter) {
            letter = letter.toLowerCase();
            if (this.remainingWord.charAt(0) == letter) {
                this.remainingWord = this.remainingWord.substr(1);
                if (this.remainingWord.length == 0) {
                    var element = document.getElementById(this.word); 
                    if (element) {
                        element.remove(); // 删除元素
                    }
                    ig.game.currentTarget = null;
                    ig.game.unregisterTarget(this.word.charAt(0), this);
                    this.dead = true;
                }
                return true;
            } else {
                return false;
            }
        },
        check: function(other) {
            other.kill();
            this.kill();
        }
    });
    EntityExplosionParticle = EntityParticle.extend({
        lifetime: 0.5,
        fadetime: 0.5,
        vel: {
            x: 60,
            y: 60
        },
        animSheet: new ig.AnimationSheet('media/sprites/explosion.png', 32, 32),
        init: function(x, y, settings) {
            this.addAnim('idle', 5, [0, 1, 2]);
            this.parent(x, y, settings);
        },
        draw: function() {
            ig.system.context.globalCompositeOperation = 'lighter';
            this.parent();
            ig.system.context.globalCompositeOperation = 'source-over';
        },
        update: function() {
            this.currentAnim.angle += 0.1 * ig.system.tick;
            this.parent();
        }
    });
});