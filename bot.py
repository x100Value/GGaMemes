import logging
import asyncio
import aiohttp
from aiogram import Bot, Dispatcher, types
from aiogram.utils import executor
from aiohttp import web
import json
import os
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse
from aiogram.types import (
    InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo,
    LabeledPrice, ContentType
)

# ═══════════════════════════════════════════
#   КОНФИГ
# ═══════════════════════════════════════════

def load_env_file(path):
    if not os.path.exists(path):
        return
    try:
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                k, v = line.split('=', 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k and k not in os.environ:
                    os.environ[k] = v
    except Exception:
        pass

load_env_file(os.path.join(os.path.dirname(__file__), '.env'))

API_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '').strip()
WEB_APP_URL = os.getenv('WEB_APP_URL', 'https://ggamemes.ru').strip()
ADMIN_ID = int(os.getenv('ADMIN_ID', '0'))
ADMIN_TOKEN = os.getenv('ADMIN_TOKEN', '').strip()
NODE_API = os.getenv('NODE_API', 'http://localhost:3000').strip()

if not API_TOKEN:
    raise RuntimeError('TELEGRAM_BOT_TOKEN is not set')

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s [%(name)s] %(message)s')
logger = logging.getLogger('GGBOT')

bot = Bot(token=API_TOKEN)
dp = Dispatcher(bot)

# ═══════════════════════════════════════════
#   БУФЕР ПРЕДЛОЖЕНИЙ (в памяти)
# ═══════════════════════════════════════════

# { user_id: { type, text, category, file_id, timestamp } }
pending_suggestions = {}

