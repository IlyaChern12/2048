const grid = document.getElementById('grid');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const newGameBtn = document.getElementById('new-game');
const undoBtn = document.getElementById('undo');
const leaderboardBtn = document.getElementById('leaderboard-btn');

let board = [];
let score = 0;
let best = +localStorage.getItem('best') || 0;
let prevBoard = [];
let prevScore = 0;

bestEl.textContent = best;

function createModal(title, content, buttons = [{ text: 'OK', onClick: closeModal }]) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `<h2>${title}</h2><div>${content}</div>`;

  buttons.forEach(btn => {
    const b = document.createElement('button');
    b.textContent = btn.text;
    b.onclick = () => {
      btn.onClick();
      overlay.remove();
    };
    modal.appendChild(b);
  });

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function closeModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.remove();
}

function init() {
  board = Array.from({ length: 4 }, () => Array(4).fill(0));
  score = 0;
  addRandom();
  addRandom();
  update();
}

function addRandom() {
  const empty = [];
  board.forEach((r, i) =>
    r.forEach((v, j) => v === 0 && empty.push([i, j]))
  );
  if (!empty.length) return;
  const [i, j] = empty[Math.floor(Math.random() * empty.length)];
  board[i][j] = Math.random() < 0.9 ? 2 : 4;
}

function update() {
  grid.innerHTML = '';
  board.forEach(row => {
    row.forEach(value => {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (value) {
        cell.textContent = value;
        cell.dataset.value = value;
      }
      grid.appendChild(cell);
    });
  });
  scoreEl.textContent = score;
  bestEl.textContent = best;
}

function move(dir) {
  prevBoard = board.map(r => [...r]);
  prevScore = score;

  let moved = false;
  const rotate = b => b[0].map((_, i) => b.map(r => r[i]));
  const flip = b => b.map(r => [...r].reverse());

  const moveLeft = b => b.map(r => {
    const arr = r.filter(v => v);
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        score += arr[i];
        arr[i + 1] = 0;
      }
    }
    const res = arr.filter(v => v);
    while (res.length < 4) res.push(0);
    return res;
  });

  let newBoard = board;
  if (dir === 'left') newBoard = moveLeft(board);
  if (dir === 'right') newBoard = flip(moveLeft(flip(board)));
  if (dir === 'up') newBoard = rotate(moveLeft(rotate(board)));
  if (dir === 'down') newBoard = rotate(flip(moveLeft(flip(rotate(board)))));

  moved = JSON.stringify(board) !== JSON.stringify(newBoard);
  board = newBoard;

  if (moved) {
    addRandom();
    if (score > best) {
      best = score;
      localStorage.setItem('best', best);
    }
    update();
  }
}

document.addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    move(e.key.replace('Arrow', '').toLowerCase());
  }
});

newGameBtn.onclick = () => init();
undoBtn.onclick = () => {
  board = prevBoard.map(r => [...r]);
  score = prevScore;
  update();
};

leaderboardBtn.onclick = () => {
  const best = localStorage.getItem('best') || 0;
  createModal('Лидерборд', `Ваш лучший результат: <b>${best}</b>`);
};

init();