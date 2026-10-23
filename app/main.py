from __future__ import annotations
import json
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from .content import LESSONS, QUIZ
from .finance import gross_margin, operating_margin, current_ratio, roce, break_even_units, contribution_margin

ROOT = Path(__file__).resolve().parent.parent
CASE = json.loads((ROOT / "data" / "company_case.json").read_text())
app = FastAPI(title="Ledger-Lens", version="1.0.0", description="Interactive finance training platform.")

class RatioRequest(BaseModel):
    revenue: float = Field(gt=0)
    cost_of_sales: float = Field(ge=0)
    operating_expenses: float = Field(ge=0)
    current_assets: float = Field(ge=0)
    current_liabilities: float = Field(gt=0)
    capital_employed: float = Field(gt=0)

class BreakEvenRequest(BaseModel):
    fixed_costs: float = Field(ge=0)
    unit_price: float = Field(gt=0)
    unit_variable_cost: float = Field(ge=0)

class QuizSubmission(BaseModel):
    answers: dict[str, str]

@app.get('/api/health')
def health():
    return {'status':'ok','service':'Ledger-Lens','version':'1.0.0'}

@app.get('/api/lessons')
def lessons():
    return LESSONS

@app.get('/api/case')
def case():
    b, a = CASE['budget'], CASE['actual']
    budget_op = b['revenue'] - b['cost_of_sales'] - b['operating_expenses']
    actual_op = a['revenue'] - a['cost_of_sales'] - a['operating_expenses']
    return {
        **CASE,
        'analysis': {
            'revenue_variance': a['revenue'] - b['revenue'],
            'cost_of_sales_variance': a['cost_of_sales'] - b['cost_of_sales'],
            'operating_expense_variance': a['operating_expenses'] - b['operating_expenses'],
            'operating_profit_budget': budget_op,
            'operating_profit_actual': actual_op,
            'operating_profit_variance': actual_op - budget_op,
            'gross_margin_budget': gross_margin(b['revenue'], b['cost_of_sales']),
            'gross_margin_actual': gross_margin(a['revenue'], a['cost_of_sales']),
            'current_ratio_actual': current_ratio(a['current_assets'], a['current_liabilities']),
            'roce_actual': roce(actual_op, a['capital_employed'])
        }
    }

@app.post('/api/ratios')
def ratios(req: RatioRequest):
    op = req.revenue - req.cost_of_sales - req.operating_expenses
    return {
        'gross_margin': gross_margin(req.revenue, req.cost_of_sales),
        'operating_margin': operating_margin(req.revenue, req.cost_of_sales, req.operating_expenses),
        'current_ratio': current_ratio(req.current_assets, req.current_liabilities),
        'roce': roce(op, req.capital_employed),
        'operating_profit': op
    }

@app.post('/api/break-even')
def break_even(req: BreakEvenRequest):
    return {
        'contribution_per_unit': req.unit_price - req.unit_variable_cost,
        'contribution_margin': contribution_margin(req.unit_price, req.unit_variable_cost),
        'break_even_units': break_even_units(req.fixed_costs, req.unit_price, req.unit_variable_cost)
    }

@app.get('/api/quiz')
def quiz():
    return [{k: v for k, v in q.items() if k not in {'answer', 'explanation'}} for q in QUIZ]

@app.post('/api/quiz')
def mark_quiz(req: QuizSubmission):
    results=[]; score=0
    for q in QUIZ:
        submitted=req.answers.get(q['id'])
        correct=submitted==q['answer']
        score += 1 if correct else 0
        results.append({'id':q['id'],'correct':correct,'answer':q['answer'],'explanation':q['explanation']})
    return {'score':score,'total':len(QUIZ),'percentage':round(score/len(QUIZ)*100),'results':results}

WEB = ROOT / 'web'
app.mount('/', StaticFiles(directory=WEB, html=True), name='web')
