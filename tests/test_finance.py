from app.finance import *

def test_gross_margin(): assert round(gross_margin(500,300),4)==0.4
def test_operating_profit(): assert operating_profit(1000,600,200)==200
def test_operating_margin(): assert round(operating_margin(1000,600,200),4)==0.2
def test_current_ratio(): assert current_ratio(300,200)==1.5
def test_roce(): assert roce(200,1000)==0.2
def test_break_even(): assert break_even_units(10000,50,30)==500
def test_break_even_invalid(): assert break_even_units(10000,30,30) is None
def test_contribution_margin(): assert contribution_margin(50,30)==0.4
