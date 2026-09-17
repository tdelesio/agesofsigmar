'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, CheckCircle2, AlertCircle, Sparkles, Shield, 
  Activity, Play, Check, FileText, Database, Search, 
  Terminal, RefreshCw, HelpCircle, User, Users,
  TrendingDown, Trophy, Swords, HelpCircle as HelpIcon,
  ShieldCheck, AlertTriangle, Eye, Compass, Info, Dice5,
  Globe, Zap, Hourglass, BarChart3, Target as TargetIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_FACTIONS } from '../data/default-factions';
import { Faction, Ability, Unit } from '../types';
import { analyzeAbilityRule, ParsedRuleResult } from '@/lib/rules-engine';

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
    const rules = analyzeAbilityRule(ab, activeFaction);

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

    // Customization assertion log
    if (rules.isCustomHandled) {
      logList.push(`[SYSTEM_TEST] ⚠️ ASSERT CUSTOMIZATION: This ability is intercept-handled by dedicated custom faction mechanics in the app codebase.`);
      logList.push(`[SYSTEM_TEST] ℹ️ Custom details: ${rules.customHandlingDetails}`);
    } else {
      logList.push(`[SYSTEM_TEST] 📦 ASSERT GLOBAL ENGINE: This ability compiles under standard global business rules logic.`);
    }

    // Specific User Tests logging:
    if (rules.isPassive) {
      logList.push(`[DIAGNOSTIC] Passive rule detected! Evaluates continuously in background during "${ab.phase}" phase.`);
    }
    if (rules.heroOrGeneralOnly) {
      logList.push(`[DIAGNOSTIC] Restriction Gating: Restricts bonus explicitly to Heroes/General unit tags.`);
    }
    if (rules.hasSpatialOrConditionalCheck) {
      logList.push(`[DIAGNOSTIC] Tabletop Conditional Check: Requires distance / status condition validation ("${rules.conditionalCheckDescription}").`);
    }
    if (rules.isExternallyTracked) {
      logList.push(`[DIAGNOSTIC] Externally Tracked Keywords Found: [${rules.externalTrackedKeywords.join(', ')}]. Status tracked outside Next.js standard modifier arrays.`);
    }
    if (rules.rollDiceCount) {
      logList.push(`[DIAGNOSTIC] Dice Roll Challenge: "${rules.rollDiceCheckText}" (triggers user interaction prompts).`);
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
                Upgraded Diagnostic Harness
              </Badge>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2 mt-1">
              <Terminal className="h-6 w-6 text-amber-500 shrink-0" />
              Rules Interpretation Engine Test Harness
            </h1>
            <p className="text-xxs md:text-xs text-gray-400 leading-normal max-w-2xl font-medium">
              Validate and audit the natural language interpretation of army cohort abilities. Choose any preloaded or custom faction to inspect targeted vs self modes, Hero/General restrictions, passive state effects, distance/conditional checks, physical dice count thresholds, and externally tracked statuses (Strike-Last, Mortal Wounds).
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
                <div className="space-y-4">
                  {filteredAbilities.map((item, idx) => {
                    const ab = item.ability;
                    const analysis = analyzeAbilityRule(ab, activeFaction);
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
                        {/* 1. Header (Standard Info) */}
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
                            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                              {ab.name}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge className="bg-[#21262d] text-gray-400 text-[8px] font-black tracking-wider uppercase px-1.5 py-px">
                              {ab.once.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-5 space-y-5">
                          
                          {/* 2. Ability Description (Bigger, Highly Readable Font) */}
                          <div className="space-y-1 text-left">
                            <h4 className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                              <Info className="h-3 w-3 text-amber-500" /> Ability Rules Text
                            </h4>
                            <p className="text-xs md:text-sm font-semibold text-gray-200 leading-relaxed bg-[#0d1117] p-4 rounded-xl border border-[#21262d] whitespace-pre-line">
                              {ab.effect || <span className="text-gray-500 italic">No description provided.</span>}
                            </p>
                          </div>

                          {/* 3. Phase & Timing Section */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-left border-t border-[#21262d]/40 pt-4">
                            <div className="p-3 rounded-xl border border-[#21262d] bg-[#161b22]/40 flex items-center gap-3">
                              <Hourglass className="h-4.5 w-4.5 text-amber-400 shrink-0" />
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Activation Phase</span>
                                <span className="text-xs font-black text-white uppercase tracking-tight">{analysis.activationPhase}</span>
                              </div>
                            </div>

                            <div className="p-3 rounded-xl border border-[#21262d] bg-[#161b22]/40 flex items-center gap-3">
                              <Zap className="h-4.5 w-4.5 text-purple-400 shrink-0" />
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Applied Phase</span>
                                <span className="text-xs font-black text-purple-300 uppercase tracking-tight">{analysis.appliedPhase}</span>
                              </div>
                            </div>
                          </div>

                          {/* 4. Target Section (New Section under phases as requested) */}
                          <div className="p-4 rounded-xl border border-[#21262d] bg-[#0d1117]/30 text-left border-t space-y-2">
                            <h4 className="text-[9px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                              <TargetIcon className="h-3.5 w-3.5 shrink-0 text-amber-500 animate-pulse" /> Target Specification
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {analysis.targetSpecifications.map((spec, sIdx) => {
                                let badgeColor = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
                                if (spec.startsWith("Self:")) badgeColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                                else if (spec.startsWith("Specific Unit(s):")) badgeColor = "bg-purple-500/10 text-purple-400 border border-purple-500/20";
                                else if (spec.includes("Enemy")) badgeColor = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                                else if (spec.includes("Hero")) badgeColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                                else if (spec.includes("Not Hero")) badgeColor = "bg-zinc-500/10 text-zinc-300 border border-zinc-500/20";

                                return (
                                  <Badge key={sIdx} className={`${badgeColor} text-[10px] font-black tracking-wider uppercase px-2.5 py-1`}>
                                    {spec}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>

                          {/* 5. Influenced Stats Section (Now with Modifier Value count!) */}
                          {analysis.statsWithModifiers.length > 0 && (
                            <div className="space-y-1.5 text-left border-t border-[#21262d]/40 pt-4">
                              <h4 className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                <BarChart3 className="h-3 w-3 text-emerald-500" /> Influenced Application Stats
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {analysis.statsWithModifiers.map((item, mIdx) => {
                                  const isRedBadge = item.mod.startsWith('-');
                                  return (
                                    <Badge 
                                      key={mIdx} 
                                      className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1
                                        ${isRedBadge 
                                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}
                                    >
                                      ★ {item.stat} ({item.mod})
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 6. Ability Diagnostics Checklist (Stripped of targeting filters as requested) */}
                          <div className="border border-[#21262d] rounded-xl p-4 bg-[#0d1117]/40 space-y-2.5 text-left border-t pt-4">
                            <h4 className="text-[9px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1">
                              <Compass className="h-3 w-3" /> Ability Diagnostics Checklist
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xxs font-semibold">
                              
                              {/* Hero/General Restrictions */}
                              <div className="flex items-center gap-2 p-1.5 rounded-lg border border-[#222834] bg-[#161b22]">
                                <Badge className={`h-4.5 min-w-4.5 rounded-full flex items-center justify-center p-0 font-bold
                                  ${analysis.heroOrGeneralOnly ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-gray-800 text-gray-500'}`}>
                                  {analysis.heroOrGeneralOnly ? '!' : '—'}
                                </Badge>
                                <span className={analysis.heroOrGeneralOnly ? 'text-gray-200' : 'text-gray-500'}>Hero / General Only Restriction</span>
                              </div>

                              {/* Passive State */}
                              <div className="flex items-center gap-2 p-1.5 rounded-lg border border-[#222834] bg-[#161b22]">
                                <Badge className={`h-4.5 min-w-4.5 rounded-full flex items-center justify-center p-0 font-bold
                                  ${analysis.isPassive ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-gray-800 text-gray-500'}`}>
                                  {analysis.isPassive ? '✓' : '—'}
                                </Badge>
                                <span className={analysis.isPassive ? 'text-gray-200' : 'text-gray-500'}>Passive Continuous Aura</span>
                              </div>

                              {/* Defensive Ability */}
                              <div className="flex items-center gap-2 p-1.5 rounded-lg border border-[#222834] bg-[#161b22] col-span-1 md:col-span-2">
                                <Badge className={`h-4.5 min-w-4.5 rounded-full flex items-center justify-center p-0 font-bold
                                  ${analysis.isDefensive ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-gray-800 text-gray-500'}`}>
                                  {analysis.isDefensive ? '✓' : '—'}
                                </Badge>
                                <span className={analysis.isDefensive ? 'text-teal-300 font-bold' : 'text-gray-500'}>
                                  {analysis.isDefensive ? '🛡️ Asserted Defensive / Protective Ability' : 'Standard Offensive / Tactical action (non-defensive)'}
                                </span>
                              </div>

                              {/* Spatial Check */}
                              <div className="flex items-center gap-2 p-1.5 rounded-lg border border-[#222834] bg-[#161b22] col-span-1 md:col-span-2">
                                <Badge className={`h-4.5 min-w-4.5 rounded-full flex items-center justify-center p-0 font-bold
                                  ${analysis.hasSpatialOrConditionalCheck ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-gray-800 text-gray-500'}`}>
                                  {analysis.hasSpatialOrConditionalCheck ? '✓' : '—'}
                                </Badge>
                                <span className={analysis.hasSpatialOrConditionalCheck ? 'text-gray-200' : 'text-gray-500'}>
                                  {analysis.hasSpatialOrConditionalCheck 
                                    ? `Spatial Check: ${analysis.conditionalCheckDescription}` 
                                    : 'Spatial Check: None'}
                                </span>
                              </div>

                              {/* Table Top Effect */}
                              <div className="flex items-center gap-2 p-1.5 rounded-lg border border-[#222834] bg-[#161b22] col-span-1 md:col-span-2">
                                <Badge className={`h-4.5 min-w-4.5 rounded-full flex items-center justify-center p-0 font-bold
                                  ${analysis.isExternallyTracked ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : 'bg-gray-800 text-gray-500'}`}>
                                  {analysis.isExternallyTracked ? '✓' : '—'}
                                </Badge>
                                <span className={analysis.isExternallyTracked ? 'text-gray-200' : 'text-gray-500'}>
                                  {analysis.isExternallyTracked 
                                    ? `Table Top Effect: [${analysis.externalTrackedKeywords.join(', ')}]` 
                                    : 'Table Top Effect: None'}
                                </span>
                              </div>

                              {/* Roll Dice count check */}
                              <div className="flex items-center gap-2 p-1.5 rounded-lg border border-[#222834] bg-[#161b22] col-span-1 md:col-span-2">
                                <Badge className={`h-4.5 min-w-4.5 rounded-full flex items-center justify-center p-0 font-bold
                                  ${analysis.rollDiceCount ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-gray-800 text-gray-500'}`}>
                                  {analysis.rollDiceCount ? '✓' : '—'}
                                </Badge>
                                <span className={analysis.rollDiceCount ? 'text-gray-200 animate-pulse' : 'text-gray-500'}>
                                  {analysis.rollDiceCount 
                                    ? `Dice Check Challenge: ${analysis.rollDiceCheckText}` 
                                    : 'No dice roll comparisons parsed'}
                                </span>
                              </div>

                              {/* Permanent Effect */}
                              <div className="flex items-center gap-2 p-1.5 rounded-lg border border-[#222834] bg-[#161b22] col-span-1 md:col-span-2">
                                <Badge className={`h-4.5 min-w-4.5 rounded-full flex items-center justify-center p-0 font-bold
                                  ${analysis.isPermanent ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-gray-800 text-gray-500'}`}>
                                  {analysis.isPermanent ? '✓' : '—'}
                                </Badge>
                                <span className={analysis.isPermanent ? 'text-gray-200' : 'text-gray-500'}>
                                  {analysis.isPermanent 
                                    ? 'Permanent Effect (Stays for rest of the game)' 
                                    : 'Temporary Effect (Phase or Turn Duration)'}
                                </span>
                              </div>

                            </div>

                            {/* Special Faction Rule indication banner */}
                            {analysis.isSpecialFactionRule ? (
                              <div className="p-3.5 rounded-xl border border-yellow-500/35 bg-yellow-500/[0.04] text-yellow-300 flex flex-col gap-1.5 text-left text-xxs font-semibold leading-relaxed mt-3">
                                <div className="flex items-center gap-1.5 uppercase font-black tracking-wider text-yellow-400">
                                  <Trophy className="h-4 w-4 shrink-0 text-yellow-400 animate-pulse" />
                                  <span>⭐ Special Faction Rule Asserted</span>
                                </div>
                                <p className="text-gray-200 font-medium">
                                  {analysis.specialFactionRuleExplanation}
                                </p>
                              </div>
                            ) : (
                              /* Asserted Standard Global Engine Rule Box */
                              <div className="p-3 rounded-xl border border-[#21262d] bg-[#0d1117]/20 text-gray-400 flex flex-col gap-1.5 text-left text-xxs font-semibold leading-relaxed mt-3">
                                <div className="flex items-center gap-1.5 uppercase font-black tracking-wider text-gray-400">
                                  <Globe className="h-3.5 w-3.5 text-gray-400" />
                                  <span>📦 Asserted Standard Global Engine Rule</span>
                                </div>
                                <p className="text-gray-400 font-medium">
                                  {analysis.customHandlingDetails}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* 8. Programmed Net Effect Section (Last) */}
                          <div className="space-y-1.5 text-left border-t border-[#21262d]/40 pt-4">
                            <h4 className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                              <Terminal className="h-3 w-3 text-amber-500" /> Programmed Net Effect
                            </h4>
                            <ul className="space-y-1.5 pl-3.5 list-disc text-xxs text-gray-300 font-medium leading-relaxed">
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
                      <p className="text-xxs text-gray-400 font-semibold uppercase tracking-wider">
                        {selectedAbilityForSimulation.phase.toUpperCase() === 'PASSIVE' ? 'PASSIVE' : selectedAbilityForSimulation.phase.toUpperCase() + ' PHASE'} • {selectedAbilityForSimulation.once.toUpperCase()}
                      </p>
                    </div>

                    {/* Simulation Settings */}
                    {(() => {
                      const analysis = analyzeAbilityRule(selectedAbilityForSimulation, activeFaction);
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
                        else if (log.startsWith('[DIAGNOSTIC]')) colorClass = 'text-cyan-400 font-medium';
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
