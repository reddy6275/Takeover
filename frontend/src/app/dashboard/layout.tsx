'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import { useApp } from '@/context/AppContext';
import { Sparkles, RefreshCw, AlertCircle, Scale, Factory, Briefcase, MessageSquareCode, ShoppingBag } from 'lucide-react';

const FloatingNodes = dynamic(() => import('@/components/3d/FloatingNodes'), { ssr: false });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { company, updateCompany, isLoading, error, bootstrap, showToast } = useApp();
  const [selectedIndustry, setSelectedIndustry] = useState<'Legal' | 'Manufacturing' | 'Sales' | 'Customer Support' | 'Retail'>('Customer Support');
  const [saving, setSaving] = useState(false);

  const handleOnboard = async () => {
    if (!company) return;
    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: selectedIndustry })
      });
      if (response.ok) {
        const data = await response.json();
        updateCompany(data.company);
        showToast(`AI Employee initialized for ${selectedIndustry}!`, 'success');
      } else {
        showToast('Failed to initialize industry vertical', 'error');
      }
    } catch (err) {
      console.error('Error during industry onboarding:', err);
      showToast('Connection to server failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative" style={{ background: 'var(--bg-main)' }}>
        <FloatingNodes />
        <div className="glass-card flex flex-col items-center text-center relative z-10" style={{ padding: '40px', maxWidth: '380px', width: '100%' }}>
          <div className="logo-icon" style={{ width: '56px', height: '56px', borderRadius: '16px', marginBottom: '24px' }}>
            <Sparkles style={{ width: '28px', height: '28px' }} />
          </div>
          <h2 className="font-bold text-white mb-2" style={{ fontSize: '1.25rem' }}>Hiring AI Employee...</h2>
          <p className="text-sm text-muted mb-6">SupportAI is initializing database schemas and syncing company details.</p>
          <div className="flex items-center gap-2 text-primary font-bold text-xs">
            <RefreshCw className="animate-spin-slow" style={{ width: '16px', height: '16px' }} />
            <span>Establishing connection...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative" style={{ background: 'var(--bg-main)', padding: '24px' }}>
        <div className="glass-card flex flex-col items-center text-center relative z-10" style={{ padding: '40px', maxWidth: '420px', width: '100%', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(244, 63, 94, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid rgba(244, 63, 94, 0.25)', color: '#fb7185' }}>
            <AlertCircle style={{ width: '28px', height: '28px' }} />
          </div>
          <h2 className="font-bold text-white mb-2" style={{ fontSize: '1.25rem' }}>Backend Connection Failed</h2>
          <p className="text-sm text-muted mb-6">
            Could not connect to the SupportAI backend server. Ensure the server is running at <code style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: '#fb7185' }}>http://localhost:3001</code>.
          </p>
          <button
            onClick={bootstrap}
            className="btn btn-primary w-full"
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  // Requiring industry selection (Onboarding Flow)
  if (company && !company.industry) {
    const industries = [
      { id: 'Customer Support' as const, name: 'Customer Support', desc: 'General FAQs, complaints, order tracking, refunds', icon: MessageSquareCode, color: '#8B5CF6' },
      { id: 'Legal' as const, name: 'Legal', desc: 'Consultations, contract FAQ, policies compliance', icon: Scale, color: '#D97706' },
      { id: 'Manufacturing' as const, name: 'Manufacturing', desc: 'SOPs, product manuals, maintenance, inventory', icon: Factory, color: '#06B6D4' },
      { id: 'Sales' as const, name: 'Sales', desc: 'Lead qualification, quotes, pricing comparison', icon: Briefcase, color: '#EC4899' },
      { id: 'Retail' as const, name: 'Retail', desc: 'Product search, shipping, returns, loyalty program', icon: ShoppingBag, color: '#10B981' }
    ];

    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative" style={{ background: 'var(--bg-main)', padding: '24px' }}>
        <FloatingNodes />
        <div className="glass-card flex flex-col relative z-10" style={{ padding: '40px', maxWidth: '640px', width: '100%' }}>
          <div className="logo-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', marginBottom: '24px' }}>
            <Sparkles style={{ width: '24px', height: '24px' }} />
          </div>
          <h2 className="font-bold text-white mb-2" style={{ fontSize: '1.5rem' }}>Select Platform Industry</h2>
          <p className="text-sm text-muted mb-6">
            Configure your AI employee domain. This sets grounded system prompt templates, dashboard analytics widgets, and FAQ routes.
          </p>
          
          <div className="grid grid-2 gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {industries.map((ind) => {
              const Icon = ind.icon;
              const isSelected = selectedIndustry === ind.id;
              return (
                <div
                  key={ind.id}
                  onClick={() => setSelectedIndustry(ind.id)}
                  className="glass-card flex items-start gap-3 cursor-pointer"
                  style={{
                    padding: '16px',
                    borderColor: isSelected ? ind.color : 'var(--border-color)',
                    background: isSelected ? `${ind.color}0a` : 'var(--bg-card)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isSelected ? `${ind.color}15` : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSelected ? ind.color : 'var(--text-muted)',
                    flexShrink: 0
                  }}>
                    <Icon style={{ width: '18px', height: '18px' }} />
                  </div>
                  <div className="text-left" style={{ minWidth: 0 }}>
                    <span className="text-xs font-bold text-white block">{ind.name}</span>
                    <span className="text-[10px] text-gray-500 block leading-tight mt-1">{ind.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleOnboard}
            disabled={saving}
            className="btn btn-primary w-full py-3"
            style={{ borderRadius: '12px' }}
          >
            {saving ? 'Initializing Industry Templates...' : 'Launch AI Employee'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="main-content">
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
