# PRD-001: Cable a Tierra — anotador de partidos de amigos (MVP solo fútbol)

## Contexto y Problema
Hoy en día hay muchos partidos amateur entre amigos y amigas, todos los días, en todos lados, cada Argentino y Argentina trata de lograr hacer su descarga a tierra ejercitando su pasión por algún deporte.
El dolor que hay es en la era de la tecnología que vivimos no tener nada anotado, no poder mostrar en redes sociales sus propios goles, sus puntos, sus victorias, sus trofeos, sus estadísticas.
Las personas a quienes se les dirige este proyecto es a todas aquellas que quieren contabilizar su pasión de otra manera y reconocer su esfuerzo, a todos los jugadores y jugadoras del deporte amateur que practiquen.
Hoy en día nadie anota, los partidos de fútbol suelen ser de 12 personas, 6 versus 6, suele haber un listado en el grupo de Whatsapp pero tiene solo el fin de saber quién va a jugar, no hay forma de conocer cuántos partidos participó cada uno, cuántos goles hizo etc. Suele haber un jugador que decide de qué equipo es cada uno, cuando el partido es parejo (no termina con diferencia superior a dos goles) se le otorga la confianza a ese jugador de que arme el siguiente partido.

## Objetivos
Que el 80% de los partidos de una organización de amigos queden cargados y que un jugador/a amateur logre sentirse con un incentivo extra al ver cómo a lo largo del tiempo suma más participaciones y acumula más estadística e incluso por qué no, ver cómo va mejorando.

## Requerimientos Funcionales
- RF-01: El sistema debe solicitar registrarse a través de Google.
- RF-02: El sistema debe permitir a cualquier jugador/a registrado crear una organización (ese jugador/a es administrador/a).
- RF-03: El sistema debe almacenar los datos de las organizaciones donde se concentre la información (dicha organización está formada por un nombre, una descripción, grupo de jugadores/as y partidos).
- RF-04: El sistema debe permitir ingresar con modo invitado solo para ver información sobre organizaciones, solo puede visualizar los apodos de los jugadores y no la información detallada de ellos.
- RF-05: El sistema debe almacenar los datos de los jugadores/ras (nombre, apodo, fecha de nacimiento, cantidad de goles; victorias; derrotas; empates;).
- RF-06: La organización debe tener al menos un administrador/a para editar o crear jugadores/as, y así también crear y editar partidos.
- RF-07: El administrador de la organización debe crear o asociar jugadores/ras a una organización, luego las personas registradas con Google pueden asociarse a un/a jugador/a dentro del listado de la organización, solo un/a jugador/a por organización.
- RF-08: El administrador de la organización debe crear un nuevo partido, primero se realiza una carga del día que ocurre, el lugar y los jugadores por equipo, ahí se da de alta. Luego una vez finalizado el partido se cierra el mismo detallando los goles por jugador (en caso de gol en contra va gol para el equipo) y se da por concluido el partido.
- RF-09: El sistema debe al finalizar un partido sumar los goles a cada jugador/a.
- RF-10: El sistema debe al finalizar un partido sumar una victoria/empate/derrota a cada jugador/a.
- RF-11: El sistema debe al finalizar un partido sumar un partido más a cada jugador/a.
- RF-12: El sistema debe mostrar una lista de partidos ya ocurridos.
- RF-13: El sistema debe mostrar una lista de todos los jugadores/as que son parte de la organización.
- RF-14: El sistema debe permitir mostrar un listado general ordenado por diferentes filtros como "más goleador/a", "más partidos jugador/a".
- RF-15: El administrador de la organización debe poder editar la información de los jugadores/as de su nombre, apodo y fecha de nacimiento.
- RF-16: El sistema debe poder mostrar un listado de organizaciones.
- RF-17: No debe poder eliminar una organización.
- RF-18: Ningún jugador/a va a ser registrado con contraseña.
- RF-19: Nombres de los jugadores/as no deben superar los 40 caracteres.
- RF-20: Cuando un partido tenga un jugador no asociado a la organización se debe mostrar al mismo como invitado y no debe sumar participaciones ni goles.

