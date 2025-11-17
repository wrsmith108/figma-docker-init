import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('Replit Partial Test');
});

app.listen(3000);
