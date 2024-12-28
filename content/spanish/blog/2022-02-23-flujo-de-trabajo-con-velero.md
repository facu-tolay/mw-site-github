---
title: "Backups y Restores con velero"
date: 2022-02-23T11:56:58-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/velero-02.webp"
# post author
author: "Matias Gudin"
# taxonomies
categories: ["DevSecOps"]
tags: ["velero", "vsphere", "backup", "restore", "vmware"]
# meta description
description: "Trabajando con velero en k8s"
---

En el post anterior instalamos
[velero en un cluster sobre vSphere]({{<ref "blog/2022-02-04-instalando-velero-en-cluster-k8s">}}). 

En este post nos vamos a adentrar al flujo de trabajo con velero creando un
backup, borrando los objetos y restaurándolos a su estado previo.

Comencemos...

# Trabajando con velero

Como se mencionaba previamente, velero sirve para realizar backups de nuestros
objetos kubernetes y adicionalmente nos permite realizar snapshots de los 
volúmenes asociados. De esta forma podemos restaurar completamente el cluster a
un estado previo.

## Preparación del ambiente

Para demostrar su funcionamiento vamos a crear un pod el cual utiliza un pvc, 
con el siguiente manifiesto:

```yaml
  # nginx-pod.yaml
  ---
  apiVersion: v1
  kind: Namespace
  metadata:
    name: nginx-example
    labels:
      app: nginx

  ---
  kind: PersistentVolumeClaim
  apiVersion: v1
  metadata:
    name: nginx-logs
    namespace: nginx-example
    labels:
      app: nginx
  spec:
    accessModes:
      - ReadWriteOnce
    resources:
      requests:
        storage: 50Mi

  ---
  apiVersion: v1
  kind: Pod
  metadata:
    name: nginx-pod
    namespace: nginx-example
    labels:
      app: nginx
    annotations:
      pre.hook.backup.velero.io/container: fsfreeze
      pre.hook.backup.velero.io/command: '["/sbin/fsfreeze", "--freeze", "/var/log/nginx"]'
      post.hook.backup.velero.io/container: fsfreeze
      post.hook.backup.velero.io/command: '["/sbin/fsfreeze", "--unfreeze", "/var/log/nginx"]'
  spec:
    volumes:
      - name: nginx-logs
        persistentVolumeClaim:
          claimName: nginx-logs
    containers:
    - image: nginx:1.17.6
      name: nginx
      ports:
      - containerPort: 80
      volumeMounts:
        - mountPath: "/var/log/nginx"
          name: nginx-logs
          readOnly: false
    - image: ubuntu:bionic
      name: fsfreeze
      securityContext:
        privileged: true
      volumeMounts:
        - mountPath: "/var/log/nginx"
          name: nginx-logs
          readOnly: false
      command:
        - "/bin/bash"
        - "-c"
        - "sleep infinity"
```

Y lo aplicamos al cluster:

```sh
  $ kubectl apply -f nginx-pod.yaml
  namespace/nginx-example created
  persistentvolumeclaim/nginx-logs created
  pod/nginx-pod created 
```

Habiendo creado nuestros objetos vamos a crear un archivo en el volumen para
probar luego que tanto los snapshots como los objetos se restauran
correctamente. Para ello ejecutamos:

```sh
 $ kubectl -n nginx-example exec nginx-pod -- /bin/bash -c "echo 'just testing' > /var/log/nginx/test.txt"
```

## Realizando un backup

Realizar un backup en velero es tan sencillo como ejecutar `velero backup create
<nombre> [flags]`. Entonces:

```sh
  $ velero backup create my-first-bkp --include-namespaces nginx-example -w
  Backup request "my-first-bkp" submitted successfully.
  Waiting for backup to complete. You may safely press ctrl-c to stop waiting -
  your backup will continue in the background.
  .........
  Backup completed with status: Completed. You may check for more information
  using the commands `velero backup describe my-first-bkp` and `velero backup logs
  my-first-bkp`.
```
> Notar que estamos especificando el namespace que queremos resguardar mediante
> el parámetro `--include-namespaces <namespace>`.
> Podríamos utilizar un label, o no especificar nada y velero realizaria un 
> backup de todo el cluster.
> También podríamos especificar que elementos queremos resguardar mediante el 
> parámetro `--include-resources <recurso_1>,<recurso_2>....`.
> Para mas información: `velero backup --help`

Una vez que el comando finaliza vemos que el backup queda en estado `Completed`.
Esto implica que ya se subieron los manifiestos a minio y que se creo un
snapshot en vSphere el cual esta referenciado en el backup realizado.

Para obtener un detalle del backup realizado podemos ejecutar `velero backup 
describe my-first-backup --details`.

## Simulando pérdida de datos

En este paso vamos a simular que se produjo una perdida. Para ello borramos el
namespace que acabamos de resguardar.

```
  $ kubectl delete ns nginx-example
```

Una vez que se borren los objetos estamos en condiciones de restaurar el cluster
al estado anterior. Podemos verificar que ya no existe el namespace junto con el
correpondiente PVC y esto ha generado que el PV también sea eliminado.

## Restaurando un backup

Entonces es hora de restaurar lo perdido. Para ello utilizamos el comando
`velero restore create <nombre> --from-backup <nombre_backup> [flags]`
> Si el nombre es omitido se genera en forma automática uno siguiendo el patrón 
`<nombre_de_backup>-<timestamp>`.

```sh
  $ velero restore create my-first-restore --from-backup my-first-bkp -w
  Restore request "my-firs-restore" submitted successfully.
  Waiting for restore to complete. You may safely press ctrl-c to stop waiting -
  your restore will continue in the background.
  .............
  Restore completed with status: Completed. You may check for more information
  using the commands `velero restore describe my-firs-restore` and `velero restore
  logs my-firs-restore`.
```

Una vez que se completa la operación podemos ver que se ha creado nuevamente el
namespace, contiene el pod resguardado con su correpondiente PVC/PV en el estado
anterior.

```sh
  kubectl -n nginx-example  get po
  NAME        READY   STATUS    RESTARTS   AGE
  nginx-pod   2/2     Running   0          29s

  kubectl -n nginx-example exec nginx-pod -- cat /var/log/nginx/test.txt
  just testing
```

## Conclusión

Hemos visto como con dos simples comandos podemos realizar backups de los
objetos de nuestro cluster junto con su estado, tomando snapshots de los discos
que utilizaban.

Mas precisamente, datos que contiene nuestro pod se encuentran en un PV que se
mapea a un disco en vSphere al cual se le realizan snapshots de su contenido.

Entonces... Que sucede con aquellos volúmenes que no son persistentes o que no
se mapean a dispositivos de bloque en el hipervisor? Como podríamos restaurar
su contenido si no se genera el snapshot en vSphere? Estos temas seran abordados
en el siguiente post.

