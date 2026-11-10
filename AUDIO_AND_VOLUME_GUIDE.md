# Audio & Volume Control Guide

## Overview

The Water Reclaim game now features:
- **Sound Effects** for game actions (green blocks, red blocks, level completion)
- **Volume Control** slider on the game screen
- **Master Volume** system for centralized audio management
- **Browser Autoplay Policy** handling for seamless audio playback

---

## Sound Effects

### 1. Happy Sound (Green Block Found)
- **When**: Player finds a clean water block (green)
- **Sound**: Two ascending notes (C5 → E5)
- **Duration**: 200ms
- **Feedback**: +10 points, cyan text
- **Feel**: Cheerful and encouraging

### 2. Sad Sound (Red Block Found)
- **When**: Player finds a polluted water block (red)
- **Sound**: Two descending notes (G4 → C4)
- **Duration**: 250ms
- **Feedback**: -5 points, orange text
- **Feel**: Discouraging but not punishing

### 3. Celebration Sound (Level Complete)
- **When**: All green blocks found and level is completed
- **Sound**: Four ascending notes (C5 → E5 → G5 → C6)
- **Duration**: ~480ms total
- **Feedback**: Water fills, miner celebrates
- **Feel**: Triumphant and rewarding

---

## Volume Control

### Location
The volume control is located in the HUD (Head-Up Display) at the top of the game screen, below the difficulty level indicator.

### Layout
```
[🔊 VOL] [====●====] [50%]
```

### Features
- **Label**: 🔊 VOL (Speaker emoji + text)
- **Slider**: Adjustable range from 0% to 100%
- **Display**: Real-time percentage indicator
- **Range**: 0% (silent) to 100% (full volume)
- **Default**: 50%

### How to Use
1. Locate the volume slider below the "EASY/HARD" difficulty display
2. Click or drag the slider to adjust volume
3. Watch the percentage update in real-time
4. Volume affects all sound effects immediately

