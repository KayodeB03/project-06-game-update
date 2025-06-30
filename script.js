const player = document.getElementById('player');
const gameWorld = document.getElementById('game-world');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const waterProgress = document.getElementById('water-progress');
const messageContainer = document.getElementById('message-container');

const platforms = Array.from(document.getElementsByClassName('platform'));
let waterCans = Array.from(document.querySelectorAll('.water-can'));
const lifeDrops = Array.from(document.querySelectorAll('.life-drop'));

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
let score = 0;

// Prevent scroll with space/arrow keys
window.addEventListener('keydown', function (e) {
  const keysToBlock = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  if (keysToBlock.includes(e.code)) {
    e.preventDefault();
  }
}, false);

// Show motivational pickup message
function showMessage(text) {
  const message = document.createElement('div');
  message.className = 'pickup-message';
  message.textContent = text;
  message.style.left = `${positionX + 10}px`;
  message.style.top = `${positionY - 10}px`;
  messageContainer.appendChild(message);
  setTimeout(() => {
    message.remove();
  }, 1500);
}

// Reset the game state
function resetGame() {
  // Reset score and timer
  score = 0;
  scoreDisplay.textContent = `Score: ${score.toString().padStart(3, '0')}`;
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

  // Reset water cans
  waterCans = Array.from(document.querySelectorAll('.water-can'));
  for (let can of waterCans) {
    can.style.display = '';
  }

  // Reset progress bar
  waterProgress.style.width = '0%';

  // Reset life drops to gray
  for (let drop of lifeDrops) {
    if (!drop.classList.contains('gray')) {
      drop.classList.add('gray');
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
  velocityX = keys.left ? -moveSpeed : keys.right ? moveSpeed : 0;

  // Gravity
  velocityY += gravity;
  positionX += velocityX;
  positionY += velocityY;
  onGround = false;

  // Platform collision detection
  for (let platform of platforms) {
    const pRect = platform.getBoundingClientRect();
    const worldRect = gameWorld.getBoundingClientRect();

    const platX = pRect.left - worldRect.left;
    const platY = pRect.top - worldRect.top;
    const platW = platform.offsetWidth;
    const platH = platform.offsetHeight;

    const playerW = player.offsetWidth;
    const playerH = player.offsetHeight;

    const horizontalOverlap =
      positionX + playerW > platX &&
      positionX < platX + platW;

    const playerBottom = positionY + playerH;
    const playerPrevBottom = playerBottom - velocityY;

    if (
      horizontalOverlap &&
      playerPrevBottom <= platY &&
      playerBottom >= platY
    ) {
      positionY = platY - playerH;
      velocityY = 0;
      onGround = true;
    }

    const playerTop = positionY;
    const playerPrevTop = playerTop - velocityY;
    const platformBottom = platY + platH;

    if (
      horizontalOverlap &&
      playerPrevTop >= platformBottom &&
      playerTop <= platformBottom
    ) {
      positionY = platformBottom;
      velocityY = 0;
    }
  }

  // Ground collision
  if (positionY >= groundLevel) {
    positionY = groundLevel;
    velocityY = 0;
    onGround = true;
  }

  // Wall limits
  const maxX = gameWorld.clientWidth - player.clientWidth;
  if (positionX < 0) positionX = 0;
  if (positionX > maxX) positionX = maxX;

  // Apply position
  player.style.left = `${positionX}px`;
  player.style.top = `${positionY}px`;

  // Water can collection
  for (let i = 0; i < waterCans.length; i++) {
    const can = waterCans[i];
    if (!can) continue;

    const canRect = can.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    const isColliding =
      playerRect.left < canRect.right &&
      playerRect.right > canRect.left &&
      playerRect.top < canRect.bottom &&
      playerRect.bottom > canRect.top;

    if (isColliding) {
      // Update score
      score += 100;
      scoreDisplay.textContent = `Score: ${score.toString().padStart(3, '0')}`;

      // Hide the can
      can.style.display = 'none';
      waterCans[i] = null;

      // Show motivational message
      const phrases = [
        "Clean water collected!",
        "Another step to safe wells!",
        "Helping a village!",
        "Water is life!",
        "One drop at a time!"
      ];
      const message = phrases[Math.floor(Math.random() * phrases.length)];
      showMessage(message);

      // Light up next life-drop
      const litIndex = lifeDrops.findIndex(drop => drop.classList.contains('gray'));
      if (litIndex !== -1) {
        lifeDrops[litIndex].classList.remove('gray');
      }

      // Update progress bar
      const totalCans = document.querySelectorAll('.water-can').length;
      const collectedCans = totalCans - waterCans.filter(Boolean).length;
      const percent = (collectedCans / totalCans) * 100;
      waterProgress.style.width = `${percent}%`;
    }
  }

  // Water bottle collision
  const waterBottle = document.querySelector('.water-bottle');
  if (waterBottle && waterBottle.style.display !== 'none') {
    const bottleRect = waterBottle.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    const isTouchingBottle =
      playerRect.left < bottleRect.right &&
      playerRect.right > bottleRect.left &&
      playerRect.top < bottleRect.bottom &&
      playerRect.bottom > bottleRect.top;

    if (isTouchingBottle) {
      score += 1000;
      scoreDisplay.textContent = `Score: ${score.toString().padStart(3, '0')}`;
      showMessage("💧 You found the big water!");
      waterBottle.style.display = 'none';
    }
  }

  // Goal door collision (ends the game)
  const goalDoor = document.querySelector('.goal-door');
  if (goalDoor) {
    const playerRect = player.getBoundingClientRect();
    const doorRect = goalDoor.getBoundingClientRect();
    const isTouchingDoor =
      playerRect.left < doorRect.right &&
      playerRect.right > doorRect.left &&
      playerRect.top < doorRect.bottom &&
      playerRect.bottom > doorRect.top;

    if (isTouchingDoor) {
      // End game instead of loading next level
      showMessage("🎉 You did it! Everyone has water!");
      keys.left = keys.right = false;
      clearInterval(timerInterval);

      // Optional: Disable further movement
      setTimeout(() => {
        alert("Thanks for playing! Clean water saves lives.");
        // Optionally reload or reset here
        // location.reload();
      }, 1000);
    }
  }

  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
