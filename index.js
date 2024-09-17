require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const vision = require("@google-cloud/vision");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));

app.use(express.json());

const client = new vision.ImageAnnotatorClient({
  credentials: {
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
  },
});

const beachData = [
  "beach",
  "water",
  "trees",
  "sand",
  "ocean",
  "sea",
  "waves",
  "sunset",
  "swimsuit",
  "palm tree",
  "shore",
  "surfing",
  "coast",
  "tropical",
  "seaside",
  "island",
  "beach volleyball",
  "swimming",
];

app.get("/", (req, res) => {
  res.send("I am backend for Shores");
});

app.get("/test", (req, res) => {
  res.send("I am Tester from backend team Shores");
});

app.post("/", async (req, res) => {
  console.log("Received base64Image:", req.body.base64Image.slice(0, 100));

  try {
    const [result] = await client.labelDetection({
      image: { content: req.body.base64Image },
    });

    const labels = result.labelAnnotations;
    const isBeachRelated = labels.some((lb) =>
      beachData.some((e) => lb.description.toLowerCase().includes(e))
    );

    console.log(
      "Labels detected:",
      labels.map((label) => label.description)
    );

    res.json({ isBeachRelated, labels });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).send("Error analyzing image");
  }
});

app.post("/store-token", (req, res) => {
  const { token } = req.body;
  console.log("Received FCM Token:", token);
  res.status(200).send("Token received and stored.");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
