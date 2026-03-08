const db = require("../db");

const huntingResults = [
  { maxScore: 50, message: "Better luck next time", points: 1 },
  { maxScore: 90, message: "Good hunt, you got a duck.", points: 10 },
  { maxScore: 120, message: "Nice hunt, you got a deer!", points: 20 },
  { maxScore: 140, message: "Great hunt, you got a wild boar!", points: 50 },
  {
    maxScore: 160,
    message: "Impressive hunt, you got a great bear!",
    points: 100,
  },
  {
    maxScore: 180,
    message: "Incredible hunt, a basilisk, I never saw one!",
    points: 200,
  },
  {
    maxScore: 200,
    message: "You hunted a cockatrix, you're incredible...",
    points: 500,
  },
  {
    maxScore: 220,
    message: "You hunted a wyvern, you're a hero...",
    points: 1000,
  },
  {
    maxScore: 240,
    message: "You hunted a hydra, you're a legend...",
    points: 2000,
  },
  {
    maxScore: Infinity,
    message: "You hunted a dragon, you're a god...",
    points: 5000,
  },
];

async function calculateHunting(nftId, templateID, address) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Generate a random base score
    const result = Math.floor(Math.random() * 100) + 1;
    console.log(`Base result: ${result}`);

    // Fetch all required data in a single query
    const [rows] = await connection.query(
      `SELECT u.UserID, u.Points, n.level_id, n.rarity
       FROM users u
       JOIN nft_characters_traits n ON n.nft_character_id = ?
       WHERE u.wallet_address = ?`,
      [templateID, address]
    );

    if (rows.length === 0) {
      throw new Error(
        `No user or traits found for address: ${address} and templateID: ${templateID}`
      );
    }

    const { UserID, Points: currentPoints, level_id, rarity } = rows[0];

    // Calculate the final score
    const score = result + level_id * rarity;
    console.log(`Final score: ${score}`);

    // Calculate points based on the score
    const { points, message } = calculatePoints(score);
    console.log(`Reward message: ${message}, Points: ${points}`);

    // Log the result in the huntingHistory table
    const [logResult] = await connection.query(
      `INSERT INTO hunting_history (UserID, BattleTime, Result, Points, NftID)
       VALUES (?, NOW(), ?, ?, ?)`,
      [UserID, score, points, nftId]
    );
    console.log(`Hunting log stored with ID: ${logResult.insertId}`);

    // Update the user's points in the database
    const newTotalPoints = currentPoints + points;
    await connection.query(`UPDATE users SET Points = ? WHERE UserID = ?`, [
      newTotalPoints,
      UserID,
    ]);

    console.log(
      `Updated points for user ${address}. New total: ${newTotalPoints}`
    );

    // Commit the transaction
    await connection.commit();

    return {
      score,
      points,
      message,
      logId: logResult.insertId,
      newTotalPoints,
    };
  } catch (error) {
    await connection.rollback();
    console.error(`Error in calculateHunting: ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
}

function calculatePoints(score) {
  for (const result of huntingResults) {
    if (score <= result.maxScore) {
      return { message: result.message, points: result.points };
    }
  }
  // Fallback (shouldn't occur due to Infinity in maxScore)
  return { message: "Unknown result", points: 0 };
}

async function getHuntingTime(nftId) {
  try {
    const [result] = await db.query(
      `SELECT 
                COALESCE(NftID, ?) AS NftID, 
                COALESCE(MAX(BattleTime), 0) AS MostRecentBattleTime,
                COALESCE(TIMESTAMPDIFF(SECOND, NOW(), DATE_ADD(MAX(BattleTime), INTERVAL 24 HOUR)), 0) AS SecondsLeft
            FROM hunting_history
            WHERE NftID = ?
            GROUP BY NftID WITH ROLLUP`,
      [nftId, nftId]
    );
    return result.length > 0
      ? result[0]
      : { NftID: nftId, MostRecentBattleTime: 0, SecondsLeft: 0 };
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

async function huntHistory(address) {
  try {
    // Step 1: Retrieve UserID from users table
    const [userRows] = await db.query(
      "SELECT UserID FROM users WHERE wallet_address = ?",
      [address]
    );

    if (userRows.length === 0) {
      throw new Error("User not found");
    }

    const userID = userRows[0].UserID;

    // Step 2: Retrieve rows from hunting_history for the UserID, ordered by BattleTime DESC
    const [huntingHistoryRows] = await db.query(
      "SELECT BattleTime, Result, Points, NftId FROM hunting_history WHERE UserID = ? ORDER BY BattleTime DESC",
      [userID]
    );

    return huntingHistoryRows; // Return the hunt history
  } catch (error) {
    console.error("Error in huntHistory function:", error);
    throw error;
  }
}

// Export the functions to use them in other files
module.exports = {
  calculateHunting,
  getHuntingTime,
  huntHistory,
};
