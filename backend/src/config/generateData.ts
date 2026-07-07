import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target base directory
const baseDir = path.resolve(__dirname, '../../../data');

const industries = ['legal', 'manufacturing', 'sales', 'customer-support', 'retail'];

const ensureDirectories = () => {
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  for (const ind of industries) {
    const indPath = path.join(baseDir, ind);
    if (!fs.existsSync(indPath)) {
      fs.mkdirSync(indPath, { recursive: true });
    }
  }
};

// --- DATA BUILDERS ---

// 1. FAQ Generator
const generateFAQs = (industry: string) => {
  const list = [];
  const categories: Record<string, string[]> = {
    legal: ['Contracts', 'Policies', 'Compliance', 'Intellectual Property', 'Corporate Law'],
    manufacturing: ['Manuals', 'SOPs', 'Safety', 'Machine Maintenance', 'Troubleshooting'],
    sales: ['Pricing', 'Brochures', 'Catalogs', 'Enterprise SLA', 'Discounts'],
    'customer-support': ['FAQs', 'Refund Policy', 'Troubleshooting', 'Billing', 'Account'],
    retail: ['Products', 'Shipping', 'Returns', 'Loyalty Program', 'Disputes']
  };

  const indCategories = categories[industry] || ['General'];
  const keywordsPool = ['help', 'policy', 'guide', 'steps', 'duration', 'instructions', 'fees', 'details'];

  const templates: Record<string, { q: string; a: string }[]> = {
    legal: [
      { q: "How do I terminate a commercial lease contract early?", a: "To terminate a commercial lease contract early, you must review Section 12 (Early Termination). Generally, it requires a minimum of 90 days' written notice, settlement of all outstanding rents, and payment of a termination penalty equivalent to three months of rent." },
      { q: "What is required for formal property registration?", a: "Property registration requires a notarized Deed of Sale, the original Title Deed, tax clearance certificates from the local municipality, official identification of both buyer and seller, and payment of the transfer tax." },
      { q: "Is an NDA enforceable without a consideration clause?", a: "In most jurisdictions, a non-disclosure agreement (NDA) does require some form of consideration to be enforceable. For employees, this is usually the offer of employment; for external parties, it can be mutual exchange of proprietary information." },
      { q: "What are the compliance rules for GDPR consent?", a: "GDPR compliance requires consent to be freely given, specific, informed, and unambiguous. Silence, pre-ticked boxes, or inactivity do not constitute consent. Users must also be able to withdraw consent easily at any time." },
      { q: "How are IP rights allocated in a service agreement?", a: "IP rights in service agreements typically specify that all work product created during the service belongs to the client (Work Made for Hire), whereas pre-existing IP remains the property of the respective creator." }
    ],
    manufacturing: [
      { q: "What is the calibration interval for the spindle rotation sensor?", a: "Spindle rotation sensors must undergo calibration verification every 180 operating hours. Full recalibration must be executed if sensor readings deviate by more than 0.05% from the reference standard." },
      { q: "What are the emergency shutdown steps for the CNC Lathe?", a: "In case of emergency: 1. Press the primary red E-STOP button immediately. 2. Cut the main circuit breaker on the left wall. 3. Back away from the spindle. 4. Notify the floor safety supervisor immediately." },
      { q: "How do I troubleshoot hydraulic pressure loss?", a: "1. Inspect pressure gauges to confirm loss scale. 2. Verify hydraulic fluid level is above the critical threshold. 3. Check for external hose leaks or cracks. 4. Inspect the solenoid valve status LED. If yellow/red, replace the valve." },
      { q: "What safety equipment is mandatory on the plant floor?", a: "Mandatory PPE includes: high-impact safety glasses (ANSI Z87.1), steel-toed boots, high-visibility vest, and double hearing protection in zones exceeding 85 dBA." },
      { q: "What is the SOP for hot work welding calibration?", a: "Hot work calibration requires: 1. Issuing a Hot Work Permit. 2. Testing gas levels using a calibrated multi-gas monitor. 3. Clearing combustible materials within a 35-foot radius. 4. Positioning a dedicated fire watch engineer with a charged extinguisher." }
    ],
    sales: [
      { q: "What features are included in the SaaS Enterprise Plan?", a: "The Enterprise Plan includes unlimited team members, dedicated GPU processing, customizable LLM temperature configurations, SSO integration (SAML/OIDC), 99.9% guaranteed uptime SLA, and 24/7 dedicated phone support." },
      { q: "Are there discounts for annual billing commitments?", a: "Yes, customers who opt for annual billing receive a 20% discount compared to monthly subscriptions. We also offer additional volume discounts for teams with more than 50 active seats." },
      { q: "Can I upgrade my subscription plan mid-cycle?", a: "Absolutely. You can upgrade your plan at any time through the billing dashboard. The system will calculate the pro-rated cost for the remainder of your current billing period and charge you the difference." },
      { q: "What is the standard onboarding duration for new teams?", a: "Standard onboarding takes 1 to 2 weeks, which includes setting up your dedicated vector database, ingesting training manuals, training your AI agents, and conducting a 2-hour staff training session." },
      { q: "What are your payment terms for enterprise contracts?", a: "Enterprise contracts are billed via invoice with standard Net 30 payment terms. We support payments via bank wire transfer, ACH, and major corporate credit cards." }
    ],
    'customer-support': [
      { q: "How do I request a refund for a recent charge?", a: "To request a refund, please contact support with your invoice ID. Refunds are eligible within 14 days of purchase for unused licenses or in cases of documented service downtime. Processing takes 5-7 business days." },
      { q: "How can I reset my account password?", a: "Go to the login screen, click 'Forgot Password', and enter your registered email. We will send you a secure link to create a new password. The link expires in 1 hour." },
      { q: "Can I change my registered email address?", a: "Yes, go to Account Settings > Security, enter your new email address, and verify it by clicking the link sent to your new mailbox. Your old email will receive a security notification." },
      { q: "What happens if I cancel my subscription early?", a: "Upon cancellation, your account will remain active on the current tier until the end of your billing cycle. No further recurring charges will be processed, and your data is archived for 90 days before deletion." },
      { q: "How do I update my credit card details?", a: "Log into the dashboard, go to Billing > Payment Methods, click 'Update Card', enter the new card credentials, and save. We will perform a temporary $1 authorization to verify the card." }
    ],
    retail: [
      { q: "What is your standard storefront return policy?", a: "We accept returns of unworn, unwashed items with original tags attached within 30 days of purchase. Returns can be processed in-store or online via our prepaid shipping labels." },
      { q: "Do you offer international shipping?", a: "Yes, we ship to over 120 countries worldwide. International shipping rates are calculated at checkout based on package weight and destination. Delivery takes 7-14 business days." },
      { q: "How do I check my store loyalty points?", a: "You can check your points balance by logging into the mobile app, visiting the checkout counter, or viewing the footer of your electronic receipt. Every $1 spent earns 1 reward point." },
      { q: "Can I exchange a product for a different size?", a: "Yes, size exchanges are free. Simply create an exchange request in the online portal, print the return slip, and mail back the item. We will ship the new size immediately upon drop-off scan." },
      { q: "What should I do if my package is marked delivered but not received?", a: "Please check with neighbors or building managers first. If not found, contact customer service within 3 days of the delivery timestamp. We will initiate a tracking audit with the courier." }
    ]
  };

  const indTemplates = templates[industry] || templates['customer-support'];

  for (let i = 1; i <= 100; i++) {
    const template = indTemplates[(i - 1) % indTemplates.length];
    const category = indCategories[(i - 1) % indCategories.length];
    
    // Procedurally modify questions to make them diverse
    let question = template.q;
    if (i > indTemplates.length) {
      const variants = [
        `Regarding the system: ${template.q}`,
        `Can you explain ${template.q.toLowerCase()}`,
        `Quick question, ${template.q.charAt(0).toLowerCase() + template.q.slice(1)}`,
        `I wanted to ask: ${template.q}`,
        `Could you help with this: ${template.q}`
      ];
      question = variants[(i - 1) % variants.length];
    }

    list.push({
      id: i,
      question: question,
      answer: `${template.a} (FAQ Reference Node #${i})`,
      category: category,
      keywords: [industry, category.toLowerCase(), keywordsPool[i % keywordsPool.length], keywordsPool[(i + 1) % keywordsPool.length]]
    });
  }
  return list;
};

