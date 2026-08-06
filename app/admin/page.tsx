'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart, Users, CheckCircle2, CircleDashed, Camera, Video, Mic,
  Plus, Loader2, BarChart3, Settings, QrCode, Upload, LogOut, Sparkles,
  TrendingUp, Table2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { generateSlug } from '@/lib/utils';
import { FREE_GUEST_LIMIT, isAccountPremium, isWeddingUnlocked } from '@/lib/types';
import type { Wedding, Guest, Submission, DashboardStats, Profile } from '@/lib/types';
import { Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const isPremium = isAccountPremium(profile);
  const canCreateWedding = isPremium || weddings.length === 0;

  // form state
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');

  const fetchWeddings = useCallback(async () => {
    const { data, error } = await supabase
      .from('weddings')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Could not load your weddings');
      return;
    }
    setWeddings((data as Wedding[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWeddings();
  }, [fetchWeddings]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      const displayName = `${p1} & ${p2}`;
      const { data, error } = await supabase
        .from('weddings')
        .insert({
          admin_user_id: user!.id,
          partner_one_name: p1,
          partner_two_name: p2,
          couple_display_name: displayName,
          wedding_date: date || null,
          venue: venue || null,
          guest_slug: generateSlug(),
          admin_slug: generateSlug(),
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      toast.success(`${displayName} created`);
      setCreateOpen(false);
      setP1(''); setP2(''); setDate(''); setVenue('');
      router.push(`/admin/w/${(data as Wedding).admin_slug}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create wedding');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen luxury-gradient">
      {/* Top nav */}
      <nav className="sticky top-0 z-40 glass-nav">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-semibold">EverAfter</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-1" /> Sign out
            </Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-medium tracking-tight">Your weddings</h1>
            <p className="text-muted-foreground mt-1">Manage your guest books and track progress</p>
          </div>
          <Button
            onClick={() => canCreateWedding ? setCreateOpen(true) : null}
            disabled={!canCreateWedding}
            className="rounded-full"
            title={canCreateWedding ? '' : 'Free accounts are limited to 1 wedding. Upgrade to create more.'}
          >
            <Plus className="h-4 w-4 mr-1" /> New wedding
          </Button>
        </div>

        {weddings.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-medium mb-2">No weddings yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first wedding guest book. You'll get a unique QR code and guest link to share with everyone.
            </p>
            <Button onClick={() => setCreateOpen(true)} size="lg" className="rounded-full">
              <Plus className="h-4 w-4 mr-1" /> Create your first wedding
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weddings.map((w) => (
              <WeddingCard key={w.id} wedding={w} profile={profile} />
            ))}
          </div>
        )}

        {!canCreateWedding && weddings.length > 0 && (
          <div className="glass-card p-8 mt-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-display text-xl font-medium mb-2">1 wedding per account on the free plan</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You've created your free wedding. Upgrade this wedding to unlock unlimited guests, or contact us about premium accounts for multiple weddings.
            </p>
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Create a wedding</DialogTitle>
            <DialogDescription>
              You'll get a unique QR code and guest link to share with your guests.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="p1">Partner one</Label>
                <Input id="p1" required value={p1} onChange={(e) => setP1(e.target.value)} placeholder="Barry" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p2">Partner two</Label>
                <Input id="p2" required value={p2} onChange={(e) => setP2(e.target.value)} placeholder="Hannah" className="h-11" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Wedding date</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue (optional)</Label>
                <Input id="venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="The Grand Hall" className="h-11" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create wedding'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WeddingCard({ wedding, profile }: { wedding: Wedding; profile: Profile | null }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const unlocked = isWeddingUnlocked(wedding, profile);

  useEffect(() => {
    async function load() {
      const { count: total } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })
        .eq('wedding_id', wedding.id);

      const { count: completed } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })
        .eq('wedding_id', wedding.id)
        .eq('completed', true);

      const { count: photos } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('wedding_id', wedding.id)
        .not('photo_path', 'is', null);

      const { count: videos } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('wedding_id', wedding.id)
        .not('video_path', 'is', null);

      const t = total ?? 0;
      const c = completed ?? 0;
      setStats({
        totalGuests: t,
        completed: c,
        remaining: t - c,
        completionPct: t > 0 ? Math.round((c / t) * 100) : 0,
        photosUploaded: photos ?? 0,
        videosUploaded: videos ?? 0,
        voiceUploaded: 0,
        averageMessageLength: 0,
        mostActiveTable: null,
      });
    }
    load();
  }, [wedding.id]);

  return (
    <Link href={`/admin/w/${wedding.admin_slug}`}>
      <div className="glass-card p-6 hover:shadow-lg transition-all hover:-translate-y-0.5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-medium">{wedding.couple_display_name}</h3>
            <p className="text-sm text-muted-foreground">
              {wedding.wedding_date ?? 'Date not set'}
              {wedding.venue ? ` · ${wedding.venue}` : ''}
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            wedding.status === 'live' ? 'bg-green-500/10 text-green-700 dark:text-green-400' :
            wedding.status === 'archived' ? 'bg-muted text-muted-foreground' :
            'bg-amber-500/10 text-amber-700 dark:text-amber-400'
          }`}>
            {wedding.status}
          </span>
        </div>

        {!unlocked && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 mb-3">
            <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Free plan · {FREE_GUEST_LIMIT} guest limit
            </span>
          </div>
        )}
        {unlocked && (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 mb-3">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              Unlocked · unlimited guests
            </span>
          </div>
        )}

        {stats && stats.totalGuests > 0 ? (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium">{stats.completionPct}%</span>
              </div>
              <Progress value={stats.completionPct} className="h-2" />
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{stats.totalGuests} guests</span>
              <span>{stats.completed} done</span>
              <span>{stats.photosUploaded} photos</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No guests added yet</p>
        )}
      </div>
    </Link>
  );
}
