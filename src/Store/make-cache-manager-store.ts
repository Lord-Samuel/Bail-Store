import { proto } from 'baileys'
import { AuthenticationCreds } from 'baileys'
import { BufferJSON, initAuthCreds } from 'baileys'
import logger from 'baileys/lib/Utils/logger'
import { createCache, type Cache } from 'cache-manager'

const makeCacheManagerAuthState = async(store: Cache, sessionKey: string) => {
    const defaultKey = (file: string): string => `${sessionKey}:${file}`

    const databaseConn = store

    const writeData = async(file: string, data: object) => {
        let ttl: number | undefined = undefined
        if(file === 'creds') {
            ttl = 63115200 // 2 years
        }

        await databaseConn.set(
            defaultKey(file),
            JSON.stringify(data, BufferJSON.replacer),
            ttl
        )
    }

    const readData = async(file: string): Promise<AuthenticationCreds | null> => {
        try {
            const data = await databaseConn.get(defaultKey(file))

            if(data) {
                return JSON.parse(data as string, BufferJSON.reviver)
            }

            return null
        } catch(error) {
            logger.error(error)
            return null
        }
    }

    const removeData = async(file: string) => {
        try {
            return await databaseConn.del(defaultKey(file))
        } catch {
            logger.error(`Error removing ${file} from session ${sessionKey}`)
        }
    }

    const clearState = async() => {
        try {
            // In cache-manager v7, there's no direct keys() method
            // This would need to be implemented based on the specific store being used
            // For now, we'll leave this as a placeholder
            console.warn('clearState not fully implemented for cache-manager v7')
        } catch(err) {
            // Handle error
        }
    }

    const creds: AuthenticationCreds = (await readData('creds')) || initAuthCreds()

    return {
        clearState,
        saveCreds: () => writeData('creds', creds),
        state: {
            creds,
            keys: {
                get: async(type: string, ids: string[]) => {
                    // Fix: Add proper type annotation for the data object
                    const data: { [key: string]: proto.Message.AppStateSyncKeyData | AuthenticationCreds | null } = {}

                    await Promise.all(
                        ids.map(async(id) => {
                            let value: proto.Message.AppStateSyncKeyData | AuthenticationCreds | null = await readData(`${type}-${id}`)
                            
                            if(type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value)
                            }

                            data[id] = value
                        })
                    )

                    return data
                },
                // Fix: Add proper type annotation for the data parameter
                set: async(data: { [category: string]: { [id: string]: any } }) => {
                    const tasks: Promise<void>[] = []

                    for(const category in data) {
                        for(const id in data[category]) {
                            const value = data[category][id]
                            const key = `${category}-${id}`
                            if (value) {
                                tasks.push(writeData(key, value))
                            } else {
                                const removalResult = await removeData(key)
                                if (removalResult !== undefined) {
                                    tasks.push(Promise.resolve())
                                }
                            }
                        }
                    }

                    await Promise.all(tasks)
                },
            }
        }
    }
}

export default makeCacheManagerAuthState
