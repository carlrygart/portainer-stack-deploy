import forge, { Client, Middleware, setContext } from 'mappersmith'
import EncodeJson from 'mappersmith/middleware/encode-json'

interface ClientConfig {
  host: string
}

interface PortainerResources {
  Auth: {
    login: object
    logout: object
  }
  Stacks: {
    all: object
    updateStack: object
    createStack: object
  }
}

interface AuthContext {
  jwtToken: string
}

interface AuthData {
  jwt: string
}

export interface StackData {
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

export default function createPortainerApi({
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
