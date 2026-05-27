// ==========================================================
// INTERACTIONS.JS — All interactive features for HBD Pages
// Fireworks, Quiz, Voice Recorder, Love Notes, Constellation, Gift Box
// ==========================================================

// Ganti string di bawah dengan URL Web App dari Google Apps Script Anda
const GAS_URL = "https://script.google.com/macros/s/AKfycbzI-FCSrVtDt8o7pE2TR-o8EYTxp_iC0GRUSU1YVr_KIwWLmgrT3E57_HWAl8aXgt4IdQ/exec";

// ===================================================
// 1. FIREWORKS ENGINE
// ===================================================
function initFireworks(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId = null;
    let isActive = false;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * (window.devicePixelRatio || 1);
        canvas.height = rect.height * (window.devicePixelRatio || 1);
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.life = 1;
            this.decay = 0.012 + Math.random() * 0.015;
            this.size = 1.5 + Math.random() * 2;
            this.trail = [];
        }
        update() {
            this.trail.push({ x: this.x, y: this.y, life: this.life });
            if (this.trail.length > 6) this.trail.shift();
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.04; // gravity
            this.life -= this.decay;
        }
        draw(ctx) {
            // Trail
            for (let i = 0; i < this.trail.length; i++) {
                const t = this.trail[i];
                ctx.beginPath();
                ctx.arc(t.x, t.y, this.size * (i / this.trail.length) * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = this.color.replace('1)', (t.life * 0.3) + ')');
                ctx.fill();
            }
            // Main
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color.replace('1)', this.life + ')');
            ctx.fill();
        }
    }

    function explode(x, y) {
        const colors = [
            'rgba(255, 107, 157, 1)', 'rgba(168, 85, 247, 1)',
            'rgba(251, 191, 36, 1)', 'rgba(232, 67, 147, 1)',
            'rgba(102, 126, 234, 1)', 'rgba(52, 211, 153, 1)',
            'rgba(249, 115, 22, 1)'
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const count = 40 + Math.floor(Math.random() * 30);
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(x, y, color));
        }
        if (navigator.vibrate) navigator.vibrate(30);
        const fwAudio = new Audio('fireworks.mp3');
        fwAudio.volume = 0.5;
        fwAudio.play().catch(e => { });
    }

    function animate() {
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => { p.update(); p.draw(ctx); });
        if (particles.length > 0 || isActive) {
            animId = requestAnimationFrame(animate);
        }
    }

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        if (e.touches) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    canvas.addEventListener('click', (e) => {
        const pos = getPos(e);
        explode(pos.x, pos.y);
        if (!animId) animate();
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const pos = getPos(e);
        explode(pos.x, pos.y);
        if (!animId) animate();
    }, { passive: false });

    // Auto-launch a few when visible
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isActive) {
                isActive = true;
                const rect = canvas.getBoundingClientRect();
                setTimeout(() => { explode(rect.width * 0.3, rect.height * 0.4); animate(); }, 300);
                setTimeout(() => explode(rect.width * 0.7, rect.height * 0.3), 700);
                setTimeout(() => explode(rect.width * 0.5, rect.height * 0.5), 1100);
            }
        });
    }, { threshold: 0.3 });
    obs.observe(canvas);
}


