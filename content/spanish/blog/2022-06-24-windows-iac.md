---
title: "Infraestructura como código para aprovisionar Windows"
date: 2022-06-24T10:06:58-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/windows-iac.webp"
# post author
author: "Christian Rodriguez"
# taxonomies
categories: ["Devsecops"]
tags: ["windows", "iac", "ansible", "terraform", "automatizacion"]
# meta description
description: "Cómo aprovisionar máquinas con Microsoft Windows utilizando
infraestructura como código"
draft: false
---

La automatización nos permite ser más eficientes pero también nos evita que
cometamos varios errores comunes, mejorando la calidad del software y de los
servicios. En este sentido, es muy habitual que al hablar de infraestructura
como código (IaC) lo asociemos al aprovisionamiento de máquinas con sistema
operativo Linux. Son numerosos los ejemplos que podemos encontrar sobre el uso
de herramientas tales como Puppet, Chef, Ansible y Packer en Linux. Sin embargo,
también es posible aprovisionar sistemas operativos Microsoft Windows. En este
post veremos, a través de ejemplos, cómo hacerlo.

Todos los ejemplos mostrados están a disposición en en el siguiente repositorio
en [GitHub](https://github.com/Mikroways/windows-packer-terraform-libvirt).

## ¿Qué vamos a mostrar?

Como siempre nos sucede cuando comenzamos con un problema de IaC, es
preguntarnos: __**¿tenemos un template?**__. ¿Y por qué nos preguntamos esto? Es
que si trabajamos con Vagrant, buscamos un [box](https://app.vagrantup.com/boxes/search),
idealmente oficial, que contenga una imagen base del sistema operativo que
deseamos. Si trabajamos con AWS, lo mismo haremos con la
[AMI](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/finding-an-ami.html).
Pero si trabajamos con [libvirt](https://libvirt.org/),
[ovirt](https://www.ovirt.org/), [VMWare
VSPhere](https://www.vmware.com/products/vsphere.html), incluso con [Openstack
Glance](https://docs.openstack.org/glance/latest/), puede que no tengamos
imágenes existentes que cumplan con nuestros requerimientos.

[Hashicorp](https://www.hashicorp.com/) ofrece [Packer](https://www.packer.io/),
una herramienta que nos permite crear imágenes idénticas, e incluso prepararlas
con determinadas características antes de proceder con su aprovisionamiento.
Podemos crear incluso, vagrant boxes y AMIs con este producto.

Por ello, nuestro primer paso será el uso de packer, para crear una imagen que
podremos usar posteriormente para iniciar una máquina virtual y aprovisionarla
usando IaC. Para hacer el ejemplo fácilmente  replicable, utilizaremos
[libvirt](https://libvirt.org/). Hay numerosas herramientas para interactuar con
libvirt: [virsh](https://www.libvirt.org/manpages/virsh.html),
[virt-manager](https://virt-manager.org/) o
[virt-viewer](https://gitlab.com/virt-viewer/virt-viewer). Sin embargo, **el
problema de todas estas herramientas, es que son de gestión manual**. Con
**Packer**, crearemos un template que luego usaremos con
[**Terraform**](https://www.terraform.io/) para iniciar una virtual
que tomará IP por DHCP. Al ser un windows, la configuración remota de la
instancia se realizará vía
**[winrm](https://docs.microsoft.com/en-us/windows/win32/winrm/portal)** o
**SSH**, que debe instalarse porque no es algo nativo en windows. Este último
aprovisionamiento lo realizaremos con [**Ansible**](https://www.ansible.com/).


## Creamos la imagen con Packer

Siguiendo las indicaciones en [nuestro
repositorio](https://github.com/Mikroways/windows-packer-terraform-libvirt),
procedemos a clonar otro repositorio que simplifica la  configuración de Packer.
Finalmente, al correr Packer usando la documentación, obtendremos una salida
como la siguiente:

{{< asciinema key="windows-iac/packer" rows="30" cols="800" preload="1" speed="150" >}}

> Si se comenta del archivo empleado (en el readme se hace referencia a
> `windows-11-21h2.pkr.hcl`) la sección **`post-processor "vagrant"`**,
> entonces no se generará un vagrant box y el resultado quedará en la carpeta
> **`output-windows-11-21h2-amd64/`**. El archivo es una imagen de qemu.

Mientras packer está trabajando, es posible conectar por vnc a localhost puerto
59xx. El puerto, es posible verlo en la salida de packer. En el ejemplo grabado,
puede visualizarse cerca del segundo 13, que se abre el puerto 5977.

Ya con la imagen generada, procedemos a trabajar con Terraform.

## Creamos una VM con Terraform

Ya con la imagen creada en la sección anterior, para poder crear tantas
virtuales como queramos, tenemos que:

* Crear una imagen base que llamaremos template y desde donde se clonarán los
  discos de las nuevas virtuales.
* Crear las virtuales que querramos.

### Creamos el template

Ya con el [repositorio](https://github.com/Mikroways/windows-packer-terraform-libvirt),
clonado, ingresamos al directorio **`terraform/00-template`** y corremos
Terraform:

```bash
cd terraform/00-template
terraform init
terraform apply \
  -var="windows_base_template=../../packer/output-windows-11-21h2-amd64/packer-windows-11-21h2-amd64"
```

> En el comando anterior, se asume haber comentado el post-processor de vagrant
> y disponer entonces del disco qemu creado en el path indicado

La salida debería ser algo como lo siguiente:

![terraform init](/images/blog/windows-iac-terraform-01.png)

Esto termina generando una imagen de base en libvirt llamada
**windows-11-base.qcow2**. Este archivo que simplemente se copia de un
directorio a otro, trabaja de una forma más compleja:

* El archivo
  [`variables.tf`](https://github.com/Mikroways/windows-packer-terraform-libvirt/blob/main/terraform/00-template/variables.tf)
  define qué pool y volumen creará.
* Un pool en libvirt es un storage que en este caso es de tipo directorio.
* Un volumen es un dispositivo dentro del pool que será un disco de una virtual.
  Un disco virtual, que debe particionarse para poder usarse.

El siguiente paso, será entonces crear una virtual a partir del volumen antes
creado. Para ello, nos movemos al directorio **`../01-vm/`**:

{{< asciinema key="windows-iac/terraform-apply" rows="30" cols="800" preload="1"
speed="10" >}}

Como vemos, al finalizar el comando se creó una nueva máquina virtual con una IP
en la red por defecto de libvirt: 192.168.122.0/24. Solamente podremos acceder a
esta máquina desde la PC anfitriona. 

> Si se desea utilizar otro modo de conexión de red, pueden usarse bridges, pero
> esta configuración escapa el alcance de esta demostración.

Podemos conectar a esta máquina usando diferentes estrategias:


* **Gráficamente:** usando rdesktop y la IP que devuelve Terraform, o usando
  spice a través de virt-viewer o virt-manager.
* **Por consola:** usando winrm o ssh.

## Aprovisionando la VM con Ansible

Y ahora es momento de configurar la máquina recientemente creada con Ansible. La
idea es mostrar cómo personalizar esta instancia. En nuestro repositorio,
documentamos qué [requerimientos deben
cumplirse](https://github.com/Mikroways/windows-packer-terraform-libvirt#ansible)
para poder trabajar con winrm. Una vez instalados, se procede directamente a
correr el playbook:

```bash
ansible-playbook -i inventory.yml playbook.yml
```

La salida del comando puede verse en el siguiente video:

{{< asciinema key="windows-iac/ansible" rows="30" cols="800" preload="1"
speed="50" >}}

Si se analiza el
[playbook](https://github.com/Mikroways/windows-packer-terraform-libvirt/blob/main/ansible/playbook.yml)
puede verse que se realizan varias tareas:

* Aplica actualizaciones (windows updates), considerando únicamente aquellas
  actualizaciones críticas.
* Instala aplicaciones usando [Chocolatey](https://chocolatey.org/), como por
  ejemplo Firefox, Google Chrome, VLC, Terraform, GIT, Kubectl, entre otras más.
* Remueve componentes de windows que no se utilizan.
* Instala y habilita Windows Subsystem for Linux (WSL), esto es una capa que
  permite correr nativamente binarios de Linux en windows.

Es interesante ver cómo se procede en este playbook de ejemplo para entender el
potencial que tenemos a través de Ansible, pero en realidad el poder real es a
través de [Powershell](https://docs.microsoft.com/en-us/powershell/). Esta
herramienta de Microsoft es vital para automatizar en estas plataformas, y es
usado por Ansible, Packer y [cloud-init](https://cloudinit.readthedocs.io/en/latest/).
Además, Powershell es la base de [DSC](https://docs.microsoft.com/en-us/powershell/dsc/overview).

Por último, mostramos una conexión al flamante Windows, y abrimos las
aplicaciones instaladas:

{{< youtube id="DAStbviE2Uc" >}}

## Conclusiones

Automatizar es fundamental para mantener la infraestructura de cualquier
sistema operativo. Ahorra tiempo tanto en la ejecución de acciones repetitivas,
como así también evitando errores en el ingreso de datos, pasos que se saltean e
incluso maximizando la seguridad en las instancias gestionadas de esta forma.
Incluso si aplicamos tests a nuestros roles, podemos garantizar mayor calidad y
confiabilidad en nuestros procesos de gestión de la infraestructura.

Como hemos visto en este post, esta tarea no escapa a las plataformas Windows,
por el contrario, potencia nuestras posibilidades y nos permite ampliar nuestro
compromiso con múltiples plataformas.
