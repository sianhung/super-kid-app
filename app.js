/* =====================================================================
   SUPER KID APP - REACTIVE ENGINE & GAMEPLAY LOGIC (ES6 JS)
   localStorage State Store, Canvas FX Particles, Audio Sim, Rewards Loop
   ===================================================================== */

// --- 1. LOCAL DATA SEED (Fallback Database Simulation) ---
const MOCK_EPISODES = [
    {
        id: 'e1c12e87-0b1a-48d6-848e-653ea956bc01',
        title: 'Journey to the Bubble Planet!',
        youtube_video_id: 'R9K2Sj76L38',
        thumbnail_url: 'assets/episode1.png',
        order_index: 1,
        description: 'Travel with Gizmo through the magical bubble portal and learn about the miraculous power of God\'s love!'
    },
    {
        id: 'e2c23f88-1c2b-49e7-959f-764fb067cd02',
        title: 'The Rainbow Jellyfish Chase',
        youtube_video_id: 'JtV_n6dMh_s',
        thumbnail_url: 'assets/episode2.png',
        order_index: 2,
        description: 'Chase the beautiful rainbow jellyfish across the cosmic ocean and discover why sharing brings joy!'
    },
    {
        id: 'e3c34a99-2d3c-4bf8-a6af-875fc178de03',
        title: 'Mystery of the Floating Candies',
        youtube_video_id: 'rC78Q7kYdDk',
        thumbnail_url: 'assets/episode3.png',
        order_index: 3,
        description: 'Solve the mysterious floating candies phenomenon while uncovering the secrets of kind hearts and sweet friendship!'
    }
];

const MOCK_CONTESTS = [
    {
        id: 'c1c12e87-0b1a-48d6-848e-653ea956bc01',
        title: 'Gizmo Space Drawing Contest!',
        description: 'Draw Gizmo exploring a futuristic planet filled with candy volcanos and glowing cyber-jellyfish! Submit your drawing transmission to earn points.',
        thumbnail_url: 'assets/mascot.png',
        points_reward: 200
    },
    {
        id: 'c2c23f88-1c2b-49e7-959f-764fb067cd02',
        title: 'Daily Verse Recitation Challenge',
        description: 'Record or type your best recitation of the weekly spaceship scripture: "For God did not give us a spirit of cowardice, but rather of power and love and self-control" (2 Timothy 1:7).',
        thumbnail_url: 'assets/crown.png',
        points_reward: 200
    }
];

const MOCK_QUIZZES = [
    {
        episode_id: 'e1c12e87-0b1a-48d6-848e-653ea956bc01',
        questions: [
            {
                question_text: 'What was the name of the main robot companion?',
                options: ['Gizmo', 'Robo', 'Sparky', 'Bolt'],
                correct_option_index: 0,
                coin_reward: 50
            },
            {
                question_text: 'What do you earn when you finish a challenge?',
                options: ['SuperPoints', 'Gold Bars', 'Trophies', 'Stickers'],
                correct_option_index: 0,
                coin_reward: 50
            }
        ]
    },
    {
        episode_id: 'e2c23f88-1c2b-49e7-959f-764fb067cd02',
        questions: [
            {
                question_text: 'What was the name of the main robot companion?',
                options: ['Gizmo', 'Robo', 'Sparky', 'Bolt'],
                correct_option_index: 0,
                coin_reward: 50
            }
        ]
    },
    {
        episode_id: 'e3c34a99-2d3c-4bf8-a6af-875fc178de03',
        questions: [
            {
                question_text: 'What do you earn when you finish a challenge?',
                options: ['SuperPoints', 'Gold Bars', 'Trophies', 'Stickers'],
                correct_option_index: 0,
                coin_reward: 50
            }
        ]
    }
];

const SHOP_ITEMS = [
    {
        id: 'cyber_visor',
        title: 'Cyber Visor',
        cost: 50,
        img: 'assets/visor.png'
    },
    {
        id: 'plasma_jetpack',
        title: 'Plasma Jetpack',
        cost: 100,
        img: 'assets/jetpack.png'
    }
];

// --- 2. STATE OBJECT (Central Reactive Data) ---
class AppState {
    constructor() {
        this.loadOrCreateState();
    }

    loadOrCreateState() {
        const storedUser = localStorage.getItem('superkid_user');
        const storedOwned = localStorage.getItem('superkid_owned');
        
        if (storedUser) {
            this.user = JSON.parse(storedUser);
        } else {
            this.user = {
                id: 'd8c2278e-6d1a-4c28-98e3-0d3a776c5b96',
                display_name: 'Leo Starry',
                star_coins: 0,
                avatar_custom_data: { equipped_gear: null },
                unlocked_index: 1 // Start at episode index 1
            };
            this.saveUser();
        }

        if (storedOwned) {
            this.ownedItems = JSON.parse(storedOwned);
        } else {
            this.ownedItems = [];
            this.saveOwned();
        }

        const storedEpisodes = localStorage.getItem('superkid_episodes');
        if (storedEpisodes) {
            this.episodes = JSON.parse(storedEpisodes);
        } else {
            this.episodes = MOCK_EPISODES;
            this.saveEpisodes();
        }

        const storedQuizzes = localStorage.getItem('superkid_quizzes');
        if (storedQuizzes) {
            this.quizzes = JSON.parse(storedQuizzes);
        } else {
            this.quizzes = MOCK_QUIZZES;
            this.saveQuizzes();
        }

        const storedContests = localStorage.getItem('superkid_contests');
        if (storedContests) {
            this.contests = JSON.parse(storedContests);
        } else {
            this.contests = MOCK_CONTESTS;
            this.saveContests();
        }

        this.shopItems = SHOP_ITEMS;

        const storedSubmissions = localStorage.getItem('superkid_submissions');
        if (storedSubmissions) {
            this.submissions = JSON.parse(storedSubmissions);
        } else {
            this.submissions = [];
            this.saveSubmissions();
        }

        const storedAdminAuth = localStorage.getItem('superkid_admin_auth');
        this.isAdminLoggedIn = storedAdminAuth === 'true';
        
        // Non-persisted UI states
        this.currentScreen = 'dashboard';
        this.activeEpisode = null;
        this.activeQuizIndex = 0;
        this.activeQuizScore = 0;
        this.activeQuizTotalCoins = 0;
        this.activeContestId = null;
        this.selectedFile = null;
    }

    saveUser() {
        localStorage.setItem('superkid_user', JSON.stringify(this.user));
    }

    saveOwned() {
        localStorage.setItem('superkid_owned', JSON.stringify(this.ownedItems));
    }

    saveSubmissions() {
        localStorage.setItem('superkid_submissions', JSON.stringify(this.submissions));
    }

    saveEpisodes() {
        localStorage.setItem('superkid_episodes', JSON.stringify(this.episodes));
    }

    saveQuizzes() {
        localStorage.setItem('superkid_quizzes', JSON.stringify(this.quizzes));
    }

    saveContests() {
        localStorage.setItem('superkid_contests', JSON.stringify(this.contests));
    }

    saveAdminAuth() {
        localStorage.setItem('superkid_admin_auth', this.isAdminLoggedIn ? 'true' : 'false');
    }

    // RPC Simulation: Increment Coins
    incrementCoins(amount) {
        const startCoins = this.user.star_coins;
        this.user.star_coins += amount;
        this.saveUser();
        
        const box = document.getElementById('star-coin-counter-box');
        const label = document.getElementById('star-coin-label');
        
        let targetX = window.innerWidth - 80;
        let targetY = 30;
        
        if (box) {
            const rect = box.getBoundingClientRect();
            targetX = rect.left + rect.width / 2;
            targetY = rect.top + rect.height / 2;
        }
        
        // Spawn 12 gorgeous flying star coins
        const particleCount = 12;
        let coinsLanded = 0;
        
        for (let i = 0; i < particleCount; i++) {
            // Slight delay for each coin to create a beautiful flying trail effect
            setTimeout(() => {
                particles.push(new FlyingCoin(
                    lastClickX + (Math.random() - 0.5) * 30,
                    lastClickY + (Math.random() - 0.5) * 30,
                    targetX,
                    targetY,
                    () => {
                        coinsLanded++;
                        
                        // Increment score label incrementally!
                        const stepCoins = Math.round(startCoins + (amount * (coinsLanded / particleCount)));
                        if (label) label.textContent = stepCoins;
                        
                        // Trigger haptic spring bounce scale on points box
                        if (box) {
                            gsap.killTweensOf(box);
                            gsap.fromTo(box, 
                                { scale: 1 }, 
                                { scale: 1.25, duration: 0.1, ease: "power1.out", onComplete: () => {
                                    gsap.to(box, { scale: 1, duration: 0.25, ease: "elastic.out(1.2, 0.4)" });
                                }}
                            );
                        }
                        
                        // Spawn tiny splash particle pop at points box coordinate
                        for (let j = 0; j < 3; j++) {
                            particles.push(new Particle(
                                targetX + (Math.random() - 0.5) * 15,
                                targetY + (Math.random() - 0.5) * 15,
                                '#FFD000',
                                'star'
                            ));
                        }
                        startAnimationLoop();
                    }
                ));
                startAnimationLoop();
            }, i * 75); // Stagger coin launches by 75ms
        }
    }

    // RPC Simulation: Purchase Item
    purchaseItem(itemId, cost) {
        if (this.user.star_coins < cost) return false;
        
        this.user.star_coins -= cost;
        this.ownedItems.push(itemId);
        
        this.saveUser();
        this.saveOwned();
        
        // Refresh coin label
        const label = document.getElementById('star-coin-label');
        if (label) label.textContent = this.user.star_coins;
        
        return true;
    }

    // Equip accessory
    equipItem(itemId) {
        this.user.avatar_custom_data.equipped_gear = itemId;
        this.saveUser();
        renderEquippedGear();
    }
}

const state = new AppState();

// --- 3. CANVAS PARTICLES & CONFETTI ENGINE ---
const canvas = document.getElementById('fx-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animFrameId = null;

let lastClickX = window.innerWidth / 2;
let lastClickY = window.innerHeight / 2;

window.addEventListener('click', (e) => {
    lastClickX = e.clientX;
    lastClickY = e.clientY;
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor(x, y, color, type = 'star') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.radius = Math.random() * 8 + 4;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8 - 3;
        this.gravity = 0.15;
        this.alpha = 1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.alpha -= 0.02;
        this.rotation += this.rotSpeed;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;

        if (this.type === 'star') {
            // Draw a cute star vector
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * this.radius,
                           Math.sin((18 + i * 72) * Math.PI / 180) * this.radius);
                ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (this.radius / 2),
                           Math.sin((54 + i * 72) * Math.PI / 180) * (this.radius / 2));
            }
            ctx.closePath();
            ctx.fill();
        } else {
            // Bubble bubble particle
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fill();
        }
        ctx.restore();
    }
}

