/* =====================================================================
   SUPER KID APP - REACTIVE ENGINE & GAMEPLAY LOGIC (ES6 JS)
   localStorage State Store, Canvas FX Particles, Audio Sim, Rewards Loop
   ===================================================================== */

// --- DATABASE SYNC CONFIGURATION (SUPABASE) ---
// To sync episodes, quizzes, contests, and submissions between the website 
// and the phone APK in real-time, create a free project at supabase.com,
// execute the 'db_init.sql' script in the Supabase SQL editor, and paste your credentials below:
const SUPABASE_CONFIG = {
    url: "",       // Paste your Supabase project URL here (e.g. "https://xyz.supabase.co")
    anonKey: ""    // Paste your Supabase anon public API key here
};

let supabaseClient = null;
if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey && typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log("⚡ Supabase Sync Engine Initialized!");
}

function getDeterministicUUID(str) {
    if (!str) return 'd8c2278e-6d1a-4c28-98e3-0d3a776c5b96'; // fallback to Leo Starry's seed UUID
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    let rawHex = Math.abs(hash).toString(16).padEnd(32, 'a');
    return `${rawHex.slice(0,8)}-${rawHex.slice(8,12)}-4${rawHex.slice(12,15)}-a${rawHex.slice(15,18)}-${rawHex.slice(18,30)}`;
}

// --- UTILITY STABILITY & SECURITY HELPERS ---
function safeInit(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        try {
            fn();
        } catch (e) {
            console.error("Initialization error:", e);
        }
    }
}

function safeJsonParse(str, fallback = null) {
    if (!str) return fallback;
    try {
        return JSON.parse(str);
    } catch (e) {
        console.error("JSON Parse Error in local storage:", e);
        return fallback;
    }
}

function sanitizeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        switch (m) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#039;';
            default: return m;
        }
    });
}

// --- 1. LOCAL DATA SEED (Fallback Database Simulation) ---
const MOCK_EPISODES = [
    {
        id: 'e1c12e87-0b1a-48d6-848e-653ea956bc01',
        title: 'ဖန်ဆင်းခြင်းအစ',
        youtube_video_id: 'R9K2Sj76L38',
        thumbnail_url: 'assets/episode1.png',
        order_index: 1,
        price: 0,
        description: "Travel with Gizmo the magical bubble portal and learn the miraculous power of God's love!"
    },
    {
        id: 'e2c23f88-1c2b-49e7-959f-764fb067cd02',
        title: 'ပေးဆပ်ခြင်းရဲ့ အကောင်းဆုံးလက်ဆောင်',
        youtube_video_id: 'JtV_n6dMh_s',
        thumbnail_url: 'assets/episode2.png',
        order_index: 2,
        price: 0,
        description: "Chase the beautiful rainbow jellyfish as the cosmic ocean and discover why sharing brings joy!"
    },
    {
        id: 'e3c34a99-2d3c-4bf8-a6af-875fc178de03',
        title: 'Mystery of the Floating Candies',
        youtube_video_id: 'rC78Q7kYdDk',
        thumbnail_url: 'assets/episode3.png',
        order_index: 3,
        price: 150,
        description: 'Solve the mysterious floating candies phenomenon while uncovering the secrets of kind hearts and sweet friendship!'
    },
    {
        id: 'e4c45d99-3e4d-4cf9-b7af-985fc289de04',
        title: 'Moses and the Great Escape!',
        youtube_video_id: '01QkS49n6_0',
        thumbnail_url: 'assets/episode4.png',
        order_index: 4,
        price: 300,
        description: 'Join Gizmo and Moses as they stand before Pharaoh, witness the ten plagues, and escape across the parted Red Sea!'
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
    },
    {
        id: 'c4c45d99-3e4d-4cf9-b7af-985fc289de04',
        title: 'Parting the Red Sea Art Challenge',
        description: 'Draw Moses raising his staff as the giant walls of the Red Sea part! Include cute fish swimming inside the water walls and Gizmo cheering in the middle. Submit your drawing to earn rewards!',
        thumbnail_url: 'assets/quest_moses.png',
        points_reward: 200
    }
];

