import { SHAPES, COLORS } from './Tetromino.js';

export class Renderer {
    constructor(canvasId, nextCanvasId, holdCanvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.nextCanvas = document.getElementById(nextCanvasId);
        this.nextCtx = this.nextCanvas.getContext('2d');

        this.holdCanvas = document.getElementById(holdCanvasId);
        this.holdCtx = this.holdCanvas.getContext('2d');

        this.cellSize = 30;
        this.cols = 10;
        this.rows = 20;

        this.particles = [];
        this.floatingTexts = [];
    }

    createFloatingText(x, y, text, color) {
        this.floatingTexts.push({
            x: x * this.cellSize,
            y: y * this.cellSize,
            text: text,
            color: color,
            life: 1.0,
            vy: -1
        });
    }

    updateFloatingTexts() {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.y += t.vy;
            t.life -= 0.02;

            if (t.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    drawFloatingTexts() {
        this.ctx.font = "bold 20px 'Outfit', sans-serif";
        this.ctx.textAlign = "center";
        this.floatingTexts.forEach(t => {
            this.ctx.globalAlpha = t.life;
            this.ctx.fillStyle = t.color;
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(t.text, t.x, t.y);
            this.ctx.fillText(t.text, t.x, t.y);
        });
        this.ctx.globalAlpha = 1.0;
    }

    createParticles(x, y, color, amount = 10) {
        for (let i = 0; i < amount; i++) {
            this.particles.push({
                x: x * this.cellSize + this.cellSize / 2,
                y: y * this.cellSize + this.cellSize / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                color: color,
                size: Math.random() * 5 + 2
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            p.size *= 0.95;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateParticles();
        this.drawParticles();
        this.updateFloatingTexts();
        this.drawFloatingTexts();
    }

    drawGrid(grid) {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (grid[y][x]) {
                    this.drawBlock(this.ctx, x, y, grid[y][x]);
                }
            }
        }
    }

    drawTetromino(piece, ctx = this.ctx, offsetX = 0, offsetY = 0) {
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.drawBlock(ctx, piece.x + x + offsetX, piece.y + y + offsetY, piece.color);
                }
            });
        });
    }

    drawBlock(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);

        // Inner bevel/highlight for "rich" look
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, 4);
        ctx.fillRect(x * this.cellSize, y * this.cellSize, 4, this.cellSize);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x * this.cellSize, (y + 1) * this.cellSize - 4, this.cellSize, 4);
        ctx.fillRect((x + 1) * this.cellSize - 4, y * this.cellSize, 4, this.cellSize);
    }

    drawNextQueue(queue) {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        queue.forEach((type, index) => {
            const shape = SHAPES[type];
            const color = COLORS[type];
            // Center the piece in the preview box
            const offsetX = (100 / this.cellSize - shape[0].length) / 2;
            const offsetY = index * 3 + 1;

            shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        this.drawBlock(this.nextCtx, offsetX + x, offsetY + y, color);
                    }
                });
            });
        });
    }

    drawHoldPiece(type) {
        this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        if (!type) return;

        const shape = SHAPES[type];
        const color = COLORS[type];
        const offsetX = (100 / this.cellSize - shape[0].length) / 2;
        const offsetY = 1;

        shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.drawBlock(this.holdCtx, offsetX + x, offsetY + y, color);
                }
            });
        });
    }
}
