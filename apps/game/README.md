# Investment Business game: downloads for laptop, Mac, Android and iPhone

The game lives in `www/index.html`. The same file is packaged four ways:

| Device | What the player gets | How it is made |
|---|---|---|
| **Windows laptop** | `Investment-Business-Setup-1.0.0.exe` (installer) and `Investment-Business-Portable-1.0.0.exe` (runs without installing) | Electron (`electron/main.cjs`) |
| **Mac** | `Investment-Business-1.0.0-mac.dmg` (Intel and Apple chips) | Electron |
| **Android** | `release-android-test.apk` (install directly), plus a signed `.apk` and Play Store `.aab` when keys are set | Capacitor (`capacitor.config.json`) |
| **iPhone / iPad** | Install from the web link with **Share > Add to Home Screen**. The build also gives an Xcode project and an unsigned `.ipa` for the App Store | Capacitor + web app (`manifest.webmanifest`, `sw.js`) |

The screen adapts to the device: on phones (upright) the board is on top with the message and scores below; on laptops, Macs, tablets and phones turned sideways the board fills the screen height with the message, scores and rules beside it.

The game works offline on every device. Leads are saved on the device the game is played on, so staff should open **Staff: view leads** (PIN `2026`) and tap **Download CSV** on each device. On Android and iPhone apps the CSV opens the share menu (WhatsApp, Gmail, Drive, Files).

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

Create a Vercel project from this repository with **Root Directory** `apps/game`. No build or environment variables are needed. Players open the link and:

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

**iPhone (App Store):** needs an Apple Developer account (USD 99 a year) and a Mac. Unzip `Investment-Business-ios-xcode-project.zip`, open `ios/App/App.xcodeproj` in Xcode, choose your team under **Signing & Capabilities**, then **Product > Archive > Distribute App**. The unsigned `.ipa` cannot be installed on a normal iPhone; use the web link instead until the app is on the App Store.

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
| Staff PIN, number of laps, starting money | top of the script in `www/index.html` (`PIN`, `LAPS`, `CASH`) |
