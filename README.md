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

- **Health Check-up Questions** - every question in the Finance Health Check-up is added here (starter set available with one click). Press **Publish questions** to make them live. Until questions are published, the check-up shows "being prepared". Each report keeps its own copy of the questions the person answered.
- **Feature Controls** - switch on or off: Customer Portal, Finance Health Check-up Portal, Customer Registration, Mutual Fund Calculator, NPS Calculator, Browse Published Schemes (off by default), Finance Health Check-up inside the customer portal, and Home Screen Ads. Also sets the expected return (% a year) used by the Mutual Fund and NPS calculators and by the "How much you can invest every month" part of the report.
- **E-mail check** - the same page can check the e-mail settings and send a test e-mail. For this and for **Resend** in Health Check-up Reports, add `BREVO_API_KEY` and `REPORT_FROM_EMAIL` to the **Admin** Vercel project as well (plus the Customer and Health Check-up projects), then redeploy.
- Publish `firestore.rules` in the Firebase console after every update (it now includes the `settings` documents).
