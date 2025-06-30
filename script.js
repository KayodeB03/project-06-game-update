const player = document.getElementById('player');
const gameWorld = document.getElementById('game-world');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score'); // Get the score display
const platforms = Array.from(document.getElementsByClassName('platform'));

// Physics and movement variables
let positionX = 50;
let positionY = 0;
let velocityX = 0;
let velocityY = 0;
const gravity = 0.8;
const moveSpeed = 4;
const jumpStrength = -14;
const groundLevel = 370;
let onGround = false;

// Input tracking
const keys = {
  left: false,
  right: false,
  up: false
};

// Timer logic
let hasMoved = false;
let timer = 0;
let timerInterval = null;

function startTimer() {
  timerInterval = setInterval(() => {
    timer++;
    const minutes = Math.floor(timer / 60).toString().padStart(2, '0');
    const seconds = (timer % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${minutes}:${seconds}`;
  }, 1000);
}

// Score tracking
let score = 0; // Track the player's score

// Get all water can images (using a class for easier selection)
const waterCans = Array.from(document.querySelectorAll('.water-can'));

// Function to reset the game state
function resetGame() {
  // Reset score
  score = 0;
  scoreDisplay.textContent = `Score: ${score.toString().padStart(3, '0')}`;

  // Reset timer
  timer = 0;
  timerDisplay.textContent = '00:00';
  hasMoved = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Reset player position
  positionX = 50;
  positionY = 0;
  velocityX = 0;
  velocityY = 0;
  player.style.left = `${positionX}px`;
  player.style.top = `${positionY}px`;

  // Reset water cans (show them again)
  for (let i = 0; i < waterCans.length; i++) {
    if (waterCans[i]) {
      waterCans[i].style.display = '';
    }
    // If null (collected), re-select from DOM
    if (!waterCans[i]) {
      // Try to find the can in the DOM by index
      const cans = document.querySelectorAll('.water-can');
      if (cans[i]) {
        waterCans[i] = cans[i];
        waterCans[i].style.display = '';
      }
    }
  }
}

// Input handling
document.addEventListener('keydown', (e) => {
  if (!hasMoved && ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) {
    hasMoved = true;
    startTimer();
  }

  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
  if ((e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') && onGround) {
    velocityY = jumpStrength;
    onGround = false;
  }
  if (e.code === 'KeyR') {
    resetGame();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
});

// Game loop
function gameLoop() {
  // Horizontal movement
  if (keys.left) {
    velocityX = -moveSpeed;
  } else if (keys.right) {
    velocityX = moveSpeed;
  } else {
    velocityX = 0;
  }

  // Apply gravity
  velocityY += gravity;

  // Update positions
  positionX += velocityX;
  positionY += velocityY;
  onGround = false; // Reset onGround each frame

  // Platform collision detection
  for (let platform of platforms) {
    const pRect = platform.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();
    const worldRect = gameWorld.getBoundingClientRect();

    // Convert platform and player rects to local positions
    const platX = pRect.left - worldRect.left;
    const platY = pRect.top - worldRect.top;
    const platW = platform.offsetWidth;
    const platH = platform.offsetHeight;

    const playerW = player.offsetWidth;
    const playerH = player.offsetHeight;

    // Check horizontal overlap
    const horizontalOverlap =
      positionX + playerW > platX &&
      positionX < platX + platW;

    const playerBottom = positionY + playerH;
    const playerPrevBottom = playerBottom - velocityY;

    // Check if landing on top of platform
    if (
      horizontalOverlap &&
      playerPrevBottom <= platY &&
      playerBottom >= platY
    ) {
      // Landed on platform
      positionY = platY - playerH;
      velocityY = 0;
      onGround = true;
    }

    // Optional: prevent jumping through platform from below
    const playerTop = positionY;
    const playerPrevTop = playerTop - velocityY;
    const platformBottom = platY + platH;

    if (
      horizontalOverlap &&
      playerPrevTop >= platformBottom &&
      playerTop <= platformBottom
    ) {
      // Hit platform from below
      positionY = platformBottom;
      velocityY = 0;
    }
  }

  // Floor collision
  if (positionY >= groundLevel) {
    positionY = groundLevel;
    velocityY = 0;
    onGround = true;
  }

  // Wall boundaries
  const maxX = gameWorld.clientWidth - player.clientWidth;
  if (positionX < 0) positionX = 0;
  if (positionX > maxX) positionX = maxX;

  // Apply updated position
  player.style.left = `${positionX}px`;
  player.style.top = `${positionY}px`;

  // Check collision with water cans
  for (let i = 0; i < waterCans.length; i++) {
    const can = waterCans[i];
    if (!can) continue; // Skip if already collected
    // Get bounding rectangles
    const canRect = can.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();
    // Check for overlap (simple AABB collision)
    const isColliding =
      playerRect.left < canRect.right &&
      playerRect.right > canRect.left &&
      playerRect.top < canRect.bottom &&
      playerRect.bottom > canRect.top;
    if (isColliding) {
      // Increase score by 100
      score += 100;
      // Update the score display
      scoreDisplay.textContent = `Score: ${score.toString().padStart(3, '0')}`;
      // Remove the can from the game
      can.style.display = 'none';
      // Remove from array so we don't check again
      waterCans[i] = null;
    }
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
