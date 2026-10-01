// Create (or reuse) the Book Demo flow on Meta, upload its JSON, wire the
// data-exchange endpoint, publish it, and persist WA_FLOW_BOOK_DEMO_ID to .env.
//
// Prerequisites:
//   1. npm run gen-keys  (and upload the printed public key to the WABA)
//   2. PUBLIC_BASE_URL in .env pointing at your https ngrok URL
//   3. Run: npm run publish-flow
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const metaCloud = (await import('../services/metaCloud.js')).default;

const FLOW_NAME = 'Kapso Book Demo';
const flowJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'flows', 'bookDemoFlow.json'), 'utf8'));
const endpointUri = `${(process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '')}/api/whatsapp/flow-endpoint`;

function upsertEnv(key, value) {
  let content = fs.readFileSync(envPath, 'utf8');
  const line = `${key}=${value}`;
  if (new RegExp(`^${key}=.*$`, 'm').test(content)) {
    content = content.replace(new RegExp(`^${key}=.*$`, 'm'), line);
  } else {
    content += `\n${line}\n`;
  }
  fs.writeFileSync(envPath, content);
}

async function run() {
  if (!process.env.PUBLIC_BASE_URL || process.env.PUBLIC_BASE_URL.includes('localhost')) {
    console.warn('WARNING: PUBLIC_BASE_URL is not a public https URL. Set it to your ngrok URL before publishing.');
  }

  // Reuse an existing flow with the same name if present.
  const flows = await metaCloud.getFlows().catch(() => []);
  let flow = flows.find((f) => f.name === FLOW_NAME);

  if (!flow) {
    console.log('Creating flow...');
    const created = await metaCloud.createFlow(FLOW_NAME, ['OTHER'], { endpointUri });
    flow = { id: created.id };
  } else {
    console.log(`Reusing existing flow ${flow.id}`);
    await metaCloud.updateFlowEndpoint(flow.id, endpointUri).catch((e) => console.warn('set endpoint:', e.response?.data?.error?.message || e.message));
  }

  console.log('Uploading flow JSON...');
  const upload = await metaCloud.updateFlowJSON(flow.id, flowJson);
  if (upload?.validation_errors?.length) {
    console.error('Flow validation errors:', JSON.stringify(upload.validation_errors, null, 2));
  }

  console.log('Publishing flow...');
  try {
    await metaCloud.publishFlow(flow.id);
    console.log('Flow published.');
  } catch (e) {
    console.warn('Publish failed (may already be published):', e.response?.data?.error?.message || e.message);
  }

  upsertEnv('WA_FLOW_BOOK_DEMO_ID', flow.id);
  console.log(`\nWA_FLOW_BOOK_DEMO_ID=${flow.id} written to .env`);
  console.log('Done.');
  process.exit(0);
}

run().catch((err) => {
  console.error('publish-flow error:', err.response?.data || err.message);
  process.exit(1);
});
