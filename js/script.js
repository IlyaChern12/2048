const SIZE = 4;

let grid = [];
let tiles = [];
let score = 0;
let history = [];

let container;
let scoreEl;

let gameOverModal, gameOverMessage, playerNameInput, saveScoreBtn, restartBtn;
let leaderboardModal, leaderboardTable, closeLeaderboardBtn;

/* отрисовка интерфейса */
function createLayout() {
    const app = document.getElementById('app');

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

    container = document.createElement('div');
    container.id = "game-container";
    app.appendChild(container);

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

/* отрисовка модалки */
function createModals() {
    gameOverModal = document.createElement("div");
    gameOverModal.className = "modal hidden";
    gameOverModal.id = "game-over-modal";

    const goC = document.createElement("div");
    goC.className = "modal-content";

    gameOverMessage = document.createElement("p");
    gameOverMessage.style.fontWeight = "bold";
    gameOverMessage.textContent = "Игра окончена!";

    const nameSaveContainer = document.createElement("div");
    nameSaveContainer.className = "name-save-container";

    playerNameInput = document.createElement("input");
    playerNameInput.placeholder = "Введите имя";

    saveScoreBtn = document.createElement("button");
    saveScoreBtn.textContent = "Сохранить";

    nameSaveContainer.append(playerNameInput, saveScoreBtn);

    restartBtn = document.createElement("button");
    restartBtn.id = "restart-game";
    restartBtn.textContent = "Начать заново";

    goC.append(gameOverMessage, nameSaveContainer, restartBtn);
    gameOverModal.appendChild(goC);
    document.body.appendChild(gameOverModal);

    leaderboardModal = document.createElement("div");
    leaderboardModal.className = "modal hidden";
    leaderboardModal.id = "leaderboard-modal";

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
    closeLeaderboardBtn.id = "close-leaderboard";
    closeLeaderboardBtn.textContent = "Закрыть";

    lbC.append(lbTitle, leaderboardTable, closeLeaderboardBtn);
    leaderboardModal.appendChild(lbC);
    document.body.appendChild(leaderboardModal);

    /* обработка сохранения результата */
    saveScoreBtn.addEventListener("click", () => {
        const name = playerNameInput.value.trim();

        if (!name) {
            playerNameInput.classList.add("error");
            playerNameInput.focus();
            return;
        }

        playerNameInput.classList.remove("error");

        const now = new Date();
        const formattedDate =
            now.toLocaleDateString("ru-RU") + ", " +
            now.toLocaleTimeString("ru-RU", { hour: '2-digit', minute: '2-digit', hour12: false });

        const record = { name, score, date: formattedDate };
        const lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");

        lb.push(record);
        lb.sort((a, b) => b.score - a.score);
        localStorage.setItem("leaderboard", JSON.stringify(lb.slice(0, 10)));

        gameOverModal.classList.add("hidden");
        startNewGame();
    });

    playerNameInput.addEventListener("input", () => {
        if (playerNameInput.value.trim() !== "") {
            playerNameInput.classList.remove("error");
        }
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

/* создаём сетку */
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

/* создаём плитку */
function createTile(value, x, y) {
    const tileEl = document.createElement("div");
    tileEl.className = "tile tile-" + value;
    tileEl.textContent = value;

    const containerWidth = container.clientWidth;
    const gapRatio = 0.0165;
    const gap = containerWidth * gapRatio;
    const size = (containerWidth - gap * (SIZE + 1)) / SIZE;

    const tx = gap + y * (size + gap);
    const ty = gap + x * (size + gap);

    tileEl.style.width = `${size}px`;
    tileEl.style.height = `${size}px`;
    tileEl.style.position = "absolute";
    tileEl.style.transform = `translate(${tx}px, ${ty}px)`;

    const tile = { value, x, y, element: tileEl };
    tiles.push(tile);
    container.appendChild(tileEl);

    return tile;
}

/* обновляем позицию плитки */
function setTilePosition(tile, x, y) {
    const containerWidth = container.clientWidth;
    const gap = containerWidth * 0.0165;
    const size = (containerWidth - gap * (SIZE + 1)) / SIZE;

    const tx = gap + y * (size + gap);
    const ty = gap + x * (size + gap);

    tile.element.style.width = `${size}px`;
    tile.element.style.height = `${size}px`;
    tile.element.style.transform = `translate(${tx}px, ${ty}px)`;
}

/* добавление новой плитки */
function addRandomTile() {
    const empty = [];
    for (let i = 0; i < SIZE; i++)
        for (let j = 0; j < SIZE; j++)
            if (!grid[i][j]) empty.push({ x: i, y: j });

    if (!empty.length) return;

    const { x, y } = empty[Math.floor(Math.random() * empty.length)];
    const tile = createTile(Math.random() < 0.9 ? 2 : 4, x, y);
    grid[x][y] = tile;
    saveGameState();
}

/* сохраняем ход для undo */
function saveHistory() {
    const snapshot = grid.map(r => r.map(t => t ? { value: t.value } : null));
    history.push({ grid: snapshot, score });
}

/* откат хода */
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

/* проверяем конец игры */
function isGameOver() {
    for (let i = 0; i < SIZE; i++)
        for (let j = 0; j < SIZE; j++) {
            if (!grid[i][j]) return false;
            if (i < SIZE - 1 && grid[i][j].value === grid[i + 1][j]?.value) return false;
            if (j < SIZE - 1 && grid[i][j].value === grid[i][j + 1]?.value) return false;
        }
    return true;
}

/* показываем модалку */
function showGameOver() {
    gameOverMessage.textContent = `Игра окончена! Ваш счёт: ${score}`;
    playerNameInput.value = "";
    gameOverModal.classList.remove("hidden");
}

/* заполняем таблицу лидеров */
function showLeaderboard() {
    const tbody = leaderboardTable.querySelector("tbody");
    tbody.innerHTML = "";

    const lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");

    if (lb.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 3;
        td.style.whiteSpace = "normal";
        td.style.width = "200px";
        td.textContent = "Лидеров пока нет. Сыграйте и станьте первым!";
        td.style.textAlign = "center";
        td.style.padding = "15px 0 9px 0";
        tr.appendChild(td);
        tbody.appendChild(tr);
    } else {
        lb.forEach(r => {
            const tr = document.createElement("tr");
            ["name", "score", "date"].forEach(key => {
                const td = document.createElement("td");
                td.textContent = r[key];
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }

    leaderboardModal.classList.remove("hidden");
}

/* основная логика движения */
function move(dir) {
    saveHistory();

    let moved = false;
    const merged = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));

    function slide(x, y, dx, dy) {
        const t = grid[x][y];
        if (!t) return;

        let nx = x, ny = y;

        while (true) {
            const tx = nx + dx;
            const ty = ny + dy;

            if (tx < 0 || ty < 0 || tx >= SIZE || ty >= SIZE) break;

            const target = grid[tx][ty];

            if (!target) {
                grid[tx][ty] = t;
                grid[nx][ny] = null;
                nx = tx;
                ny = ty;
                moved = true;
            } else if (target.value === t.value && !merged[tx][ty]) {
                t.value *= 2;
                score += t.value;
                scoreEl.textContent = `Счёт: ${score}`;

                grid[tx][ty] = t;
                grid[nx][ny] = null;

                t.element.textContent = t.value;
                t.element.className = "tile tile-" + t.value;
                t.element.classList.add("merge");

                setTimeout(() => t.element.classList.remove("merge"), 200);

                target.element.remove();
                merged[tx][ty] = true;

                nx = tx;
                ny = ty;
                moved = true;
                break;
            } else break;
        }

        setTilePosition(t, nx, ny);
        t.x = nx;
        t.y = ny;
    }

    if (dir === "left")
        for (let i = 0; i < SIZE; i++)
            for (let j = 1; j < SIZE; j++) slide(i, j, 0, -1);

    if (dir === "right")
        for (let i = 0; i < SIZE; i++)
            for (let j = SIZE - 2; j >= 0; j--) slide(i, j, 0, 1);

    if (dir === "up")
        for (let j = 0; j < SIZE; j++)
            for (let i = 1; i < SIZE; i++) slide(i, j, -1, 0);

    if (dir === "down")
        for (let j = 0; j < SIZE; j++)
            for (let i = SIZE - 2; i >= 0; i--) slide(i, j, 1, 0);

    if (moved) {
        saveGameState();
        requestAnimationFrame(() => {
            addRandomTile();
            if (isGameOver()) showGameOver();
        });
    }
}

/* обработка управления */
document.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") move("up");
    if (e.key === "ArrowDown") move("down");
    if (e.key === "ArrowLeft") move("left");
    if (e.key === "ArrowRight") move("right");
});

/* свайпы */
let startX = 0, startY = 0;
document.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});

document.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 20) move("right");
        if (dx < -20) move("left");
    } else {
        if (dy > 20) move("down");
        if (dy < -20) move("up");
    }
});

