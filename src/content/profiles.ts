import { addToCollectedFollowing } from '@/content/stores/persistent'
import { Selectors } from '@/content/utils/ui-elements'
import type {
	ProfileContainer,
	ProfileDetail,
	ProfileInner,
} from '@/shared/types'
import { type ProcessedProfile, addCustomAttributes } from './ui/checkboxes'
import { getProfileTranslateY, randomDelay } from './utils/ui-elements'

export async function processProfile(profile: ProfileInner) {
	try {
		if (profile.hasAttribute('data-unfollow')) {
			return profile as ProcessedProfile
		}
		const profileDetails = await getProfileDetails(profile)
		const fullProfileData = addToCollectedFollowing(
			profileDetails.handle,
			profileDetails,
		)
		const processedProfile = await addCustomAttributes(profile, fullProfileData)

		return processedProfile
	} catch (error) {
		console.error(error)
	}
}

export function getProfileByHandle(handle: string): ProfileInner | null {
	return document.querySelector<ProfileInner>(`[data-handle="${handle}"]`)
}

/**
 * get the profile details (handle, username, description if available) from the profile div on the following page)
 * @param {HTMLElement} profile - the profile div from the following page
 * @returns {Promise<ProfileData>} - at minimum, the handle and username is returned, and description if available
 */
export async function getProfileDetails(
	profile: ProfileInner,
): Promise<Omit<ProfileDetail, 'index'>> {
	// wait for the profile data to load
	// biome-ignore lint: confusing but works
	profile = await waitForProfileData(profile)
	// get the username, handle, and description from the profile div
	const links = profile.getElementsByTagName('a')
	const image = links[0].querySelector('img')?.src
	// some usernames do not have any text content, (emojis, etc)
	let username = links[1].textContent?.trim()
	const handle = links[2].textContent?.trim()
	const description = profile
		.querySelector(
			'[data-testid="cellInnerDiv"] [role="button"] [dir="auto"]:nth-of-type(2)',
		)
		?.textContent?.trim()
	if (!handle) {
		throw new Error('missing handle for profile data')
	}
	if (!username) {
		username = links[1].innerHTML
	}
	const profileContainer = profile.closest(
		Selectors.PROFILE_CONTAINER,
	) as ProfileContainer | null
	if (!profileContainer) {
		throw new Error('missing profile container for profile')
	}
	const scrollHeight = getProfileTranslateY(profileContainer)

	return { image, username, handle, description, scrollHeight }
}

// TODO: convert to waitForElement function
/**
 * @param {HTMLElement} profile - the profile div from the `/following` page
 * @returns {Promise<HTMLElement>} the profile div from the `/following` page
 */
async function waitForProfileData(
	profile: ProfileInner,
): Promise<ProfileInner> {
	let timeout = 5000
	return new Promise((resolve, reject) => {
		const checkProfile = () => {
			// use a live HTMLCollection to get the links, as the profile div is updated when the profile data loads
			const links = profile.getElementsByTagName('a')
			if (links.length >= 3 && links[2]?.textContent?.includes('@')) {
				resolve(profile)
			} else if (timeout <= 0) {
				reject(new Error('Timeout waiting for profile data'))
			} else {
				console.log('waiting for profile data', timeout)
				randomDelay(100).then(() => {
					timeout -= 100
					checkProfile()
				})
			}
		}

		checkProfile()
	})
}