// ===================================================
// 2. LOVE QUIZ
// ===================================================
function initQuiz(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const questions = [
        {
            q: "Kapan kita jadian? 🥰",
            options: ["7 Agustus", "9 Agustus", "11 Agustus", "15 Agustus"],
            answer: 2
        },
        {
            q: "Kamu sayang aku engga? 🥺",
            options: ["Engga sayang", "Biasa aja", "Gak tau", "Iya, sayang banget! ❤️"],
            answer: 3
        },
        {
            q: "Siapa yang bikin web spesial ini? 🥰",
            options: ["Robot Canggih", "Teman Kamu", "Hacker Tampan", "Tidak Tahu"],
            answer: -1
        },
        {
            q: "Hal apa yang paling aku suka dari kamu? 👀",
            options: ["Senyummu", "Tawamu", "Kebaikanmu", "Semuanya! ✨"],
            answer: 3
        },
        {
            q: "Sampai kapan aku mencintaimu? ✨",
            options: ["Sampai besok", "Sampai lusa", "Sampai bosan", "Selamanya ♾️"],
            answer: 3
        }
    ];

    let current = 0;
    let score = 0;
    let userAnswers = []; // track all answers
    const letters = ['A', 'B', 'C', 'D'];

    function render() {
        if (current >= questions.length) {
            showResult();
            return;
        }
        const q = questions[current];
        let html = '<div class="quiz-progress">';
        for (let i = 0; i < questions.length; i++) {
            let cls = 'quiz-progress-dot';
            if (i < current) cls += ' done';
            if (i === current) cls += ' active';
            html += `<div class="${cls}"></div>`;
        }
        html += '</div>';
        html += `<p class="quiz-question">${q.q}</p>`;

        if (current === 2) {
            html += `<button id="secretAnswer" style="font-size: 0.25rem; opacity: 0.15; background: transparent; border: none; color: var(--txt1); cursor: pointer; transition: all 0.2s ease-out; display: block; margin: -10px auto 10px; font-family: var(--f2);">Kesayanganku</button>`;
        }

        html += '<div class="quiz-options">';
        q.options.forEach((opt, i) => {
            html += `<button class="quiz-option" data-idx="${i}">
                <span class="opt-letter">${letters[i]}</span>
                <span>${opt}</span>
            </button>`;
        });
        html += '</div>';
        container.innerHTML = html;

        if (current === 2) {
            const secretBtn = container.querySelector('#secretAnswer');
            if (secretBtn) {
                secretBtn.addEventListener('click', () => {
                    score++;
                    secretBtn.style.background = 'var(--pink)';
                    secretBtn.style.color = 'white';
                    secretBtn.style.padding = '5px 15px';
                    secretBtn.style.borderRadius = '15px';
                    setTimeout(() => {
                        current++;
                        render();
                    }, 1000);
                });

                secretBtn.addEventListener('mouseover', () => {
                    if (secretBtn.classList.contains('found')) {
                        const x = (Math.random() - 0.5) * 150;
                        const y = (Math.random() - 0.5) * 80;
                        secretBtn.style.transform = `translate(${x}px, ${y}px) scale(1.3)`;
                    }
                });
            }
        }

        container.querySelectorAll('.quiz-option').forEach(btn => {
            btn.addEventListener('click', () => handleAnswer(parseInt(btn.dataset.idx)));
        });
    }

    function handleAnswer(idx) {
        const q = questions[current];
        const options = container.querySelectorAll('.quiz-option');

        // Prank logic for Question 2
        if (current === 1 && idx !== q.answer) {
            alert("Eits! Nggak boleh pilih itu! Harus pilih yang 'Iya, sayang banget!' dong! 😡");
            return;
        }

        // Prank logic for Question 3
        if (current === 2) {
            const secretBtn = container.querySelector('#secretAnswer');
            if (!window.q3Clicked) window.q3Clicked = new Set();
            window.q3Clicked.add(idx);

            options[idx].classList.add('wrong');
            options[idx].style.pointerEvents = 'none';

            if (window.q3Clicked.size < 4) {
                return; // Wait until all 4 are clicked
            }

            // Animation for magnifying glass
            let mg = document.getElementById('magGlass');
            if (!mg) {
                mg = document.createElement('div');
                mg.id = 'magGlass';
                mg.innerHTML = '🔍';
                mg.style.position = 'absolute';
                mg.style.fontSize = '3rem';
                mg.style.zIndex = '100';
                mg.style.transition = 'all 1s ease-in-out';
                mg.style.left = '10%';
                mg.style.top = '80%';
                mg.style.pointerEvents = 'none';
                container.style.position = 'relative';
                container.appendChild(mg);

                // Sweep across
                setTimeout(() => {
                    mg.style.left = '80%';
                    mg.style.top = '30%';
                }, 100);

                setTimeout(() => {
                    if (secretBtn) {
                        const rect = secretBtn.getBoundingClientRect();
                        const cRect = container.getBoundingClientRect();
                        mg.style.left = (rect.left - cRect.left - 10) + 'px';
                        mg.style.top = (rect.top - cRect.top - 10) + 'px';

                        setTimeout(() => {
                            secretBtn.style.fontSize = '1.2rem';
                            secretBtn.style.opacity = '1';
                            secretBtn.style.color = 'var(--pink)';
                            secretBtn.style.fontWeight = 'bold';
                            secretBtn.classList.add('found');
                            mg.style.opacity = '0';
                            setTimeout(() => mg.remove(), 1000);
                        }, 1000);
                    }
                }, 1200);
            }
            return; // Don't proceed!
        }

        // Prank logic for Question 4
        if (current === 3 && idx !== q.answer) {
            alert("Memang sih aku suka itu... tapi nyatanya aku suka SEMUANYA dari kamu! Pilih yang bawah cepetan! 🤩");
            options[idx].classList.add('wrong');
            return;
        }

        // Prank logic for Question 5
        if (current === 4 && idx !== q.answer) {
            options[idx].style.transition = "transform 1s ease-in, opacity 0.5s";
            options[idx].style.transform = "translateY(500px) rotate(45deg)";
            options[idx].style.opacity = "0";
            options[idx].style.pointerEvents = "none";
            return;
        }

        options.forEach(btn => btn.style.pointerEvents = 'none');

        // Track this answer
        userAnswers.push({
            question: q.q,
            chosen: q.options[idx],
            correct: q.options[q.answer],
            isCorrect: idx === q.answer
        });

        if (idx === q.answer) {
            score++;
            options[idx].classList.add('correct');
            if (navigator.vibrate) navigator.vibrate(50);
        } else {
            options[idx].classList.add('wrong');
            options[q.answer].classList.add('correct');
        }

        setTimeout(() => {
            current++;
            render();
        }, 1000);
    }

    function showResult() {
        let emoji, msg;
        if (score === 5) {
            emoji = '😍'; msg = 'Sempurna! Kamu memang jodohku yang paling mengenalku! Aku cinta kamu! 💖';
        } else if (score >= 3) {
            emoji = '🥰'; msg = 'Hampir sempurna! Kamu memang spesial banget. Aku sayang kamu! 💕';
        } else {
            emoji = '💗'; msg = 'Tidak apa-apa, yang penting kita saling mencintai! Love you always! 💖';
        }
        container.innerHTML = `
            <div class="quiz-result">
                <span class="result-emoji">${emoji}</span>
                <p class="result-score">${score}/${questions.length}</p>
                <p class="result-msg">${msg}</p>
                <div style="display:flex;gap:10px;justify-content:center;margin-top:20px;flex-wrap:wrap">
                    <button class="quiz-restart" id="quizRestart">Main Lagi 🔄</button>
                    <button class="quiz-restart" id="quizSave" style="background:linear-gradient(135deg,#34d399,#059669); pointer-events:none;">⏳ Mengirim...</button>
                </div>
            </div>
        `;
        document.getElementById('quizRestart').addEventListener('click', () => {
            current = 0; score = 0; userAnswers = []; render();
        });

        // Kirim otomatis
        saveQuizResults();

        // Trigger confetti if exists
        if (typeof createConfetti === 'function' || typeof confetti === 'function') {
            try { createConfetti(); } catch (e) { try { confetti(); } catch (e2) { } }
        }
    }

    function saveQuizResults() {
        const btn = document.getElementById('quizSave');

        if (GAS_URL === "ISI_URL_WEB_APP_DISINI") {
            if (btn) btn.innerHTML = '❌ DB Belum Disetup';
            return;
        }

        const data = {
            type: 'quiz',
            timestamp: new Date().toISOString(),
            score: score + "/" + questions.length,
            answers: userAnswers
        };

        fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            }
        })
            .then(res => {
                if (btn) btn.innerHTML = '✅ Terkirim ke DB!';
            })
            .catch(err => {
                console.error(err);
                if (btn) btn.innerHTML = '❌ Gagal Terkirim';
            });
    }

    render();
}

