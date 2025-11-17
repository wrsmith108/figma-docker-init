import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('Replit Minimal Test');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
