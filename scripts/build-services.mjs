// Generiert alle Service- und Übersichts-Seiten (DE/EN/RU) aus der
// SERVICES-Konstante unten. Pro Run:
//   - 5 Service-Seiten × 3 Sprachen = 15 Detail-Seiten
//   - 3 Übersichts-Seiten (/de/leistungen/, /en/services/, /ru/uslugi/)
//
// Toggle/Add neue Sprache oder neuen Service: Daten unten erweitern, dann
//   npm run build-services
//
// Ausgabe ist deterministisch und überschreibt nur die Dateien, die das
// Script selbst generiert. Header/Footer/Maintenance-Guard sind bewusst
// inline gerendert, damit Service-Seiten ohne externe Template-Engine
// gebaut werden können.

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ============================================================
// DATEN
// ============================================================

const LANGUAGES = ['de', 'en', 'ru'];

const OVERVIEW_PATHS = {
  de: '/de/leistungen/',
  en: '/en/services/',
  ru: '/ru/uslugi/',
};

const LABELS = {
  de: {
    htmlLang: 'de', ogLocale: 'de_DE',
    skipToContent: 'Zum Inhalt springen',
    navStart: 'Start', navAbout: 'Über uns', navServices: 'Leistungen',
    navProjects: 'Projekte', navConsultation: 'Beratung',
    legal: 'Impressum', privacy: 'Datenschutz',
    quality: 'Quality engineered in Germany.',
    copyright: '&copy; 2026 Teske Systemtechnik. Alle Rechte vorbehalten.',
    switchLanguage: 'Sprache wechseln',
    inquirySend: 'Anfrage senden',
    whatsInside: 'Was ist drin?',
    backToOverview: '← Alle Leistungen',
    backToHome: 'Zurück zur Startseite',
    relatedServices: 'Verwandte Leistungen',
    relatedIntro: 'Häufig hilfreich zusammen mit dieser Leistung:',
    fromPrefix: 'ab',
    netSuffix: 'netto',
    response24h: 'Antwort innerhalb von 24 h',
    readCase: 'Komplette Case Study lesen',
    secDeliverables: 'Lieferumfang',
    secProcess: 'Ablauf',
    secPricing: 'Preis',
    secReference: 'Referenz',
    secFaq: 'Häufige Fragen',
    secOverviewLabel: 'Leistungen',
    overviewTitle: 'Leistungen mit Festpreis',
    overviewIntro: 'Sechs Leistungspakete, jeweils mit klarem Deliverable und durchsichtigem Einstiegspreis. Kein Stundenzettel-Geschäft, keine offene Endrechnung. Sie wissen vor Vertragsabschluss, was Sie bekommen und was es kostet.',
    overviewCardCta: 'Details ansehen →',
    headlineNavigation: 'Navigation',
    headlineLegal: 'Rechtliches',
    headlineFollow: 'Folgen Sie mir',
    consultationViaUpwork: 'Beratung via Upwork',
  },
  en: {
    htmlLang: 'en', ogLocale: 'en_US',
    skipToContent: 'Skip to content',
    navStart: 'Home', navAbout: 'About', navServices: 'Services',
    navProjects: 'Projects', navConsultation: 'Book a call',
    legal: 'Legal Notice', privacy: 'Privacy Policy',
    quality: 'Quality engineered in Germany.',
    copyright: '&copy; 2026 Teske Systemtechnik. All rights reserved.',
    switchLanguage: 'Switch language',
    inquirySend: 'Send inquiry',
    whatsInside: 'What you get',
    backToOverview: '← All services',
    backToHome: 'Back to home',
    relatedServices: 'Related services',
    relatedIntro: 'Often booked alongside this service:',
    fromPrefix: 'from',
    netSuffix: 'net',
    response24h: 'Reply within 24 h',
    readCase: 'Read the full case study',
    secDeliverables: 'Deliverables',
    secProcess: 'How it runs',
    secPricing: 'Price',
    secReference: 'Reference',
    secFaq: 'Frequent questions',
    secOverviewLabel: 'Services',
    overviewTitle: 'Fixed-price services',
    overviewIntro: 'Six service packages, each with a clear deliverable and a transparent starting price. No hourly-bill business, no open-ended invoice. You know what you get and what it costs before you sign.',
    overviewCardCta: 'See details →',
    headlineNavigation: 'Navigation',
    headlineLegal: 'Legal',
    headlineFollow: 'Follow me',
    consultationViaUpwork: 'Consultation via Upwork',
  },
  ru: {
    htmlLang: 'ru', ogLocale: 'ru_RU',
    skipToContent: 'Перейти к содержимому',
    navStart: 'Главная', navAbout: 'Обо мне', navServices: 'Услуги',
    navProjects: 'Проекты', navConsultation: 'Консультация',
    legal: 'Выходные данные', privacy: 'Конфиденциальность',
    quality: 'Quality engineered in Germany.',
    copyright: '&copy; 2026 Teske Systemtechnik. Все права защищены.',
    switchLanguage: 'Сменить язык',
    inquirySend: 'Отправить запрос',
    whatsInside: 'Что входит',
    backToOverview: '← Все услуги',
    backToHome: 'На главную',
    relatedServices: 'Связанные услуги',
    relatedIntro: 'Часто заказывают вместе с этой услугой:',
    fromPrefix: 'от',
    netSuffix: 'нетто',
    response24h: 'Ответ в течение 24 ч',
    readCase: 'Полный кейс',
    secDeliverables: 'Что вы получаете',
    secProcess: 'Как это идёт',
    secPricing: 'Цена',
    secReference: 'Референс',
    secFaq: 'Частые вопросы',
    secOverviewLabel: 'Услуги',
    overviewTitle: 'Услуги с фиксированной ценой',
    overviewIntro: 'Шесть пакетов услуг с чётким результатом и прозрачной стартовой ценой. Никакой почасовки, никакого открытого счёта. Вы знаете, что получаете и сколько это стоит, до подписания.',
    overviewCardCta: 'Подробности →',
    headlineNavigation: 'Навигация',
    headlineLegal: 'Юридическое',
    headlineFollow: 'Профили',
    consultationViaUpwork: 'Консультация на Upwork',
  },
};

// Pfade pro Sprache für Hauptseiten + Projekt-Slugs
const PATHS = {
  home:    { de: '/de/', en: '/en/', ru: '/ru/' },
  about:   { de: '/de/about/', en: '/en/about/', ru: '/ru/about/' },
  projects:{ de: '/de/projekte/', en: '/en/projects/', ru: '/ru/proekty/' },
  projectsBase: { de: '/de/projekte', en: '/en/projects', ru: '/ru/proekty' },
  legal:   { de: '/de/impressum/', en: '/en/legal-notice/', ru: '/ru/impressum/' },
  privacy: { de: '/de/datenschutz/', en: '/en/privacy-policy/', ru: '/ru/privacy/' },
  inquiry: { de: '/de/anfrage/', en: '/en/inquiry/', ru: '/ru/zapros/' },
};

