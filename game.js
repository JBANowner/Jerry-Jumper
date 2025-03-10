"use strict";
window.onload = function() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) { console.error('Canvas element not found'); return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { console.error('Failed to get 2D context'); return; }
    const scoreDisplay = document.getElementById('scoreDisplay');
    if (!scoreDisplay) { console.error('Score display element not found'); return; }

    // Logical game dimensions
    const GAME_WIDTH = 400;
    const GAME_HEIGHT = 600;

    // Load background music with full URL
    const backgroundMusic = new Audio('https://jbanowner.github.io/Jerry-Jumper/Retro_Game_Arcade.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;
    console.log('Background music loaded:', backgroundMusic.src);
    let musicStarted = false;

    // Load images
    const playerHead = new Image();
    playerHead.src = 'playerHead.png';
    playerHead.onload = () => console.log('Player head loaded');
    playerHead.onerror = () => console.error('Failed to load playerHead.png');

    const platformFace = new Image();
    platformFace.src = 'platformFace.png';
    platformFace.onload = () => console.log('Platform face loaded');
    platformFace.onerror = () => console.error('Failed to load platformFace.png');

    const breakableFace = new Image();
    breakableFace.src = 'breakableFace.png';
    breakableFace.onload = () => console.log('Breakable face loaded');
    breakableFace.onerror = () => console.error('Failed to load breakableFace.png');

    const beeImage = new Image();
    beeImage.src = 'bee.png';
    beeImage.onload = () => console.log('Bee image loaded');
    beeImage.onerror = () => console.error('Failed to load bee.png');

    const player = {
        x: 200, y: 560, width: 40, height: 40, dy: 0, gravity: 0.8, jumpPower: -20,
        isJumping: false, onPlatform: false, hasStarted: false, currentPlatform: null, speedX: 0
    };

    let platforms = [
        { x: 150, y: 500, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 },
        { x: 100, y: 440, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 },
        { x: 200, y: 380, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 },
        { x: 120, y: 320, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 },
        { x: 180, y: 260, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 }
    ];

    let bees = [];
    let beeSpawnTimer = 0;
    let platformCount = 8;
    let score = 0;
    let level = 1;
    let difficultyFactor = 1;

    let keys = { left: false, right: false };

    // Resize canvas to fit screen while maintaining aspect ratio
    function resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const aspectRatio = GAME_HEIGHT / GAME_WIDTH;
        let width = window.innerWidth;
        let height = width * aspectRatio;

        if (height > window.innerHeight) {
            height = window.innerHeight;
            width = height / aspectRatio;
        }

        container.style.width = `${width}px`;
        container.style.height = `${height}px`;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        // Logical size remains fixed for game logic
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function spawnPlatforms() {
        while (platforms.length < platformCount) {
            const highestY = platforms.length ? Math.min(...platforms.map(p => p.y)) : 260;
            const isMoving = Math.random() < 0.3 * difficultyFactor;
            const isBreakable = Math.random() < 0.2 * difficultyFactor;
            let platform = {
                x: Math.random() * (GAME_WIDTH - 100),
                y: highestY - 60 - Math.random() * 40,
                width: 100, height: 20,
                speed: isMoving ? (Math.random() > 0.5 ? 2 : -2) * (difficultyFactor * 0.5) : 0,
                breakable: isBreakable,
                breakTimer: isBreakable ? 60 : 0
            };
            platforms.push(platform);
        }
    }

    function spawnBee() {
        if (level < 5) return;
        const spawnChance = Math.random() < 0.02 * (level - 4);
        if (spawnChance) {
            const direction = Math.random() < 0.5 ? 1 : -1;
            const bee = {
                x: direction === 1 ? -20 : GAME_WIDTH + 20,
                y: Math.random() * (GAME_HEIGHT - 100) + 50,
                width: 20, height: 20,
                speed: direction * (3 + difficultyFactor)
            };
            bees.push(bee);
        }
    }

    function drawPlayer() {
        if (playerHead.complete && playerHead.naturalWidth !== 0) {
            ctx.drawImage(playerHead, player.x, player.y, player.width, player.height);
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }
    }

    function drawPlatforms() {
        platforms.forEach(platform => {
            if (platform.breakable && breakableFace.complete && breakableFace.naturalWidth !== 0) {
                ctx.drawImage(breakableFace, platform.x, platform.y, platform.width, platform.height);
            } else if (!platform.breakable && platformFace.complete && platformFace.naturalWidth !== 0) {
                ctx.drawImage(platformFace, platform.x, platform.y, platform.width, platform.height);
            } else {
                ctx.fillStyle = platform.breakable ? 'brown' : 'green';
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            }
        });
    }

    function drawBees() {
        bees.forEach(bee => {
            if (beeImage.complete && beeImage.naturalWidth !== 0) {
                ctx.drawImage(beeImage, bee.x, bee.y, bee.width, bee.height);
            } else {
                ctx.fillStyle = '#000000';
                ctx.fillRect(bee.x, bee.y, bee.width, bee.height);
            }
        });
    }

    function update() {
        if (!player.onPlatform) {
            player.dy += player.gravity;
            player.y += player.dy;
        }

        player.speedX = 0;
        if (keys.left) player.speedX = -10;
        if (keys.right) player.speedX = 10;
        player.x += player.speedX;

        if (player.x < 0) player.x = 0;
        if (player.x > GAME_WIDTH - player.width) player.x = GAME_WIDTH - player.width;

        if (player.y < GAME_HEIGHT / 2) {
            const scrollSpeed = player.dy < 0 ? -player.dy : 2;
            platforms.forEach(platform => platform.y += scrollSpeed);
            bees.forEach(bee => bee.y += scrollSpeed);
            player.y += scrollSpeed;
            score += Math.floor(difficultyFactor);
        }

        platforms.forEach(platform => {
            if (platform.speed) {
                platform.x += platform.speed;
                if (player.onPlatform && player.currentPlatform === platform) {
                    player.x += platform.speed;
                }
                if (platform.x < 0) platform.speed = Math.abs(platform.speed);
                if (platform.x + platform.width > GAME_WIDTH) platform.speed = -Math.abs(platform.speed);
            }
        });

        bees.forEach(bee => bee.x += bee.speed);
        bees = bees.filter(bee => bee.x + bee.width > 0 && bee.x < GAME_WIDTH);

        beeSpawnTimer++;
        if (beeSpawnTimer > 30) {
            spawnBee();
            beeSpawnTimer = 0;
        }

        platforms = platforms.filter(p => p.y < GAME_HEIGHT + 20);
        spawnPlatforms();

        player.onPlatform = false;
        player.currentPlatform = null;
        platforms.forEach((platform, index) => {
            if (player.dy >= 0 &&
                player.x < platform.x + platform.width &&
                player.x + player.width > platform.x &&
                player.y + player.height > platform.y &&
                player.y + player.height <= platform.y + player.dy + 5) {
                player.y = platform.y - player.height;
                player.dy = 0;
                player.isJumping = false;
                player.onPlatform = true;
                player.currentPlatform = platform;
                if (platform.breakable && platform.breakTimer > 0) {
                    platform.breakTimer--;
                    if (platform.breakTimer <= 0) {
                        platforms.splice(index, 1);
                        player.onPlatform = false;
                        player.currentPlatform = null;
                    }
                }
            }
        });

        bees.forEach(bee => {
            if (player.x < bee.x + bee.width &&
                player.x + player.width > bee.x &&
                player.y < bee.y + bee.height &&
                player.y + player.height > bee.y) {
                alert(`Game Over! Hit by a bee! Level: ${level}, Score: ${score}`);
                reset();
            }
        });

        if (player.y + player.height > GAME_HEIGHT) {
            player.y = GAME_HEIGHT - player.height;
            player.dy = 0;
            player.isJumping = false;
            if (player.hasStarted && !player.onPlatform) {
                alert(`Game Over! Level: ${level}, Score: ${score}`);
                reset();
            }
        }

        if (score > level * 100) {
            level++;
            difficultyFactor += 0.2;
            platformCount = Math.min(12, platformCount + 1);
        }
    }

    function draw() {
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        drawPlayer();
        drawPlatforms();
        drawBees();
        scoreDisplay.textContent = `Score: ${score} | Level: ${level}`;
    }

    function reset() {
        player.y = 560;
        player.dy = 0;
        player.isJumping = false;
        player.onPlatform = false;
        player.hasStarted = false;
        player.currentPlatform = null;
        player.speedX = 0;
        keys.left = false;
        keys.right = false;
        platforms = [
            { x: 150, y: 500, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 },
            { x: 100, y: 440, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 },
            { x: 200, y: 380, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 },
            { x: 120, y: 320, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 },
            { x: 180, y: 260, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 }
        ];
        bees = [];
        score = 0;
        level = 1;
        difficultyFactor = 1;
        platformCount = 8;
        spawnPlatforms();
    }

    document.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
        console.log(`Key pressed: ${e.key}`);
        if (e.key === 'ArrowLeft') keys.left = true;
        if (e.key === 'ArrowRight') keys.right = true;
        if (e.key === 'ArrowUp' && !player.isJumping) {
            player.dy = player.jumpPower;
            player.isJumping = true;
            player.onPlatform = false;
            player.hasStarted = true;
            player.currentPlatform = null;
            if (!musicStarted) {
                console.log('Attempting to play music');
                backgroundMusic.play().catch(error => console.error('Error playing music:', error));
                musicStarted = true;
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft') keys.left = false;
        if (e.key === 'ArrowRight') keys.right = false;
    });

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    spawnPlatforms();
    gameLoop();
};
