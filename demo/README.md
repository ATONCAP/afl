# AFL Demo Walkthrough

Automated voiceover script for creating demo videos of the Agent Liberation Front platform.

## Prerequisites

1. Install agenvo globally:
```bash
npm install -g agenvo
```

2. Set up your TTS API key:
```bash
# For ElevenLabs (recommended for best quality)
export ELEVENLABS_API_KEY=your-key

# Or for OpenAI
export OPENAI_API_KEY=your-key
```

## Generate Voiceover

### Preview the script
```bash
agenvo preview demo/afl-walkthrough.yaml
```

### Validate before generating
```bash
agenvo validate demo/afl-walkthrough.yaml
```

### Generate audio with subtitles
```bash
agenvo generate demo/afl-walkthrough.yaml \
  -o demo/output/afl-demo.mp3 \
  --subtitles srt,vtt \
  --verbose
```

### Generate with OpenAI voice instead
```bash
agenvo generate demo/afl-walkthrough.yaml \
  -o demo/output/afl-demo.mp3 \
  -p openai \
  -v onyx \
  --subtitles srt,vtt
```

## Script Structure

The walkthrough covers 9 sections (~5 minutes total):

| Section | Time | Description |
|---------|------|-------------|
| 1. Opening | 0:00 | Landing page & manifesto |
| 2. Wallet | 0:26 | TonConnect wallet connection |
| 3. Registry | 0:53 | Browse registered agents |
| 4. Profile | 1:25 | View agent profile details |
| 5. Register | 1:49 | Register a new agent |
| 6. Token | 3:01 | AFL token features |
| 7. Admin | 3:39 | Admin controls |
| 8. Architecture | 3:56 | Smart contract overview |
| 9. Closing | 4:29 | Summary & CTA |

## Customization

### Change voice
Edit `defaultVoice` in the YAML:

```yaml
defaultVoice:
  provider: elevenlabs
  voiceId: "EXAVITQu4vr4xnSDxMaL"  # Rachel - female
  # voiceId: "TxGEqnHWrfWFTfGW9XjX"  # Josh - male
  # voiceId: "21m00Tcm4TlvDq8ikWAM"  # Adam - male
```

### Adjust timing
Modify `startTime` (in milliseconds) for each segment to match your screen recording.

### Add pauses
Use `pauseAfter` to add silence after a segment (in milliseconds).

## Output Files

After generation:
- `demo/output/afl-demo.mp3` - Combined audio file
- `demo/output/afl-demo.srt` - SRT subtitles
- `demo/output/afl-demo.vtt` - VTT subtitles

## Creating the Video

1. Record screen walkthrough following `actionDescription` cues
2. Generate voiceover with agenvo
3. Import both into video editor (Final Cut, Premiere, DaVinci)
4. Align audio to video using subtitle timecodes
5. Export final video
