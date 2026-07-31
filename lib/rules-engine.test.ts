import { describe, test, expect } from 'vitest';
import { 
  calculateStatValue, 
  getBattleDamagedOverride, 
  isTargetingSingularFriendlyUnit,
  getActiveModifiers
} from './rules-engine';
import { GameState, Faction } from '@/app/types';

describe('AoS Companion Rules Engine', () => {

  describe('calculateStatValue: Target Roll Modifier Math', () => {
    test('Save rolls (inverse scaling roll math): base 4+ with +1 modifier lowers the required roll to 3+', () => {
      const { baseNum, modifiedNum } = calculateStatValue('4', 'save', 1);
      expect(baseNum).toBe(4);
      expect(modifiedNum).toBe(3);
    });

    test('Ward rolls (inverse scaling roll math): base 6+ with +1 modifier lowers the required roll to 5+', () => {
      const { baseNum, modifiedNum } = calculateStatValue('6', 'ward', 1);
      expect(baseNum).toBe(6);
      expect(modifiedNum).toBe(5);
    });

    test('Ward rolls: unit with no base ward (0) receiving a modifier treats base as 7 (7 - 1 = 6+)', () => {
      const { baseNum, modifiedNum } = calculateStatValue(0, 'ward', 1);
      expect(baseNum).toBe(0);
      expect(modifiedNum).toBe(6);
    });

    test('Ward rolls: unit with no base ward (0) receiving multiple modifiers (2) gets 5+ ward', () => {
      const { baseNum, modifiedNum } = calculateStatValue(0, 'ward', 2);
      expect(baseNum).toBe(0);
      expect(modifiedNum).toBe(5);
    });

    test('Target rolls cannot be modified below 2+ (Save rolls capped)', () => {
      const { baseNum, modifiedNum } = calculateStatValue('2', 'save', 2);
      expect(baseNum).toBe(2);
      expect(modifiedNum).toBe(2); // Capped at 2
    });

    test('Standard characteristics (direct scaling): base 2 Attacks with +1 modifier raises to 3', () => {
      const { baseNum, modifiedNum } = calculateStatValue('2', 'attacks', 1);
      expect(baseNum).toBe(2);
      expect(modifiedNum).toBe(3);
    });

    test('Standard characteristics (direct scaling): base 3 Damage with -1 modifier lowers to 2', () => {
      const { baseNum, modifiedNum } = calculateStatValue('3', 'damage', -1);
      expect(baseNum).toBe(3);
      expect(modifiedNum).toBe(2);
    });

    test('Standard characteristics capped at minimum of 1', () => {
      const { baseNum, modifiedNum } = calculateStatValue('1', 'damage', -3);
      expect(baseNum).toBe(1);
      expect(modifiedNum).toBe(1); // Capped at 1
    });

    test('Non-numeric characteristics return isNan = true', () => {
      const { isNan } = calculateStatValue('D3', 'damage', 1);
      expect(isNan).toBe(true);
    });
  });

  describe('getBattleDamagedOverride: monstrous dynamic degradation', () => {
    // Mock Faction rules and GameState to test Treelord's Battle Damaged
    const mockFaction: Faction = {
      id: 'sylvaneth',
      name: 'Sylvaneth',
      spearheadName: 'Sylvaneth Spearhead',
      battleTraits: [],
      regimentAbilities: [],
      enhancements: [],
      units: [
        {
          id: 'treelord',
          name: 'Treelord',
          isHero: true,
          health: 14,
          save: 3,
          control: 5,
          move: 5,
          models: 1,
          ward: 0,
          weapons: [
            {
              name: 'Massive Impaling Talons',
              range: 'Melee',
              attacks: '2',
              hit: 3,
              wound: 3,
              rend: 2,
              damage: '3'
            }
          ],
          abilities: [
            {
              id: 'battleDamaged',
              name: 'Battle Damaged',
              phase: 'passive',
              once: 'none',
              effect: 'While this unit has 10 or more damage points, the Attacks characteristic of its Massive Impaling Talons is 1.'
            }
          ]
        }
      ]
    };

    test('Unit healthy (0 current wounds): battle damaged override should be null', () => {
      const mockGameState: GameState = {
        round: 1,
        activeTurn: 'me',
        currentPhase: 'hero',
        factionId: 'sylvaneth',
        selectedBattleTraitId: 'all',
        selectedRegimentAbilityId: '',
        selectedEnhancementId: '',
        victoryPoints: 0,
        logs: [],
        usedAbilities: {},
        units: [
          {
            id: 'treelord_1',
            unitId: 'treelord',
            currentWounds: 0,
            isSlain: false,
            moved: false,
            ran: false,
            retreated: false,
            shot: false,
            charged: false,
            fought: false
          }
        ]
      };

      const overrideVal = getBattleDamagedOverride(
        mockGameState,
        mockFaction,
        'treelord_1',
        'attacks',
        'Massive Impaling Talons'
      );
      expect(overrideVal).toBeNull();
    });

    test('Unit heavily damaged (11 wounds >= 10 threshold): attacks of Massive Impaling Talons should degrade to 1', () => {
      const mockGameState: GameState = {
        round: 1,
        activeTurn: 'me',
        currentPhase: 'combat',
        factionId: 'sylvaneth',
        selectedBattleTraitId: 'all',
        selectedRegimentAbilityId: '',
        selectedEnhancementId: '',
        victoryPoints: 0,
        logs: [],
        usedAbilities: {},
        units: [
          {
            id: 'treelord_1',
            unitId: 'treelord',
            currentWounds: 11,
            isSlain: false,
            moved: false,
            ran: false,
            retreated: false,
            shot: false,
            charged: false,
            fought: false
          }
        ]
      };

      const overrideVal = getBattleDamagedOverride(
        mockGameState,
        mockFaction,
        'treelord_1',
        'attacks',
        'Massive Impaling Talons'
      );
      expect(overrideVal).toBe(1);
    });

    test('Unit damaged but other weapon requested: should return null (prevent accidental cross-contamination of other weapons)', () => {
      const mockGameState: GameState = {
        round: 1,
        activeTurn: 'me',
        currentPhase: 'combat',
        factionId: 'sylvaneth',
        selectedBattleTraitId: 'all',
        selectedRegimentAbilityId: '',
        selectedEnhancementId: '',
        victoryPoints: 0,
        logs: [],
        usedAbilities: {},
        units: [
          {
            id: 'treelord_1',
            unitId: 'treelord',
            currentWounds: 11,
            isSlain: false,
            moved: false,
            ran: false,
            retreated: false,
            shot: false,
            charged: false,
            fought: false
          }
        ]
      };

      const overrideVal = getBattleDamagedOverride(
        mockGameState,
        mockFaction,
        'treelord_1',
        'attacks',
        'Other Weapon Name'
      );
      expect(overrideVal).toBeNull();
    });
  });

  describe('isTargetingSingularFriendlyUnit: targeting rules parsing', () => {
    test('Singular phrases: "Pick a friendly unit" matches singular', () => {
      expect(isTargetingSingularFriendlyUnit('Pick a friendly unit that is within 12".')).toBe(true);
    });

    test('Singular phrases: "Pick a visible friendly unit" matches singular', () => {
      expect(isTargetingSingularFriendlyUnit('Pick a visible friendly unit that is within 18".')).toBe(true);
    });

    test('Singular phrases: "select 1 friendly unit" matches singular', () => {
      expect(isTargetingSingularFriendlyUnit('You can select 1 friendly unit to receive this benefit.')).toBe(true);
    });

    test('Plural global abilities: "All friendly units" does NOT match singular targeting', () => {
      expect(isTargetingSingularFriendlyUnit('All friendly units on the battlefield receive a +1 save.')).toBe(false);
    });

    test('Plural global abilities: "Flask of Shademist" (target friendly units) does NOT trigger unit selection overlays', () => {
      expect(isTargetingSingularFriendlyUnit('Subtract 1 from hit rolls for attacks that target friendly units.')).toBe(false);
    });
  });

  describe('getActiveModifiers & getDynamicChargeModifiers: charge-conditional modifiers', () => {
    test('Unit has charged: should apply Impaling Charge rend modifier to Cursed Lances', () => {
      const mockFaction: Faction = {
        id: 'slaves-to-darkness-bloodwind-legion',
        name: 'Slaves to Darkness',
        spearheadName: 'Bloodwind Legion',
        battleTraits: [],
        regimentAbilities: [],
        enhancements: [],
        units: [
          {
            id: 'chaos-knights',
            name: 'Chaos Knights',
            isHero: false,
            health: 3,
            save: 3,
            control: 1,
            move: 10,
            models: 5,
            ward: 0,
            weapons: [
              {
                name: 'Cursed Lances',
                range: 'Melee',
                attacks: '2',
                hit: 3,
                wound: 3,
                rend: 1,
                damage: '2'
              }
            ],
            abilities: [
              {
                id: 'impalingCharge',
                name: 'Impaling Charge',
                phase: 'passive',
                once: 'none',
                effect: 'Add 1 to the Rend characteristic of this unit\'s Cursed Lances if it charged in the same turn.'
              }
            ]
          }
        ]
      };

      const mockGameState: GameState = {
        round: 1,
        activeTurn: 'me',
        currentPhase: 'combat',
        factionId: 'slaves-to-darkness-bloodwind-legion',
        selectedBattleTraitId: 'all',
        selectedRegimentAbilityId: '',
        selectedEnhancementId: '',
        victoryPoints: 0,
        logs: [],
        usedAbilities: {},
        units: [
          {
            id: 'chaos_knights_1',
            unitId: 'chaos-knights',
            currentWounds: 0,
            isSlain: false,
            moved: true,
            ran: false,
            retreated: false,
            shot: false,
            charged: true, // Mark as charged!
            fought: false
          }
        ]
      };

      const mods = getActiveModifiers(mockGameState, mockFaction, 'rend', 'chaos_knights_1', 'Cursed Lances');
      expect(mods.length).toBe(1);
      expect(mods[0].modifier).toBe(1);
      expect(mods[0].description).toContain('Impaling Charge');
    });

    test('Unit did NOT charge: should NOT apply Impaling Charge rend modifier', () => {
      const mockFaction: Faction = {
        id: 'slaves-to-darkness-bloodwind-legion',
        name: 'Slaves to Darkness',
        spearheadName: 'Bloodwind Legion',
        battleTraits: [],
        regimentAbilities: [],
        enhancements: [],
        units: [
          {
            id: 'chaos-knights',
            name: 'Chaos Knights',
            isHero: false,
            health: 3,
            save: 3,
            control: 1,
            move: 10,
            models: 5,
            ward: 0,
            weapons: [
              {
                name: 'Cursed Lances',
                range: 'Melee',
                attacks: '2',
                hit: 3,
                wound: 3,
                rend: 1,
                damage: '2'
              }
            ],
            abilities: [
              {
                id: 'impalingCharge',
                name: 'Impaling Charge',
                phase: 'passive',
                once: 'none',
                effect: 'Add 1 to the Rend characteristic of this unit\'s Cursed Lances if it charged in the same turn.'
              }
            ]
          }
        ]
      };

      const mockGameState: GameState = {
        round: 1,
        activeTurn: 'me',
        currentPhase: 'combat',
        factionId: 'slaves-to-darkness-bloodwind-legion',
        selectedBattleTraitId: 'all',
        selectedRegimentAbilityId: '',
        selectedEnhancementId: '',
        victoryPoints: 0,
        logs: [],
        usedAbilities: {},
        units: [
          {
            id: 'chaos_knights_1',
            unitId: 'chaos-knights',
            currentWounds: 0,
            isSlain: false,
            moved: true,
            ran: false,
            retreated: false,
            shot: false,
            charged: false, // NOT charged
            fought: false
          }
        ]
      };

      const mods = getActiveModifiers(mockGameState, mockFaction, 'rend', 'chaos_knights_1', 'Cursed Lances');
      expect(mods.length).toBe(0);
    });
  });

});
