import type { TwitterUserData } from '@/shared/types'
import { Storage } from '@plasmohq/storage'

class SyncStorage<
	T extends { [K in keyof T & string]: T[K] } = TwitterUserData,
> {
	namespace = 'SuperUnfollow_'
	private storage: Storage
	constructor(copyList?: Array<keyof T & string>) {
		this.storage = new Storage({
			copiedKeyList: copyList,
		})
		this.storage.setNamespace(this.namespace)
	}
	async getValue<K extends keyof T & string>(
		key: K,
	): Promise<T[K] | undefined> {
		return this.storage.get(key)
	}

	async getEntries(): Promise<[keyof T, T[keyof T]][]> {
		return objectEntries((await this.storage.getAll()) as T)
	}
	/**
	 * Set the value. If it is a secret, it will only be set in extension storage. Returns a warning if storage capacity is almost full. Throws error if the new item will make storage full
	 * @param key
	 * @param value
	 * @returns {Promise<any>} a warning if storage capacity is almost full. Throws error if the new item will make storage full
	 */
	async setValue<K extends keyof T & string>(
		key: K,
		value: T[K],
	): Promise<T[K]> {
		await this.storage.set(key, value)
		return value
	}
	async setValues(data: T): Promise<void> {
		for (const [key, value] of objectEntries(data)) {
			await this.setValue(key as keyof T & string, value as T[keyof T & string])
		}
	}
	/**
	 * Watch for changes to the key's value
	 * @param key
	 * @param callback
	 */
	watch<K extends keyof T & string>(
		key: K,
		callback: (change: { newValue: T[K]; oldValue: T[K]; key: K }) => void,
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
	/**
	 * Notifies when the key's value changes and returns the new value
	 * @param key
	 * @returns {Promise<T[K]>} the value of the key
	 */
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
		if (!value) return 0
		return Number.parseInt(value) satisfies SessionStorageKV[K]
	}
	async setValue(key: K, value: SessionStorageKV[K]) {
		return this.storage.set(key, value)
	}
}
/**
 * SyncStorage for TwitterUserData
 */
export const $userData = new SyncStorage<TwitterUserData>([
	'screen_name',
	'friends_count',
	'blocked_by',
	'blocking',
	'can_media_tag',
	'followers_count',
	'listed_count',
	'muting',
	'withheld_in_countries',
	'statuses_count',
])
export const $sessionStorage = new SessionStorage()

export function objectEntries<T extends { [key in keyof T]: T[key] }>(obj: T) {
	return Object.entries(obj) as Array<[keyof T, T[keyof T]]>
}
