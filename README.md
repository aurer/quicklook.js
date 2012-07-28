# Quicklook.js

Quicklook is a lightweight jQuery modal image viewer. You've seen them before and everyone's got one, this is my one.

## Usage

In order to use this you will obviously you will need to include the script and any accompanying CSS
	
	<link rel="stylesheet" href="/css/quicklook.css" type="text/css" media="screen" />
	<script src="/js/quicklook.js" ></script>
	
Then simply call it with a jQuery selector targeting any image links you wish to be handled by quicklook e.g.

	$(function(){
		$('.quicklook a').quicklook();
	});

You can even be a super lazy with your selector as quicklook will (by default) ignore any links that don't point at an image (see **validateImages** below)

	$(function(){
		$('a').quicklook();
	});

## Options and callbacks

### speed
The speed for most of the animations e.g fadein, fadeout, image transition etc. 

	$('.quicklook a').quicklook({
		speed: 400
	});

### controlFadeSpeed
The speed at which the controls (close button) fades in and out. 

	$('.quicklook a').quicklook({
		controlFadeSpeed: 200
	});

### validateImages
Enabled by default; quicklook will check the links it has been passed to see if they point to an image (jpg|jpeg|png|gif|tiff|pict|bmp|svg) and will ignore any that don't.

	$('.quicklook a').quicklook({
		validateImages: true
	});

### enableNavigation
Enabled by default; allows clicking on the loaded image to load the next quicklook enabled image.

	$('.quicklook a').quicklook({
		enableNavigation: true
	});

### onLoad (linkElements _array_, quicklookWindow _object_)
Callback fired when quicklook has initialised, contains the array of quicklook enabled links and the quicklook window element.

	$('.quicklook a').quicklook({
		onLoad: function(linkElements, quicklookWindow){
			console.log(linkElements, quicklookWindow);
		}
	});

### onClick (element _object_, thumbnail _object_)
Callback fired when a quicklook link is clicked, conatins the clicked links and it's thumbnail image.

	$('.quicklook a').quicklook({
		onClick: function(element, thumbnail){
			console.log(element, thumbnail);
		}
	});

### onSkip (element _object_, imageURL _string_)
Callback fired when skipping to the next image, contains the next link element and the next images URL.
	
	$('.quicklook a').quicklook({
		onSkip: function(element, imageURL){
			console.log(element, imageURL);
		}
	});
	
### onClose (quicklookWindow _object_)
Callback fired when the quicklook window is closed, contains the quicklook window element.
	
	$('.quicklook a').quicklook({
		onClose: function(quicklookWindow){
			console.log(quicklookWindow);
		}
	});

### onImageLoad (image _object_)
Callback for when an image preview has been loaded, contains the loaded image.

	$('.quicklook a').quicklook({
		onImageLoad: function(image){
			console.log(image);
		}
	});

### onImageError (image _object_)
Callback for when an image preview has failed to load, contains the image that failed to load.

	$('.quicklook a').quicklook({
		onImageError: function(image){
			console.log(image);
		}
	});