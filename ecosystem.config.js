
module.exports = {
  apps: [
    {
      name: "webhunter-pro",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      exp_backoff_restart_delay: 100
    }
  ]
};