class Confetti {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.width = Math.random() * 12 + 6;
        this.height = Math.random() * 20 + 10;
        this.speedX = (Math.random() - 0.5) * 15;
        this.speedY = -Math.random() * 15 - 10;
        this.gravity = 0.3;
        this.alpha = 1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.3;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.alpha -= 0.01;
        this.rotation += this.rotSpeed;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    }
}

class FlyingCoin {
    constructor(startX, startY, targetX, targetY, callback) {
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.callback = callback;
        
        this.x = startX;
        this.y = startY;
        
        // Control point for a beautiful curved path arching upward
        const dx = targetX - startX;
        this.cpX = startX + dx * 0.3 + (Math.random() - 0.5) * 80;
        this.cpY = Math.min(startY, targetY) - 160 - Math.random() * 80;
        
        this.t = 0; // Curve progress from 0 to 1
        this.speed = Math.random() * 0.015 + 0.02; // Smooth travel speed
        
        this.radius = Math.random() * 6 + 10;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.15;
        this.alpha = 1;
        this.color = '#FFD000'; // Superbook gold yellow
    }

    update() {
        this.t += this.speed;
        if (this.t >= 1) {
            this.t = 1;
            this.alpha = 0;
            if (this.callback) {
                this.callback();
            }
        }
        
        // Quad Bezier curve equation
        const mt = 1 - this.t;
        this.x = mt * mt * this.startX + 2 * mt * this.t * this.cpX + this.t * this.t * this.targetX;
        this.y = mt * mt * this.startY + 2 * mt * this.t * this.cpY + this.t * this.t * this.targetY;
        
        this.rotation += this.rotSpeed;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Gold star coin vector draw
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#E8B800'; // Darker gold border
        ctx.lineWidth = 2.5;
        
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * this.radius,
                       Math.sin((18 + i * 72) * Math.PI / 180) * this.radius);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (this.radius / 2),
                       Math.sin((54 + i * 72) * Math.PI / 180) * (this.radius / 2));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw inner glowing ring
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }
}

// Particle Loop Animation
function startAnimationLoop() {
    if (animFrameId) return;
    
    function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles = particles.filter(p => p.alpha > 0);
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        if (particles.length > 0) {
            animFrameId = requestAnimationFrame(tick);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            animFrameId = null;
        }
    }
    
    animFrameId = requestAnimationFrame(tick);
}

// Particle bursts
function triggerBubblePopFX(x, y) {
    const colors = ['#fbc2eb', '#a18cd1', '#e2c2ff', '#ffd3e2', '#38bdf8', '#fbbf24'];
    for (let i = 0; i < 18; i++) {
        particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)], Math.random() > 0.5 ? 'star' : 'bubble'));
    }
    startAnimationLoop();
}

function triggerConfettiVictoryFX() {
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
    
    // Left burst
    for (let i = 0; i < 40; i++) {
        particles.push(new Confetti(50, canvas.height - 50, colors[Math.floor(Math.random() * colors.length)]));
    }
    
    // Right burst
    for (let i = 0; i < 40; i++) {
        particles.push(new Confetti(canvas.width - 50, canvas.height - 50, colors[Math.floor(Math.random() * colors.length)]));
    }
    
    startAnimationLoop();
}

// Global references for YouTube Player and timers
let ytPlayer = null;
let ytPollingInterval = null;
let editingEpisodeId = null;
let editingContestId = null;

function updateActiveTabs(screenId) {
    document.querySelectorAll('.main-nav .nav-tab').forEach(btn => {
        btn.classList.remove('active');
    });

    let activeTabId = null;
    if (screenId === 'home') {
        activeTabId = 'tab-home-btn';
    } else if (screenId === 'dashboard' || screenId === 'video') {
        activeTabId = 'tab-videos-btn';
    } else if (screenId === 'quizzes' || screenId === 'quiz') {
        activeTabId = 'tab-quizzes-btn';
    } else if (screenId === 'contests') {
        activeTabId = 'tab-contests-btn';
    } else if (screenId === 'settings' || screenId === 'shop' || screenId === 'admin') {
        activeTabId = 'tab-settings-btn';
    }

    if (activeTabId) {
        const btn = document.getElementById(activeTabId);
        if (btn) btn.classList.add('active');
    }
}

// --- 4. NAVIGATION & SCREEN MANAGER (Router) ---
// --- 4. NAVIGATION & SCREEN MANAGER (Router) ---
let currentActiveScreen = 'home';

const screenOrder = {
    'home': 0,
    'dashboard': 1,
    'video': 1.5,
    'quizzes': 2,
    'quiz': 2.5,
    'contests': 3,
    'settings': 4,
    'shop': 4.5,
    'admin': 4.8
};

function triggerInteriorAnimations(screenId) {
    if (screenId === 'home') {
        gsap.killTweensOf(['.home-hero-card', '.home-graphic-card']);
        gsap.fromTo('.home-hero-card', 
            { x: -80, opacity: 0 }, 
            { x: 0, opacity: 1, duration: 0.65, ease: "back.out(1.1)" }
        );
        gsap.fromTo('.home-graphic-card', 
            { x: 80, opacity: 0, scale: 0.8 }, 
            { x: 0, opacity: 1, scale: 1, duration: 0.65, ease: "back.out(1.1)" }
        );
    } else if (screenId === 'dashboard') {
        gsap.fromTo('.episode-banner-card', 
            { y: 55, opacity: 0, rotateY: 15 }, 
            { y: 0, opacity: 1, rotateY: 0, duration: 0.6, stagger: 0.08, ease: "back.out(1.2)", onComplete: () => {
                applyCardTilts();
                setupCarouselControls();
            }}
        );
    } else if (screenId === 'quizzes') {
        gsap.fromTo('.quiz-select-card', 
            { y: 50, opacity: 0, scale: 0.9 }, 
            { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.06, ease: "power2.out" }
        );
    } else if (screenId === 'shop') {
        gsap.fromTo('.prize-card', 
            { y: 50, opacity: 0, scale: 0.9 }, 
            { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.06, ease: "power2.out" }
        );
    } else if (screenId === 'contests') {
        gsap.fromTo('.contest-card', 
            { x: -50, opacity: 0 }, 
            { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" }
        );
    }
}

function setupCarouselControls() {
    const leftBtn = document.getElementById('carousel-prev-btn');
    const rightBtn = document.getElementById('carousel-next-btn');
    const container = document.getElementById('episodes-cards-container');
    
    if (leftBtn && rightBtn && container) {
        const newLeftBtn = leftBtn.cloneNode(true);
        const newRightBtn = rightBtn.cloneNode(true);
        leftBtn.parentNode.replaceChild(newLeftBtn, leftBtn);
        rightBtn.parentNode.replaceChild(newRightBtn, rightBtn);
        
        newLeftBtn.addEventListener('click', () => {
            container.scrollBy({ left: -340, behavior: 'smooth' });
            triggerBubblePopFX(window.innerWidth / 4, window.innerHeight / 2);
        });
        
        newRightBtn.addEventListener('click', () => {
            container.scrollBy({ left: 340, behavior: 'smooth' });
            triggerBubblePopFX(window.innerWidth * 3 / 4, window.innerHeight / 2);
        });
        
        function updateArrows() {
            const scrollLeft = container.scrollLeft;
            const maxScrollLeft = container.scrollWidth - container.clientWidth;
            
            newLeftBtn.style.opacity = scrollLeft <= 15 ? '0' : '1';
            newLeftBtn.style.pointerEvents = scrollLeft <= 15 ? 'none' : 'all';
            
            newRightBtn.style.opacity = scrollLeft >= maxScrollLeft - 15 ? '0' : '1';
            newRightBtn.style.pointerEvents = scrollLeft >= maxScrollLeft - 15 ? 'none' : 'all';
        }
        
        container.addEventListener('scroll', updateArrows);
        setTimeout(updateArrows, 150);
    }
}

function applyCardTilts() {
    document.querySelectorAll('.episode-banner-card:not(.locked)').forEach(card => {
        const orderIdx = parseInt(card.querySelector('.episode-number-label').textContent.replace('EPISODE ', ''));
        const episode = state.episodes.find(ep => ep.order_index === orderIdx);
        
        if (episode) {
            const playBtn = card.querySelector('.play-btn-trigger');
            if (playBtn) {
                const newPlayBtn = playBtn.cloneNode(true);
                playBtn.parentNode.replaceChild(newPlayBtn, playBtn);
                newPlayBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    watchEpisode(episode.id);
                });
            }
            const discBtn = card.querySelector('.discover-btn-trigger');
            if (discBtn) {
                const newDiscBtn = discBtn.cloneNode(true);
                discBtn.parentNode.replaceChild(newDiscBtn, discBtn);
                newDiscBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    alert(`📖 DISCOVERING: ${episode.title}\n\nSuperbook Adventure Study Guide content has been synced for classroom review!`);
                });
            }
            
            card.onclick = () => {
                watchEpisode(episode.id);
            };
        }
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xc = rect.width / 2;
            const yc = rect.height / 2;
            const tiltX = -(y - yc) / (rect.height / 8);
            const tiltY = (x - xc) / (rect.width / 8);
            
            gsap.to(card, {
                rotateX: tiltX,
                rotateY: tiltY,
                translateY: -10,
                scale: 1.03,
                duration: 0.15,
                ease: "power1.out",
                transformPerspective: 1000
            });
        });
        
        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                rotateX: 0,
                rotateY: 0,
                translateY: 0,
                scale: 1,
                duration: 0.35,
                ease: "power2.out"
            });
        });
    });
}

