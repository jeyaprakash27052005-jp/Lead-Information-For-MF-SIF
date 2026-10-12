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
