const SIZE = 4;
const CELL_SIZE = 100;
const GAP = 10;
const TILE_SIZE = 100;

let grid = [];
let tiles = [];
let score = 0;
let history = [];

let container;
let scoreEl;

let gameOverModal, gameOverMessage, playerNameInput, saveScoreBtn, restartBtn;
let leaderboardModal, leaderboardTable, closeLeaderboardBtn;

function createLayout() {
    const app = document.getElementById('app');

    // --- TOP BAR ---
    const topBar = document.createElement("div");
    topBar.className = "top-bar";

    const logo = document.createElement("div");
    logo.className = "logo";
    logo.textContent = "2048";

    const scoreContainer = document.createElement("div");
    scoreContainer.id = "score-container";
    scoreContainer.textContent = "Счёт: 0";

    const lbBtn = document.createElement("button");
    lbBtn.id = "show-leaderboard";
    lbBtn.textContent = "Лидерборд";

    topBar.append(logo, scoreContainer, lbBtn);
    app.appendChild(topBar);

    // --- GAME FIELD ---
    container = document.createElement('div');
    container.id = "game-container";
    app.appendChild(container);

    // --- BOTTOM BUTTONS ---
    const bottom = document.createElement("div");
    bottom.className = "bottom-buttons";

    const undoBtn = document.createElement("button");
    undoBtn.id = "undo";
    undoBtn.textContent = "Отменить ход";

    const newBtn = document.createElement("button");
    newBtn.id = "new-game";
    newBtn.textContent = "Новая игра";

    bottom.append(undoBtn, newBtn);
    app.appendChild(bottom);

    scoreEl = scoreContainer;
}

function createModals() {
    // --- GAME OVER ---
    gameOverModal = document.createElement("div");
    gameOverModal.className = "modal hidden"; // скрыта по умолчанию

    const goC = document.createElement("div");
    goC.className = "modal-content";

    gameOverMessage = document.createElement("p");

    playerNameInput = document.createElement("input");
    playerNameInput.placeholder = "Введите имя";

    saveScoreBtn = document.createElement("button");
    saveScoreBtn.textContent = "Сохранить";

    restartBtn = document.createElement("button");
    restartBtn.textContent = "Заново";

    goC.append(gameOverMessage, playerNameInput, saveScoreBtn, restartBtn);
    gameOverModal.appendChild(goC);
    document.body.appendChild(gameOverModal);

    // --- LEADERBOARD ---
    leaderboardModal = document.createElement("div");
    leaderboardModal.className = "modal hidden"; // скрыта по умолчанию

    const lbC = document.createElement("div");
    lbC.className = "modal-content";

    const lbTitle = document.createElement("h2");
    lbTitle.textContent = "Топ-10 рекордов";

    leaderboardTable = document.createElement("table");
    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");
    ["Имя", "Очки", "Дата"].forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    const tbody = document.createElement("tbody");
    leaderboardTable.appendChild(thead);
    leaderboardTable.appendChild(tbody);

    closeLeaderboardBtn = document.createElement("button");
    closeLeaderboardBtn.textContent = "Закрыть";

    lbC.append(lbTitle, leaderboardTable, closeLeaderboardBtn);
    leaderboardModal.appendChild(lbC);
    document.body.appendChild(leaderboardModal);

    // --- EVENTS ---
    saveScoreBtn.addEventListener("click", () => {
        const name = playerNameInput.value || "Игрок";
        const record = { name, score, date: new Date().toLocaleString() };
        const lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");
        lb.push(record);
        lb.sort((a, b) => b.score - a.score);
        localStorage.setItem("leaderboard", JSON.stringify(lb.slice(0, 10)));
        gameOverModal.classList.add("hidden");
    });

    restartBtn.addEventListener("click", () => {
        gameOverModal.classList.add("hidden");
        startNewGame();
    });

    closeLeaderboardBtn.addEventListener("click", () => {
        leaderboardModal.classList.add("hidden");
    });

    document.getElementById("show-leaderboard").addEventListener("click", () => {
        showLeaderboard();
    });

    document.getElementById("undo").addEventListener("click", undo);
    document.getElementById("new-game").addEventListener("click", startNewGame);
}

function initGrid() {
    grid = [];
    container.innerHTML = "";
    tiles.forEach(t => t.element.remove());
    tiles = [];

    for (let i = 0; i < SIZE; i++) {
        grid[i] = [];
        for (let j = 0; j < SIZE; j++) {
            grid[i][j] = null;
            const cell = document.createElement("div");
            cell.className = "cell";
            container.appendChild(cell);
        }
    }
}

function createTile(value, x, y) {
    const tileEl = document.createElement("div");
    tileEl.className = "tile tile-" + value;
    tileEl.textContent = value;
    tileEl.style.position = "absolute";
    tileEl.style.width = TILE_SIZE + "px";
    tileEl.style.height = TILE_SIZE + "px";
    tileEl.style.display = "flex";
    tileEl.style.justifyContent = "center";
    tileEl.style.alignItems = "center";
    tileEl.style.borderRadius = "5px";
    tileEl.style.fontWeight = "bold";
    tileEl.style.fontSize = "28px";
    tileEl.style.transition = "transform 0.3s ease";
    container.appendChild(tileEl);

    const tile = { value, x, y, element: tileEl };
    tiles.push(tile);
    setTilePosition(tile, x, y);
    return tile;
}

