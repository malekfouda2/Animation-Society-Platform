import type { Locale } from "@as/contracts";

/**
 * Plain-text account emails in both languages. Developer-drafted wording, pending the Society's
 * review (DECISIONS D08): no approved translation is claimed.
 */
export type EmailTemplate =
  | { template: "verify_email"; vars: { name: string; link: string } }
  | { template: "account_exists"; vars: { name: string; signInLink: string; resetLink: string } }
  | { template: "reset_password"; vars: { name: string; link: string } }
  | { template: "staff_invite"; vars: { name: string; link: string; role: "admin" | "editor" } }
  | { template: "password_changed"; vars: { name: string; resetLink: string } }
  | { template: "application_received"; vars: { name: string; link: string; resubmitted: boolean } }
  | { template: "application_changes"; vars: { name: string; link: string; message: string } }
  | { template: "application_approved"; vars: { name: string; link: string } }
  | { template: "application_rejected"; vars: { name: string; link: string; reason: string } }
  | { template: "contact_received"; vars: { name: string; email: string; subject: string; message: string; locale: Locale } };

export type TemplateName = EmailTemplate["template"];

const SIGNATURE: Record<Locale, string> = {
  ar: "جمعية الرسوم المتحركة",
  en: "The Animation Society",
};

type Render = { subject: string; body: string };

