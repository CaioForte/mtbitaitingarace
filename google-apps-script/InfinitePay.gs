/* =====================================================
   INFINITEPAY - TESTE DE CHECKOUT
   ===================================================== */

function testarCheckoutInfinitePay() {

  const handle = 'caioforte';

  const valor = 10.00;

  const orderNsu =
    'TESTE-MTB-' +
    Utilities.getUuid();

  const payload = {

    handle: handle,

    order_nsu: orderNsu,

    items: [

      {
        quantity: 1,

        price: Math.round(valor * 100),

        description:
          'TESTE - Inscrição Itaitinga MTB Race 2026'
      }

    ],

    customer: {

      name:
        'Participante Teste',

      email:
        'teste@exemplo.com',

      phone_number:
        '+5585999999999'

    }

  };

  const options = {

    method: 'post',

    contentType:
      'application/json',

    payload:
      JSON.stringify(payload),

    muteHttpExceptions:
      true

  };

  const resposta =
    UrlFetchApp.fetch(
      'https://api.checkout.infinitepay.io/links',
      options
    );

  const codigo =
    resposta.getResponseCode();

  const texto =
    resposta.getContentText();

  Logger.log(
    'HTTP: ' + codigo
  );

  Logger.log(
    'Resposta InfinitePay: ' + texto
  );

  if (
    codigo < 200 ||
    codigo >= 300
  ) {

    throw new Error(
      'Erro ao criar checkout InfinitePay. HTTP ' +
      codigo +
      ': ' +
      texto
    );

  }

  const resultado =
    JSON.parse(texto);

  if (!resultado.url) {

    throw new Error(
      'A InfinitePay não retornou a URL do checkout. ' +
      texto
    );

  }

  Logger.log(
    'CHECKOUT GERADO:'
  );

  Logger.log(
    resultado.url
  );

  return resultado.url;
}

/* =====================================================
   CRIAR CHECKOUT INFINITEPAY
   ===================================================== */

function criarCheckoutInfinitePay_(
  numeroInscricao,
  valor,
  cliente
) {

  const handle = 'caioforte';

  const orderNsu =
    'MTB-2026-' +
    String(numeroInscricao);

  const payload = {

    handle: handle,

    order_nsu: orderNsu,

    items: [

      {
        quantity: 1,

        price:
          Math.round(
            Number(valor) * 100
          ),

        description:
          'Inscrição Itaitinga MTB Race 2026'
      }

    ],

    customer: {

      name:
        String(
          cliente.nome || ''
        ),

      email:
        String(
          cliente.email || ''
        ),

      phone_number:
        String(
          cliente.telefone || ''
        )

    },

    webhook_url:
      'https://script.google.com/macros/s/AKfycbzBL3zWUZLpSDvR_Oomuk50_3YkfEWb_WlwhALZAO1d3BbXOvPAE64gHwZ8SiTVAyHf/exec',

    redirect_url:
      'https://itaitingamtbrace.pages.dev/'
  };


  const options = {

    method: 'post',

    contentType:
      'application/json',

    payload:
      JSON.stringify(payload),

    muteHttpExceptions:
      true

  };


  const resposta =
    UrlFetchApp.fetch(
      'https://api.checkout.infinitepay.io/links',
      options
    );


  const codigo =
    resposta.getResponseCode();

  const texto =
    resposta.getContentText();


  Logger.log(
    'InfinitePay HTTP: ' +
    codigo
  );

  Logger.log(
    'InfinitePay resposta: ' +
    texto
  );


  if (
    codigo < 200 ||
    codigo >= 300
  ) {

    throw new Error(
      'Erro ao criar checkout InfinitePay. HTTP ' +
      codigo +
      ': ' +
      texto
    );

  }


  const resultado =
    JSON.parse(texto);


  if (!resultado.url) {

    throw new Error(
      'A InfinitePay não retornou a URL do checkout. ' +
      texto
    );

  }


  return {

    url:
      resultado.url,

    order_nsu:
      orderNsu

  };

}


