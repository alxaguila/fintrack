# Changelog

Lista de cambios por versión (`APP_VERSION` en `src/lib/version.ts`). Solo se añade una entrada cuando el código de la app cambia.

## v1.624
- El icono zafyros pierde el disco navy de fondo en la cabecera de la landing, los diálogos de login/registro/upgrade y el sidebar de la app: esos sitios ya tienen su propio fondo navy con foco de luz decorativo, y el disco plano lo tapaba en vez de fundirse. Nuevo prop `filled` en `BrandMark` (por defecto `true`, se desactiva en cabeceras con foco de luz); en `Logo.tsx` (sidebar) se quita directamente. El footer y el resto de usos sobre fondo claro mantienen el disco.

## v1.622
- El círculo del isotipo zafyros pasa a `#0A2540` (`BRAND.ink`), el mismo navy que la cabecera/hero de la landing, en vez del tono más oscuro usado hasta ahora.

## v1.620
- Nuevo isotipo zafyros: se abandona la gema facetada hexagonal y se adopta el diseño de círculo navy con un diamante de líneas blancas (mesa, hombros y facetas convergiendo en un punto), en versión plana sin degradados ni sombra para que aguante bien en tamaños pequeños (favicon, sidebar). Reconstruido a partir del vector real aportado por el usuario. Afecta a `Logo.tsx`, `BrandMark` (`brand.tsx`) y los assets de `public/` (favicon, logo, apple-touch-icon, etc.).

## v1.619
- Se retira el resplandor de fondo (`BrandGlow`) añadido en v1.618 detrás del logo/wordmark en cabeceras y diálogos — se abandona ese tratamiento a la espera de la nueva versión del logo.

## v1.618
- Ajuste del foco de luz de marca: se quita el brillo que estaba dentro del propio icono (en el hueco central) y se pasa a un resplandor difuminado en el fondo, detrás del logo y el wordmark completos — igual que en la cabecera de la landing/app. Nuevo `BrandGlow` en `brand.tsx`, aplicado en `SiteHeader`, `Landing` (nav), `LoginDialog`, `UpgradePlanDialog`, `Register`, `ResetPassword` y en `Logo.tsx` (sidebar).

## v1.617
- Isotipo zafyros: la faceta central ("tabla") pasa de blanco sólido a transparente, dejando ver el fondo real. En el isotipo de la app y de la landing (`Logo.tsx`, `BrandMark`) se añade además un foco de luz radial centrado en el hueco, visible sobre fondos oscuros (sidebar, cabeceras navy) y casi imperceptible sobre fondos claros.

## v1.616
- Corrección del isotipo zafyros: se sustituye la reconstrucción aproximada del icono por el trazado vectorial exacto del logo real (gema facetada con la tabla central en blanco), recortado y limpiado de fondo para usarse como favicon/icono de app.

## v1.614
- Rebrand de marca: FinTrack pasa a llamarse **zafyros** (siempre en minúscula) en toda la app, la landing y los textos legales. Nuevo isotipo (gema facetada) y wordmark en tipografía Poppins; sin cambios en el sistema de diseño (paleta, layout, resto de tipografías).

## v1.606
- Admin > Categorías: el árbol de "Jerarquía actual" ya no usa pastillas de color — iconos y texto planos directamente sobre el fondo, para que se note que es una vista de referencia, no editable.

## v1.604
- Admin > Categorías: debajo de Grupos/Subcategorías se añade "Jerarquía actual" — el árbol completo de grupos con sus subcategorías, con los mismos iconos y colores, de solo lectura, para ver de un vistazo la estructura antes de decidir si reorganizar algo.

## v1.601
- Admin > Comercios: cabecera ordenable (Nombre / Usos), por defecto de más a menos usado.
- Admin > Reglas: en Diccionario y Comunidad, el orden por defecto pasa a ser por usos (de mayor a menor) en vez de por nombre/votos.
- Admin > Reglas (Diccionario): nuevo filtro para ver solo las palabras con comercio ya creado, sin comercio, o todas.

## v1.598
- Subida de logos (comercios y entidades bancarias): quitado `upsert` de la subida a Storage — no hacía falta (cada archivo ya se sube con un nombre único) y exige permisos de `SELECT`/`UPDATE` en `storage.objects` que no teníamos configurados, lo que podía ser la causa de que la subida fallara con error de RLS.

## v1.570
- Admin > Comercios: el diálogo de "Nuevo comercio" ya permite añadir variaciones de concepto también al crear (antes solo se podía tras guardar y volver a editar) — se guardan todas de una vez junto con el comercio.
- Admin > Reglas (Diccionario): el logo de un comercio ya vinculado es clicable y abre su edición (mismo comportamiento que su fila en Admin > Comercios), sin salir de la pantalla de Reglas.

