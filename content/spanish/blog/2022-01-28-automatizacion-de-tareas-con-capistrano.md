---
title: "Automatización de tareas con Capistrano"
date: 2022-01-28T11:06:24-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/ruby.webp"
# post author
author: "Macarena Poisson"
# taxonomies
categories: ["DevSecOps"]
tags: ["capistrano", "automatización"]
# meta description
description: "Capistrano como herramienta para la automatización de tareas"
# save as draft
draft: false
---

Capistrano es una herramienta para automatizar tareas en servidores remotos, tales como la automatización de tareas de auditoría, la definición de workflows mediante ssh, entre otras.
En este caso, nos enfocaremos en el despliegue a un servidor remoto.

### Instalación

Al estar implementado en Ruby, es posible instalar Capistrano como una gema del lenguaje. Se puede conocer más sobre las distintas formas de instalación siguiendo la [documentación oficial](https://capistranorb.com/documentation/getting-started/installation/).

Es importante notar que, a pesar de ser una gema de Ruby, Capistrano puede adaptarse al despliegue de cualquier aplicación, sin importar su lenguaje de programación. Además, es posible extender las tareas propias de la herramienta para brindar soporte a cualquier requerimiento del lenguaje o framework utilizado.

### Tareas

El enfoque que utiliza Capistrano es el de dividir el proceso en distintas tareas, las cuales, a su vez, son divididas en etapas o subtareas variando según el ambiente de despliegue. Estas tareas pueden ser las predefinidas de la herramienta o pueden ser las definidas por el usuario de la misma. Esto nos brinda flexibilidad al momento de definir el proceso de despliegue, ajustándose así a las necesidades específicas de cada sistema.

Para conocer más sobre las tareas predefinidas, es posible ejecutar `cap -T -A` para obtener un listado completo de las mismas. Por ejemplo, dentro de la tarea **deploy**, es decir, en el **_namespace_** de la tarea deploy, se encuentran las subtareas:

- **deploy:starting**: inicializa el despliegue, se asegura que todo este listo.
- **deploy:started**: inicializa el hook (para tareas personalizadas)
- **deploy:updating**: actualiza el/los servidor/es con una nueva release
- **deploy:updated**: actualiza el hook
- **deploy:publishing**: publica la nueva release
- **deploy:published**: publica el hook
- **deploy:finishing**: termina el despliegue, limpia todo
- **deploy:finished**: termina el hook
- Entre otras

Como podemos observar, existe una subtarea por cada etapa del proceso de despliegue. Podemos utilizar esto para definir tareas específicas que se ejecuten antes o después de cada uno de estos estados por medio del uso de hooks.

Por ejemplo, supongamos el caso en el que necesitamos copiar un archivo de un directorio al otro justo antes de que termine el despliegue. Como mencionamos anteriormente, sabemos que existe el estado _“finishing”_ dentro del namespace de la tarea deploy y que podemos definir nuestra propia tarea después de que pase dicho estado. Es por esto que nuestra tarea podría verse de la siguiente manera:

```ruby
 namespace :deploy do
   after :finishing, :upload do
     on roles(:app) do
       path = "web/assets"
       upload! "themes/assets/style.css", "#{path}"
     end
   end
 end
```

Así como podemos definir esta tarea, Capistrano nos brinda un sinfín de posibles personalizaciones de nuestro sistema.

### Roles

En la sección anterior pudimos ver que es posible definir tareas según lo necesitemos por cada estado. Además, Capistrano nos brinda la posibilidad de dividir estas tareas filtrando por el rol que ocupan en nuestro sistema.
Supongamos el caso en el cual el proceso de despliegue de una aplicación web contiene tareas que no queremos replicar en el proceso de despliegue de una base de datos. Para esto, Capistrano provee lo que se conoce como _“filtrado por roles”_, el cual nos permite definir para qué roles se va a ejecutar cada tarea.

El primer paso es definir los roles:

```ruby
 role :app, %w{deploy@example.com}, my_property: :my_value
 role :web, %w{user1@primary.com user2@additional.com}, other_property: :other_value
 role :db,  %w{deploy@example.com}
```

Luego, especificamos dentro de la tarea en qué rol/roles se ejecutará. Siguiendo el ejemplo anterior:

```ruby
 namespace :deploy do
   after :finishing, :upload do
     on roles(:web) do
       path = "web/assets"
       upload! "themes/assets/style.css", "#{path}"
     end
     on roles(:db) do
       # Migrate database
     end
   end
 end
```

### Ambientes

En general, en el proceso de desarrollo de una aplicación contamos con distintos ambientes: production, staging, development, etc, y estos ambientes cuentan con distintas configuraciones. Es posible mantener esta división en Capistrano de la siguiente manera:

```sh
cap install STAGES=production,staging,development
```

Esto nos creará la estructura de directorios y archivos necesarios para configurar el despliegue, como se ve a continuación:

```sh
> cap install STAGES=production,staging,development
 mkdir -p config/deploy
 create config/deploy.rb
 create config/deploy/production.rb
 create config/deploy/staging.rb
 create config/deploy/development.rb
 mkdir -p lib/capistrano/tasks
 create Capfile
 Capified
```

Dentro del archivo `config/deploy.rb` estará la configuración base y compartida por todos los ambientes, mientras que en el directorio `config/deploy` se encuentran los archivos de configuración específica de cada ambiente. Cada uno de estos archivos contiene la documentación necesaria para ello.

La sintaxis para ejecutar una tarea en un ambiente específico es `cap <ambiente> <tarea [:subtarea]> `
Siguiendo el ejemplo anterior:

```sh
 cap staging deploy # Ejecutará todo el proceso de despliegue
 cap staging deploy:upload # Sólo ejecutará la tarea upload
```

### Despliegue

Al realizarse un despliegue, Capistrano creará una estructura de directorios específica en el servidor remoto para organizar el código fuente y otros datos relacionados con el mismo. Supongamos el caso en el que definimos la raíz de nuestro despliegue, con la variable `:deploy_to`, en `/var/www/my_app_name`. Una vez finalizado el despliegue, en nuestro servidor remoto se tendrá una estructura de directorios como la siguiente:

```console
├── current -> /var/www/my_app_name/releases/20220126141435/
├── releases
│   ├── 20220124110903
│   ├── 20220124151246
│   ├── 20220125101011
│   ├── 20220125140220
│   └── 20220126141435
├── repo
│   └── <datos del VCS>
├── revisions.log
└── shared
    └── <linked_files y linked_dirs>
```

- Releases es el directorio que contiene todos los despliegues en carpetas con el timestamp de cuando fueron creados
- Current es un link simbólico a la última release realizada. Este link es actualizado sólo si el despliegue terminó exitosamente, caso contrario se mantiene la anterior release.
- Repo es el directorio que contiene el sistema de control de versiones configurado, por ejemplo, git.
- Revisions.log es el archivo utilizado para almacenar los logs de los despliegues y rollbacks
- Shared es la carpeta que contiene todos los archivos y directorios que se desean mantener entre releases, es decir, que no se versionen de una release a otra. Esto se define por medio de las variables `linked_dirs` y `linked_files` en el archivo de configuración deploy.rb

#### linked_files

Si se desea mantener una misma versión de un archivo entre releases como, por ejemplo, configuraciones de la base de datos, es posible hacerlo por medio de linked_files. Dentro de nuestras releases esos archivos serán links simbólicos a los archivos almacenados en el directorio shared del servidor remoto.
La forma de configurar esto es

```ruby
 append :linked_files, "config/database.yaml"
 set :local_base_dir, "shared-configurations"
```

Donde local_base_dir es el directorio local donde Capistrano buscará por un archivo cuyo path tenga el patrón `config/database.<ambiente>.yaml` para luego subirlo en el servidor como config/database.yaml. Esto nos permite tener distintos archivos de configuración por ambiente de forma transparente.

### Releases y rollback

Dado que Capistrano mantiene en el directorio releases todo el historial de despliegues, es muy sencillo volver a un estado anterior. Alcanza con ejecutar

```sh
 cap <ambiente> deploy:rollback
```

Para volver a la versión inmediata anterior o

```sh
 cap <ambiente> deploy:rollback ROLLBACK_RELEASE=release
```

Para volver a una versión específica anterior.

En cualquiera de los casos, se actualiza el link simbólico del directorio current y se crea un archivo de backup de la versión que estuvo activa antes del rollback.

### Conclusión

Hemos visto cómo utilizando Capistrano podemos automatizar nuestro proceso de despliegue de forma simple y flexible. En el siguiente post veremos cómo integrar esta automatización con GitLab CI
