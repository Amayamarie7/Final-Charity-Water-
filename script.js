// Game configuration and state variables
const GOAL_CANS = 25;        // Total items needed to collect
let currentCans = 0;         // Current number of items collected
let gameActive = false;      // Tracks if game is currently running
let spawnInterval;          // Holds the interval for spawning items
let score = 0;              // Initialize score
let timeLeft = 30;          // Time left in seconds
let timerInterval;          // Holds the interval for the timer

// Difficulty settings
const DIFFICULTY_TIMES = {
  easy: 45,
  normal: 30,
  hard: 20
};
const DIFFICULTY_SPAWN = {
  easy: { interval: 1500, count: 1, mud: 0.1 },
  normal: { interval: 1000, count: 1, mud: 0.25 },
  hard: { interval: 750, count: 2, mud: 0.4 }
};

// Arrays of game end messages
const winningMessages = [
    "Congratulations! You're a water collecting champion with {score} points!",
    "Amazing job! You won with {score} points!",
    "Victory! You collected {score} points like a pro!",
    "Fantastic work! You've mastered the game with {score} points!"
];

const losingMessages = [
    "You did great but let's try again! You scored {score} points.",
    "Nice effort! Keep practicing to reach 75 points!",
    "Almost there! You collected {score} points. One more try?",
    "Good attempt! Let's see if you can get to 75 points next time!"
];

// Milestone messages
const milestones = [
  { score: 15, message: "Great start! Keep going!" },
  { score: 35, message: "Halfway there!" },
  { score: 55, message: "Just a few more to go!" },
  { score: 75, message: "Amazing! You reached 75!" }
];
let lastMilestone = 0;

// Creates the 3x3 game grid where items will appear
function createGrid() {
  const grid = document.querySelector('.game-grid');
  grid.innerHTML = ''; // Clear any existing grid cells
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell'; // Each cell represents a grid square
    grid.appendChild(cell);
  }
}

// Ensure the grid is created when the page loads
createGrid();

// Spawns a new item in a random grid cell
function spawnWaterCan() {
  if (!gameActive) return;
  const cells = document.querySelectorAll('.grid-cell');
  cells.forEach(cell => (cell.innerHTML = ''));
  
  const randomCell = cells[Math.floor(Math.random() * cells.length)];
  randomCell.innerHTML = `
    <div class="water-can-wrapper">
      <div class="water-can" onclick="handleCanClick(this)"></div>
    </div>
  `;
}

function handleCanClick(can) {
  if (!gameActive) return;
  updateScore();
  can.classList.add('rotate-on-click');
  can.addEventListener('animationend', function handler() {
    can.parentElement.remove();
    can.removeEventListener('animationend', handler);
  });
  currentCans++;
  document.getElementById('current-cans').textContent = currentCans;
}

// Show milestone messages
function showMilestone(score) {
  for (let i = milestones.length - 1; i >= 0; i--) {
    if (score >= milestones[i].score && lastMilestone < milestones[i].score) {
      // Show milestone modal in the center and pause the game
      const modal = document.getElementById('milestone-modal');
      const msg = document.getElementById('milestone-message');
      msg.textContent = milestones[i].message;
      modal.style.display = 'flex';
      lastMilestone = milestones[i].score;
      const wasActive = gameActive;
      gameActive = false;
      setTimeout(() => {
        modal.style.display = 'none';
        // Only resume if the game wasn't ended during the pause
        if (wasActive && timeLeft > 0) gameActive = true;
      }, 1000);
      break;
    }
  }
}

// Update the score display
function updateScore() {
  score += 1; // Increment score
  document.getElementById('score').textContent = score;
  showMilestone(score);
}

// Update the timer display
function updateTimer() {
  timeLeft--;
  document.getElementById('timer').textContent = timeLeft;

  if (timeLeft <= 0) {
    endGame();
  }
}

// Starts the timer countdown
function startTimer() {
  timerInterval = setInterval(updateTimer, 1000);
}

