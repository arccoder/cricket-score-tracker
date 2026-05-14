import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  RotateCcw, 
  History, 
  Settings,
  Users,
  Download,
  Plus,
  AlertTriangle,
  Keyboard,
  Moon,
  Sun,
  Undo2 // Added Undo icon
} from 'lucide-react';

/**
 * Advanced Cricket Score Tracking Application with Undo Support
 * Features:
 * - Full Undo/Redo logic for match states
 * - Custom runs (text input) for rare scenarios
 * - CSV Export functionality for match logs
 * - Dark mode toggle
 * - Complex scoring: Extras + Runs + Run Outs
 */

const App = () => {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Game Configuration State
  const [gameState, setGameState] = useState('setup'); 
  const [totalOvers, setTotalOvers] = useState(5);
  const [totalPlayers, setTotalPlayers] = useState(11);
  const [teamNames, setTeamNames] = useState({ team1: 'Team A', team2: 'Team B' });

  // UI State for scoring modifiers
  const [selectedRuns, setSelectedRuns] = useState(0);
  const [customRunInput, setCustomRunInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Match Data State
  const [innings, setInnings] = useState([
    { team: '', runs: 0, wickets: 0, deliveries: 0, extras: 0, history: [] },
    { team: '', runs: 0, wickets: 0, deliveries: 0, extras: 0, history: [] }
  ]);
  const [currentInningsIdx, setCurrentInningsIdx] = useState(0);

  const currentInnings = innings[currentInningsIdx];
  const maxWickets = totalPlayers - 1;

  // Persistence for Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('cricket-theme');
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('cricket-theme', newTheme ? 'dark' : 'light');
  };

  // CSV Export Logic
  const exportToCSV = () => {
    const allHistory = [...innings[0].history.map(h => ({ ...h, team: innings[0].team, inn: 1 })), 
                        ...innings[1].history.map(h => ({ ...h, team: innings[1].team, inn: 2 }))];
    
    if (allHistory.length === 0) return;

    const headers = ["Innings", "Team", "Over", "Ball", "Result", "Total Runs", "Is Wicket"];
    // Flatten the history to match the export requirements
    const rows = allHistory.reverse().map(h => [
      h.inn,
      h.team,
      h.over,
      h.ballInOver,
      h.label,
      h.runs,
      h.isWicket ? "Yes" : "No"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `cricket_match_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const recordBall = (type) => {
    if (gameState === 'finished') return;

    const runsToRecord = showCustomInput ? (parseInt(customRunInput) || 0) : selectedRuns;

    let runChange = 0;
    let wicketChange = 0;
    let ballIncrement = 0;
    let extraChange = 0;
    let eventLabel = '';

    switch (type) {
      case 'LEGAL':
        runChange = runsToRecord;
        ballIncrement = 1;
        eventLabel = runsToRecord === 0 ? '•' : `${runsToRecord}`;
        break;
      case 'WIDE':
        runChange = 1 + runsToRecord;
        ballIncrement = 0;
        extraChange = 1 + runsToRecord;
        eventLabel = runsToRecord > 0 ? `${runsToRecord}wd` : 'WD';
        break;
      case 'NO_BALL':
        runChange = 1 + runsToRecord;
        ballIncrement = 0;
        extraChange = 1; 
        eventLabel = runsToRecord > 0 ? `${runsToRecord}nb` : 'NB';
        break;
      case 'BYE':
      case 'LEG_BYE':
        runChange = runsToRecord;
        ballIncrement = 1;
        extraChange = runsToRecord;
        eventLabel = `${runsToRecord}${type === 'BYE' ? 'b' : 'lb'}`;
        break;
      case 'WICKET':
        wicketChange = 1;
        ballIncrement = 1;
        eventLabel = 'W';
        break;
      case 'RUN_OUT':
        runChange = runsToRecord;
        wicketChange = 1;
        ballIncrement = 1;
        eventLabel = `${runsToRecord}R-O`;
        break;
      default:
        break;
    }

    const updatedInnings = [...innings];
    const target = { ...updatedInnings[currentInningsIdx] };

    // Update statistics
    target.runs += runChange;
    target.wickets += wicketChange;
    target.deliveries += ballIncrement;
    target.extras += extraChange;
    
    // Store in history with all deltas for undo capability
    target.history = [
      {
        ballNum: target.deliveries,
        label: eventLabel,
        runs: runChange,
        wickets: wicketChange,
        ballDelta: ballIncrement,
        extras: extraChange,
        over: Math.floor(target.deliveries / 6),
        ballInOver: (target.deliveries % 6) || 6,
        isWicket: wicketChange > 0
      },
      ...target.history
    ];

    updatedInnings[currentInningsIdx] = target;
    setInnings(updatedInnings);
    
    // Reset UI state
    setSelectedRuns(0);
    setCustomRunInput('');
    setShowCustomInput(false);

    // Check for game end/innings switch conditions
    const isWicketsOut = target.wickets >= maxWickets;
    const isOversDone = target.deliveries >= totalOvers * 6;
    const isTargetReached = currentInningsIdx === 1 && target.runs > innings[0].runs;

    if (isWicketsOut || isOversDone || isTargetReached) {
      if (currentInningsIdx === 0) {
        setGameState('innings2');
        setCurrentInningsIdx(1);
      } else {
        setGameState('finished');
      }
    }
  };

  const undoLastBall = () => {
    // 1. Identify which innings we are undoing from
    let activeIdx = currentInningsIdx;
    let currentInnsState = { ...innings[activeIdx] };

    // If game is finished, we stay in the last innings index but change state
    if (gameState === 'finished') {
      setGameState('innings2');
    }

    // If current history is empty but we're in 2nd innings, move back to 1st innings
    if (currentInnsState.history.length === 0 && activeIdx === 1) {
      activeIdx = 0;
      currentInnsState = { ...innings[0] };
      setCurrentInningsIdx(0);
      setGameState('innings1');
    }

    // If history is still empty (at very start of match), do nothing
    if (currentInnsState.history.length === 0) return;

    // 2. Extract the last action and revert stats
    const [lastAction, ...remainingHistory] = currentInnsState.history;

    currentInnsState.runs -= lastAction.runs;
    currentInnsState.wickets -= lastAction.wickets;
    currentInnsState.deliveries -= lastAction.ballDelta;
    currentInnsState.extras -= lastAction.extras;
    currentInnsState.history = remainingHistory;

    // 3. Update state
    const updatedInnings = [...innings];
    updatedInnings[activeIdx] = currentInnsState;
    setInnings(updatedInnings);
  };

  const startGame = () => {
    setInnings([
      { team: teamNames.team1, runs: 0, wickets: 0, deliveries: 0, extras: 0, history: [] },
      { team: teamNames.team2, runs: 0, wickets: 0, deliveries: 0, extras: 0, history: [] }
    ]);
    setGameState('innings1');
    setCurrentInningsIdx(0);
  };

  const formatOvers = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;

  const getMatchResult = () => {
    const t1 = innings[0];
    const t2 = innings[1];
    if (t1.runs > t2.runs) return `${t1.team} won by ${t1.runs - t2.runs} runs`;
    if (t2.runs > t1.runs) return `${t2.team} won by ${totalPlayers - t2.wickets - 1} wickets`;
    return "Match Tied!";
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 pb-12 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      <header className={`${isDarkMode ? 'bg-slate-900 border-b border-slate-800' : 'bg-slate-900'} text-white p-4 sticky top-0 z-20 shadow-lg`}>
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-400 w-6 h-6" />
            <h1 className="font-bold text-lg uppercase tracking-tight">Cricket Master</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-slate-800 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-400" />}
            </button>
            {gameState !== 'setup' && (
              <div className="flex gap-3">
                <button onClick={exportToCSV} className="text-slate-400 hover:text-white" title="Export CSV">
                  <Download className="w-5 h-5" />
                </button>
                <button onClick={() => setGameState('setup')} className="text-slate-400 hover:text-white" title="Reset Game">
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4">
        {gameState === 'setup' ? (
          <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl shadow-xl p-6 border`}>
            <div className="flex items-center gap-2 mb-6">
              <Settings className="text-indigo-500" />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Game Configuration</h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>Team 1</label>
                  <input className={`w-full p-3 border rounded-xl ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} value={teamNames.team1} onChange={e => setTeamNames({...teamNames, team1: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>Team 2</label>
                  <input className={`w-full p-3 border rounded-xl ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} value={teamNames.team2} onChange={e => setTeamNames({...teamNames, team2: e.target.value})} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>Match Overs</label>
                  <span className={`px-3 py-1 rounded-full font-bold ${isDarkMode ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-600 text-white shadow-sm'}`}>
                    {totalOvers}
                  </span>
                </div>
                <input type="range" min="1" max="50" className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" value={totalOvers} onChange={e => setTotalOvers(parseInt(e.target.value))} />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>Players per Team</label>
                  <span className={`px-3 py-1 rounded-full font-bold ${isDarkMode ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-600 text-white shadow-sm'}`}>
                    {totalPlayers}
                  </span>
                </div>
                <input type="range" min="2" max="11" className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" value={totalPlayers} onChange={e => setTotalPlayers(parseInt(e.target.value))} />
              </div>

              <button onClick={startGame} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
                Let's Play
              </button>
            </div>
          </div>
        ) : gameState === 'finished' ? (
          <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl shadow-xl p-8 text-center border-t-8 border-indigo-500`}>
            <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2">Match Complete</h2>
            <div className={`${isDarkMode ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-50 text-indigo-700'} py-4 px-6 rounded-2xl text-xl font-bold mb-4`}>{getMatchResult()}</div>
            
            <button 
              onClick={undoLastBall} 
              className={`w-full mb-3 flex items-center justify-center gap-2 font-bold py-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
            >
              <Undo2 className="w-4 h-4 text-orange-500"/> Correct Last Action (Undo)
            </button>

            <button onClick={exportToCSV} className={`w-full mb-3 flex items-center justify-center gap-2 font-bold py-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}><Download className="w-4 h-4"/> Export Full Log</button>
            <button onClick={() => setGameState('setup')} className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-bold py-4 rounded-xl">New Match</button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Scorecard */}
            <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl shadow-sm border overflow-hidden`}>
              <div className="bg-slate-800 dark:bg-slate-800/50 text-white p-3 flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                <span>{currentInnings.team} Innings</span>
                <span className="opacity-60">{gameState === 'innings1' ? '1st Innings' : '2nd Innings'}</span>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-end">
                  <div>
                    <div className={`text-5xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      {currentInnings.runs} <span className={`text-2xl font-medium ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>/ {currentInnings.wickets}</span>
                    </div>
                    <div className={`font-bold mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Overs: {formatOvers(currentInnings.deliveries)} <span className={`font-normal ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>/ {totalOvers}</span>
                    </div>
                  </div>
                  {currentInningsIdx === 1 && (
                    <div className={`text-right px-6 py-4 rounded-2xl border-2 ${isDarkMode ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-indigo-50 border-indigo-200'} shadow-sm`}>
                      <p className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>Target</p>
                      <p className={`text-4xl font-black mb-1 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>{innings[0].runs + 1}</p>
                      <p className={`text-sm font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        Need <span className="text-lg">{innings[0].runs + 1 - currentInnings.runs}</span> runs in <span className="text-lg">{totalOvers * 6 - currentInnings.deliveries}</span> balls
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Run Selection Row */}
            <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} p-3 rounded-2xl border shadow-sm space-y-3`}>
              <div className="flex justify-between items-center px-1">
                <p className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Runs Scored</p>
                <button 
                  onClick={() => setShowCustomInput(!showCustomInput)} 
                  className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${showCustomInput ? 'bg-indigo-600 text-white' : isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-slate-300' : 'bg-slate-100 text-slate-500'}`}
                >
                  {showCustomInput ? 'Back to presets' : 'Enter custom runs'}
                </button>
              </div>

              {!showCustomInput ? (
                <div className="flex justify-between gap-1">
                  {[0, 1, 2, 3, 4, 6].map(num => (
                    <button 
                      key={num} 
                      onClick={() => setSelectedRuns(num)} 
                      className={`flex-1 py-3 rounded-xl font-black transition-all ${selectedRuns === num ? 'bg-indigo-600 text-white shadow-md scale-105' : isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-50 text-slate-400'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" 
                      placeholder="e.g. 7 or 12"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl font-bold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                      value={customRunInput}
                      onChange={e => setCustomRunInput(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => recordBall('LEGAL')} className="bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-colors">RECORD BALL</button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => recordBall('WIDE')} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition-colors">WIDE</button>
                <button onClick={() => recordBall('NO_BALL')} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition-colors">NO-BALL</button>
                <button onClick={() => recordBall('BYE')} className={`${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-400 hover:bg-slate-500'} text-white rounded-xl font-bold text-xs transition-colors`}>BYES</button>
                <button onClick={() => recordBall('LEG_BYE')} className={`${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-400 hover:bg-slate-500'} text-white rounded-xl font-bold text-xs transition-colors`}>LEG BYE</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => recordBall('WICKET')} className="bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-colors">Out (Bowled/Caught)</button>
              <button onClick={() => recordBall('RUN_OUT')} className="bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-colors">Run Out</button>
            </div>

            {/* Ball-by-ball Log and Undo */}
            <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl shadow-sm border overflow-hidden`}>
              <div className={`px-4 py-3 border-b flex items-center justify-between ${isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2">
                  <History className={`w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <span className={`text-xs font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Recent History</span>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={undoLastBall} 
                    className="text-[10px] flex items-center gap-1 text-orange-500 font-bold hover:underline transition-all active:scale-90"
                    title="Undo Last Ball"
                  >
                    <Undo2 className="w-3 h-3" /> UNDO
                  </button>
                  <button onClick={exportToCSV} className="text-[10px] flex items-center gap-1 text-indigo-500 font-bold hover:underline">
                    <Download className="w-3 h-3" /> EXPORT
                  </button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {currentInnings.history.map((ball, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 border-b last:border-0 ${isDarkMode ? 'border-slate-800 hover:bg-slate-800/30' : 'border-slate-50 hover:bg-slate-50'}`}>
                    <span className={`text-xs font-mono ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Over {ball.over}.{ball.ballInOver}</span>
                    <span className={`text-sm font-black ${ball.isWicket ? 'text-red-500' : isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{ball.label}</span>
                  </div>
                ))}
                {currentInnings.history.length === 0 && <div className={`p-8 text-center italic text-sm ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>Waiting for the toss...</div>}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-xl mx-auto px-4 text-center mt-6">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border text-[10px] font-medium ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          Tip: You can undo actions even across innings transitions.
        </div>
      </footer>
    </div>
  );
};

export default App;