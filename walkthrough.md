# Match State, Rules Engine & Combat UI Implementation Walkthrough

We have successfully implemented the **Combat Phase Order of Events Protocol**, **Strike-First / Strike-Last Interactive Groups**, **Active Turn Phase Constraints**, **Round-based Ability Locks (Dread Descent)**, **Slaves to Darkness Eye of the Gods Ascension**, and the **Lumineth Facets of War** in the Spearhead Combat Tracker.

---

## ⚔️ Combat Sequencing, Turn Constraints & Speed Activations [NEW]

We have designed and integrated a premium, official-compliant combat sequence and phase-filtering system that brings total rules purity to Spearhead matches:

### 1. ⏱️ Strike-First & Strike-Last Activation Groups
We subdivided the Melee Combat Activations panel into three visually distinct, sequential, and beautifully badged categories:
- **⚡ Strike-First Activations**: High-priority combatants (e.g. units with active Strike-First buffs or charging cavalry) that resolve attacks before standard fighting starts.
- **⚔️ Normal Combat Activations**: Standard combatants resolving attacks in alternating order.
- **🛡️ Strike-Last Activations**: Slowed combatants resolving attacks after normal activations conclude.
- **Tactile Inline Speed Overrides**: Added an elegant segmented control (`⚡ First` / `⚔️ Normal` / `🛡️ Last`) inside each unit card, allowing players to instantly toggle and override a unit's combat order dynamically during intense melee encounters. Custom logs track these speed adjustments in real-time.

### 2. 🔀 Attacker/Defender Order of Events Protocol
In accordance with official Age of Sigmar 4.0 sequencing, we unified the Combat Phase timeline layout across both turns:
1. **Attacker declares combat abilities** first inside the renamed `Abilities (Round X)` active strategies block.
2. **Defender declares reactive responses** next inside `My Defensive Responses`.
3. **Melee activations are resolved** sequentially by combat speed groups.
4. **Passive combat rules** are evaluated at the bottom.

### 3. 🚫 Phase Filtering on Opponent Turn
During the opponent's turn, standard active abilities for the **Hero**, **Movement**, **Shooting**, and **Charge** phases are completely locked and hidden from view. This prevents players from mistakenly triggering active friendly tactics when it is not their active turn, ensuring complete match purity.

### 4. ⏳ Dread Descent Battle Round restriction
The Ossiarch Bonereapers battle trait **Dread Descent** is locked out and filtered out of all available active strategy and passive listings during **Battle Round 1**. It becomes automatically available starting from Battle Round 2 onwards, perfectly matching the official rules criteria.

### 🏷️ Abilities Relocation and Consistent Naming
We renamed the main active strategy block to `Abilities (Round X)` and elevated it to render above `My Melee Combat Activations` in the combat timeline, creating a highly cohesive and uniform tactical cockpit across all non-combat and combat phases.

---

## ⚙️ Core Architecture and Capabilities

### 1. Slaves to Darkness: Eye of the Gods Ascension System
We built high-fidelity support for the intricate Ascension mechanics of the **Bloodwind Legion**:
- **Interactive Ascension Dialog**: Triggering `Eye of the Gods`, `The Dread Banner`, or `Favoured of the Pantheon` prompts a beautiful, rich dialog asking the user to choose a target unit and select a reward from the **Eye of the Gods Ascension Table**.
- **The Dread Banner Filtering**: Restricts selection strictly to `Chaos Warriors` or `Chaos Knights` according to the rules of war.
- **Favoured of the Pantheon Chaos Lord Focus**: Adjusted the system so that `Favoured of the Pantheon` automatically pre-selects the **Chaos Lord himself** and locks/automates Step 1, preventing user selection errors while cleanly displaying a restricted information card.
- **End of Round Automation**: Automatically prompts the Eye of the Gods ascension modal at the end of every Battle Round when transitioning from an opponent's turn.
- **Eye of the Gods Rewards**:
  - `💀 Snubbed by the Gods`: No effect (logged in match log).
  - `💖 Ward of Tzeentch`: Grants Ward 6+ (increases ward characteristic by 1).
  - `🏃‍♂️ Grace of Slaanesh`: Grants +1 to Run rolls (unit-specific, resolves Slaanesh rules flawlessly).
  - `🤢 Blessing of Nurgle`: Subtracts 1 from wound rolls for attacks targeting this unit.
  - `⚔️ Fury of Khorne`: Adds 1 to the Rend characteristic of melee weapons.

### 2. ⚙️ Additional Layout & Navigational Features