/* запуск игры */
function startNewGame() {
    localStorage.removeItem("gameState");
    initGrid();
    score = 0;
    scoreEl.textContent = `Счёт: ${score}`;
    history = [];

    addRandomTile();
    addRandomTile();

    gameOverModal.classList.add("hidden");
    leaderboardModal.classList.add("hidden");
}

/* сохраняем состояние игры в localStorage */
function saveGameState() {
    const snapshot = grid.map(row =>
        row.map(tile => tile ? { value: tile.value } : null)
    );

    const state = {
        grid: snapshot,
        score: score,
        history: history
    };

    localStorage.setItem("gameState", JSON.stringify(state));
}

/* загружаем сохранённое состояние */
function loadGameState() {
    const saved = JSON.parse(localStorage.getItem("gameState") || "null");
    if (!saved) return false;

    initGrid();

    score = saved.score;
    scoreEl.textContent = `Счёт: ${score}`;

    history = saved.history || [];

    tiles = [];
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            const cell = saved.grid[i][j];
            if (cell) {
                const t = createTile(cell.value, i, j);
                grid[i][j] = t;
            } else {
                grid[i][j] = null;
            }
        }
    }

    return true;
}

createLayout();
createModals();
if (!loadGameState()) {
    startNewGame();
}

window.addEventListener("resize", () => {
    tiles.forEach(t => setTilePosition(t, t.x, t.y));
});