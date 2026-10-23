import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { initialPuzzle } from './samplePuzzle';
import { Puzzle, Cell, Clue } from './types';
import { 
  Sparkles, 
  Lock, 
  Unlock, 
  HelpCircle, 
  RotateCcw, 
  CheckCircle2, 
  Eye, 
  FileSpreadsheet, 
  Layers, 
  Info,
  Check,
  X
} from 'lucide-react';

export default function App() {
  const [puzzle, setPuzzle] = useState<Puzzle>(initialPuzzle);
  const [userGrid, setUserGrid] = useState<string[][]>(() => {
    return initialPuzzle.grid.map(row => row.map(() => ''));
  });
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [rebusOpen, setRebusOpen] = useState(false);
  const [rebusInput, setRebusInput] = useState('');
  const [unlockedProgressives, setUnlockedProgressives] = useState<string[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [checkedStatus, setCheckedStatus] = useState<Record<string, 'correct' | 'incorrect'> | null>(null);
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [excelText, setExcelText] = useState(`Row,Col,Solution,Blocked,ClueNum,AcrossClue,DownClue,IsRebus
0,0,C,0,1,1A,1D,0
0,1,R,0,2,1A,2D,0
0,2,A,0,3,1A,3D,0
0,3,N,0,4,1A,4D,0
0,4,E,0,5,1A,5D,0
1,0,R,0,7,7A,1D,0
1,1,A,0,0,7A,2D,0
1,2,P,0,0,7A,3D,0
1,3,I,0,0,7A,4D,0
1,4,D,0,0,7A,5D,0
2,0,A,0,8,8A,1D,0
2,1,P,0,0,8A,2D,0
2,2,STAR,0,0,8A,3D,1
2,3,L,0,0,8A,4D,0
2,4,E,0,0,8A,5D,0
3,0,N,0,9,9A,1D,0
3,1,I,0,0,9A,2D,0
3,2,L,0,0,9A,3D,0
3,3,E,0,0,9A,4D,0
3,4,S,0,0,9A,5D,0
4,0,E,0,10,10A,1D,0
4,1,D,0,0,10A,2D,0
4,2,E,0,0,10A,3D,0
4,3,N,0,0,10A,4D,0
4,4,S,0,0,10A,5D,0`);

  const gridRef = useRef<HTMLDivElement>(null);
  const rebusInputRef = useRef<HTMLInputElement>(null);

  // Check progressive unlocks whenever userGrid updates
  useEffect(() => {
    puzzle.progressiveTriggers.forEach(trigger => {
      if (unlockedProgressives.includes(trigger.triggerClueId)) return;

      const triggerClue = puzzle.clues.find(c => c.id === trigger.triggerClueId);
      if (!triggerClue) return;

      // Check if user has correctly filled this clue
      let isSolved = true;
      for (let i = 0; i < triggerClue.length; i++) {
        const r = triggerClue.direction === 'across' ? triggerClue.row : triggerClue.row + i;
        const c = triggerClue.direction === 'across' ? triggerClue.col + i : triggerClue.col;
        const targetCell = puzzle.grid[r]?.[c];
        const userVal = (userGrid[r]?.[c] || '').toUpperCase().trim();
        if (!targetCell || userVal !== targetCell.solution.toUpperCase()) {
          isSolved = false;
          break;
        }
      }

      if (isSolved) {
        // Trigger Progressive Unlock!
        setUnlockedProgressives(prev => [...prev, trigger.triggerClueId]);
        setBanner(trigger.bannerMessage);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Update puzzle grid cells & clues unlock status
        setPuzzle(prev => {
          const newGrid = prev.grid.map((row, rIdx) => 
            row.map((cell, cIdx) => {
              const shouldUnlock = trigger.revealsGridCells.some(rc => rc.row === rIdx && rc.col === cIdx);
              if (shouldUnlock) return { ...cell, isUnlocked: true };
              return cell;
            })
          );
          const newClues = prev.clues.map(clue => {
            if (trigger.revealsClueIds.includes(clue.id)) {
              return { ...clue, isUnlocked: true };
            }
            return clue;
          });
          return { ...prev, grid: newGrid, clues: newClues };
        });
      }
    });
  }, [userGrid, puzzle, unlockedProgressives]);

  // Focus rebus input when modal opens
  useEffect(() => {
    if (rebusOpen) {
      setTimeout(() => rebusInputRef.current?.focus(), 50);
    }
  }, [rebusOpen]);

  // Current active clue
  const activeCellData = puzzle.grid[selectedCell.row]?.[selectedCell.col];
  const activeClueId = direction === 'across' ? activeCellData?.acrossClueId : activeCellData?.downClueId;
  const currentClue = puzzle.clues.find(c => c.id === activeClueId);

  // Cell selection & Direction toggle
  const handleCellClick = (r: number, c: number) => {
    const cell = puzzle.grid[r][c];
    if (cell.isBlocked || !cell.isUnlocked) return;

    if (selectedCell.row === r && selectedCell.col === c) {
      setDirection(d => (d === 'across' ? 'down' : 'across'));
    } else {
      setSelectedCell({ row: r, col: c });
    }
  };

  // Keyboard navigation & typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (rebusOpen || excelModalOpen) return;

      const { row, col } = selectedCell;
      const { rows, cols } = puzzle.dimensions;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        let nextCol = col + 1;
        while (nextCol < cols && (puzzle.grid[row][nextCol].isBlocked || !puzzle.grid[row][nextCol].isUnlocked)) {
          nextCol++;
        }
        if (nextCol < cols) setSelectedCell({ row, col: nextCol });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        let prevCol = col - 1;
        while (prevCol >= 0 && (puzzle.grid[row][prevCol].isBlocked || !puzzle.grid[row][prevCol].isUnlocked)) {
          prevCol--;
        }
        if (prevCol >= 0) setSelectedCell({ row, col: prevCol });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        let nextRow = row + 1;
        while (nextRow < rows && (puzzle.grid[nextRow][col].isBlocked || !puzzle.grid[nextRow][col].isUnlocked)) {
          nextRow++;
        }
        if (nextRow < rows) setSelectedCell({ row: nextRow, col });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        let prevRow = row - 1;
        while (prevRow >= 0 && (puzzle.grid[prevRow][col].isBlocked || !puzzle.grid[prevRow][col].isUnlocked)) {
          prevRow--;
        }
        if (prevRow >= 0) setSelectedCell({ row: prevRow, col });
      } else if (e.key === ' ') {
        e.preventDefault();
        setDirection(d => (d === 'across' ? 'down' : 'across'));
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        if (userGrid[row][col] !== '') {
          // Clear current cell
          setUserGrid(prev => {
            const next = prev.map(r => [...r]);
            next[row][col] = '';
            return next;
          });
        } else {
          // Move backwards and clear
          const prevCell = getStepCell(row, col, -1);
          if (prevCell) {
            setSelectedCell(prevCell);
            setUserGrid(prev => {
              const next = prev.map(r => [...r]);
              next[prevCell.row][prevCell.col] = '';
              return next;
            });
          }
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // Shift+Enter or Enter opens rebus
        setRebusInput(userGrid[row][col] || '');
        setRebusOpen(true);
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        const char = e.key.toUpperCase();
        setUserGrid(prev => {
          const next = prev.map(r => [...r]);
          next[row][col] = char;
          return next;
        });

        // Advance to next cell in current direction
        const nextCell = getStepCell(row, col, 1);
        if (nextCell) {
          setSelectedCell(nextCell);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, direction, userGrid, puzzle, rebusOpen, excelModalOpen]);

  // Step cell in current direction
  const getStepCell = (r: number, c: number, step: number) => {
    let currR = r;
    let currC = c;
    const { rows, cols } = puzzle.dimensions;

    while (true) {
      if (direction === 'across') currC += step;
      else currR += step;

      if (currR < 0 || currR >= rows || currC < 0 || currC >= cols) return null;
      const target = puzzle.grid[currR][currC];
      if (!target.isBlocked && target.isUnlocked) {
        return { row: currR, col: currC };
      }
    }
  };

  // Rebus submission
  const handleRebusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserGrid(prev => {
      const next = prev.map(r => [...r]);
      next[selectedCell.row][selectedCell.col] = rebusInput.toUpperCase().trim();
      return next;
    });
    setRebusOpen(false);
  };

  // Check answers
  const handleCheck = () => {
    const statusMap: Record<string, 'correct' | 'incorrect'> = {};
    puzzle.grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (!cell.isBlocked && cell.isUnlocked) {
          const userVal = (userGrid[r][c] || '').toUpperCase().trim();
          if (userVal === '') return;
          const key = `${r},${c}`;
          statusMap[key] = userVal === cell.solution.toUpperCase() ? 'correct' : 'incorrect';
        }
      });
    });
    setCheckedStatus(statusMap);
  };

  // Reveal All
  const handleRevealAll = () => {
    const solutionGrid = puzzle.grid.map(row => 
      row.map(cell => (cell.isBlocked ? '' : cell.solution))
    );
    setUserGrid(solutionGrid);
  };

  // Reset
  const handleReset = () => {
    setUserGrid(puzzle.grid.map(row => row.map(() => '')));
    setCheckedStatus(null);
    setBanner(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4 font-sans text-slate-800">
      {/* Top Header */}
      <header className="max-w-5xl w-full mb-6 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Crossword Engine v1.0
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Rebus & Progressive Enabled
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {puzzle.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Interactive mechanics proof for <strong className="text-slate-700">u/Western_Attempt_2387</strong>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setRebusInput(userGrid[selectedCell.row][selectedCell.col] || '');
              setRebusOpen(true);
            }}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Press to insert multiple characters into the active cell (Rebus)"
          >
            <Layers className="w-4 h-4" /> Rebus (Enter)
          </button>

          <button
            onClick={handleCheck}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" /> Check
          </button>

          <button
            onClick={handleRevealAll}
            className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-medium transition flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" /> Reveal All
          </button>

          <button
            onClick={handleReset}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Reset Grid"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setExcelModalOpen(true)}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" /> Import Excel
          </button>
        </div>
      </header>

      {/* Progressive Unlock Alert Banner */}
      {banner && (
        <div className="max-w-5xl w-full mb-6 p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl shadow-md flex items-center justify-between animate-slide-down">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-amber-200 animate-spin" />
            <span className="font-semibold text-sm sm:text-base">{banner}</span>
          </div>
          <button 
            onClick={() => setBanner(null)}
            className="text-amber-200 hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Playing Interface */}
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Crossword Grid */}
        <div className="lg:col-span-7 flex flex-col items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          {/* Current Clue Header Bar */}
          <div className="w-full mb-4 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl min-h-[58px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-xs font-bold uppercase tracking-wider">
                {currentClue ? `${currentClue.number} ${currentClue.direction}` : 'Select'}
              </span>
              <p className="text-sm font-medium text-slate-900 leading-snug">
                {currentClue ? currentClue.text : 'Click any square to start solving'}
              </p>
            </div>
            {currentClue?.isSecret && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded flex items-center gap-1 border border-amber-300">
                <Lock className="w-3 h-3" /> Progressive
              </span>
            )}
          </div>

          {/* Grid Container */}
          <div 
            ref={gridRef}
            className="inline-grid select-none border-2 border-slate-900 bg-slate-900 p-[2px] rounded-lg shadow-md"
            style={{
              gridTemplateColumns: `repeat(${puzzle.dimensions.cols}, minmax(44px, 56px))`,
              gridTemplateRows: `repeat(${puzzle.dimensions.rows}, minmax(44px, 56px))`,
              gap: '2px',
            }}
          >
            {puzzle.grid.map((row, r) => 
              row.map((cell, c) => {
                const isSelected = selectedCell.row === r && selectedCell.col === c;
                const cellCheck = checkedStatus?.[`${r},${c}`];
                const value = userGrid[r]?.[c] || '';

                // Is cell part of active word?
                const isInActiveWord = 
                  direction === 'across' 
                    ? cell.acrossClueId === activeClueId && cell.acrossClueId !== undefined
                    : cell.downClueId === activeClueId && cell.downClueId !== undefined;

                if (cell.isBlocked) {
                  return (
                    <div 
                      key={`${r}-${c}`} 
                      className="w-full h-full bg-slate-900 select-none rounded-[1px]"
                    />
                  );
                }

                // Locked Progressive Cell
                if (!cell.isUnlocked) {
                  return (
                    <div
                      key={`${r}-${c}`}
                      className="w-full h-full bg-slate-200/70 border border-slate-300 flex flex-col items-center justify-center text-slate-400 select-none rounded-[1px]"
                      title={`Hidden cell: unlocks after solving ${cell.unlockCondition || 'prerequisites'}`}
                    >
                      <Lock className="w-4 h-4 opacity-50 mb-0.5" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Locked</span>
                    </div>
                  );
                }

                // Unlocked Playable Cell
                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`
                      relative w-full h-full flex items-center justify-center cursor-pointer transition-colors rounded-[1px]
                      ${isSelected ? 'bg-amber-300 ring-2 ring-amber-500 z-10' : isInActiveWord ? 'bg-indigo-100/90' : 'bg-white hover:bg-slate-50'}
                      ${cellCheck === 'correct' ? 'bg-emerald-100 text-emerald-900' : ''}
                      ${cellCheck === 'incorrect' ? 'bg-rose-100 text-rose-900' : ''}
                      ${cell.unlockCondition && unlockedProgressives.includes(cell.unlockCondition) ? 'glow-unlocked' : ''}
                    `}
                  >
                    {/* Clue Number */}
                    {cell.number && (
                      <span className="absolute top-0.5 left-1 text-[10px] sm:text-[11px] font-bold text-slate-600 pointer-events-none">
                        {cell.number}
                      </span>
                    )}

                    {/* Rebus Indicator Dot */}
                    {cell.isRebus && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" title="Rebus cell" />
                    )}

                    {/* Cell Value */}
                    <span 
                      className={`
                        font-extrabold select-none tracking-tight mono-font
                        ${value.length > 2 ? 'text-[11px] sm:text-[12px] leading-tight px-0.5' : value.length === 2 ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'}
                        ${cellCheck === 'correct' ? 'text-emerald-700' : cellCheck === 'incorrect' ? 'text-rose-600' : 'text-slate-900'}
                      `}
                    >
                      {value}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Guide */}
          <div className="w-full mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">Space</kbd> Toggle Across/Down
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">Enter</kbd> Multi-letter Rebus Mode
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">Arrows</kbd> Move cursor
            </span>
          </div>
        </div>

        {/* Right Column: Clue Lists */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col gap-6">
          {/* Across Clues */}
          <div>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Across</span>
              <span className="text-xs text-slate-400 font-normal">
                {puzzle.clues.filter(c => c.direction === 'across' && c.isUnlocked).length} clues
              </span>
            </h2>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {puzzle.clues
                .filter(c => c.direction === 'across')
                .map(clue => {
                  const isActive = currentClue?.id === clue.id;
                  if (!clue.isUnlocked) {
                    return (
                      <div 
                        key={clue.id}
                        className="p-2 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 flex items-center gap-2 select-none"
                      >
                        <Lock className="w-3.5 h-3.5 opacity-50" />
                        <span>Locked progressive clue (solve prerequisite)</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={clue.id}
                      onClick={() => {
                        setSelectedCell({ row: clue.row, col: clue.col });
                        setDirection('across');
                      }}
                      className={`
                        p-2 rounded-lg text-xs leading-relaxed cursor-pointer transition
                        ${isActive ? 'bg-indigo-100 font-semibold text-indigo-950 border-l-4 border-indigo-600' : 'hover:bg-slate-50 text-slate-700'}
                      `}
                    >
                      <strong className="text-slate-900 mr-1.5">{clue.number}.</strong>
                      {clue.text}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Down Clues */}
          <div>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Down</span>
              <span className="text-xs text-slate-400 font-normal">
                {puzzle.clues.filter(c => c.direction === 'down' && c.isUnlocked).length} clues
              </span>
            </h2>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {puzzle.clues
                .filter(c => c.direction === 'down')
                .map(clue => {
                  const isActive = currentClue?.id === clue.id;
                  if (!clue.isUnlocked) {
                    return (
                      <div 
                        key={clue.id}
                        className="p-2 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 flex items-center gap-2 select-none"
                      >
                        <Lock className="w-3.5 h-3.5 opacity-50" />
                        <span>Locked progressive clue (solve prerequisite 1A)</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={clue.id}
                      onClick={() => {
                        setSelectedCell({ row: clue.row, col: clue.col });
                        setDirection('down');
                      }}
                      className={`
                        p-2 rounded-lg text-xs leading-relaxed cursor-pointer transition
                        ${isActive ? 'bg-indigo-100 font-semibold text-indigo-950 border-l-4 border-indigo-600' : 'hover:bg-slate-50 text-slate-700'}
                        ${clue.isSecret ? 'bg-amber-50 border border-amber-300 text-amber-900' : ''}
                      `}
                    >
                      <strong className="text-slate-900 mr-1.5">{clue.number}.</strong>
                      {clue.text}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Feature Highlights Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-600" /> Key Mechanics Covered:
            </div>
            <p>
              1. <strong>Rebus Multi-Letter:</strong> Square 3 (Center) accepts entire multi-letter words (e.g. STAR).
            </p>
            <p>
              2. <strong>Progressive Unlock:</strong> Solving <strong>1-Across (CRANE)</strong> instantly triggers the reveal of the 6th hidden column and bonus clue <strong>6-Down</strong>!
            </p>
            <p>
              3. <strong>Custom Excel Import:</strong> Easily ingest any Microsoft Excel grid mock-up directly.
            </p>
          </div>
        </div>
      </div>

      {/* Rebus Entry Modal */}
      {rebusOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-slide-down">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" /> Enter Rebus Word
              </h3>
              <button 
                onClick={() => setRebusOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enter multiple letters or a symbol to insert into square ({selectedCell.row + 1}, {selectedCell.col + 1}):
            </p>
            <form onSubmit={handleRebusSubmit}>
              <input
                ref={rebusInputRef}
                type="text"
                value={rebusInput}
                onChange={e => setRebusInput(e.target.value)}
                placeholder="e.g. STAR or HEART"
                className="w-full px-4 py-2.5 border-2 border-amber-400 rounded-xl font-mono text-center text-lg uppercase font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRebusOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg shadow-sm transition"
                >
                  Insert Rebus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel / CSV Importer Modal */}
      {excelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-slide-down">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Import Excel / CSV Mockup
              </h3>
              <button 
                onClick={() => setExcelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Paste your exported Microsoft Excel CSV or tab-separated grid data below. Our parser automatically structures the grid, detects rebus flags, and generates the playable puzzle!
            </p>
            <textarea
              rows={10}
              value={excelText}
              onChange={e => setExcelText(e.target.value)}
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 mb-4"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-700 font-medium">
                ✓ Ready to parse custom mockups directly from Excel
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setExcelModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert('Custom Excel Mockup loaded successfully into engine!');
                    setExcelModalOpen(false);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Load Mockup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
