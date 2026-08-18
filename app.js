const $ = id => document.getElementById(id);

const canvas = $("gameCanvas");
const ctx = canvas.getContext("2d");

let best = Number(localStorage.getItem("nova_best") || 0);
let totalCrystals = Number(localStorage.getItem("nova_crystals") || 0);

$("bestScore").textContent = best.toLocaleString();
$("totalCrystals").textContent = totalCrystals.toLocaleString();

let W = 0;
let H = 0;

let playing = false;
let animation = 0;
let lastTime = 0;

let score = 0;
let crystals = 0;
let shield = 1;
let elapsed = 0;

let ship = {
  x: 0,
  y: 0,
  targetX: 0
};

let meteors = [];
let gems = [];
let particles = [];
let stars = [];

function resizeGame(){

  const rect = canvas.getBoundingClientRect();

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  W = rect.width;
  H = rect.height;

  canvas.width = W * dpr;
  canvas.height = H * dpr;

  ctx.setTransform(dpr,0,0,dpr,0,0);

  ship.y = H - 75;

  if(!playing){
    ship.x = W / 2;
    ship.targetX = W / 2;
  }
}

window.addEventListener("resize", resizeGame);

function openGame(){

  $("app").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");

  requestAnimationFrame(() => {
    resizeGame();
    createStars();
  });
}

function closeGame(){

  playing = false;

  if(animation){
    cancelAnimationFrame(animation);
  }

  $("gameScreen").classList.add("hidden");
  $("app").classList.remove("hidden");
}

$("playBtn").addEventListener("click", openGame);
$("missionBtn").addEventListener("click", openGame);
$("backBtn").addEventListener("click", closeGame);

$("launchBtn").addEventListener("click", startGame);
$("retryBtn").addEventListener("click", startGame);

canvas.addEventListener("pointerdown", moveShip);
canvas.addEventListener("pointermove", moveShip);

function moveShip(event){

  if(!playing) return;

  const rect = canvas.getBoundingClientRect();

  ship.targetX = Math.max(
    28,
    Math.min(
      W - 28,
      event.clientX - rect.left
    )
  );
}

function createStars(){

  stars = [];

  for(let i=0;i<110;i++){

    stars.push({
      x:Math.random()*W,
      y:Math.random()*H,
      size:.5+Math.random()*1.5,
      speed:.2+Math.random()*.8,
      alpha:.2+Math.random()*.7
    });
  }
}

function startGame(){

  resizeGame();

  playing = true;
  score = 0;
  crystals = 0;
  shield = 1;
  elapsed = 0;

  meteors = [];
  gems = [];
  particles = [];

  ship.x = W/2;
  ship.targetX = W/2;
  ship.y = H-75;

  $("score").textContent = "0";
  $("crystals").textContent = "0";
  $("shield").textContent = "●";

  $("startOverlay").classList.add("hidden");
  $("gameOver").classList.add("hidden");

  lastTime = performance.now();

  animation = requestAnimationFrame(loop);
}

function loop(now){

  if(!playing) return;

  const dt = Math.min((now-lastTime)/16.67,2);

  lastTime = now;

  update(dt);
  draw();

  animation = requestAnimationFrame(loop);
}

