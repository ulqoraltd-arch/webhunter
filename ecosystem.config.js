
module.exports = {
  apps: [
    {
      name: "webhunter-server",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        REDIS_HOST: "127.0.0.1",
        REDIS_PORT: 6379
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "2G"
    },
    {
      name: "webhunter-worker",
      script: "node",
      args: "-r ts-node/register src/lib/queue/worker.ts",
      env: {
        NODE_ENV: "production",
        REDIS_HOST: "127.0.0.1",
        REDIS_PORT: 6379
      },
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "2G"
    }
  ]
};
