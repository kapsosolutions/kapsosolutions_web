import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const GRAPH = `https://graph.facebook.com/${process.env.WA_GRAPH_VERSION || 'v21.0'}`;
const token = process.env.WA_TOKEN;
const flowId = process.env.WA_FLOW_BOOK_DEMO_ID;

const { data } = await axios.get(`${GRAPH}/${flowId}`, {
  headers: { Authorization: `Bearer ${token}` },
  params: { fields: 'id,name,status,endpoint_uri,validation_errors,preview,whatsapp_business_account' }
});
console.log(JSON.stringify(data, null, 2));
