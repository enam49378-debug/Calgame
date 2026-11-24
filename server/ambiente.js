// Ambiente de la sala para el servidor. El código vive en js/ambiente.js (es el mismo que usa el juego); aquí solo se le pasa el mapa.
const mapa = require('./mapa.json');
module.exports = require('../js/ambiente.js').crear({ edificios: mapa.buildings, limites: () => ({ bounds: mapa.bounds, arena: mapa.radius }) });
