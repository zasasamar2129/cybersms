/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Terminal, 
  Users, 
  FileCode2, 
  Radio, 
  Cpu, 
  History, 
  Settings, 
  LogOut, 
  Activity,
  User,
  Zap,
  Moon,
  Sun,
  Shield,
  Languages
} from 'lucide-react';
import { useLanguage } from '../lib/translations';

interface SidebarProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
  username: string;
  profilePhoto?: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  simulatedStats: { activeCampaigns: number };
}

export default function Sidebar({ 
  currentTab, 
  onChangeTab, 
  onLogout, 
  username = 'admin',
  profilePhoto,
  isDarkMode,
  onToggleTheme,
  simulatedStats
}: SidebarProps) {
  const { language, setLanguage, t } = useLanguage();
  
  const menuItems = [
    { id: 'overview', label: t('overview'), icon: Terminal, desc: t('core_system_metrics') },
    { id: 'contacts', label: t('contacts'), icon: Users, desc: t('contact_engine_desc') },
    { id: 'templates', label: t('templates'), icon: FileCode2, desc: t('template_builder_desc') },
    { id: 'campaigns', label: t('campaigns'), icon: Radio, desc: t('target_distribution') },
    { id: 'monitor', label: t('monitor'), icon: Cpu, desc: t('live_telemetry_loops') },
    { id: 'logs', label: t('logs'), icon: History, desc: t('csv_log_archives') },
    { id: 'settings', label: t('settings'), icon: Settings, desc: t('api_gateway_desc') },
    { id: 'admin_panel', label: t('admin_panel'), icon: Shield, desc: 'Admins & Profile' }
  ];

  const handleToggleLanguage = () => {
    setLanguage(language === 'en' ? 'fa' : 'en');
  };

  return (
    <div className={`w-80 h-screen flex flex-col justify-between rtl:border-l rtl:border-r-0 border-r shrink-0 transition-all duration-300 ${
      isDarkMode 
        ? 'bg-slate-950 border-slate-800 text-slate-300' 
        : 'bg-slate-50 border-slate-200 text-slate-700'
    }`}>
      {/* Brand Header */}
      <div className="p-6 border-b border-inherit bg-slate-950/20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 rounded bg-teal-500/30 blur animate-pulse"></div>
            <div className="relative bg-black p-2 rounded border border-teal-500">
              <Zap className="w-5 h-5 text-teal-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-md font-bold tracking-widest text-slate-100 font-sans">
              CYBER <span className="text-teal-400">SMS</span>
            </h1>
            <p className="text-[10px] font-mono font-medium text-slate-400 tracking-wider">
              CONTROL CONSOLE v2.6
            </p>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        <h2 className="px-3 text-[10px] font-mono font-semibold tracking-widest text-slate-400 mb-2 uppercase">
          {t('nav_modules')}
        </h2>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`w-full text-start flex items-center gap-3.5 px-4 py-3.5 rounded-lg border transition-all duration-200 relative group font-sans ${
                isActive 
                  ? isDarkMode
                    ? 'bg-teal-950/40 border-teal-500/50 text-teal-300 shadow-sm shadow-teal-500/10'
                    : 'bg-teal-50/70 border-teal-300 text-teal-800 font-semibold'
                  : isDarkMode
                    ? 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
                    : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {isActive && (
                <span className="absolute rtl:left-auto rtl:right-0 left-0 top-1/4 bottom-1/4 w-1 bg-teal-400 rounded-r-md rtl:rounded-r-none rtl:rounded-l-md"></span>
              )}
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-teal-400' : 'text-inherit group-hover:text-teal-400 transition-colors'}`} />
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-wider">{item.label}</span>
                <span className="text-[9px] font-mono font-normal text-slate-400 opacity-80 mt-0.5 group-hover:opacity-100 transition-opacity">
                  {item.desc}
                </span>
              </div>
              
              {item.id === 'monitor' && simulatedStats.activeCampaigns > 0 && (
                <span className="absolute rtl:left-3 rtl:right-auto right-3 top-3.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Profile & Configuration Controls */}
      <div className="p-4 border-t border-inherit bg-slate-950/20 space-y-3">
        {/* Language Controller */}
        <div className={`p-2 rounded-lg flex items-center justify-between ${
          isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-slate-100 border border-slate-200'
        }`}>
          <span className="text-[10px] font-mono font-semibold tracking-wider flex items-center gap-1">
            <Languages className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {t('language_mode')}
          </span>
          <button
            onClick={handleToggleLanguage}
            className="px-2 py-1 rounded text-[9.5px] font-extrabold uppercase bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 active:scale-95 transition-all text-center shrink-0 cursor-pointer"
          >
            {language === 'en' ? 'FA (فارسی)' : 'EN (ENGLISH)'}
          </button>
        </div>

        {/* Theme Settings Controller */}
        <div className={`p-2 rounded-lg flex items-center justify-between ${
          isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-slate-100 border border-slate-200'
        }`}>
          <span className="text-[10px] font-mono font-semibold tracking-wider flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {t('interface_mode')}
          </span>
          <button
            onClick={onToggleTheme}
            className={`p-1.5 rounded transition-transform active:scale-95 cursor-pointer shrink-0 ${
              isDarkMode ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-200 text-indigo-600'
            }`}
            title="Toggle theme mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* User Identity Details */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-teal-400">
              {profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt={username} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-4 h-4 text-slate-300" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200 font-sans tracking-wide truncate max-w-[120px]">
                {username}
              </span>
              <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                ● {t('online')}
              </span>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-red-950/20 border border-red-900/40 text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
            title={t('disconnect_session')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
