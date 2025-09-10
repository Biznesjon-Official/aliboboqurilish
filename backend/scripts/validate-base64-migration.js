const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './backend/.env.development' });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

// Validation functions
const validateBase64Image = (src) => {
  if (!src || typeof src !== 'string') {
    return { isValid: false, reason: 'Invalid input' };
  }
  
  if (!src.startsWith('data:image/')) {
    return { isValid: false, reason: 'Not a base64 image' };
  }
  
  if (src.length < 100) {
    return { isValid: false, reason: 'Data too short' };
  }
  
  const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|webp|bmp);base64,([A-Za-z0-9+/=]+)$/;
  if (!base64Pattern.test(src)) {
    return { isValid: false, reason: 'Invalid base64 format' };
  }
  
  return { isValid: true, reason: null };
};

const getBase64ImageInfo = (src) => {
  const validation = validateBase64Image(src);
  
  if (!validation.isValid) {
    return { ...validation, size: 0, type: null };
  }
  
  const matches = src.match(/^data:image\/([^;]+);base64,(.+)$/);
  if (!matches) {
    return { isValid: false, reason: 'Parse error', size: 0, type: null };
  }
  
  const [, type, data] = matches;
  const size = Math.round((data.length * 3) / 4); // Approximate size in bytes
  
  return {
    isValid: true,
    reason: null,
    type,
    size,
    sizeKB: Math.round(size / 1024),
    dataLength: data.length
  };
};

