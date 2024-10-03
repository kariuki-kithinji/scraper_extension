class JsonTree {
    constructor(data, containerId) {
        this.data = data;
        this.containerId = containerId;
        this.treeHtml = '';
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        this.createStyles();
        this.createHTML();
        this.renderTree();
        this.addEventListeners();
        this.initialized = true;
    }

    createStyles() {
        if (!document.getElementById('json-tree-styles')) {
            const style = document.createElement('style');
            style.id = 'json-tree-styles';
            style.textContent = `
                .json-tree-container {
                    max-height: 70vh;
                    overflow-y: auto;
                    font-family: Arial, sans-serif;
                }
                .json-tree-node {
                    list-style-type: none;
                    margin: 5px 0;
                    padding-left: 20px;
                }
                .json-tree-top-level {
                    padding-left: 0;
                    margin-top: 0;
                }
                .json-tree-toggle {
                    cursor: pointer;
                    user-select: none;
                    margin-right: 5px;
                    display: inline-block;
                    text-align: center;
                    color: blue;
                }
                .json-tree-label {
                    display: inline-block;
                    vertical-align: middle;
                }
                .json-tree-children {
                    display: none;
                }
                .json-tree-value {
                    color: #28a745;
                    margin-left: 5px;
                }
                .json-tree-checkbox {
                    margin-right: 5px;
                }
            `;
            document.head.appendChild(style);
        }
    }

    createHTML() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `
                <div class="json-tree-container">
                    <div id="${this.containerId}-tree-root"></div>
                </div>
            `;
        } else {
            console.error(`Container with id "${this.containerId}" not found.`);
        }
    }

    buildTree(data, path = [], isTopLevel = true) {
        if (typeof data === 'object' && data !== null) {
            const nodeClass = isTopLevel ? 'json-tree-node json-tree-top-level' : 'json-tree-node';
            this.treeHtml += `<ul class="${nodeClass}">`;
            for (const key in data) {
                const newPath = [...path, key];
                const pathString = newPath.join('.');
                const uniqueId = `${this.containerId}-${pathString}`;
                
                this.treeHtml += `<li data-path="${pathString}">`;
                this.treeHtml += `<input type="checkbox" class="json-tree-checkbox" id="${uniqueId}" data-path="${pathString}">`;
                
                if (typeof data[key] === 'object' && data[key] !== null) {
                    this.treeHtml += `<span class="json-tree-toggle">[+]</span>`;
                    this.treeHtml += `<label class="json-tree-label" for="${uniqueId}">${key}</label>`;
                    this.treeHtml += '<div class="json-tree-children">';
                    this.buildTree(data[key], newPath, false);
                    this.treeHtml += '</div>';
                } else {
                    this.treeHtml += `<label class="json-tree-label" for="${uniqueId}">${key}:</label>`;
                    this.treeHtml += `<span class="json-tree-value">${data[key]}</span>`;
                }
                this.treeHtml += '</li>';
            }
            this.treeHtml += '</ul>';
        }
    }
    
    renderTree() {
        this.treeHtml = ''; // Reset treeHtml before building
        this.buildTree(this.data);
        const rootElement = document.getElementById(`${this.containerId}-tree-root`);
        if (rootElement) {
            rootElement.innerHTML = this.treeHtml;
        } else {
            console.error(`Root element with id "${this.containerId}-tree-root" not found.`);
        }
    }

    addEventListeners() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.addEventListener('click', (event) => {
                if (event.target.classList.contains('json-tree-toggle')) {
                    this.toggleNode(event.target);
                }
            });

            container.addEventListener('change', (event) => {
                if (event.target.classList.contains('json-tree-checkbox')) {
                    this.handleCheckboxChange(event.target);
                }
            });
        }
    }

    toggleNode(toggle) {
        const childrenDiv = toggle.nextElementSibling.nextElementSibling;
        if (childrenDiv) {
            const isExpanded = toggle.textContent === '[-]';
            childrenDiv.style.display = isExpanded ? 'none' : 'block';
            toggle.textContent = isExpanded ? '[+]' : '[-]';
            toggle.classList.toggle('expanded', !isExpanded);
        }
    }

    handleCheckboxChange(checkbox) {
        const isChecked = checkbox.checked;
        const path = checkbox.getAttribute('data-path');
        const childCheckboxes = document.querySelectorAll(`#${this.containerId} .json-tree-checkbox[data-path^="${path}."]`);

        childCheckboxes.forEach(childCheckbox => {
            childCheckbox.checked = isChecked;
            childCheckbox.disabled = isChecked;
        });
    }

    getSelectedData() {
        const selectedData = {};
        const checkboxes = document.querySelectorAll(`#${this.containerId} .json-tree-checkbox:checked`);
        checkboxes.forEach(checkbox => {
            const path = checkbox.getAttribute('data-path').split('.');
            this.addSelectedData(selectedData, path, this.data);
        });
        return this.removeNulls(selectedData);
    }

    addSelectedData(selectedData, path, data) {
        const key = path[0];
        if (path.length === 1) {
            selectedData[key] = data[key];
        } else {
            if (!selectedData[key]) {
                selectedData[key] = Array.isArray(data[key]) ? [] : {};
            }
            this.addSelectedData(selectedData[key], path.slice(1), data[key]);
        }
    }

    removeNulls(obj) {
        const isArray = Array.isArray(obj);
        for (const key in obj) {
            if (obj[key] === null) {
                if (isArray) {
                    obj.splice(key, 1);
                } else {
                    delete obj[key];
                }
            } else if (typeof obj[key] === 'object') {
                obj[key] = this.removeNulls(obj[key]);
                if (Object.keys(obj[key]).length === 0) {
                    if (isArray) {
                        obj.splice(key, 1);
                    } else {
                        delete obj[key];
                    }
                }
            }
        }
        return isArray ? obj.filter(item => item !== undefined) : obj;
    }
}

