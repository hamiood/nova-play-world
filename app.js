const tg = window.Telegram?.WebApp;

if(tg){
  tg.ready();
  tg.expand();
}

const $ = id => document.getElementById(id);

let points = Number(localStorage.getItem("nova_points") || 0);
let bestScore = Number(localStorage.getItem("nova_best") || 0);
let gems = Number(localStorage.getItem("nova_gems") || 0);
let streak = Number(localStorage.getItem("nova_streak") || 0);

let canvas;
let ctx;
let raf = 0;
let last = 0;

const game = {
  running:false,
  score:0,
  crystals:0,
  combo:1,
  shield:1,
  time:0,
  spawn:0,
  crystalSpawn:0,
  difficulty:1,
  player:{
    x:0,
    y:0,
    targetX:0
  },
  meteors:[],
  crystalsList:[],
  particles:[],
  stars:[]
};


function save(){

  localStorage.setItem(
    "nova_points",
    points
  );

  localStorage.setItem(
    "nova_best",
    bestScore
  );

  localStorage.setItem(
    "nova_gems",
    gems
  );

  localStorage.setItem(
    "nova_streak",
    streak
  );

}


function updateHome(){

  $("points").textContent =
    points.toLocaleString();

  $("bestScore").textContent =
    bestScore.toLocaleString();

  $("gems").textContent =
    gems.toLocaleString();

  $("streak").textContent =
    streak;

  const xp =
    points % 1000;

  $("xpFill").style.width =
    Math.max(5,xp/10)+"%";

  $("xpText").textContent =
    `${xp} / 1000 XP`;

}


function showHome(){

  stopGame();

  $("homeScreen").classList.remove("hidden");
  $("gameScreen").classList.add("hidden");

}


function openGame(){

  $("homeScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");

  initCanvas();

}


function closeGame(){

  stopGame();

  $("gameScreen").classList.add("hidden");
  $("homeScreen").classList.remove("hidden");

}


function openProfile(){

  $("profilePoints").textContent =
    points.toLocaleString();

  $("profileBest").textContent =
    bestScore.toLocaleString();

  $("profileModal").classList.remove(
    "hidden"
  );

}


function closeProfile(){

  $("profileModal").classList.add(
    "hidden"
  );

}


function comingSoon(){

  if(tg?.showPopup){

    tg.showPopup({
      title:"NOVA",
      message:"This feature is coming soon 🚀",
      buttons:[
        {type:"ok"}
      ]
    });

  }else{

    alert(
      "This feature is coming soon 🚀"
    );

  }

}


function initCanvas(){

  if(!canvas){

    canvas =
      $("gameCanvas");

    ctx =
      canvas.getContext("2d");

    canvas.addEventListener(
      "pointermove",
      pointerMove
    );

    canvas.addEventListener(
      "pointerdown",
      pointerMove
    );

    window.addEventListener(
      "resize",
      resize
    );

  }

  resize();

  if(
    game.stars.length === 0
  ){

    for(let i=0;i<90;i++){

      game.stars.push({
        x:Math.random(),
        y:Math.random(),
        z:Math.random()
      });

    }

  }

}


function resize(){

  if(!canvas) return;

  const rect =
    canvas.getBoundingClientRect();

  const dpr =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );

  canvas.width =
    rect.width*dpr;

  canvas.height =
    rect.height*dpr;

  ctx.setTransform(
    dpr,0,0,dpr,0,0
  );

  if(!game.running){

    game.player.x =
      rect.width/2;

    game.player.y =
      rect.height-80;

    game.player.targetX =
      game.player.x;

  }

}


function pointerMove(e){

  if(!game.running) return;

  const rect =
    canvas.getBoundingClientRect();

  game.player.targetX =
    Math.max(
      30,
      Math.min(
        rect.width-30,
        e.clientX-rect.left
      )
    );

}


function startGame(){

  initCanvas();

  const width =
    canvas.clientWidth;

  const height =
    canvas.clientHeight;

  game.running=true;
  game.score=0;
  game.crystals=0;
  game.combo=1;
  game.shield=1;
  game.time=0;
  game.spawn=0;
  game.crystalSpawn=0;
  game.difficulty=1;

  game.meteors=[];
  game.crystalsList=[];
  game.particles=[];

  game.player.x =
    width/2;

  game.player.targetX =
    width/2;

  game.player.y =
    height-80;

  $("gameScore").textContent="0";
  $("gameCombo").textContent="x1";
  $("gameShield").textContent="●";

  $("startOverlay").classList.add(
    "hidden"
  );

  $("gameOver").classList.add(
    "hidden"
  );

  last =
    performance.now();

  cancelAnimationFrame(raf);

  raf =
    requestAnimationFrame(loop);

}


