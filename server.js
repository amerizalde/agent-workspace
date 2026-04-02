const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('web-ui'));

// Serve thoughts.md on GET
app.get('/thoughts.md', (req, res) => {
  res.sendFile(path.join(__dirname, 'thoughts.md'));
});

// Append a new thought via POST
app.post('/thoughts.md', (req, res) => {
  const { date, text } = req.body;
  if (!date || !text) {
    return res.status(400).send('Missing date or text');
  }
  const entry = `- **${date}** - *${text}\n`;
  try {
    fs.appendFileSync('thoughts.md', entry, 'utf8');
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});