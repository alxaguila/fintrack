# Changelog

Lista de cambios por versión (`APP_VERSION` en `src/lib/version.ts`). Solo se añade una entrada cuando el código de la app cambia.

## v1.990
- Movimientos: el logo del comercio en cada fila ya no usa un redondeo tan pronunciado (menos que antes) — algunos logos cuadrados (p. ej. Orange) quedaban con el texto cortado por las esquinas muy curvas.

## v1.987
- Admin, Comercios: ahora se puede crear la regla de clasificación de un comercio directamente desde `/admin/comercios` (pastilla de categoría o botón "+" en cada fila), sin tener que ir aparte a Reglas. De paso, crear un comercio desde una palabra del diccionario en `/admin/reglas` también deja enlazada esa regla automáticamente.

## v1.984
- Presupuestos, detalle de sobre: la etiqueta "Sugerido" de una subcategoría sin presupuesto confirmado ahora es un botón ("Aceptar sugerido") que fija ese importe como presupuesto real con un click, sin tener que arrastrar el marcador.

## v1.978
- Landing pública: corregido el contraste de los eyebrows "Importa extractos de cualquier banco" y "El problema de siempre" (no llegaban al mínimo de contraste legible sobre el fondo crema). Añadido estado accesible (`aria-pressed`) a los botones de idioma ES/EN del menú y de la cabecera fija, para que un lector de pantalla sepa cuál está activo.

## v1.975
- Landing pública, tour de producto: la pastilla de texto de Movimientos deja de estar inclinada y con movimiento — vuelve a un formato y tamaño idénticos a los de Posición Global (la inclinación y el balanceo se quedan solo en las capturas, no en el texto).
- Análisis: en móvil el copy vuelve a aparecer encima de la captura (antes quedaba debajo); en escritorio se mantiene el layout con la captura a la izquierda.
- Quitado definitivamente el subtítulo del tour de producto ("Sin maquetas: así se ve zafyros...").

## v1.973
- Landing pública, tour de producto: se quita la barra de navegador falsa de las capturas, cada captura se inclina ligeramente hacia su copy (con un movimiento sutil, no quedan planas), y el texto de cada fila pasa a una "pastilla" navy con formato distinto en cada una para que no sea monótono. Análisis pasa al mismo tamaño que las otras dos filas, en el lado contrario; Movimientos queda en el mismo lado que Posición Global (esto también corrige que en móvil su texto apareciera debajo de la imagen en vez de encima).
- Landing pública: se intercambia el orden de las secciones "3 pasos" y "Seguridad" — Seguridad ya no queda pegada visualmente al bloque de CTA final (los dos únicos bloques navy grandes de la página dejan de ser consecutivos).
- Revisión de copy: unificado el CTA a "Empieza gratis" en todos los sitios (antes "Empezar gratis" en el selector de plan), quitada la mención a "en el plan Free"/"para siempre" del subtítulo del hero (habrá planes de pago en el futuro, no procede prometer gratis para siempre), reescrita la frase de "diccionario integrado"/"la comunidad" del tour (jerga interna y posible duda de privacidad) y ajustada la introducción del tour y del hero para ser más directas.

## v1.969
- Landing pública: la sección de features abstractas (ilustraciones de subida de CSV, bóveda y clasificación) se sustituye por un tour de producto con 3 capturas reales de la app (Posición Global, Análisis y Movimientos), cada una con su propio copy explicando qué resuelve, y apareciendo con scroll-reveal al bajar por la página.
- El mock decorativo del hero ahora saluda a "Toni" en vez de "Marta".

## v1.965
- Landing pública: se retira la sección de precios/planes (era prematura sin pasarela de pago). El funnel pasa a: producto → 3 pasos → seguridad → CTA final "Empieza gratis", sin mención de precios. El selector de planes dentro de la app (Ajustes > Plan) no se ve afectado, sigue funcionando igual.

## v1.961
- Historial de subidas: se quita el botón de eliminar (papelera) de la fila de tabla y de la tarjeta móvil. El borrado sigue disponible, pero ahora dentro del diálogo de editar/reasignar, como un enlace discreto "Eliminar subida" — se oculta un poco más una acción destructiva y poco frecuente.
- Historial de subidas en móvil: las tarjetas pasan a ser una lista plana separada por líneas finas de lado a lado (en vez de tarjetas individuales con borde y fondo propio).

## v1.956
- Ajustes > Datos personales: ahora se muestra primero la información guardada en texto plano (sin formulario), con un botón "Editar datos" que abre la pantalla de edición de siempre. Al guardar cambios, o al pulsar "Cancelar", se vuelve automáticamente a la vista de solo lectura.

## v1.954
- Icono de la pestaña del navegador (favicon): quitado el círculo navy de fondo y ampliado el diamante para aprovechar mejor el espacio; ahora se dibuja en navy sobre fondo transparente en vez de blanco sobre círculo. El isotipo dentro de la app (sidebar, menú móvil) no cambia.

## v1.951
- Dashboard: el donut de "Distribución del gasto/ingreso" ahora agrega por grupo de categoría en vez de por subcategoría — antes, varias subcategorías de un mismo grupo (p. ej. Supermercado, Restaurantes y Bares dentro de Alimentación) pintaban quesitos del mismo color y eran indistinguibles entre sí. La lista de subcategorías de debajo del donut no cambia, sigue mostrando el detalle tal cual.

## v1.949
- Corregido que el botón de perfil (sidebar y menú móvil) y el popup de perfiles mostraran el nombre del perfil financiero activo en vez del nombre de la cuenta: al cambiar tu nombre en Ajustes > Perfil no se veía reflejado si tenías un perfil financiero con otro nombre activo. Ahora ese botón siempre muestra el nombre de la cuenta.
- El perfil por defecto (el que representa al titular de la cuenta) ya no se puede renombrar desde el popup de perfiles — ese nombre solo se cambia desde Ajustes > Perfil. Los demás perfiles (Papá, Mamá, autónomo, empresa...) se siguen renombrando igual que antes.

