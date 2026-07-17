// BOARD 4 JS - DESK UTILITIES LOGIC

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all features
  initStickyNotes();
  initWaterTracker();
  initPostureReminder();
  initCalculator();
  initQuickLinks();
  initWeatherWidget();
});

/* ==========================================
   1. DIGITAL STICKY NOTES (SCRATCHPAD)
   ========================================== */
function initStickyNotes() {
  const container = document.getElementById('notes-container');
  const addBtn = document.getElementById('add-note-btn');
  
  let notes = JSON.parse(localStorage.getItem('desk_sticky_notes')) || [];
  
  if (notes.length === 0) {
    notes = [
      {
        id: Date.now(),
        text: "Welcome to your Scratchpad!\n\n",
        color: "yellow"
      }
    ];
    saveNotes();
  }
  
  function saveNotes() {
    localStorage.setItem('desk_sticky_notes', JSON.stringify(notes));
  }
  
  function renderNotes() {
    container.innerHTML = '';
    notes.forEach(note => {
      const noteEl = document.createElement('div');
      noteEl.className = `sticky-note note-${note.color}`;
      noteEl.dataset.id = note.id;
      
      noteEl.innerHTML = `
        <div class="sticky-note-header">
          <div class="note-color-dot" style="--theme-color: ${getColorHex(note.color)}" title="Change Color"></div>
          <button class="note-delete-btn" title="Delete Note">&times;</button>
        </div>
        <textarea class="sticky-note-body" placeholder="Write something...">${note.text}</textarea>
      `;
      
      // Event Listeners
      const textarea = noteEl.querySelector('.sticky-note-body');
      const deleteBtn = noteEl.querySelector('.note-delete-btn');
      const colorDot = noteEl.querySelector('.note-color-dot');
      
      // Text update listener
      textarea.addEventListener('input', (e) => {
        note.text = e.target.value;
        saveNotes();
      });
      
      // Delete note listener
      deleteBtn.addEventListener('click', () => {
        notes = notes.filter(n => n.id !== note.id);
        saveNotes();
        renderNotes();
      });
      
      // Change color listener (cycle colors)
      colorDot.addEventListener('click', () => {
        const colors = ['yellow', 'pink', 'blue', 'green'];
        const nextIdx = (colors.indexOf(note.color) + 1) % colors.length;
        note.color = colors[nextIdx];
        saveNotes();
        
        // Update styling dynamically without full re-render for smooth transition
        noteEl.className = `sticky-note note-${note.color}`;
        colorDot.style.setProperty('--theme-color', getColorHex(note.color));
      });
      
      container.appendChild(noteEl);
    });
  }
  
  function getColorHex(color) {
    switch (color) {
      case 'yellow': return '#fff7b1';
      case 'pink': return '#ffc4d0';
      case 'blue': return '#bbf1fa';
      case 'green': return '#c8f7c5';
      default: return '#fff7b1';
    }
  }
  
  addBtn.addEventListener('click', () => {
    const newNote = {
      id: Date.now(),
      text: '',
      color: 'yellow'
    };
    notes.push(newNote);
    saveNotes();
    renderNotes();
    
    // Automatically focus the new note's textarea
    const lastNoteEl = container.lastElementChild;
    if (lastNoteEl) {
      lastNoteEl.querySelector('.sticky-note-body').focus();
    }
  });
  
  renderNotes();
}

/* ==========================================
   2. DAILY WATER TRACKER
   ========================================== */
function initWaterTracker() {
  const cupsContainer = document.getElementById('water-cups');
  const waterLevel = document.getElementById('water-level');
  const waterPercentage = document.getElementById('water-percentage');
  const resetBtn = document.getElementById('reset-water');
  
  const TOTAL_CUPS = 8;
  let waterData = JSON.parse(localStorage.getItem('desk_water_tracker')) || { count: 0, date: "" };
  
  // Daily Reset check
  const todayStr = new Date().toDateString();
  if (waterData.date !== todayStr) {
    waterData.count = 0;
    waterData.date = todayStr;
    saveWaterData();
  }
  
  function saveWaterData() {
    localStorage.setItem('desk_water_tracker', JSON.stringify(waterData));
  }
  
  function updateWaterUI() {
    // Update progress glass
    const percentage = Math.round((waterData.count / TOTAL_CUPS) * 100);
    waterLevel.style.height = `${percentage}%`;
    waterPercentage.textContent = `${percentage}%`;
    
    // Render cups
    cupsContainer.innerHTML = '';
    for (let i = 0; i < TOTAL_CUPS; i++) {
      const cupSpan = document.createElement('span');
      cupSpan.className = `water-cup ${i < waterData.count ? 'active' : ''}`;
      cupSpan.innerHTML = '<i class="fa fa-tint"></i>';
      cupSpan.title = `Cup ${i + 1}`;
      
      cupSpan.addEventListener('click', () => {
        // Toggle cup behavior
        if (i + 1 === waterData.count) {
          waterData.count = i; // Clicking the last active cup toggles it off
        } else {
          waterData.count = i + 1; // Click to set water count
        }
        saveWaterData();
        updateWaterUI();
      });
      
      cupsContainer.appendChild(cupSpan);
    }
  }
  
  resetBtn.addEventListener('click', () => {
    waterData.count = 0;
    saveWaterData();
    updateWaterUI();
  });
  
  updateWaterUI();
}

