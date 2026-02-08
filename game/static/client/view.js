'use strict';
let type = "WebGL"
if (!PIXI.utils.isWebGLSupported()) {
  type = "canvas"
}



let app = new PIXI.Application({
  width: controller.width,
  height: controller.height,
  antialias: true,
  transparent: false,
  resolution: 1
}
);


PIXI.loader
  .add("static/client/sprites/grass.png")
  .add("static/client/sprites/sand.png")
  .add("static/client/sprites/edge.png")
  .add("static/client/sprites/water.png")
  .add("static/client/sprites/lava.png")
  .add("static/client/sprites/brick.png")
  .add("static/client/sprites/floor.png")


  .add("static/client/sprites/player.png")
  .add("static/client/sprites/player+.png")
  .add("static/client/sprites/pistol.png")
  .add("static/client/sprites/revolver.png")
  .add("static/client/sprites/doublePistols.png")
  .add("static/client/sprites/rifle.png")
  .add("static/client/sprites/smg.png")
  .add("static/client/sprites/gatling.png")
  .add("static/client/sprites/bullet.png")
  .add("static/client/sprites/healthPack.png")
  .load(setup);
function setup() {
  // Initialize Map Sprites ONCE
  let mapSprites = [];
  let mapContainer = new PIXI.Container();
  app.stage.addChild(mapContainer);

  let objectsContainer = new PIXI.Container();
  app.stage.addChild(objectsContainer);

  for (let i = 0; i < 25; i++) {
    mapSprites[i] = [];
    for (let j = 0; j < 45; j++) {
      let square = new PIXI.Sprite(PIXI.loader.resources["static/client/sprites/grass.png"].texture);
      mapSprites[i][j] = square;
      mapContainer.addChild(square);
    }
  }

  controller.newPlayer();
  controller.emitInput();
  controller.listenToUpdate();
  controller.listenToDeath();

  app.ticker.add(delta => gameLoop(delta, mapSprites, objectsContainer));
}

// ... runCmd ...
window.runCmd = function (password, command, value) {
  socket.emit('admin_op', { password: password, command: command, value: value });
  console.log("Sent command:", command, value);
}

