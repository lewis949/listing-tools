/* ===================================================
   CHEWBOT - OneSila live help assistant
   Floating chat bubble + cartoon face with moods.
=================================================== */
(function () {
    'use strict';

    const COLORS = {
        skin: '#f3c6a5', skinShade: '#e3a987', blush: '#f08a80',
        hair: '#8b5a3c', hairDark: '#6e4430',
        beard: '#b5693c', beardDark: '#94522c',
        glasses: '#2a2422', jumper: '#8f8b86', jumperDark: '#76726d',
        mouth: '#7a2e2e', teeth: '#ffffff', ink: '#2a1d17'
    };

    // ---- Expression parts (eyes, brows, mouth, extras) per mood ----
    const eyeDots = (lx, ly, rx, ry, r = 4.2) =>
        `<circle cx="${lx}" cy="${ly}" r="${r}" fill="${COLORS.ink}"/><circle cx="${rx}" cy="${ry}" r="${r}" fill="${COLORS.ink}"/>` +
        `<circle cx="${lx + 1.4}" cy="${ly - 1.4}" r="1.3" fill="#fff"/><circle cx="${rx + 1.4}" cy="${ry - 1.4}" r="1.3" fill="#fff"/>`;
    const stroke = (d, w = 4, c = COLORS.hairDark) =>
        `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

    const MOODS = {
        neutral: {
            brows: stroke('M66,81 q12,-6 24,0') + stroke('M110,81 q12,-6 24,0'),
            eyes: eyeDots(78, 102, 122, 102),
            mouth: stroke('M88,142 Q100,147 112,142', 3.5, COLORS.mouth),
            extras: ''
        },
        happy: {
            brows: stroke('M66,79 q12,-8 24,0') + stroke('M110,79 q12,-8 24,0'),
            eyes: stroke('M71,104 q7,-8 14,0', 3.5, COLORS.ink) + stroke('M115,104 q7,-8 14,0', 3.5, COLORS.ink),
            mouth: `<path d="M84,139 Q100,157 116,139 Q100,145 84,139 Z" fill="${COLORS.mouth}"/>` +
                   `<path d="M87,140.5 Q100,145 113,140.5 L112,143 Q100,147 88,143 Z" fill="${COLORS.teeth}"/>`,
            extras: `<ellipse cx="64" cy="122" rx="7" ry="4" fill="${COLORS.blush}" opacity=".45"/><ellipse cx="136" cy="122" rx="7" ry="4" fill="${COLORS.blush}" opacity=".45"/>`
        },
        laughing: {
            brows: stroke('M66,77 q12,-9 24,0') + stroke('M110,77 q12,-9 24,0'),
            eyes: stroke('M71,100 l7,4 l-7,4', 3.5, COLORS.ink) + stroke('M129,100 l-7,4 l7,4', 3.5, COLORS.ink),
            mouth: `<path d="M81,137 Q100,166 119,137 Z" fill="${COLORS.mouth}"/>` +
                   `<path d="M83,137.5 L117,137.5 L115.5,141.5 L84.5,141.5 Z" fill="${COLORS.teeth}"/>` +
                   `<path d="M92,152 Q100,147 108,152 Q100,158 92,152 Z" fill="#d9636a"/>`,
            extras: `<ellipse cx="64" cy="122" rx="8" ry="4.5" fill="${COLORS.blush}" opacity=".55"/><ellipse cx="136" cy="122" rx="8" ry="4.5" fill="${COLORS.blush}" opacity=".55"/>` +
                    `<path d="M150,60 l6,-6 M156,68 l8,-2 M144,54 l2,-8" stroke="#fde68a" stroke-width="3" stroke-linecap="round"/>`
        },
        thinking: {
            brows: stroke('M66,82 q12,-4 24,1') + stroke('M110,76 q12,-9 24,-1'),
            eyes: eyeDots(81, 99, 125, 99, 4),
            mouth: stroke('M90,144 Q101,143 111,139', 3.5, COLORS.mouth),
            extras: `<circle cx="146" cy="72" r="3" fill="#fff" opacity=".9"/><circle cx="153" cy="61" r="4.5" fill="#fff" opacity=".9"/>` +
                    `<g class="chew-dots"><ellipse cx="160" cy="44" rx="16" ry="11" fill="#fff"/><circle cx="153" cy="44" r="2.2" fill="${COLORS.ink}"/><circle cx="160" cy="44" r="2.2" fill="${COLORS.ink}"/><circle cx="167" cy="44" r="2.2" fill="${COLORS.ink}"/></g>`
        },
        sad: {
            brows: stroke('M66,85 L89,78') + stroke('M111,78 L134,85'),
            eyes: eyeDots(78, 104, 122, 104, 4),
            mouth: stroke('M86,149 Q100,137 114,149', 3.5, COLORS.mouth),
            extras: `<path class="chew-tear" d="M70,112 q-4,7 0,9 q4,-2 0,-9 Z" fill="#7dd3fc"/>`
        },
        angry: {
            brows: stroke('M65,77 L90,87', 5) + stroke('M110,87 L135,77', 5),
            eyes: eyeDots(79, 104, 121, 104, 4),
            mouth: `<path d="M86,146 Q100,138 114,146 L114,149 Q100,142 86,149 Z" fill="${COLORS.mouth}"/>` +
                   stroke('M88,146 L112,146', 2, COLORS.teeth),
            extras: `<ellipse cx="64" cy="120" rx="9" ry="5" fill="#ef4444" opacity=".35"/><ellipse cx="136" cy="120" rx="9" ry="5" fill="#ef4444" opacity=".35"/>` +
                    `<g class="chew-steam" stroke="#e5e7eb" stroke-width="3" fill="none" stroke-linecap="round"><path d="M40,58 q-6,-8 0,-16 q6,-8 0,-16"/><path d="M160,58 q6,-8 0,-16 q-6,-8 0,-16"/></g>`
        },
        surprised: {
            brows: stroke('M66,74 q12,-9 24,0') + stroke('M110,74 q12,-9 24,0'),
            eyes: eyeDots(78, 102, 122, 102, 5.8),
            mouth: `<ellipse cx="100" cy="146" rx="6.5" ry="8.5" fill="${COLORS.mouth}"/>`,
            extras: `<text x="154" y="52" font-size="28" font-weight="900" fill="#fde68a" font-family="system-ui">!</text>`
        },
        confused: {
            brows: stroke('M66,84 L90,80') + stroke('M110,75 q12,-7 24,2'),
            eyes: eyeDots(78, 103, 122, 101, 4) ,
            mouth: stroke('M86,145 q5,-4 9,0 q5,4 10,0 q4,-3 9,0', 3.2, COLORS.mouth),
            extras: `<text x="150" y="54" font-size="30" font-weight="900" fill="#fde68a" font-family="system-ui">?</text>`
        }
    };
    const MOOD_NAMES = Object.keys(MOODS);

    // ---- Static face (Lew, cartoon) ----
    function faceSVG(id) {
        const c = COLORS;
        return `
<svg class="chew-face" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chewbot">
  <defs><clipPath id="${id}-clip"><circle cx="100" cy="100" r="100"/></clipPath></defs>
  <g clip-path="url(#${id}-clip)">
    <rect width="200" height="200" class="chew-bg"/>
    <!-- jumper -->
    <path d="M18,200 C22,170 56,156 100,156 C144,156 178,170 182,200 Z" fill="${c.jumper}"/>
    <path d="M58,170 q4,10 0,20 q-4,10 0,20 M142,170 q-4,10 0,20 q4,10 0,20 M80,176 q3,8 0,16 q-3,8 0,16 M120,176 q-3,8 0,16 q3,8 0,16" stroke="${c.jumperDark}" stroke-width="3" fill="none"/>
    <!-- neck -->
    <rect x="82" y="146" width="36" height="22" fill="${c.skinShade}"/>
    <path d="M74,160 Q100,180 126,160" stroke="${c.jumperDark}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <!-- ears -->
    <ellipse cx="48" cy="108" rx="8" ry="12" fill="${c.skinShade}"/>
    <ellipse cx="152" cy="108" rx="8" ry="12" fill="${c.skinShade}"/>
    <!-- face -->
    <ellipse cx="100" cy="106" rx="53" ry="62" fill="${c.skin}"/>
    <!-- hair -->
    <path d="M47,106 C38,64 62,32 102,32 C142,32 162,62 153,106 C151,92 147,80 141,72 C132,64 122,60 108,62 C94,58 76,60 64,70 C56,79 50,92 47,106 Z" fill="${c.hair}"/>
    <path d="M76,40 q6,-16 22,-10 q-12,2 -14,12 Z M98,32 q12,-14 26,-4 q-12,0 -16,8 Z M118,36 q14,-6 22,6 q-10,-3 -18,2 Z M64,52 q-2,-14 14,-16 q-8,6 -6,14 Z" fill="${c.hair}"/>
    <path d="M84,54 q10,-8 22,-6 M110,52 q12,-4 22,4" stroke="${c.hairDark}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>
    <!-- beard -->
    <path d="M49,110 C49,152 72,182 100,182 C128,182 151,152 151,110 C147,126 141,134 133,137 C122,129 110,127 100,129 C90,127 78,129 67,137 C59,134 53,126 49,110 Z" fill="${c.beard}"/>
    <path d="M62,150 l3,2 M74,162 l2,3 M92,170 l1,3 M108,170 l-1,3 M126,162 l-2,3 M138,150 l-3,2" stroke="${c.beardDark}" stroke-width="2" stroke-linecap="round"/>
    <!-- nose -->
    <path d="M100,104 C97,114 93,120 96,124 C98,126 102,126 104,124" stroke="${c.skinShade}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <!-- mouth (mood) -->
    <g class="chew-mouth"></g>
    <!-- moustache -->
    <path d="M75,135 C83,124 95,124 100,128 C105,124 117,124 125,135 C115,131 107,132 100,134 C93,132 85,131 75,135 Z" fill="${c.beardDark}"/>
    <!-- eyes & brows (mood) -->
    <g class="chew-eyes"></g>
    <g class="chew-brows"></g>
    <!-- glasses -->
    <g stroke="${c.glasses}" stroke-width="4.5" fill="rgba(255,255,255,.14)">
      <rect x="59" y="88" width="38" height="29" rx="12"/>
      <rect x="103" y="88" width="38" height="29" rx="12"/>
    </g>
    <path d="M97,100 q3,-4 6,0 M59,98 L46,95 M141,98 L154,95" stroke="${c.glasses}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <g class="chew-extras"></g>
  </g>
</svg>`;
    }

    function setMood(svgRoot, mood) {
        const m = MOODS[mood] || MOODS.happy;
        svgRoot.querySelector('.chew-eyes').innerHTML = m.eyes;
        svgRoot.querySelector('.chew-brows').innerHTML = m.brows;
        svgRoot.querySelector('.chew-mouth').innerHTML = m.mouth;
        svgRoot.querySelector('.chew-extras').innerHTML = m.extras;
        svgRoot.setAttribute('data-mood', mood);
    }

    // Exposed so the faces can be previewed / reused elsewhere
    window.Chewbot = { faceSVG, setMood, MOODS: MOOD_NAMES };

    // ---- Chat widget ----
    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    }
    function formatReply(text) {
        let html = escapeHtml(text)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code>$1</code>');
        return html.replace(/\n/g, '<br>');
    }

    function init() {
        if (document.getElementById('chewbot-root')) return;
        const root = document.createElement('div');
        root.id = 'chewbot-root';
        root.innerHTML = `
            <div class="chew-panel" role="dialog" aria-label="Chewbot chat" aria-hidden="true">
                <div class="chew-header">
                    <div class="chew-header-face">${faceSVG('chewhead')}</div>
                    <div class="chew-header-text">
                        <div class="chew-name">Chewbot</div>
                        <div class="chew-status">OneSila help &middot; <span class="chew-mood-label">online</span></div>
                    </div>
                    <button class="chew-icon-btn chew-reset" title="Start a new chat" aria-label="Start a new chat">&#8635;</button>
                    <button class="chew-icon-btn chew-close" title="Close" aria-label="Close chat">&times;</button>
                </div>
                <div class="chew-messages" aria-live="polite"></div>
                <form class="chew-input-row">
                    <textarea class="chew-input" rows="1" maxlength="2000" placeholder="Ask Chewbot about OneSila..."></textarea>
                    <button type="submit" class="chew-send" aria-label="Send">&#10148;</button>
                </form>
            </div>
            <button class="chew-bubble" aria-label="Open Chewbot chat" title="Ask Chewbot">
                ${faceSVG('chewbubble')}
            </button>`;
        document.body.appendChild(root);

        const panel = root.querySelector('.chew-panel');
        const bubble = root.querySelector('.chew-bubble');
        const msgs = root.querySelector('.chew-messages');
        const form = root.querySelector('.chew-input-row');
        const input = root.querySelector('.chew-input');
        const sendBtn = root.querySelector('.chew-send');
        const headFace = root.querySelector('.chew-header-face svg');
        const bubbleFace = root.querySelector('.chew-bubble svg');
        const moodLabel = root.querySelector('.chew-mood-label');

        const GREETING = "Alright! I'm **Chewbot**. Stuck on something in OneSila? Tell me what's going on and I'll help you sort it.";
        let history = [];
        let busy = false;

        function mood(m) {
            setMood(headFace, m);
            setMood(bubbleFace, m);
            moodLabel.textContent = m === 'thinking' ? 'thinking...' : 'online';
        }

        function addMessage(role, text, faceMood) {
            const row = document.createElement('div');
            row.className = 'chew-msg chew-' + role;
            if (role === 'bot') {
                const mini = document.createElement('div');
                mini.className = 'chew-mini';
                mini.innerHTML = faceSVG('chewmini' + Math.random().toString(36).slice(2, 8));
                setMood(mini.querySelector('svg'), faceMood || 'happy');
                row.appendChild(mini);
            }
            const b = document.createElement('div');
            b.className = 'chew-text';
            b.innerHTML = role === 'bot' ? formatReply(text) : escapeHtml(text).replace(/\n/g, '<br>');
            row.appendChild(b);
            msgs.appendChild(row);
            msgs.scrollTop = msgs.scrollHeight;
            return row;
        }

        function addTyping() {
            const row = document.createElement('div');
            row.className = 'chew-msg chew-bot chew-typing';
            row.innerHTML = '<div class="chew-text"><span></span><span></span><span></span></div>';
            msgs.appendChild(row);
            msgs.scrollTop = msgs.scrollHeight;
            return row;
        }

        function reset() {
            history = [];
            msgs.innerHTML = '';
            addMessage('bot', GREETING, 'happy');
            mood('happy');
        }

        function open() {
            root.classList.add('open');
            panel.setAttribute('aria-hidden', 'false');
            if (!msgs.children.length) reset();
            setTimeout(() => input.focus(), 150);
        }
        function close() {
            root.classList.remove('open');
            panel.setAttribute('aria-hidden', 'true');
        }

        async function send(text) {
            if (busy || !text.trim()) return;
            busy = true;
            sendBtn.disabled = true;
            addMessage('user', text);
            history.push({ role: 'user', content: text });
            input.value = '';
            input.style.height = '';
            mood('thinking');
            const typing = addTyping();
            try {
                const res = await fetch('/api/chewbot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: history.slice(-20) })
                });
                const data = await res.json().catch(() => ({}));
                typing.remove();
                if (!res.ok || !data.success) {
                    const m = data.mood || 'sad';
                    addMessage('bot', data.message || "Sorry, I couldn't get an answer just now. Try again in a moment.", m);
                    mood(m);
                    history.pop();
                } else {
                    addMessage('bot', data.reply, data.mood);
                    history.push({ role: 'assistant', content: data.reply });
                    mood(data.mood);
                }
            } catch (e) {
                typing.remove();
                addMessage('bot', "I can't reach the server right now. Check your connection and try again.", 'sad');
                mood('sad');
                history.pop();
            } finally {
                busy = false;
                sendBtn.disabled = false;
                input.focus();
            }
        }

        bubble.addEventListener('click', () => root.classList.contains('open') ? close() : open());
        root.querySelector('.chew-close').addEventListener('click', close);
        root.querySelector('.chew-reset').addEventListener('click', reset);
        form.addEventListener('submit', e => { e.preventDefault(); send(input.value); });
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); }
            if (e.key === 'Escape') close();
        });
        input.addEventListener('input', () => {
            input.style.height = '';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        });

        mood('happy');

        // ---- Occasional speech-bubble nudges (help offers & jokes) ----
        const NUDGES = [
            { text: 'Need any help with OneSila?', mood: 'happy' },
            { text: "Got a sync error? Paste it in and I'll translate it into human.", mood: 'happy' },
            { text: 'Stuck on a listing? Give me a shout!', mood: 'happy' },
            { text: "I'm here if you need me. Just click my face.", mood: 'happy' },
            { text: "Fun fact: everything weighs something. Even if Amazon thinks it's 0.", mood: 'laughing' },
            { text: 'Hazmat Aspect? Not Applicable. You\'re welcome.', mood: 'laughing' },
            { text: "I'm like the real Chewis, but I never need a tea break.", mood: 'laughing' },
            { text: 'Why did the variation fall out with its parent? Different values.', mood: 'laughing' },
            { text: "Mapping values is easier than getting out of Tesco's car park. Probably.", mood: 'laughing' },
            { text: 'Another day, another validation issue (1).', mood: 'surprised' }
        ];
        const FIRST_NUDGE_MS = 45 * 1000;            // first pop-up after 45 seconds
        const NUDGE_GAP_MS = [3 * 60000, 6 * 60000]; // then every 3-6 minutes
        const NUDGE_SHOW_MS = 9000;                  // each one stays for 9 seconds
        const NUDGE_OFF_KEY = 'chewbotNudgesOff';

        const nudge = document.createElement('div');
        nudge.className = 'chew-nudge';
        nudge.setAttribute('role', 'status');
        nudge.innerHTML = '<span class="chew-nudge-text"></span><button class="chew-nudge-close" aria-label="Hide message" title="Hide">&times;</button>';
        root.appendChild(nudge);
        const nudgeText = nudge.querySelector('.chew-nudge-text');

        let lastNudge = -1, nudgeHideTimer = null, dismissals = 0;
        const nudgesOff = () => { try { return sessionStorage.getItem(NUDGE_OFF_KEY) === '1'; } catch (e) { return dismissals >= 2; } };

        function hideNudge() {
            clearTimeout(nudgeHideTimer);
            if (!nudge.classList.contains('show')) return;
            nudge.classList.remove('show');
            if (!root.classList.contains('open')) mood('happy');
        }
        function showNudge(force) {
            if (!force && (root.classList.contains('open') || document.hidden || nudgesOff())) return;
            let i;
            do { i = Math.floor(Math.random() * NUDGES.length); } while (NUDGES.length > 1 && i === lastNudge);
            lastNudge = i;
            nudgeText.textContent = NUDGES[i].text;
            mood(NUDGES[i].mood);
            nudge.classList.add('show');
            clearTimeout(nudgeHideTimer);
            nudgeHideTimer = setTimeout(hideNudge, NUDGE_SHOW_MS);
        }
        function scheduleNudge(delay) {
            setTimeout(() => {
                showNudge(false);
                if (!nudgesOff()) scheduleNudge(NUDGE_GAP_MS[0] + Math.random() * (NUDGE_GAP_MS[1] - NUDGE_GAP_MS[0]));
            }, delay);
        }

        nudgeText.addEventListener('click', () => { hideNudge(); open(); });
        nudge.querySelector('.chew-nudge-close').addEventListener('click', e => {
            e.stopPropagation();
            hideNudge();
            dismissals++;
            // Closed twice = they don't want them: stop for the rest of this visit
            if (dismissals >= 2) { try { sessionStorage.setItem(NUDGE_OFF_KEY, '1'); } catch (err) { /* ignore */ } }
        });
        bubble.addEventListener('click', hideNudge);

        window.Chewbot.nudge = () => showNudge(true); // handy for testing
        scheduleNudge(FIRST_NUDGE_MS);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
