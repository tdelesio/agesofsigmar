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
import { GameState, Faction, Unit, GamePhase, Weapon, Ability, UnitState, AppliedModifier } from '../types';
import { getActiveModifiers as libGetActiveModifiers, getBattleDamagedOverride as libGetBattleDamagedOverride, calculateStatValue, isTargetingSingularFriendlyUnit } from '@/lib/rules-engine';

const shownPromptsCache = new Set<string>();

export default function TrackerPage() {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [factions, setFactions] = useState<Faction[]>(DEFAULT_FACTIONS);
  const [activeTab, setActiveTab] = useState<'tracker' | 'roster' | 'traits' | 'logs'>('tracker');
  const [turnScoredVPs, setTurnScoredVPs] = useState(0);

  // Custom non-blocking modal states
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [activePrompt, setActivePrompt] = useState<{
    title: string;
    description: string;
    actions: string[];
    onClose: () => void;
  } | null>(null);

  const [buffModal, setBuffModal] = useState<{
    isOpen: boolean;
    unitId: string;
    unitName: string;
    allowedStats?: ('attacks' | 'save' | 'ward' | 'move' | 'hit' | 'wound' | 'rend' | 'damage')[];
    expiresPhase?: GamePhase;
  } | null>(null);

  const [selectUnitToBuffAbility, setSelectUnitToBuffAbility] = useState<{
    abilityId: string;
    name: string;
    effect: string;
    phase?: GamePhase;
  } | null>(null);

  const [rollPrompt, setRollPrompt] = useState<{
    abilityId: string;
    abilityName: string;
    effect: string;
    targetUnitId?: string;
    targetUnitName?: string;
    requiredRoll: string;
    phase?: GamePhase;
    allowedStats?: ('attacks' | 'save' | 'ward' | 'move' | 'hit' | 'wound' | 'rend' | 'damage')[];
  } | null>(null);

  // Eye of the Gods Ascension selection states
  const [eyeOfTheGodsModal, setEyeOfTheGodsModal] = useState<{
    isOpen: boolean;
    sourceAbilityName: string;
    sourceAbilityId?: string;
    restrictToChaosOnly?: boolean;
    applyToAllUnits?: boolean;
    restrictToUnitId?: string;
  } | null>(null);
  const [eyeOfTheGodsSelectedUnitId, setEyeOfTheGodsSelectedUnitId] = useState<string>('');
  const [eyeOfTheGodsSelectedReward, setEyeOfTheGodsSelectedReward] = useState<string>('');

  // Lumineth Realm-Lords: Facets of War states
  const [facetOfWarModalOpen, setFacetOfWarModalOpen] = useState<boolean>(false);
  const [selectedFacetUnitId, setSelectedFacetUnitId] = useState<string>('');

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

  // Trigger round start overlay exactly once per round start or on load (declared above early returns)
  useEffect(() => {
    if (gameState) {
      const factionTemplate = factions.find(f => f.id === gameState.factionId);
      if (factionTemplate) {
        const shownKey = `shown_round_prompt_${gameState.matchId || 'default'}_${gameState.round}`;
        let alreadyShown = shownPromptsCache.has(shownKey);

        if (!alreadyShown) {
          try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
              alreadyShown = !!sessionStorage.getItem(shownKey);
            }
          } catch (e) {
            console.warn('sessionStorage is unavailable:', e);
          }
        }

        if (!alreadyShown && gameState.currentPhase === 'start') {
          shownPromptsCache.add(shownKey);
          try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
              sessionStorage.setItem(shownKey, 'true');
            }
          } catch (e) {
            console.warn('sessionStorage is unavailable:', e);
          }
          checkRoundStartRules(gameState.round);
        }
      }
    }
  }, [gameState?.round, gameState?.currentPhase, gameState?.activeTurn, gameState?.matchId]);

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

  // Turn-based targeted buff helpers
  const applyBuff = (unitId: string, stat: any, modifier: number, label: string, expiresPhase?: GamePhase) => {
    if (!gameState) return;
    const updated = { ...gameState };
    const newMod: AppliedModifier = {
      id: Math.random().toString(36).substring(2, 9),
      unitId,
      stat,
      modifier,
      label,
      expiresRound: gameState.round,
      expiresPhase
    };
    updated.appliedModifiers = [...(updated.appliedModifiers || []), newMod];
    updated.logs.unshift(`[Round ${gameState.round}] ✨ Applied buff [${label}] to unit${expiresPhase ? ` for ${expiresPhase} phase` : ''}.`);
    saveGame(updated);
    showToast(`Applied ${label}!`, 'success');
  };

  const removeBuff = (modId: string) => {
    if (!gameState || !gameState.appliedModifiers) return;
    const updated = { ...gameState };
    updated.appliedModifiers = (updated.appliedModifiers || []).filter(m => m.id !== modId);
    updated.logs.unshift(`[Round ${gameState.round}] ✨ Removed active buff from unit.`);
    saveGame(updated);
    showToast('Buff removed.', 'success');
  };

  const handleSelectFacet = (facetType: 'shiningCompany' | 'powerOfHysh' | 'lightningReactions') => {
    if (!gameState || !faction) return;
    const updated = { ...gameState };
    
    // Clear previous Facet of War modifiers (if any exist) to ensure clean round transitions
    updated.appliedModifiers = (updated.appliedModifiers || []).filter(mod => 
      !mod.label.includes('Shining Company') && !mod.label.includes('Power of Hysh')
    );

    updated.luminethFacetSelected = facetType;

    if (facetType === 'shiningCompany') {
      // Shining is a defensive ability that gets applied to all units. It is -1 hit. The buff should be listed on all units.
      updated.units.filter(u => !u.isSlain).forEach(u => {
        const uRules = faction.units.find(rules => rules.id === u.unitId);
        if (uRules) {
          const newMod: AppliedModifier = {
            id: `shiningCompany-${u.id}-${Date.now()}`,
            unitId: u.id,
            stat: 'hit',
            modifier: -1, // defensive subtract 1 to hit
            label: 'Shining Company (Facet of War)',
            expiresRound: updated.round
          };
          updated.appliedModifiers = [...(updated.appliedModifiers || []), newMod];
        }
      });
      updated.logs.unshift(`[Round ${updated.round}] 🛡️ Selected Shining Company: Subtract 1 from hit rolls targeting all friendly units!`);
      showToast('Selected Shining Company!', 'success');
    } else if (facetType === 'powerOfHysh') {
      if (selectedFacetUnitId) {
        const targetUnit = updated.units.find(u => u.id === selectedFacetUnitId);
        const uRules = faction.units.find(rules => rules.id === targetUnit?.unitId);
        if (targetUnit && uRules) {
          const newMod: AppliedModifier = {
            id: `powerOfHysh-${targetUnit.id}-${Date.now()}`,
            unitId: targetUnit.id,
            stat: 'hit',
            modifier: 0, // No numeric stat adjustment needed for critical hits, we just display the buff label
            label: 'Power of Hysh (Facet of War)',
            expiresRound: updated.round
          };
          updated.appliedModifiers = [...(updated.appliedModifiers || []), newMod];
          updated.logs.unshift(`[Round ${updated.round}] ✨ Selected Power of Hysh on ${uRules.name}: Critical hits on unmodified hit rolls of 5+!`);
          showToast(`Selected Power of Hysh on ${uRules.name}!`, 'success');
        }
      }
    } else if (facetType === 'lightningReactions') {
      updated.logs.unshift(`[Round ${updated.round}] ⚡ Selected Lightning Reactions: You can pick 2 friendly units instead of 1 to Fight!`);
      showToast('Selected Lightning Reactions!', 'success');
    }

    setFacetOfWarModalOpen(false);
    setSelectedFacetUnitId('');
    saveGame(updated);
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
  // Ability Use Tracking
  const toggleAbilityUsed = (abilityId: string, abilityName: string, effect?: string, phase?: GamePhase | 'passive') => {
    const updated = { ...gameState };
    
    // Detect unlimited (once: "none") abilities to prevent permanent lockout
    let foundAb = faction?.battleTraits.find(a => a.id === abilityId) ||
                  faction?.regimentAbilities.find(a => a.id === abilityId) ||
                  faction?.enhancements.find(a => a.id === abilityId);
    
    if (!foundAb && faction) {
      for (const u of faction.units) {
        const matched = u.abilities.find(a => abilityId === a.id || abilityId.endsWith(`-${a.id}`));
        if (matched) {
          foundAb = matched;
          break;
        }
      }
    }

    const isUnlimited = foundAb && foundAb.once === 'none';
    const wasUsed = !!updated.usedAbilities[abilityId];

    // Intercept Slaves to Darkness Eye of the Gods triggers when activating them (when wasUsed is false)
    if (!wasUsed) {
      if (abilityId === 'eyeOfTheGods' || abilityId.endsWith('-eyeOfTheGods')) {
        setEyeOfTheGodsModal({
          isOpen: true,
          sourceAbilityName: 'Eye of the Gods (Battle Trait)',
          sourceAbilityId: abilityId
        });
        return;
      } else if (abilityId === 'theDreadBanner' || abilityId.endsWith('-theDreadBanner')) {
        setEyeOfTheGodsModal({
          isOpen: true,
          sourceAbilityName: 'The Dread Banner',
          sourceAbilityId: abilityId,
          restrictToChaosOnly: true
        });
        return;
      } else if (abilityId === 'favouredOfThePantheon' || abilityId.endsWith('-favouredOfThePantheon')) {
        setRollPrompt({
          abilityId,
          abilityName: 'Favoured of the Pantheon',
          effect: effect || 'Roll a dice. On a 4+, you can roll on the Eye of the Gods table for this unit.',
          requiredRoll: '4+',
          phase: 'hero'
        });
        return;
      }
    }

    const rollMatch = (effect || '').match(/on\s+a\s+(\d+)\+/i);
    const isTargetingSingular = isTargetingSingularFriendlyUnit(effect || '') || abilityId === 'heightenedReflexes' || abilityId.endsWith('-heightenedReflexes');

    // Intercept non-targeted roll-dependent abilities (e.g. On a 2+) before marking them as used
    if (!wasUsed && rollMatch && !isTargetingSingular) {
      setRollPrompt({
        abilityId,
        abilityName,
        effect: effect || '',
        requiredRoll: rollMatch[1] + '+',
        phase: phase !== 'passive' ? phase : undefined
      });
      return;
    }

    updated.usedAbilities[abilityId] = !wasUsed;

    updated.logs.unshift(`⚡ Triggered ability: "${abilityName}"`);
    saveGame(updated);

    const effectLower = (effect || '').toLowerCase();

    // Intercept targetable abilities containing "pick/select/choose a/1 friendly unit" when using them
    // Exclude global/passive abilities with plural "friendly units" or plural targeting rules
    if (!wasUsed && isTargetingSingular) {
      const isHeightened = abilityId === 'heightenedReflexes' || abilityId.endsWith('-heightenedReflexes');
      const isPhaseLong = effectLower.includes('this phase') || effectLower.includes('the rest of the phase') || effectLower.includes('for the rest of this phase') || isHeightened;
      setSelectUnitToBuffAbility({ 
        abilityId,
        name: abilityName, 
        effect: effect || '', 
        phase: isHeightened ? 'combat' : (isPhaseLong && phase && phase !== 'passive' ? phase : undefined) 
      });
    }
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
    const leavingPhase = updated.currentPhase;
    
    if (currentPhaseIndex < phases.length - 1) {
      // Step to next phase in current turn
      updated.currentPhase = phases[currentPhaseIndex + 1].id;
      
      // Auto-expire modifiers that expire in the phase we are leaving
      if (updated.appliedModifiers) {
        updated.appliedModifiers = updated.appliedModifiers.filter(mod => !mod.expiresPhase || mod.expiresPhase !== leavingPhase);
      }
      
      saveGame(updated);
    } else {
      // End of "End" phase -> transition turn
      updated.victoryPoints = Math.max(0, updated.victoryPoints + turnScoredVPs);
      updated.logs.unshift(`[Round ${gameState.round}] Scored +${turnScoredVPs} Victory Points. Total score is now ${updated.victoryPoints} VPs.`);
      
      // Auto-expire modifiers that expire in the phase we are leaving
      if (updated.appliedModifiers) {
        updated.appliedModifiers = updated.appliedModifiers.filter(mod => !mod.expiresPhase || mod.expiresPhase !== leavingPhase);
      }

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

        // Automatically trigger Slaves to Darkness Eye of the Gods Battle Trait selection popup at start of new round
        if (updated.factionId === 'slaves-to-darkness-bloodwind-legion') {
          setEyeOfTheGodsModal({
            isOpen: true,
            sourceAbilityName: 'Eye of the Gods (Round End Battle Trait)',
            sourceAbilityId: 'eyeOfTheGods'
          });
        }

        // Automatically trigger Lumineth Realm-Lords Facets of War selection popup at start of new round
        if (updated.factionId === 'lumineth-realm-lords-glittering-phalanx') {
          setFacetOfWarModalOpen(true);
        }

        // Automatically expire temporary round buffs
        if (updated.appliedModifiers) {
          updated.appliedModifiers = updated.appliedModifiers.filter(mod => mod.expiresRound >= updated.round);
        }
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
      let isOncePerBattleAbility = false;
      
      // 1. Try to find in faction battle traits, regiment abilities, or enhancements
      let foundAb = faction.battleTraits.find(a => a.id === key) ||
                    faction.regimentAbilities.find(a => a.id === key) ||
                    faction.enhancements.find(a => a.id === key);
      
      // 2. Try to find in unit abilities (matching by raw ID or end of hyphenated key)
      if (!foundAb) {
        for (const u of faction.units) {
          const matched = u.abilities.find(a => key === a.id || key.endsWith(`-${a.id}`));
          if (matched) {
            foundAb = matched;
            break;
          }
        }
      }

      if (foundAb) {
        const isOncePerBattleType = foundAb.once === 'once-per-battle';
        const isTimingOncePerBattle = foundAb.timing && foundAb.timing.toLowerCase().startsWith('once per battle');
        if (isOncePerBattleType || isTimingOncePerBattle) {
          isOncePerBattleAbility = true;
        }
      }

      // If it is NOT a once-per-battle ability, delete it so it resets for the new turn/round!
      if (!isOncePerBattleAbility) {
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
        if (t.phase === phase) list.push({ ...t, sourceType: 'trait' });
      });
    } else {
      const trait = faction.battleTraits.find(t => t.id === gameState.selectedBattleTraitId);
      if (trait && trait.phase === phase) list.push({ ...trait, sourceType: 'trait' });
    }

    // Selected Regiment
    const regiment = faction.regimentAbilities.find(r => r.id === gameState.selectedRegimentAbilityId);
    if (regiment && regiment.phase === phase) list.push({ ...regiment, sourceType: 'regiment' });

    // Selected Enhancement
    const enhancement = faction.enhancements.find(e => e.id === gameState.selectedEnhancementId);
    if (enhancement && enhancement.phase === phase) list.push({ ...enhancement, sourceType: 'enhancement' });

    return list;
  };

  // Fetch active modifiers for a given stat based on current round/phase/selections
  function getActiveModifiers(stat: string, unitId?: string, weaponName?: string): { modifier: number; description: string }[] {
    return libGetActiveModifiers(gameState, faction || null, stat, unitId, weaponName);
  }

  // Helper to parse "Battle Damaged" passive abilities and determine if a characteristic is currently degraded
  function getBattleDamagedOverride(unitId: string | undefined, statKey: string, weaponName?: string): number | null {
    return libGetBattleDamagedOverride(gameState, faction || null, unitId, statKey, weaponName);
  }

  // Helper to determine if there is an active +1 (or more) modifier to casting/activation rolls
  function getCastingRollBonus(): { value: number; source: string } | null {
    if (!gameState || !faction) return null;

    // 1. Check Regiment Ability
    const regiment = faction.regimentAbilities.find(r => r.id === gameState.selectedRegimentAbilityId);
    if (regiment && (
      regiment.effect.toLowerCase().includes('add 1 to casting roll') || 
      regiment.effect.toLowerCase().includes('add 2 to the casting roll') || 
      regiment.effect.toLowerCase().includes('add 2 to casting roll')
    )) {
      const val = regiment.effect.toLowerCase().includes('add 2') ? 2 : 1;
      return { value: val, source: `${regiment.name} (Regiment Ability)` };
    }

    // 2. Check Battle Traits
    const activeTraits = gameState.selectedBattleTraitId === 'all' 
      ? faction.battleTraits 
      : faction.battleTraits.filter(t => t.id === gameState.selectedBattleTraitId);
    
    for (const trait of activeTraits) {
      if (
        trait.effect.toLowerCase().includes('add 1 to casting roll') || 
        trait.effect.toLowerCase().includes('add 2 to casting roll')
      ) {
        const val = trait.effect.toLowerCase().includes('add 2') ? 2 : 1;
        return { value: val, source: `${trait.name} (Battle Trait)` };
      }
    }

    // 3. Check selected Enhancement
    const enhancement = faction.enhancements.find(e => e.id === gameState.selectedEnhancementId);
    if (enhancement && (
      enhancement.effect.toLowerCase().includes('add 1 to casting roll') || 
      enhancement.effect.toLowerCase().includes('add 2 to casting roll')
    )) {
      const val = enhancement.effect.toLowerCase().includes('add 2') ? 2 : 1;
      return { value: val, source: `${enhancement.name} (Enhancement)` };
    }

    // 4. Check custom applied modifiers
    if (gameState.appliedModifiers) {
      const m = gameState.appliedModifiers.find(mod => 
        (mod.label.toLowerCase().includes('casting roll') || mod.label.toLowerCase().includes('casting buff')) && 
        mod.modifier !== 0
      );
      if (m) {
        return { value: m.modifier, source: m.label };
      }
    }

    return null;
  }

  // Helper to render original base stats alongside active modifier badges in a single layout
  function renderStatWithModifier(baseValue: number | string, statKey: string, unitId?: string, suffix: string = '', weaponName?: string) {
    // Check if SPEED OF HYSH is active on this unit
    const hasSpeedOfHysh = unitId && gameState?.appliedModifiers?.some(mod => 
      mod.unitId === unitId && 
      mod.stat === 'move' && 
      (mod.label.toUpperCase().includes('SPEED OF HYSH') || mod.label.toUpperCase().includes('DOUBLED MOVE'))
    );

    if (statKey === 'move' && hasSpeedOfHysh) {
      let baseNum = 0;
      if (typeof baseValue === 'number') baseNum = baseValue;
      else baseNum = parseInt(baseValue, 10) || 0;
      const doubledVal = baseNum * 2;

      return (
        <span 
          className="inline-flex items-center gap-1 cursor-help"
          title="Speed of Hysh: Double this unit's Move characteristic"
        >
          <span className="font-extrabold text-emerald-400 text-xs">{doubledVal}{suffix}</span>
          <span className="text-[10px] text-gray-500 line-through font-medium">({baseNum}{suffix})</span>
          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[9px] px-1.5 py-0.5 font-black uppercase tracking-wider shrink-0 select-none">
            x2
          </Badge>
        </span>
      );
    }

    // Check if Guardian Ward is active on this unit (Vanari Bladelords and General)
    const isBladelordsInRoster = gameState?.units?.some(u => u.unitId === 'vanariBladelords' && !u.isSlain);
    const isCurrentUnitBladelords = unitId && gameState?.units?.some(u => u.id === unitId && u.unitId === 'vanariBladelords');
    const isCurrentUnitHero = unitId && gameState?.units?.some(u => u.id === unitId && faction?.units?.find(r => r.id === u.unitId)?.isHero);
    const isGuardianActive = (isCurrentUnitBladelords) || (isCurrentUnitHero && isBladelordsInRoster);

    if (statKey === 'ward' && isGuardianActive) {
      return (
        <span 
          className="inline-flex items-center gap-1 cursor-help"
          title="Guardians*: Wholly within unit's combat range, both this unit and your general have Ward (5+)"
        >
          <span className="font-extrabold text-emerald-400 text-xs">5+*</span>
          <span className="text-[10px] text-gray-500 line-through font-medium">({baseValue === 0 || baseValue === '0' || !baseValue ? '-' : `${baseValue}+`})</span>
          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[8px] px-1 py-0 font-black uppercase tracking-wider shrink-0 select-none">
            GUARDIAN*
          </Badge>
        </span>
      );
    }

    // 1. Check for Battle Damaged override first
    const override = getBattleDamagedOverride(unitId, statKey, weaponName);
    if (override !== null) {
      let baseNum = 0;
      if (typeof baseValue === 'number') baseNum = baseValue;
      else baseNum = parseInt(baseValue, 10) || 0;

      return (
        <span 
          className="inline-flex items-center gap-1 cursor-help"
          title="Battle Damaged: Degraded characteristics due to sustained wounds"
        >
          <span className="font-extrabold text-red-500 text-xs">{override}{suffix}</span>
          <span className="text-[10px] text-gray-500 line-through font-medium">({baseNum}{suffix})</span>
          <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 text-[8px] px-1 py-0 font-black uppercase tracking-wider shrink-0 select-none">
            DAMAGED
          </Badge>
        </span>
      );
    }

    const mods = getActiveModifiers(statKey, unitId, weaponName);
    const totalMod = mods.reduce((acc, m) => acc + m.modifier, 0);

    if (totalMod === 0) {
      return <span>{baseValue}{suffix}</span>;
    }

    // Determine numerical base value
    const { baseNum, modifiedNum, isNan } = calculateStatValue(baseValue, statKey, totalMod);

    // According to AoS, net target roll modifications are capped at [-1, 1]
    const isRollStat = ['save', 'ward', 'hit', 'wound', 'run', 'charge', 'rend', 'attacks', 'damage'].includes(statKey);
    let cappedTotalMod = totalMod;
    if (isRollStat) {
      if (cappedTotalMod > 1) cappedTotalMod = 1;
      if (cappedTotalMod < -1) cappedTotalMod = -1;
    }

    // Build descriptions for hovering tool tip listing all contributing buffs
    const tooltipText = mods
      .map(m => `${m.description}: ${m.modifier > 0 ? '+' : ''}${m.modifier}`)
      .join('\n');

    if (isNan) {
      // Fallback for non-numeric stats (e.g. "D3" or "D6")
      const sign = cappedTotalMod > 0 ? '+' : '';
      return (
        <span className="inline-flex items-center gap-1 cursor-help" title={tooltipText}>
          <span>{baseValue}{suffix}</span>
          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[9px] px-1 py-0 font-bold uppercase tracking-wider shrink-0 select-none">
            {sign}{cappedTotalMod}
          </Badge>
        </span>
      );
    }

    const badgeColorClass = cappedTotalMod > 0 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20';
    const sign = cappedTotalMod > 0 ? '+' : '';

    return (
      <span className="inline-flex items-center gap-1 cursor-help" title={tooltipText}>
        <span className="font-extrabold text-white text-xs">{modifiedNum}{suffix}</span>
        <span className="text-[10px] text-gray-400 font-medium">({baseNum}{suffix})</span>
        <Badge className={`text-[8px] px-1 py-0 font-black uppercase tracking-wider shrink-0 select-none border ${badgeColorClass}`}>
          {sign}{cappedTotalMod}
        </Badge>
      </span>
    );
  }

  // Check and compile round start rules for active popup modals
  function checkRoundStartRules(round: number) {
    if (!gameState || !faction) return;

    const roundActions: string[] = [];
    const prompts: string[] = [];

    const scanAbility = (ability: Ability) => {
      if (ability.ruleDefinition && ability.ruleDefinition.trigger === 'start_of_round') {
        ability.ruleDefinition.actions.forEach(action => {
          // If blood rites, it applies if condition round <= current round, but we notify about the NEW one!
          if (action.condition?.round === round) {
            if (action.type === 'modify_stat') {
              roundActions.push(`🌟 Active Buff: ${action.description}`);
            } else if (action.type === 'spawn_prompt') {
              prompts.push(action.description);
            }
          }
        });
      }
    };

    if (gameState.selectedBattleTraitId === 'all') {
      faction.battleTraits.forEach(scanAbility);
    } else {
      const trait = faction.battleTraits.find(t => t.id === gameState.selectedBattleTraitId);
      if (trait) scanAbility(trait);
    }
    const regiment = faction.regimentAbilities.find(r => r.id === gameState.selectedRegimentAbilityId);
    if (regiment) scanAbility(regiment);
    const enhancement = faction.enhancements.find(e => e.id === gameState.selectedEnhancementId);
    if (enhancement) scanAbility(enhancement);

    if (roundActions.length > 0 || prompts.length > 0 || round === 1) {
      setActivePrompt({
        title: `⚔️ Battle Round ${round} Initializing`,
        description: round === 1 
          ? `Welcome to Battle Round 1! Review your pre-game setup maneuvers and active battle round traits.`
          : `You have successfully advanced to Battle Round ${round}. Please apply the following round-start rules:`,
        actions: [
          ...roundActions,
          ...prompts,
          ...(round === 1 
            ? (gameState.activeTurn === 'opponent'
              ? ['🛡️ Vanguard Maneuvers: Since you are going second, pick up to D3 friendly units to make a free normal move of up to 6" before the first turn begins.']
              : ['🛡️ Opponent Vanguard Maneuvers: Since your opponent is going second, they can pick up to D3 of their units to make a free normal move of up to 6" before your turn begins.'])
            : [])
        ],
        onClose: () => {
          setActivePrompt(null);
          if (gameState.factionId === 'lumineth-realm-lords-glittering-phalanx') {
            setFacetOfWarModalOpen(true);
          }
        }
      });
    }
  }



  // Get active phase abilities on our Units
  const getUnitAbilitiesForPhase = (unit: Unit, phase: string): Ability[] => {
    return unit.abilities.filter(a => a.phase === phase).map(a => ({ ...a, sourceType: 'unit' }));
  };

  // Get passive abilities (faction-wide) that are applied to the active phase (or always active if none is assigned)
  const getPassiveAbilitiesForPhase = (phase: string): Ability[] => {
    if (!gameState) return [];
    const list: Ability[] = [];
    
    const isMatched = (a: Ability) => {
      return a.phase === 'passive' && (!a.passiveAppliedPhase || a.passiveAppliedPhase === (phase as GamePhase));
    };

    // Faction-wide passives
    if (gameState.selectedBattleTraitId === 'all') {
      faction.battleTraits.forEach(t => {
        if (isMatched(t)) {
          list.push({ ...t, sourceType: 'trait' });
        }
      });
    } else {
      const trait = faction.battleTraits.find(t => t.id === gameState.selectedBattleTraitId);
      if (trait && isMatched(trait)) {
        list.push({ ...trait, sourceType: 'trait' });
      }
    }

    const regiment = faction.regimentAbilities.find(r => r.id === gameState.selectedRegimentAbilityId);
    if (regiment && isMatched(regiment)) {
      list.push({ ...regiment, sourceType: 'regiment' });
    }

    const enhancement = faction.enhancements.find(e => e.id === gameState.selectedEnhancementId);
    if (enhancement && isMatched(enhancement)) {
      list.push({ ...enhancement, sourceType: 'enhancement' });
    }

    // Custom injector for Lumineth Glittering Phalanx Facets of War: Lightning Reactions
    if (gameState.factionId === 'lumineth-realm-lords-glittering-phalanx') {
      if (gameState.luminethFacetSelected === 'lightningReactions' && phase === 'combat') {
        const lrTrait = faction.battleTraits.find(t => t.id === 'lightningReactions');
        if (lrTrait) {
          list.push({ ...lrTrait, sourceType: 'trait' });
        }
      }
    }

    return list;
  };

  // Get passive abilities on a specific unit that apply to the current active phase (or always active if none is assigned)
  const getUnitPassiveAbilitiesForPhase = (unit: Unit, phase: string): Ability[] => {
    return unit.abilities
      .filter(a => a.phase === 'passive' && (!a.passiveAppliedPhase || a.passiveAppliedPhase === (phase as GamePhase)))
      .map(a => ({ ...a, sourceType: 'unit' }));
  };

  const getAbilityStyleClasses = (sourceType?: string) => {
    switch (sourceType) {
      case 'trait':
        return {
          border: 'border-slate-500/35 hover:border-slate-500/50',
          bg: 'bg-[#181c25]',
          badgeBg: 'bg-slate-500/10 text-slate-300 border-slate-500/25',
          label: 'Battle Trait'
        };
      case 'regiment':
        return {
          border: 'border-[#a0522d]/40 hover:border-[#a0522d]/55',
          bg: 'bg-[#201815]',
          badgeBg: 'bg-orange-950/35 text-[#d27d53] border-[#a0522d]/25',
          label: 'Regiment Ability'
        };
      case 'enhancement':
        return {
          border: 'border-amber-500/30 hover:border-amber-500/45',
          bg: 'bg-[#221c12]',
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          label: 'Enhancement'
        };
      case 'unit':
      default:
        return {
          border: 'border-emerald-500/25 hover:border-emerald-500/40',
          bg: 'bg-[#121c16]',
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          label: 'Unit Ability'
        };
    }
  };

  const handleConfirmEyeOfTheGods = () => {
    if (!eyeOfTheGodsModal || !gameState) return;
    
    // Validate unit selection unless it applies to all units
    if (!eyeOfTheGodsModal.applyToAllUnits && !eyeOfTheGodsSelectedUnitId) {
      showToast('Please select a unit to receive the blessing!', 'error');
      return;
    }

    if (!eyeOfTheGodsSelectedReward) {
      showToast('Please select a reward from the Ascension table!', 'error');
      return;
    }

    const updated = { ...gameState };
    const expiresRound = 99; // Rest of battle

    const applyRewardToUnit = (unitId: string) => {
      const u = updated.units.find(uState => uState.id === unitId);
      if (!u) return;
      const uRules = faction?.units.find(r => r.id === u.unitId);
      if (!uRules) return;

      if (eyeOfTheGodsSelectedReward === 'snubbed') {
        updated.logs.unshift(`🔮 ${uRules.name} was SNUBBED BY THE GODS! (No effect)`);
      } else if (eyeOfTheGodsSelectedReward === 'ward') {
        const newMod = {
          id: `eyeOfTheGods-ward-${unitId}-${Date.now()}`,
          unitId: unitId,
          stat: 'ward' as const,
          modifier: 1, // Ward 6+ (modifier of 1 lowering target 7+ to 6+)
          label: 'Ward of Tzeentch (Eye of Gods)',
          expiresRound: expiresRound
        };
        updated.appliedModifiers = [...(updated.appliedModifiers || []), newMod];
        updated.logs.unshift(`🔮 ${uRules.name} ascended: Gained Ward of Tzeentch (Eye of Gods)!`);
      } else if (eyeOfTheGodsSelectedReward === 'run') {
        const newMod = {
          id: `eyeOfTheGods-run-${unitId}-${Date.now()}`,
          unitId: unitId,
          stat: 'run' as const,
          modifier: 1,
          label: 'Grace of Slaanesh (+1 Run) (Eye of Gods)',
          expiresRound: expiresRound
        };
        updated.appliedModifiers = [...(updated.appliedModifiers || []), newMod];
        updated.logs.unshift(`🔮 ${uRules.name} ascended: Gained Grace of Slaanesh (+1 Run) (Eye of Gods)!`);
      } else if (eyeOfTheGodsSelectedReward === 'wound') {
        const newMod = {
          id: `eyeOfTheGods-wound-${unitId}-${Date.now()}`,
          unitId: unitId,
          stat: 'wound' as const,
          modifier: -1, // Subtracts 1 from target's wound rolls
          label: 'Blessing of Nurgle (Eye of Gods)',
          expiresRound: expiresRound
        };
        updated.appliedModifiers = [...(updated.appliedModifiers || []), newMod];
        updated.logs.unshift(`🔮 ${uRules.name} ascended: Gained Blessing of Nurgle (Eye of Gods)!`);
      } else if (eyeOfTheGodsSelectedReward === 'rend') {
        const newMod = {
          id: `eyeOfTheGods-rend-${unitId}-${Date.now()}`,
          unitId: unitId,
          stat: 'rend' as const,
          modifier: 1,
          label: 'Fury of Khorne (Eye of Gods)',
          expiresRound: expiresRound
        };
        updated.appliedModifiers = [...(updated.appliedModifiers || []), newMod];
        updated.logs.unshift(`🔮 ${uRules.name} ascended: Gained Fury of Khorne (Eye of Gods)!`);
      }
    };

    if (eyeOfTheGodsModal.applyToAllUnits) {
      updated.units.filter(u => !u.isSlain).forEach(u => {
        applyRewardToUnit(u.id);
      });
      updated.logs.unshift(`🌟 Favoured of the Pantheon applied blessings to ALL units!`);
    } else {
      applyRewardToUnit(eyeOfTheGodsSelectedUnitId);
    }

    // Mark source ability as used if provided
    if (eyeOfTheGodsModal.sourceAbilityId) {
      updated.usedAbilities[eyeOfTheGodsModal.sourceAbilityId] = true;
    }

    saveGame(updated);
    showToast('Ascension blessing applied successfully!', 'success');
    
    // Clear selection
    setEyeOfTheGodsModal(null);
    setEyeOfTheGodsSelectedUnitId('');
    setEyeOfTheGodsSelectedReward('');
  };

  // COMBAT PHASE CUSTOM RENDER SECTIONS
  const renderCombatActiveStrategy = () => {
    const abilities = getAbilitiesForPhase('combat');
    const unitAbilities = gameState.units.filter(u => !u.isSlain).flatMap((u, uIdx) => {
      const uRules = faction.units.find(rules => rules.id === u.unitId);
      if (!uRules) return [];
      return getUnitAbilitiesForPhase(uRules, 'combat').map(ability => ({
        ...ability,
        unitName: uRules.name,
        unitId: u.id,
        instanceKey: `${u.id}-${ability.id}`
      }));
    });

    if (abilities.length === 0 && unitAbilities.length === 0) return null;

    return (
      <Card className="border-[#222834] bg-[#151923] text-white">
        <CardHeader className="border-b border-[#222834] py-3.5">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" /> 
              My Active Strategy (Combat Phase)
            </CardTitle>
            <Badge variant="outline" className="uppercase text-[9px] border-amber-500/30 bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5">
              ACTIVE STRATEGY
            </Badge>
          </div>
          <CardDescription className="text-xxs text-gray-400 mt-0.5">
            Use these strategy abilities when you resolve your combat actions. Click to mark as triggered.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Faction-Level Strategy Cards */}
            {abilities.map(ability => {
              const isUsed = !!gameState.usedAbilities[ability.id];
              const style = getAbilityStyleClasses(ability.sourceType);
              return (
                <Card 
                  key={ability.id} 
                  onClick={() => toggleAbilityUsed(ability.id, ability.name, ability.effect, 'combat')}
                  className={`cursor-pointer transition-all duration-300 relative overflow-hidden text-white border
                    ${isUsed 
                      ? 'bg-zinc-800/30 border-transparent saturate-0 opacity-40' 
                      : `${style.bg} ${style.border} hover:scale-[1.01]`}`}
                >
                  <CardHeader className="p-4 pb-1">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-wider py-0 px-1.5 rounded mb-1 border ${style.badgeBg}`}>
                          {style.label}
                        </Badge>
                        <CardTitle className="text-xs font-bold text-white">{ability.name}</CardTitle>
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
            })}

            {/* Unit-Specific Strategy Cards */}
            {unitAbilities.map(ability => {
              const isUsed = !!gameState.usedAbilities[ability.instanceKey];
              const style = getAbilityStyleClasses(ability.sourceType);
              return (
                <Card 
                  key={ability.instanceKey} 
                  onClick={() => toggleAbilityUsed(ability.instanceKey, `${ability.unitName}: ${ability.name}`, ability.effect, 'combat')}
                  className={`cursor-pointer transition-all duration-300 relative overflow-hidden text-white border
                    ${isUsed 
                      ? 'bg-zinc-800/30 border-transparent saturate-0 opacity-40' 
                      : `${style.bg} ${style.border} hover:scale-[1.01]`}`}
                >
                  <CardHeader className="p-4 pb-1">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-wider py-0 px-1.5 rounded border ${style.badgeBg}`}>
                            {style.label}
                          </Badge>
                          <span className="text-[9px] font-extrabold text-amber-500 uppercase tracking-wider">{ability.unitName}</span>
                        </div>
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
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCombatDefensiveResponses = () => {
    const defAbilities: { source: string; name: string; timing?: string; effect: string; id: string; key: string }[] = [];
    
    // Faction defensive abilities
    if (gameState.selectedBattleTraitId === 'all') {
      faction.battleTraits.forEach(a => {
        if (a.isDefense && (a.phase === 'combat' || a.phase === 'passive')) {
          defAbilities.push({ source: 'Faction Trait', name: a.name, timing: a.timing, effect: a.effect, id: a.id, key: a.id });
        }
      });
    } else {
      const trait = faction.battleTraits.find(a => a.id === gameState.selectedBattleTraitId);
      if (trait && trait.isDefense && (trait.phase === 'combat' || trait.phase === 'passive')) {
        defAbilities.push({ source: 'Faction Trait', name: trait.name, timing: trait.timing, effect: trait.effect, id: trait.id, key: trait.id });
      }
    }

    const regiment = faction.regimentAbilities.find(a => a.id === gameState.selectedRegimentAbilityId);
    if (regiment && regiment.isDefense && (regiment.phase === 'combat' || regiment.phase === 'passive')) {
      defAbilities.push({ source: 'Regiment', name: regiment.name, timing: regiment.timing, effect: regiment.effect, id: regiment.id, key: regiment.id });
    }

    const enhancement = faction.enhancements.find(a => a.id === gameState.selectedEnhancementId);
    if (enhancement && enhancement.isDefense && (enhancement.phase === 'combat' || enhancement.phase === 'passive')) {
      defAbilities.push({ source: 'Enhancement', name: enhancement.name, timing: enhancement.timing, effect: enhancement.effect, id: enhancement.id, key: enhancement.id });
    }

    // Unit specific defensive abilities
    gameState.units.filter(u => !u.isSlain).forEach(u => {
      const uRules = faction.units.find(r => r.id === u.unitId);
      if (uRules) {
        uRules.abilities.forEach(a => {
          if (a.isDefense && (a.phase === 'combat' || a.phase === 'passive')) {
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

        // Append active Eye of the Gods defensive blessings or Shining Company (Facet of War)
        if (gameState.appliedModifiers) {
          gameState.appliedModifiers.forEach(mod => {
            if (mod.unitId === u.id && (mod.label.includes('Nurgle') || mod.label.includes('Tzeentch') || mod.label.includes('Shining Company'))) {
              defAbilities.push({
                source: uRules.name,
                name: mod.label,
                timing: 'Passive (Defensive)',
                effect: mod.label.includes('Nurgle')
                  ? 'Subtract 1 from wound rolls targeting this unit.'
                  : mod.label.includes('Shining Company')
                  ? 'Subtract 1 from hit rolls for attacks targeting this unit.'
                  : 'This unit has a 6+ ward roll.',
                id: mod.id,
                key: mod.id
              });
            }
          });
        }
      }
    });

    if (defAbilities.length === 0) return null;

    return (
      <Card className="border-[#222834] bg-[#151923] text-white">
        <CardHeader className="border-b border-[#222834] py-3.5">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-rose-400">
              <Shield className="h-4.5 w-4.5 text-rose-500 animate-pulse" /> 
              Available Combat Defensive Responses
            </CardTitle>
            <Badge variant="outline" className="uppercase text-[9px] border-rose-500/30 bg-rose-500/10 text-rose-400 font-bold px-2 py-0.5">
              DEFENSIVE REACTIONS
            </Badge>
          </div>
          <CardDescription className="text-xxs text-gray-400 mt-0.5">
            Trigger these defensive actions and reactions to mitigate incoming damage when your units are attacked.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {defAbilities.map(ab => {
              const isUsed = !!gameState.usedAbilities[ab.key];
              return (
                <Card 
                  key={ab.key} 
                  onClick={() => toggleAbilityUsed(ab.key, `${ab.source}: ${ab.name}`, ab.effect, 'combat')}
                  className={`cursor-pointer transition-all duration-300 relative overflow-hidden text-white border p-3.5 space-y-1.5
                    ${isUsed 
                      ? 'bg-zinc-800/30 border-transparent saturate-0 opacity-40' 
                      : 'bg-[#1c2230] border-rose-500/25 hover:border-rose-500/50 hover:scale-[1.01] shadow-md'}`}
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
        </CardContent>
      </Card>
    );
  };

  const renderCombatUnitActivations = () => {
    return (
      <Card className="border-[#222834] bg-[#151923] text-white">
        <CardHeader className="border-b border-[#222834] py-3.5">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-rose-400">
              <Swords className="h-4.5 w-4.5 text-rose-400" /> My Melee Combat Activations
            </CardTitle>
            <Badge variant="outline" className="uppercase text-[9px] border-rose-500/30 bg-rose-500/10 text-rose-400 font-bold px-2 py-0.5">
              UNIT STATS & FIGHTS
            </Badge>
          </div>
          <CardDescription className="text-xxs text-gray-400 mt-0.5">
            Resolve melee attacks for your active units. Track health, models, and toggle "Fight" upon activation.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameState.units.filter(u => !u.isSlain).map((u) => {
              const uRules = faction.units.find(rules => rules.id === u.unitId);
              if (!uRules) return null;

              // Collect active modifiers and buffs for this unit
              const activeBuffs: { id?: string; label: string; modifier: number; stat?: string }[] = [];

              if (gameState.appliedModifiers) {
                gameState.appliedModifiers.forEach(mod => {
                  if (mod.unitId === u.id) {
                    activeBuffs.push({
                      id: mod.id,
                      label: mod.label,
                      modifier: mod.modifier,
                      stat: mod.stat
                    });
                  }
                });
              }

              // Check selected general enhancement or other traits that apply dynamically
              if (gameState.selectedEnhancementId === 'markOfKhorne' && uRules.isHero && u.charged) {
                activeBuffs.push({
                  label: 'Mark of Khorne (+1 Rend on Charge)',
                  modifier: 1
                });
              }

              // Faction trait / regiment abilities that are active
              if (gameState.selectedBattleTraitId && gameState.selectedBattleTraitId !== '') {
                const trait = faction.battleTraits.find(t => t.id === gameState.selectedBattleTraitId);
                if (trait && trait.effect && (trait.effect.toLowerCase().includes('melee') || trait.effect.toLowerCase().includes('combat'))) {
                  if (!trait.effect.toLowerCase().includes('hero') || uRules.isHero) {
                    activeBuffs.push({
                      label: `${trait.name} (Active Battle Trait)`,
                      modifier: 0,
                    });
                  }
                }
              }

              return (
                <div key={u.id} className={`p-4 rounded-xl border transition-all flex flex-col gap-3
                  ${u.fought 
                    ? 'bg-[#181d29]/20 border-transparent opacity-40 saturate-0' 
                    : 'bg-[#1c2230] border-[#2c3548] hover:border-amber-500/40'}`}>
                  
                  <div className="flex justify-between items-start gap-2 border-b border-[#2c3548]/40 pb-2">
                    <div>
                      <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                        {uRules.name}
                        {uRules.isHero && (
                          <>
                            <Badge className="bg-amber-500/20 text-amber-400 text-[8px] font-bold border border-amber-500/20">HERO / GENERAL</Badge>
                            {(() => {
                              const cb = getCastingRollBonus();
                              if (cb) {
                                return (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase tracking-wider select-none flex items-center gap-1">
                                    🔮 +{cb.value} CASTING ROLL
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
                          </>
                        )}
                      </h5>
                      <div className="text-xxs text-amber-500 font-semibold flex items-center gap-2 flex-wrap mt-0.5">
                        <span className="flex items-center gap-1">Save: {renderStatWithModifier(uRules.save, 'save', u.id, '+')}</span>
                        {(uRules.ward > 0 || getActiveModifiers('ward', u.id).length > 0 || uRules.id === 'vanariBladelords' || (uRules.isHero && gameState?.units?.some(unit => unit.unitId === 'vanariBladelords' && !unit.isSlain))) && (
                          <span className="flex items-center gap-1">| Ward: {renderStatWithModifier(uRules.ward || 0, 'ward', u.id)}</span>
                        )}
                      </div>
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

                  {/* ACTIVE APPLIED BUFFS SUMMARY - STUNNING VERTICAL LINE-BY-LINE COMPONENT */}
                  {activeBuffs.length > 0 ? (
                    <div className="p-2 bg-[#151923]/40 border border-[#2c3548]/30 rounded-lg space-y-1.5">
                      <span className="text-[9px] text-amber-500/80 font-black uppercase tracking-widest block mb-1">✨ Active Buffs & Applied Modifiers:</span>
                      <div className="flex flex-col gap-1">
                        {activeBuffs.map((buff, bIdx) => (
                          <div 
                            key={bIdx} 
                            className="text-[10px] font-semibold text-amber-400 px-2.5 py-1.5 flex items-center justify-between bg-amber-500/5 border border-amber-500/15 rounded-md hover:bg-amber-500/10 transition-all"
                          >
                            <span className="truncate pr-2">{buff.label}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              {buff.modifier !== 0 && (
                                <Badge className="bg-amber-500/15 text-amber-300 font-extrabold text-[9px] px-1.5 py-0 border-none">
                                  {buff.modifier > 0 ? `+${buff.modifier}` : buff.modifier} {buff.stat ? (buff.stat === 'hit' ? 'to Hit' : buff.stat === 'wound' ? 'to Wound' : buff.stat.charAt(0).toUpperCase() + buff.stat.slice(1)) : ''}
                                </Badge>
                              )}
                              {buff.id && (
                                <button 
                                  onClick={() => removeBuff(buff.id!)} 
                                  className="text-gray-500 hover:text-red-400 p-0.5 rounded transition-all focus:outline-none font-bold text-xs"
                                  title="Delete Buff"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-[#151923]/20 border border-[#2c3548]/10 rounded-lg text-left">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">No active modifiers applied to this unit.</span>
                    </div>
                  )}

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
                            <span className="font-black text-xs text-white">{renderStatWithModifier(w.attacks, 'attacks', u.id, '', w.name)}</span>
                          </div>

                          {/* Hit stat */}
                          <div className="col-span-2 flex justify-between items-center bg-amber-950/30 border border-amber-500/20 rounded px-2 py-1 text-amber-400">
                            <span className="text-gray-400 font-bold text-[9px] uppercase">Hit</span>
                            <span className="font-black text-xs text-white">{renderStatWithModifier(w.hit, 'hit', u.id, '+')}</span>
                          </div>

                          {/* Wound stat */}
                          <div className="col-span-2 flex justify-between items-center bg-orange-950/30 border border-orange-500/20 rounded px-2 py-1 text-orange-400">
                            <span className="text-gray-400 font-bold text-[9px] uppercase">Wound</span>
                            <span className="font-black text-xs text-white">{renderStatWithModifier(w.wound, 'wound', u.id, '+')}</span>
                          </div>

                          {/* Rend stat */}
                          <div className="col-span-3 flex justify-between items-center bg-blue-950/30 border border-blue-500/20 rounded px-2 py-1 text-blue-400">
                            <span className="text-gray-400 font-bold text-[9px] uppercase">Rend</span>
                            <span className="font-black text-xs text-white">-{renderStatWithModifier(w.rend, 'rend', u.id, '', w.name)}</span>
                          </div>

                          {/* Damage stat */}
                          <div className="col-span-3 flex justify-between items-center bg-rose-950/30 border border-rose-500/20 rounded px-2 py-1 text-rose-400">
                            <span className="text-gray-400 font-bold text-[9px] uppercase">Damage</span>
                            <span className="font-black text-xs text-white">{renderStatWithModifier(w.damage, 'damage', u.id, '', w.name)}</span>
                          </div>

                          {/* Ability box */}
                          {w.abilities && (
                            <div className="col-span-6 flex flex-col bg-indigo-950/30 border border-indigo-500/20 rounded p-1.5 text-left text-indigo-300">
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Ability:</span>
                              <span className="text-xxs font-medium text-indigo-200 mt-0.5">{w.abilities}</span>
                            </div>
                          )}

                          {/* Dynamic Dice Math calculation */}
                          {(() => {
                            const currentModels = u.modelsCount !== undefined ? u.modelsCount : (uRules.models || 1);
                            const attacksMods = getActiveModifiers('attacks', u.id, w.name);
                            const totalAttacksMod = attacksMods.reduce((acc, m) => acc + m.modifier, 0);
                            
                            const overrideVal = getBattleDamagedOverride(u.id, 'attacks', w.name);
                            const baseAttacks = overrideVal !== null ? overrideVal : (parseInt(String(w.attacks), 10) || 0);
                            const effectiveAttacks = overrideVal !== null ? overrideVal : calculateStatValue(baseAttacks, 'attacks', totalAttacksMod).modifiedNum;
                            const totalDice = currentModels * effectiveAttacks;
                            return (
                              <div className="col-span-6 flex items-center justify-between text-[11px] bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5 mt-1 select-none">
                                <span className="text-gray-400 font-extrabold uppercase tracking-widest text-[9px]">🎲 Dice Math:</span>
                                <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                                  <span>{totalDice} Dice</span>
                                  <span className="text-gray-500 font-semibold">({currentModels} models × {effectiveAttacks} attacks)</span>
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Unit Passives inside the unit box */}
                  {(() => {
                    const unitPassives = getUnitPassiveAbilitiesForPhase(uRules, 'combat');
                    if (unitPassives.length === 0) return null;
                    return (
                      <div className="mt-2.5 p-3 bg-emerald-950/15 border border-emerald-500/20 rounded-xl space-y-2 text-left">
                        <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3 text-emerald-400 animate-pulse" /> Unit Passives (Combat)
                        </span>
                        <div className="space-y-2">
                          {unitPassives.map((ab) => (
                            <div key={ab.id} className="border-t border-emerald-500/10 pt-1.5 first:border-t-0 first:pt-0">
                              <h5 className="text-xxs font-black text-white">{ab.name}</h5>
                              <p className="text-[10px] text-gray-300 mt-0.5 whitespace-pre-line leading-normal">{ab.effect}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCombatPassiveRules = () => {
    const factionPassives = getPassiveAbilitiesForPhase('combat');
    const unitPassives = gameState.units.filter(u => !u.isSlain).flatMap(u => {
      const uRules = faction.units.find(rules => rules.id === u.unitId);
      return uRules ? getUnitPassiveAbilitiesForPhase(uRules, 'combat').map(ab => ({ ...ab, unitName: uRules.name })) : [];
    });

    if (factionPassives.length === 0 && unitPassives.length === 0) return null;

    return (
      <Card className="border-[#222834] bg-[#151923] text-white">
        <CardHeader className="border-b border-[#222834] py-3.5">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-cyan-400">
              <Sparkles className="h-4.5 w-4.5 text-cyan-400 animate-pulse" /> 
              🧬 Phase-Applied Passive Rules (Combat Phase)
            </CardTitle>
            <Badge variant="outline" className="uppercase text-[9px] border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-bold px-2 py-0.5">
              ALWAYS ACTIVE
            </Badge>
          </div>
          <CardDescription className="text-xxs text-gray-400 mt-0.5">
            These passive rules are always active during the combat phase and do not need to be triggered.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Faction-Level Passives */}
            {factionPassives.map(ability => {
              const style = getAbilityStyleClasses(ability.sourceType);
              return (
                <Card key={ability.id} className={`${style.bg} ${style.border} text-white shadow-lg border`}>
                  <CardHeader className="p-4 pb-1">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-wider py-0 px-1.5 rounded mb-1 border ${style.badgeBg}`}>
                          {style.label}
                        </Badge>
                        <CardTitle className="text-xs font-bold text-white">{ability.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 text-[9px] uppercase shrink-0">
                        FACTION PASSIVE
                      </Badge>
                    </div>
                    {ability.timing && <CardDescription className="text-xxs text-cyan-400/80 mt-0.5">{ability.timing}</CardDescription>}
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <p className="text-xxs text-gray-300 leading-normal whitespace-pre-line">{ability.effect}</p>
                  </CardContent>
                </Card>
              );
            })}

            {/* Unit-Level Passives */}
            {unitPassives.map((ability, idx) => {
              return (
                <Card key={idx} className="bg-[#1c2230] border-[#2c3548] text-white shadow-lg border">
                  <CardHeader className="p-4 pb-1">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-wider block">{ability.unitName}</span>
                        <CardTitle className="text-xs font-bold text-white mt-0.5">{ability.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[9px] uppercase shrink-0">
                        UNIT PASSIVE
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <p className="text-xxs text-gray-300 leading-normal whitespace-pre-line">{ability.effect}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };
  const renderNonCombatActiveStrategy = () => {
    if (gameState.currentPhase === 'combat') return null;

    const factionAbilities = getAbilitiesForPhase(gameState.currentPhase);
    const unitAbilities = gameState.units.filter(u => !u.isSlain).flatMap((u) => {
      const uRules = faction.units.find(rules => rules.id === u.unitId);
      if (!uRules) return [];
      return getUnitAbilitiesForPhase(uRules, gameState.currentPhase).map(ab => ({ ...ab, unitId: u.id, unitName: uRules.name }));
    });

    if (factionAbilities.length === 0 && unitAbilities.length === 0) return null;

    return (
      <div className="space-y-4 bg-[#11141c]/40 border border-[#222834]/50 p-4 rounded-2xl">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-4.5 w-4.5 text-amber-500" /> 
            {gameState.activeTurn === 'me' ? 'My Active Strategy' : 'My Defensive Reactions'} ({phases[currentPhaseIndex].name})
          </h3>
          <Badge variant="outline" className={`uppercase text-xxs border-transparent font-bold
            ${gameState.activeTurn === 'me' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-400'}`}
          >
            {gameState.activeTurn === 'me' ? 'ACTIVE' : 'REACTIVE'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Faction-Level Strategy Cards */}
          {factionAbilities.map(ability => {
            const isUsed = !!gameState.usedAbilities[ability.id];
            const style = getAbilityStyleClasses(ability.sourceType);
            return (
              <Card 
                key={ability.id} 
                onClick={() => toggleAbilityUsed(ability.id, ability.name, ability.effect, ability.phase !== 'passive' ? ability.phase : gameState.currentPhase)}
                className={`cursor-pointer transition-all duration-300 relative overflow-hidden text-white border
                  ${isUsed 
                    ? 'bg-zinc-800/30 border-transparent saturate-0 opacity-40' 
                    : `${style.bg} ${style.border} hover:scale-[1.01]`}`}
              >
                <CardHeader className="p-4 pb-1">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-wider py-0 px-1.5 rounded mb-1 border ${style.badgeBg}`}>
                        {style.label}
                      </Badge>
                      <CardTitle className="text-xs font-bold text-white">{ability.name}</CardTitle>
                    </div>
                    {ability.once !== 'none' && (
                      <Badge variant="secondary" className="bg-[#151923] text-amber-400 text-xxs uppercase shrink-0 font-bold">
                        {ability.once.replace('-', ' ')}
                      </Badge>
                    )}
                  </div>
                  {ability.timing && <CardDescription className="text-xxs text-amber-400/80 mt-0.5 font-semibold">{ability.timing}</CardDescription>}
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <p className="text-xxs text-gray-400 leading-normal whitespace-pre-line font-medium">{ability.effect}</p>
                </CardContent>
                {isUsed && (
                  <div className="absolute inset-0 bg-[#0d1015]/10 flex items-center justify-center">
                    <span className="text-xs font-black text-gray-400 uppercase rotate-[-8deg] tracking-widest bg-zinc-900/90 px-2 py-0.5 rounded border border-gray-700">USED</span>
                  </div>
                )}
              </Card>
            );
          })}

          {/* Unit-Specific Strategy Cards */}
          {unitAbilities.map(ability => {
            const instanceKey = `${ability.unitId}-${ability.id}`;
            const isUsed = !!gameState.usedAbilities[instanceKey];
            const style = getAbilityStyleClasses(ability.sourceType);
            return (
              <Card 
                key={instanceKey} 
                onClick={() => toggleAbilityUsed(instanceKey, `${ability.unitName}: ${ability.name}`, ability.effect, ability.phase !== 'passive' ? ability.phase : gameState.currentPhase)}
                className={`cursor-pointer transition-all duration-300 relative overflow-hidden text-white border
                  ${isUsed 
                    ? 'bg-zinc-800/30 border-transparent saturate-0 opacity-40' 
                    : `${style.bg} ${style.border} hover:scale-[1.01]`}`}
              >
                <CardHeader className="p-4 pb-1">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-wider py-0 px-1.5 rounded border ${style.badgeBg}`}>
                          {style.label}
                        </Badge>
                        <span className="text-[9px] font-extrabold text-amber-500 uppercase tracking-wider">{ability.unitName}</span>
                      </div>
                      <CardTitle className="text-xs font-bold text-white mt-0.5">{ability.name}</CardTitle>
                    </div>
                    {ability.once !== 'none' && (
                      <Badge variant="secondary" className="bg-[#151923] text-amber-400 text-xxs uppercase shrink-0 font-bold">
                        {ability.once.replace('-', ' ')}
                      </Badge>
                    )}
                  </div>
                  {ability.timing && <CardDescription className="text-xxs text-amber-400/80 mt-0.5 font-semibold">{ability.timing}</CardDescription>}
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <p className="text-xxs text-gray-400 leading-normal whitespace-pre-line font-medium">{ability.effect}</p>
                </CardContent>
                {isUsed && (
                  <div className="absolute inset-0 bg-[#0d1015]/10 flex items-center justify-center">
                    <span className="text-xs font-black text-gray-400 uppercase rotate-[-8deg] tracking-widest bg-zinc-900/90 px-2 py-0.5 rounded border border-gray-700">USED</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
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
            
            {renderNonCombatActiveStrategy()}
            
            {/* Specialized Tactically Interactive Phase Widgets */}

            {/* 🛡️ OPPONENT ATTACK & DEFENSIVE ROSTER DASHBOARD */}
            {gameState.activeTurn === 'opponent' && gameState.currentPhase !== 'combat' && (
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

                        // Append active Eye of the Gods defensive blessings or Shining Company (Facet of War)
                        if (gameState.appliedModifiers) {
                          gameState.appliedModifiers.forEach(mod => {
                            if (mod.unitId === u.id && (mod.label.includes('Nurgle') || mod.label.includes('Tzeentch') || mod.label.includes('Shining Company'))) {
                              defAbilities.push({
                                source: uRules.name,
                                name: mod.label,
                                timing: 'Passive (Defensive)',
                                effect: mod.label.includes('Nurgle')
                                  ? 'Subtract 1 from wound rolls targeting this unit.'
                                  : mod.label.includes('Shining Company')
                                  ? 'Subtract 1 from hit rolls for attacks targeting this unit.'
                                  : 'This unit has a 6+ ward roll.',
                                id: mod.id,
                                key: mod.id
                              });
                            }
                          });
                        }
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
                                onClick={() => toggleAbilityUsed(ab.key, `${ab.source}: ${ab.name}`, ab.effect, gameState.currentPhase)}
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
                                <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                                  {uRules.name}
                                  {uRules.isHero && (
                                    <Badge className="bg-amber-500/20 text-amber-400 text-[8px] font-bold border border-amber-500/20">HERO / GENERAL</Badge>
                                  )}
                                  {uRules.isHero && (() => {
                                    const cb = getCastingRollBonus();
                                    return cb ? (
                                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase tracking-wider select-none flex items-center gap-1">
                                        🔮 +{cb.value} CAST
                                      </Badge>
                                    ) : null;
                                  })()}
                                </h5>
                                <div className="flex gap-2 items-center mt-1 flex-wrap">
                                  <Badge className="bg-blue-600/15 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase flex items-center gap-1">
                                    <span>SAVE:</span>
                                    {renderStatWithModifier(uRules.save, 'save', u.id, '+')}
                                  </Badge>
                                  {uRules.ward > 0 || getActiveModifiers('ward', u.id).length > 0 || uRules.id === 'vanariBladelords' || (uRules.isHero && gameState?.units?.some(unit => unit.unitId === 'vanariBladelords' && !unit.isSlain)) ? (
                                    <Badge className="bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase flex items-center gap-1">
                                      <span>WARD:</span>
                                      {renderStatWithModifier(uRules.ward || 0, 'ward', u.id)}
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

                            {/* Active Buffs Section */}
                            {!u.isSlain && (
                              <div className="border-t border-[#222834]/30 pt-2.5">
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest flex items-center gap-1">
                                    <span>✨ Active Modifiers / Buffs:</span>
                                  </span>
                                  <Button
                                    onClick={() => setBuffModal({ isOpen: true, unitId: u.id, unitName: uRules.name })}
                                    size="sm"
                                    className="h-6 text-[9px] font-black uppercase bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2 py-0"
                                  >
                                    ➕ Apply Buff
                                  </Button>
                                </div>
                                
                                {gameState.appliedModifiers && gameState.appliedModifiers.filter(m => m.unitId === u.id).length > 0 ? (
                                  <div className="flex gap-1.5 flex-wrap">
                                    {gameState.appliedModifiers.filter(m => m.unitId === u.id).map(mod => (
                                      <Badge
                                        key={mod.id}
                                        className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[10px] py-0.5 px-2 flex items-center gap-1 font-semibold"
                                      >
                                        <span>
                                          {mod.label}
                                          {mod.modifier !== 0 ? ` (${mod.modifier > 0 ? `+${mod.modifier}` : mod.modifier} ${mod.stat === 'hit' ? 'to Hit' : mod.stat === 'wound' ? 'to Wound' : mod.stat.charAt(0).toUpperCase() + mod.stat.slice(1)})` : ''}
                                        </span>
                                        <button
                                          onClick={() => removeBuff(mod.id)}
                                          className="text-emerald-400 hover:text-red-400 font-bold ml-1 text-xs shrink-0 select-none"
                                        >
                                          ×
                                        </button>
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-gray-500 font-medium italic">No active buffs applied</p>
                                )}
                              </div>
                            )}

                            {/* Unit Passives inside defensive card */}
                            {(() => {
                              const unitPassives = getUnitPassiveAbilitiesForPhase(uRules, gameState.currentPhase);
                              if (unitPassives.length === 0) return null;
                              return (
                                <div className="mt-2.5 p-3 bg-emerald-950/15 border border-emerald-500/20 rounded-xl space-y-2 text-left">
                                  <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                                    <Sparkles className="h-3 w-3 text-emerald-400 animate-pulse" /> Unit Passives (Defense)
                                  </span>
                                  <div className="space-y-2">
                                    {unitPassives.map((ab) => (
                                      <div key={ab.id} className="border-t border-emerald-500/10 pt-1.5 first:border-t-0 first:pt-0">
                                        <h5 className="text-xxs font-black text-white">{ab.name}</h5>
                                        <p className="text-[10px] text-gray-300 mt-0.5 whitespace-pre-line leading-normal">{ab.effect}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
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
                          <div className="text-xxs text-gray-400 flex flex-col gap-0.5">
                            <div className="flex items-center gap-1">
                              <span>Move:</span>
                              {renderStatWithModifier(uRules.move, 'move', u.id, '"')}
                            </div>
                            {(() => {
                              const runMods = getActiveModifiers('run', u.id);
                              if (runMods.length > 0) {
                                return (
                                  <div className="text-emerald-400 font-extrabold text-[10px] flex items-center gap-0.5 mt-0.5">
                                    <Sparkles className="h-2.5 w-2.5 animate-pulse" /> +1 to Run Rolls active
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
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
                                  <span className="font-black text-xs text-white">{renderStatWithModifier(w.attacks, 'attacks', u.id, '', w.name)}</span>
                                </div>

                                {/* Hit stat */}
                                <div className="col-span-2 flex justify-between items-center bg-amber-950/30 border border-amber-500/20 rounded px-2.5 py-1.5 text-amber-400">
                                  <span className="text-gray-400 font-bold text-[10px] uppercase">Hit</span>
                                  <span className="font-black text-xs text-white">{renderStatWithModifier(w.hit, 'hit', u.id, '+')}</span>
                                </div>

                                {/* Wound stat */}
                                <div className="col-span-2 flex justify-between items-center bg-orange-950/30 border border-orange-500/20 rounded px-2.5 py-1.5 text-orange-400">
                                  <span className="text-gray-400 font-bold text-[10px] uppercase">Wound</span>
                                  <span className="font-black text-xs text-white">{renderStatWithModifier(w.wound, 'wound', u.id, '+')}</span>
                                </div>

                                {/* Rend stat */}
                                <div className="col-span-2 flex justify-between items-center bg-blue-950/30 border border-blue-500/20 rounded px-2.5 py-1.5 text-blue-400">
                                  <span className="text-gray-400 font-bold text-[10px] uppercase">Rend</span>
                                  <span className="font-black text-xs text-white">-{renderStatWithModifier(w.rend, 'rend', u.id)}</span>
                                </div>

                                {/* Damage stat */}
                                <div className="col-span-2 flex justify-between items-center bg-rose-950/30 border border-rose-500/20 rounded px-2.5 py-1.5 text-rose-400">
                                  <span className="text-gray-400 font-bold text-[10px] uppercase">Damage</span>
                                  <span className="font-black text-xs text-white">{renderStatWithModifier(w.damage, 'damage', u.id, '', w.name)}</span>
                                </div>

                                {/* Ability box */}
                                {w.abilities && (
                                  <div className="col-span-6 flex flex-col bg-indigo-950/30 border border-indigo-500/20 rounded p-2 text-left text-indigo-300">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ability:</span>
                                    <span className="text-xs font-medium text-indigo-200 mt-0.5">{w.abilities}</span>
                                  </div>
                                )}

                                {/* Dynamic Dice Math calculation */}
                                {(() => {
                                  const currentModels = u.modelsCount !== undefined ? u.modelsCount : (uRules.models || 1);
                                  const attacksMods = getActiveModifiers('attacks', u.id);
                                  const totalAttacksMod = attacksMods.reduce((acc, m) => acc + m.modifier, 0);
                                  
                                  const overrideVal = getBattleDamagedOverride(u.id, 'attacks', w.name);
                                  const baseAttacks = overrideVal !== null ? overrideVal : (parseInt(String(w.attacks), 10) || 0);
                                  const effectiveAttacks = overrideVal !== null ? overrideVal : calculateStatValue(baseAttacks, 'attacks', totalAttacksMod).modifiedNum;
                                  const totalDice = currentModels * effectiveAttacks;
                                  return (
                                    <div className="col-span-6 flex items-center justify-between text-[11px] bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5 mt-1 select-none">
                                      <span className="text-gray-400 font-extrabold uppercase tracking-widest text-[9px]">🎲 Dice Math:</span>
                                      <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                                        <span>{totalDice} Dice</span>
                                        <span className="text-gray-500 font-semibold">({currentModels} models × {effectiveAttacks} attacks)</span>
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Unit Passives inside the unit box */}
                        {(() => {
                          const unitPassives = getUnitPassiveAbilitiesForPhase(uRules, gameState.currentPhase);
                          if (unitPassives.length === 0) return null;
                          return (
                            <div className="mt-2.5 p-3 bg-emerald-950/15 border border-emerald-500/20 rounded-xl space-y-2 text-left">
                              <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                                <Sparkles className="h-3 w-3 text-emerald-400 animate-pulse" /> Unit Passives (Shooting)
                              </span>
                              <div className="space-y-2">
                                {unitPassives.map((ab) => (
                                  <div key={ab.id} className="border-t border-emerald-500/10 pt-1.5 first:border-t-0 first:pt-0">
                                    <h5 className="text-xxs font-black text-white">{ab.name}</h5>
                                    <p className="text-[10px] text-gray-300 mt-0.5 whitespace-pre-line leading-normal">{ab.effect}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
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
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {u.ran && <Badge variant="destructive" className="text-xxs font-bold self-start">RAN (Cannot Charge)</Badge>}
                            {(() => {
                              const chargeMods = getActiveModifiers('charge');
                              if (chargeMods.length > 0 && !u.ran) {
                                return (
                                  <div className="text-emerald-400 font-extrabold text-[10px] flex items-center gap-0.5 self-start">
                                    <Sparkles className="h-2.5 w-2.5 animate-pulse" /> +1 to Charge Rolls active
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
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

            {/* COMBAT PHASE (DYNAMICALLY ORDERED TIMELINE & SECTIONS) */}
            {gameState.currentPhase === 'combat' && (
              <div className="space-y-6">
                {gameState.activeTurn === 'me' ? (
                  <>
                    {/* PLAYER ATTACKING ORDER:
                        1. Active Strategy
                        2. Unit stats/activations
                        3. Defensive responses
                        4. Passive rules */}
                    {renderCombatActiveStrategy()}
                    {renderCombatUnitActivations()}
                    {renderCombatDefensiveResponses()}
                    {renderCombatPassiveRules()}
                  </>
                ) : (
                  <>
                    {/* OPPONENT ATTACKING ORDER:
                        1. Defensive responses (reaction strategy)
                        2. Unit stats/activations
                        3. Active strategy (combat phase)
                        4. Passive rules */}
                    {renderCombatDefensiveResponses()}
                    {renderCombatUnitActivations()}
                    {renderCombatActiveStrategy()}
                    {renderCombatPassiveRules()}
                  </>
                )}
              </div>
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

            {/* 🧬 PHASE-APPLIED PASSIVE ABILITIES */}
            {gameState.currentPhase !== 'combat' && (getPassiveAbilitiesForPhase(gameState.currentPhase).length > 0 || 
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
                  {getPassiveAbilitiesForPhase(gameState.currentPhase).map(ability => {
                    const style = getAbilityStyleClasses(ability.sourceType);
                    return (
                      <Card key={ability.id} className={`${style.bg} ${style.border} text-white shadow-lg border`}>
                        <CardHeader className="p-4 pb-1">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-wider py-0 px-1.5 rounded mb-1 border ${style.badgeBg}`}>
                                {style.label}
                              </Badge>
                              <CardTitle className="text-xs font-bold text-white">{ability.name}</CardTitle>
                            </div>
                            <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 text-[9px] uppercase shrink-0">
                              FACTION PASSIVE
                            </Badge>
                          </div>
                          {ability.timing && <CardDescription className="text-xxs text-cyan-400/80 mt-0.5">{ability.timing}</CardDescription>}
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                          <p className="text-xxs text-gray-300 leading-normal whitespace-pre-line">{ability.effect}</p>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Unit-Specific Passives */}
                  {gameState.units.filter(u => !u.isSlain).flatMap((u) => {
                    const uRules = faction.units.find(rules => rules.id === u.unitId);
                    if (!uRules) return [];
                    return getUnitPassiveAbilitiesForPhase(uRules, gameState.currentPhase).map(ability => {
                      const style = getAbilityStyleClasses(ability.sourceType);
                      return (
                        <Card key={`${u.id}-${ability.id}`} className={`${style.bg} ${style.border} text-white shadow-lg border`}>
                          <CardHeader className="p-4 pb-1">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                  <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-wider py-0 px-1.5 rounded border ${style.badgeBg}`}>
                                    {style.label}
                                  </Badge>
                                  <span className="text-xxs font-black text-cyan-400 uppercase tracking-wider">{uRules.name}</span>
                                </div>
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
                      );
                    });
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
                    <CardContent className="p-4 space-y-3.5">
                      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-white">{uRules.name}</h4>
                            {uRules.isHero && (
                              <>
                                <Badge className="bg-amber-500/10 border-amber-500/20 text-amber-500 text-xxs font-black uppercase">Hero</Badge>
                                {(() => {
                                  const cb = getCastingRollBonus();
                                  if (cb) {
                                    return (
                                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase tracking-wider select-none flex items-center gap-1">
                                        🔮 +{cb.value} CAST
                                      </Badge>
                                    );
                                  }
                                  return null;
                                })()}
                              </>
                            )}
                          </div>
                          <p className="text-xxs text-gray-400 mt-1 leading-normal">
                            Move: {uRules.move}" • Save: {uRules.save}+ • Control: {uRules.control} • Max HP: {uRules.health}
                            {(uRules.ward > 0 || getActiveModifiers('ward', u.id).length > 0 || uRules.id === 'vanariBladelords' || (uRules.isHero && gameState?.units?.some(unit => unit.unitId === 'vanariBladelords' && !unit.isSlain))) && (
                              <span className="inline-flex items-center gap-1">
                                {' • Ward: '}
                                {renderStatWithModifier(uRules.ward || 0, 'ward', u.id)}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full xl:w-auto">
                          {/* Models Counter */}
                          <div className="flex items-center justify-between sm:justify-start bg-[#1c2230] p-1.5 rounded-lg border border-[#2c3548] flex-grow sm:flex-grow-0">
                            <button 
                              onClick={() => adjustModelsById(u.id, -1)}
                              className="px-2 py-0.5 hover:bg-[#2c3548] text-gray-400 font-bold text-xs rounded"
                            >
                              -
                            </button>
                            <span className="text-xxs font-bold text-gray-400 px-2 sm:w-20 text-center">
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
                          <div className="flex items-center justify-between sm:justify-start bg-[#1c2230] p-1.5 rounded-lg border border-[#2c3548] flex-grow sm:flex-grow-0">
                            <button 
                              onClick={() => adjustWoundsById(u.id, -1)}
                              className="px-2 py-0.5 hover:bg-[#2c3548] text-gray-400 font-bold text-xs rounded"
                            >
                              -
                            </button>
                            <span className="text-xxs font-bold text-gray-400 px-2 sm:w-24 text-center">
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
                      </div>

                      {/* Active Buffs Section */}
                      {!u.isSlain && (
                        <div className="border-t border-[#222834]/60 pt-2.5">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest flex items-center gap-1">
                              <span>✨ Active Modifiers / Buffs:</span>
                            </span>
                            <Button
                              onClick={() => setBuffModal({ isOpen: true, unitId: u.id, unitName: uRules.name })}
                              size="sm"
                              className="h-6 text-[9px] font-black uppercase bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2 py-0"
                            >
                              ➕ Apply Buff
                            </Button>
                          </div>
                          
                          {gameState.appliedModifiers && gameState.appliedModifiers.filter(m => m.unitId === u.id).length > 0 ? (
                            <div className="flex gap-1.5 flex-wrap">
                              {gameState.appliedModifiers.filter(m => m.unitId === u.id).map(mod => (
                                <Badge
                                  key={mod.id}
                                  className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[10px] py-0.5 px-2 flex items-center gap-1 font-semibold"
                                >
                                   <span>
                                    {mod.label}
                                    {mod.modifier !== 0 ? ` (${mod.modifier > 0 ? `+${mod.modifier}` : mod.modifier} ${mod.stat === 'hit' ? 'to Hit' : mod.stat === 'wound' ? 'to Wound' : mod.stat.charAt(0).toUpperCase() + mod.stat.slice(1)})` : ''}
                                   </span>
                                  <button
                                    onClick={() => removeBuff(mod.id)}
                                    className="text-emerald-400 hover:text-red-400 font-bold ml-1 text-xs shrink-0 select-none"
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-500 font-medium italic">No active buffs applied</p>
                          )}
                        </div>
                      )}
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

      {activePrompt && (
        <div className="fixed inset-0 bg-[#080a0f]/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-b from-[#1c2230] to-[#121620] border border-amber-500/30 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh] md:max-h-[75vh]">
            {/* Header */}
            <div className="p-4 border-b border-[#2c3548]/60 bg-amber-500/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
                <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-wider">
                  {activePrompt.title}
                </h3>
              </div>
              <button 
                onClick={activePrompt.onClose}
                className="text-gray-400 hover:text-white text-xs font-black p-1 hover:bg-[#2c3548]/50 rounded transition-all"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 flex-grow overflow-y-auto space-y-4 text-left">
              <p className="text-xxs md:text-xs text-gray-300 leading-relaxed font-medium bg-[#141822]/60 p-3 rounded-lg border border-[#2c3548]/30">
                {activePrompt.description}
              </p>

              <div className="space-y-2.5">
                <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                  📋 Directives to Resolve:
                </h4>
                {activePrompt.actions.map((act, index) => (
                  <div 
                    key={index} 
                    className="p-3 bg-[#131722]/80 border border-[#2c3548]/45 hover:border-amber-500/25 rounded-xl flex gap-3 items-start transition-all"
                  >
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-full h-5 w-5 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-amber-400">{index + 1}</span>
                    </div>
                    <p className="text-xxs md:text-xs text-gray-100 font-semibold leading-normal">
                      {act}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer button */}
            <div className="p-4 border-t border-[#2c3548]/50 bg-[#121620] flex justify-end">
              <Button 
                onClick={activePrompt.onClose}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs tracking-wider uppercase py-2.5 rounded-xl shadow-lg border-transparent transition-all flex items-center justify-center gap-1"
              >
                <Play className="h-3.5 w-3.5" /> Got it, Battle on!
              </Button>
            </div>
          </div>
        </div>
      )}

      {buffModal?.isOpen && (
        <div className="fixed inset-0 bg-[#080a0f]/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#151923] border border-amber-500/30 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-[#2c3548]/60 bg-amber-500/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Apply Buff: {buffModal.unitName}
                </h3>
              </div>
              <button 
                onClick={() => setBuffModal(null)}
                className="text-gray-400 hover:text-white text-xs font-black p-1 hover:bg-[#2c3548]/50 rounded transition-all"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-left">
              <p className="text-xxs text-gray-400 leading-relaxed font-medium">
                Choose a preconfigured stat modifier to apply to <strong className="text-white">{buffModal.unitName}</strong> for the rest of this Battle Round (Round {gameState.round}). It will automatically expire at the end of the round.
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {(!buffModal.allowedStats || buffModal.allowedStats.includes('attacks')) && (
                  <Button
                    onClick={() => {
                      applyBuff(buffModal.unitId, 'attacks', 1, '+1 Attacks', buffModal.expiresPhase);
                      setBuffModal(null);
                    }}
                    className="bg-[#1c2230] hover:bg-[#252c3d] border border-[#2c3548] text-white hover:text-emerald-400 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-between px-4"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">⚔️</span>
                      <span>Modify Attacks</span>
                    </span>
                    <Badge className="bg-emerald-500/15 text-emerald-400 font-extrabold">+1 Attacks</Badge>
                  </Button>
                )}

                {(!buffModal.allowedStats || buffModal.allowedStats.includes('save')) && (
                  <Button
                    onClick={() => {
                      applyBuff(buffModal.unitId, 'save', 1, '+1 Save', buffModal.expiresPhase);
                      setBuffModal(null);
                    }}
                    className="bg-[#1c2230] hover:bg-[#252c3d] border border-[#2c3548] text-white hover:text-blue-400 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-between px-4"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">🛡️</span>
                      <span>Modify Save Roll</span>
                    </span>
                    <Badge className="bg-blue-500/15 text-blue-400 font-extrabold">+1 Save</Badge>
                  </Button>
                )}

                {(!buffModal.allowedStats || buffModal.allowedStats.includes('ward')) && (
                  <Button
                    onClick={() => {
                      applyBuff(buffModal.unitId, 'ward', 1, '+1 Ward', buffModal.expiresPhase);
                      setBuffModal(null);
                    }}
                    className="bg-[#1c2230] hover:bg-[#252c3d] border border-[#2c3548] text-white hover:text-purple-400 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-between px-4"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">💖</span>
                      <span>Modify Ward Roll</span>
                    </span>
                    <Badge className="bg-purple-500/15 text-purple-400 font-extrabold">+1 Ward</Badge>
                  </Button>
                )}

                {(!buffModal.allowedStats || buffModal.allowedStats.includes('move')) && (
                  <Button
                    onClick={() => {
                      applyBuff(buffModal.unitId, 'move', 1, '+1" Move', buffModal.expiresPhase);
                      setBuffModal(null);
                    }}
                    className="bg-[#1c2230] hover:bg-[#252c3d] border border-[#2c3548] text-white hover:text-amber-400 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-between px-4"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">🏃‍♂️</span>
                      <span>Modify Movement</span>
                    </span>
                    <Badge className="bg-amber-500/15 text-amber-400 font-extrabold">+1" Move</Badge>
                  </Button>
                )}

                {(!buffModal.allowedStats || buffModal.allowedStats.includes('hit')) && (
                  <Button
                    onClick={() => {
                      applyBuff(buffModal.unitId, 'hit', 1, '+1 Hit', buffModal.expiresPhase);
                      setBuffModal(null);
                    }}
                    className="bg-[#1c2230] hover:bg-[#252c3d] border border-[#2c3548] text-white hover:text-cyan-400 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-between px-4"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">🎯</span>
                      <span>Modify Hit Rolls</span>
                    </span>
                    <Badge className="bg-cyan-500/15 text-cyan-400 font-extrabold">+1 Hit</Badge>
                  </Button>
                )}

                {(!buffModal.allowedStats || buffModal.allowedStats.includes('wound')) && (
                  <Button
                    onClick={() => {
                      applyBuff(buffModal.unitId, 'wound', 1, '+1 Wound', buffModal.expiresPhase);
                      setBuffModal(null);
                    }}
                    className="bg-[#1c2230] hover:bg-[#252c3d] border border-[#2c3548] text-white hover:text-teal-400 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-between px-4"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">🩸</span>
                      <span>Modify Wound Rolls</span>
                    </span>
                    <Badge className="bg-teal-500/15 text-teal-400 font-extrabold">+1 Wound</Badge>
                  </Button>
                )}

                {(!buffModal.allowedStats || buffModal.allowedStats.includes('rend')) && (
                  <Button
                    onClick={() => {
                      applyBuff(buffModal.unitId, 'rend', 1, '+1 Rend', buffModal.expiresPhase);
                      setBuffModal(null);
                    }}
                    className="bg-[#1c2230] hover:bg-[#252c3d] border border-[#2c3548] text-white hover:text-red-400 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-between px-4"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">⚔️</span>
                      <span>Modify Rend</span>
                    </span>
                    <Badge className="bg-red-500/15 text-red-400 font-extrabold">+1 Rend</Badge>
                  </Button>
                )}

                {(!buffModal.allowedStats || buffModal.allowedStats.includes('damage')) && (
                  <Button
                    onClick={() => {
                      applyBuff(buffModal.unitId, 'damage', 1, '+1 Damage', buffModal.expiresPhase);
                      setBuffModal(null);
                    }}
                    className="bg-[#1c2230] hover:bg-[#252c3d] border border-[#2c3548] text-white hover:text-orange-400 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-between px-4"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">💥</span>
                      <span>Modify Damage</span>
                    </span>
                    <Badge className="bg-orange-500/15 text-orange-400 font-extrabold">+1 Damage</Badge>
                  </Button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#2c3548]/50 bg-[#121620] flex justify-end">
              <Button 
                onClick={() => setBuffModal(null)}
                variant="outline"
                className="w-full border-[#2c3548] text-gray-400 text-xs font-bold uppercase py-2 rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectUnitToBuffAbility && (
        <div className="fixed inset-0 bg-[#080a0f]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#151923] border border-amber-500/30 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-[#2c3548]/60 bg-amber-500/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Target Selection
                </h3>
              </div>
              <button 
                onClick={() => setSelectUnitToBuffAbility(null)}
                className="text-gray-400 hover:text-white text-xs font-black p-1 hover:bg-[#2c3548]/50 rounded transition-all"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-left">
              <div className="bg-[#1c2230] p-3 rounded-lg border border-[#2c3548]/30">
                <h4 className="text-xxs font-black text-amber-500 uppercase tracking-widest mb-1">
                  ✨ Ability Activated:
                </h4>
                <p className="text-xs font-bold text-white mb-1">{selectUnitToBuffAbility.name}</p>
                <p className="text-[10px] text-gray-300 italic whitespace-pre-line leading-relaxed">
                  "{selectUnitToBuffAbility.effect}"
                </p>
              </div>

              <p className="text-xxs text-gray-400 leading-relaxed font-medium">
                Choose a friendly unit from your roster to receive this ability's benefit:
              </p>

              <div className="grid grid-cols-1 gap-2">
                {gameState.units.filter(u => !u.isSlain).map(u => {
                  const uRules = faction.units.find(rules => rules.id === u.unitId);
                  if (!uRules) return null;
                  return (
                    <Button
                      key={u.id}
                      onClick={() => {
                        // Parse effect text to find what stats are modified
                        const effectLower = (selectUnitToBuffAbility.effect || '').toLowerCase();
                        const allowed: ('attacks' | 'save' | 'ward' | 'move' | 'hit' | 'wound' | 'rend' | 'damage')[] = [];
                        
                        if (
                          effectLower.includes('attacks characteristic') || 
                          effectLower.includes('add 1 to the attacks') || 
                          effectLower.includes('modify attacks') || 
                          effectLower.includes('attack characteristic') ||
                          effectLower.includes('attacks characteristic of')
                        ) {
                          allowed.push('attacks');
                        }
                        if (
                          effectLower.includes('save roll') || 
                          effectLower.includes('save characteristic') || 
                          effectLower.includes('add 1 to save') ||
                          effectLower.includes('add 1 to the save')
                        ) {
                          allowed.push('save');
                        }
                        if (
                          effectLower.includes('ward roll') || 
                          effectLower.includes('ward characteristic') || 
                          effectLower.includes('add 1 to ward') ||
                          effectLower.includes('add 1 to the ward')
                        ) {
                          allowed.push('ward');
                        }
                        if (
                          effectLower.includes('move') || 
                          effectLower.includes('run') || 
                          effectLower.includes('charge') ||
                          effectLower.includes('movement')
                        ) {
                          allowed.push('move');
                        }
                        if (
                          effectLower.includes('hit roll') || 
                          effectLower.includes('hit rolls') || 
                          effectLower.includes('add 1 to hit') ||
                          effectLower.includes('add 1 to the hit')
                        ) {
                          allowed.push('hit');
                        }
                        if (
                          effectLower.includes('wound roll') || 
                          effectLower.includes('wound rolls') || 
                          effectLower.includes('add 1 to wound') ||
                          effectLower.includes('add 1 to the wound')
                        ) {
                          allowed.push('wound');
                        }
                        if (
                          effectLower.includes('rend characteristic') || 
                          effectLower.includes('add 1 to rend') ||
                          effectLower.includes('add 1 to the rend')
                        ) {
                          allowed.push('rend');
                        }
                        if (
                          effectLower.includes('damage characteristic') || 
                          effectLower.includes('add 1 to damage') ||
                          effectLower.includes('add 1 to the damage')
                        ) {
                          allowed.push('damage');
                        }
                        
                        const finalAllowed = allowed.length > 0 ? allowed : undefined;

                        const rollMatch = (selectUnitToBuffAbility.effect || '').match(/on\s+a\s+(\d+)\+/i);

                        if (rollMatch) {
                          setRollPrompt({
                            abilityId: selectUnitToBuffAbility.abilityId,
                            abilityName: selectUnitToBuffAbility.name,
                            effect: selectUnitToBuffAbility.effect,
                            targetUnitId: u.id,
                            targetUnitName: uRules.name,
                            requiredRoll: rollMatch[1] + '+',
                            phase: selectUnitToBuffAbility.phase,
                            allowedStats: finalAllowed
                          });
                          setSelectUnitToBuffAbility(null);
                        } else {
                          setSelectUnitToBuffAbility(null);
                          if (allowed.length === 0) {
                            // No direct stat modifiers parsed; log the targeting action and close cleanly
                            if (gameState) {
                              const updated = { ...gameState };
                              updated.logs.unshift(`🎯 Selected unit [${uRules.name}] as the target for "${selectUnitToBuffAbility.name}".`);
                              saveGame(updated);
                            }
                            showToast(`Selected ${uRules.name} for ${selectUnitToBuffAbility.name}!`, 'success');
                          } else if (allowed.length === 1) {
                            const singleStat = allowed[0];
                            let modifierVal = 1;
                            let labelVal = '';
                            if (singleStat === 'attacks') labelVal = `+1 Attacks (${selectUnitToBuffAbility.name})`;
                            else if (singleStat === 'save') labelVal = `+1 Save (${selectUnitToBuffAbility.name})`;
                            else if (singleStat === 'ward') labelVal = `+1 Ward (${selectUnitToBuffAbility.name})`;
                            else if (singleStat === 'move') {
                              if (selectUnitToBuffAbility.name.toUpperCase().includes('SPEED OF HYSH')) {
                                labelVal = `Doubled Move (${selectUnitToBuffAbility.name})`;
                              } else {
                                labelVal = `+1" Move (${selectUnitToBuffAbility.name})`;
                              }
                            }
                            else if (singleStat === 'hit') labelVal = `+1 Hit (${selectUnitToBuffAbility.name})`;
                            else if (singleStat === 'wound') labelVal = `+1 Wound (${selectUnitToBuffAbility.name})`;
                            else if (singleStat === 'rend') labelVal = `+1 Rend (${selectUnitToBuffAbility.name})`;
                            else if (singleStat === 'damage') labelVal = `+1 Damage (${selectUnitToBuffAbility.name})`;
                            
                            applyBuff(u.id, singleStat, modifierVal, labelVal, selectUnitToBuffAbility.phase);
                          } else {
                            setBuffModal({ 
                              isOpen: true, 
                              unitId: u.id, 
                              unitName: uRules.name,
                              allowedStats: finalAllowed,
                              expiresPhase: selectUnitToBuffAbility.phase
                            });
                          }
                        }
                      }}
                      className="bg-[#1c2230] hover:bg-[#252c3d] border border-[#2c3548] text-white hover:text-amber-400 text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-between px-4 h-11"
                    >
                      <span className="font-semibold text-gray-200">{uRules.name}</span>
                      <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase">Select</Badge>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#2c3548]/50 bg-[#121620] flex gap-2">
              <Button 
                onClick={() => setSelectUnitToBuffAbility(null)}
                variant="outline"
                className="w-full border-[#2c3548] text-gray-400 text-xs font-bold uppercase py-2 rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {eyeOfTheGodsModal && eyeOfTheGodsModal.isOpen && (
        <div className="fixed inset-0 bg-[#080a0f]/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-[#151923] border border-amber-500/40 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col my-8">
            {/* Header */}
            <div className="p-5 border-b border-[#2c3548]/60 bg-gradient-to-r from-amber-500/10 to-rose-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-amber-400 animate-pulse animate-duration-1000" />
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">
                    {eyeOfTheGodsModal.sourceAbilityName}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                    Eye of the Gods Ascension Table
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEyeOfTheGodsModal(null)}
                className="text-gray-400 hover:text-white h-7 w-7 rounded-lg"
              >
                <span className="text-sm font-bold">×</span>
              </Button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Step 1: Select Friendly Unit (Skip if applyToAllUnits is true) */}
              {eyeOfTheGodsModal.applyToAllUnits ? (
                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-start gap-2.5">
                  <span className="text-lg leading-none">🌟</span>
                  <div>
                    <h5 className="text-xxs font-black text-purple-400 uppercase tracking-wide">Favoured of the Pantheon Active</h5>
                    <p className="text-xxs text-gray-300 mt-1 leading-normal">
                      This trial blesses <strong>ALL friendly units</strong> simultaneously! Step 1 unit selection is automated.
                    </p>
                  </div>
                </div>
              ) : eyeOfTheGodsModal.restrictToUnitId ? (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                  <span className="text-lg leading-none">👑</span>
                  <div>
                    <h5 className="text-xxs font-black text-amber-400 uppercase tracking-wide">Restricted to Chaos Lord</h5>
                    <p className="text-xxs text-gray-300 mt-1 leading-normal">
                      Favoured of the Pantheon is only applied to the <strong>Chaos Lord himself</strong>! Step 1 unit selection is automated.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1">
                    <User className="h-3 w-3" /> Step 1: Choose Friendly Unit
                  </label>
                  <p className="text-xxs text-gray-400 leading-normal">
                    Select the unit that is undergoing the Trial of Ascension:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {gameState.units
                      .filter(u => !u.isSlain)
                      .filter(u => {
                        if (eyeOfTheGodsModal.restrictToChaosOnly) {
                          // The Dread Banner: limited to Chaos Warriors or Chaos Knights
                          const rules = faction?.units.find(r => r.id === u.unitId);
                          return rules?.name.toLowerCase().includes('chaos warriors') || 
                                 rules?.name.toLowerCase().includes('chaos knights');
                        }
                        return true;
                      })
                      .map(u => {
                        const rules = faction?.units.find(r => r.id === u.unitId);
                        if (!rules) return null;
                        const isSelected = eyeOfTheGodsSelectedUnitId === u.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setEyeOfTheGodsSelectedUnitId(u.id)}
                            className={`p-3 text-left rounded-xl border text-xs font-bold transition-all flex items-center justify-between
                              ${isSelected
                                ? 'bg-amber-500/10 border-amber-400 text-white shadow-lg'
                                : 'bg-[#1c2230] border-[#2c3548] text-gray-300 hover:text-white hover:border-[#3d4963]'}`}
                          >
                            <span>{rules.name}</span>
                            {isSelected && <Badge className="bg-amber-500/20 text-amber-400 text-[8px] uppercase font-black">Selected</Badge>}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Step 2: Choose Eye of the Gods Blessing */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Step 2: Choose Blessing from the Table
                </label>
                <p className="text-xxs text-gray-400 leading-normal">
                  Select one of the five trials of ascension from the Eye of the Gods table:
                </p>

                <div className="space-y-2 mt-2">
                  {[
                    { id: 'snubbed', name: '1. Snubbed by the Gods', desc: 'No Effect (The gods look away in silence).', emoji: '💀', color: 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/10' },
                    { id: 'ward', name: '2. Ward of Tzeentch', desc: 'Grants this unit a Ward of 6+. If they already have a Ward, increases their Ward by 1.', emoji: '💖', color: 'border-cyan-500/30 hover:border-cyan-500/50 bg-cyan-950/10' },
                    { id: 'run', name: '3. Grace of Slaanesh', desc: 'Add 1 to run rolls for this unit.', emoji: '🏃‍♂️', color: 'border-fuchsia-500/30 hover:border-fuchsia-500/50 bg-fuchsia-950/10' },
                    { id: 'wound', name: '4. Blessing of Nurgle', desc: 'Subtract 1 from wound rolls for attacks targeting this unit.', emoji: '🤢', color: 'border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-950/10' },
                    { id: 'rend', name: '5. Fury of Khorne', desc: 'Add 1 to the Rend characteristic of this unit\'s melee weapons.', emoji: '⚔️', color: 'border-red-500/30 hover:border-red-500/50 bg-red-950/10' }
                  ].map(reward => {
                    const isSelected = eyeOfTheGodsSelectedReward === reward.id;
                    return (
                      <button
                        key={reward.id}
                        type="button"
                        onClick={() => setEyeOfTheGodsSelectedReward(reward.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex gap-3 relative
                          ${isSelected
                            ? 'bg-amber-500/10 border-amber-400 text-white shadow-lg'
                            : `bg-[#1c2230] border-transparent text-gray-300 hover:text-white ${reward.color}`}`}
                      >
                        <span className="text-xl leading-none shrink-0 self-center">{reward.emoji}</span>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-white">{reward.name}</h4>
                          <p className="text-[10px] text-gray-400 leading-normal">{reward.desc}</p>
                        </div>
                        {isSelected && (
                          <Badge className="absolute right-3.5 top-3.5 bg-amber-500/20 text-amber-400 text-[8px] uppercase font-black">
                            Active
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#2c3548]/50 bg-[#121620] flex gap-2">
              <Button
                type="button"
                onClick={() => setEyeOfTheGodsModal(null)}
                variant="outline"
                className="w-1/3 border-[#2c3548] text-gray-400 text-xs font-bold uppercase py-2.5 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmEyeOfTheGods}
                className="w-2/3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs uppercase py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/20"
              >
                <Sparkles className="h-3.5 w-3.5" /> Confirm Ascension
              </Button>
            </div>
          </div>
        </div>
      )}

      {rollPrompt && (() => {
        const isCastingRoll = rollPrompt.effect.toLowerCase().includes('casting roll') || 
                              rollPrompt.effect.toLowerCase().includes('casting roll of 2d6') ||
                              rollPrompt.abilityName.toUpperCase().includes('SPEED OF HYSH') ||
                              rollPrompt.abilityName.toUpperCase().includes('TWINSTONE') ||
                              rollPrompt.abilityName.toUpperCase().includes('MYSTICAL SHIELD') ||
                              rollPrompt.abilityName.toUpperCase().includes('ARCANE BOLT');
        const castingBonus = isCastingRoll ? getCastingRollBonus() : null;
        const baseRequired = parseInt(rollPrompt.requiredRoll, 10) || 0;
        const modifiedRequired = castingBonus ? Math.max(2, baseRequired - castingBonus.value) : baseRequired;

        return (
          <div className="fixed inset-0 bg-[#080a0f]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#151923] border border-amber-500/30 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-[#2c3548]/60 bg-amber-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Roll Required: {castingBonus ? `${modifiedRequired}+` : rollPrompt.requiredRoll}
                  </h3>
                </div>
                <button 
                  onClick={() => setRollPrompt(null)}
                  className="text-gray-400 hover:text-white text-xs font-black p-1 hover:bg-[#2c3548]/50 rounded transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4 text-left">
                <div className="bg-[#1c2230] p-3 rounded-lg border border-[#2c3548]/30">
                  <h4 className="text-xxs font-black text-amber-500 uppercase tracking-widest mb-1">
                    ✨ Ability:
                  </h4>
                  <p className="text-xs font-bold text-white mb-1">{rollPrompt.abilityName}</p>
                  <p className="text-[10px] text-gray-300 italic whitespace-pre-line leading-relaxed">
                    "{rollPrompt.effect}"
                  </p>
                  {rollPrompt.targetUnitName && (
                    <div className="mt-2 pt-2 border-t border-[#2c3548]/30">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                        Target Unit:
                      </p>
                      <p className="text-xs font-bold text-white mt-0.5">{rollPrompt.targetUnitName}</p>
                    </div>
                  )}
                </div>

                {castingBonus && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 text-emerald-400 select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="animate-pulse">🔮</span>
                      <span className="text-xxs font-black uppercase tracking-wider">Active Casting Buff Applied!</span>
                    </div>
                    <p className="text-[10px] text-gray-300 font-medium leading-relaxed">
                      You have a <strong className="text-emerald-400 font-extrabold">+{castingBonus.value}</strong> modifier to your casting rolls from <strong className="text-white font-bold">{castingBonus.source}</strong>.
                    </p>
                    <p className="text-[9px] text-emerald-400 font-semibold italic mt-1">
                      Required roll is lowered from {rollPrompt.requiredRoll} to {modifiedRequired}+ on your dice!
                    </p>
                  </div>
                )}

                <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg text-xxs text-amber-300 leading-relaxed font-semibold">
                  ⚠️ This ability requires a dice roll to trigger. Roll your physical dice first (including any active casting modifiers), then choose the outcome below:
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={() => {
                      const updated = { ...gameState };
                      updated.usedAbilities[rollPrompt.abilityId] = true;
                      
                      const rollDesc = castingBonus 
                        ? `${modifiedRequired}+ (with +${castingBonus.value} casting buff from ${castingBonus.source}, base ${rollPrompt.requiredRoll})` 
                        : rollPrompt.requiredRoll;
                      updated.logs.unshift(`🎲 Roll Succeeded (${rollDesc}): Triggered "${rollPrompt.abilityName}"${rollPrompt.targetUnitName ? ` on ${rollPrompt.targetUnitName}` : ''}.`);
                      saveGame(updated);

                      // Special Favoured of the Pantheon success handler
                      if (rollPrompt.abilityId === 'favouredOfThePantheon' || rollPrompt.abilityId.endsWith('-favouredOfThePantheon')) {
                        const chaosLordUnit = updated.units.find(u => u.unitId === 'chaosLord');
                        setEyeOfTheGodsModal({
                          isOpen: true,
                          sourceAbilityName: 'Favoured of the Pantheon (Ascended!)',
                          sourceAbilityId: rollPrompt.abilityId,
                          restrictToUnitId: 'chaosLord'
                        });
                        if (chaosLordUnit) {
                          setEyeOfTheGodsSelectedUnitId(chaosLordUnit.id);
                        }
                        setRollPrompt(null);
                        return;
                      }

                      if (rollPrompt.targetUnitId) {
                        if (rollPrompt.allowedStats && rollPrompt.allowedStats.length > 1) {
                          setBuffModal({
                            isOpen: true,
                            unitId: rollPrompt.targetUnitId,
                            unitName: rollPrompt.targetUnitName || '',
                            allowedStats: rollPrompt.allowedStats,
                            expiresPhase: rollPrompt.phase
                          });
                        } else if (rollPrompt.allowedStats && rollPrompt.allowedStats.length === 1) {
                          const singleStat = rollPrompt.allowedStats[0];
                          let modifierVal = 1;
                          let labelVal = `+1 ${singleStat.charAt(0).toUpperCase() + singleStat.slice(1)} (${rollPrompt.abilityName})`;
                          applyBuff(rollPrompt.targetUnitId, singleStat, modifierVal, labelVal, rollPrompt.phase);
                        } else {
                          // General targeted buff with no parsed stats: show generic buff modal to let them select what to modify
                          setBuffModal({
                            isOpen: true,
                            unitId: rollPrompt.targetUnitId,
                            unitName: rollPrompt.targetUnitName || '',
                            expiresPhase: rollPrompt.phase
                          });
                        }
                      }
                      setRollPrompt(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    🟢 Succeeded (Roll of {castingBonus ? `${modifiedRequired}+` : rollPrompt.requiredRoll})
                  </Button>

                  <Button
                    onClick={() => {
                      const updated = { ...gameState };
                      updated.usedAbilities[rollPrompt.abilityId] = true;
                      
                      if (rollPrompt.targetUnitId) {
                        const newMod = {
                          id: `${rollPrompt.abilityId}-missed-${Date.now()}`,
                          unitId: rollPrompt.targetUnitId,
                          stat: 'attacks' as const,
                          modifier: 0,
                          label: `${rollPrompt.abilityName} (Missed Roll)`,
                          expiresRound: updated.round,
                          expiresPhase: rollPrompt.phase
                        };
                        updated.appliedModifiers = [...(updated.appliedModifiers || []), newMod];
                      }
                      
                      updated.logs.unshift(`🎲 Roll Failed / Missed: "${rollPrompt.abilityName}" was used but failed to manifest${rollPrompt.targetUnitName ? ` on ${rollPrompt.targetUnitName}` : ''}.`);
                      saveGame(updated);
                      setRollPrompt(null);
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-gray-300 hover:text-white font-bold text-xs uppercase py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    🔴 Failed / Missed Roll
                  </Button>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#2c3548]/50 bg-[#121620] flex gap-2">
                <Button 
                  onClick={() => setRollPrompt(null)}
                  variant="outline"
                  className="w-full border-[#2c3548] text-gray-400 text-xs font-bold uppercase py-2 rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {facetOfWarModalOpen && (
        <div className="fixed inset-0 bg-[#080a0f]/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-[#151923] border border-amber-500/40 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col my-8 animate-scale-in">
            {/* Header */}
            <div className="p-5 border-b border-[#2c3548]/60 bg-gradient-to-r from-amber-500/10 to-blue-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-amber-400 animate-pulse" />
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">
                    Glittering Phalanx Battle Trait
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                    FACETS OF WAR (Round {gameState?.round})
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh] text-left">
              <p className="text-xxs text-gray-400 leading-relaxed font-medium">
                At the start of each battle round, you must pick 1 FACET OF WAR ability to use. The other facets cannot be used this battle round. Pick your strategy:
              </p>

              <div className="space-y-3">
                {/* 1. Shining Company */}
                <button
                  onClick={() => handleSelectFacet('shiningCompany')}
                  className="w-full text-left p-4 rounded-xl border border-blue-500/30 bg-blue-950/5 hover:bg-blue-950/10 hover:border-blue-400 transition-all flex gap-3 relative"
                >
                  <span className="text-xl leading-none shrink-0 self-center">🛡️</span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Shining Company</h4>
                    <p className="text-[10px] text-gray-300 leading-normal font-medium">
                      Subtract 1 from hit rolls for attacks that target friendly units. (Defensive buff applied to ALL units).
                    </p>
                  </div>
                </button>

                {/* 2. Power of Hysh */}
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/5 flex flex-col gap-3 relative">
                  <div className="flex gap-3">
                    <span className="text-xl leading-none shrink-0 self-center">✨</span>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Power of Hysh</h4>
                      <p className="text-[10px] text-gray-300 leading-normal font-medium">
                        On a 2+, attacks made by the selected unit score critical hits on unmodified hit rolls of 5+. (Requires selecting a target unit).
                      </p>
                    </div>
                  </div>
                  
                  {/* Unit Selector inside the option card */}
                  <div className="mt-2 pt-2 border-t border-[#2c3548]/30 space-y-2 text-left">
                    <label className="text-[9px] font-black text-amber-400 uppercase tracking-widest block">
                      👇 Pick Target Friendly Unit:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {gameState?.units.filter(u => !u.isSlain).map(u => {
                        const uRules = faction?.units.find(rules => rules.id === u.unitId);
                        if (!uRules) return null;
                        const isSelected = selectedFacetUnitId === u.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setSelectedFacetUnitId(u.id)}
                            className={`p-2 rounded-lg border text-xxs font-bold text-left transition-all flex items-center justify-between
                              ${isSelected 
                                ? 'bg-amber-500/20 border-amber-400 text-white' 
                                : 'bg-[#1c2230] border-[#2c3548] text-gray-300 hover:text-white'}`}
                          >
                            <span>{uRules.name}</span>
                            {isSelected && <Badge className="bg-amber-500/30 text-amber-300 text-[8px]">Selected</Badge>}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      onClick={() => handleSelectFacet('powerOfHysh')}
                      disabled={!selectedFacetUnitId}
                      className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase py-2 rounded-xl transition-all mt-1"
                    >
                      Choose Power of Hysh
                    </Button>
                  </div>
                </div>

                {/* 3. Lightning Reactions */}
                <button
                  onClick={() => handleSelectFacet('lightningReactions')}
                  className="w-full text-left p-4 rounded-xl border border-purple-500/30 bg-purple-950/5 hover:bg-purple-950/10 hover:border-purple-400 transition-all flex gap-3 relative"
                >
                  <span className="text-xl leading-none shrink-0 self-center">⚡</span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Lightning Reactions</h4>
                    <p className="text-[10px] text-gray-300 leading-normal font-medium">
                      Pick 2 units instead of 1 when alternating Picking units to fight. (Passive ability applied to the combat phase).
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
