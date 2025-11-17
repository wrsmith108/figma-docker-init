import express from 'express';
import Database from '@replit/database';

const app = express();
const db = new Database();

app.get('/', (req, res) => {
  res.send('Replit Complete Test');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
