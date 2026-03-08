document.addEventListener('DOMContentLoaded', function () {
    const toggleButton = document.getElementById('moodAssistantToggle');
    const panel = document.getElementById('moodAssistantPanel');
    const messagesEl = document.getElementById('moodAssistantMessages');
    const inputEl = document.getElementById('moodAssistantInput');
    const sendButton = document.getElementById('moodAssistantSend');
    const moodBadges = document.querySelectorAll('.mood-assistant-badge');

    if (!toggleButton || !panel || !messagesEl || !inputEl || !sendButton) {
        return;
    }

    function youtubeSearchUrl(query) {
        return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
    }

    var moodLibrary = {
        stressed: {
            label: 'stressed or overwhelmed',
            suggestions: {
                tracks: [
                    { label: 'Weightless – Marconi Union', query: 'Weightless Marconi Union' },
                    { label: 'Sunset Lover – Petit Biscuit', query: 'Sunset Lover Petit Biscuit' },
                    { label: 'Holocene – Bon Iver', query: 'Holocene Bon Iver' }
                ],
                albums: [
                    { label: 'In a Time Lapse – Ludovico Einaudi', query: 'In a Time Lapse Ludovico Einaudi album' },
                    { label: 'A Moment Apart – ODESZA', query: 'A Moment Apart ODESZA album' }
                ],
                instrumentals: [
                    { label: 'Lo-fi chillhop beats', query: 'lofi chillhop beats study' },
                    { label: 'Soft piano focus', query: 'soft piano focus music' }
                ]
            }
        },
        sad: {
            label: 'low or sad',
            suggestions: {
                tracks: [
                    { label: 'Fix You – Coldplay', query: 'Fix You Coldplay' },
                    { label: 'The Night We Met – Lord Huron', query: 'The Night We Met Lord Huron' },
                    { label: 'All I Want – Kodaline', query: 'All I Want Kodaline' }
                ],
                albums: [
                    { label: 'For Emma, Forever Ago – Bon Iver', query: 'For Emma Forever Ago Bon Iver album' },
                    { label: 'KOD – J. Cole', query: 'KOD J Cole album' }
                ],
                instrumentals: [
                    { label: 'Warm acoustic guitar instrumentals', query: 'acoustic guitar instrumental relaxing' },
                    { label: 'Gentle orchestral strings', query: 'gentle orchestral strings peaceful' }
                ]
            }
        },
        anxious: {
            label: 'anxious or on edge',
            suggestions: {
                tracks: [
                    { label: 'Breathe Me – Sia', query: 'Breathe Me Sia' },
                    { label: 'Bloom – The Paper Kites', query: 'Bloom The Paper Kites' },
                    { label: 'River Flows in You – Yiruma', query: 'River Flows in You Yiruma' }
                ],
                albums: [
                    { label: 'Kind of Blue – Miles Davis', query: 'Kind of Blue Miles Davis album' },
                    { label: 'Blue Note Relaxing Jazz', query: 'Blue Note relaxing jazz' }
                ],
                instrumentals: [
                    { label: 'Slow ambient pads', query: 'slow ambient pads relaxing' },
                    { label: 'Nature sounds with soft piano', query: 'nature sounds soft piano' }
                ]
            }
        },
        tired: {
            label: 'tired or drained',
            suggestions: {
                tracks: [
                    { label: 'Lost in Japan (Acoustic) – Shawn Mendes', query: 'Lost in Japan Acoustic Shawn Mendes' },
                    { label: 'Better Together – Jack Johnson', query: 'Better Together Jack Johnson' },
                    { label: 'Coffee – beabadoobee', query: 'Coffee beabadoobee' }
                ],
                albums: [
                    { label: 'Room for Squares – John Mayer', query: 'Room for Squares John Mayer album' },
                    { label: 'Bloom – Rufus Du Sol', query: 'Bloom Rufus Du Sol album' }
                ],
                instrumentals: [
                    { label: 'Downtempo chillstep', query: 'downtempo chillstep' },
                    { label: 'Soft lo-fi guitar beats', query: 'soft lofi guitar beats' }
                ]
            }
        },
        happy: {
            label: 'happy or excited',
            suggestions: {
                tracks: [
                    { label: 'Good as Hell – Lizzo', query: 'Good as Hell Lizzo' },
                    { label: 'Blinding Lights – The Weeknd', query: 'Blinding Lights The Weeknd' },
                    { label: 'Levitating – Dua Lipa', query: 'Levitating Dua Lipa' }
                ],
                albums: [
                    { label: 'Future Nostalgia – Dua Lipa', query: 'Future Nostalgia Dua Lipa album' },
                    { label: 'Random Access Memories – Daft Punk', query: 'Random Access Memories Daft Punk album' }
                ],
                instrumentals: [
                    { label: 'Funky nu-disco instrumentals', query: 'funky nu disco instrumental' },
                    { label: 'Uplifting EDM instrumental', query: 'uplifting EDM instrumental' }
                ]
            }
        },
        focus: {
            label: 'in need of focus',
            suggestions: {
                tracks: [
                    { label: 'Time – Hans Zimmer', query: 'Time Hans Zimmer Inception' },
                    { label: 'Experience – Ludovico Einaudi', query: 'Experience Ludovico Einaudi' },
                    { label: 'An Ending (Ascent) – Brian Eno', query: 'An Ending Ascent Brian Eno' }
                ],
                albums: [
                    { label: 'Classical Focus', query: 'classical music focus study' },
                    { label: 'Spaces – Nils Frahm', query: 'Spaces Nils Frahm album' }
                ],
                instrumentals: [
                    { label: 'Lo-fi beats to study', query: 'lofi beats to study' },
                    { label: 'Minimal techno deep work', query: 'minimal techno deep work' }
                ]
            }
        },
        neutral: {
            label: 'in a mixed or neutral state',
            suggestions: {
                tracks: [
                    { label: 'Electric Feel – MGMT', query: 'Electric Feel MGMT' },
                    { label: 'Midnight City – M83', query: 'Midnight City M83' },
                    { label: 'Redbone – Childish Gambino', query: 'Redbone Childish Gambino' }
                ],
                albums: [
                    { label: 'Currents – Tame Impala', query: 'Currents Tame Impala album' },
                    { label: 'In Rainbows – Radiohead', query: 'In Rainbows Radiohead album' }
                ],
                instrumentals: [
                    { label: 'Cinematic ambient', query: 'cinematic ambient music' },
                    { label: 'Instrumental post-rock', query: 'Explosions in the Sky instrumental' }
                ]
            }
        }
    };

    function inferMoodFromText(text) {
        var t = text.toLowerCase();
        if (/stress|overwhelm|burn.?out|pressure|tense/.test(t)) return 'stressed';
        if (/sad|down|depress|lonely|heartbroken|upset|cry/.test(t)) return 'sad';
        if (/anxious|anxiety|nervous|panic|worry|worried|on edge/.test(t)) return 'anxious';
        if (/tired|drained|exhausted|sleepy|fatigue|burnt/.test(t)) return 'tired';
        if (/happy|excited|joy|good mood|ecstatic|pumped/.test(t)) return 'happy';
        if (/focus|study|work|concentrate|deep work|productive/.test(t)) return 'focus';
        return 'neutral';
    }

    function appendMessage(text, author) {
        var bubble = document.createElement('div');
        bubble.className = 'mood-assistant-message ' + (author === 'user' ? 'user' : 'assistant');
        bubble.textContent = text;
        messagesEl.appendChild(bubble);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function parseLabel(label) {
        var idx = label.indexOf(' – ');
        if (idx !== -1) {
            return { name: label.substring(0, idx).trim(), artist: label.substring(idx + 3).trim() };
        }
        return { name: label, artist: '' };
    }

    function addOneRecommendation(parent, item, index) {
        var query = typeof item === 'string' ? item : item.query;
        var label = typeof item === 'string' ? item : item.label;
        var parsed = parseLabel(label);
        var wrap = document.createElement('div');
        wrap.className = 'mood-assistant-item';
        wrap.style.borderBottom = 'none';
        wrap.style.padding = '10px 0';
        
        var labelTitle = document.createElement('div');
        labelTitle.className = 'mood-assistant-item-name';
        labelTitle.style.textTransform = 'uppercase';
        labelTitle.style.color = '#FFD700';
        
        if (index === 0) {
            labelTitle.textContent = parsed.name.toUpperCase() + ' 1';
        } else {
            labelTitle.textContent = 'NEXT SONG SUGGESTION ' + (index + 1);
        }
        wrap.appendChild(labelTitle);

        if (index > 0) {
            var songName = document.createElement('div');
            songName.className = 'mood-assistant-item-name';
            songName.textContent = parsed.name.toUpperCase();
            wrap.appendChild(songName);
        }

        if (parsed.artist) {
            var artistEl = document.createElement('div');
            artistEl.className = 'mood-assistant-item-artist';
            artistEl.style.textTransform = 'uppercase';
            artistEl.textContent = parsed.artist.toUpperCase();
            wrap.appendChild(artistEl);
        }
        
        var a = document.createElement('a');
        a.href = youtubeSearchUrl(query);
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'mood-assistant-yt-link';
        a.style.textTransform = 'uppercase';
        
        var icon = document.createElement('i');
        icon.className = 'fa-brands fa-youtube';
        icon.setAttribute('aria-hidden', 'true');
        a.appendChild(icon);
        a.appendChild(document.createTextNode(' YOUTUBE LINK'));
        wrap.appendChild(a);
        
        parent.appendChild(wrap);
    }

    function appendRecommendationMessage(moodKey) {
        var mood = moodLibrary[moodKey] || moodLibrary.neutral;
        var bubble = document.createElement('div');
        bubble.className = 'mood-assistant-message assistant';
        bubble.style.flexDirection = 'column';
        bubble.style.alignItems = 'flex-start';

        var tracks = mood.suggestions.tracks || [];
        var count = 0;
        for (var i = 0; i < tracks.length && count < 3; i++) {
            addOneRecommendation(bubble, tracks[i], count);
            count++;
        }
        if (count < 3) {
            var albums = mood.suggestions.albums || [];
            for (var j = 0; j < albums.length && count < 3; j++) {
                addOneRecommendation(bubble, albums[j], count);
                count++;
            }
        }
        if (count < 3) {
            var inst = mood.suggestions.instrumentals || [];
            for (var k = 0; k < inst.length && count < 3; k++) {
                addOneRecommendation(bubble, inst[k], count);
                count++;
            }
        }

        messagesEl.appendChild(bubble);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function handleUserMood(text) {
        if (!text.trim()) return;
        appendMessage(text.trim(), 'user');
        inputEl.value = '';
        var moodKey = inferMoodFromText(text);
        appendRecommendationMessage(moodKey);
    }

    toggleButton.addEventListener('click', function () {
        panel.classList.toggle('open');
    });
    sendButton.addEventListener('click', function () {
        handleUserMood(inputEl.value);
    });
    inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleUserMood(inputEl.value);
        }
    });
    moodBadges.forEach(function (badge) {
        badge.addEventListener('click', function () {
            var mood = badge.getAttribute('data-mood');
            handleUserMood('I feel ' + (mood || 'a bit mixed') + ' right now.');
        });
    });
});
