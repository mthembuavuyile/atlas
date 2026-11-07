const { Readable } = require('stream');
const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');

/**
 * Curated ElevenLabs pre-made voices available on the Free Tier API
 * for reading assistant responses aloud alongside Google / Browser voices.
 * Includes a mapped free cloud TTS locale (`fallbackLang`) so playback works
 * even if the ElevenLabs API key lacks `text_to_speech` permission or is out of credits.
 */
const CURATED_ELEVENLABS_VOICES = [
  {
    id: 'JBFqnCBsd6RMkjVDRZzb',
    value: 'elevenlabs:JBFqnCBsd6RMkjVDRZzb',
    name: 'George',
    label: 'ElevenLabs — George (Warm Narrative)',
    category: 'Narrative & Warm',
    gender: 'Male',
    fallbackLang: 'en-GB'
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    value: 'elevenlabs:EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    label: 'ElevenLabs — Sarah (Soft & Clear)',
    category: 'Soft & Conversational',
    gender: 'Female',
    fallbackLang: 'en-US'
  },
  {
    id: 'onwK4e9ZLuTAKqWW03F9',
    value: 'elevenlabs:onwK4e9ZLuTAKqWW03F9',
    name: 'Daniel',
    label: 'ElevenLabs — Daniel (Authoritative)',
    category: 'Authoritative & News',
    gender: 'Male',
    fallbackLang: 'en-AU'
  },
  {
    id: 'XB0fDUnXU5powFXDhCwa',
    value: 'elevenlabs:XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte',
    label: 'ElevenLabs — Charlotte (Conversational)',
    category: 'Expressive & Natural',
    gender: 'Female',
    fallbackLang: 'en-IE'
  },
  {
    id: 'XrExE9yKIg1WjnnlVkGX',
    value: 'elevenlabs:XrExE9yKIg1WjnnlVkGX',
    name: 'Matilda',
    label: 'ElevenLabs — Matilda (Friendly & Articulate)',
    category: 'Friendly & Clear',
    gender: 'Female',
    fallbackLang: 'en-ZA'
  },
  {
    id: 'cjVigY5qzO86Huf0OWal',
    value: 'elevenlabs:cjVigY5qzO86Huf0OWal',
    name: 'Eric',
    label: 'ElevenLabs — Eric (Smooth & Balanced)',
    category: 'Balanced & Clear',
    gender: 'Male',
    fallbackLang: 'en-CA'
  }
];

const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';

function isConfigured() {
  const key = (process.env.ELEVENLABS_API_KEY || '').trim();
  return Boolean(key && key !== 'your_elevenlabs_api_key_here');
}

function getVoices() {
  return CURATED_ELEVENLABS_VOICES.map((v) => ({ ...v }));
}

/**
 * Splits text into sentence/word-safe chunks for free cloud TTS synthesis.
 * @param {string} text
 * @param {number} [maxLen=180]
 * @returns {string[]}
 */
function splitTextIntoTtsChunks(text, maxLen = 180) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const words = normalized.split(' ');
  const chunks = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word.slice(0, maxLen);
    } else if (current.length + 1 + word.length <= maxLen) {
      current += ` ${word}`;
    } else {
      chunks.push(current);
      current = word.slice(0, maxLen);
    }
  }
  if (current) chunks.push(current);
  return chunks.slice(0, 16);
}

/**
 * Free zero-key cloud TTS MP3 fallback using Google GTX TTS when ElevenLabs
 * key is missing `text_to_speech` permission or out of free credits.
 * @param {string} text
 * @param {string} voiceId
 * @returns {Promise<Readable>}
 */
async function synthesizeFreeCloudTts(text, voiceId = DEFAULT_VOICE_ID) {
  const matchedVoice = CURATED_ELEVENLABS_VOICES.find((v) => v.id === voiceId);
  const tl = matchedVoice?.fallbackLang || 'en-US';
  const chunks = splitTextIntoTtsChunks(text, 180);
  const buffers = [];

  for (const chunk of chunks) {
    const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(chunk)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!response.ok) {
      throw new Error(`Free cloud TTS fallback failed with HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    buffers.push(Buffer.from(arrayBuffer));
  }

  return Readable.from(Buffer.concat(buffers));
}

/**
 * Converts text into an audio stream using the official ElevenLabs SDK,
 * with automatic fallback to free cloud TTS if the key lacks `text_to_speech`
 * permission or exceeds free quota.
 *
 * @param {string} text - Clean text to synthesize
 * @param {string} [voiceId] - ElevenLabs voice ID
 * @param {string} [modelId] - ElevenLabs TTS model ID
 * @returns {Promise<ReadableStream|Readable>}
 */
async function convertTextToSpeech(text, voiceId = DEFAULT_VOICE_ID, modelId = 'eleven_flash_v2_5') {
  const cleanVoiceId = String(voiceId || DEFAULT_VOICE_ID).replace(/^elevenlabs:/i, '').trim() || DEFAULT_VOICE_ID;

  if (!isConfigured()) {
    return synthesizeFreeCloudTts(text, cleanVoiceId);
  }

  const client = new ElevenLabsClient();

  try {
    return await client.textToSpeech.convert(cleanVoiceId, {
      text,
      modelId,
      outputFormat: 'mp3_44100_128'
    });
  } catch (primaryError) {
    const errMsg = String(primaryError?.message || '');
    const isAuthOrPermissionError =
      primaryError?.statusCode === 401 ||
      errMsg.includes('401') ||
      errMsg.includes('missing_permissions') ||
      errMsg.includes('text_to_speech');

    if (!isAuthOrPermissionError && modelId !== 'eleven_multilingual_v2') {
      try {
        return await client.textToSpeech.convert(cleanVoiceId, {
          text,
          modelId: 'eleven_multilingual_v2',
          outputFormat: 'mp3_44100_128'
        });
      } catch (_) {
        // Proceed to free cloud TTS fallback below
      }
    }

    console.warn(
      `[ElevenLabs TTS] Falling back to free cloud TTS stream (${primaryError?.message || 'API error'}).`
    );
    return synthesizeFreeCloudTts(text, cleanVoiceId);
  }
}

module.exports = {
  CURATED_ELEVENLABS_VOICES,
  DEFAULT_VOICE_ID,
  isConfigured,
  getVoices,
  splitTextIntoTtsChunks,
  synthesizeFreeCloudTts,
  convertTextToSpeech
};
