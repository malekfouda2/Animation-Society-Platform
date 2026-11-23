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
    toc: { intro: string; founders: string; visionMission: string; objectives: string; board: string; assembly: string };
    purpose: string;
    assemblyMembers: string;
    assemblyCount: string;
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
    plansUnavailable: EmptyCopy;
    applyCta: string;
    benefits: string;
    requirements: string;
    source: string;
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
    links: string;
    devNote: string;
  };
  policiesPage: { title: string; lead: string; pending: EmptyCopy; documents: { title: string; lead: string; meta: string } };
  auth: AuthDict;
  membership: MembershipDict;
  member: {
    title: string;
    nav: { account: string; application: string };
    status: { title: string; none: string; open: string; start: string };
    signedInAs: string;
    comingNext: string;
    profile: { title: string; save: string; saving: string; saved: string; language: string };
    password: { title: string; lead: string; save: string; saving: string; saved: string };
  };
  admin: {
    title: string;
    nav: { overview: string; security: string; audit: string; posts: string; projects: string; partners: string; sections: string; media: string; applications: string; plans: string };
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
    intro: string; purpose: string; founders: string; foundersHint: string; optionalPair: string;
    vision: string; mission: string; missionHint: string;
    goals: string; goalsHint: string;
    assemblyBody: string; votingNote: string; votingNoteHint: string;
    members: string; membersHint: string; assemblyMembersHint: string; memberName: string; memberRole: string; portrait: string;
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

type AppState = "draft" | "submitted" | "needs_changes" | "approved" | "rejected";
type AppAction = "submitted" | "resubmitted" | "changes_requested" | "approved" | "rejected" | "reapplied";

/** Membership plans, the member's application and staff review (Stage 3). */
export interface MembershipDict {
  states: Record<AppState, string>;
  specializations: Record<"2d" | "3d" | "stop-motion" | "hybrid" | "other", string>;
  actions: Record<AppAction, string>;
  demo: string;
  demoNote: string;
  months: string;
  priceFor: string;
  byRequest: string;
  errors: Record<
    "required" | "too_long" | "phone" | "plan" | "plan_unavailable" | "photo" | "media_type" | "media_unreadable" | "media_small" | "media_too_large"
    | "price" | "duration" | "slug" | "slug_taken" | "conflict" | "locked" | "rate_limited" | "session_ended" | "forbidden" | "network" | "failed"
    | "date" | "age" | "student_proof" | "prior_membership" | "month" | "name_ar" | "name_en" | "meeting",
    string
  >;
  optional: string;
  /** The applicant's form and status (member area). */
  apply: {
    title: string;
    lead: string;
    steps: readonly [string, string, string, string];
    stepsLabel: string;
    plan: string;
    noPlans: { title: string; body: string };
    you: string;
    fullName: string; fullNameHint: string; fullNameEn: string; fullNameEnHint: string;
    reapply: string; reapplying: string; reapplyOn: string; reapplyNow: string;
    phone: string; phoneHint: string;
    city: string;
    specialization: string; choose: string;
    photo: string; photoHint: string; upload: string; replace: string; uploading: string; photoAlt: string; noPhoto: string; noImage: string;
    birthDate: string; birthDateHint: string;
    memberSince: string; memberSinceHint: string;
    studentProof: string; studentProofHint: string; studentProofAlt: string;
    generalAssembly: string;
    due: string;
    save: string; saving: string; saved: string;
    submit: string; resubmit: string; submitting: string; submitLead: string;
    unsaved: string;
    status: Record<AppState, { title: string; body: string }>;
    staffMessage: string;
    rejectReason: string;
    submittedPlan: string;
    answers: string;
    history: string;
    contact: string;
    startTitle: string; startBody: string; start: string;
  };
  admin: {
    nav: { applications: string; plans: string };
    list: {
      title: string; lead: string;
      search: string; searchHint: string; searchButton: string; clear: string;
      plan: string; anyPlan: string; filters: string;
      tabs: Record<"all" | AppState, string>;
      name: string; email: string; city: string; planCol: string; status: string; submitted: string; updated: string; open: string;
      unnamed: string;
      empty: { title: string; body: string };
      noMatch: { title: string; body: string };
      page: string; previous: string; next: string; total: string;
    };
    detail: {
      back: string;
      submittedOn: string; createdOn: string; account: string;
      answers: string; photo: string; noPhoto: string;
      birthDate: string; age: string; memberSince: string; studentProof: string; noProof: string; checkNote: string;
      submittedPlan: string; draftPlan: string; noPlan: string;
      history: string; noHistory: string; by: string; applicant: string; server: string;
      decide: string; decideLead: string;
      approve: string; approving: string; approveLead: string; meetingConfirm: string; meetingHint: string;
      requestChanges: string; requesting: string; messageLabel: string; messageHint: string; sendRequest: string;
      reject: string; rejecting: string; reasonLabel: string; reasonHint: string; confirmReject: string;
      cancel: string;
      waiting: Record<"draft" | "needs_changes", string>;
      decided: Record<"approved" | "rejected", string>;
      done: Record<"approved" | "changes" | "rejected", string>;
    };
    plans: {
      title: string; lead: string; create: string; newTitle: string; editTitle: string; back: string;
      name: string; price: string; duration: string; status: string; enabled: string; disabled: string;
      empty: { title: string; body: string };
      key: string; keyHint: string; keyLocked: string;
      planName: string; summary: string; eligibility: string; eligibilityHint: string;
      priceLabel: string; priceHint: string; durationLabel: string; durationHint: string;
      offer: string; offerHint: string; order: string; orderHint: string;
      rules: string; rulesHint: string; minAge: string; minAgeHint: string; studentProof: string; priorMonths: string; priorMonthsHint: string; generalAssembly: string; byRequest: string; byRequestHint: string;
      rulesSummary: { minAge: string; studentProof: string; priorMonths: string; generalAssembly: string; none: string };
      save: string; saving: string; saved: string; created: string;
      snapshotNote: string;
      demoLocked: string;
    };
  };
}
