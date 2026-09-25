# PRD-001: Cable a Tierra — anotador de partidos de amigos

## Contexto y Problema
Hoy en día hay muchos partidos amateur entre amigos y amigas, todos los días, en todos lados, cada Argentino y Argentina trata de lograr hacer su descarga a tierra ejercitando su pasión por algún deporte.
El dolor que hay es en la era de la tecnología que vivimos no tener nada anotado, no poder mostrar en redes sociales sus propios goles, sus puntos, sus victorias, sus trofeos, sus estadísticas.
Las personas a quines se les dirige este proyecto es a todas aquellas que quieren contabilizar su pasión de otra manera y reconocer su esfuerzo, a todos los jugadores y jugadoras del deporte amateur que practiquen.

## Objetivos
Que un jugador o jugadora amateur logre sentirse con un incentivo extra al ver como a lo largo del tiempo suma más participaciones y acumula más estadística e incluso por qué no, ver como va mejorando.

## Requerimientos Funcionales
- RF-01: El sistema debe almacenar los datos de los jugadores y jugadoras (nombre, apodo, fecha de nacimiento, Elo, cantidad de puntos/goles; victorias; derrotas; empates; mejor jugador/a).
- RF-02: Debe crear una organización dónde se concentre la información (dicha organización esta formada por un grupo de personas).
- RF-03: Debe asociar jugadores o jugadoras a una organización.
- RF-04: Debe crear un nuevo partido (en base a un mensaje copiado y pegado de whatsapp).
- RF-05: Debe interpretar que el mensaje copiado y pegado de whatsapp es la organización de un partido con X cantidad de jugadores o jugadoras por equipo por su apodo.
- RF-06: Debe poder ejecutar un partido en vivo, para anotar los goles/puntos en tiempo real.
- RF-07: Debe una vez finalizado el partido permitir votar al mejor jugador/a del partido.
- RF-08: Debe una vez finalizado el partido anunciar cuantos puntos de Elo debe sumar cada jugador en base al desempeño colectivo del equipo en que jugó (reglamento sobre puntuación más adelante). 
- RF-09: Debe sumar los goles y/o puntos a cada jugador/a.
- RF-10: Debe sumar una victoria/empate/derrota a cada jugador/a.
- RF-11: Debe sumar un partido más a cada jugador/a.
- RF-12: Debe mostrar una lista de partidos ya ocurridos.
- RF-13: Debe mostrar una lista de todos los jugadores/as que son parte de la organización.
- RF-14: Debe permitir comparar a dos jugadores/as por sus estadísticas.
- RF-15: Debe permitir mostrar un listado general ordenado por diferentes filtros como "mejor jugador/a", "más goleador/a", "más partidos jugador".
- RF-16: Debe permitir editar la información de los jugadores/as solo en su nombre.
- RF-17: Debe permitir editar un partido ya ocurrido.
- RF-18: Debe anunciar una vez creado un partido el promedio de Elo por equipo.
- RF-19: Debe permitir invitar a través de un link a un nuevo jugador a ingresar a ver la organización.
- RF-20: Debe crear una ficha para compartir en redes sociales con el resultado del partido y el nombre de la App.
- RF-21: Debe poder mostrar un listado de organizaciones.
- RF-22: Debe solicitar registrarse a través de Google.
- RF-23: Debe permitir ingresar con modo invitado solo para ver información.

## Requerimientos No Funcionales
- RNF-01: No debe poder elminar una organización.
- RNF-02: Alguien no autorizado no debe poder editar organizaciones.
- RNF-03: Alguien no autorizado no debe poder editar jugadores/as.
- RNF-04: Alguien no autorizado no debe poder editar partidos.
- RNF-05: Ningún jugador/a va a ser registrado con contraseña.
- RNF-06: No se debe eliminar la base de datos.
- RNF-07: No se debe compartir la API_KEY de ningún servicio.


## Criterios de Aceptación
- AC-01 (RF-11): Dado un partido que contiene a un jugador/a, cuando el partido se toma como finalizado, entonces el jugador/a debe incrementar uno en cantidad de partidos.
- AC-02 (RF-01): Dado un partido que contiene a un jugador/a como mejor del partido, cuando el partido se toma como finalizado, entonces el jugador/a debe incrementar uno en cantidad de mejor jugador.
- AC-03 (RF-09): Dado un partido que contiene a un jugador/a con goles/puntos, cuando el partido se toma como finalizado, entonces el jugador/a debe incrementar uno en cantidad de goles/puntos.
- AC-04 (RF-10): Dado un partido que contiene a un jugador/a con una victoria/derrota/empate, cuando el partido se toma como finalizado, entonces el jugador/a debe incrementar uno en cantidad de victorias/derrotas/empates.
- AC-05 (RF-09, RF-10,RF-11,RF-08,RF-07): Dado un partido finalizado que contiene a un jugador/a con un error, cuando el partido es editado, entonces efecto del partido original debe ser revertido y se debe volver a cargar como un nuevo ingreso de partido.
- AC-06 (RF-01): Dado un jugador/a, cuando es creado, entonces el jugador/a contener los valores ingresados.

## Fuera de Alcance
- Tinder de deporte. No se espera bajo ningún aspecto matchear jugadores/as con equipos u organizaciones.
- Notas de jugadores/as. No va a haber calificaciones por otros jugadores hacia un jugador (el sistema de Elo va a ser dependiente de tus victorias/derrotas/empates).
- Incentivar la competencia desleal entre jugadores/as dentro de las reglas del deporte.

## Riesgos y Dependencias
- Riesgo: Un jugador no está de acuerdo con su Elo otorgado → mitigación: visibilización clara del balance otorgado de los puntajes.
- Dependencia: Google-Authentication, WebHosting (a definir), Base de Datos (a definir).