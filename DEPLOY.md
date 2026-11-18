# رفع الموقع على tools.mohammedsabry.site

الموقع كله صفحات ثابتة (HTML وCSS وJS) جوه فولدر `site/`، ومش محتاج سيرفر ولا قاعدة بيانات. يعني ينفع يترفع على أي استضافة.

## قبل الرفع: اللوجو
حط اللوجو بتاعك في `site/assets/logo.svg` (أو `logo.png`)، وبعدين شغّل:
```
node scripts/build-site.js
```
الصفحات كلها هتستخدم اللوجو بدل اللوجو المؤقت.

## الطريقة 1: Netlify (مجاني، والأسهل)
1. ادخل [app.netlify.com/drop](https://app.netlify.com/drop) واعمل حساب.
2. اسحب فولدر `site` كله وارميه في الصفحة. هيطلعلك لينك زي `random-name.netlify.app`.
3. من **Domain management** ← **Add a domain** ← اكتب `tools.mohammedsabry.site`.
4. في لوحة الدومين بتاعك (المكان اللي اشتريت منه mohammedsabry.site) اعمل سجل DNS:
   | Type | Name | Value |
   |---|---|---|
   | CNAME | `tools` | `random-name.netlify.app` |
5. استنى من دقايق لساعة. Netlify هيعمل HTTPS لوحده.

## الطريقة 2: Cloudflare Pages (مجاني)
نفس الفكرة: **Workers & Pages** ← **Create** ← **Pages** ← **Upload assets** ← ارفع فولدر `site`، وبعدين **Custom domains** ← `tools.mohammedsabry.site`. ولو الدومين أصلًا على Cloudflare، سجل الـ DNS بيتعمل لوحده.

## الطريقة 3: نفس استضافة الموقع الرئيسي (cPanel / Hostinger)
1. من لوحة الاستضافة اعمل **Subdomain** اسمه `tools`.
2. افتح **File Manager** وادخل فولدر الـ subdomain (غالبًا `public_html/tools`).
3. ارفع **محتويات** فولدر `site` (مش الفولدر نفسه)، يعني `index.html` يبقى على طول جوه فولدر الـ subdomain.
4. فعّل SSL للـ subdomain من لوحة الاستضافة.

## لو غيّرت اسم الـ subdomain
غيّر `SITE_URL` في `tools.config.js` وبعدين:
```
node scripts/build.js && node scripts/build-site.js
```

## بعد أي تعديل في الأدوات
```
node scripts/build.js        # بيبني الإضافات + ملفات الـ zip في site/downloads
node scripts/build-site.js   # بيبني صفحات الموقع
```
وبعدين ارفع فولدر `site` تاني.
