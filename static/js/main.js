document.addEventListener('DOMContentLoaded', function() {
    const audioForm = document.getElementById('audioForm');
    const fileInput = document.getElementById('audioFile');
    const startTimeSlider = document.getElementById('startTime');
    const endTimeSlider = document.getElementById('endTime');
    const startTimeValue = document.getElementById('startTimeValue');
    const endTimeValue = document.getElementById('endTimeValue');
    const audioPlayer = document.getElementById('audioPlayer');
    const predictionSection = document.getElementById('predictionSection');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorBox = document.getElementById('errorBox');
    
    let audioContext = null;
    let audioBuffer = null;
    let duration = 0;
    
    // Initialize audio context
    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    // Handle file selection
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Show file name
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSelected').style.display = 'block';
        
        // Reset UI
        predictionSection.style.display = 'none';
        errorBox.style.display = 'none';
        
        // Load audio file
        initAudioContext();
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            audioContext.decodeAudioData(arrayBuffer)
                .then(buffer => {
                    audioBuffer = buffer;
                    duration = buffer.duration;
                    
                    // Update sliders
                    startTimeSlider.max = duration;
                    endTimeSlider.max = duration;
                    endTimeSlider.value = duration;
                    startTimeValue.textContent = '0.0';
                    endTimeValue.textContent = duration.toFixed(1);
                    
                    // Create audio blob for preview
                    updateAudioPreview();
                    
                    // Show audio controls
                    document.getElementById('audioControls').style.display = 'block';
                })
                .catch(err => {
                    console.error('Error decoding audio data', err);
                    errorBox.textContent = 'Error loading audio file. Please try another file.';
                    errorBox.style.display = 'block';
                });
        };
        
        reader.onerror = function() {
            errorBox.textContent = 'Error reading file. Please try again.';
            errorBox.style.display = 'block';
        };
        
        reader.readAsArrayBuffer(file);
    });
    
    // Update audio preview when sliders change
    startTimeSlider.addEventListener('input', function() {
        const startTime = parseFloat(this.value);
        startTimeValue.textContent = startTime.toFixed(1);
        
        // Ensure end time is always greater than start time
        if (startTime >= parseFloat(endTimeSlider.value)) {
            endTimeSlider.value = Math.min(startTime + 0.1, duration).toFixed(1);
            endTimeValue.textContent = endTimeSlider.value;
        }
        
        updateAudioPreview();
    });
    
    endTimeSlider.addEventListener('input', function() {
        const endTime = parseFloat(this.value);
        endTimeValue.textContent = endTime.toFixed(1);
        
        // Ensure end time is always greater than start time
        if (endTime <= parseFloat(startTimeSlider.value)) {
            startTimeSlider.value = Math.max(endTime - 0.1, 0).toFixed(1);
            startTimeValue.textContent = startTimeSlider.value;
        }
        
        updateAudioPreview();
    });
    
    // Create trimmed audio preview
    function updateAudioPreview() {
        if (!audioBuffer) return;
        
        const startTime = parseFloat(startTimeSlider.value);
        const endTime = parseFloat(endTimeSlider.value);
        
        // Create a new buffer for the trimmed section
        const trimmedLength = (endTime - startTime) * audioBuffer.sampleRate;
        const trimmedBuffer = audioContext.createBuffer(
            audioBuffer.numberOfChannels,
            trimmedLength,
            audioBuffer.sampleRate
        );
        
        // Copy the trimmed section
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            const trimmedData = trimmedBuffer.getChannelData(channel);
            const startOffset = Math.floor(startTime * audioBuffer.sampleRate);
            
            for (let i = 0; i < trimmedLength; i++) {
                trimmedData[i] = channelData[startOffset + i];
            }
        }
        
        // Convert buffer to wav blob
        const wavBlob = bufferToWave(trimmedBuffer, trimmedBuffer.length);
        
        // Update audio player
        audioPlayer.src = URL.createObjectURL(wavBlob);
    }
    
    // Convert AudioBuffer to WAV Blob (simplified version)
    function bufferToWave(buffer, len) {
        const numOfChan = buffer.numberOfChannels;
        const length = len * numOfChan * 2 + 44;
        const arrayBuffer = new ArrayBuffer(length);
        const view = new DataView(arrayBuffer);
        const channels = [];
        let offset = 0;
        let pos = 0;
        
        // Extract channels
        for (let i = 0; i < numOfChan; i++) {
            channels.push(buffer.getChannelData(i));
        }
        
        // Write WAVE header
        setUint32(0x46464952);                         // "RIFF"
        setUint32(length - 8);                         // file length - 8
        setUint32(0x45564157);                         // "WAVE"
        setUint32(0x20746d66);                         // "fmt " chunk
        setUint32(16);                                 // length = 16
        setUint16(1);                                  // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(buffer.sampleRate);
        setUint32(buffer.sampleRate * 2 * numOfChan);  // avg. bytes/sec
        setUint16(numOfChan * 2);                     // block-align
        setUint16(16);                                 // 16-bit
        setUint32(0x61746164);                         // "data" chunk
        setUint32(length - pos - 4);                   // chunk length
        
        // Write interleaved data
        for (let i = 0; i < len; i++) {
            for (let ch = 0; ch < numOfChan; ch++) {
                // Clamp and convert to 16-bit
                const sample = Math.max(-1, Math.min(1, channels[ch][i]));
                const val = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                setInt16(val);
            }
        }
        
        // Helper functions
        function setUint16(data) {
            view.setUint16(pos, data, true);
            pos += 2;
        }
        
        function setUint32(data) {
            view.setUint32(pos, data, true);
            pos += 4;
        }
        
        function setInt16(data) {
            view.setInt16(pos, data, true);
            pos += 2;
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }
    
    // Handle form submission
    audioForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!fileInput.files[0]) {
            errorBox.textContent = 'Please select an audio file.';
            errorBox.style.display = 'block';
            return;
        }
        
        // Show loading spinner
        loadingSpinner.style.display = 'block';
        predictionSection.style.display = 'none';
        errorBox.style.display = 'none';
        
        // Get form data
        const formData = new FormData(audioForm);
        formData.append('start_time', startTimeSlider.value);
        formData.append('end_time', endTimeSlider.value);
        
        // Send to backend
        fetch('/predict', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Server error: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            loadingSpinner.style.display = 'none';
            
            if (data.error) {
                errorBox.textContent = data.error;
                errorBox.style.display = 'block';
                return;
            }
            
            // Display prediction
            document.getElementById('predictedGenre').textContent = data.predicted_genre;
            predictionSection.style.display = 'block';
            
            // Create chart if probabilities are available
            if (data.probabilities) {
                createChart(data.probabilities);
            }
        })
        .catch(error => {
            loadingSpinner.style.display = 'none';
            errorBox.textContent = 'Error: ' + error.message;
            errorBox.style.display = 'block';
            console.error('Error:', error);
        });
    });
    
    // Create probability chart using Chart.js
    function createChart(probabilities) {
        const ctx = document.getElementById('genreChart').getContext('2d');
        
        // Clear previous chart if it exists
        if (window.genreChart && typeof window.genreChart.destroy === 'function') {
            window.genreChart.destroy();
        }
        
        // Prepare data
        const labels = Object.keys(probabilities);
        const data = Object.values(probabilities).map(p => p * 100);
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(74, 20, 140, 0.8)');
        
        // Create chart
        window.genreChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Probability (%)',
                    data: data,
                    backgroundColor: gradient,
                    borderColor: 'rgba(255, 215, 0, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: '#E0E0E0'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#E0E0E0'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#E0E0E0'
                        }
                    }
                }
            }
        });
        
        document.getElementById('chartContainer').style.display = 'block';
    }
});