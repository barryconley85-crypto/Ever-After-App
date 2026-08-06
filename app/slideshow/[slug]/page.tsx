'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Heart, Loader2, Camera, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getMediaPublicUrl } from '@/lib/utils';
import Link from 'next/link';

interface SlideItem {
  id: string;
  guestName: string;
  message: string;
  photoPath: string | null;
  submittedAt: string;
}

interface WeddingInfo {
  id: string;
  couple_display_name: string;
}

export default function SlideshowPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [wedding, setWedding] = useState<WeddingInfo | null>(null);
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  async function loadSlides(weddingId: string) {
    const { data, error } = await supabase.functions.invoke('slideshow-data', {
      body: { slug },
    });
    if (error || !data || data.error) return;
    setSlides(data.slides ?? []);
  }

  useEffect(() => {
    async function init() {
      if (slug === 'demo') {
        setIsDemo(true);
        setWedding({ id: 'demo', couple_display_name: 'Barry & Hannah' });
        setSlides([
          { id: '1', guestName: "Sarah O'Brien", message: 'Wishing you both a lifetime of love, laughter, and adventure. What a beautiful day!', photoPath: null, submittedAt: new Date().toISOString() },
          { id: '2', guestName: 'James Murphy', message: "From school friends to this — couldn't be happier for you both. Cheers to forever!", photoPath: null, submittedAt: new Date().toISOString() },
          { id: '3', guestName: 'Aoife Kelly', message: 'The most magical wedding I have ever been to. You two are perfect together.', photoPath: null, submittedAt: new Date().toISOString() },
        ]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('slideshow-data', {
        body: { slug },
      });
      if (error || !data || data.error || !data.wedding) {
        setLoading(false);
        return;
      }

      setWedding(data.wedding);
      setSlides(data.slides ?? []);
      setLoading(false);

      // realtime — refresh on new submissions
      if (data.wedding.id) {
        supabase
          .channel(`slideshow-${data.wedding.id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions', filter: `wedding_id=eq.${data.wedding.id}` },
            () => loadSlides(data.wedding.id))
          .subscribe();
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Auto-advance
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-center px-6">
        <div>
          <Heart className="h-12 w-12 text-white/30 mx-auto mb-4" />
          <h1 className="font-display text-3xl text-white/80 mb-2">{wedding?.couple_display_name}</h1>
          <p className="text-white/40">Waiting for guests to share their messages...</p>
          {!isDemo && (
            <Link href="/" className="text-white/30 text-sm mt-6 inline-block hover:text-white/60">
              <X className="h-4 w-4 inline" /> Exit slideshow
            </Link>
          )}
        </div>
      </div>
    );
  }

  const slide = slides[current];

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Exit */}
      <Link href="/" className="absolute top-6 right-6 z-50 text-white/30 hover:text-white/60 transition-colors">
        <X className="h-6 w-6" />
      </Link>

      {/* Couple name */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 text-center">
        <p className="font-display text-sm text-white/40 tracking-widest uppercase">{wedding?.couple_display_name}</p>
      </div>

      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Slide slide={s} coupleName={wedding?.couple_display_name ?? ''} />
        </div>
      ))}

      {/* Progress dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-40">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? 'w-8 bg-white/80' : 'w-1.5 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Slide({ slide, coupleName }: { slide: SlideItem; coupleName: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center p-12">
      <div className="max-w-4xl w-full flex flex-col md:flex-row items-center gap-8 md:gap-16 animate-fade-up">
        {/* Photo */}
        <div className="flex-shrink-0">
          {slide.photoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getMediaPublicUrl(slide.photoPath)}
              alt={slide.guestName}
              className="w-64 h-64 md:w-80 md:h-80 rounded-2xl object-cover shadow-2xl"
            />
          ) : (
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-2xl glass flex items-center justify-center">
              <Camera className="h-12 w-12 text-white/30" />
            </div>
          )}
        </div>

        {/* Message */}
        <div className="flex-1 text-center md:text-left">
          <p className="font-display text-2xl md:text-4xl text-white mb-4 leading-tight">
            {slide.guestName}
          </p>
          <p className="text-white/70 text-lg md:text-xl leading-relaxed font-light">
            {slide.message}
          </p>
          <div className="mt-6 flex items-center gap-2 justify-center md:justify-start">
            <Heart className="h-4 w-4 text-white/40" />
            <span className="text-white/40 text-sm">{coupleName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
