---
title: "Private cloud implementation"
date: 2021-03-01
page_header_bg: "images/banner/banner1.jpg.webp"
description: "Success story that describes the implementation of INTA's private
cloud and the migration of its legacy applications there."
images: 
  - "images/portfolio/private-cloud.webp"
customer:
  name: "INTA"
  logo: "images/clients/inta.png.webp"
  url: "https://www.inta.gob.ar"
buttons:
  label : "I want this"
  style : "solid"
  link : "contact"
# filter types
types: ["private cloud", "cloud migration", "ci/cd"]
# used technologies
tech: ["Kubernetes", "Docker", "VMware Vsphere", "Terraform", "Ansible",
"Cluster API", "MinIO", "Velero"]
# porjects link
# meta description
# Problem overview
problem: "The main challenge consisted in migrating a large number of legacy
applications, which ran on very outdated and unsupported operating systems, but
which couldn't be simply updated due to functional dependencies on those
operating systems. At the same time, the variability between servers made each
team dependent exclusively on one person."
# Solution overview
solution: "We removed the dependencies between the applications and the base
operating system and we implemented a private cloud based on Kubernetes. We also
standardized and automated the way in which applications were deployed over the
private cloud. With this, we managed to disable a large number of physical
servers, eliminating the dependency between each server and a technician, and
substantially speeding up the deployment of applications."
draft: true
---

After evaluating the organization's situation, not only in relation to the
project but also thinking about its future management, we decided that the best
solution was to create a private cloud and to move there all the applications
and services that, up to then, had been provided on the servers to be replaced.

For this, we divided the work into two parts:

* Containerize applications so that all their dependencies would be
  self-contained.
* Design and implement the IT infrastructure that would constitute the private
  cloud.

In order to reduce times, we created two work teams to make progress in parallel
with the development of the solution.

We developed the private cloud with Kubernetes on VMware Vsphere, which is the
organization's virtualization platform, and its generation was fully automated
using Terraform, Ansible and Cluster API. This allows it to be replicated and
restored quickly and identically.

On this infrastructure, with fully updated operating systems and libraries, we
deployed containerized applications.

In addition, we also:

* Developed CI/CD pipelines, which allow anyone on the team to deploy the
  applications, as opposed to the previous need of an expert for each system.
* Installed a monitoring stack based on Prometheus, Grafana and Alert Manager to
  have a view of the historical and present states of the infrastructure, and to
  receive alerts in case of problems that deserve attention.

