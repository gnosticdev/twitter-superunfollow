import { $syncStorage } from '@/shared/storage'
import type { ProfileDetail } from '@/shared/types'
import { persistentAtom } from '@nanostores/persistent'
import { action } from 'nanostores'

/**
 * Map of profiles that are selected to be unfollowed by the user. Can be added/removed by checking the checkbox next to the profile, or from the dialog
 * The key is the user's handle, and the value is the profile details.
 */
export const $unfollowingList = persistentAtom(
	'unfollowing',
	new Map<string, ProfileDetail>(),
	{
		encode: (value) => {
			return JSON.stringify(Array.from(value.entries()))
		},
		decode: (value) => {
			return new Map(JSON.parse(value))
		},
	},
)

/**
 * Map of profiles that are being followed by the user. The key is the user's handle, and the value is the profile details.
 * Populated as the user scrolls through down following page, and profiles are added to the DOM. Also populated by using the Collect button.
 */

export const $collectedFollowing = persistentAtom(
	'following',
	new Map<string, ProfileDetail>(),
	{
		encode: (value) => {
			return JSON.stringify(Array.from(value.entries()))
		},
		decode: (value) => {
			return new Map(JSON.parse(value))
		},
	},
)

/**
 * the total number of accounts that are being followed by the user, according to the Twitter __INITIAL_STATE__ object, recorded at page load.
 */
export const $followingCount = async () =>
	await $syncStorage.getValue('friends_count')

/**
 * Adds a profile to the $unfollowing store
 * @param handle
 * @param profileData
 */
export function addUnfollowing(
	handle: string,
	profileData: ProfileDetail,
): ProfileDetail {
	const unfollowingMap = $unfollowingList.get()
	if (unfollowingMap.has(handle)) {
		return unfollowingMap.get(handle)!
	}
	// get the index from the length of the map
	const index = unfollowingMap.size
	// add the index to the user
	const profile = { ...profileData, index }
	$unfollowingList.set(new Map([...unfollowingMap.set(handle, profile)]))

	return $unfollowingList.get().get(handle)!
}

export const removeUnfollowing = action(
	$unfollowingList,
	'removeUnfollowing',
	async (store, handle: string) => {
		console.log('removing unfollowing', handle)
		const currentUnfollowing = store.get()
		currentUnfollowing.delete(handle)
		store.set(new Map([...Array.from(currentUnfollowing)]))

		return store.get()
	},
)

/**
 * Adds a profile to the `$collectedFollowing` store
 * @param handle
 * @param profileData
 */
export function addToCollectedFollowing(
	handle: string,
	profileData: Omit<ProfileDetail, 'index'>,
): ProfileDetail {
	const followingMap = $collectedFollowing.get()
	if (followingMap.has(handle)) {
		return followingMap.get(handle)!
	}
	// get the index from the length of the map
	const index = followingMap.size
	// add the index to the user
	const profile = { ...profileData, index }
	$collectedFollowing.set(new Map([...followingMap.set(handle, profile)]))

	return followingMap.get(handle)!
}

/**
 * Removes a profile from the $following store
 * @param handle
 */
export function removeFollowing(handle: string): Map<string, ProfileDetail> {
	const following = $collectedFollowing.get()
	following.delete(handle)
	$collectedFollowing.set(new Map([...Array.from(following)]))

	return $collectedFollowing.get()
}
