
// ═══ НАСТРОЙКИ ═══
let settingsTab = 'general';
let tonConnectUI = null;
let tonInitDone = false;
let tonWalletAddress = '';
let tonNftList = [];
let profileCache = null;
let appLang = 'en';

const I18N = {
    en: {
        title: "GGamemes — What's the Meme?",
        subtitle: "WHAT'S THE MEME?",
        quick_play: '🎲 Quick Match',
        private_room: '🔒 Private Room',
        join_by_code: '🔑 Join by Code',
        leaderboard: '🏆 Leaderboard',
        memes: '🖼 Memes',
        upload: '📤 Upload',
        settings: '⚙️ Settings',
        back: '← Back',
        leave: '← Leave',
        gallery_title: '🖼 Memes ({count})',
        gallery_base: '📦 Base ({count})',
        gallery_user: '👥 Community ({count})',
        upload_title: '📤 Upload Meme',
        upload_hint: 'GIF or image, max 5MB',
        upload_tap: 'Tap to select',
        settings_title: '⚙️ Settings',
        settings_general: 'General',
        settings_profile: 'Profile',
        settings_wallet: 'Wallet',
        language_label: '🌐 Language',
        language_hint: 'App language follows Telegram settings by default',
        adult_label: '🔞 Enable 18+',
        adult_hint: '🔒 Adult content is currently unavailable',
        games: 'Games',
        wins: 'Wins',
        referral_stats: 'Referral stats',
        referral_note: 'Unlimited payouts',
        wallet_not_connected: 'Wallet not connected',
        disconnect: 'Disconnect',
        nft_in_wallet: 'NFT in wallet',
        nft_connect_hint: 'Connect wallet to see NFTs',
        create_room: 'Create room',
        your_name: 'Your name',
        situation_categories: 'Situation categories:',
        cat_general: '🌍 General',
        cat_friends: '👫 Friends',
        cat_study: '📚 Study',
        cat_work: '💼 Work',
        create: 'Create',
        join_room: 'Join room',
        room_code: 'Room code',
        join: 'Join',
        room: 'Room',
        gathering_players: 'Gathering players...',
        ready: 'Ready!',
        start_game: '⚡ Start game',
        invite_friends: '📤 Invite friends',
        party: 'Party',
        round: 'Round',
        swap: 'Swap',
        card_submitted: '✓ Card submitted',
        voting_title_default: 'Pick the legend',
        voting_footer_default: 'Tap the best meme',
        round_winner: 'Round winner',
        party_finished: 'Party finished',
        game_over: 'Game over',
        back_to_menu: 'Back to menu',
        waiting_players: 'Waiting for players...',
        wallet_connected: 'Wallet connected',
        sdk_not_loaded: 'SDK not loaded',
        nft_loading: 'Loading NFTs...',
        nft_load_error: 'Failed to load NFTs',
        nft_not_found: 'No NFTs found',
        avatar_updated: '✅ Avatar updated',
        avatar_save_error: '❌ Failed to save avatar',
        network_error: '❌ Network error',
        gallery_loading: 'Loading...',
        gallery_load_error: 'Load error',
        gallery_empty: 'Empty',
        delete_confirm: 'Delete {name}?',
        upload_too_big: 'Max 5MB',
        upload_in_progress: 'Uploading...',
        meme_uploaded: '✅ Meme uploaded!',
        upload_error_generic: 'Error',
        searching_room: 'Looking for a room...',
        enter_name: 'Enter your name!',
        fill_all_fields: 'Fill all fields!',
        leave_room_confirm: 'Leave room?',
        ready_done: '✓ Ready',
        waiting_short: 'Waiting...',
        start_with_bots_count: '⚡ Start with bots ({count} ppl)',
        start_game_count: '⚡ Start game ({count} ppl)',
        turn_skipped: '⏭ Turn skipped',
        swaps_label: 'Swaps: {used}/{allowed}',
        swaps_finished: 'No swaps left!',
        own_meme: 'Your meme',
        voted_count: 'Voted: {total}/{required}',
        draw: 'Draw!',
        points_suffix: 'pts.',
        party_finished_with_num: 'Party {party} finished',
        total_word: 'total',
        leaderboard_empty: 'No data yet. Play your first game!',
        games_suffix: 'games',
        online_suffix: 'online',
        games_online_suffix: 'games',
        waiting_suffix: 'waiting',
        share_short: '🎲 Join GGamemes! Room: {room}',
        share_x_text: '🎲 GGamemes - join room {room}',
        share_link_label: 'Link: {link}',
        share_copy_prompt: 'Copy this link:',
        link_copied: 'Link copied!',
        share_discord_hint: 'Text copied. Paste it into Discord.',
        analytics_no_config: 'analytics: no config',
        analytics_ok: 'analytics: ok',
        analytics_fail: 'analytics: fail',
        lock_aria: 'Lock screen',
        connecting: 'Connecting...',
        room_full: 'Room is full. Max 10 players.',
        meme_alt: 'Meme',
        winning_meme_alt: 'Winning meme',
        thinking_left: '🤔 Thinking: {left}',
        adult_phrases: [
            '🔒 This door is locked',
            '🔑 Wrong password',
            '🙅 Nope, not now',
            '🚫 Access denied',
            '👶 Too early for this',
            '🔞 Adults only',
            '🛡️ Password protected',
            '💀 Not today',
            '🔐 Lock cannot be opened',
            '🚷 No entry'
        ],
        upload_phrases: [
            '🚫 Not available right now',
            '🔒 Closed for now',
            '❌ Nice try, no luck',
            '😅 Try via bot',
            '🤷‍️ Nothing here...',
            '⛔ Access restricted',
            '🙃 Just kidding!',
            '💀 Dead end...',
            '🔕 Retired',
            '🎭 Decoration only'
        ]
    },
    ru: {
        title: 'GGamemes — Что за мем?',
        subtitle: 'ЧТО ЗА МЕМ?',
        quick_play: '🎲 Найти игру',
        private_room: '🔒 Приватный стол',
        join_by_code: '🔑 Войти по коду',
        leaderboard: '🏆 Лидерборд',
        memes: '🖼 Мемы',
        upload: '📤 Загрузить',
        settings: '⚙️ Настройки',
        back: '← Назад',
        leave: '← Выйти',
        gallery_title: '🖼 Мемы ({count})',
        gallery_base: '📦 Базовые ({count})',
        gallery_user: '👥 Пользовательские ({count})',
        upload_title: '📤 Загрузить мем',
        upload_hint: 'GIF или картинка, макс 5МБ',
        upload_tap: 'Тапни чтобы выбрать',
        settings_title: '⚙️ Настройки',
        settings_general: 'Общее',
        settings_profile: 'Профиль',
        settings_wallet: 'Кошелёк',
        language_label: '🌐 Язык',
        language_hint: 'По умолчанию язык берётся из Telegram',
        adult_label: '🔞 Включить 18+',
        adult_hint: '🔒 Контент для взрослых пока недоступен',
        games: 'Игр',
        wins: 'Побед',
        referral_stats: 'Реферальная статистика',
        referral_note: 'Начисления без срока',
        wallet_not_connected: 'Кошелёк не подключен',
        disconnect: 'Отключить',
        nft_in_wallet: 'NFT в кошельке',
        nft_connect_hint: 'Подключите кошелёк, чтобы увидеть NFT',
        create_room: 'Создать стол',
        your_name: 'Твоё имя',
        situation_categories: 'Категории ситуаций:',
        cat_general: '🌍 Общие',
        cat_friends: '👫 Друзья',
        cat_study: '📚 Учёба',
        cat_work: '💼 Работа',
        create: 'Создать',
        join_room: 'Присоединиться',
        room_code: 'Код комнаты',
        join: 'Войти',
        room: 'Комната',
        gathering_players: 'Созываем совет старейшин...',
        ready: 'Готов!',
        start_game: '⚡ Начать игру',
        invite_friends: '📤 Пригласить друзей',
        party: 'Партия',
        round: 'Раунд',
        swap: 'Заменить',
        card_submitted: '✓ Карта сыграна',
        voting_title_default: 'Ну что... выбираем легенду',
        voting_footer_default: 'Тапни на лучший мем',
        round_winner: 'Победитель раунда',
        party_finished: 'Партия завершена',
        game_over: 'Игра окончена',
        back_to_menu: 'На главную',
        waiting_players: 'Ожидание игроков...',
        wallet_connected: 'Кошелёк подключен',
        sdk_not_loaded: 'SDK не загружен',
        nft_loading: 'Загрузка NFT...',
        nft_load_error: 'Ошибка загрузки NFT',
        nft_not_found: 'NFT не найдены',
        avatar_updated: '✅ Аватар обновлён',
        avatar_save_error: '❌ Не удалось сохранить аватар',
        network_error: '❌ Ошибка сети',
        gallery_loading: 'Загрузка...',
        gallery_load_error: 'Ошибка загрузки',
        gallery_empty: 'Пусто',
        delete_confirm: 'Удалить {name}?',
        upload_too_big: 'Макс 5МБ',
        upload_in_progress: 'Загрузка...',
        meme_uploaded: '✅ Мем загружен!',
        upload_error_generic: 'Ошибка',
        searching_room: 'Ищем стол...',
        enter_name: 'Введи имя, мемлорд!',
        fill_all_fields: 'Заполни все поля!',
        leave_room_confirm: 'Выйти из комнаты?',
        ready_done: '✓ Готов',
        waiting_short: 'Ожидание...',
        start_with_bots_count: '⚡ Начать с ботами ({count} чел.)',
        start_game_count: '⚡ Начать игру ({count} чел.)',
        turn_skipped: '⏭ Ход пропущен',
        swaps_label: 'Замены: {used}/{allowed}',
        swaps_finished: 'Замены закончились!',
        own_meme: 'Твой мем',
        voted_count: 'Проголосовало: {total}/{required}',
        draw: 'Ничья!',
        points_suffix: 'очк.',
        party_finished_with_num: 'Партия {party} завершена',
        total_word: 'всего',
        leaderboard_empty: 'Пока нет данных. Сыграй первую игру!',
        games_suffix: 'игр',
        online_suffix: 'онлайн',
        games_online_suffix: 'игр',
        waiting_suffix: 'ждут',
        share_short: '🎲 Заходи играть в мемы! Комната: {room}',
        share_x_text: '🎲 GGamemes - играем в комнате {room}',
        share_link_label: 'Ссылка: {link}',
        share_copy_prompt: 'Скопируй ссылку:',
        link_copied: 'Ссылка скопирована!',
        share_discord_hint: 'Текст скопирован. Вставь его в Discord.',
        analytics_no_config: 'analytics: no config',
        analytics_ok: 'analytics: ok',
        analytics_fail: 'analytics: fail',
        lock_aria: 'Закрепить экран',
        connecting: 'Подключение...',
        room_full: 'Комната заполнена. Максимум 10 игроков.',
        meme_alt: 'Мем',
        winning_meme_alt: 'Победный мем',
        thinking_left: '🤔 Думают: {left}',
        adult_phrases: [
            '🔒 Эта дверь на замке',
            '🔑 Пароль не подходит',
            '🙅 Нет, нет и ещё раз нет',
            '🚫 Доступ закрыт',
            '👶 Тебе рано сюда',
            '🔞 Только для взрослых',
            '🛡️ Защищено паролем',
            '💀 Не сегодня',
            '🔐 Замок не открыть',
            '🚷 Вход воспрещён'
        ],
        upload_phrases: [
            '🚫 Не работает, совсем!',
            '🔒 Закрыто, точно закрыто',
            '❌ Не получилось, не фартануло',
            '😅 Попробуй через бота',
            '🤷‍️ Тут пусто...',
            '⛔ Доступ запрещён',
            '🙃 Шутка!',
            '💀 Мёртво...',
            '🔕 На пенсии',
            '🎭 Декорация'
        ]
    }
};

