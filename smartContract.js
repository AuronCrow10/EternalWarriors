const { ethers } = require("ethers");
const ABI = require("./utils/ABI.json");

const contractAddress = "0xb8e77874C41b2f7baFD57a0E1239e70040C4446f";

async function checkOwner(address, nftId) {
  const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(contractAddress, ABI, wallet);
  const owner = await contract.ownerOf(nftId);
  let isOwner = false;
  let templateID = 0;
  if (owner === address) {
    isOwner = true;
    templateID = await contract.getNftTemplate(nftId);
  }
  return { isOwner, templateID };
}

async function verify(address, nftId) {
  const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(contractAddress, ABI, wallet);
  console.log(nftId);
  const owner = await contract.ownerOf(nftId);
  const template = await contract.getNftTemplate(nftId);
  console.log(template);
  let isLegit = false;
  if (address === owner && Number(template) > 1000000) {
    const isChestActive = await contract.isChestActive(
      Number(template) - 1000000
    );
    if (isChestActive) {
      isLegit = true;
    }
  }

  const chestId = Number(template);
  return { isLegit, chestId };
}

async function setTemplate(nftId, template) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, ABI, wallet);

    // Sending the transaction
    const tx = await contract.openChest(nftId, template);
    console.log("Transaction sent. Hash:", tx.hash);

    // Waiting for the transaction to be mined
    await tx.wait();
    console.log("Transaction confirmed. Success!");

    // Return the transaction hash
    return tx.hash;
  } catch (error) {
    console.error("Error setting template:", error);
    throw error; // Re-throw the error to handle it in the calling code
  }
}

async function setLeveledTemplate(nftId, template) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, ABI, wallet);

    // Sending the transaction
    const tx = await contract.setTemplate(nftId, template);
    console.log("Transaction sent. Hash:", tx.hash);

    // Waiting for the transaction to be mined
    await tx.wait();
    console.log("Transaction confirmed. Success!");

    // Return the transaction hash
    return tx.hash;
  } catch (error) {
    console.error("Error setting template:", error);
    throw error; // Re-throw the error to handle it in the calling code
  }
}

async function checkLevelUp(nftId) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, ABI, wallet);
    const hasLevelUp = await contract._hasLevelUp(nftId);
    if (hasLevelUp) {
      try {
        const response = await contract.updateLevelChecker(nftId);
        await response.wait();
        return true;
      } catch (error) {
        console.log(error);
      }
    }
    return false;
  } catch (error) {
    console.log(error);
  }
}

async function getTemplate(nftId) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, ABI, wallet);
    const template = contract.getNftTemplate(nftId);
    return template;
  } catch (error) {
    console.log(error);
  }
}

async function airdrop(nftId, template) {
  try {
    console.log("airdropping");
    const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, ABI, wallet);
    const owner = await contract.ownerOf(nftId);
    const response = await contract.evolveNFT(owner, template);
    await response.wait();
    return response.hash;
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  verify,
  setTemplate,
  checkLevelUp,
  getTemplate,
  airdrop,
  checkOwner,
  setLeveledTemplate,
};
