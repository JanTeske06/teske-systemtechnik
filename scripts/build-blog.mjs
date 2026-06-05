// Generiert den Blog (DE; trilingual vorbereitet) aus static/data/updates.json.
// Pro Run und gebauter Sprache:
//   - 1 Index-Seite   /<lang>/blog/
//   - N Detail-Seiten /<lang>/blog/<slug>/
//   - 1 RSS-Feed      /<lang>/blog/feed.xml
//
// Neuen Post anlegen:
//   (1) Eintrag in static/data/updates.json (mit i18n.<lang>-Block),
//   (2) static/blog/<slug>/cover.png + <lang>.md (Body, Markdown) anlegen,
//   (3) npm run build-blog
//
// Google-Profil-Text aus demselben Eintrag erzeugen (bleibt lokal):
//   node scripts/build-blog.mjs --google <slug>
//
// Ausgabe ist deterministisch und ueberschreibt nur die Dateien, die das
// Script selbst generiert. Header/Footer/Maintenance-Guard sind bewusst
// inline gerendert (wie in build-services.mjs). WICHTIG: Die Navigation hier
// muss mit header()/footer() in build-services.mjs synchron gehalten werden.

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ORIGIN = 'https://teske-systemtechnik.de';

// Sprachen mit existierendem Blog-Content. Nur diese werden gebaut und
// erhalten den Blog-Nav-Punkt. Spaeter 'en'/'ru' ergaenzen, sobald je Post
// ein i18n-Block + <lang>.md vorliegt.
const BUILD_LANGUAGES = ['de', 'en', 'ru'];

// ============================================================
// PFADE & LABELS (mit build-services.mjs konsistent halten)
// ============================================================

const PATHS = {
  home:     { de: '/de/', en: '/en/', ru: '/ru/' },
  about:    { de: '/de/about/', en: '/en/about/', ru: '/ru/about/' },
  projects: { de: '/de/projekte/', en: '/en/projects/', ru: '/ru/proekty/' },
  legal:    { de: '/de/impressum/', en: '/en/legal-notice/', ru: '/ru/impressum/' },
  privacy:  { de: '/de/datenschutz/', en: '/en/privacy-policy/', ru: '/ru/privacy/' },
};
const OVERVIEW_PATHS = { de: '/de/leistungen/', en: '/en/services/', ru: '/ru/uslugi/' };
const BLOG_PATHS = { de: '/de/blog/', en: '/en/blog/', ru: '/ru/blog/' };
const BOOKING_PATHS = { de: '/de/termin/', en: '/en/booking/', ru: '/ru/zapis/' };

const LANG_META = {
  de: { htmlLang: 'de', ogLocale: 'de_DE' },
  en: { htmlLang: 'en', ogLocale: 'en_US' },
  ru: { htmlLang: 'ru', ogLocale: 'ru_RU' },
};

const LABELS = {
  de: {
    skipToContent: 'Zum Inhalt springen',
    navStart: 'Start', navAbout: 'Über uns', navServices: 'Leistungen',
    navProjects: 'Projekte', navConsultation: 'Beratung', navBlog: 'Blog',
    legal: 'Impressum', privacy: 'Datenschutz',
    quality: 'Quality engineered in Germany.',
    copyright: '&copy; 2026 Teske Systemtechnik. Alle Rechte vorbehalten.',
    switchLanguage: 'Sprache wechseln',
    headlineNavigation: 'Navigation', headlineLegal: 'Rechtliches',
    headlineFollow: 'Folgen Sie uns', headlineReview: 'Bewertung', headlineWork: 'Unsere Arbeit', navBooking: 'Termin buchen',
    consultationViaUpwork: 'Beratung via Upwork',
    reviewCta: 'Bei Google bewerten', googleReviewAria: 'Bei Google bewerten',
    blogEyebrow: 'Blog',
    blogTitle: 'Blog',
    blogMetaTitle: 'Blog · Teske Systemtechnik',
    blogIntro: 'Neuigkeiten, Updates und Einblicke aus der Werkstatt von Teske Systemtechnik. Neue Funktionen auf der Website, Projekte und Technik-Notizen.',
    readMore: 'Weiterlesen →',
    backToBlog: '← Alle Beiträge',
    blogEmpty: 'Aktuell sind keine Beiträge verfügbar. Bitte schauen Sie später noch einmal vorbei.',
    searchPlaceholder: 'Beiträge durchsuchen …',
    searchLabel: 'Beiträge durchsuchen',
    filterAll: 'Alle',
    noResults: 'Keine Beiträge gefunden. Andere Suche oder Kategorie?',
    gapDays: 'Tage',
    gapMonths: 'Monate',
    gapYear: 'über ein Jahr',
    publishedPrefix: 'Veröffentlicht am',
    feedTitle: 'Teske Systemtechnik · Blog',
    feedDesc: 'Neuigkeiten, Updates und Einblicke von Teske Systemtechnik.',
  },
  en: {
    skipToContent: 'Skip to content',
    navStart: 'Home', navAbout: 'About', navServices: 'Services',
    navProjects: 'Projects', navConsultation: 'Book a call', navBlog: 'Blog',
    legal: 'Legal Notice', privacy: 'Privacy Policy',
    quality: 'Quality engineered in Germany.',
    copyright: '&copy; 2026 Teske Systemtechnik. All rights reserved.',
    switchLanguage: 'Switch language',
    headlineNavigation: 'Navigation', headlineLegal: 'Legal',
    headlineFollow: 'Follow us', headlineReview: 'Review', headlineWork: 'Our work', navBooking: 'Book a call',
    consultationViaUpwork: 'Consultation via Upwork',
    reviewCta: 'Rate us on Google', googleReviewAria: 'Write a Google review',
    blogEyebrow: 'Blog',
    blogTitle: 'Blog',
    blogMetaTitle: 'Blog · Teske Systemtechnik',
    blogIntro: 'News, updates and behind-the-scenes notes from Teske Systemtechnik. New website features, projects and engineering notes.',
    readMore: 'Read more →',
    backToBlog: '← All posts',
    blogEmpty: 'There are currently no posts. Please check back soon.',
    searchPlaceholder: 'Search posts …',
    searchLabel: 'Search posts',
    filterAll: 'All',
    noResults: 'No posts found. Try another search or category?',
    gapDays: 'days',
    gapMonths: 'months',
    gapYear: 'over a year',
    publishedPrefix: 'Published on',
    feedTitle: 'Teske Systemtechnik · Blog',
    feedDesc: 'News, updates and insights from Teske Systemtechnik.',
  },
  ru: {
    skipToContent: 'Перейти к содержимому',
    navStart: 'Главная', navAbout: 'Обо мне', navServices: 'Услуги',
    navProjects: 'Проекты', navConsultation: 'Консультация', navBlog: 'Блог',
    legal: 'Выходные данные', privacy: 'Конфиденциальность',
    quality: 'Quality engineered in Germany.',
    copyright: '&copy; 2026 Teske Systemtechnik. Все права защищены.',
    switchLanguage: 'Сменить язык',
    headlineNavigation: 'Навигация', headlineLegal: 'Юридическое',
    headlineFollow: 'Профили', headlineReview: 'Отзыв', headlineWork: 'Наши работы', navBooking: 'Записаться',
    consultationViaUpwork: 'Консультация на Upwork',
    reviewCta: 'Оценить нас в Google', googleReviewAria: 'Оставить отзыв в Google',
    blogEyebrow: 'Блог',
    blogTitle: 'Блог',
    blogMetaTitle: 'Блог · Teske Systemtechnik',
    blogIntro: 'Новости, обновления и заметки из мастерской Teske Systemtechnik. Новые функции сайта, проекты и технические записки.',
    readMore: 'Читать далее →',
    backToBlog: '← Все записи',
    blogEmpty: 'Записей пока нет. Пожалуйста, загляните позже.',
    searchPlaceholder: 'Поиск записей …',
    searchLabel: 'Поиск записей',
    filterAll: 'Все',
    noResults: 'Записи не найдены. Другой запрос или категория?',
    gapDays: 'дн.',
    gapMonths: 'мес.',
    gapYear: 'более года',
    publishedPrefix: 'Опубликовано',
    feedTitle: 'Teske Systemtechnik · Блог',
    feedDesc: 'Новости, обновления и заметки от Teske Systemtechnik.',
  },
};

