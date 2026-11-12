# Investment Business game: downloads for laptop, Mac, Android and iPhone

The game lives in `www/index.html`. The same file is packaged four ways:

| Device | What the player gets | How it is made |
|---|---|---|
| **Windows laptop** | `Investment-Business-Setup-1.0.0.exe` (installer) and `Investment-Business-Portable-1.0.0.exe` (runs without installing) | Electron (`electron/main.cjs`) |
| **Mac** | `Investment-Business-1.0.0-mac.dmg` (Intel and Apple chips) | Electron |
| **Android** | `release-android-test.apk` (install directly), plus a signed `.apk` and Play Store `.aab` when keys are set | Capacitor (`capacitor.config.json`) |
| **iPhone / iPad** | Install from the web link with **Share > Add to Home Screen**. The build also gives an Xcode project and an unsigned `.ipa` for the App Store | Capacitor + web app (`manifest.webmanifest`, `sw.js`) |

The screen adapts to the device: on phones (upright) the board is on top with the message and scores below; on laptops, Macs, tablets and phones turned sideways the board fills the screen height with the message, scores and rules beside it.

The game works offline on every device. Leads are saved on the device the game is played on, so staff should open **Staff login** and tap **Download CSV** on each device. The staff PIN is set by Head or Regional Incharge in the admin portal: **Feature Controls > Investment Business game: staff PIN**. Until a PIN is set there, the starting PIN is `2026`. Apps pick up a new PIN the next time they are online and remember it for offline use. On Android and iPhone apps the CSV opens the share menu (WhatsApp, Gmail, Drive, Files).

## Download links for players (no GitHub login)

Every successful build publishes the installers as public files with fixed links, so the links never change and always give the newest version:

| Device | Link |
|---|---|
| Windows installer | https://github.com/jeyaprakash27052005-jp/Lead-Information-For-MF-SIF/releases/download/game-app/Investment-Business-Windows-Setup.exe |
| Windows portable | https://github.com/jeyaprakash27052005-jp/Lead-Information-For-MF-SIF/releases/download/game-app/Investment-Business-Windows-Portable.exe |
| Mac | https://github.com/jeyaprakash27052005-jp/Lead-Information-For-MF-SIF/releases/download/game-app/Investment-Business-Mac.dmg |
| Android | https://github.com/jeyaprakash27052005-jp/Lead-Information-For-MF-SIF/releases/download/game-app/Investment-Business-Android.apk |
| iPhone / iPad | game website in Safari > Share > Add to Home Screen |

Easiest for players: the game website has a **Download the app** button (page `download.html`). It detects the device and offers the right file. Share `https://<your game site>/download.html`.

## 1. Get the download files (no computer setup needed)

GitHub builds everything for you.

1. On GitHub open **Actions > Game apps (Windows, Mac, Android, iOS) > Run workflow**.
2. When it finishes (about 15 minutes), open the run and download **Investment-Business-Downloads** at the bottom of the page. It has one folder per device, each with the install file and a `HOW-TO-INSTALL.txt`:

```
Investment-Business-Downloads/
  README.txt
  1-Windows-Laptop/   Investment-Business-Setup-1.0.0.exe, Investment-Business-Portable-1.0.0.exe
  2-Mac/              Investment-Business-1.0.0-mac.dmg
  3-Android/          Investment-Business-Android.apk  (and for-Play-Store/ .aab when signed)
  4-iPhone-iPad/      Xcode project and unsigned .ipa (players install from the web link)
```

The install steps for each folder are kept in `install/` here; edit them there.

To publish a download page with all files attached, create a tag:

```bash
git tag game-v1.0.0
```

```bash
git push origin game-v1.0.0
```

The Releases page on GitHub then has one zip per device (`Investment-Business-1-Windows-Laptop.zip`, `-2-Mac.zip`, `-3-Android.zip`, `-4-iPhone-iPad.zip`). Share that link with players.

## 2. Web link (also the iPhone install)

The game website is the Vercel project **mf-nps-game** (Root Directory `apps/game`, no build settings). It updates automatically whenever `main` changes. Changes made on a `claude/` branch are merged into `main` automatically (`.github/workflows/auto-merge-to-main.yml`), so they go live too.

Players open the link and:

- **iPhone / iPad (Safari):** Share > **Add to Home Screen**
- **Android (Chrome):** menu > **Install app**
- **Laptop / Mac (Chrome or Edge):** install icon in the address bar

## First-time opening

- **Windows:** if "Windows protected your PC" appears, click **More info > Run anyway** (the app is not code-signed yet).
- **Mac:** right-click the app, choose **Open**, then **Open** again (the app is not notarised yet).
- **Android:** allow "Install unknown apps" for your browser or file manager when installing the APK.

## Play Store and App Store (optional)

**Android (Play Store):** make a keystore once and keep it safe; every update must use the same one.

