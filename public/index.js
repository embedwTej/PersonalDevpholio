/* ==========================================================================
   PARTICLE BACKGROUND ENGINE
   ========================================================================== */
class ParticleBackground {
    constructor() {
        this.canvas = document.getElementById('particle-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.particles = [];
        this.maxParticles = 35;
        this.connectionDistance = 110;
        this.animating = true;
        this.theme = 'dark';
        
        this.init();
        this.animate();
        this.setupEvents();
    }

    init() {
        this.resize();
        this.particles = [];
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const count = isMobile ? 15 : this.maxParticles;

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 1.5 + 0.5
            });
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setTheme(theme) {
        this.theme = theme;
    }

    setupEvents() {
        window.addEventListener('resize', () => this.init());
        document.addEventListener('visibilitychange', () => {
            this.animating = !document.hidden;
            if (this.animating) this.animate();
        });
    }

    animate() {
        if (!this.animating) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const nodeColor = this.theme === 'dark' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(0, 114, 255, 0.15)';
        const lineColor = this.theme === 'dark' ? 'rgba(138, 43, 226, 0.05)' : 'rgba(124, 58, 237, 0.05)';

        // Draw links first
        this.ctx.strokeStyle = lineColor;
        this.ctx.lineWidth = 0.5;
        this.ctx.beginPath();
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.connectionDistance) {
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                }
            }
        }
        this.ctx.stroke();

        // Draw and update particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = nodeColor;
            this.ctx.fill();

            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
        }

        requestAnimationFrame(() => this.animate());
    }
}

/* ==========================================================================
   3D CARD TILT CONTROLLER
   ========================================================================== */
class CardTiltController {
    constructor() {
        this.cards = document.querySelectorAll('.timeline-card, .project-card, .bento-card');
        this.init();
    }

    init() {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile) return; // Disable tilt on mobile for performance

        this.cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const xc = rect.width / 2;
                const yc = rect.height / 2;

                // Rotation calculation scale factor
                const angleX = (yc - y) / 18;
                const angleY = (x - xc) / 18;

                card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) translateY(-6px)`;
            });

            card.style.transition = 'transform 0.1s ease, box-shadow 0.3s ease, border-color 0.3s ease';

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
            });
        });
    }
}

/* ==========================================================================
   ESP32 BOARD INTERACTIVE SIMULATOR
   ========================================================================== */
class ESP32Simulator {
    constructor() {
        // OLED values
        this.oledTemp = document.getElementById('oled-temp');
        this.oledHumid = document.getElementById('oled-humid');
        this.oledCanvas = document.getElementById('oled-chart');
        
        // Console output
        this.serialLines = document.getElementById('serial-lines');

        // Relay Switches & Indicators
        this.ledSwitch = document.getElementById('gpio-led-switch');
        this.acSwitch = document.getElementById('gpio-ac-switch');
        this.alarmSwitch = document.getElementById('gpio-alarm-switch');

        this.ledIndicator = document.getElementById('gpio-led-indicator');
        this.acIndicator = document.getElementById('gpio-ac-indicator');
        this.alarmIndicator = document.getElementById('gpio-alarm-indicator');

        this.graphPoints = [30, 35, 42, 38, 45, 52, 48, 50, 42, 38, 46, 52];
        
        this.init();
    }

    init() {
        this.bindSwitches();
        this.startSensorUpdates();
        this.drawOledGraph();
    }

    printSerialLog(type, message) {
        if (!this.serialLines) return;
        const line = document.createElement('div');
        line.className = `c-line ${type}`;
        const timestamp = new Date().toLocaleTimeString().split(' ')[0];
        line.innerHTML = `[${timestamp}] <span class="tag">[${type.toUpperCase()}]</span> ${message}`;

        // Temporarily pop blinking cursor element
        const blinkLine = this.serialLines.querySelector('.blink');
        if (blinkLine) this.serialLines.removeChild(blinkLine);

        this.serialLines.appendChild(line);

        // Keep maximum 6 lines scrolling
        while (this.serialLines.children.length > 5) {
            this.serialLines.removeChild(this.serialLines.firstElementChild);
        }

        // Re-append cursor
        if (blinkLine) this.serialLines.appendChild(blinkLine);
        this.serialLines.scrollTop = this.serialLines.scrollHeight;
    }

    bindSwitches() {
        if (this.ledSwitch && this.ledIndicator) {
            this.ledSwitch.addEventListener('change', () => {
                const active = this.ledSwitch.checked;
                this.ledIndicator.classList.toggle('active', active);
                this.printSerialLog(active ? 'success' : 'sys', active ? 'GPIO_02 (Built-in LED) set to HIGH' : 'GPIO_02 built-in LED set to LOW');
            });
        }

        if (this.acSwitch && this.acIndicator) {
            this.acSwitch.addEventListener('change', () => {
                const active = this.acSwitch.checked;
                this.acIndicator.classList.toggle('active', active);
                this.printSerialLog('mqtt', active ? 'MQTT payload published: office/ac -> 1 (Cooler ON)' : 'MQTT payload published: office/ac -> 0 (Cooler OFF)');
            });
        }

        if (this.alarmSwitch && this.alarmIndicator) {
            this.alarmSwitch.addEventListener('change', () => {
                const active = this.alarmSwitch.checked;
                this.alarmIndicator.classList.toggle('active', active);
                this.printSerialLog(active ? 'danger' : 'sys', active ? 'GPIO_17 Siren Relay HIGH - INTRUDER ALERT SIREN ACTIVE!' : 'GPIO_17 Siren Relay LOW - alarm siren cleared');
            });
        }
    }

    drawOledGraph() {
        if (!this.oledCanvas) return;
        const ctx = this.oledCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.oledCanvas.width, this.oledCanvas.height);
        
        // Draw sensor plot line
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        const step = this.oledCanvas.width / (this.graphPoints.length - 1);
        for (let i = 0; i < this.graphPoints.length; i++) {
            // Map 0-80 range to canvas height
            const y = this.oledCanvas.height - (this.graphPoints[i] / 80) * this.oledCanvas.height;
            const x = i * step;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw grid lines
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let y = 10; y < this.oledCanvas.height; y += 15) {
            ctx.moveTo(0, y);
            ctx.lineTo(this.oledCanvas.width, y);
        }
        ctx.stroke();
    }

    startSensorUpdates() {
        setInterval(() => {
            const newTemp = (24 + Math.random() * 2).toFixed(1);
            const newHumid = (60 + Math.random() * 5).toFixed(1);

            if (this.oledTemp) this.oledTemp.textContent = `${newTemp}°C`;
            if (this.oledHumid) this.oledHumid.textContent = `${newHumid}%`;

            // Push next graph point and shift
            this.graphPoints.shift();
            this.graphPoints.push(Math.floor(40 + Math.random() * 25));
            this.drawOledGraph();

            // Periodically log telemetry publish
            if (Math.random() > 0.6) {
                this.printSerialLog('info', `Sensor payload published (temp=${newTemp}°C, humid=${newHumid}%)`);
            }
        }, 2500);
    }
}

/* ==========================================================================
   DYNAMIC PORTFOLIO DATABASE SEEDING
   ========================================================================== */
// Dynamic data is seeded on load and stored in localStorage for CRUD operations.

/* ==========================================================================
   APPLICATION ENTRY POINT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Particle Background Engine
    const canvasAnimation = new ParticleBackground();

    // 2. Initialize 3D Card Tilt Effects
    new CardTiltController();

    // 3. Initialize Interactive ESP32 Simulator
    new ESP32Simulator();

    // 3b. Initialize Live Timezone Clock
    function initLocalClock() {
        const clockEl = document.getElementById('local-clock');
        if (!clockEl) return;
        
        const options = {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        
        const formatter = new Intl.DateTimeFormat('en-US', options);
        
        setInterval(() => {
            const now = new Date();
            clockEl.textContent = formatter.format(now);
        }, 1000);
        
        // Initial run
        clockEl.textContent = formatter.format(new Date());
    }
    initLocalClock();

    // 4. Theme Switcher Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    htmlEl.setAttribute('data-theme', savedTheme);
    canvasAnimation.setTheme(savedTheme);
    updateThemeIcon(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlEl.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        canvasAnimation.setTheme(newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        const icon = themeToggleBtn.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fa-solid fa-sun';
        } else {
            icon.className = 'fa-solid fa-moon';
        }
    }

    // 5. Navigation Sticky & Active Spy Highlighting
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            requestAnimationFrame(() => {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }

                let current = '';
                sections.forEach(section => {
                    const sectionTop = section.offsetTop - 150;
                    if (window.scrollY >= sectionTop) {
                        current = section.getAttribute('id');
                    }
                });

                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href').slice(1) === current) {
                        link.classList.add('active');
                    }
                });
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });

    // 6. Mobile Menu Overlay
    const mobileMenuBtn = document.querySelector('.mobile-menu-toggle');
    const mobileOverlay = document.querySelector('.mobile-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    mobileMenuBtn.addEventListener('click', () => {
        const isActive = mobileOverlay.classList.toggle('active');
        const icon = mobileMenuBtn.querySelector('i');
        if (isActive) {
            icon.className = 'fa-solid fa-xmark';
        } else {
            icon.className = 'fa-solid fa-bars-staggered';
        }
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileOverlay.classList.remove('active');
            mobileMenuBtn.querySelector('i').className = 'fa-solid fa-bars-staggered';
        });
    });

    // 7. Scroll Reveal Observer
    const revealElements = document.querySelectorAll('.scroll-reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => revealObserver.observe(el));

    // Stats Numeric Increments on Scroll
    const statNums = document.querySelectorAll('.stat-num, .hero-stat-num');
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                entry.target.classList.add('animated');
                const num = entry.target;
                const targetValue = parseInt(num.getAttribute('data-val'), 10);
                let startValue = 0;
                const duration = 1200;
                const increment = Math.max(1, Math.floor(targetValue / 40));
                const stepTime = duration / (targetValue / increment);
                
                const timer = setInterval(() => {
                    startValue += increment;
                    if (startValue >= targetValue) {
                        num.textContent = targetValue;
                        clearInterval(timer);
                    } else {
                        num.textContent = startValue;
                    }
                }, stepTime);
            }
        });
    }, { threshold: 0.1 });

    statNums.forEach(num => statsObserver.observe(num));

    // 8. Skills Progress Bar Fills on Scroll
    const skillsSection = document.getElementById('skills');
    const skillBars = document.querySelectorAll('.skill-bar-fill');
    let animatedSkills = false;

    const skillsObserver = new IntersectionObserver((entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !animatedSkills) {
            skillBars.forEach(bar => {
                const percent = bar.getAttribute('data-percent');
                bar.style.width = `${percent}%`;
            });
            animatedSkills = true;
        }
    }, { threshold: 0.15 });

    if (skillsSection) skillsObserver.observe(skillsSection);

    // 9. Project Filters (bound to dynamic project-cards)
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');
            const projectCards = document.querySelectorAll('.project-card');

            projectCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                
                if (filterValue === 'all' || cardCategory === filterValue) {
                    card.style.display = 'flex';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // 10. Project Details Modal popup (with dynamic event delegation)
    const modalEl = document.getElementById('project-modal');
    const modalCloseBtn = document.getElementById('modal-close');

    function closeModal() {
        if (modalEl) {
            modalEl.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalEl) {
        modalEl.addEventListener('click', (e) => {
            if (e.target === modalEl) closeModal();
        });
    }
    
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalEl && modalEl.classList.contains('active')) {
            closeModal();
        }
    });

    // 11. Contact Form Submissions
    const contactForm = document.getElementById('portfolio-contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            formStatus.style.display = 'none';
            formStatus.className = 'form-status-msg';

            let isFormValid = true;
            const requiredFields = contactForm.querySelectorAll('[required]');

            requiredFields.forEach(field => {
                const formGroup = field.closest('.form-group');
                formGroup.classList.remove('invalid');

                if (!field.value.trim()) {
                    formGroup.classList.add('invalid');
                    isFormValid = false;
                }
                
                if (field.type === 'email' && field.value.trim()) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(field.value.trim())) {
                        formGroup.classList.add('invalid');
                        isFormValid = false;
                    }
                }
            });

            if (isFormValid) {
                const submitBtn = contactForm.querySelector('.form-submit-btn');
                const originalBtnContent = submitBtn.innerHTML;
                
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span>Sending...</span> <i class="fa-solid fa-spinner fa-spin"></i>`;
                
                const payload = {
                    name: document.getElementById('form-name').value.trim(),
                    email: document.getElementById('form-email').value.trim(),
                    subject: document.getElementById('form-subject').value.trim(),
                    message: document.getElementById('form-message').value.trim()
                };

                fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Server responded with an error');
                    }
                    return response.json();
                })
                .then(data => {
                    formStatus.textContent = "Message sent successfully! Thank you, I will get back to you shortly.";
                    formStatus.className = 'form-status-msg success';
                    formStatus.style.display = 'block';
                    
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnContent;
                    contactForm.reset();
                })
                .catch(error => {
                    console.warn('Backend contact form submit failed, using simulation mode:', error);
                    setTimeout(() => {
                        formStatus.textContent = "Message sent successfully! (Simulation Mode)";
                        formStatus.className = 'form-status-msg success';
                        formStatus.style.display = 'block';
                        
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnContent;
                        contactForm.reset();
                    }, 1500);
                });
            } else {
                formStatus.textContent = "Please correct the errors in the fields above.";
                formStatus.classList.add('error');
                formStatus.style.display = 'block';
            }
        });
        
        contactForm.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', () => {
                input.closest('.form-group').classList.remove('invalid');
            });
        });
    }
});

