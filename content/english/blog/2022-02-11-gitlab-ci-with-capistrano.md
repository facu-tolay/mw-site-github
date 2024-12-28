---
title: GitLab Continuous Integration with Capistrano
date: 2022-02-11T09:52:58-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/pipeline.webp"
# post author
author: "Macarena Poisson"
# taxonomies
categories: ["DevSecOps"]
tags: ["capistrano", "automation", "gitlab-ci"]
# meta description
description: "Deployment using Capistrano and GitLab CI"
# save as draft
draft: false
---

In the previous post we saw how to [automate a deployment using Capistrano]({{<ref "/blog/2022-01-28-task-automation-using-capistrano">}}). In this post we will see how to integrate Capistrano with GitLab CI.

### Using Capistrano in GitLab CI

GitLab Continuous Integration, or `GitLab CI`, offers us the posssibility to work with Docker images as part of the CI infrastructure. Capistrano is a Ruby tool, so we need to provide an image that already has Ruby; we can do that by adding to our `.gitlab-ci.yaml` file:

```yaml
image: ruby:2.6-alpine
```

> In this case we are using an alpine-based image, but you can use the one that best suits your needs.


Next, we need to install Capistrano as a dependency:

```yaml
image: ruby:2.6-alpine
stages:
  - deploy
deploy_staging:
stage: deploy
script:
  - gem install capistrano
```

This way, Capistrano is installed only when the image is deployed.

Capistrano uses SSH keys to make deployments, so we'll need to create an SSH key for the deployment job to be able to communicate to our server. That means we will be saving a _private key_ for the jobs, so we need to make sure we do this as safe as possible; otherwise we would be compromising the security of our server.

The best way to do it, as outlined in [GitLab's documentation](https://docs.gitlab.com/ee/ci/ssh_keys/index.html), is using `ssh-agent` to load the private key stored as a [CI/CD variable](https://docs.gitlab.com/ee/ci/variables/index.html). The steps to add a variable to our repository are:

1. Go to your project’s **Settings > CI/CD**
2. Expand the **Variables** section.
3. Select **Add Variable** and fill in the details. In **Type** select **File**

Then, our .gitlab-ci.yaml file may look as follows:

```yaml
image: ruby:2.6-alpine
stages:
  - deploy
deploy_staging:
  stage: deploy
  script:
    - apk add -U openssh
    - eval `ssh-agent -s`
    - chmod 400 $SERVER_PRIVATE_KEY
    - ssh-add $SERVER_PRIVATE_KEY
    - gem install capistrano
```

> If you are using a Debian-based image, you won't need to install ssh-agent.

Finally, we could use Capistrano's environments to define the deployment from the main branch to production and from the develop branch to staging:

```yaml
image: ruby:2.6-alpine
stages:
  - deploy
deploy_staging:
  stage: deploy
  script:
    - apk add -U openssh
    - eval `ssh-agent -s`
    - chmod 400 $SERVER_PRIVATE_KEY
    - ssh-add $SERVER_PRIVATE_KEY
    - gem install capistrano
    - cap staging deploy
  only:
    - development
deploy_production:
  stage: deploy
  script:
    - apk add -U openssh
    - eval `ssh-agent -s`
    - chmod 400 $SERVER_PRIVATE_KEY
    - ssh-add $SERVER_PRIVATE_KEY
    - gem install capistrano
    - cap production deploy
  only:
    - main
```

### Conclusion

In this post we have seen how using Capistrano and GitLab CI/CD we can easily automate the deployment process of our software.
