import {
	$collectedFollowing,
	$unfollowingList,
} from '@/content/stores/persistent'
import { Selectors } from '@/content/utils/ui-elements'
import { $userData } from '@/shared/storage'
import type { ProfileDetail, ProfilesMap } from '@/shared/types'
import { atom } from 'nanostores'
import { handleChange } from './ui/checkboxes'

type Results = 'search' | 'unfollowing' | 'stats' | 'none'

export const $searchResults = atom<ProfilesMap>(new Map())
export const $viewResults = atom<Results>('none')
export const $searchInput = atom<string>('')

$viewResults.listen((view) => {
	const resultsDiv = getResultsDiv()
	// clear the results div
	resultsDiv.innerHTML = ''
	switch (view) {
		case 'search':
			resultsDiv.append(showResults($searchResults.get(), 'search'))
			break
		case 'unfollowing':
			resultsDiv.append(showResults($unfollowingList.get(), 'unfollowing'))
			break
		case 'stats':
			displayTwitterStats().then((statsContainer) => {
				resultsDiv.append(statsContainer)
			})
			break
		case 'none':
			// Do nothing, keep the results div empty
			break
		default:
			break
	}
})

/**
 * Handles the radio button change for view tabs
 */
export function handleViewTabs(e: Event): void {
	const currentTarget = e.currentTarget as HTMLInputElement
	$viewResults.set(currentTarget.value as Results)
}

// Add this new function to fetch and display stats
async function displayTwitterStats() {
	const statsContainer = document.createElement('div')
	statsContainer.classList.add('su-stats-container')

	const table = document.createElement('table')
	table.classList.add('su-stats-table')

	const thead = document.createElement('thead')
	const headerRow = document.createElement('tr')
	const thStat = document.createElement('th')
	thStat.textContent = 'Statistic'
	const thValue = document.createElement('th')
	thValue.textContent = 'Value'
	headerRow.appendChild(thStat)
	headerRow.appendChild(thValue)
	thead.appendChild(headerRow)
	table.appendChild(thead)

	const tbody = document.createElement('tbody')
	const entries = await $userData.getEntries()
	for (const [key, value] of entries) {
		const row = document.createElement('tr')
		const tdStat = document.createElement('td')
		tdStat.textContent = key.replace(/_/g, ' ')
		const tdValue = document.createElement('td')
		tdValue.textContent = value.toString()
		row.appendChild(tdStat)
		row.appendChild(tdValue)
		tbody.appendChild(row)
	}
	table.appendChild(tbody)

	statsContainer.appendChild(table)
	const resultsContainer = createResultsContainer('stats')
	resultsContainer.append(statsContainer)

	return resultsContainer
}

// ... rest of the existing code ...
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
	const statsButton = document.getElementById(
		'su-view-stats',
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
	} else if (currentTarget.isSameNode(statsButton)) {
		searchResultsBtn.checked = false
		viewUnfollowingBtn.checked = false
		currentTarget.checked ? $viewResults.set('stats') : $viewResults.set('none')
	}
}

/**
 * Displays the search results or unfollowing list in the dialog
 */
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

// Update createResultsContainer function
export function createResultsContainer(resultType: Results) {
	const title = document.createElement('h4')
	title.classList.add('su-results-title')

	switch (resultType) {
		case 'search': {
			const searchInput = $searchInput.get()
			title.innerHTML = `Search results for: <span class="su-highlight">${
				searchInput === '.*' ? 'all profiles' : searchInput
			}</span>`
			break
		}
		case 'unfollowing':
			title.textContent = 'Unfollowing List'
			break
		case 'stats':
			title.textContent = 'Twitter Stats'
			break
		default:
			break
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
