---
title: "CRI-O con Harbor"
date: 2021-12-29T11:47:55-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/crio.webp"
# post author
author: "Juan Pablo Sánchez Magariños"
# taxonomies
categories: ["DevSecOps"]
tags: ["harbor", "crio", "registry-mirror", "cache", "images"]
# meta description
description: "Configurar CRIO para que utilice Harbor como cache de imágenes"
# save as draft
draft: false
---

En la [entrega anterior]({{< ref "/blog/2021-12-23-utilizar-harbor-como-cache-de-imagenes" >}})
vimos como instalar un servidor de Harbor que funcione como cache de imágenes de
contenedores. Para utilizarlo uno debería pullear desde este nuevo registry, por
ejemplo en lugar de:

```console
docker pull alpine
```

Deberíamos hacer:

```console
docker pull harbor-cache.example.com/proxy.docker.io/library/alpine
```

Sería bastante incómodo tener que cambiar este registry en todos los scripts,
Dockerfiles y docker-compose, es por eso que en esta entrega vamos a
ver como configurar nuestro *container runtime* para que reemplace el
registry por defecto por el que utilizamos en nuestros proyectos.

### CRI-O

En los nodos que utilicen [CRI-O](https://cri-o.io/), la configuración
pertinente se encuentra en el directorio `/etc/containers/registries.conf.d/`.
En el debemos crear archivos con el siguiente formato:

```lua
[[registry]]
prefix = "gcr.io"
insecure = false
blocked = false
location = "gcr.io"

[[registry.mirror]]
location = "harbor-cache.example.com/proxy.gcr.io"
insecure = false
```

Se creará un archivo por cada uno de los registries definidos anteriormente en
la UI de Harbor. Esto genera que cualquier requisito de imágenes correspondiente
al dominio definido en `prefix` intente primero buscar en el registry indicado
en `[[registry.mirror]]` y si no tiene éxito buscará en el `location` principal.

La primera vez que haga la petición al registry de harbor-cache, se guardara la
imagen para futuros usos, pero si por algún motivo no funciona Harbor, recaerán
las peticiones sobre la registry original.

Luego de modificar este archivo se debe reiniciar el servicio de CRI-O para que
tenga efecto:

```console
systemctl daemon-reload
systemctl restart crio
```

Desplegando cualquier recurso que descargue imágenes se podrá ver en los logs de Harbor que se está usando el cache.

> Repetir estas operaciones en cada nodo sería un trabajo arduo, en el caso de
> nuestro cluster contábamos con la herramienta
> [Kubespray](https://github.com/kubernetes-sigs/kubespray) que nos permite
> automatizar la creación de clusteres, y particularmente cuenta con un
> [template](https://github.com/kubernetes-sigs/kubespray/blob/release-2.16/roles/container-engine/cri-o/templates/registry-mirror.conf.j2)
> para esta configuración.
