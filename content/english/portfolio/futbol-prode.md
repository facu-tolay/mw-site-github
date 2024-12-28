---
title: "Cloud migration"
date: 2019-05-12
# page header background image
page_header_bg: "images/banner/banner1.jpg.webp"
description: "Sucess story that describes the migration to the public cloud of
'Fútbol Prode' and the costs reduction achieved."
images: 
  - "images/portfolio/football.webp"
customer:
  name: "Fútbol Prode"
  logo: "images/clients/futbolprode.png.webp"
  url: "https://futbolprode.com/"
buttons:
  label : "I want this"
  style : "solid"
  link : "contact"
# filter types
types: ["devsecops", "cloud migration", "costs reduction"]
# used technologies
tech: ["AWS","Kubernetes","Docker","Cloudwatch","EKS","Cloud Formation"]
# Problem overview
problem: "During the Russia 2018 World Cup, the company faced extremely high
expenses in infrastructure and serious availability issues that severely
affected the service provided to its customers."
# Solution overview
solution: "We designed and implemented a scalable and highly available
infrastructure in AWS, which guaranteed the service availability, while
achieving a cost reduction of 72%."
# save as draft
draft: true
---

As we had a short time to implement the solution, we assembled a five people
team to handle the different issues in parallel. The platform was developed in
Ruby on Rails and, initially, it was manually deployed and managed inside a VPS
in Linode.

The first thing we did was to design the AWS infrastructure that would meet the
customer's costs and availability expectations. After that, we containerized the
application with Docker and deployed it in a Kubernetes cluster implemented with
EKS.

To simplify the application management in production, we also implemented
continuous deployment with rolling-updates so we could deploy each new version
of the application in production quickly and without downtime. At the same time,
we configured the infrastructure in a way that, if the demand increased new
servers were created automatically to distribute the load, without any
impact on the application's performance. In much the same way, when the user
demand decreased, the new servers were removed automatically to reduce costs.

The infrastructure included several dashboards with information regarding events
and resources consumption in real time.
