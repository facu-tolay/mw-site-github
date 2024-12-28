---
title: "Contenedores nativos de Microsoft Windows usando docker"
date: 2023-09-22T16:30:00-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/whale-flying.jpeg"
# post author
author: "Christian Rodriguez, Manuel Kloster (revisión)"
# taxonomies
categories: ["DevSecOps" ]
tags: ["windows", "docker", "infrastructure"]
# meta description
description: "Contenedores nativos de Microsoft Windows usando docker"
# save as draft
draft: false
---
# Contenedores nativos de Microsoft windows usando docker

En Mikroways utilizamos mucho los contenedores. Somos pioneros en utilizar esta
tecnología desde antes del lanzamiento correspondiente a la primera versión
estable de docker. Sin embargo, siempre trabajamos con contenedores linux.

Cuando aprendemos contenedores, siempre aparece una comparativa entre los
contenedores y la virtualización. A continuación vemos cómo funciona la
virtualización:

{{< figure src="/images/blog/containers/virtualized-app.webp" >}}

Ahora vemos qué sucede durante la contenerización:

{{< figure src="/images/blog/containers/containerized-app.webp" >}}

Como puede verse, al contenerizar, el sistema operativo de base es compartido por
todas las aplicaciones. Esta diferencia es **fundamental** y es la causante de
la popularidad de los contenedores, debido a la eficiencia lograda por
compartir el mismo sistema operativo de base.

Entonces, aquí aparece el primer punto donde los caminos se abren en diferentes
direcciones:

* Contenedores que corren en linux porque el sistema de base es linux.
* Contenedores que corren en windows porque el sistema de base es windows.

Como los contenedores en linux son muy populares, la mayoría de las imágenes
disponibles de las que solemos encontrar ejemplos corresponde a este tipo de
contenedores. Sin embargo, en el plano de Microsoft, hay contenedores
específicos para cargas de trabajo que requieren este sistema opertativo de
base.

## Docker en Microsoft windows

La primera aclaración necesaria es que los únicos contenedores que existían en
los inicios de docker eran los de linux. [^1]

