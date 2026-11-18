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

## الطريقة 3: Hostinger (نفس استضافة الموقع الرئيسي)
1. **اعمل الـ subdomain:** من hPanel ادخل **Websites** ← **Manage** جنب `mohammedsabry.site` ← من القايمة الجانبية **Domains** ← **Subdomains**. اكتب `tools` ودوس **Create**. وخد بالك من اسم الفولدر اللي هيظهر جنبه (غالبًا `public_html/tools`).
2. **ارفع الملفات:** من القايمة الجانبية **Files** ← **File Manager** ← ادخل فولدر الـ subdomain. دوس **Upload** وارفع ملف `tools-site-v1.0.0.zip`.
3. **فك الضغط:** كليك يمين على الملف ← **Extract** ← سيب المكان زي ما هو (`.`) ← **Extract**. المهم إن `index.html` يبقى جوه فولدر الـ subdomain على طول، مش جوه فولدر تاني.
4. **نضّف:** امسح ملف الـ zip، وأي ملف `default.php` أو `index.php` هوستنجر حطه في الفولدر.
5. **SSL:** من **Security** ← **SSL** اتأكد إن `tools.mohammedsabry.site` عليه SSL (هوستنجر بيعمله ببلاش، وساعات بياخد لحد ساعة)، وبعدين فعّل **Force HTTPS**.
6. **جرّب:** افتح `https://tools.mohammedsabry.site` ودوس تحميل على أي أداة.

> لو الدومين مش متوصّل بـ hPanel عن طريق الـ Nameservers (يعني الـ DNS عند شركة تانية)، لازم تضيف هناك سجل `A` اسمه `tools` بنفس الـ IP اللي في hPanel (**Websites** ← **Manage** ← **Website details**).

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

## بيانات التواصل (واتساب / LinkedIn / إيميل)
عدّلها في `CONTACT` جوه `tools.config.js`، وبعدين اعمل build تاني. الخانة اللي تفضل فاضية، الزرار بتاعها بيستخبى.

## الإحصائيات (Cloudflare Web Analytics، مجاني ومن غير كوكيز)
1. اعمل حساب على Cloudflare ← **Analytics & Logs** ← **Web Analytics** ← **Add a site** ← اكتب `tools.mohammedsabry.site`.
2. انسخ الـ `token` اللي في الكود اللي هيظهرلك، وحطه في `ANALYTICS.cloudflareToken` جوه `tools.config.js`.
3. اعمل build وارفع تاني. صفحة الخصوصية بتتحدث لوحدها.

## Google Search Console (بعد الرفع)
1. ادخل [search.google.com/search-console](https://search.google.com/search-console) ← **Add property** ← **URL prefix** ← `https://tools.mohammedsabry.site/`.
2. التحقق: اختار **HTML tag**، وابعتلي الكود عشان أحطه في الموقع. أو لو الدومين على هوستنجر، اختار **Domain** وضيف سجل الـ TXT من hPanel ← DNS.
3. من **Sitemaps** ضيف `sitemap.xml`.

## التحديث على هوستنجر
امسح كل محتويات فولدر `tools` القديمة الأول، وبعدين ارفع الـ zip الجديد وفك ضغطه.
