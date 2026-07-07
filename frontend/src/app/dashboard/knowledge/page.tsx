'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Search, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  FileCheck,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface KnowledgeDoc {
  id: string;
  filename: string;
  file_url: string;
  file_type: string;
  char_count: number;
  industry?: string;
  category?: string;
  created_at: string;
}

export default function KnowledgeBase() {
  const { company, showToast } = useApp();
  
  // States
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getCategories = () => {
    const industry = company?.industry || 'Customer Support';
    switch (industry) {
      case 'Legal': return ['Contracts', 'Policies', 'Compliance'];
      case 'Manufacturing': return ['Manuals', 'SOPs', 'Safety Documents'];
      case 'Sales': return ['Pricing', 'Brochures', 'Catalogs'];
      case 'Retail': return ['Products', 'Shipping', 'Returns'];
      default: return ['FAQs', 'Refund Policy', 'Troubleshooting'];
    }
  };

  const categories = getCategories();
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    if (!company) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/knowledge?company_id=${company.id}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        showToast('Failed to load knowledge directory', 'error');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      showToast('Server connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    const cats = getCategories();
    setSelectedCategory(cats[0]);
  }, [company]);

  // Handle file drops / uploads
  const handleFileUpload = async (file: File) => {
    if (!company) return;
    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('company_id', company.id);
    formData.append('industry', company.industry || 'Customer Support');
    formData.append('category', selectedCategory);

    setUploadProgress(40);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/knowledge/upload`, {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to process document');
      }

      setUploadProgress(100);
      setSuccessMessage(`"${file.name}" uploaded and indexed successfully into ${resData.chunks_count} vector chunks!`);
      showToast(`Ingested ${file.name} successfully!`, 'success');
      
      // Celebrate!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#3B82F6', '#10B981']
      });

      loadDocuments();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(err.message || 'File ingestion failed. Check if server and database are active.');
      showToast('Document ingestion failed', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Delete document
  const deleteDoc = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document? All corresponding vector chunks and embeddings will be permanently removed.')) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/knowledge/${docId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccessMessage('Document deleted successfully.');
        showToast('Document deleted successfully', 'success');
        loadDocuments();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      setErrorMessage(err.message || 'Failed to delete document.');
      showToast('Failed to delete document', 'error');
    }
  };

  // Filter documents by search string
  const filteredDocs = documents.filter(doc => 
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Semantic Knowledge</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Knowledge Base</h1>
        <p className="text-sm text-gray-400">Upload documentation, return policies, user manuals, and pricing CSVs. SupportAI grounds answers in these sources.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Card Panel */}
        <div className="glass-card rounded-2xl p-6 h-fit space-y-6">
          <div>
            <h2 className="font-bold text-white text-md">Ingest Documents</h2>
            <p className="text-xs text-gray-400 mt-1">Upload knowledge to create vectors. SupportAI parses and indexes them instantly.</p>
          </div>

          {/* Category Dropdown Selection */}
          <div>
            <label className="text-xs text-gray-400 font-semibold mb-1 block">Document Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl text-xs px-3.5 py-2 text-white focus:outline-none focus:border-violet-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span className="text-[10px] text-gray-500 block mt-1">Ingests metadata scoped to category & {company?.industry || 'active'} industry.</span>
          </div>

          {/* Drag & Drop Zone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-violet-500/5 ${
              isUploading ? 'border-violet-500 bg-violet-600/5 pointer-events-none' : 'border-white/10 hover:border-violet-500/40'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onFileChange} 
              accept=".pdf,.docx,.txt,.csv"
              className="hidden" 
            />
            {isUploading ? (
              <div className="space-y-4 w-full">
                <div className="relative w-12 h-12 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-white font-semibold block">Indexing vectors...</span>
                  <span className="text-[10px] text-gray-400 block font-bold">Category: {selectedCategory}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-violet-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-gray-400 group-hover:text-white transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white">Click to upload file</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT, or FAQ CSV</p>
                <p className="text-[10px] text-gray-500 mt-3 font-semibold">Max size: 10MB</p>
              </>
            )}
          </div>

          {/* Feedback alerts */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs animate-fade-in">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* CSV Formatting Tip */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-violet-400" />
              <span>FAQ CSV Format Guide</span>
            </span>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Create a CSV file with two columns named <code className="px-1 py-0.5 rounded bg-black/40 text-violet-300">Question</code> and <code className="px-1 py-0.5 rounded bg-black/40 text-violet-300">Answer</code>. SupportAI will parse each row as a distinct Q&A node.
            </p>
          </div>
        </div>
 
        {/* Knowledge Directory Table */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col h-[500px]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-bold text-white text-md">Document Ingest Log</h2>
              <p className="text-xs text-gray-400 mt-1">Directory of semantic files compiled into the vector database.</p>
            </div>
            
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-violet-500/50 text-white placeholder-gray-500"
              />
            </div>
          </div>
 
          <div className="flex-1 overflow-y-auto pr-1">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">No documents uploaded</h4>
                  <p className="text-xs text-gray-400 mt-1">Upload business documents on the left panel to populate the database.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocs.map((doc) => (
                  <div 
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                        {doc.file_type.includes('csv') ? <FileCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate pr-4">{doc.filename}</h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Category: <span className="text-violet-400 font-bold">{doc.category || 'General'}</span> • Industry: <span className="text-blue-400 font-bold">{doc.industry || 'Customer Support'}</span>
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Size: <span className="text-gray-400">{(doc.char_count / 1000).toFixed(1)}k chars</span> • Ingested {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
 
                    <button
                      onClick={() => deleteDoc(doc.id)}
                      className="w-9 h-9 rounded-xl border border-white/5 hover:border-red-500/20 hover:bg-red-500/10 text-gray-400 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                      title="Delete document and embeddings"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
 
      </div>
    </div>
  );
}
