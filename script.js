const canvas = document.querySelector('#gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.querySelector('#score');
const livesElement = document.querySelector('#lives');
const message = document.querySelector('#message');
const messageKicker = document.querySelector('#messageKicker');
const messageTitle = document.querySelector('#messageTitle');
const messageText = document.querySelector('#messageText');
const restartButton = document.querySelector('#restartButton');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const keys = {};
let game;

const level = {
    width: 3200,
    platforms: [
        { x: 0, y: 455, w: 700, h: 85 }, { x: 820, y: 455, w: 520, h: 85 },
        { x: 1460, y: 455, w: 630, h: 85 }, { x: 2210, y: 455, w: 990, h: 85 },
        { x: 470, y: 365, w: 150, h: 18 }, { x: 930, y: 350, w: 170, h: 18 },
        { x: 1220, y: 290, w: 140, h: 18 }, { x: 1580, y: 355, w: 190, h: 18 },
        { x: 1880, y: 285, w: 150, h: 18 }, { x: 2350, y: 360, w: 200, h: 18 },
        { x: 2670, y: 290, w: 190, h: 18 }
    ],
    coins: [
        [280, 405], [520, 315], [750, 405], [990, 300], [1260, 240],
        [1620, 305], [1915, 235], [2300, 405], [2420, 310], [2740, 240], [2980, 405]
    ],
    enemies: [{ x: 580, y: 423, min: 500, max: 670 }, { x: 1090, y: 423, min: 850, max: 1280 },
        { x: 1730, y: 423, min: 1500, max: 2020 }, { x: 2500, y: 423, min: 2250, max: 2900 }]
};

function resetGame() {
    game = {
        player: { x: 90, y: 380, w: 28, h: 42, vx: 0, vy: 0, grounded: false, invincible: 0 },
        coins: level.coins.map(([x, y]) => ({ x, y, collected: false, pulse: Math.random() * 6 })),
        enemies: level.enemies.map(enemy => ({ ...enemy, vx: 1.1, alive: true })),
        camera: 0, score: 0, lives: 3, state: 'playing', time: 0
    };
    message.hidden = true;
    updateHud();
}

function updateHud() {
    scoreElement.textContent = String(game.score).padStart(4, '0');
    livesElement.textContent = '●'.repeat(game.lives) + '○'.repeat(3 - game.lives);
}

function update() {
    if (game.state !== 'playing') return;
    game.time += 1;
    const player = game.player;
    const left = keys.ArrowLeft || keys.a;
    const right = keys.ArrowRight || keys.d;
    if (left) player.vx -= .55;
    if (right) player.vx += .55;
    if (!left && !right) player.vx *= .82;
    player.vx = Math.max(-5, Math.min(5, player.vx));
    player.vy += .55;
    player.x += player.vx;
    player.y += player.vy;
    player.grounded = false;
    for (const platform of level.platforms) {
        if (player.x + player.w > platform.x && player.x < platform.x + platform.w &&
            player.y + player.h >= platform.y && player.y + player.h <= platform.y + platform.h + 12 && player.vy >= 0) {
            player.y = platform.y - player.h;
            player.vy = 0;
            player.grounded = true;
        }
    }
    player.x = Math.max(0, Math.min(level.width - player.w, player.x));
    if (player.y > HEIGHT + 80) takeDamage();
    if (player.invincible > 0) player.invincible--;
    for (const coin of game.coins) {
        if (!coin.collected && hit(player, { x: coin.x - 10, y: coin.y - 10, w: 20, h: 20 })) {
            coin.collected = true;
            game.score += 100;
            updateHud();
        }
    }
    for (const enemy of game.enemies) {
        if (!enemy.alive) continue;
        enemy.x += enemy.vx;
        if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.vx *= -1;
        if (hit(player, { x: enemy.x, y: enemy.y, w: 30, h: 32 })) {
            if (player.vy > 0 && player.y + player.h < enemy.y + 16) {
                enemy.alive = false; player.vy = -8; game.score += 250; updateHud();
            } else if (player.invincible === 0) takeDamage();
        }
    }
    game.camera += (player.x - WIDTH * .38 - game.camera) * .1;
    game.camera = Math.max(0, Math.min(level.width - WIDTH, game.camera));
    if (player.x > 3090) finish(true);
}

function takeDamage() {
    if (game.player.invincible > 0) return;
    game.lives--;
    updateHud();
    if (game.lives <= 0) finish(false);
    else { game.player.x = Math.max(60, game.player.x - 100); game.player.y = 300; game.player.vy = 0; game.player.invincible = 100; }
}

function finish(won) {
    game.state = won ? 'won' : 'lost';
    messageKicker.textContent = won ? 'MISSION COMPLETE' : 'GAME OVER';
    messageTitle.textContent = won ? '星を集めた！' : 'もう一度挑戦しよう';
    messageText.textContent = won ? `スコア ${String(game.score).padStart(4, '0')} でゴール到着` : '操作を見直して、もう一度走ろう';
    message.hidden = false;
}

function hit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function jump() { if (game.state === 'playing' && game.player.grounded) { game.player.vy = -11.5; game.player.grounded = false; } }

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, '#182750'); sky.addColorStop(1, '#101426');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawStars();
    ctx.save(); ctx.translate(-game.camera, 0);
    drawMountains();
    for (const platform of level.platforms) drawPlatform(platform);
    for (const coin of game.coins) if (!coin.collected) drawCoin(coin);
    for (const enemy of game.enemies) if (enemy.alive) drawEnemy(enemy);
    drawGoal();
    if (game.player.invincible % 8 < 4) drawPlayer();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.font = '12px Space Grotesk'; ctx.fillText('SECTOR 01  /  STAR VALLEY', 22, 30);
}