function navigateTo(screenId) {
    const prevScreenId = currentActiveScreen;
    if (prevScreenId === screenId && document.getElementById(`screen-${screenId}`).classList.contains('active')) return;
    
    currentActiveScreen = screenId;
    state.currentScreen = screenId;
    
    const prevPos = screenOrder[prevScreenId] !== undefined ? screenOrder[prevScreenId] : 0;
    const targetPos = screenOrder[screenId] !== undefined ? screenOrder[screenId] : 0;
    const slideDirection = targetPos > prevPos ? 1 : -1;
    
    const outgoing = document.getElementById(`screen-${prevScreenId}`);
    const incoming = document.getElementById(`screen-${screenId}`);
    
    // If leaving video deck, pause YouTube player and stop interval
    if (screenId !== 'video' && ytPlayer) {
        try {
            ytPlayer.pauseVideo();
        } catch(e) {}
        cleanupYoutubePolling();
    }

    // Refresh dashboard contents or grids based on tab routing
    if (screenId === 'dashboard') {
        renderDashboard();
    } else if (screenId === 'quizzes') {
        renderQuizzesSelect();
    } else if (screenId === 'contests') {
        renderContests();
    } else if (screenId === 'shop') {
        renderShop();
    } else if (screenId === 'admin') {
        renderAdminView();
    }

    updateActiveTabs(screenId);

    if (outgoing && incoming && prevScreenId !== screenId) {
        incoming.style.display = 'flex';
        incoming.style.pointerEvents = 'none';
        
        const startX = slideDirection * window.innerWidth;
        const endX = -slideDirection * window.innerWidth;
        
        gsap.killTweensOf([outgoing, incoming]);
        
        gsap.fromTo(outgoing, 
            { x: 0, opacity: 1, scale: 1 }, 
            { x: endX, opacity: 0, scale: 0.95, duration: 0.55, ease: "power2.inOut", onComplete: () => {
                outgoing.classList.remove('active');
                outgoing.style.display = 'none';
            }}
        );
        
        gsap.fromTo(incoming, 
            { x: startX, opacity: 0, scale: 0.95 }, 
            { x: 0, opacity: 1, scale: 1, duration: 0.55, ease: "power2.inOut", onComplete: () => {
                incoming.classList.add('active');
                incoming.style.pointerEvents = 'all';
                triggerInteriorAnimations(screenId);
            }}
        );
    } else if (incoming) {
        document.querySelectorAll('.app-screen').forEach(s => {
            if (s !== incoming) {
                s.classList.remove('active');
                s.style.display = 'none';
            }
        });
        incoming.style.display = 'flex';
        incoming.classList.add('active');
        incoming.style.pointerEvents = 'all';
        gsap.set(incoming, { x: 0, opacity: 1, scale: 1 });
        triggerInteriorAnimations(screenId);
    }
}

// Connect navigation event listeners
const brandLogo = document.querySelector('.header-brand');
if (brandLogo) {
    brandLogo.addEventListener('click', () => navigateTo('home'));
}
const homeTab = document.getElementById('tab-home-btn');
if (homeTab) {
    homeTab.addEventListener('click', () => navigateTo('home'));
}
document.getElementById('tab-videos-btn').addEventListener('click', () => navigateTo('dashboard'));
document.getElementById('tab-quizzes-btn').addEventListener('click', () => navigateTo('quizzes'));
document.getElementById('tab-contests-btn').addEventListener('click', () => navigateTo('contests'));
document.getElementById('tab-settings-btn').addEventListener('click', () => navigateTo('settings'));

// Homepage action button hooks
const startJourneyBtn = document.getElementById('home-start-journey-btn');
if (startJourneyBtn) {
    startJourneyBtn.addEventListener('click', () => {
        navigateTo('dashboard');
        triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
    });
}
const homeShopBtn = document.getElementById('home-goto-shop-btn');
if (homeShopBtn) {
    homeShopBtn.addEventListener('click', () => {
        navigateTo('shop');
        triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
    });
}

// Settings Screen inner card navigation
const gotoShopBtn = document.getElementById('settings-goto-shop-btn');
if (gotoShopBtn) {
    gotoShopBtn.addEventListener('click', () => navigateTo('shop'));
}
const gotoAdminBtn = document.getElementById('settings-goto-admin-btn');
if (gotoAdminBtn) {
    gotoAdminBtn.addEventListener('click', () => navigateTo('admin'));
}

// Back to Settings button hooks
document.querySelectorAll('.back-settings-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        navigateTo('settings');
        triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
    });
});

// Admin Subtabs switching logic
const subtabContentBtn = document.getElementById('admin-subtab-content-btn');
const subtabManageBtn = document.getElementById('admin-subtab-manage-btn');
const subtabSubmissionsBtn = document.getElementById('admin-subtab-submissions-btn');
const panelContent = document.getElementById('admin-panel-content');
const panelManage = document.getElementById('admin-panel-manage');
const panelSubmissions = document.getElementById('admin-panel-submissions');

function resetAdminSubtabButtons() {
    [subtabContentBtn, subtabManageBtn, subtabSubmissionsBtn].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
}

if (subtabContentBtn && subtabManageBtn && subtabSubmissionsBtn && panelContent && panelManage && panelSubmissions) {
    subtabContentBtn.addEventListener('click', () => {
        resetAdminSubtabButtons();
        subtabContentBtn.classList.add('active');
        panelContent.style.display = 'block';
        panelManage.style.display = 'none';
        panelSubmissions.style.display = 'none';
        renderAdminQuizSelect();
    });
    
    subtabManageBtn.addEventListener('click', () => {
        resetAdminSubtabButtons();
        subtabManageBtn.classList.add('active');
        panelContent.style.display = 'none';
        panelManage.style.display = 'block';
        panelSubmissions.style.display = 'none';
        renderAdminManageView();
    });
    
    subtabSubmissionsBtn.addEventListener('click', () => {
        resetAdminSubtabButtons();
        subtabSubmissionsBtn.classList.add('active');
        panelContent.style.display = 'none';
        panelManage.style.display = 'none';
        panelSubmissions.style.display = 'block';
        renderAdminSubmissions();
    });
}

// --- 5. MASCOT DRESSING & RENDERER ---
function renderEquippedGear() {
    const overlay = document.getElementById('equipped-accessory');
    if (!overlay) return;
    
    const equipped = state.user.avatar_custom_data.equipped_gear;
    overlay.className = 'equipped-overlay';
    
    if (equipped) {
        const item = state.shopItems.find(i => i.id === equipped);
        if (item) {
            overlay.style.backgroundImage = `url('${item.img}')`;
            overlay.style.display = 'block';
            overlay.classList.add(`equipped-${equipped}`);
            return;
        }
    }
    overlay.style.backgroundImage = '';
    overlay.style.display = 'none';
}

// --- 6. DASHBOARD SCREEN RENDERING ---
function renderDashboard() {
    const container = document.getElementById('episodes-cards-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    state.episodes.forEach(episode => {
        const isLocked = episode.order_index > state.user.unlocked_index;
        
        const card = document.createElement('div');
        card.className = `episode-banner-card ${isLocked ? 'locked' : ''}`;
        
        if (isLocked) {
            card.innerHTML = `
                <div class="episode-orb-section">
                    <img src="assets/portal_orb.png" class="episode-orb-img">
                </div>
                <div class="episode-info-section">
                    <span class="episode-number-label">EPISODE ${episode.order_index}</span>
                    <h2 class="episode-banner-title">${episode.title}</h2>
                    <p class="episode-banner-desc">${episode.description}</p>
                    <div class="episode-btn-row">
                        <button class="sb-btn sb-btn-red play-btn-trigger" disabled>▶ WATCH EPISODE</button>
                        <button class="sb-btn sb-btn-blue discover-btn-trigger" disabled>📖 DISCOVER MORE</button>
                    </div>
                </div>
                <div class="episode-thumb-section">
                    <img src="${episode.thumbnail_url}" alt="${episode.title}">
                    <div class="locked-overlay-banner">
                        <div class="lock-badge-big">🔒</div>
                        <div class="lock-text-badge">LOCKED</div>
                    </div>
                </div>
            `;
            
            // Shake warning if kids tap a locked episode card
            card.addEventListener('click', () => {
                const badge = card.querySelector('.lock-badge-big');
                if (badge) {
                    badge.style.animation = 'none';
                    void badge.offsetWidth; // Force CSS reflow
                    badge.style.animation = 'shake 0.4s ease';
                }
            });
        } else {
            card.innerHTML = `
                <div class="episode-orb-section">
                    <img src="assets/portal_orb.png" class="episode-orb-img">
                </div>
                <div class="episode-info-section">
                    <span class="episode-number-label">EPISODE ${episode.order_index}</span>
                    <h2 class="episode-banner-title">${episode.title}</h2>
                    <p class="episode-banner-desc">${episode.description}</p>
                    <div class="episode-btn-row">
                        <button class="sb-btn sb-btn-red play-btn-trigger">▶ WATCH EPISODE</button>
                        <button class="sb-btn sb-btn-blue discover-btn-trigger">📖 DISCOVER MORE</button>
                    </div>
                </div>
                <div class="episode-thumb-section">
                    <img src="${episode.thumbnail_url}" alt="${episode.title}">
                </div>
            `;
            
            // Add click listener that distinguishes between specific buttons and general card clicks
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('discover-btn-trigger')) {
                    e.stopPropagation();
                    state.activeEpisode = episode;
                    startQuiz();
                } else {
                    // Clicked Play button or anywhere else on the card
                    startEpisode(episode);
                }
            });
        }
        
        container.appendChild(card);
    });
}

// --- 7. VIDEO PLAYER SCREEN CONTROLLER ---
const playPauseBtn = document.getElementById('video-play-pause-btn');
const timeLabel = document.getElementById('video-time-label');
const fillBar = document.getElementById('video-progress-fill');
const skipBalloon = document.getElementById('timeline-skip-balloon');
const track = document.querySelector('.kids-timeline-track');

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

let ytApiLoaded = false;
function loadYoutubeAPI() {
    if (ytApiLoaded) return;
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    ytApiLoaded = true;
}

let ytPlayerPendingEpisode = null;

window.onYouTubeIframeAPIReady = function() {
    console.log("YouTube Iframe API Loaded and Ready!");
    if (ytPlayerPendingEpisode) {
        console.log("Loading queued episode after API ready:", ytPlayerPendingEpisode.title);
        createYoutubePlayer(ytPlayerPendingEpisode);
        ytPlayerPendingEpisode = null;
    }
};

function startEpisode(episode) {
    state.activeEpisode = episode;
    navigateTo('video');
    
    // Load YouTube API if not loaded
    loadYoutubeAPI();

    document.getElementById('active-video-title').textContent = episode.title;
    
    // Reset control deck states
    playPauseBtn.textContent = '⏸️';
    fillBar.style.width = '0%';
    timeLabel.textContent = '0:00';
    
    cleanupYoutubePolling();

    // Verify if YouTube API is fully loaded and ready
    if (window.YT && window.YT.Player) {
        createYoutubePlayer(episode);
    } else {
        console.log("YouTube API not ready yet. Queuing episode:", episode.title);
        ytPlayerPendingEpisode = episode;
    }
}

