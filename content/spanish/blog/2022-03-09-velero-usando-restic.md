---
title: "Backups en velero utilizando restic"
date: 2022-03-09T11:56:58-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/velero-03.webp"
# post author
author: "Matias Gudin"
# taxonomies
categories: ["DevSecOps"]
tags: ["velero", "vsphere", "vmware", "kubernetes", "restic"]
# meta description
description: "Resguardando volúmenes utilizando restic"
draft: true
---

En el [post anterior]({{<ref "/blog/2022-02-23-flujo-de-trabajo-con-velero">}}). 
simulamos la pérdida de datos en nuestro cluster y
procedimos a restaurarlo a partir de un backup utilizando el
`velero-plugin-for-vsphere`.

¿Pero qué sucede cuando los volúmenes no son persistentes o bien no son
manejados por el hipervisor como dispositivos de bloques?

## Restic

Hasta ahora hemos utilizado velero junto con el plugin
`velero-plugin-for-vsphere` para realizar backups de los objetos y sus datos en
nuestro cluster. Estos objetos contenían volúmenes persistentes que representaban
un disco en el hipervisor.

Entonces, ¿podemos resguardar un volumen que no es persistente, como un
`emptyDir`?

Tal vez haya pasado desapercibido, pero a la hora de instalar velero 
especificamos que se despliegue con soporte para restic. Esto es lo que
utilizaremos para guardar los snapshots de aquellos volúmenes que no son
persistentes.

A la hora de realizar backups con restic, velero provee dos estrategias:

* `opt-out` en donde se utiliza restic para todos los volúmenes. En caso de
  querer utilizar otro método debe anotarse explícitamente que volumen **no**
  debe ser resguardado con restic. Esto se hace utilizando la anotación
  `backup.velero.io/backup-volumes-exclude: <volume_1>,<volume_2>...`

* `opt-in` es la estrategia **por defecto** y al contrario del anterior, se
  debe especificar que volúmenes se deben resguardar con restic mediante la 
  anotación `backup.velero.io/backup-volumes: <volume_1>,<volume_2>`.

Entonces teniendo habilitado restic utilizarlo para resguardar los volúmenes es
tan sencillo como agregar la anotación correspondiente.


## Preparación del ambiente

Continuando con el ejemplo del
[post anterior]({{<ref "/blog/2022-02-23-flujo-de-trabajo-con-velero">}}), vamos
a agregar un nuevo volumen de tipo `emptyDir` para utilizar restic. Modificamos 
el pod `nginx-pod` para agregar este volumen:

```yaml
  # nginx-pod.yaml
  (...) 

  apiVersion: v1
  kind: Pod
  metadata:
    (...)
    annotations:
      (...)
      backup.velero.io/backup-volumes: test-restic
  spec:
    volumes:
      - name: nginx-logs
        persistentVolumeClaim:
          claimName: nginx-logs
      - name: test-restic
        emptyDir: {}
    containers:
    - image: nginx:1.17.6
      (...)
      volumeMounts:
        - mountPath: "/var/log/nginx"
          name: nginx-logs
          readOnly: false
        - mountPath: "/restic"
          name: test-restic
    - image: ubuntu:bionic
      (...)
```

Nótese que agregamos el volumen de tipo `emptyDir`, lo montamos en el directorio
`/restic` y lo anotamos para que se resguarde utilizando restic.


Ahora creamos los objetos y  agregamos un archivo en cada volumen. Esto nos 
servirá para confirmar que el backup se ha realizado correctamente:

```sh
  $ kubectl apply -f nginx_pod.yaml 
  $ kubectl -n nginx-example exec nginx-pod -- /bin/bash -c "echo 'Testing pv' > /var/log/nginx/test.txt && echo 'Teting restic' > /restic/test.txt"
```

Una vez hecho esto estamos en condiciones de generar un backup, que utilizara
snapshots de volúmenes de vSphere y snapshots en restic. 

## Backup utilizando restic

Creamos el backup de igual manera que hicimos anteriormente. Notemos que como el
backup via restic se maneja con anotaciones del pod lo único que cambiamos es
el nombre del backup:

```sh
  $ velero backup create my-restic-bkp --include-namespaces nginx-example
```

Esperamos que el backup finalice y una vez que lo ha hecho sin errores estamos en
condiciones de restaurarlo.

## Simulando pérdida de datos

Antes de restaurar el backup vamos a simular una perdida borrando el namespace
creado anteriormente:

```sh
  $ kubectl delete ns nginx-example
```

Una vez que finaliza el borrado avanzamos a la restauración del cluster a su
estado previo.

## Restaurando el backup

Habiendo perdido los objetos, vamos a restaurar el ultimo backup creado en
similar manera a la que hicimos previamente:

```sh
  $ velero restore create my-restic-restore --from-backup my-restic-bkp -w
```

Una vez que finaliza podemos confirmar que la restauración funciono como
esperábamos viendo que el namespace existe, que el pod existe, se encuentra
corriendo y que los volúmenes contienen los datos que creamos:

```sh
  $ kubectl -n nginx-example get po
  NAME        READY   STATUS    RESTARTS   AGE
  nginx-pod   2/2     Running   0          5m27s

  $ kubectl exec nginx-pod -c nginx -- /bin/bash -c "cat /var/log/nginx/test.txt && cat /restic/test.txt"
  Testing pv
  Teting restic
```

## Conclusiones

Hasta aquí hemos 
[instalado velero en un cluster sobre vSphere]({{<ref "/blog/2022-02-04-instalando-velero-en-cluster-k8s">}}),
,
[creado y restaurado backups con snapshots de vSphere]({{<ref "/blog/2022-02-23-flujo-de-trabajo-con-velero">}}),
y utilizado restic en conjunto para resguardar otros tipo de volúmenes.

Velero resulta una herramienta muy versátil para migrar ambientes de trabajo, o 
para asegurar que ante un hecho no deseado como la perdida de datos podamos 
recuperarnos.