/* ==========================================================================
   SPIDER-MAN WEB BACKGROUND ENGINE
   ========================================================================== */
class SpiderWebBackground {
    constructor() {
        this.canvas = document.getElementById('web-bg-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.miniSpiders = [];
        this.webNodes = [];
        this.time = 0;
        this.mouse = { x: -1000, y: -1000 };
        
        this._resize();
        window.addEventListener('resize', () => { this._resize(); this._buildWeb(); });
        window.addEventListener('mousemove', e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        this._buildWeb();
        this._loop();
    }

    _resize() {
        this.canvas.width  = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    _buildWeb() {
        const W = this.canvas.width, H = this.canvas.height;
        this.webNodes = [];
        this.miniSpiders = [];

        // Define web anchor points (corners + edge midpoints + center)
        const anchors = [
            { x: 0,     y: 0 },
            { x: W/2,   y: 0 },
            { x: W,     y: 0 },
            { x: W,     y: H/2 },
            { x: W,     y: H },
            { x: W/2,   y: H },
            { x: 0,     y: H },
            { x: 0,     y: H/2 },
            { x: W*0.25, y: 0 },
            { x: W*0.75, y: 0 },
            { x: W,     y: H*0.25 },
            { x: W,     y: H*0.75 },
        ];

        // Web hubs (radial centers)
        const hubs = [
            { x: W * 0.15, y: H * 0.12 },
            { x: W * 0.82, y: H * 0.08 },
            { x: W * 0.92, y: H * 0.6  },
            { x: W * 0.08, y: H * 0.75 },
            { x: W * 0.5,  y: H * 0.3  },
        ];

        this.hubs    = hubs;
        this.anchors = anchors;

        // Place mini spiders at hub positions + a few random spots
        hubs.forEach(h => {
            this.miniSpiders.push({
                x: h.x,
                y: h.y,
                homeX: h.x,
                homeY: h.y,
                size: 6 + Math.random() * 5,
                angle: Math.random() * Math.PI * 2,
                vAngle: (Math.random() - 0.5) * 0.015,
                isScurrying: false
            });
        });
        // Add extra random mini spiders on web
        for (let i = 0; i < 8; i++) {
            const a = anchors[Math.floor(Math.random() * anchors.length)];
            const h = hubs[Math.floor(Math.random() * hubs.length)];
            const t = 0.2 + Math.random() * 0.6;
            const sx = a.x + (h.x - a.x) * t;
            const sy = a.y + (h.y - a.y) * t;
            this.miniSpiders.push({
                x: sx,
                y: sy,
                homeX: sx,
                homeY: sy,
                size: 3 + Math.random() * 4,
                angle: Math.random() * Math.PI * 2,
                vAngle: (Math.random() - 0.5) * 0.01,
                isScurrying: false
            });
        }
    }

    _drawHub(hub, rings, spokeCount) {
        const ctx = this.ctx;
        const { x, y } = hub;
        const W = this.canvas.width, H = this.canvas.height;
        const maxR = Math.min(W, H) * 0.45;

        // Draw radial spokes from this hub toward edges
        for (let s = 0; s < spokeCount; s++) {
            const angle = (s / spokeCount) * Math.PI * 2;
            const ex = x + Math.cos(angle) * maxR;
            const ey = y + Math.sin(angle) * maxR;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(ex, ey);
            ctx.stroke();
        }

        // Draw concentric polygon web rings
        for (let r = 1; r <= rings; r++) {
            const radius = (maxR / rings) * r;
            ctx.beginPath();
            for (let s = 0; s <= spokeCount; s++) {
                const angle = (s / spokeCount) * Math.PI * 2;
                const px = x + Math.cos(angle) * radius;
                const py = y + Math.sin(angle) * radius;
                if (s === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
        }
    }

    _drawMiniSpider(sp, size) {
        const ctx = this.ctx;
        const { x, y } = sp;
        const s = size || sp.size;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(sp.angle);

        // Abdomen (large round, red with black pattern)
        const abdGrad = ctx.createRadialGradient(-s*0.1, -s*0.15, 0, 0, 0, s * 0.7);
        abdGrad.addColorStop(0, 'rgba(255, 80, 60, 0.95)');
        abdGrad.addColorStop(0.5, 'rgba(200, 15, 25, 0.9)');
        abdGrad.addColorStop(1, 'rgba(80, 0, 5, 0.85)');
        ctx.beginPath();
        ctx.ellipse(0, s * 0.35, s * 0.45, s * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = abdGrad;
        ctx.fill();

        // Black hourglass / dorsal stripe on abdomen
        ctx.beginPath();
        ctx.ellipse(0, s * 0.3, s * 0.14, s * 0.45, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fill();

        // Abdomen sheen highlight
        const sheen = ctx.createRadialGradient(-s*0.18, s*0.1, 0, -s*0.1, s*0.2, s*0.4);
        sheen.addColorStop(0, 'rgba(255,200,180,0.35)');
        sheen.addColorStop(1, 'rgba(255,100,80,0)');
        ctx.beginPath();
        ctx.ellipse(-s*0.05, s*0.28, s*0.28, s*0.38, -0.3, 0, Math.PI*2);
        ctx.fillStyle = sheen;
        ctx.fill();

        // Cephalothorax (head/thorax — dark brown)
        const thorGrad = ctx.createRadialGradient(-s*0.08, -s*0.1, 0, 0, -s*0.05, s * 0.38);
        thorGrad.addColorStop(0, 'rgba(90, 40, 10, 0.95)');
        thorGrad.addColorStop(1, 'rgba(30, 8, 2, 0.9)');
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.18, s * 0.34, s * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = thorGrad;
        ctx.fill();

        // Eyes (4 pair = 8 eyes, simplified as 3 glowing dots)
        [[-s*0.16, -s*0.35], [0, -s*0.38], [s*0.16, -s*0.35]].forEach(([ex, ey]) => {
            ctx.beginPath();
            ctx.arc(ex, ey, s * 0.07, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 60, 20, 0.95)';
            ctx.fill();
            // eye glow
            ctx.beginPath();
            ctx.arc(ex - s*0.02, ey - s*0.02, s * 0.025, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,200,180,0.8)';
            ctx.fill();
        });

        // 8 Legs (4 each side) with elbow joints (animated on scurry/crawl)
        ctx.strokeStyle = 'rgba(30, 8, 2, 0.9)';
        ctx.lineWidth = s * 0.08;
        ctx.lineCap = 'round';

        const timeFactor = sp.isScurrying ? 0.35 : 0.06;
        const wave = Math.sin(this.time * timeFactor * 10);
        const waveAlt = Math.sin(this.time * timeFactor * 10 + Math.PI);
        const amplitude = sp.isScurrying ? s * 0.15 : s * 0.04;

        const legPairs = [
            // Left side legs
            [-s*0.3, -s*0.1,  -s*1.1, -s*0.55 + wave * amplitude, -s*1.55, s*0.05 + wave * amplitude],
            [-s*0.3,  s*0.0,  -s*1.15, s*0.1 - wave * amplitude,  -s*1.6,  s*0.5 - wave * amplitude],
            [-s*0.3,  s*0.15, -s*1.05, s*0.55 + wave * amplitude, -s*1.35, s*0.95 + wave * amplitude],
            [-s*0.28, s*0.28, -s*0.85, s*0.85 - wave * amplitude, -s*1.0,  s*1.3 - wave * amplitude],
            // Right side legs (alternate phase)
            [ s*0.3, -s*0.1,   s*1.1, -s*0.55 + waveAlt * amplitude,  s*1.55, s*0.05 + waveAlt * amplitude],
            [ s*0.3,  s*0.0,   s*1.15, s*0.1 - waveAlt * amplitude,   s*1.6,  s*0.5 - waveAlt * amplitude],
            [ s*0.3,  s*0.15,  s*1.05, s*0.55 + waveAlt * amplitude,  s*1.35, s*0.95 + waveAlt * amplitude],
            [ s*0.28, s*0.28,  s*0.85, s*0.85 - waveAlt * amplitude,  s*1.0,  s*1.3 - waveAlt * amplitude],
        ];

        legPairs.forEach(([sx, sy, ex, ey, tx, ty]) => {
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(ex, ey, tx, ty);
            ctx.stroke();
        });

        ctx.restore();
    }

    _loop() {
        const ctx = this.ctx;
        const W = this.canvas.width, H = this.canvas.height;

        ctx.clearRect(0, 0, W, H);

        // Web strand style
        ctx.strokeStyle = 'rgba(200, 15, 25, 0.07)';
        ctx.lineWidth   = 0.6;

        // Draw web from each hub
        this.hubs.forEach((hub, i) => {
            const rings  = 5 + i;
            const spokes = 8 + i * 2;
            this._drawHub(hub, rings, spokes);
        });

        // Draw connecting strands between hubs
        ctx.strokeStyle = 'rgba(200, 15, 25, 0.04)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < this.hubs.length; i++) {
            for (let j = i + 1; j < this.hubs.length; j++) {
                const h1 = this.hubs[i], h2 = this.hubs[j];
                const dist = Math.hypot(h2.x - h1.x, h2.y - h1.y);
                if (dist < W * 0.65) {
                    ctx.beginPath();
                    const mx = (h1.x + h2.x)/2 + (Math.random() - 0.5) * 30;
                    const my = (h1.y + h2.y)/2 + (Math.random() - 0.5) * 30;
                    ctx.moveTo(h1.x, h1.y);
                    ctx.quadraticCurveTo(mx, my, h2.x, h2.y);
                    ctx.stroke();
                }
            }
        }

        // Update & draw mini spiders
        this.miniSpiders.forEach(sp => {
            const dx = sp.x - this.mouse.x;
            const dy = sp.y - this.mouse.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 120) {
                // Scurry away from mouse
                const force = (120 - dist) / 120;
                const angle = Math.atan2(dy, dx);
                sp.x += Math.cos(angle) * force * 5.5;
                sp.y += Math.sin(angle) * force * 5.5;
                sp.angle = angle - Math.PI / 2 + (Math.random() - 0.5) * 0.35; // face away and wiggle
                sp.isScurrying = true;
            } else {
                // Return slowly to home position
                sp.x += (sp.homeX - sp.x) * 0.025;
                sp.y += (sp.homeY - sp.y) * 0.025;
                sp.angle += sp.vAngle;
                sp.isScurrying = false;
            }

            // Constrain to canvas bounds
            sp.x = Math.max(15, Math.min(W - 15, sp.x));
            sp.y = Math.max(15, Math.min(H - 15, sp.y));

            this._drawMiniSpider(sp);
        });

        this.time++;
        requestAnimationFrame(() => this._loop());
    }
}

/* ==========================================================================
   SPEECH SYNTHESIS HELPER (TOM HOLLAND / SPIDER-MAN VOICE SELECTOR)
   ========================================================================== */
function _getTomHollandVoice(voices) {
    if (!voices || voices.length === 0) return null;
    
    const enVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
    if (enVoices.length === 0) return null;
    
    // 1. Search for a voice explicitly containing 'tom'
    let voice = enVoices.find(v => v.name.toLowerCase().includes('tom'));
    if (voice) return voice;
    
    // 2. Search for local male voices (high reliability, low latency)
    const maleNames = ['david', 'mark', 'george', 'daniel', 'alex', 'fred', 'oliver', 'male'];
    voice = enVoices.find(v => {
        const nameLower = v.name.toLowerCase();
        return v.localService && maleNames.some(name => nameLower.includes(name));
    });
    if (voice) return voice;
    
    // 3. Search for any male voice (including remote/Google)
    voice = enVoices.find(v => {
        const nameLower = v.name.toLowerCase();
        return maleNames.some(name => nameLower.includes(name));
    });
    if (voice) return voice;
    
    // 4. Filter out female voices and select the first remaining
    const femaleIndicators = ['zira', 'hazel', 'samantha', 'siri', 'female', 'karen', 'veena', 'moira', 'tessa', 'susan', 'heera', 'kathy', 'victoria', 'haruka', 'yuna'];
    voice = enVoices.find(v => {
        const nameLower = v.name.toLowerCase();
        return !femaleIndicators.some(indicator => nameLower.includes(indicator));
    });
    if (voice) return voice;
    
    // 5. Fallback to the first English voice
    return enVoices[0];
}

/* ==========================================================================
   SPIDER WEB SHOOTER & SPLAT PARTICLES EFFECT
   ========================================================================== */
class SpiderCursorEffect {
    constructor() {
        this.canvas = document.getElementById('spider-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.time = 0;
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        
        // 3D Node position (target is mouse)
        this.nodeX = window.innerWidth / 2;
        this.nodeY = window.innerHeight / 2;
        this.nodeZ = 0;
        
        // Rotation angles for 3D perspective
        this.rotX = 0;
        this.rotY = 0;
        this.rotZ = 0;
        
        // Target rotation (driven by mouse movement speed/inertia)
        this.targetRotX = 0;
        this.targetRotY = 0;
        
        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
        this.mouseMoved = false;
        
        // 3D Particles
        this.particles = [];
        // 3D Click waves (expanding rings in 3D)
        this.clickWaves = [];
        // Floating ambient 3D stars/dust around the cursor
        this.dust = [];
        this.initDust();
        
        this._resize();
        window.addEventListener('resize', () => this._resize());
        
        document.addEventListener('mousemove', e => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.mouseMoved = true;
            
            // Calculate cursor speed/delta to tilt the 3D grid
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            this.targetRotY = Math.max(-0.6, Math.min(0.6, dx * 0.012));
            this.targetRotX = Math.max(-0.6, Math.min(0.6, -dy * 0.012));
            
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });
        
        document.addEventListener('mousedown', e => this._createClickEffect(e));
        
        this._loop();
    }
    
    _resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    initDust() {
        // Create permanent 3D dust particles that drift around screen space
        for (let i = 0; i < 40; i++) {
            this.dust.push({
                x: (Math.random() - 0.5) * window.innerWidth * 1.5,
                y: (Math.random() - 0.5) * window.innerHeight * 1.5,
                z: (Math.random() - 0.5) * 400,
                baseX: 0,
                baseY: 0,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                speedZ: (Math.random() - 0.5) * 0.2,
                size: 1 + Math.random() * 2
            });
        }
    }
    _createClickEffect(e) {
        // Ignore clicks on interactive UI controls
        if (e.target && typeof e.target.closest === 'function') {
            if (e.target.closest('a, button, input, textarea, select, #map, .toggle-slider, .filter-btn')) {
                return;
            }
        }
        
        this._speakTomHollandQuote();
        this._playCleanThwipSound();
        
        const clickX = e.clientX - this.canvas.width / 2;
        const clickY = e.clientY - this.canvas.height / 2;
        
        // Spawn 3D expanding rings
        this.clickWaves.push({
            x: clickX,
            y: clickY,
            z: 0,
            radius: 0,
            maxRadius: 70 + Math.random() * 30,
            alpha: 1.0,
            decay: 0.035,
            color: Math.random() < 0.5 ? '#ff2a3b' : '#00f0ff', // Red or Cyan 3D holograms
            segments: 8 // Octagon shapes look very clean and industrial
        });
        
        // Spawn 3D particles in a spherical burst
        const particleCount = 20 + Math.floor(Math.random() * 10);
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const speed = 3.5 + Math.random() * 6;
            
            // Convert spherical coordinates to 3D velocity
            const vx = Math.sin(phi) * Math.cos(theta) * speed;
            const vy = Math.sin(phi) * Math.sin(theta) * speed;
            const vz = Math.cos(phi) * speed;
            
            this.particles.push({
                x: clickX,
                y: clickY,
                z: 0,
                vx: vx,
                vy: vy,
                vz: vz,
                alpha: 1.0,
                decay: 0.02 + Math.random() * 0.015,
                color: Math.random() < 0.5 ? '#ff2a3b' : '#00f0ff',
                size: 1.5 + Math.random() * 2
            });
        }
    }

    _speakTomHollandQuote() {
        try {
            if (!window.speechSynthesis) return;
            
            // Cancel any active speech so they don't queue up
            window.speechSynthesis.cancel();
            
            const quotes = [
                "Hey everyone.",
                "Hi, I'm Peter Parker.",
                "You have a metal arm? That is awesome, dude!",
                "Magic! More magic! Magic with a kick!",
                "Friendly neighborhood Spider-Man!",
                "I got this. I got this!",
                "I just wanted to be like you.",
                "Peter-tingle, or whatever you want to call it."
            ];
            
            const quote = quotes[Math.floor(Math.random() * quotes.length)];
            const utterance = new SpeechSynthesisUtterance(quote);
            
            // Find a suitable voice. Tom Holland is a youthful male voice.
            const voices = window.speechSynthesis.getVoices();
            const tomVoice = _getTomHollandVoice(voices);
            
            if (tomVoice) {
                utterance.voice = tomVoice;
            }
            
            // Adjust speech parameters to match Tom Holland's youthful, energetic, slightly higher-pitched character
            utterance.pitch = 1.15; // Youthful tone
            utterance.rate = 1.08;  // Energetic speed
            utterance.volume = 0.85;
            
            window.speechSynthesis.speak(utterance);
        } catch (err) {
            console.warn("Speech Synthesis failed:", err);
        }
    }

    _playCleanThwipSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            const now = audioCtx.currentTime;
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
            
            gainNode.gain.setValueAtTime(0.01, now);
            gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            
            osc.start(now);
            osc.stop(now + 0.15);
        } catch (err) {
            // Ignore blocked audio contexts
        }
    }
    
    // Project 3D coordinate (x,y,z) into 2D screen coordinate with rotation
    project(x, y, z) {
        // Rotate around Y axis (horizontal rotation)
        let cosY = Math.cos(this.rotY), sinY = Math.sin(this.rotY);
        let x1 = x * cosY - z * sinY;
        let z1 = x * sinY + z * cosY;
        
        // Rotate around X axis (vertical rotation)
        let cosX = Math.cos(this.rotX), sinX = Math.sin(this.rotX);
        let y2 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;
        
        // Perspective projection
        const fov = 350; // Focal length
        const scale = fov / (fov + z2);
        
        return {
            x: this.canvas.width / 2 + x1 * scale,
            y: this.canvas.height / 2 + y2 * scale,
            scale: scale,
            visible: z2 > -fov // Clip if behind camera
        };
    }
    
    _loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.time++;
        
        // Smoothly interpolate 3D rotation angles back to target (inertia)
        this.rotX += (this.targetRotX - this.rotX) * 0.07;
        this.rotY += (this.targetRotY - this.rotY) * 0.07;
        this.rotZ += 0.005; // Gentle constant rotation
        
        // Slowly damp the target rotation (so it returns to center if mouse stops moving)
        this.targetRotX *= 0.94;
        this.targetRotY *= 0.94;
        
        // 1. Update and Draw 3D Click Waves (Concentric Tilting Rings)
        for (let i = this.clickWaves.length - 1; i >= 0; i--) {
            const w = this.clickWaves[i];
            w.radius += (w.maxRadius - w.radius) * 0.09;
            w.alpha -= w.decay;
            
            if (w.alpha <= 0 || w.radius >= w.maxRadius - 1) {
                this.clickWaves.splice(i, 1);
            } else {
                this.ctx.save();
                this.ctx.strokeStyle = w.color;
                this.ctx.globalAlpha = w.alpha * 0.45;
                this.ctx.lineWidth = 1.5;
                
                // Draw 3D polygon ring
                this.ctx.beginPath();
                for (let s = 0; s <= w.segments; s++) {
                    const angle = (s / w.segments) * Math.PI * 2;
                    const rx = w.x + Math.cos(angle) * w.radius;
                    const ry = w.y + Math.sin(angle) * w.radius;
                    const proj = this.project(rx, ry, w.z);
                    
                    if (proj.visible) {
                        if (s === 0) this.ctx.moveTo(proj.x, proj.y);
                        else this.ctx.lineTo(proj.x, proj.y);
                    }
                }
                this.ctx.stroke();
                
                // Draw dynamic text coordinate marker near click wave
                if (w.alpha > 0.45) {
                    const textProj = this.project(w.x + w.radius * 0.6, w.y - w.radius * 0.6, w.z);
                    if (textProj.visible) {
                        this.ctx.font = '7px "Fira Code", monospace';
                        this.ctx.fillStyle = w.color;
                        this.ctx.globalAlpha = (w.alpha - 0.4) * 0.8;
                        this.ctx.fillText(`P_GRID: [${(w.x + this.canvas.width/2).toFixed(0)}, ${(w.y + this.canvas.height/2).toFixed(0)}]`, textProj.x, textProj.y);
                    }
                }
                this.ctx.restore();
            }
        }
        
        // 2. Update and Draw 3D Particles (Click Explosion)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;
            
            // Apply air resistance
            p.vx *= 0.94;
            p.vy *= 0.94;
            p.vz *= 0.94;
            
            p.alpha -= p.decay;
            
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            } else {
                const proj = this.project(p.x, p.y, p.z);
                if (proj.visible) {
                    const size = p.size * proj.scale;
                    
                    this.ctx.save();
                    this.ctx.globalAlpha = p.alpha;
                    this.ctx.fillStyle = p.color;
                    this.ctx.shadowColor = p.color;
                    this.ctx.shadowBlur = 6;
                    
                    // Draw a clean tiny glowing sphere/square
                    this.ctx.beginPath();
                    this.ctx.arc(proj.x, proj.y, Math.max(0.5, size), 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();
                }
            }
        }
        
        // 3. Update and Draw 3D Ambient Dust Packets
        this.dust.forEach(d => {
            d.x += d.speedX;
            d.y += d.speedY;
            d.z += d.speedZ;
            
            // Boundary wrap in 3D
            const limitX = window.innerWidth * 0.8;
            const limitY = window.innerHeight * 0.8;
            if (Math.abs(d.x) > limitX) d.x = -d.x;
            if (Math.abs(d.y) > limitY) d.y = -d.y;
            if (d.z > 200) d.z = -200;
            if (d.z < -200) d.z = 200;
            
            const proj = this.project(d.x, d.y, d.z);
            if (proj.visible) {
                const size = d.size * proj.scale;
                this.ctx.beginPath();
                this.ctx.arc(proj.x, proj.y, Math.max(0.5, size), 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${0.12 * proj.scale})`;
                this.ctx.fill();
            }
        });
        
        // 4. Update and Draw Hover 3D Node Mesh (follows cursor)
        if (this.mouseMoved) {
            // Translate cursor screen coordinates to relative 3D space
            const target3DX = this.mouseX - this.canvas.width / 2;
            const target3DY = this.mouseY - this.canvas.height / 2;
            
            // Lerp 3D node position
            this.nodeX += (target3DX - this.nodeX) * 0.1;
            this.nodeY += (target3DY - this.nodeY) * 0.1;
            this.nodeZ += (0 - this.nodeZ) * 0.1;
            
            // Draw clean 3D spider-sense / geometric web cursor
            const coreProj = this.project(this.nodeX, this.nodeY, this.nodeZ);
            if (coreProj.visible) {
                const s = 15 * coreProj.scale; // Base size scaled by depth
                
                this.ctx.save();
                this.ctx.shadowColor = '#00f0ff';
                this.ctx.shadowBlur = 10;
                
                // Draw 3D Central Ring
                this.ctx.strokeStyle = '#00f0ff';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.arc(coreProj.x, coreProj.y, s * 0.4, 0, Math.PI * 2);
                this.ctx.stroke();
                
                // Draw 3D Outer Hexagon spokes
                this.ctx.strokeStyle = 'rgba(232, 25, 44, 0.7)'; // Red web lines
                this.ctx.lineWidth = 1.0;
                this.ctx.beginPath();
                
                const points = 6;
                const projectedVertices = [];
                for (let j = 0; j < points; j++) {
                    const angle = (j / points) * Math.PI * 2 + this.rotZ;
                    
                    // Vertex in local space around node
                    const lx = this.nodeX + Math.cos(angle) * 20;
                    const ly = this.nodeY + Math.sin(angle) * 20;
                    const lz = this.nodeZ + Math.sin(angle * 2) * 8; // Bends in Z space!
                    
                    const pVert = this.project(lx, ly, lz);
                    projectedVertices.push(pVert);
                    
                    if (pVert.visible) {
                        // Radial spoke from core
                        this.ctx.moveTo(coreProj.x, coreProj.y);
                        this.ctx.lineTo(pVert.x, pVert.y);
                    }
                }
                this.ctx.stroke();
                
                // Connect vertices of outer ring in 3D
                this.ctx.beginPath();
                projectedVertices.forEach((v, index) => {
                    if (v.visible) {
                        if (index === 0) this.ctx.moveTo(v.x, v.y);
                        else this.ctx.lineTo(v.x, v.y);
                    }
                });
                if (projectedVertices[0] && projectedVertices[0].visible) {
                    this.ctx.lineTo(projectedVertices[0].x, projectedVertices[0].y);
                }
                this.ctx.stroke();
                
                // Draw a thin connection web to nearby dust particles
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                this.ctx.lineWidth = 0.5;
                this.dust.forEach(d => {
                    const dist = Math.hypot(d.x - this.nodeX, d.y - this.nodeY);
                    if (dist < 100) {
                        const dProj = this.project(d.x, d.y, d.z);
                        if (dProj.visible && coreProj.visible) {
                            this.ctx.beginPath();
                            this.ctx.moveTo(coreProj.x, coreProj.y);
                            this.ctx.lineTo(dProj.x, dProj.y);
                            this.ctx.stroke();
                        }
                    }
                });
                
                this.ctx.restore();
            }
        }
        
        requestAnimationFrame(() => this._loop());
    }
}

// Initialize Leaflet Map centered on Chennai with Dark Mode tiles
function initLocationMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // Chennai coordinates
    const chennaiCoords = [13.0827, 80.2707];

    // Initialize map with minimal options
    const map = L.map('map', {
        center: chennaiCoords,
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false // disable to prevent scroll interception
    });

    // Load CartoDB Dark Matter tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        minZoom: 9
    }).addTo(map);

    // Custom DivIcon for the Spiderman pulsing radar dot
    const radarIcon = L.divIcon({
        className: 'custom-radar-icon',
        html: '<div class="map-radar-pulse"></div><div class="map-radar-dot"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    // Add marker to map
    L.marker(chennaiCoords, { icon: radarIcon }).addTo(map);
}

// Initialize all effects
document.addEventListener('DOMContentLoaded', () => {
    initLocationMap();
    new SpiderWebBackground();
    new SpiderCursorEffect();
    
    // Seed database and render dynamic lists
    seedDefaultData();
    renderProjects();
    renderAchievements();
    
    // Initialize admin controller and mini-game
    initAdminConsole();
    const spideyGame = new SpideyTargetPracticeGame();
    
    // Wire up floating game button to open game modal
    const spideyGameBtn = document.getElementById('spidey-game-btn');
    const gameModal = document.getElementById('game-modal');
    if (spideyGameBtn && gameModal) {
        spideyGameBtn.addEventListener('click', () => {
            gameModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            spideyGame.resizeCanvas();
        });
    }
});

/* ==========================================================================
   DYNAMIC DATABASE CRUD & ADMIN DASHBOARD LOGIC
   ========================================================================== */

function seedDefaultData() {
    if (!localStorage.getItem('portfolio_projects')) {
        const defaultProjects = [
            {
                id: "uhf",
                title: "UHF-Based Vehicle Monitoring and SAP Integration System",
                category: "industrial",
                bullets: [
                    "Developed automated vehicle identification using UHF RFID gate controllers.",
                    "Integrated real-time movements with SAP ERP database modules.",
                    "Deployed system at Guinness Nigeria PLC & CDBL (Haryana)."
                ],
                tech: ["UHF RFID", "SAP ERP Link", "Telemetry Dashboards"],
                image: ""
            },
            {
                id: "fire",
                title: "AI-Based Fire Detection Camera System",
                category: "ai",
                bullets: [
                    "Deployed intelligent edge analytics for smoke and fire detection.",
                    "Configured camera lens telemetry and instant alert SMS loops.",
                    "Installed at Insignia Nigeria, boosting safety response times."
                ],
                tech: ["Computer Vision", "Edge AI", "Cloud Telemetry"],
                image: ""
            },
            {
                id: "dashcam",
                title: "AI Dashcam Fleet Monitoring System",
                category: "ai",
                bullets: [
                    "Integrated driver behavior metrics and fatigue/distraction alerts.",
                    "Conducted pilot deployment over 20 commercial trucks at BHN Nigeria.",
                    "Enabled remote cloud monitoring dashboard sync with real-time video uploads."
                ],
                tech: ["Edge AI", "Fleet Safety", "Video Analytics"],
                image: ""
            },
            {
                id: "washroom",
                title: "Smart Washroom Monitoring System",
                category: "industrial",
                bullets: [
                    "Installed environmental monitoring platforms with ESP32 controllers.",
                    "Completed deployment of 32+ devices at Rourkela Steel Plant.",
                    "Improved maintenance response times and reduced manual inspections by 40%."
                ],
                tech: ["ESP32", "Environmental Sensors", "Smart Plant Hygiene"],
                image: ""
            },
            {
                id: "fence",
                title: "VAJRA Electric Fence Protection System",
                category: "embedded",
                bullets: [
                    "Designed an IoT-based system to detect wire-tampering and cuts.",
                    "Integrated energy monitoring chips and cellular modules for alerts.",
                    "Optimized for low-power operation in remote agricultural perimeters."
                ],
                tech: ["Edge Computing", "Energy Monitoring", "Cellular Modules"],
                image: ""
            },
            {
                id: "attendance",
                title: "RFID-Based Smart Attendance System",
                category: "embedded",
                bullets: [
                    "Developed cryptographic check-ins to prevent proxy attendance.",
                    "Integrated contactless hardware modules with local server links."
                ],
                tech: ["RFID Readers", "Identity Verification", "Contactless Hardware"],
                image: ""
            },
            {
                id: "biometric",
                title: "Biometric Access Control System",
                category: "embedded",
                bullets: [
                    "Developed biometric-based entry security panels for institutions.",
                    "Integrated solenoid lock drivers with local security verification logic."
                ],
                tech: ["Biometrics", "Access Control Logic", "Solenoid Drivers"],
                image: ""
            },
            {
                id: "deterrent",
                title: "Animal Deterrent System",
                category: "embedded",
                bullets: [
                    "Designed solar-powered outdoor PIR motion and ultrasonic frequency triggers.",
                    "Protects crops and farms from intrusion without harming local wildlife."
                ],
                tech: ["Ultrasonic Frequencies", "PIR Sensors", "Low-Power Design"],
                image: ""
            },
            {
                id: "iotronics",
                title: "Iotronics Kit Applied IoT Training Platform",
                category: "industrial",
                bullets: [
                    "Created a modular system design kit mapping sensors to actuators.",
                    "Used in academic workshops to teach applied telemetry and protocols."
                ],
                tech: ["Modular Hardware", "Educational Workshops", "Telemetry APIs"],
                image: ""
            }
        ];
        localStorage.setItem('portfolio_projects', JSON.stringify(defaultProjects));
    }
    const storedAch = localStorage.getItem('portfolio_achievements');
    const needsReseed = !storedAch || storedAch.includes("Smart Washroom deployment at Rourkela");
    
    if (needsReseed) {
        const defaultAchievements = [
            {
                id: "ach-1",
                title: "India Book of Records SDG Hackathon",
                desc: "Led the planning and execution of a Sustainable Development Goals (SDG) focused hackathon with 800+ student registrations, recognized by the India Book of Records.",
                badge: "National Record",
                image: ""
            },
            {
                id: "ach-2",
                title: "Industrial IoT Plant Deployments",
                desc: "Led end-to-end deployment of industrial IoT solutions across large-scale facilities, installing 32+ devices at Rourkela Steel Plant and 5 devices at NTPC Mauda.",
                badge: "IoT Deployment",
                image: ""
            },
            {
                id: "ach-3",
                title: "Smart India Hackathon (SIH) Mentor",
                desc: "Served as a mentor, guiding student teams in problem statement analysis, system design, hardware-software integration, and prototype development.",
                badge: "SIH Mentor",
                image: ""
            },
            {
                id: "ach-4",
                title: "Expert Speaker at IIM Nagpur",
                desc: "Invited to deliver sessions on innovation-driven thinking and applied technology development for transforming academic ideas into deployable products.",
                badge: "Expert Speaker",
                image: ""
            },
            {
                id: "ach-5",
                title: "Central India Hackathon Judge",
                desc: "Acted as a judge evaluating projects across multiple technical domains on design quality, scalability, and real-world relevance.",
                badge: "Hackathon Judge",
                image: ""
            }
        ];
        localStorage.setItem('portfolio_achievements', JSON.stringify(defaultAchievements));
    }
}

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
        }
    });
}, { threshold: 0.1 });

function applyScrollReveal() {
    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach(el => revealObserver.observe(el));
}

function renderProjects() {
    const gridEl = document.getElementById('projects-grid');
    if (!gridEl) return;
    
    const projects = JSON.parse(localStorage.getItem('portfolio_projects')) || [];
    
    const categoryIconMap = {
        industrial: "fa-solid fa-industry project-type-icon",
        ai: "fa-solid fa-video project-type-icon",
        embedded: "fa-solid fa-microchip project-type-icon"
    };
    
    const categoryLabelMap = {
        industrial: "Industrial IoT",
        ai: "AI & Surveillance",
        embedded: "Smart Devices"
    };
    
    gridEl.innerHTML = projects.map(p => `
        <div class="project-card scroll-reveal" data-category="${p.category}">
            <div class="project-image-placeholder">
                ${p.image ? `<img src="${p.image}" alt="${p.title}" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0;">` : `<i class="${categoryIconMap[p.category] || 'fa-solid fa-code project-type-icon'}"></i>`}
                <span class="project-tag">${categoryLabelMap[p.category] || p.category}</span>
            </div>
            <div class="project-info">
                <h3 class="project-card-title">${p.title}</h3>
                <p class="project-card-desc">${p.bullets && p.bullets[0] ? p.bullets[0] : ''}</p>
                <div class="project-tech-tags">
                    ${p.tech ? p.tech.map(t => `<span>${t}</span>`).join('') : ''}
                </div>
                <button class="btn btn-secondary open-project-modal" data-project="${p.id}">View Details</button>
            </div>
        </div>
    `).join('');
    
    applyScrollReveal();
}

function renderAchievements() {
    const gridEl = document.getElementById('achievements-grid');
    if (!gridEl) return;
    
    const achievements = JSON.parse(localStorage.getItem('portfolio_achievements')) || [];
    
    gridEl.innerHTML = achievements.map(a => `
        <div class="achievement-card bento-card scroll-reveal">
            <div class="achievement-image-container">
                ${a.image ? `<img src="${a.image}" alt="${a.title}" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0;">` : `
                    <div class="achievement-img-placeholder">
                        <i class="fa-solid fa-trophy placeholder-icon"></i>
                        <span class="placeholder-text">YOGESH MENE</span>
                    </div>
                `}
            </div>
            <div class="achievement-info">
                <div class="achievement-badge">
                    <i class="fa-solid fa-award"></i>
                    <span>${a.badge}</span>
                </div>
                <h3 class="achievement-title">${a.title}</h3>
                <p class="achievement-desc">${a.desc}</p>
            </div>
        </div>
    `).join('');
    
    applyScrollReveal();
}

// Bind dynamic event delegation for projects modal view details buttons
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.open-project-modal');
    if (btn) {
        const projId = btn.getAttribute('data-project');
        const projects = JSON.parse(localStorage.getItem('portfolio_projects')) || [];
        const data = projects.find(p => p.id === projId);
        
        if (data) {
            const modalContent = document.getElementById('modal-content');
            if (modalContent) {
                const categoryLabelMap = {
                    industrial: "Industrial IoT",
                    ai: "AI & Surveillance",
                    embedded: "Smart Devices"
                };
                
                let bulletsHtml = data.bullets ? data.bullets.map(bullet => `<li>${bullet}</li>`).join('') : '';
                let tagsHtml = data.tech ? data.tech.map(t => `<span>${t}</span>`).join('') : '';
                
                modalContent.innerHTML = `
                    <span class="modal-header-tag">${categoryLabelMap[data.category] || data.category}</span>
                    <h3 class="modal-title">${data.title}</h3>
                    
                    <h4 class="modal-section-title">Key Contributions & Results</h4>
                    <ul class="modal-bullets-list">
                        ${bulletsHtml}
                    </ul>
                    
                    <h4 class="modal-section-title">Technologies & Hardware</h4>
                    <div class="modal-tags">
                        ${tagsHtml}
                    </div>
                `;
                
                const modalEl = document.getElementById('project-modal');
                if (modalEl) {
                    modalEl.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            }
        }
    }
});

function initAdminConsole() {
    const loginLink = document.getElementById('admin-login-link');
    const loginModal = document.getElementById('admin-login-modal');
    const loginClose = document.getElementById('admin-login-close');
    const passwordInput = document.getElementById('admin-password');
    const validateBtn = document.getElementById('submit-admin-btn');
    const errorMsg = document.getElementById('admin-error-msg');
    
    const dashboardModal = document.getElementById('admin-dashboard-modal');
    const closeDashboardBtn = document.getElementById('close-admin-btn');
    
    const tabProjBtn = document.getElementById('tab-projects-btn');
    const tabAchBtn = document.getElementById('tab-achievements-btn');
    const tabMsgBtn = document.getElementById('tab-messages-btn');
    const panelProj = document.getElementById('panel-projects');
    const panelAch = document.getElementById('panel-achievements');
    const panelMsg = document.getElementById('panel-messages');
    const refreshMsgBtn = document.getElementById('refresh-messages-btn');
    
    const addProjBtn = document.getElementById('add-project-btn');
    const addAchBtn = document.getElementById('add-achievement-btn');
    
    if (loginLink && loginModal) {
        loginLink.addEventListener('click', () => {
            passwordInput.value = '';
            errorMsg.textContent = '';
            loginModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (loginClose) {
        loginClose.addEventListener('click', () => {
            loginModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    if (validateBtn) {
        validateBtn.addEventListener('click', () => {
            if (passwordInput.value === 'spidey123') {
                loginModal.classList.remove('active');
                dashboardModal.classList.add('active');
                renderProjectsManager();
                renderAchievementsManager();
                renderMessagesManager();
            } else {
                errorMsg.textContent = 'ACCESS DENIED: INVALID QUANTUM KEY';
            }
        });
    }
    
    if (passwordInput && validateBtn) {
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') validateBtn.click();
        });
    }
    
    if (closeDashboardBtn) {
        closeDashboardBtn.addEventListener('click', () => {
            dashboardModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    if (tabProjBtn && tabAchBtn && tabMsgBtn) {
        tabProjBtn.addEventListener('click', () => {
            tabProjBtn.classList.add('active');
            tabAchBtn.classList.remove('active');
            tabMsgBtn.classList.remove('active');
            panelProj.classList.add('active');
            panelAch.classList.remove('active');
            panelMsg.classList.remove('active');
        });
        
        tabAchBtn.addEventListener('click', () => {
            tabAchBtn.classList.add('active');
            tabProjBtn.classList.remove('active');
            tabMsgBtn.classList.remove('active');
            panelAch.classList.add('active');
            panelProj.classList.remove('active');
            panelMsg.classList.remove('active');
        });

        tabMsgBtn.addEventListener('click', () => {
            tabMsgBtn.classList.add('active');
            tabProjBtn.classList.remove('active');
            tabAchBtn.classList.remove('active');
            panelMsg.classList.add('active');
            panelProj.classList.remove('active');
            panelAch.classList.remove('active');
            renderMessagesManager();
        });
    }
    
    if (refreshMsgBtn) {
        refreshMsgBtn.addEventListener('click', () => {
            renderMessagesManager();
        });
    }
    
    if (addProjBtn) {
        addProjBtn.addEventListener('click', () => openRecordForm('project', 'add'));
    }
    if (addAchBtn) {
        addAchBtn.addEventListener('click', () => openRecordForm('achievement', 'add'));
    }
    
    const formCloseBtn = document.getElementById('form-close');
    if (formCloseBtn) {
        formCloseBtn.addEventListener('click', () => {
            document.getElementById('form-modal').classList.remove('active');
        });
    }
}


function renderProjectsManager() {
    const listEl = document.getElementById('projects-manager-list');
    if (!listEl) return;
    const projects = JSON.parse(localStorage.getItem('portfolio_projects')) || [];
    
    if (projects.length === 0) {
        listEl.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:20px;">No projects found.</p>`;
        return;
    }
    
    listEl.innerHTML = projects.map(p => `
        <div class="manager-item">
            <div class="item-meta">
                <div class="item-img-preview">
                    ${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;border-radius:4px;">` : `<i class="fa-solid fa-code"></i>`}
                </div>
                <div class="item-text">
                    <h5>${p.title}</h5>
                    <p>${p.category.toUpperCase()}</p>
                </div>
            </div>
            <div class="item-controls">
                <button class="game-btn edit-proj-btn" data-id="${p.id}">EDIT</button>
                <button class="game-btn secondary delete-proj-btn" data-id="${p.id}">DELETE</button>
            </div>
        </div>
    `).join('');
    
    listEl.querySelectorAll('.edit-proj-btn').forEach(btn => {
        btn.addEventListener('click', () => openRecordForm('project', 'edit', btn.getAttribute('data-id')));
    });
    listEl.querySelectorAll('.delete-proj-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm("Are you sure you want to delete this project?")) {
                const id = btn.getAttribute('data-id');
                const updated = projects.filter(p => p.id !== id);
                localStorage.setItem('portfolio_projects', JSON.stringify(updated));
                renderProjects();
                renderProjectsManager();
            }
        });
    });
}

function renderAchievementsManager() {
    const listEl = document.getElementById('achievements-manager-list');
    if (!listEl) return;
    const achievements = JSON.parse(localStorage.getItem('portfolio_achievements')) || [];
    
    if (achievements.length === 0) {
        listEl.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:20px;">No achievements found.</p>`;
        return;
    }
    
    listEl.innerHTML = achievements.map(a => `
        <div class="manager-item">
            <div class="item-meta">
                <div class="item-img-preview">
                    ${a.image ? `<img src="${a.image}" style="width:100%;height:100%;object-fit:cover;border-radius:4px;">` : `<i class="fa-solid fa-trophy"></i>`}
                </div>
                <div class="item-text">
                    <h5>${a.title}</h5>
                    <p>${a.badge.toUpperCase()}</p>
                </div>
            </div>
            <div class="item-controls">
                <button class="game-btn edit-ach-btn" data-id="${a.id}">EDIT</button>
                <button class="game-btn secondary delete-ach-btn" data-id="${a.id}">DELETE</button>
            </div>
        </div>
    `).join('');
    
    listEl.querySelectorAll('.edit-ach-btn').forEach(btn => {
        btn.addEventListener('click', () => openRecordForm('achievement', 'edit', btn.getAttribute('data-id')));
    });
    listEl.querySelectorAll('.delete-ach-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm("Are you sure you want to delete this achievement?")) {
                const id = btn.getAttribute('data-id');
                const updated = achievements.filter(ach => ach.id !== id);
                localStorage.setItem('portfolio_achievements', JSON.stringify(updated));
                renderAchievements();
                renderAchievementsManager();
            }
        });
    });
}