function stopGame(){

  game.running=false;

  cancelAnimationFrame(raf);

}


function loop(now){

  if(!game.running) return;

  const dt =
    Math.min(
      (now-last)/16.666,
      2
    );

  last=now;

  update(dt);

  draw();

  raf =
    requestAnimationFrame(loop);

}


function update(dt){

  const w =
    canvas.clientWidth;

  const h =
    canvas.clientHeight;

  game.time +=
    dt/60;

  game.difficulty =
    1 +
    game.time*0.045;

  // Smooth player movement

  game.player.x +=
    (
      game.player.targetX -
      game.player.x
    ) *
    0.18 *
    dt;


  // Meteor spawning

  game.spawn -= dt;

  if(game.spawn<=0){

    spawnMeteor();

    game.spawn =
      Math.max(
        11,
        32 -
        game.difficulty*3
      );

  }


  // Crystal spawning

  game.crystalSpawn -= dt;

  if(game.crystalSpawn<=0){

    spawnCrystal();

    game.crystalSpawn =
      65;

  }


  // Update meteors

  for(
    let i=game.meteors.length-1;
    i>=0;
    i--
  ){

    const m =
      game.meteors[i];

    m.y +=
      m.speed *
      game.difficulty *
      dt;

    m.rotation +=
      m.spin*dt;

    const d =
      Math.hypot(
        m.x-game.player.x,
        m.y-game.player.y
      );

    if(
      d <
      m.radius+18
    ){

      if(game.shield){

        game.shield=0;

        $("gameShield").textContent="○";

        explode(
          game.player.x,
          game.player.y,
          "#5deaff",
          22
        );

        game.meteors.splice(i,1);

        vibrate([25,40,25]);

        continue;

      }

      endGame();

      return;

    }

    if(
      m.y >
      h+80
    ){

      game.meteors.splice(i,1);

    }

  }


  // Update crystals

  for(
    let i=game.crystalsList.length-1;
    i>=0;
    i--
  ){

    const c =
      game.crystalsList[i];

    c.y +=
      c.speed *
      game.difficulty *
      dt;

    c.angle +=
      .04*dt;

    const d =
      Math.hypot(
        c.x-game.player.x,
        c.y-game.player.y
      );

    if(d<34){

      game.crystals++;

      gems++;

      game.combo =
        Math.min(
          9,
          game.combo+1
        );

      game.score +=
        25*game.combo;

      $("gameCombo").textContent =
        "x"+game.combo;

      $("gameScore").textContent =
        Math.floor(
          game.score
        );

      explode(
        c.x,
        c.y,
        "#61efff",
        14
      );

      game.crystalsList.splice(i,1);

      vibrate(12);

    }

    if(c.y>h+50){

      game.crystalsList.splice(i,1);

      game.combo=1;

      $("gameCombo").textContent="x1";

    }

  }


  // Survival points

  game.score +=
    .12 *
    game.difficulty *
    dt;

  $("gameScore").textContent =
    Math.floor(game.score);


  updateParticles(dt);

}


function spawnMeteor(){

  const w =
    canvas.clientWidth;

  game.meteors.push({

    x:
      25+
      Math.random()*
      (w-50),

    y:-60,

    radius:
      17+
      Math.random()*17,

    speed:
      1.5+
      Math.random()*1.5,

    rotation:
      Math.random()*6,

    spin:
      (Math.random()-.5)*.08,

    hue:
      Math.random()

  });

}


function spawnCrystal(){

  const w =
    canvas.clientWidth;

  game.crystalsList.push({

    x:
      30+
      Math.random()*
      (w-60),

    y:-30,

    speed:
      1.5+

      Math.random(),

    size:11,

    angle:0

  });

}


function explode(
  x,
  y,
  color,
  amount
){

  for(
    let i=0;
    i<amount;
    i++
  ){

    const angle =
      Math.random()*
      Math.PI*2;

    const speed =
      1+
      Math.random()*5;

    game.particles.push({

      x,
      y,

      vx:
        Math.cos(angle)*
        speed,

      vy:
        Math.sin(angle)*
        speed,

      life:1,

      size:
        1+
        Math.random()*3,

      color

    });

  }

}


function updateParticles(dt){

  for(
    let i=game.particles.length-1;
    i>=0;
    i--
  ){

    const p =
      game.particles[i];

    p.x +=
      p.vx*dt;

    p.y +=
      p.vy*dt;

    p.vx *= .97;
    p.vy *= .97;

    p.life -=
      .035*dt;

    if(p.life<=0){

      game.particles.splice(i,1);

    }

  }

}