Recién en 2017, [Windows Server
2016](https://learn.microsoft.com/en-us/archive/msdn-magazine/2017/april/containers-bringing-docker-to-windows-developers-with-windows-server-containers)
ofrece soporte de contenedores windows. Este trabajo de Microsoft nació como un
proyecto ambicioso en el año 2014, cuando la adopción de contenedores se
multiplicó y creció exponencialmente con la liberación de kubernetes.

Pero seguramente, recordarás que para el 2017 los usuarios de windows ya podían
trabajabar con docker. Y acá otra vez la confusión aparece, como en tantos
planos de la informática, porque utilizamos terminología similar, o incluso
igual, para referirnos a distintos temas. Docker ofreció muchas formas de correr
contenedores en máquinas windows, pero todas basadas en la virtualización de un
linux porque los contenedores a correr eran linux. Entonces los usuarios corrían
el cliente docker desde su desktop conectando al daemon dockerd que ejecuta en
una virtual corriendo linux. Inicialmente se podía correr docker usando una
solución que se llamaba [docker machine](https://github.com/docker/machine).
Pero esta solución fue discontinuada en favor del actual [docker desktop](https://www.docker.com/products/docker-desktop/),
un producto que permite correr la herramienta en múltiples plataformas.

Además y casi simultáneamente, Microsoft
trabajaba en [WSL o Windows Subsystem for
Linux](https://learn.microsoft.com/en-us/windows/wsl/).
Con esta nueva capacidad, los usuarios de Microsoft windows pueden instalar
docker en cualquier distribución soportada por WSL. Sin embargo, como WSL no
soporta systemd, los servicios no se mantienen corriendo como se espera. Pero
esto no es un impedimento:

* O se procede con docker desktop y saca mayor provecho al uso de wsl, como se
  explica en la [propia documentación](https://docs.docker.com/desktop/wsl/), o
* Se puede usar dockerd como se [sugiere en este excelente
  post](https://dev.to/bowmanjd/install-docker-on-windows-wsl-without-docker-desktop-34m9),
  que además recomienda usar podman en lugar de docker.

Hasta aquí, como podrá notarse, hemos explicado diferentes formas de cómo correr
contenedores linux, pero sólo mencionamos al pasar sobre los contenedores
windows. Ahora hablaremos de ellos.

## Contenedores windows con docker

Como sucede con cualquier contenedor, la idea de lograr encapsular en una imagen
de contenedores toda la configuración necesaria para correr una aplicación, se
mantiene y aplica por igual en este caso.

Desde Mikroways, estamos convencidos de que la contenerización es un excelente
mecanismo por medio del cuál ordenamos en un simple Dockerfile los pasos
manuales; esto antes se utilizaba para desplegar una aplicación en un nuevo
ambiente, o ante una recuperación ante desastres. Además, contenerizar ofrece
nuevas ventajas como son la escalabilidad de aplicaciones, auto sanado y service
discovery de una forma simple.

Con la introducción anterior, cabe mencionar entonces que el espectro cubierto
por esta solución basada en contenedores windows aplica a proyectos que dependan
de aplicaciones desarrolladas en .Net Framework en las versiones 3.x o 4.x. Las
aplicaciones desarrolladas en .Net Core pueden correr tanto en contenedores
windows como linux. Por cuestiones de performance y adopción por las grandes
comunidades o plataformas como kubernetes, se suele preferir utilizar
contenedores linux en estas aplicaciones.

Por lo tanto, si disponemos de una aplicación .Net Framework que queramos
contenerizar, siempre que sea posible por las dependencias necesarias para
correrla, podremos avanzar en este sentido. Lo mismo sucede con servicios o
aplicaciones que corran en windows nano server o windows core.

## Instalando un engine de contenedores en windows

La instalación está muy clara en la [página oficial de
Microsoft](https://learn.microsoft.com/en-us/virtualization/windowscontainers/quick-start/set-up-environment?tabs=dockerce#windows-server-1).
En ella se explica cómo instalar:

* Docker CE / Moby
* Mirantis container runtime
* Containerd

> El uso de containerd es el recomendado para clusters kubernetes que deban
> tener nodos con la posibilidad de correr contenedores windows.

Una vez instalado el engine de contenedores preferido, podremos trabajar con
contenedores, como lo hacemos en Linux. Elegimos docker CE en nuestro caso.

## Corriendo nuestro primer contenedor en windows

Probamos primero el comando `docker info` desde una consola de powershell:

![windows docker
info](/images/blog/containers/windows-docker-info.png)

Como vemos, el `OSType` es **windows**, así como el `Storage Driver` es uno
específico de windows. La primera prueba que haremos, será justamente para
dejar constancia que no podemos correr contenedores linux en un engine windows.

![windows docker run linux container](/images/blog/containers/windows-docker-run-alpine.png)

Pero sí podemos correr una imagen de windows. Es interesante leer la
documentación que provee la página correspondiente a la [imagen oficial de
windows](https://hub.docker.com/_/microsoft-windows), donde
muestran las diferentes versiones de windows (server core y nano), como así
también tags y arquitecturas.

Corremos entonces una imagen e imprimimos un mensaje:

![windows docker run
nanoserver](/images/blog/containers/windows-docker-run-nano.png)

## Construimos una imagen

Crearemos una imagen que copie el código de un desarrollo en .Net Framework 4.8.
El despliegue requiere la configuración de un IIS con un AppPool que será
realizado durante el build utilizando Powershell:

{{< highlight dockerfile "linenos=table" >}}

FROM mcr.microsoft.com/dotnet/framework/aspnet:4.8-windowsservercore-ltsc2022

WORKDIR /inetpub/myapp

RUN powershell -Command \
        $ErrorActionPreference = 'Stop'; \
        $ProgressPreference = 'SilentlyContinue'; \
        \
        Import-Module WebAdministration; \
        # Stop and remove standard app pools
        Stop-WebAppPool -Name DefaultAppPool; \
        Remove-WebAppPool -Name DefaultAppPool; \
        # Create a new web app pool
        $appPool = New-Item -Path "IIS:\\AppPools\\myapp"; \
        $appPool.managedRuntimeVersion = 'v4.0'; \
        $appPool.managedPipelineMode = 'Integrated'; \
        New-WebSite -Name myapp -Port 80 -ApplicationPool "myapp" \
          -PhysicalPath "%SystemDrive%\inetpub\myapp"; \
        \
        Remove-Item -Force -Recurse $Env:Temp\*;

COPY ./code .
CMD [ "myapp" ]
{{< / highlight >}}

Como puede verse, se asume que el código de la aplicación está dentro de la
carpeta local `code/`. Esta imagen basada en aspnet 4.8 puede inferirse que está
basada en windows core 2022, dando soporte del framework .Net versión 4.8. Lo
que hacemos con el `RUN` es configurar un AppPool de IIS y un Site indicando la
carpeta desde donde servir los archivos.

Finalmente, como en windows el proceso de IIS es w3svc, el entrypoint que
heredamos en esta imagen se basa en un proceso de Microsoft llamado
[IIS.ServiceMonitor](https://github.com/microsoft/IIS.ServiceMonitor) que se
encarga de monitorizar el estado del servicio **w3svc** para un AppPool que es
especificado como argumento al ServiceMonitor.

El resultado de buildear la imagen anterior se obtiene corriendo:

![docker windows build](/images/blog/containers/windows-docker-build.png)

## Corriendo el contenedor creado

Dado que la imagen construida la llamamos **demo**, podemos lanzar el contenedor
usando:

{{< highlight bash >}}
docker run -p 8080:80 --rm -d demo
{{< / highlight >}}

Y probamos con un navegador el resultado:

![Windows container run](/images/blog/containers/windows-docker-run-app.png)

## Conclusiones

Usar contenedores es un excelente recurso porque trabajamos con infraestructura
inmutable. Esto era algo que se aprovechaba al máximo cuando se trataba de
aplicaciones y servicios linux. Pero ahora, con la posibilidad que nos da
Microsoft, expandimos el ecosistema de contenedores a nuevos destinos, donde
aplicaciones legadas de nuestros clientes pueden portarse a contenedores windows
con un esfuerzo menor que actualizar el framework.

[^1]: Existían los contenedores de Solaris además de [LXC](https://linuxcontainers.org/).
De hecho docker en sus primeras versiones era un wrapper de LXC.