/* ==========================================
   3. POSTURE & STRETCH REMINDER (DESK ALERTS)
   ========================================== */
function initPostureReminder() {
  const timerDisplay = document.getElementById('reminder-timer-display');
  const intervalSelect = document.getElementById('reminder-interval');
  const toggleBtn = document.getElementById('toggle-reminder');
  
  let totalSeconds = parseInt(intervalSelect.value) * 60;
  let timerId = null;
  let isRunning = false;
  
  function updateDisplay() {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  
  function playTone(freq, duration, delay) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + delay + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + duration);
      
      osc.start(audioCtx.currentTime + delay);
      osc.stop(audioCtx.currentTime + delay + duration);
    } catch (e) {
      console.warn("Chime blocked by policy or audio context issue", e);
    }
  }
  
  function triggerReminderAlert() {
    // 1. Play Chime Sequence
    playTone(523.25, 0.25, 0);    // C5
    playTone(659.25, 0.25, 0.12); // E5
    playTone(783.99, 0.4, 0.24);  // G5
    
    // 2. Browser Push Notification if permission granted
    if (Notification.permission === "granted") {
      new Notification("Desk Alert! 🧘", {
        body: "Time to check your posture, stretch, and relax your eyes!",
        icon: "./workmodeon.jpg"
      });
    }
    
    // 3. Inline Alert Fallback
    setTimeout(() => {
      alert("Time to stand up, stretch, and check your posture! 🧘");
    }, 300);
  }
  
  function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }
  
  function startTimer() {
    isRunning = true;
    toggleBtn.innerHTML = '<i class="fa fa-pause"></i> Pause';
    requestNotificationPermission();
    
    timerId = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds--;
        updateDisplay();
      } else {
        clearInterval(timerId);
        triggerReminderAlert();
        
        // Reset to full duration and restart automatically
        totalSeconds = parseInt(intervalSelect.value) * 60;
        updateDisplay();
        startTimer();
      }
    }, 1000);
  }
  
  function pauseTimer() {
    isRunning = false;
    toggleBtn.innerHTML = '<i class="fa fa-play"></i> Start';
    clearInterval(timerId);
  }
  
  toggleBtn.addEventListener('click', () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });
  
  intervalSelect.addEventListener('change', () => {
    pauseTimer();
    totalSeconds = parseInt(intervalSelect.value) * 60;
    updateDisplay();
  });
  
  updateDisplay();
}

/* ==========================================
   4. DESK QUICK-CALCULATOR
   ========================================== */
