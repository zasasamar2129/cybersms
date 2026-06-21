/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import * as crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { dbInstance } from './src/db/datastore.js';
import { GoogleGenAI } from '@google/genai';
import { Campaign, SmsLog, Contact } from './src/types.js';

// Initialize server and environment
const app = express();
const PORT = 3000;

// Enable JSON bodies with higher limit for bulk operations and audio recording attachments
app.use(express.json({ limit: '50mb' }));

// Initialise Gemini client with telemetric User-Agent
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Secure Cryptographic session signature (Zero-dependency JWT substitute)
const JWT_SECRET = process.env.JWT_SECRET || 'CYBER_SECRET_JWT_PASSPHRASE_FALLBACK_2026';

function signSession(username: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ username, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 24 * 3600 })).toString('base64url');
  const hmac = crypto.createHmac('sha256', JWT_SECRET);
  hmac.update(`${header}.${payload}`);
  const signature = hmac.digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function verifySession(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    
    // Verify signature
    const hmac = crypto.createHmac('sha256', JWT_SECRET);
    hmac.update(`${header}.${payload}`);
    const expectedSignature = hmac.digest('base64url');
    if (signature !== expectedSignature) return null;
    
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return decodedPayload;
  } catch (e) {
    return null;
  }
}

// Auth Middleware
function authRequired(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Auth credentials missing or malformed' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const payload = verifySession(token);
  if (!payload) {
    res.status(401).json({ error: 'Token is invalid or expired' });
    return;
  }
  (req as any).user = payload;
  next();
}

// -------------------------------------------------------------
// SECURE REST API ENDPOINTS
// -------------------------------------------------------------

// Post authorization login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }
  
  const admins = dbInstance.getAdmins();
  const matched = admins.find(a => a.username.toLowerCase() === username.toLowerCase() && a.password === password);
  
  if (matched) {
    const token = signSession(matched.username);
    res.json({ token, username: matched.username });
  } else {
    // Standard Cyber Admin configuration fallback credentials
    if (username === 'admin' && password === 'cyberadmin1337') {
      const token = signSession(username);
      res.json({ token, username });
    } else {
      res.status(401).json({ error: 'Invalid console access credentials' });
    }
  }
});

// Auth Session Ping with full Admin Profile payload
app.get('/api/auth/me', authRequired, (req, res) => {
  const username = (req as any).user.username;
  const admin = dbInstance.getAdmins().find(a => a.username.toLowerCase() === username.toLowerCase());
  if (admin) {
    const { password, ...safeAdmin } = admin;
    res.json(safeAdmin);
  } else {
    res.json({
      username,
      fullName: 'Console Administrator',
      email: '',
      profilePhoto: '',
      permissions: {
        canManageContacts: true,
        canManageTemplates: true,
        canManageCampaigns: true,
        canManageSettings: true,
        canManageAdmins: true
      }
    });
  }
});

// Update current admin profile (username, password, photo, name, email)
app.post('/api/auth/profile', authRequired, (req, res) => {
  const username = (req as any).user.username;
  const { newUsername, password, fullName, email, profilePhoto } = req.body;
  
  const admins = dbInstance.getAdmins();
  const matched = admins.find(a => a.username.toLowerCase() === username.toLowerCase());
  
  if (!matched) {
    res.status(404).json({ error: 'Admin profile not found' });
    return;
  }
  
  const updatedPayload: any = { id: matched.id, username: matched.username };
  
  if (newUsername && newUsername.trim().toLowerCase() !== username.toLowerCase()) {
    const cleanNew = newUsername.trim().toLowerCase();
    const existing = admins.find(a => a.username.toLowerCase() === cleanNew);
    if (existing) {
      res.status(400).json({ error: 'Username is already active on another account' });
      return;
    }
    updatedPayload.username = cleanNew;
  }
  
  if (password !== undefined && password !== '') updatedPayload.password = password;
  if (fullName !== undefined) updatedPayload.fullName = fullName;
  if (email !== undefined) updatedPayload.email = email;
  if (profilePhoto !== undefined) updatedPayload.profilePhoto = profilePhoto;
  
  const saved = dbInstance.saveAdmin(updatedPayload);
  const { password: _, ...safeSaved } = saved;
  
  let token: string | null = null;
  if (updatedPayload.username !== username) {
    token = signSession(updatedPayload.username);
  }
  
  res.json({ success: true, user: safeSaved, token });
});

