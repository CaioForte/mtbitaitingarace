# Itaitinga MTB Race — Site + Inscrições

## Novidades desta versão

- Formulário de inscrição conectado ao Google Apps Script.
- Número de inscrição automático.
- Colunas separadas de `Pagamento` e `Inscrição`.
- Consulta pública por CPF.
- Consulta pública retorna somente número, nome, categoria e status.
- Se `Inscrição` estiver `Confirmado`, o botão de WhatsApp não aparece.
- Se estiver `Pendente`, aparece o botão de confirmação pelo WhatsApp.
- O número oficial do WhatsApp deve ser configurado em `js/main.js`.

## Importante: atualizar o Apps Script

O arquivo `google-apps-script/Code.gs` contém a versão nova do Apps Script.

Na sua planilha:
1. Extensões → Apps Script.
2. Substitua o código atual pelo conteúdo de `google-apps-script/Code.gs`.
3. Salve.
4. Implante uma nova versão da implantação existente.
5. Mantenha `Executar como: Eu` e `Quem pode acessar: Qualquer pessoa`.

A URL `/exec` continua sendo usada pelo site.

## Colunas da planilha

A estrutura final é:

1. Nº Inscrição
2. Data/Hora
3. Nome Completo
4. CPF
5. Data de Nascimento
6. E-mail
7. WhatsApp
8. Cidade
9. Categoria
10. Contato de Emergência
11. Pagamento
12. Inscrição

### Controle manual

A organização pode alterar manualmente:

- `Pagamento`: Pendente / Recebido
- `Inscrição`: Pendente / Confirmado / Cancelado

A consulta pública usa a coluna `Inscrição`.

## WhatsApp

No `js/main.js`, procure:

`const WHATSAPP_INSCRICOES = "";`

Coloque somente o número oficial com DDI e DDD, sem `+`, espaços, parênteses ou hífen.

Exemplo:

`const WHATSAPP_INSCRICOES = "5585999999999";`

O site monta a mensagem automaticamente.


## Regra atual de exibição do WhatsApp

O botão só aparece quando o campo `Pagamento` estiver pendente.

- `Pagamento = Pendente` + `Inscrição = Pendente` → mostra WhatsApp.
- `Pagamento = Pago/Recebido` + `Inscrição = Pendente` → não mostra WhatsApp; informa que o pagamento foi confirmado.
- `Inscrição = Confirmado` → não mostra WhatsApp; informa inscrição confirmada.
- `Inscrição = Cancelado` → não mostra WhatsApp.


## CPF duplicado

Ao tentar cadastrar um CPF já existente, o formulário informa que o CPF já possui
uma inscrição e apresenta o botão `CONSULTAR MINHA INSCRIÇÃO`. O botão leva o atleta
para a consulta e já preenche o CPF automaticamente.
