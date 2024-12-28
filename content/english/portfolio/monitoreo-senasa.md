---
title: "Observability"
date: 3
page_header_bg: "images/banner/banner1.jpg.webp"
description: "How we implemented an observability platform for Senasa, with
detailed monitoring and alerting."
images: 
  - "images/clients/senasa.jpg.webp"
customer:
  name: "Senasa"
  logo: "images/clients/senasa-no-name.webp"
  url: "https://www.senasa.gob.ar"
buttons:
  label : "I want this"
  style : "solid"
  link : "contact"
# filter types
types: ["observability"]
# used technologies
tech: ["InfluxDB", "Grafana", "Telegraf", "Javascript", "Python", "FluentD"]
# porjects link
# Problem overview
problem: "The Director of Information Technology used to find out about problems
when he received a call from a user. Besides, he had no way of knowing whether
the services provided by his management were working or not."
# Solution overview
solution: "We generated a monitoring platform with dashboards and alerts by
instant messaging and in real time, which makes it possible to know the exact
moment when users are experiencing a degradation or interruption of the
services."
testimony:
  text: "Thanks to this solution, whenever I receive a complaint I know right
away whether we actually have a problem with our services or not. This allowed
me to have greater control over the service we provide. It is an excellent work
from Mikroways."
  author: "Héctor Bilbao"
  position: "Director of Information Technology"
# save as draft
draft: false
---

The agency had a Nagios-based monitoring system that generated too many alerts,
mixing low-impact ones with critical ones that had to be dealt with immediately.
As a result, critical alerts used to go unnoticed. In turn, since the logic was
focused on services and not users, many alerts didn't have a real impact on the
final user.

With the needs of the user in mind, from Mikroways we decided to focus
monitoring on the user experience. To do it, we surveyed around 150 systems of
the organism, selecting the most critical 30. Then, we implemented a series of
robots that simulate typical user workflows, recording the time each operation
takes. All information is collected and stored in a time series database (TSDB)
and, in the event of a system failure or excessive delay, an alert is generated
with a screenshot of the error received.

We also generated dashboards to show the status of each system and of the
different servers and services, allowing the possibility of incorporating
periodic reports.
