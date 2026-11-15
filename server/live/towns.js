// towns.js -- the island's towns, each with the region it sits in (plan 2 M10: towns
// everywhere). A player's Home area is one of these towns, or "away" (Somewhere else).
// The same towns as config.js TOWNS (the event refresh) and account.js TOWNS (the picker);
// rb-tools p2m10a-test.js holds the three to each other. Region v is the Capital Region,
// i the rest of the island: it only says which towns are near each other.
export const TOWNS = {
  "victoria": "v", "saanich": "v", "oak bay": "v", "esquimalt": "v", "view royal": "v", "colwood": "v",
  "langford": "v", "sidney": "v", "north saanich": "v", "central saanich": "v", "saanichton": "v",
  "brentwood bay": "v", "sooke": "v", "metchosin": "v", "highlands": "v",
  "courtenay": "i", "comox": "i", "cumberland": "i", "campbell river": "i", "nanaimo": "i",
  "lantzville": "i", "ladysmith": "i", "chemainus": "i", "duncan": "i", "north cowichan": "i",
  "lake cowichan": "i", "mill bay": "i", "cobble hill": "i", "shawnigan lake": "i", "parksville": "i",
  "qualicum beach": "i", "port alberni": "i", "tofino": "i", "ucluelet": "i", "port hardy": "i",
  "port mcneill": "i", "salt spring island": "i", "gabriola": "i"
};
export const AREAS = Object.keys(TOWNS).concat(["away"]); // every town, then Somewhere else
// how near two home areas are: 2 the same town, 1 the same region, 0 otherwise (or either not a town)
export function nearOf(a, b) {
  if (!a || !b || !TOWNS[a] || !TOWNS[b]) return 0;
  return a === b ? 2 : (TOWNS[a] === TOWNS[b] ? 1 : 0);
}
