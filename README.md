# أدوات محمد صبري للمسوّقين

**تطوير: محمد صبري | Mohamed Sabry** · الموقع: https://tools.mohammedsabry.site

14 أداة مجانية، مترتبة على المراحل التمانية للـ **Market-to-Measurement Framework**. كل أداة إضافة كروم لوحدها و/أو أداة شغالة على الموقع، ومعاهم نسخة مجمّعة اسمها Marketer's Toolkit.

| المرحلة | الأداة | بتعمل إيه | إضافة | أونلاين |
|---|---|---|:-:|:-:|
| 02 فهم السوق | **ContactHarvest** | أرقام واتساب ← Excel | ✓ | |
| 02 فهم السوق | **AdVault** | أرشيف إعلانات المنافسين من Meta Ad Library | ✓ | |
| 02 فهم السوق | **PixelScope** | أكواد التتبع وSEO لأي موقع | ✓ | |
| 03 التشخيص | **GrowthScore** | تقييم التسويق من 100 + أولويات + تقرير PDF | | ✓ |
| 05 بناء القيمة | **DiscountCheck** | الخصم ده مكسب ولا خسارة؟ | ✓ | ✓ |
| 06 تصميم الخطة | **IdeaDrop** | حفظ أي فكرة على Notion بضغطة | ✓ | |
| 07 منظومة التنفيذ | **ReplyKit** | ردود جاهزة في واتساب ويب باسم العميل | ✓ | |
| 07 منظومة التنفيذ | **ChatCRM** | تصنيف العملاء وتذكير بالمتابعة جوه واتساب ويب | ✓ | |
| 07 منظومة التنفيذ | **ChatLink QR** | لينك wa.me برسالة وكود حملة + QR | ✓ | ✓ |
| 07 منظومة التنفيذ | **BriefBuilder** | بريف المحتوى بالـ 16 بند + برومت التصميم | ✓ | ✓ |
| 07 منظومة التنفيذ | **PostCheck** | مراجعة الكابشن قبل النشر | ✓ | ✓ |
| 07 منظومة التنفيذ | **SocialSizer** | صورة واحدة ← كل مقاسات السوشيال | ✓ | ✓ |
| 08 القياس والتطوير | **UTM Studio** | لينكات UTM بنظام تسمية ثابت | ✓ | ✓ |
| 08 القياس والتطوير | **CampaignMath** | مؤشرات الحملة والميزانية من الهدف | ✓ | ✓ |

المراحل 01 (ربط التسويق بالبيزنس) و04 (اختيار السوق) أدواتها لسه جاية.

## هيكل الريبو
```
toolkit/                الكود الأساسي لكل الأدوات (وهو نفسه النسخة المجمّعة)
toolkit/lib/framework.js   المراحل التمانية (مصدر واحد للموقع والأدوات)
tools.config.js         تعريف كل أداة: الاسم، والمرحلة، والوصف، والصلاحيات
scripts/build.js        بيبني كل أداة كإضافة منفصلة ← dist/ و site/downloads/
scripts/build-site.js   بيبني صفحات الموقع ← site/
site/                   الموقع (جاهز للرفع، شوف DEPLOY.md)
brand/                  اللوجو (الأصلي + نسخة للخلفيات الفاتحة + أيقونة)
tests/                  اختبارات تلقائية (Playwright + كروم حقيقي)
```

## البناء
```
node scripts/build.js && node scripts/build-site.js
```

## الاختبارات
```
PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1 node tests/toolkit.e2e.js    # أدوات الإضافة على صفحات تجريبية
node tests/standalone.e2e.js                                                 # كل إضافة منفصلة بتتحمّل وتفتح
node tests/site.e2e.js                                                       # الموقع (محتاج سيرفر على :8790، أو SITE=https://...)
PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1 node tests/newtools.e2e.js   # DiscountCheck وSocialSizer وBriefBuilder وGrowthScore
PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1 node tests/shots.js          # صور الموقع
```

## إضافة أداة جديدة
1. اكتب الأداة في `toolkit/tools/<id>.js` (أو `content/` لو بتشتغل جوه موقع).
2. عرّفها في `tools.config.js`: الاسم، والمرحلة (`stage`)، والوصف، والصلاحيات. ولو على الموقع بس حط `extension: false`.
3. اعمل أيقونة `toolkit/icons/tools/<id>.svg` وصدّرها PNG.
4. ضيفها في `toolkit/app.html` (السكريبت + اللينك في القايمة).
5. `node scripts/build.js && node scripts/build-site.js`.
