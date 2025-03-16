const previewVideo = document.getElementById("preview");
const replayVideo = document.getElementById("replay");
const startRecordingButton = document.getElementById("startRecording");
const downloadLink = document.getElementById("downloadLink");
const squares = document.querySelectorAll('.square');

let mediaRecorder;
let recordedChunks = [];
let flashingInterval;
let squarePattern = [];
let isReplayingSquares = false;
let flashCount = 0;
const maxFlashes = 10;

startRecordingButton.addEventListener('click', async () => {
    const constraints = {
        video: {
            facingMode: 'user'
        }
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        await startCountdown(4);
        previewVideo.srcObject = stream;
        previewVideo.play();
        previewVideo.setAttribute('playsinline', 'true');
        previewVideo.classList.add('recording');
        startFlashingSquares();

        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        if (capabilities.zoom) {
            const settings = track.getSettings();
            track.applyConstraints({
                advanced: [{ zoom: settings.zoom / 2 }]
            });
        }

        const options = { mimeType: 'video/webm; codecs=vp8' };
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (isIOS) {
            options.mimeType = 'video/mp4';
        }

        mediaRecorder = new MediaRecorder(stream, options);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            stopFlashingSquares();
            previewVideo.classList.remove('recording');
            replayVideo.classList.add("full");
            setTimeout(() => {
                replayVideo.classList.remove("full");
                replayVideo.style.opacity = 1;
                replayVideo.style.width = "100vw";
                replayVideo.style.height = "100vh";

                const recordedBlob = new Blob(recordedChunks, { type: isIOS ? "video/mp4" : "video/webm" });

                replayVideo.src = URL.createObjectURL(recordedBlob);
                replayVideo.setAttribute('playsinline', 'true');
                replayVideo.setAttribute('controls', 'true');
                replayVideo.muted = true;
                replayVideo.controls = true;

                stream.getTracks().forEach(track => track.stop());

                const videoUrl = URL.createObjectURL(recordedBlob);
                downloadLink.href = videoUrl;
                downloadLink.style.display = "block";

                replayVideo.addEventListener('play', () => {
                    replaySquarePattern();
                    document.getElementById("sqcont").style.position = "fixed";
                    document.getElementById("sqcont").style.width = "20vw";
                    document.getElementById("sqcont").style.height = "30vh";
                    document.getElementById("sqcont").style.bottom = "5px";
                    document.getElementById("sqcont").style.left = "5px";
                    document.getElementById("sqcont").style.zIndex = "11111";
                    document.querySelectorAll('.square').forEach((element) => {
                        document.getElementById("sqcont").style.gap = "5px";
                        element.style.width = "50%";
                        element.style.height = "49%";
                    });
                });

                replayVideo.addEventListener('ended', () => {
                    document.body.addEventListener('click', function () {
                        if (!event.target.matches('#sqcont')) {
                            document.getElementById("sqcont").style.display = "none";
                        }
                    });
                });

            }, 1950);
        };

        recordedChunks = [];
        squarePattern = [];
        mediaRecorder.start();

    } catch (error) {
        console.error('Error accessing media devices:', error);
        console.log('There was an error accessing your camera. Error details: ' + error.message);
    }
});

function getRandomInterval(isFirstFlash = false) {
    if (isFirstFlash) {
        return Math.random() * 2000;
    }

    const randomValue = Math.random();

    let interval;
    if (randomValue < 0.75) {
        interval = Math.random() * (7000 - 4000) + 4000;
    } else {
        interval = Math.random() * (9000 - 7000) + 7000;
    }

    return interval;
}

function startFlashingSquares() {
    flashCount = 0;
    squarePattern = [];

    let startTime = Date.now();

    flashingInterval = setTimeout(function flash() {
        const timestamp = randomizeRedSquare();
        flashCount++;

        if (flashCount >= maxFlashes) {
            setTimeout(function(){
      
                mediaRecorder.stop();
                clearTimeout(flashingInterval);
            },3000);
            
        } else {
            const nextInterval = getRandomInterval();
            flashingInterval = setTimeout(flash, nextInterval);
        }
    }, getRandomInterval(true));
}

function startCountdown(seconds) {
    return new Promise((resolve) => {
        let countdownNumber = seconds;
        const countdownElement = document.getElementById('countdownOverlay');
        countdownElement.style.display = 'flex';

        const countdownInterval = setInterval(() => {
            countdownElement.textContent = countdownNumber;
            countdownNumber--;

            if (countdownNumber < 0) {
                clearInterval(countdownInterval);
                countdownElement.style.display = 'none';
                resolve();
            }
        }, 1000);
    });
}

const countdownOverlay = document.createElement('div');
countdownOverlay.id = 'countdownOverlay';
countdownOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 5rem;
    color: white;
    font-family: Arial, sans-serif;
    z-index: 9999;
    display: none;
`;
document.body.appendChild(countdownOverlay);

function stopFlashingSquares() {
    clearTimeout(flashingInterval);
    squares.forEach(square => {
        square.style.background = 'linear-gradient(135deg, #00c6ff, #0072ff)';
    });
}

function randomizeRedSquare() {
    squares.forEach(square => {
        square.style.background = 'linear-gradient(135deg, #00c6ff, #0072ff)';
    });

    const randomIndex = Math.floor(Math.random() * squares.length);
    squares[randomIndex].style.background = 'red';

    const timestamp = Date.now();
    squarePattern.push({ index: randomIndex, timestamp: timestamp });

    setTimeout(() => {
        squares[randomIndex].style.background = 'linear-gradient(135deg, #00c6ff, #0072ff)';
    }, 500);

    return timestamp;
}

function replaySquarePattern() {
    if (isReplayingSquares) return;

    isReplayingSquares = true;
    let startTime = performance.now();
    let currentStep = 0;

    function replayStep() {
        if (currentStep >= squarePattern.length) {
            isReplayingSquares = false;
            return;
        }

        const { index, timestamp } = squarePattern[currentStep];
        let delay = currentStep === 0 ? 500 : timestamp - squarePattern[currentStep - 1].timestamp;

        requestAnimationFrame(() => {
            let elapsed = performance.now() - startTime;

            if (elapsed >= delay) {
                squares.forEach(square => {
                    square.style.background = 'linear-gradient(135deg, #00c6ff, #0072ff)';
                });

                squares[index].style.background = 'red';

                setTimeout(() => {
                    squares[index].style.background = 'linear-gradient(135deg, #00c6ff, #0072ff)';
                }, 250);

                currentStep++;
                replayStep();
            } else {
                requestAnimationFrame(replayStep);
            }
        });
    }

    replayStep();
}

