/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { Contact, Campaign, MessageTemplate, SmsLog, SmsSettings, AdminUser } from '../types.js';

interface DatabaseSchema {
  contacts: Contact[];
  campaigns: Campaign[];
  templates: MessageTemplate[];
  logs: SmsLog[];
  settings: SmsSettings;
  admins?: AdminUser[];
}

const DB_FILE = path.resolve(process.cwd(), 'sms_control_db.json');

const DEFAULT_SETTINGS: SmsSettings = {
  gatewayUrl: 'http://192.168.1.67:8082/',
  apiToken: '19677b53-6c98-4929-9e60-ca788ada9036',
  defaultDelaySeconds: 2,
  enableAnimations: true,
  dryRunMode: true, // Clean safety default so users must untoggle it for real gateway calls
};

const INITIAL_DB: DatabaseSchema = {
  contacts: [
    {
      id: 'c1',
      name: 'Alpha Sentinel',
      phone: '+15550199281',
      tags: ['VIP', 'regular'],
      customFields: { amount: '$150.00', date: 'June 30' },
      createdAt: Date.now() - 48 * 3600 * 1000,
    },
    {
      id: 'c2',
      name: 'Major Tom',
      phone: '+15550199555',
      tags: ['VIP', 'overdue'],
      customFields: { amount: '$240.00', date: 'June 15' },
      createdAt: Date.now() - 45 * 3600 * 1000,
    },
    {
      id: 'c3',
      name: 'Nova Prime',
      phone: '+15550198811',
      tags: ['regular'],
      customFields: { amount: '$75.50', date: 'July 05' },
      createdAt: Date.now() - 30 * 3600 * 1000,
    },
    {
      id: 'c4',
      name: 'Cyber Core',
      phone: '+15550192300',
      tags: ['new-lead'],
      customFields: { amount: '$0.00', date: 'N/A' },
      createdAt: Date.now() - 5 * 3600 * 1000,
    },
  ],
  campaigns: [
    {
      id: 'camp_1',
      name: 'CYBER BILLING ALERT v1',
      status: 'completed',
      templateId: 'temp_1',
      audienceType: 'tags',
      targetTags: ['overdue'],
      totalContacts: 1,
      sentCount: 1,
      successCount: 1,
      failedCount: 0,
      delaySeconds: 1,
      createdAt: Date.now() - 24 * 3600 * 1000,
      completedAt: Date.now() - 24 * 3600 * 1000 + 4000,
    },
    {
      id: 'camp_2',
      name: 'VIP NEON PROMO 2026',
      status: 'paused',
      templateId: 'temp_2',
      audienceType: 'all',
      targetTags: [],
      totalContacts: 4,
      sentCount: 2,
      successCount: 2,
      failedCount: 0,
      delaySeconds: 2,
      createdAt: Date.now() - 2 * 3600 * 1000,
    }
  ],
  templates: [
    {
      id: 'temp_1',
      name: 'Overdue Invoice Alert',
      text: 'Hello {name}, your key service is overdue by {amount}. Please complete payment by {date} to maintain high-speed uplink. Secure cyber gateway: s.sms/pay',
      createdAt: Date.now() - 50 * 3600 * 1000,
    },
    {
      id: 'temp_2',
      name: 'VIP System Invite',
      text: 'Welcome {name}! Your console account config is verified. Access secure node with token. Support line: {phone}',
      createdAt: Date.now() - 40 * 3600 * 1000,
    }
  ],
  logs: [
    {
      id: 'log_1',
      campaignId: 'camp_1',
      campaignName: 'CYBER BILLING ALERT v1',
      phone: '+15550199555',
      name: 'Major Tom',
      message: 'Hello Major Tom, your key service is overdue by $240.00. Please complete payment by June 15 to maintain high-speed uplink. Secure cyber gateway: s.sms/pay',
      status: 'sent',
      retryCount: 0,
      timestamp: Date.now() - 24 * 3600 * 1000,
    },
    {
      id: 'log_2',
      campaignId: 'camp_2',
      campaignName: 'VIP NEON PROMO 2026',
      phone: '+15550199281',
      name: 'Alpha Sentinel',
      message: 'Welcome Alpha Sentinel! Your console account config is verified. Access secure node with token. Support line: +15550199281',
      status: 'sent',
      retryCount: 0,
      timestamp: Date.now() - 2 * 3600 * 1000,
    },
    {
      id: 'log_3',
      campaignId: 'camp_2',
      campaignName: 'VIP NEON PROMO 2026',
      phone: '+15550199555',
      name: 'Major Tom',
      message: 'Welcome Major Tom! Your console account config is verified. Access secure node with token. Support line: +15550199555',
      status: 'sent',
      retryCount: 0,
      timestamp: Date.now() - 2 * 3600 * 1000 + 3000,
    }
  ],
  settings: DEFAULT_SETTINGS,
  admins: [
    {
      id: 'admin_1',
      username: 'admin',
      password: 'cyberadmin1337',
      fullName: 'Console Owner',
      email: 'admin@cybersms.io',
      profilePhoto: '',
      permissions: {
        canManageContacts: true,
        canManageTemplates: true,
        canManageCampaigns: true,
        canManageSettings: true,
        canManageAdmins: true,
        canDeleteCampaigns: true,
        canAccessLogs: true,
        canConfigureSystem: true,
      },
      createdAt: Date.now(),
    }
  ],
};

