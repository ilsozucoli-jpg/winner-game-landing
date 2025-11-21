import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Bomb, Flag } from 'lucide-react';

interface MinesweeperProps {
  onComplete: (score: number) => void;
  timeLeft: number;
}

type CellState = 'hidden' | 'revealed' | 'flagged';

interface Cell {
  hasBomb: boolean;
  state: CellState;
  adjacentBombs: number;
}

export function Minesweeper({ onComplete, timeLeft }: MinesweeperProps) {
  const ROWS = 6;
  const COLS = 6;
  const BOMB_COUNT = 3;
  const MAX_ATTEMPTS = 5;

  const [grid, setGrid] = useState<Cell[][]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [revealedCells, setRevealedCells] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const initializeGrid = () => {
    const newGrid: Cell[][] = Array(ROWS).fill(null).map(() =>
      Array(COLS).fill(null).map(() => ({
        hasBomb: false,
        state: 'hidden' as CellState,
        adjacentBombs: 0,
      }))
    );

    // Posicionar bombas aleatoriamente
    let bombsPlaced = 0;
    while (bombsPlaced < BOMB_COUNT) {
      const row = Math.floor(Math.random() * ROWS);
      const col = Math.floor(Math.random() * COLS);
      
      if (!newGrid[row][col].hasBomb) {
        newGrid[row][col].hasBomb = true;
        bombsPlaced++;
      }
    }

    // Calcular números adjacentes
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (!newGrid[row][col].hasBomb) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const newRow = row + dr;
              const newCol = col + dc;
              if (
                newRow >= 0 && newRow < ROWS &&
                newCol >= 0 && newCol < COLS &&
                newGrid[newRow][newCol].hasBomb
              ) {
                count++;
              }
            }
          }
          newGrid[row][col].adjacentBombs = count;
        }
      }
    }

    setGrid(newGrid);
    setRevealedCells(0);
  };

  useEffect(() => {
    initializeGrid();
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && !gameOver) {
      setGameOver(true);
      onComplete(0);
    }
  }, [timeLeft, gameOver, onComplete]);

  const revealCell = (row: number, col: number) => {
    if (gameOver || grid[row][col].state !== 'hidden') return;

    const newGrid = [...grid];
    
    if (newGrid[row][col].hasBomb) {
      // Acertou bomba - reinicia o jogo
      setAttemptsLeft(prev => {
        const newAttempts = prev - 1;
        if (newAttempts <= 0) {
          setGameOver(true);
          onComplete(0);
        }
        return newAttempts;
      });
      initializeGrid();
      return;
    }

    // Revelar célula
    newGrid[row][col].state = 'revealed';
    let newRevealedCount = revealedCells + 1;

    // Revelar células adjacentes vazias automaticamente
    if (newGrid[row][col].adjacentBombs === 0) {
      const queue: [number, number][] = [[row, col]];
      const visited = new Set<string>();
      
      while (queue.length > 0) {
        const [r, c] = queue.shift()!;
        const key = `${r},${c}`;
        
        if (visited.has(key)) continue;
        visited.add(key);

        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const newRow = r + dr;
            const newCol = c + dc;
            
            if (
              newRow >= 0 && newRow < ROWS &&
              newCol >= 0 && newCol < COLS &&
              newGrid[newRow][newCol].state === 'hidden' &&
              !newGrid[newRow][newCol].hasBomb
            ) {
              newGrid[newRow][newCol].state = 'revealed';
              newRevealedCount++;
              
              if (newGrid[newRow][newCol].adjacentBombs === 0) {
                queue.push([newRow, newCol]);
              }
            }
          }
        }
      }
    }

    setGrid(newGrid);
    setRevealedCells(newRevealedCount);

    // Verificar se ganhou (revelou todas as células sem bombas)
    const totalSafeCells = ROWS * COLS - BOMB_COUNT;
    if (newRevealedCount >= totalSafeCells) {
      setGameOver(true);
      const score = Math.max(0, 1000 - (60 - timeLeft) * 10 + attemptsLeft * 50);
      onComplete(score);
    }
  };

  const toggleFlag = (row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (gameOver || grid[row][col].state === 'revealed') return;

    const newGrid = [...grid];
    newGrid[row][col].state = newGrid[row][col].state === 'flagged' ? 'hidden' : 'flagged';
    setGrid(newGrid);
  };

  const getCellColor = (cell: Cell) => {
    if (cell.state === 'hidden') return 'bg-blue-200 hover:bg-blue-300';
    if (cell.state === 'flagged') return 'bg-destructive/20';
    if (cell.hasBomb) return 'bg-destructive';
    return 'bg-green-200';
  };

  const getNumberColor = (num: number) => {
    const colors = [
      '',
      'text-blue-500',
      'text-green-500',
      'text-red-500',
      'text-purple-500',
      'text-yellow-500',
      'text-pink-500',
      'text-orange-500',
      'text-cyan-500',
    ];
    return colors[num] || '';
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-foreground">Campo Minado</h3>
        <p className="text-muted-foreground">
          Encontre todas as células seguras! 3 bombas escondidas.
        </p>
        <div className="flex gap-4 justify-center text-sm">
          <span className="font-semibold text-foreground">
            Tentativas: <span className="text-primary">{attemptsLeft}</span>
          </span>
          <span className="font-semibold text-foreground">
            Tempo: <span className="text-success">{timeLeft}s</span>
          </span>
        </div>
      </div>

      <div className="grid gap-1 bg-border p-2 rounded-lg" 
           style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
        {grid.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => revealCell(rowIndex, colIndex)}
              onContextMenu={(e) => toggleFlag(rowIndex, colIndex, e)}
              disabled={gameOver}
              className={`
                w-12 h-12 flex items-center justify-center
                border-2 border-border rounded
                font-bold text-lg
                transition-all duration-200
                ${getCellColor(cell)}
                ${!gameOver && cell.state === 'hidden' ? 'cursor-pointer active:scale-95' : ''}
              `}
            >
              {cell.state === 'flagged' && <Flag className="w-5 h-5 text-destructive" />}
              {cell.state === 'revealed' && (
                <>
                  {cell.hasBomb && <Bomb className="w-5 h-5 text-destructive-foreground" />}
                  {!cell.hasBomb && cell.adjacentBombs > 0 && (
                    <span className={getNumberColor(cell.adjacentBombs)}>
                      {cell.adjacentBombs}
                    </span>
                  )}
                </>
              )}
            </button>
          ))
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Clique para revelar • Botão direito para marcar</p>
      </div>
    </div>
  );
}
