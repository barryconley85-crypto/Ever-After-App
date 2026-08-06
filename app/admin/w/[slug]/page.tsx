'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart, Users, CheckCircle2, CircleDashed, Camera, Video, Mic,
  Loader2, BarChart3, Settings, QrCode, Upload, LogOut, ArrowLeft,
  Search, Table2, Group, Play, Sparkles, TrendingUp, Download,
  Pencil, Trash2, X, Plus, Send, Mail, MessageSquare, Phone
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { formatGuestUrl, formatGuestTokenUrl, getMediaPublicUrl } from '@/lib/utils';
import { FREE_GUEST_LIMIT, isWeddingUnlocked, isAccountPremium } from '@/lib/types';
import type { Wedding, Guest, Submission, DashboardStats, Profile } from '@/lib/types';
import { Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

function UpgradeButton({ wedding, variant = 'default' }: { wedding: Wedding; variant?: 'default' | 'ghost' }) {
  const [redirecting, setRedirecting] = useState(false);

  const handleUpgrade = async () => {
    setRedirecting(true);
    // Stripe checkout will be wired here once Stripe is configured
    toast.info('Payments are coming soon. Contact us to upgrade this wedding.');
    setRedirecting(false);
  };

  return (
    <Button onClick={handleUpgrade} disabled={redirecting} variant={variant} className="rounded-full">
      {redirecting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Crown className="h-4 w-4 mr-1" />}
      Upgrade wedding
    </Button>
  );
}

export default function WeddingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const adminSlug = params.slug as string;

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const fetchWedding = useCallback(async () => {
    const { data, error } = await supabase
      .from('weddings')
      .select('*')
      .eq('admin_slug', adminSlug)
      .maybeSingle();
    if (error || !data) {
      toast.error('Wedding not found');
      router.push('/admin');
      return;
    }
    setWedding(data as Wedding);
    setLoading(false);
  }, [adminSlug, router]);

  const fetchGuests = useCallback(async () => {
    if (!wedding) return;
    const [{ data: g, error: ge }, { data: s, error: se }] = await Promise.all([
      supabase.from('guests').select('*').eq('wedding_id', wedding.id).order('first_name'),
      supabase.from('submissions').select('*').eq('wedding_id', wedding.id).order('submitted_at', { ascending: false }),
    ]);
    if (ge || se) return;
    setGuests((g as Guest[]) ?? []);
    setSubmissions((s as Submission[]) ?? []);
  }, [wedding]);

  useEffect(() => { fetchWedding(); }, [fetchWedding]);
  useEffect(() => { if (wedding) fetchGuests(); }, [wedding, fetchGuests]);

  // realtime
  useEffect(() => {
    if (!wedding) return;
    const channel = supabase
      .channel(`wedding-${wedding.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests', filter: `wedding_id=eq.${wedding.id}` },
        () => fetchGuests())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions', filter: `wedding_id=eq.${wedding.id}` },
        () => fetchGuests())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [wedding, fetchGuests]);

  // compute stats
  useEffect(() => {
    if (!guests.length) {
      setStats({ totalGuests: 0, completed: 0, remaining: 0, completionPct: 0, photosUploaded: 0, videosUploaded: 0, voiceUploaded: 0, averageMessageLength: 0, mostActiveTable: null });
      return;
    }
    const completed = guests.filter(g => g.completed).length;
    const subMap = new Map(submissions.map(s => [s.guest_id, s]));
    const photos = submissions.filter(s => s.photo_path).length;
    const videos = submissions.filter(s => s.video_path).length;
    const voice = submissions.filter(s => s.voice_path).length;
    const avgMsg = submissions.length > 0
      ? Math.round(submissions.reduce((a, s) => a + s.message.length, 0) / submissions.length)
      : 0;

    // most active table
    const tableCount = new Map<string, number>();
    guests.forEach(g => {
      if (g.completed && g.table_number) {
        tableCount.set(g.table_number, (tableCount.get(g.table_number) ?? 0) + 1);
      }
    });
    let mostActiveTable: string | null = null;
    let max = 0;
    tableCount.forEach((v, k) => { if (v > max) { max = v; mostActiveTable = k; } });

    setStats({
      totalGuests: guests.length,
      completed,
      remaining: guests.length - completed,
      completionPct: Math.round((completed / guests.length) * 100),
      photosUploaded: photos,
      videosUploaded: videos,
      voiceUploaded: voice,
      averageMessageLength: avgMsg,
      mostActiveTable,
    });
  }, [guests, submissions]);

  if (loading || !wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen luxury-gradient">
      <nav className="sticky top-0 z-40 glass-nav">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <span className="font-display text-lg font-semibold">{wedding.couple_display_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/slideshow/${wedding.guest_slug}`} target="_blank">
                <Play className="h-4 w-4 mr-1" /> Slideshow
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {!isWeddingUnlocked(wedding, profile) && (
          <div className="glass-card p-5 mb-6 border-2 border-amber-500/30 bg-amber-500/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Free plan — {FREE_GUEST_LIMIT} guests included</p>
                  <p className="text-xs text-muted-foreground">Upgrade this wedding to unlock unlimited guests and keep it forever.</p>
                </div>
              </div>
              <UpgradeButton wedding={wedding} variant="ghost" />
            </div>
          </div>
        )}
        {isWeddingUnlocked(wedding, profile) && (
          <div className="glass-card p-3 mb-6 flex items-center gap-2 justify-center">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">This wedding is unlocked — unlimited guests</span>
          </div>
        )}
        <Tabs defaultValue="dashboard">
          <TabsList className="glass rounded-full p-1 mb-6">
            <TabsTrigger value="dashboard" className="rounded-full">
              <BarChart3 className="h-4 w-4 mr-1.5" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="guests" className="rounded-full">
              <Users className="h-4 w-4 mr-1.5" /> Guest list
            </TabsTrigger>
            <TabsTrigger value="share" className="rounded-full">
              <QrCode className="h-4 w-4 mr-1.5" /> Share
            </TabsTrigger>
            <TabsTrigger value="notify" className="rounded-full">
              <Send className="h-4 w-4 mr-1.5" /> Notify
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-full">
              <Settings className="h-4 w-4 mr-1.5" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab stats={stats} guests={guests} submissions={submissions} wedding={wedding} />
          </TabsContent>
          <TabsContent value="guests">
            <GuestListTab wedding={wedding} guests={guests} onRefresh={fetchGuests} profile={profile} />
          </TabsContent>
          <TabsContent value="share">
            <ShareTab wedding={wedding} guests={guests} />
          </TabsContent>
          <TabsContent value="notify">
            <NotifyTab wedding={wedding} guests={guests} />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab wedding={wedding} onUpdate={fetchWedding} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============ DASHBOARD TAB ============
function DashboardTab({ stats, guests, submissions, wedding }: {
  stats: DashboardStats | null;
  guests: Guest[];
  submissions: Submission[];
  wedding: Wedding;
}) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'remaining'>('all');
  const [filterTable, setFilterTable] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');

  const tables = Array.from(new Set(guests.map(g => g.table_number).filter(Boolean))) as string[];
  const groups = Array.from(new Set(guests.map(g => g.group_name).filter(Boolean))) as string[];

  const filtered = guests.filter(g => {
    if (search) {
      const q = search.toLowerCase();
      if (!`${g.first_name} ${g.last_name}`.toLowerCase().includes(q)) return false;
    }
    if (filterStatus === 'completed' && !g.completed) return false;
    if (filterStatus === 'remaining' && g.completed) return false;
    if (filterTable !== 'all' && g.table_number !== filterTable) return false;
    if (filterGroup !== 'all' && g.group_name !== filterGroup) return false;
    return true;
  });

  const recentSubs = submissions.slice(0, 6);

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Total guests" value={stats.totalGuests} />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="text-green-600 dark:text-green-400" />
        <StatCard icon={CircleDashed} label="Remaining" value={stats.remaining} color="text-amber-600 dark:text-amber-400" />
        <StatCard icon={Camera} label="Photos" value={stats.photosUploaded} />
        <StatCard icon={Video} label="Videos" value={stats.videosUploaded} />
        <StatCard icon={Mic} label="Voice" value={stats.voiceUploaded} />
      </div>

      {/* Progress ring + table completion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-8 flex flex-col items-center justify-center">
          <ProgressRing value={stats.completionPct} />
          <p className="text-sm text-muted-foreground mt-4">Guest completion</p>
          <p className="font-display text-2xl font-medium mt-1">{stats.completed} of {stats.totalGuests}</p>
        </div>

        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="font-display text-lg font-medium mb-4">Table completion</h3>
          {tables.length === 0 ? (
            <p className="text-sm text-muted-foreground">No table numbers assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {tables.sort((a, b) => a.localeCompare(b)).map(table => {
                const tableGuests = guests.filter(g => g.table_number === table);
                const done = tableGuests.filter(g => g.completed).length;
                const pct = tableGuests.length > 0 ? Math.round((done / tableGuests.length) * 100) : 0;
                return (
                  <div key={table}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Table2 className="h-3.5 w-3.5 text-muted-foreground" />
                        Table {table}
                      </span>
                      <span className="text-muted-foreground">{done}/{tableGuests.length} · {pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent uploads */}
      <div className="glass-card p-6">
        <h3 className="font-display text-lg font-medium mb-4">Recent uploads</h3>
        {recentSubs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet. As guests contribute, their photos will appear here.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {recentSubs.map(s => {
              const guest = guests.find(g => g.id === s.guest_id);
              return (
                <div key={s.id} className="aspect-square rounded-xl overflow-hidden glass relative group">
                  {s.photo_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getMediaPublicUrl(s.photo_path)} alt={guest ? `${guest.first_name} ${guest.last_name}` : 'Guest'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Camera className="h-6 w-6" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs font-medium truncate">
                      {guest ? `${guest.first_name} ${guest.last_name}` : 'Guest'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Guest table with filters */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
            <SelectTrigger className="w-full sm:w-40 h-10"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="remaining">Not completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterTable} onValueChange={setFilterTable}>
            <SelectTrigger className="w-full sm:w-36 h-10"><SelectValue placeholder="Table" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tables</SelectItem>
              {tables.map(t => <SelectItem key={t} value={t}>Table {t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="w-full sm:w-36 h-10"><SelectValue placeholder="Group" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
              {groups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No guests match your filters.</p>
          ) : filtered.map(g => (
            <div key={g.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                {g.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <CircleDashed className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">{g.first_name} {g.last_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.table_number ? `Table ${g.table_number}` : 'No table'}
                    {g.group_name ? ` · ${g.group_name}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {g.completed && <Badge variant="secondary" className="text-xs">Done</Badge>}
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/guest/${g.access_token}`} target="_blank">
                    <QrCode className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color ?? 'text-muted-foreground'}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="font-display text-2xl font-medium">{value}</p>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative w-44 h-44">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle
          cx="80" cy="80" r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-medium">{value}%</span>
        <span className="text-xs text-muted-foreground">complete</span>
      </div>
    </div>
  );
}

// ============ GUEST LIST TAB ============
function GuestListTab({ wedding, guests, onRefresh, profile }: {
  wedding: Wedding;
  guests: Guest[];
  onRefresh: () => void;
  profile: Profile | null;
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const unlocked = isWeddingUnlocked(wedding, profile);
  const atLimit = !unlocked && guests.length >= FREE_GUEST_LIMIT;

  async function handleDelete(id: string) {
    if (!confirm('Remove this guest?')) return;
    const { error } = await supabase.from('guests').delete().eq('id', id);
    if (error) { toast.error('Could not remove guest'); return; }
    toast.success('Guest removed');
    onRefresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-medium">Guest list</h2>
          <p className="text-sm text-muted-foreground">{guests.length} guests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => !atLimit && setAddOpen(true)} disabled={atLimit} className="rounded-full">
            <Plus className="h-4 w-4 mr-1" /> Add guest
          </Button>
          <Button onClick={() => !atLimit && setUploadOpen(true)} disabled={atLimit} className="rounded-full">
            <Upload className="h-4 w-4 mr-1" /> Upload CSV
          </Button>
        </div>
      </div>

      {atLimit && (
        <div className="glass-card p-6 border-2 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-medium mb-1">You've reached the {FREE_GUEST_LIMIT}-guest limit</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You have {guests.length} guests on the free plan. Upgrade this wedding to add unlimited guests and unlock everything.
              </p>
              <UpgradeButton wedding={wedding} />
            </div>
          </div>
        </div>
      )}

      {!unlocked && !atLimit && guests.length > 0 && (
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Free plan · {guests.length}/{FREE_GUEST_LIMIT} guests</p>
              <p className="text-xs text-muted-foreground">Upgrade for unlimited guests</p>
            </div>
          </div>
          <UpgradeButton wedding={wedding} variant="ghost" />
        </div>
      )}

      {guests.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg font-medium mb-2">No guests yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Upload a CSV or add guests one by one. Each guest gets a unique QR code.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => setAddOpen(true)} className="rounded-full">
              <Plus className="h-4 w-4 mr-1" /> Add guest
            </Button>
            <Button onClick={() => setUploadOpen(true)} className="rounded-full">
              <Upload className="h-4 w-4 mr-1" /> Upload CSV
            </Button>
          </div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="divide-y divide-border/40">
            {guests.map(g => (
              <div key={g.id} className="flex items-center justify-between p-4 hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-medium ${
                    g.completed ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'
                  }`}>
                    {g.first_name[0]}{g.last_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{g.first_name} {g.last_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.table_number ? `Table ${g.table_number}` : 'No table'}
                      {g.group_name ? ` · ${g.group_name}` : ''}
                      {g.rsvp_status !== 'pending' ? ` · ${g.rsvp_status}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {g.completed && <Badge variant="secondary" className="text-xs mr-2">Done</Badge>}
                  <Button variant="ghost" size="icon" onClick={() => setEditing(g)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} wedding={wedding} onDone={onRefresh} atLimit={atLimit} />
      <AddGuestDialog open={addOpen} onOpenChange={setAddOpen} wedding={wedding} onDone={onRefresh} atLimit={atLimit} />
      <EditGuestDialog guest={editing} onOpenChange={(o) => !o && setEditing(null)} onDone={onRefresh} />
    </div>
  );
}

function UploadDialog({ open, onOpenChange, wedding, onDone, atLimit }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  wedding: Wedding;
  onDone: () => void;
  atLimit?: boolean;
}) {
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<Partial<Guest>[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function parseCSV(text: string): Partial<Guest>[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const cols = line.split(',').map(c => c.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = cols[i] ?? ''; });
      return {
        first_name: row['first name'] || row['firstname'] || row['first'] || '',
        last_name: row['last name'] || row['lastname'] || row['last'] || '',
        mobile_number: row['mobile number'] || row['mobile'] || row['phone'] || null,
        email: row['email'] || null,
        table_number: row['table number'] || row['table'] || null,
        rsvp_status: (row['rsvp status'] || row['rsvp'] || 'pending') as Guest['rsvp_status'],
        group_name: row['group'] || row['group name'] || null,
      };
    }).filter(g => g.first_name);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCSV(reader.result as string);
      setParsed(rows);
      setParsing(false);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (parsed.length === 0) return;
    if (atLimit) { toast.error('Guest limit reached. Upgrade to add more guests.'); return; }
    setImporting(true);
    try {
      const rows = parsed.map(p => ({
        wedding_id: wedding.id,
        first_name: p.first_name!,
        last_name: p.last_name!,
        mobile_number: p.mobile_number ?? null,
        email: p.email ?? null,
        table_number: p.table_number ?? null,
        rsvp_status: (p.rsvp_status ?? 'pending') as Guest['rsvp_status'],
        group_name: p.group_name ?? null,
      }));
      const { error } = await supabase.from('guests').insert(rows);
      if (error) throw error;
      toast.success(`Imported ${rows.length} guests`);
      setParsed([]);
      onOpenChange(false);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Upload guest list</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: First Name, Last Name, Mobile Number, Email, Table Number, RSVP Status, Group.
          </DialogDescription>
        </DialogHeader>

        {parsed.length === 0 ? (
          <div className="space-y-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              {parsing ? (
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium">Click to select a CSV file</p>
                  <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{parsed.length} guests ready to import</p>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    {['First', 'Last', 'Mobile', 'Email', 'Table', 'RSVP', 'Group'].map(h => (
                      <th key={h} className="text-left p-2 font-medium text-xs text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 50).map((g, i) => (
                    <tr key={i} className="border-t border-border/40">
                      <td className="p-2">{g.first_name}</td>
                      <td className="p-2">{g.last_name}</td>
                      <td className="p-2 text-muted-foreground">{g.mobile_number ?? '—'}</td>
                      <td className="p-2 text-muted-foreground">{g.email ?? '—'}</td>
                      <td className="p-2 text-muted-foreground">{g.table_number ?? '—'}</td>
                      <td className="p-2 text-muted-foreground">{g.rsvp_status}</td>
                      <td className="p-2 text-muted-foreground">{g.group_name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => { setParsed([]); onOpenChange(false); }}>Cancel</Button>
          {parsed.length > 0 && (
            <Button onClick={handleImport} disabled={importing}>
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : `Import ${parsed.length} guests`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddGuestDialog({ open, onOpenChange, wedding, onDone, atLimit }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  wedding: Wedding;
  onDone: () => void;
  atLimit?: boolean;
}) {
  const [form, setForm] = useState({ first_name: '', last_name: '', mobile_number: '', email: '', table_number: '', group_name: '' });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.first_name || !form.last_name) { toast.error('First and last name are required'); return; }
    if (atLimit) { toast.error('Guest limit reached. Upgrade to add more guests.'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('guests').insert({
        wedding_id: wedding.id,
        first_name: form.first_name,
        last_name: form.last_name,
        mobile_number: form.mobile_number || null,
        email: form.email || null,
        table_number: form.table_number || null,
        group_name: form.group_name || null,
      });
      if (error) throw error;
      toast.success('Guest added');
      setForm({ first_name: '', last_name: '', mobile_number: '', email: '', table_number: '', group_name: '' });
      onOpenChange(false);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add guest');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add guest</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>First name</Label>
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Last name</Label>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Mobile (optional)</Label>
            <Input value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Email (optional)</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Table number</Label>
            <Input value={form.table_number} onChange={(e) => setForm({ ...form, table_number: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Group</Label>
            <Input value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} placeholder="Bride / Groom / Friends" className="h-11" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add guest'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditGuestDialog({ guest, onOpenChange, onDone }: {
  guest: Guest | null;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({ first_name: '', last_name: '', mobile_number: '', email: '', table_number: '', group_name: '', rsvp_status: 'pending' as Guest['rsvp_status'] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (guest) {
      setForm({
        first_name: guest.first_name,
        last_name: guest.last_name,
        mobile_number: guest.mobile_number ?? '',
        email: guest.email ?? '',
        table_number: guest.table_number ?? '',
        group_name: guest.group_name ?? '',
        rsvp_status: guest.rsvp_status,
      });
    }
  }, [guest]);

  if (!guest) return null;

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await supabase.from('guests').update({
        first_name: form.first_name,
        last_name: form.last_name,
        mobile_number: form.mobile_number || null,
        email: form.email || null,
        table_number: form.table_number || null,
        group_name: form.group_name || null,
        rsvp_status: form.rsvp_status,
      }).eq('id', guest!.id);
      if (error) throw error;
      toast.success('Guest updated');
      onOpenChange(false);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!guest} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Edit guest</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>First name</Label>
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Last name</Label>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Mobile</Label>
            <Input value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Table number</Label>
            <Input value={form.table_number} onChange={(e) => setForm({ ...form, table_number: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Group</Label>
            <Input value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>RSVP status</Label>
            <Select value={form.rsvp_status} onValueChange={(v) => setForm({ ...form, rsvp_status: v as Guest['rsvp_status'] })}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ SHARE TAB ============
function ShareTab({ wedding, guests }: { wedding: Wedding; guests: Guest[] }) {
  const guestUrl = formatGuestUrl(wedding.guest_slug);

  function copyLink() {
    navigator.clipboard.writeText(guestUrl);
    toast.success('Link copied');
  }

  function downloadQR(token: string) {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(formatGuestTokenUrl(token))}`;
    window.open(url, '_blank');
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-8">
        <h2 className="font-display text-2xl font-medium mb-2">Share with your guests</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Guests scan the QR code or open the link. No app install or sign-in needed.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input readOnly value={guestUrl} className="h-12 font-mono text-sm" />
          <Button onClick={copyLink} className="h-12 rounded-full">Copy link</Button>
        </div>

        {/* Master QR */}
        <div className="flex flex-col items-center glass rounded-xl p-6 max-w-xs mx-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(guestUrl)}`}
            alt="Guest QR code"
            className="w-48 h-48 rounded-xl"
          />
          <p className="text-sm text-muted-foreground mt-4 text-center">Guest entrance QR — share this at your venue</p>
        </div>
      </div>

      {/* Individual QR codes */}
      <div className="glass-card p-6">
        <h3 className="font-display text-lg font-medium mb-4">Individual guest QR codes</h3>
        {guests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add guests to generate their personal QR codes.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {guests.map(g => (
              <div key={g.id} className="glass rounded-xl p-3 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(formatGuestTokenUrl(g.access_token))}`}
                  alt={`${g.first_name} ${g.last_name} QR`}
                  className="w-24 h-24 mx-auto rounded-lg"
                />
                <p className="text-xs font-medium mt-2 truncate">{g.first_name} {g.last_name}</p>
                <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs" onClick={() => downloadQR(g.access_token)}>
                  <Download className="h-3 w-3 mr-1" /> QR
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ NOTIFY TAB ============
function NotifyTab({ wedding, guests }: { wedding: Wedding; guests: Guest[] }) {
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'email'>('email');
  const [template, setTemplate] = useState<'welcome' | 'reminder' | 'last_chance' | 'custom'>('welcome');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<{ id: string; channel: string; template: string; recipient_count: number; status: string; created_at: string }[]>([]);

  const templates: Record<string, string> = {
    welcome: `Hi! You're invited to ${wedding.couple_display_name}'s wedding. Leave a message, photo and video for the happy couple:`,
    reminder: `Friendly reminder — ${wedding.couple_display_name} would love your message before the night ends. Add yours here:`,
    last_chance: `Last chance! ${wedding.couple_display_name}'s guest book closes soon. Share your message now:`,
    custom: '',
  };

  useEffect(() => {
    if (template !== 'custom') setMessage(templates[template]);
  }, [template]);

  useEffect(() => {
    async function loadLogs() {
      const { data } = await supabase
        .from('notification_log')
        .select('*')
        .eq('wedding_id', wedding.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setLogs(data);
    }
    loadLogs();
  }, [wedding.id]);

  const recipientGuests = guests.filter(g => {
    if (channel === 'email') return g.email;
    return g.mobile_number;
  });
  const recipients = recipientGuests.length;

  async function handleSend() {
    if (recipients === 0) { toast.error('No guests have contact info for this channel'); return; }
    setSending(true);

    const guestUrl = formatGuestUrl(wedding.guest_slug);
    const fullMessage = `${message} ${guestUrl}`;

    try {
      if (channel === 'whatsapp') {
        // Open WhatsApp with pre-filled message for each recipient
        for (const g of recipientGuests) {
          const phone = g.mobile_number!.replace(/[^0-9]/g, '');
          const url = `https://wa.me/${phone}?text=${encodeURIComponent(fullMessage)}`;
          window.open(url, '_blank');
        }
      } else if (channel === 'sms') {
        // Open SMS app with pre-filled message
        const phones = recipientGuests.map(g => g.mobile_number!.replace(/[^0-9]/g, '')).join(',');
        const url = `sms:${phones}?body=${encodeURIComponent(fullMessage)}`;
        window.location.href = url;
      } else if (channel === 'email') {
        // Open email client with pre-filled message
        const emails = recipientGuests.map(g => g.email).join(',');
        const subject = `${wedding.couple_display_name}'s Wedding`;
        const url = `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullMessage)}`;
        window.location.href = url;
      }

      // Log the notification
      const { error } = await supabase.from('notification_log').insert({
        wedding_id: wedding.id,
        channel,
        template,
        message_body: message,
        recipient_count: recipients,
        status: 'sent',
      });
      if (error) throw error;

      toast.success(`Opened ${channel} for ${recipients} recipient${recipients !== 1 ? 's' : ''}`);
      const { data } = await supabase
        .from('notification_log')
        .select('*')
        .eq('wedding_id', wedding.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setLogs(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="glass-card p-6">
        <h2 className="font-display text-2xl font-medium mb-2">Send notifications</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Opens {channel === 'whatsapp' ? 'WhatsApp' : channel === 'sms' ? 'your texting app' : 'your email app'} with the message pre-filled for each guest. You review and hit send on your phone — nothing goes out automatically.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={template} onValueChange={(v) => setTemplate(v as typeof template)}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="last_chance">Last chance</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Your message to guests..."
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {recipients} recipient{recipients !== 1 ? 's' : ''} with {channel} contact info
            </p>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" /> Send</>}
            </Button>
          </div>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-display text-lg font-medium mb-4">Recent notifications</h3>
          <div className="space-y-2">
            {logs.map(l => (
              <div key={l.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2">
                  {l.channel === 'email' ? <Mail className="h-4 w-4 text-muted-foreground" /> :
                   l.channel === 'sms' ? <Phone className="h-4 w-4 text-muted-foreground" /> :
                   <MessageSquare className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm font-medium capitalize">{l.template}</span>
                  <span className="text-xs text-muted-foreground">to {l.recipient_count}</span>
                </div>
                <Badge variant={l.status === 'sent' ? 'secondary' : 'destructive'} className="text-xs">{l.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ SETTINGS TAB ============
function SettingsTab({ wedding, onUpdate }: { wedding: Wedding; onUpdate: () => void; }) {
  const [welcome, setWelcome] = useState(wedding.welcome_message);
  const [slideshow, setSlideshow] = useState(wedding.slideshow_enabled);
  const [status, setStatus] = useState(wedding.status);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await supabase.from('weddings').update({
        welcome_message: welcome,
        slideshow_enabled: slideshow,
        status,
      }).eq('id', wedding.id);
      if (error) throw error;
      toast.success('Settings saved');
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="glass-card p-6">
        <h2 className="font-display text-2xl font-medium mb-6">Wedding settings</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Welcome message</Label>
            <Textarea value={welcome} onChange={(e) => setWelcome(e.target.value)} rows={3} />
            <p className="text-xs text-muted-foreground">Shown on the guest welcome screen</p>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Wedding['status'])}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Slideshow mode</Label>
              <p className="text-xs text-muted-foreground">Display submissions on a TV at the reception</p>
            </div>
            <button
              onClick={() => setSlideshow(!slideshow)}
              className={`relative h-7 w-12 rounded-full transition-colors ${slideshow ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform ${slideshow ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