function normalizeLang(langCode) {
    if (!langCode) return '';
    const code = String(langCode).toLowerCase();
    return code.startsWith('ru') ? 'ru' : (code.startsWith('en') ? 'en' : '');
}

function t(key, vars = {}) {
    const dict = I18N[appLang] || I18N.en;
    let template = dict[key];
    if (template === undefined) template = I18N.en[key];
    if (typeof template !== 'string') return '';
    return template.replace(/\{(\w+)\}/g, (_, varName) => (vars[varName] ?? ''));
}

function tList(key) {
    const dict = I18N[appLang] || I18N.en;
    const items = dict[key] !== undefined ? dict[key] : I18N.en[key];
    return Array.isArray(items) ? items : [];
}

function setTextById(id, key, vars = {}) {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key, vars);
}

function setPlaceholderById(id, key) {
    const el = document.getElementById(id);
    if (el) el.placeholder = t(key);
}

function updateGalleryLabels() {
    const total = galleryData?.count || 0;
    const baseCount = galleryData?.base?.count || 0;
    const userCount = galleryData?.user?.count || 0;

    const title = document.getElementById('galleryTitle');
    if (title) title.innerHTML = t('gallery_title', { count: `<span id="memeCount">${total}</span>` });

    setTextById('galleryBaseTab', 'gallery_base', { count: baseCount });
    setTextById('galleryUserTab', 'gallery_user', { count: userCount });
}

function updateReferralRows() {
    const total = document.getElementById('refIncome')?.textContent || '0';
    const l1Active = document.getElementById('refA1')?.textContent || '0';
    const l1Total = document.getElementById('refL1')?.textContent || '0';
    const l2Active = document.getElementById('refA2')?.textContent || '0';
    const l2Total = document.getElementById('refL2')?.textContent || '0';
    const l3Active = document.getElementById('refA3')?.textContent || '0';
    const l3Total = document.getElementById('refL3')?.textContent || '0';
    const inc1 = document.getElementById('refIncome1')?.textContent || '0';
    const inc2 = document.getElementById('refIncome2')?.textContent || '0';
    const inc3 = document.getElementById('refIncome3')?.textContent || '0';

    const rowTotal = document.getElementById('refTotalRow');
    const rowL1 = document.getElementById('refL1Row');
    const rowL2 = document.getElementById('refL2Row');
    const rowL3 = document.getElementById('refL3Row');
    const rowInc1 = document.getElementById('refIncomeL1Row');
    const rowInc2 = document.getElementById('refIncomeL2Row');
    const rowInc3 = document.getElementById('refIncomeL3Row');

    if (rowTotal) rowTotal.innerHTML = appLang === 'ru'
        ? `Всего начислено: <span id="refIncome">${total}</span> NEMEMCOIN`
        : `Total accrued: <span id="refIncome">${total}</span> NEMEMCOIN`;
    if (rowL1) rowL1.innerHTML = appLang === 'ru'
        ? `L1: <span id="refA1">${l1Active}</span> (всего: <span id="refL1">${l1Total}</span>)`
        : `L1: <span id="refA1">${l1Active}</span> (total: <span id="refL1">${l1Total}</span>)`;
    if (rowL2) rowL2.innerHTML = appLang === 'ru'
        ? `L2: <span id="refA2">${l2Active}</span> (всего: <span id="refL2">${l2Total}</span>)`
        : `L2: <span id="refA2">${l2Active}</span> (total: <span id="refL2">${l2Total}</span>)`;
    if (rowL3) rowL3.innerHTML = appLang === 'ru'
        ? `L3: <span id="refA3">${l3Active}</span> (всего: <span id="refL3">${l3Total}</span>)`
        : `L3: <span id="refA3">${l3Active}</span> (total: <span id="refL3">${l3Total}</span>)`;
    if (rowInc1) rowInc1.innerHTML = appLang === 'ru'
        ? `Начислено L1: <span id="refIncome1">${inc1}</span> NEMEMCOIN`
        : `Accrued L1: <span id="refIncome1">${inc1}</span> NEMEMCOIN`;
    if (rowInc2) rowInc2.innerHTML = appLang === 'ru'
        ? `Начислено L2: <span id="refIncome2">${inc2}</span> NEMEMCOIN`
        : `Accrued L2: <span id="refIncome2">${inc2}</span> NEMEMCOIN`;
    if (rowInc3) rowInc3.innerHTML = appLang === 'ru'
        ? `Начислено L3: <span id="refIncome3">${inc3}</span> NEMEMCOIN`
        : `Accrued L3: <span id="refIncome3">${inc3}</span> NEMEMCOIN`;
}

function applyStaticTranslations() {
    document.documentElement.lang = appLang;
    document.title = t('title');

    const lockBtn = document.getElementById('lockScreenBtn');
    if (lockBtn) lockBtn.setAttribute('aria-label', t('lock_aria'));

    setTextById('subtitleText', 'subtitle');
    setTextById('quickPlayLabel', 'quick_play');
    setTextById('privateRoomLabel', 'private_room');
    setTextById('joinCodeLabel', 'join_by_code');
    setTextById('leaderboardMenuLabel', 'leaderboard');
    setTextById('memesMenuLabel', 'memes');
    setTextById('uploadMenuLabel', 'upload');
    setTextById('settingsMenuLabel', 'settings');
    setTextById('backBtnGallery', 'back');
    setTextById('backBtnUpload', 'back');
    setTextById('backBtnSettings', 'back');
    setTextById('backBtnCreate', 'back');
    setTextById('backBtnJoin', 'back');
    setTextById('backBtnLobby', 'leave');
    setTextById('backBtnLeaderboard', 'back');
    setTextById('uploadTitle', 'upload_title');
    setTextById('uploadHintText', 'upload_hint');
    setTextById('uploadTapText', 'upload_tap');
    setTextById('uploadBtnLabel', 'upload');
    setTextById('settingsTitle', 'settings_title');
    setTextById('settingsTabGeneral', 'settings_general');
    setTextById('settingsTabProfile', 'settings_profile');
    setTextById('settingsTabWallet', 'settings_wallet');
    setTextById('languageLabel', 'language_label');
    setTextById('languageHint', 'language_hint');
    setTextById('adultLabel', 'adult_label');
    setTextById('adultHint', 'adult_hint');
    setTextById('profileGamesLabel', 'games');
    setTextById('profileWinsLabel', 'wins');
    setTextById('refTitle', 'referral_stats');
    setTextById('refNote', 'referral_note');
    setTextById('disconnectWalletLabel', 'disconnect');
    setTextById('walletNftTitle', 'nft_in_wallet');
    setTextById('nftEmptyState', 'nft_connect_hint');
    setTextById('createRoomTitle', 'create_room');
    setTextById('categoriesLabel', 'situation_categories');
    setTextById('catGeneralLabel', 'cat_general');
    setTextById('catFriendsLabel', 'cat_friends');
    setTextById('catStudyLabel', 'cat_study');
    setTextById('catWorkLabel', 'cat_work');
    setTextById('createRoomBtnLabel', 'create');
    setTextById('joinRoomTitle', 'join_room');
    setTextById('joinRoomBtnLabel', 'join');
    setTextById('lobbyTitle', 'room');
    setTextById('lobbyMessage', 'gathering_players');
    setTextById('readyBtnLabel', 'ready');
    setTextById('forceStartLabel', 'start_game');
    setTextById('shareRoomLabel', 'invite_friends');
    setTextById('hudPartyLabel', 'party');
    setTextById('hudRoundLabel', 'round');
    setTextById('swapText', 'swap');
    setTextById('submitIndicatorText', 'card_submitted');
    setTextById('votingTitle', 'voting_title_default');
    setTextById('votingStatus', 'voting_footer_default');
    setTextById('roundWinnerTitle', 'round_winner');
    setTextById('partyTitle', 'party_finished');
    setTextById('finalBackMenuLabel', 'back_to_menu');
    setTextById('leaderboardTitle', 'leaderboard');
    setTextById('finalTitle', 'game_over');

    setPlaceholderById('hostName', 'your_name');
    setPlaceholderById('playerName', 'your_name');
    setPlaceholderById('roomCode', 'room_code');

    const select = document.getElementById('languageSelect');
    if (select && select.value !== appLang) select.value = appLang;

    updateGalleryLabels();
    updateReferralRows();
    if (lastOnlineStats) {
        handleOnlineStats(lastOnlineStats);
    } else {
        setTextById('statText', 'connecting');
    }
}

function resolveInitialLanguage() {
    const saved = normalizeLang(localStorage.getItem('appLang'));
    if (saved) return saved;
    const urlLang = normalizeLang(new URLSearchParams(window.location.search).get('lang'));
    if (urlLang) return urlLang;
    const tgLang = normalizeLang(tg?.initDataUnsafe?.user?.language_code);
    return tgLang || 'en';
}

