"use client"

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, AlertCircle, 
  Loader2, ArrowRight, ShieldCheck, 
  CloudUpload, FileText, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

type UploadStep = 'SELECT' | 'PROCESSING' | 'SUCCESS';

interface FileStatus {
  file: File;
  progress: number;
  status: 'PENDING' | 'UPLOADING' | 'SUCCESS' | 'ERROR';
  candidateId?: string;
  error?: string;
}

export default function UploadPage() {
  const [step, setStep] = useState<UploadStep>('SELECT');
  const [fileList, setFileList] = useState<FileStatus[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  // AWS API Gateway URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => 
      file.type.includes('pdf') || file.name.endsWith('.docx')
    );

    if (validFiles.length < selectedFiles.length) {
      toast({ 
        title: "Format mismatch", 
        description: "Some files were skipped. Only PDF and DOCX are supported.", 
        variant: "destructive" 
      });
    }

    if (validFiles.length > 0) {
      setFileList(prev => [
        ...prev, 
        ...validFiles.map(f => ({ file: f, progress: 0, status: 'PENDING' as const }))
      ]);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFileList(prev => prev.filter((_, i) => i !== index));
  };

  const startUpload = async () => {
    if (fileList.length === 0) return;
    setStep('PROCESSING');
    
    const updatedFileList = [...fileList];

    for (let i = 0; i < updatedFileList.length; i++) {
      const item = updatedFileList[i];
      if (item.status === 'SUCCESS') continue;

      try {
        item.status = 'UPLOADING';
        item.progress = 10;
        setFileList([...updatedFileList]);

        // 1. Get Presigned URL from API Gateway
        const urlRes = await fetch(`${API_URL}/upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_name: item.file.name, content_type: item.file.type || 'application/pdf' })
        });
        if (!urlRes.ok) throw new Error('Failed to request secure upload link.');
        const { upload_url, candidate_id, s3_key } = await urlRes.json();

        item.candidateId = candidate_id;
        item.progress = 40;
        setFileList([...updatedFileList]);
        
        // 2. Upload file directly to AWS S3 using the Presigned URL
        const uploadRes = await fetch(upload_url, {
          method: 'PUT',
          headers: { 'Content-Type': item.file.type || 'application/pdf' },
          body: item.file
        });
        if (!uploadRes.ok) throw new Error('Failed to upload file to S3 storage.');

        item.progress = 80;
        setFileList([...updatedFileList]);
        
        // 3. Notify API Gateway to trigger SQS and Processor
        const completeRes = await fetch(`${API_URL}/upload-complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidate_id, s3_key })
        });
        if (!completeRes.ok) throw new Error('Failed to queue file for AI processing.');

        item.progress = 100;
        item.status = 'SUCCESS';
        setFileList([...updatedFileList]);
      } catch (err: any) {
        item.status = 'ERROR';
        item.error = err.message || 'Processing failed.';
        setFileList([...updatedFileList]);
      }
    }

    setStep('SUCCESS');
  };

  const successCount = fileList.filter(f => f.status === 'SUCCESS').length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8 animate-in">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Ingest Talent</h1>
        <p className="text-muted-foreground text-lg font-medium">Our AI engine will parse and index multiple resumes automatically.</p>
      </div>

      <Card className="shadow-2xl border-border bg-card overflow-hidden">
        <CardContent className="p-0">
          {step === 'SELECT' && (
            <div className="p-10 space-y-8">
              <div 
                className="border-2 border-dashed border-primary/20 rounded-2xl p-16 text-center hover:bg-primary/5 transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".pdf,.docx" 
                  multiple 
                />
                <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-inner">
                  <CloudUpload className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Select Resume Files</h3>
                <p className="text-muted-foreground mt-2 font-medium">PDF or DOCX</p>
              </div>

              {fileList.length > 0 && (
                <div className="space-y-4 animate-in">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Queue ({fileList.length})</h4>
                    <Button variant="ghost" size="sm" onClick={() => setFileList([])} className="h-7 text-xs text-destructive hover:bg-destructive/10">Clear All</Button>
                  </div>
                  
                  <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2">
                    {fileList.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50 group/item hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="bg-background p-2 rounded-lg shadow-sm border border-border">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold truncate max-w-[200px] md:max-w-[400px]">{item.file.name}</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase">{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <Button onClick={startUpload} className="w-full mt-6 h-14 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                    Start Intelligence Batch
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 'PROCESSING' && (
            <div className="p-10 space-y-8 animate-in">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                  <Loader2 className="w-16 h-16 text-primary animate-spin relative" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold">Processing Talent Pool</h3>
                  <p className="text-sm text-muted-foreground font-medium">
                    {fileList.filter(f => f.status === 'SUCCESS' || f.status === 'ERROR').length} of {fileList.length} files parsed
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {fileList.map((item, idx) => (
                  <div key={idx} className="space-y-3 p-5 rounded-2xl border bg-muted/10 border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-background p-2 rounded-lg border border-border shadow-sm">
                          {item.status === 'UPLOADING' ? (
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          ) : item.status === 'SUCCESS' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : item.status === 'ERROR' ? (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          ) : (
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-sm font-bold truncate max-w-[250px]">{item.file.name}</span>
                      </div>
                      <span className="text-xs font-black text-primary">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-2 rounded-full bg-muted shadow-inner" />
                    {item.error && <p className="text-[11px] text-destructive font-bold flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {item.error}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="p-12 text-center space-y-8 animate-in">
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-pulse" />
                <div className="bg-emerald-50 dark:bg-emerald-500/10 w-full h-full rounded-3xl flex items-center justify-center relative border border-emerald-200 dark:border-emerald-500/20 shadow-inner">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-500" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-3xl font-extrabold tracking-tight">Sync Complete</h3>
                <p className="text-muted-foreground text-lg max-w-sm mx-auto">
                  Batch ingestion finished. 
                  <span className="text-foreground font-bold"> {successCount}</span> profiles successfully indexed.
                </p>
              </div>

              <div className="grid gap-2 max-h-[250px] overflow-y-auto border rounded-2xl p-4 bg-muted/5">
                 {fileList.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-medium truncate max-w-[200px] text-left">{item.file.name}</span>
                      </div>
                      {item.status === 'SUCCESS' ? (
                         <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50">SUCCESS</Badge>
                      ) : (
                         <Badge variant="destructive" className="text-[10px] font-bold">FAILED</Badge>
                      )}
                    </div>
                 ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Button variant="outline" size="lg" className="h-14 px-8 font-bold rounded-xl border-2" onClick={() => { setFileList([]); setStep('SELECT'); }}>
                  New Batch
                </Button>
                <Button size="lg" className="h-14 px-8 font-bold rounded-xl shadow-xl shadow-primary/20" onClick={() => router.push('/')}>
                  Talent Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/30 border-t py-6 justify-between text-[11px] text-muted-foreground font-black px-10 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Verified Gateway</div>
          <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Semantic Indexing</div>
        </CardFooter>
      </Card>
    </div>
  );
}