function createYoutubePlayer(episode) {
    // Clean and destroy old player
    if (ytPlayer) {
        try {
            ytPlayer.destroy();
        } catch(e) {}
        ytPlayer = null;
    }
    
    // Recreate placeholder div to prevent DOM replacement issues
    const wrapper = document.querySelector('.video-player-wrapper');
    if (wrapper) {
        const oldPlayerDiv = document.getElementById('youtube-player');
        if (oldPlayerDiv) {
            oldPlayerDiv.remove();
        }
        const newPlayerDiv = document.createElement('div');
        newPlayerDiv.id = 'youtube-player';
        const blocker = wrapper.querySelector('.timeline-interaction-blocker');
        if (blocker) {
            wrapper.insertBefore(newPlayerDiv, blocker);
        } else {
            wrapper.appendChild(newPlayerDiv);
        }
    }
    
    // Instantiate YouTube player inside the recreated div
    ytPlayer = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: episode.youtube_video_id,
        playerVars: {
            controls: 0,        // Hides YouTube progress bar and controls
            disablekb: 1,       // Disables scrubbing hotkeys
            fs: 0,              // Prevents fullscreen button scrubbing
            modestbranding: 1,  // Minimizes YouTube logos
            rel: 0,             // Hides recommendations at end of video
            showinfo: 0,        // Hides video info
            iv_load_policy: 3,  // Hides interactive annotations
            playsinline: 1      // Forces inline playback on mobile
        },
        events: {
            'onReady': (event) => {
                event.target.playVideo();
                playPauseBtn.textContent = '⏸️';
                startYoutubePolling();
            },
            'onStateChange': (event) => {
                if (event.data === YT.PlayerState.PLAYING) {
                    playPauseBtn.textContent = '⏸️';
                    startYoutubePolling();
                } else if (event.data === YT.PlayerState.PAUSED) {
                    playPauseBtn.textContent = '▶️';
                    cleanupYoutubePolling();
                } else if (event.data === YT.PlayerState.ENDED) {
                    cleanupYoutubePolling();
                    playPauseBtn.textContent = '▶️';
                    startQuiz();
                }
            }
        }
    });
}

function togglePlayPause() {
    if (!ytPlayer) return;
    try {
        const playerState = ytPlayer.getPlayerState();
        if (playerState === YT.PlayerState.PLAYING) {
            ytPlayer.pauseVideo();
            playPauseBtn.textContent = '▶️';
        } else {
            ytPlayer.playVideo();
            playPauseBtn.textContent = '⏸️';
        }
    } catch(e) {}
}

playPauseBtn.addEventListener('click', togglePlayPause);

// Add tap/click listener to the giant video interaction blocker to toggle play/pause natively
const interactionBlocker = document.querySelector('.timeline-interaction-blocker');
if (interactionBlocker) {
    interactionBlocker.addEventListener('click', togglePlayPause);
}

function startYoutubePolling() {
    cleanupYoutubePolling();
    ytPollingInterval = setInterval(() => {
        if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
            const currentTime = ytPlayer.getCurrentTime();
            const duration = ytPlayer.getDuration();
            
            if (duration > 0) {
                const pct = (currentTime / duration) * 100;
                fillBar.style.width = `${pct}%`;
                timeLabel.textContent = formatTime(currentTime);
            }
        }
    }, 400);
}

function cleanupYoutubePolling() {
    if (ytPollingInterval) {
        clearInterval(ytPollingInterval);
        ytPollingInterval = null;
    }
}

// Intercept clicks on custom track and trigger temporal deviation warning
function triggerSkipWarning() {
    skipBalloon.classList.add('show');
    setTimeout(() => {
        skipBalloon.classList.remove('show');
    }, 2800);
}

track.addEventListener('mousedown', triggerSkipWarning);
track.addEventListener('touchstart', triggerSkipWarning);


// --- 7B. QUIZZES LIST RENDERER ---
function renderQuizzesSelect() {
    const container = document.getElementById('quizzes-grid-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    state.episodes.forEach(episode => {
        const isLocked = episode.order_index > state.user.unlocked_index;
        
        const card = document.createElement('div');
        card.className = `quiz-card-select ${isLocked ? 'locked' : ''}`;
        
        if (isLocked) {
            card.innerHTML = `
                <div class="quiz-blueprint-overlay">
                    <div class="blueprint-scanline"></div>
                    <div class="quiz-blueprint-header">
                        <span class="blueprint-tag">MAINFRAME LOCK</span>
                    </div>
                    <h3 class="blueprint-title">${episode.title} Quiz</h3>
                    <p class="blueprint-desc">Stabilize video portal timelines to gain mainframe decryption keys.</p>
                    <div class="lock-indicator">🔒 LOCKED</div>
                </div>
            `;
            card.addEventListener('click', () => {
                const indicator = card.querySelector('.lock-indicator');
                if (indicator) {
                    indicator.style.animation = 'none';
                    void indicator.offsetWidth;
                    indicator.style.animation = 'errorWiggle 0.5s ease-in-out';
                }
            });
        } else {
            card.innerHTML = `
                <div class="quiz-blueprint-overlay">
                    <div class="blueprint-scanline"></div>
                    <div class="quiz-blueprint-header">
                        <span class="blueprint-tag">READY FOR SYNC</span>
                        <span class="reward-tag">🔋 100 pts</span>
                    </div>
                    <h3 class="blueprint-title">${episode.title} Quiz</h3>
                    <p class="blueprint-desc">Initiate timeline trivia calibration. Re-sync memory banks to earn SuperPoints.</p>
                    <button class="blueprint-play-btn">DECRYPT & INITIATE ⚡</button>
                </div>
            `;
            card.addEventListener('click', () => {
                state.activeEpisode = episode;
                startQuiz();
            });
        }
        
        container.appendChild(card);
    });
}


// --- 7C. DAILY SPACE CONTESTS CONTROLLER ---
let activeContest = null;

function renderContests() {
    const listContainer = document.getElementById('contests-list-container');
    const ledgerBody = document.getElementById('submissions-ledger-body');
    if (!listContainer || !ledgerBody) return;
    
    // Render sidebar contests
    listContainer.innerHTML = '';
    state.contests.forEach(contest => {
        const item = document.createElement('div');
        const isActive = activeContest && activeContest.id === contest.id;
        item.className = `contest-sidebar-item ${isActive ? 'active' : ''}`;
        
        item.innerHTML = `
            <div class="contest-icon-box">
                <img src="${contest.thumbnail_url}" alt="${contest.title}" class="contest-icon-img">
            </div>
            <div class="contest-sidebar-info">
                <h4 class="contest-sidebar-title">${contest.title}</h4>
                <span class="contest-sidebar-points">🔋 ${contest.points_reward} pts</span>
            </div>
        `;
        
        item.addEventListener('click', () => selectContest(contest));
        listContainer.appendChild(item);
    });
    
    // Render ledger
    ledgerBody.innerHTML = '';
    if (state.submissions.length === 0) {
        ledgerBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-ledger-row">🛰️ NO OUTBOUND TRANSMISSIONS DETECTED ON THIS BANDWIDTH.</td>
            </tr>
        `;
    } else {
        [...state.submissions].reverse().forEach(sub => {
            const tr = document.createElement('tr');
            const date = new Date(sub.created_at);
            const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
            
            let contentSummary = sub.submission_text || '';
            if (sub.attachment_name) {
                contentSummary += (contentSummary ? '<br>' : '') + `📁 Attachment: <strong>${sub.attachment_name}</strong>`;
            }
            
            tr.innerHTML = `
                <td class="ledger-time">${timeStr}</td>
                <td class="ledger-contest">${sub.contest_title}</td>
                <td class="ledger-content">${contentSummary}</td>
                <td class="ledger-status"><span class="status-badge ${sub.status}">${sub.status.toUpperCase()} ⏳</span></td>
                <td class="ledger-reward">+${sub.points_reward} pts</td>
            `;
            ledgerBody.appendChild(tr);
        });
    }
}

function selectContest(contest) {
    activeContest = contest;
    
    document.getElementById('contest-dossier-title').textContent = contest.title;
    document.getElementById('contest-dossier-desc').textContent = contest.description;
    document.getElementById('contest-dossier-reward').textContent = `Reward: 🔋 ${contest.points_reward} SuperPoints`;
    
    // Enable inputs
    document.getElementById('transmission-text').disabled = false;
    document.getElementById('select-attachment-btn').disabled = false;
    document.getElementById('submit-transmission-btn').disabled = false;
    
    // Reset selection
    state.selectedFile = null;
    document.getElementById('selected-file-label').textContent = 'No drawing attached';
    
    renderContests();
}

// Setup attachment selection handlers
const selectAttachmentBtn = document.getElementById('select-attachment-btn');
const fileInput = document.getElementById('transmission-file');
const fileLabel = document.getElementById('selected-file-label');

if (selectAttachmentBtn && fileInput) {
    selectAttachmentBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            state.selectedFile = e.target.files[0];
            fileLabel.textContent = `Attached: ${state.selectedFile.name}`;
        } else {
            state.selectedFile = null;
            fileLabel.textContent = 'No drawing attached';
        }
    });
}

// Handle contest submission
const transmissionForm = document.getElementById('contest-transmission-form');
const uploadTicker = document.getElementById('transmission-upload-ticker');
const uploadProgressFill = document.getElementById('ticker-progress-fill');
const submitBtn = document.getElementById('submit-transmission-btn');

if (submitBtn) {
    submitBtn.addEventListener('click', () => {
        if (!activeContest) return;
        
        const textVal = document.getElementById('transmission-text').value.trim();
        const hasFile = !!state.selectedFile;
        
        if (!textVal && !hasFile) {
            alert("⚠️ Please enter a response or select a drawing before transmitting!");
            return;
        }
        
        document.getElementById('transmission-text').disabled = true;
        selectAttachmentBtn.disabled = true;
        submitBtn.disabled = true;
        
        uploadTicker.style.display = 'block';
        uploadProgressFill.style.width = '0%';
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            uploadProgressFill.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                completeTransmission(textVal);
            }
        }, 100);
    });
}

function completeTransmission(textVal) {
    uploadTicker.style.display = 'none';
    
    const newSubmission = {
        id: 'sub-' + Date.now(),
        contest_id: activeContest.id,
        contest_title: activeContest.title,
        submission_text: textVal,
        attachment_name: state.selectedFile ? state.selectedFile.name : null,
        status: 'pending',
        points_reward: activeContest.points_reward,
        created_at: new Date().toISOString()
    };
    
    state.submissions.push(newSubmission);
    state.saveSubmissions();
    
    // Points will be rewarded upon parent/admin approval in the Admin tab!
    
    triggerConfettiVictoryFX();
    triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
    
    // Clear inputs and form
    document.getElementById('transmission-text').value = '';
    document.getElementById('transmission-text').disabled = false;
    selectAttachmentBtn.disabled = false;
    submitBtn.disabled = false;
    state.selectedFile = null;
    fileInput.value = '';
    document.getElementById('selected-file-label').textContent = 'No drawing attached';
    
    renderContests();
}

// --- 8. GAMIFIED QUIZ SCREEN CONTROLLER ---
let episodeQuizQuestions = [];

function startQuiz() {
    // Fetch quizzes linked to this active episode
    const quizSet = state.quizzes.find(q => q.episode_id === state.activeEpisode.id);
    if (!quizSet || quizSet.questions.length === 0) {
        // Fallback: No questions, return to dashboard and unlock next episode
        completeAdventure();
        return;
    }

    episodeQuizQuestions = quizSet.questions;
    state.activeQuizIndex = 0;
    state.activeQuizScore = 0;
    state.activeQuizTotalCoins = 0;
    
    navigateTo('quiz');
    displayQuizQuestion();
}

function displayQuizQuestion() {
    if (state.activeQuizIndex >= episodeQuizQuestions.length) {
        finishQuiz();
        return;
    }

    const question = episodeQuizQuestions[state.activeQuizIndex];
    
    // Update Question Card Texts
    document.getElementById('quiz-question-text').textContent = question.question_text;
    document.getElementById('quiz-reward-label').textContent = `⭐ ${question.coin_reward} Coins`;
    
    // Update Progress Indicator
    const progressPct = (state.activeQuizIndex / episodeQuizQuestions.length) * 100;
    document.getElementById('quiz-progress-bar-fill').style.width = `${progressPct}%`;

    // Render 4 choices in grid
    const optionsContainer = document.getElementById('quiz-options-container');
    optionsContainer.innerHTML = '';

    question.options.forEach((optText, index) => {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = optText;
        
        button.addEventListener('click', (e) => {
            const rect = button.getBoundingClientRect();
            const clickX = rect.left + rect.width / 2;
            const clickY = rect.top + rect.height / 2;
            
            checkAnswer(index, button, clickX, clickY);
        });

        optionsContainer.appendChild(button);
    });
}

function checkAnswer(selectedIndex, buttonElement, x, y) {
    const question = episodeQuizQuestions[state.activeQuizIndex];
    const isCorrect = selectedIndex === question.correct_option_index;

    // Disable all options during evaluate pause
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.disabled = true;
    });

    if (isCorrect) {
        // Correct Action
        buttonElement.classList.add('correct');
        triggerBubblePopFX(x, y);
        
        state.activeQuizScore++;
        state.activeQuizTotalCoins += question.coin_reward;
        
        // Wait 1.1s, then step to next question
        setTimeout(() => {
            state.activeQuizIndex++;
            displayQuizQuestion();
        }, 1100);
    } else {
        // Incorrect Action
        buttonElement.classList.add('incorrect');
        
        // Re-enable option buttons so the kid can try again!
        setTimeout(() => {
            buttonElement.classList.remove('incorrect');
            document.querySelectorAll('.choice-btn').forEach(btn => {
                btn.disabled = false;
            });
        }, 800);
    }
}

function finishQuiz() {
    // Update Quiz Progress bar to full
    document.getElementById('quiz-progress-bar-fill').style.width = `100%`;
    
    // Trigger massive confetti celebration
    triggerConfettiVictoryFX();
    
    // Call "increment_coins" simulation
    state.incrementCoins(state.activeQuizTotalCoins);
    
    // Create and show the custom Flutter-style alert dialog overlay
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'custom-dialog-overlay';
    dialogOverlay.innerHTML = `
        <div class="custom-dialog-box">
            <h2 class="dialog-title">🌀 CHRONOLOGY SYNC COMPLETE 🌀</h2>
            <p class="dialog-content">Memory bank stabilized! You synthesized <strong>${state.activeQuizTotalCoins} SuperPoints</strong> for upgrade operations.</p>
            <div class="dialog-actions">
                <button class="dialog-action-btn">Access Upgrade Lab 🛠️</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialogOverlay);
    
    // Wire button listener to pop modal, perform unlocking, and navigate to the Prize Shop screen
    dialogOverlay.querySelector('.dialog-action-btn').addEventListener('click', () => {
        // Process Unlock Logic: If they completed their active unlocked episode, step to next index!
        if (state.activeEpisode.order_index === state.user.unlocked_index) {
            state.user.unlocked_index = Math.min(state.episodes.length, state.user.unlocked_index + 1);
            state.saveUser();
        }
        
        // Visual Bubble Pop on dialog click
        const btnRect = dialogOverlay.querySelector('.dialog-action-btn').getBoundingClientRect();
        triggerBubblePopFX(btnRect.left + btnRect.width / 2, btnRect.top + btnRect.height / 2);
        
        // Remove dialog and go to Shop screen!
        setTimeout(() => {
            dialogOverlay.remove();
            navigateTo('shop');
        }, 150);
    });
}

