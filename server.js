const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec, execSync } = require('child_process');

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return;
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      val = val.replace(/^['"]|['"]$/g, '');
      if (key && process.env[key] === undefined) process.env[key] = val;
    });
  } catch (e) {
    console.error('[ENV] load error:', e.message);
  }
}

loadEnvFile(path.join(__dirname, '.env'));

// ═══════════════════════════════════════════
//   СТАТИСТИКА ВИЗИТОВ
// ═══════════════════════════════════════════

const visitsPath = path.join(__dirname, 'data', 'visits.json');
let visitsStore = { total: 0, unique: [] };

function loadVisits() {
  try {
    if (fs.existsSync(visitsPath)) {
      const raw = JSON.parse(fs.readFileSync(visitsPath, 'utf8'));
      if (raw && typeof raw.total === 'number' && Array.isArray(raw.unique)) {
        visitsStore = raw;
      }
    }
  } catch (e) {
    console.error('[VISITS] load error:', e.message);
  }
}

function saveVisits() {
  try {
    const dir = path.dirname(visitsPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(visitsPath, JSON.stringify(visitsStore, null, 2));
  } catch (e) {
    console.error('[VISITS] save error:', e.message);
  }
}

function getAppVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    return pkg.version || 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

loadVisits();
const APP_VERSION = getAppVersion();
const ANALYTICS_TOKEN = process.env.TMA_ANALYTICS_TOKEN || '';
const ANALYTICS_APP = process.env.TMA_ANALYTICS_APP || '';
const TON_ID_CLIENT_ID = process.env.TON_ID_CLIENT_ID || '';
const TONAPI_KEY = process.env.TONAPI_KEY || '';


// ═══════════════════════════════════════════
//   КОНФИГУРАЦИЯ
// ═══════════════════════════════════════════

let config;
try {
  config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch (e) {
  config = {
    telegram: { botToken: '' },
    giphy: { apiKey: '' },
    game: { minPlayers: 2, maxPlayers: 10, roundTime: 45, votingTime: 15 },
    server: { port: 3000 }
  };
}

config.telegram = config.telegram || {};
config.giphy = config.giphy || {};
config.admin = config.admin || {};

if (process.env.TELEGRAM_BOT_TOKEN) config.telegram.botToken = process.env.TELEGRAM_BOT_TOKEN;
if (process.env.GIPHY_API_KEY) config.giphy.apiKey = process.env.GIPHY_API_KEY;
if (process.env.ADMIN_TOKEN) config.admin.token = process.env.ADMIN_TOKEN;

let situationsByCategory = {};
let CATEGORIES = [];
let situations = [];

function loadCategorySituations() {
  const dir = path.join(__dirname, 'situations');
  const map = {};
  try {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
      files.forEach(file => {
        const category = path.basename(file, '.json');
        try {
          const raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
          if (Array.isArray(raw)) {
            map[category] = raw
              .filter(s => s && s.text)
              .map((s, i) => ({
                id: s.id != null ? s.id : `${category}-${i + 1}`,
                text: s.text,
                category: s.category || category
              }));
          }
        } catch (e) {
          console.error('[loadCategorySituations] Error:', file, e.message);
        }
      });
    }
  } catch (e) {
    console.error('[loadCategorySituations] Error:', e.message);
  }
  return map;
}

function rebuildSituationsIndex() {
  situationsByCategory = loadCategorySituations();
  CATEGORIES = Object.keys(situationsByCategory);

  if (CATEGORIES.length === 0) {
    let fallback = [];
    try {
      fallback = JSON.parse(fs.readFileSync('situations.json', 'utf8'));
    } catch (e) {
      fallback = [
        { id: 1, text: 'Когда увидел свой код через год', category: 'general' },
        { id: 2, text: 'Когда завтра экзамен, а ты не готов', category: 'study' },
        { id: 3, text: 'Когда WiFi в метро внезапно заработал', category: 'general' }
      ];
    }
    situationsByCategory = { general: fallback.map(s => ({ ...s, category: s.category || 'general' })) };
    CATEGORIES = ['general'];
  }

  situations = Object.values(situationsByCategory).flat();
}

rebuildSituationsIndex();

let funMessages;
try {
  funMessages = JSON.parse(fs.readFileSync('messages.json', 'utf8'));
} catch (e) {
  funMessages = {
    loading: ['Связываемся с богом мемов...'],
    waiting: ['Созываем совет старейшин...'],
    voting: ['Ну что... выбираем легенду'],
    replace: ['Сдуваем пыль']
  };
}

// ═══════════════════════════════════════════
//   THUMBNAILS (для превью)
// ═══════════════════════════════════════════

let thumbsJob = null;

function scheduleThumbsRebuild() {
  if (thumbsJob) return;
  thumbsJob = setTimeout(() => {
    thumbsJob = null;
    exec('node generate_thumbs.js', { cwd: __dirname }, (err) => {
      if (err) console.log('[THUMBS] error:', err.message);
    });
  }, 1000);
}

// ═══════════════════════════════════════════
//   EXPRESS + SOCKET.IO
// ═══════════════════════════════════════════

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// UTF-8 кодировка
app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use(express.json());
app.use(express.static('public'));
app.use('/user_content', express.static(path.join(__dirname, 'user_content')));

// ═══════════════════════════════════════════
//   ХРАНИЛИЩА
// ═══════════════════════════════════════════


// ─── API: Мем дня ───
app.get('/api/meme-of-day', (req, res) => {
  try {
    const modPath = require('path').join(__dirname, 'data', 'meme_of_day.json');
    const data = JSON.parse(fs.readFileSync(modPath, 'utf8'));
    res.json(data);
  } catch(e) {
    res.json(null);
  }
});


// ─── API: Список мемов ───
app.get('/api/memes', (req, res) => {
  const memDir = path.join(__dirname, 'public', 'memes', 'best');
  const ucDir = path.join(__dirname, 'user_content', 'memes');
  try {
    const base = fs.readdirSync(memDir).filter(f => /\.(gif|jpg|jpeg|png|webp|mp4)$/i.test(f));
    let user = [];
    try { user = fs.readdirSync(ucDir).filter(f => /\.(gif|jpg|jpeg|png|webp|mp4)$/i.test(f)); } catch(e) {}
    res.json({
      count: base.length + user.length,
      base: { count: base.length, files: base, path: '/memes/best/' },
      user: { count: user.length, files: user, path: '/user_content/memes/' }
    });
  } catch(e) { res.json({ count: 0, base: { count: 0, files: [], path: '' }, user: { count: 0, files: [], path: '' } }); }
});

// ─── API: Загрузка мема ───
const multer = require('multer');
const upload = multer({
  dest: '/tmp/meme-uploads/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(gif|jpeg|png|webp)$/.test(file.mimetype) || file.mimetype === 'video/mp4') cb(null, true);
    else cb(new Error('Только GIF/JPG/PNG/WEBP/MP4'));
  }
});
app.post('/api/upload-meme', upload.single('meme'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Нет файла' });
  const ext = req.file.originalname.split('.').pop().toLowerCase();
  const name = 'user_' + Date.now() + '.' + ext;
  const destDir = path.join(__dirname, 'user_content', 'memes');
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, name);
  fs.renameSync(req.file.path, dest);
  // Сжатие GIF (30-50% экономии)
  if (ext === 'gif') {
    try {
      execSync(`gifsicle -O3 --lossy=80 "${dest}" -o "${dest}"`);
      log('GIF сжат:', name);
    } catch (e) {
      log('Ошибка сжатия GIF:', e.message);
    }
  }
  scheduleThumbsRebuild();
  log('uploadMeme', { name, size: req.file.size });
  res.json({ ok: true, filename: name });
});


// ─── API: Категории ───
app.get('/api/categories', (req, res) => {
  const result = {};

  const userCounts = {};
  (userSituations || []).forEach(s => {
    const cat = s.category || 'general';
    userCounts[cat] = (userCounts[cat] || 0) + 1;
  });

  const allCats = new Set([...(CATEGORIES || []), ...Object.keys(userCounts)]);
  if (allCats.size === 0) allCats.add('general');

  allCats.forEach(c => {
    const baseCount = situationsByCategory[c] ? situationsByCategory[c].length : 0;
    const userCount = userCounts[c] || 0;
    result[c] = { count: baseCount + userCount };
  });

  res.json(result);
});


// ═══ USER CONTENT ═══
function loadUserSituations() {
  try {
    const p = path.join(__dirname, 'user_content', 'situations.json');
    if (fs.existsSync(p)) {
      const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (Array.isArray(raw)) {
        return raw
          .filter(s => s && s.text)
          .map((s, i) => ({
            id: s.id != null ? s.id : `U-${String(i + 1).padStart(3, '0')}`,
            text: s.text,
            category: s.category || 'general',
            author: s.author,
            userId: s.userId,
            date: s.date
          }));
      }
    }
  } catch(e) { console.log('[UC] loadUserSituations error:', e.message); }
  return [];
}

