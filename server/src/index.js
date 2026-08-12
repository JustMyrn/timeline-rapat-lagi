const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const rapatRoutes = require('./routes/rapat');
const notifikasiRoutes = require('./routes/notifikasi');
const departemenRoutes = require('./routes/departemen');
const userRoutes = require('./routes/user');
const logRoutes = require('./routes/log');
const backupRoutes = require('./routes/backup');
const resetRoutes = require('./routes/reset');

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/rapat', rapatRoutes);
app.use('/api/notifikasi', notifikasiRoutes);
app.use('/api/departemen', departemenRoutes);
app.use('/api/user', userRoutes);
app.use('/api/log', logRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/reset', resetRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Timeline Rapat API is running' });
});

// Start server
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
  });
}

// Export for Vercel
module.exports = app;
// Force nodemon restart to pick up .env changes (2)
