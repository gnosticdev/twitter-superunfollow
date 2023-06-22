import { getProfileDetails } from './profiles'
import {
    $unfollowing,
    addUnfollowing,
    handleButtonState,
    removeUnfollowing,
} from './stores'
import { prettyConsole } from './utils'

export function addStartButton(dialog: HTMLDialogElement) {
    prettyConsole('adding superUnfollow button')
    const container = document.createElement('div')
    container.classList.add('superUnfollow', 'su-button-container')
    container.id = 'superUnfollow-button-container'

    const superUnfollowBtn = document.createElement('button')
    superUnfollowBtn.classList.add('su-button', 'large')
    // starting the super unfollow process
    superUnfollowBtn.addEventListener('click', handleButtonState)
    superUnfollowBtn.id = 'superUnfollow-button'
    container.append(superUnfollowBtn)
    dialog.appendChild(container)
}

/**
 * add checkboxes to each profile on the following page. If the checkbox is checked, the profile will be unfollowed when the unfollow button is clicked
 * also needs to process profiles that were checked, then removed while scrolling, then added back
 */
export async function addCheckbox(profile: HTMLElement) {
    const unfollowButton = profile.querySelector('[data-testid *= "unfollow"]')
    if (!unfollowButton) {
        throw 'no unfollow button found'
    }
    const { handle } = await getProfileDetails(profile)
    if (!handle) {
        throw 'no handle found'
    }
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.addEventListener('change', handleChange)
    const unfollowing = $unfollowing.get()
    checkbox.checked = unfollowing.has(handle)
    // put the checkbox contttainer before the unfollow button
    const container = document.createElement('div')
    container.classList.add('superUnfollow', 'su-checkbox-container')
    container.appendChild(checkbox)
    unfollowButton.parentElement?.before(container)
    profile.setAttribute('data-unfollow', checkbox.checked.toString())
    profile.setAttribute('data-handle', handle)
    checkbox.value = handle
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

    if (target.checked) {
        console.log(`adding ${handle} to unfollowing`)
        addUnfollowing(handle)
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
