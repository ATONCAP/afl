# AFL Demo Generator

Generate AFL promotional content using agenvo for voiceovers and HeyGen for video avatars.

## Usage

```
/afl-demo [type] [options]
```

### Types

- `walkthrough` - Full 5-minute platform walkthrough
- `quick` - 30-second social media spot
- `custom` - Custom message (provide text)

### Options

- `--voice <id>` - Voice ID (default: TxGEqnHWrfWFTfGW9XjX)
- `--provider <name>` - elevenlabs or openai
- `--output <path>` - Output file path
- `--heygen` - Generate HeyGen video instead of audio

## Examples

```bash
# Generate full walkthrough
/afl-demo walkthrough

# Generate quick social spot
/afl-demo quick --output demo/output/social.mp3

# Custom message
/afl-demo custom "Join the Agent Liberation Front today"

# Generate HeyGen video
/afl-demo quick --heygen
```

## Instructions

When this skill is invoked:

1. **Check prerequisites**:
   - Verify agenvo is installed: `which agenvo || npm install -g agenvo`
   - Check for API keys: `ELEVENLABS_API_KEY` or `OPENAI_API_KEY`

2. **For walkthrough type**:
   ```bash
   agenvo generate demo/afl-walkthrough.yaml \
     -o demo/output/afl-walkthrough.mp3 \
     --subtitles srt,vtt \
     --verbose
   ```

3. **For quick type**:
   ```bash
   agenvo generate demo/quick-message.yaml \
     -o demo/output/afl-quick.mp3 \
     --subtitles srt
   ```

4. **For custom type**:
   - Create a temporary YAML script with the custom text
   - Generate using agenvo
   - Clean up temporary file

5. **For HeyGen video**:
   - Create HeyGen config JSON
   - Call HeyGen API to generate video
   - Poll for completion
   - Download result

6. **Report results**:
   - Show output file path
   - Display generation time
   - Provide next steps for distribution

## API Key Setup

If API keys are missing, guide the user:

### ElevenLabs
1. Go to https://elevenlabs.io/
2. Sign up (free tier: 10k chars/month)
3. Profile → API Keys → Create
4. Run: `export ELEVENLABS_API_KEY=your-key`

### HeyGen
1. Go to https://www.heygen.com/
2. Sign up for account
3. Settings → API → Generate key
4. Run: `export HEYGEN_API_KEY=your-key`

### OpenAI
1. Go to https://platform.openai.com/
2. API Keys → Create new key
3. Run: `export OPENAI_API_KEY=your-key`

## Voice Options

### ElevenLabs Voices
| ID | Name | Style |
|----|------|-------|
| `TxGEqnHWrfWFTfGW9XjX` | Josh | Confident, authoritative |
| `EXAVITQu4vr4xnSDxMaL` | Rachel | Friendly, professional |
| `21m00Tcm4TlvDq8ikWAM` | Adam | Deep, warm |

### OpenAI Voices
| ID | Style |
|----|-------|
| `onyx` | Deep, authoritative |
| `nova` | Friendly, upbeat |
| `alloy` | Balanced, versatile |

## Output Files

Generated files are saved to `demo/output/`:
- `*.mp3` - Audio file
- `*.srt` - SRT subtitles
- `*.vtt` - VTT subtitles
- `*.mp4` - HeyGen video (if --heygen)