function renderMessagesManager() {
    const listEl = document.getElementById('messages-manager-list');
    if (!listEl) return;
    
    listEl.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Retrieving messages from system console...</p>`;
    
    fetch('/api/messages')
        .then(response => {
            if (!response.ok) {
                throw new Error('Server responded with status: ' + response.status);
            }
            return response.json();
        })
        .then(messages => {
            if (messages.length === 0) {
                listEl.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:20px;">No messages received yet.</p>`;
                return;
            }
            
            listEl.innerHTML = messages.map(m => `
                <div class="manager-item message-item" style="flex-direction: column; align-items: stretch; gap: 12px; padding: 20px; margin-bottom: 15px; background: rgba(255, 255, 255, 0.01); border: 1px solid var(--card-border); border-radius: var(--border-radius-sm);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <h5 style="margin: 0; font-size: 15px; color: var(--text-white); font-weight: 600;">${escapeHTML(m.name)}</h5>
                            <p style="margin: 2px 0 0 0; font-size: 13px; color: var(--accent-cyan);"><a href="mailto:${m.email}" style="color: inherit; text-decoration: underline;">${escapeHTML(m.email)}</a></p>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 11px; color: var(--text-dark);">${new Date(m.timestamp).toLocaleString()}</span>
                        </div>
                    </div>
                    <div style="border-top: 1px solid var(--card-border); padding-top: 10px; margin-top: 5px;">
                        <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 13px; color: var(--text-white); text-transform: uppercase; letter-spacing: 0.5px;">Subject: ${escapeHTML(m.subject)}</p>
                        <p style="margin: 0; font-size: 13px; color: var(--text-muted); white-space: pre-wrap; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 4px; border-left: 3px solid var(--accent-cyan); line-height: 1.4; font-family: var(--font-body);">${escapeHTML(m.message)}</p>
                    </div>
                    <div style="display: flex; justify-content: flex-end; margin-top: 5px;">
                        <button class="game-btn secondary delete-msg-btn" data-id="${m.id}" style="padding: 6px 14px; font-size: 11px; font-family: var(--font-heading);">DISMISS MESSAGE</button>
                    </div>
                </div>
            `).join('');
            
            listEl.querySelectorAll('.delete-msg-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    if (confirm("Are you sure you want to dismiss this message?")) {
                        btn.disabled = true;
                        btn.textContent = "DISMISSING...";
                        fetch(`/api/messages/${id}`, {
                            method: 'DELETE'
                        })
                        .then(res => {
                            if (!res.ok) throw new Error('Failed to delete');
                            renderMessagesManager();
                        })
                        .catch(err => {
                            console.error(err);
                            alert("Failed to delete message from server.");
                            btn.disabled = false;
                            btn.textContent = "DISMISS MESSAGE";
                        });
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error loading messages from backend:', error);
            listEl.innerHTML = `
                <div style="text-align: center; padding: 30px 20px; background: rgba(255, 59, 48, 0.05); border: 1px dashed rgba(255, 59, 48, 0.3); border-radius: var(--border-radius-sm);">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; color: var(--danger-red); margin-bottom: 10px;"></i>
                    <h5 style="color: var(--text-white); margin-bottom: 6px;">Backend Connection Offline</h5>
                    <p style="color: var(--text-muted); font-size: 13px; max-width: 400px; margin: 0 auto 15px auto;">The messages console requires the Node.js/Express backend server to be running.</p>
                    <code style="display: inline-block; background: rgba(0,0,0,0.4); padding: 6px 12px; border-radius: 4px; font-size: 11px; color: var(--accent-cyan); font-family: var(--font-code);">npm run dev</code>
                </div>
            `;
        });
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function openRecordForm(type, action, recordId = null) {
    const form = document.getElementById('record-form');
    const titleEl = document.getElementById('form-title');
    if (!form || !titleEl) return;
    
    const projects = JSON.parse(localStorage.getItem('portfolio_projects')) || [];
    const achievements = JSON.parse(localStorage.getItem('portfolio_achievements')) || [];
    
    let record = null;
    if (action === 'edit' && recordId) {
        if (type === 'project') record = projects.find(p => p.id === recordId);
        else record = achievements.find(a => a.id === recordId);
    }
    
    titleEl.textContent = `${action === 'edit' ? 'EDIT' : 'ADD NEW'} ${type.toUpperCase()}`;
    
    let html = '';
    if (type === 'project') {
        html = `
            <div class="form-group-admin">
                <label for="proj-title">PROJECT TITLE</label>
                <input type="text" id="proj-title" value="${record ? record.title : ''}" required placeholder="e.g. Smart Telemetry Hub">
            </div>
            <div class="form-group-admin">
                <label for="proj-category">CATEGORY</label>
                <select id="proj-category" required>
                    <option value="industrial" ${record && record.category === 'industrial' ? 'selected' : ''}>Industrial IoT</option>
                    <option value="ai" ${record && record.category === 'ai' ? 'selected' : ''}>AI & Surveillance</option>
                    <option value="embedded" ${record && record.category === 'embedded' ? 'selected' : ''}>Smart Devices</option>
                </select>
            </div>
            <div class="form-group-admin">
                <label for="proj-bullets">BULLETS (One per line)</label>
                <textarea id="proj-bullets" required placeholder="Line 1: Led development...&#10;Line 2: Integrated with system...">${record ? record.bullets.join('\n') : ''}</textarea>
            </div>
            <div class="form-group-admin">
                <label for="proj-tech">TECH TAGS (Comma separated)</label>
                <input type="text" id="proj-tech" value="${record ? record.tech.join(', ') : ''}" placeholder="e.g. ESP32, Python, MQTT">
            </div>
            <div class="form-group-admin">
                <label for="proj-image">PROJECT IMAGE</label>
                <div class="custom-file-input">
                    <input type="file" id="proj-image" accept="image/*">
                    <img id="proj-img-preview" class="file-preview-thumbnail" src="${record && record.image ? record.image : ''}" style="${record && record.image ? 'display:block;' : 'display:none;'}">
                </div>
            </div>
        `;
    } else {
        html = `
            <div class="form-group-admin">
                <label for="ach-title">ACHIEVEMENT TITLE</label>
                <input type="text" id="ach-title" value="${record ? record.title : ''}" required placeholder="e.g. National IoT Award">
            </div>
            <div class="form-group-admin">
                <label for="ach-desc">DESCRIPTION</label>
                <textarea id="ach-desc" required placeholder="Describe the achievement details...">${record ? record.desc : ''}</textarea>
            </div>
            <div class="form-group-admin">
                <label for="ach-badge">BADGE / RECOGNITION</label>
                <input type="text" id="ach-badge" value="${record ? record.badge : ''}" required placeholder="e.g. ORGANIZATIONAL EXCELLENCE">
            </div>
            <div class="form-group-admin">
                <label for="ach-image">ACHIEVEMENT IMAGE</label>
                <div class="custom-file-input">
                    <input type="file" id="ach-image" accept="image/*">
                    <img id="ach-img-preview" class="file-preview-thumbnail" src="${record && record.image ? record.image : ''}" style="${record && record.image ? 'display:block;' : 'display:none;'}">
                </div>
            </div>
        `;
    }
    
    html += `
        <div class="form-actions-admin">
            <button type="button" class="game-btn secondary" id="cancel-form-btn">CANCEL</button>
            <button type="submit" class="game-btn">SAVE RECORD</button>
        </div>
    `;
    
    form.innerHTML = html;
    
    const fileInput = document.getElementById(type === 'project' ? 'proj-image' : 'ach-image');
    const imgPreview = document.getElementById(type === 'project' ? 'proj-img-preview' : 'ach-img-preview');
    let base64Image = record ? record.image : '';
    
    if (fileInput && imgPreview) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    base64Image = event.target.result;
                    imgPreview.src = base64Image;
                    imgPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    const cancelBtn = document.getElementById('cancel-form-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('form-modal').classList.remove('active');
        });
    }
    
    form.onsubmit = (e) => {
        e.preventDefault();
        
        if (type === 'project') {
            const title = document.getElementById('proj-title').value.trim();
            const category = document.getElementById('proj-category').value;
            const bullets = document.getElementById('proj-bullets').value.split('\n').map(b => b.trim()).filter(b => b);
            const tech = document.getElementById('proj-tech').value.split(',').map(t => t.trim()).filter(t => t);
            
            if (action === 'add') {
                const newProj = {
                    id: 'proj-' + Date.now(),
                    title, category, bullets, tech, image: base64Image
                };
                projects.push(newProj);
            } else {
                const pIndex = projects.findIndex(p => p.id === recordId);
                if (pIndex > -1) {
                    projects[pIndex] = { ...projects[pIndex], title, category, bullets, tech, image: base64Image };
                }
            }
            localStorage.setItem('portfolio_projects', JSON.stringify(projects));
            renderProjects();
            renderProjectsManager();
        } else {
            const title = document.getElementById('ach-title').value.trim();
            const desc = document.getElementById('ach-desc').value.trim();
            const badge = document.getElementById('ach-badge').value.trim();
            
            if (action === 'add') {
                const newAch = {
                    id: 'ach-' + Date.now(),
                    title, desc, badge, image: base64Image
                };
                achievements.push(newAch);
            } else {
                const aIndex = achievements.findIndex(a => a.id === recordId);
                if (aIndex > -1) {
                    achievements[aIndex] = { ...achievements[aIndex], title, desc, badge, image: base64Image };
                }
            }
            localStorage.setItem('portfolio_achievements', JSON.stringify(achievements));
            renderAchievements();
            renderAchievementsManager();
        }
        
        document.getElementById('form-modal').classList.remove('active');
    };
    
    document.getElementById('form-modal').classList.add('active');
}

