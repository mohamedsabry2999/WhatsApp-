// تعريف كل أداة: بيستخدمه سكريبت البناء (الإضافات المنفصلة) والموقع.
// غيّر الاسم أو الوصف هنا وهيتغيّر في الإضافة والموقع مع بعض.
const VERSION = '1.1.0';
const FRAMEWORK = require('./toolkit/lib/framework.js');
const AUTHOR = 'محمد صبري | Mohamed Sabry';
// رابط الموقع (غيّره لو اخترت subdomain تاني)
const SITE_URL = 'https://tools.mohammedsabry.site';

// ===== بيانات التواصل =====
// أي حاجة فاضية هنا الزرار بتاعها بيستخبى (والزرار بيودّي على الموقع الرئيسي بدلها).
// whatsapp: الرقم بالصيغة الدولية من غير + ولا مسافات، مثلًا '201001234567'
const CONTACT = {
  whatsapp: '',
  linkedin: '',   // مثلًا 'https://www.linkedin.com/in/username'
  email: '',
  mainSite: 'https://mohammedsabry.site',
};

// ===== الإحصائيات =====
// Cloudflare Web Analytics (مجاني ومن غير كوكيز): حط الـ token هنا وهيتضاف لكل الصفحات.
// لو فاضي، الموقع مفيهوش أي تتبع خالص.
const ANALYTICS = { cloudflareToken: '' };

// ===== سجل التحديثات (بيظهر في صفحة "التحديثات") =====
const CHANGELOG = [
  { version: '1.1.0', date: '2026-11-18', notes: ['4 أدوات جديدة: BriefBuilder، و DiscountCheck، و GrowthScore، و SocialSizer', 'الأدوات بقت مترتبة على المراحل التمانية للـ Market-to-Measurement Framework', 'لوجو وألوان الهوية الرسمية', 'لينك "تحديثات" جوه كل إضافة'] },
  { version: '1.0.0', date: '2026-11-18', notes: ['أول إصدار: 10 أدوات + Marketer\'s Toolkit'] },
];

// عناوين SEO بالكلمات اللي الناس بتدوّر بيها
const SEO = {
  contactharvest: 'تصدير أرقام واتساب لإكسيل',
  replies: 'ردود جاهزة لواتساب ويب',
  crm: 'CRM مجاني لواتساب ويب',
  walink: 'عمل لينك واتساب و QR Code',
  post: 'مراجعة الكابشن وعدد الحروف والهاشتاجات',
  ads: 'حفظ إعلانات المنافسين من مكتبة إعلانات فيسبوك',
  inspect: 'كشف Facebook Pixel وأكواد التتبع لأي موقع',
  utm: 'UTM Builder بالعربي',
  calc: 'حاسبة CPL و ROAS وميزانية الإعلانات',
  notion: 'حفظ أي فكرة على Notion بضغطة',
  brief: 'بريف محتوى وبرومت تصميم جاهز',
  discount: 'حاسبة الخصم والربح',
  audit: 'تقييم التسويق لشركتك مجانًا',
  resizer: 'مقاسات صور السوشيال ميديا',
};

const ALL_OFF = { replies: false, crm: false, ads: false, notion: false, utm: false, qr: false, harvest: false, inspect: false };

