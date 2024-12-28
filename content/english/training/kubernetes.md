---
title: "Fundamentos de Kubernetes"
index: 31
page_header_bg: "images/categories/cloud.jpg.webp"
description: "Se trata de un curso introductorio, que combina teoría con
laboratorios, y cuyo objetivo es que los alumnos puedan familiarizarse con la
arquitectura de Kubernetes, la forma de interactuar con un cluster y cómo
desplegar aplicaciones en esta plataforma."
images: 
  - "images/categories/cloud.png.webp"
details:
  - title: "¿A quién está destinado?"
    description: "
* Administradores de sistemas

* Arquitectos y desarrolladores de software

* DevOps y SREs

* Cualquier otro profesional que desee comprender la arquitectura y el
  funcionamiento de la plataforma."
  - title: "¿Qué se llevarán?"
    description: "
Quienes realicen esta capacitación aprenderán:

* Sobre los componentes más importantes de Kubernetes y cómo se relacionan entre
  sí.

* A interactuar con el cluster de Kubernetes.

* A gestionar la persistencia para almacenar la información, a escalar
  aplicaciones y a aumentar su disponibilidad.

* A desplegar aplicaciones con y sin estado en un cluster de Kubernetes."
  - title: "Formato y duración"
    description: "
El curso cuenta con una parte teórica, en la que se introducen los conceptos, y
una parte aplicada, donde los alumnos deben resolver diferentes problemas de
forma práctica.


La carga horaria total estimada es de 30 horas, distribuidas de la siguiente
manera:

* 12 horas para las clases teóricas.

* 12 horas para la resolución de los ejercicios prácticos.

* Entre 4 y 6 horas para debatir sobre las problemáticas planteadas a través de
  los ejercicios prácticos."
  - title: "Requerimientos"
    description: "
Sin ser excluyentes, recomendamos:

* Conocimientos previos sobre sistemas operativos, contenedores y redes.

* Experiencia en administración de sistemas o desarrollo de software.

* Idealmente, haber tomado previamente las capacitaciones de [Workflow continuo
  de desarrollo a producción](/es/training/wfc) y la de [Fundamentos de
Docker](/es/training/docker)."
---

## Temario

### Contenido Teórico

* Introducción a K8S: antecedentes, CNCF.
* Arquitectura general y conceptos básicos de Kubernetes. Tecnologías
  subyacentes.
  * Master, Worker, etcd 
  * Diseño con HA 
  * Container runtimes 
  * Networking en Kubernetes
* Alternativas de instalación de Kubernetes: on-premises, en la nube y en modo
  desarrollo.
* Interactuando con el cluster: 
  * kubelet 
  * Modos imperativo y declarativo. 
  * kustomize 
  * Dashboard 
* Objetos de Kubernetes. 
  * Objetos que existen, para qué sirven y cómo se relacionan entre sí.
  * Namespaces, Labels, Pod, Deployment, ConfigMap, Secret, Volume, Service,
    StatefulSet, DaemonSet, Ingress, IngressController, Job, 
  * CronJob.
  * Scheduling y ciclo de vida de pods.
  * Gestión del almacenamiento.
* Ejemplos.

### Contenido Práctico

* Actividad 1: contenedores. Docker y podman. Minukube y kind.
* Actividad 2: interactuando con kubernetes. Kubectl para interactuar con el
  cluster. Kustomize. Node selector. 
* Actividad 3: deployment y configmap.
* Actividad 4: secrets, volúmenes y services. 
* Actividad 5: statefulsets, daemonsets, jobs, 
  cronjobs.
* Actividad 6: una aplicación completa. Introducción a Helm. 
