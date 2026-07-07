'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  TrendingUp, 
  Smile, 
  Clock, 
  BookOpen, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface AnalyticsData {
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

export default function AnalyticsDashboard() {
  const { company } = useApp();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading || !data) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-64 bg-white/5 rounded-lg mb-2" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-80 rounded-2xl bg-white/5" />
          <div className="h-80 rounded-2xl bg-white/5" />
          <div className="h-80 rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  const { summary, charts, topQuestions, knowledgeGaps } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Business Intelligence</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Performance Analytics</h1>
        <p className="text-sm text-gray-400">Deep-dive graphs reporting AI operations, client sentiment, and documentation coverage metrics.</p>
      </div>

      {/* Analytics Main Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-medium">Resolution Success Rate</span>
            <h2 className="text-3xl font-extrabold text-white">{summary.resolutionRate}</h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-medium">Average Response Latency</span>
            <h2 className="text-3xl font-extrabold text-white">{summary.averageResponseTime}</h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-medium">AI Ingestion Accuracy</span>
            <h2 className="text-3xl font-extrabold text-white">{summary.aiAccuracy}</h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
            <Smile className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Volume */}
        <div className="glass-card rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-md font-bold text-white">Daily Chat Volume</h3>
            <p className="text-xs text-gray-400">Trend of incoming chat queries handled by SupportAI.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={256}>
              <AreaChart data={charts.chatsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#purpleGlow)" />
               </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Response times */}
        <div className="glass-card rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-md font-bold text-white">Response Speed Latency</h3>
            <p className="text-xs text-gray-400">Mean time taken by SupportAI RAG pipeline to generate grounded response.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={256}>
              <LineChart data={charts.responseTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="minutes" stroke="#3B82F6" strokeWidth={2.5} dot={{ fill: '#3B82F6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Sentiment Bar */}
        <div className="glass-card rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-md font-bold text-white">User Sentiment Classification</h3>
            <p className="text-xs text-gray-400">Customer feedback emotion distribution aggregated from all messages.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={charts.sentiment} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]}>
                  {charts.sentiment.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top FAQ Topics Card */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-md font-bold text-white">Frequented FAQ Queries</h3>
              <p className="text-xs text-gray-400">Top documentation links indexed by accuracy.</p>
            </div>
            
            <div className="space-y-3.5">
              {topQuestions.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                    <span className="text-xs font-semibold text-white truncate max-w-[200px]">{item.question}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white">{item.count} sessions</span>
                    <span className="text-[10px] text-emerald-400 block font-semibold">{item.matchRate} match</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-1.5 pt-4 border-t border-white/5 mt-4">
            <HelpCircle className="w-4 h-4 text-violet-400" />
            <span>Success rate measures queries resolved without ticket triggers.</span>
          </div>
        </div>
      </div>

      {/* Knowledge Deficit / Gaps Panel */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-400" />
              <span>Knowledge Gap Analysis</span>
            </h3>
            <p className="text-xs text-gray-400">Frequent queries that resulted in low confidence and created support tickets. Add documents covering these topics.</p>
          </div>
          <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">AI Insight active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-gray-400 font-bold uppercase tracking-wider">
                <th className="pb-3 pl-2">Identified Topic / Keyword</th>
                <th className="pb-3 text-center">Unresolved Query Count</th>
                <th className="pb-3 text-center">Escalation Severity</th>
                <th className="pb-3 text-right pr-2">Action Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {knowledgeGaps.map((gap, index) => {
                const badgeColor = 
                  gap.priority === 'High' ? 'bg-rose-500/15 text-rose-400 border-rose-500/20' :
                  gap.priority === 'Medium' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                  'bg-blue-500/15 text-blue-400 border-blue-500/20';
                return (
                  <tr key={index} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 pl-2 font-semibold text-white">{gap.topic}</td>
                    <td className="py-3.5 text-center text-gray-300 font-bold">{gap.count} triggers</td>
                    <td className="py-3.5 text-center">
                      <span className={`text-[9px] px-2 py-0.5 border rounded-full font-bold uppercase tracking-wider ${badgeColor}`}>
                        {gap.priority} Priority
                      </span>
                    </td>
                    <td className="py-3.5 text-right pr-2 text-violet-400 font-semibold hover:underline cursor-pointer">
                      <Link href="/dashboard/knowledge">Upload related documentation</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
