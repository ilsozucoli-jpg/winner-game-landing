import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, X, Circle, Timer } from 'lucide-react';

interface TicTacToeProps {
  onComplete: (success?: boolean) => void;
  timeLimit: number;
}

type Cell = 'X' | 'O' | null;
type Board = Cell[];

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6] // diagonals
];

export function TicTacToe({ onComplete, timeLimit }: TicTacToeProps) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [wins, setWins] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('Ganhe 3 vezes em 60 segundos!');
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [failures, setFailures] = useState(0);

  // Timer countdown
  useEffect(() => {
    if (gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameOver(true);
          if (wins >= 3) {
            setMessage('🎉 Você venceu o desafio!');
            setTimeout(() => onComplete(), 2000);
          } else {
            setMessage(`⏰ Tempo esgotado! Você conseguiu ${wins} vitória${wins !== 1 ? 's' : ''}.`);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver, wins, onComplete]);

  const checkWinner = useCallback((currentBoard: Board): { winner: Cell; line: number[] | null } => {
    for (const combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], line: combo };
      }
    }
    return { winner: null, line: null };
  }, []);

  const isBoardFull = (currentBoard: Board) => currentBoard.every(cell => cell !== null);

  const computerMove = useCallback((currentBoard: Board) => {
    // Simple AI: try to win, block player, or take center/corners
    const availableCells = currentBoard.map((cell, idx) => cell === null ? idx : null).filter(idx => idx !== null) as number[];
    
    if (availableCells.length === 0) return;

    // Try to win
    for (const idx of availableCells) {
      const testBoard = [...currentBoard];
      testBoard[idx] = 'O';
      if (checkWinner(testBoard).winner === 'O') {
        return idx;
      }
    }

    // Block player
    for (const idx of availableCells) {
      const testBoard = [...currentBoard];
      testBoard[idx] = 'X';
      if (checkWinner(testBoard).winner === 'X') {
        return idx;
      }
    }

    // Take center if available
    if (availableCells.includes(4)) return 4;

    // Take corners
    const corners = [0, 2, 6, 8].filter(idx => availableCells.includes(idx));
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

    // Take any available cell
    return availableCells[Math.floor(Math.random() * availableCells.length)];
  }, [checkWinner]);

  const resetBoard = useCallback(() => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinningLine(null);
  }, []);

  const restartGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinningLine(null);
    setWins(0);
    setFailures(0);
    setTimeLeft(timeLimit);
    setGameOver(false);
    setMessage('Ganhe 3 vezes em 60 segundos!');
  };

  const handleFailure = useCallback((msg: string) => {
    setFailures(prev => {
      const newFailures = prev + 1;
      if (newFailures >= 3) {
        setMessage('❌ 3 derrotas/empates! Etapa finalizada com 0 pontos.');
        setGameOver(true);
        setTimeout(() => onComplete(false), 2000);
      } else {
        setMessage(`${msg} (${newFailures}/3 falhas)`);
        setTimeout(resetBoard, 1500);
      }
      return newFailures;
    });
  }, [onComplete, resetBoard]);

  const handleCellClick = (index: number) => {
    if (!isPlayerTurn || board[index] || gameOver) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const { winner, line } = checkWinner(newBoard);
    
    if (winner === 'X') {
      setWinningLine(line);
      const newWins = wins + 1;
      setWins(newWins);
      
      if (newWins >= 3) {
        setMessage('🎉 Parabéns! Você venceu 3 vezes!');
        setGameOver(true);
        setTimeout(() => onComplete(), 2000);
      } else {
        setMessage(`🎯 Vitória ${newWins}/3! Continue!`);
        setTimeout(resetBoard, 1500);
      }
      return;
    }

    if (isBoardFull(newBoard)) {
      handleFailure('⚖️ Empate!');
      return;
    }

    setIsPlayerTurn(false);

    // Computer's turn
    setTimeout(() => {
      const computerIdx = computerMove(newBoard);
      if (computerIdx !== undefined) {
        newBoard[computerIdx] = 'O';
        setBoard(newBoard);

        const { winner: compWinner, line: compLine } = checkWinner(newBoard);
        
        if (compWinner === 'O') {
          setWinningLine(compLine);
          handleFailure('😅 O computador venceu!');
          return;
        }

        if (isBoardFull(newBoard)) {
          handleFailure('⚖️ Empate!');
          return;
        }

        setIsPlayerTurn(true);
      }
    }, 500);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6 animate-slide-up">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Tic-Tac-Toe
        </h2>
        
        <div className="flex items-center justify-center gap-4">
          <div className="bg-success/20 rounded-lg p-3 flex items-center gap-2">
            <Timer className="w-5 h-5 text-success" />
            <span className="text-2xl font-bold text-success">{timeLeft}s</span>
          </div>
          
          <div className="bg-gradient-success rounded-lg p-3 flex items-center gap-2 shadow-success">
            <Trophy className="w-5 h-5 text-success-foreground" />
            <span className="text-2xl font-bold text-success-foreground">{wins}/3</span>
          </div>
        </div>

        <p className="text-lg font-medium text-muted-foreground">{message}</p>
      </div>

      {/* Game Board */}
      <div className="max-w-sm mx-auto">
        <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-purple-light rounded-xl">
          {board.map((cell, index) => (
            <Button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={!isPlayerTurn || cell !== null || gameOver}
              className={`
                aspect-square h-24 text-4xl font-bold rounded-xl
                transition-all duration-300
                ${winningLine?.includes(index) 
                  ? 'bg-gradient-success shadow-success animate-pulse-scale' 
                  : 'bg-background hover:bg-accent hover:scale-105'
                }
                ${cell === 'X' ? 'text-primary' : 'text-destructive'}
                disabled:opacity-100
              `}
              variant="outline"
            >
              {cell === 'X' && <X className="w-12 h-12 drop-shadow-glow" />}
              {cell === 'O' && <Circle className="w-12 h-12 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />}
            </Button>
          ))}
        </div>
      </div>

      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Você joga com <X className="inline w-4 h-4 text-primary" /> • Computador joga com <Circle className="inline w-4 h-4 text-destructive" />
        </p>
        
        {gameOver && wins < 3 && failures < 3 && (
          <Button
            onClick={restartGame}
            variant="game"
            size="lg"
            className="w-full"
          >
            🔄 Reiniciar Tic-Tac-Toe
          </Button>
        )}
      </div>
    </div>
  );
}
