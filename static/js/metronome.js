document.addEventListener('DOMContentLoaded', function() {
    // Metronome elements
    const tempoDisplay = document.getElementById('tempoValue');
    const tempoSlider = document.getElementById('tempoSlider');
    const decreaseTempoBtn = document.getElementById('decreaseTempo');
    const increaseTempoBtn = document.getElementById('increaseTempo');
    const beatsPerMeasureSelect = document.getElementById('beatsPerMeasure');
    const startStopBtn = document.getElementById('startStop');
    const tapTempoBtn = document.getElementById('tap');
    const beatIndicators = document.querySelectorAll('.beat');
    
    // Audio context
    let audioContext = null;
    let isPlaying = false;
    let currentBeat = 0;
    let tempo = 120;
    let beatsPerMeasure = 4;
    let intervalId = null;
    let nextNoteTime = 0;
    let tapTimes = [];
    
    // Initialize audio context
    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    // Create metronome click sound
    function createClickSound(frequency, duration) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0.5;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }
    
    // Play click for current beat
    function playClick() {
        // First beat gets higher pitch
        const frequency = currentBeat === 0 ? 1000 : 800;
        createClickSound(frequency, 0.05);
        
        // Update beat indicators
        beatIndicators.forEach((indicator, index) => {
            indicator.classList.remove('active');
            if (index === currentBeat) {
                indicator.classList.add('active');
            }
        });
        
        // Increment beat counter
        currentBeat = (currentBeat + 1) % beatsPerMeasure;
    }
    
    // Schedule next metronome click
    function scheduleNextClick() {
        const secondsPerBeat = 60.0 / tempo;
        nextNoteTime += secondsPerBeat;
        
        setTimeout(() => {
            playClick();
        }, (nextNoteTime - audioContext.currentTime) * 1000);
    }
    
    // Start or stop the metronome
    function toggleMetronome() {
        if (isPlaying) {
            // Stop metronome
            clearInterval(intervalId);
            startStopBtn.innerHTML = '<i class="fas fa-play"></i>';
            startStopBtn.classList.remove('stop');
            startStopBtn.classList.add('play');
            isPlaying = false;
        } else {
            // Start metronome
            initAudioContext();
            currentBeat = 0;
            nextNoteTime = audioContext.currentTime;
            
            // Schedule clicks
            playClick();
            scheduleNextClick();
            
            // Set interval for scheduling future clicks
            const scheduleAheadTime = 0.1; // seconds
            intervalId = setInterval(() => {
                while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
                    scheduleNextClick();
                }
            }, 25);
            
            startStopBtn.innerHTML = '<i class="fas fa-stop"></i>';
            startStopBtn.classList.remove('play');
            startStopBtn.classList.add('stop');
            isPlaying = true;
        }
    }
    
    // Update tempo display
    function updateTempoDisplay() {
        tempoDisplay.textContent = tempo;
        tempoSlider.value = tempo;
    }
    
    // Update beat indicators based on time signature
    function updateBeatIndicators() {
        // Hide all beat indicators first
        beatIndicators.forEach(indicator => {
            indicator.style.display = 'none';
        });
        
        // Show only the number of beats we need
        for (let i = 0; i < beatsPerMeasure; i++) {
            if (i < beatIndicators.length) {
                beatIndicators[i].style.display = 'block';
            }
        }
        
        // Reset current beat
        currentBeat = 0;
        beatIndicators.forEach(indicator => indicator.classList.remove('active'));
        if (beatIndicators.length > 0) {
            beatIndicators[0].classList.add('active');
        }
    }
    
    // Calculate tempo from tap times
    function calculateTapTempo() {
        if (tapTimes.length <= 1) return;
        
        const deltas = [];
        for (let i = 1; i < tapTimes.length; i++) {
            deltas.push(tapTimes[i] - tapTimes[i-1]);
        }
        
        // Calculate average delta
        const avgDelta = deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
        const newTempo = Math.round(60000 / avgDelta); // Convert to BPM
        
        // Ensure tempo is within range
        if (newTempo >= 40 && newTempo <= 240) {
            tempo = newTempo;
            updateTempoDisplay();
        }
    }
    
    // Event listeners
    tempoSlider.addEventListener('input', function() {
        tempo = parseInt(this.value);
        updateTempoDisplay();
    });
    
    decreaseTempoBtn.addEventListener('click', function() {
        tempo = Math.max(40, tempo - 1);
        updateTempoDisplay();
    });
    
    increaseTempoBtn.addEventListener('click', function() {
        tempo = Math.min(240, tempo + 1);
        updateTempoDisplay();
    });
    
    beatsPerMeasureSelect.addEventListener('change', function() {
        beatsPerMeasure = parseInt(this.value);
        updateBeatIndicators();
    });
    
    startStopBtn.addEventListener('click', toggleMetronome);
    
    tapTempoBtn.addEventListener('click', function() {
        const now = Date.now();
        
        // If it's been more than 2 seconds since last tap, reset tap times
        if (tapTimes.length > 0 && now - tapTimes[tapTimes.length - 1] > 2000) {
            tapTimes = [];
        }
        
        tapTimes.push(now);
        
        // Keep only the last 4 taps
        if (tapTimes.length > 4) {
            tapTimes.shift();
        }
        
        calculateTapTempo();
    });
    
    // Initialize
    updateTempoDisplay();
    updateBeatIndicators();
});