// Fallback logic
function completeAdventure() {
    if (state.activeEpisode.order_index === state.user.unlocked_index) {
        state.user.unlocked_index = Math.min(state.episodes.length, state.user.unlocked_index + 1);
        state.saveUser();
    }
    navigateTo('dashboard');
}

// --- 9. PRIZE SHOP GRID CONTROLLER ---
function renderShop() {
    const container = document.getElementById('shop-items-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    state.shopItems.forEach(item => {
        const isOwned = state.ownedItems.includes(item.id);
        const isEquipped = state.user.avatar_custom_data.equipped_gear === item.id;
        const canAfford = state.user.star_coins >= item.cost;
        
        const card = document.createElement('div');
        card.className = 'shop-card';
        
        let buttonHTML = '';
        if (isEquipped) {
            buttonHTML = `<button class="shop-buy-btn equipped-btn" id="shop-btn-${item.id}">Equipped! (Unequip)</button>`;
        } else if (isOwned) {
            buttonHTML = `<button class="shop-buy-btn owned" id="shop-btn-${item.id}">Equip Gear 👕</button>`;
        } else {
            buttonHTML = `<button class="shop-buy-btn" id="shop-btn-${item.id}" ${canAfford ? '' : 'disabled'}>Buy Prize 🎁</button>`;
        }

        card.innerHTML = `
            ${isOwned ? '<div class="unlocked-ribbon">OWNED</div>' : ''}
            <div class="shop-item-preview-box">
                <img src="${item.img}" alt="${item.title}" class="shop-item-img">
            </div>
            <h3 class="shop-item-title">${item.title}</h3>
            <div class="shop-item-cost">
                <span>⭐</span>
                <span>${item.cost} Coins</span>
            </div>
            ${buttonHTML}
        `;
        
        container.appendChild(card);
        
        // Add Button transaction event listener
        const btn = document.getElementById(`shop-btn-${item.id}`);
        if (btn) {
            btn.addEventListener('click', (e) => {
                const rect = btn.getBoundingClientRect();
                const clickX = rect.left + rect.width / 2;
                const clickY = rect.top + rect.height / 2;
                
                handleShopAction(item.id, item.cost, isOwned, isEquipped, clickX, clickY);
            });
        }
    });
}

function handleShopAction(itemId, cost, isOwned, isEquipped, x, y) {
    if (isEquipped) {
        // Unequip action
        state.equipItem(null);
        triggerBubblePopFX(x, y);
    } else if (isOwned) {
        // Equip action
        state.equipItem(itemId);
        triggerBubblePopFX(x, y);
    } else {
        // Purchase action
        const success = state.purchaseItem(itemId, cost);
        if (success) {
            triggerConfettiVictoryFX();
            triggerBubblePopFX(x, y);
            state.equipItem(itemId); // Auto-equip on purchase
        }
    }
    renderShop();
}

// --- 9B. ADMIN CONTROL CENTER CONTROLLERS ---

function renderAdminView() {
    const loginDeck = document.getElementById('admin-login-deck');
    const mainframeDeck = document.getElementById('admin-mainframe-deck');
    const logoutBtn = document.getElementById('admin-logout-btn');
    
    if (!loginDeck || !mainframeDeck || !logoutBtn) return;
    
    if (state.isAdminLoggedIn) {
        loginDeck.style.display = 'none';
        mainframeDeck.style.display = 'block';
        logoutBtn.style.display = 'block';
        
        // Render sub-contents
        renderAdminQuizSelect();
        renderAdminSubmissions();
        renderAdminManageView();
    } else {
        loginDeck.style.display = 'flex';
        mainframeDeck.style.display = 'none';
        logoutBtn.style.display = 'none';
        
        // Clear login form fields and errors
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('login-error-msg').style.display = 'none';
    }
}

function renderAdminQuizSelect() {
    const select = document.getElementById('admin-quiz-ep-select');
    if (!select) return;
    
    select.innerHTML = '';
    state.episodes.forEach(episode => {
        const option = document.createElement('option');
        option.value = episode.id;
        option.textContent = `EP ${episode.order_index}: ${episode.title}`;
        select.appendChild(option);
    });
}

function renderAdminSubmissions() {
    const tbody = document.getElementById('admin-submissions-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (state.submissions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-ledger-row">🛰️ NO SUBMISSIONS AVAILABLE FOR REVIEW.</td>
            </tr>
        `;
        return;
    }
    
    [...state.submissions].reverse().forEach(sub => {
        const tr = document.createElement('tr');
        
        let responseHTML = sub.submission_text || '<span class="file-label">No text response</span>';
        let attachmentHTML = sub.attachment_name ? `📁 <strong>${sub.attachment_name}</strong>` : '<span class="file-label">None</span>';
        
        let actionsHTML = '';
        if (sub.status === 'pending') {
            actionsHTML = `
                <div class="action-buttons-wrap">
                    <button class="sb-btn sb-btn-green approve-btn" data-id="${sub.id}">Approve</button>
                    <button class="sb-btn sb-btn-red reject-btn" data-id="${sub.id}">Reject</button>
                </div>
            `;
        } else {
            actionsHTML = `<span class="status-badge ${sub.status}">${sub.status.toUpperCase()}</span>`;
        }
        
        tr.innerHTML = `
            <td class="ledger-contest">${sub.contest_title}</td>
            <td class="ledger-content">${responseHTML}</td>
            <td class="ledger-content">${attachmentHTML}</td>
            <td class="ledger-status"><span class="status-badge ${sub.status}">${sub.status.toUpperCase()}</span></td>
            <td>${actionsHTML}</td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Wire click event listeners
    tbody.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const subId = btn.getAttribute('data-id');
            const rect = btn.getBoundingClientRect();
            approveSubmission(subId, rect.left + rect.width / 2, rect.top + rect.height / 2);
        });
    });
    
    tbody.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const subId = btn.getAttribute('data-id');
            rejectSubmission(subId);
        });
    });
}