function saveUserSituations(data) {
  try {
    const dir = path.join(__dirname, 'user_content');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'situations.json'), JSON.stringify(data, null, 2));
  } catch(e) { console.log('[UC] saveUserSituations error:', e.message); }
}

let userSituations = loadUserSituations();

// ═══════════════════════════════════════════════════════════
// БАЗА ДАННЫХ ЗАЯВОК (SUBMISSIONS)
// ═══════════════════════════════════════════════════════════
const submissionsDB = path.join(__dirname, 'data', 'submissions.json');

function loadSubmissions() {
    try {
        if (fs.existsSync(submissionsDB)) {
            return JSON.parse(fs.readFileSync(submissionsDB, 'utf8'));
        }
    } catch(e) { console.error('[SUB] load error:', e.message); }
    return [];
}

function saveSubmissions(data) {
    try {
        const dir = path.dirname(submissionsDB);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(submissionsDB, JSON.stringify(data, null, 2));
    } catch(e) { console.error('[SUB] save error:', e.message); }
}


// ═══════════════════════════════════════════════════════════
// ЛОГИРОВАНИЕ ЗАЯВОК
// ═══════════════════════════════════════════════════════════

const submissionsLogPath = path.join(__dirname, 'logs', 'submissions.log');

function logSubmission(message) {
    try {
        const dir = path.dirname(submissionsLogPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const timestamp = new Date().toISOString();
        fs.appendFileSync(submissionsLogPath, `[${timestamp}] ${message}\n`);
    } catch(e) {}
}

let submissions = loadSubmissions();
logSubmission(`Loaded ${submissions.length} submissions`);
console.log('[UC] User situations loaded:', userSituations.length);


// ─── API: Модерация (Admin Bridge) ───
const ADMIN_TOKEN = (config.admin && config.admin.token) ? config.admin.token : '';

app.post('/api/admin/add-content', (req, res) => {
  console.log('[API] add-content request received');

  // Проверка токена
  const token = req.headers['x-admin-token'];
  if (token !== ADMIN_TOKEN) {
    console.log('[API] add-content AUTH FAILED, got:', token);
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { type, text, category, fileUrl, userId, username } = req.body;
  console.log('[API] add-content:', JSON.stringify({ type, text, category, userId, username }));

  if (type === 'situation') {
    // Проверка дубликатов
    const allSits = [...situations, ...userSituations];
    if (allSits.some(s => s.text.toLowerCase() === text.toLowerCase())) {
      console.log('[API] add-content DUPLICATE situation');
      return res.json({ ok: false, error: 'Дубликат' });
    }
    const newId = 'U-' + String(userSituations.length + 1).padStart(3, '0');
    const entry = { id: newId, text, category: category || 'general', author: username, userId, date: new Date().toISOString() };
    userSituations.push(entry);
    saveUserSituations(userSituations);
    console.log('[API] add-content SITUATION SAVED:', newId, text);
    return res.json({ ok: true, id: newId });
  }

  if (type === 'meme') {
    // fileUrl = URL от Telegram file API, нужно скачать
    if (!fileUrl) return res.json({ ok: false, error: 'No fileUrl' });
    const https = require('https');
    const fname = 'u_' + Date.now() + '.mp4';
    const destDir = path.join(__dirname, 'user_content', 'memes');
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const dest = path.join(destDir, fname);
    const file = fs.createWriteStream(dest);

    https.get(fileUrl, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('[API] add-content MEME SAVED:', fname);
        scheduleThumbsRebuild();
        res.json({ ok: true, filename: fname });
      });
    }).on('error', (e) => {
      console.log('[API] add-content MEME DOWNLOAD ERROR:', e.message);
      fs.unlink(dest, () => {});
      res.json({ ok: false, error: e.message });
    });
    return;
  }

  res.json({ ok: false, error: 'Unknown type' });
});


const rooms = new Map();
const players = new Map();
const globalUsedGifs = new Set();

// Лидерборд
function loadLeaderboard() {
  try {
    if (fs.existsSync('data/leaderboard.json')) {
      return JSON.parse(fs.readFileSync('data/leaderboard.json', 'utf8'));
    }
  } catch (e) { console.error('[loadLeaderboard] Error:', e.message); }
  return [];
}

function saveLeaderboard() {
  try {
    if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });
    fs.writeFileSync('data/leaderboard.json', JSON.stringify(leaderboard, null, 2));
  } catch (e) { console.error('[saveLeaderboard] Error:', e.message); }
}

let leaderboard = loadLeaderboard();

const profilesPath = path.join(__dirname, 'data', 'profiles.json');
function loadProfiles() {
  try {
    if (fs.existsSync(profilesPath)) {
      return JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
    }
  } catch (e) { console.error('[loadProfiles] Error:', e.message); }
  return {};
}

function saveProfiles() {
  try {
    const dir = path.dirname(profilesPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
  } catch (e) { console.error('[saveProfiles] Error:', e.message); }
}

let profiles = loadProfiles();

function getProfile(userId, username) {
  if (!userId) return null;
  const id = String(userId);
  if (!profiles[id]) {
    profiles[id] = {
      userId: id,
      username: username || 'Игрок',
      wins: 0,
      avatar: null,
      wallet: null,
      updatedAt: Date.now()
    };
  } else {
    if (username) profiles[id].username = username;
    if (!profiles[id].wins) profiles[id].wins = 0;
    if (profiles[id].avatar === undefined) profiles[id].avatar = null;
    if (profiles[id].wallet === undefined) profiles[id].wallet = null;
    profiles[id].updatedAt = Date.now();
  }
  return profiles[id];
}


// Рефералы
function loadReferrals() {
  try {
    if (fs.existsSync('data/referrals.json')) {
      return JSON.parse(fs.readFileSync('data/referrals.json', 'utf8'));
    }
  } catch (e) { console.error('[loadReferrals] Error:', e.message); }
  return {};
}

function saveReferrals() {
  try {
    if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });
    fs.writeFileSync('data/referrals.json', JSON.stringify(referrals, null, 2));
  } catch (e) { console.error('[saveReferrals] Error:', e.message); }
}

let referrals = loadReferrals();

let referralDevices = {};
function loadReferralDevices() {
  try {
    if (fs.existsSync('data/referral_devices.json')) {
      return JSON.parse(fs.readFileSync('data/referral_devices.json', 'utf8'));
    }
  } catch (e) { console.error('[loadReferralDevices] Error:', e.message); }
  return {};
}
function saveReferralDevices() {
  try {
    if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });
    fs.writeFileSync('data/referral_devices.json', JSON.stringify(referralDevices, null, 2));
  } catch (e) { console.error('[saveReferralDevices] Error:', e.message); }
}
referralDevices = loadReferralDevices();


