/**
 * content.ts — the single, independent source of truth for all site text,
 * both page content AND UI/chrome labels. Both locales live side by side so the
 * ES|EN toggle has everything it needs without a network round-trip.
 *
 * Translations are faithful to the Spanish source; no facts were invented.
 * Anything still missing real data is marked with TODO(real data).
 */

export type Locale = 'es' | 'en';

/** A value provided for both locales. */
export type L<T> = Record<Locale, T>;

/**
 * All chrome / UI copy for the site, per locale.
 * Section content lives in the constants below; `UI` holds the labels only.
 */
export interface UI {
  meta: {
    title: string;
    description: string;
    /** og:locale tag the runtime switcher applies (server default stays es_ES). */
    ogLocale: string;
  };
  skipLink: string;
  nav: {
    ariaLabel: string;
    work: string;
    /** Social links (open in a new tab). */
    linkedin: string;
    linkedinAria: string;
    github: string;
    githubAria: string;
    /** Accessible name for the mobile menu disclosure button. */
    menuLabel: string;
    /** Accessible label for the live Canary-Islands clock. */
    clockLabel: string;
  };
  langSwitch: {
    label: string;
    /** Visible short codes on the ES/EN language switch. */
    esShort: string;
    enShort: string;
    /** Accessible names for the ES/EN language switch buttons. */
    esAria: string;
    enAria: string;
  };
  hero: {
    linkedin: string;
    linkedinAria: string;
    github: string;
    githubAria: string;
    valuePropAria: string;
    /** Giant ALL-CAPS editorial statement in the hero. */
    statement: string;
    /** Bracketed "[ Perfil ]" marker labelling the value-prop column. */
    profileLabel: string;
  };
  sections: {
    about: string;
    experience: string;
    portfolio: string;
    skills: string;
    education: string;
    languages: string;
  };
  experience: {
    highlightsLabel: string;
  };
  projects: {
    stackLabel: string;
    soon: string;
    view: string;
    /** Honest empty state shown while no real projects are published. */
    emptyLead: string;
    emptyCta: string;
    emptyCtaAria: string;
  };
  footer: {
    socials: string;
    linkedin: string;
    github: string;
    rights: string;
    /** Specialities line stacked under the signature. */
    disciplines: string;
  };
}

export interface Profile {
  /** Wordmark shown in the nav (the full display name). */
  wordmark: string;
  /** Short handle / alias shown beside the wordmark. */
  alias: string;
  /** Full legal name — hero headline. */
  name: string;
  role: L<string>;
  location: L<string>;
  /** One-line value proposition for the hero. */
  valueProp: L<string>;
  github: string;
  linkedin: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: L<string>;
  period: L<string>;
  /** Current role — gets a status marker, not a colour. */
  current?: boolean;
  summary: L<string>;
  highlights?: L<string[]>;
}

export interface Project {
  id: string;
  name: string;
  sector: L<string>;
  description: L<string>;
  stack: string[];
  /** CSS custom property supplying the project's own hue (defined in tokens.css). */
  hueVar: string;
  featured?: boolean;
  /** TODO(real project data: link, image, copy). */
  link: string | null;
}

export interface Skill {
  name: string;
}

export interface SkillGroup {
  id: string;
  title: L<string>;
  skills: Skill[];
}

export interface EducationItem {
  title: L<string>;
  place: string;
  period: string;
}

export interface LanguageItem {
  name: L<string>;
  detail: L<string>;
}

export const profile: Profile = {
  wordmark: 'Aythami Santana',
  alias: 'oasrcode',
  name: 'Aythami Santana',
  role: {
    es: 'Desarrollador Full Stack',
    en: 'Full Stack Developer',
  },
  location: {
    es: 'Las Palmas de Gran Canaria',
    en: 'Las Palmas de Gran Canaria, Spain',
  },
  valueProp: {
    es: 'Conecto frontend, backend y datos para convertir información compleja en herramientas útiles.',
    en: 'I connect frontend, backend and data to turn complex information into useful tools.',
  },
  github: 'https://github.com/oasrcode',
  linkedin: 'https://www.linkedin.com/in/oasrjob/',
};

