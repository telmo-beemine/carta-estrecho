/* Estima analítica por latitud media. Browser + Node, with no dependencies. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Loxodromica = factory();
})(globalThis, function () {
  'use strict';
  const rad = value => value * Math.PI / 180;
  const norm = value => ((value % 360) + 360) % 360;
  const signedAngle = value => ((value + 540) % 360) - 180;
  const finite = (...values) => values.every(Number.isFinite);
  const fmt = (value, digits = 2) => (Math.abs(value) < 1e-10 ? 0 : value).toFixed(digits).replace('.', ',').replace('-', '−');
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hemisphere = (value, axis) => axis === 'lat' ? (value < 0 ? 'S' : 'N') : (value < 0 ? 'W' : 'E');

  function validatePosition(lat, lon) {
    if (!finite(lat, lon) || Math.abs(lat) >= 90 || Math.abs(lon) > 180) throw new RangeError('Revisa la latitud y la longitud. Este método no admite los polos.');
  }
  function direct(lat, lon, course, distance) {
    validatePosition(lat, lon);
    if (!finite(course, distance) || distance < 0) throw new RangeError('El rumbo debe ser finito y la distancia no puede ser negativa.');
    const dl = distance * Math.cos(rad(course)), A = distance * Math.sin(rad(course));
    const la = lat + dl / 60, lm = (lat + la) / 2;
    if (Math.abs(la) >= 90 || lat * la < 0) throw new RangeError('Este ejercicio de latitud media debe resolverse sin cruzar el ecuador ni los polos.');
    const dL = A / Math.cos(rad(lm));
    return {la, lo: signedAngle(lon + dL / 60), dl, A, lm, dL, D: distance, R: norm(course)};
  }
  function inverse(la1, lo1, la2, lo2) {
    validatePosition(la1, lo1); validatePosition(la2, lo2);
    if (la1 * la2 < 0) throw new RangeError('Divide la navegación en dos tramos si cruza el ecuador.');
    const dl = (la2 - la1) * 60, dL = signedAngle(lo2 - lo1) * 60, lm = (la1 + la2) / 2;
    const A = dL * Math.cos(rad(lm)), D = Math.hypot(dl, A);
    return {dl, dL, lm, A, D, R: D < 1e-10 ? null : norm(Math.atan2(A, dl) * 180 / Math.PI)};
  }
  function position(value, axis) {
    let degrees = Math.floor(Math.abs(value)), minutes = (Math.abs(value) - degrees) * 60;
    minutes = Math.round(minutes * 10) / 10;
    if (minutes >= 60) { degrees++; minutes = 0; }
    return `${String(degrees).padStart(axis === 'lat' ? 2 : 3, '0')}° ${fmt(minutes, 1)}′ ${hemisphere(value, axis)}`;
  }
  const coordinate = (id, title, v, axis, formula, explanation, calculation) => ({id, title, v, axis, type:'coordinate', unit:'′', tol:.3 / 60, formula, explanation, calculation});
  const directed = (id, title, v, axis, unit, formula, explanation, calculation) => ({id, title, v, axis, type:'directed', unit, tol:.3, formula, explanation, calculation});
  const scalar = (id, title, v, unit, formula, explanation, calculation) => ({id, title, v, type:'scalar', unit, tol:unit === '°' ? 1 : .5, formula, explanation, calculation});

  function lesson(kind, o) {
    if (!['loxDir', 'loxInv'].includes(kind)) throw new Error('Tipo de ejercicio no reconocido.');
    const isDirect = kind === 'loxDir';
    const q = isDirect ? direct(o.lat, o.lon, o.rd, o.v * o.h) : inverse(o.la1, o.lo1, o.la2, o.lo2);
    if (!isDirect && q.R === null) throw new RangeError('Salida y llegada coinciden: la distancia es cero y el rumbo no está definido.');
    const latStart = isDirect ? o.lat : o.la1, lonStart = isDirect ? o.lon : o.lo1;
    const latEnd = isDirect ? q.la : o.la2, lonEnd = isDirect ? q.lo : o.lo2;
    const data = [['Salida', `${position(latStart, 'lat')} · ${position(lonStart, 'lon')}`]];
    if (isDirect) data.push(['Rumbo directo', `${fmt(norm(o.rd), 0)}° verdadero`], ['Velocidad efectiva', `${fmt(o.v, 1)} kn`], ['Tiempo navegado', `${fmt(o.h, 2)} h${o.h0 && o.h1 ? ' · '+o.h0+' → '+o.h1 : ''}`]);
    else data.push(['Llegada', `${position(latEnd, 'lat')} · ${position(lonEnd, 'lon')}`], ['Se pide', o.ask === 'd' ? 'Distancia directa' : 'Rumbo directo']);
    const dlat = directed('dl', 'Diferencia de latitud', q.dl, 'lat', '′', isDirect ? 'Δl = D × cos Rd' : 'Δl = (l₂ − l₁) × 60', isDirect ? 'El coseno da el desplazamiento norte-sur. Indica su magnitud en minutos y el sentido N o S.' : 'Pasa las latitudes a grados con signo (N +, S −), resta llegada menos salida y multiplica por 60.', `${isDirect ? fmt(q.D)+' × cos('+fmt(o.rd, 0)+'°)' : '('+fmt(latEnd, 5)+' − '+fmt(latStart, 5)+') × 60'} = ${fmt(Math.abs(q.dl))}′ ${hemisphere(q.dl, 'lat')}.`);
    const apart = directed('A', 'Apartamiento', q.A, 'lon', 'M', isDirect ? 'A = D × sen Rd' : 'A = ΔL × cos lm', 'El apartamiento es distancia este-oeste en millas náuticas. No son minutos de longitud. Elige E o W.', `${isDirect ? fmt(q.D)+' × sen('+fmt(o.rd, 0)+'°)' : fmt(Math.abs(q.dL))+' × cos('+fmt(q.lm, 5)+'°)'} = ${fmt(Math.abs(q.A))} M ${hemisphere(q.A, 'lon')}.`);
    const mean = coordinate('lm', 'Latitud media', q.lm, 'lat', 'lm = (l₁ + l₂) / 2', 'Promedia las latitudes de salida y llegada. Introduce la latitud media en grados, minutos y hemisferio.', `(${position(latStart, 'lat')} + ${position(latEnd, 'lat')}) / 2 = ${position(q.lm, 'lat')}.`);
    let steps;
    if (isDirect) {
      steps = [
        scalar('D', 'Distancia navegada', q.D, 'M', 'D = Vef × t', 'Multiplica los nudos por el tiempo expresado en horas. Si tienes minutos, divídelos antes entre 60.', `${fmt(o.v, 1)} kn × ${fmt(o.h)} h = ${fmt(q.D)} M.`), dlat,
        coordinate('la', 'Latitud de llegada', q.la, 'lat', 'l₂ = l₁ + Δl / 60', 'Aplica la diferencia de latitud en su sentido N o S. Recuerda: 60 minutos forman un grado.', `${position(latStart, 'lat')} ${q.dl < 0 ? '−' : '+'} ${fmt(Math.abs(q.dl))}′ = ${position(q.la, 'lat')}.`), apart, mean,
        directed('dL', 'Diferencia de longitud', q.dL, 'lon', '′', 'ΔL = A / cos lm', 'Convierte el apartamiento en minutos de longitud usando el coseno de la latitud media. Mantén el sentido E o W.', `${fmt(Math.abs(q.A))} / cos(${fmt(q.lm, 5)}°) = ${fmt(Math.abs(q.dL))}′ ${hemisphere(q.dL, 'lon')}.`),
        coordinate('lo', 'Longitud de llegada', q.lo, 'lon', 'L₂ = L₁ + ΔL / 60', 'Trabaja con E positivo y W negativo. Comprueba el hemisferio final; no des solo los minutos de la coordenada.', `${position(lonStart, 'lon')} con ${fmt(Math.abs(q.dL))}′ hacia ${hemisphere(q.dL, 'lon')} → ${position(q.lo, 'lon')}.`),
      ];
    } else {
      const angle = Math.atan2(Math.abs(q.A), Math.abs(q.dl)) * 180 / Math.PI;
      const quadrant = `${q.dl < 0 ? 'S' : 'N'} ${fmt(angle, 1)}° ${q.A < 0 ? 'W' : 'E'}`;
      const courseHelp = Math.abs(q.dl) < 1e-8 ? 'Las latitudes coinciden: el rumbo es 090° hacia E o 270° hacia W.' : Math.abs(q.A) < 1e-8 ? 'Las longitudes coinciden: el rumbo es 000° hacia N o 180° hacia S.' : `El ángulo del cociente es ${fmt(angle, 2)}°. El cuadrante ${quadrant} lo convierte en ${fmt(q.R, 1)}°.`;
      steps = [dlat,
        directed('dL', 'Diferencia de longitud', q.dL, 'lon', '′', 'ΔL = (L₂ − L₁) × 60', 'Usa E positivo y W negativo. Si cambias de hemisferio, las magnitudes se suman; al cruzar 180° se toma la diferencia menor.', `ΔL = ${fmt(Math.abs(q.dL))}′ ${hemisphere(q.dL, 'lon')}.`), mean, apart,
        scalar('R', 'Rumbo directo y cuadrante', q.R, '°', 'tg θ = |A| / |Δl| → Rd según cuadrante', 'Obtén el ángulo con arcotangente y usa los sentidos N/S y E/W para dar el rumbo circular entre 000° y 360°.', courseHelp),
        scalar('D', 'Distancia directa', q.D, 'M', 'D = √(Δl² + A²)', 'Con Δl en minutos (millas norte-sur) y A en millas, aplica Pitágoras. También puedes usar D = Δl / cos Rd salvo en rumbos E/W.', `√(${fmt(Math.abs(q.dl))}² + ${fmt(Math.abs(q.A))}²) = ${fmt(q.D)} M.`),
      ];
    }
    return {kind, q, data, steps, title:isDirect ? 'Calcular la situación de llegada' : 'Calcular rumbo y distancia', result:isDirect ? `${position(q.la, 'lat')} · ${position(q.lo, 'lon')}` : `Rd = ${fmt(q.R, 1)}° · D = ${fmt(q.D, 1)} M`};
  }

  function number(value) {
    const s = String(value).trim().replace('−', '-');
    return /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(s) ? Number(s.replace(',', '.')) : NaN;
  }
  function answer(step, raw) {
    const value = number(raw.value);
    if (step.type === 'coordinate') {
      const degrees = number(raw.degrees), minutes = number(raw.minutes), limit = step.axis === 'lat' ? 90 : 180;
      if (!finite(degrees, minutes) || !Number.isInteger(degrees) || degrees < 0 || degrees > limit || minutes < 0 || minutes >= 60 || (degrees === limit && minutes !== 0)) return {valid:false, message:'Introduce grados enteros y minutos entre 0 y menos de 60.'};
      if (!(step.axis === 'lat' ? ['N','S'] : ['E','W']).includes(raw.direction)) return {valid:false, message:'Selecciona el hemisferio.'};
      return {valid:true, value:(degrees + minutes / 60) * (['S','W'].includes(raw.direction) ? -1 : 1)};
    }
    if (!Number.isFinite(value)) return {valid:false, message:'Escribe un número. Puedes usar coma o punto decimal.'};
    if (step.type === 'directed') {
      if (value < 0) return {valid:false, message:'Introduce la magnitud positiva y elige su sentido con N/S o E/W.'};
      if (!(step.axis === 'lat' ? ['N','S'] : ['E','W']).includes(raw.direction)) return {valid:false, message:'Selecciona el sentido.'};
      return {valid:true, value:value * (['S','W'].includes(raw.direction) ? -1 : 1)};
    }
    if (step.unit === '°' && (value < 0 || value > 360)) return {valid:false, message:'El rumbo circular debe estar entre 000° y 360°.'};
    if (step.unit === 'M' && value < 0) return {valid:false, message:'La distancia no puede ser negativa.'};
    return {valid:true, value};
  }
  function check(step, raw) {
    const parsed = answer(step, raw);
    if (!parsed.valid) return {...parsed, ok:false};
    const delta = step.unit === '°' && step.type === 'scalar' ? Math.abs(signedAngle(parsed.value - step.v)) : Math.abs(parsed.value - step.v);
    if (delta <= step.tol + 1e-10) return {valid:true, ok:true, message:'Correcto. Puedes continuar con el siguiente paso.'};
    if (step.axis && Math.abs(Math.abs(parsed.value) - Math.abs(step.v)) <= step.tol) return {valid:true, ok:false, message:`La magnitud está bien; revisa el sentido: debe ser ${hemisphere(step.v, step.axis)}.`};
    if (step.id === 'dl') return {valid:true, ok:false, message:'Revisa la diferencia de latitud: se expresa en minutos. En el problema directo se usa el coseno del rumbo.'};
    if (step.id === 'A') return {valid:true, ok:false, message:'Revisa el apartamiento: son millas. En el directo usa seno del rumbo; en el inverso, coseno de la latitud media.'};
    if (step.id === 'dL') return {valid:true, ok:false, message:'No confundas apartamiento con minutos de longitud. Usa la latitud media y revisa si debes multiplicar o dividir por su coseno.'};
    if (step.id === 'R') return {valid:true, ok:false, message:'Revisa el cuadrante N/S y E/W. La arcotangente da un ángulo; todavía debes convertirlo al rumbo circular.'};
    return {valid:true, ok:false, message:'Revisa las unidades, el hemisferio y el redondeo. Mantén decimales en los pasos intermedios.'};
  }

  // Restricted expression parser: mathematical expressions only, no eval or JavaScript.
  function calculate(expression) {
    if (String(expression).length > 160) throw new Error('La expresión es demasiado larga.');
    const input = String(expression).toLowerCase().replace(/\s/g, '').replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-').replaceAll(',','.');
    const tokens = input.match(/(?:\d+(?:\.\d*)?|\.\d+)|[a-z]+|[()+\-*/^]/g) || [];
    if (tokens.join('') !== input || !tokens.length) throw new Error('Usa números, + − × ÷, paréntesis y funciones sin, cos, tan, atan o sqrt.');
    let i = 0;
    function primary() {
      const token = tokens[i++];
      if (token === '(') { const v = sum(); if (tokens[i++] !== ')') throw new Error('Revisa los paréntesis.'); return v; }
      if (/^(?:\d|\.)/.test(token || '')) return Number(token);
      if (['sin','sen','cos','tan','atan','sqrt','raiz'].includes(token)) {
        if (tokens[i++] !== '(') throw new Error('Las funciones necesitan paréntesis. Ejemplo: cos(293).');
        const v = sum(); if (tokens[i++] !== ')') throw new Error('Revisa los paréntesis.');
        if (token === 'tan' && Math.abs(Math.cos(rad(v))) < 1e-12) throw new Error('La tangente no está definida para ese ángulo.');
        return token === 'sin' || token === 'sen' ? Math.sin(rad(v)) : token === 'cos' ? Math.cos(rad(v)) : token === 'tan' ? Math.tan(rad(v)) : token === 'atan' ? Math.atan(v) * 180 / Math.PI : Math.sqrt(v);
      }
      throw new Error('Expresión incompleta o función no admitida.');
    }
    function power() { const v = primary(); if (tokens[i] === '^') { i++; return v ** unary(); } return v; }
    function unary() { if (tokens[i] === '+') { i++; return unary(); } if (tokens[i] === '-') { i++; return -unary(); } return power(); }
    function product() { let v = unary(); while (tokens[i] === '*' || tokens[i] === '/') { const op = tokens[i++], rhs = unary(); if (op === '/' && rhs === 0) throw new Error('No se puede dividir entre cero.'); v = op === '*' ? v * rhs : v / rhs; } return v; }
    function sum() { let v = product(); while (tokens[i] === '+' || tokens[i] === '-') { const op = tokens[i++], rhs = product(); v = op === '+' ? v + rhs : v - rhs; } return v; }
    const result = sum();
    if (i !== tokens.length || !Number.isFinite(result)) throw new Error('Revisa la expresión y el dominio de las funciones.');
    return result;
  }

  function mount(root, {onReturn = () => {}} = {}) {
    let exercise = null, model = null, active = 0, states = [], calculator = {expression:'', result:''};
    const field = id => root.querySelector('#'+id);
    function saveDraft() {
      if (!model) return;
      const state = states[active];
      root.querySelectorAll('[data-answer]').forEach(input => { state.raw[input.dataset.answer] = input.value; });
      if (field('lox-expression')) calculator.expression = field('lox-expression').value;
    }
    function editAnswer(input) {
      const state = states[active];
      state.raw[input.dataset.answer] = input.value; state.ok = false; state.feedback = '';
      const next = root.querySelector('[data-lox-action="next"]');
      if (next) next.disabled = true;
      const feedback = root.querySelector('.lox-feedback');
      if (feedback) { feedback.textContent = ''; feedback.className = 'lox-feedback'; }
      root.querySelector('.lox-summary')?.remove();
      root.querySelector(`[data-lox-step="${active}"]`)?.classList.remove('is-complete');
      const progress = root.querySelector('.lox-progress');
      if (progress) progress.innerHTML = `<span>${states.filter(s => s.ok).length} de ${model.steps.length} pasos comprobados</span><span>Paso ${active+1} de ${model.steps.length}</span>`;
    }
    function inputs(step, raw) {
      const options = step.axis === 'lat' ? ['N','S'] : ['E','W'];
      const direction = `<label>Hemisferio / sentido<select data-answer="direction" aria-label="${step.type === 'coordinate' ? 'Hemisferio' : 'Sentido'} de ${escape(step.title)}"><option value="">Elegir…</option>${options.map(v => `<option value="${v}" ${raw.direction === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>`;
      if (step.type === 'coordinate') return `<div class="lox-coordinate"><label>Grados<input data-answer="degrees" inputmode="numeric" autocomplete="off" value="${escape(raw.degrees || '')}" aria-label="Grados de ${escape(step.title)}"><small>°</small></label><label>Minutos<input data-answer="minutes" inputmode="decimal" autocomplete="off" value="${escape(raw.minutes || '')}" aria-label="Minutos de ${escape(step.title)}"><small>′</small></label>${direction}</div>`;
      return `<div class="lox-coordinate"><label class="lox-value">${step.type === 'directed' ? 'Magnitud' : 'Tu resultado'}<input data-answer="value" inputmode="decimal" autocomplete="off" value="${escape(raw.value || '')}" aria-label="Resultado de ${escape(step.title)}"><small>${step.unit}</small></label>${step.type === 'directed' ? direction : ''}</div>`;
    }
    function render(focus = false) {
      const step = model.steps[active], state = states[active], complete = states.every(s => s.ok), count = states.filter(s => s.ok).length;
      const result = step.type === 'coordinate' ? position(step.v, step.axis) : `${fmt(Math.abs(step.v))}${step.unit}${step.axis ? ' '+hemisphere(step.v, step.axis) : ''}`;
      root.innerHTML = `<div class="lox-page">
        <div class="lox-heading"><div><span class="eyebrow">Loxodrómica · Hoja de cálculo</span><h2 id="lox-title">${model.title}</h2><p>Estima analítica por latitud media · Calculadora en grados (DEG)</p></div><button class="btn alt" data-lox-action="return">Ver carta</button></div>
        <dl class="lox-data">${model.data.map(([label,value]) => `<div><dt>${label}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>
        <div class="lox-context"><strong>Trabaja con Rd verdadero.</strong> El rumbo directo y la velocidad efectiva de estos ejercicios ya describen el desplazamiento. No apliques otra Ct, abatimiento ni corriente.</div>
        <div class="lox-grid"><div>
          <div class="lox-progress"><span>${count} de ${model.steps.length} pasos comprobados</span><span>${complete ? 'Completado' : 'Paso '+(active+1)+' de '+model.steps.length}</span></div>
          <nav class="lox-steps" aria-label="Pasos del cálculo">${model.steps.map((s,i) => `<button data-lox-step="${i}" ${active === i ? 'aria-current="step"' : ''} class="${states[i].ok ? 'is-complete' : ''}" aria-label="Paso ${i+1}: ${s.title}${states[i].ok ? ', comprobado' : ''}">${states[i].ok ? '✓' : i+1}<span>${s.id === 'la' ? 'l₂' : s.id === 'lo' ? 'L₂' : s.id === 'dL' ? 'ΔL' : s.id === 'dl' ? 'Δl' : s.id}</span></button>`).join('')}</nav>
          <section class="lox-step-card" aria-labelledby="lox-step-title"><h3 id="lox-step-title">${active+1}. ${step.title}</h3><p>${escape(step.explanation)}</p><div class="lox-formula">${step.formula}</div>
            <form id="lox-answer-form">${inputs(step, state.raw)}<p class="hint">Tolerancia: ±${fmt(step.type === 'coordinate' ? step.tol * 60 : step.tol, 1)}${step.unit}. Usa coma o punto decimal.</p><div class="lox-actions"><button class="btn" type="submit">Comprobar paso</button><button class="btn alt" type="button" data-lox-action="reveal">${state.revealed ? 'Ocultar cálculo' : 'Ver este cálculo'}</button></div></form>
            <p class="lox-feedback ${state.ok ? 'is-correct' : state.feedback ? 'is-error' : ''}" role="status">${escape(state.feedback || '')}</p>
            ${state.revealed ? `<div class="lox-reveal"><strong>Cálculo explicado</strong><p>${escape(step.calculation)}</p><p>Resultado: <b>${result}</b>. Introdúcelo para comprobar el paso.</p></div>` : ''}
            <div class="lox-pagination"><button class="text-button" data-lox-action="previous" ${active === 0 ? 'disabled' : ''}>← Anterior</button>${active < model.steps.length-1 ? `<button class="btn alt" data-lox-action="next" ${state.ok ? '' : 'disabled'}>Siguiente paso →</button>` : `<span>${complete ? 'Todos los pasos comprobados' : 'Completa los pasos anteriores'}</span>`}</div>
          </section>
          ${complete ? `<section class="lox-summary" role="status"><h3>Ejercicio calculado</h3><p>${model.result}</p><p>${states.some(s => s.revealedOnce) ? 'Has utilizado la explicación en algunos pasos. Puedes generar otro ejercicio para practicar.' : 'Has comprobado todos los pasos.'}${exercise.mc ? ' Ahora marca la opción correspondiente en el cuaderno del examen.' : ''}</p><button class="btn alt" data-lox-action="restart">Repetir este cálculo</button></section>` : ''}
        </div><div class="lox-support">
          <section class="lox-calculator"><h3>Calculadora auxiliar <span>DEG</span></h3><form id="lox-calculator-form"><label for="lox-expression">Escribe una operación</label><input id="lox-expression" autocomplete="off" spellcheck="false" maxlength="160" placeholder="45 × cos(293)" value="${escape(calculator.expression)}"><button class="btn alt" type="submit">Calcular</button><output id="lox-calculator-result" aria-live="polite">${escape(calculator.result)}</output></form><p class="hint">+ − × ÷, paréntesis, ^, sen, cos, tan, atan y sqrt. Las funciones trigonométricas trabajan en grados.</p></section>
          <details class="lox-reference"><summary>Fórmulas y unidades</summary><dl><dt>1°</dt><dd>60 minutos (′)</dd><dt>Δl</dt><dd>Minutos de latitud; 1′ equivale a 1 M en el método.</dd><dt>A</dt><dd>Apartamiento en millas, hacia E o W.</dd><dt>ΔL</dt><dd>Minutos de longitud. No equivalen directamente a millas.</dd><dt>lm</dt><dd>Latitud media, en grados al usar el coseno.</dd><dt>Cuadrantes</dt><dd>N/E: R = θ; S/E: 180° − θ; S/W: 180° + θ; N/W: 360° − θ.</dd></dl><p>Directo: Δl = D cos Rd; A = D sen Rd; ΔL = A / cos lm.</p><p>Inverso: A = ΔL cos lm; tg θ = |A| / |Δl|; D = √(Δl² + A²).</p><p class="hint">Método aproximado de latitud media para estos ejercicios. No es un cálculo loxodrómico exacto sobre un elipsoide.</p><a class="text-button" href="https://en.wikisource.org/wiki/The_American_Practical_Navigator/Chapter_24#2415._Middle-Latitude_Sailing" target="_blank" rel="noopener noreferrer">Referencia: Bowditch, latitud media ↗</a></details>
        </div></div></div>`;
      if (focus) root.querySelector('[data-answer]')?.focus({preventScroll:true});
    }
    root.addEventListener('input', event => {
      if (event.target.matches('[data-answer]')) editAnswer(event.target);
      if (event.target.id === 'lox-expression') calculator.expression = event.target.value;
    });
    root.addEventListener('change', event => {
      if (event.target.matches('[data-answer]')) editAnswer(event.target);
    });
    root.addEventListener('submit', event => {
      event.preventDefault(); saveDraft();
      if (event.target.id === 'lox-calculator-form') {
        try { calculator.result = fmt(calculate(calculator.expression), 6); } catch (error) { calculator.result = error.message; }
        field('lox-calculator-result').textContent = calculator.result; return;
      }
      if (event.target.id === 'lox-answer-form') {
        const result = check(model.steps[active], states[active].raw); states[active].ok = result.ok; states[active].feedback = result.message; render();
        root.querySelector('[data-lox-action="next"]:not(:disabled)')?.focus({preventScroll:true});
      }
    });
    root.addEventListener('click', event => {
      const target = event.target.closest('[data-lox-step],[data-lox-action]');
      if (!target || target.disabled) return;
      saveDraft();
      if (target.dataset.loxStep != null) active = Number(target.dataset.loxStep);
      else switch (target.dataset.loxAction) {
        case 'return': onReturn(); return;
        case 'next': if (!states[active].ok) return; active++; break;
        case 'previous': active--; break;
        case 'reveal': states[active].revealed = !states[active].revealed; states[active].revealedOnce = true; break;
        case 'restart': states = model.steps.map(() => ({raw:{}, ok:false})); active = 0; break;
      }
      render(target.dataset.loxAction !== 'reveal');
    });
    return {setExercise(next) {
      if (next === exercise) return;
      exercise = next; model = lesson(next.spec[0], next.spec[1]); active = 0;
      states = model.steps.map(() => ({raw:{}, ok:false})); calculator = {expression:'', result:''}; render(); root.scrollTop = 0;
    }};
  }
  return {direct, inverse, lesson, position, number, answer, check, calculate, mount};
});