const referralBucketsPath = path.join(__dirname, 'data', 'referral_buckets.json');
let referralBuckets = {};
function loadReferralBuckets() {
  try {
    if (fs.existsSync(referralBucketsPath)) {
      return JSON.parse(fs.readFileSync(referralBucketsPath, 'utf8'));
    }
  } catch (e) { console.error('[loadReferralBuckets] Error:', e.message); }
  return {};
}
function saveReferralBuckets() {
  try {
    const dir = path.dirname(referralBucketsPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(referralBucketsPath, JSON.stringify(referralBuckets, null, 2));
  } catch (e) { console.error('[saveReferralBuckets] Error:', e.message); }
}
referralBuckets = loadReferralBuckets();

function bumpReferralBucket(userId, amount, ts) {
  const uid = String(userId);
  const now = ts || Date.now();
  const hourTs = Math.floor(now / 3600000) * 3600000;
  if (!referralBuckets[uid]) referralBuckets[uid] = { buckets: {} };
  const buckets = referralBuckets[uid].buckets || {};
  buckets[hourTs] = (buckets[hourTs] || 0) + amount;
  // prune older than 7 days
  const minTs = now - (7 * 24 * 60 * 60 * 1000);
  Object.keys(buckets).forEach(k => {
    if (Number(k) < minTs) delete buckets[k];
  });
  referralBuckets[uid].buckets = buckets;
  saveReferralBuckets();
}


// ═══════════════════════════════════════════
//   КОНСТАНТЫ
// ═══════════════════════════════════════════

const REFERRAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const BOT_NAMES = ['🤖 МемБот2000', '🤖 КринжМастер', '🤖 БаянХантер', '🤖 ЛордМемов'];

// Структура: 3 партии по 5 раундов
// Раунд 1: 5 карт, 3 замены → Раунд 5: 1 карта, 0 замен
const GAME_STRUCTURE = [
  { cards: 5, swaps: 3 },
  { cards: 4, swaps: 2 },
  { cards: 3, swaps: 1 },
  { cards: 2, swaps: 0 },
  { cards: 1, swaps: 0 }
];
const TOTAL_PARTIES = 3;


function formatNememcoin(n) {
  const num = Math.abs(Number(n)) || 0;
  const mod10 = num % 10;
  const mod100 = num % 100;
  if (mod10 === 1 && mod100 !== 11) return num + ' NEMEMCOIN';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return num + ' NEMEMCOINа';
  return num + ' NEMEMCOINов';
}

const WINNER_PHRASES = [
  'Сегодня ты был опасен',
  'Мемный чемпион!',
  'Этот стол тебя запомнит',
  'Ты играл грязно. И правильно',
  'С таким вкусом далеко пойдёшь',
  'Опасно давать тебе карты',
  'Запомните этот ник',
  'Абсолютный мемлорд',
  'Величие не скрыть',
  'Кринж-повелитель',
  'Твои мемы были неудержимы',
  'Зал аплодирует стоя'
];

// ═══════════════════════════════════════════
//   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ═══════════════════════════════════════════

function log(fn, data) {
  console.log(`[${new Date().toISOString()}] [${fn}] ${JSON.stringify(data)}`);
}

function generateRoomId() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

function getRandomMessage(category) {
  const msgs = funMessages[category] || funMessages.loading;
  return msgs[Math.floor(Math.random() * msgs.length)];
}

function getRandomSituation(usedIds = [], categories = ['general']) {
  let pool = [];
  const cats = (categories && categories.length) ? categories : CATEGORIES;
  (cats || []).forEach(c => {
    if (situationsByCategory[c]) pool = pool.concat(situationsByCategory[c]);
  });
  if (pool.length === 0) pool = [...situations];

  if (userSituations && userSituations.length > 0) {
    const userPool = (cats && cats.length)
      ? userSituations.filter(s => cats.includes(s.category || 'general'))
      : userSituations;
    pool = pool.concat(userPool);
  }

  const available = pool.filter(s => !usedIds.includes(s.id));
  if (available.length === 0) return pool[Math.floor(Math.random() * pool.length)];
  return available[Math.floor(Math.random() * available.length)];
}

function getRandomWinnerPhrase() {
  return WINNER_PHRASES[Math.floor(Math.random() * WINNER_PHRASES.length)];
}

// ═══════════════════════════════════════════
//   ЛОГИКА ГИФОК (УНИКАЛЬНОСТЬ!)
// ═══════════════════════════════════════════

function getRandomGif(excludeIds = []) {
  const memesPath = path.join(__dirname, 'public', 'memes', 'best');
  const ucMemesPath = path.join(__dirname, 'user_content', 'memes');
  try {
    let files = fs.readdirSync(memesPath).filter(f =>
      f.endsWith('.gif') || f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp') || f.endsWith('.mp4')
    );
    // Подмешиваем user_content мемы
    try {
      const ucFiles = fs.readdirSync(ucMemesPath).filter(f =>
        f.endsWith('.gif') || f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp') || f.endsWith('.mp4')
      ).map(f => 'UC:' + f);
      files = files.concat(ucFiles);
    } catch(e) {}

    // Исключаем: уже использованные в сессии + личные замены + глобальные
    const available = files.filter(f =>
      !excludeIds.includes(f) && !globalUsedGifs.has(f)
    );

    if (available.length === 0) {
      // Если закончились — сбрасываем глобальный кеш
      globalUsedGifs.clear();
      log('getRandomGif', { action: 'global_cache_reset', totalFiles: files.length });
      const fallback = files.filter(f => !excludeIds.includes(f));
      if (fallback.length === 0) return files[Math.floor(Math.random() * files.length)];
      return fallback[Math.floor(Math.random() * fallback.length)];
    }

    const selected = available[Math.floor(Math.random() * available.length)];
    return selected;
  } catch (err) {
    log('getRandomGif', { error: err.message });
    return 'placeholder.gif';
  }
}

async function dealCards(room, count) {
  for (const player of room.players) {
    player.hand = [];
    player.swapsUsed = 0;
    for (let i = 0; i < count; i++) {
      const gif = getRandomGif([...room.usedGifs, ...player.replacedGifs]);
      const url = gif.startsWith('UC:')
        ? '/user_content/memes/' + gif.replace('UC:', '')
        : '/memes/best/' + gif;
      player.hand.push({ id: gif, url });
      room.usedGifs.push(gif);
      globalUsedGifs.add(gif);
    }
  }
  log('dealCards', { roomId: room.id, count, players: room.players.length });
}

// ═══════════════════════════════════════════
//   БОТЫ
// ═══════════════════════════════════════════


// Добить комнату ботами до 4 игроков
function fillWithBots(room) {
  const target = 4;
  while (room.players.length < target) {
    const bot = createBot();
    const existingNames = room.players.map(p => p.username);
    while (existingNames.includes(bot.username)) {
      bot.username = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + Math.floor(Math.random() * 99);
    }
    room.players.push(bot);
  }
  log('fillWithBots', { roomId: room.id, total: room.players.length });
}

function createBot() {
  const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  const botId = `bot_${crypto.randomBytes(4).toString('hex')}`;
  return {
    id: botId,
    odI: botId,
    userId: botId,
    username: botName,
    isBot: true,
    score: 0,
    partyScore: 0,
    hand: [],
    replacedGifs: [],
    swapsUsed: 0,
    ready: true,
    socketId: null,
    afk: false,
    ragequits: 0
  };
}

function botMakeChoice(room, bot) {
  const delay = 2000 + Math.random() * 3000;
  setTimeout(() => {
    if (room.state !== 'playing' || room.submissions.has(bot.userId)) return;
    if (!bot.hand || bot.hand.length === 0) return;

    const randomCard = bot.hand[Math.floor(Math.random() * bot.hand.length)];
    room.submissions.set(bot.userId, {
      playerId: bot.userId,
      username: bot.username,
      gif: randomCard
    });
    bot.hand = bot.hand.filter(c => c.id !== randomCard.id);

    io.to(room.id).emit('playerSubmitted', {
      playerId: bot.userId,
      total: room.submissions.size,
      required: room.players.length
    });

    log('botMakeChoice', { roomId: room.id, bot: bot.username, card: randomCard.id });

    if (room.submissions.size === room.players.length) {
      startVoting(room);
    }
  }, delay);
}

function botVote(room, bot) {
  const delay = 3000 + Math.random() * 4000;
  setTimeout(() => {
    if (room.state !== 'voting' || room.votes.has(bot.userId)) return;

    const submissions = Array.from(room.submissions.values());
    const options = submissions.filter(s => s.playerId !== bot.userId);
    if (options.length === 0) return;

    const choice = options[Math.floor(Math.random() * options.length)];
    room.votes.set(bot.userId, choice.playerId);

    io.to(room.id).emit('voteReceived', {
      total: room.votes.size,
      required: room.players.length
    });

    if (room.votes.size === room.players.length) {
      endRound(room);
    }
  }, delay);
}

// ═══════════════════════════════════════════
//   ИГРОВАЯ ЛОГИКА
// ═══════════════════════════════════════════

async function startGame(room) {
  room.state = 'playing';
  room.currentParty = 1;
  room.round = 1;
  room.usedSituations = [];
  room.usedGifs = [];

  // Обнуляем очки
  room.players.forEach(p => {
    p.score = 0;
    p.partyScore = 0;
    p.replacedGifs = [];
  });

  log('startGame', { roomId: room.id, players: room.players.length });

  // Раздать 5 карт
  await dealCards(room, GAME_STRUCTURE[0].cards);
  startRound(room);
}

function startRound(room) {
  room.submissions = new Map();
  room.votes = new Map();

  const roundIndex = room.round - 1;
  const roundConfig = GAME_STRUCTURE[roundIndex];
  const situation = getRandomSituation(room.usedSituations, room.categories || ['general']);
  room.currentSituation = situation;
  room.usedSituations.push(situation.id);

  log('startRound', {
    roomId: room.id,
    party: room.currentParty,
    round: room.round,
    situation: situation.text
  });

  // Отправляем данные раунда каждому игроку (индивидуально — у каждого свои карты)
  room.players.forEach(player => {
    if (player.isBot) {
      botMakeChoice(room, player);
      return;
    }

    const socket = io.sockets.sockets.get(player.socketId);
    if (socket) {
      socket.emit('roundStart', {
        party: room.currentParty,
        round: room.round,
        situation: situation.text,
        hand: player.hand,
        swapsAllowed: roundConfig.swaps,
        swapsUsed: player.swapsUsed || 0,
        timer: config.game.roundTime,
        players: room.players.map(p => ({
          userId: p.userId,
          username: p.username,
          isBot: p.isBot,
          cardCount: p.hand.length,
          afk: p.afk,
          ragequits: p.ragequits,
          submitted: room.submissions.has(p.userId),
          avatar: p.avatar || null
        }))
      });
    }
  });

  // Таймер AFK — автоигра если не сделал ход
  if (room.roundTimer) clearTimeout(room.roundTimer);
  room.roundTimer = setTimeout(() => {
    room.players.forEach(player => {
      if (!room.submissions.has(player.userId) && player.hand && player.hand.length > 0) {
        const autoCard = player.hand[0];
        room.submissions.set(player.userId, {
          playerId: player.userId,
          username: player.username,
          gif: autoCard
        });
        player.hand = player.hand.filter(c => c.id !== autoCard.id);
        if (!player.isBot) player.afk = true;
      }
    });

    io.to(room.id).emit('playerSubmitted', {
      total: room.submissions.size,
      required: room.players.length,
      afk: true
    });

    if (room.submissions.size >= room.players.length) {
      startVoting(room);
    }
  }, (config.game.roundTime + 2) * 1000);
}

function startVoting(room) {
  if (room.state === 'voting') return; // Дедупликация
  room.state = 'voting';

  if (room.roundTimer) clearTimeout(room.roundTimer);

  const submissions = Array.from(room.submissions.values());
  // Перемешиваем — анонимность
  for (let i = submissions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [submissions[i], submissions[j]] = [submissions[j], submissions[i]];
  }

  log('startVoting', { roomId: room.id, submissions: submissions.length });

  io.to(room.id).emit('votingStart', {
    situation: room.currentSituation.text,
    submissions: submissions,
    timer: config.game.votingTime,
    message: getRandomMessage('voting')
  });

  // Боты голосуют
  room.players.filter(p => p.isBot).forEach(bot => botVote(room, bot));

  // Таймер голосования
  if (room.voteTimer) clearTimeout(room.voteTimer);
  room.voteTimer = setTimeout(() => {
    // AFK: добиваем голоса случайно
    if (room.votes.size < room.players.length) {
      const submissions = Array.from(room.submissions.values()).map(s => s.playerId);
      room.players.forEach(p => {
        if (room.votes.has(p.userId)) return;
        if (!submissions.length) return;
        let pick = submissions[Math.floor(Math.random() * submissions.length)];
        // запрет голосовать за себя, если есть альтернативы
        if (pick === p.userId && submissions.length > 1) {
          const alt = submissions.filter(id => id !== p.userId);
          pick = alt[Math.floor(Math.random() * alt.length)];
        }
        room.votes.set(p.userId, pick);
        log('vote:auto', { roomId: room.id, voter: p.userId, votedFor: pick });
      });
      endRound(room);
    }
  }, (config.game.votingTime + 2) * 1000);
}

function endRound(room) {
  if (room.state === 'roundEnd') return;
  room.state = 'roundEnd';

  if (room.voteTimer) clearTimeout(room.voteTimer);
  if (room.roundTimer) clearTimeout(room.roundTimer);

  // Подсчёт голосов: +1 за каждый голос
  const voteCounts = {};
  room.votes.forEach((votedFor) => {
    voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
  });

  // Начисляем очки
  let maxVotes = 0;
  const winners = [];
  room.players.forEach(p => {
    const votes = voteCounts[p.userId] || 0;
    p.partyScore += votes;
    p.score += votes;
    if (votes > maxVotes) maxVotes = votes;
  });

  room.players.forEach(p => {
    if ((voteCounts[p.userId] || 0) === maxVotes && maxVotes > 0) {
      winners.push(p);
    }
  });

  // Найти мем победителя
  let winnerSubmission = null;
  if (winners.length > 0) {
    winnerSubmission = room.submissions.get(winners[0].userId);
  }

  const scores = room.players.map(p => ({
    id: p.userId,
    username: p.username,
    roundVotes: voteCounts[p.userId] || 0,
    partyScore: p.partyScore,
    totalScore: p.score,
    isBot: p.isBot,
    totalScoreLabel: formatNememcoin(p.score)
  })).sort((a, b) => b.totalScore - a.totalScore);

  log('endRound', {
    roomId: room.id,
    party: room.currentParty,
    round: room.round,
    winner: winners.map(w => w.username),
    votes: voteCounts
  });

  io.to(room.id).emit('roundEnd', {
    winners: winners.map(w => ({ id: w.userId, username: w.username })),
    winnerGif: winnerSubmission ? winnerSubmission.gif : null,
    scores,
    voteCounts
  });

  // Следующий раунд через 3 секунды
  setTimeout(() => {
    room.round++;

    if (room.round > 5) {
      endParty(room);
    } else {
      // КРИТИЧНО: НЕ раздаём новые карты! Карты уже в руках.
      room.state = 'playing';
      // Сбрасываем swapsUsed для нового раунда
      room.players.forEach(p => { p.swapsUsed = 0; });
      startRound(room);
    }
  }, 3000);
}

function endParty(room) {
  room.state = 'partyEnd';

  const partyScores = room.players.map(p => ({
    id: p.userId,
    username: p.username,
    partyScore: p.partyScore,
    totalScore: p.score,
    isBot: p.isBot,
    totalScoreLabel: formatNememcoin(p.score)
  })).sort((a, b) => b.partyScore - a.partyScore);

  log('endParty', { roomId: room.id, party: room.currentParty, scores: partyScores });

  io.to(room.id).emit('partyEnd', {
    party: room.currentParty,
    scores: partyScores
  });

  setTimeout(async () => {
    room.currentParty++;

    if (room.currentParty > TOTAL_PARTIES) {
      endGame(room);
    } else {
      // Новая партия: обнуляем partyScore, раздаём 5 карт заново
      room.round = 1;
      room.usedGifs = [];
      room.usedSituations = [];
      room.players.forEach(p => {
        p.partyScore = 0;
        p.replacedGifs = [];
        p.swapsUsed = 0;
      });
      globalUsedGifs.clear();

      room.state = 'playing';
      await dealCards(room, GAME_STRUCTURE[0].cards);
      startRound(room);
    }
  }, 3000);
}

function endGame(room) {
  room.state = 'gameEnd';

  const finalScores = room.players.map(p => ({
    id: p.userId,
    username: p.username,
    score: p.score,
    isBot: p.isBot,
    totalScoreLabel: formatNememcoin(p.score)
  })).sort((a, b) => b.score - a.score);

  const winnerPhrase = getRandomWinnerPhrase();

  log('endGame', { roomId: room.id, winner: finalScores[0], phrase: winnerPhrase });

  // Обновляем лидерборд (только живые игроки)
  finalScores.filter(p => !p.isBot).forEach(p => {
    updateLeaderboard(p.id, p.username, p.score);
  });

  // Начисляем реферальные награды
  finalScores.filter(p => !p.isBot).forEach(p => {
    processReferralRewards(p.id, p.score);
  });

  // Записываем победу в профиль
  const winner = finalScores[0];
  if (winner && !winner.isBot) {
    const prof = getProfile(winner.id, winner.username);
    if (prof) {
      prof.wins = (prof.wins || 0) + 1;
      saveProfiles();
      log('profile:win', { userId: winner.id, wins: prof.wins });
    }
  }

  io.to(room.id).emit('gameEnd', {
    finalScores,
    winnerPhrase: `${winnerPhrase}: ${finalScores[0].username}`
  });
}

// ═══════════════════════════════════════════
//   ЛИДЕРБОРД
// ═══════════════════════════════════════════

function updateLeaderboard(userId, username, points) {
  let player = leaderboard.find(p => p.userId === userId);
  if (player) {
    player.totalPoints += points;
    player.gamesPlayed += 1;
    player.username = username;
    player.lastPlayed = Date.now();
  } else {
    leaderboard.push({
      userId, username,
      totalPoints: points,
      gamesPlayed: 1,
      lastPlayed: Date.now()
    });
  }
  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
  saveLeaderboard();
}

// ═══════════════════════════════════════════
//   РЕФЕРАЛЬНАЯ СИСТЕМА (3 УРОВНЯ)
// ═══════════════════════════════════════════

function processReferralRewards(playerId, points) {
  const now = Date.now();
  if (!referrals[playerId]) return;

  referrals[playerId].lastActive = now;
  saveReferrals();

  // Уровень 1: 3% (только в течение 7 дней)
  const level1Id = referrals[playerId].referrer;
  const l1 = referrals[playerId];
  if (level1Id) {
    const reward1 = Math.floor(points * 0.03);
    if (reward1 > 0) {
      updateLeaderboard(level1Id, getReferralUsername(level1Id), reward1);
      bumpReferralBucket(level1Id, reward1, now);
      if (referrals[level1Id]) referrals[level1Id].level1Earned = (referrals[level1Id].level1Earned || 0) + reward1;
    }

    // Уровень 2: 2% (только в течение 7 дней)
    if (referrals[level1Id]) {
      const level2Id = referrals[level1Id].referrer;
      const l2 = referrals[level1Id];
      if (level2Id) {
        const reward2 = Math.floor(points * 0.02);
        if (reward2 > 0) {
          updateLeaderboard(level2Id, getReferralUsername(level2Id), reward2);
          bumpReferralBucket(level2Id, reward2, now);
          if (referrals[level2Id]) referrals[level2Id].level2Earned = (referrals[level2Id].level2Earned || 0) + reward2;
        }

        // Уровень 3: 1% (только в течение 7 дней)
        if (referrals[level2Id]) {
          const level3Id = referrals[level2Id].referrer;
          const l3 = referrals[level2Id];
          if (level3Id) {
            const reward3 = Math.floor(points * 0.01);
            if (reward3 > 0) {
              updateLeaderboard(level3Id, getReferralUsername(level3Id), reward3);
              bumpReferralBucket(level3Id, reward3, now);
              if (referrals[level3Id]) referrals[level3Id].level3Earned = (referrals[level3Id].level3Earned || 0) + reward3;
            }
          }
        }
      }
    }
  }
  saveReferrals();
}

function getReferralUsername(userId) {
  const lbEntry = leaderboard.find(p => p.userId === userId);
  return lbEntry ? lbEntry.username : 'Игрок';
}

// ═══════════════════════════════════════════
//   SOCKET.IO
// ═══════════════════════════════════════════

io.on('connection', (socket) => {
  log('connection', { socketId: socket.id });


  // Отправить статистику при подключении
  {
    let inLobby = 0, lobbies = 0, playing = 0;
    rooms.forEach(room => {
      const hc = room.players.filter(p => !p.isBot).length;
      if (room.state === 'lobby') { inLobby += hc; lobbies++; }
      else if (room.state !== 'gameEnd') { playing++; }
    });
    socket.emit('onlineStats', {
      online: io.engine.clientsCount || 0,
      inLobby, lobbies, playing
    });
  }

  // ─── ПРИСОЕДИНЕНИЕ К КОМНАТЕ ───

  // ─── РЕГИСТРАЦИЯ userId ───
  socket.on('registerUser', (data) => {
    if (data && data.userId) {
      socket.userId = String(data.userId);
      getProfile(socket.userId, data.username);
      log('registerUser', { socketId: socket.id, userId: socket.userId });
    }
  });

  socket.on('joinRoom', async (data) => {
    const { roomId, userId, username, withBots, categories } = data;
    log('joinRoom', { roomId, userId, username, withBots });

    const profile = getProfile(userId, username);


    let room = rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        host: userId,
        players: [],
        state: 'lobby',
        isPublic: false,
        categories: Array.isArray(categories) && categories.length ? categories : ['general'],
        currentParty: 0,
        round: 0,
        usedSituations: [],
        usedGifs: [],
        submissions: new Map(),
        votes: new Map(),
        roundTimer: null,
        voteTimer: null
      };
      rooms.set(roomId, room);
    }

    // Обновить категории комнаты, если хост в лобби
    if (room.state === 'lobby' && room.host === userId && Array.isArray(categories) && categories.length) {
      room.categories = categories;
      log('roomCategories:update', { roomId, categories });
    }

    // Проверка лимита
    if (room.players.length >= config.game.maxPlayers) {
      socket.emit('roomFull');
      return;
    }

    // Реконнект или новый игрок
    let player = room.players.find(p => p.userId === userId);
    if (!player) {
      player = {
        id: socket.id,
        userId,
        username,
        socketId: socket.id,
        isBot: false,
        score: 0,
        partyScore: 0,
        hand: [],
        replacedGifs: [],
        swapsUsed: 0,
        ready: false,
        afk: false,
        ragequits: 0,
        avatar: profile && profile.avatar ? profile.avatar : null
      };
      room.players.push(player);
    } else {
      // Реконнект
      player.socketId = socket.id;
      player.id = socket.id;
      player.afk = false;

      const profile = getProfile(userId, username);
      player.username = username || player.username;
      player.avatar = profile && profile.avatar ? profile.avatar : null;

      // Отправить текущий стейт при реконнекте
      if (room.state === 'playing') {
        setTimeout(() => {
          socket.emit('roundStart', {
            party: room.currentParty,
            round: room.round,
            situation: room.currentSituation.text,
            hand: player.hand,
            swapsAllowed: room.round <= 5 ? [3,2,1,0,0][room.round-1] : 0,
            swapsUsed: player.swapsUsed || 0,
            timer: 15,
            hasSubmitted: room.submissions.has(player.userId),
            message: 'Переподключение...'
          });
        }, 300);
      } else if (room.state === 'voting') {
        const subs = Array.from(room.submissions.values()).map(s => ({
          playerId: s.playerId,
          url: s.gif.url
        }));
        setTimeout(() => {
          socket.emit('votingStart', {
            situation: room.currentSituation.text,
            submissions: subs,
            timer: 15,
            message: 'Переподключение...'
          });
        }, 300);
      }
    }

    socket.join(roomId);
    socket.userId = userId;
    players.set(socket.id, { roomId, userId });

    // Добавляем ботов
    emitRoomUpdate(room);
  });

  // ─── БЫСТРАЯ ИГРА (МАТЧМЕЙКИНГ) ───
  socket.on('quickPlay', async (data) => {
    const { userId, username, categories } = data;
    log('quickPlay', { userId, username });

    const qpProfile = getProfile(userId, username);


    // Ищем публичную комнату в лобби с местом
    let targetRoom = null;
    rooms.forEach(room => {
      if (room.isPublic && room.state === 'lobby' && room.players.length < config.game.maxPlayers) {
        const humanCount = room.players.filter(p => !p.isBot).length;
        if (humanCount < config.game.maxPlayers) {
          targetRoom = room;
        }
      }
    });

    // Не нашли — создаём
    if (!targetRoom) {
      const roomId = generateRoomId();
      targetRoom = {
        id: roomId,
        host: userId,
        players: [],
        state: 'lobby',
        isPublic: true,
        categories: Array.isArray(categories) && categories.length ? categories : ['general', 'friends'],
        currentParty: 0,
        round: 0,
        usedSituations: [],
        usedGifs: [],
        submissions: new Map(),
        votes: new Map(),
        roundTimer: null,
        voteTimer: null,
        quickPlayTimer: null
      };
      rooms.set(roomId, targetRoom);
      log('quickPlay:newRoom', { roomId });

      // Таймер: через 30 сек добиваем ботами и стартуем
      targetRoom.quickPlayTimer = setTimeout(() => {
        if (targetRoom.state !== 'lobby') return;
        io.to(targetRoom.id).emit('funMessage', { text: 'Долго не собирается? Хост может начать с ботами.' });
      }, 60000);
    }
    if (targetRoom.state === 'lobby' && targetRoom.host === userId && Array.isArray(categories) && categories.length) {
      targetRoom.categories = categories;
      log('quickPlay:categories', { roomId: targetRoom.id, categories });
    }

    // Проверка: уже в комнате?
    let player = targetRoom.players.find(p => p.userId === userId);
    if (!player) {
      player = {
        id: socket.id,
        userId,
        username,
        socketId: socket.id,
        isBot: false,
        score: 0,
        partyScore: 0,
        hand: [],
        replacedGifs: [],
        swapsUsed: 0,
        ready: true,  // В быстрой игре — автоготовность
        afk: false,
        ragequits: 0,
        avatar: qpProfile && qpProfile.avatar ? qpProfile.avatar : null
      };
      targetRoom.players.push(player);
    } else {
      player.socketId = socket.id;
      player.id = socket.id;
      if (qpProfile && qpProfile.avatar) player.avatar = qpProfile.avatar;
    }

    socket.join(targetRoom.id);
    players.set(socket.id, { roomId: targetRoom.id, userId });

    socket.emit('quickPlayJoined', { roomId: targetRoom.id });
    emitRoomUpdate(targetRoom);

    // Если набралось 4+ — стартуем сразу
    const humanCount = targetRoom.players.filter(p => !p.isBot).length;
    if (humanCount >= 4) {
      if (targetRoom.quickPlayTimer) clearTimeout(targetRoom.quickPlayTimer);
      startGame(targetRoom);
    }
  });

  // ─── ПРИНУДИТЕЛЬНЫЙ СТАРТ (ХОСТ) ───
  socket.on('forceStart', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    const room = rooms.get(playerInfo.roomId);
    if (!room || room.state !== 'lobby') return;

    // Только хост может
    if (room.host !== playerInfo.userId) {
      socket.emit('swapDenied', { message: 'Только хост может начать игру!' });
      return;
    }

    const humanCount = room.players.filter(p => !p.isBot).length;
    if (humanCount < 1) return;

    log('forceStart', { roomId: room.id, host: playerInfo.userId, humans: humanCount });

    if (room.quickPlayTimer) clearTimeout(room.quickPlayTimer);
    // Добить ботами только если < 2 людей
    const hc = room.players.filter(p => !p.isBot).length;
    if (hc < 2) fillWithBots(room);
    startGame(room);
  });

  // ─── ГОТОВНОСТЬ ───
  socket.on('playerReady', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    const room = rooms.get(playerInfo.roomId);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (player) {
      player.ready = true;
      emitRoomUpdate(room);

      // Все готовы? Старт!
      const allReady = room.players.every(p => p.ready);
      if (allReady && room.players.length >= config.game.minPlayers) {
        startGame(room);
      }
    }
  });

  // ─── СЫГРАТЬ КАРТУ ───
  socket.on('submitCard', (data) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    const room = rooms.get(playerInfo.roomId);
    if (!room || room.state !== 'playing') return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;
    if (room.submissions.has(player.userId)) return; // Уже сдал

    const card = player.hand.find(c => c.id === data.cardId);
    if (!card) return;

    room.submissions.set(player.userId, {
      playerId: player.userId,
      username: player.username,
      gif: card
    });
    player.hand = player.hand.filter(c => c.id !== data.cardId);
    player.afk = false;

    log('submitCard', { roomId: room.id, player: player.username, card: data.cardId });

    io.to(room.id).emit('playerSubmitted', {
      playerId: player.userId,
      username: player.username,
      total: room.submissions.size,
      required: room.players.length,
      cardUrl: card.url
    });

    if (room.submissions.size === room.players.length) {
      startVoting(room);
    }
  });


  // ─── ПРОПУСК ХОДА ───
  socket.on('skipTurn', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    const room = rooms.get(playerInfo.roomId);
    if (!room || room.state !== 'playing') return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;
    if (room.submissions.has(player.userId)) return;

    // Пропуск = сдать первую карту но без очков
    const card = player.hand[0];
    if (!card) return;

    room.submissions.set(player.userId, {
      playerId: player.userId,
      username: player.username,
      gif: card,
      skipped: true
    });
    player.hand = player.hand.filter(c => c.id !== card.id);

    log('skipTurn', { roomId: room.id, player: player.username });

    io.to(room.id).emit('playerSubmitted', {
      playerId: player.userId,
      username: player.username,
      total: room.submissions.size,
      required: room.players.length,
      cardUrl: card.url
    });

    if (room.submissions.size === room.players.length) {
      startVoting(room);
    }
  });

  // ─── ВЫХОД ИЗ КОМНАТЫ ───
  socket.on('leaveRoom', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    const room = rooms.get(playerInfo.roomId);
    if (!room) return;

    const wasHost = room.host === playerInfo.userId;
    const userId = playerInfo.userId;
    const roomId = room.id;
    const roomState = room.state;

    log('leaveRoom', { roomId, userId, wasHost, state: roomState, playersBefore: room.players.length });

    // Удалить игрока
    room.players = room.players.filter(p => p.socketId !== socket.id);
    socket.leave(roomId);
    players.delete(socket.id);

    const humans = room.players.filter(p => !p.isBot).length;
    const bots = room.players.filter(p => p.isBot).length;

    log('leaveRoom:after', { roomId, humans, bots });

    // Если остался один человек — завершаем игру
    if (humans === 1 && room.state !== 'lobby') {
      log('leaveRoom:autoEndGame', { roomId, humans });
      endGame(room);
      return;
    }

    // Нет людей — полное уничтожение комнаты
    if (humans === 0) {
      log('roomDestroy', { roomId, reason: 'no humans left' });
      if (room.roundTimer) clearTimeout(room.roundTimer);
      if (room.voteTimer) clearTimeout(room.voteTimer);
      if (room.quickPlayTimer) clearTimeout(room.quickPlayTimer);
      io.to(roomId).emit('roomClosed', { reason: 'Все игроки вышли' });
      rooms.delete(roomId);
      log('roomDeleted', { roomId });
      return;
    }

    // Хост ушёл — передаём живому игроку
    if (wasHost) {
      const newHost = room.players.find(p => !p.isBot);
      if (newHost) {
        room.host = newHost.userId;
        log('hostTransfer', { roomId, newHost: newHost.username, newHostId: newHost.userId });
      } else {
        // Только боты — уничтожаем
        log('roomDestroy', { roomId, reason: 'only bots after host left' });
        if (room.roundTimer) clearTimeout(room.roundTimer);
        if (room.voteTimer) clearTimeout(room.voteTimer);
        if (room.quickPlayTimer) clearTimeout(room.quickPlayTimer);
        rooms.delete(roomId);
        log('roomDeleted', { roomId });
        return;
      }
    }

    emitRoomUpdate(room);

    // Если игра шла — проверить можно ли продолжить
    if (roomState === 'playing' && room.submissions && room.submissions.size >= room.players.length) {
      log('leaveRoom:autoVoting', { roomId });
      startVoting(room);
    }
    if (roomState === 'voting' && room.votes && room.votes.size >= room.players.length) {
      log('leaveRoom:autoEndRound', { roomId });
      endRound(room);
    }
  });

  // ─── ЗАМЕНА КАРТЫ ───
  socket.on('replaceCard', (data) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    const room = rooms.get(playerInfo.roomId);
    if (!room || room.state !== 'playing') return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    const roundIndex = room.round - 1;
    const roundConfig = GAME_STRUCTURE[roundIndex];
    player.swapsUsed = player.swapsUsed || 0;

    if (player.swapsUsed >= roundConfig.swaps) {
      socket.emit('swapDenied', { message: 'Замены закончились!' });
      return;
    }

    const cardIndex = player.hand.findIndex(c => c.id === data.cardId);
    if (cardIndex === -1) return;

    const oldCard = player.hand[cardIndex];
    player.replacedGifs.push(oldCard.id);
    room.usedGifs.push(oldCard.id);

    const excluded = [...room.usedGifs, ...player.replacedGifs, ...player.hand.map(c => c.id)];
    let newGif = getRandomGif(excluded);
    if (newGif === oldCard.id) {
      newGif = getRandomGif(excluded.concat([newGif]));
    }
    const newUrl = newGif.startsWith('UC:')
      ? '/user_content/memes/' + newGif.replace('UC:', '')
      : '/memes/best/' + newGif;
    const newCard = { id: newGif, url: newUrl };
    room.usedGifs.push(newGif);
    globalUsedGifs.add(newGif);

    player.hand[cardIndex] = newCard;
    player.swapsUsed++;

    log('replaceCard', { roomId: room.id, player: player.username, old: oldCard.id, new: newGif });

    socket.emit('cardReplaced', {
      oldCardId: oldCard.id,
      newCard,
      swapsUsed: player.swapsUsed,
      swapsAllowed: roundConfig.swaps,
      message: getRandomMessage('replace')
    });
  });

  // ─── ГОЛОСОВАНИЕ ───
  socket.on('vote', (data) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    const room = rooms.get(playerInfo.roomId);
    if (!room || room.state !== 'voting') return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    // Нельзя за себя
    if (data.playerId === player.userId) return;
    // Нельзя дважды
    if (room.votes.has(player.userId)) return;

    room.votes.set(player.userId, data.playerId);

    log('vote', { roomId: room.id, voter: player.username, votedFor: data.playerId });

    io.to(room.id).emit('voteReceived', {
      total: room.votes.size,
      required: room.players.length
    });

    if (room.votes.size === room.players.length) {
      endRound(room);
    }
  });


  // ─── РЕАКЦИИ ───
  socket.on('reaction', (data) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    const room = rooms.get(playerInfo.roomId);
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    log('reaction', { roomId: room.id, player: player.username, emoji: data.emoji, target: data.targetId });

    // Рассылаем всем в комнате
    io.to(room.id).emit('reactionReceived', {
      emoji: data.emoji,
      from: player.username,
      targetId: data.targetId
    });
  });


  // ─── УДАЛЕНИЕ МЕМА (АДМИН) ───
  socket.on('deleteMeme', (data) => {
    // Админ может удалять без комнаты — берём userId из socket
    const ADMIN_ID = '406185603';
    const userId = socket.userId || (players.get(socket.id) && players.get(socket.id).userId);
    log('deleteMeme:attempt', { socketId: socket.id, userId, filename: data.filename });
    if (userId !== ADMIN_ID) {
      log('deleteMeme:denied', { userId });
      return;
    }
    const filename = data.filename;
    if (!filename || filename.includes('..') || filename.includes('/')) return;
    const pool = data.pool || 'base';
    const filePath = pool === 'user'
      ? path.join(__dirname, 'user_content', 'memes', filename)
      : path.join(__dirname, 'public', 'memes', 'best', filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        log('deleteMeme:ok', { filename });
        socket.emit('memeDeleted', { filename, message: 'Удалён: ' + filename });
      }
    } catch(e) {
      log('deleteMeme:error', { filename, error: e.message });
    }
  });

  // ─── ЛИДЕРБОРД ───
  socket.on('getLeaderboard', () => {
    socket.emit('leaderboard', leaderboard.slice(0, 20));
  });

  // ─── DISCONNECT ───
  socket.on('disconnect', () => {
    log('disconnect:event', { socketId: socket.id });
    handleDisconnect(socket);
  });
});

