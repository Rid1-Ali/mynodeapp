//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;
var audioLink;
var gumStream; 						//stream from getUserMedia()
var recorder; 						//WebAudioRecorder object
var input; 							//MediaStreamAudioSourceNode  we'll be recording
var encodingType; 					//holds selected encoding for resulting audio (file)
var encodeAfterRecord = true;       // when to encode
var blobFile;

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //new audio context to help us record

//var encodingTypeSelect = document.getElementById("encodingTypeSelect");
var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var statusNote = document.getElementById("status2");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);

function startRecording() {
	console.log("startRecording() called");
	statusNote.innerHTML = "Recording...";
	/*
		Simple constraints object, for more advanced features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/

	var constraints = { audio: true, video: false }

    /*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

	navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
		// __log("getUserMedia() success, stream created, initializing WebAudioRecorder...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
		audioContext = new AudioContext();

		//update the format 
		// document.getElementById("formats").innerHTML="Format: 2 channel "+encodingTypeSelect.options[encodingTypeSelect.selectedIndex].value+" @ "+audioContext.sampleRate/1000+"kHz"

		//assign to gumStream for later use
		gumStream = stream;

		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);

		//stop the input from playing back through the speakers
		//input.connect(audioContext.destination)

		//get the encoding 
		encodingType = 'wav';

		//disable the encoding selector
		//encodingTypeSelect.disabled = true;

		recorder = new WebAudioRecorder(input, {
			workerDir: "./recJsFiles/", // must end with slash
			encoding: "wav",
			numChannels: 2, //2 is the default, mp3 encoding supports only 2
			onEncoderLoading: function (recorder, encoding) {
				// show "loading encoder..." display
				//__log("Loading "+encoding+" encoder...");
			},
			onEncoderLoaded: function (recorder, encoding) {
				// hide "loading encoder..." display
				// __log(encoding+" encoder loaded");
			}
		});

		recorder.onComplete = function (recorder, blob) {
			//__log("Recording complete");
			console.log("Recording complete");
			statusNote.innerHTML = "Recording";

			createDownloadLink(blob, recorder.encoding);
			console.log("1.audioLink is " + audioLink);


			console.log("File name is " + typeof (blobFile));
			var myFile = blobToFile(blobFile, "audio.wav");

			console.log("File name is " + typeof (myFile));

			var formdata = new FormData();
			formdata.append('audio', myFile, 'recorded.wav');




			//Ajax
			console.log('Ajax is called');
			$.ajax({
				url: "/users/upload",
				type: "POST",
				data: formdata,
				processData: false,
				contentType: false,
				success: function (res) {
					console.log("sent to server");
					;
				}
			});




			//encodingTypeSelect.disabled = false;
		}

		recorder.setOptions({
			timeLimit: 1200,
			encodeAfterRecord: encodeAfterRecord,
			ogg: { quality: 0.5 },
			mp3: { bitRate: 160 }
		});

		//start the recording process
		recorder.startRecording();

		//__log("Recording started");

	}).catch(function (err) {
		//enable the record button if getUSerMedia() fails
		recordButton.disabled = false;
		stopButton.disabled = true;

	});

	//disable the record button
	recordButton.disabled = true;
	stopButton.disabled = false;
}

function stopRecording() {
	console.log("stopRecording() called");

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//disable the stop button
	stopButton.disabled = true;
	recordButton.disabled = false;

	//tell the recorder to finish the recording (stop recording + encode the recorded audio)
	recorder.finishRecording();
	console.log("2.audioLink is " + audioLink);


	//__log('Recording stopped');
}

function createDownloadLink(blob, encoding) {

	var url = URL.createObjectURL(blob);
	audioLink = url;
	blobFile = blob;
	var au = document.createElement('audio');
	var li = document.createElement('li');
	var link = document.createElement('a');

	//add controls to the <audio> element
	au.controls = true;
	au.src = url;

	//link the a element to the blob
	link.href = url;
	link.download = new Date().toISOString() + '.' + encoding;
	link.innerHTML = link.download;

	//add the new audio and a elements to the li element
	li.appendChild(au);
	li.appendChild(link);

	//add the li element to the ordered list
	if (!recordingsList.hasChildNodes()) {
		recordingsList.appendChild(li);
	} else {
		recordingsList.replaceChild(li, recordingsList.firstChild);
	}









}



//helper function
function __log(e, data) {
	log.innerHTML += "\n" + e + " " + (data || '');
}
//blob to file
function blobToFile(theBlob, fileName) {
	//A Blob() is almost a File() - it's just missing the two properties below which we will add
	theBlob.lastModifiedDate = new Date();
	theBlob.name = fileName;
	return theBlob;
}



$(function () {
	// GET A TEXT
	$('#get-button').on('click', function () {
		$.ajax({
			url: 'users/gettext',
			contentType: 'application/json',
			success: function (response) {
				var tbodyEl = $('tbody');

				tbodyEl.html('');

				response.products.forEach(function (product) {
					tbodyEl.append('\
                        <tr>\
                            <td class="id">' + product.id + '</td>\
                            <td><input type="text" class="name" value="' + product.name + '"></td>\
                            <td>\
                                <button class="update-button">UPDATE/PUT</button>\
                                <button class="delete-button">DELETE</button>\
                            </td>\
                        </tr>\
                    ');
				});
			}
		});
	});




