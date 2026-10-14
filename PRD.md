# PRD-001: Cable a Tierra — anotador de partidos de amigos (MVP solo fútbol)

## Contexto y Problema
Hoy en día hay muchos partidos amateur entre amigos y amigas, todos los días, en todos lados, cada Argentino y Argentina trata de lograr hacer su descarga a tierra ejercitando su pasión por algún deporte.
El dolor que hay es en la era de la tecnología que vivimos no tener nada anotado, no poder mostrar en redes sociales sus propios goles, sus puntos, sus victorias, sus trofeos, sus estadísticas.
Las personas a quienes se les dirige este proyecto es a todas aquellas que quieren contabilizar su pasión de otra manera y reconocer su esfuerzo, a todos los jugadores y jugadoras del deporte amateur que practiquen.
Hoy en día nadie anota, los partidos de fútbol suelen ser de 12 personas, 6 versus 6, suele haber un listado en el grupo de Whatsapp pero tiene solo el fin de saber quién va a jugar, no hay forma de conocer cuántos partidos participó cada uno, cuántos goles hizo etc. Suele haber un jugador que decide de qué equipo es cada uno, cuando el partido es parejo (no termina con diferencia superior a dos goles) se le otorga la confianza a ese jugador de que arme el siguiente partido.

## Objetivos
Que el 80% de los partidos dados de alta en cada organización queden finalizados y que un jugador/a amateur logre sentirse con un incentivo extra al ver cómo a lo largo del tiempo suma más participaciones y acumula más estadística e incluso por qué no, ver cómo va mejorando.

