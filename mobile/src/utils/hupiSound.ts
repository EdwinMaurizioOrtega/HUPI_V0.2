import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

import { hupiBrandSound } from '@/constants/brandAssets';

type AudioStatus = 'idle' | 'ready' | 'error';

let audioStatus: AudioStatus = 'idle';
let audioModeConfigured = false;

export const HUPI_AUDIO_DEPENDENCY = 'expo-av';
export const HUPI_NATIVE_AUDIO_INSTALL_COMMAND = 'npx expo install expo-av';
export const HUPI_SOUND_ASSET = hupiBrandSound;

async function configureHupiAudioMode() {
  if (audioModeConfigured) {
    return;
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    staysActiveInBackground: false,
  });
  audioModeConfigured = true;
}

async function playHupiSound() {
  let sound: Audio.Sound | null = null;

  try {
    await configureHupiAudioMode();

    const soundObject = await Audio.Sound.createAsync(
      hupiBrandSound,
      {
        isLooping: false,
        shouldPlay: false,
        volume: 1,
      },
      undefined,
      true,
    );
    sound = soundObject.sound;

    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };

      sound?.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          finish();
          return;
        }

        if (status.didJustFinish) {
          finish();
        }
      });

      sound?.replayAsync().catch((error) => {
        console.warn('No se pudo reproducir sonido Hupi', error);
        finish();
      });

      setTimeout(finish, 5000);
    });

    audioStatus = 'ready';
  } catch (error) {
    console.warn('No se pudo reproducir sonido Hupi', error);
    audioStatus = 'error';
  } finally {
    if (sound) {
      try {
        sound.setOnPlaybackStatusUpdate(null);
        await sound.unloadAsync();
      } catch (error) {
        console.warn('No se pudo reproducir sonido Hupi', error);
      }
    }
  }
}

export function getHupiAudioStatus() {
  return audioStatus;
}

export function playHupiBrandSound() {
  void playHupiSound();
}

export function playHupiSuccessSound() {
  void playHupiSound();
}
