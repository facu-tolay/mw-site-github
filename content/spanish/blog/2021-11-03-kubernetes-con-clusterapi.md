---
title: "Instalar Kubernetes en VMware Vsphere"
date: 2021-11-01T12:14:34-03:00
# page header background image
page_header_bg: "images/banner/banner1.jpg.webp"
# post thumb
image: "images/blog/cluster.webp"
# post author
author: "Leandro Di Tommaso"
# taxonomies
categories: ["DevSecOps"]
tags: ["clusterapi", "vmware", "kubernetes", "automatización", "terraform",
"ansible", "vsphere"]
# meta description
description: "Este post explica cómo instalar Kubernetes en VMware Vsphere de
forma automatizada, usando ClusterAPI."
# save as draft
draft: false
---

En este post explicamos cómo se puede instalar Kubernetes en VMware Vsphere de
forma automatizada, haciendo uso de ClusterAPI y otras herramientas. Además,
como parte de la instalación vamos a:

* Generar una máquina virtual que tendrá el rol de bastión, con todas las
  herramientas necesarias para interactuar con el cluster.
* Integrar Gitops para simplificar la gestión de Kubernetes y las aplicaciones
  que se desplieguen.

### Paso 1: Generar las imágenes de las VMs

Para poder trabajar con ClusterAPI necesitamos generar imágenes de las máquinas
virtuales que vamos a usar, con la versión específica de Kubernetes que queremos
instalar. De esta manera, la creación y actualización de clusters se vuelve muy
sencilla.

{{< youtube _9tyOgAEFK4 >}}

### Paso 2: Crear un bastión para la interacción con el cluster

Si bien no es un paso obligatorio, contar con un bastión tiene una ventaja muy
importante, y es que garantiza que se dispone, en todo momento, de una máquina
con todas las herramientas necesarias para trabajar con el cluster.

En este video, mostramos cómo crear un bastión en VMWare VSPhere, usando
Terraform, a partir de un template creado con packer, y aprovisionado con
Ansible.

{{< youtube yt1FBGr8_BU >}}

### Paso 3: Crear el cluster de Kubernetes

Una vez completados los dos pasos previos pasamos al plato principal, que es la
instalación del cluster de Kubernetes.

{{< youtube dx0UEeSX9uk >}}

<br>

*En el video previo se hace referencia a un chart de HELM de ClusterAPI, que se
puede encontrar en: https://github.com/Mikroways/cluster-api-helm*


### Paso 4: Agregar GitOps para gestionar el cluster

El último paso es integrar lo mejor de GitOps para gestionar el cluster de
Kubernetes. En este caso, mostramos cómo crear un cluster fácilmente con ArgoCD
y usando nuestro chart de HEML de Cluster API.

{{< youtube bpdaEUkdKbE >}}
