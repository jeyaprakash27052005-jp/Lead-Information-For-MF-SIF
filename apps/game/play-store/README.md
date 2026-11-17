# Publishing the game apps on Google Play

Each game is its own Android app with its own Play Store listing:

| App | Package name (app ID) | Play upload file |
|---|---|---|
| 🎲 Investment Business | `com.mcubeacademy.investmentbusiness` | `Investment-Business-PlayStore.aab` |
| 🌟 Money Adventure for Kids | `com.mcubeacademy.moneyadventure` | `Money-Adventure-PlayStore.aab` |
| 💰 ₹1 Lakh to ₹10 Lakh Challenge | `com.mcubeacademy.lakhchallenge` | `Lakh-Challenge-PlayStore.aab` |
| 🐯 Bull vs Bear – Aadu Puli | `com.mcubeacademy.aadupuli` | `Bull-vs-Bear-Aadu-Puli-PlayStore.aab` |
| 🌰 Pallanguli Investment Game | `com.mcubeacademy.pallanguli` | `Pallanguli-PlayStore.aab` |
| 🏦 Personal Finance Game | `com.mcubeacademy.personalfinance` | `Personal-Finance-PlayStore.aab` |

A package name can never change after the first upload. The all-games app (`com.mcubeacademy.games`) stays a direct download and can also be published the same way if wanted.

Everything Play asks for is ready in this folder:

| Play asks for | Where it is |
|---|---|
| App icon 512 × 512 | `<game>/play-icon-512.png` |
| Feature graphic 1024 × 500 | `<game>/feature-graphic-1024x500.png` |
| Phone screenshots (2–8) | `<game>/screenshots/phone-*.png` (1080 × 1920) |
| Tablet screenshots (7" and 10") | `<game>/screenshots/tablet-*.png` (1920 × 1080) |
| App name, short and full description, release notes | `LISTINGS.md` |
| Privacy policy URL | `https://<games site>/privacy.html` |
| Data deletion URL | `https://<games site>/privacy.html#delete` |

`<games site>` is the address of the Vercel project `mf-nps-game`. The privacy page shows the contact details saved in the admin portal under **Website Menus** (Contact details), so keep an email address there.

Technical requirements already met: target Android 16 (API 36, required since 31 August 2026), Android App Bundle (.aab), only the Internet permission, no advertising ID, no ads or tracking SDKs, a higher version code for every build.

---

## 1. One-time setup

### 1.1 Google Play developer account
1. Go to play.google.com/console and sign up (one-time fee USD 25).
2. Choose **Organization** for Mcube Academy if you can. It needs a **D-U-N-S number** (free from Dun & Bradstreet, takes a few days), a website and an official email and phone.
   - With an **organization** account you can publish to production straight away.
   - With a **personal** account created after 13 November 2023, **each new app** must first run a **closed test with at least 12 testers who stay opted in for 14 days in a row**, and only then can you apply for production. With 6 apps, plan this from the start (the same 12 testers can join all 6 tests).
3. Complete identity verification and the developer contact details shown on the store (email required; phone and website recommended).

### 1.2 Upload key (signs the files you upload)
Make one key and keep it safe; the same key can sign all 6 apps.

```bash
keytool -genkey -v -keystore mcube-upload.keystore -alias mcube -keyalg RSA -keysize 2048 -validity 10000
```

```bash
base64 -w0 mcube-upload.keystore
```

In GitHub **Settings › Secrets and variables › Actions** add `ANDROID_KEYSTORE_BASE64` (the base64 text), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`mcube`) and `ANDROID_KEY_PASSWORD`.
Keep a copy of the keystore and passwords outside GitHub. Google keeps the real app signing key (**Play App Signing**, switched on by default), so a lost upload key can be reset through Play support.

### 1.3 Get the upload files
Open **Actions › Game apps › Run workflow** (or push any change). When it finishes, download **Investment-Business-Downloads**: the six `.aab` files are in `3-Android/for-Play-Store/`. Every build has a higher version code, so a newer `.aab` can always be uploaded as an update.

---

## 2. For each app (repeat 6 times)

### 2.1 Create the app
**Home › Create app**: app name from `LISTINGS.md`, default language **English (India) – en-IN**, **Game**, **Free**, tick the declarations.

### 2.2 "Set up your app" (Dashboard)

| Section | What to enter |
|---|---|
| **Privacy policy** | `https://<games site>/privacy.html` |
| **App access** | *Investment Business:* "All or some functionality is restricted" › add instructions: "Staff login (organisers only, optional): PIN 2026, or the PIN set in Mcube Game Admin". *All other apps:* "All functionality is available without special access". |
| **Ads** | No, my app does not contain ads. |
| **Content rating** | Category **Game**. Answer **No** to violence, fear, sexuality, language, controlled substances, crude humour, gambling (dice and spinner use play money, no bets, no prizes), users interacting, sharing location and digital purchases. Expected result: **Everyone / PEGI 3 / 3+** (Aadu Puli may show "mild fantasy" for tigers catching goats). |
| **Target audience and content** | Ages from `LISTINGS.md`. *Money Adventure:* 6–8 and 9–12, so it joins the **Designed for Families** programme (see 3.2). *Other apps:* 13+; answer **No** to "Could your store listing unintentionally appeal to children?" |
| **News app** | No |
| **COVID-19 apps** | No |
| **Data safety** | See 2.3 |
| **Government apps** | No |
| **Financial features** | "My app doesn't provide any financial features" (play money and education only; no real accounts, loans, payments or advice). |
| **Health** | No health features |
| **Advertising ID** | No (the app does not use it) |

