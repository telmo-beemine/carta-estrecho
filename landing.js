(() => {
  'use strict';

  // Both tab groups support click, arrows, Home and End.
  function bindTabs(selector, onSelect) {
    const group = document.querySelector(selector);
    if (!group) return;
    const tabs = [...group.querySelectorAll('[role="tab"]')];
    function select(tab) {
      tabs.forEach(button => {
        const selected = button === tab;
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
      });
      onSelect(tab);
    }
    group.addEventListener('click', event => {
      const tab = event.target.closest('[role="tab"]');
      if (tabs.includes(tab)) select(tab);
    });
    group.addEventListener('keydown', event => {
      const index = tabs.indexOf(event.target);
      if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      select(tabs[next]);
      tabs[next].focus();
    });
    return select;
  }

  bindTabs('.preview-tabs', tab => {
    ['misiones', 'examenes'].forEach(name => {
      document.getElementById('preview-' + name).hidden = name !== tab.dataset.preview;
    });
  });

  // A fixed, explicitly illustrative example; it does not alter chart progress.
  const steps = [
    {
      label: 'De aguja a verdadero',
      equation: 'Da <strong>098°</strong> <span>→</span> Dv <strong>?</strong>',
      description: 'Tu compás marca una demora de 098° y la corrección total es +8°. ¿Qué demora debes trazar sobre la carta?',
      feedback: 'Primero identifica los datos: Da = 098° y Ct = +8°.',
      next: 'Ver el cálculo',
    },
    {
      label: 'Aplica la corrección total',
      equation: '<strong>098°</strong> <span>+</span> <strong>8°</strong> <span>=</span> <strong>106°</strong>',
      description: 'De aguja a verdadero se suma la corrección total, con su signo: Dv = Da + Ct.',
      feedback: 'La Ct es positiva. Sumamos +8° a los 098° que marca la aguja.',
      next: 'Comprobar el resultado',
    },
    {
      label: 'Ya sabes qué trazar',
      equation: 'Dv <strong>106°</strong> <span>✓</span>',
      description: 'Sobre la carta trazas la demora verdadera de 106°. En las misiones, la herramienta comprueba tu trazo y te ayuda si aplicas la Ct con el signo equivocado.',
      feedback: 'Correcto: has convertido la demora de aguja en verdadera.',
      next: 'Volver a ver el ejemplo',
    },
  ];
  let activeStep = 0;
  const selectStep = bindTabs('.demo-tabs', tab => {
    activeStep = Number(tab.dataset.demo);
    const step = steps[activeStep];
    document.getElementById('demo-label').textContent = step.label;
    document.getElementById('demo-equation').innerHTML = step.equation;
    document.getElementById('demo-description').textContent = step.description;
    const feedback = document.getElementById('demo-feedback');
    feedback.textContent = step.feedback;
    feedback.classList.toggle('is-correct', activeStep === steps.length - 1);
    document.getElementById('demo-panel').setAttribute('aria-labelledby', tab.id);
    document.getElementById('demo-next').innerHTML = step.next + ' <span aria-hidden="true">→</span>';
  });
  document.getElementById('demo-next').addEventListener('click', () => {
    const next = (activeStep + 1) % steps.length;
    selectStep(document.getElementById('demo-tab-' + next));
    document.getElementById('demo-panel').focus({ preventScroll: true });
  });
})();
