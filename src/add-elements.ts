import { $unfollowList, superUnfollow } from './main'
import { getProfileDetails } from './profiles'
import { updateUnfollowing, getUnfollowList, prettyConsole } from './utils'

export function addSuperUnfollowButton(dialog: HTMLDialogElement) {
    prettyConsole('adding superUnfollow button')
    const container = document.createElement('div')
    container.classList.add('superUnfollow', 'su-button-container')
    container.id = 'superUnfollow-button-container'
    const startUnfollowButton = document.createElement('button')
    const unfollowList = getUnfollowList()
    if (unfollowList.size > 0) {
        startUnfollowButton.classList.add('active')
        startUnfollowButton.innerText = `SuperUnfollow ${unfollowList.size} Users`
    } else {
        startUnfollowButton.classList.remove('active')
        startUnfollowButton.innerText = 'No Users Selected'
    }

    startUnfollowButton.classList.add('su-button')
    startUnfollowButton.addEventListener('click', superUnfollow)
    container.appendChild(startUnfollowButton)
    dialog.appendChild(container)
}

export const updateUnfollowButton = () => {
    const superUnfollowBtn = document.querySelector(
        '#superUnfollow-button-container button'
    ) as HTMLButtonElement
    const { size } = $unfollowList.get()
    if (size > 0) {
        superUnfollowBtn.classList.add('active')
        superUnfollowBtn.innerText = `SuperUnfollow ${size} Users`
    } else {
        superUnfollowBtn.classList.remove('active')
        superUnfollowBtn.innerText = 'No Users Selected'
    }
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
    const unfollowList = getUnfollowList()
    checkbox.checked = unfollowList.has(handle)
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

    // check if the checkbox was checked from the search dialog or the following page

    const handle = target.value
    if (!handle) {
        throw 'no handle found for profile'
    }
    const unfollowList = getUnfollowList()
    if (target.checked && !unfollowList.has(handle)) {
        console.log(`adding ${handle} to unfollowList`)
        unfollowList.add(handle)
    } else {
        console.log(`removing ${handle} from unfollowList`)
        unfollowList.delete(handle)
    }
    updateUnfollowing(unfollowList)

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

    prettyConsole(`unfollowList updated: ${unfollowList.size} profiles`)
}
