export const RARITY_RATES = {
  COMMON: 0.609,
  RARE: 0.240,
  EPIC: 0.100,
  LEGENDARY: 0.040,
  MYTHIC: 0.010,
  SECRET: 0.001,
};

export type RarityType = keyof typeof RARITY_RATES;

export interface RollResult {
  rarity: RarityType;
  pityReset: boolean;
  newPityCounter: number;
}

/**
 * Calculates the rolled rarity based on current pity counter (0-indexed).
 * pityCounter represents the number of consecutive rolls WITHOUT drawing a Legendary or higher.
 * 
 * - Roll 1 to 40 (pityCounter 0 to 39): base rates apply.
 * - Roll 41 to 59 (pityCounter 40 to 58): Legendary rate increases linearly by 4.8% per roll.
 * - Roll 60+ (pityCounter >= 59): Legendary rate is 100%.
 */
export function calculateRollRarity(pityCounter: number): { rarity: RarityType; pityReset: boolean; newPityCounter: number } {
  const currentRollNumber = pityCounter + 1; // 1-based roll count since last Legendary

  // HARD PITY (Roll 60): Guaranteed Mythic or higher (Mythic or Secret)
  if (currentRollNumber >= 60) {
    const r = Math.random();
    const sum = RARITY_RATES.MYTHIC + RARITY_RATES.SECRET; // 0.010 + 0.001 = 0.011
    const thresholdMythic = RARITY_RATES.MYTHIC / sum; // ~0.9091

    let rarity: RarityType = "MYTHIC";
    if (r < thresholdMythic) {
      rarity = "MYTHIC";
    } else {
      rarity = "SECRET";
    }

    return {
      rarity,
      pityReset: true,
      newPityCounter: 0,
    };
  }

  // SOFT PITY (Rolls 41-59): Legendary rate increases linearly
  let legendaryRate = RARITY_RATES.LEGENDARY;
  if (currentRollNumber > 40) {
    // Linear scaling: +4.8% for each roll above 40
    const extraRolls = currentRollNumber - 40;
    legendaryRate = RARITY_RATES.LEGENDARY + extraRolls * 0.048;
    if (legendaryRate > 1.0) legendaryRate = 1.0;
  }

  const r = Math.random();

  // If we pull Legendary, reset pity
  if (r < legendaryRate) {
    return {
      rarity: "LEGENDARY",
      pityReset: true,
      newPityCounter: 0,
    };
  }

  // Otherwise, roll among the remaining rarities: COMMON, RARE, EPIC, MYTHIC, SECRET
  // Scale non-legendary rates proportionally to fit the remaining probability space (1 - legendaryRate)
  const nonLegendaryBaseSum =
    RARITY_RATES.COMMON +
    RARITY_RATES.RARE +
    RARITY_RATES.EPIC +
    RARITY_RATES.MYTHIC +
    RARITY_RATES.SECRET; // 0.96

  const scaleFactor = (1 - legendaryRate) / nonLegendaryBaseSum;

  const scaledRates = {
    COMMON: RARITY_RATES.COMMON * scaleFactor,
    RARE: RARITY_RATES.RARE * scaleFactor,
    EPIC: RARITY_RATES.EPIC * scaleFactor,
    MYTHIC: RARITY_RATES.MYTHIC * scaleFactor,
    SECRET: RARITY_RATES.SECRET * scaleFactor,
  };

  // Cumulative probabilities
  const thresholdCommon = scaledRates.COMMON;
  const thresholdRare = thresholdCommon + scaledRates.RARE;
  const thresholdEpic = thresholdRare + scaledRates.EPIC;
  const thresholdMythic = thresholdEpic + scaledRates.MYTHIC;

  // Since we already checked r < legendaryRate, now check the remainder of the random value.
  // We offset the random value by the legendaryRate to map it into [0, 1 - legendaryRate]
  const remRandom = r - legendaryRate;

  let rolledRarity: RarityType = "COMMON";
  let pityReset = false; // By default, non-Legendary doesn't reset pity.
  
  // However, Mythic and Secret are rarer/better than Legendary, so pulling them should also reset pity!
  if (remRandom < thresholdCommon) {
    rolledRarity = "COMMON";
  } else if (remRandom < thresholdRare) {
    rolledRarity = "RARE";
  } else if (remRandom < thresholdEpic) {
    rolledRarity = "EPIC";
  } else if (remRandom < thresholdMythic) {
    rolledRarity = "MYTHIC";
    pityReset = true;
  } else {
    rolledRarity = "SECRET";
    pityReset = true;
  }

  return {
    rarity: rolledRarity,
    pityReset,
    newPityCounter: pityReset ? 0 : pityCounter + 1,
  };
}
