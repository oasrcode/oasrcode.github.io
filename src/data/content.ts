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
  };
  skipLink: string;
  nav: {
    ariaLabel: string;
    work: string;
    /** Download control; only rendered when public/cv.pdf exists. */
    cv: string;
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
  };
  hero: {
    linkedin: string;
    linkedinAria: string;
    github: string;
    githubAria: string;
    valuePropAria: string;
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
  skills: {
    present: string;
  };
  cv: {
    /** Label for the CV download control (footer + nav). */
    download: string;
  };
  footer: {
    socials: string;
    linkedin: string;
    github: string;
    rights: string;
  };
}

export interface Profile {
  /** Wordmark shown in the nav. */
  wordmark: string;
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
  /** Optional start/end year. Omit `to` for "present". */
  from?: string;
  to?: string;
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
  wordmark: 'oasr',
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
    es: 'Uno frontend, backend y datos para convertir información compleja en herramientas útiles.',
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
 * `manifesto` is split around the accented phrase so the signature gradient bar
 * can be drawn under exactly that phrase on reveal.
 */
export interface ManifestoCopy {
  /** Statement before the accented phrase. */
  lead: string;
  /** Phrase the signature gradient bar is drawn under. */
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
      'Desarrollador Full Stack con experiencia en aplicaciones web, APIs, sistemas de información geográfica e integración de datos en tiempo real. Trabajo en proyectos para los sectores de emergencias, seguridad pública, sanidad e industria, desarrollando frontend y backend e integrando servicios, sensores y distintas fuentes de información.',
      'Manejo JavaScript/TypeScript, Angular, C#/.NET, Node.js, bases de datos, APIs REST, MQTT y tecnologías de mapas como MapLibre GL y Leaflet, además de datos de organismos como DGT, AEMET e IGN, sistemas de posicionamiento TETRA y plataformas basadas en FIWARE.',
      'Me interesa especialmente desarrollar soluciones que conecten distintas tecnologías y fuentes de datos.',
    ],
    en: [
      'Full Stack developer experienced in web applications, APIs, geographic information systems and real-time data integration. I work on projects for the emergency, public safety, healthcare and industry sectors, building both frontend and backend and integrating services, sensors and different data sources.',
      'I work with JavaScript/TypeScript, Angular, C#/.NET, Node.js, databases, REST APIs, MQTT and map technologies such as MapLibre GL and Leaflet, along with data from agencies such as DGT, AEMET and IGN, TETRA positioning systems and FIWARE-based platforms.',
      'I am especially interested in building solutions that connect different technologies and data sources.',
    ],
  },
  manifesto: {
    es: {
      lead: 'Convertir información compleja en ',
      accent: 'aplicaciones útiles',
      tail: ', visuales y orientadas a las necesidades reales del usuario.',
    },
    en: {
      lead: 'Turn complex information into ',
      accent: 'useful, visual applications',
      tail: ' focused on people’s real needs.',
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
      es: 'Desarrollo en GISECloud, una plataforma de gestión de emergencias y seguridad pública, y en plataformas de monitorización por sensores y vídeo.',
      en: 'Development on GISECloud, an emergency management and public safety platform, and on sensor and video monitoring platforms.',
    },
    highlights: {
      es: [
        'Gestión de incidentes e identificaciones dentro de la aplicación.',
        'Funcionalidades de mapas con MapLibre GL y Leaflet.',
        'Visualización y seguimiento de unidades con información TETRA.',
        'Avisos y comunicaciones en tiempo real mediante MQTT.',
        'Integración de servicios de DGT, AEMET e IGN durante la gestión de incidencias.',
        'Informes y dashboards con Power BI.',
        'Plataforma de monitorización de sensores atmosféricos, acuáticos y de maquinaria naval bajo el estándar FIWARE, y video vigilancia con OpenCV y YOLO para el control de EPIs.',
        'Mantenimiento y nuevas funcionalidades en DRAGO AP, app de gestión de los centros de salud del Servicio Canario de Salud.',
      ],
      en: [
        'Incident and identification management inside the application.',
        'Map features built with MapLibre GL and Leaflet.',
        'Unit visualisation and tracking with TETRA data.',
        'Real-time alerts and communications over MQTT.',
        'Integration of DGT, AEMET and IGN services during incident management.',
        'Reports and dashboards with Power BI.',
        'Monitoring platform for atmospheric, water and naval-machinery sensors under the FIWARE standard, plus video surveillance with OpenCV and YOLO for PPE control.',
        'Maintenance and new features on DRAGO AP, the app managing the Canary Islands Health Service health centres.',
      ],
    },
  },
  {
    id: 'freelance',
    company: 'Freelance',
    role: {
      es: 'Gestor de plataformas educativas, creador de material educativo y publicitario',
      en: 'Educational platform manager, educational and promotional content creator',
    },
    period: { es: 'Julio 2020 – Noviembre 2023', en: 'July 2020 – November 2023' },
    summary: {
      es: 'Desarrollo de material educativo interactivo con SCORM y eXeLearning, creación de material publicitario y gestión de las plataformas educativas.',
      en: 'Interactive educational content built with SCORM and eXeLearning, promotional material and management of the learning platforms.',
    },
    highlights: {
      es: [
        'Alta y gestión de alumnos y profesores.',
        'Subida y organización de contenidos y mantenimiento de la plataforma.',
        'Material gráfico con Adobe Illustrator y Photoshop.',
      ],
      en: [
        'Student and teacher onboarding and management.',
        'Uploading and organising content, and platform maintenance.',
        'Graphic material with Adobe Illustrator and Photoshop.',
      ],
    },
  },
  {
    id: 'atlassystems',
    company: 'AtlasSystems S.L.',
    role: { es: 'Gestor de Plataforma Moodle', en: 'Moodle Platform Manager' },
    period: { es: 'Mayo 2020 – Julio 2020', en: 'May 2020 – July 2020' },
    summary: {
      es: 'Gestión de plataformas Moodle para cursos del SEPE: cursos, contenidos y usuarios, y las tareas necesarias para mantener la plataforma en funcionamiento.',
      en: 'Management of Moodle platforms for SEPE courses: courses, content and users, and the work needed to keep the platform running.',
    },
  },
  {
    id: 'dym-canarias',
    company: 'DYM Canarias',
    role: { es: 'Desarrollador de Videojuegos y Formador', en: 'Game Developer and Trainer' },
    period: { es: 'Noviembre 2018 – Diciembre 2019', en: 'November 2018 – December 2019' },
    summary: {
      es: 'Desarrollo de videojuegos educativos con Unity 3D y C# para el Servicio Canario de Empleo, creación de contenidos SCORM y tareas en plataformas Moodle.',
      en: 'Educational games built with Unity 3D and C# for the Canary Islands Employment Service, SCORM content creation and work on Moodle platforms.',
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
      { name: 'JavaScript / TypeScript', from: '2020' },
      { name: 'Angular', from: '2023' },
      { name: 'Tailwind CSS', from: '2023' },
      { name: 'HTML / CSS' },
    ],
  },
  {
    id: 'backend',
    title: { es: 'Backend', en: 'Backend' },
    skills: [
      { name: 'C# / .NET', from: '2018' },
      { name: 'Node.js / Express' },
      { name: 'REST APIs / MVC / WSDL' },
      { name: 'MQTT', from: '2023' },
    ],
  },
  {
    id: 'data-gis',
    title: { es: 'Datos y GIS', en: 'Data & GIS' },
    skills: [
      { name: 'PostgreSQL / MongoDB / CrateDB' },
      { name: 'MapLibre GL', from: '2023' },
      { name: 'Leaflet', from: '2023' },
      { name: 'FIWARE', from: '2023' },
      { name: 'Power BI', from: '2023' },
      { name: 'Grafana' },
      { name: 'DGT', from: '2023' },
      { name: 'AEMET', from: '2023' },
      { name: 'IGN', from: '2023' },
      { name: 'TETRA', from: '2023' },
    ],
  },
  {
    id: 'tools',
    title: { es: 'Herramientas', en: 'Tools' },
    skills: [
      { name: 'Git / Azure' },
      { name: 'Jira / Teams' },
      { name: 'Unity 3D', from: '2018', to: '2019' },
      { name: 'SCORM / eXeLearning', from: '2020', to: '2023' },
      { name: 'Moodle', from: '2018', to: '2020' },
      { name: 'Illustrator / Photoshop', from: '2020' },
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
    },
    skipLink: 'Saltar al contenido',
    nav: {
      ariaLabel: 'Navegación principal',
      work: 'Trabajo',
      cv: 'CV',
      linkedin: 'LinkedIn',
      linkedinAria: 'Perfil de LinkedIn de Aythami Santana (se abre en una pestaña nueva)',
      github: 'GitHub',
      githubAria: 'Perfil de GitHub de Aythami Santana (se abre en una pestaña nueva)',
      menuLabel: 'Menú',
      clockLabel: 'Hora en Canarias',
    },
    langSwitch: {
      label: 'Idioma',
    },
    hero: {
      linkedin: 'LinkedIn',
      linkedinAria: 'Perfil de LinkedIn de Aythami Santana (se abre en una pestaña nueva)',
      github: 'GitHub',
      githubAria: 'Perfil de GitHub de Aythami Santana (se abre en una pestaña nueva)',
      valuePropAria: 'Resumen profesional',
    },
    sections: {
      about: 'Sobre mí',
      experience: 'Experiencia',
      portfolio: 'Portfolio',
      skills: 'Skills',
      education: 'Formación',
      languages: 'Idiomas',
    },
    experience: {
      highlightsLabel: 'Responsabilidades principales',
    },
    projects: {
      stackLabel: 'Tecnologías',
      soon: 'Detalles próximamente',
      view: 'Ver proyecto',
      emptyLead:
        'Estoy preparando esta sección. Mientras tanto, podés explorar mi código en GitHub.',
      emptyCta: 'Ver mi GitHub',
      emptyCtaAria: 'Perfil de GitHub de Aythami Santana (se abre en una pestaña nueva)',
    },
    skills: {
      present: 'hoy',
    },
    cv: {
      download: 'Descargar CV',
    },
    footer: {
      socials: 'Redes',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      rights: 'Todos los derechos reservados.',
    },
  },
  en: {
    meta: {
      title: 'Aythami Santana — Full Stack Developer',
      description:
        'Full Stack developer based in Las Palmas de Gran Canaria. Web apps, APIs, GIS and real-time data integration for emergency, public safety, healthcare and industry.',
    },
    skipLink: 'Skip to content',
    nav: {
      ariaLabel: 'Main navigation',
      work: 'Work',
      cv: 'CV',
      linkedin: 'LinkedIn',
      linkedinAria: 'Aythami Santana’s LinkedIn profile (opens in a new tab)',
      github: 'GitHub',
      githubAria: 'Aythami Santana’s GitHub profile (opens in a new tab)',
      menuLabel: 'Menu',
      clockLabel: 'Time in the Canary Islands',
    },
    langSwitch: {
      label: 'Language',
    },
    hero: {
      linkedin: 'LinkedIn',
      linkedinAria: 'Aythami Santana’s LinkedIn profile (opens in a new tab)',
      github: 'GitHub',
      githubAria: 'Aythami Santana’s GitHub profile (opens in a new tab)',
      valuePropAria: 'Professional summary',
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
      highlightsLabel: 'Key responsibilities',
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
    skills: {
      present: 'now',
    },
    cv: {
      download: 'Download CV',
    },
    footer: {
      socials: 'Socials',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      rights: 'All rights reserved.',
    },
  },
};
