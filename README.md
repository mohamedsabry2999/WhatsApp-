# أدوات محمد صبري للمسوّقين

**تطوير: محمد صبري | Mohamed Sabry** · الموقع: `tools.mohammedsabry.site`

10 أدوات مجانية، كل واحدة إضافة كروم لوحدها، ومعاهم نسخة مجمّعة اسمها Marketer's Toolkit، وموقع للعرض والتجربة والتحميل.

| الأداة | بتعمل إيه | أونلاين؟ |
|---|---|---|
| **ContactHarvest** | أرقام واتساب ← Excel | |
| **ReplyKit** | ردود جاهزة في واتساب ويب باسم العميل | |
| **ChatCRM** | تصنيف العملاء وتذكير بالمتابعة جوه واتساب ويب | |
| **ChatLink QR** | لينك wa.me برسالة وكود حملة + QR | ✓ |
| **PostCheck** | مراجعة الكابشن قبل النشر | ✓ |
| **AdVault** | أرشيف إعلانات المنافسين من Meta Ad Library | |
| **PixelScope** | أكواد التتبع وSEO لأي موقع | |
| **UTM Studio** | لينكات UTM بنظام تسمية ثابت | ✓ |
| **CampaignMath** | مؤشرات الحملة والميزانية من الهدف | ✓ |
| **IdeaDrop** | حفظ أي فكرة على Notion بضغطة | |

## هيكل الريبو
```
toolkit/            الكود الأساسي لكل الأدوات (وهو نفسه النسخة المجمّعة)
tools.config.js     تعريف كل أداة: الاسم، والوصف، والصلاحيات (للإضافات والموقع)
scripts/build.js        بيبني كل أداة كإضافة منفصلة ← dist/ و site/downloads/
scripts/build-site.js   بيبني صفحات الموقع ← site/
site/               الموقع (جاهز للرفع، شوف DEPLOY.md)
tests/              اختبارات تلقائية (Playwright + كروم حقيقي)
extension/          النسخة القديمة من ContactHarvest (اتستبدلت بـ dist/ContactHarvest)
```

## البناء
```
node scripts/build.js && node scripts/build-site.js
```

## الاختبارات
```
PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1 node tests/toolkit.e2e.js   # الأدوات كلها على صفحات تجريبية
node tests/standalone.e2e.js                                                # كل إضافة منفصلة بتتحمّل وتفتح
node tests/site.e2e.js                                                      # الموقع (محتاج سيرفر على :8790)
PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1 node tests/shots.js         # صور الموقع
```

## إضافة أداة جديدة
1. اكتب الأداة في `toolkit/tools/<id>.js` (أو `content/` لو بتشتغل جوه موقع).
2. عرّفها في `tools.config.js` (الاسم، والوصف، والصلاحيات).
3. اعمل أيقونة `toolkit/icons/tools/<id>.svg` وصدّرها PNG.
4. `node scripts/build.js && node scripts/build-site.js`.