const CATEGORY_LABELS = {
  de: { feature: 'Update', projekt: 'Projekt', unternehmen: 'Unternehmen', technik: 'Technik' },
  en: { feature: 'Update', projekt: 'Project', unternehmen: 'Company', technik: 'Tech' },
  ru: { feature: 'Обновление', projekt: 'Проект', unternehmen: 'Компания', technik: 'Технологии' },
};

// Zeitlicher "Neu"-Marker: nur der jeweils AKTUELLSTE Beitrag traegt ihn,
// unabhaengig von der Kategorie. Aeltere Beitraege zeigen ihre Kategorie.
const LATEST_LABEL = { de: 'Neu', en: 'New', ru: 'Новое' };

// Ueberschrift der "Verwandte Projekte"-Sektion am Ende jedes Blog-Beitrags
// (interne Verlinkung Blog -> Case Studies + Leistungen, gut fuer SEO).
const RELATED_HEADING = { de: 'Ausgewählte Projekte', en: 'Selected projects', ru: 'Избранные проекты' };

const MONTHS = {
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
};

function formatDate(iso, lang) {
  const [y, m, d] = iso.split('-').map(Number);
  const M = MONTHS[lang] || MONTHS.de;
  if (lang === 'en') return `${M[m - 1]} ${d}, ${y}`;
  if (lang === 'ru') return `${d} ${M[m - 1]} ${y} г.`;
  return `${d}. ${M[m - 1]} ${y}`;
}

// Tage zwischen zwei ISO-Daten (newer - older).
function daysBetween(newer, older) {
  return Math.round((Date.parse(newer + 'T00:00:00Z') - Date.parse(older + 'T00:00:00Z')) / 86400000);
}

// Anzahl voller Monate zwischen zwei ISO-Daten (gerundet, mind. 1).
function monthsBetween(newer, older) {
  return Math.max(1, Math.round(daysBetween(newer, older) / 30.44));
}

// Monatskuerzel `back` Monate vor `iso` (fuer die Monats-Ticks auf der Achse).
function monthLabelBack(iso, back, monthsArr) {
  let idx = (Number(iso.slice(5, 7)) - 1 - back) % 12;
  if (idx < 0) idx += 12;
  return (monthsArr[idx] || '').slice(0, 3);
}

// Text fuer die Zeitspanne ("5 Monate" / "20 Tage" / "ueber ein Jahr").
function gapLabel(days, L) {
  if (days < 20) return '';
  const months = Math.round(days / 30.44);
  if (months >= 13) return L.gapYear;
  if (months <= 1) return `${days} ${L.gapDays}`;
  return `${months} ${L.gapMonths}`;
}

// ============================================================
// SVG / SHARED CHROME (aus build-services.mjs)
// ============================================================

const UPWORK_URL = 'https://www.upwork.com/services/product/development-it-jan-1998498914122187359?ref=project_share';
const UPWORK_SVG = `<svg class="h-3.5 w-3.5 fill-[#14a800]" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.816v6.629c0 .943-.702 1.71-1.572 1.71-.869 0-1.572-.767-1.572-1.71V3.492H0v6.629c0 3.326 2.48 6.031 5.529 6.462V24h4.745v-7.396c2.513 1.968 5.253 2.539 7.421 2.539 2.551 0 4.962-1.42 5.922-3.839 1.151.782 2.158 1.942 2.385 4.696h4.86c-.521-4.723-3.238-7.738-6.19-9.177C24.47 6.427 21.652 5.018 18.561 5.018z"/></svg>`;
const UPWORK_MENU_SVG = `<svg class="h-5 w-5 shrink-0 fill-[#14a800]" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.816v6.629c0 .943-.702 1.71-1.572 1.71-.869 0-1.572-.767-1.572-1.71V3.492H0v6.629c0 3.326 2.48 6.031 5.529 6.462V24h4.745v-7.396c2.513 1.968 5.253 2.539 7.421 2.539 2.551 0 4.962-1.42 5.922-3.839 1.151.782 2.158 1.942 2.385 4.696h4.86c-.521-4.723-3.238-7.738-6.19-9.177C24.47 6.427 21.652 5.018 18.561 5.018z"/></svg>`;
const CAL_MENU_SVG = `<svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`;
const CONSULT_MENU = {
  de: { onSite: 'Auf dieser Website', onSiteSub: 'Termin online buchen', up: 'Über Upwork', upSub: 'Beratung & Projekte', back: 'Zurück' },
  en: { onSite: 'On this website', onSiteSub: 'Book a call online', up: 'Via Upwork', upSub: 'Consulting & projects', back: 'Back' },
  ru: { onSite: 'На этом сайте', onSiteSub: 'Записаться онлайн', up: 'Через Upwork', upSub: 'Консультации и проекты', back: 'Назад' },
};

const GOOGLE_REVIEW_URL = 'https://g.page/r/CWYcIXLQXe1oEBM/review';
const STAR_SVG = `<svg class="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
const GOOGLE_LOGO_SVG = `<svg class="h-6 w-6 shrink-0" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`;
const SOCIAL_SVGS = {
  pypi: `<svg class="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12,2L2,7V17L12,22L22,17V7L12,2ZM4,16.06V8.94L11,12.44V19.56L4,16.06ZM12,11.38L5.13,7.94L12,4.5L18.87,7.94L12,11.38ZM20,16.06L13,19.56V12.44L20,8.94V16.06Z"/></svg>`,
  upwork: `<svg class="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.816v6.629c0 .943-.702 1.71-1.572 1.71-.869 0-1.572-.767-1.572-1.71V3.492H0v6.629c0 3.326 2.48 6.031 5.529 6.462V24h4.745v-7.396c2.513 1.968 5.253 2.539 7.421 2.539 2.551 0 4.962-1.42 5.922-3.839 1.151.782 2.158 1.942 2.385 4.696h4.86c-.521-4.723-3.238-7.738-6.19-9.177C24.47 6.427 21.652 5.018 18.561 5.018z"/></svg>`,
  github: `<svg class="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
  linkedin: `<svg class="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>`,
  google: `<svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`,
};

function languageSwitcher(currentLang, alternates) {
  return ['de', 'en', 'ru'].map((lang) => {
    const isActive = lang === currentLang;
    const label = lang.toUpperCase();
    const href = isActive ? '#' : alternates[lang];
    const cls = isActive
      ? 'bg-orange-500 text-white shadow rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition'
      : 'text-stone-400 hover:text-white rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition';
    return `<a class="${cls}" href="${href}"${isActive ? ' aria-current="true"' : ''} aria-label="${LABELS[currentLang].switchLanguage}: ${label}">${label}</a>`;
  }).join('\n              ');
}

