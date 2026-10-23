from __future__ import annotations


def gross_profit(revenue: float, cost_of_sales: float) -> float:
    return revenue - cost_of_sales


def operating_profit(revenue: float, cost_of_sales: float, operating_expenses: float) -> float:
    return revenue - cost_of_sales - operating_expenses


def gross_margin(revenue: float, cost_of_sales: float) -> float | None:
    if revenue <= 0:
        return None
    return gross_profit(revenue, cost_of_sales) / revenue


def operating_margin(revenue: float, cost_of_sales: float, operating_expenses: float) -> float | None:
    if revenue <= 0:
        return None
    return operating_profit(revenue, cost_of_sales, operating_expenses) / revenue


def current_ratio(current_assets: float, current_liabilities: float) -> float | None:
    if current_liabilities <= 0:
        return None
    return current_assets / current_liabilities


def roce(operating_profit_value: float, capital_employed: float) -> float | None:
    if capital_employed <= 0:
        return None
    return operating_profit_value / capital_employed


def variance(actual: float, budget: float) -> float:
    return actual - budget


def variance_pct(actual: float, budget: float) -> float | None:
    if budget == 0:
        return None
    return (actual - budget) / abs(budget)


def break_even_units(fixed_costs: float, unit_price: float, unit_variable_cost: float) -> float | None:
    contribution = unit_price - unit_variable_cost
    if contribution <= 0:
        return None
    return fixed_costs / contribution


def contribution_margin(unit_price: float, unit_variable_cost: float) -> float | None:
    if unit_price <= 0:
        return None
    return (unit_price - unit_variable_cost) / unit_price
