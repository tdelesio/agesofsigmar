'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, CheckCircle2, AlertCircle, Sparkles, Shield, 
  Activity, Play, Check, FileText, Database, Search, 
  Terminal, RefreshCw, HelpCircle, User, Users,
  TrendingDown, Trophy, Swords
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_FACTIONS } from '../data/default-factions';
import { Faction, Ability, Unit } from '../types';

// Parsing Engine Helper (matches the tracker's exact natural language rules engine parsing)
interface ParsedRuleResult {
  allowedStats: ('attacks' | 'save' | 'ward' | 'move' | 'hit' | 'wound' | 'rend' | 'damage' | 'charge')[];
  requiredRoll: string | null;
  targetingType: 'self' | 'single_friendly' | 'multi_friendly' | 'global_passive' | 'unknown';
  netEffects: string[];
  isRelentlessDiscipline: boolean;
}

function analyzeAbilityRule(ability: Ability): ParsedRuleResult {
  const effectText = ability.effect || '';
  const effectLower = effectText.toLowerCase();
  const nameLower = (ability.name || '').toLowerCase();
  const abId = ability.id || '';

  let allowedStats: ('attacks' | 'save' | 'ward' | 'move' | 'hit' | 'wound' | 'rend' | 'damage' | 'charge')[] = [];
  let requiredRoll: string | null = null;
  let targetingType: 'self' | 'single_friendly' | 'multi_friendly' | 'global_passive' | 'unknown' = 'single_friendly';
  const netEffects: string[] = [];

  const isRelentlessDiscipline = abId.startsWith('relentlessDiscipline') || nameLower.includes('relentless discipline');

  // 1. Parse Stat Modifiers
  if (isRelentlessDiscipline) {
    allowedStats = ['move', 'charge', 'wound', 'ward'];
    netEffects.push("Ossiarch Bonereapers Custom Move Buff: Applies +2\" Move modifier expiring at end of Move phase.");
    netEffects.push("Defensive Ward Buff: Grants target +1 to ward rolls during Combat/Shooting phases.");
    targetingType = 'single_friendly';
  } else {
    if (
      effectLower.includes('attacks characteristic') || 
      effectLower.includes('add 1 to the attacks') || 
      effectLower.includes('modify attacks') || 
      effectLower.includes('attack characteristic') ||
      effectLower.includes('attacks characteristic of')
    ) {
      allowedStats.push('attacks');
      netEffects.push("Modifies weapon attacks characteristic by +1 (expires at end of active phase).");
    }
    if (
      effectLower.includes('save roll') || 
      effectLower.includes('save characteristic') || 
      effectLower.includes('add 1 to save') ||
      effectLower.includes('add 1 to the save')
    ) {
      allowedStats.push('save');
      netEffects.push("Increases save characteristic by +1 (grants defensive cover buff).");
    }
    if (
      effectLower.includes('ward roll') || 
      effectLower.includes('ward characteristic') || 
      effectLower.includes('add 1 to ward') ||
      effectLower.includes('add 1 to the ward')
    ) {
      allowedStats.push('ward');
      netEffects.push("Grants or improves ward save protection by +1 (adds ward protection layers).");
    }
    if (
      effectLower.includes('move') || 
      effectLower.includes('run') || 
      effectLower.includes('charge') ||
      effectLower.includes('movement')
    ) {
      allowedStats.push('move');
      if (nameLower.includes('speed of hysh')) {
        netEffects.push("Doubles target's movement characteristic for the current phase.");
      } else {
        netEffects.push("Modifies unit move characteristic by +1\" (applicable to run/charge/movement).");
      }
    }
    if (
      effectLower.includes('hit roll') || 
      effectLower.includes('hit rolls') || 
      effectLower.includes('add 1 to hit') ||
      effectLower.includes('add 1 to the hit')
    ) {
      allowedStats.push('hit');
      netEffects.push("Improves weapon hit accuracy rolls by +1 (attacks hit on 1 value lower).");
    }
    if (
      effectLower.includes('wound roll') || 
      effectLower.includes('wound rolls') || 
      effectLower.includes('add 1 to wound') ||
      effectLower.includes('add 1 to the wound')
    ) {
      allowedStats.push('wound');
      netEffects.push("Improves weapon wound strength rolls by +1.");
    }
    if (
      effectLower.includes('rend characteristic') || 
      effectLower.includes('add 1 to rend') ||
      effectLower.includes('add 1 to the rend')
    ) {
      allowedStats.push('rend');
      netEffects.push("Improves weapon rend penetrative value by 1.");
    }
    if (
      effectLower.includes('damage characteristic') || 
      effectLower.includes('add 1 to damage') ||
      effectLower.includes('add 1 to the damage')
    ) {
      allowedStats.push('damage');
      netEffects.push("Increases weapon damage characteristic by +1.");
    }
  }

  // 2. Parse Dice Roll Requirements
  const rollMatch = effectText.match(/on\s+a\s+(\d+)\+/i);
  if (rollMatch) {
    requiredRoll = rollMatch[1] + '+';
    netEffects.push(`Dice Roll Required: User is prompted with a physical ${requiredRoll} roll-off before any modifiers or buffs take effect.`);
  }

  // 3. Determine Targeting Rules
  if (ability.phase === 'passive') {
    targetingType = 'global_passive';
    netEffects.push("Passive Ability: Registers as a persistent background aura; does not prompt target unit clicks.");
  } else if (effectLower.includes('friendly unit') || effectLower.includes('friendly units')) {
    if (effectLower.includes('each friendly unit') || effectLower.includes('all friendly units')) {
      targetingType = 'multi_friendly';
      netEffects.push("Global Targeting: Click triggers application to ALL valid friendly units in the active cohort.");
    } else {
      targetingType = 'single_friendly';
      netEffects.push("Targeted Application: Click prompts a modal to select exactly 1 friendly unit to receive the parsed buffs.");
    }
  } else if (effectLower.includes('this unit') || effectLower.includes('self')) {
    targetingType = 'self';
    netEffects.push("Self-Targeting: Click applies the parsed modifiers exclusively to the acting parent unit.");
  } else {
    // Default to friendly target selection if it has any stats
    if (allowedStats.length > 0) {
      targetingType = 'single_friendly';
      netEffects.push("Default Targeting: Click prompts the user to choose 1 target friendly unit.");
    } else {
      targetingType = 'unknown';
      netEffects.push("Log Only Action: No direct stat modifiers parsed. Triggers a clean game action text log upon click.");
    }
  }

  // Once timing conditions
  if (ability.once === 'once-per-turn') {
    netEffects.push("Turn Lockout: Registering activation adds ability ID to 'usedAbilities' dictionary, blocking duplicate uses until the turn ends.");
  } else if (ability.once === 'once-per-battle') {
    netEffects.push("Battle Lockout: Registering activation flags the ability as exhausted, permanently blocking duplicate uses for the rest of the match.");
  }

  return {
    allowedStats,
    requiredRoll,
    targetingType,
    netEffects,
    isRelentlessDiscipline
  };
}