function setTilePosition(tile, x, y) {
    const offset = (CELL_SIZE - TILE_SIZE) / 2;
    const pad = 10;
    tile.element.style.transform =
        `translate(${pad + y * (CELL_SIZE + GAP) + offset}px, ${pad + x * (CELL_SIZE + GAP) + offset}px)`;
}

function addRandomTile() {
    const empty = [];
    for (let i = 0; i < SIZE; i++)
        for (let j = 0; j < SIZE; j++)
            if (!grid[i][j]) empty.push({ x: i, y: j });
    if (!empty.length) return;
    const { x, y } = empty[Math.floor(Math.random() * empty.length)];
    const tile = createTile(Math.random() < 0.9 ? 2 : 4, x, y);
    grid[x][y] = tile;
}

function saveHistory() {
    const snapshot = grid.map(row => row.map(tile => tile ? { value: tile.value } : null));
    history.push({ grid: snapshot, score });
}

function undo() {
    if (!history.length) return;
    const last = history.pop();
    score = last.score;
    scoreEl.textContent = `Счёт: ${score}`;

    tiles.forEach(t => t.element.remove());
    tiles = [];

    grid = [];
    for (let i = 0; i < SIZE; i++) {
        grid[i] = [];
        for (let j = 0; j < SIZE; j++) {
            const cell = last.grid[i][j];
            if (cell) {
                const tile = createTile(cell.value, i, j);
                grid[i][j] = tile;
            } else {
                grid[i][j] = null;
            }
        }
    }
}

function isGameOver() {
    for (let i = 0; i < SIZE; i++)
        for (let j = 0; j < SIZE; j++) {
            if (!grid[i][j]) return false;
            if (i < SIZE - 1 && grid[i][j].value === grid[i + 1][j]?.value) return false;
            if (j < SIZE - 1 && grid[i][j].value === grid[i][j + 1]?.value) return false;
        }
    return true;
}

function showGameOver() {
    gameOverMessage.textContent = `Игра окончена. Ваш счёт: ${score}`;
    playerNameInput.value = "";
    gameOverModal.classList.remove("hidden");
}

function showLeaderboard() {
    const tbody = leaderboardTable.querySelector("tbody");
    tbody.innerHTML = "";
    const lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");
    lb.forEach(r => {
        const tr = document.createElement("tr");
        ["name", "score", "date"].forEach(key => {
            const td = document.createElement("td");
            td.textContent = r[key];
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    leaderboardModal.classList.remove("hidden");
}

function move(dir) {
    saveHistory();
    let moved = false;
    const merged = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));

    function slide(x, y, dx, dy) {
        const t = grid[x][y]; if (!t) return;
        let nx = x, ny = y;
        while (true) {
            const tx = nx + dx, ty = ny + dy;
            if (tx < 0 || ty < 0 || tx >= SIZE || ty >= SIZE) break;
            const target = grid[tx][ty];
            if (!target) {
                grid[tx][ty] = t; grid[nx][ny] = null; setTilePosition(t, tx, ty);
                nx = tx; ny = ty; moved = true;
            } else if (target.value === t.value && !merged[tx][ty]) {
                t.value *= 2; score += t.value; scoreEl.textContent = `Счёт: ${score}`;
                grid[tx][ty] = t; grid[nx][ny] = null;
                t.element.textContent = t.value;
                t.element.className = 'tile tile-' + t.value;
                t.element.classList.add('merge');
                setTimeout(() => t.element.classList.remove('merge'), 200);
                target.element.remove(); merged[tx][ty] = true;
                setTilePosition(t, tx, ty); moved = true; break;
            } else break;
        }
    }

    if (dir === 'left') for (let i = 0; i < SIZE; i++) for (let j = 1; j < SIZE; j++) slide(i, j, 0, -1);
    if (dir === 'right') for (let i = 0; i < SIZE; i++) for (let j = SIZE - 2; j >= 0; j--) slide(i, j, 0, 1);
    if (dir === 'up') for (let j = 0; j < SIZE; j++) for (let i = 1; i < SIZE; i++) slide(i, j, -1, 0);
    if (dir === 'down') for (let j = 0; j < SIZE; j++) for (let i = SIZE - 2; i >= 0; i--) slide(i, j, 1, 0);

    if (moved) requestAnimationFrame(() => { addRandomTile(); if (isGameOver()) showGameOver(); });
}

document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') move('up');
    if (e.key === 'ArrowDown') move('down');
    if (e.key === 'ArrowLeft') move('left');
    if (e.key === 'ArrowRight') move('right');
});

let startX = 0, startY = 0;
document.addEventListener('touchstart', e => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; });
document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 20) move('right'); if (dx < -20) move('left');
    } else {
        if (dy > 20) move('down'); if (dy < -20) move('up');
    }
});

function startNewGame() {
    initGrid();
    score = 0;
    scoreEl.textContent = `Счёт: ${score}`;
    history = [];
    addRandomTile();
    addRandomTile();
    gameOverModal.classList.add('hidden');
    leaderboardModal.classList.add('hidden');
}

// --- START ---
createLayout();
createModals();
startNewGame();