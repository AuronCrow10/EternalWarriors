require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require('path');
const {
  verify,
  setTemplate,
  checkLevelUp,
  getTemplate,
  airdrop,
  checkOwner,
  setLeveledTemplate,
} = require("./smartContract");
const {
  calculateHunting,
  getHuntingTime,
  huntHistory,
} = require("./utils/huntingUtils");
const {
  evolve,
  calculateEvolution,
  updateTemplate,
} = require("./utils/evolveUtils");
const { getStats } = require("./utils/statsUtils");

const { getPercentages } = require("./utils/mintTemplate");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for security
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      // Allow external stylesheets from Google Fonts:
      styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
      // Allow fonts from Google and data URIs:
      fontSrc: ["'self'", "https://fonts.googleapis.com", "data:"],
      // Allow network connections to external APIs or endpoints:
      connectSrc: ["'self'", "https://blast-mainnet.g.alchemy.com", "https://api.web3modal.org", "https://pulse.walletconnect.org"],
      // If you need frames (for example, Magic Link's iframe):
      frameSrc: ["'self'", "https://secure.walletconnect.org/"],
      // Explicitly allow images from your domain and data URIs:
      imgSrc: ["'self'", "data:"],
      // Other resource types as needed:
      // scriptSrc, imgSrc, etc.
    },
  })
);

app.use(express.json());

// Serve static files for the front-end (if any)
app.use(express.static(path.join(__dirname, 'public')));

const corsOptions = {
  origin: "https://eternalwarriors.io",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.post("/generate-template", async (req, res) => {
  const { address, nftId } = req.body;
  try {
    // Verify the legitimacy of the NFT and get the chestId
    const { isLegit, chestId } = await verify(address, nftId);

    console.log(isLegit, chestId);

    if (isLegit) {
      // Generate a template ID using the chestId
      const templateID = await getPercentages(chestId - 1000000, address);

      // Set the template on the blockchain and get the transaction hash
      const txHash = await setTemplate(nftId, templateID);

      // Return both the templateID and the transaction hash
      return res.json({ templateID, txHash });
    } else {
      // Return an error if the NFT verification fails
      return res.status(400).json({ error: "NFT verification failed" });
    }
  } catch (error) {
    // Log and return an error if something goes wrong
    console.error("Error generating templateID:", error);
    return res.status(500).json({ error: "Failed to generate templateID" });
  }
});

app.post("/level-up", async (req, res) => {
  const { nftId } = req.body;
  try {
    const canLevelup = await checkLevelUp(nftId);

    if (canLevelup) {
      const orgTemplate = await getTemplate(nftId);

      const leveledTemp = await updateTemplate(orgTemplate);
      const txHash = await setLeveledTemplate(nftId, leveledTemp);
      console.log(txHash);
      const isEvolving = await calculateEvolution();
      if (isEvolving) {
        const newTemplate = await evolve(orgTemplate);
        console.log(newTemplate);
        if (newTemplate != 0) {
          const hash = await airdrop(nftId, newTemplate);
          console.log(hash);
          return res.json({ newTemplate, hash });
        } else {
          return res.json({
            message: "Unlucky, boost your NFT and try again!",
          });
        }
      } else {
        return res.json({
          message: "Oh no, bad luck,your NFT failed to evolve!",
        });
      }
    } else {
      return res
        .status(400)
        .json({ error: "Not enough fees collected to level up" });
    }
  } catch (error) {
    // Log and return an error if something goes wrong
    console.error("Error leveling up", error);
    return res.status(500).json({ error: "Error leveling up" });
  }
});

app.post("/hunt", async (req, res) => {
  const { address, nftId } = req.body;

  try {
    // Ensure checkOwner is asynchronous
    const { isOwner, templateID } = await checkOwner(address, nftId);

    if (!isOwner || templateID === 0) {
      return res.status(400).json({ error: "Wrong NFT ID" });
    }

    // Perform the hunting operation
    const huntingResult = await calculateHunting(nftId, templateID, address);

    // Return success response
    return res.status(200).json({
      message: "Hunting completed successfully",
      huntingResult,
    });
  } catch (error) {
    console.error("Error while Hunting", error);
    return res.status(500).json({ error: "Error while Hunting" });
  }
});

app.post("/get-hunt-time", async (req, res) => {
  const { nftId } = req.body;
  if (!nftId) {
    return res.status(400).json({ error: "nftId is required" });
  }

  try {
    const huntTime = await getHuntingTime(nftId); // Call the function
    return res.status(200).json(huntTime); // Send the result back to the client
  } catch (error) {
    console.error("Error fetching hunt time:", error);
    return res.status(500).json({ error: "Failed to fetch hunt time" }); // Handle errors
  }
});

app.post("/hunt-history", async (req, res) => {
  const { address } = req.body;
  try {
    const huntHistoryRows = await huntHistory(address);
    return res.status(200).json(huntHistoryRows);
  } catch (error) {
    if (
      error.message === "Address is required" ||
      error.message === "User not found"
    ) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/get-stats", async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    const stats = await getStats(address);
    return res.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