// Function to generate a hash for the given HTML
async function generateHash(html) {
    const encoder = new TextEncoder();
    const data = encoder.encode(html);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');  
}

// Global object to store JsonTree instances and task IDs
const analysisResults = {
    social: { jsonTree: null, taskId: null },
    classification: { jsonTree: null, taskId: null },
    location: { jsonTree: null, taskId: null }
};

// Function to show and hide the spinner and badge dynamically
function updateTaskStatus(type, status, showSpinner) {
    const spinner = document.getElementById(`${type}Spinner`);
    if (showSpinner) {
        spinner.style.display = 'inline-block';
    } else {
        spinner.style.display = 'none';
    }
}

// General function to start analysis tasks
async function startAnalysis(endpoint, data, resultElementId, cacheKey) {
    updateTaskStatus(cacheKey, 'Processing', true);
    try {
        const response = await fetch(`http://localhost:5000/api/v1${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            const responseData = await response.json();
            const taskId = responseData.task_id;
            analysisResults[cacheKey].taskId = taskId; // Store the task ID
            const intervalId = setInterval(async () => {
                const statusResponse = await fetch(`http://localhost:5000/api/v1/tasks/${taskId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (statusResponse.ok) {
                    const statusData = await statusResponse.json();
                    if (statusData.state === 'SUCCESS') {
                        clearInterval(intervalId);
                        console.log(statusData.result);
                        updateTaskStatus(cacheKey, 'SUCCESS', false);
                        let jsonTree = new JsonTree(statusData.result, resultElementId);
                        jsonTree.init();
                        analysisResults[cacheKey].jsonTree = jsonTree; // Store the JsonTree instance
                    }
                } else {
                    updateTaskStatus(cacheKey, 'Failed', false);
                }
            }, 5000); // Check every 5 seconds
        } else {
            console.error(`Failed to start analysis task for ${endpoint}`);
            updateTaskStatus(cacheKey, 'Failed', false);
        }
    } catch (error) {
        console.error('Error:', error);
        updateTaskStatus(cacheKey, 'Failed', false);
    }
}

// Function to run all tasks in parallel and manage states
async function runParallelAnalysis(url, html) {
    const tasks = [
        startAnalysis('/analysis/social', { url: url, html: html }, 'socialResult', 'social'),
        startAnalysis('/analysis/classification', { url: url, html: html }, 'classificationResult', 'classification'),
        startAnalysis('/analysis/location', { url: url }, 'locationResult', 'location')
    ];
    // Run all tasks in parallel and wait for all to settle
    const results = await Promise.allSettled(tasks);
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.error(`Task ${index + 1} failed`, result.reason);
        }
    });
}

// Function to handle save button click
async function handleSave() {
    console.log("Save button clicked. Logging analysis results:");

    for (const [key, value] of Object.entries(analysisResults)) {
        console.log(`Analysis type: ${key}`);
        console.log(`Task ID: ${value.taskId}`);
        console.log(`JsonTree instance:`, value.jsonTree);

        if (value.jsonTree) {
            console.log(`JsonTree data:`, value.jsonTree.getSelectedData());
        }

        console.log('---');

        // Prepare the data to send
        const resultsToSend = {
            result: {
                taskId: value.taskId,
                data: value.jsonTree ? value.jsonTree.getSelectedData() : null
            }
        };

        try {
            // Send the data to the endpoint for each task
            const response = await fetch(`http://localhost:5000/api/v1/tasks/${value.taskId}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(resultsToSend)
            });

            const responseData = await response.json();

            if (response.ok) {
                console.log('Response for task ID', value.taskId, ':', responseData);
            } else {
                console.error('Error updating task result for task ID', value.taskId, ':', responseData);
            }
        } catch (error) {
            console.error('Network error for task ID', value.taskId, ':', error);
        }
    }
}


// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Store the last HTML hash to detect changes
    let lastHtmlHash = null;
    // Get current tab information (URL and HTML)
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    const pageHtml = await browser.tabs.executeScript(tab.id, { code: "document.documentElement.outerHTML" });
    // Generate hash for the current page HTML
    const currentHtmlHash = await generateHash(pageHtml[0]);
    // If the HTML has changed, fetch new data
    if (currentHtmlHash !== lastHtmlHash) {
        lastHtmlHash = currentHtmlHash; // Update last HTML hash
        // Start parallel analysis tasks
        runParallelAnalysis(url, pageHtml[0]);
    } else {
        console.log('No changes detected in HTML.');
    }

    // Add event listener for the save button
    document.getElementById('save').addEventListener('click', handleSave);
});

// Open data page on button click
document.getElementById('view_data').addEventListener('click', () => {
    browser.tabs.create({ url: browser.runtime.getURL('data/data.html') });
});