## v1.567
- Admin > Reglas (Diccionario): el botón "+" ahora abre el mismo diálogo de crear comercio que hay en Admin > Comercios (nombre prellenado con la palabra, logo opcional), en vez de crear el comercio al instante sin confirmación — sigue sin salir de la pantalla.

## v1.565
- Admin > Reglas (Diccionario): el logo del comercio se movió fuera de la tabla, a la izquierda de cada fila. Cuando la palabra todavía no tiene comercio, aparece un botón "+" fuera de la tabla a la derecha para crearlo al momento (con el nombre de la palabra, alias por defecto y enlazado retroactivo automáticos) sin salir de la pantalla.

## v1.563
- Admin > Reglas (Diccionario): cada palabra muestra ahora un pequeño icono/logo si ya existe un comercio en el catálogo que la reconocería — de un vistazo se ve qué palabras ya tienen comercio creado y cuáles son candidatas.

## v1.561
- Movimientos: el nombre en negrita + logo de comercio solo aparece cuando el movimiento tiene un comercio real del catálogo (`/admin/comercios`) vinculado — se quita la "adivinanza" por diccionario que a veces mostraba palabras genéricas (bares, taxis...) como si fueran un comercio.
- Admin > Comercios: cada fila muestra ahora cuántos movimientos tiene vinculados ese comercio (en vivo, sin contador aparte que mantener), igual que ya se ve en el diccionario de Reglas.

## v1.559
- Admin > Comercios: la posición del asterisco en una variación ahora importa — "NOMBRE*" exige que el concepto EMPIECE por NOMBRE, "*NOMBRE" que TERMINE en NOMBRE, y "*NOMBRE*" que aparezca en cualquier posición (antes las tres se comportaban igual).
- Al crear un comercio nuevo, se generan automáticamente esos tres alias a partir del nombre (se pueden borrar o completar luego desde "Variaciones de concepto").

## v1.555
- Admin > Comercios: el asterisco (*) en una variación de concepto ahora funciona como comodín real ("cualquier texto"), no como texto literal — p. ej. "GLOVO*" casa con cualquier concepto que empiece por GLOVO, incluido "GLOVOGLOVO PRIME". Sin asterisco, sigue siendo coincidencia exacta por palabra/frase completa.

## v1.553
- Corregido: una variación de concepto de comercio con puntuación (p. ej. "GLOVO*") no casaba nunca con ningún movimiento, porque el concepto se limpiaba de puntuación antes de comparar pero el patrón escrito a mano no. Ahora ambos se limpian igual.

## v1.551
- Admin > Comercios: toda la fila de la lista es ahora clicable para editar (antes había que acertar en el lápiz); el botón de borrar sigue funcionando aparte sin abrir la edición.

## v1.549
- Admin > Comercios: al editar un comercio ya existente, se pueden añadir "variaciones de concepto" (grafías alternativas exactas, p. ej. "SANTAGLORIA" y "S GLORIA" para el mismo comercio) — si tiene alguna, se usan en vez del nombre para buscar coincidencias en los movimientos, y cada variación nueva re-etiqueta al momento el histórico.

## v1.546
- Corregido de raíz: el nombre de comercio detectado en Movimientos (cuando aún no existe en el catálogo) ya no se adivina contando palabras del concepto — eso rompía tanto comercios de una palabra con sucursal ("Mercadona Aribau" → ahora "Mercadona") como comercios de nombre compuesto ("Santa Gloria"/"New Fizz", que con el conteo salían recortados a "Santa"/"New"). Ahora se reutiliza el propio patrón del diccionario integrado que ya clasifica la categoría de ese movimiento, que ya tiene el nombre completo correcto en cada caso.

## v1.544
- Corregido: el nombre de comercio "adivinado" en Movimientos (cuando aún no existe en el catálogo) a veces arrastraba una segunda palabra que era la sucursal o calle, no parte del nombre ("Mercadona Aribau", "Lidl Bcn", "Mooby Balmes"). Ahora se queda solo con la primera palabra significativa del concepto.

## v1.542
- Movimientos: el tratamiento en dos líneas (nombre en negrita + concepto original debajo) ya no depende de que el comercio exista en el catálogo `/admin/comercios` — se aplica a cualquier movimiento donde se pueda identificar un comercio a partir del concepto (sin logo si todavía no está creado como tal).

## v1.540
- Movimientos: más separación entre el logo del comercio y el texto (antes quedaban muy pegados), y cuando hay comercio reconocido se muestra en dos líneas — el nombre del comercio en negrita arriba, el concepto original del extracto debajo.

