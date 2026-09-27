import { Faction } from '../types';
import factionsData from './default-factions.json';

export const DEFAULT_FACTIONS: Faction[] = factionsData as Faction[];

export const mergeFactions = (defaults: Faction[], custom: Faction[]): Faction[] => {
  const map = new Map<string, Faction>();
  defaults.forEach(f => map.set(f.id, { ...f }));

  custom.forEach(cust => {
    const def = map.get(cust.id);
    if (!def) {
      // User-created custom faction not in defaults
      map.set(cust.id, cust);
    } else {
      // Default faction: overlay custom changes while safeguarding codebase tested status & reinforcements
      map.set(cust.id, {
        ...def,
        ...cust,
        // Crucial: A stale browser localStorage cache must NEVER un-test a faction tested in the codebase!
        isTested: Boolean(def.isTested || cust.isTested),
        units: def.units.map(defUnit => {
          const custUnit = cust.units?.find(u => u.id === defUnit.id);
          return {
            ...defUnit,
            ...(custUnit || {}),
            isReinforcement: Boolean(defUnit.isReinforcement || custUnit?.isReinforcement),
          };
        }),
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
};