TEXTS = {
    'en': {
        'btn_play': '🎲 PLAY',
        'btn_suggest': '💡 Suggest meme/situation',
        'btn_support': '❤️ Support project',
        'btn_back': '🔙 Back',
        'btn_suggest_meme': '🖼 Meme (GIF) — 50⭐',
        'btn_suggest_situation': '✏️ Situation — 10⭐',
        'btn_cat_general': '🌍 General',
        'btn_cat_friends': '👫 Friends',
        'btn_cat_study': '📚 Study',
        'btn_cat_work': '💼 Work',
        'start_room': (
            "🎲 <b>GGamemes — What's the Meme?</b>\n\n"
            "You were invited to room <b>{room_id}</b>!\n"
            "Tap the button to join 👇"
        ),
        'start_ref': (
            "🎲 <b>GGamemes — What's the Meme?</b>\n\n"
            "Your friend invited you to a meme battle!\n"
            "Pick the best meme for each situation and vote for winners 🏆\n\n"
            "Tap the button and let's go 👇"
        ),
        'start_default': (
            "🎲 <b>GGamemes — What's the Meme?</b>\n\n"
            "Real-time meme card game!\n\n"
            "🃏 Get 5 meme cards\n"
            "😂 Pick the best one for the situation\n"
            "🗳 Vote for others\n"
            "🏆 Become the meme lord!\n\n"
            "Tap the button and let's go 👇"
        ),
        'back_main': (
            "🎲 <b>GGamemes — What's the Meme?</b>\n\n"
            "Tap the button and let's go 👇"
        ),
        'suggest_menu': (
            "💡 <b>Suggest content</b>\n\n"
            "Your meme or situation can be added to the game after moderation!{cost_text}"
        ),
        'admin_free': "\n\n✅ <i>You are admin — free!</i>",
        'suggest_meme_prompt': (
            "🖼 <b>Suggest meme</b>\n\n"
            "Send a GIF animation to this chat.\n"
            "Only GIF is allowed (no images/videos).\n\n"
            "To cancel: /cancel"
        ),
        'suggest_situation_prompt': (
            "✏️ <b>Suggest situation</b>\n\n"
            "Send a situation text. Example:\n"
            "“When you reached checkout but forgot your wallet”\n\n"
            "❌ No emojis, greetings, or extra words\n"
            "✅ Just a clean phrase\n\n"
            "To cancel: /cancel"
        ),
        'cancelled': '❌ Cancelled.',
        'gif_too_big': '❌ File is too large (max 5MB). Try another one.',
        'text_too_short': (
            "❌ Too short. Minimum 10 characters.\n"
            "Example: “When you reached checkout but forgot your wallet”"
        ),
        'text_too_long': '❌ Too long. Maximum 100 characters.',
        'choose_category': "📝 Situation: <i>“{text}”</i>\n\nChoose a category:",
        'no_active_suggestion': 'No active suggestion',
        'invoice_title_meme': 'Suggest meme',
        'invoice_title_situation': 'Suggest situation',
        'invoice_desc': 'Your suggestion will be sent for moderation',
        'precheckout_expired': 'Suggestion expired. Please start again.',
        'payment_not_found': '⚠️ Suggestion not found. Start again via /start',
        'sent_to_moderation': '✅ Sent for moderation! Wait for review.',
        'approved_user': '🎉 <b>Your suggestion was approved and added to the game!</b>',
        'rejected_user': '❌ Your suggestion was rejected by a moderator.',
        'donate_menu': (
            "❤️ <b>Support the project</b>\n\n"
            "Thanks for helping GGamemes grow!\n"
            "Choose amount:"
        ),
        'donate_invoice_title': 'Support GGamemes',
        'donate_invoice_desc': 'Donation {amount} Stars ❤️',
        'donate_label': 'Donation',
        'admin_only': '⛔ Admin only',
        'approved_short': '✅ Approved',
        'rejected_short': '❌ Rejected',
        'start_bot': '🤖 GGamemes Bot is starting...'
    },
    'ru': {
        'btn_play': '🎲 ИГРАТЬ',
        'btn_suggest': '💡 Предложить мем/ситуацию',
        'btn_support': '❤️ Поддержать проект',
        'btn_back': '🔙 Назад',
        'btn_suggest_meme': '🖼 Мем (GIF) — 50⭐',
        'btn_suggest_situation': '✏️ Ситуация — 10⭐',
        'btn_cat_general': '🌍 Общие',
        'btn_cat_friends': '👫 Друзья',
        'btn_cat_study': '📚 Учёба',
        'btn_cat_work': '💼 Работа',
        'start_room': (
            "🎲 <b>GGamemes — Что за мем?</b>\n\n"
            "Тебя позвали за стол <b>{room_id}</b>!\n"
            "Жми кнопку — залетай 👇"
        ),
        'start_ref': (
            "🎲 <b>GGamemes — Что за мем?</b>\n\n"
            "Друг позвал тебя в мемную битву!\n"
            "Подбирай мемы под ситуации, голосуй за лучшие 🏆\n\n"
            "Жми кнопку — погнали 👇"
        ),
        'start_default': (
            "🎲 <b>GGamemes — Что за мем?</b>\n\n"
            "Карточная игра с мемами в реальном времени!\n\n"
            "🃏 Получи 5 мемов на руки\n"
            "😂 Подбери лучший под ситуацию\n"
            "🗳 Голосуй за чужие мемы\n"
            "🏆 Стань мемлордом!\n\n"
            "Жми кнопку — погнали 👇"
        ),
        'back_main': (
            "🎲 <b>GGamemes — Что за мем?</b>\n\n"
            "Жми кнопку — погнали 👇"
        ),
        'suggest_menu': (
            "💡 <b>Предложить контент</b>\n\n"
            "Твой мем или ситуация попадёт в игру после модерации!{cost_text}"
        ),
        'admin_free': "\n\n✅ <i>Ты админ — бесплатно!</i>",
        'suggest_meme_prompt': (
            "🖼 <b>Предложить мем</b>\n\n"
            "Отправь GIF-файл (анимацию) прямо в этот чат.\n"
            "Строго GIF, без картинок и видео.\n\n"
            "Для отмены: /cancel"
        ),
        'suggest_situation_prompt': (
            "✏️ <b>Предложить ситуацию</b>\n\n"
            "Отправь текст ситуации. Формат:\n"
            "«Когда подошёл к кассе, но забыл деньги»\n\n"
            "❌ Без смайлов, приветствий и лишних слов\n"
            "✅ Просто чистая фраза\n\n"
            "Для отмены: /cancel"
        ),
        'cancelled': '❌ Отменено.',
        'gif_too_big': '❌ Файл слишком большой (макс 5МБ). Попробуй другой.',
        'text_too_short': (
            "❌ Слишком коротко. Минимум 10 символов.\n"
            "Пример: «Когда подошёл к кассе, но забыл деньги»"
        ),
        'text_too_long': '❌ Слишком длинно. Максимум 100 символов.',
        'choose_category': "📝 Ситуация: <i>«{text}»</i>\n\nВыбери категорию:",
        'no_active_suggestion': 'Нет активного предложения',
        'invoice_title_meme': 'Предложить мем',
        'invoice_title_situation': 'Предложить ситуацию',
        'invoice_desc': 'Твоё предложение будет отправлено на модерацию',
        'precheckout_expired': 'Предложение устарело. Начни заново.',
        'payment_not_found': '⚠️ Предложение не найдено. Начни заново через /start',
        'sent_to_moderation': '✅ Отправлено на модерацию! Жди ответа.',
        'approved_user': '🎉 <b>Твоё предложение одобрено и добавлено в игру!</b>',
        'rejected_user': '❌ К сожалению, предложение отклонено модератором.',
        'donate_menu': (
            "❤️ <b>Поддержать проект</b>\n\n"
            "Спасибо, что помогаешь GGamemes развиваться!\n"
            "Выбери сумму:"
        ),
        'donate_invoice_title': 'Поддержать GGamemes',
        'donate_invoice_desc': 'Донат {amount} Stars ❤️',
        'donate_label': 'Донат',
        'admin_only': '⛔ Только для админа',
        'approved_short': '✅ Одобрено',
        'rejected_short': '❌ Отклонено',
        'start_bot': '🤖 GGamemes Bot запускается...'
    }
}


