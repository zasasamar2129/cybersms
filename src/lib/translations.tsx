/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'fa';

export const i18nDict = {
  en: {
    // Nav Modules labels
    overview: 'OVERVIEW',
    contacts: 'CONTACT ENGINE',
    templates: 'TEMPLATE BUILDER',
    campaigns: 'SMS CAMPAIGNS',
    monitor: 'LIVE MONITOR',
    logs: 'SYSTEM LOGS',
    settings: 'CONFIG PORT',
    admin_panel: 'SECURITY FLEET',
    nav_modules: 'NAV MODULES',
    interface_mode: 'INTERFACE MODE',
    language_mode: 'LANGUAGE / زبان',
    online: 'ONLINE',
    offline: 'OFFLINE',
    disconnect_session: 'Disconnect terminal session',

    // Dashboard HUD overlay
    campaign_completed: 'CAMPAIGN COMPLETED',
    campaign_terminated: 'CAMPAIGN TERMINATED',
    success_dispatches: 'SUCCESS DISPATCHES',
    failed_terminations: 'FAILED TERMINATIONS',
    completion_signature: 'COMPLETION SIGNATURE',
    dismiss_hud: 'DISMISS HUD',
    view_telemetry: 'VIEW TELEMETRY',

    // Overview components
    telemetry_summary: 'TELEMETRY SUMMARY',
    core_system_metrics: 'Core system metrics',
    simulated_warning: 'SIMULATION ENVIRONMENT ACTIVE (DRY RUN MODE)',
    simulated_warning_desc: 'All outbound dispatches are handled in simulated queues. No live carriers billing units will be exhausted.',
    active_connections: 'ACTIVE PIPELINES',
    live_gateways: 'LIVE GATEWAYS',
    database_sync: 'DATABASE PAYLOADS SYNCED',
    contacts_count: 'VALID SUBSCRIBERS',
    templates_count: 'COMPILED TRANSLATIONS',
    dispatch_success: 'SUCCESS OUTBOX',
    dispatch_error: 'CARRIER HARD BOUNCES',
    quick_campaign_btn: 'INITIALIZE QUICK OUTBOX',
    system_terminal: 'SYSTEM TERMINAL OUTBOX STREAM',
    latest_dispatched_packets: 'LATEST DISPATCHED PACKETS',
    all_systems_green: 'ALL CARRIER CORES RESPONDING NATIVE',
    no_logs_found: 'No activities logged in the queue.',
    
    // Config Page
    api_gateway_desc: 'API gateway endpoints & parameters',
    config_server: '1. CONSOLE BACKEND INTERFACES',
    android_gateway: '2. ANDROID LOCAL SMGATEWAY SUITE',
    gateway_url_label: 'LOCAL IP ENDPOINT GATEWAY ADDRESS',
    gateway_url_hint: 'The local REST API bind url exposed by the Android APK gateway service (e.g. http://192.168.1.50:8082/)',
    security_token_label: 'X-GATEWAY HEADER ENDPOINT TOKEN',
    security_token_hint: 'Optional credential verification token corresponding to your Android APK suite options passcode',
    default_delay_label: 'DEFAULT PACING SPACE (SECONDS)',
    default_delay_hint: 'Rate limiting protection. Controls interval between successive push operations to prevent mobile operator warnings.',
    success_image_label: 'CAMPAIGN SUCCESS POPUP ILLUSTRATION URL',
    failure_image_label: 'CAMPAIGN FAILURE POPUP ILLUSTRATION URL',
    image_hints: 'Optional asset url to override default glowing icons during completion popups',
    save_config_btn: 'COMMIT PERSISTED SETTINGS',
    saving_status: 'PERSISTING...',
    revert_status: 'REVERT MODS',
    ping_success: 'GATEWAY PING DISPATCHED SUCCESSFULLY',
    ping_failed: 'GATEWAY UNREACHABLE - CHECK BIND ENDPOINT',

    // Contact manager
    contact_engine_desc: 'Upload & tag subscriber lists',
    add_subscriber: 'REGISTER NEW SUBSCRIBER',
    batch_delete: 'TERMINATE SELECTED',
    import_contacts: 'IMPORT CSV/TXT REGISTRY',
    paste_raw_placeholder: 'Paste raw subscriber rows here, e.g.:\nJohn Doe, +989123456789, VIP\nSarah Smith, +15550199',
    submit_import: 'PARSE & BULK DISPATCH',
    name_label: 'SUBSCRIBER ALIAS',
    phone_label: 'DESTINATION PHONE NUMBER',
    tags_label: 'CATEGORIES (COMMA SEPARATED)',
    add_contact_btn: 'COMMIT REGISTERED RECORD',
    search_subscribers: 'SEARCH SUBSCRIBER REGISTRY...',
    tag_filter: 'TAG METRIC SELECTOR',
    no_contacts_found: 'No active subscribers matching selected filters.',

    // Template builder
    template_builder_desc: 'Variables & AI helpers',
    create_template: 'GENERATE CORRESPONDENCE TEMPLATE',
    template_name: 'TEMPLATE IDENTIFICATION LABEL',
    template_body: 'SMS MESSAGE TEMPLATE PAYLOAD',
    hint_variables: 'Use system placeholder keys with braces, e.g. {name}, {phone}, or custom CSV column keys. They will map dynamically!',
    optimize_ai: 'OPTIMIZE COMPOSITION VIA AI',
    optimizing_ai: 'CONSULTING GEMINI CORES...',
    transcribe_voice: 'TRANSCRIBE AUDIO DATA',
    recording: 'LISTENING RECEPTIVE DEVICE...',
    speak_now: 'SPEAK CLEARLY NOW...',
    save_template: 'STORE COMPILED TEMPLATE',
    no_templates: 'No template blueprints stored in cache memory.',

    // SMS Campaigns
    target_distribution: 'Target distribution hubs',
    init_campaign: 'INITIALIZE CAMPAIGN PIPELINE',
    campaign_name: 'CAMPAIGN OPERATIONAL NAME',
    select_template_comp: 'SELECT CORRESPONDENCE BLUEPRINT',
    recipient_tag: 'RECIPIENT FILTER TAG',
    custom_delay_space: 'CUSTOM RATE LIMITING PACING SPEED (SECONDS)',
    start_engine: 'DISPATCH AIRWAVE PROPAGATION',
    duplicating: 'DUPLICATING...',
    duplicate: 'CLONE',
    terminated_caps: 'TERMINATED',
    completed_caps: 'COMPLETED',
    sending_caps: 'SENDING',
    created_caps: 'PENDING',
    active_since: 'ACTIVE SINCE',
    success_rate: 'DISPATCH EFFICIENCY',
    failed_rate: 'DELIVERY DROPOUT',
    stop_signal: 'HALT CAMPAIGN TRANSMISSION',

    // Live Monitor
    live_telemetry_loops: 'Realtime telemetry loops',
    live_title: 'TELEMETRY NETWORK SPECTRUM',
    sub_title: 'SMS OUTBOUND MONITOR STREAM',
    pulse_indicator: 'LIVE PIPELINE PULSE',
    network_speed: 'PROPAGATION SPEED',
    active_since_short: 'ACTIVE SINCE',
    completed_runs: 'COMPLETED HUBS',
    processed_packets: 'PROCESSED PACKETS',
    no_active: 'No active campaigns transmitting payload logs to the telemetry spectrum. Trigger a campaign from the outbound panel.',
    live_outflow_logs: 'LIVE TELEMETRY OUTFLOW LOGS',

    // Logs Page
    csv_log_archives: 'CSV log archives',
    log_terminal: 'TRANSMISSION PROTOCOL LOGS',
    export_csv: 'EXPORT ARCHIVES (CSV)',
    search_logs: 'SEARCH LOG ENTRIES...',
    filter_status: 'DISPATCH STATE',
    filter_level: 'LOG FILTER LEVEL',
    all_levels: 'ALL LEVELS',
    info_level: 'INFO LEVEL',
    warning_level: 'WARNING LEVEL',
    error_level: 'ERROR LEVEL',
    timestamp: 'TIMESTAMP',
    level: 'LEVEL',
    campaign: 'CAMPAIGN',
    subscriber: 'SUBSCRIBER',
    destination: 'DESTINATION',
    payload: 'PAYLOAD',
    status: 'STATUS',
    error_reason: 'ERROR REASON / SIGNATURE',
    copy_curl: 'COPY GATEWAY CURL'
  },
  fa: {
    // Nav Modules labels
    overview: 'بررسی اجمالی',
    contacts: 'موتور مخاطبین',
    templates: 'قالب‌ساز هوشمند',
    campaigns: 'کمپین‌های پیامکی',
    monitor: 'مانیتور زنده',
    logs: 'لاگ‌های سیستم',
    settings: 'پورت تنظیمات',
    admin_panel: 'امنیت و پروفایل',
    nav_modules: 'ماژول‌های ناوبری',
    interface_mode: 'حالت رابط کاربری',
    language_mode: 'زبان / LANGUAGE',
    online: 'برخط (آنلاین)',
    offline: 'آفلاین',
    disconnect_session: 'قطع اتصال نشست ترمینال',

    // Dashboard HUD overlay
    campaign_completed: 'کمپین با موقعیت تکمیل شد',
    campaign_terminated: 'کمپین متوقف شد',
    success_dispatches: 'ارسال‌های موفق',
    failed_terminations: 'ارسال‌های ناموفق / خطا',
    completion_signature: 'امضای امنیتی نهایی',
    dismiss_hud: 'بستن اعلان',
    view_telemetry: 'مشاهده تله‌متری زنده',

    // Overview components
    telemetry_summary: 'خلاصه تله‌متری سیستم',
    core_system_metrics: 'معیارهای اصلی سیستم سایبری',
    simulated_warning: 'محیط شبیه‌سازی فعال است (حالت تست بدون هزینه)',
    simulated_warning_desc: 'تمام پیامک‌های خروجی در صف‌های شبیه‌سازی‌شده مدیریت می‌شوند و از شارژ سیم‌کارت واقعی شما کسر نخواهد شد.',
    active_connections: 'کمپین‌های فعال جریان',
    live_gateways: 'درگاه‌های زنده متصل',
    database_sync: 'داده‌های پایگاه همگام‌سازی شد',
    contacts_count: 'کل مشترکین معتبر',
    templates_count: 'الگوهای کامپایل شده',
    dispatch_success: 'ارسال‌های موفق خروجی',
    dispatch_error: 'خطاهای سخت افزاری اپراتور',
    quick_campaign_btn: 'راه‌اندازی ارسال سریع پیامک',
    system_terminal: 'جریان لاگ‌های زنده ترمینال خروجی',
    latest_dispatched_packets: 'آخرین بسته‌های ارسالی سیستم',
    all_systems_green: 'همه هسته‌های اپراتورها در وضعیت سبز و نرمال هستند',
    no_logs_found: 'هیچ فعالیتی در صف ثبت نشده است.',

    // Config Page
    api_gateway_desc: 'پیکربندی آدرس‌ها و پارامترهای درگاه',
    config_server: '۱. واسط‌های بک‌اند کنسول کنترل',
    android_gateway: '۲. درگاه محلی اپلیکیشن اندروید',
    gateway_url_label: 'آدرس آی‌پی (IP) اتصال درگاه اندروید',
    gateway_url_hint: 'آدرس REST API محلی که توسط اپلیکیشن اندروید شما به اشتراک گذاشته شده است (نمونه: http://192.168.1.50:8082/)',
    security_token_label: 'توکن امنیتی هدر درگاه (X-GATEWAY)',
    security_token_hint: 'توکن اختیاری تطبیق امنیتی با رمز عبور تنظیم‌شده در اپلیکیشن اندروید شما',
    default_delay_label: 'فاصله‌گذاری پیش‌فرض ارسال (ثانیه) - DEFAULT PACING SPACE',
    default_delay_hint: 'محافظت از مسدود شدن سیم‌کارت. فاصله زمانی بین ارسال پیامک‌های پیاپی را جهت جلوگیری از هشدارهای اپراتوری تنظیم می‌کند.',
    success_image_label: 'آدرس تصویر/گیف اعلان موفقیت کمپین',
    failure_image_label: 'آدرس تصویر/گیف اعلان شکست/خطای کمپین',
    image_hints: 'آدرس دلخواه تصویر برای جایگزینی انیمیشن‌های پیش‌فرض در پنجره‌های اعلان پاپ‌آپ سیستم',
    save_config_btn: 'ذخیره و ثبت تنظیمات پورت',
    saving_status: 'در حال ذخیره‌سازی...',
    revert_status: 'بازنشانی تغییرات',
    ping_success: 'تست اتصال درگاه با موفقیت ارسال شد',
    ping_failed: 'درگاه غیرقابل دسترس است - آدرس آی‌پی یا توکن را بررسی کنید',

    // Contact manager
    contact_engine_desc: 'بارگذاری، ثبت و برچسب‌گذاری مشترکین پیامکی',
    add_subscriber: 'ثبت مشترک جدید به صورت دستی',
    batch_delete: 'حذف موارد انتخاب‌شده',
    import_contacts: 'وارد کردن گروهی از طریق فرمت CSV / متن خام',
    paste_raw_placeholder: 'ردیف‌های مخاطبین را به صورت خام در اینجا وارد کنید. نمونه:\nعلی محمدی, +989123456789, VIP\nسارا احمدی, +15550199',
    submit_import: 'آنالیز و وارد کردن مخاطبین',
    name_label: 'نام / شناسه مشترک',
    phone_label: 'شماره تلفن مقصد',
    tags_label: 'برچسب‌ها (با کاما جدا شوند)',
    add_contact_btn: 'ثبت و ذخیره مخاطب',
    search_subscribers: 'جستجو در آرشیو مشترکین...',
    tag_filter: 'فیلتر برچسب',
    no_contacts_found: 'هیچ مشترکی متناسب با فیلترهای جستجو یافت نشد.',

    // Template builder
    template_builder_desc: 'ساخت قالب‌های پویا با کمک هسته صوتی و هوش مصنوعی',
    create_template: 'ایجاد قالب پیامکی جدید',
    template_name: 'عنوان اختصاصی برچسب قالب',
    template_body: 'متن پیامک الگو (قالب اصلی)',
    hint_variables: 'از متغیرها در کروشه استفاده کنید مثل {name}, {phone} تا به صورت خودکار برای هر مخاطب جایگزین شوند.',
    optimize_ai: 'بهینه‌سازی متن با هوش مصنوعی (Gemini)',
    optimizing_ai: 'در حال نگارش متن ارزشمند پیامک توسط جمینی...',
    transcribe_voice: 'تبدیل گفتار به متن پویا',
    recording: 'سیستم آماده شنیدن صدای شماست...',
    speak_now: 'شروع به صحبت کنید...',
    save_template: 'ذخیره قالب پیامکی',
    no_templates: 'هیچ قالب پیامکی در حافظه حافظه کش یافت نشد.',

    // SMS Campaigns
    target_distribution: 'توزیع و ارسال انبوه به مخاطبان هدف',
    init_campaign: 'راه‌اندازی لوله ارسال کمپین جدید',
    campaign_name: 'نام کمپین عملیاتی',
    select_template_comp: 'انتخاب الگوی پیامک کمپین',
    recipient_tag: 'فیلتر هویتی مخاطبان بر اساس برچسب',
    custom_delay_space: 'فاصله‌گذاری دلخواه ارسال (ثانیه)',
    start_engine: 'شروع پخش سیگنال هوایی و ارسال پیامک‌ها',
    duplicating: 'در حال همگردانی...',
    duplicate: 'شبیه‌سازی و تکثیر',
    terminated_caps: 'متوقف شده',
    completed_caps: 'کامل شده',
    sending_caps: 'در حال ارسال',
    created_caps: 'در صف انتظار',
    active_since: 'فعال از زمان',
    success_rate: 'کارایی ارسال کمپین',
    failed_rate: 'ریزش و عدم ارسال',
    stop_signal: 'توقف ارسال کمپین پیامکی',

    // Live Monitor
    live_telemetry_loops: 'پایش تله‌متری مستقیم شبکه‌های پرتاب پیامک',
    live_title: 'چشم‌انداز جریان ماهواره‌ای ارسال',
    sub_title: 'صف تله‌متری زنده پایش پیامک‌های کمپین',
    pulse_indicator: 'پالس فعال شبکه تله‌متری زنده',
    network_speed: 'سرعت تراکنش هوایی پیامک',
    active_since_short: 'شروع پایش',
    completed_runs: 'کمپین‌های خاتمه یافته',
    processed_packets: 'بسته‌های پردازش شده',
    no_active: 'در حال حاضر هیچ کمپین فعالی در حال اجرای زنده نیست. یک کمپین را از پنل ارسال برای ضبط زنده آغاز کنید.',
    live_outflow_logs: 'آرشیو زنده جریان تله‌متری',

    // Logs Page
    csv_log_archives: 'آرشیو دانلود مستقیم فایل‌های لاگ CSV',
    log_terminal: 'پروتکل ثبت رویدادهای زنده سیستم کنترل پیامکی',
    export_csv: 'دریافت خروجی اکسل (CSV)',
    search_logs: 'جستجو در لاگ‌های سیستمی...',
    filter_status: 'وضعیت لاگ',
    filter_level: 'سطح رویداد',
    all_levels: 'همه سطوح',
    info_level: 'اطلاعات معمولی (INFO)',
    warning_level: 'هشدارها (WARN)',
    error_level: 'خطاها (ERROR)',
    timestamp: 'زمان ثبت رویداد',
    level: 'سطح لاگ',
    campaign: 'کمپین مربوطه',
    subscriber: 'نام مشترک',
    destination: 'شماره مقصد',
    payload: 'متن ارسالی',
    status: 'وضعیت',
    error_reason: 'علت خطا / امضای خطای سرور',
    copy_curl: 'کپی متن دستور CURL'
  }
} as const;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof i18nDict.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const cached = localStorage.getItem('sms_cyber_lang');
    return (cached === 'fa' || cached === 'en') ? cached as Language : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sms_cyber_lang', lang);
  };

  useEffect(() => {
    // Set HTML Dir attribute dynamically depending on selected language
    if (language === 'fa') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'fa';
      document.body.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
      document.body.dir = 'ltr';
    }
  }, [language]);

  const t = (key: keyof typeof i18nDict.en): string => {
    const val = i18nDict[language]?.[key] || i18nDict.en[key];
    return val || (key as string);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