function header(lang, currentPath, langSwitcher) {
  const L = LABELS[lang];
  const bookingPath = BOOKING_PATHS[lang];
  const cm = CONSULT_MENU[lang];
  const showBlog = BUILD_LANGUAGES.includes(lang);
  const consultationLi = bookingPath ? `<li class="relative" x-data="{ open: false }" @mouseenter="open = true" @click.outside="open = false" @keydown.escape="open = false">
            <button type="button" class="text-stone-300 hover:text-white inline-flex min-w-[6rem] cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition" @click="open = !open" :aria-expanded="open" aria-haspopup="true">${L.navConsultation}<svg class="h-3 w-3 transition duration-200" :class="open && 'rotate-180'" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd"/></svg></button>
            <div x-show="open" x-transition.opacity x-cloak class="absolute right-0 top-full z-40 w-64 pt-2">
              <div class="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900/95 p-1.5 shadow-xl backdrop-blur-xl">
                <a class="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-stone-700/70" href="${bookingPath}"><span class="mt-0.5 text-orange-400">${CAL_MENU_SVG}</span><span><span class="block text-sm font-medium text-stone-100">${cm.onSite}</span><span class="block text-xs text-stone-400">${cm.onSiteSub}</span></span></a>
                <a class="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-stone-700/70" href="${UPWORK_URL}" target="_blank" rel="noopener noreferrer"><span class="mt-0.5">${UPWORK_MENU_SVG}</span><span><span class="block text-sm font-medium text-stone-100">${cm.up}</span><span class="block text-xs text-stone-400">${cm.upSub}</span></span></a>
              </div>
            </div>
          </li>` : `<li><a class="text-stone-300 hover:text-white inline-flex min-w-[6rem] items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition" href="${UPWORK_URL}" target="_blank" rel="noopener noreferrer">${UPWORK_SVG}${L.navConsultation}</a></li>`;
  const mobileConsult = bookingPath ? `<li class="mt-1">
                <button type="button" @click="ber = !ber; remeasure()" :aria-expanded="ber" class="flex w-full items-center justify-between gap-2 py-2 text-sm font-medium text-stone-300 hover:text-white"><span class="inline-flex items-center gap-2">${CAL_MENU_SVG.replace('h-5 w-5', 'h-4 w-4 text-orange-400')}${L.navConsultation}</span><svg class="h-4 w-4 shrink-0 text-stone-500 transition duration-200" :class="ber && 'rotate-180'" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd"/></svg></button>
                <div x-show="ber" class="mt-1 flex flex-col border-l border-stone-800 pl-3">
                  <a class="flex items-center gap-2 py-2 text-sm font-medium text-stone-300 hover:text-white" href="${bookingPath}"><img src="/static/images/logo_whitemode.svg" width="16" height="16" alt="" class="h-4 w-4 shrink-0">${cm.onSite}</a>
                  <a class="flex items-center gap-2 py-2 text-sm font-medium text-stone-300 hover:text-white" href="${UPWORK_URL}" target="_blank" rel="noopener noreferrer">${UPWORK_SVG}${cm.up}</a>
                  <button type="button" @click="ber = false; remeasure()" class="flex items-center gap-2 py-2 text-left text-sm font-medium text-stone-500 hover:text-white"><svg class="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>${cm.back}</button>
                </div>
              </li>` : '';
  const isActive = (path) => {
    const homePath = PATHS.home[lang];
    if (path === homePath) return currentPath === homePath ? 'text-white' : 'text-stone-300 hover:text-white';
    return currentPath.startsWith(path) ? 'text-white' : 'text-stone-300 hover:text-white';
  };
  const ariaCurrent = (path) => (currentPath.startsWith(path) ? ' aria-current="page"' : '');
  const blogLi = showBlog ? `<li><a class="${isActive(BLOG_PATHS[lang])} inline-flex min-w-[6rem] items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition" href="${BLOG_PATHS[lang]}"${ariaCurrent(BLOG_PATHS[lang])}>${L.navBlog}</a></li>` : '';
  const blogMobileLi = showBlog ? `<li><a class="flex py-2 text-sm font-medium ${currentPath.startsWith(BLOG_PATHS[lang]) ? 'text-white' : 'text-stone-300 hover:text-white'}" href="${BLOG_PATHS[lang]}">${L.navBlog}</a></li>` : '';
  return `<header id="site-header" class="fixed top-0 z-30 w-full">
  <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <div class="flex h-16 items-center justify-between md:h-20">
      <div class="mr-4 shrink-0">
        <a class="inline-flex items-center gap-3" href="${PATHS.home[lang]}" aria-label="Teske Systemtechnik">
          <img class="max-w-none" src="/static/images/logo_whitemode.svg" width="40" height="40" alt="">
          <span class="font-aspekta text-[17px] font-bold uppercase tracking-[0.1em] text-stone-100 leading-[20px]">Teske<br>Systemtechnik</span>
        </a>
      </div>
      <nav class="hidden md:flex md:grow" aria-label="Primary">
        <ul class="flex grow flex-wrap items-center justify-end gap-1 pl-8">
          <li><a class="${isActive(PATHS.home[lang])} inline-flex min-w-[6rem] items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition" href="${PATHS.home[lang]}"${currentPath === PATHS.home[lang] ? ' aria-current="page"' : ''}>${L.navStart}</a></li>
          ${consultationLi}
          <li><a class="${isActive(OVERVIEW_PATHS[lang])} inline-flex min-w-[6rem] items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition" href="${OVERVIEW_PATHS[lang]}"${ariaCurrent(OVERVIEW_PATHS[lang])}>${L.navServices}</a></li>
          <li><a class="${isActive(PATHS.projects[lang])} inline-flex min-w-[6rem] items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition" href="${PATHS.projects[lang]}"${ariaCurrent(PATHS.projects[lang])}>${L.navProjects}</a></li>
          ${blogLi}
          <li><a class="${isActive(PATHS.about[lang])} inline-flex min-w-[6rem] items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition" href="${PATHS.about[lang]}"${ariaCurrent(PATHS.about[lang])}>${L.navAbout}</a></li>
          <li class="ml-2 flex items-center gap-1 rounded-full border border-stone-800 bg-stone-900/60 p-1">
            ${langSwitcher}
          </li>
        </ul>
      </nav>
      <div class="ml-4 flex items-center md:hidden" x-data="{ expanded: false, ber: false, h: 0, remeasure() { this.$nextTick(() => { this.h = this.$refs.mobileNav.scrollHeight }) } }">
        <button class="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900/60 text-stone-300 transition hover:text-white" aria-controls="mobile-nav" :aria-expanded="expanded" @click.stop="expanded = !expanded; ber = false; remeasure()">
          <span class="sr-only">Menu</span>
          <svg class="pointer-events-none h-4 w-4 fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <rect class="origin-center -translate-y-[5px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]" y="7" width="16" height="2" rx="1"></rect>
            <rect class="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45" y="7" width="16" height="2" rx="1"></rect>
            <rect class="origin-center translate-y-[5px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]" y="7" width="16" height="2" rx="1"></rect>
          </svg>
        </button>
        <template x-teleport="body">
          <nav id="mobile-nav" aria-label="Mobile" class="fixed top-16 inset-x-0 z-50 overflow-hidden px-4 transition-all duration-300 ease-out sm:px-6" x-ref="mobileNav"
               :style="expanded ? 'max-height: ' + h + 'px; opacity: 1; transform: translateY(0)' : 'max-height: 0; opacity: 0; transform: translateY(-8px)'"
               @click.outside="expanded = false; ber = false" @keydown.escape.window="expanded = false; ber = false" x-cloak>
            <ul class="rounded-2xl border border-stone-800 bg-stone-900/90 px-4 py-3 shadow-xl backdrop-blur-xl">
              <li><a class="flex py-2 text-sm font-medium ${currentPath === PATHS.home[lang] ? 'text-white' : 'text-stone-300 hover:text-white'}" href="${PATHS.home[lang]}">${L.navStart}</a></li>
              ${mobileConsult}
              <li><a class="flex py-2 text-sm font-medium ${currentPath.startsWith(OVERVIEW_PATHS[lang]) ? 'text-white' : 'text-stone-300 hover:text-white'}" href="${OVERVIEW_PATHS[lang]}">${L.navServices}</a></li>
              <li><a class="flex py-2 text-sm font-medium ${currentPath.startsWith(PATHS.projects[lang]) ? 'text-white' : 'text-stone-300 hover:text-white'}" href="${PATHS.projects[lang]}">${L.navProjects}</a></li>
              ${blogMobileLi}
              <li><a class="flex py-2 text-sm font-medium ${currentPath.startsWith(PATHS.about[lang]) ? 'text-white' : 'text-stone-300 hover:text-white'}" href="${PATHS.about[lang]}">${L.navAbout}</a></li>
              <li class="mt-2 flex items-center gap-2 border-t border-stone-800 pt-3">
                <span class="text-xs uppercase tracking-wider text-stone-500">${L.switchLanguage}:</span>
                ${langSwitcher.replace(/min-w-\[6rem\]/g, '').replace(/px-3/g, 'px-2.5')}
              </li>
            </ul>
          </nav>
        </template>
      </div>
    </div>
  </div>
</header>`;
}