## Requerimientos Funcionales
- RF-01: El sistema debe permitir a un usuario iniciar sesión con su cuenta de Google; el primer inicio de sesión lo registra.
- RF-02: El sistema debe permitir a cualquier jugador/a registrado crear una organización (ese jugador/a es administrador/a).
- RF-03: El sistema debe almacenar los datos de las organizaciones donde se concentre la información (dicha organización está formada por un nombre, una descripción, grupo de jugadores/as y partidos).
- RF-04a: El sistema debe permitir ingresar en modo invitado, sin iniciar sesión.
- RF-04b: El sistema debe impedir que un usuario en modo invitado cree o edite cualquier información.
- RF-04c: El sistema debe mostrar el nombre completo y la fecha de nacimiento de los jugadores/as de una organización a sus miembros (sus administradores/as y los usuarios asociados a un jugador/a de ella).
- RF-04d: El sistema debe mostrar solo el apodo de los jugadores/as de una organización a quienes no son miembros de ella (usuarios en modo invitado o usuarios registrados que no son miembros).
- RF-05: El sistema debe almacenar de cada jugador/a: nombre, apodo, fecha de nacimiento y cantidad de partidos, goles, victorias, empates y derrotas.
- RF-06a: El sistema debe exigir que cada organización tenga al menos un administrador/a.
- RF-06b: El sistema debe permitir al administrador/a de una organización editar los partidos pendientes de esa organización.
- RF-06c: El sistema debe impedir que un usuario que no es administrador/a de una organización cree o edite jugadores/as de esa organización.
- RF-06d: El sistema debe impedir que un usuario que no es administrador/a de una organización cree o edite partidos de esa organización.
- RF-06e: El sistema debe permitir al administrador/a de una organización editar el nombre y la descripción de esa organización.
- RF-06f: El sistema debe impedir que un usuario que no es administrador/a de una organización la edite.
- RF-06g: El sistema debe impedir la edición de partidos finalizados.
- RF-07a: El sistema debe permitir al administrador/a de una organización crear jugadores/as en esa organización.
- RF-07b: El sistema debe permitir al administrador/a de una organización asociar una cuenta registrada a un jugador/a de esa organización.
- RF-07c: El sistema debe impedir que una cuenta esté asociada a más de un jugador/a de la misma organización.
- RF-07d: El sistema debe impedir que un jugador/a esté asociado a más de una cuenta.
- RF-07e: El sistema debe rechazar la creación de un jugador/a en una organización que ya tiene 40 jugadores/as.
- RF-08a: El sistema debe permitir al administrador/a de una organización dar de alta un partido de esa organización con día, lugar y los jugadores/as de cada equipo, elegidos del listado de jugadores/as de la organización.
- RF-08b: El sistema debe permitir al administrador/a de una organización finalizar un partido de esa organización cargando los goles de cada jugador/a.
- RF-08c: El sistema debe sumar cada gol en contra al marcador del equipo rival sin acreditarlo a ningún jugador/a.
- RF-08d: El sistema debe exigir que cada equipo de un partido tenga al menos 1 jugador/a.
- RF-08e: El sistema debe permitir al administrador/a, al dar de alta un partido, agregar a un equipo un jugador/a externo/a indicando solo su apodo.
- RF-09: El sistema debe al finalizar un partido sumar los goles a cada jugador/a.
- RF-10: El sistema debe, al finalizar un partido, sumar a cada jugador/a una victoria si su equipo hizo más goles que el rival, un empate si hicieron los mismos, o una derrota si hizo menos.
- RF-11: El sistema debe al finalizar un partido sumar un partido más a cada jugador/a.
- RF-12: El sistema debe mostrar la lista de partidos de una organización, ordenada por día del partido del más reciente al más antiguo, indicando si cada uno está finalizado o pendiente.
- RF-13: El sistema debe mostrar una lista de todos los jugadores/as que son parte de la organización.
- RF-14: El sistema debe permitir ordenar el listado de jugadores/as de una organización por cantidad de partidos, goles, victorias, empates o derrotas, de mayor a menor.
- RF-15: El administrador de la organización debe poder editar la información de los jugadores/as de su nombre, apodo y fecha de nacimiento.
- RF-16: El sistema debe mostrar a cualquier usuario, incluido el que está en modo invitado, el listado de todas las organizaciones, ordenado por cantidad de partidos finalizados de mayor a menor (a igual cantidad, alfabéticamente por nombre).
- RF-17: El sistema debe impedir que cualquier usuario elimine una organización.
- RF-18: El sistema debe impedir el inicio de sesión con cualquier método distinto de Google (por ejemplo, usuario y contraseña).
- RF-19a: El sistema debe rechazar nombres de jugadores/as de más de 40 caracteres.
- RF-19b: El sistema debe rechazar apodos de jugadores/as de más de 40 caracteres.
- RF-19c: El sistema debe rechazar fechas de nacimiento de jugadores/as anteriores al 1 de enero de 1920.
- RF-20a: El sistema debe mostrar como "externo/a" a todo jugador/a de un partido que no pertenezca a la organización del partido.
- RF-20b: El sistema debe excluir a los jugadores/as externos del cómputo de partidos, goles, victorias, empates y derrotas; sus goles sí suman al marcador de su equipo.
- RF-21: El sistema debe permitir que una misma cuenta esté asociada a jugadores/as de distintas organizaciones, cada uno con sus propios datos en su organización (por ejemplo, "Pepe" en la organización A y "José" en la organización B).

## Requerimientos No Funcionales
- RNF-01: El sistema debe validar todos los permisos en Firestore Security Rules o en el servidor; una operación no permitida debe rechazarse aunque se envíe directamente a la base de datos sin pasar por la UI.

Condiciones de medición para RNF-02 a RNF-07: percentil 95 (p95), medido desde que el usuario ejecuta la acción hasta que el resultado se ve en pantalla, en el entorno de producción, con el perfil de red "Fast 4G" de Chrome DevTools.

