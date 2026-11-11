export const PUBLIC_SECTIONS = [
  "about",
  "fields",
  "projects",
  "news",
  "membership",
  "partners",
  "contact",
  "policies",
] as const;
export type PublicSection = (typeof PUBLIC_SECTIONS)[number];

export function isPublicSection(value: string): value is PublicSection {
  return (PUBLIC_SECTIONS as readonly string[]).includes(value);
}

interface EmptyCopy {
  title: string;
  body: string;
}

/**
 * Interface dictionary: chrome, headings, labels and states. Editorial content (objectives, fields,
 * membership types, initiatives…) lives in src/content and is shared across pages.
 * Every locale must satisfy this type, so a missing key fails typecheck.
 */
export interface Dictionary {
  meta: { siteName: string; tagline: string; description: string };
  a11y: {
    skipToContent: string;
    primaryNav: string;
    menu: string;
    closeMenu: string;
    switchLanguage: string;
    memberNav: string;
    adminNav: string;
    onThisPage: string;
    previous: string;
    next: string;
  };
  language: { switchTo: string; switchToShort: string };
  status: { banner: string; draft: string; supplied: string; pending: string };
  /** Shown where published content couldn't be loaded from the API. */
  unavailable: EmptyCopy;
  nav: { home: string } & Record<PublicSection, string>;
  actions: {
    exploreMembership: string;
    aboutSociety: string;
    contact: string;
    signIn: string;
    viewDetails: string;
    explore: string;
    allProjects: string;
    allNews: string;
    register: string;
    backTo: string;
  };
  stage: {
    label: string;
    caption: string;
    play: string;
    replay: string;
    frame: string;
    frameValue: string;
    spacing: string;
  };
  intro: { enter: string; enterOther: string };
  home: {
    hero: { scroll: string };
    video: { heading: string; play: string; caption: string; label: string };
    about: { heading: string };
    objectives: { heading: string; lead: string };
    fields: { heading: string; lead: string; hint: string };
    membership: { heading: string; journey: string; types: string; granted: string; plansNote: string };
    projects: { heading: string; lead: string; empty: EmptyCopy };
    governance: { heading: string; board: string; boardEmpty: EmptyCopy; assembly: string; readMore: string };
    partners: { heading: string; empty: EmptyCopy; all: string };
    news: { heading: string; empty: EmptyCopy; all: string };
    closing: { heading: string; body: string };
  };
  about: {
    title: string;
    lead: string;
    toc: { intro: string; visionMission: string; objectives: string; board: string; assembly: string };
    vision: string;
    mission: string;
    missionPending: string;
    visionMissionPending: EmptyCopy;
    boardEmpty: EmptyCopy;
  };
  fieldsPage: { title: string; lead: string; roles: string; jump: string };
  membershipPage: {
    title: string;
    lead: string;
    why: string;
    types: string;
    who: string;
    rights: string;
    granted: string;
    plans: string;
    plansEmpty: EmptyCopy;
    benefits: string;
    benefitsEmpty: EmptyCopy;
    journey: string;
    faq: string;
    applyNote: string;
  };
  projectsPage: {
    title: string;
    lead: string;
    field: string;
    progress: string;
    participate: string;
    noRegistration: string;
    coverNote: string;
    empty: EmptyCopy;
  };
  newsPage: {
    title: string;
    lead: string;
    filters: { all: string; news: string; events: string };
    labels: { news: string; event: string };
    date: string;
    location: string;
    empty: EmptyCopy;
    filteredEmpty: EmptyCopy;
    showAll: string;
  };
  partnersPage: { title: string; lead: string; empty: EmptyCopy; visit: string };
  contactPage: {
    title: string;
    lead: string;
    form: {
      name: string;
      email: string;
      emailHint: string;
      subject: string;
      message: string;
      send: string;
      sending: string;
      sent: EmptyCopy;
      sendAnother: string;
      errors: { name: string; email: string; subject: string; message: string; failed: string; rateLimited: string };
    };
    info: string;
    website: string;
    emailPending: string;
    devNote: string;
  };
  policiesPage: { title: string; lead: string; pending: EmptyCopy };
  auth: AuthDict;
  member: {
    title: string;
    nav: { account: string };
    signedInAs: string;
    comingNext: string;
    profile: { title: string; save: string; saving: string; saved: string; language: string };
    password: { title: string; lead: string; save: string; saving: string; saved: string };
  };
  admin: {
    title: string;
    nav: { overview: string; security: string; audit: string; posts: string; projects: string; partners: string; sections: string; media: string };
    roles: { admin: string; editor: string; member: string };
    welcome: string;
    roleLine: string;
    comingNext: string;
    security: {
      title: string;
      codesLeft: string;
      codesLow: string;
      regenerateLead: string;
      regenerate: string;
      regenerating: string;
    };
    audit: { title: string; lead: string; empty: string; when: string; action: string; actor: string; target: string; cli: string; system: string; actions: Readonly<Record<string, string>> };
    forbidden: { title: string; body: string };
    content: ContentAdminDict;
    systemStatus: string;
    apiHealth: string;
    apiReady: string;
    statusOk: string;
    statusDown: string;
    statusUnreachable: string;
  };
  devInbox: { title: string; lead: string; empty: string; to: string; openLink: string };
  notFound: { title: string; body: string; home: string };
  footer: { explore: string; society: string; policies: string; website: string; note: string; statement: readonly string[] };
}

