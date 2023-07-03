import { handleSearch, handleViewButton, rightChevron } from './search'
import { $following, $followingCount, $unfollowing } from '@/store/persistent'
import {
    $collectFollowingState,
    handleCollectBtn,
} from '@/store/collect-button'
import {
    $superUnfollowButtonState,
    handleSuperUnfollowBtn,
    setUnfollowBtn,
} from '@/store/unfollow-button'

export async function addSearchDialog() {
    // Create the dialog and the input and submit elements
    const dialog = document.createElement('dialog')
    dialog.id = 'su-dialog'
    dialog.classList.add('superUnfollow', 'su-search-dialog')
    dialog.role = 'dialog'

    // create container to hold all elements in dialog
    const dialogContainer = document.createElement('div')
    dialogContainer.classList.add('superUnfollow', 'su-search-dialog-container')
    dialog.appendChild(dialogContainer)

    const closeButton = document.createElement('button')
    closeButton.innerHTML =
        '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 10.586l4.95-4.95a1 1 0 1 1 1.414 1.414L13.414 12l4.95 4.95a1 1 0 0 1-1.414 1.414L12 13.414l-4.95 4.95a1 1 0 0 1-1.414-1.414L10.586 12 5.636 7.05a1 1 0 0 1 1.414-1.414L12 10.586z"></path></svg>'

    closeButton.classList.add('superUnfollow', 'su-close-button')
    closeButton.addEventListener('click', () => {
        dialog.close()
    })

    // close dialog when user clicks outside of it
    dialog.addEventListener('click', closeDialog.bind(dialog))

    const heading = document.createElement('h2')
    heading.textContent = 'Search For Accounts To Unfollow'
    heading.classList.add('superUnfollow', 'su-heading')
    const subHeading = document.createElement('p')
    subHeading.classList.add('superUnfollow', 'su-sub-heading')
    subHeading.textContent =
        'Enter a keyword to search usernames, handles, and bios of accounts you follow'
    const headingContainer = document.createElement('div')
    headingContainer.classList.add(
        'su-heading-container',
        'su-search-heading-container'
    )
    headingContainer.append(heading, subHeading)
    // Create the input and submit search elements
    const input = document.createElement('input')
    input.type = 'text'
    input.id = 'su-search-input'

    const searchButton = document.createElement('button')
    searchButton.textContent = 'Search'
    searchButton.classList.add('su-search-button')
    // when user clicks 'search' - any partial match of username or handle are returned, or any full word match of description. The search results are appended to the dialog or replace the previous results.
    searchButton.addEventListener('click', handleSearch)

    // search input and button container
    const inputContainer = document.createElement('div')
    inputContainer.id = 'su-search-input-container'
    inputContainer.classList.add('su-search-input-container')
    inputContainer.append(input, searchButton)

    const headingInputContainer = document.createElement('div')
    headingInputContainer.classList.add(
        'superUnfollow',
        'su-heading-input-container'
    )
    headingInputContainer.append(headingContainer, inputContainer)

    // add a results div that gets cleared when the search button is clicked
    const resultsContainer = document.createElement('div')
    resultsContainer.id = 'su-results'
    resultsContainer.classList.add('superUnfollow', 'su-results')

    // Create the show dialog button and attach it to the top right of the screen
    const showModalButton = createShowModalButton(dialog)
    const metricsContainer = createMetrics(
        $followingCount.get(),
        $following.get().size
    )

    const notice = createNotice()

    const modalButtons = createModalButtons()

    // append elements to dialog
    dialogContainer.append(
        headingInputContainer,
        closeButton,
        metricsContainer,
        notice,
        modalButtons,
        resultsContainer
    )

    // Add the dialog and show modal button  to the end of the page
    document.body.appendChild(dialog)
    document.body.appendChild(showModalButton)

    return dialog
}