function initCalculator() {
  const display = document.getElementById('calc-display');
  const buttons = document.querySelectorAll('.calc-btn');
  
  let currentExpression = '';
  
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.val;
      
      if (val === 'C') {
        currentExpression = '';
        display.textContent = '0';
      } else if (val === 'back') {
        currentExpression = currentExpression.trim();
        if (currentExpression.endsWith(' ') || currentExpression.endsWith(' +') || currentExpression.endsWith(' -') || currentExpression.endsWith(' *') || currentExpression.endsWith(' /') || currentExpression.endsWith(' %')) {
          currentExpression = currentExpression.substring(0, currentExpression.length - 3);
        } else {
          currentExpression = currentExpression.substring(0, currentExpression.length - 1);
        }
        display.textContent = currentExpression || '0';
      } else if (['+', '-', '*', '/', '%'].includes(val)) {
        // Prevent double operators
        if (currentExpression !== '' && !currentExpression.endsWith(' ')) {
          currentExpression += ` ${val} `;
          display.textContent = currentExpression;
        }
      } else if (val === '=') {
        if (currentExpression !== '') {
          const result = evaluateArithmetic(currentExpression);
          display.textContent = result;
          currentExpression = String(result); // Seed result for next calculation
        }
      } else {
        // Number or dot
        if (display.textContent === '0' && val !== '.') {
          currentExpression = val;
        } else {
          currentExpression += val;
        }
        display.textContent = currentExpression;
      }
    });
  });
  
  // Safe math tokenizer & evaluator
  function evaluateArithmetic(expr) {
    // Regex matching numbers (with decimals) or operator tokens
    const tokens = expr.match(/\d+\.?\d*|[-+*/%]/g);
    if (!tokens) return '0';
    
    // Parse numbers
    const parsedTokens = tokens.map(t => {
      if (['+', '-', '*', '/', '%'].includes(t)) return t;
      return parseFloat(t);
    });
    
    // Pass 1: Multiplication, Division, and Modulo
    const pass1 = [];
    for (let i = 0; i < parsedTokens.length; i++) {
      const token = parsedTokens[i];
      if (token === '*' || token === '/' || token === '%') {
        const prev = pass1.pop();
        const next = parsedTokens[++i];
        if (prev === undefined || next === undefined) return 'Error';
        if (token === '*') pass1.push(prev * next);
        else if (token === '/') {
          if (next === 0) return 'Error';
          pass1.push(prev / next);
        }
        else pass1.push(prev % next);
      } else {
        pass1.push(token);
      }
    }
    
    // Pass 2: Addition and Subtraction
    if (pass1.length === 0) return '0';
    let result = pass1[0];
    if (typeof result !== 'number') return 'Error';
    
    for (let i = 1; i < pass1.length; i += 2) {
      const op = pass1[i];
      const val = pass1[i+1];
      if (val === undefined || typeof val !== 'number') return 'Error';
      if (op === '+') result += val;
      else if (op === '-') result -= val;
      else return 'Error';
    }
    
    // Mitigate IEEE 754 precision issues (e.g., 0.1 + 0.2 = 0.30000000000000004)
    return Math.round(result * 1000000) / 1000000;
  }
}


function initQuickLinks() {
  const grid = document.getElementById('quick-links-grid');
  const editBtn = document.getElementById('edit-links-btn');
  const form = document.getElementById('add-link-form');
  const nameInput = document.getElementById('link-name-input');
  const urlInput = document.getElementById('link-url-input');
  
  let links = JSON.parse(localStorage.getItem('desk_quick_links')) || [];
  let isEditing = false;
  
  if (links.length === 0) {
    links = [
      { name: 'Google', url: 'https://google.com' },
      { name: 'GitHub', url: 'https://github.com' },
      { name: 'YouTube', url: 'https://youtube.com' },
      { name: 'Gmail', url: 'https://mail.google.com' }
    ];
    saveLinks();
  }
  
  function saveLinks() {
    localStorage.setItem('desk_quick_links', JSON.stringify(links));
  }
  
  function getIconClass(name) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('google')) return 'fa-google';
    if (lowerName.includes('github')) return 'fa-github';
    if (lowerName.includes('youtube')) return 'fa-youtube-play';
    if (lowerName.includes('mail') || lowerName.includes('gmail')) return 'fa-envelope';
    if (lowerName.includes('linkedin')) return 'fa-linkedin';
    if (lowerName.includes('facebook')) return 'fa-facebook';
    if (lowerName.includes('twitter')) return 'fa-twitter';
    if (lowerName.includes('spotify')) return 'fa-spotify';
    if (lowerName.includes('reddit')) return 'fa-reddit';
    if (lowerName.includes('stack')) return 'fa-stack-overflow';
    return 'fa-link';
  }
  
  function renderLinks() {
    grid.innerHTML = '';
    links.forEach(link => {
      const item = document.createElement('a');
      item.className = 'shortcut-item';
      item.href = link.url;
      item.target = '_blank';
      
      const iconClass = getIconClass(link.name);
      item.innerHTML = `
        <div class="shortcut-icon"><i class="fa ${iconClass}"></i></div>
        <div class="shortcut-name">${link.name}</div>
      `;
      
      if (isEditing) {
        // Disable link navigation in edit mode
        item.removeAttribute('href');
        item.style.cursor = 'default';
        
        const delBtn = document.createElement('span');
        delBtn.className = 'shortcut-delete';
        delBtn.innerHTML = '&times;';
        delBtn.title = `Delete ${link.name}`;
        
        delBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          links = links.filter(l => l.url !== link.url);
          saveLinks();
          renderLinks();
        });
        
        item.appendChild(delBtn);
      }
      
      grid.appendChild(item);
    });
  }
  
  editBtn.addEventListener('click', () => {
    isEditing = !isEditing;
    editBtn.innerHTML = isEditing ? '<i class="fa fa-check"></i> Done' : '<i class="fa fa-cog"></i> Edit Links';
    form.style.display = isEditing ? 'flex' : 'none';
    renderLinks();
  });
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    
    if (name && url) {
      links.push({ name, url });
      saveLinks();
      nameInput.value = '';
      urlInput.value = '';
      renderLinks();
    }
  });
  
  renderLinks();
}