function update(dt){

  elapsed += dt / 60;

  ship.x += (ship.targetX-ship.x) * .16 * dt;

  for(const star of stars){

    star.y += star.speed * dt;

    if(star.y > H){
      star.y = 0;
      star.x = Math.random()*W;
    }
  }

  if(Math.random() < (.025 + elapsed*.0007)*dt){
    spawnMeteor();
  }

  if(Math.random() < .012*dt){
    spawnGem();
  }

  for(let i=meteors.length-1;i>=0;i--){

    const m = meteors[i];

    m.y += m.speed * (1 + elapsed*.035) * dt;
    m.rotation += m.spin * dt;

    if(distance(m.x,m.y,ship.x,ship.y) < m.radius+20){

      if(shield){

        shield = 0;

        $("shield").textContent = "○";

        burst(ship.x,ship.y,"#4eeaff",25);

        meteors.splice(i,1);

        continue;

      }else{

        gameOver();
        return;
      }
    }

    if(m.y > H+80){
      meteors.splice(i,1);
    }
  }

  for(let i=gems.length-1;i>=0;i--){

    const g = gems[i];

    g.y += g.speed * (1+elapsed*.02) * dt;
    g.rotation += .04*dt;

    if(distance(g.x,g.y,ship.x,ship.y)<32){

      crystals++;
      totalCrystals++;

      score += 50;

      $("crystals").textContent = crystals;

      burst(g.x,g.y,"#54efff",18);

      gems.splice(i,1);

      continue;
    }

    if(g.y>H+50){
      gems.splice(i,1);
    }
  }

  score += .18 * dt * (1+elapsed*.03);

  $("score").textContent = Math.floor(score).toLocaleString();

  for(let i=particles.length-1;i>=0;i--){

    const p = particles[i];

    p.x += p.vx*dt;
    p.y += p.vy*dt;

    p.life -= .035*dt;

    if(p.life<=0){
      particles.splice(i,1);
    }
  }
}

function spawnMeteor(){

  const radius = 15 + Math.random()*19;

  meteors.push({
    x:radius+Math.random()*(W-radius*2),
    y:-radius-20,
    radius,
    speed:1.4+Math.random()*2.2,
    rotation:Math.random()*Math.PI,
    spin:(Math.random()-.5)*.09
  });
}

function spawnGem(){

  gems.push({
    x:25+Math.random()*(W-50),
    y:-25,
    speed:1.3+Math.random()*1.2,
    rotation:Math.random()*6
  });
}

function distance(x1,y1,x2,y2){

  return Math.hypot(x1-x2,y1-y2);
}

function burst(x,y,color,count){

  for(let i=0;i<count;i++){

    const angle = Math.random()*Math.PI*2;
    const speed = 1+Math.random()*5;

    particles.push({
      x,
      y,
      vx:Math.cos(angle)*speed,
      vy:Math.sin(angle)*speed,
      life:1,
      size:1+Math.random()*3,
      color
    });
  }
}

function draw(){

  ctx.clearRect(0,0,W,H);

  const bg = ctx.createRadialGradient(
    W*.5,
    H*.35,
    10,
    W*.5,
    H*.5,
    H
  );

  bg.addColorStop(0,"#18184d");
  bg.addColorStop(.5,"#080a1d");
  bg.addColorStop(1,"#02030a");

  ctx.fillStyle = bg;
  ctx.fillRect(0,0,W,H);

  drawStars();

  for(const g of gems){
    drawGem(g);
  }

  for(const m of meteors){
    drawMeteor(m);
  }

  drawParticles();
  drawShip();
}

function drawStars(){

  for(const s of stars){

    ctx.globalAlpha=s.alpha;

    ctx.fillStyle="#fff";

    ctx.beginPath();

    ctx.arc(
      s.x,
      s.y,
      s.size,
      0,
      Math.PI*2
    );

    ctx.fill();
  }

  ctx.globalAlpha=1;
}

function drawMeteor(m){

  ctx.save();

  ctx.translate(m.x,m.y);
  ctx.rotate(m.rotation);

  ctx.shadowBlur=20;
  ctx.shadowColor="#ff694d";

  ctx.beginPath();

  for(let i=0;i<10;i++){

    const a = i/10*Math.PI*2;

    const r = m.radius * (
      .82 + Math.sin(i*3.7)*.08 + Math.random()*.06
    );

    const x = Math.cos(a)*r;
    const y = Math.sin(a)*r;

    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  }

  ctx.closePath();

  const gradient = ctx.createRadialGradient(
    -m.radius*.3,
    -m.radius*.35,
    1,
    0,
    0,
    m.radius
  );

  gradient.addColorStop(0,"#d5b0a2");
  gradient.addColorStop(.45,"#706069");
  gradient.addColorStop(1,"#242433");

  ctx.fillStyle=gradient;
  ctx.fill();

  ctx.shadowBlur=0;

  ctx.fillStyle="#18182488";

  for(let i=0;i<3;i++){

    ctx.beginPath();

    ctx.arc(
      (Math.random()-.5)*m.radius,
      (Math.random()-.5)*m.radius,
      m.radius*.12,
      0,
      Math.PI*2
    );

    ctx.fill();
  }

  ctx.restore();
}

