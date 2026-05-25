# Ecosupport FSOS

Field Service Operating System for bio-septic tank services in Ulaanbaatar.
**Web-only app on Firebase** — no separate native/Flutter client; technicians use the same responsive web app on their phones.

## Бүтэц

- `web/` — Vite + React + TypeScript + Tailwind (responsive админ + хээрийн UI)
- `functions/` — Cloud Functions (TypeScript, Node 20) — pricing engine, Firestore triggers
- `scripts/` — Firestore seed скрипт (`data.js`-аас порт хийсэн)
- `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules` — Firebase тохиргоо
- `ecosupport ux ui/` — анхны React mockup (reference)

## Технологи

- **Firebase**: Firestore (DB), Auth (JWT + custom-claim role), Storage (зураг/гарын үсэг), Cloud Functions (pricing & triggers), Hosting (web deploy)
- **Frontend**: React 18, TypeScript, Tailwind, react-router, Leaflet + OpenStreetMap, Firebase SDK v10
- **Offline**: Firestore `persistentLocalCache` идэвхтэй — техникч интернетгүй үед үргэлжлүүлж ажиллах боломжтой

## Setup

```bash
# 0. Анх удаагаа
npm i -g firebase-tools
firebase login

# 1. Хамаарал
cd web        && npm install && cd ..
cd functions  && npm install && cd ..
cd scripts    && npm install && cd ..

# 2. Web env
cp web/.env.example web/.env.local
# (эмулятор ашиглаж байгаа бол VITE_USE_EMULATOR=1 болго)

# 3. Эмулятор асаах (Firestore + Auth + Functions + Storage)
#    Аюулгүй wrapper нь stale процессуудыг устгаад JVM/Node heap-ийг хязгаарлана.
./scripts/start-emulators.sh
#    (мөн engineerийн дур, шууд: firebase emulators:start)

# 4. Өөр терминалд: Demo data суулгах
cd scripts && npm run seed:emulator

# 5. Functions build (watch горимоор)
cd functions && npm run build:watch

# 6. Web dev сервер
cd web && npm run dev
```

> ⚠️ **RAM хадгалах журам.** `firebase emulators:start`, `tsc -w`, `vite`-г **тус
> тусын терминалд** ажиллуул — Claude Code-той нэг shell-д бүү ажиллуул, эс
> бөгөөс session хаагдсан үед zombie Java/Node процессууд үлдэж RAM 40-80 GB
> хүртэл ачаалж макыг гацааж болзошгүй. Хэрэв порт мөргөлдсөн бол:
>
> ```bash
> ./scripts/kill-stale.sh   # хуучин эмулятор/vite/tsc-г SIGKILL хийнэ
> ```
>
> Heap caps нь [`.envrc.example`](.envrc.example) дотор тайлбарлагдсан
> (`JAVA_TOOL_OPTIONS=-Xmx1g`, `NODE_OPTIONS=--max-old-space-size=2048`).
> `start-emulators.sh` болон `web/functions` npm scripts эдгээрийг автоматаар тохируулдаг.

- Web: http://localhost:5173
- Emulator UI: http://localhost:4000 (Firestore browser энд)
- Хөгжүүлэлтийн үед Login дэлгэц дээр **"нэрээ нуун нэвтрэх"** товчоор Anonymous-аар нэвтрэх боломжтой

## Production deploy

```bash
# Firebase консолд `ecosupport-fsos` нэртэй проект үүсгээд .firebaserc дотор тохируулна
# Дараа нь web build + deploy:
cd web && npm run build && cd ..
firebase deploy
```

Functions Asia Southeast 1 region дээр deploy хийгдэнэ (`web/src/firebase/client.ts`).

## Тест

```bash
cd functions && npm test
```

## Чухал файлууд

- Үнэлгээний хөдөлгүүр: [functions/src/pricing.ts](functions/src/pricing.ts) (тест: [functions/src/pricing.test.ts](functions/src/pricing.test.ts))
- Firestore хандах эрх: [firestore.rules](firestore.rules)
- Data layer hooks: [web/src/lib/hooks.ts](web/src/lib/hooks.ts)
- Хээрийн ажилтны UI: [web/src/pages/TechHome.tsx](web/src/pages/TechHome.tsx)

## Plan

Дэлгэрэнгүй фазчилсан төлөвлөгөө: `~/.claude/plans/ecosupport-dreamy-map.md`
