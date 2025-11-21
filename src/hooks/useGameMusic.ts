import { useEffect, useRef } from 'react';
import * as Tone from 'tone';

export function useGameMusic() {
  const synthRef = useRef<Tone.Synth | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    // Mario Bros style melody
    const melody = [
      { note: 'E5', duration: '8n' },
      { note: 'E5', duration: '8n' },
      { note: 'rest', duration: '8n' },
      { note: 'E5', duration: '8n' },
      { note: 'rest', duration: '8n' },
      { note: 'C5', duration: '8n' },
      { note: 'E5', duration: '8n' },
      { note: 'rest', duration: '8n' },
      { note: 'G5', duration: '4n' },
      { note: 'rest', duration: '4n' },
      { note: 'G4', duration: '4n' },
      { note: 'rest', duration: '4n' },
    ];

    const playMelody = async () => {
      if (isPlayingRef.current) return;
      
      try {
        await Tone.start();
        isPlayingRef.current = true;

        synthRef.current = new Tone.Synth({
          oscillator: {
            type: 'square',
          },
          envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.3,
            release: 0.1,
          },
        }).toDestination();

        synthRef.current.volume.value = -10;

        const playSequence = () => {
          let time = Tone.now();
          melody.forEach((step) => {
            if (step.note !== 'rest') {
              synthRef.current?.triggerAttackRelease(step.note, step.duration, time);
            }
            time += Tone.Time(step.duration).toSeconds();
          });
        };

        playSequence();
        const intervalId = setInterval(playSequence, melody.length * 0.2 * 1000);

        return () => {
          clearInterval(intervalId);
          synthRef.current?.dispose();
          isPlayingRef.current = false;
        };
      } catch (error) {
        console.error('Error playing music:', error);
      }
    };

    playMelody();

    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
      isPlayingRef.current = false;
    };
  }, []);
}
