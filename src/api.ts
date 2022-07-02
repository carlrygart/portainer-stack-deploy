import axios from 'axios'

type EnvVariables = Array<{
  name: string
  value: string
}>
type EndpointId = number

type StackData = {
  Id: number
  Name: string
  EndpointId: EndpointId
  Env: EnvVariables
}

type CreateStackParams = { type: number; method: string; endpointId: EndpointId }
type CreateStackBody = { name: string; stackFileContent: string; swarmID?: string }
type UpdateStackParams = { endpointId: EndpointId }
type UpdateStackBody = { env: EnvVariables; stackFileContent: string }

export type MappersmithErrorObject = {
  responseStatus?: number
  responseData?: string
  originalRequest?: {
    methodDescriptor?: {
      path?: string
      method?: string
    }
  }
}

export class PortainerApi {
  private axiosInstance

  constructor(host: string) {
    this.axiosInstance = axios.create({
      baseURL: `${host}/api`
    })
  }

  async login({ username, password }: { username: string; password: string }): Promise<void> {
    const { data } = await this.axiosInstance.post<{ jwt: string }>('/auth', {
      username,
      password
    })
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.jwt}`
  }

  async logout(): Promise<void> {
    await this.axiosInstance.post('/auth/logout')
    this.axiosInstance.defaults.headers.common['Authorization'] = ''
  }

  async getStacks(): Promise<StackData[]> {
    const { data } = await this.axiosInstance.get<StackData[]>('/stacks')
    return data
  }

  async createStack(params: CreateStackParams, body: CreateStackBody): Promise<void> {
    await this.axiosInstance.post('/stacks', body, { params })
  }

  async updateStack(id: number, params: UpdateStackParams, body: UpdateStackBody): Promise<void> {
    await this.axiosInstance.post(`/stacks/${id}`, body, { params })
  }
}
