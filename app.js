const tg = window.Telegram.WebApp;

try {
  tg.ready();
  tg.expand();
} catch(e) {}

let points = Number(localStorage.getItem("nova_points") || 0);
let streak = Number(localStorage.getItem("nova_streak") || 0);

let game = {
  running: false,
  score: 0,
  crystals: 0,
  time: 0,
  playerX: 0,
  playerY: 0,
  shield: 0,
  combo: 0,
  speed: 2,
  rocks: [],
  gems: [],
  particles: []
};

let canvas;
let ctx;
let animation;
let lastTime = 0;

const $ = id => document.getElementById(id);

function updateUI() {
  if ($("points")) $("points").textContent = points.toLocaleString();
  if ($("streak")) $("streak").textContent = streak;

  localStorage.setItem("nova_points", points);
  localStorage.setItem("nova_streak", streak);
}

function openGame() {
  $("homeScreen").style.display = "none";
  $("gameScreen").style.display = "block";

  setupGame();
}

function closeGame() {
  stopGame();

  $("gameScreen").style.display = "none";
  $("homeScreen").style.display = "block";
}

function setupGame() {

  if (!canvas) {

    const arena = $("arena");

    arena.innerHTML = `
      <canvas id="novaCanvas"></canvas>

      <div class="gameHUD">
        <div>⭐ <span id="gameScore">0</span></div>
        <div>💎 <span id="gameGems">0</span></div>
        <div>🛡️ <span id="gameShield">0</span></div>
      </div>

      <div id="gameStartOverlay" class="gameOverlay">
        <div class="bigGameIcon">🚀</div>
        <h2>NOVA SURVIVE</h2>
        <p>Survive. Collect. Become legendary.</p>
        <button class="primary" id="launchButton">
          LAUNCH 🚀
        </button>
      </div>

      <div id="gameOverOverlay" class="gameOverlay hidden">
        <div class="bigGameIcon">💥</div>
        <h2>MISSION FAILED</h2>
        <p id="finalScore"></p>
        <button class="primary" id="againButton">
          PLAY AGAIN
        </button>
      </div>
    `;

    canvas = $("novaCanvas");
    ctx = canvas.getContext("2d");

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);

    $("launchButton").onclick = startGame;
    $("againButton").onclick = startGame;

    canvas.addEventListener("touchmove", movePlayer, {
      passive: false
    });

    canvas.addEventListener("mousemove", movePlayer);

  }

}

function resizeCanvas() {

  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;

  ctx.setTransform(
    devicePixelRatio,
    0,
    0,
    devicePixelRatio,
    0,
    0
  );

  if (!game.running) {

    game.playerX = rect.width / 2;
    game.playerY = rect.height - 75;

  }

}

function movePlayer(e) {

  if (!game.running) return;

  e.preventDefault();

  const rect = canvas.getBoundingClientRect();

  let x;

  if (e.touches) {
    x = e.touches[0].clientX - rect.left;
  } else {
    x = e.clientX - rect.left;
  }

  game.playerX = Math.max(
    25,
    Math.min(rect.width - 25, x)
  );

}

function startGame() {

  game.running = true;
  game.score = 0;
  game.crystals = 0;
  game.time = 0;
  game.shield = 1;
  game.combo = 0;
  game.speed = 2;

  game.rocks = [];
  game.gems = [];
  game.particles = [];

  $("gameStartOverlay").classList.add("hidden");
  $("gameOverOverlay").classList.add("hidden");

  $("gameScore").textContent = "0";
  $("gameGems").textContent = "0";
  $("gameShield").textContent = "1";

  const rect = canvas.getBoundingClientRect();

  game.playerX = rect.width / 2;
  game.playerY = rect.height - 70;

  lastTime = performance.now();

  cancelAnimationFrame(animation);

  animation = requestAnimationFrame(loop);

}

function loop(time) {

  if (!game.running) return;

  const delta = Math.min(
    (time - lastTime) / 16.67,
    2
  );

  lastTime = time;

  game.time += delta / 60;

  game.speed = 2 + game.time * 0.035;

  update(delta);

  draw();

  animation = requestAnimationFrame(loop);

}

