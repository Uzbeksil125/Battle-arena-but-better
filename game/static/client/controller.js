'use strict';
class Controller {
  constructor() {
    this.squareWidthInPixels = 50;
    this.squareHeightInPixels = 50;
    this.squareWidthInPixels = 50;
    this.squareHeightInPixels = 50;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.playerSpriteWidth = 50;
    this.playerSpriteHeight = 50;
    this.mode = 'alive';
    this.padding = 50;
  }

  newPlayer() {
    socket.emit('new player');
    this.setupMobileControls();
  }

  emitInput() {
    setInterval(function () {
      socket.emit('input', input);
    }, 1000 / 60);
  }


  listenToUpdate() {
    socket.on('update', function (newPlayers, newCurrentPlayer, newAbsoluteCurrentPlayer, currentPlayerMap, bulletsArg, itemsArg, leaderboard2) {
      players = newPlayers;
      currentPlayer = newCurrentPlayer;
      leaderboard = leaderboard2;
      currentPlayer.xAbsolute = newAbsoluteCurrentPlayer.x;
      currentPlayer.yAbsolute = newAbsoluteCurrentPlayer.y;
      bullets = bulletsArg;
      items = itemsArg;

      for (var i = 0; i < 25; i++) {
        for (var j = 0; j < 45; j++) {
          gameMap.square[i][j].path = 'static/client/sprites/' + currentPlayerMap[i][j] + '.png';
        }
      }
    }

    );
  }

  listenToDeath() {
    socket.on('death', function () {
      controller.mode = "dead";
      const overlay = document.getElementById('deathOverlay');
      const timerSpan = document.getElementById('respawnTimer');
      overlay.style.display = 'flex';
      let countdown = 5;
      timerSpan.innerText = countdown;

      const interval = setInterval(() => {
        countdown--;
        timerSpan.innerText = countdown;
        if (countdown <= 0) {
          clearInterval(interval);
          controller.respawn();
        }
      }, 1000);
    });
  }

  respawn() {
    socket.emit('respawn');
    document.getElementById('deathOverlay').style.display = 'none';
    this.mode = 'alive';
  }

  setupMobileControls() {
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnShoot = document.getElementById('shoot-btn');

    const handleStart = (dir) => { input[dir] = true; };
    const handleEnd = (dir) => { input[dir] = false; };

    if (btnUp) {
      btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); handleStart('up'); });
      btnUp.addEventListener('touchend', (e) => { e.preventDefault(); handleEnd('up'); });
    }
    if (btnDown) {
      btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); handleStart('down'); });
      btnDown.addEventListener('touchend', (e) => { e.preventDefault(); handleEnd('down'); });
    }
    if (btnLeft) {
      btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); handleStart('left'); });
      btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); handleEnd('left'); });
    }
    if (btnRight) {
      btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); handleStart('right'); });
      btnRight.addEventListener('touchend', (e) => { e.preventDefault(); handleEnd('right'); });
    }
    if (btnShoot) {
      btnShoot.addEventListener('touchstart', (e) => { e.preventDefault(); input.LMB = true; });
      btnShoot.addEventListener('touchend', (e) => { e.preventDefault(); input.LMB = false; });
    }
  }
}



class GameMap {
  constructor() {
    this.square = [];
    this.heightInSquares = 25;
    this.widthInSquares = 45;

    for (let i = 0; i < this.heightInSquares; i++) {
      this.square[i] = [];
      for (let j = 0; j < this.widthInSquares; j++) {
        this.square[i][j] = new Terrain('static/client/sprites/grass.png');
      }
    }
  }
}

class Player {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.health = 100;
    this.direction = Math.PI;
    this.name = 'null';
  }
}

class CurrentPlayer extends Player {
  constructor() {
    super();
    this.xAbsolute = 0;
    this.yAbsolute = 0;
  }
}

class Bullet {
  constructor(xArg, yArg, directionArg) {
    this.x = xArg;
    this.y = yArg;
    this.direction = directionArg;
    this.speed = 15;
    this.range = 100;
    this.distanceTraveled = 0;
  };
}

class Entry {
  constructor(name, socketId, score) {
    this.name = name;
    this.socketId = socketId;
    this.score = score;
  }
}
