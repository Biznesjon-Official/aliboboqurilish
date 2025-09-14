const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './backend/.env.development' });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

// Rollback functions
const convertBase64ToFile = async (base64Data, productId, imageType) => {
    try {
        // Extract base64 data
        const matches = base64Data.match(/^data:image\/([^;]+);base64,(.+)$/);
        if (!matches) {
            throw new Error('Invalid base64 format');
        }

        const [, mimeType, data] = matches;
        const extension = mimeType === 'jpeg' ? 'jpeg' : mimeType;

        // Generate filename
        const timestamp = Date.now();
        const filename = `${productId}_${imageType}_${timestamp}.${extension}`;
        const filePath = path.join(__dirname, '..', 'uploads', 'products', filename);

        // Ensure directory exists
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });

        // Convert and save
        const buffer = Buffer.from(data, 'base64');
        await fs.writeFile(filePath, buffer);

        return `/uploads/products/${filename}`;
    } catch (error) {
        console.error(`Failed to convert base64 to file: ${error.message}`);
        return null;
    }
};

// Rollback single product
const rollbackProduct = async (product) => {
    let hasChanges = false;
    let convertedCount = 0;
    let errorCount = 0;

    console.log(`\n🔄 Rolling back: ${product.name}`);
    console.log(`  ID: ${product._id}`);

    // Rollback main image
    if (product.image && product.image.startsWith('data:image/')) {
        console.log(`  📸 Converting main image back to file...`);
        const filePath = await convertBase64ToFile(product.image, product._id, 'main');
        if (filePath) {
            product.image = filePath;
            hasChanges = true;
            convertedCount++;
            console.log(`  ✅ Main image: ${filePath}`);
        } else {
            errorCount++;
            console.log(`  ❌ Main image conversion failed`);
        }
    } else if (product.image && product.image.startsWith('/uploads/')) {
        console.log(`  ✅ Main image already file path`);
    } else {
        console.log(`  ⚠️  Main image: ${product.image ? 'Unknown format' : 'None'}`);
    }

    // Rollback images array
    if (product.images && product.images.length > 0) {
        console.log(`  📸 Converting ${product.images.length} images in array...`);
        const newImages = [];

        for (let i = 0; i < product.images.length; i++) {
            const imageData = product.images[i];

            if (imageData && imageData.startsWith('data:image/')) {
                console.log(`    [${i}] Converting base64 to file...`);
                const filePath = await convertBase64ToFile(imageData, product._id, `image_${i}`);
                if (filePath) {
                    newImages.push(filePath);
                    convertedCount++;
                    console.log(`    [${i}] ✅ Converted: ${filePath}`);
                } else {
                    errorCount++;
                    console.log(`    [${i}] ❌ Conversion failed`);
                }
            } else if (imageData && imageData.startsWith('/uploads/')) {
                newImages.push(imageData);
                console.log(`    [${i}] ✅ Already file path`);
            } else if (imageData) {
                console.log(`    [${i}] ⚠️  Unknown format: ${imageData.substring(0, 50)}...`);
            }
        }

        // Update images array if there were changes
        if (newImages.length !== product.images.length ||
            newImages.some((img, idx) => img !== product.images[idx])) {
            product.images = newImages;
            hasChanges = true;
            console.log(`  🔄 Images array updated: ${newImages.length} images`);
        }
    } else {
        console.log(`  📷 No images in array`);
    }

    return { hasChanges, convertedCount, errorCount };
};

