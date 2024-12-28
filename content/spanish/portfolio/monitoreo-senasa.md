---
title: "Observabilidad en Senasa"
date: 3
page_header_bg: "images/banner/banner1.jpg.webp"
description: "Implementación de una plataforma de observabilidad para Senasa,
con monitoreo y alertas."
images: 
  - "images/clients/senasa.jpg.webp"
customer:
  name: "Senasa"
  logo: "images/clients/senasa-no-name.webp"
  url: "https://www.senasa.gob.ar"
buttons:
  label : "Quiero esto"
  style : "solid"
  link : "contact"
# filter types
types: ["monitoreo"]
# used technologies
tech: ["InfluxDB", "Grafana", "Telegraf", "Javascript", "Python", "FluentD"]
# porjects link
# Problem overview
problem: "El director de Tecnologías de la Información se enteraba de los
problemas cuando recibía un llamado de parte de los usuarios. A su vez, no tenía
control sobre el funcionamiento de los servicios prestados por su dirección."
# Solution overview
solution: "Generamos una plataforma de monitoreo con tableros de control y
alertas por mensajería instantánea y en tiempo real, lo que permite conocer el
momento exacto en que los usuarios están experimentando una degradación o
interrupción de los servicios."
testimony:
  text: "Gracias a esta solución cuando recibo un reclamo enseguida sé si
        tenemos un problema o no. También me permitió tener un mayor control
        sobre el servicio que prestamos, es un excelente trabajo el que hizo
        Mikroways."
  author: "Héctor Bilbao"
  position: "Director de Tecnologías de la Información"
# save as draft
draft: false
---

El organismo contaba con un sistema de monitoreo basado en Nagios que generaba
demasiadas alertas, mezclando las de bajo impacto con las críticas, que debían
ser tratadas de manera inmediata. Como resultado, las alertas críticas solían
pasar desapercibidas. A su vez, dado que la lógica se centraba en los servicios
y no en el usuario, muchas alertas no implicaban un impacto real en el usuario
final.

Atentos a la necesidad del usuario, desde Mikroways decidimos centrar el
monitoreo en la experiencia del usuario. Para ello, relevamos alrededor de 150
sistemas del organismo y seleccionamos los 30 más críticos. Luego, implementamos
una serie de robots que simulan flujos de trabajo típicos de los usuarios,
registrando el tiempo que cada operación demora. Toda la información se
recolecta y se almacena en una base de datos de series temporales (TSDB) y, ante
una falla en un sistema o una demora excesiva, se genera una alerta con una
captura de pantalla del error recibido.

Por otro lado, generamos tableros de control para mostrar el estado de cada
sistema y de los diferentes servidores y servicios, y dejamos planteada la
posibilidad de incorporar reportes periódicos.