const GENERAL_QUIZ_QUESTIONS = [
    {
        question_text: "ဘုရားသခင်က ကောင်းကင်နှင့်မြေကြီးကို ဘယ်နှစ်ရက်အတွင်း ဖန်ဆင်းခဲ့သလဲ။ (In how many days did God create heaven and earth?)",
        options: ["၅ ရက် (5 days)", "၆ ရက် (6 days)", "၇ ရက် (7 days)", "၈ ရက် (8 days)"],
        correct_option_index: 1,
        coin_reward: 50
    },
    {
        question_text: "ရေလွှမ်းမိုးဘေးမှ လွတ်မြောက်ရန် သဘောင်္ကြီးကို တည်ဆောက်ခဲ့သူမှာ မည်သူနည်း။ (Who built the large ark to survive the flood?)",
        options: ["နောဧ (Noah)", "မောရှေ (Moses)", "အာဗြဟံ (Abraham)", "ဒါဝိဒ် (David)"],
        correct_option_index: 0,
        coin_reward: 50
    },
    {
        question_text: "ဂေါလျတ်အမည်ရှိသော လူ့ဘီလူးကြီးကို အောင်နိုင်ခဲ့သည့် သိုးထိန်းလေးမှာ မည်သူနည်း။ (Who was the shepherd boy who defeated Goliath?)",
        options: ["ရှောလု (Saul)", "ရှာမွေလ (Samuel)", "ဒါဝိဒ် (David)", "ရှောလမုန် (Solomon)"],
        correct_option_index: 2,
        coin_reward: 50
    },
    {
        question_text: "ဓမ္မဟောင်းကျမ်း၏ ပထမဆုံးကျမ်းမှာ မည်သည့်ကျမ်းနည်း။ (What is the first book of the Old Testament?)",
        options: ["ထွက်မြောက်ရာကျမ်း (Exodus)", "ဝတ်ပြုရာကျမ်း (Leviticus)", "ကမ္ဘာဦးကျမ်း (Genesis)", "တရားဟောရာကျမ်း (Deuteronomy)"],
        correct_option_index: 2,
        coin_reward: 50
    },
    {
        question_text: "ယေရှုခရစ်တော် မွေးဖွားရာမြို့မှာ မည်သည့်မြို့ဖြစ်သနည်း။ (Where was Jesus Christ born?)",
        options: ["နာဇရက်မြို့ (Nazareth)", "ဂျေရုဆလင်မြို့ (Jerusalem)", "ဗက်လင်ဟင်မြို့ (Bethlehem)", "ယေရိခေါမြို့ (Jericho)"],
        correct_option_index: 2,
        coin_reward: 50
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
    },
    {
        episode_id: 'e4c45d99-3e4d-4cf9-b7af-985fc289de04',
        questions: [
            {
                question_text: 'What did Moses use to part the Red Sea?',
                options: ['His shepherd\'s staff', 'A golden sword', 'A giant net', 'A plasma blaster'],
                correct_option_index: 0,
                coin_reward: 50
            },
            {
                question_text: 'How many plagues did God send upon Egypt?',
                options: ['3 plagues', '5 plagues', '7 plagues', '10 plagues'],
                correct_option_index: 3,
                coin_reward: 50
            },
            {
                question_text: 'What did God use to lead the people by day?',
                options: ['A pillar of cloud', 'A golden arrow', 'A floating compass', 'A mapping drone'],
                correct_option_index: 0,
                coin_reward: 50
            },
            {
                question_text: 'What food fell from heaven to feed the people in the desert?',
                options: ['Manna', 'Jellyfish candies', 'Space cookies', 'Fruit loops'],
                correct_option_index: 0,
                coin_reward: 50
            },
            {
                question_text: 'Which sea did the Israelites cross on dry land?',
                options: ['The Red Sea', 'The Blue Sea', 'The Bubble Ocean', 'The Dead Sea'],
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

    syncDbToStorage() {
        if (this._saveTimeout) clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => {
            localStorage.setItem('superkid_users_db', JSON.stringify(this.usersDb));
        }, 50);
    }

    loadOrCreateState() {
        // 1. Initialize user database if not present
        const storedDb = localStorage.getItem('superkid_users_db');
        let usersDb = safeJsonParse(storedDb, []);
        
        if (!usersDb || usersDb.length === 0) {
            // Seed default simulated user accounts
            usersDb = [
                {
                    email: 'jsianhung@gmail.com',
                    display_name: 'Jsianhung',
                    star_coins: 1000,
                    xp: 50,
                    level: 5,
                    avatar_custom_data: { equipped_gear: null },
                    unlocked_index: 4,
                    is_premium: true,
                    is_admin: true,
                    is_banned: false,
                    ownedItems: [],
                    purchased_episodes: []
                },
                {
                    email: 'leo@gmail.com',
                    display_name: 'Leo Starry',
                    star_coins: 100,
                    xp: 25,
                    level: 1,
                    avatar_custom_data: { equipped_gear: null },
                    unlocked_index: 1,
                    is_premium: false,
                    is_admin: false,
                    is_banned: false,
                    ownedItems: [],
                    purchased_episodes: []
                },
                {
                    email: 'gizmo_fan@gmail.com',
                    display_name: 'GizmoFan',
                    star_coins: 300,
                    xp: 95,
                    level: 3,
                    avatar_custom_data: { equipped_gear: null },
                    unlocked_index: 2,
                    is_premium: true,
                    is_admin: false,
                    is_banned: false,
                    ownedItems: [],
                    purchased_episodes: []
                },
                {
                    email: 'test_banned@gmail.com',
                    display_name: 'NaughtyUser',
                    star_coins: 0,
                    xp: 10,
                    level: 1,
                    avatar_custom_data: { equipped_gear: null },
                    unlocked_index: 1,
                    is_premium: false,
                    is_admin: false,
                    is_banned: true,
                    ownedItems: [],
                    purchased_episodes: []
                }
            ];
            localStorage.setItem('superkid_users_db', JSON.stringify(usersDb));
        }
        
        this.usersDb = usersDb;
        
        // 2. Fetch logged in user email
        let loggedInEmail = localStorage.getItem('appUserEmail');
        
        // Force logout if banned
        if (loggedInEmail) {
            const userRecord = this.usersDb.find(u => u.email.toLowerCase() === loggedInEmail.toLowerCase());
            if (userRecord && userRecord.is_banned) {
                localStorage.removeItem('appUserLoggedIn');
                localStorage.removeItem('appUserEmail');
                loggedInEmail = null;
                alert("🚫 Your account has been banned by the Administrator.");
            }
        }
        
        // If not logged in at all, load 'leo@gmail.com' profile as guest (but DO NOT flag as logged in)
        if (!loggedInEmail) {
            loggedInEmail = 'leo@gmail.com';
            localStorage.setItem('appUserEmail', loggedInEmail);
            localStorage.removeItem('appUserLoggedIn'); // Ensure the login screen overlay triggers
        }
        
        // 3. Find or register user profile record
        let userRecord = this.usersDb.find(u => u.email.toLowerCase() === loggedInEmail.toLowerCase());
        if (!userRecord) {
            const rawName = loggedInEmail.split('@')[0];
            const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
            userRecord = {
                email: loggedInEmail,
                display_name: formattedName,
                star_coins: 100,
                xp: 0,
                level: 1,
                avatar_custom_data: { equipped_gear: null },
                unlocked_index: 1,
                is_premium: false,
                is_admin: loggedInEmail.toLowerCase() === 'jsianhung@gmail.com',
                is_banned: false,
                ownedItems: [],
                purchased_episodes: [],
                youtube_channel_url: 'https://www.youtube.com/@superbookmyanmar4188',
                youtube_channel_name: 'Superbook Myanmar'
            };
            this.usersDb.push(userRecord);
            localStorage.setItem('superkid_users_db', JSON.stringify(this.usersDb));
        }
        
        // 4. Set state properties
        this.user = {
            id: userRecord.email,
            email: userRecord.email,
            display_name: userRecord.display_name,
            star_coins: userRecord.star_coins,
            xp: userRecord.xp,
            level: userRecord.level,
            avatar_custom_data: userRecord.avatar_custom_data || { equipped_gear: null },
            unlocked_index: userRecord.unlocked_index || 1,
            is_premium: !!userRecord.is_premium,
            is_admin: userRecord.email.toLowerCase() === 'jsianhung@gmail.com',
            is_banned: !!userRecord.is_banned,
            purchased_episodes: userRecord.purchased_episodes || [],
            youtube_channel_url: userRecord.youtube_channel_url || 'https://www.youtube.com/@superbookmyanmar4188',
            youtube_channel_name: userRecord.youtube_channel_name || 'Superbook Myanmar'
        };
        this.ownedItems = userRecord.ownedItems || [];
        
        // Sync local storage keys for legacy compatibility
        localStorage.setItem('superkid_user', JSON.stringify(this.user));
        localStorage.setItem('superkid_owned', JSON.stringify(this.ownedItems));

        const storedEpisodes = localStorage.getItem('superkid_episodes');
        if (storedEpisodes) {
            this.episodes = safeJsonParse(storedEpisodes, MOCK_EPISODES);
            // Upgrade path for new episodes
            if (this.episodes.length < MOCK_EPISODES.length) {
                this.episodes = MOCK_EPISODES;
                this.saveEpisodes();
            } else {
                // Migrate old English default titles/thumbnails to new Burmese/Biblical versions
                let migrated = false;
                this.episodes.forEach(ep => {
                    if (ep.title === 'Journey to the Bubble Planet!' || ep.title === 'Journey to the Bubble Planet') {
                        ep.title = 'ဖန်ဆင်းခြင်းအစ';
                        ep.thumbnail_url = 'assets/jesus_teaching.png';
                        migrated = true;
                    }
                    if (ep.title === 'The Rainbow Jellyfish Chase') {
                        ep.title = 'ပေးဆပ်ခြင်းရဲ့ အကောင်းဆုံးလက်ဆောင်';
                        ep.thumbnail_url = 'assets/story_creation.png';
                        migrated = true;
                    }
                });
                if (migrated) {
                    this.saveEpisodes();
                }
            }
        } else {
            this.episodes = MOCK_EPISODES;
            this.saveEpisodes();
        }

        const storedQuizzes = localStorage.getItem('superkid_quizzes');
        if (storedQuizzes) {
            this.quizzes = safeJsonParse(storedQuizzes, MOCK_QUIZZES);
            if (this.quizzes.length < MOCK_QUIZZES.length) {
                this.quizzes = MOCK_QUIZZES;
                this.saveQuizzes();
            }
        } else {
            this.quizzes = MOCK_QUIZZES;
            this.saveQuizzes();
        }

        const storedContests = localStorage.getItem('superkid_contests');
        if (storedContests) {
            this.contests = safeJsonParse(storedContests, MOCK_CONTESTS);
            if (this.contests.length < MOCK_CONTESTS.length) {
                this.contests = MOCK_CONTESTS;
                this.saveContests();
            }
        } else {
            this.contests = MOCK_CONTESTS;
            this.saveContests();
        }

        this.shopItems = SHOP_ITEMS;

        const storedSubmissions = localStorage.getItem('superkid_submissions');
        if (storedSubmissions) {
            this.submissions = safeJsonParse(storedSubmissions, []);
        } else {
            this.submissions = [];
            this.saveSubmissions();
        }

        const storedAdminAuth = localStorage.getItem('superkid_admin_auth');
        this.isAdminLoggedIn = storedAdminAuth === 'true';
        
        // Streak Tracking
        const storedStreak = localStorage.getItem('superkid_streak');
        if (storedStreak) {
            this.streak = safeJsonParse(storedStreak, null);
            if (!this.streak) {
                this.resetStreak();
            } else if (this.streak.completedDays && !this.streak.completedDates) {
                const today = new Date();
                this.streak.completedDates = [];
                this.streak.completedDays.forEach((done, i) => {
                    if (done) {
                        const d = new Date(today);
                        d.setDate(today.getDate() - (5 - i));
                        this.streak.completedDates.push(d.toISOString().split('T')[0]);
                    }
                });
                delete this.streak.completedDays;
                this.saveStreak();
            }
        } else {
            this.resetStreak();
        }

        // Non-persisted UI states
        this.currentScreen = 'dashboard';
        this.activeEpisode = null;
        this.activeQuizIndex = 0;
        this.activeQuizScore = 0;
        this.activeQuizTotalCoins = 0;
        this.activeContestId = null;
        this.selectedFile = null;
        
        // Calendar view state
        this.calendarViewDate = new Date();

        // Run self-healing merge to reconcile any code updates with device cache
        this.mergeCodeToCache();

        // Start asynchronous background synchronization with the Supabase database (if configured)
        this.syncWithCloudDatabase();
    }

    mergeCodeToCache() {
        let updated = false;

        // 1. Merge Episodes
        MOCK_EPISODES.forEach(mockEp => {
            const cachedEp = this.episodes.find(ep => ep.id === mockEp.id);
            if (!cachedEp) {
                this.episodes.push(JSON.parse(JSON.stringify(mockEp)));
                updated = true;
            } else {
                if (cachedEp.title !== mockEp.title ||
                    cachedEp.youtube_video_id !== mockEp.youtube_video_id ||
                    cachedEp.thumbnail_url !== mockEp.thumbnail_url ||
                    cachedEp.description !== mockEp.description ||
                    cachedEp.price !== mockEp.price) {
                    
                    cachedEp.title = mockEp.title;
                    cachedEp.youtube_video_id = mockEp.youtube_video_id;
                    cachedEp.thumbnail_url = mockEp.thumbnail_url;
                    cachedEp.description = mockEp.description;
                    cachedEp.price = mockEp.price;
                    updated = true;
                }
            }
        });

        // 2. Merge Quizzes
        MOCK_QUIZZES.forEach(mockQuiz => {
            const cachedQuiz = this.quizzes.find(q => q.episode_id === mockQuiz.episode_id);
            if (!cachedQuiz) {
                this.quizzes.push(JSON.parse(JSON.stringify(mockQuiz)));
                updated = true;
            } else {
                const mockQuestionsStr = JSON.stringify(mockQuiz.questions);
                const cachedQuestionsStr = JSON.stringify(cachedQuiz.questions);
                if (mockQuestionsStr !== cachedQuestionsStr) {
                    cachedQuiz.questions = JSON.parse(mockQuestionsStr);
                    updated = true;
                }
            }
        });

        // 3. Merge Contests
        MOCK_CONTESTS.forEach(mockContest => {
            const cachedContest = this.contests.find(c => c.id === mockContest.id);
            if (!cachedContest) {
                this.contests.push(JSON.parse(JSON.stringify(mockContest)));
                updated = true;
            } else {
                if (cachedContest.title !== mockContest.title ||
                    cachedContest.description !== mockContest.description ||
                    cachedContest.thumbnail_url !== mockContest.thumbnail_url ||
                    cachedContest.points_reward !== mockContest.points_reward) {
                    
                    cachedContest.title = mockContest.title;
                    cachedContest.description = mockContest.description;
                    cachedContest.thumbnail_url = mockContest.thumbnail_url;
                    cachedContest.points_reward = mockContest.points_reward;
                    updated = true;
                }
            }
        });

        if (updated) {
            console.log("⚡ Auto-Merge: Synced modified hardcoded content to local cache.");
            this.saveEpisodes();
            this.saveQuizzes();
            this.saveContests();
        }
    }

    async syncWithCloudDatabase() {
        if (!supabaseClient) return;

        console.log("🔄 Background Sync: Connecting to Supabase cloud...");
        try {
            // 1. Fetch Episodes
            const { data: episodesData, error: epError } = await supabaseClient
                .from('episodes')
                .select('*')
                .order('order_index', { ascending: true });

            if (epError) throw epError;

            if (episodesData && episodesData.length > 0) {
                this.episodes = episodesData.map(ep => ({
                    id: ep.id,
                    title: ep.title,
                    youtube_video_id: ep.youtube_video_id,
                    thumbnail_url: ep.thumbnail_url,
                    order_index: ep.order_index,
                    price: ep.price !== undefined && ep.price !== null ? ep.price : 0,
                    description: ep.description || ""
                }));
                this.saveEpisodes();
            }

            // 2. Fetch Quizzes
            const { data: quizzesData, error: qError } = await supabaseClient
                .from('quizzes')
                .select('*');

            if (qError) throw qError;

            if (quizzesData) {
                const groupedQuizzes = [];
                quizzesData.forEach(q => {
                    let epQuiz = groupedQuizzes.find(g => g.episode_id === q.episode_id);
                    if (!epQuiz) {
                        epQuiz = { episode_id: q.episode_id, questions: [] };
                        groupedQuizzes.push(epQuiz);
                    }
                    epQuiz.questions.push({
                        question_text: q.question_text,
                        options: q.options,
                        correct_option_index: q.correct_option_index,
                        coin_reward: q.coin_reward
                    });
                });
                if (groupedQuizzes.length > 0) {
                    this.quizzes = groupedQuizzes;
                    this.saveQuizzes();
                }
            }

            // 3. Fetch Contests
            const { data: contestsData, error: cError } = await supabaseClient
                .from('contests')
                .select('*');

            if (cError) throw cError;

            if (contestsData && contestsData.length > 0) {
                this.contests = contestsData.map(c => ({
                    id: c.id,
                    title: c.title,
                    description: c.description,
                    thumbnail_url: c.thumbnail_url,
                    points_reward: c.points_reward
                }));
                this.saveContests();
            }

            // 4. Fetch Submissions
            const { data: submissionsData, error: sError } = await supabaseClient
                .from('contest_submissions')
                .select(`
                    id,
                    user_id,
                    contest_id,
                    submission_text,
                    submission_attachment_url,
                    status,
                    created_at,
                    users_profile (
                        display_name
                    ),
                    contests (
                        title,
                        points_reward
                    )
                `);

            if (sError) throw sError;

            if (submissionsData) {
                this.submissions = submissionsData.map(s => ({
                    id: s.id,
                    user_id: s.user_id,
                    user_name: s.users_profile ? s.users_profile.display_name : "Unknown Student",
                    contest_id: s.contest_id,
                    contest_title: s.contests ? s.contests.title : "Bible Challenge",
                    submission_text: s.submission_text || "",
                    attachment_name: s.submission_attachment_url || "",
                    status: s.status || "pending",
                    points_reward: s.contests ? s.contests.points_reward : 200,
                    created_at: s.created_at
                }));
                this.saveSubmissions();
            }

            console.log("✅ Background Sync: Loaded and cached cloud database updates successfully!");

            // Refresh dynamic UI elements
            if (typeof renderDashboard === 'function') renderDashboard();
            if (typeof renderAdminManageView === 'function') renderAdminManageView();
            if (typeof renderAdminQuizSelect === 'function') renderAdminQuizSelect();
            if (typeof renderContests === 'function') renderContests();
            if (typeof renderSubmissionsLedger === 'function') renderSubmissionsLedger();
            if (typeof renderAdminSubmissionsTable === 'function') renderAdminSubmissionsTable();

        } catch (err) {
            console.warn("⚠️ Background sync paused or failed:", err.message);
        }
    }

    async cloudUpsertEpisode(episode) {
        if (!supabaseClient) return;
        try {
            const { error } = await supabaseClient
                .from('episodes')
                .upsert({
                    id: episode.id,
                    title: episode.title,
                    youtube_video_id: episode.youtube_video_id,
                    thumbnail_url: episode.thumbnail_url,
                    order_index: episode.order_index,
                    price: episode.price,
                    description: episode.description
                });
            if (error) throw error;
            console.log("☁️ Supabase: Episode successfully synchronized!");
        } catch (err) {
            console.error("❌ Supabase Upsert Episode error:", err.message);
        }
    }

    async cloudDeleteEpisode(episodeId) {
        if (!supabaseClient) return;
        try {
            const { error } = await supabaseClient
                .from('episodes')
                .delete()
                .eq('id', episodeId);
            if (error) throw error;
            console.log("☁️ Supabase: Episode successfully deleted from cloud!");
        } catch (err) {
            console.error("❌ Supabase Delete Episode error:", err.message);
        }
    }

    async cloudUpsertQuiz(quiz) {
        if (!supabaseClient) return;
        try {
            // Clear existing questions for this episode in Supabase, and write the updated list
            const { error: delError } = await supabaseClient
                .from('quizzes')
                .delete()
                .eq('episode_id', quiz.episode_id);
            if (delError) throw delError;

            const questionsToInsert = quiz.questions.map(q => ({
                episode_id: quiz.episode_id,
                question_text: q.question_text,
                options: q.options,
                correct_option_index: q.correct_option_index,
                coin_reward: q.coin_reward
            }));

            if (questionsToInsert.length > 0) {
                const { error: insError } = await supabaseClient
                    .from('quizzes')
                    .insert(questionsToInsert);
                if (insError) throw insError;
            }
            console.log("☁️ Supabase: Quizzes successfully synchronized!");
        } catch (err) {
            console.error("❌ Supabase Upsert Quiz error:", err.message);
        }
    }

    async cloudUpsertContest(contest) {
        if (!supabaseClient) return;
        try {
            const { error } = await supabaseClient
                .from('contests')
                .upsert({
                    id: contest.id,
                    title: contest.title,
                    description: contest.description,
                    thumbnail_url: contest.thumbnail_url,
                    points_reward: contest.points_reward
                });
            if (error) throw error;
            console.log("☁️ Supabase: Contest successfully synchronized!");
        } catch (err) {
            console.error("❌ Supabase Upsert Contest error:", err.message);
        }
    }

    async cloudDeleteContest(contestId) {
        if (!supabaseClient) return;
        try {
            const { error } = await supabaseClient
                .from('contests')
                .delete()
                .eq('id', contestId);
            if (error) throw error;
            console.log("☁️ Supabase: Contest successfully deleted from cloud!");
        } catch (err) {
            console.error("❌ Supabase Delete Contest error:", err.message);
        }
    }

    async cloudUpsertSubmission(submission) {
        if (!supabaseClient) return;
        try {
            const userUuid = getDeterministicUUID(submission.user_id || 'leo@gmail.com');
            
            // First, make sure the user profile exists in public.users_profile to satisfy references check
            const { error: profileError } = await supabaseClient
                .from('users_profile')
                .upsert({
                    id: userUuid,
                    display_name: submission.user_name || "Unknown Student",
                    star_coins: this.user.star_coins
                });
            if (profileError) throw profileError;

            const { error } = await supabaseClient
                .from('contest_submissions')
                .upsert({
                    id: getDeterministicUUID(submission.id), // Ensure it is a valid UUID
                    user_id: userUuid,
                    contest_id: submission.contest_id,
                    submission_text: submission.submission_text,
                    submission_attachment_url: submission.attachment_name,
                    status: submission.status
                });
            if (error) throw error;
            console.log("☁️ Supabase: Contest Submission successfully synchronized!");
        } catch (err) {
            console.error("❌ Supabase Upsert Submission error:", err.message);
        }
    }


    resetStreak() {
        const todayStr = new Date().toISOString().split('T')[0];
        this.streak = {
            daysCount: 1,
            weeksCount: 0,
            completedDates: [todayStr]
        };
        this.saveStreak();
    }

    saveUser() {
        localStorage.setItem('superkid_user', JSON.stringify(this.user));
        this.syncUserToDb();
    }

    saveOwned() {
        localStorage.setItem('superkid_owned', JSON.stringify(this.ownedItems));
        this.syncUserToDb();
    }

    syncUserToDb() {
        const loggedInEmail = localStorage.getItem('appUserEmail');
        if (!loggedInEmail) return;
        
        let recordIndex = this.usersDb.findIndex(u => u.email.toLowerCase() === loggedInEmail.toLowerCase());
        if (recordIndex !== -1) {
            this.usersDb[recordIndex].display_name = this.user.display_name;
            this.usersDb[recordIndex].star_coins = this.user.star_coins;
            this.usersDb[recordIndex].xp = this.user.xp;
            this.usersDb[recordIndex].level = this.user.level;
            this.usersDb[recordIndex].avatar_custom_data = this.user.avatar_custom_data;
            this.usersDb[recordIndex].unlocked_index = this.user.unlocked_index;
            this.usersDb[recordIndex].is_premium = !!this.user.is_premium;
            this.usersDb[recordIndex].is_admin = loggedInEmail.toLowerCase() === 'jsianhung@gmail.com';
            this.usersDb[recordIndex].is_banned = !!this.user.is_banned;
            this.usersDb[recordIndex].ownedItems = this.ownedItems;
            this.usersDb[recordIndex].purchased_episodes = this.user.purchased_episodes || [];
            this.usersDb[recordIndex].youtube_channel_url = this.user.youtube_channel_url;
            this.usersDb[recordIndex].youtube_channel_name = this.user.youtube_channel_name;
            
            this.syncDbToStorage();
        }
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

    saveStreak() {
        localStorage.setItem('superkid_streak', JSON.stringify(this.streak));
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

    incrementXP(amount) {
        if (this.user.xp === undefined) this.user.xp = 0;
        if (this.user.level === undefined) this.user.level = 1;

        this.user.xp += amount;

        // Level Up Threshold: 100 XP per level
        let leveledUp = false;
        while (this.user.xp >= 100) {
            this.user.xp -= 100;
            this.user.level++;
            leveledUp = true;
        }

        this.saveUser();
        this.updateXPHeader();

        if (leveledUp) {
            // Level Up celebration
            triggerConfettiVictoryFX();
            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
            alert(`🎉 LEVEL UP! You reached LEVEL ${this.user.level}! Keep reading and playing to level up!`);
        }
    }

    updateXPHeader() {
        if (this.user.xp === undefined) this.user.xp = 0;
        if (this.user.level === undefined) this.user.level = 1;

        const xpFill = document.getElementById('header-xp-progress-fill');
        const xpLabel = document.getElementById('header-xp-label');

        if (xpFill) {
            xpFill.style.width = `${this.user.xp}%`;
        }
        if (xpLabel) {
            xpLabel.textContent = `LV.${this.user.level} (${this.user.xp}/100)`;
        }
        const avatarLevel = document.getElementById('header-avatar-level-badge');
        if (avatarLevel) {
            avatarLevel.textContent = `LV.${this.user.level}`;
        }
    }

    saveStreak() {
        localStorage.setItem('superkid_streak', JSON.stringify(this.streak));
    }

    renderStreakCalendar() {
        const streakDaysLabel = document.getElementById('streak-days-label');
        const streakWeeksLabel = document.getElementById('streak-weeks-label');
        const streakBoostLabel = document.getElementById('streak-boost-label');

        if (streakDaysLabel) streakDaysLabel.textContent = `${this.streak.daysCount} DAY${this.streak.daysCount > 1 ? 'S' : ''}`;
        if (streakWeeksLabel) streakWeeksLabel.textContent = `${this.streak.weeksCount} WEEK${this.streak.weeksCount > 1 ? 'S' : ''}`;
        if (streakBoostLabel) {
            const boost = this.streak.daysCount >= 7 ? '🔥 ON FIRE!' : this.streak.daysCount >= 3 ? '⚡ BOOSTED!' : '📖 KEEP GOING!';
            streakBoostLabel.textContent = boost;
        }

        this.renderFullMonthCalendar();
    }

    renderFullMonthCalendar() {
        const grid = document.getElementById('cal-days-grid');
        const label = document.getElementById('cal-month-year-label');
        if (!grid || !label) return;

        const viewDate = this.calendarViewDate || new Date();
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
                        'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
        label.textContent = `${MONTHS[month]} ${year}`;

        // Get first day of month and total days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const completedDates = new Set(this.streak.completedDates || []);

        grid.innerHTML = '';

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'cal-day-cell empty';
            grid.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const cellDate = new Date(year, month, day);
            const cellStr = cellDate.toISOString().split('T')[0];

            const cell = document.createElement('div');
            cell.textContent = day;

            const isToday = cellStr === todayStr;
            const isCompleted = completedDates.has(cellStr);
            const isFuture = cellDate > today && !isToday;

            if (isCompleted && !isToday) {
                cell.className = 'cal-day-cell completed';
                cell.title = '✅ Bible study completed!';
            } else if (isToday) {
                cell.className = isCompleted ? 'cal-day-cell today completed' : 'cal-day-cell today';
                cell.title = 'Today';
            } else if (isFuture) {
                cell.className = 'cal-day-cell future-day';
            } else {
                cell.className = 'cal-day-cell active-day';
                // Past days can be clicked to mark study completed retroactively (up to 2 days back)
                const daysDiff = Math.floor((today - cellDate) / (1000 * 60 * 60 * 24));
                if (daysDiff <= 2) {
                    cell.addEventListener('click', () => {
                        if (!completedDates.has(cellStr)) {
                            this.markDayCompleted(cellStr);
                        }
                    });
                } else {
                    cell.classList.add('future-day');
                    cell.classList.remove('active-day');
                }
            }

            // Today click = mark complete
            if (isToday && !isCompleted) {
                cell.style.cursor = 'pointer';
                cell.addEventListener('click', (e) => {
                    lastClickX = e.clientX;
                    lastClickY = e.clientY;
                    this.markDayCompleted(todayStr);
                });
            }

            grid.appendChild(cell);
        }
    }

    markDayCompleted(dateStr) {
        if (!this.streak.completedDates) this.streak.completedDates = [];
        if (this.streak.completedDates.includes(dateStr)) return;

        this.streak.completedDates.push(dateStr);
        this.streak.daysCount = this.streak.completedDates.length;
        this.streak.weeksCount = Math.floor(this.streak.daysCount / 7);
        this.saveStreak();
        this.renderStreakCalendar();

        // Reward
        this.incrementCoins(20);
        this.incrementXP(20);
        triggerBubblePopFX(lastClickX || window.innerWidth / 2, lastClickY || window.innerHeight / 2);
    }

    setupStreakCalendarInteractivity() {
        // Calendar prev/next month navigation
        const prevBtn = document.getElementById('cal-prev-month');
        const nextBtn = document.getElementById('cal-next-month');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (!this.calendarViewDate) this.calendarViewDate = new Date();
                this.calendarViewDate.setMonth(this.calendarViewDate.getMonth() - 1);
                this.renderFullMonthCalendar();
                triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (!this.calendarViewDate) this.calendarViewDate = new Date();
                const now = new Date();
                const nextMonth = new Date(this.calendarViewDate);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                // Don't navigate past current month
                if (nextMonth <= now || (nextMonth.getMonth() === now.getMonth() && nextMonth.getFullYear() === now.getFullYear())) {
                    this.calendarViewDate.setMonth(this.calendarViewDate.getMonth() + 1);
                    this.renderFullMonthCalendar();
                    triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
                }
            });
        }
    }
}

