import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { BRAND } from '@/components/landing/brand'
import { SiteHeader, SITE_HEADER_SPACE } from '@/components/landing/SiteHeader'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { useSeoMeta } from '@/hooks/useSeoMeta'

const CARD_CSS = `
.calc-idx-card{transition:transform .2s ease,box-shadow .2s ease}
.calc-idx-card:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(10,37,64,.1)}
.calc-idx-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
@media (max-width:700px){.calc-idx-grid{grid-template-columns:1fr}}
`

export default function CalculatorsIndex() {
  const { t } = useTranslation('calculators')

  useSeoMeta({
    title: t('index.meta.title'),
    description: t('index.meta.description'),
    path: '/calculators',
  })

  const cards = [
    {
      href: '/calculators/compound-interest',
      title: t('index.compoundInterestCard.title'),
      teaser: t('index.compoundInterestCard.teaser'),
      cta: t('index.compoundInterestCard.cta'),
    },
    {
      href: '/calculators/retirement-savings',
      title: t('index.retirementSavingsCard.title'),
      teaser: t('index.retirementSavingsCard.teaser'),
      cta: t('index.retirementSavingsCard.cta'),
    },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: BRAND.cream }}>
      <style>{CARD_CSS}</style>
      <SiteHeader />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: `${SITE_HEADER_SPACE + 40}px 16px 80px`, boxSizing: 'border-box' }}>
        <div style={{ font: `600 13px ${BRAND.sans}`, color: BRAND.blue, textTransform: 'uppercase', letterSpacing: '.04em' }}>
          {t('index.eyebrow')}
        </div>
        <h1 style={{ margin: '8px 0 10px', font: `500 clamp(28px,6vw,38px) ${BRAND.display}`, letterSpacing: '-.02em', color: BRAND.ink }}>
          {t('index.title')}
        </h1>
        <p style={{ margin: '0 0 36px', maxWidth: 640, font: `400 15px/1.6 ${BRAND.sans}`, color: '#586470' }}>
          {t('index.subtitle')}
        </p>

        <div className="calc-idx-grid">
          {cards.map((card) => (
            <Link
              key={card.href}
              to={card.href}
              className="calc-idx-card"
              style={{
                display: 'block', background: '#fff', border: '1px solid #ECE7DD', borderRadius: 20, padding: 28,
                boxShadow: '0 4px 14px rgba(10,37,64,.04)', boxSizing: 'border-box', textDecoration: 'none',
              }}
            >
              <h2 style={{ margin: 0, font: `600 19px ${BRAND.display}`, letterSpacing: '-.01em', color: BRAND.ink }}>
                {card.title}
              </h2>
              <p style={{ margin: '10px 0 20px', font: `400 14px/1.6 ${BRAND.sans}`, color: '#586470' }}>
                {card.teaser}
              </p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: `600 14px ${BRAND.sans}`, color: BRAND.blue }}>
                {card.cta} <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