def normalize_lang(lang_code: str) -> str:
    code = (lang_code or '').lower()
    return 'ru' if code.startswith('ru') else 'en'


def user_lang(user: types.User) -> str:
    return normalize_lang(getattr(user, 'language_code', None))


def tr(lang: str, key: str, **kwargs) -> str:
    base = TEXTS.get(lang, TEXTS['en'])
    template = base.get(key, TEXTS['en'].get(key, key))
    return template.format(**kwargs)


def build_webapp_url(lang: str, args: str = '') -> str:
    parsed = urlparse(WEB_APP_URL)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query['lang'] = normalize_lang(lang)
    if args:
        query['p'] = args
    else:
        query.pop('p', None)
    return urlunparse(parsed._replace(query=urlencode(query)))


def main_menu_markup(lang: str, args: str = '') -> InlineKeyboardMarkup:
    markup = InlineKeyboardMarkup(row_width=1)
    markup.add(
        InlineKeyboardButton(tr(lang, 'btn_play'), web_app=WebAppInfo(url=build_webapp_url(lang, args))),
        InlineKeyboardButton(tr(lang, 'btn_suggest'), callback_data='suggest_start'),
        InlineKeyboardButton(tr(lang, 'btn_support'), callback_data='donate_start')
    )
    return markup

# ═══════════════════════════════════════════
#   /start
# ═══════════════════════════════════════════

@dp.message_handler(commands=['start'])
async def send_welcome(message: types.Message):
    args = message.get_args()
    logger.info(f"[START] user={message.from_user.id} args='{args}'")
    lang = user_lang(message.from_user)
    markup = main_menu_markup(lang, args)

    if args and 'room_' in args:
        room_id = args.split('room_')[1].split('_')[0]
        text = tr(lang, 'start_room', room_id=room_id)
    elif args and 'ref_' in args:
        text = tr(lang, 'start_ref')
    else:
        text = tr(lang, 'start_default')

    await message.answer(text, reply_markup=markup, parse_mode='HTML')
    logger.info(f"[START] sent welcome to {message.from_user.id}")

# ═══════════════════════════════════════════
#   ПРЕДЛОЖЕНИЯ: Начало
# ═══════════════════════════════════════════

@dp.callback_query_handler(lambda c: c.data == 'suggest_start')
async def suggest_start(callback: types.CallbackQuery):
    uid = callback.from_user.id
    lang = user_lang(callback.from_user)
    logger.info(f"[SUGGEST] start from user={uid}")

    markup = InlineKeyboardMarkup(row_width=1)
    markup.add(
        InlineKeyboardButton(tr(lang, 'btn_suggest_meme'), callback_data='suggest_meme'),
        InlineKeyboardButton(tr(lang, 'btn_suggest_situation'), callback_data='suggest_situation'),
        InlineKeyboardButton(tr(lang, 'btn_back'), callback_data='back_main')
    )

    cost_text = ""
    if uid == ADMIN_ID:
        cost_text = tr(lang, 'admin_free')

    await callback.message.edit_text(
        tr(lang, 'suggest_menu', cost_text=cost_text),
        reply_markup=markup, parse_mode='HTML'
    )
    await callback.answer()

@dp.callback_query_handler(lambda c: c.data == 'back_main')
async def back_main(callback: types.CallbackQuery):
    lang = user_lang(callback.from_user)
    markup = main_menu_markup(lang)
    await callback.message.edit_text(
        tr(lang, 'back_main'),
        reply_markup=markup, parse_mode='HTML'
    )
    await callback.answer()

# ═══════════════════════════════════════════
#   ПРЕДЛОЖЕНИЕ МЕМА
# ═══════════════════════════════════════════

@dp.callback_query_handler(lambda c: c.data == 'suggest_meme')
async def suggest_meme(callback: types.CallbackQuery):
    uid = callback.from_user.id
    lang = user_lang(callback.from_user)
    logger.info(f"[SUGGEST] meme chosen by user={uid}")
    pending_suggestions[uid] = {'type': 'meme', 'step': 'waiting_gif', 'lang': lang}

    await callback.message.edit_text(
        tr(lang, 'suggest_meme_prompt'),
        parse_mode='HTML'
    )
    await callback.answer()