function handleDisconnect(socket) {
  const playerInfo = players.get(socket.id);
  if (!playerInfo) {
    log('disconnect:noInfo', { socketId: socket.id });
    return;
  }

  const roomId = playerInfo.roomId;
  const userId = playerInfo.userId;
  const room = rooms.get(roomId);

  log('handleDisconnect', { socketId: socket.id, roomId, userId, roomExists: !!room });

  if (room) {
    const player = room.players.find(p => p.socketId === socket.id);
    if (player) {
      if (room.state === 'playing' || room.state === 'voting') {
        player.ragequits = (player.ragequits || 0) + 1;
        log('disconnect:ragequit', { roomId, userId, ragequits: player.ragequits });
      }
    }

    const wasHost = room.host === userId;
    room.players = room.players.filter(p => p.socketId !== socket.id);
    const humans = room.players.filter(p => !p.isBot).length;

    log('disconnect:afterRemove', { roomId, humans, wasHost, state: room.state });

    if (humans === 0) {
      log('roomDestroy', { roomId, reason: 'disconnect: no humans' });
      if (room.roundTimer) clearTimeout(room.roundTimer);
      if (room.voteTimer) clearTimeout(room.voteTimer);
      if (room.quickPlayTimer) clearTimeout(room.quickPlayTimer);
      rooms.delete(roomId);
      log('roomDeleted', { roomId });
    } else {
      // Передать хоста
      if (wasHost) {
        const newHost = room.players.find(p => !p.isBot);
        if (newHost) {
          room.host = newHost.userId;
          log('disconnect:hostTransfer', { roomId, newHost: newHost.username });
        }
      }
      emitRoomUpdate(room);

      // Авто-продолжение
      if (room.state === 'playing' && room.submissions && room.submissions.size >= room.players.length) {
        log('disconnect:autoVoting', { roomId });
        startVoting(room);
      }
      if (room.state === 'voting' && room.votes && room.votes.size >= room.players.length) {
        log('disconnect:autoEndRound', { roomId });
        endRound(room);
      }
    }
  }

  players.delete(socket.id);
  log('disconnect:done', { socketId: socket.id, userId });
}