// 2. Documents Generator
const generateDocuments = (industry: string) => {
  const list = [];
  const titles: Record<string, string[]> = {
    legal: ['Commercial Lease Guide', 'GDPR Data Compliance', 'Standard NDA Protocol', 'Intellectual Property Protection', 'Corporate Governance Policy', 'Employment Agreement Terms'],
    manufacturing: ['CNC Lathe Calibration Manual', 'Hydraulic Spindle SOP', 'PPE Plant Floor Regulations', 'Equipment Maintenance Log', 'Chemical Spillage SOP', 'Machine Guard Safety Standards'],
    sales: ['Enterprise Tier Pricing Guide', 'Annual SaaS Billing Policies', 'Onboarding Vector Ingestion Plan', 'CRM Routing Architecture', 'Sales Quotation Policy', 'Volume Discount Tiers'],
    'customer-support': ['Refund & Chargeback Policy', 'Password Reset Operations', 'Email Verification Guide', 'Account Deletion SLA', 'Billing Dispute Operations', 'Escalation Dispatch Tiers'],
    retail: ['Storefront Exchange Program', 'International Shipping Guide', 'Membership Loyalty Rewards', 'Lost Package Courier Audits', 'Gift Card Terms & Conditions', 'Restocking Procedures']
  };

  const categories: Record<string, string[]> = {
    legal: ['Contracts', 'Policies', 'Compliance'],
    manufacturing: ['Manuals', 'SOPs', 'Safety Documents'],
    sales: ['Pricing', 'Brochures', 'Catalogs'],
    'customer-support': ['FAQs', 'Refund Policy', 'Troubleshooting'],
    retail: ['Products', 'Shipping', 'Returns']
  };

  const indTitles = titles[industry] || titles['customer-support'];
  const indCats = categories[industry] || ['General'];

  for (let i = 1; i <= 30; i++) {
    const title = indTitles[(i - 1) % indTitles.length] + ` - Vol ${Math.ceil(i / indTitles.length)}`;
    const category = indCats[(i - 1) % indCats.length];
    list.push({
      id: i,
      title: title,
      category: category,
      content: `Detailed documentation for ${title}. This article serves as the official grounded reference guidelines. All AI answers generated must cite this document if referencing its parameters. Ensure compliance with Section ${i}.\n\nSpecifically, this section mandates that all processes, procedures, and inquiries concerning ${title.toLowerCase()} are verified against local regulations and certified operational guidelines. Failure to comply with these guidelines may lead to automated ticket escalation.`,
      tags: [industry, category.toLowerCase(), 'internal', 'reference'],
      industry: industry.charAt(0).toUpperCase() + industry.slice(1).replace('-', ' ')
    });
  }
  return list;
};

