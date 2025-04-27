const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve your frontend files

// Load existing feedbacks
let feedbacks = [];
if (fs.existsSync('feedbacks.json')) {
  feedbacks = JSON.parse(fs.readFileSync('feedbacks.json'));
}

// Submit feedback
app.post('/submit-feedback', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  const newFeedback = {
    id: Date.now(),
    message,
    timestamp: new Date().toISOString()
  };

  feedbacks.unshift(newFeedback); // Add to top
  fs.writeFileSync('feedbacks.json', JSON.stringify(feedbacks, null, 2));
  res.status(201).json({ success: true, feedback: newFeedback });
});

// Get feedbacks
app.get('/get-feedbacks', (req, res) => {
  res.json(feedbacks);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
