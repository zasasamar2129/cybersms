/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLanguage } from '../lib/translations';
import { 
  Trash2, 
  Search, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  History,
  TrendingDown,
  Info
} from 'lucide-react';
import { SmsLog, SmsSettings } from '../types.js';

interface LogSystemProps {
  logs: SmsLog[];
  onClearLogs: () => void;
  isDarkMode: boolean;
  settings: SmsSettings;
}

export default function LogSystem({
  logs,
  onClearLogs,
  isDarkMode,
  settings
}: LogSystemProps) {
  const { t, language } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getLogCategory = (log: SmsLog): 'INFO' | 'WARNING' | 'ERROR' => {
    if (log.status === 'failed' || (log.errorReason && !log.errorReason.toLowerCase().includes('simulated') && !log.errorReason.toLowerCase().includes('success'))) {
      return 'ERROR';
    }
    if (log.retryCount > 0 || (log.errorReason && log.errorReason.toLowerCase().includes('simulated'))) {
      return 'WARNING';
    }
    return 'INFO';
  };

  const handleCopyCurl = (log: SmsLog) => {
    const url = settings.gatewayUrl || 'http://YOUR_ANDROID_IP:8082/';
    const tokenHeader = settings.apiToken ? `-H "X-Gateway-Token: ${settings.apiToken}" -H "Authorization: ${settings.apiToken}"` : '';
    // Format Curl with single quotes or escaped double quotes to handle variables properly
    const curl = `curl -X POST "${url}" \\\n  -H "Content-Type: application/json" \\\n  ${tokenHeader ? tokenHeader + ' \\\n  ' : ''}-d '{\n    "to": "${log.phone}",\n    "message": "${log.message.replace(/'/g, "'\\''")}"\n  }'`;
    
    navigator.clipboard.writeText(curl);
    setCopiedId(`${log.id}-curl`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyPowerShell = (log: SmsLog) => {
    const url = settings.gatewayUrl || 'http://YOUR_ANDROID_IP:8082/';
    const headers = settings.apiToken 
      ? `@{\n  "Content-Type" = "application/json"\n  "X-Gateway-Token" = "${settings.apiToken}"\n  "Authorization" = "${settings.apiToken}"\n}`
      : `@{\n  "Content-Type" = "application/json"\n}`;
    const ps = `$headers = ${headers}\n$body = @{\n  "to" = "${log.phone}"\n  "message" = "${log.message.replace(/"/g, '`"')}"\n} | ConvertTo-Json -Depth 5\nInvoke-RestMethod -Uri "${url}" -Method Post -Headers $headers -Body $body`;
    
    navigator.clipboard.writeText(ps);
    setCopiedId(`${log.id}-ps`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getHttpErrorInfo = (errorReason?: string) => {
    if (!errorReason) return null;
    const match = errorReason.match(/HTTP Error (\d+)/i);
    if (match && match[1]) {
      const code = match[1];
      let name = 'Unspecified Error';
      if (code === '400') name = 'Bad Request';
      else if (code === '401') name = 'Unauthorized';
      else if (code === '403') name = 'Forbidden';
      else if (code === '404') name = 'Not Found';
      else if (code === '500') name = 'Internal Server';
      else if (code === '502') name = 'Bad Gateway';
      else if (code === '554' || code === '503') name = 'Service Unavailable';
      else if (code === '504') name = 'Gateway Timeout';
      return { code, name };
    }
    return null;
  };

  // Search and filter logs list
  const filteredLogs = React.useMemo(() => {
    return [...logs].reverse().filter(l => {
      const matchesSearch = (l.phone || '').includes(searchTerm) || 
                            (l.message || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (l.campaignName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'ALL' || (l.status || '').toLowerCase() === selectedStatus.toLowerCase();
      
      const category = getLogCategory(l);
      const matchesCategory = selectedCategory === 'ALL' || category === selectedCategory;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [logs, searchTerm, selectedStatus, selectedCategory]);

  // Export to CSV Blob function download block
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    try {
      // Column template titles
      const csvHeader = 'id,timestamp,campaignName,phone,name,message,status,retryCount,errorReason\n';
      const csvRows = logs.map(l => {
        const timestampStr = new Date(l.timestamp).toISOString();
        const cleanedMsg = l.message.replace(/"/g, '""'); // escape double quotes
        const cleanedReason = (l.errorReason || '').replace(/"/g, '""');
        return `"${l.id}","${timestampStr}","${l.campaignName}","${l.phone}","${l.name}","${cleanedMsg}","${l.status}","${l.retryCount}","${cleanedReason}"`;
      }).join('\n');

      const csvContent = csvHeader + csvRows;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `sms_control_logs_export_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('[CSV EXPORTER] Failed to export logs', e);
    }
  };

  return (
    <div className="space-y-6">

      {/* Interactive Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search tool */}
        <div className="relative w-full md:w-96 shrink-0">
          <Search className="absolute left-3.5 top-3.5 rtl:left-auto rtl:right-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('search_logs')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-3 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 font-sans ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-800 text-slate-350 placeholder-slate-500' 
                : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 shadow-xs'
            }`}
          />
        </div>

        {/* Action button groupings */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:justify-end">
          
          {/* Status selecting filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`px-4 py-3 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 font-sans font-bold tracking-wider cursor-pointer ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-800 text-slate-300' 
                : 'bg-white border-slate-200 text-slate-700 shadow-xs'
            }`}
          >
            <option value="ALL">{t('filter_status')}: {t('all_levels')}</option>
            <option value="SENT">DELIVERED (SENT)</option>
            <option value="FAILED">FAILED ATTEMPTS</option>
          </select>

          {/* Category/Level selecting filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-4 py-3 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 font-sans font-bold tracking-wider cursor-pointer ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-800 text-slate-300' 
                : 'bg-white border-slate-200 text-slate-700 shadow-xs'
            }`}
          >
            <option value="ALL">{t('all_levels')}</option>
            <option value="INFO">{t('info_level')}</option>
            <option value="WARNING">{t('warning_level')}</option>
            <option value="ERROR">{t('error_level')}</option>
          </select>

          {/* Export click button */}
          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-xs font-bold font-sans transition-all active:scale-95 duration-150 ${
              logs.length === 0
                ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600'
                : isDarkMode 
                  ? 'bg-transparent border-slate-800 text-slate-300 hover:bg-slate-900/40' 
                  : 'bg-white border-slate-202 text-slate-700 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-teal-450" />
            {t('export_csv')}
          </button>

          {/* Wipe button records */}
          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-xs font-bold font-sans transition-all active:scale-95 duration-150 ${
              logs.length === 0
                ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600'
                : 'bg-rose-950/20 hover:bg-rose-950/40 border-rose-900/40 text-rose-400'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {language === 'fa' ? 'پاکسازی آرشیو لاگ‌ها' : 'CLEAR DATABASE LOGS'}
          </button>

        </div>

      </div>

      {/* Main logs display grid */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex justify-between items-center pb-4 border-b border-inherit mb-4 px-1">
          <span className={`text-xs font-mono font-bold tracking-widest uppercase ${
            isDarkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>Historic SMS Telemetry Vault</span>
          <span className={`text-xs font-mono font-black text-right uppercase ${
            isDarkMode ? 'text-slate-300' : 'text-slate-800'
          }`}>
            {filteredLogs.length} LOGS RETRIEVED
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-20 font-mono text-xs text-slate-500 flex flex-col items-center gap-4 justify-center">
            <History className="w-12 h-12 text-slate-500 animate-pulse opacity-50" />
            <span>[NO TELEMETRY RECORDED IN HARD DRIVE OR MATCHING THE ACTIVE SEARCH TERMS]</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs min-w-[700px]">
              <thead>
                <tr className={`border-b border-inherit text-[10px] font-mono font-black tracking-wider ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  <th className="pb-3.5 uppercase">TIMESTAMP</th>
                  <th className="pb-3.5 uppercase text-left">LEVEL</th>
                  <th className="pb-3.5 uppercase">CAMPAIGN</th>
                  <th className="pb-3.5 uppercase">SUBSCRIBER</th>
                  <th className="pb-3.5 uppercase">DESTINATION</th>
                  <th className="pb-3.5 uppercase">MESSAGE PAYLOAD TEXT</th>
                  <th className="pb-3.5 uppercase">STATUS</th>
                  <th className="pb-3.5 uppercase">RETRIES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-colors">
                    <td className={`py-4 font-mono text-[10px] shrink-0 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 whitespace-nowrap">
                      {(() => {
                        const cat = getLogCategory(log);
                        if (cat === 'ERROR') {
                          return (
                            <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-250 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40 flex items-center gap-1 w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                              ERROR
                            </span>
                          );
                        } else if (cat === 'WARNING') {
                          return (
                            <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-250 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40 flex items-center gap-1 w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0 animate-pulse" />
                              WARN
                            </span>
                          );
                        } else {
                          return (
                            <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-sky-50 text-sky-700 border border-sky-250 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/40 flex items-center gap-1 w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block shrink-0" />
                              INFO
                            </span>
                          );
                        }
                      })()}
                    </td>
                    <td className={`py-4 font-bold truncate max-w-[125px] ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-900'
                    }`}>
                      {log.campaignName}
                    </td>
                    <td className={`py-4 font-medium truncate max-w-[110px] ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-800'
                    }`}>
                      {log.name}
                    </td>
                    <td className={`py-4 font-mono text-[10px] ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {log.phone}
                    </td>
                    <td className={`py-4 text-[11px] leading-relaxed font-sans pr-6 break-words max-w-[320px] ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-650'
                    }`}>
                      {log.message}
                      {log.errorReason && (
                        <div className={`mt-2.5 p-2 border rounded-lg space-y-2 ${
                          isDarkMode ? 'bg-rose-950/10 border-rose-900/30' : 'bg-rose-50 border-rose-200'
                        }`}>
                          <div className={`flex flex-wrap items-center gap-1.5 font-mono text-[9px] ${
                            isDarkMode ? 'text-rose-300' : 'text-rose-800'
                          }`}>
                            <span className="font-bold uppercase text-rose-550 dark:text-rose-455">Error:</span>
                            <span>{log.errorReason}</span>
                          </div>
                          
                          <div className={`flex flex-wrap items-center gap-2 pt-1 border-t ${
                            isDarkMode ? 'border-rose-900/20' : 'border-rose-200'
                          }`}>
                            <span className="text-[8px] text-slate-500 tracking-wider font-bold uppercase">RE-SEND DEBUG:</span>
                            <button
                              onClick={() => handleCopyCurl(log)}
                              className="px-2 py-0.5 text-[8px] font-bold uppercase text-teal-600 hover:text-teal-750 dark:text-teal-400 dark:hover:text-teal-350 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 rounded transition-all active:scale-95 duration-75 cursor-pointer"
                              title="Copy exact HTTP cURL command to clipboard"
                            >
                              cURL
                            </button>
                            <button
                              onClick={() => handleCopyPowerShell(log)}
                              className="px-2 py-0.5 text-[8px] font-bold uppercase text-sky-600 hover:text-sky-750 dark:text-sky-400 dark:hover:text-sky-350 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 rounded transition-all active:scale-95 duration-75 cursor-pointer"
                              title="Copy exact PowerShell Invoke-RestMethod snippet to clipboard"
                            >
                              PowerShell
                            </button>
                            
                            {copiedId === `${log.id}-curl` && (
                              <span className="text-[8px] text-emerald-650 dark:text-emerald-400 font-mono font-bold animate-pulse">✓ cURL COPIED!</span>
                            )}
                            {copiedId === `${log.id}-ps` && (
                              <span className="text-[8px] text-emerald-650 dark:text-emerald-400 font-mono font-bold animate-pulse">✓ PS COPIED!</span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col gap-1 justify-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest text-center block w-max ${
                          log.status === 'sent' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30' 
                            : 'bg-rose-50 text-rose-700 border border-rose-250 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30'
                        }`}>
                          {log.status === 'sent' ? 'DELIVERED' : 'FAILED'}
                        </span>
                        {getHttpErrorInfo(log.errorReason) && (
                          <span className={`text-[8px] font-mono font-bold uppercase block tracking-tight ${
                            isDarkMode ? 'text-rose-400' : 'text-rose-700'
                          }`}>
                            HTTP {getHttpErrorInfo(log.errorReason)!.code}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`py-4 font-mono font-semibold text-center ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-700'
                    }`}>
                      {log.retryCount} / 2
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