// 3. Tickets Generator
const generateTickets = (industry: string) => {
  const list = [];
  const names = ['Alice Smith', 'Bob Jones', 'Charles Vance', 'Dave Miller', 'Elena Rostova', 'Fiona Gallagher', 'George Harris', 'Hannah Abbott'];
  const emails = ['alice@gmail.com', 'bob@yahoo.com', 'charles@vancecorp.com', 'dave@factory.com', 'elena@faststartup.io', 'fiona@retailer.com', 'george@gmail.com', 'hannah@support.com'];
  const subjects: Record<string, string[]> = {
    legal: ['Lease penalty review required', 'NDA template correction', 'IP registration assistance', 'GDPR consent audit request'],
    manufacturing: ['CNC Lathe spindle deviation alert', 'Hydraulic fluid leak reported', 'PPE violation on Sector B', 'Calibration log missing spindle data'],
    sales: ['Enterprise price quote mismatch', 'Annual billing upgrade failure', 'SSO configuration setup error', 'Request for volume discount approval'],
    'customer-support': ['Chargeback request on invoice', 'Password reset email not received', 'Account deletion stuck in archive', 'Billing card validation error'],
    retail: ['Denim jacket size exchange delay', 'Worldwide shipping customs holdup', 'Loyalty points not credited', 'Package tracking status discrepancy']
  };

  const indSubjects = subjects[industry] || subjects['customer-support'];
  const priorities = ['low', 'medium', 'high', 'critical'];
  const statuses = ['open', 'pending', 'resolved', 'closed'];
  const sentiments = ['happy', 'neutral', 'angry', 'frustrated', 'urgent'];

  for (let i = 1; i <= 100; i++) {
    const customerIdx = i % names.length;
    const priority = priorities[i % priorities.length];
    const status = statuses[i % statuses.length];
    const sentiment = sentiments[i % sentiments.length];
    const subject = indSubjects[i % indSubjects.length] + ` (Ticket Reference ID #${i})`;

    list.push({
      id: i,
      customerName: names[customerIdx],
      email: emails[customerIdx],
      subject: subject,
      description: `Grounded escalation ticket regarding: ${subject}. The customer expressed feeling ${sentiment} about this issue. High urgency response is recommended.`,
      priority: priority,
      status: status,
      sentiment: sentiment,
      createdAt: new Date(Date.now() - i * 1000 * 60 * 60).toISOString()
    });
  }
  return list;
};

