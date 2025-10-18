# 🔧 Kategoriyalarni Birlashtirish

## Muammo
Database da kategoriya nomlari aralash:
- `xoz-mag` (142 ta) + `Xoz-Mag` (1 ta)
- `elektrika` (20 ta) + `Elektrika` (1 ta)

## Yechim 1: Node.js Script (Tavsiya etiladi)

```bash
cd backend
node scripts/normalize-categories.js
```

Bu script barcha kategoriya nomlarini lowercase ga o'zgartiradi.

## Yechim 2: MongoDB Shell

Agar MongoDB Compass yoki mongo shell ishlatayotgan bo'lsangiz:

```javascript
// Xoz-Mag → xoz-mag
db.products.updateMany(
  { category: "Xoz-Mag" },
  { $set: { category: "xoz-mag" } }
)

// Elektrika → elektrika
db.products.updateMany(
  { category: "Elektrika" },
  { $set: { category: "elektrika" } }
)
```

## Yechim 3: Backend API orqali

Agar script ishlamasa, backend da endpoint yarating:

```javascript
// backend/routes/adminRoutes.js
router.post('/normalize-categories', async (req, res) => {
  const categories = await Product.distinct('category');
  
  for (const category of categories) {
    const normalized = category.toLowerCase();
    if (category !== normalized) {
      await Product.updateMany(
        { category: category },
        { $set: { category: normalized } }
      );
    }
  }
  
  res.json({ message: 'Categories normalized' });
});
```

Keyin:
```bash
curl -X POST http://localhost:5000/api/admin/normalize-categories
```

## Test Qilish

Script ishga tushgandan keyin:

1. Backend ni restart qiling
2. Frontend ni restart qiling
3. Browser da test qiling

**Kutilayotgan natija:**
```
Xoz-Mag (143 ta)          # Birlashtirildi
Dekorativ-mahsulotlar (30 ta)
Yevro-Remont (26 ta)
Elektrika (21 ta)         # Birlashtirildi
Santexnika (2 ta)
```

## Agar Script Ishlamasa

MongoDB connection string ni tekshiring:

```bash
# backend/.env da
MONGODB_URI=mongodb://localhost:27017/alibobo
```

Yoki MongoDB ishlayotganini tekshiring:

```bash
# MongoDB statusini tekshirish
mongod --version
```

---

## Status: ⏳ SCRIPT NI ISHGA TUSHIRING

```bash
cd backend
node scripts/normalize-categories.js
```
