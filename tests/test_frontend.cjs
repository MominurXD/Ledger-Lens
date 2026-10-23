'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('web/app.js', 'utf8');
const key = 'ledger-lens-progress-v1';

function boot(savedValue) {
  const storage = new Map(savedValue === undefined ? [] : [[key, savedValue]]);
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) {
      const handlers = {};
      elements.set(id, {
        textContent: '',
        innerHTML: '',
        style: {},
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener: (name, fn) => { handlers[name] = fn; },
        handlers
      });
    }
    return elements.get(id);
  }
  const caseData = {
    budget: {revenue: 200, cost_of_sales: 100, operating_expenses: 30},
    actual: {revenue: 200, cost_of_sales: 100, operating_expenses: 30},
    analysis: {operating_profit_budget: 70, operating_profit_actual: 70, operating_profit_variance: 0},
    drivers: {sales_volume_change_pct: -1, average_selling_price_change_pct: -1,
      payroll_variance: 0, inventory_days_budget: 42, inventory_days_actual: 43}
  };
  const responses = {
    '/api/lessons': [],
    '/api/case': caseData,
    '/api/quiz': [],
    '/api/break-even': {contribution_per_unit: 0, contribution_margin: 0, break_even_units: null}
  };
  const document = {
    getElementById: element,
    querySelectorAll: () => [],
    querySelector: () => null
  };
  const context = vm.createContext({
    document,
    sessionStorage: {
      getItem: name => storage.get(name) ?? null,
      setItem: (name, value) => storage.set(name, value)
    },
    fetch: async url => url === '/invalid'
      ? {ok: false, json: async () => ({detail: [{msg: 'Value must be positive'}]})}
      : {ok: true, json: async () => responses[url]},
    Intl, FormData, console
  });
  vm.runInContext(source, context);
  return {context, storage, element};
}

test('progress counts ten checkpoints and never exceeds 100%', () => {
  const app = boot();
  assert.equal(app.element('progressText').textContent, '0%');
  vm.runInContext("state.done.add('pnl');state.done.add('ratioLab');state.caseDone=true;updateProgress()", app.context);
  assert.equal(app.element('progressText').textContent, '30%');
  assert.equal(app.element('progressBar').style.width, '30%');
  vm.runInContext("for(const id of ACTIVITY_IDS)state.done.add(id);state.quizDone=true;updateProgress()", app.context);
  assert.equal(app.element('progressText').textContent, '100%');
  assert.equal(JSON.parse(app.storage.get(key)).done.length, 8);
});

test('progress is restored and unknown checkpoint ids are discarded', () => {
  const app = boot(JSON.stringify({done: ['pnl', 'ratioLab', 'not-an-activity'], caseDone: true, quizDone: false}));
  assert.equal(app.element('progressText').textContent, '30%');
  assert.equal(vm.runInContext('state.done.size', app.context), 2);
});

test('corrupt session storage does not prevent app startup', () => {
  const app = boot('{bad json');
  assert.equal(app.element('progressText').textContent, '0%');
});

test('validation errors with FastAPI detail arrays are readable', async () => {
  const app = boot();
  await assert.rejects(
    vm.runInContext("getJSON('/invalid')", app.context),
    /Value must be positive/
  );
});

test('invalid break-even results clear stale output and explain the problem', async () => {
  const app = boot();
  app.element('contribution').textContent = '£20.00';
  app.element('breakEvenUnits').textContent = '5,000 units';
  await app.element('beForm').handlers.submit({preventDefault() {}});
  assert.equal(app.element('breakEvenUnits').textContent, '—');
  assert.match(app.element('beError').textContent, /higher than variable cost/);
});
