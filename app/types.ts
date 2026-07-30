export type GamePhase = 'start' | 'hero' | 'movement' | 'shooting' | 'charge' | 'combat' | 'end';

export interface Weapon {
  name: string;
  range: string; // "Melee" or string with inches e.g., "12\"" or "18\""
  attacks: string; // e.g. "3", "D6", "2D6"
  hit: number; // e.g. 3 (for 3+)
  wound: number; // e.g. 4 (for 4+)
  rend: number; // e.g. 1 (represents -1), 0 if none
  damage: string; // e.g. "2", "D3"
  abilities?: string; // e.g. "Crit (Mortal)", "Companion"
}

export type AbilityLimit = 'once-per-turn' | 'once-per-battle' | 'none';

export interface RuleAction {
  type: 'modify_stat' | 'apply_passive' | 'spawn_prompt' | 'heal';
  target: 'all_friendly' | 'selected_unit' | 'self';
  stat?: 'run' | 'charge' | 'hit' | 'wound' | 'rend' | 'save' | 'ward' | 'attacks' | 'damage';
  modifier?: number;
  description: string;
  condition?: {
    round?: number;
    phase?: string;
  };
}

export interface RuleDefinition {
  trigger: 'start_of_battle' | 'start_of_round' | 'start_of_phase' | 'unit_attack';
  actions: RuleAction[];
}

export interface Ability {
  id: string;
  name: string;
  effect: string;
  phase: GamePhase | 'passive';
  timing?: string; // e.g. "Your Movement Phase", "Enemy Hero Phase", "Any Combat Phase"
  once: AbilityLimit;
  passiveAppliedPhase?: GamePhase; // phase this passive is applied to
  isDefense?: boolean; // is this a defensive ability
  sourceType?: 'trait' | 'regiment' | 'enhancement' | 'unit'; // where did this ability come from
  ruleDefinition?: RuleDefinition; // declarative rule configurations
}

export interface Unit {
  id: string;
  name: string;
  move: number; // e.g., 5
  control: number; // e.g., 2
  health: number; // e.g., 4
  models?: number; // e.g., 5
  save: number; // e.g., 4 (for 4+)
  ward: number; // e.g., 6 (for 6+), 0 if none
  isHero: boolean;
  weapons: Weapon[];
  abilities: Ability[];
}

export interface Faction {
  id: string;
  name: string;
  spearheadName: string; // e.g. "Warglutt Marauders"
  battleTraits: Ability[];
  regimentAbilities: Ability[];
  enhancements: Ability[];
  units: Unit[];
  isTested?: boolean;
}

export interface UnitState {
  id: string; // instance ID (e.g., unitId + index if multiple)
  unitId: string; // key matching Unit.id
  currentWounds: number; // accumulated wounds
  isSlain: boolean;
  modelsCount?: number; // current number of models
  maxModels?: number; // max models
  // State for the active turn
  moved: boolean;
  ran: boolean;
  retreated: boolean;
  shot: boolean;
  charged: boolean;
  fought: boolean;
}

export interface AppliedModifier {
  id: string; // unique ID for tracking/removal
  unitId: string; // UnitState.id of target
  stat: 'attacks' | 'hit' | 'wound' | 'rend' | 'damage' | 'save' | 'ward' | 'move' | 'charge' | 'run';
  modifier: number;
  label: string;
  expiresRound: number; // round number when it expires (normally at the end of the round activated in)
  expiresPhase?: GamePhase;
}

export interface GameState {
  matchId?: string;
  round: number; // 1, 2, 3, 4
  activeTurn: 'me' | 'opponent'; // whose turn is it currently
  currentPhase: GamePhase;
  factionId: string;
  selectedBattleTraitId: string;
  selectedRegimentAbilityId: string;
  selectedEnhancementId: string;
  units: UnitState[];
  victoryPoints: number;
  usedAbilities: {
    [instanceAbilityId: string]: boolean; // key = "abilityId" -> used status
  };
  logs: string[];
  appliedModifiers?: AppliedModifier[];
}