function setAppLanguage(lang, persist = true) {
    const normalized = normalizeLang(lang) || 'en';
    appLang = normalized;
    if (persist) localStorage.setItem('appLang', normalized);
    applyStaticTranslations();
}

function onLanguageSelect(lang) {
    setAppLanguage(lang, true);
}

window.onLanguageSelect = onLanguageSelect;

function showSettings() {
    showScreen('settingsScreen');
    switchSettingsTab('general');
    loadProfile();
    initTonConnect();
}

function switchSettingsTab(tab) {
    settingsTab = tab;
    document.querySelectorAll('.settings-tab').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector('.settings-tab[data-tab="' + tab + '"]');
    if (btn) btn.classList.add('active');

    document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('settings' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (panel) panel.classList.add('active');
}

async function loadProfile() {
    try {
        const resp = await fetch('/api/profile?userId=' + encodeURIComponent(currentUser.id) + '&username=' + encodeURIComponent(currentUser.username));
        const data = await resp.json();
        if (data && data.ok && data.profile) {
            profileCache = data.profile;
            updateProfileUI(data.profile);
        }
    } catch (e) {
        console.log('[PROFILE] load error', e.message);
    }
}

function updateProfileUI(profile) {
    const nameEl = document.getElementById('profileName');
    const idEl = document.getElementById('profileId');
    const gamesEl = document.getElementById('profileGames');
    const winsEl = document.getElementById('profileWins');

    if (nameEl) nameEl.textContent = profile.username || 'Player';
    if (idEl) {
        idEl.textContent = 'ID: ' + (profile.userId || '—');
        if (!idEl.classList.contains('blur') && !idEl.classList.contains('reveal')) {
            idEl.classList.add('blur');
        }
        idEl.onclick = () => {
            idEl.classList.toggle('reveal');
            idEl.classList.toggle('blur');
        };
    }
    if (gamesEl) gamesEl.textContent = profile.gamesPlayed || 0;
    if (winsEl) winsEl.textContent = profile.wins || 0;

    setProfileAvatarUI(profile.avatar || null);
    loadReferralStats();
}

function setProfileAvatarUI(avatar) {
    const img = document.getElementById('profileAvatarImg');
    const fallback = document.getElementById('profileAvatarFallback');
    if (!img || !fallback) return;

    if (avatar && avatar.image) {
        img.src = avatar.image;
        img.style.display = 'block';
        fallback.style.display = 'none';
    } else {
        img.style.display = 'none';
        fallback.style.display = 'block';
    }
}

function maskAddress(addr) {
    if (!addr) return '—';
    const s = String(addr);
    if (s.length <= 8) return s;
    return s.slice(0, 4) + '…' + s.slice(-4);
}

function updateWalletUI(connected, address) {
    const status = document.getElementById('walletStatus');
    const addr = document.getElementById('walletAddress');
    const disconnectBtn = document.getElementById('disconnectWalletBtn');
    if (status) status.textContent = connected ? t('wallet_connected') : t('wallet_not_connected');
    if (addr) addr.textContent = connected ? maskAddress(address) : '—';
    if (disconnectBtn) disconnectBtn.style.display = connected ? 'block' : 'none';
}

async function initTonConnect() {
    if (tonInitDone) return;
    const root = document.getElementById('tonConnectBtn');
    if (!root) return;

    if (!window.TON_CONNECT_UI) {
        console.log('[TON] SDK not found');
        const status = document.getElementById('walletStatus');
        if (status) status.textContent = t('sdk_not_loaded');
        return;
    }

    tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://ggamemes.ru/tonconnect-manifest.json',
        buttonRootId: 'tonConnectBtn'
    });

    tonInitDone = true;

    tonConnectUI.onStatusChange(async (wallet) => {
        if (wallet && wallet.account && wallet.account.address) {
            tonWalletAddress = wallet.account.address;
            console.log('[TON] connected', tonWalletAddress);
            updateWalletUI(true, tonWalletAddress);
            await saveWalletAddress(tonWalletAddress);
            await fetchWalletNfts(tonWalletAddress);
        } else {
            tonWalletAddress = '';
            updateWalletUI(false, '');
            renderNfts([]);
            console.log('[TON] disconnected');
        }
    });
}

async function disconnectWallet() {
    if (!tonConnectUI) return;
    try {
        await tonConnectUI.disconnect();
    } catch (e) {
        console.log('[TON] disconnect error', e.message);
    }
}

async function saveWalletAddress(address) {
    try {
        await fetch('/api/profile/wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, username: currentUser.username, address })
        });
    } catch (e) {
        console.log('[PROFILE] wallet save error', e.message);
    }
}

async function fetchWalletNfts(address) {
    const grid = document.getElementById('nftGrid');
    if (grid) grid.innerHTML = '<div class="nft-empty">' + t('nft_loading') + '</div>';

    try {
        const resp = await fetch('/api/ton/nfts?address=' + encodeURIComponent(address));
        const data = await resp.json();
        if (!data || !data.ok) throw new Error(data && data.error ? data.error : 'TonAPI error');

        const items = data.data && (data.data.nft_items || data.data.nftItems) ? (data.data.nft_items || data.data.nftItems) : (data.nft_items || data.nftItems || []);
        tonNftList = (items || []).map(it => {
            let img = '';
            if (it.previews && it.previews.length) {
                // Берём самое большое превью
                img = it.previews[it.previews.length - 1].url || it.previews[0].url;
            } else if (it.metadata && it.metadata.image) {
                img = it.metadata.image;
            } else if (it.image) {
                img = it.image.original || it.image;
            }
            return {
                name: (it.metadata && it.metadata.name) || it.name || 'NFT',
                image: img,
                address: it.address || it.nft_address || '',
                collection: it.collection && it.collection.name ? it.collection.name : ''
            };
        }).filter(it => it.image);

        renderNfts(tonNftList);
        console.log('[TON] NFTs loaded:', tonNftList.length);
    } catch (e) {
        console.log('[TON] NFT load error', e.message);
        if (grid) grid.innerHTML = '<div class="nft-empty">' + t('nft_load_error') + '</div>';
    }
}

function renderNfts(list) {
    const grid = document.getElementById('nftGrid');
    if (!grid) return;

    if (!list || list.length === 0) {
        grid.innerHTML = '<div class="nft-empty">' + t('nft_not_found') + '</div>';
        return;
    }

    grid.innerHTML = '';
    list.forEach((nft) => {
        const card = document.createElement('div');
        card.className = 'nft-card';
        card.innerHTML = `
            <img src="${nft.image}" alt="nft">
            <div class="nft-name">${nft.name}</div>
        `;
        card.onclick = () => selectNftAvatar(nft, card);
        grid.appendChild(card);
    });

    if (profileCache && profileCache.avatar && profileCache.avatar.image) {
        const idx = list.findIndex(n => n.image === profileCache.avatar.image);
        if (idx >= 0) grid.children[idx].classList.add('selected');
    }
}

async function selectNftAvatar(nft, cardEl) {
    if (!nft || !nft.image) return;
    try {
        const resp = await fetch('/api/profile/avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                username: currentUser.username,
                avatar: nft
            })
        });
        const data = await resp.json();
        if (data && data.ok) {
            setProfileAvatarUI(nft);
            profileCache = profileCache || {};
            profileCache.avatar = nft;
            document.querySelectorAll('.nft-card').forEach(el => el.classList.remove('selected'));
            if (cardEl) cardEl.classList.add('selected');
            showFunMessage(t('avatar_updated'));
            console.log('[PROFILE] avatar set', nft);
        } else {
            showFunMessage(t('avatar_save_error'));
        }
    } catch (e) {
        console.log('[PROFILE] avatar save error', e.message);
        showFunMessage(t('network_error'));
    }
}


function showAdultMessage() {
    const msgs = tList('adult_phrases');
    showFunMessage(msgs[Math.floor(Math.random() * msgs.length)]);
}

function getSelectedCategories() {
    const cats = ['general'];
    if (document.getElementById('catFriends') && document.getElementById('catFriends').checked) cats.push('friends');
    if (document.getElementById('catStudy') && document.getElementById('catStudy').checked) cats.push('study');
    if (document.getElementById('catWork') && document.getElementById('catWork').checked) cats.push('work');
    return cats;
}


function getPlayerAvatarHTML(player, className) {
    const initial = player.username.replace(/🤖\s?/, '').charAt(0).toUpperCase();
    if (player.avatar && player.avatar.image) {
        return `<div class="${className} has-image"><img src="${player.avatar.image}" alt="avatar"></div>`;
    }
    return `<div class="${className}">${player.isBot ? '🤖' : initial}</div>`;
}


// ═══ ГАЛЕРЕЯ МЕМОВ ═══
let galleryTab = 'base';
let galleryData = null;

async function showMemeGallery() {
    showScreen('memeGalleryScreen');
    galleryTab = 'base';
    await loadGalleryData();
    renderGallery();
}

async function loadGalleryData() {
    const grid = document.getElementById('memeGalleryGrid');
    grid.innerHTML = '<p style="color:#aaa">' + t('gallery_loading') + '</p>';
    try {
        const resp = await fetch('/api/memes');
        galleryData = await resp.json();
        document.getElementById('memeCount').textContent = galleryData.count;
    } catch(e) {
        grid.innerHTML = '<p style="color:red">' + t('gallery_load_error') + '</p>';
        galleryData = null;
    }
}

function switchGalleryTab(tab) {
    galleryTab = tab;
    document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="' + tab + '"]').classList.add('active');
    renderGallery();
}

