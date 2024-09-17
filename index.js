require("dotenv").config();
const express = require("express");
const cors = require("cors");
const messaging = require('./firebaseAdmin');
const { supabase } = require('./supabaseClient');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("I am fireBase Tester for Shores");
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