- RNF-02a: El tiempo de alta de un partido debe ser menor a 2 s (p95).
- RNF-02b: El tiempo de finalización de un partido debe ser menor a 2 s (p95).
- RNF-03: El tiempo de edición de un jugador/a debe ser menor a 2 s (p95).
- RNF-04: El tiempo de creación de un jugador/a debe ser menor a 2 s (p95).
- RNF-05: El tiempo hasta que se ven las primeras 10 organizaciones del listado de organizaciones debe ser menor a 2 s (p95).
- RNF-06: El tiempo hasta que se ven los 10 partidos más recientes del listado de partidos de una organización debe ser menor a 2 s (p95).
- RNF-07: El tiempo de carga del listado de jugadores/as de una organización debe ser menor a 2 s (p95).

## Criterios de Aceptación
- AC-01 (RF-11): Dado un jugador/a con 7 partidos que está en un partido pendiente, cuando el administrador/a finaliza el partido, entonces el jugador/a debe quedar con 8 partidos.
- AC-02 (RF-09): Dado un jugador/a con 4 goles que convierte 2 goles en un partido, cuando el administrador/a finaliza el partido, entonces el jugador/a debe quedar con 6 goles.
- AC-03a (RF-10): Dado un jugador/a con 0 victorias, 0 empates y 0 derrotas cuyo equipo gana 5 a 3, cuando el administrador/a finaliza el partido, entonces debe quedar con 1 victoria, 0 empates y 0 derrotas.
- AC-03b (RF-10): Dado un jugador/a con 0 victorias, 0 empates y 0 derrotas cuyo equipo empata 3 a 3, cuando el administrador/a finaliza el partido, entonces debe quedar con 0 victorias, 1 empate y 0 derrotas.
- AC-03c (RF-10): Dado un jugador/a con 0 victorias, 0 empates y 0 derrotas cuyo equipo pierde 3 a 5, cuando el administrador/a finaliza el partido, entonces debe quedar con 0 victorias, 0 empates y 1 derrota.
- AC-04 (RF-05): Dado un administrador/a, cuando crea un jugador/a con nombre "Juan Pérez", apodo "Juancho" y fecha de nacimiento 10/05/1990, entonces el jugador/a debe quedar guardado con esos tres valores y con 0 partidos, 0 goles, 0 victorias, 0 empates y 0 derrotas.
- AC-05a (RF-06c, RNF-01): Dado un usuario registrado que no es administrador/a de una organización, cuando intenta crear o editar un jugador/a de esa organización enviando la operación directamente a la base de datos, entonces el sistema debe rechazarla.
- AC-05b (RF-06d, RNF-01): Dado un usuario registrado que no es administrador/a de una organización, cuando intenta crear o editar un partido de esa organización enviando la operación directamente a la base de datos, entonces el sistema debe rechazarla.
- AC-06 (RF-04d, RNF-01): Dado un usuario en modo invitado, cuando lee los jugadores/as de una organización, incluso directamente desde la base de datos, entonces solo debe recibir sus apodos y nunca su nombre completo ni su fecha de nacimiento.
- AC-07 (RF-14): Dados dos jugadores/as de una organización con 5 y 3 goles, cuando se ordena el listado de jugadores/as de esa organización por cantidad de goles, entonces el jugador/a con 5 goles debe aparecer primero.
- AC-08 (RF-04c): Dado un usuario miembro de una organización, sea administrador/a o no, cuando ve los jugadores/as de esa organización, entonces debe ver su nombre completo y su fecha de nacimiento.
- AC-09 (RF-01): Dado un usuario sin cuenta, cuando inicia sesión con su cuenta de Google por primera vez, entonces debe quedar registrado y con la sesión iniciada.
- AC-10 (RF-02): Dado un usuario registrado, cuando crea una organización, entonces la organización debe quedar creada y ese usuario debe ser su administrador/a.
- AC-11 (RF-03): Dada una organización creada con nombre y descripción, cuando se la consulta, entonces debe mostrar ese nombre, esa descripción, sus jugadores/as y sus partidos.
- AC-12 (RF-07c): Dada una cuenta ya asociada a un jugador/a de una organización, cuando el administrador/a intenta asociarla a otro jugador/a de la misma organización, entonces el sistema debe rechazarlo.
- AC-13 (RF-07d): Dado un jugador/a ya asociado a una cuenta, cuando el administrador/a intenta asociarle otra cuenta, entonces el sistema debe rechazarlo.
- AC-14 (RF-08a): Dado un administrador/a, cuando da de alta un partido con día, lugar y jugadores por equipo, entonces el partido debe quedar creado sin finalizar.
- AC-15 (RF-08c): Dado un partido con un gol en contra, cuando el administrador/a lo finaliza, entonces el gol debe sumar al marcador del equipo rival y no debe acreditarse a ningún jugador/a.
- AC-16 (RF-12): Dado un partido finalizado de una organización, cuando se consulta la lista de partidos de esa organización, entonces ese partido debe aparecer en la lista indicado como finalizado.
- AC-17 (RF-13): Dado un jugador/a que forma parte de una organización, cuando se consulta el listado de jugadores/as de esa organización, entonces debe aparecer en él.
- AC-18 (RF-15): Dado un administrador/a, cuando edita el nombre, el apodo o la fecha de nacimiento de un jugador/a, entonces deben guardarse los valores nuevos.
- AC-19 (RF-16): Dado un usuario en modo invitado, cuando consulta el listado de organizaciones, entonces debe ver todas las organizaciones.
- AC-20 (RF-17): Dado un administrador/a, cuando intenta eliminar su organización, entonces no debe existir la opción y el servidor debe rechazar la operación.
- AC-21 (RF-18): Dado un usuario en la pantalla de ingreso, cuando ve las opciones para ingresar, entonces las únicas opciones deben ser iniciar sesión con Google o ingresar en modo invitado.
- AC-22a (RF-19a): Dado un administrador/a, cuando carga un nombre de jugador/a de 40 caracteres, entonces el sistema debe aceptarlo.
- AC-22b (RF-19a): Dado un administrador/a, cuando carga un nombre de jugador/a de 41 caracteres, entonces el sistema debe rechazarlo.
- AC-23a (RF-20a): Dado un partido con un jugador/a externo/a, cuando se ven los equipos del partido, entonces ese jugador/a debe aparecer como "externo/a".
- AC-23b (RF-20b): Dado un partido con un jugador/a externo/a que convierte 2 goles, cuando el administrador/a finaliza el partido, entonces esos 2 goles deben sumar al marcador de su equipo y el jugador/a externo/a no debe registrar partidos, goles, victorias, empates ni derrotas.
- AC-24 (RF-04d, RNF-01): Dado un usuario registrado que no es miembro de una organización, cuando lee los jugadores/as de esa organización, incluso directamente desde la base de datos, entonces solo debe recibir sus apodos y nunca su nombre completo ni su fecha de nacimiento.
- AC-25 (RF-21): Dada una cuenta asociada al jugador/a "Pepe" en la organización A, cuando el administrador/a de la organización B la asocia al jugador/a "José", entonces el sistema debe permitirlo y cada organización debe mostrar a su propio jugador/a con sus propios datos.
- AC-26 (RF-06a, RNF-01): Dada una solicitud de creación de una organización sin ningún administrador/a, enviada directamente a la base de datos, cuando el sistema la procesa, entonces debe rechazarla.
- AC-27 (RF-07a): Dado un administrador/a de una organización, cuando crea un jugador/a con nombre, apodo y fecha de nacimiento, entonces ese jugador/a debe aparecer en el listado de jugadores/as de esa organización.
- AC-28 (RF-07b): Dada una cuenta registrada que no está asociada a ningún jugador/a de una organización y un jugador/a de esa organización sin cuenta asociada, cuando el administrador/a de esa organización asocia la cuenta a ese jugador/a, entonces la cuenta debe quedar asociada a ese jugador/a.
- AC-29 (RF-14): Dados dos jugadores/as de una organización con 5 y 3 partidos, cuando se ordena el listado de jugadores/as de esa organización por cantidad de partidos, entonces el jugador/a con 5 partidos debe aparecer primero.
- AC-30 (RF-14): Dados dos jugadores/as de una organización con 5 y 3 victorias, cuando se ordena el listado de jugadores/as de esa organización por cantidad de victorias, entonces el jugador/a con 5 victorias debe aparecer primero.
- AC-31 (RF-14): Dados dos jugadores/as de una organización con 5 y 3 empates, cuando se ordena el listado de jugadores/as de esa organización por cantidad de empates, entonces el jugador/a con 5 empates debe aparecer primero.
- AC-32 (RF-14): Dados dos jugadores/as de una organización con 5 y 3 derrotas, cuando se ordena el listado de jugadores/as de esa organización por cantidad de derrotas, entonces el jugador/a con 5 derrotas debe aparecer primero.
- AC-33 (RF-16): Dadas tres organizaciones "Beta" con 8 partidos finalizados, "Alfa" con 3 y "Gamma" con 3 (y 10 partidos pendientes), cuando se consulta el listado de organizaciones, entonces el orden debe ser "Beta", "Alfa", "Gamma".
- AC-34 (RF-06e): Dado un administrador/a de una organización, cuando edita el nombre y la descripción de esa organización, entonces deben guardarse los valores nuevos.
- AC-35 (RF-06f, RNF-01): Dado un usuario registrado que no es administrador/a de una organización, cuando intenta editar su nombre o su descripción enviando la operación directamente a la base de datos, entonces el sistema debe rechazarla.
- AC-36 (RF-07e): Dada una organización con 39 jugadores/as, cuando el administrador/a crea un jugador/a, entonces el sistema debe aceptarlo y la organización debe quedar con 40 jugadores/as.
- AC-37 (RF-07e): Dada una organización con 40 jugadores/as, cuando el administrador/a intenta crear otro jugador/a, entonces el sistema debe rechazarlo.
- AC-38 (RNF-02a): Dadas las condiciones de medición de los RNF y una organización con 40 jugadores/as, cuando se miden 100 altas de partidos, entonces el p95 debe ser menor a 2 s.
- AC-39 (RNF-02b): Dadas las condiciones de medición de los RNF y 100 partidos pendientes de 6 vs 6, cuando se mide la finalización de cada uno, entonces el p95 debe ser menor a 2 s.
- AC-40 (RNF-03): Dadas las condiciones de medición de los RNF y una organización con 40 jugadores/as, cuando se miden 100 ediciones de jugadores/as, entonces el p95 debe ser menor a 2 s.
- AC-41 (RNF-04): Dadas las condiciones de medición de los RNF y organizaciones con menos de 40 jugadores/as, cuando se miden 100 creaciones de jugadores/as, entonces el p95 debe ser menor a 2 s.
- AC-42 (RNF-05): Dadas las condiciones de medición de los RNF y 200 organizaciones, cuando se mide 100 veces la carga del listado de organizaciones, entonces el p95 del tiempo hasta que se ven las primeras 10 debe ser menor a 2 s.
- AC-43 (RNF-06): Dadas las condiciones de medición de los RNF y una organización con 200 partidos, cuando se mide 100 veces la carga de su listado de partidos, entonces el p95 del tiempo hasta que se ven los 10 más recientes debe ser menor a 2 s.
- AC-44 (RNF-07): Dadas las condiciones de medición de los RNF y una organización con 40 jugadores/as, cuando se mide 100 veces la carga de su listado de jugadores/as, entonces el p95 debe ser menor a 2 s.
- AC-45 (RF-19b): Dado un administrador/a, cuando carga un apodo de jugador/a de 40 caracteres, entonces el sistema debe aceptarlo.
- AC-46 (RF-19b): Dado un administrador/a, cuando carga un apodo de jugador/a de 41 caracteres, entonces el sistema debe rechazarlo.
- AC-47 (RF-19c): Dado un administrador/a, cuando carga como fecha de nacimiento de un jugador/a el 1 de enero de 1920, entonces el sistema debe aceptarla.
- AC-48 (RF-19c): Dado un administrador/a, cuando carga como fecha de nacimiento de un jugador/a el 31 de diciembre de 1919, entonces el sistema debe rechazarla.
- AC-49 (RF-04b, RNF-01): Dado un usuario en modo invitado, cuando intenta crear una organización enviando la operación directamente a la base de datos, entonces el sistema debe rechazarla.
- AC-50 (RF-06b): Dado un partido pendiente, cuando el administrador/a de su organización cambia su lugar, entonces debe guardarse el lugar nuevo.
- AC-51 (RF-06g, RNF-01): Dado un partido finalizado, cuando el administrador/a de su organización intenta editarlo, incluso enviando la operación directamente a la base de datos, entonces el sistema debe rechazarlo.
- AC-52 (RF-04a): Dado un usuario sin sesión iniciada, cuando elige ingresar en modo invitado, entonces debe ver el listado de organizaciones sin haber iniciado sesión.
- AC-53 (RF-08b): Dado un partido pendiente, cuando el administrador/a lo finaliza cargando 2 goles para un jugador/a del equipo A y 1 gol para un jugador/a del equipo B, entonces el partido debe quedar finalizado con el marcador 2 a 1.
- AC-54 (RF-08d): Dado un administrador/a, cuando intenta dar de alta un partido con un equipo sin jugadores/as, entonces el sistema debe rechazarlo.
- AC-55 (RF-08e): Dado un administrador/a que da de alta un partido, cuando agrega a un equipo un jugador/a externo/a con el apodo "Tano", entonces el partido debe quedar con ese jugador/a externo/a en ese equipo.

