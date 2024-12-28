---
title: "Install Kubernetes on VMware Vsphere"
date: 2021-11-01T12:14:34-03:00
# page header background image
page_header_bg: "images/banner/banner1.jpg.webp"
# post thumb
image: "images/blog/cluster.webp"
# post author
author: "Leandro Di Tommaso"
# taxonomies
categories: ["DevSecOps"]
tags: ["clusterapi", "vmware", "kubernetes", "automation", "terraform",
"ansible", "vsphere"]
# meta description
description: "This post explains how to automate the installation of
Kubernetes on VMware Vsphere using ClusterAPI."
# save as draft
draft: false
---

In this post we explain how to automate the installation of Kubernetes on VMware
Vsphere using ClusterAPI, among other tools. Besides, as part of the process we
will also:

* Generate a virtual machine to be used as a bastion host, with all the
  necessary tools to interact with the cluster.
* Leverage Gitops to simplify the management of the Kubernetes cluster and of
  the applications deployed on it.

### Step 1: Generate the VMs images

To make it possible to work with ClusterAPI we need to generate images of the
virtual machines we will be using, with the specific version of Kubernetes we
wish to install. That way, creating and updating the clusters gets really easy.

{{< youtube _9tyOgAEFK4 >}}

### Step 2: Create a bastion host to interact with the cluster

Although this is not a mandatory step, having a bastion host guarantees that we
always have in place the necessary tools to work with the cluster.

In the following video, we show how to create a bastion host in VMware VSphere
using Terraform and Ansible, from a template created with Packer.

{{< youtube yt1FBGr8_BU >}}

### Step 3: Create the Kubernetes cluster

With the two previous steps completed, we can now move to the core of this
tutorial, which is the deployment of the Kubernetes cluster.

{{< youtube dx0UEeSX9uk >}}

<br>

*In the previous video a reference is made to a Clsuter API HELM chart
repository, which can be found at:
https://github.com/Mikroways/cluster-api-helm*

### Step 4: Add Gitops to manage the cluster

The last step consists on using the best of Gitops to manage the Kubernetes
cluster. In this case, we show how to easily create a cluster with ArgoCD,
using our Cluster API HELM chart.

{{< youtube bpdaEUkdKbE >}}