let state = new AppState();

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
        activeTabId = 'tab-watch-btn';
    } else if (screenId === 'games' || screenId === 'quizzes' || screenId === 'quiz') {
        activeTabId = 'tab-games-btn';
    } else if (screenId === 'bible') {
        activeTabId = 'tab-bible-btn';
    } else if (screenId === 'contests') {
        activeTabId = 'tab-quests-btn';
    } else if (screenId === 'parent' || screenId === 'admin') {
        activeTabId = 'tab-parent-btn';
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
    'games': 2,
    'quizzes': 2.1,
    'quiz': 2.2,
    'contests': 3,
    'settings': 4,
    'shop': 4.5,
    'parent': 4.7,
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
    } else if (screenId === 'games') {
        gsap.fromTo('.games-arcade-card', 
            { y: 60, opacity: 0, scale: 0.9, rotateY: 10 }, 
            { y: 0, opacity: 1, scale: 1, rotateY: 0, duration: 0.55, stagger: 0.1, ease: "back.out(1.15)" }
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
    } else if (screenId === 'games') {
        renderGamesHub();
    } else if (screenId === 'quizzes') {
        renderQuizzesSelect();
    } else if (screenId === 'contests') {
        renderContests();
    } else if (screenId === 'shop') {
        renderShop();
    } else if (screenId === 'parent') {
        if (window._newRenderAdminView) {
            window._newRenderAdminView();
        } else {
            renderAdminView();
        }
    } else if (screenId === 'admin') {
        const appUserEmail = localStorage.getItem('appUserEmail') || '';
        if (appUserEmail.toLowerCase() !== 'jsianhung@gmail.com') {
            if (confirm('🔒 ADMIN MAINFRAME DECRYPTION REQUIRED\n\nOnly the owner (jsianhung@gmail.com) is permitted to access the Admin Control Center.\n\nWould you like to log in as the Administrator profile now?')) {
                // Log in as jsianhung@gmail.com
                localStorage.setItem('appUserEmail', 'jsianhung@gmail.com');
                localStorage.setItem('appUserLoggedIn', 'true');
                
                // Fetch/register user record
                let usersDb = state.usersDb;
                let userRecord = usersDb.find(u => u.email.toLowerCase() === 'jsianhung@gmail.com');
                if (!userRecord) {
                    userRecord = {
                        email: 'jsianhung@gmail.com',
                        display_name: 'Jsianhung',
                        star_coins: 1000,
                        xp: 50,
                        level: 5,
                        avatar_custom_data: { equipped_gear: null },
                        unlocked_index: 4,
                        is_premium: true,
                        is_admin: true,
                        is_banned: false,
                        ownedItems: [],
                        purchased_episodes: []
                    };
                    usersDb.push(userRecord);
                    state.syncDbToStorage();
                }
                
                // Set active user state and re-initialize in-memory
                localStorage.setItem('superkid_user', JSON.stringify(userRecord));
                
                state = new AppState();
                setupHomeV3();
                if (typeof renderDashboard === 'function') renderDashboard();
                if (typeof renderShop === 'function') renderShop();
                if (typeof renderQuests === 'function') renderQuests();
                
                const headerCoins = document.getElementById('star-coin-label');
                if (headerCoins) headerCoins.textContent = state.user.star_coins || 0;
                const drawerCoins = document.getElementById('drawer-coins-val');
                if (drawerCoins) drawerCoins.textContent = state.user.star_coins || 0;

                state.isAdminLoggedIn = true;
                state.saveAdminAuth();
                renderAdminView();
                
                setTimeout(() => { navigateTo('admin'); }, 50);
                return;
            }
            setTimeout(() => { navigateTo('dashboard'); }, 50);
            return;
        }
        
        // Grant admin status for this session
        state.isAdminLoggedIn = true;
        state.saveAdminAuth();
        
        renderAdminView();
    } else if (screenId === 'home') {
        if (typeof updateHomeV3Stats === 'function') updateHomeV3Stats();
        if (typeof updateGreetingBanner === 'function') updateGreetingBanner();
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
const homeTab = document.getElementById('tab-home-btn');
if (homeTab) {
    homeTab.addEventListener('click', () => navigateTo('home'));
}
const gamesTab = document.getElementById('tab-games-btn');
if (gamesTab) {
    gamesTab.addEventListener('click', () => navigateTo('games'));
}
const bibleTab = document.getElementById('tab-bible-btn');
if (bibleTab) {
    bibleTab.addEventListener('click', () => navigateTo('bible'));
}
const questsTab = document.getElementById('tab-quests-btn');
if (questsTab) {
    questsTab.addEventListener('click', () => navigateTo('contests'));
}
const watchTab = document.getElementById('tab-watch-btn');
if (watchTab) {
    watchTab.addEventListener('click', () => navigateTo('dashboard'));
}
const parentTab = document.getElementById('tab-parent-btn');
if (parentTab) {
    parentTab.addEventListener('click', () => navigateTo('parent'));
}

// ── Settings Drawer controller ──────────────────────────
(function setupUnifiedDrawer() {
    // Helper to open master settings drawer
    function openMasterDrawer() {
        if (typeof openSettingsDrawer === 'function') {
            openSettingsDrawer();
            if (typeof triggerBubblePopFX === 'function') {
                triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
            }
        }
    }

    // Bind Avatar Profile Button
    const avatarBtn = document.getElementById('settings-trigger-btn');
    if (avatarBtn) {
        avatarBtn.addEventListener('click', openMasterDrawer);
    }

    // Bind Hamburger Button
    const menuBtn = document.getElementById('header-menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', openMasterDrawer);
    }

    // Bind Log Out Button in Master Drawer
    const logoutBtn = document.getElementById('drawer-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof closeSettingsDrawer === 'function') closeSettingsDrawer();
            setTimeout(() => {
                localStorage.removeItem('appUserLoggedIn');
                localStorage.removeItem('appUserEmail');
                localStorage.removeItem('superkid_user');
                localStorage.removeItem('superkid_owned');
                
                // Re-initialize state and redraw everything under unauthenticated guest profile
                state = new AppState();
                setupHomeV3();
                if (typeof renderDashboard === 'function') renderDashboard();
                if (typeof renderShop === 'function') renderShop();
                if (typeof renderQuests === 'function') renderQuests();
                
                const headerCoins = document.getElementById('star-coin-label');
                if (headerCoins) headerCoins.textContent = state.user.star_coins || 0;
                const drawerCoins = document.getElementById('drawer-coins-val');
                if (drawerCoins) drawerCoins.textContent = state.user.star_coins || 0;

                navigateTo('home');

                // Trigger the app-wide login overlay instantly
                const overlay = document.getElementById('app-login-overlay');
                const loginCard = document.getElementById('app-login-card');
                const signupCard = document.getElementById('app-signup-card');
                if (overlay && loginCard && signupCard) {
                    overlay.style.display = 'flex';
                    overlay.style.opacity = 1;
                    loginCard.style.display = 'block';
                    loginCard.style.opacity = 1;
                    loginCard.style.transform = 'none';
                    signupCard.style.display = 'none';
                    document.getElementById('app-login-error').style.display = 'none';
                    document.getElementById('login-email').value = '';
                    document.getElementById('login-pass').value = '';
                    gsap.fromTo(loginCard, 
                        { scale: 0.9, opacity: 0 }, 
                        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
                    );
                }
            }, 300);
        });
    }
})();

// ── App-Wide Login Controller ──────────────────────────
(function setupAppWideLogin() {
    const overlay = document.getElementById('app-login-overlay');
    const loginCard = document.getElementById('app-login-card');
    const signupCard = document.getElementById('app-signup-card');
    
    const loginForm = document.getElementById('app-login-form');
    const signupForm = document.getElementById('app-signup-form');
    
    const loginCloseBtn = document.getElementById('login-close-btn');
    const signupCloseBtn = document.getElementById('signup-close-btn');
    
    // Login password triggers
    const loginPassInput = document.getElementById('login-pass');
    const loginShowBtn = document.getElementById('login-pass-show-btn');
    const loginErrorDiv = document.getElementById('app-login-error');
    
    // Signup password triggers
    const signupPassInput = document.getElementById('signup-pass');
    const signupPassShowBtn = document.getElementById('signup-pass-show-btn');
    const signupPassConfirm = document.getElementById('signup-pass-confirm');
    const signupPassConfirmShowBtn = document.getElementById('signup-pass-confirm-show-btn');
    const signupErrorDiv = document.getElementById('app-signup-error');
    
    // Toggles
    const createAccountLink = document.getElementById('login-create-account');
    const backToLoginLink = document.getElementById('signup-back-to-login');
    
    if (!overlay || !loginCard || !signupCard) return;

    // Check login state
    const isLoggedIn = localStorage.getItem('appUserLoggedIn') === 'true';
    if (!isLoggedIn) {
        overlay.style.display = 'flex';
        gsap.fromTo(loginCard, 
            { scale: 0.9, opacity: 0 }, 
            { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
        );
    } else {
        overlay.style.display = 'none';
    }

    // Toggle views: Login -> SignUp
    if (createAccountLink) {
        createAccountLink.addEventListener('click', (e) => {
            e.preventDefault();
            gsap.to(loginCard, {
                scale: 0.95,
                opacity: 0,
                duration: 0.25,
                onComplete: () => {
                    loginCard.style.display = 'none';
                    signupCard.style.display = 'block';
                    gsap.fromTo(signupCard,
                        { scale: 0.95, opacity: 0 },
                        { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }
                    );
                }
            });
        });
    }

    // Toggle views: SignUp -> Login
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            gsap.to(signupCard, {
                scale: 0.95,
                opacity: 0,
                duration: 0.25,
                onComplete: () => {
                    signupCard.style.display = 'none';
                    loginCard.style.display = 'block';
                    gsap.fromTo(loginCard,
                        { scale: 0.95, opacity: 0 },
                        { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }
                    );
                }
            });
        });
    }

    // Toggle Login Password Visibility
    if (loginShowBtn && loginPassInput) {
        loginShowBtn.addEventListener('click', () => {
            if (loginPassInput.type === 'password') {
                loginPassInput.type = 'text';
                loginShowBtn.textContent = 'HIDE';
            } else {
                loginPassInput.type = 'password';
                loginShowBtn.textContent = 'SHOW';
            }
        });
    }

    // Toggle Signup Password Visibility
    if (signupPassShowBtn && signupPassInput) {
        signupPassShowBtn.addEventListener('click', () => {
            if (signupPassInput.type === 'password') {
                signupPassInput.type = 'text';
                signupPassShowBtn.textContent = 'HIDE';
            } else {
                signupPassInput.type = 'password';
                signupPassShowBtn.textContent = 'SHOW';
            }
        });
    }

    // Toggle Signup Confirm Password Visibility
    if (signupPassConfirmShowBtn && signupPassConfirm) {
        signupPassConfirmShowBtn.addEventListener('click', () => {
            if (signupPassConfirm.type === 'password') {
                signupPassConfirm.type = 'text';
                signupPassConfirmShowBtn.textContent = 'HIDE';
            } else {
                signupPassConfirm.type = 'password';
                signupPassConfirmShowBtn.textContent = 'SHOW';
            }
        });
    }

    // Common dynamic name greeting trigger function
    function doSuccessLogin(email) {
        localStorage.setItem('appUserLoggedIn', 'true');
        localStorage.setItem('appUserEmail', email);
        
        const rawName = email.split('@')[0];
        const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        if (typeof state !== 'undefined') {
            state.user.display_name = formattedName;
            state.saveUser();
        }

        // Animate overlay away
        const activeCard = signupCard.style.display !== 'none' ? signupCard : loginCard;
        gsap.to(activeCard, {
            scale: 0.95,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                gsap.to(overlay, {
                    opacity: 0,
                    duration: 0.25,
                    onComplete: () => {
                        overlay.style.display = 'none';
                        overlay.style.opacity = 1;
                        activeCard.style.opacity = 1;
                        activeCard.style.transform = 'none';
                        
                        // Bubble pop effect
                        if (typeof triggerBubblePopFX === 'function') {
                            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
                        }
                        
                        // Re-initialize state and redraw the views in-memory!
                        state = new AppState();
                        setupHomeV3();
                        if (typeof renderDashboard === 'function') renderDashboard();
                        if (typeof renderShop === 'function') renderShop();
                        if (typeof renderQuests === 'function') renderQuests();
                        if (typeof renderLeaderboard === 'function') renderLeaderboard();
                        
                        const headerCoins = document.getElementById('star-coin-label');
                        if (headerCoins) headerCoins.textContent = state.user.star_coins || 0;
                        const drawerCoins = document.getElementById('drawer-coins-val');
                        if (drawerCoins) drawerCoins.textContent = state.user.star_coins || 0;

                        navigateTo('home');
                        
                        // Dynamically update admin dashboard links visibility
                        if (typeof updateAdminVisibility === 'function') {
                            updateAdminVisibility();
                        }
                    }
                });
            }
        });
    }

    // Handle Login Form Submit
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = loginPassInput.value.trim();

            if (!email || !password) {
                loginErrorDiv.textContent = 'Please fill out all required fields.';
                loginErrorDiv.style.display = 'block';
                return;
            }

            // Check if banned in database
            const record = state.usersDb.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (record && record.is_banned) {
                loginErrorDiv.innerHTML = '🚫 <strong>ACCESS DENIED:</strong> This account has been banned by the Administrator.';
                loginErrorDiv.style.display = 'block';
                
                // Shake card animation
                gsap.to(loginCard, {
                    x: 10, duration: 0.05, yoyo: true, repeat: 5,
                    onComplete: () => { gsap.set(loginCard, { x: 0 }); }
                });
                return;
            }

            loginErrorDiv.style.display = 'none';
            doSuccessLogin(email);
        });
    }

    // Handle Signup Form Submit
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value.trim();
            const password = signupPassInput.value.trim();
            const confirmPass = signupPassConfirm.value.trim();

            if (!email || !password || !confirmPass) {
                signupErrorDiv.textContent = 'Please fill out all required fields.';
                signupErrorDiv.style.display = 'block';
                return;
            }

            // Check if banned in database
            const record = state.usersDb.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (record && record.is_banned) {
                signupErrorDiv.innerHTML = '🚫 This email address is banned from registration.';
                signupErrorDiv.style.display = 'block';
                return;
            }

            if (password.length < 6) {
                signupErrorDiv.textContent = 'Password must be at least 6 characters.';
                signupErrorDiv.style.display = 'block';
                return;
            }

            if (password !== confirmPass) {
                signupErrorDiv.textContent = 'Passwords do not match.';
                signupErrorDiv.style.display = 'block';
                return;
            }

            signupErrorDiv.style.display = 'none';
            doSuccessLogin(email);
        });
    }

    // Close buttons helper
    function handleCloseAttempt(cardElement, errorElement) {
        const currentlyLoggedIn = localStorage.getItem('appUserLoggedIn') === 'true';
        if (currentlyLoggedIn) {
            overlay.style.display = 'none';
        } else {
            // Shake card animation
            gsap.to(cardElement, {
                x: 10,
                duration: 0.05,
                yoyo: true,
                repeat: 5,
                onComplete: () => {
                    gsap.set(cardElement, { x: 0 });
                }
            });
            errorElement.textContent = 'Please log in or create an account to start your Bible adventures!';
            errorElement.style.display = 'block';
        }
    }

    if (loginCloseBtn) {
        loginCloseBtn.addEventListener('click', () => {
            handleCloseAttempt(loginCard, loginErrorDiv);
        });
    }

    if (signupCloseBtn) {
        signupCloseBtn.addEventListener('click', () => {
            handleCloseAttempt(signupCard, signupErrorDiv);
        });
    }

    // Guest login event listeners
    const loginGuestBtn = document.getElementById('login-guest-btn');
    const signupGuestBtn = document.getElementById('signup-guest-btn');
    const handleGuestLogin = (e) => {
        e.preventDefault();
        doSuccessLogin('leo@gmail.com');
    };
    if (loginGuestBtn) {
        loginGuestBtn.addEventListener('click', handleGuestLogin);
    }
    if (signupGuestBtn) {
        signupGuestBtn.addEventListener('click', handleGuestLogin);
    }
})();

// Search button hook
const headerSearchBtn = document.getElementById('header-search-btn');
if (headerSearchBtn) {
    headerSearchBtn.addEventListener('click', () => {
        navigateTo('dashboard');
        triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
    });
}

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
const subtabUsersBtn = document.getElementById('admin-subtab-users-btn');

const panelContent = document.getElementById('admin-panel-content');
const panelManage = document.getElementById('admin-panel-manage');
const panelSubmissions = document.getElementById('admin-panel-submissions');
const panelUsers = document.getElementById('admin-panel-users');

function resetAdminSubtabButtons() {
    [subtabContentBtn, subtabManageBtn, subtabSubmissionsBtn, subtabUsersBtn].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
}

if (subtabContentBtn && subtabManageBtn && subtabSubmissionsBtn && subtabUsersBtn && panelContent && panelManage && panelSubmissions && panelUsers) {
    subtabContentBtn.addEventListener('click', () => {
        resetAdminSubtabButtons();
        subtabContentBtn.classList.add('active');
        panelContent.style.display = 'block';
        panelManage.style.display = 'none';
        panelSubmissions.style.display = 'none';
        panelUsers.style.display = 'none';
        renderAdminQuizSelect();
    });
    
    subtabManageBtn.addEventListener('click', () => {
        resetAdminSubtabButtons();
        subtabManageBtn.classList.add('active');
        panelContent.style.display = 'none';
        panelManage.style.display = 'block';
        panelSubmissions.style.display = 'none';
        panelUsers.style.display = 'none';
        renderAdminManageView();
    });
    
    subtabSubmissionsBtn.addEventListener('click', () => {
        resetAdminSubtabButtons();
        subtabSubmissionsBtn.classList.add('active');
        panelContent.style.display = 'none';
        panelManage.style.display = 'none';
        panelSubmissions.style.display = 'block';
        panelUsers.style.display = 'none';
        renderAdminSubmissions();
    });

    subtabUsersBtn.addEventListener('click', () => {
        resetAdminSubtabButtons();
        subtabUsersBtn.classList.add('active');
        panelContent.style.display = 'none';
        panelManage.style.display = 'none';
        panelSubmissions.style.display = 'none';
        panelUsers.style.display = 'block';
        renderAdminUsers();
    });

    // Search input listener
    const userSearchInput = document.getElementById('admin-users-search');
    if (userSearchInput) {
        userSearchInput.addEventListener('input', () => {
            renderAdminUsers();
        });
    }
}