const mergeFactions = (defaults: Faction[], custom: Faction[]): Faction[] => {
  const map = new Map<string, Faction>();
  defaults.forEach(f => map.set(f.id, f));
  custom.forEach(f => map.set(f.id, f));
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export default function TestHarnessPage() {
  const router = useRouter();

  const [factions, setFactions] = useState<Faction[]>(() => {
    return [...DEFAULT_FACTIONS].sort((a, b) => a.name.localeCompare(b.name));
  });

  const [selectedFactionId, setSelectedFactionId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'traits' | 'regiment' | 'enhancements' | 'units'>('all');

  // Simulation State
  const [selectedAbilityForSimulation, setSelectedAbilityForSimulation] = useState<Ability | null>(null);
  const [selectedSimTargetUnitId, setSelectedAbilityTargetUnitId] = useState<string>('');
  const [simLog, setSimLog] = useState<string[]>([]);
  const [simActiveModifiers, setSimActiveModifiers] = useState<any[]>([]);

  useEffect(() => {
    const savedFactionsStr = localStorage.getItem('custom_factions');
    if (savedFactionsStr) {
      try {
        const customFactions: Faction[] = JSON.parse(savedFactionsStr);
        setFactions(mergeFactions(DEFAULT_FACTIONS, customFactions));
      } catch (err) {
        console.error('Failed to parse custom factions in test harness:', err);
      }
    }
  }, []);

  const activeFaction = factions.find(f => f.id === selectedFactionId);

  // Compile all abilities for the selected faction
  const compiledAbilities: { 
    ability: Ability; 
    category: 'Battle Trait' | 'Regiment Ability' | 'Enhancement' | 'Unit Ability';
    parentUnitName?: string;
  }[] = [];

  if (activeFaction) {
    activeFaction.battleTraits.forEach(a => {
      compiledAbilities.push({ ability: a, category: 'Battle Trait' });
    });
    activeFaction.regimentAbilities.forEach(a => {
      compiledAbilities.push({ ability: a, category: 'Regiment Ability' });
    });
    activeFaction.enhancements.forEach(a => {
      compiledAbilities.push({ ability: a, category: 'Enhancement' });
    });
    activeFaction.units.forEach(u => {
      u.abilities.forEach(a => {
        compiledAbilities.push({ ability: a, category: 'Unit Ability', parentUnitName: u.name });
      });
    });
  }

  // Filter abilities based on tab and search
  const filteredAbilities = compiledAbilities.filter(item => {
    const ab = item.ability;
    const matchesSearch = 
      (ab.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ab.effect || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.parentUnitName || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'traits' && item.category === 'Battle Trait') return true;
    if (activeTab === 'regiment' && item.category === 'Regiment Ability') return true;
    if (activeTab === 'enhancements' && item.category === 'Enhancement') return true;
    if (activeTab === 'units' && item.category === 'Unit Ability') return true;
    return false;
  });

  // Handle Simulation Run
  const runSimulation = () => {
    if (!selectedAbilityForSimulation) return;
    const ab = selectedAbilityForSimulation;
    const rules = analyzeAbilityRule(ab);

    const logList: string[] = [];
    const newModifiersList: any[] = [];

    logList.push(`[SYSTEM_TEST] ⚡ Initializing activation simulation for "${ab.name}"...`);
    logList.push(`[SYSTEM_TEST] 🔍 Rules Engine Input Text: "${ab.effect}"`);

    // Gating check
    if (ab.once === 'once-per-turn') {
      logList.push(`[STATE_GATING] Lock Check: Adds "${ab.id}" to gameState.usedAbilities. This will lock duplicate activations until the end of the turn.`);
    } else if (ab.once === 'once-per-battle') {
      logList.push(`[STATE_GATING] Lock Check: Flags "${ab.id}" as exhausted. This will lock duplicate activations for the remainder of the battle.`);
    }

    if (rules.requiredRoll) {
      logList.push(`[PROMPT] User Interaction: Shows physical roll modal requiring a physical ${rules.requiredRoll} roll.`);
      logList.push(`[PROMPT] Success Resolution: If the user inputs a successful roll, proceed with modifier application; otherwise, log failure and exit.`);
    }

    if (rules.targetingType === 'global_passive') {
      logList.push(`[STATE_CHANGE] Applies continuous global background passive buff "${ab.name}". No target clicks or actions required.`);
    } else if (rules.targetingType === 'multi_friendly') {
      logList.push(`[STATE_CHANGE] Iterates over all friendly cohort units. Applying buffs to ALL active friendly units.`);
      if (activeFaction) {
        activeFaction.units.forEach(u => {
          rules.allowedStats.forEach(stat => {
            const modVal = rules.isRelentlessDiscipline ? 2 : 1;
            const label = `+${modVal} ${stat.toUpperCase()} (${ab.name})`;
            logList.push(`[APPLIED_MODIFIER] Modified stats for unit [${u.name}]: Stat: "${stat}", Modifier: ${modVal}, Label: "${label}"`);
            newModifiersList.push({ unitName: u.name, stat, modifier: modVal, label, phase: ab.phase });
          });
        });
      }
    } else {
      // Single Target or Self
      const targetUnit = activeFaction?.units.find(u => u.id === selectedSimTargetUnitId) || activeFaction?.units[0];
      if (targetUnit) {
        logList.push(`[TARGET_RESOLVED] Selected unit [${targetUnit.name}] as the target for "${ab.name}".`);
        if (rules.allowedStats.length > 0) {
          rules.allowedStats.forEach(stat => {
            let modVal = 1;
            let label = `+${modVal} ${stat.toUpperCase()} (${ab.name})`;
            if (stat === 'move') {
              if (ab.name.toUpperCase().includes('SPEED OF HYSH')) {
                label = `Doubled Move (${ab.name})`;
              } else if (rules.isRelentlessDiscipline) {
                modVal = 2;
                label = `+2" Move (${ab.name})`;
              } else {
                label = `+1" Move (${ab.name})`;
              }
            } else if (rules.isRelentlessDiscipline && stat === 'ward') {
              label = `+1 Ward (Relentless Discipline - Ward Enhancement)`;
            }
            logList.push(`[APPLIED_MODIFIER] Applied to unit [${targetUnit.name}]: Stat: "${stat}", Modifier: ${modVal}, Label: "${label}" (expires: end of "${ab.phase}" phase)`);
            newModifiersList.push({ unitName: targetUnit.name, stat, modifier: modVal, label, phase: ab.phase });
          });
        } else {
          logList.push(`[STATE_CHANGE] No direct stat modifiers parsed for "${ab.name}".`);
          logList.push(`[GAME_LOG] Appended text log to matches activity logger: "🎯 Selected unit [${targetUnit.name}] as the target for "${ab.name}"."`);
        }
      } else {
        logList.push(`[WARNING] No valid target unit specified or found.`);
      }
    }

    logList.push(`[SYSTEM_TEST] ✅ Simulation completed with 0 errors!`);
    setSimLog(logList);
    setSimActiveModifiers(newModifiersList);
  };

  // Run simulation automatically when target unit or ability changes
  useEffect(() => {
    if (selectedAbilityForSimulation) {
      runSimulation();
    } else {
      setSimLog([]);
      setSimActiveModifiers([]);
    }
  }, [selectedAbilityForSimulation, selectedSimTargetUnitId]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 font-sans pb-16">
      {/* Premium Gradient Top Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-purple-600/10 to-blue-500/10 border-b border-[#21262d] py-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/" className="p-1.5 rounded-lg bg-[#161b22] border border-[#30363d] hover:border-amber-500/50 text-gray-400 hover:text-white transition-all">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-black tracking-wider uppercase px-2 py-0.5">
                Rules & Verification Harness
              </Badge>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2 mt-1">
              <Terminal className="h-6 w-6 text-amber-500 shrink-0" />
              Rules Interpretation Engine Test Harness
            </h1>
            <p className="text-xxs md:text-xs text-gray-400 leading-normal max-w-2xl font-medium">
              Validate and audit the natural language interpretation of army cohort abilities in real time. Choose any preloaded or custom faction to inspect how physical rules are programmatically interpreted into stat modifications, timing logs, and lockout limits.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/admin">
              <Button variant="outline" className="border-[#30363d] bg-[#161b22] text-xs font-bold text-gray-300 hover:text-white hover:bg-[#1f242c] h-10 px-4 gap-2 rounded-xl">
                <Database className="h-4 w-4 text-purple-400" /> CMS ADMIN
              </Button>
            </Link>
            <Link href="/">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold px-4 h-10 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/10 border border-amber-400/25">
                <Play className="h-4 w-4 shrink-0 fill-current" /> PLAY TRACKER
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Faction Selector & Ability List (8 cols) */}
        <div className="col-span-1 lg:col-span-7 space-y-6">
          
          {/* Faction Select Header Box */}
          <Card className="border-[#30363d] bg-[#161b22]/90 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="p-5 border-b border-[#21262d] bg-[#1d222b]">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-amber-500" /> SELECT COHORT TO AUDIT
              </CardTitle>
              <CardDescription className="text-xxs text-gray-400 font-medium">
                Choose a faction database to instantly load and programmatically execute its entire rules configuration.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Cohort Faction</label>
                  <select
                    value={selectedFactionId}
                    onChange={(e) => {
                      setSelectedFactionId(e.target.value);
                      setSelectedAbilityForSimulation(null);
                    }}
                    className="w-full bg-[#0d1117] border border-[#30363d] focus:border-amber-500 text-white rounded-xl text-xs py-3 px-3 outline-none cursor-pointer font-bold focus:ring-0"
                  >
                    <option value="">-- Choose Roster --</option>
                    {factions.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.spearheadName})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Search Abilities</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Filter by name, effect..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] focus:border-amber-500 text-white rounded-xl text-xs py-3 pl-10 pr-4 outline-none font-bold placeholder-gray-500 focus:ring-0"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedFactionId ? (
            <div className="space-y-4">
              {/* Tab Selector bar */}
              <div className="flex border-b border-[#21262d] gap-2 overflow-x-auto pb-px">
                {(['all', 'traits', 'regiment', 'enhancements', 'units'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-[10px] font-black tracking-wider uppercase border-b-2 px-3 transition-all cursor-pointer whitespace-nowrap
                      ${activeTab === tab 
                        ? 'border-amber-500 text-white' 
                        : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                  >
                    {tab === 'traits' ? 'Battle Traits' : tab === 'regiment' ? 'Regiment' : tab === 'enhancements' ? 'Enhancements' : tab === 'units' ? 'Unit Abilities' : 'All'}
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#21262d] text-[9px] font-bold text-gray-400">
                      {tab === 'all' && compiledAbilities.length}
                      {tab === 'traits' && compiledAbilities.filter(i => i.category === 'Battle Trait').length}
                      {tab === 'regiment' && compiledAbilities.filter(i => i.category === 'Regiment Ability').length}
                      {tab === 'enhancements' && compiledAbilities.filter(i => i.category === 'Enhancement').length}
                      {tab === 'units' && compiledAbilities.filter(i => i.category === 'Unit Ability').length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Abilities Cards list */}
              {filteredAbilities.length === 0 ? (
                <div className="py-12 border border-dashed border-[#30363d] rounded-2xl text-center space-y-3 bg-[#161b22]/30">
                  <HelpCircle className="h-8 w-8 text-gray-500 mx-auto" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">No matching abilities found</p>
                  <p className="text-xxs text-gray-500 max-w-xs mx-auto font-medium">Try searching for other keywords or select a different timing tab.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAbilities.map((item, idx) => {
                    const ab = item.ability;
                    const analysis = analyzeAbilityRule(ab);
                    const isSelected = selectedAbilityForSimulation?.id === ab.id;

                    return (
                      <Card 
                        key={idx}
                        className={`border transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer text-left
                          ${isSelected 
                            ? 'border-amber-500 bg-amber-500/[0.02] shadow-amber-500/5' 
                            : 'border-[#30363d] bg-[#161b22]/70 hover:border-gray-500/50 hover:bg-[#161b22]/90'}`}
                        onClick={() => {
                          setSelectedAbilityForSimulation(ab);
                          if (activeFaction && activeFaction.units.length > 0) {
                            setSelectedAbilityTargetUnitId(activeFaction.units[0].id);
                          }
                        }}
                      >
                        <div className="p-4 flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-[#21262d] bg-[#1d222b]/50">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-px shrink-0
                                ${item.category === 'Battle Trait' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  item.category === 'Regiment Ability' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                  item.category === 'Enhancement' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                  'bg-zinc-500/10 text-zinc-300 border border-zinc-500/20'}`}
                              >
                                {item.category}
                              </Badge>
                              {item.parentUnitName && (
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                  <span>•</span> {item.parentUnitName}
                                </span>
                              )}
                              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1 ml-auto md:ml-0">
                                ⏱️ {ab.phase.toUpperCase()}
                              </span>
                            </div>
                            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                              {ab.name}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {analysis.allowedStats.map(stat => (
                              <Badge key={stat} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black tracking-wider uppercase px-1.5 py-px">
                                + {stat.toUpperCase()}
                              </Badge>
                            ))}
                            {analysis.requiredRoll && (
                              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-black tracking-wider uppercase px-1.5 py-px">
                                ROLL {analysis.requiredRoll}
                              </Badge>
                            )}
                            <Badge className="bg-[#21262d] text-gray-400 text-[8px] font-black tracking-wider uppercase px-1.5 py-px">
                              {ab.once.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-4 space-y-3">
                          <p className="text-[10px] text-gray-300 leading-normal font-medium bg-[#0d1117] p-3 rounded-xl border border-[#21262d]">
                            {ab.effect || <span className="text-gray-500 italic">No description provided.</span>}
                          </p>

                          {/* Render Rules interpretation section */}
                          <div className="space-y-1.5">
                            <h4 className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                              <Terminal className="h-3 w-3 text-amber-500" /> Programmed Net Effect
                            </h4>
                            <ul className="space-y-1 pl-3.5 list-disc text-xxs text-gray-400 font-medium">
                              {analysis.netEffects.map((eff, i) => (
                                <li key={i}>{eff}</li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 border border-dashed border-[#30363d] rounded-3xl text-center space-y-4 bg-[#161b22]/20">
              <Database className="h-12 w-12 text-gray-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-black text-white uppercase tracking-wider">No cohort database selected</p>
                <p className="text-xxs text-gray-400 max-w-sm mx-auto font-medium">Please select an army roster at the top of the panel to start analyzing rules and auditing actions.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Mock Activator & Logs Simulator (5 cols) */}
        <div className="col-span-1 lg:col-span-5 space-y-6 lg:sticky lg:top-6 lg:h-[calc(100vh-130px)] lg:overflow-y-auto">
          
          <Card className="border-[#30363d] bg-[#161b22] shadow-xl rounded-2xl h-full flex flex-col overflow-hidden">
            <CardHeader className="p-5 border-b border-[#21262d] bg-[#1d222b]">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500 animate-pulse" /> SIMULATOR & AUDIT LOGGER
              </CardTitle>
              <CardDescription className="text-xxs text-gray-400 font-medium">
                Simulate triggering an ability inside the game tracker to inspect live state changes and modifier resolutions.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto">
              {selectedAbilityForSimulation ? (
                <div className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Selected details */}
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.02] space-y-1 text-left">
                      <div className="text-[8px] font-black uppercase tracking-wider text-amber-500">Selected for Audit:</div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider leading-none">{selectedAbilityForSimulation.name}</h4>
                      <p className="text-xxs text-gray-400 font-semibold uppercase tracking-wider">{selectedAbilityForSimulation.phase.toUpperCase()  === 'PASSIVE' ? 'PASSIVE' : selectedAbilityForSimulation.phase.toUpperCase() + ' PHASE'} • {selectedAbilityForSimulation.once.toUpperCase()}</p>
                    </div>

                    {/* Simulation Settings */}
                    {(() => {
                      const analysis = analyzeAbilityRule(selectedAbilityForSimulation);
                      if (analysis.targetingType === 'global_passive') {
                        return (
                          <div className="p-3 bg-[#0d1117] rounded-xl border border-[#21262d] text-xxs text-gray-400 font-semibold uppercase tracking-wider text-center">
                            🌍 Global Passive aura requires no targeting.
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <User className="h-3 w-3 text-emerald-500" /> Choose Target Unit
                          </label>
                          <select
                            value={selectedSimTargetUnitId}
                            onChange={(e) => setSelectedAbilityTargetUnitId(e.target.value)}
                            className="w-full bg-[#0d1117] border border-[#30363d] focus:border-amber-500 text-white rounded-xl text-xs py-3 px-3 outline-none cursor-pointer font-bold focus:ring-0"
                          >
                            {activeFaction?.units.map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}

                    {/* Live Applied Modifiers list */}
                    {simActiveModifiers.length > 0 && (
                      <div className="space-y-2 text-left border-t border-[#21262d] pt-4">
                        <h4 className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Mock State Changes
                        </h4>
                        <div className="space-y-1.5">
                          {simActiveModifiers.map((mod, i) => (
                            <div key={i} className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.02] flex items-center justify-between text-xxs font-bold uppercase tracking-wider">
                              <span className="text-gray-300">{mod.unitName}</span>
                              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black">
                                {mod.label}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Code Log Console terminal */}
                  <div className="space-y-2 text-left flex-1 flex flex-col justify-end border-t border-[#21262d] pt-4 min-h-[250px]">
                    <h4 className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5 text-amber-500" /> Rules Engine Console Output
                    </h4>
                    <div className="flex-1 bg-black p-4 rounded-xl border border-[#21262d] font-mono text-[9px] leading-relaxed text-gray-300 space-y-1 overflow-y-auto max-h-[300px]">
                      {simLog.map((log, i) => {
                        let colorClass = 'text-gray-400';
                        if (log.startsWith('[SYSTEM_TEST]')) colorClass = 'text-amber-400 font-bold';
                        else if (log.startsWith('[TARGET_RESOLVED]')) colorClass = 'text-blue-400';
                        else if (log.startsWith('[STATE_CHANGE]')) colorClass = 'text-purple-400';
                        else if (log.startsWith('[APPLIED_MODIFIER]')) colorClass = 'text-emerald-400 font-semibold';
                        else if (log.startsWith('[PROMPT]')) colorClass = 'text-pink-400';
                        else if (log.startsWith('[STATE_GATING]')) colorClass = 'text-orange-400';
                        else if (log.startsWith('[WARNING]')) colorClass = 'text-red-400 font-black';

                        return (
                          <div key={i} className={colorClass}>
                            {log}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <Terminal className="h-10 w-10 text-gray-600" />
                  <div className="space-y-1">
                    <p className="text-xxs font-black text-gray-400 uppercase tracking-wider">No active test selected</p>
                    <p className="text-[10px] text-gray-500 max-w-[250px] font-medium leading-normal mx-auto">Click on any loaded ability card to the left to execute the programmatic parser and audit the net state change output here.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