const SERVICES = [
  // ============================================================
  // AWS Cost Analysis & Reduction
  // ============================================================
  {
    slug: 'aws-cost-analysis',
    urlSlugs: { de: 'aws-kostenanalyse', en: 'aws-cost-analysis', ru: 'aws-cost-analysis' },
    inquirySlug: 'aws-kostenanalyse',
    caseStudy: 'aws-cost-optimization',
    related: ['legacy-data-migration', 'product-feed-pipelines'],
    eyebrow: 'FinOps',
    priceMin: 3500,
    priceFmt: { de: '3.500&nbsp;€', en: '€3,500', ru: '€3 500' },
    i18n: {
      de: {
        title: 'AWS Kostenanalyse & Reduktion',
        subtitle: 'Ein Audit, der nicht aus PowerPoint-Slides besteht, sondern aus einer durchnummerierten Maßnahmenliste mit konkreten Zahlen pro Position, die Sie morgen umsetzen können. Festpreis, Vorher-Nachher-Prognose, Zero-Downtime in der Umsetzung.',
        meta: 'Festpreis-Audit Ihrer AWS-Rechnung mit konkreter Maßnahmenliste. Zero-Downtime bei der Umsetzung, Vorher-Nachher-Prognose belastbar. Ab 3.500 €.',
        overviewSummary: 'Festpreis-Audit Ihrer AWS-Rechnung. Maßnahmenliste mit Quick Wins, Strukturmaßnahmen und Architektur-Refactorings, sortiert nach ROI. Zero-Downtime bei der Umsetzung.',
        deliverIntro: 'Vier Deliverables. Kein Beratungs-Speak, kein „Empfehlungen ableiten". Sie kriegen Material, mit dem Sie sofort weiterarbeiten können.',
        outcomes: [
          { icon: 'doc',   title: 'Cost-Audit-Report', body: 'Eine PDF, in der jede Position Ihrer Rechnung erklärt ist. Plus: welche Ressourcen produktiv arbeiten, welche nur noch existieren weil niemand sie löschen wollte, und welche tatsächlich nur Bot-Traffic anziehen.' },
          { icon: 'check', title: 'Maßnahmenliste in drei Spalten', body: 'Quick Wins (Tage), Strukturmaßnahmen (Wochen), Architektur (Monate). Pro Zeile: was zu tun ist, wieviel Ersparnis pro Monat zu erwarten, wie groß das Risiko. Sortiert nach ROI.' },
          { icon: 'graph', title: 'Abhängigkeits-Karte', body: 'Bei einem Projekt war ein scheinbar ungenutzter ALB tatsächlich Teil der E-Mail-Zustellung. Ohne Log-Analyse hätte das Abschalten die Firma aus ihrem eigenen Postfach gesperrt. Die Karte zeigt, was wirklich verkettet ist, nicht was die Tags sagen.' },
          { icon: 'bolt',  title: 'Optional: Umsetzung', body: 'Wenn Sie wollen, setze ich die Maßnahmen auch um, Tagessatz, mit Rollback-Plan pro Position. Sie geben jede Aktion einzeln frei, bevor sie passiert.' },
        ],
        processIntro: 'Wie das in der Praxis läuft',
        process: [
          { title: 'Discovery-Call', body: '30-Minuten- oder 1-Stunden-Beratung, ab 75 €. Workflow, Machbarkeit, Architektur. Buchen Sie aufs Folgeprojekt, wird der Call-Preis angerechnet.' },
          { title: 'Zugriffsfreigabe', body: 'Sie legen eine Read-only-IAM-Rolle an. Ich kann gucken, aber nichts kaputtmachen. Beispiel-Policy schicke ich vorher; NDA gibt\'s auf Wunsch.' },
          { title: 'Audit', body: '3 bis 5 Werktage. Cost Explorer, Logs, Right-Sizing, Storage-Lifecycle, Zombie-Detection. Tägliches Status-Update wenn Sie das wollen, sonst nur am Ende.' },
          { title: 'Übergabe', body: 'PDF-Report plus einstündiger Call, in dem ich die Roadmap durchgehe. Danach: entweder Ihr Team setzt um, oder ich übernehme das.' },
        ],
        pricingTitle: 'Festpreis, kein Stundenzettel',
        pricingBody1: '3.500 € deckt einen typischen Single-Account-Audit ab. Bei großen Multi-Account-Organisationen passt der Preis sich an, Sie kennen die Zahl vor Vertragsabschluss, nicht hinterher.',
        pricingBody2: 'Sie zahlen nicht für Stunden, sondern für ein definiertes Deliverable. Wenn ich schneller bin als geplant, ist das mein Risiko und Ihre Gewissheit.',
        packageLabel: 'Audit-Paket',
        packageSubtitle: 'Single-Account-Setup, mittlerer Komplexität.',
        includes: [
          'PDF-Report mit Vorher-Nachher-Prognose',
          'Maßnahmenliste, Quick Wins, Strukturmaßnahmen, Architektur, getrennt',
          'Abhängigkeits-Karte aus Logs, Voraussetzung für Zero-Downtime',
          'Übergabe-Call (1 h) plus schriftliche Dokumentation',
          'Read-only-Zugriff durchgehend, NDA auf Wunsch',
        ],
        referenceTitle: 'Eine echte Geschichte',
        referenceIntro: 'Der Prozess oben ist keine Theorie, er steht hinter diesem Projekt, das ich Anfang 2026 für einen Kunden umgesetzt habe.',
        referenceCard: {
          tags: ['Blender Networks Inc.', 'Werbeagentur · Kanada'],
          heading: '3.850 $ → 1.330 $ pro Monat, ohne Ausfall',
          body: '8 Zombie-ALBs, die nur noch Bot-Scans angezogen haben. Ein kompletter EKS-Cluster, den seit Monaten niemand mehr ernsthaft benutzte. 1,4 TB obsolete EBS-Snapshots. Plus: WordPress-Sites und MX-Records, die durchgehend liefen, das war die Bedingung.',
        },
        faqIntro: 'Was Sie vermutlich wissen wollen',
        faq: [
          { q: 'Ab welcher Rechnungshöhe lohnt sich ein Audit?', a: 'Bei circa 2.000 $ pro Monat aufwärts refinanziert sich der Audit fast immer innerhalb von ein, zwei Monaten, vorausgesetzt, das Setup ist nicht schon perfekt optimiert. Unterhalb davon: gerne Discovery-Call, aber ich sage Ihnen vielleicht ehrlich, dass die Hebel zu klein für den Aufwand sind.' },
          { q: 'Welche Zugriffe brauchen Sie konkret?', a: 'Cost Explorer, CloudWatch Logs und Metrics, plus describe/list auf EC2, EKS, RDS, S3 und ALB. Keine Schreibrechte. Kein Zugriff auf S3-Bucket-Inhalte oder Datenbank-Inhalte. Die Policy schicke ich vor Vertragsbeginn, Sie sehen genau, was Sie freigeben.' },
          { q: 'Wie lange dauert das?', a: 'Drei bis fünf Werktage nach Zugriffsfreigabe. Multi-Account-Setups mit Organizations-Struktur dauern länger; das schätze ich im Discovery-Call ab.' },
          { q: 'Setzen Sie auch um, oder nur Audit?', a: 'Auf Wunsch beides. Umsetzung läuft auf Tagessatz, Schritt für Schritt mit Rollback-Plan pro Maßnahme. Alternative: Hand-off-Sprint, in dem ich Ihr Team begleite und die Leute es selbst machen.' },
          { q: 'Festpreis oder Stundenabrechnung?', a: 'Der Audit selbst ist Festpreis. Bei sehr großen Setups passt sich die Zahl an, aber Sie kennen sie vor Vertragsabschluss. Eine nachgelagerte Umsetzung läuft dann auf Tagessatz.' },
          { q: 'Was passiert mit unseren Daten?', a: 'Bleibt alles in Ihrem Account. Ich greife read-only zu, kopiere keine Inhalte aus S3 oder RDS, arbeite mit Cost-Metriken und Logs. NDA gibt\'s auf Wunsch schon vor dem Discovery-Call.' },
        ],
        finalCtaTitle: 'Eine konkrete Zahl?',
        finalCtaBody: 'Schicken Sie eine kurze Anfrage mit Budget-Rahmen, Antwort kommt binnen 24 h, mit Terminvorschlag für den Discovery-Call.',
      },
      en: {
        title: 'AWS Cost Analysis & Reduction',
        subtitle: 'An audit that\'s not a deck of PowerPoint slides, it\'s a numbered list of measures with concrete figures per line item that you can act on tomorrow. Fixed price, before/after forecast you can trust, zero downtime on the implementation.',
        meta: 'Fixed-price audit of your AWS bill with concrete action list. Zero downtime on implementation, reliable before/after forecast. From €3,500.',
        overviewSummary: 'Fixed-price audit of your AWS bill. Action list with quick wins, structural fixes and architectural refactors, sorted by ROI. Zero downtime on the implementation.',
        deliverIntro: 'Four deliverables. No consulting-speak, no "derive recommendations". You get material you can work with directly.',
        outcomes: [
          { icon: 'doc',   title: 'Cost audit report', body: 'A PDF that explains every line item on your bill. Plus: which resources are actually doing productive work, which are still running because nobody dared turn them off, and which are only attracting bot traffic.' },
          { icon: 'check', title: 'Action list in three columns', body: 'Quick wins (days), structural fixes (weeks), architecture (months). Per row: what to do, expected monthly savings, risk level. Sorted by ROI.' },
          { icon: 'graph', title: 'Dependency map', body: 'In one project, a seemingly unused ALB was actually part of the email-delivery chain. Without log analysis, switching it off would have locked the company out of its own inbox. The map shows what is really connected, not what the tags claim.' },
          { icon: 'bolt',  title: 'Optional: implementation', body: 'If you want, I\'ll execute the measures too, day rate, with a rollback plan per item. You approve each action before it happens.' },
        ],
        processIntro: 'How it actually runs',
        process: [
          { title: 'Discovery call', body: '30-minute or 1-hour consultation, from €75. Workflow, feasibility, architecture. If you book a follow-up project, the call price is credited against it.' },
          { title: 'Access grant', body: 'You create a read-only IAM role. I can look, but I can\'t break anything. I send the example policy beforehand; NDA on request.' },
          { title: 'Audit', body: '3 to 5 business days. Cost Explorer, logs, right-sizing, storage lifecycle, zombie detection. Daily status if you want it, otherwise only at the end.' },
          { title: 'Handover', body: 'PDF report plus a one-hour call where I walk you through the roadmap. After that: either your team executes, or I take it on.' },
        ],
        pricingTitle: 'Fixed price, no timesheet',
        pricingBody1: '€3,500 covers a typical single-account audit. For large multi-account organisations the price adapts, but you know the figure before signing, not after.',
        pricingBody2: 'You pay for a defined deliverable, not for hours. If I\'m faster than expected, that\'s my risk and your certainty.',
        packageLabel: 'Audit package',
        packageSubtitle: 'Single-account setup, medium complexity.',
        includes: [
          'PDF report with before/after forecast',
          'Action list, quick wins, structural fixes, architecture, separated',
          'Dependency map from logs, the prerequisite for zero downtime',
          'Handover call (1 h) plus written documentation',
          'Read-only access throughout, NDA on request',
        ],
        referenceTitle: 'An actual story',
        referenceIntro: 'The process above isn\'t theory, it\'s what I ran for a client in early 2026.',
        referenceCard: {
          tags: ['Blender Networks Inc.', 'Advertising agency · Canada'],
          heading: '$3,850 → $1,330 per month, no outages',
          body: '8 zombie ALBs that were only attracting bot scans. A whole EKS cluster that nobody had seriously used in months. 1.4 TB of obsolete EBS snapshots. Plus: WordPress sites and MX records that stayed up the entire time, that was the condition.',
        },
        faqIntro: 'What you probably want to know',
        faq: [
          { q: 'What bill size makes an audit worthwhile?', a: 'From around $2,000 per month upwards, the audit almost always pays for itself within a month or two, assuming the setup isn\'t already optimised. Below that: happy to do a discovery call, but I might tell you honestly that the levers are too small to justify the work.' },
          { q: 'What access do you need exactly?', a: 'Cost Explorer, CloudWatch Logs and Metrics, plus describe/list on EC2, EKS, RDS, S3 and ALB. No write permissions. No access to S3 bucket contents or database contents. I send the policy before contract, you see exactly what you grant.' },
          { q: 'How long does it take?', a: 'Three to five business days after access is granted. Multi-account setups with Organizations take longer; I scope that in the discovery call.' },
          { q: 'Do you implement, or just audit?', a: 'Both, on request. Implementation runs on a day rate, step by step with a rollback plan per measure. Alternative: a handoff sprint where I guide your team and your people execute.' },
          { q: 'Fixed price or hourly?', a: 'The audit itself is fixed. For very large setups the figure adapts, but you know it before signing. A subsequent implementation runs on day rate.' },
          { q: 'What happens to our data?', a: 'It stays in your account. I access read-only, copy nothing out of S3 or RDS, work with cost metrics and logs. NDA on request, even before the discovery call.' },
        ],
        finalCtaTitle: 'Want a concrete number?',
        finalCtaBody: 'Send a short inquiry with your budget range, reply within 24 h, with a proposed time for the discovery call.',
      },
      ru: {
        title: 'Анализ и снижение расходов AWS',
        subtitle: 'Аудит, который не состоит из слайдов PowerPoint,, а из пронумерованного списка мер с конкретными цифрами по каждой позиции, который можно начать выполнять завтра. Фиксированная цена, прогноз «до/после» обоснованный, zero downtime при внедрении.',
        meta: 'Аудит счёта AWS по фиксированной цене с конкретным списком мер. Zero downtime при внедрении, обоснованный прогноз «до/после». От €3 500.',
        overviewSummary: 'Аудит счёта AWS по фиксированной цене. Список мер с быстрыми победами, структурными изменениями и архитектурными рефакторингами, отсортированный по ROI. Zero downtime при внедрении.',
        deliverIntro: 'Четыре результата. Никакого консультационного жаргона, никаких «вывести рекомендации». Вы получаете материал, с которым можете работать сразу.',
        outcomes: [
          { icon: 'doc',   title: 'Отчёт о расходах', body: 'PDF, в котором объяснена каждая строка счёта. Плюс: какие ресурсы реально работают, какие существуют только потому, что никто не решился их удалить, и какие на самом деле только притягивают бот-трафик.' },
          { icon: 'check', title: 'Список мер в трёх колонках', body: 'Быстрые победы (дни), структурные меры (недели), архитектура (месяцы). По каждой строке: что делать, какая ожидаемая ежемесячная экономия, какой риск. Отсортировано по ROI.' },
          { icon: 'graph', title: 'Карта зависимостей', body: 'В одном проекте, казалось бы неиспользуемый ALB на самом деле был частью цепочки доставки email. Без анализа логов отключение заблокировало бы компанию в её собственном почтовом ящике. Карта показывает, что реально связано,, а не что говорят теги.' },
          { icon: 'bolt',  title: 'Опционально: внедрение', body: 'Если хотите, я также внедрю меры, дневной тариф, с планом отката для каждой позиции. Вы одобряете каждое действие до его выполнения.' },
        ],
        processIntro: 'Как это работает на практике',
        process: [
          { title: 'Discovery-звонок', body: 'Консультация на 30 мин или 1 ч, от €75. Workflow, реализуемость, архитектура. Если бронируете последующий проект, цена звонка зачитывается в него.' },
          { title: 'Доступ', body: 'Вы создаёте read-only IAM-роль. Я могу смотреть, но ничего не могу сломать. Пример policy высылаю заранее; NDA по запросу.' },
          { title: 'Аудит', body: '3–5 рабочих дней. Cost Explorer, логи, right-sizing, lifecycle хранилища, zombie-detection. Ежедневный статус, если хотите,, иначе только в конце.' },
          { title: 'Передача', body: 'PDF-отчёт плюс часовой звонок, на котором я прохожу roadmap. После: либо ваша команда внедряет, либо я беру это на себя.' },
        ],
        pricingTitle: 'Фиксированная цена, без табеля',
        pricingBody1: '€3 500 покрывает типичный аудит на одном AWS-аккаунте. Для крупных multi-account-организаций цена адаптируется, но вы знаете цифру до подписания, а не после.',
        pricingBody2: 'Вы платите за определённый результат, а не за часы. Если я справляюсь быстрее, чем планировал,, это мой риск и ваша уверенность.',
        packageLabel: 'Аудит-пакет',
        packageSubtitle: 'Single-account, средняя сложность.',
        includes: [
          'PDF-отчёт с прогнозом «до/после»',
          'Список мер, быстрые победы, структурные меры, архитектура, раздельно',
          'Карта зависимостей из логов, основа zero-downtime',
          'Звонок-передача (1 ч) плюс письменная документация',
          'Read-only-доступ на всём протяжении, NDA по запросу',
        ],
        referenceTitle: 'Реальная история',
        referenceIntro: 'Процесс выше не теория, это то, как я работал с клиентом в начале 2026.',
        referenceCard: {
          tags: ['Blender Networks Inc.', 'Рекламное агентство · Канада'],
          heading: '$3 850 → $1 330 в месяц, без простоев',
          body: '8 zombie-ALB, которые притягивали только бот-сканы. Целый EKS-кластер, которым никто всерьёз не пользовался месяцами. 1,4 ТБ устаревших EBS-снэпшотов. Плюс: WordPress-сайты и MX-записи, которые работали без перерывов, это было условием.',
        },
        faqIntro: 'Что вы, вероятно, хотите узнать',
        faq: [
          { q: 'От какого размера счёта аудит окупается?', a: 'От примерно $2 000 в месяц и выше аудит почти всегда окупается за один-два месяца, если setup ещё не идеально оптимизирован. Ниже, приходите на discovery-звонок, но я могу честно сказать, что рычаги слишком малы для затрат.' },
          { q: 'Какие доступы нужны конкретно?', a: 'Cost Explorer, CloudWatch Logs и Metrics, плюс describe/list на EC2, EKS, RDS, S3 и ALB. Никаких прав записи. Никакого доступа к содержимому S3-бакетов или баз данных. Policy высылаю до подписания договора, вы видите, что именно даёте.' },
          { q: 'Сколько это занимает?', a: 'От трёх до пяти рабочих дней после предоставления доступа. Multi-account-setup с Organizations занимает больше; это я оцениваю на discovery-звонке.' },
          { q: 'Вы внедряете или только аудит?', a: 'По желанию, оба. Внедрение по дневному тарифу, шаг за шагом с планом отката для каждой меры. Альтернатива: handoff-спринт, где я сопровождаю вашу команду, а ваши люди выполняют.' },
          { q: 'Фиксированная цена или почасовая?', a: 'Сам аудит, фиксированный. Для очень крупных setup цифра адаптируется, но известна до подписания. Последующее внедрение, по дневному тарифу.' },
          { q: 'Что с нашими данными?', a: 'Всё остаётся в вашем аккаунте. Я читаю в режиме read-only, ничего не копирую из S3 или RDS, работаю с метриками расходов и логами. NDA по запросу, ещё до discovery-звонка.' },
        ],
        finalCtaTitle: 'Конкретная цифра?',
        finalCtaBody: 'Отправьте короткий запрос с диапазоном бюджета, ответ в течение 24 ч, с предложением времени для discovery-звонка.',
      },
    },
  },

  // ============================================================
  // Legacy Data Extraction & Migration
  // ============================================================
  {
    slug: 'legacy-data-migration',
    related: ['aws-cost-analysis', 'browser-automation'],
    urlSlugs: { de: 'legacy-datenmigration', en: 'legacy-data-migration', ru: 'legacy-data-migration' },
    inquirySlug: 'legacy-datenmigration',
    caseStudy: 'legacy-data-extraction',
    eyebrow: 'Migration',
    priceMin: 4500,
    priceFmt: { de: '4.500&nbsp;€', en: '€4,500', ru: '€4 500' },
    i18n: {
      de: {
        title: 'Legacy-Datenmigration & Reverse Engineering',
        subtitle: 'Eine alte Datenbank, ein passwortgeschütztes Format, ein verschwundener Hersteller, und Sie brauchen die Daten in einem System, das es zur Originalzeit noch nicht gab. Genau dafür.',
        meta: 'Extraktion und Migration aus alten oder undokumentierten Datenbanken in moderne Systeme. Strikte Regelvalidierung, Audit-Trail, einmalige Festpreis-Projektierung.',
        overviewSummary: 'Daten aus Legacy-Systemen (Access, alte ERP-Exporte, undokumentierte Schemas) in moderne Strukturen migrieren. Mit Regelvalidierung und vollständigem Audit-Trail.',
        deliverIntro: 'Drei Deliverables, die zusammen ein migrierbares, sauberes Ziel ergeben.',
        outcomes: [
          { icon: 'doc',   title: 'Schema-Doku des Quell-Systems', body: 'Welche Tabellen es gibt, welche Spalten was bedeuten, welche Felder leer sind aus Sicht des Originalentwicklers vs. tatsächlich leer. Plus: alle Annahmen explizit, keine versteckten Datenmodell-Tricks.' },
          { icon: 'check', title: 'Migration mit Regel-Validierung', body: 'Strict-Mode-Contract, z. B. „eine Komponente hat mindestens eine Maßangabe, sonst Migration abbrechen". Beim Legacy-DB-Projekt waren das 5 Regeln, zero violations. Sie definieren die Regeln, ich erzwinge sie.' },
          { icon: 'graph', title: 'Audit-Trail', body: 'Pro migriertem Datensatz: woher kommt er, welche Transformationen wurden angewendet, welche Ausgangsdaten verworfen. Reproduzierbar, weil ein Migrations-Lauf der Echtdaten oft nicht wiederholt werden kann.' },
        ],
        processIntro: 'Wie die Migration läuft',
        process: [
          { title: 'Reverse Engineering', body: 'Format-Analyse, Passwort-Recovery wenn möglich (legal, mit Ihrer Genehmigung), Schema-Mapping. Diese Phase ist die teuerste und die wichtigste.' },
          { title: 'Trockenlauf', body: 'Migration auf einer Kopie der Quelldaten. Sie sehen Sample-Output, prüfen Stichproben, geben Regel-Anpassungen mit.' },
          { title: 'Echtlauf', body: 'Im Wartungsfenster oder live, je nach System. Mit Rollback-Plan und Zwischenstand-Logs, falls etwas hängt.' },
          { title: 'Übergabe', body: 'Migration-Logs, Audit-Trail-Datei, Schema-Doku. Plus eine Stunde Live-Q&A für Ihr Team.' },
        ],
        pricingTitle: 'Pro Projekt, nicht pro Stunde',
        pricingBody1: '4.500 € ist der Einstieg für ein Projekt mittlerer Komplexität, z. B. eine Access-DB unter 5 GB, ein klares Zielschema, eine konsolidierte Regelliste.',
        pricingBody2: 'Bei großen Mehr-System-Migrationen oder ungewöhnlichen Dateiformaten skaliert der Preis. Aber: feste Zahl vor Vertrag, kein nachträgliches Aufrechnen.',
        packageLabel: 'Migrations-Projekt',
        packageSubtitle: 'Einstieg, ein Quellsystem, ein Zielsystem.',
        includes: [
          'Reverse Engineering & Schema-Doku',
          'Migration mit Strict-Mode-Regelvalidierung',
          'Audit-Trail (per-record) als CSV/JSON',
          'Trockenlauf zur Abnahme vor dem Echtlauf',
          'Q&A-Session (1 h) plus Migration-Logs',
        ],
        referenceTitle: 'Wie schwer es real ist',
        referenceIntro: 'Im Februar 2026 hat ein Kunde eine 1,2 GB große, passwortgeschützte Access-Datenbank überreicht, und gefragt, ob da überhaupt noch jemand rankommt.',
        referenceCard: {
          tags: ['NDA-Kunde', 'Baumaschinen-Handel'],
          heading: '1,47 Mio. Bauteile aus einer Black-Box',
          body: 'Eine Hersteller-Datenbank, deren Original-Hersteller weg war. Passwort-Recovery, Schema-Mapping, 82.076 DjVu-Zeichnungen zu JPG konvertiert, fünf Strict-Mode-Regeln, null Verletzungen. Vollständig auditierbar.',
        },
        faqIntro: 'Was vorher klar sein sollte',
        faq: [
          { q: 'Was, wenn der Quellformat-Hersteller weg ist?', a: 'Das ist der Standardfall, sonst würden Sie mich nicht brauchen. Reverse Engineering geht so weit wie nötig, manchmal mit binärem Parsing, manchmal mit Tools, die der Originalhersteller heimlich offen gelassen hat.' },
          { q: 'Können Sie passwortgeschützte Daten knacken?', a: 'Bei eigenen Datenbeständen, mit Ihrer schriftlichen Erlaubnis, ja, sofern technisch möglich. Bei fremden Daten oder ohne Erlaubnis: nein, niemals.' },
          { q: 'Was passiert, wenn Regeln verletzt werden?', a: 'Im Strict-Mode bricht die Migration ab, kein Halb-Stand im Ziel. Im Lenient-Mode wird der Datensatz markiert und in eine Quarantäne-Tabelle geschrieben. Sie entscheiden vor Vertragsbeginn.' },
          { q: 'Wie alt darf die Quelle sein?', a: 'Habe schon Daten aus Access 97, dBase IV und Foxpro migriert. Alter ist selten das Problem, schlechte oder fehlende Doku ist es.' },
          { q: 'Was, wenn der Echtlauf hängt?', a: 'Rollback-Plan vorher schriftlich. Zwischenstand-Logs ermöglichen Wiederaufnahme statt Komplett-Neustart. Bei Live-Migration: Pre-Cutover und Sync-Fenster.' },
          { q: 'Wie groß darf die Quelle sein?', a: 'Mehrere GB bis ein paar 100 GB ohne weiteres. Größer wird es zur Architektur-Frage: chunked-Verarbeitung, eventuell parallel.' },
        ],
        finalCtaTitle: 'Eine alte Datenbank, die niemand mehr versteht?',
        finalCtaBody: 'Schicken Sie eine kurze Beschreibung des Quellformats und der Zielstruktur, ich melde mich binnen 24 h mit Einschätzung und Termin-Vorschlag.',
      },
      en: {
        title: 'Legacy Data Migration & Reverse Engineering',
        subtitle: 'An old database, a password-protected format, a vanished vendor, and you need the data in a system that didn\'t exist when the source did. That\'s the use case.',
        meta: 'Extraction and migration from old or undocumented databases into modern systems. Strict rule validation, audit trail, one-off fixed-price project.',
        overviewSummary: 'Migrate data from legacy systems (Access, old ERP exports, undocumented schemas) into modern structures. With rule validation and a full audit trail.',
        deliverIntro: 'Three deliverables that together produce a clean, migratable target.',
        outcomes: [
          { icon: 'doc',   title: 'Schema documentation of the source', body: 'Which tables exist, what each column means, which fields are empty from the original developer\'s perspective vs. actually empty. Plus: every assumption explicit, no hidden data-model tricks.' },
          { icon: 'check', title: 'Migration with rule validation', body: 'Strict-mode contract, e.g. "every part has at least one dimension, otherwise abort". On the legacy-DB project that was 5 rules, zero violations. You define the rules, I enforce them.' },
          { icon: 'graph', title: 'Audit trail', body: 'Per migrated record: where it came from, which transformations were applied, which source rows were dropped. Reproducible, because a real-data migration run often can\'t be repeated.' },
        ],
        processIntro: 'How the migration runs',
        process: [
          { title: 'Reverse engineering', body: 'Format analysis, password recovery if possible (legal, with your authorisation), schema mapping. This phase is the most expensive and the most important.' },
          { title: 'Dry run', body: 'Migration on a copy of the source. You see sample output, spot-check, and feed in rule adjustments.' },
          { title: 'Real run', body: 'During a maintenance window or live, depending on the system. With a rollback plan and intermediate logs if something stalls.' },
          { title: 'Handover', body: 'Migration logs, audit-trail file, schema documentation. Plus a one-hour live Q&A for your team.' },
        ],
        pricingTitle: 'Per project, not per hour',
        pricingBody1: '€4,500 is the entry for a medium-complexity project, e.g. an Access DB under 5 GB, a clear target schema, a consolidated rule list.',
        pricingBody2: 'For large multi-system migrations or unusual file formats, the price scales. But: fixed figure before signing, no retroactive add-ons.',
        packageLabel: 'Migration project',
        packageSubtitle: 'Entry tier, one source system, one target.',
        includes: [
          'Reverse engineering & schema documentation',
          'Migration with strict-mode rule validation',
          'Audit trail (per record) as CSV/JSON',
          'Dry run for sign-off before the real run',
          'Q&A session (1 h) plus migration logs',
        ],
        referenceTitle: 'How hard it gets in reality',
        referenceIntro: 'In February 2026 a client handed me a 1.2 GB password-protected Access database, and asked whether anyone could even open it.',
        referenceCard: {
          tags: ['NDA client', 'Construction equipment trade'],
          heading: '1.47 million parts out of a black box',
          body: 'A manufacturer database whose original vendor was gone. Password recovery, schema mapping, 82,076 DjVu drawings converted to JPG, five strict-mode rules, zero violations. Fully auditable.',
        },
        faqIntro: 'What should be clear up front',
        faq: [
          { q: 'What if the source format vendor is gone?', a: 'That\'s the default case, otherwise you wouldn\'t need me. Reverse engineering goes as deep as needed, sometimes with binary parsing, sometimes with tools the original vendor left half-open.' },
          { q: 'Can you crack password-protected data?', a: 'On your own data, with your written permission, yes, when technically possible. On third-party data, or without permission: no, never.' },
          { q: 'What happens when rules are violated?', a: 'In strict mode the migration aborts, no half-state in the target. In lenient mode the record is flagged and written to a quarantine table. You decide before contract.' },
          { q: 'How old can the source be?', a: 'I\'ve migrated data from Access 97, dBase IV and Foxpro. Age is rarely the issue, bad or missing documentation is.' },
          { q: 'What if the real run stalls?', a: 'Rollback plan written down beforehand. Intermediate logs allow resumption rather than restart from zero. For live migration: pre-cutover and a sync window.' },
          { q: 'How large can the source be?', a: 'A few GB to a few 100 GB is no problem. Larger becomes an architecture question: chunked processing, possibly parallel.' },
        ],
        finalCtaTitle: 'An old database nobody understands anymore?',
        finalCtaBody: 'Send a short description of the source format and the target structure, I\'ll come back within 24 h with an estimate and a proposed call time.',
      },
      ru: {
        title: 'Миграция legacy-данных и реверс-инжиниринг',
        subtitle: 'Старая база данных, защищённый паролем формат, исчезнувший производитель, и вам нужны эти данные в системе, которой не было в эпоху исходника. Это и есть задача.',
        meta: 'Извлечение и миграция из старых или недокументированных баз данных в современные системы. Строгая валидация правил, audit trail, разовый проект с фиксированной ценой.',
        overviewSummary: 'Миграция данных из legacy-систем (Access, старые экспорты ERP, недокументированные схемы) в современные структуры. С валидацией правил и полным audit trail.',
        deliverIntro: 'Три результата, которые вместе дают чистую, мигрируемую цель.',
        outcomes: [
          { icon: 'doc',   title: 'Документация схемы источника', body: 'Какие таблицы существуют, что означает каждая колонка, какие поля пустые с точки зрения автора и какие пустые на самом деле. Плюс: все предположения явные, никаких скрытых трюков в модели данных.' },
          { icon: 'check', title: 'Миграция с валидацией правил', body: 'Strict-mode контракт, например, «у каждой детали есть хотя бы один размер, иначе abort». На legacy-DB-проекте было 5 правил, zero violations. Вы определяете правила, я их форсю.' },
          { icon: 'graph', title: 'Audit trail', body: 'По каждой записи: откуда пришла, какие трансформации применены, какие исходные строки отброшены. Воспроизводимо, потому что прогон по реальным данным часто нельзя повторить.' },
        ],
        processIntro: 'Как идёт миграция',
        process: [
          { title: 'Реверс-инжиниринг', body: 'Анализ формата, восстановление пароля если возможно (легально, с вашим разрешением), маппинг схемы. Эта фаза самая дорогая и самая важная.' },
          { title: 'Сухой прогон', body: 'Миграция на копии исходника. Вы видите sample output, проверяете точечно, передаёте правки правил.' },
          { title: 'Реальный прогон', body: 'В окно техобслуживания или live, зависит от системы. С планом отката и промежуточными логами, если где-то застрянет.' },
          { title: 'Передача', body: 'Логи миграции, файл audit trail, документация схемы. Плюс часовая live-Q&A для вашей команды.' },
        ],
        pricingTitle: 'За проект, не за час',
        pricingBody1: '€4 500, стартовая для проекта средней сложности, например, Access-БД до 5 ГБ, ясная целевая схема, консолидированный список правил.',
        pricingBody2: 'Для больших multi-system миграций или необычных форматов файлов цена масштабируется. Но: фиксированная цифра до подписания, никаких пост-фактум доначислений.',
        packageLabel: 'Миграционный проект',
        packageSubtitle: 'Стартовый уровень, один источник, одна цель.',
        includes: [
          'Реверс-инжиниринг и документация схемы',
          'Миграция с валидацией правил в strict mode',
          'Audit trail (по записи) в формате CSV/JSON',
          'Сухой прогон для приёма до реального запуска',
          'Q&A-сессия (1 ч) плюс логи миграции',
        ],
        referenceTitle: 'Насколько это бывает сложно',
        referenceIntro: 'В феврале 2026 клиент передал мне Access-базу 1,2 ГБ под паролем, и спросил, можно ли её вообще ещё открыть.',
        referenceCard: {
          tags: ['NDA-клиент', 'Торговля строительной техникой'],
          heading: '1,47 млн деталей из чёрного ящика',
          body: 'База производителя, которого больше нет. Восстановление пароля, маппинг схемы, 82 076 чертежей DjVu сконвертированы в JPG, пять strict-mode правил, ноль нарушений. Полностью аудируемо.',
        },
        faqIntro: 'Что стоит прояснить заранее',
        faq: [
          { q: 'Что, если производитель исходного формата исчез?', a: 'Это стандартный случай, иначе я был бы вам не нужен. Реверс-инжиниринг идёт настолько глубоко, насколько надо: иногда бинарный парсинг, иногда инструменты, которые оригинальный вендор оставил полу-открытыми.' },
          { q: 'Можете ли вы взломать пароль?', a: 'На ваших собственных данных, с вашим письменным разрешением, да, если технически возможно. На чужих данных или без разрешения, нет, никогда.' },
          { q: 'Что происходит при нарушении правил?', a: 'В strict mode миграция прерывается, никакого полусостояния в цели. В lenient mode запись помечается и пишется в карантинную таблицу. Вы решаете до подписания.' },
          { q: 'Насколько старым может быть источник?', a: 'Мигрировал данные из Access 97, dBase IV и Foxpro. Возраст редко проблема, отсутствие документации проблема.' },
          { q: 'А если реальный прогон зависнет?', a: 'План отката заранее в письменном виде. Промежуточные логи позволяют возобновить, а не начинать с нуля. Для live-миграции: pre-cutover и окно синхронизации.' },
          { q: 'Какого размера может быть источник?', a: 'Несколько ГБ до пары сотен ГБ без проблем. Больше, это уже архитектурный вопрос: chunked-обработка, возможно параллельно.' },
        ],
        finalCtaTitle: 'Старая база, которую никто больше не понимает?',
        finalCtaBody: 'Отправьте короткое описание исходного формата и целевой структуры, я отвечу в течение 24 ч с оценкой и предложением времени звонка.',
      },
    },
  },

  // ============================================================
  // Custom AI Desktop Apps
  // ============================================================
  {
    slug: 'custom-ai-app',
    related: ['browser-automation', 'discovery-call'],
    urlSlugs: { de: 'custom-ai-app', en: 'custom-ai-app', ru: 'custom-ai-app' },
    inquirySlug: 'custom-ai-app',
    caseStudy: 'book-lister-ai',
    eyebrow: 'Custom Apps',
    priceMin: 8500,
    priceFmt: { de: '8.500&nbsp;€', en: '€8,500', ru: '€8 500' },
    i18n: {
      de: {
        title: 'Custom AI Desktop App',
        subtitle: 'Eine Windows-App, in der jemand auf einen Knopf drückt, und ein Workflow läuft, der vorher fünf Tools, drei Anmeldungen und zehn Minuten Konzentration brauchte. AI-gestützt, lokal installiert, ohne Cloud-Lock-in.',
        meta: 'Maßgeschneiderte Desktop-Apps mit AI-Integration, Hardware-Anbindung (Kamera, Scanner), Bilderkennung, API-Pipelines. Festpreis-Projektierung.',
        overviewSummary: 'Maßgeschneiderte Windows-Apps mit AI-Backend, Hardware-Integration und API-Pipelines. Für Workflows, die kein SaaS-Tool abdeckt.',
        deliverIntro: 'Was Sie am Ende in der Hand haben, vier konkrete Deliverables.',
        outcomes: [
          { icon: 'doc',   title: 'Installierte App, lauffähig', body: 'Eine .exe-Datei mit allem inkludiert. Keine separate Python-Installation, keine PyPI-Abenteuer. Inkl. Auto-Update-Mechanismus auf Wunsch.' },
          { icon: 'check', title: 'AI-Integration, debounceable', body: 'Sei es Gemini, Claude, GPT oder ein lokales Modell, die App nutzt es als Werkzeug, nicht als Selbstzweck. Mit Caching, Fehlerbehandlung und sinnvollen Fallbacks, wenn das Modell mal nicht antwortet.' },
          { icon: 'graph', title: 'Hardware-Integration', body: 'Webcam-Kalibrierung mit ArUco-Markern, USB-Geräte, Drucker, Scanner, alles, was an einem Windows-Rechner hängt. Beim Book-Lister-Projekt: Webcam misst Buchdimensionen automatisch in unter einer Sekunde.' },
          { icon: 'bolt',  title: 'Tests + Dokumentation', body: '~250 pytest-Tests in der Book-Lister-Codebase, weil Hardware + AI + Live-APIs sonst schnell zu Voodoo werden. Plus Code-Doku für Sie oder Ihr Team, falls jemand später draufpacken muss.' },
        ],
        processIntro: 'Wie ein Custom-App-Projekt läuft',
        process: [
          { title: 'Discovery', body: 'Ich schaue mir den manuellen Workflow an, der ersetzt werden soll. Welche Schritte, wieviel Zeit, was geht schief. Daraus wird der Scope.' },
          { title: 'Prototype', body: 'Ein kleiner Vertical-Slice innerhalb von ein, zwei Wochen, der wichtigste Pfad, end-to-end. Sie testen, geben Feedback.' },
          { title: 'Build', body: 'Auf Basis des Prototypes wird die App fertig gebaut. Iterativ, mit Zwischen-Builds, die Sie testen können.' },
          { title: 'Übergabe', body: 'Installer + Source + Dokumentation. Plus eine Stunde Setup-Coaching für die Endnutzer.' },
        ],
        pricingTitle: 'Pro Projekt, mit Stufen',
        pricingBody1: '8.500 € ist der Einstieg für eine fokussierte App mit einem AI-Modell, einer Hardware-Komponente und einer API-Integration. Beim Book-Lister waren das Gemini Vision + Webcam + eBay APIs.',
        pricingBody2: 'Größere Apps mit mehreren Workflows, Multi-User-Architektur oder Cloud-Sync skalieren entsprechend. Festpreis kommt nach Discovery, Sie kennen die Zahl, bevor Sie unterschreiben.',
        packageLabel: 'Custom-App-Projekt',
        packageSubtitle: 'Ein Workflow, eine AI, eine Hardware-Komponente.',
        includes: [
          'Discovery + Scope-Definition',
          'Vertical-Slice-Prototype (2 Wochen)',
          'Vollständige App mit Installer (.exe)',
          'Pytest-Coverage für kritische Pfade',
          'Setup-Coaching (1 h) + Code-Doku',
        ],
        referenceTitle: 'Was so ein Projekt konkret bedeutet',
        referenceIntro: 'Anfang 2026 habe ich eine App für einen Antiquariats-Händler gebaut. Davor: 10 Minuten pro Buch, manuell. Nachher: 30 Sekunden.',
        referenceCard: {
          tags: ['Book Lister AI', 'Antiquariat'],
          heading: '30 Sekunden pro Buch statt 10 Minuten',
          body: 'ArUco-kalibrierte Webcam misst Buchabmessungen, Gemini 2.5 Vision liest Titel/Autor/Verlag, Google Books + eBay Browse API setzen den Preis, eBay Trading API stellt das Inserat ein. ~6.450 Zeilen Python, 260+ pytest-Tests. 400 % Durchsatz.',
        },
        faqIntro: 'Bevor Sie anfragen',
        faq: [
          { q: 'Cloud-AI oder lokales Modell?', a: 'Hängt vom Workflow ab. Für Vision-Tasks ist Cloud (Gemini 2.5 / Claude) heute meist besser. Für sensible Daten oder Offline-Anforderungen: lokale Modelle (Llama-basierend, Ollama). Wir entscheiden im Discovery.' },
          { q: 'Wer hostet die App?', a: 'Niemand, die App läuft lokal auf dem Windows-PC. Cloud-Komponente nur, wenn explizit gewünscht. Keine monatlichen Server-Kosten von mir.' },
          { q: 'Wer trägt API-Kosten?', a: 'Sie, weil die Keys auf Sie laufen. Beim Book-Lister waren es ~5 € pro Monat für Gemini + Google Books. Skaliert mit Volumen, aber meistens überschaubar.' },
          { q: 'Was, wenn AI mal halluziniert?', a: 'Genau die Frage, die in jedem Discovery früh kommt. Antwort: Pre-Validation auf der Datenseite (z. B. ISBN-Check gegen Google Books), Confidence-Scoring, und kritische Aktionen brauchen Bestätigung durch den User. AI als Vorschlag, nicht als Autopilot.' },
          { q: 'Was läuft bei einer App-Macke kaputt?', a: 'Crash-Handler schreibt einen Crash-File pro Vorfall, die App erinnert sich an den letzten guten Zustand. Beim Re-Open wird der unfertige Workflow wiederhergestellt, falls möglich. Datenverlust extrem unwahrscheinlich.' },
          { q: 'Kann ich die App selber weiterentwickeln?', a: 'Source kommt mit, plus Code-Doku. Wenn Sie oder Ihr Team Python können, ja. Sonst können wir auch ein Maintenance-Abo abschließen, monatlich kündbar.' },
        ],
        finalCtaTitle: 'Ein Workflow, der zu wertvoll ist um manuell zu bleiben?',
        finalCtaBody: 'Beschreiben Sie kurz den Workflow, den Sie automatisieren wollen, ich melde mich binnen 24 h mit Einschätzung und Termin-Vorschlag.',
      },
      en: {
        title: 'Custom AI Desktop App',
        subtitle: 'A Windows app where someone presses a button, and a workflow runs that used to take five tools, three logins and ten minutes of focus. AI-assisted, installed locally, no cloud lock-in.',
        meta: 'Bespoke desktop apps with AI integration, hardware connectivity (camera, scanner), vision, API pipelines. Fixed-price project.',
        overviewSummary: 'Bespoke Windows apps with AI backend, hardware integration and API pipelines. For workflows no SaaS tool covers.',
        deliverIntro: 'What you end up holding, four concrete deliverables.',
        outcomes: [
          { icon: 'doc',   title: 'Installed app, working', body: 'A single .exe with everything bundled. No separate Python install, no PyPI adventures. Optional auto-update mechanism.' },
          { icon: 'check', title: 'AI integration, debounceable', body: 'Whether Gemini, Claude, GPT or a local model, the app uses it as a tool, not as an end in itself. With caching, error handling, and sensible fallbacks if the model goes silent.' },
          { icon: 'graph', title: 'Hardware integration', body: 'Webcam calibration with ArUco markers, USB devices, printers, scanners, anything attached to a Windows machine. On the Book Lister project: webcam measures book dimensions automatically in under a second.' },
          { icon: 'bolt',  title: 'Tests + documentation', body: '~250 pytest tests in the Book Lister codebase, because hardware + AI + live APIs go voodoo fast otherwise. Plus code documentation for you or your team if someone later needs to extend it.' },
        ],
        processIntro: 'How a custom-app project runs',
        process: [
          { title: 'Discovery', body: 'I look at the manual workflow to be replaced. Which steps, how much time, what goes wrong. Out of that comes the scope.' },
          { title: 'Prototype', body: 'A small vertical slice within one or two weeks, the most important path, end to end. You test, give feedback.' },
          { title: 'Build', body: 'On top of the prototype the app gets built out. Iterative, with intermediate builds you can test.' },
          { title: 'Handover', body: 'Installer + source + documentation. Plus a one-hour setup coaching for the end users.' },
        ],
        pricingTitle: 'Per project, in tiers',
        pricingBody1: '€8,500 is the entry for a focused app with one AI model, one hardware component and one API integration. On the Book Lister it was Gemini Vision + webcam + eBay APIs.',
        pricingBody2: 'Larger apps with multiple workflows, multi-user architecture or cloud sync scale accordingly. The fixed figure comes after discovery, you know it before you sign.',
        packageLabel: 'Custom-app project',
        packageSubtitle: 'One workflow, one AI, one hardware component.',
        includes: [
          'Discovery + scope definition',
          'Vertical-slice prototype (2 weeks)',
          'Full app with installer (.exe)',
          'Pytest coverage for critical paths',
          'Setup coaching (1 h) + code docs',
        ],
        referenceTitle: 'What such a project looks like',
        referenceIntro: 'In early 2026 I built an app for a used-book seller. Before: 10 minutes per book, manually. After: 30 seconds.',
        referenceCard: {
          tags: ['Book Lister AI', 'Used-book trade'],
          heading: '30 seconds per book instead of 10 minutes',
          body: 'ArUco-calibrated webcam measures dimensions, Gemini 2.5 Vision reads title/author/publisher, Google Books + eBay Browse APIs set the price, eBay Trading API publishes the listing. ~6,450 lines of Python, 260+ pytest tests. 400 % throughput.',
        },
        faqIntro: 'Before you inquire',
        faq: [
          { q: 'Cloud AI or local model?', a: 'Depends on the workflow. For vision tasks, cloud (Gemini 2.5 / Claude) is usually better today. For sensitive data or offline requirements: local models (Llama-based, Ollama). We decide in discovery.' },
          { q: 'Who hosts the app?', a: 'Nobody, the app runs locally on the Windows PC. Cloud components only if explicitly wanted. No monthly server fees from me.' },
          { q: 'Who pays the API costs?', a: 'You, because the keys are on your account. On the Book Lister it was ~€5 per month for Gemini + Google Books. Scales with volume, but mostly manageable.' },
          { q: 'What if the AI hallucinates?', a: 'The question that comes up early in every discovery. Answer: pre-validation on the data side (e.g. ISBN check against Google Books), confidence scoring, and critical actions require user confirmation. AI as a suggestion, not as autopilot.' },
          { q: 'What breaks when the app glitches?', a: 'A crash handler writes a crash file per incident, the app remembers the last good state. On re-open the unfinished workflow is restored where possible. Data loss is extremely unlikely.' },
          { q: 'Can I extend the app myself?', a: 'Source comes with it, plus code docs. If you or your team know Python, yes. Otherwise we can also do a maintenance retainer, cancellable monthly.' },
        ],
        finalCtaTitle: 'A workflow that\'s too valuable to stay manual?',
        finalCtaBody: 'Briefly describe the workflow you want to automate, I\'ll be back within 24 h with an estimate and a proposed call time.',
      },
      ru: {
        title: 'Custom AI Desktop App',
        subtitle: 'Windows-приложение, где кто-то нажимает на кнопку, и запускается workflow, который раньше требовал пять инструментов, три логина и десять минут концентрации. С AI-помощником, установлено локально, без cloud lock-in.',
        meta: 'Заказные десктоп-приложения с AI-интеграцией, подключение оборудования (камера, сканер), распознавание, API-пайплайны. Проект с фиксированной ценой.',
        overviewSummary: 'Заказные Windows-приложения с AI-бэкендом, интеграцией оборудования и API-пайплайнами. Для workflow, которых нет в SaaS.',
        deliverIntro: 'Что у вас в итоге в руках, четыре конкретных результата.',
        outcomes: [
          { icon: 'doc',   title: 'Установленное рабочее приложение', body: 'Один .exe со всем внутри. Никакой отдельной установки Python, никаких приключений с PyPI. Опционально, механизм авто-обновления.' },
          { icon: 'check', title: 'AI-интеграция, отлаживаемая', body: 'Будь то Gemini, Claude, GPT или локальная модель, приложение использует AI как инструмент, а не как самоцель. С кэшированием, обработкой ошибок и разумными fallback, если модель молчит.' },
          { icon: 'graph', title: 'Интеграция оборудования', body: 'Калибровка веб-камеры с ArUco-маркерами, USB-устройства, принтеры, сканеры, всё, что подключено к Windows-машине. В Book-Lister-проекте: веб-камера автоматически измеряет габариты книги меньше чем за секунду.' },
          { icon: 'bolt',  title: 'Тесты + документация', body: '~250 pytest-тестов в Book-Lister-кодовой базе, потому что hardware + AI + live API быстро превращаются в вуду без них. Плюс документация кода для вас или команды, если кто-то будет расширять.' },
        ],
        processIntro: 'Как идёт custom-app-проект',
        process: [
          { title: 'Discovery', body: 'Смотрю на ручной workflow, который надо заменить. Какие шаги, сколько времени, где ломается. Из этого получается scope.' },
          { title: 'Прототип', body: 'Маленький вертикальный срез за одну-две недели, самый важный путь, end-to-end. Вы тестируете, даёте feedback.' },
          { title: 'Build', body: 'На основе прототипа собирается полное приложение. Итеративно, с промежуточными билдами, которые вы можете тестировать.' },
          { title: 'Передача', body: 'Installer + исходники + документация. Плюс часовой setup-coaching для конечных пользователей.' },
        ],
        pricingTitle: 'За проект, со ступенями',
        pricingBody1: '€8 500, стартовая для сфокусированного приложения с одной AI-моделью, одним устройством и одной API-интеграцией. В Book Lister это были Gemini Vision + веб-камера + eBay API.',
        pricingBody2: 'Большие приложения с несколькими workflow, multi-user-архитектурой или cloud-sync масштабируются соответственно. Фиксированная цифра после discovery, вы знаете её до подписания.',
        packageLabel: 'Custom-app-проект',
        packageSubtitle: 'Один workflow, одна AI, одна аппаратная компонента.',
        includes: [
          'Discovery + определение scope',
          'Vertical-slice прототип (2 недели)',
          'Полное приложение с installer (.exe)',
          'Pytest-покрытие критических путей',
          'Setup-coaching (1 ч) + документация кода',
        ],
        referenceTitle: 'Как такой проект выглядит конкретно',
        referenceIntro: 'В начале 2026 я сделал приложение для букиниста. До: 10 минут на книгу вручную. После: 30 секунд.',
        referenceCard: {
          tags: ['Book Lister AI', 'Букинистическая торговля'],
          heading: '30 секунд на книгу вместо 10 минут',
          body: 'Веб-камера с ArUco-калибровкой измеряет габариты, Gemini 2.5 Vision читает название/автора/издательство, Google Books + eBay Browse API ставят цену, eBay Trading API публикует листинг. ~6 450 строк Python, 260+ pytest-тестов. 400 % пропускной способности.',
        },
        faqIntro: 'Перед запросом',
        faq: [
          { q: 'Cloud-AI или локальная модель?', a: 'Зависит от workflow. Для vision-задач cloud (Gemini 2.5 / Claude) сегодня обычно лучше. Для чувствительных данных или offline-требований, локальные модели (на базе Llama, Ollama). Решаем в discovery.' },
          { q: 'Кто хостит приложение?', a: 'Никто, приложение работает локально на Windows-PC. Cloud-компонент только если явно нужен. Никаких ежемесячных серверных сборов от меня.' },
          { q: 'Кто платит за API?', a: 'Вы, потому что ключи на вашем аккаунте. В Book Lister это было ~€5 в месяц за Gemini + Google Books. Масштабируется с объёмом, но обычно умеренно.' },
          { q: 'А если AI галлюцинирует?', a: 'Вопрос, который рано приходит в каждом discovery. Ответ: предварительная валидация на стороне данных (например, ISBN-check через Google Books), confidence-scoring, критические действия требуют подтверждения пользователя. AI как предложение, не как автопилот.' },
          { q: 'Что ломается при глюке приложения?', a: 'Crash-handler пишет crash-файл по каждому инциденту, приложение помнит последнее хорошее состояние. При повторном открытии незавершённый workflow восстанавливается, если возможно. Потеря данных крайне маловероятна.' },
          { q: 'Могу ли я сам развивать приложение?', a: 'Исходники идут с приложением, плюс документация кода. Если вы или ваша команда знаете Python, да. Иначе можем заключить maintenance-retainer, расторгаемый ежемесячно.' },
        ],
        finalCtaTitle: 'Workflow, который слишком ценен, чтобы оставаться ручным?',
        finalCtaBody: 'Кратко опишите workflow, который хотите автоматизировать, я отвечу в течение 24 ч с оценкой и предложением времени звонка.',
      },
    },
  },

  // ============================================================
  // E-Commerce Feed Pipelines
  // ============================================================
  {
    slug: 'product-feed-pipelines',
    related: ['legacy-data-migration', 'browser-automation'],
    urlSlugs: { de: 'product-feed-pipelines', en: 'product-feed-pipelines', ru: 'product-feed-pipelines' },
    inquirySlug: 'product-feed-pipelines',
    caseStudy: 'microsoft-shopping-feed',
    eyebrow: 'E-Commerce',
    priceMin: 3500,
    priceFmt: { de: '3.500&nbsp;€', en: '€3,500', ru: '€3 500' },
    i18n: {
      de: {
        title: 'Product-Feed-Pipelines',
        subtitle: 'Affiliate-Feeds, Merchant-Center, XML-Schmerzen, alles automatisiert, alles compliance-konform, alles mit Monitoring. Damit Ihre Ad-Revenue nicht an einem fehlerhaften Upload um drei Uhr morgens stirbt.',
        meta: 'Automatisierte Product-Feed-Pipelines für Microsoft Merchant Center, Google Shopping, etc. Mit Monitoring, Validierung und Fehler-Recovery. Festpreis.',
        overviewSummary: 'Großvolumige Affiliate-Feeds (Connexity, Shopping24) automatisch ins Merchant Center synchronisieren. Mit Validierung, Monitoring und Fehler-Recovery.',
        deliverIntro: 'Drei Sachen, die zusammen das Daily-Ops-Risiko aus der Ad-Revenue rausnehmen.',
        outcomes: [
          { icon: 'doc',   title: 'Pipeline mit Spec-Compliance', body: 'XML/CSV/JSON-Quellen werden gegen die Ziel-Spec (z. B. Microsoft Merchant Center) gemappt. Inklusive der unschönen Edge Cases: leere Pflichtfelder, Encoding-Fragen, currency-Format. Wenn was nicht passt, weiß die Pipeline das vor dem Upload.' },
          { icon: 'check', title: 'Monitoring + Alerting', body: 'Pro Lauf: wie viele Produkte rein, wie viele raus, welche Fehler. Bei Auffälligkeiten geht eine Mail (oder Slack, oder Telegram) raus. Sie merken Probleme, bevor die Plattform Sie sperrt.' },
          { icon: 'bolt',  title: 'Recovery + Reprocessing', body: 'Wenn ein Run hängt: Wiederaufnahme statt Komplett-Neustart. Wenn ein Datensatz fehlerhaft ist: in eine Quarantäne, der Rest läuft durch. Kein Single-Point-of-Failure.' },
        ],
        processIntro: 'Wie eine Pipeline gebaut wird',
        process: [
          { title: 'Discovery', body: 'Welche Quellen, welches Ziel, welche Frequenz, welche bisherigen Schmerzpunkte. Aus dem letzten Punkt entsteht meistens die wichtigste Funktion.' },
          { title: 'Spec-Mapping', body: 'Quell-Felder werden gegen Ziel-Spec gemappt. Edge Cases werden dokumentiert. Sie sehen das Mapping schriftlich, bevor die Pipeline gebaut wird.' },
          { title: 'Build + Tests', body: 'Pipeline-Code mit Unit-Tests für die Mappings, Integration-Tests für End-to-End-Läufe. Erste Test-Uploads in eine Sandbox.' },
          { title: 'Deployment + Übergabe', body: 'Cron-Job oder Trigger-basiert, mit Monitoring-Anbindung. Source + Operations-Doku für Ihr Team.' },
        ],
        pricingTitle: 'Pro Pipeline, mit klarem Umfang',
        pricingBody1: '3.500 € ist der Einstieg für eine Pipeline: eine Quelle, ein Ziel, tägliche Frequenz, Standard-Spec.',
        pricingBody2: 'Mehrere Quellen, mehrere Ziele, oder ungewöhnliche Specs (z. B. Tax-Berechnung pro Region) skalieren entsprechend. Festpreis kommt nach Discovery, bevor Sie unterschreiben.',
        packageLabel: 'Pipeline-Paket',
        packageSubtitle: 'Eine Quelle, ein Ziel, tägliche Frequenz.',
        includes: [
          'Spec-Mapping schriftlich, vor dem Build',
          'Pipeline-Code mit Unit + Integration Tests',
          'Monitoring + Alerting (Mail/Slack/Telegram)',
          'Quarantäne + Recovery-Logik',
          'Operations-Doku + Übergabe-Call (1 h)',
        ],
        referenceTitle: 'Wie das in der Praxis aussieht',
        referenceIntro: 'Für eine Werbeagentur habe ich Anfang 2026 eine Pipeline gebaut, die täglich große Affiliate-Feeds ins Microsoft Merchant Center sync\'t.',
        referenceCard: {
          tags: ['Blender Networks Inc.', 'Werbeagentur · Kanada'],
          heading: 'Großvolumige Affiliate-Sync ohne Babysitting',
          body: 'Connexity, Shopping24 → Microsoft Merchant Center. XML/CSV parsen, gegen Spec mappen, in Chunks hochladen, Status monitoren. Compliant, fehlertolerant, mit Alerting wenn was schiefläuft. Ad-Revenue läuft ohne tägliches manuelles Eingreifen.',
        },
        faqIntro: 'Was vor Vertragsbeginn klar sein sollte',
        faq: [
          { q: 'Welche Quellformate verarbeiten Sie?', a: 'XML, CSV, JSON, Excel, REST APIs, FTP/SFTP-Drops. Edge Cases wie BOMs, ungewöhnliche Encodings oder Bondage-CSVs (z. B. Tabs als Trenner und Kommata in Feldern) gehören dazu.' },
          { q: 'Welche Zielsysteme kennen Sie?', a: 'Microsoft Merchant Center, Google Shopping, Meta Catalog, generische REST/GraphQL. Bei einem unbekannten Ziel braucht es vorher 1-2 Tage Schema-Analyse, die rechne ich transparent ab.' },
          { q: 'Wo läuft die Pipeline?', a: 'Klein: lokaler Cron-Server oder Ihre Infrastruktur. Größer: AWS Lambda, ECS oder ähnliches. Ich richte das ein, oder Ihr Ops-Team. Wir entscheiden im Discovery.' },
          { q: 'Was, wenn die Quell-API kaputtgeht?', a: 'Retry mit Exponential-Backoff, dann Alert. Der letzte erfolgreiche Stand bleibt im Ziel, keine Daten gelöscht. Sie merken den Ausfall, bevor er sichtbare Effekte hat.' },
          { q: 'Können Sie auch bestehende Pipelines verbessern?', a: 'Ja. Audit der bestehenden Pipeline, Identifikation der Schmerzpunkte, gezielte Reparatur oder Replatforming. Tagessatz-basiert oder Festpreis, je nach Umfang.' },
          { q: 'DSGVO-Compliance?', a: 'Affiliate-Produktdaten sind in der Regel nicht personenbezogen. Wenn doch, z. B. bei User-generated Reviews, wird das im Discovery geprüft und ggf. mit anonymisierung gelöst.' },
        ],
        finalCtaTitle: 'Eine Pipeline, die zu viel Babysitting braucht?',
        finalCtaBody: 'Beschreiben Sie kurz Quelle, Ziel und Frequenz, ich melde mich binnen 24 h mit Einschätzung.',
      },
      en: {
        title: 'Product Feed Pipelines',
        subtitle: 'Affiliate feeds, merchant centres, XML pain, all automated, all compliant, all monitored. So your ad revenue doesn\'t die at 3 AM because of a malformed upload.',
        meta: 'Automated product-feed pipelines for Microsoft Merchant Center, Google Shopping, etc. With monitoring, validation and error recovery. Fixed price.',
        overviewSummary: 'Sync large affiliate feeds (Connexity, Shopping24) automatically into Merchant Centers. With validation, monitoring and error recovery.',
        deliverIntro: 'Three things that together take the daily-ops risk out of your ad revenue.',
        outcomes: [
          { icon: 'doc',   title: 'Pipeline with spec compliance', body: 'XML/CSV/JSON sources get mapped against the target spec (e.g. Microsoft Merchant Center). Including the ugly edge cases: empty mandatory fields, encoding issues, currency format. If something doesn\'t fit, the pipeline knows before the upload.' },
          { icon: 'check', title: 'Monitoring + alerting', body: 'Per run: how many products in, how many out, what errors. On anomalies a mail (or Slack, or Telegram) goes out. You notice issues before the platform suspends you.' },
          { icon: 'bolt',  title: 'Recovery + reprocessing', body: 'If a run stalls: resume, don\'t restart. If a record is malformed: quarantine it, the rest flows through. No single point of failure.' },
        ],
        processIntro: 'How a pipeline gets built',
        process: [
          { title: 'Discovery', body: 'Which sources, which target, which frequency, what hurts today. The last bit usually defines the most important feature.' },
          { title: 'Spec mapping', body: 'Source fields mapped against target spec. Edge cases documented. You see the mapping in writing before the pipeline gets built.' },
          { title: 'Build + tests', body: 'Pipeline code with unit tests for the mappings, integration tests for end-to-end runs. First test uploads go to a sandbox.' },
          { title: 'Deployment + handover', body: 'Cron or trigger-based, with monitoring hookup. Source + operations docs for your team.' },
        ],
        pricingTitle: 'Per pipeline, with a clear scope',
        pricingBody1: '€3,500 is the entry for a pipeline: one source, one target, daily frequency, standard spec.',
        pricingBody2: 'Multiple sources, multiple targets, or unusual specs (e.g. per-region tax) scale accordingly. Fixed figure comes after discovery, before you sign.',
        packageLabel: 'Pipeline package',
        packageSubtitle: 'One source, one target, daily frequency.',
        includes: [
          'Spec mapping in writing before the build',
          'Pipeline code with unit + integration tests',
          'Monitoring + alerting (mail/Slack/Telegram)',
          'Quarantine + recovery logic',
          'Operations docs + handover call (1 h)',
        ],
        referenceTitle: 'What this looks like in practice',
        referenceIntro: 'For an advertising agency in early 2026 I built a pipeline that syncs large affiliate feeds into Microsoft Merchant Center daily.',
        referenceCard: {
          tags: ['Blender Networks Inc.', 'Advertising agency · Canada'],
          heading: 'High-volume affiliate sync without babysitting',
          body: 'Connexity, Shopping24 → Microsoft Merchant Center. Parse XML/CSV, map against spec, chunked upload, monitor status. Compliant, fault-tolerant, with alerting when something breaks. Ad revenue runs without daily manual intervention.',
        },
        faqIntro: 'What should be clear before signing',
        faq: [
          { q: 'Which source formats do you process?', a: 'XML, CSV, JSON, Excel, REST APIs, FTP/SFTP drops. Edge cases like BOMs, unusual encodings or weird CSVs (e.g. tabs as separators and commas inside fields) are included.' },
          { q: 'Which target systems do you know?', a: 'Microsoft Merchant Center, Google Shopping, Meta Catalog, generic REST/GraphQL. For an unknown target I need 1-2 days of schema analysis up front, billed transparently.' },
          { q: 'Where does the pipeline run?', a: 'Small: local cron server or your infrastructure. Larger: AWS Lambda, ECS or similar. I set it up, or your ops team. We decide in discovery.' },
          { q: 'What if the source API breaks?', a: 'Retry with exponential backoff, then alert. The last successful state stays in the target, no data deleted. You catch the outage before it has visible effects.' },
          { q: 'Can you improve existing pipelines?', a: 'Yes. Audit the existing pipeline, identify pain points, targeted repair or replatform. Day rate or fixed price, depending on scope.' },
          { q: 'GDPR compliance?', a: 'Affiliate product data is usually not personal. If it is, e.g. user-generated reviews, we check in discovery and resolve with anonymisation if needed.' },
        ],
        finalCtaTitle: 'A pipeline that needs too much babysitting?',
        finalCtaBody: 'Briefly describe source, target and frequency, I\'ll come back within 24 h with an estimate.',
      },
      ru: {
        title: 'Pipeline для product-feed',
        subtitle: 'Affiliate-feed, merchant-центры, XML-боль, всё автоматизировано, всё соответствует спецификации, всё мониторится. Чтобы ваша ad-revenue не умерла в 3 утра из-за кривого upload.',
        meta: 'Автоматизированные pipeline для product-feed в Microsoft Merchant Center, Google Shopping и т. д. С мониторингом, валидацией и восстановлением. Фиксированная цена.',
        overviewSummary: 'Автоматическая синхронизация крупных affiliate-feed (Connexity, Shopping24) в Merchant Center. С валидацией, мониторингом и восстановлением после ошибок.',
        deliverIntro: 'Три вещи, которые вместе убирают daily-ops риск из вашей ad-revenue.',
        outcomes: [
          { icon: 'doc',   title: 'Pipeline с соответствием спецификации', body: 'XML/CSV/JSON-источники мапятся в целевую спеку (например, Microsoft Merchant Center). Включая некрасивые edge case: пустые обязательные поля, encoding-вопросы, формат валюты. Если что-то не подходит, pipeline знает это до загрузки.' },
          { icon: 'check', title: 'Мониторинг + алерты', body: 'По каждому запуску: сколько продуктов на входе, сколько на выходе, какие ошибки. На аномалии уходит письмо (или Slack, или Telegram). Вы замечаете проблемы до того, как платформа вас забанит.' },
          { icon: 'bolt',  title: 'Восстановление + перезапуск', body: 'Если запуск завис: возобновляется, а не перезапускается с нуля. Если запись битая: уходит в карантин, остальное идёт дальше. Никаких single-point-of-failure.' },
        ],
        processIntro: 'Как pipeline собирается',
        process: [
          { title: 'Discovery', body: 'Какие источники, какая цель, какая частота, что болит сегодня. Из последнего обычно рождается самая важная функция.' },
          { title: 'Маппинг спецификации', body: 'Исходные поля мапятся в целевую спецификацию. Edge case документируются. Вы видите маппинг письменно до сборки pipeline.' },
          { title: 'Build + тесты', body: 'Pipeline-код с unit-тестами на маппинги, integration-тестами на end-to-end. Первые тестовые загрузки в sandbox.' },
          { title: 'Deploy + передача', body: 'Cron или триггер-based, с подключённым мониторингом. Исходники + operations-doc для вашей команды.' },
        ],
        pricingTitle: 'За pipeline, с ясным scope',
        pricingBody1: '€3 500, стартовая для pipeline: один источник, одна цель, ежедневная частота, стандартная спецификация.',
        pricingBody2: 'Несколько источников, несколько целей или нестандартные спеки (например, расчёт налога по регионам) масштабируются соответственно. Фиксированная цифра после discovery, до подписания.',
        packageLabel: 'Pipeline-пакет',
        packageSubtitle: 'Один источник, одна цель, ежедневная частота.',
        includes: [
          'Маппинг спецификации письменно до build',
          'Pipeline-код с unit + integration тестами',
          'Мониторинг + алерты (mail/Slack/Telegram)',
          'Карантин + recovery-логика',
          'Operations-doc + звонок-передача (1 ч)',
        ],
        referenceTitle: 'Как это выглядит на практике',
        referenceIntro: 'Для рекламного агентства в начале 2026 я построил pipeline, ежедневно синхронизирующий крупные affiliate-feed в Microsoft Merchant Center.',
        referenceCard: {
          tags: ['Blender Networks Inc.', 'Рекламное агентство · Канада'],
          heading: 'Большой affiliate-sync без babysitting',
          body: 'Connexity, Shopping24 → Microsoft Merchant Center. Парсинг XML/CSV, маппинг по спеке, chunked-загрузка, мониторинг статуса. Compliant, fault-tolerant, с алертами когда что-то ломается. Ad-revenue работает без ежедневного ручного вмешательства.',
        },
        faqIntro: 'Что стоит прояснить до подписания',
        faq: [
          { q: 'Какие исходные форматы вы обрабатываете?', a: 'XML, CSV, JSON, Excel, REST API, FTP/SFTP drops. Edge case вроде BOM, необычных encodings или странных CSV (например, tabs как разделители и запятые в полях), в комплекте.' },
          { q: 'Какие целевые системы вы знаете?', a: 'Microsoft Merchant Center, Google Shopping, Meta Catalog, generic REST/GraphQL. Для неизвестной цели заранее нужны 1-2 дня анализа схемы, биллится прозрачно.' },
          { q: 'Где работает pipeline?', a: 'Маленький: локальный cron-сервер или ваша инфраструктура. Больший: AWS Lambda, ECS или похожее. Я настраиваю, либо ваша ops-команда. Решаем в discovery.' },
          { q: 'А если исходный API ломается?', a: 'Retry с exponential backoff, потом alert. Последнее успешное состояние остаётся в цели, никакие данные не удаляются. Вы замечаете сбой до того, как у него появятся видимые эффекты.' },
          { q: 'Можете улучшить существующие pipeline?', a: 'Да. Audit существующего pipeline, идентификация болевых точек, целевой ремонт или replatform. Дневной тариф или фиксированная цена, в зависимости от scope.' },
          { q: 'GDPR-compliance?', a: 'Affiliate-product-данные обычно не персональные. Если да, например, отзывы пользователей, проверяем в discovery и решаем анонимизацией если надо.' },
        ],
        finalCtaTitle: 'Pipeline, который требует слишком много babysitting?',
        finalCtaBody: 'Кратко опишите источник, цель и частоту, отвечу в течение 24 ч с оценкой.',
      },
    },
  },

  // ============================================================
  // Browser Automation Framework
  // ============================================================
  {
    slug: 'browser-automation',
    related: ['custom-ai-app', 'product-feed-pipelines'],
    urlSlugs: { de: 'browser-automation', en: 'browser-automation', ru: 'browser-automation' },
    inquirySlug: 'browser-automation',
    caseStudy: 'browser-automation-framework',
    eyebrow: 'Automation',
    priceMin: 6500,
    priceFmt: { de: '6.500&nbsp;€', en: '€6,500', ru: '€6 500' },
    i18n: {
      de: {
        title: 'Browser-Automation auf Production-Niveau',
        subtitle: 'Wenn Playwright-Skripte zu Production-Workflows werden, fängt der ganze Spaß erst an: Parallelisierung, Crash-Recovery, Auth-Handhabung, Multi-Worker-Locking. Genau dafür ist diese Leistung.',
        meta: 'Browser-Automation-Frameworks für Production-Workloads, Multi-Worker, Crash-Recovery, IPC, fault-tolerant. Festpreis-Projekt.',
        overviewSummary: 'Browser-Automation, die parallel, fehlertolerant und ohne tägliches Babysitting läuft. Multi-Worker mit IPC, Crash-Recovery, CDP-basierte Auth.',
        deliverIntro: 'Vier Bausteine, die einen Skript-Hack in ein Production-System verwandeln.',
        outcomes: [
          { icon: 'doc',   title: 'Multi-Worker-Architektur', body: 'Drei entkoppelte Schichten: UI (Streamlit), Orchestrator (Scheduler + CLI), Worker-Subprozesse. Race-safe via asyncio.Lock-Round-Robin. Mehrere Workflows laufen gleichzeitig, ohne sich gegenseitig zu killen.' },
          { icon: 'check', title: 'Crash-Recovery', body: 'sys.excepthook als letzte Verteidigungslinie. Crash-File-Bridge zwischen Subprozessen, kein Crash geht verloren, selbst wenn ein Worker im Init-Phase stirbt. Sie kriegen einen Bericht, kein stilles Sterben.' },
          { icon: 'graph', title: 'Auth ohne Manifest V2', body: 'CDP-basierte Authentication via Fetch.authRequired. Kein Chrome-Extension-Hack, der mit jedem Update bricht. Funktioniert mit Basic Auth, Form Auth, Token-Refresh-Flows.' },
          { icon: 'bolt',  title: 'CI + Tests', body: '9 pytest-Test-Suites, GitHub Actions auf jeden Push. Multi-Worker-Coordination ist notorisch schwer zu testen, hier ist es trotzdem gemacht.' },
        ],
        processIntro: 'Wie das Framework auf Ihren Use Case angepasst wird',
        process: [
          { title: 'Discovery', body: 'Welche Workflows, welche Auth-Schemata, welche Parallelisierung gebraucht. Welche bisherigen Schmerzpunkte. Daraus wird der Scope.' },
          { title: 'Worker-Anpassung', body: 'Die Worker-Subprozesse werden auf Ihre Workflows abgestimmt. Selectors, Wartezeiten, Retry-Logik, Phase-Definitionen.' },
          { title: 'Integration + Tests', body: 'In Ihre Infrastruktur (Windows-Server, Docker, Kubernetes, je nachdem) integriert. Tests für die wichtigsten Pfade.' },
          { title: 'Übergabe', body: 'Source-Code mit Doku, CI-Konfig, Operations-Handbuch. Plus zwei Stunden Live-Coaching für Ihr Ops-Team.' },
        ],
        pricingTitle: 'Adaption auf Ihren Use Case',
        pricingBody1: '6.500 € ist der Einstieg für eine Anpassung mit einem Workflow-Typ, ein bis drei Worker-Subprozessen, einem Auth-Schema.',
        pricingBody2: 'Komplexere Setups (mehrere Workflow-Typen, Browser-Profile mit Cookies, IP-Rotation, CAPTCHA-Handling) skalieren entsprechend. Festpreis nach Discovery.',
        packageLabel: 'Framework-Adaption',
        packageSubtitle: 'Ein Workflow, 1–3 Worker, ein Auth-Schema.',
        includes: [
          'Anpassung der Worker-Logik auf Ihre Workflows',
          'Integration in Ihre Infrastruktur',
          'Test-Coverage für die Hauptpfade',
          'CI-Konfig (GitHub Actions oder vergleichbar)',
          'Operations-Handbuch + Coaching (2 h)',
        ],
        referenceTitle: 'Was im Framework alles drinsteckt',
        referenceIntro: 'Das ist kein „könnte man bauen", der Framework existiert mit ~17.500 Zeilen Python für einen Privatkunden.',
        referenceCard: {
          tags: ['NDA-Kunde', 'Privat'],
          heading: '17.461 LOC, parallel, fehlertolerant',
          body: 'Streamlit-UI, Scheduler+CLI-Orchestrator, Worker-Subprozesse. SQLite mit WAL + BEGIN IMMEDIATE für cross-layer IPC. CDP-basierte Auth ohne Manifest V2. Windows Job Object cleanup. 9 pytest-Test-Suites, GitHub Actions CI auf jeden Push.',
        },
        faqIntro: 'Was Sie über Browser-Automation auf Production-Niveau wissen sollten',
        faq: [
          { q: 'Warum nicht einfach Selenium oder Puppeteer?', a: 'Für simple Skripte: Playwright reicht. Für Production-Workloads brauchen Sie Multi-Worker-Coordination, Crash-Recovery und Auth-Handling, die sind in keinem Library standardmäßig drin und kosten 80 % des Aufwands.' },
          { q: 'Läuft das auf Linux/Docker?', a: 'Aktuell Windows-zentriert (Job Objects), kann auf Linux/Docker portiert werden, das ist Teil der Adaption.' },
          { q: 'Was, wenn die Ziel-Website CAPTCHA hat?', a: 'CAPTCHA-Handling ist juristisch und technisch ein eigenes Thema. Wenn die Website Sie nicht will, ist das ihr Recht. Wir besprechen im Discovery, was legal und sinnvoll ist.' },
          { q: 'Können mehrere Workflows parallel laufen?', a: 'Genau dafür ist der Framework gebaut. Asyncio.Lock-Round-Robin zwischen Workern, deduplizierte Exception-Hierarchie, IPC via SQLite (WAL).' },
          { q: 'Wer trägt Browser-Profile-Daten?', a: 'Alles bei Ihnen, lokal oder in Ihrer Infrastruktur. Ich greife nicht zu nach Übergabe, falls nicht explizit Maintenance-Vereinbarung getroffen.' },
          { q: 'Wie aktuell bleibt das Framework bei Browser-Updates?', a: 'Maintenance-Retainer (optional) kümmert sich um Playwright-Updates, Chrome-Updates und CDP-Veränderungen. Ohne Retainer: ich repariere auf Tagessatz, wenn was bricht.' },
        ],
        finalCtaTitle: 'Browser-Workflows, die täglich Babysitting brauchen?',
        finalCtaBody: 'Beschreiben Sie kurz Use Case und aktuelles Setup, ich melde mich binnen 24 h mit Einschätzung.',
      },
      en: {
        title: 'Browser automation at production level',
        subtitle: 'When Playwright scripts become production workflows, the fun starts: parallelisation, crash recovery, auth handling, multi-worker locking. That\'s what this service is for.',
        meta: 'Browser-automation frameworks for production workloads, multi-worker, crash recovery, IPC, fault-tolerant. Fixed-price project.',
        overviewSummary: 'Browser automation that runs in parallel, fault-tolerant, without daily babysitting. Multi-worker with IPC, crash recovery, CDP-based auth.',
        deliverIntro: 'Four building blocks that turn a script hack into a production system.',
        outcomes: [
          { icon: 'doc',   title: 'Multi-worker architecture', body: 'Three decoupled layers: UI (Streamlit), orchestrator (scheduler + CLI), worker subprocesses. Race-safe via asyncio.Lock round-robin. Multiple workflows run at once without killing each other.' },
          { icon: 'check', title: 'Crash recovery', body: 'sys.excepthook as last line of defence. Crash-file bridge between subprocesses, no crash gets lost, even when a worker dies in init. You get a report, not silent death.' },
          { icon: 'graph', title: 'Auth without Manifest V2', body: 'CDP-based authentication via Fetch.authRequired. No Chrome-extension hack that breaks on every update. Works with basic auth, form auth, token refresh flows.' },
          { icon: 'bolt',  title: 'CI + tests', body: '9 pytest test suites, GitHub Actions on every push. Multi-worker coordination is notoriously hard to test, it\'s done here anyway.' },
        ],
        processIntro: 'How the framework gets adapted to your use case',
        process: [
          { title: 'Discovery', body: 'Which workflows, which auth schemas, how much parallelisation. What hurts today. Out of that comes the scope.' },
          { title: 'Worker adaptation', body: 'The worker subprocesses get tuned to your workflows. Selectors, wait times, retry logic, phase definitions.' },
          { title: 'Integration + tests', body: 'Integrated into your infrastructure (Windows server, Docker, Kubernetes, whichever). Tests for the main paths.' },
          { title: 'Handover', body: 'Source with documentation, CI config, operations manual. Plus two hours of live coaching for your ops team.' },
        ],
        pricingTitle: 'Adaptation to your use case',
        pricingBody1: '€6,500 is the entry for an adaptation with one workflow type, 1–3 worker subprocesses, one auth schema.',
        pricingBody2: 'More complex setups (multiple workflow types, browser profiles with cookies, IP rotation, CAPTCHA handling) scale accordingly. Fixed price after discovery.',
        packageLabel: 'Framework adaptation',
        packageSubtitle: 'One workflow, 1–3 workers, one auth schema.',
        includes: [
          'Worker logic adapted to your workflows',
          'Integration into your infrastructure',
          'Test coverage for the main paths',
          'CI config (GitHub Actions or equivalent)',
          'Operations manual + coaching (2 h)',
        ],
        referenceTitle: 'What\'s inside the framework',
        referenceIntro: 'This isn\'t a "could-build", the framework exists with ~17,500 lines of Python for a private client.',
        referenceCard: {
          tags: ['NDA client', 'Private'],
          heading: '17,461 LOC, parallel, fault-tolerant',
          body: 'Streamlit UI, scheduler+CLI orchestrator, worker subprocesses. SQLite with WAL + BEGIN IMMEDIATE for cross-layer IPC. CDP-based auth without Manifest V2. Windows Job Object cleanup. 9 pytest test suites, GitHub Actions CI on every push.',
        },
        faqIntro: 'What you should know about production-level browser automation',
        faq: [
          { q: 'Why not just Selenium or Puppeteer?', a: 'For simple scripts, Playwright is enough. For production workloads you need multi-worker coordination, crash recovery and auth handling, none of which are in any library by default and which cost 80 % of the effort.' },
          { q: 'Does it run on Linux/Docker?', a: 'Currently Windows-centric (Job Objects), can be ported to Linux/Docker, that\'s part of the adaptation.' },
          { q: 'What if the target site has CAPTCHA?', a: 'CAPTCHA handling is its own legal and technical topic. If the site doesn\'t want you, that\'s their right. We discuss what\'s legal and sensible in discovery.' },
          { q: 'Can multiple workflows run in parallel?', a: 'That\'s exactly what the framework is for. asyncio.Lock round-robin between workers, deduplicated exception hierarchy, IPC via SQLite (WAL).' },
          { q: 'Who holds the browser-profile data?', a: 'Everything stays with you, locally or in your infrastructure. I don\'t touch it after handover unless a maintenance agreement is in place.' },
          { q: 'How does the framework stay current with browser updates?', a: 'Optional maintenance retainer covers Playwright updates, Chrome updates, CDP changes. Without retainer: I fix on day rate when something breaks.' },
        ],
        finalCtaTitle: 'Browser workflows that need daily babysitting?',
        finalCtaBody: 'Briefly describe use case and current setup, I\'ll come back within 24 h with an estimate.',
      },
      ru: {
        title: 'Browser-automation на production-уровне',
        subtitle: 'Когда Playwright-скрипты становятся production-workflow, начинается всё веселье: распараллеливание, crash recovery, обработка auth, multi-worker locking. Именно для этого услуга.',
        meta: 'Browser-automation фреймворки для production-нагрузок, multi-worker, crash recovery, IPC, fault-tolerant. Проект с фиксированной ценой.',
        overviewSummary: 'Browser-automation, работающий параллельно, fault-tolerant, без ежедневного babysitting. Multi-worker с IPC, crash recovery, CDP-based auth.',
        deliverIntro: 'Четыре кирпича, которые превращают скрипт-хак в production-систему.',
        outcomes: [
          { icon: 'doc',   title: 'Multi-worker архитектура', body: 'Три развязанных слоя: UI (Streamlit), оркестратор (scheduler + CLI), worker-подпроцессы. Race-safe через asyncio.Lock round-robin. Несколько workflow работают одновременно, не убивая друг друга.' },
          { icon: 'check', title: 'Crash recovery', body: 'sys.excepthook как последняя линия защиты. Crash-file-мост между подпроцессами, ни один crash не теряется, даже если worker умирает в init. Вы получаете отчёт, а не тихую смерть.' },
          { icon: 'graph', title: 'Auth без Manifest V2', body: 'CDP-based аутентификация через Fetch.authRequired. Никаких Chrome-extension хаков, которые ломаются на каждом обновлении. Работает с basic auth, form auth, token refresh потоками.' },
          { icon: 'bolt',  title: 'CI + тесты', body: '9 pytest-наборов, GitHub Actions на каждый push. Multi-worker-координацию тестировать notorisch тяжело, здесь это всё равно сделано.' },
        ],
        processIntro: 'Как фреймворк адаптируется под ваш use case',
        process: [
          { title: 'Discovery', body: 'Какие workflow, какие auth-схемы, сколько параллелизма. Что болит сегодня. Из этого получается scope.' },
          { title: 'Адаптация worker', body: 'Worker-подпроцессы настраиваются под ваши workflow. Selectors, время ожидания, retry-логика, определения фаз.' },
          { title: 'Интеграция + тесты', body: 'Интегрировано в вашу инфраструктуру (Windows-сервер, Docker, Kubernetes, что нужно). Тесты для основных путей.' },
          { title: 'Передача', body: 'Исходники с документацией, CI-конфиг, operations-manual. Плюс два часа live-coaching для вашей ops-команды.' },
        ],
        pricingTitle: 'Адаптация под ваш use case',
        pricingBody1: '€6 500, стартовая для адаптации с одним типом workflow, 1–3 worker-подпроцессами, одной auth-схемой.',
        pricingBody2: 'Более сложные setup (несколько типов workflow, browser-профили с cookies, IP-ротация, CAPTCHA-handling) масштабируются. Фиксированная цена после discovery.',
        packageLabel: 'Адаптация фреймворка',
        packageSubtitle: 'Один workflow, 1–3 worker, одна auth-схема.',
        includes: [
          'Логика worker адаптирована под ваши workflow',
          'Интеграция в вашу инфраструктуру',
          'Test-покрытие основных путей',
          'CI-конфиг (GitHub Actions или эквивалент)',
          'Operations-manual + coaching (2 ч)',
        ],
        referenceTitle: 'Что внутри фреймворка',
        referenceIntro: 'Это не «могло бы быть», фреймворк существует, ~17 500 строк Python, для частного клиента.',
        referenceCard: {
          tags: ['NDA-клиент', 'Частный'],
          heading: '17 461 LOC, параллельно, fault-tolerant',
          body: 'Streamlit UI, scheduler+CLI оркестратор, worker-подпроцессы. SQLite с WAL + BEGIN IMMEDIATE для cross-layer IPC. CDP-based auth без Manifest V2. Windows Job Object cleanup. 9 pytest-наборов, GitHub Actions CI на каждый push.',
        },
        faqIntro: 'Что стоит знать о browser-automation на production-уровне',
        faq: [
          { q: 'Почему не просто Selenium или Puppeteer?', a: 'Для простых скриптов хватает Playwright. Для production-нагрузок нужны multi-worker координация, crash recovery и auth-handling, их нет ни в одной библиотеке по умолчанию, и они занимают 80 % работы.' },
          { q: 'Работает на Linux/Docker?', a: 'Сейчас Windows-центричный (Job Objects), может быть портировано на Linux/Docker, это часть адаптации.' },
          { q: 'А если на целевом сайте CAPTCHA?', a: 'CAPTCHA-handling, отдельная юридическая и техническая тема. Если сайт вас не хочет, это его право. Обсуждаем в discovery, что легально и разумно.' },
          { q: 'Могут несколько workflow работать параллельно?', a: 'Именно для этого фреймворк. asyncio.Lock round-robin между worker, дедуплицированная иерархия исключений, IPC через SQLite (WAL).' },
          { q: 'Кто держит данные browser-профилей?', a: 'Всё у вас, локально или в вашей инфраструктуре. Я не трогаю их после передачи, если не заключено maintenance-соглашение.' },
          { q: 'Как фреймворк остаётся актуальным при обновлениях браузера?', a: 'Опциональный maintenance-retainer покрывает обновления Playwright, Chrome, изменения CDP. Без retainer: чиню по дневному тарифу когда что-то ломается.' },
        ],
        finalCtaTitle: 'Browser-workflow, которые требуют ежедневного babysitting?',
        finalCtaBody: 'Кратко опишите use case и текущий setup, отвечу в течение 24 ч с оценкой.',
      },
    },
  },

  // ============================================================
  // Discovery Call & Architecture Consultation (paid, two tiers)
  // ============================================================
  {
    slug: 'discovery-call',
    related: ['aws-cost-analysis', 'custom-ai-app'],
    urlSlugs: { de: 'discovery-call', en: 'discovery-call', ru: 'discovery-call' },
    inquirySlug: 'discovery-call',
    caseStudy: null,
    eyebrow: { de: 'Beratung', en: 'Consultation', ru: 'Консультация' },
    priceMin: 75,
    priceFmt: { de: '75&nbsp;€', en: '€75', ru: '€75' },
    i18n: {
      de: {
        title: 'Discovery-Call & Architektur-Beratung',
        subtitle: '30 Minuten oder eine Stunde am Telefon, Workflow-Analyse, Machbarkeits-Check, Architektur-Empfehlung. Sie bekommen eine Kostenschätzung für die Umsetzung und eine schriftliche Zusammenfassung. Buchen Sie nach dem Call ein Projekt, wird der Call-Preis vollständig angerechnet.',
        meta: 'Bezahlter Discovery-Call: Workflow-Analyse, Machbarkeits-Check, Architektur-Empfehlung. 30 Minuten ab 75 €, 1 Stunde ab 150 €. Anrechenbar aufs Folgeprojekt.',
        overviewSummary: '30 oder 60 Minuten Telefonat, Workflow, Machbarkeit, Architektur-Empfehlung. Schriftliche Zusammenfassung. Preis wird auf ein Folgeprojekt angerechnet.',
        deliverIntro: 'Vier konkrete Sachen, die Sie nach dem Call in der Hand haben, auch wenn Sie sich gegen ein Folgeprojekt entscheiden.',
        outcomes: [
          { icon: 'doc',   title: 'Schriftliche Zusammenfassung', body: 'Was besprochen wurde, welche Optionen es gibt, welche ich für Ihren Fall empfehle. Per Mail innerhalb von 24 h nach dem Call, auch wenn Sie nicht weitermachen.' },
          { icon: 'check', title: 'Machbarkeits-Einschätzung', body: 'Ehrliche Antwort: ist das, was Sie vorhaben, technisch realistisch und stabil zu bauen? Wenn nein, sage ich Ihnen das im Call, bevor Sie Zeit oder Geld investieren.' },
          { icon: 'graph', title: 'Architektur-Empfehlung', body: 'Welche Werkzeuge zu Ihrem Fall passen (z. B. Python + Docker, FastAPI, Playwright, Scraping vs. APIs). Damit bauen Sie kein fragiles System, das in drei Monaten neu gemacht werden muss.' },
          { icon: 'bolt',  title: 'Realistische Kostenschätzung', body: 'Falls ein Folgeprojekt sinnvoll ist: Range plus Voraussetzungen. Keine Überraschungen später, kein Bait-and-Switch.' },
        ],
        processIntro: 'Wie der Call abläuft',
        process: [
          { title: 'Anfrage', body: 'Sie schicken eine kurze Anfrage mit Frage oder Problem. Antwort innerhalb von 24 h mit Terminvorschlag und Hinweis, welches Tier (30 oder 60 Min) sinnvoll ist.' },
          { title: 'Optionale Vorbereitung', body: 'Schicken Sie Material vorab, Code-Repo, Screenshots, ein bestehendes Tool, schaue ich es vor dem Call an. Macht die Minuten effizienter, kein Aufpreis.' },
          { title: 'Der Call', body: '30 oder 60 Minuten, je nach gewähltem Tier. Live (Video oder Audio) oder asynchron (Audio-Nachrichten plus Notizen, falls Zeitzonen schwierig sind).' },
          { title: 'Zusammenfassung', body: 'Innerhalb von 24 h nach dem Call: schriftliche Zusammenfassung, Architektur-Empfehlung, ggf. Kostenschätzung. Per E-Mail.' },
        ],
        pricingTitle: 'Zwei Längen, ein Preis pro Minute',
        pricingBody1: 'Zwei Optionen, je nach Komplexität: 30 Minuten für 75 €, 60 Minuten für 150 €. Beide Tiers enthalten Vorbereitung, Call und schriftliche Zusammenfassung.',
        pricingBody2: 'Wenn Sie nach dem Call ein Projekt bei mir buchen, wird der Call-Preis vollständig auf das Projekt angerechnet. Effektiv zahlen Sie nichts extra für die Beratung, Sie zahlen nur den Filter, falls es nicht zur Buchung kommt.',
        packageLabel: 'Discovery-Call',
        packageSubtitle: '30 oder 60 Minuten · live oder asynchron',
        includes: [
          '30 Minuten · 75 €, kompakter Überblick, Architektur-Empfehlung',
          '60 Minuten · 150 €, tiefere Analyse, Live-Bildschirm-Sharing',
          'Workflow-Analyse: was sinnvoll automatisiert werden kann, und was nicht',
          'Schriftliche Zusammenfassung + Kostenschätzung für die Umsetzung',
          'Call-Preis wird vollständig auf ein Folgeprojekt angerechnet',
        ],
        faqIntro: 'Was Sie über den Call wissen sollten',
        faq: [
          { q: 'Warum kein kostenloser Call?', a: 'Weil ein guter Call vorbereitet sein muss, Code lesen, Optionen abwägen, Architektur skizzieren. Plus filtert der Preis Anfragen vor, bei denen niemand wirklich Zeit investieren will. Ergebnis: ein Call, der etwas bringt, kein 15-Minuten-Sales-Pitch.' },
          { q: 'Und wenn Sie sagen, es ist nicht machbar?', a: 'Dann haben Sie die schriftliche Zusammenfassung mit Begründung und sparen sich ein Projekt, das nicht funktioniert hätte. Das ist der häufigste „Worst Case", und der Call hat sich trotzdem gelohnt.' },
          { q: 'Wann reichen 30 Minuten, wann brauche ich 60?', a: '30 reichen, wenn Sie schon eine konkrete Frage haben („Soll ich X oder Y nutzen?"). 60 ist sinnvoll bei komplexeren Workflows oder wenn wir live Code ansehen wollen.' },
          { q: 'Wie funktioniert die Anrechnung aufs Projekt?', a: 'Der Call-Preis erscheint in der Projektrechnung als Position „bereits geleistet". Sie zahlen den Projekt-Festpreis minus 75 € (oder 150 €). Anrechenbar auf jedes Folgeprojekt bei mir.' },
          { q: 'Geht das asynchron?', a: 'Ja. Audio-Nachrichten und geteilte Notizen, falls Live-Calls schwierig sind. Gleicher Preis, gleiches Deliverable.' },
          { q: 'Was, wenn der Call überzieht?', a: '5–10 Minuten Puffer sind eingeplant. Wenn es länger braucht: entweder Follow-up vereinbaren oder direkt auf den 60-Minuten-Tier upgraden, Sie zahlen die Differenz, nichts doppelt.' },
        ],
        finalCtaTitle: 'Eine Frage, ein Problem, eine Idee?',
        finalCtaBody: 'Schicken Sie eine kurze Anfrage, innerhalb von 24 h bekommen Sie Terminvorschläge und ein paar gezielte Rückfragen zur Vorbereitung.',
      },
      en: {
        title: 'Discovery Call & Architecture Consultation',
        subtitle: '30 minutes or one hour on the phone, workflow analysis, feasibility check, architecture recommendation. You get a cost estimate for the implementation and a written summary. Book a project afterwards and the call price gets fully credited against it.',
        meta: 'Paid discovery call: workflow analysis, feasibility check, architecture recommendation. 30 minutes from €75, 1 hour from €150. Credited against a follow-up project.',
        overviewSummary: '30 or 60 minutes on the phone, workflow, feasibility, architecture recommendation. Written summary. Price credited against any follow-up project.',
        deliverIntro: 'Four concrete things you walk away with, even if you decide against a follow-up project.',
        outcomes: [
          { icon: 'doc',   title: 'Written summary', body: 'What we discussed, what your options are, which one I\'d recommend for your case. By email within 24 h of the call, even if you don\'t proceed.' },
          { icon: 'check', title: 'Feasibility assessment', body: 'Straight answer: is what you have in mind technically realistic and stable to build? If not, I tell you in the call, before you invest time or money.' },
          { icon: 'graph', title: 'Architecture recommendation', body: 'Which tools fit your case (e.g. Python + Docker, FastAPI, Playwright, scraping vs. APIs). So you don\'t build a fragile system that has to be rebuilt in three months.' },
          { icon: 'bolt',  title: 'Realistic cost estimate', body: 'If a follow-up project makes sense: range plus assumptions. No surprises later, no bait-and-switch.' },
        ],
        processIntro: 'How the call runs',
        process: [
          { title: 'Inquiry', body: 'You send a short inquiry with the question or problem. Reply within 24 h, with a proposed time and a hint about which tier (30 or 60 min) makes sense.' },
          { title: 'Optional prep', body: 'Send material ahead, code repo, screenshots, an existing tool, and I look at it before the call. Makes the minutes count more, no surcharge.' },
          { title: 'The call', body: '30 or 60 minutes, depending on the chosen tier. Live (video or audio) or async (audio messages plus notes, if time zones are tricky).' },
          { title: 'Summary', body: 'Within 24 h after the call: written summary, architecture recommendation, cost estimate where applicable. By email.' },
        ],
        pricingTitle: 'Two lengths, one price per minute',
        pricingBody1: 'Two options depending on complexity: 30 minutes for €75, 60 minutes for €150. Both tiers include prep, the call, and the written summary.',
        pricingBody2: 'If you book a project with me after the call, the call price gets fully credited against the project. Effectively you pay nothing extra for the consultation, you only pay the filter, in case it doesn\'t turn into a booking.',
        packageLabel: 'Discovery Call',
        packageSubtitle: '30 or 60 minutes · live or async',
        includes: [
          '30 minutes · €75, compact overview, architecture recommendation',
          '60 minutes · €150, deeper analysis, live screen-sharing',
          'Workflow analysis: what makes sense to automate, and what doesn\'t',
          'Written summary + cost estimate for the implementation',
          'Call price fully credited against any follow-up project',
        ],
        faqIntro: 'What you should know about the call',
        faq: [
          { q: 'Why not a free call?', a: 'Because a good call needs preparation, reading code, weighing options, sketching architecture. Plus, the price filters out inquiries where nobody really wants to invest. Result: a call that delivers something, not a 15-minute sales pitch.' },
          { q: 'And if you say it\'s not feasible?', a: 'Then you have the written summary with reasoning and save yourself a project that wouldn\'t have worked. That\'s the most common "worst case", and the call still paid off.' },
          { q: 'When are 30 minutes enough, when do I need 60?', a: '30 work if you already have a concrete question ("Should I use X or Y?"). 60 is useful for more complex workflows or if we want to look at live code together.' },
          { q: 'How does the project credit work?', a: 'The call price shows up in the project invoice as "already paid". You pay the project fixed price minus €75 (or €150). Credit applies to any follow-up project with me.' },
          { q: 'Does async work?', a: 'Yes. Audio messages and shared notes, if live calls are tricky. Same price, same deliverable.' },
          { q: 'What if the call overruns?', a: '5–10 minutes of buffer are planned. If it needs more: either schedule a follow-up, or upgrade to the 60-minute tier on the spot, you pay the difference, nothing twice.' },
        ],
        finalCtaTitle: 'A question, a problem, an idea?',
        finalCtaBody: 'Send a short inquiry, within 24 h you get proposed times and a few targeted prep questions.',
      },
      ru: {
        title: 'Discovery-звонок и архитектурная консультация',
        subtitle: '30 минут или один час по телефону, анализ workflow, проверка реализуемости, архитектурная рекомендация. Вы получаете оценку стоимости внедрения и письменное summary. Если бронируете проект после звонка, цена звонка полностью зачитывается в него.',
        meta: 'Платный discovery-звонок: анализ workflow, проверка реализуемости, архитектурная рекомендация. 30 минут от €75, 1 час от €150. Зачитывается в последующий проект.',
        overviewSummary: '30 или 60 минут по телефону, workflow, реализуемость, архитектурная рекомендация. Письменное summary. Цена зачитывается в любой последующий проект.',
        deliverIntro: 'Четыре конкретных вещи, с которыми вы уходите, даже если решаете не продолжать.',
        outcomes: [
          { icon: 'doc',   title: 'Письменное summary', body: 'Что обсудили, какие варианты есть, который я рекомендую для вашего случая. По email в течение 24 ч после звонка, даже если не продолжаете.' },
          { icon: 'check', title: 'Оценка реализуемости', body: 'Прямой ответ: реалистично ли и стабильно ли то, что вы задумали, технически построить? Если нет, скажу в звонке, до того, как вы вложите время или деньги.' },
          { icon: 'graph', title: 'Архитектурная рекомендация', body: 'Какие инструменты подходят вашему случаю (Python + Docker, FastAPI, Playwright, scraping vs. API). Чтобы не построили хрупкую систему, которую через три месяца придётся переделывать.' },
          { icon: 'bolt',  title: 'Реалистичная оценка стоимости', body: 'Если последующий проект имеет смысл: диапазон плюс предположения. Никаких сюрпризов потом, никакого bait-and-switch.' },
        ],
        processIntro: 'Как идёт звонок',
        process: [
          { title: 'Запрос', body: 'Вы отправляете короткий запрос с вопросом или проблемой. Ответ в течение 24 ч с предложением времени и подсказкой, какой tier (30 или 60 мин) имеет смысл.' },
          { title: 'Опциональная подготовка', body: 'Пришлите материал заранее, code-репо, скриншоты, существующий инструмент, посмотрю до звонка. Делает минуты эффективнее, без доплаты.' },
          { title: 'Звонок', body: '30 или 60 минут, в зависимости от выбранного tier. Live (видео или аудио) или async (аудио-сообщения плюс заметки, если часовые пояса сложные).' },
          { title: 'Summary', body: 'В течение 24 ч после звонка: письменное summary, архитектурная рекомендация, оценка стоимости где применимо. По email.' },
        ],
        pricingTitle: 'Две длины, одна цена за минуту',
        pricingBody1: 'Два варианта в зависимости от сложности: 30 минут за €75, 60 минут за €150. Оба tier включают подготовку, звонок и письменное summary.',
        pricingBody2: 'Если бронируете проект у меня после звонка, цена звонка полностью зачитывается в проект. Фактически вы не платите ничего сверх за консультацию, вы платите только фильтр, на случай если до бронирования не дойдёт.',
        packageLabel: 'Discovery-звонок',
        packageSubtitle: '30 или 60 минут · live или async',
        includes: [
          '30 минут · €75, компактный обзор, архитектурная рекомендация',
          '60 минут · €150, глубокий анализ, live screen-sharing',
          'Анализ workflow: что имеет смысл автоматизировать, а что нет',
          'Письменное summary + оценка стоимости для внедрения',
          'Цена звонка полностью зачитывается в любой последующий проект',
        ],
        faqIntro: 'Что стоит знать о звонке',
        faq: [
          { q: 'Почему не бесплатный звонок?', a: 'Потому что хороший звонок требует подготовки, прочитать код, взвесить варианты, набросать архитектуру. Плюс цена отсеивает запросы, где никто не хочет реально вкладываться. Результат, звонок, который что-то даёт, а не 15-минутный sales-pitch.' },
          { q: 'А если вы скажете, что нереализуемо?', a: 'Тогда у вас остаётся письменное summary с обоснованием, и вы экономите себе проект, который бы не сработал. Это самый частый «worst case», и звонок всё равно окупился.' },
          { q: 'Когда хватает 30 минут, когда нужно 60?', a: '30 хватает, если у вас уже есть конкретный вопрос («использовать X или Y?»). 60, для более сложных workflow или если хотите посмотреть живой код вместе.' },
          { q: 'Как работает зачёт в проект?', a: 'Цена звонка отображается в проектном счёте как «уже оплачено». Вы платите фиксированную цену проекта минус €75 (или €150). Зачёт работает на любой последующий проект у меня.' },
          { q: 'Можно асинхронно?', a: 'Да. Аудио-сообщения и shared notes, если live-звонки сложно. Та же цена, тот же результат.' },
          { q: 'Что, если звонок выходит за время?', a: '5–10 минут буфера заложены. Если нужно больше: либо планируем follow-up, либо апгрейдим до 60-минутного tier на месте, доплачиваете разницу, без двойной оплаты.' },
        ],
        finalCtaTitle: 'Вопрос, проблема, идея?',
        finalCtaBody: 'Отправьте короткий запрос, в течение 24 ч получаете предложения по времени и пару точечных вопросов для подготовки.',
      },
    },
  },
];

