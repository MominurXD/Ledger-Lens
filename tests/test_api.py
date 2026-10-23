from fastapi.testclient import TestClient
from app.main import app

client=TestClient(app)

def test_health(): assert client.get('/api/health').json()['status']=='ok'
def test_lessons(): assert len(client.get('/api/lessons').json())>=6
def test_case():
    b=client.get('/api/case').json(); assert b['analysis']['operating_profit_variance']==-160000
def test_ratio_endpoint():
    r=client.post('/api/ratios',json={'revenue':1000,'cost_of_sales':600,'operating_expenses':200,'current_assets':300,'current_liabilities':200,'capital_employed':1000})
    assert r.status_code==200 and r.json()['gross_margin']==0.4
def test_break_even_endpoint():
    r=client.post('/api/break-even',json={'fixed_costs':10000,'unit_price':50,'unit_variable_cost':30})
    assert r.json()['break_even_units']==500
def test_quiz_marking():
    q=client.get('/api/quiz').json(); answers={x['id']:x['choices'][0] for x in q}
    r=client.post('/api/quiz',json={'answers':answers}); assert r.status_code==200 and r.json()['total']==5
