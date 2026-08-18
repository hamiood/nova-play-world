const tg = window.Telegram.WebApp;

try {
  tg.ready();
  tg.expand();
} catch (e) {}

let points = Number(localStorage.getItem("nova_points") || 0);
let streak = Number(localStorage.getItem("nova_streak") || 0);

let running = false;
let score = 0;
let time = 30;
let timerInterval = null;

const $ = (id) => document.getElementById(id);

function updateUI() {
  if ($("points")) $("points").textContent = points.toLocaleString();
  if ($("streak")) $("streak").textContent = streak;

  localStorage.setItem("nova_points", points);
  localStorage.setItem("nova_streak", streak);
}

function openGame() {
  $("homeScreen").style.display = "none";
  $("gameScreen").style.display = "block";
}

function closeGame() {
  stopGame();

  $("gameScreen").style.display = "none";
  $("homeScreen").style.display = "block";
}

function startGame() {
  if (running) return;

  running = true;
  score = 0;
  time = 30;

  $("score").textContent = "0";
  $("timer").textContent = "30";

  $("startButton").style.display = "none";
  $("result").style.display = "none";

  moveTarget();

  timerInterval = setInterval(() => {
    time--;

    $("timer").textContent = time;

    if (time <= 0) {
      finishGame();
    }
  }, 1000);
}

function moveTarget() {
  if (!running) return;

  const arena = $("arena");
  const target = $("target");

  const maxX = arena.clientWidth - 63;
  const maxY = arena.clientHeight - 63;

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  target.style.left = `${x}px`;
  target.style.top = `${y}px`;
  target.style.display = "block";
}

function hitTarget() {
  if (!running) return;

  score++;

  $("score").textContent = score;

  // Small visual feedback
  if (navigator.vibrate) {
    navigator.vibrate(12);
  }

  moveTarget();
}

function finishGame() {
  stopGame();

  const reward = score * 3;

  points += reward;

  updateUI();

  $("resultText").innerHTML =
    `You scored <strong>${score}</strong> hits<br>
     You earned <strong>+${reward}</strong> NOVA Points`;

  $("result").style.display = "block";
}

function stopGame() {
  running = false;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  if ($("target")) {
    $("target").style.display = "none";
  }

  if ($("startButton")) {
    $("startButton").style.display = "block";
    $("startButton").textContent = "START GAME";
  }
}

function claimDaily() {
  const today = new Date().toDateString();
  const lastClaim = localStorage.getItem("nova_last_claim");

  if (today === lastClaim) {
    showMessage("Daily reward already claimed 🎁");
    return;
  }

  points += 100;
  streak += 1;

  localStorage.setItem("nova_last_claim", today);

  updateUI();

  showMessage("+100 NOVA Points ✨");
}

function showMessage(message) {
  alert(message);
}

function switchTab(tab) {
  if (tab === "games") {
    openGame();
  } else if (tab === "home") {
    closeGame();
  } else {
    showMessage("This section is coming soon 🚀");
  }
}

updateUI();