## v1.928
- `/admin/estadisticas`: las gráficas de "Altas" y "Conexiones" ahora dibujan todos los días/semanas/meses del rango (antes solo se veían los que tenían algún dato, dejando huecos). Se oculta el eje de fechas (quedaba ilegible con muchos puntos); al pasar el cursor se sigue viendo el día y el valor exacto.

## v1.927
- `/admin/estadisticas`: cada selector de granularidad (Altas, Conexiones, Evolución por plan) recuerda su última elección en este navegador — antes se perdía al salir y volver a entrar, siempre volvía a "mes".

## v1.925
- `/admin/usuarios`: la lista de tarjetas pasa a ser una tabla (usuario, plan, fecha de alta, última conexión, movimientos, cuentas).
- `/admin/estadisticas`: la gráfica de "Altas" gana selector de día/semana/mes (antes solo por mes), y se añade una gráfica nueva de "Conexiones" con el mismo selector — cuenta conexiones reales a partir de ahora (no hay histórico previo, ya que antes solo se guardaba la última conexión de cada usuario).

## v1.908
- SEO técnico: corrige un bug real por el que todas las páginas públicas salvo la home (blog, entradas del blog, las 2 calculadoras, las 4 legales) perdían su `<title>` al cargar la URL directamente (justo lo que hace Googlebot al rastrear) — un `useEffect` sin condicionar en `App.tsx` sobreescribía el título de la página con el genérico de la home al montar. Se sustituye por un hook reutilizable (`useSeoMeta`) que fija título, `meta description`, `<link rel="canonical">` y Open Graph por página, y que ya usan todas las páginas públicas afectadas.
- Añadido JSON-LD `Organization` + `WebSite` en `index.html` (todas las páginas) y `BlogPosting` en cada entrada del blog.
- `sitemap.xml` y `robots.txt` pasan de `zafyros.com` a `https://www.zafyros.com`, el dominio real al que redirige el apex (confirmado navegando las 4 variantes: http/https × con/sin www); además se añaden al sitemap `/calculators` y `/calculators/retirement-savings`, que faltaban.

## v1.902
- Botón de Perfil (sidebar y menú móvil): muestra solo el primer nombre en vez del nombre completo, y añade un icono de flechas a la derecha para indicar que se puede cambiar de perfil.
- Corregido que Ajustes y Plan quedaban resaltados a la vez en el sidebar al estar en "Mi plan": ahora Ajustes solo se marca activo fuera de /settings/plan.

## v1.897
- Popup de perfiles: el texto explicativo ahora menciona explícitamente a autónomos y empresas, además de pareja/hijos/padres; cada perfil muestra una etiqueta de tipo (Particular / Autónomo / Empresa), elegible al crear el perfil y editable después junto con el nombre (nuevo botón de renombrar).
- Corregido que el perfil por defecto se creaba con el prefijo del email como nombre (p. ej. "alex.delaguila83") en vez del nombre real: la creación automática esperaba ya no era necesaria porque se disparaba antes de que el onboarding rellenara el nombre. Se corrige también en base de datos para todas las cuentas ya afectadas.
- Al pulsar "Nuevo perfil" estando ya en el máximo de perfiles del plan, se muestra directamente el aviso de límite con el botón para comparar planes, en vez de esperar a escribir un nombre.

## v1.895
- Sidebar y menú móvil: el bloque de usuario se separa en 3 botones — Perfil (abre un popup nuevo con qué es un perfil, el selector entre tus perfiles financieros y alta de uno nuevo), Ajustes (recupera la rueda dentada) y Plan (siempre visible, con el plan actual, enlaza al comparador de planes).
- El botón de Administración en el sidebar de escritorio abre ahora un menú flotante con acceso directo a sus 7 secciones, en vez de navegar primero al hub. En el menú móvil se mantiene igual que antes.

## v1.890
- Corregido que, tras loguear (Google o email), la app se quedaba en blanco hasta un minuto antes de entrar: las consultas de perfiles y ajustes de usuario se disparaban antes de que la sesión del hand-off terminara de resolverse, fallaban sin autenticación y quedaban reintentando con backoff exponencial. Ahora esperan a que la sesión esté confirmada.

## v1.887
- Corregido que el login (Google o email) volvía a la landing sin entrar a la app: el fix del deadlock de v1.886 seguía usando `signOut()` para limpiar la sesión local, que revoca el refresh token en el servidor aunque se llame con scope 'local' — invalidaba los tokens que se mandaban al hand-off. Ahora se borra solo la entrada de localStorage, sin llamada de red.

## v1.886
- Corregido que el login (Google o email) se quedaba colgado sin entrar a la app tras el fix del bucle de logout (v1.884): la limpieza de sesión local se llamaba de forma síncrona dentro del callback de `onAuthStateChange`, lo que provoca un deadlock conocido de supabase-js. Se difiere con `setTimeout`.

## v1.884
- Corregido bucle infinito de redirects entre zafyros.com y app.zafyros.com al cerrar sesión: la sesión creada en zafyros.com durante el login (Google o email) se quedaba sin limpiar tras el traspaso a app.zafyros.com, y al hacer logout esa copia obsoleta se reenviaba una y otra vez.

## v1.876
- Login con Google: el nuevo flujo de Identity Services (v1.867) cae automáticamente al redirect OAuth clásico si el navegador tiene desactivado FedCM (usado por Chrome para el prompt de Google) — evita que esos usuarios se queden sin poder loguearse con Google.

