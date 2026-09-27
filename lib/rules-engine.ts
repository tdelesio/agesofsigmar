import { GameState, Faction, Ability, Unit } from '@/app/types';

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

  // 2. Check if it's a damaged-conditional rule (e.g. Cornered Rat: "While this unit is damaged")
  const isDamagedCondition = effectLower.includes('while this unit is damaged') || effectLower.includes('is damaged');
  if (isDamagedCondition) {
    if (!uState || (uState.currentWounds || 0) <= 0) {
      return []; // Unit is not damaged, condition not met
    }
  }

  // 3. Check if it's a charge-conditional rule
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

  // Helper for weapon matching
  let specificWeaponInRules: any = null;
  if (uRules && uRules.weapons) {
    specificWeaponInRules = uRules.weapons.find((w: any) => w.name && effectLower.includes(w.name.toLowerCase()));
  }

  const isMeleeWeaponTerm = effectLower.includes('melee weapons') || effectLower.includes('melee weapon');
  const isRangedWeaponTerm = effectLower.includes('ranged weapons') || effectLower.includes('ranged weapon') || effectLower.includes('shooting weapons');

  const checkWeaponMatch = (wName?: string): boolean => {
    if (specificWeaponInRules) {
      return !!wName && wName.toLowerCase() === specificWeaponInRules.name.toLowerCase();
    }
    if (!wName) return true;
    if (isMeleeWeaponTerm && uRules && uRules.weapons) {
      const matchW = uRules.weapons.find((w: any) => w.name.toLowerCase() === wName.toLowerCase());
      return matchW ? matchW.range === 'Melee' : true;
    }
    if (isRangedWeaponTerm && uRules && uRules.weapons) {
      const matchW = uRules.weapons.find((w: any) => w.name.toLowerCase() === wName.toLowerCase());
      return matchW ? matchW.range !== 'Melee' : true;
    }
    return true;
  };

  const parseNumModifier = (text: string, defaultVal: number = 1): number => {
    if (text.includes('add 3') || text.includes('+3') || text.includes('by 3')) return 3;
    if (text.includes('add 2') || text.includes('+2') || text.includes('by 2')) return 2;
    if (text.includes('subtract 3') || text.includes('-3')) return -3;
    if (text.includes('subtract 2') || text.includes('-2')) return -2;
    if (text.includes('subtract 1') || text.includes('-1') || text.includes('subtract')) return -1;
    if (text.includes('add 1') || text.includes('+1') || text.includes('by 1')) return 1;
    return defaultVal;
  };

  const getConditionLabel = (): string => {
    if (isDamagedCondition) return 'Damaged';
    if (hasChargeCondition) return 'Charged';
    return 'Passive';
  };

  // 4. Now check if it modifies this stat
  if (stat === 'rend') {
    if (effectLower.includes('rend characteristic') || effectLower.includes('to rend') || effectLower.includes('to the rend')) {
      if (checkWeaponMatch(weaponName)) {
        mods.push({
          modifier: parseNumModifier(effectLower, 1),
          description: `${ability.name} (${getConditionLabel()})`
        });
      }
    }
  } else if (stat === 'attacks') {
    if (effectLower.includes('attacks characteristic') || effectLower.includes('attacks') || effectLower.includes('attack characteristic')) {
      if (checkWeaponMatch(weaponName)) {
        mods.push({
          modifier: parseNumModifier(effectLower, 1),
          description: `${ability.name} (${getConditionLabel()})`
        });
      }
    }
  } else if (stat === 'wound') {
    if (effectLower.includes('add 1 to wound rolls') || effectLower.includes('add 1 to the wound rolls') || effectLower.includes('wound rolls')) {
      if (checkWeaponMatch(weaponName)) {
        mods.push({
          modifier: parseNumModifier(effectLower, 1),
          description: `${ability.name} (${getConditionLabel()})`
        });
      }
    }
  } else if (stat === 'hit') {
    if (effectLower.includes('add 1 to hit rolls') || effectLower.includes('add 1 to the hit rolls') || effectLower.includes('hit rolls')) {
      if (checkWeaponMatch(weaponName)) {
        mods.push({
          modifier: parseNumModifier(effectLower, 1),
          description: `${ability.name} (${getConditionLabel()})`
        });
      }
    }
  } else if (stat === 'save') {
    if (effectLower.includes('add 1 to save rolls') || effectLower.includes('add 1 to the save rolls') || effectLower.includes('save rolls')) {
      mods.push({
        modifier: parseNumModifier(effectLower, 1),
        description: `${ability.name} (${getConditionLabel()})`
      });
    }
  } else if (stat === 'ward') {
    if (effectLower.includes('add 1 to ward rolls') || effectLower.includes('add 1 to the ward rolls') || effectLower.includes('ward rolls')) {
      mods.push({
        modifier: parseNumModifier(effectLower, 1),
        description: `${ability.name} (${getConditionLabel()})`
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

        // Weapon Scoping check
        if (mod.weaponName) {
          if (!weaponName || !weaponName.toLowerCase().includes(mod.weaponName.toLowerCase())) {
            return;
          }
        }

        if (mod.weaponType && uRules && weaponName) {
          const wObj = uRules.weapons.find((w: any) => w.name && w.name.toLowerCase() === weaponName.toLowerCase());
          if (wObj) {
            const isMelee = wObj.range === 'Melee';
            if (mod.weaponType === 'melee' && !isMelee) return;
            if (mod.weaponType === 'ranged' && isMelee) return;
          }
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
    effectLower.includes('pick a ranged weapon') ||
    effectLower.includes('a friendly unit is armed with') ||
    /pick\s+(a|1|visible|friendly)\s+friendly\s+(?:[a-zA-Z-]+\s+){0,3}unit/i.test(effectLower) ||
    /select\s+(a|1)\s+friendly\s+(?:[a-zA-Z-]+\s+){0,3}unit/i.test(effectLower) ||
    /choose\s+(a|1)\s+friendly\s+(?:[a-zA-Z-]+\s+){0,3}unit/i.test(effectLower);

  const containsPluralExclusions = 
    effectLower.includes('all friendly units') || 
    effectLower.includes('every friendly unit') ||
    effectLower.includes('target friendly units'); // Flask of Shademist etc

  return matchesSingular && !containsPluralExclusions;
}

// Detects if an ability is weapon-scoped (e.g. "Warpforged Halberd", "Warplock Musket", "melee weapons", "ranged weapons")
export function detectWeaponScope(
  effectLower: string,
  parentUnit?: Unit | null,
  faction?: Faction | null,
  effectRaw?: string
): { scope: string | null; scopeType: 'specific' | 'melee' | 'ranged' | 'all' } {
  // 1. Check parent unit weapons first
  if (parentUnit && parentUnit.weapons) {
    for (const w of parentUnit.weapons) {
      if (w.name && w.name.length >= 3 && effectLower.includes(w.name.toLowerCase())) {
        return { scope: w.name, scopeType: 'specific' };
      }
    }
  }

  // 2. Check all faction units weapons
  if (faction && faction.units) {
    for (const u of faction.units) {
      for (const w of u.weapons) {
        if (w.name && w.name.length >= 4 && effectLower.includes(w.name.toLowerCase())) {
          return { scope: w.name, scopeType: 'specific' };
        }
      }
    }
  }

  // 3. Category matching
  if (effectLower.includes('melee weapon') || effectLower.includes('melee weapons')) {
    return { scope: 'Melee Weapons', scopeType: 'melee' };
  }
  if (
    effectLower.includes('ranged weapon') || 
    effectLower.includes('ranged weapons') || 
    effectLower.includes('shooting weapon') || 
    effectLower.includes('shooting weapons')
  ) {
    return { scope: 'Ranged Weapons', scopeType: 'ranged' };
  }

  // 4. Regex match for "of its <Weapon Name>" or "of their <Weapon Name>" in text
  const matchOfIts = (effectRaw || effectLower).match(/(?:characteristic of (?:its|their)|attacks of (?:its|their)|damage of (?:its|their)|rend of (?:its|their)|of (?:its|their)|armed with (?:a|an)?)\s+([A-Z][A-Za-z0-9' -]+?)(?:\s+this phase|\s+instead|\s+attack|\.|\,|$)/i);
  if (matchOfIts && matchOfIts[1]) {
    const rawName = matchOfIts[1].trim();
    if (!['melee weapons', 'ranged weapons', 'shooting weapons', 'friendly unit'].includes(rawName.toLowerCase()) && rawName.length >= 3) {
      return { scope: rawName, scopeType: 'specific' };
    }
  }

  return { scope: null, scopeType: 'all' };
}

// Detects if an ability grants or enhances a weapon ability (e.g. "Crit (Mortal)", "Shoot in Combat")
export function detectWeaponAbilityGrant(effectText: string): { grantedAbility: string; weaponScope: string | null } | null {
  const effectLower = (effectText || '').toLowerCase();
  
  const knownWeaponAbilities: { key: string; name: string }[] = [
    { key: 'crit (mortal)', name: 'Crit (Mortal)' },
    { key: 'crit (2 hits)', name: 'Crit (2 Hits)' },
    { key: 'crit (auto-wound)', name: 'Crit (Auto-wound)' },
    { key: 'shoot in combat', name: 'Shoot in Combat' },
    { key: 'companion', name: 'Companion' },
    { key: 'anti-charge (+1 rend)', name: 'Anti-charge (+1 Rend)' },
    { key: 'anti-charge', name: 'Anti-charge' },
    { key: 'anti-infantry (+1 rend)', name: 'Anti-infantry (+1 Rend)' },
    { key: 'anti-infantry', name: 'Anti-infantry' },
    { key: 'anti-cavalry (+1 rend)', name: 'Anti-cavalry (+1 Rend)' },
    { key: 'anti-cavalry', name: 'Anti-cavalry' },
    { key: 'anti-monster (+1 rend)', name: 'Anti-monster (+1 Rend)' },
    { key: 'anti-monster', name: 'Anti-monster' },
  ];

  for (const item of knownWeaponAbilities) {
    if (
      effectLower.includes(`has ${item.key}`) || 
      effectLower.includes(`have ${item.key}`) || 
      effectLower.includes(`gain ${item.key}`) || 
      effectLower.includes(`gains ${item.key}`) ||
      effectLower.includes(`weapon has ${item.key}`) || 
      effectLower.includes(`weapons have ${item.key}`) || 
      effectLower.includes(`that weapon has ${item.key}`)
    ) {
      let scope: string | null = null;
      if (effectLower.includes('ranged weapon') || effectLower.includes('ranged weapons')) scope = 'Ranged Weapons';
      else if (effectLower.includes('melee weapon') || effectLower.includes('melee weapons')) scope = 'Melee Weapons';
      return { grantedAbility: item.name, weaponScope: scope };
    }
  }

  // Critical hit multiple hits pattern (e.g. "scores D6 hits instead of 1", "scores 2 hits instead of 1")
  const critHitsMatch = effectLower.match(/critical\s+hit,\s*(?:that\s+attack\s+)?scores\s+([a-z0-9]+)\s+hits\s+instead\s+of\s+1/i);
  if (critHitsMatch) {
    const count = critHitsMatch[1].toUpperCase();
    let scope: string | null = null;
    const weaponMatch = effectLower.match(/(?:attack\s+made\s+with\s+(?:this\s+unit['’]s\s+)?|with\s+)([a-zA-Z\s'-]+?)(?:\s+scores|\s+weapons|\s+has|\s+is)/i);
    if (weaponMatch && weaponMatch[1]) {
      scope = weaponMatch[1].trim();
    }
    return { grantedAbility: `Crit (${count} Hits)`, weaponScope: scope };
  }

  // Critical hit mortal damage pattern
  if (effectLower.includes('scores a critical hit') && (effectLower.includes('mortal damage') || effectLower.includes('mortal wounds'))) {
    let scope: string | null = null;
    const weaponMatch = effectLower.match(/(?:attack\s+made\s+with\s+(?:this\s+unit['’]s\s+)?|with\s+)([a-zA-Z\s'-]+?)(?:\s+scores|\s+weapons|\s+has|\s+is)/i);
    if (weaponMatch && weaponMatch[1]) {
      scope = weaponMatch[1].trim();
    }
    return { grantedAbility: 'Crit (Mortal)', weaponScope: scope };
  }

  // Critical hit auto-wound pattern
  if (effectLower.includes('scores a critical hit') && effectLower.includes('automatically wound')) {
    let scope: string | null = null;
    const weaponMatch = effectLower.match(/(?:attack\s+made\s+with\s+(?:this\s+unit['’]s\s+)?|with\s+)([a-zA-Z\s'-]+?)(?:\s+scores|\s+weapons|\s+has|\s+is)/i);
    if (weaponMatch && weaponMatch[1]) {
      scope = weaponMatch[1].trim();
    }
    return { grantedAbility: 'Crit (Auto-wound)', weaponScope: scope };
  }

  // Regex fallback: "weapon has X", "weapons have X", "that weapon has X"
  const regexMatch = effectLower.match(/(?:weapon\s+has|weapons\s+have|that\s+weapon\s+has)\s+([a-z0-9\s()+,-]+?)(?:\s+this\s+phase|\s+until|\s+for|\s+while|\.|\n|$)/i);
  if (regexMatch && regexMatch[1] && !regexMatch[1].includes('instead') && regexMatch[1].trim().length < 30) {
    const raw = regexMatch[1].trim();
    const formatted = raw.charAt(0).toUpperCase() + raw.slice(1);
    let scope: string | null = null;
    if (effectLower.includes('ranged weapon') || effectLower.includes('ranged weapons')) scope = 'Ranged Weapons';
    else if (effectLower.includes('melee weapon') || effectLower.includes('melee weapons')) scope = 'Melee Weapons';
    return { grantedAbility: formatted, weaponScope: scope };
  }

  return null;
}

export interface AbilityChangeDetail {
  targetAbility: string;
  targetUnit?: string;
  changeText: string;
  fromValue?: string;
  toValue?: string;
}

// Detects if an ability modifies or enhances another ability (e.g. Endless Swarm of Rats modifying Seething Swarm)
export function detectAbilityChange(effectText: string): AbilityChangeDetail | null {
  const effect = effectText || '';

  // 1. Specific model return pattern:
  // "When a friendly Clanrats unit uses its 'Seething Swarm' ability, you can return D6 slain models to that unit instead of D3."
  const modelReturnMatch = effect.match(
    /when\s+(?:a\s+friendly\s+([A-Za-z -]+?)\s+unit|this\s+unit|your\s+general)\s+uses\s+(?:its|their|the)\s+['"‘“]([^'"’”]+)['"’”]\s+ability,\s*(?:you\s+can\s+)?return\s+([A-Za-z0-9]+)\s+slain\s+models(?:\s+to\s+that\s+unit)?\s+instead\s+of\s+([A-Za-z0-9]+)/i
  );
  if (modelReturnMatch) {
    const targetUnit = modelReturnMatch[1] ? modelReturnMatch[1].trim() : undefined;
    const targetAbility = modelReturnMatch[2].trim();
    const toVal = modelReturnMatch[3].trim();
    const fromVal = modelReturnMatch[4].trim();
    return {
      targetAbility,
      targetUnit,
      changeText: `${toVal} slain models instead of ${fromVal}`,
      fromValue: fromVal,
      toValue: toVal
    };
  }

  // 2. Generic "uses ... ability ... instead of ..." pattern:
  const genericMatch = effect.match(
    /(?:when|the\s+next\s+time)\s+(?:a\s+friendly\s+([A-Za-z -]+?)\s+unit|this\s+unit|your\s+general)\s+uses\s+(?:its|their|the)\s+['"‘“]([^'"’”]+)['"’”]\s+ability,\s*(?:you\s+can\s+)?(.+?)\s+instead\s+of\s+([^.]+)/i
  );
  if (genericMatch) {
    const targetUnit = genericMatch[1] ? genericMatch[1].trim() : undefined;
    const targetAbility = genericMatch[2].trim();
    const toText = genericMatch[3].trim();
    const fromText = genericMatch[4].trim();
    return {
      targetAbility,
      targetUnit,
      changeText: `${toText} instead of ${fromText}`,
      fromValue: fromText,
      toValue: toText
    };
  }

  // 3. Simple fallback if quotes surround ability name and "instead of" exists
  const fallbackMatch = effect.match(/['"‘“]([^'"’”]+)['"’”]\s+ability.+?(?:instead\s+of\s+([^.]+))/i);
  if (fallbackMatch) {
    return {
      targetAbility: fallbackMatch[1].trim(),
      changeText: `instead of ${fallbackMatch[2].trim()}`
    };
  }

  return null;
}

// Helper to determine if an ability is active/available in a given player turn ('me' vs 'opponent')
export function isAbilityActiveInTurn(ability: Ability, turn: 'me' | 'opponent', currentPhase?: string): boolean {
  const timingLower = (ability.timing || '').toLowerCase();
  
  // If timing explicitly mentions "Enemy" or reaction to opponent
  if (timingLower.includes('enemy') || timingLower.includes('reaction: opponent')) {
    return turn === 'opponent';
  }
  
  // If timing explicitly mentions "Your" or reaction to you
  if (timingLower.includes('your') || timingLower.includes('reaction: you')) {
    return turn === 'me';
  }
  
  // If timing explicitly mentions "Any" (e.g. "Any Combat Phase", "Any Charge Phase", "End of Any Turn")
  if (timingLower.includes('any')) {
    return true;
  }
  
  // Phase-specific defaults when timing doesn't explicitly state enemy/your/any:
  const phase = ability.phase;
  if (phase === 'combat') {
    // In AoS, both players fight during the combat phase
    return true;
  }
  if (phase === 'end' || phase === 'passive') {
    return true;
  }
  
  // For standard non-combat active phases (hero, movement, shooting, charge) without "Enemy" or "Any":
  // Defaults to player's turn ("me")
  return turn === 'me';
}

// Helper to look up active modifications that enhance or change a specific ability
export function getActiveAbilityModifications(
  gameState: GameState | null,
  faction: Faction | null,
  abilityName: string,
  unitName?: string
): { sourceAbilityName: string; changeText: string; fromValue?: string; toValue?: string; detail: AbilityChangeDetail }[] {
  if (!gameState || !faction) return [];

  const results: { sourceAbilityName: string; changeText: string; fromValue?: string; toValue?: string; detail: AbilityChangeDetail }[] = [];
  const targetAbilityLower = abilityName.toLowerCase();
  const unitNameLower = (unitName || '').toLowerCase();

  // Collect candidate active abilities from traits, regiment abilities, and enhancements
  const activeAbilities: Ability[] = [];

  // 1. Battle traits
  if (gameState.selectedBattleTraitId === 'all') {
    activeAbilities.push(...(faction.battleTraits || []));
  } else if (gameState.selectedBattleTraitId) {
    const trait = (faction.battleTraits || []).find(t => t.id === gameState.selectedBattleTraitId);
    if (trait) activeAbilities.push(trait);
  }

  // 2. Regiment abilities
  if (gameState.selectedRegimentAbilityId === 'all') {
    activeAbilities.push(...(faction.regimentAbilities || []));
  } else if (gameState.selectedRegimentAbilityId) {
    const reg = (faction.regimentAbilities || []).find(r => r.id === gameState.selectedRegimentAbilityId);
    if (reg) activeAbilities.push(reg);
  }

  // 3. Enhancements
  if (gameState.selectedEnhancementId) {
    const enh = (faction.enhancements || []).find(e => e.id === gameState.selectedEnhancementId);
    if (enh) activeAbilities.push(enh);
  }

  for (const ab of activeAbilities) {
    const detail = detectAbilityChange(ab.effect);
    if (detail && detail.targetAbility.toLowerCase() === targetAbilityLower) {
      if (detail.targetUnit && unitNameLower && !unitNameLower.includes(detail.targetUnit.toLowerCase())) {
        // Target unit constraint specified and doesn't match
        continue;
      }
      results.push({
        sourceAbilityName: ab.name,
        changeText: detail.changeText,
        fromValue: detail.fromValue,
        toValue: detail.toValue,
        detail
      });
    }
  }

  return results;
}

// Strips proximity / spatial condition clauses so reference units are not misclassified as targets
export function stripProximityClauses(text: string): string {
  if (!text) return '';
  return text
    // "while they are within 1" of any friendly Clanrats units"
    // "while within 3" of any friendly ..."
    // "while wholly within 12" of your general"
    // "within 1" of any friendly Clanrats units"
    // "wholly within 12" of your general"
    // "within 6" of this unit"
    .replace(/(?:while\s+(?:they\s+are\s+|this\s+unit\s+is\s+|your\s+general\s+is\s+)?(?:wholly\s+)?within|(?:wholly\s+)?within)\s+\d+["']?\s+(?:of|from)\s+(?:any\s+)?(?:friendly\s+|enemy\s+)?([a-zA-Z\s'-]+?)(?:\s+units?|\s+models?|\.|\,|$|\s+while)/gi, ' ')
    // "within this unit's combat range" or "within your general's combat range"
    .replace(/(?:within|wholly within)\s+(?:this\s+unit['’]s|your\s+general['’]s|[a-zA-Z\s'-]+?['’]s)\s+combat\s+range/gi, ' ');
}

// Shared Diagnostics Interface with Faction Customization assertions, Targeting & Stats
export interface ParsedRuleResult {
  allowedStats: ('attacks' | 'save' | 'ward' | 'move' | 'hit' | 'wound' | 'rend' | 'damage' | 'charge' | 'control' | 'weapon_ability')[];
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

  // Turn and Timing features
  activationTurn?: 'me' | 'opponent' | 'any';
  timingDetail?: string;

  // New features requested
  targetSpecifications: string[];
  statsWithModifiers: { stat: string; mod: string; weaponScope?: string }[];
  isSpecialFactionRule: boolean;
  specialFactionRuleExplanation: string;
  isPermanent: boolean;

  // Test Harness and Execution Flow integration
  isTargetSelectableFromRoster: boolean;
  targetSelectableReason: string;
  isBuffSelectable: boolean;
  buffSelectionOptions: string[];
  isTabletopEffect: boolean;
  tabletopEffectDetails: string | null;

  // Weapon-specific features requested
  requiresRangedWeapon?: boolean;
  weaponScope?: string | null;
  grantedWeaponAbilities?: string[];

  // Ability modifying another ability
  abilityChanges?: AbilityChangeDetail[];
}

export function analyzeAbilityRule(ability: Ability, faction?: Faction, gameState?: GameState | null): ParsedRuleResult {
  const effectText = ability.effect || '';
  const effectLower = effectText.toLowerCase();
  const nameLower = (ability.name || '').toLowerCase();
  const abId = (ability.id || '').toLowerCase();

  let parentUnit: Unit | null = null;
  if (faction && faction.units) {
    parentUnit = faction.units.find(u => u.abilities.some(a => a.id === ability.id)) || null;
  }

  const weaponScopeResult = detectWeaponScope(effectLower, parentUnit, faction, effectText);
  const weaponAbilityGrant = detectWeaponAbilityGrant(effectText);

  let allowedStats: ('attacks' | 'save' | 'ward' | 'move' | 'hit' | 'wound' | 'rend' | 'damage' | 'charge' | 'control' | 'weapon_ability')[] = [];
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
    if (weaponAbilityGrant) {
      allowedStats.push('weapon_ability');
      netEffects.push(`Weapon Ability Granted: Adds ${weaponAbilityGrant.grantedAbility} to ${weaponAbilityGrant.weaponScope || weaponScopeResult.scope || 'weapons'}.`);
    }

    if (
      effectLower.includes('attacks characteristic') || 
      effectLower.includes('add 1 to the attacks') || 
      effectLower.includes('modify attacks') || 
      effectLower.includes('attack characteristic') ||
      effectLower.includes('attacks characteristic of')
    ) {
      allowedStats.push('attacks');
      if (effectLower.includes('2d6 instead of d6') || effectLower.includes('attacks characteristic of 2d6')) {
        netEffects.push("Weapon Upgrade: Changes Attacks characteristic from D6 to 2D6.");
      } else {
        netEffects.push("Modifies weapon attacks characteristic (expires at end of active phase).");
      }
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
    const strippedProceduralWounds = effectLower
      .replace(/\(?\s*make\s+(?:a\s+)?wound\s+rolls?\s+(?:for\s+each\s+hit|for\s+each)?\s*\)?/gi, ' ')
      .replace(/\(?\s*make\s+(?:a\s+)?wound\s+rolls?\s*\)?/gi, ' ');
    if (
      strippedProceduralWounds.includes('wound roll') || 
      strippedProceduralWounds.includes('wound rolls') || 
      strippedProceduralWounds.includes('add 1 to wound') || 
      strippedProceduralWounds.includes('add 1 to the wound')
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
      effectLower.includes('add 1 to the damage') ||
      effectLower.includes('damage characteristic to') ||
      effectLower.includes('damage characteristic of')
    ) {
      allowedStats.push('damage');
      netEffects.push("Modifies weapon damage characteristic.");
    }
    if (
      effectLower.includes('control score') || 
      effectLower.includes('control scores') || 
      effectLower.includes('control characteristic') ||
      effectLower.includes('objective control') ||
      effectLower.includes('add the roll to the target\'s control')
    ) {
      allowedStats.push('control');
      netEffects.push("Modifies target unit's control score for contesting objectives.");
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

  const declaresEnemyUnit = /(?:declare:\s*)?(?:pick|select|choose|target)\s+(?:an?|1|any)?\s*(?:visible\s+)?enemy\s+(?:unit|model)/i.test(effectLower) || 
                            /declare:\s*pick\s+(?:an?|1|any)?\s*(?:visible\s+)?enemy/i.test(effectLower) ||
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
  const statsWithModifiers: { stat: string; mod: string; weaponScope?: string }[] = [];
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

    if (statName === 'Wounds') {
      const strippedForWounds = effectLower
        .replace(/\(?\s*make\s+(?:a\s+)?wound\s+rolls?\s+(?:for\s+each\s+hit|for\s+each)?\s*\)?/gi, ' ')
        .replace(/\(?\s*make\s+(?:a\s+)?wound\s+rolls?\s*\)?/gi, ' ');
      const hasRealWoundKeyword = keywords.some(kw => strippedForWounds.includes(kw));
      if (!hasRealWoundKeyword) return null;
    }

    // Check for hard characteristic set / override (e.g. "set the Damage characteristic of its Warplock Musket to 3")
    const setMatch = effectLower.match(/set\s+(?:the\s+)?(?:attacks|damage|save|rend|wound|hit|move|control)?\s*(?:characteristic)?.*?to\s+(\d+)/i) ||
                     effectLower.match(/(?:attacks|damage|save|rend|wound|hit|move|control)\s+characteristic.*?to\s+(\d+)/i);
    if (setMatch) {
      return `=${setMatch[1]}`;
    }

    // Check for pure Ward value grant: "has Ward (4+)", "Ward (5+)", "Ward of 6+", "has a Ward of 5+"
    if (statName === 'Ward') {
      const wardSetMatch = effectLower.match(/ward\s*(?:\((\d+)\+\)|\s+of\s+(\d+)\+)/i) ||
                           effectLower.match(/has\s+(?:a\s+)?ward\s*(?:\((\d+)\+\)|\s+of\s+(\d+)\+)/i);
      if (wardSetMatch) {
        const val = wardSetMatch[1] || wardSetMatch[2];
        return `${val}+`;
      }
    }

    if (effectLower.includes('2d6 instead of d6') || effectLower.includes('attacks characteristic of 2d6')) {
      return "2D6";
    }
    if (effectLower.includes('add the roll to') || effectLower.includes('add the roll')) {
      return "+Roll";
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
    'Damage': ['damage characteristic', 'add 1 to damage', 'add 1 to the damage', 'damage characteristic to', 'damage characteristic of'],
    'Movement': ['move characteristic', 'movement characteristic', 'move characteristic of', 'double its move', 'move of', 'movement characteristic of'],
    'Charge': ['charge roll', 'charge rolls', 'add 1 to charge', 'charge characteristic', 're-roll charge'],
    'Control': ['control characteristic', 'objective control', 'control value', 'control of', 'controlling that objective', 'control score', 'control scores'],
    'Heal': ['heal', 'return slain', 'reanimate', 'restore', 'heal d3', 'heal 1'],
    'Mortal Wounds': ['mortal wound', 'mortal wounds'],
    'Strike-Last': ['strike-last', 'strike last'],
    'Strike-First': ['strike-first', 'strike first']
  };

  Object.entries(statMapping).forEach(([statName, keywords]) => {
    const mod = extractModifierValue(statName, keywords);
    if (mod) {
      const scope = ['Attacks', 'Damage', 'Rend', 'Hits', 'Wounds'].includes(statName) ? (weaponScopeResult.scope || undefined) : undefined;
      statsWithModifiers.push({ stat: statName, mod, weaponScope: scope });
      influencedStats.push(statName);
    }
  });

  if (weaponAbilityGrant) {
    const scope = weaponAbilityGrant.weaponScope || weaponScopeResult.scope || undefined;
    statsWithModifiers.push({
      stat: 'Weapon Ability',
      mod: `+${weaponAbilityGrant.grantedAbility}`,
      weaponScope: scope
    });
    if (!influencedStats.includes('Weapon Ability')) {
      influencedStats.push('Weapon Ability');
    }
  }

  // 5. Determine Applied Phase
  let appliedPhase: string = ability.phase;

  if (ability.phase === 'passive') {
    if (influencedStats.some(s => ['Hits', 'Wounds', 'Attacks', 'Rend', 'Damage', 'Weapon Ability', 'Strike-Last', 'Strike-First'].includes(s))) {
      appliedPhase = 'Combat / Shooting Phases';
    } else if (influencedStats.some(s => ['Save', 'Ward'].includes(s))) {
      appliedPhase = 'Combat / Shooting (Defensive)';
    } else if (influencedStats.some(s => ['Movement', 'Charge'].includes(s))) {
      appliedPhase = 'Movement / Charge Phases';
    } else {
      appliedPhase = 'Passive (Continuous)';
    }
  } else if (ability.phase === 'hero' || ability.phase === 'start' || (ability.phase as string) === 'any') {
    if (influencedStats.some(s => ['Hits', 'Wounds', 'Attacks', 'Rend', 'Damage', 'Weapon Ability', 'Strike-Last', 'Strike-First'].includes(s))) {
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
  const strippedForTargeting = stripProximityClauses(effectLower);

  if (faction && faction.units) {
    faction.units.forEach(u => {
      if (u.name && u.name.length > 4 && strippedForTargeting.includes(u.name.toLowerCase())) {
        matchesSpecificUnits.push(u.name);
      }
    });
  }

  const declaresPickFriendly = 
    /(?:declare:\s*)?(?:pick|select|choose|target)\s+(?:an?|1|any)?\s*(?:visible\s+)?friendly\s+(?:unit|model)/i.test(effectLower) ||
    /declare:\s*pick\s+(?:a|1|any)?\s*friendly/i.test(effectLower) ||
    /pick\s+(?:an?|1|any|visible)\s+(?:friendly\s+)?(?:[a-zA-Z-]+\s+){0,3}unit/i.test(effectLower) ||
    /select\s+(?:an?|1|any|visible)\s+(?:friendly\s+)?(?:[a-zA-Z-]+\s+){0,3}unit/i.test(effectLower) ||
    isTargetingSingularFriendlyUnit(effectLower);

  const targetsEnemy = 
    /(?:declare:\s*)?(?:pick|select|choose|target)\s+(?:an?|1|any)?\s*(?:visible\s+)?enemy/i.test(effectLower) ||
    declaresEnemyUnit ||
    /pick\s+(an|1|any|a|visible)\s+enemy/i.test(effectLower) ||
    /select\s+(an|1|any|a|visible)\s+enemy/i.test(effectLower) ||
    /choose\s+(an|1|any|a|visible)\s+enemy/i.test(effectLower);

  const targetsSelf = 
    !targetsEnemy &&
    !declaresPickFriendly &&
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

  const uniqueSpecificUnits = Array.from(new Set(matchesSpecificUnits));
  if (uniqueSpecificUnits.length > 0) {
    targetSpecifications.push(`Specific Unit(s): [${uniqueSpecificUnits.join(', ')}]`);
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

  const requiresRangedWeapon = 
    effectLower.includes('pick a ranged weapon') || 
    effectLower.includes('ranged weapon a friendly unit is armed with') ||
    effectLower.includes('friendly unit armed with a ranged weapon') ||
    effectLower.includes('ranged weapon is armed with') ||
    effectLower.includes('friendly ranged unit');

  if (requiresRangedWeapon) {
    netEffects.push("Target Restriction: Requires a friendly unit armed with at least one ranged weapon.");
  }

  if (targetsFriendlyUnitSingle && !targetsSelf && !targetsHeroGeneral) {
    if (requiresRangedWeapon) {
      targetSpecifications.push("Friendly Unit with Ranged Weapon");
    } else {
      targetSpecifications.push("Friendly Unit");
    }
  }

  if (targetsFriendlyUnitsPlural) {
    targetSpecifications.push("Friendly Units (Multiple)");
  }

  if (targetSpecifications.length === 0) {
    if (ability.phase === 'passive') {
      targetSpecifications.push("Passive / Global Aura");
    } else if (requiresRangedWeapon) {
      targetSpecifications.push("Friendly Unit with Ranged Weapon");
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
    'range of', 'in combat', 'not in combat', 'contesting', 'do not control', 'target a damaged unit',
    'is damaged', 'while damaged', 'unit is damaged', 'while this unit is damaged'
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

  // Turn Scoping & Timing Details
  let activationTurn: 'me' | 'opponent' | 'any' = 'any';
  const timingLower = (ability.timing || '').toLowerCase();
  if (timingLower.includes('enemy') || timingLower.includes('reaction: opponent')) {
    activationTurn = 'opponent';
    const phaseMatch = ability.timing?.match(/enemy\s+([a-zA-Z]+)\s+phase/i);
    if (phaseMatch) {
      finalActivationPhase = `Enemy ${phaseMatch[1].charAt(0).toUpperCase() + phaseMatch[1].slice(1).toLowerCase()} Phase`;
    } else if (ability.phase && ability.phase !== 'passive') {
      finalActivationPhase = `Enemy ${ability.phase.charAt(0).toUpperCase() + ability.phase.slice(1).toLowerCase()} Phase`;
    }
  } else if (timingLower.includes('your') || timingLower.includes('reaction: you')) {
    activationTurn = 'me';
  } else if (timingLower.includes('any')) {
    activationTurn = 'any';
  } else if (['hero', 'movement', 'shooting', 'charge'].includes(ability.phase)) {
    activationTurn = 'me';
  } else {
    activationTurn = 'any';
  }

  // Detect Ability Change
  const abilityChangeDetail = detectAbilityChange(ability.effect);
  let abilityChanges: AbilityChangeDetail[] | undefined = undefined;
  if (abilityChangeDetail) {
    abilityChanges = [abilityChangeDetail];
    if (!influencedStats.includes('Ability Change')) {
      influencedStats.push('Ability Change');
    }
    if (!finalStatsWithModifiers.some(s => s.stat === 'Ability Change')) {
      finalStatsWithModifiers.push({
        stat: 'Ability Change',
        mod: abilityChangeDetail.changeText,
        weaponScope: abilityChangeDetail.targetAbility
      });
    }
  }

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

  if (abId === 'skryreconnections' || nameLower.includes('skryre connections') || nameLower.includes('skyrre connections')) {
    finalStatsWithModifiers = [{ stat: 'Attacks', mod: '2D6', weaponScope: 'Ratling Pistol' }];
    if (!influencedStats.includes('Attacks')) influencedStats.push('Attacks');
    finalTargetSpecifications = ["General Only"];
    netEffects.splice(0, netEffects.length, "Weapon Upgrade: Your general's Ratling Pistol has an Attacks characteristic of 2D6 instead of D6.");
  }

  if (abId === 'corneredrat' || nameLower.includes('cornered rat')) {
    finalHasSpatialOrConditionalCheck = true;
    finalConditionalCheckDescription = "Verify this unit is currently damaged before applying +3 attacks.";
    finalStatsWithModifiers = [{ stat: 'Attacks', mod: '+3', weaponScope: 'Warpforged Halberd' }];
    if (!influencedStats.includes('Attacks')) influencedStats.push('Attacks');
  }

  if (abId === 'moremorewarpenergy' || nameLower.includes('more-more warp energy')) {
    finalStatsWithModifiers = [{ stat: 'Damage', mod: '=3', weaponScope: 'Warplock Musket' }];
    if (!influencedStats.includes('Damage')) influencedStats.push('Damage');
    if (!allowedStats.includes('damage')) allowedStats.push('damage');
  }

  if (abId === 'unleashedwarpfury' || nameLower.includes('unleashed warp-fury')) {
    finalStatsWithModifiers = [{ stat: 'Attacks', mod: '+1', weaponScope: 'Melee Weapons' }];
    if (!influencedStats.includes('Attacks')) influencedStats.push('Attacks');
    if (!allowedStats.includes('attacks')) allowedStats.push('attacks');
  }

  if (abId === 'shockgauntlets' || nameLower === 'shock gauntlets' || nameLower.includes('shock gauntlets')) {
    targetingType = 'self';
    finalTargetSpecifications = parentUnit ? [`Self: [${parentUnit.name}]`] : ["Self: [Stormfiends]"];
    allowedStats = ['weapon_ability'];
    influencedStats = ['Weapon Ability'];
    finalStatsWithModifiers = [{ stat: 'Weapon Ability', mod: '+Crit (D6 Hits)', weaponScope: 'Shock Gauntlets' }];
  }

  if (abId === 'warpstonelacedbullets' || nameLower.includes('warpstone-laced bullets')) {
    targetingType = 'single_friendly';
    finalTargetSpecifications = ["Friendly Unit with Ranged Weapon"];
    allowedStats = ['weapon_ability'];
    influencedStats = ['Weapon Ability'];
    finalStatsWithModifiers = [{ stat: 'Weapon Ability', mod: '+Crit (Mortal)', weaponScope: 'Ranged Weapons' }];
  }

  if (abId === 'willofthehornedrat' || nameLower.includes('will of the horned rat')) {
    targetingType = 'single_friendly';
    finalTargetSpecifications = ["Friendly Unit"];
    allowedStats = ['control'];
    influencedStats = ['Control'];
    finalStatsWithModifiers = [{ stat: 'Control', mod: '+Roll' }];
  }

  if (abId === 'wither' || nameLower === 'wither') {
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

  // 11. Determine Selectability & Tabletop effects
  const isTargetEnemy = targetingType === 'enemy' || finalTargetSpecifications.some(t => t.toLowerCase().includes('enemy'));
  const isTargetSelf = targetingType === 'self' || finalTargetSpecifications.some(t => t.startsWith('Self:'));
  const isTargetMulti = targetingType === 'multi_friendly' || finalTargetSpecifications.some(t => t.includes('Multiple') || t.includes('Passive / Global Aura') || t.includes('All Friendly'));
  const isFixedGeneral = finalTargetSpecifications.includes('General Only') || finalTargetSpecifications.includes('Hero / General Only');

  let isTargetSelectableFromRoster = false;
  let targetSelectableReason = "No (Non-roster or fixed target)";

  if (isTargetEnemy) {
    isTargetSelectableFromRoster = false;
    targetSelectableReason = "No (Targets an enemy unit — resolved via tabletop play)";
  } else if (isTargetSelf) {
    isTargetSelectableFromRoster = false;
    targetSelectableReason = "No (Targets Self — automatically applies to acting parent unit)";
  } else if (isTargetMulti) {
    isTargetSelectableFromRoster = false;
    targetSelectableReason = "No (Applies army-wide to all friendly units)";
  } else if (isFixedGeneral) {
    isTargetSelectableFromRoster = false;
    targetSelectableReason = "No (Fixed target: Hero/General only)";
  } else if (targetingType === 'single_friendly' || finalTargetSpecifications.some(s => s.startsWith('Friendly Unit'))) {
    isTargetSelectableFromRoster = true;
    targetSelectableReason = (requiresRangedWeapon || finalTargetSpecifications.some(s => s.includes('Ranged Weapon')))
      ? "Yes (Prompts user to select 1 valid friendly target armed with a ranged weapon from roster)"
      : "Yes (Prompts user to select 1 valid friendly target from roster)";
  }

  // Influenced application stats selectability:
  // If > 1 option, user must pick one. If 1 option, it is not selectable (auto-applied).
  const isBuffSelectable = allowedStats.length > 1;
  const buffSelectionOptions = isBuffSelectable 
    ? allowedStats.map(s => {
        if (s === 'move' && isRelentlessDiscipline) return '+2" Move';
        if (s === 'ward' && isRelentlessDiscipline) return 'Ward (5+)';
        if (s === 'weapon_ability') return 'Grant Weapon Ability';
        return `Modify ${s.charAt(0).toUpperCase() + s.slice(1)}`;
      })
    : [];

  const isTabletopEffect = isExternallyTracked || 
    effectLower.includes('mortal damage') || 
    effectLower.includes('mortal wound') || 
    effectLower.includes('mortal wounds') || 
    effectLower.includes('heal') || 
    effectLower.includes('return slain') || 
    effectLower.includes('set up') ||
    effectLower.includes('teleport');

  let tabletopEffectDetails: string | null = null;
  if (isTabletopEffect) {
    if (effectLower.includes('mortal damage') || effectLower.includes('mortal wound') || effectLower.includes('mortal wounds')) {
      tabletopEffectDetails = "Mortal Damage / Tabletop Resolution";
    } else if (effectLower.includes('heal') || effectLower.includes('return slain')) {
      tabletopEffectDetails = "Heal / Return Slain Models";
    } else if (effectLower.includes('set up') || effectLower.includes('reserve') || effectLower.includes('teleport')) {
      tabletopEffectDetails = "Reserve / Board Deployment";
    } else {
      tabletopEffectDetails = "Tabletop Physical Interaction";
    }
  }

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
    isPermanent,
    isTargetSelectableFromRoster,
    targetSelectableReason,
    isBuffSelectable,
    buffSelectionOptions,
    isTabletopEffect,
    tabletopEffectDetails,
    requiresRangedWeapon,
    weaponScope: finalStatsWithModifiers.find(s => s.weaponScope)?.weaponScope || weaponScopeResult.scope,
    grantedWeaponAbilities: weaponAbilityGrant ? [weaponAbilityGrant.grantedAbility] : undefined,
    activationTurn,
    timingDetail: ability.timing,
    abilityChanges
  };
}

export interface FactionAnomaly {
  abilityId: string;
  abilityName: string;
  category: 'trait' | 'regiment' | 'enhancement' | 'unit';
  parentUnitName?: string;
  issueType: 'targeting' | 'modifier' | 'dice_roll' | 'phase';
  severity: 'warning' | 'info';
  message: string;
}

export function scanFactionForAnomalies(faction: Faction): FactionAnomaly[] {
  const anomalies: FactionAnomaly[] = [];
  if (!faction) return anomalies;

  const allAbilities: { ability: Ability; category: 'trait' | 'regiment' | 'enhancement' | 'unit'; parentUnitName?: string }[] = [];
  
  (faction.battleTraits || []).forEach(a => allAbilities.push({ ability: a, category: 'trait' }));
  (faction.regimentAbilities || []).forEach(a => allAbilities.push({ ability: a, category: 'regiment' }));
  (faction.enhancements || []).forEach(a => allAbilities.push({ ability: a, category: 'enhancement' }));
  (faction.units || []).forEach(u => {
    (u.abilities || []).forEach(a => allAbilities.push({ ability: a, category: 'unit', parentUnitName: u.name }));
  });

  allAbilities.forEach(({ ability, category, parentUnitName }) => {
    const analysis = analyzeAbilityRule(ability, faction);
    const effectLower = (ability.effect || '').toLowerCase();
    
    // Check 1: Dice roll mentioned but no DC parsed
    const mentionsRoll = effectLower.includes('roll a dice') || effectLower.includes('roll a d6') || effectLower.includes('make a casting roll');
    if (mentionsRoll && !analysis.requiredRoll && !analysis.rollDiceCheckText && !analysis.rollDiceCount) {
      anomalies.push({
        abilityId: ability.id,
        abilityName: ability.name,
        category,
        parentUnitName,
        issueType: 'dice_roll',
        severity: 'warning',
        message: `Mentions dice roll in rules text, but no specific threshold (e.g. 3+) was parsed.`
      });
    }

    // Check 2: Potential stat modification mentioned but no stats captured
    const mentionsStatChange = (
      effectLower.includes('add 1 to') || 
      effectLower.includes('add 2 to') || 
      effectLower.includes('add 3') || 
      effectLower.includes('subtract 1') || 
      effectLower.includes('subtract 2') ||
      effectLower.includes('set the ') ||
      effectLower.includes('weapon has ') ||
      effectLower.includes('weapons have ') ||
      effectLower.includes('that weapon has ')
    ) && (
      effectLower.includes('save') || 
      effectLower.includes('hit') || 
      effectLower.includes('wound') || 
      effectLower.includes('rend') || 
      effectLower.includes('damage') || 
      effectLower.includes('attacks') || 
      effectLower.includes('move') || 
      effectLower.includes('ward') ||
      effectLower.includes('control') ||
      effectLower.includes('crit') ||
      effectLower.includes('anti-')
    );
    if (mentionsStatChange && analysis.statsWithModifiers.length === 0 && analysis.allowedStats.length === 0) {
      anomalies.push({
        abilityId: ability.id,
        abilityName: ability.name,
        category,
        parentUnitName,
        issueType: 'modifier',
        severity: 'warning',
        message: `Mentions numeric stat adjustment in text, but no active stat modifiers were parsed.`
      });
    }

    // Check 3: Targeting ambiguity
    if (analysis.targetingType === 'unknown' && (!analysis.targetSpecifications || analysis.targetSpecifications.length === 0)) {
      anomalies.push({
        abilityId: ability.id,
        abilityName: ability.name,
        category,
        parentUnitName,
        issueType: 'targeting',
        severity: 'warning',
        message: `Targeting type could not be confidently determined from rules text.`
      });
    }
  });

  return anomalies;
}

