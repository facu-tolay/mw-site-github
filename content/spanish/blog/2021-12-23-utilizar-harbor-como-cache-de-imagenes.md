---
title: "Utilizar Harbor como cache de imágenes"
date: 2021-12-23T11:47:55-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/harbor.webp"
# post author
author: "Juan Pablo Sánchez Magariños"
# taxonomies
categories: ["DevSecOps"]
tags: ["harbor", "traefik", "dex", "docker-compose", "registry-mirror", "cache", "images"]
# meta description
description: "Cómo y dónde instalar harbor para usarlo como cache de imágenes"
# save as draft
draft: false
---

Es común encontrarse con equipos que utilizan, por ejemplo, runners de GitLab y
ejecutan pipelines con mucha frecuencia. De esta manera descargan diferentes
imágenes de contenedores, pero puede suceder que alcancen el
[limite de pull de imágenes](https://www.docker.com/pricing).

Ahí es donde entra en juego [Harbor](https://goharbor.io/), una herramienta de
código abierto que, entre muchas otras cosas, permite almacenar imágenes de
contenedores en una *registry*. Así la primera vez que se descargue una imagen
de alguna otra registry, por ejemplo [Docker Hub](https://hub.docker.com/), se
almacenará en la registry de Harbor y luego, cuando se requiera de la misma, se
utilizará desde allí en lugar de descargarla nuevamente.

### Instalación

Una decisión que surge en esta situación es *dónde* instalar Harbor. En este
caso, contamos con un cluster de k8s donde se podría instalar fácilmente,
existen [charts](https://github.com/goharbor/harbor-helm)
que simplifican enormemente el proceso.

Pero, particularmente, nuestro cluster utiliza como almacenamiento un *bucket* (Amazon
S3) y, por lo tanto, resultaría muy costoso almacenar allí imágenes de
contenedores.

Por otro lado, ¿qué sucede ante una caída de los servicios del cluster? Si no
están disponibles los servicios del cluster, no sería accesible la registry de
Harbor. Y, si no funciona Harbor, podría no ser posible descargar imágenes y por
lo tanto no se podrían ejecutar los contenedores que a fin de cuentas *son* el
cluster.

Entonces, si no funciona el cluster, no hay Harbor, y si no hay harbor no hay
cluster. Estamos ante una posible situación de *deadlock*, o en criollo, un
*problema del huevo y la gallina*.

Es por eso que resolvimos instalarlo **fuera del cluster** existente, de manera
convencional, para lo que fué necesario crear uan máquina virtual que cumpla con
los [requisitos de Harbor](https://goharbor.io/docs/2.4.0/install-config/installation-prereqs/)

Una vez que se dispone de la plataforma, se puede instalar el servidor de
harbor, siguiendo los pasos de la
[documentación Oficial](https://goharbor.io/docs/2.4.0/install-config/).

En resumen se debe renombrar el archivo `harbor.yaml.tmpl` a `harbor.yaml` y
configurar los valores que allí se encuentran. Principalmente se debe comentar
la configuración `https`, cambiar el puerto `http` (mas adelante veremos por
qué), elegir contraseñas para harbor y para la base de datos, establecer la url
y donde se guardarán los datos (imágenes) indicando el path en `data_volume`.
Por ejemplo:

```yaml
hostname: harbor-cache.example.com
http:
  port: 8080
# https:
  # https port for harbor, default is 443
  # port: 6443
  ...
external_url: harbor-cache.example.com
harbor_admin_password: Harbor12345
database:
  password: root123
  ...
data_volume: /data
```

> **Notas**:
>
> * A tener en cuenta, Harbor asume que se ejecutará como `root`  el servicio,
>   lo cual es muy desaconsejable. Admite un usuario no privilegiado llamado
>   `harbor`, pero **es muy importante** que el mismo tenga un `UID = 10000`,
>   dado que este valor se encuentra *hardcodeado* en la configuración de los
>   servicios. También es necesario cambiar el ownership de algunos de estos
>   archivos:
>
>   * `common/config/core/env`
>   * `common/config/registryctl/env`
>   * `common/config/db/env`
>   * `common/config/jobservice/env`
>
> * Es posible versionar esta instalación utilizando *gitops*, dado que
>   al finalizar los pasos antes mencionados, se dispone de un archivo `docker-compose.yml`
>   que es todo lo que necesitamos para el despliegue. Versionando este archivo en
>   git, podremos mantener una copia de seguridad de la instalación.
>
> * También es posible utilizar [Ansible](https://www.ansible.com/) para automatizar
>   toda la configuración de la VM donde se hosteará el servidor de harbor, incluyendo
>   la descarga del repositorio con la configuración de harbor.

### Configuración de Harbor

Algunas configuraciones no pueden realizarse automáticamente. Es por eso que una
vez que esté corriendo el servicio de harbor se debe acceder a la UI para
realizar algunas configuraciones de forma manual.

#### Registries

Nombraremos algunas de las registries más utilizadas para luego utilizarlas en
los *proyectos* como *proxy-caché*:

| provider | name | endpointUrl |
| --- | --- | --- |
| Docker Hub      | docker_hub  |  `https://hub.docker.com`  |
| Docker Registry | gcr.io      |  `https://gcr.io`          |
| Docker Registry | k8s.gcr.io  |  `https://k8s.gcr.io`      |
| Docker Registry | quay.io     |  `https://quay.io`         |

#### Proyectos

En los proyectos de Harbor, se pueden crear registries, y asociarlas a un
proxy-caché definido previamente. Por ejemplo:

| projectName | accessLevel | storageQuota | proxyCache |
| --- | --- | --- | --- |
| proxy.docker.io   | Public | -1 | `docker_hub-https://hub.docker.com` |
| proxy.gcr.io      | Public | -1 | `gcr.io-https://gcr.io`             |
| proxy.k8s.gcr.io  | Public | -1 | `k8s.gcr.io-https://k8s.gcr.io`     |
| proxy.quay.io     | Public | -1 | `quay.io-https://quay.io`           |

#### Autenticación con AD (via dex)

Se pueden configurar varios métodos de autenticación desde el menú Configuración
en la UI de Harbor. En este caso, se utilizará AD mediante
[dex](https://dexidp.io/),
un servicio que se encuentra actualmente en el cluster. Primero se agrega un
cliente en la configuración de dex:

```yaml
config:
  ...
  staticClients:
  ...
  - id: harbor-cache-oidc-dex
    name: Harbor Cache
    redirectURIs:
    - https://harbor-cache.example.com/c/oidc/callback
    secret: <generar-secret>
...
```

> Esta configuración corresponde a un archivo de valores utilizado con
> [helmfile](https://github.com/roboll/helmfile),
> una forma de desplegar charts de Helm, particularmente el
> [chart de dex](https://github.com/dexidp/helm-charts/tree/master/charts/dex).
> El secret se puede generar aleatoreamente con
> `openssl rand -base64 20`

Luego en la UI, agregar la configuración acorde:

| | |
|---|---|
| Auth Mode             | `OIDC`                                  |
| OIDC Provider Name    | `dex`                                   |
| OIDC Endpoint         | `https://dex.example.com`  |
| OIDC Client ID        | `harbor-cache-oidc-dex`                 |
| OIDC Client Secret    | `<secret-generado-anteriormente>`       |
| Group Claim Name      | `groups`                                |
| OIDC Admin Group      | `cluster_admins`                  |
| OIDC Scope            | `openid,profile,email,groups`           |
| Verify Certificate    | [x]                                     |
| Automatic onboarding  | [ ]                                   |
| Username Claim        | ______                                  |

De esta forma los usuarios pertenecientes al grupo `cluster_admins`
obtendrán permisos de administrador.

### Certificados

En el caso de haber utilizado un certificado autofirmado habrá que configurar
todos los clientes que quieran interactuar con nuestro registry de la siguiente
manera (asumiendo que utilizan docker):

```console
# Bajar certificado
sudo openssl s_client -showcerts -connect harbor-cache.example.com:443 < /dev/null | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' > ca.crt

# Ubicarlo en la configuración de docker
sudo mkdir -p /etc/docker/certs.d/harbor-cache.example.com/
sudo mv ca.crt /etc/docker/certs.d/harbor-cache.example.com/ca.crt

# Reiniciar docker
sudo systemctl daemon-reload
sudo systemctl restart docker

# Loguearse a la registry
docker login harbor-cache.example.com -u admin -p Harbor12345 
```

También habría que declarar el certificado y la key en la sección `https` del
archivo `harbor.yaml`

Una mejor opción es utilizar [Traefik](https://traefik.io/) para para lo cual
se puede agregar un servicio en el `docker-compose.yml`:

```yaml
  traefik:
    image: traefik:${VERSION}
    container_name: traefik
    restart: ${RESTART}
    command: 
      - --api.insecure=true 
      - --providers.docker=true 
      - --providers.docker.exposedbydefault=false 
      - --log.level=${LOG}
      - --entrypoints.http.address=:80 
      - --entrypoints.https.address=:443
      - --certificatesresolvers.${PROVIDER}.acme.dnschallenge=true
      - --certificatesresolvers.${PROVIDER}.acme.dnschallenge.provider=${PROVIDER}
      - --certificatesresolvers.${PROVIDER}.acme.dnschallenge.delayBeforeCheck=0
      - --certificatesresolvers.${PROVIDER}.acme.dnschallenge.resolvers=${RESOLVER}
      - --certificatesresolvers.${PROVIDER}.acme.email=${EMAIL}
      - --certificatesresolvers.${PROVIDER}.acme.storage=/certs/acme.json
    environment: 
      - TZ
      - AWS_ACCESS_KEY_ID
      - AWS_REGION
      - AWS_SECRET_ACCESS_KEY
      - AWS_HOSTED_ZONE_ID
    ports:
      - "80:80"
      - "443:443"
      # Do not expose Traefik Dashboard
      # - "8089:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_certs:/certs
    networks:
      - harbor
```

Además, se debe agregar las siguientes *labels* en el servicio `proxy`:

```yaml
  proxy:
    ...
    labels:
      - "traefik.enable=true"
      # default route over https
      - "traefik.http.routers.harbor.rule=Host(`harbor-cache.example.com`)"
      - "traefik.http.routers.harbor.entrypoints=https"
      - "traefik.http.routers.harbor.tls.certresolver=${PROVIDER}"
      # HTTP to HTTPS
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
      - "traefik.http.routers.harbor-redirs.rule=hostregexp(`{host:.+}`)"
      - "traefik.http.routers.harbor-redirs.entrypoints=http"
      - "traefik.http.routers.harbor-redirs.middlewares=redirect-to-https"
```

Es una buena idea manejar todas estas variables de entorno utilizando
[Direnv](https://direnv.net/).

```env
# Global
export \
TZ=America/Argentina \
RESTART=unless-stopped \

# Traefik
export \
VERSION=v2.5 \
LOG=INFO \

# ACME DNS-01 challenge
export \
PROVIDER=route53 \
RESOLVER=8.8.8.8:53 \
EMAIL=juan.sanchez@mikroways.com \

# AWS Route53
export \
AWS_ACCESS_KEY_ID=AK.... \
AWS_REGION=us-east-1 \
AWS_SECRET_ACCESS_KEY=5HC.... \
AWS_HOSTED_ZONE_ID=Z3... \
```

Los valores de estas variables se obtienen al tramitar el certificado de
[Let's Encrypt](https://letsencrypt.org/).

### Iniciar o detener el servicio

Si accedemos por ssh a la instancia donde hemos instalado Harbor, podemos
realizar las siguientes acciones básicas:

```console
# Acceder a la carpeta raíz de harbor
harbor@ar-harbor-01:~$ cd /opt/harbor/
direnv: error /opt/harbor/.envrc is blocked. Run `direnv allow` to approve its content

# Habilitar direnv para cargar las variables de entorno
harbor@ar-harbor-01:/opt/harbor$ direnv allow
direnv: loading /opt/harbor/.envrc
direnv: export +AWS_ACCESS_KEY_ID +AWS_HOSTED_ZONE_ID +AWS_REGION +AWS_SECRET_ACCESS_KEY +EMAIL +LOG +PROVIDER +RESOLVER +RESTART +TZ +VERSION ~PATH

# Iniciar los servicios con docker-compose
harbor@ar-harbor-01:/opt/harbor$ docker-compose up -d
Creating volume "harbor_traefik_certs" with default driver
Recreating traefik     ... done
Starting harbor-log ... done
Starting harbor-db     ... done
Starting redis         ... done
Starting registry      ... done
Starting harbor-portal ... done
Starting registryctl   ... done
Starting harbor-core   ... done
Starting nginx             ... done
Starting harbor-jobservice ... done

# Verificar el estado de los contenedores
harbor@ar-harbor-01:/opt/harbor$ docker-compose ps
      Name                     Command                  State                                 Ports
------------------------------------------------------------------------------------------------------------------------------
harbor-core         /harbor/entrypoint.sh            Up (healthy)
harbor-db           /docker-entrypoint.sh 96 13      Up (healthy)
harbor-jobservice   /harbor/entrypoint.sh            Up (healthy)
harbor-log          /bin/sh -c /usr/local/bin/ ...   Up (healthy)   127.0.0.1:1514->10514/tcp
harbor-portal       nginx -g daemon off;             Up (healthy)
nginx               nginx -g daemon off;             Up (healthy)   0.0.0.0:8080->8080/tcp,:::8080->8080/tcp
redis               redis-server /etc/redis.conf     Up (healthy)
registry            /home/harbor/entrypoint.sh       Up (healthy)
registryctl         /home/harbor/start.sh            Up (healthy)
traefik             /entrypoint.sh --api.insec ...   Up             0.0.0.0:443->443/tcp,:::443->443/tcp,
                                                                    0.0.0.0:80->80/tcp,:::80->80/tcp
# Detener el servicio
docker-compose down
```

> **Nota:** si se apaga el servicio utilizando la opción `-v` o `--volumes`, se
> eliminaran los volúmenes, por lo que se borrarán también los certificados
> generados, habrá que regenerarlos y esto puede ocasionar problemas si se hace
> varias veces seguidas.
>
> Sin embargo, se puede limpiar el espacio utilizado luego de haber reiniciado
> los servicios. Para ello, MIENTRAS esté corriendo el servicio correr el
> comando `docker system prune --volumes`.
> Este comando elimina los contenedores detenidos junto con las imágenes, redes
> y volúmenes asociados a estos. Si nuestros servicios se encuentran corriendo
> no se eliminará nada importante.

Resta configurar el cluster existente para que utilice el cache de imágenes.
Esto será diferente según el
[*container runtime*](https://kubernetes.io/docs/setup/production-environment/container-runtimes/)
que se utilice, lo cual veremos en el
[siguiente artículo]({{< ref "/blog/2021-12-29-crio-con-harbor" >}}).
