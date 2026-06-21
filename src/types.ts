/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Contact {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  customFields?: Record<string, string>;
  createdAt: number;
}

export type CampaignStatus = 'pending' | 'sending' | 'paused' | 'completed' | 'stopped';

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  templateId: string;
  audienceType: 'all' | 'tags' | 'csv_only';
  targetTags: string[];
  totalContacts: number;
  sentCount: number;
  successCount: number;
  failedCount: number;
  delaySeconds: number;
  scheduledTime?: string; // ISO date-time string
  createdAt: number;
  completedAt?: number;
  testNumbers?: string[]; // for quick dry-runs/test sending
}

export interface MessageTemplate {
  id: string;
  name: string;
  text: string;
  createdAt: number;
}

export type SmsLogStatus = 'sent' | 'failed' | 'pending';

export interface SmsLog {
  id: string;
  campaignId: string;
  campaignName: string;
  phone: string;
  name: string;
  message: string;
  status: SmsLogStatus;
  errorReason?: string;
  retryCount: number;
  timestamp: number;
}

export interface SmsSettings {
  gatewayUrl: string;
  apiToken: string;
  defaultDelaySeconds: number;
  enableAnimations: boolean;
  dryRunMode: boolean;
  successImageUrl?: string;
  failureImageUrl?: string;
}

export interface DashboardStats {
  totalContacts: number;
  sentToday: number;
  successRate: number;
  failedToday: number;
  activeCampaigns: number;
}

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  fullName?: string;
  email?: string;
  profilePhoto?: string; // base64 string
  permissions: {
    canManageContacts: boolean;
    canManageTemplates: boolean;
    canManageCampaigns: boolean;
    canManageSettings: boolean;
    canManageAdmins: boolean;
    canDeleteCampaigns: boolean;
    canAccessLogs: boolean;
    canConfigureSystem: boolean;
  };
  createdAt: number;
}

export interface CampaignProgress {
  campaignId: string;
  status: CampaignStatus;
  sentCount: number;
  successCount: number;
  failedCount: number;
  totalContacts: number;
}
