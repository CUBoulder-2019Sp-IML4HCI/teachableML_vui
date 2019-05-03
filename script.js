// Copyright (c) 2018 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
// Use Reload (https://www.npmjs.com/package/reload) from Node to work on JS and restart server simultaneously (reload -b)

/* ===
ml5 Example
KNN Classification on Webcam Images with mobileNet. Built with p5.js
=== */
let video;
// Create a KNN classifier
const knnClassifier = ml5.KNNClassifier();
let featureExtractor;

// Speech Recognition, Documentation: https://w3c.github.io/speech-api/#speechreco-section and Mozilla's blog: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API#Demo 
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent
var recognition = new SpeechRecognition();
var words = [ 'predict', 'record rock', 'record paper', 'record scissor', 'reset rock', 'reset paper', 'reset scissor', 'load', 'save', 'hey jarvis', 'clear'];
var grammar = '#JSGF V1.0; grammar commands; public <color> = ' + words.join(' | ') + ' ;'
var speechRecognitionList = new SpeechGrammarList();
var recognized = document.querySelector('.recognizing');
var gready = document.querySelector('.gettingready');
var preds = document.querySelector('.predictions');
gready.innerHTML = '';
var wakeWordReceived = false;
var word = '';
speechRecognitionList.addFromString(grammar, 1);
recognition.grammars = speechRecognitionList;
recognition.continuous = true;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

function setup() {
  // Create a featureExtractor that can extract the already learned features from MobileNet
  featureExtractor = ml5.featureExtractor('MobileNet', modelReady);
  noCanvas();
  // Create a video element
  video = createCapture(VIDEO);
  // Append it to the videoContainer DOM element
  video.parent('videoContainer');
  video.size(340, 240);
  // Create the UI buttons
  createButtons();
  // Start recognition
  recognition.start();
  console.log('waiting for Wake word.');
}

function modelReady(){
  select('#status').html('FeatureExtractor(mobileNet model) Loaded')
}

// Add the current frame from the video to the classifier
function addExample(label) {
  // Get the features of the input video
  const features = featureExtractor.infer(video);
  // You can also pass in an optional endpoint, defaut to 'conv_preds'
  // const features = featureExtractor.infer(video, 'conv_preds');
  // You can list all the endpoints by calling the following function
  // console.log('All endpoints: ', featureExtractor.mobilenet.endpoints)

  // Add an example with a label to the classifier
  knnClassifier.addExample(features, label);
  updateCounts();
}

// Predict the current frame.
function classify() {
  // Get the total number of labels from knnClassifier
  const numLabels = knnClassifier.getNumLabels();
  if (numLabels <= 0) {
    console.error('There is no examples in any label');
    return;
  }
  // Get the features of the input video
  const features = featureExtractor.infer(video);

  // Use knnClassifier to classify which label do these features belong to
  // You can pass in a callback function `gotResults` to knnClassifier.classify function
  knnClassifier.classify(features, gotResults);
  // You can also pass in an optional K value, K default to 3
  // knnClassifier.classify(features, 3, gotResults);

  // You can also use the following async/await function to call knnClassifier.classify
  // Remember to add `async` before `function predictClass()`
  // const res = await knnClassifier.classify(features);
  // gotResults(null, res);
}

// A util function to create UI buttons
function createButtons() {
  // When the A button is pressed, add the current frame
  // from the video with a label of "rock" to the classifier
  buttonA = select('#addClassRock');
  buttonA.mousePressed(function() {
    addExample('Rock');
  });

  // When the B button is pressed, add the current frame
  // from the video with a label of "paper" to the classifier
  buttonB = select('#addClassPaper');
  buttonB.mousePressed(function() {
    addExample('Paper');
  });

  // When the C button is pressed, add the current frame
  // from the video with a label of "scissor" to the classifier
  buttonC = select('#addClassScissor');
  buttonC.mousePressed(function() {
    addExample('Scissor');
  });

  // Reset buttons
  resetBtnA = select('#resetRock');
  resetBtnA.mousePressed(function() {
    clearLabel('Rock');
  });
	
  resetBtnB = select('#resetPaper');
  resetBtnB.mousePressed(function() {
    clearLabel('Paper');
  });
	
  resetBtnC = select('#resetScissor');
  resetBtnC.mousePressed(function() {
    clearLabel('Scissor');
  });

  // Predict button
  buttonPredict = select('#buttonPredict');
  buttonPredict.mousePressed(classify);

  // Clear all classes button
  buttonClearAll = select('#clearAll');
  buttonClearAll.mousePressed(clearAllLabels);

  // Load saved classifier dataset
  buttonSetData = select('#load');
  buttonSetData.mousePressed(loadMyKNN);

  // Get classifier dataset
  buttonGetData = select('#save');
  buttonGetData.mousePressed(saveMyKNN);
}

