#!/usr/bin/env node

/**
 * Base64 to File Migration Script
 * 
 * This script migrates Base64 encoded images in the database to actual files
 * on the filesystem, improving performance and reducing database size.
 * 
 * Usage:
 *   node scripts/migrate-base64-images.js [options]
 * 
 * Options:
 *   --batch-size <number>  Number of products to process in each batch (default: 50)
 *   --dry-run             Show what would be migrated without making changes
 *   --stats-only          Show migration statistics only
 *   --help                Show this help message
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });

const ImageMigrationService = require('../services/ImageMigrationService');

class MigrationRunner {
  constructor() {
    this.migrationService = new ImageMigrationService();
    this.stats = {
      totalProducts: 0,
      processedProducts: 0,
      successfulProducts: 0,
      failedProducts: 0,
      totalImages: 0,
      successfulImages: 0,
      failedImages: 0,
      totalSizeSaved: 0,
      startTime: null,
      endTime: null
    };
  }

  /**
   * Parse command line arguments
   */
  parseArgs() {
    const args = process.argv.slice(2);
    const options = {
      batchSize: 50,
      dryRun: false,
      statsOnly: false,
      help: false
    };

    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '--batch-size':
          options.batchSize = parseInt(args[++i]) || 50;
          break;
        case '--dry-run':
          options.dryRun = true;
          break;
        case '--stats-only':
          options.statsOnly = true;
          break;
        case '--help':
          options.help = true;
          break;
      }
    }

    return options;
  }

  /**
   * Show help message
   */
  showHelp() {
    console.log(`
🖼️  Base64 to File Migration Script

Usage:
  node scripts/migrate-base64-images.js [options]

Options:
  --batch-size <number>  Number of products to process in each batch (default: 50)
  --dry-run             Show what would be migrated without making changes
  --stats-only          Show migration statistics only
  --help                Show this help message

Examples:
  node scripts/migrate-base64-images.js --stats-only
  node scripts/migrate-base64-images.js --dry-run --batch-size 25
  node scripts/migrate-base64-images.js --batch-size 100
    `);
  }

  /**
   * Connect to MongoDB
   */
  async connectDatabase() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/alibobo';
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Show migration statistics
   */
  async showStats() {
    try {
      console.log('\n📊 Migration Statistics:');
      console.log('========================');
      
      const stats = await this.migrationService.getMigrationStats();
      
      console.log(`Total products with Base64 images: ${stats.totalProducts}`);
      console.log(`Estimated total images: ${stats.estimatedTotalImages}`);
      console.log(`Average images per product: ${stats.avgImagesPerProduct}`);
      console.log(`Estimated Base64 size: ${this.formatBytes(stats.estimatedTotalSize)}`);
      console.log(`Estimated file size after conversion: ${this.formatBytes(stats.estimatedFileSizeAfterConversion)}`);
      console.log(`Estimated space savings: ${this.formatBytes(stats.estimatedTotalSize - stats.estimatedFileSizeAfterConversion)}`);
      
      return stats;
    } catch (error) {
      console.error('❌ Failed to get migration statistics:', error);
      throw error;
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format duration to human readable format
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Run migration process
   */
  async runMigration(options) {
    try {
      console.log('\n🚀 Starting Base64 to File Migration');
      console.log('====================================');
      console.log(`Batch size: ${options.batchSize}`);
      console.log(`Dry run: ${options.dryRun ? 'Yes' : 'No'}`);
      
      this.stats.startTime = Date.now();
      
      // Check readiness
      const readiness = await this.migrationService.checkReadiness();
      if (!readiness.ready) {
        throw new Error(`Migration service not ready: ${readiness.error}`);
      }
      
      console.log(`✅ ${readiness.message}`);
      this.stats.totalProducts = readiness.totalProductsToMigrate;
      
      if (this.stats.totalProducts === 0) {
        console.log('🎉 No products with Base64 images found. Migration not needed!');
        return;
      }
      
      // Process products in batches
      let skip = 0;
      let batchNumber = 1;
      
      while (skip < this.stats.totalProducts) {
        console.log(`\n📦 Processing batch ${batchNumber} (products ${skip + 1}-${Math.min(skip + options.batchSize, this.stats.totalProducts)})`);
        
        const products = await this.migrationService.getProductsWithBase64Images(options.batchSize, skip);
        
        if (products.length === 0) {
          break;
        }
        
        for (const product of products) {
          await this.processProduct(product, options.dryRun);
          this.stats.processedProducts++;
        }
        
        skip += options.batchSize;
        batchNumber++;
        
        // Show progress
        const progress = Math.round((this.stats.processedProducts / this.stats.totalProducts) * 100);
        console.log(`📈 Progress: ${this.stats.processedProducts}/${this.stats.totalProducts} products (${progress}%)`);
      }
      
      this.stats.endTime = Date.now();
      this.showFinalStats();
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Process a single product
   */
  async processProduct(product, dryRun = false) {
    try {
      console.log(`\n🔄 Processing product: ${product.name} (${product._id})`);
      
      let productSuccess = true;
      let imagesToProcess = [];
      
      // Check main image
      if (product.image && product.image.startsWith('data:image/')) {
        imagesToProcess.push({ type: 'main', data: product.image, index: 0 });
      }
      
      // Check additional images
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach((img, index) => {
          if (img && img.startsWith('data:image/')) {
            imagesToProcess.push({ type: 'additional', data: img, index: index });
          }
        });
      }
      
      console.log(`   Found ${imagesToProcess.length} Base64 images to convert`);
      this.stats.totalImages += imagesToProcess.length;
      
      if (dryRun) {
        console.log(`   [DRY RUN] Would convert ${imagesToProcess.length} images`);
        this.stats.successfulImages += imagesToProcess.length;
      } else {
        // Convert each image
        for (const imageInfo of imagesToProcess) {
          const result = await this.migrationService.convertBase64ToFile(
            imageInfo.data,
            product._id,
            imageInfo.index
          );
          
          if (result.success) {
            console.log(`   ✅ Converted ${imageInfo.type} image [${imageInfo.index}]: ${result.filename}`);
            console.log(`      Size: ${this.formatBytes(result.originalSize)} -> ${this.formatBytes(result.fileSize)}`);
            this.stats.successfulImages++;
            this.stats.totalSizeSaved += (result.originalSize - result.fileSize);
          } else {
            console.log(`   ❌ Failed to convert ${imageInfo.type} image [${imageInfo.index}]: ${result.error}`);
            this.stats.failedImages++;
            productSuccess = false;
          }
        }
      }
      
      if (productSuccess) {
        this.stats.successfulProducts++;
      } else {
        this.stats.failedProducts++;
      }
      
    } catch (error) {
      console.error(`❌ Failed to process product ${product._id}:`, error);
      this.stats.failedProducts++;
    }
  }

  /**
   * Show final migration statistics
   */
  showFinalStats() {
    const duration = this.stats.endTime - this.stats.startTime;
    
    console.log('\n🎉 Migration Complete!');
    console.log('======================');
    console.log(`Total time: ${this.formatDuration(duration)}`);
    console.log(`Products processed: ${this.stats.processedProducts}`);
    console.log(`Products successful: ${this.stats.successfulProducts}`);
    console.log(`Products failed: ${this.stats.failedProducts}`);
    console.log(`Images processed: ${this.stats.totalImages}`);
    console.log(`Images successful: ${this.stats.successfulImages}`);
    console.log(`Images failed: ${this.stats.failedImages}`);
    
    if (this.stats.totalSizeSaved > 0) {
      console.log(`Total space saved: ${this.formatBytes(this.stats.totalSizeSaved)}`);
    }
    
    const successRate = this.stats.totalImages > 0 ? 
      Math.round((this.stats.successfulImages / this.stats.totalImages) * 100) : 0;
    console.log(`Success rate: ${successRate}%`);
  }

  /**
   * Main execution function
   */
  async run() {
    try {
      const options = this.parseArgs();
      
      if (options.help) {
        this.showHelp();
        return;
      }
      
      await this.connectDatabase();
      
      if (options.statsOnly) {
        await this.showStats();
      } else {
        await this.runMigration(options);
      }
      
    } catch (error) {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    } finally {
      await mongoose.disconnect();
      console.log('\n👋 Disconnected from MongoDB');
    }
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  const runner = new MigrationRunner();
  runner.run();
}

module.exports = MigrationRunner;