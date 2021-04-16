import createPortainerApi, {StackData} from './api'
import path from 'path'
import fs from 'fs'
import * as core from '@actions/core'

interface DeployStack {
  portainerHost: string
  username: string
  password: string
  stackName: string
  stackDefinitionFile: string
  image: string
}

export default async function deployStack({
  portainerHost,
  username,
  password,
  stackName,
  stackDefinitionFile,
  image
}: DeployStack): Promise<void> {
  const portainerApi = createPortainerApi({host: `${portainerHost}/api`})

  await portainerApi.Auth.login({
    body: {
      username,
      password
    }
  })

  const allStacks: StackData[] = (await portainerApi.Stacks.all()).data()

  const stack = allStacks.find((s: StackData) => s.Name === stackName)
  if (!stack) {
    throw new Error(`Could not find stack-name: ${stackName}`)
  }

  const stackDefFilePath = path.join(
    process.env.GITHUB_WORKSPACE as string,
    stackDefinitionFile
  )
  const stackDefinition = fs.readFileSync(stackDefFilePath, 'utf8')
  if (!stackDefinition) {
    throw new Error(`Could not find stack-definition file: ${stackDefFilePath}`)
  }

  const imageWithoutTag = image.substring(0, image.indexOf(':'))
  const stackDefinitionToDeploy = stackDefinition.replace(
    new RegExp(`${imageWithoutTag}(:.*)?\n`),
    `${image}\n`
  )

  core.debug('Deploying new stack definition')
  core.debug(stackDefinitionToDeploy)

  await portainerApi.Stacks.updateStack({
    id: stack.Id,
    endpointId: stack.EndpointId,
    body: {
      stackFileContent: stackDefinitionToDeploy
    }
  })

  await portainerApi.Auth.logout()
}