// 4. Conversations Generator
const generateConversations = (industry: string) => {
  const list = [];
  const customerEmails = ['user1@gmail.com', 'user2@gmail.com', 'prospect3@corp.com', 'operator4@plant.com', 'buyer5@boutique.com'];
  const queries: Record<string, { q: string; a: string }[]> = {
    legal: [
      { q: "Can I terminate my commercial lease early?", a: "Yes, commercial lease contracts can be terminated early by providing a 90-day written notice and paying the three-month rent penalty." },
      { q: "What is GDPR consent compliance?", a: "GDPR consent requires a clear, informed, freely-given, and unambiguous user action. Silent or pre-ticked boxes are non-compliant." }
    ],
    manufacturing: [
      { q: "Show machine maintenance schedule", a: "Spindle sensors must undergo calibration every 180 operating hours. Hydraulic fluid checks must be done daily." },
      { q: "How do I shut down the CNC Lathe?", a: "Press the red E-STOP button instantly and cut the left wall circuit breaker." }
    ],
    sales: [
      { q: "Compare pricing plans", a: "Growth Plan is $129/mo (3 seats, 150 docs). Enterprise Plan features custom volume discounts and SAML SSO." },
      { q: "What is your onboarding timeline?", a: "Onboarding takes 1-2 weeks, including training manual vectorization and staff training." }
    ],
    'customer-support': [
      { q: "I need a refund", a: "Refunds are processed within 14 days of purchase for unused licenses or documented server downtime." },
      { q: "Reset my password", a: "Click 'Forgot Password' on the login screen to receive a secure link via email." }
    ],
    retail: [
      { q: "Is the velvet summer dress in stock?", a: "Yes, sizes S, M, L are in stock. Restocking for size XL is scheduled for next Monday." },
      { q: "What is your return policy?", a: "Items in original condition can be returned within 30 days online or in-store." }
    ]
  };

  const indQueries = queries[industry] || queries['customer-support'];

  for (let i = 1; i <= 50; i++) {
    const query = indQueries[i % indQueries.length];
    list.push({
      id: i,
      customerEmail: customerEmails[i % customerEmails.length],
      status: i % 5 === 0 ? 'pending' : 'resolved',
      messages: [
        {
          id: `msg-${i}-1`,
          sender: "customer",
          content: query.q,
          sentiment: "neutral",
          timestamp: new Date(Date.now() - i * 1000 * 60 * 5).toISOString()
        },
        {
          id: `msg-${i}-2`,
          sender: "ai",
          content: query.a,
          citations: [
            { chunk_id: `chunk-${i}`, document_id: `doc-${i % 30 + 1}`, filename: `Grounded_Source_${industry}_${i % 3}.pdf` }
          ],
          confidence: 0.85 + (i % 15) * 0.01,
          timestamp: new Date(Date.now() - i * 1000 * 60 * 4.9).toISOString()
        }
      ]
    });
  }
  return list;
};