function renderGallery() {
    if (!galleryData) return;
    const grid = document.getElementById('memeGalleryGrid');
    grid.innerHTML = '';

    const pool = galleryTab === 'base' ? galleryData.base : galleryData.user;
    const basePath = pool.path;

    // Обновить счётчики в табах
    updateGalleryLabels();

    if (pool.files.length === 0) {
        grid.innerHTML = '<p style="color:#aaa">' + t('gallery_empty') + '</p>';
        return;
    }

    console.log('[GALLERY] Rendering', pool.files.length, 'files');
    pool.files.forEach((f, idx) => {
        if (idx < 3) console.log('[GALLERY] File:', f, 'Tab:', galleryTab);
        const item = document.createElement('div');
        item.className = 'gallery-item';
        let media;
        if (f.endsWith('.mp4')) {
            media = document.createElement('video');
            media.src = basePath + f;
            media.autoplay = true;
            media.loop = true;
            media.muted = true;
            media.playsInline = true;
        } else {
            media = document.createElement('img');
            // Превью для витрины (JPG вместо GIF)
            const ext = f.split('.').pop();
            const thumbName = f.replace('.' + ext, '.jpg');
            // Определяем путь к превью в зависимости от пула
            let thumbSrc;
            if (galleryTab === 'base') {
                thumbSrc = '/memes/thumbs/' + thumbName;
            } else {
                thumbSrc = '/user_content/thumbs/' + thumbName;
            }
            media.src = thumbSrc;
            media.dataset.full = basePath + f;
            media.loading = 'lazy';
            media.style.cursor = 'pointer';
            // Клик → загрузка полного GIF
            media.onclick = function() {
                if (this.src !== this.dataset.full) {
                    this.src = this.dataset.full;
                    this.style.cursor = 'default';
                }
            };
        }
        item.appendChild(media);
        if (currentUser.id === ADMIN_ID) {
            const del = document.createElement('button');
            del.className = 'gallery-delete';
            del.textContent = '🗑';
            del.onclick = async () => {
                if (!confirm(t('delete_confirm', { name: f }))) return;
                socket.emit('deleteMeme', { filename: f, pool: galleryTab });
                item.remove();
            };
            item.appendChild(del);
        }
        grid.appendChild(item);
    });
}

// ═══ ЗАГРУЗКА МЕМА ═══
function showUploadMeme() {
    showScreen('uploadMemeScreen');
    document.getElementById('uploadPreview').innerHTML = '<span style="font-size:3rem">📁</span><p>' + t('upload_tap') + '</p>';
    document.getElementById('uploadBtn').disabled = true;
    document.getElementById('memeFileInput').value = '';
}

function previewMeme(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) { alert(t('upload_too_big')); return; }
    const preview = document.getElementById('uploadPreview');
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.style.cssText = 'max-width:100%;max-height:250px;border-radius:10px';
    preview.innerHTML = '';
    preview.appendChild(img);
    document.getElementById('uploadBtn').disabled = false;
}

async function uploadMeme() {
    const input = document.getElementById('memeFileInput');
    if (!input.files || !input.files[0]) return;
    const btn = document.getElementById('uploadBtn');
    btn.disabled = true;
    btn.querySelector('span').textContent = t('upload_in_progress');
    const fd = new FormData();
    fd.append('meme', input.files[0]);
    try {
        const resp = await fetch('/api/upload-meme', { method: 'POST', body: fd });
        const data = await resp.json();
        if (data.ok) {
            showFunMessage(t('meme_uploaded'));
            showMain();
        } else {
            showFunMessage('❌ ' + (data.error || t('upload_error_generic')));
        }
    } catch(e) { showFunMessage(t('network_error')); }
    btn.disabled = false;
    btn.querySelector('span').textContent = t('upload');
}


// ═══ АДМИН: Удаление мемов ═══
const ADMIN_ID = '406185603';

function deleteMeme(filename, pool = 'base') {
    if (currentUser.id !== ADMIN_ID) return;
    if (!confirm(t('delete_confirm', { name: filename }))) return;
    socket.emit('deleteMeme', { filename, pool });
    console.log('[ADMIN] deleteMeme:', filename, 'pool:', pool);
}


// ═══ МЕМ ДНЯ ═══
async function loadMemeOfDay() {
    try {
        const resp = await fetch('/api/meme-of-day');
        const data = await resp.json();
        const el = document.getElementById('memeOfDay');
        if (!el || !data || !data.situation) return;
        document.getElementById('modSituation').textContent = data.situation;
        document.getElementById('modImage').src = data.memeUrl;
        document.getElementById('modAuthor').textContent = '— ' + data.author;
        el.style.display = 'block';
        console.log('[MEME OF DAY]', data);
    } catch(e) { console.log('[MEME OF DAY] none'); }
}


// ═══ РЕАКЦИИ ═══
function sendReaction(emoji) {
    if (!currentRoom) return;
    socket.emit('reaction', { emoji, targetId: gameState.currentVotingTarget || null });
    console.log('[REACTION] sent:', emoji);
}

function showFloatingReaction(data) {
    const container = document.getElementById('floatingReactions');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'floating-emoji';
    el.innerHTML = data.emoji + '<span class="reaction-name">' + (data.from || '') + '</span>';
    el.style.left = (15 + Math.random() * 70) + '%';
    container.appendChild(el);
    setTimeout(() => el.remove(), 2500);
}


// ═══ CONFETTI ═══
function fireConfetti() {
    if (typeof confetti !== 'function') return;
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#e09555', '#ffd700', '#ff6b35'] });
    setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.7 } }), 250);
}

// ═══════════════════════════════════════════
//   GGamemes — game.js | Клиентская логика
//   Версия по мастерпромту v0.0.7
// ═══════════════════════════════════════════

// ─── ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ───
let socket;
let tg = window.Telegram?.WebApp;
let currentUser = { id: null, username: null };
let currentRoom = null;
let lastOnlineStats = null;
let gameState = {
    party: 1,
    round: 1,
    hand: [],
    swapsAllowed: 0,
    swapsUsed: 0,
    draggingCard: null,
    dragStartY: 0,
    dragStartX: 0,
    isLocked: false,
    hasSubmitted: false
};

// ─── СТАТИСТИКА ВИЗИТОВ ───
async function reportVisit() {
    try {
        const resp = await fetch('/api/visit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });
        const data = await resp.json();
        if (data && data.ok) {
            const elU = document.getElementById('statUnique');
            const elT = document.getElementById('statTotal');
            const elV = document.getElementById('statVersion');
            if (elU) elU.textContent = data.unique;
            if (elT) elT.textContent = data.total;
            if (elV) elV.textContent = data.version || '—';
        }
    } catch(e) {}
}

// ─── АНАЛИТИКА TON Builders ───
let analyticsLoaded = false;
let analyticsConfig = null;
let analyticsTimer = null;
let analyticsAttempts = 0;

function setAnalyticsStatus(text) {
    const el = document.getElementById('statAnalytics');
    if (el) el.textContent = text;
}

function tryInitAnalytics() {
    if (analyticsLoaded || !analyticsConfig) return analyticsLoaded;
    if (!window.telegramAnalytics || typeof window.telegramAnalytics.init !== 'function') return false;

    window.telegramAnalytics.init({
        token: analyticsConfig.token,
        appName: analyticsConfig.appName
    });

    analyticsLoaded = true;
    setAnalyticsStatus(t('analytics_ok'));
    console.log('[ANALYTICS] initialized');

    if (analyticsTimer) {
        clearInterval(analyticsTimer);
        analyticsTimer = null;
    }

    try {
        if (typeof window.telegramAnalytics.track === 'function') {
            window.telegramAnalytics.track('custom-event', {
                custom_data: {
                    slug: 'sdk-init',
                    source: 'ggamemes-webapp'
                }
            });
        }
    } catch (e) {
        console.log('[ANALYTICS] custom-event error', e.message);
    }

    return true;
}

async function initAnalytics(forceRetry = false) {
    if (analyticsLoaded) return;
    try {
        if (!analyticsConfig || forceRetry) {
            const resp = await fetch('/api/analytics', { cache: 'no-store' });
            analyticsConfig = await resp.json();
        }

        if (!analyticsConfig || !analyticsConfig.token || !analyticsConfig.appName) {
            console.log('[ANALYTICS] missing config');
            setAnalyticsStatus(t('analytics_no_config'));
            return;
        }

        if (tryInitAnalytics()) return;
        if (analyticsTimer && !forceRetry) return;

        if (analyticsTimer) {
            clearInterval(analyticsTimer);
            analyticsTimer = null;
        }

        analyticsAttempts = 0;
        const maxAttempts = forceRetry ? 180 : 120;
        analyticsTimer = setInterval(() => {
            analyticsAttempts += 1;
            if (tryInitAnalytics() || analyticsAttempts >= maxAttempts) {
                if (analyticsTimer) {
                    clearInterval(analyticsTimer);
                    analyticsTimer = null;
                }
                if (!analyticsLoaded) {
                    console.log('[ANALYTICS] init failed');
                    setAnalyticsStatus(t('analytics_fail'));
                }
            }
        }, 500);
    } catch (e) {
        console.log('[ANALYTICS] init exception', e.message);
    }
}

window.initAnalytics = initAnalytics;
window.addEventListener('focus', () => initAnalytics());
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') initAnalytics();
});

// ─── ИНИЦИАЛИЗАЦИЯ ───
document.addEventListener('DOMContentLoaded', () => {
    // Telegram WebApp
    if (tg) {
        tg.ready();
        tg.expand();
        tg.disableVerticalSwipes();
        currentUser.id = tg.initDataUnsafe?.user?.id?.toString() || generateUserId();
        currentUser.username = tg.initDataUnsafe?.user?.first_name || 'Player';

        // startParam из ТРЁХ источников
        const urlParams = new URLSearchParams(window.location.search);
        const startParam = tg.initDataUnsafe?.start_param
            || urlParams.get('tgWebAppStartParam')
            || urlParams.get('p')
            || '';
        console.log('[INIT] startParam:', startParam, 'URL:', window.location.href);

        if (startParam) {
            if (startParam.includes('ref_')) {
                const referrerId = startParam.split('ref_')[1].split('_')[0];
                registerReferral(currentUser.id, referrerId);
            }
            if (startParam.includes('room_')) {
                const roomId = startParam.split('room_')[1].split('_')[0];
                if (roomId && roomId.length >= 4) {
                    const joinViaLink = () => {
                        currentRoom = roomId;
                        socket.emit('joinRoom', {
                            roomId: roomId,
                            userId: currentUser.id,
                            username: currentUser.username,
                            withBots: false
                        });
                        showScreen('lobbyScreen');
                        document.getElementById('roomIdDisplay').textContent = roomId;
                    };
                    if (socket && socket.connected) {
                        joinViaLink();
                    } else {
                        const iv = setInterval(() => {
                            if (socket && socket.connected) { clearInterval(iv); joinViaLink(); }
                        }, 300);
                        setTimeout(() => clearInterval(iv), 5000);
                    }
                }
            }
        }
    } else {
        currentUser.id = localStorage.getItem('userId') || generateUserId();
        currentUser.username = localStorage.getItem('username') || 'Player';
        localStorage.setItem('userId', currentUser.id);
    }

    setAppLanguage(resolveInitialLanguage(), false);

    // Блокировка экрана
    document.getElementById('lockScreenBtn').addEventListener('click', toggleScreenLock);

    // Плавающие цитаты
    startFloatingQuotes();

    // Socket.io
    connectSocket();

    console.log('[INIT] GGamemes loaded', { userId: currentUser.id, username: currentUser.username });

    reportVisit();
    initAnalytics();
    initTonConnect();
});