const tools = [
  {
    id: 'contactharvest', stage: 'intel', name: 'ContactHarvest', nameHtml: 'Contact<span>Harvest</span>', category: 'واتساب',
    tagline: 'كل أرقام واتساب اللي اتراسلت معاها في شيت Excel',
    description: 'بتجمع كل الأرقام اللي اتراسلت معاها على واتساب ويب في شيت واحد: الاسم ورقم التليفون، وآخر محادثة، والجروبات المشتركة. وبتجيب الاسم حتى للأرقام اللي مش متسجلة عندك.',
    bullets: ['الاسم + الرقم + آخر محادثة', 'أسماء غير المسجّلين من رسايلهم', 'الجروبات المشتركة مع كل شخص', 'Excel أو CSV بضغطة'],
    where: 'web.whatsapp.com',
    web: false,
    features: { harvest: true },
    tools: [], popup: 'harvest',
    permissions: ['scripting', 'activeTab'], hosts: ['https://web.whatsapp.com/*'], content: [],
  },
  {
    id: 'replies', stage: 'execution', name: 'ReplyKit', nameHtml: 'Reply<span>Kit</span>', category: 'واتساب',
    tagline: 'ردود جاهزة في واتساب ويب باسم العميل',
    description: 'اكتب / في واتساب ويب وبعدها الاختصار (زي /سعر)، والرد يتكتب لوحده وفيه اسم العميل. إنت اللي بتدوس إرسال، فمفيش أي خطر على رقمك.',
    bullets: ['اختصارات زي /سعر و /متابعة', 'متغيرات: {الاسم} {الاسم_الأول} {اليوم}', 'Enter للاختيار من غير ما الرسالة تتبعت', 'إدارة الردود من صفحة واحدة'],
    where: 'web.whatsapp.com',
    web: false,
    features: { replies: true },
    tools: ['replies'], home: 'replies', welcome: 'replies',
    permissions: ['storage'], hosts: [], content: ['whatsapp'],
  },
  {
    id: 'crm', stage: 'execution', name: 'ChatCRM', nameHtml: 'Chat<span>CRM</span>', category: 'واتساب',
    tagline: 'CRM صغير جوه واتساب ويب',
    description: 'زرار جوه واتساب ويب بتصنّف بيه كل عميل (محتمل، مهتم، عميل...) وتكتب ملاحظاتك، وتحدد ميعاد متابعة يجيلك عليه إشعار. وكل عميل بيظهر جنب اسمه تاج بلونه.',
    bullets: ['تصنيفات قابلة للتعديل', 'تذكير بالمتابعة كإشعار', 'تاج ملوّن جنب اسم الشات', 'لوحة كاملة + تصدير Excel'],
    where: 'web.whatsapp.com',
    web: false,
    features: { crm: true },
    tools: ['crm'], home: 'crm',
    permissions: ['storage', 'alarms', 'notifications'], hosts: ['https://web.whatsapp.com/*'], content: ['whatsapp'],
  },
  {
    id: 'walink', stage: 'execution', name: 'ChatLink QR', nameHtml: 'ChatLink <span>QR</span>', category: 'واتساب',
    tagline: 'لينك واتساب برسالة جاهزة + QR لكل حملة',
    description: 'اعمل لينك wa.me برسالة جاهزة وكود حملة، عشان تعرف كل رسالة جاتلك من أنهي إعلان. ومعاه QR بالأسود أو الأحمر جاهز للطباعة. وكمان QR لأي لينك تاني.',
    bullets: ['بيظبط الرقم المصري لوحده', 'كود الحملة جوه الرسالة', 'QR بصيغة PNG و SVG', 'مكتبة لكل لينكاتك'],
    where: 'أي مكان',
    web: true,
    features: { qr: true },
    tools: ['walink'], home: 'walink',
    permissions: ['storage', 'contextMenus'], hosts: [], content: [],
  },
  {
    id: 'post', stage: 'execution', name: 'PostCheck', nameHtml: 'Post<span>Check</span>', category: 'محتوى',
    tagline: 'راجع الكابشن قبل ما تنشر',
    description: 'بيراجع الكابشن على حدود كل منصة: الطول، والـ Hook، والهاشتاجات المتكررة أو الزيادة، ووجود CTA، والنص على التصميم (من 3 لـ 12 كلمة). وبيوريك البوست هيظهر إزاي قبل "المزيد".',
    bullets: ['Instagram, Facebook, LinkedIn, X, TikTok', 'معاينة قبل "المزيد"', 'مكتبة CTA وهاشتاجات', 'بيحفظ المسودة لوحده'],
    where: 'أي مكان',
    web: true,
    features: {},
    tools: ['post'], home: 'post',
    permissions: ['storage'], hosts: [], content: [],
  },
  {
    id: 'ads', stage: 'intel', name: 'AdVault', nameHtml: 'Ad<span>Vault</span>', category: 'محتوى',
    tagline: 'أرشيف لإعلانات المنافسين من Meta Ad Library',
    description: 'زرار "احفظ في الأرشيف" على كل إعلان في Meta Ad Library، بيحفظه بالصورة والنص وتاريخ البداية. وتقدر تضيف ملاحظاتك عن الزاوية والعرض، وتضيف إعلانات من أي منصة تانية بإيدك.',
    bullets: ['حفظ بضغطة من Ad Library', 'الصورة محفوظة عندك', 'فلترة حسب المنافس', 'تصدير Excel'],
    where: 'facebook.com/ads/library',
    web: false,
    features: { ads: true },
    tools: ['ads'], home: 'ads',
    permissions: ['storage', 'unlimitedStorage'], hosts: ['https://www.facebook.com/ads/library/*', 'https://*.fbcdn.net/*'], content: ['ads'],
  },
  {
    id: 'inspect', stage: 'intel', name: 'PixelScope', nameHtml: 'Pixel<span>Scope</span>', category: 'تحليل',
    tagline: 'اعرف أي موقع بيستخدم أنهي Pixel وأكواد تتبع',
    description: 'افتح أي موقع ودوس الأيقونة: هيطلعلك Meta Pixel، و GA4، و GTM، و Google Ads، و TikTok، و Snap، و LinkedIn، و Clarity، و Hotjar بأرقام الـ ID. ومعاهم تقرير SEO سريع وشكل اللينك لما يتشارك.',
    bullets: ['+12 أداة تتبع بأرقام الـ ID', 'المنصة (Shopify، WordPress، Salla...)', 'Title و Description و H1 و Schema', 'نسخ التقرير بضغطة'],
    where: 'أي موقع',
    web: false,
    features: { inspect: true },
    tools: [], popup: 'inspect',
    permissions: ['scripting', 'activeTab'], hosts: [], content: [],
  },
  {
    id: 'utm', stage: 'measure', name: 'UTM Studio', nameHtml: 'UTM <span>Studio</span>', category: 'تحليل',
    tagline: 'لينكات UTM بنظام تسمية ثابت',
    description: 'بيعمل لينكات UTM بنظام تسمية واحد (حروف صغيرة ومن غير مسافات)، وفيه قوالب Meta و TikTok الديناميك ومكتبة لكل حملاتك. ومعاه QR للمطبوعات وتصدير Excel.',
    bullets: ['تسمية موحّدة تلقائيًا', 'قوالب Meta و TikTok الديناميك', 'بيحافظ على باراميترات اللينك', 'مكتبة + QR + Excel'],
    where: 'أي مكان',
    web: true,
    features: { utm: true },
    tools: ['utm'], home: 'utm',
    permissions: ['storage', 'contextMenus', 'activeTab'], hosts: [], content: [],
  },
  {
    id: 'calc', stage: 'measure', name: 'CampaignMath', nameHtml: 'Campaign<span>Math</span>', category: 'تحليل',
    tagline: 'كل مؤشرات الحملة + الميزانية من الهدف',
    description: 'حط أرقام الحملة يطلعلك CPM، و CTR، و CPC، و CPL، و CAC، و ROAS، و ROI. أو ابدأ من عدد العملاء اللي محتاجهم، وهو يقولّك الميزانية المطلوبة ويقسّمها على المنصات.',
    bullets: ['10 مؤشرات في ثانية', 'الميزانية من الهدف', 'تقسيم على المنصات', 'ج.م / ر.س / د.إ / $'],
    where: 'أي مكان',
    web: true,
    features: {},
    tools: ['calc'], home: 'calc',
    permissions: ['storage'], hosts: [], content: [],
  },
  {
    id: 'notion', stage: 'plan', name: 'IdeaDrop', nameHtml: 'Idea<span>Drop</span>', category: 'محتوى',
    tagline: 'احفظ أي فكرة على Notion بضغطة',
    description: 'أي صفحة أو نص أو صورة عجبتك، احفظها في قاعدة بيانات المحتوى على Notion، من الأيقونة أو بكليك يمين. وبتتحفظ معاها ملاحظتك واللينك وتاريخ الحفظ.',
    bullets: ['كليك يمين ← احفظ على Notion', 'النص المحدد + الصورة + اللينك', 'بيملا أعمدة الحالة والتاريخ', 'مفتاح Notion مجاني'],
    where: 'أي موقع',
    web: false,
    features: { notion: true },
    tools: ['notion'], home: 'notion', popup: 'notion', welcome: 'notion',
    permissions: ['storage', 'contextMenus', 'activeTab', 'scripting'], hosts: ['https://api.notion.com/*'], content: [],
  },
  {
    id: 'brief', stage: 'execution', name: 'BriefBuilder', nameHtml: 'Brief<span>Builder</span>', category: 'محتوى',
    tagline: 'بريف المحتوى الكامل + برومت التصميم في دقيقة',
    description: 'بريف لكل بوست بالـ 16 بند: الفكرة، والجمهور، والـ Hook، ونص التصميم، والاستعارة البصرية، والكابشن، والـ CTA. وبيكتبلك برومت التصميم كامل بنفس الترتيب كل مرة، وبيراجع البريف قبل ما تبعته.',
    bullets: ['16 بند ثابتين في كل بريف', 'برومت تصميم جاهز للمصمم أو الـ AI', 'مراجعة الـ Hook ونص التصميم', 'مكتبة + Markdown + Notion'],
    where: 'أي مكان', web: true,
    features: {}, tools: ['brief'], home: 'brief',
    permissions: ['storage'], hosts: [], content: [],
  },
  {
    id: 'discount', stage: 'value', name: 'DiscountCheck', nameHtml: 'Discount<span>Check</span>', category: 'تحليل',
    tagline: 'الخصم ده مكسب ولا خسارة؟',
    description: 'حط السعر والتكلفة ونسبة الخصم، وهي تقولّك لازم تبيع قد إيه زيادة عشان تطلع بنفس المكسب، وأقصى خصم تقدر تعمله. وتقدر تنسخ النتيجة كبوست جاهز.',
    bullets: ['المبيعات الإضافية المطلوبة', 'هامش الربح قبل وبعد', 'جدول لكل نسب الخصم', 'نقطة التعادل'],
    where: 'أي مكان', web: true,
    features: {}, tools: ['discount'], home: 'discount',
    permissions: ['storage'], hosts: [], content: [],
  },
  {
    id: 'audit', stage: 'diagnosis', name: 'GrowthScore', nameHtml: 'Growth<span>Score</span>', category: 'تحليل',
    tagline: 'قيّم تسويق شركتك من 100 في 5 دقايق',
    description: '24 سؤال على المراحل التمانية للـ Market-to-Measurement Framework. في الآخر بيطلعلك تقييم من 100، ونقط الضعف بالترتيب، وتوصية لكل مرحلة، وتقرير تقدر تطبعه أو تحفظه PDF.',
    bullets: ['8 مراحل × 3 أسئلة', 'تقييم من 100 لكل مرحلة', 'أهم 3 أولويات تبدأ بيها', 'تقرير PDF'],
    where: 'على الموقع', web: true, extension: false,
    features: {}, tools: ['audit'], home: 'audit',
    permissions: [], hosts: [], content: [],
  },
  {
    id: 'resizer', stage: 'execution', name: 'SocialSizer', nameHtml: 'Social<span>Sizer</span>', category: 'محتوى',
    tagline: 'صورة واحدة ← كل مقاسات السوشيال',
    description: 'ارفع صورة واحدة وخدها بكل مقاسات المنصات (Post، و Story، و Cover، و Thumbnail...) مرة واحدة. فيه قص ذكي بتحدد فيه منتصف الصورة، أو ملء بخلفية. والصورة مش بتترفع على أي سيرفر.',
    bullets: ['+14 مقاس جاهز', 'قص أو ملء بخلفية', 'تحديد منتصف الصورة', 'تحميل الكل في ZIP'],
    where: 'أي مكان', web: true,
    features: {}, tools: ['resizer'], home: 'resizer',
    permissions: ['storage'], hosts: [], content: [],
  },
];

