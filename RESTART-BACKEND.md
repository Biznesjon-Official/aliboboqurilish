# 🔄 Backend ni Restart Qiling

## Muammo
Elektrika, Dekor, Santexnika kategoriyalarida mahsulotlar chiqmayapti.

## Sabab
Backend da `/api/filters` route qo'shildi, lekin backend restart qilinmagan.

## Yechim
Backend ni restart qiling:

```bash
# Backend terminalda Ctrl+C bosing
# Keyin qaytadan ishga tushiring:
cd backend
npm start
```

## Test Qilish

Backend ishga tushgandan keyin:

```bash
# Browser da test qiling:
http://localhost:3000

# Har bir kategoriyani tanlang:
# - Elektrika
# - Dekor
# - Santexnika
```

## Debug

Agar hali ham ishlamasa, browser console ni oching (F12) va quyidagilarni tekshiring:

1. **Category clicked:** - Qaysi kategoriya bosildi
2. **Mapped category:** - Qaysi kategoriya backend ga yuborildi
3. **Network tab** - API request va response

## Kutilayotgan Natija

- ✅ Elektrika: 21 ta mahsulot
- ✅ Dekor-mahsulotlar: 21 ta mahsulot  
- ✅ Santexnika: 2 ta mahsulot

---

## Status: ⏳ BACKEND NI RESTART QILING

Backend ni restart qiling va test qiling!