// User management control methods
function forceUserLogout() {
    localStorage.removeItem('appUserLoggedIn');
    localStorage.removeItem('appUserEmail');
    localStorage.removeItem('superkid_user');
    localStorage.removeItem('superkid_owned');
    
    // Re-initialize state and redraw everything under unauthenticated guest profile
    state = new AppState();
    setupHomeV3();
    if (typeof renderDashboard === 'function') renderDashboard();
    if (typeof renderShop === 'function') renderShop();
    if (typeof renderQuests === 'function') renderQuests();
    
    const headerCoins = document.getElementById('star-coin-label');
    if (headerCoins) headerCoins.textContent = state.user.star_coins || 0;
    const drawerCoins = document.getElementById('drawer-coins-val');
    if (drawerCoins) drawerCoins.textContent = state.user.star_coins || 0;

    navigateTo('home');

    // Update admin dashboard links visibility on logout
    if (typeof updateAdminVisibility === 'function') {
        updateAdminVisibility();
    }

    // Trigger the app-wide login overlay instantly
    const overlay = document.getElementById('app-login-overlay');
    const loginCard = document.getElementById('app-login-card');
    const signupCard = document.getElementById('app-signup-card');
    if (overlay && loginCard && signupCard) {
        overlay.style.display = 'flex';
        overlay.style.opacity = 1;
        loginCard.style.display = 'block';
        loginCard.style.opacity = 1;
        loginCard.style.transform = 'none';
        signupCard.style.display = 'none';
        document.getElementById('app-login-error').style.display = 'none';
        document.getElementById('login-email').value = '';
        document.getElementById('login-pass').value = '';
        gsap.fromTo(loginCard, 
            { scale: 0.9, opacity: 0 }, 
            { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
        );
    }
}

function renderAdminUsers() {
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;

    let db = [];
    try {
        db = JSON.parse(localStorage.getItem('superkid_users_db')) || [];
    } catch(e) {
        console.error(e);
    }

    const searchQuery = (document.getElementById('admin-users-search')?.value || '').toLowerCase().trim();
    tbody.innerHTML = '';

    const filteredUsers = db.filter(u => {
        const name = (u.display_name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(searchQuery) || email.includes(searchQuery);
    });

    if (filteredUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-ledger-row">👥 NO USERS FOUND MATCHING CRITERIA.</td>
            </tr>
        `;
        return;
    }

    filteredUsers.forEach(u => {
        const tr = document.createElement('tr');
        
        let roleBadge = '<span class="status-badge standard-badge">User</span>';
        if (u.email.toLowerCase() === 'jsianhung@gmail.com') {
            roleBadge = '<span class="status-badge premium-badge">👑 Owner</span>';
        } else if (u.is_admin) {
            roleBadge = '<span class="status-badge premium-badge">🛡️ Admin</span>';
        }

        const premiumBadge = u.is_premium 
            ? '<span class="status-badge premium-badge">✨ Premium</span>' 
            : '<span class="status-badge standard-badge">Standard</span>';

        const statusBadge = u.is_banned 
            ? '<span class="status-badge banned">Banned</span>' 
            : '<span class="status-badge active-user">Active</span>';

        let actionButtons = '';
        if (u.email.toLowerCase() !== 'jsianhung@gmail.com') {
            const premiumText = u.is_premium ? 'Remove Premium' : 'Give Premium';
            actionButtons += `<button class="sb-btn-cyber-action sb-btn-cyber-role toggle-prem-btn" data-email="${u.email}">${premiumText}</button>`;

            const roleText = u.is_admin ? 'Demote User' : 'Make Admin';
            actionButtons += `<button class="sb-btn-cyber-action sb-btn-cyber-role toggle-role-btn" data-email="${u.email}">${roleText}</button>`;

            const banText = u.is_banned ? 'Unban' : 'Ban';
            const banClass = u.is_banned ? 'sb-btn-cyber-unban' : 'sb-btn-cyber-ban';
            actionButtons += `<button class="sb-btn-cyber-action ${banClass} toggle-ban-btn" data-email="${u.email}">${banText}</button>`;

            actionButtons += `<button class="sb-btn-cyber-action sb-btn-cyber-delete delete-user-btn" data-email="${u.email}">Delete</button>`;
        } else {
            actionButtons = `<span style="font-size: 0.75rem; color: rgba(255,255,255,0.4)">Owner (Protected)</span>`;
        }

        tr.innerHTML = `
            <td>
                <div class="user-cell-meta">
                    <strong>${u.display_name || 'Anonymous Kid'}</strong>
                    <span class="user-cell-email">${u.email}</span>
                </div>
            </td>
            <td>${roleBadge}</td>
            <td>${premiumBadge}</td>
            <td>
                <span class="ledger-reward">🪙 ${u.star_coins || 0}</span><br>
                <span style="font-size: 0.72rem; color: rgba(255,255,255,0.5)">XP: ${u.xp || 0} (Lvl ${u.level || 1})</span>
            </td>
            <td>${statusBadge}</td>
            <td>
                <div class="action-buttons-wrap" style="flex-wrap: wrap; justify-content: flex-start;">
                    ${actionButtons}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.toggle-prem-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const email = btn.getAttribute('data-email');
            toggleUserPremium(email);
        });
    });

    tbody.querySelectorAll('.toggle-role-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const email = btn.getAttribute('data-email');
            toggleUserAdmin(email);
        });
    });

    tbody.querySelectorAll('.toggle-ban-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const email = btn.getAttribute('data-email');
            toggleUserBan(email);
        });
    });

    tbody.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const email = btn.getAttribute('data-email');
            deleteUserAccount(email);
        });
    });
}

function toggleUserPremium(email) {
    let db = [];
    try {
        db = JSON.parse(localStorage.getItem('superkid_users_db')) || [];
    } catch(e) {
        console.error(e);
    }
    const user = db.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
        user.is_premium = !user.is_premium;
        localStorage.setItem('superkid_users_db', JSON.stringify(db));
        
        if (state.user && state.user.email.toLowerCase() === email.toLowerCase()) {
            state.user.is_premium = user.is_premium;
            state.saveState();
        }
        
        renderAdminUsers();
        renderDashboard();
    }
}

function toggleUserAdmin(email) {
    let db = [];
    try {
        db = JSON.parse(localStorage.getItem('superkid_users_db')) || [];
    } catch(e) {
        console.error(e);
    }
    const user = db.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
        user.is_admin = !user.is_admin;
        localStorage.setItem('superkid_users_db', JSON.stringify(db));
        
        if (state.user && state.user.email.toLowerCase() === email.toLowerCase()) {
            state.user.is_admin = user.is_admin;
            state.saveState();
            if (!user.is_admin) {
                forceUserLogout();
                return;
            }
        }
        
        renderAdminUsers();
    }
}

function toggleUserBan(email) {
    let db = [];
    try {
        db = JSON.parse(localStorage.getItem('superkid_users_db')) || [];
    } catch(e) {
        console.error(e);
    }
    const user = db.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
        user.is_banned = !user.is_banned;
        localStorage.setItem('superkid_users_db', JSON.stringify(db));
        
        if (state.user && state.user.email.toLowerCase() === email.toLowerCase()) {
            forceUserLogout();
            return;
        }
        
        renderAdminUsers();
    }
}

function deleteUserAccount(email) {
    const isConfirm = confirm(`⚠️ Are you sure you want to delete the user account for ${email}? This action is permanent!`);
    if (!isConfirm) return;
    
    let db = [];
    try {
        db = JSON.parse(localStorage.getItem('superkid_users_db')) || [];
    } catch(e) {
        console.error(e);
    }
    
    const index = db.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (index !== -1) {
        db.splice(index, 1);
        localStorage.setItem('superkid_users_db', JSON.stringify(db));
        
        if (state.user && state.user.email.toLowerCase() === email.toLowerCase()) {
            forceUserLogout();
            return;
        }
        
        renderAdminUsers();
    }
}

// --- 5. MASCOT DRESSING & RENDERER ---
function renderEquippedGear() {
    const overlays = [
        document.getElementById('equipped-accessory'),
        document.getElementById('home-equipped-accessory')
    ].filter(el => el);
    
    if (overlays.length === 0) return;
    
    const equipped = state.user.avatar_custom_data.equipped_gear;
    
    overlays.forEach(overlay => {
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
    });
}

// --- 5B. YOUTUBE DYNAMIC INTEGRATION & CORS RESOLUTION ---

// Helper: Extract username/handle or ID from any YouTube URL
function extractYoutubeHandleOrId(url) {
    if (!url) return null;
    url = url.trim();
    
    // Check if it's already a channel ID (UC...)
    if (/^UC[a-zA-Z0-9_-]{22}$/.test(url)) {
        return { type: 'id', val: url };
    }
    
    // Check if it's a handle (starting with @)
    if (/^@[a-zA-Z0-9_.-]+$/.test(url)) {
        return { type: 'handle', val: url };
    }
    
    // Check standard /channel/UC... URLs
    const channelMatch = url.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);
    if (channelMatch) {
        return { type: 'id', val: channelMatch[1] };
    }
    
    // Check handles from URL: youtube.com/@handle
    const handleMatch = url.match(/\/(@[a-zA-Z0-9_.-]+)/);
    if (handleMatch) {
        return { type: 'handle', val: handleMatch[1] };
    }
    
    // Check user/c subpaths: youtube.com/user/username or youtube.com/c/username
    const subpathMatch = url.match(/\/(user|c)\/([a-zA-Z0-9_.-]+)/);
    if (subpathMatch) {
        return { type: 'subpath', path: subpathMatch[1], val: subpathMatch[2] };
    }
    
    // Fallback: assume user inputted handle without @
    if (/^[a-zA-Z0-9_.-]+$/.test(url)) {
        return { type: 'handle', val: '@' + url };
    }
    
    return null;
}

// Helper: Resolve a handle or subpath to a UC... Channel ID using AllOrigins proxy
async function resolveYoutubeChannelId(info) {
    if (!info) throw new Error("Invalid channel information");
    if (info.type === 'id') return { id: info.val, name: null };
    
    let fetchUrl = '';
    if (info.type === 'handle') {
        fetchUrl = `https://www.youtube.com/${info.val}`;
    } else if (info.type === 'subpath') {
        fetchUrl = `https://www.youtube.com/${info.path}/${info.val}`;
    } else {
        throw new Error("Unsupported channel query format");
    }
    
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(fetchUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Failed to reach proxy server");
    
    const data = await response.json();
    const html = data.contents;
    if (!html) throw new Error("No contents returned from proxy");
    
    // Look for channelId in meta tags or JSON script elements
    const channelIdMatch = html.match(/itemprop="channelId"\s+content="(UC[a-zA-Z0-9_-]{22})"/i) ||
                           html.match(/"channelId"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/i) ||
                           html.match(/"browseId"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/i);
                           
    if (!channelIdMatch) {
        throw new Error("Could not find YouTube Channel ID in page source. Please make sure the channel is public.");
    }
    
    // Extract channel name
    let channelName = null;
    const nameMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
                      html.match(/"name"\s*:\s*"([^"]+)"/i);
    if (nameMatch) {
        channelName = nameMatch[1];
    }
    
    return { id: channelIdMatch[1], name: channelName };
}

// Core method: Sync and fetch latest videos from YouTube RSS feed
async function syncYoutubeChannel(url, updateUI = false) {
    const statusEl = document.getElementById('admin-yt-status');
    const syncBtn = document.getElementById('admin-save-yt-btn');
    
    if (statusEl && updateUI) {
        statusEl.textContent = "⏳ Parsing channel URL...";
        statusEl.style.color = "#00f0ff";
    }
    if (syncBtn) syncBtn.disabled = true;
    
    try {
        const info = extractYoutubeHandleOrId(url);
        if (!info) throw new Error("Invalid YouTube channel link or handle format.");
        
        if (statusEl && updateUI && info.type !== 'id') {
            statusEl.textContent = `⏳ Resolving handle ${info.val} to Channel ID...`;
        }
        
        const resolved = await resolveYoutubeChannelId(info);
        const channelId = resolved.id;
        const channelName = resolved.name || "YouTube Feed";
        
        if (statusEl && updateUI) {
            statusEl.textContent = `⏳ Fetching feed for ${channelName}...`;
        }
        
        const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Failed to fetch RSS feed");
        
        const data = await response.json();
        const xmlText = data.contents;
        if (!xmlText) throw new Error("Empty response from RSS proxy");
        
        // Parse RSS XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        // Check for parse error
        const parseError = xmlDoc.querySelector("parsererror");
        if (parseError) throw new Error("Failed to parse YouTube RSS feed XML.");
        
        const entries = xmlDoc.getElementsByTagName("entry");
        if (entries.length === 0) {
            throw new Error("No videos found in the channel feed. Is this channel empty?");
        }
        
        // Map XML entries to state episodes format
        const newEpisodes = [];
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            
            const videoIdNode = entry.getElementsByTagName("yt:videoId")[0] || entry.querySelector("videoId");
            const videoId = videoIdNode ? videoIdNode.textContent : "";
            if (!videoId) continue;
            
            const titleNode = entry.getElementsByTagName("title")[0];
            const title = titleNode ? titleNode.textContent : "YouTube Video";
            
            const descNode = entry.getElementsByTagName("media:description")[0] || entry.querySelector("description");
            const description = descNode ? descNode.textContent : "Super Kid Bible Adventures with YouTube video broadcast.";
            
            // Limit description size
            const trimmedDesc = description.length > 150 ? description.substring(0, 147) + "..." : description;
            
            // Build high quality thumbnail URL
            const thumbnail_url = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            
            newEpisodes.push({
                id: `yt-${videoId}`,
                title: title,
                youtube_video_id: videoId,
                thumbnail_url: thumbnail_url,
                description: trimmedDesc,
                order_index: i + 1,
                price: 0 // Free to watch!
            });
        }
        
        // Update user state properties
        state.user.youtube_channel_url = url;
        state.user.youtube_channel_name = channelName;
        state.saveUser();
        
        // Store synced episodes in state & localStorage
        state.episodes = newEpisodes;
        state.saveEpisodes();
        
        // Re-render
        renderDashboard();
        
        if (statusEl && updateUI) {
            statusEl.textContent = `🎉 Success! Synced ${newEpisodes.length} videos from "${channelName}".`;
            statusEl.style.color = "#00ff66";
            
            // Clear message after 4s
            setTimeout(() => {
                statusEl.textContent = "";
            }, 4000);
        }
        
        return true;
    } catch (err) {
        console.error("YouTube sync error:", err);
        if (statusEl && updateUI) {
            statusEl.textContent = `❌ Error: ${err.message}`;
            statusEl.style.color = "#ff3366";
        }
        return false;
    } finally {
        if (syncBtn) syncBtn.disabled = false;
    }
}