```bash
keytool -genkey -v -keystore mcube.keystore -alias mcube -keyalg RSA -keysize 2048 -validity 10000
```

```bash
base64 -w0 mcube.keystore
```

Add these in GitHub **Settings > Secrets and variables > Actions**: `ANDROID_KEYSTORE_BASE64` (the base64 text), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`mcube`), `ANDROID_KEY_PASSWORD`. The next run then also gives `release-android.apk` and `release-android-playstore.aab` (upload the `.aab` to Google Play Console).

## iPhone app (TestFlight, App Store or ad hoc)

iPhones only install apps signed by Apple. There are three ways, from easiest:

| Way | Needs | Who can install |
|---|---|---|
| **Safari > Share > Add to Home Screen** | nothing | anyone (the game shows these steps on iPhones; works offline) |
| **TestFlight** (then the App Store) | Apple Developer account (USD 99 a year) | anyone with the TestFlight link, up to 10,000 people; App Store after Apple's review |
| **Ad hoc** | Apple Developer account | only iPhones whose device ID is registered (up to 100 a year) |

### One-time setup (TestFlight / App Store)

1. Join the **Apple Developer Program** at developer.apple.com (as Mcube Academy).
2. In **App Store Connect > Apps > +**, create a new app: name *Investment Business*, bundle ID `com.mcubeacademy.investmentbusiness` (register it under Certificates, Identifiers & Profiles > Identifiers if it is not offered), SKU e.g. `investment-business`.
3. In **App Store Connect > Users and Access > Integrations > App Store Connect API**, create a key with **Admin** access. Download the `.p8` file (only possible once) and note the **Key ID** and **Issuer ID**.
4. Note your **Team ID** (developer.apple.com > Account > Membership details).
5. In GitHub, **Settings > Secrets and variables > Actions > New repository secret**, add:

| Secret | Value |
|---|---|
| `APPLE_TEAM_ID` | your Team ID, e.g. `A1B2C3D4E5` |
| `ASC_KEY_ID` | the Key ID |
| `ASC_ISSUER_ID` | the Issuer ID |
| `ASC_KEY_P8_BASE64` | the `.p8` file as base64 (command below) |

```bash
base64 -i AuthKey_XXXXXXXXXX.p8 | tr -d '\n'
```

From the next build on, the iPhone app is signed automatically and uploaded to App Store Connect. After Apple's processing (10 to 30 minutes) it appears under **TestFlight**. There, create an **External testing** group, add the build, and switch on the **Public link**. Paste that link into `www/app-links.js` as `iosTestFlight`; the Download page then shows **Install with TestFlight**. When you submit for the App Store and it is approved, put the App Store link in `iosAppStore`.

### Ad hoc instead of TestFlight

Register each iPhone's device ID under Certificates, Identifiers & Profiles > Devices. Then in GitHub **Settings > Secrets and variables > Actions > Variables** add `IOS_DISTRIBUTION` = `adhoc`. Each build then publishes `Investment-Business-iPhone.ipa` with the other downloads, and setting `iosAdHoc: true` in `www/app-links.js` shows an **Install app** button on the Download page (open it in Safari on a registered iPhone).

The signed iPhone steps run only on GitHub's Mac machines with your Apple keys, so they have not been tried yet; the first run's log in the Actions tab shows any Apple account step still missing.

## Build on your own computer

Needs Node.js 22. In `apps/game`:

```bash
npm install
```

| Command | Result |
|---|---|
| `npm run desktop` | Opens the game as a desktop app |
| `npm run build:win` | Windows `.exe` in `release/` (run on Windows) |
| `npm run build:mac` | Mac `.dmg` in `release/` (run on a Mac) |
| `npm run android:add` then `npm run android:open` | Android Studio project; press Run or **Build > Build APK** |
| `npm run ios:add` then `npm run ios:open` | Xcode project (Mac only) |
| `npm run web` | Web version at http://localhost:3000 |

After changing `www/index.html`, run `npm run sync` for the phone apps, and change `V` in `www/sw.js` (for example `mcube-game-v2`) so installed web apps pick up the change. Change `version` in `package.json` for a new desktop version.

## Settings you may want to change

| Setting | File |
|---|---|
| App name and ID (`com.mcubeacademy.investmentbusiness`) | `package.json` (`build`) and `capacitor.config.json` |
| App icon | `resources/icon.png` (desktop), `assets/` (phones), `www/icons/` (web) |
| Dice or spinning wheel | admin portal (Head Incharge only): Feature Controls > Investment Business game: how players move |
| Staff PIN | admin portal: Feature Controls > Investment Business game: staff PIN |
| Starting staff PIN (used until one is set in admin), number of laps, starting money | top of the script in `www/index.html` (`PIN`, `LAPS`, `CASH`) |
