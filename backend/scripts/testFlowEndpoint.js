// Simulate Meta's encrypted flow data-exchange call locally to validate our
// decrypt + response structure end-to-end.
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const publicPem = fs.readFileSync(path.join(__dirname, '..', 'keys', 'flow_public.pem'), 'utf8');

function encryptRequest(obj) {
  const aesKey = crypto.randomBytes(16); // AES-128
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, iv);
  const enc = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const encrypted_flow_data = Buffer.concat([enc, tag]).toString('base64');
  const encrypted_aes_key = crypto
    .publicEncrypt({ key: publicPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, aesKey)
    .toString('base64');
  return { body: { encrypted_flow_data, encrypted_aes_key, initial_vector: iv.toString('base64') }, aesKey, iv };
}

function decryptResponse(b64, aesKey, iv) {
  const flippedIv = Buffer.from(iv.map((b) => ~b & 0xff));
  const buf = Buffer.from(b64, 'base64');
  const tag = buf.subarray(-16);
  const enc = buf.subarray(0, -16);
  const decipher = crypto.createDecipheriv('aes-128-gcm', aesKey, flippedIv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

async function call(payload, label) {
  const { body, aesKey, iv } = encryptRequest(payload);
  const res = await axios.post('http://localhost:5000/api/whatsapp/flow-endpoint', body, {
    headers: { 'Content-Type': 'application/json' }
  });
  const decrypted = decryptResponse(res.data, aesKey, iv);
  console.log(`\n=== ${label} (HTTP ${res.status}) ===`);
  const parsed = JSON.parse(decrypted);
  // Trim base64 images so the output stays readable.
  if (parsed?.data?.categories) {
    parsed.data.categories = parsed.data.categories.map((c) => ({ ...c, image: c.image ? `<b64 ${c.image.length} chars>` : undefined }));
  }
  console.log(JSON.stringify(parsed, null, 2));
}

await call({ version: '3.0', action: 'ping' }, 'PING');
await call({ version: '3.0', action: 'INIT', flow_token: 'book_demo_919999999999' }, 'INIT');
await call(
  {
    version: '3.0',
    action: 'data_exchange',
    screen: 'BOOK_DEMO',
    flow_token: 'book_demo_919999999999',
    data: { name: 'Test User', business_name: 'Test Biz', business_address: 'Chennai', category: 'retail', alt_mobile: '9876543210', email: 't@t.com' }
  },
  'DATA_EXCHANGE (submit)'
);
console.log('\nDone.');
process.exit(0);
