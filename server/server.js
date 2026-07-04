require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { startRecurringJob } = require('./src/jobs/processRecurring');

// Import models to register associations
require('./src/models');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start recurring expense cron job
    startRecurringJob();

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`💚 Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
