import {
	$collectedFollowing,
	$unfollowingList,
} from '@/content/stores/persistent'
import { Selectors } from '@/content/utils/ui-elements'
import type { ProfileDetail, ProfilesMap } from '@/shared/types'
import { atom } from 'nanostores'
import { handleChange } from './ui/checkboxes'

type Results = 'search' | 'unfollowing' | 'unfollowed-done' | 'none'

export const $searchResults = atom<ProfilesMap>(new Map())
export const $viewResults = atom<Results>('none')
export const $searchInput = atom<string>('')

$viewResults.listen((view) => {
	const resultsDiv = getResultsDiv()
	const viewUnfollowingBtn = document.getElementById(
		'su-view-unfollowing',
	) as HTMLInputElement
	const viewSearchResultsBtn = document.getElementById(
		'su-view-search-results',
	) as HTMLInputElement
	// clear the results div
	resultsDiv.innerHTML = ''
	switch (view) {
		case 'search':
			viewSearchResultsBtn.checked = true
			resultsDiv.append(showResults($searchResults.get(), 'search'))
			break
		case 'unfollowing':
			viewUnfollowingBtn.checked = true
			resultsDiv.append(showResults($unfollowingList.get(), 'unfollowing'))
			break
		case 'unfollowed-done':
		case 'none':
			// uncheck the view buttons
			viewUnfollowingBtn.checked = false
			viewSearchResultsBtn.checked = false
			break
		default:
			break
	}
})
/**
 * - creates a new div to hold the search results
 * - searches the $following store for the search term
 * - displays the results in the new div and appends it to the dialog results div
 */
export async function handleSearch(e: Event) {
	e.preventDefault()
	$viewResults.set('search')
	const input = document.getElementById('su-search-input') as HTMLInputElement
	const inputValue = input.value === '' ? '.*' : input.value
	$searchInput.set(inputValue)
	console.log(`searching for ${inputValue}`)
	const resultDiv = getResultsDiv()
	// clear the results div
	resultDiv.innerHTML = ''
	// display the results
	$searchResults.set(searchFollowingList(inputValue))

	const resultsContainer = showResults($searchResults.get(), 'search')
	resultDiv.append(resultsContainer)
}

/** @param {string} searchTerm */
export function searchFollowingList(searchTerm: string) {
	const results = new Map<string, ProfileDetail>()
	$collectedFollowing.get().forEach((entry) => {
		const { username, handle, description } = entry
		const wordRegex = new RegExp(`\\b${searchTerm}\\b`, 'i')
		const allRegex = new RegExp(searchTerm, 'i')
		// always search handle and username without word boundries, search description with word boundries
		if (
			allRegex.test(username) ||
			allRegex.test(handle) ||
			(description && wordRegex.test(description))
		) {
			results.set(handle, entry)
		}
	})

	return results
}

/**
 * Toggles between the search results and the unfollowing list
 */
export function handleViewButtons(e: Event): void {
	const searchResultsBtn = document.getElementById(
		'su-view-search-results',
	) as HTMLInputElement
	const viewUnfollowingBtn = document.getElementById(
		'su-view-unfollowing',
	) as HTMLInputElement

	const currentTarget = e.currentTarget as HTMLInputElement

	if (currentTarget.isSameNode(viewUnfollowingBtn)) {
		searchResultsBtn.checked = false
		currentTarget.checked
			? $viewResults.set('unfollowing')
			: $viewResults.set('none')
	} else if (currentTarget.isSameNode(searchResultsBtn)) {
		viewUnfollowingBtn.checked = false
		currentTarget.checked
			? $viewResults.set('search')
			: $viewResults.set('none')
	}
}

// display search results as a checkbox list with the option to select all
export function showResults(profiles: ProfilesMap, resultType: Results) {
	const resultsContainer = createResultsContainer(resultType)
	// if no results, display a message
	if (profiles.size === 0) {
		const noResults = document.createElement('p')
		noResults.classList.add('su-error')
		noResults.textContent =
			$searchInput.get() === '' && resultType === 'search'
				? 'Enter a search term'
				: resultType === 'search'
					? 'No results found'
					: 'Select profiles to unfollow'
		resultsContainer.append(noResults)
		return resultsContainer
	}
	// create the Select All checkbox
	const selectAllContainer = createSelectAll()
	resultsContainer.append(selectAllContainer)
	// create the checkboxes for each result
	for (const [handle, profile] of profiles) {
		const { username } = profile
		const checkbox = document.createElement('input')
		checkbox.type = 'checkbox'
		checkbox.id = `su-search-${handle}`
		checkbox.value = handle
		checkbox.checked = $unfollowingList.get().has(handle)
		checkbox.addEventListener('change', handleChange)
		const label = document.createElement('label')
		label.innerHTML = `<div class="su-result-label">${username}&nbsp;&nbsp;<span class="su-handle">${handle}</span></div>`
		label.htmlFor = checkbox.id
		const container = document.createElement('div')
		container.classList.add('su-search-result')
		container.id = `su-search-result-${handle}`
		label.appendChild(checkbox)
		container.appendChild(label)
		resultsContainer.appendChild(container)
	}
	return resultsContainer
}

export function getProfileSearchCheckbox(handle: string) {
	return document.getElementById(
		`su-search-result-${handle}`,
	) as HTMLInputElement
}

export function createResultsContainer(resultType: Results) {
	const title = document.createElement('h4')
	title.classList.add('su-results-title')

	if (resultType === 'search') {
		const searchInput = $searchInput.get()
		title.innerHTML = `Search results for: <span class="su-highlight">${
			searchInput === '.*' ? 'all profiles' : searchInput
		}</span>`
	} else if (resultType === 'unfollowing') {
		title.textContent = 'Unfollowing List'
	} else if (resultType === 'unfollowed-done') {
		title.textContent = 'Unfollowed Profiles'
	}

	const resultsContainer = document.createElement('div')
	resultsContainer.classList.add('su-results-inner')
	resultsContainer.id = 'su-results-inner'
	resultsContainer.append(title)

	return resultsContainer
}

const createSelectAll = () => {
	const selectAll = document.createElement('input')
	selectAll.type = 'checkbox'
	selectAll.id = 'su-search-select-all'
	selectAll.addEventListener('change', handleSelectAll)
	const selectAllLabel = document.createElement('label')
	selectAllLabel.textContent = 'Select All'
	selectAllLabel.htmlFor = 'su-search-select-all'
	const selectAllContainer = document.createElement('div')
	selectAllContainer.classList.add('su-search-result', 'su-select-all')
	selectAllLabel.appendChild(selectAll)
	selectAllContainer.appendChild(selectAllLabel)
	return selectAllContainer
}

/**
 * Selects all check boxes in the search results
 */
function handleSelectAll() {
	const selectAll = document.getElementById(
		'su-search-select-all',
	) as HTMLInputElement
	const checkboxes = document.querySelectorAll(
		Selectors.DIALOG_CHECKBOXES,
	) as NodeListOf<HTMLInputElement>

	for (const checkbox of checkboxes) {
		checkbox.checked = selectAll.checked
		checkbox.dispatchEvent(new Event('change'))
	}
}

export function getResultsDiv() {
	return document.getElementById('su-results') as HTMLDivElement
}