function render(locale: Locale, t: EmailTemplate): Render {
  const ar = locale === "ar";
  switch (t.template) {
    case "verify_email":
      return ar
        ? { subject: "تأكيد بريدك الإلكتروني", body: `مرحبًا ${t.vars.name}،\n\nلإكمال إنشاء حسابك، افتح الرابط التالي خلال 24 ساعة:\n${t.vars.link}\n\nإن لم تطلب إنشاء حساب فتجاهل هذه الرسالة.` }
        : { subject: "Confirm your email", body: `Hello ${t.vars.name},\n\nTo finish creating your account, open this link within 24 hours:\n${t.vars.link}\n\nIf you didn't ask for an account, ignore this email.` };
    case "account_exists":
      return ar
        ? { subject: "لديك حساب بالفعل", body: `مرحبًا ${t.vars.name}،\n\nطُلب إنشاء حساب بهذا البريد، لكن لديك حساب بالفعل.\nتسجيل الدخول: ${t.vars.signInLink}\nنسيت كلمة المرور؟ ${t.vars.resetLink}\n\nإن لم تكن أنت فلا حاجة لأي إجراء.` }
        : { subject: "You already have an account", body: `Hello ${t.vars.name},\n\nSomeone asked to create an account with this email, but you already have one.\nSign in: ${t.vars.signInLink}\nForgot your password? ${t.vars.resetLink}\n\nIf this wasn't you, you don't need to do anything.` };
    case "reset_password":
      return ar
        ? { subject: "إعادة تعيين كلمة المرور", body: `مرحبًا ${t.vars.name}،\n\nلاختيار كلمة مرور جديدة، افتح الرابط التالي خلال ساعة واحدة:\n${t.vars.link}\n\nسيتم تسجيل خروجك من جميع الأجهزة بعد التغيير. إن لم تطلب ذلك فتجاهل هذه الرسالة.` }
        : { subject: "Reset your password", body: `Hello ${t.vars.name},\n\nTo choose a new password, open this link within one hour:\n${t.vars.link}\n\nYou'll be signed out on every device after the change. If you didn't ask for this, ignore this email.` };
    case "staff_invite": {
      const roleAr = t.vars.role === "admin" ? "مسؤول" : "محرر محتوى";
      const roleEn = t.vars.role === "admin" ? "administrator" : "content editor";
      return ar
        ? { subject: "دعوة إلى إدارة الموقع", body: `مرحبًا ${t.vars.name}،\n\nأُضيف حسابك بصلاحية ${roleAr}. لاختيار كلمة المرور افتح الرابط التالي خلال 48 ساعة:\n${t.vars.link}\n\nبعدها ستُطلب منك إضافة تطبيق المصادقة على هاتفك.` }
        : { subject: "Your invitation to the site administration", body: `Hello ${t.vars.name},\n\nYou've been added as ${roleEn}. To choose your password, open this link within 48 hours:\n${t.vars.link}\n\nYou'll then be asked to set up an authenticator app on your phone.` };
    }
    case "password_changed":
      return ar
        ? { subject: "تم تغيير كلمة المرور", body: `مرحبًا ${t.vars.name}،\n\nتم تغيير كلمة مرور حسابك وتسجيل الخروج من الأجهزة الأخرى.\nإن لم تكن أنت، أعد تعيينها فورًا: ${t.vars.resetLink}` }
        : { subject: "Your password was changed", body: `Hello ${t.vars.name},\n\nYour account password was changed and other devices were signed out.\nIf this wasn't you, reset it now: ${t.vars.resetLink}` };
    case "application_received":
      return ar
        ? { subject: t.vars.resubmitted ? "وصلنا طلبك المعدّل" : "وصلنا طلب العضوية", body: `مرحبًا ${t.vars.name}،\n\n${t.vars.resubmitted ? "وصلنا طلبك بعد التعديل، وعاد إلى المراجعة." : "وصلنا طلب عضويتك وهو الآن قيد المراجعة."} سنراسلك عند صدور القرار أو إن احتجنا إلى تعديل.\n\nتابع حالة طلبك: ${t.vars.link}\n\nلا يُطلب منك أي دفع قبل قبول الطلب.` }
        : { subject: t.vars.resubmitted ? "We received your updated application" : "We received your membership application", body: `Hello ${t.vars.name},\n\n${t.vars.resubmitted ? "Your updated application is back under review." : "Your membership application is now under review."} We'll email you when there's a decision, or if anything needs changing.\n\nFollow your application: ${t.vars.link}\n\nYou won't be asked to pay before your application is approved.` };
    case "application_changes":
      // The staff message is quoted as data on its own lines.
      return ar
        ? { subject: "طلب عضويتك يحتاج إلى تعديل", body: `مرحبًا ${t.vars.name}،\n\nراجع فريق الجمعية طلبك ويحتاج إلى بعض التعديلات:\n\n${t.vars.message}\n\nعدّل طلبك وأعد إرساله من هنا: ${t.vars.link}` }
        : { subject: "Your membership application needs changes", body: `Hello ${t.vars.name},\n\nThe Society's team reviewed your application and needs a few changes:\n\n${t.vars.message}\n\nUpdate and resubmit it here: ${t.vars.link}` };
    case "application_approved":
      return ar
        ? { subject: "تم قبول طلب عضويتك", body: `مرحبًا ${t.vars.name}،\n\nيسعدنا إبلاغك بقبول طلب عضويتك. تُفعَّل العضوية بعد إتمام الدفع وتأكيده، وسنخبرك حين تُفتح صفحة الدفع.\n\nتفاصيل طلبك: ${t.vars.link}` }
        : { subject: "Your membership application is approved", body: `Hello ${t.vars.name},\n\nWe're glad to tell you your membership application is approved. Your membership starts once payment is made and confirmed; we'll let you know when payment opens.\n\nYour application: ${t.vars.link}` };
    case "application_rejected":
      return ar
        ? { subject: "قرار طلب العضوية", body: `مرحبًا ${t.vars.name}،\n\nراجع فريق الجمعية طلبك، ونأسف لإبلاغك بعدم قبوله.\n\nالسبب:\n${t.vars.reason}\n\nيمكنك التقديم مجددًا بعد ستة أشهر من تاريخ هذا القرار.\n\nتفاصيل طلبك: ${t.vars.link}\nللاستفسار، تواصل معنا عبر صفحة التواصل في الموقع.` }
        : { subject: "Decision on your membership application", body: `Hello ${t.vars.name},\n\nThe Society's team reviewed your application and is unable to accept it.\n\nReason:\n${t.vars.reason}\n\nYou can apply again six months after this decision.\n\nYour application: ${t.vars.link}\nFor questions, use the contact page on the website.` };
    case "contact_received": {
      // The sender's text is quoted as data; the subject line carries no user text beyond the
      // validated single-line subject.
      const lang = t.vars.locale === "ar" ? (ar ? "العربية" : "Arabic") : ar ? "الإنجليزية" : "English";
      return ar
        ? { subject: `رسالة جديدة من الموقع: ${t.vars.subject}`, body: `وصلت رسالة عبر نموذج التواصل.\n\nالاسم: ${t.vars.name}\nالبريد: ${t.vars.email}\nلغة الصفحة: ${lang}\nالموضوع: ${t.vars.subject}\n\n${t.vars.message}\n\nللرد، راسل المرسل مباشرة على بريده.` }
        : { subject: `New message from the website: ${t.vars.subject}`, body: `A message arrived through the contact form.\n\nName: ${t.vars.name}\nEmail: ${t.vars.email}\nPage language: ${lang}\nSubject: ${t.vars.subject}\n\n${t.vars.message}\n\nTo reply, write to the sender's email directly.` };
    }
  }
}

export function renderEmail(locale: Locale, t: EmailTemplate): { subject: string; text: string } {
  const { subject, body } = render(locale, t);
  return { subject, text: `${body}\n\n${SIGNATURE[locale]}` };
}
