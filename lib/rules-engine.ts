import { GameState, Faction, Ability } from '@/app/types';

// Helper to compute active Blood Rites round level (accounting for Murderous Epiphany early activations)
export function getActiveBloodRitesRound(gameState: GameState | null): number {
  if (!gameState) return 1;
  const currentRound = gameState.round || 1;
  const isEpiphanyUsed = !!(gameState.usedAbilities && (gameState.usedAbilities['murderousEpiphany'] || gameState.usedAbilities['murderous-epiphany']));
  
  if (isEpiphanyUsed) {
    if (currentRound === 1) return 2;
    if (currentRound === 2) return 3;
    if (currentRound === 3) return 3;
    return Math.max(currentRound, 4); // round 4 and above get round 4 benefits
  }
  
  return currentRound;
}

// Helper to evaluate dynamic, text-based conditional modifiers for an ability (covers general-restrictions and charge-restrictions)
export function evaluateDynamicModifiersForAbility(
  ability: any,
  uState: any,
  uRules: any,
  stat: string,
  weaponName?: string
): { modifier: number; description: string }[] {
  const mods: { modifier: number; description: string }[] = [];
  if (!ability || !ability.effect) return mods;

  const abId = (ability.id || '').toLowerCase();
  const nameLower = (ability.name || '').toLowerCase();
  if (
    ability.isSpecialized ||
    abId === 'eyeofthegods' || 
    abId === 'eye-of-the-gods' || 
    nameLower.includes('eye of the gods') ||
    abId === 'bloodrites' || 
    abId === 'blood-rites' || 
    nameLower.includes('blood rites') ||
    abId === 'gravesandshard' ||
    nameLower.includes('grave-sand shard')
  ) {
    return []; // Return empty; specialized abilities should never follow normal dynamic text parsing rules.
  }

  const effectLower = (ability.effect || '').toLowerCase();

  // 1. Check for general restriction (Age of Sigmar general is designated by the 'isHero' unit flag in Spearhead)
  let isGeneralAbility = effectLower.includes("your general's") || effectLower.includes("your general");
  const isProximityToGeneral = /(?:within|wholly within)\s+\d+["']?\s+of\s+(?:your\s+general|friendly\s+general|a\s+friendly\s+general|the\s+general|a\s+general)/i.test(effectLower);
  if (isProximityToGeneral) {
    isGeneralAbility = false;
  }

  if (isGeneralAbility) {
    if (!uRules || !uRules.isHero) {
      return []; // Not the general, so this ability doesn't apply to this unit
    }
  }

  // 2. Check if it's a charge-conditional rule
  const hasChargeCondition = effectLower.includes('charged in the same turn') || effectLower.includes('has charged') || effectLower.includes('charged this phase');
  
  if (hasChargeCondition) {
    const isNotChargedCondition = effectLower.includes('has not charged') || effectLower.includes('not charged');
    let conditionMet = false;
    if (isNotChargedCondition) {
      conditionMet = !uState.charged;
    } else {
      conditionMet = !!uState.charged;
    }

    if (!conditionMet) return [];
  }

  // 3. Now check if it modifies this stat
  if (stat === 'rend') {
    if (effectLower.includes('add 1 to the rend characteristic') || effectLower.includes('add 1 to rend') || effectLower.includes('add 1 to the rend')) {
      let weaponMatch = true;
      if (weaponName) {
        const isMeleeWeaponTerm = effectLower.includes('melee weapons');
        const isSpecificWeaponMentioned = effectLower.includes(weaponName.toLowerCase());
        weaponMatch = isMeleeWeaponTerm || isSpecificWeaponMentioned || isGeneralAbility;
      }
      if (weaponMatch) {
        mods.push({
          modifier: 1,
          description: `${ability.name} (${hasChargeCondition ? 'Charged' : 'Passive'})`
        });
      }
    }
  } else if (stat === 'attacks') {
    if (effectLower.includes('add 1 to the attacks characteristic') || effectLower.includes('add 1 to attacks') || effectLower.includes('add 1 to the attacks')) {
      let weaponMatch = true;
      if (weaponName) {
        const isMeleeWeaponTerm = effectLower.includes('melee weapons');
        const isSpecificWeaponMentioned = effectLower.includes(weaponName.toLowerCase());
        weaponMatch = isMeleeWeaponTerm || isSpecificWeaponMentioned || isGeneralAbility;
      }
      if (weaponMatch) {
        mods.push({
          modifier: 1,
          description: `${ability.name} (${hasChargeCondition ? 'Charged' : 'Passive'})`
        });
      }
    }
  } else if (stat === 'wound') {
    if (effectLower.includes('add 1 to wound rolls') || effectLower.includes('add 1 to the wound rolls')) {
      mods.push({
        modifier: 1,
        description: `${ability.name} (${hasChargeCondition ? 'Charged' : 'Passive'})`
      });
    }
  } else if (stat === 'hit') {
    if (effectLower.includes('add 1 to hit rolls') || effectLower.includes('add 1 to the hit rolls')) {
      mods.push({
        modifier: 1,
        description: `${ability.name} (${hasChargeCondition ? 'Charged' : 'Passive'})`
      });
    }
  } else if (stat === 'save') {
    if (effectLower.includes('add 1 to save rolls') || effectLower.includes('add 1 to the save rolls')) {
      mods.push({
        modifier: 1,
        description: `${ability.name} (${hasChargeCondition ? 'Charged' : 'Passive'})`
      });
    }
  }

  return mods;
}

// Helper to parse charge-conditional passive abilities and return dynamic modifiers
export function getDynamicChargeModifiers(
  uState: any,
  uRules: any,
  stat: string,
  weaponName?: string,
  faction?: Faction
): { modifier: number; description: string }[] {
  const mods: { modifier: number; description: string }[] = [];
  if (!uState || !uRules || !uRules.abilities) return mods;

  uRules.abilities.forEach((ability: any) => {
    // Skip any abilities that have a spatial/conditional check, because they are applied manually via checkboxes!
    const analysis = analyzeAbilityRule(ability, faction);
    if (analysis.hasSpatialOrConditionalCheck) {
      return;
    }
    // Skip active phase-based abilities (e.g. combat phase choices), as they are manually triggered and tracked.
    if (ability.phase && ability.phase !== 'passive') {
      return;
    }
    const dMods = evaluateDynamicModifiersForAbility(ability, uState, uRules, stat, weaponName);
    mods.push(...dMods);
  });

  return mods;
}

// Fetch active modifiers for a given stat based on current round/phase/selections
export function getActiveModifiers(
  gameState: GameState | null,
  faction: Faction | null,
  stat: string,
  unitId?: string,
  weaponName?: string
): { modifier: number; description: string }[] {
  if (!gameState || !faction) return [];
  const modifiers: { modifier: number; description: string }[] = [];

  const uState = unitId ? gameState.units.find(u => u.id === unitId) : null;
  const uRules = (uState && faction.units) ? faction.units.find(r => r.id === uState.unitId) : null;

  const processAbility = (ability: Ability) => {
    if (ability.ruleDefinition) {
      ability.ruleDefinition.actions.forEach(action => {
        if (action.type === 'modify_stat' && action.stat === stat) {
          let match = true;
          if (action.condition) {
            if (action.condition.round) {
              // Blood rites are cumulative (keep all previous rounds) up to active level
              if (ability.id === 'bloodRites') {
                const activeLevel = getActiveBloodRitesRound(gameState);
                if (action.condition.round > activeLevel) {
                  match = false;
                }
              } else if (action.condition.round !== gameState.round) {
                match = false;
              }
            }
            if (action.condition.phase && action.condition.phase !== gameState.currentPhase) {
              match = false;
            }
          }
          if (match) {
            modifiers.push({
              modifier: action.modifier || 0,
              description: action.description
            });
          }
        }
      });
    }

    // Process dynamic condition-based and text-based modifiers for this ability if unit state is active!
    if (uState && uRules) {
      const dynMods = evaluateDynamicModifiersForAbility(ability, uState, uRules, stat, weaponName);
      modifiers.push(...dynMods);
    }
  };

  // 1. Battle Traits
  if (gameState.selectedBattleTraitId === 'all') {
    faction.battleTraits.forEach(processAbility);
  } else {
    const trait = faction.battleTraits.find(t => t.id === gameState.selectedBattleTraitId);
    if (trait) processAbility(trait);
  }

  // 2. Regiment Abilities (Only selected active regiment ability in Spearhead)
  const activeRegimentAbilities = gameState.selectedRegimentAbilityId && gameState.selectedRegimentAbilityId !== 'all'
    ? faction.regimentAbilities.filter(reg => reg.id === gameState.selectedRegimentAbilityId)
    : faction.regimentAbilities;

  activeRegimentAbilities.forEach(processAbility);

  // 3. Enhancement
  const enhancement = faction.enhancements.find(e => e.id === gameState.selectedEnhancementId);
  if (enhancement) processAbility(enhancement);

  // 4. Custom applied turn-based target modifiers
  if (unitId && gameState.appliedModifiers) {
    gameState.appliedModifiers.forEach(mod => {
      if (mod.unitId === unitId && mod.stat === stat) {
        // Exclude Blessing of Nurgle and Shining Company from standard attacking modifiers because they are defensive
        if (stat === 'wound' && mod.label.includes('Nurgle')) {
          return;
        }
        if (stat === 'hit' && mod.label.includes('Shining Company')) {
          return;
        }
        modifiers.push({
          modifier: mod.modifier,
          description: mod.label
        });
      }
    });

    // Custom multi-stat coupling: If Deathmarch (+1 Move) is active on this unit, also apply +3 Control!
    if (stat === 'control' || stat === 'Control') {
      const hasDeathmarch = gameState.appliedModifiers.some(mod => 
        mod.unitId === unitId && 
        (mod.sourceAbilityId === 'deathmarch' || mod.label.toLowerCase().includes('deathmarch'))
      );
      if (hasDeathmarch) {
        modifiers.push({
          modifier: 3,
          description: 'Deathmarch (Control Bonus)'
        });
      }
    }
  }

  // 5. Dynamic charge-conditional passive abilities
  if (unitId) {
    const uState = gameState.units.find(u => u.id === unitId);
    if (uState && !uState.isSlain) {
      const uRules = faction.units.find(r => r.id === uState.unitId);
      if (uRules) {
        const chargeMods = getDynamicChargeModifiers(uState, uRules, stat, weaponName, faction);
        modifiers.push(...chargeMods);
      }
    }
  }

  return modifiers;
}

// Helper to parse "Battle Damaged" passive abilities and determine if a characteristic is currently degraded
export function getBattleDamagedOverride(
  gameState: GameState | null,
  faction: Faction | null,
  unitId: string | undefined,
  statKey: string,
  weaponName?: string
): number | null {
  if (!unitId || !gameState || !faction) return null;
  const uState = gameState.units.find(u => u.id === unitId);
  if (!uState || uState.isSlain) return null;
  const uRules = faction.units.find(rules => rules.id === uState.unitId);
  if (!uRules) return null;

  const battleDamagedAb = uRules.abilities.find(a => a.id === 'battleDamaged' || a.name.toLowerCase() === 'battle damaged');
  if (!battleDamagedAb) return null;

  // Parse damage threshold: e.g. "While this unit has 10 or more damage points"
  const damageThresholdMatch = battleDamagedAb.effect.match(/(\d+)\s+or\s+more\s+damage\s+points/i) || battleDamagedAb.effect.match(/has\s+(\d+)\s+or\s+more\s+wounds/i);
  const threshold = damageThresholdMatch ? parseInt(damageThresholdMatch[1], 10) : null;
  
  if (threshold !== null && uState.currentWounds >= threshold) {
    const effectLower = battleDamagedAb.effect.toLowerCase();
    
    // Determine if this statKey is affected
    let matchesStat = false;
    if (statKey === 'attacks' && (effectLower.includes('attacks characteristic') || effectLower.includes('attacks is'))) {
      matchesStat = true;
    } else if (statKey === 'damage' && (effectLower.includes('damage characteristic') || effectLower.includes('damage is'))) {
      matchesStat = true;
    } else if (statKey === 'move' && (effectLower.includes('move characteristic') || effectLower.includes('move is'))) {
      matchesStat = true;
    } else if (statKey === 'save' && (effectLower.includes('save characteristic') || effectLower.includes('save is'))) {
      matchesStat = true;
    }

    if (matchesStat) {
      // If it is a weapon-level stat, verify if the weaponName matches
      let matchesWeapon = true;
      if (weaponName) {
        matchesWeapon = effectLower.includes(weaponName.toLowerCase());
      } else if (statKey === 'attacks' || statKey === 'damage') {
        // If rendering attacks or damage without a weaponName, do not blindly apply it to protect other weapons
        matchesWeapon = false;
      }

      if (matchesWeapon) {
        // Parse degraded value
        const valueMatch = battleDamagedAb.effect.match(/is\s+(\d+)/i) || battleDamagedAb.effect.match(/becomes\s+(\d+)/i);
        return valueMatch ? parseInt(valueMatch[1], 10) : null;
      }
    }
  }
  return null;
}

// Core math engine for stat modifications
export function calculateStatValue(
  baseValue: number | string,
  statKey: string,
  totalMod: number
): { baseNum: number; modifiedNum: number; isNan: boolean } {
  let baseNum = 0;
  if (typeof baseValue === 'number') {
    baseNum = baseValue;
  } else {
    baseNum = parseInt(baseValue, 10);
  }

  if (isNaN(baseNum)) {
    return { baseNum: 0, modifiedNum: 0, isNan: true };
  }

  // Custom Override: If a unit has NO inherent ward (baseNum is 0) and we apply a ward modifier (like Ward 6+ or +1 Ward),
  // we treat their base ward as 7. Subtracting totalMod from 7 allows them to gain a valid ward (e.g. 7 - 1 = 6+ ward).
  let actualBaseNum = baseNum;
  if (statKey === 'ward' && baseNum === 0 && totalMod > 0) {
    actualBaseNum = 7;
  }

  let modifiedNum = actualBaseNum;
  const isTargetRoll = ['save', 'ward', 'hit', 'wound'].includes(statKey);
  const isCappedStat = ['save', 'ward', 'hit', 'wound', 'run', 'charge', 'rend', 'attacks', 'damage'].includes(statKey);
  
  let cappedTotalMod = totalMod;
  if (isCappedStat) {
    if (cappedTotalMod > 1) cappedTotalMod = 1;
    if (cappedTotalMod < -1) cappedTotalMod = -1;
  }

  if (isTargetRoll) {
    // Target rolls (Save 4+, Ward 6+). Positive modifier lowers required roll (makes it easier).
    modifiedNum = actualBaseNum - cappedTotalMod;
    if (modifiedNum < 2) modifiedNum = 2; // Roll of 1 is always failure in AoS
  } else {
    // Standard scaling stats (Attacks, Move, Damage). Positive modifier increases the stat.
    modifiedNum = actualBaseNum + (isCappedStat ? cappedTotalMod : totalMod);
    if (modifiedNum < 1) modifiedNum = 1; // Cap at minimum of 1
  }

  return { baseNum: baseNum, modifiedNum, isNan: false };
}

// Determines if an ability effect targets a singular friendly unit
export function isTargetingSingularFriendlyUnit(effect: string): boolean {
  const effectLower = (effect || '').toLowerCase();
  
  const matchesSingular = 
    effectLower.includes('pick a friendly unit') ||
    effectLower.includes('pick 1 friendly unit') ||
    effectLower.includes('select a friendly unit') ||
    effectLower.includes('select 1 friendly unit') ||
    effectLower.includes('choose a friendly unit') ||
    effectLower.includes('choose 1 friendly unit') ||
    effectLower.includes('target a friendly unit') ||
    effectLower.includes('target 1 friendly unit') ||
    effectLower.includes('pick a visible friendly unit') ||
    /pick\s+(a|1|visible|friendly)\s+friendly\s+(?:[a-zA-Z-]+\s+){0,3}unit/i.test(effectLower) ||
    /select\s+(a|1)\s+friendly\s+(?:[a-zA-Z-]+\s+){0,3}unit/i.test(effectLower) ||
    /choose\s+(a|1)\s+friendly\s+(?:[a-zA-Z-]+\s+){0,3}unit/i.test(effectLower);

  const containsPluralExclusions = 
    effectLower.includes('all friendly units') || 
    effectLower.includes('every friendly unit') ||
    effectLower.includes('target friendly units'); // Flask of Shademist etc

  return matchesSingular && !containsPluralExclusions;
}

// Shared Diagnostics Interface with Faction Customization assertions, Targeting & Stats
export interface ParsedRuleResult {
  allowedStats: ('attacks' | 'save' | 'ward' | 'move' | 'hit' | 'wound' | 'rend' | 'damage' | 'charge')[];
  requiredRoll: string | null;
  targetingType: 'self' | 'single_friendly' | 'multi_friendly' | 'global_passive' | 'enemy' | 'unknown';
  netEffects: string[];
  isRelentlessDiscipline: boolean;
  
  // Specific User audit tests (Stripped of targets)
  heroOrGeneralOnly: boolean;
  isPassive: boolean;
  hasSpatialOrConditionalCheck: boolean;
  conditionalCheckDescription: string | null;
  isExternallyTracked: boolean;
  externalTrackedKeywords: string[];
  rollDiceCount: number | null;
  rollDiceCheckText: string | null;

  // Customization vs Global Engine Assertion
  isCustomHandled: boolean;
  customHandlingDetails: string;

  // Enhanced metadata requested
  influencedStats: string[];
  appliedPhase: string;
  activationPhase: string;
  isDefensive: boolean;

  // New features requested
  targetSpecifications: string[];
  statsWithModifiers: { stat: string; mod: string }[];
  isSpecialFactionRule: boolean;
  specialFactionRuleExplanation: string;
  isPermanent: boolean;
}

export function analyzeAbilityRule(ability: Ability, faction?: Faction, gameState?: GameState | null): ParsedRuleResult {
  const effectText = ability.effect || '';
  const effectLower = effectText.toLowerCase();
  const nameLower = (ability.name || '').toLowerCase();
  const abId = (ability.id || '').toLowerCase();

  let allowedStats: ('attacks' | 'save' | 'ward' | 'move' | 'hit' | 'wound' | 'rend' | 'damage' | 'charge')[] = [];
  let requiredRoll: string | null = null;
  let targetingType: 'self' | 'single_friendly' | 'multi_friendly' | 'global_passive' | 'enemy' | 'unknown' = 'single_friendly';
  const netEffects: string[] = [];

  const isRelentlessDiscipline = abId.startsWith('relentlessdiscipline') || nameLower.includes('relentless discipline');

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
  const isEnemyTarget = effectLower.includes('enemy unit') || 
                        effectLower.includes('enemy model') || 
                        effectLower.includes('enemy units') || 
                        effectLower.includes('enemy models') || 
                        effectLower.includes('the quarry') || 
                        effectLower.includes('enemy general') ||
                        /enemy\s+(?:[a-zA-Z-]+\s+){0,3}unit/i.test(effectLower) ||
                        /enemy\s+(?:[a-zA-Z-]+\s+){0,3}units/i.test(effectLower) ||
                        /enemy\s+(?:[a-zA-Z-]+\s+){0,3}model/i.test(effectLower) ||
                        /enemy\s+(?:[a-zA-Z-]+\s+){0,3}models/i.test(effectLower);

  const isFriendlyTarget = effectLower.includes('friendly unit') || 
                          effectLower.includes('friendly units') || 
                          effectLower.includes('friendly model') || 
                          effectLower.includes('friendly models') ||
                          /friendly\s+(?:[a-zA-Z-]+\s+){0,3}unit/i.test(effectLower) ||
                          /friendly\s+(?:[a-zA-Z-]+\s+){0,3}units/i.test(effectLower) ||
                          /friendly\s+(?:[a-zA-Z-]+\s+){0,3}model/i.test(effectLower) ||
                          /friendly\s+(?:[a-zA-Z-]+\s+){0,3}models/i.test(effectLower);

  const declaresEnemyUnit = /declare:\s*pick\s+an?\s+enemy\s+unit/i.test(effectLower) || 
                            /declare:\s*pick\s+visible\s+enemy/i.test(effectLower) ||
                            /declare:\s*pick\s+\d+\s+enemy\s+unit/i.test(effectLower) ||
                            /pick\s+an?\s+enemy\s+unit\s+to\s+be\s+the\s+target/i.test(effectLower) ||
                            /pick\s+an?\s+enemy\s+unit\s+in\s+combat/i.test(effectLower);

  if (ability.phase === 'passive') {
    targetingType = 'global_passive';
    netEffects.push("Passive Ability: Registers as a persistent background aura; does not prompt target unit clicks.");
  } else if (declaresEnemyUnit || (isEnemyTarget && !isFriendlyTarget)) {
    targetingType = 'enemy';
    netEffects.push("Enemy Targeting: Click resolves as an enemy-targeted debuff or attack (log only action, no friendly unit selection).");
  } else if (isFriendlyTarget) {
    if (
      effectLower.includes('each friendly unit') || 
      effectLower.includes('all friendly units') ||
      effectLower.includes('friendly units wholly within') ||
      effectLower.includes('friendly units while they are wholly within') ||
      effectLower.includes('attacks that target friendly units')
    ) {
      targetingType = 'multi_friendly';
      netEffects.push("Global Targeting: Click triggers application to ALL valid friendly units in the active cohort.");
    } else {
      targetingType = 'single_friendly';
      netEffects.push("Targeted Application: Click prompts a modal to select exactly 1 friendly unit to receive the parsed buffs.");
    }
  } else if (effectLower.includes('this unit') || effectLower.includes('self') || effectLower.includes('the unit with this ability')) {
    targetingType = 'self';
    netEffects.push("Self-Targeting: Click applies the parsed modifiers exclusively to the acting parent unit.");
  } else {
    if (allowedStats.length > 0) {
      targetingType = 'single_friendly';
      netEffects.push("Default Targeting: Click prompts the user to choose 1 target friendly unit.");
    } else {
      targetingType = 'unknown';
      netEffects.push("Log Only Action: No direct stat modifiers parsed. Triggers a clean game action text log upon click.");
    }
  }

  // 4. Parse Influenced Stats WITH numerical modifier count
  const statsWithModifiers: { stat: string; mod: string }[] = [];
  let influencedStats: string[] = [];

  const extractModifierValue = (statName: string, keywords: string[]): string | null => {
    const hasStatKeyword = keywords.some(kw => effectLower.includes(kw));
    if (!hasStatKeyword) return null;

    if (statName === 'Save') {
      const isRollComparison = effectLower.includes('equals or exceeds') || effectLower.includes('equal to or exceed') || effectLower.includes('equals or exceed');
      if (isRollComparison) {
        return null;
      }
    }

    if (effectLower.includes('double its move') || effectLower.includes('double its movement') || nameLower.includes('speed of hysh')) {
      return "Double";
    }
    if (effectLower.includes('subtract 3') || effectLower.includes('-3') || effectLower.includes('subtracts 3')) {
      return "-3";
    }
    if (effectLower.includes('subtract 2') || effectLower.includes('-2') || effectLower.includes('subtracts 2')) {
      return "-2";
    }
    if (effectLower.includes('subtract 1') || effectLower.includes('-1') || effectLower.includes('subtracts 1')) {
      return "-1";
    }
    if (effectLower.includes('add 3') || effectLower.includes('+3') || effectLower.includes('by 3')) {
      return "+3";
    }
    if (effectLower.includes('add 2 to') || effectLower.includes('+2') || (isRelentlessDiscipline && statName === 'Movement')) {
      return "+2";
    }
    if (effectLower.includes('add 1 to') || effectLower.includes('+1') || effectLower.includes('add 1') || effectLower.includes('by 1') || isRelentlessDiscipline) {
      return "+1";
    }
    return "+1"; // standard fallback
  };

  const statMapping = {
    'Attacks': ['attacks characteristic', 'add 1 to the attacks', 'modify attacks', 'attack characteristic'],
    'Hits': ['hit roll', 'hit rolls', 'add 1 to hit', 'add 1 to the hit', 'unmodified hit'],
    'Wounds': ['wound roll', 'wound rolls', 'add 1 to wound', 'add 1 to the wound', 'unmodified wound'],
    'Save': ['save roll', 'save characteristic', 'add 1 to save', 'add 1 to the save'],
    'Ward': ['ward roll', 'ward characteristic', 'add 1 to ward', 'add 1 to the ward', 'ward save', 'has a ward', 'ward (', 'ward of'],
    'Rend': ['rend characteristic', 'add 1 to rend', 'add 1 to the rend'],
    'Damage': ['damage characteristic', 'add 1 to damage', 'add 1 to the damage'],
    'Movement': ['move characteristic', 'movement characteristic', 'move characteristic of', 'double its move', 'move of', 'movement characteristic of'],
    'Charge': ['charge roll', 'charge rolls', 'add 1 to charge', 'charge characteristic', 're-roll charge'],
    'Control': ['control characteristic', 'objective control', 'control value', 'control of', 'controlling that objective', 'control scores'],
    'Heal': ['heal', 'return slain', 'reanimate', 'restore', 'heal d3', 'heal 1'],
    'Mortal Wounds': ['mortal wound', 'mortal wounds'],
    'Strike-Last': ['strike-last', 'strike last'],
    'Strike-First': ['strike-first', 'strike first']
  };

  Object.entries(statMapping).forEach(([statName, keywords]) => {
    const mod = extractModifierValue(statName, keywords);
    if (mod) {
      statsWithModifiers.push({ stat: statName, mod });
      influencedStats.push(statName);
    }
  });

  // 5. Determine Applied Phase
  let appliedPhase: string = ability.phase;

  if (ability.phase === 'passive') {
    if (influencedStats.some(s => ['Hits', 'Wounds', 'Attacks', 'Rend', 'Damage', 'Strike-Last', 'Strike-First'].includes(s))) {
      appliedPhase = 'Combat / Shooting Phases';
    } else if (influencedStats.some(s => ['Save', 'Ward'].includes(s))) {
      appliedPhase = 'Combat / Shooting (Defensive)';
    } else if (influencedStats.some(s => ['Movement', 'Charge'].includes(s))) {
      appliedPhase = 'Movement / Charge Phases';
    } else {
      appliedPhase = 'Passive (Continuous)';
    }
  } else if (ability.phase === 'hero' || ability.phase === 'start' || (ability.phase as string) === 'any') {
    if (influencedStats.some(s => ['Hits', 'Wounds', 'Attacks', 'Rend', 'Damage', 'Strike-Last', 'Strike-First'].includes(s))) {
      appliedPhase = 'Combat Phase';
    } else if (influencedStats.some(s => ['Save', 'Ward'].includes(s))) {
      appliedPhase = 'Combat / Shooting (Defensive)';
    } else if (influencedStats.some(s => ['Movement', 'Charge'].includes(s))) {
      appliedPhase = 'Movement / Charge Phases';
    }
  }

  // 6. Resolve Targeting specifications
  const targetSpecifications: string[] = [];
  const matchesSpecificUnits: string[] = [];

  if (faction && faction.units) {
    faction.units.forEach(u => {
      if (u.name && u.name.length > 4 && effectLower.includes(u.name.toLowerCase())) {
        matchesSpecificUnits.push(u.name);
      }
    });
  }

  const targetsEnemy = 
    /pick\s+(an|1|any|a|visible)\s+enemy/i.test(effectLower) ||
    /select\s+(an|1|any|a|visible)\s+enemy/i.test(effectLower) ||
    /choose\s+(an|1|any|a|visible)\s+enemy/i.test(effectLower);

  const targetsSelf = 
    !targetsEnemy &&
    (targetingType === 'self' || 
    effectLower.includes('this unit') || 
    effectLower.includes('self') || 
    effectLower.includes('unit with this ability')) &&
    !effectLower.includes('cannot pick this unit') &&
    !effectLower.includes('you cannot pick this unit');

  const isProximityToGeneral = /(?:within|wholly within)\s+\d+["']?\s+of\s+(?:your\s+general|friendly\s+general|a\s+friendly\s+general|the\s+general|a\s+general)/i.test(effectLower);

  const targetsHeroGeneral = 
    !targetsEnemy &&
    !isProximityToGeneral &&
    (effectLower.includes('friendly hero') || 
    effectLower.includes('friendly general') || 
    effectLower.includes('is a hero') || 
    effectLower.includes('must be a hero') || 
    effectLower.includes('your general') || 
    effectLower.includes('general only') ||
    effectLower.includes('hero only') ||
    ability.name.toLowerCase().includes('hero') || 
    ability.name.toLowerCase().includes('general')) &&
    !effectLower.includes('cannot pick your general') &&
    !effectLower.includes('you cannot pick your general') &&
    !effectLower.includes('cannot pick this unit') &&
    !effectLower.includes('you cannot pick this unit');

  const targetsNotHeroGeneral = 
    !targetsEnemy &&
    (effectLower.includes('cannot be a hero') || 
    effectLower.includes('cannot be a general') || 
    effectLower.includes('excluding heroes') || 
    effectLower.includes('excluding hero') || 
    effectLower.includes('excluding general') || 
    effectLower.includes('cannot pick your general') ||
    effectLower.includes('you cannot pick your general') ||
    effectLower.includes('cannot pick this unit') ||
    effectLower.includes('you cannot pick this unit') ||
    effectLower.includes('is not a hero') || 
    effectLower.includes('not a hero') ||
    effectLower.includes('not a general'));

  const targetsFriendlyUnitSingle = 
    !targetsEnemy &&
    (effectLower.includes('friendly unit') || effectLower.includes('friendly model')) && 
    !effectLower.includes('each friendly unit') && 
    !effectLower.includes('all friendly units') &&
    !effectLower.includes('friendly units wholly within') &&
    !effectLower.includes('friendly units while they are wholly within') &&
    !effectLower.includes('attacks that target friendly units');

  const targetsFriendlyUnitsPlural = 
    !targetsEnemy &&
    (effectLower.includes('each friendly unit') || 
    effectLower.includes('all friendly units') || 
    effectLower.includes('friendly units wholly within') ||
    effectLower.includes('friendly units while they are wholly within') ||
    effectLower.includes('attacks that target friendly units'));

  if (targetsSelf) {
    let resolvedParentName = "This Unit";
    if (faction && faction.units) {
      const parent = faction.units.find(u => u.abilities.some(a => a.id === ability.id));
      if (parent) {
        resolvedParentName = parent.name;
      }
    }
    targetSpecifications.push(`Self: [${resolvedParentName}]`);
  }

  if (matchesSpecificUnits.length > 0) {
    targetSpecifications.push(`Specific Unit(s): [${matchesSpecificUnits.join(', ')}]`);
  }

  if (targetsHeroGeneral) {
    targetSpecifications.push("Hero / General Only");
  }

  if (targetsNotHeroGeneral) {
    targetSpecifications.push("Not Hero / General");
  }

  if (targetsEnemy) {
    targetSpecifications.push("Enemy Unit");
  }

  if (targetsFriendlyUnitSingle && !targetsSelf && !targetsHeroGeneral) {
    targetSpecifications.push("Friendly Unit");
  }

  if (targetsFriendlyUnitsPlural) {
    targetSpecifications.push("Friendly Units (Multiple)");
  }

  if (targetSpecifications.length === 0) {
    if (ability.phase === 'passive') {
      targetSpecifications.push("Passive / Global Aura");
    } else {
      targetSpecifications.push("Friendly Unit");
    }
  }

  // 7. Diagnostics (Stripped of targeting fields as requested)
  const heroOrGeneralOnly = targetsHeroGeneral;
  const isPassive = 
    ability.phase === 'passive' || 
    effectLower.includes('passive') || 
    !!ability.timing?.toLowerCase().includes('passive');

  const spatialKeywords = [
    'wholly within', 'while within', ' if ', 'unless', 'provided that', 'visible', 'if there are no',
    'range of', 'in combat', 'not in combat', 'contesting', 'do not control', 'target a damaged unit'
  ];
  let hasSpatialOrConditionalCheck = 
    spatialKeywords.some(keyword => effectLower.includes(keyword)) ||
    /within\s+\d+["']/i.test(effectLower);

  // Exclude abilities whose only conditional/spatial check is a charge condition,
  // as those are automatically resolved based on the unit's active charge state (uState.charged)
  const isChargeCondition = effectLower.includes('charged in the same turn') || effectLower.includes('has charged') || effectLower.includes('charged this phase');
  if (isChargeCondition && hasSpatialOrConditionalCheck) {
    const hasOtherSpatialCheck = 
      spatialKeywords.filter(kw => kw !== ' if ').some(keyword => effectLower.includes(keyword)) ||
      /within\s+\d+["']/i.test(effectLower);
    if (!hasOtherSpatialCheck) {
      hasSpatialOrConditionalCheck = false;
    }
  }
  
  let conditionalCheckDescription: string | null = null;
  if (hasSpatialOrConditionalCheck) {
    const matched = spatialKeywords.find(kw => effectLower.includes(kw)) || effectLower.match(/within\s+\d+["']/i)?.[0];
    conditionalCheckDescription = `Requires distance/conditional check ("${matched}") prior to application.`;
  }

  const externalKeywordsMap = {
    'mortal wound': 'Mortal Wounds Inflicted',
    'mortal wounds': 'Mortal Wounds Inflicted',
    'mortal damage': 'Mortal Wounds Inflicted',
    'strike-last': 'Strike-Last Status Effect',
    'strike last': 'Strike-Last Status Effect',
    'strike-first': 'Strike-First Status Effect',
    'strike first': 'Strike-First Status Effect',
    'fight-another-day': 'Fight Another Day Strategy',
    'fight another day': 'Fight Another Day Strategy',
    'retreat': 'Retreat Restriction/Benefit',
    'fly': 'Flying Movement Benefits',
    'flying': 'Flying Movement Benefits',
    'ward of': 'Fixed Ward Save Value',
    'slain': 'Slain Model Check',
    'remove that unit': 'Battlefield Repositioning (Teleport)',
    'remove from the battlefield': 'Battlefield Repositioning (Teleport)',
    'set up again': 'Battlefield Repositioning (Teleport)'
  };
  const externalTrackedKeywords = Object.entries(externalKeywordsMap)
    .filter(([key]) => effectLower.includes(key))
    .map(([_, label]) => label);

  const uniqueExternalTrackedKeywords = Array.from(new Set(externalTrackedKeywords));
  const isExternallyTracked = uniqueExternalTrackedKeywords.length > 0;

  let rollDiceCount: number | null = null;
  let rollDiceCheckText: string | null = null;

  if (effectLower.includes('roll 2 dice') || effectLower.includes('roll two dice') || effectLower.includes('roll 2d6') || effectLower.includes('roll of 2d6')) {
    rollDiceCount = 2;
    rollDiceCheckText = "Requires 2D6 dice roll comparison.";
  } else if (effectLower.includes('roll 3 dice') || effectLower.includes('roll three dice')) {
    rollDiceCount = 3;
    rollDiceCheckText = "Requires 3D6 dice roll comparison.";
  } else if (
    effectLower.includes('roll a dice') || 
    effectLower.includes('roll a die') || 
    effectLower.includes('roll a d6') || 
    effectLower.includes('roll d6') || 
    effectLower.includes('roll 1 dice') || 
    effectLower.includes('roll one dice') || 
    effectLower.includes('roll a dice for each') ||
    rollMatch
  ) {
    rollDiceCount = 1;
    rollDiceCheckText = "Requires D6 dice roll check.";
  }

  const isDefensive = 
    influencedStats.some(s => ['Save', 'Ward', 'Heal'].includes(s)) ||
    effectLower.includes('defensive') ||
    effectLower.includes('subtract 1 from hit') ||
    effectLower.includes('subtract 1 from the hit') ||
    effectLower.includes('subtract 1 from wound') ||
    effectLower.includes('subtract 1 from the wound') ||
    effectLower.includes('subtract 1 from attacks') ||
    effectLower.includes('subtract 1 from the attacks') ||
    effectLower.includes('cannot be targeted') ||
    effectLower.includes('ward save') ||
    effectLower.includes('ward of') ||
    effectLower.includes('shield') ||
    effectLower.includes('heal 1') ||
    effectLower.includes('heal d3') ||
    effectLower.includes('heal d6');

  // 8. Special Faction Rule Detection
  let isSpecialFactionRule = !!ability.isSpecialized;
  let specialFactionRuleExplanation = ability.isSpecialized 
    ? `🌟 SPECIALIZED RULE (${ability.name}): This ability is marked as specialized and bypasses standard automated dynamic text parsing rules.`
    : "Standard Global Business Rules: Evaluated dynamically by the general parser engine.";

  const isBloodRitesRule = abId === 'bloodrites' || nameLower.includes('blood rites');

  if (isRelentlessDiscipline) {
    isSpecialFactionRule = true;
    specialFactionRuleExplanation = "🌟 SPECIAL FACTION RULE (Ossiarch Bonereapers): Relentless Discipline points. Allows duplicate phase uses, custom move modifiers (+2\"), and custom defensive wards (5+) managed via specialized override modules in app/tracker/page.tsx.";
  } else if (isBloodRitesRule) {
    isSpecialFactionRule = true;
    specialFactionRuleExplanation = "🌟 SPECIAL FACTION RULE (Daughters of Khaine): Blood Rites. Adds a new cumulative passive ability per battle round. Toggled early via Murderous Epiphany.";
  } else if (nameLower.includes('eye of the gods') || abId.includes('eye-of-the-gods') || abId.includes('eyeofthegods')) {
    isSpecialFactionRule = true;
    specialFactionRuleExplanation = "🌟 SPECIAL FACTION RULE (Slaves to Darkness): Eye of the Gods Ascension. Spawns custom 2D6 tables to roll and programmatically apply permanent defensive blessings.";
  } else if (effectLower.includes('eye of the gods') || effectLower.includes('eye of the gods table') || effectLower.includes('roll on the eye of the gods')) {
    isSpecialFactionRule = true;
    specialFactionRuleExplanation = "🌟 SPECIAL FACTION RULE (Slaves to Darkness - Reference): Triggers or links to the custom 'Eye of the Gods' ascension table and blessing lookup tables.";
  } else if (nameLower.includes('facets of war') || abId.includes('facets-of-war') || abId.includes('facetsofwar') || nameLower.includes('shining company')) {
    isSpecialFactionRule = true;
    specialFactionRuleExplanation = "🌟 SPECIAL FACTION RULE (Lumineth Realm-Lords): Custom 'Facets of War' selections. Presents custom multi-choice panels on round initialization.";
  } else if (nameLower.includes('speed of hysh')) {
    isSpecialFactionRule = true;
    specialFactionRuleExplanation = "🌟 SPECIAL FACTION RULE (Lumineth Realm-Lords - Custom Spell): Programmatically doubles target move values instead of standard additions.";
  } else if (nameLower.includes('grave-sand shard') || abId.includes('gravesandshard')) {
    isSpecialFactionRule = true;
    specialFactionRuleExplanation = "🌟 SPECIAL FACTION RULE (Soulblight Gravelords): Grave-Sand Shard enhancement. Adds +1 to each Skeleton Legion roll when active.";
  }

  let customHandlingDetails = specialFactionRuleExplanation;
  let isCustomHandled = isSpecialFactionRule;

  if (ability.once === 'once-per-turn') {
    netEffects.push("Turn Lockout: Registering activation adds ability ID to 'usedAbilities' dictionary, blocking duplicate uses until the turn ends.");
  } else if (ability.once === 'once-per-battle') {
    netEffects.push("Battle Lockout: Registering activation flags the ability as exhausted, permanently blocking duplicate uses for the rest of the match.");
  }

  // 9. Special Overrides for Specific Complex Faction Rules (e.g. Eye of the Gods)
  let finalTargetSpecifications = [...targetSpecifications];
  let finalStatsWithModifiers = [...statsWithModifiers];
  let finalAppliedPhase = appliedPhase;
  let finalActivationPhase: string = ability.phase || 'passive';
  let finalRollDiceCount = rollDiceCount;
  let finalRollDiceCheckText = rollDiceCheckText;

  const isEyeOfTheGodsRule = nameLower.includes('eye of the gods') || abId.includes('eye-of-the-gods') || abId.includes('eyeofthegods');

  if (isEyeOfTheGodsRule) {
    // Override target to "Friendly Unit" (any friendly) rather than "Self"
    finalTargetSpecifications = ["Friendly Unit"];
    
    // Override phases to End of Turn (both activation and applied)
    finalActivationPhase = "End of Turn";
    finalAppliedPhase = "End of Turn";

    // Set 2D6 dice roll comparison challenge
    finalRollDiceCount = 2;
    finalRollDiceCheckText = "Requires 2D6 dice roll comparison.";

    // Override/Ensure IAS displays Wounds (-1), Rend (+1), Wards (6+), and Movement (Run +1)
    // -1 modifier to Wounds makes it render in RED as a defensive stat!
    finalStatsWithModifiers = [
      { stat: 'Wounds', mod: '-1' },
      { stat: 'Rend', mod: '+1' },
      { stat: 'Ward', mod: '6+' },
      { stat: 'Movement', mod: '+1 (Run)' }
    ];

    // Ensure influencedStats includes all of them
    if (!influencedStats.includes('Wounds')) influencedStats.push('Wounds');
    if (!influencedStats.includes('Rend')) influencedStats.push('Rend');
    if (!influencedStats.includes('Ward')) influencedStats.push('Ward');
    if (!influencedStats.includes('Movement')) influencedStats.push('Movement');
  }

  if (isBloodRitesRule) {
    const activeLevel = getActiveBloodRitesRound(gameState || null);
    
    finalTargetSpecifications = ["All Friendly Units"];
    finalAppliedPhase = "Start of Battle Round (Permanent)";
    finalActivationPhase = "Start of Battle Round";
    
    const cumulativeStats: { stat: string; mod: string }[] = [];
    if (activeLevel >= 1) cumulativeStats.push({ stat: 'Run', mod: '+1 (Round 1)' });
    if (activeLevel >= 2) cumulativeStats.push({ stat: 'Charge', mod: '+1 (Round 2)' });
    if (activeLevel >= 3) cumulativeStats.push({ stat: 'Hit', mod: '+1 (Round 3)' });
    if (activeLevel >= 4) cumulativeStats.push({ stat: 'Wound', mod: '+1 (Round 4)' });
    
    finalStatsWithModifiers = cumulativeStats;
    
    allowedStats = [];
    influencedStats = [];
    if (activeLevel >= 1) { allowedStats.push('move'); influencedStats.push('Run'); }
    if (activeLevel >= 2) { allowedStats.push('charge'); influencedStats.push('Charge'); }
    if (activeLevel >= 3) { allowedStats.push('hit'); influencedStats.push('Hit'); }
    if (activeLevel >= 4) { allowedStats.push('wound'); influencedStats.push('Wound'); }
  }

  // 10. Rules Engine Overrides for Heightened Reflexes and Overwhelming Heat
  let finalIsDefensive = isDefensive;
  let finalHasSpatialOrConditionalCheck = hasSpatialOrConditionalCheck;
  let finalConditionalCheckDescription = conditionalCheckDescription;

  if (abId === 'heightenedreflexes' || nameLower.includes('heightened reflexes') || nameLower.includes('heightened reflexs')) {
    finalHasSpatialOrConditionalCheck = true;
    finalConditionalCheckDescription = "Requires manual trigger check (Heightened Reflexes sequence).";
    finalIsDefensive = false;
  }

  if (abId === 'overwhelmingheat' || nameLower.includes('overwhelming heat')) {
    finalIsDefensive = false;
    targetingType = 'enemy';
    influencedStats = influencedStats.filter(s => s !== 'Save');
    finalStatsWithModifiers = finalStatsWithModifiers.filter(s => s.stat !== 'Save');
  }

  if (abId === 'overwhelminghordes' || nameLower.includes('overwhelming hordes')) {
    finalHasSpatialOrConditionalCheck = true;
    finalConditionalCheckDescription = "Verify that the defending target unit has fewer models than the attacking unit before applying +1 to wound rolls.";
  }

  if (abId === 'deathmarch' || nameLower.includes('deathmarch')) {
    allowedStats = ['move'];
    influencedStats = ['Movement', 'Control'];
    finalStatsWithModifiers = [
      { stat: 'Movement', mod: '+1"' },
      { stat: 'Control', mod: '+3' }
    ];
  }

  if (abId === 'stolenanimus' || nameLower.includes('stolen animus')) {
    allowedStats = [];
    influencedStats = ['Heal'];
    finalStatsWithModifiers = [
      { stat: 'Heal', mod: '2' }
    ];
  }

  if (abId === 'propelledbyhate' || nameLower.includes('propelled by hate')) {
    allowedStats = [];
    influencedStats = ['Charge'];
    finalStatsWithModifiers = [
      { stat: 'Charge', mod: 'Reroll' }
    ];
    targetingType = 'single_friendly';
  }

  if (abId === 'guardiansoftheking' || nameLower.includes('guardians of the king')) {
    finalHasSpatialOrConditionalCheck = true;
    finalConditionalCheckDescription = "Verify that your general is within this unit's combat range before applying Ward (5+).";
  }

  if (abId === 'kingofshamblingbones' || nameLower.includes('king of shambling bones')) {
    finalTargetSpecifications = ["Specific Unit(s): [Deathrattle Skeletons, Barrow Guard, Black Knights, Barrow Knights]"];
  }

  if (abId === 'auraofantiquity' || nameLower.includes('aura of antiquity')) {
    targetingType = 'enemy';
    finalTargetSpecifications = ["Enemy Unit"];
  }

  const isPermanent = 
    effectLower.includes('for the rest of the battle') || 
    effectLower.includes('for the rest of the game') || 
    effectLower.includes('permanent') || 
    effectLower.includes('remainder of the battle') ||
    isEyeOfTheGodsRule ||
    isBloodRitesRule;

  return {
    allowedStats,
    requiredRoll,
    targetingType,
    netEffects,
    isRelentlessDiscipline,
    heroOrGeneralOnly,
    isPassive,
    hasSpatialOrConditionalCheck: finalHasSpatialOrConditionalCheck,
    conditionalCheckDescription: finalConditionalCheckDescription,
    isExternallyTracked,
    externalTrackedKeywords: uniqueExternalTrackedKeywords,
    rollDiceCount: finalRollDiceCount,
    rollDiceCheckText: finalRollDiceCheckText,
    isCustomHandled,
    customHandlingDetails,
    influencedStats,
    appliedPhase: finalAppliedPhase,
    activationPhase: finalActivationPhase,
    isDefensive: finalIsDefensive,
    targetSpecifications: finalTargetSpecifications,
    statsWithModifiers: finalStatsWithModifiers,
    isSpecialFactionRule,
    specialFactionRuleExplanation,
    isPermanent
  };
}

