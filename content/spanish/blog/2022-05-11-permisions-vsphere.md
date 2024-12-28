---
title: "Gestionando permisos en vSphere"
date: 2022-05-11T10:00:00-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/permission.webp"
# post author
author: "Juan Pablo Sánchez Magariños"
# taxonomies
categories: ["DevSecOps"]
tags: ["vsphere", "vmware", "kubernetes", "terraform", "packer", "permisos"]
# meta description
description: "Cómo crear los permisos necesarios para terraform / packer / k8s en vSphere"
draft: false
---

En esta oportunidad hablaremos sobre los privilegios necesarios para realizar la
instalación de un cluster Kubernetes sobre una infraestructura vSphere,
particularmente usando Packer, Terraform y Clusterapi (como se explicó en el
post [Instalar Kubernetes en VMware Vsphere]({{< ref "blog/2021-11-03-kubernetes-con-clusterapi.md" >}})).

Se deben tener en consideración diferentes permisos para: instalar un cluster de
k8s, manejarlo con Terraform, usar Clusterapi con el provider de vSphere, usar
Packer, e incluso el cloud provider de k8s.
Por ello, mencionamos a continuación algunos usuarios o grupos propuestos. La
forma de gestionar los  permisos será crear **roles** que se asocian a estos
usuarios o grupos según sea necesario.

### Prerequisitos

