import type { Localized, Sourced } from "./types";

export const MEMBERSHIP_INTRO = {
  status: "draft",
  source: "Developer draft",
  why: {
    ar: "العضوية طريقك لتكون جزءًا من مجتمع الرسوم المتحركة في المملكة: تتابع مبادرات الجمعية وفعالياتها، وتتعرّف على صنّاع هذا الفن، وتشارك في نموّه.",
    en: "Membership is your way into Saudi Arabia's animation community: follow the Society's initiatives and events, meet the people who make animation, and take part in its growth.",
  },
} as const satisfies Sourced & Record<string, unknown>;

/** Membership types described in the Society's own materials (Instagram highlight 'العضويات'). */
export const MEMBERSHIP_TYPES = [
  {
    key: "working",
    name: { ar: "العضو العامل", en: "Working member" },
    who: {
      ar: "المشاركون في تأسيس الجمعية، والمتخصصون والممارسون والمهتمون بمجالها.",
      en: "Founders of the Society, and specialists, practitioners and people engaged in its field.",
    },
    rights: {
      ar: "المشاركة في أنشطة الجمعية، وحضور اجتماعات الجمعية العمومية، والتصويت على قراراتها، والترشّح لعضوية مجلس الإدارة.",
      en: "Take part in the Society's activities, attend General Assembly meetings, vote on its decisions and stand for the Board.",
    },
    granted: false,
  },
  {
    key: "affiliate",
    name: { ar: "العضو المنتسب", en: "Affiliate member" },
    who: {
      ar: "من يتقدّم بطلب عضوية ولا تنطبق عليه أحد شروط العضوية العاملة.",
      en: "Applicants who don't meet one of the conditions for working membership.",
    },
    rights: {
      ar: "الاشتراك في أنشطة الجمعية، وتلقّي المعلومات الأساسية عن نشاطاتها بشكل دوري كل سنة.",
      en: "Join the Society's activities and receive regular updates about its work each year.",
    },
    granted: false,
  },
  {
    key: "honorary",
    name: { ar: "العضو الفخري", en: "Honorary member" },
    who: {
      ar: "من ساهم ماديًا أو معنويًا في دعم أعمال الجمعية، بقرار من الجمعية العمومية.",
      en: "People who supported the Society's work financially or otherwise, by decision of the General Assembly.",
    },
    rights: {
      ar: "مخاطبة الجمعية عبر وسائل الاتصال المخصصة لها.",
      en: "Correspond with the Society through its designated channels.",
    },
    granted: true,
  },
  {
    key: "distinguished",
    name: { ar: "العضو الشرفي", en: "Distinguished member" },
    who: {
      ar: "من ترى الجمعية العمومية أنه متميّز في عمل الجمعية.",
      en: "People the General Assembly recognises for outstanding work in the Society.",
    },
    rights: {
      ar: "حضور اجتماعات مجلس الإدارة، ومخاطبة الجمعية عبر وسائل الاتصال المخصصة لها.",
      en: "Attend Board meetings and correspond with the Society through its designated channels.",
    },
    granted: true,
  },
] as const;
export const MEMBERSHIP_TYPES_META: Sourced = {
  status: "supplied",
  source: "Society Drive: Social Media/instagram/Highlight/Highlight- membership.ai (paraphrased)",
};

/** Accurate application journey (Malek's brief). A step-by-step sequence, so numbering is meaningful. */
export const JOURNEY = [
  { key: "account", title: { ar: "أنشئ حسابك", en: "Create an account" }, body: { ar: "سجّل ببريدك الإلكتروني وأكّده.", en: "Sign up with your email and confirm it." } },
  { key: "apply", title: { ar: "قدّم طلب العضوية", en: "Submit an application" }, body: { ar: "اختر نوع العضوية وأكمل نموذج الطلب.", en: "Choose a membership type and complete the form." } },
  { key: "review", title: { ar: "مراجعة الطلب", en: "Staff review" }, body: { ar: "يراجع فريق الجمعية طلبك، وقد يطلب منك تعديلات.", en: "The Society's team reviews it and may ask for corrections." } },
  { key: "payment", title: { ar: "الدفع بعد القبول", en: "Payment after approval" }, body: { ar: "تُفتح صفحة الدفع فقط بعد قبول طلبك.", en: "Payment opens only once your application is approved." } },
  { key: "card", title: { ar: "التفعيل والبطاقة الرقمية", en: "Activation and digital card" }, body: { ar: "تُفعّل عضويتك بعد تأكيد الدفع، وتصلك بطاقة عضوية رقمية.", en: "Your membership activates once payment is confirmed, with a digital membership card." } },
] as const;

/** Plans, prices, durations and benefits are not approved; never invent them. */
export const PLANS = { status: "pending", source: "Awaiting approval (DECISIONS D02)", items: [] as readonly unknown[] } as const;
export const BENEFITS = { status: "pending", source: "Awaiting approval", items: [] as readonly Localized[] } as const;

export const FAQ = [
  {
    q: { ar: "هل يمنحني دفع الرسوم حق التصويت؟", en: "Does paying the fee give me voting rights?" },
    a: {
      ar: "لا. حق التصويت في الجمعية العمومية مرتبط بالعضوية العاملة وشروطها، ولا يُكتسب بالدفع وحده.",
      en: "No. Voting in the General Assembly comes with working membership and its conditions, not with payment alone.",
    },
  },
  {
    q: { ar: "متى أدفع رسوم العضوية؟", en: "When do I pay?" },
    a: {
      ar: "بعد قبول طلبك فقط. لا يُطلب منك الدفع قبل المراجعة.",
      en: "Only after your application is approved. You are never asked to pay before review.",
    },
  },
  {
    q: { ar: "ماذا لو احتاج طلبي إلى تعديل؟", en: "What if my application needs changes?" },
    a: {
      ar: "سيوضح فريق الجمعية المطلوب، وتعدّل طلبك وتعيد إرساله للمراجعة.",
      en: "The Society's team explains what's needed, you update your application and resubmit it for review.",
    },
  },
  {
    q: { ar: "كيف أحصل على العضوية الفخرية أو الشرفية؟", en: "How do honorary and distinguished memberships work?" },
    a: {
      ar: "لا يُتقدَّم إليهما بطلب؛ تمنحهما الجمعية العمومية بقرار منها.",
      en: "You don't apply for them. The General Assembly grants them by decision.",
    },
  },
] as const;
export const FAQ_META: Sourced = { status: "draft", source: "Developer draft from the agreed journey and Society materials" };
