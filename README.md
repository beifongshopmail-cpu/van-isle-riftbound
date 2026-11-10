# RAVI (van-isle-riftbound)

RAVI, Rift App Van Isle: a free community web app for the Riftbound TCG scene on Vancouver Island. Live at https://ravi.tools, installed to the phone's Home Screen (a browser tab shows only the install screen).

- Pages: zero-dependency static HTML on GitHub Pages, one folder per page (calendar/, counter/, trade/, board/, decks/, collection/, tier/, cut/, news/, rules/, start/, feedback/, settings/), the hub at the root. The page list is RAVI_PAGES in pages.js; the shared look is app.css.
- Data: Node fetchers on GitHub Actions cron write data/ (events from PlayRiftbound, prices from tcgcsv.com, Riot's rules and news, TopDeck.gg results for the Tier list) and the ICS feeds.
- Server: server/live (a Cloudflare Worker, wrangler.toml; accounts, public decks, the Exchange and offers, alerts, live event data), deployed by .github/workflows/server.yml.
- Design rules: STYLE.md and style/<page>.md. Rules for Claude sessions: CLAUDE.md. Tests live in a separate private repo (rb-tools).

Store-neutral: it covers every store's events. Sign-ups happen on PlayRiftbound.
