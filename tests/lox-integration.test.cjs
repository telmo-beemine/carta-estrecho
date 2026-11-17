const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const L = require('../carta/loxodromica.js');
const source = fs.readFileSync(path.join(__dirname, '../carta/index.html'), 'utf8');
function section(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert.ok(a >= 0 && b > a, start);
  return source.slice(a, b);
}

test('all four official analytic questions still match their published answer key', () => {
  const context = vm.createContext({PL:(lat,lon)=>({lat,lon})});
  vm.runInContext(section('const P4=', 'const GN='), context);
  const questions = vm.runInContext('EXAM.flatMap(ex=>ex.q).filter(q=>q[1].startsWith("lox"))', context);
  assert.equal(questions.length, 4);
  assert.deepEqual(Array.from(questions,q=>q[4]), [3,1,2,1]);
  for (const q of questions) {
    const model = L.lesson(q[1], q[2]);
    const correct = q[3][q[4]];
    if (q[1] === 'loxDir') {
      assert.match(correct, /36° 17,6/); assert.match(correct, /007° 11,3/);
      assert.match(model.result, /36° 17,6/); assert.match(model.result, /007° 11,3/);
    } else if (q[2].ask === 'd') assert.ok(correct.includes(model.q.D.toFixed(1).replace('.',',')));
    else assert.ok(correct.includes(String(Math.round(model.q.R)).padStart(3,'0')));
  }
});
test('three real practice generators produce solvable direct and inverse worksheets', () => {
  let seed = 123456;
  const random = () => ((seed = (seed*1664525+1013904223)>>>0) / 4294967296);
  const context = vm.createContext({
    pk:a=>a[Math.floor(random()*a.length)],
    rint:(a,b)=>a+Math.floor(random()*(b-a+1)),
    lox:L.direct,
    hhmm:minutes=>`${Math.floor(minutes/60)%24}:${minutes%60}`,
  });
  vm.runInContext(section('const GEN=', 'const FIX='), context);
  for (const kind of ['loxDir','loxCourse','loxDistance']) {
    for (let i=0;i<150;i++) {
      const spec = vm.runInContext(`GEN.${kind}()`, context);
      const model = L.lesson(spec[0], spec[1]);
      assert.ok(model.steps.every(s=>Number.isFinite(s.v)),kind);
      assert.equal(model.steps.find(s=>s.id==='A').unit,'M');
      assert.ok(!model.steps.some(s=>s.type==='drawing'));
    }
  }
});
