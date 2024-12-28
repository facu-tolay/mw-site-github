---
title: "Instalando ansible como dev... ¿O como ops?"
date: 2023-10-26T10:20:00-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/snake-ansible.jpg"
# post author
author: "Christian Rodriguez, Manuel Kloster (revisión)"
# taxonomies
categories: ["DevSecOps" ]
tags: ["ansible", "python"]
# meta description
description: "Instalar ansible de una forma versátil"
# save as draft
draft: false
---
# Instalando ansible como dev... ¿O como ops?

Promovemos DevOps, y trabajamos como tales, pero muchas veces, en la primera
lectura de la documentación propia de las herramientas necesarias para
realizar nuestro trabajo, nos encontramos con explicaciones demasiado
simplificadas. Es decir, que no ponen el foco en la mejor forma de hacerlo
cuando trabajamos con múltiples proyectos, cada uno con requerimientos
diferentes. En Mikroways, tenemos varios clientes y hemos usado ansible en
distintos momentos y por tanto, debemos manejar diferentes versiones para el
producto por proyecto.

Es por esta razón que en este artículo nos adentraremos en las diferentes formas
de trabajar con ansible. Pero para entender bien la explicación que daremos,
primero debemos saber que:

* Ansible no es más que una librería python
* La versión de python soportada por ansible hoy día es 2.6 (o superior) o 3.5
(o superior).

