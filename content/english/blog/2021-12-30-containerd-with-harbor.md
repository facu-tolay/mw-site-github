---
title: "Containerd with Harbor"
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
description: "Configure Containerd to use Harbor as an image cache"
# save as draft
draft: false
---

Previously we explained how to
[install a Harbor server]({{< ref "/blog/2021-12-23-use-harbor-as-image-cache" >}})
and how to
[configure CRI-O to use it]({{< ref "/blog/2021-12-29-crio-with-harbor.md" >}}).

In this case we will see how the configuration is if our *container runtime* is
[Containerd](https://containerd.io/).

### Containerd

To carry out this configuration, you will have to access the nodes and there
create or modify the file `/etc/containerd/config.toml`:

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

In this case, four of the most used registries are configure

* [`docker.io`](https://hub.docker.com/): The official Docker registry.
* [`gcr.io`](https://gcr.io): Google Container Registry, official images from
  Google.
* [`k8s.gcr.io`](https://k8s.gcr.io): Google Kubernetes Engine Container
  Registry, the main Kubernetes image-serving system.
* [`quay.io`](https://quay.io): a private Docker registry operated
  by the Red Hat organization.

These were the four projects defined at Harbor earlier. You will have to add a
similar line in this file for each extra project you want to add.

Remember that for the configuration to take effect, the containerd service must
be restarted:

```console
systemctl daemon-reload
systemctl restart containerd
```
