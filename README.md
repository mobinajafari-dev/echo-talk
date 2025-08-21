# echo talk – مینیمال، لایت/دارک، PWA
- پس‌زمینه سفید با گرادیانت آبی/بنفش
- تم لایت/دارک با دکمه ساده
- لوگو بالا-چپ + عنوان «echo talk»
- دکمه میکروفون وسط صفحه (کلیک = شروع/توقف)
- هنگام مکث کاربر، ضبط خودکار متوقف می‌شود (continuous=false)
- تغییر رنگ میکروفون به قرمز و انیمیشن پالس در حالت ضبط
- Toast سفارشی برای خطاها
- نشانگر پشتیبانی Web Speech (Supported / Not supported)
- PWA و Service Worker برای آفلاین

## اجرا (لوکال)
به‌خاطر Service Worker بهتر است روی سرور محلی بالا بیاورید:
```bash
python -m http.server 5173
# یا
npx http-server -p 5173
```
سپس به http://localhost:5173 بروید.

## دیپلوی روی Netlify
کل پوشه را Deploy کنید. فایل netlify.toml برای SPA آماده است.