// --- 6. DASHBOARD SCREEN RENDERING ---
function renderDashboard() {
    const container = document.getElementById('episodes-cards-container');
    if (!container) return;
    
    // Update Channel name in title
    const channelNameTitle = document.getElementById('yt-channel-name-title');
    if (channelNameTitle) {
        channelNameTitle.textContent = state.user.youtube_channel_name ? state.user.youtube_channel_name.toUpperCase() : 'EPISODE GUIDE';
    }
    
    const searchInput = document.getElementById('yt-search-input');
    const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    const clearBtn = document.getElementById('yt-clear-search');
    if (clearBtn) {
        if (searchQuery) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
    }
    
    container.innerHTML = '';
    
    // Always refresh coin counter display
    const starCoinLabel = document.getElementById('star-coin-label');
    if (starCoinLabel) {
        starCoinLabel.textContent = state.user.star_coins || 0;
    }
    const drawerCoinsVal = document.getElementById('drawer-coins-val');
    if (drawerCoinsVal) {
        drawerCoinsVal.textContent = state.user.star_coins || 0;
    }
    
    // Filter episodes
    let filteredEpisodes = state.episodes || [];
    if (searchQuery) {
        filteredEpisodes = (state.episodes || []).filter(episode => 
            (episode.title && episode.title.toLowerCase().includes(searchQuery)) ||
            (episode.description && episode.description.toLowerCase().includes(searchQuery))
        );
    }
    
    if (filteredEpisodes.length === 0) {
        container.innerHTML = `
            <div class="yt-no-results">
                <div class="yt-no-results-icon">🔍</div>
                <div class="yt-no-results-title">No Episodes Found</div>
                <p>We couldn't find any videos matching "${sanitizeHTML(searchQuery)}". Try searching for something else!</p>
            </div>
        `;
        return;
    }
    
    filteredEpisodes.forEach(episode => {
        const isPremiumUser = !!state.user.is_premium;
        const isPurchased = (state.user.purchased_episodes || []).includes(episode.id);
        const hasPrice = episode.price && parseFloat(episode.price) > 0;
        const isSequentiallyUnlocked = episode.order_index <= state.user.unlocked_index;
        const isYt = episode.id && episode.id.startsWith('yt-');

        // Playable if premium, already bought, from YouTube, or sequentially unlocked free episode
        const isPlayable = isPremiumUser || isPurchased || isYt || (!hasPrice && isSequentiallyUnlocked);
        
        const card = document.createElement('div');
        
        if (isPlayable) {
            card.className = `episode-banner-card ${hasPrice && !isSequentiallyUnlocked ? 'premium-purchased' : ''}`;
            const badgeTag = hasPrice 
                ? `<span class="premium-badge-glowing">⚡ PREMIUM UNLOCKED</span>` 
                : (isYt ? `<span class="youtube-badge" style="color: #00f0ff; font-weight: 800; text-shadow: 0 0 5px rgba(0,240,255,0.4);">📺 YOUTUBE</span>` : '');
            
            card.innerHTML = `
                <div class="episode-card-header">
                    <span class="episode-number-label">VIDEO ${episode.order_index} ${badgeTag}</span>
                </div>
                <div class="episode-card-content">
                    <h2 class="episode-card-title">${sanitizeHTML(episode.title)}</h2>
                    <p class="episode-card-desc">${sanitizeHTML(episode.description)}</p>
                </div>
                <div class="episode-card-thumb-wrap">
                    <img src="${sanitizeHTML(episode.thumbnail_url)}" alt="${sanitizeHTML(episode.title)}" class="episode-card-thumb">
                    <div class="episode-card-image-label">SUPERBOOK VIDEO BROADCAST</div>
                </div>
                <div class="episode-card-buttons">
                    <button type="button" class="play-btn-trigger">WATCH EPISODE</button>
                    <button type="button" class="discover-btn-trigger">DISCOVER MORE</button>
                </div>
            `;
            
            // Add click listener
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('discover-btn-trigger')) {
                    e.stopPropagation();
                    state.activeEpisode = episode;
                    startQuiz();
                } else if (e.target.classList.contains('play-btn-trigger')) {
                    e.stopPropagation();
                    startEpisode(episode);
                } else {
                    startEpisode(episode);
                }
            });
        } else if (hasPrice) {
            // Priced lock state (purchasable!)
            card.className = `episode-banner-card coin-locked-card`;
            card.innerHTML = `
                <div class="episode-card-header">
                    <span class="episode-number-label text-gold">⭐ PREMIUM CONTENT</span>
                </div>
                <div class="episode-card-content">
                    <h2 class="episode-card-title text-gold">${sanitizeHTML(episode.title)}</h2>
                    <p class="episode-card-desc">${sanitizeHTML(episode.description)}</p>
                </div>
                <div class="episode-card-thumb-wrap premium-price-wrap">
                    <img src="${sanitizeHTML(episode.thumbnail_url)}" alt="${sanitizeHTML(episode.title)}" class="episode-card-thumb grayscale">
                    <div class="locked-overlay-banner premium-gate-banner">
                        <div class="price-coin-badge">⭐ ${episode.price} COINS</div>
                        <div class="lock-text-badge text-gold">COIN LOCK</div>
                    </div>
                </div>
                <div class="episode-card-buttons">
                    <button type="button" class="unlock-btn-trigger gold-btn">🔑 UNLOCK FOR ${episode.price} COINS</button>
                </div>
            `;
            
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('unlock-btn-trigger')) {
                    e.stopPropagation();
                    const price = parseFloat(episode.price);
                    if (state.user.star_coins >= price) {
                        // Deduct coins
                        state.user.star_coins -= price;
                        if (!state.user.purchased_episodes) {
                            state.user.purchased_episodes = [];
                        }
                        state.user.purchased_episodes.push(episode.id);
                        
                        // Save states
                        state.saveUser();
                        
                        // FX & Alert
                        if (typeof triggerBubblePopFX === 'function') {
                            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
                        }
                        alert(`🎉 SUCCESS! You have successfully unlocked "${episode.title}" for ${price} Star Coins!`);
                        
                        // Re-render
                        renderDashboard();
                    } else {
                        alert(`⚡ OOPS! You need ${price - state.user.star_coins} more Star Coins to unlock this episode. Play games or solve quizzes to earn coins!`);
                    }
                }
            });
        } else {
            // Sequentially locked free episode
            card.className = `episode-banner-card locked`;
            card.innerHTML = `
                <div class="episode-card-header">
                    <span class="episode-number-label">EPISODE ${episode.order_index}</span>
                </div>
                <div class="episode-card-content">
                    <h2 class="episode-card-title">${sanitizeHTML(episode.title)}</h2>
                    <p class="episode-card-desc">${sanitizeHTML(episode.description)}</p>
                </div>
                <div class="episode-card-thumb-wrap">
                    <img src="${sanitizeHTML(episode.thumbnail_url)}" alt="${sanitizeHTML(episode.title)}" class="episode-card-thumb">
                    <div class="episode-card-image-label">SUPERBOOK GRN ANIMATION</div>
                    <div class="locked-overlay-banner">
                        <div class="lock-badge-big">🔒</div>
                        <div class="lock-text-badge">LOCKED</div>
                    </div>
                </div>
                <div class="episode-card-buttons">
                    <button type="button" class="play-btn-trigger" disabled>WATCH EPISODE</button>
                    <button type="button" class="discover-btn-trigger" disabled>DISCOVER MORE</button>
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

    // Verify if YouTube API is fully loaded and ready using the official YT.ready queue
    if (window.YT && typeof window.YT.ready === 'function') {
        window.YT.ready(function() {
            createYoutubePlayer(episode);
        });
    } else if (window.YT && window.YT.Player) {
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
    
    // Detect mobile to enable native YouTube controls (required for iOS touch)
    const isMobile = window.innerWidth <= 768 || window.matchMedia('(orientation: portrait)').matches;
    
    // Instantiate YouTube player inside the recreated div
    ytPlayer = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: episode.youtube_video_id,
        playerVars: {
            controls: isMobile ? 1 : 0,  // Show native controls on mobile for touch support
            disablekb: 1,       // Disables scrubbing hotkeys
            fs: isMobile ? 1 : 0,         // Allow fullscreen on mobile
            modestbranding: 1,  // Minimizes YouTube logos
            rel: 0,             // Hides recommendations at end of video
            showinfo: 0,        // Hides video info
            iv_load_policy: 3,  // Hides interactive annotations
            playsinline: 1,     // Forces inline playback on mobile
            origin: window.location.origin, // Crucial for WebView playback
            widget_referrer: window.location.href
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
        user_id: state.user.email,
        user_name: state.user.display_name,
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
    state.cloudUpsertSubmission(newSubmission);
    
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
    let quizSet = state.quizzes.find(q => q.episode_id === state.activeEpisode.id);
    
    if (!quizSet || quizSet.questions.length === 0) {
        // Fallback: Use General Bible / Sunday School Quiz fallback pool
        const generalPool = typeof GENERAL_QUIZ_QUESTIONS !== 'undefined' ? GENERAL_QUIZ_QUESTIONS : [];
        if (generalPool.length > 0) {
            // Shuffle pool and select 3 questions
            const shuffled = [...generalPool].sort(() => 0.5 - Math.random());
            quizSet = {
                episode_id: state.activeEpisode.id,
                questions: shuffled.slice(0, 3)
            };
        }
    }
    
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
    state.cloudUpsertSubmission(sub);
    
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
    state.cloudUpsertSubmission(sub);
    
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
                <td class="ledger-contest">
                    <strong>EP ${ep.order_index}: ${sanitizeHTML(ep.title)}</strong>
                    ${ep.price && parseFloat(ep.price) > 0 ? `<br><span class="status-badge premium-badge">⭐ ${ep.price} Coins</span>` : '<br><span class="status-badge standard-badge">Free</span>'}
                </td>
                <td class="ledger-content"><code>${sanitizeHTML(ep.youtube_video_id)}</code></td>
                <td class="ledger-content"><div class="desc-cell">${sanitizeHTML(ep.description)}</div></td>
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
                <td class="ledger-contest"><strong>${sanitizeHTML(c.title)}</strong></td>
                <td class="ledger-content"><div class="desc-cell">${sanitizeHTML(c.description)}</div></td>
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
    document.getElementById('edit-ep-price').value = ep.price || 0;

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
    state.cloudDeleteEpisode(epId);

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
    state.cloudDeleteContest(contestId);

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
            const price = parseFloat(document.getElementById('edit-ep-price').value) || 0;
            
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
                    ep.price = price;
                    
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
                    state.cloudUpsertContest(c);
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
safeInit(() => {
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
            const price = parseFloat(document.getElementById('admin-ep-price').value) || 0;
            
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
                    ep.price = price;
                    
                    state.saveEpisodes();
                    state.cloudUpsertEpisode(ep);
                    
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
                    price: price,
                    description: desc
                };
                
                state.episodes.push(newEpisode);
                state.saveEpisodes();
                state.cloudUpsertEpisode(newEpisode);
                
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
            state.cloudUpsertQuiz(quizSet);
            
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
                    state.cloudUpsertContest(c);
                    
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
                state.cloudUpsertContest(newContest);
                
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
            
            const isDefaultAdmin = (usernameInput === 'admin' && passwordInput === 'admin123');
            const isOwnerAdmin = (usernameInput.toLowerCase() === 'jsianhung@gmail.com');
            
            if (isDefaultAdmin || isOwnerAdmin) {
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

    // =====================================================================
    // BIBLE STORIES READER DATA & CONTROLLERS
    // =====================================================================
    const BIBLE_STORIES_DATA = {
        creation: {
            title: "The Creation of the World",
            badge: "Genesis 1",
            image: "assets/story_creation.png",
            content: `<p>In the beginning, God created the beautiful heavens and the earth! 🌟</p>` +
                     `<p>The earth was completely empty and dark. So God said, <strong>"Let there be light!"</strong> And suddenly, bright light filled the darkness! God called the light "Day" and the darkness "Night." That was the very first day! ☀️</p>` +
                     `<p>On the second day, God created the high blue sky. On the third day, God gathered the waters together to form the deep blue oceans and let the dry land appear. He made green grass, giant trees, and beautiful colorful flowers bloom all over the land! 🌸</p>` +
                     `<p>On the fourth day, God placed the bright sun in the sky to shine by day, and the glowing moon and sparkling stars to shine at night. On the fifth day, God filled the oceans with swimming fish and giant whales, and made happy birds fly through the sky! 🐠🐦</p>` +
                     `<p>On the sixth day, God created all kinds of cute animals: bears, rabbits, lions, and elephants. And then, God created something very special—He made human beings in His own image to care for His beautiful world! 👤</p>` +
                     `<p>On the seventh day, God looked at everything He had made and saw that it was extremely good! So He rested, making the seventh day a special day of peace and rest.</p>`
        },
        noah: {
            title: "Noah's Great Ark",
            badge: "Genesis 6",
            image: "assets/story_noah.png",
            content: `<p>A long time ago, a very kind man named Noah lived on the earth. Noah loved God very much and always did what was right. 👤</p>` +
                     `<p>One day, God told Noah that a massive rainstorm was coming to cover the earth. God asked Noah to build a giant wooden boat called an Ark! 🚢</p>` +
                     `<p>Noah trusted God completely. He and his family worked very hard to build the giant Ark, exactly as God instructed. When the Ark was finished, God sent pairs of all kinds of animals from all over the world to Noah: giraffes, elephants, lions, pandas, and tiny birds. They all marched into the Ark two by two! 🦒🐘🐼</p>` +
                     `<p>Once everyone was safe inside, God shut the heavy door. Rain began to fall heavily for forty days and forty nights! The water rose higher and higher, but the giant Ark floated safely on top of the deep blue waves.</p>` +
                     `<p>Eventually, the rain stopped and a warm wind dried the land. Noah opened the window and saw green leaves growing. When they walked out onto dry land, God placed a beautiful giant rainbow in the sky as a promise that He would always protect and love His creation! 🌈</p>`
        },
        moses: {
            title: "Moses and the Great Exodus",
            badge: "Exodus 14",
            image: "assets/story_moses.png",
            content: `<p>A long time ago, the Israelites were working very hard as slaves in the hot land of Egypt. God heard their prayers and called a brave man named Moses to lead them to freedom! 👤</p>` +
                     `<p>Moses went to the mighty Pharaoh and said, <strong>"Let my people go!"</strong> When Pharaoh refused, God sent ten miraculous plagues upon Egypt—including swarms of frogs, locusts, and total darkness—to show His great power! 🐸🦗🌑</p>` +
                     `<p>Finally, Pharaoh agreed, and Moses led a massive march of people out of Egypt! They traveled through the desert, guided by a glowing pillar of cloud by day and a warm pillar of fire by night. ☁️🔥</p>` +
                     `<p>But soon, Pharaoh changed his mind and sent his giant chariot army to chase them! The Israelites found themselves trapped: the deep Red Sea was in front of them, and Pharaoh's army was rushing behind them! The people were terrified. 🛡️🏇</p>` +
                     `<p>But Moses said, <strong>"Do not be afraid! Stand firm and see the deliverance the Lord will bring you today!"</strong></p>` +
                     `<p>Then, Moses held his wooden shepherd's staff high over the water. Suddenly, a mighty wind blew, and the Red Sea parted in two! Giant walls of blue water rose on the left and right, and a dry sandy pathway opened in the middle! The Israelites walked safely across to the other side! 🌊🚶‍♂️</p>` +
                     `<p>Once they were safe, the waters returned, and Moses led the people in a joyful song of celebration and thanksgiving to God! 💃🎵</p>`
        },
        david: {
            title: "David and Goliath",
            badge: "1 Samuel 17",
            image: "assets/story_david.png",
            content: `<p>Once upon a time, there was a young shepherd boy named David. David spent his days in the green valleys looking after his father's sheep. Although he was small, David was brave and trusted God completely! 🐑</p>` +
                     `<p>One day, a giant warrior named Goliath came to fight. Goliath was over nine feet tall, wore heavy armor, and carried a massive spear! He shouted at David's people, challenging anyone to fight him. Everyone was terrified of the giant and ran away. 🛡️</p>` +
                     `<p>But David said, <strong>"I am not afraid! God protected me from lions and bears when guarding my sheep, and He will protect me now!"</strong></p>` +
                     `<p>David walked down into the valley to face the giant. He did not wear heavy armor. Instead, he only carried his shepherd's staff, a small leather sling, and five smooth stones from the stream. 🪨</p>` +
                     `<p>Goliath laughed at David because he was so small. But David loaded a smooth stone into his sling, swung it around, and launched it! The stone hit Goliath right in the forehead and the giant fell down to the ground! 🎉</p>` +
                     `<p>David won the great battle not with size or weapons, but through courage and strong faith in God!</p>`
        }
    };

    function setupBibleModal() {
        const modal = document.getElementById('bible-story-modal');
        const closeBtn = document.getElementById('close-bible-reader-btn');
        const completeBtn = document.getElementById('bible-reader-complete-btn');

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
            });
        }

        // Hook read buttons on cards
        document.querySelectorAll('.read-story-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const storyKey = btn.getAttribute('data-story');
                openBibleStory(storyKey);
            });
        });

        if (completeBtn && modal) {
            completeBtn.addEventListener('click', () => {
                const storyKey = completeBtn.getAttribute('data-story');
                modal.style.display = 'none';

                // Reward points and XP
                state.incrementCoins(50);
                state.incrementXP(50);

                triggerConfettiVictoryFX();
                triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);

                // Automatically check off today in the real calendar streak
                const todayStr = new Date().toISOString().split('T')[0];
                state.markDayCompleted(todayStr);

            });
        }
    }

    function openBibleStory(storyKey) {
        const story = BIBLE_STORIES_DATA[storyKey];
        if (!story) return;

        const modal = document.getElementById('bible-story-modal');
        const badge = document.getElementById('bible-reader-badge');
        const title = document.getElementById('bible-reader-title');
        const img = document.getElementById('bible-reader-img');
        const content = document.getElementById('bible-reader-content');
        const completeBtn = document.getElementById('bible-reader-complete-btn');

        if (badge) badge.textContent = story.badge;
        if (title) title.textContent = story.title;
        if (img) img.src = story.image;
        if (content) {
            content.innerHTML = story.content;
        }
        if (completeBtn) {
            completeBtn.setAttribute('data-story', storyKey);
        }

        if (modal) {
            modal.style.display = 'flex';
            const scrollable = modal.querySelector('.bible-reader-scrollable');
            if (scrollable) scrollable.scrollTop = 0;
            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
        }
    }

    // Connect homepage banner action hooks
    const jesusEntranceCard = document.getElementById('home-jesus-entrance-card');
    if (jesusEntranceCard) {
        jesusEntranceCard.addEventListener('click', () => {
            navigateTo('bible');
            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
        });
    }
    const findOutHowBtn = document.getElementById('home-find-out-how-btn');
    if (findOutHowBtn) {
        findOutHowBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateTo('bible');
            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
        });
    }
    const homeMailBtn = document.getElementById('home-mail-btn');
    if (homeMailBtn) {
        homeMailBtn.addEventListener('click', () => {
            triggerConfettiVictoryFX();
            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
            alert("✉️ You have 1 unread message: 'Welcome to Super Kid Bible Adventures! Keep exploring to unlock amazing gear for Gizmo!'");
        });
    }

    // Render initial statistics
    document.getElementById('star-coin-label').textContent = state.user.star_coins;
    
    // Render initial Level and XP progress bar
    state.updateXPHeader();
    
    // Setup and render Bible Streak calendar
    state.renderStreakCalendar();
    state.setupStreakCalendarInteractivity();
    
    // Setup Bible story modal events
    setupBibleModal();

    // Equip saved accessories
    renderEquippedGear();
    
    // Initialize admin view based on auth status
    renderAdminView();

    // =====================================================================
    // SETTINGS DRAWER SYSTEM
    // =====================================================================
    function openSettingsDrawer() {
        const drawer = document.getElementById('settings-drawer');
        const overlay = document.getElementById('settings-drawer-overlay');
        if (!drawer || !overlay) return;

        // Update drawer stats live
        const drawerUsername = document.getElementById('drawer-username');
        const drawerLevelBadge = document.getElementById('drawer-level-badge');
        const drawerLevelVal = document.getElementById('drawer-level-val');
        const drawerCoinsVal = document.getElementById('drawer-coins-val');
        const drawerStreakVal = document.getElementById('drawer-streak-val');
        const drawerXpBar = document.getElementById('drawer-xp-bar');
        const drawerXpLabel = document.getElementById('drawer-xp-label');

        if (drawerUsername) drawerUsername.textContent = state.user.display_name || 'Explorer';
        if (drawerLevelBadge) drawerLevelBadge.textContent = `LV.${state.user.level || 1}`;
        if (drawerLevelVal) drawerLevelVal.textContent = state.user.level || 1;
        if (drawerCoinsVal) drawerCoinsVal.textContent = state.user.star_coins || 0;
        if (drawerStreakVal) drawerStreakVal.textContent = state.streak.daysCount || 0;
        if (drawerXpBar) drawerXpBar.style.width = `${state.user.xp || 0}%`;
        if (drawerXpLabel) drawerXpLabel.textContent = `${state.user.xp || 0} / 100 XP`;

        drawer.classList.add('open');
        overlay.classList.add('open');
    }

    function closeSettingsDrawer() {
        const drawer = document.getElementById('settings-drawer');
        const overlay = document.getElementById('settings-drawer-overlay');
        if (drawer) drawer.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
    }

    // Hook hamburger menu button to open drawer
    const headerMenuBtnDrawer = document.getElementById('header-menu-btn');
    if (headerMenuBtnDrawer) {
        // Remove old listener by replacing element clone
        const newMenuBtn = headerMenuBtnDrawer.cloneNode(true);
        headerMenuBtnDrawer.parentNode.replaceChild(newMenuBtn, headerMenuBtnDrawer);
        newMenuBtn.addEventListener('click', () => {
            openSettingsDrawer();
            triggerBubblePopFX(40, 40);
        });
    }

    // Overlay click to close
    const drawerOverlay = document.getElementById('settings-drawer-overlay');
    if (drawerOverlay) {
        drawerOverlay.addEventListener('click', closeSettingsDrawer);
    }

    // Close button
    const drawerCloseBtn = document.getElementById('drawer-close-btn');
    if (drawerCloseBtn) {
        drawerCloseBtn.addEventListener('click', closeSettingsDrawer);
    }

    // Drawer Navigation Items
    function drawerNav(screenId) {
        closeSettingsDrawer();
        setTimeout(() => {
            navigateTo(screenId);
            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
        }, 250);
    }

    const dHome = document.getElementById('drawer-goto-home');
    if (dHome) dHome.addEventListener('click', () => drawerNav('home'));

    const dWatch = document.getElementById('drawer-goto-watch');
    if (dWatch) dWatch.addEventListener('click', () => drawerNav('dashboard'));

    const dGames = document.getElementById('drawer-goto-games');
    if (dGames) dGames.addEventListener('click', () => drawerNav('games'));

    const dBible = document.getElementById('drawer-goto-bible');
    if (dBible) dBible.addEventListener('click', () => drawerNav('bible'));

    const dQuests = document.getElementById('drawer-goto-quests');
    if (dQuests) dQuests.addEventListener('click', () => drawerNav('contests'));

    const dShop = document.getElementById('drawer-goto-shop');
    if (dShop) dShop.addEventListener('click', () => drawerNav('shop'));

    const dAdmin = document.getElementById('drawer-goto-admin');
    if (dAdmin) dAdmin.addEventListener('click', () => drawerNav('admin'));

    // Language selector (placeholder)
    const dLang = document.getElementById('drawer-language-btn');
    if (dLang) {
        dLang.addEventListener('click', () => {
            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
            alert('🌐 Language Settings\n\nAvailable: English (EN)\nMore languages coming soon!');
        });
    }

    // FAQ button
    const dFaq = document.getElementById('drawer-faq-btn');
    if (dFaq) {
        dFaq.addEventListener('click', () => {
            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
            alert('❓ Help & FAQs\n\n🔹 How do I earn coins?\nWatch episodes and complete quizzes!\n\n🔹 How does the streak work?\nTap a day on the calendar after completing Bible study!\n\n🔹 How do I unlock episodes?\nFinish watching and pass the quiz!');
        });
    }

    // Reset Progress button
    const dReset = document.getElementById('drawer-reset-btn');
    if (dReset) {
        dReset.addEventListener('click', () => {
            if (confirm('⚠️ Are you sure you want to reset all your progress?\nThis will clear all coins, XP, streak, and episode history.')) {
                localStorage.clear();
                forceUserLogout();
            }
        });
    }

    // Hook Games Hub views and canvas controls
    setupGamesScreen();

    // Navigate home
    navigateTo('home');
});