function emitRoomUpdate(room) {
  io.to(room.id).emit('roomUpdate', {
    players: room.players.map(p => ({
      userId: p.userId,
      username: p.username,
      isBot: p.isBot,
      ready: p.ready,
      score: p.score,
      ragequits: p.ragequits || 0,
      afk: p.afk || false,
      avatar: p.avatar || null
    })),
    state: room.state,
    host: room.host,
    roomId: room.id
  });
}

// ═══════════════════════════════════════════
//   REST API
// ═══════════════════════════════════════════

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// ─── ОНЛАЙН СТАТИСТИКА ───
app.get('/api/admin-stats', (req, res) => {
  let totalInLobby = 0;
  let activeRooms = 0;
  let playingRooms = 0;

  rooms.forEach(room => {
    const humanCount = room.players.filter(p => !p.isBot).length;
    if (room.state === 'lobby') {
      totalInLobby += humanCount;
      activeRooms++;
    } else if (room.state !== 'gameEnd') {
      playingRooms++;
    }
  });

  res.json({
    online: io.engine.clientsCount || 0,
    inLobby: totalInLobby,
    lobbies: activeRooms,
    playing: playingRooms
  });
});

app.get('/api/leaderboard', (req, res) => {
  res.json(leaderboard.slice(0, 20));
});

