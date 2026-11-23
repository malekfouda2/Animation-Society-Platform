import type { Localized, Sourced } from "./types";

/*
 * Membership content. Arabic is copied from the Society's 2026 profile (ملف_الجمعية_التعريفي_2026.pdf,
 * slides 20–39) and its bylaws (اللائحة الأساسية v.3); only Persian letterforms (ی، ھ) were normalised
 * to Arabic. English is a developer translation awaiting the Society's approval (DECISIONS D08).
 *
 * As Malek decided on 19 Nov 2026, discounts and library access are left out of every category's
 * benefits. The remaining benefits keep the profile's own note that they are proposed and take
 * effect by board decision.
 */

export const MEMBERSHIP_INTRO = {
  status: "draft",
  source: "Developer draft",
  why: {
    ar: "العضوية طريقك لتكون جزءًا من مجتمع الرسوم المتحركة في المملكة: تتابع مبادرات الجمعية وفعالياتها، وتتعرّف على صنّاع هذا الفن، وتشارك في نموّه.",
    en: "Membership is your way into Saudi Arabia's animation community: follow the Society's initiatives and events, meet the people who make animation, and take part in its growth.",
  },
} as const satisfies Sourced & Record<string, unknown>;

export interface Point {
  title: Localized;
  body: Localized;
}
export interface MembershipType {
  key: "student" | "participant" | "ordinary" | "supporting" | "honorary";
  name: Localized;
  /** One line under the name on the card front. */
  who: Localized;
  /** Fee or how it is granted, as the profile states it. */
  fee: Localized;
  /** The short facts under the fee (eligibility • General Assembly). */
  facts: Localized;
  /** Granted by decision rather than applied for. */
  granted: boolean;
  requirements: { heading: Localized; items: readonly Point[] };
  rights: { heading: Localized; items: readonly Point[]; note: Localized };
  benefits: { heading: Localized; items: readonly Point[]; note: Localized };
  /** Where the bylaws set this category. */
  source: Localized;
}

const p = (arTitle: string, arBody: string, enTitle: string, enBody: string): Point => ({
  title: { ar: arTitle, en: enTitle },
  body: { ar: arBody, en: enBody },
});

