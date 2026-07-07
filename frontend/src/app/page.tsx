'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { 
  Sparkles, 
  BookOpen, 
  Ticket, 
  BarChart3, 
  ArrowRight, 
  Languages, 
  Mic, 
  Smile, 
  CheckCircle,
  Menu,
  X
} from 'lucide-react';
import { SignInButton, Show } from '@/components/ClerkWrapper';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Register GSAP Plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Dynamically import Three.js Orb with SSR disabled for optimal performance
const CyberneticOrb = dynamic(() => import('@/components/3d/CyberneticOrb'), {
  ssr: false,
  loading: () => (
    <div className="hero-3d-container flex items-center justify-center">
      <div className="w-16 h-16 rounded-full border-2 border-primary border-t-transparent animate-spin-slow" />
    </div>
  )
});

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null!);
  const heroTextRef = useRef<HTMLDivElement>(null!);
  const featuresRef = useRef<HTMLDivElement>(null!);
  const pricingRef = useRef<HTMLDivElement>(null!);
  const testimonialsRef = useRef<HTMLDivElement>(null!);

  useGSAP(() => {
    // 1. Hero text entrance animation
    if (heroTextRef.current) {
      gsap.fromTo(
        heroTextRef.current.children,
        { opacity: 0, y: 35 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out' }
      );
    }

    // 2. Features scroll reveal
    if (featuresRef.current) {
      const cards = featuresRef.current.querySelectorAll('.feature-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: featuresRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    // 3. Pricing scroll reveal
    if (pricingRef.current) {
      const cards = pricingRef.current.querySelectorAll('.pricing-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'back.out(1.2)',
          scrollTrigger: {
            trigger: pricingRef.current,
            start: 'top 75%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    // 4. Testimonials scroll reveal
    if (testimonialsRef.current) {
      const cards = testimonialsRef.current.querySelectorAll('.testimonial-card');
      gsap.fromTo(
        cards,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: testimonialsRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="min-h-screen relative flex flex-col justify-between overflow-hidden">
      {/* Background Orbs */}
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />

      {/* Header / Navbar */}
      <header className="header-nav">
        <div className="header-container">
          <Link href="/" className="logo-brand">
            <div className="logo-icon">
              <Sparkles style={{ width: '20px', height: '20px' }} />
            </div>
            <span>SupportAI</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#testimonials">Testimonials</a>
          </nav>

          <div className="flex items-center gap-4">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="btn btn-ghost text-xs font-bold">
                  Sign In
                </button>
              </SignInButton>
            </Show>
            
            <Link href="/dashboard" className="btn btn-primary text-xs">
              Go to Dashboard
            </Link>

            {/* Mobile Menu trigger */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-ghost"
              style={{ padding: '8px' }}
            >
              {mobileMenuOpen ? <X style={{ width: '24px', height: '24px' }} /> : <Menu style={{ width: '24px', height: '24px' }} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="glass-card absolute left-0 right-0 top-full p-6 flex flex-col gap-4 z-50 border-t border-color" style={{ borderRadius: 0 }}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="font-bold">Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="font-bold">Pricing</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="font-bold">Testimonials</a>
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />
            <div className="flex flex-col gap-3">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="btn btn-secondary w-full">Sign In</button>
                </SignInButton>
              </Show>
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary w-full text-center">
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        {/* Left Side: Hero Text */}
        <div ref={heroTextRef} className="hero-text">
          <div className="badge badge-primary w-fit">
            <Sparkles style={{ width: '14px', height: '14px' }} />
            <span>Next-Generation Customer Automation</span>
          </div>

          <h1 className="hero-title">
            Hire the AI Employee for <span className="text-gradient">Customer Support</span>
          </h1>
          
          <p className="hero-desc">
            SupportAI replaces repetitive support workload. By connecting your company documents, policies, and catalogs, our grounded RAG agent answers customer questions with zero hallucinations, automatically creating tickets when confidence drops.
          </p>

          <div className="hero-actions">
            <Link href="/dashboard" className="btn btn-primary">
              <span>Explore Live Sandbox</span>
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </Link>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="btn btn-secondary">
                  <span>Sign Up / Create Account</span>
                </button>
              </SignInButton>
            </Show>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-val">100%</span>
              <span className="stat-lbl">Grounded in upload data</span>
            </div>
            <div className="stat-item">
              <span className="stat-val">0%</span>
              <span className="stat-lbl">AI hallucinations</span>
            </div>
            <div className="stat-item">
              <span className="stat-val">&lt; 1.2s</span>
              <span className="stat-lbl">Average response time</span>
            </div>
          </div>
        </div>

        {/* Right Side: Three.js Interactive 3D Cybernetic Orb */}
        <div className="relative flex items-center justify-center">
          <CyberneticOrb />
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" ref={featuresRef} className="section-wrapper">
        <div className="section-header">
          <span className="section-tag">Platform Capabilities</span>
          <h2 className="section-title">Full-Stack Autonomy</h2>
          <p className="section-desc">SupportAI does not just chat. It acts, logs, analyses, and escalates like a human support employee.</p>
        </div>

        <div className="grid grid-3">
          {[
            { title: 'Grounded RAG Pipeline', desc: 'Queries embed using text-embedding-004 and fetch from pgvector. Gemini answers strictly using matching company content with citations.', icon: BookOpen },
            { title: 'Sentiment Analysis', desc: 'AI analyzes tone on user inputs (angry, frustrated, urgent) to display alert badges in dashboards and handle priorities.', icon: Smile },
            { title: 'Auto-Escalation Tickets', desc: 'If confidence scores drop below 0.6, SupportAI automatically compiles a ticket assigned by urgency, alerting team agents.', icon: Ticket },
            { title: 'Operational Analytics', desc: 'Track chat volumes, satisfaction statistics, AI accuracy metrics, top asked FAQs, and documentation deficits.', icon: BarChart3 },
            { title: 'Multi-Language Support', desc: 'AI supports English, Spanish, French, and German seamlessly, updating tone layouts in real-time.', icon: Languages },
            { title: 'Voice & Speech Core', desc: 'Supports HTML5 Web speech synthesis to read responses out loud and mic recording to transcribe spoken queries.', icon: Mic }
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="glass-card feature-card flex flex-col gap-4 text-left">
                <div className="feature-icon-box">
                  <Icon style={{ width: '22px', height: '22px' }} />
                </div>
                <h3 className="font-bold text-white" style={{ fontSize: '1.125rem' }}>{feat.title}</h3>
                <p className="text-sm text-muted">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" ref={pricingRef} className="section-wrapper">
        <div className="section-header">
          <span className="section-tag">Transparent Billing</span>
          <h2 className="section-title">SaaS Pricing Tiers</h2>
          <p className="section-desc">No complex usage fees. Pick a plan matching your document scope.</p>
        </div>

        <div className="grid grid-3" style={{ maxWidth: '1024px', margin: '0 auto' }}>
          {[
            { name: 'Starter', price: '$49', desc: 'Perfect for local boutiques and small online businesses.', features: ['1 Company Agent', 'Up to 25 Documents', 'Standard RAG Pipeline', '1,000 Chats / mo', 'Email Support'] },
            { name: 'Growth', price: '$129', desc: 'For growing e-commerce stores and software SaaS.', features: ['3 Company Agents', 'Up to 150 Documents', 'Sentiment Escalation', '5,000 Chats / mo', '24/7 Slack channel support'], highlight: true },
            { name: 'Enterprise', price: 'Custom', desc: 'For large corporation networks needing full SLA integrations.', features: ['Unlimited Agents', 'Unlimited Documents', 'Dedicated Custom Models', 'Unlimited Volume', 'SAML SSO & Custom Domain'] }
          ].map((tier, idx) => (
            <div 
              key={idx} 
              className={`pricing-card flex flex-col justify-between ${tier.highlight ? 'glow-card' : 'glass-card'}`}
              style={{ padding: '32px' }}
            >
              {tier.highlight && (
                <span className="badge badge-primary absolute top-4 right-4 text-xs">
                  Popular
                </span>
              )}
              <div className="flex flex-col gap-6 text-left">
                <div>
                  <h3 className="font-bold text-white" style={{ fontSize: '1.25rem' }}>{tier.name}</h3>
                  <p className="text-xs text-muted mt-1">{tier.desc}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-extrabold text-white" style={{ fontSize: '2.5rem' }}>{tier.price}</span>
                  {tier.price !== 'Custom' && <span className="text-xs text-muted">/ month</span>}
                </div>
                <ul className="flex flex-col gap-3 text-sm text-muted">
                  {tier.features.map((f, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2">
                      <CheckCircle style={{ width: '16px', height: '16px', color: 'var(--primary)', flexShrink: 0 }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link 
                href="/dashboard"
                className={`btn w-full text-center mt-8 ${tier.highlight ? 'btn-primary' : 'btn-secondary'}`}
              >
                Choose {tier.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" ref={testimonialsRef} className="section-wrapper">
        <div className="section-header">
          <span className="section-tag">Client Reviews</span>
          <h2 className="section-title">Loved by Support Teams</h2>
        </div>

        <div className="grid grid-2" style={{ maxWidth: '900px', margin: '0 auto' }}>
          {[
            { quote: "SupportAI has cut our customer response workloads by over 80%. Setting it up took under 15 minutes by dragging our user manuals. Highly recommend for any Shopify brand.", author: "Sarah Jenkins", role: "Support Director, Loomis Boutique", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" },
            { quote: "The auto-escalation ticket creation is flawless. If the AI doesn't find the answers in our policy docs, it flags it immediately in our queue with priority tags based on the user's frustration.", author: "Marcus Thorne", role: "Operations VP, DevFlow Corp", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop" }
          ].map((t, idx) => (
            <div key={idx} className="glass-card testimonial-card flex flex-col justify-between text-left" style={{ padding: '28px' }}>
              <p className="text-sm text-white leading-relaxed italic" style={{ opacity: 0.9 }}>&quot;{t.quote}&quot;</p>
              <div className="flex items-center gap-4 mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                <Image src={t.avatar} alt="avatar" width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                <div>
                  <span className="text-sm font-bold text-white block">{t.author}</span>
                  <span className="text-xs text-dim">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', background: 'rgba(3, 7, 18, 0.9)', padding: '32px 24px', zIndex: 10 }}>
        <div className="container flex justify-between items-center flex-wrap gap-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '10px' }}>S</div>
            <span className="font-bold text-white">SupportAI</span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
            <a href="mailto:support@supportai.com" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