function approveSubmission(subId, x, y) {
    const sub = state.submissions.find(s => s.id === subId);
    if (!sub) return;
    
    sub.status = 'approved';
    state.saveSubmissions();
    
    // Reward points to Leo Starry user account!
    state.incrementCoins(sub.points_reward);
    
    // Fun visual rewards effects
    triggerConfettiVictoryFX();
    triggerBubblePopFX(x, y);
    
    // Re-render
    renderAdminSubmissions();
    renderContests(); // Keep user ledger in sync!
}

function rejectSubmission(subId) {
    const sub = state.submissions.find(s => s.id === subId);
    if (!sub) return;
    
    sub.status = 'rejected';
    state.saveSubmissions();
    
    // Re-render
    renderAdminSubmissions();
    renderContests(); // Keep user ledger in sync!
}

function renderAdminManageView() {
    const epTbody = document.getElementById('admin-manage-episodes-tbody');
    const contestTbody = document.getElementById('admin-manage-contests-tbody');
    if (!epTbody || !contestTbody) return;

    // 1. Render episodes table
    epTbody.innerHTML = '';
    if (state.episodes.length === 0) {
        epTbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-ledger-row">📺 NO EPISODES FOUND. UPLOAD ONE TO START!</td>
            </tr>
        `;
    } else {
        state.episodes.forEach(ep => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="ledger-contest"><strong>EP ${ep.order_index}: ${ep.title}</strong></td>
                <td class="ledger-content"><code>${ep.youtube_video_id}</code></td>
                <td class="ledger-content"><div class="desc-cell">${ep.description}</div></td>
                <td>
                    <div class="action-buttons-wrap">
                        <button class="sb-btn sb-btn-blue edit-ep-btn" data-id="${ep.id}">✏️ EDIT</button>
                        <button class="sb-btn sb-btn-red delete-ep-btn" data-id="${ep.id}">❌ DELETE</button>
                    </div>
                </td>
            `;
            epTbody.appendChild(tr);
        });
    }

    // 2. Render contests table
    contestTbody.innerHTML = '';
    if (state.contests.length === 0) {
        contestTbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-ledger-row">🏆 NO CONTESTS FOUND. POST ONE TO START!</td>
            </tr>
        `;
    } else {
        state.contests.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="ledger-contest"><strong>${c.title}</strong></td>
                <td class="ledger-content"><div class="desc-cell">${c.description}</div></td>
                <td class="ledger-status">${c.points_reward} pts</td>
                <td>
                    <div class="action-buttons-wrap">
                        <button class="sb-btn sb-btn-blue edit-contest-btn" data-id="${c.id}">✏️ EDIT</button>
                        <button class="sb-btn sb-btn-red delete-contest-btn" data-id="${c.id}">❌ DELETE</button>
                    </div>
                </td>
            `;
            contestTbody.appendChild(tr);
        });
    }

    // Wire buttons
    epTbody.querySelectorAll('.edit-ep-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const epId = btn.getAttribute('data-id');
            editEpisode(epId);
        });
    });

    epTbody.querySelectorAll('.delete-ep-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const epId = btn.getAttribute('data-id');
            deleteEpisode(epId);
        });
    });

    contestTbody.querySelectorAll('.edit-contest-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const contestId = btn.getAttribute('data-id');
            editContest(contestId);
        });
    });

    contestTbody.querySelectorAll('.delete-contest-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const contestId = btn.getAttribute('data-id');
            deleteContest(contestId);
        });
    });
}

function editEpisode(epId) {
    const ep = state.episodes.find(e => e.id === epId);
    if (!ep) return;

    editingEpisodeId = epId;
    
    // Show modal container and specific episode content
    const modal = document.getElementById('admin-edit-modal');
    const epContent = document.getElementById('edit-ep-modal-content');
    const contestContent = document.getElementById('edit-contest-modal-content');
    
    if (modal) modal.style.display = 'flex';
    if (epContent) epContent.style.display = 'block';
    if (contestContent) contestContent.style.display = 'none';

    // Populate episode fields
    document.getElementById('edit-ep-title').value = ep.title;
    document.getElementById('edit-ep-ytid').value = ep.youtube_video_id;
    document.getElementById('edit-ep-desc').value = ep.description;

    const thumbUrl = ep.thumbnail_url || 'assets/episode1.png';
    const epLinkTab = document.getElementById('edit-ep-thumb-link-tab');
    const epUploadTab = document.getElementById('edit-ep-thumb-upload-tab');
    const epLinkPanel = document.getElementById('edit-ep-thumb-link-panel');
    const epUploadPanel = document.getElementById('edit-ep-thumb-upload-panel');
    const epPreviewContainer = document.getElementById('edit-ep-upload-preview-container');
    const epPreviewImg = document.getElementById('edit-ep-upload-preview-img');

    if (thumbUrl.startsWith('data:image/')) {
        editEpisodeImageBase64 = thumbUrl;
        document.getElementById('edit-ep-thumb').value = '';
        if (epPreviewImg) epPreviewImg.src = thumbUrl;
        if (epPreviewContainer) epPreviewContainer.style.display = 'block';
        
        if (epUploadTab && epLinkTab) {
            epUploadTab.classList.add('active');
            epLinkTab.classList.remove('active');
        }
        if (epUploadPanel) epUploadPanel.style.display = 'block';
        if (epLinkPanel) epLinkPanel.style.display = 'none';
    } else {
        editEpisodeImageBase64 = null;
        document.getElementById('edit-ep-thumb').value = thumbUrl;
        if (epPreviewContainer) epPreviewContainer.style.display = 'none';
        if (epPreviewImg) epPreviewImg.src = '';
        
        if (epLinkTab && epUploadTab) {
            epLinkTab.classList.add('active');
            epUploadTab.classList.remove('active');
        }
        if (epLinkPanel) epLinkPanel.style.display = 'block';
        if (epUploadPanel) epUploadPanel.style.display = 'none';
    }
}

function deleteEpisode(epId) {
    const ep = state.episodes.find(e => e.id === epId);
    if (!ep) return;

    const firstConfirm = confirm(`⚠️ Are you sure you want to delete "${ep.title}"?`);
    if (!firstConfirm) return;

    const secondConfirm = confirm(`🚨 TRIPLE CHECK! This will delete the episode, associated quizzes, re-index sequential numbers, and lock progress for users if their current episode is deleted. Continue?`);
    if (!secondConfirm) return;

    // Remove from state episodes
    state.episodes = state.episodes.filter(e => e.id !== epId);
    
    // Clean up quizzes associated with this episode
    state.quizzes = state.quizzes.filter(q => q.episode_id !== epId);
    state.saveQuizzes();

    // Reindex remaining episodes sequentially
    state.episodes.forEach((e, idx) => {
        e.order_index = idx + 1;
    });

    state.saveEpisodes();

    // Adjust user progress lock
    if (state.user.unlocked_index > state.episodes.length) {
        state.user.unlocked_index = Math.max(1, state.episodes.length);
        state.saveUser();
        
        // Update user UI
        document.getElementById('star-coin-label').textContent = state.user.star_coins;
        document.getElementById('display-name-label').textContent = state.user.display_name;
    }

    // Refresh dynamic UI views
    renderAdminQuizSelect();
    renderDashboard();
    renderAdminManageView();

    alert(`✅ Episode "${ep.title}" successfully deleted and sequences reindexed!`);
    triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
}

function editContest(contestId) {
    const c = state.contests.find(item => item.id === contestId);
    if (!c) return;

    editingContestId = contestId;

    // Show modal container and specific contest content
    const modal = document.getElementById('admin-edit-modal');
    const epContent = document.getElementById('edit-ep-modal-content');
    const contestContent = document.getElementById('edit-contest-modal-content');
    
    if (modal) modal.style.display = 'flex';
    if (epContent) epContent.style.display = 'none';
    if (contestContent) contestContent.style.display = 'block';

    // Populate contest fields
    document.getElementById('edit-contest-title').value = c.title;
    document.getElementById('edit-contest-desc').value = c.description;

    const thumbUrl = c.thumbnail_url || 'assets/crown.png';
    const contestLinkTab = document.getElementById('edit-contest-thumb-link-tab');
    const contestUploadTab = document.getElementById('edit-contest-thumb-upload-tab');
    const contestLinkPanel = document.getElementById('edit-contest-thumb-link-panel');
    const contestUploadPanel = document.getElementById('edit-contest-thumb-upload-panel');
    const contestPreviewContainer = document.getElementById('edit-contest-upload-preview-container');
    const contestPreviewImg = document.getElementById('edit-contest-upload-preview-img');

    if (thumbUrl.startsWith('data:image/')) {
        editContestImageBase64 = thumbUrl;
        document.getElementById('edit-contest-thumb').value = '';
        if (contestPreviewImg) contestPreviewImg.src = thumbUrl;
        if (contestPreviewContainer) contestPreviewContainer.style.display = 'block';
        
        if (contestUploadTab && contestLinkTab) {
            contestUploadTab.classList.add('active');
            contestLinkTab.classList.remove('active');
        }
        if (contestUploadPanel) contestUploadPanel.style.display = 'block';
        if (contestLinkPanel) contestLinkPanel.style.display = 'none';
    } else {
        editContestImageBase64 = null;
        document.getElementById('edit-contest-thumb').value = thumbUrl;
        if (contestPreviewContainer) contestPreviewContainer.style.display = 'none';
        if (contestPreviewImg) contestPreviewImg.src = '';
        
        if (contestLinkTab && contestUploadTab) {
            contestLinkTab.classList.add('active');
            contestUploadTab.classList.remove('active');
        }
        if (contestLinkPanel) contestLinkPanel.style.display = 'block';
        if (contestUploadPanel) contestUploadPanel.style.display = 'none';
    }
}

function deleteContest(contestId) {
    const c = state.contests.find(item => item.id === contestId);
    if (!c) return;

    const firstConfirm = confirm(`⚠️ Are you sure you want to delete contest challenge "${c.title}"?`);
    if (!firstConfirm) return;

    const secondConfirm = confirm(`🚨 DANGER! This will delete the contest and all student entries associated with it will no longer show the parent contest. Continue?`);
    if (!secondConfirm) return;

    // Remove from state
    state.contests = state.contests.filter(item => item.id !== contestId);
    state.saveContests();

    // Re-render
    renderContests();
    renderAdminManageView();

    alert(`✅ Contest "${c.title}" successfully deleted!`);
    triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
}