// Check if file exists
const fileExists = async (filePath) => {
  try {
    const fullPath = path.join(__dirname, '..', filePath.replace('/uploads/', 'uploads/'));
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
};

// Validation report
class ValidationReport {
  constructor() {
    this.stats = {
      totalProducts: 0,
      productsWithImages: 0,
      validBase64Images: 0,
      invalidBase64Images: 0,
      filePathImages: 0,
      missingFiles: 0,
      emptyImages: 0,
      totalImageSize: 0,
      errors: []
    };
    this.issues = [];
  }

  addIssue(type, productId, productName, details) {
    this.issues.push({
      type,
      productId,
      productName,
      details,
      timestamp: new Date().toISOString()
    });
  }

  addError(error, context) {
    this.stats.errors.push({
      error: error.message,
      context,
      timestamp: new Date().toISOString()
    });
  }

  generateSummary() {
    const { stats } = this;
    
    return {
      summary: {
        totalProducts: stats.totalProducts,
        productsWithImages: stats.productsWithImages,
        imageValidation: {
          validBase64: stats.validBase64Images,
          invalidBase64: stats.invalidBase64Images,
          filePaths: stats.filePathImages,
          missingFiles: stats.missingFiles,
          empty: stats.emptyImages
        },
        totalImageSizeMB: Math.round(stats.totalImageSize / (1024 * 1024)),
        issueCount: this.issues.length,
        errorCount: stats.errors.length
      },
      issues: this.issues,
      errors: stats.errors,
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.stats.filePathImages > 0) {
      recommendations.push({
        type: 'migration_needed',
        message: `${this.stats.filePathImages} images still use file paths and need to be converted to base64`,
        priority: 'high'
      });
    }
    
    if (this.stats.missingFiles > 0) {
      recommendations.push({
        type: 'missing_files',
        message: `${this.stats.missingFiles} file path references point to non-existent files`,
        priority: 'high'
      });
    }
    
    if (this.stats.invalidBase64Images > 0) {
      recommendations.push({
        type: 'invalid_base64',
        message: `${this.stats.invalidBase64Images} images have invalid base64 format`,
        priority: 'medium'
      });
    }
    
    if (this.stats.totalImageSize > 100 * 1024 * 1024) { // > 100MB
      recommendations.push({
        type: 'large_database',
        message: `Total image size is ${Math.round(this.stats.totalImageSize / (1024 * 1024))}MB, consider image optimization`,
        priority: 'low'
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        message: 'All images are properly formatted as base64 and validation passed',
        priority: 'info'
      });
    }
    
    return recommendations;
  }
}

// Validate single product
const validateProduct = async (product, report) => {
  const productId = product._id;
  const productName = product.name || 'Unnamed Product';
  
  try {
    // Validate main image
    if (product.image) {
      if (product.image.startsWith('data:image/')) {
        const validation = validateBase64Image(product.image);
        if (validation.isValid) {
          report.stats.validBase64Images++;
          const info = getBase64ImageInfo(product.image);
          report.stats.totalImageSize += info.size;
        } else {
          report.stats.invalidBase64Images++;
          report.addIssue('invalid_base64', productId, productName, {
            field: 'main_image',
            reason: validation.reason,
            preview: product.image.substring(0, 100) + '...'
          });
        }
      } else if (product.image.startsWith('/uploads/')) {
        report.stats.filePathImages++;
        const exists = await fileExists(product.image);
        if (!exists) {
          report.stats.missingFiles++;
          report.addIssue('missing_file', productId, productName, {
            field: 'main_image',
            path: product.image
          });
        }
      } else if (product.image.trim() === '') {
        report.stats.emptyImages++;
        report.addIssue('empty_image', productId, productName, {
          field: 'main_image'
        });
      } else {
        report.addIssue('unknown_format', productId, productName, {
          field: 'main_image',
          value: product.image.substring(0, 100) + '...'
        });
      }
    }
    
    // Validate images array
    if (product.images && Array.isArray(product.images)) {
      for (let i = 0; i < product.images.length; i++) {
        const image = product.images[i];
        
        if (!image) continue;
        
        if (image.startsWith('data:image/')) {
          const validation = validateBase64Image(image);
          if (validation.isValid) {
            report.stats.validBase64Images++;
            const info = getBase64ImageInfo(image);
            report.stats.totalImageSize += info.size;
          } else {
            report.stats.invalidBase64Images++;
            report.addIssue('invalid_base64', productId, productName, {
              field: `images[${i}]`,
              reason: validation.reason,
              preview: image.substring(0, 100) + '...'
            });
          }
        } else if (image.startsWith('/uploads/')) {
          report.stats.filePathImages++;
          const exists = await fileExists(image);
          if (!exists) {
            report.stats.missingFiles++;
            report.addIssue('missing_file', productId, productName, {
              field: `images[${i}]`,
              path: image
            });
          }
        } else if (image.trim() === '') {
          report.stats.emptyImages++;
          report.addIssue('empty_image', productId, productName, {
            field: `images[${i}]`
          });
        } else {
          report.addIssue('unknown_format', productId, productName, {
            field: `images[${i}]`,
            value: image.substring(0, 100) + '...'
          });
        }
      }
    }
    
    // Check if product has any images
    const hasImages = (product.image && product.image.trim()) || 
                     (product.images && product.images.length > 0 && product.images.some(img => img && img.trim()));
    
    if (hasImages) {
      report.stats.productsWithImages++;
    }
    
  } catch (error) {
    report.addError(error, `Product validation: ${productId} (${productName})`);
  }
};

// Main validation function
async function validateBase64Migration() {
  const report = new ValidationReport();
  
  try {
    console.log('🔍 Starting Base64 Migration Validation...');
    console.log('📡 Connecting to MongoDB...');
    
    await client.connect();
    const db = client.db('alibobo');
    const collection = db.collection('products');
    
    // Get total count
    const totalCount = await collection.countDocuments();
    report.stats.totalProducts = totalCount;
    
    console.log(`📊 Found ${totalCount} products to validate`);
    
    if (totalCount === 0) {
      console.log('⚠️  No products found in database');
      return report.generateSummary();
    }
    
    // Process products in batches
    const batchSize = 50;
    let processed = 0;
    
    while (processed < totalCount) {
      console.log(`\n📦 Processing batch ${Math.floor(processed / batchSize) + 1}/${Math.ceil(totalCount / batchSize)}`);
      
      const products = await collection.find({})
        .skip(processed)
        .limit(batchSize)
        .toArray();
      
      for (const product of products) {
        await validateProduct(product, report);
        processed++;
        
        // Progress indicator
        if (processed % 10 === 0) {
          const progress = Math.round((processed / totalCount) * 100);
          console.log(`  Progress: ${processed}/${totalCount} (${progress}%)`);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Validation error:', error.message);
    report.addError(error, 'Main validation process');
  } finally {
    await client.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
  
  return report.generateSummary();
}

// Generate detailed report
const generateDetailedReport = (summary) => {
  console.log('\n📋 VALIDATION REPORT');
  console.log('='.repeat(50));
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`Total Products: ${summary.summary.totalProducts}`);
  console.log(`Products with Images: ${summary.summary.productsWithImages}`);
  console.log(`Total Image Size: ${summary.summary.totalImageSizeMB}MB`);
  
  // Image validation breakdown
  console.log('\n🖼️  IMAGE VALIDATION:');
  const validation = summary.summary.imageValidation;
  console.log(`✅ Valid Base64: ${validation.validBase64}`);
  console.log(`❌ Invalid Base64: ${validation.invalidBase64}`);
  console.log(`📁 File Paths: ${validation.filePaths}`);
  console.log(`🚫 Missing Files: ${validation.missingFiles}`);
  console.log(`⚪ Empty Images: ${validation.empty}`);
  
  // Issues
  if (summary.issues.length > 0) {
    console.log('\n⚠️  ISSUES FOUND:');
    const issuesByType = summary.issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(issuesByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} issues`);
    });
    
    // Show first few issues as examples
    console.log('\n📝 Sample Issues:');
    summary.issues.slice(0, 5).forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue.type} - ${issue.productName} (${issue.productId})`);
      console.log(`     ${JSON.stringify(issue.details)}`);
    });
    
    if (summary.issues.length > 5) {
      console.log(`     ... and ${summary.issues.length - 5} more issues`);
    }
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  summary.recommendations.forEach((rec, index) => {
    const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : rec.priority === 'low' ? '🟢' : 'ℹ️';
    console.log(`  ${index + 1}. ${priority} ${rec.message}`);
  });
  
  // Errors
  if (summary.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    summary.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.context}: ${error.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(50));
};

// Save report to file
const saveReportToFile = async (summary) => {
  try {
    const reportPath = path.join(__dirname, `validation-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
  } catch (error) {
    console.error('Failed to save report:', error.message);
  }
};

// Main execution
async function main() {
  try {
    const summary = await validateBase64Migration();
    generateDetailedReport(summary);
    await saveReportToFile(summary);
    
    // Exit with appropriate code
    const hasHighPriorityIssues = summary.recommendations.some(rec => rec.priority === 'high');
    const hasErrors = summary.errors.length > 0;
    
    if (hasErrors) {
      console.log('\n🚨 Validation completed with errors');
      process.exit(1);
    } else if (hasHighPriorityIssues) {
      console.log('\n⚠️  Validation completed with high priority issues');
      process.exit(1);
    } else {
      console.log('\n✅ Validation completed successfully');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('💥 Validation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validateBase64Migration,
  validateBase64Image,
  getBase64ImageInfo,
  ValidationReport
};