# ═══════════════════════════════════════════
#   ПРЕДЛОЖЕНИЕ СИТУАЦИИ
# ═══════════════════════════════════════════

@dp.callback_query_handler(lambda c: c.data == 'suggest_situation')
async def suggest_situation(callback: types.CallbackQuery):
    uid = callback.from_user.id
    lang = user_lang(callback.from_user)
    logger.info(f"[SUGGEST] situation chosen by user={uid}")
    pending_suggestions[uid] = {'type': 'situation', 'step': 'waiting_text', 'lang': lang}

    await callback.message.edit_text(
        tr(lang, 'suggest_situation_prompt'),
        parse_mode='HTML'
    )
    await callback.answer()

# ═══════════════════════════════════════════
#   ПРИЁМ КОНТЕНТА
# ═══════════════════════════════════════════

@dp.message_handler(commands=['cancel'])
async def cancel_suggest(message: types.Message):
    uid = message.from_user.id
    lang = user_lang(message.from_user)
    if uid in pending_suggestions:
        del pending_suggestions[uid]
        logger.info(f"[SUGGEST] cancelled by user={uid}")
    await message.answer(tr(lang, 'cancelled'), parse_mode='HTML')

# Приём GIF
@dp.message_handler(content_types=[ContentType.ANIMATION])
async def receive_gif(message: types.Message):
    uid = message.from_user.id
    if uid not in pending_suggestions or pending_suggestions[uid].get('step') != 'waiting_gif':
        return
    lang = pending_suggestions[uid].get('lang') or user_lang(message.from_user)

    anim = message.animation
    logger.info(f"[SUGGEST] GIF received from user={uid}, file_id={anim.file_id}, size={anim.file_size}")

    if anim.file_size and anim.file_size > 5 * 1024 * 1024:
        await message.answer(tr(lang, 'gif_too_big'))
        return

    pending_suggestions[uid]['file_id'] = anim.file_id
    pending_suggestions[uid]['step'] = 'waiting_payment'

    # Админ — бесплатно
    if uid == ADMIN_ID:
        logger.info(f"[SUGGEST] ADMIN free pass, skipping payment")
        await process_approved_suggestion(uid, message)
        return

    # Выставить счёт
    await send_stars_invoice(message, uid, 'meme', 50)

# Приём текста (ситуация)
@dp.message_handler(content_types=[ContentType.TEXT])
async def receive_text(message: types.Message):
    uid = message.from_user.id

    if uid not in pending_suggestions or pending_suggestions[uid].get('step') != 'waiting_text':
        # Обычное сообщение — игнор
        return
    lang = pending_suggestions[uid].get('lang') or user_lang(message.from_user)

    text = message.text.strip()

    # Валидация
    import re
    # Убираем смайлы в начале/конце
    text = re.sub(r'^[\U0001F600-\U0001F9FF\U00002600-\U000027BF\U0001F300-\U0001F5FF]+', '', text).strip()
    text = re.sub(r'[\U0001F600-\U0001F9FF\U00002600-\U000027BF\U0001F300-\U0001F5FF]+$', '', text).strip()

    # Убираем приветствия
    greetings = ['привет', 'здравствуй', 'добрый день', 'хай', 'хэй', 'hello', 'hi']
    lower = text.lower()
    for g in greetings:
        if lower.startswith(g):
            text = text[len(g):].lstrip(',').lstrip('!').strip()

    if len(text) < 10:
        await message.answer(tr(lang, 'text_too_short'))
        return

    if len(text) > 100:
        await message.answer(tr(lang, 'text_too_long'))
        return

    logger.info(f"[SUGGEST] text received from user={uid}: '{text}'")

    pending_suggestions[uid]['text'] = text
    pending_suggestions[uid]['step'] = 'waiting_category'

    markup = InlineKeyboardMarkup(row_width=2)
    markup.add(
        InlineKeyboardButton(tr(lang, 'btn_cat_general'), callback_data='cat_general'),
        InlineKeyboardButton(tr(lang, 'btn_cat_friends'), callback_data='cat_friends'),
        InlineKeyboardButton(tr(lang, 'btn_cat_study'), callback_data='cat_study'),
        InlineKeyboardButton(tr(lang, 'btn_cat_work'), callback_data='cat_work'),
    )
    await message.answer(
        tr(lang, 'choose_category', text=text),
        reply_markup=markup,
        parse_mode='HTML'
    )

