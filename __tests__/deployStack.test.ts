import { MockAssert, install, m, mockRequest, uninstall } from 'mappersmith/test'
import { deployStack } from '../src/deployStack'

type MockRequestCall = {
  requestParams: object
}

jest.mock('@actions/core')

process.env.GITHUB_WORKSPACE = './'

describe('deployStack', () => {
  let updateStackMock: MockAssert
  let updateStackMockWithEnv: MockAssert
  let createSwarmStackMock: MockAssert
  let createComposeStackMock: MockAssert
  let createComposeEndpoint2StackMock: MockAssert

  beforeEach(() => {
    install()

    mockRequest({
      method: 'post',
      url: 'http://mock.url/api/auth',
      body: JSON.stringify({ username: 'username', password: 'password' }),
      response: {
        status: 200,
        body: { jwt: 'token' }
      }
    })

    mockRequest({
      method: 'get',
      url: 'http://mock.url/api/stacks',
      response: {
        status: 200,
        body: [{ Id: 2, Name: 'stack-name', EndpointId: 1 }, { Id: 3, Name: 'stack-name-with-env', EndpointId: 1, Env: [{key1: "value1"}] }]
      }
    })

    updateStackMock = mockRequest({
      method: 'put',
      url: 'http://mock.url/api/stacks/2?endpointId=1',
      body: m.anything(),
      response: {
        status: 200
      }
    })

    updateStackMockWithEnv = mockRequest({
      method: 'put',
      url: 'http://mock.url/api/stacks/3?endpointId=1',
      body: m.anything(),
      response: {
        status: 200
      }
    })

    createSwarmStackMock = mockRequest({
      method: 'post',
      url: 'http://mock.url/api/stacks?type=1&method=string&endpointId=1',
      body: m.anything(),
      response: {
        status: 200
      }
    })

    createComposeStackMock = mockRequest({
      method: 'post',
      url: 'http://mock.url/api/stacks?type=2&method=string&endpointId=1',
      body: m.anything(),
      response: {
        status: 200
      }
    })

    createComposeEndpoint2StackMock = mockRequest({
      method: 'post',
      url: 'http://mock.url/api/stacks?type=2&method=string&endpointId=2',
      body: m.anything(),
      response: {
        status: 200
      }
    })

    mockRequest({
      method: 'post',
      url: 'http://mock.url/api/auth/logout',
      response: {
        status: 200
      }
    })
  })

  afterEach(() => uninstall())

  test('deploy swarm stack', async () => {
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
    expect(createSwarmStackMock.callsCount()).toBe(1)
    const createStackCall = createSwarmStackMock.mostRecentCall() as unknown
    expect((createStackCall as MockRequestCall).requestParams).toEqual({
      type: 1,
      method: 'string',
      endpointId: 1,
      headers: {
        Authorization: 'Bearer token',
        'content-type': 'application/json;charset=utf-8'
      },
      body: '{"name":"new-stack-name","stackFileContent":"version: \'3.7\'\\n\\nservices:\\n  server:\\n    image: ghcr.io/username/repo:sha-0142c14\\n    deploy:\\n      update_config:\\n        order: start-first\\n","swarmID":"s4ny2nh7qt8lluhvddeu9ulwl"}'
    })
  })

  test('deploy compose stack', async () => {
    await deployStack({
      portainerHost: 'http://mock.url',
      username: 'username',
      password: 'password',
      endpointId: 1,
      stackName: 'new-stack-name',
      stackDefinitionFile: 'example-stack-definition.yml',
      image: 'ghcr.io/username/repo:sha-0142c14'
    })
    expect(createComposeStackMock.callsCount()).toBe(1)
    const createStackCall = createComposeStackMock.mostRecentCall() as unknown
    expect((createStackCall as MockRequestCall).requestParams).toEqual({
      type: 2,
      method: 'string',
      endpointId: 1,
      headers: {
        Authorization: 'Bearer token',
        'content-type': 'application/json;charset=utf-8'
      },
      body: '{"name":"new-stack-name","stackFileContent":"version: \'3.7\'\\n\\nservices:\\n  server:\\n    image: ghcr.io/username/repo:sha-0142c14\\n    deploy:\\n      update_config:\\n        order: start-first\\n"}'
    })
  })

  test('deploy existing stack', async () => {
    await deployStack({
      portainerHost: 'http://mock.url',
      username: 'username',
      password: 'password',
      endpointId: 1,
      stackName: 'stack-name',
      stackDefinitionFile: 'example-stack-definition.yml',
      image: 'ghcr.io/username/repo:sha-0142c14'
    })
    expect(updateStackMock.callsCount()).toBe(1)
    const updateStackCall = updateStackMock.mostRecentCall() as unknown
    expect((updateStackCall as MockRequestCall).requestParams).toEqual({
      id: 2,
      endpointId: 1,
      headers: {
        Authorization: 'Bearer token',
        'content-type': 'application/json;charset=utf-8'
      },
      body: '{"stackFileContent":"version: \'3.7\'\\n\\nservices:\\n  server:\\n    image: ghcr.io/username/repo:sha-0142c14\\n    deploy:\\n      update_config:\\n        order: start-first\\n"}'
    })
  })

  test('deploy existing stack with env', async () => {
    await deployStack({
      portainerHost: 'http://mock.url',
      username: 'username',
      password: 'password',
      endpointId: 1,
      stackName: 'stack-name-with-env',
      stackDefinitionFile: 'example-stack-definition.yml',
      image: 'ghcr.io/username/repo:sha-0142c14'
    })
    expect(updateStackMockWithEnv.callsCount()).toBe(1)
    const updateStackCall = updateStackMockWithEnv.mostRecentCall() as unknown
    expect((updateStackCall as MockRequestCall).requestParams).toEqual({
      id: 3,
      endpointId: 1,
      headers: {
        Authorization: 'Bearer token',
        'content-type': 'application/json;charset=utf-8'
      },
      body: '{"env":[{"key1":"value1"}],"stackFileContent":"version: \'3.7\'\\n\\nservices:\\n  server:\\n    image: ghcr.io/username/repo:sha-0142c14\\n    deploy:\\n      update_config:\\n        order: start-first\\n"}'
    })
  })

  test('deploy with explicit endpoint id', async () => {
    await deployStack({
      portainerHost: 'http://mock.url',
      username: 'username',
      password: 'password',
      endpointId: 2,
      stackName: 'new-stack-name',
      stackDefinitionFile: 'example-stack-definition.yml',
      image: 'ghcr.io/username/repo:sha-0142c14'
    })
    expect(createComposeEndpoint2StackMock.callsCount()).toBe(1)
    const createStackCall = createComposeEndpoint2StackMock.mostRecentCall() as unknown
    expect((createStackCall as MockRequestCall).requestParams).toEqual({
      type: 2,
      method: 'string',
      endpointId: 2,
      headers: {
        Authorization: 'Bearer token',
        'content-type': 'application/json;charset=utf-8'
      },
      body: '{"name":"new-stack-name","stackFileContent":"version: \'3.7\'\\n\\nservices:\\n  server:\\n    image: ghcr.io/username/repo:sha-0142c14\\n    deploy:\\n      update_config:\\n        order: start-first\\n"}'
    })
  })

  test('deploy without specific image', async () => {
    await deployStack({
      portainerHost: 'http://mock.url',
      username: 'username',
      password: 'password',
      endpointId: 1,
      stackName: 'new-stack-name',
      stackDefinitionFile: 'example-stack-definition.yml'
    })
    expect(createComposeStackMock.callsCount()).toBe(1)
    const createStackCall = createComposeStackMock.mostRecentCall() as unknown
    expect((createStackCall as MockRequestCall).requestParams).toEqual({
      type: 2,
      method: 'string',
      endpointId: 1,
      headers: {
        Authorization: 'Bearer token',
        'content-type': 'application/json;charset=utf-8'
      },
      body: '{"name":"new-stack-name","stackFileContent":"version: \'3.7\'\\n\\nservices:\\n  server:\\n    image: ghcr.io/username/repo:latest\\n    deploy:\\n      update_config:\\n        order: start-first\\n"}'
    })
  })

  test('deploy with template variables', async () => {
    await deployStack({
      portainerHost: 'http://mock.url',
      username: 'username',
      password: 'password',
      endpointId: 1,
      stackName: 'new-stack-name',
      stackDefinitionFile: 'example-stack-definition-with-template-variables.yml',
      templateVariables: { username: 'testUsername' }
    })
    expect(createComposeStackMock.callsCount()).toBe(1)
    const createStackCall = createComposeStackMock.mostRecentCall() as unknown
    expect((createStackCall as MockRequestCall).requestParams).toEqual({
      type: 2,
      method: 'string',
      endpointId: 1,
      headers: {
        Authorization: 'Bearer token',
        'content-type': 'application/json;charset=utf-8'
      },
      body: '{"name":"new-stack-name","stackFileContent":"version: \'3.7\'\\n\\nservices:\\n  server:\\n    image: ghcr.io/testUsername/repo:latest\\n    deploy:\\n      update_config:\\n        order: start-first\\n"}'
    })
  })
})
