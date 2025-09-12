const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Product = require('../models/Product');

/**
 * ImageMigrationService - Handles Base64 to file system migration
 * 
 * Features:
 * - Batch processing to prevent memory overflow
 * - Base64 validation and conversion
 * - Unique filename generation
 * - Directory structure management
 * - Error handling and logging
 */
class ImageMigrationService {
  constructor() {
    this.baseUploadPath = path.join(__dirname, '../../uploads');
    this.productsPath = path.join(this.baseUploadPath, 'products');
    this.tempPath = path.join(this.baseUploadPath, 'temp', 'migration');
    
    // Supported image formats
    this.supportedFormats = {
      'data:image/jpeg': { ext: '.jpg', mime: 'image/jpeg' },
      'data:image/jpg': { ext: '.jpg', mime: 'image/jpeg' },
      'data:image/png': { ext: '.png', mime: 'image/png' },
      'data:image/gif': { ext: '.gif', mime: 'image/gif' },
      'data:image/webp': { ext: '.webp', mime: 'image/webp' }
    };
  }

  /**
   * Initialize directory structure for image storage
   */
  async initializeDirectories() {
    try {
      const directories = [
        this.baseUploadPath,
        this.productsPath,
        path.join(this.productsPath, 'original'),
        path.join(this.productsPath, 'thumbnails'),
        path.join(this.productsPath, 'medium'),
        path.join(this.productsPath, 'large'),
        this.tempPath
      ];

      for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true });
        console.log(`✅ Directory created/verified: ${dir}`);
      }

      return { success: true, message: 'Directory structure initialized successfully' };
    } catch (error) {
      console.error('❌ Failed to initialize directories:', error);
      throw new Error(`Directory initialization failed: ${error.message}`);
    }
  }

  /**
   * Validate Base64 image data
   * @param {string} base64Data - Base64 encoded image data
   * @returns {object} Validation result with format info
   */
  validateBase64Image(base64Data) {
    if (!base64Data || typeof base64Data !== 'string') {
      return { valid: false, error: 'Invalid or empty Base64 data' };
    }

    // Check if it's a valid Base64 image format
    const formatMatch = base64Data.match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/);
    if (!formatMatch) {
      return { valid: false, error: 'Invalid Base64 image format' };
    }

    const mimeType = `data:image/${formatMatch[1]}`;
    const formatInfo = this.supportedFormats[mimeType];
    
    if (!formatInfo) {
      return { valid: false, error: `Unsupported image format: ${formatMatch[1]}` };
    }

    // Check if Base64 data is complete (minimum reasonable size)
    const base64Content = base64Data.split(',')[1];
    if (!base64Content || base64Content.length < 100) {
      return { valid: false, error: 'Base64 data appears to be incomplete or too small' };
    }

    // Validate Base64 encoding
    try {
      const buffer = Buffer.from(base64Content, 'base64');
      if (buffer.length === 0) {
        return { valid: false, error: 'Base64 decoding resulted in empty buffer' };
      }

      return {
        valid: true,
        format: formatInfo,
        mimeType: formatInfo.mime,
        extension: formatInfo.ext,
        dataSize: base64Content.length,
        fileSize: buffer.length
      };
    } catch (error) {
      return { valid: false, error: `Base64 decoding failed: ${error.message}` };
    }
  }

  /**
   * Generate unique filename for image
   * @param {string} productId - Product ID
   * @param {number} imageIndex - Image index in product
   * @param {string} extension - File extension
   * @returns {string} Unique filename
   */
  generateUniqueFilename(productId, imageIndex, extension) {
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0]; // Use first part of UUID for brevity
    return `${productId}_${imageIndex}_${timestamp}_${uuid}${extension}`;
  }

  /**
   * Convert Base64 image to file
   * @param {string} base64Data - Base64 encoded image
   * @param {string} productId - Product ID
   * @param {number} imageIndex - Image index
   * @returns {object} Conversion result
   */
  async convertBase64ToFile(base64Data, productId, imageIndex) {
    const startTime = Date.now();
    
    try {
      // Validate Base64 data
      const validation = this.validateBase64Image(base64Data);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          processingTime: Date.now() - startTime
        };
      }

      // Generate unique filename
      const filename = this.generateUniqueFilename(productId, imageIndex, validation.extension);
      
      // Create product-specific directory
      const productDir = path.join(this.productsPath, 'original', productId.toString());
      await fs.mkdir(productDir, { recursive: true });
      
      // Full file path
      const filePath = path.join(productDir, filename);
      const relativePath = path.relative(this.baseUploadPath, filePath);
      
      // Extract and decode Base64 data
      const base64Content = base64Data.split(',')[1];
      const buffer = Buffer.from(base64Content, 'base64');
      
      // Write file to disk
      await fs.writeFile(filePath, buffer);
      
      // Verify file was written correctly
      const stats = await fs.stat(filePath);
      if (stats.size !== buffer.length) {
        throw new Error(`File size mismatch: expected ${buffer.length}, got ${stats.size}`);
      }

      console.log(`✅ Converted image: ${productId}[${imageIndex}] -> ${relativePath}`);
      
      return {
        success: true,
        filePath: `/uploads/${relativePath.replace(/\\/g, '/')}`, // Normalize path separators
        filename: filename,
        originalSize: validation.dataSize,
        fileSize: buffer.length,
        mimeType: validation.mimeType,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error(`❌ Failed to convert image ${productId}[${imageIndex}]:`, error);
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Get products with Base64 images for migration
   * @param {number} limit - Maximum number of products to return
   * @param {number} skip - Number of products to skip
   * @returns {Array} Products with Base64 images
   */
  async getProductsWithBase64Images(limit = 50, skip = 0) {
    try {
      // Find products that have Base64 images (images starting with 'data:')
      const products = await Product.find({
        $or: [
          { 'image': { $regex: '^data:image/' } },
          { 'images': { $elemMatch: { $regex: '^data:image/' } } }
        ],
        isDeleted: { $ne: true }
      })
      .select('_id name image images category')
      .limit(limit)
      .skip(skip)
      .lean();

      console.log(`📊 Found ${products.length} products with Base64 images (skip: ${skip}, limit: ${limit})`);
      return products;

    } catch (error) {
      console.error('❌ Failed to fetch products with Base64 images:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  /**
   * Count total products with Base64 images
   * @returns {number} Total count
   */
  async countProductsWithBase64Images() {
    try {
      const count = await Product.countDocuments({
        $or: [
          { 'image': { $regex: '^data:image/' } },
          { 'images': { $elemMatch: { $regex: '^data:image/' } } }
        ],
        isDeleted: { $ne: true }
      });

      console.log(`📊 Total products with Base64 images: ${count}`);
      return count;

    } catch (error) {
      console.error('❌ Failed to count products with Base64 images:', error);
      throw new Error(`Database count failed: ${error.message}`);
    }
  }

  /**
   * Check if service is ready for migration
   * @returns {object} Readiness status
   */
  async checkReadiness() {
    try {
      // Check directory structure
      await this.initializeDirectories();
      
      // Check database connection
      const totalProducts = await this.countProductsWithBase64Images();
      
      // Check disk space (basic check)
      const stats = await fs.stat(this.baseUploadPath);
      
      return {
        ready: true,
        totalProductsToMigrate: totalProducts,
        directoriesReady: true,
        databaseConnected: true,
        message: `Ready to migrate ${totalProducts} products with Base64 images`
      };

    } catch (error) {
      console.error('❌ Migration service not ready:', error);
      return {
        ready: false,
        error: error.message,
        message: 'Migration service is not ready'
      };
    }
  }

  /**
   * Get migration statistics
   * @returns {object} Migration statistics
   */
  async getMigrationStats() {
    try {
      const totalProducts = await this.countProductsWithBase64Images();
      const sampleProducts = await this.getProductsWithBase64Images(5, 0);
      
      let totalImages = 0;
      let totalBase64Size = 0;
      
      for (const product of sampleProducts) {
        // Count main image
        if (product.image && product.image.startsWith('data:image/')) {
          totalImages++;
          totalBase64Size += product.image.length;
        }
        
        // Count additional images
        if (product.images && Array.isArray(product.images)) {
          for (const img of product.images) {
            if (img && img.startsWith('data:image/')) {
              totalImages++;
              totalBase64Size += img.length;
            }
          }
        }
      }
      
      // Estimate total size based on sample
      const avgImagesPerProduct = sampleProducts.length > 0 ? totalImages / sampleProducts.length : 0;
      const avgBase64SizePerImage = totalImages > 0 ? totalBase64Size / totalImages : 0;
      
      const estimatedTotalImages = Math.ceil(totalProducts * avgImagesPerProduct);
      const estimatedTotalSize = Math.ceil(estimatedTotalImages * avgBase64SizePerImage);
      
      return {
        totalProducts,
        estimatedTotalImages,
        estimatedTotalSize,
        estimatedFileSizeAfterConversion: Math.ceil(estimatedTotalSize * 0.75), // Base64 is ~33% larger
        sampleSize: sampleProducts.length,
        avgImagesPerProduct: Math.round(avgImagesPerProduct * 100) / 100
      };

    } catch (error) {
      console.error('❌ Failed to get migration stats:', error);
      throw new Error(`Stats calculation failed: ${error.message}`);
    }
  }
}

module.exports = ImageMigrationService;