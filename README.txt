MARKETPULSE - LOCAL DEMONSTRATION PACKAGE
========================================

CONTENTS
--------
index.html  Main webpage and dashboard sections
style.css   Responsive styling and visual theme
script.js   Navigation, sample watchlist, charts, currency converter,
            EMI calculator, investment projection, and demo admin actions

HOW TO RUN ON WINDOWS
---------------------
1. Download MarketPulse_Professional_Demo.zip.
2. Right-click the ZIP and choose Extract All.
3. Extract to a normal folder, for example Desktop\MarketPulse_Final.
4. Open the extracted folder. Confirm index.html, style.css, script.js,
   and this README.txt are all in the SAME folder.
5. Double-click index.html. Do not open index.html from inside the ZIP preview.
6. If needed, refresh with Ctrl+Shift+R.

DEMO ACCESS
-----------
Admin username: admin
Admin password: 1234
Or click Continue as guest.

FEATURES
--------
- Market overview with selectable sample trend chart and top movers
- Searchable sample watchlist with 50 instruments
- Currency converter using editable demo exchange rates
- Loan EMI calculator
- Investment future-value projection and chart
- Market chart with symbol and sample period selection
- Demo admin controls for rates and asset reference prices
- Browser-local activity log
- Optional API Gateway GET /stocks integration setting in script.js

IMPORTANT LIMITATIONS
---------------------
- Stock and asset figures are sample/demo values, not live market prices.
- Chart history is illustrative, not exchange historical data.
- Admin username/password are hardcoded for a local classroom demo only.
  This is NOT secure authentication and must not be used for production.
- Admin updates and logs use this browser's localStorage; they do not write
  to DynamoDB unless you implement a secured backend API for those actions.
- The chart and icons use external CDN libraries, so an internet connection
  is needed for Chart.js charts and Font Awesome icons. The page and CSS are
  local files.

OPTIONAL AWS API CONNECTION
---------------------------
In script.js, locate:
  apiBaseUrl: ""

Set it to the deployed API Gateway base URL, without the trailing /stocks,
for example:
  apiBaseUrl: "https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod"

The API must allow browser CORS requests and GET /stocks must return a JSON
array of records, or an object containing a stocks, items, or data array.
Each record should include a symbol/ticker and a numeric price field. Check
that API Gateway, Lambda, DynamoDB, and CORS are configured before enabling.
Do not put AWS access keys or provider secrets in frontend files.

PROJECT BRAND
-------------
MarketPulse - AWS Cloud Architecture Design demonstration project.


ELITE DEMONSTRATION ADDITIONS
- Refined visual layer with a dark navy sidebar, refined cards, focus states and responsive layouts.
- Theme toggle (light/dark), refresh demo action and watchlist CSV export.
- Portfolio simulator (local browser storage; no real trades).
- Price alert rules (checked on open/manual refresh; not background monitoring).
- The project uses illustrative sample stock prices and generated chart history unless a real API is configured.
- Admin login is demo-only. Never use these credentials or browser-side permissions for a production system.
- For production AWS: configure Cognito, API Gateway, Lambda, DynamoDB, IAM least privilege, CloudWatch, and a real market-data provider. Do not put secrets in frontend files.
