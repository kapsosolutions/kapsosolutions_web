import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketServer } from 'socket.io';

import logger from './services/logger.js';
import { setIO } from './services/eventBus.js';
import { seedSettings } from './services/settings.js';
import { ensureKeysReadable } from './services/flowCrypto.js';

import webhookRouter from './routes/webhook.js';
import flowEndpointRouter from './routes/flowEndpoint.js';
import adminRouter from './routes/admin.js';
import crmRouter from './routes/crm.js';
import billingRouter from './routes/billing.js';
import razorpayWebhookRouter from './routes/razorpayWebhook.js';
import publicRouter from './routes/public.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const STARTED_AT = new Date();

// Socket.IO for live CRM updates
const io = new SocketServer(server, { cors: { origin: '*' } });
setIO(io);
io.on('connection', (socket) => {
  logger.debug('CRM socket connected', { id: socket.id });
});

app.use(cors());
// Capture raw body for WhatsApp signature verification.
app.use(
  express.json({
    limit: '2mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    logger.info('Connected to MongoDB Atlas');
    try {
      await seedSettings();
      logger.info('Flow settings seeded');
    } catch (err) {
      logger.warn('seedSettings failed', { error: err.message });
    }
  })
  .catch((err) => logger.error('MongoDB connection error', { error: err.message }));

// ---------------- Health ----------------
const MONGO_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];
function buildHealthReport() {
  const mongoState = MONGO_STATES[mongoose.connection.readyState] || 'unknown';
  const has = (v) => Boolean(v && String(v).trim());
  const baseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
  return {
    service: 'Kapso Solutions WhatsApp + CRM Backend',
    status: mongoState === 'connected' ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    startedAt: STARTED_AT.toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    connections: {
      mongodb: { connected: mongoState === 'connected', state: mongoState },
      whatsapp: {
        configured: has(process.env.WA_TOKEN) && has(process.env.WA_PHONE_NUMBER_ID),
        phoneNumberId: process.env.WA_PHONE_NUMBER_ID || null,
        wabaId: process.env.WA_WABA_ID || null,
        flowConfigured: Boolean(process.env.WA_FLOW_BOOK_DEMO_ID),
        flowKeysReadable: ensureKeysReadable()
      },
      cloudinary: { configured: has(process.env.CLOUDINARY_CLOUD_NAME) && has(process.env.CLOUDINARY_API_KEY) }
    },
    whatsapp: {
      callbackUrl: `${baseUrl}/api/whatsapp/webhook`,
      verifyToken: process.env.WA_VERIFY_TOKEN || null,
      flowEndpointUrl: `${baseUrl}/api/whatsapp/flow-endpoint`
    }
  };
}
app.get('/', (_req, res) => res.json(buildHealthReport()));
app.get('/api/health', (_req, res) => res.json(buildHealthReport()));

// ---------------- WhatsApp ----------------
app.use('/api/whatsapp/webhook', webhookRouter);
app.use('/api/whatsapp/flow-endpoint', flowEndpointRouter);

// ---------------- Admin + CRM + Public ----------------
app.use('/api/admin', adminRouter);
app.use('/api/crm', crmRouter);
app.use('/api/billing', billingRouter);
app.use('/api/razorpay', razorpayWebhookRouter);
app.use('/api', publicRouter);

server.listen(PORT, () => {
  logger.info(`Kapso backend listening on http://localhost:${PORT}`);
});