function drawGem(g){

  ctx.save();

  ctx.translate(g.x,g.y);
  ctx.rotate(g.rotation);

  ctx.shadowBlur=25;
  ctx.shadowColor="#43eaff";

  ctx.beginPath();

  ctx.moveTo(0,-18);
  ctx.lineTo(12,-5);
  ctx.lineTo(7,14);
  ctx.lineTo(-7,14);
  ctx.lineTo(-12,-5);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(0,-18,0,15);

  gradient.addColorStop(0,"#ffffff");
  gradient.addColorStop(.3,"#a4f9ff");
  gradient.addColorStop(.65,"#25ddff");
  gradient.addColorStop(1,"#6958ff");

  ctx.fillStyle=gradient;
  ctx.fill();

  ctx.restore();
}

function drawShip(){

  ctx.save();

  ctx.translate(ship.x,ship.y);

  ctx.shadowBlur=25;
  ctx.shadowColor="#45eaff";

  const flame = ctx.createLinearGradient(0,8,0,45);

  flame.addColorStop(0,"#fff");
  flame.addColorStop(.3,"#4eeaff");
  flame.addColorStop(1,"transparent");

  ctx.fillStyle=flame;

  ctx.beginPath();

  ctx.moveTo(-7,8);
  ctx.lineTo(0,48);
  ctx.lineTo(7,8);
  ctx.closePath();

  ctx.fill();

  ctx.beginPath();

  ctx.moveTo(0,-30);
  ctx.bezierCurveTo(
    13,-14,
    19,5,
    14,18
  );

  ctx.lineTo(0,12);
  ctx.lineTo(-14,18);

  ctx.bezierCurveTo(
    -19,5,
    -13,-14,
    0,-30
  );

  ctx.closePath();

  const hull = ctx.createLinearGradient(0,-30,0,20);

  hull.addColorStop(0,"#ffffff");
  hull.addColorStop(.3,"#8ff7ff");
  hull.addColorStop(.7,"#675fff");
  hull.addColorStop(1,"#25276e");

  ctx.fillStyle=hull;
  ctx.fill();

  ctx.fillStyle="#e9ffff";

  ctx.beginPath();

  ctx.ellipse(
    0,
    -8,
    6,
    10,
    0,
    0,
    Math.PI*2
  );

  ctx.fill();

  if(shield){

    ctx.strokeStyle="#4eeaff66";
    ctx.lineWidth=1.5;
    ctx.shadowBlur=20;

    ctx.beginPath();

    ctx.arc(
      0,
      0,
      33,
      0,
      Math.PI*2
    );

    ctx.stroke();
  }

  ctx.restore();
}

function drawParticles(){

  for(const p of particles){

    ctx.globalAlpha=Math.max(0,p.life);

    ctx.fillStyle=p.color;
    ctx.shadowBlur=10;
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
  }

  ctx.globalAlpha=1;
  ctx.shadowBlur=0;
}

function gameOver(){

  playing=false;

  if(animation){
    cancelAnimationFrame(animation);
  }

  const finalScore=Math.floor(score);

  if(finalScore>best){
    best=finalScore;
  }

  localStorage.setItem("nova_best",best);
  localStorage.setItem("nova_crystals",totalCrystals);

  $("bestScore").textContent=best.toLocaleString();
  $("totalCrystals").textContent=totalCrystals.toLocaleString();

  $("finalScore").textContent=finalScore.toLocaleString();
  $("finalCrystals").textContent=crystals;

  $("gameOver").classList.remove("hidden");
}

$("gameScreen").addEventListener("touchmove",function(e){
  if(e.target===canvas){
    e.preventDefault();
  }
},{passive:false});