#### A. 🧹 Simplified & Repositioned Passive Spatial Checks
- **The Issue**: Interactive checkboxes for all spatial check abilities cluttering the applied list at the bottom of unit cards.
- **The Fix**: 
  - **Phase-Strict Filtering**: Filtered spatial check checkboxes to **only** display if the ability is a **Passive** ability. Non-passive spatial checks now occur directly during the strategy declaration ("apply") stage rather than once applied.
  - **Layout Repositioning**: Moved the Passive Spatial Check container up to the top of the unit card—placing it directly under the **Models/Order** panels and right before the **Weapons/Attacks** stats, optimizing in-game readability and ergonomics.

#### B. 🔄 Fully Interactive Combat Sub-Phase Navigation
- **The Issue**: Transitioning between the three combat sub-phases was only possible by clicking the sequential "Next Phase" button. Additionally, during Sub-Phase 2 (when the opponent is attacking and you are the defender), you could only see a restricted set of defensive abilities rather than selecting any available combat strategies.
- **The Fix**:
  - **Clickable Tab Navigation**: Configured the Combat sub-phase step-headers (1. Attacker Declares, 2. Defender Declares, 3. Melee Fights) to be completely clickable. Users can now jump freely to any sub-phase in any order.
  - **Unified Strategy Cards**: Updated Sub-Phase 2 (Defender Declares) for when the opponent is attacking to show your **entire list of available combat strategies** (identical to how Sub-Phase 1 displays them when you are attacking). You can now trigger any combat buffs, select targets, and apply characteristics modifications dynamically when defending!

---

## 🩸 Daughters of Khaine & Rules Engine Refinement

We have completed targeted improvements to the core text-parsing rules engine and user interface to fully align with the **Daughters of Khaine** faction:

### 1. 🛡️ Robust Proximity Anchor Filtering (General-Proximity Bypass)
- **The Issue**: Several abilities (such as *Fueled by Revenge* and *Zealous Orator*) mention "your general" as a spatial or distance constraint (e.g., `"friendly Blood Stalkers units while they are wholly within 12\" of your general"`). Because they contained `"your general"`, the rules engine's text parser incorrectly classified their target restriction as `"Hero / General Only"` rather than the actual units being buffed (such as *Blood Stalkers* or *Friendly Units*). This locked the modifiers to the hero and prevented them from applying to unit cards.
- **The Fix**: Refactored both `evaluateDynamicModifiersForAbility` and `analyzeAbilityRule` inside `lib/rules-engine.ts` to identify general-proximity expressions using a regex. If the word `"general"` is only part of a distance constraint (e.g., `within 12" of your general`), the parser bypasses the general-only restriction and allows the modifier to apply to the actual target unit. This correctly resolves targeting for:
  - **Fuelled by Revenge**: Correctly targets strictly the *Blood Stalkers* unit.
  - **Zealous Orator**: Correctly targets a single *Friendly Unit* instead of general-only.

### 2. 🌐 "All Friendly" Plural Target Parsing
- **The Issue**: *Flask of Shademist* contains the text: `"Until the end of the phase, subtract 1 from hit rolls for attacks that target friendly units while they are wholly within 12" of your general."` Because it contained `"friendly units"`, the parser classified it as targeting a `"single_friendly"` unit.
- **The Fix**: Added regex and string matching to parse `"friendly units while they are wholly within"` and `"attacks that target friendly units"` as plural target specifications. This correctly updates its targeting type to `'multi_friendly'` (i.e. ALL friendly), so checking its spatial checkbox applies the modifier globally to all eligible friendly units on the tracker.

### 3. 🎯 Generalized Distance Checking (Turned to Crystal)
- **The Issue**: *Turned to Crystal* says `"Pick an enemy unit within 1\" of this unit"`. It was missing a spatial check on the unit card because the spatial checker only checked for a hardcoded list of inch values (such as `3"`, `6"`, `12"`), skipping `1"`.
- **The Fix**: Replaced the hardcoded distance lists with a dynamic regular expression: `/within\s+\d+["']/i`. This automatically recognizes any numerical within-inch expression (including `within 1\"`) as a spatial constraint. Consequently, *Turned to Crystal* is now correctly identified as requiring a proximity check prior to activation.

### 4. 💚 Beneficial & Healing Stats Highlighted in Green
- **The Issue**: Beneficial/defensive stats like *Heal*, *Save*, and *Ward* were rendering as red badges in the test-harness, which incorrectly implied a penalty or negative status.
- **The Fix**: Modified `app/test-harness/page.tsx` so that only negative modifiers (starting with `-`) trigger the red/penalty style badge. All positive, protective, or beneficial modifiers (such as `Heal`, `Save`, and `Ward`) now render in a vibrant green (`bg-emerald-500/10 text-emerald-400 border-emerald-500/25`) to accurately match their healing and protective nature.

