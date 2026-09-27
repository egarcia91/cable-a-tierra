# PRD-001: Cable a Tierra — anotador de partidos de amigos (MVP solo futbol)

## Contexto y Problema
Hoy en día hay muchos partidos amateur entre amigos y amigas, todos los días, en todos lados, cada Argentino y Argentina trata de lograr hacer su descarga a tierra ejercitando su pasión por algún deporte.
El dolor que hay es en la era de la tecnología que vivimos no tener nada anotado, no poder mostrar en redes sociales sus propios goles, sus puntos, sus victorias, sus trofeos, sus estadísticas.
Las personas a quines se les dirige este proyecto es a todas aquellas que quieren contabilizar su pasión de otra manera y reconocer su esfuerzo, a todos los jugadores y jugadoras del deporte amateur que practiquen.
Hoy en dia nadie anota, los partidos de futbol suelen ser de 12 personas, 6 versus 6, suele haber un listado en el grupo de Whatsapp pero tiene solo el fin de saber quien va a jugar, no hay forma de conocer cuantos partidos participo cada uno, cuantos goles hizo etc. Suele haber un jugador que decide de que equipo es cada uno, cuando el partido es parejo (no termina con diferencia superior a dos goles) se le otorga la confianza a ese jugador de que arme el siguiente partido.

## Objetivos
Que un jugador/a amateur logre sentirse con un incentivo extra al ver como a lo largo del tiempo suma más participaciones y acumula más estadística e incluso por qué no, ver como va mejorando.

## Requerimientos Funcionales
- RF-01: El sistema debe solicitar registrarse a través de Google.
- RF-02: El sistema debe permitir a cualquier jugador/a registrado crear una organizacion (ese jugador/a es administrador/a).
- RF-03: El sistema debe almacenar los datos de las organizaciones dónde se concentre la información (dicha organización esta formada por un nombre, una descripcion, grupo de jugadores/as y partidos).
- RF-04: El sistema debe permitir ingresar con modo invitado solo para ver información sobre organizaciones.
- RF-05: El sistema debe almacenar los datos de los jugadores/ras (nombre, apodo, fecha de nacimiento, cantidad de goles; victorias; derrotas; empates;).
- RF-06: La organizacion debe tener al menos un administrador/a para editar o crear jugadores/as, y asi tambien crear y edtiar partidos.
- RF-07: El administrador de la organizacion debe crear o asociar jugadores/ras a una organización.
- RF-08: El administrador de la organizacion debe crear un nuevo partido.
- RF-09: El sistema debe al finalizar un partido sumar los goles a cada jugador/a.
- RF-10: El sistema debe al finalizar un partido sumar una victoria/empate/derrota a cada jugador/a.
- RF-11: El sistema debe al finalizar un partido sumar un partido más a cada jugador/a.
- RF-12: El sistema debe mostrar una lista de partidos ya ocurridos.
- RF-13: El sistema debe mostrar una lista de todos los jugadores/as que son parte de la organización.
- RF-14: El sistema debe permitir mostrar un listado general ordenado por diferentes filtros como "más goleador/a", "más partidos jugador/a".
- RF-15: El administrador de la organizacion debe poder editar la información de los jugadores/as de su nombre, apodo y fecha de nacimiento.
- RF-16: El administrador de la organizacion debe poder editar un partido ya ocurrido.
- RF-17: El sistema debe poder mostrar un listado de organizaciones.

## Requerimientos No Funcionales
- RNF-01: No debe poder elminar una organización.
- RNF-02: Alguien no administrador no debe poder editar organizaciones.
- RNF-03: Alguien no administrador no debe poder editar jugadores/as.
- RNF-04: Alguien no administrador no debe poder editar partidos.
- RNF-05: Ningún jugador/a va a ser registrado con contraseña.
- RNF-06: Limite de jugadores/as por organizacion 40.
- RNF-07: Tiempo maximo de carga de un partido no debe superar los 10 segundos.
- RNF-08: Tiempo maximo de edicion de un jugador/a no debe superar los 10 segundos.
- RNF-09: Tiempo maximo de creacion de un jugador/a no debe superar los 10 segundos.
- RNF-10: Tiempo maximo de carga de listado de organizaciones no debe superar los 10 segundos.
- RNF-11: Tiempo maximo de carga de listado de los ultimos 10 partidos dentro de una organizacion no debe superar los 10 segundos.
- RNF-12: Tiempo maximo de carga de listado de los jugadores/as de una organizacion no debe superar los 10 segundos.
- RNF-13: Nombres de los jugadores/as no deben superar los 40 caracteres.
- RNF-14: Apodos de los jugadores/as no deben superar los 40 caracteres.
- RNF-15: Fecha de nacimiento de los jugadores/as no deben ser anteriores al año 1920.
- RNF-16: Cuando un partido tenga un jugador no asociado a la organización se debe mostrar al mismo como invitado y no debe sumar participaciones ni goles.

## Criterios de Aceptación
- AC-01 (RF-11): Dado un partido que contiene a un jugador/a, cuando el partido se toma como finalizado, entonces el jugador/a debe incrementar uno en cantidad de partidos.
- AC-03 (RF-09): Dado un partido que contiene a un jugador/a con goles, cuando el partido se toma como finalizado, entonces el jugador/a debe incrementar la cantidad de goles que haya convertido.
- AC-04 (RF-10): Dado un partido que contiene a un jugador/a con una victoria/derrota/empate, cuando el partido se toma como finalizado, entonces el jugador/a debe incrementar uno en cantidad de victorias/derrotas/empates.
- AC-05 (RF-09, RF-10,RF-11): Dado un partido finalizado que contiene a un jugador/a con un error y es señalado como invitado, cuando el partido es editado, entonces efecto del partido original debe ser revertido y se debe volver a cargar como un nuevo ingreso de partido.
- AC-06 (RF-02): Dado un jugador/a, cuando es creado, entonces el jugador/a debe contener los valores ingresados.
- AC-07 (RF-06): Dado un jugador/a, cuando no es administrador/a, entonces no debe poder editar otros jugadores/as o partidos.

## Fuera de Alcance
- Interpretar un mensaje de WhatsApp (V 2.0)
- Aanotar el partido en vivo (V 2.0)
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
- Riesgo: Poca practicidad al momento de realizar el conteo de goles durante el partido → mitigación: implementar un método por organización para facilitar la anotación, como puede ser una hoja con los nombres y un lapíz o agregar un anotador en un reloj inteligente (V 2.0)
- Riesgo: Poco interés de los jugadores al visualizar sus datos y perder el uso de la misma → mitigación: proponer objetivos e incentivos para que esto no ocurra.
- Dependencia: Google-Authentication, WebHosting (a definir), Base de Datos (a definir).
