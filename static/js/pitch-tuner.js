document.addEventListener('DOMContentLoaded', function() {
    // Pitch tuner elements
    const detectedNote = document.querySelector('.detected-note');
    const centsIndicator = document.querySelector('.cents-indicator');
    const centsValue = document.querySelector('.cents-value');
    const frequencyValue = document.getElementById('frequencyValue');
    const referencePitchInput = document.getElementById('referencePitch');
    const decreaseReferenceBtn = document.getElementById('decreaseReference');
    const increaseReferenceBtn = document.getElementById('increaseReference');
    const instrumentSelect = document.getElementById('instrument');
    const startRecordingBtn = document.getElementById('startRecording');
    const stringItems = document.querySelectorAll('.string-item');
    
    // Audio context and analyzer
    let audioContext = null;
    let analyser = null;
    let mediaStreamSource = null;
    let isRecording = false;
    let animationFrameId = null;
    let referencePitch = 440;
    
    // Notes data
    const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    
    // Instrument tunings
    const instrumentTunings = {
        guitar: ["E2", "A2", "D3", "G3", "B3", "E4"],
        bass: ["E1", "A1", "D2", "G2"],
        ukulele: ["G4", "C4", "E4", "A4"],
        violin: ["G3", "D4", "A4", "E5"],
        custom: []
    };
    
    // Initialize audio context
    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
        }
    }
    
    // Start recording audio
    async function startRecording() {
        try {
            initAudioContext();
            
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Connect the microphone to the analyzer
            mediaStreamSource = audioContext.createMediaStreamSource(stream);
            mediaStreamSource.connect(analyser);
            
            // Start analyzing pitch
            isRecording = true;
            startRecordingBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
            startRecordingBtn.classList.remove('record');
            startRecordingBtn.classList.add('stop');
            
            // Start the pitch detection loop
            detectPitch();
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check your permissions.');
        }
    }
    
    // Stop recording audio
    function stopRecording() {
        if (mediaStreamSource) {
            mediaStreamSource.disconnect();
            mediaStreamSource = null;
        }
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        isRecording = false;
        startRecordingBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Recording';
        startRecordingBtn.classList.remove('stop');
        startRecordingBtn.classList.add('record');
        
        // Reset displays
        detectedNote.textContent = '--';
        frequencyValue.textContent = '0.0';
        centsValue.textContent = '0¢';
        centsIndicator.style.transform = 'translateX(0)';
        
        // Reset string tuner
        stringItems.forEach(item => {
            item.querySelector('.string-status').className = 'string-status';
        });
    }
    
    // Detect pitch from audio input
    function detectPitch() {
        const bufferLength = analyser.fftSize;
        const buffer = new Float32Array(bufferLength);
        analyser.getFloatTimeDomainData(buffer);
        
        // Use autocorrelation to find the fundamental frequency
        const frequency = findFundamentalFrequency(buffer, audioContext.sampleRate);
        
        if (frequency > 0) {
            // Update frequency display
            frequencyValue.textContent = frequency.toFixed(1);
            
            // Calculate note and cents
            const noteData = frequencyToNote(frequency);
            
            // Update note display
            detectedNote.textContent = noteData.note;
            
            // Update cents display
            const centsOffset = Math.round(noteData.cents);
            centsValue.textContent = centsOffset + '¢';
            
            // Update cents indicator position (50px = 50 cents)
            const indicatorPosition = (centsOffset / 50) * 50;
            centsIndicator.style.transform = `translateX(${indicatorPosition}px)`;
            
            // Update string tuner
            updateStringTuner(noteData.fullNote);
        }
        
        // Continue the detection loop
        if (isRecording) {
            animationFrameId = requestAnimationFrame(detectPitch);
        }
    }
    
    // Find fundamental frequency using autocorrelation
    function findFundamentalFrequency(buffer, sampleRate) {
        // Implementation of autocorrelation for pitch detection
        const bufferLength = buffer.length;
        const correlations = new Array(bufferLength).fill(0);
        
        // Calculate autocorrelation
        for (let lag = 0; lag < bufferLength; lag++) {
            for (let i = 0; i < bufferLength - lag; i++) {
                correlations[lag] += buffer[i] * buffer[i + lag];
            }
        }
        
        // Find the peak after the first low point
        let foundLow = false;
        let peakIndex = -1;
        let peakValue = 0;
        
        for (let i = 1; i < correlations.length; i++) {
            if (!foundLow && correlations[i] < correlations[0] * 0.5) {
                foundLow = true;
            }
            
            if (foundLow && correlations[i] > peakValue) {
                peakValue = correlations[i];
                peakIndex = i;
            }
        }
        
        // Calculate frequency from peak index
        if (peakIndex > -1 && peakValue > 0.1) {
            const frequency = sampleRate / peakIndex;
            
            // Only return frequencies in the audible range (20Hz - 4000Hz)
            if (frequency >= 20 && frequency <= 4000) {
                return frequency;
            }
        }
        
        return -1; // No valid frequency found
    }
    
    // Convert frequency to note and cents
    function frequencyToNote(frequency) {
        // Calculate note using equal temperament formula
        // A4 = 440Hz (or reference pitch)
        const noteNum = 12 * (Math.log(frequency / referencePitch) / Math.log(2));
        const noteNumRounded = Math.round(noteNum);
        const octave = Math.floor(noteNumRounded / 12) + 4; // A4 is in octave 4
        const noteIndex = (noteNumRounded % 12 + 12) % 12; // Ensure positive index
        const cents = (noteNum - noteNumRounded) * 100;
        
        const note = noteStrings[noteIndex];
        const fullNote = note + octave;
        
        return { note, fullNote, cents };
    }
    
    // Update string tuner display
    function updateStringTuner(detectedFullNote) {
        stringItems.forEach(item => {
            const targetNote = item.getAttribute('data-note');
            const statusElement = item.querySelector('.string-status');
            
            if (detectedFullNote === targetNote) {
                statusElement.className = 'string-status in-tune';
            } else {
                statusElement.className = 'string-status';
            }
        });
    }
    
    // Update string tuner based on selected instrument
    function updateInstrumentTuning() {
        const instrument = instrumentSelect.value;
        const tuning = instrumentTunings[instrument];
        
        // Hide all string items first
        stringItems.forEach(item => {
            item.style.display = 'none';
        });
        
        // Show only the strings for the selected instrument
        tuning.forEach((note, index) => {
            if (index < stringItems.length) {
                const item = stringItems[index];
                item.style.display = 'flex';
                item.setAttribute('data-note', note);
                item.querySelector('.string-note').textContent = note.replace(/[0-9]/g, '');
            }
        });
    }
    
    // Event listeners
    startRecordingBtn.addEventListener('click', function() {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    });
    
    referencePitchInput.addEventListener('change', function() {
        referencePitch = parseInt(this.value);
    });
    
    decreaseReferenceBtn.addEventListener('click', function() {
        referencePitch = Math.max(420, referencePitch - 1);
        referencePitchInput.value = referencePitch;
    });
    
    increaseReferenceBtn.addEventListener('click', function() {
        referencePitch = Math.min(460, referencePitch + 1);
        referencePitchInput.value = referencePitch;
    });
    
    instrumentSelect.addEventListener('change', updateInstrumentTuning);
    
    // Initialize
    updateInstrumentTuning();
});