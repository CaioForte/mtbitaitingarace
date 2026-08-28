// ============================================================
// ITAITINGA MTB RACE - MAIN.JS
// INTEGRAÇÃO COM GOOGLE SHEETS / APPS SCRIPT
// ============================================================

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzBL3zWUZLpSDvR_Oomuk50_3YkfEWb_WlwhALZAO1d3BbXOvPAE64gHwZ8SiTVAyHf/exec";

const WHATSAPP_INSCRICOES = "5585991680867";

document.addEventListener("DOMContentLoaded", () => {

  const EVENT_DATE = "2026-11-01T08:00:00-03:00";

  // ----------------------------------------------------------
  // UTILITÁRIOS
  // ----------------------------------------------------------

  function somenteNumeros(valor) {
    return String(valor || "").replace(/\D/g, "");
  }

  function formatarCPF(cpf) {
    const value = somenteNumeros(cpf).slice(0, 11);

    if (value.length > 9) {
      return value.replace(
        /(\d{3})(\d{3})(\d{3})(\d{0,2})/,
        "$1.$2.$3-$4"
      );
    }

    if (value.length > 6) {
      return value.replace(
        /(\d{3})(\d{3})(\d{0,3})/,
        "$1.$2.$3"
      );
    }

    if (value.length > 3) {
      return value.replace(
        /(\d{3})(\d{0,3})/,
        "$1.$2"
      );
    }

    return value;
  }

  function cpfValido(valor) {
    const cpf = somenteNumeros(valor);

    if (
      cpf.length !== 11 ||
      /^(\d)\1{10}$/.test(cpf)
    ) {
      return false;
    }

    let soma = 0;

    for (let i = 0; i < 9; i++) {
      soma += Number(cpf[i]) * (10 - i);
    }

    let resto = soma % 11;
    const digito1 =
      resto < 2 ? 0 : 11 - resto;

    if (digito1 !== Number(cpf[9])) {
      return false;
    }

    soma = 0;

    for (let i = 0; i < 10; i++) {
      soma += Number(cpf[i]) * (11 - i);
    }

    resto = soma % 11;

    const digito2 =
      resto < 2 ? 0 : 11 - resto;

    return digito2 === Number(cpf[10]);
  }

  function normalizarStatus(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function extrairResultado(envelope) {

    if (
      envelope &&
      envelope.dados &&
      typeof envelope.dados === "object"
    ) {
      return envelope.dados;
    }

    if (
      envelope &&
      envelope.resultado &&
      typeof envelope.resultado === "object"
    ) {
      return envelope.resultado;
    }

    if (
      envelope &&
      envelope.inscricao &&
      typeof envelope.inscricao === "object"
    ) {
      return envelope.inscricao;
    }

    return envelope || {};
  }

  function resultadoTemInscricao(resultado) {
    return !!(
      resultado &&
      (
        resultado.nome !== undefined ||
        resultado.atleta !== undefined ||
        resultado.cpf !== undefined ||
        resultado.numero_inscricao !== undefined ||
        resultado.numeroInscricao !== undefined ||
        resultado.categoria !== undefined
      )
    );
  }

  function resultadoEncontrado(envelope, resultado) {

    if (resultado?.encontrado === true) {
      return true;
    }

    if (resultado?.encontrada === true) {
      return true;
    }

    if (resultado?.sucesso === true) {
      return true;
    }

    if (
      envelope?.sucesso === true &&
      resultadoTemInscricao(resultado)
    ) {
      return true;
    }

    return false;
  }

  function obterValor(obj, ...chaves) {

    for (const chave of chaves) {

      if (
        obj &&
        obj[chave] !== undefined &&
        obj[chave] !== null &&
        String(obj[chave]).trim() !== ""
      ) {
        return obj[chave];
      }
    }

    return "";
  }

  // ----------------------------------------------------------
  // MENU MOBILE
  // ----------------------------------------------------------

  const menuToggle =
    document.getElementById("menuToggle");

  const mainNav =
    document.getElementById("mainNav");

  if (menuToggle && mainNav) {

    menuToggle.addEventListener(
      "click",
      () => {

        const aberto =
          mainNav.classList.toggle("open");

        menuToggle.setAttribute(
          "aria-expanded",
          aberto ? "true" : "false"
        );

        document.body.style.overflow =
          aberto ? "hidden" : "";
      }
    );

    mainNav
      .querySelectorAll("a")
      .forEach(link => {

        link.addEventListener(
          "click",
          () => {

            mainNav.classList.remove("open");

            menuToggle.setAttribute(
              "aria-expanded",
              "false"
            );

            document.body.style.overflow = "";
          }
        );
      });
  }

  // ----------------------------------------------------------
  // HEADER
  // ----------------------------------------------------------

  const header =
    document.querySelector(".site-header");

  function atualizarHeader() {

    if (!header) return;

    header.classList.toggle(
      "scrolled",
      window.scrollY > 40
    );
  }

  window.addEventListener(
    "scroll",
    atualizarHeader,
    { passive: true }
  );

  atualizarHeader();

  // ----------------------------------------------------------
  // CONTAGEM REGRESSIVA
  // ----------------------------------------------------------

  const daysEl =
    document.getElementById("days");

  const hoursEl =
    document.getElementById("hours");

  const minutesEl =
    document.getElementById("minutes");

  const secondsEl =
    document.getElementById("seconds");

  function atualizarContagem() {

    const alvo =
      new Date(EVENT_DATE).getTime();

    let distancia =
      alvo - Date.now();

    if (distancia < 0) {
      distancia = 0;
    }

    const dias =
      Math.floor(
        distancia /
        (1000 * 60 * 60 * 24)
      );

    const horas =
      Math.floor(
        (distancia /
          (1000 * 60 * 60)) % 24
      );

    const minutos =
      Math.floor(
        (distancia /
          (1000 * 60)) % 60
      );

    const segundos =
      Math.floor(
        (distancia / 1000) % 60
      );

    if (daysEl) {
      daysEl.textContent =
        String(dias).padStart(2, "0");
    }

    if (hoursEl) {
      hoursEl.textContent =
        String(horas).padStart(2, "0");
    }

    if (minutesEl) {
      minutesEl.textContent =
        String(minutos).padStart(2, "0");
    }

    if (secondsEl) {
      secondsEl.textContent =
        String(segundos).padStart(2, "0");
    }
  }

  atualizarContagem();

  setInterval(
    atualizarContagem,
    1000
  );

  // ----------------------------------------------------------
  // ANIMAÇÕES
  // ----------------------------------------------------------

  const revealElements =
    document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {

    const observer =
      new IntersectionObserver(
        entries => {

          entries.forEach(entry => {

            if (entry.isIntersecting) {

              entry.target.classList.add(
                "visible"
              );

              observer.unobserve(
                entry.target
              );
            }
          });
        },
        { threshold: 0.12 }
      );

    revealElements.forEach(
      element =>
        observer.observe(element)
    );

  } else {

    revealElements.forEach(
      element =>
        element.classList.add("visible")
    );
  }

  // ----------------------------------------------------------
  // LINKS PARA O FORMULÁRIO
  // ----------------------------------------------------------

  document
    .querySelectorAll(
      ".js-open-registration"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          const form =
            document.getElementById(
              "form-inscricao"
            );

          if (!form) return;

          event.preventDefault();

          form.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

          setTimeout(
            () =>
              document
                .getElementById("nome")
                ?.focus(),
            650
          );
        }
      );
    });

  // ----------------------------------------------------------
  // CATEGORIAS
  // ----------------------------------------------------------

  const categoriaSelect =
    document.getElementById("categoria");

  const valorInput =
    document.getElementById("valor");

  async function carregarCategorias() {

    if (!categoriaSelect) {
      return;
    }

    categoriaSelect.disabled = true;

    categoriaSelect.innerHTML =
      '<option value="">Carregando categorias...</option>';

    try {

      const response =
        await fetch(
          GOOGLE_SCRIPT_URL +
          "?action=publicCategorias&_=" +
          Date.now(),
          {
            method: "GET",
            cache: "no-store"
          }
        );

      if (!response.ok) {
        throw new Error(
          "Não foi possível carregar as categorias."
        );
      }

      const envelope =
        await response.json();

      const resultado =
        extrairResultado(envelope);

      const categorias =
        Array.isArray(
          resultado.categorias
        )
          ? resultado.categorias
          : Array.isArray(
              envelope.categorias
            )
            ? envelope.categorias
            : [];

      if (!categorias.length) {
        throw new Error(
          envelope.mensagem ||
          resultado.mensagem ||
          "Nenhuma categoria cadastrada."
        );
      }

      categoriaSelect.innerHTML =
        '<option value="">Selecione sua categoria</option>';

      categorias.forEach(categoria => {

        const nome =
          obterValor(
            categoria,
            "nome",
            "categoria",
            "descricao"
          );

        const valor =
          Number(
            obterValor(
              categoria,
              "valor",
              "preco",
              "preço"
            ) || 0
          );

        if (!nome) return;

        const option =
          document.createElement("option");

        option.value = nome;

        option.textContent =
          valor > 0
            ? `${nome} — R$ ${valor.toFixed(2).replace(".", ",")}`
            : nome;

        option.dataset.valor =
          String(valor);

        categoriaSelect.appendChild(
          option
        );
      });

      if (
        categoriaSelect.options.length <= 1
      ) {
        throw new Error(
          "Nenhuma categoria cadastrada."
        );
      }

      categoriaSelect.disabled =
        false;

      function atualizarValor() {

        if (!valorInput) return;

        const option =
          categoriaSelect.options[
            categoriaSelect.selectedIndex
          ];

        if (
          !option ||
          !option.value
        ) {

          valorInput.value =
            "R$ 0,00";

          return;
        }

        const valor =
          Number(
            option.dataset.valor || 0
          );

        valorInput.value =
          "R$ " +
          valor
            .toFixed(2)
            .replace(".", ",");
      }

      categoriaSelect.addEventListener(
        "change",
        atualizarValor
      );

      atualizarValor();

    } catch (erro) {

      console.error(
        "Erro ao carregar categorias:",
        erro
      );

      categoriaSelect.innerHTML =
        '<option value="">Não foi possível carregar as categorias</option>';

      categoriaSelect.disabled =
        true;

      if (valorInput) {
        valorInput.value =
          "R$ 0,00";
      }
    }
  }

  carregarCategorias();

  // ----------------------------------------------------------
  // FORMULÁRIO DE INSCRIÇÃO
  // ----------------------------------------------------------

  const registrationForm =
    document.getElementById(
      "form-inscricao"
    );

  const formSuccess =
    document.getElementById(
      "formSuccess"
    );

  const submitButton =
    registrationForm
      ?.querySelector(
        ".btn-submit"
      );

  // ----------------------------------------------------------
  // ENVIO DA INSCRIÇÃO
  // ----------------------------------------------------------

  if (registrationForm) {

    registrationForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        // Evita duplo envio
        if (
          submitButton &&
          submitButton.disabled
        ) {
          return;
        }

        // ----------------------------------------------
        // VALIDAÇÃO DO FORMULÁRIO
        // ----------------------------------------------

        if (
          !registrationForm.checkValidity()
        ) {

          registrationForm.reportValidity();

          return;
        }

        const cpfCadastro =
          document.getElementById("cpf");

        const cpf =
          somenteNumeros(
            cpfCadastro?.value || ""
          );

        if (
          cpfCadastro &&
          !cpfValido(cpf)
        ) {

          cpfCadastro.setCustomValidity(
            "CPF inválido. Confira o número informado."
          );

          cpfCadastro.reportValidity();

          cpfCadastro.setCustomValidity("");

          return;
        }

        const categoria =
          document.getElementById(
            "categoria"
          )?.value || "";

        if (!categoria) {

          alert(
            "Selecione uma categoria."
          );

          document
            .getElementById("categoria")
            ?.focus();

          return;
        }

        // ----------------------------------------------
        // LIMPA MENSAGEM ANTERIOR
        // ----------------------------------------------

        if (formSuccess) {
          formSuccess.hidden = true;
          formSuccess.innerHTML = "";
        }

        // ----------------------------------------------
        // BOTÃO
        // ----------------------------------------------

        const originalText =
          submitButton
            ? submitButton.innerHTML
            : "ENVIAR INSCRIÇÃO →";

        if (submitButton) {

          submitButton.disabled = true;

          submitButton.innerHTML =
            "ENVIANDO...";
        }

        // ----------------------------------------------
        // DADOS DA INSCRIÇÃO
        // ----------------------------------------------

        const dados = {

          nome:
            document.getElementById(
              "nome"
            )?.value.trim() || "",

          cpf:
            formatarCPF(cpf),

          email:
            document.getElementById(
              "email"
            )?.value.trim() || "",

          telefone:
            document.getElementById(
              "telefone"
            )?.value.trim() || "",

          categoria:
            categoria
        };

        console.log(
          "Enviando inscrição:",
          dados
        );

        // ----------------------------------------------
        // ENVIO PARA O GOOGLE APPS SCRIPT
        // ----------------------------------------------

        try {

          const payload = {
            action: "publicCadastrar",
            nome: dados.nome,
            cpf: dados.cpf,
            email: dados.email,
            telefone: dados.telefone,
            categoria: dados.categoria
          };

          const response =
            await fetch(
              GOOGLE_SCRIPT_URL,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "text/plain;charset=utf-8"
                },

                body:
                  JSON.stringify(payload)
              }
            );

          // --------------------------------------------
          // VERIFICA RESPOSTA HTTP
          // --------------------------------------------

          if (!response.ok) {

            throw new Error(
              "O servidor não conseguiu processar a inscrição."
            );
          }

          // --------------------------------------------
          // LÊ RESPOSTA DO APPS SCRIPT
          // --------------------------------------------

          let envelope;

          try {

            envelope =
              await response.json();

          } catch (jsonError) {

            console.error(
              "Resposta recebida não é JSON:",
              jsonError
            );

            throw new Error(
              "O servidor recebeu a inscrição, mas não retornou uma resposta válida."
            );
          }

          console.log(
            "Resposta do Apps Script:",
            envelope
          );

          const resultado =
            extrairResultado(
              envelope
            );

          // --------------------------------------------
          // IDENTIFICA SUCESSO
          // --------------------------------------------

          const sucesso =
            envelope?.sucesso === true ||
            resultado?.sucesso === true ||
            envelope?.success === true ||
            resultado?.success === true;

          // --------------------------------------------
          // IDENTIFICA DUPLICIDADE
          // --------------------------------------------

          const duplicado =
            resultado?.cpf_existente === true ||
            resultado?.duplicado === true ||
            resultado?.cpfExistente === true ||
            resultado?.cpf_duplicado === true ||
            envelope?.cpf_existente === true ||
            envelope?.duplicado === true ||
            envelope?.cpfExistente === true;

          // --------------------------------------------
          // CPF JÁ CADASTRADO
          // --------------------------------------------

          if (duplicado) {
			  

            if (formSuccess) {

              const numero =
                String(
                  obterValor(
                    resultado,
                    "numero_inscricao",
                    "numeroInscricao",
                    "numero"
                  ) ||
                  obterValor(
                    envelope,
                    "numero_inscricao",
                    "numeroInscricao",
                    "numero"
                  ) ||
                  ""
                ).padStart(3, "0");
				
              formSuccess.innerHTML = `
                <strong>CPF JÁ CADASTRADO</strong>

                <span>
                  Encontramos uma inscrição para este CPF.
                  Não é possível realizar uma segunda inscrição.
                </span>

                ${
                  numero
                    ? `
                      <small>
                        Inscrição encontrada:
                        <strong>#${numero}</strong>
                      </small>
                    `
                    : ""
                }

                <a
                  class="btn btn-primary form-success-consultar"
                  href="#consulta-inscricao"
                >
                  🔎 CONSULTAR MINHA INSCRIÇÃO
                </a>
              `;

              formSuccess.hidden = false;

              formSuccess
                .querySelector(
                  ".form-success-consultar"
                )
                ?.addEventListener(
                  "click",
                  event => {

                    event.preventDefault();

                    const consultaCpf =
                      document.getElementById(
                        "consulta-cpf"
                      );

                    if (consultaCpf) {

                      consultaCpf.value =
                        formatarCPF(
                          dados.cpf
                        );
                    }

                    document
                      .getElementById(
                        "consulta-inscricao"
                      )
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                      });
                  }
                );

            }

            return;
          }

          // --------------------------------------------
          // SE NÃO FOI SUCESSO
          // --------------------------------------------

          if (!sucesso) {

            const mensagem =
              envelope?.mensagem ||
              envelope?.message ||
              resultado?.mensagem ||
              resultado?.message ||
              "Não foi possível realizar a inscrição.";

            throw new Error(
              mensagem
            );
          }

          // --------------------------------------------
          // INSCRIÇÃO REALIZADA COM SUCESSO
          // --------------------------------------------

          const numero =
            String(
              obterValor(
                resultado,
                "numero_inscricao",
                "numeroInscricao",
                "numero"
              ) ||
              obterValor(
                envelope,
                "numero_inscricao",
                "numeroInscricao",
                "numero"
              ) ||
              ""
            ).padStart(3, "0");
			
			

          // --------------------------------------------
          // MENSAGEM WHATSAPP
          // --------------------------------------------

          const mensagem =
            [
              "Olá! Gostaria de confirmar minha inscrição no Itaitinga MTB Race XCP 2026.",
              "",
              "Inscrição: #" + numero,
              "Nome: " + dados.nome,
              "Categoria: " + dados.categoria
            ].join("\n");

          const linkWhatsapp =
            WHATSAPP_INSCRICOES
              ? "https://wa.me/" +
                WHATSAPP_INSCRICOES +
                "?text=" +
                encodeURIComponent(
                  mensagem
                )
              : "";
			  
			  const checkoutUrl =
  obterValor(
    resultado,
    "checkout_url",
    "checkoutUrl",
    "url"
  ) ||
  obterValor(
    envelope,
    "checkout_url",
    "checkoutUrl",
    "url"
  );

          // --------------------------------------------
          // MOSTRA SUCESSO
          // --------------------------------------------

          if (formSuccess) {

  formSuccess.innerHTML = `
    <strong>INSCRIÇÃO RECEBIDA!</strong>

    <span>
      Número da inscrição:
      <strong>#${numero}</strong>
    </span>

    <span>
      Valor da inscrição:
      <strong>
        R$ ${Number(
          obterValor(
            resultado,
            "valor"
          ) ||
          obterValor(
            envelope,
            "valor"
          ) ||
          0
        ).toFixed(2).replace(".", ",")}
      </strong>
    </span>

    ${
      checkoutUrl
        ? `
          <a
            class="btn btn-primary form-success-pagamento"
            href="${checkoutUrl}"
            target="_blank"
            rel="noopener noreferrer"
          >
            💳 PAGAR MINHA INSCRIÇÃO
          </a>
        `
        : `
          <small>
            Sua inscrição foi registrada e está aguardando confirmação.
          </small>
        `
    }

    ${
      linkWhatsapp
        ? `
          <a
            class="btn btn-whatsapp form-success-whatsapp"
            href="${linkWhatsapp}"
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 CONFIRMAR MINHA INSCRIÇÃO PELO WHATSAPP
          </a>
        `
        : ""
    }

    ${
      checkoutUrl
        ? `
          <small>
            Você será direcionado para o ambiente seguro da InfinitePay
            para concluir o pagamento.
          </small>
        `
        : ""
    }
  `;

  formSuccess.hidden =
    false;
}

          // --------------------------------------------
          // LIMPA FORMULÁRIO
          // --------------------------------------------

          registrationForm.reset();

          if (valorInput) {
            valorInput.value =
              "R$ 0,00";
          }

          // --------------------------------------------
          // ROLA ATÉ A MENSAGEM
          // --------------------------------------------

          if (formSuccess) {

            formSuccess.scrollIntoView({
              behavior: "smooth",
              block: "nearest"
            });
          }

        } catch (erro) {

          console.error(
            "Erro ao enviar inscrição:",
            erro
          );

          if (formSuccess) {

            formSuccess.innerHTML = `
              <strong>ERRO AO REALIZAR INSCRIÇÃO</strong>

              <span>
                ${
                  erro?.message ||
                  "Não foi possível enviar a inscrição."
                }
              </span>
            `;

            formSuccess.hidden =
              false;

          } else {

            alert(
              erro?.message ||
              "Não foi possível enviar a inscrição."
            );
          }

        } finally {

          // --------------------------------------------
          // RESTAURA BOTÃO
          // --------------------------------------------

          if (submitButton) {

            submitButton.disabled =
              false;

            submitButton.innerHTML =
              originalText;
          }
        }
      }
    );
  }

  // ----------------------------------------------------------
  // MÁSCARA CPF
  // ----------------------------------------------------------

  const cpfInput =
    document.getElementById(
      "cpf"
    );

  if (cpfInput) {

    cpfInput.addEventListener(
      "input",
      () => {

        cpfInput.value =
          formatarCPF(
            cpfInput.value
          );

        cpfInput.classList.remove(
          "cpf-invalido"
        );
      }
    );

    cpfInput.addEventListener(
      "blur",
      () => {

        if (
          cpfInput.value &&
          !cpfValido(
            cpfInput.value
          )
        ) {

          cpfInput.classList.add(
            "cpf-invalido"
          );

        } else {

          cpfInput.classList.remove(
            "cpf-invalido"
          );
        }
      }
    );
  }

  // ----------------------------------------------------------
  // MÁSCARA WHATSAPP
  // ----------------------------------------------------------

  const phoneInput =
    document.getElementById(
      "telefone"
    );

  if (phoneInput) {

    phoneInput.addEventListener(
      "input",
      () => {

        let value =
          somenteNumeros(
            phoneInput.value
          ).slice(0, 11);

        if (value.length > 10) {

          value =
            value.replace(
              /(\d{2})(\d{5})(\d{0,4})/,
              "($1) $2-$3"
            );

        } else if (
          value.length > 6
        ) {

          value =
            value.replace(
              /(\d{2})(\d{4})(\d{0,4})/,
              "($1) $2-$3"
            );

        } else if (
          value.length > 2
        ) {

          value =
            value.replace(
              /(\d{2})(\d{0,5})/,
              "($1) $2"
            );
        }

        phoneInput.value =
          value;
      }
    );
  }
  
  
    // ----------------------------------------------------------
  // RETORNO DO PAGAMENTO INFINITEPAY
  // ----------------------------------------------------------

  async function processarRetornoInfinitePay() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const orderNsu =
      params.get("order_nsu");

    if (!orderNsu) {
      return;
    }

    console.log(
      "Retorno InfinitePay detectado:",
      orderNsu
    );

    /*
     * Localiza a área de consulta.
     */

    const consulta =
      document.getElementById(
        "consulta-inscricao"
      );

    /*
     * Se a página possuir a seção de consulta,
     * usamos a própria estrutura visual dela.
     */

    if (consulta) {

      consulta.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

    /*
     * Mostra carregamento.
     */

    if (consultaLoading) {

      consultaLoading.hidden =
        false;
    }

    if (consultaErro) {

      consultaErro.hidden =
        true;

      consultaErro.innerHTML =
        "";
    }

    if (consultaResultado) {

      consultaResultado.hidden =
        true;
    }

    /*
     * Faz até 5 tentativas.
     *
     * Isso resolve o caso em que a InfinitePay
     * retorna para o site antes do webhook terminar
     * de atualizar a planilha.
     */

    for (
      let tentativa = 1;
      tentativa <= 5;
      tentativa++
    ) {

      try {

        const url =
          GOOGLE_SCRIPT_URL +
          "?action=publicConsultarOrder" +
          "&order_nsu=" +
          encodeURIComponent(
            orderNsu
          ) +
          "&_=" +
          Date.now();

        const response =
          await fetch(
            url,
            {
              method: "GET",
              cache: "no-store"
            }
          );

        if (!response.ok) {

          throw new Error(
            "Não foi possível consultar o pagamento."
          );
        }

        const envelope =
          await response.json();

        console.log(
          "Retorno da consulta por Order NSU:",
          envelope
        );

        const resultado =
          extrairResultado(
            envelope
          );

        /*
         * Se encontrou a inscrição,
         * continua o processamento.
         */

        if (
          resultado &&
          resultado.encontrado === true
        ) {

          const numero =
            obterValor(
              resultado,
              "numero_inscricao",
              "numeroInscricao",
              "numero"
            );

          const nome =
            obterValor(
              resultado,
              "nome",
              "atleta"
            );

          const categoria =
            obterValor(
              resultado,
              "categoria"
            );

          const pagamento =
            normalizarStatus(
              obterValor(
                resultado,
                "pagamento"
              )
            );

          const status =
            normalizarStatus(
              obterValor(
                resultado,
                "status",
                "statusInscricao"
              )
            );

          const formaPagamento =
            obterValor(
              resultado,
              "forma_pagamento",
              "formaPagamento"
            );

          const receiptUrl =
            obterValor(
              resultado,
              "receipt_url",
              "receiptUrl"
            );

          /*
           * PAGAMENTO CONFIRMADO
           */

          if (
            pagamento === "pago" ||
            pagamento === "recebido" ||
            pagamento === "confirmado" ||
            status === "confirmado"
          ) {

            if (consultaLoading) {

              consultaLoading.hidden =
                true;
            }

            if (resultadoNumero) {

              resultadoNumero.textContent =
                "#" +
                String(
                  numero || "000"
                ).padStart(
                  3,
                  "0"
                );
            }

            if (resultadoNome) {

              resultadoNome.textContent =
                nome || "—";
            }

            if (resultadoCategoria) {

              resultadoCategoria.textContent =
                categoria || "—";
            }

            if (resultadoStatus) {

              resultadoStatus.classList.remove(
                "cancelado"
              );

              resultadoStatus.classList.add(
                "confirmado"
              );
            }

            if (resultadoStatusText) {

              resultadoStatusText.textContent =
                "✓ PAGAMENTO CONFIRMADO";
            }

            if (resultadoMensagem) {

              resultadoMensagem.innerHTML = `
                <strong>
                  🎉 Inscrição confirmada com sucesso!
                </strong>

                <span>
                  Seu pagamento foi recebido e sua inscrição
                  está confirmada.
                </span>

                ${
                  formaPagamento
                    ? `
                      <small>
                        Forma de pagamento:
                        <strong>
                          ${formaPagamento}
                        </strong>
                      </small>
                    `
                    : ""
                }
              `;
            }

            /*
             * Esconde botão de pagamento.
             */

            const botaoPagamento =
              document.getElementById(
                "resultado-pagamento"
              );

            if (botaoPagamento) {

              botaoPagamento.hidden =
                true;

              botaoPagamento.removeAttribute(
                "href"
              );
            }

            /*
             * Comprovante InfinitePay.
             */

            if (
              receiptUrl &&
              resultadoMensagem
            ) {

              const comprovante =
                document.createElement(
                  "a"
                );

              comprovante.className =
                "btn btn-primary";

              comprovante.href =
                receiptUrl;

              comprovante.target =
                "_blank";

              comprovante.rel =
                "noopener noreferrer";

              comprovante.textContent =
                "🧾 VER COMPROVANTE";

              resultadoMensagem.appendChild(
                comprovante
              );
            }

            /*
             * WhatsApp
             */

            if (
              resultadoWhatsapp &&
              WHATSAPP_INSCRICOES
            ) {

              const mensagemWhatsapp =
                [
                  "Olá! Gostaria de confirmar minha inscrição no Itaitinga MTB Race XCP 2026.",
                  "",
                  "Inscrição: #" +
                    String(
                      numero || "000"
                    ).padStart(
                      3,
                      "0"
                    ),
                  "Nome: " +
                    (nome || ""),
                  "Categoria: " +
                    (categoria || ""),
                  "Pagamento: " +
                    (formaPagamento || "Confirmado")
                ].join("\n");

              resultadoWhatsapp.href =
                "https://wa.me/" +
                WHATSAPP_INSCRICOES +
                "?text=" +
                encodeURIComponent(
                  mensagemWhatsapp
                );

              resultadoWhatsapp.hidden =
                false;
            }

            if (consultaResultado) {

              consultaResultado.hidden =
                false;
            }

            /*
             * Remove os parâmetros da InfinitePay
             * da barra de endereço.
             */

            try {

              window.history.replaceState(
                {},
                document.title,
                window.location.pathname +
                "#consulta-inscricao"
              );

            } catch (erroHistorico) {

              console.warn(
                "Não foi possível limpar a URL:",
                erroHistorico
              );
            }

            return;
          }

          /*
           * Pagamento ainda não apareceu como Pago.
           *
           * O webhook pode estar chegando alguns
           * segundos depois do retorno.
           */

          if (tentativa < 5) {

            if (resultadoStatusText) {

              resultadoStatusText.textContent =
                "🟡 CONFIRMANDO PAGAMENTO...";
            }

            if (resultadoMensagem) {

              resultadoMensagem.textContent =
                "Pagamento recebido. Estamos confirmando sua inscrição...";
            }

            await new Promise(
              resolve =>
                setTimeout(
                  resolve,
                  2000
                )
            );

            continue;
          }
        }

      } catch (erro) {

        console.error(
          "Erro ao processar retorno InfinitePay:",
          erro
        );

        if (tentativa < 5) {

          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                2000
              )
          );

          continue;
        }
      }
    }

    /*
     * Se chegou aqui, não conseguimos confirmar
     * automaticamente.
     */

    if (consultaLoading) {

      consultaLoading.hidden =
        true;
    }

    if (consultaErro) {

      consultaErro.innerHTML = `
        <strong>
          🟡 PAGAMENTO EM PROCESSAMENTO
        </strong>

        <span>
          Recebemos o retorno do pagamento, mas a confirmação
          ainda está sendo processada.
        </span>

        <small>
          Aguarde alguns instantes e consulte sua inscrição
          novamente pelo CPF.
        </small>
      `;

      consultaErro.hidden =
        false;
    }
  }

  // ----------------------------------------------------------
  // CONSULTA PÚBLICA
  // ----------------------------------------------------------

  const consultaForm =
    document.getElementById(
      "form-consulta"
    );

  const consultaCpf =
    document.getElementById(
      "consulta-cpf"
    );

  const consultaLoading =
    document.getElementById(
      "consulta-loading"
    );

  const consultaErro =
    document.getElementById(
      "consulta-erro"
    );

  const consultaResultado =
    document.getElementById(
      "consulta-resultado"
    );

  const resultadoNumero =
    document.getElementById(
      "resultado-numero"
    );

  const resultadoNome =
    document.getElementById(
      "resultado-nome"
    );

  const resultadoCategoria =
    document.getElementById(
      "resultado-categoria"
    );

  const resultadoStatus =
    document.getElementById(
      "resultado-status"
    );

  const resultadoStatusText =
    document.getElementById(
      "resultado-status-text"
    );

  const resultadoWhatsapp =
    document.getElementById(
      "resultado-whatsapp"
    );

  const resultadoMensagem =
    document.getElementById(
      "resultado-mensagem"
    );

  if (consultaCpf) {

    consultaCpf.addEventListener(
      "input",
      () => {

        consultaCpf.value =
          formatarCPF(
            consultaCpf.value
          );
      }
    );
  }

  function limparConsulta() {

    if (consultaErro) {
      consultaErro.hidden = true;
      consultaErro.innerHTML = "";
    }

    if (consultaResultado) {
      consultaResultado.hidden = true;
    }

    if (consultaLoading) {
      consultaLoading.hidden = true;
    }

    if (resultadoWhatsapp) {
      resultadoWhatsapp.hidden = true;
      resultadoWhatsapp.removeAttribute(
        "href"
      );
    }

    if (resultadoMensagem) {
      resultadoMensagem.textContent =
        "";
    }
  }

  function mostrarNaoEncontrado(cpf) {

    if (!consultaErro) return;

    consultaErro.innerHTML = `
      <strong>CPF NÃO ENCONTRADO</strong>

      <span>
        Não localizamos uma inscrição para este CPF.
      </span>

      <div class="consulta-not-found-actions">

        <a
          href="#form-inscricao"
          class="btn btn-primary js-fazer-cadastro"
        >
          📝 FAZER CADASTRO AGORA
        </a>

        ${
          WHATSAPP_INSCRICOES
            ? `
              <a
                href="#"
                class="btn btn-whatsapp js-suporte-whatsapp"
                target="_blank"
                rel="noopener noreferrer"
              >
                💬 ENTRAR EM CONTATO COM O SUPORTE
              </a>
            `
            : ""
        }

      </div>
    `;

    consultaErro
      .querySelector(
        ".js-fazer-cadastro"
      )
      ?.addEventListener(
        "click",
        event => {

          event.preventDefault();

          const cadastroCpf =
            document.getElementById(
              "cpf"
            );

          if (cadastroCpf) {

            cadastroCpf.value =
              formatarCPF(cpf);
          }

          const secao =
            document.getElementById(
              "inscricoes"
            );

          const form =
            document.getElementById(
              "form-inscricao"
            );

          (
            secao ||
            form
          )?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

          setTimeout(
            () =>
              cadastroCpf?.focus(),
            650
          );
        }
      );

    const suporte =
      consultaErro
        .querySelector(
          ".js-suporte-whatsapp"
        );

    if (
      suporte &&
      WHATSAPP_INSCRICOES
    ) {

      const mensagem =
        [
          "Olá! Não localizei minha inscrição no Itaitinga MTB Race XCP 2026.",
          "",
          "CPF consultado: " +
            formatarCPF(cpf),
          "Gostaria de ajuda para verificar meu cadastro."
        ].join("\n");

      suporte.href =
        "https://wa.me/" +
        WHATSAPP_INSCRICOES +
        "?text=" +
        encodeURIComponent(
          mensagem
        );
    }

    consultaErro.hidden =
      false;
  }

  // ----------------------------------------------------------
