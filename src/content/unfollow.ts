import {
	$followingCount,
	$unfollowingList,
	$updateFollowingCount,
	removeFromCollectedFollowing,
	removeUnfollowing,
} from '@/content/stores/persistent'
import {
	$superUnfollowButtonState,
	isUnfollowing,
} from '@/content/stores/unfollow-button'
import {
	type ProcessedProfile,
	isProcessProfile,
} from '@/content/ui/checkboxes'
import { updateTotalFollowingText } from '@/content/ui/metrics'
import {
	Selectors,
	getInnerProfiles,
	getProfileUnfollowButton,
} from '@/content/utils/ui-elements'
import type { ProfileDetail, ProfileInner, ProfilesMap } from '@/shared/types'
import cc from 'kleur'
import { atom } from 'nanostores'
import { scrollToInfiniteBottom, waitForSmoothScroll } from './utils/scroll'
import { randomDelay } from './utils/ui-elements'
import { waitForElement } from './utils/wait-promise'
import {
	$viewResults,
	createResultsContainer,
	getProfileSearchCheckbox,
	getResultsDiv,
} from './views'

// Track the profiles that have been unfollowed
export const $unfollowedProfiles = atom<ProfilesMap>(new Map())

/**
 * Adds a profile to the unfollowed store
 * @param handle
 * @param profile
 */
function addUnfollowedProfile(handle: string, profile: ProfileDetail) {
	const unfollowedProfiles = $unfollowedProfiles.get()
	console.log('unfollowed profile', profile)
	unfollowedProfiles.set(handle, profile)
	$unfollowedProfiles.set(
		new Map([...Array.from(unfollowedProfiles.entries())]),
	)

	return profile
}

// adds a line-through and gray filter to the unfollowed profiles
$unfollowedProfiles.listen((value) => {
	const profiles = Array.from(value.entries())
	for (const [handle, _profile] of profiles) {
		const searchCheckbox = getProfileSearchCheckbox(handle)
		if (searchCheckbox) {
			searchCheckbox.classList.add('unfollowed')
		}
	}
})

/**
 * Unfollows the first section of profiles loaded on the page (if any)
 * Then scrolls down the page and unfollows the rest
 */
export async function startSuperUnfollow() {
	console.log(cc.yellow('starting super unfollow'))
	$viewResults.set('unfollowing')
	await waitForSmoothScroll(0)

	// get all profiles already loaded on the page
	const profiles = getInnerProfiles()
	for await (const profile of profiles) {
		const processed = await processUnfollow(profile)
		if (processed) {
			console.log('processed profile:', profile.dataset.handle)
			await randomDelay(1000, 2000)
		}
	}

	// scroll down the page and the watcher will pick up the rest
	await scrollAndUnfollow()
}

/**
 * Checks if a profile is in the unfollowing store, then unfollows it if it is
 */
export async function processUnfollow(profile: ProfileInner) {
	if (!isUnfollowing()) return false
	if (!isProcessProfile(profile)) return false

	const { handle } = profile.dataset
	if (!handle) return false

	if (!$unfollowingList.get().has(handle)) return false

	const unfollowed = await superUnfollow(profile)
	if (!unfollowed) {
		$superUnfollowButtonState.set('paused')
		return false
	}
	if ($unfollowingList.get().size === 0) {
		console.log(cc.bgGreen().blue('😎 unfollowed all accounts!'))
		$superUnfollowButtonState.set('done')
		return false
	}
	console.log(cc.red(`finished processing ${handle}`))
	return true
}
/**
 * Scrolls down the page and unfollows the profiles loaded on the page.
 */
async function scrollAndUnfollow() {
	console.log(cc.bgGreen().bold('scrolling and unfollowing...'))
	try {
		if (isUnfollowing()) {
			const isAtBottom = await scrollToInfiniteBottom()

			if (isAtBottom) {
				console.log('done unfollowing')
				$superUnfollowButtonState.set('done')
				return
			}

			// look for next profile to unfollow
			const profiles = getInnerProfiles()
			for await (const profile of profiles) {
				const processed = await processUnfollow(profile)
				if (processed) {
					console.log(
						cc
							.bgGreen()
							.black(`processed next profile: ${profile.dataset.handle}`),
					)
					await randomDelay(1000, 2000)
				}
			}

			await randomDelay(1000, 2000)

			console.log('continuing unfollowing...')
			return await scrollAndUnfollow()
		}
	} catch (error) {
		console.error(error)
		// Instead of returning, we'll continue the loop
	}
}
/**
 * - Unfollows a profile
 * - removes from unfollowing store
 * - adds to unfollowed store
 * - updates the UI
 * - delays a random number of milliseconds
 * - checks if there are any profiles left to unfollow
 * - if not, updates the UI
 * @param {ProfileInner} profile - profile to unfollow
 * @returns {Promise<void>}
 */
async function superUnfollow(profile: ProcessedProfile): Promise<boolean> {
	console.log(cc.green(`unfollowing ${profile.dataset.handle}`))
	try {
		const { handle } = profile.dataset

		// click the unfollow button
		const unfollowButton = getProfileUnfollowButton(profile)
		if (!unfollowButton || !handle) {
			throw new Error(
				!handle ? 'no handle found' : `no unfollow button for ${handle}`,
			)
		}

		// click the unfollow button on the right side of the profile
		unfollowButton.click()
		await randomDelay(500, 2000)
		const confirmUnfollowButton = await waitForElement({
			selector: Selectors.UF_CONFIRM,
		})
		if (!confirmUnfollowButton) {
			throw new Error('no confirm unfollow button found')
		}
		// this is the modal that pops up after clicking unfollow
		confirmUnfollowButton.click()
		// blur and gray out unfollowed profiles
		profile.style.filter = 'blur(1px) grayscale(100%) brightness(0.5)'
		// add profile to unfollowed store
		addUnfollowedProfile(handle, $unfollowingList.get().get(handle)!)
		// remove profile from unfollowing store
		removeUnfollowing(handle)
		removeFromCollectedFollowing(handle)
		const prevCount = await $followingCount()
		const newValue = await $updateFollowingCount(prevCount ? prevCount - 1 : 0)
		updateTotalFollowingText(newValue)

		return true
	} catch (error) {
		console.error(error)
		return false
	}
}

/* display the unfollowed handles in the results section of the dialog while superUnfollow is running
 * @param {ProfilesMap} unfollowed - the profiles that have been unfollowed
 * */
export const showUnfollowed = () => {
	const unfollowed = $unfollowedProfiles.get()
	console.log('displaying unfollowed', unfollowed)
	const resultsDiv = getResultsDiv()
	const unfollowedContainer = createResultsContainer('unfollowing')
	const list = document.createElement('ol')
	list.type = '1'
	list.classList.add('su-search-result')
	// Show the profiles to be unfollowed, then cross them off as they are unfollowed
	Array.from($unfollowingList.get()).forEach(([handle, profile]) => {
		const result = document.createElement('li')
		result.classList.add('su-list-item')
		unfollowed.has(handle) ? result.classList.add('success') : null
		result.innerHTML = `
        <div class="su-result-label">${profile.username}&nbsp;&nbsp;
        <span class="su-handle">${handle}</span></div>
        `
		result.textContent = `${profile.username} ${handle}`
		list.appendChild(result)
	})

	unfollowedContainer.appendChild(list)

	resultsDiv.appendChild(unfollowedContainer)
}
