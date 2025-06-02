const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const gameContainer = document.getElementById("gameContainer");
const player = document.getElementById("player");
const obstacle = document.getElementById("obstacle");
const gameOverText = document.getElementById("gameOverText");
const restartButton = document.getElementById("restartButton");

const jumpSound = new Audio("jump.mp3");
const gameOverSound = new Audio("gameover.mp3");
const bgMusic = new Audio("background.mp3");

bgMusic.loop = true;
bgMusic.volume = 0.5;
jumpSound.volume = 0.5;
gameOverSound.volume = 0.5;

let isGameOver = false;
let isPaused = false;
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let scoreInterval;

let obstacleSpeed = 8;
let nextSpeedIncreaseScore = 50;
let obstacleX = window.innerWidth;
let lastTimestamp = null;

let lastEffectTriggerScore = 0; // for color switch
let lastShakeScore = 0;
// Bounce animation
let bounceHeight = 0;
let bounceDirection = 1;
const bounceMax = 30;

// Dark mode flag
let isDarkMode = false;

// Create Dark Mode Toggle Button
const darkModeToggle = document.createElement("button");
darkModeToggle.id = "darkModeToggle";
darkModeToggle.title = "Toggle Dark Mode";
darkModeToggle.style.position = "absolute";
darkModeToggle.style.top = "15px";
darkModeToggle.style.right = "15px";
darkModeToggle.style.background = "transparent";
darkModeToggle.style.border = "none";
darkModeToggle.style.cursor = "pointer";
darkModeToggle.style.zIndex = "1001";
darkModeToggle.style.width = "40px";
darkModeToggle.style.height = "40px";
darkModeToggle.style.display = "flex";
darkModeToggle.style.justifyContent = "center";
darkModeToggle.style.alignItems = "center";
darkModeToggle.style.borderRadius = "50%";
darkModeToggle.style.transition = "background-color 0.3s ease";
darkModeToggle.style.color = "#333";

gameContainer.style.position = "relative";
gameContainer.appendChild(darkModeToggle);

// Function to apply light or dark mode background
function applyBackground() {
  if (isDarkMode) {
    // Dark background
    gameContainer.style.backgroundColor = "#121212";
    gameContainer.style.color = "#eee"; // if you have any text
  } else {
    // Light background (original)
    gameContainer.style.backgroundColor = ""; // resets to default
    gameContainer.style.color = "#000";
  }
}

// Dark mode toggle handler
darkModeToggle.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  applyBackground();

  // Optional: Change button color on toggle
  if (isDarkMode) {
    darkModeToggle.style.color = "#f0e68c"; // soft yellow for moon
    darkModeToggle.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
  } else {
    darkModeToggle.style.color = "#333";
    darkModeToggle.style.backgroundColor = "transparent";
  }
});

// Initial background on load
applyBackground();

function bounceObstacle() {
  if (!isGameOver && !isPaused) {
    bounceHeight += bounceDirection * 2;
    if (bounceHeight >= bounceMax) bounceDirection = -1;
    else if (bounceHeight <= 0) bounceDirection = 1;
    obstacle.style.bottom = bounceHeight + "px";
  }
  requestAnimationFrame(bounceObstacle);
}

function moveObstacle(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  if (!isGameOver && !isPaused) {
    obstacleX -= obstacleSpeed * (delta / 16);
    if (obstacleX + obstacle.offsetWidth < 0) {
      obstacleX = window.innerWidth;
    }
    obstacle.style.left = obstacleX + "px";
  }

  requestAnimationFrame(moveObstacle);
}

function increaseDifficulty() {
  if (score >= nextSpeedIncreaseScore) {
    obstacleSpeed = Math.min(obstacleSpeed + 1.5, 20);
    nextSpeedIncreaseScore += 50;
  }

  if (score >= lastEffectTriggerScore + 50) {
    triggerVisualEffect(score);
    lastEffectTriggerScore = score;
  }

  if (score >= lastShakeScore + 50) {
    triggerShakeEffect();
    lastShakeScore = score;
  }
}

// Color switch effect for 5 seconds
function triggerVisualEffect(currentScore) {
  const duration = 5000; // total effect duration (5s)
  const intervalTime = 200; // faster switch time (every 0.2s)
  let elapsed = 0;

  const filters = [
    "grayscale(1)",
    "invert(1)",
    "sepia(1)",
    "hue-rotate(90deg)",
    "hue-rotate(180deg)",
    "contrast(2)",
    "blur(2px)",
    "none"
  ];

  const effectInterval = setInterval(() => {
    if (elapsed >= duration || isGameOver) {
      gameContainer.style.filter = "none";
      clearInterval(effectInterval);
    } else {
      const randomFilter = filters[Math.floor(Math.random() * filters.length)];
      gameContainer.style.filter = randomFilter;
      elapsed += intervalTime;
    }
  }, intervalTime);
}
// Shake screen effect
function triggerShakeEffect() {
  const duration = 1500;
  const intervalTime = 50;
  let elapsed = 0;

  const shakeInterval = setInterval(() => {
    if (elapsed >= duration || isGameOver) {
      gameContainer.style.transform = "translate(0, 0)";
      clearInterval(shakeInterval);
    } else {
      const randomX = Math.floor(Math.random() * 10) - 5;
      const randomY = Math.floor(Math.random() * 10) - 5;
      gameContainer.style.transform = `translate(${randomX}px, ${randomY}px)`;
      elapsed += intervalTime;
    }
  }, intervalTime);
}

