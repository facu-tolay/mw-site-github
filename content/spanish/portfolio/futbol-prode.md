---
title: "Migración a la nube de Fútbol Prode"
date: 3
# page header background image
page_header_bg: "images/banner/banner1.jpg.webp"
description: "Caso de éxito que comenta la migración de la plataforma de Fútbol
Prode a AWS y la reducción de costos que se obtuvo como consecuencia."
images: 
  - "images/portfolio/football.webp"
customer:
  name: "Fútbol Prode"
  logo: "images/clients/futbolprode.png.webp"
  url: "https://futbolprode.com/"
buttons:
  label : "Quiero esto"
  style : "solid"
  link : "contact"
# filter types
types: ["devsecops"]
# used technologies
tech: ["AWS","Kubernetes","Docker","Cloudwatch","EKS","Cloud Formation"]
# Problem overview
problem: "En el mundial de Rusia 2018, la compañía enfrentó un gasto elevado en
infraestructura y serias dificultades de disponibilidad que afectaron gravemente
la prestación del servicio recibido por los usuarios."
# Solution overview
solution: "Diseñamos e implementamos en AWS una infraestructura con capacidad de
adaptarse a la demanda de forma automática, con alta disponibilidad y con una
reducción de los costos del 72%."
# save as draft
draft: true
---

Formamos un grupo de trabajo de cinco personas para enfrentar distintos
problemas en paralelo, dado que disponíamos de tan sólo dos meses para completar
el trabajo.

Partimos de una aplicación Ruby on Rails, versionada con GIT e instalada
manualmente sobre un VPS en Linode. Diseñamos la infraestructura de AWS,
empaquetamos la aplicación en contenedores Docker y la desplegamos en un cluster
Kubernetes sobre AWS.

Para simplificar la gestión de producción, implementamos despliegue continuo con
rolling-update para que, ante cada nueva versión del software, la misma sea
puesta automáticamente en producción sin downtime. A su vez, configuramos la
infraestructura para que, ante un aumento en la demanda, se generen y pongan
operativos nuevos servidores de forma automática, de manera de seguir prestando
el servicio sin deterioro de rendimiento. De la misma forma, ante una reducción
en la demanda, los servidores creados son eliminados de forma automática para
reducir el gasto.

Toda la infraestructura se entregó con tableros de control que permiten ver los
eventos y los consumos de recursos en todo momento.
