import { $collectFollowingState } from '@/content/stores/collect-button'
import { $superUnfollowButtonState } from '@/content/stores/unfollow-button'
import { handleSearch, handleViewButtons } from '../search'
import { createMetrics, createNotice } from './metrics'

export async function addDialogToDom(followingSection: HTMLElement) {
	// if already added, remove it
	const existingDialog = document.getElementById('su-dialog')
	if (existingDialog) {
		existingDialog.remove()
	}
	// Create the dialog and the input and submit elements
	const dialog = document.createElement('dialog')
	dialog.id = 'su-dialog'
	dialog.classList.add('superUnfollow', 'su-dialog')
	dialog.role = 'dialog'

	// create container to hold all elements in dialog
	const dialogContainer = document.createElement('div')
	dialogContainer.classList.add('superUnfollow', 'su-dialog-container')
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
	// Create the input and submit search elements
	const input = document.createElement('input')
	input.type = 'text'
	input.id = 'su-search-input'
	input.placeholder = 'Enter a search term'
	input.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault()
			handleSearch(e)
		}
	})
	const searchButton = document.createElement('button')
	searchButton.textContent = 'Search'
	searchButton.classList.add('su-button', 'su-search-button')
	searchButton.addEventListener('click', handleSearch)

	// search input and button container
	const searchContainer = document.createElement('div')
	searchContainer.id = 'su-search-container'
	searchContainer.classList.add('su-search-container')
	searchContainer.append(input, searchButton)
	// when user clicks 'search' - any partial match of username or handle are returned, or any full word match of description. The search results are appended to the dialog or replace the previous results.

	const headingInputContainer = document.createElement('div')
	headingInputContainer.classList.add('su-heading-input-container')
	headingInputContainer.append(heading, subHeading, searchContainer)

	// add a results div that gets cleared when the search button is clicked
	const resultsContainer = document.createElement('div')
	resultsContainer.id = 'su-results'
	resultsContainer.classList.add('superUnfollow', 'su-results')

	// Create the show dialog button and attach it to the top right of the screen
	const metricsContainer = await createMetrics()
	const notice = await createNotice()

	const modalButtons = createModalButtons()
	const viewButtons = createViewButtons()
	const viewResultsContainer = document.createElement('div')
	viewResultsContainer.id = 'su-view-results-container'
	viewResultsContainer.classList.add('su-view-results-container')
	viewResultsContainer.append(viewButtons, resultsContainer)

	// append elements to dialog
	dialogContainer.append(
		closeButton,
		headingInputContainer,
		metricsContainer,
		notice,
		modalButtons,
		viewResultsContainer,
	)
	// append the container to the dialog
	dialog.appendChild(dialogContainer)

	// create the show modal button
	const showModalContainer = createShowModalButton(dialog)

	// append the button to the top of the Following section
	followingSection.firstElementChild!.prepend(showModalContainer)
	followingSection.prepend(dialog)

	return dialog
}

function createModalButtons() {
	const modalBtnsContainer = document.createElement('div')
	modalBtnsContainer.classList.add('su-modal-buttons-container')

	const collectButton = createCollectBtn()
	const startButton = createSuperUnfollowBtn()
	modalBtnsContainer.append(collectButton, startButton)

	return modalBtnsContainer
}

export function createSuperUnfollowBtn() {
	const superUnfollowBtn = document.createElement('button')
	superUnfollowBtn.classList.add('su-button', 'super-unfollow')
	superUnfollowBtn.textContent = 'Start Unfollow'
	// starting the super unfollow process
	// start superunfollow process
	const handleUnfollowButton = () => {
		const state = $superUnfollowButtonState.get()
		console.log('superunfollow button state:', state)
		switch (state) {
			case 'done':
			case 'ready':
				$superUnfollowButtonState.set('running')
				break
			case 'running':
				$superUnfollowButtonState.set('paused')
				break
			case 'paused':
				$superUnfollowButtonState.set('running')
				break
			// 'done' doesnt get set by the button click, use a computed store for that...
			default:
				break
		}
	}
	superUnfollowBtn.addEventListener('click', handleUnfollowButton)
	superUnfollowBtn.id = 'superUnfollow-button'

	return superUnfollowBtn
}