> Es importante destacar que ansible se ejecuta desde una máquina que comanda la
> orquestación de varias máquinas del inventario. A esta máquina se la llama
> **nodo de control**. Si bien ansible puede orquestar cualquier plataforma e
> incluso appliances, el nodo de control no es soportado en plataformas Windows.
> Más información en [la documentación
> oficial](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html#control-node-requirements).
> Para estos casos, el uso de
> [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) es una excelente
> opción.

## Python

Python es un lenguaje que siempre estará disponible en cualquier distribución
Linux y su paquete por lo general viene instalado. Esto es porque muchas
herramientas usadas por el propio sistema se basan en scripts python.

Sin embargo, el desarrollador coincidirá en que la mejor forma de trabajar en
múltiples proyectos es especificando **para cada uno la versión del lenguaje a utilizar**
, independientemente de cuál sea ese lenguaje. Así es como aparecen utilitarios
que nos permiten trabajar en cada proyecto (es decir, en cada carpeta de nuestro
filesystem) con una versión diferente del lenguaje de programación utilizado. A
continuación mencionamos algunos de estos utilitarios:

* En [python](https://www.python.org/) se utiliza
  [pyenv](https://github.com/pyenv/pyenv).
* Para [nodejs](https://nodejs.org/en),
  [nvm](https://github.com/nvm-sh/nvm).
* Para [php](https://www.php.net/) se usa
  [phpenv](https://github.com/phpenv/phpenv).
* [Ruby](https://www.ruby-lang.org/) propone
  [rbenv](https://github.com/rbenv/rbenv) o [rvm](https://rvm.io/).
* [Go](https://go.dev/) utiliza [goenv](https://github.com/go-nv/goenv).
* Java tiene a [jabba](https://github.com/shyiko/jabba).

Y la lista podría seguir. Claro que cuando nuestro rol es desarrollar, es muy
común hacerlo principalmente en un lenguaje y a veces en otro par más. Por esto,
usar cualquiera de estas opciones es conveniente.

Si se observa la forma en que trabajan todas ellas, la base está en modificar el
PATH del entorno del shell y con una serie de scripts llamados _shims_ (una
suerte de suplementos), resolver qué versión del lenguaje usar.

## ¿Pero si en vez de ser desarrolladores estamos más del lado de operaciones?

En Mikroways, nuestro fuerte no es el desarrollo, aunque siempre vamos codo a
codo con los desarrolladores, y entendemos sus necesidades. A fines
prácticos, instalar cada una de estas herramientas para cada posible lenguaje
que usan los desarrolladores de nuestros clientes, nos lleva a instalar muchas
de estas herramientas.

Así es como terminamos optando por utilizar [asdf](https://asdf-vm.com/), un
manejador de versiones para diferentes runtimes. Sí, esta herramienta ya no es
un manejador de versiones de python ni de ruby, sino de ambos y muchos otros
runtimes.

Desde Mikroways proponemos usar entonces asdf por sobre las otras alternativas
debido a su versatilidad. En nuestro caso, incluso lo complementamos con
[direnv](https://direnv.net/). Entonces, en un proyecto en el que trabajemos con
python usamos una estructura como la siguiente:

```
.
├── .envrc
└── .tool-versions
```

Donde el contenido de `.envrc` es:

```
use asdf
layout python
```

Y `.tool-versions` contiene:

```
python 3.10.9
```

De esta forma, al acceder al directorio estaremos usando python 3.10.9 y virtual
env de python gracias al uso de direnv que gestiona un ambiente virtual
donde las dependencias del proyecto se almacenarán en una carpeta oculta
`.direnv/`.

# ¿Entonces? ¿Dónde estamos?

Bien puede que decidas usar pyenv o asdf. Con esto resolvemos de qué forma
instalar python en nuestro desktop. El siguiente paso es el de promover el uso
de un [ambiente virtual de python](https://docs.python.org/3/library/venv.html).

El uso de ambientes virtuales promueve un desacoplamiento de las librerías que
son dependencias de un proyecto respecto de otro. Si bien consume más espacio en
disco, el resultado final es más seguro y menos propenso a errores.

[Direnv se integra perfectamente con Python usando venv](https://github.com/direnv/direnv/wiki/Python).
Justamente al combinar direnv con asdf o pyenv, obtenemos a través de direnv un
ambiente virtual sin tener que seguir la documentación y pasos manuales que
exige venv.

Ya con un ambiente virtual y python flexible en tanto a las versiones que
podemos instalar en nuestro desktop, el siguiente paso es el de instalar alguna
versión de ansible. Podemos instalar la última con el siguiente comando:

```
pip install ansible
```

O instalar la versión 8.4.x usando:

```
pip install ansible~=8.4.0
```

Una forma de dejar asentado esto en el versionado del proyecto es a través del
archivo `requirements.txt` cuyo contenido podría ser:

```
ansible~=8.4.0
```

Y luego, correr el comando:

```
pip install -r requirements.txt
```

## ¿Y cómo trabajamos con galaxy?

Ansible también permite descargar dependencias que no son pip repositories. En
cambio, promueve el uso de roles y colecciones como herramientas para compartir
código. Estos artefactos se descargan desde [ansible galaxy](https://galaxy.ansible.com/) usando un comando
que provee el propio ansible instalado en el paso anterior:

```
ansible-galaxy role install namespace.nombre
```

Y como sucede con los requerimientos de python, podemos expresar los
requerimiento de galaxy usando `requirements.yml` como explica la propia
[documentación de
galaxy](https://docs.ansible.com/ansible/latest/galaxy/user_guide.html)

# Conclusiones

Sugerimos no instalar ansible como un paquete del sistema, sobre todo porque la
versión provista en general no es la última. Además, es probable que lo que
automatices hoy, mañana no funcione en una nueva versión de ansible. Por ello,
creemos que debemos seguir las mejores prácticas que se usan en desarrollo para
trabajar con múltiples versiones del lenguaje y dependencias de forma segura.

Nuestro consejo es usar asdf en conjunto con direnv, promoviendo el uso de
ambientes virtuales y manejando los requerimientos con archivos que se
versionen. Incluso sería recomendable usar [pipenv](https://pipenv-es.readthedocs.io/) para tener mayor control de las
dependencias de librerías en python. Sin embargo, para nuestro escenario donde
generalmente solo trabajamos con ansible y algunas librerías necesarias para el
testeo de roles / playbooks, suele no ser necesario. Sí lo utilizamos para el
desarrollo de roles [tox](https://tox.wiki/) para poder verificar el
funcionamiento de los roles de ansible en múltiples versiones de python y
ansible.
