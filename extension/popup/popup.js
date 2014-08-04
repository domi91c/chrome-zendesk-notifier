var bg = chrome.extension.getBackgroundPage();

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('refresh-button').addEventListener('click', function() {
        console.log('clicked');
        bg.doRequest();
    });
});