function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}


function getDeviceId() {
    const key = 'deviceId';
    let id = localStorage.getItem(key);
    if (!id) {
        id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(key, id);
    }
    return id;
}

// ═══════════════════════════════════════════
//   БЛОКИРОВКА ЭКРАНА
// ═══════════════════════════════════════════

function toggleScreenLock() {
    gameState.isLocked = !gameState.isLocked;
    const btn = document.getElementById('lockScreenBtn');
    const icon = btn.querySelector('.lock-icon');

    if (gameState.isLocked) {
        btn.classList.add('locked');
        icon.textContent = '🔒';
        if (tg) tg.disableVerticalSwipes();
    } else {
        btn.classList.remove('locked');
        icon.textContent = '🔓';
        if (tg) tg.enableVerticalSwipes();
    }
}

// ═══════════════════════════════════════════
//   ПЛАВАЮЩИЕ ЦИТАТЫ
// ═══════════════════════════════════════════

const memeQuotes = {
    en: [
        'Boom!', 'Legendary', 'Classic', 'Certified meme',
        'Meme of the year', 'Old but gold', 'Masterpiece', 'Cringe', 'Top tier',
        'Fire 🔥', 'Meme lord', 'Priceless', 'RIP 💀',
        'Absolute basics', 'We keep grinding', 'Coincidence? I think not',
        'That is a fail', 'Too relatable', 'Bro...', 'No way',
        'Respect', 'I understand', 'I disapprove', 'Beautiful chaos',
        'Delete this', 'Just hypothetically', 'Different story',
        'My respects', 'Who am I? Where am I?', 'Peak comedy'
    ],
    ru: [
        'Вжух!', 'Это легендарно', 'Классика', 'Годнота',
        'Мем года', 'Баян, но золото', 'Шедевр', 'Кринж', 'Топ мем',
        'Огонь 🔥', 'Лорд мемов', 'Бесценно', 'RIP 💀',
        'Это база', 'Работаем, братья', 'Совпадение? Не думаю',
        'Это фиаско, братан', 'Жиза', 'Карл!', 'Ой, всё',
        'Збс', 'Понимаю', 'Осуждаю', 'Красивое',
        'Наташ, мы всё уронили', 'Олды тут?', 'Чисто гипотетически',
        'Это другое', 'Беды с башкой', 'Моё почтение',
        'Галя, у нас отмена!', 'На расслабоне', 'Кто я? Где я?',
        'Пацаны вообще ребята', 'Удали, не позорься',
        'Сын маминой подруги', 'А че в смысле?', 'Адвокааат!',
        'Нормально делай — нормально будет', 'Я в моменте',
        'Полное хохоталово', 'Сказочное...', 'Гойда!'
    ]
};

function startFloatingQuotes() {
    const container = document.getElementById('floatingQuotes');
    if (!container) return;

    setInterval(() => {
        const quotes = memeQuotes[appLang] || memeQuotes.en;
        const quote = document.createElement('div');
        quote.className = 'floating-quote';
        quote.textContent = quotes[Math.floor(Math.random() * quotes.length)];
        quote.style.left = (10 + Math.random() * 80) + '%';
        const dur = 15 + Math.random() * 10;
        quote.style.setProperty('--dur', dur + 's');
        quote.style.animationDuration = dur + 's';

        container.appendChild(quote);
        setTimeout(() => quote.remove(), dur * 1000);
    }, 3000);
}

// ═══════════════════════════════════════════
//   SOCKET.IO
// ═══════════════════════════════════════════

function connectSocket() {
    socket = io({ transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
        console.log('[SOCKET] Connected:', socket.id);
        socket.emit('registerUser', { userId: String(currentUser.id), username: currentUser.username });
    });

    socket.on('roomUpdate', handleRoomUpdate);
    socket.on('roundStart', handleRoundStart);
    socket.on('playerSubmitted', handlePlayerSubmitted);
    socket.on('votingStart', handleVotingStart);
    socket.on('voteReceived', handleVoteReceived);
    socket.on('roundEnd', handleRoundEnd);
    socket.on('partyEnd', handlePartyEnd);
    socket.on('gameEnd', handleGameEnd);
    socket.on('leaderboard', handleLeaderboard);
    socket.on('cardReplaced', handleCardReplaced);
    socket.on('swapDenied', handleSwapDenied);
    socket.on('reactionReceived', (data) => {
        console.log('[REACTION]', data);
        showFloatingReaction(data);
    });

    socket.on('funMessage', (data) => {
        if (data && data.text) showFunMessage(data.text);
    });

    socket.on('memeDeleted', (data) => {
        console.log('[ADMIN] memeDeleted:', data);
        showFunMessage('🗑 ' + data.message);
    });

    socket.on('roomFull', () => showFunMessage(t('room_full')));

    socket.on('quickPlayJoined', (data) => {
        currentRoom = data.roomId;
        showScreen('lobbyScreen');
        document.getElementById('roomIdDisplay').textContent = data.roomId;
    });
    socket.on('onlineStats', handleOnlineStats);

    socket.on('disconnect', () => {
        console.log('[SOCKET] Disconnected');
    });
}

// ═══════════════════════════════════════════
//   НАВИГАЦИЯ
// ═══════════════════════════════════════════

function toggleStatsFooter(screenId) {
    const footer = document.getElementById('statsFooter');
    if (!footer) return;
    const hideOn = ['lobbyScreen','gameScreen','votingScreen','roundResultScreen','partyResultScreen','finalScreen'];
    footer.style.display = hideOn.includes(screenId) ? 'none' : 'flex';
}


function showScreen(screenId) {
    // Скрыть реакции при смене экрана
    const rb = document.getElementById('reactionsBar');
    if (rb) rb.style.display = (screenId === 'votingScreen') ? 'flex' : 'none';
    const exitBtn = document.querySelector('.exit-btn');
    if (exitBtn) {
        const hideOn = ['mainScreen', 'createRoomScreen', 'joinRoomScreen', 'lobbyScreen', 'leaderboardScreen'];
        exitBtn.style.display = hideOn.includes(screenId) ? 'none' : 'flex';
    }
    toggleStatsFooter(screenId);
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
}


// ═══════════════════════════════════════════
//   ВЫХОД В МЕНЮ
// ═══════════════════════════════════════════

function exitToMenu() {
    if (currentRoom) {
        socket.emit('leaveRoom');
        currentRoom = null;
    }
    gameState.hasSubmitted = false;
    gameState.hand = [];
    showScreen('mainScreen');
}

function showMain() {
    showScreen('mainScreen');
    if (currentRoom) {
        socket.emit('leaveRoom');
        currentRoom = null;
    }
    gameState.hasSubmitted = false;
}

function showCreateRoom() {
    showScreen('createRoomScreen');
    document.getElementById('hostName').value = currentUser.username;
}

function showJoinRoom() {
    showScreen('joinRoomScreen');
    document.getElementById('playerName').value = currentUser.username;
}

function showLeaderboard() {
    showScreen('leaderboardScreen');
    socket.emit('getLeaderboard');
}

// ═══════════════════════════════════════════
//   СОЗДАНИЕ / ПРИСОЕДИНЕНИЕ
// ═══════════════════════════════════════════


// ═══════════════════════════════════════════
//   БЫСТРАЯ ИГРА
// ═══════════════════════════════════════════

function quickPlay() {
    currentUser.username = currentUser.username || 'Player';
    socket.emit('quickPlay', {
        userId: currentUser.id,
        username: currentUser.username,
        categories: getSelectedCategories()
    });
    showFunMessage(t('searching_room'));
}

function forceStart() {
    socket.emit('forceStart');
}

async function createRoom() {
    const username = document.getElementById('hostName').value.trim();
    if (!username) {
        showFunMessage(t('enter_name'));
        return;
    }

    currentUser.username = username;
    if (!tg) localStorage.setItem('username', username);

    const response = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();

    currentRoom = data.roomId;

    socket.emit('joinRoom', {
        roomId: data.roomId,
        userId: currentUser.id,
        username: currentUser.username,
        categories: getSelectedCategories(),
        withBots: false
    });

    showScreen('lobbyScreen');
    document.getElementById('roomIdDisplay').textContent = data.roomId;
}

function joinRoom() {
    const roomId = document.getElementById('roomCode').value.trim().toUpperCase();
    const username = document.getElementById('playerName').value.trim();

    if (!roomId || !username) {
        showFunMessage(t('fill_all_fields'));
        return;
    }

    currentUser.username = username;
    currentRoom = roomId;
    if (!tg) localStorage.setItem('username', username);

    socket.emit('joinRoom', {
        roomId,
        userId: currentUser.id,
        username: currentUser.username,
        categories: getSelectedCategories(),
        withBots: false
    });

    showScreen('lobbyScreen');
    document.getElementById('roomIdDisplay').textContent = roomId;
}

async function createBotGame() {
    currentUser.username = currentUser.username || 'Player';

    const response = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    currentRoom = data.roomId;

    socket.emit('joinRoom', {
        roomId: data.roomId,
        userId: currentUser.id,
        username: currentUser.username,
        categories: getSelectedCategories(),
        withBots: true
    });

    showScreen('lobbyScreen');
    document.getElementById('roomIdDisplay').textContent = data.roomId;
}

function leaveLobby() {
    if (currentRoom) {
        if (!confirm(t('leave_room_confirm'))) return;
        socket.emit('leaveRoom');
        currentRoom = null;
    }
    showMain();
}

function playerReady() {
    socket.emit('playerReady');
    const btn = document.getElementById('readyBtn');
    btn.disabled = true;
    btn.querySelector('span').textContent = t('ready_done');
    btn.style.borderColor = '#39ff80';
}

// ═══════════════════════════════════════════
//   ОБРАБОТЧИКИ — ЛОББИ
// ═══════════════════════════════════════════

