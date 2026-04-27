import dotenv from "dotenv";

dotenv.config();

export default {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      type: "http",
      url: process.env.INFURA_SEPOLIA_URL,
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : [],
    },
  },
};