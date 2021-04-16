import * as core from '@actions/core'
import deployStack from './deployStack'

export async function run(): Promise<void> {
  try {
    const portainerHost: string = core.getInput('portainer-host')
    const username: string = core.getInput('username')
    const password: string = core.getInput('password')
    const stackName: string = core.getInput('stack-name')
    const stackDefinitionFile: string = core.getInput('stack-definition')
    const image: string = core.getInput('image')

    await deployStack({
      portainerHost,
      username,
      password,
      stackName,
      stackDefinitionFile,
      image
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