// Retrieve lists of admins (with permissions, without passwords)
app.get('/api/admins', authRequired, (req, res) => {
  const requesterUsername = (req as any).user.username;
  const requester = dbInstance.getAdmins().find(a => a.username.toLowerCase() === requesterUsername.toLowerCase());
  const canManage = requester ? requester.permissions.canManageAdmins : true;
  
  if (!canManage) {
    res.status(403).json({ error: 'Permission denied: cannot manage administrators' });
    return;
  }
  
  const admins = dbInstance.getAdmins().map(({ password, ...safeAdmin }) => safeAdmin);
  res.json(admins);
});

// Create/Edit/Save administrator entity
app.post('/api/admins', authRequired, (req, res) => {
  const requesterUsername = (req as any).user.username;
  const requester = dbInstance.getAdmins().find(a => a.username.toLowerCase() === requesterUsername.toLowerCase());
  const canManage = requester ? requester.permissions.canManageAdmins : true; 

  if (!canManage) {
    res.status(403).json({ error: 'Permission denied: cannot manage administrators' });
    return;
  }

  const { id, username, password, fullName, email, profilePhoto, permissions } = req.body;
  if (!username) {
    res.status(400).json({ error: 'Username is required' });
    return;
  }

  const saved = dbInstance.saveAdmin({
    id,
    username,
    password,
    fullName,
    email,
    profilePhoto,
    permissions
  });

  const { password: _, ...safeAdmin } = saved;
  res.json(safeAdmin);
});

// Delete admin by ID
app.delete('/api/admins/:id', authRequired, (req, res) => {
  const requesterUsername = (req as any).user.username;
  const requester = dbInstance.getAdmins().find(a => a.username.toLowerCase() === requesterUsername.toLowerCase());
  const canManage = requester ? requester.permissions.canManageAdmins : true;

  if (!canManage) {
    res.status(403).json({ error: 'Permission denied: cannot manage administrators' });
    return;
  }

  const success = dbInstance.deleteAdmin(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Cannot delete admin (protected master "admin" account or the only admin)' });
  }
});

// Contact Manager endpoints
app.get('/api/contacts', authRequired, (req, res) => {
  res.json(dbInstance.getContacts());
});

app.post('/api/contacts', authRequired, (req, res) => {
  const { name, phone, tags, customFields } = req.body;
  if (!name || !phone) {
    res.status(400).json({ error: 'Contact name and phone are required' });
    return;
  }
  const saved = dbInstance.saveContact({ name, phone, tags, customFields });
  res.json(saved);
});

app.delete('/api/contacts/:id', authRequired, (req, res) => {
  const success = dbInstance.deleteContact(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Contact not found' });
  }
});

// Batch delete contacts
app.post('/api/contacts/batch-delete', authRequired, (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    res.status(400).json({ error: 'List of connection ids is required' });
    return;
  }
  let deletedCount = 0;
  for (const id of ids) {
    const success = dbInstance.deleteContact(id);
    if (success) {
      deletedCount++;
    }
  }
  res.json({ success: true, deletedCount });
});

// Import contacts from CSV
app.post('/api/contacts/import', authRequired, (req, res) => {
  const { contacts } = req.body;
  if (!contacts || !Array.isArray(contacts)) {
    res.status(400).json({ error: 'Invalid CSV format payload' });
    return;
  }
  const results = dbInstance.importContactsFromCSV(contacts);
  res.json(results);
});

// Template management endpoints
app.get('/api/templates', authRequired, (req, res) => {
  res.json(dbInstance.getTemplates());
});

app.post('/api/templates', authRequired, (req, res) => {
  const { name, text, id } = req.body;
  if (!name || !text) {
    res.status(400).json({ error: 'Template name and text body are required' });
    return;
  }
  const saved = dbInstance.saveTemplate({ name, text, id });
  res.json(saved);
});

app.delete('/api/templates/:id', authRequired, (req, res) => {
  const success = dbInstance.deleteTemplate(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Template not found' });
  }
});

// Campaign management endpoints
app.get('/api/campaigns', authRequired, (req, res) => {
  res.json(dbInstance.getCampaigns());
});

