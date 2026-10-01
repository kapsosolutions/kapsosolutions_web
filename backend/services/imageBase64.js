// Fetch an image URL and return it as a data-URI base64 string, resized/cropped
// via Cloudinary transforms. WhatsApp Flow dropdowns require raw base64 images.
import axios from 'axios';
import cloudinaryService from './cloudinary.js';
import logger from './logger.js';

export async function urlToBase64(url, { width = 180, height = 180, crop = 'fill', quality = 80, format = 'jpg' } = {}) {
  if (!url) return '';
  try {
    let target = url;
    if (url.includes('/upload/')) {
      const t = `c_${crop},w_${width},h_${height},q_${quality},f_${format}`;
      target = url.replace('/upload/', `/upload/${t}/`);
    }
    const resp = await axios.get(target, { responseType: 'arraybuffer', timeout: 15000 });
    return Buffer.from(resp.data).toString('base64');
  } catch (err) {
    logger.warn('urlToBase64 failed', { error: err.message });
    return '';
  }
}

export default { urlToBase64 };
