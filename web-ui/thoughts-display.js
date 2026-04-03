/**
 * Thought Garden Web UI
 * This script reads thoughts.md and displays it beautifully
 * Includes Internet Radio Widget Support with CSP Workarounds
 */

// CSP Workaround Utils (duplicate for standalone)
(function() {
  function safeAppendHTML(html, parent) {
    try {
      const fragment = document.createDocumentFragment();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }
      if (parent) parent.appendChild(fragment.firstChild || fragment);
      return fragment.firstChild;
    } catch(e) {
      if (parent) parent.innerHTML = html + (parent.innerHTML || '');
      return null;
    }
  }
})();

// When the page loads
window.addEventListener('DOMContentLoaded', function() {
  
  // Internet Radio Widget Elements - CSP Safe Access
  const radioWidget = document.querySelector('.radio-widget');
  if (!radioWidget) return;
  
  // CSP Workaround: Safely get DOM elements
  function safeQuery(selector, fallback) {
    try {
      return radioWidget.querySelector(selector) || fallback;
    } catch(e) {
      return fallback || null;
    }
  }
  
  const playPauseBtn = safeQuery('#radioPlay');
  const prevBtn = safeQuery('#radioPrev');
  const nextBtn = safeQuery('#radioNext');
  const muteBtn = safeQuery('#radioMute');
  const statusIndicator = safeQuery('.status-indicator');
  const statusText = safeQuery('#radioStatusText');
  const volumeSlider = safeQuery('#radioVolume');
  const volumeText = safeQuery('#volumeLevel');
  const timeDisplay = safeQuery('#radioTime');
  const titleDisplay = safeQuery('#radioTitle');
  
  // Station list
  const stations = [
    { name: 'Smooth Jazz Radio', url: 'http://smoothjazz-stream:8000/', genre: 'Smooth Jazz' },
    { name: 'Classical FM', url: 'http://classical-stream:8001/', genre: 'Classical' },
    { name: 'Pop Station', url: 'http://pop-stream:8002/', genre: 'Pop' }
  ];
  
  let currentStationIndex = 0;
  let isPlaying = false;
  let audioContext = null;
  let audioSource = null;
  let previousAudioContext = null;
  let isMuted = false;
  let animationFrame = null;
  
  // CSP Workaround: Init audio context
  function initAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    return new AudioContext();
  }
  
  // CSP Workaround: Load station stream
  function loadStation() {
    if (!isPlaying) return;
    
    try {
      if (audioSource) {
        audioSource.disconnect();
      }
    } catch(e) {}
    
    if (!audioContext) {
      audioContext = initAudio();
      previousAudioContext = audioContext;
    }
    
    try {
      const audioEl = new Audio();
      const source = audioContext.createMediaElementSource(audioEl);
      audioContext.destination.connect(source);
      
      const station = stations[currentStationIndex];
      audioEl.crossOrigin = 'anonymous';
      audioEl.volume = volumeSlider.value / 100;
      
      audioEl.onerror = function() {
        if (statusText) statusText.textContent = 'Connection error - trying to reconnect...';
        if (statusIndicator) {
          try {
            if (!statusIndicator.classList.contains('active')) statusIndicator.classList.add('active');
          } catch(e) {}
        }
        setTimeout(loadStation, 3000);
      };
      
      audioEl.onplay = function() {
        if (statusText) statusText.textContent = 'Now playing: ' + stations[currentStationIndex].name;
        if (titleDisplay) titleDisplay.textContent = 'Now playing: ' + stations[currentStationIndex].genre;
        if (statusIndicator) {
          if (isMuted) {
            statusIndicator.classList.remove('active');
          } else {
            statusIndicator.classList.add('active');
          }
        }
      };
      
      audioEl.onpause = function() {};
      
      audioEl.onended = function() {
        if (!isMuted) {
          playStation();
        }
      };
      
      try {
        audioEl.play().catch(function(error) {
          console.log('Playback error:', error);
          if (statusText) statusText.textContent = 'Playback error - autoplay blocked';
          if (statusIndicator) {
            statusIndicator.classList.remove('active');
          }
          setTimeout(loadStation, 2000);
        });
      } catch(e) {}
    } catch(err) {
      // Load failed
    }
  }
  
  // CSP Workaround: Play/Pause station
  function playStation() {
    if (isPlaying) return;
    
    if (statusText) statusText.textContent = 'Loading station...';
    if (statusIndicator) statusIndicator.classList.add('loading');
    
    loadStation();
    isPlaying = true;
    
    if (statusIndicator) {
      if (!isMuted) {
        statusIndicator.classList.add('active');
      } else {
        statusIndicator.classList.remove('active');
      }
    }
  }
  
  // CSP Workaround: Pause station
  function pauseStation() {
    if (!isPlaying || !audioSource) return;
    
    try {
      audioSource.stop();
    } catch(e) {}
    
    isPlaying = false;
  }
  
  // CSP Workaround: Update status indicator
  function updateStatus(isActive) {
    if (statusIndicator) {
      if (isActive) {
        if (isMuted) {
          statusIndicator.classList.remove('active');
          statusIndicator.classList.add('active');
        } else {
          statusIndicator.classList.add('active');
        }
      } else {
        statusIndicator.classList.remove('active');
      }
    }
  }
  
  // CSP Workaround: Update volume
  function updateVolume() {
    if (!audioContext || !audioSource) return;
    const volume = volumeSlider.value / 100;
    audioContext.destination.volume = volume;
    if (!isMuted && volumeText) {
      volumeText.textContent = 'Volume: ' + volumeSlider.value + '%';
    }
  }
  
  // CSP Workaround: Toggle mute
  function toggleMute() {
    isMuted = !isMuted;
    if (isMuted) {
      if (volumeText) volumeText.textContent = 'Muted';
    } else {
      if (volumeText) volumeText.textContent = 'Volume: ' + volumeSlider.value + '%';
    }
    updateVolume();
  }
  
  // CSP Workaround: Change station
  function changeStation(index) {
    currentStationIndex = (index + stations.length) % stations.length;
    if (titleDisplay) {
      titleDisplay.textContent = 'Now playing: ' + stations[currentStationIndex].genre;
    }
    loadStation();
  }
  
  // CSP Workaround: Update progress bar
  function updateProgress() {
    if (!audioContext) return;
    
    const currentTime = audioContext.currentTime;
    const station = stations[currentStationIndex];
    
    try {
      const audio = new Audio(station.url);
      audio.crossOrigin = 'anonymous';
      const buffer = audio.buffered;
      if (buffer.length > 0) {
        const start = buffer.start(0);
        const end = buffer.end(0) || audio.duration;
        const percentage = (currentTime - start) / (end - start) * 100;
        const progressBar = document.querySelector('.radio-progress-bar');
        if (progressBar) {
          progressBar.style.width = percentage + '%';
        }
      }
    } catch(e) {}
  }
  
  // CSP Workaround: Update time display
  function updateTime() {
    if (timeDisplay) {
      const now = new Date();
      timeDisplay.textContent = now.toLocaleTimeString();
    }
  }
  
  // CSP Workaround: Event listeners
  playPauseBtn && playPauseBtn.addEventListener('click', function() {
    if (isPlaying) {
      pauseStation();
    } else {
      playStation();
    }
  });
  
  nextBtn && nextBtn.addEventListener('click', function() {
    changeStation(currentStationIndex + 1);
  });
  
  prevBtn && prevBtn.addEventListener('click', function() {
    changeStation(currentStationIndex - 1);
  });
  
  muteBtn && muteBtn.addEventListener('click', function() {
    toggleMute();
  });
  
  volumeSlider && volumeSlider.addEventListener('input', function() {
    updateVolume();
  });
  
  // CSP Workaround: Start animation loop
  function animate() {
    updateProgress();
    updateTime();
    animationFrame = requestAnimationFrame(animate);
  }
  
  // CSP Workaround: Start animation
  setTimeout(animate, 1000);
  
  // CSP Workaround: Expose radio widget controls globally
  window.radioWidget = {
    play: function() { playStation(); },
    pause: function() { pauseStation(); },
    toggle: function() { isPlaying ? pauseStation() : playStation(); },
    next: function() { changeStation(currentStationIndex + 1); },
    prev: function() { changeStation(currentStationIndex - 1); },
    mute: function() { toggleMute(); },
    volume: function(value) { volumeSlider.value = value || 70; updateVolume(); },
    station: function(index) { changeStation(index || 0); }
  };
  
  // CSP Workaround: Create init button after delay
  function initButton() {
    try {
      if (!document.querySelector('.init-radio-btn')) {
        const btn = document.createElement('button');
        btn.style.cssText = 'position: fixed; top: 10px; right: 10px; padding: 10px 20px; cursor: pointer; background: #0099ff; border: none; border-radius: 5px; font-size: 14px; z-index: 1000; color: white;';
        btn.textContent = '🔊 Init Radio';
        btn.addEventListener('click', function() {
          if (isPlaying || btn.parentNode) return;
          initAudio();
          btn.remove();
        });
        document.body.appendChild(btn);
      }
    } catch(e) {}
  }
  
  // CSP Workaround: Initialize after delay
  setTimeout(initButton, 3000);
  
});