/**
 * About copy, re-presented for the section's pull-quote + dossier layout.
 *
 * The mission line that used to close the third paragraph now leads the section
 * as the display pull-quote (`manifesto`); the remaining text stays as body.
 * Wording is unchanged — the sentence is only moved, never rewritten.
 *
 * `manifesto` is split around the accented phrase so the signature accent bar
 * can be drawn under exactly that phrase on reveal.
 */
export interface ManifestoCopy {
  /** Statement before the accented phrase. */
  lead: string;
  /** Phrase the signature accent bar is drawn under. */
  accent: string;
  /** Statement after the accented phrase. */
  tail: string;
}

export interface AboutCopy {
  /** Supporting paragraphs (Satoshi, `--muted-2`). */
  body: L<string[]>;
  /** The extracted mission statement, split around its accented phrase. */
  manifesto: L<ManifestoCopy>;
}

export const about: AboutCopy = {
  body: {
    es: [
      'Soy desarrollador Full Stack especializado en aplicaciones web, sistemas de emergencia, GIS e integración de datos en tiempo real.',
      'He trabajado en proyectos de emergencia, seguridad pública, sanidad e industria, desarrollando soluciones que conectan interfaces, servicios y distintas fuentes de información.',
      'Me interesa especialmente transformar problemas complejos en herramientas claras, visuales y útiles para quienes las utilizan.',
    ],
    en: [
      'I’m a Full Stack developer specialised in web applications, emergency systems, GIS and real-time data integration.',
      'I’ve worked on projects in emergency services, public safety, healthcare and industry, building solutions that connect interfaces, services and different sources of information.',
      'I’m especially interested in turning complex problems into clear, visual and useful tools for the people who use them.',
    ],
  },
  manifesto: {
    es: {
      lead: 'Datos complejos. ',
      accent: 'Aplicaciones que se entienden',
      tail: '.',
    },
    en: {
      lead: 'Complex data. ',
      accent: 'Applications that make sense',
      tail: '.',
    },
  },
};

export const experience: ExperienceItem[] = [
  {
    id: 'tecnicas-competitivas',
    company: 'Técnicas Competitivas S.A.',
    role: { es: 'Desarrollador Full Stack', en: 'Full Stack Developer' },
    period: { es: 'Marzo 2023 – Actualidad', en: 'March 2023 – Present' },
    current: true,
    summary: {
      es: 'Desarrollo de aplicaciones para la gestión de emergencias, la seguridad pública y la monitorización de sistemas en tiempo real.',
      en: 'Building applications for emergency management, public safety and real-time system monitoring.',
    },
    highlights: {
      es: [
        'Gestión de incidencias, cartografía GIS y seguimiento de unidades mediante MapLibre GL, Leaflet y TETRA.',
        'Comunicaciones en tiempo real con MQTT e integración de servicios de DGT, AEMET e IGN.',
        'Monitorización de sensores con FIWARE, cuadros de mando y soluciones de visión artificial con OpenCV y YOLO.',
        'Desarrollo y mantenimiento de funcionalidades para GISECloud y DRAGO AP.',
      ],
      en: [
        'Incident management, GIS mapping and unit tracking with MapLibre GL, Leaflet and TETRA.',
        'Real-time communications over MQTT and integration of DGT, AEMET and IGN services.',
        'Sensor monitoring with FIWARE, dashboards and computer-vision solutions with OpenCV and YOLO.',
        'Development and maintenance of features for GISECloud and DRAGO AP.',
      ],
    },
  },
  {
    id: 'freelance',
    company: 'Freelance',
    role: {
      es: 'Plataformas educativas y diseño de contenidos',
      en: 'Educational platforms and content design',
    },
    period: { es: 'Julio 2020 – Noviembre 2023', en: 'July 2020 – November 2023' },
    summary: {
      es: 'Gestión de entornos de formación en línea, desarrollo de materiales interactivos con SCORM y eXeLearning y creación de recursos gráficos y publicitarios.',
      en: 'Management of online learning environments, interactive materials built with SCORM and eXeLearning, and creation of graphic and promotional resources.',
    },
  },
  {
    id: 'atlassystems',
    company: 'AtlasSystems S.L.',
    role: { es: 'Gestor de Plataforma Moodle', en: 'Moodle Platform Manager' },
    period: { es: 'Mayo 2020 – Julio 2020', en: 'May 2020 – July 2020' },
    summary: {
      es: 'Administración y mantenimiento de plataformas formativas: gestión de cursos, usuarios, contenidos y soporte operativo.',
      en: 'Administration and maintenance of learning platforms: course, user and content management, and operational support.',
    },
  },
  {
    id: 'dym-canarias',
    company: 'DYM Canarias',
    role: { es: 'Desarrollador de Videojuegos y Formador', en: 'Game Developer and Trainer' },
    period: { es: 'Noviembre 2018 – Diciembre 2019', en: 'November 2018 – December 2019' },
    summary: {
      es: 'Desarrollo de videojuegos educativos con Unity 3D y C#, elaboración de contenidos SCORM y apoyo en plataformas de formación.',
      en: 'Educational games built with Unity 3D and C#, SCORM content production and support on learning platforms.',
    },
  },
];

