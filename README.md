# Lead Information For MF SIF

One repository, four separate websites that share the same code and the same online database (Firebase):

| Website | Folder | Who uses it |
|---|---|---|
| **Admin Portal** | `apps/admin` | Head, Regional and Area Incharge: leads, users, schemes, ads, reports, customer permissions, Finance Health Check-up reports |
| **Customer Portal** | `apps/customer` | Customers: Home Screen with ads, create account / login, scheme calculators and the other features the admin has switched on |
| **Finance Health Check-up Portal** | `apps/health-check` | Anyone (no login): health questionnaire, report, PDF download and e-mail |
| **Advertising Website** | `apps/ads` | Anyone (no login): moving ads, mutual fund offers, awareness sessions and a contact page |

Shared code lives in `src/` (components, services, utils). Each website has its own `vercel.json`.

## Deploy on Vercel (three projects from this one repo)

Create four Vercel projects from this repository and set **Root Directory** for each one:

| Vercel project | Root Directory |
|---|---|
| Admin | `apps/admin` |
| Customer | `apps/customer` |
| Finance Health Check-up | `apps/health-check` |
| Advertising | `apps/ads` |

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

## Animated ad creatives (Home Screen Ads: Head, Regional and Area Incharge)

Admin portal -> **Home Screen Ads** (available to the Head, Regional and Area Incharge; each ad shows who added it). Upload a JPG / PNG / GIF, write the headline, tagline and badge, then choose:

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

The PDF is sent through Brevo with `BREVO_API_KEY` (the only value you must add; the sender defaults to `jeyaprakash27052005@gmail.com`, which must be verified in Brevo, and can be changed with `REPORT_FROM_EMAIL`) (see `.env.example` for the 3 steps). Put them in a local `.env` file for `npm run dev`, or in Vercel -> Settings -> Environment Variables, then redeploy. The key is read only on the server; it is never stored in Firestore or sent to the browser. Use **Feature Controls -> Check e-mail setup** to confirm it works.

## Sending the health check-up report as a message (no e-mail API needed)

Admin -> **Feature Controls -> How the health check-up report reaches the customer**:

- **Message (WhatsApp / SMS)** - the default. The customer's Gmail / e-mail ID and mobile number are still collected and saved (visible in Health Check-up Reports). After the PDF downloads, **Send on WhatsApp** opens the phone's share sheet with the PDF attached and the full report typed in (score, topic scores, strengths, priorities, monthly investment plan); on a computer it opens WhatsApp to the customer's number with the same text and the customer attaches the downloaded PDF. **Send as SMS** sends the first 600 characters.
- **E-mail the PDF** - the earlier behaviour; needs `BREVO_API_KEY` (see above).

Press **Save changes** after choosing. ### Automatic sending (no buttons for the customer)

When the keys below are set on the Vercel project, the report is sent to the customer's mobile by itself the moment they press **Download report**. WhatsApp is tried first (PDF + full report text); if it is not set up or fails, an SMS with the score and first step is sent. If neither is set up, the customer sees the Send on WhatsApp / Send as SMS buttons instead.

| Variable | Purpose |
|---|---|
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | Meta WhatsApp Cloud API access token and sending number ID |
| `WHATSAPP_TEMPLATE`, `WHATSAPP_TEMPLATE_LANG` | Approved template with a Document header and 2 body variables ({{1}} name, {{2}} score). Without it WhatsApp only delivers to people who messaged your number in the last 24 hours |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | SMS through Twilio (or `TWILIO_MESSAGING_SERVICE_SID`) |

Add them in the Customer and Health Check-up projects (and Admin for the check button), redeploy, then use **Feature Controls -> Check automatic WhatsApp / SMS setup**. WhatsApp Business and SMS providers charge per message / need account approval.

## Address / place

The health check-up asks for the customer's **Address / place** (typed text) instead of choosing a region. It is shown in the PDF, in Health Check-up Reports and in the lead's notes.

## Three-line menu and customer Home

- Every portal now uses a **three-line (hamburger) menu**: the button at the top-left opens a side panel with all options (admin sections, or the customer's Home, calculators, Finance Health Check-up and Awareness Programs). It closes when an option is chosen, on Escape, or when the dark area is pressed.
- After login, the customer's **Home** opens with the moving, animated ads the admin team added (Home Screen Ads), followed by their application status. When no ad exists, or the Home Screen Ads switch is off, a welcome card is shown instead of an empty page.
- With no WhatsApp / SMS account set up, pressing **Download report** downloads the PDF and opens WhatsApp straight away with the full report ready (phone: share sheet with the PDF attached); the customer taps Send. A browser cannot press Send for the customer; that needs the optional automatic-sending accounts described above.

## Investment Calculations (Head, Regional and Area Incharge only)

Menu -> **Investment Calculations**. It is not shown to customers. Lumpsum and SIP are separate tabs, and every result shows the formula used.

- **Lumpsum: future value** - one-time amount, return, years, inflation: future value, gain, worth in today's money, year-by-year table.
- **SIP: future value** - monthly SIP with optional yearly step-up: future value, total invested, gain, today's-money value, year-by-year table, and the monthly SIP needed for a goal. The monthly rate is `(1 + r)^(1/12) - 1`, so the yearly return you enter is the effective yearly return (the customer calculators use the scheme's own method; small differences are expected).
- **Lumpsum: growth** - growth value, absolute return, CAGR, growth multiple, real return after inflation, doubling time (Rule of 72 and exact) and what the fund's expense ratio costs.
- **SIP: growth** - total invested, growth value, absolute return and the yearly return the SIP earned (from what it is worth now), plus real return after inflation.
- **Dividend** - IDCW payout, tax at the rate you enter, dividend yield, NAV after dividend, units and value if reinvested, annual yield and total return including dividends.