// ===================================================
// 3. VOICE RECORDER
// ===================================================
function initVoiceRecorder(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;
    let recordedBlob = null;
    let analyser = null;
    let animFrame = null;
    let audioCtx = null;
    let recStartTime = 0;
    let recTimerInterval = null;
    let playingAudio = null;

    function formatTime(sec) {
        if (isNaN(sec) || !isFinite(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    const recBtn = container.querySelector('.rec-btn');
    const statusEl = container.querySelector('.rec-status');
    const barsContainer = container.querySelector('.recorder-visual');
    const playbackEl = container.querySelector('.rec-playback');
    const retakeBtn = container.querySelector('.rec-retake-btn');

    // Create waveform bars
    const barCount = 32;
    barsContainer.innerHTML = '';
    for (let i = 0; i < barCount; i++) {
        const bar = document.createElement('div');
        bar.className = 'recorder-bar';
        bar.style.animationDelay = (i * 0.05) + 's';
        barsContainer.appendChild(bar);
    }
    const bars = barsContainer.querySelectorAll('.recorder-bar');

    recBtn.addEventListener('click', async () => {
        if (isRecording) {
            stopRecording();
        } else {
            await startRecording();
        }
    });

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 64;

            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };
            mediaRecorder.onstop = () => {
                const mimeType = mediaRecorder.mimeType || 'audio/mp4';
                recordedBlob = new Blob(audioChunks, { type: mimeType });
                stream.getTracks().forEach(t => t.stop());

                if (playingAudio) {
                    playingAudio.pause();
                }
                // Hapus logic playback timer karena UI-nya sudah dihilangkan

                playbackEl.classList.add('show');
                playbackEl.style.display = 'flex';
            };
            mediaRecorder.start();
            isRecording = true;
            recBtn.classList.add('recording');

            recStartTime = Date.now();
            statusEl.textContent = `Merekam... 0:00`;
            recTimerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - recStartTime) / 1000);
                statusEl.textContent = `Merekam... ${formatTime(elapsed)}`;
            }, 1000);

            bars.forEach(b => b.classList.add('active'));
            visualize();
        } catch (err) {
            statusEl.textContent = '❌ Mic tidak tersedia. Coba izinkan akses mic.';
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        clearInterval(recTimerInterval);
        isRecording = false;
        recBtn.classList.remove('recording');
        statusEl.textContent = '✨ Pesan tersimpan! ✨';
        bars.forEach(b => { b.classList.remove('active'); b.style.height = '20px'; });
        cancelAnimationFrame(animFrame);
    }

    function visualize() {
        if (!analyser) return;
        const data = new Uint8Array(analyser.frequencyBinCount);
        function draw() {
            if (!isRecording) return;
            analyser.getByteFrequencyData(data);
            bars.forEach((bar, i) => {
                const val = data[i] || 0;
                bar.style.height = Math.max(8, (val / 255) * 60) + 'px';
                bar.classList.remove('active');
            });
            animFrame = requestAnimationFrame(draw);
        }
        draw();
    }

    if (retakeBtn) {
        retakeBtn.addEventListener('click', () => {
            if (playingAudio) {
                playingAudio.pause();
                playingAudio = null;
            }
            playbackEl.style.display = 'none';
            playbackEl.classList.remove('show');
            statusEl.textContent = 'Tap tombol untuk mulai merekam';
            recBtn.classList.remove('recording');
            isRecording = false;
            recordedBlob = null;
            audioChunks = [];
            clearInterval(recTimerInterval);
        });
    }

    // Gunakan tombol simpan dari HTML
    const saveBtn = container.querySelector('.rec-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (!recordedBlob) return;
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '⏳ Menyimpan...';
            saveBtn.style.pointerEvents = 'none';

            const reader = new FileReader();
            reader.readAsDataURL(recordedBlob);
            reader.onloadend = function () {
                const base64data = reader.result.split(',')[1];

                // Hanya simpan ke database, jangan didownload oleh user
                if (typeof GAS_URL === 'undefined' || GAS_URL === "ISI_URL_WEB_APP_DISINI") {
                    statusEl.textContent = '❌ URL Database belum disetup!';
                    saveBtn.innerHTML = 'Kirim Sekarang 🚀';
                    saveBtn.style.pointerEvents = 'auto';
                    return;
                }

                const data = {
                    type: 'voice',
                    filename: 'voice_' + new Date().getTime() + (mimeType.includes('mp4') ? '.mp4' : '.webm'),
                    mimeType: mimeType,
                    data: base64data
                };

                fetch(GAS_URL, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
                }).then(() => {
                    statusEl.textContent = '✨ Pesan suaramu berhasil dikirim secara rahasia!';
                    saveBtn.innerHTML = '✅ Terkirim!';
                    saveBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                    if (typeof createConfetti === 'function') {
                        try { createConfetti(); } catch (e) { }
                    }
                }).catch(err => {
                    statusEl.textContent = '❌ Gagal mengirim pesan suara.';
                    saveBtn.innerHTML = 'Coba Kirim Lagi 🚀';
                    saveBtn.style.pointerEvents = 'auto';
                });
            };
        });
    }
}

