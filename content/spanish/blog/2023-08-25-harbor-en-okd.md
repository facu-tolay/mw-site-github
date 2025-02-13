---
title: "Harbor en OKD"
date: 2023-08-25T01:37:55-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/redhat.webp"
# post author
author: "Juan Pablo Sánchez Magariños"
# taxonomies
categories: ["DevSecOps"]
tags: ["harbor", "crio", "registry-mirror", "cache", "okd", "openshift", "redhat"]
# meta description
description: "Configurar un cluster OKD para que utilice Harbor como cache de imágenes"
# save as draft
draft: false
---

Vimos en anteriores entregas como [utilizar Harbor como cache de imágenes]({{< ref "/blog/2021-12-23-utilizar-harbor-como-cache-de-imagenes" >}})
y como [configurar CRI-O para que utilice Harbor como cache]({{< ref "/blog/2021-12-29-crio-con-harbor" >}}).
Hoy queremos mostrar el caso específico para lograr el mismo comportamiento en
un cluster [OKD](https://www.okd.io/), cuya configuración presenta algunas
dificultades adicionales.

### Configurando los nodos

Supongamos que tenemos nuestro Harbor corriendo en `my-harbor.example.com` y que
ya tenemos configurado el [proyecto de harbor para que funcione como cache de
`docker.io`]. Además, OKD utiliza [CRI-O](https://cri-o.io/), así que lo *único*
que deberíamos hacer es configurarlo para que utilice nuestro registry como
mirror, ¿verdad?

Veamos, lo que queremos es reemplazar el archivo
`/etc/containers/registries.conf` en el filesystem de cada nodo. Según la
[documentación oficial](https://docs.okd.io/4.11/post_installation_configuration/machine-configuration-tasks.html#using-machineconfigs-to-change-machines)
de OKD, la configuración de las maquinas se realiza a través de un objeto
especial, los `MachineConfigs`. Estos se generan a partir de una definición
`yaml`:

```yaml
❯ cat 99-worker-harbor.bu
variant: openshift
version: 4.11.0
metadata:
  name: 99-worker-harbor-proxy
  labels:
    machineconfiguration.openshift.io/role: worker
storage:
  files:
  - path: /etc/containers/registries.conf
    mode: 0644
    overwrite: true
    contents:
      inline: |
        unqualified-search-registries = ['registry.access.redhat.com', 'docker.io']
        [[registry]]
        prefix = 'docker.io'
        insecure = false
        blocked = false
        location = 'docker.io'
        [[registry.mirror]]
        location = 'my-harbor.example.com/proxy.docker.io'
        insecure = true
```

Luego la documentación indica que se utilice la herramienta [butane](https://coreos.github.io/butane/)
para generar los manifiestos de los `MachineConfigs`:

```yaml
❯ butane 99-worker-harbor.bu -o ./99-worker-harbor.yaml
❯ cat 99-worker-harbor.yaml
# Generated by Butane; do not edit
apiVersion: machineconfiguration.openshift.io/v1
kind: MachineConfig
metadata:
  labels:
    machineconfiguration.openshift.io/role: worker
  name: 99-worker-harbor-proxy
spec:
  config:
    ignition:
      version: 3.2.0
    storage:
      files:
        - contents:
            compression: gzip
            source: data:;base64,H4sIAAAAAAAC/2yOQW6EMAxF9zlFdtkU9wScBGVhEgNWQ0ztRILbV5VK2xnN8uk9W7/Xz46FF6Y8GKGmbVBa2ZoymR/9FH7wAkyJzEApb9ggyR7efMiSPkiBJUQ3TXcbozuUFj79+D9xXI1SV/KjX7AYubl8y/zLRRI2lvp09/cZdlYVjfEhve2woc6iYFTREFaZAfX9UDkveD2jaSf3FQAA//95sGm0BQEAAA==
          mode: 420
          overwrite: true
          path: /etc/containers/registries.conf
```

Pero al aplicarlo, si bien se empiezan a actualizar los `machineconfigpools` no
progresan correctamente y se muestra un error:

```console
  pool is degraded because nodes fail with "1 nodes are reporting degraded
  status on sync": "Node okd-cluster-j92p5-blackbox-monitoring-pmbmh is
  reporting: \"failed decoding TOML content from file
  /etc/containers/registries.conf: files cannot contain NULL bytes; probably
  using UTF-16; TOML files must be UTF-8\"" 
```

Probamos diferentes formas de encodear el archivo, pero siempre obteníamos el mismo error.

### Solución

La solución que [encontramos](https://openshift.tips/registries/) fue encodear
el archivo en base64 y pegarlo en el campo `source` del manifiesto antes
generado. Para esto primero se escribe el archivo `registries.conf` con el
contenido deseado, por ejemplo:

```lua
❯ cat registries.conf
unqualified-search-registries = ['registry.access.redhat.com','docker.io']
[[registry]]
prefix = 'docker.io'
insecure = false
blocked = false
location = 'docker.io'
[[registry.mirror]]
location = 'my-harbor.example.com/proxy.docker.io'
insecure = true
```

Luego se encodea en base64:

```console
❯ cat registries.conf | base64 -w0
dW5xdWFsaWZpZWQtc2VhcmNoLXJlZ2lzdHJpZXMgPSBbJ3JlZ2lzdHJ5LmFjY2Vzcy5yZWRoYXQuY29tJywnZG9ja2VyLmlvJ10KW1tyZWdpc3RyeV1dCnByZWZpeCA9ICdkb2NrZXIuaW8nCmluc2VjdXJlID0gZmFsc2UKYmxvY2tlZCA9IGZhbHNlCmxvY2F0aW9uID0gJ2RvY2tlci5pbycKW1tyZWdpc3RyeS5taXJyb3JdXQpsb2NhdGlvbiA9ICdteS1oYXJib3IuZXhhbXBsZS5jb20vcHJveHkuZG9ja2VyLmlvJwppbnNlY3VyZSA9IHRydWUK%
```

Esto se pega en el campo source del archivo antes generado (haciendo caso omiso
del comentario de no editar). Además borramos la compresión gzip y se le puede
agregar el charset con `data:text/plain;charset=utf-8;base64,`. Entonces queda:

```yaml
❯ cat 99-worker-harbor.yaml
  # Generated by Butane; do not edit
  apiVersion: machineconfiguration.openshift.io/v1
  kind: MachineConfig
  metadata:
    labels:
      machineconfiguration.openshift.io/role: worker
    name: 99-worker-harbor-proxy
  spec:
    config:
      ignition:
        version: 3.2.0
      storage:
        files:
          - contents:
              source: data:text/plain;charset=utf-8;base64,dW5xdWFsaWZpZWQtc2VhcmNoLXJlZ2lzdHJpZXMgPSBbJ3JlZ2lzdHJ5LmFjY2Vzcy5yZWRoYXQuY29tJywnZG9ja2VyLmlvJ10KW1tyZWdpc3RyeV1dCnByZWZpeCA9ICdkb2NrZXIuaW8nCmluc2VjdXJlID0gZmFsc2UKYmxvY2tlZCA9IGZhbHNlCmxvY2F0aW9uID0gJ2RvY2tlci5pbycKW1tyZWdpc3RyeS5taXJyb3JdXQpsb2NhdGlvbiA9ICdteS1oYXJib3IuZXhhbXBsZS5jb20vcHJveHkuZG9ja2VyLmlvJwppbnNlY3VyZSA9IHRydWUK
            mode: 420
            overwrite: true
            path: /etc/containers/registries.conf
```

Aplicando este manifiesto se empezarán a actualizar los nodos. Al finalizar se
se puede ingresar a alguno de ellos y realizar un pull de cualquier imagen de
`docker.io` con usando `crictl pull`. Si dicha imagen aparece en el proyecto de Harbor significa que la configuración se ha realizado exitosamente.
