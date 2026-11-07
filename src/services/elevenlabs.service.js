const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');

/**
 * Curated ElevenLabs pre-made voices available on the Free Tier API
 * for reading assistant responses aloud alongside Google / Browser voices.
 */
const CURATED_ELEVENLABS_VOICES = [
  {
    id: 'JBFqnCBsd6RMkjVDRZzb',
    value: 'elevenlabs:JBFqnCBsd6RMkjVDRZzb',
    name: 'George',
    label: 'ElevenLabs — George (Warm Narrative)',
    category: 'Narrative & Warm',
    gender: 'Male'
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    value: 'elevenlabs:EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    label: 'ElevenLabs — Sarah (Soft & Clear)',
    category: 'Soft & Conversational',
    gender: 'Female'
  },
  {
    id: 'onwK4e9ZLuTAKqWW03F9',
    value: 'elevenlabs:onwK4e9ZLuTAKqWW03F9',
    name: 'Daniel',
    label: 'ElevenLabs — Daniel (Authoritative)',
    category: 'Authoritative & News',
    gender: 'Male'
  },
  {
    id: 'XB0fDUnXU5powFXDhCwa',
    value: 'elevenlabs:XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte',
    label: 'ElevenLabs — Charlotte (Conversational)',
    category: 'Expressive & Natural',
    gender: 'Female'
  },
  {
    id: 'XrExE9yKIg1WjnnlVkGX',
    value: 'elevenlabs:XrExE9yKIg1WjnnlVkGX',
    name: 'Matilda',
    label: 'ElevenLabs — Matilda (Friendly & Articulate)',
    category: 'Friendly & Clear',
    gender: 'Female'
  },
  {
    id: 'cjVigY5qzO86Huf0OWal',
    value: 'elevenlabs:cjVigY5qzO86Huf0OWal',
    name: 'Eric',
    label: 'ElevenLabs — Eric (Smooth & Balanced)',
    category: 'Balanced & Clear',
    gender: 'Male'
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
 * Converts text into an audio stream using the official ElevenLabs SDK.
 * Reads ELEVENLABS_API_KEY automatically from process.env.
 *
 * @param {string} text - Clean text to synthesize
 * @param {string} [voiceId] - ElevenLabs voice ID
 * @param {string} [modelId] - ElevenLabs TTS model ID
 * @returns {Promise<ReadableStream>}
 */
async function convertTextToSpeech(text, voiceId = DEFAULT_VOICE_ID, modelId = 'eleven_flash_v2_5') {
  if (!isConfigured()) {
    const err = new Error('ELEVENLABS_API_KEY is not configured on the server.');
    err.statusCode = 503;
    throw err;
  }

  const cleanVoiceId = String(voiceId || DEFAULT_VOICE_ID).replace(/^elevenlabs:/i, '').trim() || DEFAULT_VOICE_ID;
  const client = new ElevenLabsClient();

  try {
    return await client.textToSpeech.convert(cleanVoiceId, {
      text,
      modelId,
      outputFormat: 'mp3_44100_128'
    });
  } catch (primaryError) {
    // Fallback to eleven_multilingual_v2 if the primary model is unavailable for the voice/tier
    if (modelId !== 'eleven_multilingual_v2') {
      return await client.textToSpeech.convert(cleanVoiceId, {
        text,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128'
      });
    }
    throw primaryError;
  }
}

module.exports = {
  CURATED_ELEVENLABS_VOICES,
  DEFAULT_VOICE_ID,
  isConfigured,
  getVoices,
  convertTextToSpeech
};