// Show the results
function gotResults(err, result) {
  // Display any error
  if (err) {
    console.error(err);
  }

  if (result.confidencesByLabel) {
    const confidences = result.confidencesByLabel;
    // result.label is the label that has the highest confidence
    if (result.label) {
      select('#result').html(result.label);
      select('#confidence').html(`${confidences[result.label] * 100} %`);
      preds.innerHTML = result.label + ' with confidence of ' + confidences[result.label] * 100 + '%';
    }

    select('#confidenceRock').html(`${confidences['Rock'] ? confidences['Rock'] * 100 : 0} %`);
    select('#confidencePaper').html(`${confidences['Paper'] ? confidences['Paper'] * 100 : 0} %`);
    select('#confidenceScissor').html(`${confidences['Scissor'] ? confidences['Scissor'] * 100 : 0} %`);
  }

  classify();
}

// Update the example count for each label	
function updateCounts() {
  const counts = knnClassifier.getCountByLabel();

  select('#exampleRock').html(counts['Rock'] || 0);
  select('#examplePaper').html(counts['Paper'] || 0);
  select('#exampleScissor').html(counts['Scissor'] || 0);
}

// Clear the examples in one label
function clearLabel(label) {
  knnClassifier.clearLabel(label);
  updateCounts();
}

// Clear all the examples in all labels
function clearAllLabels() {
  knnClassifier.clearAllLabels();
  updateCounts();
}

// Save dataset as myKNNDataset.json
function saveMyKNN() {
  knnClassifier.save('myKNNDataset');
}

// Load dataset to the classifier
function loadMyKNN() {
  knnClassifier.load('./myKNNDataset.json', updateCounts);
}

// helper function to wait some milliseconds

function wait(ms, start) {
  if (start < ms) {
      setTimeout(function() {
        gready.innerHTML += '... ' + (ms-start);
        wait(ms,++start);
      }, 1000); // 1 second (in milliseconds)
  } else {
    gready.innerHTML = '';
  }
}

// Execute commands based on input
function executeCommand(cmd) {
  cmds = cmd;
  switch (cmds) {
    case "predict":
      console.log("PREDICT COMMAND...");
      setTimeout(function() {
        recognized.innerHTML = "PREDICT COMMAND...";
      }, 1);
      classify();
      break;
    case "record rock":
      console.log("RECORD ROCK COMMAND...");
      setTimeout(function() {
        recognized.innerHTML = "RECORD ROCK COMMAND...";
      }, 1);
      wait(3, 0);
      [5].forEach(i => Array(i).fill(i).forEach(_ => {
        addExample('Rock');
      }))

      break;
    case "record paper":
      console.log("RECORD PAPER COMMAND...");
      recognized.innerHTML = "RECORD PAPER COMMAND...";
      wait(3, 0);
      [5].forEach(i => Array(i).fill(i).forEach(_ => {
        addExample('Paper');
      }))
      break;
    case "record scissor":
      console.log("RECORD SCISSOR COMMAND...");
      recognized.innerHTML = "RECORD SCISSOR COMMAND...";
      wait(3, 0);
      [5].forEach(i => Array(i).fill(i).forEach(_ => {
        addExample('Scissor');
      }))
      break;
    case "reset rock":
      console.log("RESET ROCK COMMAND...");
      recognized.innerHTML = "RESET ROCK COMMAND...";
      clearLabel('Rock');
      break;
    case "reset paper":
      console.log("RESET PAPER COMMAND...");
      recognized.innerHTML = "RESET PAPER COMMAND...";
      clearLabel('Paper');
      break;
    case "reset scissor":
      console.log("RESET SCISSOR COMMAND...");
      recognized.innerHTML = "RESET SCISSOR COMMAND...";
      clearLabel('Scissor');
      break;
    case "load":
      console.log("LOAD COMMAND...");
      recognized.innerHTML = "LOAD COMMAND...";
      loadMyKNN();
      break;
    case "save":
      console.log("SAVE COMMAND...");
      recognized.innerHTML = "SAVE COMMAND...";
      saveMyKNN();
      break;
    case "clear":
      console.log("CLEAR ALL LABELS COMMAND...");
      recognized.innerHTML = "CLEAR ALL LABELS COMMAND...";
      clearAllLabels();
      break;
    default:
      console.log("What is '"+cmds+"' ?");
      recognized.innerHTML = "What is '"+cmds+"' ?";
  };
  recognized.innerHTML += "... Done!";
}

// Event handlers for speech recognition
recognition.onresult = function(event) {
  var last = event.results.length - 1;
  word = event.results[last][0].transcript.trim().toLowerCase();
  if (wakeWordReceived == false && word == "hey jarvis") {
    console.log("Wake word received, ready to receive command...");
    recognized.innerHTML = "Wake word received, ready to receive command...";
    wakeWordReceived = true;
  } else if (wakeWordReceived == true) {
    console.log("Executing command: ", word);
    recognized.innerHTML = "Executing command: " + word;
    executeCommand(word);
    wakeWordReceived = false;
  } else {
    console.log("Please say the wake word first");
    recognized.innerHTML = "Please say the wake word first";
  }
}

// Not sure if I need this event handler since the speech recognition service is continuous
recognition.onnomatch = function(event) {
  console.log("no match, try again");
}

// If no-speech encountered (after 6 seconds of silence), restart the service with onend event handler loop
recognition.onerror = function(event) {
  console.log("Error encountered: ", event.message)
  recognition.stop();
};

// restarts the service, whenever it ends
recognition.onend = function() {
  console.log("onend hit, restarting...")
  recognition.start();
};

