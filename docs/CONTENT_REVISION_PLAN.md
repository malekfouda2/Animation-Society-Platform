# Content and policy revision plan (Society Drive, 19 November 2026)

Malek asked for the whole website to be revisited against the Society Drive. Two files are the authority:

- **اللائحة الأساسية v.3.pdf**: the Society's bylaws (38 pages, licence 2189 of 10/04/1443 AH). The website applies them as written, with nothing improvised.
- **ملف_الجمعية_التعريفي_2026.pdf**: the 2026 company profile (42 slides). This is the content source, including membership names, prices and conditions. Text is copied, not rewritten.

Both were downloaded with Malek's approval to the git-ignored `brand-source/drive-2026-11/`.

## 1. What is new in the Drive since 8 November

| Item | Date | What it is | Use |
| --- | --- | --- | --- |
| `ملف_الجمعية_التعريفي_2026.pdf` | 15 Oct | Company profile 2026 | **Primary content source** |
| `اللائحة الأساسية v.3.pdf` | 21 May | Bylaws v3 | **Rules the site must apply** |
| `أدلة الحوكمة/` | 16 Nov | About 50 governance folders, one PDF each: policies (data privacy, code of conduct, ethics charter, conflict of interest, whistleblowing, document retention, beneficiaries, and others), financial and administrative regulations, annual reports, General Assembly and board records, contracts | Public policies and reports can feed a governance page. Contracts, name lists, candidates and investment records **stay out** (personal or internal data) |
| `Requirements For Payments/` | 16 Nov | Bylaws copy, board-formation letter, licence certificate | Payment-gateway onboarding (D03). Not website content |
| `DEMO/animation-society-demo.mp4` | 10 Nov | Malek's recording of the site | Not content |

## 2. Facts from the profile (verbatim source for the site)

The profile's Arabic text uses Persian letterforms in places (ی, ھ). They are normalised to Arabic ي and ه when copied; the wording itself is unchanged.

- **Official line:** جمعية الرسوم المتحركة | رقم التسجيل 2189 | رقم القرار 74915 | تاريخ القرار 10\04\1443هـ | منطقة الرياض
- **Vision (الرؤية):** أن تكون الجمعية رائدة في صناعة الرسوم المتحركة وتعزيز مكانة هذه الصناعة في المملكة العربية السعودية
- **Mission (الرسالة):** five points, from تطوير معايير تنشيط الموارد البشرية to جعل المزيد من الناس يدركون تاريخ صناعة الرسوم المتحركة
- **Founders' message (رسالة المؤسسين):** four paragraphs
- **About (نبذة عن الجمعية)** and **purpose (الهدف من إنشاء الجمعية)**
- **Goals (أهداف الجمعية):** five numbered goals
- **Board (مجلس الإدارة):** five names with roles (chair, vice-chair, three members), with portraits on the slide
- **General Assembly:** 14 current members, with names in Arabic and English and portraits
- **How we achieve our goals:** نجمع المجتمع، نطور المهارات، نتعلّم بالممارسة، نكتشف المواهب، نتبادل الخبرات، نحتفي بالإبداع, each with one line of text and photos
- **Initiatives (مبادرات الجمعية):**
  - بودكاست تون تالك
  - تجمع بُعد
  - تحديات الجمعية
  - التعليم والتدريب
  - راوي (a Saudi animated-film festival, still in development)
  - ترجمة الكتب الأكاديمية
- **International participation:** Cairo International Film Festival 44 (2022) and Carthage, photos
- **Aspirations (تطلعاتنا)**
- **Partners (شركاء النجاح):** 12 logos:
  - Effat University
  - Society of Oral Medicine
  - a café
  - Digital Game Association
  - Associations Support Fund
  - Khubara'
  - Arab Act
  - Gulf Aves
  - Microsoft
  - monday.com
  - Nuke
  - Foundry
- **Contact:** info@animation.org.sa and linktr.ee/animksa
- **Challenges and development needs (slide 17):** an internal funding pitch to the Ministry of Culture. **Not website content.**

## 3. Membership under the bylaws (Articles 8–17) and the profile (slides 20–39)

| Category (bylaws name / profile name) | Fee | Who | General Assembly | Source |
| --- | --- | --- | --- | --- |
| طالب / عضوية الطالب «المنتسب» | 200 SAR a year | Proof of being a student | No attendance or vote | Art. 8(6) |
| مشارك / عضوية المشارك | 400 SAR a year | Over 18 | No attendance or vote | Art. 8(7) |
| عادي / العضوية العادية «القيادي» | 600 SAR a year | Over 18; full legal capacity, good conduct; **6 months' prior membership**; form plus fee; **review by the board's committee, then a board decision** | Attends and votes; may stand for the board (Art. 30) | Art. 9, 17 |
| داعم / العضوية الداعمة | 600 SAR a year **plus an unrestricted donation of at least 100,000 SAR from the member's own account** | Meets the ordinary conditions | Ordinary rights plus extra votes in board elections | Art. 10 |
| فخري / العضوية الفخرية | None | **Granted by board decision**; no application | Discussion in board meetings, no vote | Art. 11 |

Rules the site must apply:

