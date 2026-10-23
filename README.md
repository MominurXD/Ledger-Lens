# Ledger-Lens

[![CI](https://github.com/MominurXD/Ledger-Lens/actions/workflows/ci.yml/badge.svg)](https://github.com/MominurXD/Ledger-Lens/actions/workflows/ci.yml)

**Ledger-Lens is an interactive finance training and business-analysis platform.** Learn by calculating ratios, exploring a fictional company's financial performance and working through practical decision-making exercises.

Instead of only reading about financial statements, you can practice calculating ratios, exploring a fictional company's performance, making management decisions, and checking your understanding with a quiz. It is an educational demo, **not** a personal-finance tracker or investment-advice service.

## What you can do

| Area | Functionality |
| --- | --- |
| Learn | Six short modules: P&L, balance sheet, cash flow, ratios, budgeting/forecasting and break-even analysis |
| Ratio Lab | Calculate gross margin, operating margin, current ratio and return on capital employed (ROCE) |
| Break-even | Estimate contribution per unit, contribution margin and the number of units needed to cover fixed costs |
| Business Case | Explore Northstar Retail Ltd's synthetic budget, actuals and operational drivers |
| Quiz | Answer five finance questions, receive a score and read explanations after submission |
| Progress | Track ten activities in the current browser session: six lessons, two calculators, case study and quiz |

The interface works without a frontend build step. It uses plain HTML, CSS and JavaScript backed by a Python/FastAPI API.

## Quick start

You need **Python 3.12** (the version used in CI) and a terminal.

~~~bash
git clone https://github.com/MominurXD/Ledger-Lens.git
cd Ledger-Lens
python -m venv .venv
~~~

Activate the virtual environment:

- **macOS/Linux:** `source .venv/bin/activate`
- **Windows PowerShell:** `.venv\Scripts\Activate.ps1`
- **Windows Command Prompt:** `.venv\Scripts\activate.bat`

Then install dependencies and start the web server:

~~~bash
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
~~~

Open **http://127.0.0.1:8000** to use the app. Open **http://127.0.0.1:8000/docs** for interactive API documentation. Stop the server with Ctrl+C.

No API keys, database or external financial-data feeds are required.

## Run tests

From the repository root, with the environment activated:

~~~bash
python -m pytest -q
~~~

Install **Node.js** if you also want to run the JavaScript syntax check:

~~~bash
node --check web/app.js
~~~

GitHub Actions automatically runs Python tests, JavaScript syntax checking and a Docker build on pushes and pull requests. Check the [CI workflow](https://github.com/MominurXD/Ledger-Lens/actions/workflows/ci.yml) for the latest result.

## Docker

If Docker is installed:

~~~bash
docker build -t ledger-lens .
docker run --rm -p 8000:10000 ledger-lens
~~~

The container listens on port **10000** by default and serves the app at **http://127.0.0.1:8000** through the port mapping. Set `PORT` to a different value only if you also update the mapped container port.

The repository also includes `render.yaml` for a Docker-based Render web service with a health check at `/api/health`. This configuration does not by itself mean the app has been deployed.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service health and version |
| GET | `/api/lessons` | Finance learning modules |
| GET | `/api/case` | Synthetic company figures and calculated variances |
| POST | `/api/ratios` | Calculate profitability and liquidity ratios |
| POST | `/api/break-even` | Calculate contribution and break-even volume |
| GET | `/api/quiz` | Quiz questions and answer choices, **without** correct answers or explanations |
| POST | `/api/quiz` | Score a submission and return explanations |

Example — ratio calculation:

~~~bash
curl -X POST http://127.0.0.1:8000/api/ratios \
  -H "Content-Type: application/json" \
  -d '{"revenue":1000,"cost_of_sales":600,"operating_expenses":200,"current_assets":300,"current_liabilities":200,"capital_employed":1000}'
~~~

Ratios such as `gross_margin` are returned as decimals (for example, `0.4` means **40%**). Invalid inputs are rejected with HTTP 422. When price does not exceed variable cost, `break_even_units` is `null`; the browser shows an explanation instead of a misleading number.

## Dataset and finance logic

`data/company_case.json` contains **fictional** data for **Northstar Retail Ltd** (GBP, FY2026): revenue, cost of sales, operating expenses, current assets/liabilities, capital employed, and drivers including selling price, volume, payroll and inventory days. It contains no confidential company information.

Key calculations are defined in `app/finance.py`:

| Metric | Calculation |
| --- | --- |
| Gross profit | Revenue − cost of sales |
| Operating profit | Revenue − cost of sales − operating expenses |
| Gross margin | Gross profit ÷ revenue |
| Operating margin | Operating profit ÷ revenue |
| Current ratio | Current assets ÷ current liabilities |
| ROCE | Operating profit ÷ capital employed |
| Budget variance | Actual − budget |
| Contribution per unit | Selling price − variable cost per unit |
| Break-even units | Fixed costs ÷ contribution per unit |

For whole-unit sales, the interface rounds positive break-even volume **up** to the nearest unit. Negative revenue or denominator values are validated by API request models.

## Progress, privacy and limitations

Progress is held in browser `sessionStorage`, so it survives a page refresh within the same tab/session but is not stored in an account or shared across devices. A quiz score of **80% or higher** completes its progress checkpoint. The app has no user login or persistent database.

This is an illustrative learning and portfolio project. It does not import bank transactions, produce regulated financial advice or forecast a real business.

## Project structure

~~~text
app/
  main.py              FastAPI routes and static file serving
  finance.py           Reusable calculations
  content.py           Lesson and quiz content
data/company_case.json Synthetic company dataset
web/                   Browser interface: HTML, CSS and JavaScript
tests/                 API, finance and regression tests
.github/workflows/ci.yml  CI checks
Dockerfile             Container packaging
render.yaml            Optional Render deployment configuration
~~~

## Technology

Python 3.12 · FastAPI · Pydantic · HTML/CSS/JavaScript · Pytest · Docker · GitHub Actions

**Portfolio focus:** Financial modelling, financial-statement analysis, budget variance analysis, decision support, API design, responsive frontend development, testing and deployment configuration.