@dp.callback_query_handler(lambda c: c.data.startswith('cat_'))
async def choose_category(callback: types.CallbackQuery):
    uid = callback.from_user.id
    lang = user_lang(callback.from_user)
    if uid not in pending_suggestions or pending_suggestions[uid].get('step') != 'waiting_category':
        await callback.answer(tr(lang, 'no_active_suggestion'))
        return
    pending_suggestions[uid].setdefault('lang', lang)

    cat = callback.data.replace('cat_', '')
    pending_suggestions[uid]['category'] = cat
    pending_suggestions[uid]['step'] = 'waiting_payment'

    logger.info(f"[SUGGEST] category={cat} from user={uid}")

    # Админ — бесплатно
    if uid == ADMIN_ID:
        logger.info(f"[SUGGEST] ADMIN free pass, skipping payment")
        await process_approved_suggestion_cb(uid, callback)
        return

    await callback.answer()
    await send_stars_invoice(callback.message, uid, 'situation', 10)

# ═══════════════════════════════════════════
#   ОПЛАТА STARS
# ═══════════════════════════════════════════

async def send_stars_invoice(message, uid, stype, amount):
    logger.info(f"[PAYMENT] sending invoice to user={uid}, type={stype}, amount={amount}")
    lang = pending_suggestions.get(uid, {}).get('lang') or user_lang(message.from_user)

    title = tr(lang, 'invoice_title_meme' if stype == 'meme' else 'invoice_title_situation')
    desc = tr(lang, 'invoice_desc')

    await bot.send_invoice(
        chat_id=uid,
        title=title,
        description=desc,
        payload=f"suggest_{stype}_{uid}",
        provider_token="",
        currency="XTR",
        prices=[LabeledPrice(label=title, amount=amount)],
        start_parameter=f"suggest_{stype}"
    )
    logger.info(f"[PAYMENT] invoice sent to user={uid}")

    # Таймаут 120 сек
    asyncio.ensure_future(payment_timeout(uid, 120))

async def payment_timeout(uid, seconds):
    await asyncio.sleep(seconds)
    if uid in pending_suggestions and pending_suggestions[uid].get('step') == 'waiting_payment':
        logger.info(f"[PAYMENT] timeout for user={uid}, cleaning up")
        del pending_suggestions[uid]

@dp.pre_checkout_query_handler()
async def process_pre_checkout(query: types.PreCheckoutQuery):
    uid = query.from_user.id
    lang = user_lang(query.from_user)
    logger.info(f"[PAYMENT] pre_checkout from user={uid}, payload={query.invoice_payload}")

    if uid not in pending_suggestions:
        await bot.answer_pre_checkout_query(query.id, ok=False, error_message=tr(lang, 'precheckout_expired'))
        return

    await bot.answer_pre_checkout_query(query.id, ok=True)
    logger.info(f"[PAYMENT] pre_checkout OK for user={uid}")

@dp.message_handler(content_types=[ContentType.SUCCESSFUL_PAYMENT])
async def process_payment(message: types.Message):
    uid = message.from_user.id
    lang = user_lang(message.from_user)
    amount = message.successful_payment.total_amount
    logger.info(f"[PAYMENT] SUCCESS from user={uid}, amount={amount} XTR")

    if uid not in pending_suggestions:
        await message.answer(tr(lang, 'payment_not_found'))
        return

    await process_approved_suggestion(uid, message)

# ═══════════════════════════════════════════
#   ОТПРАВКА АДМИНУ НА МОДЕРАЦИЮ
# ═══════════════════════════════════════════

async def process_approved_suggestion(uid, message):
    data = pending_suggestions.get(uid)
    if not data:
        return
    lang = data.get('lang') or user_lang(message.from_user)
    data['lang'] = lang

    username = message.from_user.username or message.from_user.first_name or 'Anonymous'
    data['username'] = username

    logger.info(f"[MODERATE] sending to admin, type={data['type']}, user={uid}")

    markup = InlineKeyboardMarkup(row_width=2)
    markup.add(
        InlineKeyboardButton("✅ Принять", callback_data=f"mod_approve_{uid}"),
        InlineKeyboardButton("❌ Отклонить", callback_data=f"mod_reject_{uid}")
    )

    if data['type'] == 'meme':
        await bot.send_animation(
            ADMIN_ID,
            data['file_id'],
            caption=f"🖼 <b>Новый мем</b>\n\nОт: @{username} (ID: {uid})\n\n⬇️ Модерация:",
            reply_markup=markup,
            parse_mode='HTML'
        )
    else:
        cat_names = {'general': '🌍 Общие', 'friends': '👫 Друзья', 'study': '📚 Учёба', 'work': '💼 Работа'}
        cat_label = cat_names.get(data.get('category', 'general'), data.get('category', 'general'))
        await bot.send_message(
            ADMIN_ID,
            f"✏️ <b>Новая ситуация</b>\n\n"
            f"«{data['text']}»\n\n"
            f"Категория: {cat_label}\n"
            f"От: @{username} (ID: {uid})\n\n"
            f"⬇️ Модерация:",
            reply_markup=markup,
            parse_mode='HTML'
        )

    await message.answer(tr(lang, 'sent_to_moderation'))
    logger.info(f"[MODERATE] sent to admin for user={uid}")

