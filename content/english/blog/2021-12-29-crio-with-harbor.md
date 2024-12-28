---
title: "CRI-O with Harbor"
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
description: "Configure CRIO to use Harbor as an image cache"
# save as draft
draft: false
---

In the [previous post]({{< ref "/blog/2021-12-23-use-harbor-as-image-cache" >}})
We saw how to install a Harbor server that works as a cache for container images.
To use it one should pull from this new registry, for example instead of:

```console
docker pull alpine
```

We should do:

```console
docker pull harbor-cache.example.com/proxy.docker.io/library/alpine
```

It would be quite inconvenient to change this registry in all scripts,
Dockerfiles and docker-compose. Because of this, we are going to
show how to configure our *container runtime* to replace the
registry by default for the one we use in our projects.

### CRI-O

In the nodes that use [CRI-O](https://cri-o.io/), the configuration
files are located in the `/etc/containers/registries.conf.d/` directory.
In it we must create files with the following format:

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

Create a similar file for each of the registries previously defined in
Harbor. This results in any image requirements
to the domain defined in `prefix` first trying to search in the registry
indicated in `[[registry.mirror]]`. If this search is unsuccessful it will look
in the main `location`.

The first time you make the request to the harbor-cache registry, it downloads
the image from the original registry and saves it for future use. If, for any
reason, Harbor is not working, the requirements will fall back to the original
registry.

After this modifications, restart the container runtime:

```console
systemctl daemon-reload
systemctl restart crio
```

By deploying any resource that downloads images, Harbor logs will show that the
cache is being used.

> Repeating these operations on each node would be hard work, in our cluster we
> had the tool
> [Kubespray](https://github.com/kubernetes-sigs/kubespray) which allows us
> automate the creation of clusters, and particularly has a
> [template](https://github.com/kubernetes-sigs/kubespray/blob/release-2.16/roles/container-engine/cri-o/templates/registry-mirror.conf.j2)
> for this configuration.
