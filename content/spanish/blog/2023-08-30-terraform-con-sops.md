---
title: "Cifrado de datos en IaC: Usando SOPS con Terraform"
date: 2023-08-30T20:30:55-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/terraform.webp"
# post author
author: "Inti Maria Tidball"
# taxonomies
categories: ["DevSecOps"]
tags: ["terraform", "sops", "encryption", "infrastructure", "version", "git"]
# meta description
description: "Cifrado de datos en IaC: Usando SOPS con Terraform"
# save as draft
draft: false
---
# Cifrado de datos en IaC: Usando SOPS con Terraform

En el ámbito de la infraestructura como código (IaC), la gestión segura de la información sensible es crucial. SOPS nos ofrece una forma de cifrado seguro con el objetivo de poder versionar variables sensibles en nuestros flujos de devops. SOPS nos ofrece múltiples opciones para el cifrado, inclusive KMS de AWS, PGP y AGE. Para nosotros, el beneficio en el uso de SOPS con KMS es que nos permite una manera organizada de gestionar los permisos granulares, delegando la responsabilidad de almacenar las claves privadas a AWS de manera centralizada.

Poder versionar nuestras variables sensibles nos garantiza confiabilidad y robustez en los despliegues. Al mismo tiempo, poder automatizar su acceso, nos permite aplicar prácticas de CI/CD con una seguridad ampliada. Por otro lado, Terraform es una herramienta elemental para generar infraestructura de manera automatizada, que permite almacenar su estado en un archivo de forma local o compartirlo de manera remota [de diversas formas](https://developer.hashicorp.com/terraform/language/state/remote) (no se recomienda versionar el estado, ya que exponemos información sensible, pero hay varias soluciones para mantener el estado en la nube de manera segura).

Mediante valores cifrados, es posible generar archivos de configuración de infraestructura para configurar aplicaciones de forma segura, por ejemplo, para valores de aplicaciones base que luego se pueden usar con helmfile, por ejemplo, mantener en un solo archivo cifrado datos de DNS que se pueden usar para configurar External-DNS o configurar los Issuers para Cert-Manager. Esto se complementa con la capacidad de Terraform para rastrear y controlar cambios en el estado de la infraestructura, ya que podemos tener un seguimiento de cualquier cambio en nuestro archivo cifrado.

## ¿Por qué SOPS con Terraform?

Usar el módulo de SOPS con Terraform en combinación con SOPS nos permite aumentar la seguridad de nuestras aplicaciones, y mantener la consistencia. SOPS, nos ofrece la capacidad para cifrar, descifrar y editar archivos que contienen secretos o variables sensibles, y Terraform, nos ofrece el poder de automatizar la gestión de infraestructura y mantener un estado consistente.

Juntos se complementan para poder garantizar la seguridad de los datos mientras automatizamos la creación de recursos. Se puede utilizar para generar archivos de configuración desde Terraform de manera segura que luego pueden ser utilizados para gestionar aplicaciones base, o para utilizarse por procesos de CI/CD.

Desde Mikroways les proveemos un [repositorio de demostración](https://github.com/Mikroways/Terraform-SOPS-Demo) que pueden usar para seguir este ejemplo y ver como funciona esta poderosa combinación.

## Guía Práctica Paso a Paso

### Preparación:
- Instalar y configurar [AWS CLI](https://aws.amazon.com/cli/), [Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli), [SOPS](https://github.com/getsops/sops) y [direnv](https://direnv.net/docs/installation.html).
- Configurar un rol de IAM con permisos para usar una clave KMS en AWS.

### Configuración Inicial:
- Copiar el archivo `.envrc-sample` al `.envrc`.
- Editar el archivo `.envrc` con los valores correspondientes, especialmente las variables `AWS_PROFILE` y `AWS_REGION`, que son necesarias para el uso de la clave KMS local.
- Correr `direnv allow` para cargar la configuración.

### Cifrado de Archivos con SOPS:
- Crear un archivo de valores sensibles, en este ejemplo, usamos `secrets.dec.yaml`.
- Cifrar este archivo con SOPS, dandole un nombre descriptivo: `sops -e secrets.dec.yaml > secrets.enc.yaml`.
- En estos ejemplos, `.dec` nos indica el archivo descifrado, y `.enc` el archivo cifrado.
- Agregar el archivo `secrets.dec.yaml` a nuestro `.gitignore` para que no se versione por git (en nuestro ejemplo se versiona para facilitar el uso y el ejemplo).

### Uso de Terraform con "sops_file":
- Desde un archivo de Terraform `.tf`, hacer referencia al recurso "sops_file" para traer los valores de `secrets.enc.yaml`.
- Usar los valores descifrados en los recursos necesarios, con `data.sops_file` (ver ejemplo en repo de demo).

### Aplicación con Terraform:
- Inicializar Terraform con `terraform init`.
- Verificar los cambios con `terraform plan`.
- Aplicar los cambios con `terraform apply`. Para aplicar cambios específicos, se puede usar el flag `-target` seguido del recurso deseado.

---

* Se puede ver un ejemplo de como crear la clave KMS y configurar el rol IAM en el subdirectorio del repositorio de ejemplo en el subdirectorio “aws_kms_iam_config”. Se encontrarán con un ejemplo para hacerlo con Terraform, e instructivos para hacerlo a través de la consola.
