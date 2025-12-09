export class Input {
    constructor(game) {
        this.game = game;
        this.keys = {};

        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        this.setupTouchControls();
    }

    setupTouchControls() {
        const bindButton = (id, action) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            // Handle both touch and click to support hybrid devices and testing
            const handlePress = (e) => {
                e.preventDefault(); // Prevent default touch behavior (scrolling/zoom)
                if (this.game.isGameOver && id !== 'btn-pause') return;

                if (id === 'btn-pause') {
                    this.game.togglePause();
                } else if (id === 'btn-hold') {
                    this.game.holdPiece();
                } else {
                    action();
                }
            };

            btn.addEventListener('touchstart', handlePress, { passive: false });
            btn.addEventListener('mousedown', handlePress);
        };

        bindButton('btn-left', () => this.game.moveLeft());
        bindButton('btn-right', () => this.game.moveRight());
        bindButton('btn-down', () => this.game.softDrop());
        bindButton('btn-hard-drop', () => this.game.hardDrop());
        bindButton('btn-rot-r', () => this.game.rotateRight());
        bindButton('btn-hold', () => { });
        bindButton('btn-pause', () => { });
    }

    handleKeyDown(e) {
        this.keys[e.code] = true;

        if (this.game.isGameOver) return;

        switch (e.code) {
            case 'ArrowLeft':
                this.game.moveLeft();
                break;
            case 'ArrowRight':
                this.game.moveRight();
                break;
            case 'ArrowDown':
                this.game.softDrop();
                break;
            case 'ArrowUp':
                this.game.rotateRight();
                break;
            case 'KeyZ':
                this.game.rotateLeft();
                break;
            case 'Space':
                this.game.hardDrop();
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
            case 'KeyC':
                this.game.holdPiece();
                break;
            case 'Escape':
                this.game.togglePause();
                break;
        }
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }
}
