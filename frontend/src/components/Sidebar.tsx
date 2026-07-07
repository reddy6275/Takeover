'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  LayoutDashboard, 
  MessageSquare, 
  BookOpen, 
  Ticket, 
  BarChart3, 
  Settings, 
  Sparkles, 
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { SignOutButton } from '@/components/ClerkWrapper';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Sidebar() {
  const pathname = usePathname();
  const { company, user } = useApp();
  const sidebarRef = useRef<HTMLElement>(null!);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Chat', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: BookOpen },
    { name: 'Tickets', href: '/dashboard/tickets', icon: Ticket },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  useGSAP(() => {
    if (sidebarRef.current) {
      const items = sidebarRef.current.querySelectorAll('.nav-item');
      gsap.fromTo(
        items,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, { scope: sidebarRef });

  return (
    <aside ref={sidebarRef} className="sidebar">
      <div className="flex-col">
        {/* Logo Section */}
        <div className="sidebar-header flex items-center gap-3">
          <div className="logo-icon" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
            <Sparkles style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <h1 className="font-bold text-white" style={{ fontSize: '1.125rem', lineHeight: 1 }}>SupportAI</h1>
            <span className="text-primary font-bold" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Employee</span>
          </div>
        </div>

        {/* Company Status Block */}
        <div className="sidebar-status">
          <div style={{ overflow: 'hidden' }}>
            <p className="text-xs text-muted">Managing Support for</p>
            <p className="text-sm font-bold text-white" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {company?.name || 'Loading Company...'}
            </p>
          </div>
          <div 
            style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 10px var(--accent-emerald)', flexShrink: 0 }} 
            title="AI Employee Active" 
          />
        </div>

        {/* Nav Links */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon style={{ width: '18px', height: '18px', color: isActive ? 'var(--primary)' : 'inherit' }} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="sidebar-footer">
        <div className="flex items-center gap-3 mb-4">
          {user?.avatar_url ? (
            <Image src={user.avatar_url} alt="avatar" width={36} height={36} style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
          ) : (
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <UserIcon style={{ width: '18px', height: '18px' }} />
            </div>
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p className="text-sm font-bold text-white" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'Demo Employee'}
            </p>
            <span className="text-muted font-bold" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {user?.role || 'Agent'}
            </span>
          </div>
        </div>

        <SignOutButton redirectUrl="/">
          <button className="btn btn-secondary w-full" style={{ padding: '8px 12px', fontSize: '0.75rem', borderColor: 'rgba(244, 63, 94, 0.2)', color: '#fb7185' }}>
            <LogOut style={{ width: '14px', height: '14px' }} />
            <span>Sign Out</span>
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
