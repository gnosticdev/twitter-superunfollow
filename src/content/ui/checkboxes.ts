import {
	$following,
	$unfollowingList,
	addUnfollowing,
	removeUnfollowing,
} from '@/content/stores/persistent'
import { Selectors } from '@/content/utils/ui-elements'
import type { ProfileDetail, ProfileInner } from '@/shared/types'

/**
 * Adds a checkbox to a profile on the /following page. When checked, the profile will be added to the $unfollowing store
 */
export async function addCheckbox(
	profileInner: ProfileInner,
	profileDetails: ProfileDetail,
) {
	const unfollowButton = profileInner.querySelector(Selectors.UF_BUTTON)
	if (!unfollowButton) {
		throw 'no unfollow button found'
	}

	const { handle } = profileDetails
	if (!handle) {
		throw 'no handle found'
	}
	// create the checkbox
	const checkbox = document.createElement('input')
	checkbox.type = 'checkbox'
	checkbox.addEventListener('change', handleChange)
	checkbox.checked = $unfollowingList.get().has(handle)
	// put the checkbox container before the unfollow button
	const container = document.createElement('div')
	container.classList.add('superUnfollow', 'su-checkbox-container')
	container.appendChild(checkbox)
	unfollowButton.parentElement?.before(container)

	profileInner.setAttribute('data-unfollow', checkbox.checked.toString())
	profileInner.setAttribute('data-handle', handle)
	checkbox.value = handle

	return profileDetails
}

// handles selecting a single checkbox either in the search dialog or on the following page
export const handleChange = (event: Event) => {
	const target = event.target as HTMLInputElement
	if (!target) {
		throw 'no target found'
	}

	const handle = target.value
	if (!handle) {
		throw 'no handle found for profile'
	}

	const profileDetails = $following.get().get(handle)
	if (!profileDetails) {
		throw `no profile details found for ${handle}`
	}

	if (target.checked) {
		addUnfollowing(handle, profileDetails)
	} else {
		removeUnfollowing(handle)
	}

	const profile = document.querySelector(`[data-handle="${handle}"]`)
	// if no profile is found, it's probably because the user scrolled down and the profile was removed from the DOM
	if (profile) {
		const cb = profile.querySelector(
			'input[type="checkbox"]',
		) as HTMLInputElement
		if (!cb) {
			throw 'no checkbox found'
		}
		cb.checked = target.checked

		profile.setAttribute('data-unfollow', target.checked.toString())
	}
}
