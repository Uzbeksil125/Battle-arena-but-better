'use strict';

let Model = require('./static/server/Model.js');
let model = new Model();
let express = require('express');
let http = require('http');
let path = require('path');
let socketIO = require('socket.io');

let app = express();
let server = http.Server(app);
let io = socketIO(server);

let bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.set('port', 54070);
app.use('/static', express.static(__dirname + '/static'));


// Routing
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../index.html'));

});

app.get('/menu.css', function (req, res) {
  res.sendFile(path.join(__dirname + '/../menu.css'));
});

app.get('/help.html', function (req, res) {
  res.sendFile(path.join(__dirname + '/../help.html'));
});

app.get('/img/mouse.png', function (req, res) {
  res.sendFile(path.join(__dirname + '/../img/mouse.png'));
});

app.get('/img/wasd.jpg', function (req, res) {
  res.sendFile(path.join(__dirname + '/../img/wasd.jpg'));
});

app.post('/goGame', function (req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
  console.log(req.body);
  playersInQueue.push(req.body.nick);
});

server.listen(54070, "0.0.0.0");

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  console.log('addr: ' + add);
})


let bulletPhysics = model.getBulletPhysics();
let players = {};
let playersInQueue = [];

io.on('connection', function (socket) {
  socket.on('new player', function () {
    if (playersInQueue.length > 0) {
      let x, y;
      do {
        // Margin of 5 squares (250px) to avoid border spawns
        x = 250 + Math.floor(Math.random() * (model.map.widthInSquares * 50 - 500));
        y = 250 + Math.floor(Math.random() * (model.map.heightInSquares * 50 - 500));
      } while (!model.map.square[Math.floor(y / 50)][Math.floor(x / 50)].isPassable)

      players[socket.id] = model.getNewPlayer(x, y, 1000, 0, playersInQueue.shift());
    }
    else
      players[socket.id] = model.getNewPlayer(500, 500, 0, 0, 'noName');
    console.log("Player connected: " + players[socket.id].name + " " + socket.id);
    model.leaderboard.addEntry(players[socket.id].name, socket.id, 0);
  });

  socket.on('respawn', function () {
    let player = players[socket.id];
    if (player) {
      player.health = 1000;
      player.isDead = false;
      let x, y;
      do {
        x = 250 + Math.floor(Math.random() * (model.map.widthInSquares * 50 - 500));
        y = 250 + Math.floor(Math.random() * (model.map.heightInSquares * 50 - 500));
      } while (!model.map.square[Math.floor(y / 50)][Math.floor(x / 50)].isPassable)
      player.x = x;
      player.y = y;
    }
  });

  // ... (existing code for disconnect, admin_op, input)

  socket.on('admin_op', function (data) {
    if (data.password !== "mycustompassword") return;
    let player = players[socket.id];
    if (!player) return;

    if (data.command === "tp") {
      let rank = data.value;
      if (rank > 0 && rank <= model.leaderboard.array.length) {
        let targetEntry = model.leaderboard.array[rank - 1];
        let targetId = targetEntry.socketId;
        let targetPlayer = players[targetId];
        if (targetPlayer) {
          player.x = targetPlayer.x;
          player.y = targetPlayer.y;
        }
      }
    } else if (data.command === "killset") {
      let score = parseInt(data.value);
      player.score = score;
      // Update leaderboard entry
      for (let i = 0; i < model.leaderboard.array.length; i++) {
        if (model.leaderboard.array[i].socketId === socket.id) {
          model.leaderboard.array[i].score = score;
          break;
        }
      }
      model.leaderboard.sort();
    } else if (data.command === "addbots") {
      let count = Math.min(parseInt(data.value), 10);
      for (let i = 0; i < count; i++) {
        let id = "bot" + Math.random().toString(36).substr(2, 9);
        let x, y;
        do {
          x = 250 + Math.floor(Math.random() * (model.map.widthInSquares * 50 - 500));
          y = 250 + Math.floor(Math.random() * (model.map.heightInSquares * 50 - 500));
        } while (!model.map.square[Math.floor(y / 50)][Math.floor(x / 50)].isPassable)

        let bot = model.getNewPlayer(x, y, 1000, 0, "Botanak" + (i + 1));
        bot.isBot = true;
        bot.id = id;
        players[id] = bot;
        model.leaderboard.addEntry(bot.name, id, 0);
      }
    }
  });

  // ... (rest of socket handling)

  socket.on('input', function (input) {
    if (!players[socket.id]) return;
    let player = players[socket.id];
    let speed = model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x) / 50)].speed;
    if (player.score >= 10) speed *= 1.35;
    player.health -= model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x) / 50)].damage;
    let oldX = player.x;
    let oldY = player.y;
    player.direction = input.direction;


    player.y = player.y - speed * input.up + speed * input.down;
    if (!model.map.square[Math.floor((player.y + 25) / 50)][Math.floor((player.x) / 50)].isPassable || !model.map.square[Math.floor((player.y - 25) / 50)][Math.floor((player.x) / 50)].isPassable ||
      !model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x + 25) / 50)].isPassable || !model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x - 25) / 50)].isPassable)
      player.y = oldY;

    player.x = player.x - speed * input.left + speed * input.right;
    if (!model.map.square[Math.floor((player.y + 25) / 50)][Math.floor((player.x) / 50)].isPassable || !model.map.square[Math.floor((player.y - 25) / 50)][Math.floor((player.x) / 50)].isPassable ||
      !model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x + 25) / 50)].isPassable || !model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x - 25) / 50)].isPassable)
      player.x = oldX;


    if (input.LMB == true)
      player.weapon.shoot(player.x, player.y, player.direction, bulletPhysics, socket.id);
    else
      player.weapon.triggered = 0;
  });


});

