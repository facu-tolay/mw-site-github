---
title: "Escalado automático de aplicaciones basado en la carga"
date: 2022-09-15T10:26:58-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/autoscaling.webp"
# post author
author: "Leandro Di Tommaso"
# taxonomies
categories: ["DevSecOps"]
tags: ["autoscaling", "monitoreo", "devsecops", "automatizacion"]
# meta description
description: "¿Qué es el escalado de aplicaciones y de qué forma se puede
automatizar para garantizar un excelente servicio optimizando a la vez el
uso de recursos?"
draft: false
---

¿Por qué escalar automáticamente aplicaciones? Son muchos los casos en los
cuales escalar aplicaciones es una necesidad. Esa necesidad responde
habitualmente a la demanda que las aplicaciones tienen de parte de sus usuarios.
Un ejemplo muy típico es el de los sistemas de comercio electrónico, cuyo uso
varía dependiendo del día de la semana, de la hora, de cierta estacionalidad de
los productos que se venden, de promociones, entre otras cosas.

El escalado de aplicaciones consiste básicamente en aumentar o reducir la
capacidad de las aplicaciones y su objetivo es el de ajustar los recursos a la
demanda.

En un entorno de nube pública el escalado de aplicaciones cobra especial
relevancia, dado que se busca brindar el mejor servicio posible a los usuarios
minimizando el costo para la organización.

Dicho eso, si bien escalar manualmente es posible, no resulta eficiente y no
garantiza un buen servicio a los usuarios. Por ello, el escalado se vuelve
particularmente atractivo cuando se realiza de forma automática.

Ahora bien, escalar es un problema que puede entenderse en dos fases:

1. **Disparar el escalamiento**: lo primero es detectar la situación en la cual
   es necesario escalar. Para esto debe existir algún tipo de indicador que se
   estará observando y que, cuando atraviese un determinado umbral, disparará el
   escalado.
1. **Ajustar los recursos**: una vez que se detectó la necesidad de escalar, el
   siguiente paso es ajustar los recursos, de forma tal que pueda responderse a
   los cambios en la demanda.

El indicador más común para disparar el escalamiento es el uso de CPU, que en
algunos casos puede funcionar de forma correcta, pero que en muchos otros no es
representativo del servicio que reciben los usuarios. Ahí es donde se vuelve
necesario buscar otras métricas que reflejen de forma más realista la
experiencia de los usuarios con el servicio.

Con todo lo mencionado como base, en la siguiente exposición se muestra un
ejemplo de escalamiento automático utilizando tanto CPU como otras métricas. El
[repositorio con el código de la
demo](https://gitlab.com/mikroways/public/a-la-nube-con-escalas/escalado-automatico-de-aplicaciones-basado-en-la-carga)
y la [presentación
utilizada](/files/mikroways-a-la-nube-con-escalas-autoscaling.pdf) están
disponibles para ser consultados.

{{< youtube Y4Sa7TjfAdM >}}