// Sort services ascending by priceMin so they appear cheapest-first everywhere:
// overview pages, inquiry service-map, JSON-LD ItemList. The home-page teaser
// section is generated separately and must apply the same sort.
SERVICES.sort((a, b) => a.priceMin - b.priceMin);

// Project-case-study path resolution
const CASE_STUDY_PATHS = {
  de: (slug) => `/de/projekte/${slug}/`,
  en: (slug) => `/en/projects/${slug}/`,
  ru: (slug) => `/ru/proekty/${slug}/`,
};

// ============================================================
// TEMPLATES
// ============================================================

const ICONS = {
  doc:   `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  check: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`,
  graph: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 6h7a3 3 0 013 3v6"/></svg>`,
  bolt:  `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
};

const UPWORK_SVG = `<svg class="h-3.5 w-3.5 fill-[#14a800]" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.816v6.629c0 .943-.702 1.71-1.572 1.71-.869 0-1.572-.767-1.572-1.71V3.492H0v6.629c0 3.326 2.48 6.031 5.529 6.462V24h4.745v-7.396c2.513 1.968 5.253 2.539 7.421 2.539 2.551 0 4.962-1.42 5.922-3.839 1.151.782 2.158 1.942 2.385 4.696h4.86c-.521-4.723-3.238-7.738-6.19-9.177C24.47 6.427 21.652 5.018 18.561 5.018z"/></svg>`;
const UPWORK_URL = 'https://www.upwork.com/services/product/development-it-jan-1998498914122187359?ref=project_share';
const CHECK_SVG = `<svg class="mt-0.5 h-5 w-5 shrink-0 text-orange-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 011.42-1.42L8 12.585l7.29-7.29a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>`;
const ARROW_SVG = `<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd"/></svg>`;

function header(lang, currentPath, langSwitcher) {
  const L = LABELS[lang];
  const consultationLi = `<li><a class="text-stone-300 hover:text-white inline-flex min-w-[6rem] items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition" href="${UPWORK_URL}" target="_blank" rel="noopener noreferrer">${UPWORK_SVG}${L.navConsultation}</a></li>`;
  // Home matches only exact; other paths match by prefix
  const isActive = (path) => {
    const homePath = PATHS.home[lang];
    if (path === homePath) return currentPath === homePath ? 'text-white' : 'text-stone-300 hover:text-white';
    return currentPath.startsWith(path) ? 'text-white' : 'text-stone-300 hover:text-white';
  };
  const ariaCurrent = (path) => {
    const homePath = PATHS.home[lang];
    if (path === homePath) return currentPath === homePath ? ' aria-current="page"' : '';
    return currentPath.startsWith(path) ? ' aria-current="page"' : '';
  };
  return `<header class="absolute z-30 w-full">
  <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <div class="flex h-16 items-center justify-between md:h-20">
      <div class="mr-4 shrink-0">
        <a class="inline-flex items-center gap-3" href="${PATHS.home[lang]}" aria-label="Teske Systemtechnik">
          <img class="max-w-none" src="/static/images/logo_whitemode.svg" width="40" height="40" alt="">
          <span class="font-aspekta text-[17px] font-bold uppercase tracking-[0.1em] text-stone-100 leading-[20px]">Teske<br>Systemtechnik</span>
        </a>
      </div>
      <nav class="hidden md:flex md:grow" aria-label="Primary">
        <ul class="flex grow flex-wrap items-center justify-end gap-1">
          <li><a class="${isActive(PATHS.home[lang])} inline-flex min-w-[6rem] items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition" href="${PATHS.home[lang]}"${currentPath === PATHS.home[lang] ? ' aria-current="page"' : ''}>${L.navStart}</a></li>
          <li data-skeleton-off><a class="${isActive(PATHS.about[lang])} inline-flex min-w-[6rem] items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition" href="${PATHS.about[lang]}">${L.navAbout}</a></li>
          <li><a class="${isActive(OVERVIEW_PATHS[lang])} inline-flex min-w-[6rem] items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition" href="${OVERVIEW_PATHS[lang]}"${ariaCurrent(OVERVIEW_PATHS[lang])}>${L.navServices}</a></li>
          <li><a class="${isActive(PATHS.projects[lang])} inline-flex min-w-[6rem] items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition" href="${PATHS.projects[lang]}">${L.navProjects}</a></li>
          ${consultationLi}
          <li class="ml-2 flex items-center gap-1 rounded-full border border-stone-800 bg-stone-900/60 p-1">
            ${langSwitcher}
          </li>
        </ul>
      </nav>
      <div class="ml-4 flex items-center md:hidden" x-data="{ expanded: false }">
        <button class="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900/60 text-stone-300 transition hover:text-white" aria-controls="mobile-nav" :aria-expanded="expanded" @click.stop="expanded = !expanded">
          <span class="sr-only">Menu</span>
          <svg class="pointer-events-none h-4 w-4 fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <rect class="origin-center -translate-y-[5px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]" y="7" width="16" height="2" rx="1"></rect>
            <rect class="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45" y="7" width="16" height="2" rx="1"></rect>
            <rect class="origin-center translate-y-[5px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]" y="7" width="16" height="2" rx="1"></rect>
          </svg>
        </button>
        <template x-teleport="body">
          <nav id="mobile-nav" aria-label="Mobile" class="fixed top-16 inset-x-0 z-50 overflow-hidden px-4 transition-all duration-300 ease-out sm:px-6" x-ref="mobileNav"
               :style="expanded ? 'max-height: ' + $refs.mobileNav.scrollHeight + 'px; opacity: 1; transform: translateY(0)' : 'max-height: 0; opacity: 0; transform: translateY(-8px)'"
               @click.outside="expanded = false" @keydown.escape.window="expanded = false" x-cloak>
            <ul class="rounded-2xl border border-stone-800 bg-stone-900/90 px-4 py-3 shadow-xl backdrop-blur-xl">
              <li><a class="flex py-2 text-sm font-medium ${currentPath === PATHS.home[lang] ? 'text-white' : 'text-stone-300 hover:text-white'}" href="${PATHS.home[lang]}">${L.navStart}</a></li>
              <li data-skeleton-off><a class="flex py-2 text-sm font-medium text-stone-300 hover:text-white" href="${PATHS.about[lang]}">${L.navAbout}</a></li>
              <li><a class="flex py-2 text-sm font-medium ${currentPath.startsWith(OVERVIEW_PATHS[lang]) ? 'text-white' : 'text-stone-300 hover:text-white'}" href="${OVERVIEW_PATHS[lang]}">${L.navServices}</a></li>
              <li><a class="flex py-2 text-sm font-medium text-stone-300 hover:text-white" href="${PATHS.projects[lang]}">${L.navProjects}</a></li>
              <li><a class="flex items-center gap-2 py-2 text-sm font-medium text-stone-300 hover:text-white" href="${UPWORK_URL}" target="_blank" rel="noopener noreferrer">${UPWORK_SVG}${L.navConsultation}</a></li>
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

function languageSwitcher(currentLang, alternates) {
  // alternates: { de: '/de/...', en: '/en/...', ru: '/ru/...' }
  return LANGUAGES.map((lang) => {
    const isActive = lang === currentLang;
    const label = lang.toUpperCase();
    const href = isActive ? '#' : alternates[lang];
    const cls = isActive
      ? 'bg-orange-500 text-white shadow rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition'
      : 'text-stone-400 hover:text-white rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition';
    return `<a class="${cls}" href="${href}"${isActive ? ' aria-current="true"' : ''} aria-label="${LABELS[currentLang].switchLanguage}: ${label}">${label}</a>`;
  }).join('\n              ');
}

const SOCIAL_SVGS = {
  pypi: `<svg class="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12,2L2,7V17L12,22L22,17V7L12,2ZM4,16.06V8.94L11,12.44V19.56L4,16.06ZM12,11.38L5.13,7.94L12,4.5L18.87,7.94L12,11.38ZM20,16.06L13,19.56V12.44L20,8.94V16.06Z"/></svg>`,
  upwork: `<svg class="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.816v6.629c0 .943-.702 1.71-1.572 1.71-.869 0-1.572-.767-1.572-1.71V3.492H0v6.629c0 3.326 2.48 6.031 5.529 6.462V24h4.745v-7.396c2.513 1.968 5.253 2.539 7.421 2.539 2.551 0 4.962-1.42 5.922-3.839 1.151.782 2.158 1.942 2.385 4.696h4.86c-.521-4.723-3.238-7.738-6.19-9.177C24.47 6.427 21.652 5.018 18.561 5.018z"/></svg>`,
  github: `<svg class="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
};

function footer(lang) {
  const L = LABELS[lang];
  return `<footer class="relative border-t border-stone-800/60 mt-10">
  <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <div class="grid gap-10 py-12 md:grid-cols-12">
      <div class="md:col-span-5">
        <a class="inline-flex items-center gap-3" href="${PATHS.home[lang]}" aria-label="Teske Systemtechnik">
          <img src="/static/images/logo_whitemode.svg" class="h-12 w-12" alt="">
          <span class="font-aspekta text-lg font-bold uppercase tracking-[0.2em] text-stone-100">Teske<br>Systemtechnik</span>
        </a>
        <p class="mt-4 max-w-sm text-sm text-stone-400">${L.quality}</p>
      </div>
      <div class="md:col-span-3">
        <h3 class="mb-4 font-aspekta text-xs font-semibold uppercase tracking-wider text-stone-300">${L.headlineNavigation}</h3>
        <ul class="space-y-2 text-sm">
          <li><a class="text-stone-400 transition hover:text-amber-400" href="${PATHS.home[lang]}">${L.navStart}</a></li>
          <li data-skeleton-off><a class="text-stone-400 transition hover:text-amber-400" href="${PATHS.about[lang]}">${L.navAbout}</a></li>
          <li><a class="text-stone-400 transition hover:text-amber-400" href="${OVERVIEW_PATHS[lang]}">${L.navServices}</a></li>
          <li><a class="text-stone-400 transition hover:text-amber-400" href="${PATHS.projects[lang]}">${L.navProjects}</a></li>
          <li><a class="text-stone-400 transition hover:text-amber-400" href="${UPWORK_URL}" target="_blank" rel="noopener noreferrer">${L.consultationViaUpwork}</a></li>
        </ul>
      </div>
      <div class="md:col-span-2">
        <h3 class="mb-4 font-aspekta text-xs font-semibold uppercase tracking-wider text-stone-300">${L.headlineLegal}</h3>
        <ul class="space-y-2 text-sm">
          <li><a class="text-stone-400 transition hover:text-amber-400" href="${PATHS.legal[lang]}">${L.legal}</a></li>
          <li><a class="text-stone-400 transition hover:text-amber-400" href="${PATHS.privacy[lang]}">${L.privacy}</a></li>
        </ul>
      </div>
      <div class="md:col-span-2">
        <h3 class="mb-4 font-aspekta text-xs font-semibold uppercase tracking-wider text-stone-300">${L.headlineFollow}</h3>
        <ul class="flex gap-3">
          <li><a class="flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-400 transition hover:border-orange-500 hover:bg-orange-500 hover:text-white" href="https://pypi.org/user/JanTeske06/" target="_blank" rel="noopener noreferrer" aria-label="PyPI">${SOCIAL_SVGS.pypi}</a></li>
          <li><a class="flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-400 transition hover:border-[#14a800] hover:bg-[#14a800] hover:text-white" href="https://www.upwork.com/freelancers/~015b43fa57ecfc1b1c" target="_blank" rel="noopener noreferrer" aria-label="Upwork">${SOCIAL_SVGS.upwork}</a></li>
          <li><a class="flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-400 transition hover:border-white hover:bg-black hover:text-white" href="https://github.com/JanTeske06" target="_blank" rel="noopener noreferrer" aria-label="GitHub">${SOCIAL_SVGS.github}</a></li>
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
<script src="/static/js/vendors/swiper-bundle.min.js?v=20260430a"></script>
<script src="/static/js/main.js?v=20260430a"></script>`;
}

// ============================================================
// SERVICE PAGE TEMPLATE
// ============================================================

function renderServicePage(service, lang) {
  const L = LABELS[lang];
  const i18n = service.i18n[lang];
  const eyebrowText = typeof service.eyebrow === 'string' ? service.eyebrow : (service.eyebrow[lang] || service.eyebrow.en);
  const path = service.urlSlugs[lang];
  const overviewPath = OVERVIEW_PATHS[lang];
  // Service-page CTAs route to the home-page contact form (with prefill via
  // ?service=&min= query params and #contact anchor for scroll). The old
  // standalone /<lang>/anfrage/ pages still exist as fallback but are no
  // longer linked from any generated page.
  const inquiryHref = `${PATHS.home[lang]}?service=${service.inquirySlug}&amp;min=${service.priceMin}#contact`;
  const canonicalUrl = `https://teske-systemtechnik.de${overviewPath}${path}/`;

  const alternates = {};
  for (const l of LANGUAGES) {
    alternates[l] = `${OVERVIEW_PATHS[l]}${service.urlSlugs[l]}/`;
  }

  const caseStudyHref = service.caseStudy ? CASE_STUDY_PATHS[lang](service.caseStudy) : null;

  // Hero, back-link sits on the outer max-w-6xl level (above the max-w-3xl
  // content block) with extra vertical space, so it's visibly separated from
  // the "000 / <eyebrow>" line and reads as breadcrumb-style navigation.
  const hero = `<section class="relative pt-32 pb-16 md:pt-40 md:pb-20">
  <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <a href="${overviewPath}" class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-400 transition hover:text-amber-300" data-aos="fade-up">${L.backToOverview}</a>
    <div class="max-w-3xl">
      <p class="mb-6 inline-flex items-center gap-3 font-aspekta text-xs font-semibold uppercase tracking-[0.18em] text-amber-400" data-aos="fade-up">
        <span class="section-num">000 /</span>
        ${eyebrowText}
      </p>
      <h1 class="font-aspekta text-5xl font-bold leading-[1.02] text-white md:text-6xl" data-aos="fade-up" data-aos-delay="80">${i18n.title}</h1>
      <p class="mt-6 max-w-2xl text-lg text-stone-300" data-aos="fade-up" data-aos-delay="160">${i18n.subtitle}</p>
      <div class="mt-10 flex flex-wrap gap-3" data-aos="fade-up" data-aos-delay="240">
        <a class="inline-flex items-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-400" href="${inquiryHref}">${L.inquirySend}</a>
        <a class="inline-flex items-center rounded-full border border-stone-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-orange-500 hover:text-amber-300" href="#leistungsumfang">${L.whatsInside}</a>
      </div>
    </div>
  </div>
</section>`;

  // Outcomes
  const outcomesCards = i18n.outcomes.map((o, i) => `<div class="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 transition hover:border-orange-500/50" data-aos="fade-up"${i > 0 ? ` data-aos-delay="${i * 80}"` : ''}>
  <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 text-orange-400">${ICONS[o.icon]}</div>
  <h3 class="font-aspekta text-lg font-bold text-white">${o.title}</h3>
  <p class="mt-2 text-sm text-stone-400">${o.body}</p>
</div>`).join('\n          ');

  const outcomesSection = `<section id="leistungsumfang" class="relative border-t border-stone-900 py-20 md:py-24">
  <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <div class="max-w-2xl" data-aos="fade-up">
      <p class="mb-3 inline-flex items-center gap-3 font-aspekta text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
        <span class="section-num">001 /</span>
        ${L.secDeliverables}
      </p>
      <h2 class="font-aspekta text-3xl font-bold text-white md:text-4xl">${L.whatsInside}</h2>
      <p class="mt-4 text-stone-400">${i18n.deliverIntro}</p>
    </div>
    <div class="mt-12 grid gap-6 md:grid-cols-2">
          ${outcomesCards}
    </div>
  </div>
</section>`;

  // Process
  const processSteps = i18n.process.map((p, i) => `<li class="relative rounded-2xl border border-stone-800 bg-stone-900/60 p-6" data-aos="fade-up"${i > 0 ? ` data-aos-delay="${i * 80}"` : ''}>
  <span class="absolute -top-3 left-6 inline-flex h-7 items-center rounded-full bg-orange-500 px-3 font-aspekta text-xs font-bold uppercase tracking-wider text-white">0${i+1}</span>
  <h3 class="mt-3 font-aspekta text-base font-bold text-white">${p.title}</h3>
  <p class="mt-2 text-sm text-stone-400">${p.body}</p>
</li>`).join('\n          ');

  const processSection = `<section class="relative border-t border-stone-900 py-20 md:py-24">
  <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <div class="max-w-2xl" data-aos="fade-up">
      <p class="mb-3 inline-flex items-center gap-3 font-aspekta text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
        <span class="section-num">002 /</span>
        ${L.secProcess}
      </p>
      <h2 class="font-aspekta text-3xl font-bold text-white md:text-4xl">${i18n.processIntro}</h2>
    </div>
    <ol class="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-${i18n.process.length}">
          ${processSteps}
    </ol>
  </div>
</section>`;

  // Pricing
  const includesList = i18n.includes.map(item => `<li class="flex items-start gap-3">${CHECK_SVG}${item}</li>`).join('\n            ');
  const pricingSection = `<section class="relative border-t border-stone-900 py-20 md:py-24">
  <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <div class="grid gap-10 lg:grid-cols-12 items-start">
      <div class="lg:col-span-5" data-aos="fade-up">
        <p class="mb-3 inline-flex items-center gap-3 font-aspekta text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
          <span class="section-num">003 /</span>
          ${L.secPricing}
        </p>
        <h2 class="font-aspekta text-3xl font-bold leading-tight text-white md:text-4xl">${i18n.pricingTitle}</h2>
        <p class="mt-4 text-stone-400">${i18n.pricingBody1}</p>
        <p class="mt-4 text-stone-400">${i18n.pricingBody2}</p>
      </div>
      <div class="lg:col-span-7" data-aos="fade-up" data-aos-delay="120">
        <div class="rounded-3xl border border-orange-500/30 bg-gradient-to-br from-stone-900/80 to-stone-950 p-8 shadow-xl">
          <p class="font-aspekta text-[11px] font-semibold uppercase tracking-widest text-amber-400">${i18n.packageLabel}</p>
          <div class="mt-4 flex items-baseline gap-2">
            <span class="font-aspekta text-sm text-stone-400">${L.fromPrefix}</span>
            <span class="font-aspekta text-5xl font-bold text-white">${service.priceFmt[lang]}</span>
            <span class="font-aspekta text-sm text-stone-400">${L.netSuffix}</span>
          </div>
          <p class="mt-2 text-sm text-stone-400">${i18n.packageSubtitle}</p>
          <ul class="mt-6 space-y-3 text-sm text-stone-200">
            ${includesList}
          </ul>
          <a href="${inquiryHref}" class="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-400">
            ${L.inquirySend}
            ${ARROW_SVG}
          </a>
          <p class="mt-3 text-center text-xs text-stone-500">${L.response24h}</p>
        </div>
      </div>
    </div>
  </div>
</section>`;

  // Reference, only rendered if the service has an associated case study
  let referenceSection = '';
  if (service.caseStudy) {
    const tagsHtml = i18n.referenceCard.tags.map(t => `<span class="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-amber-200">${t}</span>`).join('\n            ');
    referenceSection = `<section class="relative border-t border-stone-900 py-20 md:py-24">
  <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <div class="max-w-2xl" data-aos="fade-up">
      <p class="mb-3 inline-flex items-center gap-3 font-aspekta text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
        <span class="section-num">004 /</span>
        ${L.secReference}
      </p>
      <h2 class="font-aspekta text-3xl font-bold text-white md:text-4xl">${i18n.referenceTitle}</h2>
      <p class="mt-4 text-stone-400">${i18n.referenceIntro}</p>
    </div>
    <a href="${caseStudyHref}" class="mt-12 block overflow-hidden rounded-3xl border border-stone-800 bg-stone-900/60 transition hover:border-orange-500/50" data-aos="fade-up" data-aos-delay="120">
      <div class="grid md:grid-cols-12">
        <div class="md:col-span-5">
          <img src="/static/projects/${service.caseStudy}/images/cover.svg" alt="${i18n.referenceCard.heading}" class="h-full w-full object-cover" loading="lazy">
        </div>
        <div class="p-8 md:col-span-7">
          <div class="mb-4 flex flex-wrap gap-2">
            ${tagsHtml}
          </div>
          <h3 class="font-aspekta text-2xl font-bold text-white">${i18n.referenceCard.heading}</h3>
          <p class="mt-3 text-stone-300">${i18n.referenceCard.body}</p>
          <span class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-amber-400">
            ${L.readCase}
            ${ARROW_SVG}
          </span>
        </div>
      </div>
    </a>
  </div>
</section>`;
  }

  // FAQ
  const faqItems = i18n.faq.map(item => `<details class="faq-card rounded-2xl border border-stone-800 bg-stone-900/60 p-6">
  <summary class="flex items-start justify-between gap-4 font-aspekta text-base font-bold text-white">
    ${item.q}
    <span class="faq-icon shrink-0 text-lg" aria-hidden="true">+</span>
  </summary>
  <p class="mt-4 text-sm text-stone-400">${item.a}</p>
</details>`).join('\n          ');

  const faqSection = `<section class="relative border-t border-stone-900 py-20 md:py-24">
  <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <div class="max-w-2xl" data-aos="fade-up">
      <p class="mb-3 inline-flex items-center gap-3 font-aspekta text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
        <span class="section-num">005 /</span>
        ${L.secFaq}
      </p>
      <h2 class="font-aspekta text-3xl font-bold text-white md:text-4xl">${i18n.faqIntro}</h2>
    </div>
    <div class="mt-12 grid gap-4 md:grid-cols-2 items-start" data-aos="fade-up" data-aos-delay="80">
          ${faqItems}
    </div>
  </div>
</section>`;

  // Final CTA
  const relatedSection = (service.related && service.related.length)
    ? `<section class="relative border-t border-stone-900 py-20 md:py-24">
  <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <div class="mb-10 max-w-3xl" data-aos="fade-up">
      <p class="mb-3 inline-flex items-center gap-3 font-aspekta text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
        <span class="section-num">006 /</span>
        ${L.relatedServices}
      </p>
      <p class="text-stone-400">${L.relatedIntro}</p>
    </div>
    <div class="grid gap-6 md:grid-cols-2 items-stretch">
      ${service.related.map((slug) => {
        const s = SERVICES.find((sv) => sv.slug === slug);
        if (!s) return '';
        const i18nR = s.i18n[lang];
        const ebR = typeof s.eyebrow === 'string' ? s.eyebrow : (s.eyebrow[lang] || s.eyebrow.en);
        const detailHref = `${OVERVIEW_PATHS[lang]}${s.urlSlugs[lang]}/`;
        return `<a href="${detailHref}" class="group flex flex-col rounded-2xl border border-stone-800 bg-stone-900/60 p-6 transition hover:border-orange-500/50" data-aos="fade-up">
  <p class="mb-2 font-aspekta text-[11px] font-semibold uppercase tracking-widest text-amber-400">${ebR}</p>
  <h3 class="font-aspekta text-xl font-bold text-white">${i18nR.title}</h3>
  <p class="mt-3 grow text-sm text-stone-400">${i18nR.overviewSummary}</p>
  <div class="mt-6 flex items-baseline justify-between gap-3 border-t border-stone-800/60 pt-4">
    <div class="flex items-baseline gap-1.5">
      <span class="font-aspekta text-xs text-stone-500">${L.fromPrefix}</span>
      <span class="font-aspekta text-xl font-bold text-white">${s.priceFmt[lang]}</span>
    </div>
    <span class="text-xs font-semibold text-amber-400 transition group-hover:text-amber-300">${L.overviewCardCta}</span>
  </div>
</a>`;
      }).join('\n      ')}
    </div>
  </div>
</section>`
    : '';

  const finalCta = `<section class="relative border-t border-stone-900 py-20 md:py-24">
  <div class="mx-auto max-w-3xl px-4 text-center sm:px-6" data-aos="fade-up">
    <h2 class="font-aspekta text-3xl font-bold text-white md:text-4xl">${i18n.finalCtaTitle}</h2>
    <p class="mt-4 text-stone-400">${i18n.finalCtaBody}</p>
    <a href="${inquiryHref}" class="mt-10 inline-flex items-center gap-2 rounded-full bg-orange-500 px-8 py-4 text-sm font-semibold text-white transition hover:bg-orange-400">
      ${L.inquirySend}
      ${ARROW_SVG}
    </a>
  </div>
</section>`;

  // JSON-LD: Organization + Service offer + FAQPage. The FAQPage schema lets
  // Google render rich-result accordions for the FAQ section. Answers must
  // be plain text (no HTML) to validate.
  const faqLd = {
    '@type': 'FAQPage',
    mainEntity: i18n.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfessionalService',
        '@id': 'https://teske-systemtechnik.de/#organization',
        name: 'Teske Systemtechnik',
        url: 'https://teske-systemtechnik.de',
      },
      {
        '@type': 'Service',
        name: i18n.title,
        serviceType: eyebrowText,
        provider: { '@id': 'https://teske-systemtechnik.de/#organization' },
        areaServed: 'Worldwide',
        description: i18n.meta,
        url: canonicalUrl,
        offers: {
          '@type': 'Offer',
          price: String(service.priceMin),
          priceCurrency: 'EUR',
          priceSpecification: {
            '@type': 'PriceSpecification',
            minPrice: String(service.priceMin),
            priceCurrency: 'EUR',
          },
        },
      },
      faqLd,
    ],
  };

  const langSwitcher = languageSwitcher(lang, alternates);

  return `<!DOCTYPE html>
<html lang="${L.htmlLang}" class="scroll-smooth">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">

  ${maintenanceGuard()}
  <meta name="robots" content="index,follow">

  <title>${i18n.title} · Teske Systemtechnik</title>
  <meta name="description" content="${i18n.meta}">

  <link rel="canonical" href="${canonicalUrl}">
  ${LANGUAGES.map(l => `<link rel="alternate" hreflang="${l}" href="https://teske-systemtechnik.de${alternates[l]}">`).join('\n  ')}
  <link rel="alternate" hreflang="x-default" href="https://teske-systemtechnik.de${alternates.de}">

  <link rel="icon" type="image/svg+xml" href="/static/images/logo_favicon.svg">
  <link rel="preload" href="/static/fonts/aspekta/Aspekta-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/static/fonts/aspekta/Aspekta-650.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/static/css/vendors/aos.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/static/css/vendors/aos.css"></noscript>
  <link rel="stylesheet" href="/static/css/vendors/swiper-bundle.min.css">
  <link rel="stylesheet" href="/static/style.css?v=20260521a">
  <link rel="stylesheet" href="/static/css/site.css?v=20260521a">

  <meta property="og:site_name" content="Teske Systemtechnik">
  <meta property="og:title" content="${i18n.title}, Teske Systemtechnik">
  <meta property="og:description" content="${i18n.meta}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${L.ogLocale}">
  <meta name="twitter:card" content="summary_large_image">
  <meta property="og:image" content="https://teske-systemtechnik.de/static/images/og-default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
</head>

<body class="font-inter antialiased bg-stone-950 text-stone-100 tracking-tight selection:bg-orange-500/40 selection:text-white">
<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-orange-500 focus:px-4 focus:py-2 focus:text-white">${L.skipToContent}</a>

<div class="flex min-h-screen flex-col">

${header(lang, `${overviewPath}${path}/`, langSwitcher)}

<main id="main-content" class="grow">

${hero}

${outcomesSection}

${processSection}

${pricingSection}

${referenceSection}

${faqSection}

${relatedSection}

${finalCta}

</main>

${footer(lang)}

</div>

${scriptsFooter()}

</body>
</html>
`;
}

