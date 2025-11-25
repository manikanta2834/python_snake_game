const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const endGameBtn = document.getElementById('end-game-btn');
const scoreListStart = document.getElementById('score-list-start');

// World Settings
const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;
const INITIAL_SPEED = 3;
const BOOST_SPEED = 6;
const TURN_SPEED = 0.1;
const SNAKE_WIDTH = 25;
const SEGMENT_DISTANCE = 10;

// Assets
const snakeHeadImg = new Image();
snakeHeadImg.src = '/static/game/assets/snake_head.png';
const snakeBodyImg = new Image();
snakeBodyImg.src = '/static/game/assets/snake_body.png';
const foodImg = new Image();
foodImg.src = '/static/game/assets/food.png';

let gameLoop;
let gameState = 'MENU'; // MENU, PLAYING, GAME_OVER

// Camera
const camera = {
    x: 0,
    y: 0,
    update: function (target) {
        this.x = target.x - canvas.width / 2;
        this.y = target.y - canvas.height / 2;

        // Clamp camera to world bounds (optional, but good for "arena" feel)
        // this.x = Math.max(0, Math.min(this.x, WORLD_WIDTH - canvas.width));
        // this.y = Math.max(0, Math.min(this.y, WORLD_HEIGHT - canvas.height));
    }
};

// Input
const mouse = { x: 0, y: 0, down: false };

class Snake {
    constructor(color, x, y, isBot = false) {
        this.color = color;
        this.isBot = isBot;
        this.reset(x, y);
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = INITIAL_SPEED;
        this.score = 0;
        this.alive = true;
        this.body = [];
        this.length = 10; // Initial length

        // Initialize body segments
        for (let i = 0; i < this.length; i++) {
            this.body.push({ x: x - Math.cos(this.angle) * i * SEGMENT_DISTANCE, y: y - Math.sin(this.angle) * i * SEGMENT_DISTANCE });
        }
    }

    update() {
        if (!this.alive) return;

        // Steering
        let targetAngle = this.angle;
        if (this.isBot) {
            this.botAI();
            targetAngle = this.targetAngle;
        } else {
            // Player steering towards mouse (relative to camera)
            const dx = mouse.x - (this.x - camera.x);
            const dy = mouse.y - (this.y - camera.y);
            targetAngle = Math.atan2(dy, dx);

            // Boost
            if (mouse.down && this.length > 5) {
                this.speed = BOOST_SPEED;
                // Shrink slowly when boosting? Optional.
            } else {
                this.speed = INITIAL_SPEED;
            }
        }

        // Smooth turning
        let diff = targetAngle - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.angle += Math.max(-TURN_SPEED, Math.min(TURN_SPEED, diff));

        // Move Head
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // World Wrap
        if (this.x < 0) this.x = WORLD_WIDTH;
        if (this.x > WORLD_WIDTH) this.x = 0;
        if (this.y < 0) this.y = WORLD_HEIGHT;
        if (this.y > WORLD_HEIGHT) this.y = 0;

        // Update Body
        // Head is at index 0 of body array? No, let's keep body as trailing segments.
        // Actually, let's make body[0] be the head for simplicity in drawing.
        // But for smooth movement, we need to drag segments.

        // Drag segments
        let prev = { x: this.x, y: this.y };

        // We need to maintain the head in the body array for collision, or handle it separately.
        // Let's re-generate body points based on history or drag physics.
        // Simple drag physics:
        if (this.body.length < this.length) {
            this.body.push({ x: this.body[this.body.length - 1].x, y: this.body[this.body.length - 1].y });
        } else if (this.body.length > this.length) {
            this.body.splice(this.length);
        }

        // Update first segment to follow head
        this.dragSegment(0, this.x, this.y);

        // Update rest
        for (let i = 1; i < this.body.length; i++) {
            this.dragSegment(i, this.body[i - 1].x, this.body[i - 1].y);
        }
    }

    dragSegment(i, tx, ty) {
        const dx = tx - this.body[i].x;
        const dy = ty - this.body[i].y;
        const angle = Math.atan2(dy, dx);

        // Move segment to be exactly SEGMENT_DISTANCE away from target
        // But we want it to trail.
        // Simple approach: move towards target until distance is SEGMENT_DISTANCE
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > SEGMENT_DISTANCE) {
            // This is a bit rigid, but works for snake
            this.body[i].x = tx - Math.cos(angle) * SEGMENT_DISTANCE;
            this.body[i].y = ty - Math.sin(angle) * SEGMENT_DISTANCE;
        }
    }

    botAI() {
        // Find nearest food
        let nearest = null;
        let minD = Infinity;
        foods.forEach(f => {
            const d = Math.hypot(f.x - this.x, f.y - this.y);
            if (d < minD) {
                minD = d;
                nearest = f;
            }
        });

        if (nearest) {
            this.targetAngle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
        } else {
            this.targetAngle = this.angle + (Math.random() - 0.5);
        }

        // Avoid walls (soft bounds)
        if (this.x < 100) this.targetAngle = 0;
        if (this.x > WORLD_WIDTH - 100) this.targetAngle = Math.PI;
        if (this.y < 100) this.targetAngle = Math.PI / 2;
        if (this.y > WORLD_HEIGHT - 100) this.targetAngle = -Math.PI / 2;
    }

    draw() {
        // Draw Body
        for (let i = this.body.length - 1; i >= 0; i--) {
            const p = this.body[i];
            // Draw relative to camera
            const drawX = p.x - camera.x;
            const drawY = p.y - camera.y;

            if (this.isBot) {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(drawX, drawY, SNAKE_WIDTH / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.drawImage(snakeBodyImg, drawX - SNAKE_WIDTH / 2, drawY - SNAKE_WIDTH / 2, SNAKE_WIDTH, SNAKE_WIDTH);
            }
        }

        // Draw Head
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(this.angle + Math.PI / 2); // Adjust for image orientation
        if (this.isBot) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, SNAKE_WIDTH / 2 + 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.drawImage(snakeHeadImg, -SNAKE_WIDTH / 2 - 5, -SNAKE_WIDTH / 2 - 5, SNAKE_WIDTH + 10, SNAKE_WIDTH + 10);
        }
        ctx.restore();
    }

    checkCollision(otherSnake) {
        // Head vs Body collision
        // Check if THIS head hits OTHER body
        for (let i = 0; i < otherSnake.body.length; i++) {
            const seg = otherSnake.body[i];
            const dist = Math.hypot(this.x - seg.x, this.y - seg.y);
            if (dist < SNAKE_WIDTH) {
                return true;
            }
        }
        return false;
    }
}