## v1.867
- Login con Google: se sustituye el redirect OAuth vía Supabase por Google Identity Services (ID token) + `signInWithIdToken`, para que la pantalla de consentimiento de Google ya no muestre el dominio interno de Supabase. Requiere configurar `VITE_GOOGLE_CLIENT_ID` (nuevo) y dar de alta ese Client ID en Supabase → Authentication → Providers → Google → Authorized Client IDs.

## v1.857
- Precios: Pro pasa a 5,99€/mes o 49€/año (antes 7,99€/9,99€ efectivos); Premium pasa a 12,99€/mes o 99€/año (antes 19,99€/14,99€ efectivos). Free se mantiene en 0€.
- Landing y popup de "Mejorar plan": en la vista anual, el precio grande ahora es el importe TOTAL del año (p. ej. "49€/año") en vez de un equivalente mensual, con el coste de 12 meses al precio mensual tachado al lado para visualizar el ahorro en euros. El toggle mensual/anual empieza siempre en "Mensual".

## v1.856
- Planes: el plan FREE baja de 50 a 25 reglas de clasificación; el plan PRO baja de 3.000 a 2.000 movimientos al mes.
- Presupuestos pasa a ser una función oficial (ya no "temporal/feedback") también en el plan FREE, limitada a 3 categorías fijas: Compras, Restauración y Ocio, y Hogar. El plan PRO/PREMIUM sigue con presupuestos ilimitados. Al intentar añadir otra categoría en FREE, sale un aviso de que hay más categorías disponibles en PRO/PREMIUM.
- Landing y popup de "Mejorar plan": actualizadas las cifras y el nuevo beneficio de presupuestos en FREE.

## v1.853
- Presupuestos, detalle de categoría: en móvil, la franja de 12 meses (de la categoría y de cada subcategoría) pasa a ser un carrusel horizontal deslizable en vez de texto encogido — arranca mostrando los últimos 6 meses con un poco del 7º asomando, y se puede deslizar hacia atrás para ver los meses anteriores.
- Presupuestos, pantalla principal: las pastillas de categoría son más bajas en móvil — el icono ahora va en la misma fila que el título en vez de ocupar su propia fila.

## v1.852
- Presupuestos, detalle de categoría: el título y la franja de 12 meses de la categoría madre quedan fijos arriba mientras se hace scroll por las subcategorías (antes se confundía con la franja de la primera subcategoría); se añade una línea separadora entre ambos y se oculta la barra de scroll visible.
- Se corrige que la franja de 12 meses (tanto la de la categoría como la de cada subcategoría) desbordara la pantalla en móvil y obligara a hacer scroll lateral.
- Se corrige que arrastrar una subcategoría para reordenarla seleccionara texto de la pantalla como efecto secundario.

## v1.846
- Categorías: se fusionan las subcategorías "Comida a domicilio" y "Copas y vida nocturna" dentro de "Restaurantes y bares", que pasa a llamarse "Restaurantes, bares y discotecas" — el límite entre las tres era difuso al clasificar movimientos.

## v1.836
- Título de pantalla homogeneizado: Análisis, Presupuestos, Reglas de clasificación, Cuentas, Historial y Ajustes (incluidas sus subpáginas Datos personales, Login y contraseña, Mi plan y Feedback y soporte) usan ahora el mismo estilo de título que Movimientos.
- En el menú de Ajustes, la entrada "Perfil" pasa a llamarse "Datos personales" (ya era el nombre del título dentro de esa pantalla).

## v1.834
- Swipe de movimientos en móvil: se corrige que fuera demasiado sensible y reaccionara con scroll vertical normal. Ahora el gesto decide una sola vez, al arrancar, si es claramente horizontal o vertical (comparando cuánto se mueve en cada eje); si es vertical, la fila no se mueve nada y el scroll sigue su curso sin interferencia.

## v1.821
- Análisis, gráfica de evolución por mes: ajuste del solape ingreso/gasto — la columna de ingresos ya no se pinta semitransparente por delante del gasto (se veía "mezclada" con el rosa en la zona de solape); ahora usa un azul sólido más claro cuando el mes no está seleccionado y el azul intenso al seleccionarlo, sin transparencia en ningún caso.

## v1.819
- Análisis, gráfica de evolución por mes: la columna de ingresos ya no se transparenta en los meses no seleccionados (se quedaba apagada junto con la de gastos; ahora los ingresos se ven siempre a opacidad plena).

## v1.818
- Análisis, gráfica de evolución por mes: el mes mostrado por defecto (el último) ahora aparece coloreado en intenso igual que si se hubiera seleccionado a mano — antes ningún mes quedaba resaltado hasta hacer clic.
- Al seleccionar un mes se mantiene solo el coloreado intenso; se ha quitado el contenedor gris que aparecía detrás.
- Al pasar el ratón por encima ya no aparece la línea/rectángulo de cursor entre las columnas del mes.
- El cuadro flotante que aparece al pasar el ratón ahora se coloca al lado del mes (con volteo automático cerca del borde derecho) en vez de tapar una de las columnas.
- Las columnas de ingreso y gasto ahora se dibujan ligeramente superpuestas (el ingreso por delante y a la izquierda) en vez de completamente separadas.
- Móvil: al tener una subcategoría filtrada y tocar una barra del mes, el importe ahora se muestra sustituyendo a la pastilla de Ingresos/Gastos/Balance (antes no se veía en ningún sitio).
- Móvil: la pastilla de Ingresos/Gastos/Balance ya no forma parte del bloque fijo (sticky) al hacer scroll — ahora se desplaza con el resto del contenido, y se ha reforzado el bloque fijo superior para evitar el pequeño salto que se veía al iniciar el scroll.