function footer(lang) {
  const L = LABELS[lang];
  const fl = (href, label, ext) => `<li><a class="text-stone-400 transition hover:text-amber-400" href="${href}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a></li>`;
  const navItems = [
    fl(PATHS.home[lang], L.navStart),
    BUILD_LANGUAGES.includes(lang) ? fl(BLOG_PATHS[lang], L.navBlog) : '',
    fl(PATHS.about[lang], L.navAbout),
  ].filter(Boolean).join('\n          ');
  const workItems = [
    fl(PATHS.projects[lang], L.navProjects),
    fl(OVERVIEW_PATHS[lang], L.navServices),
    fl(BOOKING_PATHS[lang], L.navBooking),
  ].join('\n          ');
  return `<footer class="relative border-t border-stone-800/60 mt-10">
  <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <div class="flex flex-col items-start gap-10 py-12 md:flex-row">
      <div class="md:shrink-0">
        <a class="inline-flex items-center gap-3" href="${PATHS.home[lang]}" aria-label="Teske Systemtechnik">
          <img src="/static/images/logo_whitemode.svg" class="h-12 w-12" alt="">
          <span class="font-aspekta text-lg font-bold uppercase tracking-[0.2em] text-stone-100">Teske<br>Systemtechnik</span>
        </a>
        <p class="mt-4 max-w-sm text-sm text-stone-400">${L.quality}</p>
        <a href="${GOOGLE_REVIEW_URL}" target="_blank" rel="noopener noreferrer" class="group mt-6 inline-block text-sm" aria-label="${L.googleReviewAria}">
          <div class="flex items-center gap-2">
            ${GOOGLE_LOGO_SVG}
            <div class="flex gap-0.5 text-amber-400 transition group-hover:text-amber-300">${STAR_SVG.repeat(5)}</div>
          </div>
          <span class="mt-2 inline-block text-stone-400 transition group-hover:text-amber-400">${L.reviewCta}</span>
        </a>
      </div>
      <div class="flex flex-col gap-10 md:grow md:flex-row md:items-start md:justify-evenly">
      <div>
        <h3 class="mb-4 font-aspekta text-xs font-semibold uppercase tracking-wider text-stone-300">${L.headlineNavigation}</h3>
        <ul class="space-y-2 text-sm">
          ${navItems}
        </ul>
      </div>
      <div>
        <h3 class="mb-4 font-aspekta text-xs font-semibold uppercase tracking-wider text-stone-300">${L.headlineWork}</h3>
        <ul class="space-y-2 text-sm">
          ${workItems}
        </ul>
      </div>
      <div>
        <h3 class="mb-4 font-aspekta text-xs font-semibold uppercase tracking-wider text-stone-300">${L.headlineLegal}</h3>
        <ul class="space-y-2 text-sm">
          <li><a class="text-stone-400 transition hover:text-amber-400" href="${PATHS.legal[lang]}">${L.legal}</a></li>
          <li><a class="text-stone-400 transition hover:text-amber-400" href="${PATHS.privacy[lang]}">${L.privacy}</a></li>
        </ul>
      </div>
      </div>
      <div>
        <h3 class="mb-4 font-aspekta text-xs font-semibold uppercase tracking-wider text-stone-300">${L.headlineFollow}</h3>
        <ul class="grid w-max grid-cols-3 gap-3">
          <li><a class="flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-400 transition hover:border-orange-500 hover:bg-orange-500 hover:text-white" href="https://pypi.org/user/JanTeske06/" target="_blank" rel="noopener noreferrer" aria-label="PyPI">${SOCIAL_SVGS.pypi}</a></li>
          <li><a class="flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-400 transition hover:border-[#14a800] hover:bg-[#14a800] hover:text-white" href="https://www.upwork.com/freelancers/~015b43fa57ecfc1b1c" target="_blank" rel="noopener noreferrer" aria-label="Upwork">${SOCIAL_SVGS.upwork}</a></li>
          <li><a class="flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-400 transition hover:border-white hover:bg-black hover:text-white" href="https://github.com/JanTeske06" target="_blank" rel="noopener noreferrer" aria-label="GitHub">${SOCIAL_SVGS.github}</a></li>
          <li><a class="flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-400 transition hover:border-[#0a66c2] hover:bg-[#0a66c2] hover:text-white" href="https://www.linkedin.com/in/jan-teske-a9b768342/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">${SOCIAL_SVGS.linkedin}</a></li>
          <li><a class="flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-400 transition hover:border-[#009b94] hover:bg-[#009b94] hover:text-white" href="https://www.wlw.de/de/firma/teske-systemtechnik-inh-jan-teske-22390516" target="_blank" rel="noopener noreferrer" aria-label="wlw.de"><span class="font-aspekta text-[10px] font-bold lowercase leading-none">wlw</span></a></li>
          <li><a class="flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-400 transition hover:border-white hover:bg-white" href="https://share.google/iHfqrYi4O0FGgQBrF" target="_blank" rel="noopener noreferrer" aria-label="Google">${SOCIAL_SVGS.google}</a></li>
        </ul>
      </div>
    </div>
    <div class="flex flex-col items-center justify-between gap-3 border-t border-stone-800/60 py-6 text-xs text-stone-500 md:flex-row">
      <p>${L.copyright}</p>
      <p class="font-aspekta uppercase tracking-widest">${L.quality}</p>
    </div>
  </div>
</footer>`;
}

function maintenanceGuard() {
  return `<script>
  (function () {
    if (location.pathname.endsWith('/maintenance.html')) return;
    fetch('/maintenance.flag', { cache: 'no-store' })
      .then(function (r) { return r.text(); })
      .then(function (t) { if (t.trim() === 'on') location.replace('/maintenance.html'); })
      .catch(function () {});
  })();
</script>`;
}

function scriptsFooter() {
  return `<script src="/static/js/vendors/alpinejs.min.js" defer></script>
<script src="/static/js/vendors/aos.js?v=20260430a"></script>
<script src="/static/js/main.js?v=20260605c"></script>`;
}

function headCommon(lang) {
  return `  <link rel="icon" type="image/svg+xml" href="/static/images/logo_favicon.svg">
  <link rel="preload" href="/static/fonts/aspekta/Aspekta-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/static/fonts/aspekta/Aspekta-650.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/static/css/vendors/aos.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/static/css/vendors/aos.css"></noscript>
  <link rel="stylesheet" href="/static/style.css?v=20260605a">
  <link rel="stylesheet" href="/static/css/site.css?v=20260605b">`;
}

