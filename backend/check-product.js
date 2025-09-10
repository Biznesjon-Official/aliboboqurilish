const mongoose = require('mongoose');
require('dotenv').config({ path: './.env.development' });

async function checkProduct() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const product = await Product.findOne({ _id: '68b993d78f75eac835b708ce' });
  console.log('Product image:', product.image);
  console.log('Product images:', product.images);
  await mongoose.disconnect();
}

checkProduct().catch(console.error);