(async () => {
  try {
    const response = await fetch('data/evento.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const cfg = await response.json();
    window.EVENTO_CONFIG = cfg;
    document.querySelectorAll('[data-config]').forEach(el => {
      const key = el.dataset.config;
      let value = cfg[key];
      if (key === 'local') value = [cfg.cidade, cfg.estado].filter(Boolean).join(' - ').toUpperCase();
      if (value !== undefined && value !== null && String(value).trim() !== '') el.textContent = value;
    });
    const reg = document.getElementById('regulamentoConfiguravel');
    if (reg && cfg.regulamento) reg.textContent = cfg.regulamento;
    window.dispatchEvent(new CustomEvent('evento-config-carregado', { detail: cfg }));
  } catch (err) {
    console.warn('Configuração local do evento não carregada; usando conteúdo padrão.', err);
  }
})();
