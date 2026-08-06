'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Heart, Loader2, Camera, ArrowRight, ArrowLeft, Check, Video, Mic,
  RefreshCw, Send, X, Play, Pause, Square
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getMediaPublicUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface GuestData {
  id: string;
  wedding_id: string;
  first_name: string;
  last_name: string;
  completed: boolean;
  weddings: {
    couple_display_name: string;
    welcome_message: string;
  }[];
}

type Step = 'loading' | 'welcome' | 'selfie' | 'message' | 'optional' | 'submitting' | 'done' | 'already';

export default function GuestPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [guest, setGuest] = useState<GuestData | null>(null);
  const [step, setStep] = useState<Step>('loading');

  // media state
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voicePath, setVoicePath] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.functions.invoke('guest-lookup', {
        body: { token },
      });
      if (error || !data || !data.guest) {
        toast.error('Guest link not found');
        router.push('/');
        return;
      }
      setGuest(data.guest);
      setStep(data.guest.completed ? 'already' : 'welcome');
    }
    load();
  }, [token, router]);

  async function uploadMedia(file: Blob, ext: string, type: 'photo' | 'video' | 'voice'): Promise<string | null> {
    const path = `${guest!.wedding_id}/${guest!.id}/${type}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('wedding-media').upload(path, file, { contentType: file.type });
    if (error) {
      toast.error('Could not upload media');
      return null;
    }
    return path;
  }

  async function handleSubmit() {
    if (!guest) return;
    if (message.length < 10) { toast.error('Please write at least 10 characters'); return; }

    setStep('submitting');

    try {
      let pPhoto = photoPath;
      let pVideo = videoPath;
      let pVoice = voicePath;

      if (photoDataUrl && !pPhoto) {
        const blob = await (await fetch(photoDataUrl)).blob();
        pPhoto = await uploadMedia(blob, 'jpg', 'photo');
      }
      if (videoBlob && !pVideo) {
        pVideo = await uploadMedia(videoBlob, 'webm', 'video');
      }
      if (voiceBlob && !pVoice) {
        pVoice = await uploadMedia(voiceBlob, 'webm', 'voice');
      }

      const { data, error } = await supabase.functions.invoke('guest-submit', {
        body: {
          token,
          message,
          photoPath: pPhoto,
          videoPath: pVideo,
          voicePath: pVoice,
          deviceInfo: navigator.userAgent,
        },
      });

      if (error || !data || data.error) {
        throw new Error(data?.error ?? 'Submission failed');
      }

      setStep('done');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit');
      setStep('optional');
    }
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen luxury-gradient flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (step === 'already') {
    return (
      <div className="min-h-screen luxury-gradient flex items-center justify-center px-6">
        <div className="text-center glass-card p-12 max-w-md animate-scale-in">
          <Check className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-medium mb-2">You've already shared your message</h1>
          <p className="text-muted-foreground">Thank you for being part of {guest?.weddings[0]?.couple_display_name}'s special day.</p>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return <ThankYou guest={guest} />;
  }

  if (step === 'submitting') {
    return (
      <div className="min-h-screen luxury-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Saving your message...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen luxury-gradient">
      <div className="mx-auto max-w-lg px-6 py-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['welcome', 'selfie', 'message', 'optional'].map((s, i) => {
            const stepOrder = ['welcome', 'selfie', 'message', 'optional'];
            const currentIdx = stepOrder.indexOf(step);
            const isActive = i === currentIdx;
            const isDone = i < currentIdx;
            return (
              <div key={s} className={`h-2 rounded-full transition-all ${
                isActive ? 'w-8 bg-primary' : isDone ? 'w-2 bg-primary/60' : 'w-2 bg-muted'
              }`} />
            );
          })}
        </div>

        {step === 'welcome' && guest && (
          <div className="text-center animate-fade-up">
            <Heart className="h-12 w-12 text-primary mx-auto mb-6 animate-float" />
            <h1 className="font-display text-3xl font-medium tracking-tight mb-3">
              Hi {guest.first_name}!
            </h1>
            <p className="text-muted-foreground text-lg mb-2">
              Welcome to {guest.weddings[0]?.couple_display_name}'s Wedding
            </p>
            <p className="text-muted-foreground mb-10 max-w-sm mx-auto">
              {guest.weddings[0]?.welcome_message}
            </p>
            <Button onClick={() => setStep('selfie')} size="lg" className="rounded-full h-14 px-8 text-base">
              Let's begin <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {step === 'selfie' && (
          <SelfieStep
            photoDataUrl={photoDataUrl}
            setPhotoDataUrl={setPhotoDataUrl}
            onNext={() => setStep('message')}
            onBack={() => setStep('welcome')}
          />
        )}

        {step === 'message' && (
          <MessageStep
            message={message}
            setMessage={setMessage}
            onNext={() => setStep('optional')}
            onBack={() => setStep('selfie')}
          />
        )}

        {step === 'optional' && (
          <OptionalStep
            videoBlob={videoBlob}
            setVideoBlob={setVideoBlob}
            voiceBlob={voiceBlob}
            setVoiceBlob={setVoiceBlob}
            onSubmit={handleSubmit}
            onBack={() => setStep('message')}
          />
        )}
      </div>
    </div>
  );
}

// ============ SELFIE STEP ============
function SelfieStep({ photoDataUrl, setPhotoDataUrl, onNext, onBack }: {
  photoDataUrl: string | null;
  setPhotoDataUrl: (v: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play();
      }
    } catch {
      setError('Could not access camera. Please allow camera permissions and try again.');
    }
  }, []);

  useEffect(() => {
    if (!photoDataUrl) startCamera();
    return () => { stream?.getTracks().forEach(t => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function takePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Mirror for selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    setPhotoDataUrl(canvas.toDataURL('image/jpeg', 0.85));
    stream?.getTracks().forEach(t => t.stop());
  }

  function retake() {
    setPhotoDataUrl(null);
    startCamera();
  }

  return (
    <div className="animate-fade-up">
      <h2 className="font-display text-2xl font-medium text-center mb-2">Take a selfie</h2>
      <p className="text-sm text-muted-foreground text-center mb-6">Say cheese! This will be part of the memory book.</p>

      {error ? (
        <div className="glass-card p-8 text-center">
          <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={startCamera} variant="outline">Try again</Button>
        </div>
      ) : photoDataUrl ? (
        <div className="space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoDataUrl} alt="Selfie" className="w-full max-w-sm mx-auto rounded-2xl shadow-lg" />
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={retake} className="rounded-full">
              <RefreshCw className="h-4 w-4 mr-1" /> Retake
            </Button>
            <Button onClick={onNext} className="rounded-full">
              Looks great <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative max-w-sm mx-auto aspect-square rounded-2xl overflow-hidden glass">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex justify-center">
            <Button onClick={takePhoto} size="lg" className="rounded-full h-14 w-14 p-0">
              <Camera className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}

      <button onClick={onBack} className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto block">
        <ArrowLeft className="h-4 w-4 inline mr-1" /> Back
      </button>
    </div>
  );
}

// ============ MESSAGE STEP ============
function MessageStep({ message, setMessage, onNext, onBack }: {
  message: string;
  setMessage: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const valid = message.length >= 10 && message.length <= 1000;

  return (
    <div className="animate-fade-up">
      <h2 className="font-display text-2xl font-medium text-center mb-2">Write a message</h2>
      <p className="text-sm text-muted-foreground text-center mb-6">Share your wishes, a favourite memory, or a piece of advice.</p>

      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={8}
        maxLength={1000}
        placeholder="Dear Barry & Hannah..."
        className="text-base rounded-2xl glass resize-none"
        autoFocus
      />
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>{message.length < 10 ? `${10 - message.length} more characters needed` : 'Looking great!'}</span>
        <span>{message.length}/1000</span>
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={onBack} className="rounded-full">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button onClick={onNext} disabled={!valid} className="rounded-full flex-1">
          Continue <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============ OPTIONAL STEP (video + voice) ============
function OptionalStep({ videoBlob, setVideoBlob, voiceBlob, setVoiceBlob, onSubmit, onBack }: {
  videoBlob: Blob | null;
  setVideoBlob: (v: Blob | null) => void;
  voiceBlob: Blob | null;
  setVoiceBlob: (v: Blob | null) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [voiceURL, setVoiceURL] = useState<string | null>(null);

  useEffect(() => {
    if (videoBlob) setVideoURL(URL.createObjectURL(videoBlob));
    else setVideoURL(null);
  }, [videoBlob]);

  useEffect(() => {
    if (voiceBlob) setVoiceURL(URL.createObjectURL(voiceBlob));
    else setVoiceURL(null);
  }, [voiceBlob]);

  return (
    <div className="animate-fade-up space-y-8">
      <div className="text-center">
        <h2 className="font-display text-2xl font-medium mb-2">One more thing?</h2>
        <p className="text-sm text-muted-foreground">These are optional — add a video or voice message to make it extra special.</p>
      </div>

      {/* Video */}
      <VideoRecorder blob={videoBlob} url={videoURL} setBlob={setVideoBlob} />

      {/* Voice */}
      <VoiceRecorder blob={voiceBlob} url={voiceURL} setBlob={setVoiceBlob} />

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onBack} className="rounded-full">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button onClick={onSubmit} size="lg" className="rounded-full flex-1 h-14 text-base">
          <Send className="mr-2 h-5 w-5" /> Submit
        </Button>
      </div>
    </div>
  );
}

function VideoRecorder({ blob, url, setBlob }: { blob: Blob | null; url: string | null; setBlob: (v: Blob | null) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function startRecording() {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play();
      }
      const r = new MediaRecorder(s, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      r.onstop = () => {
        const b = new Blob(chunks, { type: 'video/webm' });
        setBlob(b);
        s.getTracks().forEach(t => t.stop());
      };
      r.start();
      setRecorder(r);
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s >= 30) { stopRecording(); return 30; }
          return s + 1;
        });
      }, 1000);
    } catch {
      setError('Could not access camera. Please allow permissions.');
    }
  }

  function stopRecording() {
    recorder?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function clearVideo() {
    setBlob(null);
    setSeconds(0);
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Video className="h-5 w-5 text-primary" />
        <h3 className="font-medium">Video message <span className="text-muted-foreground font-normal text-sm">(optional, max 30s)</span></h3>
      </div>

      {error ? (
        <p className="text-sm text-muted-foreground py-4">{error}</p>
      ) : url ? (
        <div className="space-y-3">
          <video src={url} controls className="w-full rounded-xl" />
          <Button variant="outline" size="sm" onClick={clearVideo}>
            <X className="h-4 w-4 mr-1" /> Remove video
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative aspect-video rounded-xl overflow-hidden glass min-h-40 flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
            {!recording && !stream && (
              <p className="text-sm text-muted-foreground absolute">Camera preview will appear here</p>
            )}
            {recording && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500/90 text-white text-xs px-2 py-1 rounded-full">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                {seconds}s
              </div>
            )}
          </div>
          {!recording ? (
            <Button onClick={startRecording} variant="outline" className="w-full rounded-full">
              <Video className="h-4 w-4 mr-1" /> Record video
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive" className="w-full rounded-full">
              <Square className="h-4 w-4 mr-1" /> Stop recording
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function VoiceRecorder({ blob, url, setBlob }: { blob: Blob | null; url: string | null; setBlob: (v: Blob | null) => void }) {
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function startRecording() {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(s, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      r.onstop = () => {
        const b = new Blob(chunks, { type: 'audio/webm' });
        setBlob(b);
        s.getTracks().forEach(t => t.stop());
      };
      r.start();
      setRecorder(r);
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s >= 60) { stopRecording(); return 60; }
          return s + 1;
        });
      }, 1000);
    } catch {
      setError('Could not access microphone.');
    }
  }

  function stopRecording() {
    recorder?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function clearVoice() {
    setBlob(null);
    setSeconds(0);
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Mic className="h-5 w-5 text-primary" />
        <h3 className="font-medium">Voice message <span className="text-muted-foreground font-normal text-sm">(optional, max 60s)</span></h3>
      </div>

      {error ? (
        <p className="text-sm text-muted-foreground py-4">{error}</p>
      ) : url ? (
        <div className="space-y-3">
          <audio src={url} controls className="w-full" />
          <Button variant="outline" size="sm" onClick={clearVoice}>
            <X className="h-4 w-4 mr-1" /> Remove voice
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center py-6">
          {recording ? (
            <>
              <div className="flex items-center gap-2 mb-4 text-red-500">
                <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium">{seconds}s / 60s</span>
              </div>
              <Button onClick={stopRecording} variant="destructive" className="rounded-full h-14 w-14 p-0">
                <Square className="h-5 w-5" />
              </Button>
              <p className="text-xs text-muted-foreground mt-2">Tap to stop</p>
            </>
          ) : (
            <>
              <Button onClick={startRecording} variant="outline" className="rounded-full h-14 w-14 p-0">
                <Mic className="h-6 w-6" />
              </Button>
              <p className="text-xs text-muted-foreground mt-2">Tap to record</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============ THANK YOU ============
function ThankYou({ guest }: { guest: GuestData | null }) {
  const [confetti, setConfetti] = useState<{ id: number; left: number; delay: number; color: string }[]>([]);

  useEffect(() => {
    const colors = ['hsl(168 35% 30%)', 'hsl(38 55% 52%)', 'hsl(340 45% 55%)', 'hsl(200 40% 45%)'];
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setConfetti(pieces);
  }, []);

  return (
    <div className="min-h-screen luxury-gradient flex items-center justify-center px-6 relative overflow-hidden">
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none">
        {confetti.map(c => (
          <div
            key={c.id}
            className="absolute top-0 h-3 w-3 rounded-sm animate-confetti"
            style={{ left: `${c.left}%`, backgroundColor: c.color, animationDelay: `${c.delay}s` }}
          />
        ))}
      </div>

      <div className="text-center relative z-10 animate-scale-in">
        <Heart className="h-16 w-16 text-primary mx-auto mb-6 animate-float" />
        <h1 className="font-display text-4xl sm:text-5xl font-medium tracking-tight mb-4">
          Thank you{guest ? `, ${guest.first_name}` : ''}!
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
          Your message has been saved. {guest?.weddings[0]?.couple_display_name} will treasure this forever.
        </p>
        <div className="glass-card p-6 max-w-sm mx-auto">
          <p className="text-sm text-muted-foreground">You can close this page now.</p>
        </div>
      </div>
    </div>
  );
}
