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
