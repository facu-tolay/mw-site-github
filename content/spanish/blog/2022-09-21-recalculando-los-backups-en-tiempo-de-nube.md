---
title: "Recalculando los backups en tiempos de nube"
date: 2022-09-21T12:13:23-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/cloud-backups.webp"
# post author
author: "Leandro Di Tommaso"
# taxonomies
categories: ["DevSecOps"]
tags: ["cloud", "backups", "devsecops", "velero", "restic"]
# meta description
description: "¿De qué manera cambian la forma de hacer backups cuando se trabaja
con la nube? En esta charla se hace un repaso de las principales cuestiones a
considerar."
draft: false
---

Sabemos la importancia de tener backups de nuestra información y los gestionamos
en el día a día pero, ¿cómo se hacen backups de forma correcta en un contexto de
nube?  ¿Qué diferencia hay entre hacer un backup y replicar datos? ¿Qué tipos de
backups existen? ¿Qué datos debemos resguardar? ¿Cómo gestionamos el código de
las aplicaciones? ¿Qué hacemos con los archivos de las aplicaciones? ¿De qué
forma gestionamos las copias de seguridad de las bases de datos?

En la siguiente exposición, Christian Rodríguez nos responde esas preguntas y
otras más.

{{< youtube IMxo4MV57pY >}}

### Recursos utilizados en la exposición

* [Presentación utilizada](/files/cloud-backups.pdf)
* [Phoenix Server](https://martinfowler.com/bliki/PhoenixServer.html)
* [Snowflake Server](https://martinfowler.com/bliki/SnowflakeServer.html)
* [The Twelve-Factor App](https://12factor.net/)
* [Restic](https://restic.net/)
* [Rol de Ansible para instalar y configurar
  Restic](https://galaxy.ansible.com/mikroways/restic)
* [RSnapshot](http://rsnapshot.org/)
* [Velero](https://velero.io/)
* [Backups de Kubernetes con
  Velero](https://www.youtube.com/watch?v=a5SJ3Kx_Xkg)
* [Usar Bacula con Cloud
  Storage](https://bacula.org/whitepapers/ObjectStorage.pdf)