// ... (playerMap init, physics loop start)

let playerMap = [];//used to send map to players, they get only 45x25 squares
for (let i = 0; i < 25; i++) {
  playerMap[i] = [];
  for (let j = 0; j < 45; j++) {
    playerMap[i][j] = 'grass';
  }
}

setInterval(function () {
  bulletPhysics.checkRange();
  bulletPhysics.update(model.getMap());
  bulletPhysics.checkHits(players);
  model.getItems().checkColissions(players);


  for (let key in players) {
    let thisPlayer = players[key];
    // Remove dead bots
    if (thisPlayer.isBot && thisPlayer.health <= 0) {
      delete players[key];
      // Remove from leaderboard
      for (let i = 0; i < model.leaderboard.array.length; i++) {
        if (model.leaderboard.array[i].socketId == key) {
          model.leaderboard.array.splice(i, 1);
          break;
        }
      }
      continue;
    }

    let thisPlayerAbsolute = thisPlayer;
    let emitPlayers = JSON.parse(JSON.stringify(players));
    for (let key2 in emitPlayers) {
      emitPlayers[key2].x = emitPlayers[key2].x - thisPlayer.x;
      emitPlayers[key2].y = emitPlayers[key2].y - thisPlayer.y;
    }

    if (io.sockets.connected[key] && thisPlayer.health <= 0 && !thisPlayer.isDead) {
      if (io.sockets.connected[thisPlayer.killedBy]) {
        model.leaderboard.addPoint(thisPlayer.killedBy);
        players[thisPlayer.killedBy].score++;
      }
      thisPlayer.dropItem(model.getItems().array);
      thisPlayer.isDead = true;
      io.to(key).emit('death');
      // io.sockets.connected[key].disconnect(); // Removed disconnect
      continue;
    } else if (thisPlayer.isBot && thisPlayer.health <= 0) {
      // Bot death logic handled above (removal)
      continue;
    }



    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 45; j++) {
        let maxRow = model.map.heightInSquares - 1;
        let maxCol = model.map.widthInSquares - 1;

        let row = Math.min(Math.max(Math.floor(players[key].y / 50) - 12 + i, 0), maxRow);
        let col = Math.min(Math.max(Math.floor(players[key].x / 50) - 22 + j, 0), maxCol);

        playerMap[i][j] = model.map.square[row][col].type;
      }
    }

    io.to(key).emit('update', emitPlayers, thisPlayer, thisPlayerAbsolute, playerMap, bulletPhysics.bullets, model.getItems().array, model.leaderboard.array);
  }

  // Update Bots
  for (let key in players) {
    let bot = players[key];
    if (!bot.isBot || bot.health <= 0) continue;

    // AI Logic
    let target = null;
    let minDist = Infinity; // For detecting nearest enemy/item
    let potentialTargets = [];

    // 1. Gather all potential targets (players and other bots)
    for (let otherKey in players) {
      if (otherKey === key) continue;
      let p = players[otherKey];
      if (p.health > 0) {
        let dist = Math.hypot(p.x - bot.x, p.y - bot.y);
        potentialTargets.push({ player: p, dist: dist, id: otherKey });
      }
    }

    // Sort targets by SCORE (Weight: Distance 60%, Health 40%)
    // Lower score is better target.
    // Score = Distance + (Health * 2)
    potentialTargets.sort((a, b) => {
      let scoreA = a.dist + (a.player.health * 2);
      let scoreB = b.dist + (b.player.health * 2);
      return scoreA - scoreB;
    });

    // 2. Decide Strategy
    let strategy = "attack"; // default
    if (bot.health < 300) strategy = "flee";

    // 3. Execute Strategy
    if (strategy === "flee") {
      // Find nearest HEALTH PACK
      let nearestHealth = null;
      let minHealthDist = Infinity;
      for (let item of model.getItems().array) {
        if (item.spriteName.includes("health")) {
          let d = Math.hypot(item.x - bot.x, item.y - bot.y);
          if (d < minHealthDist) {
            minHealthDist = d;
            nearestHealth = item;
          }
        }
      }

      if (nearestHealth && minHealthDist < 2000) {
        target = nearestHealth; // Go to health
      } else if (potentialTargets.length > 0) {
        // Run AWAY from nearest enemy
        let enemy = potentialTargets[0].player;
        let angle = Math.atan2(enemy.y - bot.y, enemy.x - bot.x);
        bot.direction = angle + Math.PI; // Opposite direction
        target = null; // Don't shoot while fleeing (for now)
      }
    } else {
      // Attack Strategy
      if (potentialTargets.length > 0) {
        target = potentialTargets[0].player;
      }
    }

    if (target || strategy === "flee" && target) { // If we have a destination
      let destX = target.x;
      let destY = target.y;

      // Calculate angle to target
      let angle = Math.atan2(destY - bot.y, destX - bot.x);

      // Movement Logic
      let speed = model.map.square[Math.floor((bot.y) / 50)][Math.floor((bot.x) / 50)].speed;
      if (bot.score >= 10) speed *= 1.35;

      let moveDir = angle;
      let shouldMove = true;
      let distToTarget = Math.hypot(destX - bot.x, destY - bot.y);

      // Kiting / Distance Maintenance (Only when attacking)
      if (strategy === "attack" && target instanceof Object && !(target.spriteName)) { // Ensure target is player, not item
        bot.direction = angle; // Facetarget
        if (distToTarget < 250) {
          moveDir = angle + Math.PI; // Backup
        } else if (distToTarget < 400) {
          shouldMove = false; // Hold position
        }
      } else {
        bot.direction = angle; // Face movement direction
      }

      if (shouldMove) {
        let oldX = bot.x;
        let oldY = bot.y;

        bot.y += Math.sin(moveDir) * speed;
        if (!model.map.square[Math.floor((bot.y + 25) / 50)][Math.floor((bot.x) / 50)].isPassable || !model.map.square[Math.floor((bot.y - 25) / 50)][Math.floor((bot.x) / 50)].isPassable ||
          !model.map.square[Math.floor((bot.y) / 50)][Math.floor((bot.x + 25) / 50)].isPassable || !model.map.square[Math.floor((bot.y) / 50)][Math.floor((bot.x - 25) / 50)].isPassable)
          bot.y = oldY;

        bot.x += Math.cos(moveDir) * speed;
        if (!model.map.square[Math.floor((bot.y + 25) / 50)][Math.floor((bot.x) / 50)].isPassable || !model.map.square[Math.floor((bot.y - 25) / 50)][Math.floor((bot.x) / 50)].isPassable ||
          !model.map.square[Math.floor((bot.y) / 50)][Math.floor((bot.x + 25) / 50)].isPassable || !model.map.square[Math.floor((bot.y) / 50)][Math.floor((bot.x - 25) / 50)].isPassable)
          bot.x = oldX;
      }

      // Shoot if close enough and attacking
      if (strategy === "attack" && distToTarget < 600) {
        if (!bot.lastShot || Date.now() - bot.lastShot > 500) { // Fire rate limit
          bot.weapon.shoot(bot.x, bot.y, bot.direction, bulletPhysics, key);
          bot.lastShot = Date.now();
        }
      }
    }
  }
}, 1000 / 60);





////////////////////////////////////////////////////////////////////////////////
