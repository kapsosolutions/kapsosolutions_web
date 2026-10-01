// Cloudinary upload + URL transform helper.
import { v2 as cloudinary } from 'cloudinary';
import logger from './logger.js';

// Configure lazily on first use. Configuring at import time fails because ESM
// imports run before server.js calls dotenv.config(), so the env vars would be
// empty ("Must supply api_key").
let configured = false;
function ensureConfig() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  configured = true;
}

const cloudinaryService = {
  // Upload a Buffer to Cloudinary. Returns the secure URL.
  // resourceType: 'image' | 'video' | 'auto'
  uploadBuffer(buffer, folder = 'kapso', resourceType = 'image') {
    ensureConfig();
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (err, result) => {
          if (err) return reject(err);
          resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });
  },

  // Build a transformed delivery URL. ratio '1:1' => square crop; 'original' => untouched.
  getOptimizedUrl(url, ratio = 'original') {
    if (!url || !url.includes('/upload/')) return url;
    let transform = 'f_auto,q_auto';
    if (ratio === '1:1') transform = 'c_fill,ar_1:1,w_400,h_400,f_auto,q_auto';
    return url.replace('/upload/', `/upload/${transform}/`);
  },

  async deleteByUrl(url) {
    ensureConfig();
    try {
      if (!url || !url.includes('/upload/')) return;
      // Resource type is encoded in the delivery URL (/image/, /video/, /raw/).
      let resourceType = 'image';
      if (url.includes('/video/upload/')) resourceType = 'video';
      else if (url.includes('/raw/upload/')) resourceType = 'raw';
      const m = url.match(/\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i);
      if (!m) return;
      await cloudinary.uploader.destroy(m[1], { resource_type: resourceType });
    } catch (err) {
      logger.warn('cloudinary delete failed', { error: err.message });
    }
  }
};

export default cloudinaryService;
