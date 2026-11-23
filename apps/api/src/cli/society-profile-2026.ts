/**
 * Public content from the Society's own documents, supplied by Malek on 19 Nov 2026:
 *
 * - ملف_الجمعية_التعريفي_2026.pdf (profile 2026): About, purpose, founders' message, vision, mission,
 *   goals, board, General Assembly, initiatives and partners.
 * - اللائحة الأساسية v.3.pdf (bylaws): the General Assembly definition and the membership, payment and
 *   refund articles quoted in the policies.
 *
 * Arabic is copied as written, including the source's own spelling (see DECISIONS: "Profile typos");
 * only Persian letterforms (ی، ھ) and broken spacing from the PDF export were normalised. English is
 * a developer translation awaiting the Society's approval (D08), which is why entries are marked
 * "supplied" rather than "approved". Image files are named as scripts/brand/extract-profile-images.py
 * writes them.
 */

type L = { ar: string; en: string };
const l = (ar: string, en: string): L => ({ ar, en });

export interface Person {
  name: L;
  role: L;
  /** File name (without .png) in the extracted images folder, or null when the profile shows none. */
  image: string | null;
}

export const ABOUT = {
  intro: l(
    "جمعية تقنية متخصصة في رعاية كل ما يندرج فنون الرسوم المتحركة تأسست في 1443. وتعد الجمعية من أوائل الجمعيات ذات طابع التخصص الفني التكنلوجي. مما يجعلها فريدة من نوعها وفريدة بما تقدم من مبادرات لتطوير صناعة الرسوم المتحركة في المملكة العربية السعودية. تم افتتاح الجمعية وانطلقت بشكل رسمي في عام 1443هـ بترخيص وزارة العمل والتمية الاجتماعية رقم (73739) بذلك انطلقت الجمعية لتقديم التوعية والدعم لفنانين ومحبين الرسوم المتحركة.",
    "A technical society devoted to supporting everything that falls within the arts of animation, founded in 1443 AH. It is one of the first societies of an artistic and technological specialism, which makes it unique in kind and in the initiatives it offers to develop the animation industry in Saudi Arabia. The Society opened and was officially launched in 1443 AH under licence no. (73739) from the Ministry of Labour and Social Development, and set out to offer awareness and support to animation artists and enthusiasts.",
  ),
  purpose: l(
    "تطوير المحتوى المرتبط بالأنيميشن بشكل مباشر أو غير مباشر بتقديم استشارات متخصصة مع توفير فرص تطويرية بتبادل الخبرات في مجال الرسوم المتحركة وتأسيس مهرجان لأفلام الرسوم المتحركة واستهداف رعاية الشركات المحلية والقطاع الحكومي لتعزيز الهوية الوطنية المرتبطة في الرسوم المتحركة. بالإضافة الي توفير فرص تطويرية بتبادل الخبرات وتصنيف المحتوي التدريبي ومعالجته مما يسهل الوصول له للمهتمين علاوة على رعاية كل ما يندرج تحت تخصص الرسوم المتحرك.",
    "To develop animation-related content, directly or indirectly, through specialised consultations; to provide development opportunities through the exchange of experience in animation; to establish an animated film festival and seek sponsorship from local companies and the government sector to strengthen the national identity connected with animation; to provide development opportunities through the exchange of experience and by classifying and processing training content so that it is easy for those interested to reach; and to support everything that falls within the field of animation.",
  ),
  founders: l(
    [
      "اللهم لك الحمد حمدًا يليق بجلال وجهك وعظيم سلطانك، والصلاة والسلام على نبينا محمد بن عبدالله، وعلى آله وصحبه أجمعين.",
      "في ظل اهتمام قيادتنا الرشيدة بالثقافة والإبداع، وما تتيحه رؤية السعودية 2030 من فرص، أسسنا جمعية الرسوم المتحركة لتكون بيتًا يجمع المواهب والمحترفين، ويسهم في تطوير هذه الصناعة في مملكتنا الحبيبة.",
      "نؤمن بأن الله وهب الإنسان قدرات تستحق الاكتشاف والرعاية، وأن الموهبة تنمو بالمعرفة والممارسة والفرص. ومن هنا، نسعى إلى مساندة المبدعين في طريقهم إلى الاحتراف، وربطهم بالتدريب والشراكات وفرص العمل، وتشجيع إنتاج أفلام تروي قصصنا وتعكس هويتنا وتصل إلى العالم.",
      "وبجهود أعضائنا وشركائنا، نطمح إلى صناعة مستدامة تحوّل الشغف إلى إنجاز ورزق كريم، وتفتح للأجيال القادمة آفاقًا لتحقيق أحلامها وخدمة وطنها.",
    ].join("\n\n"),
    [
      "Praise be to God, as befits the majesty of His face and the greatness of His authority, and peace and blessings be upon our Prophet Muhammad bin Abdullah, and upon all his family and companions.",
      "With our wise leadership's care for culture and creativity, and the opportunities that Saudi Vision 2030 opens up, we founded the Animation Society as a home that brings talents and professionals together and helps develop this industry in our beloved Kingdom.",
      "We believe that God has given people abilities that deserve to be discovered and nurtured, and that talent grows through knowledge, practice and opportunity. So we work to support creators on their way to becoming professionals, to connect them with training, partnerships and jobs, and to encourage films that tell our stories, reflect our identity and reach the world.",
      "Through the efforts of our members and partners, we aspire to a sustainable industry that turns passion into achievement and a decent living, and opens horizons for future generations to fulfil their dreams and serve their country.",
    ].join("\n\n"),
  ),
};

