# ForteFit Academia — site

Página única (HTML, CSS e um JavaScript pequeno, sem framework): abertura, para quem é, estrutura, como começar, equipe, planos, perguntas frequentes e contato. Inclui política de privacidade e página 404.

**Projeto demonstrativo de portfólio.** Razão social, CNPJ, telefone, WhatsApp, endereço e horários são fictícios. Os planos, valores e promoções exibidos (Dia, Livre e Forte) são exemplos inventados para a demonstração.

## Comandos

```bash
npm install          # sharp e fontes (Outfit e Inter)
npm run imagens      # gera AVIF/WebP, favicons e og-image a partir de ../01_Kit_Logos e ../04_Banco_de_Imagens
npm run build        # public/ de revisão (noindex)
npm run producao     # public/ publicável (exige "dominio" em site.config.json)
npm run preview      # build + servidor em http://127.0.0.1:4175
```

## Onde editar

- Dados da academia: `site.config.json` (`whatsappLink: true` liga os botões de WhatsApp quando o número for real)
- Textos: `src/index.html`
- Cores e tipografia: variáveis no início de `src/css/styles.css`

Identidade: grafite `#151515`, laranja `#FF5A1F` e branco; Outfit nos títulos e Inter no texto. Logos em SVG vetorial, vindos do kit.