export const MEMBERSHIP_TYPES: readonly MembershipType[] = [
  {
    key: "student",
    name: { ar: "عضوية الطالب «المنتسب»", en: "Student (affiliate) membership" },
    who: { ar: "ابدأ من مقعد الدراسة، وابنِ مهارتك وحضورك داخل مجتمع الرسوم المتحركة.", en: "Start from your seat in class, and build your skills and presence in the animation community." },
    fee: { ar: "200 ريال سنويًا", en: "SAR 200 a year" },
    facts: { ar: "إثبات صفة طالب • خارج الجمعية العمومية", en: "Proof of student status • Not part of the General Assembly" },
    granted: false,
    requirements: {
      heading: { ar: "متطلبات واضحة تضع رحلتك على المسار الصحيح", en: "Clear requirements that put you on the right track" },
      items: [
        p("إثبات الدراسة", "وثيقة سارية تثبت صفة الطالب، وألا يقل العمر عن 18 عامًا.", "Proof of study", "A valid document proving you are a student. Minimum age 18."),
        p("الاشتراك", "سداد الرسم السنوي وفق المواعيد المعتمدة.", "Subscription", "Pay the annual fee by the approved dates."),
        p("المشاركة", "دعم أهداف الجمعية وأنشطتها.", "Participation", "Support the Society's goals and activities."),
        p("الالتزام", "احترام القرارات وعدم الإضرار بالجمعية.", "Commitment", "Respect its decisions and do nothing to harm the Society."),
      ],
    },
    rights: {
      heading: { ar: "تعلّم وشارك واطّلع ضمن صلاحيات محددة", en: "Learn, take part and stay informed, within set limits" },
      items: [
        p("المشاركة", "الاشتراك في أنشطة الجمعية.", "Participation", "Take part in the Society's activities."),
        p("المعرفة", "تلقي المعلومات الأساسية دوريًا.", "Knowledge", "Receive the essential information regularly."),
        p("الاطلاع", "الوصول إلى الوثائق وفق الضوابط.", "Access", "Consult documents under the applicable rules."),
        p("التواصل", "مخاطبة الجمعية وتلقي الرد رسميًا.", "Contact", "Write to the Society and receive a formal reply."),
      ],
      note: { ar: "لا تمنح هذه العضوية حضور الجمعية العمومية أو التصويت أو الترشح.", en: "This membership does not give the right to attend the General Assembly, vote or stand for election." },
    },
    benefits: {
      heading: { ar: "مزايا عملية تساعدك على بناء مهارتك مبكرًا", en: "Practical benefits to help you build your skills early" },
      items: [
        p("استشارة", "ساعتان في ما قبل الإنتاج كل ثلاثة أشهر.", "Consultation", "Two hours on pre-production every three months."),
        p("التعلم", "أولوية في الورش المجانية والتجمعات.", "Learning", "Priority for free workshops and meet-ups."),
      ],
      note: { ar: "مزايا تشغيلية مقترحة تعتمد بقرار مجلس الإدارة.", en: "Proposed operational benefits, subject to a board decision." },
    },
    source: { ar: "اللائحة الأساسية: المادة 8(6)؛ المادة 12", en: "Bylaws: Article 8(6); Article 12" },
  },
  {
    key: "participant",
    name: { ar: "عضوية المشارك", en: "Participant membership" },
    who: { ar: "وسّع خبرتك وعلاقاتك، وكن أقرب إلى مجتمع الصناعة وفرصه.", en: "Grow your experience and network, and get closer to the industry and its opportunities." },
    fee: { ar: "400 ريال سنويًا", en: "SAR 400 a year" },
    facts: { ar: "لمن تجاوز 18 عامًا • خارج الجمعية العمومية", en: "Over 18 • Not part of the General Assembly" },
    granted: false,
    requirements: {
      heading: { ar: "عضوية مرنة للممارسين فوق الثامنة عشرة", en: "A flexible membership for practitioners over eighteen" },
      items: [
        p("العمر", "أن يكون المتقدم قد تجاوز 18 عامًا.", "Age", "The applicant must be over 18."),
        p("الاشتراك", "سداد الرسم السنوي المعتمد.", "Subscription", "Pay the approved annual fee."),
        p("المشاركة", "دعم أهداف الجمعية وأنشطتها.", "Participation", "Support the Society's goals and activities."),
        p("الالتزام", "عدم استغلال العضوية أو الإضرار بالجمعية.", "Commitment", "Do not exploit the membership or harm the Society."),
      ],
    },
    rights: {
      heading: { ar: "خدمات الجمعية متاحة دون صلاحيات الجمعية العمومية", en: "The Society's services, without General Assembly powers" },
      items: [
        p("المشاركة", "الاشتراك في الأنشطة والبرامج.", "Participation", "Take part in activities and programmes."),
        p("المعلومات", "تلقي المعلومات الأساسية دوريًا.", "Information", "Receive the essential information regularly."),
        p("الاطلاع", "الوصول إلى الوثائق وفق الضوابط.", "Access", "Consult documents under the applicable rules."),
        p("التواصل", "مخاطبة الجمعية وتلقي جواب رسمي.", "Contact", "Write to the Society and receive a formal answer."),
      ],
      note: { ar: "لا يحق للمشارك حضور الجمعية العمومية أو التصويت فيها.", en: "A participant may not attend or vote in the General Assembly." },
    },
    benefits: {
      heading: { ar: "دعم مهني يصل إلى مراحل الإنتاج المختلفة", en: "Professional support across the stages of production" },
      items: [
        p("استشارة", "ساعتان لكل مرحلة إنتاج كل ثلاثة أشهر.", "Consultation", "Two hours for each production stage every three months."),
        p("ورشة", "ورشة استشارية سنوية بعد الموافقات.", "Workshop", "An annual advisory workshop, once approvals are in place."),
        p("الارتباط", "تجمعات وفرص تواصل مهني.", "Connection", "Meet-ups and professional networking opportunities."),
      ],
      note: { ar: "التمثيل الخارجي ترشيح مؤسسي وليس حقًا تلقائيًا. مزايا تشغيلية مقترحة تعتمد بقرار مجلس الإدارة.", en: "External representation is an institutional nomination, not an automatic right. Proposed operational benefits, subject to a board decision." },
    },
    source: { ar: "اللائحة الأساسية: المادة 8(7)؛ المادة 12", en: "Bylaws: Article 8(7); Article 12" },
  },
  {
    key: "ordinary",
    name: { ar: "العضوية العادية «القيادي»", en: "Ordinary (leader) membership" },
    who: { ar: "انتقل من المشاركة إلى صناعة القرار داخل الجمعية العمومية.", en: "Move from taking part to making decisions in the General Assembly." },
    fee: { ar: "600 ريال سنويًا", en: "SAR 600 a year" },
    facts: { ar: "المسمى اللائحي: العادي • القيادي اسم تسويقي", en: "Bylaws name: ordinary • “Leader” is a marketing name" },
    granted: false,
    requirements: {
      heading: { ar: "المسؤولية تبدأ بأهلية واضحة واعتماد مؤسسي", en: "Responsibility starts with clear eligibility and institutional approval" },
      items: [
        p("الأهلية", "كمال الأهلية وحسن السيرة والسلوك.", "Eligibility", "Full legal capacity and good conduct."),
        p("المدة", "مضي ستة أشهر على عضوية الجمعية.", "Duration", "At least six months as a member of the Society."),
        p("الطلب", "تقديم النموذج وسداد الرسم المعتمد.", "Application", "Submit the form and pay the approved fee."),
        p("الاعتماد", "مراجعة اللجنة ثم قرار مجلس الإدارة.", "Approval", "Review by the committee, then a board decision."),
      ],
    },
    rights: {
      heading: { ar: "صوتك حاضر في الجمعية العمومية", en: "Your voice in the General Assembly" },
      items: [
        p("الحضور والتصويت", "مناقشة قرارات الجمعية العمومية والتصويت عليها.", "Attendance and voting", "Discuss and vote on General Assembly decisions."),
        p("الاطلاع", "المحاضر والمستندات المالية في مقر الجمعية.", "Access", "Minutes and financial documents at the Society's premises."),
        p("الاجتماع", "طلب اجتماع غير عادي مع 25% من المؤهلين.", "Meetings", "Call an extraordinary meeting together with 25% of eligible members."),
        p("الترشح", "عند استيفاء جميع شروط المادة 30.", "Candidacy", "When all the conditions of Article 30 are met."),
      ],
      note: { ar: "الإنابة للحضور والتصويت فقط، ولا تنقل العضوية.", en: "A proxy covers attending and voting only; it does not transfer the membership." },
    },
    benefits: {
      heading: { ar: "مزايا أوسع للعضو الأكثر حضورًا ومشاركة", en: "Wider benefits for the most engaged members" },
      items: [
        p("استشارة", "ساعتان لكل مرحلة إنتاج شهريًا.", "Consultation", "Two hours for each production stage every month."),
        p("ورشة", "ورشة استشارية كل ستة أشهر.", "Workshop", "An advisory workshop every six months."),
        p("التمثيل", "أولوية ترشيح بقرار من المجلس.", "Representation", "Priority for nominations, by board decision."),
      ],
      note: { ar: "المزايا تشغيلية، ولا تضيف حقوقًا خارج اللائحة. مزايا تشغيلية مقترحة تعتمد بقرار مجلس الإدارة.", en: "Benefits are operational and add no rights beyond the bylaws. Proposed operational benefits, subject to a board decision." },
    },
    source: { ar: "اللائحة الأساسية: المادة 9؛ المادة 12؛ المادة 17", en: "Bylaws: Article 9; Article 12; Article 17" },
  },
  {
    key: "supporting",
    name: { ar: "العضوية الداعمة", en: "Supporting membership" },
    who: { ar: "حوّل دعمك إلى أثر مؤسسي يساند استدامة الجمعية ونموها.", en: "Turn your support into institutional impact that sustains the Society and its growth." },
    fee: { ar: "600 ريال + تبرع لا يقل عن 100,000 ريال", en: "SAR 600 + a donation of at least SAR 100,000" },
    facts: { ar: "عضو جمعية عمومية بحقوق العضو العادي", en: "General Assembly member with the rights of an ordinary member" },
    granted: false,
    requirements: {
      heading: { ar: "الدعم الموثق يصنع استدامة أوضح", en: "Documented support makes for clearer sustainability" },
      items: [
        p("الأهلية", "استيفاء شروط العضوية العادية.", "Eligibility", "Meet the conditions of ordinary membership."),
        p("القيمة", "تبرع غير مقيد لا يقل عن 100,000 ريال.", "Amount", "An unrestricted donation of at least SAR 100,000."),
        p("المصدر", "يصدر التبرع من الحساب الخاص للعضو.", "Source", "The donation comes from the member's own account."),
        p("المهلة", "قبل الانتخابات التالية بعشرة أيام عمل.", "Deadline", "Ten working days before the next elections."),
      ],
    },
    rights: {
      heading: { ar: "حقوق العادي وتأثير انتخابي وفق اللائحة", en: "Ordinary rights, with electoral weight under the bylaws" },
      items: [
        p("الحقوق", "جميع حقوق العضو العادي.", "Rights", "All the rights of an ordinary member."),
        p("الأصوات", "أصوات إضافية وفق المعادلة اللائحية.", "Votes", "Additional votes under the bylaws' formula."),
        p("النطاق", "تستخدم في انتخابات مجلس الإدارة فقط.", "Scope", "Used in board elections only."),
        p("المدة", "يحتسب الأثر لدورة انتخابية واحدة.", "Duration", "Counted for one election cycle."),
      ],
      note: { ar: "التبرع المتأخر يُحتسب لأول انتخابات لاحقة.", en: "A late donation counts towards the first elections after it." },
    },
    benefits: {
      heading: { ar: "تقدير عملي لشريك يساند نمو الجمعية", en: "Practical recognition for a partner in the Society's growth" },
      items: [
        p("استشارة", "ساعتان لكل مرحلة إنتاج شهريًا.", "Consultation", "Two hours for each production stage every month."),
        p("ورشة", "ورشة استشارية كل ستة أشهر.", "Workshop", "An advisory workshop every six months."),
        p("الأولوية", "دعوات وترشيحات مؤسسية بقرار المجلس.", "Priority", "Institutional invitations and nominations, by board decision."),
      ],
      note: { ar: "العضوية شخصية ولا تنتقل للورثة أو الوكلاء. مزايا تشغيلية مقترحة تعتمد بقرار مجلس الإدارة.", en: "Membership is personal and does not pass to heirs or agents. Proposed operational benefits, subject to a board decision." },
    },
    source: { ar: "اللائحة الأساسية: المادة 10؛ المادة 12", en: "Bylaws: Article 10; Article 12" },
  },
  {
    key: "honorary",
    name: { ar: "العضوية الفخرية", en: "Honorary membership" },
    who: { ar: "نكرّم الخبرة والإسهام الذي يصنع فرقًا في المجال والمجتمع.", en: "We honour expertise and contributions that make a difference to the field and the community." },
    fee: { ar: "تُمنح بقرار مجلس الإدارة", en: "Granted by board decision" },
    facts: { ar: "المسمى اللائحي: الفخري • لا توجد فئة مستقلة باسم الشرفي", en: "Bylaws name: honorary • There is no separate “distinguished” category" },
    granted: true,
    requirements: {
      heading: { ar: "يُمنح التكريم بقرار مؤسسي موثق", en: "Recognition is granted by a documented institutional decision" },
      items: [
        p("المنح", "قرار من مجلس الإدارة.", "Granting", "A decision of the board."),
        p("المعيار", "مكانة معتبرة أو خدمات جليلة أو نشاط مرموق.", "Criteria", "Recognised standing, distinguished service or notable activity."),
        p("السحب", "يجوز للمجلس سحب العضوية بقرار.", "Withdrawal", "The board may withdraw the membership by decision."),
        p("الإشعار", "تزويد المركز بالأسماء والصفات والمبررات.", "Notification", "The National Center is given the names, titles and reasons."),
      ],
    },
    rights: {
      heading: { ar: "حضور استشاري بلا تصويت أو نصاب", en: "An advisory seat, without a vote or counting towards quorum" },
      items: [
        p("المناقشة", "المشاركة في مناقشات مجلس الإدارة.", "Discussion", "Take part in board discussions."),
        p("التصويت", "لا يملك حق التصويت في المجلس.", "Voting", "No vote on the board."),
        p("النصاب", "لا يثبت بحضوره صحة الانعقاد.", "Quorum", "Their attendance does not count towards a valid meeting."),
        p("الصفة", "ليس عضوًا في مجلس الإدارة.", "Status", "Not a member of the board."),
      ],
      note: { ar: "لا تسري عليه صلاحيات أو التزامات أعضاء مجلس الإدارة.", en: "The powers and obligations of board members do not apply to them." },
    },
    benefits: {
      heading: { ar: "مزايا تحفظ المكانة وتفتح باب الإسهام", en: "Benefits that honour standing and open the door to contribution" },
      items: [
        p("التقدير", "شهادة وتكريم مؤسسي موثق.", "Recognition", "A certificate and documented institutional recognition."),
        p("الدعوات", "دعوات مختارة للملتقيات والفعاليات.", "Invitations", "Selected invitations to forums and events."),
        p("الخبرة", "مشاركة استشارية عند دعوة المجلس.", "Expertise", "Advisory involvement when the board invites it."),
        p("التعريف", "إبراز الإسهام بعد موافقة العضو.", "Profile", "Highlighting the contribution, with the member's consent."),
      ],
      note: { ar: "لا تضيف المزايا حق التصويت أو الاحتساب في النصاب. مميزات تشغيلية مقترحة؛ ليست حقوقًا مقررة في اللائحة.", en: "The benefits add no vote and do not count towards quorum. Proposed operational benefits; not rights set by the bylaws." },
    },
    source: { ar: "اللائحة الأساسية: المادة 11", en: "Bylaws: Article 11" },
  },
];
export const MEMBERSHIP_TYPES_META: Sourced = {
  status: "supplied",
  source: "Society profile 2026 (slides 20–39) and bylaws v3 (Articles 8–12, 17)",
};

