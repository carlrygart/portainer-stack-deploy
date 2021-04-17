<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>

# Portainer Stack Deploy

Portainer-stack-deploy is a GitHub Action for deploying a newly updated stack to a Portainer instance. This action is useful when you have a continues deployment pipeline. The action itself works similar to how you deploy a task definition to Amazon ECS.

## Action Inputs

| Input Name       | Description                                                                                                         | Default      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- | ------------ |
| portainer-host   | Portainer host, eg. `https://myportainer.instance.com`                                                              | **Required** |
| username         | Username for the Portainer login. **NOTE: Do not use admin account!** Create a new CI specific login instead        | **Required** |
| password         | Password for the Portainer login                                                                                    | **Required** |
| stack-name       | Name for the Portainer stack                                                                                        | **Required** |
| stack-definition | The path to the docker-compose stack stack definition file, eg. `stack-definition.yml`                              | **Required** |
| image            | The URI of the container image to insert into the stack definition, eg.`docker.pkg.github.com/username/repo/master` | **Required** |

## Examples

The example below shows how the `portainer-stack-deploy` action can be used to deploy a fresh version of your app to Portainer.

```yaml
Coming soon!
```