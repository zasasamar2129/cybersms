/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Smartphone, 
  ShieldAlert, 
  Settings, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  User,
  Info,
  Server,
  Zap
} from 'lucide-react';
import { SmsSettings } from '../types.js';

interface SettingsPageProps {
  settings: SmsSettings;
  onUpdateSettings: (settings: SmsSettings) => void;
  isDarkMode: boolean;
  token?: string | null;
}

export default function SettingsPage({
  settings,
  onUpdateSettings,
  isDarkMode,
  token
}: SettingsPageProps) {

  // Local config states
  const [gatewayUrl, setGatewayUrl] = useState(settings.gatewayUrl || '');
  const [apiToken, setApiToken] = useState(settings.apiToken || '');
  const [defaultDelaySeconds, setDefaultDelaySeconds] = useState(settings.defaultDelaySeconds || 2);
  const [enableAnimations, setEnableAnimations] = useState(settings.enableAnimations !== false);
  const [dryRunMode, setDryRunMode] = useState(settings.dryRunMode !== false);
  const [successImageUrl, setSuccessImageUrl] = useState(settings.successImageUrl || '');
  const [failureImageUrl, setFailureImageUrl] = useState(settings.failureImageUrl || '');
  const [successImgPreview, setSuccessImgPreview] = useState(settings.successImageUrl || '');
  const [failureImgPreview, setFailureImgPreview] = useState(settings.failureImageUrl || '');
  
  // Save notification
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Programmatic save trigger for Ctrl+S hotkey
  useEffect(() => {
    const handleSaveSignal = () => {
      const submitBtn = document.getElementById('settings-save-btn') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.click();
      }
    };
    window.addEventListener('cyber-sms-save', handleSaveSignal);
    return () => window.removeEventListener('cyber-sms-save', handleSaveSignal);
  }, []);

  // Diagnostic states
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{
    success: boolean;
    statusCode?: number;
    statusText?: string;
    message: string;
    error?: string;
  } | null>(null);

  const handlePingTest = async () => {
    if (!gatewayUrl) {
      setPingResult({
        success: false,
        message: 'Local connection check aborted: Gateway HTTP API URL is required.'
      });
      return;
    }

    setPinging(true);
    setPingResult(null);

    try {
      const res = await fetch('/api/settings/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gatewayUrl: gatewayUrl.trim(),
          apiToken: apiToken.trim()
        })
      });

      const data = await res.json();
      setPingResult(data);
    } catch (err: any) {
      setPingResult({
        success: false,
        message: `Offline/local exception: ${err.message || 'The server did not respond.'}`
      });
    } finally {
      setPinging(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gatewayUrl) {
      setAlert({ type: 'error', text: 'Gateway HTTP API URL cannot be empty.' });
      return;
    }

    onUpdateSettings({
      gatewayUrl: gatewayUrl.trim(),
      apiToken: apiToken.trim(),
      defaultDelaySeconds: Number(defaultDelaySeconds) || 2,
      enableAnimations,
      dryRunMode,
      successImageUrl,
      failureImageUrl
    });

    setAlert({ type: 'success', text: 'Secure settings and API credentials written to backend!' });
    setTimeout(() => setAlert(null), 4000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header card info */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
            <Settings className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-xs font-bold font-sans tracking-widest text-slate-250 uppercase">
              CONSOLE CONFIGURATION MODULE
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">Adjust routing gates and system intervals</p>
          </div>
        </div>
      </div>

      {alert && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-3.5 border font-sans shadow-sm ${
          alert.type === 'success' ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
        }`}>
          <CheckCircle className="w-4.5 h-4.5 stroke-[2.5]" />
          <span>{alert.text}</span>
        </div>
      )}

      {/* Form settings container */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode ? 'bg-slate-900/60 border-slate-850' : 'bg-white border-slate-201 shadow-md'
      }`}>
        
        <form onSubmit={handleSave} className="space-y-6 text-xs font-sans">
          
          {/* ANDROID PHYSICAL PHONE CONFIGURATION SECTION */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-teal-400" />
              1. PHYSICAL ANDROID SMS GATEWAY ROUTE
            </h4>
            
            <div className="space-y-1.5">
              <span className="text-slate-450 font-bold font-mono tracking-wider block">HTTP GATEWAY ENDPOINT API URL</span>
              <input
                type="url"
                required
                placeholder="http://192.168.1.67:8082/"
                value={gatewayUrl}
                onChange={(e) => setGatewayUrl(e.target.value)}
                className={`w-full p-3.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono text-[11px] ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-202 text-slate-801'
                }`}
              />
              <p className="text-[9px] text-slate-500 font-mono">
                The local IP address configured by your physical Android SMS Gateway server app (must end with port e.g. /:8082 or similar, trailing slash optional).
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-450 font-bold font-mono tracking-wider block">SECURE API TOKEN KEY</span>
              <input
                type="password"
                placeholder="Ex: 19677b53-6c98-4929-9e60-ca788ada9036"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                className={`w-full p-3.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono text-[11px] ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-202'
                }`}
              />
              <p className="text-[9px] text-slate-500 font-mono">
                Stored as a backend environment header secret. Never leaked directly to user browsers or third party channels.
              </p>
            </div>
          </div>

          {/* INTERVAL CONTROL SLIDER */}
          <div className="border-t border-slate-800/60 pt-5 space-y-4">
            <h4 className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-400" />
              2. SENDER RATE INTERVAL SPACING
            </h4>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-400 font-mono tracking-wider mb-1">
                <span>DEFAULT PACING SPACE</span>
                <span className="text-teal-400 font-bold">{defaultDelaySeconds} SECONDS / MSG</span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                value={defaultDelaySeconds}
                onChange={(e) => setDefaultDelaySeconds(Number(e.target.value))}
                className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <p className="text-[9px] text-slate-500 font-mono">
                Rate limiting protection. Controls interval between successive push operations to prevent mobile operator warnings or blocking triggers.
              </p>
            </div>
          </div>

          {/* TELEMETRY SPECIAL CONFIG OPTIONS */}
          <div className="border-t border-slate-800/60 pt-5 space-y-4">
            <h4 className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
              <Server className="w-4 h-4 text-teal-400" />
              3. ADVANCED DISPATCH PARAMETERS
            </h4>

            {/* Dry Run Toggle Mode */}
            <div className={`flex items-center justify-between p-3.5 border rounded-xl transition-all duration-300 ${
              isDarkMode 
                ? 'bg-slate-950/40 border-slate-800/80 shadow-inner' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="space-y-0.5 max-w-[80%]">
                <span className={`font-bold font-sans tracking-wide block uppercase text-[10px] ${
                  isDarkMode ? 'text-slate-200' : 'text-slate-800'
                }`}>DRY RUN WORKFLOW SIMULATOR</span>
                <p className={`text-[9.5px] leading-relaxed ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Bypass real physical phone calls. Simulated sandbox completes delivery triggers locally inside 600ms latency, storing entries straight to logs, perfect for demonstration/evaluation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDryRunMode(!dryRunMode)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none cursor-pointer ${
                  dryRunMode 
                    ? 'bg-teal-500' 
                    : isDarkMode 
                      ? 'bg-slate-800' 
                      : 'bg-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full shadow-md transform duration-300 ${
                  dryRunMode 
                    ? 'translate-x-5 bg-slate-950' 
                    : 'translate-x-0 bg-white'
                }`} />
              </button>
            </div>

            {/* Enable Animations mode effects */}
            <div className={`flex items-center justify-between p-3.5 border rounded-xl transition-all duration-300 ${
              isDarkMode 
                ? 'bg-slate-950/40 border-slate-800/80 shadow-inner' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="space-y-0.5 max-w-[80%]">
                <span className={`font-bold font-sans tracking-wide block uppercase text-[10px] ${
                  isDarkMode ? 'text-slate-200' : 'text-slate-800'
                }`}>NEON NEURAL AMBIENT EFFECTS</span>
                <p className={`text-[9.5px] leading-relaxed ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Toggle matrix background animated gradient shaders and neon transition visual effects to improve performance on older machines.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEnableAnimations(!enableAnimations)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none cursor-pointer ${
                  enableAnimations 
                    ? 'bg-teal-500' 
                    : isDarkMode 
                      ? 'bg-slate-800' 
                      : 'bg-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full shadow-md transform duration-300 ${
                  enableAnimations 
                    ? 'translate-x-5 bg-slate-950' 
                    : 'translate-x-0 bg-white'
                }`} />
              </button>
            </div>

            {/* Custom Success and Failure Graphic Overlays */}
            <div className={`p-4 border rounded-xl space-y-4 ${
              isDarkMode ? 'bg-slate-950/20 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5 border-b pb-2 border-inherit">
                <span className={`font-mono font-bold tracking-widest text-[10px] block uppercase ${
                  isDarkMode ? 'text-teal-400' : 'text-slate-800 font-extrabold'
                }`}>
                  4. CAMPAIGN RESOLUTION POPUP GRAPHICS (PNG, GIF, JPEG, SVG)
                </span>
              </div>
              <p className={`text-[9.5px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Define custom assets (PNG, GIF, or standard formats) to be shown in the high-fidelity fullscreen popup when campaign jobs complete or fail. Leave empty to use beautiful default cyber vectors.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Success image */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-emerald-500 block">SUCCESS OVERLAY GRAPHIC</span>
                  <input
                    type="text"
                    placeholder="PNG/GIF URL or upload below"
                    value={successImageUrl}
                    onChange={(e) => {
                      setSuccessImageUrl(e.target.value);
                      setSuccessImgPreview(e.target.value);
                    }}
                    className={`w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono text-[10px] ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-305 text-black font-extrabold'
                    }`}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="success-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const r = new FileReader();
                          r.onloadend = () => {
                            if (typeof r.result === 'string') {
                              setSuccessImageUrl(r.result);
                              setSuccessImgPreview(r.result);
                            }
                          };
                          r.readAsDataURL(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="success-upload"
                      className="px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-605 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-mono uppercase font-bold cursor-pointer hover:bg-emerald-500/20 active:scale-95 transition-all inline-block"
                    >
                      📁 Upload file
                    </label>
                    {successImgPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setSuccessImageUrl('');
                          setSuccessImgPreview('');
                        }}
                        className="text-rose-500 hover:text-rose-400 text-[9px] font-mono font-bold"
                      >
                        [RESET]
                      </button>
                    )}
                  </div>
                  {successImgPreview && (
                    <div className="mt-2 w-14 h-14 rounded-lg overflow-hidden border border-emerald-500/30 bg-black/40 flex items-center justify-center p-1">
                      <img src={successImgPreview} alt="Success preview" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>

                {/* Failure image */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-rose-500 block">FAILURE OVERLAY GRAPHIC</span>
                  <input
                    type="text"
                    placeholder="PNG/GIF URL or upload below"
                    value={failureImageUrl}
                    onChange={(e) => {
                      setFailureImageUrl(e.target.value);
                      setFailureImgPreview(e.target.value);
                    }}
                    className={`w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono text-[10px] ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-305 text-black font-extrabold'
                    }`}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="failure-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const r = new FileReader();
                          r.onloadend = () => {
                            if (typeof r.result === 'string') {
                              setFailureImageUrl(r.result);
                              setFailureImgPreview(r.result);
                            }
                          };
                          r.readAsDataURL(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="failure-upload"
                      className="px-3 py-1.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-mono uppercase font-bold cursor-pointer hover:bg-rose-500/20 active:scale-95 transition-all inline-block"
                    >
                      📁 Upload file
                    </label>
                    {failureImgPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setFailureImageUrl('');
                          setFailureImgPreview('');
                        }}
                        className="text-rose-500 hover:text-rose-400 text-[9px] font-mono font-bold"
                      >
                        [RESET]
                      </button>
                    )}
                  </div>
                  {failureImgPreview && (
                    <div className="mt-2 w-14 h-14 rounded-lg overflow-hidden border border-rose-500/30 bg-black/40 flex items-center justify-center p-1">
                      <img src={failureImgPreview} alt="Failure preview" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Save configurations */}
          <div className="pt-2">
            <button
              id="settings-save-btn"
              type="submit"
              className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black tracking-widest uppercase rounded-xl transition-all duration-150 text-xs active:scale-95 shadow-sm"
            >
              COMMIT SECURE CONFIGURATIONS
            </button>
          </div>

        </form>
      </div>

      {/* REAL-TIME NETWORK DIAGNOSTIC PING MODULE */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode ? 'bg-slate-900/60 border-slate-850' : 'bg-white border-slate-201 shadow-md'
      }`}>
        <h4 className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1.5 mb-2.5">
          <Zap className="w-4 h-4 text-teal-400" />
          4. INSTANT NETWORK GATEWAY DIAGNOSTICS
        </h4>
        <div className="space-y-4">
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            Perform a real-time 'ping' test to evaluate gateway subnet communication, cellular hardware connectivity, and security credentials directly from this terminal.
          </p>

          <button
            type="button"
            disabled={pinging}
            onClick={handlePingTest}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl border text-xs font-bold font-sans tracking-wide transition-all active:scale-95 duration-150 ${
              pinging
                ? 'opacity-50 cursor-not-allowed border-slate-800 text-slate-400 animate-pulse'
                : 'bg-teal-950/20 hover:bg-teal-950/40 border-teal-800/60 text-teal-450 dark:text-teal-450'
            }`}
          >
            <Activity className={`w-4 h-4 ${pinging ? 'animate-spin' : ''}`} />
            {pinging ? 'PROBING NETWORK GATEWAY...' : 'TEST GATEWAY CONNECTION'}
          </button>

          {pingResult && (
            <div className={`p-4 rounded-xl border font-mono text-[11px] space-y-2.5 leading-relaxed ${
              pingResult.success 
                ? 'bg-emerald-950/15 border-emerald-955 text-emerald-300' 
                : 'bg-rose-950/15 border-rose-955 text-rose-350'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span className="uppercase text-[9px] tracking-wider text-slate-400">PROBE TYPE: HTTP CONTROL TRACE</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                  pingResult.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-450'
                }`}>
                  {pingResult.success ? 'GATEWAY REPLIED' : 'PROBE FAILURE'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-dashed border-current/20 pt-2.5 mt-1 text-[10px]">
                <div className="truncate">
                  <span className="text-current/60 uppercase">TARGET IP:</span> <span className="font-bold text-slate-200">{gatewayUrl}</span>
                </div>
                <div>
                  <span className="text-current/60 uppercase">STATUS CODE:</span>{' '}
                  <span className="font-bold text-slate-200">
                    {pingResult.statusCode ? `${pingResult.statusCode} ${pingResult.statusText || ''}` : 'N/A / OFFLINE'}
                  </span>
                </div>
              </div>

              <div className="mt-1 text-slate-300 font-sans text-xs">
                {pingResult.message}
              </div>

              {!pingResult.success && (
                <div className="text-[10px] text-rose-400/90 border-t border-rose-900/30 pt-2 font-sans italic leading-relaxed">
                  Tip: Ensure your Android Gateway is turned on, connected to the same Wi-Fi network, and that no firewall is blocking traffic on target port of your Android device.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cyber Security details alert box */}
      <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/80 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="text-[10px] font-mono font-bold tracking-widest text-slate-300 uppercase">REST API GATEWAY PROTOCOL DECLARED</h5>
          <p className="text-[9px] text-slate-505 font-sans leading-relaxed">
            Local credentials reside on server filesystem memory. Your Android physical SMS endpoint is never exposed to public internet clients. Rate limiter is hardcoded at max 60 messages per minute.
          </p>
        </div>
      </div>

    </div>
  );
}
