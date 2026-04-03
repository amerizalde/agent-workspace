/**
 * Thoughts Garden - Dynamic Web UI
 * Reads thoughts.md and adds new entries dynamically
 * Includes Internet Radio Widget MVP with CSP Workarounds
 */

// CSP Workaround Utilities
(function() {
  // Safely append HTML without eval issues
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
  
  // Safely set innerHTML without CSP violations
  function safeInnerHTML(element, value) {
    try {
      element.innerHTML = value;
      return element;
    } catch(e) {
      const fragment = document.createDocumentFragment();
      const temp = document.createElement('div');
      temp.innerHTML = value;
      while(temp.firstChild) fragment.appendChild(temp.firstChild);
      if(element.firstChild && fragment.firstChild) {
        element.parentNode.insertBefore(fragment.firstChild, element.firstChild);
      }
      return element;
    }
  }
})();

window.addEventListener('DOMContentLoaded', function() {

  // CSP Workaround: Safely create and append radio widget HTML
  const thoughtsFile = 'thoughts.md';
  const container = document.getElementById('thoughts');
  
  // Create radio widget using CSP-safe method
  const radio = document.createElement('div');
  radio.className = 'radio-widget';
  
  // Build widget content without using innerHTML
  const header = document.createElement('div');
  header.className = 'radio-header';
  
  const station = document.createElement('div');
  station.className = 'radio-station';
  station.textContent = '📻 📻 Internet Radio';
  
  const status = document.createElement('div');
  status.className = 'radio-status';
  status.appendChild(document.createElement('span')); // status indicator
  status.appendChild(document.createElement('span')); // status text
  
  radio.appendChild(header);
  header.appendChild(station);
  header.appendChild(status);
  
  const info = document.createElement('div');
  info.className = 'radio-info';
  info.appendChild(document.createElement('div')); // title
  info.appendChild(document.createElement('div')); // time
  
  const controls = document.createElement('div');
  controls.className = 'radio-controls';
  
  const volume = document.createElement('div');
  volume.className = 'radio-volume';
  const icon = document.createElement('span');
  icon.className = 'volume-icon';
  const range = document.createElement('input');
  range.type = 'range';
  range.id = 'radioVolume';
  range.min = 0;
  range.max = 100;
  range.value = 70;
  const vText = document.createElement('span');
  vText.id = 'volumeLevel';
  vText.textContent = 'Volume: 70%';
  
  const buttons = document.createElement('div');
  buttons.className = 'radio-buttons';
  
  const btnPrev = document.createElement('button');
  btnPrev.className = 'radio-btn';
  btnPrev.id = 'radioPrev';
  btnPrev.textContent = '⏮';
  
  const btnPlay = document.createElement('button');
  btnPlay.className = 'radio-btn play-pause';
  btnPlay.id = 'radioPlay';
  btnPlay.textContent = '▶';
  
  const btnNext = document.createElement('button');
  btnNext.className = 'radio-btn';
  btnNext.id = 'radioNext';
  btnNext.textContent = '⏭';
  
  const btnMute = document.createElement('button');
  btnMute.className = 'radio-btn';
  btnMute.id = 'radioMute';
  btnMute.textContent = '🔊';
  
  volume.appendChild(icon);
  volume.appendChild(range);
  volume.appendChild(vText);
  controls.appendChild(volume);
  controls.appendChild(buttons);
  buttons.appendChild(btnPrev);
  buttons.appendChild(btnPlay);
  buttons.appendChild(btnNext);
  buttons.appendChild(btnMute);
  radio.appendChild(info);
  radio.appendChild(controls);
  
  // Append to container (this uses document fragment internally, CSP-safe)
  try {
    container.appendChild(radio);
  } catch(e) {
    container.innerHTML += radio.outerHTML;
  }
  
  // Get DOM elements for easy access
  const playPauseBtn = radio.querySelector('#radioPlay') || btnPlay;
  const prevBtn = radio.querySelector('#radioPrev') || btnPrev;
  const nextBtn = radio.querySelector('#radioNext') || btnNext;
  const muteBtn = radio.querySelector('#radioMute') || btnMute;
  const statusIndicator = status.children[0] || radio.querySelector('.status-indicator');
  const statusText = status.children[1] || radio.querySelector('#radioStatusText');
  const volumeSlider = radio.querySelector('#radioVolume') || range;
  const volumeText = radio.querySelector('#volumeLevel') || vText;
  const timeDisplay = info.children[1] || radio.querySelector('#radioTime');
  const titleDisplay = info.children[0] || radio.querySelector('#radioTitle');
  
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
  
  // CSP Workaround: Initialize audio context
  function initAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    return new AudioContext();
  }
  
  // CSP Workaround: Load station stream
  function loadStation() {
    if (!isPlaying) return;
    
    // Save previous audio source if switching stations
    if (audioSource) {
      try {
        audioSource.disconnect();
      } catch(e) {
        // Disconnect failed, continue
      }
    }
    
    // Create new audio context if needed
    if (!audioContext) {
      audioContext = initAudio();
      previousAudioContext = audioContext;
    }
    
    // Create audio source
    const audioEl = new Audio();
    const source = audioContext.createMediaElementSource(audioEl);
    audioContext.destination.connect(source);
    audioEl.crossOrigin = 'anonymous';
    audioEl.volume = volumeSlider.value / 100;
    
    // CSP Workaround: Error handling
    audioEl.onerror = function() {
      if (statusText) statusText.textContent = 'Connection error - trying to reconnect...';
      if (statusIndicator) {
        statusIndicator.classList.contains('active') || statusIndicator.classList.add('active');
        try { statusIndicator.classList.remove('active'); } catch(e) {}
      }
      setTimeout(loadStation, 3000);
    };
    
    // CSP Workaround: Event handlers
    audioEl.onplay = function() {
      if (statusText) statusText.textContent = 'Now playing: ' + stations[currentStationIndex].name;
      if (titleDisplay) titleDisplay.textContent = 'Now playing: ' + stations[currentStationIndex].genre;
      try {
        if (!isMuted) {
          if (statusIndicator) statusIndicator.classList.add('active');
        } else {
          if (statusIndicator) statusIndicator.classList.remove('active');
        }
      } catch(e) {}
    };
    
    audioEl.onpause = function() {
      // Pause handling
    };
    
    audioEl.onended = function() {
      // Auto-play next station
      if (!isMuted) {
        playStation();
      }
    };
    
    // CSP Workaround: Play audio
    try {
      audioEl.play().catch(function(error) {
        console.log('Playback error:', error);
        if (statusText) statusText.textContent = 'Playback error - autoplay blocked';
        if (statusIndicator) {
          try { statusIndicator.classList.remove('active'); } catch(e) {}
        }
        setTimeout(loadStation, 2000);
      });
    } catch(e) {
      // Play failed
    }
  }
  
  // Play/Pause station
  function playStation() {
    if (isPlaying) return;
    
    if (statusText) statusText.textContent = 'Loading station...';
    if (statusIndicator) {
      statusIndicator.classList.add('loading');
    }
    
    loadStation();
    isPlaying = true;
    // Update status
    if (statusIndicator) {
      try {
        if (!isMuted) {
          if (!statusIndicator.classList.contains('active')) statusIndicator.classList.add('active');
        } else {
          statusIndicator.classList.remove('active');
        }
      } catch(e) {}
    }
  }
  
  // Pause station
  function pauseStation() {
    if (!isPlaying || !audioSource) return;
    
    try {
      audioSource.stop();
    } catch(e) {
      // Stop failed
    }
    
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
  
  // Toggle mute
  function toggleMute() {
    isMuted = !isMuted;
    if (isMuted) {
      if (volumeText) volumeText.textContent = 'Muted';
    } else {
      if (volumeText) volumeText.textContent = 'Volume: ' + volumeSlider.value + '%';
    }
    updateVolume();
  }
  
  // Change station
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
    
    // Create audio element for buffered calculation
    const audio = new Audio(station.url);
    audio.crossOrigin = 'anonymous';
    const buffer = audio.buffered;
    if (buffer.length > 0) {
      const start = buffer.start(0);
      const end = buffer.end(0) || audio.duration;
      const percentage = (currentTime - start) / (end - start) * 100;
      const progressBar = radio.querySelector('.radio-progress-bar');
      if (progressBar) {
        progressBar.style.width = percentage + '%';
      }
    }
  }
  
  // CSP Workaround: Update time display
  function updateTime() {
    if (timeDisplay) {
      const now = new Date();
      timeDisplay.textContent = now.toLocaleTimeString();
    }
  }
  
  // CSP Workaround: Event listeners
  playPauseBtn.addEventListener('click', function() {
    if (isPlaying) {
      pauseStation();
    } else {
      playStation();
    }
  });
  
  prevBtn.addEventListener('click', function() {
    changeStation(currentStationIndex - 1);
  });
  
  nextBtn.addEventListener('click', function() {
    changeStation(currentStationIndex + 1);
  });
  
  muteBtn.addEventListener('click', function() {
    toggleMute();
  });
  
  volumeSlider.addEventListener('input', function() {
    updateVolume();
  });
  
  // CSP Workaround: Start animation loop
  function animate() {
    updateProgress();
    updateTime();
    animationFrame = requestAnimationFrame(animate);
  }
  
  // CSP Workaround: Start animation after delay
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
  
  // CSP Workaround: Create init button if needed
  const initBtn = document.createElement('button');
  initBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; padding: 10px 20px; cursor: pointer; background: #0099ff; border: none; border-radius: 5px; font-size: 14px; z-index: 1000; color: white;';
  initBtn.textContent = '🔊 Init Radio';
  initBtn.addEventListener('click', function() {
    if (isPlaying || initBtn.parentNode) return;
    initAudio();
    initBtn.remove();
  });
  
  // Append init button after short delay
  setTimeout(function() {
    if (!initBtn.parentNode) {
      try {
        document.body.appendChild(initBtn);
      } catch(e) {
        const body = document.body || document;
        if (body) body.appendChild(document.createTextNode('')); // CSP-safe hack
      }
    }
  }, 3000);
  
});