// Main rollback function
async function rollbackBase64Migration() {
    let totalProcessed = 0;
    let totalConverted = 0;
    let totalErrors = 0;
    let totalUpdated = 0;

    try {
        console.log('🔄 Starting Base64 Migration Rollback...');
        console.log('📡 Connecting to MongoDB...');

        await client.connect();
        const db = client.db('alibobo');
        const collection = db.collection('products');

        // Get total count
        const totalCount = await collection.countDocuments();
        console.log(`📊 Found ${totalCount} products to process`);

        if (totalCount === 0) {
            console.log('⚠️  No products found in database');
            return;
        }

        // Create backup before rollback
        console.log('\n💾 Creating backup...');
        const backupCollection = `products_backup_${Date.now()}`;
        await db.collection('products').aggregate([
            { $out: backupCollection }
        ]).toArray();
        console.log(`✅ Backup created: ${backupCollection}`);

        // Process products in batches
        const batchSize = 10;
        let skip = 0;

        while (skip < totalCount) {
            console.log(`\n📦 Processing batch ${Math.floor(skip / batchSize) + 1}/${Math.ceil(totalCount / batchSize)}`);

            const products = await collection.find({})
                .skip(skip)
                .limit(batchSize)
                .toArray();

            for (const product of products) {
                const result = await rollbackProduct(product);
                totalProcessed++;
                totalConverted += result.convertedCount;
                totalErrors += result.errorCount;

                // Save changes if any
                if (result.hasChanges) {
                    try {
                        await collection.updateOne(
                            { _id: product._id },
                            {
                                $set: {
                                    image: product.image,
                                    images: product.images
                                }
                            }
                        );
                        totalUpdated++;
                        console.log(`  💾 Saved changes to database`);
                    } catch (error) {
                        console.log(`  ❌ Database save error: ${error.message}`);
                        totalErrors++;
                    }
                } else {
                    console.log(`  ⏭️  No changes needed`);
                }
            }

            skip += batchSize;

            // Progress update
            console.log(`\n📈 Progress: ${totalProcessed}/${totalCount} products processed`);
        }

    } catch (error) {
        console.error('💥 Rollback error:', error.message);
    } finally {
        await client.close();
        console.log('\n👋 Disconnected from MongoDB');
    }

    // Final summary
    console.log('\n🎉 Base64 Migration Rollback Complete!');
    console.log(`✅ Processed: ${totalProcessed} products`);
    console.log(`🔄 Updated: ${totalUpdated} products`);
    console.log(`📸 Converted: ${totalConverted} images`);
    console.log(`❌ Errors: ${totalErrors} images`);

    if (totalErrors > 0) {
        console.log('\n⚠️  Some images could not be converted. Check the logs above for details.');
    }

    if (totalConverted > 0) {
        console.log('\n🎊 Images successfully rolled back to file paths!');
        console.log('🗂️  Files saved to uploads/products/ directory');
    }
}

// Verify rollback
async function verifyRollback() {
    try {
        console.log('\n🔍 Verifying rollback...');

        await client.connect();
        const db = client.db('alibobo');
        const collection = db.collection('products');

        const stats = await collection.aggregate([
            {
                $project: {
                    hasBase64MainImage: { $regexMatch: { input: "$image", regex: "^data:image/" } },
                    hasBase64InArray: {
                        $anyElementTrue: {
                            $map: {
                                input: "$images",
                                as: "img",
                                in: { $regexMatch: { input: "$$img", regex: "^data:image/" } }
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    productsWithBase64Main: { $sum: { $cond: ["$hasBase64MainImage", 1, 0] } },
                    productsWithBase64Array: { $sum: { $cond: ["$hasBase64InArray", 1, 0] } }
                }
            }
        ]).toArray();

        if (stats.length > 0) {
            const stat = stats[0];
            console.log(`📊 Rollback verification:`);
            console.log(`  Total products: ${stat.totalProducts}`);
            console.log(`  Products with base64 main image: ${stat.productsWithBase64Main}`);
            console.log(`  Products with base64 in array: ${stat.productsWithBase64Array}`);

            if (stat.productsWithBase64Main === 0 && stat.productsWithBase64Array === 0) {
                console.log(`✅ Rollback successful - no base64 images remaining`);
            } else {
                console.log(`⚠️  Rollback incomplete - some base64 images still exist`);
            }
        }

    } catch (error) {
        console.error('Verification error:', error.message);
    } finally {
        await client.close();
    }
}

// Command line interface
if (require.main === module) {
    const command = process.argv[2];

    if (command === 'verify') {
        verifyRollback().catch(console.error);
    } else {
        rollbackBase64Migration().catch(console.error);
    }
}

module.exports = {
    rollbackBase64Migration,
    verifyRollback,
    convertBase64ToFile
};