function handleRoomUpdate(data) {
    const playersList = document.getElementById('playersList');
    if (!playersList) return;

    playersList.innerHTML = '';

    data.players.forEach(player => {
        const item = document.createElement('div');
        item.className = 'player-item';
        if (player.ready) item.classList.add('ready');
        if (player.isBot) item.classList.add('bot');
        item.innerHTML = `
            ${getPlayerAvatarHTML(player, 'player-avatar')}
            <div class="player-name">${player.username}</div>
            <div class="player-status">${player.ready ? t('ready_done') : t('waiting_short')} </div>
        `;


        playersList.appendChild(item);
    });

    // Обновляем кнопку Ready для реконнекта
    const me = data.players.find(p => p.userId === currentUser.id);
    if (me && me.ready) {
        const btn = document.getElementById('readyBtn');
        btn.disabled = true;
        btn.querySelector('span').textContent = t('ready_done');
    }

    // Показать "Начать игру" хосту (мин. 2 игрока)
    const forceBtn = document.getElementById('forceStartBtn');
    if (forceBtn) {
        const isHost = data.host === currentUser.id;
        const humanCount = data.players.filter(p => !p.isBot).length;
        if (isHost && humanCount >= 1 && data.state === 'lobby') {
            forceBtn.style.display = 'block';
            forceBtn.querySelector('span').textContent = humanCount < 2
                ? t('start_with_bots_count', { count: humanCount })
                : t('start_game_count', { count: data.players.length });
        } else {
            forceBtn.style.display = 'none';
        }
    }
}

// ═══════════════════════════════════════════
//   ОБРАБОТЧИКИ — РАУНД
// ═══════════════════════════════════════════

function handleRoundStart(data) {
    showScreen('gameScreen');
    gameState.hasSubmitted = false;

    gameState.party = data.party;
    gameState.round = data.round;
    gameState.hand = data.hand;
    gameState.swapsAllowed = data.swapsAllowed;
    gameState.swapsUsed = data.swapsUsed || 0;

    // HUD
    document.getElementById('partyNum').textContent = data.party;
    document.getElementById('roundNum').textContent = data.round;

    // Ситуация
    document.getElementById('situationDisplay').textContent = data.situation;

    // Очистка центра стола
    document.getElementById('centerMemes').innerHTML = '';

    // Индикатор замен
    updateSwapsIndicator();

    // Скрыть индикатор хода
    document.getElementById('submitIndicator').style.display = 'none';

    // Рендер руки (веер)
    renderHand();

    // Другие игроки
    if (data.players) {
        renderOtherPlayers(data.players);
    }

    // Таймер
    startTimer(data.timer);

    console.log('[ROUND] Start:', { party: data.party, round: data.round, cards: data.hand.length });
}

// ═══════════════════════════════════════════
//   РЕНДЕР РУКИ (ВЕЕР)
// ═══════════════════════════════════════════

function renderHand() {
    const fan = document.getElementById('cardsFan');
    fan.innerHTML = '';

    const cards = gameState.hand;
    const count = cards.length;
    if (count === 0) return;

    const isMobile = window.innerWidth < 768;
    const totalAngle = Math.min(isMobile ? 45 : 55, count * (isMobile ? 10 : 13));
    const angleStep = count > 1 ? totalAngle / (count - 1) : 0;
    const startAngle = -totalAngle / 2;
    const fanRadius = isMobile ? 180 : 250;
    const centerX = window.innerWidth / 2;

    cards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'game-card';
        cardEl.dataset.cardId = card.id;
        cardEl.dataset.index = index;
        cardEl.style.zIndex = index + 1;

        const img = document.createElement('img');
        img.src = card.url;
        img.alt = t('meme_alt');
        img.loading = 'lazy';
        img.draggable = false;
        cardEl.appendChild(img);

        // Админ: кнопка удаления
        if (currentUser.id === ADMIN_ID) {
            const delBtn = document.createElement('button');
            delBtn.className = 'admin-delete-btn';
            delBtn.textContent = '🗑';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                const filename = card.url.split('/').pop();
                const pool = card.url.includes('/user_content/') ? 'user' : 'base';
                deleteMeme(filename, pool);
            };
            cardEl.appendChild(delBtn);
        }

        // Позиция веера
        const angle = startAngle + (angleStep * index);
        const radian = (angle * Math.PI) / 180;
        const x = Math.sin(radian) * fanRadius;
        const y = Math.cos(radian) * fanRadius - fanRadius;

        cardEl.style.left = `calc(50% - ${cardEl.offsetWidth / 2 || 43}px)`;
        cardEl.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
        cardEl.dataset.origTransform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
        cardEl.dataset.origX = x;
        cardEl.dataset.origY = y;
        cardEl.dataset.angle = angle;

        // === TOUCH EVENTS (телефон) ===
        cardEl.addEventListener('touchstart', onCardTouchStart, { passive: false });
        cardEl.addEventListener('touchmove', onCardTouchMove, { passive: false });
        cardEl.addEventListener('touchend', onCardTouchEnd, { passive: false });

        // === MOUSE EVENTS (ПК) ===
        cardEl.addEventListener('mousedown', onCardMouseDown);
        cardEl.addEventListener('mouseenter', () => {
            if (!gameState.draggingCard && !gameState.hasSubmitted) {
                cardEl.classList.add('hover');
                const origY = parseFloat(cardEl.dataset.origY);
                const origX = parseFloat(cardEl.dataset.origX);
                cardEl.style.transform = `translate(${origX}px, ${origY - 50}px) rotate(0deg) scale(1.3)`;
            }
        });
        cardEl.addEventListener('mouseleave', () => {
            if (!gameState.draggingCard) {
                cardEl.classList.remove('hover');
                cardEl.style.transform = cardEl.dataset.origTransform;
            }
        });

        fan.appendChild(cardEl);
    });
}

// ═══════════════════════════════════════════
//   DRAG & DROP — TOUCH (ТЕЛЕФОН)
// ═══════════════════════════════════════════

function onCardTouchStart(e) {
    if (gameState.hasSubmitted) return;
    e.preventDefault();

    const card = e.currentTarget;
    const touch = e.touches[0];

    gameState.draggingCard = card;
    gameState.dragStartY = touch.clientY;
    gameState.dragStartX = touch.clientX;

    card.classList.add('dragging');
    card.style.transition = 'none'; // КРИТИЧНО: без задержки!
    card.style.zIndex = 1000;
}

function onCardTouchMove(e) {
    if (!gameState.draggingCard) return;
    e.preventDefault();

    const touch = e.touches[0];
    const deltaY = touch.clientY - gameState.dragStartY;
    const deltaX = touch.clientX - gameState.dragStartX;

    const card = gameState.draggingCard;
    card.style.transform = `translate(${parseFloat(card.dataset.origX) + deltaX}px, ${parseFloat(card.dataset.origY) + deltaY}px) rotate(0deg) scale(1.1)`;

    // Показать/скрыть зону замены
    const swapZone = document.getElementById('swapZone');
    if (deltaY > 50 && gameState.swapsUsed < gameState.swapsAllowed) {
        swapZone.classList.add('visible');
    } else {
        swapZone.classList.remove('visible');
    }
}

function onCardTouchEnd(e) {
    if (!gameState.draggingCard) return;

    const card = gameState.draggingCard;
    const touch = e.changedTouches[0];
    const deltaY = touch.clientY - gameState.dragStartY;

    card.classList.remove('dragging');
    document.getElementById('swapZone').classList.remove('visible');

    const cardId = card.dataset.cardId;

    // ВВЕРХ (в центр) → Сыграть карту
    if (deltaY < -80) {
        submitCard(cardId, card);
    }
    // ВНИЗ → Заменить карту
    else if (deltaY > 80 && gameState.swapsUsed < gameState.swapsAllowed) {
        replaceCard(cardId, card);
    }
    // Вернуть на место
    else {
        card.style.transition = 'all 0.3s ease';
        card.style.transform = card.dataset.origTransform;
        setTimeout(() => { card.style.transition = ''; }, 300);
    }

    gameState.draggingCard = null;
}

// ═══════════════════════════════════════════
//   DRAG & DROP — MOUSE (ПК)
// ═══════════════════════════════════════════