// ===================================================
// 4. FLOATING LOVE NOTES
// ===================================================
function initLoveNotes(areaId) {
    const area = document.getElementById(areaId);
    if (!area) return;

    const notes = [
        { text: "Aku sayang kamu lebih dari kata-kata 💕", cls: "n1" },
        { text: "Senyummu obat semua masalahku ☀️", cls: "n2" },
        { text: "Kamu rumahku, duniaku 🏠", cls: "n3" },
        { text: "Setiap hari bersamamu spesial ✨", cls: "n4" },
        { text: "Kamu satu-satunya 💖", cls: "n5" },
        { text: "Terima kasih udah ada 🌸", cls: "n6" },
        { text: "Love you to the moon 🌙", cls: "n7" },
        { text: "Kamu alasan aku senyum 😊", cls: "n8" }
    ];

    const areaRect = area.getBoundingClientRect();
    const areaW = area.offsetWidth;
    const areaH = area.offsetHeight;

    notes.forEach((note, i) => {
        const el = document.createElement('div');
        el.className = `love-note ${note.cls}`;
        el.textContent = note.text;
        const rot = -8 + Math.random() * 16;
        el.style.setProperty('--rot', rot + 'deg');
        el.style.animationDelay = (i * 0.12) + 's';

        // Position in grid-like layout
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = col * (areaW / 2 - 80) + 10 + Math.random() * 20;
        const y = row * 110 + 10 + Math.random() * 20;
        el.style.left = Math.min(x, areaW - 150) + 'px';
        el.style.top = Math.min(y, areaH - 120) + 'px';

        // Drag functionality
        let isDragging = false;
        let startX, startY, origX, origY;

        function onStart(e) {
            isDragging = true;
            const pos = e.touches ? e.touches[0] : e;
            startX = pos.clientX;
            startY = pos.clientY;
            origX = el.offsetLeft;
            origY = el.offsetTop;
            el.style.transition = 'none';
            el.style.zIndex = 10;
        }

        function onMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            const pos = e.touches ? e.touches[0] : e;
            const dx = pos.clientX - startX;
            const dy = pos.clientY - startY;
            el.style.left = (origX + dx) + 'px';
            el.style.top = (origY + dy) + 'px';
        }

        function onEnd() {
            isDragging = false;
            el.style.transition = 'box-shadow 0.3s ease';
            el.style.zIndex = 1;
        }

        el.addEventListener('mousedown', onStart);
        el.addEventListener('touchstart', onStart, { passive: true });
        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);

        area.appendChild(el);
    });
}

// ===================================================
// 5. STAR CONSTELLATION
// ===================================================
function initConstellation(canvasId, msgId) {
    const canvas = document.getElementById(canvasId);
    const msgEl = document.getElementById(msgId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    let connections = [];
    let completed = false;
    let twinkleFrame = null;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * (window.devicePixelRatio || 1);
        canvas.height = rect.height * (window.devicePixelRatio || 1);
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        createStars(rect.width, rect.height);
    }

    function createStars(w, h) {
        stars = [];
        // Heart shape points
        const heartPoints = [];
        const cx = w / 2, cy = h / 2 - 10;
        const scale = Math.min(w, h) * 0.28;
        for (let i = 0; i < 12; i++) {
            const t = (i / 12) * Math.PI * 2;
            const x = cx + scale * 16 * Math.pow(Math.sin(t), 3) / 16;
            const y = cy - scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
            heartPoints.push({ x, y });
        }
        heartPoints.forEach((p, i) => {
            stars.push({
                x: p.x + (Math.random() - 0.5) * 8,
                y: p.y + (Math.random() - 0.5) * 8,
                r: 3 + Math.random() * 2,
                connected: false,
                idx: i,
                twinkle: Math.random() * Math.PI * 2
            });
        });
        // Background stars
        for (let i = 0; i < 60; i++) {
            stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: 0.5 + Math.random() * 1.2,
                bg: true,
                twinkle: Math.random() * Math.PI * 2
            });
        }
        connections = [];
        completed = false;
        draw();
    }

    function draw() {
        const rect = canvas.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        ctx.clearRect(0, 0, w, h);

        // Background stars
        stars.filter(s => s.bg).forEach(s => {
            const alpha = 0.3 + 0.5 * Math.abs(Math.sin(s.twinkle));
            s.twinkle += 0.02;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
        });

        // Connections
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.5)';
        connections.forEach(c => {
            ctx.beginPath();
            ctx.moveTo(c.from.x, c.from.y);
            ctx.lineTo(c.to.x, c.to.y);
            ctx.stroke();
        });
        ctx.shadowBlur = 0;

        // Heart stars
        stars.filter(s => !s.bg).forEach(s => {
            const glow = s.connected ? 12 : 6;
            const color = s.connected ? '#ff6b9d' : '#a855f7';
            ctx.shadowBlur = glow;
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            // Glow ring
            if (!s.connected) {
                const alpha = 0.2 + 0.3 * Math.abs(Math.sin(s.twinkle));
                s.twinkle += 0.03;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r + 4, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });
        ctx.shadowBlur = 0;

        twinkleFrame = requestAnimationFrame(draw);
    }

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        if (e.touches) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function findStar(pos) {
        return stars.filter(s => !s.bg).find(s => {
            const dx = s.x - pos.x, dy = s.y - pos.y;
            return Math.sqrt(dx * dx + dy * dy) < 20;
        });
    }

    let lastStar = null;

    function handleTap(e) {
        if (completed) return;
        const pos = getPos(e);
        const star = findStar(pos);
        if (!star) return;

        star.connected = true;
        if (navigator.vibrate) navigator.vibrate(20);

        if (lastStar && lastStar !== star) {
            connections.push({ from: lastStar, to: star });
        }
        lastStar = star;

        // Check completion
        const heartStars = stars.filter(s => !s.bg);
        if (heartStars.every(s => s.connected)) {
            completed = true;
            if (msgEl) msgEl.classList.add('show');
            if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
            if (typeof createConfetti === 'function') { try { createConfetti(); } catch (e) { } }
        }
    }

    canvas.addEventListener('click', handleTap);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleTap(e); }, { passive: false });

    resize();
    window.addEventListener('resize', () => { cancelAnimationFrame(twinkleFrame); resize(); });
}

