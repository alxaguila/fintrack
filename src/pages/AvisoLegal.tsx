import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Languages } from 'lucide-react'
import { BRAND, BrandMark } from '@/components/landing/brand'

type Block =
  | { p: string }
  | { list: string[] }
  | { table: [string, string][] }

type Section = { heading: string; blocks: Block[] }

// Convierte **negrita** de las cadenas i18n en <strong>, sin HTML crudo (el
// contenido es de traducción propia, no de usuario, pero así evitamos
// dangerouslySetInnerHTML igualmente).
function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} style={{ color: BRAND.ink, fontWeight: 600 }}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

/**
 * Página pública de Aviso Legal, con la identidad de marketing (navy/cream)
 * compartida con Landing/Register, no el sistema de diseño interno de la app.
 */
export default function AvisoLegal() {
  const { t, i18n } = useTranslation('legal')
  const navigate = useNavigate()
  const lang = i18n.language.startsWith('es') ? 'es' : 'en'

  useEffect(() => {
    document.title = t('avisoLegal.metaTitle')
  }, [t, lang])

  const sections = t('avisoLegal.sections', { returnObjects: true }) as Section[]
  const courtesyNote = t('avisoLegal.courtesyNote', { defaultValue: '' })

  function toggleLang() {
    i18n.changeLanguage(lang === 'es' ? 'en' : 'es')
  }

  return (
    <div style={{ minHeight: '100dvh', background: BRAND.cream }}>
      <div style={{ borderBottom: '1px solid #E3DCCE' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <BrandMark size={26} />
            <span style={{ font: `600 18px ${BRAND.display}`, letterSpacing: '-.03em', color: BRAND.ink }}>fintrack</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: `500 13px ${BRAND.sans}`, color: '#586470', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <ArrowLeft style={{ width: 14, height: 14 }} />{t('avisoLegal.back')}
            </button>
            <button
              onClick={toggleLang}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: `500 13px ${BRAND.sans}`, color: '#586470', background: '#fff', border: '1px solid #E3DCCE', borderRadius: 999, padding: '6px 12px', cursor: 'pointer' }}
            >
              <Languages style={{ width: 13, height: 13 }} />{lang === 'es' ? 'EN' : 'ES'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 16px 80px', boxSizing: 'border-box' }}>
        <h1 style={{ margin: 0, font: `500 clamp(26px, 6vw, 34px) ${BRAND.display}`, letterSpacing: '-.02em', color: BRAND.ink }}>
          {t('avisoLegal.pageTitle')}
        </h1>
        <p style={{ margin: '8px 0 28px', font: `400 13px ${BRAND.sans}`, color: '#8A96A3' }}>
          {t('avisoLegal.lastUpdated')}
        </p>

        {courtesyNote && (
          <div style={{ margin: '0 0 28px', padding: '14px 18px', borderRadius: 14, background: '#EAF4FA', border: '1px solid #CFE6F2', font: `400 13.5px/1.6 ${BRAND.sans}`, color: '#0E3050' }}>
            {renderInline(courtesyNote)}
          </div>
        )}

        <div style={{ background: '#fff', border: '1px solid #ECE7DD', borderRadius: 20, padding: '4px clamp(16px, 5vw, 44px)', boxShadow: '0 4px 14px rgba(10,37,64,0.04)', boxSizing: 'border-box' }}>
          {sections.map((section, si) => (
            <div key={si} style={{ padding: '26px 0', borderTop: si === 0 ? 'none' : '1px solid #F0ECE2' }}>
              <h2 style={{ margin: '0 0 12px', font: `600 16.5px ${BRAND.display}`, color: BRAND.ink }}>
                {section.heading}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {section.blocks.map((block, bi) => {
                  if ('p' in block) {
                    return (
                      <p key={bi} style={{ margin: 0, font: `400 14.5px/1.7 ${BRAND.sans}`, color: '#3C4A57' }}>
                        {renderInline(block.p)}
                      </p>
                    )
                  }
                  if ('list' in block) {
                    return (
                      <ul key={bi} style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {block.list.map((item, ii) => (
                          <li key={ii} style={{ font: `400 14.5px/1.7 ${BRAND.sans}`, color: '#3C4A57' }}>
                            {renderInline(item)}
                          </li>
                        ))}
                      </ul>
                    )
                  }
                  if ('table' in block) {
                    return (
                      <div key={bi} style={{ overflowX: 'auto', border: '1px solid #ECE7DD', borderRadius: 12 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            {block.table.map((row, ri) => (
                              <tr key={ri} style={{ borderTop: ri === 0 ? 'none' : '1px solid #ECE7DD' }}>
                                <td style={{ padding: '10px 14px', font: `600 13px ${BRAND.sans}`, color: BRAND.ink, whiteSpace: 'nowrap', verticalAlign: 'top', background: '#FAF8F3' }}>{row[0]}</td>
                                <td style={{ padding: '10px 14px', font: `400 13.5px ${BRAND.sans}`, color: '#3C4A57' }}>{row[1]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
