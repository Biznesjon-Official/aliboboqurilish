@echo off
echo 🔍 GOOGLE SEARCH CONSOLE SETUP UCHUN QADAMLAR
echo =============================================
echo.
echo 1. GOOGLE SEARCH CONSOLE'GA KIRISH:
echo    https://search.google.com/search-console
echo.
echo 2. PROPERTY QO'SHISH:
echo    - "Add property" tugmasini bosing
echo    - "URL prefix" ni tanlang
echo    - https://aliboboqurilish.uz ni kiriting
echo.
echo 3. VERIFICATION:
echo    - "HTML file" usulini tanlang
echo    - Faylni yuklab oling
echo    - VPS'ga yuklang: /opt/alibobo/build/ papkasiga
echo.
echo 4. VPS'DA VERIFICATION FILE YUKLASH:
echo    scp google[kod].html root@45.92.173.33:/opt/alibobo/build/
echo.
echo 5. SITEMAP YUBORISH:
echo    - Search Console'da "Sitemaps" bo'limiga kiring
echo    - sitemap.xml ni qo'shing
echo    - URL: https://aliboboqurilish.uz/sitemap.xml
echo.
echo 6. INDEXLASH UCHUN:
echo    - "URL Inspection" bo'limiga kiring
echo    - https://aliboboqurilish.uz ni kiriting
echo    - "Request indexing" ni bosing
echo.
echo 7. ROBOTS.TXT TEKSHIRISH:
echo    - https://aliboboqurilish.uz/robots.txt
echo    - Agar 404 error bo'lsa, robots.txt yarating
echo.
echo 📝 ESLATMA: Google'da chiqish uchun 2-4 hafta vaqt ketadi!
echo.
pause