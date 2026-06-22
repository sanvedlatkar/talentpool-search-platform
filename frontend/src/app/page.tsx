"use client"

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, Users, Filter, ArrowRight, 
  Loader2, Briefcase, MapPin, LayoutGrid, 
  List, Sparkles, X, PlusCircle, TrendingUp, CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCandidates, Candidate } from '@/lib/api';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [minExp, setMinExp] = useState<string>('0');
  const [location, setLocation] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getCandidates();
      setCandidates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = q === '' || 
        // FIX: guard name and current_title — both can be null from DB
        (c.name ?? '').toLowerCase().includes(q) || 
        (c.current_title ?? '').toLowerCase().includes(q);
      const matchesExp = (c.experience_years || 0) >= parseInt(minExp);
      const matchesLoc = location === '' || (c.location?.toLowerCase().includes(location.toLowerCase()));
      return matchesSearch && matchesExp && matchesLoc;
    });
  }, [candidates, searchQuery, minExp, location]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (minExp !== '0') count++;
    if (location) count++;
    return count;
  }, [searchQuery, minExp, location]);

  const clearFilters = () => {
    setSearchQuery('');
    setMinExp('0');
    setLocation('');
  };

  // FIX: helper to safely get avatar initial
  const getInitial = (name: string | null | undefined) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Talent Intelligence</h1>
          <p className="text-muted-foreground">Manage and discover top-tier professional talent.</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="hidden sm:block">
            <TabsList className="grid w-24 grid-cols-2">
              <TabsTrigger value="grid" className="p-1"><LayoutGrid className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="table" className="p-1"><List className="w-4 h-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
          <Link href="/upload">
            <Button className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Add Candidate
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-muted/30 border-none shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Talent</p>
              <p className="text-xl font-bold">{candidates.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-none shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Matched Results</p>
              <p className="text-xl font-bold">{filtered.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-none shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Experience</p>
              <p className="text-xl font-bold">
                {candidates.length > 0 
                  ? (candidates.reduce((acc, c) => acc + (c.experience_years || 0), 0) / candidates.length).toFixed(1) 
                  : 0}y
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-none shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <Filter className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Filters</p>
              <p className="text-xl font-bold">{activeFiltersCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <div className="space-y-4">
        <Card className="shadow-sm border-muted">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search candidates, skills, or titles..." 
                  className="pl-9 bg-muted/20 border-transparent focus:bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Location..." 
                  className="pl-9 bg-muted/20 border-transparent focus:bg-background"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <Select value={minExp} onValueChange={setMinExp}>
                <SelectTrigger className="bg-muted/20 border-transparent">
                  <SelectValue placeholder="Experience Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any Experience</SelectItem>
                  <SelectItem value="2">2+ Years</SelectItem>
                  <SelectItem value="5">5+ Years</SelectItem>
                  <SelectItem value="10">10+ Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight mr-2">Filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1 rounded-md bg-primary/5 text-primary border-primary/20">
                Keyword: {searchQuery}
                <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => setSearchQuery('')} />
              </Badge>
            )}
            {location && (
              <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1 rounded-md bg-primary/5 text-primary border-primary/20">
                Location: {location}
                <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => setLocation('')} />
              </Badge>
            )}
            {minExp !== '0' && (
              <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1 rounded-md bg-primary/5 text-primary border-primary/20">
                Exp: {minExp}+ years
                <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => setMinExp('0')} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7 hover:bg-transparent hover:text-primary">
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Results View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm font-medium animate-pulse">Syncing talent pool...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed border-muted">
          <div className="bg-muted/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold">No candidates found</h3>
          <p className="text-muted-foreground max-w-xs mx-auto mt-1">Try adjusting your filters or search keywords to find what you're looking for.</p>
          <Button variant="outline" className="mt-6" onClick={clearFilters}>Reset Filters</Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <Card key={c.id} className="group hover:shadow-xl transition-all duration-300 border-muted hover:border-primary/30">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shadow-inner">
                    {/* FIX 1: grid avatar — was c.name.charAt(0) */}
                    {getInitial(c.name)}
                  </div>
                  <Badge variant="secondary" className="font-semibold bg-muted text-foreground border-none">
                    {c.experience_years ?? 0}y Experience
                  </Badge>
                </div>
                <div className="mt-4">
                  {/* FIX: name and title display guards */}
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                    {c.name || 'Unknown'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1 font-medium">
                    <Briefcase className="w-4 h-4 text-primary/70" />
                    {c.current_title || 'N/A'}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center text-sm text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4 mr-1.5 text-primary/70" />
                  {c.location || 'Distributed'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(c.raw_json?.top_skills || ['Cloud', 'Product', 'DevOps']).map((s: string) => (
                    <Badge key={s} variant="outline" className="text-[10px] py-0 border-muted-foreground/20 font-medium">
                      {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-muted/50">
                <Link href={`/candidate?id=${c.id}`} className="w-full">
                  <Button variant="ghost" className="w-full justify-between group/btn hover:bg-primary/5 hover:text-primary">
                    View Portfolio
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden border-muted shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold py-4">Candidate</TableHead>
                <TableHead className="font-bold py-4">Current Role</TableHead>
                <TableHead className="font-bold py-4">Location</TableHead>
                <TableHead className="font-bold py-4">Exp</TableHead>
                <TableHead className="text-right py-4 pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="hover:bg-primary/5 transition-colors">
                  <TableCell className="font-bold py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {/* FIX 2: table avatar — was c.name.charAt(0) */}
                        {getInitial(c.name)}
                      </div>
                      {/* FIX: name display guard */}
                      {c.name || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-medium">{c.current_title || 'N/A'}</TableCell>
                  <TableCell className="text-muted-foreground">{c.location || 'Remote'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold text-xs">{c.experience_years ?? 0}y</Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Link href={`/candidate?id=${c.id}`}>
                      <Button size="sm" variant="ghost" className="hover:bg-primary/10 hover:text-primary">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}