app.get('/api/profile', (req, res) => {
  const userId = req.query.userId ? String(req.query.userId) : '';
  const username = req.query.username || '';
  if (!userId) return res.status(400).json({ ok: false, error: 'no userId' });

  const prof = getProfile(userId, username) || { userId, username: username || 'Игрок', wins: 0, avatar: null, wallet: null };
  const lbEntry = leaderboard.find(p => p.userId === userId);
  const gamesPlayed = lbEntry ? (lbEntry.gamesPlayed || 0) : 0;

  res.json({
    ok: true,
    profile: {
      userId: prof.userId,
      username: prof.username,
      wins: prof.wins || 0,
      gamesPlayed,
      avatar: prof.avatar || null,
      wallet: prof.wallet || null
    }
  });
});

app.post('/api/profile/avatar', (req, res) => {
  const { userId, avatar } = req.body || {};
  if (!userId || !avatar || !avatar.image) return res.status(400).json({ ok: false, error: 'bad data' });
  const prof = getProfile(userId, req.body.username || '');
  if (!prof) return res.status(400).json({ ok: false, error: 'no profile' });
  prof.avatar = avatar;
  saveProfiles();
  log('profile:avatar', { userId, name: avatar.name || '', address: avatar.address || '' });
  res.json({ ok: true });
});

