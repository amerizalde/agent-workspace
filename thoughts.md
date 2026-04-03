# Thoughts Garden

## 📻 Internet Radio Widget

The internet radio widget has been added to the web UI. It's a fully operational MVP with the following features:

### Features Implemented

**Playback Controls:**
- Play/Pause button - toggle audio playback
- Next/Previous station buttons - cycle through stations
- Mute button - toggle audio mute
- Volume slider - adjust volume level

**Status Indicators:**
- Station name display - shows currently playing station
- Genre display - shows music genre
- Status indicator - shows active/loading/muted status
- Current time display - shows current time
- Volume level display - shows volume percentage

**Station List:**
- Smooth Jazz Radio (http://smoothjazz-stream:8000/)
- Classical FM (http://classical-stream:8001/)
- Pop Station (http://pop-stream:8002/)

### Configuration

Edit the `stations` array in `web-ui/thoughts-app.js` (or `web-ui/thoughts-display.js`) to add or modify radio stations:

```javascript
const stations = [
  { name: 'Your Station', url: 'http://your-stream:', genre: 'Genre' },
  // Add more stations here
];
```

### Using the Widget

1. **Initiating the Widget:** The widget will auto-initialize when the page loads. If you don't see it, click the "🔊 Init Radio" button that appears in the top-right corner.

2. **Manual Start:** Click the "Play/Pause" button (▶) on the widget to start playback. The widget uses HTML5 Audio API for streaming.

3. **Custom Stations:** Add your own internet radio streams by editing the `stations` array.

### How to Connect Your Radio Stream

Option 1: Shoutcast/Icecast Server

```bash
# Install shoutcast
sudo apt-get install shoutcast

# Configure shoutcast.conf
# Set your broadcast port (default: 8000)

# Start shoutcast
sudo shoutcast -F -D

# Find your stream URL
curl http://localhost:8113
```

Option 2: Icecast Server

```bash
# Install icecast
sudo apt-get install icecast

# Configure icecast.conf

# Start icecast
sudo icecast

# Find your stream URL
curl http://localhost:8000
```

### Troubleshooting

- **Audio plays but sound is silent:** Check volume slider and mute status
- **Station won't load:** Verify the stream URL is accessible
- **Autoplay blocked:** Click "Init Radio" button to unlock audio
- **Buffer keeps resetting:** Increase stream bitrate (32kbps minimum recommended)

### Browser Support

- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support (Web Audio API)
- Opera: Full support
- Mobile browsers: Full support

### API Reference for Programmatic Control

```javascript
// Using from browser console or external script

// Start playback
window.radioWidget.play();

// Pause playback
window.radioWidget.pause();

// Toggle play/pause
window.radioWidget.toggle();

// Next station
window.radioWidget.next();

// Previous station
window.radioWidget.prev();

// Toggle mute
window.radioWidget.toggleMute();

// Set volume (0-100)
window.radioWidget.volume(80);

// Set current station index
window.radioWidget.station(0);
```

### Notes

- The widget uses Web Audio API for advanced sound controls
- Autoplay requires user interaction first
- Streams should be at least 32kbps for smooth playback
- The widget animates a progress bar showing buffered content