async def process_approved_suggestion_cb(uid, callback):
    """Для случая когда вызов из callback (категория)"""
    data = pending_suggestions.get(uid)
    if not data:
        return
    lang = data.get('lang') or user_lang(callback.from_user)
    data['lang'] = lang

    username = callback.from_user.username or callback.from_user.first_name or 'Anonymous'
    data['username'] = username

    logger.info(f"[MODERATE] sending to admin (cb), type={data['type']}, user={uid}")

    markup = InlineKeyboardMarkup(row_width=2)
    markup.add(
        InlineKeyboardButton("✅ Принять", callback_data=f"mod_approve_{uid}"),
        InlineKeyboardButton("❌ Отклонить", callback_data=f"mod_reject_{uid}")
    )

    cat_names = {'general': '🌍 Общие', 'friends': '👫 Друзья', 'study': '📚 Учёба', 'work': '💼 Работа'}
    cat_label = cat_names.get(data.get('category', 'general'), data.get('category', 'general'))

    await bot.send_message(
        ADMIN_ID,
        f"✏️ <b>Новая ситуация</b>\n\n"
        f"«{data['text']}»\n\n"
        f"Категория: {cat_label}\n"
        f"От: @{username} (ID: {uid})\n\n"
        f"⬇️ Модерация:",
        reply_markup=markup,
        parse_mode='HTML'
    )

    await callback.message.answer(tr(lang, 'sent_to_moderation'))
    await callback.answer()
    logger.info(f"[MODERATE] sent to admin for user={uid}")

# ═══════════════════════════════════════════
#   МОДЕРАЦИЯ: Принять / Отклонить
# ═══════════════════════════════════════════

@dp.callback_query_handler(lambda c: c.data.startswith('mod_approve_'))
async def mod_approve(callback: types.CallbackQuery):
    uid = int(callback.data.replace('mod_approve_', ''))
    admin_lang = user_lang(callback.from_user)
    logger.info(f"[MODERATE] APPROVE for user={uid}")

    data = pending_suggestions.get(uid)
    if not data:
        await callback.answer(tr(admin_lang, 'no_active_suggestion'))
        await callback.message.edit_reply_markup()
        return

    # Отправляем в Node.js API
    try:
        payload = {
            'type': data['type'],
            'userId': str(uid),
            'username': data.get('username', 'Anonymous'),
            'category': data.get('category', 'general')
        }

        if data['type'] == 'situation':
            payload['text'] = data['text']
        elif data['type'] == 'meme':
            # Получаем URL файла от Telegram
            file_info = await bot.get_file(data['file_id'])
            file_url = f"https://api.telegram.org/file/bot{API_TOKEN}/{file_info.file_path}"
            payload['fileUrl'] = file_url

        async with aiohttp.ClientSession() as session:
            headers = {'X-Admin-Token': ADMIN_TOKEN, 'Content-Type': 'application/json'}
            async with session.post(f"{NODE_API}/api/admin/add-content", json=payload, headers=headers) as resp:
                result = await resp.json()
                logger.info(f"[MODERATE] API response: {result}")

        if result.get('ok'):
            await callback.message.edit_caption(
                callback.message.caption + "\n\n✅ <b>ОДОБРЕНО</b>" if callback.message.caption
                else callback.message.text + "\n\n✅ <b>ОДОБРЕНО</b>",
                parse_mode='HTML'
            ) if callback.message.caption else await callback.message.edit_text(
                callback.message.text + "\n\n✅ <b>ОДОБРЕНО</b>",
                parse_mode='HTML'
            )
            # Уведомить юзера
            try:
                user_lang_code = data.get('lang', 'en')
                await bot.send_message(uid, tr(user_lang_code, 'approved_user'), parse_mode='HTML')
            except:
                pass
        else:
            await callback.answer(f"Ошибка API: {result.get('error', '?')}")

    except Exception as e:
        logger.error(f"[MODERATE] approve error: {e}")
        await callback.answer(f"Ошибка: {e}")

    if uid in pending_suggestions:
        del pending_suggestions[uid]
    await callback.answer(tr(admin_lang, 'approved_short'))

