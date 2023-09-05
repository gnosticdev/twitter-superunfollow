import {
    Selectors,
    getInnerProfiles,
    getUnfollowButton,
} from '@/content/utils/ui-elements'
import { $viewResults, createResultsContainer, getResultsDiv } from './search'
import {
    $followingCount,
    $unfollowing,
    removeFollowing,
    removeUnfollowing,
} from '@/content/stores/persistent'
import {
    $isUnfollowing,
    $superUnfollowButtonState,
} from '@/content/stores/unfollow-button'
import { randomDelay } from './utils/ui-elements'
import { prettyConsole } from './utils/console'
import { waitForElement } from './utils/wait-promise'
import { scrollToLastChild, scrollToProfile } from './utils/scroll'
import { atom } from 'nanostores'

// Track the profiles that have been unfollowed
export const $unfollowedProfiles = atom<ProfilesMap>(new Map())

function addUnfollowedProfile(handle: string, profile: ProfileDetail) {
    const unfollowedProfiles = $unfollowedProfiles.get()
    console.log('unfollowed profile', profile)
    unfollowedProfiles.set(handle, profile)
    $unfollowedProfiles.set(
        new Map([...Array.from(unfollowedProfiles.entries())])
    )

    return profile
}

/**
 * Unfollows the first section of profiles loaded on the page (if any)
 * Then scrolls down the page and unfollows the rest
 */
export async function startSuperUnfollow() {
    console.log('starting super unfollow')
    $viewResults.set('unfollowing')
    const firstProfileToUnfollow = $unfollowing.get().values().next()
        .value as ProfileDetail
    console.log('first profile to unfollow: ', firstProfileToUnfollow)
    if (firstProfileToUnfollow) {
        await scrollToProfile(firstProfileToUnfollow)
        // get all profiles already loaded on the page
        const profiles = getInnerProfiles()
        profiles.forEach(async (profile) => {
            if ($isUnfollowing.get()) {
                await superUnfollow(profile)
                await randomDelay(1000, 2000)
            }
        })
        // scroll down the page and the watcher will pick up the rest
        await scrollUnfollow()
    }
}

/**
 * Scrolls down the page and unfollows the profiles loaded on the page.
 * @returns {Promise<void>}
 */
async function scrollUnfollow() {
    while ($isUnfollowing.get()) {
        // superUnfollow handled by MutationObserver in main.ts
        try {
            await scrollToLastChild()
            // delay a random number from 1500 - 3000 ms
            await randomDelay(1500, 3000)
            // continue scrolling
            await scrollUnfollow()
        } catch (error) {
            console.error(error)
            return
        }
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
export async function superUnfollow(profile: ProfileInner): Promise<void> {
    try {
        const { handle } = profile.dataset
        if ($isUnfollowing.get() && handle && $unfollowing.get().has(handle)) {
            const unfollowed = await unfollow(profile)
            await randomDelay(1000, 2000)

            if (!unfollowed) {
                $superUnfollowButtonState.set('paused')
                throw new Error('unfollow failed')
            }

            if ($unfollowing.get().size === 0) {
                prettyConsole('Unfollowed all accounts!')
                $superUnfollowButtonState.set('done')
                return
            }
        }
    } catch (error) {
        console.error(error)
        return
    }
}

/**
 * Unfollows a profile as selected by the user.
 * @param {HTMLElement} profile - profile to unfollow
 * @returns {Promise<void>}
 */
async function unfollow(profile: ProfileInner) {
    try {
        const { handle } = profile.dataset
        // click the unfollow button
        const unfollowButton = getUnfollowButton(profile)

        if (!unfollowButton || !handle) {
            throw new Error(
                !handle ? 'no handle found' : 'no unfollow button for ' + handle
            )
        }

        unfollowButton.click()
        await randomDelay(1000, 2000)
        const confirmUnfollow = await waitForElement(Selectors.UF_CONFIRM)
        if (!confirmUnfollow) {
            throw new Error('no confirm unfollow button found')
        }
        confirmUnfollow.click()
        // blur and gray out unfollowed profiles
        profile.style.filter = 'blur(1px) grayscale(100%) brightness(0.5)'
        // add profile to unfollowed store
        addUnfollowedProfile(handle, $unfollowing.get().get(handle)!)
        // remove profile from unfollowing store
        removeUnfollowing(handle)
        removeFollowing(handle)
        $followingCount.set($followingCount.get() - 1)

        return true
    } catch (error) {
        console.error(error)
        return false
    }
}

/* display the unfollowed handles in the results section of the dialog while superUnfollow is running
 * @param {ProfilesMap} unfollowed - the profiles that have been unfollowed
 * */
export const showUnfollowed = (unfollowed: ProfilesMap) => {
    console.log('displaying unfollowed', unfollowed)
    $viewResults.set('unfollowed-done')
    const resultsDiv = getResultsDiv()
    const unfollowedContainer = createResultsContainer('unfollowed-done')
    const list = document.createElement('ol')
    list.type = '1'
    list.classList.add('su-search-result')
    // Show the profiles to be unfollowed, then cross them off as they are unfollowed
    Array.from($unfollowing.get()).forEach(([handle, profile]) => {
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
    console.log('unfollowed container', unfollowedContainer)
}