export const VISION = {
  vision: l(
    "أن تكون الجمعية رائدة في صناعة الرسوم المتحركة وتعزيز مكانة هذه الصناعة في المملكة العربية السعودية",
    "For the Society to be a pioneer in the animation industry and to strengthen the position of this industry in the Kingdom of Saudi Arabia",
  ),
  mission: l(
    [
      "تطوير معايير تنشيط الموارد البشرية والتنظيمية لصناعة الرسوم المتحركة",
      "تطوير منتجات ومحتوى الرسوم المتحركة وفق المعايير الدولية",
      "التعاون مع الشركاء الدوليين وتطوير شبكة للإنتاج المشترك والمشاريع المشتركة ونقل المعرفة من أجل صناعة الرسوم المتحركة السعودية",
      "تعزيز قوة وقدرة رواد الأعمال السعوديين للرسوم المتحركة",
      "جعل المزيد من الناس يدركون تاريخ صناعة الرسوم المتحركة",
    ].join("\n"),
    [
      "Develop standards for activating the human and organisational resources of the animation industry",
      "Develop animation products and content to international standards",
      "Work with international partners and build a network for co-production, joint projects and knowledge transfer for the Saudi animation industry",
      "Strengthen the power and capability of Saudi animation entrepreneurs",
      "Make more people aware of the history of the animation industry",
    ].join("\n"),
  ),
};

export const GOALS = l(
  [
    "تطوير المحتوى المرتبط بالأنيميشن بشكل مباشر أو غير مباشر بتقديم استشارات متخصصة.",
    "توفير فرص تطويرية بتبادل الخبرات في مجال الرسوم المتحركة.",
    "تأسيس مهرجان لأفلام الرسوم المتحركة و استهداف رعاية الشركات المحلية والقطاع الحكومي لتعزيز الهوية الوطنية المرتبطة في الرسوم المتحركة.",
    "توفير فرص تطويرية بتبادل الخبرات و تصنيف المحتوي التدريبي ومعالجته مما يسهل الوصول له للمهتمين.",
    "رعاية كل ما يندرج تحت تخصص الرسوم المتحركة.",
  ].join("\n"),
  [
    "Develop animation-related content, directly or indirectly, through specialised consultations.",
    "Provide development opportunities through the exchange of experience in animation.",
    "Establish an animated film festival and seek sponsorship from local companies and the government sector to strengthen the national identity connected with animation.",
    "Provide development opportunities through the exchange of experience, and classify and process training content so it is easy for those interested to reach.",
    "Support everything that falls within the field of animation.",
  ].join("\n"),
);

