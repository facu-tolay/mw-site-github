---
title: "Automatizar despliegues con Capistrano Y GitLab CI/CD"
date: 2022-02-11T09:52:58-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/pipeline.webp"
# post author
author: "Macarena Poisson"
# taxonomies
categories: ["DevSecOps"]
tags: ["capistrano", "automatización", "gitlab-ci"]
# meta description
description: "Integración de Capistrano con GitLab CI"
---

En el post anterior vimos cómo podemos [automatizar un despliegue utilizando Capistrano]({{<ref "/blog/2022-01-28-automatizacion-de-tareas-con-capistrano.">}}). En este post veremos cómo integrar Capistrano con GitLab CI.

### Integrando Capistrano a GitLab CI

GitLab Continuous Integration, o GitLab CI, nos ofrece la posibilidad de trabajar con imágenes de Docker como parte de la infraestructura CI. Siendo Capistrano una herramienta hecha en Ruby, necesitamos proveer una imagen que tenga Ruby. Podemos hacer eso agragando el siguiente código a nuestro archivo `.gitlab-ci.yaml`:

```yaml
image: ruby:2.6-alpine
```

> En este caso estamos utilizando una imagen basada en alpine, pero puedes utilizar otras.

Luego, debemos instalar Capistrano. Podemos hacerlo de forma tal que se instale cada vez que la imagen se despliega:

```yaml
image: ruby:2.6-alpine
stages:
  - deploy
deploy_staging:
stage: deploy
script:
  - gem install capistrano
```

Capistrano utiliza claves SSH para realizar los despliegues, así que debemos crear una clave SSH que le permita al trabajo de despliegue (deployment job) comunicarse con nuestro servidor. Esto significa que guardaremos una _clave ssh privada_, por lo que debemos asegurarnos de hacerlo de la manera más segura posible; caso contrario, estaríamos comprometiendo la seguridad de nuestro servidor.

La mejor manera de hacerlo es, como se especifica en la [documentación de GitLab](https://docs.gitlab.com/ee/ci/ssh_keys/index.html), usando `ssh-agent` para cargar la clave privada almacenada en nuestro repositorio como una [variable de CI/CD](https://docs.gitlab.com/ee/ci/variables/index.html). Los pasos a seguir para agregar dicha variable a nuestro repositorio son:

1. Dentro del proyecto, ir la pestaña **Configuración > CI/CD**
2. Expandir la sección **Variables**
3. Seleccionar **Añadir variable** y completar los campos necesarios. En **Tipo** seleccionar **Archivo**

Luego, nuestro archivo .gitlab-ci.yaml podría verse como el siguiente:

```yaml
image: ruby:2.6-alpine
stages:
  - deploy
deploy_staging:
  stage: deploy
  script:
    - apk add -U openssh
    - eval `ssh-agent -s`
    - chmod 400 $CLAVE_PRIVADA_SERVIDOR
    - ssh-add $CLAVE_PRIVADA_SERVIDOR
    - gem install capistrano
```
> Con imágenes basadas en Debian no es necesario instalar ssh-agent


Por último, podríamos usar los ambientes de Capistrano para definir que los commits realizados en la rama main disparen un despliegue a producción y los hechos en la rama development a staging:

```yaml
image: ruby:2.6-alpine
stages:
  - deploy
deploy_staging:
  stage: deploy
  script:
    - apk add -U openssh
    - eval `ssh-agent -s`
    - chmod 400 $CLAVE_PRIVADA_SERVIDOR
    - ssh-add $CLAVE_PRIVADA_SERVIDOR
    - gem install capistrano
    - cap staging deploy
  only:
    - development
deploy_production:
  stage: deploy
  script:
    - apk add -U openssh
    - eval `ssh-agent -s`
    - chmod 400 $CLAVE_PRIVADA_SERVIDOR
    - ssh-add $CLAVE_PRIVADA_SERVIDOR
    - gem install capistrano
    - cap production deploy
  only:
    - main
```

### Conclusión

En este post hemos visto cómo utilizando Capistrano y GitLab CI/CD fácilmente podemos automatizar el proceso de despliegue de nuestra aplicación.
