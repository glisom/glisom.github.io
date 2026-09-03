# Project media sources

No visual media was imported in Task 6. The launch records omit media rather than using placeholder art, fake screenshots, or generic stand-ins.

## Drift Dreams

- Current home: <https://getdriftdreams.com/>, inspected 2026-09-02. The page returned Vercel `404: NOT_FOUND`.
- Current privacy page: <https://getdriftdreams.com/privacy>, inspected 2026-09-02. The page also returned Vercel `404: NOT_FOUND`.
- Archived source: <https://web.archive.org/web/20260306231614/https://getdriftdreams.com/>, captured 2026-03-06 and inspected 2026-09-02. The archived title was `Drift - AI-Powered Dream Journal`; its visible page supplied the purpose, platforms, feature descriptions, and three-step flow used in the project record.
- Media decision: no imagery was imported. The current site is offline, the archived page imagery was broken, and its iOS and Android buttons used placeholder `#` destinations.

## ListWithMe App Store gallery

- Official App Store record: <https://apps.apple.com/us/app/listwithme/id1224284271>, inspected 2026-09-02 in the in-app browser. The page identified the app as `ListWithMe`, the developer as Grant Isom, and exposed four current iPhone screenshots.
- Official lookup endpoint: <https://itunes.apple.com/lookup?id=1224284271&country=us>, attempted 2026-09-02 in the same browser. The browser blocked the endpoint with `net::ERR_BLOCKED_BY_CLIENT`, so the implementation did not bypass that safety boundary or claim a lookup response it could not inspect.
- Storefront observation: Apple displayed the four current screens as Your Lists, Activity, Groceries, and New List on 2026-09-02. That storefront order is volatile. The local gallery deliberately uses the reviewed narrative order below and maps each screenshot to an accurate label and alt description: New List, Your Lists, Groceries, Activity.
- Rendition note: each exact Apple endpoint ends in `1320x2868bb.png`, but Apple served the source-capped untouched PNG at 1206 × 2622. The files below preserve those bytes exactly; they were not upscaled, resampled, or edited.

| Local asset                                                    | Gallery position | Exact Apple source                                                                                                                                                                            | Captured dimensions | SHA-256                                                            |
| -------------------------------------------------------------- | ---------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------: | ------------------------------------------------------------------ |
| `src/assets/projects/listwithme/screenshots/01-new-list.png`   |                1 | <https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/9e/aa/60/9eaa6008-a1d6-23d3-a59b-229f1a718209/Simulator_Screenshot_-_iPhone_17_Pro_-_2026-02-24_at_10.38.26.png/1320x2868bb.png> |         1206 × 2622 | `4d83839430033cb37537623fca0fe668a805301ce96c7ea16a97157a5e5e3ffc` |
| `src/assets/projects/listwithme/screenshots/02-your-lists.png` |                2 | <https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/df/9b/8c/df9b8c0c-ff5e-6522-2a96-05d6f21ec06e/Simulator_Screenshot_-_iPhone_17_Pro_-_2026-02-24_at_10.38.54.png/1320x2868bb.png> |         1206 × 2622 | `de9f15e712907024dfa92d4e1ca375060cde06437afdc254a01391a317951b57` |
| `src/assets/projects/listwithme/screenshots/03-groceries.png`  |                3 | <https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/af/2a/61/af2a615c-bbb7-4967-07cf-3ea424b98f35/Simulator_Screenshot_-_iPhone_17_Pro_-_2026-02-24_at_10.38.44.png/1320x2868bb.png> |         1206 × 2622 | `090abfeb2535c671f9e90a8b93033d3bbdb172ffa098e1cac8b7b7288959d8f2` |
| `src/assets/projects/listwithme/screenshots/04-activity.png`   |                4 | <https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/ad/d7/70/add77057-5a6e-8a26-d5d1-61e49ea1dc21/Simulator_Screenshot_-_iPhone_17_Pro_-_2026-02-24_at_10.38.51.png/1320x2868bb.png> |         1206 × 2622 | `f1f7e5173d917fea878e3189bc7e6140c3cb71c506f85d7919c15612fc418047` |
