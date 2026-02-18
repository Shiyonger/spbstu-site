import Game from './game.js';

const APP = new Game();
APP.init();

window._GAME = { STATE: APP.state, startGame: APP.startGame.bind(APP), nextLevel: APP.nextLevel.bind(APP), finishLevel: APP.finishLevel.bind(APP) };
