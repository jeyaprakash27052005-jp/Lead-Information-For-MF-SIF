# Lead Information For MF SIF

One repository, three separate websites that share the same code and the same online database (Firebase):

| Website | Folder | Who uses it |
|---|---|---|
| **Admin Portal** | `apps/admin` | Head, Regional and Area Incharge: leads, users, schemes, ads, reports, customer permissions, Finance Health Check-up reports |
| **Customer Portal** | `apps/customer` | Customers: Home Screen with ads, create account / login, scheme calculators and the other features the admin has switched on |
| **Finance Health Check-up Portal** | `apps/health-check` | Anyone (no login): health questionnaire, report, PDF download and e-mail |

Shared code lives in `src/` (components, services, utils). Each website has its own `vercel.json`.

## Deploy on Vercel (three projects from this one repo)

Create three Vercel projects from this repository and set **Root Directory** for each one:

| Vercel project | Root Directory |
|---|---|
| Admin | `apps/admin` |
| Customer | `apps/customer` |
| Finance Health Check-up | `apps/health-check` |

Leave "Include source files outside of the Root Directory in the Build Step" switched **on** (the default). The `vercel.json` in each folder installs and builds from the repository root.

The old root `vercel.json` still builds the earlier all-in-one site, so existing deployments keep working until you point them at the folders above.

## Environment variables

Only the Finance Health Check-up and Customer projects need these (they send the report e-mail):

| Name | Purpose |
|---|---|
| `BREVO_API_KEY` | API key of your Brevo account (the free plan is enough to start) |
| `REPORT_FROM_EMAIL` | Sender address verified in Brevo (a Gmail address works) |
| `REPORT_FROM_NAME` | Optional sender name |

Without them the report still downloads, the lead is still saved in the admin portal, and the page says the e-mail could not be sent. The report PDF is sent to the customer's e-mail address; the mobile number is stored with the lead for the team to call or message.

## Firebase

Publish `firestore.rules` in the Firebase console (Firestore Database -> Rules) whenever it changes. It contains the rules for leads, users, schemes, ads and Finance Health Check-up reports.

## Customer features and permissions

Head and Regional Incharge can switch customer features on or off per customer (Users page -> **Permissions**): Mutual Fund Calculator, NPS Scheme Calculator, Browse Published Schemes, and Finance Health Check-up. The calculators and scheme list are on by default; the Finance Health Check-up is off until an admin switches it on.

## Calculators

Mutual Fund and NPS calculators ask only: scheme, how to invest (one-time lumpsum, SIP, or both), amount(s), and how long (days, weeks, months or years). The expected return comes from the scheme set by the admin.

- Lumpsum: `M = P x (1 + R)^t`
- SIP: `M = S x [ ((1 + i)^n - 1) / i ] x (1 + i)`

## Scripts

```
npm install --legacy-peer-deps
npm run dev:admin      # also dev:customer, dev:health
npm run build:admin    # also build:customer, build:health, build:apps (all three)
npm run lint           # type-check
```

## Admin controls (Head Incharge and Regional Incharge only)

- **Health Check-up Questions** - every question in the Finance Health Check-up is added here (starter set available with one click). For each question the admin chooses the answer type: agree / disagree scale, choice (radio buttons), list box (drop-down), check list (tick many) or text box. For choice, list and check-list questions the admin sets the points (0 to 100) of every option; text boxes are saved for the team and are not scored. Press **Publish questions** to make them live. Until questions are published, the check-up shows "being prepared". Each report keeps its own copy of the questions the person answered.
- **Feature Controls** - switch on or off: Customer Portal, Finance Health Check-up Portal, Customer Registration, Mutual Fund Calculator, NPS Calculator, Browse Published Schemes (off by default), Finance Health Check-up inside the customer portal, and Home Screen Ads. Also sets the expected return (% a year) used by the Mutual Fund and NPS calculators and by the "How much you can invest every month" part of the report.
- **E-mail check** - the same page can check the e-mail settings and send a test e-mail. For this and for **Resend** in Health Check-up Reports, add `BREVO_API_KEY` and `REPORT_FROM_EMAIL` to the **Admin** Vercel project as well (plus the Customer and Health Check-up projects), then redeploy.
- Publish `firestore.rules` in the Firebase console after every update (it now includes the `settings` documents).