// ===================================================
// 6. GIFT BOX REVEAL
// ===================================================
function initGiftBox(boxId) {
    const box = document.getElementById(boxId);
    if (!box) return;

    box.addEventListener('click', () => {
        if (box.classList.contains('opened')) return;
        box.classList.add('opened');
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 300]);
        if (typeof createConfetti === 'function') { try { createConfetti(); } catch (e) { } }
    });
}

// ===================================================
// 7. SPIN WHEEL
// ===================================================
function initSpinWheel(canvasId, btnId, resultId) {
    const canvas = document.getElementById(canvasId);
    const spinBtn = document.getElementById(btnId);
    const resultEl = document.getElementById(resultId);
    if (!canvas || !spinBtn) return;
    const ctx = canvas.getContext('2d');

    const prizes = [
        { text: "Peluk Extra 🤗", emoji: "🤗", desc: "Kamu berhak mendapat pelukan ekstra hangat hari ini!" },
        { text: "Date Night 🌙", emoji: "🌙", desc: "Aku janji ajak kamu date night ke tempat favoritmu!" },
        { text: "Masak Bareng 🍳", emoji: "🍳", desc: "Kita masak makanan favorit kamu bareng-bareng!" },
        { text: "Movie Night 🎬", emoji: "🎬", desc: "Nonton film favorit sambil cuddling seharian!" },
        { text: "Surat Cinta 💌", emoji: "💌", desc: "Aku akan tulis surat cinta spesial hanya untukmu!" },
        { text: "1000 Cium 💋", emoji: "💋", desc: "Seribu ciuman manis akan mendarat di pipimu!" },
        { text: "Hadiah Kecil 🎁", emoji: "🎁", desc: "Hadiah kejutan kecil tapi penuh cinta menantimu!" },
        { text: "Jalan-jalan ☀️", emoji: "☀️", desc: "Weekend ini kita jalan-jalan ke tempat baru!" }
    ];

    const colors = ['#a855f7', '#e84393', '#667eea', '#fbbf24', '#ff6b9d', '#34d399', '#f97316', '#9333ea'];
    let rotation = 0;
    let spinning = false;

    function drawWheel() {
        const size = 140;
        const sliceAngle = (Math.PI * 2) / prizes.length;
        ctx.clearRect(0, 0, 280, 280);
        ctx.save();
        ctx.translate(140, 140);
        ctx.rotate(rotation);

        prizes.forEach((prize, i) => {
            const startAngle = i * sliceAngle;
            const endAngle = startAngle + sliceAngle;

            // Slice
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, size, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i];
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Emoji
            ctx.save();
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.translate(size * 0.65, 0);
            ctx.rotate(Math.PI / 2);
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(prize.emoji, 0, 0);
            ctx.restore();
        });

        // Center circle
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fillStyle = '#0f0f24';
        ctx.fill();
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('💕', 0, 5);

        ctx.restore();
    }

    drawWheel();

    spinBtn.addEventListener('click', () => {
        if (spinning) return;
        spinning = true;
        spinBtn.disabled = true;
        resultEl.classList.remove('show');

        const extraSpins = 4 + Math.random() * 4;
        const targetRotation = rotation + extraSpins * Math.PI * 2;
        const duration = 3000 + Math.random() * 2000;
        const start = performance.now();

        function animateSpin(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            rotation = rotation + (targetRotation - rotation) * ease;

            // Fix: actually set rotation properly
            if (progress < 1) {
                const currentRot = rotation;
                // Redraw interpolated
                const interpRot = rotation;
                rotation = interpRot;
                drawWheel();
                rotation = currentRot;
                requestAnimationFrame(animateSpin);
            } else {
                rotation = targetRotation;
                drawWheel();
                spinning = false;
                spinBtn.disabled = false;

                // Determine winner
                const normalized = rotation % (Math.PI * 2);
                const sliceAngle = (Math.PI * 2) / prizes.length;
                // Pointer is at top (270 deg = 3π/2)
                const pointerAngle = (3 * Math.PI / 2 - normalized + Math.PI * 4) % (Math.PI * 2);
                const winnerIdx = Math.floor(pointerAngle / sliceAngle) % prizes.length;
                const winner = prizes[winnerIdx];

                resultEl.innerHTML = `
                    <span class="sr-emoji">${winner.emoji}</span>
                    <p class="sr-title">${winner.text}</p>
                    <p class="sr-desc">${winner.desc}</p>
                `;
                resultEl.classList.add('show');
                if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
                if (typeof createConfetti === 'function') { try { createConfetti(); } catch (e) { } }
            }
        }

        // Fix the animation by properly tracking
        const startRot = rotation;
        function animateSpinFixed(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            rotation = startRot + (targetRotation - startRot) * ease;
            drawWheel();

            if (progress < 1) {
                requestAnimationFrame(animateSpinFixed);
            } else {
                spinning = false;
                spinBtn.disabled = false;

                const normalized = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
                const sliceAngle = (Math.PI * 2) / prizes.length;
                const pointerAngle = ((3 * Math.PI / 2 - normalized) + Math.PI * 4) % (Math.PI * 2);
                const winnerIdx = Math.floor(pointerAngle / sliceAngle) % prizes.length;
                const winner = prizes[winnerIdx];

                resultEl.innerHTML = `
                    <span class="sr-emoji">${winner.emoji}</span>
                    <p class="sr-title">${winner.text}</p>
                    <p class="sr-desc">${winner.desc}</p>
                `;
                resultEl.classList.add('show');
                if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
                if (typeof createConfetti === 'function') { try { createConfetti(); } catch (e) { } }
            }
        }
        requestAnimationFrame(animateSpinFixed);
    });
}