const createModalButtons = () => {
    const modalBtnsContainer = document.createElement('div')
    modalBtnsContainer.classList.add('su-modal-buttons-container')

    const collectButton = createCollectBtn()
    const startButton = createSuperUnfollowBtn()
    const collectUnfollowContainer = document.createElement('div')
    collectUnfollowContainer.classList.add('su-collect-superunfollow-container')
    collectUnfollowContainer.append(collectButton, startButton)

    const viewButton = createViewBtn()

    modalBtnsContainer.append(viewButton, collectUnfollowContainer)

    return modalBtnsContainer
}

export function createSuperUnfollowBtn() {
    const superUnfollowBtn = document.createElement('button')
    superUnfollowBtn.classList.add('su-button', 'super-unfollow')
    superUnfollowBtn.disabled = true
    superUnfollowBtn.textContent = 'Unfollow'
    setUnfollowBtn($unfollowing.get().size, superUnfollowBtn)
    // starting the super unfollow process
    superUnfollowBtn.addEventListener('click', handleSuperUnfollowBtn)
    superUnfollowBtn.id = 'superUnfollow-button'

    return superUnfollowBtn
}

export const createShowModalButton = (dialog: HTMLDialogElement) => {
    const modalButton = document.createElement('button')
    modalButton.id = 'su-show-modal-button'
    modalButton.textContent = 'SuperUnfollow'
    modalButton.classList.add(
        'superUnfollow',
        'su-button',
        'su-modal',
        'small',
        'active'
    )

    modalButton.addEventListener('click', () => {
        dialog.showModal()
    })

    return modalButton
}

export function createCollectBtn() {
    const collectBtn = document.createElement('button')
    collectBtn.classList.add('su-button', 'small', 'outline', 'alt')
    collectBtn.id = 'su-collect-following-button'
    collectBtn.textContent = 'Collect'
    collectBtn.addEventListener('click', handleCollectBtn)

    return collectBtn
}

export const createViewBtn = () => {
    const viewUnfollowing = document.createElement('button')
    viewUnfollowing.classList.add('no-border', 'su-button', 'view-following')
    viewUnfollowing.id = 'su-view-button'
    viewUnfollowing.innerHTML = 'List  ' + rightChevron
    viewUnfollowing.addEventListener('click', handleViewButton)

    return viewUnfollowing
}

export function createMetrics(count: number, size: number) {
    // section that tells user that they should collect their following list. Shown when $followingCount > $following.get().size
    const metricsContainer = document.createElement('div')
    metricsContainer.classList.add('su-metrics-container')
    metricsContainer.id = 'su-metrics-container'
    const metrics = document.createElement('div')
    metrics.classList.add('su-metrics')
    metrics.id = 'su-metrics'
    const followingNumber = document.createElement('span')
    followingNumber.classList.add('su-highlight')
    followingNumber.textContent = count.toString()
    const lastCollected = document.createElement('span')
    lastCollected.classList.add('su-highlight')
    lastCollected.textContent = size.toString()
    metrics.innerHTML = `<div>Following: ${followingNumber.outerHTML}</div><div>Collected: ${lastCollected.outerHTML}</div>`

    // only show notice if collectFollowing has been run on the current session
    metricsContainer.append(metrics)
    return metricsContainer
}

// Notice updated by collectFollowing button state
export const createNotice = () => {
    const notice = document.createElement('div')
    notice.classList.add('su-notice')
    notice.id = 'su-notice'
    notice.textContent = 'Click Collect to get all accounts you follow'
    return notice
}

function closeDialog(
    this: HTMLDialogElement,
    { currentTarget, clientX, clientY }: MouseEvent
) {
    if (
        $collectFollowingState.get() === 'running' ||
        $collectFollowingState.get() === 'resumed' ||
        $superUnfollowButtonState.get() === 'running'
    )
        return
    const { left, right, top, bottom } = (
        currentTarget as HTMLDialogElement
    ).getBoundingClientRect()

    if (
        clientX < left ||
        clientX > right ||
        clientY < top ||
        clientY > bottom
    ) {
        this.close()
    }
}

// cleanup
// close dialog if open when navigating away
window.addEventListener('beforeunload', () => {
    console.log('unloading')
    const dialog = document.getElementById(
        'su-dialog'
    ) as HTMLDialogElement | null
    if (dialog?.open) {
        dialog.close()
    }
})