- If **Save changes** or **Publish questions** shows "the online database is blocking it", the Firestore rules are not published yet. The message has a **Copy the Firestore rules** button; paste them in Firebase console > Firestore Database > Rules and press Publish.

## Staying logged in and live switches

- Refreshing the page no longer logs anyone out in the admin or customer portals. The login is remembered in the browser for 7 days (only the user id is kept, never a password) and is cleared when the person presses Logout, or when the account is deleted or deactivated. A refresh also returns to the same screen, and a half-finished Health Check-up keeps its answers.
- Feature Controls switches (for example Browse Published Schemes) reach every open customer screen within about 20 seconds, or at once when the person returns to the tab. Nobody needs to refresh.
- In Health Check-up Questions every question and topic has visible **Edit** and **Delete** buttons. Edit changes the text, topic, answer type, options and points; Delete asks for confirmation. Press **Publish questions** to make the changes live.

## Awareness programmes, intro animation and video

- **Awareness Programs** (admin portal, Head and Regional Incharge): add, edit, hide and delete investor awareness programmes (title, details, date and time, online link or in-person venue, speaker). Visible programmes appear on the Home Screen and in the customer portal. The **Awareness Programs** switch in Feature Controls turns them off for customers.
- **Finance Health Check-up (inside Customer Portal)** switch: when it is on, every customer sees the tab. A customer is blocked only if the admin blocks them with the Permissions button.
- **Intro animation**: the first screen of every site plays a short mutual-fund intro (loading counter, two investors, "SIP BETTER, GROW FASTER."). It plays once per browser tab and has a Skip button. The Home Screen has an animated "How mutual funds work" explainer and a growing-investment chart. All buttons and cards have hover and press animations (switched off for people who ask their device for reduced motion).
- `media/mutual-fund-intro.mp4` is a 38-second portrait video of the intro and the explainer, for sharing. Open the site with `?demo=intro` or `?demo=explainer` to play the animations full screen.
- Publish `firestore.rules` after this update (it adds the `awarenessPrograms` collection).

## Animated ad creatives (Home Screen Ads, Head Incharge)

Admin portal -> **Home Screen Ads**. Upload a JPG / PNG / GIF, write the headline, tagline and badge, then choose:

- **Picture animation** - slow zoom in / out, pan left / right / up, fade in, slide in, flip in, bounce, pulse, float, wiggle, shimmer, or none.
- **Speed** - slow, normal or fast.
- **Headline / tagline effect** - rise up, fade in, slide from left, pop, or none.

The creative preview in the form shows exactly how it will move (**Replay preview** plays it again). Each ad in the list has **Edit** (change the picture, text or animation), **Active / Disabled** and **Delete**. Ads made before this update keep working with no animation. Animation is switched off for visitors whose device asks for reduced motion.

## Awareness programmes by Head, Regional and Area Incharge

**Awareness Programs** is in the menu of all three admin roles. Each programme belongs to a region:

| Role | Who sees what it adds | What it can edit / delete |
|---|---|---|
| Head Incharge | Chooses **All regions** or one region | Every programme |
| Regional Incharge | Customers of their own division | Programmes of their division and their own |
| Area Incharge | Customers of their own division | Only programmes they added |

Customers see programmes for their own region plus the "All regions" ones; the public Home Screen shows only "All regions" programmes.

## E-mailing the health check-up PDF (API key)

The PDF is sent through Brevo with `BREVO_API_KEY` and `REPORT_FROM_EMAIL` (see `.env.example` for the 3 steps). Put them in a local `.env` file for `npm run dev`, or in Vercel -> Settings -> Environment Variables, then redeploy. The key is read only on the server; it is never stored in Firestore or sent to the browser. Use **Feature Controls -> Check e-mail setup** to confirm it works.