### Styling
- **Color**: Cyan/turquoise (#00ffcc)
- **Glow**: Subtle glow effect on hover
- **Theme**: Matches game's aesthetic
- **Responsive**: Works on desktop and mobile

---

## Technical Implementation

### Audio Architecture

#### Master Gain Node
```
All Sounds → Master Gain Node → System Output
```

This design allows:
- Single point of volume control
- Instant updates across all sounds
- Clean architecture for future enhancements

#### Audio Context Management
```javascript
getAudioContext()
  ├─ Create context if needed
  ├─ Create master gain node
  ├─ Connect to destination
  └─ Resume if suspended
```

#### Sound Synthesis
Each sound uses:
- **Separate Oscillators** per note (better stability)
- **Individual Gain Envelopes** for smooth fades
- **Frequency Values** set at creation time
- **Master Gain Routing** for volume control

### Files Modified

#### audio-utils.ts
```typescript
// Master volume control
setVolume(volume: number)  // Set volume (0-1)
getVolume(): number         // Get current volume

// Sound functions
playHappySound()           // Green block sound
playSadSound()             // Red block sound
playCelebrationSound()     // Level complete sound
```

#### apps.tsx
```typescript
// Volume state
const [volume, setVolumeState] = useState(getVolume())

// Volume handler
const handleVolumeChange = (newVolume: number) => {
  setVolumeState(newVolume)
  setVolume(newVolume)
}

// Volume slider in HUD
<input
  type="range"
  min="0"
  max="100"
  value={Math.round(volume * 100)}
  onChange={(e) => handleVolumeChange(parseFloat(e.target.value) / 100)}
/>
```

#### index.css
```css
/* Slider thumb styling */
input[type="range"]::-webkit-slider-thumb {
  width: 12px;
  height: 12px;
  background: #00ffcc;
  box-shadow: 0 0 8px rgba(0, 255, 204, 0.6);
}

/* Slider track styling */
input[type="range"]::-webkit-slider-runnable-track {
  background: linear-gradient(to right, rgba(0, 201, 255, 0.3), rgba(0, 255, 204, 0.4));
  height: 4px;
  border-radius: 2px;
}
```

---

## Browser Compatibility

### Supported Browsers
- ✅ Chrome/Edge (Chromium) v14+
- ✅ Firefox v25+
- ✅ Safari v14+
- ✅ Opera v11+
- ✅ Mobile Chrome/Safari

### Audio Context Handling
- Automatically detects suspended audio context
- Resumes on first user interaction
- Gracefully handles audio unavailability
- Console logging for debugging

### Range Input Support
- HTML5 range input with fallbacks
- Cross-browser CSS styling
- Keyboard accessible (arrow keys)
- Touch-friendly on mobile devices

---

## Troubleshooting

### No Sound at All

**Check these in order:**

1. **Volume Slider**
   - Is the slider above 0%?
   - Try moving to 50% or higher

2. **Browser Volume**
   - Check if browser tab is muted
   - Right-click tab → "Unmute"
   - Check browser volume in settings

3. **System Volume**
   - Is device volume turned up?
   - Check system audio output device
   - Try different speakers/headphones

4. **Browser Permission**
   - Some browsers require user interaction first
   - Try clicking a green block to trigger sound
   - Check browser console for errors

5. **Audio Context State**
   - Open browser console (F12)
   - Check for error messages
   - Audio context may need to be resumed

### Sound Too Quiet/Loud

**Solution:** Adjust the volume slider
- Slider too far left? Move right for louder
- Slider too far right? Move left for quieter
- Adjust to comfortable level (typically 50-75%)

### Specific Sound Not Playing

**Check which sound:**
- Green block not playing? Try finding a green block
- Red block not playing? Try finding a red block
- Celebration not playing? Complete a full level

**If one specific sound isn't working:**
1. Check volume slider is above 0%
2. Try other sounds first
3. Check browser console for errors

### Mobile Devices

**Audio Requirements:**
- First user interaction may be required
- Try tapping a block if no sound on load
- Some browsers autoplay audio with gesture
- Ensure device is not on silent mode

---

## Advanced: Customization

### Changing Default Volume
Edit audio-utils.ts:
```typescript
let masterVolume = 0.5  // Change 0.5 to desired value (0-1)
```

### Changing Sound Frequencies
Edit audio-utils.ts and modify frequency values:
```typescript
// Example: Change C5 to different note
osc.frequency.value = 523.25  // C5 (261.63 Hz = C4, etc.)
```

### Note Reference (Frequencies)
- C4: 261.63 Hz
- G4: 392 Hz
- C5: 523.25 Hz
- E5: 659.25 Hz
- G5: 783.99 Hz
- C6: 1047 Hz

### Adding More Sounds
```typescript
export function playCustomSound() {
  const ctx = getAudioContext()
  const masterGain = getMasterGain()
  const now = ctx.currentTime
  
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  
  osc.connect(gain)
  gain.connect(masterGain)  // Important: connect to master gain!
  
  // Your sound synthesis here
  osc.start(now)
  osc.stop(now + duration)
}
```

---

## Performance Notes

- **CPU**: Minimal impact, synthesized tones only
- **Memory**: Single audio context reused
- **Network**: No network requests needed
- **Battery**: Low power consumption
- **Mobile**: Optimized for mobile devices

---

## Accessibility

### Keyboard Support
- Tab to volume slider
- Arrow keys to adjust
- Enter to focus/activate

### Screen Readers
- Slider has aria-label
- Percentage display updates
- Status announcements for audio events

### Motion Preferences
- Respects prefers-reduced-motion
- Animations disabled if needed
- Sounds still play at full quality

---

## Future Enhancements

Potential improvements:
1. Sound preferences saving to localStorage
2. Different sound packs/themes
3. Mute button for quick silence
4. Sound effect toggle per action type
5. Music/background score option
6. Sound effect customization
7. Haptic feedback on mobile
8. Accessibility sound descriptions

---

## Support

If you encounter issues:

1. **Check Browser Console**
   - F12 to open Developer Tools
   - Look for error messages
   - Share errors for debugging

2. **Try Different Browser**
   - Test in Chrome, Firefox, Safari
   - Each may behave differently

3. **Test Basic Audio**
   - Open DevTools → Console
   - Type: `window.AudioContext` or `window.webkitAudioContext`
   - Should show function definition, not undefined

4. **Report Issues**
   - Include browser type and version
   - Describe what sounds don't work
   - Share console errors
   - Include device type (desktop/mobile)

---

## Credits

Sound effects generated using Web Audio API with pure sine wave synthesis.

Game theme and design: Water Reclaim
Audio implementation: Enhanced with volume control
