const {test} = require('node:test');
const assert = require('node:assert/strict');
const L = require('../carta/loxodromica.js');
const near = (actual, expected, tol = 1e-8) => assert.ok(Math.abs(actual - expected) < tol, `${actual} != ${expected}`);

test('known direct example: full arrival, not only the minutes', () => {
  const m = L.lesson('loxDir', {lat:36, lon:-(6+20/60), rd:293, v:7.5, h:6});
  near(m.q.D, 45);
  near(m.q.la, 36.29304834636695);
  assert.match(m.result, /36° 17,6′ N/);
  assert.match(m.result, /007° 11,3′ W/);
  assert.equal(m.steps.length, 7);
  assert.equal(m.steps.find(s => s.id === 'A').unit, 'M');
  assert.equal(m.steps.find(s => s.id === 'dL').unit, '′');
});
test('all four quadrants and southern/eastern hemispheres round-trip', () => {
  for (const lat of [36, -32]) for (const lon of [-6, 12]) for (const course of [0, 25, 90, 135, 180, 225, 270, 315, 359]) {
    const q = L.direct(lat, lon, course, 87.5);
    const inverse = L.inverse(lat, lon, q.la, q.lo);
    near(inverse.D, 87.5);
    near(inverse.R, course);
  }
});
test('parallel and meridian sailings avoid division by zero', () => {
  const east = L.inverse(39+26/60, -.3, 39+26/60, 2.5);
  near(east.R, 90); near(east.D, 168 * Math.cos((39+26/60)*Math.PI/180));
  near(L.inverse(36, -6, 35, -6).R, 180);
  near(L.inverse(36, -6, 37, -6).R, 0);
});
test('antimeridian uses the short signed difference; invalid cases are explicit', () => {
  const q = L.direct(30, 179.5, 90, 100);
  assert.ok(q.lo < -178);
  near(L.inverse(30, 179.5, q.la, q.lo).D, 100);
  assert.equal(L.inverse(36,-6,36,-6).R, null);
  assert.throws(() => L.lesson('loxInv', {la1:36,lo1:-6,la2:36,lo2:-6}), /coinciden/);
  assert.throws(() => L.direct(90,0,90,1), /polos/);
  assert.throws(() => L.direct(.1,0,180,100), /ecuador/);
  assert.throws(() => L.inverse(1,0,-1,0), /ecuador/);
  assert.throws(() => L.direct(36,0,0,-1), /negativa/);
});
test('formats carry 60 minutes correctly and preserve hemispheres', () => {
  assert.equal(L.position(12+59.99/60,'lat'), '13° 0,0′ N');
  assert.equal(L.position(-12.5,'lon'), '012° 30,0′ W');
  assert.equal(L.position(-32.25,'lat'), '32° 15,0′ S');
});
test('coordinate validation catches degrees, minutes, and wrong hemispheres', () => {
  const step = L.lesson('loxDir', {lat:-32,lon:12,rd:135,v:8,h:3}).steps.find(s => s.id === 'la');
  const value = Math.abs(step.v), degrees = Math.floor(value), minutes = (value-degrees)*60;
  const raw = {degrees:String(degrees), minutes:String(minutes), direction:'S'};
  assert.equal(L.check(step, raw).ok, true);
  assert.equal(L.check(step, {...raw,direction:'N'}).ok, false);
  assert.match(L.check(step, {...raw,direction:'N'}).message, /sentido/);
  for (const bad of [{minutes:'60'}, {degrees:'12.5'}, {degrees:''}, {minutes:'5abc'}, {direction:'W'}]) assert.equal(L.check(step,{...raw,...bad}).valid,false);
});
test('components accept decimal comma and diagnose sense; courses use circular tolerance', () => {
  const m = L.lesson('loxDir', {lat:36,lon:-6,rd:293,v:7.5,h:6});
  const step = m.steps.find(s => s.id === 'A');
  assert.equal(L.check(step, {value:Math.abs(step.v).toFixed(2).replace('.',','),direction:'W'}).ok, true);
  assert.match(L.check(step, {value:String(Math.abs(step.v)),direction:'E'}).message, /sentido/);
  assert.equal(L.check(step, {value:'-41',direction:'W'}).valid, false);
  assert.equal(L.check({type:'scalar',v:0,tol:1,unit:'°'}, {value:'360'}).ok,true);
  assert.equal(L.check({type:'scalar',v:0,tol:1,unit:'°'}, {value:'361'}).valid,false);
});
test('every lesson step accepts its expected result, including southern coordinates', () => {
  const examples = [L.lesson('loxDir',{lat:-32,lon:12,rd:225,v:8,h:6}), L.lesson('loxInv',{la1:36,lo1:-6,la2:35.5,lo2:-7,ask:'rd'})];
  for (const lesson of examples) for (const step of lesson.steps) {
    const v=Math.abs(step.v), degrees=Math.floor(v);
    const raw=step.type==='coordinate'?{degrees:String(degrees),minutes:String((v-degrees)*60),direction:step.axis==='lat'?(step.v<0?'S':'N'):(step.v<0?'W':'E')}:{value:String(v),direction:step.axis==='lat'?(step.v<0?'S':'N'):(step.v<0?'W':'E')};
    assert.equal(L.check(step,raw).ok,true,step.id);
  }
});
test('DEG calculator evaluates arithmetic, trig, inverse trig, powers and comma', () => {
  near(L.calculate('7,5 × 6'),45);
  near(L.calculate('45 * cos(293)'),45*Math.cos(293*Math.PI/180));
  near(L.calculate('sen(30)'),.5);
  near(L.calculate('atan(1)'),45);
  near(L.calculate('sqrt(3^2 + 4^2)'),5);
  near(L.calculate('-2^2'),-4);
  near(L.calculate('2^-2'),.25);
  near(L.calculate('2^3^2'),512);
  near(L.calculate('(1 + 2) * (3 - 1)'),6);
});
test('calculator rejects code, malformed syntax, nonfinite results and domains', () => {
  for (const expression of ['', '1/0', 'sqrt(-1)', 'tan(90)', 'sin 30', '1 +', '(2+3', '1.2.3', 'alert(1)', 'globalThis.process', '1;2', '1e309', '9^999', '1'.repeat(161)]) assert.throws(() => L.calculate(expression), undefined, expression);
});
