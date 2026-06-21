/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Shield, 
  Key, 
  Mail, 
  Upload, 
  Trash2, 
  UserPlus, 
  Check, 
  X, 
  Users, 
  Sliders,
  Sparkles,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { AdminUser } from '../types.js';

interface AdminPanelProps {
  token: string;
  isDarkMode: boolean;
  currentUser: AdminUser | null;
  onProfileUpdated: (newToken?: string) => void;
}

export default function AdminPanel({ 
  token, 
  isDarkMode, 
  currentUser,
  onProfileUpdated 
}: AdminPanelProps) {
  
  const [activeTab, setActiveTab] = useState<'profile' | 'admins'>('profile');
  
  // Profile settings state
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Admins management state
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    permissions: {
      canManageContacts: true,
      canManageTemplates: true,
      canManageCampaigns: true,
      canManageSettings: true,
      canManageAdmins: false,
      canDeleteCampaigns: false,
      canAccessLogs: false,
      canConfigureSystem: false
    }
  });
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);

  // Password visibility
  const [showProfilePass, setShowProfilePass] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Editing Admin access levels states
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<{
    fullName: string;
    email: string;
    permissions: {
      canManageContacts: boolean;
      canManageTemplates: boolean;
      canManageCampaigns: boolean;
      canManageSettings: boolean;
      canManageAdmins: boolean;
      canDeleteCampaigns: boolean;
      canAccessLogs: boolean;
      canConfigureSystem: boolean;
    }
  } | null>(null);
  const [isUpdatingAdminPermission, setIsUpdatingAdminPermission] = useState(false);

  // Securely track active identity with high fidelity to prevent background polling state resets
  const prevUserIdRef = React.useRef<string | null>(null);

  // Initialize profile form with logged-in user details (fires only once per session or on switch)
  useEffect(() => {
    if (currentUser && prevUserIdRef.current !== currentUser.id) {
      setProfileForm({
        fullName: currentUser.fullName || '',
        username: currentUser.username || '',
        email: currentUser.email || '',
        password: '',
        confirmPassword: ''
      });
      setProfilePhoto(currentUser.profilePhoto || '');
      prevUserIdRef.current = currentUser.id;
    }
  }, [currentUser]);

  // Load administrators list if user has permission
  useEffect(() => {
    if (currentUser?.permissions.canManageAdmins) {
      fetchAdmins();
    }
  }, [currentUser, activeTab]);

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admins', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 200) {
        const data = await res.json();
        setAdminsList(data);
      }
    } catch (e) {
      console.error('Failed to load administrators fleet config', e);
    }
  };

  // Profile picture base64 uploader helper
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileError('Secure upload warning: Image size must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Profile update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      setProfileError('Security mismatch: Passwords do not match.');
      return;
    }

    setIsUpdatingProfile(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profileForm.fullName,
          newUsername: profileForm.username,
          email: profileForm.email,
          password: profileForm.password || undefined,
          profilePhoto: profilePhoto
        })
      });

      const data = await res.json();
      if (res.status === 200) {
        setProfileSuccess('Identity terminal synchronization successful!');
        setProfileForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
        if (data.token) {
          onProfileUpdated(data.token);
        } else {
          onProfileUpdated();
        }
      } else {
        setProfileError(data.error || 'Failed to authorize profile changes.');
      }
    } catch (err) {
      setProfileError('Failed to synchronize with back-end database.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Submit new Administrator creation
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminSuccess(null);

    if (!newAdminForm.username || !newAdminForm.password) {
      setAdminError('Administrator authentication credentials are required.');
      return;
    }

    setIsSavingAdmin(true);

    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAdminForm)
      });

      const data = await res.json();
      if (res.status === 200) {
        setAdminSuccess(`Administrator "${newAdminForm.username}" successfully deployed!`);
        setNewAdminForm({
          username: '',
          password: '',
          fullName: '',
          email: '',
          permissions: {
            canManageContacts: true,
            canManageTemplates: true,
            canManageCampaigns: true,
            canManageSettings: true,
            canManageAdmins: false,
            canDeleteCampaigns: false,
            canAccessLogs: false,
            canConfigureSystem: false
          }
        });
        setIsAddingAdmin(false);
        fetchAdmins();
      } else {
        setAdminError(data.error || 'Failed to create administrator.');
      }
    } catch (err) {
      setAdminError('Could not contact background Express service.');
    } finally {
      setIsSavingAdmin(false);
    }
  };

  // Delete administrator
  const handleDeleteAdmin = async (id: string, username: string) => {
    if (!window.confirm(`Warning: Are you absolutely sure you want to retract administrative clearance for "${username}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admins/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.status === 200) {
        setAdminSuccess(`Administrator "${username}" clearance de-provisioned successfully.`);
        fetchAdmins();
      } else {
        setAdminError(data.error || 'Clearance retraction refused.');
      }
    } catch (err) {
      setAdminError('Database network failure.');
    }
  };

  const handleEditClick = (admin: AdminUser) => {
    setEditingAdminId(admin.id);
    setEditingForm({
      fullName: admin.fullName || '',
      email: admin.email || '',
      permissions: {
        canManageContacts: admin.permissions.canManageContacts !== false,
        canManageTemplates: admin.permissions.canManageTemplates !== false,
        canManageCampaigns: admin.permissions.canManageCampaigns !== false,
        canManageSettings: admin.permissions.canManageSettings !== false,
        canManageAdmins: admin.permissions.canManageAdmins === true,
        canDeleteCampaigns: admin.permissions.canDeleteCampaigns === true,
        canAccessLogs: admin.permissions.canAccessLogs === true,
        canConfigureSystem: admin.permissions.canConfigureSystem === true
      }
    });
  };

  const handleUpdateAdminPermissionsSubmit = async (adminId: string, adminUsername: string) => {
    if (!editingForm) return;
    setIsUpdatingAdminPermission(true);
    setAdminError(null);
    setAdminSuccess(null);

    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: adminId,
          username: adminUsername,
          fullName: editingForm.fullName,
          email: editingForm.email,
          permissions: editingForm.permissions
        })
      });

      if (res.status === 200) {
        setAdminSuccess(`Authorization parameters for "${adminUsername}" rewritten successfully!`);
        setEditingAdminId(null);
        setEditingForm(null);
        fetchAdmins();
      } else {
        const d = await res.json();
        setAdminError(d.error || 'Failed to update administrative permissions.');
      }
    } catch (e) {
      setAdminError('Database sync failed during privilege re-wiring.');
    } finally {
      setIsUpdatingAdminPermission(false);
    }
  };

  const shrinkPhoto = (base64Str: string) => {
    return base64Str || '';
  };

  const hasAdminConfigAccess = currentUser?.permissions.canManageAdmins;

  return (
    <div className="space-y-6">
      
      {/* Top Banner Heading */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDarkMode ? 'bg-slate-900/40 border-slate-800/80 shadow-md' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-500/10 border border-teal-550/20 text-teal-550 dark:text-teal-400 rounded-xl">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className={`text-md font-bold tracking-widest font-sans uppercase ${
              isDarkMode ? 'text-slate-100' : 'text-slate-900'
            }`}>
              SECURITY FLEET & ADM PANEL
            </h1>
            <p className={`text-xs font-mono mt-0.5 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Verify system privileges and set cryptographic profile hashes
            </p>
          </div>
        </div>

        {/* Dashboard Hub Tab Selector */}
        <div className="flex bg-slate-950/25 dark:bg-slate-950/55 p-1 rounded-xl border border-slate-800/30 w-max shrink-0 font-mono text-[10px]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg font-bold transition-all uppercase tracking-wider cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PERSONAL IDENTITY
          </button>
          {hasAdminConfigAccess && (
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-4 py-2 rounded-lg font-bold transition-all uppercase tracking-wider cursor-pointer ${
                activeTab === 'admins'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PRIVILEGED FLEET ({adminsList.length})
            </button>
          )}
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Circular picture uploader view card */}
          <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-center h-full min-h-[320px] ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800/80 shadow-md' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className={`text-xs font-mono font-bold tracking-widest uppercase mb-5 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-700'
            }`}>
              SECURE AVATAR FEED
            </h3>
            
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-teal-500/30 blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative w-32 h-32 rounded-full border-2 border-teal-500 overflow-hidden bg-slate-950 flex items-center justify-center">
                {profilePhoto ? (
                  <img 
                    src={profilePhoto} 
                    alt="Administrator" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-16 h-16 text-slate-600 animate-pulse" />
                )}
              </div>
              <label className="absolute bottom-1 right-1 bg-teal-500 hover:bg-teal-400 border border-slate-950 text-slate-950 p-2 rounded-full cursor-pointer shadow-lg active:scale-90 transition-all">
                <Upload className="w-4 h-4" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                />
              </label>
            </div>
            
            <p className={`text-[10px] font-sans mt-5 max-w-[190px] leading-relaxed ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Upload high-contrast portrait under 2MB. Image will encode locally and bind to storage nodes.
            </p>
          </div>

          {/* Setup own variables and profile settings form */}
          <div className={`p-6 rounded-2xl border lg:col-span-2 ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800/80 shadow-md' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className={`text-xs font-mono font-bold tracking-widest uppercase mb-4 border-b border-inherit pb-3 flex items-center gap-1.5 ${
              isDarkMode ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <Sliders className="w-4 h-4 text-teal-500" />
              CONFIGURE IDENTITY VALUES
            </h3>

            {profileError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2 font-sans font-medium">
                <X className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2 font-sans font-medium">
                <Check className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={`font-mono font-bold tracking-wider uppercase block ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-900 font-extrabold'
                  }`}>
                    FULL IDENTITY NAME
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Major Tom"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm(p => ({ ...p, fullName: e.target.value }))}
                    className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-black font-extrabold'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`font-mono font-bold tracking-wider uppercase block ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-900 font-extrabold'
                  }`}>
                    USERNAME (CODENAME)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="E.g., admin_main"
                      disabled={currentUser?.username === 'admin'}
                      value={profileForm.username}
                      onChange={(e) => setProfileForm(p => ({ ...p, username: e.target.value.toLowerCase().trim() }))}
                      className={`w-full p-3 pl-10 rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-black font-extrabold'
                      } ${currentUser?.username === 'admin' ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                    <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className={`font-mono font-bold tracking-wider uppercase block ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-900 font-extrabold'
                  }`}>
                    COMMUNICATION EMAIL
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="E.g., tom@space-station.io"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))}
                      className={`w-full p-3 pl-10 rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-black font-extrabold'
                      }`}
                    />
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Security parameters change */}
              <div className={`border-t pt-4 mt-2 space-y-4 border-inherit`}>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-zinc-500" />
                  <span className={`font-bold font-mono tracking-wider block text-[10px] uppercase ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>CHANGE ACCOUNT SECURITY PASS</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={`font-mono font-bold tracking-wider uppercase block ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      NEW SECURITY PHRASE
                    </label>
                    <div className="relative">
                      <input
                        type={showProfilePass ? 'text' : 'password'}
                        placeholder="Leave empty to preserve existing"
                        value={profileForm.password}
                        onChange={(e) => setProfileForm(p => ({ ...p, password: e.target.value }))}
                        className={`w-full p-3 pr-10 rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono tracking-widest ${
                          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowProfilePass(!showProfilePass)}
                        className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showProfilePass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`font-mono font-bold tracking-wider uppercase block ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      CONFIRM SECURITY PHRASE
                    </label>
                    <input
                      type={showProfilePass ? 'text' : 'password'}
                      placeholder="Repeat security phrase"
                      value={profileForm.confirmPassword}
                      onChange={(e) => setProfileForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono tracking-widest ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Roles / Clearance non-editable HUD */}
              <div className={`p-4 rounded-xl border flex flex-wrap gap-4 justify-between items-center ${
                isDarkMode ? 'bg-slate-950/20 border-slate-800' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div>
                  <span className={`text-[10px] font-mono tracking-widest font-black uppercase flex items-center gap-1.5 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    <Sliders className="w-3.5 h-3.5 text-teal-500" />
                    YOUR PRIVILEGE CERTIFICATE
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {currentUser?.permissions.canManageAdmins && <span className="bg-teal-550/10 text-teal-605 dark:text-teal-400 border border-teal-500/10 px-2 py-0.5 rounded font-mono text-[9px] font-bold">ADMIN_MGMT</span>}
                    {currentUser?.permissions.canManageContacts && <span className="bg-teal-550/10 text-teal-605 dark:text-teal-400 border border-teal-500/10 px-2 py-0.5 rounded font-mono text-[9px] font-bold">CONTACT_MGMT</span>}
                    {currentUser?.permissions.canManageTemplates && <span className="bg-teal-550/10 text-teal-605 dark:text-teal-400 border border-teal-500/10 px-2 py-0.5 rounded font-mono text-[9px] font-bold">TEMPLATE_BUILDER</span>}
                    {currentUser?.permissions.canManageCampaigns && <span className="bg-teal-550/10 text-teal-605 dark:text-teal-400 border border-teal-500/10 px-2 py-0.5 rounded font-mono text-[9px] font-bold">CAMPAIGN_DISPATCHY</span>}
                    {currentUser?.permissions.canManageSettings && <span className="bg-teal-550/10 text-teal-605 dark:text-teal-400 border border-teal-500/10 px-2 py-0.5 rounded font-mono text-[9px] font-bold">GATEWAY_CONFIG</span>}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold uppercase tracking-widest active:scale-95 transition-all text-[11px] h-max shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingProfile ? 'SYNCHRONIZING...' : 'SYNCHRONIZE TERMINAL CHANGES'}
                </button>
              </div>

            </form>
          </div>

        </div>
      )}

      {activeTab === 'admins' && hasAdminConfigAccess && (
        <div className="space-y-6">
          
          {/* Main Administrator Fleets display */}
          <div className={`p-6 rounded-2xl border ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800/80 hash-shadow' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-inherit pb-4 mb-5">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-500" />
                <h3 className={`text-xs font-bold font-sans tracking-widest uppercase ${
                  isDarkMode ? 'text-slate-100' : 'text-slate-800'
                }`}>
                  ADMINISTRATIVE TEAM ARCHIVES
                </h3>
              </div>
              
              <button
                onClick={() => setIsAddingAdmin(!isAddingAdmin)}
                className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase text-teal-500 hover:text-teal-400 border border-teal-500/20 hover:border-teal-500/40 bg-teal-500/5 hover:bg-teal-500/10 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
              >
                {isAddingAdmin ? (
                  <>
                    <X className="w-3.5 h-3.5" /> CLOSE PANEL
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" /> DEPLOY NEW ADMIN
                  </>
                )}
              </button>
            </div>

            {/* Deploy new admin section */}
            {isAddingAdmin && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 mb-6 rounded-xl border border-dashed ${
                  isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-350 bg-slate-50/50'
                }`}
              >
                <h4 className="text-xs font-mono font-bold tracking-widest text-teal-500 uppercase mb-4 flex items-center gap-1">
                  <UserPlus className="w-4 h-4 animate-bounce" /> INITIALIZE CLEARANCE DEPLOYMENT
                </h4>

                {adminError && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                    <X className="w-4 h-4 shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}

                <form onSubmit={handleAdminSubmit} className="space-y-4 text-xs font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-450 dark:text-slate-400 font-bold block">CODENAME USERNAME</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g., sentinel_alpha"
                        value={newAdminForm.username}
                        onChange={(e) => setNewAdminForm(p => ({ ...p, username: e.target.value.trim().toLowerCase() }))}
                        className={`w-full p-2.5 rounded-lg border font-mono ${
                          isDarkMode ? 'bg-slate-900 border-slate-850 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-450 dark:text-slate-400 font-bold block">SECURITY KEYPHRASE</label>
                      <div className="relative">
                        <input
                          type={showAdminPass ? 'text' : 'password'}
                          required
                          placeholder="Deploy password"
                          value={newAdminForm.password}
                          onChange={(e) => setNewAdminForm(p => ({ ...p, password: e.target.value }))}
                          className={`w-full p-2.5 pr-8 rounded-lg border font-mono tracking-widest ${
                            isDarkMode ? 'bg-slate-900 border-slate-850 text-slate-300' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPass(!showAdminPass)}
                          className="absolute right-2 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                        >
                          {showAdminPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-450 dark:text-slate-400 font-bold block">FULL IDENTITY NAME</label>
                      <input
                        type="text"
                        placeholder="E.g., Alpha Sentinel"
                        value={newAdminForm.fullName}
                        onChange={(e) => setNewAdminForm(p => ({ ...p, fullName: e.target.value }))}
                        className={`w-full p-2.5 rounded-lg border ${
                          isDarkMode ? 'bg-slate-900 border-slate-850 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-450 dark:text-slate-400 font-bold block">COMMUNICATION EMAIL</label>
                      <input
                        type="email"
                        placeholder="E.g., alpha@cyber.io"
                        value={newAdminForm.email}
                        onChange={(e) => setNewAdminForm(p => ({ ...p, email: e.target.value }))}
                        className={`w-full p-2.5 rounded-lg border ${
                          isDarkMode ? 'bg-slate-900 border-slate-850 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Privileges checklist */}
                  <div className="space-y-2">
                    <label className={`font-mono text-[9px] uppercase font-bold ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-700'
                    }`}>GRANT CLEARENCE MODULE PRIVILEGES:</label>
                    <div className="flex flex-wrap gap-4 pt-1 bg-slate-950/10 p-3 rounded-lg border border-inherit">
                      <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-[10px]">
                        <input
                          type="checkbox"
                          checked={newAdminForm.permissions.canManageContacts}
                          onChange={(e) => setNewAdminForm(p => ({
                            ...p,
                            permissions: { ...p.permissions, canManageContacts: e.target.checked }
                          }))}
                          className="w-4 h-4 rounded border-slate-705 bg-slate-900 text-teal-500 checked:bg-teal-500 hover:checked:bg-teal-400 focus:ring-1 focus:ring-teal-500/50 cursor-pointer accent-teal-500 transition-all focus:outline-none focus:ring-offset-0 shrink-0"
                        />
                        <span>CONTACT PRIVILEGES</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-[10px]">
                        <input
                          type="checkbox"
                          checked={newAdminForm.permissions.canManageTemplates}
                          onChange={(e) => setNewAdminForm(p => ({
                            ...p,
                            permissions: { ...p.permissions, canManageTemplates: e.target.checked }
                          }))}
                          className="w-4 h-4 rounded border-slate-705 bg-slate-900 text-teal-500 checked:bg-teal-500 hover:checked:bg-teal-400 focus:ring-1 focus:ring-teal-500/50 cursor-pointer accent-teal-500 transition-all focus:outline-none focus:ring-offset-0 shrink-0"
                        />
                        <span>TEMPLATE PRIVILEGES</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-[10px]">
                        <input
                          type="checkbox"
                          checked={newAdminForm.permissions.canManageCampaigns}
                          onChange={(e) => setNewAdminForm(p => ({
                            ...p,
                            permissions: { ...p.permissions, canManageCampaigns: e.target.checked }
                          }))}
                          className="w-4 h-4 rounded border-slate-705 bg-slate-900 text-teal-500 checked:bg-teal-500 hover:checked:bg-teal-400 focus:ring-1 focus:ring-teal-500/50 cursor-pointer accent-teal-500 transition-all focus:outline-none focus:ring-offset-0 shrink-0"
                        />
                        <span>CAMPAIGN SENDS</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-[10px]">
                        <input
                          type="checkbox"
                          checked={newAdminForm.permissions.canManageSettings}
                          onChange={(e) => setNewAdminForm(p => ({
                            ...p,
                            permissions: { ...p.permissions, canManageSettings: e.target.checked }
                          }))}
                          className="w-4 h-4 rounded border-slate-705 bg-slate-900 text-teal-500 checked:bg-teal-500 hover:checked:bg-teal-400 focus:ring-1 focus:ring-teal-500/50 cursor-pointer accent-teal-500 transition-all focus:outline-none focus:ring-offset-0 shrink-0"
                        />
                        <span>SYSTEM SETTINGS</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-[10px] text-rose-500">
                        <input
                          type="checkbox"
                          checked={newAdminForm.permissions.canDeleteCampaigns}
                          onChange={(e) => setNewAdminForm(p => ({
                            ...p,
                            permissions: { ...p.permissions, canDeleteCampaigns: e.target.checked }
                          }))}
                          className="w-4 h-4 rounded border-slate-705 bg-slate-900 text-teal-500 checked:bg-teal-500 hover:checked:bg-teal-400 focus:ring-1 focus:ring-teal-500/50 cursor-pointer accent-teal-500 transition-all focus:outline-none focus:ring-offset-0 shrink-0"
                        />
                        <span>CAMPAIGN DELETION</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-[10px] text-amber-500">
                        <input
                          type="checkbox"
                          checked={newAdminForm.permissions.canAccessLogs}
                          onChange={(e) => setNewAdminForm(p => ({
                            ...p,
                            permissions: { ...p.permissions, canAccessLogs: e.target.checked }
                          }))}
                          className="w-4 h-4 rounded border-slate-705 bg-slate-900 text-teal-500 checked:bg-teal-500 hover:checked:bg-teal-400 focus:ring-1 focus:ring-teal-500/50 cursor-pointer accent-teal-500 transition-all focus:outline-none focus:ring-offset-0 shrink-0"
                        />
                        <span>LOGS ACCESS</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-[10px] text-blue-500 font-bold">
                        <input
                          type="checkbox"
                          checked={newAdminForm.permissions.canConfigureSystem}
                          onChange={(e) => setNewAdminForm(p => ({
                            ...p,
                            permissions: { ...p.permissions, canConfigureSystem: e.target.checked }
                          }))}
                          className="w-4 h-4 rounded border-slate-705 bg-slate-900 text-teal-500 checked:bg-teal-500 hover:checked:bg-teal-400 focus:ring-1 focus:ring-teal-500/50 cursor-pointer accent-teal-500 transition-all focus:outline-none focus:ring-offset-0 shrink-0"
                        />
                        <span>SYSTEM CONFIGURATION</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-[10px] text-teal-500">
                        <input
                          type="checkbox"
                          checked={newAdminForm.permissions.canManageAdmins}
                          onChange={(e) => setNewAdminForm(p => ({
                            ...p,
                            permissions: { ...p.permissions, canManageAdmins: e.target.checked }
                          }))}
                          className="w-4 h-4 rounded border-slate-705 bg-slate-900 text-teal-500 checked:bg-teal-500 hover:checked:bg-teal-400 focus:ring-1 focus:ring-teal-500/50 cursor-pointer accent-teal-500 transition-all focus:outline-none focus:ring-offset-0 shrink-0"
                        />
                        <span className="flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" /> SECURITY MGMT CLEARANCE?
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingAdmin(false)}
                      className="px-4 py-2 text-[10px] font-mono tracking-widest uppercase border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
                    >
                      ABORT DEPLOYMENT
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingAdmin}
                      className="px-5 py-2 text-[10px] font-mono font-bold tracking-widest uppercase bg-teal-500 text-slate-950 rounded-lg active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingAdmin ? 'PROVISIONING...' : 'PROVISION ACCOUNT CLEARANCE'}
                    </button>
                  </div>

                </form>
              </motion.div>
            )}

            {adminsList.length === 0 ? (
              <div className="text-center py-10 font-sans text-slate-405">
                No secondary administrators configured on this terminal.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs min-w-[700px]">
                  <thead>
                    <tr className={`border-b border-inherit text-[10px] font-mono font-black tracking-wider ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      <th className="pb-3.5 uppercase">ADMIN IDENTITY</th>
                      <th className="pb-3.5 uppercase">CODENAME</th>
                      <th className="pb-3.5 uppercase">COMMUNICATION LINK</th>
                      <th className="pb-3.5 uppercase">CLEARANCE PRIVILEGES</th>
                      <th className="pb-3.5 uppercase text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inherit">
                    {adminsList.map((admin) => (
                      <React.Fragment key={admin.id}>
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-colors">
                          <td className="py-3 font-bold">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center font-bold text-teal-400">
                                {admin.profilePhoto ? (
                                  <img src={admin.profilePhoto} alt={admin.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  (admin.fullName || admin.username).charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className={isDarkMode ? 'text-slate-200' : 'text-slate-900 font-extrabold'}>{admin.fullName || 'Admin User'}</span>
                                <span className="text-[9px] font-mono text-slate-400">ID: {admin.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 font-mono font-bold text-teal-600 dark:text-teal-400">{admin.username}</td>
                          <td className={`py-3 ${isDarkMode ? 'text-slate-350' : 'text-black font-semibold'}`}>{admin.email || '[None linked]'}</td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-1">
                              {admin.permissions.canManageAdmins && <span className="bg-rose-500/10 text-rose-500 border border-rose-500/15 font-mono text-[8px] px-1.5 py-0.5 rounded uppercase font-black">ADMINS</span>}
                              {admin.permissions.canManageContacts && <span className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/15 font-mono text-[8px] px-1.5 py-0.5 rounded font-bold">CONTACTS</span>}
                              {admin.permissions.canManageTemplates && <span className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/15 font-mono text-[8px] px-1.5 py-0.5 rounded font-bold">TEMPLATES</span>}
                              {admin.permissions.canManageCampaigns && <span className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/15 font-mono text-[8px] px-1.5 py-0.5 rounded font-bold">CAMPAIGNS</span>}
                              {admin.permissions.canManageSettings && <span className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/15 font-mono text-[8px] px-1.5 py-0.5 rounded font-bold">SETTINGS</span>}
                              {admin.permissions.canDeleteCampaigns && <span className="bg-rose-500/10 text-rose-500 border border-rose-500/15 font-mono text-[8px] px-1.5 py-0.5 rounded font-bold">CAMPAIGN_DELETION</span>}
                              {admin.permissions.canAccessLogs && <span className="bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/15 font-mono text-[8px] px-1.5 py-0.5 rounded font-bold">LOGS_ACCESS</span>}
                              {admin.permissions.canConfigureSystem && <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15 font-mono text-[8px] px-1.5 py-0.5 rounded font-bold">SYSTEM_CONFIG</span>}
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="inline-flex gap-1.5">
                              <button
                                disabled={admin.username === 'admin'}
                                onClick={() => handleEditClick(admin)}
                                className={`p-2 rounded bg-teal-500/10 border border-teal-500/25 text-teal-600 dark:text-teal-450 hover:bg-teal-500/20 transition-all ${
                                  admin.username === 'admin' ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer active:scale-95'
                                }`}
                                title="Edit administrative clearances matrix"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={admin.username === 'admin'}
                                onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                                className={`p-2 rounded bg-rose-500/10 border border-rose-500/25 text-rose-500 hover:bg-rose-500/20 transition-all ${
                                  admin.username === 'admin' ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer active:scale-95'
                                }`}
                                title="Retract administrator clearance"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {editingAdminId === admin.id && editingForm && (
                          <tr className={isDarkMode ? 'bg-slate-950/40' : 'bg-slate-50'}>
                            <td colSpan={5} className="py-4 px-4 border-2 border-dashed border-teal-500/30 rounded-xl">
                              <div className="space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b border-inherit">
                                  <span className={`text-[10px] font-mono font-bold uppercase ${
                                    isDarkMode ? 'text-teal-400' : 'text-slate-900 font-extrabold'
                                  }`}>
                                    RE-CONFIGURING CLEARANCE LEVEL AND PRIVILEGES: {admin.username}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingAdminId(null);
                                      setEditingForm(null);
                                    }}
                                    className={`font-mono text-[10px] uppercase font-bold ${
                                      isDarkMode ? 'text-slate-405 hover:text-slate-102' : 'text-slate-600 hover:text-black font-extrabold'
                                    }`}
                                  >
                                    ❌ CLOSE MATRIX
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <label className={`text-[10px] font-mono font-bold block uppercase ${
                                      isDarkMode ? 'text-slate-400' : 'text-slate-800'
                                    }`}>Full Identity Name</label>
                                    <input
                                      type="text"
                                      value={editingForm.fullName}
                                      onChange={(e) => setEditingForm(p => p ? { ...p, fullName: e.target.value } : null)}
                                      className={`w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs ${
                                        isDarkMode ? 'bg-slate-900 border-slate-850 text-slate-200' : 'bg-white border-slate-300 text-black font-extrabold'
                                      }`}
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className={`text-[10px] font-mono font-bold block uppercase ${
                                      isDarkMode ? 'text-slate-400' : 'text-slate-800'
                                    }`}>Communication Email</label>
                                    <input
                                      type="email"
                                      value={editingForm.email}
                                      onChange={(e) => setEditingForm(p => p ? { ...p, email: e.target.value } : null)}
                                      className={`w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs ${
                                        isDarkMode ? 'bg-slate-900 border-slate-850 text-slate-200' : 'bg-white border-slate-300 text-black font-extrabold'
                                      }`}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                  <label className={`text-[9px] font-mono font-bold block uppercase ${
                                    isDarkMode ? 'text-slate-400' : 'text-slate-800'
                                  }`}>
                                    PRIVILEGE CHECKS (PERMISSION MATRIX):
                                  </label>
                                  <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg border ${
                                    isDarkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-white border-slate-250 shadow-inner'
                                  }`}>
                                    <label className="flex items-center gap-2 cursor-pointer font-bold font-mono text-[10px] select-none text-slate-700 dark:text-slate-350">
                                      <input
                                        type="checkbox"
                                        checked={editingForm.permissions.canManageContacts}
                                        onChange={(e) => setEditingForm(p => p ? {
                                          ...p,
                                          permissions: { ...p.permissions, canManageContacts: e.target.checked }
                                        } : null)}
                                        className="w-4 h-4 rounded border-slate-705 bg-slate-900 text-teal-500 checked:bg-teal-500 hover:checked:bg-teal-400 focus:ring-1 focus:ring-teal-500/50 cursor-pointer accent-teal-500 transition-all focus:outline-none focus:ring-offset-0 shrink-0"
                                      />
                                      <span>CONTACTS</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer font-bold font-mono text-[10px] select-none text-slate-700 dark:text-slate-350">
                                      <input
                                        type="checkbox"
                                        checked={editingForm.permissions.canManageTemplates}
                                        onChange={(e) => setEditingForm(p => p ? {
                                          ...p,
                                          permissions: { ...p.permissions, canManageTemplates: e.target.checked }
                                        } : null)}
                                        className="w-4 h-4 rounded border-slate-705 bg-slate-900 text-teal-500 checked:bg-teal-500 hover:checked:bg-teal-400 focus:ring-1 focus:ring-teal-500/50 cursor-pointer accent-teal-500 transition-all focus:outline-none focus:ring-offset-0 shrink-0"
                                      />
                                      <span>TEMPLATES</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer font-bold font-mono text-[10px] select-none text-slate-700 dark:text-slate-350">
                                      <input
                                        type="checkbox"
                                        checked={editingForm.permissions.canManageCampaigns}
                                        onChange={(e) => setEditingForm(p => p ? {
                                          ...p,
                                          permissions: { ...p.permissions, canManageCampaigns: e.target.checked }
                                        } : null)}
                                        className="w-4 h-4 rounded border-slate-705 bg-slate-900 text-teal-500 checked:bg-teal-500 hover:checked:bg-teal-400 focus:ring-1 focus:ring-teal-500/50 cursor-pointer accent-teal-500 transition-all focus:outline-none focus:ring-offset-0 shrink-0"
                                      />
                                      <span>CAMPAIGNS</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer font-bold font-mono text-[10px] select-none text-slate-700 dark:text-slate-350">
                                      <input
                                        type="checkbox"
                                        checked={editingForm.permissions.canManageSettings}
                                        onChange={(e) => setEditingForm(p => p ? {
                                          ...p,
                                          permissions: { ...p.permissions, canManageSettings: e.target.checked }
                                        } : null)}
                                        className="w-4 h-4 rounded border-slate-705 bg-slate-900 text-teal-500 checked:bg-teal-500 hover:checked:bg-teal-400 focus:ring-1 focus:ring-teal-500/50 cursor-pointer accent-teal-500 transition-all focus:outline-none focus:ring-offset-0 shrink-0"
                                      />
                                      <span>SETTINGS</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer font-bold font-mono text-[10px] select-none text-teal-500">
                                      <input
                                        type="checkbox"
                                        checked={editingForm.permissions.canManageAdmins}
                                        onChange={(e) => setEditingForm(p => p ? {
                                          ...p,
                                          permissions: { ...p.permissions, canManageAdmins: e.target.checked }
                                        } : null)}
                                        className="w-4 h-4 rounded border-slate-705 bg-slate-900 text-teal-500 checked:bg-teal-500 hover:checked:bg-teal-400 focus:ring-1 focus:ring-teal-500/50 cursor-pointer accent-teal-500 transition-all focus:outline-none focus:ring-offset-0 shrink-0"
                                      />
                                      <span>SECURITY MGMT</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer font-bold font-mono text-[10px] select-none text-rose-500">
                                      <input
                                        type="checkbox"
                                        checked={editingForm.permissions.canDeleteCampaigns}
                                        onChange={(e) => setEditingForm(p => p ? {
                                          ...p,
                                          permissions: { ...p.permissions, canDeleteCampaigns: e.target.checked }
                                        } : null)}
                                        className="w-4 h-4 rounded border-slate-705 bg-slate-900 text-rose-500 checked:bg-teal-500 hover:checked:bg-teal-400 focus:ring-1 focus:ring-teal-500/50 cursor-pointer accent-teal-500 transition-all focus:outline-none focus:ring-offset-0 shrink-0"
                                      />
                                      <span>CAMPAIGN DELETION</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer font-bold font-mono text-[10px] select-none text-amber-500">
                                      <input
                                        type="checkbox"
                                        checked={editingForm.permissions.canAccessLogs}
                                        onChange={(e) => setEditingForm(p => p ? {
                                          ...p,
                                          permissions: { ...p.permissions, canAccessLogs: e.target.checked }
                                        } : null)}
                                        className="w-4 h-4 rounded border-slate-705 bg-slate-900 text-amber-500 checked:bg-teal-500 hover:checked:bg-teal-400 focus:ring-1 focus:ring-teal-500/50 cursor-pointer accent-teal-500 transition-all focus:outline-none focus:ring-offset-0 shrink-0"
                                      />
                                      <span>LOGS ACCESS</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer font-bold font-mono text-[10px] select-none text-blue-500">
                                      <input
                                        type="checkbox"
                                        checked={editingForm.permissions.canConfigureSystem}
                                        onChange={(e) => setEditingForm(p => p ? {
                                          ...p,
                                          permissions: { ...p.permissions, canConfigureSystem: e.target.checked }
                                        } : null)}
                                        className="w-4 h-4 rounded border-slate-705 bg-slate-900 text-blue-500 checked:bg-teal-500 hover:checked:bg-teal-400 focus:ring-1 focus:ring-teal-500/50 cursor-pointer accent-teal-500 transition-all focus:outline-none focus:ring-offset-0 shrink-0"
                                      />
                                      <span>SYSTEM CONFIG</span>
                                    </label>
                                  </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingAdminId(null);
                                      setEditingForm(null);
                                    }}
                                    className={`px-4 py-2 text-[10px] font-mono tracking-widest uppercase border rounded-lg cursor-pointer ${
                                      isDarkMode ? 'border-slate-800 text-slate-400 hover:text-slate-200' : 'border-slate-300 text-slate-600 hover:text-black font-extrabold hover:bg-slate-100'
                                    }`}
                                  >
                                    CANCEL
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isUpdatingAdminPermission}
                                    onClick={() => handleUpdateAdminPermissionsSubmit(admin.id, admin.username)}
                                    className="px-5 py-2 text-[10px] font-mono font-bold tracking-widest uppercase bg-teal-500 text-slate-950 rounded-lg active:scale-95 transition-all disabled:opacity-50 cursor-pointer font-black"
                                  >
                                    {isUpdatingAdminPermission ? 'SAVING...' : 'COMMIT CHANGES'}
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