function draw(){

  const w =
    canvas.clientWidth;

  const h =
    canvas.clientHeight;

  ctx.clearRect(
    0,0,w,h
  );


  // Deep space

  const bg =
    ctx.createRadialGradient(
      w*.5,
      h*.35,
      10,
      w*.5,
      h*.45,
      h
    );

  bg.addColorStop(
    0,
    "#16153a"
  );

  bg.addColorStop(
    .5,
    "#080a1b"
  );

  bg.addColorStop(
    1,
    "#02030a"
  );

  ctx.fillStyle=bg;

  ctx.fillRect(
    0,0,w,h
  );


  drawStars(w,h);

  drawNebula(w,h);

  game.crystalsList.forEach(
    drawCrystal
  );

  game.meteors.forEach(
    drawMeteor
  );

  drawParticles();

  drawShip();

}


function drawStars(w,h){

  game.stars.forEach((s,i)=>{

    const speed =
      .3+
      s.z*1.4;

    s.y +=
      .0015*
      speed*
      game.difficulty;

    if(s.y>1)
      s.y=0;

    const x =
      s.x*w;

    const y =
      s.y*h;

    const size =
      .4+
      s.z*1.5;

    ctx.globalAlpha =
      .25+
      s.z*.6;

    ctx.fillStyle="#fff";

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      size,
      0,
      Math.PI*2
    );

    ctx.fill();

  });

  ctx.globalAlpha=1;

}


function drawNebula(w,h){

  const g =
    ctx.createRadialGradient(
      w*.25,
      h*.3,
      10,
      w*.25,
      h*.3,
      180
    );

  g.addColorStop(
    0,
    "rgba(119,83,255,.18)"
  );

  g.addColorStop(
    1,
    "rgba(119,83,255,0)"
  );

  ctx.fillStyle=g;

  ctx.fillRect(
    0,0,w,h
  );

}


function drawMeteor(m){

  ctx.save();

  ctx.translate(
    m.x,
    m.y
  );

  ctx.rotate(
    m.rotation
  );


  // Outer glow

  ctx.shadowBlur=25;

  ctx.shadowColor=
    "rgba(255,92,78,.35)";


  // Shape

  ctx.beginPath();

  const points=11;

  for(
    let i=0;
    i<points;
    i++
  ){

    const a =
      i/
      points*
      Math.PI*2;

    const r =
      m.radius*
      (
        .82+
        Math.sin(i*4.7)*.09+
        Math.random()*.08
      );

    const x =
      Math.cos(a)*r;

    const y =
      Math.sin(a)*r;

    if(i===0)
      ctx.moveTo(x,y);
    else
      ctx.lineTo(x,y);

  }

  ctx.closePath();


  const rock =
    ctx.createRadialGradient(
      -m.radius*.3,
      -m.radius*.35,
      2,
      0,
      0,
      m.radius
    );

  rock.addColorStop(
    0,
    "#c5a08f"
  );

  rock.addColorStop(
    .45,
    "#755f62"
  );

  rock.addColorStop(
    1,
    "#292936"
  );

  ctx.fillStyle=rock;

  ctx.fill();


  // Craters

  ctx.shadowBlur=0;

  for(let i=0;i<4;i++){

    const a =
      i*1.7;

    const r =
      m.radius*.35;

    ctx.fillStyle=
      "rgba(20,18,28,.35)";

    ctx.beginPath();

    ctx.arc(
      Math.cos(a)*r,
      Math.sin(a)*r,
      m.radius*.12,
      0,
      Math.PI*2
    );

    ctx.fill();

  }

  ctx.restore();

}


function drawCrystal(c){

  ctx.save();

  ctx.translate(
    c.x,
    c.y
  );

  ctx.rotate(
    c.angle
  );


  ctx.shadowBlur=25;

  ctx.shadowColor="#20eaff";


  // Crystal

  ctx.beginPath();

  ctx.moveTo(
    0,
    -c.size*1.5
  );

  ctx.lineTo(
    c.size,
    -c.size*.35
  );

  ctx.lineTo(
    c.size*.55,
    c.size*1.2
  );

  ctx.lineTo(
    -c.size*.55,
    c.size*1.2
  );

  ctx.lineTo(
    -c.size,
    -c.size*.35
  );

  ctx.closePath();


  const crystal =
    ctx.createLinearGradient(
      0,
      -20,
      0,
      20
    );

  crystal.addColorStop(
    0,
    "#ffffff"
  );

  crystal.addColorStop(
    .25,
    "#a1f8ff"
  );

  crystal.addColorStop(
    .6,
    "#25d9ff"
  );

  crystal.addColorStop(
    1,
    "#5d54ff"
  );

  ctx.fillStyle=crystal;

  ctx.fill();


  // Highlight

  ctx.fillStyle=
    "rgba(255,255,255,.7)";

  ctx.beginPath();

  ctx.moveTo(
    0,
    -c.size*1.1
  );

  ctx.lineTo(
    c.size*.35,
    -c.size*.2
  );

  ctx.lineTo(
    0,
    c.size*.45
  );

  ctx.closePath();

  ctx.fill();

  ctx.restore();

}