## v1.815
- Corrección: el build de producción fallaba en Vercel (error de TypeScript en `NotificationDetailDialog.tsx` que la caché local no había detectado). Sin cambios visibles para el usuario.

## v1.808
- El ticker de notificaciones ahora se desplaza a una velocidad constante y rápida (px/s fijo, no una duración fija) — antes, con un texto corto, apenas se movía en 18 segundos y era ilegible; ahora una línea cruza la caja en 1-2 segundos sea cual sea su longitud, y se mantiene visible el tiempo justo para leerla entera al menos una vez.

## v1.806
- Corrección: el ticker de notificaciones nunca llegaba a mostrarse — el temporizador de 5 segundos se cancelaba a sí mismo casi al instante por un efecto de React mal encadenado. Ahora sí anuncia las notificaciones nuevas.

## v1.802
- Nueva notificación: movimientos sin leer por perfil (cualquier cantidad > 0), con acceso directo a Movimientos filtrado por "no leídos".
- Nuevo "ticker" tipo noticia de última hora junto a la campana: cuando hay notificaciones nuevas sin anunciar, aparece a los 5 segundos un banner deslizante (transparente, junto a la campana) con el texto de cada notificación, una detrás de otra si hay varias; cada notificación se anuncia así una sola vez en su vida, tanto al entrar a la app como justo después de confirmar una importación.

## v1.800
- Corrección: "Entidad - Tipo de cuenta" en las notificaciones de cuenta sin alias ahora funciona de verdad — se lee en vivo de la cuenta enlazada en vez de depender de una migración adicional que no hacía falta.

## v1.797
- El punto rojo de la campanita de notificaciones ahora va dentro del círculo (sin borde), en vez de asomar por el borde.
- Las notificaciones de "cuenta sin actualizar" dejan de mostrar el perfil entre paréntesis cuando el usuario solo tiene un perfil; con varios perfiles, se sigue indicando a cuál pertenece.
- Cuando la cuenta no tiene alias propio, la notificación muestra "Entidad - Tipo de cuenta" en vez de repetir solo la entidad.

## v1.794
- Ajuste de varias pantallas para que sus botones/controles de la esquina superior derecha dejen de quedar tapados por la nueva campanita de notificaciones: "+ Nueva cuenta" (Cuentas), "+ Nueva regla" (Reglas de clasificación), filtros de Movimientos e Historial, y el selector de periodo de Análisis y Presupuestos en escritorio.

## v1.790
- Nueva campanita de notificaciones dentro de la app: icono flotante en la esquina superior derecha, visible en todas las pantallas (escritorio y móvil), con un punto rojo cuando hay avisos sin leer.
- Primer tipo de notificación: cuentas que llevan varios días sin importar movimientos nuevos (aviso a los 15 días, importante a los 30), agregadas de todos tus perfiles. Al abrir una notificación se marca como leída y se ve el detalle completo en un popup, con acceso directo a Importar.

## v1.786
- Historial de subidas en móvil: las tarjetas de cada subida ya no van dentro de un contenedor grande con su propio fondo y borde — se muestran directamente sobre el fondo de la pantalla, con más ancho al no perder espacio en el padding del contenedor.
- El fondo de cada tarjeta pasa a ser el mismo que el de la pantalla (antes era blanco), quedando definidas solo por el borde.
- Al hacer scroll vertical en la lista de subidas en móvil ya no se ve la barra de scroll.

## v1.784
- Historial de subidas: la columna y el desplegable de Entidad muestran ahora el logo real del banco (mismo catálogo que Movimientos/Cuentas), y el desplegable de Tipo muestra el icono y color de cada tipo de cuenta.
- Los tres primeros desplegables de filtro (Entidad, Tipo, Alias) se acotan entre sí: elegir uno oculta en los otros dos las combinaciones que ya no pueden darse (p. ej. elegir una entidad ya no deja elegir un alias de otra entidad), y si un filtro deja de ser compatible se limpia solo.
- En la tabla, la columna Entidad deja de acaparar todo el ancho libre y las columnas Desde/Hasta/Nº de movimientos quedan mejor repartidas y centradas; además llevan encima el rótulo "Movimientos" para dejar claro que ese rango de fechas es el de los movimientos importados, no el de la subida.
- En móvil: los filtros pasan a estar colapsados por defecto (con botón "Mostrar/Ocultar filtros", igual que en Movimientos) y el título "Historial de subidas" ya no se parte en dos líneas; la tabla se sustituye por una lista de tarjetas por subida, mucho más legible en pantalla estrecha.

## v1.781
- La calculadora de "Aportación para tu objetivo de patrimonio" pasa a llamarse "Inversión mensual necesaria" en todos los sitios donde aparece (título, pestaña del navegador, tarjeta del índice `/calculators`).
- Sus rangos se ajustan: capital inicial actual hasta 150.000 € (antes 500.000) y patrimonio objetivo hasta 2.000.000 € (antes 5.000.000).
- Se corrige un enlace del blog que apuntaba a la Calculadora de Interés Compuesto pese a que el texto hablaba explícitamente de "retrasar la edad de retiro o cambiar la aportación mensual" — ahora enlaza a Inversión Mensual Necesaria, que es la que calcula justo eso.
- El campo "Edad de jubilación objetivo" se partía en dos líneas (etiqueta y campo) por el ancho del recuadro numérico; los campos de edad/años/porcentaje vuelven a un ancho compacto, y solo los campos en € (con separador de miles) mantienen el recuadro más ancho.
- El campo de rentabilidad de esta calculadora pasa a llamarse "Interés anual estimado", igual que en Interés Compuesto (antes decía "Rentabilidad estimada").