These are estimates for explaining numbers, not guaranteed returns or advice.

## Mutual Fund Ads (added by the admin team only)

Admin portal -> menu -> **Mutual Fund Ads** (Head, Regional and Area Incharge). Customers can only view them; there is no way to add one from the customer site.

- Each advertisement has the scheme name, fund house, category, riskometer level, headline, details, up to 5 highlights, minimum SIP, a fund-house page link (https), a badge, an uploaded image (JPG / PNG / GIF) and the same picture animation, speed and headline effect options as Home Screen Ads, with a live preview.
- Add, edit, delete, hide / show and re-order. Each shows who added it.
- Customers see them under **Mutual Fund Offers** in their menu (with a category filter) and in a "Mutual fund offers" section on the Home Screen. The **Mutual Fund Offers** switch in Feature Controls turns them off.
- Advertising rules built in: words that promise returns (guarantee, assured return, risk-free, double your money...) are not accepted.
- Publish `firestore.rules` after this update (it adds the `fundAds` collection).

The earlier **Investor Profile** (11 questions with the fund data link) has been removed.

## Advertising website (`apps/ads`)

A separate public website for advertising mutual fund products, with a top menu bar and drop-down panels in the style of a fund-house site (labels are our own and can be renamed). The starter menu has **Investor Guide, Plan & Calculate, Fund Products, Help & Services** and a **Top Offers** button, plus **Quick Enquiry** and an optional **Login** button. Open to everyone, no login. On phones the menu becomes a three-line menu.

What it shows:
- Menus, sub menus and pages written by the admin team (below).
- Home Screen Ads (animated), Mutual Fund Ads, Awareness Sessions, the investment calculators (SIP, lumpsum, dividend) and a Contact Us page that shows only the details the admin typed in. These respect the switches in Feature Controls.

### Managing the website (Head Incharge and Regional Incharge only)

Admin portal -> **Website Menus**:
- **Top menus**: add, rename, reorder, hide, delete, or make one a highlighted button.
- **Sub menu pages**: each has a column heading, title, short line, tag (New / Coming Soon) and opens a page of text with an optional picture, an outside https link, a part of the site (Mutual Fund Offers, Sessions, Contact), or the calculators. Add, edit, hide, reorder and delete.
- Until the first save the website shows a built-in starter menu; press **Load starter menu** to copy it into the database and edit it.
- Words that promise or guarantee returns are rejected. Mutual fund promotions themselves are added under **Mutual Fund Ads**.

Republish `firestore.rules` after pulling this change (new collections `siteMenus` and `siteItems`).

Optional settings (Vercel -> Environment Variables, all public): `VITE_CUSTOMER_URL` (https address of the Customer Portal, shows the Login button). Run with `npm run dev:ads`, build with `npm run build:ads`. Vercel Root Directory: `apps/ads`.

## Contact details and SIP reminders

- **Contact Us page** (advertising website) shows *Chat to us* (name, e-mail), *Office* (address) and *Phone* (hours, name, mobile number) with green icons. Head and Regional Incharge edit them in the admin portal under **Website Menus -> Contact Us details**; they are stored online in `settings/siteContact`.
- **SIP investment** (admin portal): when a lead is **Ready to Invest**, open the lead's profile and press **Add SIP**. Enter the scheme name, starting date, end of SIP and amount by hand, choose **Growth / Dividend Payout / Reinvestment of Dividend**, and the order mode (**daily / weekly / monthly**). SIPs can be edited, paused and deleted.
- **SIP Reminders** (admin menu): every SIP due within **3 days** is listed first (also shown as an alert inside the investor's profile), followed by all other running SIPs with their next date. Stored in the `sipPlans` collection.
- Republish `firestore.rules` (new: `sipPlans`, `settings/siteContact`).

### Reminding the investor and filters

On **SIP Reminders** (and inside the investor's SIP card) the incharge presses **Mark reminded** after calling or messaging the investor. It records who reminded and when, for that investment date only; when the next daily / weekly / monthly date comes, the SIP shows "not reminded yet" again. Filters: investor / scheme / mobile search, order mode (daily, weekly, monthly), reminded or not, investment date (3, 7, 31 days) and region.