### 2. Turn-Based Charge Buff Mechanics (`getDynamicChargeModifiers`)
We engineered a generic natural language rules parser that processes passive abilities for charge-conditional modifications across all factions:
- Parses strings containing `"charged in the same turn"` or `"has not charged"`.
- Dynamically grants bonuses to characteristics (`rend`, `attacks`, `wound`, `hit`, `save`) in the combat phase when the unit's active charge state matches.
- Safely processes weapon-restricted modifications (such as **Chaos Knights' Cursed Lances**) by checking weapon names during modifier resolution.

### 3. Ward roll calculations on 0-base Ward characteristics
Enhanced the rules-engine core math to correctly calculate and render Ward statistics when units with no base Ward (0 base) receive Ward buffs:
- Intercepts base `0` ward and maps it mathematically to `7` (un-warded).
- Resolves standard target modifiers (like `+1` from Ward 6+) to render a functional `6+` ward on the unit's roster card, combat badges, and details panels.

### 4. AoS Modifier Capping (`+1` / `-1` Net Limit)
According to the core rules of Warhammer Age of Sigmar, net target roll modifications (Save, Ward, Hit, Wound, Run, and Charge rolls) can never exceed `+1` or `-1` from their baseline value.
- **Mathematical Cap Enforcement**: Programmed `calculateStatValue` to dynamically cap the total modifier applied to target roll statistics to a range of `[-1, 1]`.
- **Badge Capping**: Capped the visual number inside the modifier badge to show `+1` or `-1` net roll change instead of exceeding limits (e.g. shows `+1` instead of `+2`).

### 5. Detailed Hover Tooltips (Buff Origin Transparency)
- **Interactive Tooltips**: Hovering over any modified characteristic card (Save, Ward, Hit, Wound, Attacks, Rend, Damage, etc.) displays a clean, native tooltip (`title` attribute) detailing exactly what abilities or active modifiers contributed to that value.
- **Stacking Transparency**: Even if a roll is capped at `+1` net, the hover tooltip displays **all** contributing buffs with their original values so players have complete visibility into what rules are stacking!
  - *Example*: Hovering over a `3+` Save roll (modified from `4+` via a `+2` stack) shows:
    ```text
    All-out Defence: +1
    Mystic Shield: +1
    ```
    While the badge and the roll itself are cleanly capped at `+1` (resulting in `3+`).

### 6. Grouped Opponent-Turn Combat Phase Layout
Restructured the Combat Phase card when `activeTurn === 'opponent'` to divide and elevate activities beautifully:
- **`🛡️ MY DEFENSIVE REACTIONS`**: Prominently elevated to the top of the card so defensive triggers can be processed first.
- **`⚔️ MY MELEE COMBAT ACTIVATIONS`**: Clearly subheaded below it to manage the alternating combat flow.

---

## 🛠️ Verification Build & Test Results

### 1. TypeScript Strict Type-Safety Compilation
The strict compiler confirms zero errors and warnings:
```bash
$ npx tsc --noEmit
# Completed successfully with 0 errors!
```

### 2. High-Coverage Vitest Suite
All 21 test cases—including coverage verifying that multiple modifiers are capped at `+1`/`-1` net for Target Save and Hit rolls—pass cleanly in under 500ms:
```bash
 ✓ lib/rules-engine.test.ts (21 tests) 11ms

 Test Files  1 passed (1)
      Tests  21 passed (21)
   Start at  10:59:32
   Duration  387ms
```

---

## 🚀 How to Test and Play

1. Launch your Spearhead tracker and choose **Slaves to Darkness: Bloodwind Legion** as your active faction.
2. Click the **Favoured of the Pantheon** hero ability button:
   - Observe that the dialog opens with **👑 Restricted to Chaos Lord** active, automatically selecting the Chaos Lord unit.
   - Choose `Ward of Tzeentch` and click **Confirm Ascension**.
   - Hover your cursor over the **Ward: 6+** statistic badge:
     - A clean tooltip appears showing `Favoured of the Pantheon (Ward of Tzeentch): +1`.
3. Try stacking multiple buffs on a unit (e.g. apply `+1 Attacks` and check the charge status to stack charge characteristics, or stack Save buffs):
   - Notice that if target roll modifiers exceed `+1`, the statistic is mathematically capped at `+1` (or `-1` for debuffs), and the stat badge renders `+1` (or `-1`).
   - Hover over the statistic badge to see all contributing buffs listed individually with their original values!