/** The application journey. A step-by-step sequence, so numbering is meaningful. */
export const JOURNEY = [
  { key: "account", title: { ar: "أنشئ حسابك", en: "Create an account" }, body: { ar: "سجّل ببريدك الإلكتروني وأكّده.", en: "Sign up with your email and confirm it." } },
  { key: "apply", title: { ar: "قدّم طلب العضوية", en: "Submit an application" }, body: { ar: "اختر نوع العضوية وأكمل نموذج الطلب.", en: "Choose a membership type and complete the form." } },
  { key: "review", title: { ar: "مراجعة الطلب", en: "Review" }, body: { ar: "يراجع فريق الجمعية طلبك، وقد يطلب منك تعديلات. العضوية العادية تراجعها اللجنة ثم يقررها مجلس الإدارة.", en: "The Society's team reviews it and may ask for corrections. Ordinary membership is reviewed by the committee and decided by the board." } },
  { key: "payment", title: { ar: "الدفع بعد القبول", en: "Payment after approval" }, body: { ar: "تُفتح صفحة الدفع فقط بعد قبول طلبك.", en: "Payment opens only once your application is approved." } },
  { key: "card", title: { ar: "التفعيل والبطاقة الرقمية", en: "Activation and digital card" }, body: { ar: "تُفعّل عضويتك بعد تأكيد الدفع، وتصلك بطاقة عضوية رقمية.", en: "Your membership activates once payment is confirmed, with a digital membership card." } },
] as const;