function onCardMouseDown(e) {
    if (gameState.hasSubmitted) return;
    e.preventDefault();

    const card = e.currentTarget;

    gameState.draggingCard = card;
    gameState.dragStartY = e.clientY;
    gameState.dragStartX = e.clientX;

    card.classList.add('dragging');
    card.classList.remove('hover');
    card.style.transition = 'none';
    card.style.zIndex = 1000;

    const onMouseMove = (ev) => {
        if (!gameState.draggingCard) return;

        const deltaY = ev.clientY - gameState.dragStartY;
        const deltaX = ev.clientX - gameState.dragStartX;

        card.style.transform = `translate(${parseFloat(card.dataset.origX) + deltaX}px, ${parseFloat(card.dataset.origY) + deltaY}px) rotate(0deg) scale(1.1)`;

        const swapZone = document.getElementById('swapZone');
        if (deltaY > 50 && gameState.swapsUsed < gameState.swapsAllowed) {
            swapZone.classList.add('visible');
        } else {
            swapZone.classList.remove('visible');
        }
    };

    const onMouseUp = (ev) => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        if (!gameState.draggingCard) return;

        const deltaY = ev.clientY - gameState.dragStartY;
        card.classList.remove('dragging');
        document.getElementById('swapZone').classList.remove('visible');

        const cardId = card.dataset.cardId;

        if (deltaY < -80) {
            submitCard(cardId, card);
        } else if (deltaY > 80 && gameState.swapsUsed < gameState.swapsAllowed) {
            replaceCard(cardId, card);
        } else {
            card.style.transition = 'all 0.3s ease';
            card.style.transform = card.dataset.origTransform;
            setTimeout(() => { card.style.transition = ''; }, 300);
        }

        gameState.draggingCard = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

// ═══════════════════════════════════════════
//   СЫГРАТЬ / ЗАМЕНИТЬ КАРТУ
// ═══════════════════════════════════════════


function skipTurn() {
    if (gameState.hasSubmitted) return;
    gameState.hasSubmitted = true;
    socket.emit('skipTurn');
    document.getElementById('submitIndicator').style.display = 'block';
    document.getElementById('submitIndicator').querySelector('span').textContent = t('turn_skipped');
    const skipBtn = document.getElementById('skipTurnBtn');
    if (skipBtn) skipBtn.style.display = 'none';
}

function submitCard(cardId, cardEl) {
    if (gameState.hasSubmitted) return;
    gameState.hasSubmitted = true;
    const playedCard = gameState.hand.find(c => c.id === cardId);

    // Анимация: карта летит в центр и пропадает
    cardEl.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    cardEl.style.transform = 'translate(0, -300px) rotate(15deg) scale(0.5)';
    cardEl.style.opacity = '0';

    socket.emit('submitCard', { cardId });

    setTimeout(() => {
        gameState.hand = gameState.hand.filter(c => c.id !== cardId);
        renderHand();

        // Показать индикатор
        document.getElementById('submitIndicator').style.display = 'block';

        // Добавить мем в центр стола
        if (playedCard?.url) addCenterMeme(playedCard.url);
    }, 500);
}

function replaceCard(cardId, cardEl) {
    // Анимация: карта улетает вниз
    cardEl.style.transition = 'all 0.4s ease';
    cardEl.style.transform = 'translate(0, 200px) rotate(-10deg)';
    cardEl.style.opacity = '0';

    socket.emit('replaceCard', { cardId });
}

function addCenterMeme(cardUrl) {
    const container = document.getElementById('centerMemes');

    const meme = document.createElement('div');
    meme.className = 'center-meme';
    meme.innerHTML = `<img src="${cardUrl}" alt="${t('meme_alt')}">`;
    container.appendChild(meme);
}

// ═══════════════════════════════════════════
//   ДРУГИЕ ИГРОКИ ВОКРУГ СТОЛА
// ═══════════════════════════════════════════


function renderOtherPlayers(allPlayers) {
    const container = document.getElementById('otherPlayers');
    const table = document.getElementById('ovalTable');
    if (!container || !table) return;
    container.innerHTML = '';

    const others = allPlayers.filter(p => p.userId !== currentUser.id);
    const n = others.length;
    if (n === 0) return;

    const rect = table.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = rect.width * 0.50;
    const ry = rect.height * 0.40;

    // масштаб по количеству игроков (1 -> 1.0, 9 -> 0.55)
    const scale = Math.max(0.55, Math.min(1.0, 1.03 - (n - 1) * 0.07));

    // распределяем по верху и бокам, оставляя низ под карты игрока
    const startDeg = 150;
    const arc = 240;

    others.forEach((player, index) => {
        const seat = document.createElement('div');
        seat.className = 'seat';

        const t = (n === 1) ? 0.5 : (index / (n - 1));
        const angle = (startDeg + arc * t) * Math.PI / 180;
        const x = cx + Math.cos(angle) * rx;
        const y = cy + Math.sin(angle) * ry;

        seat.style.left = x + 'px';
        seat.style.top = y + 'px';
        seat.style.transform = `translate(-50%, -50%) scale(${scale})`;
        seat.style.setProperty('--mini-w', Math.round(11 * scale) + 'px');
        seat.style.setProperty('--mini-h', Math.round(15 * scale) + 'px');

        const isBot = player.isBot;
        const submitted = player.submitted;
        const afk = player.afk;
        const isRagequit = (player.ragequits || 0) > 2;

        let avatarClass = 'seat-avatar';
        if (isBot) avatarClass += ' bot-avatar';
        if (submitted) avatarClass += ' submitted';
        if (afk) avatarClass += ' afk';

        const miniCards = Array(player.cardCount || 0).fill(0).map(() =>
            `<div class="mini-card ${isRagequit ? 'ragequit' : ''}"></div>`
        ).join('');

        seat.innerHTML = `
            ${getPlayerAvatarHTML(player, avatarClass)}
            <div class="seat-name">${player.username}</div>
            <div class="seat-cards">${miniCards}</div>
        `;

        container.appendChild(seat);
    });
}

// ═══════════════════════════════════════════
//   ИНДИКАТОРЫ
// ═══════════════════════════════════════════

function updateSwapsIndicator() {
    const badge = document.getElementById('swapsBadge');
    if (gameState.swapsAllowed > 0) {
        badge.textContent = t('swaps_label', {
            used: gameState.swapsUsed,
            allowed: gameState.swapsAllowed
        });
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

function handlePlayerSubmitted(data) {
    console.log('[SUBMIT]', data.total + '/' + data.required, 'сделали выбор', data.username ? '('+data.username+')' : '');
    // Показать "думает" индикатор
    const thinking = document.getElementById('thinkingIndicator');
    if (thinking) {
        const left = data.required - data.total;
        if (left > 0) {
            thinking.textContent = t('thinking_left', { left });
            thinking.style.display = 'block';
        } else {
            thinking.style.display = 'none';
        }
    }
    console.log(`[SUBMIT] ${data.total}/${data.required} сделали выбор`);

    // Обновить аватар игрока
    const seats = document.querySelectorAll('.seat-avatar');
    // (аватары обновятся при следующем roundStart)
}

function handleCardReplaced(data) {
    // Заменить старую карту на новую в руке
    const oldIdx = gameState.hand.findIndex(c => c.id === data.oldCardId);
    if (oldIdx !== -1) {
        gameState.hand[oldIdx] = data.newCard;
    } else {
        gameState.hand.push(data.newCard);
    }

    gameState.swapsUsed = data.swapsUsed;
    renderHand();
    updateSwapsIndicator();

    showFunMessage(data.message);
}

function handleSwapDenied(data) {
    showFunMessage(data.message || t('swaps_finished'));
    // Вернуть карту на место — перерисуем руку
    renderHand();
}

// ═══════════════════════════════════════════
//   ГОЛОСОВАНИЕ
// ═══════════════════════════════════════════

function handleVotingStart(data) {
    // reactionsBar управляется через showScreen
    showScreen('votingScreen');

    document.getElementById('votingTitle').textContent = data.message || t('voting_title_default');
    document.getElementById('votingSituation').textContent = data.situation;

    const grid = document.getElementById('votingMemes');
    grid.innerHTML = '';

    data.submissions.forEach(sub => {
        const memeEl = document.createElement('div');
        memeEl.className = 'voting-meme';

        if (sub.playerId === currentUser.id) {
            memeEl.classList.add('own');
        }

        memeEl.innerHTML = `
            <img src="${sub.gif.url}" alt="${t('meme_alt')}">
            ${sub.playerId === currentUser.id ? '<div class="own-badge">' + t('own_meme') + '</div>' : ''}
        `;

        memeEl.addEventListener('click', () => {
            if (sub.playerId === currentUser.id) return;

            socket.emit('vote', { playerId: sub.playerId });

            // Подсветить выбранный
            document.querySelectorAll('.voting-meme').forEach(m => m.classList.remove('voted'));
            memeEl.classList.add('voted');
        });

        grid.appendChild(memeEl);
    });

    startTimer(data.timer);
}

function handleVoteReceived(data) {
    document.getElementById('votingStatus').textContent =
        t('voted_count', { total: data.total, required: data.required });
}

// ═══════════════════════════════════════════
//   РЕЗУЛЬТАТЫ РАУНДА
// ═══════════════════════════════════════════

function handleRoundEnd(data) {
    console.log('[ROUND END]', data);
    if (data.winnerId === currentUser.id) fireConfetti();
    showScreen('roundResultScreen');

    const winnerDisplay = document.getElementById('winnerDisplay');
    const winnerName = document.getElementById('winnerName');

    if (data.winnerGif) {
        winnerDisplay.innerHTML = `<img src="${data.winnerGif.url}" alt="${t('winning_meme_alt')}">`;
        winnerDisplay.style.display = 'block';
    } else {
        winnerDisplay.style.display = 'none';
    }

    if (data.winners && data.winners.length > 0) {
        winnerName.textContent = data.winners.map(w => w.username).join(', ');
    } else {
        winnerName.textContent = t('draw');
    }

    // Таблица очков
    const scoresDisplay = document.getElementById('scoresDisplay');
    scoresDisplay.innerHTML = '';

    data.scores.forEach(player => {
        const item = document.createElement('div');
        item.className = 'score-item';
        if (player.id === currentUser.id) item.classList.add('highlight');

        item.innerHTML = `
            <span>${player.username}</span>
            <span class="score-pts">${player.totalScoreLabel || (player.totalScore + ' ' + t('points_suffix'))} </span>
        `;
        scoresDisplay.appendChild(item);
    });
}

// ═══════════════════════════════════════════
//   РЕЗУЛЬТАТЫ ПАРТИИ
// ═══════════════════════════════════════════

function handlePartyEnd(data) {
    showScreen('partyResultScreen');

    document.getElementById('partyTitle').textContent = t('party_finished_with_num', { party: data.party });

    const scoresContainer = document.getElementById('partyScores');
    scoresContainer.innerHTML = '';

    data.scores.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'score-item';
        if (player.id === currentUser.id) item.classList.add('highlight');

        const prefix = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

        item.innerHTML = `
            <span>${prefix} ${player.username}</span>
            <span class="score-pts">${player.partyScore} (${t('total_word')}: ${player.totalScoreLabel || (player.totalScore + ' ' + t('points_suffix'))})</span>
        `;
        scoresContainer.appendChild(item);
    });
}

// ═══════════════════════════════════════════
//   ФИНАЛ ИГРЫ
// ═══════════════════════════════════════════

function handleGameEnd(data) {
    console.log('[GAME END]', data);
    if (data.podium && data.podium[0] && data.podium[0].oderId === currentUser.id) {
        fireConfetti();
        setTimeout(fireConfetti, 500);
        setTimeout(fireConfetti, 1000);
    }
    showScreen('finalScreen');

    document.getElementById('finalTitle').textContent = data.winnerPhrase;

    // Подиум
    const medals = ['🥇', '🥈', '🥉'];
    for (let i = 0; i < 3; i++) {
        const podium = document.getElementById(`podium${i + 1}`);
        if (data.finalScores[i]) {
            podium.innerHTML = `
                <div class="podium-medal">${medals[i]}</div>
                <div class="podium-name">${data.finalScores[i].username}</div>
                <div class="podium-score">${data.finalScores[i].totalScoreLabel || data.finalScores[i].score}</div>
            `;
        } else {
            podium.innerHTML = '';
        }
    }

    // Финальная таблица
    const finalScores = document.getElementById('finalScores');
    finalScores.innerHTML = '';

    data.finalScores.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'score-item';
        if (player.id === currentUser.id) item.classList.add('highlight');

        item.innerHTML = `
            <span>${index + 1}. ${player.username}</span>
            <span class="score-pts">${player.totalScoreLabel || player.score}</span>
        `;
        finalScores.appendChild(item);
    });
}

// ═══════════════════════════════════════════
//   ЛИДЕРБОРД
// ═══════════════════════════════════════════