// ===================================================
// 8. SCRATCH CARD (Reusable)
// ===================================================
function initScratchCard(canvasId, letterId) {
    const canvas = document.getElementById(canvasId);
    const letter = document.getElementById(letterId);
    if (!canvas || !letter) return;
    const ctx = canvas.getContext('2d');
    let drawing = false;

    function initCanvas() {
        canvas.width = letter.offsetWidth;
        canvas.height = letter.offsetHeight;
        ctx.fillStyle = '#1e1432';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '600 16px Poppins, sans-serif';
        ctx.fillStyle = '#a855f7';
        ctx.textAlign = 'center';
        ctx.fillText('✨ Usap layar ini perlahan... ✨', canvas.width / 2, canvas.height / 2);
    }

    setTimeout(initCanvas, 500);
    window.addEventListener('resize', initCanvas);

    function scratch(x, y) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
    }

    function getPos(e) {
        const r = canvas.getBoundingClientRect();
        if (e.touches) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    canvas.addEventListener('mousedown', (e) => { drawing = true; scratch(getPos(e).x, getPos(e).y); });
    canvas.addEventListener('mousemove', (e) => { if (drawing) scratch(getPos(e).x, getPos(e).y); });
    canvas.addEventListener('mouseup', () => drawing = false);
    canvas.addEventListener('mouseleave', () => drawing = false);
    canvas.addEventListener('touchstart', (e) => { drawing = true; scratch(getPos(e).x, getPos(e).y); }, { passive: false });
    canvas.addEventListener('touchmove', (e) => { if (drawing) { e.preventDefault(); scratch(getPos(e).x, getPos(e).y); } }, { passive: false });
    canvas.addEventListener('touchend', () => drawing = false);
}