function testeCriarCheckoutReal() {

  const resultado =
    criarCheckoutInfinitePay_(
      999998,
      10.00,
      {
        nome:
          'TESTE CHECKOUT MTB',

        email:
          'seuemail@teste.com',

        telefone:
          '+5585999999999'
      }
    );


  Logger.log(
    'ORDER NSU: ' +
    resultado.order_nsu
  );

  Logger.log(
    'CHECKOUT: ' +
    resultado.url
  );

}


/* =====================================================
   WEBHOOK INFINITEPAY
   Atualiza a inscrição após pagamento aprovado
   ===================================================== */

function processarWebhookInfinitePay_(body) {

  body = body || {};

  const orderNsu =
    String(body.order_nsu || '').trim();

  const transactionNsu =
    String(body.transaction_nsu || '').trim();

  const invoiceSlug =
    String(body.invoice_slug || '').trim();

  const captureMethod =
    String(body.capture_method || '').trim();

  const receiptUrl =
    String(body.receipt_url || '').trim();


  if (!orderNsu) {
    throw new Error(
      'Webhook InfinitePay sem order_nsu.'
    );
  }


  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        CONFIG.SHEETS.INSCRICOES
      );


  if (!sheet) {
    throw new Error(
      'A aba Inscrições não existe.'
    );
  }


  const dados =
    sheet
      .getDataRange()
      .getValues();


  let linhaEncontrada = -1;


  /* ---------------------------------------------
     Procura pelo OrderNSU na coluna L
     --------------------------------------------- */

  for (
    let i = 1;
    i < dados.length;
    i++
  ) {

    if (
      String(dados[i][11] || '').trim() ===
      orderNsu
    ) {

      linhaEncontrada =
        i + 1;

      break;
    }
  }


  /* ---------------------------------------------
     Compatibilidade com inscrições antigas

     A inscrição #009, por exemplo, ainda tem:
     order_nsu: MTB-2026-9
     na coluna K.
     --------------------------------------------- */

  if (linhaEncontrada === -1) {

    for (
      let i = 1;
      i < dados.length;
      i++
    ) {

      const observacao =
        String(
          dados[i][10] || ''
        ).trim();

      if (
        observacao.indexOf(
          'order_nsu: ' + orderNsu
        ) !== -1
      ) {

        linhaEncontrada =
          i + 1;

        break;
      }
    }
  }


  if (linhaEncontrada === -1) {

    throw new Error(
      'Não foi encontrada inscrição para o OrderNSU: ' +
      orderNsu
    );
  }


  /* ---------------------------------------------
     Forma de pagamento
     --------------------------------------------- */

  let formaPagamento =
    captureMethod;


  if (
    captureMethod ===
    'credit_card'
  ) {

    formaPagamento =
      'Cartão de crédito';

  } else if (
    captureMethod ===
    'pix'
  ) {

    formaPagamento =
      'PIX';
  }


  /* ---------------------------------------------
     Atualiza a inscrição
     --------------------------------------------- */

  // G - Pagamento
  sheet
    .getRange(
      linhaEncontrada,
      7
    )
    .setValue(
      'Pago'
    );


  // H - StatusInscricao
  sheet
    .getRange(
      linhaEncontrada,
      8
    )
    .setValue(
      'Confirmado'
    );


  // L - OrderNSU
  sheet
    .getRange(
      linhaEncontrada,
      12
    )
    .setValue(
      orderNsu
    );


  // M - FormaPagamento
  sheet
    .getRange(
      linhaEncontrada,
      13
    )
    .setValue(
      formaPagamento
    );


  // N - TransactionNSU
  sheet
    .getRange(
      linhaEncontrada,
      14
    )
    .setValue(
      transactionNsu
    );


  // O - ComprovantePagamento
  sheet
    .getRange(
      linhaEncontrada,
      15
    )
    .setValue(
      receiptUrl
    );


  // P - DataPagamento
  sheet
    .getRange(
      linhaEncontrada,
      16
    )
    .setValue(
      new Date()
    );


  SpreadsheetApp.flush();


  return {

    recebido: true,

    atualizado: true,

    order_nsu:
      orderNsu,

    transaction_nsu:
      transactionNsu,

    forma_pagamento:
      formaPagamento,

    linha:
      linhaEncontrada,

    mensagem:
      'Pagamento processado com sucesso.'
  };
}