// --- RETRO SOUND SYNTHESIZER (WEB AUDIO API) ---
class RetroSynthSound {
    constructor() {
        this.ctx = null;
    }
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    playJump() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }
    playCoin() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
    }
    playHover() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.linearRampToValueAtTime(130, now + 0.08);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    }
    playCrash() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.45;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, now);
        filter.frequency.exponentialRampToValueAtTime(10, now + 0.45);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.45);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(now);
        source.stop(now + 0.45);
    }
    playUnlock() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.0, now);
            gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
            gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.35);
        });
    }
}
const synthSound = new RetroSynthSound();

// --- BIBLE HERO DASH CANVAS MINI-GAME ENGINE ---
class HeroDashGame {
    constructor(canvas, state) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = state;
        
        // Dimensions
        this.canvas.width = 800;
        this.canvas.height = 400;
        
        // Game states
        this.active = false;
        this.score = 0;
        this.starCoins = 0;
        this.scriptGems = 0;
        this.distance = 0;
        this.speed = 5.5;
        this.groundHeight = 70;
        
        // Physics constants
        this.gravity = 0.52;
        this.jumpForce = -11.0;
        this.doubleJumpForce = -9.0;
        this.hoverForce = -0.42;
        
        // Load sprite images
        this.imgMascot = new Image();
        this.imgMascot.src = 'assets/mascot.png';
        this.imgVisor = new Image();
        this.imgVisor.src = 'assets/visor.png';
        this.imgJetpack = new Image();
        this.imgJetpack.src = 'assets/jetpack.png';
        
        // Game entities
        this.player = null;
        this.obstacles = [];
        this.coins = [];
        this.gems = [];
        this.stars = [];
        this.clouds = [];
        this.smokeParticles = [];
        this.explosionParticles = [];
        