### 2.3 Data safety (exact answers)
- Does your app collect or share any of the required user data types? **Yes**
- Is all of the user data collected by your app encrypted in transit? **Yes** (HTTPS)
- Do you provide a way for users to request that their data is deleted? **Yes** – `https://<games site>/privacy.html#delete`
- Data is **not shared** with third parties (Google Cloud stores it for us as a service provider, which Play does not count as sharing).

| Data type | Collected in | Required or optional | Processed only on device? | Purposes |
|---|---|---|---|---|
| Personal info › **Name** | all apps (Money Adventure: parent's name) | Required | No | App functionality; Advertising or marketing |
| Personal info › **Phone number** | all apps | Required | No | App functionality; Advertising or marketing |
| Personal info › **Email address** | Investment Business, Pallanguli only | Required | No | App functionality; Advertising or marketing |
| Personal info › **Other info** (age) | Aadu Puli, Pallanguli only | Required | No | App functionality |
| App activity › **App interactions** (game results, language, mode) | all apps | Required | No | App functionality; Analytics |

"Advertising or marketing" covers Mcube Academy contacting players about courses, which players agree to in the registration form. If you never contact players, leave it out.

### 2.4 Store presence
- **Store settings:** category from `LISTINGS.md`, tags, contact email, phone, website `https://mcubeacademy.com`.
- **Main store listing:** app name, short description, full description (copy from `LISTINGS.md`); app icon, feature graphic, phone screenshots and tablet screenshots from the game's folder here.

### 2.5 Release
1. **Testing › Internal testing**: create a release, upload the `.aab`, add yourself as tester, install from the Play link and check the game.
2. Personal account: **Testing › Closed testing**, add 12+ testers (Google group or emails), keep them opted in for 14 days, then **Apply for production** on the Dashboard.
   Organization account: go straight to step 3.
3. **Production › Create new release**, upload the same `.aab`, paste the release notes, choose countries (India, and others if wanted), **Review release › Start rollout**. Google's review usually takes from a few hours to about a week; new apps and apps for children can take longer.

### 2.6 Updates later
Change the game, let the build run, upload the new `.aab` to **Production › Create new release**. The version code is higher automatically. Keep the same package name and upload key.

---

## 3. Play policies that matter for these apps

### 3.1 Personal data (User Data policy)
- The registration form says what is collected and has the "I agree…" tick box and a **Privacy policy** link before anything is saved – this is Play's "prominent disclosure and consent". Do not remove them.
- The privacy page must stay online at the same address and match the Data safety answers. If a game starts asking for something new (for example city), update the privacy page and the Data safety form first.
- Deletion requests: when someone asks, find the mobile number in **Mcube Game Admin › Players**, tick their records and **Delete selected**, then reply to them.

### 3.2 Children (Families policy) – Money Adventure
- Before anything is typed, a **grown-ups check** (a times-table question) appears; then the **parent** registers with the parent's own name and mobile number. Nothing about the child is asked.
- No ads, no in-app purchases, no links out of the app, no third-party SDKs, no location – keep it that way.
- In Play Console, complete **Target audience** with 6–8 and 9–12 and accept the Families policy declarations. If Google asks, explain that only parent details are collected, after the grown-ups check, for the parent to be contacted with consent.
- Investment Business has a "Kids" mode played with a parent; its listing targets 13+, so it is not in the Families programme.

### 3.3 Financial content
- The games use **play money**, show the risk disclaimer, and give no investment advice or recommendations. Keep words like "guaranteed returns", "sure profit" or "best fund" out of the games and listings.
- Mentions of Mcube Academy courses are fine; do not add payment, trading, lending or real-money features, which need the Financial Services declarations and licences.

### 3.4 Store listing (Metadata policy)
- No emojis, "#1", "best", "free" or prices in the app name; no misleading screenshots; screenshots must show the real app (the ones here are taken from the apps themselves).
- The emoji pictures in the icons and graphics are from Google's Noto Emoji set, which is free to use commercially (Apache 2.0 licence).

### 3.5 Keep apps current
- Google raises the required Android version every year (by 31 August). Updating the Capacitor packages in `apps/game` and rebuilding keeps the apps compliant.
- Apps that are not updated for a long time and do not meet the current target are hidden from new users on newer phones.

---

## 4. How the separate apps are built (for developers)
- `android-games/games.json` – package name, launcher name, title, icon, colours and file name of each app.
- `android-games/build.mjs <game>` – makes `android-games/out/<game>/` with only that game, a Capacitor config and the app icons from `play-store/<game>/app-assets/`.
- `.github/workflows/game-apps.yml` › job **android-games** – builds all six: a test `.apk`, and with the keystore secrets a signed `.apk` and the Play `.aab`. The version code is `100 + build number`.
- In a single-game app the "All games" link is replaced by a **Privacy** link, and if the Head hides the game in **Mcube Game Admin › Games**, the app shows "Paused for now".
