const express = require("express");
const axios = require("axios");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();
const FormData = require("form-data");

const app = express();
const upload = multer();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://blockchain-based-research-and-acade.vercel.app"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

app.post("/upload-file", upload.single("file"), async (req, res) => {
  try {
    const FormData = require("form-data");
    const formData = new FormData();

    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
    });

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          ...formData.getHeaders(),
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
        },
      }
    );

    res.json({ IpfsHash: response.data.IpfsHash });

  } catch (err) {
    console.error("UPLOAD ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/upload-json", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      req.body,
      {
        headers: {
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
        },
      }
    );

    res.json({ IpfsHash: response.data.IpfsHash });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Metadata upload failed" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