## Fuera de Alcance
- Interpretar un mensaje de WhatsApp (V 2.0)
- Anotar el partido en vivo (V 2.0)
- Votar al mejor (V 2.0)
- El Elo (V 2.0)
- La ficha para redes (V 2.0)
- Anotador en reloj inteligente (V 2.0)
- Invitaciones por link (V 2.0)
- Reservas de cancha
- Cobros de canchas
- Notificaciones
- App nativa
- Otro deporte diferente a fútbol
- Tinder de deporte. No se espera bajo ningún aspecto matchear jugadores/as con equipos u organizaciones.
- Notas de jugadores/as. No va a haber calificaciones por otros jugadores hacia un jugador (el sistema de Elo va a ser dependiente de tus victorias/derrotas/empates).
- Registrar quién arma los equipos o asignar quién arma el siguiente partido según si el partido fue parejo.
- Agregar, quitar o transferir administradores/as. En el MVP cada organización tiene un único administrador/a: quien la creó.
- Eliminar jugadores/as o partidos.

## Riesgos y Dependencias
- Riesgo: Un/a jugador/a no está de acuerdo con la contabilización de sus goles en el partido → mitigación: visibilización clara de parte del administrador/a al momento de cargar el resultado una vez finalizado el partido.
- Riesgo: Poca practicidad al momento de realizar el conteo de goles durante el partido → mitigación: implementar un método por organización para facilitar la anotación, como puede ser una hoja con los nombres y un lápiz o agregar un anotador en un reloj inteligente (V 2.0)
- Riesgo: Poco interés de los jugadores al visualizar sus datos y perder el uso de la misma → mitigación: proponer objetivos e incentivos para que esto no ocurra.
- Riesgo: El administrador/a deja de participar y la organización queda sin quien cargue partidos → mitigación: se acepta en el MVP; la gestión de administradores/as se evalúa para una versión posterior.
- Dependencia: Firebase Auth (login con Google), Firestore (base de datos), Vercel (hosting).
