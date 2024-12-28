---
title: "Limitando la memoria de aplicaciones java en ambientes containerizados"
date: 2023-05-10T10:00:00-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/java-cgroups.webp"
# post author
author: "Matias Gudin"
# taxonomies
categories: ["Mikroways"]
tags: ["java", "cgroups","docker","openjdk","limits"]
# meta description
description: "Análisis del comportamiento de la JVM en ambientes containerizados"
draft: false
---

En este post analizaremos el comportamiento de [OpenJDK](https://openjdk.org/)
en ambientes containerizados, haciendo foco en la utilización de memoria y
presentaremos un *conocido* problema de la versión 1.8. Para ello, utilizaremos
un conjunto de pruebas para ilustrarlo y concluiremos mostrando algunas
recomendaciones para mitigarlo.

Antes de comenzar, repasaremos conceptos que serán de utilidad a lo largo
del análisis.

# Java

Java es un lenguaje orientado a objetos, compilado y **`multiplataforma`**.
Hacemos énfasis en que es **`multiplataforma`** porque justamente se compila para
luego ser interpretado por una maquina virtual de java (**`JVM`**) quien
terminará ejecutando los binarios. Es esta abstracción la que permite que sea
**`multiplataforma`** ya que basta con tener instalada dicha maquina para que
podamos ejecutar nuestros programas en cualquier host.

La **`JVM`** es configurable mediante parámetros. Entre otras cosas podemos
configurar la cantidad de memoria asignada  mediante **`minRAMPercentage`** y
**`maxRAMPercentage`**. Ambos establecen qué porcentaje de la memoria del sistema
se le asignará a la **`JVM`**.

> Vale la pena desambiguar ambos parámetros ya que a simple
> vista pareciera que establecen valores máximos y mínimos de memoria que se le
> asignará a la **`JVM`**. En realidad, **`minRAMPercentage`** se utiliza en sistemas con poca
> memoria (menos de 200MB); mientas que **`maxRAMPercentage`** se utiliza en sistemas
> con mayor capacidad (a partir de 200MB). Para más información vea este
> [interesante articulo explicativo](https://www.baeldung.com/java-jvm-parameters-rampercentage).

# CGroups

**`CGroups`** hace referencia a una funcionalidad del kernel de Linux
llamada `Control Groups`.

Nos permiten agrupar los procesos y controlar
la asignación de recursos, como por ejemplo: tiempo de CPU, memoria,
entrada/salida, entre otros. Se diseñó de forma tal que soporte diversos
controladores para distintos tipos de recursos, y que los procesos sean agrupados
jerárquicamente (como en un filesystem).


### CGroups v1 o CGroups v2

**`Cgroups v1`** aparece en el kernel de linux versión **2.6.24**. Con el tiempo
se agregaron muchos controladores para distintos tipos de recursos sin
coordinación previa entre ellos. Como consecuencia de ello, comenzaron a
presentarse algunas inconsistencias entre los controladores que complicaban su
uso.
 
Es así como a partir de la versión **3.10** del kernel de Linux se comenzó a 
trabajar en una nueva implementación de CGroups (**`CGroups v2`**) para remediar
estos problemas. La misma fue incluida en la versión **4.5** de manera oficial.

Pese a que **`CGroups v2`** nace como reemplazo de **`CGroups v1`**, ambas
versiones suelen coexistir y son compatibles entre sí. Con esto nos referimos a
que la **v2** puede utilizar aquellos controladores de la **v1** que aun no hayan
sido portados.

### CGroups y contenedores

Los runtimes de contenedores (como Docker), hacen uso extensivo de los
namespaces del kernel para que los contenedores corran como procesos aislados
en el host, manteniendo total control sobre ellos.

Otra de las funcionalidades que proveen es la de 
[limitar los recursos](https://docs.docker.com/config/containers/resource_constraints/)
que se le asignan a un contenedor. Es deseable que utilicemos límites
cuando ejecutamos nuestras aplicaciones containerizadas, ya que así evitamos que
un contenedor utilice más recursos de los asignados, previniendo
leaks que podrían degradar o incluso poner en peligro al host donde corren otros
contenedores.

# El problema

Con todo lo dicho hasta ahora, resulta importante configurar los recursos
dados a una JVM que se ejecuta dentro de un contenedor. Nos centramos
particularmente en la memoria, ya que es un recurso crítico en las aplicaciones
Java.

> Para comprender mas en profundidad sobre la limitación de memoria en Docker, se
> recomienda leer la [documentación oficial.](https://docs.docker.com/config/containers/resource_constraints/#memory)

La JVM admite configurar la memoria máxima a emplear, utilizando opciones que se
envían a la JVM cuando corremos `java`. Ahora bien, estas opciones admiten
establecerse con valores absolutos, en términos de cuántos bytes asignar a la
máquina virtual, como también permiten trabajar en términos relativos a la
memoria total del sistema, expresada en un porcentaje.

El primer problema que surgió con la adopción avasallante de contenedores es que
la versión de java 8 previa al [update
131](https://www.oracle.com/java/technologies/javase/8u131-relnotes.html),
**no permitía limitar los recursos utilizando CGroupsv1**. Es decir, al utilizar
porcentajes se tomaba el total de memoria en el host, ignorando los límites
impuestos al contenedor. Esta primera versión de la JVM, incluía soporte
experimental de CGroupsv1. Recién en el [update 191](https://www.oracle.com/java/technologies/javase/8u191-relnotes.html)
se portó la funcionalidad de CGroupsv1 desde la versión 10 de la JVM. Luego, con el
lanzamiento de CGroupsv2, sucedió exactamente el mismo problema, es decir,
la JVM tomaba toda la memoria del host en vez de la limitada en el contenedor.

Para ilustrar este problema realizamos un conjunto de pruebas que nos permitirán
evidenciar y analizar qué sucede en base a los resultados obtenidos.

### Sobre las pruebas

Para realizar las pruebas creamos dos máquinas virtuales, una con con 
**`ubuntu/xenial(CGroupsv1)`** y otra con **`ubuntu/jammy(CGroupsv2)`**.

> Las pruebas pueden simplificarse si se utiliza
> [Vagrant](https://www.vagrantup.com/), con los boxes de
> [ubuntu/xenial](https://app.vagrantup.com/ubuntu/boxes/xenial64) y
> [ubuntu/jammy](https://app.vagrantup.com/ubuntu/boxes/jammy64).

Creamos también el siguiente script.

```sh
#!/bin/bash

PROVIDERS="
openjdk:8-alpine
openjdk:17-alpine
openjdk:19-alpine
amazoncorretto:8-alpine
amazoncorretto:11-alpine
amazoncorretto:17-alpine
amazoncorretto:19-alpine
eclipse-temurin:8-alpine
eclipse-temurin:11-alpine
eclipse-temurin:17-alpine
eclipse-temurin:19-alpine
"

system_memory=$(free -h | grep Mem | xargs | cut -d' ' -f2)
echo -e "Imagen | limite_memoria |  Heap_Aplicada | Version_Java | Factor de memoria (%)" > output
  memory="100m"
  for provider in ${PROVIDERS}; do
    echo "Running $provider with $memory memory"
    docker run --rm $provider java -XX:+PrintFlagsFinal -versión &> docker_output.log
    min_ram_percentage=$(grep "MinRAMPercentage" docker_output.log | cut -d= -f2 | cut -d. -f1 | xargs)
    docker run --rm --memory $memory $provider java -XshowSettings -versión &> docker_output.log
    heap=$(grep "Max. Heap Size" docker_output.log | cut -f2 -d: | xargs)
    java_version=$(grep "java.runtime.versión" docker_output.log | cut -f2 -d'='  | xargs)
    echo -e "$provider | $memory | $heap | $java_version | $min_ram_percentage " >> output
  done
  memory="500m"
  for provider in ${PROVIDERS}; do
    echo "Running $provider with $memory memory"
    docker run --rm $provider java -XX:+PrintFlagsFinal -versión &> docker_output.log
    max_ram_percentage=$(grep "MaxRAMPercentage" docker_output.log | cut -d= -f2 | cut -d. -f1 | xargs)
    docker run --rm --memory $memory $provider java -XshowSettings -versión &> docker_output.log
    heap=$(grep "Max. Heap Size" docker_output.log | cut -f2 -d: | xargs)
    java_version=$(grep "java.runtime.versión" docker_output.log | cut -f2 -d'='  | xargs)
    echo -e "$provider | $memory | $heap | $java_version | $max_ram_percentage " >> output
  done
echo "System Memory $system_memory"

column -t output 
```
Este script utiliza diferentes proveedores de java en diferentes versiones, 
ejecutando un contenedor con límites de memoria, para finalmente imprimir un 
cuadro comparativo de los diferentes setups y su comportamiento.

### Análisis de resultados

A continuación transcribimos los resultados obtenidos.

El cuadro comparativo cuenta con 5 columnas:
* `Imagen`
* `Límite de memoria`: Es el límite que se le asigna al contenedor. Elegimos limitar
  en 100M y 500M respectivamente para probar tanto el parámetro 
  **`minRamPercentage`** como **`maxRamPercentage`**.
* `Memoria aplicada`: Memoria asignada al proceso java.
* `Versión`: Versión utilizada en la imagen.
* `Factor de memoria`: Porcentaje de la memoria disponible asignada por defecto 
  a la JVM según el ambiente.

#### CGroups v1

| Imagen | Límite de Memoria | Memoria Aplicada | Versión | Factor de Memoria |
|:------ |:-------------:|:---:|:-----------:|:------:|
| openjdk:8-alpine | 100m | 48.38M | 1.8.0_212-b04 | 50 |
| openjdk:17-alpine | 100m | 48.38M | 17-ea+14 | 50 |
| openjdk:19-alpine | 100m | 48.38M | 19-ea+5 | 50 |
| amazoncorretto:8-alpine | 100m | 48.38M | 1.8.0_352-b08 | 50 |
| amazoncorretto:11-alpine | 100m | 48.38M | 11.0.19+7-LTS | 50 |
| amazoncorretto:17-alpine | 100m | 48.38M | 17.0.7+7-LTS | 50 |
| amazoncorretto:19-alpine | 100m | 48.38M | 19.0.2+7-FR | 50 |
| eclipse-temurin:8-alpine | 100m | 48.38M | 1.8.0_352-b08 | 50 |
| eclipse-temurin:11-alpine | 100m | 48.38M | 11.0.19+7 | 50 |
| eclipse-temurin:17-alpine | 100m | 48.38M | 17.0.7+7 | 50 |
| eclipse-temurin:19-alpine | 100m | 48.38M | 19.0.2+7 | 50 |
| openjdk:8-alpine | 500m | 121.81M | 1.8.0_212-b04 | 25 |
| openjdk:17-alpine | 500m | 121.81M | 17-ea+14 | 25 |
| openjdk:19-alpine | 500m | 121.81M | 19-ea+5 | 25 |
| amazoncorretto:8-alpine | 500m | 121.81M | 1.8.0_352-b08 | 25 |
| amazoncorretto:11-alpine | 500m | 121.81M | 11.0.19+7-LTS | 25 |
| amazoncorretto:17-alpine | 500m | 121.81M | 17.0.7+7-LTS | 25 |
| amazoncorretto:19-alpine | 500m | 121.81M | 19.0.2+7-FR | 25 |
| eclipse-temurin:8-alpine | 500m | 121.81M | 1.8.0_352-b08 | 25 |
| eclipse-temurin:11-alpine | 500m | 121.81M | 11.0.19+7 | 25 |
| eclipse-temurin:17-alpine | 500m | 121.81M | 17.0.7+7 | 25 |
| eclipse-temurin:19-alpine | 500m | 121.81M | 19.0.2+7 | 25 |

La memoria disponible del host es de **`992M`**. 

Al correr java en cualquier versión en un **contenedor limitando su memoria a `100M`** el factor de memoria
asignado por defecto es del **`50%`**. Vemos que los límites de memoria se respetan ya
que teniendo **`100M`** se asigna alrededor de **`50M`**.

En segunda instancia, vemos que al correr java en cualquier versión en un 
ambiente de **`500M`**, el factor de memoria asignado por defecto es del 
**`25%`**. Vemos que aquí también esto se cumple, ya que se asigna alrededor de 
**`125M`**.

Entonces concluimos que **java se comporta sin problemas en un ambiente con 
`CGroupsv1` en las versiones verificadas**.

#### CGroups v2

| Imagen | Límite de Memoria | Memoria Aplicada | Versión | Factor de Memoria |
|:------ |:-------------:|:---:|:-----------:|:------:|
| openjdk:8-alpine | 100m | 235.88M | 1.8.0_212-b04 | 50 |
| openjdk:17-alpine | 100m | 48.38M | 17-ea+14 | 50 |
| openjdk:19-alpine | 100m | 48.38M | 19-ea+5 | 50 |
| amazoncorretto:8-alpine | 100m | 235.88M | 1.8.0_352-b08 | 50 |
| amazoncorretto:11-alpine | 100m | 48.38M | 11.0.19+7-LTS | 50 |
| amazoncorretto:17-alpine | 100m | 48.38M | 17.0.7+7-LTS | 50 |
| amazoncorretto:19-alpine | 100m | 48.38M | 19.0.2+7-FR | 50 |
| eclipse-temurin:8-alpine | 100m | 235.88M | 1.8.0_352-b08 | 50 |
| eclipse-temurin:11-alpine | 100m | 48.38M | 11.0.19+7 | 50 |
| eclipse-temurin:17-alpine | 100m | 48.38M | 17.0.7+7 | 50 |
| eclipse-temurin:19-alpine | 100m | 48.38M | 19.0.2+7 | 50 |
| openjdk:8-alpine | 500m | 235.88M | 1.8.0_212-b04 | 25 |
| openjdk:17-alpine | 500m | 121.81M | 17-ea+14 | 25 |
| openjdk:19-alpine | 500m | 121.81M | 19-ea+5 | 25 |
| amazoncorretto:8-alpine | 500m | 235.88M | 1.8.0_352-b08 | 25 |
| amazoncorretto:11-alpine | 500m | 121.81M | 11.0.19+7-LTS | 25 |
| amazoncorretto:17-alpine | 500m | 121.81M | 17.0.7+7-LTS | 25 |
| amazoncorretto:19-alpine | 500m | 121.81M | 19.0.2+7-FR | 25 |
| eclipse-temurin:8-alpine | 500m | 235.88M | 1.8.0_352-b08 | 25 |
| eclipse-temurin:11-alpine | 500m | 121.81M | 11.0.19+7 | 25 |
| eclipse-temurin:17-alpine | 500m | 121.81M | 17.0.7+7 | 25 |
| eclipse-temurin:19-alpine | 500m | 121.81M | 19.0.2+7 | 25 |

La memoria disponible del host es de **`969M`**. 

En nuestras pruebas con **`CGroups v2`** es donde comenzamos a observar
inconsistencias.

Eperaríamos los mismos resultados que en las pruebas anteriores. Sin embargo
vemos que para la **`versión 8`** no se esta aplicando bien el limite de memoria.

##### Aquí un extracto de las inconsistencias observadas:

| Imagen | Límite de Memoria | Memoria Aplicada | Versión | Factor de Memoria |
|:------ |:-------------:|:---:|:-----------:|:------:|
| openjdk:8-alpine | 100m | 235.88M | 1.8.0_212-b04 | 50 |
| eclipse-temurin:8-alpine | 100m | 235.88M | 1.8.0_352-b08 | 50 |
| amazoncorretto:8-alpine | 100m | 235.88M | 1.8.0_352-b08 | 50 |
| openjdk:8-alpine | 500m | 235.88M | 1.8.0_212-b04 | 25 |
| amazoncorretto:8-alpine | 500m | 235.88M | 1.8.0_352-b08 | 25 |
| eclipse-temurin:8-alpine | 500m | 235.88M | 1.8.0_352-b08 | 25 |

Viendo en detalle los resultados, observamos que para cualquier límite de memoria
asignado (Ver columna 2) la memoria disponible es de alrededor de **`250M`**.
Algo llamativo es que este valor es el **`25%`** de la memoria disponible del
host.

Lo que está sucediendo es que **al no poseer soporte para utilizar los
controladores de `CGroups v2`, la JVM no toma los límites impuestos al
contenedor. Es más, considera la memoria total del host (969M) y como ésta es
mayor a `200M` aplica el factor del `25%`, resultando en una asignación de
alrededor de `250M`**.

Es importante destacar entonces que las **JVM con problemas son aquellas en las
versiones 1.8 en los updates 212 y 352**.

# Conclusiones

Siempre que debamos correr una aplicación java dentro de un contenedor, debemos
prestar especial atención no sólo a la versión de java utilizada sino también a
la versión de cgroups que emplea el host donde va a ejecutarse.

En ambientes con Kubernetes, el uso de límites de memoria es una práctica muy
recomendada para evitar que el host quede fuera de servicio por algún proceso
que haga un uso excesivo de recursos. Por ello, si empleamos límites que no
son considerados por la JVM, probablemente nuestro contenedor se reinicie
frecuentemente por emplear más memoria de la permitida.

Habiendo visto todo esto, surge inmediatamente la pregunta: **`¿Cómo lidiamos 
con esta limitación?`** 

En principio, tenemos **`buenas noticias`**. El problema que mencionamos [se
encuentra identificado](https://bugs.openjdk.org/browse/JDK-8230305) y
recientemente se lanzó un parche en la versión 8 de java de OpenJDK. Este parche
es el **`8u372-b07`** que agrega soporte para **`CGroups v2`**.

Entonces basta con asegurarnos que la versión que utiliza nuestra imagen sea
mayor o igual a la mencionada previamente. Por otro lado, vale la pena aclarar 
que OpenJDK 
[ya no actualiza las imágenes de java 8](https://github.com/docker-library/openjdk/issues/505)
por lo que para poder utilizar este parche tendremos que utilizar alguna de sus
alternativas como [amazon-corretto](https://hub.docker.com/_/amazoncorretto) o
[eclipse-temurin](https://hub.docker.com/_/eclipse-temurin), sólo por mencionar
dos de las versiones mas populares según new relic.

#### Referencias

* [OpenJDK official site](https://openjdk.org/)
* [minRamPercentage y maxRamPercentage](https://www.baeldung.com/java-jvm-parameters-rampercentage)
* [Manpage cgroups](https://man7.org/linux/man-pages/man7/cgroups.7.html)
* [Recursos en Docker](https://docs.docker.com/config/containers/resource_constraints/)
* [Bug tracker de openjdk issue cgroups](https://bugs.openjdk.org/browse/JDK-8230305)
* [Comunicado deprecación de imágenes OpenJDK 8 y 11](https://github.com/docker-library/openjdk/issues/505)
* [2022 state of the java ecosystem. New relic](https://newrelic.com/resources/report/2022-state-of-java-ecosystem)

#### Créditos

La imagen utilizada en este post se encuentra bajo [licencia
unsplash](https://unsplash.com/license) y pertenece a 
[Dylan Hunter](https://unsplash.com/@dylhunter).
