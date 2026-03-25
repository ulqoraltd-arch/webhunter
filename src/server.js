
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const Redis = require('ioredis');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Redis Bridge for Worker Telemetry
  const redisSub = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
  
  redisSub.subscribe('campaign-telemetry', (err) => {
    if (err) {
      console.error('[REDIS SUB] Failed to subscribe:', err.message);
    } else {
      console.log('[REDIS SUB] Subscribed to campaign-telemetry channel');
    }
  });

  redisSub.on('message', (channel, message) => {
    if (channel === 'campaign-telemetry') {
      try {
        const { campaignId, event, payload } = JSON.parse(message);
        io.to(campaignId).emit(event, payload);
      } catch (err) {
        console.error('[SERVER] Failed to parse telemetry message:', err.message);
      }
    }
  });

  io.on('connection', (socket) => {
    socket.on('join-campaign', (campaignId) => {
      socket.join(campaignId);
      console.log(`[SOCKET] Node joined room: ${campaignId}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Command Center Online: http://${hostname}:${port}`);
  });
});