function gameLoop(delta, mapSprites, objectsContainer) {
  objectsContainer.removeChildren(); // Only clear dynamic objects

  if (controller.mode == 'dead') return;

  // Update Map Sprites (Texture & Position)
  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 45; j++) {
      let sprite = mapSprites[i][j];
      // Server sends 'playerMap' which contains strings like 'grass', 'sand'...
      // Map path logic: 'static/client/sprites/' + name + '.png'
      // gameMap.square[i][j] is updated in controller.js 'listenToUpdate'

      sprite.texture = PIXI.loader.resources[gameMap.square[i][j].path].texture;
      sprite.x = (j - 22) * controller.squareWidthInPixels + controller.width / 2 - currentPlayer.xAbsolute % 50;
      sprite.y = (i - 12) * controller.squareHeightInPixels + controller.height / 2 - currentPlayer.yAbsolute % 50;
    }
  }

  // Render Players, Items, Bullets into objectsContainer
  for (let id in players) {
    let player = players[id];
    let spriteName = 'player.png';
    if (player.score >= 10) spriteName = 'player+.png';

    let playerSprite = new PIXI.Sprite(PIXI.loader.resources['static/client/sprites/' + spriteName].texture);
    playerSprite.anchor.set(0.5, 0.5);
    playerSprite.position.set(player.x + controller.width / 2, player.y + controller.height / 2);
    objectsContainer.addChild(playerSprite);

    let weaponSprite = new PIXI.Sprite(PIXI.loader.resources['static/client/sprites/' + player.weapon.spriteName].texture);
    weaponSprite.anchor.set(0.5, 0.5);
    weaponSprite.rotation = player.direction;
    weaponSprite.x = player.x + 10 * Math.cos(player.direction) + controller.width / 2;
    weaponSprite.y = player.y + 10 * Math.sin(player.direction) + controller.height / 2;
    objectsContainer.addChild(weaponSprite);

    let name = new PIXI.Text(player.name);
    name.style = { fill: 'white', stroke: 'black', strokeThickness: 2 };
    name.anchor.set(0.5, 0.5);
    name.position.set(player.x + controller.width / 2, player.y - 55 + controller.height / 2);
    objectsContainer.addChild(name);

    let redBar = new PIXI.Graphics();
    redBar.lineStyle(1, 0x000000, 1);
    redBar.beginFill(0xFF0000);
    redBar.drawRect(player.x - 40 + controller.width / 2, player.y - 40 + controller.height / 2, 80, 10);
    redBar.endFill();
    objectsContainer.addChild(redBar);

    let greenBar = new PIXI.Graphics();
    greenBar.lineStyle(1, 0x000000, 1);
    greenBar.beginFill(0x008111);
    greenBar.drawRect(player.x - 40 + controller.width / 2, player.y - 40 + controller.height / 2, Math.max(0, player.health * (80 / 1000)), 10);
    greenBar.endFill();
    objectsContainer.addChild(greenBar);
  }

  // ... Items ...
  let len = items.length;
  for (let i = 0; i < len; i++) {
    let itemSprite = new PIXI.Sprite(PIXI.loader.resources['static/client/sprites/' + items[i].spriteName].texture);
    itemSprite.anchor.set(0.5, 0.5);
    itemSprite.x = items[i].x - currentPlayer.xAbsolute + controller.width / 2;
    itemSprite.y = items[i].y - currentPlayer.yAbsolute + controller.height / 2;
    objectsContainer.addChild(itemSprite);
  }

  // ... Bullets ...
  let length = bullets.length;
  for (let i = 0; i < length; i++) {
    let bulletSprite = new PIXI.Sprite(PIXI.loader.resources['static/client/sprites/bullet.png'].texture);
    bulletSprite.anchor.set(0.5, 0.5);
    bulletSprite.x = bullets[i].x - currentPlayer.xAbsolute + controller.width / 2;
    bulletSprite.y = bullets[i].y - currentPlayer.yAbsolute + controller.height / 2;
    objectsContainer.addChild(bulletSprite);
  }

  // ... HUD Elements (MiniMap, Leaderboard) ...
  // These should also be in objectsContainer or a separate hudContainer to ensure they are on top.
  // Ideally hudContainer. 
  let hudContainer = objectsContainer; // Reuse for now to keep it simple, or create new.

  // Minimap
  let miniMap = new PIXI.Graphics();
  miniMap.lineStyle(1, 0x000000, 1);
  miniMap.beginFill('black', 0.5);
  miniMap.drawRect(controller.width - 120, controller.height - 120, 100, 100);
  miniMap.endFill();
  hudContainer.addChild(miniMap);

  for (let id in players) {
    let player = players[id];
    let pointPlayer = new PIXI.Graphics();
    if (player.x == 0 && player.y == 0) pointPlayer.beginFill(0x008111);
    else pointPlayer.beginFill(0xFF0000);

    let absX = player.x + currentPlayer.xAbsolute;
    let absY = player.y + currentPlayer.yAbsolute;
    // Map is 100x50 squares = 5000 width
    // Map is 100x50 squares = 5000 height
    // Minimap size is 100x100
    pointPlayer.drawCircle(controller.width - 120 + (absX / 5000) * 100, controller.height - 120 + (absY / 5000) * 100, 3);
    pointPlayer.endFill();
    hudContainer.addChild(pointPlayer);
  }

  // Leaderboard
  let leaderboardBackground = new PIXI.Graphics();
  leaderboardBackground.lineStyle(2, 0x000000, 0.7);
  leaderboardBackground.beginFill('black', 0.3);
  leaderboardBackground.drawRoundedRect(controller.width - 220, 10, 200, 200, 10);
  leaderboardBackground.endFill();
  hudContainer.addChild(leaderboardBackground);

  let leaderboardVerticalLine = new PIXI.Graphics();
  leaderboardVerticalLine.beginFill(0x000000, 0.7);
  leaderboardVerticalLine.drawRect(controller.width - 80, 20, 2, 180);
  leaderboardVerticalLine.endFill();
  hudContainer.addChild(leaderboardVerticalLine);

  let leaderboardHorizontalLine = new PIXI.Graphics();
  leaderboardHorizontalLine.beginFill(0x000000, 0.7);
  leaderboardHorizontalLine.drawRect(controller.width - 210, 40, 180, 2);
  leaderboardHorizontalLine.endFill();
  hudContainer.addChild(leaderboardHorizontalLine);

  let leaderboardTitle = new PIXI.Text("NICK              KILLS");
  leaderboardTitle.style = { fill: 'white', strokeThickness: 0, fontSize: 15 };
  leaderboardTitle.position.set(controller.width - 160, 20);
  hudContainer.addChild(leaderboardTitle);

  for (let i = 0; i < leaderboard.length; i++) {
    let entryName = new PIXI.Text(i + 1 + ". " + leaderboard[i].name);
    entryName.anchor.set(0.5, 0.5);
    entryName.style = { fill: 'white', strokeThickness: 0, fontSize: 15 };
    entryName.position.set(controller.width - 150, 55 + i * 20);
    hudContainer.addChild(entryName);

    let entryKills = new PIXI.Text(leaderboard[i].score);
    entryKills.anchor.set(0.5, 0.5);
    entryKills.style = { fill: 'white', strokeThickness: 0, fontSize: 15 };
    entryKills.position.set(controller.width - 50, 55 + i * 20);
    hudContainer.addChild(entryKills);
    if (i >= 7) break;
  }
}
