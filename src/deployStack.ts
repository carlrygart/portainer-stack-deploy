import { createPortainerApi, StackData } from './api'
import path from 'path'
import fs from 'fs'
import * as core from '@actions/core'

type DeployStack = {
  portainerHost: string
  username: string
  password: string
  swarmId?: string
  stackName: string
  stackDefinitionFile: string
  image?: string
}

enum StackType {
  SWARM = 1,
  COMPOSE = 2
}

function generateNewStackDefinition(
  stackDefinitionFile: string,
  image?: string
): string {
  const stackDefFilePath = path.join(
    process.env.GITHUB_WORKSPACE as string,
    stackDefinitionFile
  )
  core.info(`Reading stack definition file from ${stackDefFilePath}`)
  const stackDefinition = fs.readFileSync(stackDefFilePath, 'utf8')
  if (!stackDefinition) {
    throw new Error(`Could not find stack-definition file: ${stackDefFilePath}`)
  }

  if (!image) {
    core.info(`No new image provided, using existing stack definition`)
    return stackDefinition
  }

  const imageWithoutTag = image.substring(0, image.indexOf(':'))
  core.info(`Inserting image ${image} into the stack definition`)
  return stackDefinition.replace(
    new RegExp(`${imageWithoutTag}(:.*)?\n`),
    `${image}\n`
  )
}

export async function deployStack({
  portainerHost,
  username,
  password,
  swarmId,
  stackName,
  stackDefinitionFile,
  image
}: DeployStack): Promise<void> {
  const portainerApi = createPortainerApi({ host: `${portainerHost}/api` })

  const stackDefinitionToDeploy = generateNewStackDefinition(
    stackDefinitionFile,
    image
  )
  core.debug(stackDefinitionToDeploy)

  core.info('Logging in to Portainer instance...')
  await portainerApi.Auth.login({
    body: {
      username,
      password
    }
  })

  const allStacks: StackData[] = (await portainerApi.Stacks.all()).data()
  const existingStack = allStacks.find((s: StackData) => s.Name === stackName)

  if (existingStack) {
    core.info(`Found existing stack with name: ${stackName}`)
    core.info('Updating existing stack...')
    await portainerApi.Stacks.updateStack({
      id: existingStack.Id,
      endpointId: existingStack.EndpointId,
      body: {
        stackFileContent: stackDefinitionToDeploy
      }
    })
    core.info('Successfully updated existing stack')
  } else {
    core.info('Deploying new stack...')
    await portainerApi.Stacks.createStack({
      type: swarmId ? StackType.SWARM : StackType.COMPOSE,
      method: 'string',
      endpointId: 1,
      body: {
        name: stackName,
        stackFileContent: stackDefinitionToDeploy,
        swarmID: swarmId ? swarmId : undefined
      }
    })
    core.info(`Successfully created new stack with name: ${stackName}`)
  }

  core.info(`Logging out from Portainer instance...`)
  await portainerApi.Auth.logout()
}