// ============================================================
// MARKDOWN (kompakter Inline-Parser, kein externes Paket)
// ============================================================

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineMd(text) {
  const codes = [];
  let s = text.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `C${codes.length - 1}`; });
  s = escapeHtml(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => `<img src="${src}" alt="${alt}" loading="lazy">`);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, href) => {
    const ext = /^https?:\/\//.test(href);
    return `<a href="${href}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${t}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/C(\d+)/g, (_, i) => `<code>${escapeHtml(codes[+i])}</code>`);
  return s;
}

function markdownToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  const isBlockStart = (l) => /^(#{2,4}\s|[-*]\s|\d+\.\s|>\s?|```)/.test(l);
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line.trim())) {
      const buf = []; i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) { buf.push(lines[i]); i++; }
      i++;
      out.push(`<pre><code>${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }
    if (line.trim() === '') { i++; continue; }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) { out.push('<hr>'); i++; continue; }
    const h = line.match(/^(#{2,4})\s+(.*)$/);
    if (h) { const lvl = h[1].length; out.push(`<h${lvl}>${inlineMd(h[2].trim())}</h${lvl}>`); i++; continue; }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      out.push(`<blockquote>${markdownToHtml(buf.join('\n'))}</blockquote>`);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) { buf.push(`<li>${inlineMd(lines[i].replace(/^[-*]\s+/, '').trim())}</li>`); i++; }
      out.push(`<ul>\n${buf.join('\n')}\n</ul>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { buf.push(`<li>${inlineMd(lines[i].replace(/^\d+\.\s+/, '').trim())}</li>`); i++; }
      out.push(`<ol>\n${buf.join('\n')}\n</ol>`);
      continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i])) { buf.push(lines[i].trim()); i++; }
    out.push(`<p>${inlineMd(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}

// ============================================================
// POSTS LADEN
// ============================================================

function loadPosts(lang) {
  const raw = JSON.parse(readFileSync(join(ROOT, 'static/data/updates.json'), 'utf-8'));
  return raw.posts
    .filter((p) => p.i18n && p.i18n[lang])
    .map((p) => {
      const mdPath = join(ROOT, 'static/blog', p.slug, `${lang}.md`);
      const body = existsSync(mdPath) ? markdownToHtml(readFileSync(mdPath, 'utf-8')) : '';
      return { ...p, loc: p.i18n[lang], body };
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)); // neueste zuerst
}

// ============================================================
// DETAIL-SEITE
// ============================================================

// Liest die featured Projekte (Top nach showcase_order) fuer die interne
// "Verwandte Projekte"-Verlinkung am Ende der Blog-Beitraege.
function loadFeaturedProjects(lang, limit) {
  try {
    const raw = JSON.parse(readFileSync(join(ROOT, 'static/data/projects.json'), 'utf-8'));
    return (raw.projects || [])
      .filter((p) => p.featured && p.i18n && p.i18n[lang])
      .sort((a, b) => (a.showcase_order || 99) - (b.showcase_order || 99))
      .slice(0, limit || 3)
      .map((p) => ({ slug: p.slug, cover: p.cover, title: p.i18n[lang].title, summary: p.i18n[lang].summary }));
  } catch (e) {
    return [];
  }
}

function relatedProjectsSection(lang) {
  const projects = loadFeaturedProjects(lang, 3);
  if (!projects.length) return '';
  const L = LABELS[lang];
  const cards = projects.map((p) => `
        <a href="${PATHS.projects[lang]}${p.slug}/" class="group block overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 transition hover:border-orange-500/50">
          <div class="aspect-[4/3] overflow-hidden">
            <img src="${p.cover}" alt="" loading="lazy" class="h-full w-full object-cover transition duration-700 group-hover:scale-105">
          </div>
          <div class="p-5">
            <h3 class="font-aspekta text-lg font-bold text-white">${p.title}</h3>
            <p class="mt-1 line-clamp-2 text-sm text-stone-400">${p.summary}</p>
          </div>
        </a>`).join('\n');
  return `
  <section class="relative border-t border-stone-900 py-16 md:py-20">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <h2 class="mb-8 font-aspekta text-2xl font-bold text-white" data-aos="fade-up">${RELATED_HEADING[lang]}</h2>
      <div class="grid gap-6 md:grid-cols-3" data-aos="fade-up">
        ${cards}
      </div>
      <div class="mt-10 flex flex-wrap gap-4" data-aos="fade-up">
        <a href="${PATHS.projects[lang]}" class="inline-flex items-center gap-2 rounded-full border border-stone-800 bg-stone-900 px-6 py-3 text-sm font-semibold text-stone-200 transition hover:border-orange-500/50 hover:text-amber-300">${L.navProjects} →</a>
        <a href="${OVERVIEW_PATHS[lang]}" class="inline-flex items-center gap-2 rounded-full border border-stone-800 bg-stone-900 px-6 py-3 text-sm font-semibold text-stone-200 transition hover:border-orange-500/50 hover:text-amber-300">${L.navServices} →</a>
      </div>
    </div>
  </section>`;
}

function renderPostPage(post, lang, isLatest) {
  const L = LABELS[lang];
  const meta = LANG_META[lang];
  const loc = post.loc;
  const blogPath = BLOG_PATHS[lang];
  const canonicalUrl = `${ORIGIN}${blogPath}${post.slug}/`;
  const coverUrl = `${ORIGIN}${post.cover || '/static/images/og-default.png'}`;
  const dateText = formatDate(post.date, lang);
  const catLabel = isLatest
    ? (LATEST_LABEL[lang] || (CATEGORY_LABELS[lang] || {})[post.category] || post.category)
    : ((CATEGORY_LABELS[lang] || {})[post.category] || post.category);

  // Sprachumschalter: ohne uebersetzten Post fuehren EN/RU auf die Sprach-Startseite.
  // Sprachumschalter: Post-URL je Sprache, Fallback auf den Blog-Index wenn die Uebersetzung fehlt.
  const alternates = {};
  for (const l of ['de', 'en', 'ru']) alternates[l] = post.i18n[l] ? `${BLOG_PATHS[l]}${post.slug}/` : BLOG_PATHS[l];
  const langSwitcher = languageSwitcher(lang, alternates);

  const chips = Array.isArray(post.metrics) && post.metrics.length
    ? `<div class="mt-8 flex flex-wrap gap-3" data-aos="fade-up" data-aos-delay="240">
        ${post.metrics.map((m) => `<span class="inline-flex items-center gap-1.5 rounded-full border border-stone-800 bg-stone-900/60 px-4 py-2 text-sm text-stone-300">${m.label} · <b class="font-semibold text-white">${m.value}</b></span>`).join('\n        ')}
      </div>`
    : '';

  const cta = loc.cta && loc.cta.href
    ? `<div class="mt-8" data-aos="fade-up" data-aos-delay="280">
        <a class="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-400" href="${loc.cta.href}">${loc.cta.label} <span aria-hidden="true">→</span></a>
      </div>`
    : '';

  const bodySection = post.body
    ? `<section class="relative border-t border-stone-900 py-16 md:py-20">
  <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <div class="prose prose-invert max-w-3xl prose-headings:font-aspekta prose-headings:text-white prose-a:text-amber-400 hover:prose-a:text-amber-300 prose-strong:text-white prose-code:text-amber-200 prose-img:rounded-2xl prose-img:border prose-img:border-stone-800" data-aos="fade-up">
${post.body}
    </div>
  </div>
</section>`
    : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: loc.title,
        description: loc.summary,
        image: coverUrl,
        datePublished: post.date,
        dateModified: post.date,
        inLanguage: meta.htmlLang,
        url: canonicalUrl,
        mainEntityOfPage: canonicalUrl,
        author: { '@type': 'Organization', name: 'Teske Systemtechnik', url: ORIGIN },
        publisher: {
          '@type': 'Organization',
          name: 'Teske Systemtechnik',
          logo: { '@type': 'ImageObject', url: `${ORIGIN}/static/images/logo_whitemode.svg` },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: L.navStart, item: `${ORIGIN}${PATHS.home[lang]}` },
          { '@type': 'ListItem', position: 2, name: L.navBlog, item: `${ORIGIN}${blogPath}` },
          { '@type': 'ListItem', position: 3, name: loc.title, item: canonicalUrl },
        ],
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="${meta.htmlLang}" class="scroll-smooth">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">

  ${maintenanceGuard()}
  <meta name="robots" content="index,follow">

  <title>${loc.title} · Teske Systemtechnik</title>
  <meta name="description" content="${loc.summary}">

  <link rel="canonical" href="${canonicalUrl}">

${headCommon(lang)}

  <meta property="og:site_name" content="Teske Systemtechnik">
  <meta property="og:title" content="${loc.title}">
  <meta property="og:description" content="${loc.summary}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="${meta.ogLocale}">
  <meta property="article:published_time" content="${post.date}">
  <meta property="og:image" content="${coverUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${coverUrl}">

  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
</head>

<body class="font-inter antialiased bg-stone-950 text-stone-100 tracking-tight selection:bg-orange-500/40 selection:text-white">
<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-orange-500 focus:px-4 focus:py-2 focus:text-white">${L.skipToContent}</a>

<div class="flex min-h-screen flex-col">

${header(lang, blogPath, langSwitcher)}

<main id="main-content" class="grow">

  <section class="relative pt-32 pb-12 md:pt-40 md:pb-16">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <a href="${blogPath}" class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-400 transition hover:text-amber-300" data-aos="fade-up">${L.backToBlog}</a>
      <div class="max-w-3xl">
        <p class="mb-6 inline-flex items-center gap-3 font-aspekta text-xs font-semibold uppercase tracking-[0.18em] text-amber-400" data-aos="fade-up">
          <span class="inline-block rounded-full bg-orange-500" style="width:0.5rem;height:0.5rem"></span>
          ${loc.eyebrow || catLabel}
        </p>
        <h1 class="font-aspekta text-4xl font-bold leading-[1.05] text-white md:text-5xl" data-aos="fade-up" data-aos-delay="80">${loc.title}</h1>
        <p class="mt-5 flex flex-wrap items-center gap-3 text-sm text-stone-500" data-aos="fade-up" data-aos-delay="120">
          <span class="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-200">${catLabel}</span>
          <time datetime="${post.date}">${dateText}</time>
        </p>
        <p class="mt-6 max-w-2xl text-lg text-stone-300" data-aos="fade-up" data-aos-delay="160">${loc.summary}</p>
        ${chips}
        ${cta}
      </div>
    </div>
  </section>

  ${bodySection}

  ${relatedProjectsSection(lang)}

  <section class="relative border-t border-stone-900 py-12">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <a href="${blogPath}" class="inline-flex items-center gap-2 rounded-full border border-stone-800 bg-stone-900 px-6 py-3 text-sm font-semibold text-stone-200 transition hover:border-orange-500/50 hover:text-amber-300">
        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
        ${L.backToBlog.replace('← ', '')}
      </a>
    </div>
  </section>

</main>

${footer(lang)}

</div>

${scriptsFooter()}

</body>
</html>
`;
}

