const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // Add this at top for image optimization

// Handle image upload route
const handleImageUpload = (req, res) => {
  try {
    const { image } = req.body;

    // Validate image exists
    if (!image) {
      return res.status(400).json({ 
        success: false, 
        msg: 'No image data provided', 
        msg_type: 'error' 
      });
    }

    // Validate base64 format
    const base64Regex = /^data:image\/(jpeg|png|gif|webp);base64,/;
    if (!base64Regex.test(image)) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Invalid image format', 
        msg_type: 'error' 
      });
    }

    // Extract image type and data
    const matches = image.match(base64Regex);
    const imageType = matches[1];
    const base64Data = image.replace(base64Regex, '');

    // Validate size (e.g., 20MB max)
    if (base64Data.length > 20 * 1024 * 1024) { // 20MB
      return res.status(413).json({ 
        success: false, 
        msg: 'Image too large (max 20MB)', 
        msg_type: 'error' 
      });
    }

    const filename = `image-${Date.now()}.${imageType}`;
    const filepath = path.join(__dirname, 'public', 'image', filename);
    const buffer = Buffer.from(base64Data, 'base64');

    // Optimize image with sharp (optional)
    sharp(buffer)
      .resize(1920, 1080, { // Resize to max 1920x1080
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFormat(imageType, { quality: 80 }) // 80% quality
      .toFile(filepath, (err) => {
        if (err) {
          console.error('Error processing image:', err);
          return res.status(500).json({ 
            success: false, 
            msg: 'Error processing image', 
            msg_type: 'error' 
          });
        }

        res.json({ 
          success: true, 
          path: `/image/${filename}`, 
          msg: 'Image Uploaded', 
          msg_type: 'success' 
        });
      });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ 
      success: false, 
      msg: 'Server error', 
      msg_type: 'error' 
    });
  }
};

module.exports = { handleImageUpload };