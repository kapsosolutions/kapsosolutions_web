// Generate the RSA key pair WhatsApp Flows require for the data-exchange
// endpoint. Writes keys/flow_private.pem + keys/flow_public.pem, then prints the
// public key you must upload to Meta (Flow > ... > Endpoint > Sign public key).
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const passphrase = process.env.WA_FLOW_KEY_PASSPHRASE || 'kapso_flow_2026';
const keysDir = path.join(__dirname, '..', 'keys');
fs.mkdirSync(keysDir, { recursive: true });

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase }
});

fs.writeFileSync(path.join(keysDir, 'flow_private.pem'), privateKey);
fs.writeFileSync(path.join(keysDir, 'flow_public.pem'), publicKey);

console.log('Flow keys written to backend/keys/');
console.log('\n===== PUBLIC KEY (upload this to Meta Flow endpoint) =====\n');
console.log(publicKey);