// 5. Analytics Generator
const generateAnalytics = (industry: string) => {
  const baseCharts = {
    chatsTrend: [
      { date: 'Mon', count: 18 },
      { date: 'Tue', count: 24 },
      { date: 'Wed', count: 19 },
      { date: 'Thu', count: 32 },
      { date: 'Fri', count: 28 },
      { date: 'Sat', count: 12 },
      { date: 'Sun', count: 15 }
    ],
    responseTime: [
      { time: '09:00', minutes: 1.1 },
      { time: '12:00', minutes: 0.7 },
      { time: '15:00', minutes: 1.3 },
      { time: '18:00', minutes: 0.8 }
    ],
    sentiment: [
      { name: 'Happy', value: 40, color: '#10B981' },
      { name: 'Neutral', value: 45, color: '#3B82F6' },
      { name: 'Frustrated', value: 10, color: '#F59E0B' },
      { name: 'Angry', value: 5, color: '#EF4444' }
    ]
  };

  const baseSummary = {
    todayChats: 28,
    resolvedChats: 24,
    pendingChats: 4,
    averageResponseTime: '1.2m',
    customerSatisfaction: '4.8/5',
    aiAccuracy: '95%',
    resolutionRate: '88%',
    totalTickets: 12,
    resolvedTickets: 8
  };

  const industryData: Record<string, any> = {
    legal: {
      industry: 'Legal',
      summary: baseSummary,
      charts: baseCharts,
      industrySpecific: {
        searchedContracts: [
          { name: 'Standard Lease Agreement.pdf', count: 42 },
          { name: 'NDA Template.pdf', count: 28 },
          { name: 'Employment Contract.pdf', count: 15 }
        ],
        consultationRequests: 14
      }
    },
    manufacturing: {
      industry: 'Manufacturing',
      summary: baseSummary,
      charts: baseCharts,
      industrySpecific: {
        equipmentIssues: 6,
        warrantyClaims: 11,
        machineManuals: [
          { name: 'Vortex Calibration X-200.pdf', status: 'Optimal' },
          { name: 'CNC Lathe Standard SOP.pdf', status: 'Maintenance Due' }
        ]
      }
    },
    sales: {
      industry: 'Sales',
      summary: baseSummary,
      charts: baseCharts,
      industrySpecific: {
        leadFunnel: [
          { stage: 'Leads Ingested', count: 145 },
          { stage: 'Qualified Leads', count: 48 },
          { stage: 'Quotes Generated', count: 28 },
          { stage: 'Closed Deals', count: 12 }
        ],
        conversionRate: '25%',
        revenueTrends: [
          { name: 'Week 1', amount: 5200 },
          { name: 'Week 2', amount: 6800 },
          { name: 'Week 3', amount: 8900 },
          { name: 'Week 4', amount: 14400 }
        ]
      }
    },
    'customer-support': {
      industry: 'Customer Support',
      summary: baseSummary,
      charts: baseCharts,
      industrySpecific: {
        aiResolutionRate: '88%',
        averageResponseTime: '1.2m',
        escalationRate: '12%'
      }
    },
    retail: {
      industry: 'Retail',
      summary: baseSummary,
      charts: baseCharts,
      industrySpecific: {
        popularProducts: [
          { name: 'Velvet Summer Dress', sales: 142, stock: 45 },
          { name: 'Classic Denim Jacket', sales: 98, stock: 12 },
          { name: 'Leather Shoulder Bag', sales: 56, stock: 8 }
        ],
        returnsProcessed: 18,
        totalOrders: 324
      }
    }
  };

  return industryData[industry] || industryData['customer-support'];
};

// 6. Products (Retail & Sales Only)
const generateProducts = () => {
  const list = [];
  const itemNames = ['Premium Leather Boots', 'Silk Summer Dress', 'Cotton Denim Jacket', 'Designer Sunglasses', 'Cashmere Wool Scarf', 'Running Athletic Shoes', 'Smart Sports Watch', 'Wireless Audio Earbuds'];
  const categories = ['Footwear', 'Apparel', 'Accessories', 'Electronics'];
  const images = [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=300&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=300&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=300&auto=format&fit=crop'
  ];

  for (let i = 1; i <= 100; i++) {
    const name = itemNames[i % itemNames.length] + ` (Style #${1000 + i})`;
    const price = parseFloat((39.99 + (i % 25) * 8.5).toFixed(2));
    const rating = parseFloat((4.0 + (i % 10) * 0.1).toFixed(1));

    list.push({
      id: i,
      name: name,
      description: `High-quality ${name.toLowerCase()} featuring premium materials, detailed design elements, and comfort tailoring. Grounded RAG product catalog node.`,
      price: price,
      category: categories[i % categories.length],
      stock: (i % 15) * 4 + 2,
      rating: rating,
      image: images[i % images.length]
    });
  }
  return list;
};

// 7. Manuals (Manufacturing Only)
const generateManuals = () => {
  return [
    {
      id: "man-1",
      machine: "CNC Lathe Spindle L-400",
      type: "Safety & SOP Manual",
      sections: [
        { title: "1. Operations Safety", content: "Operators must secure safety shield guards and wear mandatory ANSI Z87.1 glasses before triggering spindle rotation." },
        { title: "2. Lubrication Cycle", content: "Lubricating oil level must be inspected before each shift. Replace filter elements every 250 operating hours." }
      ]
    },
    {
      id: "man-2",
      machine: "Hydraulic Compacting Press",
      type: "Troubleshooting Guide",
      sections: [
        { title: "1. Hydraulic Pressure Losses", content: "Verify hydraulic valves and inspect pressure indicators. Solenoid light green signifies normal output. Replace valve if red." }
      ]
    }
  ];
};