app.post('/api/campaigns', authRequired, (req, res) => {
  const { name, templateId, audienceType, targetTags, delaySeconds, scheduledTime, id, status, testNumbers } = req.body;
  if (!name || !templateId) {
    res.status(400).json({ error: 'Campaign name and template are required' });
    return;
  }

  // Auto-calculate contacts count on the server side
  let computedTotal = 0;
  const contactsList = dbInstance.getContacts();
  const audience = audienceType || 'all';
  if (audience === 'all') {
    computedTotal = contactsList.length;
  } else if (audience === 'tags') {
    const tags = targetTags || [];
    computedTotal = contactsList.filter(c => c.tags?.some((t: string) => tags.includes(t))).length;
  } else if (audience === 'csv_only') {
    computedTotal = (testNumbers || []).length;
  }

  const saved = dbInstance.saveCampaign({
    name,
    templateId,
    audienceType: audience,
    targetTags: targetTags || [],
    delaySeconds: Number(delaySeconds) || 2,
    scheduledTime,
    id,
    status: status || 'pending',
    testNumbers: testNumbers || [],
    totalContacts: computedTotal
  });
  res.json(saved);
});

// Bulk Campaign Duplication endpoint
app.post('/api/campaigns/:id/duplicate', authRequired, (req, res) => {
  const campaigns = dbInstance.getCampaigns();
  const target = campaigns.find(c => c.id === req.params.id);
  if (!target) {
    res.status(404).json({ error: 'Source campaign not found' });
    return;
  }
  const duplicated = dbInstance.saveCampaign({
    name: `${target.name} (Copy)`,
    templateId: target.templateId,
    audienceType: target.audienceType,
    targetTags: [...target.targetTags],
    delaySeconds: target.delaySeconds,
    status: 'pending',
    testNumbers: target.testNumbers ? [...target.testNumbers] : [],
    totalContacts: target.totalContacts,
  });
  res.json(duplicated);
});

app.delete('/api/campaigns/:id', authRequired, (req, res) => {
  const success = dbInstance.deleteCampaign(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Campaign not found' });
  }
});

// Settings management endpoints
app.get('/api/settings', authRequired, (req, res) => {
  res.json(dbInstance.getSettings());
});

app.post('/api/settings', authRequired, (req, res) => {
  const updated = dbInstance.updateSettings(req.body);
  res.json(updated);
});

