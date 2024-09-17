require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const vision = require("@google-cloud/vision");
const messaging = require('./firebaseAdmin');
const { supabase } = require('./supabaseClient');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));

app.use(bodyParser.json({limit:'10mb'}));

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

app.get("/fireBaseTester", (req, res) => {
  res.send("I am FireBaseTester from backend team Shores");
});



app.post("/", async (req, res) => {
  try {
    console.log("Received base64Image:", req.body.base64Image.slice(0, 100));

    const [result] = await client.labelDetection({
      image: { content: req.body.base64Image },
    });

    console.log("API response:", result);

    const labels = result.labelAnnotations;
    const isBeachRelated = labels.some((lb) =>
      beachData.some((e) => lb.description.toLowerCase().includes(e))
    );

    res.json({ isBeachRelated, labels });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).send("Error analyzing image");
  }
});




app.post('/store-token', async (req, res) => {
  const { token } = req.body;

  if (!token) {
      return res.status(400).send('Missing FCM token');
  }

  const { data, error } = await supabase
      .from('fcm_tokens')
      .insert([{ token: token }]);

  if (error) {
      console.error('Error storing FCM token:', error);
      return res.status(500).send('Error storing FCM token');
  }

  return res.status(200).send('FCM token received and stored.');
});



app.post('/send-notification', async (req, res) => {
  const { title, body } = req.body;

  // Retrieve tokens from Supabase
  const { data: tokens, error } = await supabase
      .from('fcm_tokens')
      .select('token');

  if (error) {
      console.error('Error retrieving tokens:', error);
      return res.status(500).send('Error retrieving tokens');
  }

  // Create notification payload
  const message = {
      notification: {
          title: title,
          body: body,
      },
      tokens: tokens.map(token => token.token),
  };

  try {
      const response = await messaging.sendMulticast(message);
      console.log('Successfully sent message:', response);
      res.status(200).send(`Notification sent successfully: ${response}`);
  } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).send('Error sending notification');
  }
});





app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
