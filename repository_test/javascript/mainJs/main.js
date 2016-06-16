// ALWAYS add into ALL the files using angularjs
'use strict';

/**
 * Declaration of the videoApp application
 */
var videoApp = angular.module('videoApp', [
    // Module dependance
    'videoSite'
]);

/**
 * Declaration of the video module
 */
var videoSite = angular.module('videoSite',[]);

/**
 * Controller of the app videoSite
 */
videoSite.controller('videoCtrl', ['$scope',
    function ($scope) {
		
		
		//use to know if it's currently recording
		var play = $scope.play = false;
		//use to know if the user can launch or not the resume or the pause function
		var neverStop = $scope.neverStop = true;
		//use to know if it starts recording 
		var dontRecord = $scope.dontRecord = true;
		//use to know if it definitely stops
		var end = $scope.end = false;
		
		//use to know which page of the pdf is displayed
		var page=1;
		//use to have the order of page
		var listPage=[];
		//use to store the pdf presentation as image
		var pdfImg=[];
		//use to store the url of the images
		var imagurl1=[];
		var imagurl2=[];
		//the number of pages in the pdf
		var maxPages;
		//the number of pages used
		var nbImg=0;
		
		//use to know the type of the uploaded presentation
		var isPDF = false;
		var isPPT = false;
		
		var canDl = false;
		
		//use to store the uploaded presentation
		var uplPres;
		//use to get the temporary path of the file
		var tmppath;
		
		//use to store the timecode of the slides switch
		//this is an array of array. Each array that it contents consists of
		//two number. The first is the timecode, the second the page of the pdf.
		//var listFrames = [];
		var indListFrames = 0;
		var countUpTime; //it's a timer
		var listImg; //object which content the list of frames with the timecode
		var code;
		
		//use to manipulate the record
		var videoRecord=document.getElementById("record");
		//use to record the video
		var mediaRecorder;
		//use to save the recorded video
		var dataRecorded;
		//use to buffer the video
		var sourceBuffer;
		
		//use to get the canvas and it context
		var ca, co;
		
		//élément de mp4
		var mp4 = function(){
			this.src="";
			this.mimetype="video/webm";
			this.res=new res();
		};
		
		var res = function(){
			this.w="640";
			this.h="480";
		};
		
		//elements of images
		var imag=function(){
			this.mimetype="image/jpeg";
			this.frames=[];
			this.count=0;
			this.duration=0;
			this.res=new res();
		};
		
		//elements of frames
		var fra = function(){
			this.time=0;
			this.src="";
		};
		
		var frameL = function(){
			this.id="";
			this.mimetype="image/jpeg";
			this.time="";
			this.url="";
			this.thumb="";
		};
		
		//informations
		var metadata = function(){
			this.duration=0;
			this.title="void";
		};
		
		//the arguments is used to know which constructor must be call
		var sources = function(){
			if(arguments.length===0){
				this.mp4=[];
			}
			if(arguments.length===1){
				this.image=[];
			}
		};
		
		var stream = function(){
			//source 1, only mp4
			this.sources = new sources();
			this.preview="";
		};
		
		//update metadata at the end, update stream at the end, update frameList
		//each time the user changes the slides
		var paellaPresentation = function(){
				this.metadata = new metadata();
				this.streams=[];
				this.frameList=[];			
		};
		var paellaPres = new paellaPresentation();
		
		var duo = function(t, s){
			this.time=t;
			this.src=s;
			
			//Hold instance of this class
			var thisObject = this;
			
			this.getTim = function(){
				return thisObject.time;
			};
			
			this.getSource = function(){
				return thisObject.src;
			};
		};
		
		//use to know when a slide changes
		var img = function(){        
			this.mimetype="image/jpeg";
    
			this.listFrames=[];
			
			this.count=0;
			
			this.duration=0;
			this.res = new res();
			
			//Hold instance of this class
			var thisObject = this;
			
			this.getlistFrames = function(){
				return thisObject.listFrames;
			};

		};
		
		//use to know when a slide changes
		var Timer = function(){        
			//Frequency of elapse event of the timer in millisecond
			this.Interval = 1000;
    
			//Whether the timer is enable or not
			this.Enable = new Boolean(false);
			
			//The timer itself
			this.Timecode = 0;
			
			//Hold instance of this class
			var thisObject = this;
			
			//Hold id of the timer
			var timerId = 0;
			
			this.getTimecode = function(){
				return thisObject.Timecode;
			};
    
			//Timer tick
			this.Tick = function()
			{
				thisObject.Timecode=thisObject.Timecode+1;
				//console.log("Timer: "+thisObject.Timecode);
				if ($scope.displayArt2 == true){
					for (var i=0; i<indListFrames; i++){
					if (listImg.listFrames[i].getTim()==thisObject.Timecode){
						var tmpDpath=tmppath+"&page="+listImg.listFrames[i].getSource();
							//document.getElementById("disSlides").setAttribute('data',tmpDpath);
							console.log("Timecode: "+listImg.listFrames[i].getTim()+", page: "+ listImg.listFrames[i].getSource());
						}
					}
				}
			};
    
			//Start the timer
			this.Start = function()
			{
				this.Enable = new Boolean(true);

				//thisObject = this;
				if (thisObject.Enable)
				{
					thisObject.timerId = setInterval(
					function()
					{
						thisObject.Tick(); 
					}, thisObject.Interval);
				}
			};
    
			// Function: Stops the timer
			this.Stop = function()
			{            
				thisObject.Enable = new Boolean(false);
				clearInterval(thisObject.timerId);
			};
		};
		
		
		navigator.getUserMedia = navigator.getUserMedia ||
			navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
		
		//important to provide to getUserMedia the right parameters
		var constraints = {
			audio: true,
			video: true
		};
		
		function successCallback(stream) {
			console.log('getUserMedia() got stream: ', stream);
			window.stream = stream;
			if (window.URL) {
				videoRecord.src = window.URL.createObjectURL(stream);
			} else {
				videoRecord.src = stream;
			}
		}
		
		//not obligatory excepted in Firefox
		function errorCallback(error) {
			console.log('navigator.getUserMedia error: ', error);
		}
		
		navigator.getUserMedia(constraints, successCallback, errorCallback);
		
		
		
		//function to record
		function startRecording(){
			//creation of the options
			var options = {mimeType: 'video/webm'};
			//declaration of our data savior table
			dataRecorded = [];
			//Because the creation of the mediaRecorder can fail
			try {
				//creation of the recorder with the specified options
				mediaRecorder = new MediaRecorder(window.stream, options);
			} catch (e0) {
				console.log('Exception while creating MediaRecorder: ', e0);
			try {
				//if the program comes here, the previous options might not be understand
				//so we add more precision about it and try to create a new mediaRecorder
				options = {mimeType: 'video/webm,codecs=vp9'};
				mediaRecorder = new MediaRecorder(window.stream, options);
			} catch (e1) {
				console.log('Exception while creating MediaRecorder: ', e1);
				try {
					//if the program comes here, the previous options might not be understand
					//so we add more precision about it and try to create a new mediaRecorder
					options = 'video/vp8'; // Chrome 47
					mediaRecorder = new MediaRecorder(window.stream, options);
				} catch (e2) {
					alert('MediaRecorder is not supported by this browser.\n\n' +
						'Try Firefox 29 or later, or Chrome 47 or later.\n' +
						'Also check the proper functioning of your recording device.\n' +
						'Be sure that you enabled Firefox to access to it in the pop-up on the top left of your screen.');
					console.error('Exception while creating MediaRecorder:', e2);
					return;
					}
				}
			}
			console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
			mediaRecorder.ondataavailable = handleDataAvailable;
			mediaRecorder.start(10); // collect 10ms of data
			//Timer launch
			countUpTime = new Timer();
			countUpTime.Start();
			
			//to get the first displayed pdf page
			code = new duo(0, page);
			listPage[0]=page;
			listImg = new img();
			
			imagurl1[page]=ca.toDataURL("image/jpeg").substr(23);
			imagurl2[page]=ca.toDataURL("image/jpeg");
			nbImg++;
			
			//add it to the list of Frames
			listImg.listFrames[indListFrames]=code;
			console.log("The following frame has beed added to the array of frames:  " + listImg.listFrames[indListFrames].getTim()+","+listImg.listFrames[indListFrames].getSource());
			indListFrames=indListFrames+1;
			listImg.count++;
			console.log('MediaRecorder started', mediaRecorder);
		}
		
		function handleDataAvailable(event) {
			if (event.data && event.data.size > 0) {
				dataRecorded.push(event.data);
			}
		}
		
		//use to begin the recording
		$scope.lecture=function(){
			startRecording();
			$scope.play=true;
			$scope.dontRecord=false;
			console.log('MediaRecorder starts recording ', mediaRecorder);
		};
		
		//use to pause the recording
		$scope.pause=function(){
			$scope.play=false;
			mediaRecorder.pause();
			//don't forget to pause the timer
			countUpTime.Stop();
			console.log('MediaRecorder in pause ', mediaRecorder);
		};
		
		//use to resume the recording
		$scope.resume=function(){
			mediaRecorder.resume();
			$scope.play=true;
			//don't forget to launch the timer
			countUpTime.Start();
			console.log('MediaRecorder resumed ', mediaRecorder);
		};
		
		//use to stop the recording
		$scope.stop=function(){
			//to avoid a bug if the recording is already paused
			if(mediaRecorder.state!='paused'){
				//both are needed to avoid recording when the user is reading the confirm message
				mediaRecorder.pause();
				countUpTime.Stop();
			}
			//If the user stops records, he won't be able to resume to it after, so it's important to ask him if he wanna do this
			var willStop = confirm("Are you sure you want to stop recording ?\nYou won't be able to resume recording.");
			if (willStop){
				$scope.neverStop=false;
				mediaRecorder.stop();
				countUpTime.Stop();
				listImg.duration = countUpTime.Timecode;
				console.log('Recorded Blobs: ', dataRecorded);
				$scope.end=true;
				console.log('MediaRecorder stops recording ', mediaRecorder);
				
				//création du json spécial paella 
				var paepre = new paellaPresentation();
				paepre.metadata.title="Visualisation";
			
				//create the frameList part of the json
				for(var i=0; i<indListFrames; i++){
					var fl = new frameL();
					fl.id="frame_"+listImg.listFrames[i].getTim();
					fl.time=listImg.listFrames[i].getTim();
					fl.url=imagurl2[i+1];
					fl.thumb=fl.url;
					paepre.frameList[i]=fl;
				}
			
				//create the streams part of the json
				var v = new mp4();
			
				var up = new Blob(dataRecorded, {type: 'video/webm'});
				var urup = window.URL.createObjectURL(up);

			
				v.src=urup;

				var s1 = new sources();
				var s2 = new sources(5);
				s1.mp4[0]=v;
			
				var j = new imag();
				j.count=listImg.count;
				j.duration=paellaPres.metadata.duration;
				for(var i=0; i<indListFrames; i++){
					var f = new fra();
					f.time=listImg.listFrames[i].getTim();
					f.src=imagurl2[i+1];
				
					j.frames[i]=f;
				}
				s2.image[0]=j;
			
				var vlv = document.getElementById("test");
			
				var st1 = new stream();
				st1.sources=s1;
				st1.preview="";
			
				var st2 = new stream();
				st2.sources=s2;
				st2.preview=imagurl2[1];
			
				paepre.streams[0]=st1;
				paepre.streams[1]=st2;
			
				var dataJson = JSON.stringify(paepre);
				console.log(dataJson);
			
				document.getElementById("visuaRecor").style="display:none";
				document.getElementById("noRecYet").style="display:none";
				document.getElementById("completeTheEmpty").style="display:inline"
			
				//create the paellaplayer
				paella.load("playerContainer", {data: dataJson});
				/*var imadata=document.getElementById("playerContainer_videoContainer_2").src;
				imadata.replace("nulldata","data");
				document.getElementById("playerContainer_videoContainer_2").src=imadata;*/
				/*var imgdata =  $($("#playerContainer_videoContainer_2")[0]).attr("src”);
				imgdata.replace("nulldata","data");
				$($("#playerContainer_videoContainer_2")[0]).attr("src", imgdata);*/
				
				canDl = true;
				
				}
				else{
					mediaRecorder.resume();
					countUpTime.Start();
				}
		};
		
		
		/*//use to return to the article 1
		$scope.retour=function(){
			//If the user record a new video, it will delete the previous video
			var willReturn = confirm("Are you sure you want to record a new video ?\nThe actual recording will be deleted.");
			if (willReturn){
				//reset all the parameters
				$scope.displayArt2 = false;
				$scope.displayArt1 = true;
				$scope.play = false;
				$scope.neverStop = true;
				$scope.end=false;
				$scope.dontRecord=true;
				page=1;
				listImg.listFrames=[];
				indListFrames = 0;
				countUpTime.Stop();
				countUpTime.Timecode = 0;
			}
		};*/
		
		//call when the user upload his pdf presentation
		$scope.upload=function(){
			//get the file uploader
			var fic=document.getElementById("myFile");
			
			if('files' in fic){
				
				if (fic.files[0].type==='application/pdf'){
					
					isPDF = true;
					uplPres=fic.files[0];
					tmppath=URL.createObjectURL(fic.files[0]);
					
					PDFJS.getDocument(tmppath).then(function(pdf){
						
						maxPages = pdf.numPages;
						
						pdf.getPage(1).then(function(p){
							ca = document.getElementById('dispPartOne');
							co = ca.getContext('2d');	
							pdfImg[page]=p;
							console.log("Ready to continue");
							document.getElementById("staRec").style="display:inline";
							document.getElementById("nex").style="display:inline";
							document.getElementById("prev").style="display:inline";
							document.getElementById("instruc").style="display:none";
							//this part is for displaying the first image
							var im = pdfImg[page];
							var vp = im.getViewport(1);
							var vp2 = im.getViewport(500/vp.width);
					
							var renderContext = {
								canvasContext: co,
								viewport: vp2
							};
							im.render(renderContext);
							isPDF = true;
						});
					});
				}
				else if(fic.files[0].type==='application/vnd.ms-powerpoint'){
					isPPT = true;
				}
				else{
					alert("You need to select a pdf or a ppt file.");
				}
			}
		}
		
		//use to display the next slide
		$scope.nextSlide=function(){
			if(page < maxPages){
				page=page+1;
				
				if(isPDF){
					PDFJS.getDocument(tmppath).then(function(pdf){
						
						pdf.getPage(page).then(function(p){
							ca = document.getElementById('dispPartOne');
							co = ca.getContext('2d');
							if(typeof pdfImg[page]==='undefined'){
								pdfImg[page]=p;
							}
							
							var im = pdfImg[page];
							var vp = im.getViewport(1);
							var vp2 = im.getViewport(500/vp.width);
					
							var renderContext = {
								canvasContext: co,
								viewport: vp2
							};
							im.render(renderContext).then(function(){
								if(!$scope.dontRecord && $scope.neverStop){
									if(typeof imagurl1[page] === 'undefined'){
										imagurl1[page]=ca.toDataURL("image/jpeg").substr(23);
										imagurl2[page]=ca.toDataURL("image/jpeg");
										nbImg++;
									}
								}
							});
							
						});
					});	
				}
				
				if(!$scope.dontRecord && $scope.neverStop){
					//take the timecode of the recording video
					var tc = countUpTime.getTimecode();
					//create a new object containing the timecode and the page which is display
					code = new duo(tc, page);
					//add to our list of frames the new duo timecode/page
					listImg.listFrames[indListFrames]=code;
					listPage[indListFrames]=page;
					console.log("The following frame has beed added to the array of frames: " + listImg.listFrames[indListFrames].getTim()+","+listImg.listFrames[indListFrames].getSource());
					indListFrames=indListFrames+1;
					listImg.count++;
				}
			}
		};
		
		//use to display the previous slide
		$scope.previousSlide=function(){
			//can't bo back if it's the beginning
			if(page >=2){
				page=page-1;
				if(isPDF){
					PDFJS.getDocument(tmppath).then(function(pdf){
						
						maxPages = pdf.numPages;
						
						pdf.getPage(page).then(function(p){
							ca = document.getElementById('dispPartOne');
							co = ca.getContext('2d');
							if(typeof pdfImg[page]==='undefined'){
								pdfImg[page]=p;
							}
							
							var im = pdfImg[page];
							var vp = im.getViewport(1);
							var vp2 = im.getViewport(500/vp.width);
					
							var renderContext = {
								canvasContext: co,
								viewport: vp2
							};
							im.render(renderContext).then(function(){
								if(!$scope.dontRecord && $scope.neverStop){
									if(typeof imagurl1[page] === 'undefined'){
										imagurl1[page]=ca.toDataURL("image/jpeg").substr(23);
										imagurl2[page]=ca.toDataURL("image/jpeg");
										nbImg++;
									}
								}
							});
						});
					});	
				}
				if(!$scope.dontRecord && $scope.neverStop){
					//take the timecode of the recording video
					var tc = countUpTime.getTimecode();
					//create a new object containing the timecode and the page which is displays
					code = new duo(tc, page);
					//add to our list of frames the new duo timecode/page
					listImg.listFrames[indListFrames]=code;
					listPage[indListFrames]=page;
					console.log("The following frame has beed added to the array of frames: " + listImg.listFrames[indListFrames].getTim()+","+listImg.listFrames[indListFrames].getSource());
					indListFrames=indListFrames+1;
					listImg.count++;
				}
			}
		};
		
		//use to download the zip which content the video, the presentation and the json
		$scope.dlUser=function(){
			
			if(canDl){
				//use to change the name of the folder, so the user don't download all the time the same folder's name
				var dateObj = new Date();
				var month = dateObj.getUTCMonth()+1;
				var day = dateObj.getUTCDate();
				var year = dateObj.getUTCFullYear();
				var newdate = day+"-"+month+"-"+year;
			
				//create the metadata part of the json
				paellaPres.metadata.title="presentation"+newdate;
			
				//create the frameList part of the json
				for(var i=0; i<indListFrames; i++){
					var fl = new frameL();
					fl.id="frame_"+listImg.listFrames[i].getTim();
					fl.time=listImg.listFrames[i].getTim();
					//fl.url=imagurl[listPage[i]];
					fl.url="Image"+listPage[i]+".jpeg"
					fl.thumb=fl.url;
					paellaPres.frameList[i]=fl;
				}
			
				//create the streams part of the json
				var v = new mp4();
				v.src="Video.webm";

				var s1 = new sources();
				var s2 = new sources(5);
				s1.mp4[0]=v;
			
				var j = new imag();
				j.count=listImg.count;
				j.duration=paellaPres.metadata.duration;
				for(var i=0; i<indListFrames; i++){
					var f = new fra();
					f.time=listImg.listFrames[i].getTim();
					f.src="Image"+listPage[i]+".jpeg"
					j.frames[i]=f;
				}
				s2.image[0]=j;
			
				var st1 = new stream();
				st1.sources=s1;
				st1.preview="";
			
				var st2 = new stream();
				st2.sources=s2;
				st2.preview="Image1.jpeg";
			
				paellaPres.streams[0]=st1;
				paellaPres.streams[1]=st2;
			
			//For Json tests
			/*var jt = JSON.stringify(paellaPres);
			console.log("Le json vaut: "+jt);*/

			
				//create the zip, it folder and the differents files
				var zip = new JSZip();
				var dir = zip.folder("Presentation"+newdate);
				var uplVid = new Blob(dataRecorded, {type: 'video/webm'});
				var uplJson = JSON.stringify(paellaPres);
			
				//add the files to the folder
				dir.file("Video.webm", uplVid, {base64: true});
				dir.file("data.json", uplJson);
			
				//create image's file for each page of the presentation
				for (var a=1; a<=nbImg; a++){
					dir.file("Image"+a+".jpeg",imagurl1[a], {base64: true});
				}

				//generate the zip and download it
				zip.generateAsync({type: "blob"}).then(function(blob){
					saveAs(blob, "paellaPresentation"+newdate+".zip");
				}, function(fail){
					console.log("The operation failed because of: "+ fail);
				});	
				
			}
			else{
				alert("You don't have recorded any presentation yet. You'll be able to download when you'll have record something.");
			}
		};
    }
]);