        // Inputs
        this.actionKeyHeld = false;
        this.setupInputListeners();
    }
    
    setupInputListeners() {
        // Space bar trigger
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                if (this.state.currentScreen === 'games' && this.active) {
                    e.preventDefault();
                    if (!this.actionKeyHeld) {
                        this.triggerPlayerJump();
                    }
                    this.actionKeyHeld = true;
                }
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.actionKeyHeld = false;
            }
        });
        
        // Touch triggers on canvas wrapper
        const wrapper = this.canvas.parentElement;
        if (wrapper) {
            wrapper.addEventListener('touchstart', (e) => {
                if (this.active) {
                    e.preventDefault();
                    this.triggerPlayerJump();
                    this.actionKeyHeld = true;
                }
            }, { passive: false });
            wrapper.addEventListener('touchend', (e) => {
                this.actionKeyHeld = false;
            });
            wrapper.addEventListener('mousedown', (e) => {
                if (this.active) {
                    this.triggerPlayerJump();
                    this.actionKeyHeld = true;
                }
            });
            wrapper.addEventListener('mouseup', () => {
                this.actionKeyHeld = false;
            });
        }
        
        // Touch trigger on JUMP HUD button
        const jumpBtn = document.getElementById('game-jump-btn');
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.active) {
                    this.triggerPlayerJump();
                    this.actionKeyHeld = true;
                    jumpBtn.classList.add('hovering-mode');
                }
            }, { passive: false });
            jumpBtn.addEventListener('touchend', () => {
                this.actionKeyHeld = false;
                jumpBtn.classList.remove('hovering-mode');
            });
            jumpBtn.addEventListener('mousedown', () => {
                if (this.active) {
                    this.triggerPlayerJump();
                    this.actionKeyHeld = true;
                    jumpBtn.classList.add('hovering-mode');
                }
            });
            jumpBtn.addEventListener('mouseup', () => {
                this.actionKeyHeld = false;
                jumpBtn.classList.remove('hovering-mode');
            });
        }
    }
    
    triggerPlayerJump() {
        if (!this.player || !this.active) return;
        
        if (this.player.isGrounded) {
            this.player.vy = this.jumpForce;
            this.player.isGrounded = false;
            this.player.doubleJumpAvailable = true;
            synthSound.playJump();
            this.spawnSmoke(this.player.x + 10, this.player.y + this.player.height, 6);
        } else if (this.player.doubleJumpAvailable) {
            this.player.vy = this.doubleJumpForce;
            this.player.doubleJumpAvailable = false;
            synthSound.playJump();
            this.spawnSmoke(this.player.x + 10, this.player.y + this.player.height, 8);
        }
    }
    
    start() {
        this.active = true;
        this.score = 0;
        this.starCoins = 0;
        this.scriptGems = 0;
        this.distance = 0;
        this.speed = 5.5;
        this.actionKeyHeld = false;
        
        // Initialize player
        this.player = {
            x: 120,
            y: this.canvas.height - this.groundHeight - 55,
            width: 55,
            height: 55,
            vy: 0,
            isGrounded: false,
            doubleJumpAvailable: true,
            hoverFuel: 100,
            hovering: false
        };
        
        // Empty entities
        this.obstacles = [];
        this.coins = [];
        this.gems = [];
        this.smokeParticles = [];
        this.explosionParticles = [];
        
        // Generate stars parallax backgrounds
        this.stars = [];
        for (let i = 0; i < 40; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height - 100),
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.4 + 0.1
            });
        }
        
        // Generate glowing nebulas / bubble clouds
        this.clouds = [];
        for (let i = 0; i < 6; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height - 180),
                radius: Math.random() * 40 + 20,
                speed: Math.random() * 0.8 + 0.3,
                color: `rgba(${Math.random() > 0.5 ? '0, 240, 255' : '255, 0, 157'}, 0.08)`
            });
        }
        
        // Spawn first obstacles and coins ahead
        this.spawnObstacleTimer = 0;
        this.spawnCoinTimer = 0;
        
        // Hide overlays
        document.getElementById('game-start-overlay').style.display = 'none';
        document.getElementById('game-over-overlay').style.display = 'none';
        document.getElementById('game-over-gems-box').style.display = 'none';
        
        // Trigger loop
        this.loop();
    }
    
    spawnSmoke(x, y, count) {
        for (let i = 0; i < count; i++) {
            this.smokeParticles.push({
                x: x,
                y: y,
                vx: -this.speed * 0.5 + (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                radius: Math.random() * 6 + 3,
                opacity: 0.8,
                color: 'rgba(0, 240, 255, 0.4)'
            });
        }
    }
    
    spawnExplosion(x, y) {
        for (let i = 0; i < 24; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 8 + 3;
            this.explosionParticles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                radius: Math.random() * 8 + 4,
                opacity: 1.0,
                color: Math.random() > 0.5 ? '#ff4757' : '#ffaa00'
            });
        }
    }
    
    loop() {
        if (!this.active) return;
        
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.loop());
    }
    
    update() {
        const hasJetpack = this.state.user.avatar_custom_data.equipped_gear === 'plasma_jetpack';
        
        // 1. Distance & Score
        this.distance += 0.15;
        this.score = Math.floor(this.distance * 2 + this.starCoins * 30);
        
        // Speed scaling
        this.speed = 5.5 + Math.min(6, this.distance / 180);
        
        // 2. HUD values
        document.getElementById('game-hud-score').textContent = this.score;
        document.getElementById('game-hud-coins').textContent = this.starCoins;
        document.getElementById('game-hud-gems').textContent = this.scriptGems;
        
        // 3. Player Physics
        // Jetpack hover
        if (hasJetpack && this.actionKeyHeld && !this.player.isGrounded && this.player.hoverFuel > 0) {
            this.player.vy += this.hoverForce;
            if (this.player.vy < -3.5) this.player.vy = -3.5;
            this.player.hoverFuel -= 0.8;
            this.player.hovering = true;
            
            // Thrust flame sound & smoke
            if (Math.random() < 0.35) synthSound.playHover();
            this.spawnSmoke(this.player.x - 2, this.player.y + this.player.height * 0.7, 2);
        } else {
            this.player.hovering = false;
            if (this.player.isGrounded && this.player.hoverFuel < 100) {
                this.player.hoverFuel += 1.5;
            }
        }
        
        // Gravity
        this.player.vy += this.gravity;
        this.player.y += this.player.vy;
        
        // Ground constraint
        const groundLevel = this.canvas.height - this.groundHeight - this.player.height;
        if (this.player.y >= groundLevel) {
            this.player.y = groundLevel;
            this.player.vy = 0;
            this.player.isGrounded = true;
            this.player.doubleJumpAvailable = true;
        }
        
        // 4. Parallax Background updates
        this.stars.forEach(star => {
            star.x -= star.speed * (this.speed * 0.4);
            if (star.x < -10) star.x = this.canvas.width + 10;
        });
        
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed * (this.speed * 0.3);
            if (cloud.x < -cloud.radius * 2) {
                cloud.x = this.canvas.width + cloud.radius * 2;
                cloud.y = Math.random() * (this.canvas.height - 180);
            }
        });
        
        // 5. Smoke & Explosion particles
        this.smokeParticles.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            p.opacity -= 0.025;
            p.radius *= 0.96;
            if (p.opacity <= 0) {
                this.smokeParticles.splice(idx, 1);
            }
        });
        
        this.explosionParticles.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            p.opacity -= 0.02;
            p.radius *= 0.95;
            if (p.opacity <= 0) {
                this.explosionParticles.splice(idx, 1);
            }
        });
        
        // 6. Spawn procedural entities
        this.spawnObstacleTimer += 1;
        const obstacleSpawnInterval = Math.max(75, 180 - Math.floor(this.distance / 12));
        if (this.spawnObstacleTimer >= obstacleSpawnInterval) {
            this.spawnObstacleTimer = 0;
            const floatLevel = Math.random() > 0.45;
            this.obstacles.push({
                x: this.canvas.width + 50,
                y: floatLevel ? this.canvas.height - this.groundHeight - 110 : this.canvas.height - this.groundHeight - 40,
                width: 32,
                height: 32,
                angle: 0,
                rotateSpeed: Math.random() * 0.06 + 0.03
            });
        }
        
        this.spawnCoinTimer += 1;
        if (this.spawnCoinTimer >= 45) {
            this.spawnCoinTimer = 0;
            const baseHeight = Math.random() > 0.5 ? 180 : 260;
            const coinCount = Math.floor(Math.random() * 3) + 3;
            for (let i = 0; i < coinCount; i++) {
                this.coins.push({
                    x: this.canvas.width + 50 + (i * 35),
                    y: baseHeight + Math.sin(i * 0.7) * 25,
                    width: 20,
                    height: 20,
                    phase: i * 0.3
                });
            }
        }
        
        if (Math.random() < 0.0015 && this.scriptGems === 0 && this.distance > 180) {
            this.gems.push({
                x: this.canvas.width + 50,
                y: 160 + Math.random() * 80,
                width: 25,
                height: 25
            });
        }
        
        // 7. Update & Collision entities
        this.obstacles.forEach((obs, idx) => {
            obs.x -= this.speed;
            obs.angle += obs.rotateSpeed;
            if (obs.x < -60) {
                this.obstacles.splice(idx, 1);
            }
            
            if (this.checkCollision(this.player, obs)) {
                this.crashAndGameOver();
            }
        });
        
        this.coins.forEach((coin, idx) => {
            coin.x -= this.speed;
            coin.y += Math.sin(Date.now() * 0.005 + coin.phase) * 0.6;
            
            if (coin.x < -40) {
                this.coins.splice(idx, 1);
            }
            
            if (this.checkCollision(this.player, coin)) {
                this.coins.splice(idx, 1);
                this.starCoins++;
                synthSound.playCoin();
            }
        });
        
        this.gems.forEach((gem, idx) => {
            gem.x -= this.speed;
            if (gem.x < -40) {
                this.gems.splice(idx, 1);
            }
            
            if (this.checkCollision(this.player, gem)) {
                this.gems.splice(idx, 1);
                this.scriptGems = 1;
                synthSound.playUnlock();
                triggerConfettiVictoryFX();
            }
        });
    }
    
    checkCollision(rect1, rect2) {
        const pad1 = 6;
        const pad2 = 4;
        return (
            rect1.x + pad1 < rect2.x + rect2.width - pad2 &&
            rect1.x + rect1.width - pad1 > rect2.x + pad2 &&
            rect1.y + pad1 < rect2.y + rect2.height - pad2 &&
            rect1.y + rect1.height - pad1 > rect2.y + pad2
        );
    }
    
    crashAndGameOver() {
        this.active = false;
        synthSound.playCrash();
        this.spawnExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        
        setTimeout(() => {
            this.showGameOverScreen();
        }, 1000);
    }
    
    showGameOverScreen() {
        let coinsPayout = this.starCoins;
        let multiplyMultiplier = 1;
        
        const overGemsBox = document.getElementById('game-over-gems-box');
        const scriptureText = document.getElementById('unlocked-verse-text');
        
        if (this.scriptGems > 0) {
            multiplyMultiplier = 2;
            coinsPayout = this.starCoins * 2;
            
            if (overGemsBox) overGemsBox.style.display = 'block';
            
            const BIBLE_VERSES = [
                '"Your word is a lamp to my feet and a light to my path." - Psalm 119:105',
                '"I can do all things through Christ who strengthens me." - Philippians 4:13',
                '"Trust in the Lord with all your heart." - Proverbs 3:5',
                '"Be strong and courageous. Do not be afraid; the Lord your God is with you." - Joshua 1:9',
                '"God is our refuge and strength, a very present help in trouble." - Psalm 46:1',
                '"The Lord is my shepherd; I shall not want." - Psalm 23:1',
                '"For God so loved the world, that he gave his only Son." - John 3:16'
            ];
            const verse = BIBLE_VERSES[Math.floor(Math.random() * BIBLE_VERSES.length)];
            if (scriptureText) scriptureText.textContent = verse;
        }
        
        const summaryText = document.getElementById('game-over-summary');
        if (summaryText) {
            summaryText.innerHTML = `Excellent run! You scored <strong>${this.score}</strong> points, ran <strong>${Math.floor(this.distance)}m</strong>, and grabbed <strong>${this.starCoins}</strong> Star Coins!${this.scriptGems > 0 ? '<br><span style="color:#00ff7f; font-weight:700;"> Scripture Multiplier Active: Double Coins Payout!</span>' : ''}`;
        }
        
        lastClickX = window.innerWidth / 2;
        lastClickY = window.innerHeight / 2;
        
        if (coinsPayout > 0) {
            this.state.incrementCoins(coinsPayout);
        }
        
        const xpPayout = Math.min(40, Math.floor(this.score / 15));
        if (xpPayout > 0) {
            setTimeout(() => {
                this.state.incrementXP(xpPayout);
                this.state.saveUser();
                
                const coinLabel = document.getElementById('star-coin-label');
                if (coinLabel) coinLabel.textContent = this.state.user.star_coins;
                const drawerCoinsVal = document.getElementById('drawer-coins-val');
                if (drawerCoinsVal) drawerCoinsVal.textContent = this.state.user.star_coins;
            }, 1000);
        } else {
            this.state.saveUser();
        }
        
        if (this.score > 800) {
            setTimeout(() => {
                triggerConfettiVictoryFX();
            }, 400);
        }
        
        document.getElementById('game-over-overlay').style.display = 'flex';
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGrad.addColorStop(0, '#04070d');
        skyGrad.addColorStop(0.6, '#080d19');
        skyGrad.addColorStop(1, '#0e172e');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.stars.forEach(star => {
            this.ctx.globalAlpha = star.size * 0.35;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        this.ctx.globalAlpha = 1.0;
        
        this.clouds.forEach(cloud => {
            this.ctx.fillStyle = cloud.color;
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.fillStyle = '#060a13';
        this.ctx.fillRect(0, this.canvas.height - this.groundHeight, this.canvas.width, this.groundHeight);
        
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - this.groundHeight);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - this.groundHeight);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        this.ctx.lineWidth = 1;
        const gridSpacing = 36;
        const groundY = this.canvas.height - this.groundHeight;
        
        const offsetX = (this.distance * this.speed) % gridSpacing;
        for (let x = -gridSpacing; x < this.canvas.width + gridSpacing; x += gridSpacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(x - offsetX, groundY);
            const destX = (x - offsetX - this.canvas.width / 2) * 1.35 + this.canvas.width / 2;
            this.ctx.lineTo(destX, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = groundY; y < this.canvas.height; y += 15) {
            const opacity = 0.15 * (1 - (y - groundY) / this.groundHeight);
            this.ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        this.smokeParticles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.opacity;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;
        
        this.coins.forEach(coin => {
            const pulse = 1 + Math.sin(Date.now() * 0.01 + coin.phase) * 0.08;
            const cx = coin.x + coin.width / 2;
            const cy = coin.y + coin.height / 2;
            const r = (coin.width / 2) * pulse;
            
            this.ctx.fillStyle = 'rgba(255, 208, 0, 0.2)';
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            const goldGrad = this.ctx.createLinearGradient(coin.x, coin.y, coin.x, coin.y + coin.height);
            goldGrad.addColorStop(0, '#ffe552');
            goldGrad.addColorStop(1, '#d48800');
            this.ctx.fillStyle = goldGrad;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#613c00';
            this.ctx.font = `bold ${Math.floor(r * 1.35)}px Fredoka`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('★', cx, cy + 0.5);
        });
        
        this.gems.forEach(gem => {
            const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.12;
            const cx = gem.x + gem.width / 2;
            const cy = gem.y + gem.height / 2;
            const hw = (gem.width / 2) * pulse;
            const hh = (gem.height / 2) * pulse;
            
            this.ctx.shadowColor = '#ff009d';
            this.ctx.shadowBlur = 15;
            
            this.ctx.fillStyle = '#ff009d';
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy - hh);
            this.ctx.lineTo(cx + hw, cy);
            this.ctx.lineTo(cx, cy + hh);
            this.ctx.lineTo(cx - hw, cy);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(cx - hw * 0.4, cy);
            this.ctx.lineTo(cx, cy - hh * 0.4);
            this.ctx.stroke();
        });
        
        this.obstacles.forEach(obs => {
            const cx = obs.x + obs.width / 2;
            const cy = obs.y + obs.height / 2;
            const r = obs.width / 2;
            
            this.ctx.save();
            this.ctx.translate(cx, cy);
            this.ctx.rotate(obs.angle);
            
            this.ctx.strokeStyle = '#ff4757';
            this.ctx.lineWidth = 4;
            for (let i = 0; i < 8; i++) {
                this.ctx.rotate(Math.PI / 4);
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(0, r + 6);
                this.ctx.stroke();
            }
            
            const ballGrad = this.ctx.createRadialGradient(-2, -2, 2, 0, 0, r);
            ballGrad.addColorStop(0, '#57606f');
            ballGrad.addColorStop(0.7, '#2f3542');
            ballGrad.addColorStop(1, '#000000');
            this.ctx.fillStyle = ballGrad;
            this.ctx.strokeStyle = '#ff4757';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, r, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#ff4757';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
        
        if (this.player) {
            const px = this.player.x;
            const py = this.player.y;
            const pw = this.player.width;
            const ph = this.player.height;
            
            const equipped = this.state.user.avatar_custom_data.equipped_gear;
            
            if (equipped === 'plasma_jetpack') {
                try {
                    this.ctx.drawImage(this.imgJetpack, px - 18, py + ph * 0.35, 34, 34);
                } catch (e) {
                    this.ctx.fillStyle = '#00f0ff';
                    this.ctx.fillRect(px - 14, py + ph * 0.3, 14, 24);
                    this.ctx.fillStyle = '#ff4757';
                    this.ctx.fillRect(px - 10, py + ph * 0.3 + 4, 6, 16);
                }
                
                if (this.player.hovering) {
                    const fireGrad = this.ctx.createLinearGradient(px - 10, py + ph * 0.7, px - 10, py + ph + 20);
                    fireGrad.addColorStop(0, '#fffa65');
                    fireGrad.addColorStop(0.4, '#ff9f43');
                    fireGrad.addColorStop(1, 'rgba(255, 46, 68, 0.0)');
                    this.ctx.fillStyle = fireGrad;
                    this.ctx.beginPath();
                    this.ctx.moveTo(px - 16, py + ph * 0.85);
                    this.ctx.lineTo(px - 8, py + ph * 0.85);
                    this.ctx.lineTo(px - 12, py + ph + 15 + Math.random() * 8);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            }
            
            try {
                this.ctx.drawImage(this.imgMascot, px, py, pw, ph);
            } catch (e) {
                const cx = px + pw / 2;
                const cy = py + ph / 2;
                
                this.ctx.shadowColor = '#00f0ff';
                this.ctx.shadowBlur = 8;
                
                const bodyGrad = this.ctx.createLinearGradient(px, py, px, py + ph);
                bodyGrad.addColorStop(0, '#00d2ff');
                bodyGrad.addColorStop(1, '#0072ff');
                this.ctx.fillStyle = bodyGrad;
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2.5;
                this.ctx.beginPath();
                this.ctx.arc(cx, cy, pw / 2 - 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
                
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                this.ctx.beginPath();
                this.ctx.arc(cx - pw * 0.15, cy - ph * 0.15, pw * 0.12, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#0f172a';
                this.ctx.beginPath();
                this.ctx.roundRect(cx - 16, cy - 8, 32, 14, 6);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#00ff7f';
                this.ctx.beginPath();
                this.ctx.arc(cx - 8, cy - 1, 3, 0, Math.PI * 2);
                this.ctx.arc(cx + 8, cy - 1, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            if (equipped === 'cyber_visor') {
                try {
                    this.ctx.drawImage(this.imgVisor, px + pw * 0.28, py + ph * 0.18, 38, 25);
                } catch (e) {
                    this.ctx.fillStyle = '#ff009d';
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 1.5;
                    this.ctx.beginPath();
                    this.ctx.roundRect(px + pw * 0.35, py + ph * 0.22, 22, 8, 3);
                    this.ctx.fill();
                    this.ctx.stroke();
                }
            }
        }
        
        this.explosionParticles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.opacity;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;
    }
}

// --- GAMES HUB MANAGER CONTROLLER ---
function renderGamesHub() {
    const hub = document.getElementById('games-hub-view');
    const runner = document.getElementById('hero-dash-view');
    
    if (hub) hub.style.display = 'block';
    if (runner) runner.style.display = 'none';
    
    if (window.runnerGameInstance) {
        window.runnerGameInstance.active = false;
    }
}

function setupGamesScreen() {
    const hubCardRunner = document.getElementById('play-hero-dash-card');
    const hubCardTrivia = document.getElementById('play-quizzes-card');
    const exitRunnerBtn = document.getElementById('games-exit-runner-btn');
    const startGameBtn = document.getElementById('start-game-btn');
    const restartGameBtn = document.getElementById('restart-game-btn');
    
    const gamesHub = document.getElementById('games-hub-view');
    const runnerArena = document.getElementById('hero-dash-view');
    const canvas = document.getElementById('hero-dash-canvas');
    
    if (!canvas) return;
    
    if (!window.runnerGameInstance) {
        window.runnerGameInstance = new HeroDashGame(canvas, state);
    }
    
    if (hubCardRunner) {
        hubCardRunner.addEventListener('click', () => {
            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
            
            if (gamesHub) gamesHub.style.display = 'none';
            if (runnerArena) runnerArena.style.display = 'block';
            
            document.getElementById('game-start-overlay').style.display = 'flex';
            document.getElementById('game-over-overlay').style.display = 'none';
            
            const jetpackHint = document.getElementById('jetpack-power-hint');
            const equipped = state.user.avatar_custom_data.equipped_gear;
            if (jetpackHint) {
                jetpackHint.style.display = (equipped === 'plasma_jetpack') ? 'block' : 'none';
            }
            
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#060a13';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
            ctx.fillRect(0, canvas.height - 70, canvas.width, 3);
        });
    }
    
    if (hubCardTrivia) {
        hubCardTrivia.addEventListener('click', () => {
            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
            navigateTo('quizzes');
        });
    }
    
    if (exitRunnerBtn) {
        exitRunnerBtn.addEventListener('click', () => {
            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
            renderGamesHub();
        });
    }
    
    // Touch-safe helper to start game
    function bindStartTrigger(btn) {
        if (!btn) return;
        let triggered = false;
        const triggerHandler = (e) => {
            e.preventDefault();
            if (triggered) return;
            triggered = true;
            setTimeout(() => { triggered = false; }, 800); // 800ms debounce
            
            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
            if (window.runnerGameInstance) {
                window.runnerGameInstance.start();
            }
        };
        btn.addEventListener('click', triggerHandler);
        btn.addEventListener('touchstart', triggerHandler, { passive: false });
    }

    bindStartTrigger(startGameBtn);
    bindStartTrigger(restartGameBtn);
}

// PWA Install Prompt handling
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const pwaBtn = document.getElementById('pwa-install-btn');
    if (pwaBtn) {
        pwaBtn.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.8)';
    }
});

safeInit(() => {
    const pwaBtn = document.getElementById('pwa-install-btn');
    if (pwaBtn) {
        pwaBtn.addEventListener('click', async () => {
            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
            if (!deferredPrompt) {
                alert('💡 PWA installation is not supported by your current browser, or it has already been installed.\n\n🍏 On iOS (Safari):\nTap the Share button 📤 and select "Add to Home Screen" ➕\n\n🤖 On Android (Chrome):\nTap the three dots icon ⫶ and select "Install app" or "Add to Home Screen".');
                return;
            }
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install: ${outcome}`);
            deferredPrompt = null;
        });
    }
});

/* =====================================================================
   HOME SCREEN V2 — MISSION CONTROL LOGIC
   ===================================================================== */

// 365 Daily Bible Verses (cycling by day of year)
const DAILY_VERSES = [
    { text: "For God so loved the world that he gave his one and only Son.", ref: "John 3:16" },
    { text: "I can do all this through him who gives me strength.", ref: "Philippians 4:13" },
    { text: "Trust in the Lord with all your heart and lean not on your own understanding.", ref: "Proverbs 3:5" },
    { text: "The Lord is my shepherd, I lack nothing.", ref: "Psalm 23:1" },
    { text: "Be strong and courageous. Do not be afraid; do not be discouraged.", ref: "Joshua 1:9" },
    { text: "And we know that in all things God works for the good of those who love him.", ref: "Romans 8:28" },
    { text: "The Lord is my light and my salvation—whom shall I fear?", ref: "Psalm 27:1" },
    { text: "Cast all your anxiety on him because he cares for you.", ref: "1 Peter 5:7" },
    { text: "Children are a heritage from the Lord, offspring a reward from him.", ref: "Psalm 127:3" },
    { text: "Let your light shine before others, that they may see your good deeds.", ref: "Matthew 5:16" },
    { text: "Love is patient, love is kind. It does not envy, it does not boast.", ref: "1 Corinthians 13:4" },
    { text: "Even youths grow tired and weary, but those who hope in the Lord will renew their strength.", ref: "Isaiah 40:31" },
    { text: "The Lord your God is with you, the Mighty Warrior who saves.", ref: "Zephaniah 3:17" },
    { text: "Delight yourself in the Lord, and he will give you the desires of your heart.", ref: "Psalm 37:4" },
    { text: "With God all things are possible.", ref: "Matthew 19:26" },
    { text: "Your word is a lamp for my feet, a light on my path.", ref: "Psalm 119:105" },
    { text: "For I know the plans I have for you, plans to prosper you and not to harm you.", ref: "Jeremiah 29:11" },
    { text: "Do not be anxious about anything, but in every situation present your requests to God.", ref: "Philippians 4:6" },
    { text: "The joy of the Lord is your strength.", ref: "Nehemiah 8:10" },
    { text: "He gives strength to the weary and increases the power of the weak.", ref: "Isaiah 40:29" },
    { text: "Be kind and compassionate to one another, forgiving each other.", ref: "Ephesians 4:32" },
    { text: "A cheerful heart is good medicine, but a crushed spirit dries up the bones.", ref: "Proverbs 17:22" },
    { text: "God is our refuge and strength, an ever-present help in trouble.", ref: "Psalm 46:1" },
    { text: "In the beginning God created the heavens and the earth.", ref: "Genesis 1:1" },
    { text: "Give thanks to the Lord, for he is good; his love endures forever.", ref: "Psalm 107:1" },
    { text: "Do unto others as you would have them do to you.", ref: "Luke 6:31" },
    { text: "The earth is the Lord's, and everything in it.", ref: "Psalm 24:1" },
    { text: "Rejoice always, pray continually, give thanks in all circumstances.", ref: "1 Thessalonians 5:16-18" },
    { text: "Love the Lord your God with all your heart and with all your soul.", ref: "Matthew 22:37" },
    { text: "Blessed are the pure in heart, for they will see God.", ref: "Matthew 5:8" },
];

function setupMissionControlHome() {
    updateGreetingBanner();
    setupHeroCarousel();
    setupQuickLaunchGrid();
    updateMissionCard();
    updateChallengeProgress();
}

function updateGreetingBanner() {
    const hour = new Date().getHours();
    let greeting = hour < 12 ? 'Good Morning! ☀️' : hour < 18 ? 'Good Afternoon! 🌤️' : 'Good Evening! 🌙';

    const greetLabel = document.getElementById('home-greeting-label');
    const greetName = document.getElementById('home-greeting-name');
    const streakBadge = document.getElementById('home-streak-badge');
    const levelText = document.getElementById('greeting-level-text');

    if (greetLabel) greetLabel.textContent = greeting;
    if (greetName) greetName.textContent = state.user.display_name || 'Super Kid';
    if (streakBadge) {
        const days = state.streak ? state.streak.daysCount : 1;
        const emoji = days >= 7 ? '🔥' : days >= 3 ? '⚡' : '📖';
        streakBadge.textContent = `${emoji} ${days} Day${days > 1 ? 's' : ''} Streak`;
    }
    if (levelText) levelText.textContent = `LV.${state.user.level || 1}`;
}

function updateMissionCard() {
    const nextEpIndex = state.user.unlocked_index || 1;
    const nextEp = state.episodes.find(ep => ep.order_index === nextEpIndex);
    const title = document.getElementById('mission-title');
    const desc = document.getElementById('mission-desc');
    const ctaBtn = document.getElementById('mission-cta-btn');

    if (nextEp && title && desc) {
        title.textContent = `Watch Episode ${nextEp.order_index}`;
        desc.textContent = nextEp.description || 'Watch the full episode to unlock the quiz and earn coins!';
    } else if (title) {
        title.textContent = 'All caught up! 🎉';
        if (desc) desc.textContent = 'You have watched all available episodes. Check back for more!';
    }

    if (ctaBtn) {
        ctaBtn.addEventListener('click', () => {
            navigateTo('dashboard');
        });
    }

    // Set verse of the day
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const verse = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
    const verseText = document.getElementById('home-verse-text');
    const verseRef = document.getElementById('home-verse-ref');
    if (verseText) verseText.textContent = `"${verse.text}"`;
    if (verseRef) verseRef.textContent = `— ${verse.ref}`;
}

function updateChallengeProgress() {
    const weeklyGoal = parseInt(localStorage.getItem('superkid_weekly_goal') || '3');
    const watchedCount = Math.min(state.user.unlocked_index - 1, weeklyGoal);
    const pct = Math.min((watchedCount / weeklyGoal) * 100, 100);

    const bar = document.getElementById('challenge-progress-bar');
    const txt = document.getElementById('challenge-progress-text');
    if (bar) bar.style.width = `${pct}%`;
    if (txt) txt.textContent = `${watchedCount} of ${weeklyGoal} done`;
}

function setupHeroCarousel() {
    const track = document.getElementById('hero-carousel-track');
    const dots = document.querySelectorAll('.carousel-dot');
    if (!track) return;

    let currentSlide = 0;
    const totalSlides = 3;

    function goToSlide(index) {
        currentSlide = ((index % totalSlides) + totalSlides) % totalSlides;
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
    }

    // Dot clicks
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => goToSlide(i));
    });

    // Touch swipe
    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) goToSlide(currentSlide + (diff > 0 ? 1 : -1));
    });

    // Auto-advance every 5s
    setInterval(() => goToSlide(currentSlide + 1), 5000);
}

function setupQuickLaunchGrid() {
    document.querySelectorAll('.quick-launch-btn').forEach(btn => {
        const target = btn.dataset.nav;
        if (!target) return;
        btn.addEventListener('click', () => {
            triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
            navigateTo(target);
        });
    });
}

/* =====================================================================
   PARENT ADMIN PANEL (PIN-Gated Dashboard)
   ===================================================================== */

const DEFAULT_PIN = '1234';
let adminPinBuffer = '';

function setupParentAdminPanel() {
    const gate = document.getElementById('admin-pin-gate');
    const dashboard = document.getElementById('admin-dashboard');
    const dots = document.querySelectorAll('#admin-pin-dots .pin-dot');
    const keys = document.querySelectorAll('.pin-key');

    if (!gate) return;

    function updateDots() {
        dots.forEach((dot, i) => {
            dot.classList.toggle('filled', i < adminPinBuffer.length);
            dot.classList.remove('error');
        });
    }

    function shakeDotsError() {
        dots.forEach(d => { d.classList.remove('filled'); d.classList.add('error'); });
        setTimeout(() => {
            adminPinBuffer = '';
            dots.forEach(d => d.classList.remove('error'));
        }, 700);
    }

    function submitPin() {
        const savedPin = localStorage.getItem('superkid_parent_pin') || DEFAULT_PIN;
        if (adminPinBuffer === savedPin) {
            gate.style.display = 'none';
            dashboard.classList.remove('hidden');
            populateAdminDashboard();
        } else {
            shakeDotsError();
        }
    }

    keys.forEach(key => {
        key.addEventListener('click', () => {
            const k = key.dataset.key;
            if (k === 'clear') {
                adminPinBuffer = adminPinBuffer.slice(0, -1);
                updateDots();
            } else if (k === 'submit') {
                submitPin();
            } else if (adminPinBuffer.length < 4) {
                adminPinBuffer += k;
                updateDots();
                if (adminPinBuffer.length === 4) {
                    setTimeout(submitPin, 150);
                }
            }
        });
    });

    // Back & Lock buttons
    const backBtn = document.getElementById('admin-back-btn');
    const lockBtn = document.getElementById('admin-lock-btn');
    if (backBtn) backBtn.addEventListener('click', () => navigateTo('home'));
    if (lockBtn) lockBtn.addEventListener('click', () => {
        dashboard.classList.add('hidden');
        gate.style.display = 'flex';
        adminPinBuffer = '';
        updateDots();
    });

    // Goal stepper
    let goalEpisodes = parseInt(localStorage.getItem('superkid_weekly_goal') || '3');
    const goalVal = document.getElementById('goal-episodes-val');
    if (goalVal) goalVal.textContent = goalEpisodes;

    const decBtn = document.getElementById('goal-dec-btn');
    const incBtn = document.getElementById('goal-inc-btn');
    if (decBtn) decBtn.addEventListener('click', () => {
        goalEpisodes = Math.max(1, goalEpisodes - 1);
        if (goalVal) goalVal.textContent = goalEpisodes;
    });
    if (incBtn) incBtn.addEventListener('click', () => {
        goalEpisodes = Math.min(7, goalEpisodes + 1);
        if (goalVal) goalVal.textContent = goalEpisodes;
    });

    const saveGoalBtn = document.getElementById('admin-save-goal-btn');
    const goalStatus = document.getElementById('admin-goal-status');
    if (saveGoalBtn) saveGoalBtn.addEventListener('click', () => {
        localStorage.setItem('superkid_weekly_goal', goalEpisodes);
        updateChallengeProgress();
        if (goalStatus) {
            goalStatus.textContent = '✅ Goal saved!';
            setTimeout(() => { goalStatus.textContent = ''; }, 2500);
        }
    });

    // Change PIN
    const changePinBtn = document.getElementById('admin-change-pin-btn');
    const pinInput = document.getElementById('admin-new-pin-input');
    const pinStatus = document.getElementById('admin-pin-status');
    if (changePinBtn && pinInput) {
        changePinBtn.addEventListener('click', () => {
            const newPin = pinInput.value.trim();
            if (/^\d{4}$/.test(newPin)) {
                localStorage.setItem('superkid_parent_pin', newPin);
                pinInput.value = '';
                if (pinStatus) {
                    pinStatus.textContent = '✅ PIN updated!';
                    setTimeout(() => { pinStatus.textContent = ''; }, 2500);
                }
            } else {
                if (pinStatus) {
                    pinStatus.style.color = '#ff6060';
                    pinStatus.textContent = '❌ Enter a valid 4-digit PIN';
                    setTimeout(() => { pinStatus.textContent = ''; pinStatus.style.color = '#4ade80'; }, 2500);
                }
            }
        });
    }

    // YouTube Channel Sync Setup
    const saveYtBtn = document.getElementById('admin-save-yt-btn');
    if (saveYtBtn) {
        saveYtBtn.addEventListener('click', async () => {
            const ytInput = document.getElementById('admin-yt-channel-input');
            if (ytInput) {
                const url = ytInput.value.trim();
                if (url) {
                    await syncYoutubeChannel(url, true);
                } else {
                    const statusEl = document.getElementById('admin-yt-status');
                    if (statusEl) {
                        statusEl.textContent = "⚠️ Please enter a channel URL or handle.";
                        statusEl.style.color = "#ffaa00";
                    }
                }
            }
        });
    }
}

function populateAdminDashboard() {
    const goalEpisodes = parseInt(localStorage.getItem('superkid_weekly_goal') || '3');
    const goalVal = document.getElementById('goal-episodes-val');
    if (goalVal) goalVal.textContent = goalEpisodes;

    const childName = document.getElementById('admin-child-name');
    const childLevel = document.getElementById('admin-child-level');
    const coinsVal = document.getElementById('admin-coins-val');
    const episodesWatched = document.getElementById('admin-episodes-watched');
    const quizzesPassed = document.getElementById('admin-quizzes-passed');
    const streakDays = document.getElementById('admin-streak-days');
    const totalXP = document.getElementById('admin-total-xp');

    if (childName) childName.textContent = state.user.display_name || 'Super Kid';
    if (childLevel) childLevel.textContent = `Level ${state.user.level || 1} · ${state.user.xp || 0} XP`;
    if (coinsVal) coinsVal.textContent = state.user.star_coins || 0;
    if (episodesWatched) episodesWatched.textContent = Math.max(0, (state.user.unlocked_index || 1) - 1);

    // Count passed quizzes (tracked by unlocked episodes)
    const passed = state.quizzes ? state.quizzes.filter((q, i) => {
        const ep = state.episodes[i];
        return ep && ep.order_index < (state.user.unlocked_index || 1);
    }).length : 0;
    if (quizzesPassed) quizzesPassed.textContent = passed;

    if (streakDays) streakDays.textContent = state.streak ? state.streak.daysCount : 1;

    // Estimate total XP earned (current XP + 100 per level gained)
    const lvl = state.user.level || 1;
    const estimatedTotalXP = ((lvl - 1) * 100) + (state.user.xp || 0);
    if (totalXP) totalXP.textContent = estimatedTotalXP;

    // Populate YouTube input
    const ytInput = document.getElementById('admin-yt-channel-input');
    if (ytInput) {
        ytInput.value = state.user.youtube_channel_url || '';
    }
}

// Override renderAdminView to use the new PIN dashboard
// (called by navigateTo when routing to 'admin')
const _oldRenderAdminView = renderAdminView;
window._newRenderAdminView = function() {
    const gate = document.getElementById('admin-pin-gate');
    const dashboard = document.getElementById('admin-dashboard');
    if (!gate) return; // new screen-admin not in DOM? fall back
    // Reset to PIN gate on every navigation
    gate.style.display = 'flex';
    if (dashboard) dashboard.classList.add('hidden');
    adminPinBuffer = '';
    document.querySelectorAll('#admin-pin-dots .pin-dot').forEach(d => {
        d.classList.remove('filled', 'error');
    });
};

/* =====================================================================
   ADMIN VIEW ACCESS CONTROL (Gated Visibility Logic)
   ===================================================================== */
function updateAdminVisibility() {
    const isUserLoggedIn = localStorage.getItem('appUserLoggedIn') === 'true';
    
    let isAdmin = false;
    if (isUserLoggedIn && typeof state !== 'undefined' && state.user) {
        const isOwner = state.user.email.toLowerCase() === 'jsianhung@gmail.com';
        isAdmin = isOwner || !!state.user.is_admin;
    }

    const drawerGotoAdmin = document.getElementById('drawer-goto-admin');
    const settingsGotoAdminBtn = document.getElementById('settings-goto-admin-btn');
    
    if (drawerGotoAdmin) {
        drawerGotoAdmin.style.setProperty('display', isAdmin ? 'flex' : 'none', 'important');
    }
    if (settingsGotoAdminBtn) {
        settingsGotoAdminBtn.style.setProperty('display', isAdmin ? 'flex' : 'none', 'important');
    }
}

function setupWatchScreenYTInteractions() {
    const searchInput = document.getElementById('yt-search-input');
    const clearBtn = document.getElementById('yt-clear-search');
    const refreshBtn = document.getElementById('yt-refresh-btn');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderDashboard();
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                renderDashboard();
                searchInput.focus();
            }
        });
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            const originalText = refreshBtn.innerHTML;
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = `<span class="yt-refresh-icon" style="animation: spin 1s linear infinite; display: inline-block;">🔄</span> Syncing...`;
            
            const url = state.user.youtube_channel_url || 'https://www.youtube.com/@superbookmyanmar4188';
            const success = await syncYoutubeChannel(url, false);
            
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = originalText;
            
            if (success) {
                // Quick success flash feedback
                const origBg = refreshBtn.style.background;
                const origColor = refreshBtn.style.color;
                refreshBtn.style.background = '#00ff66';
                refreshBtn.style.color = '#000000';
                setTimeout(() => {
                    refreshBtn.style.background = origBg;
                    refreshBtn.style.color = origColor;
                }, 1000);
            } else {
                alert("Could not sync with YouTube channel feed. Please check your internet connection and try again!");
            }
        });
    }
}

// Run once state and DOM are ready (appended after main DOMContentLoaded block)
(function initMissionControlAndAdmin() {
    safeInit(init);
    function init() {
        setupMissionControlHome();
        setupParentAdminPanel();
        setupWatchScreenYTInteractions();

        // Always auto-sync YouTube on load — use saved channel or default to Superbook Myanmar
        const DEFAULT_YT_CHANNEL_URL  = 'https://www.youtube.com/@superbookmyanmar4188';
        const DEFAULT_YT_CHANNEL_NAME = 'Superbook Myanmar';
        if (!state.user.youtube_channel_url) {
            // First-time visitor or fresh install: pre-load the default channel
            state.user.youtube_channel_url  = DEFAULT_YT_CHANNEL_URL;
            state.user.youtube_channel_name = DEFAULT_YT_CHANNEL_NAME;
            state.saveUser();
        }
        // Sync in background — no spinner, no admin required
        syncYoutubeChannel(state.user.youtube_channel_url, false);

        // Wire drawer-goto-admin to new panel
        const adminDrawerBtn = document.getElementById('drawer-goto-admin');
        if (adminDrawerBtn) {
            // Clone to remove old listeners
            const newBtn = adminDrawerBtn.cloneNode(true);
            adminDrawerBtn.parentNode.replaceChild(newBtn, adminDrawerBtn);
            newBtn.addEventListener('click', () => {
                document.getElementById('settings-drawer')?.classList.remove('open');
                document.getElementById('settings-drawer-overlay')?.classList.remove('active');
                navigateTo('admin');
            });
        }

        // Run initial role-based visibility control check
        updateAdminVisibility();
    }
})();

/* =====================================================================
   HOME V3 — GIZMO MASCOT HOME SCREEN LOGIC
   ===================================================================== */

function setupHomeV3() {
    updateHomeV3Greeting();
    updateHomeV3Stats();
    updateHomeV3Verse();
    setupHomeV3QuickLinks();
    setupHomeV3AvatarToggle();
}

function setupHomeV3AvatarToggle() {
    const avatarImg = document.getElementById('home-avatar-img');
    const avatarContainer = document.getElementById('home-mascot-avatar-container');
    if (!avatarImg || !avatarContainer) return;

    const defaultAvatars = {
        'boy': 'assets/avatar_boy.svg',
        'girl': 'assets/avatar_girl.svg',
        'mascot': 'assets/mascot.png'
    };
    
    // Load initial avatar choice
    if (!state.user.avatar_custom_data) {
        state.user.avatar_custom_data = { equipped_gear: null };
    }
    let currentType = state.user.avatar_custom_data.avatar_type || 'boy';
    avatarImg.src = defaultAvatars[currentType] || 'assets/avatar_boy.svg';

    avatarContainer.style.cursor = 'pointer';
    
    // Remove old listeners to avoid duplicates
    const newAvatarContainer = avatarContainer.cloneNode(true);
    avatarContainer.parentNode.replaceChild(newAvatarContainer, avatarContainer);
    
    newAvatarContainer.addEventListener('click', () => {
        // Toggle sequence: boy -> girl -> mascot -> boy
        if (currentType === 'boy') {
            currentType = 'girl';
        } else if (currentType === 'girl') {
            currentType = 'mascot';
        } else {
            currentType = 'boy';
        }
        
        state.user.avatar_custom_data.avatar_type = currentType;
        const newImg = newAvatarContainer.querySelector('#home-avatar-img');
        if (newImg) newImg.src = defaultAvatars[currentType];
        
        // Save state
        if (typeof state.saveUser === 'function') {
            state.saveUser();
        } else {
            localStorage.setItem('superkid_user', JSON.stringify(state.user));
        }
        
        // Also update the header profile avatar
        const headerAvatar = document.querySelector('#profile-mascot-container .mascot-img');
        if (headerAvatar) {
            headerAvatar.src = defaultAvatars[currentType];
        }

        // Add pop bubble sound/effect
        if (typeof triggerBubblePopFX === 'function') {
            const rect = newAvatarContainer.getBoundingClientRect();
            triggerBubblePopFX(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
        
        // Tiny visual bounce
        gsap.fromTo(newAvatarContainer, 
            { scale: 0.85 }, 
            { scale: 1, duration: 0.4, ease: "back.out(1.5)" }
        );
    });
}

function updateHomeV3Greeting() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning, ☀️' : hour < 18 ? 'Good Afternoon, 🧑•💻' : 'Good Evening, 🌙';

    const label = document.getElementById('home-greeting-label');
    const name = document.getElementById('home-greeting-name');
    const streakBadge = document.getElementById('hv3-streak-count');
    const xpBadge = document.getElementById('hv3-xp-count');

    if (label) label.textContent = greeting;
    if (name) name.textContent = (state.user.display_name || 'Super Kid') + '!';
    if (streakBadge) streakBadge.textContent = state.streak ? state.streak.daysCount : 1;
    if (xpBadge) xpBadge.textContent = state.user.level || 5;
}

function updateHomeV3Stats() {
    // Coin amount
    const coinEl = document.getElementById('hv3-coin-amount');
    if (coinEl) coinEl.textContent = state.user.star_coins || 0;

    // XP bar
    const xpBar = document.getElementById('hv3-xp-bar');
    const xpGoalText = document.getElementById('hv3-xp-goal-text');
    const xpPct = state.user.xp || 0;
    if (xpBar) xpBar.style.width = `${xpPct}%`;
    if (xpGoalText) xpGoalText.textContent = `${state.user.xp || 50}/100 XP`;

    // Bubble stats
    const episodesEl = document.getElementById('hv3-episodes-val');
    const levelEl = document.getElementById('hv3-level-val');
    const streakEl = document.getElementById('hv3-streak-val');

    if (episodesEl) episodesEl.textContent = `${Math.max(0, (state.user.unlocked_index || 1) - 1)} EPISODES`;
    if (levelEl) levelEl.textContent = `${state.user.level || 5} LEVEL`;
    if (streakEl) streakEl.textContent = `${state.streak ? state.streak.daysCount : 1} STREAK`;
}

function updateHomeV3Verse() {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const verses = typeof DAILY_VERSES !== 'undefined' ? DAILY_VERSES : [
        { text: 'Trust in the Lord with all your heart and lean not on your own understanding.', ref: 'Proverbs 3:5' },
        { text: 'For God so loved the world that he gave his one and only Son.', ref: 'John 3:16' }
    ];
    const verse = verses[dayOfYear % verses.length];
    const pill = document.getElementById('hv3-verse-pill-text');
    if (pill) {
        pill.innerHTML = `"${verse.text}"<br><span class="hologram-ref">— ${verse.ref}</span>`;
    }
}

function setupHomeV3QuickLinks() {
    document.querySelectorAll('.hv3-quick-link, .hv3-bubble').forEach(btn => {
        const target = btn.dataset.nav;
        if (!target) return;
        btn.addEventListener('click', () => {
            if (typeof triggerBubblePopFX === 'function') {
                triggerBubblePopFX(window.innerWidth / 2, window.innerHeight / 2);
            }
            navigateTo(target);
        });
    });
}

// Initialize home v3 when DOM is ready
(function() {
    function initV3() {
        if (typeof state !== 'undefined') {
            setupHomeV3();
        }
    }
    safeInit(initV3);
})();

