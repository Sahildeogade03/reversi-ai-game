import React, { useState, useEffect } from "react";
import "./App.css";

const EMPTY = 0;
const PLAYER1 = 1;
const PLAYER2 = 2;

const directions = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
  [1, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
];

const defaultBoard = () => {
  const board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(EMPTY));
  board[3][3] = PLAYER2;
  board[4][4] = PLAYER2;
  board[3][4] = PLAYER1;
  board[4][3] = PLAYER1;
  return board;
};

function App() {
  const [board, setBoard] = useState(defaultBoard);
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER1);
  const [maxDepth, setMaxDepth] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState("Your turn!");
  const [player1Score, setPlayer1Score] = useState(2); // Initial score
  const [player2Score, setPlayer2Score] = useState(2); // Initial score
  const [showModal, setShowModal] = useState(false); // Modal state

  useEffect(() => {
    if (!gameOver) {
      if (currentPlayer === PLAYER2) {
        const aiMove = minimax(board, maxDepth, -Infinity, Infinity, true).move;
        if (aiMove) {
          makeMove(aiMove[0], aiMove[1], PLAYER2);
        } else {
          checkEndGame(); // Check if no valid moves remain for AI
        }
      } else if (!hasValidMove(PLAYER1) && !hasValidMove(PLAYER2)) {
        // If no valid moves for both players, end the game
        checkEndGame();
      }
    }
  }, [currentPlayer, board, gameOver, maxDepth]);

  const resetGame = () => {
    setBoard(defaultBoard());
    setCurrentPlayer(PLAYER1);
    setGameOver(false);
    setStatus("Your turn!");
    setPlayer1Score(2); // Reset scores
    setPlayer2Score(2);
    setShowModal(false); // Close modal if game is reset
  };

  const updateScores = (newBoard) => {
    let p1Score = 0,
      p2Score = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (newBoard[row][col] === PLAYER1) p1Score++;
        if (newBoard[row][col] === PLAYER2) p2Score++;
      }
    }
    setPlayer1Score(p1Score);
    setPlayer2Score(p2Score);
  };

  const playerMove = (row, col) => {
    if (
      gameOver ||
      board[row][col] !== EMPTY ||
      !isValidMove(row, col, PLAYER1)
    )
      return;
    makeMove(row, col, PLAYER1);
    checkEndGame();
  };

  const makeMove = (row, col, player) => {
    const newBoard = board.map((arr) => arr.slice());
    const flips = getFlips(row, col, player);
    flips.forEach(([x, y]) => {
      newBoard[x][y] = player;
    });
    newBoard[row][col] = player;
    setBoard(newBoard);
    updateScores(newBoard);
    const nextPlayer = player === PLAYER1 ? PLAYER2 : PLAYER1;
    setCurrentPlayer(nextPlayer);

    if (nextPlayer === PLAYER1) {
      setStatus("Your turn!");
    } else {
      setStatus("AI is thinking...");
    }

    if (isTerminal(newBoard)) {
      setGameOver(true);
      declareWinner();
    }
  };

  const getFlips = (row, col, player) => {
    const opponent = player === PLAYER1 ? PLAYER2 : PLAYER1;
    let flips = [];

    directions.forEach(([dx, dy]) => {
      let x = row + dx;
      let y = col + dy;
      let possibleFlips = [];

      while (x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === opponent) {
        possibleFlips.push([x, y]);
        x += dx;
        y += dy;
      }

      if (
        x >= 0 &&
        x < 8 &&
        y >= 0 &&
        y < 8 &&
        board[x][y] === player &&
        possibleFlips.length > 0
      ) {
        flips = flips.concat(possibleFlips);
      }
    });
    return flips;
  };

  const isValidMove = (row, col, player) => {
    if (board[row][col] !== EMPTY) return false;
    return getFlips(row, col, player).length > 0;
  };

  const minimax = (board, depth, alpha, beta, isMaximizing) => {
    if (depth === 0 || isTerminal(board)) {
      return { score: evaluateBoard(board) };
    }

    const player = isMaximizing ? PLAYER2 : PLAYER1;
    let bestMove = null;
    let bestScore = isMaximizing ? -Infinity : Infinity;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (isValidMove(row, col, player)) {
          const newBoard = board.map((arr) => arr.slice());
          makeMove(row, col, player);
          const { score } = minimax(
            newBoard,
            depth - 1,
            alpha,
            beta,
            !isMaximizing
          );

          newBoard[row][col] = EMPTY;

          if (isMaximizing && score > bestScore) {
            bestScore = score;
            bestMove = [row, col];
            alpha = Math.max(alpha, bestScore);
          } else if (!isMaximizing && score < bestScore) {
            bestScore = score;
            bestMove = [row, col];
            beta = Math.min(beta, bestScore);
          }

          if (beta <= alpha) break;
        }
      }
    }
    return { score: bestScore, move: bestMove };
  };

  const evaluateBoard = (board) => {
    let score = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === PLAYER2) score++;
        else if (board[row][col] === PLAYER1) score--;
      }
    }
    return score;
  };

  const isTerminal = (board) => {
    return (
      (!hasValidMove(PLAYER1) && !hasValidMove(PLAYER2)) || isBoardFull(board)
    );
  };

  // Helper function to check if the board is full
  const isBoardFull = (board) => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === EMPTY) {
          return false;
        }
      }
    }
    return true;
  };

  const hasValidMove = (player) => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (isValidMove(row, col, player)) {
          return true;
        }
      }
    }
    return false;
  };

  const checkEndGame = () => {
    if (!hasValidMove(PLAYER1) && !hasValidMove(PLAYER2)) {
      setGameOver(true);
      declareWinner();
    } else if (isBoardFull(board)) {
      setGameOver(true);
      declareWinner();
    }
  };

  const declareWinner = () => {
    updateScores(board); // Ensure scores are up-to-date
    setShowModal(true); // Show the modal when game ends
    if (player1Score > player2Score) {
      setStatus("Game Over! Player 1 (Black) wins!");
    } else if (player2Score > player1Score) {
      setStatus("Game Over! Player 2 (White) wins!");
    } else {
      setStatus("Game Over! It's a tie!");
    }
  };
  

  return (
    <div className="App">
      <h1>𝕽𝖊𝖛𝖊𝖗𝖘𝖎 (𝕺𝖙𝖍𝖊𝖑𝖑𝖔)</h1>

      {/* Board and game controls */}
      <div className="board">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`cell ${
                cell === PLAYER1 ? "player1" : cell === PLAYER2 ? "player2" : ""
              }`}
              onClick={() => playerMove(rowIndex, colIndex)}
            ></div>
          ))
        )}
      </div>

      {/* Game info section */}
      <div className="info">
        <button className="button-30" onClick={resetGame}>
          New Game
        </button>
        <label>
          Difficulty:
          <select
            className="select-dropdown"
            onChange={(e) => setMaxDepth(parseInt(e.target.value))}
            value={maxDepth}
          >
            <option value={1}>Easy</option>
            <option value={3}>Medium</option>
            <option value={5}>Hard</option>
          </select>
        </label>
        <div id="status">{status}</div>
        <div id="scores">
          <div>Player 1 (Black): {player1Score}</div>
          <div>Player 2 (White): {player2Score}</div>
        </div>
      </div>

      {/* Modal for Game Over */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Game Over!</h2>
            <p>{status}</p>
            <p>Final Scores:</p>
            <p>Player 1 (Black): {player1Score}</p>
            <p>Player 2 (White): {player2Score}</p>
            <button onClick={resetGame}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