// ============================================================
// INDEX-SEITE
// ============================================================

function renderIndexPage(posts, lang) {
  const L = LABELS[lang];
  const meta = LANG_META[lang];
  const blogPath = BLOG_PATHS[lang];
  const canonicalUrl = `${ORIGIN}${blogPath}`;
  const alternates = { de: BLOG_PATHS.de, en: BLOG_PATHS.en, ru: BLOG_PATHS.ru };
  const langSwitcher = languageSwitcher(lang, alternates);

  const cats = CATEGORY_LABELS[lang] || {};
  const monthsArr = MONTHS[lang] || MONTHS.de;
  const ARROW = '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd"/></svg>';

  // Kategorie-Filter nur fuer tatsaechlich vorhandene Kategorien (+ Alle)
  const usedCats = [];
  for (const p of posts) if (!usedCats.includes(p.category)) usedCats.push(p.category);
  const catPills = [`<button type="button" class="bl-cat" data-cat="all" aria-pressed="true">${L.filterAll}</button>`]
    .concat(usedCats.map((c) => `<button type="button" class="bl-cat" data-cat="${c}" aria-pressed="false">${cats[c] || c}</button>`))
    .join('\n            ');

  // Timeline, neueste zuerst. Jahr-Header beim Jahreswechsel; der vertikale
  // Abstand zum naechsten (aelteren) Eintrag skaliert mit der vergangenen Zeit,
  // ein Label in der Luecke benennt sie ("5 Monate").
  let rowsHtml = '';
  const MONTH_REM = 3.8;   // Hoehe pro vergangenem Monat (Abstand ~ Distanz)
  const MAX_SPAN = 34;     // Deckel fuer sehr lange Pausen
  posts.forEach((post, gi) => {
    const y = post.date.slice(0, 4);
    if (gi === 0 || posts[gi - 1].date.slice(0, 4) !== y) rowsHtml += `\n          <div class="bl-year">${y}</div>`;
    const loc = post.loc;
    const href = `${blogPath}${post.slug}/`;
    const catLabel = cats[post.category] || post.category;
    const parts = post.date.split('-').map(Number);
    const day = String(parts[2]).padStart(2, '0');
    const mon = (monthsArr[parts[1] - 1] || '').slice(0, 3);
    const search = `${loc.title} ${loc.summary} ${catLabel}`.toLowerCase().replace(/["\n]/g, ' ');
    rowsHtml += `
          <a class="bl-row${gi === 0 ? ' is-latest' : ''}" href="${href}" data-cat="${post.category}" data-search="${search}">
            <span class="bl-date"><b>${day}</b><span>${mon}</span></span>
            <span class="bl-rail"><span class="bl-dot"></span></span>
            <span class="bl-body">
              <span class="bl-tag">${gi === 0 ? (LATEST_LABEL[lang] || catLabel) : catLabel}</span>
              <span class="bl-title">${loc.title}</span>
              <span class="bl-summary">${loc.summary}</span>
              <span class="bl-more">${L.readMore.replace(/\s*→\s*$/, '')} ${ARROW}</span>
            </span>
          </a>`;
    // Zeitspanne bis zum naechsten (aelteren) Eintrag als Achse: ein Monats-Tick
    // je vergangenem Monat (mit Kuerzel), Hoehe skaliert pro Monat -> Zeit sichtbar.
    const next = posts[gi + 1];
    if (next) {
      const months = monthsBetween(post.date, next.date);
      const h = Math.min(months * MONTH_REM, MAX_SPAN);
      let ticks = '';
      for (let t = 1; t < months && t <= 11; t++) {
        ticks += `<span class="bl-tick" style="top:${(t / months * 100).toFixed(1)}%"><i>${monthLabelBack(post.date, t, monthsArr)}</i></span>`;
      }
      rowsHtml += `
          <div class="bl-span" style="height:${h.toFixed(2)}rem">${ticks}</div>`;
    }
  });

  const timeline = posts.length
    ? `<div class="bl-tl">${rowsHtml}
        </div>
        <div class="bl-empty" id="bl-empty">${L.noResults}</div>`
    : `<div class="rounded-3xl border border-stone-800 bg-stone-900/60 p-10 text-center text-stone-400">${L.blogEmpty}</div>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': canonicalUrl,
    name: L.blogMetaTitle,
    description: L.blogIntro,
    url: canonicalUrl,
    inLanguage: meta.htmlLang,
    publisher: { '@type': 'Organization', name: 'Teske Systemtechnik', url: ORIGIN },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.loc.title,
      url: `${canonicalUrl}${post.slug}/`,
      datePublished: post.date,
      image: `${ORIGIN}${post.cover}`,
    })),
  };

  // Scoped Timeline-Styles (nur diese Seite; bewusst KEIN Eingriff in das
  // globale style.css, damit kein projektweiter Cache-Bump noetig ist).
  const blogStyles = `  <style>
    .bl-tools{display:flex;flex-direction:column;gap:1rem;margin-top:2.75rem;max-width:42rem}
    .bl-search{position:relative}
    .bl-search>svg{position:absolute;left:1.15rem;top:50%;transform:translateY(-50%);width:1.05rem;height:1.05rem;color:#78716c;pointer-events:none}
    #bl-q{width:100%;background:rgba(28,25,23,.6);border:1px solid #292524;border-radius:9999px;padding:.8rem 1.25rem .8rem 3.1rem;color:#fafaf9;font-size:.95rem;font-family:inherit;transition:border-color .2s,box-shadow .2s}
    #bl-q::placeholder{color:#78716c}
    #bl-q:focus{outline:none;border-color:#f97316;box-shadow:0 0 0 3px rgba(249,115,22,.16)}
    .bl-cats{display:flex;flex-wrap:wrap;gap:.5rem}
    .bl-cat{border:1px solid #292524;background:transparent;color:#a8a29e;border-radius:9999px;padding:.4rem 1rem;font-size:.8rem;font-weight:500;font-family:inherit;cursor:pointer;transition:color .18s,border-color .18s,background-color .18s}
    .bl-cat:hover{color:#fafaf9;border-color:#57534e}
    .bl-cat[aria-pressed="true"]{background:#f97316;border-color:#f97316;color:#fff}
    .bl-tl{position:relative}
    .bl-tl::before{content:"";position:absolute;left:7rem;top:1.5rem;bottom:1.25rem;width:2px;background:linear-gradient(180deg,#fb923c 0,#57534e 7rem,#292524 100%);border-radius:2px}
    .bl-year{position:sticky;top:4.75rem;z-index:5;width:max-content;font-family:"Aspekta",system-ui,sans-serif;font-size:.72rem;font-weight:650;letter-spacing:.28em;text-transform:uppercase;color:#57534e;background:#0c0a09;padding:.5rem 1rem .5rem 0;margin:.5rem 0 .75rem}
    .bl-year:first-child{margin-top:0}
    .bl-row{display:grid;grid-template-columns:6rem 2rem 1fr;grid-template-areas:"date rail body";position:relative;text-decoration:none;color:inherit;border-radius:.85rem;transition:background-color .2s}
    .bl-row:hover{background:rgba(250,250,249,.025)}
    .bl-row.is-hidden{display:none}
    .bl-date{grid-area:date;text-align:right;padding-top:.35rem;font-family:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace;color:#78716c;line-height:1.2}
    .bl-date b{display:block;font-size:1.5rem;font-weight:600;color:#d6d3d1;letter-spacing:-.03em}
    .bl-date span{display:block;margin-top:.1rem;font-size:.72rem;text-transform:uppercase;letter-spacing:.08em}
    .bl-rail{grid-area:rail;position:relative}
    .bl-dot{position:absolute;left:50%;top:.7rem;width:14px;height:14px;border-radius:9999px;background:#0c0a09;border:2px solid #78716c;transform:translate(-50%,-50%);transition:border-color .2s,box-shadow .2s,background-color .2s;z-index:1}
    .bl-row:hover .bl-dot{border-color:#f97316;box-shadow:0 0 0 5px rgba(249,115,22,.12)}
    .bl-row.is-latest .bl-dot{background:#f97316;border-color:#f97316;box-shadow:0 0 0 5px rgba(249,115,22,.14)}
    .bl-row.is-latest .bl-dot::after{content:"";position:absolute;inset:-2px;border-radius:9999px;animation:blPulse 2.4s ease-out infinite}
    @keyframes blPulse{0%{box-shadow:0 0 0 0 rgba(249,115,22,.5)}70%{box-shadow:0 0 0 9px rgba(249,115,22,0)}100%{box-shadow:0 0 0 0 rgba(249,115,22,0)}}
    @media (prefers-reduced-motion:reduce){.bl-row.is-latest .bl-dot::after{animation:none}}
    .bl-body{grid-area:body;padding:0 0 .75rem 1.75rem}
    .bl-tag{display:inline-block;font-size:.66rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#fcd34d;border:1px solid rgba(249,115,22,.3);background:rgba(249,115,22,.1);border-radius:9999px;padding:.16rem .65rem;margin-bottom:.7rem}
    .bl-title{display:block;font-family:"Aspekta",system-ui,sans-serif;font-size:1.4rem;line-height:1.2;font-weight:700;color:#fff;letter-spacing:-.01em;transition:color .18s}
    .bl-row:hover .bl-title{color:#fcd34d}
    .bl-summary{display:block;margin-top:.55rem;color:#a8a29e;font-size:.95rem;line-height:1.65;max-width:42rem}
    .bl-more{display:inline-flex;align-items:center;gap:.4rem;margin-top:1rem;font-size:.82rem;font-weight:600;color:#fb923c}
    .bl-more>svg{width:.9rem;height:.9rem;transition:transform .2s}
    .bl-row:hover .bl-more>svg{transform:translateX(3px)}
    .bl-empty{display:none;border:1px dashed #292524;border-radius:1.25rem;padding:3rem 1.5rem;text-align:center;color:#78716c;font-size:.95rem}
    .bl-empty.is-shown{display:block}
    .bl-span{position:relative}
    .bl-tick{position:absolute;left:7rem;transform:translate(-50%,-50%);width:12px;height:2px;background:#3f3a37;border-radius:1px}
    .bl-tick i{position:absolute;left:18px;top:50%;transform:translateY(-50%);font-family:ui-monospace,"SFMono-Regular",Menlo,monospace;font-size:.56rem;font-style:normal;font-weight:400;letter-spacing:.1em;text-transform:uppercase;color:#57534e;white-space:nowrap}
    .bl-gap{position:absolute;left:7rem;top:50%;transform:translate(-50%,-50%);background:#0c0a09;padding:.22rem .75rem;font-family:ui-monospace,"SFMono-Regular",Menlo,monospace;font-size:.66rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#a8a29e;white-space:nowrap;z-index:2;pointer-events:none}
    .bl-tl.is-filtering .bl-span{display:none}
    .bl-tl.is-filtering .bl-row{margin-bottom:1.5rem}
    @media (max-width:640px){
      .bl-tl::before{left:.75rem}
      .bl-row{grid-template-columns:1.5rem 1fr;grid-template-areas:"rail date" "rail body";column-gap:.85rem}
      .bl-date{text-align:left;padding-top:0;margin-bottom:.5rem;display:flex;align-items:baseline;gap:.4rem}
      .bl-date b{display:inline;font-size:1rem}
      .bl-date span{display:inline;margin-top:0}
      .bl-dot{left:50%;top:.55rem}
      .bl-body{padding:0 0 .5rem 0}
      .bl-tick{left:.75rem}
      .bl-gap{left:.75rem}
    }
  </style>`;

  const blogScript = `<script>
(function(){
  var q=document.getElementById('bl-q');
  var cats=document.querySelectorAll('.bl-cat');
  var rows=Array.prototype.slice.call(document.querySelectorAll('.bl-row'));
  var yrs=document.querySelectorAll('.bl-year');
  var empty=document.getElementById('bl-empty');
  var tl=document.querySelector('.bl-tl');
  var active='all';
  function apply(){
    var term=(q&&q.value?q.value:'').trim().toLowerCase();
    if(tl)tl.classList.toggle('is-filtering',active!=='all'||term!=='');
    var shown=0,last=null;
    rows.forEach(function(r){
      var okC=active==='all'||r.getAttribute('data-cat')===active;
      var okQ=!term||(r.getAttribute('data-search')||'').indexOf(term)!==-1;
      var vis=okC&&okQ;
      r.classList.toggle('is-hidden',!vis);
      r.classList.remove('is-last-visible');
      if(vis){shown++;last=r;}
    });
    if(last)last.classList.add('is-last-visible');
    if(empty)empty.classList.toggle('is-shown',shown===0);
    yrs.forEach(function(yr){
      var any=false,el=yr.nextElementSibling;
      while(el&&el.className.indexOf('bl-year')===-1){
        if(el.className.indexOf('bl-row')!==-1&&el.className.indexOf('is-hidden')===-1){any=true;break;}
        el=el.nextElementSibling;
      }
      yr.style.display=any?'':'none';
    });
  }
  if(q)q.addEventListener('input',apply);
  cats.forEach(function(b){
    b.addEventListener('click',function(){
      cats.forEach(function(x){x.setAttribute('aria-pressed','false');});
      b.setAttribute('aria-pressed','true');
      active=b.getAttribute('data-cat');
      apply();
    });
  });
  apply();
})();
</script>`;

  return `<!DOCTYPE html>
<html lang="${meta.htmlLang}" class="scroll-smooth">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">

  ${maintenanceGuard()}
  <meta name="robots" content="index,follow">

  <title>${L.blogMetaTitle}</title>
  <meta name="description" content="${L.blogIntro}">

  <link rel="canonical" href="${canonicalUrl}">
  <link rel="alternate" type="application/rss+xml" title="${L.feedTitle}" href="${blogPath}feed.xml">

${headCommon(lang)}
${blogStyles}

  <meta property="og:site_name" content="Teske Systemtechnik">
  <meta property="og:title" content="${L.blogMetaTitle}">
  <meta property="og:description" content="${L.blogIntro}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${meta.ogLocale}">
  <meta name="twitter:card" content="summary_large_image">
  <meta property="og:image" content="${ORIGIN}/static/images/og-default.png">

  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
</head>

<body class="font-inter antialiased bg-stone-950 text-stone-100 tracking-tight selection:bg-orange-500/40 selection:text-white">
<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-orange-500 focus:px-4 focus:py-2 focus:text-white">${L.skipToContent}</a>

<div class="flex min-h-screen flex-col">

${header(lang, blogPath, langSwitcher)}

<main id="main-content" class="grow">

  <section class="relative pt-32 pb-16 md:pt-44 md:pb-20">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="max-w-3xl">
        <p class="mb-6 inline-flex items-center gap-3 font-aspekta text-xs font-semibold uppercase tracking-[0.18em] text-amber-400" data-aos="fade-up">
          <span class="section-num">000 /</span>
          ${L.blogEyebrow}
        </p>
        <h1 class="font-aspekta text-5xl font-bold leading-[1.02] text-white md:text-6xl" data-aos="fade-up" data-aos-delay="80">${L.blogTitle}</h1>
        <p class="mt-6 max-w-2xl text-lg text-stone-300" data-aos="fade-up" data-aos-delay="160">${L.blogIntro}</p>
      </div>
      ${posts.length ? `<div class="bl-tools" data-aos="fade-up" data-aos-delay="220">
        <div class="bl-search">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="9" r="6"></circle><path d="M14.5 14.5 18 18"></path></svg>
          <input id="bl-q" type="search" autocomplete="off" spellcheck="false" placeholder="${L.searchPlaceholder}" aria-label="${L.searchLabel}">
        </div>
        <div class="bl-cats" role="group" aria-label="${L.searchLabel}">
            ${catPills}
        </div>
      </div>` : ''}
    </div>
  </section>

  <section class="relative border-t border-stone-900 py-16 md:py-20">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      ${timeline}
    </div>
  </section>

</main>

${footer(lang)}

</div>

${scriptsFooter()}
${posts.length ? blogScript : ''}

</body>
</html>
`;
}

// ============================================================
// RSS-FEED
// ============================================================

function renderFeed(posts, lang) {
  const blogUrl = `${ORIGIN}${BLOG_PATHS[lang]}`;
  const L = LABELS[lang];
  const items = posts.map((post) => {
    const url = `${blogUrl}${post.slug}/`;
    const pub = `${post.date}T09:00:00+02:00`;
    return `    <item>
      <title>${escapeHtml(post.loc.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(pub).toUTCString()}</pubDate>
      <description>${escapeHtml(post.loc.summary)}</description>
    </item>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(L.feedTitle)}</title>
    <link>${blogUrl}</link>
    <atom:link href="${blogUrl}feed.xml" rel="self" type="application/rss+xml"/>
    <description>${escapeHtml(L.feedDesc)}</description>
    <language>${lang}</language>
${items}
  </channel>
</rss>
`;
}

// ============================================================
// GOOGLE-PROFIL-TEXT (lokal, nicht fuer die Website)
// ============================================================

function renderGoogleUpdate(slug, lang = 'de') {
  const raw = JSON.parse(readFileSync(join(ROOT, 'static/data/updates.json'), 'utf-8'));
  const post = raw.posts.find((p) => p.slug === slug);
  if (!post) { console.error(`Kein Post mit slug "${slug}" in updates.json`); process.exit(1); }
  const loc = post.i18n[lang];
  const url = `${ORIGIN}${BLOG_PATHS[lang]}${post.slug}/`;
  const cta = loc.cta || { label: 'Mehr erfahren', href: url };
  return `Google-Unternehmensprofil: Update
Datum: ${post.date}
Quelle: ${BLOG_PATHS[lang]}${post.slug}/ (Blog)

== Titel ==
${loc.title}

== Text ==
${loc.summary}

Zum Beitrag: ${url}

== Button ==
"${cta.label}"
Link: ${ORIGIN}${cta.href}
`;
}

// ============================================================
// MAIN
// ============================================================

function writeFile(relPath, content) {
  const fullPath = join(ROOT, relPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, 'utf-8');
  console.log(`  wrote ${relPath} (${content.length} bytes)`);
}

// --- sitemap.xml / llms.txt Pflege (idempotent) --------------------------
// sitemap: marker-begrenzter Blog-Block, bei jedem Build neu geschrieben,
//          sodass neue Posts automatisch in der Sitemap landen.
// llms.txt: stabile ## Blog Sektion, die auf Index + Feed verweist (wird nur
//           angelegt wenn sie fehlt, waechst nicht pro Post).

function urlBlock(path, lastmod, prio) {
  return `  <url>
    <loc>${ORIGIN}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${prio}</priority>
  </url>`;
}

function syncSitemap() {
  const p = join(ROOT, 'sitemap.xml');
  if (!existsSync(p)) { console.log('  sitemap.xml nicht gefunden, uebersprungen'); return; }
  let xml = readFileSync(p, 'utf-8');
  const nl = xml.includes('\r\n') ? '\r\n' : '\n';
  const blocks = [];
  for (const lang of BUILD_LANGUAGES) {
    const posts = loadPosts(lang);
    if (!posts.length) continue;
    blocks.push(urlBlock(BLOG_PATHS[lang], posts[0].date, '0.7'));
    for (const post of posts) blocks.push(urlBlock(`${BLOG_PATHS[lang]}${post.slug}/`, post.date, '0.6'));
  }
  if (!blocks.length) return;
  const START = '  <!-- BLOG:START (auto build-blog.mjs) -->';
  const END = '  <!-- BLOG:END -->';
  const region = START + nl + blocks.join(nl) + nl + END;
  const s = xml.indexOf(START), e = xml.indexOf(END);
  if (s !== -1 && e !== -1) {
    xml = xml.slice(0, s) + region + xml.slice(e + END.length);
  } else {
    xml = xml.replace('</urlset>', region + nl + nl + '</urlset>');
  }
  writeFileSync(p, xml, 'utf-8');
  console.log(`  sitemap.xml: ${blocks.length} Blog-URL(s) synchronisiert`);
}

function ensureLlmsBlogSection() {
  const p = join(ROOT, 'llms.txt');
  if (!existsSync(p)) return;
  let s = readFileSync(p, 'utf-8');
  if (s.includes('## Blog')) return;
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  const section =
    `## Blog${nl}${nl}` +
    `News, product updates and engineering notes: new website features, projects and behind-the-scenes posts.${nl}${nl}` +
    `- [Blog (German)](${ORIGIN}/de/blog/): News and updates from Teske Systemtechnik (RSS: ${ORIGIN}/de/blog/feed.xml)${nl}${nl}`;
  const anchor = '## Service / pricing pages';
  s = s.includes(anchor) ? s.replace(anchor, section + anchor) : s + nl + section;
  writeFileSync(p, s, 'utf-8');
  console.log('  llms.txt: ## Blog Sektion ergaenzt');
}

const argv = process.argv.slice(2);
if (argv[0] === '--google') {
  const slug = argv[1];
  if (!slug) { console.error('Usage: node scripts/build-blog.mjs --google <slug>'); process.exit(1); }
  process.stdout.write(renderGoogleUpdate(slug));
} else {
  let count = 0;
  for (const lang of BUILD_LANGUAGES) {
    const posts = loadPosts(lang);
    console.log(`=== Blog (${lang}): ${posts.length} Posts ===`);
    writeFile(`${BLOG_PATHS[lang].slice(1)}index.html`, renderIndexPage(posts, lang));
    count++;
    for (const post of posts) {
      writeFile(`${BLOG_PATHS[lang].slice(1)}${post.slug}/index.html`, renderPostPage(post, lang, post === posts[0]));
      count++;
    }
    writeFile(`${BLOG_PATHS[lang].slice(1)}feed.xml`, renderFeed(posts, lang));
    count++;
  }
  syncSitemap();
  ensureLlmsBlogSection();
  console.log(`\nDone: ${count} files generated.`);
}
