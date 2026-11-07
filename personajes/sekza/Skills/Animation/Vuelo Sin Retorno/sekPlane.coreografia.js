/* Coreografía (cinemática) · personaje: sekza · habilidad: Vuelo Sin Retorno (ulti, habilidad 3) · id: sekPlane
   Sekza hace un dash para agarrar a alguien (si no atrapa a nadie la habilidad solo falla: eso lo decide el movimiento sekAbduct, no esta escena).
   Si lo atrapa:
     I    GIRO       lo agarra, da vueltas cada vez mas rapido (varias) y lo lanza al cielo
     II   DESPEGUE   se agacha, abre las alas y sale volando con fuerza detras de la victima
     III  NUBES      la victima, en las nubes, intenta volar pero se asusta y solo da vueltas sin control
     IV   PAJAROS    Sekza llega y lo golpea; cruzan pajarones enormes que lo embisten uno tras otro
     V    AVION      pasa un avion: Sekza lo patea por la puerta y entra tras el
     VI   PASILLO    la victima corre por el pasillo, Sekza corre mucho mas rapido, la alcanza y la estrella contra el piso (compuerta)
     VII  CAIDA      la victima cae a toda velocidad y choca con el suelo; Sekza mira desde el avion, salta y cae de pie
   att = poses de Sekza, vic = poses de la victima, apos/vpos = [t, x(derecha), y(altura), z(adelante), giro] respecto de donde empezo la escena,
   props = el avion (con su interior) y las nubes, ev = eventos, shots = camara. Todo el avion se mueve con la funcion planeX(t). */
