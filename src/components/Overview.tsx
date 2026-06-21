/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Send, 
  CheckCircle, 
  XCircle, 
  Play, 
  Activity, 
  Zap, 
  ShieldAlert, 
  Database,
  Smartphone,
  Info
} from 'lucide-react';
import { DashboardStats, SmsLog, Campaign } from '../types.js';
import { useLanguage } from '../lib/translations.tsx';

interface OverviewProps {
  stats: DashboardStats;
  logs: SmsLog[];
  campaigns: Campaign[];
  isDarkMode: boolean;
  onNavigateTab: (tab: string) => void;
  onQuickStartCampaign: () => void;
  dryRun: boolean;
}

export default function Overview({
  stats,
  logs,
  campaigns,
  isDarkMode,
  onNavigateTab,
  onQuickStartCampaign,
  dryRun
}: OverviewProps) {
  const { t, language } = useLanguage();

  // Group latest logs for quick display in core console
  const recentLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  
  // Group counts for active pipelines
  const activeCampList = campaigns.filter(c => c.status === 'sending');

  return (
    <div className="space-y-6">
      
      {/* Simulation Info Warning Banner */}
      {dryRun && (
        <div className="relative overflow-hidden rounded-xl border border-teal-500/40 bg-teal-950/20 p-4 flex items-start gap-3.5 shadow-sm">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none"></div>
          <div className="p-2 bg-teal-900/40 rounded-lg border border-teal-500/40 shrink-0">
            <Info className="w-5 h-5 text-teal-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-bold text-teal-300 font-sans tracking-wider uppercase mb-0.5">
              {t('simulated_warning')}
            </h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              {t('simulated_warning_desc')}
            </p>
          </div>
        </div>
      )}

      {/* Cyber stats grid with staggered animation */}
      <motion.div 
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.04
            }
          }
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        
        {/* Total Contacts block */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, scale: 0.95, y: 10 },
            show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
          }}
          whileHover={{ y: -3, scale: 1.025, border: '1px solid rgba(20, 184, 166, 0.25)', boxShadow: '0 10px 25px -5px rgba(20, 184, 166, 0.08)' }}
          className={`p-5 rounded-2xl border transition-colors duration-200 ${
            isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>{language === 'fa' ? 'مجموع مخاطبین' : 'CONTACT HUB'}</span>
            <div className="p-2 rounded bg-cyan-500/10 text-cyan-450 dark:text-cyan-400 border border-cyan-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-3xl font-black font-mono tracking-tight ${
              isDarkMode ? 'text-slate-100' : 'text-slate-900'
            }`}>{stats.totalContacts}</h3>
            <p className={`text-[11px] font-sans mt-1 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>{language === 'fa' ? 'مشترکین ثبت‌شده پیامک' : 'Stored phone registers'}</p>
          </div>
        </motion.div>

        {/* Sent Today block */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, scale: 0.95, y: 10 },
            show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
          }}
          whileHover={{ y: -3, scale: 1.025, border: '1px solid rgba(20, 184, 166, 0.25)', boxShadow: '0 10px 25px -5px rgba(20, 184, 166, 0.08)' }}
          className={`p-5 rounded-2xl border transition-colors duration-200 ${
            isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>{language === 'fa' ? 'ارسال‌های امروز' : 'SENT TODAY'}</span>
            <div className="p-2 rounded bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/20">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-3xl font-black font-mono tracking-tight ${
              isDarkMode ? 'text-slate-100' : 'text-slate-900'
            }`}>{stats.sentToday}</h3>
            <p className={`text-[11px] font-sans mt-1 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>{language === 'fa' ? 'پیامک‌های منتقل شده' : 'Dispatched payloads'}</p>
          </div>
        </motion.div>

        {/* Success Rate block */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, scale: 0.95, y: 10 },
            show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
          }}
          whileHover={{ y: -3, scale: 1.025, border: '1px solid rgba(16, 185, 129, 0.25)', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.08)' }}
          className={`p-5 rounded-2xl border transition-colors duration-200 ${
            isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>{language === 'fa' ? 'نرخ موفقیت' : 'SUCCESS RATE'}</span>
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-3xl font-black font-mono tracking-tight ${
              isDarkMode ? 'text-slate-100' : 'text-slate-900'
            }`}>
              {stats.successRate}%
            </h3>
            <div className={`w-full h-1 rounded overflow-hidden mt-1.5 ${
              isDarkMode ? 'bg-slate-800/40' : 'bg-slate-200'
            }`}>
              <div 
                className="bg-emerald-405 h-full rounded transition-all duration-500" 
                style={{ width: `${stats.successRate}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* Failed Today block */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, scale: 0.95, y: 10 },
            show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
          }}
          whileHover={{ y: -3, scale: 1.025, border: '1px solid rgba(244, 63, 94, 0.25)', boxShadow: '0 10px 25px -5px rgba(244, 63, 94, 0.08)' }}
          className={`p-5 rounded-2xl border transition-colors duration-200 ${
            isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>{language === 'fa' ? 'ارسال ناموفق' : 'FAILED DELIVERIES'}</span>
            <div className="p-2 rounded bg-rose-500/10 text-rose-500 dark:text-rose-455 border border-rose-505/20">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-3xl font-black font-mono tracking-tight ${
              isDarkMode ? 'text-slate-100' : 'text-slate-900'
            }`}>{stats.failedToday}</h3>
            <p className={`text-[11px] font-sans mt-1 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>{language === 'fa' ? 'نیاز به تلاش مجدد' : 'Requires re-attempts'}</p>
          </div>
        </motion.div>

        {/* Active Campaigns block */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, scale: 0.95, y: 10 },
            show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
          }}
          whileHover={{ y: -3, scale: 1.025, border: '1px solid rgba(245, 158, 11, 0.25)', boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.08)' }}
          className={`p-5 rounded-2xl border transition-colors duration-200 ${
            isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>{language === 'fa' ? 'کانال‌های فعال' : 'ACTIVE TUNNELS'}</span>
            <div className="p-2 rounded bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-3xl font-black font-mono tracking-tight ${
              isDarkMode ? 'text-slate-100' : 'text-slate-900'
            }`}>{stats.activeCampaigns}</h3>
            <p className={`text-[11px] font-sans mt-1 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>{language === 'fa' ? 'ارسال همزمان فعال' : 'Parallel triggers active'}</p>
          </div>
        </motion.div>

      </motion.div>

      {/* Main Core telemetry and stats grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Live Analytics Chart */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border flex flex-col justify-between ${
          isDarkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className={`text-xs font-bold font-sans tracking-widest ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-800'
                }`}>{language === 'fa' ? 'گاه‌شمار توزیع و ترافیک فرکانس' : 'SYSTEM DISPATCH CHRONOLOGY'}</h3>
                <p className={`text-[11px] font-mono mt-1 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>{language === 'fa' ? 'پایش لحظه‌ای میزان بار تراکنش درگاه' : 'Standard network load telemetry'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                <span className={`text-[10px] font-mono tracking-widest ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>{language === 'fa' ? 'وضعیت تونل: پایدار و امن' : 'TUNNEL STATUS: SECURE'}</span>
              </div>
            </div>

            {/* Custom Responsive SVG Telemetry Chart */}
            <div className="w-full h-56 mt-4 relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Horizontal Guide lines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke={isDarkMode ? "#334155" : "#cbd5e1"} strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1="0" y1="90" x2="500" y2="90" stroke={isDarkMode ? "#334155" : "#cbd5e1"} strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1="0" y1="140" x2="500" y2="140" stroke={isDarkMode ? "#334155" : "#cbd5e1"} strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1="0" y1="190" x2="500" y2="190" stroke={isDarkMode ? "#475569" : "#94a3b8"} strokeWidth="1" />

                {/* Plot Area Area */}
                <path 
                  d="M 0 190 Q 75 120 120 150 T 250 80 T 380 110 T 500 40 L 500 190 Z" 
                  fill="url(#neonGradient)" 
                />

                {/* Plot path trace */}
                <path 
                  d="M 0 190 Q 75 120 120 150 T 250 80 T 380 110 T 500 40" 
                  fill="none" 
                  stroke="#14b8a6" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                />

                {/* Hot beacons dots */}
                <circle cx="250" cy="80" r="5" fill="#2dd4bf" stroke={isDarkMode ? "#042f2e" : "#f8fafc"} strokeWidth="2" />
                <circle cx="500" cy="40" r="5" fill="#2dd4bf" stroke={isDarkMode ? "#042f2e" : "#f8fafc"} strokeWidth="2" />
              </svg>

              {/* Text Labels overlaid */}
              <div className={`absolute top-2 left-2 rtl:left-auto rtl:right-2 text-[10px] font-mono ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>{language === 'fa' ? 'اوج ترافیک شبکه (معمولی)' : 'Peak Load (Normal)'}</div>
              <div className="absolute bottom-1 right-2 rtl:right-auto rtl:left-2 text-[10px] font-mono text-teal-605 font-bold">{language === 'fa' ? '۵۶۰ میلی‌ثانیه زمان پاسخ' : '560 ms API Ping'}</div>
            </div>
            
            <div className={`flex items-center justify-between text-[11px] font-mono mt-3 pt-3 border-t ${
              isDarkMode ? 'text-slate-400 border-slate-800/40' : 'text-slate-500 border-slate-200'
            }`}>
              <span>{language === 'fa' ? '۰۸:۰۰ صبح' : '08:00 AM'}</span>
              <span>{language === 'fa' ? '۱۲:۰۰ ظهر' : '12:00 PM'}</span>
              <span>{language === 'fa' ? '۰۴:۰۰ عصر' : '04:00 PM'}</span>
              <span>{language === 'fa' ? '۰۸:۰۰ شب' : '08:00 PM'}</span>
              <span>{language === 'fa' ? '۱۲:۰۰ شب (زنده)' : '12:00 AM (Live)'}</span>
            </div>
          </div>
          
          <div className={`mt-4 p-3 rounded-xl border flex align-center justify-between ${
            isDarkMode ? 'bg-slate-950/40 border-slate-800/55 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <span className="text-[11px] flex items-center gap-1.5 leading-relaxed font-sans">
              <Zap className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400 animate-pulse shrink-0" />
              {language === 'fa' 
                ? 'درگاه محلی اندروید به طور متوسط در ۱.۸ ثانیه پاسخ می‌دهد. سیستم تلاش مجدد دارای ۲ فاز امنیتی است.' 
                : 'Android Gateway responds inside 1.8 seconds average. Auto-retry engine holds 2 max safety passes.'}
            </span>
          </div>
        </div>

        {/* Dispatch Console (Active Campaign Status Ticker & Quick actions) */}
        <div className="space-y-6">
          
          {/* Active Campaigns Module block */}
          <div className={`p-6 rounded-2xl border ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className={`text-xs font-bold font-sans tracking-widest mb-4 ${
              isDarkMode ? 'text-slate-300' : 'text-slate-800'
            }`}>{language === 'fa' ? 'کمپین‌های پیامکی زنده و فعال' : 'ACTIVE SMS CAMPAIGNS'}</h3>
            
            {activeCampList.length === 0 ? (
              <div className="py-6 text-center space-y-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto border border-dashed ${
                  isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-100 border-slate-300'
                }`}>
                  <Smartphone className="w-4 h-4 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>{language === 'fa' ? 'سیستم در انتظار' : 'SYSTEM IDLE'}</p>
                  <p className={`text-[11px] font-sans px-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{language === 'fa' ? 'هیچ کمپین ارسال پیامکی در حال حاضر فعال نیست.' : 'No bulk dispatch pipelines actively sending right now.'}</p>
                </div>
                <button
                  onClick={onQuickStartCampaign}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg active:scale-95 transition-all font-sans cursor-pointer"
                >
                  {language === 'fa' ? 'پیکربندی کمپین جدید' : 'Configure New Campaign'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeCampList.map(camp => {
                  const percent = camp.totalContacts > 0 ? Math.round((camp.sentCount / camp.totalContacts) * 100) : 0;
                  return (
                    <div key={camp.id} className={`p-3 border rounded-xl space-y-2 ${
                      isDarkMode ? 'bg-slate-950/40 border-slate-800/60' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold truncate pr-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{camp.name}</span>
                        <span className="text-[10px] font-mono font-medium text-emerald-605 uppercase animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-ping"></span>
                          {language === 'fa' ? 'در حال ارسال' : 'SENDING'}
                        </span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-850' : 'bg-slate-200'}`}>
                        <div className="bg-gradient-to-r from-teal-400 to-indigo-500 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                      </div>
                      <div className={`flex justify-between items-center text-[10px] font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-655'}`}>
                        <span>{percent}% {language === 'fa' ? 'ارسال شده' : 'Delivered'}</span>
                        <span>{camp.sentCount} / {camp.totalContacts} {language === 'fa' ? 'مخاطب' : 'Contacts'}</span>
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={() => onNavigateTab('monitor')}
                  className={`w-full py-2 border font-bold text-xs rounded-lg active:scale-95 transition-all font-sans cursor-pointer ${
                    isDarkMode ? 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  }`}
                >
                  {language === 'fa' ? 'مشاهده تله‌متری زنده' : 'Launch Operations Telemetry'}
                </button>
              </div>
            )}
          </div>

          {/* Quick Logs Terminal Section */}
          <div className={`p-6 rounded-2xl border ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xs font-bold font-sans tracking-widest ${
                isDarkMode ? 'text-slate-300' : 'text-slate-800'
              }`}>{language === 'fa' ? 'آخرین گزارشات لاگ ترانزاکشن' : 'REALTIME LOG PING'}</h3>
              <button 
                onClick={() => onNavigateTab('logs')}
                className="text-[10px] text-teal-500 dark:text-teal-400 hover:underline font-mono cursor-pointer font-bold"
              >
                {language === 'fa' ? 'بایگانی آرشیو' : 'ARCHIVES'}
              </button>
            </div>

            {recentLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 font-mono">
                {language === 'fa' ? '[در انتظار دریافت اولین رویداد...]' : '[WAITING FOR LOG EVENT INGEST...]'}
              </div>
            ) : (
              <div className="space-y-3 font-mono text-[10px]">
                {recentLogs.map((log) => (
                  <div key={log.id} className={`p-2 border rounded-lg flex flex-col gap-1 ${
                    isDarkMode ? 'bg-slate-950/30 border-slate-900 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>{log.phone}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                        log.status === 'sent' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-999/30' 
                          : 'bg-rose-50 text-rose-750 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-455 dark:border-rose-999/30'
                      }`}>
                        {log.status === 'sent' ? (language === 'fa' ? 'موفق' : 'SENT') : (language === 'fa' ? 'خطا' : 'FAILED')}
                      </span>
                    </div>
                    <p className={`font-sans truncate text-[11px] leading-snug ${
                      isDarkMode ? 'text-slate-405' : 'text-slate-655'
                    }`}>{log.message}</p>
                    <div className={`flex justify-between text-[8px] font-mono ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-450'
                    }`}>
                      <span>{log.campaignName}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
