import { BRAND } from '@/components/landing/brand'

/**
 * Estilos compartidos por todas las páginas de calculadoras (layout de 2
 * columnas, tarjeta hero + stats, gráfica, tabla de desglose). Se inyecta
 * con <style>{CALCULATOR_CSS}</style> en cada página.
 */
export const CALCULATOR_CSS = `
.calc-page a{color:${BRAND.blue};text-decoration:none}
.calc-card{background:#fff;border:1px solid #ECE7DD;border-radius:20px;box-shadow:0 4px 14px rgba(10,37,64,.04);box-sizing:border-box}
.calc-grid{display:grid;grid-template-columns:minmax(0,380px) minmax(0,1fr);gap:24px;align-items:stretch}
.calc-right-col{display:flex;flex-direction:column;gap:16px;min-width:0;height:100%}
.calc-section-label{font:600 11px ${BRAND.sans};letter-spacing:.08em;text-transform:uppercase;color:#8A96A3}
.calc-divider{border-top:1px solid #ECE7DD;margin:0 -24px}
.calc-hero-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,220px);gap:16px;align-items:stretch}
.calc-stats-col{display:flex;flex-direction:column;gap:16px}
.calc-stats-col>*{flex:1}
.kpi-label-short{display:none}
.calc-chart-card{flex:1;min-height:280px;display:flex;flex-direction:column;padding:20px 20px 8px}
.calc-chart-body{flex:1;min-height:220px}
.calc-toggle{transition:background .2s ease}
.calc-toggle:hover{background:#EAF4FA!important}
.calc-table{width:100%;border-collapse:collapse;font:400 13px ${BRAND.sans};color:${BRAND.ink}}
.calc-table th{text-align:right;font:600 12px ${BRAND.sans};color:#8A96A3;padding:8px 10px;border-bottom:1px solid #ECE7DD;white-space:nowrap;position:sticky;top:0;background:#fff}
.calc-table th:first-child,.calc-table td:first-child{text-align:left}
.calc-table td{text-align:right;padding:8px 10px;border-bottom:1px solid #F3EFE6;white-space:nowrap}
@media (min-width:901px){
  .calc-content{display:flex;flex-direction:column;min-height:100dvh}
  .calc-grid{flex:1}
}
@media (max-width:900px){
  .calc-grid{grid-template-columns:1fr}
  .calc-right-col{height:auto}
  .calc-hero-row{grid-template-columns:1fr}
  .calc-stats-col{flex-direction:row}
}
@media (max-width:560px){
  .kpi-label-full{display:none}
  .kpi-label-short{display:inline}
}
`
