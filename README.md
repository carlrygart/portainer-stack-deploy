<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>

# Portainer Stack Deploy

Portainer-stack-deploy is a GitHub Action for deploying a newly updated stack to a Portainer v2 instance. This action is useful when you have a continues deployment pipeline. The action itself works similar to how you deploy a task definition to Amazon ECS.

**Currently works on Portainer API v2.**

## Action Inputs

| Input            | Description                                                                                                                                                                                      | Default      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| portainer-host   | Portainer host, eg. `https://myportainer.instance.com`                                                                                                                                           | **Required** |
| username         | Username for the Portainer login. **NOTE: Do not use admin account!** Create a new CI specific login instead                                                                                     | **Required** |
| password         | Password for the Portainer login                                                                                                                                                                 | **Required** |
| swarm-id         | ID of the swarm. Only required if you deploy to a swarm                                                                                                                                          |              |
| stack-name       | Name for the Portainer stack                                                                                                                                                                     | **Required** |
| stack-definition | The path to the docker-compose stack stack definition file from repo root, eg. `stack-definition.yml`                                                                                            | **Required** |
| image            | The URI of the container image to insert into the stack definition, eg.`docker.pkg.github.com/username/repo/master:sha-676cae2`. Will use existing image inside stack definition if not provided |              |

## Examples

The example below shows how the `portainer-stack-deploy` action can be used to deploy a fresh version of your app to Portainer.

```yaml
name: CI

on:
  push:
    branches:
      - 'master'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Build and push Docker image
        uses: docker/build-push-action@v1
        with:
          registry: ${{ env.DOCKER_REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ github.token }}
          repository: ${{ env.DOCKER_IMAGE }}
          tags: ${{ env.IMAGE_TAG }}

      - name: Deploy stack to Portainer
        uses: carlrygart/portainer-stack-deploy@v1
        with:
          portainer-host: ${{ secrets.PORTAINER_HOST }}
          username: ${{ secrets.PORTAINER_USERNAME }}
          password: ${{ secrets.PORTAINER_PASSWORD }}
          stack-name: 'my-awesome-stack'
          stack-definition: 'stack-definition.yml'
          image: ${{ env.DOCKER_REGISTRY }}/${{ env.DOCKER_IMAGE }}:${{ env.IMAGE_TAG }}
```