// Network Gateway Connectivity Diagnostic Ping Test
app.post('/api/settings/ping', authRequired, async (req, res) => {
  const { gatewayUrl, apiToken } = req.body;
  const urlToTest = gatewayUrl || dbInstance.getSettings().gatewayUrl;
  const tokenToTest = apiToken !== undefined ? apiToken : dbInstance.getSettings().apiToken;

  if (!urlToTest) {
    res.status(400).json({ error: 'Gateway URL is required for diagnostic test' });
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout to prevent stalling

    console.log(`[DIAGNOSTIC PING] Initiating heartbeat trace to: ${urlToTest}`);
    
    const response = await fetch(urlToTest, {
      method: 'GET',
      headers: {
        'X-Gateway-Token': tokenToTest || '',
        'Authorization': tokenToTest || '',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Some gateways only accept POST or return 404/405 for GET/HEAD, but responding at all means they are online!
    res.json({
      success: true,
      statusCode: response.status,
      statusText: response.statusText,
      message: `Gateway URL is reachable. Server returned HTTP status ${response.status} (${response.statusText || 'OK'}).`
    });
  } catch (err: any) {
    let errorMsg = err.message || '';
    if (err.name === 'AbortError') {
      errorMsg = 'Connection timed out (4000ms threshold reached)';
    } else if (errorMsg.includes('ECONNREFUSED')) {
      errorMsg = 'Connection refused. Is the Gateway App active on your Android device and on the correct port?';
    } else if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('EHOSTUNREACH')) {
      errorMsg = 'Host unreachable. Check your subnet or Wi-Fi connectivity and double-check the IP.';
    }
    res.json({
      success: false,
      error: errorMsg,
      message: `Failed to connect with gateway target. Details: ${errorMsg}`
    });
  }
});

// Sms Logs management endpoints
app.get('/api/logs', authRequired, (req, res) => {
  res.json(dbInstance.getLogs());
});

app.delete('/api/logs', authRequired, (req, res) => {
  dbInstance.clearLogs();
  res.json({ success: true });
});

// AI Gemini Content Optimization Helper (Server-side)
app.post('/api/gemini/optimize', authRequired, async (req, res) => {
  const { text, objective } = req.body;
  if (!text) {
    res.status(400).json({ error: 'Draft message body is required' });
    return;
  }
  
  if (!GEMINI_API_KEY) {
    res.json({ optimizedText: text + " (Configure GEMINI_API_KEY for real AI optimizations)" });
    return;
  }

  try {
    const prompt = `You are a prompt optimizer and professional copywriter.
Optimise the following SMS text draft to be more engaging, concise (under 160 characters if possible), professional, and conversion-focused. Ensure that variables inside curly braces like {name}, {phone}, or {amount} are kept EXACTLY as they are. Do not translate or change variable names.

Objective / Audience: ${objective || 'General'}
Draft message: "${text}"

Return ONLY the optimized SMS version without any introduction, remarks, quotes, or markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const optimized = response.text?.trim() || text;
    res.json({ optimizedText: optimized });
  } catch (error: any) {
    console.error('[GEMINI] Template optimization error', error);
    res.status(500).json({ error: 'AI Optimizer failed: ' + error.message });
  }
});

// AI Gemini Audio Transcription (Server-side)
app.post('/api/gemini/transcribe', authRequired, async (req, res) => {
  const { audioData, mimeType } = req.body;
  if (!audioData) {
    res.status(400).json({ error: 'Attached base64 audio data is required' });
    return;
  }

  if (!GEMINI_API_KEY) {
    res.status(400).json({ error: 'GEMINI_API_KEY is not configured in secrets. Please set it to transcribe audio.' });
    return;
  }

  try {
    // Trim metadata header from base64 string if present (e.g. "data:audio/webm;base64,")
    const cleanedBase64 = audioData.includes('base64,') ? audioData.split('base64,')[1] : audioData;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType || 'audio/webm',
            data: cleanedBase64
          }
        },
        'Transcribe this audio message precisely into clean plain text for an SMS template. Return ONLY the text, with no preamble, quotes, or extra information.'
      ]
    });

    res.json({ transcription: response.text?.trim() || '' });
  } catch (error: any) {
    console.error('[GEMINI] Audio Transcription error', error);
    res.status(500).json({ error: 'AI Speech Transcription failed: ' + error.message });
  }
});

// Provide standard dashboard metrics info
app.get('/api/stats', authRequired, (req, res) => {
  const contacts = dbInstance.getContacts();
  const campaigns = dbInstance.getCampaigns();
  const logs = dbInstance.getLogs();
  
  // Calculate today's dates
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();
  
  const sentTodayLogs = logs.filter(l => l.timestamp >= startOfTodayMs);
  const sentCountToday = sentTodayLogs.length;
  const failedToday = sentTodayLogs.filter(l => l.status === 'failed').length;
  const successfulToday = sentTodayLogs.filter(l => l.status === 'sent').length;
  
  const successRate = sentCountToday > 0 ? Math.round((successfulToday / sentCountToday) * 100) : 100;
  const activeCampaigns = campaigns.filter(c => c.status === 'sending').length;

  res.json({
    totalContacts: contacts.length,
    sentToday: sentCountToday,
    successRate,
    failedToday,
    activeCampaigns,
  });
});


// -------------------------------------------------------------
// CORE BACKGROUND CAMPAIGN SENDER & SCHEDULER ENGINE
// -------------------------------------------------------------
let isLoopRunning = false;

// Personalize templates replaces {name}, {phone}, {custom_field}
function personalizeMessage(template: string, contact: Contact): string {
  let text = template;
  text = text.replace(/{name}/gi, contact.name);
  text = text.replace(/{phone}/gi, contact.phone);
  
  // Replace custom variables like {amount}, {date} or {custom_label}
  if (contact.customFields) {
    for (const [key, value] of Object.entries(contact.customFields)) {
      const regex = new RegExp(`{${key}}`, 'gi');
      text = text.replace(regex, value);
    }
  }
  
  // Clean default variables if not found
  text = text.replace(/{[a-zA-Z0-9_]+}/g, 'N/A');
  return text;
}

// Global loop execution trigger
async function backgroundCampaignLoop() {
  if (isLoopRunning) return;
  isLoopRunning = true;
  
  try {
    const campaigns = dbInstance.getCampaigns();
    const settings = dbInstance.getSettings();
    const now = Date.now();
    
    // 1. Process Campaign Scheduler (Auto-trigger Scheduled Campaigns)
    for (const c of campaigns) {
      if (c.status === 'pending' && c.scheduledTime) {
        const scheduledMs = new Date(c.scheduledTime).getTime();
        if (now >= scheduledMs) {
          c.status = 'sending';
          dbInstance.saveCampaign(c);
          console.log(`[SCHEDULER] Automatically started campaign: "${c.name}"`);
        }
      }
    }
    
    // 2. Locate campaign with sending state
    const sendingCampaign = campaigns.find(c => c.status === 'sending');
    if (!sendingCampaign) {
      isLoopRunning = false;
      return;
    }
    
    // Fetch relevant contacts to check delivery queue
    let targetContacts: Contact[] = [];
    if (sendingCampaign.audienceType === 'all') {
      targetContacts = dbInstance.getContacts();
    } else if (sendingCampaign.audienceType === 'tags') {
      targetContacts = dbInstance.getContacts().filter(c => 
        c.tags.some(tag => sendingCampaign.targetTags.includes(tag))
      );
    } else if (sendingCampaign.audienceType === 'csv_only' && sendingCampaign.testNumbers) {
      // Create transient contacts for specific custom lists
      targetContacts = sendingCampaign.testNumbers.map((num, i) => ({
        id: `transient_${i}`,
        name: `Subscriber ${i + 1}`,
        phone: num,
        tags: ['csv'],
        createdAt: now
      }));
    }
    
    // Total numbers to deliver to in duplicate check filter
    // Filter duplicates and invalid numbers first
    const checkedNumbers = new Set<string>();
    const filteredTargetContacts: Contact[] = [];
    for (const c of targetContacts) {
      const normalized = c.phone.trim().replace(/[\s-+()]/g, '');
      if (!checkedNumbers.has(normalized)) {
        checkedNumbers.add(normalized);
        filteredTargetContacts.push(c);
      }
    }

    if (sendingCampaign.totalContacts !== filteredTargetContacts.length) {
      sendingCampaign.totalContacts = filteredTargetContacts.length;
      dbInstance.saveCampaign(sendingCampaign);
    }

    // Map existing campaign logs to bypass sent numbers
    const campaignLogs = dbInstance.getLogs().filter(l => l.campaignId === sendingCampaign.id);
    const sentPhones = new Set(
      campaignLogs
        .filter(l => l.status === 'sent')
        .map(l => l.phone.trim().replace(/[\s-+()]/g, ''))
    );
    
    // Check if we need to auto-retry any failed contacts (Max 2 attempts total)
    // Find contacts whose existing log is 'failed' and retry count is < 2
    const failedLogMap = new Map<string, SmsLog>();
    for (const l of campaignLogs) {
      if (l.status === 'failed') {
        const key = l.phone.trim().replace(/[\s-+()]/g, '');
        // Keep the latest log to trace accurate retry status
        if (!failedLogMap.has(key) || failedLogMap.get(key)!.timestamp < l.timestamp) {
          failedLogMap.set(key, l);
        }
      }
    }

    // Locate the first next contact that is unsent
    let targetContact: Contact | null = null;
    let isRetryAttempt = false;
    let existingFailedLog: SmsLog | null = null;

    for (const c of filteredTargetContacts) {
      const normalizedPhone = c.phone.trim().replace(/[\s-+()]/g, '');
      
      // If completed successfully, bypass
      if (sentPhones.has(normalizedPhone)) {
        continue;
      }
      
      const failedLog = failedLogMap.get(normalizedPhone);
      // Case 1: Never attempted at all
      if (!failedLog) {
        targetContact = c;
        break;
      }
      
      // Case 2: Attempted, failed, but retry count is under 2
      if (failedLog.status === 'failed' && failedLog.retryCount < 2) {
        targetContact = c;
        isRetryAttempt = true;
        existingFailedLog = failedLog;
        break;
      }
    }
    
    // Campaign has completed all sending target destinations
    if (!targetContact) {
      sendingCampaign.status = 'completed';
      sendingCampaign.completedAt = Date.now();
      dbInstance.saveCampaign(sendingCampaign);
      console.log(`[CAMPAIGN ENGINE] Campaign Completed: "${sendingCampaign.name}"`);
      isLoopRunning = false;
      return;
    }
    
    // Prepare personalized text
    const templateList = dbInstance.getTemplates();
    const activeTemplate = templateList.find(t => t.id === sendingCampaign.templateId);
    const rawText = activeTemplate ? activeTemplate.text : 'Welcome Alert!';
    const personalizedBody = personalizeMessage(rawText, targetContact);
    
    // Rate Limiting Protection (Max 40 messages per minute default delay enforces this safely)
    const effectiveDelaySec = sendingCampaign.delaySeconds || settings.defaultDelaySeconds || 2;
    
    // Dispatch message based on config (Real gateway callback or sandboxed dry run mode)
    let status: 'sent' | 'failed' = 'sent';
    let errorReason = '';
    const currentRetryIndex = isRetryAttempt && existingFailedLog ? existingFailedLog.retryCount + 1 : 0;
    
    if (settings.dryRunMode) {
      // Dry Run simulator outputs successful virtual sms instantly after simulated latency
      await new Promise(r => setTimeout(r, 600));
      status = 'sent';
      console.log(`[DRY RUN SIMULATOR] Virtual SMS to ${targetContact.phone}: "${personalizedBody}"`);
    } else {
      // REAL Android SMS Gateway HTTP integration call
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s network safety timeout
        
        console.log(`[HTTP SMS PROXY] Dispatching to Android API: ${settings.gatewayUrl}`);
        const apiResponse = await fetch(settings.gatewayUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Gateway-Token': settings.apiToken || '',
            'Authorization': settings.apiToken || '',
          },
          body: JSON.stringify({
            to: targetContact.phone,
            message: personalizedBody,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (apiResponse.status === 200 || apiResponse.status === 201) {
          status = 'sent';
          console.log(`[HTTP SMS PROXY] Dispatched SMS success to ${targetContact.phone}`);
        } else {
          status = 'failed';
          errorReason = `HTTP Error ${apiResponse.status}: ${await apiResponse.text()}`;
          console.warn(`[HTTP SMS PROXY] Failed SMS delivery to ${targetContact.phone}. Reason: ${errorReason}`);
        }
      } catch (err: any) {
        status = 'failed';
        errorReason = err.name === 'AbortError' ? 'Network gateway timeout (6000ms limit reached)' : `Network exception: ${err.message}`;
        console.error(`[HTTP SMS PROXY] Connection exception to ${settings.gatewayUrl}`, err);
      }
    }
    
    // Commit the SmsLog to DB
    dbInstance.addLog({
      campaignId: sendingCampaign.id,
      campaignName: sendingCampaign.name,
      phone: targetContact.phone,
      name: targetContact.name,
      message: personalizedBody,
      status,
      errorReason,
      retryCount: currentRetryIndex,
    });
    
    // Update live counter states in Campaign
    const freshLogs = dbInstance.getLogs().filter(l => l.campaignId === sendingCampaign.id);
    
    // We compute stats by grouping unique successful numbers
    const successfulCount = freshLogs.filter(l => l.status === 'sent').length;
    
    // Failed are those that failed and reached max retry count, or we count failures
    // For robust live percentages, we map sent count directly as sum of sentLogs + permanently failed
    const uniquelyAttemptedAndFinished = new Set(freshLogs.map(l => l.phone.trim().replace(/[\s-+()]/g, ''))).size;
    const failuresCount = freshLogs.filter(l => l.status === 'failed' && l.retryCount >= 2).length;
    
    sendingCampaign.sentCount = uniquelyAttemptedAndFinished;
    sendingCampaign.successCount = successfulCount;
    sendingCampaign.failedCount = failuresCount;
    
    dbInstance.saveCampaign(sendingCampaign);
    
    // Enforce configured Delay between messages
    await new Promise(r => setTimeout(r, effectiveDelaySec * 1000));
    
  } catch (error) {
    console.error('[CAMPAIGN ENGINE] Interrupted with core loop exception', error);
  } finally {
    isLoopRunning = false;
  }
}

// Start recurring 1-second campaign checking pipeline
setInterval(backgroundCampaignLoop, 1500);


// -------------------------------------------------------------
// CLIENT FRONTEND INTEGRATION
// -------------------------------------------------------------
async function startFullStackApp() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Cyber SMS Control Panel running on http://0.0.0.0:${PORT}`);
    console.log(`[DRY RUN STATUS] Enabled by default (Safe Simulator Mode)`);
  });
}

startFullStackApp().catch(err => {
  console.error('[CRITICAL] Failed to execute fullstack server', err);
});
