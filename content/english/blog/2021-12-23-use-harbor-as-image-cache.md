---
title: "Use Harbor as image cache repository"
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
description: "How (and where) to install Harbor as a cache for container images"
# save as draft
draft: false
---

It's common to come across teams using, for example, GitLab runners that run
pipelines very frequently. Doing this, it may happen that they reach the
[image pull limit](https://www.docker.com/pricing).

That's where [Harbor](https://goharbor.io/) comes in, an open source tool that,
among many other things, allows you to store container images in a *registry*.
The first time an image is downloaded from some other registry, for example
[Docker Hub](https://hub.docker.com/), will be stored in the Harbor registry and
then, when required, it will be you will use it from there instead of
downloading it again.

### Installation

One decision that comes up in this situation is *where* to install Harbor. In
this example, we have a k8s cluster where it could be easily installed, there
are [charts](https://github.com/goharbor/harbor-helm) exist that greatly
simplify the process.

But, our cluster in particular uses a *bucket* (Amazon S3) as storage and
therefore it would be very expensive for this use.

On the other hand, what happens in the event of a drop in cluster services? If
cluster services are not available, the Harbor registry would not be accessible.
And, if Harbor does not work, it might not be possible to download images and
therefore the containers that in the end *are* the cluster could not be executed.

So if the cluster does not work, there is no Harbor, and if there is no harbor
there is no cluster. We face a possible *deadlock* situation, a *chicken and egg
problem*.

That is why we decided to install it **outside the existing cluster**, for which
it was necessary to create a virtual machine that meets the
[Harbor requirements](https://goharbor.io/docs/2.4.0/install-config/installation-prereqs/)

Once this platform is available, the harbor server can be installed, following
the [Official Documentation](https://goharbor.io/docs/2.4.0/install-config/).

In summary, the file `harbor.yaml.tmpl` should be renamed to `harbor.yaml` and
then configure the values in it. Mainly the `https` configuration must be
commented out, the `http` port must be changed (later we will see why),
passwords for harbor and for the database should be chosen, set the url for the
app and where the data (images) will be saved indicating the path in
`data_volume`.
For example:

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

> **Notes**:
>
> * Please note, Harbor assumes that the service will run as `root`, which is
>   highly inadvisable. It supports a non-privileged user named `harbor`, but
>   **it is very important** that it has a `UID = 10000`, since this value is
>   *hardcoded* in the configuration of many services. It is also necessary to
>   change the ownership of some of these files:
>
>   * `common/config/core/env`
>   * `common/config/registryctl/env`
>   * `common/config/db/env`
>   * `common/config/jobservice/env`
>
> * It is possible to version this installation using *gitops*, since
>   the result of the aforementioned steps is a `docker-compose.yml` file
>   which is all we need for the deployment. Versioning this file in
>   git we can keep a backup copy of the installation.
>
> * It is also possible to use [Ansible](https://www.ansible.com/) to automate
>   all the configuration of the VM where the harbor server will be hosted,
>   including the repository download with the harbor configuration.

### Harbor Configuration

Some settings cannot be automated. That is why once the harbor service is
running, you must access the UI to make some manual configuration.

#### Registries

We will name some of the most used registries and then use them in
 *projects* as *proxy-cache*:

| provider | name | endpointUrl |
| --- | --- | --- |
| Docker Hub      | docker_hub  |  `https://hub.docker.com`  |
| Docker Registry | gcr.io      |  `https://gcr.io`          |
| Docker Registry | k8s.gcr.io  |  `https://k8s.gcr.io`      |
| Docker Registry | quay.io     |  `https://quay.io`         |

#### Projects

In Harbor projects, you can create registries, and associate them with a
predefined proxy-cache. For example:

| projectName | accessLevel | storageQuota | proxyCache |
| --- | --- | --- | --- |
| proxy.docker.io   | Public | -1 | `docker_hub-https://hub.docker.com` |
| proxy.gcr.io      | Public | -1 | `gcr.io-https://gcr.io`             |
| proxy.k8s.gcr.io  | Public | -1 | `k8s.gcr.io-https://k8s.gcr.io`     |
| proxy.quay.io     | Public | -1 | `quay.io-https://quay.io`           |

#### Authentication with AD (through dex)

Various authentication methods can be configured from the Settings menu in the
Harbor UI. In this case, AD will be used by [dex](https://dexidp.io/), a
service that is currently in our cluster. First we added a client in dex config:

```yaml
config:
  ...
  staticClients:
  ...
  - id: harbor-cache-oidc-dex
    name: Harbor Cache
    redirectURIs:
    - https://harbor-cache.example.com/c/oidc/callback
    secret: <generate-secret>
...
```

> This configuration corresponds to a values file used with
> [helmfile](https://github.com/roboll/helmfile),
> a way to deploy Helm charts, particularly the
> [dex chart](https://github.com/dexidp/helm-charts/tree/master/charts/dex).
> The secret can be randomly generated with
> `openssl rand -base64 20`

Then in the UI, apply this configuration:

| | |
|---|---|
| Auth Mode             | `OIDC`                                  |
| OIDC Provider Name    | `dex`                                   |
| OIDC Endpoint         | `https://dex.example.com`  |
| OIDC Client ID        | `harbor-cache-oidc-dex`                 |
| OIDC Client Secret    | `<previously-generated-secret>`         |
| Group Claim Name      | `groups`                                |
| OIDC Admin Group      | `cluster_admins`                  |
| OIDC Scope            | `openid,profile,email,groups`           |
| Verify Certificate    | [x]                                     |
| Automatic onboarding  | [ ]                                   |
| Username Claim        | ______                                  |

In this way the users belonging to the group `cluster_admins`
they will get administrator permissions.

### Certificates

In the case of having used a self-signed certificate, it will be necessary to
configure all clients who want to interact with our registry as follows
(assuming they use docker):

```console
# Download certificate
sudo openssl s_client -showcerts -connect harbor-cache.example.com:443 < /dev/null | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' > ca.crt

# Move it to docker configuration
sudo mkdir -p /etc/docker/certs.d/harbor-cache.example.com/
sudo mv ca.crt /etc/docker/certs.d/harbor-cache.example.com/ca.crt

# Restart docker
sudo systemctl daemon-reload
sudo systemctl restart docker

# Log in to the registry
docker login harbor-cache.example.com -u admin -p Harbor12345
```

You must also declare the certificate and the key in the `https` section of
the `harbor.yaml` file.

A better option is to use [Traefik](https://traefik.io/) for which
you can add a service in the `docker-compose.yml`:

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

In addition, the following *labels* must be added in the `proxy` service:

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

It is a good idea to handle all these environment variables using
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

This values are obtained when processing the
[Let's Encrypt](https://letsencrypt.org/) certificate.

### Starting or stopping the service

If we ssh to the instance where we have installed Harbor, we can
perform the following basic actions:

```console
# Access the harbor root folder
harbor@ar-harbor-01:~$ cd /opt/harbor/
direnv: error /opt/harbor/.envrc is blocked. Run `direnv allow` to approve its content

# Enable direnv to load environment variables
harbor@ar-harbor-01:/opt/harbor$ direnv allow
direnv: loading /opt/harbor/.envrc
direnv: export +AWS_ACCESS_KEY_ID +AWS_HOSTED_ZONE_ID +AWS_REGION +AWS_SECRET_ACCESS_KEY +EMAIL +LOG +PROVIDER +RESOLVER +RESTART +TZ +VERSION ~PATH

# Start services with docker-compose
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

# Check the condition of the containers
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
# Stop the service
docker-compose down
```

> **Note:** if the service is stopped using the `-v` or `--volumes` option,
> it will delete the volumes, so the certificates will also be deleted,
> having to be regenerated. This can cause problems if done several times in a
> row.
>
> However, the used space can be cleaned up. To do this, WHILE the service is
> running, use the `docker system prune --volumes` command.
> This command removes the stopped containers along with the images, networks
> and volumes associated with them. If our services are running nothing
> important will be removed.

It remains to configure the existing cluster to use the image cache.
This will be different depending on the
[*container runtime*](https://kubernetes.io/docs/setup/production-environment/container-runtimes/)
that is used, which we will see in the
[next article]({{< ref "/blog/2021-12-29-crio-with-harbor" >}}).