## Requerimientos No Funcionales
- RNF-01: Alguien no administrador no debe poder editar organizaciones.
- RNF-02: Alguien no administrador no debe poder editar jugadores/as.
- RNF-03: Alguien no administrador no debe poder editar partidos.
- RNF-04: Límite de jugadores/as por organización 40.
- RNF-05: Tiempo máximo de carga de un partido no debe superar los 2 segundos.
- RNF-06: Tiempo máximo de edición de un jugador/a no debe superar los 2 segundos.
- RNF-07: Tiempo máximo de creación de un jugador/a no debe superar los 2 segundos.
- RNF-08: Tiempo máximo de carga de listado de organizaciones no debe superar los 2 segundos.
- RNF-09: Tiempo máximo de carga de listado de los últimos 10 partidos dentro de una organización no debe superar los 2 segundos.
- RNF-10: Tiempo máximo de carga de listado de los jugadores/as de una organización no debe superar los 2 segundos.
- RNF-11: Apodos de los jugadores/as no deben superar los 40 caracteres.
- RNF-12: Fecha de nacimiento de los jugadores/as no deben ser anteriores al año 1920.

## Criterios de Aceptación
- AC-01 (RF-11): Dado un partido que contiene a un jugador/a, cuando el partido se toma como finalizado, entonces el jugador/a debe incrementar uno en cantidad de partidos.
- AC-02 (RF-09): Dado un partido que contiene a un jugador/a con goles, cuando el partido se toma como finalizado, entonces el jugador/a debe incrementar la cantidad de goles que haya convertido.
- AC-03 (RF-10): Dado un partido que contiene a un jugador/a con una victoria/derrota/empate, cuando el partido se toma como finalizado, entonces el jugador/a debe incrementar uno en cantidad de victorias/derrotas/empates.
- AC-04 (RF-07): Dado un jugador/a, cuando es creado, entonces el jugador/a debe contener los valores ingresados.
- AC-05 (RF-06): Dado un jugador/a, cuando no es administrador/a, entonces no debe poder editar otros jugadores/as o partidos.
- AC-06 (RF-04): Dado un jugador/a, cuando no es administrador/a, entonces no debe poder visualizar información como nombre completo ni fecha de nacimiento de los jugadores de una organizaciones.
- AC-07 (RF-14): Dado un jugador/a, cuando tiene cierta cantidad de goles, entonces debe poder ser visualizado en el listado de jugadores ordenados por "más goleador/a".

## Fuera de Alcance
- Interpretar un mensaje de WhatsApp (V 2.0)
- Anotar el partido en vivo (V 2.0)
- Votar al mejor (V 2.0)
- El Elo (V 2.0)
- Comparar jugadores (V 2.0)
- La ficha para redes (V 2.0)
- Invitaciones por link (V 2.0)
- Reservas de cancha
- Cobros de canchas
- Notificaciones
- App nativa
- Otro deporte diferente a fútbol
- Tinder de deporte. No se espera bajo ningún aspecto matchear jugadores/as con equipos u organizaciones.
- Notas de jugadores/as. No va a haber calificaciones por otros jugadores hacia un jugador (el sistema de Elo va a ser dependiente de tus victorias/derrotas/empates).

## Riesgos y Dependencias
- Riesgo: Un/a jugador/a no está de acuerdo con la contabilización de sus goles en el partido → mitigación: visibilización clara de parte del administrador/a al momento de cargar el resultado una vez finalizado el partido.
- Riesgo: Poca practicidad al momento de realizar el conteo de goles durante el partido → mitigación: implementar un método por organización para facilitar la anotación, como puede ser una hoja con los nombres y un lápiz o agregar un anotador en un reloj inteligente (V 2.0)
- Riesgo: Poco interés de los jugadores al visualizar sus datos y perder el uso de la misma → mitigación: proponer objetivos e incentivos para que esto no ocurra.
- Dependencia: Firebase Auth (login con Google), Firestore (base de datos), Vercel (hosting).
