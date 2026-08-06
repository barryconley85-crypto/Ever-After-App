'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Heart, Camera, MessageSquare, Video, QrCode, BarChart3,
  Sparkles, ArrowRight, Play, Check, Star, Mic, Monitor, Shield, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const PHOTO_GRID = [
  {
    src: 'https://images.pexels.com/photos/32142686/pexels-photo-32142686.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Couple embracing at elegant reception',
  },
  {
    src: 'https://images.pexels.com/photos/11474356/pexels-photo-11474356.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Bride and groom toasting at wedding',
  },
  {
    src: 'https://images.pexels.com/photos/17001749/pexels-photo-17001749.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Elegant wedding table with floral centerpiece',
  },
  {
    src: 'https://images.pexels.com/photos/11988928/pexels-photo-11988928.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Guest capturing wedding selfie on smartphone',
  },
  {
    src: 'https://images.pexels.com/photos/5804239/pexels-photo-5804239.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Bride and groom intimate moment by window',
  },
  {
    src: 'https://images.pexels.com/photos/13591097/pexels-photo-13591097.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Chic floral arrangement at wedding reception',
  },
];

const TESTIMONIALS = [
  {
    quote: "Every single guest left a message. The slideshow at the reception had people in tears. Worth every penny.",
    name: "Sophie & James",
    detail: "Married June 2025 · 140 guests",
    avatar: "SJ",
  },
  {
    quote: "Set it up in 20 minutes. The QR codes meant even our grandparents could leave a voice message. Absolutely magical.",
    name: "Clara & David",
    detail: "Married March 2025 · 95 guests",
    avatar: "CD",
  },
  {
    quote: "The live dashboard during the wedding was addictive — watching messages come in all night was the best part.",
    name: "Aoife & Ciarán",
    detail: "Married August 2025 · 220 guests",
    avatar: "AC",
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create your wedding',
    desc: 'Set up in minutes. Add your guest list, customise the welcome message, and you\'re ready to go.',
  },
  {
    step: '02',
    title: 'Guests scan & share',
    desc: 'Each guest scans a QR code, takes a selfie, writes a message, and optionally records a video or voice note.',
  },
  {
    step: '03',
    title: 'Watch it come alive',
    desc: 'Your live dashboard fills up in real time. Display a beautiful slideshow on the reception TV as guests contribute.',
  },
];

const FEATURES = [
  {
    icon: QrCode,
    title: 'Personal QR codes',
    desc: 'Every guest gets their own unique link. No app, no login — just scan and go in seconds.',
  },
  {
    icon: Camera,
    title: 'Selfie & photo',
    desc: 'Guests take a photo straight from their phone camera. No uploads, no friction.',
  },
  {
    icon: Mic,
    title: 'Voice & video',
    desc: 'Optional 60-second voice message or 30-second video clip for those who want to say more.',
  },
  {
    icon: Monitor,
    title: 'Live slideshow',
    desc: 'Cast a gorgeous live slideshow to a TV at your reception. New messages appear as they arrive.',
  },
  {
    icon: BarChart3,
    title: 'Real-time dashboard',
    desc: 'See who\'s contributed, track table completion, and send smart reminders from one place.',
  },
  {
    icon: Shield,
    title: 'Private & secure',
    desc: 'Your memories are yours. All media is stored privately — never shared without your permission.',
  },
];

