/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './lib/translations.tsx';
import Sidebar from './components/Sidebar.jsx';
import Overview from './components/Overview.jsx';
import ContactManager from './components/ContactManager.jsx';
import TemplateEngine from './components/TemplateEngine.jsx';
import CampaignSystem from './components/CampaignSystem.jsx';
import SendingMonitor from './components/SendingMonitor.jsx';
import LogSystem from './components/LogSystem.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import AdminPanel from './components/AdminPanel.jsx';

import { 
  Contact, 
  Campaign, 
  MessageTemplate, 
  SmsLog, 
  SmsSettings, 
  DashboardStats,
  AdminUser
} from './types.js';

import { 
  Terminal, 
  ShieldAlert, 
  Activity, 
  Zap, 
  Cpu, 
  Lock, 
  Key, 
  Moon, 
  Sun,
  RefreshCw,
  Keyboard,
  HelpCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const { language, t, setLanguage } = useLanguage();
  
  // Primary Session States
  const [token, setToken] = useState<string | null>(localStorage.getItem('sms_cyber_token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('sms_cyber_username'));
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loginFields, setLoginFields] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active navigation modules tab
  const [currentTab, setCurrentTabState] = useState(() => {
    return localStorage.getItem('sms_cyber_tab') || 'overview';
  });

  const setCurrentTab = (tab: string) => {
    setCurrentTabState(tab);
    localStorage.setItem('sms_cyber_tab', tab);
  };

  // Keyboard hotkey HUD & Cheatsheet states
  const [hudNotification, setHudNotification] = useState<{ id: number; text: string; shortcut: string } | null>(null);
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  
  // First launch onboarding wizard state
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('cyber_sms_onboarded') !== 'true';
  });
  const [onboardGatewayUrl, setOnboardGatewayUrl] = useState('');
  const [onboardApiToken, setOnboardApiToken] = useState('');

  // Cyber Color Scheme
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Sync background of browser document to avoid white flashes during animations
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      document.body.style.backgroundColor = '#020617'; // bg-slate-950
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc'; // bg-slate-50
    }
  }, [isDarkMode]);

  // Cyber Login Security Screen States
  const [cyberLoadingPercent, setCyberLoadingPercent] = useState<number | null>(null);
  const [cyberLogs, setCyberLogs] = useState<string[]>([]);
  const [zoomingDashboard, setZoomingDashboard] = useState(false);
  const [delayedToken, setDelayedToken] = useState<string | null>(null);
  const [delayedUsername, setDelayedUsername] = useState<string | null>(null);

  // Job Completion / Failure Pop-Up State
  const [jobDoneOverlay, setJobDoneOverlay] = useState<{
    type: 'success' | 'failure';
    campaignName: string;
    totalSent: number;
    totalFailed: number;
  } | null>(null);

  // Active Core Entity States
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [settings, setSettings] = useState<SmsSettings>({
    gatewayUrl: 'http://192.168.1.67:8082/',
    apiToken: '19677b53-6c98-4929-9e60-ca788ada9036',
    defaultDelaySeconds: 2,
    enableAnimations: true,
    dryRunMode: true,
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    sentToday: 0,
    successRate: 100,
    failedToday: 0,
    activeCampaigns: 0,
  });
  const [logs, setLogs] = useState<SmsLog[]>([]);

  // Synchronize onboarding state inputs once secure gateway settings load from database
  useEffect(() => {
    if (settings.gatewayUrl && !onboardGatewayUrl) {
      setOnboardGatewayUrl(settings.gatewayUrl);
    }
    if (settings.apiToken && !onboardApiToken) {
      setOnboardApiToken(settings.apiToken);
    }
  }, [settings]);

  // Telemetry loop trigger counts
  const [loopPulse, setLoopPulse] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeRequests, setActiveRequests] = useState(0);

  // Global fetch requests tracking wrapper to back dynamic loading bar
  useEffect(() => {
    const originalFetch = window.fetch;
    let intercepted = false;
    
    try {
      window.fetch = async (...args) => {
        setActiveRequests(prev => prev + 1);
        try {
          return await originalFetch(...args);
        } finally {
          setActiveRequests(prev => Math.max(0, prev - 1));
        }
      };
      intercepted = true;
    } catch (e) {
      try {
        Object.defineProperty(window, 'fetch', {
          value: async (...args: [RequestInfo | URL, RequestInit?]) => {
            setActiveRequests(prev => prev + 1);
            try {
              return await originalFetch(...args);
            } finally {
              setActiveRequests(prev => Math.max(0, prev - 1));
            }
          },
          configurable: true,
          writable: true
        });
        intercepted = true;
      } catch (err) {
        console.warn('Could not intercept window.fetch globally:', err);
      }
    }

    return () => {
      if (intercepted) {
        try {
          window.fetch = originalFetch;
        } catch (e) {
          try {
            Object.defineProperty(window, 'fetch', {
              value: originalFetch,
              configurable: true,
              writable: true
            });
          } catch (err) {
            // Cannot restore
          }
        }
      }
    };
  }, []);

  // Load Session and synchronize databases
  useEffect(() => {
    if (token) {
      // Fetch stats, settings, contacts, templates, campaigns, logs
      synchronizeSystemData();
      
      // Setup live polling loop every 2 seconds to keep progress bars, stats, and logs dynamically updated!
      const timer = setInterval(() => {
        setLoopPulse(p => p + 1);
      }, 2000);
      
      return () => clearInterval(timer);
    }
  }, [token, loopPulse]);

  // Keyboard shortcut listener to enable efficient power-user workflows
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Check active keys
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;
      const key = e.key.toLowerCase();

      // Trigger hotkey cheatsheet overlay
      if ((key === '?' || (isCtrl && e.key === '/')) && !['input', 'textarea', 'select'].includes((document.activeElement?.tagName || '').toLowerCase())) {
        e.preventDefault();
        setShowCheatsheet(prev => !prev);
        setHudNotification({ id: Date.now(), text: 'TOGGLED KEYBOARD CHEATSHEET', shortcut: '?' });
        return;
      }

      // Check if user is typing in a form or input fields
      const isTyping = ['input', 'textarea', 'select'].includes((document.activeElement?.tagName || '').toLowerCase());

      // Only allow Ctrl+S when typing, block default browser Save Page triggers
      if (isCtrl && key === 's') {
        e.preventDefault();
        const saveEvent = new CustomEvent('cyber-sms-save');
        window.dispatchEvent(saveEvent);
        setHudNotification({ id: Date.now(), text: 'DISPATCHED AUTO-SAVE SIGNAL', shortcut: '⌘/Ctrl + S' });
        return;
      }

      // Tab navigation shortcuts - we allow Alt+Key or Ctrl+Shift+Key
      if ((isCtrl && isShift) || isAlt) {
        let targetTab = '';
        let shortcutLabel = '';

        if (key === 'o') { targetTab = 'overview'; shortcutLabel = isAlt ? 'Alt+O' : 'Ctrl+Shift+O'; }
        else if (key === 'c') { targetTab = 'contacts'; shortcutLabel = isAlt ? 'Alt+C' : 'Ctrl+Shift+C'; }
        else if (key === 't') { targetTab = 'templates'; shortcutLabel = isAlt ? 'Alt+T' : 'Ctrl+Shift+T'; }
        else if (key === 'p') { targetTab = 'campaigns'; shortcutLabel = isAlt ? 'Alt+P' : 'Ctrl+Shift+P'; }
        else if (key === 'm') { targetTab = 'monitor'; shortcutLabel = isAlt ? 'Alt+M' : 'Ctrl+Shift+M'; }
        else if (key === 'l') { targetTab = 'logs'; shortcutLabel = isAlt ? 'Alt+L' : 'Ctrl+Shift+L'; }
        else if (key === 's') { targetTab = 'settings'; shortcutLabel = isAlt ? 'Alt+S' : 'Ctrl+Shift+S'; }

        if (targetTab) {
          e.preventDefault();
          setCurrentTab(targetTab);
          setHudNotification({ 
            id: Date.now(), 
            text: `SWAPTED TO ${targetTab.toUpperCase()} MODULE`, 
            shortcut: shortcutLabel 
          });
        }
      } else if (isCtrl && key === 'l') {
        // Direct override for Ctrl+L for Logs (if not restricted by host iframe / browser)
        e.preventDefault();
        setCurrentTab('logs');
        setHudNotification({ id: Date.now(), text: 'SWAPTED TO SYSTEM LOGS', shortcut: '⌘/Ctrl + L' });
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Automatically fade out keyboard HUD notifications 1.8s after execution
  useEffect(() => {
    if (hudNotification) {
      const timer = setTimeout(() => {
        setHudNotification(null);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [hudNotification]);

  // Synchronize data payloads from Express
  const synchronizeSystemData = async (newToken?: string) => {
    let activeToken = token;
    if (newToken && typeof newToken === 'string') {
      activeToken = newToken;
      localStorage.setItem('sms_cyber_token', newToken);
      setToken(newToken);
    }
    if (!activeToken) return;
    setIsSyncing(true);
    try {
      const headers = { 'Authorization': `Bearer ${activeToken}` };
      
      // Parallel fetch
      const [
        statsRes,
        settingsRes,
        contactsRes,
        templatesRes,
        campaignsRes,
        logsRes,
        meRes
      ] = await Promise.all([
        fetch('/api/stats', { headers }),
        fetch('/api/settings', { headers }),
        fetch('/api/contacts', { headers }),
        fetch('/api/templates', { headers }),
        fetch('/api/campaigns', { headers }),
        fetch('/api/logs', { headers }),
        fetch('/api/auth/me', { headers })
      ]);

      if (statsRes.status === 401) {
        // Trigger safe session timeout
        handleLogout();
        return;
      }

      const safeParseJson = async (res: Response, fallback: any) => {
        try {
          if (!res.ok) return fallback;
          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('application/json')) return fallback;
          return await res.json();
        } catch {
          return fallback;
        }
      };

      const statsData = await safeParseJson(statsRes, null);
      if (statsData) setStats(statsData);

      const settingsData = await safeParseJson(settingsRes, null);
      if (settingsData) setSettings(settingsData);

      const contactsData = await safeParseJson(contactsRes, null);
      if (contactsData) setContacts(contactsData);

      const templatesData = await safeParseJson(templatesRes, null);
      if (templatesData) setTemplates(templatesData);
      
      const freshCampaigns = await safeParseJson(campaignsRes, null) as Campaign[] | null;
      if (freshCampaigns) {
        // Evaluate if any background task completed or tripped a failure
        if (campaigns && campaigns.length > 0) {
          freshCampaigns.forEach((freshCamp) => {
            const oldCamp = campaigns.find(c => c.id === freshCamp.id);
            if (oldCamp && oldCamp.status === 'sending' && (freshCamp.status === 'completed' || freshCamp.status === 'stopped')) {
              // Initiate reactive visual overlay
              if (freshCamp.status === 'completed') {
                setJobDoneOverlay({
                  type: 'success',
                  campaignName: freshCamp.name,
                  totalSent: freshCamp.successCount,
                  totalFailed: freshCamp.failedCount,
                });
              } else {
                setJobDoneOverlay({
                  type: 'failure',
                  campaignName: freshCamp.name,
                  totalSent: freshCamp.successCount,
                  totalFailed: freshCamp.failedCount,
                });
              }
            }
          });
        }
        setCampaigns(freshCampaigns);
      }

      const logsData = await safeParseJson(logsRes, null);
      if (logsData) setLogs(logsData);
      
      if (meRes.status === 200) {
        const meData = await safeParseJson(meRes, null);
        if (meData) {
          setCurrentUser(meData);
          if (meData.username) {
            setUsername(meData.username);
            localStorage.setItem('sms_cyber_username', meData.username);
          }
        }
      }

    } catch (e) {
      console.error('[CONSOLESYNCHRONIZER] Error syncing database payloads', e);
    } finally {
      // Small timeout to give immediate visual feedback of the "Refresh" action even on fast load speeds
      setTimeout(() => setIsSyncing(false), 400);
    }
  };

  // Login session handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginFields),
      });

      const data = await res.json();
      if (res.status === 200 && data.token) {
        // Hold the parameters in delayed buffer targets
        setDelayedToken(data.token);
        setDelayedUsername(data.username);
        
        // Initiate cyber simulation sequence
        setCyberLoadingPercent(0);
        setCyberLogs(['[SYS_AUTH] SECURE CONNECTION REQUEST SPARKED...']);
      } else {
        setLoginError(data.error || 'Console connection rejected. Verification failed.');
      }
    } catch (err) {
      setLoginError('Could not contact background Express service. Check server status.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Cyber Loading Animation Progress Orchestrator Loop
  useEffect(() => {
    if (cyberLoadingPercent !== null) {
      if (cyberLoadingPercent < 100) {
        const timer = setTimeout(() => {
          const nextPercent = cyberLoadingPercent + Math.floor(Math.random() * 15) + 6;
          const capped = Math.min(100, nextPercent);
          setCyberLoadingPercent(capped);
          
          const phrases = [
            '[SYS_ENV] ASSESSING CLOUD CONTAINER GATEWAY PORTS...',
            '[SYS_AUTH] GENERATING NEW SESSION TOKEN SIGNATURES...',
            '[SYS_NET] HANDSHAKING SECURE ASYNCHRONOUS SOCKET TUBES...',
            '[SYS_DB] MERGING HISTORIC SQL SYSTEM MEMORY SHARDS...',
            '[SYS_SEC] INITIALISING FLOATING SHIELD BUFFER GRIDS...',
            '[SYS_CORE] INJECTING POLISHED MODULE INTERFACE NODES...',
            '[SYS_ONLINE] BOOT SEQUENCE COMPLETED. CONSOLE GRANTED!'
          ];
          
          const idx = Math.min(phrases.length - 1, Math.floor((capped / 100) * phrases.length));
          const currentPhrase = phrases[idx];
          if (currentPhrase && !cyberLogs.includes(currentPhrase)) {
            setCyberLogs(prev => [...prev, currentPhrase]);
          }
        }, 180);
        return () => clearTimeout(timer);
      } else {
        // Start zooming transition
        setZoomingDashboard(true);
        const timer = setTimeout(() => {
          // Establish main token state and persist
          localStorage.setItem('sms_cyber_token', delayedToken!);
          localStorage.setItem('sms_cyber_username', delayedUsername!);
          setToken(delayedToken);
          setUsername(delayedUsername);
          
          // Wipe transitional buffers
          setCyberLoadingPercent(null);
          setCyberLogs([]);
          setZoomingDashboard(false);
          setDelayedToken(null);
          setDelayedUsername(null);
        }, 650);
        return () => clearTimeout(timer);
      }
    }
  }, [cyberLoadingPercent, delayedToken, delayedUsername]);

  const handleLogout = () => {
    localStorage.removeItem('sms_cyber_token');
    localStorage.removeItem('sms_cyber_username');
    setToken(null);
    setUsername(null);
    setCurrentTab('overview');
  };

  // Contacts Dispatch Actions
  const handleSaveContact = async (contactPayload: any) => {
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(contactPayload),
      });
      if (res.status === 200) {
        synchronizeSystemData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.status === 200) {
        synchronizeSystemData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteContacts = async (ids: string[]) => {
    try {
      const res = await fetch('/api/contacts/batch-delete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ ids }),
      });
      if (res.status === 200) {
        synchronizeSystemData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleImportCSVContacts = async (csvContactsPayload: any) => {
    try {
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ contacts: csvContactsPayload }),
      });
      if (res.status === 200) {
        synchronizeSystemData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Templates Dispatch Actions
  const handleSaveTemplate = async (templatePayload: any) => {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(templatePayload),
      });
      if (res.status === 200) {
        synchronizeSystemData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.status === 200) {
        synchronizeSystemData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Live Template optimization proxy helper
  const handleOptimizeTemplateText = async (text: string, objective: string): Promise<string> => {
    const res = await fetch('/api/gemini/optimize', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ text, objective }),
    });
    const result = await res.json();
    if (res.status !== 200) {
      throw new Error(result.error || 'Gemini Optimizer service failed.');
    }
    return result.optimizedText;
  };

  // Live audio speech transcription proxy helper
  const handleTranscribeAudioInput = async (audioData: string, mimeType: string): Promise<string> => {
    const res = await fetch('/api/gemini/transcribe', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ audioData, mimeType }),
    });
    const result = await res.json();
    if (res.status !== 200) {
      throw new Error(result.error || 'Speech transcription failed.');
    }
    return result.transcription;
  };

  // Campaigns Dispatch Actions
  const handleSaveCampaign = async (campaignPayload: any) => {
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(campaignPayload),
      });
      if (res.status === 200) {
        synchronizeSystemData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDuplicateCampaign = async (id: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.status === 200) {
        synchronizeSystemData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.status === 200) {
        synchronizeSystemData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Logs actions
  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/logs', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.status === 200) {
        synchronizeSystemData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Settings update actions
  const handleUpdateSettings = async (settingsPayload: SmsSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(settingsPayload),
      });
      if (res.status === 200) {
        synchronizeSystemData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Render components based on active selection Tab
  const renderTabContent = () => {
    switch (currentTab) {
      case 'overview':
        return (
          <Overview 
            stats={stats} 
            logs={logs} 
            campaigns={campaigns} 
            isDarkMode={isDarkMode} 
            onNavigateTab={setCurrentTab}
            onQuickStartCampaign={() => setCurrentTab('campaigns')}
            dryRun={settings.dryRunMode}
          />
        );
      case 'contacts':
        return (
          <ContactManager 
            contacts={contacts} 
            onAddContact={handleSaveContact} 
            onDeleteContact={handleDeleteContact} 
            onDeleteContacts={handleDeleteContacts}
            onImportCSV={handleImportCSVContacts}
            isDarkMode={isDarkMode}
          />
        );
      case 'templates':
        return (
          <TemplateEngine 
            templates={templates} 
            contacts={contacts}
            onSaveTemplate={handleSaveTemplate} 
            onDeleteTemplate={handleDeleteTemplate} 
            isDarkMode={isDarkMode}
            onOptimizeTemplate={handleOptimizeTemplateText}
            onTranscribeAudio={handleTranscribeAudioInput}
          />
        );
      case 'campaigns':
        return (
          <CampaignSystem 
            campaigns={campaigns} 
            templates={templates} 
            contacts={contacts}
            onSaveCampaign={handleSaveCampaign} 
            onDeleteCampaign={handleDeleteCampaign} 
            onDuplicateCampaign={handleDuplicateCampaign}
            isDarkMode={isDarkMode}
          />
        );
      case 'monitor':
        return (
          <SendingMonitor 
            campaigns={campaigns} 
            logs={logs} 
            templates={templates}
            isDarkMode={isDarkMode} 
            onNavigateTab={setCurrentTab}
            dryRun={settings.dryRunMode}
          />
        );
      case 'logs':
        return (
          <LogSystem 
            logs={logs} 
            onClearLogs={handleClearLogs} 
            isDarkMode={isDarkMode} 
            settings={settings}
          />
        );
      case 'admin_panel':
        return (
          <AdminPanel 
            token={token!}
            isDarkMode={isDarkMode}
            currentUser={currentUser}
            onProfileUpdated={synchronizeSystemData}
          />
        );
      case 'settings':
        return (
          <SettingsPage 
            settings={settings} 
            onUpdateSettings={handleUpdateSettings} 
            isDarkMode={isDarkMode} 
            token={token}
          />
        );
      default:
        return <p className="text-xs font-mono">[Tab error context]</p>;
    }
  };

  const resolvedTitle = React.useMemo(() => {
    const map: Record<string, string> = language === 'fa' ? {
      overview: 'آرشیو خلاصه وضعیت سیستم',
      contacts: 'مدیریت و دفترچه مشترکین',
      templates: 'موتور و الگوهای قالب هوشمند',
      campaigns: 'طرح‌ها و کمپین‌های ارسال پیامک',
      monitor: 'مانیتورینگ زنده ترافیک ارسال',
      logs: 'گزارشات و رویدادهای سیستمی',
      settings: 'تنظیمات و پیکربندی درگاه',
      admin_panel: 'مرکز امنیت و مشخصات ناوگان'
    } : {
      overview: 'SYSTEM OVERVIEW ARCHIVES',
      contacts: 'SUBSCRIBER CONTACT DIRECTORY',
      templates: 'INTERPOLATIVE TEMPLATE ENGINE',
      campaigns: 'CAMPAIGN SHIPMENT HUBS',
      monitor: 'REALTIME DISPATCH TELEMETRY',
      logs: 'HISTORIC SYSTEM ARCHIVES',
      settings: 'CORE ROUTING CODESPORTS',
      admin_panel: 'SECURITY FLEET CONTROL CENTER'
    };
    return map[currentTab] || 'DASHBOARD CONSOLE';
  }, [currentTab, language]);

  // Cyber Loading Module Overlay
  if (cyberLoadingPercent !== null) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-mono z-[100000]">
        {/* Animated grid neon background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(to_right,#14b8a6_1px,transparent_1px),linear-gradient(to_bottom,#14b8a6_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
        
        {/* Glowing concentric background blur */}
        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className="w-full max-w-md p-8 border border-teal-500/30 bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-teal-500/10 flex flex-col items-center relative gap-6 text-center"
        >
          {/* Cyber Circular loading state */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Spinning Radar Circle */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-teal-500/20"
            />
            {/* Glowing inner spinner ring */}
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute inset-2 rounded-full border border-teal-400 border-t-transparent"
            />
            {/* Pulsing Core circle */}
            <div className="absolute inset-6 rounded-full bg-teal-500/10 flex flex-col items-center justify-center border border-teal-500/20 shadow-inner">
              <span className="text-2xl font-black tracking-tighter text-teal-400">{cyberLoadingPercent}%</span>
              <span className="text-[7.5px] uppercase text-slate-400 tracking-widest font-black animate-pulse mt-0.5">ESTABLISHING</span>
            </div>
          </div>

          <div className="w-full space-y-2">
            <h4 className="text-xs font-black tracking-widest uppercase text-slate-100 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
              DECRYPTING SECURITY CHANNELS...
            </h4>
            
            {/* Progress filling bar */}
            <div className="w-full h-2 bg-slate-950 border border-slate-800 rounded-full overflow-hidden p-[2px]">
              <motion.div 
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                animate={{ width: `${cyberLoadingPercent}%` }}
                transition={{ duration: 0.15 }}
              />
            </div>
          </div>

          {/* Scrolling console logging simulator */}
          <div className="w-full bg-black/60 border border-slate-800/80 rounded-xl p-4 h-44 text-left text-[9px] font-mono leading-relaxed overflow-y-auto space-y-1.5 text-teal-400/80 select-none scrollbar-thin">
            {cyberLogs.map((log, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -5 }} 
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-1"
              >
                <span className="text-teal-500 font-bold shrink-0">&gt;&gt;</span>
                <span className="text-slate-300 font-medium">{log}</span>
              </motion.div>
            ))}
            <div className="flex items-center gap-1">
              <span className="text-teal-500 font-bold animate-pulse">&gt;&gt;</span>
              <span className="w-1.5 h-3 bg-teal-400 animate-pulse inline-block" />
            </div>
          </div>
          
          <div className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">
            SECURE ACCESS HANDSHAKE: LIVE CONTROLS
          </div>
        </motion.div>
      </div>
    );
  }

  // Auth screen layout
  if (!token) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-300 font-sans relative overflow-hidden ${
        isDarkMode 
          ? 'bg-slate-950 text-slate-100' 
          : 'bg-slate-50 text-slate-800'
      }`}>
        
        {/* Animated grid neon backdrop design */}
        {settings.enableAnimations !== false && (
          <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] is-animating-shader bg-[linear-gradient(to_right,#14b8a6_1px,transparent_1px),linear-gradient(to_bottom,#14b8a6_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        )}

        {/* Floating background neon spheres */}
        {settings.enableAnimations !== false && (
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-teal-500/[0.03] blur-3xl pointer-events-none -translate-x-1/2"></div>
        )}

        <div className={`w-full max-w-md p-8 rounded-3xl border relative z-10 ${
          isDarkMode 
            ? 'bg-slate-900/60 border-slate-800/80 backdrop-blur-xl shadow-2xl shadow-teal-500/5' 
            : 'bg-white border-slate-200 shadow-xl'
        }`}>
          <div className="text-center space-y-3 mb-6">
            <div className="inline-flex p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20 mb-1 relative">
              <div className="absolute -inset-1 rounded-2xl bg-teal-500/30 blur animate-pulse"></div>
              <Terminal className="w-6 h-6 relative" />
            </div>
            
            <div className="space-y-1">
              <h1 className="text-xl font-black font-sans tracking-widest text-slate-100 uppercase">
                CYBER SMS PANEL
              </h1>
              <p className="text-[10px] font-mono tracking-widest text-slate-400 font-bold uppercase">
                {language === 'fa' ? 'ورود به پنل مدیریت امن سیستم' : 'ADMIN SECURED CONSOLE ENTRY'}
              </p>
            </div>
          </div>

          {loginError && (
            <div className="p-3.5 mb-5 rounded-xl bg-rose-950/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3 font-sans">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 stroke-[2]" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-sans">
            
            <div className="space-y-1.5Col">
              <span className="text-slate-400 font-bold font-mono tracking-wider block mb-1">
                {language === 'fa' ? 'نام کاربری ادمین' : 'TERMINAL USERNAME'}
              </span>
              <input
                type="text"
                required
                placeholder="admin"
                value={loginFields.username}
                onChange={(e) => setLoginFields(prev => ({ ...prev, username: e.target.value }))}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono text-center ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-slate-220 placeholder-slate-600' 
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <div className="space-y-1.5Col">
              <span className="text-slate-400 font-bold font-mono tracking-wider block mb-1">
                {language === 'fa' ? 'رمز عبور امنیتی ادمین' : 'DECRYPT ACCESS PASSWORD'}
              </span>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={loginFields.password}
                onChange={(e) => setLoginFields(prev => ({ ...prev, password: e.target.value }))}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono text-center ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-slate-220 placeholder-slate-600' 
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 mt-2 rounded-xl bg-teal-500 hover:bg-teal-400 font-black text-slate-950 tracking-widest uppercase transition-all flex items-center justify-center gap-2 font-sans active:scale-95 shadow-lg shadow-teal-500/10"
            >
              {isLoggingIn ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Lock className="w-4.5 h-4.5" />}
              {isLoggingIn 
                ? (language === 'fa' ? 'در حال تایید هویت...' : 'DECRYPTING...') 
                : (language === 'fa' ? 'ورود به سیستم و مخابره' : 'ESTABLISH CONNECT')}
            </button>

          </form>

          {/* Secure Credential Instruction note inside box so user does not need to guess credentials */}
          <div className="mt-8 pt-4 border-t border-slate-800/60 text-center space-y-2">
            <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase font-black block">
              {language === 'fa' ? 'مشخصات پیش‌فرض ورود ادمین' : 'SYSTEM CREDENTIAL MODULES'}
            </span>
            <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl space-y-1 inline-block w-full">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>{language === 'fa' ? 'نام کاربری ادمین:' : 'USERNAME:'}</span>
                <span className="text-teal-400 font-bold">admin</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>{language === 'fa' ? 'رمز ورود:' : 'SECURE PASSWORD:'}</span>
                <span className="text-teal-400 font-bold">cyberadmin1337</span>
              </div>
            </div>
          </div>

        </div>

        {/* Global Floating sun/moon configuration settings inside login view */}
        <div className="absolute right-4 bottom-4 flex items-center gap-2 z-15">
          <button
            onClick={() => {
              // Toggle language
              setLanguage(language === 'en' ? 'fa' : 'en');
            }}
            className="p-3 w-10 h-10 bg-slate-900 text-slate-400 hover:text-slate-100 border border-slate-800 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md font-mono text-[9px] font-bold flex items-center justify-center"
            title="Switch Language / تغییر زبان"
          >
            {language === 'en' ? 'FA' : 'EN'}
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-3 w-10 h-10 bg-slate-900 text-slate-400 hover:text-slate-100 border border-slate-800 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center"
            title="Toggle system color screen"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
        </div>

      </div>
    );
  }

  // Logged-in Core App Dashboard Layout
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={`min-h-screen flex transition-all duration-300 ${
        isDarkMode 
          ? 'bg-slate-950 text-slate-100' 
          : 'bg-slate-50 text-slate-800'
      }`}
    >
      
      {/* Animated Matrix network backdrops */}
      {settings.enableAnimations !== false && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(to_right,#14b8a6_1px,transparent_1px),linear-gradient(to_bottom,#14b8a6_1px,transparent_1px)] bg-[size:5rem_5rem]"></div>
      )}

      {/* Embedded Sidebar Nav modules */}
      <Sidebar 
        currentTab={currentTab} 
        onChangeTab={setCurrentTab} 
        onLogout={handleLogout}
        username={username || 'admin'}
        profilePhoto={currentUser?.profilePhoto}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        simulatedStats={stats}
      />

      {/* Main Container Content */}
      <div className="flex-1 overflow-y-auto h-screen relative z-10">
        
        {/* Dynamic Nav Header Bar */}
        <header className="p-6 border-b border-inherit bg-transparent shrink-0 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
              CONSOLE PORTAL / MODULES
            </h2>
            <h1 className="text-xl font-extrabold font-sans tracking-wide text-teal-400 uppercase">
              {resolvedTitle}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Live syncing feedback widget */}
            <div className="flex items-center gap-1.5 h-6">
              {isSyncing ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-950/40 border border-teal-500/30 text-teal-400 font-mono text-[9px] font-bold tracking-wider uppercase">
                  <RefreshCw className="w-3 h-3 animate-spin text-teal-400" />
                  <span className="inline-block animate-pulse">refreshing console</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/40 border border-slate-800 text-slate-500 font-mono text-[9px] tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>TEL STREAM ACTIVE</span>
                </div>
              )}
            </div>

            {/* Quick stats indicators in header bar */}
            <div className="hidden md:flex items-center gap-4 text-right font-mono text-[10px] text-slate-400">
              <div>
                <span className="text-slate-500 block">TUNNELS</span>
                <span className="font-bold text-slate-200">{stats.activeCampaigns} ACTIVE</span>
              </div>
              <div className="h-6 w-[1px] bg-slate-800"></div>
              <div>
                <span className="text-slate-500 block">SUCCESS RATE</span>
                <span className="font-bold text-teal-400">{stats.successRate}%</span>
              </div>
            </div>
            
            {/* Interactive shortcuts manual button */}
            <button
              onClick={() => setShowCheatsheet(true)}
              className={`p-2 rounded-lg border flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-wider uppercase active:scale-95 transition-all text-slate-400 hover:text-teal-450 cursor-pointer ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
              title="View system hotkeys [?]"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Shortcuts HUD [?]</span>
            </button>
            
            <div className="p-2 px-3 rounded-lg bg-teal-950/20 border border-teal-800/40 font-mono text-[9px] tracking-wider text-teal-400 font-extrabold uppercase">
              {settings.dryRunMode ? 'SIMULATOR ACTIVE' : 'LIVE ROUTING'}
            </div>
          </div>
        </header>

        {/* Dynamic global progress-styled loading bar for pending async fetch requests */}
        <div className={`relative w-full h-[3px] overflow-hidden z-50 ${
          isDarkMode ? 'bg-slate-950' : 'bg-slate-100'
        }`}>
          {(activeRequests > 0 || isSyncing) && (
            <motion.div
              initial={{ left: "-100%", width: "35%" }}
              animate={{ 
                left: ["-100%", "100%"],
                width: ["35%", "45%", "35%"]
              }}
              transition={{ 
                duration: 1.2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              style={{ position: 'absolute' }}
              className="h-full bg-gradient-to-r from-teal-500 via-emerald-450 to-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]"
            />
          )}
        </div>

        {/* Dynamic sub-tab workspace container container with premium animations */}
        <main className="p-6 max-w-[1400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="space-y-6"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Realtime Keyboard shortcut overlay toast feedback */}
        <AnimatePresence>
          {hudNotification && (
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
              <motion.div
                key={hudNotification.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="px-5 py-3 rounded-full bg-slate-900 border border-teal-500/60 text-teal-300 font-mono text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-teal-500/15"
              >
                <span className="bg-teal-500 px-2 py-0.5 rounded text-slate-950 font-black tracking-tighter">
                  {hudNotification.shortcut}
                </span>
                <span className="text-slate-150 tracking-wide font-sans">{hudNotification.text}</span>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Interactive Power-User shortcuts cheatsheet modal */}
        <AnimatePresence>
          {showCheatsheet && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg rounded-2xl border border-teal-500/35 bg-slate-900 p-6 shadow-2xl relative font-sans text-slate-100"
              >
                <button
                  onClick={() => setShowCheatsheet(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 font-mono text-xs cursor-pointer p-1 rounded-md hover:bg-slate-800"
                >
                  ✕ CLOSE
                </button>

                <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
                  <div className="bg-teal-950 p-2 rounded border border-teal-500/50 text-teal-400">
                    <Keyboard className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-widest text-slate-100">
                      POWER-USER SHORTCUT MANAGER
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Control CYBER SMS Console with maximum keyboard efficiency
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <h4 className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                    1. ACTION COMMANDS
                  </h4>
                  <div className="flex justify-between items-center text-xs p-2 bg-slate-950/40 border border-slate-800 rounded-lg">
                    <span className="text-slate-300">Save Active Form / Commit Configs</span>
                    <span className="font-mono text-[10px] font-bold px-2 py-1 bg-slate-900 rounded border border-slate-700 text-teal-300">
                      Ctrl + S / ⌘ + S
                    </span>
                  </div>

                  <h4 className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase pt-2">
                    2. WORKSPACE NAV MODULES (Alt + Key OR Ctrl + Shift + Key)
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: 'Overview / System Metrics', key: 'O' },
                      { label: 'Contact Engine / CSV Import', key: 'C' },
                      { label: 'Template Builder / AI Optimiser', key: 'T' },
                      { label: 'SMS Campaigns / Scheduler', key: 'P' },
                      { label: 'Live Monitor / Telemetry', key: 'M' },
                      { label: 'System Logs / Audit Trails', key: 'L' },
                      { label: 'Config Port / Credentials', key: 'S' }
                    ].map((shortcut) => (
                      <div key={shortcut.key} className="flex justify-between items-center text-xs p-2.5 bg-slate-950/20 border border-slate-850/60 hover:border-slate-800 rounded-xl">
                        <span className="text-slate-350 font-medium">{shortcut.label}</span>
                        <div className="flex gap-1">
                          <span className="font-mono text-[9px] px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 text-slate-400 uppercase">
                            Alt+{shortcut.key}
                          </span>
                          <span className="text-slate-600 self-center text-[10px] font-sans">/</span>
                          <span className="font-mono text-[9px] px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 text-teal-400 uppercase">
                            Ctrl+Shift+{shortcut.key}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[9.5px] font-mono text-slate-500 leading-relaxed text-center pt-3 border-t border-slate-800/60">
                    * Note: For direct Logs module, you can also press <span className="text-slate-300 font-bold">Ctrl + L</span> directly inside safe browser containers.
                  </p>
                </div>
              </motion.div>
            </div>
          )}

          {/* FIRST-TIME LAUNCH ONBOARDING SETUP SCREEN */}
          {showOnboarding && (
            <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className={`w-full max-w-xl rounded-2xl border ${
                  isDarkMode ? 'bg-slate-900 border-teal-500/25' : 'bg-white border-slate-200 shadow-xl'
                } p-6 relative flex flex-col`}
              >
                {/* Visual Neon Accent Elements */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500 via-indigo-500 to-teal-500 rounded-t-2xl"></div>

                {/* Header Welcome Title */}
                <div className="text-center space-y-2 mt-4 mb-5">
                  <div className="mx-auto w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-300">
                    <Zap className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-base font-black tracking-widest text-slate-100 uppercase">
                    CYBER SMS NODE INITIALISATION
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans px-4 leading-relaxed">
                    Welcome to the central gateway dashboard. Hook up your Android handset terminal or server node via Traccar to route active sms traffic.
                  </p>
                </div>

                {/* Form fields */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateSettings({
                      gatewayUrl: onboardGatewayUrl.trim() || 'http://192.168.1.67:8082/',
                      apiToken: onboardApiToken.trim(),
                      defaultDelaySeconds: settings.defaultDelaySeconds || 2,
                      enableAnimations: settings.enableAnimations !== false,
                      dryRunMode: false
                    });
                    localStorage.setItem('cyber_sms_onboarded', 'true');
                    setShowOnboarding(false);
                    setHudNotification({ id: Date.now(), text: 'CONNECTED TO TRACCAR GATEWAY GATE', shortcut: 'INTEGRATED' });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5 text-xs">
                    <label className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      HTTP Gateway Endpoint URL
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <input
                        type="url"
                        required
                        value={onboardGatewayUrl}
                        onChange={(e) => setOnboardGatewayUrl(e.target.value)}
                        placeholder="http://192.168.1.67:8082/"
                        className={`w-full pl-9 p-3 rounded-lg border font-mono text-xs focus:outline-none focus:border-teal-400/50 ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600' 
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <label className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Secure API Token Key
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Key className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={onboardApiToken}
                        onChange={(e) => setOnboardApiToken(e.target.value)}
                        placeholder="e.g. yourSecretGatewayApiToken"
                        className={`w-full pl-9 p-3 rounded-lg border font-mono text-xs focus:outline-none focus:border-teal-400/50 ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600' 
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Informational Guidance Box */}
                  <div className="p-3 bg-teal-950/20 border border-teal-800/25 rounded-xl space-y-1 font-sans text-xs">
                    <div className="flex items-center gap-1.5 text-teal-400 font-bold font-mono text-[10px] uppercase">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Guidance Node Instructions:</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      To generate your HTTP API Endpoint and Secure Token keys, you must install the official Traccar SMS Gateway application on your Android device or setup host server.
                    </p>
                    <a
                      href="https://www.traccar.org/sms-gateway/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[10.5px] text-teal-300 hover:text-teal-200 underline mt-1 font-bold"
                    >
                      Retrieve Traccar Setup Guidelines ↗
                    </a>
                  </div>

                  {/* Action row */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('cyber_sms_onboarded', 'true');
                        setShowOnboarding(false);
                        // Make sure dry-run mode stays enabled
                        handleUpdateSettings({
                          ...settings,
                          dryRunMode: true
                        });
                        setHudNotification({ id: Date.now(), text: 'LAUNCHED IN SIMULATOR RUNTIME', shortcut: 'DEMO' });
                      }}
                      className="py-3 bg-slate-800 hover:bg-slate-705 text-slate-200 rounded-xl font-bold font-sans text-[11px] tracking-wider uppercase transition-all text-center cursor-pointer border border-slate-700/50"
                    >
                      Skip Setup (Sandbox)
                    </button>
                    <button
                      type="submit"
                      className="py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-black font-sans text-[11px] tracking-widest uppercase transition-all text-center cursor-pointer shadow-lg shadow-teal-550/10"
                    >
                      Provision & Connect
                    </button>
                  </div>
                </form>

              </motion.div>
            </div>
          )}
          {/* CAMPAIGN COMPLETION / FAILURE OVERLAY POPUP */}
          {jobDoneOverlay && (
            <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[999999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className={`w-full max-w-sm rounded-[24px] border ${
                  jobDoneOverlay.type === 'success' ? 'border-emerald-500/40 bg-slate-900/95 shadow-teal-500/5' : 'border-rose-500/40 bg-slate-900/95 shadow-rose-500/5'
                } p-6 shadow-2xl relative text-center flex flex-col items-center gap-4`}
              >
                {/* Glowing top line accent */}
                <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-[24px] bg-gradient-to-r ${
                  jobDoneOverlay.type === 'success' ? 'from-emerald-500 to-teal-400' : 'from-rose-500 to-pink-500'
                }`} />

                {/* Status indicator decoration */}
                <div className="mt-4 flex flex-col items-center">
                  {jobDoneOverlay.type === 'success' ? (
                    settings.successImageUrl ? (
                      <img 
                        src={settings.successImageUrl} 
                        referrerPolicy="no-referrer"
                        className="w-24 h-24 object-contain rounded-2xl border border-emerald-500/20 shadow-md p-1 bg-slate-950/40"
                        alt="Campaign complete visual badge"
                      />
                    ) : (
                      <motion.div 
                        initial={{ rotate: -20, scale: 0.5 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                        className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shadow-lg"
                      >
                        <CheckCircle className="w-10 h-10 stroke-[2.5]" />
                      </motion.div>
                    )
                  ) : (
                    settings.failureImageUrl ? (
                      <img 
                        src={settings.failureImageUrl} 
                        referrerPolicy="no-referrer"
                        className="w-24 h-24 object-contain rounded-2xl border border-rose-500/20 shadow-md p-1 bg-slate-950/40"
                        alt="Campaign failure visual badge"
                      />
                    ) : (
                      <motion.div 
                        initial={{ rotate: 20, scale: 0.5 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                        className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/35 flex items-center justify-center text-rose-400 shadow-lg"
                      >
                        <AlertCircle className="w-10 h-10 stroke-[2.5]" />
                      </motion.div>
                    )
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className={`text-base font-black tracking-widest uppercase ${
                    jobDoneOverlay.type === 'success' ? 'text-emerald-400' : 'text-rose-455'
                  }`}>
                    {jobDoneOverlay.type === 'success' ? t('campaign_completed') : t('campaign_terminated')}
                  </h3>
                  <p className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
                    {jobDoneOverlay.campaignName}
                  </p>
                </div>

                <div className="w-full bg-slate-950/45 border border-slate-800/80 p-3.5 rounded-2xl space-y-2 text-start font-mono text-[10px]">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>{t('success_dispatches')}:</span>
                    <span className="font-bold text-teal-400">{jobDoneOverlay.totalSent} MSG</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>{t('failed_terminations')}:</span>
                    <span className="font-bold text-rose-400">{jobDoneOverlay.totalFailed} MSG</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>{t('completion_signature')}:</span>
                    <span className="text-slate-500 font-bold">SHA-255 SECURED</span>
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => setJobDoneOverlay(null)}
                    className="py-2.5 bg-slate-800 hover:bg-slate-705 text-slate-300 rounded-xl font-bold font-mono text-[10.5px] uppercase tracking-wide cursor-pointer transition-all active:scale-95 border border-slate-700/60 font-medium"
                  >
                    {t('dismiss_hud')}
                  </button>
                  <button
                    onClick={() => {
                      setJobDoneOverlay(null);
                      setCurrentTab('monitor');
                    }}
                    className={`py-2.5 rounded-xl font-bold font-sans text-[10.5px] uppercase tracking-wider cursor-pointer transition-all active:scale-95 shadow-md font-extrabold ${
                      jobDoneOverlay.type === 'success' 
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                        : 'bg-rose-500 hover:bg-rose-450 text-slate-950'
                    }`}
                  >
                    {t('view_telemetry')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

    </motion.div>
  );
}
