# EstoqueCalc

Calculadora de dimensionamento de estoques com suporte a demanda mista (dia, semana, quinzena, mês).

## Funcionalidades

- Entrada de demanda em qualquer unidade (dia, semana, quinzena, mês) — pode misturar
- Nível de serviço configurável (90% a 99,9%) com Z-score automático
- Perdas no processo configuráveis
- Cálculo de: Estoque de Ciclo, Pulmão, Segurança e Máximo
- Breakdown por período (dia / semana / quinzena / mês)
- Memória de cálculo completa
- Dados de exemplo (produto 123456, 12 meses)

## Rodar localmente

```bash
npm install
npm run dev
```

## Deploy no Vercel

1. Suba este repositório no GitHub
2. Importe no [vercel.com](https://vercel.com)
3. Framework: **Vite** (detectado automaticamente)
4. Build command: `npm run build`
5. Output directory: `dist`

## Estrutura

```
estoque-calc/
├── index.html
├── package.json
├── vercel.json
└── src/
    ├── main.js     ← lógica da interface
    ├── calc.js     ← motor de cálculo (puro JS, sem deps)
    └── style.css   ← estilos
```
