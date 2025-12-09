export const SHAPES = {
    I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ]
};

export const COLORS = {
    I: '#00f0ff',
    J: '#0000ff',
    L: '#ff7f00',
    O: '#ffff00',
    S: '#00ff00',
    T: '#a000f0',
    Z: '#ff0000'
};

// SRS Wall Kick Data
// [0->1, 1->2, 2->3, 3->0] (Right Rotation)
// [0->3, 3->2, 2->1, 1->0] (Left Rotation) - handled by negating/reversing index logic in Game.js
export const WALL_KICKS = {
    // J, L, S, T, Z
    JLSTZ: {
        '0-1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        '1-0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
        '1-2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        '2-1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        '2-3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
        '3-2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        '3-0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        '0-3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]
    },
    // I
    I: {
        '0-1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        '1-0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        '1-2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
        '2-1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        '2-3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        '3-2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        '3-0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        '0-3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
    },
    // O (No kicks needed, but defined for consistency if we want)
    O: {}
};

export class Tetromino {
    constructor(type) {
        this.type = type;
        this.shape = SHAPES[type];
        this.color = COLORS[type];
        this.x = 0;
        this.y = 0;
        this.rotationIndex = 0; // 0: 0deg, 1: 90deg, 2: 180deg, 3: 270deg
    }

    clone() {
        const piece = new Tetromino(this.type);
        piece.shape = this.shape.map(row => [...row]);
        piece.x = this.x;
        piece.y = this.y;
        piece.rotationIndex = this.rotationIndex;
        return piece;
    }
}
