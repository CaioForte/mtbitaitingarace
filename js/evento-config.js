(async () => {
  const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  const DIAS = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

  function dataLocal(iso) {
    if (!iso) return null;
    const [y,m,d] = String(iso).split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 12, 0, 0);
  }

  function derivados(cfg) {
    const dt = dataLocal(cfg.dataEvento);
    const ano = dt ? dt.getFullYear() : new Date().getFullYear();
    const modalidade = (cfg.modalidade || 'XCP').toUpperCase();
    const cidade = cfg.cidade || 'Itaitinga';
    const estado = (cfg.estado || 'CE').toUpperCase();
    const tipo = cfg.tipoProva || 'Mountain Bike';
    const distancia = cfg.distancia || '50';
    const altimetria = cfg.altimetria || '1100';
    return {
      ...cfg,
      local: `${cidade} - ${estado}`.toUpperCase(),
      localNormal: `${cidade} - ${estado}`,
      localExtenso: cfg.localExtenso || `${cidade.toUpperCase()} • ${estado === 'CE' ? 'CEARÁ' : estado}`,
      dataEventoFormatada: cfg.dataEventoFormatada || (dt ? `${String(dt.getDate()).padStart(2,'0')} ${MESES[dt.getMonth()]} ${ano}` : ''),
      diaSemana: cfg.diaSemana || (dt ? DIAS[dt.getDay()] : ''),
      heroLinhaSuperior: cfg.heroLinhaSuperior || `${modalidade} ${ano} • ${tipo.toUpperCase()}`,
      heroTitulo: cfg.heroTitulo || 'SUPERE SEUS LIMITES.',
      heroDestaque: cfg.heroDestaque || 'VIVA ESSA AVENTURA!',
      tipoProva: tipo,
      siglaTipo: cfg.siglaTipo || 'MTB',
      edicaoModalidade: cfg.edicaoModalidade || `${modalidade} ${ano}`,
      nomeEventoUpper: (cfg.nomeEvento || 'Itaitinga MTB Race').toUpperCase(),
      sobreDescricao: cfg.sobreDescricao || `${cfg.nomeEvento || 'Itaitinga MTB Race'} — ${modalidade} ${ano} reúne trilha, velocidade e superação em um percurso de aproximadamente ${distancia} km e ${altimetria} m+ de altimetria.`
    };
  }

  function aplicar(cfgOriginal) {
    const cfg = derivados(cfgOriginal || {});
    window.EVENTO_CONFIG = cfg;
    document.querySelectorAll('[data-config]').forEach(el => {
      const key = el.dataset.config;
      const value = cfg[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') el.textContent = value;
    });
    const reg = document.getElementById('regulamentoConfiguravel');
    if (reg && cfg.regulamento) reg.textContent = cfg.regulamento;
    window.dispatchEvent(new CustomEvent('evento-config-carregado', { detail: cfg }));
  }

  try {
    const response = await fetch('data/evento.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    aplicar(await response.json());
  } catch (err) {
    console.warn('Configuração local do evento não carregada; usando conteúdo padrão.', err);
  }
})();
