import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
export function stringToUuid(str) {
    if (!str)
        return '';
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(str))
        return str;
    const hash = crypto.createHash('sha1').update(str).digest('hex');
    const part1 = hash.substring(0, 8);
    const part2 = hash.substring(8, 12);
    const part3 = '5' + hash.substring(13, 16);
    const part4 = ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hash.substring(18, 20);
    const part5 = hash.substring(20, 32);
    return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}
// 5 Main Industry UUIDs
export const demoCompanyId = "47e5b22b-2e9b-44bb-9426-b81665a31c51"; // Customer Support
export const demoCompanyLegalId = "22b2b1a1-9a7c-473d-9860-23a7894fc51d";
export const demoCompanyMfgId = "bf3ea205-021b-4f9e-a035-7798a6358c22";
export const demoCompanySalesId = "10db238a-1c6e-4402-b25c-0c15682fa18a";
export const demoCompanyRetailId = "a8db34f0-466d-495d-b0e6-d18bb7fc2109";
export const demoUserId = "c0000000-0000-0000-0000-000000000001";
export const demoUserLegalId = "c0000000-0000-0000-0000-000000000002";
export const demoUserMfgId = "c0000000-0000-0000-0000-000000000003";
export const demoUserSalesId = "c0000000-0000-0000-0000-000000000004";
export const demoUserRetailId = "c0000000-0000-0000-0000-000000000005";
const nowIso = () => new Date().toISOString();
export const mockDb = {
    companies: [
        {
            id: demoCompanyId,
            name: "Acme Corp",
            domain: "acme.com",
            brand_colors: { primary: "#8B5CF6", secondary: "#3B82F6", background: "#0B0F19" },
            ai_tone: "friendly, professional, and concise",
            business_hours: { weekday: "9 AM - 5 PM", weekend: "Closed" },
            support_email: "support@acme.com",
            industry: "Customer Support",
            created_at: nowIso()
        },
        {
            id: demoCompanyLegalId,
            name: "Lex & Partners",
            domain: "lexpartners.com",
            brand_colors: { primary: "#D97706", secondary: "#10B981", background: "#0F172A" },
            ai_tone: "extremely formal, precise, and objective",
            business_hours: { weekday: "8 AM - 6 PM", weekend: "Closed" },
            support_email: "info@lexpartners.com",
            industry: "Legal",
            created_at: nowIso()
        },
        {
            id: demoCompanyMfgId,
            name: "Vortex Machinery",
            domain: "vortexmfg.com",
            brand_colors: { primary: "#06B6D4", secondary: "#EF4444", background: "#111827" },
            ai_tone: "technical, direct, and instruction-based",
            business_hours: { weekday: "24 Hours", weekend: "24 Hours" },
            support_email: "ops@vortexmfg.com",
            industry: "Manufacturing",
            created_at: nowIso()
        },
        {
            id: demoCompanySalesId,
            name: "Apex Growth Solutions",
            domain: "apexgrowth.com",
            brand_colors: { primary: "#EC4899", secondary: "#F59E0B", background: "#180828" },
            ai_tone: "persuasive, energetic, and value-oriented",
            business_hours: { weekday: "9 AM - 6 PM", weekend: "10 AM - 4 PM" },
            support_email: "sales@apexgrowth.com",
            industry: "Sales",
            created_at: nowIso()
        },
        {
            id: demoCompanyRetailId,
            name: "Velvet Threads Boutique",
            domain: "velvetthreads.com",
            brand_colors: { primary: "#10B981", secondary: "#8B5CF6", background: "#050F0A" },
            ai_tone: "warm, welcoming, and shopping-focused",
            business_hours: { weekday: "10 AM - 9 PM", weekend: "11 AM - 7 PM" },
            support_email: "care@velvetthreads.com",
            industry: "Retail",
            created_at: nowIso()
        }
    ],
    users: [
        {
            id: demoUserId,
            clerk_id: "sandbox_user_123",
            email: "employee@acme.com",
            role: "admin",
            company_id: demoCompanyId,
            name: "Demo Admin",
            avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
            created_at: nowIso()
        },
        {
            id: demoUserLegalId,
            clerk_id: "sandbox_user_legal",
            email: "attorney@lexpartners.com",
            role: "admin",
            company_id: demoCompanyLegalId,
            name: "Edward Sterling",
            avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop",
            created_at: nowIso()
        },
        {
            id: demoUserMfgId,
            clerk_id: "sandbox_user_mfg",
            email: "supervisor@vortexmfg.com",
            role: "admin",
            company_id: demoCompanyMfgId,
            name: "Marcus Vance",
            avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop",
            created_at: nowIso()
        },
        {
            id: demoUserSalesId,
            clerk_id: "sandbox_user_sales",
            email: "dealmaker@apexgrowth.com",
            role: "admin",
            company_id: demoCompanySalesId,
            name: "Sarah Sterling",
            avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop",
            created_at: nowIso()
        },
        {
            id: demoUserRetailId,
            clerk_id: "sandbox_user_retail",
            email: "retailer@velvetthreads.com",
            role: "admin",
            company_id: demoCompanyRetailId,
            name: "Mia Thorne",
            avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&auto=format&fit=crop",
            created_at: nowIso()
        }
    ],
    conversations: [],
    messages: [],
    tickets: [],
    knowledge_documents: [],
    document_chunks: [],
    analytics_events: []
};
// Check if error is due to database connection issues OR missing tables (schema not applied)
export function isDbConnectionError(err) {
    if (!err)
        return false;
    const msg = String(err.message || err).toLowerCase();
    const code = String(err.code || '');
    return (msg.includes('fetch failed') ||
        msg.includes('enotfound') ||
        msg.includes('network') ||
        msg.includes('database connection') ||
        msg.includes('connection failed') ||
        // PostgREST errors: table/function not found (schema not yet created)
        code === 'PGRST205' ||
        msg.includes('could not find the table') ||
        msg.includes('schema cache') ||
        msg.includes('relation') && msg.includes('does not exist'));
}
// --- DYNAMIC SEED LOADER FROM DISK ---
export function loadSeedData() {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const baseDataDir = path.resolve(__dirname, '../../../data');
        if (!fs.existsSync(baseDataDir)) {
            console.warn('[WARNING] Seed data directory not found at:', baseDataDir, '. Using empty/mock defaults.');
            return;
        }
        const industries = ['legal', 'manufacturing', 'sales', 'customer-support', 'retail'];
        const companyIdMap = {
            'legal': demoCompanyLegalId,
            'manufacturing': demoCompanyMfgId,
            'sales': demoCompanySalesId,
            'customer-support': demoCompanyId,
            'retail': demoCompanyRetailId
        };
        const userIdMap = {
            'legal': demoUserLegalId,
            'manufacturing': demoUserMfgId,
            'sales': demoUserSalesId,
            'customer-support': demoUserId,
            'retail': demoUserRetailId
        };
        // Clear existing mock dynamic lists to prevent duplicate runs
        mockDb.conversations = [];
        mockDb.messages = [];
        mockDb.tickets = [];
        mockDb.knowledge_documents = [];
        mockDb.document_chunks = [];
        for (const ind of industries) {
            const indDir = path.join(baseDataDir, ind);
            if (!fs.existsSync(indDir))
                continue;
            const compId = companyIdMap[ind];
            const userId = userIdMap[ind];
            const indLabel = ind.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            // A. Load Documents
            const docsPath = path.join(indDir, 'documents.json');
            if (fs.existsSync(docsPath)) {
                const raw = fs.readFileSync(docsPath, 'utf8');
                const docs = JSON.parse(raw);
                for (const doc of docs) {
                    const docId = stringToUuid(`doc-${ind}-${doc.id}`);
                    mockDb.knowledge_documents.push({
                        id: docId,
                        company_id: compId,
                        filename: doc.title + '.pdf',
                        file_url: doc.file_url || `https://supabase.co/storage/v1/object/public/documents/${ind}/${doc.title}.pdf`,
                        file_type: 'application/pdf',
                        char_count: doc.content.length,
                        industry: indLabel,
                        category: doc.category || 'General',
                        created_at: new Date().toISOString()
                    });
                    // Procedural chunks
                    const text = doc.content;
                    const chunkSize = 400;
                    let chunkIdx = 0;
                    for (let offset = 0; offset < text.length; offset += chunkSize) {
                        mockDb.document_chunks.push({
                            id: stringToUuid(`chunk-${docId}-${chunkIdx}`),
                            document_id: docId,
                            content: text.substring(offset, offset + chunkSize),
                            embedding: null,
                            metadata: { company_id: compId, filename: doc.title + '.pdf', industry: indLabel, category: doc.category },
                            created_at: new Date().toISOString()
                        });
                        chunkIdx++;
                    }
                }
            }
            // B. Load Tickets
            const ticketsPath = path.join(indDir, 'tickets.json');
            if (fs.existsSync(ticketsPath)) {
                const raw = fs.readFileSync(ticketsPath, 'utf8');
                const tickets = JSON.parse(raw);
                for (const t of tickets) {
                    mockDb.tickets.push({
                        id: stringToUuid(`ticket-${ind}-${t.id}`),
                        conversation_id: null,
                        company_id: compId,
                        title: t.subject,
                        description: t.description,
                        priority: t.priority,
                        status: t.status,
                        assigned_to_user_id: userId,
                        created_at: t.createdAt,
                        conversations: {
                            customer_email: t.email,
                            customer_name: t.customerName
                        }
                    });
                }
            }
            // C. Load Conversations & Messages
            const convsPath = path.join(indDir, 'conversations.json');
            if (fs.existsSync(convsPath)) {
                const raw = fs.readFileSync(convsPath, 'utf8');
                const convs = JSON.parse(raw);
                for (const c of convs) {
                    const convId = stringToUuid(`conv-${ind}-${c.id}`);
                    mockDb.conversations.push({
                        id: convId,
                        company_id: compId,
                        customer_email: c.customerEmail,
                        customer_name: c.customerEmail.split('@')[0],
                        status: c.status,
                        industry: indLabel,
                        created_at: new Date().toISOString()
                    });
                    for (let mIdx = 0; mIdx < c.messages.length; mIdx++) {
                        const m = c.messages[mIdx];
                        mockDb.messages.push({
                            id: stringToUuid(m.id || `msg-${convId}-${mIdx}`),
                            conversation_id: convId,
                            sender: m.sender,
                            content: m.content,
                            sentiment: m.sentiment || null,
                            citations: m.citations || null,
                            feedback: null,
                            created_at: m.timestamp || new Date().toISOString()
                        });
                    }
                }
            }
        }
        console.log(`[Mock DB] Seed data loaded successfully from JSON files: ${mockDb.knowledge_documents.length} docs, ${mockDb.tickets.length} tickets, ${mockDb.conversations.length} conversations.`);
    }
    catch (err) {
        console.error('Failed to load JSON seed data in mockDb:', err);
    }
}
// Execute immediately upon import
loadSeedData();