function extractYoutubeVideoId(inputStr) {
    if (!inputStr) return '';
    inputStr = inputStr.trim();
    
    // Regular expression to handle different YouTube URL formats including live streams and shorts
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
    const match = inputStr.match(regExp);
    
    if (match && match[2].length === 11) {
        return match[2];
    }
    
    // Alternative parser for any 11-character alphanumeric block after standard YouTube path dividers
    const altRegExp = /(?:v=|\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})(?:\?|&|$)/;
    const altMatch = inputStr.match(altRegExp);
    if (altMatch) {
        return altMatch[1];
    }
    
    // Fallback: If it's 11 characters and looks like an ID, return it as-is
    if (inputStr.length === 11) {
        return inputStr;
    }
    
    return inputStr; // Return raw string if we can't parse it
}

// Local variables to track custom Base64 uploaded files
let customEpisodeImageBase64 = null;
let customContestImageBase64 = null;

function initCustomUploaders() {
    // 1. Episode picker tabs
    const epLinkTab = document.getElementById('ep-thumb-link-tab');
    const epUploadTab = document.getElementById('ep-thumb-upload-tab');
    const epLinkPanel = document.getElementById('ep-thumb-link-panel');
    const epUploadPanel = document.getElementById('ep-thumb-upload-panel');
    
    if (epLinkTab && epUploadTab) {
        epLinkTab.addEventListener('click', () => {
            epLinkTab.classList.add('active');
            epUploadTab.classList.remove('active');
            epLinkPanel.style.display = 'block';
            epUploadPanel.style.display = 'none';
        });
        
        epUploadTab.addEventListener('click', () => {
            epUploadTab.classList.add('active');
            epLinkTab.classList.remove('active');
            epUploadPanel.style.display = 'block';
            epLinkPanel.style.display = 'none';
        });
    }
    
    // 2. Contest picker tabs
    const contestLinkTab = document.getElementById('contest-thumb-link-tab');
    const contestUploadTab = document.getElementById('contest-thumb-upload-tab');
    const contestLinkPanel = document.getElementById('contest-thumb-link-panel');
    const contestUploadPanel = document.getElementById('contest-thumb-upload-panel');
    
    if (contestLinkTab && contestUploadTab) {
        contestLinkTab.addEventListener('click', () => {
            contestLinkTab.classList.add('active');
            contestUploadTab.classList.remove('active');
            contestLinkPanel.style.display = 'block';
            contestUploadPanel.style.display = 'none';
        });
        
        contestUploadTab.addEventListener('click', () => {
            contestUploadTab.classList.add('active');
            contestLinkTab.classList.remove('active');
            contestUploadPanel.style.display = 'block';
            contestLinkPanel.style.display = 'none';
        });
    }

    // 3. File Readers
    const epFileInput = document.getElementById('admin-ep-file-input');
    const epPreviewContainer = document.getElementById('ep-upload-preview-container');
    const epPreviewImg = document.getElementById('ep-upload-preview-img');
    const epClearBtn = document.getElementById('ep-upload-preview-clear');
    
    if (epFileInput) {
        epFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                customEpisodeImageBase64 = event.target.result;
                if (epPreviewImg) epPreviewImg.src = customEpisodeImageBase64;
                if (epPreviewContainer) epPreviewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    }
    
    if (epClearBtn) {
        epClearBtn.addEventListener('click', () => {
            customEpisodeImageBase64 = null;
            if (epFileInput) epFileInput.value = '';
            if (epPreviewContainer) epPreviewContainer.style.display = 'none';
            if (epPreviewImg) epPreviewImg.src = '';
        });
    }
    
    const contestFileInput = document.getElementById('admin-contest-file-input');
    const contestPreviewContainer = document.getElementById('contest-upload-preview-container');
    const contestPreviewImg = document.getElementById('contest-upload-preview-img');
    const contestClearBtn = document.getElementById('contest-upload-preview-clear');
    
    if (contestFileInput) {
        contestFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                customContestImageBase64 = event.target.result;
                if (contestPreviewImg) contestPreviewImg.src = customContestImageBase64;
                if (contestPreviewContainer) contestPreviewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    }
    
    if (contestClearBtn) {
        contestClearBtn.addEventListener('click', () => {
            customContestImageBase64 = null;
            if (contestFileInput) contestFileInput.value = '';
            if (contestPreviewContainer) contestPreviewContainer.style.display = 'none';
            if (contestPreviewImg) contestPreviewImg.src = '';
        });
    }
}

// Local variables to track custom Base64 uploaded files in edit modal
let editEpisodeImageBase64 = null;
let editContestImageBase64 = null;

function closeEditModal() {
    const modal = document.getElementById('admin-edit-modal');
    if (modal) modal.style.display = 'none';
    editingEpisodeId = null;
    editingContestId = null;
    editEpisodeImageBase64 = null;
    editContestImageBase64 = null;
}

function initEditModal() {
    // Close buttons binding
    const closeEpModalButtons = document.querySelectorAll('.close-ep-modal');
    closeEpModalButtons.forEach(btn => btn.addEventListener('click', closeEditModal));

    const closeContestModalButtons = document.querySelectorAll('.close-contest-modal');
    closeContestModalButtons.forEach(btn => btn.addEventListener('click', closeEditModal));

    // Backdrop click close
    const modal = document.getElementById('admin-edit-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeEditModal();
            }
        });
    }

    // Episode picker tabs
    const epLinkTab = document.getElementById('edit-ep-thumb-link-tab');
    const epUploadTab = document.getElementById('edit-ep-thumb-upload-tab');
    const epLinkPanel = document.getElementById('edit-ep-thumb-link-panel');
    const epUploadPanel = document.getElementById('edit-ep-thumb-upload-panel');
    
    if (epLinkTab && epUploadTab) {
        epLinkTab.addEventListener('click', () => {
            epLinkTab.classList.add('active');
            epUploadTab.classList.remove('active');
            epLinkPanel.style.display = 'block';
            epUploadPanel.style.display = 'none';
        });
        
        epUploadTab.addEventListener('click', () => {
            epUploadTab.classList.add('active');
            epLinkTab.classList.remove('active');
            epUploadPanel.style.display = 'block';
            epLinkPanel.style.display = 'none';
        });
    }

    // Contest picker tabs
    const contestLinkTab = document.getElementById('edit-contest-thumb-link-tab');
    const contestUploadTab = document.getElementById('edit-contest-thumb-upload-tab');
    const contestLinkPanel = document.getElementById('edit-contest-thumb-link-panel');
    const contestUploadPanel = document.getElementById('edit-contest-thumb-upload-panel');
    
    if (contestLinkTab && contestUploadTab) {
        contestLinkTab.addEventListener('click', () => {
            contestLinkTab.classList.add('active');
            contestUploadTab.classList.remove('active');
            contestLinkPanel.style.display = 'block';
            contestUploadPanel.style.display = 'none';
        });
        
        contestUploadTab.addEventListener('click', () => {
            contestUploadTab.classList.add('active');
            contestLinkTab.classList.remove('active');
            contestUploadPanel.style.display = 'block';
            contestLinkPanel.style.display = 'none';
        });
    }

    // File readers and preview binding
    const epFileInput = document.getElementById('edit-ep-file-input');
    const epPreviewContainer = document.getElementById('edit-ep-upload-preview-container');
    const epPreviewImg = document.getElementById('edit-ep-upload-preview-img');
    const epClearBtn = document.getElementById('edit-ep-upload-preview-clear');

    if (epFileInput) {
        epFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                editEpisodeImageBase64 = event.target.result;
                if (epPreviewImg) epPreviewImg.src = editEpisodeImageBase64;
                if (epPreviewContainer) epPreviewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    }

    if (epClearBtn) {
        epClearBtn.addEventListener('click', () => {
            editEpisodeImageBase64 = null;
            if (epFileInput) epFileInput.value = '';
            if (epPreviewContainer) epPreviewContainer.style.display = 'none';
            if (epPreviewImg) epPreviewImg.src = '';
        });
    }

    const contestFileInput = document.getElementById('edit-contest-file-input');
    const contestPreviewContainer = document.getElementById('edit-contest-upload-preview-container');
    const contestPreviewImg = document.getElementById('edit-contest-upload-preview-img');
    const contestClearBtn = document.getElementById('edit-contest-upload-preview-clear');

    if (contestFileInput) {
        contestFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                editContestImageBase64 = event.target.result;
                if (contestPreviewImg) contestPreviewImg.src = editContestImageBase64;
                if (contestPreviewContainer) contestPreviewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    }

    if (contestClearBtn) {
        contestClearBtn.addEventListener('click', () => {
            editContestImageBase64 = null;
            if (contestFileInput) contestFileInput.value = '';
            if (contestPreviewContainer) contestPreviewContainer.style.display = 'none';
            if (contestPreviewImg) contestPreviewImg.src = '';
        });
    }

    // Forms submission hookup
    const editEpForm = document.getElementById('edit-ep-form');
    if (editEpForm) {
        editEpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('edit-ep-title').value.trim();
            const ytidRaw = document.getElementById('edit-ep-ytid').value.trim();
            const desc = document.getElementById('edit-ep-desc').value.trim();
            
            let thumb = document.getElementById('edit-ep-thumb').value.trim();
            const epUploadTabActive = document.getElementById('edit-ep-thumb-upload-tab').classList.contains('active');
            
            if (epUploadTabActive && editEpisodeImageBase64) {
                thumb = editEpisodeImageBase64;
            }
            
            if (!thumb) {
                thumb = 'assets/episode1.png';
            }
            
            const ytid = extractYoutubeVideoId(ytidRaw);
            
            if (!title || !ytid || !desc) {
                alert("⚠️ Please fill out all fields!");
                return;
            }
            
            if (editingEpisodeId) {
                const ep = state.episodes.find(item => item.id === editingEpisodeId);
                if (ep) {
                    ep.title = title;
                    ep.youtube_video_id = ytid;
                    ep.thumbnail_url = thumb;
                    ep.description = desc;
                    
                    state.saveEpisodes();
                    closeEditModal();
                    
                    // Refresh dynamic UI elements
                    renderAdminQuizSelect();
                    renderDashboard();
                    renderAdminManageView();
                    
                    alert(`🎉 Episode "${title}" successfully updated!`);
                    triggerConfettiVictoryFX();
                    triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
                }
            }
        });
    }

    const editContestForm = document.getElementById('edit-contest-form');
    if (editContestForm) {
        editContestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('edit-contest-title').value.trim();
            const desc = document.getElementById('edit-contest-desc').value.trim();
            
            let badge = document.getElementById('edit-contest-thumb').value.trim();
            const contestUploadTabActive = document.getElementById('edit-contest-thumb-upload-tab').classList.contains('active');
            
            if (contestUploadTabActive && editContestImageBase64) {
                badge = editContestImageBase64;
            }
            
            if (!badge) {
                badge = 'assets/crown.png';
            }
            
            if (!title || !desc) {
                alert("⚠️ Please fill out all fields!");
                return;
            }
            
            if (editingContestId) {
                const c = state.contests.find(item => item.id === editingContestId);
                if (c) {
                    c.title = title;
                    c.thumbnail_url = badge;
                    c.description = desc;
                    
                    state.saveContests();
                    closeEditModal();
                    
                    // Refresh dynamic UI elements
                    renderContests();
                    renderAdminManageView();
                    
                    alert(`🎉 Contest "${title}" successfully updated!`);
                    triggerConfettiVictoryFX();
                    triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
                }
            }
        });
    }
}

