/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Radio, 
  Activity, 
  ShieldCheck, 
  AlertTriangle,
  FileCode2,
  Smartphone,
  Server
} from 'lucide-react';
import { Campaign, SmsLog, MessageTemplate } from '../types.js';

interface SendingMonitorProps {
  campaigns: Campaign[];
  logs: SmsLog[];
  templates: MessageTemplate[];
  isDarkMode: boolean;
  onNavigateTab: (tab: string) => void;
  dryRun: boolean;
}

export default function SendingMonitor({
  campaigns,
  logs,
  templates,
  isDarkMode,
  onNavigateTab,
  dryRun
}: SendingMonitorProps) {

  // Isolate campaign that is actively sending
  const activeCampaign = campaigns.find(c => c.status === 'sending');

  // Filter logs associated with the active campaign
  const activeLogs = activeCampaign 
    ? logs.filter(l => l.campaignId === activeCampaign.id).sort((a, b) => b.timestamp - a.timestamp)
    : [];

  const percentage = activeCampaign && activeCampaign.totalContacts > 0
    ? Math.round((activeCampaign.sentCount / activeCampaign.totalContacts) * 100)
    : 0;

  // Resolve template in use
  const activeTemplate = activeCampaign && templates.find(t => t.id === activeCampaign.templateId);

  // Helper to extract HTTP error response codes/descriptions
  const getHttpErrorInfo = (errorReason?: string) => {
    if (!errorReason) return null;
    const match = errorReason.match(/HTTP Error (\d+)/i);
    if (match && match[1]) {
      const code = match[1];
      let name = 'Unspecified';
      if (code === '400') name = 'Bad Request';
      else if (code === '401') name = 'Unauthorized';
      else if (code === '403') name = 'Forbidden';
      else if (code === '404') name = 'Not Found';
      else if (code === '500') name = 'Internal Server';
      else if (code === '502') name = 'Bad Gateway';
      else if (code === '503') name = 'Service Unavailable';
      else if (code === '504') name = 'Gateway Timeout';
      return { code, name };
    }
    return null;
  };

  return (
    <div className="space-y-6">

      {/* Tunnels header display */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 ${
        isDarkMode ? 'border-slate-800/40' : 'border-slate-200'
      }`}>
        <div>
          <h3 className={`text-xs font-bold font-sans tracking-widest uppercase ${
            isDarkMode ? 'text-slate-300' : 'text-slate-800'
          }`}>
            OPERATIONS MONITOR & TELEMETRY
          </h3>
          <p className={`text-[11px] font-mono mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Real-time outbox synchronization logs</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeCampaign ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${activeCampaign ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className={`text-xs font-mono font-black uppercase ${
            isDarkMode ? 'text-slate-300' : 'text-slate-800'
          }`}>
            {activeCampaign ? `TUNNEL ACTIVE: ${activeCampaign.name}` : 'PIPELINE STANDBY (IDLE)'}
          </span>
        </div>
      </div>

      {!activeCampaign ? (
        <div className={`text-center py-20 rounded-2xl border ${
          isDarkMode ? 'bg-slate-900/20 border-slate-805' : 'bg-slate-50/55 border-slate-205 shadow-xs'
        }`}>
          <Radio className="w-14 h-14 text-slate-400 dark:text-slate-500 mx-auto animate-pulse opacity-60" />
          <h4 className={`text-xs font-bold mt-4 uppercase ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>NO ACTIVE TRANSMISSION PIPELINE</h4>
          <p className={`text-xs font-sans mt-1 px-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Go to the SMS Campaigns page, define or find a pending campaign record, and push RUN to stream telemetry.
          </p>
          <div className="pt-6">
            <button
              onClick={() => onNavigateTab('campaigns')}
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold font-sans rounded-xl transition-all active:scale-95"
            >
              LAUNCH CAMPAIGNS CENTER
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ACTIVE DISPATCH METRICS PANEL */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Live Progress Card */}
            <div className={`p-6 rounded-2xl border ${
              isDarkMode ? 'bg-slate-900/60 border-slate-850' : 'bg-white border-slate-250 shadow-md animate-faded'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">ACTIVE STREAM DATA</span>
                  <h4 className="text-sm font-bold text-slate-100 uppercase tracking-widest">{activeCampaign.name}</h4>
                </div>
                
                {dryRun && (
                  <span className="px-2 py-0.5 bg-teal-950/40 text-teal-400 border border-teal-900/40 text-[9px] font-mono font-bold rounded">
                    SIMULATOR ACTIVE
                  </span>
                )}
              </div>

              {/* Dynamic percentage circular progress look */}
              <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-slate-950/40 border border-slate-805/80 rounded-xl">
                
                {/* SVG Progress bar ring */}
                <div className="relative w-32 h-32 shrink-0">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="54" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} strokeWidth="10" fill="transparent" />
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="54" 
                      stroke="#14b8a6" 
                      strokeWidth="10" 
                      fill="transparent" 
                      strokeDasharray="339.29"
                      strokeDashoffset={339.29 - (339.29 * percentage) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black font-mono text-slate-100">{percentage}%</span>
                    <span className="text-[8px] font-mono text-slate-500 uppercase">FINISHED</span>
                  </div>
                </div>

                {/* Micro Counters and stats columns */}
                <div className="flex-1 w-full space-y-4">
                  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-lg">
                      <span className="text-[9px] text-slate-400 font-mono uppercase block">LOAD DISPATCH</span>
                      <span className="text-lg font-bold text-slate-100 font-mono tracking-wider">{activeCampaign.sentCount} / {activeCampaign.totalContacts}</span>
                    </div>

                    <div className="p-2.5 bg-emerald-950/15 border border-emerald-900/40 rounded-lg">
                      <span className="text-[9px] text-emerald-400 font-mono uppercase block">DELIVERED</span>
                      <span className="text-lg font-bold text-emerald-400 font-mono tracking-wider">{activeCampaign.successCount}</span>
                    </div>

                    <div className="p-2.5 bg-rose-950/15 border border-rose-900/40 rounded-lg">
                      <span className="text-[9px] text-rose-450 font-mono uppercase block">FAIL RATE</span>
                      <span className="text-lg font-bold text-rose-400 font-mono tracking-wider">{activeCampaign.failedCount}</span>
                    </div>
                  </div>

                  <div className="text-xs font-sans text-slate-400 flex items-center gap-2">
                    <Server className="w-4 h-4 text-teal-400" />
                    <span><b>Sender rule Delay config:</b> Every message is spaced with a <b>{activeCampaign.delaySeconds} seconds</b> interval rate block.</span>
                  </div>

                </div>

              </div>
              
              {/* Connected templates information detail */}
              <div className="mt-5 space-y-2">
                <span className="text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase">TEMPLATE PREVISUALIZATION TEXT</span>
                <div className="p-3 bg-slate-950 text-[11px] font-mono text-slate-350 border border-slate-805 rounded-xl block leading-relaxed max-h-[100px] overflow-y-auto">
                  {activeTemplate ? activeTemplate.text : '[Template body lost or changed]'}
                </div>
              </div>

            </div>

            {/* LIVE VERIFICATION PIPELINE FLOWS */}
            <div className={`p-6 rounded-2xl border ${
              isDarkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h3 className="text-xs font-bold font-sans tracking-widest text-slate-300 mb-4 uppercase">
                ACTIVE PIPELINE METRIC TRACES
              </h3>

              <div className="space-y-3 font-mono text-xs">
                
                <div className="flex justify-between items-center p-2.5 bg-slate-950/35 rounded-xl border border-slate-900">
                  <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                    <Activity className="w-3.5 h-3.5 text-teal-400" />
                    Network Outbox Ingress Buffer
                  </span>
                  <span className="text-slate-200">NORMAL (OK)</span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-slate-950/35 rounded-xl border border-slate-900">
                  <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    API Token validation index
                  </span>
                  <span className="text-emerald-400 font-bold uppercase">VERIFIED SECURE</span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-slate-950/35 rounded-xl border border-slate-900">
                  <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                    <Server className="w-3.5 h-3.5 text-teal-400" />
                    Sms personaliser thread
                  </span>
                  <span className="text-[11px] font-mono text-slate-300">AUTOMATIC INTERPOLATION</span>
                </div>

              </div>
            </div>

          </div>

          {/* REALTIME TERMINAL SCROLL CLOCK LOGS (CYBERPUNK STYLE!) */}
          <div className={`p-6 rounded-2xl border flex flex-col h-[70vh] justify-between ${
            isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 text-slate-100 border-slate-950 shadow-lg'
          }`}>
            <div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-bold font-sans tracking-widest text-teal-400">TELEMETRY LOG STREAM</span>
                <span className="text-[8px] font-mono text-slate-500 animate-pulse font-bold">● FEED ACTIVE</span>
              </div>

              <div className="overflow-y-auto space-y-3 text-[10px] font-mono shrink max-h-[50vh] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {activeLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="p-2.5 bg-black/40 rounded-lg border border-slate-900 flex flex-col gap-1 hover:border-slate-800 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-teal-400 font-bold">{log.phone}</span>
                      <div className="flex items-center gap-1.5">
                        {getHttpErrorInfo(log.errorReason) && (
                          <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 bg-rose-950/70 text-rose-400 border border-rose-800/50 rounded uppercase animate-pulse">
                            HTTP {getHttpErrorInfo(log.errorReason)!.code}: {getHttpErrorInfo(log.errorReason)!.name}
                          </span>
                        )}
                        <span className={`text-[8px] font-bold px-1 rounded uppercase ${
                          log.status === 'sent' ? 'bg-emerald-950/50 text-emerald-400' : 'bg-rose-950/50 text-rose-450'
                        }`}>
                          {log.status === 'sent' ? 'SENT' : 'FAIL'}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-300 text-[10px] lowercase font-sans leading-snug break-words">{log.message}</p>
                    {log.errorReason && (
                      <span className="text-rose-450 text-[8px] block mt-0.5 font-mono">
                        ERR: {log.errorReason}
                      </span>
                    )}
                    <span className="text-[8px] text-slate-500 block text-right">
                      {new Date(log.timestamp).toLocaleTimeString()} (Retry: {log.retryCount})
                    </span>
                  </div>
                ))}

                {activeLogs.length === 0 && (
                  <div className="text-center py-20 text-slate-500">
                    [Awaiting logs packages dispatch...]
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-900 mt-2 flex justify-between items-center">
              <span className="text-[9px] font-mono text-slate-500">Node: Sandbox Ingress v2</span>
              <button 
                onClick={() => onNavigateTab('logs')}
                className="text-[9px] font-mono text-teal-400 hover:underline"
              >
                VIEW LOG FILES
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
