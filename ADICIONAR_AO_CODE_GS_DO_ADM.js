/* ============================================================
   API PÚBLICA — SITE DE INSCRIÇÕES
   ============================================================

   ADICIONE ESTE BLOCO AO FINAL DO Code.gs DO PAINEL ADM.

   Ele usa SpreadsheetApp.getActiveSpreadsheet(), portanto
   trabalha na MESMA planilha do Painel ADM.

   Depois de adicionar, publique uma NOVA VERSÃO do Web App.
*/

function publicConsultarInscricao_(cpf) {
  const cpfLimpo = limparCpfPublico_(cpf);

  if (cpfLimpo.length !== 11) {
    return {
      sucesso: false,
      mensagem: 'Informe um CPF válido para consultar.'
    };
  }

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEETS.INSCRICOES);

  if (!sheet) {
    throw new Error('A aba Inscrições não existe.');
  }

  const dados = sheet.getDataRange().getValues();

  for (let i = 1; i < dados.length; i++) {
    const linha = dados[i];
    const cpfLinha = limparCpfPublico_(linha[2]);

    if (cpfLinha && cpfLinha === cpfLimpo) {
      return {
        sucesso: true,
        numero_inscricao: linha[0] || '',
        nome: linha[1] || '',
        categoria: linha[5] || '',
        pagamento: linha[6] || 'Pendente',
        status: linha[7] || 'Pendente'
      };
    }
  }

  return {
    sucesso: false,
    mensagem: 'Não localizamos uma inscrição para este CPF.'
  };
}

function publicObterCategorias_() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEETS.CONFIG);

  if (!sheet) {
    throw new Error('A aba Configurações não existe.');
  }

  const dados = sheet.getDataRange().getValues();
  const categorias = [];

  // 1) Formato recomendado: Configuracao = Categorias
  // Valor = JSON: [{"nome":"Elite Masculino","valor":80}]
  for (let i = 1; i < dados.length; i++) {
    const chave = String(dados[i][0] || '').trim();
    if (normalizarPublico_(chave) !== 'categorias') continue;

    const bruto = dados[i][1];
    if (!bruto) break;

    try {
      const lista = typeof bruto === 'string' ? JSON.parse(bruto) : bruto;
      if (Array.isArray(lista)) {
        lista.forEach(function(item) {
          const nome = String(item.nome || item.categoria || '').trim();
          const valor = Number(item.valor);
          if (nome && isFinite(valor) && valor >= 0) {
            categorias.push({ nome: nome, valor: valor });
          }
        });
      }
    } catch (e) {
      // Continua para os formatos alternativos abaixo.
    }
    break;
  }

  if (categorias.length) {
    return { sucesso: true, categorias: categorias };
  }

  // 2) Formato de tabela: primeira linha possui Categoria/Valor.
  const cab = dados[0] || [];
  let colCategoria = -1;
  let colValor = -1;

  for (let c = 0; c < cab.length; c++) {
    const h = normalizarPublico_(cab[c]);
    if (h === 'categoria' || h === 'categorias') colCategoria = c;
    if (h === 'valor' || h === 'precocategoria' || h === 'valorcategoria') colValor = c;
  }

  if (colCategoria >= 0 && colValor >= 0) {
    for (let r = 1; r < dados.length; r++) {
      const nome = String(dados[r][colCategoria] || '').trim();
      const valor = Number(dados[r][colValor]);
      if (nome && isFinite(valor) && valor >= 0) {
        categorias.push({ nome: nome, valor: valor });
      }
    }
  }

  if (categorias.length) {
    return { sucesso: true, categorias: categorias };
  }

  // 3) Fallback: categorias já existentes na aba Inscrições.
  const ins = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEETS.INSCRICOES);

  if (ins) {
    const linhas = ins.getDataRange().getValues();
    const mapa = {};

    for (let i = 1; i < linhas.length; i++) {
      const nome = String(linhas[i][5] || '').trim();
      const valor = Number(linhas[i][8] || 0);
      if (!nome) continue;

      const chave = normalizarPublico_(nome);
      if (!mapa[chave]) {
        mapa[chave] = {
          nome: nome,
          valor: isFinite(valor) && valor >= 0 ? valor : 0
        };
      }
    }

    Object.keys(mapa).forEach(function(k) {
      categorias.push(mapa[k]);
    });
  }

  // 4) Se só existe ValorInscricao, aplica esse valor às categorias
  // encontradas. Se não houver categorias, retorna lista vazia.
  if (categorias.length) {
    return { sucesso: true, categorias: categorias };
  }

  return { sucesso: true, categorias: [] };
}

function publicCadastrarInscricao_(dados) {
  dados = dados || {};

  const nome = String(dados.nome || '').trim();
  const cpf = limparCpfPublico_(dados.cpf);
  const email = String(dados.email || '').trim();
  const telefone = String(dados.telefone || '').trim();
  const categoria = String(dados.categoria || '').trim();

  if (!nome) throw new Error('Informe o nome completo.');
  if (!validarCpfPublico_(cpf)) throw new Error('CPF inválido. Confira o número informado.');
  if (!email) throw new Error('Informe o e-mail.');
  if (!categoria) throw new Error('Selecione uma categoria.');

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEETS.INSCRICOES);

  if (!sheet) throw new Error('A aba Inscrições não existe.');

  const dadosPlanilha = sheet.getDataRange().getValues();

  for (let i = 1; i < dadosPlanilha.length; i++) {
    if (limparCpfPublico_(dadosPlanilha[i][2]) === cpf) {
      return {
        sucesso: false,
        cpf_existente: true,
        duplicado: true,
        mensagem: 'Este CPF já possui uma inscrição.',
        numero_inscricao: dadosPlanilha[i][0] || '',
        nome: dadosPlanilha[i][1] || '',
        categoria: dadosPlanilha[i][5] || '',
        pagamento: dadosPlanilha[i][6] || 'Pendente',
        status: dadosPlanilha[i][7] || 'Pendente'
      };
    }
  }

  const categorias = publicObterCategorias_().categorias || [];
  const config = categorias.find(function(item) {
    return normalizarPublico_(item.nome) === normalizarPublico_(categoria);
  });

  if (!config) {
    throw new Error('A categoria selecionada não está cadastrada nas Configurações.');
  }

  const valor = Number(config.valor);
  if (!isFinite(valor) || valor < 0) {
    throw new Error('O valor da categoria é inválido.');
  }

  let maior = 0;
  for (let i = 1; i < dadosPlanilha.length; i++) {
    const n = Number(dadosPlanilha[i][0]);
    if (isFinite(n) && n > maior) maior = n;
  }

  const numero = maior + 1;

  sheet.appendRow([
    numero,
    nome,
    cpf,
    email,
    telefone,
    config.nome,
    'Pendente',
    'Pendente',
    valor,
    new Date(),
    ''
  ]);

  SpreadsheetApp.flush();

  return {
    sucesso: true,
    mensagem: 'Inscrição realizada com sucesso!',
    numero_inscricao: numero,
    nome: nome,
    categoria: config.nome,
    valor: valor,
    pagamento: 'Pendente',
    status: 'Pendente'
  };
}

function limparCpfPublico_(cpf) {
  return String(cpf || '').replace(/\D/g, '');
}

function normalizarPublico_(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function validarCpfPublico_(cpf) {
  cpf = limparCpfPublico_(cpf);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
  let resto = soma % 11;
  let d1 = resto < 2 ? 0 : 11 - resto;
  if (d1 !== Number(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
  resto = soma % 11;
  let d2 = resto < 2 ? 0 : 11 - resto;

  return d2 === Number(cpf[10]);
}