const chair = l("رئيس مجلس الإدارة", "Chairman of the Board");
const vice = l("نائب رئيس مجلس الإدارة", "Vice-Chairman of the Board");
const boardMember = l("عضو مجلس إدارة", "Board member");
const none = l("", "");

/** Profile board slide (Arabic names, roles, portraits). English names are the profile's own, from its General Assembly slide. */
export const BOARD: readonly Person[] = [
  { name: l("سعد أحمد سعد الزعاقي", "Saad Al-Zaaqi"), role: chair, image: "board-saad-alzaaqi" },
  { name: l("خالد سليمان صالح العنقري", "Khalid Al-Anqari"), role: vice, image: "board-khalid-alanqari" },
  { name: l("د. عبدالرحمن صالح راشد النجادي", "Dr. Abdulrahman Al-Najadi"), role: boardMember, image: "board-abdulrahman-alnajadi" },
  { name: l("د. أحلام عبدالله راشد الشدوخي", "Dr. Ahlam Al-Shadoukhi"), role: boardMember, image: "board-ahlam-alshadoukhi" },
  { name: l("عبدالواحد بن محمد بن علي العبدلي", "Abdulwahad Al-Abdali"), role: boardMember, image: "board-abdulwahad-alabdali" },
];

/** Profile slide "الجمعية العمومية": the 14 current members, in the slide's numbered order. */
export const ASSEMBLY: readonly Person[] = [
  { name: l("عبدالواحد العبدلي", "Abdulwahad Al-Abdali"), role: none, image: "assembly-01-abdulwahad-alabdali" },
  { name: l("خالد العتين", "Khalid Al-Otein"), role: none, image: "assembly-02-khalid-alotein" },
  { name: l("عبدالرحمن المهنا", "Abdulrahman Al-Muhanna"), role: none, image: "assembly-03-abdulrahman-almuhanna" },
  { name: l("مايكل مورينجزي", "Michael Murengezi"), role: none, image: "assembly-04-michael-murengezi" },
  { name: l("د. فاطمة العتين", "Dr. Fatima Al-Otein"), role: none, image: null },
  { name: l("د. أحلام الشدوخي", "Dr. Ahlam Al-Shadoukhi"), role: none, image: "assembly-06-ahlam-alshadoukhi" },
  { name: l("سعد الزعاقي", "Saad Al-Zaaqi"), role: none, image: "assembly-07-saad-alzaaqi" },
  // The slide's own crop of this portrait is cut off; the board slide's portrait is the same photo.
  { name: l("خالد العنقري", "Khalid Al-Anqari"), role: none, image: "board-khalid-alanqari" },
  { name: l("د. عبدالرحمن النجادي", "Dr. Abdulrahman Al-Najadi"), role: none, image: "assembly-09-abdulrahman-alnajadi" },
  { name: l("تشارلز كويني", "Charles Cooney"), role: none, image: "assembly-10-charles-cooney" },
  { name: l("محمد عبدالواحد", "Mohammed Abdulwahad"), role: none, image: "assembly-11-mohammed-abdulwahad" },
  { name: l("د. محمد غزالة", "Dr. Mohammed Ghazalah"), role: none, image: null },
  { name: l("أ. طاهر العبدلي", "Taher Al-Abdali"), role: none, image: "assembly-13-taher-alabdali" },
  { name: l("د. حمد الدوسري", "Dr. Hamad Al-Dawsari"), role: none, image: "assembly-14-hamad-aldawsari" },
];

