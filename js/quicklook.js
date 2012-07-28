(function($, document, window, undefined){

	$.fn.quicklook = function(o){
		
		var defaults = {
			speed: 400,
			controlFadeSpeed: 200,
			validateImages: true,
			enableNavigation: true,
			onLoad: {},
			onClick: {},
			onSkip: {},
			onImageLoad: {},
			onImageError: {},
			onClose: {}
		};

		o = $.extend({}, defaults, o);
		
		quicklook.initialize(this, o);
		return quicklook;		
	};

	var quicklook = {
		
		speed: 400, // Fade speed and zoom speed for the image preview
		element: [], // The active link element
		thumbnail: [], // The active thumbnail image
		fullimage: [], // The active full size image

		initialize : function(elements, o){
			
			// Copy options
			for(var x in o){
				this[x] = o[x];
			}

			// Cache elements
			this.linkElements = elements;
			
			if(this.validateImages){ this.validateLinks(); }

			// Cache window dimentions
			this.windowHeight = $(window).height();
			this.windowWidth = $(window).width();

			// Add the quicklook elements to the DOM
			this.addQuicklookWindow();

			// Bind events
			this.bind();

			if(typeof quicklook.onLoad === 'function'){
				quicklook.onLoad(this.linkElements, quicklook.qlWindow);
			}

			return quicklook;
		},

		bind : function(){

			// Main click to view event
			this.linkElements.on('click', function(e){
				quicklook.element = $(this);
				quicklook.thumbnail = quicklook.element.find('img').length ? quicklook.element.find('img').eq(0) : $(this);
				quicklook.locateWindow();
				quicklook.loadLargeImage();
				if(typeof quicklook.onClick === 'function'){
					quicklook.onClick(quicklook.element, quicklook.thumbnail);
				}
				e.preventDefault();
			});

			// Show and hide close button
			quicklook.qlWindow.hover( function(){
				quicklook.qlMast.stop().fadeIn(quicklook.speed);
			}, function(){
				quicklook.qlMast.delay(1000).stop().fadeOut(quicklook.speed);
			});

			// Click to skip to next image
			if(quicklook.enableNavigation){
				$(quicklook.qlInner).on('click', function(e){
					quicklook.skipImage.call(this);
				});
			}

			// CLose when clicking outside quicklook window
			this.qlCover.on('click', function(){
				quicklook.close();
			});

			// Close when clicking close button
			quicklook.qlClose.on('click', function(){
				quicklook.close();
			});

			// Recache window size
			$(window).resize(function(){
				quicklook.windowWidth = this.innerWidth;
				quicklook.windowHeight = this.innerHeight;
				quicklook.setMaxImageSize(quicklook.qlWindow);		
			});
		},

		// Bind key event handlers to skip images and close quicklook
		bindKeys : function(){
			quicklook.keybinding = $(window).on('keydown', function(e){	
				if(quicklook.enableNavigation){
					// Right arrow - skip to next image
					if(e.which === 39){
						quicklook.skipImage.call(this);
						e.preventDefault();
					}
					// Left arrow - skip to previous image
					if(e.which === 37){
						quicklook.skipImage.call(this, true);
						e.preventDefault();
					}
				}
				// Escape key - close the quicklook window
				if(e.which === 27){
					quicklook.close();
					e.preventDefault();
				}
			});
		},

		// Get the position of the thumbnail image so we can place quicklook over it
		getThumbCoordinates : function(){
			return {
				top: quicklook.thumbnail.offset().top,
				left: quicklook.thumbnail.offset().left,
				width: quicklook.thumbnail.width(),
				height: quicklook.thumbnail.height()
			};
		},

		// Calculate and return the size and position for the quicklok window based on the window size and image size
		getWindowCoordinates : function(){
			var windowWidth = quicklook.windowWidth,
				windowHeight = quicklook.windowHeight,
				scrolltop = $(window).scrollTop(),
				scrollleft = $(window).scrollLeft();
			
			return {
				winWidth: windowWidth,
				winHeight: windowHeight,
				imgWidth: quicklook.fullimageWidth,
				imgHeight: quicklook.fullimageHeight,
				top: (windowHeight - quicklook.fullimageHeight)/2,
				left: (windowWidth - quicklook.fullimageWidth)/2,
				scrolltop: scrolltop,
				scrollleft: scrollleft
			};
		},

		// Set the position of the quicklook window
		locateWindow : function(){
			var thumbPos = this.getThumbCoordinates();
			quicklook.qlWindow.css({
				top: thumbPos.top,
				left: thumbPos.left,
				width: thumbPos.width,
				height: thumbPos.height,
				opacity: 1
			}).show();
			return quicklook;
		},

		// Quicklook is loading an image
		loading : function(){
			quicklook.qlWindow.addClass('loading').removeClass('loaded');
			clearTimeout(quicklook.loaderTimeout);
			quicklook.loaderTimeout = setTimeout(function(){
				quicklook.qlLoader.fadeIn(100);
			}, 300);
		},

		// The image has finished loading
		loaded : function(){
			clearTimeout(quicklook.loaderTimeout);
			quicklook.element.addClass('active');
			quicklook.qlWindow.removeClass('loading error').addClass('loaded');
			quicklook.qlLoader.fadeOut(quicklook.speed);
			if( !quicklook.keybinding ){ quicklook.bindKeys(); }
			if(typeof quicklook.onImageLoad === 'function'){
				quicklook.onImageLoad();
			}
			return quicklook;
		},

		// Filter through all quicklook selector elements and remove them unless they point to an image URL
		validateLinks : function(){
			var i, newArray=[], len = quicklook.linkElements.length;
			for(i=0; i<len; i++){
				var href = $(quicklook.linkElements[i]).attr('href');
				if(href.match(/(jpg|jpeg|png|gif|tiff|pict|bmp|svg)$/)){
					newArray.push( quicklook.linkElements[i] );
				}
			}
			quicklook.linkElements = $(newArray);
			return quicklook;
		},

		// Load the full image from an image link into the quicklook window
		// This is the initial event triggered by clicking an image link
		loadLargeImage : function(){

			var imageURI = quicklook.element.attr('href');
			var img = $('<img />', {
				src : imageURI
			}).load(function(){

				// Set the size of the zoomed image
				quicklook.setMaxImageSize(this);					

				// Resize to fit on thumbnail
				$(this).width( '100%' ).height( '100%' );

				// Fire loaded event
				quicklook.loaded();

				// Add to DOM
				quicklook.qlInner.html(this);
				quicklook.qlWindow.css({display: "block", opacity: 0});

				// Zoom it
				quicklook.zoomQlWindow();
			});

			// Handle error loading image
			img.error(function(e){
				quicklook.error(img);
				quicklook.close();
			});
			
			return quicklook;
		},

		// Load the next image known by quicklook
		// This is triggered by clicks or keypresses when the quicklook window is already loaded
		skipImage : function(prev){
			
			// Only run if we're not currently animating the window
			if( quicklook.qlWindow.is(":animated") ){ return false; }

			var activeItems = quicklook.linkElements;
			
			var i, itemIndex, currentItem, nextItem, nextItemImage, total = activeItems.length;
			for(i=0; i<total; i++){
				if( $(activeItems[i]).hasClass('active') ){
					currentItem = $(activeItems[i]);
					nextItem = (i+1 === total)? $(activeItems[0]) : $(activeItems[i+1]);
					break;
				}
			}

			quicklook.loading();
			nextItemImage = nextItem.attr('href');
			currentItem.removeClass('active');
			nextItem.addClass('active');
			quicklook.element = nextItem;

			if(typeof quicklook.onSkip === 'function'){
				quicklook.onSkip(nextItem, nextItemImage);
			}

			if( quicklook.loadError ){ quicklook.loadError.unbind('error'); }

			if(nextItemImage){

				var img = $('<img />', {
					src : nextItemImage
				}).load(function(){

					quicklook.loadError.unbind('error');

					$(quicklook.qlInner).find('span.loading').remove();

					// Set the size of the zoomed image
					quicklook.setMaxImageSize(this);

					// Place the new image transaprently on top of the previous one
					$(this).css({
						width: '100%',
						height: '100%',
						position: 'absolute',
						top: 0, left: 0,
						opacity: 0
					});

					quicklook.loaded();
					quicklook.qlInner.append(this);
					quicklook.resizeQlWindow();
				});

				quicklook.loadError = img.error(function(e){
					quicklook.error(img);
				});
			}
			return quicklook;
		},

		// Set the size of the zoomed image so it's never bigger than the screen
		setMaxImageSize : function(image){
			var screenWidth = quicklook.windowWidth-40;
			var screenHeight = quicklook.windowHeight-40;
			var imageWidth = image.width;
			var imageHeight = image.height;

			if( imageWidth > screenWidth || imageHeight > screenHeight ){
				if( imageWidth > imageHeight ){
					quicklook.fullimageWidth = screenWidth;
					quicklook.fullimageHeight = Math.round( (imageHeight / imageWidth) * screenWidth );
					if( quicklook.fullimageHeight > screenHeight ){
						var r = Math.round( (screenHeight / quicklook.fullimageHeight) * 100 );
						quicklook.fullimageHeight = screenHeight;
						quicklook.fullimageWidth = Math.round( (quicklook.fullimageWidth / 100 ) * r );
					}
				}
				else if( imageHeight > imageWidth){
					quicklook.fullimageHeight = screenHeight;
					quicklook.fullimageWidth = Math.round( (imageWidth / imageHeight) * screenHeight );
					if( quicklook.fullimageWidth > screenWidth ){
						var r = Math.round( (screenWidth / quicklook.fullimageWidth) * 100 );
						quicklook.fullimageWidth = screenWidth;
						quicklook.fullimageHeight = Math.round( (quicklook.fullimageHeight / 100 ) * r );
					}
				}
				else {
					quicklook.fullimageWidth = screenWidth;
					quicklook.fullimageHeight = screenWidth;
				}
			}
			else{
				quicklook.fullimageWidth = imageWidth;
				quicklook.fullimageHeight = imageHeight;
			}
			return quicklook;
		},

		zoomQlWindow : function(){
			var qlPos = quicklook.getWindowCoordinates();

			// Animate the window size
			quicklook.qlWindow.animate({
				top: qlPos.top+qlPos.scrolltop,
				left: qlPos.left+qlPos.scrollleft,
				width: qlPos.imgWidth,
				height: qlPos.imgHeight,
				opacity: 1
			},
			// Reconfigue the CSS so that the image is positioned relative to the window
			quicklook.speed, function(){
				$(this).css({
					top: '50%',
					left: '50%',
					marginTop: qlPos.scrolltop-qlPos.imgHeight/2,
					marginLeft: qlPos.scrollleft-qlPos.imgWidth/2
				});
			});
			quicklook.qlCover.fadeIn( quicklook.speed );
			return quicklook;
		},

		resizeQlWindow : function(){
			var qlPos = quicklook.getWindowCoordinates();

			var images = quicklook.qlWindow.find('img');
			
			// Fade out then remove the previous image
			$(images[0]).stop().fadeOut(quicklook.speed, function(){ $(this).remove(); });
			
			// Fade in the new image
			$(images[1]).stop().animate({opacity: 1}, quicklook.speed);

			// Resize the quicklook window
			quicklook.qlWindow.stop().animate({
				marginTop: qlPos.scrolltop-qlPos.imgHeight/2,
				marginLeft: qlPos.scrollleft-qlPos.imgWidth/2,
				width: qlPos.imgWidth,
				height: qlPos.imgHeight
			}, quicklook.speed);

			$(quicklook.qlNext, quicklook.qlPrev).hide();
			return quicklook;
		},

		close : function(){
			quicklook.qlCover.fadeOut( quicklook.speed );
			quicklook.element.removeClass('active');
			var thumbPos = this.getThumbCoordinates();
			var qlPos = quicklook.getWindowCoordinates();

			quicklook.qlWindow.css({
				top: quicklook.qlWindow.offset().top,
				left: quicklook.qlWindow.offset().left,
				marginTop: 0,
				marginLeft: 0
			});

			quicklook.qlWindow.animate({
				top: thumbPos.top,
				left: thumbPos.left,
				width: thumbPos.width,
				height: thumbPos.height,
				opacity: 0
			}, quicklook.speed, function(){
				$(this).hide();
				quicklook.qlInner.find('img').remove();
			});

			if( quicklook.keybinding ){
				quicklook.keybinding.unbind('keydown');
				delete quicklook.keybinding;
			}
			if(typeof quicklook.onClose === 'function'){
				quicklook.onClose(quicklook.qlWindow);
			}
			return quicklook;
		},

		error : function(img){
			quicklook.qlWindow.addClass('error');
			clearTimeout(quicklook.loaderTimeout);
			quicklook.qlLoader.hide();
			quicklook.qlInner.find('img').hide();
			if(typeof quicklook.onImageError === 'function'){
				quicklook.onImageError(img);
			}
			return quicklook;
		},

		addQuicklookWindow : function(){
			this.qlCover = $('<div>', { id : "quicklookcover"} ).appendTo('body');
			this.qlWindow = $('<div>', { id : "quicklookwindow"} ).appendTo('body');
			this.qlInner = $('<div>', { id : "quicklookinner"} ).appendTo(this.qlWindow);
			this.qlMast = $('<div>', { id : "quicklookmast"} ).prependTo(this.qlWindow);
			this.qlClose = $('<a>', {id: 'quicklookclose'} ).prependTo(this.qlMast);
			this.qlLoader = $('<div>', { id : "quicklookloader"} ).appendTo(this.qlWindow);
			return quicklook;
		}
	};

})(jQuery, document, window, undefined);