/**
 * Portfolio projects — ONLY real projects explicitly provided by the user.
 *
 * Never infer or derive portfolio projects from employment experience:
 * employer/client work belongs to `experience` below, never here.
 *
 * Deliberately empty until real projects are supplied: the Portfolio section
 * renders an honest empty state while this list has fewer than two entries, and
 * the pinned horizontal gallery re-enables automatically once projects return.
 */
export const projects: Project[] = [];

export const skillGroups: SkillGroup[] = [
  {
    id: 'frontend',
    title: { es: 'Frontend', en: 'Frontend' },
    skills: [
      { name: 'JavaScript / TypeScript' },
      { name: 'Angular' },
      { name: 'Tailwind CSS' },
      { name: 'HTML / CSS' },
    ],
  },
  {
    id: 'backend',
    title: { es: 'Backend', en: 'Backend' },
    skills: [
      { name: 'C# / .NET' },
      { name: 'Node.js / Express' },
      { name: 'REST APIs / MVC / WSDL' },
      { name: 'MQTT' },
    ],
  },
  {
    id: 'data-gis',
    title: { es: 'Datos y GIS', en: 'Data & GIS' },
    skills: [
      { name: 'PostgreSQL / MongoDB / CrateDB' },
      { name: 'MapLibre GL' },
      { name: 'Leaflet' },
      { name: 'FIWARE' },
      { name: 'Power BI' },
      { name: 'Grafana' },
      { name: 'DGT' },
      { name: 'AEMET' },
      { name: 'IGN' },
      { name: 'TETRA' },
    ],
  },
  {
    id: 'tools',
    title: { es: 'Herramientas', en: 'Tools' },
    skills: [
      { name: 'Git / Azure' },
      { name: 'Jira / Teams' },
      { name: 'Unity 3D' },
      { name: 'SCORM / eXeLearning' },
      { name: 'Moodle' },
      { name: 'Illustrator / Photoshop' },
    ],
  },
];

export const education: EducationItem[] = [
  {
    title: {
      es: 'CFGS Desarrollo de Aplicaciones Multiplataforma (DAM)',
      en: 'Higher Diploma in Multiplatform Application Development (DAM)',
    },
    place: 'IES El Rincón',
    period: '2020–2023',
  },
  {
    title: {
      es: 'Desarrollo de Videojuegos y Realidad Virtual con Unity 3D',
      en: 'Game and Virtual Reality Development with Unity 3D',
    },
    place: 'DYM Canarias',
    period: '2018',
  },
];

export const languages: LanguageItem[] = [
  {
    name: { es: 'Inglés', en: 'English' },
    detail: { es: 'B2.1, Escuela Oficial de Idiomas', en: 'B2.1, Official School of Languages' },
  },
  {
    name: { es: 'Erasmus+', en: 'Erasmus+' },
    detail: { es: 'Prácticas internacionales, 2014', en: 'International internship, 2014' },
  },
];