/** Sign-in, sign-up, password and two-step screens. Error keys match API error codes and field messages. */
export interface AuthDict {
  layout: { back: string; note: string };
  fields: {
    name: string;
    email: string;
    password: string;
    newPassword: string;
    currentPassword: string;
    code: string;
    recoveryCode: string;
  };
  hints: { email: string; password: string; code: string; recoveryCode: string };
  errors: {
    name: string;
    email: string;
    password: string;
    password_short: string;
    password_long: string;
    password_wrong: string;
    code: string;
    code_wrong: string;
    recovery_code: string;
    invalid_credentials: string;
    email_unverified: string;
    token_invalid: string;
    rate_limited: string;
    session_ended: string;
    failed: string;
  };
  signIn: { title: string; lead: string; submit: string; submitting: string; forgot: string; noAccount: string; register: string; resend: string; resent: string };
  register: { title: string; lead: string; submit: string; submitting: string; haveAccount: string; signIn: string; sent: { title: string; body: string } };
  verify: { title: string; working: string; done: { title: string; body: string }; failed: { title: string; body: string }; signIn: string; resendLead: string; resend: string; resent: string };
  forgot: { title: string; lead: string; submit: string; submitting: string; sent: { title: string; body: string }; back: string };
  reset: { title: string; inviteTitle: string; lead: string; inviteLead: string; submit: string; submitting: string; done: { title: string; body: string }; signIn: string; missing: string; requestNew: string };
  mfa: {
    verifyTitle: string;
    verifyLead: string;
    recoveryLead: string;
    useRecovery: string;
    useCode: string;
    submit: string;
    submitting: string;
    setupTitle: string;
    setupLead: string;
    steps: readonly [string, string, string];
    qrAlt: string;
    manual: string;
    confirm: string;
    confirming: string;
    loading: string;
    codesTitle: string;
    codesLead: string;
    copy: string;
    copied: string;
    saved: string;
  };
  signOut: string;
  signingOut: string;
}


type ContentKindKey = "post" | "project" | "partner" | "section";
type SectionKeyName = "hero" | "about" | "vision" | "goals" | "assembly" | "board" | `policy-${"terms" | "privacy" | "membership" | "payment-refund" | "card-use"}`;
type Approval = "approved" | "supplied" | "draft";

/** Staff content editor. */
export interface ContentAdminDict {
  kinds: Record<ContentKindKey, { title: string; lead: string; create: string; newTitle: string; editTitle: string; empty: EmptyCopy }>;
  table: { title: string; state: string; updated: string; address: string; untitled: string; open: string };
  states: Record<"draft" | "published" | "changed", string>;
  stateHelp: Record<"draft" | "published" | "changed", string>;
  approvals: Record<Approval, string>;
  postTypes: Record<"news" | "event", string>;
  progress: Record<"ongoing" | "upcoming" | "completed", string>;
  sections: { details: string; text: string };
  langs: { ar: string; en: string };
  fields: {
    slug: string; slugHint: string; slugLocked: string;
    approval: string; approvalHint: string;
    postType: string; title: string; name: string; summary: string;
    body: string; bodyHint: string;
    date: string; dateHint: string;
    location: string; locationHint: string;
    registrationUrl: string; externalUrl: string; url: string; urlHint: string;
    field: string; progress: string; progressLabel: string; progressLabelHint: string;
    cover: string; coverHint: string;
  };
  actions: {
    save: string; saving: string;
    publish: string; publishChanges: string; publishing: string;
    unpublish: string; unpublishing: string;
    delete: string; deleting: string; confirmDelete: string; confirmDeleteBody: string; keep: string;
    view: string; back: string;
  };
  messages: {
    created: string; saved: string; published: string; unpublished: string;
    publishBlocked: string; fixFields: string; conflict: string; failed: string; network: string;
    forbidden: string; sessionEnded: string; unpublishFirst: string;
  };
  errors: Record<
    "required" | "too_long" | "url" | "date" | "slug" | "slug_taken" | "slug_locked" | "cover" | "failed"
    | "media" | "media_type" | "media_unreadable" | "media_small" | "media_too_large" | "media_missing" | "too_many" | "section",
    string
  >;
  /** Fixed page sections: what each is and where it shows. */
  pageSections: Record<SectionKeyName, { name: string; where: string }>;
  sectionTable: { section: string; where: string; notCreated: string; create: string };
  sectionFields: {
    heroTitle: string; heroBody: string;
    intro: string; aims: string; aimsHint: string;
    vision: string; mission: string; missionHint: string;
    goals: Record<"content" | "festivals" | "exchange" | "sponsorship", string>; goalsHint: string;
    assemblyBody: string; votingNote: string; votingNoteHint: string;
    members: string; membersHint: string; memberName: string; memberRole: string; portrait: string;
    addMember: string; removeMember: string; memberN: string; noMembers: string;
    policyBody: string; policyHint: string;
  };
  media: {
    image: string; logo: string; imageHint: string;
    upload: string; replace: string; remove: string; uploading: string;
    alt: string; altHint: string; uploaded: string;
    choose: string; crop: string; cropped: string; full: string;
  };
  /** Crop tool. */
  crop: {
    title: string; lead: string; area: string; keys: string;
    shape: string; shapes: Record<"free" | "square" | "landscape" | "wide" | "portrait", string>;
    apply: string; reset: string; cancel: string;
  };
  /** Media library page and picker. */
  library: {
    title: string; lead: string; pickTitle: string; pickLead: string;
    filters: { all: string; unused: string };
    empty: { title: string; body: string }; unusedEmpty: { title: string; body: string };
    uses: string; usesOne: string; unused: string; uploaded: string; size: string;
    use: string; close: string; more: string; loading: string; failed: string;
    delete: string; deleting: string; confirmDelete: string; confirmBody: string; keep: string; deleted: string; inUse: string; added: string;
    pruneNote: string;
  };
}
