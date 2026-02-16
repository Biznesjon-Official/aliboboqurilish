const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

const backupDir = path.join(__dirname, '../backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const createBackup = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}`);

  return new Promise((resolve, reject) => {
    const command = `mongodump --uri "${process.env.MONGODB_URI}" --out "${backupPath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.error('Backup failed', { error: error.message });
        reject(error);
      } else {
        logger.info('Backup created', { path: backupPath });
        resolve(backupPath);
      }
    });
  });
};

const scheduleBackups = (intervalHours = 24) => {
  setInterval(async () => {
    try {
      await createBackup();
    } catch (error) {
      logger.error('Scheduled backup failed', { error: error.message });
    }
  }, intervalHours * 60 * 60 * 1000);

  logger.info('Backup scheduler started', { intervalHours });
};

module.exports = {
  createBackup,
  scheduleBackups
};