// 8. Contracts (Legal Only)
const generateContracts = () => {
  return [
    {
      id: "con-1",
      type: "Commercial Lease Agreement",
      reference: "CLA-2026-X1",
      clauses: [
        { section: "4. Rent Terms", text: "Rent is payable in advance on the first day of each month. Late fees apply after the fifth day." },
        { section: "12. Early Termination", text: "Lessee can terminate this lease early with a minimum of 90 days' written notice and penalty equivalent to three months of rent." }
      ]
    },
    {
      id: "con-2",
      type: "Standard Mutual NDA",
      reference: "MNDA-V1.2",
      clauses: [
        { section: "3. Scope of Disclosure", text: "Disclosures are marked confidential at the time of sharing or confirmed in writing within 15 business days." }
      ]
    }
  ];
};

// 9. Policies Suite
const generatePolicies = (industry: string) => {
  return {
    RefundPolicy: `Official Refund Policy for ${industry} solutions. Valid for 14 days following deployment. Processing requires invoice documentation.`,
    PrivacyPolicy: `GDPR compliant Privacy Policy. We encrypt data transactions at rest and in transit. User credentials are archived securely.`,
    TermsOfService: `Platform Terms of Service. Prohibits unauthorized scrapers. Service availability target is 99.9%.`,
    ShippingPolicy: `Worldwide shipping guide. Standard shipping takes 5-10 business days. Customs duties paid by importer.`,
    WarrantyPolicy: `Product warranty guidelines. Covers hardware malfunctions for up to 12 months. Excludes damage caused by modification.`,
    ServiceAgreement: `Standard service SLA. Support tickets prioritized by customer sentiment. Low confidence requests auto-escalate to human agents.`
  };
};

// 10. Prompts
const generatePrompts = (industry: string) => {
  const suggested: Record<string, string[]> = {
    legal: [
      "Can I terminate my lease early?",
      "What documents are required for property registration?",
      "Is an NDA enforceable without consideration?",
      "What are the requirements for GDPR consent?"
    ],
    manufacturing: [
      "Show maintenance schedule.",
      "What is the spindle sensor calibration interval?",
      "CNC emergency shutdown steps.",
      "Troubleshoot hydraulic pressure loss."
    ],
    sales: [
      "Generate a quotation.",
      "Compare pricing plans.",
      "What payment terms do you support?",
      "Enterprise plan features."
    ],
    'customer-support': [
      "I want a refund.",
      "How do I reset my password?",
      "Change my account email.",
      "Track my order."
    ],
    retail: [
      "Is this product available?",
      "What is your return policy?",
      "Do you ship internationally?",
      "Check my loyalty points."
    ]
  };
  return suggested[industry] || suggested['customer-support'];
};


// --- EXECUTOR ---

const run = () => {
  console.log("Starting structured JSON seed data generation...");
  ensureDirectories();

  for (const ind of industries) {
    const indPath = path.join(baseDir, ind);

    console.log(`Generating data for [${ind}]...`);

    // 1. FAQs
    fs.writeFileSync(path.join(indPath, 'faq.json'), JSON.stringify(generateFAQs(ind), null, 2));

    // 2. Documents
    fs.writeFileSync(path.join(indPath, 'documents.json'), JSON.stringify(generateDocuments(ind), null, 2));

    // 3. Tickets
    fs.writeFileSync(path.join(indPath, 'tickets.json'), JSON.stringify(generateTickets(ind), null, 2));

    // 4. Conversations
    fs.writeFileSync(path.join(indPath, 'conversations.json'), JSON.stringify(generateConversations(ind), null, 2));

    // 5. Analytics
    fs.writeFileSync(path.join(indPath, 'analytics.json'), JSON.stringify(generateAnalytics(ind), null, 2));

    // 6. Policies
    fs.writeFileSync(path.join(indPath, 'policies.json'), JSON.stringify(generatePolicies(ind), null, 2));

    // 7. Prompts
    fs.writeFileSync(path.join(indPath, 'prompts.json'), JSON.stringify(generatePrompts(ind), null, 2));

    // 8. Retail/Sales Products
    if (ind === 'retail' || ind === 'sales') {
      fs.writeFileSync(path.join(indPath, 'products.json'), JSON.stringify(generateProducts(), null, 2));
    }

    // 9. Manufacturing Manuals
    if (ind === 'manufacturing') {
      fs.writeFileSync(path.join(indPath, 'manuals.json'), JSON.stringify(generateManuals(), null, 2));
    }

    // 10. Legal Contracts
    if (ind === 'legal') {
      fs.writeFileSync(path.join(indPath, 'contracts.json'), JSON.stringify(generateContracts(), null, 2));
    }
  }

  console.log("JSON Seed Data generation successfully complete!");
};

run();