const bundle = {
  id: 'toolkit', stage: '', name: "Marketer's Toolkit", nameHtml: "Marketer's <span>Toolkit</span>", category: 'الكل',
  tagline: 'كل الأدوات في إضافة واحدة',
  description: 'كل الأدوات في إضافة واحدة: واتساب، والمحتوى، والتحليل. للي عايز كله من غير ما ينزّل عشر إضافات.',
  bullets: ['كل أدوات الإضافات', 'لوحة واحدة لكل حاجة', 'نفس البيانات في كل الأدوات'],
  web: false,
  features: { replies: true, crm: true, ads: true, notion: true, utm: true, qr: true, harvest: true, inspect: true },
  tools: ['replies', 'crm', 'walink', 'post', 'brief', 'resizer', 'ads', 'notion', 'utm', 'calc', 'discount'], home: 'replies', popup: 'home',
  permissions: ['storage', 'unlimitedStorage', 'alarms', 'notifications', 'scripting', 'activeTab', 'contextMenus'],
  hosts: ['https://web.whatsapp.com/*', 'https://www.facebook.com/ads/library/*', 'https://*.fbcdn.net/*', 'https://api.notion.com/*'],
  content: ['whatsapp', 'ads'],
};

module.exports = { VERSION, AUTHOR, SITE_URL, FRAMEWORK, CONTACT, ANALYTICS, CHANGELOG, SEO, tools, bundle, ALL_OFF };
