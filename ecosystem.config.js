const path = require('path')

module.exports = {
  apps: [
    {
      name: 'ecom-frontend',
      script: path.join(__dirname, 'client', 'node_modules', 'vite', 'bin', 'vite.js'),
      args: '--host 0.0.0.0 --port 4173',
      cwd: path.join(__dirname, 'client'),
      env: {
        NODE_ENV: 'development',
        HOST: '0.0.0.0',
        PORT: 4173,
        BROWSER: 'none',
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '600M',
      error_file: path.join(__dirname, 'logs', 'pm2-frontend-error.log'),
      out_file: path.join(__dirname, 'logs', 'pm2-frontend-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'ecom-backend',
      script: 'src/server.js',
      cwd: path.join(__dirname, 'server'),
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '600M',
      error_file: path.join(__dirname, 'logs', 'pm2-backend-error.log'),
      out_file: path.join(__dirname, 'logs', 'pm2-backend-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
}
