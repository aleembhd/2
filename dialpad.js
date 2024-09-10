function recordCall(number, status, notes, duration) {
    const call = {
        dateTime: new Date().toLocaleString(),
        number: number,
        status: status,
        notes: notes,
        duration: duration
    };

    // Save to localStorage
    let calls = JSON.parse(localStorage.getItem('calls') || '[]');
    calls.push(call);
    localStorage.setItem('calls', JSON.stringify(calls));

    // Send message to parent window (dashboard)
    if (window.opener && !window.opener.closed) {
        console.log('Sending call to parent window:', call);
        window.opener.postMessage({ type: 'newCall', call: call }, '*');
    } else {
        console.error('Parent window not available');
    }

    console.log('Call recorded:', call);
}

// Function to handle call back button click
function handleCallBack() {
    const number = document.getElementById('phoneNumber').value;
    if (!number) {
        alert('Please enter a phone number first.');
        return;
    }
    recordCall(number, 'Callback', 'Callback requested', '0:00');
    alert('Callback recorded successfully.');
}

// Function to handle call answer
function handleCallAnswer(wasAnswered) {
    const number = document.getElementById('phoneNumber').value;
    const status = wasAnswered ? 'Answered' : 'Unanswered';
    const notes = wasAnswered ? 'Call was answered' : 'Call was not answered';
    const duration = document.getElementById('timer').textContent;
    recordCall(number, status, notes, duration);
}

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
    const callBackBtn = document.getElementById('callBackBtn');
    if (callBackBtn) {
        callBackBtn.addEventListener('click', handleCallBack);
    } else {
        console.error('Call Back button not found');
    }

    // Add other event listeners for your dialpad buttons here
});

// Listen for messages from the parent window
window.addEventListener('message', function(event) {
    if (event.data === 'requestLatestCall') {
        const calls = JSON.parse(localStorage.getItem('calls') || '[]');
        if (calls.length > 0) {
            const latestCall = calls[calls.length - 1];
            window.opener.postMessage({ type: 'newCall', call: latestCall }, '*');
        }
    }
});

function endCall() {
    // ... existing end call code ...
    
    const isAnswered = confirm('Was the call answered?');
    handleCallOutcome(isAnswered);
}

function handleCallOutcome(isAnswered) {
    const number = document.getElementById('phoneNumber').value;
    stopTimer();
    const duration = document.getElementById('timer').textContent;

    if (isAnswered) {
        Swal.fire({
            title: 'Call Status',
            html: `
                <button class="swal2-confirm swal2-styled" onclick="Swal.clickConfirm()" data-status="Callback">Callback</button>
                <button class="swal2-confirm swal2-styled" onclick="Swal.clickConfirm()" data-status="Interested">Interested</button>
                <button class="swal2-confirm swal2-styled" onclick="Swal.clickConfirm()" data-status="Not Interested">Not Interested</button>
            `,
            showConfirmButton: false,
            allowOutsideClick: false,
            preConfirm: () => {
                return Swal.getClickedButton().getAttribute('data-status');
            }
        }).then((result) => {
            if (result.isConfirmed) {
                let notes = prompt('Enter call notes:');
                recordCallData(number, result.value, notes, duration);
            }
        });
    } else {
        recordCallData(number, 'Unanswered', 'Call was not answered', duration);
    }
}

function recordCallStatus(status) {
    const number = document.getElementById('phoneNumber').value;
    const duration = document.getElementById('timer').textContent;
    let notes = prompt('Enter call notes:');
    recordCallData(number, status, notes, duration);
    Swal.close();
}

function recordCallData(number, status, notes, duration) {
    const callData = {
        number: number,
        status: status,
        notes: notes,
        duration: duration,
        dateTime: firebase.database.ServerValue.TIMESTAMP
    };

    // Store data in Firebase
    firebase.database().ref('calls').push(callData)
        .then(() => {
            console.log('Call data recorded successfully');
            alert('Call data has been recorded');
            resetDialpad();
        })
        .catch((error) => {
            console.error('Error recording call data:', error);
            alert('Failed to record call data');
        });
}

// When adding a new call
const newCall = {
    number: phoneNumber,
    status: selectedStatus, // Make sure this is one of: 'Not Interested', 'Unanswered', 'Call Back', or 'Interested'
    notes: notes,
    duration: callDuration,
    dateTime: new Date().toLocaleString()
};

function resetDialpad() {
    // Reset the dialpad state
    document.getElementById('phoneNumber').value = '';
    document.getElementById('timer').textContent = '00:00';
    seconds = 0;
    // Add any other reset logic here
}

let timerInterval;
let seconds = 0;

function startTimer() {
    seconds = 0;
    updateTimerDisplay();
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function updateTimer() {
    seconds++;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function call() {
    if (currentNumber.length > 0) {
        startTimer();
        Swal.fire({
            title: 'Calling ' + currentNumber,
            text: 'Was the call answered?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
        }).then((result) => {
            handleCallOutcome(result.isConfirmed);
        });
    }
}