const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const DATA_FILE = './poll-data.json';

// GO REMOVED - ONLY 4 OPTIONS
const DEFAULT_POLL = {
  pollId: '6a2c05cc0300181c72f0eab2b',
  question: "What's your favorite programming language?",
  options: [
    { text: 'JavaScript', votes: 0 },
    { text: 'Python', votes: 0 },
    { text: 'Java', votes: 0 },
    { text: 'C++', votes: 0 }
  ]
};

function readPollData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
    writePollData(DEFAULT_POLL);
    return DEFAULT_POLL;
  } catch (error) {
    return DEFAULT_POLL;
  }
}

function writePollData(poll) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(poll, null, 2));
}

app.get('/api/poll/:id', (req, res) => {
  const poll = readPollData();
  if (poll.pollId!== req.params.id) return res.status(404).json({ message: 'Poll not found' });
  res.json(poll);
});

app.post('/api/vote', (req, res) => {
  const { pollId, option } = req.body;
  const poll = readPollData();
  if (poll.pollId!== pollId) return res.status(404).json({ message: 'Poll not found' });

  const optionIndex = poll.options.findIndex(opt => opt.text === option);
  if (optionIndex === -1) return res.status(400).json({ message: 'Invalid option' });

  poll.options[optionIndex].votes += 1;
  writePollData(poll);
  res.json({ message: 'Vote added successfully', poll: poll });
});

app.get('/api/backup', (req, res) => {
  const poll = readPollData();
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
  const backupData = {
    pollId: poll.pollId,
    question: poll.question,
    options: poll.options,
    totalVotes: totalVotes,
    timestamp: new Date().toISOString(),
    percentages: {}
  };
  poll.options.forEach(opt => {
    const percent = totalVotes > 0? ((opt.votes / totalVotes) * 100).toFixed(2) : '0.00';
    backupData.percentages[opt.text] = percent + '%';
  });
  res.json(backupData);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} 🔥`);
});