## v1.538
- Movimientos: cuando el concepto de un movimiento reconoce un comercio del catálogo (Admin > Comercios), su logo sustituye al icono genérico de categoría. Al guardar un comercio con su logo, la app vincula automáticamente (sin pasos manuales) todos los movimientos históricos que lo mencionen, de cualquier usuario, y a partir de ese momento las importaciones nuevas también lo detectan solas.

## v1.534
- Análisis en móvil: quitado el toggle Gasto/Ingreso/No computable — ahora se pulsa directamente la columna de Ingresos o Gastos en la pastilla para filtrar el donut y el desglose (con un subrayado de color indicando cuál está activo). El donut se ha hecho más pequeño con el espacio ganado.
- Análisis en móvil: al hacer scroll, la cabecera + la tira mensual + la pastilla quedan fijas arriba (el donut pasa por debajo y se oculta); al llegar al desglose por subcategoría, su título también queda fijo y solo la lista de categorías se desplaza debajo.

## v1.522
- Nueva sección Admin > Comercios: catálogo de comercios reconocidos por el sistema de clasificación, cada uno con su logo (buscador, alta/edición/borrado). Es la base para que, más adelante, los movimientos muestren el logo del comercio en vez del icono genérico de categoría.

## v1.516
- Admin > Reglas de clasificación: las cabeceras de ambas tablas (Diccionario y Comunidad) ahora son clicables para ordenar por cualquier columna (palabra/comercio, categoría, votos, usos), alternando ascendente/descendente.
- Corregido: en la pestaña Diccionario, la pastilla de veces usada mostraba la clave sin traducir ("rules.used_count") en vez del texto ("Usada N veces") cuando el contador aún no tenía valor; ahora se comporta igual que en Comunidad.

## v1.513
- Admin > Reglas de clasificación: tanto el diccionario como las reglas de comunidad muestran ahora cuántas veces han clasificado un movimiento (contador de uso), junto al resto de datos de cada fila. Se cuenta al confirmar una importación, no en la vista previa.

## v1.511
- Admin > Reglas de clasificación: ahora tiene dos pestañas, "Diccionario" y "Comunidad". El diccionario integrado de categorización (antes fijo en el código) se mueve a base de datos: se puede ver todo el listado de palabras actuales agrupadas por categoría, buscarlas, añadir palabras nuevas y borrar las que sobren, sin necesidad de tocar código. La clasificación al importar sigue exactamente el mismo orden de siempre (reglas propias → comunidad → diccionario → sin categoría).

## v1.508
- Corregido: los importes de 4 cifras (1.000–9.999) se mostraban sin separador de millar (p. ej. "4807,10 €") mientras que los de 5+ cifras sí lo llevaban ("10.862,64 €"), por una particularidad del formateador de números del navegador en español. Ahora el separador de millar es siempre consistente en toda la app.

## v1.506
- Corregido: al abrir un movimiento con un concepto sin nombre de comercio reconocible (p. ej. solo números/códigos de referencia), el diálogo mostraba un pie simplificado ("Cancelar" / "Guardar categoría") en vez de las opciones habituales "Aplicar solo a este movimiento" / "Crear regla". Ahora ese pie es siempre el mismo, sin depender de si se detecta un comercio.

## v1.504
- Análisis (escritorio/tablet): el selector de periodo (Meses/Trimestres/Años) se mueve de la barra inferior a la cabecera, arriba a la derecha del título. Se libera el espacio de esa franja para que el resto de paneles lo aprovechen. En móvil no cambia (sigue en el desplegable del hueco superior derecho).

## v1.502
- Menú móvil (drawer): la cabecera ya no dice "Menú" — ahora muestra el logo y la marca "fintrack", igual que en el sidebar de escritorio. Se quita el selector de idioma del pie (ya vive en Ajustes). Arriba se listan todos los destinos de navegación (Inicio, Análisis, Presupuestos, Movimientos —con Reglas de clasificación si esa pantalla está activa—, Cuentas, Historial), y abajo del todo quedan agrupados Importar extractos, el bloque de usuario/plan y Administración, igual que en el sidebar de escritorio.

## v1.500
- Landing: en la barra fija que aparece al hacer scroll, el botón de registro pasa a decir "Regístrate" (antes "Empieza gratis") y usa el mismo coral que el resto de botones de la marca (antes era blanco). En móvil ya no desaparece este botón: se quita el toggle de idioma (ES/EN) de esa barra y quedan visibles "Entrar" y "Regístrate".

## v1.498
- Landing: quitada la frase "Si una app pide la contraseña de tu banco, ya ha pedido demasiado" de la pastilla "Nunca pedimos tus claves", por ser redundante con el mismo claim que ya aparece al final de la página.

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
