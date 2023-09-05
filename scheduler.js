const cron = require('node-cron');
const { exec } = require('child_process');

// Define the cron schedule (runs every hour)
cron.schedule('0 * * * *', () => {
  // Replace 'npm run start' with your actual start command
  exec('npm run start', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Stdout: ${stdout}`);
  });
});

console.log('Scheduled job to run every hour.');