A lo largo de este post utilizaremos la herramienta
[govc](https://github.com/vmware/govmomi/tree/master/govc#govc).
Si bien se puede realizar la gestión desde la UI del vcenter, es más fácil y
rápido realizarla desde la terminal.

Según vSphere CSI driver, se debe cumplir lo siguiente:

* Versión mínima de **ESXi 6.7U3 o mayor**
* Las VMs a usar deben
  **habilitar en los discos enableUUID**. Esto es necesario para
  asegurar se asigne UUID únicos y consistentes a las vms. Para cambiarlo,
  puede usarse govc:
  `govc vm.change -vm'/<datacenter-name>/vm/<vm-name1>' -e="disk.enableUUID=1"`
  * Como requisito para lo anterior **el hw de la vm debe ser 15 o superior**:
    para cambiarlo con govc:
    `govc vm.upgrade -version=15 -vm '/<datacenter-name>/vm/<vm-name1>'`

### Usuarios/Grupos

En resumen, deben crearse 3 usuarios/grupos diferentes, a decir:

* **mw-packer:** con permisos para poder operar con packer. Los templates
  deberían quedar a disposición por terraform y/o capv.
* **mw-terraform:** debe poder generar vms a partir de templates en
  un cluster/folder.
* **mw-csi:** cuenta con permisos necesarios para que el cloud provider pueda
  solicitar discos al datastore y attacharlo a las vms que sean nodos del
  cluster.
  >Hay otros privilegios relacionados a los tags de las vms.

Para crearlos con govc:

```sh
  govc sso.user.create -p <password> <nombre>
```

#### Opcionales

Los siguientes usuarios o roles no serán necesarios pero aportarían mayor
granularidad:

* **mw-terraform-role:** podría utilizarse para gestionar los roles
    aquí descriptos. Este rol debería unicamente crear o modificar roles.
* **mw-k8s-clusterapi:** representará un mix de lo necesario por _mw-csi_ y
    _mv-terraform_.

### Crear los roles

Los siguientes roles serán grupos de permisos que se deberán crear. Para
crearlos utilizando govc:
  
```sh
  govc role.create <nombre-rol> <lista-de-permisos>
```

También puede ser util agregar o quitar permisos a un rol existente:

```sh
  # Agregar permisos
  govc role.update -a <nombre-rol> <lista-de-permisos>

  # Quitar
  govc role.update -r <nombre-rol> <lista-de-permisos>
```

En la siguiente tabla se detallan las listas de privilegios para cada rol.
También se agrega una comparativa con los nombres con los que figuran los
privilegios en la UI, que no siempre coincide, por si no se está utilizando govc.

{{<table "table table-striped table-bordered">}}
<table><thead>
<tr><th>Rol</th><th>Privilegios (consola)</th><th>Privilegios (UI)</th></tr>
</thead>
<tbody>
<tr><td>k8s-datacenter</td>
<td><pre>
Cns.Searchable
</pre></td>
<td style="white-space:nowrap;"><ul><li>Cns</li>
    <ul><li><input type="checkbox" onclick="return false;" checked />
        <label>Searchable</label></li>
    </ul></ul></td></tr>
<tr><td>k8s-global-permissions</td>
<td><pre>
InventoryService.Tagging.AttachTag
InventoryService.Tagging.CreateCategory
InventoryService.Tagging.EditCategory
InventoryService.Tagging.DeleteCategory
InventoryService.Tagging.CreateTag
InventoryService.Tagging.EditTag
InventoryService.Tagging.DeleteTag
Sessions.ValidateSession
StorageProfile.View
</pre></td>
<td style="white-space:nowrap;"><ul><li>Profile-driven storage</li>
      <ul><li><input type="checkbox" onclick="return false;" checked />
            <label>Profile-driven storage view</label></li></ul>
        <li>Sessions</li>
        <ul><li><input type="checkbox" onclick="return false;" checked />
            <label>Validate session</label></li></ul>
        <li>vSphere Tagging</li>
        <ul><li><input type="checkbox" onclick="return false;" checked />
            <label>Assign or Unassign vSphere Tag</label></li>
          <li><input type="checkbox" onclick="return false;" checked />
            <label>Create vSphere Tag</label></li>
          <li><input type="checkbox" onclick="return false;" checked />
            <label>Create vSphere Tag Category</label></li>
          <li><input type="checkbox" onclick="return false;" checked />
            <label>Delete vSphere Tag</label></li>
          <li><input type="checkbox" onclick="return false;" checked />
            <label>Delete vSphere Tag Category</label></li>
          <li><input type="checkbox" onclick="return false;" checked />
            <label>Edit vSphere Tag</label></li>
          <li><input type="checkbox" onclick="return false;" checked />
            <label>Edit vSphere Tag Category</label></li></ul>
        </ul></td></tr>
<tr><td>k8s-manage-vm</td>
<td><pre>
VirtualMachine.Config.AddExistingDisk
VirtualMachine.Config.AddNewDisk
VirtualMachine.Config.AddRemoveDevice
VirtualMachine.Config.AdvancedConfig
VirtualMachine.Config.Annotation
VirtualMachine.Config.CPUCount
VirtualMachine.Config.ChangeTracking
VirtualMachine.Config.DiskExtend
VirtualMachine.Config.DiskLease
VirtualMachine.Config.EditDevice
VirtualMachine.Config.HostUSBDevice
VirtualMachine.Config.ManagedBy
VirtualMachine.Config.Memory
VirtualMachine.Config.MksControl
VirtualMachine.Config.QueryFTCompatibility
VirtualMachine.Config.QueryUnownedFiles
VirtualMachine.Config.RawDevice
VirtualMachine.Config.ReloadFromPath
VirtualMachine.Config.RemoveDisk
VirtualMachine.Config.Rename
VirtualMachine.Config.ResetGuestInfo
VirtualMachine.Config.Resource
VirtualMachine.Config.Settings
VirtualMachine.Config.SwapPlacement
VirtualMachine.Config.ToggleForkParent
VirtualMachine.Config.Unlock
VirtualMachine.Config.UpgradeVirtualHardware
VirtualMachine.GuestOperations.Execute
VirtualMachine.GuestOperations.Modify
VirtualMachine.GuestOperations.ModifyAliases
VirtualMachine.GuestOperations.Query
VirtualMachine.GuestOperations.QueryAliases
VirtualMachine.Hbr.ConfigureReplication
VirtualMachine.Hbr.MonitorReplication
VirtualMachine.Hbr.ReplicaManagement
VirtualMachine.Interact.AnswerQuestion
VirtualMachine.Interact.Backup
VirtualMachine.Interact.ConsoleInteract
VirtualMachine.Interact.CreateScreenshot
VirtualMachine.Interact.CreateSecondary
VirtualMachine.Interact.DefragmentAllDisks
VirtualMachine.Interact.DeviceConnection
VirtualMachine.Interact.DisableSecondary
VirtualMachine.Interact.DnD
VirtualMachine.Interact.EnableSecondary
VirtualMachine.Interact.GuestControl
VirtualMachine.Interact.MakePrimary
VirtualMachine.Interact.Pause
VirtualMachine.Interact.PowerOff
VirtualMachine.Interact.PowerOn
VirtualMachine.Interact.PutUsbScanCodes
VirtualMachine.Interact.Record
VirtualMachine.Interact.Replay
VirtualMachine.Interact.Reset
VirtualMachine.Interact.SESparseMaintenance
VirtualMachine.Interact.SetCDMedia
VirtualMachine.Interact.SetFloppyMedia
VirtualMachine.Interact.Suspend
VirtualMachine.Interact.TerminateFaultTolerantVM
VirtualMachine.Interact.ToolsInstall
VirtualMachine.Interact.TurnOffFaultTolerance
VirtualMachine.Inventory.Create
VirtualMachine.Inventory.CreateFromExisting
VirtualMachine.Inventory.Delete
VirtualMachine.Inventory.Move
VirtualMachine.Inventory.Register
VirtualMachine.Inventory.Unregister
VirtualMachine.Namespace.Event
VirtualMachine.Namespace.EventNotify
VirtualMachine.Namespace.Management
VirtualMachine.Namespace.ModifyContent
VirtualMachine.Namespace.Query
VirtualMachine.Namespace.ReadContent
VirtualMachine.Provisioning.Clone
VirtualMachine.Provisioning.CloneTemplate
VirtualMachine.Provisioning.CreateTemplateFromVM
VirtualMachine.Provisioning.Customize
VirtualMachine.Provisioning.DeployTemplate
VirtualMachine.Provisioning.DiskRandomAccess
VirtualMachine.Provisioning.DiskRandomRead
VirtualMachine.Provisioning.FileRandomAccess
VirtualMachine.Provisioning.GetVmFiles
VirtualMachine.Provisioning.MarkAsTemplate
VirtualMachine.Provisioning.MarkAsVM
VirtualMachine.Provisioning.ModifyCustSpecs
VirtualMachine.Provisioning.PromoteDisks
VirtualMachine.Provisioning.PutVmFiles
VirtualMachine.Provisioning.ReadCustSpecs
VirtualMachine.State.CreateSnapshot
VirtualMachine.State.RemoveSnapshot
VirtualMachine.State.RenameSnapshot
VirtualMachine.State.RevertToSnapshot
</pre></td>
<td style="white-space:nowrap;"><ul><li>Virtual machine</li>
      <ul><li><input type="checkbox" onclick="return false;" checked />
          <label>Select All</label></li></ul>
    </ul></td></tr>
<tr><td>k8s-manage-volumes</td>
<td><pre>
Datastore.AllocateSpace
Datastore.Browse
Datastore.FileManagement
</pre></td>
<td style="white-space:nowrap;"><ul><li>Datastore</li>
        <ul><li><input type="checkbox" onclick="return false;" checked />
            <label>Allocate space</label></li>
          <li><input type="checkbox" onclick="return false;" checked />
            <label>Browse datastore</label></li>
          <li><input type="checkbox" onclick="return false;" checked="">
            <label>Low level file operations</label></li></ul>
        <li>vSphere Tagging</li>
          <ul><li><input type="checkbox" onclick="return false;" checked />
                <label>Assign or Unassign vSphere Tag on Object</label></li></ul>
    </ul></td></tr>
<tr><td>k8s-manage-net-nodes</td>
<td><pre>
Network.Assign
</pre></td>
<td style="white-space:nowrap;"><ul><li>Network</li>
      <ul><li><input type="checkbox" onclick="return false;" checked />
          <label>Assign network</label></li></ul>
    </ul></td></tr>
<tr><td>k8s-manage-cluster</td>
<td><pre>
Resource.AssignVMToPool
VApp.Import
</pre></td>
<td style="white-space:nowrap;"><ul><li>Resource</li>
      <ul><li><input type="checkbox" onclick="return false;" checked />
          <label>Assign virtual machine to resource pool</label></li></ul>
    <li>vApp</li>
      <ul><li><input type="checkbox" onclick="return false;" checked />
          <label>Import</label></li></ul>
    </ul></td></tr>
<tr><td>k8s-file-management</td>
<td><pre>
Datastore.FileManagement
</pre></td>
<td style="white-space:nowrap;"><ul><li>Datastore</li>
      <ul><li><input type="checkbox" onclick="return false;" checked />
          <label>Low level file operations</label></li></ul>
    </ul></td></tr>
<tr><td>k8s-packer-host</td>
<td><pre>
Host.Config.SystemManagement
Resource.AssignVMToPool
</pre></td>
<td style="white-space:nowrap;"><ul><li>Host</li>
      <ul><li><input type="checkbox" onclick="return false;" />
          <label>Configuration</label></li>
          <ul><li><input type="checkbox" onclick="return false;" checked />
              <label>System Management</label></li></ul>
      </ul>
    <li>Resource</li>
      <ul><li><input type="checkbox" onclick="return false;" checked />
          <label>Assign virtual machine to resource pool</label></li></ul>
    </ul></td></tr>
<tr><td>k8s-packer-vm</td>
<td><pre>
VApp.Export
VirtualMachine.Config.AddExistingDisk
VirtualMachine.Config.AddNewDisk
VirtualMachine.Config.AddRemoveDevice
VirtualMachine.Config.AdvancedConfig
VirtualMachine.Config.Annotation
VirtualMachine.Config.CPUCount
VirtualMachine.Config.ChangeTracking
VirtualMachine.Config.DiskExtend
VirtualMachine.Config.DiskLease
VirtualMachine.Config.EditDevice
VirtualMachine.Config.HostUSBDevice
VirtualMachine.Config.ManagedBy
VirtualMachine.Config.Memory
VirtualMachine.Config.MksControl
VirtualMachine.Config.QueryFTCompatibility
VirtualMachine.Config.QueryUnownedFiles
VirtualMachine.Config.RawDevice
VirtualMachine.Config.ReloadFromPath
VirtualMachine.Config.RemoveDisk
VirtualMachine.Config.Rename
VirtualMachine.Config.ResetGuestInfo
VirtualMachine.Config.Resource
VirtualMachine.Config.Settings
VirtualMachine.Config.SwapPlacement
VirtualMachine.Config.ToggleForkParent
VirtualMachine.Config.Unlock
VirtualMachine.Config.UpgradeVirtualHardware
VirtualMachine.Interact.AnswerQuestion
VirtualMachine.Interact.Backup
VirtualMachine.Interact.ConsoleInteract
VirtualMachine.Interact.CreateScreenshot
VirtualMachine.Interact.CreateSecondary
VirtualMachine.Interact.DefragmentAllDisks
VirtualMachine.Interact.DeviceConnection
VirtualMachine.Interact.DisableSecondary
VirtualMachine.Interact.DnD
VirtualMachine.Interact.EnableSecondary
VirtualMachine.Interact.GuestControl
VirtualMachine.Interact.MakePrimary
VirtualMachine.Interact.Pause
VirtualMachine.Interact.PowerOff
VirtualMachine.Interact.PowerOn
VirtualMachine.Interact.PutUsbScanCodes
VirtualMachine.Interact.Record
VirtualMachine.Interact.Replay
VirtualMachine.Interact.Reset
VirtualMachine.Interact.SESparseMaintenance
VirtualMachine.Interact.SetCDMedia
VirtualMachine.Interact.SetFloppyMedia
VirtualMachine.Interact.Suspend
VirtualMachine.Interact.TerminateFaultTolerantVM
VirtualMachine.Interact.ToolsInstall
VirtualMachine.Interact.TurnOffFaultTolerance
VirtualMachine.Inventory.Create
VirtualMachine.Inventory.CreateFromExisting
VirtualMachine.Inventory.Delete
VirtualMachine.Inventory.Move
VirtualMachine.Inventory.Register
VirtualMachine.Inventory.Unregister
VirtualMachine.Provisioning.Clone
VirtualMachine.Provisioning.CloneTemplate
VirtualMachine.Provisioning.CreateTemplateFromVM
VirtualMachine.Provisioning.Customize
VirtualMachine.Provisioning.DeployTemplate
VirtualMachine.Provisioning.DiskRandomAccess
VirtualMachine.Provisioning.DiskRandomRead
VirtualMachine.Provisioning.FileRandomAccess
VirtualMachine.Provisioning.GetVmFiles
VirtualMachine.Provisioning.MarkAsTemplate
VirtualMachine.Provisioning.MarkAsVM
VirtualMachine.Provisioning.ModifyCustSpecs
VirtualMachine.Provisioning.PromoteDisks
VirtualMachine.Provisioning.PutVmFiles
VirtualMachine.Provisioning.ReadCustSpecs
VirtualMachine.State.CreateSnapshot
VirtualMachine.State.RemoveSnapshot
VirtualMachine.State.RenameSnapshot
VirtualMachine.State.RevertToSnapshot
</pre></td>
<td style="white-space:nowrap;"><ul><li>vApp</li>
      <ul><li><input type="checkbox" onclick="return false;" checked />
          <label>Export</label></li></ul>
    <li>Virtual machine</li>
      <ul><li><input type="checkbox" onclick="return false;" checked />
          <label>Change Configuration</label></li>
        <li><input type="checkbox" id="t" onclick="return false;" checked />
          <label>Edit Inventory</label></li>
        <li><input type="checkbox" onclick="return false;" checked />
          <label>Interaction</label></li>
        <li><input type="checkbox" onclick="return false;" checked />
          <label>Provisioning</label></li>
        <li><input type="checkbox" onclick="return false;" checked />
          <label> Snapshot management</label></li>
        <li><input type="checkbox" onclick="return false;" checked />
          <label>vSphere Replication</label></li></ul>
    </ul></td></tr>
<tr><td>k8s-cns-host</td>
<td><pre>
Host.Config.Storage
</pre></td>
<td style="white-space:nowrap;"><ul><li>Host</li>
      <ul><li><input type="checkbox" onclick="return false;" />
          <label>Configuration</label></li>
          <ul><li><input type="checkbox" onclick="return false;" checked />
                <label>Storage partition configuration</label></li></ul>
      </ul>
   </ul></td></tr>
<tr><td>k8s-cns-vm</td>
<td><pre>
VirtualMachine.Config.AddExistingDisk
VirtualMachine.Config.AddRemoveDevice
</pre></td>
<td style="white-space:nowrap;"><ul><li>Virtual machine</li>
      <ul><li><input type="checkbox" onclick="return false;" />
          <label>Change Configuration</label></li>
          <ul><li><input type="checkbox" onclick="return false;" checked />
              <label>Add existing disk</label></li>
            <li><input type="checkbox" onclick="return false;" checked />
              <label>Add or remove device</label></li></ul>
      </ul>
    </ul></td></tr>
<tr><td>k8s-cns-vsphere</td>
<td><pre>
Cns.Searchable
StorageProfile.View
</pre></td>
<td style="white-space:nowrap;"><ul><li>Cns</li>
      <ul><li><input type="checkbox" onclick="return false;" checked />
          <label>Searchable</label></li></ul>
    <li>Profile-driven storage</li>
      <ul><li><input type="checkbox" onclick="return false;" checked />
          <label>Profile-driven storage view</label></li></ul>
    </ul></td></tr>
<tr><td>Read-only</td>
<td><pre>
System.Anonymous
System.Read
System.View
</pre></td>
    <td>Este rol ya está definido por defecto</td>
    </tr>
  </tbody>
</table>
{{</table>}}

### Asignar roles a usuarios y entidades

Una vez creado los roles es necesario asignarlos a cada objeto.

{{<table "table table-striped table-bordered">}}
| Objeto | Usuario/Grupo | Rol | Propagación |
|:------ |:-------------:|:---:|:-----------:|
| vSphere (raíz) | `mw-csi` | k8s-cns-vsphere | No |
| vSphere (raíz) | `mw-terraform` | k8s-global-permissions | No |
| Datacenter | `mw-terraform` | k8s-datacenter | No |
| Datacenter | `mw-packer` | k8s-file-management | No |
| Datacenter | `mw-csi` | Read-only | No |
| Datastore |  `mw-terraform` y `mw-packer` | k8s-manage-volumes | No |
| Datastore (csi) | `mw-csi` | k8s-file-management | No |
| Cluster | `mw-packer` | k8s-manage-cluster | No |
| Cluster | `mw-csi` | k8s-cns-host | No |
| Cluster y Hosts o Resource Groups | `mw-terraform` | k8s-manage-cluster | No |
| Host (*) | `mw-packer` | k8s-packer-host | No |
| Hosts | `mw-csi` | Read-only | No |
| VM Folder | `mw-terraform` | k8s-manage-vm | **Sí** |
| VM Folder | `mw-packer` | k8s-packer-vm | **Sí** |
| VM Folder | `mw-csi` | k8s-cns-vm | **Sí** |
| vSphere Port Group o Network y Distributed Switch | `mw-terraform` y `mw-packer` | k8s-manage-net-nodes | No |
{{</table>}}
(*) Se debe designar un host que luego se usará para
convertir templates en vm's mediante la variable `$VSPHERE_PREPRODUCTION_HOST`.

De nuevo esto puede realizarse haciendo "click derecho" en los distintos objetos
en la UI, o bien con govc, con el siguiente comando:

```sh
  govc permissions.set -principal <nombre-usuario>@vsphere.local \
                      -role <nombre-rol> \
                      -propagate=[true | false] \
                      <path-a-la-entidad>
```

Algunos ejemplos de la tabla:

```sh
  govc permissions.set -principal mw-csi@vsphere.local \
                      -role k8s-cns-vsphere \
                      -propagate=false \
                      /

  govc permissions.set -principal mw-terraform@vsphere.local \
                    -role k8s-manage-vm
                    -propagate=true
                    /<datacenter-name>/vm/<folder-name>
```

Para revisar la dirección completa de cada entidad se puede utilizar:

```sh
  govc find . -type <tipo>

  Donde <tipo> es:
  c    ClusterComputeResource
  d    Datacenter
  f    Folder
  g    DistributedVirtualPortgroup
  h    HostSystem
  m    VirtualMachine
  n    Network
  p    ResourcePool
  s    Datastore
  w    DistributedVirtualSwitch

```

### Verificación

Para ver los roles y permisos aplicados se puede utilizar:

```sh
  # Listar roles
  govc role.ls | grep k8s-

  # Listar privilegios de un rol
  govc role.ls <nombre-rol>

  # Mostrar donde se ha aplicado el rol y para que usuarios
  govc role.usage <nombre-rol>
```

**Contamos con un script que automatiza la tarea de verificación** que utiliza
los comandos mencionados previamente junto con archivos de definiciones y
permite corroborar que todos los privilegios han sido asignados correctamente.
El mismo se encuentra en un
[**repositorio privado de Mikroways**](https://gitlab.com/mikroways/tools/mw-vsphere-permission-checker),
cuyo acceso será facilitado oportunamente.

#### Fuentes de referencia

* [Roles propuestos por
  capv](https://github.com/kubernetes-sigs/cluster-api-provider-vsphere/issues/500#issuecomment-586637497)
  * _El link de arriba es un seguimiento de un issue en GitHub donde se linea a
    un
    [gist](https://hackmd.io/n-jBbLVkSsG_Dbm-eFTpIg#User-requirements-to-allow-for-CAPV-Controllers-to-work-in-a-vSphere-environment)
    con un resumen hecho por alguien de la comunidad._
* [OKD vsphere
  permissions](https://docs.openshift.com/container-platform/4.7/installing/installing_vsphere/installing-vsphere-installer-provisioned-customizations.html#installation-vsphere-installer-infra-requirements_installing-vsphere-installer-provisioned-customizations)
* [Roles según vSphere CSI
  driver](https://vsphere-csi-driver.sigs.k8s.io/driver-deployment/prerequisites.html#compatible_vsphere_esxi_versions)
