"use client"

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Mail, Phone, Linkedin, Github, 
  MapPin, Briefcase, Award, 
  ChevronLeft, Loader2, Sparkles, Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getCandidate } from '@/lib/api';

function CandidateProfileContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) {
        setIsLoading(false);
        return;
      }
      try {
        const result = await getCandidate(id);
        console.log("API Result:", result); // Debugging line
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Retrieving candidate dossiers...</p>
      </div>
    );
  }

  if (!data || !data.candidate) return <div className="p-10 text-center">Profile not found.</div>;

  const { candidate, skills, projects, certifications } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back to Pool
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Hero & Contact */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden">
            <div className="h-24 bg-primary/10 relative" />
            <div className="px-6 pb-6 -mt-12 relative text-center">
              <div className="w-24 h-24 rounded-2xl bg-background border-4 border-background shadow-lg mx-auto flex items-center justify-center text-4xl font-bold text-primary">
                {candidate.name?.charAt(0) || '?'}
              </div>
              <h1 className="text-2xl font-bold mt-4">{candidate.name || 'Unknown'}</h1>
              <p className="text-muted-foreground font-medium">{candidate.current_title || 'N/A'}</p>
              
              {/* Updated Social Links Section */}
              <div className="mt-6 flex justify-center gap-2">
                {candidate.linkedin_url && (
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0" asChild>
                    <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                {candidate.github_url && (
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0" asChild>
                    <a href={candidate.github_url} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                {/* Fallback check for portfolio if needed */}
                {candidate.portfolio_url && (
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0" asChild>
                    <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>

              <Separator className="my-6" />

              <div className="space-y-4 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{candidate.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{candidate.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{candidate.location || 'N/A'}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Competencies</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(skills || []).map((s: any, idx: number) => (
                <Badge key={idx} variant="secondary">
                  {typeof s === 'string' ? s : (s.skill || 'Skill')}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Experience & Projects */}
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Strategic Projects
            </h2>
            <div className="grid gap-4">
              {(projects || []).map((p: any, idx: number) => (
                <Card key={idx} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold">{p.project_name || 'Project'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{p.description || ''}</p>
                    <div className="flex flex-wrap gap-2">
                      {(p.technologies || []).map((t: string, tIdx: number) => (
                        <span key={tIdx} className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{t}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Certifications
            </h2>
            <div className="grid gap-3">
              {(certifications || []).map((c: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold">{c.certification_name || 'Certification'}</p>
                      <p className="text-sm text-muted-foreground">{c.provider || 'N/A'}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20">{c.status || 'Verified'}</Badge>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function CandidateProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    }>
      <CandidateProfileContent />
    </Suspense>
  );
}