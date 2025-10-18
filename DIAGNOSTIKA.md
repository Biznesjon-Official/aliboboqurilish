# Muammo Diagnostikasi

## 1. Browser Console Tekshirish

Browser Developer Tools > Console da quyidagi loglarni qidiring:

```
🔄 Sending product data: {...}
📡 Response status: 200 OK
✅ Success: {...}
```

Agar xatolik bo'lsa:
```
❌ API Error: {...}
```

## 2. Network Tab Tekshirish

Browser Developer Tools > Network da:

1. `PUT /api/products/{id}` yoki `POST /api/products` so'rovini toping
2. Status code ni tekshiring (200 = muvaffaqiyat)
3. Response ni ko'ring
4. Request payload ni tekshiring

## 3. Backend Logs

Backend console da quyidagi loglarni qidiring:

```
✅ Product updated: {id}
```

yoki

```
❌ Update product error: {...}
```

## 4. Database Tekshirish

MongoDB da mahsulot haqiqatan ham yangilanganini tekshiring:

```javascript
// MongoDB shell da
db.products.findOne({_id: ObjectId("...")})
```

## 5. Keng tarqalgan muammolar

### A. CORS xatoligi
```
Access to fetch at 'http://localhost:5000/api/products/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Yechim**: Backend CORS konfiguratsiyasini tekshiring

### B. Network xatoligi
```
TypeError: Failed to fetch
```

**Yechim**: Backend server ishlab turganini tekshiring

### C. Validation xatoligi
```
Validation failed: {...}
```

**Yechim**: Yuborilayotgan ma'lumotlarni tekshiring

### D. Database connection xatoligi
```
MongoNetworkTimeoutError
```

**Yechim**: MongoDB connection ni tekshiring

## 6. Tezkor test

Browser console da quyidagi kodni ishga tushiring:

```javascript
// Test API connection
fetch('http://localhost:5000/api/products?limit=1')
  .then(r => r.json())
  .then(data => console.log('✅ API working:', data))
  .catch(err => console.error('❌ API error:', err));

// Test product update
const testUpdate = async () => {
  const products = await fetch('http://localhost:5000/api/products?limit=1').then(r => r.json());
  const product = products.products[0];
  
  if (product) {
    const updateData = {
      ...product,
      name: product.name + ' (Test)',
      updatedAt: new Date()
    };
    
    const response = await fetch(`http://localhost:5000/api/products/${product._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    
    if (response.ok) {
      console.log('✅ Update test successful');
    } else {
      console.error('❌ Update test failed:', response.status);
    }
  }
};

testUpdate();
```