function update(delta) {

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  // Meteor spawn
  if (Math.random() < 0.018 * delta + game.time * 0.00035) {

    game.rocks.push({
      x: Math.random() * width,
      y: -40,
      r: 12 + Math.random() * 17,
      speed: game.speed * (0.7 + Math.random()),
      rotation: Math.random() * Math.PI
    });

  }

  // Crystal spawn
  if (Math.random() < 0.008 * delta) {

    game.gems.push({
      x: 25 + Math.random() * (width - 50),
      y: -20,
      size: 9,
      speed: game.speed * 0.8
    });

  }

  // Rocks
  for (let i = game.rocks.length - 1; i >= 0; i--) {

    const rock = game.rocks[i];

    rock.y += rock.speed * delta;
    rock.rotation += 0.02 * delta;

    const distance = Math.hypot(
      rock.x - game.playerX,
      rock.y - game.playerY
    );

    if (distance < rock.r + 18) {

      if (game.shield > 0) {

        game.shield = 0;

        $("gameShield").textContent = "0";

        createExplosion(
          game.playerX,
          game.playerY
        );

        game.rocks.splice(i, 1);

      } else {

        finishGame();

        return;

      }

    }

    if (rock.y > height + 60) {
      game.rocks.splice(i, 1);
    }

  }

  // Crystals
  for (let i = game.gems.length - 1; i >= 0; i--) {

    const gem = game.gems[i];

    gem.y += gem.speed * delta;

    const distance = Math.hypot(
      gem.x - game.playerX,
      gem.y - game.playerY
    );

    if (distance < 30) {

      game.crystals++;

      game.score += 25;

      game.combo++;

      $("gameGems").textContent =
        game.crystals;

      $("gameScore").textContent =
        game.score;

      createExplosion(
        gem.x,
        gem.y
      );

      game.gems.splice(i, 1);

    }

    if (gem.y > height + 30) {
      game.gems.splice(i, 1);
    }

  }

  // Survival score
  game.score += Math.floor(delta);

  $("gameScore").textContent =
    game.score;

}

function draw() {

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  ctx.clearRect(0,0,width,height);

  // Space background
  const gradient =
    ctx.createRadialGradient(
      width / 2,
      height / 2,
      20,
      width / 2,
      height / 2,
      height
    );

  gradient.addColorStop(0,"#17153d");
  gradient.addColorStop(1,"#050713");

  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,width,height);

  // Stars
  for(let i=0;i<45;i++){

    const x = (i * 83) % width;
    const y =
      ((i * 137) +
      game.time * 35) % height;

    ctx.fillStyle =
      "rgba(255,255,255,.45)";

    ctx.fillRect(x,y,1.5,1.5);

  }

  // Nebula
  ctx.beginPath();

  const nebula =
    ctx.createRadialGradient(
      width*.5,
      height*.35,
      10,
      width*.5,
      height*.35,
      180
    );

  nebula.addColorStop(
    0,
    "rgba(100,70,255,.16)"
  );

  nebula.addColorStop(
    1,
    "rgba(100,70,255,0)"
  );

  ctx.fillStyle = nebula;

  ctx.arc(
    width*.5,
    height*.35,
    180,
    0,
    Math.PI*2
  );

  ctx.fill();

  // Gems
  game.gems.forEach(drawGem);

  // Rocks
  game.rocks.forEach(drawRock);

  // Player
  drawPlayer();

  // Particles
  drawParticles();

}

