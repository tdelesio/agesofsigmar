import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { 
  calculateStatValue, 
  getBattleDamagedOverride, 
  isTargetingSingularFriendlyUnit,
  getActiveModifiers,
  analyzeAbilityRule,
  isAbilityActiveInTurn,
  detectAbilityChange,
  getActiveAbilityModifications
} from './rules-engine';
import { GameState, Faction, Ability } from '@/app/types';

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

    test('Ward rolls: unit with no base ward (0) receiving multiple modifiers (2) gets capped to +1 (6+ ward)', () => {
      const { baseNum, modifiedNum } = calculateStatValue(0, 'ward', 2);
      expect(baseNum).toBe(0);
      expect(modifiedNum).toBe(6); // Capped to +1 (6+ ward)
    });

    test('Save rolls: base 4+ with +2 modifier gets capped to +1 (resulting in 3+)', () => {
      const { baseNum, modifiedNum } = calculateStatValue('4', 'save', 2);
      expect(baseNum).toBe(4);
      expect(modifiedNum).toBe(3); // Capped to +1
    });

    test('Hit rolls: base 3+ with -2 modifier gets capped to -1 (resulting in 4+)', () => {
      const { baseNum, modifiedNum } = calculateStatValue('3', 'hit', -2);
      expect(baseNum).toBe(3);
      expect(modifiedNum).toBe(4); // Capped to -1
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

    test('Singular subtype phrases: "Pick a friendly Deathrattle unit" matches singular targeting', () => {
      expect(isTargetingSingularFriendlyUnit('Pick a friendly Deathrattle unit wholly within 12".')).toBe(true);
    });

    test('Singular subtype phrases: "Select 1 friendly Soulblight Gravelords unit" matches singular targeting', () => {
      expect(isTargetingSingularFriendlyUnit('Select 1 friendly Soulblight Gravelords unit to receive +1 to hit.')).toBe(true);
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

    test('Blessing of Nurgle defensive modifier is excluded from attacking wound modifiers list', () => {
      const mockFaction: Faction = {
        id: 'slaves-to-darkness-bloodwind-legion',
        name: 'Slaves to Darkness',
        spearheadName: 'Bloodwind Legion',
        battleTraits: [],
        regimentAbilities: [],
        enhancements: [],
        units: []
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
            id: 'chaos_lord_1',
            unitId: 'chaos-lord',
            currentWounds: 0,
            isSlain: false,
            moved: false,
            ran: false,
            retreated: false,
            shot: false,
            charged: false,
            fought: false
          }
        ],
        appliedModifiers: [
          {
            id: 'eye-of-gods-nurgle',
            unitId: 'chaos_lord_1',
            stat: 'wound',
            modifier: -1,
            label: 'Blessing of Nurgle (Eye of Gods)',
            expiresRound: 99
          }
        ]
      };

      const mods = getActiveModifiers(mockGameState, mockFaction, 'wound', 'chaos_lord_1');
      // Blessing of Nurgle should be excluded from offensive weapon wound modifier list because it is defensive!
      expect(mods.length).toBe(0);
    });

    test('Mark of Khorne: should apply +1 Rend to General (isHero) when they charged, but NOT when they did not charge, and NOT to other units', () => {
      const mockFaction: Faction = {
        id: 'slaves-to-darkness-bloodwind-legion',
        name: 'Slaves to Darkness',
        spearheadName: 'Bloodwind Legion',
        battleTraits: [],
        regimentAbilities: [],
        enhancements: [
          {
            id: 'markOfKhorne',
            name: 'Mark of Khorne',
            effect: 'Add 1 to the Rend characteristic of your general\'s melee weapons if they charged in the same turn.',
            phase: 'passive',
            timing: 'Passive',
            once: 'none'
          }
        ],
        units: [
          {
            id: 'chaos-lord',
            name: 'Chaos Lord',
            isHero: true,
            health: 6,
            save: 3,
            control: 2,
            move: 5,
            models: 1,
            ward: 0,
            weapons: [
              {
                name: 'Reaperblade',
                range: 'Melee',
                attacks: '5',
                hit: 3,
                wound: 3,
                rend: 1,
                damage: '2'
              }
            ],
            abilities: []
          },
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
            abilities: []
          }
        ]
      };

      // Case 1: General (Chaos Lord) charged
      const stateGenCharged: GameState = {
        round: 1,
        activeTurn: 'me',
        currentPhase: 'combat',
        factionId: 'slaves-to-darkness-bloodwind-legion',
        selectedBattleTraitId: '',
        selectedRegimentAbilityId: '',
        selectedEnhancementId: 'markOfKhorne',
        victoryPoints: 0,
        logs: [],
        usedAbilities: {},
        units: [
          {
            id: 'chaos_lord_1',
            unitId: 'chaos-lord',
            currentWounds: 0,
            isSlain: false,
            moved: false,
            ran: false,
            retreated: false,
            shot: false,
            charged: true,
            fought: false
          }
        ]
      };

      const modsGenCharged = getActiveModifiers(stateGenCharged, mockFaction, 'rend', 'chaos_lord_1', 'Reaperblade');
      expect(modsGenCharged.length).toBe(1);
      expect(modsGenCharged[0].modifier).toBe(1);
      expect(modsGenCharged[0].description).toBe('Mark of Khorne (Charged)');

      // Case 2: General (Chaos Lord) did not charge
      const stateGenNotCharged: GameState = {
        ...stateGenCharged,
        units: [
          {
            id: 'chaos_lord_1',
            unitId: 'chaos-lord',
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
      const modsGenNotCharged = getActiveModifiers(stateGenNotCharged, mockFaction, 'rend', 'chaos_lord_1', 'Reaperblade');
      expect(modsGenNotCharged.length).toBe(0);

      // Case 3: Non-General (Chaos Knights) charged
      const stateKnightsCharged: GameState = {
        round: 1,
        activeTurn: 'me',
        currentPhase: 'combat',
        factionId: 'slaves-to-darkness-bloodwind-legion',
        selectedBattleTraitId: '',
        selectedRegimentAbilityId: '',
        selectedEnhancementId: 'markOfKhorne',
        victoryPoints: 0,
        logs: [],
        usedAbilities: {},
        units: [
          {
            id: 'chaos_knights_1',
            unitId: 'chaos-knights',
            currentWounds: 0,
            isSlain: false,
            moved: false,
            ran: false,
            retreated: false,
            shot: false,
            charged: true,
            fought: false
          }
        ]
      };
      const modsKnightsCharged = getActiveModifiers(stateKnightsCharged, mockFaction, 'rend', 'chaos_knights_1', 'Cursed Lances');
      expect(modsKnightsCharged.length).toBe(0); // Only applies to general!
    });
  });

  describe('Faction Diagnostics: Rules & Targeting Safety Scan', () => {
    test('Verify all abilities in default-factions.json parse without crashes and flag target classification risks', () => {
      const filePath = path.resolve(__dirname, '../app/data/default-factions.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      const factions = data.factions || data;

      expect(factions.length).toBeGreaterThan(0);

      factions.forEach((faction: any) => {
        const checkAbility = (ab: any, source: string) => {
          let analysis;
          try {
            analysis = analyzeAbilityRule(ab, faction);
          } catch (err: any) {
            throw new Error(`CRASH on faction "${faction.name}" ability "${ab.name}" (${source}): ${err.message}`);
          }

          expect(analysis).toBeDefined();
          expect(Array.isArray(analysis.targetSpecifications)).toBe(true);

          // Check for dual-keyword classification risks
          const hasRoll = ab.effect.toLowerCase().includes('roll a dice') || /on\s+a\s+(\d+)\+/i.test(ab.effect);
          if (hasRoll && analysis.targetingType === 'single_friendly' && !ab.effect.toLowerCase().includes('friendly')) {
            console.warn(`[DIAGNOSTIC WARNING] Potential Hostile-to-Friendly Collision: Faction "${faction.name}" ability "${ab.name}" (${source}) has a roll check but is classified as friendly targeting!`);
          }
        };

        faction.battleTraits.forEach((t: any) => checkAbility(t, 'battleTrait'));
        faction.regimentAbilities.forEach((r: any) => checkAbility(r, 'regimentAbility'));
        faction.enhancements.forEach((e: any) => checkAbility(e, 'enhancement'));
        faction.units.forEach((u: any) => {
          u.abilities.forEach((a: any) => checkAbility(a, `unit:${u.name}`));
        });
      });
    });
  });

  describe('Specific User Fixes & Skaven Rule Audits', () => {
    test('Will of the Horned Rat targets a Friendly Unit, not Self', () => {
      const willOfTheHornedRat: Ability = {
        id: 'willOfTheHornedRat',
        name: 'Will of the Horned Rat',
        phase: 'hero',
        once: 'none',
        effect: 'Declare: Pick a friendly unit wholly within 13" of this unit to be the target.\n\nEffect: The target can immediately use an ability that normally requires a roll.'
      };
      const analysis = analyzeAbilityRule(willOfTheHornedRat);
      expect(analysis.targetSpecifications).toContain('Friendly Unit');
      expect(analysis.targetSpecifications).not.toContain('Self: [Grey Seer]');
      expect(analysis.targetingType).toBe('single_friendly');
    });

    test('Wither targets an Enemy Unit, not Self', () => {
      const wither: Ability = {
        id: 'wither',
        name: 'Wither',
        phase: 'hero',
        once: 'none',
        effect: 'Declare: Pick a visible enemy unit within 13" of this unit to be the target, then make a casting roll of 2D6.\n\nEffect: On a 6+, inflict D3 mortal damage on the target.'
      };
      const analysis = analyzeAbilityRule(wither);
      expect(analysis.targetSpecifications).toContain('Enemy Unit');
      expect(analysis.targetSpecifications).not.toContain('Self: [Grey Seer]');
      expect(analysis.targetingType).toBe('enemy');
    });

    test('Skryre Connections sets Attacks to 2D6 and targets General Only', () => {
      const skryreConnections: Ability = {
        id: 'skryreConnections',
        name: 'Skryre Connections',
        phase: 'shooting',
        once: 'none',
        effect: "Your general's Ratling Pistol has an Attacks characteristic of 2D6 instead of D6."
      };
      const analysis = analyzeAbilityRule(skryreConnections);
      expect(analysis.statsWithModifiers).toEqual([{ stat: 'Attacks', mod: '2D6', weaponScope: 'Ratling Pistol' }]);
      expect(analysis.targetSpecifications).toContain('General Only');
      expect(analysis.netEffects[0]).toContain('2D6 instead of D6');
    });

    test('Cornered Rat requires spatial check because unit is damaged and scopes to Warpforged Halberd', () => {
      const corneredRat: Ability = {
        id: 'corneredRat',
        name: 'Cornered Rat',
        phase: 'combat',
        once: 'none',
        effect: 'While this unit is damaged, add 3 to the Attacks characteristic of its Warpforged Halberd.'
      };
      const analysis = analyzeAbilityRule(corneredRat);
      expect(analysis.hasSpatialOrConditionalCheck).toBe(true);
      expect(analysis.statsWithModifiers).toEqual([{ stat: 'Attacks', mod: '+3', weaponScope: 'Warpforged Halberd' }]);
      expect(analysis.weaponScope).toBe('Warpforged Halberd');
    });

    test('Warpstone-Laced Bullets targets friendly unit with ranged weapon and grants Crit (Mortal)', () => {
      const warpstoneBullets: Ability = {
        id: 'warpstoneLacedBullets',
        name: 'Warpstone-Laced Bullets',
        phase: 'shooting',
        once: 'none',
        effect: 'Declare: Pick a ranged weapon a friendly unit is armed with.\n\nEffect: That weapon has Crit (Mortal) this phase.'
      };
      const analysis = analyzeAbilityRule(warpstoneBullets);
      expect(analysis.targetingType).toBe('single_friendly');
      expect(analysis.requiresRangedWeapon).toBe(true);
      expect(analysis.targetSpecifications).toContain('Friendly Unit with Ranged Weapon');
      expect(analysis.allowedStats).toContain('weapon_ability');
      expect(analysis.influencedStats).toContain('Weapon Ability');
      expect(analysis.grantedWeaponAbilities).toContain('Crit (Mortal)');
      expect(analysis.statsWithModifiers).toEqual([{ stat: 'Weapon Ability', mod: '+Crit (Mortal)', weaponScope: 'Ranged Weapons' }]);
    });

    test('More-More Warp Energy! scopes to Warplock Musket with Damage =3 override', () => {
      const moreMoreWarpEnergy: Ability = {
        id: 'moreMoreWarpEnergy',
        name: 'More-More Warp Energy!',
        phase: 'shooting',
        once: 'none',
        effect: 'Roll a dice. On a 2+, set the Damage characteristic of its Warplock Musket to 3 this phase. On a 1, inflict D3 mortal damage on this unit.'
      };
      const analysis = analyzeAbilityRule(moreMoreWarpEnergy);
      expect(analysis.statsWithModifiers).toEqual([{ stat: 'Damage', mod: '=3', weaponScope: 'Warplock Musket' }]);
      expect(analysis.weaponScope).toBe('Warplock Musket');
      expect(analysis.allowedStats).toContain('damage');
    });

    test('Unleashed Warp-Fury scopes to melee weapons with +1 Attacks', () => {
      const unleashedWarpFury: Ability = {
        id: 'unleashedWarpFury',
        name: 'Unleashed Warp-Fury',
        phase: 'combat',
        once: 'none',
        effect: "Inflict D3 mortal damage on this unit. Then, add 1 to the Attacks characteristic of its melee weapons this phase."
      };
      const analysis = analyzeAbilityRule(unleashedWarpFury);
      expect(analysis.statsWithModifiers).toEqual([{ stat: 'Attacks', mod: '+1', weaponScope: 'Melee Weapons' }]);
      expect(analysis.weaponScope).toBe('Melee Weapons');
      expect(analysis.allowedStats).toContain('attacks');
    });

    test('Rat Ogors unit has equipment notes configured in default-factions.json', () => {
      const filePath = path.resolve(__dirname, '../app/data/default-factions.json');
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const factions = data.factions || data;
      const skaven = factions.find((f: any) => f.id === 'skaven-gnawfeast-clawpack');
      expect(skaven).toBeDefined();
      const ratOgors = skaven.units.find((u: any) => u.id === 'ratOgors');
      expect(ratOgors).toBeDefined();
      expect(ratOgors.notes).toBe(
        'This unit has 2 Rat Ogors armed with Claws, Blades and Fangs, and 1 Rat Ogor armed with a Warpfire Gun and Claws, Blades and Fangs.'
      );
    });
  });

  describe('Enemy Turn Scoping & Reactive Timing Rules', () => {
    test('Always Three Clawsteps Ahead activates during opponent turn and not player turn', () => {
      const alwaysThreeClawsteps: Ability = {
        id: 'alwaysThreeClawstepsAhead',
        name: 'Always Three Clawsteps Ahead',
        phase: 'movement',
        timing: 'Once Per Phase, Enemy Movement Phase',
        once: 'once-per-turn',
        effect: 'Pick 1 friendly Skaven unit that is not in combat. That unit can make a normal move of up to D6".'
      };

      const analysis = analyzeAbilityRule(alwaysThreeClawsteps);
      expect(analysis.activationTurn).toBe('opponent');
      expect(analysis.activationPhase).toBe('Enemy Movement Phase');
      expect(analysis.timingDetail).toBe('Once Per Phase, Enemy Movement Phase');

      // Helper check
      expect(isAbilityActiveInTurn(alwaysThreeClawsteps, 'opponent', 'movement')).toBe(true);
      expect(isAbilityActiveInTurn(alwaysThreeClawsteps, 'me', 'movement')).toBe(false);
    });

    test('Friendly movement ability without Enemy in timing activates only on player turn', () => {
      const normalMovementAb: Ability = {
        id: 'swiftAdvance',
        name: 'Swift Advance',
        phase: 'movement',
        timing: 'Your Movement Phase',
        once: 'none',
        effect: 'Add 1 to run rolls for this unit.'
      };

      const analysis = analyzeAbilityRule(normalMovementAb);
      expect(analysis.activationTurn).toBe('me');
      expect(isAbilityActiveInTurn(normalMovementAb, 'me', 'movement')).toBe(true);
      expect(isAbilityActiveInTurn(normalMovementAb, 'opponent', 'movement')).toBe(false);
    });

    test('Combat and End phase abilities are active in both player and opponent turns', () => {
      const combatAb: Ability = {
        id: 'testFight',
        name: 'Test Fight',
        phase: 'combat',
        once: 'none',
        effect: 'Pick 1 friendly unit to fight.'
      };
      expect(isAbilityActiveInTurn(combatAb, 'me', 'combat')).toBe(true);
      expect(isAbilityActiveInTurn(combatAb, 'opponent', 'combat')).toBe(true);

      const endAb: Ability = {
        id: 'testEnd',
        name: 'Test End',
        phase: 'end',
        once: 'none',
        effect: 'Heal 1 wound allocated to this unit.'
      };
      expect(isAbilityActiveInTurn(endAb, 'me', 'end')).toBe(true);
      expect(isAbilityActiveInTurn(endAb, 'opponent', 'end')).toBe(true);
    });
  });

  describe('Ability-Modifying Rules: Endless Swarm of Rats & Seething Swarm', () => {
    test('detectAbilityChange extracts Seething Swarm buff from Endless Swarm of Rats', () => {
      const effectText = "When a friendly Clanrats unit uses its 'Seething Swarm' ability, you can return D6 slain models to that unit instead of D3.";
      const detail = detectAbilityChange(effectText);
      expect(detail).toBeDefined();
      expect(detail?.targetAbility).toBe('Seething Swarm');
      expect(detail?.targetUnit).toBe('Clanrats');
      expect(detail?.fromValue).toBe('D3');
      expect(detail?.toValue).toBe('D6');
      expect(detail?.changeText).toBe('D6 slain models instead of D3');
    });

    test('analyzeAbilityRule populates influencedStats and statsWithModifiers for Endless Swarm of Rats', () => {
      const endlessSwarm: Ability = {
        id: 'endlessSwarmOfRats',
        name: 'Endless Swarm of Rats',
        phase: 'passive',
        once: 'none',
        effect: "When a friendly Clanrats unit uses its 'Seething Swarm' ability, you can return D6 slain models to that unit instead of D3."
      };

      const analysis = analyzeAbilityRule(endlessSwarm);
      expect(analysis.influencedStats).toContain('Ability Change');
      expect(analysis.statsWithModifiers).toContainEqual({
        stat: 'Ability Change',
        mod: 'D6 slain models instead of D3',
        weaponScope: 'Seething Swarm'
      });
      expect(analysis.abilityChanges).toBeDefined();
      expect(analysis.abilityChanges![0].targetAbility).toBe('Seething Swarm');
      expect(analysis.abilityChanges![0].toValue).toBe('D6');
    });

    test('getActiveAbilityModifications links Endless Swarm of Rats to Seething Swarm on Clanrats', () => {
      const mockFaction: Faction = {
        id: 'skaven-warpspark-clawpack',
        name: 'Warpspark Clawpack',
        spearheadName: 'Warpspark Clawpack',
        battleTraits: [],
        regimentAbilities: [
          {
            id: 'endlessSwarmOfRats',
            name: 'Endless Swarm of Rats',
            phase: 'passive',
            once: 'none',
            effect: "When a friendly Clanrats unit uses its 'Seething Swarm' ability, you can return D6 slain models to that unit instead of D3."
          }
        ],
        enhancements: [],
        units: [
          {
            id: 'clanrats',
            name: 'Clanrats',
            models: 20,
            save: 5,
            ward: 0,
            move: 6,
            health: 1,
            control: 1,
            isHero: false,
            weapons: [],
            abilities: [
              {
                id: 'seethingSwarm',
                name: 'Seething Swarm',
                phase: 'end',
                timing: 'End of Any Turn',
                once: 'none',
                effect: 'You can return D3 slain models to this unit.'
              }
            ]
          }
        ]
      };

      const mockGameState: GameState = {
        factionId: 'skaven-warpspark-clawpack',
        selectedBattleTraitId: 'all',
        selectedRegimentAbilityId: 'endlessSwarmOfRats',
        selectedEnhancementId: '',
        round: 1,
        currentPhase: 'end',
        activeTurn: 'me',
        units: [],
        usedAbilities: {},
        victoryPoints: 0,
        opponentVictoryPoints: 0,
        logs: []
      };

      const mods = getActiveAbilityModifications(mockGameState, mockFaction, 'Seething Swarm', 'Clanrats');
      expect(mods.length).toBe(1);
      expect(mods[0].sourceAbilityName).toBe('Endless Swarm of Rats');
      expect(mods[0].fromValue).toBe('D3');
      expect(mods[0].toValue).toBe('D6');
      expect(mods[0].changeText).toBe('D6 slain models instead of D3');
    });
  });

  describe('Pure Ward Parsing & Spatial Reference Disambiguation', () => {
    const mockFaction: Faction = {
      id: 'skaven-warpspark-clawpack',
      name: 'Skaven',
      spearheadName: 'Warpspark Clawpack',
      battleTraits: [],
      regimentAbilities: [],
      enhancements: [],
      units: [
        {
          id: 'clawlordOnGnawBeast',
          name: 'Clawlord on Gnaw-beast',
          move: 9,
          control: 2,
          health: 7,
          models: 1,
          save: 4,
          ward: 6,
          isHero: true,
          weapons: [],
          abilities: []
        },
        {
          id: 'clanrats1',
          name: 'Clanrats',
          move: 6,
          control: 1,
          health: 1,
          models: 20,
          save: 5,
          ward: 0,
          isHero: false,
          weapons: [],
          abilities: []
        },
        {
          id: 'clanrats2',
          name: 'Clanrats',
          move: 6,
          control: 1,
          health: 1,
          models: 20,
          save: 5,
          ward: 0,
          isHero: false,
          weapons: [],
          abilities: []
        }
      ]
    };

    test('Skilled Manipulator parses pure Ward (4+) and designates target strictly as Hero / General Only', () => {
      const skilledManipulator: Ability = {
        id: 'skilledManipulator',
        name: 'Skilled Manipulator',
        effect: 'Your general has Ward (4+) while they are within 1" of any friendly Clanrats units.',
        phase: 'passive',
        timing: 'Passive',
        once: 'none'
      };

      const analysis = analyzeAbilityRule(skilledManipulator, mockFaction);

      // 1. Pure Ward (4+) instead of +1
      expect(analysis.influencedStats).toContain('Ward');
      const wardMod = analysis.statsWithModifiers.find(s => s.stat === 'Ward');
      expect(wardMod).toBeDefined();
      expect(wardMod?.mod).toBe('4+');

      // 2. Target Specification: Must be General only, Clanrats excluded because it is only a spatial check
      expect(analysis.targetSpecifications).toContain('Hero / General Only');
      expect(analysis.targetSpecifications.some(t => t.includes('Clanrats'))).toBe(false);
      expect(analysis.targetSpecifications.some(t => t.includes('Specific Unit(s)'))).toBe(false);

      // 3. Spatial check is recognized
      expect(analysis.hasSpatialOrConditionalCheck).toBe(true);
      expect(analysis.conditionalCheckDescription).toContain('within 1"');
    });

    test('Impenetrable Ranks with "add 1 to ward rolls" parses as +1', () => {
      const impenetrableRanks: Ability = {
        id: 'impenetrableRanks',
        name: 'Impenetrable Ranks',
        effect: 'Until the end of the phase, add 1 to ward rolls for that unit.',
        phase: 'passive',
        timing: 'Combat Phase',
        once: 'none'
      };

      const analysis = analyzeAbilityRule(impenetrableRanks, mockFaction);
      expect(analysis.influencedStats).toContain('Ward');
      const wardMod = analysis.statsWithModifiers.find(s => s.stat === 'Ward');
      expect(wardMod).toBeDefined();
      expect(wardMod?.mod).toBe('+1');
    });

    test('Cloak of Stitched Victories parses pure Ward 5+ for General', () => {
      const cloak: Ability = {
        id: 'cloakOfStitchedVictories',
        name: 'Cloak of Stitched Victories',
        effect: 'Your general has Ward (5+).',
        phase: 'passive',
        timing: 'Passive',
        once: 'none'
      };

      const analysis = analyzeAbilityRule(cloak, mockFaction);
      expect(analysis.influencedStats).toContain('Ward');
      const wardMod = analysis.statsWithModifiers.find(s => s.stat === 'Ward');
      expect(wardMod?.mod).toBe('5+');
      expect(analysis.targetSpecifications).toContain('Hero / General Only');
    });

    test('Empower Nadirite Weapons targets Mortek Guard and excludes general mentioned in proximity', () => {
      const bonereapersFaction: Faction = {
        id: 'ossiarch-bonereapers',
        name: 'Ossiarch Bonereapers',
        spearheadName: 'Kavalos Wing',
        battleTraits: [],
        regimentAbilities: [],
        enhancements: [],
        units: [
          {
            id: 'mortekGuard1',
            name: 'Mortek Guard',
            move: 4,
            control: 1,
            health: 1,
            models: 10,
            save: 4,
            ward: 6,
            isHero: false,
            weapons: [],
            abilities: []
          },
          {
            id: 'mortekGuard2',
            name: 'Mortek Guard',
            move: 4,
            control: 1,
            health: 1,
            models: 10,
            save: 4,
            ward: 6,
            isHero: false,
            weapons: [],
            abilities: []
          }
        ]
      };

      const empowerNadirite: Ability = {
        id: 'empowerNadiriteWeapons',
        name: 'Empower Nadirite Weapons',
        effect: 'Declare: Pick a visible friendly Mortek Guard unit wholly within 12" of your general, then make a casting roll of 2D6. Effect: On a 5+, until the start of your next turn, add 1 to the Rend characteristic of that unit’s melee weapons.',
        phase: 'hero',
        timing: 'Your Hero Phase',
        once: 'once-per-turn'
      };

      const analysis = analyzeAbilityRule(empowerNadirite, bonereapersFaction);
      // Mortek Guard is targeted (and deduplicated!)
      expect(analysis.targetSpecifications).toContain('Specific Unit(s): [Mortek Guard]');
      // General is purely proximity, not target
      expect(analysis.targetSpecifications).not.toContain('Hero / General Only');
    });
  });

  describe('Shock Gauntlets Weapon Ability & Stormfiends Notes', () => {
    test('Shock Gauntlets parses as Weapon Ability Crit (D6 Hits) without Wounds (+1)', () => {
      const filePath = path.resolve(__dirname, '../app/data/default-factions.json');
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const factions = data.factions || data;
      const skaven = factions.find((f: any) => f.id === 'skaven-warpspark-clawpack');
      const stormfiends = skaven.units.find((u: any) => u.id === 'stormfiends');
      const shockGauntletsAbility = stormfiends.abilities.find((a: any) => a.id === 'shockGauntlets');

      const analysis = analyzeAbilityRule(shockGauntletsAbility, skaven);

      // Must grant Weapon Ability: Crit (D6 Hits) scoped to Shock Gauntlets
      expect(analysis.grantedWeaponAbilities).toContain('Crit (D6 Hits)');
      expect(analysis.statsWithModifiers).toEqual([
        { stat: 'Weapon Ability', mod: '+Crit (D6 Hits)', weaponScope: 'Shock Gauntlets' }
      ]);
      expect(analysis.influencedStats).toEqual(['Weapon Ability']);
      expect(analysis.allowedStats).toContain('weapon_ability');

      // Crucially, "(make a wound roll for each hit)" must NOT trigger Wounds characteristic or roll modifier!
      expect(analysis.allowedStats).not.toContain('wound');
      expect(analysis.influencedStats).not.toContain('Wounds');
      expect(analysis.statsWithModifiers.some(s => s.stat === 'Wounds')).toBe(false);

      // Target specification
      expect(analysis.targetSpecifications).toContain('Self: [Stormfiends]');
    });

    test('Stormfiends unit has equipment notes and Shock Gauntlets weapon ability in default-factions.json', () => {
      const filePath = path.resolve(__dirname, '../app/data/default-factions.json');
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const factions = data.factions || data;
      const skaven = factions.find((f: any) => f.id === 'skaven-warpspark-clawpack');
      expect(skaven).toBeDefined();
      const stormfiends = skaven.units.find((u: any) => u.id === 'stormfiends');
      expect(stormfiends).toBeDefined();
      expect(stormfiends.notes).toBe(
        'This unit has 1 Stormfiend armed with Shock Gauntlets, 1 Stormfiend armed with Windlaunchers and Clubbing Blows, and 1 Stormfiend armed with Ratling Cannons and Clubbing Blows.'
      );

      const shockGauntletsWeapon = stormfiends.weapons.find((w: any) => w.name === 'Shock Gauntlets');
      expect(shockGauntletsWeapon).toBeDefined();
      expect(shockGauntletsWeapon.abilities).toBe('Crit (D6 Hits)');
    });

    test('Procedural wound roll reminder does not trigger Wounds modifier in arbitrary ability', () => {
      const abilityWithReminder: Ability = {
        id: 'testMultiHit',
        name: 'Supercharged Blast',
        phase: 'shooting',
        once: 'none',
        effect: 'Each time an attack made with this unit\'s Warpfire Gun scores a critical hit, that attack scores 2 hits instead of 1 (make a wound roll for each hit).'
      };

      const analysis = analyzeAbilityRule(abilityWithReminder);
      expect(analysis.grantedWeaponAbilities).toContain('Crit (2 Hits)');
      expect(analysis.allowedStats).not.toContain('wound');
      expect(analysis.influencedStats).not.toContain('Wounds');
      expect(analysis.statsWithModifiers.some(s => s.stat === 'Wounds')).toBe(false);
    });
  });

  describe('Reinforcements Keyword & Trait in Spearhead Rosters', () => {
    const filePath = path.resolve(__dirname, '../app/data/default-factions.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const factions = data.factions || data;

    test('Designated units across Spearheads have isReinforcement: true', () => {
      const checks = [
        { spearhead: 'daughters-of-khaine-heartflayer-troupe', unitId: 'witchAelves', expected: true },
        { spearhead: 'lumineth-realm-lords-glittering-phalanx', unitId: 'vanariAuralanSentinels1', expected: true },
        { spearhead: 'lumineth-realm-lords-glittering-phalanx', unitId: 'vanariAuralanWardens', expected: true },
        { spearhead: 'lumineth-realm-lords-hurakan-vanguard', unitId: 'vanariAuralanWardens', expected: true },
        { spearhead: 'skaven-gnawfeast-clawpack', unitId: 'clanrats1', expected: true },
        { spearhead: 'skaven-warpspark-clawpack', unitId: 'clanratsWarpspark1', expected: true },
        { spearhead: 'stormcast-eternals-vigilant-brotherhood', unitId: 'liberators', expected: true },
        { spearhead: 'stormcast-eternals-vigilant-brotherhood', unitId: 'prosecutors', expected: true },
        { spearhead: 'sylvaneth', unitId: 'treeRevenants', expected: true },
        { spearhead: 'blades-of-khorne-fangs-of-the-blood-god', unitId: 'fleshHounds1', expected: true },
        { spearhead: 'blades-of-khorne-fangs-of-the-blood-god', unitId: 'clawsOfKaranak', expected: true },
        { spearhead: 'cities-of-sigmar-castelite-company', unitId: 'freeguildSteelhelms1', expected: true },
        { spearhead: 'cities-of-sigmar-castelite-company', unitId: 'freeguildCavaliers', expected: true },
        { spearhead: 'cities-of-sigmar-castelite-company', unitId: 'ironweldGreatCannon', expected: true },
        { spearhead: 'cities-of-sigmar-fusil-platoon', unitId: 'freeguildFusiliers1', expected: true },
        { spearhead: 'disciples-of-tzeentch-fluxblade-coven', unitId: 'kairicAcolytes', expected: true },
        { spearhead: 'disciples-of-tzeentch-fluxblade-coven', unitId: 'tzaangors1', expected: true },
        { spearhead: 'cities-of-sigmar-zenestras-zealots', unitId: 'freeguildCommandCorpsArchKnightAndRetinue', expected: true },
        { spearhead: 'helsmiths-of-hashut-helforge-host', unitId: 'dominatorEngine', expected: true },
        { spearhead: 'helsmiths-of-hashut-helforge-host', unitId: 'infernalCohort1', expected: true },
        { spearhead: 'idoneth-deepkin-soulraid-hunt', unitId: 'akhelianAllopex', expected: true },
        { spearhead: 'idoneth-deepkin-soulraid-hunt', unitId: 'namartiThralls1', expected: true },
        { spearhead: 'seraphon-sunblooded-prowlers', unitId: 'terrawings', expected: true },
        { spearhead: 'nighthaunt-slasher-host', unitId: 'chainrasps1', expected: true },
        { spearhead: 'idoneth-deepkin-akhelian-tide-guard', unitId: 'namartiReavers', expected: true },
        { spearhead: 'kharadron-overlords-grundstok-trailblazers', unitId: 'endrinriggers', expected: true },
        { spearhead: 'hedonites-of-slaanesh-blades-of-the-lurid-dream', unitId: 'slickbladeSeekers', expected: true },
        { spearhead: 'hedonites-of-slaanesh-blades-of-the-lurid-dream', unitId: 'slaangorFiendbloods', expected: true },
        { spearhead: 'hedonites-of-slaanesh-blades-of-the-lurid-dream', unitId: 'blissbarbArchers1', expected: true },
        { spearhead: 'hedonites-of-slaanesh-epicurean-revellers', unitId: 'daemonettes1', expected: true },
        { spearhead: 'kharadron-overlords-skyhammer-task-force', unitId: 'skywardens', expected: true },
        { spearhead: 'kharadron-overlords-skyhammer-task-force', unitId: 'arkanautCompany1', expected: true },
        { spearhead: 'orruk-warclans-ironjawz-bigmob', unitId: 'bruteRagerz', expected: true },
        { spearhead: 'flesh-eater-courts-carrion-retainers', unitId: 'cryptguard', expected: true },
        { spearhead: 'ogor-mawtribes-scrapglutt', unitId: 'gnoblars', expected: true },
      ];

      for (const c of checks) {
        const fac = factions.find((f: any) => f.id === c.spearhead);
        expect(fac, `Faction ${c.spearhead} not found`).toBeDefined();
        const unit = fac.units.find((u: any) => u.id === c.unitId);
        expect(unit, `Unit ${c.unitId} in ${c.spearhead} not found`).toBeDefined();
        expect(unit.isReinforcement).toBe(c.expected);
      }
    });

    test('Sons of Behemat: General does NOT have reinforcements, but non-general gargants DO', () => {
      const sob = factions.find((f: any) => f.id === 'sons-of-behemat-wallsmasher-stomp');
      expect(sob).toBeDefined();

      const general = sob.units.find((u: any) => u.id === 'mancrusherGargantGeneral');
      expect(general).toBeDefined();
      expect(general.isReinforcement).toBeFalsy();

      const g1 = sob.units.find((u: any) => u.id === 'mancrusherGargant1');
      const g2 = sob.units.find((u: any) => u.id === 'mancrusherGargant2');
      expect(g1.isReinforcement).toBe(true);
      expect(g2.isReinforcement).toBe(true);
    });

    test('Non-reinforcement units do not have isReinforcement: true', () => {
      const sob = factions.find((f: any) => f.id === 'sons-of-behemat-wallsmasher-stomp');
      expect(sob.units.find((u: any) => u.id === 'mancrusherGargantGeneral').isReinforcement).toBeFalsy();

      const ogor = factions.find((f: any) => f.id === 'ogor-mawtribes-scrapglutt');
      expect(ogor.units.find((u: any) => u.id === 'gnoblarScraplauncher').isReinforcement).toBeFalsy();

      const skaven = factions.find((f: any) => f.id === 'skaven-gnawfeast-clawpack');
      expect(skaven.units.find((u: any) => u.id === 'ratOgors').isReinforcement).toBeFalsy();

      const khorne = factions.find((f: any) => f.id === 'blades-of-khorne-fangs-of-the-blood-god');
      expect(khorne.units.find((u: any) => u.id === 'karanak').isReinforcement).toBeFalsy();
    });
  });

});

