'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, RefreshCw, Swords, Shield, Heart, Trophy, 
  ChevronRight, ChevronLeft, Award, Play, AlertTriangle, 
  Activity, Sparkles, ScrollText, User, UserCheck, ShieldAlert, AlertCircle,
  Users, TrendingDown, Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DEFAULT_FACTIONS } from '../data/default-factions';
import { GameState, Faction, Unit, GamePhase, Weapon, Ability, UnitState, AppliedModifier } from '../types';
import { getActiveModifiers as libGetActiveModifiers, getBattleDamagedOverride as libGetBattleDamagedOverride, calculateStatValue, isTargetingSingularFriendlyUnit, analyzeAbilityRule, ParsedRuleResult, getActiveBloodRitesRound } from '@/lib/rules-engine';

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
    allowedStats?: ('attacks' | 'save' | 'ward' | 'move' | 'hit' | 'wound' | 'rend' | 'damage' | 'charge')[];
    expiresPhase?: GamePhase;
    expiresTurn?: boolean;
    sourceAbilityName?: string;
    sourceAbilityId?: string;
    sourceAbilityEffect?: string;
  } | null>(null);

  const [selectUnitToBuffAbility, setSelectUnitToBuffAbility] = useState<{
    abilityId: string;
    name: string;
    effect: string;
    phase?: GamePhase;
  } | null>(null);

  const [spatialConditionMet, setSpatialConditionMet] = useState(false);
  const [highlightedAbilityId, setHighlightedAbilityId] = useState<string | null>(null);
  
  const triggerAbilityFlash = (abilityId: string) => {
    // If the ability has a suffix or prefix, we strip or match it
    setHighlightedAbilityId(abilityId);
    setTimeout(() => {
      setHighlightedAbilityId(null);
    }, 2000); // 2 second flash
  };
  const [expandedUnitRefIds, setExpandedUnitRefIds] = useState<Record<string, boolean>>({});

  const toggleSpatialCheckBuff = (unitId: string, ability: Ability, checked: boolean) => {
    if (!gameState) return;
    const analysis = analyzeAbilityRule(ability, faction);
    if (checked) {
      // Apply the buff
      const isCasting = ability.effect.toLowerCase().includes('casting roll') || ability.effect.toLowerCase().includes('casting rolls');
      if (isCasting) {
        let modifierVal = 1;
        if (ability.effect.toLowerCase().includes('add 2')) {
          modifierVal = 2;
        }
        let labelVal = `${ability.name} (Casting Roll Modifier)`;
        applyBuff(unitId, 'casting', modifierVal, labelVal, undefined, ability.id, ability.effect);
      }

      const allowedStats = analysis.allowedStats.length > 0 ? analysis.allowedStats : (isCasting ? [] : ['hit']); // Default hit fallback only if not casting
      allowedStats.forEach(stat => {
        let modifierVal = 1;
        // Check if it's a subtraction / negative stat (e.g. subtracting from hit, save)
        const isNegative = ability.effect.toLowerCase().includes('subtract 1') || ability.effect.toLowerCase().includes('-1') || ability.effect.toLowerCase().includes('subtract');
        if (isNegative) {
          modifierVal = -1;
        }
        let labelVal = `${modifierVal > 0 ? '+' : ''}${modifierVal} ${stat.charAt(0).toUpperCase() + stat.slice(1)} (${ability.name})`;
        applyBuff(unitId, stat, modifierVal, labelVal, undefined, ability.id, ability.effect);
      });
      showToast(`Applied spatial check: "${ability.name}"`, "success");
    } else {
      // Remove all buffs from this ability on this unit
      const updated = { ...gameState };
      updated.appliedModifiers = (updated.appliedModifiers || []).filter(m => !(m.unitId === unitId && m.sourceAbilityId === ability.id));
      setGameState(updated);
      localStorage.setItem('active_spearhead_game', JSON.stringify(updated));
      showToast(`Removed spatial check: "${ability.name}"`, "success");
    }
  };

  const [rollPrompt, setRollPrompt] = useState<{
    abilityId: string;
    abilityName: string;
    effect: string;
    targetUnitId?: string;
    targetUnitName?: string;
    requiredRoll: string;
    phase?: GamePhase;
    allowedStats?: ('attacks' | 'save' | 'ward' | 'move' | 'hit' | 'wound' | 'rend' | 'damage' | 'charge')[];
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

  // Round Initializing modal states
  const [roundInitializingModal, setRoundInitializingModal] = useState<{
    isOpen: boolean;
    round: number;
    goesFirst: 'me' | 'opponent';
    underdog: 'me' | 'opponent' | 'none';
    doubleUpDrawOverride: boolean;
  } | null>(null);

  const [deploymentModalOpen, setDeploymentModalOpen] = useState<boolean>(false);
  const [deploymentRole, setDeploymentRole] = useState<'attacker' | 'defender'>('attacker');
  const [deploymentRealm, setDeploymentRealm] = useState<'aqshy' | 'ghyran' | 'ossia' | 'dolorum'>('aqshy');
  const [deploymentMap, setDeploymentMap] = useState<'horizontal' | 'diagonal'>('horizontal');
  const [deploymentStepChecked, setDeploymentStepChecked] = useState<{ [step: number]: boolean }>({});

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

  // Trigger round start overlay exactly once per round start or on load (whenever currentPhase is 'start' and roundFirstPlayer is not yet chosen)
  useEffect(() => {
    if (gameState && gameState.currentPhase === 'start' && !gameState.roundFirstPlayer) {
      if (gameState.round === 1 && !gameState.deploymentPhaseComplete) {
        setRoundInitializingModal(null);
        setDeploymentModalOpen(true);
      } else {
        setDeploymentModalOpen(false);
        setRoundInitializingModal({
          isOpen: true,
          round: gameState.round,
          goesFirst: deploymentRole === 'attacker' ? 'me' : 'opponent',
          underdog: gameState.isUnderdog ? 'me' : 'none',
          doubleUpDrawOverride: false
        });
      }
    } else {
      setRoundInitializingModal(null);
      setDeploymentModalOpen(false);
    }
  }, [gameState?.round, gameState?.currentPhase, gameState?.roundFirstPlayer, gameState?.deploymentPhaseComplete, gameState?.matchId, deploymentRole]);

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

  const phases: { id: GamePhase; name: string; color: string }[] = [];
  if (gameState.round === 1) {
    phases.push({ id: 'deployment', name: 'Deployment', color: 'bg-emerald-600 border-emerald-400' });
  }
  phases.push(
    { id: 'start', name: 'Start of Turn', color: 'bg-zinc-700 border-zinc-500' },
    { id: 'hero', name: 'Hero Phase', color: 'bg-yellow-600 border-yellow-400' },
    { id: 'movement', name: 'Movement', color: 'bg-blue-600 border-blue-400' },
    { id: 'shooting', name: 'Shooting', color: 'bg-emerald-700 border-emerald-500' },
    { id: 'charge', name: 'Charge', color: 'bg-orange-600 border-orange-400' },
    { id: 'combat', name: 'Combat Phase', color: 'bg-rose-700 border-rose-500' },
    { id: 'end', name: 'End of Turn', color: 'bg-purple-600 border-purple-400' }
  );

  const currentPhaseIndex = phases.findIndex(p => p.id === gameState.currentPhase);

  // Helper to save state
  const saveGame = (newState: GameState) => {
    setGameState(newState);
    localStorage.setItem('active_spearhead_game', JSON.stringify(newState));
  };

  // Turn-based targeted buff helpers
  const applyBuff = (unitId: string, stat: any, modifier: number, label: string, expiresPhase?: GamePhase, sourceAbilityId?: string, sourceAbilityEffect?: string, expiresTurn?: boolean) => {
    if (!gameState) return;
    const updated = { ...gameState };
    
    const effectLower = (sourceAbilityEffect || '').toLowerCase();
    const isTurnLong = effectLower.includes('rest of the turn') || effectLower.includes('rest of this turn') || effectLower.includes('for the rest of the turn') || effectLower.includes('for the rest of this turn') || effectLower.includes('rest of the battle round') || effectLower.includes('rest of this battle round') || effectLower.includes('this turn');
    
    const finalExpiresPhase = isTurnLong ? undefined : expiresPhase;
    const finalExpiresTurn = isTurnLong ? true : expiresTurn;

    const newMod: AppliedModifier = {
      id: Math.random().toString(36).substring(2, 9),
      unitId,
      stat,
      modifier,
      label,
      expiresRound: gameState.round,
      expiresPhase: finalExpiresPhase,
      expiresTurn: finalExpiresTurn,
      sourceAbilityId,
      sourceAbilityEffect
    };
    updated.appliedModifiers = [...(updated.appliedModifiers || []), newMod];
    
    if (sourceAbilityId) {
      if (!updated.usedAbilities) updated.usedAbilities = {};
      updated.usedAbilities[sourceAbilityId] = true;
    }

    updated.logs.unshift(`[Round ${gameState.round}] ✨ Applied buff [${label}] to unit${finalExpiresPhase ? ` for ${finalExpiresPhase} phase` : ''}.`);
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
      updated.logs.unshift(`[Round ${updated.round}] ✨ Selected Power of Hysh: This ability can be used in the combat phase!`);
      showToast('Selected Power of Hysh!', 'success');
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
    if (!gameState) return;
    const updated = { ...gameState };
    updated.victoryPoints = Math.max(0, updated.victoryPoints + amount);
    updated.logs.unshift(`[Round ${gameState.round}] Victory Points adjusted by ${amount > 0 ? '+' : ''}${amount}. Total: ${updated.victoryPoints} VPs`);
    saveGame(updated);
  };

  const updateOpponentVP = (amount: number) => {
    if (!gameState) return;
    const updated = { ...gameState };
    updated.opponentVictoryPoints = Math.max(0, (updated.opponentVictoryPoints ?? 0) + amount);
    updated.logs.unshift(`[Round ${gameState.round}] Opponent Victory Points adjusted by ${amount > 0 ? '+' : ''}${amount}. Total: ${updated.opponentVictoryPoints} VPs`);
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

  const healWoundsById = (unitInstanceId: string, amount: number) => {
    if (!gameState) return;
    const updated = { ...gameState };
    const uState = updated.units.find(u => u.id === unitInstanceId);
    if (!uState) return;
    const uRules = faction.units.find(u => u.id === uState.unitId);
    if (!uRules) return;

    const maxModels = uState.maxModels ?? uRules.models ?? 1;
    if (uState.maxModels === undefined) uState.maxModels = maxModels;
    if (uState.modelsCount === undefined) uState.modelsCount = maxModels;

    let woundsHealed = 0;
    let modelsRestored = 0;
    let revived = false;

    for (let i = 0; i < amount; i++) {
      if (uState.isSlain) {
        uState.isSlain = false;
        uState.modelsCount = 1;
        uState.currentWounds = 0;
        revived = true;
      } else {
        if (uState.currentWounds > 0) {
          uState.currentWounds -= 1;
          woundsHealed++;
        } else {
          if (uState.modelsCount < uState.maxModels) {
            uState.modelsCount += 1;
            uState.currentWounds = uRules.health - 1;
            modelsRestored++;
          }
        }
      }
    }

    const logParts: string[] = [];
    if (revived) logParts.push("revived with 1 model");
    if (woundsHealed > 0) logParts.push(`healed ${woundsHealed} wound(s)`);
    if (modelsRestored > 0) logParts.push(`restored ${modelsRestored} slain model(s)`);

    if (logParts.length > 0) {
      updated.logs.unshift(`💚 [Mend/Heal] Your ${uRules.name} was ${logParts.join(" and ")}.`);
    } else {
      updated.logs.unshift(`💚 [Mend/Heal] Tried to heal your ${uRules.name} but they are already at full strength.`);
    }

    saveGame(updated);
  };

  const setUnitCombatOrder = (unitInstanceId: string, order: 'first' | 'normal' | 'last') => {
    if (!gameState) return;
    const updated = { ...gameState };
    const uState = updated.units.find(u => u.id === unitInstanceId);
    if (!uState) return;

    uState.combatOrder = order;
    
    // Add an action log
    const uRules = faction.units.find(u => u.id === uState.unitId);
    const orderLabels = { first: 'Strike-First ⚡', normal: 'Normal ⚔️', last: 'Strike-Last 🛡️' };
    updated.logs.unshift(`[Round ${updated.round}] ⏱️ Set ${uRules?.name || 'Unit'} speed to ${orderLabels[order]}.`);

    saveGame(updated);
  };

  const getUnitCombatOrder = (u: UnitState, uRules: Unit): 'first' | 'normal' | 'last' => {
    if (u.combatOrder) return u.combatOrder;

    // Check if there is an applied modifier indicating Strike-First or Strike-Last
    const hasFirstMod = gameState?.appliedModifiers?.some(
      m => m.unitId === u.id && m.label.toLowerCase().includes('strike-first')
    );
    if (hasFirstMod) return 'first';

    const hasLastMod = gameState?.appliedModifiers?.some(
      m => m.unitId === u.id && m.label.toLowerCase().includes('strike-last')
    );
    if (hasLastMod) return 'last';

    return 'normal';
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
    if (!gameState || !faction) return;
    
    if (abilityId === 'facetsOfWar' || abilityId.endsWith('-facetsOfWar')) {
      setFacetOfWarModalOpen(true);
      return;
    }

    const updated = { ...gameState };
    
    // Detect unlimited (once: "none") abilities to prevent permanent lockout
    let foundAb = faction.battleTraits.find(a => a.id === abilityId || (abilityId.startsWith(a.id) && a.id === 'relentlessDiscipline') || abilityId.endsWith(`-${a.id}`)) ||
                  faction.regimentAbilities.find(a => a.id === abilityId || abilityId.endsWith(`-${a.id}`)) ||
                  faction.enhancements.find(a => a.id === abilityId || abilityId.endsWith(`-${a.id}`));
    
    if (!foundAb) {
      for (const u of faction.units) {
        const matched = u.abilities.find(a => abilityId === a.id || abilityId.endsWith(`-${a.id}`));
        if (matched) {
          foundAb = matched;
          break;
        }
      }
    }

    const wasUsed = !!updated.usedAbilities[abilityId];
    const analysis = foundAb ? analyzeAbilityRule(foundAb, faction) : null;

    setSpatialConditionMet(false); // Reset checkbox on every new activation click

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

    if (wasUsed) {
      // Deactivating ability: toggle off
      updated.usedAbilities[abilityId] = false;
      updated.logs.unshift(`↩️ Deactivated ability: "${abilityName}"`);
      
      // Clean up applied modifiers if we toggle off
      if (updated.appliedModifiers) {
        updated.appliedModifiers = updated.appliedModifiers.filter(mod => !mod.label.includes(abilityName));
      }
      saveGame(updated);
      return;
    }

    // ACTIVATE flow (wasUsed is false)

    // Check 1: Target SELF
    // Bypass target selection entirely; apply modifiers immediately to all matching unit names on roster.
    if (analysis && (analysis.targetingType === 'self' || analysis.targetSpecifications.some(s => s.startsWith('Self'))) && analysis.allowedStats.length <= 1) {
      let parentUnitRules = faction.units.find(u => u.abilities.some(a => a.id === foundAb?.id));
      if (!parentUnitRules && foundAb) {
        parentUnitRules = faction.units.find(u => u.id === foundAb?.id.split('-')[0]);
      }

      if (parentUnitRules) {
        const parentName = parentUnitRules.name;
        const matchingUnits = gameState.units.filter(u => !u.isSlain && faction.units.find(r => r.id === u.unitId)?.name === parentName);

        if (matchingUnits.length > 0) {
          updated.usedAbilities[abilityId] = true;
          updated.logs.unshift(`⚡ Activated self-targeting ability: "${abilityName}" (applied automatically to matching unit(s): ${parentName})`);

          if (!updated.appliedModifiers) updated.appliedModifiers = [];
          matchingUnits.forEach(uState => {
            analysis.allowedStats.forEach(stat => {
              let modifierVal = 1;
              let labelVal = `+1 ${stat.charAt(0).toUpperCase() + stat.slice(1)} (${abilityName})`;
              if (stat === 'move') {
                if (abilityName.toUpperCase().includes('SPEED OF HYSH')) {
                  labelVal = `Doubled Move (${abilityName})`;
                } else {
                  labelVal = `+1" Move (${abilityName})`;
                }
              }
              
              updated.appliedModifiers!.push({
                id: `${abilityId}-${uState.id}-${stat}-${Date.now()}`,
                unitId: uState.id,
                stat,
                modifier: modifierVal,
                label: labelVal,
                expiresRound: updated.round,
                expiresPhase: phase !== 'passive' ? phase : undefined,
                sourceAbilityId: abilityId,
                sourceAbilityEffect: foundAb?.effect
              });
            });
          });

          saveGame(updated);
          showToast(`Applied "${abilityName}" to all matching unit instances of "${parentName}"!`, 'success');
          return;
        }
      }
    }

    // Check 2: Dice check roll required BEFORE targeting
    const rollMatch = (effect || '').match(/on\s+a\s+(\d+)\+/i);
    const isTargetingSingular = analysis
      ? (analysis.targetingType === 'single_friendly' || (analysis.targetingType === 'self' && analysis.allowedStats.length > 1))
      : isTargetingSingularFriendlyUnit(effect || '');

    if (rollMatch && !isTargetingSingular) {
      setRollPrompt({
        abilityId,
        abilityName,
        effect: effect || '',
        requiredRoll: rollMatch[1] + '+',
        phase: phase !== 'passive' ? phase : undefined
      });
      return;
    }

    // Check 3: Standard Singular / Targeted friendly unit
    if (isTargetingSingular) {
      const isHeightened = abilityId === 'heightenedReflexes' || abilityId.endsWith('-heightenedReflexes');
      const isRelentlessRD = abilityId.startsWith('relentlessDiscipline');
      const isPhaseLong = (effect || '').toLowerCase().includes('this phase') || (effect || '').toLowerCase().includes('the rest of the phase') || (effect || '').toLowerCase().includes('for the rest of this phase') || isHeightened;
      
      setSelectUnitToBuffAbility({ 
        abilityId,
        name: abilityName, 
        effect: effect || '', 
        phase: isRelentlessRD ? (gameState.currentPhase as GamePhase) : (isHeightened ? 'combat' : (phase && phase !== 'passive' ? phase : undefined)) 
      });
      return;
    }

    // Check 4: Multi / Global Targeting
    if (analysis && analysis.targetingType === 'multi_friendly') {
      updated.usedAbilities[abilityId] = true;
      updated.logs.unshift(`⚡ Activated global-friendly ability: "${abilityName}" (applied to all friendly units)`);

      const allActiveFriendlyUnits = gameState.units.filter(u => !u.isSlain);
      if (!updated.appliedModifiers) updated.appliedModifiers = [];
      allActiveFriendlyUnits.forEach(uState => {
        analysis.allowedStats.forEach(stat => {
          let modifierVal = 1;
          let labelVal = `+1 ${stat.charAt(0).toUpperCase() + stat.slice(1)} (${abilityName})`;
          updated.appliedModifiers!.push({
            id: `${abilityId}-${uState.id}-${stat}-${Date.now()}`,
            unitId: uState.id,
            stat,
            modifier: modifierVal,
            label: labelVal,
            expiresRound: updated.round,
            expiresPhase: phase !== 'passive' ? phase : undefined,
            sourceAbilityId: abilityId,
            sourceAbilityEffect: foundAb?.effect
          });
        });
      });

      saveGame(updated);
      showToast(`Activated ${abilityName} globally for all friendly units!`, 'success');
      return;
    }

    // Fallback: Default trigger
    updated.usedAbilities[abilityId] = true;
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
    if (!gameState) return;
    const updated = { ...gameState };
    
    if (updated.currentPhase === 'combat') {
      const currentSub = updated.combatSubPhase || 'attacker_declare';
      if (currentSub === 'melee_fight') {
        updated.combatSubPhase = 'defender_declare';
        saveGame(updated);
        return;
      } else if (currentSub === 'defender_declare') {
        updated.combatSubPhase = 'attacker_declare';
        saveGame(updated);
        return;
      }
    }

    if (currentPhaseIndex > 0) {
      updated.currentPhase = phases[currentPhaseIndex - 1].id;
      if (updated.currentPhase === 'combat') {
        updated.combatSubPhase = 'melee_fight';
      } else {
        updated.combatSubPhase = undefined;
      }
      // Reset once-per-phase abilities (like Relentless Discipline) on phase changes
      if (updated.usedAbilities) {
        delete updated.usedAbilities['relentlessDiscipline'];
        delete updated.usedAbilities['relentlessDiscipline-2'];
      }
      saveGame(updated);
    }
  };

  const handleNextPhase = () => {
    if (!gameState) return;
    const updated = { ...gameState };
    const leavingPhase = updated.currentPhase;
    
    if (updated.currentPhase === 'combat') {
      const currentSub = updated.combatSubPhase || 'attacker_declare';
      if (currentSub === 'attacker_declare') {
        updated.combatSubPhase = 'defender_declare';
        saveGame(updated);
        return;
      } else if (currentSub === 'defender_declare') {
        updated.combatSubPhase = 'melee_fight';
        saveGame(updated);
        return;
      }
      updated.combatSubPhase = undefined;
    }
    
    if (currentPhaseIndex < phases.length - 1) {
      // Step to next phase in current turn
      updated.currentPhase = phases[currentPhaseIndex + 1].id;
      if (updated.currentPhase === 'combat') {
        updated.combatSubPhase = 'attacker_declare';
      } else {
        updated.combatSubPhase = undefined;
      }
      
      // Reset once-per-phase abilities (like Relentless Discipline) on phase changes
      if (updated.usedAbilities) {
        delete updated.usedAbilities['relentlessDiscipline'];
        delete updated.usedAbilities['relentlessDiscipline-2'];
      }
      
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

    // Clean up temporary turn-long modifiers at the end of the turn
    if (updated.appliedModifiers) {
      updated.appliedModifiers = updated.appliedModifiers.filter(mod => !mod.expiresTurn);
    }

    updated.logs.unshift(`⚔️ Finished turn for ${lastTurn === 'me' ? 'Me' : 'Opponent'}.`);

    // Increment round if switching back to the player who had priority (the Turn 2 player finishes their turn)
    const isRoundOver = lastTurn !== updated.roundFirstPlayer;
    if (isRoundOver) {
      if (updated.round < 4) {
        updated.previousRoundFirstPlayer = updated.roundFirstPlayer;
        updated.roundFirstPlayer = undefined; // Reset roundFirstPlayer so start-of-round setup overlay opens for next round
        updated.round += 1;
        updated.luminethFacetSelected = undefined; // Reset chosen Facet of War for the new round
        updated.logs.unshift(`🌟 --- START OF BATTLE ROUND ${updated.round} --- 🌟`);

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
      let foundAb = faction.battleTraits.find(a => a.id === key || (key.startsWith(a.id) && a.id === 'relentlessDiscipline')) ||
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
        // Clear session storage of any round tracking prompts
        if (typeof window !== 'undefined' && window.sessionStorage) {
          try {
            sessionStorage.clear();
          } catch (e) {
            console.warn(e);
          }
        }
        shownPromptsCache.clear();
        localStorage.removeItem('active_spearhead_game');
        router.push('/');
      }
    });
  };



  const toggleDeploymentStep = (stepNum: number) => {
    setDeploymentStepChecked(prev => ({
      ...prev,
      [stepNum]: !prev[stepNum]
    }));
  };

  const getDeploymentAbilities = () => {
    if (!faction) return [];
    const list: { name: string; source: string; timing: string; effect: string }[] = [];

    // Check battle traits
    if (faction.battleTraits) {
      faction.battleTraits.forEach(ab => {
        const text = `${ab.name} ${ab.effect} ${ab.timing || ''} ${ab.phase || ''}`.toLowerCase();
        if (text.includes('deployment') || text.includes('pre-battle') || (ab.timing && ab.timing.toLowerCase().includes('deployment'))) {
          list.push({
            name: ab.name,
            source: 'Battle Trait',
            timing: ab.timing || 'Deployment Phase',
            effect: ab.effect
          });
        }
      });
    }

    // Check all regiment abilities
    if (faction.regimentAbilities) {
      faction.regimentAbilities.forEach(reg => {
        const text = `${reg.name} ${reg.effect} ${reg.timing || ''} ${reg.phase || ''}`.toLowerCase();
        if (text.includes('deployment') || text.includes('pre-battle') || reg.phase === 'deployment' || (reg.timing && reg.timing.toLowerCase().includes('deployment'))) {
          list.push({
            name: reg.name,
            source: 'Regiment Ability',
            timing: reg.timing || 'Deployment Phase',
            effect: reg.effect
          });
        }
      });
    }

    // Check chosen enhancement
    const chosenEnh = faction.enhancements?.find(e => e.id === gameState?.selectedEnhancementId);
    if (chosenEnh) {
      const text = `${chosenEnh.name} ${chosenEnh.effect} ${chosenEnh.timing || ''} ${chosenEnh.phase || ''}`.toLowerCase();
      if (text.includes('deployment') || text.includes('pre-battle') || (chosenEnh.timing && chosenEnh.timing.toLowerCase().includes('deployment'))) {
        list.push({
          name: chosenEnh.name,
          source: 'Enhancement',
          timing: chosenEnh.timing || 'Deployment Phase',
          effect: chosenEnh.effect
        });
      }
    }

    // Check all units
    gameState?.units?.forEach(uState => {
      const uRules = faction.units?.find(un => un.id === uState.unitId);
      if (uRules) {
        uRules.abilities?.forEach(ab => {
          const text = `${ab.name} ${ab.effect} ${ab.timing || ''} ${ab.phase || ''}`.toLowerCase();
          if (text.includes('deployment') || text.includes('pre-battle') || (ab.timing && ab.timing.toLowerCase().includes('deployment'))) {
            if (!list.some(item => item.name === ab.name && item.source === uRules.name)) {
              list.push({
                name: ab.name,
                source: uRules.name,
                timing: ab.timing || 'Deployment Phase',
                effect: ab.effect
              });
            }
          }
        });
      }
    });

    return list;
  };

  const handleCompleteDeployment = () => {
    if (!gameState) return;
    const updated = {
      ...gameState,
      deploymentPhaseComplete: true,
      logs: [
        `🛡️ Pre-Battle Deployment Phase complete! Realm of Battle chosen: ${deploymentRealm.toUpperCase()}. Map chosen: Map ${deploymentMap}. Faction Role: ${deploymentRole.toUpperCase()}.`,
        ...gameState.logs
      ]
    };
    saveGame(updated);
    setDeploymentModalOpen(false);
    showToast('Deployment sequence completed successfully!', 'success');
  };

  const handleConfirmRoundInitialization = () => {
    if (!gameState || !roundInitializingModal) return;
    const updated = { ...gameState };

    const selectedGoesFirst = roundInitializingModal.goesFirst;
    const selectedUnderdog = roundInitializingModal.underdog;

    // Set first player and active turn
    updated.roundFirstPlayer = selectedGoesFirst;
    updated.activeTurn = selectedGoesFirst;
    if (updated.round === 1) {
      updated.currentPhase = 'deployment';
    } else {
      updated.currentPhase = 'start'; // back to start
    }

    // Set underdog
    updated.isUnderdog = selectedUnderdog === 'me';

    // Calculate double up
    let isMeDoubleUpped = false;
    let isOpponentDoubleUpped = false;
    if (updated.round > 1 && updated.previousRoundFirstPlayer) {
      if (updated.previousRoundFirstPlayer === 'me' && selectedGoesFirst === 'opponent') {
        isOpponentDoubleUpped = true;
      }
      if (updated.previousRoundFirstPlayer === 'opponent' && selectedGoesFirst === 'me') {
        isMeDoubleUpped = true;
      }
    }
    updated.meDoubleUpped = isMeDoubleUpped;
    updated.opponentDoubleUpped = isOpponentDoubleUpped;

    // Reset used once-per-phase/turn abilities for new round/turn (preserving once-per-battle)
    if (updated.usedAbilities) {
      Object.keys(updated.usedAbilities).forEach(key => {
        let isOncePerBattleAbility = false;
        
        // 1. Try to find in faction battle traits, regiment abilities, or enhancements
        let foundAb = faction?.battleTraits.find(a => a.id === key || (key.startsWith(a.id) && a.id === 'relentlessDiscipline')) ||
                      faction?.regimentAbilities.find(a => a.id === key) ||
                      faction?.enhancements.find(a => a.id === key);
        
        // 2. Try to find in unit abilities
        if (!foundAb && faction) {
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

        if (!isOncePerBattleAbility) {
          delete updated.usedAbilities[key];
        }
      });
    }

    updated.logs.unshift(`⚔️ Round ${updated.round} Initialized! Turn 1 goes to ${selectedGoesFirst === 'me' ? 'Player (Me)' : 'Opponent'}. ${selectedUnderdog === 'me' ? 'Player is Underdog.' : selectedUnderdog === 'opponent' ? 'Opponent is Underdog.' : ''}`);

    saveGame(updated);
    setRoundInitializingModal(null);
  };

  // Extract phase-specific abilities for reference
  const isAbilityAllowedByRound = (ab: Ability): boolean => {
    if (!gameState) return true;
    if ((ab.id === 'dreadDescent' || ab.name.toLowerCase() === 'dread descent') && gameState.round === 1) {
      return false;
    }
    return true;
  };

  const getAbilitiesForPhase = (phase: string): Ability[] => {
    const list: Ability[] = [];
    
    // Check if relentless discipline is active for Ossiarch Bonereapers
    const isOB = faction?.id === 'ossiarch-bonereapers';
    const isRelentlessActive = isOB && (gameState.selectedBattleTraitId === 'all' || gameState.selectedBattleTraitId === 'relentlessDiscipline');

    // Selected Battle Trait(s)
    if (gameState.selectedBattleTraitId === 'all') {
      faction.battleTraits.forEach(t => {
        if (t.id === 'relentlessDiscipline') {
          // Relentless Discipline is active in Movement, Charge, and Combat phases, NOT start phase
          if (['movement', 'charge', 'combat'].includes(phase) && isRelentlessActive) {
            list.push({ ...t, sourceType: 'trait' });
          }
        } else {
          // Skip Lumineth Facet of War sub-abilities here; they are custom injected
          const isLuminethFacet = ['shiningCompany', 'powerOfHysh', 'lightningReactions'].includes(t.id);
          if (isLuminethFacet) return;

          if (t.phase === phase && isAbilityAllowedByRound(t)) {
            list.push({ ...t, sourceType: 'trait' });
          }
        }
      });
    } else {
      const trait = faction.battleTraits.find(t => t.id === gameState.selectedBattleTraitId);
      if (trait) {
        if (trait.id === 'relentlessDiscipline') {
          if (['movement', 'charge', 'combat'].includes(phase) && isRelentlessActive) {
            list.push({ ...trait, sourceType: 'trait' });
          }
        } else {
          // Skip Lumineth Facet of War sub-abilities here; they are custom injected
          const isLuminethFacet = ['shiningCompany', 'powerOfHysh', 'lightningReactions'].includes(trait.id);
          if (!isLuminethFacet && trait.phase === phase && isAbilityAllowedByRound(trait)) {
            list.push({ ...trait, sourceType: 'trait' });
          }
        }
      }
    }

    // Regiment Abilities (Only active selected one in Spearhead)
    const activeRegimentAbilities = gameState.selectedRegimentAbilityId && gameState.selectedRegimentAbilityId !== 'all'
      ? faction.regimentAbilities.filter(reg => reg.id === gameState.selectedRegimentAbilityId)
      : faction.regimentAbilities;

    activeRegimentAbilities.forEach(reg => {
      if (reg.phase === phase && isAbilityAllowedByRound(reg)) {
        list.push({ ...reg, sourceType: 'regiment' });
      }
    });

    // Selected Enhancement
    const enhancement = faction.enhancements.find(e => e.id === gameState.selectedEnhancementId);
    if (enhancement) {
      if (
        (enhancement.phase === phase || (enhancement.phase === 'passive' && enhancement.passiveAppliedPhase === phase)) && 
        isAbilityAllowedByRound(enhancement)
      ) {
        list.push({ ...enhancement, sourceType: 'enhancement' });
      }
    }

    // If relentless discipline is active and we are in movement/charge/combat phase:
    // And if Peerless Cohesion is selected as a regiment ability, push the second use of relentless discipline!
    if (isRelentlessActive && ['movement', 'charge', 'combat'].includes(phase)) {
      const baseRD = faction.battleTraits.find(t => t.id === 'relentlessDiscipline');
      if (baseRD) {
        const hasPeerlessCohesion = gameState.selectedRegimentAbilityId === 'peerlessCohesion';
        if (hasPeerlessCohesion) {
          list.push({
            ...baseRD,
            id: 'relentlessDiscipline-2',
            name: 'Relentless Discipline (Second Use)',
            sourceType: 'trait'
          });
        }
      }
    }

    // Custom injector for Lumineth Glittering Phalanx Facets of War in active phases
    if (gameState.factionId === 'lumineth-realm-lords-glittering-phalanx') {
      if (gameState.luminethFacetSelected === 'lightningReactions' && phase === 'combat') {
        const lrTrait = faction.battleTraits.find(t => t.id === 'lightningReactions');
        if (lrTrait) {
          list.push({ ...lrTrait, sourceType: 'trait' });
        }
      }
      if (gameState.luminethFacetSelected === 'powerOfHysh' && phase === 'hero') {
        const pohTrait = faction.battleTraits.find(t => t.id === 'powerOfHysh');
        if (pohTrait) {
          list.push({ ...pohTrait, sourceType: 'trait' });
        }
      }
    }

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

  // Helper to get casting roll adjustments for active strategy cards
  const getCastingAdjustmentForAbility = (ability: Ability) => {
    const isCasting = ability.effect.toLowerCase().includes('casting roll') || 
                      ability.effect.toLowerCase().includes('casting rolls') ||
                      ability.timing?.toLowerCase().includes('hero phase') ||
                      ability.phase === 'hero';

    if (!isCasting) return null;

    const bonus = getCastingRollBonus();
    if (!bonus) return null;

    // Parse required roll (e.g., "7+" or "5+")
    const match = ability.effect.match(/On\s+a\s+(\d+)\+/i);
    if (!match) return null;

    const baseThreshold = parseInt(match[1], 10);
    const modifiedThreshold = Math.max(2, baseThreshold - bonus.value);

    return {
      bonusValue: bonus.value,
      bonusSource: bonus.source,
      baseRoll: `${baseThreshold}+`,
      modifiedRoll: `${modifiedThreshold}+`
    };
  };

  // Helper to determine if there is an active +1 (or more) modifier to casting/activation rolls
  function getCastingRollBonus(): { value: number; source: string } | null {
    if (!gameState || !faction) return null;

    // 1. Check Regiment Abilities
    const activeRegimentAbilities = gameState.selectedRegimentAbilityId && gameState.selectedRegimentAbilityId !== 'all'
      ? faction.regimentAbilities.filter(reg => reg.id === gameState.selectedRegimentAbilityId)
      : faction.regimentAbilities;

    for (const regiment of activeRegimentAbilities) {
      const eff = regiment.effect.toLowerCase();
      if (
        eff.includes('add 1 to casting roll') || 
        eff.includes('add 1 to casting rolls') || 
        eff.includes('add 2 to the casting roll') || 
        eff.includes('add 2 to casting roll') ||
        eff.includes('add 2 to casting rolls')
      ) {
        const val = eff.includes('add 2') ? 2 : 1;
        return { value: val, source: `${regiment.name} (Regiment Ability)` };
      }
    }

    // 2. Check Battle Traits
    const activeTraits = gameState.selectedBattleTraitId === 'all' 
      ? faction.battleTraits 
      : faction.battleTraits.filter(t => t.id === gameState.selectedBattleTraitId);
    
    for (const trait of activeTraits) {
      const eff = trait.effect.toLowerCase();
      if (
        eff.includes('add 1 to casting roll') || 
        eff.includes('add 1 to casting rolls') || 
        eff.includes('add 2 to casting roll') ||
        eff.includes('add 2 to casting rolls')
      ) {
        const val = eff.includes('add 2') ? 2 : 1;
        return { value: val, source: `${trait.name} (Battle Trait)` };
      }
    }

    // 3. Check selected Enhancement
    const enhancement = faction.enhancements.find(e => e.id === gameState.selectedEnhancementId);
    if (enhancement) {
      const eff = enhancement.effect.toLowerCase();
      if (
        eff.includes('add 1 to casting roll') || 
        eff.includes('add 1 to casting rolls') || 
        eff.includes('add 2 to casting roll') ||
        eff.includes('add 2 to casting rolls')
      ) {
        const val = eff.includes('add 2') ? 2 : 1;
        return { value: val, source: `${enhancement.name} (Enhancement)` };
      }
    }

    // 4. Check custom applied modifiers
    if (gameState.appliedModifiers) {
      const m = gameState.appliedModifiers.find(mod => 
        (mod.label.toLowerCase().includes('casting roll') || mod.label.toLowerCase().includes('casting buff') || mod.label.toLowerCase().includes('arcane prowess')) && 
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

    // Check if Relentless Discipline Ward (5+) is active on this unit
    const hasWard5PlusMod = unitId && gameState?.appliedModifiers?.some(mod => 
      mod.unitId === unitId && 
      mod.stat === 'ward' && 
      mod.label.includes('Ward (5+)')
    );

    if (statKey === 'ward' && hasWard5PlusMod) {
      let baseNum = 0;
      if (typeof baseValue === 'number') baseNum = baseValue;
      else baseNum = parseInt(baseValue, 10) || 0;

      return (
        <span 
          className="inline-flex items-center gap-1 cursor-help"
          title="Relentless Discipline Ward: This unit has Ward (5+) for the rest of the phase."
        >
          <span className="font-extrabold text-emerald-400 text-xs">5+</span>
          <span className="text-[10px] text-gray-500 line-through font-medium">({baseNum === 0 ? '-' : `${baseNum}+`})</span>
          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[8px] px-1 py-0 font-black uppercase tracking-wider shrink-0 select-none">
            WARD 5+
          </Badge>
        </span>
      );
    }

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
    const tooltipParts: string[] = [];
    mods.forEach(m => {
      const fullMod = gameState?.appliedModifiers?.find(am => 
        am.unitId === unitId && 
        am.stat === statKey && 
        am.modifier === m.modifier &&
        (am.label.includes(m.description) || m.description.includes(am.label) || am.label.includes('Discipline') || am.label.includes('Company') || am.label.includes('Hysh'))
      );
      
      if (fullMod && fullMod.sourceAbilityEffect) {
        tooltipParts.push(`${fullMod.label}: ${m.modifier > 0 ? '+' : ''}${m.modifier}\nRule: ${fullMod.sourceAbilityEffect}`);
      } else {
        tooltipParts.push(`${m.description}: ${m.modifier > 0 ? '+' : ''}${m.modifier}`);
      }
    });
    const tooltipText = tooltipParts.join('\n\n');

    const handleBadgeClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      let flashedAny = false;
      mods.forEach(m => {
        const fullMod = gameState?.appliedModifiers?.find(am => 
          am.unitId === unitId && 
          am.stat === statKey && 
          am.modifier === m.modifier &&
          (am.label.includes(m.description) || m.description.includes(am.label) || am.label.includes('Discipline') || am.label.includes('Company') || am.label.includes('Hysh'))
        );
        if (fullMod && fullMod.sourceAbilityId) {
          triggerAbilityFlash(fullMod.sourceAbilityId);
          flashedAny = true;
        }
      });
      
      if (flashedAny) {
        showToast("Linked ability card highlighted below!", "success");
      } else {
        // Fallback: flash by matching label substring
        const cleanDesc = mods[0]?.description?.toLowerCase() || '';
        const possibleAbilities = (faction?.battleTraits || [])
          .concat((faction?.regimentAbilities as any) || [])
          .concat((faction?.enhancements as any) || [])
          .concat((faction?.units?.flatMap(u => u.abilities) as any) || []);
        const match = possibleAbilities?.find(a => a && (a.name.toLowerCase().includes(cleanDesc) || cleanDesc.includes(a.name.toLowerCase())));
        if (match) {
          triggerAbilityFlash(match.id);
          showToast("Linked ability card highlighted below!", "success");
        }
      }
    };

    if (isNan) {
      // Fallback for non-numeric stats (e.g. "D3" or "D6")
      const sign = cappedTotalMod > 0 ? '+' : '';
      return (
        <span 
          className="inline-flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 select-none group" 
          title={tooltipText + "\n\n(Click to locate source ability card)"}
          onClick={handleBadgeClick}
        >
          <span>{baseValue}{suffix}</span>
          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[9px] px-1 py-0 font-bold uppercase tracking-wider shrink-0 select-none group-hover:bg-amber-500/20 group-hover:text-amber-400 group-hover:border-amber-500/30">
            {sign}{cappedTotalMod}
          </Badge>
        </span>
      );
    }

    const badgeColorClass = cappedTotalMod > 0 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20';
    const sign = cappedTotalMod > 0 ? '+' : '';

    return (
      <span 
        className="inline-flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 select-none group" 
        title={tooltipText + "\n\n(Click to locate source ability card)"}
        onClick={handleBadgeClick}
      >
        <span className="font-extrabold text-white text-xs group-hover:text-amber-400">{modifiedNum}{suffix}</span>
        <span className="text-[10px] text-gray-400 font-medium">({baseNum}{suffix})</span>
        <Badge className={`text-[8px] px-1 py-0 font-black uppercase tracking-wider shrink-0 select-none border transition-colors ${badgeColorClass} group-hover:bg-amber-500/20 group-hover:text-amber-400 group-hover:border-amber-500/30`}>
          {sign}{cappedTotalMod}
        </Badge>
      </span>
    );
  }

  // Check and compile round start rules for active popup modals (Deprecated in favor of the new unified roundInitializingModal)
  function checkRoundStartRules(round: number) {
    return;
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
      return a.phase === 'passive' && (!a.passiveAppliedPhase || a.passiveAppliedPhase === (phase as GamePhase)) && isAbilityAllowedByRound(a);
    };

    // Faction-wide passives
    if (gameState.selectedBattleTraitId === 'all') {
      faction.battleTraits.forEach(t => {
        // Skip Lumineth Facet of War sub-abilities here; they are custom injected
        const isLuminethFacet = ['shiningCompany', 'powerOfHysh', 'lightningReactions'].includes(t.id);
        if (isLuminethFacet) return;

        if (isMatched(t)) {
          list.push({ ...t, sourceType: 'trait' });
        }
      });
    } else {
      const trait = faction.battleTraits.find(t => t.id === gameState.selectedBattleTraitId);
      if (trait) {
        // Skip Lumineth Facet of War sub-abilities here; they are custom injected
        const isLuminethFacet = ['shiningCompany', 'powerOfHysh', 'lightningReactions'].includes(trait.id);
        if (!isLuminethFacet && isMatched(trait)) {
          list.push({ ...trait, sourceType: 'trait' });
        }
      }
    }

    const activeRegimentAbilities = gameState.selectedRegimentAbilityId && gameState.selectedRegimentAbilityId !== 'all'
      ? faction.regimentAbilities.filter(reg => reg.id === gameState.selectedRegimentAbilityId)
      : faction.regimentAbilities;

    activeRegimentAbilities.forEach(reg => {
      if (isMatched(reg)) {
        list.push({ ...reg, sourceType: 'regiment' });
      }
    });

    const enhancement = faction.enhancements.find(e => e.id === gameState.selectedEnhancementId);
    if (enhancement && isMatched(enhancement)) {
      list.push({ ...enhancement, sourceType: 'enhancement' });
    }

    // Custom injector for Lumineth Glittering Phalanx Facets of War passives
    if (gameState.factionId === 'lumineth-realm-lords-glittering-phalanx') {
      if (gameState.luminethFacetSelected === 'shiningCompany') {
        const scTrait = faction.battleTraits.find(t => t.id === 'shiningCompany');
        if (scTrait && isMatched(scTrait)) {
          list.push({ ...scTrait, sourceType: 'trait' });
        }
      }
      if (gameState.luminethFacetSelected === 'lightningReactions') {
        const lrTrait = faction.battleTraits.find(t => t.id === 'lightningReactions');
        if (lrTrait && isMatched(lrTrait)) {
          list.push({ ...lrTrait, sourceType: 'trait' });
        }
      }
    }

    // Custom injector for Daughters of Khaine: Blood Rites
    if (gameState.factionId === 'daughters-of-khaine') {
      const bloodRitesTrait = faction.battleTraits.find(t => t.id === 'bloodRites');
      if (bloodRitesTrait) {
        const activeLevel = getActiveBloodRitesRound(gameState);
        let showInPhase = false;
        if (phase === 'movement' && activeLevel >= 1) showInPhase = true;
        if (phase === 'charge' && activeLevel >= 2) showInPhase = true;
        if (phase === 'combat' && (activeLevel >= 3 || activeLevel >= 4)) showInPhase = true;
        
        if (showInPhase) {
          list.push({ ...bloodRitesTrait, sourceType: 'trait' });
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
      case 'enhancement': {
        const generalUnit = faction?.units?.find(u => u.isHero);
        const suffix = generalUnit ? ` (${generalUnit.name})` : '';
        return {
          border: 'border-amber-500/30 hover:border-amber-500/45',
          bg: 'bg-[#221c12]',
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          label: `Enhancement${suffix}`
        };
      }
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
          expiresRound: expiresRound,
          sourceAbilityId: 'eyeOfTheGods',
          sourceAbilityEffect: 'Ward of Tzeentch: This unit has Ward (6+).'
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
          expiresRound: expiresRound,
          sourceAbilityId: 'eyeOfTheGods',
          sourceAbilityEffect: 'Grace of Slaanesh: Add 1 to run rolls for this unit.'
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
          expiresRound: expiresRound,
          sourceAbilityId: 'eyeOfTheGods',
          sourceAbilityEffect: 'Blessing of Nurgle: Subtract 1 from wound rolls for attacks that target this unit.'
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
          expiresRound: expiresRound,
          sourceAbilityId: 'eyeOfTheGods',
          sourceAbilityEffect: "Fury of Khorne: Add 1 to the Rend characteristic of this unit's melee weapons."
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

    const hasAbilities = abilities.length > 0 || unitAbilities.length > 0;

    return (
      <Card className="border-[#222834] bg-[#151923] text-white">
        <CardHeader className="border-b border-[#222834] py-3.5">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
              <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" /> 
              Abilities (Round {gameState.round})
            </CardTitle>
            <Badge variant="outline" className="uppercase text-[9px] border-amber-500/30 bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5">
              ACTIVE ABILITIES
            </Badge>
          </div>
          <CardDescription className="text-xxs text-gray-400 mt-0.5">
            Use these strategy abilities when you resolve your combat actions. Click to mark as triggered.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {hasAbilities && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Faction-Level Strategy Cards */}
              {abilities.map(ability => {
                const isUsed = !!gameState.usedAbilities[ability.id];
                const style = getAbilityStyleClasses(ability.sourceType);

                // Find which units this ability is currently applied to
                const appliedMods = gameState.appliedModifiers?.filter(m => 
                  m.sourceAbilityId === ability.id || 
                  (m.sourceAbilityId && (m.sourceAbilityId.endsWith(`-${ability.id}`) || m.sourceAbilityId.startsWith(`${ability.id}-`)))
                ) || [];
                const appliedUnitNames = Array.from(new Set(appliedMods.map(m => {
                  const uState = gameState.units.find(u => u.id === m.unitId);
                  if (!uState) return '';
                  const uRules = faction.units.find(ru => ru.id === uState.unitId);
                  return uRules ? uRules.name : uState.id;
                }).filter(Boolean)));

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
                          <Badge variant="secondary" className="bg-[#151923] text-amber-400 text-xxs uppercase shrink-0 font-bold">
                            {ability.once.replace('-', ' ')}
                          </Badge>
                        )}
                      </div>
                      {ability.timing && <CardDescription className="text-xxs text-amber-400/80 mt-0.5 font-semibold">{ability.timing}</CardDescription>}
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                      <p className="text-xxs text-gray-400 leading-normal whitespace-pre-line font-medium">{ability.effect}</p>
                      
                      {appliedUnitNames.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-[#2c3548]/30 text-[10px] text-amber-500 font-extrabold flex items-center gap-1 leading-none select-none">
                          <span>🎯</span> Applied to: <strong className="text-amber-400 font-black">{appliedUnitNames.join(', ')}</strong>
                        </div>
                      )}

                      {(() => {
                        const castAdj = getCastingAdjustmentForAbility(ability);
                        if (!castAdj) return null;
                        return (
                          <div className="mt-3 pt-2.5 border-t border-[#2c3548]/30 space-y-2">
                            <div className="flex items-center gap-1.5 bg-purple-500/5 border border-purple-500/10 rounded-lg p-2 text-[10px] text-gray-300">
                              <span className="text-purple-400">🔮</span>
                              <div>
                                <p className="font-extrabold text-purple-400 uppercase tracking-wide text-[9px]">
                                  Casting Roll Success: <span className="line-through text-gray-500 mr-1">{castAdj.baseRoll}</span> {castAdj.modifiedRoll}
                                </p>
                                <p className="text-[8px] text-gray-400 mt-0.5 font-medium">
                                  Reduced from {castAdj.baseRoll} via <strong className="text-purple-400">{castAdj.bonusSource}</strong> (+{castAdj.bonusValue} modifier)
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                      
                      {['relentlessDiscipline', 'relentlessDiscipline-2'].includes(ability.id) && (
                        <div className="mt-3 pt-2.5 border-t border-[#222834] space-y-2 text-[10px] text-gray-300">
                          <div className="flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2">
                            <span className="text-amber-400">🎲</span>
                            <div>
                              <p className="font-extrabold text-amber-400 uppercase tracking-wide text-[9px]">
                                Discipline Roll Success: {gameState.selectedRegimentAbilityId === 'immaculateGeneralship' ? '3+' : '4+'}
                              </p>
                              {gameState.selectedRegimentAbilityId === 'immaculateGeneralship' && (
                                <p className="text-[8px] text-gray-400 mt-0.5 font-medium">
                                  (Reduced from 4+ via <strong className="text-amber-500">Immaculate Generalship</strong> +1 modifier)
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-1.5 bg-[#151923]/80 rounded-lg p-2 border border-[#222834]">
                            <span className="text-sky-400 mt-0.5">ℹ️</span>
                            <div>
                              <p className="font-extrabold text-sky-400 uppercase tracking-wide text-[9px]">Heralds of Nagash Note</p>
                              <p className="text-[8px] text-gray-400 mt-0.5 leading-relaxed font-medium">
                                Add <strong className="text-sky-400">+1 to the discipline roll</strong> if the target unit is wholly within 12" of friendly <strong className="text-gray-300">Morghast Archai</strong> models.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
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
                        <span className="text-lg font-black text-gray-500 uppercase rotate-[-12deg] tracking-widest bg-zinc-900/60 px-3 py-1 rounded border border-gray-600">USED</span>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
          
          {renderGlobalCoreAbilities('combat')}
        </CardContent>
      </Card>
    );
  };

  const renderOpponentDeclarationPlaceholder = (sub: 'attacker' | 'defender') => {
    return (
      <Card className="border-[#2c3548] bg-[#151923] text-white shadow-xl">
        <CardHeader className="border-b border-[#2c3548] py-4 bg-rose-950/10">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-rose-400">
              <span className="animate-pulse">🔴</span> Opponent Declaring {sub === 'attacker' ? 'Combat' : 'Reaction'} Abilities
            </CardTitle>
            <Badge className="bg-rose-500/25 text-rose-300 font-extrabold text-[9px] uppercase tracking-wider">
              OPPONENT TURN SUB-PHASE
            </Badge>
          </div>
          <CardDescription className="text-xxs text-gray-400 mt-0.5">
            The opponent is currently declaring their {sub === 'attacker' ? 'combat strategy' : 'defensive/reaction'} abilities. Use this placeholder panel to track their declarations.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="p-4 bg-[#0d1017]/80 rounded-xl border border-[#222834] space-y-3">
            <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest block">📝 Quick-Select Common Opponent Abilities:</span>
            <div className="flex flex-wrap gap-2">
              {['All-out Attack (+1 Hit)', 'All-out Defence (+1 Save)', 'Inspire (+1 Wound)', 'Counter-Charge', 'Redeploy', 'Unleash Hell'].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const existing = gameState.notes || '';
                    const updated = {
                      ...gameState,
                      notes: existing + (existing ? '\n' : '') + `Opponent declared: ${item}`
                    };
                    setGameState(updated);
                    localStorage.setItem('active_spearhead_game', JSON.stringify(updated));
                    showToast(`Logged opponent ability: "${item}"`, "success");
                  }}
                  className="px-2.5 py-1.5 bg-[#1c2230] hover:bg-amber-500/20 text-xxs font-bold text-gray-300 hover:text-amber-400 border border-[#2c3548] hover:border-amber-500/30 rounded transition-all"
                >
                  ➕ {item}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Opponent Declaration & Combat Notes:</label>
            <textarea
              value={gameState.notes || ''}
              onChange={(e) => {
                const updated = { ...gameState, notes: e.target.value };
                setGameState(updated);
                localStorage.setItem('active_spearhead_game', JSON.stringify(updated));
              }}
              placeholder="Type any opponent abilities declared, active spell effects, or combat notes here..."
              rows={4}
              className="w-full text-xs font-medium text-white bg-[#1c2230] border border-[#2c3548]/80 focus:border-amber-500/50 rounded-xl p-3 placeholder-gray-500 focus:outline-none transition-all resize-none"
            />
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

    const activeRegimentAbilities = gameState.selectedRegimentAbilityId && gameState.selectedRegimentAbilityId !== 'all'
      ? faction.regimentAbilities.filter(reg => reg.id === gameState.selectedRegimentAbilityId)
      : faction.regimentAbilities;

    activeRegimentAbilities.forEach(reg => {
      if (reg.isDefense && (reg.phase === 'combat' || reg.phase === 'passive')) {
        defAbilities.push({ source: 'Regiment', name: reg.name, timing: reg.timing, effect: reg.effect, id: reg.id, key: reg.id });
      }
    });

    const enhancement = faction.enhancements.find(a => a.id === gameState.selectedEnhancementId);
    if (enhancement && enhancement.isDefense && (enhancement.phase === 'combat' || enhancement.phase === 'passive')) {
      const generalUnit = faction?.units?.find(u => u.isHero);
      const sourceName = generalUnit ? `Enhancement (${generalUnit.name})` : 'Enhancement';
      defAbilities.push({ source: sourceName, name: enhancement.name, timing: enhancement.timing, effect: enhancement.effect, id: enhancement.id, key: enhancement.id });
    }

    // Specifically check for Lode of Saturation as a defensive response if active
    if (gameState.selectedEnhancementId === 'lodeOfSaturation') {
      const lode = faction?.enhancements?.find(e => e.id === 'lodeOfSaturation');
      if (lode && !defAbilities.some(a => a.id === 'lodeOfSaturation')) {
        const generalUnit = faction?.units?.find(u => u.isHero);
        const sourceName = generalUnit ? `Enhancement (${generalUnit.name})` : 'Enhancement';
        defAbilities.push({
          source: sourceName,
          name: lode.name,
          timing: lode.timing || 'Passive',
          effect: lode.effect,
          id: lode.id,
          key: lode.id
        });
      }
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
    // Helper to render an individual unit combat card
    const renderUnitCombatCard = (u: UnitState, uRules: Unit) => {
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
          
          <div 
            onClick={() => {
              setExpandedUnitRefIds(prev => ({
                ...prev,
                [u.id]: !prev[u.id]
              }));
            }}
            className="flex justify-between items-start gap-2 border-b border-[#2c3548]/40 pb-2 cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-all select-none"
            title="Click unit header to toggle original reference abilities"
          >
            <div>
              <h5 className="text-xs font-black text-white flex items-center gap-1.5 flex-wrap">
                <span className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  <span>{expandedUnitRefIds[u.id] ? '📖' : '📘'}</span>
                  <span>{uRules.name}</span>
                </span>
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
              <div className="text-xxs text-amber-500 font-semibold flex items-center gap-2 flex-wrap mt-0.5 select-none" onClick={(e) => e.stopPropagation()}>
                <span className="flex items-center gap-1">Save: {renderStatWithModifier(uRules.save, 'save', u.id, '+')}</span>
                {(uRules.ward > 0 || getActiveModifiers('ward', u.id).length > 0 || uRules.id === 'vanariBladelords' || (uRules.isHero && gameState?.units?.some(unit => unit.unitId === 'vanariBladelords' && !unit.isSlain))) && (
                  <span className="flex items-center gap-1">| Ward: {renderStatWithModifier(uRules.ward || 0, 'ward', u.id)}</span>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleUnitStateFlag(u.id, 'fought');
              }}
              className={`px-3 py-1 rounded text-xxs font-black uppercase transition-all shrink-0
                ${u.fought 
                  ? 'bg-[#151923] text-gray-500 border border-transparent' 
                  : 'bg-rose-600 text-white hover:bg-rose-700 shadow-md'}`}
            >
              {u.fought ? 'Activated' : 'Fight'}
            </button>
          </div>

          {/* Reference abilities panel toggled by clicking header */}
          {expandedUnitRefIds[u.id] && (
            <div className="p-3 bg-[#121620] border border-[#2c3548]/40 rounded-xl space-y-2.5 text-left animate-fade-in text-xxs">
              <div className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5 pb-1 border-b border-[#2c3548]/20">
                <span>📚</span> Original Base Abilities (For Reference)
              </div>
              {uRules.abilities.length === 0 ? (
                <p className="text-[10px] text-gray-500 italic">This unit has no custom abilities.</p>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {uRules.abilities.map(ab => (
                    <div key={ab.id} className="border-t border-[#2c3548]/15 pt-1.5 first:border-t-0 first:pt-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong className="text-white font-black text-[11px]">
                          {ab.name}
                          {ab.id === 'skeletonLegion' && gameState?.selectedEnhancementId === 'graveSandShard' && (
                            <span className="text-[9px] text-emerald-400 font-black ml-1.5">(+1 Legion Rolls)</span>
                          )}
                        </strong>
                        <Badge className="bg-[#1c2230] text-gray-400 border border-[#2c3548] text-[7px] px-1 py-0 font-bold uppercase tracking-wider">{ab.phase} • {ab.timing || 'Any Phase'}</Badge>
                      </div>
                      <p className="text-[10px] text-gray-300 mt-0.5 whitespace-pre-line leading-normal italic">"{ab.effect}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                  onClick={() => adjustWoundsById(u.id, 1)}
                  className="px-2.5 py-0.5 hover:bg-[#2c3548] text-gray-400 hover:text-red-400 font-extrabold text-xs transition-all"
                >
                  -
                </button>
                <span className="px-3 font-black text-white text-xs min-w-[3.5rem] text-center">
                  {uRules.health - (u.currentWounds || 0)} / {uRules.health} HP
                </span>
                <button
                  onClick={() => adjustWoundsById(u.id, -1)}
                  className="px-2.5 py-0.5 hover:bg-[#2c3548] text-gray-400 hover:text-emerald-400 font-extrabold text-xs transition-all"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Combat Activation Sequence Speed Selector */}
          <div className="flex items-center justify-between gap-2 p-1.5 bg-[#151923]/60 rounded-xl border border-[#222834]/80 text-xxs">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide px-1 flex items-center gap-1">
              <span>⏱️</span>
              <span>Order</span>
            </span>
            <div className="flex items-center bg-[#1c2230] p-0.5 rounded border border-[#2c3548] overflow-hidden text-[9px] font-black uppercase shrink-0">
              <button 
                onClick={() => setUnitCombatOrder(u.id, 'first')}
                className={`px-2 py-0.5 rounded-sm transition-all flex items-center gap-1 ${getUnitCombatOrder(u, uRules) === 'first' ? 'bg-amber-500/25 text-amber-400 border border-amber-500/20 font-black' : 'text-gray-500 hover:text-gray-300'}`}
              >
                ⚡ First
              </button>
              <button 
                onClick={() => setUnitCombatOrder(u.id, 'normal')}
                className={`px-2 py-0.5 rounded-sm transition-all flex items-center gap-1 ${getUnitCombatOrder(u, uRules) === 'normal' ? 'bg-[#2c3548] text-gray-300 font-black' : 'text-gray-500 hover:text-gray-300'}`}
              >
                ⚔️ Normal
              </button>
              <button 
                onClick={() => setUnitCombatOrder(u.id, 'last')}
                className={`px-2 py-0.5 rounded-sm transition-all flex items-center gap-1 ${getUnitCombatOrder(u, uRules) === 'last' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/15 font-black' : 'text-gray-500 hover:text-gray-300'}`}
              >
                🛡️ Last
              </button>
            </div>
          </div>

          {/* Passive Spatial Checks Interactive Checkboxes Panel */}
          {(() => {
            // Find any of the unit's base abilities that are passives and have spatial/conditional checks
            const passiveSpatialAbilities = uRules.abilities.filter(ab => {
              if (ab.phase !== 'passive') return false;
              const analysis = analyzeAbilityRule(ab, faction);
              return analysis.hasSpatialOrConditionalCheck;
            });

            // Append regiment abilities and battle traits if they apply to this unit and have spatial/conditional checks OR casting/roll modifiers!
            const extraAbilities: Ability[] = [];
            
            // Faction battle traits
            const activeTraits = gameState.selectedBattleTraitId === 'all' 
              ? faction.battleTraits 
              : faction.battleTraits.filter(t => t.id === gameState.selectedBattleTraitId);
            activeTraits.forEach(t => {
              // Skip Lumineth Facets of War unless it is the currently selected facet
              const isLuminethFacet = ['shiningCompany', 'powerOfHysh', 'lightningReactions'].includes(t.id);
              if (isLuminethFacet && gameState.luminethFacetSelected !== t.id) {
                return;
              }

              if (t.phase === 'passive') {
                const analysis = analyzeAbilityRule(t, faction);
                const isHeroOnly = analysis.heroOrGeneralOnly || t.effect.toLowerCase().includes('your general');
                if (!isHeroOnly || uRules.isHero) {
                  if (analysis.hasSpatialOrConditionalCheck || t.effect.toLowerCase().includes('casting roll') || t.effect.toLowerCase().includes('casting rolls')) {
                    extraAbilities.push({ ...t, sourceType: 'trait' });
                  }
                }
              }
            });

            // Regiment abilities
            const activeRegimentAbilities = gameState.selectedRegimentAbilityId && gameState.selectedRegimentAbilityId !== 'all'
              ? faction.regimentAbilities.filter(reg => reg.id === gameState.selectedRegimentAbilityId)
              : faction.regimentAbilities;

            activeRegimentAbilities.forEach(reg => {
              if (reg.phase === 'passive') {
                const analysis = analyzeAbilityRule(reg, faction);
                const isHeroOnly = analysis.heroOrGeneralOnly || reg.effect.toLowerCase().includes('your general');
                if (!isHeroOnly || uRules.isHero) {
                  if (analysis.hasSpatialOrConditionalCheck || reg.effect.toLowerCase().includes('casting roll') || reg.effect.toLowerCase().includes('casting rolls')) {
                    extraAbilities.push({ ...reg, sourceType: 'regiment' });
                  }
                }
              }
            });

            const combinedAbilities = [...passiveSpatialAbilities, ...extraAbilities];
            
            if (combinedAbilities.length === 0) return null;
            
            return (
              <div className="p-3 bg-purple-500/5 border border-purple-500/15 rounded-xl space-y-2 text-left">
                <span className="text-[9px] text-purple-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                  🗺️ Passive Spatial Check Modifiers (Toggle to apply):
                </span>
                <div className="flex flex-col gap-1.5">
                  {combinedAbilities.map(ab => {
                    const isApplied = gameState.appliedModifiers?.some(m => m.unitId === u.id && m.sourceAbilityId === ab.id);
                    return (
                      <div key={ab.id} className="flex items-start justify-between gap-3 p-2 bg-[#151923]/50 border border-[#222834] rounded-lg">
                        <div className="flex-grow">
                          <h6 className="text-xxs font-black text-purple-300 flex items-center gap-1.5">
                            <span>📍</span> {ab.name}
                          </h6>
                          <p className="text-[10px] text-gray-300 leading-normal mt-0.5 whitespace-pre-line italic">"{ab.effect}"</p>
                        </div>
                        <div className="flex items-center shrink-0 pt-0.5">
                          <input
                            type="checkbox"
                            checked={!!isApplied}
                            onChange={(e) => toggleSpatialCheckBuff(u.id, ab, e.target.checked)}
                            className="h-4.5 w-4.5 rounded border-[#2c3548] text-purple-600 focus:ring-purple-500 cursor-pointer bg-[#151923]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

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

          {/* Under the Dice Math: Applied / Active Abilities list */}
          {(() => {
            // Get all unique sourceAbilityIds of applied modifiers on this unit
            const unitMods = gameState.appliedModifiers?.filter(m => m.unitId === u.id) || [];
            const uniqueAbilityIds = Array.from(new Set(unitMods.map(m => m.sourceAbilityId).filter(Boolean))) as string[];
            
            const allFactionAbilities = (faction?.battleTraits || [])
              .concat((faction?.regimentAbilities as any) || [])
              .concat((faction?.enhancements as any) || [])
              .concat((faction?.units?.flatMap(unitRules => unitRules.abilities) as any) || []);

            // Collect all dynamic/on-the-fly modifiers for this unit to display their source abilities
            const dynamicMods: { sourceAbilityId: string; label: string; effect: string; name: string }[] = [];
            
            // 1. Check unit-level stats
            const statsToCheck: ('attacks' | 'hit' | 'wound' | 'rend' | 'damage' | 'save' | 'ward')[] = ['save', 'ward'];
            statsToCheck.forEach(stat => {
              const active = getActiveModifiers(stat, u.id);
              active.forEach(m => {
                // Skip if this modifier is a manual one (already tracked via appliedModifiers)
                const isManualMod = unitMods.some(mod => mod.label === m.description);
                if (isManualMod) return;

                let sourceId = '';
                let abName = '';
                let abEffect = '';
                const descLower = m.description.toLowerCase();
                
                const matchedAb = allFactionAbilities.find(a => a && descLower.includes(a.name.toLowerCase()));
                if (matchedAb) {
                  sourceId = matchedAb.id;
                  abName = matchedAb.name;
                  abEffect = matchedAb.effect;
                } else if (descLower.includes('zealot') || descLower.includes('blood rite') || descLower.includes('quickening') || descLower.includes('headlong') || descLower.includes('slaughterer')) {
                  sourceId = 'bloodRites';
                  abName = "Blood Rites";
                  abEffect = "At the start of each battle round, all friendly units gain the Blood Rites passive ability that corresponds to the current battle round number.";
                } else if (descLower.includes('eye of the gods') || descLower.includes('dread banner')) {
                  sourceId = 'eyeOfTheGods';
                  abName = "Eye of the Gods";
                  abEffect = "Roll on the Eye of the Gods table to gain random blessings.";
                }
                
                if (sourceId) {
                  dynamicMods.push({
                    sourceAbilityId: sourceId,
                    name: abName,
                    effect: abEffect,
                    label: m.description
                  });
                }
              });
            });

            // 2. Check weapon-level stats
            const unitWeapons = uRules?.weapons || [];
            unitWeapons.forEach(w => {
              const weaponStats: ('attacks' | 'hit' | 'wound' | 'rend' | 'damage')[] = ['attacks', 'hit', 'wound', 'rend', 'damage'];
              weaponStats.forEach(stat => {
                const active = getActiveModifiers(stat, u.id, w.name);
                active.forEach(m => {
                  // Skip if this modifier is a manual one (already tracked via appliedModifiers)
                  const isManualMod = unitMods.some(mod => mod.label === m.description);
                  if (isManualMod) return;

                  let sourceId = '';
                  let abName = '';
                  let abEffect = '';
                  const descLower = m.description.toLowerCase();
                  
                  const matchedAb = allFactionAbilities.find(a => a && descLower.includes(a.name.toLowerCase()));
                  if (matchedAb) {
                    sourceId = matchedAb.id;
                    abName = matchedAb.name;
                    abEffect = matchedAb.effect;
                  } else if (descLower.includes('zealot') || descLower.includes('blood rite') || descLower.includes('quickening') || descLower.includes('headlong') || descLower.includes('slaughterer')) {
                    sourceId = 'bloodRites';
                    abName = "Blood Rites";
                    abEffect = "At the start of each battle round, all friendly units gain the Blood Rites passive ability that corresponds to the current battle round number.";
                  } else if (descLower.includes('eye of the gods') || descLower.includes('dread banner')) {
                    sourceId = 'eyeOfTheGods';
                    abName = "Eye of the Gods";
                    abEffect = "Roll on the Eye of the Gods table to gain random blessings.";
                  }
                  
                  if (sourceId) {
                    dynamicMods.push({
                      sourceAbilityId: sourceId,
                      name: abName,
                      effect: abEffect,
                      label: m.description
                    });
                  }
                });
              });
            });

            // Combine manual and dynamic ones into a unified display list
            const listItems: { id: string; name: string; effect: string; statsModified: string; isDynamic?: boolean }[] = [];
            
            // Add manually applied ones
            uniqueAbilityIds.forEach(abId => {
              const ab = allFactionAbilities.find(a => a && (a.id === abId || abId.endsWith(`-${a.id}`)));
              if (ab) {
                const statsModified = unitMods.filter(m => m.sourceAbilityId === abId).map(m => m.label).join(', ');
                listItems.push({
                  id: abId,
                  name: ab.name,
                  effect: ab.effect,
                  statsModified: statsModified
                });
              }
            });

            // Add dynamic/on-the-fly ones
            dynamicMods.forEach(dyn => {
              const alreadyAdded = listItems.find(item => item.id === dyn.sourceAbilityId);
              if (!alreadyAdded) {
                listItems.push({
                  id: dyn.sourceAbilityId,
                  name: dyn.name,
                  effect: dyn.effect,
                  statsModified: dyn.label,
                  isDynamic: true
                });
              } else {
                if (!alreadyAdded.statsModified.includes(dyn.label)) {
                  alreadyAdded.statsModified += `, ${dyn.label}`;
                }
              }
            });

            if (listItems.length === 0) {
              return (
                <div className="p-2.5 bg-[#151923]/40 border border-[#2c3548]/15 rounded-lg text-left text-xxs">
                  <span className="text-gray-500 font-bold uppercase tracking-wider">✨ Applied Abilities list is empty. Only active abilities are listed here.</span>
                </div>
              );
            }
            
            return (
              <div className="p-3 bg-emerald-950/15 border border-emerald-500/20 rounded-xl space-y-2 text-left">
                <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Applied Active Abilities on Unit:
                </span>
                <div className="space-y-2">
                  {listItems.map(item => {
                    // Check if this card is currently being highlighted / blinking
                    const isHighlighted = highlightedAbilityId === item.id;
                    const highlightClasses = isHighlighted ? 'animate-blink-gold border-amber-500 ring-2 ring-amber-500 bg-amber-500/25 p-2 rounded-lg' : '';
                    
                    return (
                      <div 
                        key={item.id} 
                        className={`border-t border-emerald-500/10 pt-1.5 first:border-t-0 first:pt-0 transition-all duration-300 ${highlightClasses}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-xxs font-black text-white flex items-center gap-1.5">
                            <span>✨</span> {item.name}
                            <Badge className="bg-emerald-500/15 text-emerald-400 text-[8px] font-bold border border-emerald-500/20 py-0">
                              {item.isDynamic ? 'SPECIAL RULE' : 'ACTIVE'}
                            </Badge>
                          </h5>
                          <Badge className="bg-[#151923] text-gray-400 text-[8px] font-semibold border border-[#2c3548] py-0 max-w-[50%] truncate">
                            {item.statsModified}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-gray-300 mt-1 whitespace-pre-line leading-normal italic">
                          "{item.effect}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

        </div>
      );
    };

    // Filter and map all active units
    const activeUnits = gameState.units.filter(u => !u.isSlain).map(u => {
      const uRules = faction.units.find(rules => rules.id === u.unitId);
      return { u, uRules };
    }).filter(item => !!item.uRules) as { u: UnitState; uRules: Unit }[];

    // Group units by their combat speed
    const firstGroup = activeUnits.filter(item => getUnitCombatOrder(item.u, item.uRules) === 'first');
    const normalGroup = activeUnits.filter(item => getUnitCombatOrder(item.u, item.uRules) === 'normal');
    const lastGroup = activeUnits.filter(item => getUnitCombatOrder(item.u, item.uRules) === 'last');

    const totalCount = activeUnits.length;
    if (totalCount === 0) return null;

    return (
      <Card className="border-[#222834] bg-[#151923] text-white shadow-xl">
        <CardHeader className="border-b border-[#222834] py-3.5">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-rose-400">
              <Swords className="h-4.5 w-4.5 text-rose-400" /> My Melee Combat Activations
            </CardTitle>
            <Badge variant="outline" className="uppercase text-[9px] border-rose-500/30 bg-rose-500/10 text-rose-400 font-bold px-2 py-0.5">
              ACTIVATIONS PROTOCOL
            </Badge>
          </div>
          <CardDescription className="text-xxs text-gray-400 mt-0.5 leading-relaxed">
            Resolve melee attacks sequentially based on combat speed groups. Toggle "Fight" on a unit after resolving its attacks.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-6">
          {/* 1. STRIKE-FIRST GROUP */}
          {firstGroup.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2">
                <span className="text-sm animate-bounce">⚡</span>
                <div className="flex flex-col">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">⚡ Strike-First Activations</h4>
                  <span className="text-[9px] text-gray-400 font-semibold leading-none">Units in this group fight first. Starting with the active turn player, alternate activations.</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {firstGroup.map(({ u, uRules }) => renderUnitCombatCard(u, uRules))}
              </div>
            </div>
          )}

          {/* 2. NORMAL COMBAT GROUP */}
          {normalGroup.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-[#2c3548]/50 pb-2">
                <span className="text-sm">⚔️</span>
                <div className="flex flex-col">
                  <h4 className="text-xs font-black text-gray-300 uppercase tracking-wider">⚔️ Normal Combat Activations</h4>
                  <span className="text-[9px] text-gray-400 font-semibold leading-none">Standard combat phase activations. Starting with the active turn player, alternate fighting with these units.</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {normalGroup.map(({ u, uRules }) => renderUnitCombatCard(u, uRules))}
              </div>
            </div>
          )}

          {/* 3. STRIKE-LAST GROUP */}
          {lastGroup.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-rose-500/20 pb-2">
                <span className="text-sm">🛡️</span>
                <div className="flex flex-col">
                  <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider">🛡️ Strike-Last Activations</h4>
                  <span className="text-[9px] text-gray-400 font-semibold leading-none">Units in this group fight last. After all other groups finish, starting with the active turn player, alternate activations.</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lastGroup.map(({ u, uRules }) => renderUnitCombatCard(u, uRules))}
              </div>
            </div>
          )}
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

  const renderGlobalCoreAbilities = (phase: string) => {
    // Only display global abilities in Movement, Shooting, Charge, and Combat phases
    if (!['movement', 'shooting', 'charge', 'combat'].includes(phase)) return null;

    // Define core global abilities
    const globalAbilitiesMap: Record<string, { name: string; type: string; effect: string; ruleRef?: string }[]> = {
      movement: [
        { 
          name: 'Normal Move', 
          type: 'CORE MOVEMENT', 
          effect: 'Pick 1 friendly unit that has not yet moved this phase. The unit can move a distance up to its Move characteristic.',
          ruleRef: 'Rule 12.0'
        },
        { 
          name: 'Run', 
          type: 'CORE MOVEMENT', 
          effect: 'Pick 1 friendly unit that has not yet moved this phase. Add D6" to its Move characteristic for the phase. It cannot shoot or charge later this turn.',
          ruleRef: 'Rule 13.0'
        },
        { 
          name: 'Retreat', 
          type: 'CORE MOVEMENT', 
          effect: 'Pick 1 friendly unit that is within 3" of an enemy unit. The unit can move a distance up to its Move characteristic, but must end the move more than 3" from all enemy units. It cannot shoot or charge later this turn.',
          ruleRef: 'Rule 14.0'
        }
      ],
      shooting: [
        { 
          name: 'Shoot', 
          type: 'CORE SHOOT', 
          effect: 'Pick 1 friendly unit that is not within 3" of an enemy unit, and did not Run or Retreat this turn. It can target enemy units within range using its missile (ranged) weapons.',
          ruleRef: 'Rule 16.0'
        }
      ],
      charge: [
        { 
          name: 'Charge', 
          type: 'CORE CHARGE', 
          effect: 'Pick 1 friendly unit that is within 12" of an enemy unit and did not Run or Retreat. Roll 2D6. If the charge roll is high enough to move the unit within combat range (1/2") of an enemy unit, the charge is successful and the unit makes a charge move.',
          ruleRef: 'Rule 17.0'
        }
      ],
      combat: [
        { 
          name: 'Fight', 
          type: 'CORE COMBAT', 
          effect: 'Pick 1 friendly unit that is within 3" of an enemy unit or has made a charge move this turn. Pile in up to 3" towards the closest enemy model, then resolve melee attacks with its melee weapons.',
          ruleRef: 'Rule 19.0'
        }
      ]
    };

    const list = globalAbilitiesMap[phase];
    if (!list || list.length === 0) return null;

    return (
      <div className="space-y-3 mt-4 pt-4 border-t border-[#222834]/40 text-left">
        <div className="flex justify-between items-center pb-1">
          <h4 className="text-xxs font-black text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
            <span>🌍</span> Global Core Abilities ({phase.toUpperCase()} PHASE):
          </h4>
          <Badge className="bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[8px] font-black uppercase tracking-wider">
            FREE FOR ALL UNITS
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {list.map((ab, idx) => (
            <Card key={idx} className="bg-[#151923]/45 border border-[#2c3548]/30 hover:border-sky-500/30 transition-all p-3.5 space-y-1.5 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start gap-1">
                <div>
                  <span className="text-[8px] font-extrabold text-sky-400 uppercase tracking-widest block">{ab.type}</span>
                  <h5 className="text-xs font-black text-white mt-0.5">{ab.name}</h5>
                </div>
                {ab.ruleRef && (
                  <Badge variant="outline" className="text-gray-500 border-gray-800 text-[8px] font-semibold py-0">
                    {ab.ruleRef}
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-gray-300 leading-normal font-medium">{ab.effect}</p>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderNonCombatActiveStrategy = () => {
    if (gameState.currentPhase === 'combat') return null;

    // During opponent's turn, the Hero, Movement, Shooting, and Charge phase skills should not be available
    if (gameState.activeTurn === 'opponent' && ['hero', 'movement', 'shooting', 'charge'].includes(gameState.currentPhase)) {
      return null;
    }

    const factionAbilities = getAbilitiesForPhase(gameState.currentPhase);
    const unitAbilities = gameState.units.filter(u => !u.isSlain).flatMap((u) => {
      const uRules = faction.units.find(rules => rules.id === u.unitId);
      if (!uRules) return [];
      return getUnitAbilitiesForPhase(uRules, gameState.currentPhase).map(ab => ({ ...ab, unitId: u.id, unitName: uRules.name }));
    });

    const hasAbilities = factionAbilities.length > 0 || unitAbilities.length > 0;
    const hasGlobal = ['movement', 'shooting', 'charge'].includes(gameState.currentPhase);

    if (!hasAbilities && !hasGlobal) return null;

    return (
      <div className="space-y-4 bg-[#11141c]/40 border border-[#222834]/50 p-4 rounded-2xl">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-4.5 w-4.5 text-amber-500" /> 
            Abilities (Round {gameState.round})
          </h3>
          <Badge variant="outline" className={`uppercase text-xxs border-transparent font-bold
            ${gameState.activeTurn === 'me' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-400'}`}
          >
            {gameState.activeTurn === 'me' ? 'ACTIVE' : 'REACTIVE'}
          </Badge>
        </div>

        {hasAbilities && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Faction-Level Strategy Cards */}
          {factionAbilities.map(ability => {
            const isUsed = !!gameState.usedAbilities[ability.id];
            const style = getAbilityStyleClasses(ability.sourceType);
            
            // Find which units this ability is currently applied to
            const appliedMods = gameState.appliedModifiers?.filter(m => 
              m.sourceAbilityId === ability.id || 
              (m.sourceAbilityId && (m.sourceAbilityId.endsWith(`-${ability.id}`) || m.sourceAbilityId.startsWith(`${ability.id}-`)))
            ) || [];
            const appliedUnitNames = Array.from(new Set(appliedMods.map(m => {
              const uState = gameState.units.find(u => u.id === m.unitId);
              if (!uState) return '';
              const uRules = faction.units.find(ru => ru.id === uState.unitId);
              return uRules ? uRules.name : uState.id;
            }).filter(Boolean)));

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
                  
                  {appliedUnitNames.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-[#2c3548]/30 text-[10px] text-amber-500 font-extrabold flex items-center gap-1 leading-none select-none">
                      <span>🎯</span> Applied to: <strong className="text-amber-400 font-black">{appliedUnitNames.join(', ')}</strong>
                    </div>
                  )}

                  {(() => {
                    const castAdj = getCastingAdjustmentForAbility(ability);
                    if (!castAdj) return null;
                    return (
                      <div className="mt-3 pt-2.5 border-t border-[#2c3548]/30 space-y-2">
                        <div className="flex items-center gap-1.5 bg-purple-500/5 border border-purple-500/10 rounded-lg p-2 text-[10px] text-gray-300">
                          <span className="text-purple-400">🔮</span>
                          <div>
                            <p className="font-extrabold text-purple-400 uppercase tracking-wide text-[9px]">
                              Casting Roll Success: <span className="line-through text-gray-500 mr-1">{castAdj.baseRoll}</span> {castAdj.modifiedRoll}
                            </p>
                            <p className="text-[8px] text-gray-400 mt-0.5 font-medium">
                              Reduced from {castAdj.baseRoll} via <strong className="text-purple-400">{castAdj.bonusSource}</strong> (+{castAdj.bonusValue} modifier)
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {(ability.id === 'facetsOfWar' || ability.id.endsWith('-facetsOfWar')) && gameState.luminethFacetSelected && (
                    <div className="mt-2.5 pt-2 border-t border-[#2c3548]/30 text-[10px] text-amber-500 font-extrabold flex items-center gap-1 leading-none select-none">
                      <span>⚡</span> Activated Facet: <strong className="text-amber-400 font-black">
                        {gameState.luminethFacetSelected === 'shiningCompany' ? 'Shining Company' : 
                         gameState.luminethFacetSelected === 'powerOfHysh' ? 'Power of Hysh' : 
                         gameState.luminethFacetSelected === 'lightningReactions' ? 'Lightning Reactions' : ''}
                      </strong>
                    </div>
                  )}

                  {['relentlessDiscipline', 'relentlessDiscipline-2'].includes(ability.id) && (
                    <div className="mt-3 pt-2.5 border-t border-[#222834] space-y-2 text-[10px] text-gray-300">
                      <div className="flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2">
                        <span className="text-amber-400">🎲</span>
                        <div>
                          <p className="font-extrabold text-amber-400 uppercase tracking-wide text-[9px]">
                            Discipline Roll Success: {gameState.selectedRegimentAbilityId === 'immaculateGeneralship' ? '3+' : '4+'}
                          </p>
                          {gameState.selectedRegimentAbilityId === 'immaculateGeneralship' && (
                            <p className="text-[8px] text-gray-400 mt-0.5 font-medium">
                              (Reduced from 4+ via <strong className="text-amber-500">Immaculate Generalship</strong> +1 modifier)
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-1.5 bg-[#151923]/80 rounded-lg p-2 border border-[#222834]">
                        <span className="text-sky-400 mt-0.5">ℹ️</span>
                        <div>
                          <p className="font-extrabold text-sky-400 uppercase tracking-wide text-[9px]">Heralds of Nagash Note</p>
                          <p className="text-[8px] text-gray-400 mt-0.5 leading-relaxed font-medium">
                            Add <strong className="text-sky-400">+1 to the discipline roll</strong> if the target unit is wholly within 12" of friendly <strong className="text-gray-300">Morghast Archai</strong> models.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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

            // Find which units this ability is currently applied to
            const appliedMods = gameState.appliedModifiers?.filter(m => 
              m.sourceAbilityId === instanceKey || 
              m.sourceAbilityId === ability.id ||
              (m.sourceAbilityId && (m.sourceAbilityId.endsWith(`-${ability.id}`) || m.sourceAbilityId.startsWith(`${ability.id}-`)))
            ) || [];
            const appliedUnitNames = Array.from(new Set(appliedMods.map(m => {
              const uState = gameState.units.find(u => u.id === m.unitId);
              if (!uState) return '';
              const uRules = faction.units.find(ru => ru.id === uState.unitId);
              return uRules ? uRules.name : uState.id;
            }).filter(Boolean)));

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
                      <CardTitle className="text-xs font-bold text-white mt-0.5">
                        {ability.name}
                        {ability.id === 'skeletonLegion' && gameState?.selectedEnhancementId === 'graveSandShard' && (
                          <span className="text-[10px] text-emerald-400 font-extrabold ml-1.5">(+1 Legion Rolls)</span>
                        )}
                      </CardTitle>
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
                  
                  {appliedUnitNames.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-[#2c3548]/30 text-[10px] text-amber-500 font-extrabold flex items-center gap-1 leading-none select-none">
                      <span>🎯</span> Applied to: <strong className="text-amber-400 font-black">{appliedUnitNames.join(', ')}</strong>
                    </div>
                  )}
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
        )}

        {renderGlobalCoreAbilities(gameState.currentPhase)}
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

          <div className="flex items-center gap-6">
            {/* Player Score */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">ME:</span>
              <div className="flex items-center bg-[#1c2230] rounded-lg border border-[#2c3548]">
                <button onClick={() => updateVP(-1)} className="px-2.5 py-1 hover:bg-[#2c3548] text-gray-400 font-bold">-</button>
                <span className="px-3 py-1 font-black text-xs text-white">{gameState.victoryPoints} VP</span>
                <button onClick={() => updateVP(1)} className="px-2.5 py-1 hover:bg-[#2c3548] text-gray-400 font-bold">+</button>
              </div>
            </div>

            {/* Opponent Score */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">OPP:</span>
              <div className="flex items-center bg-[#1c2230] rounded-lg border border-[#2c3548]">
                <button onClick={() => updateOpponentVP(-1)} className="px-2.5 py-1 hover:bg-[#2c3548] text-gray-400 font-bold">-</button>
                <span className="px-3 py-1 font-black text-xs text-white">{gameState.opponentVictoryPoints ?? 0} VP</span>
                <button onClick={() => updateOpponentVP(1)} className="px-2.5 py-1 hover:bg-[#2c3548] text-gray-400 font-bold">+</button>
              </div>
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
                    if (p.id === 'combat') {
                      updated.combatSubPhase = 'attacker_declare';
                    } else {
                      updated.combatSubPhase = undefined;
                    }
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

                  {/* Guarded Hero Rule Banner (Shooting Phase Specific) */}
                  {gameState.currentPhase === 'shooting' && (
                    <div className="p-3.5 bg-sky-950/25 border border-sky-500/30 rounded-xl space-y-2.5 shadow-lg relative overflow-hidden text-left">
                      <div className="absolute right-2 top-2 opacity-5 pointer-events-none select-none">
                        <Shield className="h-16 w-16 text-sky-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4.5 text-sky-400 animate-pulse" />
                        <span className="text-xs font-black text-white uppercase tracking-wider">🛡️ Core Passive: Guarded Hero</span>
                        <Badge className="bg-sky-500/20 text-sky-400 border border-sky-500/20 text-[8px] font-bold px-1.5 uppercase tracking-wide">ACTIVE DEFENSE</Badge>
                      </div>
                      <p className="text-[10px] text-sky-300 font-semibold leading-normal">
                        If a friendly <strong className="text-white font-extrabold">HERO</strong> is within combat range (3") of a friendly non-HERO unit:
                      </p>
                      <ul className="text-[10px] text-gray-300 space-y-1 pl-4 list-disc font-medium">
                        <li>Subtract <span className="text-amber-400 font-bold">-1 from hit rolls</span> for shooting attacks targeting this <strong className="text-white">HERO</strong>.</li>
                        <li>If the <strong className="text-white">HERO</strong> is <span className="text-sky-300 font-semibold">INFANTRY</span>, they <strong className="text-red-400 font-black">CANNOT</strong> be targeted by shooting attacks from units further than 12" away.</li>
                      </ul>
                    </div>
                  )}
                  
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

                    const activeRegimentAbilities = gameState.selectedRegimentAbilityId && gameState.selectedRegimentAbilityId !== 'all'
                      ? faction.regimentAbilities.filter(reg => reg.id === gameState.selectedRegimentAbilityId)
                      : faction.regimentAbilities;

                    activeRegimentAbilities.forEach(a => {
                      if (a.isDefense) {
                        defAbilities.push({ source: 'Regiment', name: a.name, timing: a.timing, effect: a.effect, id: a.id, key: a.id });
                      }
                    });

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
                                  {uRules.isHero && gameState.currentPhase === 'shooting' && (
                                    <Badge className="bg-sky-500/20 text-sky-400 text-[8px] font-black border border-sky-500/20 animate-pulse">🛡️ Guarded Hero Target</Badge>
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
                                
                                {/* Guarded Hero Rule micro-reminder on card */}
                                {gameState.currentPhase === 'shooting' && uRules.isHero && (
                                  <div className="mt-2 p-2 bg-sky-950/20 border border-sky-500/20 rounded-lg text-left text-[9px] text-sky-300 font-semibold space-y-0.5">
                                    <div className="text-white font-black uppercase flex items-center gap-1">
                                      <span>🛡️ GUARDED HERO REMINDER:</span>
                                    </div>
                                    <p className="leading-relaxed">
                                      • Within 3" of non-Hero? <strong className="text-amber-400 font-bold">-1 to Hit rolls</strong> for shooting targeting them.
                                    </p>
                                    <p className="leading-relaxed">
                                      • Is Infantry? <strong className="text-red-400 font-black">Cannot be targeted</strong> by shooting from further than 12".
                                    </p>
                                  </div>
                                )}
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
                                    onClick={() => adjustWoundsById(u.id, 1)}
                                    className="px-2.5 py-0.5 hover:bg-[#2c3548] text-gray-400 hover:text-red-400 font-extrabold text-xs transition-all"
                                  >
                                    -
                                  </button>
                                  <span className="px-3 font-black text-white text-xs min-w-[3.5rem] text-center">
                                    {uRules.health - (u.currentWounds || 0)} / {uRules.health} HP
                                  </span>
                                  <button
                                    onClick={() => adjustWoundsById(u.id, -1)}
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
                              const heroEnhancement = uRules.isHero ? faction?.enhancements?.find(e => e.id === gameState.selectedEnhancementId) : null;
                              if (unitPassives.length === 0 && !heroEnhancement) return null;
                              return (
                                <div className="mt-2.5 p-3 bg-emerald-950/15 border border-emerald-500/20 rounded-xl space-y-2 text-left">
                                  <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                                    <Sparkles className="h-3 w-3 text-emerald-400 animate-pulse" /> Unit Passives & Enhancements
                                  </span>
                                  <div className="space-y-2">
                                    {unitPassives.map((ab) => (
                                      <div key={ab.id} className="border-t border-emerald-500/10 pt-1.5 first:border-t-0 first:pt-0">
                                        <h5 className="text-xxs font-black text-white">{ab.name}</h5>
                                        <p className="text-[10px] text-gray-300 mt-0.5 whitespace-pre-line leading-normal">{ab.effect}</p>
                                      </div>
                                    ))}
                                    {heroEnhancement && (
                                      <div className="border-t border-amber-500/20 pt-1.5 first:border-t-0 first:pt-0">
                                        <div className="flex items-center gap-1">
                                          <h5 className="text-xxs font-black text-amber-400">{heroEnhancement.name}</h5>
                                          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/25 text-[7px] py-0 px-1 font-black uppercase tracking-wider select-none">
                                            ACTIVE ENHANCEMENT
                                          </Badge>
                                        </div>
                                        <p className="text-[10px] text-gray-300 mt-0.5 whitespace-pre-line leading-normal">{heroEnhancement.effect}</p>
                                      </div>
                                    )}
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
                                onClick={() => adjustWoundsById(u.id, 1)}
                                className="px-2.5 py-0.5 hover:bg-[#2c3548] text-gray-400 hover:text-red-400 font-extrabold text-xs transition-all"
                              >
                                -
                              </button>
                              <span className="px-3 font-black text-white text-xs min-w-[3.5rem] text-center">
                                {uRules.health - (u.currentWounds || 0)} / {uRules.health} HP
                              </span>
                              <button
                                onClick={() => adjustWoundsById(u.id, -1)}
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
                              const chargeMods = getActiveModifiers('charge', u.id);
                              if (chargeMods.length > 0 && !u.ran) {
                                const totalMod = chargeMods.reduce((acc, m) => acc + m.modifier, 0);
                                return (
                                  <div className="text-emerald-400 font-extrabold text-[10px] flex items-center gap-0.5 self-start">
                                    <Sparkles className="h-2.5 w-2.5 animate-pulse" /> +{totalMod} to Charge Rolls active
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

            {/* COMBAT PHASE (ORDER OF EVENTS PROTOCOL) */}
            {gameState.currentPhase === 'combat' && (
              <div className="space-y-6">
                {/* Custom subphase tabs header for visual clarity */}
                <div className="bg-[#1c2230] p-1.5 rounded-xl border border-[#2c3548] flex items-center justify-between gap-1.5 text-xxs font-bold uppercase select-none">
                  <div 
                    onClick={() => {
                      const updated = { ...gameState };
                      updated.combatSubPhase = 'attacker_declare';
                      saveGame(updated);
                    }}
                    className={`flex-1 py-2 text-center rounded transition-all cursor-pointer hover:bg-white/5 ${(!gameState.combatSubPhase || gameState.combatSubPhase === 'attacker_declare') ? 'bg-amber-500/25 text-amber-400 border border-amber-500/10 font-black' : 'text-gray-500'}`}
                  >
                    1. Attacker Declares {gameState.activeTurn === 'me' ? '(Me)' : '(Opponent)'}
                  </div>
                  <div 
                    onClick={() => {
                      const updated = { ...gameState };
                      updated.combatSubPhase = 'defender_declare';
                      saveGame(updated);
                    }}
                    className={`flex-1 py-2 text-center rounded transition-all cursor-pointer hover:bg-white/5 ${gameState.combatSubPhase === 'defender_declare' ? 'bg-amber-500/25 text-amber-400 border border-amber-500/10 font-black' : 'text-gray-500'}`}
                  >
                    2. Defender Declares {gameState.activeTurn === 'me' ? '(Opponent)' : '(Me)'}
                  </div>
                  <div 
                    onClick={() => {
                      const updated = { ...gameState };
                      updated.combatSubPhase = 'melee_fight';
                      saveGame(updated);
                    }}
                    className={`flex-1 py-2 text-center rounded transition-all cursor-pointer hover:bg-white/5 ${gameState.combatSubPhase === 'melee_fight' ? 'bg-rose-500/25 text-rose-400 border border-rose-500/10 font-black' : 'text-gray-500'}`}
                  >
                    3. Melee Fights
                  </div>
                </div>

                {(!gameState.combatSubPhase || gameState.combatSubPhase === 'attacker_declare') && (
                  gameState.activeTurn === 'me' 
                    ? renderCombatActiveStrategy()
                    : renderOpponentDeclarationPlaceholder('attacker')
                )}

                {gameState.combatSubPhase === 'defender_declare' && (
                  gameState.activeTurn === 'opponent'
                    ? renderCombatActiveStrategy()
                    : renderOpponentDeclarationPlaceholder('defender')
                )}

                {gameState.combatSubPhase === 'melee_fight' && (
                  <>
                    {renderCombatUnitActivations()}
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

                  {/* Active Unit Control Scores Summary */}
                  <div className="p-4 bg-[#0d1017]/80 rounded-xl border border-[#222834] space-y-3">
                    <h5 className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-purple-400" /> Active Unit Control Scores:
                    </h5>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                      These are the current control scores for your active units, including any active modifiers (e.g. Deathmarch). Use these values to calculate objective contest resolution.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {gameState.units.filter(u => !u.isSlain).map(u => {
                        const uRules = faction.units.find(rules => rules.id === u.unitId);
                        if (!uRules) return null;
                        const baseControl = uRules.control ?? 1;
                        return (
                          <div key={u.id} className="flex justify-between items-center p-2.5 rounded-lg bg-[#1c2230] border border-[#2c3548]">
                            <span className="text-xs font-extrabold text-gray-200">{uRules.name}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xxs text-gray-400 mr-1">Control:</span>
                              {renderStatWithModifier(baseControl, 'control', u.id)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
                              onClick={() => adjustWoundsById(u.id, 1)}
                              className="px-2 py-0.5 hover:bg-[#2c3548] text-gray-400 font-bold text-xs rounded"
                            >
                              -
                            </button>
                            <span className="text-xxs font-bold text-gray-400 px-2 sm:w-24 text-center">
                              Model HP: <strong className="text-white font-black text-xs">{uRules.health - (u.currentWounds || 0)} / {uRules.health}</strong>
                            </span>
                            <button 
                              onClick={() => adjustWoundsById(u.id, -1)}
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
                      applyBuff(buffModal.unitId, 'attacks', 1, `+1 Attacks (${buffModal.sourceAbilityName || 'Buff'})`, buffModal.expiresPhase, buffModal.sourceAbilityId, buffModal.sourceAbilityEffect);
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
                      applyBuff(buffModal.unitId, 'save', 1, `+1 Save (${buffModal.sourceAbilityName || 'Buff'})`, buffModal.expiresPhase, buffModal.sourceAbilityId, buffModal.sourceAbilityEffect);
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
                      const isRelentless = buffModal.sourceAbilityName?.includes('Relentless Discipline');
                      const label = isRelentless ? `Ward (5+) (${buffModal.sourceAbilityName})` : `+1 Ward (${buffModal.sourceAbilityName || 'Buff'})`;
                      applyBuff(buffModal.unitId, 'ward', 1, label, buffModal.expiresPhase, buffModal.sourceAbilityId, buffModal.sourceAbilityEffect);
                      setBuffModal(null);
                    }}
                    className="bg-[#1c2230] hover:bg-[#252c3d] border border-[#2c3548] text-white hover:text-purple-400 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-between px-4"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">💖</span>
                      <span>{buffModal.sourceAbilityName?.includes('Relentless Discipline') ? 'Apply Ward (5+)' : 'Modify Ward Roll'}</span>
                    </span>
                    <Badge className="bg-purple-500/15 text-purple-400 font-extrabold">
                      {buffModal.sourceAbilityName?.includes('Relentless Discipline') ? 'Ward 5+' : '+1 Ward'}
                    </Badge>
                  </Button>
                )}

                {(!buffModal.allowedStats || buffModal.allowedStats.includes('move')) && (
                  <Button
                    onClick={() => {
                      const isRelentless = buffModal.sourceAbilityName?.includes('Relentless Discipline');
                      const modifier = isRelentless ? 2 : 1;
                      const label = isRelentless ? `+2" Move (${buffModal.sourceAbilityName})` : `+1" Move (${buffModal.sourceAbilityName || 'Buff'})`;
                      applyBuff(buffModal.unitId, 'move', modifier, label, buffModal.expiresPhase, buffModal.sourceAbilityId, buffModal.sourceAbilityEffect);
                      setBuffModal(null);
                    }}
                    className="bg-[#1c2230] hover:bg-[#252c3d] border border-[#2c3548] text-white hover:text-amber-400 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-between px-4"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">🏃‍♂️</span>
                      <span>Modify Movement</span>
                    </span>
                    <Badge className="bg-amber-500/15 text-amber-400 font-extrabold">
                      {buffModal.sourceAbilityName?.includes('Relentless Discipline') ? '+2" Move' : '+1" Move'}
                    </Badge>
                  </Button>
                )}

                {(!buffModal.allowedStats || buffModal.allowedStats.includes('hit')) && (
                  <Button
                    onClick={() => {
                      applyBuff(buffModal.unitId, 'hit', 1, `+1 Hit (${buffModal.sourceAbilityName || 'Buff'})`, buffModal.expiresPhase, buffModal.sourceAbilityId, buffModal.sourceAbilityEffect);
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
                      const isRelentless = buffModal.sourceAbilityName?.includes('Relentless Discipline');
                      const label = isRelentless ? `+1 Wound (${buffModal.sourceAbilityName})` : `+1 Wound (${buffModal.sourceAbilityName || 'Buff'})`;
                      applyBuff(buffModal.unitId, 'wound', 1, label, buffModal.expiresPhase, buffModal.sourceAbilityId, buffModal.sourceAbilityEffect);
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
                      applyBuff(buffModal.unitId, 'rend', 1, `+1 Rend (${buffModal.sourceAbilityName || 'Buff'})`, buffModal.expiresPhase, buffModal.sourceAbilityId, buffModal.sourceAbilityEffect);
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
                      applyBuff(buffModal.unitId, 'damage', 1, `+1 Damage (${buffModal.sourceAbilityName || 'Buff'})`, buffModal.expiresPhase, buffModal.sourceAbilityId, buffModal.sourceAbilityEffect);
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

                {(!buffModal.allowedStats || buffModal.allowedStats.includes('charge')) && (
                  <Button
                    onClick={() => {
                      const isRelentless = buffModal.sourceAbilityName?.includes('Relentless Discipline');
                      const label = isRelentless ? `+1 Charge (${buffModal.sourceAbilityName})` : `+1 Charge (${buffModal.sourceAbilityName || 'Buff'})`;
                      applyBuff(buffModal.unitId, 'charge', 1, label, buffModal.expiresPhase, buffModal.sourceAbilityId, buffModal.sourceAbilityEffect);
                      setBuffModal(null);
                    }}
                    className="bg-[#1c2230] hover:bg-[#252c3d] border border-[#2c3548] text-white hover:text-emerald-400 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-between px-4"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">⚡</span>
                      <span>Modify Charge Rolls</span>
                    </span>
                    <Badge className="bg-emerald-500/15 text-emerald-400 font-extrabold">+1 Charge</Badge>
                  </Button>
                )}
              </div>

              {(!buffModal.allowedStats) && (
                <div className="bg-[#1c2230] border border-[#2c3548]/80 p-3 rounded-xl space-y-2.5 shadow-md mt-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
                    <span>💚</span>
                    <span>Heal Unit Wounds</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-normal font-medium">
                    Choose an amount of wounds to heal on <strong className="text-white">{buffModal.unitName}</strong> (automatically returns slain models and reduces wounds):
                  </p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <Button
                        key={num}
                        onClick={() => {
                          healWoundsById(buffModal.unitId, num);
                          setBuffModal(null);
                        }}
                        className="bg-[#151923] hover:bg-emerald-600/80 border border-[#2c3548] text-gray-200 hover:text-white font-black text-xs py-1.5 rounded-lg transition-all"
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {(!buffModal.allowedStats) && (
                <div className="bg-[#1c2230] border border-[#2c3548]/80 p-3 rounded-xl space-y-2.5 shadow-md mt-4">
                  <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                    <span>🔥</span>
                    <span>Critical Hit Buffs</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-normal font-medium">
                    Select a critical hit modifier to apply to <strong className="text-white">{buffModal.unitName}</strong>'s weapons for the rest of this round:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => {
                        applyBuff(buffModal.unitId, 'hit', 0, `Crit (2 Hits) (${buffModal.sourceAbilityName || 'Buff'})`, buffModal.expiresPhase, buffModal.sourceAbilityId, buffModal.sourceAbilityEffect);
                        setBuffModal(null);
                      }}
                      className="bg-[#151923] hover:bg-amber-500/10 border border-[#2c3548] hover:border-amber-500/20 text-white hover:text-amber-400 text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 h-10"
                    >
                      <span className="text-[11px]">💥</span>
                      <span className="text-[10px]">Crit (2 Hits)</span>
                    </Button>
                    <Button
                      onClick={() => {
                        applyBuff(buffModal.unitId, 'hit', 0, `Crit (Mortal) (${buffModal.sourceAbilityName || 'Buff'})`, buffModal.expiresPhase, buffModal.sourceAbilityId, buffModal.sourceAbilityEffect);
                        setBuffModal(null);
                      }}
                      className="bg-[#151923] hover:bg-rose-500/10 border border-[#2c3548] hover:border-rose-500/20 text-white hover:text-rose-400 text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 h-10"
                    >
                      <span className="text-[11px]">💀</span>
                      <span className="text-[10px]">Crit (Mortal)</span>
                    </Button>
                    <Button
                      onClick={() => {
                        applyBuff(buffModal.unitId, 'hit', 0, `Crit (Auto-wound) (${buffModal.sourceAbilityName || 'Buff'})`, buffModal.expiresPhase, buffModal.sourceAbilityId, buffModal.sourceAbilityEffect);
                        setBuffModal(null);
                      }}
                      className="bg-[#151923] hover:bg-blue-500/10 border border-[#2c3548] hover:border-blue-500/20 text-white hover:text-blue-400 text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 h-10"
                    >
                      <span className="text-[11px]">⚡</span>
                      <span className="text-[10px]">Crit (Auto-wound)</span>
                    </Button>
                    <Button
                      onClick={() => {
                        applyBuff(buffModal.unitId, 'damage', 0, `Crit (+1 Damage) (${buffModal.sourceAbilityName || 'Buff'})`, buffModal.expiresPhase, buffModal.sourceAbilityId, buffModal.sourceAbilityEffect);
                        setBuffModal(null);
                      }}
                      className="bg-[#151923] hover:bg-orange-500/10 border border-[#2c3548] hover:border-orange-500/20 text-white hover:text-orange-400 text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 h-10"
                    >
                      <span className="text-[11px]">💥</span>
                      <span className="text-[10px]">Crit (+1 Damage)</span>
                    </Button>
                  </div>
                </div>
              )}
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

      {selectUnitToBuffAbility && (() => {
        let abilityConfig = faction?.battleTraits.find(a => a.id === selectUnitToBuffAbility.abilityId || selectUnitToBuffAbility.abilityId.endsWith(`-${a.id}`)) ||
                            faction?.regimentAbilities.find(a => a.id === selectUnitToBuffAbility.abilityId || selectUnitToBuffAbility.abilityId.endsWith(`-${a.id}`)) ||
                            faction?.enhancements.find(a => a.id === selectUnitToBuffAbility.abilityId || selectUnitToBuffAbility.abilityId.endsWith(`-${a.id}`));
        
        if (!abilityConfig && faction) {
          for (const u of faction.units) {
            const matched = u.abilities.find(a => selectUnitToBuffAbility.abilityId === a.id || selectUnitToBuffAbility.abilityId.endsWith(`-${a.id}`));
            if (matched) {
              abilityConfig = matched;
              break;
            }
          }
        }

        const abAnalysis = abilityConfig ? analyzeAbilityRule(abilityConfig, faction) : null;

        // Filter friendly unit roster
        let filteredUnits = gameState.units.filter(u => !u.isSlain);

        if (abAnalysis) {
          // Check 1: Hero/General Only restriction
          if (abAnalysis.heroOrGeneralOnly) {
            filteredUnits = filteredUnits.filter(u => {
              const r = faction?.units.find(rules => rules.id === u.unitId);
              return r?.isHero === true;
            });
          }

          // Check 2: Not Hero / General
          if (abAnalysis.targetSpecifications.includes("Not Hero / General")) {
            filteredUnits = filteredUnits.filter(u => {
              const r = faction?.units.find(rules => rules.id === u.unitId);
              return r?.isHero === false;
            });
          }

          // Check 3: Specific Unit(s)
          const specSpec = abAnalysis.targetSpecifications.find(s => s.startsWith("Specific Unit(s)"));
          if (specSpec) {
            const matchBrackets = specSpec.match(/\[(.*?)\]/);
            if (matchBrackets && matchBrackets[1]) {
              const allowedNames = matchBrackets[1].split(',').map(name => name.trim().toLowerCase());
              filteredUnits = filteredUnits.filter(u => {
                const r = faction?.units.find(rules => rules.id === u.unitId);
                return r && allowedNames.some(allowedName => r.name.toLowerCase().includes(allowedName) || allowedName.includes(r.name.toLowerCase()));
              });
            }
          }

          // Check 4: Self specification filter
          const selfSpec = abAnalysis.targetSpecifications.find(s => s.startsWith("Self:"));
          if (selfSpec) {
            const matchBrackets = selfSpec.match(/\[(.*?)\]/);
            if (matchBrackets && matchBrackets[1]) {
              const selfNames = matchBrackets[1].split(',').map(name => name.trim().toLowerCase());
              filteredUnits = filteredUnits.filter(u => {
                const r = faction?.units.find(rules => rules.id === u.unitId);
                return r && selfNames.some(selfName => r.name.toLowerCase().includes(selfName) || selfName.includes(r.name.toLowerCase()));
              });
            }
          }
        }

        // Default fallback to all friendly if empty
        if (filteredUnits.length === 0) {
          filteredUnits = gameState.units.filter(u => !u.isSlain);
        }

        // Proximity / Spatial Block condition
        const isProximityBlocked = abAnalysis?.hasSpatialOrConditionalCheck && !spatialConditionMet;

        return (
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
              <div className="p-5 space-y-4 text-left overflow-y-auto max-h-[70vh]">
                <div className="bg-[#1c2230] p-3 rounded-lg border border-[#2c3548]/30">
                  <h4 className="text-xxs font-black text-amber-500 uppercase tracking-widest mb-1">
                    ✨ Ability Activated:
                  </h4>
                  <p className="text-xs font-bold text-white mb-1">{selectUnitToBuffAbility.name}</p>
                  <p className="text-[10px] text-gray-300 italic whitespace-pre-line leading-relaxed">
                    "{selectUnitToBuffAbility.effect}"
                  </p>
                </div>

                {/* Defensive Orientations Block */}
                {abAnalysis && abAnalysis.isDefensive && (
                  <div className="p-2.5 rounded-xl border border-teal-500/25 bg-teal-500/[0.03] text-teal-300 text-xxs flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 uppercase font-black tracking-wider text-teal-400">
                      <Shield className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
                      <span>🛡️ Defensive Buff Active</span>
                    </div>
                    <p className="text-gray-300 font-medium">
                      Active Turn priority belongs to: <span className="text-white font-black underline">{gameState.activeTurn === 'me' ? 'YOU (You are Attacking)' : "OPPONENT (Opponent is Attacking / You are Defending!)"}</span>
                    </p>
                  </div>
                )}

                {/* Spatial Checking Toggle Checkbox */}
                {abAnalysis && abAnalysis.hasSpatialOrConditionalCheck && (
                  <div className="p-3 rounded-xl border border-purple-500/25 bg-purple-500/[0.03] flex flex-col gap-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
                      <Compass className="h-3.5 w-3.5" /> Spatial check required
                    </p>
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={spatialConditionMet} 
                        onChange={(e) => setSpatialConditionMet(e.target.checked)} 
                        className="mt-0.5 h-4 w-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-500 bg-[#161b22]"
                      />
                      <div className="text-xxs text-gray-300 leading-relaxed font-semibold">
                        Confirm: <span className="text-white font-bold">"{abAnalysis.conditionalCheckDescription}"</span>
                      </div>
                    </label>
                  </div>
                )}

                <p className="text-xxs text-gray-400 leading-relaxed font-black uppercase tracking-wider">
                  Select valid target unit from roster:
                </p>

                <div className="grid grid-cols-1 gap-2">
                  {filteredUnits.map(u => {
                    const uRules = faction?.units.find(rules => rules.id === u.unitId);
                    if (!uRules) return null;

                    // Peerless Cohesion target block check
                    const isFirstUse = selectUnitToBuffAbility.abilityId === 'relentlessDiscipline';
                    const isSecondUse = selectUnitToBuffAbility.abilityId === 'relentlessDiscipline-2';
                    let isAlreadyTargeted = false;
                    if (isFirstUse || isSecondUse) {
                      const otherAbilityLabel = isFirstUse ? 'Relentless Discipline (Second Use)' : 'Relentless Discipline';
                      const hasOtherDisciplineActiveThisPhase = gameState.appliedModifiers?.some(mod => 
                        mod.unitId === u.id && 
                        mod.expiresPhase === gameState.currentPhase && 
                        mod.label.includes(otherAbilityLabel)
                      );
                      if (hasOtherDisciplineActiveThisPhase) {
                        isAlreadyTargeted = true;
                      }
                    }

                    // Combined blocked state
                    const isTargetBlocked = isAlreadyTargeted || isProximityBlocked;

                    return (
                      <Button
                        key={u.id}
                        disabled={isTargetBlocked}
                        onClick={() => {
                          const effectLower = (selectUnitToBuffAbility.effect || '').toLowerCase();
                          let allowed: ('attacks' | 'save' | 'ward' | 'move' | 'hit' | 'wound' | 'rend' | 'damage' | 'charge')[] = [];
                          
                          const isRelentlessDiscipline = selectUnitToBuffAbility.abilityId.startsWith('relentlessDiscipline');
                          if (isRelentlessDiscipline) {
                            allowed = ['move', 'charge', 'wound', 'ward'];
                          } else if (abAnalysis) {
                            allowed = abAnalysis.allowedStats;
                          } else {
                            if (effectLower.includes('attacks characteristic')) allowed.push('attacks');
                            if (effectLower.includes('save roll')) allowed.push('save');
                            if (effectLower.includes('ward roll')) allowed.push('ward');
                            if (effectLower.includes('move')) allowed.push('move');
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
                              if (gameState) {
                                const updated = { ...gameState };
                                updated.logs.unshift(`🎯 Selected unit [${uRules.name}] as the target for "${selectUnitToBuffAbility.name}".`);
                                if (selectUnitToBuffAbility.abilityId) {
                                  if (!updated.usedAbilities) updated.usedAbilities = {};
                                  updated.usedAbilities[selectUnitToBuffAbility.abilityId] = true;
                                }
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
                                } else if (selectUnitToBuffAbility.name.toLowerCase().includes('relentless discipline')) {
                                  modifierVal = 2;
                                  labelVal = `+2" Move (${selectUnitToBuffAbility.name})`;
                                } else {
                                  labelVal = `+1" Move (${selectUnitToBuffAbility.name})`;
                                }
                              }
                              else if (singleStat === 'hit') labelVal = `+1 Hit (${selectUnitToBuffAbility.name})`;
                              else if (singleStat === 'wound') labelVal = `+1 Wound (${selectUnitToBuffAbility.name})`;
                              else if (singleStat === 'rend') labelVal = `+1 Rend (${selectUnitToBuffAbility.name})`;
                              else if (singleStat === 'damage') labelVal = `+1 Damage (${selectUnitToBuffAbility.name})`;
                              
                              const effectLowerForTurn = (selectUnitToBuffAbility.effect || '').toLowerCase();
                              const isTurnLong = effectLowerForTurn.includes('rest of the turn') || effectLowerForTurn.includes('rest of this turn') || effectLowerForTurn.includes('for the rest of the turn') || effectLowerForTurn.includes('for the rest of this turn') || effectLowerForTurn.includes('rest of the battle round') || effectLowerForTurn.includes('rest of this battle round') || effectLowerForTurn.includes('this turn');
                              const resolvedExpiresPhase = isTurnLong ? undefined : selectUnitToBuffAbility.phase;

                              applyBuff(u.id, singleStat, modifierVal, labelVal, resolvedExpiresPhase, selectUnitToBuffAbility.abilityId, selectUnitToBuffAbility.effect, isTurnLong);
                            } else {
                              const effectLowerForTurn = (selectUnitToBuffAbility.effect || '').toLowerCase();
                              const isTurnLong = effectLowerForTurn.includes('rest of the turn') || effectLowerForTurn.includes('rest of this turn') || effectLowerForTurn.includes('for the rest of the turn') || effectLowerForTurn.includes('for the rest of this turn') || effectLowerForTurn.includes('rest of the battle round') || effectLowerForTurn.includes('rest of this battle round') || effectLowerForTurn.includes('this turn');
                              const resolvedExpiresPhase = isTurnLong ? undefined : selectUnitToBuffAbility.phase;

                              setBuffModal({ 
                                isOpen: true, 
                                unitId: u.id, 
                                unitName: uRules.name,
                                allowedStats: finalAllowed,
                                expiresPhase: resolvedExpiresPhase,
                                expiresTurn: isTurnLong,
                                sourceAbilityName: selectUnitToBuffAbility.name,
                                sourceAbilityId: selectUnitToBuffAbility.abilityId,
                                sourceAbilityEffect: selectUnitToBuffAbility.effect
                              });
                            }
                          }
                        }}
                        className={`border text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-between px-4 h-11
                          ${isTargetBlocked 
                            ? 'bg-red-500/5 border-red-500/20 text-gray-500 cursor-not-allowed opacity-60' 
                            : 'bg-[#1c2230] hover:bg-[#252c3d] border-[#2c3548] text-white hover:text-amber-400'}`}
                      >
                        <span className={`font-semibold ${isTargetBlocked ? 'text-gray-500' : 'text-gray-200'}`}>{uRules.name}</span>
                        {isAlreadyTargeted ? (
                          <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] font-black uppercase">Already Targeted</Badge>
                        ) : isProximityBlocked ? (
                          <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-black uppercase">Requires Spatial Check</Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase">Select</Badge>
                        )}
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
        );
      })()}

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
                          if (singleStat === 'move' && rollPrompt.abilityName.toLowerCase().includes('relentless discipline')) {
                            modifierVal = 2;
                            labelVal = `+2" Move (${rollPrompt.abilityName})`;
                          }
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
                <button
                  onClick={() => handleSelectFacet('powerOfHysh')}
                  className="w-full text-left p-4 rounded-xl border border-amber-500/30 bg-amber-950/5 hover:bg-amber-950/10 hover:border-amber-400 transition-all flex gap-3 relative"
                >
                  <span className="text-xl leading-none shrink-0 self-center">✨</span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Power of Hysh</h4>
                    <p className="text-[10px] text-gray-300 leading-normal font-medium">
                      On a 2+, attacks made by the selected unit score critical hits on unmodified hit rolls of 5+. (Activates in Combat Phase).
                    </p>
                  </div>
                </button>

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

      {roundInitializingModal?.isOpen && (
        <div className="fixed inset-0 bg-[#080a0f]/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-[#11141c] border border-[#2c3548] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col my-8 animate-scale-in text-left">
            
            {/* Header */}
            <div className="p-6 border-b border-[#222834] bg-[#161a25]/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <Swords className="h-6 w-6 text-amber-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">
                    Battle Round {roundInitializingModal.round} Setup
                  </h3>
                  <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-0.5">
                    INITIALIZING NEW BATTLE ROUND
                  </p>
                </div>
              </div>
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 font-black text-xxs tracking-wider">
                ROUND {roundInitializingModal.round} / 4
              </Badge>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] text-left">
              
              {/* Step 1: Who Goes First (Roll-off) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-amber-500">1.</span> Active Player (First Turn)
                  </h4>
                  <span className="text-[9px] text-gray-500 font-bold uppercase">PHYSICAL ROLL-OFF</span>
                </div>
                <p className="text-xxs text-gray-400 leading-normal">
                  Roll off in your physical match. The winner of the roll-off chooses who takes the first turn in this round.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRoundInitializingModal(prev => prev ? { ...prev, goesFirst: 'me' } : null)}
                    className={`p-4 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all duration-300
                      ${roundInitializingModal.goesFirst === 'me'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/5'
                        : 'bg-[#151923] border-[#222834] text-gray-400 hover:text-white hover:bg-[#1a1f2c]'}`}
                  >
                    <User className="h-4 w-4" /> ME GO FIRST
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoundInitializingModal(prev => prev ? { ...prev, goesFirst: 'opponent' } : null)}
                    className={`p-4 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all duration-300
                      ${roundInitializingModal.goesFirst === 'opponent'
                        ? 'bg-red-500/15 border-red-500 text-white shadow-lg shadow-red-500/5'
                        : 'bg-[#151923] border-[#222834] text-gray-400 hover:text-white hover:bg-[#1a1f2c]'}`}
                  >
                    <Users className="h-4 w-4" /> OPPONENT FIRST
                  </button>
                </div>
              </div>

              {/* Step 2: Underdog Status */}
              <div className="space-y-3 border-t border-[#1d222d] pt-5">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-500">2.</span> Determine Underdog Status
                </h4>
                <p className="text-xxs text-gray-400 leading-normal">
                  Select whether you are the Favorite (leading/tied) or the Underdog (trailing in victory points) for this Battle Round.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRoundInitializingModal(prev => prev ? { ...prev, underdog: 'me' } : null)}
                    className={`p-3 rounded-xl border text-xxs font-black flex flex-col items-center justify-center gap-1.5 transition-all duration-300
                      ${roundInitializingModal.underdog === 'me'
                        ? 'bg-amber-500/15 border-amber-500 text-white'
                        : 'bg-[#151923] border-[#222834] text-gray-400 hover:text-white hover:bg-[#1a1f2c]'}`}
                  >
                    <TrendingDown className="h-4 w-4 text-amber-500" />
                    <span>I AM UNDERDOG</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoundInitializingModal(prev => prev ? { ...prev, underdog: 'opponent' } : null)}
                    className={`p-3 rounded-xl border text-xxs font-black flex flex-col items-center justify-center gap-1.5 transition-all duration-300
                      ${roundInitializingModal.underdog === 'opponent'
                        ? 'bg-red-500/15 border-red-500 text-white'
                        : 'bg-[#151923] border-[#222834] text-gray-400 hover:text-white hover:bg-[#1a1f2c]'}`}
                  >
                    <Trophy className="h-4 w-4 text-red-500" />
                    <span>OPP IS UNDERDOG</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoundInitializingModal(prev => prev ? { ...prev, underdog: 'none' } : null)}
                    className={`p-3 rounded-xl border text-xxs font-black flex flex-col items-center justify-center gap-1.5 transition-all duration-300
                      ${roundInitializingModal.underdog === 'none'
                        ? 'bg-zinc-800/40 border-zinc-700 text-white'
                        : 'bg-[#151923] border-[#222834] text-gray-400 hover:text-white hover:bg-[#1a1f2c]'}`}
                  >
                    <Activity className="h-4 w-4 text-gray-400" />
                    <span>NO UNDERDOG</span>
                  </button>
                </div>
              </div>

              {/* Step 3: Twist Card Reminder */}
              <div className="space-y-3 border-t border-[#1d222d] pt-5">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-500">3.</span> Twist Card
                </h4>
                <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-950/10 flex gap-3">
                  <div className="text-xl leading-none">🃏</div>
                  <div className="space-y-1">
                    <h5 className="text-xxs font-black text-white uppercase tracking-wider">Draw & Apply Twist</h5>
                    <p className="text-[10px] text-gray-300 leading-relaxed font-medium">
                      Pull a Twist card from your physical Twist deck and place it face-up. It applies a global battle round trait or passive effect to both players.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4: Battle Tactic Card Reminder and Double-Turn Restrictions */}
              <div className="space-y-3 border-t border-[#1d222d] pt-5">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-500">4.</span> Draw Battle Tactics
                </h4>
                <div className="p-4 rounded-xl border border-zinc-700/60 bg-[#161a24] space-y-4">
                  <div className="flex gap-3">
                    <div className="text-xl leading-none">🎴</div>
                    <div className="space-y-1 text-left">
                      <h5 className="text-xxs font-black text-white uppercase tracking-wider">Draw up to 3 Battle Tactic Cards</h5>
                      <p className="text-[10px] text-gray-300 leading-relaxed font-medium">
                        You can discard any number of tactics currently in your hand before you draw up to 3.
                      </p>
                    </div>
                  </div>

                  {/* Double Up Logic Assessment */}
                  {(() => {
                    const selectedGoesFirst = roundInitializingModal.goesFirst;
                    let doubleTurnActive = false;
                    let activeDoubleTurnPlayer = '';

                    if (roundInitializingModal.round > 1 && gameState?.previousRoundFirstPlayer) {
                      if (gameState.previousRoundFirstPlayer === 'me' && selectedGoesFirst === 'opponent') {
                        doubleTurnActive = true;
                        activeDoubleTurnPlayer = 'Opponent';
                      } else if (gameState.previousRoundFirstPlayer === 'opponent' && selectedGoesFirst === 'me') {
                        doubleTurnActive = true;
                        activeDoubleTurnPlayer = 'You (Player)';
                      }
                    }

                    if (!doubleTurnActive) return null;

                    const isMe = activeDoubleTurnPlayer.startsWith('You');
                    const isUnderdogAndLosing = isMe 
                      ? (roundInitializingModal.underdog === 'me' && (gameState?.opponentVictoryPoints ?? 0) - (gameState?.victoryPoints ?? 0) > 5)
                      : (roundInitializingModal.underdog === 'opponent' && (gameState?.victoryPoints ?? 0) - (gameState?.opponentVictoryPoints ?? 0) > 5);

                    return (
                      <div className={`p-3.5 rounded-lg border text-left space-y-2.5
                        ${isUnderdogAndLosing
                          ? 'border-emerald-500/20 bg-emerald-950/10'
                          : 'border-red-500/20 bg-red-950/10'}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${isUnderdogAndLosing ? 'text-emerald-400' : 'text-red-400'}`} />
                          <div className="space-y-1">
                            <h6 className={`text-[10px] font-black uppercase tracking-wider ${isUnderdogAndLosing ? 'text-emerald-400' : 'text-red-400'}`}>
                              ⚠️ {activeDoubleTurnPlayer.toUpperCase()} DOUBLE-UP ACTIVE
                            </h6>
                            <p className="text-[10px] text-gray-300 leading-normal font-medium">
                              {isMe 
                                ? "You went second last round and are going first this round (Double Turn)." 
                                : "Opponent went second last round and is going first this round (Double Turn)."}
                              {" "}Under standard rules, **Double-Up players CANNOT draw Battle Tactic cards** this round.
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-white/5 pt-2.5 flex items-center justify-between gap-3 text-xxs">
                          <span className="text-gray-400 font-medium">
                            Is the Double-Up player the Underdog AND trailing by &gt;5 VPs?
                          </span>
                          <Badge className={isUnderdogAndLosing ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}>
                            {isUnderdogAndLosing ? 'Eligible to Draw' : 'NOT Eligible'}
                          </Badge>
                        </div>

                        {!isUnderdogAndLosing && isMe && (
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="checkbox"
                              id="doubleUpDrawOverride"
                              checked={roundInitializingModal.doubleUpDrawOverride}
                              onChange={(e) => setRoundInitializingModal(prev => prev ? { ...prev, doubleUpDrawOverride: e.target.checked } : null)}
                              className="rounded border-[#2c3548] bg-[#1c2230] text-amber-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                            />
                            <label htmlFor="doubleUpDrawOverride" className="text-[10px] text-gray-300 font-bold uppercase tracking-wider select-none cursor-pointer">
                              Force Bypass Restriction (Override Draw)
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Step 5: Faction Specific Round-Start Rules & Abilities */}
              {(() => {
                const roundActions: string[] = [];
                const prompts: string[] = [];

                const scanAbility = (ability: Ability) => {
                  if (ability.ruleDefinition && ability.ruleDefinition.trigger === 'start_of_round') {
                    ability.ruleDefinition.actions.forEach(action => {
                      if (action.condition?.round === roundInitializingModal.round) {
                        if (action.type === 'modify_stat') {
                          roundActions.push(action.description);
                        } else if (action.type === 'spawn_prompt') {
                          prompts.push(action.description);
                        }
                      }
                    });
                  }
                };

                const factionTemplate = factions.find(f => f.id === gameState?.factionId);
                if (factionTemplate) {
                  if (gameState?.selectedBattleTraitId === 'all') {
                    factionTemplate.battleTraits.forEach(scanAbility);
                  } else {
                    const trait = factionTemplate.battleTraits.find(t => t.id === gameState?.selectedBattleTraitId);
                    if (trait) scanAbility(trait);
                  }
                   factionTemplate.regimentAbilities.forEach(scanAbility);
                  const enhancement = factionTemplate.enhancements.find(e => e.id === gameState?.selectedEnhancementId);
                  if (enhancement) scanAbility(enhancement);
                }

                if (roundActions.length === 0 && prompts.length === 0) return null;

                return (
                  <div className="space-y-3 border-t border-[#1d222d] pt-5">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-amber-500">5.</span> Faction Round-Start Rules
                    </h4>
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/5 space-y-2.5">
                      {roundActions.map((act, i) => (
                        <div key={`act-${i}`} className="flex items-start gap-2 text-xxs text-amber-200">
                          <span className="text-amber-400 mt-0.5">🌟</span>
                          <span className="font-bold leading-normal">{act}</span>
                        </div>
                      ))}
                      {prompts.map((p, i) => (
                        <div key={`prompt-${i}`} className="flex items-start gap-2 text-xxs text-amber-200">
                          <span className="text-amber-400 mt-0.5">❓</span>
                          <span className="font-bold leading-normal">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#222834] bg-[#0c0e16] flex justify-end gap-3">
              <Button
                onClick={handleConfirmRoundInitialization}
                className="h-11 px-6 bg-gradient-to-r from-[#ca8a04] to-amber-500 hover:scale-103 hover:shadow-lg hover:shadow-amber-500/10 text-white font-extrabold text-xs uppercase rounded-xl transition-all"
              >
                Let's Begin Turn 1 <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

          </div>
        </div>
      )}

      {deploymentModalOpen && (
        <div className="fixed inset-0 bg-[#080a0f]/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-[#11141c] border border-[#2c3548] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col my-8 animate-scale-in text-left">
            
            {/* Header */}
            <div className="p-6 border-b border-[#222834] bg-[#161a25]/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <Shield className="h-6 w-6 text-amber-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">
                    Pre-Battle Deployment Phase
                  </h3>
                  <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-0.5">
                    PRE-BATTLE SEQUENCE & SETUP REFERENCER
                  </p>
                </div>
              </div>
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 font-black text-xxs tracking-wider">
                PRE-GAME SETUP
              </Badge>
            </div>

            {/* Scrollable Steps Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] text-left">
              
              {/* Step 1: Roll-off */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-amber-500">1.</span> Physical Roll-Off & Role Selection
                  </h4>
                  <input
                    type="checkbox"
                    checked={!!deploymentStepChecked[1]}
                    onChange={() => toggleDeploymentStep(1)}
                    className="rounded border-[#2c3548] bg-[#1c2230] text-amber-500 focus:ring-0 cursor-pointer h-4 w-4"
                  />
                </div>
                <p className="text-xxs text-gray-400 leading-normal">
                  Roll off in your physical match. The winner of the roll-off chooses who is the **Attacker** and who is the **Defender**. Indicate your role below:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeploymentRole('attacker')}
                    className={`p-3.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all duration-300
                      ${deploymentRole === 'attacker'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/5'
                        : 'bg-[#151923] border-[#222834] text-gray-400 hover:text-white hover:bg-[#1a1f2c]'}`}
                  >
                    <User className="h-4 w-4" /> ATTACKER
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeploymentRole('defender')}
                    className={`p-3.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all duration-300
                      ${deploymentRole === 'defender'
                        ? 'bg-red-500/15 border-red-500 text-white shadow-lg shadow-red-500/5'
                        : 'bg-[#151923] border-[#222834] text-gray-400 hover:text-white hover:bg-[#1a1f2c]'}`}
                  >
                    <Users className="h-4 w-4" /> DEFENDER
                  </button>
                </div>
              </div>

              {/* Step 2: Pick regiment and enhancement */}
              <div className="space-y-3 border-t border-[#1d222d] pt-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-amber-500">2.</span> Pick Regiment Ability & Enhancement
                  </h4>
                  <input
                    type="checkbox"
                    checked={!!deploymentStepChecked[2]}
                    onChange={() => toggleDeploymentStep(2)}
                    className="rounded border-[#2c3548] bg-[#1c2230] text-amber-500 focus:ring-0 cursor-pointer h-4 w-4"
                  />
                </div>
                <p className="text-xxs text-gray-400 leading-normal">
                  The **attacker** picks their regiment ability and their enhancement first. Then the **defender** does the same. Below is your chosen loadout:
                </p>
                <div className="p-4 rounded-xl border border-[#222834] bg-[#151923] space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">🛡️ Regiment Abilities (All Active)</span>
                    {faction?.regimentAbilities && faction.regimentAbilities.length > 0 ? (
                      <div className="space-y-2 mt-1">
                        {faction.regimentAbilities.map(reg => (
                          <div key={reg.id} className="border-b border-[#222834]/40 last:border-0 pb-1.5 last:pb-0">
                            <p className="text-xs font-black text-white">{reg.name}</p>
                            <p className="text-xxs text-gray-400 leading-normal mt-0.5">{reg.effect}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xxs text-gray-500 mt-1 italic">No regiment abilities found.</p>
                    )}
                  </div>
                  <div className="border-t border-[#1c222e] pt-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">⚡ Chosen General Enhancement</span>
                    {(() => {
                      const enh = faction?.enhancements?.find(e => e.id === gameState?.selectedEnhancementId);
                      return enh ? (
                        <div className="mt-1">
                          <p className="text-xs font-black text-white">{enh.name}</p>
                          <p className="text-xxs text-gray-400 leading-normal mt-0.5">{enh.effect}</p>
                        </div>
                      ) : (
                        <p className="text-xxs text-gray-500 mt-1 italic">No enhancement selected.</p>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Step 3: Realm Battlefield selection */}
              <div className="space-y-3 border-t border-[#1d222d] pt-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-amber-500">3.</span> Choose Realm Battlefield
                  </h4>
                  <input
                    type="checkbox"
                    checked={!!deploymentStepChecked[3]}
                    onChange={() => toggleDeploymentStep(3)}
                    className="rounded border-[#2c3548] bg-[#1c2230] text-amber-500 focus:ring-0 cursor-pointer h-4 w-4"
                  />
                </div>
                <p className="text-xxs text-gray-400 leading-normal">
                  The **defender** chooses which side of the realm battlefield the players will fight on. Select the realm battlefield below:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeploymentRealm('aqshy')}
                    className={`p-3 rounded-xl border text-xs font-black flex flex-col items-center justify-center gap-1 transition-all duration-300
                      ${deploymentRealm === 'aqshy'
                        ? 'bg-orange-500/15 border-orange-500 text-white shadow-lg shadow-orange-500/5'
                        : 'bg-[#151923] border-[#222834] text-gray-400 hover:text-white hover:bg-[#1a1f2c]'}`}
                  >
                    <span className="text-sm">🔥 AQSHY</span>
                    <span className="text-[9px] text-orange-400/80 uppercase font-bold tracking-widest">REALM OF FIRE</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeploymentRealm('ghyran')}
                    className={`p-3 rounded-xl border text-xs font-black flex flex-col items-center justify-center gap-1 transition-all duration-300
                      ${deploymentRealm === 'ghyran'
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/5'
                        : 'bg-[#151923] border-[#222834] text-gray-400 hover:text-white hover:bg-[#1a1f2c]'}`}
                  >
                    <span className="text-sm">🍃 GHYRAN</span>
                    <span className="text-[9px] text-emerald-400/80 uppercase font-bold tracking-widest">REALM OF LIFE</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeploymentRealm('ossia')}
                    className={`p-3 rounded-xl border text-xs font-black flex flex-col items-center justify-center gap-1 transition-all duration-300
                      ${deploymentRealm === 'ossia'
                        ? 'bg-amber-600/15 border-amber-600 text-white shadow-lg shadow-amber-600/5'
                        : 'bg-[#151923] border-[#222834] text-gray-400 hover:text-white hover:bg-[#1a1f2c]'}`}
                  >
                    <span className="text-sm">🏜️ OSSIA</span>
                    <span className="text-[9px] text-amber-500/80 uppercase font-bold tracking-widest">LAND OF SAND</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeploymentRealm('dolorum')}
                    className={`p-3 rounded-xl border text-xs font-black flex flex-col items-center justify-center gap-1 transition-all duration-300
                      ${deploymentRealm === 'dolorum'
                        ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-lg shadow-cyan-500/5'
                        : 'bg-[#151923] border-[#222834] text-gray-400 hover:text-white hover:bg-[#1a1f2c]'}`}
                  >
                    <span className="text-sm">💀 DOLORUM</span>
                    <span className="text-[9px] text-cyan-400/80 uppercase font-bold tracking-widest">LAND OF BONE</span>
                  </button>
                </div>
              </div>

              {/* Step 4: Pick Deployment Map */}
              <div className="space-y-3 border-t border-[#1d222d] pt-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-amber-500">4.</span> Choose Deployment Map & Territories
                  </h4>
                  <input
                    type="checkbox"
                    checked={!!deploymentStepChecked[4]}
                    onChange={() => toggleDeploymentStep(4)}
                    className="rounded border-[#2c3548] bg-[#1c2230] text-amber-500 focus:ring-0 cursor-pointer h-4 w-4"
                  />
                </div>
                <p className="text-xxs text-gray-400 leading-normal">
                  The **defender** picks 1 of the official deployment maps and chooses which territory belongs to which player. Click to select your active map split below:
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setDeploymentMap('horizontal')}
                    className={`p-2 rounded-xl border text-left flex flex-col gap-2 transition-all duration-300 overflow-hidden
                      ${deploymentMap === 'horizontal'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/5'
                        : 'bg-[#151923] border-[#222834] text-gray-400 hover:text-white hover:bg-[#1a1f2c]'}`}
                  >
                    <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border border-white/5">
                      <img
                        src="/map_horizontal.png"
                        alt="Horizontal Split Map"
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="px-1 py-0.5">
                      <span className="text-xs font-black block text-white">Horizontal Split</span>
                      <span className="text-[10px] text-gray-400 leading-normal font-medium block mt-0.5">Territories split horizontally by midline.</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeploymentMap('diagonal')}
                    className={`p-2 rounded-xl border text-left flex flex-col gap-2 transition-all duration-300 overflow-hidden
                      ${deploymentMap === 'diagonal'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/5'
                        : 'bg-[#151923] border-[#222834] text-gray-400 hover:text-white hover:bg-[#1a1f2c]'}`}
                  >
                    <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border border-white/5">
                      <img
                        src="/map_diagonal.png"
                        alt="Diagonal Split Map"
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="px-1 py-0.5">
                      <span className="text-xs font-black block text-white">Diagonal Split</span>
                      <span className="text-[10px] text-gray-400 leading-normal font-medium block mt-0.5">Territories split diagonally by midline.</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 5: Set up Terrain Features */}
              <div className="space-y-3 border-t border-[#1d222d] pt-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-amber-500">5.</span> Set Up Terrain Features
                  </h4>
                  <input
                    type="checkbox"
                    checked={!!deploymentStepChecked[5]}
                    onChange={() => toggleDeploymentStep(5)}
                    className="rounded border-[#2c3548] bg-[#1c2230] text-amber-500 focus:ring-0 cursor-pointer h-4 w-4"
                  />
                </div>
                <p className="text-xxs text-gray-400 leading-normal">
                  The **defender** sets up their terrain features, followed by the **attacker**. Settle physical terrain using the strict placement rules of war:
                </p>
                <div className="p-3.5 rounded-xl border border-dashed border-[#2c3548] bg-[#11141c] space-y-2 text-xxs text-gray-300">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500">📍</span>
                    <p>Must be set up **wholly within friendly territory**.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500">📍</span>
                    <p>Must be set up **more than 6"** from all other terrain features.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500">📍</span>
                    <p>Must be set up **more than 3"** from both long battlefield edges and enemy territory.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500">🚫</span>
                    <p className="text-red-300 font-medium">Terrain features **cannot be set up on top of objectives** (either wholly or partially).</p>
                  </div>
                </div>
              </div>

              {/* Step 6: Deploy Army Roster */}
              <div className="space-y-3 border-t border-[#1d222d] pt-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-amber-500">6.</span> Deploy Army Roster
                  </h4>
                  <input
                    type="checkbox"
                    checked={!!deploymentStepChecked[6]}
                    onChange={() => toggleDeploymentStep(6)}
                    className="rounded border-[#2c3548] bg-[#1c2230] text-amber-500 focus:ring-0 cursor-pointer h-4 w-4"
                  />
                </div>
                <p className="text-xxs text-gray-400 leading-normal">
                  The **attacker** sets up all the units in their army first, followed by the **defender**. Units must satisfy the deployment conditions below:
                </p>
                <div className="p-3.5 rounded-xl border border-dashed border-[#2c3548] bg-[#11141c] space-y-2 text-xxs text-gray-300">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500">🛡️</span>
                    <p>Each unit must be set up **wholly within friendly territory**.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500">🛡️</span>
                    <p>Each unit must be set up **more than 6"** from enemy territory.</p>
                  </div>
                </div>
              </div>

              {/* Step 7: Implementation of Deployment Phase Skills */}
              <div className="space-y-3 border-t border-[#1d222d] pt-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-amber-500">7.</span> Implement Army Deployment Skills
                  </h4>
                  <input
                    type="checkbox"
                    checked={!!deploymentStepChecked[7]}
                    onChange={() => toggleDeploymentStep(7)}
                    className="rounded border-[#2c3548] bg-[#1c2230] text-amber-500 focus:ring-0 cursor-pointer h-4 w-4"
                  />
                </div>
                <p className="text-xxs text-gray-400 leading-normal">
                  Any faction-specific traits, regiment abilities, enhancements, or unit skills marked as **"Deployment Phase"** or **"Pre-Battle"** must be implemented now:
                </p>
                {(() => {
                  const deploymentAbilities = getDeploymentAbilities();
                  if (deploymentAbilities.length === 0) {
                    return (
                      <div className="p-4 rounded-xl border border-[#222834] bg-zinc-950/20 text-center text-xxs text-gray-500 italic">
                        No pre-battle or deployment-specific skills found for your active army roster.
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {deploymentAbilities.map((ab, idx) => (
                        <div key={`dep-ab-${idx}`} className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xxs font-black text-white uppercase tracking-wider">{ab.name}</span>
                            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5">
                              {ab.source}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider mt-0.5">TIMING: {ab.timing}</p>
                          <p className="text-xxs text-gray-300 leading-normal mt-1">{ab.effect}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#222834] bg-[#0c0e16] flex justify-between items-center gap-3">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
                {Object.values(deploymentStepChecked).filter(Boolean).length} / 7 Steps Completed
              </span>
              <Button
                onClick={handleCompleteDeployment}
                className="h-11 px-6 bg-gradient-to-r from-[#ca8a04] to-amber-500 hover:scale-103 hover:shadow-lg hover:shadow-amber-500/10 text-white font-extrabold text-xs uppercase rounded-xl transition-all"
              >
                Let's Begin Turn 1 Setup <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
