import nock from 'nock'
import { deployStack } from '../src/deployStack'

jest.mock('@actions/core')

process.env.GITHUB_WORKSPACE = './'

describe('deployStack', () => {
  beforeAll(() => {
    nock('http://mock.url/api').persist().post('/auth').reply(200, { jwt: 'token' })
    nock('http://mock.url/api').persist().post('/auth/logout').reply(200)
    nock('http://mock.url/api')
      .persist()
      .get('/stacks')
      .reply(200, [
        { Id: 2, Name: 'stack-name', EndpointId: 1 },
        {
          Id: 3,
          Name: 'stack-name-with-env',
          EndpointId: 1,
          Env: [{ name: 'keyName', value: 'value1' }]
        }
      ])
  })

  test('deploy swarm stack', async () => {
    const createSwarmStackMock = nock('http://mock.url/api')
      .matchHeader('authorization', 'Bearer token')
      .matchHeader('content-type', 'application/json')
      .post('/stacks', {
        name: 'new-stack-name',
        stackFileContent:
          "version: '3.7'\n\nservices:\n  server:\n    image: ghcr.io/username/repo:sha-0142c14\n    deploy:\n      update_config:\n        order: start-first\n",
        swarmID: 's4ny2nh7qt8lluhvddeu9ulwl'
      })
      .query({
        type: 1,
        method: 'string',
        endpointId: 1
      })
      .reply(200)

    await deployStack({
      portainerHost: 'http://mock.url',
      username: 'username',
      password: 'password',
      swarmId: 's4ny2nh7qt8lluhvddeu9ulwl',
      endpointId: 1,
      stackName: 'new-stack-name',
      stackDefinitionFile: 'example-stack-definition.yml',
      image: 'ghcr.io/username/repo:sha-0142c14'
    })

    createSwarmStackMock.isDone()
  })

  test('deploy compose stack', async () => {
    const createComposeStackMock = nock('http://mock.url/api')
      .matchHeader('authorization', 'Bearer token')
      .matchHeader('content-type', 'application/json')
      .post('/stacks', {
        name: 'new-compose-stack-name',
        stackFileContent:
          "version: '3.7'\n\nservices:\n  server:\n    image: ghcr.io/username/repo:sha-0142c14\n    deploy:\n      update_config:\n        order: start-first\n"
      })
      .query({
        type: 2,
        method: 'string',
        endpointId: 1
      })
      .reply(200)

    await deployStack({
      portainerHost: 'http://mock.url',
      username: 'username',
      password: 'password',
      endpointId: 1,
      stackName: 'new-compose-stack-name',
      stackDefinitionFile: 'example-stack-definition.yml',
      image: 'ghcr.io/username/repo:sha-0142c14'
    })

    createComposeStackMock.isDone()
  })

  test('deploy existing stack', async () => {
    const updateStackMock = nock('http://mock.url/api')
      .matchHeader('authorization', 'Bearer token')
      .matchHeader('content-type', 'application/json')
      .post('/stacks/2', {
        stackFileContent:
          "version: '3.7'\n\nservices:\n  server:\n    image: ghcr.io/username/repo:sha-0142c14\n    deploy:\n      update_config:\n        order: start-first\n"
      })
      .query({
        endpointId: 1
      })
      .reply(200)

    await deployStack({
      portainerHost: 'http://mock.url',
      username: 'username',
      password: 'password',
      endpointId: 1,
      stackName: 'stack-name',
      stackDefinitionFile: 'example-stack-definition.yml',
      image: 'ghcr.io/username/repo:sha-0142c14'
    })

    updateStackMock.isDone()
  })

  test('deploy existing stack with env', async () => {
    const updateStackMockWithEnv = nock('http://mock.url/api')
      .matchHeader('authorization', 'Bearer token')
      .matchHeader('content-type', 'application/json')
      .post('/stacks/3', {
        env: [{ name: 'keyName', value: 'value1' }],
        stackFileContent:
          "version: '3.7'\n\nservices:\n  server:\n    image: ghcr.io/username/repo:sha-0142c14\n    deploy:\n      update_config:\n        order: start-first\n"
      })
      .query({
        endpointId: 1
      })
      .reply(200)

    await deployStack({
      portainerHost: 'http://mock.url',
      username: 'username',
      password: 'password',
      endpointId: 1,
      stackName: 'stack-name-with-env',
      stackDefinitionFile: 'example-stack-definition.yml',
      image: 'ghcr.io/username/repo:sha-0142c14'
    })

    updateStackMockWithEnv.isDone()
  })

  test('deploy with explicit endpoint id', async () => {
    const createComposeStackWithEndpointMock = nock('http://mock.url/api')
      .matchHeader('authorization', 'Bearer token')
      .matchHeader('content-type', 'application/json')
      .post('/stacks', {
        name: 'new-stack-name',
        stackFileContent:
          "version: '3.7'\n\nservices:\n  server:\n    image: ghcr.io/username/repo:sha-0142c14\n    deploy:\n      update_config:\n        order: start-first\n"
      })
      .query({
        type: 2,
        method: 'string',
        endpointId: 2
      })
      .reply(200)

    await deployStack({
      portainerHost: 'http://mock.url',
      username: 'username',
      password: 'password',
      endpointId: 2,
      stackName: 'new-stack-name',
      stackDefinitionFile: 'example-stack-definition.yml',
      image: 'ghcr.io/username/repo:sha-0142c14'
    })

    createComposeStackWithEndpointMock.isDone()
  })

  test('deploy without specific image', async () => {
    const createComposeStackMock = nock('http://mock.url/api')
      .matchHeader('authorization', 'Bearer token')
      .matchHeader('content-type', 'application/json')
      .post('/stacks', {
        name: 'new-stack-name',
        stackFileContent:
          "version: '3.7'\n\nservices:\n  server:\n    image: ghcr.io/username/repo:latest\n    deploy:\n      update_config:\n        order: start-first\n"
      })
      .query({
        type: 2,
        method: 'string',
        endpointId: 1
      })
      .reply(200)

    await deployStack({
      portainerHost: 'http://mock.url',
      username: 'username',
      password: 'password',
      endpointId: 1,
      stackName: 'new-stack-name',
      stackDefinitionFile: 'example-stack-definition.yml'
    })

    createComposeStackMock.isDone()
  })

  test('deploy with template variables', async () => {
    const createComposeStackMock = nock('http://mock.url/api')
      .matchHeader('authorization', 'Bearer token')
      .matchHeader('content-type', 'application/json')
      .post('/stacks', {
        name: 'new-stack-name',
        stackFileContent:
          "version: '3.7'\n\nservices:\n  server:\n    image: ghcr.io/testUsername/repo:latest\n    deploy:\n      update_config:\n        order: start-first\n"
      })
      .query({
        type: 2,
        method: 'string',
        endpointId: 1
      })
      .reply(200)

    await deployStack({
      portainerHost: 'http://mock.url',
      username: 'username',
      password: 'password',
      endpointId: 1,
      stackName: 'new-stack-name',
      stackDefinitionFile: 'example-stack-definition-with-template-variables.yml',
      templateVariables: { username: 'testUsername' }
    })

    createComposeStackMock.isDone()
  })
})