## v1.779
- Calculadoras financieras: el aviso legal (`CalculatorDisclaimer`) pasa de ir justo debajo del bloque de resultados (por encima de la gráfica) a ir debajo de todos los elementos de la calculadora, justo encima del footer de la página — así queda claramente separado del contenido interactivo, tanto en Interés Compuesto como en Aportación para tu Objetivo.

## v1.777
- Calculadoras financieras: se añade un aviso legal breve debajo del bloque de resultados (Interés Compuesto y Aportación para tu Objetivo), con enlace directo al Aviso Legal, igual que ya tenía el blog; se implementa como componente reutilizable (`CalculatorDisclaimer`) para que cualquier calculadora futura lo incluya sin esfuerzo extra.

## v1.773
- Calculadoras: los campos de importe en € (capital inicial, aportación mensual, patrimonio objetivo...) ahora muestran separador de miles en el input numérico (antes se veía "1000000" en vez de "1.000.000"), tanto en Interés Compuesto como en Aportación para tu Objetivo; se corrige también el parseo al editar el campo a mano para que entienda ese separador.
- Calculadora de Aportación para tu Objetivo: el indicador comparativo del resultado principal se corrige de raíz — antes calculaba "cuánto necesitarías si hubieras empezado 5 años antes" asumiendo (de forma poco realista) que ya tendrías hoy el mismo capital en el pasado; ahora calcula el "coste de esperar 3 años para empezar a aportar" a partir de tu situación actual (tu capital sigue creciendo igual esos 3 años, pero tendrías 3 años menos de aportación por delante), un planteamiento correcto y con una ventana de tiempo más cercana.

## v1.769
- Nueva Calculadora de "Aportación para tu Objetivo de Patrimonio" (`/calculators/retirement-savings`): dado el patrimonio objetivo, la edad actual y de jubilación, el capital ya ahorrado y una rentabilidad estimada, calcula la aportación mensual necesaria (fórmula PMT), con gráfico de evolución hasta la edad de jubilación marcando el objetivo, y un indicador de cuánto se reduciría la aportación empezando 5 años antes.
- Nuevo índice `/calculators` con las dos calculadoras (Interés Compuesto y Aportación para tu Objetivo); el enlace "Calculadoras financieras" del footer de la landing pasa a apuntar ahí en vez de ir directo a Interés Compuesto.
- El blog enlaza ahora la nueva calculadora desde la sección "Las cifras de referencia según tu edad" (antes enlazaba ahí a Interés Compuesto, que sigue enlazada en las otras dos secciones del post donde encaja mejor).

## v1.766
- Calculadora de Interés Compuesto: el slider "Horizonte temporal" pasa del grupo "Supuestos de crecimiento" al grupo "Tus datos" (junto a capital inicial y aportación mensual).

## v1.763
- Calculadora de Interés Compuesto: al ganar altura el panel de "Tus datos" en escritorio, quedaba un hueco en blanco al final de la tarjeta; los dos bloques de sliders ("Tus datos" y "Supuestos de crecimiento") ahora se reparten ese espacio extra entre ellos en vez de acumularse todo debajo del último campo.

## v1.762
- Calculadora de Interés Compuesto: la barra de "desglose por año" pasa a una sola línea (se quita el subtítulo con el recuento de filas y se reduce el padding); sus columnas cambian a Aportación acumulada / Intereses acumulados / Patrimonio acumulado (antes mostraba el interés solo del año en curso); en escritorio, el bloque del panel de inputs y la gráfica gana altura para aprovechar todo el alto de la pantalla, de forma que desde el título hasta la barra de desglose quepa sin scroll en la mayoría de resoluciones de escritorio.

## v1.757
- Rediseño completo de la Calculadora de Interés Compuesto (desktop y móvil): el patrimonio final pasa a una tarjeta destacada oscura con un badge de rentabilidad y una frase de contexto ("con X años de horizonte y un Y% de interés anual estimado"), acompañada de 2 tarjetas secundarias (capital aportado, intereses generados); los sliders se agrupan en "Tus datos" y "Supuestos de crecimiento" con un separador; se eliminan el selector de frecuencia de capitalización (el cálculo pasa a ser siempre mensual) y el botón "Compartir resultado"; nuevos rangos: capital inicial 0-100.000 €, aportación mensual 0-1.000 €, horizonte 1-40 años, interés anual 0-15 %; el bloque de desglose año a año añade una descripción de lo que contiene la tabla.

## v1.755
- Blog: la firma "El Equipo de Zafyros" pasa a ir dentro de la tarjeta de contenido, alineada a la derecha (antes quedaba fuera, a la izquierda).
- Blog: el aviso legal al final de cada entrada enlazaba "Aviso Legal" dos veces (una vez en negrita dentro del texto y otra como enlace suelto al final); ahora la propia mención dentro del texto es el enlace, sin duplicar.

## v1.753
- Blog: corrige el orden dentro de "El efecto del tiempo en tu dinero" — la ilustración vuelve a ir antes del enlace a la Calculadora de Interés Compuesto (no después).
- Blog: recalculadas las cifras de "Las cifras de referencia según tu edad" para que las 5 franjas de edad apunten a un mismo objetivo compartido (1.000.000 € a los 65 años, 8% de rentabilidad anual), en vez de a capitales finales dispares (antes la franja de 20-25 años daba ~1,2M€ frente a ~1M€ del resto); se explica también el método de cálculo (aportación fija mensual, rango según empezar al principio o al final de la franja).
- Blog: el cierre de "Resumen práctico" añade un enlace explícito a lo que ofrece Zafyros para dar el paso (importar extractos, categorías automáticas, presupuestos), con botón "Empieza gratis con Zafyros" hacia el registro.
- Blog: todas las entradas quedan firmadas al final por "El Equipo de Zafyros" (firma genérica en el componente del blog, no hace falta añadirla en cada entrada nueva).
- Blog: se corrige la capitalización de la marca a "Zafyros" (mayúscula inicial) en el texto de las entradas.