// --- 10. APP STARTUP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initCustomUploaders();
    initEditModal();
    // Admin forms hookup
    const adminEpisodeForm = document.getElementById('admin-episode-form');
    if (adminEpisodeForm) {
        adminEpisodeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('admin-ep-title').value.trim();
            const ytidRaw = document.getElementById('admin-ep-ytid').value.trim();
            const desc = document.getElementById('admin-ep-desc').value.trim();
            
            let thumb = document.getElementById('admin-ep-thumb').value.trim();
            const epUploadTab = document.getElementById('ep-thumb-upload-tab');
            if (epUploadTab && epUploadTab.classList.contains('active') && customEpisodeImageBase64) {
                thumb = customEpisodeImageBase64;
            }
            
            if (!thumb) {
                thumb = 'assets/episode1.png';
            }
            
            const ytid = extractYoutubeVideoId(ytidRaw);
            
            if (!title || !ytid || !desc) {
                alert("⚠️ Please fill out all fields!");
                return;
            }
            
            if (editingEpisodeId) {
                const ep = state.episodes.find(item => item.id === editingEpisodeId);
                if (ep) {
                    ep.title = title;
                    ep.youtube_video_id = ytid;
                    ep.thumbnail_url = thumb;
                    ep.description = desc;
                    
                    state.saveEpisodes();
                    
                    editingEpisodeId = null;
                    const submitBtn = document.getElementById('admin-ep-submit');
                    if (submitBtn) {
                        submitBtn.textContent = '🚀 SAVE EPISODE';
                        submitBtn.classList.remove('sb-btn-green');
                        submitBtn.classList.add('sb-btn-red');
                    }
                    
                    alert(`🎉 Episode "${title}" successfully updated!`);
                }
            } else {
                const newEpisode = {
                    id: 'ep-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    title: title,
                    youtube_video_id: ytid,
                    thumbnail_url: thumb,
                    order_index: state.episodes.length + 1,
                    description: desc
                };
                
                state.episodes.push(newEpisode);
                state.saveEpisodes();
                
                alert(`🎉 Episode "${title}" successfully added!`);
            }
            
            // Refresh dynamic UI elements
            renderAdminQuizSelect();
            renderDashboard();
            renderAdminManageView();
            
            // Reset form
            adminEpisodeForm.reset();
            
            // Reset custom image uploader
            customEpisodeImageBase64 = null;
            const epFileInput = document.getElementById('admin-ep-file-input');
            if (epFileInput) epFileInput.value = '';
            const epPreviewContainer = document.getElementById('ep-upload-preview-container');
            if (epPreviewContainer) epPreviewContainer.style.display = 'none';
            const epPreviewImg = document.getElementById('ep-upload-preview-img');
            if (epPreviewImg) epPreviewImg.src = '';
            
            // Re-activate link tab as default
            const epLinkTab = document.getElementById('ep-thumb-link-tab');
            const epUploadTabBtn = document.getElementById('ep-thumb-upload-tab');
            const epLinkPanel = document.getElementById('ep-thumb-link-panel');
            const epUploadPanel = document.getElementById('ep-thumb-upload-panel');
            if (epLinkTab && epUploadTabBtn) {
                epLinkTab.classList.add('active');
                epUploadTabBtn.classList.remove('active');
                if (epLinkPanel) epLinkPanel.style.display = 'block';
                if (epUploadPanel) epUploadPanel.style.display = 'none';
            }
            
            // Victory effects
            triggerConfettiVictoryFX();
            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
        });
    }

    const adminQuizForm = document.getElementById('admin-quiz-form');
    if (adminQuizForm) {
        adminQuizForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const epId = document.getElementById('admin-quiz-ep-select').value;
            const qtext = document.getElementById('admin-quiz-qtext').value.trim();
            const opt0 = document.getElementById('admin-quiz-opt0').value.trim();
            const opt1 = document.getElementById('admin-quiz-opt1').value.trim();
            const opt2 = document.getElementById('admin-quiz-opt2').value.trim();
            const opt3 = document.getElementById('admin-quiz-opt3').value.trim();
            const correctIdx = parseInt(document.getElementById('admin-quiz-correct').value);
            
            if (!epId || !qtext || !opt0 || !opt1 || !opt2 || !opt3) {
                alert("⚠️ Please fill out all quiz fields!");
                return;
            }
            
            const newQuestion = {
                question_text: qtext,
                options: [opt0, opt1, opt2, opt3],
                correct_option_index: correctIdx,
                coin_reward: 50
            };
            
            let quizSet = state.quizzes.find(q => q.episode_id === epId);
            if (quizSet) {
                quizSet.questions.push(newQuestion);
            } else {
                quizSet = {
                    episode_id: epId,
                    questions: [newQuestion]
                };
                state.quizzes.push(quizSet);
            }
            
            state.saveQuizzes();
            
            // Reset form
            adminQuizForm.reset();
            
            // Select the episode link again
            document.getElementById('admin-quiz-ep-select').value = epId;
            
            alert(`🎉 Quiz question successfully added to this episode!`);
            triggerConfettiVictoryFX();
            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
        });
    }

    const adminContestForm = document.getElementById('admin-contest-form');
    if (adminContestForm) {
        adminContestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('admin-contest-title').value.trim();
            const desc = document.getElementById('admin-contest-desc').value.trim();
            
            let badge = document.getElementById('admin-contest-thumb').value.trim();
            const contestUploadTab = document.getElementById('contest-thumb-upload-tab');
            if (contestUploadTab && contestUploadTab.classList.contains('active') && customContestImageBase64) {
                badge = customContestImageBase64;
            }
            
            if (!badge) {
                badge = 'assets/crown.png';
            }
            
            if (!title || !desc) {
                alert("⚠️ Please fill out all contest fields!");
                return;
            }
            
            if (editingContestId) {
                const c = state.contests.find(item => item.id === editingContestId);
                if (c) {
                    c.title = title;
                    c.thumbnail_url = badge;
                    c.description = desc;
                    
                    state.saveContests();
                    
                    editingContestId = null;
                    const submitBtn = document.getElementById('admin-contest-submit');
                    if (submitBtn) {
                        submitBtn.textContent = '🚀 SAVE CONTEST';
                        submitBtn.classList.remove('sb-btn-green');
                        submitBtn.classList.add('sb-btn-red');
                    }
                    
                    alert(`🎉 Contest "${title}" successfully updated!`);
                }
            } else {
                const newContest = {
                    id: 'contest-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    title: title,
                    description: desc,
                    thumbnail_url: badge,
                    points_reward: 200
                };
                
                state.contests.push(newContest);
                state.saveContests();
                
                alert(`🎉 Contest challenge successfully posted!`);
            }
            
            // Refresh dynamic UI elements
            renderContests();
            renderAdminManageView();
            
            // Reset form
            adminContestForm.reset();
            
            // Reset custom image uploader
            customContestImageBase64 = null;
            const contestFileInput = document.getElementById('admin-contest-file-input');
            if (contestFileInput) contestFileInput.value = '';
            const contestPreviewContainer = document.getElementById('contest-upload-preview-container');
            if (contestPreviewContainer) contestPreviewContainer.style.display = 'none';
            const contestPreviewImg = document.getElementById('contest-upload-preview-img');
            if (contestPreviewImg) contestPreviewImg.src = '';
            
            // Re-activate link tab as default
            const contestLinkTab = document.getElementById('contest-thumb-link-tab');
            const contestUploadTabBtn = document.getElementById('contest-thumb-upload-tab');
            const contestLinkPanel = document.getElementById('contest-thumb-link-panel');
            const contestUploadPanel = document.getElementById('contest-thumb-upload-panel');
            if (contestLinkTab && contestUploadTabBtn) {
                contestLinkTab.classList.add('active');
                contestUploadTabBtn.classList.remove('active');
                if (contestLinkPanel) contestLinkPanel.style.display = 'block';
                if (contestUploadPanel) contestUploadPanel.style.display = 'none';
            }
            
            triggerConfettiVictoryFX();
            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
        });
    }

    // Admin login form handler
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const usernameInput = document.getElementById('login-username').value.trim();
            const passwordInput = document.getElementById('login-password').value.trim();
            const errorMsg = document.getElementById('login-error-msg');
            const card = document.querySelector('.login-cyber-card');
            
            if (usernameInput === 'admin' && passwordInput === 'admin123') {
                state.isAdminLoggedIn = true;
                state.saveAdminAuth();
                
                if (errorMsg) errorMsg.style.display = 'none';
                
                triggerConfettiVictoryFX();
                triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
                
                renderAdminView();
            } else {
                if (errorMsg) errorMsg.style.display = 'block';
                
                if (card) {
                    card.classList.remove('error-shake');
                    void card.offsetWidth; // Force reflow
                    card.classList.add('error-shake');
                    setTimeout(() => {
                        card.classList.remove('error-shake');
                    }, 400);
                }
                
                document.getElementById('login-password').value = '';
            }
        });
    }

    // Toggle password visibility button
    const passToggleBtn = document.getElementById('toggle-password-visibility');
    const loginPassword = document.getElementById('login-password');
    if (passToggleBtn && loginPassword) {
        passToggleBtn.addEventListener('click', () => {
            if (loginPassword.type === 'password') {
                loginPassword.type = 'text';
                passToggleBtn.textContent = '🙈';
            } else {
                loginPassword.type = 'password';
                passToggleBtn.textContent = '👁️';
            }
        });
    }

    // Admin Logout button handler
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', () => {
            state.isAdminLoggedIn = false;
            state.saveAdminAuth();
            renderAdminView();
            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
        });
    }

    // Render initial statistics
    document.getElementById('star-coin-label').textContent = state.user.star_coins;
    document.getElementById('display-name-label').textContent = state.user.display_name;
    
    // Equip saved accessories
    renderEquippedGear();
    
    // Initialize admin view based on auth status
    renderAdminView();
    
    // Navigate home
    navigateTo('home');
});
