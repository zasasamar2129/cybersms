/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Play, 
  Pause, 
  Square, 
  Calendar, 
  Clock, 
  Users, 
  FileCode2, 
  Zap, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Campaign, MessageTemplate, Contact, CampaignStatus } from '../types.js';

interface CampaignSystemProps {
  campaigns: Campaign[];
  templates: MessageTemplate[];
  contacts: Contact[];
  onSaveCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'sentCount' | 'successCount' | 'failedCount'> & { id?: string, status?: CampaignStatus }) => void;
  onDeleteCampaign: (id: string) => void;
  onDuplicateCampaign: (id: string) => void;
  isDarkMode: boolean;
}

export default function CampaignSystem({
  campaigns,
  templates,
  contacts,
  onSaveCampaign,
  onDeleteCampaign,
  onDuplicateCampaign,
  isDarkMode
}: CampaignSystemProps) {

  // Local state managers
  const [isCreating, setIsCreating] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || '');
  const [audienceType, setAudienceType] = useState<'all' | 'tags' | 'csv_only'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [scheduledEnabled, setScheduledEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [testNumbersInput, setTestNumbersInput] = useState('');

  // Alert notification logs
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Programmatic save trigger for Ctrl+S hotkey
  useEffect(() => {
    const handleSaveSignal = () => {
      const submitBtn = document.getElementById('campaign-save-btn') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.click();
      }
    };
    window.addEventListener('cyber-sms-save', handleSaveSignal);
    return () => window.removeEventListener('cyber-sms-save', handleSaveSignal);
  }, []);

  // Derive unique tags from contacts
  const availableTags = React.useMemo(() => {
    const set = new Set<string>();
    contacts.forEach(c => c.tags?.forEach(tag => set.add(tag)));
    return Array.from(set);
  }, [contacts]);

  // Compute total numbers based on selected audience configuration (Duplicate filter analytics)
  const computeTargetAudienceMetrics = () => {
    let rawList: string[] = [];
    if (audienceType === 'all') {
      rawList = contacts.map(c => c.phone);
    } else if (audienceType === 'tags') {
      rawList = contacts
        .filter(c => c.tags?.some(tag => selectedTags.includes(tag)))
        .map(c => c.phone);
    } else if (audienceType === 'csv_only') {
      rawList = testNumbersInput
        .split(',')
        .map(n => n.trim())
        .filter(n => n.length > 0);
    }

    const totalCount = rawList.length;
    // Normalized format comparison set
    const uniqueList = new Set(rawList.map(num => num.replace(/[\s-+()]/g, '')));
    const duplicateCount = totalCount - uniqueList.size;
    
    return {
      total: totalCount,
      unique: uniqueList.size,
      duplicates: duplicateCount
    };
  };

  const metrics = computeTargetAudienceMetrics();

  // Multi tag selector toggle callback helper
  const toggleTagSelection = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  // Submit new campaign setup
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName) {
      setAlert({ type: 'error', text: 'Campaign codename is required.' });
      return;
    }
    if (!selectedTemplateId) {
      setAlert({ type: 'error', text: 'Please select an SMS template.' });
      return;
    }
    if (audienceType === 'tags' && selectedTags.length === 0) {
      setAlert({ type: 'error', text: 'Please select at least one target tag.' });
      return;
    }
    if (audienceType === 'csv_only' && !testNumbersInput) {
      setAlert({ type: 'error', text: 'Please enter target phone values separated by commas.' });
      return;
    }

    // Build ISO schedule string
    let isoSchedule: string | undefined = undefined;
    if (scheduledEnabled && scheduledDate && scheduledTime) {
      isoSchedule = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    }

    // Capture direct test custom list numbers
    let customList: string[] = [];
    if (audienceType === 'csv_only') {
      customList = testNumbersInput
        .split(',')
        .map(n => n.trim())
        .filter(n => n.length > 5);
    }

    onSaveCampaign({
      name: campaignName.trim(),
      templateId: selectedTemplateId,
      audienceType,
      targetTags: audienceType === 'tags' ? selectedTags : [],
      delaySeconds: Number(delaySeconds) || 2,
      scheduledTime: isoSchedule,
      testNumbers: customList,
      status: isoSchedule ? 'pending' : 'pending', // Defaults to pending
      totalContacts: metrics.unique
    });

    setAlert({ 
      type: 'success', 
      text: `Campaign "${campaignName}" compiled successfully! Unique Targets: ${metrics.unique}${metrics.duplicates > 0 ? ` (${metrics.duplicates} duplicates pruned)` : ''}` 
    });

    // Reset controls
    setCampaignName('');
    setSelectedTags([]);
    setTestNumbersInput('');
    setScheduledEnabled(false);
    setIsCreating(false);

    setTimeout(() => setAlert(null), 5000);
  };

  // Callback to change status directly (Start, Pause, Stop)
  const processCampaignStatusChange = (camp: Campaign, status: CampaignStatus) => {
    onSaveCampaign({
      id: camp.id,
      name: camp.name,
      templateId: camp.templateId,
      audienceType: camp.audienceType,
      targetTags: camp.targetTags,
      delaySeconds: camp.delaySeconds,
      scheduledTime: camp.scheduledTime,
      testNumbers: camp.testNumbers,
      status,
      totalContacts: camp.totalContacts
    });
    setAlert({ type: 'success', text: `Campaign "${camp.name}" transitioned to state: ${status.toUpperCase()}` });
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <div className="space-y-6">

      {/* Action triggers */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h3 className={`text-xs font-bold font-sans tracking-widest uppercase ${
            isDarkMode ? 'text-slate-300' : 'text-slate-800'
          }`}>
            ACTIVE BULK OUTBOX DISPATCH CHANNELS
          </h3>
          <p className={`text-[11px] font-mono mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Configure, start, scale, or mirror campaign flows</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold font-sans transition-colors active:scale-95 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {isCreating ? 'CANCEL CREATION' : 'NEW CAMPAIGN'}
        </button>
      </div>

      {/* User Alerts notification banner */}
      {alert && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-3.5 font-sans border shadow-sm ${
          alert.type === 'success' ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
        }`}>
          {alert.type === 'success' ? <CheckCircle className="w-4.5 h-4.5 stroke-[2.5]" /> : <AlertCircle className="w-4.5 h-4.5 stroke-[2.5]" />}
          <span>{alert.text}</span>
        </div>
      )}

      {/* Main Creation or Details Grid split panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* NEW CAMPAIGN COMPILER MODULE (DIALOG) */}
        {isCreating && (
          <div className={`p-6 rounded-2xl border ${
            isDarkMode ? 'bg-slate-900/60 border-slate-850' : 'bg-white border-slate-200 shadow-md'
          }`}>
            <h3 className={`text-xs font-bold font-sans tracking-widest mb-5 uppercase ${
              isDarkMode ? 'text-slate-300' : 'text-slate-800'
            }`}>
              CAMPAIGN CODESET BUILDER
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              
              <div className="space-y-1.5">
                <label className={`font-bold font-mono tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>CAMPAIGN CODENAME</label>
                <input
                  type="text"
                  required
                  placeholder="EX: CYBER INVOICE RECOVERY Q2"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-850'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`font-bold font-mono tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ATTACH SMS TEMPLATE</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300 font-medium' : 'bg-white border-slate-200 text-slate-750 font-medium'
                  }`}
                >
                  <option value="">Select compiled template...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* AUDIENCE SELECTORS */}
              <div className="space-y-1.5">
                <label className={`font-bold font-mono tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>TARGET AUDIENCE INTERFACE</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'all', label: 'ALL CUSTOMERS' },
                    { key: 'tags', label: 'TAG FILTERED' },
                    { key: 'csv_only', label: 'MANUAL LIST' }
                  ].map((btn) => (
                    <button
                      type="button"
                      key={btn.key}
                      onClick={() => setAudienceType(btn.key as any)}
                      className={`py-2 px-1.5 rounded-lg border text-[10px] font-sans font-bold tracking-wider uppercase transition-colors active:scale-95 cursor-pointer ${
                        audienceType === btn.key
                          ? 'bg-teal-500/15 border-teal-500 text-teal-500 dark:text-teal-400'
                          : isDarkMode 
                            ? 'bg-transparent border-slate-800 text-slate-400 hover:text-slate-200' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Subforms based on audience */}
              {audienceType === 'tags' && (
                <div className={`space-y-1.5 p-3.5 border rounded-xl ${
                  isDarkMode ? 'bg-slate-950/20 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`font-mono tracking-widest text-[9px] block uppercase mb-1.5 ${
                    isDarkMode ? 'text-slate-450' : 'text-slate-550'
                  }`}>Select Target Tag Filters</span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.map((tag) => {
                      const sel = selectedTags.includes(tag);
                      return (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => toggleTagSelection(tag)}
                          className={`px-2 py-1 text-[10px] font-mono tracking-wider font-semibold rounded uppercase border transition-colors cursor-pointer ${
                            sel 
                              ? 'bg-teal-500 text-slate-950 border-teal-500' 
                              : isDarkMode 
                                ? 'bg-transparent border-slate-800 text-slate-405 hover:text-slate-200' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                    {availableTags.length === 0 && (
                      <span className="text-[10px] text-slate-500 italic pr-2">No contact tag directories active in manager.</span>
                    )}
                  </div>
                </div>
              )}

              {audienceType === 'csv_only' && (
                <div className={`space-y-1.5 p-3.5 border rounded-xl ${
                  isDarkMode ? 'bg-slate-950/20 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`font-mono tracking-widest text-[9px] block uppercase mb-1 ${
                    isDarkMode ? 'text-slate-450' : 'text-slate-550'
                  }`}>Enter target numbers separated by commas</span>
                  <textarea
                    rows={2}
                    placeholder="+16509988110, +15550293111, +15550293882"
                    value={testNumbersInput}
                    onChange={(e) => setTestNumbersInput(e.target.value)}
                    className={`w-full p-2 text-[11px] font-mono rounded-lg border focus:outline-none focus:border-teal-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              )}

              {/* DUPLICATE TELEMETRY PRUNING INFO CARD */}
              <div className={`p-3 border rounded-xl space-y-1 ${
                isDarkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`flex justify-between text-[11px] font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>Gross Targets Selected:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-slate-250' : 'text-slate-900'}`}>{metrics.total}</span>
                </div>
                {metrics.duplicates > 0 && (
                  <div className="flex justify-between text-[11px] font-mono text-rose-500 font-medium">
                    <span>Duplicates Pruned:</span>
                    <span className="font-bold">- {metrics.duplicates} (Auto-Filter)</span>
                  </div>
                )}
                <div className={`flex justify-between text-[11px] font-mono text-teal-650 dark:text-emerald-400 border-t pt-1 mt-1 font-bold ${
                  isDarkMode ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <span>Deduplicated Total:</span>
                  <span>{metrics.unique} Contacts</span>
                </div>
              </div>

              {/* DELAY SECONDS CONTROL */}
              <div className="space-y-1.5">
                <div className={`flex justify-between items-center font-mono tracking-wider ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  <span>RATE DELAY SPACER</span>
                  <span className="text-teal-605 dark:text-teal-400 font-bold">{delaySeconds} SECONDS / SMS</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <p className="text-[9px] text-slate-500 font-mono">Ensures compliance and prevents mobile network rate protection timeouts.</p>
              </div>

              {/* COGNITIVE CAMPAIGN SCHEDULING (TIME LOCKS) */}
              <div className={`border-t pt-4 space-y-3 ${isDarkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-mono font-bold tracking-widest uppercase text-[10px] flex items-center gap-1.5 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-800'
                  }`}>
                    <Calendar className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
                    SCHEDULED DISPATCH GATE
                  </span>
                  <input
                    type="checkbox"
                    checked={scheduledEnabled}
                    onChange={(e) => setScheduledEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-705 bg-slate-900 text-teal-500 checked:bg-teal-500 hover:checked:bg-teal-400 focus:ring-1 focus:ring-teal-500/50 cursor-pointer accent-teal-500 transition-all focus:outline-none focus:ring-offset-0 shrink-0"
                  />
                </div>

                {scheduledEnabled && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">DATE</span>
                      <input
                        type="date"
                        required={scheduledEnabled}
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className={`w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:border-teal-500 ${
                          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-350 text-slate-850'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-505 font-mono uppercase tracking-wider block">TIME (T-LOC)</span>
                      <input
                        type="time"
                        required={scheduledEnabled}
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className={`w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:border-teal-500 ${
                          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-355 text-slate-850'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit trigger */}
              <div className="pt-2">
                <button
                  id="campaign-save-btn"
                  type="submit"
                  className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black tracking-widest uppercase rounded-xl transition-all active:scale-95 shadow-sm"
                >
                  {scheduledEnabled ? 'SECURE SCHEDULE TASK' : 'LAUNCH NEW CAMPAIGN'}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* CAMPAIGN ACTIVE RUNNING DIRECTORIES */}
        <div className={`lg:col-span-2 space-y-4 max-h-[75vh] overflow-y-auto pr-1 scrollbar-thin ${
          isCreating ? 'lg:col-span-2' : 'lg:col-span-3'
        }`}>
          {campaigns.length === 0 ? (
            <div className="text-center py-20 border border-slate-800 rounded-2xl bg-slate-900/10">
              <p className="text-xs font-mono text-slate-500 uppercase">[NO SMS CAMPAIGNS REGISTERED]</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...campaigns].reverse().map((camp) => {
                const percent = camp.totalContacts > 0 ? Math.round((camp.sentCount / camp.totalContacts) * 100) : 0;
                
                // Read connected template name
                const resolvedTemplate = templates.find(t => t.id === camp.templateId);
                const templateName = resolvedTemplate ? resolvedTemplate.name : 'Unknown Body template';

                return (
                  <div
                    key={camp.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between group h-full ${
                      camp.status === 'sending' 
                        ? 'bg-teal-950/20 border-teal-500/70 shadow-sm shadow-teal-500/5' 
                        : isDarkMode 
                          ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700' 
                          : 'bg-white border-slate-200 hover:border-slate-350 shadow-sm animate-faded'
                    }`}
                  >
                    <div className="space-y-4">
                      
                      {/* Title & Operations badges */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className={`text-xs font-bold font-sans uppercase tracking-widest ${
                            isDarkMode ? 'text-slate-100' : 'text-slate-850'
                          }`}>
                            {camp.name}
                          </h4>
                          <span className={`text-[9px] font-mono flex items-center gap-1 uppercase ${
                            isDarkMode ? 'text-slate-500' : 'text-slate-600'
                          }`}>
                            <FileCode2 className={`w-3 h-3 ${isDarkMode ? 'text-slate-650' : 'text-slate-450'}`} />
                            {templateName}
                          </span>
                        </div>
                        
                        {/* Status elements */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {camp.status === 'completed' && (
                            <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0 fill-emerald-500/10" />
                          )}
                          {(camp.status === 'stopped' || camp.failedCount > 0) && (
                            <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0 fill-rose-500/10" />
                          )}
                          
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-widest font-extrabold uppercase flex items-center gap-1 ${
                            camp.status === 'sending'
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 animate-pulse'
                              : camp.status === 'paused'
                                ? 'bg-amber-950/40 text-amber-500 border border-amber-900/40'
                                : camp.status === 'completed'
                                  ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-555/30'
                                  : camp.status === 'stopped'
                                    ? 'bg-rose-950/30 text-rose-450 border border-rose-555/30 font-medium'
                                    : 'bg-slate-850 text-slate-400 border border-slate-700'
                          }`}>
                            {camp.status === 'sending' && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-ping"></span>}
                            {camp.status}
                          </span>
                        </div>
                      </div>

                      {/* Campaign scheduled details */}
                      {camp.scheduledTime && camp.status === 'pending' && (
                        <div className={`flex items-center gap-1.5 p-2 rounded-lg text-[9px] font-mono ${
                          isDarkMode ? 'bg-slate-950/40 border-slate-850 text-amber-400' : 'bg-amber-50 border-amber-205 text-amber-700'
                        }`}>
                          <Clock className="w-3 h-3 text-pink-500 dark:text-pink-400" />
                          SCHEDULED FOR: {new Date(camp.scheduledTime).toLocaleString()}
                        </div>
                      )}

                      {/* Core numbers telemetry stats line */}
                      <div className="space-y-1.5 pt-1">
                        <div className={`flex justify-between items-center text-[10px] font-mono ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-650'
                        }`}>
                          <span>Progress: {percent}%</span>
                          <span>{camp.sentCount} / {camp.totalContacts} sms</span>
                        </div>
                        <div className={`w-full h-2 rounded-full overflow-hidden border ${
                          isDarkMode ? 'bg-slate-950/60 border-slate-800/50' : 'bg-slate-100 border-slate-200'
                        }`}>
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${
                              camp.status === 'sending' 
                                ? 'from-teal-400 to-emerald-500' 
                                : 'from-indigo-500 to-purple-500'
                            }`} 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        
                        {/* Stats mini counters details */}
                        <div className="grid grid-cols-3 gap-1 pt-1 text-center text-[9px] font-mono">
                          <div className={`p-1.5 rounded-lg border ${
                            isDarkMode ? 'bg-slate-950/30 border-slate-900 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            <span className={isDarkMode ? 'text-slate-400 block font-sans' : 'text-slate-500 block font-sans'}>SENT</span>
                            <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{camp.sentCount}</span>
                          </div>
                          <div className={`p-1.5 rounded-lg border ${
                            isDarkMode ? 'bg-slate-950/30 border-slate-900 text-teal-400 font-bold' : 'bg-slate-50 border-slate-200 text-teal-700 font-bold'
                          }`}>
                            <span className={isDarkMode ? 'text-slate-400 block font-sans' : 'text-slate-500 block font-sans'}>OK</span>
                            <span className="font-bold">{camp.successCount}</span>
                          </div>
                          <div className={`p-1.5 rounded-lg border ${
                            isDarkMode ? 'bg-rose-950/10 border-rose-950/20 text-rose-455' : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}>
                            <span className={isDarkMode ? 'text-rose-450 block font-sans' : 'text-rose-600 block font-sans'}>FAIL</span>
                            <span className="font-bold">{camp.failedCount}</span>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Operational controls bottom bar */}
                    <div className={`mt-5 pt-3.5 border-t flex items-center justify-between ${
                      isDarkMode ? 'border-slate-800/40' : 'border-slate-150'
                    }`}>
                      
                      {/* Interactive controllers actions */}
                      <div className="flex items-center gap-1.5">
                        
                        {camp.status !== 'completed' && camp.status !== 'sending' && (
                          <button
                            onClick={() => processCampaignStatusChange(camp, 'sending')}
                            className="p-1 px-2.5 rounded-lg bg-teal-500 text-slate-900 border border-teal-500 hover:bg-teal-400 hover:text-slate-950 flex items-center gap-1 text-[10px] font-bold font-sans uppercase active:scale-95 transition-all cursor-pointer shadow-sm"
                            title="Start Sending"
                          >
                            <Play className="w-3 h-3 fill-slate-950" />
                            RUN
                          </button>
                        )}
                        
                        {camp.status === 'sending' && (
                          <button
                            onClick={() => processCampaignStatusChange(camp, 'paused')}
                            className="p-1 px-2.5 rounded-lg bg-amber-500 text-slate-955 border border-amber-500 hover:bg-amber-400 flex items-center gap-1 text-[10px] font-bold font-sans uppercase active:scale-95 transition-all cursor-pointer shadow-sm"
                            title="Pause sending"
                          >
                            <Pause className="w-3 h-3 fill-slate-950" />
                            PAUSE
                          </button>
                        )}

                        {camp.status === 'sending' && (
                          <button
                            onClick={() => processCampaignStatusChange(camp, 'stopped')}
                            className="p-1 px-2 bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 flex items-center gap-1 text-[10px] font-bold font-sans uppercase cursor-pointer"
                            title="Stop campaign permanently"
                          >
                            <Square className="w-2.5 h-2.5 fill-slate-350" />
                            STOP
                          </button>
                        )}

                        {/* Duplication button copy */}
                        <button
                          onClick={() => onDuplicateCampaign(camp.id)}
                          className={`p-1.5 rounded-lg border flex items-center gap-1 font-mono text-[9px] transition-all font-bold uppercase active:scale-95 cursor-pointer ${
                            isDarkMode 
                              ? 'bg-slate-950/45 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:border-slate-700' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-slate-300'
                          }`}
                          title="Duplicate Campaign with settings"
                        >
                          <Copy className="w-3 h-3" />
                          COPY
                        </button>

                      </div>

                      {/* Deletion triggers */}
                      <button
                        onClick={() => onDeleteCampaign(camp.id)}
                        className="p-1.5 rounded-lg bg-rose-950/10 border border-rose-500/10 text-rose-400 hover:bg-rose-955/25 cursor-pointer"
                        title="Delete campaign"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