/** UI / chrome copy for both locales, keyed by `Locale`. */
export const ui: Record<Locale, UI> = {
  es: {
    meta: {
      title: 'Aythami Santana — Desarrollador Full Stack',
      description:
        'Desarrollador Full Stack en Las Palmas de Gran Canaria. Aplicaciones web, APIs, GIS e integración de datos en tiempo real para emergencias, seguridad pública, sanidad e industria.',
      ogLocale: 'es_ES',
    },
    skipLink: 'Saltar al contenido',
    nav: {
      ariaLabel: 'Navegación principal',
      work: 'Proyectos',
      linkedin: 'LinkedIn',
      linkedinAria: 'Perfil de LinkedIn de Aythami Santana (se abre en una pestaña nueva)',
      github: 'GitHub',
      githubAria: 'Perfil de GitHub de Aythami Santana (se abre en una pestaña nueva)',
      menuLabel: 'Menú',
      clockLabel: 'Hora en Canarias',
    },
    langSwitch: {
      label: 'Idioma',
      esShort: 'ES',
      enShort: 'EN',
      esAria: 'Español',
      enAria: 'English',
    },
    hero: {
      linkedin: 'LinkedIn',
      linkedinAria: 'Perfil de LinkedIn de Aythami Santana (se abre en una pestaña nueva)',
      github: 'GitHub',
      githubAria: 'Perfil de GitHub de Aythami Santana (se abre en una pestaña nueva)',
      valuePropAria: 'Resumen profesional',
      statement: 'Desarrollo web · datos · GIS',
      profileLabel: 'Perfil',
    },
    sections: {
      about: 'Sobre mí',
      experience: 'Experiencia',
      portfolio: 'Proyectos',
      skills: 'Tecnologías',
      education: 'Formación',
      languages: 'Idiomas',
    },
    experience: {
      highlightsLabel: 'Áreas de trabajo',
    },
    projects: {
      stackLabel: 'Tecnologías',
      soon: 'Detalles próximamente',
      view: 'Ver proyecto',
      emptyLead:
        'Estoy preparando esta sección. Mientras tanto, puedes explorar mi código en GitHub.',
      emptyCta: 'Ver mi GitHub',
      emptyCtaAria: 'Perfil de GitHub de Aythami Santana (se abre en una pestaña nueva)',
    },
    footer: {
      socials: 'Redes',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      rights: 'Todos los derechos reservados.',
      disciplines: 'Web · Datos · GIS',
    },
  },
  en: {
    meta: {
      title: 'Aythami Santana — Full Stack Developer',
      description:
        'Full Stack developer based in Las Palmas de Gran Canaria. Web apps, APIs, GIS and real-time data integration for emergency, public safety, healthcare and industry.',
      ogLocale: 'en_US',
    },
    skipLink: 'Skip to content',
    nav: {
      ariaLabel: 'Main navigation',
      work: 'Portfolio',
      linkedin: 'LinkedIn',
      linkedinAria: 'Aythami Santana’s LinkedIn profile (opens in a new tab)',
      github: 'GitHub',
      githubAria: 'Aythami Santana’s GitHub profile (opens in a new tab)',
      menuLabel: 'Menu',
      clockLabel: 'Time in the Canary Islands',
    },
    langSwitch: {
      label: 'Language',
      esShort: 'ES',
      enShort: 'EN',
      esAria: 'Español',
      enAria: 'English',
    },
    hero: {
      linkedin: 'LinkedIn',
      linkedinAria: 'Aythami Santana’s LinkedIn profile (opens in a new tab)',
      github: 'GitHub',
      githubAria: 'Aythami Santana’s GitHub profile (opens in a new tab)',
      valuePropAria: 'Professional summary',
      statement: 'Web development · data · GIS',
      profileLabel: 'Profile',
    },
    sections: {
      about: 'About',
      experience: 'Experience',
      portfolio: 'Portfolio',
      skills: 'Skills',
      education: 'Education',
      languages: 'Languages',
    },
    experience: {
      highlightsLabel: 'Areas of work',
    },
    projects: {
      stackLabel: 'Stack',
      soon: 'Details coming soon',
      view: 'View project',
      emptyLead:
        'I’m putting this section together. In the meantime, you can explore my code on GitHub.',
      emptyCta: 'View my GitHub',
      emptyCtaAria: 'Aythami Santana’s GitHub profile (opens in a new tab)',
    },
    footer: {
      socials: 'Socials',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      rights: 'All rights reserved.',
      disciplines: 'Web · Data · GIS',
    },
  },
};
