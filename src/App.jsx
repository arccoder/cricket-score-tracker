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
  Keyboard
} from 'lucide-react';

/**
 * Advanced Cricket Score Tracking Application
 * - Custom runs (text input) for rare scenarios
 * - CSV Export functionality for match logs
 * - Complex scoring: Extras + Runs + Run Outs
 * - Multi-player/Overs setup
 */

const App = () => {
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

  // CSV Export Logic
  const exportToCSV = () => {
    const allHistory = [...innings[0].history.map(h => ({ ...h, team: innings[0].team, inn: 1 })), 
                        ...innings[1].history.map(h => ({ ...h, team: innings[1].team, inn: 2 }))];
    
    if (allHistory.length === 0) return;

    const headers = ["Innings", "Team", "Over", "Ball", "Result", "Total Runs", "Is Wicket"];
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

    // Use custom input if active, otherwise use preset runs
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

    target.runs += runChange;
    target.wickets += wicketChange;
    target.deliveries += ballIncrement;
    target.extras += extraChange;
    
    target.history = [
      {
        ballNum: target.deliveries,
        label: eventLabel,
        runs: runChange,
        isWicket: wicketChange > 0,
        over: Math.floor(target.deliveries / 6),
        ballInOver: (target.deliveries % 6) || 6
      },
      ...target.history
    ];

    updatedInnings[currentInningsIdx] = target;
    setInnings(updatedInnings);
    
    // Reset UI states
    setSelectedRuns(0);
    setCustomRunInput('');
    setShowCustomInput(false);

    // Innings completion check
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

  const startGame = () => {
    setInnings([
      { team: teamNames.team1, runs: 0, wickets: 0, deliveries: 0, extras: 0, history: [] },
      { team: teamNames.team2, runs: 0, wickets: 0, deliveries: 0, extras: 0, history: [] }
    ]);
    setGameState('innings1');
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
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-12">
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-20 shadow-lg">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-400 w-6 h-6" />
            <h1 className="font-bold text-lg uppercase tracking-tight">Cricket Master</h1>
          </div>
          {gameState !== 'setup' && (
            <div className="flex gap-3">
              <button onClick={exportToCSV} className="text-slate-400 hover:text-white" title="Export CSV">
                <Download className="w-5 h-5" />
              </button>
              <button onClick={() => setGameState('setup')} className="text-slate-400 hover:text-white">
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4">
        {gameState === 'setup' ? (
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="text-indigo-500" />
              <h2 className="text-xl font-bold">Game Configuration</h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Team 1</label>
                  <input className="w-full p-3 bg-slate-50 border rounded-xl" value={teamNames.team1} onChange={e => setTeamNames({...teamNames, team1: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Team 2</label>
                  <input className="w-full p-3 bg-slate-50 border rounded-xl" value={teamNames.team2} onChange={e => setTeamNames({...teamNames, team2: e.target.value})} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-600">Match Overs</label>
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">{totalOvers}</span>
                </div>
                <input type="range" min="1" max="50" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" value={totalOvers} onChange={e => setTotalOvers(parseInt(e.target.value))} />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-600">Players per Team</label>
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">{totalPlayers}</span>
                </div>
                <input type="range" min="2" max="11" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" value={totalPlayers} onChange={e => setTotalPlayers(parseInt(e.target.value))} />
              </div>

              <button onClick={startGame} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform">
                Let's Play
              </button>
            </div>
          </div>
        ) : gameState === 'finished' ? (
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center border-t-8 border-indigo-500">
            <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2">Match Complete</h2>
            <div className="bg-indigo-50 text-indigo-700 py-4 px-6 rounded-2xl text-xl font-bold mb-8">{getMatchResult()}</div>
            <button onClick={exportToCSV} className="w-full mb-3 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl border border-slate-200"><Download className="w-4 h-4"/> Export Full Log</button>
            <button onClick={() => setGameState('setup')} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl">New Match</button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Scorecard */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-800 text-white p-3 flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                <span>{currentInnings.team} Innings</span>
                <span>{gameState === 'innings1' ? 'First Innings' : 'Second Innings'}</span>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-5xl font-black text-slate-800">
                      {currentInnings.runs} <span className="text-2xl text-slate-300 font-medium">/ {currentInnings.wickets}</span>
                    </div>
                    <div className="text-slate-500 font-bold mt-1">
                      Overs: {formatOvers(currentInnings.deliveries)} <span className="font-normal text-slate-400">/ {totalOvers}</span>
                    </div>
                  </div>
                  {currentInningsIdx === 1 && (
                    <div className="text-right bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase">Target</p>
                      <p className="text-xl font-black text-indigo-700">{innings[0].runs + 1}</p>
                      <p className="text-[10px] text-indigo-600 font-medium italic">Need {innings[0].runs + 1 - currentInnings.runs} in {totalOvers * 6 - currentInnings.deliveries} balls</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Run Selection Row */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center px-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Runs Scored on this ball</p>
                <button 
                  onClick={() => setShowCustomInput(!showCustomInput)} 
                  className={`text-[10px] font-bold px-2 py-1 rounded ${showCustomInput ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                  {showCustomInput ? 'Back to presets' : 'Enter custom runs'}
                </button>
              </div>

              {!showCustomInput ? (
                <div className="flex justify-between gap-1">
                  {[0, 1, 2, 3, 4, 6].map(num => (
                    <button key={num} onClick={() => setSelectedRuns(num)} className={`flex-1 py-3 rounded-xl font-black transition-all ${selectedRuns === num ? 'bg-indigo-600 text-white shadow-md scale-105' : 'bg-slate-50 text-slate-400'}`}>
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
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl font-bold"
                      value={customRunInput}
                      onChange={e => setCustomRunInput(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => recordBall('LEGAL')} className="bg-emerald-600 text-white py-6 rounded-2xl font-black text-xl shadow-lg active:scale-95">RECORD BALL</button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => recordBall('WIDE')} className="bg-amber-500 text-white rounded-xl font-bold text-xs">WIDE</button>
                <button onClick={() => recordBall('NO_BALL')} className="bg-amber-500 text-white rounded-xl font-bold text-xs">NO-BALL</button>
                <button onClick={() => recordBall('BYE')} className="bg-slate-400 text-white rounded-xl font-bold text-xs">BYES</button>
                <button onClick={() => recordBall('LEG_BYE')} className="bg-slate-400 text-white rounded-xl font-bold text-xs">LEG BYE</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => recordBall('WICKET')} className="bg-red-600 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95">Out (Bowled/Caught)</button>
              <button onClick={() => recordBall('RUN_OUT')} className="bg-orange-600 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95">Run Out</button>
            </div>

            {/* Ball-by-ball Log */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600 uppercase">Recent History</span>
                </div>
                <button onClick={exportToCSV} className="text-[10px] flex items-center gap-1 text-indigo-500 font-bold hover:underline">
                  <Download className="w-3 h-3" /> Export CSV
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {currentInnings.history.map((ball, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <span className="text-xs font-mono text-slate-400">Over {ball.over}.{ball.ballInOver}</span>
                    <span className={`text-sm font-black ${ball.isWicket ? 'text-red-500' : 'text-slate-700'}`}>{ball.label}</span>
                  </div>
                ))}
                {currentInnings.history.length === 0 && <div className="p-8 text-center text-slate-300 italic text-sm">Waiting for the toss...</div>}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 text-[10px] text-slate-400 font-medium">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          Tip: Use the "Custom runs" toggle for rare high-scoring balls.
        </div>
      </footer>
    </div>
  );
};

export default App;