function drawShip(){

  const x =
    game.player.x;

  const y =
    game.player.y;

  ctx.save();

  ctx.translate(x,y);


  // Engine trail

  const flame =
    ctx.createLinearGradient(
      0,
      12,
      0,
      48
    );

  flame.addColorStop(
    0,
    "#ffffff"
  );

  flame.addColorStop(
    .3,
    "#2de7ff"
  );

  flame.addColorStop(
    1,
    "rgba(91,69,255,0)"
  );

  ctx.fillStyle=flame;

  ctx.beginPath();

  ctx.moveTo(-7,10);
  ctx.lineTo(0,48);
  ctx.lineTo(7,10);
  ctx.closePath();

  ctx.fill();


  // Ship glow

  ctx.shadowBlur=28;

  ctx.shadowColor=
    "#32dcff";


  // Main hull

  ctx.beginPath();

  ctx.moveTo(
    0,
    -28
  );

  ctx.bezierCurveTo(
    12,-14,
    20,3,
    15,18
  );

  ctx.lineTo(
    0,12
  );

  ctx.lineTo(
    -15,18
  );

  ctx.bezierCurveTo(
    -20,3,
    -12,-14,
    0,-28
  );

  ctx.closePath();


  const hull =
    ctx.createLinearGradient(
      0,-30,
      0,20
    );

  hull.addColorStop(
    0,
    "#ffffff"
  );

  hull.addColorStop(
    .28,
    "#82f2ff"
  );

  hull.addColorStop(
    .65,
    "#6d65ff"
  );

  hull.addColorStop(
    1,
    "#292b73"
  );

  ctx.fillStyle=hull;

  ctx.fill();


  // Cockpit

  ctx.shadowBlur=10;

  ctx.beginPath();

  ctx.ellipse(
    0,
    -7,
    6,
    10,
    0,
    0,
    Math.PI*2
  );

  const cockpit =
    ctx.createLinearGradient(
      0,-17,
      0,3
    );

  cockpit.addColorStop(
    0,
    "#ffffff"
  );

  cockpit.addColorStop(
    1,
    "#00bce8"
  );

  ctx.fillStyle=cockpit;

  ctx.fill();


  // Wings

  ctx.fillStyle="#393da2";

  ctx.beginPath();

  ctx.moveTo(-9,2);
  ctx.lineTo(-26,17);
  ctx.lineTo(-12,14);
  ctx.closePath();

  ctx.fill();

  ctx.beginPath();

  ctx.moveTo(9,2);
  ctx.lineTo(26,17);
  ctx.lineTo(12,14);
  ctx.closePath();

  ctx.fill();


  // Shield

  if(game.shield){

    ctx.shadowBlur=16;

    ctx.shadowColor="#36eaff";

    ctx.strokeStyle=
      "rgba(70,235,255,.5)";

    ctx.lineWidth=1.5;

    ctx.beginPath();

    ctx.arc(
      0,
      0,
      32,
      0,
      Math.PI*2
    );

    ctx.stroke();

  }


  ctx.restore();

}


function drawParticles(){

  game.particles.forEach(p=>{

    ctx.globalAlpha =
      Math.max(0,p.life);

    ctx.fillStyle=p.color;

    ctx.shadowBlur=12;

    ctx.shadowColor=p.color;

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      p.size,
      0,
      Math.PI*2
    );

    ctx.fill();

  });

  ctx.globalAlpha=1;
  ctx.shadowBlur=0;

}


function endGame(){

  game.running=false;

  cancelAnimationFrame(raf);

  const final =
    Math.floor(game.score);

  if(final>bestScore){

    bestScore=final;

  }

  const reward =
    Math.max(
      5,
      Math.floor(
        final*.12+
        game.crystals*15
      )
    );

  points += reward;

  $("finalScore").textContent =
    final.toLocaleString();

  $("finalGems").textContent =
    game.crystals;

  $("finalReward").textContent =
    "+"+reward;

  $("gameOver").classList.remove(
    "hidden"
  );

  save();

  updateHome();

  vibrate([
    50,
    50,
    100
  ]);

}


function vibrate(pattern){

  if(navigator.vibrate){

    navigator.vibrate(pattern);

  }

}


updateHome();