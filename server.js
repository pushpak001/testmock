const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// ----- Config (No .env) -----
const S3_BUCKET = 'reciepts1492';
const AWS_REGION = 'ap-south-1';
const AWS_ACCESS_KEY = 'AKIAWWQXB2BFH57PWO6S';
const AWS_SECRET_KEY = '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';

const DB_CONFIG = {
  host: 'database-1.clysk00aa7p8.ap-south-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Pushpak-1492',
  database: 'mocktests'
};

// S3 Setup
const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY,
  region: AWS_REGION
});

// MySQL connection pool
const pool = mysql.createPool(DB_CONFIG);

// File upload config
const upload = multer({ dest: 'uploads/' });

// Serve static frontend
app.use(express.static(path.join(__dirname)));

// POST: Handle registration form
app.post('/register', upload.single('receipt'), async (req, res) => {
  const { m1, m2, m3, m4, m5, college, idea } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ message: 'Receipt required' });

  const fileContent = fs.readFileSync(file.path);
  const fileKey = `receipts/${Date.now()}_${file.originalname}`;

  try {
    // Upload to S3
    await s3.upload({
      Bucket: S3_BUCKET,
      Key: fileKey,
      Body: fileContent,
      ContentType: file.mimetype
    }).promise();

    fs.unlinkSync(file.path); // Cleanup

    // Save to MySQL
    await pool.query(
      `INSERT INTO registrations (m1, m2, m3, m4, m5, college, idea, receipt_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [m1, m2, m3, m4, m5, college, idea, fileKey]
    );

    res.json({ message: 'Registration successful' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