## v1.751
- Blog: las imágenes de las entradas ahora se pueden hacer clic para verlas a tamaño completo (lightbox con fondo oscuro, cierre con la X, clic fuera o tecla Escape).
- Blog: la tarjeta de contenido de una entrada ganó ancho (de 760px a 900px) para reducir el aire vacío a los lados en pantallas anchas.
- Entrada "Cuánto deberías invertir cada mes según la edad": la ilustración de las bolas de nieve pasa de ir justo antes del apartado "El efecto del tiempo en tu dinero" a ir al final de ese mismo apartado.

## v1.742
- SEO: añadida `meta description` en `index.html` (no existía ninguna), y nuevos `public/robots.txt` (bloquea `/app`, la app autenticada; permite el resto y enlaza al sitemap) y `public/sitemap.xml` con las páginas públicas (home, registro, calculadora, blog e índice, y las 4 páginas legales). Motivado por que Google mostraba en el snippet de búsqueda contenido genérico de una plantilla antigua de aparcamiento del dominio en vez del sitio real — este cambio da señales frescas para que Google recrawlee y muestre la descripción correcta.

## v1.737
- Nuevo blog público (`/blog`), con índice de entradas y primera entrada "Cuánto deberías invertir cada mes según la edad (y qué hacer si vas tarde)" (ES+EN), enlazada ya desde el footer. Incluye enlaces a la Calculadora de Interés Compuesto, dos ilustraciones y un aviso de que el contenido es informativo, no asesoramiento financiero personalizado (con enlace al Aviso Legal). Las entradas nuevas se añaden por código (`src/i18n/locales/{es,en}/blog.json` + `src/lib/blog/posts.ts`), sin necesidad de un componente propio por artículo — no hay todavía una pantalla de administración para publicar sin tocar código.

## v1.731
- La URL de la Calculadora de Interés Compuesto pasa de `/calculadoras/interes-compuesto` a `/calculators/compound-interest`, en inglés como el resto de rutas de la webapp (queda como norma para las páginas públicas nuevas; las páginas legales ya publicadas en español no se tocan). Los parámetros de la URL para compartir/enlazar una configuración también pasan a nombres en inglés (`initial`, `contribution`, `years`, `rate`, `increase`, `frequency`).

## v1.728
- Calculadora de Interés Compuesto: corrige que los importes de las pastillas se envolvían a dos líneas (se quita el `word-break` que los partía y se ajusta el tamaño de fuente para que quepan en una sola línea); la cuarta pastilla, antes con dos datos apilados, pasa a mostrar un único valor — la rentabilidad total sobre lo aportado en porcentaje; los títulos de las pastillas adoptan el mismo estilo tipográfico que "Tus datos" en el panel de inputs.

## v1.726
- Calculadora de Interés Compuesto: todo el texto de las 4 pastillas de resultado queda centrado, las etiquetas pasan a negrita y los números ganan tamaño; en la pastilla "Interés" el segundo dato deja de ser el importe absoluto (que se desbordaba fuera de la tarjeta) y pasa a ser la rentabilidad relativa sobre lo aportado (intereses ÷ capital aportado × 100, p. ej. "196,8%"); de paso se corrige que el % anual se mostraba con punto decimal en vez de coma.

## v1.724
- Calculadora de Interés Compuesto: reordenadas las 4 pastillas de resultado (Capital aportado, Patrimonio acumulado, Intereses generados e Interés, esta última con el % anual y el total acumulado apilados dentro de la misma pastilla); los valores de las 4 pastillas quedan siempre a la misma altura aunque su etiqueta ocupe una o dos líneas; los decimales de los importes en € se muestran más pequeños y atenuados frente a la parte entera; el desglose año a año pasa a ser una fila propia a todo lo ancho, debajo del bloque de inputs y resultado, en vez de ir dentro de la columna derecha.

## v1.722
- Ajustes de la Calculadora de Interés Compuesto (`/calculadoras/interes-compuesto`): el slider de aportación mensual topa en 1.000 € (el campo numérico sigue admitiendo hasta 10.000 € a mano); el desglose año a año queda oculto por defecto tras un texto "Ver desglose año a año"; el KPI de intereses se separa en "Interés anual" (el % configurado) e "Intereses generados" (importe total); la gráfica gana protagonismo y las tarjetas de resumen se hacen más compactas, con las dos columnas alineadas a la misma altura; el botón "Compartir resultado" abre ahora el panel nativo de compartir del móvil (WhatsApp, email...) cuando está disponible, con el enlace de la configuración exacta y un resumen del resultado, y sigue cayendo a copiar el enlace al portapapeles en escritorio.

## v1.719
- Nueva Calculadora de Interés Compuesto en la landing pública (`/calculadoras/interes-compuesto`), enlazada ya desde el footer: simula la evolución del patrimonio con capital inicial, aportación mensual (con incremento anual opcional), horizonte temporal e interés estimado (capitalización mensual o anual), con gráfico de capital aportado vs. intereses, tabla de desglose año a año y botón para compartir la configuración por URL. Cálculo 100% en el navegador, sin guardar ni enviar ningún dato a ningún sitio.

## v1.713
- Política de Privacidad (ES+EN): añadido Resend como nuevo encargado del tratamiento (envío de correos transaccionales y de uso del servicio, datos alojados en la UE, Irlanda) y una nueva finalidad en la tabla del §3 cubriendo las comunicaciones de uso de la cuenta (bienvenida, recordatorios, confirmaciones de suscripción), sin incluir marketing.

