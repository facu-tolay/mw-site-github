---
title: "Implementación de DevOps"
date: 4
# page header background image
page_header_bg: "images/banner/banner1.jpg.webp"
# clients
images: 
  - "images/portfolio/empower.webp"
customer:
  name: "Veritran"
  logo: "images/clients/veritran.png.webp"
  url: "https://www.veritran.com"
buttons:
  label : "Quiero esto"
  style : "solid"
  link : "contact"
# filter types
featured: ["platform"]
types: ["devsecops", "ci/cd", "nube pública", "migración a la nube"]
# used technologies
tech: ["Kubernetes", "Docker", "AWS", "Gitlab CI", "Jenkins", "GIT"]
# porjects link
# meta description
description: "Caso de éxito que narra la primera implementación de DevOps en
Veritran."
problem: "El core de su sistema está programado en C/C++ y debe ejecutarse en
diversas plataformas, lo que requiere compilar cada nueva versión en varias
arquitecturas diferentes. Esta tarea demanda conocimientos avanzados y
constituía un cuello de botella. A su vez, la empresa requería implementar su
plataforma con Docker."
solution: "Logramos automatizar por completo la generación de los ejecutables
para todas las plataformas, de forma tal que esta tarea hoy puede realizarla una
persona sin conocimientos de C/C++. Esto agilizó sustancialmente el proceso y
liberó tiempo de sus talentos más experimentados. Además, generamos una demo de
la plataforma con Docker, lo que requirió adaptar su arquitectura."
---

Formando un excelente equipo de trabajo con Veritran, definimos en conjunto un
versionado semántico para la plataforma y sus componentes, estableciendo las
dependencias que permitieran simplificar la gestión de las compatibilidades. De
la misma manera, estandarizamos estilos de codificación, logramos migrar el
sistema de versionado de SVN a GIT y definimos un flujo de trabajo adaptado a
las necesidades de Veritran. A su vez, implementamos diferentes pipelines con
Gitlab CI y Jenkins para automatizar la tarea de generar los ejecutables para
las diferentes arquitecturas, entre las que se incluyen AIX, Solaris y diversas
versiones de Red Hat y CentOS. Los ejecutables generados son almacenados
automáticamente en un repositorio centralizado, implementado con Nexus, con
todas las convenciones de versiones definidas. Trabajamos también para montar
con Docker la plataforma existente, así como los nuevos componentes que se han
ido desarrollando y, posteriormente, acompañamos el proceso de adopción de
Kubernetes y adaptación de la plataforma como SaaS en AWS.
