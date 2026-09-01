// ============================================================
// ITAITINGA MTB RACE — SISTEMA DE INSCRIÇÕES
// Google Apps Script + Google Sheets
// ============================================================

const PLANILHA_ID = "1AWB8PdEAzEcCmiobpr-y0qLLNY6j1eZF0W-6CnrijSQ";
const ABA_INSCRICOES = "Inscrições";

function configurarPlanilha() {
  const planilha = SpreadsheetApp.openById(PLANILHA_ID);
  let aba = planilha.getSheetByName(ABA_INSCRICOES);

  if (!aba) {
    aba = planilha.insertSheet(ABA_INSCRICOES);
  }

  if (aba.getLastRow() === 0) {
    aba.appendRow([
      "Nº Inscrição",
      "Data/Hora",
      "Nome Completo",
      "CPF",
      "Data de Nascimento",
      "E-mail",
      "WhatsApp",
      "Cidade",
      "Categoria",
      "Contato de Emergência",
      "Pagamento",
      "Inscrição"
    ]);

    aba.getRange(1, 1, 1, 12).setFontWeight("bold");
    aba.setFrozenRows(1);
    aba.autoResizeColumns(1, 12);
  } else {
    garantirColunasControle(aba);
  }

  return "Planilha configurada com sucesso!";
}


// ============================================================
// GARANTE AS COLUNAS DE PAGAMENTO E INSCRIÇÃO
// ============================================================

function garantirColunasControle(aba) {

  const headers = aba
    .getRange(1, 1, 1, Math.max(aba.getLastColumn(), 12))
    .getValues()[0];

  // Mantém compatibilidade com a planilha antiga.
  if (!headers.includes("Pagamento")) {
    aba.getRange(1, 11).setValue("Pagamento");
  }

  if (!headers.includes("Inscrição")) {
    aba.getRange(1, 12).setValue("Inscrição");
  }

  aba.getRange(1, 1, 1, 12).setFontWeight("bold");
  aba.setFrozenRows(1);
}


// ============================================================
// RECEBE INSCRIÇÃO DO SITE
// ============================================================

function doPost(e) {

  try {

    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Nenhum dado foi recebido.");
    }

    const dados = JSON.parse(e.postData.contents);

    const planilha = SpreadsheetApp.openById(PLANILHA_ID);
    let aba = planilha.getSheetByName(ABA_INSCRICOES);

    if (!aba) {
      configurarPlanilha();
      aba = planilha.getSheetByName(ABA_INSCRICOES);
    }

    garantirColunasControle(aba);

    const cpf = String(dados.cpf || "").replace(/\D/g, "");

    if (!cpf) {
      throw new Error("CPF não informado.");
    }

    const ultimaLinha = aba.getLastRow();

    if (ultimaLinha > 1) {

      const cpfs = aba
        .getRange(2, 4, ultimaLinha - 1, 1)
        .getValues()
        .flat()
        .map(valor => String(valor).replace(/\D/g, ""));

      const indiceCPFExistente = cpfs.indexOf(cpf);

      if (indiceCPFExistente >= 0) {

        const linhaExistente = indiceCPFExistente + 2;
        const dadosExistentes = aba
          .getRange(linhaExistente, 1, 1, 12)
          .getValues()[0];

        return resposta({
          sucesso: false,
          cpf_existente: true,
          mensagem: "Este CPF já possui uma inscrição.",
          numero_inscricao: dadosExistentes[0] || "",
          nome: dadosExistentes[2] || "",
          categoria: dadosExistentes[8] || "",
          pagamento: dadosExistentes[10] || "Pendente",
          status: dadosExistentes[11] || "Pendente"
        });
      }
    }

    const numeroInscricao = gerarNumeroInscricao(aba);

    aba.appendRow([
      numeroInscricao,
      new Date(),
      dados.nome || "",
      cpf,
      dados.nascimento || "",
      dados.email || "",
      dados.telefone || "",
      dados.cidade || "",
      dados.categoria || "",
      dados.contato_emergencia || "",
      "Pendente",
      "Pendente"
    ]);

    return resposta({
      sucesso: true,
      mensagem: "Inscrição realizada com sucesso!",
      numero_inscricao: numeroInscricao
    });

  } catch (erro) {

    return resposta({
      sucesso: false,
      mensagem: erro.message
    });
  }
}


// ============================================================
// CONSULTA PÚBLICA POR CPF
//
// Retorna somente dados mínimos:
// - número da inscrição
// - nome
// - categoria
// - status da inscrição
//
// NÃO retorna CPF, e-mail, telefone ou contato de emergência.
// ============================================================

function doGet(e) {

  try {

    const acao = e && e.parameter ? e.parameter.acao : "";

    if (acao !== "consultar") {
      return resposta({
        sucesso: false,
        mensagem: "Ação não informada."
      });
    }

    const cpf = String(e.parameter.cpf || "").replace(/\D/g, "");

    if (cpf.length !== 11) {
      return resposta({
        sucesso: false,
        mensagem: "Informe um CPF válido."
      });
    }

    const planilha = SpreadsheetApp.openById(PLANILHA_ID);
    const aba = planilha.getSheetByName(ABA_INSCRICOES);

    if (!aba || aba.getLastRow() < 2) {
      return resposta({
        sucesso: false,
        mensagem: "Inscrição não encontrada."
      });
    }

    const dados = aba.getDataRange().getValues();
    const headers = dados[0];

    const idxNumero = headers.indexOf("Nº Inscrição");
    const idxNome = headers.indexOf("Nome Completo");
    const idxCPF = headers.indexOf("CPF");
    const idxCategoria = headers.indexOf("Categoria");
    const idxStatus = headers.indexOf("Inscrição");
    const idxPagamento = headers.indexOf("Pagamento");

    for (let i = 1; i < dados.length; i++) {

      const cpfPlanilha =
        String(dados[i][idxCPF] || "").replace(/\D/g, "");

      if (cpfPlanilha === cpf) {

        return resposta({
          sucesso: true,
          numero_inscricao: dados[i][idxNumero] || "",
          nome: dados[i][idxNome] || "",
          categoria: dados[i][idxCategoria] || "",
          status: idxStatus >= 0
            ? dados[i][idxStatus] || "Pendente"
            : "Pendente",
          pagamento: idxPagamento >= 0
            ? dados[i][idxPagamento] || "Pendente"
            : "Pendente"
        });
      }
    }

    return resposta({
      sucesso: false,
      mensagem: "Nenhuma inscrição encontrada para este CPF."
    });

  } catch (erro) {

    return resposta({
      sucesso: false,
      mensagem: "Não foi possível realizar a consulta."
    });
  }
}


// ============================================================
// GERA NÚMERO DA INSCRIÇÃO
// ============================================================

function gerarNumeroInscricao(aba) {

  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha <= 1) {
    return "001";
  }

  const ultimoNumero = aba
    .getRange(ultimaLinha, 1)
    .getValue();

  const numero = parseInt(ultimoNumero, 10);

  const proximo = isNaN(numero)
    ? ultimaLinha
    : numero + 1;

  return String(proximo).padStart(3, "0");
}


// ============================================================
// RESPOSTA JSON
// ============================================================

function resposta(objeto) {

  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}