export const ASSEMBLY_TEXT = {
  // Bylaws, Article 1 (definitions) and Article 15.
  body: l(
    "الجمعية العمومية أعلى سلطة في الجمعية، وتتكون من مجموع الأعضاء العاملين الذين أوفوا بالتزاماتهم تجاه الجمعية، وتكون قراراتها ملزمة لأعضائها كافة، ولبقية أجهزة الجمعية.",
    "The General Assembly is the Society's highest authority. It is made up of all the working members who have met their obligations to the Society, and its decisions bind all its members and the Society's other bodies.",
  ),
  // Bylaws, Articles 8, 9 and 10.
  votingNote: l(
    "حق الحضور والتصويت في الجمعية العمومية للعضوية العادية والداعمة، ولا يحق لعضوية الطالب وعضوية المشارك حضور الجمعية العمومية أو التصويت فيها.",
    "Ordinary and supporting members have the right to attend and vote in the General Assembly. Student and participant members may not attend or vote in it.",
  ),
};

/** Profile slide "مبادرات الجمعية". The challenges initiative already exists as motion-analysis-challenges. */
export const INITIATIVES = [
  {
    slug: "toon-talk-podcast",
    title: l("بودكاست تون تالك", "Toon Talk podcast"),
    summary: l("حوارات مع المختصين", "Conversations with specialists"),
    progress: "ongoing" as const,
    progressLabel: l("من مبادرات الجمعية", "A Society initiative"),
    cover: "panelDiscs",
  },
  {
    slug: "buad-gathering",
    title: l("تجمع بُعد", "Bu‘d gathering"),
    summary: l("لقاءات للتعلّم والتواصل", "Meet-ups for learning and connecting"),
    progress: "ongoing" as const,
    progressLabel: l("من مبادرات الجمعية", "A Society initiative"),
    cover: "panelContours",
  },
  {
    slug: "education-and-training",
    title: l("التعليم والتدريب", "Education and training"),
    summary: l("تطوير المهارات الفنية والتقنية", "Developing artistic and technical skills"),
    progress: "ongoing" as const,
    progressLabel: l("من مبادرات الجمعية", "A Society initiative"),
    cover: "panelSweeps",
  },
  {
    slug: "academic-book-translation",
    title: l("ترجمة الكتب الأكاديمية", "Translating academic books"),
    summary: l("مشروع لإثراء المراجع العربية", "A project to enrich Arabic references"),
    progress: "ongoing" as const,
    progressLabel: l("من مبادرات الجمعية", "A Society initiative"),
    cover: "wavesCool",
  },
  {
    slug: "rawi-festival",
    title: l("راوي", "Rawi"),
    summary: l("مهرجان لأفلام الرسوم المتحركة السعودية، قيد التطوير", "A festival of Saudi animated films, in development"),
    progress: "upcoming" as const,
    progressLabel: l("قيد التطوير", "In development"),
    cover: "wavesWarm",
  },
];

/** Profile slide "شركاء النجاح", in the slide's reading order (right to left, top to bottom). */
export const PARTNERS = [
  { slug: "effat-university", title: l("جامعة عفت", "Effat University"), image: "partner-effat-university" },
  { slug: "society-of-oral-medicine", title: l("جمعية طب الفم", "Society of Oral Medicine"), image: "partner-society-of-oral-medicine" },
  { slug: "seventies-cafe", title: l("مقهى السبعينات", "Seventies Café"), image: "partner-seventies-cafe" },
  { slug: "digital-game-association", title: l("جمعية الألعاب الرقمية", "Digital Game Association"), image: "partner-digital-game-association" },
  { slug: "associations-support-fund", title: l("صندوق دعم الجمعيات", "Associations Support Fund"), image: "partner-associations-support-fund" },
  { slug: "arab-act", title: l("Arab Act", "Arab Act"), image: "partner-arab-act" },
  { slug: "khubara", title: l("خبراء", "Khubara"), image: "partner-khubara" },
  { slug: "gulf-axes", title: l("محاور خليج", "Gulf Axes"), image: "partner-gulf-axes" },
  { slug: "foundry", title: l("Foundry", "Foundry"), image: "partner-foundry" },
  { slug: "nuke", title: l("Nuke", "Nuke"), image: "partner-nuke" },
  { slug: "monday-com", title: l("monday.com", "monday.com"), image: "partner-monday" },
  { slug: "microsoft", title: l("Microsoft", "Microsoft"), image: "partner-microsoft" },
];

