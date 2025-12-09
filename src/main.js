import { Game } from './Game.js';

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();

    document.getElementById('start-btn').addEventListener('click', () => {
        game.handleStartButton();
    });
});
