(function() {
  'use strict';

  // ---------- Элементы ----------
  const menuOverlay = document.getElementById('menuOverlay');
  const menuButtons = document.querySelectorAll('.menu-btn');
  const boardEl = document.getElementById('board');
  const statusEl = document.getElementById('status');
  const humanScoreSide = document.getElementById('humanScoreSide');
  const botScoreSide = document.getElementById('botScoreSide');
  const humanSide = document.getElementById('humanSide');
  const botSide = document.getElementById('botSide');
  const resetBtn = document.getElementById('resetBtn');
  const changeSideBtn = document.getElementById('changeSideBtn');
  const levelRadios = document.querySelectorAll('input[name="level"]');
  const playerAvatar = document.getElementById('playerAvatar');
  const humanSymbolDisplay = document.getElementById('humanSymbolDisplay');
  const botSymbolDisplay = document.getElementById('botSymbolDisplay');
  const footerSymbol = document.getElementById('footerSymbol');

  let board = Array(9).fill(null);
  let currentPlayer = 'X';
  let gameActive = true;
  let humanScore = 0;
  let botScore = 0;

  let humanSymbol = 'X';
  let botSymbol = 'O';

  // ---------- Функция для установки статуса с анимацией ----------
  function setStatus(text, resultType) {
    statusEl.textContent = text;
    statusEl.classList.remove('result-win', 'result-lose', 'result-draw');
    if (resultType) {
      statusEl.classList.add('result-' + resultType);
    }
  }

  // ---------- Старт игры ----------
  function startGame(side) {
    humanSymbol = side;
    botSymbol = (side === 'X') ? 'O' : 'X';

    humanSymbolDisplay.textContent = humanSymbol;
    botSymbolDisplay.textContent = botSymbol;
    footerSymbol.textContent = humanSymbol;

    humanScore = 0;
    botScore = 0;
    resetGame();
    menuOverlay.classList.add('hidden');
  }

  // ---------- Анимация поражения ----------
  function animatePlayerDefeat() {
    if (!playerAvatar) return;
    playerAvatar.src = 'photo/4.png';
    playerAvatar.classList.add('shake');
    setTimeout(() => {
      playerAvatar.src = 'photo/2.png';
      playerAvatar.classList.remove('shake');
    }, 2000);
  }

  function resetAvatar() {
    if (playerAvatar) {
      playerAvatar.src = 'photo/2.png';
      playerAvatar.classList.remove('shake');
    }
  }

  // ---------- Игровая логика ----------
  function checkWinner(boardArray) {
    const lines = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6]
    ];
    for (let line of lines) {
      const [a,b,c] = line;
      if (boardArray[a] && boardArray[a] === boardArray[b] && boardArray[a] === boardArray[c]) {
        return { winner: boardArray[a], line: line };
      }
    }
    if (boardArray.every(cell => cell !== null)) return { winner: 'draw', line: null };
    return { winner: null, line: null };
  }

  function getEmptyIndices(boardArray) {
    return boardArray.reduce((acc, cell, idx) => cell === null ? [...acc, idx] : acc, []);
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    board.forEach((value, index) => {
      const cell = document.createElement('div');
      cell.className = 'cell' + (value ? ' taken' : '');
      cell.textContent = value || '';
      cell.dataset.index = index;
      cell.addEventListener('click', () => handleCellClick(index));
      boardEl.appendChild(cell);
    });
  }

  function highlightWinner(line) {
    if (!line) return;
    const cells = boardEl.children;
    const winner = board[line[0]];
    for (let idx of line) {
      cells[idx].classList.add(winner === 'X' ? 'x-wins' : 'o-wins');
    }
  }

  function updateUI(message, resultType) {
    humanScoreSide.textContent = humanScore;
    botScoreSide.textContent = botScore;

    const humanActive = gameActive && currentPlayer === humanSymbol;
    const botActive = gameActive && currentPlayer === botSymbol;
    humanSide.classList.toggle('active', humanActive);
    botSide.classList.toggle('active', botActive);

    if (message) {
      setStatus(message, resultType);
    } else if (!gameActive) {
      // leave
    } else {
      if (currentPlayer === humanSymbol) {
        setStatus('Ваш ход', null);
      } else {
        setStatus('Думаю... 🤔', null);
      }
    }
  }

  function handleCellClick(index) {
    if (!gameActive) return;
    if (currentPlayer !== humanSymbol) return;
    if (board[index] !== null) return;

    makeMove(index, humanSymbol);

    if (gameActive) {
      currentPlayer = botSymbol;
      updateUI();
      setTimeout(() => {
        if (gameActive && currentPlayer === botSymbol) {
          computerMove();
        }
      }, 150);
    }
  }

  function makeMove(index, player) {
    if (board[index] !== null) return false;
    board[index] = player;
    renderBoard();

    const result = checkWinner(board);
    if (result.winner) {
      gameActive = false;
      if (result.winner === humanSymbol) {
        humanScore++;
        highlightWinner(result.line);
        updateUI('Вы выиграли!', 'win');
      } else if (result.winner === botSymbol) {
        botScore++;
        highlightWinner(result.line);
        animatePlayerDefeat();
        updateUI('Компьютер выиграл!', 'lose');
      } else if (result.winner === 'draw') {
        updateUI('Ничья!', 'draw');
      }
      humanSide.classList.remove('active');
      botSide.classList.remove('active');
      return true;
    }

    if (gameActive) {
      currentPlayer = (player === humanSymbol) ? botSymbol : humanSymbol;
      updateUI();
    }
    return true;
  }

  // ---------- Ход компьютера ----------
  function computerMove() {
    if (!gameActive) return;
    if (currentPlayer !== botSymbol) return;

    const empty = getEmptyIndices(board);
    if (empty.length === 0) {
      gameActive = false;
      updateUI('Ничья!', 'draw');
      return;
    }

    const level = document.querySelector('input[name="level"]:checked').value;
    let moveIndex = -1;

    switch (level) {
      case 'easy':
        moveIndex = empty[Math.floor(Math.random() * empty.length)];
        break;
      case 'medium':
        moveIndex = getMediumMove(board, empty);
        break;
      case 'hard':
        moveIndex = getHardMove(board);
        break;
      default:
        moveIndex = empty[Math.floor(Math.random() * empty.length)];
    }

    if (moveIndex === -1 || moveIndex === undefined) {
      moveIndex = empty[Math.floor(Math.random() * empty.length)];
    }

    makeMove(moveIndex, botSymbol);

    if (gameActive && currentPlayer === humanSymbol) {
      updateUI();
    }
  }

  // ---------- Стратегии ----------
  function getMediumMove(boardArray, empty) {
    for (let idx of empty) {
      const test = [...boardArray];
      test[idx] = botSymbol;
      if (checkWinner(test).winner === botSymbol) return idx;
    }
    for (let idx of empty) {
      const test = [...boardArray];
      test[idx] = humanSymbol;
      if (checkWinner(test).winner === humanSymbol) return idx;
    }
    return empty[Math.floor(Math.random() * empty.length)];
  }

  function getHardMove(boardArray) {
    const boardCopy = [...boardArray];
    const best = minimax(boardCopy, botSymbol);
    return best.index;
  }

  function minimax(boardArray, currentPlayer) {
    const empty = getEmptyIndices(boardArray);
    const result = checkWinner(boardArray);

    if (result.winner === humanSymbol) return { score: -10 };
    if (result.winner === botSymbol) return { score: 10 };
    if (result.winner === 'draw' || empty.length === 0) return { score: 0 };

    const moves = [];
    for (let idx of empty) {
      const newBoard = [...boardArray];
      newBoard[idx] = currentPlayer;
      const nextPlayer = (currentPlayer === humanSymbol) ? botSymbol : humanSymbol;
      const resultMove = minimax(newBoard, nextPlayer);
      moves.push({ index: idx, score: resultMove.score });
    }

    let bestMove = null;
    if (currentPlayer === botSymbol) {
      let bestScore = -Infinity;
      for (let m of moves) {
        if (m.score > bestScore) {
          bestScore = m.score;
          bestMove = m;
        }
      }
    } else {
      let bestScore = Infinity;
      for (let m of moves) {
        if (m.score < bestScore) {
          bestScore = m.score;
          bestMove = m;
        }
      }
    }
    return bestMove;
  }

  // ---------- Сброс игры ----------
  function resetGame() {
    board = Array(9).fill(null);
    gameActive = true;
    if (humanSymbol === 'X') {
      currentPlayer = 'X';
    } else {
      currentPlayer = 'X';
    }
    renderBoard();
    resetAvatar();
    setStatus('Новая игра', null);
    updateUI();
    if (gameActive && currentPlayer === botSymbol) {
      setTimeout(() => {
        if (gameActive && currentPlayer === botSymbol) {
          computerMove();
        }
      }, 200);
    }
  }

  function fullResetWithMenu() {
    humanScore = 0;
    botScore = 0;
    menuOverlay.classList.remove('hidden');
    board = Array(9).fill(null);
    gameActive = false;
    renderBoard();
    humanSide.classList.remove('active');
    botSide.classList.remove('active');
    resetAvatar();
    setStatus('Выберите сторону в меню', null);
    updateUI();
  }

  // ---------- Инициализация ----------
  function init() {
    menuOverlay.classList.remove('hidden');

    menuButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        const side = this.dataset.side;
        startGame(side);
      });
    });

    resetBtn.addEventListener('click', resetGame);
    changeSideBtn.addEventListener('click', fullResetWithMenu);
    document.querySelector('h1').addEventListener('dblclick', fullResetWithMenu);

    levelRadios.forEach(radio => {
      radio.addEventListener('change', resetGame);
    });

    renderBoard();
    setStatus('Выберите сторону в меню', null);
    gameActive = false;
  }

  init();
})();