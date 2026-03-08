const db = require("../db");

async function getStats(address) {
  const [result] = await db.query(
    "SELECT UserID, Points FROM users WHERE wallet_address = ?",
    [address]
  );

  if (!result || result.length === 0) {
    return {
      battles: 0,
      points: 0,
    };
  }

  const [battleResult] = await db.query(
    "SELECT COUNT(*) as battleCount FROM hunting_history WHERE UserID = ?",
    [result[0].UserID]
  );

  return {
    battles: battleResult[0].battleCount,
    points: result[0].Points,
  };
}

module.exports = { getStats };