/**
 * Policies quoted from the bylaws (checked against the page images, pages 8–9). Paragraphs are
 * separated by blank lines; the policy page shows each line as written.
 */
export const POLICIES = {
  /**
   * The Society's data privacy policy (سياسة خصوصية البيانات, Drive: أدلة الحوكمة), Article 5 "the data
   * privacy policy for the Society's website", typed from the page images (the PDF's text layer is
   * unreadable). Wording as written, including the repeated "ببياناتك أو بياناتك" in point 9.
   */
  privacy: l(
    [
      "من سياسة خصوصية البيانات لجمعية الرسوم المتحركة. النص الكامل للسياسة متاح أدناه ضمن وثائق الحوكمة.",
      "سياسة خصوصية البيانات لموقع الجمعية\nالمادة الخامسة",
      "1- من حقك معرفة كيفية استخدام البيانات التي تشاركها مع موقعنا الإلكتروني.",
      "2- نلتزم بحماية حقوق جميع زوار ومستخدمي هذا الموقع ونلتزم بالحفاظ على سرية البيانات وقد أعددنا سياسة الخصوصية هذه للإفصاح عن النهج الذي نتبعه في جمع البيانات ونشرها على موقع الجمعية الإلكتروني.",
      "3- لا نقوم نهائياً بتبادل البيانات الشخصية مع أي جهة تجارية باستثناء ما يتم الإعلان عنه للمستخدم وبعد موافقته على ذلك.",
      "4- قد نستخدم البيانات المسجلة في الموقع لعمل الاستبانات وأخذ الآراء بهدف تطوير الموقع وتقديم تجربة استخدام أكثر سهولة وفعالية للزوار والمستخدمين. كما يمكننا من التواصل معكم عند الحاجة في حالة رغبتكم في التبرُّع للمشاريع والأعمال الخيرية أو رغبتكم في الاطلاع على ما يستجد من المشاريع والأعمال الخيرية التي تقوم بها الجمعية حيث تساعدنا هذه البيانات في التواصل معك، والإجابة عن استفسارات، وتنفيذ الطلبات.",
      "5- لا نقوم بمشاركة هذه البيانات مع أطراف خارجية إلا إذا كانت هذه الجهات لازمة في عملية استكمال طلبك، ما لم يكن ذلك في إطار بيانات جماعية تُستخدم للأغراض الإحصائية والأبحاث، دون اشتمالها على أية بيانات من الممكن استخدامها للتعريف بك.",
      "6- وفي حالات استثنائية (كالتحقيقات والقضايا) قد يطّلع موظفو الجهات الرقابية أو من يلزم اطلاعه على ذلك؛ خضوعًا لأحكام القانون وأوامر الجهات القضائية في المملكة.",
      "7- تنطبق سياسة الخصوصية هذه على كافّة الخدمات والتعاملات التي يتم إجراؤها على الموقع إلا في الحالات التي يتمُّ فيها النصُّ على خدمات أو تعاملات ذات خصوصية؛ فإنه يكون لها سياسةُ خصوصية منفصلة، وغير مدمجة بسياسة الخصوصية هذه.",
      "8- على الرغم من ذلك قد يحتوي الموقع على روابط لمواقع إلكترونية أخرى تقع خارج سيطرتنا، ولا تغطيها سياسة الخصوصية هذه، في حال قمت بالوصول إلى مواقع أخرى من خلال استخدام الروابط المتاحة على موقعنا؛ فإنك ستخضع لسياسة الخصوصية المتعلّقة بهذه المواقع، والتي قد تختلف عن سياسة الموقع؛ مما يتطلب منك قراءة سياسة الخصوصية المتعلّقة بتلك المواقع.",
      "9- في كل الأحوال لن نقوم بالبيع أو التأجير أو المتاجرة ببياناتك أو بياناتك لمصلحة أي طرف ثالث خارج هذا الموقع. وسنحافظ في كافَّة الأوقات على خصوصية كافة بياناتك الشخصية التي نتحصل عليها وسريتها.",
      "10- نظرًا للتطوُّر الهائل في مجال التقنية، والتغيُّر في نطاق القوانين المتعلقة بالمجال الإلكتروني؛ فالجمعية تحتفظ بالحقِّ في تعديل بنود سياسة الخصوصية هذه وشروطها في أي وقتٍ تراه ملائماً، ويتم تنفيذ التعديلات على موقع الجمعية، ويتم إخطاركم في حالة إجراء أية تعديلات ذات تأثير عبر موقع الجمعية أو البريد الإلكتروني للمستخدم إن وجد.",
    ].join("\n\n"),
    [
      "From the Animation Society's data privacy policy. English translation for reference; the Arabic text prevails. The full policy is available below with the governance documents.",
      "Data privacy policy for the Society's website\nArticle 5",
      "1- You have the right to know how the data you share with our website is used.",
      "2- We are committed to protecting the rights of all visitors and users of this website and to keeping data confidential. We have prepared this privacy policy to disclose how we collect data and publish it on the Society's website.",
      "3- We never exchange personal data with any commercial party, except as announced to the user and with their consent.",
      "4- We may use the data registered on the site for surveys and feedback, to improve the site and make it easier and more effective for visitors and users. It also lets us contact you when needed if you wish to donate to charitable projects and work, or to hear about new projects and charitable work the Society carries out. This data helps us contact you, answer enquiries and carry out requests.",
      "5- We do not share this data with outside parties unless they are needed to complete your request, other than as aggregate data used for statistics and research that contains nothing that could be used to identify you.",
      "6- In exceptional cases (such as investigations and legal cases), staff of regulatory authorities or others who need to may see it, in accordance with the law and the orders of the judicial authorities in the Kingdom.",
      "7- This privacy policy applies to all services and transactions carried out on the site, except where services or transactions with their own privacy terms are specified; those have a separate privacy policy that is not part of this one.",
      "8- The site may nevertheless contain links to other websites outside our control that this privacy policy does not cover. If you reach other sites through links on our site, you are subject to those sites' privacy policies, which may differ from this site's, so please read them.",
      "9- In all cases we will not sell, rent or trade your data for the benefit of any third party outside this site, and we will always keep all the personal data we obtain private and confidential.",
      "10- Given rapid developments in technology and changes in the laws on the digital field, the Society reserves the right to amend the terms of this privacy policy at any time it sees fit. Amendments are made on the Society's website, and you will be notified of any significant amendment through the Society's website or the user's email, if any.",
    ].join("\n\n"),
  ),
  membership: l(
    [
      "من اللائحة الأساسية لجمعية الرسوم المتحركة.",
      "المادة الثالثة عشر:\nتزول صفة العضوية عن العضو بتوصية من مجلس الإدارة بعد موافقة الجمعية العمومية وذلك في أي من الحالات الآتية:\n1- الانسحاب من الجمعية، وذلك بناء على طلب خطي يقدمه العضو إلى مجلس الإدارة، ولا يحول ذلك دون حق الجمعية في مطالبته بأي مستحقات عليه أو أموال تكون تحت يديه.\n2- الوفاة.\n3- إذا فقد شرطاً من شروط العضوية.\n4- إذا تأخر العضو عن أداء الاشتراك عن موعد استحقاقه وفقًا لما ورد في المادة الثانية عشر.\n5- إذا صدر قرار من الجمعية العمومية بسحب العضوية، وذلك في أي من الحالات الآتية:\nأ. إذا أقدم العضو على تصرف من شأنه أن يلحق ضرراً مادياً أو أدبياً بالجمعية.\nب. إذا قام العضو باستغلال عضويته في الجمعية لغرض شخصي.",
      "المادة الرابعة عشر:\n1- يجب على مجلس الإدارة في حالات زوال العضوية وفقًا لما ورد في الفقرات (3) و(4) و(5) من المادة الثالثة عشر من هذه اللائحة إبلاغ من زالت عضويته خطيًا بزوال عضويته وحقه بالاعتراض.\n2- يجوز للعضو بعد انتفاء سبب زوال العضوية أن يقدم طلبًا إلى مجلس الإدارة لرد العضوية إليه، وعلى المجلس أن يبت في الطلب بقرار مسبب ويبلغه إلى العضو.\n3- لا يجوز للعضو أو من زالت عضويته ولا لورثته المطالبة باسترداد أي مبلغ دفعه العضو للجمعية سواء كان اشتراكاً، أو تبرعًا أو غيرها.",
    ].join("\n\n"),
    [
      "From the Animation Society's bylaws. English translation for reference; the Arabic text prevails.",
      "Article 13:\nA member loses membership on the board's recommendation, after the General Assembly's approval, in any of the following cases:\n1- Withdrawal from the Society, on a written request the member submits to the board. This does not affect the Society's right to claim any amounts owed by the member or funds in the member's hands.\n2- Death.\n3- Losing one of the conditions of membership.\n4- Failing to pay the subscription by its due date, as set out in Article 12.\n5- A General Assembly decision to withdraw the membership, in either of the following cases:\na. The member does something that causes the Society material or moral harm.\nb. The member exploits their membership of the Society for a personal purpose.",
      "Article 14:\n1- Where membership is lost under paragraphs (3), (4) and (5) of Article 13 of these bylaws, the board must notify the former member in writing of the loss of membership and of their right to object.\n2- Once the reason for losing membership no longer applies, the member may ask the board to restore their membership, and the board must decide on the request by a reasoned decision and notify the member.\n3- Neither a member, a former member nor their heirs may claim back any amount the member paid the Society, whether a subscription, a donation or anything else.",
    ].join("\n\n"),
  ),
  paymentRefund: l(
    [
      "من اللائحة الأساسية لجمعية الرسوم المتحركة.",
      "المادة الثانية عشر:\nيجب على كل عضو في الجمعية أن يدفع الاشتراك المحدد حسب نوع العضوية التي ينتمي إليها، ولا يحق له ممارسة أي من حقوقه في حالة إخلاله بسداد الاشتراك، وتكون أحكام الاشتراك حسب الآتي:\n1- يؤدَّى اشتراك العضوية مرة في السنة، أو بناء على جدولة شهرية وحسب طلب العضو وما يقرره مجلس الإدارة، مع مراعاة الآتي:\nأ. وجوب أداء الاشتراك السنوي قبل نهاية السنة المالية.\nب. لا يُعفى العضو من سداد المبالغ المستحقة عليه في الجمعية في حال انتهاء عضويته بها.\n2- إذا انضم أحد الأعضاء إلى الجمعية خلال السنة المالية، فلا يؤدي من الاشتراك إلا نسبة ما يوازي المدة المتبقية من السنة المالية للجمعية.\n3- يجوز للمجلس إمهال أعضاء الجمعية غير المسددين إلى موعد انعقاد أقرب جمعية عمومية.",
      "المادة الرابعة عشر (الفقرة 3):\nلا يجوز للعضو أو من زالت عضويته ولا لورثته المطالبة باسترداد أي مبلغ دفعه العضو للجمعية سواء كان اشتراكاً، أو تبرعًا أو غيرها.",
    ].join("\n\n"),
    [
      "From the Animation Society's bylaws. English translation for reference; the Arabic text prevails.",
      "Article 12:\nEvery member must pay the subscription set for their type of membership, and may not exercise any of their rights while in default of payment. The subscription rules are as follows:\n1- The membership subscription is paid once a year, or on a monthly schedule at the member's request and as the board decides, provided that:\na. The annual subscription must be paid before the end of the financial year.\nb. A member is not released from amounts owed to the Society if their membership ends.\n2- A member who joins the Society during the financial year pays only the share of the subscription for the rest of the Society's financial year.\n3- The board may give members who have not paid until the next General Assembly meeting.",
      "Article 14 (paragraph 3):\nNeither a member, a former member nor their heirs may claim back any amount the member paid the Society, whether a subscription, a donation or anything else.",
    ].join("\n\n"),
  ),
};
