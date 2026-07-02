const cloudinary = require('cloudinary').v2;
const env = require('./env');

// Configure Cloudinary SDK
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
  });
}

/**
 * Streams a memory buffer to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer from multer memoryStorage
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<Object|null>} Cloudinary upload result payload or null if credentials are unconfigured
 */
const uploadBuffer = (fileBuffer, folder = 'avatars') => {
  return new Promise((resolve, reject) => {
    // Check if Cloudinary credentials exist
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      console.warn('⚠️ Cloudinary keys not configured in environment. Avatar upload bypassed.');
      return resolve(null);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder, 
        resource_type: 'auto',
        transformation: [{ width: 250, height: 250, crop: 'thumb', gravity: 'face' }] 
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload stream failed:', error.message);
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  cloudinary,
  uploadBuffer
};