function drawPlayer() {

  ctx.save();

  ctx.translate(
    game.playerX,
    game.playerY
  );

  // Engine glow
  ctx.beginPath();

  const glow =
    ctx.createRadialGradient(
      0,
      20,
      2,
      0,
      20,
      35
    );

  glow.addColorStop(
    0,
    "rgba(0,220,255,.8)"
  );

  glow.addColorStop(
    1,
    "rgba(0,220,255,0)"
  );

  ctx.fillStyle = glow;

  ctx.arc(
    0,
    20,
    35,
    0,
    Math.PI*2
  );

  ctx.fill();

  // Ship
  ctx.beginPath();

  ctx.moveTo(0,-25);
  ctx.lineTo(19,20);
  ctx.lineTo(0,13);
  ctx.lineTo(-19,20);

  ctx.closePath();

  const ship =
    ctx.createLinearGradient(
      0,-25,
      0,20
    );

  ship.addColorStop(
    0,
    "#ffffff"
  );

  ship.addColorStop(
    .35,
    "#78eaff"
  );

  ship.addColorStop(
    1,
    "#654cff"
  );

  ctx.fillStyle = ship;

  ctx.shadowBlur = 20;
  ctx.shadowColor = "#54eaff";

  ctx.fill();

  ctx.restore();

}

function drawRock(rock) {

  ctx.save();

  ctx.translate(
    rock.x,
    rock.y
  );

  ctx.rotate(
    rock.rotation
  );

  ctx.beginPath();

  for(let i=0;i<8;i++){

    const angle =
      i * Math.PI / 4;

    const radius =
      rock.r *
      (0.8 + Math.random()*.3);

    const x =
      Math.cos(angle)*radius;

    const y =
      Math.sin(angle)*radius;

    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);

  }

  ctx.closePath();

  const rockGradient =
    ctx.createLinearGradient(
      -rock.r,
      -rock.r,
      rock.r,
      rock.r
    );

  rockGradient.addColorStop(
    0,
    "#6e7389"
  );

  rockGradient.addColorStop(
    1,
    "#242838"
  );

  ctx.fillStyle = rockGradient;

  ctx.shadowBlur = 10;
  ctx.shadowColor =
    "rgba(255,80,130,.25)";

  ctx.fill();

  ctx.restore();

}

function drawGem(gem) {

  ctx.save();

  ctx.translate(
    gem.x,
    gem.y
  );

  ctx.rotate(
    game.time * 2
  );

  ctx.beginPath();

  ctx.moveTo(0,-gem.size);
  ctx.lineTo(gem.size,0);
  ctx.lineTo(0,gem.size);
  ctx.lineTo(-gem.size,0);

  ctx.closePath();

  ctx.fillStyle="#6ff3ff";

  ctx.shadowBlur=18;
  ctx.shadowColor="#00d9ff";

  ctx.fill();

  ctx.restore();

}

function createExplosion(x,y){

  for(let i=0;i<10;i++){

    game.particles.push({
      x,
      y,
      vx:(Math.random()-.5)*5,
      vy:(Math.random()-.5)*5,
      life:1
    });

  }

}

function drawParticles(){

  for(
    let i=game.particles.length-1;
    i>=0;
    i--
  ){

    const p =
      game.particles[i];

    p.x += p.vx;
    p.y += p.vy;
    p.life -= .035;

    if(p.life<=0){

      game.particles.splice(i,1);
      continue;

    }

    ctx.globalAlpha=p.life;

    ctx.fillStyle="#7befff";

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      2.5,
      0,
      Math.PI*2
    );

    ctx.fill();

  }

  ctx.globalAlpha=1;

}

function finishGame(){

  game.running=false;

  cancelAnimationFrame(animation);

  const reward =
    Math.floor(
      game.score * .35 +
      game.crystals * 10
    );

  points += reward;

  updateUI();

  $("finalScore").innerHTML =
    `Score: <strong>${game.score}</strong><br>
     💎 Crystals: <strong>${game.crystals}</strong><br>
     ✦ Reward: <strong>+${reward} NOVA Points</strong>`;

  $("gameOverOverlay").classList.remove(
    "hidden"
  );

}

function stopGame(){

  game.running=false;

  cancelAnimationFrame(animation);

}

function switchTab(tab){

  if(tab==="home"){

    closeGame();

  }

  else if(tab==="games"){

    openGame();

  }

  else{

    alert(
      "This feature is coming soon 🚀"
    );

  }

}

updateUI();