app.post('/api/profile/wallet', (req, res) => {
  const { userId, address } = req.body || {};
  if (!userId || !address) return res.status(400).json({ ok: false, error: 'bad data' });
  const prof = getProfile(userId, req.body.username || '');
  if (!prof) return res.status(400).json({ ok: false, error: 'no profile' });
  prof.wallet = { address, linkedAt: Date.now() };
  saveProfiles();
  log('profile:wallet', { userId, address });
  res.json({ ok: true });
});

async function httpsGetJson(url, headers = {}) {
  const https = require('https');
  return await new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      headers
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

app.get('/api/ton/nfts', async (req, res) => {
  const address = req.query.address ? String(req.query.address) : '';
  if (!address) return res.status(400).json({ ok: false, error: 'no address' });
  if (!TONAPI_KEY) return res.status(500).json({ ok: false, error: 'TONAPI_KEY not configured' });
  try {
    const url = `https://tonapi.io/v2/accounts/${address}/nfts?limit=100&indirect_ownership=true`;
    const data = await httpsGetJson(url, {
      'Authorization': `Bearer ${TONAPI_KEY}`
    });
    res.json({ ok: true, data });
  } catch (e) {
    log('tonapi:error', { address, error: e.message });
    res.status(500).json({ ok: false, error: 'TonAPI error' });
  }
});

// ─── СТАТИСТИКА ВИЗИТОВ ───
app.post('/api/visit', (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ ok: false, error: 'no userId' });

  visitsStore.total += 1;
  if (!visitsStore.unique.includes(userId)) {
    visitsStore.unique.push(userId);
  }
  saveVisits();

  res.json({
    ok: true,
    total: visitsStore.total,
    unique: visitsStore.unique.length,
    version: APP_VERSION
  });
});

app.get('/api/visit', (req, res) => {
  res.json({
    total: visitsStore.total,
    unique: visitsStore.unique.length,
    version: APP_VERSION
  });
});

// ─── КОНФИГ АНАЛИТИКИ ───
app.get('/api/analytics', (req, res) => {
  res.json({
    token: ANALYTICS_TOKEN,
    appName: ANALYTICS_APP,
    tonIdClientId: TON_ID_CLIENT_ID
  });
});

app.post('/api/room/create', (req, res) => {
  const roomId = generateRoomId();
  res.json({ roomId });
});


