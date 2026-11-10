# Testing Guide for New Features

## Sound Effects Testing

### Green Block Sound (Happy Sound)
1. Start a game
2. Click/tap any green block
3. **Expected**: Hear two ascending beeps (cheerful sound)
4. **Visual Feedback**: Score increases by +10 points with green text

### Red Block Sound (Sad Sound)
1. Start a game
2. Click/tap any red block
3. **Expected**: Hear two descending beeps (sad sound)
4. **Visual Feedback**: Score decreases by -5 points with orange text

### Celebration Sound (Level Complete)
1. Start a game
2. Find all green blocks in a level (reach the bottom)
3. **Expected**: Hear a four-note ascending fanfare (C5 → E5 → G5 → C6)
4. **Visual Feedback**: Water tank fills, miner celebrates, level completion screen appears

## Milestone Testing

### Test Each Milestone
Complete the following to trigger milestones:

| Level | Milestone Title | Expected Display |
|-------|-----------------|------------------|
| 1 | Welcome to Water Reclaim! | 🌊 Shows on game start |
| 5 | Making Progress! | 💪 Shows when reaching level 5 |
| 10 | One Challenge Completed! | ✅ Shows when reaching level 10 |
| 15 | Clean Water Champion! | 🏆 Shows when reaching level 15 |
| 20 | Seriously Skilled! | ⭐ Shows when reaching level 20 |
| 25 | Quarter Century Milestone! | 🎉 Shows when reaching level 25 |
| 30 | Legendary Protector! | 👑 Shows when reaching level 30 |
| 50 | ULTIMATE WATER GUARDIAN! | 💎 Shows when reaching level 50 |
| 100 | IMMORTAL LEGEND! | 🌟 Shows when reaching level 100 |

### Milestone Display Verification
1. Reach a milestone level
2. **Expected UI Elements**:
   - Large emoji (48px)
   - Milestone title in cyan color
   - Thin cyan divider line
   - Motivational message
   - Level number display
   - Pop-in animation from center
   - Backdrop fade-in effect
3. **Duration**: Displays for 4 seconds, then fades out
4. **No Interruption**: Gameplay continues during milestone display

## Accessibility Testing

### Reduced Motion Preference
1. Enable system-wide "Reduce Motion" preference
2. Play a game reaching a milestone
3. **Expected**: All animations still work but appear instant

### Screen Reader Testing
1. Enable screen reader (VoiceOver, NVDA, JAWS)
2. Reach a milestone level
3. **Expected**: Screen reader announces milestone title and type="status" makes it a live region

### Audio Testing
1. Disable audio in browser dev tools → right-click → Mute audio
2. Click blocks and complete levels
3. **Expected**: Game works without errors, no console errors about audio context

## Browser Compatibility Testing

### Desktop Browsers
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari

### Mobile Browsers
- ✅ Chrome Mobile
- ✅ Safari iOS
- ✅ Firefox Mobile

## Performance Testing

1. Play for 10 consecutive levels without reset
2. Monitor browser performance in DevTools
3. **Expected**: No memory leaks, smooth animations, no frame drops
4. **CPU Usage**: Should remain low during milestone display

## Known Behavior

- **Audio Context**: If user hasn't interacted with page yet, audio may be delayed by browser autoplay policy
- **First Interaction**: Audio works immediately after user's first click
- **Muted Tab**: Audio won't play if browser tab is muted by user
- **Mobile**: May require user gesture for audio to play (browser security)

## Debugging Tips

### Check Console for Issues
```javascript
// Test audio manually in browser console
import { playHappySound, playSadSound, playCelebrationSound } from './audio-utils'
playHappySound()
playSadSound()
playCelebrationSound()
```

### Enable Audio Logging
Add to audio-utils.ts to see when audio plays:
```javascript
console.log('Playing happy sound')
console.log('Playing sad sound')
console.log('Playing celebration sound')
```

### Inspect Milestone State
In React DevTools, check:
- `currentMilestone` state
- `showMilestone` state
- `milestoneTimer` ref

## Feature Requests & Improvements

Potential enhancements:
1. Add sound toggle in settings
2. Add volume control slider
3. Add different sound effect packs
4. Add badge/achievement system
5. Save milestone progress to localStorage
6. Add sound effects for other events (trivia, game over)
