import { lookup } from 'dns/promises'
import { bold, cyan, dim, green, white } from 'kolorist'
import { networkInterfaces } from 'os'
import { Logger } from 'vite'

export interface Hostname {
  /** undefined sets the default behaviour of server.listen */
  host: string | undefined
  /** resolve to localhost when possible */
  name: string
  /** if it is using the default behavior */
  implicit: boolean
}

export async function resolveHostname(
  optionsHost: string | boolean | undefined
): Promise<Hostname> {
  let host: string | undefined
  if (optionsHost === undefined || optionsHost === false) {
    // Use a secure default
    host = 'localhost'
  } else if (optionsHost === true) {
    // If passed --host in the CLI without arguments
    host = undefined // undefined typically means 0.0.0.0 or :: (listen on all IPs)
  } else {
    host = optionsHost
  }

  // Set host name to localhost when possible
  let name = host === undefined || wildcardHosts.has(host) ? 'localhost' : host

  if (host === 'localhost') {
    // See #8647 for more details.
    const localhostAddr = await getLocalhostAddressIfDiffersFromDNS()
    if (localhostAddr) {
      name = localhostAddr
    }
  }

  return { host, name, implicit: optionsHost === undefined }
}

export async function getLocalhostAddressIfDiffersFromDNS(): Promise<
  string | undefined
> {
  const [nodeResult, dnsResult] = await Promise.all([
    lookup('localhost'),
    lookup('localhost', { verbatim: true })
  ])
  const isSame =
    nodeResult.family === dnsResult.family &&
    nodeResult.address === dnsResult.address
  return isSame ? undefined : nodeResult.address
}

export const loopbackHosts = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '0000:0000:0000:0000:0000:0000:0000:0001'
])

export const wildcardHosts = new Set([
  '0.0.0.0',
  '::',
  '0000:0000:0000:0000:0000:0000:0000:0000'
])

export function printServerUrls(
  hostname: Hostname,
  protocol: string,
  port: number,
  base: string,
  info: Logger['info']
): void {
  const urls: Array<{ label: string; url: string; disabled?: boolean }> = []
  const notes: Array<{ label: string; message: string }> = []

  if (hostname.host && loopbackHosts.has(hostname.host)) {
    let hostnameName = hostname.name
    if (
      hostnameName === '::1' ||
      hostnameName === '0000:0000:0000:0000:0000:0000:0000:0001'
    ) {
      hostnameName = `[${hostnameName}]`
    }

    urls.push({
      label: 'Local',
      url: cyan(
        `${protocol}://${hostnameName}:${bold(port)}${base}`
      )
    })

    if (hostname.implicit) {
      urls.push({
        label: 'Network',
        url: `use ${white(bold('--host'))} to expose`,
        disabled: true
      })
    }
  } else {
    Object.values(networkInterfaces())
      .flatMap((nInterface) => nInterface ?? [])
      .filter(
        (detail) =>
          detail &&
          detail.address &&
          // Node < v18
          ((typeof detail.family === 'string' && detail.family === 'IPv4') ||
            // Node >= v18
            (typeof detail.family === 'number' && detail.family === 4))
      )
      .forEach((detail) => {
        const host = detail.address.replace('127.0.0.1', hostname.name)
        const url = `${protocol}://${host}:${bold(port)}${base}`
        const label = detail.address.includes('127.0.0.1') ? 'Local' : 'Network'

        urls.push({ label, url: cyan(url) })
      })
  }

  const length = Math.max(
    ...[...urls, ...notes].map(({ label }) => label.length)
  )
  const print = (
    iconWithColor: string,
    label: string,
    messageWithColor: string,
    disabled?: boolean
  ) => {
    const message = `  ${iconWithColor}  ${
      label ? bold(label) + ':' : ' '
    } ${' '.repeat(length - label.length)}${messageWithColor}`
    info(disabled ? dim(message) : message)
  }

  urls.forEach(({ label, url: text, disabled }) => {
    print(green('➜'), label, text, disabled)
  })
  notes.forEach(({ label, message: text }) => {
    print(white('❖'), label, text)
  })
}