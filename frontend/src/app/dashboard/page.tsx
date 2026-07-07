'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  MessageSquare, 
  Clock, 
  Smile, 
  TrendingUp, 
  AlertTriangle, 
  ChevronRight, 
  ArrowUpRight,
  Scale,
  Factory,
  Briefcase,
  ShoppingBag,
  DollarSign,
  Users,
  Percent,
  FileText,
  Activity,
  Star,
  Package,
  RotateCcw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface AnalyticsData {
  industry?: string;
  industrySpecific?: any;
  summary: {
    todayChats: number;
    resolvedChats: number;
    pendingChats: number;
    averageResponseTime: string;
    customerSatisfaction: string;
    aiAccuracy: string;
    resolutionRate: string;
    totalTickets: number;
    resolvedTickets: number;
  };
  charts: {
    chatsTrend: { date: string; count: number }[];
    responseTime: { time: string; minutes: number }[];
    sentiment: { name: string; value: number; color: string }[];
  };
  recentConversations: any[];
  recentTickets: any[];
  topQuestions: { question: string; count: number; matchRate: string }[];
  knowledgeGaps: { topic: string; count: number; priority: string }[];
}

export default function Dashboard() {
  const { company } = useApp();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null!);

  const fetchAnalytics = async () => {
    if (!company) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/analytics?company_id=${company.id}`);
      if (response.ok) {
        const resJson = await response.json();
        setData(resJson);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [company]);

  useGSAP(() => {
    if (!loading && data && containerRef.current) {
      // Animate KPI Cards staggering in
      const kpis = containerRef.current.querySelectorAll('.kpi-card');
      gsap.fromTo(
        kpis,
        { opacity: 0, y: 25, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      );

      // Animate chart cards
      const charts = containerRef.current.querySelectorAll('.chart-card');
      gsap.fromTo(
        charts,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.15, delay: 0.2, ease: 'power3.out' }
      );
    }
  }, [loading, data]);

  if (loading || !data) {
    return (
      <div className="flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="shimmer-bar" style={{ height: '32px', width: '260px', borderRadius: '8px', marginBottom: '8px' }} />
            <div className="shimmer-bar" style={{ height: '16px', width: '380px', borderRadius: '6px' }} />
          </div>
          <div className="shimmer-bar" style={{ height: '40px', width: '160px', borderRadius: '12px' }} />
        </div>
        
        <div className="kpi-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card shimmer-bar" style={{ height: '130px' }} />
          ))}
        </div>

        <div className="charts-row">
          <div className="glass-card shimmer-bar" style={{ height: '340px' }} />
          <div className="glass-card shimmer-bar" style={{ height: '340px' }} />
        </div>
      </div>
    );
  }

  const { summary, charts, recentTickets, topQuestions, industry, industrySpecific } = data;
  const activeIndustry = industry || 'Customer Support';

  // Get active industry color and icon
  const getIndustryConfig = () => {
    switch (activeIndustry) {
      case 'Legal':
        return { color: '#D97706', label: 'Legal Operations', icon: Scale };
      case 'Manufacturing':
        return { color: '#06B6D4', label: 'Plant & SOP Management', icon: Factory };
      case 'Sales':
        return { color: '#EC4899', label: 'Sales & Conversion Pipeline', icon: Briefcase };
      case 'Retail':
        return { color: '#10B981', label: 'E-commerce & Storefront', icon: ShoppingBag };
      default:
        return { color: '#8B5CF6', label: 'Operational Summary', icon: MessageSquare };
    }
  };

  const indConfig = getIndustryConfig();
  const IndIcon = indConfig.icon;

  return (
    <div ref={containerRef} className="flex-col gap-8">
      {/* Top Banner / Header */}
      <div className="dashboard-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <IndIcon style={{ width: '18px', height: '18px', color: indConfig.color }} />
            <span className="font-bold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: indConfig.color }}>
              {indConfig.label}
            </span>
          </div>
          <h1 className="font-extrabold text-white" style={{ fontSize: '2rem', letterSpacing: '-0.02em' }}>
            {activeIndustry} AI Portal
          </h1>
          <p className="text-sm text-muted mt-1">
            Dynamic grounded analytics and document RAG metrics for {company?.name || 'your company'}.
          </p>
        </div>

        <div className="flex gap-3">
          <span className="badge font-bold" style={{ border: `1px solid ${indConfig.color}40`, background: `${indConfig.color}12`, color: indConfig.color }}>
            Industry: {activeIndustry}
          </span>
          <Link href="/dashboard/chat" className="btn btn-primary" style={{ background: `linear-gradient(135deg, ${indConfig.color} 0%, #3B82F6 100%)` }}>
            <span>Open Chat Workspace</span>
            <ArrowUpRight style={{ width: '16px', height: '16px' }} />
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-grid">
        {activeIndustry === 'Legal' && (
          <>
            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: `radial-gradient(circle, ${indConfig.color}25 0%, transparent 70%)` }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: `${indConfig.color}12`, border: `1px solid ${indConfig.color}25`, color: indConfig.color }}>
                  <Scale style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="badge badge-primary">Active</span>
              </div>
              <p className="text-sm font-bold text-muted">Active Consultations</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>{summary.todayChats}</span>
                <span className="text-xs text-dim">threads</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)' }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399' }}>
                  <Users style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="text-xs text-muted">Meeting requests</span>
              </div>
              <p className="text-sm font-bold text-muted">Consultation Bookings</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>{industrySpecific?.consultationRequests || 14}</span>
                <span className="text-xs text-emerald font-bold">100% Assigned</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)' }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#60a5fa' }}>
                  <FileText style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="badge badge-emerald">Compliance</span>
              </div>
              <p className="text-sm font-bold text-muted">Legally Compliant RAG</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>98.2%</span>
                <span className="text-xs text-dim">hallucination free</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, transparent 70%)' }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fb7185' }}>
                  <AlertTriangle style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="text-xs text-muted">Requires partner review</span>
              </div>
              <p className="text-sm font-bold text-muted">Open Contract Disputes</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>{summary.pendingChats}</span>
                <span className="text-xs text-rose font-bold">High Priority</span>
              </div>
            </div>
          </>
        )}

        {activeIndustry === 'Manufacturing' && (
          <>
            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: `radial-gradient(circle, ${indConfig.color}25 0%, transparent 70%)` }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: `${indConfig.color}12`, border: `1px solid ${indConfig.color}25`, color: indConfig.color }}>
                  <Activity style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="badge badge-emerald">Optimal</span>
              </div>
              <p className="text-sm font-bold text-muted">System Operations</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>99.8%</span>
                <span className="text-xs text-dim">uptime logs</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)' }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#fbbf24' }}>
                  <AlertTriangle style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="text-xs text-muted">Needs operator dispatch</span>
              </div>
              <p className="text-sm font-bold text-muted">Open Maintenance Requests</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>{industrySpecific?.equipmentIssues || 6}</span>
                <span className="text-xs text-amber font-bold">2 Critical</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)' }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#60a5fa' }}>
                  <FileText style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="text-xs text-muted">SOP document count</span>
              </div>
              <p className="text-sm font-bold text-muted">Machine Manuals RAG</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>{summary.todayChats}</span>
                <span className="text-xs text-dim">active manuals</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)' }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399' }}>
                  <Smile style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="badge badge-primary">Warranty</span>
              </div>
              <p className="text-sm font-bold text-muted">Warranty Claims Active</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>{industrySpecific?.warrantyClaims || 11}</span>
                <span className="text-xs text-dim">claims filed</span>
              </div>
            </div>
          </>
        )}

        {activeIndustry === 'Sales' && (
          <>
            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: `radial-gradient(circle, ${indConfig.color}25 0%, transparent 70%)` }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: `${indConfig.color}12`, border: `1px solid ${indConfig.color}25`, color: indConfig.color }}>
                  <Users style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="badge badge-emerald">+18% MoM</span>
              </div>
              <p className="text-sm font-bold text-muted">Qualified Leads Ingested</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>48</span>
                <span className="text-xs text-dim">active prospects</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)' }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399' }}>
                  <Percent style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="text-xs text-muted">Average rate</span>
              </div>
              <p className="text-sm font-bold text-muted">Lead Conversion Rate</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>25%</span>
                <span className="text-xs text-emerald font-bold">High intent</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)' }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#60a5fa' }}>
                  <DollarSign style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="badge badge-primary">ARR Pipeline</span>
              </div>
              <p className="text-sm font-bold text-muted">Pipeline Revenue</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>$31,300</span>
                <span className="text-xs text-dim">in negotation</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)' }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#fbbf24' }}>
                  <FileText style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="text-xs text-muted">Grounded pricing</span>
              </div>
              <p className="text-sm font-bold text-muted">Quotes Generated By AI</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>28</span>
                <span className="text-xs text-dim">quotations compiled</span>
              </div>
            </div>
          </>
        )}

        {activeIndustry === 'Retail' && (
          <>
            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: `radial-gradient(circle, ${indConfig.color}25 0%, transparent 70%)` }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: `${indConfig.color}12`, border: `1px solid ${indConfig.color}25`, color: indConfig.color }}>
                  <Package style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="badge badge-emerald">Active</span>
              </div>
              <p className="text-sm font-bold text-muted">Total Orders Processed</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>324</span>
                <span className="text-xs text-dim">orders</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, transparent 70%)' }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fb7185' }}>
                  <RotateCcw className="w-5 h-5 text-rose-400" style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="text-xs text-muted">Returns rate</span>
              </div>
              <p className="text-sm font-bold text-muted">Returns Processed</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>18</span>
                <span className="text-xs text-dim">returns handled</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)' }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#60a5fa' }}>
                  <Star style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="badge badge-primary">Loyalty</span>
              </div>
              <p className="text-sm font-bold text-muted">Customer Reviews Rating</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>88%</span>
                <span className="text-xs text-dim">positive rating</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)' }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#fbbf24' }}>
                  <Package style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="text-xs text-muted">Grounded catalogs</span>
              </div>
              <p className="text-sm font-bold text-muted">Popular Stock Units</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>45</span>
                <span className="text-xs text-dim">units velvet summer dress</span>
              </div>
            </div>
          </>
        )}

        {activeIndustry === 'Customer Support' && (
          <>
            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)' }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.25)', color: '#c084fc' }}>
                  <MessageSquare style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="badge badge-emerald">
                  <TrendingUp style={{ width: '12px', height: '12px' }} />
                  <span>+12%</span>
                </span>
              </div>
              <p className="text-sm font-bold text-muted">Today's Chat Sessions</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>{summary.todayChats}</span>
                <span className="text-xs text-dim">sessions</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)' }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399' }}>
                  <Smile style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="text-xs text-muted">Customer feedback</span>
              </div>
              <p className="text-sm font-bold text-muted">AI Accuracy Rating</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>{summary.aiAccuracy}</span>
                <span className="text-xs text-emerald font-bold">{summary.customerSatisfaction}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)' }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#60a5fa' }}>
                  <Clock style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="badge badge-emerald">99.8% SLA</span>
              </div>
              <p className="text-sm font-bold text-muted">Avg Response Time</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>{summary.averageResponseTime}</span>
                <span className="text-xs text-dim">seconds avg</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-glow-orb" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)' }} />
              <div className="kpi-top">
                <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#fbbf24' }}>
                  <AlertTriangle style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="text-xs text-muted">Needs agent review</span>
              </div>
              <p className="text-sm font-bold text-muted">Open Support Tickets</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-extrabold text-white" style={{ fontSize: '2rem' }}>{summary.pendingChats}</span>
                <span className="text-xs text-amber font-bold">{summary.resolutionRate} resolved</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="charts-row">
        {/* Industry specific primary chart */}
        <div className="glass-card chart-card">
          <div className="mb-6">
            <h2 className="font-bold text-white" style={{ fontSize: '1.125rem' }}>
              {activeIndustry === 'Sales' ? 'ARR Growth Funnel Trends' : 'AI Request Ingestion Volume'}
            </h2>
            <p className="text-xs text-muted">
              {activeIndustry === 'Sales' ? 'Revenue generated through automated quote closures.' : 'Inbound system queries handled in real-time by SupportAI.'}
            </p>
          </div>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              {activeIndustry === 'Sales' ? (
                <BarChart data={industrySpecific?.revenueTrends || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d1224', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    labelStyle={{ fontWeight: 'bold', color: indConfig.color }}
                  />
                  <Bar dataKey="amount" fill={indConfig.color} radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={charts.chatsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={indConfig.color} stopOpacity={0.35}/>
                      <stop offset="95%" stopColor={indConfig.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d1224', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    labelStyle={{ fontWeight: 'bold', color: indConfig.color }}
                  />
                  <Area type="monotone" dataKey="count" stroke={indConfig.color} strokeWidth={3} fillOpacity={1} fill="url(#chartGradient)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Industry Context List Widget */}
        <div className="glass-card chart-card">
          {activeIndustry === 'Legal' && (
            <>
              <div className="mb-6">
                <h2 className="font-bold text-white" style={{ fontSize: '1.125rem' }}>Most Searched Contracts</h2>
                <p className="text-xs text-muted">Legal documents queried by grounded users.</p>
              </div>
              <div className="flex-col gap-2">
                {(industrySpecific?.searchedContracts || []).map((contract: any, index: number) => (
                  <div key={index} className="list-row" style={{ padding: '12px' }}>
                    <div style={{ minWidth: 0 }}>
                      <span className="text-xs font-bold text-white block truncate">{contract.name}</span>
                      <span className="text-[10px] text-gray-500">Searched for contract RAG compliance</span>
                    </div>
                    <span className="badge font-bold text-[10px]" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#D97706', borderColor: 'rgba(217, 119, 6, 0.2)' }}>
                      {contract.count} hits
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeIndustry === 'Manufacturing' && (
            <>
              <div className="mb-6">
                <h2 className="font-bold text-white" style={{ fontSize: '1.125rem' }}>Active Equipment Manuals</h2>
                <p className="text-xs text-muted">Calibration files currently parsed into embeddings.</p>
              </div>
              <div className="flex-col gap-2">
                {(industrySpecific?.machineManuals || []).map((manual: any, index: number) => (
                  <div key={index} className="list-row" style={{ padding: '12px' }}>
                    <div style={{ minWidth: 0 }}>
                      <span className="text-xs font-bold text-white block truncate">{manual.name}</span>
                      <span className="text-[10px] text-gray-500">pgvector grounded segments ready</span>
                    </div>
                    <span className="badge font-bold text-[10px]" style={{
                      background: manual.status === 'Optimal' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: manual.status === 'Optimal' ? '#10B981' : '#F59E0B',
                      borderColor: manual.status === 'Optimal' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'
                    }}>
                      {manual.status}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeIndustry === 'Sales' && (
            <>
              <div className="mb-6">
                <h2 className="font-bold text-white" style={{ fontSize: '1.125rem' }}>Lead Conversion Funnel</h2>
                <p className="text-xs text-muted">Prospect counts at each pipeline stage.</p>
              </div>
              <div className="flex-col gap-2">
                {(industrySpecific?.leadFunnel || []).map((funnel: any, index: number) => (
                  <div key={index} className="list-row" style={{ padding: '10px 12px' }}>
                    <span className="text-xs font-bold text-white">{funnel.stage}</span>
                    <span className="badge font-bold text-[10px]" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#EC4899', borderColor: 'rgba(236, 72, 153, 0.2)' }}>
                      {funnel.count} prospects
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeIndustry === 'Retail' && (
            <>
              <div className="mb-6">
                <h2 className="font-bold text-white" style={{ fontSize: '1.125rem' }}>Popular Products Stock</h2>
                <p className="text-xs text-muted">Live inventory matching search queries.</p>
              </div>
              <div className="flex-col gap-2">
                {(industrySpecific?.popularProducts || []).map((prod: any, index: number) => (
                  <div key={index} className="list-row" style={{ padding: '12px' }}>
                    <div style={{ minWidth: 0 }}>
                      <span className="text-xs font-bold text-white block truncate">{prod.name}</span>
                      <span className="text-[10px] text-gray-500">{prod.sales} sales this week</span>
                    </div>
                    <span className="badge font-bold text-[10px]" style={{
                      background: prod.stock > 10 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: prod.stock > 10 ? '#10B981' : '#fb7185',
                      borderColor: prod.stock > 10 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                    }}>
                      {prod.stock} left
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeIndustry === 'Customer Support' && (
            <>
              <div className="mb-6">
                <h2 className="font-bold text-white" style={{ fontSize: '1.125rem' }}>Sentiment Distribution</h2>
                <p className="text-xs text-muted">Customer emotion classification metrics.</p>
              </div>
              <div className="grid grid-1" style={{ gap: '8px' }}>
                {charts.sentiment.map((s) => (
                  <div key={s.name} className="flex items-center justify-between p-2.5 bg-white/5 border border-white/5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 }} />
                      <span className="text-xs text-white font-bold">{s.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-400">{s.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Content Grid */}
      <div className="bottom-row">
        {/* Recent Escalations / Tickets */}
        <div className="glass-card chart-card">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-bold text-white" style={{ fontSize: '1.125rem' }}>
                {activeIndustry === 'Manufacturing' ? 'Equipment Maintenance Requests' : activeIndustry === 'Sales' ? 'Sales Pipeline Tickets' : 'Active Escalations'}
              </h2>
              <p className="text-xs text-muted">Tickets generated due to low AI confidence on questions.</p>
            </div>
            <Link href="/dashboard/tickets" className="text-xs font-bold hover:text-white flex items-center gap-1" style={{ color: indConfig.color }}>
              <span>View all tickets</span>
              <ChevronRight style={{ width: '14px', height: '14px' }} />
            </Link>
          </div>
          
          <div className="flex-col gap-2">
            {recentTickets.length === 0 ? (
              <div className="text-center py-8 text-sm text-dim">No active tickets. AI is answering 100% of queries.</div>
            ) : (
              recentTickets.map((ticket) => {
                const priorityClass: Record<string, string> = {
                  critical: 'badge-rose',
                  high: 'badge-amber',
                  medium: 'badge-primary',
                  low: 'badge-emerald'
                };
                return (
                  <div key={ticket.id} className="list-row">
                    <div style={{ minWidth: 0 }}>
                      <h3 className="text-sm font-bold text-white" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.title}</h3>
                      <p className="text-xs text-muted mt-1">Status: <span className="text-white capitalize">{ticket.status}</span> • Created {new Date(ticket.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${priorityClass[ticket.priority] || priorityClass.medium}`}>
                        {ticket.priority}
                      </span>
                      <Link href={`/dashboard/tickets`}>
                        <ChevronRight style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top FAQ Topics */}
        <div className="glass-card chart-card">
          <div className="mb-6">
            <h2 className="font-bold text-white" style={{ fontSize: '1.125rem' }}>
              {activeIndustry === 'Legal' ? 'Frequently Asked Legal Questions' : activeIndustry === 'Retail' ? 'Product Search Logs' : 'Top Grounded FAQs'}
            </h2>
            <p className="text-xs text-muted">Most frequent topics that SupportAI grounded successfully.</p>
          </div>
          
          <div className="flex-col gap-2">
            {topQuestions.map((item, index) => (
              <div key={index} className="list-row">
                <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold text-white" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.question}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-white block">{item.count} hits</span>
                  <span className="text-xs text-emerald font-bold">{item.matchRate} accuracy</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
