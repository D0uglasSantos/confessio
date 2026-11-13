type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let sharedContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;

  if (!sharedContext) {
    const AudioCtx =
      window.AudioContext ||
      (window as WindowWithWebkitAudio).webkitAudioContext;
    if (!AudioCtx) return null;
    sharedContext = new AudioCtx();
  }

  return sharedContext;
}

function tone(
  context: AudioContext,
  {
    frequency,
    startAt,
    duration,
    gain = 0.22,
  }: {
    frequency: number;
    startAt: number;
    duration: number;
    gain?: number;
  },
) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startAt);

  envelope.gain.setValueAtTime(0.0001, startAt);
  envelope.gain.exponentialRampToValueAtTime(gain, startAt + 0.02);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(envelope);
  envelope.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

/** Classic two-tone queue chime for the TV board. */
export async function playCallChime() {
  const context = getAudioContext();
  if (!context) return false;

  if (context.state === "suspended") {
    await context.resume();
  }

  const now = context.currentTime;
  tone(context, { frequency: 880, startAt: now, duration: 0.18, gain: 0.24 });
  tone(context, {
    frequency: 1174.7,
    startAt: now + 0.16,
    duration: 0.28,
    gain: 0.2,
  });
  tone(context, {
    frequency: 1318.5,
    startAt: now + 0.38,
    duration: 0.42,
    gain: 0.16,
  });

  return true;
}

export async function unlockCallChime() {
  const context = getAudioContext();
  if (!context) return false;

  if (context.state === "suspended") {
    await context.resume();
  }

  return context.state === "running";
}

export function callingSignal(stations: {
  id: string;
  status: string;
  current_public_code: string | null;
  called_at?: string | null;
  last_recalled_at?: string | null;
}[]) {
  return stations
    .filter(
      (station) =>
        station.status === "CALLING" && Boolean(station.current_public_code),
    )
    .map(
      (station) =>
        `${station.id}:${station.current_public_code}:${station.last_recalled_at ?? station.called_at ?? ""}`,
    )
    .sort()
    .join("|");
}
