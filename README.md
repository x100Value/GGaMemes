# GGaMemes

GGaMemes is a real-time Telegram Mini App party game where players match GIFs to text situations and vote for the funniest submission.

## Tech stack

- Node.js + Express
- Socket.IO
- Telegram Mini App frontend (HTML/CSS/JS)
- Python bot (Aiogram)

## Repo scope

This repository contains application code only.

- Included: server, bot, frontend, situations.
- Not included: production secrets, logs, backups, user uploads, meme media library.

## Environment

1. Copy `.env.example` to `.env`.
2. Fill required variables.
3. Optional: copy `config.example.json` to `config.json` for local defaults.

## Run

```bash
npm install
npm run start
```

Bot process (separately):

```bash
python bot.py
```

## Notes

- `public/memes` is intentionally excluded from git because of size/content ownership.
- Never commit `.env`, `config.json`, or private keys.
