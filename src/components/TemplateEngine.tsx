/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Mic, 
  MicOff, 
  Play, 
  RefreshCw, 
  HelpCircle, 
  CheckCircle, 
  Cpu, 
  Volume2,
  FileAudio,
  Eye
} from 'lucide-react';
import { MessageTemplate, Contact } from '../types.js';

interface TemplateEngineProps {
  templates: MessageTemplate[];
  contacts: Contact[];
  onSaveTemplate: (template: Omit<MessageTemplate, 'id' | 'createdAt'> & { id?: string }) => void;
  onDeleteTemplate: (id: string) => void;
  isDarkMode: boolean;
  onOptimizeTemplate: (text: string, objective: string) => Promise<string>;
  onTranscribeAudio: (audioBase64: string, mimeType: string) => Promise<string>;
}

export default function TemplateEngine({
  templates,
  contacts,
  onSaveTemplate,
  onDeleteTemplate,
  isDarkMode,
  onOptimizeTemplate,
  onTranscribeAudio
}: TemplateEngineProps) {

  // Selected for preview
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || '');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  // Gemini state handling managers
  const [aiObjective, setAiObjective] = useState('concise billing reminder');
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Audio Speech Transcription
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [dragOverAudio, setDragOverAudio] = useState(false);

  // Preview selection values
  const [previewContactId, setPreviewContactId] = useState(contacts[0]?.id || '');
  
  // Custom metadata variables list
  const [engineCustomVariables, setEngineCustomVariables] = useState<{key: string, value: string}[]>([
    { key: 'company', value: 'Quantum Gateway Inc.' },
    { key: 'invoice_no', value: 'QW-7809-A' },
    { key: 'due_date', value: 'June 30th' }
  ]);
  
  // Custom preview interactive modal states
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [modalTemplateId, setModalTemplateId] = useState<string>('');
  const [modalContactId, setModalContactId] = useState<string>('');

  // Reusable interpolation engine
  const interpolateText = (textStr: string, activeContact: Contact | undefined) => {
    let outText = textStr || '';
    if (activeContact) {
      outText = outText.replace(/{name}/gi, activeContact.name);
      outText = outText.replace(/{phone}/gi, activeContact.phone);
      if (activeContact.customFields) {
        for (const [key, value] of Object.entries(activeContact.customFields)) {
          const regex = new RegExp(`{${key}}`, 'gi');
          outText = outText.replace(regex, value || '');
        }
      }
    }
    
    // Interpolate custom metadata variables
    if (engineCustomVariables && engineCustomVariables.length > 0) {
      for (const item of engineCustomVariables) {
        if (item.key.trim()) {
          const cleanKey = item.key.trim().toLowerCase();
          const regex = new RegExp(`{${cleanKey}}`, 'gi');
          outText = outText.replace(regex, item.value || '');
        }
      }
    }

    // Clean left-over curly brackets tags dynamically
    outText = outText.replace(/{[a-zA-Z0-9_]+}/g, 'N/A');
    return outText;
  };

  // Alert banner states
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Programmatic save trigger for Ctrl+S hotkey
  useEffect(() => {
    const handleSaveSignal = () => {
      const submitBtn = document.getElementById('template-save-btn') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.click();
      }
    };
    window.addEventListener('cyber-sms-save', handleSaveSignal);
    return () => window.removeEventListener('cyber-sms-save', handleSaveSignal);
  }, []);
  
  // Audio state refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Select first template default on mount
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  // Read active template configurations
  const currentTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  // Reset active fields helper
  const resetForm = () => {
    setEditId(null);
    setName('');
    setText('');
  };

  // Helper sets fields for update
  const handleEditInit = (t: MessageTemplate) => {
    setEditId(t.id);
    setName(t.name);
    setText(t.text);
    setAlert({ type: 'success', text: `Loaded template "${t.name}" into builder terminal.` });
    setTimeout(() => setAlert(null), 3000);
  };

  // Submit standard template formulation
  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !text) {
      setAlert({ type: 'error', text: 'Name and text columns cannot be empty.' });
      return;
    }

    onSaveTemplate({
      id: editId || undefined,
      name,
      text
    });

    setAlert({ type: 'success', text: editId ? 'Template configuration updated!' : 'New template registered!' });
    setName('');
    setText('');
    setEditId(null);
    setTimeout(() => setAlert(null), 4500);
  };

  // Live variable preview personalization renderer
  const renderPreviewMessage = () => {
    const draftText = editId ? text : (currentTemplate ? currentTemplate.text : text || 'Hello {name}, your status is ready.');
    const activeContact = contacts.find(c => c.id === previewContactId) || contacts[0];
    return interpolateText(draftText, activeContact);
  };

  // Gemini optimization trigger
  const triggerAiOptimization = async () => {
    const draftText = editId ? text : (currentTemplate ? currentTemplate.text : text);
    if (!draftText) {
      setAlert({ type: 'error', text: 'Please write or select a message to optimize.' });
      return;
    }

    setIsOptimizing(true);
    try {
      const optimized = await onOptimizeTemplate(draftText, aiObjective);
      // Insert back into active text input terminal
      setText(optimized);
      setEditId(editId || 'temp_opt_' + Math.random().toString(36).substr(2, 4)); // Force open in editor
      if (!name) setName('AI Generated Optimize');
      setAlert({ type: 'success', text: 'AI Optimization finished! Copied message into input terminal.' });
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message || 'Gemini Optimization Module Offline.' });
    } finally {
      setIsOptimizing(false);
      setTimeout(() => setAlert(null), 4000);
    }
  };

  // Start Audio Microphone Recording
  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert Blob to Base64
        const fileReader = new FileReader();
        fileReader.readAsDataURL(audioBlob);
        fileReader.onloadend = async () => {
          const base64Str = fileReader.result as string;
          await processBase64AudioTranscribe(base64Str, 'audio/webm');
        };
        
        // Shut off mic streams
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Duration interval timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      setAlert({ type: 'error', text: 'Could not access microphone feed. Drop an audio file instead!' });
      setTimeout(() => setAlert(null), 4000);
    }
  };

  // Stop Audio Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // Core callback dispatcher to process audio
  const processBase64AudioTranscribe = async (base64Data: string, mime: string) => {
    setIsTranscribing(true);
    setAlert({ type: 'success', text: 'Analyzing speech telemetry using Gemini...' });
    
    try {
      const result = await onTranscribeAudio(base64Data, mime);
      
      if (result) {
        setTranscribedText(result);
        // Copy directly to active drafting text input field
        setText(prev => (prev ? prev + ' ' : '') + result);
        setEditId(editId || 'transient_edit');
        if (!name) setName('Transcribed Voice Note');
        setAlert({ type: 'success', text: 'Vocal note transcribed with Gemini!' });
      } else {
        setAlert({ type: 'error', text: 'Gemini transcribed empty word values.' });
      }
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message || 'Speech Module failure.' });
    } finally {
      setIsTranscribing(false);
      setTimeout(() => setAlert(null), 5000);
    }
  };

  // File drop file drag file picker callbacks helper
  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverAudio(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setAlert({ type: 'error', text: 'Only audio recordings (.mp3, .wav, .webm) are supported.' });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      await processBase64AudioTranscribe(base64, file.type);
    };
  };

  return (
    <div className="space-y-6">

      {/* Main interactive template grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* TEMPLATE LIST VIEW */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className={`text-xs font-bold font-sans tracking-widest uppercase ${
              isDarkMode ? 'text-slate-300' : 'text-slate-750'
            }`}>
              REGISTERED TEMPLATES
            </h3>
            <span className={`text-[10px] font-mono font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>{templates.length} UNITS</span>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {templates.map((t) => {
              const isSelected = selectedTemplateId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between hover:scale-min-active select-none group relative ${
                    isSelected 
                      ? isDarkMode 
                        ? 'bg-slate-900 border-teal-500/70 shadow-sm shadow-teal-500/10 text-slate-105' 
                        : 'bg-teal-50 border-teal-300 text-teal-950'
                      : isDarkMode 
                        ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700' 
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className={`text-xs font-extrabold pr-2 uppercase tracking-wide font-sans group-hover:text-teal-550 dark:group-hover:text-teal-400 transition-colors ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      }`}>
                        {t.name}
                      </h4>
                      
                      {/* Edit actions */}
                      <div className="flex items-center gap-1.5 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalTemplateId(t.id);
                            if (contacts.length > 0) {
                              setModalContactId(contacts[0].id);
                            } else {
                              setModalContactId('');
                            }
                            setPreviewModalOpen(true);
                          }}
                          className="p-1 px-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded font-mono text-[9px] border border-indigo-505/20 cursor-pointer"
                          title="Preview with Contacts"
                        >
                          PREVIEW
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditInit(t);
                          }}
                          className="p-1 text-teal-400 hover:text-teal-300 hover:bg-slate-800 rounded font-mono text-[9px]"
                          title="Modify"
                        >
                          BUILD
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTemplate(t.id);
                          }}
                          className="p-1 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded"
                          title="Delete Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-3 font-sans pr-2">
                      {t.text}
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 mt-2.5">
                    <span>ID: {t.id}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
            
            {templates.length === 0 && (
              <div className="text-center py-10 border border-slate-800 rounded-xl bg-slate-900/10">
                <p className="text-xs font-mono text-slate-500">[NO MESSAGE CUSTOMS INSTALLED]</p>
              </div>
            )}
          </div>
        </div>

        {/* TEMPLATE EDITOR & DRAFTER CONSOLE */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Drafting Form Terminal Card */}
          <div className={`p-6 rounded-2xl border ${
            isDarkMode ? 'bg-slate-900/60 border-slate-850' : 'bg-white border-slate-250 shadow-md'
          }`}>
            <div className="flex justify-between items-center mb-5 border-b border-inherit pb-4">
              <h3 className={`text-xs font-bold font-sans tracking-widest uppercase ${
                isDarkMode ? 'text-slate-200' : 'text-slate-800'
              }`}>
                {editId ? `BUILDER TERMINAL: ${editId.startsWith('temp_opt_') ? 'AI SUGGESTION' : 'MODIFY MODULE'}` : 'TEMPLATE CREATOR CONSOLE'}
              </h3>
              {editId && (
                <button
                  type="button"
                  onClick={() => resetForm()}
                  className="text-[10px] font-mono font-bold text-rose-500 dark:text-rose-400 border border-rose-500/20 bg-rose-500/5 px-2 py-1 rounded-lg cursor-pointer hover:bg-rose-500/10"
                >
                  ABORT DESIGN
                </button>
              )}
            </div>

            {/* Alarm notifications */}
            {alert && (
              <div className={`p-3.5 rounded-xl text-xs flex items-center gap-3 font-sans mb-4 border ${
                alert.type === 'success' ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
              }`}>
                <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                <span>{alert.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5Col">
                  <span className={`font-bold font-mono tracking-wider block mb-1 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-700'
                  }`}>TEMPLATE CODENAME</span>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Overdue Alert Final"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                
                {/* Variable Selector helper pills */}
                <div>
                  <span className={`font-bold font-mono tracking-wider block mb-1 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-700 font-extrabold'
                  }`}>INSERT CYBER VARIABLES</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { key: '{name}', desc: 'Full Name' },
                      { key: '{phone}', desc: 'Phone' },
                      { key: '{amount}', desc: 'Pending due' },
                      { key: '{date}', desc: 'Payment limit' },
                      ...engineCustomVariables.filter(v => v.key.trim().length > 0).map(v => ({
                        key: `{${v.key.trim().toLowerCase()}}`,
                        desc: `Custom metadata field: ${v.value}`
                      }))
                    ].map(pill => (
                      <button
                        type="button"
                        key={pill.key}
                        onClick={() => setText(prev => prev + pill.key)}
                        className={`px-2 py-1.5 rounded-lg border font-mono text-[9px] font-semibold active:scale-95 transition-all cursor-pointer ${
                          isDarkMode 
                            ? 'bg-slate-955 border-slate-800 text-teal-400 hover:border-slate-700' 
                            : 'bg-white border-slate-300 text-teal-800 font-extrabold hover:bg-slate-100'
                        }`}
                        title={pill.desc}
                      >
                        {pill.key}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Message main drafting terminal */}
              <div className="space-y-1.5 relative">
                <span className={`font-bold font-mono tracking-wider block ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-700'
                }`}>MESSAGE BODY</span>
                <div className="relative">
                  <textarea
                    placeholder="Draft your payload here. Variables entered inside curly braces like {name} will be interpolated dynamically during campaign shipment passes."
                    rows={4}
                    required
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 font-sans leading-relaxed text-xs ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-205 text-slate-805'
                    }`}
                  />
                  {(isOptimizing || isTranscribing) && (
                    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center text-center space-y-3.5 p-4 border border-teal-500/20">
                      <div className="flex gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse [animation-delay:0.2s]"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse [animation-delay:0.4s]"></span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-mono font-black tracking-widest text-teal-400 uppercase">
                          {isOptimizing ? '⚡ GEMINI HYPER-SYNTHESIS PROCESSING' : '🎙️ ANALYZING SPECTRAL CODES'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-sans">
                          {isOptimizing ? 'Fusing perfect cognitive parameters...' : 'Synthesizing voice pattern models...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Character counts */}
                <span className="absolute right-3.5 bottom-3.5 text-[9px] font-mono text-slate-500 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800/40">
                  {text.length} / 160 CHARS (SMS limits)
                </span>
              </div>

              {/* Speech Microphone Transcription & Audio drop hub */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOverAudio(true); }}
                onDragLeave={() => setDragOverAudio(false)}
                onDrop={handleAudioDrop}
                className={`p-4 border border-dashed rounded-xl transition-all flex flex-col md:flex-row items-center justify-between gap-4 ${
                  dragOverAudio 
                    ? 'border-teal-400 bg-teal-950/20' 
                    : isDarkMode 
                      ? 'border-slate-800 bg-slate-950/35' 
                      : 'border-slate-300 bg-slate-50/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${
                    isRecording ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20 animate-pulse' : 'bg-slate-850 text-slate-400'
                  }`}>
                    {isRecording ? <Volume2 className="w-5 h-5" /> : <FileAudio className="w-5 h-5 text-teal-500 dark:text-teal-400" />}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>VOICE SPEECH TRANSCRIPTION DIALOG</h4>
                    <p className={`text-[10px] font-sans mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {isRecording 
                        ? `Recording feed active: ${recordingDuration} seconds...` 
                        : isTranscribing 
                          ? 'Gemini transcription algorithm parsing...' 
                          : 'Dictate message draft directly. Drop any mic audio file here!'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-sans">
                  {isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 text-[10px] font-bold tracking-widest uppercase rounded-lg active:scale-95 transition-all cursor-pointer"
                    >
                      STOP PROCESS
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isTranscribing}
                      onClick={startRecording}
                      className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold tracking-widest uppercase rounded-lg active:scale-95 transition-all cursor-pointer ${
                        isDarkMode ? 'bg-slate-800 text-teal-400 border border-slate-705 hover:bg-slate-755' : 'bg-white text-teal-850 border border-slate-300 hover:bg-slate-100 shadow-xs'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5 text-teal-555" />
                      RECORD AUDIO
                    </button>
                  )}
                </div>
              </div>

              {/* Gemini Template Optimization module controls */}
              <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center gap-4 ${
                isDarkMode ? 'bg-slate-950/35 border-slate-805' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 shrink-0">
                  <Sparkles className="w-4 h-4 text-pink-500 dark:text-pink-400 animate-pulse" />
                  <span className={`font-bold font-mono tracking-wider uppercase ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-800'
                  }`}>AI TEXT HELPER</span>
                </div>
                
                {/* AI prompt objective options */}
                <input
                  type="text"
                  placeholder="Objective e.g. payment reminders / marketing coupons"
                  value={aiObjective}
                  onChange={(e) => setAiObjective(e.target.value)}
                  className={`flex-1 p-2 py-1.5 rounded-lg border text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-500 font-sans min-w-[120px] ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-850'
                  }`}
                />

                <button
                  type="button"
                  disabled={isOptimizing}
                  onClick={triggerAiOptimization}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-indigo-500 text-slate-50 font-black text-[10px] uppercase tracking-widest rounded-lg flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shrink-0"
                >
                  {isOptimizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
                  {isOptimizing ? 'PARSING...' : 'OPTIMISE WITH GEMINI'}
                </button>
              </div>

              {/* Form Operations */}
              <div className="pt-2">
                <button
                  id="template-save-btn"
                  type="submit"
                  className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black tracking-widest uppercase rounded-xl transition-all font-sans text-xs active:scale-95 shadow-sm"
                >
                  {editId ? 'COMMIT TEMPLATE MODIFICATION' : 'SAVE NEW MESSAGE TEMPLATE'}
                </button>
              </div>

            </form>
          </div>

          {/* REALTIME VARIABLE INTERPOLATION LIVE PREVIEW CARD */}
          <div className={`p-6 rounded-2xl border ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                <h3 className={`text-xs font-bold font-sans tracking-widest uppercase ${
                  isDarkMode ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  SIMULATED DISPATCH PREVIEW
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setModalTemplateId(selectedTemplateId || 'draft');
                  if (contacts.length > 0) {
                     setModalContactId(contacts[0].id);
                  } else {
                     setModalContactId('');
                  }
                  setPreviewModalOpen(true);
                }}
                className={`px-2.5 py-1 text-[10px] uppercase tracking-widest font-mono font-bold rounded-lg border transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0 ${
                  isDarkMode
                    ? 'border-teal-500/35 text-teal-305 bg-teal-500/5 hover:bg-teal-550 hover:text-slate-955'
                    : 'border-teal-305 text-teal-700 bg-teal-50 hover:bg-teal-500 hover:text-white'
                }`}
              >
                <span>🔍 Open Full Preview Modal</span>
              </button>
              
              {/* Selector to preview different contacts */}
              <div className="flex items-center gap-2 font-sans text-xs">
                <span className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Preview with Test Case:</span>
                <select
                  value={previewContactId}
                  onChange={(e) => setPreviewContactId(e.target.value)}
                  className={`p-1.5 py-1 rounded text-[11px] focus:outline-none font-bold border ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-805 text-slate-300' 
                      : 'bg-white border-slate-305 text-slate-800'
                  }`}
                >
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  {contacts.length === 0 && (
                    <option value="">No contacts uploaded</option>
                  )}
                </select>
              </div>
            </div>

            {/* Simulated Smartphone container */}
            <div className="relative mx-auto max-w-sm rounded-[32px] border-4 border-slate-800 bg-slate-950 p-4 shadow-xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-800 rounded-b-xl"></div>
              
              <div className="mt-4 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden font-sans">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-teal-400 border border-slate-700">
                    G
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black text-slate-200">ANDROID SMS GATEWAY</h5>
                    <p className="text-[8px] text-slate-500 font-mono">Routing Active: s.sms/gateway</p>
                  </div>
                </div>

                {/* Simulated sms text box */}
                <div className="p-3 bg-teal-950/25 border border-teal-900/40 rounded-xl relative">
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans select-all whitespace-pre-wrap">
                    {renderPreviewMessage() || 'Select or draft template body above to simulate delivery interpolations.'}
                  </p>
                  <span className="absolute bottom-1 right-2 text-[7px] font-mono text-slate-500 uppercase">
                    Delivered
                  </span>
                </div>
              </div>

              <div className="text-center mt-3 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                Smartphone Previsualization
              </div>
            </div>

          </div>

          {/* CUSTOM MERGE PLACEHOLDERS DECK */}
          <div className={`p-6 rounded-2xl border ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800/80 shadow-md' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between gap-4 mb-4 border-b border-inherit pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                <h3 className={`text-xs font-bold font-sans tracking-widest uppercase ${
                  isDarkMode ? 'text-slate-200' : 'text-slate-900 font-extrabold'
                }`}>
                  CUSTOM METADATA INJECTIONS
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEngineCustomVariables([...engineCustomVariables, { key: '', value: '' }])}
                className="px-2 py-1 text-[9px] font-mono font-bold uppercase text-teal-555 dark:text-teal-400 border border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/10 rounded transition-all cursor-pointer flex items-center gap-0.5"
              >
                + Add Key-Value
              </button>
            </div>

            <p className={`text-[10px] font-sans mb-3 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
              Input dynamic keys (e.g. <code className="font-mono text-teal-605 dark:text-teal-400">{`company`}</code> or <code className="font-mono text-teal-605 dark:text-teal-400">{`due_date`}</code>) and merge them into your blueprint matches as <code className="font-mono font-bold">{`{company}`}</code> or <code className="font-mono font-bold">{`{due_date}`}</code>.
            </p>

            {engineCustomVariables.length === 0 ? (
              <div className={`text-center py-5 font-mono text-[10px] border border-dashed rounded-xl ${
                isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-600'
              }`}>
                [NO CUSTOM PLACEHOLDERS ACTIVE]
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {engineCustomVariables.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className={`font-mono text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-600 font-bold'}`}>{`{`}</span>
                    <input
                      type="text"
                      placeholder="key (e.g. status)"
                      value={v.key}
                      onChange={(e) => {
                        const next = [...engineCustomVariables];
                        next[idx].key = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                        setEngineCustomVariables(next);
                      }}
                      className={`flex-1 p-1.5 focus:ring-0 rounded border font-mono text-[11px] text-center ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-teal-450' : 'bg-white border-slate-300 text-teal-800 font-extrabold'
                      }`}
                    />
                    <span className={`font-mono text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-600 font-bold'}`}>{`}`}</span>
                    
                    <span className={`font-mono text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-600 font-bold'}`}>=</span>

                    <input
                      type="text"
                      placeholder="Value"
                      value={v.value}
                      onChange={(e) => {
                        const next = [...engineCustomVariables];
                        next[idx].value = e.target.value;
                        setEngineCustomVariables(next);
                      }}
                      className={`flex-[1.5] p-1.5 focus:ring-0 rounded border font-sans text-[11px] ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-black font-semibold'
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const next = engineCustomVariables.filter((_, i) => i !== idx);
                        setEngineCustomVariables(next);
                      }}
                      className="p-1.5 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer transition-colors"
                      title="Deallocate variable"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* DYNAMIC PLACEHOLDER PREVIEW AUDIT MODAL */}
      {previewModalOpen && (() => {
        const pTemplate = templates.find(t => t.id === modalTemplateId);
        const rawTxt = modalTemplateId === 'draft' ? text : (pTemplate ? pTemplate.text : '');
        const templateName = modalTemplateId === 'draft' ? 'UNCOMMITTED ACTIVE DRAFTER' : (pTemplate ? pTemplate.name : 'N/A');
        const activeContact = contacts.find(c => c.id === modalContactId) || contacts[0];
        const interpolated = interpolateText(rawTxt, activeContact);
        const contactIndex = contacts.findIndex(c => c.id === modalContactId);

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className={`w-full max-w-4xl rounded-2xl border ${
              isDarkMode ? 'bg-slate-900 border-teal-500/30 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'
            } p-6 relative flex flex-col max-h-[90vh]`}>
              
              <button
                onClick={() => setPreviewModalOpen(false)}
                className={`absolute top-4 right-4 font-mono text-xs cursor-pointer p-1 rounded-md transition-all ${
                  isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-slate-600 hover:text-black hover:bg-slate-100'
                }`}
              >
                ✕ CLOSE
              </button>

              <div className="flex items-center gap-3 border-b border-inherit pb-4 mb-4 shrink-0">
                <div className="bg-teal-950 p-2 rounded border border-teal-500/40 text-teal-400">
                  <Eye className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold tracking-widest uppercase ${
                    isDarkMode ? 'text-slate-100' : 'text-slate-900 font-extrabold'
                  }`}>
                    PLACEHOLDER INTERPOLATION AUDIT
                  </h3>
                  <p className={`text-[10px] font-mono mt-0.5 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'
                  }`}>
                    Visually verify custom merge tags prior to real campaign shipment
                  </p>
                </div>
              </div>

              {/* Selection row */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 shrink-0 p-3 rounded-xl border text-xs ${
                isDarkMode ? 'bg-slate-955/40 border-slate-800/60' : 'bg-slate-50 border-slate-205'
              }`}>
                <div>
                  <span className={`text-[10px] font-mono block mb-1 uppercase font-bold ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-900 font-black'
                  }`}>1. Active Template Source</span>
                  <select
                    value={modalTemplateId}
                    onChange={(e) => setModalTemplateId(e.target.value)}
                    className={`w-full p-2 rounded font-bold focus:outline-none ${
                        isDarkMode ? 'bg-slate-900 border border-slate-800 text-slate-200' : 'bg-white border border-slate-300 text-black font-extrabold'
                    }`}
                  >
                    <option value="draft">Current Draft Field: ({text ? `${text.substring(0,25)}...` : 'Empty input'})</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} (Saved)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className={`text-[10px] font-mono block mb-1 uppercase font-bold ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-900 font-black'
                  }`}>2. Selected Test Contact</span>
                  <div className="flex gap-2">
                    <select
                      value={modalContactId}
                      onChange={(e) => setModalContactId(e.target.value)}
                      className={`flex-1 p-2 rounded font-bold focus:outline-none ${
                        isDarkMode ? 'bg-slate-900 border border-slate-800 text-slate-200' : 'bg-white border border-slate-300 text-black font-extrabold'
                      }`}
                    >
                      {contacts.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                      ))}
                      {contacts.length === 0 && (
                        <option value="">No contacts available</option>
                      )}
                    </select>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (contactIndex > 0) {
                            setModalContactId(contacts[contactIndex - 1].id);
                          }
                        }}
                        disabled={contactIndex <= 0}
                        className={`px-2.5 rounded disabled:opacity-40 disabled:cursor-not-allowed font-bold ${
                          isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-black'
                        }`}
                        title="Previous Contact"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (contactIndex >= 0 && contactIndex < contacts.length - 1) {
                            setModalContactId(contacts[contactIndex + 1].id);
                          }
                        }}
                        disabled={contactIndex >= contacts.length - 1 || contacts.length === 0}
                        className={`px-2.5 rounded disabled:opacity-40 disabled:cursor-not-allowed font-bold ${
                          isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-black'
                        }`}
                        title="Next Contact"
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side by side split preview */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-1 text-xs">
                
                {/* Raw Blue Print */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1 font-mono text-[10px] font-bold text-slate-450 uppercase">
                    <span>Template Blueprint Markup</span>
                    <span className="text-teal-400 font-extrabold">RAW PAYLOAD</span>
                  </div>
                  
                  <div className={`p-4 rounded-xl border font-mono min-h-[140px] whitespace-pre-wrap leading-relaxed select-all ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-350' : 'bg-slate-50 border-slate-200 text-black font-semibold'
                  }`}>
                    {rawTxt || <span className="text-slate-450 font-sans">[Write or choose message above to load blueprint]</span>}
                  </div>

                  {/* Variables Status Legend */}
                  <div className={`p-3 rounded-xl space-y-2 border ${
                    isDarkMode ? 'bg-slate-95 /20 border-slate-850' : 'bg-slate-100/70 border-slate-205'
                  }`}>
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-widest block ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-900 font-black'
                    }`}>Detected Merge Placeholders:</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className={`flex justify-between p-1.5 border rounded ${
                        isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-300 shadow-sm'
                      }`}>
                        <span className="text-teal-500 font-bold">{`{name}`}</span>
                        <span className={`truncate max-w-[80px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-black'}`}>{activeContact?.name || 'N/A'}</span>
                      </div>
                      <div className={`flex justify-between p-1.5 border rounded ${
                        isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-300 shadow-sm'
                      }`}>
                        <span className="text-teal-500 font-bold">{`{phone}`}</span>
                        <span className={`truncate max-w-[80px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-black'}`}>{activeContact?.phone || 'N/A'}</span>
                      </div>
                      <div className={`flex justify-between p-1.5 border rounded ${
                        isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-300 shadow-sm'
                      }`}>
                        <span className="text-teal-500 font-bold">{`{amount}`}</span>
                        <span className={`truncate max-w-[80px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-black'}`}>{activeContact?.customFields?.amount || 'N/A'}</span>
                      </div>
                      <div className={`flex justify-between p-1.5 border rounded ${
                        isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-300 shadow-sm'
                      }`}>
                        <span className="text-teal-500 font-bold">{`{date}`}</span>
                        <span className={`truncate max-w-[80px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-black'}`}>{activeContact?.customFields?.date || 'N/A'}</span>
                      </div>
                      {engineCustomVariables.filter(v => v.key.trim().length > 0).map((v, i) => (
                        <div key={i} className={`flex justify-between p-1.5 border rounded ${
                          isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-300 shadow-sm'
                        }`}>
                          <span className="text-teal-500 font-bold">{`{${v.key.trim().toLowerCase()}}`}</span>
                          <span className={`truncate max-w-[80px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-black'}`} title={v.value}>{v.value || 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Interpolated Render */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="flex justify-between items-center px-1 font-mono text-[10px] font-bold text-slate-450 uppercase">
                    <span>Simulated Target Layout</span>
                    <span className="text-emerald-400">DYNAMIC MERGED</span>
                  </div>

                  {/* Bezelless dynamic card device bubble */}
                  <div className="bg-slate-950 rounded-[28px] border-2 border-slate-800 p-4 relative flex-1 flex flex-col justify-between max-w-sm mx-auto w-full">
                    <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex-1 flex flex-col justify-between">
                      <div className="border-b border-slate-800 pb-2 mb-3 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-teal-400 font-mono text-[10px]">
                          C
                        </div>
                        <div>
                          <h6 className="text-[10px] font-bold text-slate-100 uppercase">{activeContact?.name || 'Test Recipient'}</h6>
                          <p className="text-[8px] font-mono text-slate-500">{activeContact?.phone || 'Unknown phone'}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-teal-950/30 border border-teal-900/40 rounded-xl relative flex-1">
                        <p className="text-[11px] text-slate-200 leading-relaxed font-sans select-all whitespace-pre-wrap">
                          {interpolated || 'Blueprint text will populate here.'}
                        </p>
                        <span className="absolute bottom-1 right-2 text-[7px] font-mono text-slate-500 uppercase">
                          Routing ready
                        </span>
                      </div>

                      <div className="mt-3 text-[8px] text-center font-mono text-slate-500 uppercase">
                        SMS CHANNEL INGRESS PIPELINE
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Close panel block */}
              <div className="pt-4 mt-4 border-t border-inherit shrink-0">
                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-sans text-xs font-black tracking-widest uppercase rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  DISMISS VISUAL AUDITOR TERMINAL
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
