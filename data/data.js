// Function to get server location in a readable format
function formatServerLocation(location) {
    if (!location) return 'N/A';
    return `${location.City}, ${location.Region}, ${location.Country} (${location["IP Address"]})`;
}

// Function to format social links
function formatSocialLinks(links) {
    if (Object.keys(links).length === 0) return 'No Social Links';
    let formattedLinks = '';
    for (let platform in links) {
        formattedLinks += `${platform}: ${links[platform].join(', ')}<br>`;
    }
    return formattedLinks;
}

async function fetchData() {
    const response = await fetch('http://localhost:5000/api/v1/records');  // replace with your local endpoint
    const data = await response.json();
    const tableBody = document.querySelector('#data-table tbody');

    data.forEach(item => {
        const row = document.createElement('tr');

        // Extract the required data
        const id = item.id;
        const url = item.url;
        const classifierResult = item.classifier_task ? item.classifier_task.result : 'N/A';
        const domainName = item.location_task ? item.location_task.result['Domain Name'] : 'N/A';
        const ipAddress = item.location_task ? item.location_task.result['IP Address'] : 'N/A';
        const serverLocation = item.location_task ? formatServerLocation(item.location_task.result['Server Location']) : 'N/A';
        const addresses = item.social_task.result.addresses.join(', ') || 'N/A';
        const emails = item.social_task.result.emails.join(', ') || 'N/A';
        const phoneNumbers = item.social_task.result.phone_numbers.join(', ') || 'N/A';
        const socialLinks = formatSocialLinks(item.social_task.result.social_links);
        const flagged = item.flagged ? 'Yes' : 'No';
        const saved = item.saved ? 'Yes' : 'No';

        // Add data to the row
        row.innerHTML = `
            <td>${id}</td>
            <td><a href="${url}" target="_blank">${url}</a></td>
            <td>${classifierResult}</td>
            <td>${domainName}</td>
            <td>${ipAddress}</td>
            <td>${serverLocation}</td>
            <td>${addresses}</td>
            <td>${emails}</td>
            <td>${phoneNumbers}</td>
            <td>${socialLinks}</td>
            <td>${flagged}</td>
            <td>${saved}</td>
        `;

        tableBody.appendChild(row);
    });
}



document.addEventListener('DOMContentLoaded', async () => {
    // Get current tab information (URL and HTML)
    fetchData();
})

// Call the fetchData function when the page loads
//window.onload = fetchData;