/**
 * Questions answered from the bylaws (article numbers given in each answer) and the agreed
 * application journey. Pro-rating by remaining months is Malek's decision of 19 Nov 2026 on how to
 * apply Article 12(2).
 */
export const FAQ = [
  {
    q: { ar: "متى أدفع رسوم العضوية؟", en: "When do I pay?" },
    a: {
      ar: "بعد قبول طلبك فقط. لا يُطلب منك الدفع قبل المراجعة.",
      en: "Only after your application is approved. You are never asked to pay before review.",
    },
  },
  {
    q: { ar: "إذا انضممت خلال السنة، هل أدفع الرسم كاملًا؟", en: "If I join during the year, do I pay the full fee?" },
    a: {
      ar: "لا. السنة المالية للجمعية من 1 يناير إلى 31 ديسمبر، ومن ينضم خلالها لا يؤدي من الاشتراك إلا نسبة ما يوازي المدة المتبقية منها (المادة 12). يُحسب ذلك بالأشهر المتبقية بما فيها شهر الانضمام، وتنتهي العضوية في 31 ديسمبر ثم تُجدَّد سنويًا.",
      en: "No. The Society's financial year runs from 1 January to 31 December, and a member who joins during it pays only the share for the rest of the year (Article 12). This is worked out by the months left, including the month you join. Membership ends on 31 December and is then renewed each year.",
    },
  },
  {
    q: { ar: "هل يمكن استرداد ما دفعته؟", en: "Can I get a refund?" },
    a: {
      ar: "لا يجوز للعضو أو من زالت عضويته ولا لورثته المطالبة باسترداد أي مبلغ دفعه العضو للجمعية سواء كان اشتراكًا، أو تبرعًا أو غيرها (المادة 14).",
      en: "No. Neither a member, a former member nor their heirs may claim back any amount the member paid the Society, whether a subscription, a donation or anything else (Article 14).",
    },
  },
  {
    q: { ar: "من يحق له حضور الجمعية العمومية والتصويت؟", en: "Who can attend and vote in the General Assembly?" },
    a: {
      ar: "أعضاء العضوية العادية والداعمة (المادتان 9 و10). عضوية الطالب وعضوية المشارك لا تمنحان حضور الجمعية العمومية أو التصويت فيها (المادة 8).",
      en: "Ordinary and supporting members (Articles 9 and 10). Student and participant memberships do not give the right to attend or vote in the General Assembly (Article 8).",
    },
  },
  {
    q: { ar: "هل أستطيع التقدم للعضوية العادية مباشرة؟", en: "Can I apply for ordinary membership straight away?" },
    a: {
      ar: "يشترط مضي ستة أشهر على الأقل على عضويتك في الجمعية (المادة 17)، وتُقبل العضوية العادية بعد مراجعة اللجنة المكلفة من مجلس الإدارة ثم قرار المجلس (المادة 9).",
      en: "You need at least six months' membership of the Society first (Article 17), and ordinary membership is accepted after review by the committee the board appoints and then a board decision (Article 9).",
    },
  },
  {
    q: { ar: "ماذا يحدث إذا تأخرت في سداد الاشتراك؟", en: "What happens if I pay late?" },
    a: {
      ar: "لا يحق للعضو ممارسة أي من حقوقه في حالة إخلاله بسداد الاشتراك، ويجوز للمجلس إمهال غير المسددين إلى موعد انعقاد أقرب جمعية عمومية (المادة 12). التأخر عن موعد الاستحقاق من حالات زوال العضوية، ويجوز بعد انتفاء السبب طلب رد العضوية من مجلس الإدارة (المادتان 13 و14).",
      en: "A member who has not paid cannot exercise any membership rights, and the board may give unpaid members until the next General Assembly (Article 12). Late payment is one of the grounds for losing membership; once the cause is gone, you can ask the board to restore it (Articles 13 and 14).",
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
    q: { ar: "كيف أحصل على العضوية الفخرية؟", en: "How does honorary membership work?" },
    a: {
      ar: "لا يُتقدَّم إليها بطلب؛ يمنحها مجلس الإدارة بقرار لمن يرى منحه إياها من ذوي المكانة والرأي ممن أدوا خدمات جليلة للدولة أو للجمعية أو ممن لهم نشاط مرموق في المجال العام (المادة 11).",
      en: "You don't apply for it. The board grants it by decision to people of standing who have given distinguished service to the state or the Society, or are notable in public life (Article 11).",
    },
  },
] as const;
export const FAQ_META: Sourced = { status: "supplied", source: "Bylaws v3 Articles 8–14, 17, 54; agreed application journey" };