@dp.callback_query_handler(lambda c: c.data.startswith('mod_reject_'))
async def mod_reject(callback: types.CallbackQuery):
    uid = int(callback.data.replace('mod_reject_', ''))
    admin_lang = user_lang(callback.from_user)
    logger.info(f"[MODERATE] REJECT for user={uid}")

    if callback.message.caption:
        await callback.message.edit_caption(
            callback.message.caption + "\n\n❌ <b>ОТКЛОНЕНО</b>",
            parse_mode='HTML'
        )
    else:
        await callback.message.edit_text(
            callback.message.text + "\n\n❌ <b>ОТКЛОНЕНО</b>",
            parse_mode='HTML'
        )

    # Уведомить юзера
    try:
        user_data = pending_suggestions.get(uid, {})
        user_lang_code = user_data.get('lang', 'en')
        await bot.send_message(uid, tr(user_lang_code, 'rejected_user'), parse_mode='HTML')
    except:
        pass

    if uid in pending_suggestions:
        del pending_suggestions[uid]
    await callback.answer(tr(admin_lang, 'rejected_short'))

# ═══════════════════════════════════════════
#   ДОНАТ
# ═══════════════════════════════════════════

@dp.callback_query_handler(lambda c: c.data == 'donate_start')
async def donate_start(callback: types.CallbackQuery):
    lang = user_lang(callback.from_user)
    logger.info(f"[DONATE] start from user={callback.from_user.id}")
    markup = InlineKeyboardMarkup(row_width=2)
    markup.add(
        InlineKeyboardButton("⭐ 10", callback_data="donate_10"),
        InlineKeyboardButton("⭐ 50", callback_data="donate_50"),
        InlineKeyboardButton("⭐ 100", callback_data="donate_100"),
        InlineKeyboardButton("⭐ 500", callback_data="donate_500"),
        InlineKeyboardButton(tr(lang, 'btn_back'), callback_data="back_main")
    )
    await callback.message.edit_text(
        tr(lang, 'donate_menu'),
        reply_markup=markup, parse_mode='HTML'
    )
    await callback.answer()

@dp.callback_query_handler(lambda c: c.data.startswith('donate_'))
async def donate_send(callback: types.CallbackQuery):
    amount = int(callback.data.replace('donate_', ''))
    uid = callback.from_user.id
    lang = user_lang(callback.from_user)
    logger.info(f"[DONATE] user={uid} amount={amount}")

    await bot.send_invoice(
        chat_id=uid,
        title=tr(lang, 'donate_invoice_title'),
        description=tr(lang, 'donate_invoice_desc', amount=amount),
        payload=f"donate_{uid}_{amount}",
        provider_token="",
        currency="XTR",
        prices=[LabeledPrice(label=tr(lang, 'donate_label'), amount=amount)]
    )
    await callback.answer()


# ═══════════════════════════════════════════
#   АДМИН СТАТИСТИКА
# ═══════════════════════════════════════════

@dp.message_handler(commands=['admin_stats'])
async def admin_stats(message: types.Message):
    uid = message.from_user.id
    lang = user_lang(message.from_user)
    if uid != ADMIN_ID:
        await message.answer(tr(lang, 'admin_only'))
        return

    logger.info(f"[ADMIN] stats requested by {uid}")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{NODE_API}/api/admin-stats") as resp:
                data = await resp.json()

        text = (
            f"📊 <b>Статистика GGamemes</b>\n\n"
            f"🖼 <b>Мемы:</b>\n"
            f"  📦 Базовые: {data['baseMemes']}\n"
            f"  👥 Пользовательские: {data['userMemes']}\n"
            f"  📁 Всего: {data['totalMemes']}\n\n"
            f"✏️ <b>Ситуации:</b>\n"
            f"  📦 Базовые: {data['baseSits']}\n"
            f"  👥 Пользовательские: {data['userSits']}\n"
            f"  📁 Всего: {data['totalSits']}"
        )
        await message.answer(text, parse_mode='HTML')
    except Exception as e:
        logger.error(f"[ADMIN] stats error: {e}")
        await message.answer(f"❌ Ошибка: {e}")

# ═══════════════════════════════════════════
#   ЗАПУСК
# ═══════════════════════════════════════════

if __name__ == '__main__':
    logger.info(TEXTS['en']['start_bot'])
    
# ═══════════════════════════════════════════
#   МОДЕРАЦИЯ ЗАЯВОК (НОВОЕ)
# ═══════════════════════════════════════════

import os as _os
from aiohttp import web
import json as _json

pending_submissions = {}

