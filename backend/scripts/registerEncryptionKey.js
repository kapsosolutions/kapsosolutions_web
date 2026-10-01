// Register the flow endpoint's public key on the WhatsApp phone number so Meta
// encrypts flow data-exchange requests with it. Run after gen-keys:
//   npm run register-key   (or: node scripts/registerEncryptionKey.js)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const GRAPH = `https://graph.facebook.com/${process.env.WA_GRAPH_VERSION || 'v21.0'}`;
const phoneId = process.env.WA_PHONE_NUMBER_ID;
const token = process.env.WA_TOKEN;
const pubKeyPath = path.join(__dirname, '..', 'keys', 'flow_public.pem');
const businessPublicKey = fs.readFileSync(pubKeyPath, 'utf8');

async function run() {
  await axios.post(
    `${GRAPH}/${phoneId}/whatsapp_business_encryption`,
    new URLSearchParams({ business_public_key: businessPublicKey }),
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  const check = await axios.get(`${GRAPH}/${phoneId}/whatsapp_business_encryption`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Public key registered. Current status:', JSON.stringify(check.data, null, 2));
}

run().catch((err) => {
  console.error('register-key error:', err.response?.data || err.message);
  process.exit(1);
});