// Countdown UI
const countdownOverlay = document.createElement("div");
countdownOverlay.style.position = "fixed";
countdownOverlay.style.top = "0";
countdownOverlay.style.left = "0";
countdownOverlay.style.width = "100%";
countdownOverlay.style.height = "100%";
countdownOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
countdownOverlay.style.display = "flex";
countdownOverlay.style.justifyContent = "center";
countdownOverlay.style.alignItems = "center";
countdownOverlay.style.zIndex = "1000";
countdownOverlay.style.color = "white";
countdownOverlay.style.fontSize = "100px";
countdownOverlay.style.fontWeight = "bold";
countdownOverlay.style.fontFamily = "Arial, sans-serif";
countdownOverlay.style.display = "none";
document.body.appendChild(countdownOverlay);

startButton.addEventListener("click", () => {
  startScreen.style.display = "none";
  gameContainer.style.display = "block";

  obstacleX = window.innerWidth;
  obstacle.style.left = obstacleX + "px";
  bounceObstacle();
  startBgMusic();

  score = 0;
  isGameOver = false;
  isPaused = false;
  obstacleSpeed = 8;
  nextSpeedIncreaseScore = 50;
  lastEffectTriggerScore = 0;

  document.getElementById("score").innerText = `Score: 0 | High Score: ${highScore}`;
  clearInterval(scoreInterval);
  scoreInterval = setInterval(() => {
    if (!isGameOver && !isPaused) {
      score += 3;
      document.getElementById("score").innerText = `Score: ${score} | High Score: ${highScore}`;
      increaseDifficulty();
    }
  }, 1000);

  lastTimestamp = null;
  requestAnimationFrame(moveObstacle);
});

// Jump Logic
let isJumping = false;
let jumpSpeed = 7;
let fallSpeed = 8;
let maxJumpHeight = 200;
let currentJumpHeight = 0;
let isSpacePressed = false;

document.addEventListener("keydown", function (e) {
  if (e.code === "Space" && !isJumping && !isGameOver && !isPaused) {
    isSpacePressed = true;
    if (!isJumping) {
      isJumping = true;
      jumpSound.currentTime = 0;
      jumpSound.play().catch(() => {});
      jumpUp();
    }
  }
});
document.addEventListener("keyup", function (e) {
  if (e.code === "Space") {
    isSpacePressed = false;
  }
});
document.addEventListener("touchstart", function () {
  if (!isJumping && !isGameOver && !isPaused) {
    isSpacePressed = true;
    isJumping = true;
    jumpSound.currentTime = 0;
    jumpSound.play().catch(() => {});
    jumpUp();
  }
});
document.addEventListener("touchend", function () {
  isSpacePressed = false;
});

function jumpUp() {
  if (!isJumping) return;

  if (isSpacePressed && currentJumpHeight < maxJumpHeight) {
    currentJumpHeight += jumpSpeed;
    if (currentJumpHeight > maxJumpHeight) currentJumpHeight = maxJumpHeight;
    player.style.bottom = currentJumpHeight + "px";
    requestAnimationFrame(jumpUp);
  } else {
    if (currentJumpHeight < 100) {
      currentJumpHeight = 100;
      player.style.bottom = currentJumpHeight + "px";
    }
    fallDown();
  }
}

function fallDown() {
  if (currentJumpHeight > 0) {
    currentJumpHeight -= fallSpeed;
    if (currentJumpHeight < 0) currentJumpHeight = 0;
    player.style.bottom = currentJumpHeight + "px";
    requestAnimationFrame(fallDown);
  } else {
    isJumping = false;
  }
}

function checkCollision() {
  const playerBox = player.getBoundingClientRect();
  const obstacleBox = obstacle.getBoundingClientRect();

  const hitObstacle =
    playerBox.right > obstacleBox.left &&
    playerBox.left < obstacleBox.right &&
    playerBox.bottom > obstacleBox.top &&
    playerBox.top < obstacleBox.bottom;

  if (hitObstacle) {
    gameOver();
  }
}

function startCountdownRestart() {
  isPaused = true;
  let countdown = 3;
  countdownOverlay.innerText = countdown;
  countdownOverlay.style.display = "flex";

  const countdownInterval = setInterval(() => {
    countdown--;
    if (countdown === 0) {
      clearInterval(countdownInterval);
      countdownOverlay.style.display = "none";
      isPaused = false;
      restartGame();
    } else {
      countdownOverlay.innerText = countdown;
    }
  }, 1000);
}

function gameOver() {
  if (isGameOver) return;
  isGameOver = true;
  isPaused = true;
  gameOverText.style.display = "block";
  restartButton.style.display = "block";
  gameOverSound.play().catch(() => {});
  bgMusic.pause();

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
}

restartButton.addEventListener("click", () => {
  gameOverText.style.display = "none";
  restartButton.style.display = "none";
  startCountdownRestart();
});

function restartGame() {
  score = 0;
  obstacleSpeed = 8;
  nextSpeedIncreaseScore = 50;
  lastEffectTriggerScore = 0;
  lastShakeScore = 0;
  isGameOver = false;
  isPaused = false;

  obstacleX = window.innerWidth;
  obstacle.style.left = obstacleX + "px";
  player.style.bottom = "0px";
  currentJumpHeight = 0;

  document.getElementById("score").innerText = `Score: ${score} | High Score: ${highScore}`;

  bgMusic.currentTime = 0;
  startBgMusic();

  lastTimestamp = null;
  requestAnimationFrame(moveObstacle);
}

function startBgMusic() {
  bgMusic.play().catch(() => {});
}

// Main game loop: check collision every frame
function gameLoop() {
  if (!isGameOver && !isPaused) {
    checkCollision();
  }
  requestAnimationFrame(gameLoop);
}

gameLoop();