export default function Home() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(i => (i + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 glass-nav">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Heart className="h-4 w-4 text-primary-foreground fill-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">EverAfter</span>
          </div>
          <div className="hidden sm:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Stories</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/signin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Button asChild size="sm" className="rounded-full px-5">
              <Link href="/signup">Get started free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-background">
        {/* background radial blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute top-1/2 -right-64 h-[400px] w-[600px] rounded-full bg-[hsl(var(--gold))/0.10] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-16 lg:pt-28 lg:pb-20">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* Left copy */}
            <div className="flex-1 text-center lg:text-left animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-7">
                <Sparkles className="h-3.5 w-3.5" />
                The digital guest book couples trust
              </div>

              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.05]">
                Every guest.<br />
                Every memory.<br />
                <span className="italic" style={{ color: 'hsl(var(--gold))' }}>Forever.</span>
              </h1>

              <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                EverAfter collects selfies, heartfelt messages, voice notes and videos from every guest —
                live on the night, all in one beautiful place.
              </p>

              {/* Social proof strip */}
              <div className="mt-6 flex items-center gap-4 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {['SJ','CD','AC','MR','LB'].map((initials, i) => (
                    <div
                      key={initials}
                      className="h-8 w-8 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary"
                      style={{ zIndex: 5 - i }}
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Loved by 500+ couples</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Button asChild size="lg" className="rounded-full h-12 px-8 text-base w-full sm:w-auto">
                  <Link href="/signup">
                    Create your guest book
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="rounded-full h-12 px-6 text-base w-full sm:w-auto">
                  <Link href="/slideshow/demo">
                    <Play className="mr-2 h-4 w-4" />
                    See a live demo
                  </Link>
                </Button>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                Free to set up. No credit card required.
              </p>
            </div>

            {/* Right photo mosaic */}
            <div className="flex-1 w-full max-w-md lg:max-w-none animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <div className="grid grid-cols-3 gap-3">
                {/* tall left image */}
                <div className="col-span-1 row-span-2 rounded-2xl overflow-hidden shadow-xl" style={{ aspectRatio: '3/5' }}>
                  <img
                    src={PHOTO_GRID[0].src}
                    alt={PHOTO_GRID[0].alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* top-right two */}
                <div className="col-span-2 rounded-2xl overflow-hidden shadow-xl aspect-video">
                  <img
                    src={PHOTO_GRID[1].src}
                    alt={PHOTO_GRID[1].alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xl aspect-square">
                  <img
                    src={PHOTO_GRID[3].src}
                    alt={PHOTO_GRID[3].alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* bottom row two */}
                <div className="rounded-2xl overflow-hidden shadow-xl aspect-square">
                  <img
                    src={PHOTO_GRID[4].src}
                    alt={PHOTO_GRID[4].alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xl aspect-square">
                  <img
                    src={PHOTO_GRID[2].src}
                    alt={PHOTO_GRID[2].alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xl aspect-square">
                  <img
                    src={PHOTO_GRID[5].src}
                    alt={PHOTO_GRID[5].alt}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="border-y border-border/50 bg-muted/30 py-5">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-sm text-muted-foreground">
            {[
              { icon: Users, label: '500+ weddings' },
              { icon: Camera, label: '50,000+ photos collected' },
              { icon: MessageSquare, label: '100,000+ messages saved' },
              { icon: Star, label: '4.9 / 5 average rating' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">How it works</p>
            <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight">
              Live on the night — effortlessly
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
              Set up before your wedding, then relax. Guests do everything themselves with just a QR code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* connecting line on desktop */}
            <div className="hidden md:block absolute top-10 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="text-center animate-fade-up" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="relative inline-flex">
                  <div className="h-20 w-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
                    <span className="font-display text-2xl font-semibold">{step.step}</span>
                  </div>
                </div>
                <h3 className="font-display text-xl font-medium mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 lg:py-32 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">Everything you need</p>
            <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight">
              Designed for the day
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
              Every feature exists to make sure not a single guest is missed, and every memory is captured.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="glass-card p-7 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center mb-5 shadow-md shadow-primary/20">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 lg:py-32">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">Real couples, real stories</p>
            <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight">
              Memories that last forever
            </h2>
          </div>

          {/* Active testimonial */}
          <div className="glass-card p-10 md:p-14 text-center relative overflow-hidden min-h-56">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-8 -left-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
              <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-[hsl(var(--gold))/0.08] blur-2xl" />
            </div>

            <div className="relative">
              <div className="flex items-center justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
                ))}
              </div>

              <blockquote
                key={activeTestimonial}
                className="font-display text-2xl md:text-3xl font-medium leading-snug text-foreground mb-8 animate-fade-up"
              >
                &ldquo;{TESTIMONIALS[activeTestimonial].quote}&rdquo;
              </blockquote>

              <div className="flex items-center justify-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {TESTIMONIALS[activeTestimonial].avatar}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{TESTIMONIALS[activeTestimonial].name}</p>
                  <p className="text-xs text-muted-foreground">{TESTIMONIALS[activeTestimonial].detail}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === activeTestimonial ? 'w-8 bg-primary' : 'w-2 bg-border'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING NUDGE / CTA ── */}
      <section className="py-24 lg:py-32 bg-muted/20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="glass-card overflow-hidden relative">
            {/* Decorative background */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-[hsl(var(--gold))/0.08] blur-3xl" />
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Left */}
              <div className="p-10 md:p-14">
                <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mb-4">
                  Ready to capture every moment?
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Set up your wedding guest book in minutes.
                  Your guests don't need an account — just a QR code.
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    'Free to create and set up',
                    'Unlimited guests & messages',
                    'Photos, video, and voice notes',
                    'Live slideshow at your reception',
                    'Real-time dashboard & reminders',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>

                <Button asChild size="lg" className="rounded-full h-12 px-8 text-base">
                  <Link href="/signup">
                    Create your guest book
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">No credit card required.</p>
              </div>

              {/* Right — photo */}
              <div className="hidden md:block relative min-h-80">
                <img
                  src="https://images.pexels.com/photos/35349365/pexels-photo-35349365.png?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Bride and groom at outdoor ceremony"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-card/30" />

                {/* Floating stat bubble */}
                <div className="absolute bottom-8 left-8 glass-card p-4 shadow-xl max-w-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                      <Heart className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Wedding live now</p>
                      <p className="text-xs text-muted-foreground">142 guests · 98 messages in</p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-[69%] rounded-full bg-primary transition-all" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">69% completion</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/40 py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                <Heart className="h-3.5 w-3.5 text-primary-foreground fill-primary-foreground" />
              </div>
              <span className="font-display font-semibold">EverAfter</span>
            </div>
            <p className="text-sm text-muted-foreground">Every guest. Every memory. Forever.</p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/signin" className="hover:text-foreground transition-colors">Sign in</Link>
              <Link href="/signup" className="hover:text-foreground transition-colors">Get started</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
