import { forwardRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'

type Props = React.InputHTMLAttributes<HTMLInputElement>

/**
 * Input de contraseña con botón de mostrar/ocultar.
 *
 * Reenvía la ref para poder usarse con `{...form.register('password')}` de
 * react-hook-form. El `style` recibido se respeta (las pantallas de auth usan
 * estilos inline de la marca) y solo se reserva hueco a la derecha para el ojo.
 */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(
  function PasswordInput({ style, ...props }, ref) {
    const { t } = useTranslation('auth')
    const [show, setShow] = useState(false)
    const label = show ? t('hide_password') : t('show_password')

    return (
      <div style={{ position: 'relative' }}>
        <input
          ref={ref}
          type={show ? 'text' : 'password'}
          style={{ ...style, paddingRight: 42 }}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={label}
          title={label}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            padding: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#8A98A5',
          }}
        >
          {show ? <EyeOff style={{ width: 17, height: 17 }} /> : <Eye style={{ width: 17, height: 17 }} />}
        </button>
      </div>
    )
  },
)