CF.coreografia('sekPlane', function () {
  const P = (n, o) => Object.assign({}, POSE[n], o || {});
  const S = 1, TAU2 = Math.PI * 2;
  const H = 44;                          // altura de las nubes y del avion
  const PZ = 7;                          // linea por la que pasa el avion (z de la escena)
  const FLOOR = H - 1.3;                 // piso del avion
  const T_KICK = 7.6, T_HATCH = 9.9, T_HIT = 11.0;
  // posicion del avion: llega rapido, pasa justo frente a la victima cuando la patean y se "frena" para el interior
  const planeX = t => {
    const x0 = 1.0;
    if (t <= T_KICK) return x0 + 32 * (t - T_KICK);
    const u = t - T_KICK;
    if (u <= .8) return x0 + 32 * u - (29 / 1.6) * u * u;
    return x0 + 32 * .8 - (29 / 1.6) * .64 + 3 * (u - .8);
  };
  const DOOR = -2.2;                     // la puerta esta 2.2 m detras del centro del avion (lado de la victima)
  // ---------------- poses de la victima
  const FLAIL = (i) => {                 // intenta volar: brazos que aletean, piernas pataleando y gira sin control
    const up = i % 2 === 0;
    return { ix: -i * 1.05, tx: 0, hx: .3, alx: up ? -2.7 : -.6, arx: up ? -.6 : -2.7, alz: .7, arz: -.7, llx: up ? -.9 : .6, lrx: up ? .6 : -.9, by: -1 };
  };
  const V_HELD = P('vLifted'), V_DANGLE = P('vDangle');
  const V_SCARED = P('vConfused');
  const RUN_V = P('jSprint', { hx: .35, ix: .35 });
  const V_FALL_IN = P('hurtFwd', { ix: .5, by: -2 });
  const V_DOWN = P('down');
  const V_PLUNGE = { ix: 1.1, tx: .5, hx: .2, alx: -2.9, arx: -2.9, llx: .9, lrx: .9, by: -1 };   // cae de cabeza con los brazos arriba
  // ---------------- poses de Sekza
  const A_GRAB = P('aCollar');
  const A_SPIN = P('aCollar', { ty: .4 });
  const A_CROUCH = P('charge', { by: -6, ix: .35, tx: .3, alx: -.4, arx: -.4, alz: .9, arz: -.9, llx: -1.1, lrx: -1.1 });   // se agacha con las alas abiertas
  const A_LAUNCH = P('castUp', { ix: -.35, tx: -.3, llx: .6, lrx: .6 });
  const A_FLY = { ix: .9, tx: .3, by: 0, hx: -.4, alx: -.2, arx: -.2, alz: .5, arz: -.5, llx: .35, lrx: .35 };      // vuela como flecha, inclinado
  const A_HOVER = P('ninja', { by: -1, alz: .6, arz: -.6 });
  const A_PUNCH_R = P('jabR', { ix: .2 }), A_PUNCH_L = P('jabL', { ix: .2 }), A_HOOK = P('hook'), A_KICK = P('kick');
  const A_RUN = P('jSprint', { ix: .6 });
  const A_CATCH = P('aCatch');
  const A_SLAM = P('slamDown');
  const A_LOOK = P('point', { hx: .6, ix: .15 });
  const A_DIVE = P('jDive', { ix: 1.3 });
  const A_LAND = P('land', { by: -7, ix: .45, tx: .3, alx: -.6, arx: .3, llx: -1.3, lrx: -.2 });
  const A_HERO = P('ninja');
  // ---------------- recorridos
  const att = [], vic = [], apos = [], vpos = [];
  const R = 1.5;
  // I-II. AGARRE, GIRO Y LANZAMIENTO: es la película de BBS (Agarrarecena1), que empieza en el tick 19 del dash (ver sekAbduct.js).
  //   Sekza usa el clip agarrar_sekza y la víctima agarrar_victima; sus recorridos y la cámara salen de la película (tools/bbs_escena.py).
  //   La película termina con los dos subiendo al cielo: unas nubes los tapan (cloudBank) y ahí se pasa, sin que se note, a la escena de las nubes.
  // <<BBS-ESCENA1  (generado por tools/bbs_escena.py a partir de Agarrarecena1.dat: no editar a mano)
  const BB_APOS = [[0.0,-0.0,0.472,0.0,0.0],[0.05,-0.0,0.508,0.928,0.0],[0.1,-0.0,0.347,1.529,0.0],[0.15,-0.0,0.168,2.109,0.0],[0.2,-0.0,0.089,2.28,0.0],[0.25,-0.0,0.03,2.351,0.0],[0.3,-0.0,-0.006,2.391,0.0],[0.35,-0.0,-0.01,2.396,0.0],[0.4,-0.0,-0.012,2.4,0.0],[0.45,-0.0,-0.015,2.402,0.0],[0.5,-0.0,-0.016,2.403,0.0],[0.55,-0.0,-0.018,2.402,0.0],[0.6,-0.0,-0.018,2.401,0.0],[0.65,-0.0,-0.019,2.399,0.0],[0.7,-0.0,-0.019,2.397,0.0],[0.75,-0.0,-0.018,2.394,0.0],[0.8,-0.0,-0.018,2.39,0.0],[0.85,-0.0,-0.017,2.387,0.0],[0.9,-0.0,-0.016,2.383,0.0],[0.95,-0.0,-0.015,2.38,0.0],[1.0,-0.0,-0.014,2.377,0.0],[1.05,-0.0,-0.013,2.374,0.0],[1.1,-0.0,-0.012,2.373,0.0],[1.15,-0.0,-0.011,2.371,0.0],[1.2,-0.0,-0.009,2.371,0.0],[1.25,-0.0,-0.008,2.372,0.0],[1.3,-0.0,-0.007,2.375,0.0],[1.35,-0.0,-0.007,2.378,0.0],[1.4,-0.0,-0.006,2.384,0.0],[1.45,-0.0,-0.006,2.391,0.0],[1.5,-0.0,-0.006,2.444,0.0],[1.55,-0.0,-0.006,2.52,0.0],[1.6,-0.0,-0.006,2.61,0.0],[1.65,-0.0,-0.006,2.705,0.0],[1.7,-0.0,-0.006,2.796,0.0],[1.75,-0.0,-0.006,2.872,0.0],[1.8,-0.0,-0.006,2.925,0.0],[1.85,-0.0,-0.006,2.925,0.0],[1.9,-0.0,-0.006,2.925,0.0],[1.95,-0.0,-0.006,2.925,0.0],[2.0,-0.0,-0.006,2.925,0.0],[2.05,-0.0,-0.006,2.925,0.0],[2.1,-0.0,-0.006,2.925,0.0],[2.15,-0.0,-0.006,2.925,0.0],[2.2,-0.0,-0.006,2.925,0.0],[2.25,-0.0,-0.006,2.925,0.0],[2.3,-0.0,-0.006,2.925,0.0],[2.35,-0.0,-0.006,2.925,0.0],[2.4,-0.0,-0.006,2.925,0.0],[2.45,-0.0,-0.006,2.925,0.0],[2.5,-0.0,-0.045,2.925,0.0],[2.55,-0.0,-0.1,2.925,0.0],[2.6,-0.0,-0.165,2.925,0.0],[2.65,-0.0,-0.231,2.925,0.0],[2.7,-0.0,-0.293,2.925,0.0],[2.75,-0.0,-0.344,2.925,0.0],[2.8,-0.0,-0.408,2.925,0.0],[2.85,-0.0,-0.468,2.925,0.0],[2.9,-0.0,-0.519,2.925,0.0],[2.95,-0.0,-0.559,2.925,0.0],[3.0,-0.019,0.088,2.437,0.0],[3.05,-0.057,1.392,1.471,0.0],[3.1,-0.103,2.997,0.285,0.0],[3.15,-0.156,4.844,-1.079,0.0],[3.2,-0.214,6.877,-2.579,0.0],[3.25,-0.276,9.037,-4.171,0.0],[3.3,-0.34,11.265,-5.813,0.0],[3.35,-0.405,13.503,-7.462,0.0],[3.4,-0.467,15.694,-9.077,0.0],[3.45,-0.527,17.779,-10.614,0.0],[3.5,-0.582,19.701,-12.03,0.0],[3.55,-0.631,21.4,-13.284,0.0],[3.6,-0.672,22.819,-14.332,0.0],[3.65,-0.703,23.9,-15.131,0.0]];
  const BB_VPOS = [[0.0,-0.0,0.0,1.778,3.142],[0.05,-0.0,0.066,1.41,3.142],[0.1,-0.0,0.084,1.692,3.142],[0.15,-0.0,-0.183,2.129,3.142],[0.2,-0.0,-0.45,2.566,3.142],[0.25,-0.0,-0.45,2.566,3.142],[0.3,-0.0,-0.45,2.566,3.142],[0.35,-0.0,-0.45,2.566,3.142],[0.4,-0.0,-0.45,2.566,3.142],[0.45,-0.0,-0.45,2.566,3.142],[0.5,-0.0,-0.45,2.566,3.142],[0.55,-0.0,-0.45,2.566,3.142],[0.6,-0.0,-0.45,2.566,3.142],[0.65,-0.0,-0.45,2.566,3.142],[0.7,-0.0,-0.45,2.566,3.142],[0.75,-0.0,-0.45,2.566,3.142],[0.8,-0.0,-0.45,2.566,3.142],[0.85,-0.0,-0.45,2.566,3.142],[0.9,-0.0,-0.45,2.566,3.142],[0.95,-0.0,-0.45,2.566,3.142],[1.0,-0.0,-0.45,2.566,3.142],[1.05,-0.0,-0.45,2.566,3.142],[1.1,-0.0,-0.45,2.566,3.142],[1.15,-0.0,-0.45,2.566,3.142],[1.2,-0.0,-0.45,2.566,3.142],[1.25,-0.0,-0.45,2.566,3.142],[1.3,-0.0,-0.45,2.566,3.142],[1.35,-0.0,-0.45,2.566,3.142],[1.4,-0.003,-0.45,2.564,3.142],[1.45,-0.011,-0.449,2.559,3.142],[1.5,-0.021,-0.448,2.554,3.142],[1.55,-0.033,-0.446,2.548,3.142],[1.6,-0.045,-0.445,2.541,3.142],[1.65,-0.057,0.529,1.913,3.142],[1.7,-0.07,1.762,1.119,3.142],[1.75,-0.082,3.219,0.182,3.142],[1.8,-0.095,4.866,-0.876,3.142],[1.85,-0.107,6.669,-2.034,3.142],[1.9,-0.12,8.592,-3.268,3.142],[1.95,-0.132,10.602,-4.558,3.142],[2.0,-0.144,12.663,-5.88,3.142],[2.05,-0.155,14.742,-7.214,3.142],[2.1,-0.165,16.803,-8.535,3.142],[2.15,-0.175,18.812,-9.824,3.142],[2.2,-0.183,20.735,-11.056,3.142],[2.25,-0.191,22.537,-12.211,3.142],[2.3,-0.197,24.184,-13.265,3.142],[2.35,-0.201,25.64,-14.198,3.142],[2.4,-0.199,26.872,-14.983,3.142],[2.45,-0.197,27.844,-15.603,3.142],[2.5,-0.197,27.844,-15.603,3.142],[2.55,-0.197,27.844,-15.603,3.142],[2.6,-0.197,27.844,-15.603,3.142],[2.65,-0.197,27.844,-15.603,3.142],[2.7,-0.197,27.844,-15.603,3.142],[2.75,-0.197,27.844,-15.603,3.142],[2.8,-0.197,27.844,-15.603,3.142],[2.85,-0.197,27.844,-15.603,3.142],[2.9,-0.197,27.844,-15.603,3.142],[2.95,-0.197,27.844,-15.603,3.142],[3.0,-0.197,27.844,-15.603,3.142],[3.05,-0.197,27.844,-15.603,3.142],[3.1,-0.197,27.844,-15.603,3.142],[3.15,-0.197,27.844,-15.603,3.142]];
  const BB_CAM = [[0.0,1.819,1.148,2.021,-89.722,1.206,13.429,70.0],[0.05,1.819,1.148,2.021,-89.722,1.206,13.429,70.0],[0.075,1.844,1.121,2.14,-88.03,1.688,14.846,70.0],[0.1,1.889,1.084,2.305,-84.975,2.511,17.344,70.0],[0.125,1.937,1.039,2.5,-81.712,3.408,20.036,70.0],[0.15,1.969,0.992,2.71,-79.393,4.115,22.035,70.0],[0.175,1.967,0.946,2.92,-79.172,4.364,22.456,70.0],[0.2,1.913,0.906,3.113,-82.202,3.892,20.412,70.0],[0.225,1.827,0.879,3.252,-87.381,2.87,16.224,70.0],[0.25,1.706,0.853,3.394,-94.895,1.304,9.626,70.0],[0.275,1.56,0.827,3.539,-104.051,-0.634,1.533,70.0],[0.3,1.397,0.802,3.682,-114.157,-2.771,-7.144,70.0],[0.325,1.229,0.778,3.821,-124.517,-4.936,-15.493,70.0],[0.35,1.064,0.756,3.953,-134.441,-6.954,-22.601,70.0],[0.375,0.913,0.735,4.075,-143.233,-8.654,-27.554,70.0],[0.4,0.784,0.716,4.184,-150.201,-9.864,-29.442,70.0],[0.425,0.695,0.703,4.263,-154.573,-10.451,-28.343,70.0],[0.45,0.609,0.69,4.338,-158.404,-10.793,-25.251,70.0],[0.475,0.527,0.679,4.407,-161.741,-10.941,-20.596,70.0],[0.5,0.449,0.669,4.472,-164.635,-10.942,-14.809,70.0],[0.525,0.376,0.659,4.531,-167.133,-10.845,-8.319,70.0],[0.55,0.308,0.65,4.585,-169.284,-10.7,-1.558,70.0],[0.575,0.246,0.642,4.633,-171.137,-10.556,5.046,70.0],[0.6,0.189,0.635,4.676,-172.741,-10.46,11.061,70.0],[0.625,0.14,0.628,4.714,-174.145,-10.462,16.058,70.0],[0.65,0.097,0.621,4.745,-175.397,-10.611,19.606,70.0],[0.675,0.072,0.616,4.763,-176.108,-10.845,21.343,70.036],[0.7,0.051,0.612,4.776,-176.558,-11.189,22.745,70.134],[0.725,0.034,0.609,4.784,-176.782,-11.616,23.841,70.276],[0.75,0.021,0.605,4.789,-176.815,-12.103,24.662,70.446],[0.775,0.011,0.602,4.791,-176.689,-12.623,25.235,70.628],[0.8,0.004,0.599,4.79,-176.439,-13.151,25.591,70.803],[0.825,0.0,0.597,4.786,-176.099,-13.663,25.76,70.957],[0.85,-0.002,0.595,4.782,-175.703,-14.132,25.771,71.071],[0.875,-0.003,0.593,4.777,-175.285,-14.533,25.653,71.13],[0.9,-0.003,0.591,4.771,-174.879,-14.842,25.436,71.116],[0.925,-0.001,0.589,4.765,-174.519,-15.032,25.15,71.013],[0.95,0.0,0.588,4.761,-174.239,-15.079,24.825,70.803],[0.975,0.002,0.586,4.758,-174.072,-14.957,24.488,70.471],[1.0,0.002,0.585,4.757,-174.054,-14.64,24.172,70.0],[1.025,0.003,0.584,4.757,-174.113,-14.11,23.878,69.418],[1.05,0.003,0.583,4.757,-174.176,-13.291,23.519,68.65],[1.075,0.003,0.582,4.756,-174.245,-12.232,23.092,67.724],[1.1,0.003,0.581,4.755,-174.325,-10.981,22.598,66.67],[1.125,0.004,0.581,4.754,-174.418,-9.587,22.036,65.517],[1.15,0.005,0.58,4.753,-174.527,-8.1,21.407,64.295],[1.175,0.007,0.58,4.752,-174.657,-6.567,20.709,63.032],[1.2,0.011,0.58,4.751,-174.81,-5.039,19.942,61.758],[1.225,0.016,0.58,4.75,-174.989,-3.562,19.105,60.503],[1.25,0.022,0.58,4.749,-175.199,-2.187,18.2,59.295],[1.275,0.031,0.58,4.748,-175.442,-0.962,17.224,58.164],[1.3,0.041,0.581,4.748,-175.722,0.064,16.177,57.14],[1.325,0.054,0.582,4.748,-176.042,0.843,15.06,56.251],[1.35,0.069,0.583,4.749,-176.406,1.325,13.872,55.527],[1.375,0.087,0.584,4.75,-176.816,1.463,12.612,54.997],[1.4,0.108,0.585,4.752,-177.277,1.206,11.28,54.691],[1.425,0.153,0.589,4.756,-178.227,-0.125,8.587,54.662],[1.45,0.21,0.597,4.76,-179.464,-2.462,5.069,55.102],[1.475,0.277,0.607,4.766,-180.904,-5.573,1.002,55.915],[1.5,0.351,0.618,4.772,-182.464,-9.228,-3.337,57.007],[1.525,0.427,0.628,4.779,-184.058,-13.196,-7.671,58.283],[1.55,0.503,0.637,4.787,-185.605,-17.248,-11.725,59.648],[1.575,0.574,0.642,4.795,-187.019,-21.153,-15.222,61.006],[1.6,0.637,0.644,4.803,-188.217,-24.68,-17.885,62.263],[1.625,0.689,0.64,4.812,-189.116,-27.6,-19.438,63.323],[1.65,0.726,0.629,4.821,-189.631,-29.68,-19.606,64.091],[1.675,0.737,0.621,4.826,-189.721,-30.335,-19.133,64.348],[1.7,0.746,0.611,4.831,-189.725,-30.864,-18.297,64.582],[1.725,0.752,0.599,4.836,-189.652,-31.279,-17.132,64.795],[1.75,0.756,0.586,4.841,-189.509,-31.588,-15.67,64.988],[1.775,0.757,0.571,4.847,-189.303,-31.802,-13.945,65.163],[1.8,0.757,0.554,4.853,-189.04,-31.931,-11.99,65.32],[1.825,0.756,0.537,4.859,-188.73,-31.985,-9.837,65.46],[1.85,0.752,0.519,4.865,-188.378,-31.973,-7.521,65.586],[1.875,0.748,0.5,4.871,-187.992,-31.906,-5.073,65.698],[1.9,0.742,0.48,4.877,-187.579,-31.793,-2.527,65.798],[1.925,0.736,0.461,4.884,-187.147,-31.644,0.084,65.887],[1.95,0.729,0.441,4.89,-186.703,-31.47,2.727,65.967],[1.975,0.722,0.422,4.896,-186.253,-31.279,5.368,66.038],[2.0,0.714,0.403,4.902,-185.806,-31.083,7.976,66.101],[2.025,0.706,0.384,4.907,-185.369,-30.89,10.516,66.159],[2.05,0.699,0.366,4.913,-184.948,-30.712,12.956,66.213],[2.075,0.692,0.35,4.918,-184.552,-30.557,15.262,66.263],[2.1,0.685,0.334,4.922,-184.187,-30.436,17.402,66.311],[2.125,0.68,0.32,4.927,-183.86,-30.358,19.342,66.358],[2.15,0.675,0.307,4.931,-183.58,-30.334,21.049,66.406],[2.175,0.671,0.296,4.934,-183.352,-30.373,22.491,66.456],[2.2,0.669,0.288,4.937,-183.186,-30.486,23.635,66.509],[2.225,0.667,0.274,4.942,-182.954,-30.973,25.351,66.586],[2.25,0.666,0.266,4.944,-182.837,-31.706,26.277,66.59],[2.275,0.665,0.263,4.946,-182.817,-32.602,26.567,66.542],[2.3,0.665,0.263,4.945,-182.872,-33.578,26.374,66.463],[2.325,0.666,0.266,4.944,-182.984,-34.548,25.85,66.374],[2.35,0.667,0.271,4.943,-183.134,-35.43,25.149,66.296],[2.375,0.668,0.277,4.941,-183.302,-36.139,24.424,66.249],[2.4,0.668,0.282,4.939,-183.469,-36.592,23.828,66.255],[2.425,0.669,0.286,4.938,-183.616,-36.705,23.514,66.334],[2.45,0.669,0.288,4.937,-183.723,-36.394,23.635,66.509],[2.475,0.669,0.288,4.937,-183.797,-35.73,24.036,66.715],[2.5,0.669,0.288,4.937,-183.883,-34.7,24.572,66.956],[2.525,0.669,0.288,4.937,-183.979,-33.373,25.217,67.228],[2.55,0.669,0.288,4.937,-184.081,-31.819,25.942,67.533],[2.575,0.669,0.288,4.937,-184.187,-30.106,26.722,67.87],[2.6,0.669,0.288,4.937,-184.293,-28.304,27.529,68.237],[2.625,0.669,0.288,4.937,-184.398,-26.481,28.336,68.636],[2.65,0.669,0.288,4.937,-184.499,-24.707,29.115,69.065],[2.675,0.669,0.288,4.937,-184.591,-23.05,29.841,69.524],[2.7,0.669,0.288,4.937,-184.674,-21.579,30.486,70.012],[2.725,0.669,0.288,4.937,-184.743,-20.365,31.022,70.529],[2.75,0.669,0.288,4.937,-184.797,-19.474,31.423,71.074],[2.775,0.669,0.288,4.937,-184.874,-18.507,31.796,72.169],[2.8,0.669,0.288,4.937,-184.961,-17.743,31.971,73.649],[2.825,0.669,0.288,4.937,-185.041,-17.22,31.994,75.322],[2.85,0.669,0.288,4.937,-185.099,-16.973,31.91,77.0],[2.875,0.669,0.288,4.937,-185.12,-17.039,31.765,78.49],[2.9,0.669,0.288,4.937,-185.086,-17.454,31.606,79.604],[2.925,0.669,0.288,4.937,-184.984,-18.253,31.476,80.15],[2.95,0.669,0.288,4.937,-184.797,-19.474,31.423,79.937],[2.975,0.669,0.288,4.937,-184.344,-22.255,31.423,78.123],[3.0,0.669,0.288,4.937,-183.683,-26.318,31.423,74.864],[3.025,0.669,0.288,4.937,-182.917,-31.023,31.423,70.823],[3.05,0.669,0.288,4.937,-182.151,-35.728,31.423,66.658],[3.075,0.669,0.288,4.937,-181.49,-39.791,31.423,63.03],[3.1,0.669,0.288,4.937,-181.037,-42.572,31.423,60.6]];
  // BBS-ESCENA1>>
  const faceYaw = (dx, dz) => Math.atan2(-dx, dz);   // giro para mirar hacia (dx derecha, dz adelante)
  const Y1 = 0, YW = Y1 - 1.57, V0 = Y1 + 31.4159;   // YW: Sekza mirando a la nariz del avion (giro + = mira a su izquierda); V0: giro acumulado de la victima (multiplo de 2π)
  const T_FILM = 3.65, T_VFILM = 3.15, T_CLOUD = 4.0;   // duración del clip de Sekza / de la víctima, y cuándo ya están dentro de las nubes
  BB_APOS.forEach(k => apos.push(k)); BB_VPOS.forEach(k => vpos.push(k));
  // al terminar la película se quedan en lo alto; dentro de las nubes (tapados) pasan a donde empieza la escena de las nubes
  vpos.push([T_CLOUD, 1.4, 44.6, 9.6, Y1 + 13]);
  apos.push([4.3, 2.6, 44.3, 7.4, Y1]);
  att.push([T_FILM, A_FLY], [4.3, A_HOVER]);
  vic.push([T_VFILM, FLAIL(0)], [3.6, FLAIL(1)]);
  // III. la victima en las nubes (4.0 - 5.0): intenta volar, se asusta, da vueltas
  for (let k = 0, t = T_CLOUD; t < 5.0; t += .18, k++) vic.push([+t.toFixed(2), FLAIL(k + 3)]);
  // IV. golpes y pajarones (5.0 - 7.2)
  const base = [1.2, 44.5, 9.6], hits = [[5.1, [.9, .5, .8], 'jabR'], [5.5, [-.9, -.3, .6], 'jabL'], [5.9, [.3, .9, -.9], 'hook'], [6.3, [-.8, .2, -.7], 'kick'], [6.7, [.6, -.6, .9], 'jabR']];
  vpos.push([4.8, base[0], base[1], base[2], Y1 + 15]);
  hits.forEach(([t, d], i) => {
    vpos.push([t, base[0] + d[0], base[1] + d[1], base[2] + d[2], Y1 + 17 + i * 2.6], [t + .32, base[0] + d[0] * .4, base[1] + d[1] * .4, base[2] + d[2] * .4, Y1 + 18 + i * 2.6]);
  });
  apos.push([4.8, 2.6, 44.5, 7.5, Y1]);
  hits.forEach(([t, , pose]) => { apos.push([t - .1, 2.6, 44.5, 7.6, Y1], [t + .15, 3.2, 44.6, 8.3, Y1]); att.push([t - .12, pose === 'kick' ? P('kick_w') : P(pose + '_w')], [t, P(pose)]); });
  att.push([4.9, A_HOVER], [6.9, A_HOVER]);
  // en los golpes Sekza siempre mira a la victima (con donde esta ella en ese momento)
  { const vs = vpos.slice().sort((a, b) => a[0] - b[0]);
    const vAt = t => { let k = 0; for (let i = 0; i < vs.length; i++) if (vs[i][0] <= t) k = i; const a = vs[k], b = vs[Math.min(k + 1, vs.length - 1)], u = b[0] > a[0] ? Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0]))) : 0; return [a[1] + (b[1] - a[1]) * u, a[3] + (b[3] - a[3]) * u]; };
    apos.forEach(k => { if (k[0] >= 4.75 && k[0] <= 7.0) { const [vx, vz] = vAt(k[0]); k[4] = faceYaw(vx - k[1], vz - k[3]); } }); }
  for (let k = 0, t = 5.0; t < 7.2; t += .22, k++) vic.push([+t.toFixed(2), P(k % 2 ? 'vFlip2' : 'vSpinA')]);
  // V. el avion pasa; Sekza lo patea por la puerta (7.0 - 8.0) y entran
  const doorX = planeX(T_KICK) + DOOR;   // x de la puerta cuando la patean
  apos.push([7.3, doorX - 1.5, 44.4, 9.4, faceYaw(1.7, 1.9)], [T_KICK - .05, doorX + .2, 44.3, 11.3, Y1 + 3.14]);   // se coloca detras de la victima, del lado contrario al avion
  // dentro del avion (a partir de 7.95 todo se mide respecto del avion)
  const inP = (t, lx, ly, lz) => [+t.toFixed(2), planeX(t) + lx, FLOOR + ly, PZ + lz];   // lx: a lo largo del avion (+ = nariz)
  // la victima sale disparada de la patada y cae dentro, deslizandose
  vpos.push([T_KICK, doorX, 44.4, 9.2, Y1 + 30], [7.85, planeX(7.85) + DOOR + .2, FLOOR + 1.2, PZ + .9, V0]);
  const push2 = (arr, t, lx, ly, lz, yw) => arr.push([...inP(t, lx, ly, lz), yw]);
  push2(vpos, 8.1, DOOR + .4, 0, 0, V0 + 1.6); push2(vpos, 8.4, DOOR + 1.0, 0, 0, V0 + 1.57);
  // se levanta y corre por el pasillo hacia la nariz (+x)
  for (let t = 8.6; t <= 9.4001; t += .1) push2(vpos, t, DOOR + 1.0 + (t - 8.6) * 5.6, 0, 0, V0 + 1.57);
  // Sekza entra, se levanta y corre MUCHO mas rapido
  apos.push([T_KICK + .1, doorX + .6, 44.2, 10.4, Y1 + 3.14]);
  push2(apos, 8.0, DOOR - .3, 0, 0, YW); push2(apos, 8.8, DOOR - .4, 0, 0, YW);
  for (let t = 8.9; t <= 9.4001; t += .1) push2(apos, t, DOOR - .4 + (t - 8.9) * 10.4, 0, 0, YW);   // la alcanza justo en 9.4 (queda medio metro detras)
  // la agarra, la empuja unos pasos y la estrella contra el piso por la compuerta
  push2(apos, 9.6, 5.0, 0, 0, YW); push2(apos, T_HATCH, 6.6, 0, 0, YW); push2(apos, T_HATCH + .3, 6.7, 0, 0, YW); push2(apos, 10.5, 6.7, 0, 0, YW);
  push2(vpos, 9.6, 5.9, 0, 0, V0 + 1.57); push2(vpos, T_HATCH - .05, 7.6, .4, 0, V0 + 1.57);
  // cae por la compuerta: aceleracion enorme hacia el suelo
  const GX = planeX(T_HATCH) + 8.0;
  for (let t = T_HATCH; t <= T_HIT + .001; t += .1) { const u = t - T_HATCH, y = Math.max(0, FLOOR - .5 * 64 * u * u); vpos.push([+t.toFixed(2), GX + u * 2, y, PZ + .2, V0 + 1.57 + u * 7]); }
  vpos.push([T_HIT + .15, GX + 2.5, 0, PZ + .2, V0 + 1.57 + 9], [13.6, GX + 2.7, 0, PZ + .2, V0 + 1.57 + 9]);
  // Sekza se queda en la compuerta, mira, y salta: cae en picada y aterriza de pie junto a la victima
  const LAND_T = 12.0, LX = GX + 6.5, LZ = PZ + 3.2;
  let A_END = faceYaw(GX + 2.7 - LX, PZ + .2 - LZ); while (A_END > YW) A_END -= Math.PI * 2;   // al aterrizar mira a la victima (girando por el lado corto)
  if (YW - A_END > Math.PI) A_END += Math.PI * 2;
  apos.push([10.9, planeX(10.9) + 6.7, FLOOR, PZ, YW], [11.3, planeX(11.3) + 6.9, FLOOR, PZ, YW]);
  for (let t = 11.4; t <= LAND_T + .001; t += .1) { const u = (t - 11.4) / (LAND_T - 11.4), e = u * u; apos.push([+t.toFixed(2), planeX(11.4) + 7 + (LX - planeX(11.4) - 7) * u, Math.max(0, FLOOR * (1 - e)), PZ + (LZ - PZ) * u, YW + (A_END - YW) * u]); }
  apos.push([LAND_T + .4, LX, 0, LZ, A_END], [13.6, LX, 0, LZ, A_END]);
  att.push([T_KICK - .2, P('kick_w')], [T_KICK, A_KICK], [7.9, A_DIVE], [8.1, A_LAND], [8.8, P('getup1')], [8.95, A_RUN], [9.4, A_RUN], [9.5, A_CATCH], [9.8, A_SLAM], [T_HATCH + .2, A_SLAM], [10.1, A_LOOK], [11.2, A_LOOK], [11.5, A_DIVE], [11.95, A_DIVE], [LAND_T + .1, A_LAND], [12.8, A_HERO]);
  vic.push([7.3, FLAIL(2)], [T_KICK, P('hurtFwd', { ix: .8 })], [7.9, V_FALL_IN], [8.2, V_DOWN], [8.5, P('getup1')], [8.7, RUN_V], [9.4, RUN_V], [9.55, P('hurtFwd', { ix: .6 })], [T_HATCH - .05, P('vDangle', { ix: 1 })], [T_HATCH + .1, V_PLUNGE], [T_HIT - .05, V_PLUNGE], [T_HIT + .2, V_DOWN], [13.6, V_DOWN]);

  // ---------------- el avion y las nubes
  const planeProp = (st) => {
    const g = new THREE.Group(), mats = [], geos = [];
    const M = (c, o) => { const m = new THREE.MeshLambertMaterial(Object.assign({ color: c, side: THREE.DoubleSide, emissive: new THREE.Color(c).multiplyScalar(.28) }, o || {})); mats.push(m); return m; };
    const B = (w, h, d, m, x, y, z, par) => { const ge = new THREE.BoxGeometry(w, h, d); geos.push(ge); const me = new THREE.Mesh(ge, m); me.position.set(x, y, z); (par || g).add(me); return me; };
    const white = M(0xf2f5f8), grey = M(0xaab4c2), blue = M(0x2f6fd0), dark = M(0x2a2f3a), red = M(0xd9363e), floor = M(0x6b7585), seat = M(0x2f6fd0), seat2 = M(0x3b4a66), glass = M(0xaee6ff, { emissive: new THREE.Color(0xaee6ff).multiplyScalar(.9) });
    // cabina: z de -12 a 10, ancho 3.6, alto 3 (suelo en y = -1.3); la pared de la puerta es la -X
    const Z0 = -12, Z1 = 10, W = 3.6, HH = 3.0, LENG = Z1 - Z0, CZ = (Z0 + Z1) / 2;
    const hatchGap = [3.6, 5.2];
    B(W, .16, 3.6 - Z0, floor, 0, -1.38, (Z0 + hatchGap[0]) / 2);                                  // piso (parte de atras)
    B(W, .16, Z1 - hatchGap[1], floor, 0, -1.38, (hatchGap[1] + Z1) / 2);                          // piso (parte de adelante)
    const hatch = B(W, .16, hatchGap[1] - hatchGap[0], red, 0, -1.38, (hatchGap[0] + hatchGap[1]) / 2);   // compuerta
    B(W, .12, LENG, white, 0, 1.5, CZ);                                                                // techo
    B(.12, HH, LENG, white, W / 2, 0, CZ);                                                             // pared +X (sin puerta)
    B(.12, HH, (-3.3) - Z0, white, -W / 2, 0, (Z0 - 3.3) / 2);                                         // pared -X, parte de atras
    B(.12, HH, Z1 - (-1.1), white, -W / 2, 0, (Z1 - 1.1) / 2);                                         // pared -X, parte de adelante
    B(.12, 1.0, 2.2, grey, -W / 2, 1.0, -2.2); B(.12, .3, 2.2, grey, -W / 2, -1.15, -2.2);            // marco de la puerta
    B(W, HH, .12, white, 0, 0, Z0); B(W, HH, .12, white, 0, 0, Z1);                                    // mamparos
    B(W - .1, .22, LENG, blue, 0, 1.38, CZ);                                                           // franja azul del techo
    // asientos: dos y dos a cada lado, mirando a la nariz
    for (let z = -9.5; z <= 8.6; z += 1.8) {
      if (z > hatchGap[0] - 1.1 && z < hatchGap[1] + 1.1) continue;
      for (const sx of [-1.15, 1.15]) {
        for (const o of [-.4, .4]) { const xx = sx + (sx < 0 ? -o * .0 : 0) + o * .0; }
        const sm = Math.round(z) % 2 ? seat : seat2;
        B(.8, .38, .8, sm, sx, -1.0, z); B(.8, .95, .16, sm, sx, -.55, z - .38); B(.5, .12, .3, grey, sx, -.1, z - .45);
      }
    }
    // ventanillas (luces) en ambas paredes y portaequipajes
    for (let z = -10; z <= 9; z += 1.8) { for (const sx of [-1, 1]) { if (sx < 0 && z > -3.7 && z < -.7) continue; B(.05, .45, .6, glass, sx * (W / 2 - .06), .35, z); B(.45, .25, 1.4, grey, sx * 1.35, 1.15, z); } }
    const glowW = new THREE.MeshBasicMaterial({ color: 0xfff6d8 }), glowO = new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: .85, depthWrite: false }), trailM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .4, depthWrite: false }), lampR = new THREE.MeshBasicMaterial({ color: 0xff2a2a }), lampG = new THREE.MeshBasicMaterial({ color: 0x2aff6a });
    mats.push(glowW, glowO, trailM, lampR, lampG);
    // ---- exterior del avion (grande): fuselaje redondo que solo se ve desde afuera (por dentro se ve la cabina), con huecos de verdad en la puerta y en la compuerta,
    //      nariz con cabina de mando, cola levantada con aleta alta, alas en flecha hacia atras con winglets, dos motores grandes con helice y fuego, ventanillas y franjas
    const FS = { side: THREE.FrontSide }, skin = M(0xf4f7fb, FS), skin2 = M(0xdfe6ef, FS), navy = M(0x23315e, FS), accent = M(0x7a4cff, FS), engM = M(0xc9d2de, FS), glassD = M(0x1b2a44, { emissive: new THREE.Color(0x5fb4ff).multiplyScalar(.35) });
    const RF = 2.45;
    const cyl = (r0, r1, len, z, m, t0 = 0, tl = Math.PI * 2, y = 0, x = 0) => { const ge = new THREE.CylinderGeometry(r1, r0, len, 28, 1, true, t0, tl); geos.push(ge); const me = new THREE.Mesh(ge, m); me.rotation.x = Math.PI / 2; me.position.set(x, y, z); g.add(me); return me; };
    const door0 = -3.3, door1 = -1.1;
    cyl(RF, RF, door0 - Z0, (Z0 + door0) / 2, skin);
    cyl(RF, RF, door1 - door0, (door0 + door1) / 2, skin, Math.PI * 1.5 + .75, Math.PI * 2 - 1.5);      // hueco de la puerta (lado -X)
    cyl(RF, RF, hatchGap[0] - door1, (door1 + hatchGap[0]) / 2, skin);
    cyl(RF, RF, hatchGap[1] - hatchGap[0], (hatchGap[0] + hatchGap[1]) / 2, skin, .9, Math.PI * 2 - 1.8);   // hueco de la compuerta (abajo)
    cyl(RF, RF, Z1 - hatchGap[1], (hatchGap[1] + Z1) / 2, skin);
    cyl(RF, .45, 7, Z1 + 3.5, skin);                                                                        // nariz
    const tip = new THREE.Mesh((() => { const ge = new THREE.SphereGeometry(.45, 12, 8); geos.push(ge); return ge; })(), skin); tip.position.set(0, 0, Z1 + 7); g.add(tip);
    for (const sx of [-1, 0, 1]) { const gl = B(sx ? .9 : 1.1, .42, .9, glassD, sx * .85, 1.12 - Math.abs(sx) * .12, Z1 + 2.7); gl.rotation.x = -.42; gl.rotation.z = -sx * .35; }   // cristales de la cabina de mando
    cyl(.7, RF, 8, Z0 - 4, skin, 0, Math.PI * 2, .55);                                                       // cola (sube un poco)
    const fin = B(.32, 6.2, 4.2, skin, 0, 4.3, Z0 - 6.2); fin.rotation.x = -.5; B(.36, 2.2, 2.6, accent, 0, 5.6, Z0 - 7.4).rotation.x = -.5;   // aleta alta con el color de Sekza
    for (const sx of [-1, 1]) { const hs = B(7.5, .26, 2.6, skin, sx * 4.2, 1.0, Z0 - 7.2); hs.rotation.y = sx * .32; }
    // ventanillas y franjas (por fuera)
    for (let z = Z0 + 1; z <= Z1 - .6; z += 1.1) for (const sx of [-1, 1]) { if (sx < 0 && z > door0 - .5 && z < door1 + .5) continue; B(.06, .38, .48, glassD, sx * 2.41, .45, z); }
    for (const sx of [-1, 1]) { B(.06, .22, LENG + 5, navy, sx * 2.44, -.25, CZ + 2.5); B(.06, .1, LENG + 5, accent, sx * 2.43, .02, CZ + 2.5); }
    // alas en flecha hacia atras, con un poco de diedro, flaps y winglets
    const fans = [], blinkers = [];
    for (const sx of [-1, 1]) {
      const w = B(15, .42, 5.6, skin, sx * 9.6, -1.35, -1.2); w.rotation.y = sx * .36; w.rotation.z = sx * .06;
      const fl = B(13, .2, 1.1, skin2, sx * 9.3, -1.45, -4.3); fl.rotation.y = sx * .36; fl.rotation.z = sx * .06;
      const tipX = 9.6 + 7.5 * Math.cos(.36), tipZ = -1.2 - 7.5 * Math.sin(.36);
      const wl = B(.24, 2.2, 1.7, accent, sx * (tipX + .1), -.4, tipZ - .3); wl.rotation.z = sx * -.25;
      blinkers.push(B(.32, .32, .32, sx < 0 ? lampR : lampG, sx * (tipX + .2), -1.25, tipZ + .4));
      // motor bajo el ala: gondola, toma de aire, helice, pilón, fuego y estela
      const ex = sx * 6.6, ey = -2.75, ez = .4;
      cyl(1.15, 1.0, 4.4, ez, engM, 0, Math.PI * 2, ey, ex);
      cyl(1.18, 1.18, .35, ez + 2.1, navy, 0, Math.PI * 2, ey, ex);
      B(.32, 1.3, 2.6, skin, ex, -1.95, ez - .2);
      const fan = new THREE.Group(); fan.position.set(ex, ey, ez + 2.0); g.add(fan);
      for (let i = 0; i < 6; i++) { const bl = B(1.9, .16, .06, dark, 0, 0, 0, fan); bl.rotation.z = i * Math.PI / 6; }
      B(.5, .5, .3, dark, 0, 0, .05, fan);
      fans.push(fan);
      const flame = new THREE.Mesh((() => { const ge = new THREE.ConeGeometry(.7, 2.0, 12); geos.push(ge); return ge; })(), glowO); flame.rotation.x = -Math.PI / 2; flame.position.set(ex, ey, ez - 3.2); g.add(flame);
      B(.6, .6, 60, trailM, ex, ey, ez - 33);
    }
    B(.45, .05, LENG - 1, glowW, -.9, 1.43, CZ); B(.45, .05, LENG - 1, glowW, .9, 1.43, CZ);
    g.visible = false; scene.add(g);
    const R = rightOf(st.yaw); g.rotation.y = Math.atan2(R.x, R.z);
    // nubes (billboards) alrededor de la zona de la pelea
    const cvs = document.createElement('canvas'); cvs.width = cvs.height = 128; const c = cvs.getContext('2d');
    for (let i = 0; i < 9; i++) { const x = 30 + Math.random() * 68, y = 44 + Math.random() * 40, r = 22 + Math.random() * 30, gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.55, 'rgba(245,250,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
    const ctex = new THREE.CanvasTexture(cvs), clouds = new THREE.Group(); scene.add(clouds);
    const NC = Math.max(14, Math.round(34 * [1, .75, .5, .3, .15][GFX.level | 0]));   // menos nubes en graficos bajos
    for (let i = 0; i < NC; i++) { const m = new THREE.SpriteMaterial({ map: ctex, transparent: true, opacity: .3 + Math.random() * .3, depthWrite: false, fog: false }); mats.push(m); const sp = new THREE.Sprite(m), s = 26 + Math.random() * 38; sp.scale.set(s, s * .6, 1); const yy = Math.random() < .5 ? 12 + Math.random() * 20 : 58 + Math.random() * 18; sp.position.copy(L2W(st.origin, st.yaw, -55 + Math.random() * 120, yy, -35 + Math.random() * 90)); /* las nubes quedan por debajo y por encima del avion (no entre las camaras) */ clouds.add(sp); }
    return {
      group: g,
      tick(t) {
        g.visible = t > 5.6 && t < 11.6; const px = planeX(t); g.position.copy(L2W(st.origin, st.yaw, px, H, PZ));
        fans.forEach(fn => { fn.rotation.z = t * 70; }); blinkers.forEach((b, i) => { b.visible = ((t * 2.2 + i * .5) % 1) < .5; });
        const flick = t > 8.6 && t < 9.9 && Math.random() < .2 ? .25 : 1; glowW.color.setRGB(1, .96, .85).multiplyScalar(flick);   // las luces del techo parpadean durante la persecucion
        if (t > T_KICK - .2) { const u = Math.max(0, t - 8.0); g.position.y += Math.sin(u * 3) * .06; g.rotation.z = Math.sin(u * 2.1) * .015; }
      },
      on(name) { if (name === 'hatch') hatch.visible = false; },
      dispose() { scene.remove(g); scene.remove(clouds); mats.forEach(m => m.dispose()); geos.forEach(x => x.dispose()); ctex.dispose(); },
    };
  };

  // ---------------- nubes que tapan el final de la película (los dos suben al cielo y la animación se queda quieta: entran en las nubes)
  const cloudBank = (st) => {
    const group = new THREE.Group(), mats = [], items = [];
    const cvs = document.createElement('canvas'); cvs.width = cvs.height = 128; const c = cvs.getContext('2d');
    for (let i = 0; i < 7; i++) { const x = 34 + Math.random() * 60, y = 40 + Math.random() * 50, r = 24 + Math.random() * 26, gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.97)'); gr.addColorStop(.6, 'rgba(247,251,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
    const tex = new THREE.CanvasTexture(cvs), last = a => a[a.length - 1];
    const cam = BB_CAM[BB_CAM.length - 1], pv = last(BB_VPOS), pa = last(BB_APOS);
    const camW = L2W(st.origin, st.yaw, cam[1], cam[2], cam[3]), tgtW = L2W(st.origin, st.yaw, (pv[1] + pa[1]) / 2, (pv[2] + pa[2]) / 2 + 2, (pv[3] + pa[3]) / 2);
    const N = Math.max(14, Math.round(30 * [1, .75, .5, .3, .15][GFX.level | 0]));
    for (let i = 0; i < N; i++) {
      const big = i < 9, u = big ? 1 : .35 + Math.random() * .6, j = big ? 5 : 14, p = camW.clone().lerp(tgtW, u); p.x += (Math.random() - .5) * j; p.y += (Math.random() - .5) * j * .8; p.z += (Math.random() - .5) * j;
      const m = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, fog: false }); mats.push(m);
      const sp = new THREE.Sprite(m), sz = (big ? 48 : 22) + Math.random() * 26; sp.scale.set(sz, sz * .75, 1); sp.position.copy(p); group.add(sp);
      items.push({ m, t0: 2.85 + Math.random() * .5, max: .75 + Math.random() * .25 });
    }
    scene.add(group);
    return {
      group,
      tick(t) { const out = 1 - clamp((t - 4.25) / .7, 0, 1); group.visible = t > 2.2 && out > 0; for (const it of items) it.m.opacity = it.max * clamp((t - it.t0) / .55, 0, 1) * out; },
      dispose() { scene.remove(group); mats.forEach(m => m.dispose()); tex.dispose(); },
    };
  };

  // ---------------- cielo: nubes de cubos (como las de Minecraft) que pasan, rachas de viento mientras vuelan y rachas hacia arriba alrededor de la victima en la caida
  const skyFx = (st) => {
    const group = new THREE.Group(), geos = [], mats = [], clouds = [], streaks = [], falls = [], LV = [1, .75, .5, .3, .15][GFX.level | 0];
    const cm = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xaac4e8, emissiveIntensity: .55, transparent: true, opacity: .93 }), sm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5, depthWrite: false }); mats.push(cm, sm);
    for (let i = 0, n = Math.max(8, Math.round(22 * LV)); i < n; i++) {
      const c = new THREE.Group(), nb = 4 + Math.floor(Math.random() * 5), deck = Math.random() < .5;
      for (let k = 0; k < nb; k++) { const ge = new THREE.BoxGeometry(3 + Math.random() * 5, 1.4 + Math.random() * 1.8, 3 + Math.random() * 4); geos.push(ge); const b = new THREE.Mesh(ge, cm); b.position.set((k - nb / 2) * 3.2 + Math.random() * 2, (Math.random() - .5) * 1.6, (Math.random() - .5) * 4); c.add(b); }
      c.userData = { px: -45 + Math.random() * 100, py: deck ? 27 + Math.random() * 10 : 52 + Math.random() * 10, pz: Math.random() < .5 ? -34 + Math.random() * 22 : 26 + Math.random() * 30, sp: 5 + Math.random() * 5 }; clouds.push(c); group.add(c);
    }
    for (let i = 0, n = Math.max(10, Math.round(34 * LV)); i < n; i++) { const ge = new THREE.BoxGeometry(.05, .05, 6 + Math.random() * 10); geos.push(ge); const m = new THREE.Mesh(ge, sm); m.userData = { x: -14 + Math.random() * 30, y: 38 + Math.random() * 14, z0: Math.random() * 120, v: 50 + Math.random() * 30 }; streaks.push(m); group.add(m); }
    for (let i = 0, n = Math.max(10, Math.round(28 * LV)); i < n; i++) { const ge = new THREE.BoxGeometry(.05, 5 + Math.random() * 7, .05); geos.push(ge); const m = new THREE.Mesh(ge, sm); m.userData = { ox: (Math.random() - .5) * 9, oz: (Math.random() - .5) * 9, ph: Math.random() * 40, v: 60 + Math.random() * 30 }; falls.push(m); group.add(m); }
    scene.add(group);
    return {
      group,
      tick(t) {
        const on = t > 3.9 && t < 11.2; group.visible = on; if (!on) return;
        const W = (x, y, z) => L2W(st.origin, st.yaw, x, y, z), fw = fwd(st.yaw), flying = t < 7.3, falling = t > 9.9 && t < 11.1;
        for (const c of clouds) { const u = c.userData; c.position.copy(W(((u.px + t * u.sp + 50) % 110) - 55, u.py, u.pz)); }
        for (const m of streaks) { m.visible = flying; if (!flying) continue; const u = m.userData; m.position.copy(W(u.x, u.y, 60 - ((u.z0 + (t - 4) * u.v) % 120) + 8)); m.rotation.y = Math.atan2(fw.x, fw.z); }
        for (const m of falls) { m.visible = falling; if (!falling) continue; const u = m.userData, v = st.tg.pos; m.position.set(v.x + u.ox, v.y + ((u.ph + (t - 9.9) * u.v) % 36) - 10, v.z + u.oz); }
      },
      dispose() { scene.remove(group); geos.forEach(x => x.dispose()); mats.forEach(m => m.dispose()); },
    };
  };

  const BA = [.8, -1.3, 2.2, -.4, 3.0], BS = [3.2, 3.2, 3.6, 3.6, 4], BC = [undefined, '#e8eef8', undefined, '#ffe9b0', undefined], HD = [2.5, 2.5, 3, 3, 3.5];
  const birdHits = [];
  hits.forEach(([h], i) => birdHits.push(
    { t: +(h - .28).toFixed(2), fx: 'bird', a: BA[i], sc: BS[i], col: BC[i] }, { t: +(h - .08).toFixed(2), fx: 'lines' },
    Object.assign({ t: h, hit: HD[i], fx: 'impact', at: 'vic', big: 1, shake: i > 1 ? .6 : .5 }, i === 0 ? { text: '¡PAJARÓN!', who: 'att' } : {}, i === 2 ? { imp: 1 } : {}, i === 4 ? { imp: 1, slow: .2, text: '¡Y OTRO!', who: 'att' } : {})));
  const footsteps = []; for (let t = 8.7; t < 9.45; t += .12) footsteps.push({ t: +t.toFixed(2), sfx: 'step' });
  const tidy = arr => { arr.sort((a, b) => a[0] - b[0]); for (let i = 1; i < arr.length; i++) if (arr[i][0] - arr[i - 1][0] < .002) arr[i][0] = arr[i - 1][0] + .002; return arr; };
  [att, vic, apos, vpos].forEach(tidy);
  return {
    dur: 13.6, pull: true, catch: 3, reach: 'grab',
    trails: [],
    att, vic, apos, vpos,
    attClip: 'agarrar_sekza', attClipEnd: T_FILM, vicClip: 'agarrar_victima', vicClipEnd: T_VFILM, vicR6: true,   // la película de BBS cubre hasta ahi; luego siguen las poses de att / vic
    props: [planeProp, cloudBank, skyFx],
    ev: [
      { t: .1, text: '¡TE TENGO!', who: 'att', fx: 'impact', at: 'att' },
      { t: .35, fx: 'ring', at: 'ground', r: 3.4 }, { t: .4, fx: 'dust', at: 'groundA', n: 14 },
      { t: 1.55, text: '¡AL CIELO!', who: 'att', fx: 'boom', at: 'vic', r: 2.2, imp: 1, shake: .7, slow: .15 }, { t: 1.6, fx: 'line', sfx: 'whoosh' }, { t: 1.95, fx: 'line', sfx: 'whoosh' },
      { t: 2.45, fx: 'charge', at: 'att' },
      { t: 2.95, fx: 'boom', at: 'groundA', r: 3, big: 1, shake: 1, imp: 1, text: '¡A VOLAR!', who: 'att' }, { t: 2.98, fx: 'crack', at: 'groundA', r: 4 }, { t: 3.0, fx: 'dust', at: 'groundA', n: 30 },
      { t: 3.2, fx: 'line', sfx: 'whoosh' }, { t: 3.5, fx: 'line', sfx: 'whoosh' },
      { t: 3.95, sfx: 'wind' }, { t: 4.0, fx: 'puff', at: 'vic', n: 56, v: 10, sz: .85 }, { t: 4.1, fx: 'puff', at: 'att', n: 40, v: 8, sz: .8 },
      { t: 4.15, text: '¡NO PUEDE VOLAR!', who: 'vic', fx: 'ring', at: 'vic', r: 3, face: 1 },
      { t: 4.35, fx: 'shock', at: 'att', r: 2.6 },
      { t: 4.4, text: '¡AAAAH!', who: 'vic', sfx: 'screech' },
      ...birdHits,
      { t: 6.55, sfx: 'engine' }, { t: 6.9, text: '¡UN AVIÓN!', who: 'vic' }, { t: 6.95, sfx: 'wind' },
      { t: T_KICK - .15, fx: 'lines' },
      { t: T_KICK, hit: 3, fx: 'boom', at: 'vic', r: 2.4, big: 1, imp: 1, shake: 1, slow: .2, text: '¡PUERTA!', who: 'att' }, { t: T_KICK, sfx: 'clank' }, { t: T_KICK + .05, fx: 'feathers', at: 'vic', n: 14 },
      { t: 7.9, fx: 'impact', at: 'vic', sfx: 'heavy', shake: .6 }, { t: 7.92, fx: 'puff', at: 'vic', n: 14, v: 4, sz: .5 }, { t: 8.05, sfx: 'clank' },
      { t: 8.9, text: '¡CORRE!', who: 'vic' },
      ...footsteps,
      { t: 8.95, fx: 'charge', at: 'att' }, { t: 9.0, fx: 'ghost' }, { t: 9.1, fx: 'ghost' }, { t: 9.2, fx: 'ghost' }, { t: 9.1, fx: 'lines' }, { t: 9.3, fx: 'line', sfx: 'whoosh' },
      { t: 9.45, hit: 2, fx: 'impact', at: 'vic', big: 1, imp: 1, shake: .6, text: '¡TE ALCANCÉ!', who: 'att' },
      { t: T_HATCH - .1, sfx: 'rush' },
      { t: T_HATCH, hit: 3, fx: 'boom', at: 'vic', r: 2.6, big: 1, imp: 1, shake: 1, prop: 'hatch', slow: .2, text: '¡AL SUELO!', who: 'att' }, { t: T_HATCH + .03, fx: 'puff', at: 'vic', n: 30, v: 9, sz: .6 },
      { t: 10.1, sfx: 'wind' }, { t: 10.25, fx: 'lines' }, { t: 10.5, fx: 'lines' }, { t: 10.55, sfx: 'wind' }, { t: 10.75, fx: 'lines' },
      { t: T_HIT - .02, rel: { dmg: 26, kb: 2, up: 4, rag: 2.2 }, fx: 'boom', at: 'ground', r: 4.8, big: 1, imp: 1, shake: 1.4, slow: .3 }, { t: T_HIT - .02, sfx: 'crash' }, { t: T_HIT, fx: 'crack', at: 'ground', r: 7 },
      { t: T_HIT + .03, fx: 'shock', at: 'ground', r: 5 }, { t: T_HIT + .05, fx: 'dust', at: 'ground', n: 40 }, { t: T_HIT + .06, fx: 'debris', at: 'ground', n: 50 },
      { t: 11.4, sfx: 'whoom' }, { t: 11.55, sfx: 'wind' },
      { t: LAND_T - .02, sfx: 'crash' }, { t: LAND_T, fx: 'ring', at: 'groundA', r: 5, shake: .6 }, { t: LAND_T + .02, fx: 'dust', at: 'groundA', n: 34 }, { t: LAND_T + .03, fx: 'shock', at: 'groundA', r: 4 }, { t: LAND_T + .05, fx: 'crack', at: 'groundA', r: 5 },
      { t: LAND_T + .3, text: '¡VUELO SIN RETORNO!', who: 'att' },
    ],
    shots: [
      [0, 'bb', { keys: BB_CAM }],   // la cámara de la película: sigue la acción y al final se queda mirando el cielo mientras las nubes los tapan
      // III. entran a las nubes: plano bajo hacia arriba, cara de susto, orbita cuando llega Sekza
      [3.95, 'rig', { at: 'mid', a0: 200, a1: 215, r0: 16, r1: 12, h0: -7, h1: -3, fov0: 76, fov1: 62, roll0: 10, roll1: 4, ease: 'o' }],
      [4.35, 'rig', { at: 'headV', a0: 165, a1: 150, r0: 3.0, h0: .2, fov: 38, roll0: -8 }],
      [4.8, 'rig', { at: 'A', at1: 'V', a0: 60, a1: 150, r0: 7, r1: 5.5, h0: .3, fov: 52, roll0: -6 }],
      // IV. cada golpe y cada pajaron con su plano: el ave cruza, primer plano del golpe, Sekza desde el otro lado
      [4.95, 'rig', { at: 'V', a0: 150, a1: 165, r0: 5.2, h0: .2, fov: 50, roll0: -4 }],
      [5.28, 'rig', { at: 'headV', a0: 25, a1: 15, r0: 2.6, h0: .15, fov: 34, roll0: 6 }],
      [5.42, 'rig', { at: 'A', a0: 300, a1: 320, r0: 4.2, h0: .4, fov: 58, roll0: -8 }],
      [5.7, 'rig', { at: 'V', a0: 40, a1: 55, r0: 4.6, h0: .5, fov: 46, roll0: 5 }],
      [5.95, 'rig', { at: 'mid', a0: 100, a1: 100, r0: 3.4, r1: 2.6, h0: -1.2, fov0: 60, fov1: 48, roll0: -9 }],
      [6.3, 'rig', { at: 'V', a0: 230, a1: 200, r0: 5.6, h0: 1.6, fov: 50, roll0: 7 }],
      [6.62, 'two', { fov: 54 }],
      // V. llega el avion: plano general bajo, luego Sekza lo patea
      [6.95, 'rig', { at: 'mid', a0: 100, a1: 100, r0: 30, h0: 1, fov: 56, ease: 'l' }],
      [7.4, 'rig', { at: 'V', a0: 165, a1: 160, r0: 6.5, h0: .4, fov0: 54, fov1: 44, roll0: -5 }],
      [7.75, 'rig', { at: 'V', a0: 270, a1: 270, r0: 4.6, h0: .6, fov: 62, roll0: 6 }],
      [8.2, 'rig', { at: 'V', a0: 270, a1: 270, r0: 4.6, h0: .8, fov: 58 }],
      // VI. pasillo: la victima corre (camara baja y temblorosa), Sekza la persigue (desde atras, gran angular), la alcanza
      [8.65, 'rig', { at: 'V', a0: 80, a1: 90, r0: 3.2, h0: .3, fov: 52, roll0: -3, roll1: 3 }],
      [9.0, 'rig', { at: 'A', a0: 0, a1: 10, r0: 3.0, h0: .5, fov0: 84, fov1: 72, roll0: 5, ease: 'l' }],
      [9.4, 'rig', { at: 'mid', a0: 90, a1: 90, r0: 4.4, r1: 3.8, h0: .6, fov: 54, roll0: -4 }],
      [9.85, 'rig', { at: 'V', a0: 270, a1: 270, r0: 4.8, h0: 1.0, fov: 58, roll0: 8 }],
      // VII. caida: camara sobre la victima mirando hacia abajo, luego desde Sekza, luego desde el piso
      [10.1, 'rig', { at: 'V', a0: 0, a1: 20, r0: 3.5, r1: 5, h0: 3, h1: 4, fov0: 74, fov1: 84, ease: 'l' }],
      [10.55, 'rig', { at: 'A', a0: 250, a1: 250, r0: 6, h0: -5, fov: 54, roll0: 3 }],
      [10.85, 'rig', { at: 'V', a0: 60, a1: 70, r0: 8, h0: .2, fov: 48, roll0: -4 }],
      [11.2, 'rig', { at: 'A', a0: 120, a1: 135, r0: 15, h0: 3, fov: 50 }],
      [11.65, 'rig', { at: 'A', a0: 90, a1: 150, r0: 9, r1: 7, h0: .8, h1: 1, fov: 60, ease: 'o' }],
      [12.0, 'rig', { at: 'A', a0: 200, a1: 230, r0: 5, h0: 7, ly: .8, fov: 56, roll0: 4 }],   // desde arriba: entre los edificios la camara chocaba con las paredes
      [12.75, 'rig', { at: 'mid', a0: 320, a1: 340, r0: 7, r1: 6, h0: 6.5, ly: .6, fov: 54, roll0: -3 }],
    ],
  };
});
