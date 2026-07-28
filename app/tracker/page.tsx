'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, RefreshCw, Swords, Shield, Heart, Trophy, 
  ChevronRight, ChevronLeft, Award, Play, AlertTriangle, 
  Activity, Sparkles, ScrollText, User, UserCheck, ShieldAlert, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DEFAULT_FACTIONS } from '../data/default-factions';
import { GameState, Faction, Unit, GamePhase, Weapon, Ability, UnitState } from '../types';

export default function TrackerPage() {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [factions, setFactions] = useState<Faction[]>(DEFAULT_FACTIONS);
  const [activeTab, setActiveTab] = useState<'tracker' | 'roster' | 'traits' | 'logs'>('tracker');
  const [turnScoredVPs, setTurnScoredVPs] = useState(0);

  // Custom non-blocking modal states
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4000);
  };

  // Load game from localStorage on mount
  useEffect(() => {
    const savedFactionsStr = localStorage.getItem('custom_factions');
    if (savedFactionsStr) {
      try {
        const customFactions = JSON.parse(savedFactionsStr);
        setFactions([...DEFAULT_FACTIONS, ...customFactions]);
      } catch (e) {
        console.error('Failed to parse custom factions', e);
      }
    }

    const savedGameStr = localStorage.getItem('active_spearhead_game');
    if (savedGameStr) {
      try {
        const parsedGame: GameState = JSON.parse(savedGameStr);
        setGameState(parsedGame);
      } catch (e) {
        console.error('Failed to parse active game', e);
      }
    }
  }, []);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#11141A] text-gray-100 flex flex-col items-center justify-center p-4">
        <Card className="border-[#222834] bg-[#151923] text-white p-6 max-w-sm text-center">
          <CardHeader>
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
            <CardTitle>No Active Game</CardTitle>
            <CardDescription className="text-gray-400">Please configure and start a match first.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/" className="w-full">
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold">
                Go to Match Setup
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Get full Faction templates for rules reference
  const faction = factions.find(f => f.id === gameState.factionId);

  if (!faction) {
    return <div className="text-white p-8">Faction not found. Reset match in setup.</div>;
  }

  const phases: { id: GamePhase; name: string; color: string }[] = [
    { id: 'start', name: 'Start of Turn', color: 'bg-zinc-700 border-zinc-500' },
    { id: 'hero', name: 'Hero Phase', color: 'bg-yellow-600 border-yellow-400' },
    { id: 'movement', name: 'Movement', color: 'bg-blue-600 border-blue-400' },
    { id: 'shooting', name: 'Shooting', color: 'bg-emerald-700 border-emerald-500' },
    { id: 'charge', name: 'Charge', color: 'bg-orange-600 border-orange-400' },
    { id: 'combat', name: 'Combat Phase', color: 'bg-rose-700 border-rose-500' },
    { id: 'end', name: 'End of Turn', color: 'bg-purple-600 border-purple-400' }
  ];

  const currentPhaseIndex = phases.findIndex(p => p.id === gameState.currentPhase);

  // Helper to save state
  const saveGame = (newState: GameState) => {
    setGameState(newState);
    localStorage.setItem('active_spearhead_game', JSON.stringify(newState));
  };

  // VP tracking
  const updateVP = (amount: number) => {
    const updated = { ...gameState };
    updated.victoryPoints = Math.max(0, updated.victoryPoints + amount);
    updated.logs.unshift(`[Round ${gameState.round}] Victory Points adjusted by ${amount > 0 ? '+' : ''}${amount}. Total: ${updated.victoryPoints} VPs`);
    saveGame(updated);
  };

  // Slain / Wound / Models tracking by unique instance ID
  const adjustWoundsById = (unitInstanceId: string, amount: number) => {
    const updated = { ...gameState };
    const uState = updated.units.find(u => u.id === unitInstanceId);
    if (!uState) return;
    const uRules = faction.units.find(u => u.id === uState.unitId);
    if (!uRules) return;

    // Ensure models properties are initialized
    const maxModels = uState.maxModels ?? uRules.models ?? 1;
    if (uState.maxModels === undefined) uState.maxModels = maxModels;
    if (uState.modelsCount === undefined) uState.modelsCount = maxModels;

    if (amount > 0) {
      // Inflicting damage
      if (uState.isSlain || uState.modelsCount === 0) return;
      uState.currentWounds += 1;
      if (uState.currentWounds >= uRules.health) {
        uState.modelsCount = Math.max(0, uState.modelsCount - 1);
        if (uState.modelsCount === 0) {
          uState.isSlain = true;
          uState.currentWounds = uRules.health;
          updated.logs.unshift(`💀 Your ${uRules.name} was SLAIN!`);
        } else {
          uState.currentWounds = 0;
          updated.logs.unshift(`💥 A model in your ${uRules.name} unit was removed! (${uState.modelsCount} remaining)`);
        }
      } else {
        updated.logs.unshift(`💢 Healed 0 wounds / Inflicted 1 damage on your ${uRules.name} unit.`);
      }
    } else if (amount < 0) {
      // Healing damage
      if (uState.isSlain) {
        // Revive unit with 1 model and 0 wounds
        uState.isSlain = false;
        uState.modelsCount = 1;
        uState.currentWounds = 0;
        updated.logs.unshift(`💖 Your ${uRules.name} unit was revived with 1 model!`);
      } else {
        if (uState.currentWounds > 0) {
          uState.currentWounds -= 1;
          updated.logs.unshift(`💚 Healed 1 wound on your ${uRules.name} unit.`);
        } else {
          // If current model has 0 wounds, check if we can restore a slain model
          if (uState.modelsCount < uState.maxModels) {
            uState.modelsCount += 1;
            uState.currentWounds = uRules.health - 1; // starts with 1 HP remaining (i.e. health - 1 wounds allocated)
            updated.logs.unshift(`💖 A model was returned to your ${uRules.name} unit with 1 HP remaining!`);
          }
        }
      }
    }

    saveGame(updated);
  };

  const adjustModelsById = (unitInstanceId: string, amount: number) => {
    const updated = { ...gameState };
    const uState = updated.units.find(u => u.id === unitInstanceId);
    if (!uState) return;
    const uRules = faction.units.find(u => u.id === uState.unitId);
    if (!uRules) return;

    // Ensure models properties are initialized
    const maxModels = uState.maxModels ?? uRules.models ?? 1;
    if (uState.maxModels === undefined) uState.maxModels = maxModels;
    if (uState.modelsCount === undefined) uState.modelsCount = maxModels;

    if (amount > 0) {
      // Adding a model
      if (uState.modelsCount < uState.maxModels) {
        uState.modelsCount += 1;
        uState.isSlain = false;
        if (uState.modelsCount === 1) {
          uState.currentWounds = 0; // if we brought back from 0 models
        }
        updated.logs.unshift(`💖 Added 1 model to your ${uRules.name} unit. (${uState.modelsCount} / ${uState.maxModels} models)`);
      }
    } else if (amount < 0) {
      // Removing a model
      if (uState.modelsCount > 0) {
        uState.modelsCount -= 1;
        if (uState.modelsCount === 0) {
          uState.isSlain = true;
          uState.currentWounds = uRules.health;
          updated.logs.unshift(`💀 Your ${uRules.name} was SLAIN (0 models remaining).`);
        } else {
          updated.logs.unshift(`💥 Removed 1 model from your ${uRules.name} unit. (${uState.modelsCount} remaining)`);
        }
      }
    }

    saveGame(updated);
  };

  const toggleSlainById = (unitInstanceId: string) => {
    const updated = { ...gameState };
    const uState = updated.units.find(u => u.id === unitInstanceId);
    if (!uState) return;
    const uRules = faction.units.find(u => u.id === uState.unitId);
    if (!uRules) return;

    // Ensure models properties are initialized
    const maxModels = uState.maxModels ?? uRules.models ?? 1;
    if (uState.maxModels === undefined) uState.maxModels = maxModels;

    uState.isSlain = !uState.isSlain;
    if (uState.isSlain) {
      uState.modelsCount = 0;
      uState.currentWounds = uRules.health;
      updated.logs.unshift(`💀 Your ${uRules.name} marked as SLAIN.`);
    } else {
      uState.modelsCount = uState.maxModels;
      uState.currentWounds = 0;
      updated.logs.unshift(`💖 Your ${uRules.name} brought back to life.`);
    }
    saveGame(updated);
  };

  // Toggle unit state flag by unique instance ID
  const toggleUnitStateFlag = (unitInstanceId: string, flag: 'moved' | 'ran' | 'retreated' | 'shot' | 'charged' | 'fought') => {
    const updated = { ...gameState };
    const uState = updated.units.find(u => u.id === unitInstanceId);
    if (!uState) return;
    const uRules = faction.units.find(u => u.id === uState.unitId);
    if (!uRules) return;

    uState[flag] = !uState[flag];
    
    // Mutually exclusive flags
    if (flag === 'moved' && uState.moved) {
      uState.ran = false;
      uState.retreated = false;
    } else if (flag === 'ran' && uState.ran) {
      uState.moved = false;
      uState.retreated = false;
    } else if (flag === 'retreated' && uState.retreated) {
      uState.moved = false;
      uState.ran = false;
    }

    updated.logs.unshift(`[${phases[currentPhaseIndex].name}] ${uRules.name} marked: ${flag.toUpperCase()}`);
    saveGame(updated);
  };

  // Ability Use Tracking
  const toggleAbilityUsed = (abilityId: string, abilityName: string) => {
    const updated = { ...gameState };
    const wasUsed = !!updated.usedAbilities[abilityId];
    updated.usedAbilities[abilityId] = !wasUsed;

    updated.logs.unshift(`⚡ Triggered ability: "${abilityName}"`);
    saveGame(updated);
  };

  // Switch Turn Priority (Me <-> Opponent)
  const toggleActiveTurn = () => {
    const updated = { ...gameState };
    const nextTurn = updated.activeTurn === 'me' ? 'opponent' : 'me';
    updated.activeTurn = nextTurn;
    updated.logs.unshift(`🔄 Switched turn priority: Now standard ${nextTurn === 'me' ? 'My Turn' : "Opponent's Turn"}`);
    saveGame(updated);
  };

  // Step Phases
  const handlePrevPhase = () => {
    if (currentPhaseIndex > 0) {
      const updated = { ...gameState };
      updated.currentPhase = phases[currentPhaseIndex - 1].id;
      saveGame(updated);
    }
  };

  const handleNextPhase = () => {
    if (!gameState) return;
    const updated = { ...gameState };
    
    if (currentPhaseIndex < phases.length - 1) {
      // Step to next phase in current turn
      updated.currentPhase = phases[currentPhaseIndex + 1].id;
      saveGame(updated);
    } else {
      // End of "End" phase -> transition turn
      updated.victoryPoints = Math.max(0, updated.victoryPoints + turnScoredVPs);
      updated.logs.unshift(`[Round ${gameState.round}] Scored +${turnScoredVPs} Victory Points. Total score is now ${updated.victoryPoints} VPs.`);
      
      // Pass the updated game state containing the new VPs to handleEndTurn
      handleEndTurn(updated);
      setTurnScoredVPs(0); // reset the turn counter
    }
  };

  // Transition turn and round
  const handleEndTurn = (stateToUse?: GameState) => {
    if (!gameState) return;
    const updated = stateToUse || { ...gameState };
    const lastTurn = updated.activeTurn;
    
    // Toggle active turn
    updated.activeTurn = lastTurn === 'me' ? 'opponent' : 'me';
    updated.currentPhase = 'start'; // back to start

    updated.logs.unshift(`⚔️ Finished turn for ${lastTurn === 'me' ? 'Me' : 'Opponent'}.`);

    // Increment round if switching back to the player who had priority
    if (lastTurn === 'opponent') {
      if (updated.round < 4) {
        updated.round += 1;
        updated.logs.unshift(`🌟 --- START OF BATTLE ROUND ${updated.round} --- 🌟`);
      } else {
        updated.logs.unshift(`🏆 --- GAME OVER (4 Rounds completed) --- 🏆`);
        showToast('All 4 Battle Rounds are completed! Final score: ' + updated.victoryPoints + ' VPs', 'success');
      }
    }

    // Reset temporary phase action states for our units
    updated.units.forEach(u => {
      u.moved = false; u.ran = false; u.retreated = false;
      u.shot = false; u.charged = false; u.fought = false;
    });

    // Reset once-per-turn abilities
    Object.keys(updated.usedAbilities).forEach(key => {
      let isOncePerTurn = true;
      const traitAb = faction.battleTraits.find(a => a.id === key);
      const regAb = faction.regimentAbilities.find(a => a.id === key);
      const enhAb = faction.enhancements.find(a => a.id === key);
      
      const foundAb = traitAb || regAb || enhAb;
      if (foundAb && foundAb.once === 'once-per-battle') {
        isOncePerTurn = false;
      }
      
      if (isOncePerTurn) {
        delete updated.usedAbilities[key];
      }
    });

    updated.logs.unshift(`⚔️ Began turn for ${updated.activeTurn === 'me' ? 'Me' : 'Opponent'} (${faction.name}).`);
    saveGame(updated);
  };

  const handleResetGame = () => {
    setConfirmModal({
      message: 'Are you sure you want to RESET this match? All scores, wounds, and logs will be lost.',
      onConfirm: () => {
        localStorage.removeItem('active_spearhead_game');
        router.push('/');
      }
    });
  };

  // Extract phase-specific abilities for reference
  const getAbilitiesForPhase = (phase: string): Ability[] => {
    const list: Ability[] = [];
    // Selected Battle Trait(s)
    if (gameState.selectedBattleTraitId === 'all') {
      faction.battleTraits.forEach(t => {
        if (t.phase === phase) list.push(t);
      });
    } else {
      const trait = faction.battleTraits.find(t => t.id === gameState.selectedBattleTraitId);
      if (trait && trait.phase === phase) list.push(trait);
    }

    // Selected Regiment
    const regiment = faction.regimentAbilities.find(r => r.id === gameState.selectedRegimentAbilityId);
    if (regiment && regiment.phase === phase) list.push(regiment);

    // Selected Enhancement
    const enhancement = faction.enhancements.find(e => e.id === gameState.selectedEnhancementId);
    if (enhancement && enhancement.phase === phase) list.push(enhancement);

    return list;
  };

  // Get active phase abilities on our Units
  const getUnitAbilitiesForPhase = (unit: Unit, phase: string): Ability[] => {
    return unit.abilities.filter(a => a.phase === phase);
  };

  // Get passive abilities (faction-wide) that are applied to the active phase
  const getPassiveAbilitiesForPhase = (phase: string): Ability[] => {
    if (!gameState) return [];
    const list: Ability[] = [];
    
    // Faction-wide passives
    if (gameState.selectedBattleTraitId === 'all') {
      faction.battleTraits.forEach(t => {
        if (t.phase === 'passive' && t.passiveAppliedPhase === phase) {
          list.push(t);
        }
      });
    } else {
      const trait = faction.battleTraits.find(t => t.id === gameState.selectedBattleTraitId);
      if (trait && trait.phase === 'passive' && trait.passiveAppliedPhase === phase) {
        list.push(trait);
      }
    }

    const regiment = faction.regimentAbilities.find(r => r.id === gameState.selectedRegimentAbilityId);
    if (regiment && regiment.phase === 'passive' && regiment.passiveAppliedPhase === phase) {
      list.push(regiment);
    }

    const enhancement = faction.enhancements.find(e => e.id === gameState.selectedEnhancementId);
    if (enhancement && enhancement.phase === 'passive' && enhancement.passiveAppliedPhase === phase) {
      list.push(enhancement);
    }

    return list;
  };

  // Get passive abilities on a specific unit that apply to the current active phase
  const getUnitPassiveAbilitiesForPhase = (unit: Unit, phase: string): Ability[] => {
    return unit.abilities.filter(a => a.phase === 'passive' && a.passiveAppliedPhase === phase);
  };

  return (
    <div className="min-h-screen bg-[#0d1015] text-gray-100 flex flex-col font-sans">
      
      {/* Sticky Top Header Panel */}
      <div className="bg-[#151923] border-b border-[#222834] sticky top-0 z-30 shadow-md">
        
        {/* Game Stats Bar */}
        <div className="container mx-auto px-4 py-3 flex justify-between items-center gap-4 border-b border-[#1d222d] text-xs">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={handleResetGame} className="text-gray-400 hover:text-red-400 p-1">
              <ArrowLeft className="h-4 w-4" /> Exit
            </Button>
            <Badge variant="outline" className="border-amber-500/20 text-amber-500 font-black">
              ROUND {gameState.round}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-[#1c2230] rounded-lg border border-[#2c3548]">
              <button onClick={() => updateVP(-1)} className="px-2.5 py-1 hover:bg-[#2c3548] text-gray-400 font-bold">-</button>
              <span className="px-3.5 py-1 font-black text-sm text-white">{gameState.victoryPoints} VP</span>
              <button onClick={() => updateVP(1)} className="px-2.5 py-1 hover:bg-[#2c3548] text-gray-400 font-bold">+</button>
            </div>
          </div>
        </div>

        {/* Turn Active Header */}
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`h-4 w-4 rounded-full animate-pulse
              ${gameState.activeTurn === 'me' ? 'bg-amber-500' : 'bg-red-500'}`} 
            />
            <div>
              <span className="text-xxs font-black text-gray-400 uppercase tracking-wider block">ACTIVE TURN PRIORITY</span>
              <h2 className="text-lg font-black text-white leading-tight flex items-center gap-2">
                {gameState.activeTurn === 'me' ? (
                  <span className="text-amber-500 font-extrabold uppercase tracking-wide">MY TURN</span>
                ) : (
                  <span className="text-red-400 font-extrabold uppercase tracking-wide">OPPONENT'S TURN</span>
                )}
                <span className="text-xs text-gray-500">({faction.name})</span>
              </h2>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleActiveTurn}
              className="border-[#2c3548] text-gray-400 h-7 px-2 py-0 text-xxs font-bold"
            >
              Toggle
            </Button>
          </div>

          {/* Previous / Next buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={handlePrevPhase} 
              disabled={currentPhaseIndex === 0}
              className="border-[#2c3548] text-gray-300 hover:bg-[#222834] flex-1 sm:flex-none font-bold text-xs h-10 px-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev Phase
            </Button>
            
            <Button 
              onClick={handleNextPhase} 
              className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs h-10 px-5 shadow-md flex-1 sm:flex-none gap-1"
            >
              {gameState.currentPhase === 'end' ? 'End Turn' : 'Next Phase'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Phase Timeline Slider */}
        <div className="overflow-x-auto border-t border-[#1d222d] bg-[#11141c] py-2">
          <div className="container mx-auto px-4 flex gap-2 min-w-[650px]">
            {phases.map((p, idx) => {
              const isCurrent = p.id === gameState.currentPhase;
              const isPassed = idx < currentPhaseIndex;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    const updated = { ...gameState };
                    updated.currentPhase = p.id;
                    saveGame(updated);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xxs font-black uppercase text-center border transition-all duration-300
                    ${isCurrent 
                      ? `${p.color} text-white shadow-md scale-102 font-black border-2` 
                      : isPassed
                        ? 'border-transparent text-gray-500 bg-[#181d29]/40'
                        : 'border-[#222834] text-gray-400 hover:border-gray-500 bg-[#151923]/50'}`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Roster & Tracking Selector Bar */}
      <div className="border-b border-[#222834] bg-[#121620]">
        <div className="container mx-auto px-4 flex gap-4 text-xs font-bold">
          <button 
            onClick={() => setActiveTab('tracker')}
            className={`py-3 px-1 border-b-2 transition-all ${activeTab === 'tracker' ? 'border-amber-500 text-amber-500' : 'border-transparent text-gray-400 hover:text-white'}`}
          >
            Tactics Checklist
          </button>
          <button 
            onClick={() => setActiveTab('roster')}
            className={`py-3 px-1 border-b-2 transition-all ${activeTab === 'roster' ? 'border-amber-500 text-amber-500' : 'border-transparent text-gray-400 hover:text-white'}`}
          >
            My Roster & HP
          </button>
          <button 
            onClick={() => setActiveTab('traits')}
            className={`py-3 px-1 border-b-2 transition-all ${activeTab === 'traits' ? 'border-amber-500 text-amber-500' : 'border-transparent text-gray-400 hover:text-white'}`}
          >
            Battle Traits Chart ({faction.battleTraits.length})
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-1 border-b-2 transition-all ${activeTab === 'logs' ? 'border-amber-500 text-amber-500' : 'border-transparent text-gray-400 hover:text-white'}`}
          >
            Action Logs ({gameState.logs.length})
          </button>
        </div>
      </div>

      {/* Main Board Area */}
      <main className="flex-grow container mx-auto px-4 py-6 max-w-5xl">
        
        {/* TAB 1: PHASE TRACKER */}
        {activeTab === 'tracker' && (
          <div className="space-y-6">
            
            {/* Specialized Tactically Interactive Phase Widgets */}

            {/* 🛡️ OPPONENT ATTACK & DEFENSIVE ROSTER DASHBOARD */}
            {gameState.activeTurn === 'opponent' && (
              <Card className="border-[#222834] bg-[#11141c] text-white">
                <CardHeader className="border-b border-[#222834] py-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-rose-400">
                      <Shield className="h-4 w-4" /> My Defensive Roster & Responses
                    </CardTitle>
                    <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xxs px-2 py-0.5 font-bold uppercase animate-pulse">
                      🛡️ Defending
                    </Badge>
                  </div>
                  <CardDescription className="text-xxs text-gray-400">
                    The opponent is attacking! Monitor unit **Save** and **Ward** profiles, toggle defensive abilities, and log model casualties or wounds instantly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-6">
                  
                  {/* Defensive abilities for current phase */}
                  {(() => {
                    // Gather all defensive abilities that are active
                    const defAbilities: { source: string; name: string; timing?: string; effect: string; id: string; key: string }[] = [];
                    
                    // Faction defensive abilities
                    if (gameState.selectedBattleTraitId === 'all') {
                      faction.battleTraits.forEach(a => {
                        if (a.isDefense) defAbilities.push({ source: 'Faction Trait', name: a.name, timing: a.timing, effect: a.effect, id: a.id, key: a.id });
                      });
                    } else {
                      const trait = faction.battleTraits.find(a => a.id === gameState.selectedBattleTraitId);
                      if (trait && trait.isDefense) {
                        defAbilities.push({ source: 'Faction Trait', name: trait.name, timing: trait.timing, effect: trait.effect, id: trait.id, key: trait.id });
                      }
                    }

                    const regiment = faction.regimentAbilities.find(a => a.id === gameState.selectedRegimentAbilityId);
                    if (regiment && regiment.isDefense) {
                      defAbilities.push({ source: 'Regiment', name: regiment.name, timing: regiment.timing, effect: regiment.effect, id: regiment.id, key: regiment.id });
                    }

                    const enhancement = faction.enhancements.find(a => a.id === gameState.selectedEnhancementId);
                    if (enhancement && enhancement.isDefense) {
                      defAbilities.push({ source: 'Enhancement', name: enhancement.name, timing: enhancement.timing, effect: enhancement.effect, id: enhancement.id, key: enhancement.id });
                    }

                    // Unit specific defensive abilities
                    gameState.units.filter(u => !u.isSlain).forEach(u => {
                      const uRules = faction.units.find(r => r.id === u.unitId);
                      if (uRules) {
                        uRules.abilities.forEach(a => {
                          if (a.isDefense) {
                            defAbilities.push({ 
                              source: uRules.name, 
                              name: a.name, 
                              timing: a.timing, 
                              effect: a.effect, 
                              id: a.id,
                              key: `${u.id}-${a.id}`
                            });
                          }
                        });
                      }
                    });

                    if (defAbilities.length === 0) return null;

                    return (
                      <div className="space-y-3">
                        <h4 className="text-xxs font-black text-rose-400 uppercase tracking-widest pb-1.5 border-b border-[#222834]/60">
                          🛡️ Available Defensive Responses:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {defAbilities.map(ab => {
                            const isUsed = !!gameState.usedAbilities[ab.key];
                            return (
                              <Card 
                                key={ab.key} 
                                onClick={() => toggleAbilityUsed(ab.key, `${ab.source}: ${ab.name}`)}
                                className={`cursor-pointer transition-all duration-300 relative overflow-hidden text-white border p-3.5 space-y-1.5
                                  ${isUsed 
                                    ? 'bg-zinc-800/30 border-transparent saturate-0 opacity-40' 
                                    : 'bg-[#151a24] border-rose-500/25 hover:border-rose-500/50 shadow-md shadow-rose-950/5'}`}
                              >
                                <div className="flex justify-between items-start gap-1">
                                  <div>
                                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider block">{ab.source}</span>
                                    <h5 className="text-xs font-bold text-white mt-0.5">{ab.name}</h5>
                                  </div>
                                  <Badge className="bg-rose-500/20 text-rose-400 text-[8px] uppercase shrink-0 font-bold">DEFENSE</Badge>
                                </div>
                                {ab.timing && <p className="text-[10px] text-amber-500/80 font-medium">{ab.timing}</p>}
                                <p className="text-xxs text-gray-300 leading-normal">{ab.effect}</p>
                                {isUsed && (
                                  <div className="absolute inset-0 bg-[#0d1015]/15 flex items-center justify-center">
                                    <span className="text-sm font-black text-rose-500 uppercase rotate-[-8deg] tracking-widest bg-zinc-950/80 px-2 py-0.5 rounded border border-rose-600/40">TRIGGERED</span>
                                  </div>
                                )}
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Defensive Survival profiles grid */}
                  <div className="space-y-3">
                    <h4 className="text-xxs font-black text-gray-400 uppercase tracking-widest pb-1.5 border-b border-[#222834]/60">
                      📋 Active Defender Roster profiles:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gameState.units.filter(u => !u.isSlain).map(u => {
                        const uRules = faction.units.find(r => r.id === u.unitId);
                        if (!uRules) return null;
                        
                        return (
                          <div key={u.id} className="bg-[#1c2230] border border-[#2c3548] p-4 rounded-xl space-y-3 shadow-sm hover:border-[#384358] transition-all">
                            <div className="flex justify-between items-start border-b border-[#2c3548]/40 pb-2">
                              <div>
                                <h5 className="text-xs font-black text-white">{uRules.name}</h5>
                                <div className="flex gap-2 items-center mt-1">
                                  <Badge className="bg-blue-600/15 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase">
                                    SAVE: {uRules.save}+
                                  </Badge>
                                  {uRules.ward > 0 ? (
                                    <Badge className="bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase">
                                      WARD: {uRules.ward}+
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-500 border-gray-800 text-[9px] font-black uppercase">
                                      NO WARD
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-purple-400 border-purple-500/10 bg-purple-500/5 text-[9px] font-bold">
                                    HP/Model: {uRules.health}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Direct HP and Models Casuality Adjusters */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-[#151923]/60 p-2 rounded-xl border border-[#222834]">
                              <div className="flex justify-between items-center gap-2 flex-grow">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Models</span>
                                <div className="flex items-center bg-[#1c2230] rounded border border-[#2c3548] overflow-hidden">
                                  <button
                                    onClick={() => adjustModelsById(u.id, -1)}
                                    className="px-2.5 py-0.5 hover:bg-[#2c3548] text-gray-400 hover:text-red-400 font-extrabold text-xs transition-all"
                                  >
                                    -
                                  </button>
                                  <span className="px-3 font-black text-white text-xs min-w-[2.5rem] text-center">
                                    {u.modelsCount ?? uRules.models ?? 1} / {u.maxModels ?? uRules.models ?? 1}
                                  </span>
                                  <button
                                    onClick={() => adjustModelsById(u.id, 1)}
                                    className="px-2.5 py-0.5 hover:bg-[#2c3548] text-gray-400 hover:text-emerald-400 font-extrabold text-xs transition-all"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              <div className="hidden sm:block h-6 w-px bg-[#2c3548]/40" />

                              <div className="flex justify-between items-center gap-2 flex-grow">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Model HP</span>
                                <div className="flex items-center bg-[#1c2230] rounded border border-[#2c3548] overflow-hidden">
                                  <button
                                    onClick={() => adjustWoundsById(u.id, -1)}
                                    className="px-2.5 py-0.5 hover:bg-[#2c3548] text-gray-400 hover:text-red-400 font-extrabold text-xs transition-all"
                                  >
                                    -
                                  </button>
                                  <span className="px-3 font-black text-white text-xs min-w-[3.5rem] text-center">
                                    {uRules.health - (u.currentWounds || 0)} / {uRules.health} HP
                                  </span>
                                  <button
                                    onClick={() => adjustWoundsById(u.id, 1)}
                                    className="px-2.5 py-0.5 hover:bg-[#2c3548] text-gray-400 hover:text-emerald-400 font-extrabold text-xs transition-all"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* MOVEMENT PHASE WIDGET */}
            {gameState.currentPhase === 'movement' && gameState.activeTurn === 'me' && (
              <Card className="border-[#222834] bg-[#151923] text-white">
                <CardHeader className="border-b border-[#222834] py-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-400">
                    <Activity className="h-4 w-4" /> My Movement Phase Actions
                  </CardTitle>
                  <CardDescription className="text-xxs text-gray-400">
                    Toggle unit movement. Running or retreating disables shooting/charging unless special rules apply.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {gameState.units.filter(u => !u.isSlain).map((u) => {
                    const uRules = faction.units.find(rules => rules.id === u.unitId);
                    if (!uRules) return null;
                    return (
                      <div key={u.id} className="flex justify-between items-center p-3 rounded-lg bg-[#1c2230] border border-[#2c3548]">
                        <div>
                          <h4 className="text-xs font-extrabold text-white">{uRules.name}</h4>
                          <p className="text-xxs text-gray-400">Move: {uRules.move}"</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => toggleUnitStateFlag(u.id, 'moved')}
                            className={`px-2 py-1 rounded text-xxs font-bold transition-all
                              ${u.moved 
                                ? 'bg-blue-600 text-white font-extrabold' 
                                : 'bg-[#151923] text-gray-400 border border-[#2c3548] hover:text-white'}`}
                          >
                            Moved
                          </button>
                          <button
                            onClick={() => toggleUnitStateFlag(u.id, 'ran')}
                            className={`px-2 py-1 rounded text-xxs font-bold transition-all
                              ${u.ran 
                                ? 'bg-amber-600 text-white font-extrabold' 
                                : 'bg-[#151923] text-gray-400 border border-[#2c3548] hover:text-white'}`}
                          >
                            Ran
                          </button>
                          <button
                            onClick={() => toggleUnitStateFlag(u.id, 'retreated')}
                            className={`px-2 py-1 rounded text-xxs font-bold transition-all
                              ${u.retreated 
                                ? 'bg-rose-600 text-white font-extrabold' 
                                : 'bg-[#151923] text-gray-400 border border-[#2c3548] hover:text-white'}`}
                          >
                            Retreated
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* SHOOTING PHASE WIDGET */}
            {gameState.currentPhase === 'shooting' && gameState.activeTurn === 'me' && (
              <Card className="border-[#222834] bg-[#151923] text-white">
                <CardHeader className="border-b border-[#222834] py-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
                    <Swords className="h-4 w-4" /> Ranged Shooting Profiles
                  </CardTitle>
                  <CardDescription className="text-xxs text-gray-400">
                    Verify ranged profiles. Units that ran cannot shoot. Use the checkmark to track who has fired.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {gameState.units.filter(u => !u.isSlain).map((u) => {
                    const uRules = faction.units.find(rules => rules.id === u.unitId);
                    if (!uRules) return null;
                    
                    const rangedWeapons = uRules.weapons.filter(w => w.range !== 'Melee');
                    if (rangedWeapons.length === 0) return null;

                    return (
                      <div key={u.id} className={`p-4 rounded-xl bg-[#1c2230] border border-[#2c3548] space-y-3 transition-all ${u.shot ? 'opacity-45' : ''}`}>
                        <div className="flex justify-between items-center border-b border-[#2c3548]/40 pb-2">
                          <div>
                            <h4 className="text-xs font-black text-white">{uRules.name}</h4>
                            {u.ran && <Badge variant="destructive" className="text-xxs font-bold">RAN (Cannot Shoot)</Badge>}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => toggleUnitStateFlag(u.id, 'shot')}
                            disabled={u.ran}
                            className={`text-xxs font-bold ${u.shot ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#151923] border border-[#2c3548]'}`}
                          >
                            {u.shot ? 'Has Shot' : 'Mark Shot'}
                          </Button>
                        </div>

                        {/* Health and Models Tracker panel inside active card */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-[#151923]/60 p-2 rounded-xl border border-[#222834]">
                          <div className="flex justify-between items-center gap-2 flex-grow">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Models</span>
                            <div className="flex items-center bg-[#1c2230] rounded border border-[#2c3548] overflow-hidden">
                              <button
                                onClick={() => adjustModelsById(u.id, -1)}
                                className="px-2.5 py-0.5 hover:bg-[#2c3548] text-gray-400 hover:text-red-400 font-extrabold text-xs transition-all"
                              >
                                -
                              </button>
                              <span className="px-3 font-black text-white text-xs min-w-[2.5rem] text-center">
                                {u.modelsCount ?? uRules.models ?? 1} / {u.maxModels ?? uRules.models ?? 1}
                              </span>
                              <button
                                onClick={() => adjustModelsById(u.id, 1)}
                                className="px-2.5 py-0.5 hover:bg-[#2c3548] text-gray-400 hover:text-emerald-400 font-extrabold text-xs transition-all"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="hidden sm:block h-6 w-px bg-[#2c3548]/40" />

                          <div className="flex justify-between items-center gap-2 flex-grow">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Model HP</span>
                            <div className="flex items-center bg-[#1c2230] rounded border border-[#2c3548] overflow-hidden">
                              <button
                                onClick={() => adjustWoundsById(u.id, -1)}
                                className="px-2.5 py-0.5 hover:bg-[#2c3548] text-gray-400 hover:text-red-400 font-extrabold text-xs transition-all"
                              >
                                -
                              </button>
                              <span className="px-3 font-black text-white text-xs min-w-[3.5rem] text-center">
                                {uRules.health - (u.currentWounds || 0)} / {uRules.health} HP
                              </span>
                              <button
                                onClick={() => adjustWoundsById(u.id, 1)}
                                className="px-2.5 py-0.5 hover:bg-[#2c3548] text-gray-400 hover:text-emerald-400 font-extrabold text-xs transition-all"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Weapon stats table */}
                        <div className="space-y-3">
                          {rangedWeapons.map((w, wIdx) => (
                            <div key={wIdx} className="p-3 bg-[#151923]/80 border border-[#2c3548]/50 rounded-xl space-y-2.5">
                              <div className="text-xs font-black text-white pb-1 border-b border-[#2c3548]/30 flex items-center justify-between">
                                <span>{w.name}</span>
                                <Badge variant="outline" className="text-[9px] font-bold text-emerald-400 border-emerald-500/20 bg-emerald-500/5 px-2 py-0">Ranged</Badge>
                              </div>
                              
                              <div className="grid grid-cols-6 gap-2 text-xs font-semibold">
                                {/* Range stat */}
                                <div className="col-span-2 flex justify-between items-center bg-cyan-950/30 border border-cyan-500/20 rounded px-2.5 py-1.5 text-cyan-400">
                                  <span className="text-gray-400 font-bold text-[10px] uppercase">Range</span>
                                  <span className="font-black text-xs text-white">{w.range}</span>
                                </div>

                                {/* Attacks stat */}
                                <div className="col-span-2 flex justify-between items-center bg-emerald-950/30 border border-emerald-500/20 rounded px-2.5 py-1.5 text-emerald-400">
                                  <span className="text-gray-400 font-bold text-[10px] uppercase">Attacks</span>
                                  <span className="font-black text-xs text-white">{w.attacks}</span>
                                </div>

                                {/* Hit stat */}
                                <div className="col-span-2 flex justify-between items-center bg-amber-950/30 border border-amber-500/20 rounded px-2.5 py-1.5 text-amber-400">
                                  <span className="text-gray-400 font-bold text-[10px] uppercase">Hit</span>
                                  <span className="font-black text-xs text-white">{w.hit}+</span>
                                </div>

                                {/* Wound stat */}
                                <div className="col-span-2 flex justify-between items-center bg-orange-950/30 border border-orange-500/20 rounded px-2.5 py-1.5 text-orange-400">
                                  <span className="text-gray-400 font-bold text-[10px] uppercase">Wound</span>
                                  <span className="font-black text-xs text-white">{w.wound}+</span>
                                </div>

                                {/* Rend stat */}
                                <div className="col-span-2 flex justify-between items-center bg-blue-950/30 border border-blue-500/20 rounded px-2.5 py-1.5 text-blue-400">
                                  <span className="text-gray-400 font-bold text-[10px] uppercase">Rend</span>
                                  <span className="font-black text-xs text-white">-{w.rend}</span>
                                </div>

                                {/* Damage stat */}
                                <div className="col-span-2 flex justify-between items-center bg-rose-950/30 border border-rose-500/20 rounded px-2.5 py-1.5 text-rose-400">
                                  <span className="text-gray-400 font-bold text-[10px] uppercase">Damage</span>
                                  <span className="font-black text-xs text-white">{w.damage}</span>
                                </div>

                                {/* Ability box */}
                                {w.abilities && (
                                  <div className="col-span-6 flex flex-col bg-indigo-950/30 border border-indigo-500/20 rounded p-2 text-left text-indigo-300">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ability:</span>
                                    <span className="text-xs font-medium text-indigo-200 mt-0.5">{w.abilities}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* CHARGE PHASE WIDGET */}
            {gameState.currentPhase === 'charge' && gameState.activeTurn === 'me' && (
              <Card className="border-[#222834] bg-[#151923] text-white">
                <CardHeader className="border-b border-[#222834] py-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-orange-400">
                    <Activity className="h-4 w-4" /> Declare Charge Rolls
                  </CardTitle>
                  <CardDescription className="text-xxs text-gray-400">
                    Units that ran cannot charge. Record charges below.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {gameState.units.filter(u => !u.isSlain).map((u) => {
                    const uRules = faction.units.find(rules => rules.id === u.unitId);
                    if (!uRules) return null;
                    return (
                      <div key={u.id} className="flex justify-between items-center p-3 rounded-lg bg-[#1c2230] border border-[#2c3548]">
                        <div>
                          <h4 className="text-xs font-extrabold text-white">{uRules.name}</h4>
                          {u.ran && <Badge variant="destructive" className="text-xxs font-bold">RAN (Cannot Charge)</Badge>}
                        </div>
                        <div className="flex gap-1">
                          <button
                            disabled={u.ran}
                            onClick={() => toggleUnitStateFlag(u.id, 'charged')}
                            className={`px-3 py-1 rounded text-xxs font-bold transition-all
                              ${u.charged 
                                ? 'bg-orange-600 text-white font-extrabold animate-pulse' 
                                : 'bg-[#151923] text-gray-400 border border-[#2c3548] hover:text-white'}`}
                          >
                            Charged
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* COMBAT PHASE (ALTERNATING FIGHT TIMELINE) - MAJOR FIX */}
            {gameState.currentPhase === 'combat' && (
              <Card className="border-[#222834] bg-[#151923] text-white">
                <CardHeader className="border-b border-[#222834] py-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-rose-400">
                    <Swords className="h-4 w-4" /> My Melee Combat Activations
                  </CardTitle>
                  <CardDescription className="text-xxs text-gray-400">
                    Alternate selecting fighting units with your opponent. Toggle the "Fight" button on your active units as you activate them.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gameState.units.filter(u => !u.isSlain).map((u) => {
                      const uRules = faction.units.find(rules => rules.id === u.unitId);
                      if (!uRules) return null;
                      return (
                        <div key={u.id} className={`p-4 rounded-xl border transition-all flex flex-col gap-3
                          ${u.fought 
                            ? 'bg-[#181d29]/20 border-transparent opacity-40 saturate-0' 
                            : 'bg-[#1c2230] border-[#2c3548] hover:border-amber-500/40'}`}>
                          
                          <div className="flex justify-between items-start gap-2 border-b border-[#2c3548]/40 pb-2">
                            <div>
                              <h5 className="text-xs font-black text-white">{uRules.name}</h5>
                              <p className="text-xxs text-amber-500 font-semibold">Save: {uRules.save}+ {uRules.ward > 0 ? `• Ward: ${uRules.ward}+` : ''}</p>
                            </div>
                            <button
                              onClick={() => toggleUnitStateFlag(u.id, 'fought')}
                              className={`px-3 py-1 rounded text-xxs font-black uppercase transition-all
                                ${u.fought 
                                  ? 'bg-[#151923] text-gray-500 border border-transparent' 
                                  : 'bg-rose-600 text-white hover:bg-rose-700 shadow-md'}`}
                            >
                              {u.fought ? 'Activated' : 'Fight'}
                            </button>
                          </div>

                          {/* Health and Models Tracker panel inside active card */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-[#151923]/60 p-2 rounded-xl border border-[#222834]">
                            <div className="flex justify-between items-center gap-2 flex-grow">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Models</span>
                              <div className="flex items-center bg-[#1c2230] rounded border border-[#2c3548] overflow-hidden">
                                <button
                                  onClick={() => adjustModelsById(u.id, -1)}
                                  className="px-2.5 py-0.5 hover:bg-[#2c3548] text-gray-400 hover:text-red-400 font-extrabold text-xs transition-all"
                                >
                                  -
                                </button>
                                <span className="px-3 font-black text-white text-xs min-w-[2.5rem] text-center">
                                  {u.modelsCount ?? uRules.models ?? 1} / {u.maxModels ?? uRules.models ?? 1}
                                </span>
                                <button
                                  onClick={() => adjustModelsById(u.id, 1)}
                                  className="px-2.5 py-0.5 hover:bg-[#2c3548] text-gray-400 hover:text-emerald-400 font-extrabold text-xs transition-all"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <div className="hidden sm:block h-6 w-px bg-[#2c3548]/40" />

                            <div className="flex justify-between items-center gap-2 flex-grow">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Model HP</span>
                              <div className="flex items-center bg-[#1c2230] rounded border border-[#2c3548] overflow-hidden">
                                <button
                                  onClick={() => adjustWoundsById(u.id, -1)}
                                  className="px-2.5 py-0.5 hover:bg-[#2c3548] text-gray-400 hover:text-red-400 font-extrabold text-xs transition-all"
                                >
                                  -
                                </button>
                                <span className="px-3 font-black text-white text-xs min-w-[3.5rem] text-center">
                                  {uRules.health - (u.currentWounds || 0)} / {uRules.health} HP
                                </span>
                                <button
                                  onClick={() => adjustWoundsById(u.id, 1)}
                                  className="px-2.5 py-0.5 hover:bg-[#2c3548] text-gray-400 hover:text-emerald-400 font-extrabold text-xs transition-all"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Weapons stats */}
                          <div className="mt-1 space-y-3">
                            {uRules.weapons.filter(w => w.range === 'Melee').map((w, wIdx) => (
                              <div key={wIdx} className="p-3 bg-[#151923]/80 border border-[#2c3548]/50 rounded-xl space-y-2">
                                <div className="text-xs font-black text-white pb-1 border-b border-[#2c3548]/20 flex items-center justify-between">
                                  <span>{w.name}</span>
                                  <Badge variant="outline" className="text-[9px] font-bold text-amber-500 border-amber-500/20 bg-amber-500/5 px-2 py-0">Melee</Badge>
                                </div>
                                
                                <div className="grid grid-cols-6 gap-2 text-xs font-semibold">
                                  {/* Attacks stat */}
                                  <div className="col-span-2 flex justify-between items-center bg-emerald-950/30 border border-emerald-500/20 rounded px-2 py-1 text-emerald-400">
                                    <span className="text-gray-400 font-bold text-[9px] uppercase">Attacks</span>
                                    <span className="font-black text-xs text-white">{w.attacks}</span>
                                  </div>

                                  {/* Hit stat */}
                                  <div className="col-span-2 flex justify-between items-center bg-amber-950/30 border border-amber-500/20 rounded px-2 py-1 text-amber-400">
                                    <span className="text-gray-400 font-bold text-[9px] uppercase">Hit</span>
                                    <span className="font-black text-xs text-white">{w.hit}+</span>
                                  </div>

                                  {/* Wound stat */}
                                  <div className="col-span-2 flex justify-between items-center bg-orange-950/30 border border-orange-500/20 rounded px-2 py-1 text-orange-400">
                                    <span className="text-gray-400 font-bold text-[9px] uppercase">Wound</span>
                                    <span className="font-black text-xs text-white">{w.wound}+</span>
                                  </div>

                                  {/* Rend stat */}
                                  <div className="col-span-3 flex justify-between items-center bg-blue-950/30 border border-blue-500/20 rounded px-2 py-1 text-blue-400">
                                    <span className="text-gray-400 font-bold text-[9px] uppercase">Rend</span>
                                    <span className="font-black text-xs text-white">-{w.rend}</span>
                                  </div>

                                  {/* Damage stat */}
                                  <div className="col-span-3 flex justify-between items-center bg-rose-950/30 border border-rose-500/20 rounded px-2 py-1 text-rose-400">
                                    <span className="text-gray-400 font-bold text-[9px] uppercase">Damage</span>
                                    <span className="font-black text-xs text-white">{w.damage}</span>
                                  </div>

                                  {/* Ability box */}
                                  {w.abilities && (
                                    <div className="col-span-6 flex flex-col bg-indigo-950/30 border border-indigo-500/20 rounded p-1.5 text-left text-indigo-300">
                                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Ability:</span>
                                      <span className="text-xxs font-medium text-indigo-200 mt-0.5">{w.abilities}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* END OF TURN SCOREBOARD */}
            {gameState.currentPhase === 'end' && (
              <Card className="border-[#222834] bg-[#151923] text-white">
                <CardHeader className="border-b border-[#222834] py-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-purple-400">
                      <Trophy className="h-4 w-4" /> Turn Scoring & Reference
                    </CardTitle>
                    <Badge className="bg-purple-600/20 text-purple-400 border border-purple-500/20 text-[10px] px-2 py-0.5 font-bold uppercase">
                      End of Turn Scoring
                    </Badge>
                  </div>
                  <CardDescription className="text-xxs text-gray-400">
                    Consult the official Spearhead scoring rules, select exactly how many victory points you earned, and end your turn.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  {/* Official Spearhead Scoring Reference */}
                  <div className="p-4 bg-[#0d1017]/80 rounded-xl border border-[#222834] space-y-2.5">
                    <h5 className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1">
                      📋 Official Spearhead Scoring Guide:
                    </h5>
                    <ul className="space-y-1.5 text-xxs text-gray-300">
                      <li className="flex justify-between items-center border-b border-[#222834]/40 pb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Control at least one objective
                        </span>
                        <Badge variant="outline" className="text-purple-400 border-purple-500/20 bg-purple-500/5 text-[9px] font-black">+1 VP</Badge>
                      </li>
                      <li className="flex justify-between items-center border-b border-[#222834]/40 pb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Control two or more objectives
                        </span>
                        <Badge variant="outline" className="text-purple-400 border-purple-500/20 bg-purple-500/5 text-[9px] font-black">+1 VP</Badge>
                      </li>
                      <li className="flex justify-between items-center border-b border-[#222834]/40 pb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Control more objectives than opponent
                        </span>
                        <Badge variant="outline" className="text-purple-400 border-purple-500/20 bg-purple-500/5 text-[9px] font-black">+1 VP</Badge>
                      </li>
                      <li className="flex justify-between items-center pb-0.5">
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Score for each Battle Tactic completed this turn
                        </span>
                        <Badge variant="outline" className="text-purple-400 border-purple-500/20 bg-purple-500/5 text-[9px] font-black">+1 VP each</Badge>
                      </li>
                    </ul>
                  </div>

                  {/* Active VP Scoring Selector */}
                  <div className="flex flex-col items-center justify-center space-y-3 bg-[#1c2230] p-4 rounded-xl border border-[#2c3548]">
                    <div className="text-center">
                      <span className="text-xxs font-black text-gray-400 uppercase tracking-wider block">VICTORY POINTS EARNED THIS TURN</span>
                      <p className="text-[10px] text-purple-400/80 mt-0.5 font-medium">Includes tactics, objectives, or special card rules</p>
                    </div>

                    <div className="flex items-center bg-[#151923] rounded-2xl border border-[#2c3548] overflow-hidden p-1">
                      <Button 
                        type="button"
                        onClick={() => setTurnScoredVPs(prev => Math.max(0, prev - 1))}
                        className="bg-transparent hover:bg-[#2c3548] text-gray-400 hover:text-red-400 font-extrabold text-lg h-10 w-10 p-0 transition-all rounded-xl"
                      >
                        -
                      </Button>
                      <span className="px-6 font-black text-white text-xl min-w-[5rem] text-center">
                        {turnScoredVPs} VP
                      </span>
                      <Button 
                        type="button"
                        onClick={() => setTurnScoredVPs(prev => prev + 1)}
                        className="bg-transparent hover:bg-[#2c3548] text-gray-400 hover:text-emerald-400 font-extrabold text-lg h-10 w-10 p-0 transition-all rounded-xl"
                      >
                        +
                      </Button>
                    </div>

                    <Button 
                      onClick={handleNextPhase} 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black text-xs h-10 shadow-md uppercase tracking-wider rounded-xl mt-2"
                    >
                      Commit {turnScoredVPs} VP & End Turn
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ACTIVE/REACTIVE ABILITIES FOR CURRENT PHASE */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-amber-500" /> 
                  {gameState.activeTurn === 'me' ? 'My Active Strategy' : 'My Defensive Reactions'} ({phases[currentPhaseIndex].name})
                </h3>
                <Badge variant="outline" className={`uppercase text-xxs border-transparent
                  ${gameState.activeTurn === 'me' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-400'}`}
                >
                  {gameState.activeTurn === 'me' ? 'ACTIVE' : 'REACTIVE'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Faction-Level Strategy Cards */}
                {getAbilitiesForPhase(gameState.currentPhase).map(ability => {
                  const isUsed = !!gameState.usedAbilities[ability.id];
                  return (
                    <Card 
                      key={ability.id} 
                      onClick={() => toggleAbilityUsed(ability.id, ability.name)}
                      className={`cursor-pointer transition-all duration-300 relative overflow-hidden text-white
                        ${isUsed 
                          ? 'bg-zinc-800/30 border-transparent saturate-0 opacity-40' 
                          : 'bg-[#1c2230] border-[#2c3548] hover:border-amber-500/40'}`}
                    >
                      <CardHeader className="p-4 pb-1">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-xs font-bold text-white">{ability.name}</CardTitle>
                          {ability.once !== 'none' && (
                            <Badge variant="secondary" className="bg-[#151923] text-amber-400 text-xxs uppercase shrink-0">
                              {ability.once.replace('-', ' ')}
                            </Badge>
                          )}
                        </div>
                        {ability.timing && <CardDescription className="text-xxs text-amber-400/80 mt-0.5">{ability.timing}</CardDescription>}
                      </CardHeader>
                      <CardContent className="p-4 pt-1">
                        <p className="text-xxs text-gray-400 leading-normal whitespace-pre-line">{ability.effect}</p>
                      </CardContent>
                      {isUsed && (
                        <div className="absolute inset-0 bg-[#0d1015]/10 flex items-center justify-center">
                          <span className="text-lg font-black text-gray-500 uppercase rotate-[-12deg] tracking-widest bg-zinc-900/60 px-3 py-1 rounded border border-gray-600">USED</span>
                        </div>
                      )}
                    </Card>
                  );
                })}

                {/* Unit-Specific Strategy Cards */}
                {gameState.units.filter(u => !u.isSlain).flatMap((u, uIdx) => {
                  const uRules = faction.units.find(rules => rules.id === u.unitId);
                  if (!uRules) return [];
                  return getUnitAbilitiesForPhase(uRules, gameState.currentPhase).map(ability => {
                    const instanceKey = `${u.id}-${ability.id}`;
                    const isUsed = !!gameState.usedAbilities[instanceKey];
                    return (
                      <Card 
                        key={instanceKey} 
                        onClick={() => toggleAbilityUsed(instanceKey, `${uRules.name}: ${ability.name}`)}
                        className={`cursor-pointer transition-all duration-300 relative overflow-hidden text-white
                          ${isUsed 
                            ? 'bg-zinc-800/30 border-transparent saturate-0 opacity-40' 
                            : 'bg-[#1c2230] border-[#2c3548] hover:border-amber-500/40'}`}
                      >
                        <CardHeader className="p-4 pb-1">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <CardDescription className="text-xxs font-black text-amber-500 uppercase tracking-wider">{uRules.name}</CardDescription>
                              <CardTitle className="text-xs font-bold text-white mt-0.5">{ability.name}</CardTitle>
                            </div>
                            {ability.once !== 'none' && (
                              <Badge variant="secondary" className="bg-[#151923] text-amber-400 text-xxs uppercase shrink-0">
                                {ability.once.replace('-', ' ')}
                              </Badge>
                            )}
                          </div>
                          {ability.timing && <CardDescription className="text-xxs text-amber-400/80 mt-0.5">{ability.timing}</CardDescription>}
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                          <p className="text-xxs text-gray-400 leading-normal whitespace-pre-line">{ability.effect}</p>
                        </CardContent>
                        {isUsed && (
                          <div className="absolute inset-0 bg-[#0d1015]/10 flex items-center justify-center">
                            <span className="text-lg font-black text-gray-500 uppercase rotate-[-12deg] tracking-widest bg-zinc-900/60 px-3 py-1 rounded border border-gray-600">USED</span>
                          </div>
                        )}
                      </Card>
                    );
                  });
                })}
              </div>

              {getAbilitiesForPhase(gameState.currentPhase).length === 0 && 
               gameState.units.filter(u => !u.isSlain).flatMap(u => faction.units.find(r => r.id === u.unitId)?.abilities.filter(a => a.phase === gameState.currentPhase) || []).length === 0 && (
                <p className="text-xs text-gray-500 py-6 text-center border border-[#222834] border-dashed rounded-2xl bg-[#151923]/20">
                  No abilities ready in this phase. Keep tracking your standard actions!
                </p>
              )}
            </div>

            {/* 🧬 PHASE-APPLIED PASSIVE ABILITIES */}
            {(getPassiveAbilitiesForPhase(gameState.currentPhase).length > 0 || 
              gameState.units.filter(u => !u.isSlain).flatMap(u => {
                const uRules = faction.units.find(rules => rules.id === u.unitId);
                return uRules ? getUnitPassiveAbilitiesForPhase(uRules, gameState.currentPhase) : [];
              }).length > 0) && (
              <div className="space-y-4 pt-4 border-t border-[#222834]/40">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4.5 w-4.5 text-cyan-400 animate-pulse" /> 
                    🧬 Phase-Applied Passive Rules ({phases[currentPhaseIndex].name})
                  </h3>
                  <Badge variant="outline" className="uppercase text-xxs border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                    PASSIVE ALWAYS ACTIVE
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Faction-Level Passives */}
                  {getPassiveAbilitiesForPhase(gameState.currentPhase).map(ability => (
                    <Card key={ability.id} className="bg-[#14222a] border-cyan-500/20 text-white shadow-lg shadow-cyan-950/10">
                      <CardHeader className="p-4 pb-1">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-xs font-bold text-white">{ability.name}</CardTitle>
                          <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 text-[9px] uppercase">
                            FACTION PASSIVE
                          </Badge>
                        </div>
                        {ability.timing && <CardDescription className="text-xxs text-cyan-400/80 mt-0.5">{ability.timing}</CardDescription>}
                      </CardHeader>
                      <CardContent className="p-4 pt-1">
                        <p className="text-xxs text-gray-300 leading-normal whitespace-pre-line">{ability.effect}</p>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Unit-Specific Passives */}
                  {gameState.units.filter(u => !u.isSlain).flatMap((u) => {
                    const uRules = faction.units.find(rules => rules.id === u.unitId);
                    if (!uRules) return [];
                    return getUnitPassiveAbilitiesForPhase(uRules, gameState.currentPhase).map(ability => (
                      <Card key={`${u.id}-${ability.id}`} className="bg-[#14222a] border-cyan-500/20 text-white shadow-lg shadow-cyan-950/10">
                        <CardHeader className="p-4 pb-1">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <CardDescription className="text-xxs font-black text-cyan-400 uppercase tracking-wider">{uRules.name}</CardDescription>
                              <CardTitle className="text-xs font-bold text-white mt-0.5">{ability.name}</CardTitle>
                            </div>
                            <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 text-[9px] uppercase shrink-0">
                              UNIT PASSIVE
                            </Badge>
                          </div>
                          {ability.timing && <CardDescription className="text-xxs text-cyan-400/80 mt-0.5">{ability.timing}</CardDescription>}
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                          <p className="text-xxs text-gray-300 leading-normal whitespace-pre-line">{ability.effect}</p>
                        </CardContent>
                      </Card>
                    ));
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: MY ROSTER & HP MANAGEMENT */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#222834] pb-2">
              <User className="h-5 w-5 text-amber-500" />
              <h3 className="text-sm font-extrabold uppercase text-white tracking-wider">My Active Army Roster ({faction.name})</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameState.units.map((u, idx) => {
                const uRules = faction.units.find(rules => rules.id === u.unitId);
                if (!uRules) return null;
                return (
                  <Card key={u.id} className={`border-[#222834] transition-all ${u.isSlain ? 'bg-zinc-800/10 border-transparent saturate-0 opacity-40' : 'bg-[#151923] text-white'}`}>
                    <CardContent className="p-4 flex justify-between items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-white">{uRules.name}</h4>
                          {uRules.isHero && <Badge className="bg-amber-500/10 border-amber-500/20 text-amber-500 text-xxs font-black uppercase">Hero</Badge>}
                        </div>
                        <p className="text-xxs text-gray-400 mt-1 leading-normal">
                          Move: {uRules.move}" • Save: {uRules.save}+ • Control: {uRules.control} • Max HP: {uRules.health}
                          {uRules.ward > 0 && ` • Ward: ${uRules.ward}+`}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                        {/* Models Counter */}
                        <div className="flex items-center bg-[#1c2230] p-1.5 rounded-lg border border-[#2c3548]">
                          <button 
                            onClick={() => adjustModelsById(u.id, -1)}
                            className="px-2 py-0.5 hover:bg-[#2c3548] text-gray-400 font-bold text-xs rounded"
                          >
                            -
                          </button>
                          <span className="text-xxs font-bold text-gray-400 w-20 text-center">
                            Models: <strong className="text-white font-black text-xs">{u.modelsCount ?? uRules.models ?? 1} / {u.maxModels ?? uRules.models ?? 1}</strong>
                          </span>
                          <button 
                            onClick={() => adjustModelsById(u.id, 1)}
                            className="px-2 py-0.5 hover:bg-[#2c3548] text-gray-400 font-bold text-xs rounded"
                          >
                            +
                          </button>
                        </div>

                        {/* HP Counter */}
                        <div className="flex items-center bg-[#1c2230] p-1.5 rounded-lg border border-[#2c3548]">
                          <button 
                            onClick={() => adjustWoundsById(u.id, -1)}
                            className="px-2 py-0.5 hover:bg-[#2c3548] text-gray-400 font-bold text-xs rounded"
                          >
                            -
                          </button>
                          <span className="text-xxs font-bold text-gray-400 w-24 text-center">
                            Model HP: <strong className="text-white font-black text-xs">{uRules.health - (u.currentWounds || 0)} / {uRules.health}</strong>
                          </span>
                          <button 
                            onClick={() => adjustWoundsById(u.id, 1)}
                            className="px-2 py-0.5 hover:bg-[#2c3548] text-gray-400 font-bold text-xs rounded"
                          >
                            +
                          </button>
                        </div>

                        {/* Slain button */}
                        <Button 
                          onClick={() => toggleSlainById(u.id)}
                          size="sm"
                          variant={u.isSlain ? 'default' : 'outline'}
                          className={`text-xxs font-extrabold uppercase ${u.isSlain ? 'bg-red-600 hover:bg-red-700 text-white border-transparent' : 'border-[#2c3548] text-gray-400 hover:text-white'}`}
                        >
                          Slain
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: BATTLE TRAITS LOOKUP CHART */}
        {activeTab === 'traits' && (
          <div className="space-y-4">
            <Card className="border-[#222834] bg-[#151923] text-white">
              <CardHeader className="border-b border-[#222834] py-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
                  <Sparkles className="h-4 w-4" /> Faction Battle Traits Reference Chart
                </CardTitle>
                <CardDescription className="text-xxs text-gray-400">
                  Lookup tables, round-by-round rules, and general passive abilities for {faction.name}.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {faction.battleTraits.length === 0 ? (
                  <div className="text-center text-gray-500 py-10 text-xs">
                    No battle traits loaded for this faction.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {faction.battleTraits.map((t) => (
                      <div 
                        key={t.id} 
                        className="bg-[#1c2230]/40 border border-[#2c3548]/30 rounded-lg p-4 space-y-2.5 hover:border-amber-500/10 transition-colors duration-150"
                      >
                        <div className="flex justify-between items-start gap-2 border-b border-[#2c3548]/20 pb-2">
                          <span className="text-sm font-black text-white">{t.name}</span>
                          <Badge variant="outline" className="text-[9px] font-black uppercase text-amber-500 border-amber-500/20 bg-amber-500/5 px-2 py-0.5">
                            {t.timing || 'Passive'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex gap-1.5 text-[10px] text-gray-400 font-bold uppercase">
                            <span className="text-amber-500/80">Active Phase:</span>
                            <span className="text-gray-200">{t.phase.toUpperCase()}</span>
                          </div>
                          {t.once !== 'none' && (
                            <div className="flex gap-1.5 text-[10px] text-gray-400 font-bold uppercase">
                              <span className="text-amber-500/80">Limit:</span>
                              <span className="text-gray-200">{t.once.replace('-', ' ')}</span>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-gray-300 whitespace-pre-line leading-relaxed border-t border-[#2c3548]/10 pt-2 font-medium">
                          {t.effect}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: LOGS FEED */}
        {activeTab === 'logs' && (
          <Card className="border-[#222834] bg-[#151923] text-white">
            <CardHeader className="border-b border-[#222834] py-4 flex flex-row justify-between items-center gap-4">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
                  <ScrollText className="h-4 w-4" /> Action History Log
                </CardTitle>
                <CardDescription className="text-xxs text-gray-400">Chronological list of custom actions and triggers executed during this match.</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-[#2c3548] text-gray-300"
                onClick={() => {
                  const updated = { ...gameState };
                  updated.logs = ['Logs cleared!'];
                  saveGame(updated);
                }}
              >
                Clear Log
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[450px] p-4 text-xs font-mono">
                <div className="space-y-2">
                  {gameState.logs.map((log, lIdx) => (
                    <div key={lIdx} className="p-2 rounded bg-[#1c2230]/40 border-l-2 border-[#ca8a04]/40 text-gray-300 flex justify-between gap-4">
                      <span>{log}</span>
                      <span className="text-xxs text-gray-500 self-center shrink-0">#{gameState.logs.length - lIdx}</span>
                    </div>
                  ))}
                  {gameState.logs.length === 0 && (
                    <div className="text-center text-gray-500 py-12">No actions recorded in logs yet.</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-[#222834] bg-[#0d1017] py-4 text-center text-xxs text-gray-500 mt-auto flex justify-center gap-4">
        <span>© {new Date().getFullYear()} Spearhead Companion</span>
        <span>•</span>
        <span>Round Active: {gameState.round} / 4</span>
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
