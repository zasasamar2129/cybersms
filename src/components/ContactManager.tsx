/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  Tag, 
  Filter,
  Users,
  Briefcase,
  HelpCircle,
  Download,
  Check
} from 'lucide-react';
import { Contact } from '../types.js';
import { useLanguage } from '../lib/translations.tsx';

interface ContactManagerProps {
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, 'id' | 'createdAt'> & { id?: string }) => void;
  onDeleteContact: (id: string) => void;
  onDeleteContacts: (ids: string[]) => void;
  onImportCSV: (contacts: Omit<Contact, 'id' | 'createdAt'>[]) => void;
  isDarkMode: boolean;
}

export default function ContactManager({
  contacts,
  onAddContact,
  onDeleteContact,
  onDeleteContacts,
  onImportCSV,
  isDarkMode
}: ContactManagerProps) {
  const { t, language } = useLanguage();
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);

  // Checkbox functions
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredContacts.map(c => c.id);
    const allAreSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id));
    
    if (allAreSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const combined = [...prev, ...filteredIds];
        return Array.from(new Set(combined));
      });
    }
  };
  
  // Field States
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({ amount: '', date: '' });
  
  // Alert logs
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Programmatic save trigger for Ctrl+S hotkey
  useEffect(() => {
    const handleSaveSignal = () => {
      const submitBtn = document.getElementById('contact-save-btn') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.click();
      }
    };
    window.addEventListener('cyber-sms-save', handleSaveSignal);
    return () => window.removeEventListener('cyber-sms-save', handleSaveSignal);
  }, []);

  // Derive unique tags from contacts database
  const uniqueTags = React.useMemo(() => {
    const list = new Set<string>();
    contacts.forEach(c => c.tags?.forEach(tag => list.add(tag)));
    return ['ALL', ...Array.from(list)];
  }, [contacts]);

  // Handle Search and tagging filters
  const filteredContacts = React.useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (c.phone || '').includes(searchTerm);
      const matchesTag = selectedTag === 'ALL' || c.tags?.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [contacts, searchTerm, selectedTag]);

  // Form Reset
  const resetForm = () => {
    setName('');
    setPhone('');
    setTagInput('');
    setCustomFields({ amount: '', date: '' });
    setEditId(null);
    setIsAdding(false);
  };

  // Trigger Edit click
  const handleEditClick = (c: Contact) => {
    setEditId(c.id);
    setName(c.name);
    setPhone(c.phone);
    setTagInput(c.tags?.join(', ') || '');
    setCustomFields({
      amount: c.customFields?.amount || '',
      date: c.customFields?.date || '',
    });
    setIsAdding(true);
  };

  // Submit contact add/edit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      setAlertMsg({ type: 'error', text: 'Name and Phone inputs cannot be empty.' });
      return;
    }

    // Clean phone number formats
    const cleanedPhone = phone.trim();
    
    // Duplicate phone detection for single save (excluding self in Edit)
    const isDuplicate = contacts.some(c => 
      c.phone.replace(/[\s-+()]/g, '') === cleanedPhone.replace(/[\s-+()]/g, '') && c.id !== editId
    );

    if (isDuplicate) {
      setAlertMsg({ 
        type: 'error', 
        text: `The phone number ${cleanedPhone} is already registered! Duplicate disallowed.` 
      });
      return;
    }

    // Process tags
    const processedTags = tagInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    onAddContact({
      id: editId || undefined,
      name: name.trim(),
      phone: cleanedPhone,
      tags: processedTags,
      customFields
    });

    setAlertMsg({ 
      type: 'success', 
      text: editId ? 'Subscriber register updated!' : 'New subscriber registered successfully!' 
    });
    
    resetForm();
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // CSV Drag and drop / Manual import listener
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split('\n');
        const parsedContacts: Omit<Contact, 'id' | 'createdAt'>[] = [];
        
        // Skip header index if present (e.g. contains 'name' or 'phone')
        let startIndex = 0;
        if (lines[0] && (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('phone'))) {
          startIndex = 1;
        }

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Split by comma
          const cols = line.split(',');
          if (cols.length < 2) continue;

          const rawName = cols[0].replace(/["']/g, '').trim();
          const rawPhone = cols[1].replace(/["']/g, '').trim();
          
          if (!rawName || !rawPhone) continue;

          // Process tags or optional custom values in index mapping
          const itemTags: string[] = [];
          if (cols[2]) {
            cols[2].replace(/["']/g, '').split(';').forEach(tag => {
              if (tag.trim()) itemTags.push(tag.trim().toLowerCase());
            });
          }

          const itemCustom: Record<string, string> = {
            amount: cols[3]?.replace(/["']/g, '').trim() || '',
            date: cols[4]?.replace(/["']/g, '').trim() || '',
          };

          parsedContacts.push({
            name: rawName,
            phone: rawPhone,
            tags: itemTags,
            customFields: itemCustom
          });
        }

        if (parsedContacts.length === 0) {
          setAlertMsg({ type: 'error', text: 'The CSV format seems unreadable or empty. Required: name, phone' });
          return;
        }

        onImportCSV(parsedContacts);
        setAlertMsg({ 
          type: 'success', 
          text: `Processed CSV uploads! Delivered entries to database system.` 
        });
        setTimeout(() => setAlertMsg(null), 5000);

      } catch (err) {
        setAlertMsg({ type: 'error', text: 'Error parsing CSV upload file.' });
      }
    };
    reader.readAsText(file);
    // Clear input
    e.target.value = '';
  };

  // Sample CSV generator trigger
  const triggerSampleDownload = () => {
    const csvContent = `name,phone,tags,amount,date
"Alpha Sentinel","+15550199281","VIP;regular","$150.00","June 30"
"Major Tom","+15550199555","VIP;overdue","$240.00","June 15"
"Nova Prime","+15550198811","regular","$75.50","July 05"
"Cyber Core","+15550192300","new-lead","$0.00","N/A"`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sms_sample_contacts.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Search and interactive operations block */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Input bar */}
        <div className="relative w-full md:w-96 shrink-0">
          <Search className="absolute left-3.5 top-3.5 rtl:left-auto rtl:right-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'fa' ? 'جستجوی نام، تلفن یا دسته‌بندی...' : "Search by name, phone register..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-3 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 font-sans ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-800 text-slate-200 placeholder-slate-500' 
                : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 shadow-xs'
            }`}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:justify-end">
          
          {/* Tag Filter selection dropdown */}
          <div className="relative">
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className={`pl-8 pr-10 rtl:pl-10 rtl:pr-8 py-3 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 font-sans font-bold tracking-wider appearance-none uppercase cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-900/60 border-slate-800 text-slate-300' 
                  : 'bg-white border-slate-200 text-slate-700 shadow-xs'
              }`}
            >
              {uniqueTags.map((t) => (
                <option key={t} value={t}>{t === 'ALL' ? (language === 'fa' ? 'همه برچسب‌ها' : 'ALL TAGS') : t}</option>
              ))}
            </select>
            <Filter className="absolute left-3 rtl:left-auto rtl:right-3 top-3.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Sample CSV triggers */}
          <button
            onClick={triggerSampleDownload}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold font-sans transition-colors active:scale-95 ${
              isDarkMode 
                ? 'bg-slate-950/40 border-slate-800 hover:bg-slate-900 text-slate-300' 
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            {language === 'fa' ? 'فایل نمونه CSV' : 'CSV SAMPLE'}
          </button>

          {/* Direct Input upload csv hidden trigger */}
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleCSVUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold font-sans transition-colors active:scale-95 ${
              isDarkMode 
                ? 'bg-transparent border-slate-800 text-slate-300 hover:bg-slate-900/60' 
                : 'bg-white border-slate-205 text-slate-700 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-teal-400" />
            {language === 'fa' ? 'بارگذاری فایل CSV' : 'UPLOAD CSV'}
          </button>

          {/* Open/Close toggle single edit format form panel */}
          <button
            onClick={() => {
              if (isAdding) resetForm();
              else setIsAdding(true);
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold font-sans transition-colors active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {isAdding 
              ? (language === 'fa' ? 'بستن فرم' : 'CANCEL CONSOLE') 
              : (language === 'fa' ? 'افزودن مخاطب' : 'ADD CONTACT')}
          </button>

        </div>

      </div>

      {/* Alert Messaging component */}
      {alertMsg && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-3.5 font-sans shadow-sm ${
          alertMsg.type === 'success' 
            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
        }`}>
          {alertMsg.type === 'success' ? <CheckCircle className="w-4 h-4 stroke-[2.5]" /> : <AlertTriangle className="w-4 h-4 stroke-[2.5]" />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Main contact area split panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ADD / EDIT POP-UP GRID MODULE */}
        {isAdding && (
          <div className={`p-6 rounded-2xl border ${
            isDarkMode ? 'bg-slate-900/60 border-slate-850' : 'bg-white border-slate-200 shadow-md'
          }`}>
            <h3 className={`text-xs font-bold font-sans tracking-widest mb-5 uppercase ${
              isDarkMode ? 'text-slate-300' : 'text-slate-800'
            }`}>
              {editId 
                ? (language === 'fa' ? 'ویرایش اطلاعات مخاطب' : 'MODIFY SUBSCRIBER REGISTRY') 
                : (language === 'fa' ? 'ثبت اطلاعات مخاطب جدید' : 'CREATE SUBSCRIBER TELEMETRY')}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              
              <div className="space-y-1.5">
                <label className={`font-bold font-mono tracking-wider ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>{language === 'fa' ? 'نام کامل مخاطب' : 'FULL NAME'}</label>
                <input
                  type="text"
                  required
                  placeholder="Alpha Sentinel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`font-bold font-mono tracking-wider ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>{language === 'fa' ? 'شماره تماس (همراه با کد کشور)' : 'PHONE DIGITS (with Country Prefix)'}</label>
                <input
                  type="text"
                  required
                  placeholder="+15550199281"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`font-bold font-mono tracking-wider flex items-center justify-between ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  <span>{language === 'fa' ? 'برچسب‌ها' : 'TAG LABELS'}</span>
                  <span className={`text-[10px] capitalize font-sans leading-none italic ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-450'
                  }`}>{language === 'fa' ? 'جداسازی با کاما' : 'Split with commas'}</span>
                </label>
                <input
                  type="text"
                  placeholder="VIP, regular, overdue"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              {/* Custom Variable Fields */}
              <div className={`border-t pt-4 mt-2 space-y-3 ${
                isDarkMode ? 'border-slate-800/60' : 'border-slate-200'
              }`}>
                <div className="flex justify-between items-center">
                  <h4 className={`text-[10px] font-mono font-bold tracking-widest uppercase ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    CUSTOM CYBER VARIABLES
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const newKey = `cust_${Math.random().toString(36).substring(2, 6)}`;
                      setCustomFields(prev => ({ ...prev, [newKey]: '' }));
                    }}
                    className="text-[9px] font-mono font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    + ADD VARIABLE
                  </button>
                </div>
                
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {Object.entries(customFields).map(([key, val]) => {
                    const isDefault = key === 'amount' || key === 'date';
                    return (
                      <div key={key} className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                          <label className={`font-semibold tracking-wide uppercase text-[8px] font-mono block ${
                            isDarkMode ? 'text-slate-500' : 'text-slate-600'
                          }`}>KEY</label>
                          <input
                            type="text"
                            required
                            disabled={isDefault}
                            value={key}
                            onChange={(e) => {
                              const nextKey = e.target.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
                              if (!nextKey || nextKey === key) return;
                              setCustomFields(prev => {
                                const copy = { ...prev };
                                copy[nextKey] = copy[key];
                                delete copy[key];
                                return copy;
                              });
                            }}
                            className={`w-full p-2 text-xs rounded-lg border font-mono ${
                              isDefault 
                                ? 'bg-slate-900/10 dark:bg-slate-900/40 text-slate-500 border-transparent cursor-not-allowed' 
                                : isDarkMode ? 'bg-slate-950 border-slate-800 text-teal-400' : 'bg-slate-50 border-slate-200 text-teal-800'
                            }`}
                            placeholder="key_name"
                          />
                        </div>
                        <div className="flex-1.5 space-y-1">
                          <label className={`font-semibold tracking-wide uppercase text-[8px] font-mono block ${
                            isDarkMode ? 'text-slate-500' : 'text-slate-600'
                          }`}>VALUE</label>
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => setCustomFields(prev => ({ ...prev, [key]: e.target.value }))}
                            className={`w-full p-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-250' : 'bg-slate-50 border-slate-200 text-slate-850'
                            }`}
                            placeholder={key === 'amount' ? '$120.00' : key === 'date' ? 'June 30' : 'value'}
                          />
                        </div>
                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomFields(prev => {
                                const copy = { ...prev };
                                delete copy[key];
                                return copy;
                              });
                            }}
                            className="p-1.5 py-2 text-rose-500 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg cursor-pointer text-xs"
                            title="Remove variable"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  id="contact-save-btn"
                  type="submit"
                  className="flex-1 py-3 items-center rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all transform active:scale-95 cursor-pointer"
                >
                  {editId ? 'APPLY UPDATE' : 'SAVE CONTACT'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className={`px-4 py-3 rounded-xl border font-bold transition-colors cursor-pointer ${
                    isDarkMode ? 'border-slate-800 text-slate-300 hover:bg-slate-950' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  RESET
                </button>
              </div>

            </form>
          </div>
        )}

        {/* LIST REGISTER GRAPHIC AREA */}
        <div className={`lg:col-span-2 space-y-3.5 max-h-[70vh] overflow-y-auto pr-1.5 scrollbar-thin ${
          isAdding ? 'lg:col-span-2' : 'lg:col-span-3'
        }`}>
          {/* Bulk Action Controls */}
          {filteredContacts.length > 0 && (
            <div className={`flex flex-wrap items-center justify-between p-3.5 px-4 rounded-2xl text-xs font-sans border gap-3 ${
              isDarkMode 
                ? 'bg-slate-950/60 border-slate-800/80 text-slate-300' 
                : 'bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
            }`}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 shrink-0 group/chk cursor-pointer ${
                    filteredContacts.length > 0 && filteredContacts.every(c => selectedIds.includes(c.id))
                      ? 'bg-gradient-to-br from-teal-400 to-emerald-500 border-teal-500 text-slate-950 shadow-md scale-105'
                      : isDarkMode 
                        ? 'bg-slate-950/85 border-slate-700 hover:border-teal-400 text-transparent' 
                        : 'bg-white border-slate-300 hover:border-teal-500 text-transparent'
                  }`}
                  title="Select all filtered contacts"
                >
                  <Check className={`w-3.5 h-3.5 stroke-[3.5] transition-transform duration-200 ${
                    filteredContacts.length > 0 && filteredContacts.every(c => selectedIds.includes(c.id)) ? 'scale-100 rotate-0' : 'scale-0 -rotate-12'
                  }`} />
                </button>
                <span className={`font-mono text-[11px] font-bold tracking-wider ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {selectedIds.length === 0 
                    ? `SELECT ALL FILTERED (${filteredContacts.length})` 
                    : `SELECTED: ${selectedIds.length} / ${filteredContacts.length}`
                  }
                </span>
              </div>

              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  {!showBatchConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowBatchConfirm(true)}
                      className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-[10px] font-mono tracking-widest uppercase font-black transition-all cursor-pointer"
                    >
                      DELETE SELECTED ({selectedIds.length})
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-rose-950/40 p-1 px-2 border border-rose-500/40 rounded-xl animate-pulse">
                      <span className="text-[10px] font-mono font-bold text-rose-300">CONFIRM DESTROY?</span>
                      <button
                        type="button"
                        onClick={async () => {
                          await onDeleteContacts(selectedIds);
                          setSelectedIds([]);
                          setShowBatchConfirm(false);
                          setAlertMsg({ type: 'success', text: `Successfully deleted batch of contacts!` });
                          setTimeout(() => setAlertMsg(null), 4000);
                        }}
                        className="px-2 py-1 bg-rose-500 text-slate-950 rounded font-bold text-[9px] font-mono hover:bg-rose-400 cursor-pointer"
                      >
                        YES
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBatchConfirm(false)}
                        className="px-2 py-1 bg-slate-800 text-slate-300 rounded font-bold text-[9px] font-mono hover:bg-slate-700 cursor-pointer"
                      >
                        NO
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {filteredContacts.length === 0 ? (
            <div className={`text-center py-16 rounded-2xl border ${
              isDarkMode ? 'bg-slate-900/20 border-slate-800/80' : 'bg-slate-50/50 border-slate-200'
            }`}>
              <Users className="w-12 h-12 text-slate-500 mx-auto opacity-60 animate-bounce-slow" />
              <h4 className={`text-xs font-bold mt-4 uppercase ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>NO CLIENT TELEMETRY FOUND</h4>
              <p className={`text-xs font-sans mt-1 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>No contacts match the current query filter settings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredContacts.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                  className={`p-5 rounded-2xl border flex flex-col justify-between group cursor-default relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                    isDarkMode 
                      ? 'bg-slate-900/40 border-slate-800/80 hover:border-teal-500/50 hover:bg-slate-900/60 hover:shadow-[0_12px_24px_-10px_rgba(20,184,166,0.15)] shadow-xs text-slate-300' 
                      : 'bg-white border-slate-200 hover:border-teal-500/50 hover:bg-slate-50/30 hover:shadow-[0_12px_24px_-10px_rgba(20,184,166,0.12)] shadow-xs text-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Selector checkbox */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(c.id);
                          }}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 shrink-0 mt-0.5 cursor-pointer ${
                            selectedIds.includes(c.id)
                              ? 'bg-gradient-to-br from-teal-400 to-emerald-500 border-teal-500 text-slate-950 shadow-md scale-105'
                              : isDarkMode 
                                ? 'bg-slate-950/80 border-slate-700 hover:border-teal-400 text-transparent' 
                                : 'bg-slate-50 border-slate-300 hover:border-teal-500 text-transparent'
                          }`}
                        >
                          <Check className={`w-3.5 h-3.5 stroke-[3.5] transition-transform duration-200 ${
                            selectedIds.includes(c.id) ? 'scale-100 rotate-0' : 'scale-0 -rotate-12'
                          }`} />
                        </button>
                        <div className="space-y-0.5 min-w-0">
                          <h4 className={`text-xs font-bold font-sans uppercase tracking-wide truncate ${
                            isDarkMode ? 'text-slate-100' : 'text-slate-800'
                          }`}>
                            {c.name}
                          </h4>
                          <p className={`text-[11px] font-mono font-medium ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>{c.phone}</p>
                        </div>
                      </div>
                      
                      {/* Delete / Edit Button icons */}
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(c)}
                          className="p-1 px-2 rounded-lg bg-teal-950/30 text-teal-450 border border-teal-500/10 hover:bg-teal-900/40 text-[10px] uppercase font-mono tracking-wider font-semibold cursor-pointer"
                          title="Edit"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => onDeleteContact(c.id)}
                          className="p-1.5 rounded-lg bg-rose-955/10 text-rose-455 border border-rose-500/10 hover:bg-rose-950/40 cursor-pointer"
                          title="Delete contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Tag list map label */}
                    <div className="flex flex-wrap gap-1">
                      {c.tags?.map((tag) => (
                        <span 
                          key={tag} 
                          className={`px-2 py-0.5 rounded text-[9px] font-mono tracking-wider font-semibold uppercase flex items-center gap-1 border transition-all duration-300 ease-out ${
                            (tag || '').toLowerCase() === 'vip' 
                              ? 'bg-gradient-to-r from-amber-100 to-yellow-101 text-amber-800 border-amber-200 dark:from-amber-400/15 dark:to-yellow-500/15 dark:text-amber-305 dark:border-amber-500/35 dark:shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                              : (tag || '').toLowerCase() === 'overdue'
                                ? 'bg-rose-100 text-rose-800 border-rose-200 dark:from-rose-500/15 dark:to-pink-500/15 dark:bg-rose-500/15 dark:text-rose-305 dark:border-rose-500/35 dark:shadow-[0_0_8px_rgba(244,63,94,0.15)]'
                                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700/60 dark:text-slate-300'
                          }`}
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                      {(!c.tags || c.tags.length === 0) && (
                        <span className="text-[9px] font-mono text-slate-500 italic pr-2">[No tags added]</span>
                      )}
                    </div>
                  </div>

                  {/* Variables listing block in footer card */}
                  {c.customFields && Object.keys(c.customFields).length > 0 && (
                    <div className={`mt-4 pt-3.5 border-t text-[9px] font-mono flex flex-wrap gap-x-4 gap-y-1.5 ${
                      isDarkMode ? 'border-slate-800/40 text-slate-400' : 'border-slate-200/80 text-slate-600'
                    }`}>
                      {Object.entries(c.customFields).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-1">
                          <span className="uppercase text-slate-500 font-bold">{key}:</span>
                          <span className="text-teal-600 dark:text-teal-400 max-w-[120px] truncate" title={val}>
                            {val || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
