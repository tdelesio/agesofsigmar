import { GameState, Faction, Ability } from '@/app/types';

// Fetch active modifiers for a given stat based on current round/phase/selections
export function getActiveModifiers(
  gameState: GameState | null,
  faction: Faction | null,
  stat: string,
  unitId?: string
): { modifier: number; description: string }[] {
  if (!gameState || !faction) return [];
  const modifiers: { modifier: number; description: string }[] = [];

  const processAbility = (ability: Ability) => {
    if (ability.ruleDefinition) {
      ability.ruleDefinition.actions.forEach(action => {
        if (action.type === 'modify_stat' && action.stat === stat) {
          let match = true;
          if (action.condition) {
            if (action.condition.round) {
              // Blood rites are cumulative (keep all previous rounds)
              if (ability.id === 'bloodRites') {
                if (action.condition.round > gameState.round) {
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
  };

  // 1. Battle Traits
  if (gameState.selectedBattleTraitId === 'all') {
    faction.battleTraits.forEach(processAbility);
  } else {
    const trait = faction.battleTraits.find(t => t.id === gameState.selectedBattleTraitId);
    if (trait) processAbility(trait);
  }

  // 2. Regiment Ability
  const regiment = faction.regimentAbilities.find(r => r.id === gameState.selectedRegimentAbilityId);
  if (regiment) processAbility(regiment);

  // 3. Enhancement
  const enhancement = faction.enhancements.find(e => e.id === gameState.selectedEnhancementId);
  if (enhancement) processAbility(enhancement);

  // 4. Custom applied turn-based target modifiers
  if (unitId && gameState.appliedModifiers) {
    gameState.appliedModifiers.forEach(mod => {
      if (mod.unitId === unitId && mod.stat === stat) {
        modifiers.push({
          modifier: mod.modifier,
          description: mod.label
        });
      }
    });
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

  let modifiedNum = baseNum;
  const isTargetRoll = ['save', 'ward', 'hit', 'wound'].includes(statKey);
  
  if (isTargetRoll) {
    // Target rolls (Save 4+, Ward 6+). Positive modifier lowers required roll (makes it easier).
    modifiedNum = baseNum - totalMod;
    if (modifiedNum < 2) modifiedNum = 2; // Roll of 1 is always failure in AoS
  } else {
    // Standard scaling stats (Attacks, Move, Damage). Positive modifier increases the stat.
    modifiedNum = baseNum + totalMod;
    if (modifiedNum < 1) modifiedNum = 1; // Cap at minimum of 1
  }

  return { baseNum, modifiedNum, isNan: false };
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
    /pick\s+(a|1|visible|friendly)\s+friendly\s+unit/i.test(effectLower) ||
    /select\s+(a|1)\s+friendly\s+unit/i.test(effectLower) ||
    /choose\s+(a|1)\s+friendly\s+unit/i.test(effectLower);

  const containsPluralExclusions = 
    effectLower.includes('all friendly units') || 
    effectLower.includes('every friendly unit') ||
    effectLower.includes('target friendly units'); // Flask of Shademist etc

  return matchesSingular && !containsPluralExclusions;
}