## v1.703
- Emails de código (registro y recuperación de contraseña) de `send-auth-email`: corrige el ligero desajuste de centrado entre la etiqueta "Tu código" y el número (efecto del `letter-spacing`) y pasa la marca a "Zafyros" con mayúscula en el texto (asunto, título, cuerpo, pie de página), manteniendo el logotipo de la cabecera y el dominio `zafyros.com` en minúscula.

## v1.691
- Nueva Edge Function `send-auth-email`: los correos de verificación de registro y de recuperación de contraseña pasan a enviarse vía Resend con plantilla de marca zafyros, en vez del correo genérico por defecto de Supabase. El idioma del correo es el real del usuario (no bilingüe). Pendiente de activar en producción: cuenta y dominio verificado en Resend + Auth Hook "Send Email" en el dashboard de Supabase (ver guía aparte).

## v1.684
- La pantalla de "Completar registro" (onboarding tras verificar el email) usaba el wordmark viejo "FinTrack"; ahora muestra la marca zafyros.
- Móvil: mientras un usuario nuevo no tiene ningún extracto importado, cada pantalla (Posición Global, Análisis, Presupuestos, Movimientos, Cuentas, Historial) mostraba solo el aviso genérico de "sube tu primer extracto" sin indicar en qué sección estás; ahora cada una muestra su propio título y subtítulo por encima del aviso.
- En Análisis (móvil), el selector de periodo (mes/trimestre/año) ya no aparece si todavía no hay ningún extracto importado.
- Aclarado el mensaje de "sube tu primer extracto": ahora explica que cuanto más largo sea el periodo que cubre el extracto (p. ej. desde junio de 2023), más completo será el análisis, en vez del ambiguo "cuanto más antiguo".

## v1.681
- Corrige un bug por el que iniciar sesión con email y contraseña (o registrarse, o restablecer la contraseña) dejaba la pantalla parpadeando entre `zafyros.com` y `app.zafyros.com` sin llegar a entrar a la app — la sesión no viajaba entre esos dos subdominios. Ahora se pasa junto con el redirect, igual que ya funcionaba con "Continuar con Google".
- El error de Supabase "email rate limit exceeded" al registrarse ya no se muestra en crudo: se traduce a un mensaje claro de "demasiados intentos, esperá unos minutos".

## v1.676
- Textos legales (Aviso Legal, Privacidad, Cookies y Términos): dominio y email reales (`www.zafyros.com` / `app.zafyros.com` para la aplicación, `zafyros@gmail.com` como contacto provisional), en sustitución de los placeholders de borrador.
- Privacidad y Términos aclaran que, además del autoborrado desde Ajustes, un administrador del servicio puede eliminar la cuenta de un usuario en supuestos excepcionales (incumplimiento grave, fraude o requerimiento legal), con el mismo alcance irreversible.

## v1.670
- El admin ya puede eliminar usuarios desde `/admin/usuarios` (ficha de usuario → zona de peligro), con la misma doble confirmación que el autoborrado de cuenta ("Eliminar" → escribir la palabra `delete`). Es un borrado total e irreversible, pero se conservan las reglas de comunidad que ese usuario había aportado para que el resto de usuarios las sigan aprovechando.

## v1.667
- La animación de ejemplo del swipe en Movimientos (móvil) pasa de mostrarse siempre a mostrarse solo una vez por semana: si hace más de 7 días desde la última vez que este navegador la vio, se repite; si no, no vuelve a aparecer.

## v1.664
- Barra inferior móvil: la etiqueta "Posición Global" se partía en dos líneas y subía el icono, desalineándolo respecto a los demás botones. Pasa a "Pos. Global" (y "Global Pos." en inglés) para que quepa en una sola línea.

## v1.662
- Corrige la asimetría del isotipo zafyros (diamante de líneas): la esquina superior izquierda estaba más separada del centro que la derecha, dejando menos aire en el facet izquierdo. Se ajusta para que quede simétrico, tomando el lado derecho como referencia. Se corrige en los 3 sitios que usan el path (Logo.tsx, brand.tsx, MobileNav.tsx) y en los SVG públicos (favicon.svg, logo.svg).

## v1.660
- Corrige el toggle Todos/No leídos/Sin categoría de la pasada anterior: el reparto a partes iguales hacía que "Sin categoría" se partiera en dos líneas. Ahora "Sin categoría" y "No leídos" llevan más peso que "Todos" y el texto nunca se parte en dos líneas, para que quepan en una sola línea incluso con contadores de 4 cifras.

## v1.657
- Toggle Todos/No leídos/Sin categoría (Movimientos, móvil y escritorio): los 3 botones ahora se reparten el ancho a partes iguales en vez de ajustarse cada uno a su propio texto, con el contenido centrado.
- Nuevo estándar de diálogo en toda la app: en móvil dejan de ir a pantalla completa — ahora tienen margen respecto al borde y quedan redondeados (`rounded-2xl`) igual que en escritorio, un aspecto más de "popup" y menos de pantalla completa. Los diálogos con contenido más rico (mejora de plan, límite alcanzado, aviso de presupuestos) mantienen su ancho completo a propósito.

## v1.655
- Movimientos en móvil, séptima pasada: el fondo blanco de la fila sin leer ahora llega de extremo a extremo de la pantalla (antes se quedaba dentro del margen de la página); el texto no cambia de posición, solo el fondo se extiende. La animación de ejemplo del swipe pasa de saltos con pausas a un recorrido continuo y suavizado, y revela el panel de acción al completo (antes se cortaba antes de llegar y no se leían las palabras).
- Barra inferior: el icono de zafyros del botón "Menú" se veía pequeño frente a los demás — se recorta su encuadre para que tenga la misma altura visual que el icono de Inicio. La etiqueta de "Inicio" pasa a "Posición Global" (como ya se llama esa pantalla en el resto de la app), en dos líneas si hace falta.

