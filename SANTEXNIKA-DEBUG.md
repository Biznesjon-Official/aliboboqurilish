# 🐛 Santexnika Debug

## Muammo
Santexnika kategoriyasida mahsulotlar chiqmayapti.

## Backend Test
Backend ishlayapti:
```
GET /api/products?category=santexnika
→ 2 ta mahsulot:
  1. Vedro Decor - 105,000 so'm
  2. Plastmas Dimaxod 15*20 - 5,000 so'm
```

## Frontend Debug

### 1. Browser Console
F12 bosing va "Santexnika" tugmasini bosing. Quyidagilarni tekshiring:

```
Category clicked: santexnika
Mapped category: santexnika → santexnika
```

### 2. Network Tab
F12 → Network → XHR tab

"Santexnika" tugmasini bosganingizda quyidagi request borligini tekshiring:
```
GET /api/products?category=santexnika&limit=10000
```

Response da 2 ta mahsulot bo'lishi kerak.

### 3. React Query Cache
React Query cache da eski ma'lumotlar bo'lishi mumkin.

**Yechim:**
```bash
# Frontend ni to'liq restart qiling
Ctrl+C
npm start

# Yoki browser cache ni tozalang
Ctrl+Shift+R
```

### 4. Hard Refresh
```
Ctrl+Shift+R
```

Yoki:
```
F12 → Network tab → "Disable cache" checkbox
```

## Ehtimoliy Muammolar

### 1. Cache Muammosi
React Query eski ma'lumotlarni cache da saqlayotgan bo'lishi mumkin.

**Yechim:** Frontend ni restart qiling

### 2. Hot Reload Ishlamayapti
Hot reload ba'zan ishlamaydi.

**Yechim:** Frontend ni restart qiling

### 3. Browser Cache
Browser eski JavaScript fayllarini ishlatayotgan bo'lishi mumkin.

**Yechim:** Ctrl+Shift+R

## Test Qilish

1. Frontend ni restart qiling
2. Browser ni yangilang (Ctrl+Shift+R)
3. "Santexnika" tugmasini bosing
4. 2 ta mahsulot ko'rinishi kerak:
   - Vedro Decor
   - Plastmas Dimaxod 15*20

## Agar Hali Ham Ishlamasa

Browser console da xatolarni tekshiring:
```
F12 → Console tab
```

Network tab da API response ni tekshiring:
```
F12 → Network → XHR → products?category=santexnika
```

---

## Status: 🔍 DEBUGGING

Frontend ni restart qiling va test qiling!
