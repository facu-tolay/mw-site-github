---
title: "Deployment to the cloud"
date: 5
# page header background image
page_header_bg: "images/banner/banner1.jpg.webp"
description: "Deployment of an non-cloud native application in the public cloud
using AWS."
# clients
images: 
  - "images/clients/balanz-smaller.webp"
customer:
  name: "Balanz"
  logo: "images/clients/balanz-smaller.webp"
  url: "https://balanz.com/"
buttons:
  label : "I want this"
  style : "solid"
  link : "contact"
# filter types
featured: ["transformation"]
types: ["costs reduction", "public cloud"]
tech: ["AWS", "Terraform", "Ansible", "WAF", "ECS", "Redis"]
problem: "The client encountered challenges migrating a non-cloud-native
application to a cloud environment. Additionally, this application would be
subjected to high levels of demand and rigorous security requirements. The
application connects via VPNs to APIs from external providers, which increases
complexity. It is developed and distributed across a large number of
repositories, further complicating its deployment when making modifications."
solution: "We reduced complexity with a thorough refactor, enabling us to
deploy the application on AWS while meeting strict security and auditing
standards. A thorough examination of the repositories made it possible to
refactor the application for execution in a containerized environment. We
designed the infrastructure on AWS and implemented it using infrastructure as
code, leveraging tools like GitHub Actions to create pipelines that enable
automatic and simplified deployments. The solution included the use of
technologies such as ECS Cluster, WAF, VPCs, RDS, Load Balancers, VPNs
(StrongSwan), GitHub, Terraform, Redis, and Ansible, ensuring a robust, secure,
and easily manageable environment for the client."
---