## v1.653
- Movimientos en móvil, sexta pasada: fila sin leer con fondo blanco y comercio/concepto en negrita (antes solo el concepto sin comercio se ponía en negrita). El toggle de estado pasa a ser excluyente en móvil y escritorio: se quita "Leídos" (no aportaba) y ahora Todos/No leídos/Sin categoría son mutuamente excluyentes en vez de combinables. Se corrige la animación de ejemplo del swipe: ahora sí se ven los colores de fondo (usa el mismo mecanismo que un swipe real en vez de una animación CSS aparte).
- Barra inferior (toda la app, móvil): el botón "Menú" pasa a usar el isotipo de zafyros en vez del icono de hamburguesa; se corrige el reparto de los 5 botones (antes el último podía quedar fuera de la pantalla y requerir scroll horizontal). El icono de "Presupuestos" cambia de hucha a calculadora, en móvil y escritorio.

## v1.651
- Movimientos en móvil, quinta pasada: si el movimiento tiene comercio se oculta la línea de concepto (solo comercio + subcategoría, menos texto); el nombre del comercio deja de ir en negrita y comparte tamaño y tipografía con el concepto (excepción solo de esta pantalla en móvil, el resto de la app sigue con font-mono uppercase); icono/logo un poco más a la izquierda. En el swipe: los paneles ahora muestran también el texto de la acción ("Cambiar categoría" / "Marcar como leído" / "Marcar como no leído", con el icono correcto según lo que va a pasar, no el estado actual); tanto el color como la distancia de arrastre pasan de la mitad a un cuarto del ancho de la fila; el contenido se transparenta un poco mientras se arrastra para que se note el color de debajo. Escritorio no cambia.

## v1.649
- Movimientos en móvil, cuarta pasada: el bloque superior pasa de `sticky` a `fixed` para eliminar el pequeño salto/jitter que hacía al hacer scroll (comportamiento conocido del scroll con inercia en móvil); menos margen izquierdo/derecho por fila para ver más texto; se añade la subcategoría como texto bajo el concepto/comercio. Se sustituye el botón de leído/no leído por swipe: deslizar a la izquierda marca leído/no leído, deslizar a la derecha abre reclasificar (el toque normal se mantiene igual); al entrar a la pantalla se anima brevemente la primera fila para enseñar el gesto. Escritorio no cambia.

## v1.647
- Movimientos en móvil, tercera pasada: los separadores de grupo pasan de relativos (Esta semana/Este mes) a un día exacto por línea ("Sábado, 18 de julio de 2026", sin contador ni importe acumulado); al vivir la fecha en el separador, se quita la columna de fecha de cada fila. El icono de leído/no leído es aún más pequeño y "Marcar todo leído" queda alineado a la derecha. Se quita la cabecera de columnas (Concepto/Fecha/Entidad...). El bloque superior (título, filtros, estado y marcar todo) queda fijo (sticky) mientras se hace scroll de la lista, incluidos los campos de filtro si están desplegados. Escritorio no cambia.

## v1.645
- Movimientos en móvil, segunda pasada tras feedback: se oculta el "sin leer" del resumen cuando es 0; el botón "Marcar todo leído" baja a su propia línea (ya no se solapa con el toggle Todos/No leídos/Leídos/Sin categoría); se quita la tarjeta (borde/sombra) que envolvía cada grupo de movimientos para aprovechar todo el ancho; la columna de fecha se comprime a dd/mm y el botón "Leído/No leído" pasa a ser un icono compacto (con tooltip), liberando espacio para ver mejor el comercio y el concepto de cada movimiento. Escritorio no cambia.

## v1.643
- Movimientos en móvil: los filtros (búsqueda, cuenta, tipo, fechas, importe) quedan ocultos por defecto para dejar ver más movimientos en pantalla; nuevo botón "Mostrar filtros"/"Ocultar filtros" donde antes estaba "Limpiar filtros", que ahora se coloca justo debajo de los campos cuando están visibles. El toggle Todos/No leídos/Leídos + Sin categoría se fuerza a una sola línea (con scroll horizontal si no cabe). El aviso "Mostrando 1-50" deja de quedar fijo en pantalla y solo aparece al llegar al final del listado. En escritorio no cambia nada.

## v1.640
- Corrige los menús y enlaces internos de la app (Sidebar, MobileNav, hubs de Admin/Ajustes, OnboardingGate, AdminRoute, y navegaciones internas de Home/Dashboard/Import) que tenían la ruta `/app/...` hardcodeada: en `app.zafyros.com` esas rutas cuelgan de `/` (no de `/app`), así que cualquier clic caía en el catch-all y volvía siempre a Home. Nuevo `appPath()` en `src/lib/appUrl.ts` centraliza el prefijo correcto según el host.

## v1.638
- Corrige `getAppUrl()`: en local/preview devolvía una ruta relativa (`/app`) en vez de una URL absoluta; `signInWithOAuth({ redirectTo })` necesita una URL absoluta y con la ruta relativa el login con Google fallaba con `"requested path is invalid"`. Ahora siempre devuelve `origin + /app` en esos entornos.

## v1.628
- Preparada la app para servirse en `app.zafyros.com` (SEO: el contenido indexable queda en `zafyros.com`). Mismo build, ramificado por hostname: en `app.zafyros.com` la app autenticada se monta en "/" en vez de "/app"; el login (email/OTP y Google) y el restablecimiento de contraseña ahora aterrizan en el subdominio de la app; cabecera `X-Robots-Tag: noindex` para que ese subdominio no se indexe. En local/preview el comportamiento con `/app` no cambia.

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
