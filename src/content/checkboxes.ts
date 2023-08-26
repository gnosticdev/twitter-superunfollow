import { Selectors } from '@/content/utils/utils'
import {
    $following,
    $unfollowing,
    addUnfollowing,
    removeUnfollowing,
} from '@/content/stores/persistent'

/**
 * add checkboxes to each profile on the following page. If the checkbox is checked, the profile will be unfollowed when the unfollow button is clicked
 * also needs to process profiles that were checked, then removed while scrolling, then added back
 */
export async function addCheckbox(
    profileInner: ProfileInner,
    profileDetails: ProfileDetails
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
    checkbox.checked = $unfollowing.get().has(handle)
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
        console.log(`adding ${handle} to unfollowing`)
        addUnfollowing(handle, profileDetails)
    } else {
        console.log(`removing ${handle} from unfollowing`)
        removeUnfollowing(handle)
    }

    const profile = document.querySelector(`[data-handle="${handle}"]`)
    // if no profile is found, it's probably because the user scrolled down and the profile was removed from the DOM
    if (!profile) {
        console.log(`profile for ${handle} not in view`)
    } else {
        const cb = profile.querySelector(
            'input[type="checkbox"]'
        ) as HTMLInputElement
        if (!cb) {
            throw 'no checkbox found'
        }
        cb.checked = target.checked

        profile.setAttribute('data-unfollow', target.checked.toString())
    }
}