app.get('/api/referral/stats', (req, res) => {
  const userId = req.query.userId ? String(req.query.userId) : '';
  if (!userId) return res.status(400).json({ ok: false, error: 'no userId' });

  const now = Date.now();
  const l1 = [];
  const l2 = [];
  const l3 = [];

  Object.keys(referrals).forEach(uid => {
    const r = referrals[uid];
    if (r.referrer === userId) l1.push(uid);
  });
  l1.forEach(uid1 => {
    Object.keys(referrals).forEach(uid => {
      const r = referrals[uid];
      if (r.referrer === uid1) l2.push(uid);
    });
  });
  l2.forEach(uid2 => {
    Object.keys(referrals).forEach(uid => {
      const r = referrals[uid];
      if (r.referrer === uid2) l3.push(uid);
    });
  });

  const countActive = (uids) => uids.filter(uid => (referrals[uid] && (now - (referrals[uid].lastActive || 0) <= 30 * 24 * 60 * 60 * 1000))).length;

  const stats = {
    level1: l1.length,
    level2: l2.length,
    level3: l3.length,
    active1: countActive(l1),
    active2: countActive(l2),
    active3: countActive(l3)
  };

  const ref = referrals[userId] || {};
  const income = {
    total: (ref.level1Earned || 0) + (ref.level2Earned || 0) + (ref.level3Earned || 0),
    level1: ref.level1Earned || 0,
    level2: ref.level2Earned || 0,
    level3: ref.level3Earned || 0
  };


  const buckets = (referralBuckets[userId] && referralBuckets[userId].buckets) ? referralBuckets[userId].buckets : {};
  const chart = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now - i * 24 * 60 * 60 * 1000);
    dayStart.setHours(0,0,0,0);
    const dayEnd = dayStart.getTime() + 24*60*60*1000;
    let sum = 0;
    Object.keys(buckets).forEach(k => {
      const ts = Number(k);
      if (ts >= dayStart.getTime() && ts < dayEnd) sum += buckets[k];
    });
    chart.push({ day: dayStart.toISOString().slice(0,10), value: sum });
  }

  res.json({ ok: true, stats, income, windowDays: null, chart });
});

app.get('/api/referral/:userId', (req, res) => {
  const userId = req.params.userId;
  const ref = referrals[userId] || {};
  res.json({
    totalEarned: (ref.level1Earned || 0) + (ref.level2Earned || 0) + (ref.level3Earned || 0),
    level1: { earned: ref.level1Earned || 0 },
    level2: { earned: ref.level2Earned || 0 },
    level3: { earned: ref.level3Earned || 0 }
  });
});


app.post('/api/referral/reverse', (req, res) => {
  const { userId, points, token } = req.body || {};
  if (!token || token !== (config.admin && config.admin.token)) {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }
  const pts = Math.max(0, Number(points || 0));
  if (!userId || !pts) return res.status(400).json({ ok: false, error: 'bad data' });

  const now = Date.now();
  if (!referrals[userId]) return res.json({ ok: false, error: 'no referral' });

  const level1Id = referrals[userId].referrer;
  if (level1Id) {
    const reward1 = Math.floor(pts * 0.03);
    if (reward1 > 0) {
      updateLeaderboard(level1Id, getReferralUsername(level1Id), -reward1);
      bumpReferralBucket(level1Id, -reward1, now);
      if (referrals[level1Id]) referrals[level1Id].level1Earned = (referrals[level1Id].level1Earned || 0) - reward1;
    }
    if (referrals[level1Id]) {
      const level2Id = referrals[level1Id].referrer;
      if (level2Id) {
        const reward2 = Math.floor(pts * 0.02);
        if (reward2 > 0) {
          updateLeaderboard(level2Id, getReferralUsername(level2Id), -reward2);
          bumpReferralBucket(level2Id, -reward2, now);
          if (referrals[level2Id]) referrals[level2Id].level2Earned = (referrals[level2Id].level2Earned || 0) - reward2;
        }
        if (referrals[level2Id]) {
          const level3Id = referrals[level2Id].referrer;
          if (level3Id) {
            const reward3 = Math.floor(pts * 0.01);
            if (reward3 > 0) {
              updateLeaderboard(level3Id, getReferralUsername(level3Id), -reward3);
              bumpReferralBucket(level3Id, -reward3, now);
              if (referrals[level3Id]) referrals[level3Id].level3Earned = (referrals[level3Id].level3Earned || 0) - reward3;
            }
          }
        }
      }
    }
  }
  saveReferrals();
  res.json({ ok: true });
});

app.post('/api/referral/register', (req, res) => {
  const { userId, referrerId, deviceId } = req.body;
  if (!userId || !referrerId || userId === referrerId) {
    return res.json({ success: false, error: 'Invalid data' });
  }
  if (referrals[userId]) {
    return res.json({ success: false, error: 'Already registered' });
  }
  if (deviceId) {
    const existing = referralDevices[deviceId];
    if (existing && String(existing) !== String(userId)) {
      return res.json({ success: false, error: 'Device already linked' });
    }
  }
  referrals[userId] = {
    referrer: referrerId,
    referredAt: Date.now(),
    totalEarned: 0,
    level1Earned: 0,
    level2Earned: 0,
    level3Earned: 0,
    deviceId: deviceId || null,
    lastActive: Date.now()
  };
  if (deviceId) {
    referralDevices[deviceId] = userId;
    saveReferralDevices();
  }
  saveReferrals();
  log('referralRegistered', { userId, referrerId });
  res.json({ success: true });
});

// ═══════════════════════════════════════════
//   ЗАПУСК
// ═══════════════════════════════════════════


// Рассылка онлайн-статистики каждые 10 секунд
setInterval(() => {
  let totalInLobby = 0;
  let activeRooms = 0;
  let playingRooms = 0;

  rooms.forEach(room => {
    const humanCount = room.players.filter(p => !p.isBot).length;
    if (room.state === 'lobby') {
      totalInLobby += humanCount;
      activeRooms++;
    } else if (room.state !== 'gameEnd') {
      playingRooms++;
    }
  });

  io.emit('onlineStats', {
    online: io.engine.clientsCount || 0,
    inLobby: totalInLobby,
    lobbies: activeRooms,
    playing: playingRooms
  });
}, 10000);

const PORT = config.server.port;
server.listen(PORT, () => {
  console.log(`🎮 GGamemes запущен на порту ${PORT}`);
  console.log(`🌐 https://ggamemes.ru`);
  console.log(`📁 Мемы: ${path.join(__dirname, 'public', 'memes', 'best')}`);
  try {
    const memesCount = fs.readdirSync(path.join(__dirname, 'public', 'memes', 'best')).length;
    console.log(`🖼️  Найдено мемов: ${memesCount}`);
  } catch (e) {
    console.log(`⚠️  Папка с мемами не найдена!`);
  }
});

// ═══════════════════════════════════════════════════════════
// API: СОЗДАНИЕ ИНВОЙСА TELEGRAM STARS
// ═══════════════════════════════════════════════════════════
async function telegramCreateInvoice(botToken, payload) {
    if (typeof fetch === 'function') {
        const resp = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await resp.json();
    }

    const https = require('https');
    return await new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const req = https.request({
            hostname: 'api.telegram.org',
            path: `/bot${botToken}/createInvoiceLink`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        }, (res) => {
            let raw = '';
            res.on('data', (chunk) => raw += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(raw)); }
                catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

app.post('/api/create-invoice', async (req, res) => {
    const { type, price, userId, username } = req.body;
    
    if (!type || !price) {
        return res.status(400).json({ ok: false, error: 'Нет данных' });
    }
    
    try {
        const botToken = config.telegram && config.telegram.botToken ? config.telegram.botToken : '';
        if (!botToken) {
            return res.status(500).json({ ok: false, error: 'Bot token is not configured' });
        }
        const title = type === 'meme' ? 'Загрузка мема' : 'Загрузка ситуации';
        const description = 'Оплата модерации контента';
        const payload = JSON.stringify({ type, userId, username, timestamp: Date.now() });

        const result = await telegramCreateInvoice(botToken, {
            title: title,
            description: description,
            payload: payload,
            provider_token: '',
            currency: 'XTR',
            prices: [{ label: 'Stars', amount: price }],
            subscription_period: 0,
            max_tip_amount: 0,
            is_flexible: false
        });
        
        if (result.ok) {
            log('[STARS] Invoice created:', result.result);
            res.json({ ok: true, invoice_url: result.result });
        } else {
            log('[STARS] Error:', result);
            res.status(500).json({ ok: false, error: result.description || 'Bot API error' });
        }
    } catch (e) {
        log('[STARS] Exception:', e.message);
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ═══════════════════════════════════════════════════════════
// API: ПРОВЕРКА СТАТУСА ЗАЯВКИ
// ═══════════════════════════════════════════════════════════
app.get('/api/submission-status', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Нет userId' });
    
    const userSubs = submissions.filter(s => s.userId === userId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ submissions: userSubs });
});