class DataStore {
  private cache: DatabaseSchema | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
        this.cache = INITIAL_DB;
      } else {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.cache = JSON.parse(raw);
        // Merge settings in case any fields are missing
        if (this.cache) {
          this.cache.settings = { ...DEFAULT_SETTINGS, ...this.cache.settings };
          if (!this.cache.admins) {
            this.cache.admins = [
              {
                id: 'admin_1',
                username: 'admin',
                password: 'cyberadmin1337',
                fullName: 'Console Owner',
                email: 'admin@cybersms.io',
                profilePhoto: '',
                permissions: {
                  canManageContacts: true,
                  canManageTemplates: true,
                  canManageCampaigns: true,
                  canManageSettings: true,
                  canManageAdmins: true,
                  canDeleteCampaigns: true,
                  canAccessLogs: true,
                  canConfigureSystem: true,
                },
                createdAt: Date.now(),
              },
            ];
            this.save();
          }
        }
      }
    } catch (e) {
      console.error('[DATABASE] Initialization error, falling back to in-memory store', e);
      this.cache = INITIAL_DB;
    }
  }

  private save() {
    if (!this.cache) return;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.cache, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DATABASE] Save error', e);
    }
  }

  public getContacts(): Contact[] {
    return this.cache?.contacts || [];
  }

  public saveContact(contact: Omit<Contact, 'id' | 'createdAt'> & { id?: string }): Contact {
    if (!this.cache) this.init();
    
    // Duplicate phone detection
    const existingIndex = this.cache!.contacts.findIndex(c => c.phone.trim() === contact.phone.trim());
    
    if (contact.id) {
      // Edit
      const index = this.cache!.contacts.findIndex(c => c.id === contact.id);
      if (index !== -1) {
        const updated: Contact = {
          ...this.cache!.contacts[index],
          ...contact as Contact,
        };
        this.cache!.contacts[index] = updated;
        this.save();
        return updated;
      }
    }
    
    // New
    const newContact: Contact = {
      id: contact.id || 'contact_' + Math.random().toString(36).substr(2, 9),
      name: contact.name,
      phone: contact.phone,
      tags: contact.tags || [],
      customFields: contact.customFields || {},
      createdAt: Date.now(),
    };
    this.cache!.contacts.push(newContact);
    this.save();
    return newContact;
  }

  public deleteContact(id: string): boolean {
    if (!this.cache) return false;
    const initialLen = this.cache.contacts.length;
    this.cache.contacts = this.cache.contacts.filter(c => c.id !== id);
    if (this.cache.contacts.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public importContactsFromCSV(contactsList: Omit<Contact, 'id' | 'createdAt'>[]): { imported: number; duplicates: number } {
    if (!this.cache) this.init();
    let imported = 0;
    let duplicates = 0;

    for (const c of contactsList) {
      const isDuplicate = this.cache!.contacts.some(item => item.phone.replace(/[\s-+]/g, '') === c.phone.replace(/[\s-+]/g, ''));
      if (isDuplicate) {
        duplicates++;
        continue;
      }
      this.saveContact(c);
      imported++;
    }
    return { imported, duplicates };
  }

  public getCampaigns(): Campaign[] {
    return this.cache?.campaigns || [];
  }

  public saveCampaign(campaign: Omit<Campaign, 'id' | 'createdAt' | 'sentCount' | 'successCount' | 'failedCount'> & { id?: string, sentCount?: number, successCount?: number, failedCount?: number }): Campaign {
    if (!this.cache) this.init();
    if (campaign.id) {
      const index = this.cache!.campaigns.findIndex(c => c.id === campaign.id);
      if (index !== -1) {
        const updated: Campaign = {
          ...this.cache!.campaigns[index],
          ...campaign as any,
        };
        this.cache!.campaigns[index] = updated;
        this.save();
        return updated;
      }
    }

    const newCampaign: Campaign = {
      ...campaign,
      id: campaign.id || 'camp_' + Math.random().toString(36).substr(2, 9),
      status: campaign.status || 'pending',
      sentCount: campaign.sentCount || 0,
      successCount: campaign.successCount || 0,
      failedCount: campaign.failedCount || 0,
      createdAt: Date.now(),
    };
    this.cache!.campaigns.push(newCampaign);
    this.save();
    return newCampaign;
  }

  public deleteCampaign(id: string): boolean {
    if (!this.cache) return false;
    const initialLen = this.cache.campaigns.length;
    this.cache.campaigns = this.cache.campaigns.filter(c => c.id !== id);
    if (this.cache.campaigns.length !== initialLen) {
      // Also cleanup logs associated if needed or preserve
      this.save();
      return true;
    }
    return false;
  }

  public getTemplates(): MessageTemplate[] {
    return this.cache?.templates || [];
  }

  public saveTemplate(template: Omit<MessageTemplate, 'id' | 'createdAt'> & { id?: string }): MessageTemplate {
    if (!this.cache) this.init();
    if (template.id) {
      const index = this.cache!.templates.findIndex(t => t.id === template.id);
      if (index !== -1) {
        const updated: MessageTemplate = {
          ...this.cache!.templates[index],
          ...template,
        };
        this.cache!.templates[index] = updated;
        this.save();
        return updated;
      }
    }

    const newTemplate: MessageTemplate = {
      id: 'temp_' + Math.random().toString(36).substr(2, 9),
      name: template.name,
      text: template.text,
      createdAt: Date.now(),
    };
    this.cache!.templates.push(newTemplate);
    this.save();
    return newTemplate;
  }

  public deleteTemplate(id: string): boolean {
    if (!this.cache) return false;
    const initialLen = this.cache.templates.length;
    this.cache.templates = this.cache.templates.filter(t => t.id !== id);
    if (this.cache.templates.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getLogs(): SmsLog[] {
    return this.cache?.logs || [];
  }

  public addLog(log: Omit<SmsLog, 'id' | 'timestamp'>): SmsLog {
    if (!this.cache) this.init();
    const newLog: SmsLog = {
      ...log,
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    this.cache!.logs.push(newLog);
    this.save();
    return newLog;
  }

  public clearLogs(): void {
    if (!this.cache) return;
    this.cache.logs = [];
    this.save();
  }

  public getAdmins(): AdminUser[] {
    if (!this.cache) this.init();
    return this.cache!.admins || [];
  }

  public saveAdmin(admin: Partial<AdminUser> & { username: string }): AdminUser {
    if (!this.cache) this.init();
    if (!this.cache!.admins) this.cache!.admins = [];

    if (admin.id) {
      const idx = this.cache!.admins.findIndex(a => a.id === admin.id);
      if (idx !== -1) {
        const updated = {
          ...this.cache!.admins[idx],
          ...admin,
          permissions: {
            ...this.cache!.admins[idx].permissions,
            ...(admin.permissions || {})
          }
        } as AdminUser;
        this.cache!.admins[idx] = updated;
        this.save();
        return updated;
      }
    }

    const newAdmin: AdminUser = {
      id: admin.id || 'admin_' + Math.random().toString(36).substr(2, 9),
      username: admin.username,
      password: admin.password || 'cyberadmin1337',
      fullName: admin.fullName || '',
      email: admin.email || '',
      profilePhoto: admin.profilePhoto || '',
      permissions: {
        canManageContacts: admin.permissions?.canManageContacts !== false,
        canManageTemplates: admin.permissions?.canManageTemplates !== false,
        canManageCampaigns: admin.permissions?.canManageCampaigns !== false,
        canManageSettings: admin.permissions?.canManageSettings !== false,
        canManageAdmins: admin.permissions?.canManageAdmins === true,
        canDeleteCampaigns: admin.permissions?.canDeleteCampaigns !== false,
        canAccessLogs: admin.permissions?.canAccessLogs !== false,
        canConfigureSystem: admin.permissions?.canConfigureSystem !== false
      },
      createdAt: Date.now()
    };
    this.cache!.admins.push(newAdmin);
    this.save();
    return newAdmin;
  }

  public deleteAdmin(id: string): boolean {
    if (!this.cache) return false;
    const admins = this.cache.admins || [];
    const adminToDelete = admins.find(a => a.id === id);
    if (!adminToDelete || adminToDelete.username === 'admin') return false;
    if (admins.length <= 1) return false;

    this.cache.admins = admins.filter(a => a.id !== id);
    this.save();
    return true;
  }

  public getSettings(): SmsSettings {
    if (!this.cache) this.init();
    return this.cache!.settings;
  }

  public updateSettings(settings: SmsSettings): SmsSettings {
    if (!this.cache) this.init();
    this.cache!.settings = {
      ...this.cache!.settings,
      ...settings,
    };
    this.save();
    return this.cache!.settings;
  }
}

export const dbInstance = new DataStore();