// Confetti effect for winning
function launchConfetti() {
  if (typeof confetti === "function") {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

// Show game modal with message
function showGameModal(message, callback) {
  const modal = document.getElementById('game-modal');
  const msg = document.getElementById('modal-message');
  msg.textContent = message;
  modal.style.display = 'flex';
  // Prevent interaction with the game while modal is visible
  setTimeout(() => {
    modal.style.display = 'none';
    if (typeof callback === 'function') callback();
  }, 3500);
}

// Ends the game
function endGame() {
  gameActive = false; // Mark the game as inactive
  clearInterval(spawnInterval); // Stop spawning water cans
  clearInterval(timerInterval); // Stop the timer

  // Disable clicking on water cans
  const waterCans = document.querySelectorAll('.water-can');
  waterCans.forEach(can => {
      can.style.pointerEvents = 'none';
  });

  // Select random message from appropriate array
  const messages = score >= 75 ? winningMessages : losingMessages;
  const randomIndex = Math.floor(Math.random() * messages.length);
  const message = messages[randomIndex].replace('{score}', score);

  // Launch confetti if player wins
  if (score >= 75) {
    launchConfetti();
  }

  // Show modal message and pause for a few seconds
  showGameModal(message);
}

// Spawns a new item in a random grid cell, either a water can or an obstacle
function spawnWaterCanOrObstacle(count = 1) {
  if (!gameActive) return;
  const cells = document.querySelectorAll('.grid-cell');
  // Clear only if count is 1 (easy/normal), for hard mode allow multiple items
  if (count === 1) {
    cells.forEach(cell => (cell.innerHTML = ''));
  }
  let availableCells = Array.from(cells).filter(cell => cell.innerHTML === '');
  // Get mud frequency based on difficulty
  const difficulty = document.getElementById('difficulty').value;
  const mudChance = (DIFFICULTY_SPAWN[difficulty] && DIFFICULTY_SPAWN[difficulty].mud) || 0.1;
  // Increase droplet frequency: now 30% chance (was 10%)
  for (let i = 0; i < count && availableCells.length > 0; i++) {
    // Mud frequency based on difficulty
    const rand = Math.random();
    let itemType;
    if (rand < mudChance) {
      itemType = 'fancyMud';
    } else if (rand < mudChance + 0.3) { // 30% chance for droplet
      itemType = 'droplet';
    } else {
      itemType = 'can';
    }
    // Pick a random available cell
    const randomIdx = Math.floor(Math.random() * availableCells.length);
    const randomCell = availableCells[randomIdx];
    if (itemType === 'fancyMud') {
      randomCell.innerHTML = `
        <div class="fancy-mud-wrapper">
          <div class="fancy-mud" onclick="handleFancyMudClick(this)">
            <div class="mud-gloss"></div>
            <div class="mud-sparkle"></div>
          </div>
        </div>
      `;
    } else if (itemType === 'droplet') {
      randomCell.innerHTML = `
        <div class="droplet-wrapper">
          <div class="droplet" onclick="handleDropletClick(this)"></div>
        </div>
      `;
    } else {
      randomCell.innerHTML = `
        <div class="water-can-wrapper">
          <div class="water-can" onclick="handleCanClick(this)"></div>
        </div>
      `;
    }
    // Remove this cell from availableCells
    availableCells.splice(randomIdx, 1);
  }
}

function handleFancyMudClick(mud) {
  if (!gameActive) return;
  score = Math.max(0, score - 5); // Decrease score by 5, not below 0
  document.getElementById('score').textContent = score;
  mud.parentElement.remove();
}

function handleDropletClick(droplet) {
  if (!gameActive) return;
  // Award bonus points based on difficulty
  const difficulty = document.getElementById('difficulty').value;
  let bonus = 20;
  if (difficulty === 'easy') bonus = 30;
  else if (difficulty === 'hard') bonus = 10;
  score += bonus;
  document.getElementById('score').textContent = score;
  showMilestone(score);
  // Splash animation and remove droplet
  droplet.classList.add('splash');
  droplet.addEventListener('animationend', function handler() {
    if (droplet.parentElement) droplet.parentElement.remove();
    droplet.removeEventListener('animationend', handler);
  });
}

// Initializes and starts a new game
function startGame() {
  if (gameActive) return; // Prevent starting a new game if one is already active
  gameActive = true;
  score = 0; // Reset score
  lastMilestone = 0;
  // Set timeLeft and spawn rate based on selected difficulty
  const difficulty = document.getElementById('difficulty').value;
  timeLeft = DIFFICULTY_TIMES[difficulty] || 30;
  const spawnSettings = DIFFICULTY_SPAWN[difficulty] || { interval: 1000, count: 1 };
  currentCans = 0;
  document.getElementById('score').textContent = score; // Update score display
  document.getElementById('timer').textContent = timeLeft; // Update timer display
  document.getElementById('current-cans').textContent = currentCans;
  createGrid(); // Set up the game grid
  spawnInterval = setInterval(() => spawnWaterCanOrObstacle(spawnSettings.count), spawnSettings.interval); // Spawn items per difficulty
  startTimer(); // Start the timer
}

// Resets the game to its initial state
function resetGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  score = 0;
  lastMilestone = 0;
  // Set timeLeft based on selected difficulty
  const difficulty = document.getElementById('difficulty').value;
  timeLeft = DIFFICULTY_TIMES[difficulty] || 30;
  currentCans = 0;
  document.getElementById('score').textContent = score;
  document.getElementById('timer').textContent = timeLeft;
  document.getElementById('current-cans').textContent = currentCans;
  createGrid();
}

// Set up click handler for the start button
document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('reset-game').addEventListener('click', resetGame); // Add reset button handler
