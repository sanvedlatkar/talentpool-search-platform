"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, LayoutDashboard, FileUp, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const pathname = usePathname();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Upload', href: '/upload', icon: FileUp },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary p-1.5 rounded-lg shadow-sm group-hover:scale-105 transition-all">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl tracking-tight text-foreground">
                Talent<span className="text-primary">Pulse</span>
              </span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                    pathname === item.href 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-secondary/50 rounded-lg p-1 border border-border/50">
              <button 
                onClick={() => theme !== 'light' && toggleTheme()}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  theme === 'light' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button 
                onClick={() => theme !== 'dark' && toggleTheme()}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  theme === 'dark' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}