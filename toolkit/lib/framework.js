// Market-to-Measurement Framework — محمد صبري
// مصدر واحد للمراحل التمانية: بيستخدمه الموقع والأدوات (Audit Scorecard، Brief Builder، ...).
var FRAMEWORK = [
  { id: 'business', n: 1, en: 'Business Alignment', ar: 'ربط التسويق بالبيزنس', desc: 'هدف تسويقي مربوط برقم إيراد وأولويات واضحة.' },
  { id: 'intel', n: 2, en: 'Market Intelligence', ar: 'فهم السوق', desc: 'المنافسين والعملاء والداتا قبل أي قرار.' },
  { id: 'diagnosis', n: 3, en: 'Strategic Diagnosis', ar: 'التشخيص', desc: 'إحنا فين دلوقتي، وإيه اللي شغال وإيه اللي لأ.' },
  { id: 'choice', n: 4, en: 'Market Choice', ar: 'اختيار السوق', desc: 'شريحة واضحة بدل ما نكلّم الكل.' },
  { id: 'value', n: 5, en: 'Value Architecture', ar: 'بناء القيمة', desc: 'العرض والتسعير والسبب اللي يخلّي العميل يختارك.' },
  { id: 'plan', n: 6, en: 'Strategic Plan Design', ar: 'تصميم الخطة', desc: 'خطة مكتوبة وميزانية متوزعة على أرقام.' },
  { id: 'execution', n: 7, en: 'Execution System', ar: 'منظومة التنفيذ', desc: 'أدوار، وأدوات، وانتظام في التنفيذ.' },
  { id: 'measure', n: 8, en: 'Measurement & Evolution', ar: 'القياس والتطوير', desc: 'نقيس، ونتعلم، ونعدّل الخطة.' },
];
if (typeof module !== 'undefined') module.exports = FRAMEWORK;
