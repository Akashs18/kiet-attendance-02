const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const { Pool } = require('pg');
const { exec } = require('child_process');
const path = require('path');

const app = express();

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// PostgreSQL setup
const pool = new Pool({
  user: 'firstdemo_examle_user',
  host: 'dpg-d50evbfgi27c73aje1pg-a.oregon-postgres.render.com',
  database: 'attendance_db',
  password: '6LBDu09slQHqq3r0GcwbY1nPera4H5Kk',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '.jpg'),
});
const upload = multer({ storage });

// Home
app.get('/', (req, res) => {
  res.render('index');
});

// Register Employee
app.post('/register', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).send('No image uploaded');

  const { emp_id, emp_name } = req.body;
  const imagePath = path.resolve(req.file.path);

  console.log('REGISTER:', emp_id, emp_name, imagePath);

  exec(
    `python "${path.join('python', 'register_face.py')}" ${emp_id} "${emp_name}" "${imagePath}"`,
    (err, stdout, stderr) => {
      console.log('PYTHON STDOUT:', stdout);
      console.log('PYTHON STDERR:', stderr);

      if (err) {
        console.error('Python register error:', err);
        return res.status(500).send(stderr || err.message);
      }

      res.send(stdout || 'Registration successful');
    }
  );
});

// Mark Attendance
app.post('/attendance', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).send('No image uploaded');

  const imagePath = path.resolve(req.file.path);
  console.log('ATTENDANCE IMAGE:', imagePath);

  exec(
    `python "${path.join('python', 'take_attendance.py')}" "${imagePath}"`,
    (err, stdout, stderr) => {
      console.log('PYTHON STDOUT:', stdout);
      console.log('PYTHON STDERR:', stderr);

      if (err) {
  console.log(stdout);
  return res.status(200).send(stdout || 'No face detected');
}


      res.send(stdout || 'Attendance marked');
    }
  );
});

// Get Attendance Table
app.get('/attendance', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM attendance ORDER BY attendance_date DESC' //, attendance_time DESC
    );
    res.json(result.rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json([]);
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
