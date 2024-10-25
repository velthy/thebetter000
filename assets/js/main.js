document.addEventListener("DOMContentLoaded", function () {
	// Mouse movement tracking for custom properties
	window.addEventListener('mousemove', (e) => {
		document.body.style.setProperty('--mx', `${e.clientX}px`);
		document.body.style.setProperty('--my', `${e.clientY}px`);
	});

	// Toggle site panel functionality
	const toggleButton = document.querySelector('.toggle-site-panel');
	toggleButton.addEventListener('click', function () {
		document.documentElement.classList.toggle('site-panel-open');
	});

	const colorGrid = document.querySelector('.color-grid');
	const checkboxes = document.querySelectorAll('.site-filter input[type="checkbox"]');

	function addRandomGridClasses() {
		const colorTiles = document.querySelectorAll('.color-tile');
		colorTiles.forEach((tile, index) => {
			if ((index + 1) % 8 === 0) {
				// Randomly assign either "wide" or "tall" class
				const randomClass = Math.random() > 0.5 ? 'wide' : 'tall';
				tile.classList.add(randomClass);
			}
		});
	}

	// Fetch the color data from the JSON file
	fetch('colors.json')
		.then(response => response.json())
		.then(data => {
			const randomizedColors = data.sort(() => Math.random() - 0.5);
			appendColorTiles(randomizedColors); // Append tiles
			addRandomGridClasses(); // Add random classes to every 8th tile
			applyUrlPresetFilters(); // Apply URL presets only after tiles are appended
		})
		.catch(error => console.error('Error loading colors:', error));

	// Function to create and append color tiles to the grid
	function appendColorTiles(colors) {
		const fragment = document.createDocumentFragment(); // Use DocumentFragment to batch DOM updates

		colors.forEach(color => {
			const colorTile = createColorTile(color);
			fragment.appendChild(colorTile); // Append color tiles to the fragment
		});

		colorGrid.appendChild(fragment); // Append the entire fragment to the DOM at once
	}

	// Function to create a single color tile element
	function createColorTile(color) {
		const colorTile = document.createElement('div');
		colorTile.classList.add('color-tile'); // Add the base class

		colorTile.setAttribute('data-color-category', color.colorCategory); // Set data attribute

		// Apply inline styles
		colorTile.style.setProperty('--color', color.hex);
		colorTile.style.setProperty('--hue', color.hue);
		colorTile.style.setProperty('--saturation', color.saturation);

		colorTile.innerHTML = `
		  <h2>${color.name}</h2>
		  <div class="color-tile__values">
			<div class="color-tile__single-value color-tile__single-value_hex">
			  <span>${color.hex}</span>
			</div>
			<div class="color-tile__single-value color-tile__single-value_rgb">
			  <span>${color.rgb}</span>
			</div>
			<div class="color-tile__single-value color-tile__single-value_hsl">
			  <span>${color.hsl}</span>
			</div>
		  </div>
		  <button class="color-tile__preview"><span class="preview-text">Preview</span><span class="exit-text">Exit</span></button>
		`;

		return colorTile;
	}

	// Function to apply URL preset filters on page load
	function applyUrlPresetFilters() {
		const urlParams = new URLSearchParams(window.location.search);
		const filterParam = urlParams.get('filter');

		if (filterParam) {
			const presetFilters = filterParam.split('+'); // Split filters by '+'
			checkboxes.forEach(checkbox => {
				checkbox.checked = presetFilters.includes(checkbox.id.replace('filter-color-', ''));
			});
		}

		// Immediately apply filtering based on URL presets
		filterColors();
	}

	// Function to update URL with the current filters
	function updateUrlWithFilters() {
		const selectedFilters = Array.from(checkboxes)
			.filter(checkbox => checkbox.checked)
			.map(checkbox => checkbox.id.replace('filter-color-', ''))
			.join('+');

		// Update the URL without reloading the page
		if (selectedFilters) {
			const newUrl = `${window.location.pathname}?filter=${selectedFilters}`;
			window.history.replaceState(null, '', newUrl);
		} else {
			// If no filters are selected, remove the 'filter' parameter
			const newUrl = window.location.pathname;
			window.history.replaceState(null, '', newUrl);
		}
	}

	// Function to filter color tiles based on selected checkboxes
	function filterColors() {
		document.documentElement.classList.add('filter-update');

		// Remove the class 'filter-update' after 400ms
		setTimeout(() => {
			document.documentElement.classList.remove('filter-update');
		}, 400);

		const selectedColors = Array.from(checkboxes)
			.filter(checkbox => checkbox.checked)
			.map(checkbox => checkbox.id.replace('filter-color-', ''));

		const colorTiles = document.querySelectorAll('.color-tile');

		// Show all tiles if no filter is selected
		if (selectedColors.length === 0) {
			colorTiles.forEach(tile => {
				tile.classList.add('visible');
				tile.classList.remove('hidden');
			});
		} else {
			// Apply 'visible' or 'hidden' class based on the selected filters
			colorTiles.forEach(tile => {
				const tileCategories = tile.getAttribute('data-color-category').split(' ');
				const isMatch = selectedColors.some(color => tileCategories.includes(color));

				if (isMatch || tileCategories.includes('grey')) {
					tile.classList.add('visible');
					tile.classList.remove('hidden');
				} else {
					tile.classList.add('hidden');
					tile.classList.remove('visible');
				}
			});
		}

		// Reapply only the "tall" class to certain tiles after filtering
		reapplyTallClasses();

		// Update the URL with current filter selections
		updateUrlWithFilters();
		}

	// Add event listeners to checkboxes to trigger the filter on change
	checkboxes.forEach(checkbox => {
		checkbox.addEventListener('change', filterColors);
	});

	// Function to reapply "wide" and "tall" classes
	function reapplyTallClasses() {
		const visibleTiles = document.querySelectorAll('.color-tile.visible');

		// Remove existing "tall" classes
		visibleTiles.forEach(tile => {
			tile.classList.remove('tall');
		});

		// Re-apply only "tall" class to every 8th visible tile
		visibleTiles.forEach((tile, index) => {
			if ((index + 1) % 8 === 0) {
				tile.classList.add('tall');
			}
		});
	}

	// Handle color preview functionality with event delegation
	colorGrid.addEventListener('click', function (e) {
		const previewButton = e.target.closest('.color-tile__preview');

		if (previewButton) {
			const colorTile = previewButton.closest('.color-tile');
			const color = getComputedStyle(colorTile).getPropertyValue('--color').trim();
			const previewText = previewButton.querySelector('.preview-text');

			// Toggle preview mode
			if (document.documentElement.classList.contains('preview-mode')) {
				exitPreviewMode(previewButton, colorTile); // Exit preview mode
			} else {
				enterPreviewMode(previewButton, colorTile, color); // Enter preview mode
			}
		}
	});

	// Function to enter preview mode
	function enterPreviewMode(previewButton, colorTile, color) {
		document.documentElement.classList.add('preview-mode'); // Add "preview-mode"
		document.body.style.backgroundColor = color; // Change background color
		colorTile.classList.add('current'); // Add "current" to the clicked color tile
	}

	// Function to exit preview mode
	function exitPreviewMode(previewButton, colorTile) {
		document.documentElement.classList.remove('preview-mode'); // Remove "preview-mode"
		document.body.style.backgroundColor = ''; // Reset background color
		colorTile.classList.remove('current'); // Remove "current" class
	}

	// Handle copy functionality for color values using event delegation
	colorGrid.addEventListener('click', function (e) {
		if (e.target.closest('.color-tile__single-value')) {
			const valueElement = e.target.closest('.color-tile__single-value');
			const textToCopy = valueElement.querySelector('span').textContent.trim();

			navigator.clipboard.writeText(textToCopy).then(() => {
				valueElement.classList.add('copied');

				// Create and append the "Copied!" message
				const copiedMessage = document.createElement('span');
				copiedMessage.textContent = 'Copied!';
				copiedMessage.classList.add('copied-message');
				valueElement.appendChild(copiedMessage);

				// Remove the "Copied!" message and 'copied' class after 500ms
				setTimeout(() => {
					valueElement.classList.remove('copied');
					valueElement.removeChild(copiedMessage);
				}, 500);
			});
		}
	});

	// Handle Esc key press to exit preview mode
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && document.documentElement.classList.contains('preview-mode')) {
			const currentTile = document.querySelector('.color-tile.current');
			if (currentTile) {
				const previewButton = currentTile.querySelector('.color-tile__preview');
				exitPreviewMode(previewButton, currentTile); // Exit preview mode
			}
		}
		if (e.key === 'Escape' && document.documentElement.classList.contains('site-panel-open')) {
			document.documentElement.classList.remove('site-panel-open');
		}
	});
});