// ============================================================
// OVERVIEW PAGE TEMPLATE
// ============================================================

function renderOverviewPage(lang) {
  const L = LABELS[lang];
  const overviewPath = OVERVIEW_PATHS[lang];
  const alternates = {};
  for (const l of LANGUAGES) alternates[l] = OVERVIEW_PATHS[l];

  const cards = SERVICES.map((s, i) => {
    const i18n = s.i18n[lang];
    const eb = typeof s.eyebrow === 'string' ? s.eyebrow : (s.eyebrow[lang] || s.eyebrow.en);
    const detailHref = `${overviewPath}${s.urlSlugs[lang]}/`;
    return `<a href="${detailHref}" class="group flex flex-col rounded-2xl border border-stone-800 bg-stone-900/60 p-6 transition hover:border-orange-500/50" data-aos="fade-up"${i > 0 ? ` data-aos-delay="${(i % 3) * 80}"` : ''}>
  <p class="mb-2 font-aspekta text-[11px] font-semibold uppercase tracking-widest text-amber-400">${eb}</p>
  <h3 class="font-aspekta text-xl font-bold text-white">${i18n.title}</h3>
  <p class="mt-3 grow text-sm text-stone-400">${i18n.overviewSummary}</p>
  <div class="mt-6 flex items-baseline justify-between gap-3 border-t border-stone-800/60 pt-4">
    <div class="flex items-baseline gap-1.5">
      <span class="font-aspekta text-xs text-stone-500">${L.fromPrefix}</span>
      <span class="font-aspekta text-xl font-bold text-white">${s.priceFmt[lang]}</span>
    </div>
    <span class="text-xs font-semibold text-amber-400 transition group-hover:text-amber-300">${L.overviewCardCta}</span>
  </div>
</a>`;
  }).join('\n        ');

  const langSwitcher = languageSwitcher(lang, alternates);
  const canonicalUrl = `https://teske-systemtechnik.de${overviewPath}`;

  const itemListLd = SERVICES.map((s, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'Service',
      name: s.i18n[lang].title,
      url: `https://teske-systemtechnik.de${overviewPath}${s.urlSlugs[lang]}/`,
      offers: {
        '@type': 'Offer',
        price: String(s.priceMin),
        priceCurrency: 'EUR',
      },
    },
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfessionalService',
        '@id': 'https://teske-systemtechnik.de/#organization',
        name: 'Teske Systemtechnik',
        url: 'https://teske-systemtechnik.de',
      },
      {
        '@type': 'ItemList',
        itemListElement: itemListLd,
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="${L.htmlLang}" class="scroll-smooth">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">

  ${maintenanceGuard()}
  <meta name="robots" content="index,follow">

  <title>${L.overviewTitle} · Teske Systemtechnik</title>
  <meta name="description" content="${L.overviewIntro}">

  <link rel="canonical" href="${canonicalUrl}">
  ${LANGUAGES.map(l => `<link rel="alternate" hreflang="${l}" href="https://teske-systemtechnik.de${alternates[l]}">`).join('\n  ')}
  <link rel="alternate" hreflang="x-default" href="https://teske-systemtechnik.de${alternates.de}">

  <link rel="icon" type="image/svg+xml" href="/static/images/logo_favicon.svg">
  <link rel="preload" href="/static/fonts/aspekta/Aspekta-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/static/fonts/aspekta/Aspekta-650.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/static/css/vendors/aos.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/static/css/vendors/aos.css"></noscript>
  <link rel="stylesheet" href="/static/css/vendors/swiper-bundle.min.css">
  <link rel="stylesheet" href="/static/style.css?v=20260521a">
  <link rel="stylesheet" href="/static/css/site.css?v=20260521a">

  <meta property="og:site_name" content="Teske Systemtechnik">
  <meta property="og:title" content="${L.overviewTitle}, Teske Systemtechnik">
  <meta property="og:description" content="${L.overviewIntro}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${L.ogLocale}">
  <meta name="twitter:card" content="summary_large_image">
  <meta property="og:image" content="https://teske-systemtechnik.de/static/images/og-default.png">

  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
</head>

<body class="font-inter antialiased bg-stone-950 text-stone-100 tracking-tight selection:bg-orange-500/40 selection:text-white">
<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-orange-500 focus:px-4 focus:py-2 focus:text-white">${L.skipToContent}</a>

<div class="flex min-h-screen flex-col">

${header(lang, overviewPath, langSwitcher)}

<main id="main-content" class="grow">

  <section class="relative pt-32 pb-16 md:pt-44 md:pb-20">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="max-w-3xl">
        <p class="mb-6 inline-flex items-center gap-3 font-aspekta text-xs font-semibold uppercase tracking-[0.18em] text-amber-400" data-aos="fade-up">
          <span class="section-num">000 /</span>
          ${L.secOverviewLabel}
        </p>
        <h1 class="font-aspekta text-5xl font-bold leading-[1.02] text-white md:text-6xl" data-aos="fade-up" data-aos-delay="80">${L.overviewTitle}</h1>
        <p class="mt-6 max-w-2xl text-lg text-stone-300" data-aos="fade-up" data-aos-delay="160">${L.overviewIntro}</p>
      </div>
    </div>
  </section>

  <section class="relative border-t border-stone-900 py-20 md:py-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        ${cards}
      </div>

      <div class="mt-16 flex justify-center" data-aos="fade-up">
        <a href="${PATHS.home[lang]}"
           class="inline-flex items-center gap-2 rounded-full border border-stone-800 bg-stone-900 px-6 py-3 text-sm font-semibold text-stone-200 transition hover:border-orange-500/50 hover:text-amber-300">
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
          ${L.backToHome}
        </a>
      </div>
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
// INQUIRY PAGE TEMPLATE
// ============================================================

const INQUIRY_LABELS = {
  de: {
    eyebrow: 'Anfrage',
    heading: 'Konkrete Projektanfrage',
    intro: 'Bitte beschreiben Sie kurz Ihr Projekt und Ihren Budget-Rahmen. Antwort innerhalb von 24 Stunden mit Einschätzung und Termin-Vorschlag für einen Discovery-Call.',
    fieldProject: 'Projekt / Leistung',
    fieldProjectPlaceholder: 'z. B. AWS Kostenanalyse & Reduktion',
    fieldProjectPrefillNote: 'Vorausgefüllt durch Ihren Klick auf der Leistungs-Seite. Falls falsch, hier bitte korrigieren.',
    fieldBudget: 'Ihr Budget (EUR, netto)',
    minPrefix: 'Mindestbudget',
    fieldName: 'Name', placeholderName: 'Max Mustermann',
    fieldEmail: 'E-Mail', placeholderEmail: 'max@firma.de',
    fieldCompany: 'Unternehmen', optionalSuffix: '(optional)', placeholderCompany: 'Firma GmbH',
    fieldMessage: 'Projekt-Details', messageMax: 'max. 1000 Zeichen',
    placeholderMessage: 'Größenordnung, Auffälligkeiten, Zeitrahmen, organisatorische Constraints…',
    submit: 'Anfrage absenden',
    privacyNote1: 'Mit dem Absenden stimmen Sie der ',
    privacyLinkText: 'Datenverarbeitung',
    privacyNote2: ' zu.',
    budgetErrorPrefix: 'Mindestbudget für diesen Service:',
    budgetErrorSuffix: 'netto. Bei kleineren Vorhaben kontaktieren Sie bitte das Standard-Kontaktformular auf der Startseite.',
    submitSuccess: 'Vielen Dank, Ihre Anfrage ist eingegangen. Antwort innerhalb von 24 Stunden.',
    submitError: 'Etwas ist schiefgegangen. Bitte versuchen Sie es erneut oder schreiben Sie direkt an jt@teske-systemtechnik.de.',
    locale: 'de-DE',
  },
  en: {
    eyebrow: 'Inquiry',
    heading: 'Concrete project inquiry',
    intro: 'Briefly describe your project and your budget range. Reply within 24 hours with an estimate and a proposed time for a discovery call.',
    fieldProject: 'Project / service',
    fieldProjectPlaceholder: 'e.g. AWS Cost Analysis & Reduction',
    fieldProjectPrefillNote: 'Pre-filled by your click on the service page. Click to correct if needed.',
    fieldBudget: 'Your budget (EUR, net)',
    minPrefix: 'Minimum budget',
    fieldName: 'Name', placeholderName: 'Jane Doe',
    fieldEmail: 'Email', placeholderEmail: 'jane@company.com',
    fieldCompany: 'Company', optionalSuffix: '(optional)', placeholderCompany: 'Company Ltd',
    fieldMessage: 'Project details', messageMax: 'max. 1000 characters',
    placeholderMessage: 'Size of the setup, anomalies, timeframe, organisational constraints…',
    submit: 'Send inquiry',
    privacyNote1: 'By submitting you agree to the ',
    privacyLinkText: 'data processing',
    privacyNote2: '.',
    budgetErrorPrefix: 'Minimum budget for this service:',
    budgetErrorSuffix: 'net. For smaller projects please use the standard contact form on the home page.',
    submitSuccess: 'Thanks, your inquiry came through. Reply within 24 hours.',
    submitError: 'Something went wrong. Please try again or email jt@teske-systemtechnik.de directly.',
    locale: 'en-US',
  },
  ru: {
    eyebrow: 'Запрос',
    heading: 'Конкретный запрос проекта',
    intro: 'Кратко опишите проект и диапазон бюджета. Ответ в течение 24 часов с оценкой и предложением времени для discovery-звонка.',
    fieldProject: 'Проект / услуга',
    fieldProjectPlaceholder: 'напр., Анализ и снижение расходов AWS',
    fieldProjectPrefillNote: 'Заполнено через клик на странице услуги. Кликните для исправления, если нужно.',
    fieldBudget: 'Ваш бюджет (EUR, нетто)',
    minPrefix: 'Минимальный бюджет',
    fieldName: 'Имя', placeholderName: 'Иван Иванов',
    fieldEmail: 'E-mail', placeholderEmail: 'ivan@company.ru',
    fieldCompany: 'Компания', optionalSuffix: '(опционально)', placeholderCompany: 'ООО Компания',
    fieldMessage: 'Подробности проекта', messageMax: 'макс. 1000 символов',
    placeholderMessage: 'Размер setup, особенности, сроки, организационные ограничения…',
    submit: 'Отправить запрос',
    privacyNote1: 'Отправляя, вы соглашаетесь с ',
    privacyLinkText: 'обработкой данных',
    privacyNote2: '.',
    budgetErrorPrefix: 'Минимальный бюджет для этой услуги:',
    budgetErrorSuffix: 'нетто. Для меньших проектов используйте стандартную форму на главной странице.',
    submitSuccess: 'Спасибо, ваш запрос принят. Ответ в течение 24 часов.',
    submitError: 'Что-то пошло не так. Попробуйте ещё раз или напишите напрямую на jt@teske-systemtechnik.de.',
    locale: 'ru-RU',
  },
};

function renderInquiryPage(lang) {
  const L = LABELS[lang];
  const I = INQUIRY_LABELS[lang];
  const inquiryPath = PATHS.inquiry[lang];
  const alternates = {};
  for (const l of LANGUAGES) alternates[l] = PATHS.inquiry[l];
  const canonicalUrl = `https://teske-systemtechnik.de${inquiryPath}`;

  // Service slug → human name map for prefill
  const servicesMapJs = SERVICES.map(s => `      '${s.inquirySlug}': ${JSON.stringify(s.i18n[lang].title)}`).join(',\n');

  const langSwitcher = languageSwitcher(lang, alternates);

  return `<!DOCTYPE html>
<html lang="${L.htmlLang}" class="scroll-smooth">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">

  ${maintenanceGuard()}
  <meta name="robots" content="noindex,follow">

  <title>${I.heading} · Teske Systemtechnik</title>
  <meta name="description" content="${I.intro}">

  <link rel="canonical" href="${canonicalUrl}">
  <link rel="icon" type="image/svg+xml" href="/static/images/logo_favicon.svg">
  <link rel="preconnect" href="https://forminit.com" crossorigin>
  <link rel="preload" href="/static/fonts/aspekta/Aspekta-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/static/fonts/aspekta/Aspekta-650.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/static/css/vendors/aos.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/static/css/vendors/aos.css"></noscript>
  <link rel="stylesheet" href="/static/css/vendors/swiper-bundle.min.css">
  <link rel="stylesheet" href="/static/style.css?v=20260521a">
  <link rel="stylesheet" href="/static/css/site.css?v=20260521a">
</head>

<body class="font-inter antialiased bg-stone-950 text-stone-100 tracking-tight selection:bg-orange-500/40 selection:text-white">
<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-orange-500 focus:px-4 focus:py-2 focus:text-white">${L.skipToContent}</a>

<div class="flex min-h-screen flex-col">

${header(lang, inquiryPath, langSwitcher)}

<main id="main-content" class="grow">

  <section class="relative pt-32 pb-24 md:pt-44 md:pb-32">
    <div class="mx-auto max-w-3xl px-4 sm:px-6">

      <div class="mb-12" data-aos="fade-up">
        <p class="mb-6 inline-flex items-center gap-3 font-aspekta text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
          <span class="section-num">000 /</span>
          ${I.eyebrow}
        </p>
        <h1 class="font-aspekta text-4xl font-bold leading-tight text-white md:text-5xl">${I.heading}</h1>
        <p class="mt-6 max-w-xl text-lg text-stone-300">${I.intro}</p>
      </div>

      <form id="inquiry-form" method="POST" novalidate
            class="rounded-3xl border border-stone-800 bg-stone-900/40 p-6 md:p-10" data-aos="fade-up" data-aos-delay="120">

        <div class="grid gap-5">

          <div>
            <label class="mb-1 block text-sm font-medium text-stone-300" for="inquiry-project">${I.fieldProject}</label>
            <input id="inquiry-project" type="text" name="fi-text-project" required
                   class="w-full rounded-lg border border-stone-700 bg-stone-950/60 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 transition focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                   placeholder="${I.fieldProjectPlaceholder}">
            <p id="inquiry-project-hint" class="mt-1.5 text-xs text-stone-500"></p>
          </div>

          <div>
            <div class="mb-1 flex items-baseline justify-between gap-4">
              <label class="block text-sm font-medium text-stone-300" for="inquiry-budget">${I.fieldBudget}</label>
              <span id="inquiry-budget-min" class="text-xs text-stone-500"></span>
            </div>
            <div class="relative">
              <input id="inquiry-budget" type="number" name="fi-text-budget" required min="0" step="100" inputmode="numeric"
                     class="w-full rounded-lg border border-stone-700 bg-stone-950/60 px-4 py-3 pr-12 text-sm text-stone-100 placeholder-stone-500 transition focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                     placeholder="3500">
              <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-500">€</span>
            </div>
            <p id="inquiry-budget-error" class="mt-1.5 hidden text-xs text-orange-400" role="alert"></p>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-300" for="inquiry-name">${I.fieldName}</label>
              <input id="inquiry-name" type="text" name="fi-sender-firstName" required autocomplete="name"
                     class="w-full rounded-lg border border-stone-700 bg-stone-950/60 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 transition focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                     placeholder="${I.placeholderName}">
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-300" for="inquiry-email">${I.fieldEmail}</label>
              <input id="inquiry-email" type="email" name="fi-sender-email" required autocomplete="email"
                     class="w-full rounded-lg border border-stone-700 bg-stone-950/60 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 transition focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                     placeholder="${I.placeholderEmail}">
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-stone-300" for="inquiry-company">${I.fieldCompany} <span class="text-stone-500">${I.optionalSuffix}</span></label>
            <input id="inquiry-company" type="text" name="fi-text-company" autocomplete="organization"
                   class="w-full rounded-lg border border-stone-700 bg-stone-950/60 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 transition focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                   placeholder="${I.placeholderCompany}">
          </div>

          <div>
            <div class="mb-1 flex items-baseline justify-between">
              <label class="block text-sm font-medium text-stone-300" for="inquiry-message">${I.fieldMessage}</label>
              <span class="text-xs text-stone-500">${I.messageMax}</span>
            </div>
            <textarea id="inquiry-message" name="fi-text-message" rows="6" maxlength="1000" required
                      class="w-full resize-none rounded-lg border border-stone-700 bg-stone-950/60 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 transition focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      placeholder="${I.placeholderMessage}"></textarea>
          </div>

        </div>

        <p id="inquiry-result" class="mt-4 hidden text-sm" role="status" aria-live="polite"></p>

        <button id="inquiry-submit" type="submit"
                class="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:opacity-70 disabled:cursor-not-allowed">
          <span id="inquiry-submit-text">${I.submit}</span>
        </button>

        <p class="mt-4 text-center text-xs text-stone-500">${I.privacyNote1}<a class="text-amber-400 underline hover:text-amber-300" href="${PATHS.privacy[lang]}">${I.privacyLinkText}</a>${I.privacyNote2}</p>
      </form>

    </div>
  </section>

</main>

${footer(lang)}

</div>

${scriptsFooter()}
<script src="https://forminit.com/sdk/v1/forminit.js"></script>

<script>
  (function () {
    var SERVICES_MAP = {
${servicesMapJs}
    };
    var LOCALE = '${I.locale}';
    var ERR_PREFIX = ${JSON.stringify(I.budgetErrorPrefix)};
    var ERR_SUFFIX = ${JSON.stringify(I.budgetErrorSuffix)};
    var MIN_PREFIX = ${JSON.stringify(I.minPrefix)};
    var MSG_SUCCESS = ${JSON.stringify(I.submitSuccess)};
    var MSG_ERROR = ${JSON.stringify(I.submitError)};
    var FORMINIT_FORM_ID = '7u05vqgqcf7';

    var params = new URLSearchParams(location.search);
    var slug = params.get('service');
    var minRaw = params.get('min');
    var minBudget = minRaw ? parseInt(minRaw, 10) : 0;

    var projectField = document.getElementById('inquiry-project');
    var projectHint = document.getElementById('inquiry-project-hint');
    var budgetField = document.getElementById('inquiry-budget');
    var budgetMinLabel = document.getElementById('inquiry-budget-min');
    var budgetError = document.getElementById('inquiry-budget-error');
    var form = document.getElementById('inquiry-form');
    var submitBtn = document.getElementById('inquiry-submit');
    var resultEl = document.getElementById('inquiry-result');

    if (slug && SERVICES_MAP[slug]) {
      projectField.value = SERVICES_MAP[slug];
      projectField.readOnly = true;
      projectField.classList.add('bg-stone-900/80', 'cursor-not-allowed');
      projectHint.textContent = ${JSON.stringify(I.fieldProjectPrefillNote)};
      projectField.addEventListener('focus', function () {
        projectField.readOnly = false;
        projectField.classList.remove('bg-stone-900/80', 'cursor-not-allowed');
        projectHint.textContent = '';
      });
    }

    if (minBudget > 0) {
      budgetField.min = String(minBudget);
      budgetField.value = String(minBudget);
      budgetField.placeholder = String(minBudget);
      budgetMinLabel.textContent = MIN_PREFIX + ': ' + minBudget.toLocaleString(LOCALE) + ' €';
    }

    function validateBudget() {
      var v = parseInt(budgetField.value, 10);
      if (minBudget > 0 && (isNaN(v) || v < minBudget)) {
        budgetError.textContent = ERR_PREFIX + ' ' + minBudget.toLocaleString(LOCALE) + ' € ' + ERR_SUFFIX;
        budgetError.classList.remove('hidden');
        budgetField.classList.add('border-orange-500');
        return false;
      }
      budgetError.classList.add('hidden');
      budgetField.classList.remove('border-orange-500');
      return true;
    }
    budgetField.addEventListener('input', validateBudget);
    budgetField.addEventListener('blur', validateBudget);

    function showResult(ok) {
      if (!resultEl) return;
      resultEl.textContent = ok ? MSG_SUCCESS : MSG_ERROR;
      resultEl.className = 'mt-4 text-sm ' + (ok ? 'text-emerald-400' : 'text-orange-400');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateBudget()) { budgetField.focus(); return; }
      if (!form.checkValidity()) { form.reportValidity(); return; }

      if (submitBtn) submitBtn.disabled = true;
      if (resultEl) resultEl.classList.add('hidden');

      try {
        var forminit = new window.Forminit();
        forminit.submit(FORMINIT_FORM_ID, new FormData(form))
          .then(function (result) {
            if (result && result.error) { showResult(false); if (submitBtn) submitBtn.disabled = false; return; }
            if (result && result.redirectUrl) { location.href = result.redirectUrl; return; }
            showResult(true);
            form.reset();
            if (submitBtn) submitBtn.disabled = false;
          })
          .catch(function () { showResult(false); if (submitBtn) submitBtn.disabled = false; });
      } catch (err) {
        showResult(false);
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  })();
</script>

</body>
</html>
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

let count = 0;

console.log('=== Service detail pages ===');
for (const service of SERVICES) {
  for (const lang of LANGUAGES) {
    const path = `${OVERVIEW_PATHS[lang].slice(1)}${service.urlSlugs[lang]}/index.html`;
    writeFile(path, renderServicePage(service, lang));
    count++;
  }
}

console.log('\n=== Overview pages ===');
for (const lang of LANGUAGES) {
  const path = `${OVERVIEW_PATHS[lang].slice(1)}index.html`;
  writeFile(path, renderOverviewPage(lang));
  count++;
}

console.log('\n=== Inquiry pages ===');
for (const lang of LANGUAGES) {
  const path = `${PATHS.inquiry[lang].slice(1)}index.html`;
  writeFile(path, renderInquiryPage(lang));
  count++;
}

console.log(`\nDone: ${count} files generated.`);