function drawStars() {
    ctx.fillStyle = '#d6dcff';
    for (let i = 0; i < 75; i++) { const x = (i * 137) % WIDTH; const y = (i * 71) % 300; ctx.globalAlpha = (i % 3) / 4 + .25; ctx.fillRect(x, y, 2, 2); }
    ctx.globalAlpha = 1;
}
function drawMountains() {
    ctx.fillStyle = '#202d58'; ctx.beginPath(); ctx.moveTo(game.camera * .15, 455);
    for (let x = -200; x < level.width + 500; x += 280) { ctx.lineTo(x, 260 + (x % 100)); ctx.lineTo(x + 140, 455); } ctx.fill();
}
function drawPlatform(p) {
    ctx.fillStyle = '#2e3d61'; ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#f7ce46'; ctx.fillRect(p.x, p.y, p.w, 6);
    ctx.fillStyle = 'rgba(10,15,30,.3)'; for (let x = p.x + 12; x < p.x + p.w; x += 26) ctx.fillRect(x, p.y + 18, 10, 4);
}
function drawCoin(c) { const bob = Math.sin(game.time * .08 + c.pulse) * 4; ctx.fillStyle = '#f7ce46'; ctx.beginPath(); ctx.arc(c.x, c.y + bob, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff0a3'; ctx.fillRect(c.x - 2, c.y - 5 + bob, 3, 8); }
function drawEnemy(e) { ctx.fillStyle = '#e65c76'; ctx.fillRect(e.x, e.y, 30, 32); ctx.fillStyle = '#281b3e'; ctx.fillRect(e.x + 5, e.y + 8, 6, 7); ctx.fillRect(e.x + 19, e.y + 8, 6, 7); ctx.fillStyle = '#f6f3ea'; ctx.fillRect(e.x + 7, e.y + 25, 16, 4); }
function drawPlayer() { const p = game.player; ctx.fillStyle = '#5ee1d0'; ctx.fillRect(p.x, p.y + 12, p.w, 30); ctx.fillStyle = '#f6f3ea'; ctx.fillRect(p.x + 3, p.y, 22, 22); ctx.fillStyle = '#27315b'; ctx.fillRect(p.x + 7, p.y + 7, 5, 6); ctx.fillRect(p.x + 18, p.y + 7, 5, 6); ctx.fillStyle = '#f7ce46'; ctx.fillRect(p.x - 4, p.y + 25, 36, 5); }
function drawGoal() { ctx.fillStyle = '#f6f3ea'; ctx.fillRect(3130, 330, 5, 125); ctx.fillStyle = '#f7ce46'; ctx.beginPath(); ctx.moveTo(3135, 330); ctx.lineTo(3190, 350); ctx.lineTo(3135, 370); ctx.fill(); }

function loop() { update(); draw(); requestAnimationFrame(loop); }
window.addEventListener('keydown', event => { keys[event.key] = true; if (event.code === 'Space') { event.preventDefault(); jump(); } });
window.addEventListener('keyup', event => { keys[event.key] = false; });
restartButton.addEventListener('click', resetGame);
resetGame();
loop();