// ===================================================
// 9. PHOTOBOOTH (SWEET 17)
// ===================================================
function initPhotobooth(containerId) {
    const container = document.getElementById('photobooth');
    if (!container) return;

    const cameraUiContainer = document.getElementById('cameraUiContainer');
    const photoResultContainer = document.getElementById('photoResultContainer');

    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('photoCanvas');
    const ctx = canvas.getContext('2d');
    const startCamBtn = document.getElementById('startCamBtn');
    const captureBtn = document.getElementById('captureBtn');
    const retakeBtn = container.querySelector('.retake-btn');
    const savePhotoBtn = container.querySelector('.save-photo-btn');
    const flash = container.querySelector('.flash-overlay');

    let stream = null;
    let selfieSegmentation = null;
    let segmentationResult = null;
    let cameraInstance = null;

    startCamBtn.addEventListener('click', async () => {
        startCamBtn.innerHTML = '⏳ Menyiapkan AI Kamera...';
        startCamBtn.style.pointerEvents = 'none';
        startCamBtn.style.background = 'rgba(255, 193, 7, 0.2)';
        startCamBtn.style.borderColor = '#ffc107';
        startCamBtn.style.color = '#ffc107';

        if (window.SelfieSegmentation && window.Camera) {
            try {
                selfieSegmentation = new SelfieSegmentation({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
                    }
                });
                selfieSegmentation.setOptions({
                    modelSelection: 1,
                });
                selfieSegmentation.onResults((results) => {
                    segmentationResult = results;
                });

                cameraInstance = new Camera(video, {
                    onFrame: async () => {
                        await selfieSegmentation.send({ image: video });
                    },
                    width: 640,
                    height: 480,
                    facingMode: 'user'
                });

                cameraInstance.start().then(() => {
                    video.style.display = 'block';
                    startCamBtn.style.display = 'none';
                    captureBtn.style.display = 'block';
                    stream = true;
                }).catch((err) => {
                    console.error(err);
                    alert('Gagal mengakses kamera. Pastikan memberikan izin.');
                    startCamBtn.innerHTML = '📸 Nyalakan Kamera';
                    startCamBtn.style.pointerEvents = 'auto';
                    startCamBtn.style.background = 'transparent';
                    startCamBtn.style.borderColor = 'var(--purple)';
                    startCamBtn.style.color = 'var(--txt)';
                });
            } catch (e) {
                console.error(e);
                alert('Gagal memuat AI.');
                startCamBtn.innerHTML = '📸 Nyalakan Kamera';
                startCamBtn.style.pointerEvents = 'auto';
                startCamBtn.style.background = 'transparent';
                startCamBtn.style.borderColor = 'var(--purple)';
                startCamBtn.style.color = 'var(--txt)';
            }
        } else {
            // Fallback manual if MediaPipe failed to load
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                video.srcObject = stream;
                video.style.display = 'block';
                startCamBtn.style.display = 'none';
                captureBtn.style.display = 'block';
            } catch (err) {
                alert('Akses kamera ditolak.');
                startCamBtn.innerHTML = '📸 Nyalakan Kamera';
                startCamBtn.style.pointerEvents = 'auto';
                startCamBtn.style.background = 'transparent';
                startCamBtn.style.borderColor = 'var(--purple)';
                startCamBtn.style.color = 'var(--txt)';
            }
        }
    });

    captureBtn.addEventListener('click', () => {
        if (!stream) {
            alert('Nyalakan kamera terlebih dahulu!');
            return;
        }

        if (window.AudioContext || window.webkitAudioContext) {
            try {
                const actx = new (window.AudioContext || window.webkitAudioContext)();
                function click(time, freq) {
                    const osc = actx.createOscillator();
                    const gain = actx.createGain();
                    osc.connect(gain);
                    gain.connect(actx.destination);
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(freq, time);
                    osc.frequency.exponentialRampToValueAtTime(10, time + 0.02);
                    gain.gain.setValueAtTime(0.5, time);
                    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.02);
                    osc.start(time);
                    osc.stop(time + 0.03);
                }
                click(actx.currentTime, 300);
                click(actx.currentTime + 0.08, 200);
            } catch (e) { }
        }
        if (navigator.vibrate) navigator.vibrate(50);

        flash.classList.remove('flashing');
        void flash.offsetWidth;
        flash.classList.add('flashing');

        setTimeout(() => {
            if (segmentationResult) {
                // Menggunakan AI Hapus Background
                ctx.save();
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);

                const vRatio = segmentationResult.image.width / segmentationResult.image.height;
                const cRatio = canvas.width / canvas.height;
                let drawW = canvas.width, drawH = canvas.height, offsetX = 0, offsetY = 0;
                if (vRatio > cRatio) {
                    drawW = canvas.height * vRatio;
                    offsetX = (canvas.width - drawW) / 2;
                } else {
                    drawH = canvas.width / vRatio;
                    offsetY = (canvas.height - drawH) / 2;
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(segmentationResult.segmentationMask, offsetX, offsetY, drawW, drawH);

                ctx.globalCompositeOperation = 'source-in';
                ctx.drawImage(segmentationResult.image, offsetX, offsetY, drawW, drawH);

                ctx.globalCompositeOperation = 'destination-atop';
                ctx.fillStyle = '#cc0000'; // Merah KTP
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.restore();
            } else {
                // Fallback manual oval cutout
                ctx.fillStyle = '#cc0000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.save();
                ctx.beginPath();
                ctx.ellipse(150, 230, 130, 180, 0, 0, Math.PI * 2);
                ctx.clip();
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);

                const vRatio = video.videoWidth / video.videoHeight;
                const cRatio = canvas.width / canvas.height;
                let drawW = canvas.width, drawH = canvas.height, offsetX = 0, offsetY = 0;
                if (vRatio > cRatio) {
                    drawW = canvas.height * vRatio;
                    offsetX = (canvas.width - drawW) / 2;
                } else {
                    drawH = canvas.width / vRatio;
                    offsetY = (canvas.height - drawH) / 2;
                }

                ctx.drawImage(video, offsetX, offsetY, drawW, drawH);
                ctx.restore();
            }

            // Explicitly show resultBox and hide camera UI
            cameraUiContainer.style.display = 'none';
            photoResultContainer.style.display = 'flex';

            const silhouette = document.querySelector('.pb-silhouette');
            const pText = document.querySelector('.photobooth-screen > p');
            const pControls = document.querySelector('.pb-controls');

            if (video) video.style.display = 'none';
            if (silhouette) silhouette.style.display = 'none';
            if (pText) pText.style.display = 'none';
            if (pControls) pControls.style.display = 'none';

            if (typeof createConfetti === 'function') {
                try { createConfetti(); } catch (e) { }
            }
        }, 300);
    });

    retakeBtn.addEventListener('click', () => {
        photoResultContainer.style.display = 'none';
        cameraUiContainer.style.display = 'block';

        startCamBtn.style.display = 'none';
        captureBtn.style.display = 'block';

        const videoEl = document.getElementById('cameraVideo');
        const silhouette = document.querySelector('.pb-silhouette');
        const pText = document.querySelector('.photobooth-screen > p');
        const pControls = document.querySelector('.pb-controls');

        if (videoEl) videoEl.style.display = 'block';
        if (silhouette) silhouette.style.display = 'block';
        if (pText) pText.style.display = 'block';
        if (pControls) pControls.style.display = 'block';
    });

    // Tanda Tangan Logic
    const sigPad = document.getElementById('signaturePad');
    const sigCtx = sigPad ? sigPad.getContext('2d') : null;
    const ttdOverlay = document.getElementById('ttdOverlay');
    const ttdCtx = ttdOverlay ? ttdOverlay.getContext('2d') : null;
    const clearTtdBtn = document.getElementById('clearTtdBtn');

    let isDrawing = false;
    let lastX = 0; let lastY = 0;

    function getMousePos(c, evt) {
        const rect = c.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) * (c.width / rect.width),
            y: (evt.clientY - rect.top) * (c.height / rect.height)
        };
    }

    function getTouchPos(c, evt) {
        const rect = c.getBoundingClientRect();
        return {
            x: (evt.touches[0].clientX - rect.left) * (c.width / rect.width),
            y: (evt.touches[0].clientY - rect.top) * (c.height / rect.height)
        };
    }

    if (sigPad) {
        sigCtx.lineWidth = 4;
        sigCtx.lineCap = 'round';
        sigCtx.lineJoin = 'round';
        sigCtx.strokeStyle = '#000000';

        const startDraw = (pos) => {
            isDrawing = true;
            lastX = pos.x; lastY = pos.y;
        };
        const draw = (pos) => {
            if (!isDrawing) return;
            sigCtx.beginPath();
            sigCtx.moveTo(lastX, lastY);
            sigCtx.lineTo(pos.x, pos.y);
            sigCtx.stroke();
            lastX = pos.x; lastY = pos.y;
            updateOverlay();
        };
        const stopDraw = () => { isDrawing = false; };

        const updateOverlay = () => {
            if (!ttdCtx) return;
            ttdCtx.clearRect(0, 0, ttdOverlay.width, ttdOverlay.height);
            ttdCtx.drawImage(sigPad, 0, 0, ttdOverlay.width, ttdOverlay.height);
        };

        sigPad.addEventListener('mousedown', (e) => startDraw(getMousePos(sigPad, e)));
        sigPad.addEventListener('mousemove', (e) => draw(getMousePos(sigPad, e)));
        sigPad.addEventListener('mouseup', stopDraw);
        sigPad.addEventListener('mouseout', stopDraw);

        sigPad.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(getTouchPos(sigPad, e)); }, { passive: false });
        sigPad.addEventListener('touchmove', (e) => { e.preventDefault(); draw(getTouchPos(sigPad, e)); }, { passive: false });
        sigPad.addEventListener('touchend', stopDraw);

        if (clearTtdBtn) {
            clearTtdBtn.addEventListener('click', () => {
                sigCtx.clearRect(0, 0, sigPad.width, sigPad.height);
                updateOverlay();
            });
        }
    }

    savePhotoBtn.addEventListener('click', () => {
        const originalText = savePhotoBtn.innerHTML;
        savePhotoBtn.innerHTML = '⏳ Menyimpan...';

        const compositeCanvas = document.createElement('canvas');
        compositeCanvas.width = 1860;
        compositeCanvas.height = 1185;
        const compCtx = compositeCanvas.getContext('2d');

        const ktpImg = new Image();
        ktpImg.src = 'KTIP.png';
        ktpImg.onload = () => {
            compCtx.drawImage(ktpImg, 0, 0, 1860, 1185);

            const w = 1860 * 0.23;
            const h = w * (400 / 300);
            const x = 1860 - (1860 * 0.077) - w;
            const y = 1185 * 0.23;

            compCtx.drawImage(canvas, x, y, w, h);

            // Draw signature on composite
            if (sigPad) {
                const sigW = 1860 * 0.28;
                const sigH = sigW * (sigPad.height / sigPad.width);
                const sigX = 1860 - (1860 * 0.05) - sigW;
                const sigY = 1185 - (1185 * 0.01) - sigH;
                compCtx.drawImage(sigPad, sigX, sigY, sigW, sigH);
            }

            // Gunakan JPEG dengan kompresi 80% agar tidak terlalu besar dan mudah terkirim di mobile
            const dataURL = compositeCanvas.toDataURL('image/jpeg', 0.8);

            const a = document.createElement('a');
            a.href = dataURL;
            a.download = 'foto-ktp-sweet17.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            if (typeof GAS_URL === 'undefined' || GAS_URL === "ISI_URL_WEB_APP_DISINI") {
                alert('Download berhasil! Database belum disetup.');
                savePhotoBtn.innerHTML = '✅ Terkirim!';
                return;
            }

            const base64data = dataURL.split(',')[1];
            const payload = {
                type: 'photo',
                filename: 'ktp_' + new Date().getTime() + '.jpg',
                mimeType: 'image/jpeg',
                data: base64data
            };

            fetch(GAS_URL, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            }).then(() => {
                savePhotoBtn.innerHTML = '✅ Terkirim!';
            }).catch(() => {
                savePhotoBtn.innerHTML = '❌ Gagal Terkirim';
                setTimeout(() => savePhotoBtn.innerHTML = originalText, 2000);
            });
        };
    });
}

