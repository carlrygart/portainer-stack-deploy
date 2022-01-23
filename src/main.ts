import * as core from '@actions/core'
import deployStack from './deployStack'

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
    const endpointId: number = parseInt(core.getInput('endpoint-id', {
      required: false
    }))
    const stackName: string = core.getInput('stack-name', {
      required: true
    })
    const stackDefinitionFile: string = core.getInput('stack-definition', {
      required: true
    })
    const templateVariables: object = JSON.parse(core.getInput('template-variables', {
      required: false
    }))
    const image: string = core.getInput('image', {
      required: false
    })

    await deployStack({
      portainerHost,
      username,
      password,
      swarmId,
      endpointId,
      stackName,
      stackDefinitionFile,
      templateVariables,
      image
    })
    core.info('✅ Deployment done')
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
