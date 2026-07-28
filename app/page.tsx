'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, Shield, Sword, ShieldAlert, Play, Plus, 
  Trash, Swords, User, Users, RefreshCw, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_FACTIONS } from './data/default-factions';
import { Faction, GameState, UnitState } from './types';

const getPhaseLabel = (phase: string, appliedPhase?: string) => {
  if (phase === 'passive') {
    if (appliedPhase) {
      return `Passive (In: ${appliedPhase})`;
    }
    return 'Passive (Always Active)';
  }
  return phase;
};

export default function HomePage() {
  const router = useRouter();

  // Factions list (default + custom from localStorage)
  const [factions, setFactions] = useState<Faction[]>(DEFAULT_FACTIONS);
  const [hasActiveGame, setHasActiveGame] = useState(false);

  // Single Player (User) Choices
  const [factionId, setFactionId] = useState('');
  const [traitId, setTraitId] = useState('');
  const [regimentId, setRegimentId] = useState('');
  const [enhancementId, setEnhancementId] = useState('');

  // First Turn Choice
  const [firstPlayer, setFirstPlayer] = useState<'me' | 'opponent'>('me');
  const [unitCounts, setUnitCounts] = useState<{ [unitId: string]: number }>({});
  
  // Custom non-blocking modal states
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4000);
  };

  // Load factions and active game on mount
  useEffect(() => {
    const savedFactionsStr = localStorage.getItem('custom_factions');
    if (savedFactionsStr) {
      try {
        const customFactions: Faction[] = JSON.parse(savedFactionsStr);
        setFactions([...DEFAULT_FACTIONS, ...customFactions]);
      } catch (err) {
        console.error('Failed to parse custom factions from storage:', err);
      }
    }

    const activeGame = localStorage.getItem('active_spearhead_game');
    if (activeGame) {
      setHasActiveGame(true);
    }
  }, []);

  const faction = factions.find(f => f.id === factionId);

  useEffect(() => {
    if (faction) {
      setTraitId('all');
      setRegimentId(faction.regimentAbilities[0]?.id || '');
      setEnhancementId(faction.enhancements[0]?.id || '');

      const counts: { [unitId: string]: number } = {};
      faction.units.forEach(u => {
        counts[u.id] = 1;
      });
      setUnitCounts(counts);
    } else {
      setTraitId('');
      setRegimentId('');
      setEnhancementId('');
      setUnitCounts({});
    }
  }, [factionId, factions, faction]);

  // Clean custom factions
  const handleClearCustomFactions = () => {
    setConfirmModal({
      message: 'Are you sure you want to delete all uploaded/custom factions? This cannot be undone.',
      onConfirm: () => {
        localStorage.removeItem('custom_factions');
        setFactions(DEFAULT_FACTIONS);
        setFactionId('');
        showToast('All custom factions deleted successfully!');
      }
    });
  };

  // Start new match
  const handleStartGame = () => {
    if (!faction) {
      showToast('Please select your faction.', 'error');
      return;
    }

    // Build UnitState array for our units supporting duplicate instances and model counts
    const unitStates: UnitState[] = [];
    faction.units.forEach(unit => {
      const count = unitCounts[unit.id] || 0;
      for (let i = 0; i < count; i++) {
        unitStates.push({
          id: `${unit.id}-${i}-${Date.now()}`, // unique ID across matches
          unitId: unit.id,
          currentWounds: 0,
          isSlain: false,
          modelsCount: unit.models ?? 1,
          maxModels: unit.models ?? 1,
          moved: false,
          ran: false,
          retreated: false,
          shot: false,
          charged: false,
          fought: false,
        });
      }
    });

    if (unitStates.length === 0) {
      showToast('Your starting army roster must contain at least 1 unit.', 'error');
      return;
    }

    // Create full simplified GameState
    const initialGameState: GameState = {
      round: 1,
      activeTurn: firstPlayer,
      currentPhase: 'start',
      factionId: faction.id,
      selectedBattleTraitId: traitId,
      selectedRegimentAbilityId: regimentId,
      selectedEnhancementId: enhancementId,
      units: unitStates,
      victoryPoints: 0,
      usedAbilities: {},
      logs: [`Match initialized! Playing as ${faction.name}. Turn 1 goes to ${firstPlayer === 'me' ? 'Player (Me)' : 'Opponent'}`],
    };

    localStorage.setItem('active_spearhead_game', JSON.stringify(initialGameState));
    router.push('/tracker');
  };

  const handleResumeGame = () => {
    router.push('/tracker');
  };

  return (
    <div className="min-h-screen bg-[#11141A] text-gray-100 flex flex-col font-sans">
      
      {/* Hero Header Banner */}
      <header className="relative overflow-hidden bg-[#151923] border-b border-[#222834] py-16 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_70%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-500 text-xs font-bold mb-4 animate-pulse uppercase tracking-wider">
            <Swords className="h-3.5 w-3.5" /> Spearhead Solo Companion v2.0
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
            SPEARHEAD HELPER
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
            Your personal tabletop game companion. Select your faction, track your wounds, and trigger your rules & reactive abilities at the perfect moments.
          </p>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl space-y-10">

        {/* Active Game Resume Card */}
        <Card className="border-[#222834] bg-gradient-to-br from-[#151923] to-[#1c2230] text-white flex flex-col justify-between shadow-xl">
          <CardHeader>
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 w-fit mb-2">State Engine</Badge>
            <CardTitle className="text-xl font-bold">Active Battle State</CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              Spearhead helper keeps your active game saved locally in real time.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-xs text-gray-400 leading-relaxed">
              {hasActiveGame 
                ? 'There is an ongoing match saved on your device. You can jump straight back into the current phase and round without losing any progress.'
                : 'No ongoing match detected. Configure your match parameters in the panel below and start your Spearhead battle!'}
            </p>
          </CardContent>
          <CardFooter className="bg-[#0f121a] py-4 border-t border-[#1d222d]">
            {hasActiveGame ? (
              <Button onClick={handleResumeGame} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm">
                <Play className="h-4 w-4 mr-2" /> Resume Saved Match
              </Button>
            ) : (
              <div className="text-xs text-gray-500 text-center w-full font-medium">Configure your army below to start.</div>
            )}
          </CardFooter>
        </Card>

        {/* Quick Match Setup Form */}
        <Card className="border-[#222834] bg-[#151923] text-white shadow-2xl">
          <CardHeader className="border-b border-[#222834] py-6">
            <CardTitle className="text-2xl font-black text-center flex items-center justify-center gap-2">
              <User className="h-6 w-6 text-amber-500" /> Configure Your Army
            </CardTitle>
            <CardDescription className="text-center text-gray-400 text-xs">
              Select your faction, chosen tactics, general enhancements, and configure first-turn priority.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            
            {/* Faction Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Select Your Faction</label>
              <select
                value={factionId}
                onChange={(e) => setFactionId(e.target.value)}
                className="w-full h-11 bg-[#1c2230] border border-[#2c3548] rounded-xl px-3 text-sm focus:border-amber-500 text-white font-medium"
              >
                <option value="">-- Choose Your Faction --</option>
                {factions.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.spearheadName})</option>
                ))}
              </select>
            </div>

            {/* Faction Customizer */}
            {faction && (
              <div className="space-y-4 p-5 bg-[#1c2230] rounded-xl border border-[#2c3548] animate-fadeIn">
                
                {/* Informational Battle Traits (Active Faction Rules) */}
                <div className="space-y-2 p-3 bg-[#151923] rounded-lg border border-[#2c3548]/40">
                  <label className="text-xxs font-black text-amber-500 uppercase flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> Faction Battle Traits (All Active)
                  </label>
                  {faction.battleTraits.length === 0 ? (
                    <p className="text-xxs text-gray-500 italic">No general battle traits defined for this faction.</p>
                  ) : (
                    <div className="space-y-3.5 divide-y divide-[#2c3548]/25">
                      {faction.battleTraits.map((t, idx) => (
                        <div key={t.id} className={idx > 0 ? "pt-3" : ""}>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-extrabold text-white">{t.name}</span>
                            <Badge variant="outline" className="text-[9px] font-bold text-amber-400 border-amber-500/20 bg-amber-500/5 px-2 py-0">
                              {t.timing || 'Passive'}
                            </Badge>
                          </div>
                          <p className="text-xxs text-gray-400 leading-normal whitespace-pre-line">{t.effect}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Regiment Ability */}
                <div className="space-y-1.5">
                  <label className="text-xxs font-black text-amber-500 uppercase flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> Select Regiment Ability
                  </label>
                  <select
                    value={regimentId}
                    onChange={(e) => setRegimentId(e.target.value)}
                    className="w-full h-9 bg-[#151923] border border-[#2c3548] rounded px-2.5 text-xs text-white"
                  >
                    {faction.regimentAbilities.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  {(() => {
                    const r = faction.regimentAbilities.find(r => r.id === regimentId);
                    if (!r) return null;
                    return (
                      <div className="bg-[#121622] border border-[#2c3548]/45 rounded-lg p-3 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#2c3548]/30 pb-1.5">
                          <span className="text-xs font-black text-white">{r.name}</span>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-[8px] leading-none font-bold text-amber-400 border-amber-500/20 bg-amber-500/5 px-1.5 py-0.5">
                              {r.timing || 'Passive'}
                            </Badge>
                            {r.phase && (
                              <Badge variant="outline" className="text-[8px] leading-none font-bold text-cyan-400 border-cyan-500/20 bg-cyan-500/5 px-1.5 py-0.5 uppercase">
                                {getPhaseLabel(r.phase, r.passiveAppliedPhase)}
                              </Badge>
                            )}
                            {r.isDefense && (
                              <Badge variant="outline" className="text-[8px] leading-none font-bold text-rose-400 border-rose-500/20 bg-rose-500/5 px-1.5 py-0.5 uppercase">
                                Defense
                              </Badge>
                            )}
                            {r.once && r.once !== 'none' && (
                              <Badge variant="outline" className="text-[8px] leading-none font-bold text-purple-400 border-purple-500/20 bg-purple-500/5 px-1.5 py-0.5 uppercase">
                                {r.once.replace('-', ' ')}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xxs text-gray-400 leading-normal whitespace-pre-line">{r.effect}</p>
                      </div>
                    );
                  })()}
                </div>

                {/* Enhancement */}
                <div className="space-y-1.5">
                  <label className="text-xxs font-black text-amber-500 uppercase flex items-center gap-1">
                    <Sword className="h-3 w-3" /> Select General Enhancement
                  </label>
                  <select
                    value={enhancementId}
                    onChange={(e) => setEnhancementId(e.target.value)}
                    className="w-full h-9 bg-[#151923] border border-[#2c3548] rounded px-2.5 text-xs text-white"
                  >
                    {faction.enhancements.map(enh => (
                      <option key={enh.id} value={enh.id}>{enh.name}</option>
                    ))}
                  </select>
                  {(() => {
                    const e = faction.enhancements.find(e => e.id === enhancementId);
                    if (!e) return null;
                    return (
                      <div className="bg-[#121622] border border-[#2c3548]/45 rounded-lg p-3 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#2c3548]/30 pb-1.5">
                          <span className="text-xs font-black text-white">{e.name}</span>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-[8px] leading-none font-bold text-amber-400 border-amber-500/20 bg-amber-500/5 px-1.5 py-0.5">
                              {e.timing || 'Passive'}
                            </Badge>
                            {e.phase && (
                              <Badge variant="outline" className="text-[8px] leading-none font-bold text-cyan-400 border-cyan-500/20 bg-cyan-500/5 px-1.5 py-0.5 uppercase">
                                {getPhaseLabel(e.phase, e.passiveAppliedPhase)}
                              </Badge>
                            )}
                            {e.isDefense && (
                              <Badge variant="outline" className="text-[8px] leading-none font-bold text-rose-400 border-rose-500/20 bg-rose-500/5 px-1.5 py-0.5 uppercase">
                                Defense
                              </Badge>
                            )}
                            {e.once && e.once !== 'none' && (
                              <Badge variant="outline" className="text-[8px] leading-none font-bold text-purple-400 border-purple-500/20 bg-purple-500/5 px-1.5 py-0.5 uppercase">
                                {e.once.replace('-', ' ')}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xxs text-gray-400 leading-normal whitespace-pre-line">{e.effect}</p>
                      </div>
                    );
                  })()}
                </div>

                {/* Starting Army Units Configurator */}
                <div className="space-y-3 pt-4 border-t border-[#2c3548]/40">
                  <label className="text-xxs font-black text-amber-500 uppercase flex items-center gap-1">
                    <Swords className="h-3 w-3" /> Starting Army Units (Adjust duplicates if needed)
                  </label>
                  <div className="space-y-2">
                    {faction.units.map(unit => {
                      const count = unitCounts[unit.id] || 0;
                      return (
                        <div key={unit.id} className="flex justify-between items-center p-3 bg-[#151923] rounded-lg border border-[#2c3548]/40 hover:border-[#2c3548] transition-all">
                          <div>
                            <p className="text-xs font-black text-white">{unit.name}</p>
                            <p className="text-[10px] text-gray-400">
                              Move: {unit.move}" • Save: {unit.save}+ • HP: {unit.health} {unit.ward > 0 ? `• Ward: ${unit.ward}+` : ''} • Models: {unit.models ?? 1}
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                setUnitCounts({
                                  ...unitCounts,
                                  [unit.id]: Math.max(0, count - 1)
                                });
                              }}
                              className="h-7 w-7 bg-[#1c2230] hover:bg-[#2c3548] border border-[#2c3548] rounded text-gray-400 hover:text-white font-extrabold flex items-center justify-center text-sm transition-all"
                            >
                              -
                            </button>
                            <span className="text-xs font-black text-white min-w-[1.25rem] text-center">{count}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setUnitCounts({
                                  ...unitCounts,
                                  [unit.id]: count + 1
                                });
                              }}
                              className="h-7 w-7 bg-[#1c2230] hover:bg-[#2c3548] border border-[#2c3548] rounded text-gray-400 hover:text-white font-extrabold flex items-center justify-center text-sm transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* Who Goes First Selector */}
            {faction && (
              <div className="border-t border-[#222834] pt-6 flex flex-col items-center space-y-4">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Choose First Turn Active Player (Round 1)</label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={firstPlayer === 'me' ? 'default' : 'outline'}
                    onClick={() => setFirstPlayer('me')}
                    className={`h-11 px-6 font-bold text-xs rounded-xl
                      ${firstPlayer === 'me' 
                        ? 'bg-amber-500 text-white hover:bg-amber-600' 
                        : 'border-[#2c3548] text-gray-300 hover:bg-[#1c2230]'}`}
                  >
                    <User className="h-4 w-4 mr-2" /> Me First
                  </Button>
                  <Button
                    type="button"
                    variant={firstPlayer === 'opponent' ? 'default' : 'outline'}
                    onClick={() => setFirstPlayer('opponent')}
                    className={`h-11 px-6 font-bold text-xs rounded-xl
                      ${firstPlayer === 'opponent' 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'border-[#2c3548] text-gray-300 hover:bg-[#1c2230]'}`}
                  >
                    <Users className="h-4 w-4 mr-2" /> Opponent First
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
          
          <CardFooter className="bg-[#0f121a] py-6 border-t border-[#222834] p-8 flex justify-center">
            <Button
              onClick={handleStartGame}
              disabled={!faction}
              className={`w-full max-w-md h-12 rounded-xl text-base font-black uppercase tracking-wider shadow-lg transition-all duration-300
                ${faction 
                  ? 'bg-gradient-to-r from-[#ca8a04] to-amber-500 hover:scale-103 hover:shadow-amber-500/10 text-white' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed border-transparent'}`}
            >
              <Swords className="h-5 w-5 mr-2 animate-bounce" />
              Begin Spearhead Match
            </Button>
          </CardFooter>
        </Card>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#222834] bg-[#0d1017] py-6 text-center text-xs text-gray-500 mt-auto">
        © {new Date().getFullYear()} Spearhead Rules Tracker • Solo Tabletop Companion
      </footer>

      {toast && (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-sm z-50 animate-bounce-in">
          <div className={`p-4 rounded-xl shadow-2xl border flex items-center justify-between gap-3 ${
            toast.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-200' : 'bg-zinc-900/95 border-amber-500/30 text-amber-200'
          }`}>
            <span className="text-xs font-bold leading-normal">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-xs font-black hover:text-white shrink-0">✕</button>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-[#0d1017]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#151923] border border-[#222834] rounded-xl max-w-sm w-full p-6 space-y-6 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-500" /> Are you sure?
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setConfirmModal(null)} 
                className="border-[#2c3548] text-gray-300 text-xs"
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }} 
                className="bg-red-600 hover:bg-red-700 text-white text-xs border-transparent"
              >
                Yes, Proceed
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}