function handleLeaderboard(data) {
    const list = document.getElementById('leaderboardList');
    if (!list) return;
    list.innerHTML = '';

    if (!data || data.length === 0) {
        list.innerHTML = '<div class="empty-state">' + t('leaderboard_empty') + '</div>';
        return;
    }

    data.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        if (index < 3) item.classList.add('top');

        let rankClass = '';
        if (index === 0) rankClass = 'gold';
        else if (index === 1) rankClass = 'silver';
        else if (index === 2) rankClass = 'bronze';

        item.innerHTML = `
            <div class="lb-rank ${rankClass}">${index + 1}</div>
            <div class="lb-info">
                <div class="lb-name">${player.username}</div>
                <div class="lb-games">${player.gamesPlayed} ${t('games_suffix')}</div>
            </div>
            <div class="lb-pts">${player.totalPoints}</div>
        `;

        list.appendChild(item);
    });
}

// ═══════════════════════════════════════════
//   ТАЙМЕР
// ═══════════════════════════════════════════

let timerInterval;

function startTimer(seconds) {
    clearInterval(timerInterval);
    let remaining = seconds;

    const timerEl = document.getElementById('timer');
    if (!timerEl) return;

    timerEl.textContent = remaining;
    timerEl.classList.remove('warning');

    timerInterval = setInterval(() => {
        remaining--;
        timerEl.textContent = remaining;

        if (remaining <= 10) {
            timerEl.classList.add('warning');
        }

        if (remaining <= 0) {
            clearInterval(timerInterval);
        }
    }, 1000);
}

// ═══════════════════════════════════════════
//   ФАН-СООБЩЕНИЯ
// ═══════════════════════════════════════════

function showFunMessage(text) {
    const el = document.getElementById('funMessage');
    el.textContent = text;
    el.style.display = 'block';
    el.style.animation = 'none';
    el.offsetHeight; // force reflow
    el.style.animation = 'funPop 1.8s ease forwards';

    setTimeout(() => {
        el.style.display = 'none';
    }, 1800);
}


// ═══════════════════════════════════════════
//   ОНЛАЙН-СТАТИСТИКА
// ═══════════════════════════════════════════

function handleOnlineStats(data) {
    lastOnlineStats = data;
    const el = document.getElementById('statText');
    if (!el) return;

    const parts = [];
    if (data.online > 0) parts.push('\u{1F7E2} ' + data.online + ' ' + t('online_suffix'));
    if (data.playing > 0) parts.push('\u{1F3AE} ' + data.playing + ' ' + t('games_online_suffix'));
    if (data.inLobby > 0) parts.push('\u{23F3} ' + data.inLobby + ' ' + t('waiting_suffix'));

    el.textContent = parts.length > 0 ? parts.join('  ') : t('waiting_players');
}

// ═══════════════════════════════════════════
//   ПОДЕЛИТЬСЯ КОМНАТОЙ
// ═══════════════════════════════════════════

function buildRoomShareData() {
    if (!currentRoom || !currentUser?.id) return null;

    const refLink = 'https://t.me/GGamemesbot?start=room_' + currentRoom + '_ref_' + currentUser.id;
    const shortText = t('share_short', { room: currentRoom });
    const text = shortText + '\n' + refLink;

    return { refLink, shortText, text };
}

function openExternalShareLink(url) {
    try {
        if (tg && typeof tg.openLink === 'function') {
            tg.openLink(url);
            return true;
        }
    } catch (e) {
        console.log('[SHARE] openLink error', e.message);
    }

    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    return !!popup;
}

function copyShareText(text, refLink) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        return navigator.clipboard.writeText(text).then(() => true).catch(() => {
            showFunMessage(t('share_link_label', { link: refLink }));
            return false;
        });
    }

    prompt(t('share_copy_prompt'), refLink);
    return Promise.resolve(false);
}

function shareRoom() {
    const data = buildRoomShareData();
    if (!data) return;

    if (tg && typeof tg.openTelegramLink === 'function') {
        tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(data.refLink) + '&text=' + encodeURIComponent(data.shortText));
        return;
    }

    if (navigator.share) {
        navigator.share({ title: t('title'), text: data.text, url: data.refLink }).catch(() => {});
        return;
    }

    copyShareText(data.text, data.refLink).then((copied) => {
        if (copied) showFunMessage(t('link_copied'));
    });
}

function shareRoomTelegram() {
    const data = buildRoomShareData();
    if (!data) return;

    const tgShareUrl = 'https://t.me/share/url?url=' + encodeURIComponent(data.refLink) + '&text=' + encodeURIComponent(data.shortText);
    if (tg && typeof tg.openTelegramLink === 'function') {
        tg.openTelegramLink(tgShareUrl);
        return;
    }

    openExternalShareLink(tgShareUrl);
}

function shareRoomX() {
    const data = buildRoomShareData();
    if (!data) return;

    const xText = t('share_x_text', { room: currentRoom });
    const xShareUrl = 'https://x.com/intent/tweet?text=' + encodeURIComponent(xText) + '&url=' + encodeURIComponent(data.refLink);
    if (!openExternalShareLink(xShareUrl)) {
        copyShareText(data.text, data.refLink);
    }
}

async function shareRoomDiscord() {
    const data = buildRoomShareData();
    if (!data) return;

    const copied = await copyShareText(data.text, data.refLink);
    const opened = openExternalShareLink('https://discord.com/channels/@me');
    if (copied && opened) {
        showFunMessage(t('share_discord_hint'));
    } else if (copied) {
        showFunMessage(t('link_copied'));
    }
}


async function loadReferralStats() {
    try {
        const resp = await fetch('/api/referral/stats?userId=' + encodeURIComponent(currentUser.id));
        const data = await resp.json();
        if (!data || !data.ok) return;

        const elL1 = document.getElementById('refL1');
        const elL2 = document.getElementById('refL2');
        const elL3 = document.getElementById('refL3');
        const elA1 = document.getElementById('refA1');
        const elA2 = document.getElementById('refA2');
        const elA3 = document.getElementById('refA3');
        const elIncome = document.getElementById('refIncome');
        const elIncome1 = document.getElementById('refIncome1');
        const elIncome2 = document.getElementById('refIncome2');
        const elIncome3 = document.getElementById('refIncome3');

        if (elL1) elL1.textContent = data.stats.level1 || 0;
        if (elL2) elL2.textContent = data.stats.level2 || 0;
        if (elL3) elL3.textContent = data.stats.level3 || 0;
        if (elA1) elA1.textContent = data.stats.active1 || 0;
        if (elA2) elA2.textContent = data.stats.active2 || 0;
        if (elA3) elA3.textContent = data.stats.active3 || 0;
        if (elIncome) elIncome.textContent = data.income.total || 0;
        if (elIncome1) elIncome1.textContent = data.income.level1 || 0;
        if (elIncome2) elIncome2.textContent = data.income.level2 || 0;
        if (elIncome3) elIncome3.textContent = data.income.level3 || 0;

        renderReferralChart(data.chart || []);
    } catch(e) {
        console.log('[REFERRAL] stats error', e.message);
    }
}


function renderReferralChart(chart) {
    const el = document.getElementById('refChart');
    if (!el) return;
    if (!chart || chart.length === 0) {
        el.innerHTML = '<div class="ref-bar zero" style="height:10%"></div>'.repeat(7);
        return;
    }
    const maxVal = Math.max(...chart.map(c => c.value || 0), 1);
    el.innerHTML = '';
    chart.forEach(point => {
        const h = Math.max(6, Math.round((point.value || 0) / maxVal * 100));
        const bar = document.createElement('div');
        bar.className = 'ref-bar' + ((point.value || 0) === 0 ? ' zero' : '');
        bar.style.height = h + '%';
        bar.title = point.day + ': ' + (point.value || 0);
        el.appendChild(bar);
    });
}

// ═══════════════════════════════════════════
//   РЕФЕРАЛЬНАЯ СИСТЕМА
// ═══════════════════════════════════════════

async function registerReferral(userId, referrerId) {
    try {
        await fetch('/api/referral/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, referrerId, deviceId: getDeviceId() })
        });
        console.log('[REFERRAL] Registered:', { userId, referrerId });
    } catch (e) {
        console.error('[REFERRAL] Error:', e);
    }
}

// Универсальная функция: показывает фразу НАД кнопкой
window.showFunnyHint = function(element, type) {
    // Удаляем старые подсказки
    document.querySelectorAll('.funny-hint-popup').forEach(h => h.remove());

    // Выбираем фразы в зависимости от типа
    let phrases = (type === 'adult') ? tList('adult_phrases') : tList('upload_phrases');
    if (phrases.length === 0) return;
    const text = phrases[Math.floor(Math.random() * phrases.length)];

    // Создаём элемент подсказки
    const hint = document.createElement('div');
    hint.className = 'funny-hint-popup';
    hint.textContent = text;
    
    // Стили: НАД кнопкой, по центру, оранжевый текст на тёмной подложке
    hint.style.position = 'absolute';
    hint.style.bottom = '100%';      // Над элементом
    hint.style.left = '50%';         // По центру
    hint.style.transform = 'translateX(-50%)';
    hint.style.marginBottom = '10px'; // Отступ сверху
    hint.style.whiteSpace = 'nowrap';
    hint.style.color = '#F5A623';    // Оранжевый цвет
    hint.style.fontSize = '0.9rem';
    hint.style.fontWeight = '600';
    hint.style.pointerEvents = 'none';
    hint.style.zIndex = '1000';
    hint.style.opacity = '0';
    hint.style.transition = 'opacity 0.3s ease';
    hint.style.background = 'rgba(0,0,0,0.8)'; // Тёмная подложка
    hint.style.padding = '6px 12px';
    hint.style.borderRadius = '8px';

    // Родитель должен быть relative
    const parent = element.parentElement || element;
    if (getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
    }
    
    parent.appendChild(hint);

    // Появление
    requestAnimationFrame(() => { hint.style.opacity = '1'; });

    // Исчезновение через 2.5 секунды
    setTimeout(() => {
        hint.style.opacity = '0';
        setTimeout(() => { if(hint.parentNode) hint.parentNode.removeChild(hint); }, 300);
    }, 2500);
};

// Обёртки для удобства вызова из HTML
window.showAdultHint = function(el) { showFunnyHint(el, 'adult'); };
window.showUploadHint = function(el) { showFunnyHint(el, 'upload'); };