class Food {
    constructor() {
        this.randomize();
    }

    randomize() {
        this.x = Math.random() * WORLD_WIDTH;
        this.y = Math.random() * WORLD_HEIGHT;
        this.size = 15 + Math.random() * 10;
    }

    draw() {
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;

        // Optimization: Don't draw if off screen
        if (drawX < -50 || drawX > canvas.width + 50 || drawY < -50 || drawY > canvas.height + 50) return;

        ctx.drawImage(foodImg, drawX - this.size / 2, drawY - this.size / 2, this.size, this.size);
    }
}

let player;
let bots = [];
let foods = [];

function initGame() {
    player = new Snake('#0f0', WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    bots = [];
    for (let i = 0; i < 10; i++) {
        bots.push(new Snake('#' + Math.floor(Math.random() * 16777215).toString(16), Math.random() * WORLD_WIDTH, Math.random() * WORLD_HEIGHT, true));
    }

    foods = [];
    for (let i = 0; i < 100; i++) {
        foods.push(new Food());
    }

    gameState = 'PLAYING';
    scoreElement.innerText = '0';

    startScreen.classList.add('hidden');
    startScreen.classList.remove('active');
    gameOverScreen.classList.add('hidden');
    gameOverScreen.classList.remove('active');
    endGameBtn.style.display = 'block';

    if (gameLoop) cancelAnimationFrame(gameLoop);
    loop();
}

function loop() {
    if (gameState === 'PLAYING') {
        update();
        draw();
        gameLoop = requestAnimationFrame(loop);
    }
}

function update() {
    player.update();
    camera.update(player);

    bots.forEach(bot => bot.update());

    // Food Collision
    foods.forEach(f => {
        // Player eat
        if (Math.hypot(player.x - f.x, player.y - f.y) < SNAKE_WIDTH + f.size / 2) {
            player.length += 1;
            player.score += 10;
            scoreElement.innerText = player.score;
            f.randomize();
        }
        // Bot eat
        bots.forEach(bot => {
            if (Math.hypot(bot.x - f.x, bot.y - f.y) < SNAKE_WIDTH + f.size / 2) {
                bot.length += 1;
                f.randomize();
            }
        });
    });

    // Snake Collision
    // Player vs Bots
    bots.forEach(bot => {
        if (player.checkCollision(bot)) {
            gameOver();
        }
        if (bot.checkCollision(player)) {
            // Bot dies
            // Respawn bot
            bot.reset(Math.random() * WORLD_WIDTH, Math.random() * WORLD_HEIGHT);
            player.score += 50; // Bonus for killing bot
        }
    });

    // Player vs Self? (Usually disabled in IO games unless you circle yourself, but let's skip for simplicity or add later)
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background Grid
    const gridSize = 100;
    const offsetX = camera.x % gridSize;
    const offsetY = camera.y % gridSize;

    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -offsetX; x < canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for (let y = -offsetY; y < canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    // Draw Food
    foods.forEach(f => f.draw());

    // Draw Bots
    bots.forEach(bot => bot.draw());

    // Draw Player
    player.draw();

    // Draw Minimap (Optional, maybe later)
}

function gameOver() {
    gameState = 'GAME_OVER';
    cancelAnimationFrame(gameLoop);
    finalScoreElement.innerText = 'Score: ' + player.score;
    gameOverScreen.classList.remove('hidden');
    gameOverScreen.classList.add('active');
    endGameBtn.style.display = 'none';

    saveScore(player.score);
    fetchTopScores();
}

// API Calls (Same as before)
function saveScore(score) {
    fetch('/api/save_score/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: score })
    });
}

function fetchTopScores() {
    fetch('/api/get_top_scores/')
        .then(response => response.json())
        .then(data => {
            let html = '';
            data.scores.forEach(s => {
                html += `<li>${s.score} - ${s.date}</li>`;
            });
            scoreListStart.innerHTML = html;
        });
}

// Controls
document.addEventListener('keydown', e => {
    if (gameState === 'MENU' && e.key === 'Enter') {
        initGame();
    } else if (gameState === 'GAME_OVER') {
        if (e.key === 'r' || e.key === 'R') {
            initGame();
        }
    }
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => mouse.down = true);
canvas.addEventListener('mouseup', () => mouse.down = false);

endGameBtn.addEventListener('click', () => {
    if (gameState === 'PLAYING') {
        gameOver();
    }
});

// Initial Render
ctx.fillStyle = '#050505';
ctx.fillRect(0, 0, canvas.width, canvas.height);
fetchTopScores();
