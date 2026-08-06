'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Loader2, Search, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

interface GuestEntry {
  id: string;
  first_name: string;
  last_name: string;
  access_token: string;
  completed: boolean;
}

interface WeddingInfo {
  couple_display_name: string;
  welcome_message: string;
}

export default function GuestListPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [wedding, setWedding] = useState<WeddingInfo | null>(null);
  const [guests, setGuests] = useState<GuestEntry[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.functions.invoke('wedding-guests', {
          body: { slug: params.slug },
        });
        if (error || !data || data.error) {
          toast.error(data?.error === 'Wedding not found' ? 'Wedding not found' : 'Could not load the wedding');
          router.push('/');
          return;
        }
        setWedding(data.wedding);
        setGuests(data.guests ?? []);
      } catch {
        toast.error('Could not load the wedding');
        router.push('/');
        return;
      }
      setLoading(false);
    }
    load();
  }, [params.slug, router]);

  const filtered = search
    ? guests.filter(g => `${g.first_name} ${g.last_name}`.toLowerCase().includes(search.toLowerCase()))
    : guests;

  // Group by first letter
  const grouped = filtered.reduce((acc, g) => {
    const letter = g.first_name[0]?.toUpperCase() ?? '?';
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(g);
    return acc;
  }, {} as Record<string, GuestEntry[]>);

  if (loading) {
    return (
      <div className="min-h-screen luxury-gradient flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen luxury-gradient">
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Welcome */}
        <div className="text-center mb-10 animate-fade-up">
          <Heart className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight">
            Welcome to {wedding?.couple_display_name}&rsquo;s Wedding
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">{wedding?.welcome_message}</p>
        </div>

        {/* Find name */}
        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <p className="text-center text-sm font-medium text-muted-foreground mb-4">Find your name to get started</p>
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search your name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-14 pl-12 text-base rounded-2xl glass"
            />
          </div>

          {Object.keys(grouped).length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {search ? 'No matches found.' : 'No guests yet.'}
            </p>
          ) : (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pb-20">
              {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([letter, list]) => (
                <div key={letter}>
                  <p className="font-display text-sm font-medium text-muted-foreground mb-2 sticky top-0 bg-background/80 backdrop-blur-sm py-1">
                    {letter}
                  </p>
                  <div className="space-y-1">
                    {list.map(g => (
                      <button
                        key={g.id}
                        onClick={() => router.push(`/guest/${g.access_token}`)}
                        className="w-full flex items-center justify-between p-4 rounded-xl glass hover:shadow-md transition-all hover:-translate-y-0.5 text-left"
                      >
                        <span className="font-medium">{g.first_name} {g.last_name}</span>
                        {g.completed ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <Check className="h-3.5 w-3.5" /> Done
                          </span>
                        ) : (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
