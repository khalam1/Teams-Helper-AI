let isTranscribing = false;
let transcriptArray = [];

function jsonToYaml(json) {
    return json.map(entry => {
        return `Name: ${entry.Name}\nText: ${entry.Text}\nTime: ${entry.Time}\n----`;
    }).join('\n');
}

// Function to send transcript to OpenAI API
async function sendTranscriptToOpenAI(transcripts) {
    try {
        const response = await fetch("https://api.openai.com/v1/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer YOUR_OPENAI_API_KEY`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4", // Use the model you prefer
                prompt: `Here is the meeting transcript: ${transcripts}`,
                max_tokens: 1000
            })
        });
        const data = await response.json();
        console.log("OpenAI Response: ", data);
    } catch (error) {
        console.error("Error sending transcript to OpenAI:", error);
    }
}

function saveTranscripts(meetingTitle, transcriptArray) {
    const yaml = jsonToYaml(transcriptArray);
    console.log(yaml);

    chrome.downloads.download({
        url: 'data:text/plain,' + yaml,
        filename: meetingTitle + ".txt",
        saveAs: true
    });

    // Send transcript to OpenAI every minute
    setInterval(() => {
        sendTranscriptToOpenAI(yaml);
    }, 60000); // 1 minute interval
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log(message);
    switch (message.message) {
        case 'download_captions': // message from Content script
            console.log('download_captions triggered!', message);
            saveTranscripts(message.meetingTitle, message.transcriptArray);
            break;
        case 'save_captions': // message from Popup
            console.log('save_captions triggered!');

            const [tab] = await chrome.tabs.query({
                active: true,
                lastFocusedWindow: true
            });
            console.log("Tabs query result:", tab);

            console.log("sending message return_transcript");
            chrome.tabs.sendMessage(tab.id, {
                message: "return_transcript"
            });

            console.log("message start_capture sent!");
            break;
        default:
            break;
    }
});