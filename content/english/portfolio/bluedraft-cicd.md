---
title: "DevOps implementation"
date: 1
# page header background image
page_header_bg: "images/banner/banner1.jpg.webp"
# clients
images: 
  - "images/clients/bluedraft.svg"
customer:
  name: "Bluedraft"
  logo: "images/clients/bluedraft.svg"
  url: "https://www.bluedraft.com.ar"
buttons:
  label : "I want this"
  style : "solid"
  link : "contact"
# filter types
types: ["devsecops", "ci/cd"]
# used technologies
tech: ["AWS", "Docker"]
# porjects link
# meta description
description: "This story narrates the implementation of DevOps for one of
Bluedraft's own applications."
# Problem overview
problem: "BlueDraft had developed a Forecasting and Financial Analytics tool for
large companies customized by client, which required complex, slow and expensive
maintenance and updating work."
# Solution overview
solution: "We redesigned the application's architecture, simplifying the
maintenance, the updating and the management of each client's customizations. At
the same time, we standardized the different environments and we automated the
deployment in production, significantly reducing the time-to-market, human
intervention and error occurrences."
draft: false
---

We began by providing training to introduce good practices and standardize
important concepts. Then, we carried out an analysis of the software
architecture, developed in Django and React, from which it emerged that the
architecture was not scalable and that it wouldn't be easy to maintain each
client's customizations. We formed two work teams, one focused on the backend
and the other on the frontend. As a result, we modified the application’s
architecture and we generated automation tools to simplify development
management, incorporating, in turn, practices such as continuous integration and
continuous delivery.

We redefined and improved the container architecture, and with that done, we
installed a demo server using Amazon EC2, Amazon EFS, and Docker. Finally, and
in order to simplify the client's work, we created a development environment
based entirely on Docker to minimize the time required to create said
environment and to standardize the tools and versions used by the team. As a
result, the development environment ended up being identical to the production
environment.