export function createShowModalButton(dialog: HTMLDialogElement) {
	const modalButton = document.createElement('button')
	modalButton.id = 'su-show-modal-button'
	modalButton.textContent = 'SuperUnfollow'
	modalButton.classList.add('superUnfollow', 'su-button', 'su-show-modal')

	modalButton.addEventListener('click', () => {
		dialog.showModal()
	})

	const showModalContainer = document.createElement('div')
	showModalContainer.classList.add('su-show-modal-container', 'superUnfollow')
	// append the show modal button to the container
	showModalContainer.append(modalButton)

	// Adjust the button's position based on the header height
	const adjustButtonPosition = () => {
		const header = document.querySelector(
			'[aria-label="Home timeline"] > div',
		) as HTMLElement
		if (header) {
			const headerHeight = header.offsetHeight
			showModalContainer.style.top = `${headerHeight}px`
		}
	}

	// Call the function initially and on window resize
	adjustButtonPosition()
	window.addEventListener('resize', adjustButtonPosition)

	return showModalContainer
}

export function createCollectBtn() {
	const collectBtn = document.createElement('button')
	collectBtn.classList.add('su-button', 'alt')
	collectBtn.id = 'su-collect-following-button'
	collectBtn.textContent = 'Collect Following'
	const handleCollectButton = () => {
		switch ($collectFollowingState.get()) {
			case 'ready':
			case 'done':
				$collectFollowingState.set('running')
				break
			case 'running':
				$collectFollowingState.set('paused')
				break
			case 'paused':
				$collectFollowingState.set('running')
				break
			default:
				break
		}
	}
	collectBtn.addEventListener('click', handleCollectButton)

	return collectBtn
}

export function createViewButtons() {
	const viewButtonsContainer = document.createElement('div')
	viewButtonsContainer.classList.add('su-view-buttons-container')
	const viewUnfollowingBtn = createViewUnfollowingBtn()
	const viewSearchResultsBtn = createViewSearchResultsBtn()
	viewButtonsContainer.append(viewUnfollowingBtn, viewSearchResultsBtn)

	return viewButtonsContainer
}

export function createViewUnfollowingBtn() {
	const cb = document.createElement('input')
	cb.type = 'checkbox'
	cb.id = 'su-view-unfollowing'
	cb.classList.add('su-view-button')
	cb.addEventListener('change', handleViewButtons)

	const label = document.createElement('label')
	label.htmlFor = cb.id
	label.classList.add('su-view-button')
	label.textContent = 'List'

	label.appendChild(cb)

	return label
}

export function createViewSearchResultsBtn() {
	const input = document.createElement('input')
	input.type = 'checkbox'
	input.id = 'su-view-search-results'
	input.classList.add('su-view-button')
	input.addEventListener('change', handleViewButtons)

	const label = document.createElement('label')
	label.htmlFor = 'su-view-search-results'
	label.classList.add('su-view-button')
	label.textContent = 'Results'

	label.appendChild(input)

	return label
}

function closeDialog(
	this: HTMLDialogElement,
	{ currentTarget, clientX, clientY }: MouseEvent,
) {
	if (
		$collectFollowingState.get() === 'running' ||
		$superUnfollowButtonState.get() === 'running'
	)
		return
	const { left, right, top, bottom } = (
		currentTarget as HTMLDialogElement
	).getBoundingClientRect()

	if (clientX < left || clientX > right || clientY < top || clientY > bottom) {
		this.close()
	}
}

// cleanup
// close dialog if open when navigating away
window.addEventListener('beforeunload', () => {
	console.log('unloading')
	const dialog = document.getElementById(
		'su-dialog',
	) as HTMLDialogElement | null
	if (dialog?.open) {
		dialog.close()
	}
})