/* ==========================================================================
   SPIDEY TARGET PRACTICE GAME LOOP CLASS
   ========================================================================== */

class SpideyTargetPracticeGame {
    constructor() {
        this.modal = document.getElementById('game-modal');
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.startButton = document.getElementById('start-game-btn');
        this.startOverlay = document.getElementById('game-start-overlay');
        this.closeButton = document.getElementById('game-close');
        
        this.scoreEl = document.getElementById('game-score');
        this.timeEl = document.getElementById('game-time');
        this.highscoreEl = document.getElementById('game-highscore');
        
        this.score = 0;
        this.highscore = parseInt(localStorage.getItem('spidey_game_highscore')) || 0;
        this.timeRemaining = 30;
        this.isPlaying = false;
        
        this.spiders = [];
        this.gameInterval = null;
        this.timerInterval = null;
        this.shots = []; 
        this.particles = []; 
        
        this.init();
    }
    
    init() {
        if (this.highscoreEl) this.highscoreEl.textContent = this.highscore;
        
        if (this.startButton) {
            this.startButton.addEventListener('click', () => this.startGame());
        }
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.stopGame());
        }
        
        this.canvas.addEventListener('mousedown', (e) => this.handleShoot(e));
        
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        if (this.canvas) {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        }
    }
    
    startGame() {
        this.resizeCanvas();
        this.score = 0;
        this.timeRemaining = 30;
        this.spiders = [];
        this.shots = [];
        this.particles = [];
        this.isPlaying = true;
        
        if (this.scoreEl) this.scoreEl.textContent = this.score;
        if (this.timeEl) this.timeEl.textContent = this.timeRemaining;
        
        if (this.startOverlay) this.startOverlay.style.display = 'none';
        
        this.spawnSpiders();
        
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            if (this.timeEl) this.timeEl.textContent = this.timeRemaining;
            if (this.timeRemaining <= 0) {
                this.endGame();
            }
        }, 1000);
        
        this.loop();
    }
    
    spawnSpiders() {
        const count = 5;
        for (let i = 0; i < count; i++) {
            this.spiders.push(this.createSpider());
        }
    }
    
    createSpider() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        return {
            x: Math.random() * (w - 60) + 30,
            y: Math.random() * (h - 100) + 50,
            vx: (Math.random() - 0.5) * 2.5,
            vy: (Math.random() - 0.5) * 2.5,
            size: 15 + Math.random() * 10,
            angle: Math.random() * Math.PI * 2,
            type: Math.random() < 0.25 ? 'gold' : 'robotic', 
            health: 1
        };
    }
    
    handleShoot(e) {
        if (!this.isPlaying) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        this.playShootSound();
        
        this.shots.push({
            startX: this.canvas.width / 2,
            startY: this.canvas.height,
            endX: clickX,
            endY: clickY,
            life: 1.0,
            decay: 0.08
        });
        
        let hit = false;
        for (let i = this.spiders.length - 1; i >= 0; i--) {
            const spider = this.spiders[i];
            const dist = Math.hypot(spider.x - clickX, spider.y - clickY);
            if (dist < spider.size + 15) {
                hit = true;
                const points = spider.type === 'gold' ? 20 : 10;
                this.score += points;
                if (this.scoreEl) this.scoreEl.textContent = this.score;
                
                this.spawnParticles(spider.x, spider.y, spider.type === 'gold' ? '#f1c40f' : '#ff3b30');
                
                this.spiders.splice(i, 1);
                setTimeout(() => {
                    if (this.isPlaying) this.spiders.push(this.createSpider());
                }, 400);
            }
        }
    }
    
    playShootSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            const now = audioCtx.currentTime;
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            
            osc.start(now);
            osc.stop(now + 0.12);
        } catch(e) {}
    }
    
    spawnParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                alpha: 1,
                decay: 0.04 + Math.random() * 0.02,
                color
            });
        }
    }
    
    endGame() {
        this.isPlaying = false;
        clearInterval(this.timerInterval);
        
        if (this.score > this.highscore) {
            this.highscore = this.score;
            localStorage.setItem('spidey_game_highscore', this.highscore);
            if (this.highscoreEl) this.highscoreEl.textContent = this.highscore;
        }
        
        if (this.startOverlay) {
            this.startOverlay.style.display = 'flex';
            this.startOverlay.querySelector('h2').textContent = 'SIMULATION COMPLETE';
            this.startOverlay.querySelector('p').innerHTML = `Final score: <strong style="color:#00f0ff;font-size:1.4rem;">${this.score}</strong><br>High Score: ${this.highscore}`;
            this.startOverlay.querySelector('#start-game-btn').textContent = 'RESTART SYSTEM';
        }
        
        try {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
                const text = this.score > 30 ? "Spectacular job! You saved the database!" : "Good effort. Try again to beat your high score!";
                const utterance = new SpeechSynthesisUtterance(text);
                
                const voices = window.speechSynthesis.getVoices();
                const tomVoice = _getTomHollandVoice(voices);
                if (tomVoice) {
                    utterance.voice = tomVoice;
                }
                
                // Adjust speech parameters to match Tom Holland's character
                utterance.pitch = 1.15;
                utterance.rate = 1.08;
                utterance.volume = 0.85;
                
                window.speechSynthesis.speak(utterance);
            }
        } catch (e) {}
    }
    
    stopGame() {
        this.isPlaying = false;
        clearInterval(this.timerInterval);
        if (this.modal) this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    drawSpider(spider) {
        const ctx = this.ctx;
        const x = spider.x;
        const y = spider.y;
        const s = spider.size;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(spider.angle);
        
        const color = spider.type === 'gold' ? '#f1c40f' : '#ff3b30';
        ctx.strokeStyle = spider.type === 'gold' ? '#d35400' : '#4a0e17';
        ctx.lineWidth = s * 0.08;
        const legOffsets = [-0.4, -0.15, 0.15, 0.4];
        legOffsets.forEach(offset => {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-s * 0.8, offset * s - s*0.2, -s * 1.2, offset * s + s * 0.2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(s * 0.8, offset * s - s*0.2, s * 1.2, offset * s + s * 0.2);
            ctx.stroke();
        });
        
        ctx.beginPath();
        ctx.ellipse(0, s * 0.3, s * 0.45, s * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = spider.type === 'gold' ? '#fff' : '#000';
        ctx.beginPath();
        ctx.moveTo(-s*0.1, s*0.2);
        ctx.lineTo(s*0.1, s*0.2);
        ctx.lineTo(0, s*0.35);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-s*0.1, s*0.5);
        ctx.lineTo(s*0.1, s*0.5);
        ctx.lineTo(0, s*0.35);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(0, -s * 0.2, s * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = spider.type === 'gold' ? '#b7950b' : '#922b21';
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-s * 0.1, -s * 0.25, s * 0.06, 0, Math.PI * 2);
        ctx.arc(s * 0.1, -s * 0.25, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    loop() {
        if (!this.isPlaying) return;
        
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.spiders.forEach(spider => {
            spider.x += spider.vx;
            spider.y += spider.vy;
            
            if (Math.random() < 0.02) {
                spider.vx += (Math.random() - 0.5) * 1.5;
                spider.vy += (Math.random() - 0.5) * 1.5;
                
                const speed = Math.hypot(spider.vx, spider.vy);
                if (speed > 3.5) {
                    spider.vx = (spider.vx / speed) * 3.5;
                    spider.vy = (spider.vy / speed) * 3.5;
                }
            }
            
            if (spider.x < 20 || spider.x > this.canvas.width - 20) {
                spider.vx *= -1;
                spider.x = spider.x < 20 ? 20 : this.canvas.width - 20;
            }
            if (spider.y < 20 || spider.y > this.canvas.height - 20) {
                spider.vy *= -1;
                spider.y = spider.y < 20 ? 20 : this.canvas.height - 20;
            }
            
            spider.angle = Math.atan2(spider.vy, spider.vx) - Math.PI / 2;
            
            this.drawSpider(spider);
        });
        
        for (let i = this.shots.length - 1; i >= 0; i--) {
            const shot = this.shots[i];
            shot.life -= shot.decay;
            if (shot.life <= 0) {
                this.shots.splice(i, 1);
            } else {
                ctx.save();
                ctx.strokeStyle = `rgba(255, 255, 255, ${shot.life})`;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(shot.startX, shot.startY);
                ctx.lineTo(shot.endX, shot.endY);
                ctx.stroke();
                
                ctx.strokeStyle = `rgba(0, 240, 255, ${shot.life * 0.3})`;
                ctx.lineWidth = 6;
                ctx.stroke();
                ctx.restore();
            }
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            } else {
                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        
        requestAnimationFrame(() => this.loop());
    }
}

