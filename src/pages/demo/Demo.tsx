import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DemoModeProvider } from '@/contexts/DemoModeContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { DEMO_PROFILE } from '@/lib/demoData'
import { useSeoMeta } from '@/hooks/useSeoMeta'
import { SiteHeader, SITE_HEADER_SPACE } from '@/components/landing/SiteHeader'
import { SiteFooter } from '@/components/landing/SiteFooter'
import Home from '@/pages/Home'
import Dashboard from '@/pages/Dashboard'
import Transactions from '@/pages/Transactions'

type DemoTab = 'overview' | 'analysis' | 'transactions'

const TABS: DemoTab[] = ['overview', 'analysis', 'transactions']

export default function Demo() {
  const { t } = useTranslation('landing')
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<DemoTab>('overview')

  useSeoMeta({ path: '/demo', title: t('demo.seoTitle'), description: t('demo.seoDescription') })

  return (
    <div className="bg-background">
      {/* Cabecera + pestañas + visor + faldón caben en una sola pantalla (sin
          scroll): header/pestañas/faldón ocupan su alto natural (shrink-0) y el
          visor absorbe el resto (flex-1). El footer va después, en flujo normal,
          alcanzable haciendo scroll. */}
      <div className="flex h-[100dvh] flex-col">
        {/* Mismo header fijo que el resto de la puerta de entrada (landing, registro,
            legales): mismo fondo (el de la página, no navy) para que la pastilla
            flote igual que en la landing. Logo = volver a la landing. */}
        <SiteHeader />
        <div className="shrink-0" style={{ height: SITE_HEADER_SPACE }} />

        {/* Enlace de vuelta a la landing, para no depender solo del logo */}
        <div className="shrink-0 bg-background px-4 pt-3 sm:px-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('demo.back')}
          </button>
        </div>

        {/* Pestañas: Posición Global / Análisis / Movimientos. Misma franja que la
            página (crema, no blanca) con la selección invertida respecto al patrón
            habitual (pista blanca, pestaña activa crema) para que se note que es
            clicable sobre este fondo. */}
        <div className="flex shrink-0 justify-center border-b bg-background px-4 py-2">
          <div className="inline-flex items-center gap-1 rounded-xl bg-card p-1 text-sm shadow-[var(--shadow-card)]">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  activeTab === tab ? 'bg-[var(--bg-app-alt)] text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(`demo.tabs.${tab}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Visor de la app: mismo ancho de contenido que en la app real (con
            sidebar), para que las tarjetas/pastillas no se estiren de más en el
            hueco extra que aquí no ocupa ningún menú lateral. Scroll propio. */}
        <main className="min-h-0 flex-1 overflow-y-auto border-b">
          <div className="mx-auto h-full max-w-[1180px]">
            <DemoModeProvider>
              <ProfileProvider profiles={[DEMO_PROFILE]}>
                {activeTab === 'overview' && <Home />}
                {activeTab === 'analysis' && <Dashboard />}
                {activeTab === 'transactions' && <Transactions />}
              </ProfileProvider>
            </DemoModeProvider>
          </div>
        </main>

        {/* Faldón de aviso de demo + CTA de registro, siempre visible sin hacer scroll */}
        <div className="flex shrink-0 flex-col items-center gap-2 bg-[var(--brand-ink)] px-4 py-3 text-center sm:flex-row sm:justify-center sm:gap-4 sm:px-6">
          <span className="text-[13px] font-medium text-white/90 sm:text-sm">{t('demo.banner')}</span>
          <button
            onClick={() => navigate('/register')}
            className="shrink-0 rounded-full bg-[var(--brand-accent)] px-4 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t('demo.cta')}
          </button>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
