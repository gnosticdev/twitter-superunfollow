import { Storage } from '@plasmohq/storage'

class SyncStorage<T extends { [K in keyof T]: T[K] } = TwitterUserData> {
    namespace = 'SuperUnfollow_'
    private storage: Storage
    constructor() {
        this.storage = new Storage({ copiedKeyList: ['screen_name'] })
        this.storage.setNamespace(this.namespace)
    }
    async getValue<K extends keyof T & string>(key: K): Promise<T[K]> {
        return this.storage.get(key)
    }

    async setValue<K extends keyof T & string>(
        key: K,
        value: T[K]
    ): Promise<void> {
        return this.storage.set(key, value)
    }

    async setValues(data: T): Promise<void> {
        for (const [key, value] of objectEntries(data)) {
            await this.setValue(
                key as keyof T & string,
                value as T[keyof T & string]
            )
        }
    }

    watch<K extends keyof T & string>(
        key: K,
        callback: (change: { newValue: T[K]; oldValue: T[K]; key: K }) => void
    ) {
        this.storage.watch({
            [key]: (change) => {
                callback({
                    newValue: change.newValue as T[K],
                    oldValue: change.oldValue as T[K],
                    key: key,
                })
            },
        })
    }
    subscribe<K extends keyof T & string>(key: K): Promise<T[K]> {
        return new Promise((resolve) => {
            this.watch(key, (change) => {
                resolve(change.newValue)
            })
        })
    }
}

interface SessionStorageKV {
    contentTabId: number
    newTabId: number
}

class SessionStorage<K extends keyof SessionStorageKV> {
    namespace = 'SuperUnfollow_'
    private storage: Storage
    constructor() {
        this.storage = new Storage({ area: 'session' })
        this.storage.setNamespace(this.namespace)
    }

    async getValue(key: K): Promise<SessionStorageKV[K]> {
        const value = await this.storage.get(key.toString())
        return parseInt(value) satisfies SessionStorageKV[K]
    }

    async setValue(key: K, value: SessionStorageKV[K]) {
        return this.storage.set(key, value)
    }
}

export const syncStorage$ = new SyncStorage<TwitterUserData>()
export const sessionStorage$ = new SessionStorage()

export function objectEntries<T extends { [key in keyof T]: T[key] }>(obj: T) {
    return Object.entries(obj) as Array<[keyof T, T[keyof T]]>
}
