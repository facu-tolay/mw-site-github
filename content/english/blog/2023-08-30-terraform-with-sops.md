---
title: "Data encryption in IaC: Using SOPS with Terraform"
date: 2023-08-30T20:30:55-03:00
# page header background image
page_header_bg: "images/banner/banner2.jpg.webp"
# post thumb
image: "images/blog/terraform.webp"
# post author
author: "Inti Maria Tidball"
# taxonomies
categories: ["DevSecOps"]
tags: ["terraform", "sops", "encryption", "infrastructure", "version", "git"]
# meta description
description: "Data encryption in IaC: Using SOPS with Terraform"
# save as draft
draft: false
---

# Data Encryption in IaC: Using SOPS with Terraform

In the realm of Infrastructure as Code (IaC), the secure management of sensitive information is crucial. SOPS offers us a secure encryption method aimed at version-controlling sensitive variables in our DevOps workflows. SOPS provides multiple options for encryption, including AWS KMS, PGP, and AGE. The benefit of using SOPS with AWS KMS for us is that it allows an organized way to manage granular permissions, delegating the responsibility of storing private keys to AWS in a centralized way.

Version-controlling our sensitive variables assures us reliability and robustness in deployments. At the same time, automating their access allows us to implement CI/CD practices with enhanced security. On the other hand, Terraform is a fundamental tool for generating infrastructure automatically. It allows storing its state in a local file or sharing it remotely [in various ways](https://developer.hashicorp.com/terraform/language/state/remote) (it's not recommended to version-control the state since it exposes sensitive information, but there are various solutions for securely maintaining the state in the cloud).

Using encrypted values, it's possible to generate infrastructure configuration files for securely configuring applications, for example, for base application values that can later be used with Helmfile. For instance, storing DNS data in a single encrypted file that can be used to configure External-DNS or configure the Issuers for Cert-Manager. This complements Terraform's ability to track and control changes in infrastructure state, as we can keep track of any change in our encrypted file.

## Why SOPS with Terraform?

Using the SOPS module with Terraform in combination allows us to increase the security of our applications and maintain consistency. SOPS gives us the ability to encrypt, decrypt, and edit files containing secrets or sensitive variables, and Terraform provides the power to automate infrastructure management and maintain a consistent state.

Together they complement each other to guarantee data security while automating resource creation. They can be used to securely generate configuration files from Terraform, which can later be used for managing base applications or be utilized by CI/CD processes.

At Mikroways, we provide you with a [demonstration repository](https://github.com/Mikroways/Terraform-SOPS-Demo) that you can use to follow this example and see how this powerful combination works.

## Step-by-Step Practical Guide

### Preparation:
- Install and configure [AWS CLI](https://aws.amazon.com/cli/), [Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli), [SOPS](https://github.com/getsops/sops), and [direnv](https://direnv.net/docs/installation.html).
- Set up an IAM role with permissions to use an AWS KMS key.

### Initial Setup:
- Copy the `.envrc-sample` file to `.envrc`.
- Edit the `.envrc` file with the corresponding values, especially the `AWS_PROFILE` and `AWS_REGION` variables, which are necessary for using the local KMS key.
- Run `direnv allow` to load the configuration.

### File Encryption with SOPS:
- Create a file of sensitive values; in this example, we use `secrets.dec.yaml`.
- Encrypt this file with SOPS, giving it a descriptive name: `sops -e secrets.dec.yaml > secrets.enc.yaml`.
- In these examples, `.dec` indicates the decrypted file, and `.enc` the encrypted file.
- Add the `secrets.dec.yaml` file to our .gitignore so that it is not version-controlled by git (in our example, it is versioned to facilitate use and example).

### Using Terraform with "sops_file":
- From a Terraform `.tf` file, refer to the "sops_file" resource to bring in the values from `secrets.enc.yaml`.
- Use the decrypted values in the necessary resources, with `data.sops_file` (see example in demo repo).

### Application with Terraform:
- Initialize Terraform with `terraform init`.
- Verify the changes with `terraform plan`.
- Apply the changes with `terraform apply`. To apply specific changes, the `-target` flag can be used followed by the desired resource.

---

*You can see an example of how to create the KMS key and configure the IAM role in the example repository subdirectory called “aws_kms_iam_config”. You will find an example to do it with Terraform and instructions to do it through the AWS console alternatively.*
