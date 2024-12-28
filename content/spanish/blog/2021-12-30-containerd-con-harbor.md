---
title: "Containerd con Harbor"
date: 2021-12-30T11:47:55-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/containers.webp"
# post author
author: "Juan Pablo Sánchez Magariños"
# taxonomies
categories: ["DevSecOps"]
tags: ["harbor", "containerd", "registry-mirror", "cache", "images"]
# meta description
description: "Configurar Containerd para que utilice Harbor como cache de imágenes"
# save as draft
draft: false
---

Anteriormente explicamos como
[instalar un servidor de Harbor]({{< ref "/blog/2021-12-23-utilizar-harbor-como-cache-de-imagenes" >}})
y como
[configurar CRI-O para que lo utilice]({{< ref "blog/2021-12-29-crio-con-harbor.md" >}}).

En este caso veremos como es la configuración si nuestro *container runtime*
es [Containerd](https://containerd.io/).

### Containerd

Para realizar esta configuración habrá que acceder a los nodos y alli crear o modificar el archivo `/etc/containerd/config.toml`:

```toml
version = 2

[plugins."io.containerd.grpc.v1.cri".registry.mirrors]
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
    endpoint = ["https://harbor-cache.example.com/v2/proxy.docker.io/"]
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."gcr.io"]
    endpoint = ["https://harbor-cache.example.com/v2/proxy.gcr.io/"]
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."k8s.gcr.io"]
    endpoint = ["https://harbor-cache.example.com/v2/proxy.k8s.gcr.io/"]
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."quay.io"]
    endpoint = ["https://harbor-cache.example.com/v2/proxy.quay.io/"]
    # [plugins."io.containerd.grpc.v1.cri".registry.configs."harbor-cache.example.com".tls]
    # ca_file   = "/etc/containerd/harbor.pem"
```

En este caso se configuran 4 de las *registries* más utilizadas:

* [`docker.io`](https://hub.docker.com/): La registry oficial de Docker.
* [`gcr.io`](https://gcr.io): Google Container Registry, imágenes oficiales de
  Google
* [`k8s.gcr.io`](https://k8s.gcr.io): Google Kubernetes Engine Container
  Registry, el principal sistema de servicio de imágenes de Kubernetes.
* [`quay.io`](https://quay.io): registry privada operada por Red Hat.

Estos eran los cuatro proyectos que definimos en harbor anteriormente. Habrá que agregar una linea similar en este archivo por cada proyectos extra que se quiera agregar.

Recordar que para que tenga efecto la configuración se debe reiniciar el servicio de containerd:

```console
systemctl daemon-reload
systemctl restart containerd
```
