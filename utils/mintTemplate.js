const db = require("../db");

async function getPercentages(chestId, address) {
  const [availableTemplates] = await db.query(
    `SELECT nft_character_id, probability FROM nft_characters_traits WHERE level_id = ? AND class_group_id = ? AND class_rarity = ?`,
    [1, chestId, 1]
  );

  const percentages = availableTemplates.map((obj) => obj.probability * 100);

  const scaleFactor = 1000000;
  const weights = scalePercentages(percentages, scaleFactor);
  const templateID = selectItemID(availableTemplates, weights);
  result = setNewUser(address);
  return templateID;
}

// Utility function to scale percentages into weights
function scalePercentages(percentages, scaleFactor) {
  return percentages.map((p) => Math.round(p * scaleFactor));
}

// Utility function to select a random value based on weighted probabilities
function selectItemID(items, weights) {
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  const random = Math.floor(Math.random() * totalWeight);
  console.log(random);
  console.log(totalWeight);

  let cumulativeWeight = 0;

  for (let i = 0; i < weights.length; i++) {
    cumulativeWeight += weights[i];
    if (random < cumulativeWeight) {
      return items[i].nft_character_id; // Return the ID instead of the value
    }
  }
}

async function setNewUser(address) {
  const [rows] = await db.query(
    `
    INSERT INTO users (wallet_address, Points)
    SELECT ?, ?
    WHERE NOT EXISTS (
      SELECT 1 FROM users WHERE wallet_address = ?
    );
  `,
    [address, 0, address]
  );

  return rows;
}

// Export the functions to use them in other files
module.exports = {
  getPercentages,
};