// FORMULÁRIO DE CONSULTA
// ----------------------------------------------------------

if (consultaForm) {

  consultaForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      limparConsulta();

      const cpf =
        somenteNumeros(
          consultaCpf?.value
        );

      if (cpf.length !== 11) {

        if (consultaErro) {

          consultaErro.textContent =
            "Informe um CPF válido para consultar.";

          consultaErro.hidden =
            false;
        }

        return;
      }

      if (consultaLoading) {
        consultaLoading.hidden =
          false;
      }

      try {

        const url =
          GOOGLE_SCRIPT_URL +
          "?action=publicConsultar" +
          "&cpf=" +
          encodeURIComponent(cpf) +
          "&_=" +
          Date.now();

        const response =
          await fetch(
            url,
            {
              method: "GET",
              cache: "no-store"
            }
          );

        if (!response.ok) {

          throw new Error(
            "Não foi possível consultar a inscrição."
          );
        }

        const envelope =
          await response.json();

        console.log(
          "Resposta da consulta:",
          envelope
        );

        const resultado =
          extrairResultado(
            envelope
          );

        if (consultaLoading) {
          consultaLoading.hidden =
            true;
        }

        const encontrado =
          resultadoEncontrado(
            envelope,
            resultado
          );

        if (!encontrado) {

          if (
            resultadoTemInscricao(
              resultado
            )
          ) {

            // Possui dados da inscrição.
            // Continua normalmente.

          } else {

            mostrarNaoEncontrado(
              cpf
            );

            return;
          }
        }

        // --------------------------------------------
        // DADOS DA INSCRIÇÃO
        // --------------------------------------------

        const numero =
          obterValor(
            resultado,
            "numero_inscricao",
            "numeroInscricao",
            "numero"
          );

        const nome =
          obterValor(
            resultado,
            "nome",
            "atleta"
          );

        const categoria =
          obterValor(
            resultado,
            "categoria"
          );

        const status =
          obterValor(
            resultado,
            "status",
            "statusInscricao"
          );

        const pagamento =
          obterValor(
            resultado,
            "pagamento"
          );

        // --------------------------------------------
        // NOVO: URL DO CHECKOUT
        // --------------------------------------------

        const checkoutUrl =
          obterValor(
            resultado,
            "checkout_url",
            "checkoutUrl"
          );

        console.log(
          "Checkout da consulta:",
          checkoutUrl
        );

        // --------------------------------------------
        // PREENCHIMENTO DOS DADOS
        // --------------------------------------------

        if (resultadoNumero) {

          resultadoNumero.textContent =
            "#" +
            String(
              numero || "000"
            ).padStart(3, "0");
        }

        if (resultadoNome) {

          resultadoNome.textContent =
            nome || "—";
        }

        if (resultadoCategoria) {

          resultadoCategoria.textContent =
            categoria || "—";
        }

        const statusNormal =
          normalizarStatus(
            status
          );

        const pagamentoNormal =
          normalizarStatus(
            pagamento
          );

        // --------------------------------------------
        // WHATSAPP
        // --------------------------------------------

        if (resultadoWhatsapp) {

          resultadoWhatsapp.hidden =
            true;

          resultadoWhatsapp.removeAttribute(
            "href"
          );
        }

        // --------------------------------------------
        // STATUS
        // --------------------------------------------

        if (resultadoStatus) {

          resultadoStatus.classList.remove(
            "confirmado",
            "cancelado"
          );
        }

        // --------------------------------------------
        // CANCELADO
        // --------------------------------------------

        if (
          statusNormal === "cancelado" ||
          statusNormal === "cancelada"
        ) {

          resultadoStatus?.classList.add(
            "cancelado"
          );

          if (resultadoStatusText) {

            resultadoStatusText.textContent =
              "INSCRIÇÃO CANCELADA";
          }

          if (resultadoMensagem) {

            resultadoMensagem.textContent =
              "Entre em contato com a organização caso precise de atendimento.";
          }

        // --------------------------------------------
        // CONFIRMADO
        // --------------------------------------------

        } else if (
          statusNormal === "confirmado" ||
          statusNormal === "confirmada"
        ) {

          resultadoStatus?.classList.add(
            "confirmado"
          );

          if (resultadoStatusText) {

            resultadoStatusText.textContent =
              "✓ INSCRIÇÃO CONFIRMADA";
          }

          if (resultadoMensagem) {

            resultadoMensagem.textContent =
              "Sua inscrição está confirmada. Nos vemos na largada!";
          }

        // --------------------------------------------
        // PAGAMENTO CONFIRMADO
        // --------------------------------------------

        } else if (
          pagamentoNormal === "pago" ||
          pagamentoNormal === "paga" ||
          pagamentoNormal === "recebido" ||
          pagamentoNormal === "recebida" ||
          pagamentoNormal === "confirmado" ||
          pagamentoNormal === "confirmada"
        ) {

          resultadoStatus?.classList.add(
            "confirmado"
          );

          if (resultadoStatusText) {

            resultadoStatusText.textContent =
              "✓ PAGAMENTO CONFIRMADO";
          }

          if (resultadoMensagem) {

            resultadoMensagem.textContent =
              "Seu pagamento foi confirmado. Sua inscrição está em processo de confirmação.";
          }

        // --------------------------------------------
        // PAGAMENTO PENDENTE
        // --------------------------------------------

        } else {

          if (resultadoStatusText) {

            resultadoStatusText.textContent =
              "🟡 PAGAMENTO / CONFIRMAÇÃO PENDENTE";
          }

          if (resultadoMensagem) {

            resultadoMensagem.textContent =
              "Sua inscrição foi localizada, mas o pagamento ainda aguarda confirmação.";
          }

          // ------------------------------------------
          // BOTÃO PAGAR
          // ------------------------------------------

          if (
            checkoutUrl &&
            consultaResultado
          ) {

            let botaoPagamento =
              document.getElementById(
                "resultado-pagamento"
              );

            if (!botaoPagamento) {

              botaoPagamento =
                document.createElement(
                  "a"
                );

              botaoPagamento.id =
                "resultado-pagamento";

              botaoPagamento.className =
                "btn btn-primary resultado-pagamento";

              botaoPagamento.target =
                "_blank";

              botaoPagamento.rel =
                "noopener noreferrer";

              botaoPagamento.textContent =
                "💳 PAGAR MINHA INSCRIÇÃO";

              if (resultadoMensagem) {

                resultadoMensagem.parentNode.insertBefore(
                  botaoPagamento,
                  resultadoMensagem
                );

              } else {

                consultaResultado.appendChild(
                  botaoPagamento
                );
              }
            }

            botaoPagamento.href =
              checkoutUrl;

            botaoPagamento.hidden =
              false;
          }

          // ------------------------------------------
          // WHATSAPP
          // ------------------------------------------

          if (
            resultadoWhatsapp &&
            WHATSAPP_INSCRICOES
          ) {

            const mensagem =
              [
                "Olá! Gostaria de confirmar minha inscrição no Itaitinga MTB Race XCP 2026.",
                "",
                "Inscrição: #" +
                  String(
                    numero || "000"
                  ).padStart(3, "0"),
                "Nome: " +
                  (nome || ""),
                "Categoria: " +
                  (categoria || "")
              ].join("\n");

            resultadoWhatsapp.href =
              "https://wa.me/" +
              WHATSAPP_INSCRICOES +
              "?text=" +
              encodeURIComponent(
                mensagem
              );

            resultadoWhatsapp.hidden =
              false;
          }
        }

        // --------------------------------------------
        // ESCONDE BOTÃO QUANDO NÃO DEVE PAGAR
        // --------------------------------------------

        const botaoPagamento =
          document.getElementById(
            "resultado-pagamento"
          );

        if (botaoPagamento) {

          const podePagar =
            (
              !statusNormal ||
              (
                statusNormal !== "cancelado" &&
                statusNormal !== "cancelada" &&
                statusNormal !== "confirmado" &&
                statusNormal !== "confirmada"
              )
            ) &&
            !(
              pagamentoNormal === "pago" ||
              pagamentoNormal === "paga" ||
              pagamentoNormal === "recebido" ||
              pagamentoNormal === "recebida" ||
              pagamentoNormal === "confirmado" ||
              pagamentoNormal === "confirmada"
            );

          if (
            podePagar &&
            checkoutUrl
          ) {

            botaoPagamento.href =
              checkoutUrl;

            botaoPagamento.hidden =
              false;

          } else {

            botaoPagamento.hidden =
              true;

            botaoPagamento.removeAttribute(
              "href"
            );
          }
        }

        // --------------------------------------------
        // MOSTRA RESULTADO
        // --------------------------------------------

        if (consultaResultado) {

          consultaResultado.hidden =
            false;
        }

      } catch (erro) {

        console.error(
          "Erro na consulta:",
          erro
        );

        if (consultaLoading) {

          consultaLoading.hidden =
            true;
        }

        if (consultaErro) {

          consultaErro.innerHTML = `
            <strong>ERRO NA CONSULTA</strong>

            <span>
              Não foi possível consultar a inscrição agora.
              Tente novamente em alguns instantes.
            </span>
          `;

          consultaErro.hidden =
            false;
        }
      }
    }
  );
}
  // ----------------------------------------------------------
  // INICIA RETORNO INFINITEPAY
  // ----------------------------------------------------------

  processarRetornoInfinitePay();
});
