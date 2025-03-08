1  "use strict";
2  window.onload = function() {
3      const canvas = document.getElementById('gameCanvas');
4      if (!canvas) { console.error('Canvas element not found'); return; }
5      const ctx = canvas.getContext('2d');
6      if (!ctx) { console.error('Failed to get 2D context'); return; }
7      const scoreDisplay = document.getElementById('scoreDisplay');
8      if (!scoreDisplay) { console.error('Score display element not found'); return; }
9
10     scoreDisplay.style.fontSize = '20px';
11     scoreDisplay.style.color = 'green';
12     scoreDisplay.style.fontFamily = 'Arial, sans-serif';
13
14     const backgroundMusic = new Audio('https://jbanowner.github.io/Jerry-Jumper/Retro_Game_Arcade.mp3');
15     backgroundMusic.loop = true;
16     backgroundMusic.volume = 0.5;
17     console.log('Background music loaded:', backgroundMusic.src);
18     let musicStarted = false;
19
20     const playerHead = new Image();
21     playerHead.src = 'playerHead.png';
22     playerHead.onload = () => console.log('Player head loaded');
23     playerHead.onerror = () => console.error('Failed to load playerHead.png');
24
25     const platformFace = new Image();
26     platformFace.src = 'platformFace.png';
27     platformFace.onload = () => console.log('Platform face loaded');
28     platformFace.onerror = () => console.error('Failed to load platformFace.png');
29
30     const breakableFace = new Image();
31     breakableFace.src = 'breakableFace.png';
32     breakableFace.onload = () => console.log('Breakable face loaded');
33     breakableFace.onerror = () => console.error('Failed to load breakableFace.png');
34
35     const beeImage = new Image();
36     beeImage.src = 'bee.png';
37     beeImage.onload = () => console.log('Bee image loaded');
38     beeImage.onerror = () => console.error('Failed to load bee.png');
39
40     const player = {
41         x: 200, y: 560, width: 40, height: 40, dy: 0, gravity: 0.8, jumpPower: -20,
42         isJumping: false, onPlatform: false, hasStarted: false, currentPlatform: null, speedX: 0
43     };
44
45     let platforms = [
46         { x: 150, y: 500, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 },
47         { x: 100, y: 440, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 },
48         { x: 200, y: 380, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 },
49         { x: 120, y: 320, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 },
50     // Line 50
51         { x: 180, y: 260, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 }
52     ];
53
54     let bees = [];
55     let beeSpawnTimer = 0;
56     let platformCount = 8;
57     let score = 0;
58     let level = 1;
59     let difficultyFactor = 1;
60
61     let keys = { left: false, right: false };
62
63     function spawnPlatforms() {
64         while (platforms.length < platformCount) {
65             const highestY = platforms.length ? Math.min(...platforms.map(p => p.y)) : 260;
66             const isMoving = Math.random() < 0.3 * difficultyFactor;
67             const isBreakable = Math.random() < 0.2 * difficultyFactor;
68             let platform = {
69                 x: Math.random() * (canvas.width - 100),
70                 y: highestY - 60 - Math.random() * 40,
71                 width: 100,
72                 height: 20,
73                 speed: isMoving ? (Math.random() > 0.5 ? 2 : -2) * (difficultyFactor * 0.5) : 0,
74                 breakable: isBreakable,
75                 breakTimer: isBreakable ? 60 : 0
76             };
77             platforms.push(platform);
78         }
79     }
80
81     function spawnBee() {
82         if (level < 5) return;
83         const spawnChance = Math.random() < 0.02 * (level - 4);
84         if (spawnChance) {
85             const direction = Math.random() < 0.5 ? 1 : -1;
86             const bee = {
87                 x: direction === 1 ? -20 : canvas.width + 20,
88                 y: Math.random() * (canvas.height - 100) + 50,
89                 width: 20,
90                 height: 20,
91                 speed: direction * (3 + difficultyFactor)
92             };
93             bees.push(bee);
94         }
95     }
96
97     function drawPlayer() {
98         if (playerHead.complete && playerHead.naturalWidth !== 0) {
99             ctx.drawImage(playerHead, player.x, player.y, player.width, player.height);
100        } else {
101        // Line 100
102            ctx.fillStyle = 'red';
103            ctx.fillRect(player.x, player.y, player.width, player.height);
104        }
105    }
106
107    function drawPlatforms() {
108        platforms.forEach(platform => {
109            if (platform.breakable && breakableFace.complete && breakableFace.naturalWidth !== 0) {
110                ctx.drawImage(breakableFace, platform.x, platform.y, platform.width, platform.height);
111            } else if (!platform.breakable && platformFace.complete && platformFace.naturalWidth !== 0) {
112                ctx.drawImage(platformFace, platform.x, platform.y, platform.width, platform.height);
113            } else {
114                ctx.fillStyle = platform.breakable ? 'brown' : 'green';
115                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
116            }
117        });
118    }
119
120    function drawBees() {
121        bees.forEach(bee => {
122            if (beeImage.complete && beeImage.naturalWidth !== 0) {
123                ctx.drawImage(beeImage, bee.x, bee.y, bee.width, bee.height);
124            } else {
125                ctx.fillStyle = '#000000';
126                ctx.fillRect(bee.x, bee.y, bee.width, bee.height);
127            }
128        });
129    }
130
131    function update() {
132        if (!player.onPlatform) {
133            player.dy += player.gravity;
134            player.y += player.dy;
135        }
136
137        player.speedX = 0;
138        if (keys.left) player.speedX = -10;
139        if (keys.right) player.speedX = 10;
140        player.x += player.speedX;
141
142        if (player.x < 0) player.x = 0;
143        if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
144
145        if (player.y < canvas.height / 2) {
146            const scrollSpeed = player.dy < 0 ? -player.dy : 2;
147            platforms.forEach(platform => platform.y += scrollSpeed);
148            bees.forEach(bee => bee.y += scrollSpeed);
149            player.y += scrollSpeed;
150            score += Math.floor(difficultyFactor);
151        }
152    // Line 150
153        platforms.forEach(platform => {
154            if (platform.speed) {
155                platform.x += platform.speed;
156                if (player.onPlatform && player.currentPlatform === platform) {
157                    player.x += platform.speed;
158                }
159                if (platform.x < 0) platform.speed = Math.abs(platform.speed);
160                if (platform.x + platform.width > canvas.width) platform.speed = -Math.abs(platform.speed);
161            }
162        });
163
164        bees.forEach(bee => bee.x += bee.speed);
165        bees = bees.filter(bee => bee.x + bee.width > 0 && bee.x < canvas.width);
166
167        beeSpawnTimer++;
168        if (beeSpawnTimer > 30) {
169            spawnBee();
170            beeSpawnTimer = 0;
171        }
172
173        platforms = platforms.filter(p => p.y < canvas.height + 20);
174        spawnPlatforms();
175
176        player.onPlatform = false;
177        player.currentPlatform = null;
178        platforms.forEach((platform, index) => {
179            if (player.dy >= 0 &&
180                player.x < platform.x + platform.width &&
181                player.x + player.width > platform.x &&
182                player.y + player.height > platform.y &&
183                player.y + player.height <= platform.y + player.dy + 5) {
184                player.y = platform.y - player.height;
185                player.dy = 0;
186                player.isJumping = false;
187                player.onPlatform = true;
188                player.currentPlatform = platform;
189                if (platform.breakable && platform.breakTimer > 0) {
190                    platform.breakTimer--;
191                    if (platform.breakTimer <= 0) {
192                        platforms.splice(index, 1);
193                        player.onPlatform = false;
194                        player.currentPlatform = null;
195                    }
196                }
197            }
198        });
199
200        bees.forEach(bee => {
201            if (player.x < bee.x + bee.width &&
202                player.x + player.width > bee.x &&
203                player.y < bee.y + bee.height &&
204                player.y + player.height > bee.y) {
205                alert(`Game Over! Hit by a bee! Level: ${level}, Score: ${score}`);
206                reset();
207            }
208        });
209    // Line 200
210
211        if (player.y + player.height > canvas.height) {
212            player.y = canvas.height - player.height;
213            player.dy = 0;
214            player.isJumping = false;
215            if (player.hasStarted && !player.onPlatform) {
216                alert(`Game Over! Level: ${level}, Score: ${score}`);
217                reset();
218            }
219        }
220
221        if (score > level * 100) {
222            level++;
223            difficultyFactor += 0.2;
224            platformCount = Math.min(12, platformCount + 1);
225        }
226    }
227
228    function draw() {
229        ctx.clearRect(0, 0, canvas.width, canvas.height);
230        drawPlayer();
231        drawPlatforms();
232        drawBees();
233        scoreDisplay.textContent = `Score: ${score} | Level: ${level}`;
234    }
235
236    function reset() {
237        player.y = 560;
238        player.dy = 0;
239        player.isJumping = false;
240        player.onPlatform = false;
241        player.hasStarted = false;
242        player.currentPlatform = null;
243        player.speedX = 0;
244        keys.left = false;
245        keys.right = false;
246        platforms = [
247            { x: 150, y: 500, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 },
248            { x: 100, y: 440, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 },
249            { x: 200, y: 380, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 },
250            { x: 120, y: 320, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 },
251        // Line 250
252            { x: 180, y: 260, width: 100, height: 20, speed: 0, breakable: false, breakTimer: 0 }
253        ];
254        bees = [];
255        score = 0;
256        level = 1;
257        difficultyFactor = 1;
258        platformCount = 8;
259        spawnPlatforms();
260    }
261
262    document.addEventListener('keydown', (e) => {
263        if (['ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
264            e.preventDefault();
265        }
266        console.log(`Key pressed: ${e.key}`);
267        if (e.key === 'ArrowLeft') keys.left = true;
268        if (e.key === 'ArrowRight') keys.right = true;
269        if (e.key === 'ArrowUp' && !player.isJumping) {
270            player.dy = player.jumpPower;
271            player.isJumping = true;
272            player.onPlatform = false;
273            player.hasStarted = true;
274            player.currentPlatform = null;
275            if (!musicStarted) {
276                console.log('Attempting to play music');
277                backgroundMusic.play().catch(error => console.error('Error playing music:', error));
278                musicStarted = true;
279            }
280        }
281    });
282
283    document.addEventListener('keyup', (e) => {
284        if (e.key === 'ArrowLeft') keys.left = false;
285        if (e.key === 'ArrowRight') keys.right = false;
286    });
287
288    function gameLoop() {
289        update();
290        draw();
291        requestAnimationFrame(gameLoop);
292    }
293
294    spawnPlatforms();
295    gameLoop();
296 };
