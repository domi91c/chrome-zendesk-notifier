var bg = chrome.extension.getBackgroundPage();

window.onload = function() {

    checkNowButton = document.getElementById('checknow');
    
    checkNowButton.onclick = function() {
        bg.doRequestInvoked();
    };

}