async def send_to_moderation(submission):
    sub_id = submission['id']
    sub_type = submission['type']
    username = submission.get('username', 'unknown')
    user_id = submission.get('userId', 'unknown')
    
    pending_submissions[sub_id] = submission
    
    if sub_type == 'meme':
        text = f"🖼 <b>Новая заявка: МЕМ</b>\n\n👤 От: @{username} ({user_id})\n\nПроверь и реши:"
        markup = InlineKeyboardMarkup(row_width=2)
        markup.add(
            InlineKeyboardButton("✅ Принять", callback_data=f"sub_approve_{sub_id}"),
            InlineKeyboardButton("❌ Отклонить", callback_data=f"sub_reject_{sub_id}")
        )
        try:
            file_path = submission.get('file_path', '')
            if file_path and _os.path.exists(file_path):
                with open(file_path, 'rb') as f:
                    await bot.send_document(chat_id=ADMIN_ID, document=f, caption=text, reply_markup=markup, parse_mode='HTML')
            else:
                await bot.send_message(chat_id=ADMIN_ID, text=text + "\n⚠️ Файл не найден", reply_markup=markup, parse_mode='HTML')
        except Exception as e:
            logger.error(f"[MOD] Send error: {e}")
    
    elif sub_type == 'situation':
        text = f"📝 <b>Новая заявка: СИТУАЦИЯ</b>\n\n👤 От: @{username} ({user_id})\n📄 Текст:\n<code>{submission.get('text', '')[:500]}</code>"
        markup = InlineKeyboardMarkup(row_width=2)
        markup.add(
            InlineKeyboardButton("✅ Принять", callback_data=f"sub_approve_{sub_id}"),
            InlineKeyboardButton("❌ Отклонить", callback_data=f"sub_reject_{sub_id}")
        )
        await bot.send_message(chat_id=ADMIN_ID, text=text, reply_markup=markup, parse_mode='HTML')
    
    logger.info(f"[MOD] Sent to admin: {sub_id} | Type: {sub_type} | User: {username}")
    logger.debug(f"[MOD] Submission data: {submission}")

async def process_moderation(sub_id, action, callback):
    admin_lang = user_lang(callback.from_user)
    if sub_id not in pending_submissions:
        await callback.answer(tr(admin_lang, 'no_active_suggestion'), show_alert=True)
        return
    
    submission = pending_submissions[sub_id]
    user_id = submission.get('userId')
    sub_type = submission.get('type')
    submission_lang = normalize_lang(submission.get('lang'))
    
    try:
        async with aiohttp.ClientSession() as session:
            url = f"http://localhost:3000/api/admin/submission/{sub_id}/{action}"
            async with session.post(url) as resp:
                result = await resp.json()
                if result.get('ok'):
                    await callback.answer(
                        tr(admin_lang, 'approved_short') if action == 'approve' else tr(admin_lang, 'rejected_short'),
                        show_alert=True
                    )
                    await callback.message.delete()
                    if user_id:
                        try:
                            if action == 'approve':
                                txt = tr(submission_lang, 'approved_user')
                            else:
                                txt = tr(submission_lang, 'rejected_user')
                            await bot.send_message(chat_id=user_id, text=txt, parse_mode='HTML')
                        except: pass
                    del pending_submissions[sub_id]
                    logger.info(f"[MOD] Done: {sub_id}")
                else:
                    await callback.answer("❌ Server error", show_alert=True)
    except Exception as e:
        logger.error(f"[MOD] Error: {e}")
        await callback.answer(f"❌ {e}", show_alert=True)

@dp.callback_query_handler(lambda c: c.data.startswith('sub_approve_'))
async def handle_approve(callback: types.CallbackQuery):
    sub_id = callback.data.replace('sub_approve_', '')
    if callback.from_user.id != ADMIN_ID:
        await callback.answer(tr(user_lang(callback.from_user), 'admin_only'), show_alert=True)
        return
    await process_moderation(sub_id, 'approve', callback)

@dp.callback_query_handler(lambda c: c.data.startswith('sub_reject_'))
async def handle_reject(callback: types.CallbackQuery):
    sub_id = callback.data.replace('sub_reject_', '')
    if callback.from_user.id != ADMIN_ID:
        await callback.answer(tr(user_lang(callback.from_user), 'admin_only'), show_alert=True)
        return
    await process_moderation(sub_id, 'reject', callback)

async def handle_new_submission(request):
    logger.info("[WEB] Received new submission request")
    try:
        data = await request.json()
        submission = data.get('submission')
        if not isinstance(submission, dict):
            return web.json_response({'error': 'No submission'}, status=400)

        await send_to_moderation(submission)
        logger.info(f"[WEB] Submission queued: {submission.get('id')}")
        return web.json_response({'ok': True})
    except Exception as e:
        logger.error(f"[WEB] Error: {e}")
        return web.json_response({'error': str(e)}, status=500)

async def start_web_server():
    app = web.Application()
    app.router.add_post('/new-submission', handle_new_submission)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 3001)
    await site.start()
    logger.info("[WEB] Started on :3001")
    return runner

async def on_startup(_):
    await start_web_server()


executor.start_polling(dp, skip_updates=True, on_startup=on_startup)
