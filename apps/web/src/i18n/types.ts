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
    video: { heading: string; pendingTitle: string; pendingBody: string };
    about: { heading: string };
    objectives: { heading: string; lead: string };
    fields: { heading: string; lead: string; hint: string };
    membership: { heading: string; journey: string; types: string; granted: string; plansNote: string };
    projects: { heading: string; lead: string; empty: EmptyCopy };
    governance: { heading: string; board: string; boardEmpty: EmptyCopy; assembly: string; readMore: string };
    partners: { heading: string; empty: EmptyCopy };
    news: { heading: string; empty: EmptyCopy };
    closing: { heading: string; body: string };
  };
  about: {
    title: string;
    lead: string;
    toc: { intro: string; visionMission: string; objectives: string; board: string; assembly: string };
    vision: string;
    mission: string;
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
  member: { title: string; placeholder: string; noAuthYet: string };
  admin: {
    title: string;
    placeholder: string;
    noAuthYet: string;
    systemStatus: string;
    apiHealth: string;
    apiReady: string;
    statusOk: string;
    statusDown: string;
    statusUnreachable: string;
  };
  notFound: { title: string; body: string; home: string };
  footer: { explore: string; society: string; policies: string; website: string; note: string; statement: readonly string[] };
}