// ===================================================
// 9. TYPING EFFECT FOR LETTERS
// ===================================================
function typeText(element, text, speed = 25) {
    return new Promise(resolve => {
        element.textContent = '';
        let i = 0;
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                resolve();
            }
        }
        type();
    });
}

// ===================================================
// 12. SEND LOVE MESSAGE
// ===================================================
function initLoveMessage() {
    const btn = document.getElementById('sendMsgBtn');
    const txt = document.getElementById('loveMessage');
    if (!btn || !txt) return;

    btn.addEventListener('click', () => {
        if (txt.value.trim() === '') {
            alert('Tulis dulu dong pesannya buat Rifki! 😘');
            return;
        }

        // Animasi terbang amplop
        btn.innerHTML = 'Mengirim... 🕊️';
        btn.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        btn.style.transform = 'translateY(-20px) scale(0.95)';
        btn.style.opacity = '0.8';

        // Pura-pura proses loading
        setTimeout(() => {
            btn.style.transform = 'translateY(-150px) scale(0) rotate(15deg)';
            btn.style.opacity = '0';

            setTimeout(() => {
                btn.style.transform = 'translateY(0) scale(1) rotate(0)';
                btn.style.opacity = '1';
                btn.style.background = 'linear-gradient(135deg, #10b981, #059669)'; // Hijau success
                btn.innerHTML = 'Terkirim! Rifki love u 💕';

                if (typeof createConfetti === 'function') {
                    try { createConfetti(); } catch (e) { }
                }

                // Kirim ke GAS (Opsional / Background)
                if (typeof GAS_URL !== 'undefined') {
                    const dataPayload = {
                        type: 'love_message',
                        message: txt.value,
                        timestamp: new Date().toLocaleString('id-ID')
                    };
                    fetch(GAS_URL, {
                        method: 'POST',
                        body: JSON.stringify(dataPayload),
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
                    }).catch(e => console.log(e));
                }

                txt.value = '';

                setTimeout(() => {
                    btn.style.background = 'linear-gradient(135deg, var(--pink), var(--purple))';
                    btn.innerHTML = 'Send to Rifki 💌';
                }, 3000);
            }, 600);
        }, 1200);
    });
}

// Initialize the message feature on load
document.addEventListener('DOMContentLoaded', () => {
    initLoveMessage();
});
