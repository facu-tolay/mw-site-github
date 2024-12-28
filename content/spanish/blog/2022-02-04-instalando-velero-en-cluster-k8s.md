---
title: "Instalando velero en kubernetes sobre vSphere"
date: 2022-02-04T11:56:58-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/velero-01.webp"
# post author
author: "Matias Gudin"
# taxonomies
categories: ["DevSecOps"]
tags: ["velero", "vsphere","vmware","kubernetes", "backups"]
# meta description
description: "Cómo desplegar velero en un cluster kubernetes sobre VMware/vSphere"
# save as draft
draft: false
---

[Velero](https://velero.netlify.app/docs/v1.8/index.html) que es una herramienta
open source que nos permite realizar backups de objetos kubernetes en conjunto
con snapshots de los volúmenes que estos utilizan. Es una herramienta muy útil
utilizada para restauración en caso de pérdida, para replicar ambientes de 
trabajo en otros clusters como así también para migrar clusters.

En este post vamos a hacer una breve introducción a sus componentes y su
funcionamiento para luego instalarlo en un cluster kubernetes desplegado sobre
`VMware/vSphere`. 

Comencemos...

# ¿Cómo funciona velero?

Velero consiste en un servidor instalado en el cluster y un cliente que se
ejecuta en forma local mediante la linea de comandos.

Al ejecutar un comando en nuestras computadoras se crea un 
[CRD](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)
en el cluster que representa la operación pedida. Este CRD es observado por un
controller que lo reconoce y ejecuta las acciones necesarias para completar la 
tarea.

Tomemos el caso de un backup:

1. El usuario ejecuta `velero backup create my-first-backup`
2. Se crea el CRD `backups.velero.io` en el cluster.
3. El controller lo ve y pide al api server cada objeto a resguardar.
4. El controller genera archivos .tar.gz que envia a un object store.

> En caso de que existan volúmenes, se pueden crear snapshots de los mismos de 
> forma que al ser restaurados estos tengan el mismo estado que cuando fueron
> resguardados.

Velero se apoya en un sistema de plugins para su funcionamiento. Estos plugins
se encargan de interactuar tanto con el object store como con la infraestructura
subyacente para el manejo de discos.

# Instalación

## Cliente

Instalar el cliente de velero es tan sencillo como bajar 
[un binario](https://github.com/vmware-tanzu/velero/releases) y agregarlo a
nuestro path.

## Servidor

Primero tenemos que determinar que provider vamos a utilizar. En este caso
trabajaremos sobre un cluster en `VMware/vSphere` por lo que utilizaremos
[velero-plugin-for-vsphere](https://github.com/vmware-tanzu/velero-plugin-for-vsphere).
 
> En caso de trabajar sobre otra infraestructura podemos ver el
> [listado de providers](https://velero.netlify.app/docs/v1.8/supported-providers/)
> de velero donde se detallan sus funcionalidades.

Este provider no cuenta con un `object store` propio por lo que antes de instalar
el servidor hemos instalado [MiniO](https://min.io/), un `object store` open
source compatible con S3. Su instalación es muy sencilla y se puede realizar
mediante helm con el 
[siguiente chart](https://github.com/minio/minio/tree/master/helm/minio).

Teniendo disponible el `object store` que utilizara velero debemos configurar el
cluster para que funcione con el provider, quien se encargara de interactuar con
vSphere.

### Plugin de velero para vSphere

Este plugin se encarga de manejar los snapshots de volúmenes en vSphere, de 
forma tal que en nuestros backups no se guardan datos de los volúmenes sino 
referencias a los snapshots almacenados en el datacenter.

Para que este plugin funcione **se deben cumplir** los siguientes requisitos:

- Se debe tener abierto el puerto `902` en cada host que albergue a los nodos del
  cluster kubernetes.

- Se debe contar con un usuario con los permisos relativos CSI driver de
  vSphere. Estos se pueden consultar
[aquí](https://docs.vmware.com/en/VMware-vSphere-Container-Storage-Plug-in/2.0/vmware-vsphere-csp-getting-started/GUID-043ACF65-9E0B-475C-A507-BBBE2579AA58.html)

- El usuario anterior debe contar tambien con los permisos relativos a VDDK.
  Estos permisos pueden consultarse
  [aquí](https://developer.vmware.com/docs/11750/virtual-disk-development-kit-programming-guide/GUID-8301C6CF-37C2-42CC-B4C5-BB1DD28F79C9.html)  y deben ser aplicados a nivel de **vCenter con propagacion**.
  > En caso de no contar con estos permisos configurados correctamente nos
  > encontraremos con errores 3014 (falta de autorización) y no podremos bajar
  > ni borrar snapshots.

Una que cumplimos estos requisitos, debemos agregar dos objetos que se utilizan
para configurar el plugin:

1. Creamos un secreto que contiene las credenciales de acceso del usuario 
mencionado previamente, el vCenter y el id del cluster sobre el que se trabaja. 
Para ello creamos un archivo de configuración y luego el secreto de la siguiente
manera:

```sh
  # csi-vsphere.conf
  [Global]
  cluster-id="my-cluster"

  [VirtualCenter "<ip-vcenter>"]
  user = "<usuario>"
  password = "<password>"
```

```sh
  kubectl -n velero create secret generic --from-file csi-vsphere.conf
```
2. Creamos un  configmap en donde establecemos el tipo de cluster, el nombre del
   secreto creado en el paso anterior y el namespace de dicho secreto.

```sh
  cat <<EOF | kubectl -n <velero-namespace> apply -f -
  apiVersion: v1
  kind: ConfigMap
  metadata:
  name: velero-vsphere-plugin-config
  data:
  cluster_flavor: VANILLA
  vsphere_secret_name: velero-vsphere-config-secret
  vsphere_secret_namespace: velero
  EOF
```

## Instalación de velero

Para instalar velero en el cluster nos valemos de su
[chart oficial](https://vmware-tanzu.github.io/helm-charts/). 

Primero agregamos el repositorio:

```sh
  helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts
```

Y creamos el archivo de valores que aplicaremos al chart, a modo de ejemplo
vemos el siguiente archivo:

```yaml
# values.yaml
velero:
initContainers:
  - name: velero-plugin-for-aws
    image: velero/velero-plugin-for-aws:v1.1.0
    imagePullPolicy: IfNotPresent
    volumeMounts:
      - mountPath: /target
        name: plugins
  - name: velero-plugin-for-vsphere
    image: vsphereveleroplugin/velero-plugin-for-vsphere:v1.3.0
    imagePullPolicy: IfNotPresent
    volumeMounts:
      - mountPath: /target
        name: plugins
configuration:
  provider: aws
  backupStorageLocation:
    bucket: <nombre_bucket>
    config:
      region: minio
      s3ForcePathStyle: true
      s3Url: <url_de_minio>
  volumeSnapshotLocation:
    name: vsphere-volumes 
    provider: vsphere

serviceAccount:
  server:
    name: velero

snapshotEnabled: true

credentials:
  useSecret: true
  name: cloud-credentials
  secretContents:
    cloud: |
      [default]
      aws_access_key_id = <key_minio>
      aws_secret_access_key = <access_key_minio>

deployRestic: true
```
> Más información acerca de los valores de este chart puede verse 
> [aquí](https://github.com/vmware-tanzu/helm-charts/blob/main/charts/velero/values.yaml)

Este archivo configura lo siguiente:
- Utiliza el plugin de AWS para interactuar con un `object store`. Ya que 
  contamos con un MiniO el cual es compatible con S3.
- Configuramos el  plugin de vsphere para realizar los snapshots de volúmenes.
- Configura las credenciales para interactuar con minio.
- Habilitamos la creación de snapshots.
- Despliega soporte para restic.


Una vez que tenemos creado el archivo de valores instalamos velero ejecutando:

```sh
  helm install velero vmware-tanzu/velero --namespace <velero-namespace> \
    --create-namespace \
    -f values.yaml
```

Una vez que finaliza la instalación y todos los pods se encuentran corriendo ya
estamos en condiciones de comenzar a trabajar con velero.

En los próximos posts realizaremos backups de nuestros objetos, simularemos la
pérdida de los mismos y restauraremos el cluster al estado previo.