function initWeatherWidget() {
  const cityEl = document.getElementById('weather-city');
  const tempEl = document.getElementById('weather-temp');
  const descEl = document.getElementById('weather-desc');
  const iconContainer = document.getElementById('weather-icon-container');
  const searchForm = document.getElementById('weather-search-form');
  const searchInput = document.getElementById('weather-city-input');
  
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  
  function updateLoadingUI() {
    tempEl.textContent = '--';
    descEl.textContent = 'Loading weather...';
    iconContainer.innerHTML = '<i class="fa fa-spinner fa-spin fa-2x"></i>';
  }
  
  function showErrorUI(msg) {
    tempEl.textContent = 'Error';
    descEl.textContent = msg;
    iconContainer.innerHTML = '<i class="fa fa-exclamation-triangle"></i>';
  }
  
  function getWeatherDetails(code) {
    // Standard WMO weather interpretation codes
    if (code === 0) {
      return { desc: 'clear sky', iconClass: 'fa-sun-o', animationClass: 'weather-sun' };
    }
    if ([1, 2, 3].includes(code)) {
      return { desc: 'partly cloudy', iconClass: 'fa-cloud', animationClass: 'weather-cloud' };
    }
    if ([45, 48].includes(code)) {
      return { desc: 'foggy', iconClass: 'fa-cloud', animationClass: 'weather-cloud' };
    }
    if ([51, 53, 55, 56, 57].includes(code)) {
      return { desc: 'drizzle', iconClass: 'fa-tint', animationClass: 'weather-rain' };
    }
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
      return { desc: 'rainy', iconClass: 'fa-tint', animationClass: 'weather-rain' };
    }
    if ([71, 73, 75, 77, 85, 86].includes(code)) {
      return { desc: 'snowy', iconClass: 'fa-snowflake-o', animationClass: 'weather-snow' };
    }
    if ([95, 96, 99].includes(code)) {
      return { desc: 'thunderstorm', iconClass: 'fa-bolt', animationClass: 'weather-storm' };
    }
    return { desc: 'cloudy', iconClass: 'fa-cloud', animationClass: 'weather-cloud' };
  }
  
  function renderWeather(info) {
    cityEl.textContent = info.city;
    tempEl.textContent = Math.round(info.temp);
    
    const details = getWeatherDetails(info.weatherCode);
    descEl.textContent = details.desc;
    iconContainer.innerHTML = `<i class="fa ${details.iconClass} ${details.animationClass}"></i>`;
  }
  
  async function fetchWeatherByCoords(lat, lon, cityName) {
    try {
      updateLoadingUI();
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      const data = await res.json();
      
      if (data && data.current_weather) {
        const weatherInfo = {
          city: cityName,
          temp: data.current_weather.temperature,
          weatherCode: data.current_weather.weathercode
        };
        
        localStorage.setItem('desk_weather_cache', JSON.stringify({
          timestamp: Date.now(),
          data: weatherInfo
        }));
        
        renderWeather(weatherInfo);
      } else {
        showErrorUI("Weather data unavailable");
      }
    } catch (err) {
      console.error(err);
      showErrorUI("Failed to fetch weather");
    }
  }
  
  async function fetchWeatherByCity(cityName) {
    try {
      updateLoadingUI();
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      
      if (geoData && geoData.results && geoData.results.length > 0) {
        const result = geoData.results[0];
        const dispName = `${result.name}, ${result.country_code ? result.country_code.toUpperCase() : ''}`;
        fetchWeatherByCoords(result.latitude, result.longitude, dispName);
      } else {
        showErrorUI("City not found");
      }
    } catch (err) {
      console.error(err);
      showErrorUI("Search request failed");
    }
  }
  
  function loadInitialWeather() {
    const cached = JSON.parse(localStorage.getItem('desk_weather_cache'));
    
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      renderWeather(cached.data);
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchWeatherByCoords(position.coords.latitude, position.coords.longitude, "Your Location");
          },
          (err) => {
            console.warn("Geolocation blocked/failed, defaulting to Tokyo", err);
            fetchWeatherByCity("Tokyo");
          },
          { timeout: 8000 }
        );
      } else {
        fetchWeatherByCity("Tokyo");
      }
    }
  }
  
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = searchInput.value.trim();
    if (city) {
      fetchWeatherByCity(city);
      searchInput.value = '';
    }
  });
  
  loadInitialWeather();
}
