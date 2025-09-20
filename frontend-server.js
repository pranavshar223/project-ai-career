import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This serves all the files in your 'dist' folder (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'dist')));

// This is the crucial part: For any other request, it sends the main index.html file.
// This allows React Router to handle the URL.
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Frontend server listening on port ${port}`);
});