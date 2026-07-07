'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Building, 
  Settings as SettingsIcon, 
  Sparkles, 
  Mail, 
  Globe, 
  Palette, 
  Clock, 
  Languages, 
  Save, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SettingsDashboard() {
  const { company, updateCompany, showToast } = useApp();

  // Settings State variables
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [aiTone, setAiTone] = useState('helpful');
  const [primaryColor, setPrimaryColor] = useState('#8B5CF6');
  const [secondaryColor, setSecondaryColor] = useState('#3B82F6');
  
  // Hours
  const [startHour, setStartHour] = useState('09:00');
  const [endHour, setEndHour] = useState('17:00');
  
  // Industry
  const [industry, setIndustry] = useState('Customer Support');

  // Languages state
  const [languages, setLanguages] = useState<string[]>(['en']);

  // Actions states
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (company) {
      setCompanyName(company.name || '');
      setDomain(company.domain || '');
      setSupportEmail(company.support_email || '');
      setAiTone(company.ai_tone || 'helpful');
      
      const colors = company.brand_colors as any;
      if (colors) {
        setPrimaryColor(colors.primary || '#8B5CF6');
        setSecondaryColor(colors.secondary || '#3B82F6');
      }

      const hours = company.business_hours as any;
      if (hours) {
        setStartHour(hours.start || '09:00');
        setEndHour(hours.end || '17:00');
      }

      setIndustry(company.industry || 'Customer Support');
    }
  }, [company]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setSaving(true);
    setSuccess(false);
    setError(null);

    const payload = {
      name: companyName,
      domain,
      support_email: supportEmail,
      ai_tone: aiTone,
      brand_colors: {
        primary: primaryColor,
        secondary: secondaryColor,
        background: '#0B0F19'
      },
      business_hours: {
        start: startHour,
        end: endHour
      },
      industry,
      languages
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to update company profile');
      }

      // Success
      updateCompany(resData.company);
      setSuccess(true);
      showToast('Settings saved successfully!', 'success');
      
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: [primaryColor, secondaryColor]
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: [primaryColor, secondaryColor]
      });

      // Clear alert after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not update configurations.');
      showToast(err.message || 'Failed to update configurations', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageToggle = (langCode: string) => {
    setLanguages(prev => {
      const updated = prev.includes(langCode) 
        ? prev.filter(l => l !== langCode) 
        : [...prev, langCode];
      showToast(`Updated languages: ${updated.join(', ').toUpperCase()}`, 'info');
      return updated;
    });
  };

  const colorPresets = [
    { name: 'Purple Neon (Default)', primary: '#8B5CF6', secondary: '#3B82F6' },
    { name: 'Emerald Spark', primary: '#10B981', secondary: '#059669' },
    { name: 'Ocean Wave', primary: '#0ea5e9', secondary: '#2563eb' },
    { name: 'Sunset Glow', primary: '#f97316', secondary: '#dc2626' }
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Employee Settings</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">System Settings</h1>
        <p className="text-sm text-gray-400">Configure your company parameters, operating schedules, brand styles, and the tone of your AI support employee.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Row 1: Profile & Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Company Details */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-white text-md flex items-center gap-2">
              <Building className="w-4 h-4 text-violet-400" />
              <span>Company Profile</span>
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1 block">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-violet-500/50 text-white"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1 block">Support Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-violet-500/50 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1 block">Website Domain</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-violet-500/50 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1 block">Industry Vertical</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl text-xs px-3.5 py-2 text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="Customer Support">Customer Support</option>
                  <option value="Legal">Legal</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Sales">Sales</option>
                  <option value="Retail">Retail</option>
                </select>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-white text-md flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" />
              <span>Business Operating Hours</span>
            </h2>
            <p className="text-xs text-gray-400">Define hours when support agents are available for escalated tickets.</p>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1 block">Start Time</label>
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl text-xs px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="08:00">08:00 AM</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1 block">End Time</label>
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl text-xs px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="17:00">05:00 PM</option>
                  <option value="18:00">06:00 PM</option>
                  <option value="20:00">08:00 PM</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
              <p className="text-[11px] text-gray-400 leading-relaxed">
                * SupportAI runs **24/7/365**. It resolves customer questions automatically at all times using uploaded knowledge. Business hours dictate agent escalation targets.
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: AI Tone & Brand Palette */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* AI Employee Tone Settings */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-white text-md flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-violet-400" />
              <span>AI Employee Tone</span>
            </h2>
            <p className="text-xs text-gray-400">Customize how SupportAI speaks with customers. Change active prompts immediately.</p>
            
            <div className="space-y-3 pt-2">
              {[
                { id: 'helpful', name: 'Helpful & Professional', desc: 'Authoritative, polite, clear, and focused on resolution.' },
                { id: 'empathetic', name: 'Empathetic & Caring', desc: 'Patient, warm, highly supportive, expressing understanding.' },
                { id: 'technical', name: 'Detailed & Technical', desc: 'Direct, utilizing exact specs, avoiding flowery summaries.' },
                { id: 'playful', name: 'Playful & Friendly', desc: 'Casual, enthusiastic, conversational, and lighthearted.' }
              ].map(t => (
                <label 
                  key={t.id}
                  className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all duration-200 ${
                    aiTone === t.id 
                      ? 'bg-violet-600/10 border-violet-500/35 text-white' 
                      : 'bg-transparent border-white/5 hover:bg-white/5 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="ai_tone"
                    value={t.id}
                    checked={aiTone === t.id}
                    onChange={() => setAiTone(t.id)}
                    className="mt-1 accent-violet-500"
                  />
                  <div className="text-left">
                    <span className="text-xs font-bold block">{t.name}</span>
                    <span className="text-[10px] text-gray-500 block mt-0.5 leading-relaxed">{t.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Color Palette settings */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-white text-md flex items-center gap-2">
              <Palette className="w-4 h-4 text-violet-400" />
              <span>Branding Styles</span>
            </h2>
            <p className="text-xs text-gray-400">Match the dashboard colors to your business presets.</p>
            
            <div className="grid grid-cols-1 gap-2.5 pt-2">
              {colorPresets.map((preset) => {
                const isActive = primaryColor === preset.primary;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setPrimaryColor(preset.primary);
                      setSecondaryColor(preset.secondary);
                    }}
                    className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all duration-200 ${
                      isActive 
                        ? 'bg-white/5 border-violet-500/40 text-white' 
                        : 'bg-transparent border-white/5 hover:bg-white/5 text-gray-400'
                    }`}
                  >
                    <span className="text-xs font-semibold">{preset.name}</span>
                    <div className="flex gap-1.5">
                      <span className="w-4 h-4 rounded-full border border-black/50" style={{ backgroundColor: preset.primary }} />
                      <span className="w-4 h-4 rounded-full border border-black/50" style={{ backgroundColor: preset.secondary }} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Language switches */}
            <div className="pt-4 border-t border-white/5 space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Languages className="w-4 h-4 text-violet-400" />
                <span>Languages Supported</span>
              </h3>
              <div className="flex gap-2">
                {[
                  { code: 'en', name: 'English' },
                  { code: 'es', name: 'Español' },
                  { code: 'fr', name: 'Français' },
                  { code: 'de', name: 'Deutsch' }
                ].map(l => {
                  const active = languages.includes(l.code);
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => handleLanguageToggle(l.code)}
                      className={`text-xs px-3 py-1.5 border rounded-xl transition-all cursor-pointer ${
                        active 
                          ? 'bg-violet-600/10 border-violet-500/20 text-violet-400 font-bold' 
                          : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {l.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts and Submit button */}
        <div className="flex flex-col gap-4">
          {error && (
            <div className="flex items-start gap-2.5 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs animate-fade-in">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Settings updated and synchronized successfully! AI agent tone updated.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 active:from-violet-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-violet-600/20 w-fit px-8 text-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Configurations...' : 'Save Settings'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
