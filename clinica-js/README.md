# Clínica Vida & Saúde — Agendamento de Consultas (JavaScript)

Versão em **Node.js + Express + EJS + SQL Server** do sistema do guia (que usava ASP.NET Core MVC). Mantém o mesmo banco `dbClinica`, o mesmo DER (Paciente, Medico, Consulta) e as mesmas regras de negócio.

## Pré-requisitos

- [Node.js](https://nodejs.org) 18 ou superior
- Microsoft SQL Server e SQL Server Management Studio (SSMS)

## 1. Banco de dados

Abra o SSMS e execute o script `db/script.sql`. Ele cria o banco `dbClinica`, as tabelas com chaves primárias, chaves estrangeiras e `UNIQUE` (Cpf e Crm) e insere dados de teste.

Se preferir, crie o banco pelo diagrama visual como no guia — o importante é que as tabelas e colunas tenham exatamente os nomes do DER.

## 2. Configuração

```bash
npm install
cp .env.example .env     # no Windows: copy .env.example .env
```

Edite o `.env` com os dados do seu SQL Server. O padrão equivale ao `Server=.\SENAI; User Id=sa; Password=senai.123` do guia:

```
DB_SERVER=localhost
DB_INSTANCE=SENAI
DB_NAME=dbClinica
DB_USER=sa
DB_PASSWORD=senai.123
```

Se o seu SQL Server usa porta fixa em vez de instância nomeada, remova `DB_INSTANCE` e defina `DB_PORT=1433`.

> Para instância nomeada, o serviço **SQL Server Browser** precisa estar em execução e o protocolo TCP/IP habilitado no SQL Server Configuration Manager. A autenticação do SQL Server (usuário `sa`) também precisa estar habilitada.

## 3. Executar

```bash
npm start        # ou: npm run dev (reinicia ao salvar arquivos)
```

Abra http://localhost:3000.

## Testando o fluxo

1. Acesse `/consultas` sem estar logado → redireciona para o login.
2. Entre com o CPF de teste `111.222.333-44` (o CPF pode ser digitado só com números).
3. Agende uma consulta, marque como realizada ou cancele.
4. Um CPF inexistente mostra “CPF não encontrado” e o link **Cadastre-se aqui** leva ao cadastro de paciente.

## Requisitos do guia e onde estão

| Requisito | Onde |
|-----------|------|
| R1 CRUD de pacientes | `src/routes/pacientes.js`, `views/pacientes/` |
| R2 CRUD de médicos | `src/routes/medicos.js`, `views/medicos/` |
| R3 Agendamento (1 paciente + 1 médico + data/hora) | `src/routes/consultas.js` (`POST /consultas`) |
| R4 Status inicial “Agendada”, depois “Realizada” ou “Cancelada” | `src/routes/consultas.js` (`POST /consultas/:id/status`) |
| R5 Não excluir paciente/médico com consultas | `POST /pacientes/:id/excluir` e `POST /medicos/:id/excluir` (checagem prévia + FK do banco) |
| Login obrigatório para agendar | `src/middleware.js` (`requireLogin`), equivalente ao `[Authorize]` |
| Um agendamento por paciente por dia | `POST /consultas` (consultas canceladas não contam) |
| Login por CPF, com opção de cadastro abaixo | `views/login.ejs`, `src/routes/auth.js` |

## Estrutura

```
db/script.sql              script do banco e dados de teste
src/server.js              app Express, sessão e rotas
src/db.js                  conexão com o SQL Server (mssql)
src/middleware.js          requireLogin e mensagens flash
src/util.js                formatação de CPF/datas e códigos de erro do SQL Server
src/routes/                auth, pacientes, medicos, consultas
src/services/              regras de validação/gravação de paciente
views/                     telas EJS
public/css/style.css       estilos
```

## Correspondência com o projeto ASP.NET

| ASP.NET (guia) | JavaScript (este projeto) |
|----------------|---------------------------|
| Entity Framework + Scaffold-DbContext | Pacote `mssql` com consultas parametrizadas |
| Controllers + Views Razor | Rotas Express + views EJS |
| appsettings.json (ConnectionStrings) | Arquivo `.env` |
| Session / Cookie Authentication | `express-session` (cookie HttpOnly, 30 min de inatividade) |
| `[Authorize]` | middleware `requireLogin` |

## Observações

- Todas as consultas SQL usam parâmetros (`@nome`, `@id`…), o que evita SQL injection.
- Como no guia, o login é feito apenas com o CPF (modelo de treinamento, sem senha) e todo usuário logado acessa os cadastros de pacientes e médicos. Em produção seria necessário senha e perfis (recepção × paciente).
- Cada paciente só vê e altera as próprias consultas.
