# Match State & Rule Engine Implementation Walkthrough

We have successfully implemented the **Slaves to Darkness "Eye of the Gods" Ascension Table Modal**, **Generic Turn-Based Charge-Conditional Modifiers**, **Dynamic 0-Base Ward Modifications**, **Structured Opponent-Turn Combat Phase Layout**, and **AoS Target Roll Modifier Capping with Detailed Hover Tooltips** in the Spearhead Combat Tracker.

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
