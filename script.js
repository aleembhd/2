let callData = {
    details: []
};

// Update dashboard with data
function updateDashboard(data) {
    document.getElementById('totalCallsSummary').textContent = data.details.length.toLocaleString();
    document.getElementById('interestedCallsSummary').textContent = data.details.filter(call => call.status === 'Interested').length.toLocaleString();
    document.getElementById('notInterestedCallsSummary').textContent = data.details.filter(call => call.status === 'Not Interested').length.toLocaleString();
    document.getElementById('unansweredCallsSummary').textContent = data.details.filter(call => call.status === 'Unanswered').length.toLocaleString();
    document.getElementById('callBackCallsSummary').textContent = data.details.filter(call => call.status === 'Callback').length.toLocaleString();

    const callDetailsBody = document.getElementById('callDetailsBody');
    callDetailsBody.innerHTML = '';
    data.details.forEach(call => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${call.number}</td>
            <td><span class="status status-${call.status.toLowerCase().replace(' ', '-')}">${call.status}</span></td>
            <td>${call.notes}</td>
            <td>${call.duration}</td>
            <td>${call.dateTime}</td>
        `;
        callDetailsBody.appendChild(row);
    });
}

// Function to add a new call to the dashboard
function addCallToDashboard(call) {
    const tbody = document.getElementById('callDetailsBody');
    if (!tbody) {
        console.error('Call details table body not found');
        return;
    }

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${call.number}</td>
        <td>${call.status}</td>
        <td>${call.notes}</td>
        <td>${call.duration}</td>
        <td>${call.dateTime}</td>
    `;
    tbody.insertBefore(row, tbody.firstChild); // Add the new call at the top of the list

    // Update callData
    if (!callData.details) {
        callData.details = [];
    }
    callData.details.unshift(call);

    // Save to localStorage
    let calls = JSON.parse(localStorage.getItem('calls') || '[]');
    calls.push(call);
    localStorage.setItem('calls', JSON.stringify(calls));

    // Update summary numbers
    updateSummaryNumbers();

    console.log('Call added to dashboard:', call);
}

// Function to update summary numbers
function updateSummaryNumbers() {
    const calls = callData.details || [];
    
    document.getElementById('totalCallsSummary').textContent = calls.length;
    document.getElementById('notInterestedCallsSummary').textContent = calls.filter(call => call.status === 'Not Interested').length;
    document.getElementById('unansweredCallsSummary').textContent = calls.filter(call => call.status === 'Unanswered').length;
    document.getElementById('callBackCallsSummary').textContent = calls.filter(call => call.status === 'Callback').length;
    document.getElementById('interestedCallsSummary').textContent = calls.filter(call => call.status === 'Interested').length;
}

// Load existing calls from localStorage
function loadExistingCalls() {
    const calls = JSON.parse(localStorage.getItem('calls') || '[]');
    callData.details = calls;
    updateDashboard(callData);
}

// Listen for messages from the dialpad
window.addEventListener('message', function(event) {
    console.log('Received message:', event.data);
    if (event.data.type === 'newCallRecord' || event.data.type === 'newCall') {
        const newCall = event.data.type === 'newCallRecord' ? event.data.data : event.data.call;
        console.log('Received new call:', newCall);
        addCallToDashboard(newCall);
        updateDashboard(callData); // Update the entire dashboard
        updateSummaryNumbers(); // Make sure to update summary numbers after adding a new call
    }
});

// Function to open dialpad
window.openDialpad = function() {
    window.open('dialpad.html', 'dialpad', 'width=300,height=400');
}

// Function to open Today's dashboard
function openTodayDashboard() {
    const today = new Date().toLocaleDateString();
    const todayCalls = callData.details.filter(call => new Date(call.dateTime).toLocaleDateString() === today);
    
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
        <html>
            <head>
                <title>Today's Calls</title>
                <link rel="stylesheet" href="style.css">
                <style>
                    .back-button {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        display: flex;
                        align-items: center;
                        padding: 8px 16px;
                        background-color: white;
                        color: black;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background-color 0.2s, box-shadow 0.2s;
                    }

                    .back-button:hover {
                        background-color: #f3f4f6;
                        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    }

                    .back-icon {
                        margin-right: 8px;
                        width: 16px;
                        height: 16px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <button class="back-button" onclick="window.close()">
                        <svg class="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        Back to Dashboard
                    </button>
                    <h1>Today's Calls (${today})</h1>
                    <table class="call-details-table">
                        <thead>
                            <tr>
                                <th>Contact</th>
                                <th>Status</th>
                                <th>Notes</th>
                                <th>Duration</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${todayCalls.map(call => `
                                <tr>
                                    <td>${call.number}</td>
                                    <td>${call.status}</td>
                                    <td>${call.notes}</td>
                                    <td>${call.duration}</td>
                                    <td>${new Date(call.dateTime).toLocaleTimeString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </body>
        </html>
    `);
    newWindow.document.close();
}

// Function to open Weekly Report
function openWeeklyReport() {
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyCalls = callData.details.filter(call => new Date(call.dateTime) >= oneWeekAgo);

    const totalCalls = weeklyCalls.length;
    const answeredCalls = weeklyCalls.filter(call => call.status === 'Answered').length;
    const unansweredCalls = weeklyCalls.filter(call => call.status === 'Unanswered').length;
    const callBackCalls = weeklyCalls.filter(call => call.status === 'Callback').length;
    const interestedCalls = weeklyCalls.filter(call => call.status === 'Interested').length;

    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
        <html>
            <head>
                <title>Weekly Performance Report</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <style>
                    :root {
                        --primary-color: #3498db;
                        --secondary-color: #2c3e50;
                        --background-color: #f4f4f4;
                        --card-background: #ffffff;
                        --text-color: #333333;
                        --border-radius: 10px;
                    }

                    body {
                        font-family: 'Arial', sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: var(--background-color);
                        color: var(--text-color);
                    }

                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 20px;
                    }

                    .header {
                        background-color: var(--secondary-color);
                        color: white;
                        padding: 20px;
                        border-radius: var(--border-radius);
                        margin-bottom: 20px;
                    }

                    h1, h2 {
                        margin: 0;
                    }

                    .date-range {
                        font-size: 1rem;
                        margin-top: 10px;
                    }

                    .stats-container {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }

                    .stat-card {
                        background-color: var(--card-background);
                        border-radius: var(--border-radius);
                        padding: 20px;
                        text-align: center;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        transition: transform 0.3s ease, box-shadow 0.3s ease;
                    }

                    .stat-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 6px 12px rgba(0,0,0,0.15);
                    }

                    .stat-card i {
                        font-size: 2rem;
                        margin-bottom: 10px;
                        color: var(--primary-color);
                    }

                    .stat-card .number {
                        font-size: 1.5rem;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }

                    .stat-card .label {
                        font-size: 0.9rem;
                        color: #666;
                    }

                    .chart-container {
                        background-color: var(--card-background);
                        border-radius: var(--border-radius);
                        padding: 20px;
                        margin-bottom: 30px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }

                    .performance-metrics {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                    }

                    .metric {
                        background-color: var(--card-background);
                        border-radius: var(--border-radius);
                        padding: 20px;
                        text-align: center;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }

                    .metric h3 {
                        margin-top: 0;
                        color: var(--secondary-color);
                    }

                    .metric p {
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: var(--primary-color);
                        margin: 10px 0 0;
                    }

                    .back-button {
                        display: inline-block;
                        padding: 10px 20px;
                        background-color: var(--primary-color);
                        color: white;
                        text-decoration: none;
                        border-radius: var(--border-radius);
                        transition: background-color 0.3s ease;
                        margin-bottom: 20px;
                    }

                    .back-button:hover {
                        background-color: #2980b9;
                    }

                    @media (max-width: 768px) {
                        .stats-container {
                            grid-template-columns: repeat(2, 1fr);
                        }

                        .performance-metrics {
                            grid-template-columns: 1fr;
                        }
                    }

                    @media (max-width: 480px) {
                        .stats-container {
                            grid-template-columns: 1fr;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Weekly Performance Report</h1>
                        <div class="date-range" id="dateRange"></div>
                    </div>
                    
                    <a href="index.html" class="back-button">Back to Dashboard</a>

                    <div class="stats-container">
                        <div class="stat-card">
                            <i class="fas fa-phone"></i>
                            <div class="number" id="totalCalls">0</div>
                            <div class="label">Total Calls</div>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-thumbs-down"></i>
                            <div class="number" id="notInterestedCalls">0</div>
                            <div class="label">Not Interested</div>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-times-circle"></i>
                            <div class="number" id="unansweredCalls">0</div>
                            <div class="label">Unanswered</div>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-redo"></i>
                            <div class="number" id="callbackCalls">0</div>
                            <div class="label">Callback</div>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-thumbs-up"></i>
                            <div class="number" id="interestedCalls">0</div>
                            <div class="label">Interested</div>
                        </div>
                    </div>

                    <div class="chart-container">
                        <canvas id="weeklyChart"></canvas>
                    </div>

                    <div class="performance-metrics">
                        <div class="metric">
                            <h3>Conversion Rate</h3>
                            <p id="conversionRate">0%</p>
                        </div>
                        <div class="metric">
                            <h3>Avg. Call Duration</h3>
                            <p id="avgCallDuration">0:00</p>
                        </div>
                        <div class="metric">
                            <h3>Best Performing Day</h3>
                            <p id="bestDay">N/A</p>
                        </div>
                    </div>
                </div>

                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        // Set date range
                        const today = new Date();
                        const lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
                        document.getElementById('dateRange').textContent = \`\${lastWeek.toLocaleDateString()} - \${today.toLocaleDateString()}\`;

                        // Fetch data from localStorage
                        const calls = JSON.parse(localStorage.getItem('calls') || '[]');
                        const weekCalls = calls.filter(call => new Date(call.dateTime) >= lastWeek);

                        // Update summary cards
                        document.getElementById('totalCalls').textContent = weekCalls.length;
                        document.getElementById('notInterestedCalls').textContent = weekCalls.filter(call => call.status === 'Not Interested').length;
                        document.getElementById('unansweredCalls').textContent = weekCalls.filter(call => call.status === 'Unanswered').length;
                        document.getElementById('callbackCalls').textContent = weekCalls.filter(call => call.status === 'Callback').length;
                        document.getElementById('interestedCalls').textContent = weekCalls.filter(call => call.status === 'Interested').length;

                        // Create chart
                        const ctx = document.getElementById('weeklyChart').getContext('2d');
                        new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: ['Not Interested', 'Unanswered', 'Callback', 'Interested'],
                                datasets: [{
                                    label: 'Call Outcomes',
                                    data: [
                                        weekCalls.filter(call => call.status === 'Not Interested').length,
                                        weekCalls.filter(call => call.status === 'Unanswered').length,
                                        weekCalls.filter(call => call.status === 'Callback').length,
                                        weekCalls.filter(call => call.status === 'Interested').length
                                    ],
                                    backgroundColor: [
                                        'rgba(255, 99, 132, 0.6)',
                                        'rgba(255, 206, 86, 0.6)',
                                        'rgba(54, 162, 235, 0.6)',
                                        'rgba(75, 192, 192, 0.6)'
                                    ],
                                    borderColor: [
                                        'rgba(255, 99, 132, 1)',
                                        'rgba(255, 206, 86, 1)',
                                        'rgba(54, 162, 235, 1)',
                                        'rgba(75, 192, 192, 1)'
                                    ],
                                    borderWidth: 1
                                }]
                            },
                            options: {
                                responsive: true,
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                },
                                plugins: {
                                    legend: {
                                        display: false
                                    },
                                    title: {
                                        display: true,
                                        text: 'Weekly Call Outcomes',
                                        font: {
                                            size: 18
                                        }
                                    }
                                }
                            }
                        });

                        // Calculate performance metrics
                        const interestedCalls = weekCalls.filter(call => call.status === 'Interested').length;
                        const conversionRate = ((interestedCalls / weekCalls.length) * 100).toFixed(2);
                        document.getElementById('conversionRate').textContent = \`\${conversionRate}%\`;

                        const totalDuration = weekCalls.reduce((sum, call) => {
                            const [minutes, seconds] = call.duration.split(':').map(Number);
                            return sum + minutes * 60 + seconds;
                        }, 0);
                        const avgDuration = Math.round(totalDuration / weekCalls.length);
                        const avgMinutes = Math.floor(avgDuration / 60);
                        const avgSeconds = avgDuration % 60;
                        document.getElementById('avgCallDuration').textContent = \`\${avgMinutes}:\${avgSeconds.toString().padStart(2, '0')}\`;

                        const callsByDay = weekCalls.reduce((acc, call) => {
                            const day = new Date(call.dateTime).toLocaleDateString('en-US', { weekday: 'long' });
                            acc[day] = (acc[day] || 0) + 1;
                            return acc;
                        }, {});
                        const bestDay = Object.entries(callsByDay).reduce((a, b) => a[1] > b[1] ? a : b)[0];
                        document.getElementById('bestDay').textContent = bestDay;
                    });
                </script>
            </body>
        </html>
    `);
    newWindow.document.close();
}

// Function to open Answered Calls tab
function openAnsweredCallsTab() {
    openCallsTab('Answered');
}

// Function to open Unanswered Calls tab
function openUnansweredCallsTab() {
    openCallsTab('Unanswered');
}

// Function to open Call Back Calls tab
function openCallBackCallsTab() {
    openCallsTab('Callback');
}

// Function to open Interested Calls tab
function openInterestedCallsTab() {
    openCallsTab('Interested');
}

// Generic function to open calls tab
function openCallsTab(status) {
    const filteredCalls = callData.details.filter(call => call.status === status);
    
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
        <html>
            <head>
                <title>${status} Calls</title>
                <link rel="stylesheet" href="style.css">
                <style>
                    .back-button {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        display: flex;
                        align-items: center;
                        padding: 8px 16px;
                        background-color: white;
                        color: black;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background-color 0.2s, box-shadow 0.2s;
                    }

                    .back-button:hover {
                        background-color: #f3f4f6;
                        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    }

                    .back-icon {
                        margin-right: 8px;
                        width: 16px;
                        height: 16px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <button class="back-button" onclick="window.close()">
                        <svg class="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        Back to Dashboard
                    </button>
                    <h1>${status} Calls</h1>
                    <table class="call-details-table">
                        <thead>
                            <tr>
                                <th>Contact</th>
                                <th>Notes</th>
                                <th>Duration</th>
                                <th>Date/Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredCalls.map(call => `
                                <tr>
                                    <td>${call.number}</td>
                                    <td>${call.notes}</td>
                                    <td>${call.duration}</td>
                                    <td>${call.dateTime}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </body>
        </html>
    `);
    newWindow.document.close();
}

// Function to show clear data confirmation
function showClearDataConfirmation() {
    if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
        clearAllData();
    }
}

// Function to clear all data
function clearAllData() {
    // Clear the callData object
    callData.details = [];

    // Clear localStorage
    localStorage.removeItem('calls');

    // Update the dashboard
    updateDashboard(callData);
    updateSummaryNumbers();

    // Clear the call details table
    const callDetailsBody = document.getElementById('callDetailsBody');
    if (callDetailsBody) {
        callDetailsBody.innerHTML = '';
    }

    console.log('All data has been cleared');
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Clear localStorage to remove any existing dummy data
    localStorage.removeItem('calls');
    
    loadExistingCalls();
    updateSummaryNumbers();

    // Event listeners for buttons
    document.getElementById('todayBtn').addEventListener('click', openTodayDashboard);
    document.getElementById('weekReportBtn').addEventListener('click', openWeeklyReport);
    document.getElementById('settingsBtn').addEventListener('click', function() {
        alert('Settings clicked');
    });

    const dialpadTrigger = document.getElementById('dialpadTrigger');
    if (dialpadTrigger) {
        dialpadTrigger.addEventListener('click', window.openDialpad);
    }

    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', showClearDataConfirmation);
    } else {
        console.error("Clear Data button not found");
    }

    // Add event listeners for summary cards
    const notInterestedCard = document.querySelector('.summary-card.notinterestedcard');
    if (notInterestedCard) {
        notInterestedCard.addEventListener('click', () => openCallsTab('Not Interested'));
    } else {
        console.error("Not Interested calls card not found");
    }

    const unansweredCard = document.querySelector('.summary-card.unanswredcalls');
    if (unansweredCard) {
        unansweredCard.addEventListener('click', () => openCallsTab('Unanswered'));
    } else {
        console.error("Unanswered calls card not found");
    }

    const callBackCard = document.querySelector('.summary-card.callbackcard');
    if (callBackCard) {
        callBackCard.addEventListener('click', () => openCallsTab('Callback'));
    } else {
        console.error("Callback calls card not found");
    }

    const interestedCard = document.querySelector('.summary-card.interestedcard');
    if (interestedCard) {
        interestedCard.addEventListener('click', () => openCallsTab('Interested'));
    } else {
        console.error("Interested calls card not found");
    }

    const weekReportBtn = document.getElementById('weekReportBtn');
    if (weekReportBtn) {
        weekReportBtn.addEventListener('click', openWeeklyReport);
    } else {
        console.error("Week Report button not found");
    }

    document.getElementById('callBackBtn').addEventListener('click', function() {
        // Increment the call back count
        let callBackCount = parseInt(document.getElementById('callBackCallsSummary').innerText) || 0;
        callBackCount++;
        document.getElementById('callBackCallsSummary').innerText = callBackCount;
    });
});

// ... rest of your existing code ...

// Remove any stray closing brackets or parentheses