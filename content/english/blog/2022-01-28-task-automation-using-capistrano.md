---
title: "Task automation using Capistrano"
date: 2022-01-28T11:06:24-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/ruby.webp"
# post author
author: "Macarena Poisson"
# taxonomies
categories: ["DevSecOps"]
tags: ["capistrano", "automation"]
# meta description
description: "Capistrano as a tool for task automation"
# save as draft
draft: false
---

Capistrano is a tool to automate tasks on remote servers, such as automate audits of any number of machines, the definition of workflows over SSH, among others.
In this case, we will focus on deploying to a remote server.

### Installation

Being implemented in Ruby, Capistrano can be installed as a Ruby gem. To learn more about the differents ways of installation, you can follow the the steps at the [official documentation](https://capistranorb.com/documentation/getting-started/installation/).

It's important to note that, despite being a Ruby gem, Capistrano can be adapted to the deployment of any application, regardless of it's languange. In addition, it is possible to extend the tasks provided by Capistrano to fit the requirements of the language or framework being used.

### Tasks

Capistrano divides the process into different tasks which are divided into stages or subtasks that may differ according to the deployment environment. These tasks can be the predefined ones or the ones defined by the user of the tool. This gives us flexibility when defining the deployment process, thus adjusting to the specific needs of each system.

To learn more about the predefined tasks, `cap -T -A` can be executed to get a complete listing of them. For example, within the **deploy** task, that is, in the **_namespace_** of the deploy task, you can find the subtasks:

- **deploy:starting**: start a deployment, make sure everything is ready
- **deploy:started**: started hook (for custom tasks)
- **deploy:updating**: update server(s) with a new release
- **deploy:updated**: updated hook
- **deploy:publishing**: publish the new release
- **deploy:published**: published hook
- **deploy:finishing**: finish the deployment, clean up everything
- **deploy:finished**: finished hook
- Among others.

As you may notice, there is a subtask for each stage of the deployment process. We can use this to define specific tasks before or after each one of these stages by using hooks.

For example, let's assume the case where we need to copy a file from one directory to another just before the deployment finishes. As mentioned above, we know that the _"finishing"_ stage exists within the namespace of the deploy task and that we can define our own tasks after that stage passes. That's why our task may look as it follows:

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

Just as we can implement this task, using Capistrano gives us endless possible customizations for our deployment process.

### Roles

In the previous section we saw that it's possible to define tasks as needed for each stage. In addition, Capistrano offers us the possibility of dividing these tasks filtering by the role they play in our system.

Let's assume the case in which the deployment process of a web application has tasks we don't want to replicate in a database deployment. Capistrano provides _"role filtering"_, which allows us to define for which roles each task is going to be executed.

The first step is to define these roles:

```ruby
 role :app, %w{deploy@example.com}, my_property: :my_value
 role :web, %w{user1@primary.com user2@additional.com}, other_property: :other_value
 role :db,  %w{deploy@example.com}
```

Next, we specify within the task in which roles it will be executed.

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

### Environments

Usually, in the development process of an application we have different environments: production, staging, development, etc, and these environments have different configurations. It is possible to keep those divisions in Capistrano in the following way:

```sh
cap install STAGES=production,staging,development
```

That will create the directory structure and files necessary to configure the deployment, as seen below:

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

In the deploy.rb file is where the configuration common to each environment is specified, while the config/deploy directory has the specific configuration files for each one of them. Each of these files has the necessary documentation for it.

The syntax to run a task in a specific environment is `cap <environment> <task [:subtask]>`
Following the example above:

```sh
cap staging deploy # This will execute all the deployment process
cap staging deploy:upload # This will only execute de upload task
```

### Deployment

Upon deployment, Capistrano will create a defined directory hierarchy on the remote server to organise the source code and other deployment-related data. Let's assume the case where we define the root of our deployment, with the variable `:deploy_to`, at /var/www/my_app_name. Once the deployment is finished, our remote server will have a directory structure like the following:

```console
├── current -> /var/www/my_app_name/releases/20220126141435/
├── releases
│   ├── 20220124110903
│   ├── 20220124151246
│   ├── 20220125101011
│   ├── 20220125140220
│   └── 20220126141435
├── repo
│   └── <VCS related data>
├── revisions.log
└── shared
    └── <linked_files and linked_dirs>
```

- Releases is the directory that holds all releases in timestamp folders.
- Current is a symbolic link to the latest release made. This link is updated only if the deployment finished successfully, otherwise the previous release is kept.
- Repo is the directory that holds the version control system configured, for example, git.
- Revisions.log is the file used to store deployment and rollback logs
- Shared is the folder that holds all the files and directories that persist across releases. This is defined by the variables `linked_dirs` and `linked_files` in the deploy.rb configuration file.

### linked_files

Sometimes, we want to keep the same version of a file between releases, such as database configurations, the way to do that in Capistrano is by using linked_files. Within our releases, those files will be symbolic links to the files stored in the shared directory of the remote server. You can set this by adding the following to your configuration files:

```ruby
append :linked_files, "config/database.yaml"
set :local_base_dir, "shared-configurations"
```

Where local_base_dir is the local directory where Capistrano will search for a file whose path matches the pattern `config/database.<environment>.yaml` and then upload it to the server as config/database.yaml. This allow us to have different configuration files per environment.

### Releases and rollback

Since Capistrano keeps all the deployment history in the releases directory, doing a rollback to the previous state is as simple as executing:

```sh
 cap <environment> deploy:rollback
```

Or to roll back to a specific release:

```sh
 cap <environment> deploy:rollback ROLLBACK_RELEASE=release
```

In either case, the symbolic link in the current directory is updated and a backup file of the version that was active before the rollback is created.

### Conclusion

We have seen how to automate our deployment process in a simple and flexible way using Capistrano. In the next post we will see how to integrate this automation with GitLab CI
