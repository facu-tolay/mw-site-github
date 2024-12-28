---
title: "Fundamentos de Docker"
index: 21
page_header_bg: "images/categories/cloud.jpg.webp"
description: "Docker: ¿qué es y cómo funciona? Este curso en formato de taller
presenta los principales conceptos de Docker, las prácticas recomendadas para
trabajar con esta tecnología, y los conocimientos necesarios para generar
entornos de desarrollo y testing usando este proyecto de código abierto."
images: 
  - "images/categories/cloud.png.webp"
details:
  - title: "¿A quién está destinado?"
    description: "
* A personas de IT que usen o tengan interés en usar Docker.

* A equipos de trabajo que busquen estandarizar sus entornos de desarrollo,
  testing y/o producción con una herramienta versátil y potente."
  - title: "¿Qué se llevarán?"
    description: "
* Herramientas necesarias para el uso correcto de Docker en entornos de
  desarrollo y testing.

* Conocimientos para ejecutar conocimientos de producción.

* Herramientas para diagnosticar problemas.

* Buenas prácticas y herramientas para trabajar, sacándole el máximo provecho a
  la tecnología."
  - title: "Formato y duración"
    description: "El curso cuenta con una parte teórica, en la que se introducen
los conceptos, y una parte aplicada, donde los alumnos deben resolver diferentes
problemas de forma práctica.


La carga horaria total estimada es de 16 horas, distribuidas de la siguiente
manera:

* 8 horas para las clases teóricas.

* 4 horas para la resolución de los ejercicios prácticos.

* Entre 2 y 4 horas para debatir sobre las problemáticas planteadas a través de
  los ejercicios prácticos."
  - title: "Requerimientos"
    description: "Sin ser excluyentes, recomendamos:

* Conocimiento básico del uso de una consola de comandos.

* Haber tomado el curso [Workflow continuo de desarrollo a
producción](/es/training/wfc)."
testimony:
  - text: "Excelente la calidad del contenido y el material entregado."
    author: "Daniel V."
    position: "Desarrollador de software"
---

## Temario

### Contenido Teórico

* Introducción y antecedentes. 
  * ¿Qué es y por qué usarlo? Comparativa con máquinas virtuales. 
  * Características generales. 
  * Conceptos básicos: imágenes, contenedores, sistemas de archivos. 
* El cliente Docker: uso de la consola para entender como interactuar con los
  contenedores e imágenes. 
* Construyendo imágenes. Análisis de las secciones más relevantes de Dockerfile.
  Trabajo con multistage builds.
* Registries de imágenes. Uso de Docker Hub y otros servicios online. Registries
  privadas.
* Volúmenes en Docker. Bind mounts o volúmenes. Volúmenes nombrados y anónimos.
  Uso de sintaxis legada y actual.
* Redes en los contenedores. Tipos de drivers. 
* Importancia del uso de redes bridge definidas por el usuario y la que es por
  defecto.
* Límite de recursos en los contenedores: memoria, cpu, pids, entrada / salida.
* El servicio Docker: dockerd. Conexiones remotas, registries inseguras, uso de
  proxies.
* Conceptos de Docker compose. ¿Qué es y para qué sirve? Explicaciones acerca de
  la estructura. Ejemplos.
* Clusters de contenedores. ¿Qué son y para qué sirven? Características y
  consideraciones de los clusters de contenedores.

### Contenido Práctico

* Actividad 1: instalación de Docker. Uso de docker client. 
* Actividad 2: construcción de imágenes. 
* Actividad 3: registries y volúmenes.
* Actividad 4: redes y límites de recursos. 
* Actividad 5: docker compose.
