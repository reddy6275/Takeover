import { Router, Request, Response } from 'express';
import multer from 'multer';
import { supabase } from '../config/supabase.js';
import { parseDocument, chunkText, generateEmbeddings, storeDocumentInDb, similaritySearch } from '../services/ragService.js';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

/**
 * POST /api/knowledge/upload
 * Expects company_id and a file
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { company_id, industry, category } = req.body;
    const file = req.file;

    if (!company_id) {
       res.status(400).json({ error: 'company_id is required' });
       return;
    }
    if (!file) {
       res.status(400).json({ error: 'No file uploaded' });
       return;
    }

    const filename = file.originalname;
    const fileType = file.mimetype;
    const buffer = file.buffer as Buffer;

    console.log(`Processing file: ${filename} (${fileType}), size: ${buffer.length} bytes for company ${company_id}`);

    // 1. Parse text from document
    let parsedText = '';
    try {
      parsedText = await parseDocument(buffer, fileType || filename);
    } catch (parseError: any) {
      console.error('Failed to parse document text:', parseError);
       res.status(422).json({ error: `Could not parse document file: ${parseError.message}` });
       return;
    }

    if (!parsedText || !parsedText.trim()) {
       res.status(422).json({ error: 'Extracted text is empty. Please check the document content.' });
       return;
    }

    // 2. Split into chunks
    const chunks = chunkText(parsedText);
    console.log(`Split document into ${chunks.length} chunks`);

    // 3. Generate embeddings
    let embeddings: number[][] = [];
    try {
      embeddings = await generateEmbeddings(chunks);
    } catch (embedError: any) {
      console.error('Gemini Embedding error:', embedError);
       res.status(502).json({ error: `Gemini embedding generation failed: ${embedError.message || embedError}` });
       return;
    }

    // 4. Upload file to Supabase storage or fallback
    let fileUrl = '';
    const fileCleanName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storagePath = `knowledge/${company_id}/${fileCleanName}`;

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, buffer, {
          contentType: fileType,
          upsert: true
        });

      if (uploadError) {
        console.warn('Supabase storage upload failed, using local fallback URL:', uploadError.message);
        fileUrl = `https://supabase.co/storage/v1/object/public/documents/${storagePath}`;
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('documents')
          .getPublicUrl(storagePath);
        fileUrl = publicUrlData.publicUrl;
      }
    } catch (storageErr) {
      console.warn('Storage error, falling back:', storageErr);
      fileUrl = `https://supabase.co/storage/v1/object/public/documents/${storagePath}`;
    }

    // 5. Store document metadata and chunks in Supabase database
    const documentId = await storeDocumentInDb(
      company_id,
      filename,
      fileUrl,
      fileType,
      parsedText,
      chunks,
      embeddings,
      industry,
      category
    );

    res.status(201).json({
      message: 'Document processed and ingested successfully',
      document_id: documentId,
      filename,
      chunks_count: chunks.length,
      char_count: parsedText.length,
      file_url: fileUrl,
    });
  } catch (error: any) {
    console.error('Error during document ingestion:', error);
    res.status(500).json({ error: error.message || 'Internal server error during upload' });
  }
});

/**
 * GET /api/knowledge
 * Query params: company_id
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { company_id } = req.query;
    if (!company_id) {
       res.status(400).json({ error: 'company_id query param is required' });
       return;
    }

    const { data, error } = await supabase
      .from('knowledge_documents')
      .select('id, filename, file_url, file_type, char_count, created_at, industry, category')
      .eq('company_id', company_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ documents: data || [] });
  } catch (error: any) {
    console.error('Error listing documents:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * DELETE /api/knowledge/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {

    // First retrieve metadata to delete from storage if needed
    const { data: doc, error: fetchError } = await supabase
      .from('knowledge_documents')
      .select('file_url')
      .eq('id', id)
      .single();

    if (fetchError) {
       res.status(404).json({ error: 'Document not found' });
       return;
    }

    // Delete from DB (on delete cascade deletes chunks)
    const { error: deleteError } = await supabase
      .from('knowledge_documents')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Attempt to delete from Supabase storage (non-blocking)
    try {
      if (doc?.file_url) {
        const urlParts = doc.file_url.split('/public/documents/');
        if (urlParts.length > 1) {
          const path = urlParts[1];
          await supabase.storage.from('documents').remove([path]);
        }
      }
    } catch (storageErr) {
      console.warn('Non-blocking: could not delete file from storage bucket:', storageErr);
    }

    res.json({ message: 'Document and its vector embeddings deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/knowledge/search
 * Similarity search test endpoint
 */
router.post('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { company_id, query, limit } = req.body;
    if (!company_id || !query) {
       res.status(400).json({ error: 'company_id and query are required' });
       return;
    }

    const results = await similaritySearch(query, company_id, limit || 5);
    res.json({ results });
  } catch (error: any) {
    console.error('Error searching database chunks:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
