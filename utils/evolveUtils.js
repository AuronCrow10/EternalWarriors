const db = require("../db");

async function evolve(template) {
  const [nftInfo] = await db.query(
    `SELECT * FROM nft_characters_traits WHERE nft_character_id = ?`,
    [template]
  );
  const raceId = nftInfo[0].race_id;
  const classId = nftInfo[0].Class_Group_ID;
  const rarity = nftInfo[0].class_rarity;
  let newRarity = 0;
  let newTemplate = 0;
  const newRandom = Math.random();
  if (rarity == 1) {
    if (newRandom < 0.9) {
      newRarity = 2;
    } else if (newRandom > 0.9 && newRandom < 0.99) {
      newRarity = 3;
    } else if (newRandom > 0.99 && newRandom < 1) {
      newRarity = 4;
    }
  } else if (rarity > 1 && rarity < 5) {
    if (newRandom < 0.001) {
      newRarity = rarity + 3;
    }
  }

  if (newRarity != 0) {
    const [nTemp] = await db.query(
      `SELECT nft_character_id FROM nft_characters_traits WHERE class_group_id = ? AND level_id = ? AND class_rarity = ? AND race_id = ?`,
      [classId, 1, newRarity, raceId]
    );
    newTemplate = nTemp[0].nft_character_id;
  }

  console.log(newTemplate);

  return newTemplate;
}

async function calculateEvolution() {
  // Generate a random number between 0 and 1
  const randomNumber = Math.random();
  // Return true if the random number is less than 0.1 (10% probability)
  return randomNumber < 0.01;
} // First % check to see if the NFT is actually evolving or not

async function updateTemplate(template) {
  const [nftInfo] = await db.query(
    `SELECT * FROM nft_characters_traits WHERE nft_character_id = ?`,
    [template]
  );
  console.log(template);
  const raceId = nftInfo[0].race_id;
  console.log(raceId);
  const classId = nftInfo[0].Class_Group_ID;
  console.log(classId);
  const rarity = nftInfo[0].class_rarity;
  console.log(rarity);
  const level = nftInfo[0].level_id;
  console.log(level);
  const classRarity = nftInfo[0].class_rarity;
  console.log(classRarity);
  const classRank = nftInfo[0].class_rank;
  console.log(classRank);

  const [result] = await db.query(
    `SELECT nft_character_id FROM nft_characters_traits WHERE race_id = ? AND class_id = ? AND class_rarity = ? AND level_id = ? AND class_rarity = ? AND class_rank = ?`,
    [raceId, classId, rarity, level + 1, classRarity, classRank]
  );
  const newTemplate = result[0].nft_character_id;
  return newTemplate;
}

module.exports = {
  evolve,
  calculateEvolution,
  updateTemplate,
};
