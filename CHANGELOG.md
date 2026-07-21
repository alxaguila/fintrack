# Changelog

Lista de cambios por versión (`APP_VERSION` en `src/lib/version.ts`). Solo se añade una entrada cuando el código de la app cambia.

## v1.494
- Móvil: el botón de menú (☰) ya no flota arriba a la derecha — es ahora el 5º icono de la barra inferior de navegación, en todas las pantallas. En Análisis, ese hueco superior derecho pasa a mostrar el selector de periodo como desplegable.
- Análisis en móvil: Ingresos, Gastos y Balance se muestran en una sola línea de 3 columnas en vez de tres filas; la tasa de ahorro ya no tiene tarjeta propia, aparece como un pequeño porcentaje bajo el Balance. Se ha dado más tamaño a la gráfica de evolución con el espacio ganado, y al tocar un periodo ya no aparece una leyenda flotante (el resto de la pantalla se actualiza al instante, así que era redundante).

## v1.492
- Rediseñada la pantalla de Análisis para móvil (se veía muy apretada): ahora tiene su propia disposición inspirada en Fintonic —tira mensual compacta, Ingresos/Gastos/Balance como filas de lista, tasa de ahorro en banda, donut más pequeño con selección al tocar, y "Cambios relevantes"/"Insights" plegados bajo "Ver más análisis"—. Escritorio no cambia.
- El selector de periodo (Meses/Trimestres/Años) se ha movido de la cabecera a una barra al final de la pantalla, en todas las resoluciones, para liberar espacio arriba.

## v1.485
- Corregido bug de liquidación de tarjeta: solo se detectaba como "no computable" el abono en la propia tarjeta, nunca el cargo correspondiente en la cuenta bancaria que la paga (p. ej. "LIQUIDACION CONTRATO TARJETA..." en cuenta corriente se quedaba como gasto normal). Ahora se detecta en ambos lados. Solo afecta a importaciones futuras, no reclasifica movimientos ya importados.

## v1.482
- Corregido bug de detección de transferencias entre cuentas: un movimiento que ya estaba marcado "Transferencias entre cuentas" (por una regla, la comunidad, o un emparejamiento anterior) quedaba excluido para futuras comparaciones, así que si se borraba y volvía a importar solo un lado de la transferencia, su pareja nunca se encontraba y se quedaba huérfana como ingreso/gasto normal. Ahora esos movimientos siguen participando en el emparejamiento (el resto de "no computables" más específicos —inversión, liquidación de tarjeta— no se tocan).

## v1.476
- Publicada la página de Términos y Condiciones (`/terminos`, bilingüe ES/EN), enlazada desde el pie de la landing.

## v1.473
- Quitada la nota de traducción de cortesía en las páginas legales en inglés (Aviso Legal, Privacidad, Cookies).

## v1.471
- Publicada la página de Política de Cookies (`/cookies`, bilingüe ES/EN). De paso, corregida la Política de Privacidad: donde decía "cookie técnica de sesión" ahora dice `localStorage`, que es lo que realmente usa la sesión (no hay cookies HTTP).

## v1.469
- Admin: nueva sección "Reglas de comunidad" (`/admin/reglas`) con el listado de comercios votados por los usuarios, ordenado de más a menos votos, con buscador y aviso visual de qué reglas ya están activas en la clasificación automática.

## v1.466
- Seguridad (backend/Supabase): cerrados los avisos del database linter aparecidos con las funciones de analítica de admin y de gestión de planes — se revoca el acceso público (`anon`) a las RPC internas y se elimina el acceso directo a las funciones-trigger, que nunca deben llamarse por API. También corregida una recaída en el bucket de logos de bancos que volvía a permitir listar todos los ficheros.

## v1.460
- Publicada la página de Política de Privacidad (`/privacidad`, bilingüe ES/EN), enlazada desde el pie de la landing.

## v1.456
- Corregido bug de saldo: al importar varios movimientos del mismo día en un único extracto, el saldo inicial podía calcularse mal (la BD asignaba la misma fecha de creación a toda la fila del import y el reanclaje de saldo podía coger el movimiento equivocado como referencia). Ahora cada fila se guarda con un orden interno determinista para que el saldo recalculado cuadre siempre.

## v1.453
- Importar: nuevas columnas opcionales "Retención/impuesto" y "Comisión" en el mapeo de extractos — si el banco separa el importe bruto de una retención o comisión (p.ej. Trade Republic en los intereses), se resta automáticamente para guardar el importe neto real.

## v1.448
- Posición Global: corregido "Total" duplicado en el tooltip de la gráfica.

## v1.446
- Importar: quitado el icono de ayuda "(?)" de "Entidad bancaria" (descuadraba los dos desplegables de cuenta al hacer esa etiqueta más alta que "Tipo de cuenta").

## v1.442
- Importar: el desplegable "Cuenta de destino" se divide en dos — Entidad (con logo del catálogo) y Tipo de cuenta. Si la entidad tiene una única cuenta se autoselecciona; se puede crear cuenta nueva desde ambos desplegables.

## v1.439
- Cards de Cuentas: indicador de frescura (punto de color + "Actualizado hace X días"), igual que en Posición Global.

## v1.437
- Cards de Cuentas: sombra más pronunciada y permanente (efecto 3D).

## v1.429
- Publicada la página pública de Aviso Legal (`/aviso-legal`, bilingüe ES/EN), con selector de idioma propio y enlace real desde el pie de la landing.

## v1.422
- Pulido responsive del gráfico de evolución de patrimonio en Inicio: chips de series, título abreviado y botón de cuentas adaptados a móvil.
