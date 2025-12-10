import { Tetromino, SHAPES, WALL_KICKS } from './Tetromino.js';
import { Renderer } from './Renderer.js';
import { Input } from './Input.js';

export class Game {
    constructor() {
        this.renderer = new Renderer('game-canvas', 'next-canvas', 'hold-canvas');
        this.input = new Input(this);

        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.isGameOver = false;
        this.isPaused = false;

        this.lastTime = 0;
        this.dropCounter = 0;
        this.dropInterval = 1000;

        // Lock Delay variables
        this.lockDelay = 500; // 0.5s
        this.lockTimer = 0;
        this.isLocking = false;
        this.lockMovements = 0;
        this.maxLockMovements = 15;
        this.lastAction = null; // 'move' or 'rotate'

        this.bag = [];
        this.nextQueue = [];
        this.holdPieceType = null;
        this.canHold = true;

        this.fillBag();
        this.fillNextQueue();
        this.spawnPiece();

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    fillBag() {
        const types = Object.keys(SHAPES);
        // Fisher-Yates Shuffle
        for (let i = types.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [types[i], types[j]] = [types[j], types[i]];
        }
        this.bag.push(...types);
    }

    fillNextQueue() {
        while (this.nextQueue.length < 5) {
            if (this.bag.length === 0) {
                this.fillBag();
            }
            this.nextQueue.push(this.bag.shift());
        }
    }

    spawnPiece() {
        this.fillNextQueue();
        const type = this.nextQueue.shift();
        this.activePiece = new Tetromino(type);
        this.activePiece.x = 3;
        this.activePiece.y = 0; // Standard spawn usually row 21/22 (hidden), but 0 is fine for now

        this.resetLockDelay();

        // Check for immediate game over
        if (this.checkCollision()) {
            this.isGameOver = true;
            document.getElementById('overlay-title').innerText = "GAME OVER";
            document.getElementById('overlay-message').innerText = `Score: ${this.score}`;
            document.getElementById('start-btn').innerText = "RESTART";
            document.getElementById('overlay').classList.remove('hidden');
        }

        this.canHold = true;
    }

    restart() {
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.bag = [];
        this.nextQueue = [];
        this.holdPieceType = null;

        document.getElementById('score').innerText = '0';
        document.getElementById('level').innerText = '1';
        document.getElementById('lines').innerText = '0';
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('start-btn').innerText = "START GAME"; // Or just keep hidden/pause logic

        this.fillBag();
        this.fillNextQueue();
        this.spawnPiece();
    }

    handleStartButton() {
        if (this.isGameOver) {
            this.restart();
        } else {
            this.togglePause();
        }
    }

    resetLockDelay() {
        this.lockTimer = 0;
        this.isLocking = false;
        this.lockMovements = 0;
    }

    onMove() {
        if (this.isLocking && this.lockMovements < this.maxLockMovements) {
            this.lockTimer = 0;
            this.lockMovements++;
        }
        this.lastAction = 'move';
    }

    moveLeft() {
        this.activePiece.x--;
        if (this.checkCollision()) {
            this.activePiece.x++;
        } else {
            this.onMove();
        }
    }

    moveRight() {
        this.activePiece.x++;
        if (this.checkCollision()) {
            this.activePiece.x--;
        } else {
            this.onMove();
        }
    }

    softDrop() {
        this.activePiece.y++;
        if (this.checkCollision()) {
            this.activePiece.y--;
            // Soft drop doesn't lock immediately
        } else {
            this.dropCounter = 0;
            this.onMove();
        }
    }

    hardDrop() {
        while (!this.checkCollision()) {
            this.activePiece.y++;
        }
        this.activePiece.y--;

        // Hard drop effect
        this.activePiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.renderer.createParticles(this.activePiece.x + x, this.activePiece.y + y, this.activePiece.color, 5);
                }
            });
        });

        this.lockPiece();
    }

    rotate(direction) {
        const originalShape = this.activePiece.shape;
        const originalRotation = this.activePiece.rotationIndex;
        const originalX = this.activePiece.x;
        const originalY = this.activePiece.y;

        // Perform rotation
        if (direction === 1) { // Right
            this.activePiece.shape = this.activePiece.shape[0].map((val, index) =>
                this.activePiece.shape.map(row => row[index]).reverse()
            );
            this.activePiece.rotationIndex = (this.activePiece.rotationIndex + 1) % 4;
        } else { // Left
            this.activePiece.shape = this.activePiece.shape[0].map((val, index) =>
                this.activePiece.shape.map(row => row[row.length - 1 - index])
            );
            this.activePiece.rotationIndex = (this.activePiece.rotationIndex + 3) % 4;
        }

        // Check for kicks
        const kickType = this.activePiece.type === 'I' ? 'I' : (this.activePiece.type === 'O' ? 'O' : 'JLSTZ');
        if (kickType === 'O') return; // O piece doesn't kick or rotate really

        const key = `${originalRotation}-${this.activePiece.rotationIndex}`;
        const kicks = WALL_KICKS[kickType][key] || [[0, 0]];

        for (let i = 0; i < kicks.length; i++) {
            const [offsetX, offsetY] = kicks[i];
            this.activePiece.x = originalX + offsetX;
            this.activePiece.y = originalY - offsetY; // Y is inverted in kick data (up is positive there usually, but here Y down is positive)
            // Wait, standard SRS data usually has Y up as positive. My grid has Y down positive.
            // Standard SRS: (x, y) where +y is up.
            // My Grid: (x, y) where +y is down.
            // So if SRS says (0, 1) [move up 1], I should do y - 1.
            // Correct.

            if (!this.checkCollision()) {
                this.onMove();
                this.lastAction = 'rotate';
                return; // Rotation successful
            }
        }

        // If all kicks fail, revert
        this.activePiece.shape = originalShape;
        this.activePiece.rotationIndex = originalRotation;
        this.activePiece.x = originalX;
        this.activePiece.y = originalY;
    }

    rotateRight() {
        this.rotate(1);
    }

    rotateLeft() {
        this.rotate(-1);
    }

    holdPiece() {
        if (!this.canHold) return;

        if (this.holdPieceType === null) {
            this.holdPieceType = this.activePiece.type;
            this.spawnPiece();
        } else {
            const temp = this.holdPieceType;
            this.holdPieceType = this.activePiece.type;
            this.activePiece = new Tetromino(temp);
            this.activePiece.x = 3;
            this.activePiece.y = 0;
        }

        this.canHold = false;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const overlay = document.getElementById('overlay');
        if (this.isPaused) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    checkCollision() {
        for (let y = 0; y < this.activePiece.shape.length; y++) {
            for (let x = 0; x < this.activePiece.shape[y].length; x++) {
                if (this.activePiece.shape[y][x] !== 0) {
                    const boardX = this.activePiece.x + x;
                    const boardY = this.activePiece.y + y;

                    if (boardX < 0 || boardX >= 10 || boardY >= 20) {
                        return true;
                    }
                    if (boardY >= 0 && this.grid[boardY][boardX] !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    lockPiece() {
        this.activePiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const boardY = this.activePiece.y + y;
                    const boardX = this.activePiece.x + x;
                    if (boardY >= 0) {
                        this.grid[boardY][boardX] = this.activePiece.color;
                    }
                }
            });
        });

        // Check for Game Over (Top row occupied)
        if (this.grid[0].some(cell => cell !== 0)) {
            this.isGameOver = true;
            document.getElementById('overlay-title').innerText = "GAME OVER";
            document.getElementById('overlay-message').innerText = `Score: ${this.score}`;
            document.getElementById('start-btn').innerText = "RESTART";
            document.getElementById('overlay').classList.remove('hidden');
            return;
        }

        this.checkLines();
        this.spawnPiece();
    }

    /**
     * Single Player Game Logic
     * Note: This game runs entirely client-side. Multiple users on the same URL
     * play independent instances of the game. No multiplayer synchronization.
     */
    checkLines() {
        // Identify full rows first
        const fullRowIndices = [];
        this.grid.forEach((row, y) => {
            if (row.every(cell => cell !== 0)) {
                fullRowIndices.push(y);
            }
        });

        const linesCleared = fullRowIndices.length;

        if (linesCleared > 0) {
            // Effects
            fullRowIndices.forEach(y => {
                for (let x = 0; x < 10; x++) {
                    this.renderer.createParticles(x, y, '#ffffff', 10);
                }
            });

            // Rebuild grid: Keep non-full rows
            const newGrid = this.grid.filter((row, index) => !fullRowIndices.includes(index));

            // Add new empty rows at the top
            while (newGrid.length < 20) {
                newGrid.unshift(Array(10).fill(0));
            }

            this.grid = newGrid;

            this.lines += linesCleared;
            this.updateScore(linesCleared);
            this.updateLevel();
        }
    }

    updateScore(linesCleared) {
        let points = 0;
        let text = "";
        let color = "#ffffff";

        const basePoints = [0, 100, 300, 500, 800];
        points = basePoints[linesCleared] * this.level;
        if (linesCleared === 4) {
            text = "TETRIS";
            color = "#00f0ff";
        } else if (linesCleared > 0) {
            text = ["", "SINGLE", "DOUBLE", "TRIPLE"][linesCleared];
        }

        if (text) {
            this.renderer.createFloatingText(this.activePiece.x + 1, this.activePiece.y, text, color);
        }

        this.score += points;

        document.getElementById('score').innerText = this.score;
        document.getElementById('lines').innerText = this.lines;
    }

    updateLevel() {
        this.level = Math.floor(this.lines / 10) + 1;
        document.getElementById('level').innerText = this.level;

        // Speed up gravity
        this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
        // Simple linear speedup for now, can use standard curve later
    }

    update(deltaTime) {
        if (this.isPaused || this.isGameOver) return;

        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.activePiece.y++;
            if (this.checkCollision()) {
                this.activePiece.y--;
                // Touched ground
            } else {
                this.dropCounter = 0;
            }
        }

        // Lock Delay Logic
        // Check if piece is on ground
        this.activePiece.y++;
        const onGround = this.checkCollision();
        this.activePiece.y--;

        if (onGround) {
            if (!this.isLocking) {
                this.isLocking = true;
                this.lockTimer = 0;
            }
            this.lockTimer += deltaTime;
            if (this.lockTimer > this.lockDelay) {
                this.lockPiece();
            }
        } else {
            this.isLocking = false;
        }
    }

    getGhostY() {
        const ghost = this.activePiece.clone();
        while (true) {
            ghost.y++;
            // Check collision for ghost
            let collision = false;
            for (let y = 0; y < ghost.shape.length; y++) {
                for (let x = 0; x < ghost.shape[y].length; x++) {
                    if (ghost.shape[y][x] !== 0) {
                        const boardX = ghost.x + x;
                        const boardY = ghost.y + y;
                        if (boardX < 0 || boardX >= 10 || boardY >= 20 || (boardY >= 0 && this.grid[boardY][boardX] !== 0)) {
                            collision = true;
                            break;
                        }
                    }
                }
                if (collision) break;
            }
            if (collision) {
                ghost.y--;
                return ghost.y;
            }
        }
    }

    draw() {
        this.renderer.clear();
        this.renderer.drawGrid(this.grid);

        // Draw Ghost Piece
        const ghostY = this.getGhostY();
        const ghostPiece = this.activePiece.clone();
        ghostPiece.y = ghostY;
        ghostPiece.color = 'rgba(255, 255, 255, 0.2)'; // Semi-transparent white
        this.renderer.drawTetromino(ghostPiece);

        this.renderer.drawTetromino(this.activePiece);
        this.renderer.drawNextQueue(this.nextQueue);
        this.renderer.drawHoldPiece(this.holdPieceType);
    }

    loop(time = 0) {
        try {
            const deltaTime = time - this.lastTime;
            this.lastTime = time;

            this.update(deltaTime);
            this.draw();
        } catch (error) {
            console.error("Game Loop Error:", error);
            // Attempt to recover by not stopping the loop, 
            // but maybe we should reset lastTime to avoid huge delta
            this.lastTime = performance.now();
        }

        requestAnimationFrame(this.loop);
    }
}