- **Art. 12, fees:**
  - paid once a year, or monthly if the member asks and the board agrees;
  - due before the end of the financial year;
  - **a member who joins mid-year pays only the share for the rest of the financial year**;
  - the board may give non-payers until the next General Assembly;
  - no rights while in arrears.
- **Art. 54, financial year:** 1 January to 31 December. Membership periods therefore run to **31 December**, not 12 months from payment.
- **Art. 13, loss of membership:** withdrawal, death, losing a condition, late payment, or a General Assembly decision. Art. 14: written notice with a right to object; reinstatement by board decision once the cause is gone.
- **Art. 14(3): nothing paid is refundable**, whether fees or donations.
- **Profile benefits** (consultation hours, discounts of 10–35%, workshops, library) are marked on the slides themselves: «مزايا تشغيلية مقترحة تعتمد بقرار مجلس الإدارة».

### Conflicts and gaps found (not resolved by me)

1. **Minimum age:** Art. 9 says over 18 for ordinary membership; Art. 17(1)(a) says at least 15 for General Assembly membership.
2. **Supporting donation:** slide 32 shows "≤ 100,000"; Art. 10 and slide 33 say "not less than". The site will follow the bylaws (at least 100,000).
3. **Licence numbers:** the profile's About text cites a Ministry of Labour licence (73739); the official line says registration 2189 and decision 74915.
4. **Typos in the About text:** التمية, الي, المحتوي, الرسوم المتحرك.
5. **Art. 8(4)** says membership is «مغلقة» (closed), while Art. 16 lists both closed and open benefit without choosing one.
6. **Art. 17(1)(ح):** the application must use the form prepared by the National Center (NCNP). The governance folders «آلية قبول أعضاء الجمعية العمومية» and «آلية إدارة طلبات العضوية» probably define it and are still to be read.
7. **No English text** in either source.
8. **Reapplying after rejection:** the bylaws don't cover it. Art. 14(2) covers reinstatement after loss of membership.

## 4. What changes on the website

### Content (public site)
- **Home and About:** use the vision, mission, founders' message, About, purpose and goals, replacing the developer drafts and the promo-video wording. Show the official registration line in the footer.
- **Board and General Assembly:** names and roles from the profile. Portraits need extracting from the PDF.
- **Projects and initiatives:** add the six initiatives and international participation alongside the existing challenges project.
- **Partners:** the 12 partners, with logos extracted from the profile slide.
- **Contact:** set the Society email and Linktree from the profile (D06 partly resolved).
- **Membership page:**
  - replace the old Instagram-based types (working, affiliate, honorary, distinguished) with the bylaws categories and the profile's names, prices, conditions, rights and benefits;
  - rewrite the FAQ from the bylaws.
- **Policies page:**
  - membership policy from bylaws Art. 8–14, quoted;
  - refund policy from Art. 14(3);
  - privacy policy from the governance PDF «سياسة خصوصية البيانات»;
  - terms of use and card-use policy stay pending, since no source exists.
- **Governance / disclosure (proposed):** downloadable bylaws, public policies and annual reports.

### Membership system (Stage 3 code, not yet committed)
- Seed the **four** purchasable plans as real, non-demo plans with the profile's prices. Honorary is shown as granted only. Supporting membership is an application handled offline, because the 100,000 SAR donation can't go through a card checkout.
- Plans gain eligibility rules:
  - minimum age;
  - proof-of-study document (student);
  - six months' prior membership (ordinary and supporting, checked by staff);
  - General Assembly rights shown on the plan.
- Application form gains:
  - date of birth (server checks the age);
  - a private proof-of-study upload (PDF or image) for students;
  - for ordinary membership, a declaration of the earlier membership's start date, which staff verify.
- Review copy says that ordinary membership is decided by the committee and then the board; the admin records the board decision.
- **Periods and pricing (Stage 4):**
  - each period ends on 31 December;
  - the price is pro-rated for the remainder of the financial year and always computed on the server;
  - renewal is due each January;
  - access to membership services ends once a period expires without payment, and the board's grace period is a staff action;
  - no refunds.
- Upgrade path (student → participant → ordinary) as a new application.

### Translations
English drafts for every new Arabic text, marked as awaiting the Society's approval (D08).

## 5. Order of work
1. Read and record the two NCNP-related membership mechanism folders and the public policy PDFs (needs approval to download).
2. Content model and seed: sections, board, assembly, initiatives, partners, contact, footer line. Images extracted from the profile.
3. Membership page and policies from the bylaws and profile.
4. Plans and application rules (contracts, API, form, admin), with tests.
5. Arabic and English QA at 1280 and 390 px; update PROGRESS, DECISIONS and BRAND_ASSETS.

## 6. Malek's answers (19 November 2026)
- **Pro-rating:** by remaining months, counting the joining month: fee × (months left including this one) ÷ 12, with each period ending 31 December.
- **Benefits:** remove the discounts and library access from every membership. The other profile benefits are shown with the profile's own note that they are proposed and need a board decision.
- **People:** the board and the General Assembly lists are both published, with names and portraits as in the profile.
- **English:** I draft faithful translations, marked as awaiting the Society's approval (D08).
