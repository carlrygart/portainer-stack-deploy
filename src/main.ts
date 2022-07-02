import * as core from '@actions/core'
import axios from 'axios'
import { deployStack } from './deployStack'

export async function run(): Promise<void> {
  try {
    const portainerHost: string = core.getInput('portainer-host', {
      required: true
    })
    const username: string = core.getInput('username', {
      required: true
    })
    const password: string = core.getInput('password', {
      required: true
    })
    const swarmId: string = core.getInput('swarm-id', {
      required: false
    })
    const endpointId: string = core.getInput('endpoint-id', {
      required: false
    })
    const stackName: string = core.getInput('stack-name', {
      required: true
    })
    const stackDefinitionFile: string = core.getInput('stack-definition', {
      required: true
    })
    const templateVariables: string = core.getInput('template-variables', {
      required: false
    })
    const image: string = core.getInput('image', {
      required: false
    })

    await deployStack({
      portainerHost,
      username,
      password,
      swarmId,
      endpointId: parseInt(endpointId) || 1,
      stackName,
      stackDefinitionFile,
      templateVariables: templateVariables ? JSON.parse(templateVariables) : undefined,
      image
    })
    core.info('✅ Deployment done')
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const {
        status,
        data,
        config: { url, method }
      } = error.response
      return core.setFailed(`AxiosError HTTP Status ${status} (${method} ${url}): ${data}`)
    }
    return core.setFailed(error as Error)
  }
}

run()
