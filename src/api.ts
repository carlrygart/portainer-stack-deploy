import forge, { Client, Middleware, Response, setContext } from 'mappersmith'
import EncodeJson from 'mappersmith/middleware/encode-json'

type ClientConfig = {
  host: string
}

type PortainerResources = {
  Auth: {
    login: Response
    logout: Response
  }
  Stacks: {
    all: Response
    updateStack: Response
    createStack: Response
  }
}

type AuthContext = {
  jwtToken: string
}

type AuthData = {
  jwt: string
}

export type StackData = {
  Id: number
  Name: string
  EndpointId: number
}

const AccessTokenMiddleware: Middleware = ({ context }) => ({
  request(request) {
    return request.enhance({
      headers: { Authorization: `Bearer ${(context as AuthContext).jwtToken}` }
    })
  }
})

const SetAccessTokenMiddleware: Middleware = () => ({
  async response(next) {
    // eslint-disable-next-line github/no-then
    return next().then(response => {
      const { jwt }: AuthData = response.data()
      setContext({ jwtToken: jwt })
      return response
    })
  }
})

export function createPortainerApi({
  host
}: ClientConfig): Client<PortainerResources> {
  return forge({
    clientId: 'portainerClient',
    host,
    middleware: [EncodeJson],
    resources: {
      Auth: {
        login: {
          path: '/auth',
          method: 'post',
          middleware: [SetAccessTokenMiddleware]
        },
        logout: {
          path: '/auth/logout',
          method: 'post',
          middleware: [AccessTokenMiddleware]
        }
      },
      Stacks: {
        all: {
          path: '/stacks',
          middleware: [AccessTokenMiddleware]
        },
        createStack: {
          path: '/stacks',
          method: 'post',
          middleware: [AccessTokenMiddleware]
        },
        updateStack: {
          path: '/stacks/{id}',
          method: 'put',
          middleware: [AccessTokenMiddleware]
        }
      }
    }
  })
}
