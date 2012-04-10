(function($){

  $.fn.niceselect = function(opts)
	{
		var options = $.extend({}, $.fn.niceselect.defaults, opts);
    
		return this.each(function(){
      
			if( !$(this).is('select') ) {
				throw new Exception("the jQuery niceselect plugin must be applied on select elements");
			}
      
			var $select = $(this);
			new Select($select, options);
		});
	};
  
  	/**
  	 * Prototype representing a fake select constructed by a <div> for the selected label and a <ul> for the list of options
  	 * @param $select : the real select to replace
  	 * @param options : the Class options (not the list of values)
  	 */
	function Select($select, options) {
		// The real select
		this.$select = $select;
		/// The options
		this.options = options;
		// The fake select
		this.$fakeSelect = $('<div />');
		// The fake options
		this.$fakeSelectOptions = $('<ul />');
    	
		this.init();
	}
  	
	Select.prototype = {
		init: function() {
			var self = this;
			
			// Get the selected item in the real select
			var $selectedItem = this.getSelectedItem();
			
			// Create the fake Select using a div containing the label as a "<span>" and
			// the options as a "<ul>" and </li>
			this.$fakeSelect
				.html('<span>'+$selectedItem.html()+'</span>')
				.addClass(this.options.labelClass);
				
			// Sets the options of the list
			this.$fakeSelectOptions.addClass(this.options.optionsClass);
			
			// Make the options
			this.makeFakeOptions();
			
			// Hide the options
			this.hideOptions();
      
			// Add the fake select in the page and hide the real select
			this.$select.after(this.$fakeSelect);
			this.$select.css('visibility', 'hidden');
			this.$fakeSelect.after(this.$fakeSelectOptions);
			
			// Ensure size
			this.$fakeSelect.css({
				'min-width': this.$select.width(),
				'min-height': this.$select.height(),
			});
			
			this.$select.width(this.$fakeSelect.width());
			
			// Update the position and size of the list of options
			this.$fakeSelect.css({
				'position': 'absolute',
				'left': this.$select.position().left,
				'top': this.$select.position().top,
			});
			
			this.$fakeSelectOptions.css({
				'position': 'absolute',
				'top': this.$fakeSelect.position().top + this.$fakeSelect.height()/2,
				'left': this.$fakeSelect.position().left
			});
			
			// Change the tabindex attributes so that is the fake list is at the
			// same index of the real select
			this.$fakeSelect.attr('tabindex', this.$select.attr('tabindex'));
			this.$select.attr('tabindex', -1);
			
			this.$fakeSelectOptions.find('li').click(function() {
				self.selectItem($(this));
				self.hideOptions();
			});
      		
			// Handler to display the list of options when clicking on the list
			this.$fakeSelect.click(function(){			
				if( self.areOptionsVisibles() ) {
					self.hideOptions();
				} else {
					self.showOptions();
				}
				return false;
			});
			
			this.$fakeSelect.keydown(function(e){
				if( e.keyCode == 13 ) { // Enter
					
					if( self.areOptionsVisibles() ) {
						self.selectHighlightedItem();
						self.hideOptions();
					} else {
						self.showOptions();
					}
					
				}
			});
			
			// Handler to update the fake select when the real is updated
			this.$select.change(function() {
				var val = $(this).val();
				var label = $(this).children(':selected').html();
				self.$fakeSelect.children('span').html(label);
			
				self.$fakeSelectOptions.find('.selected').removeClass('selected');
				self.$fakeSelectOptions.find('[rel="'+val+'"]').addClass('selected');
			});
    },
    /**
     * Create the Fake options
     */
    makeFakeOptions: function() {
    	var self = this;
    	
		// Empty the list of options
    	this.$fakeSelectOptions.html('');
    	
    	// Ensure the options list is at least as wide that the select
		this.$fakeSelectOptions.css('min-width', this.$fakeSelect.width());
		
		// Copy each options of the real select
		this.$select.find('option').each(function(){
			var $option = $(this);
			var $li = $('<li />')
				.attr('rel', $option.attr('value'))
				.html($option.html());
			
			self.$fakeSelectOptions.append($li);
		});
    },
    /**
     * Get if options <ul> is shown
     * @return true if options are show, false otherwise
     */
    areOptionsVisibles: function() {
    	return this.$fakeSelectOptions.css('display') != 'none';
    },
    /**
     * Hide the options
     */
    hideOptions: function() {
    	var self = this;
    	
    	// Unbind the 'keydown.niceselect' event bound in showOptions
      	$(window).unbind('keydown.niceselect');
      	
      	// Hide the options
      	this.$fakeSelectOptions.hide();
      	
      	var letters = "";
      	var lastTimeStamp = 0;
      	$(window).bind('keydown.niceselect', function(e) {
      	
      		// If key pressed is one of a,b,c,d,e,f,..., y,z
			if( e.keyCode >= 65 && e.keyCode <= 90 ) {
			
				// Get the typed letter
      			var letter = String.fromCharCode(e.keyCode);
      			
      			if( e.timeStamp - lastTimeStamp > 500 ) {
      				letters = "";
      			}
      			
      			letters += ""+letter.toLowerCase();
				
      			var $item = null;
      			
      			self.$fakeSelectOptions.find("li").each(function() {
      				if( $(this).text().substr(0, letters.length) == letters ) {
      					$item = $(this);
      					return false;
      				}
      			});
      			
      			lastTimeStamp = e.timeStamp;
      		}
      	});
    },
    /**
     * Shows the options
     */
    showOptions: function() {
    	var self = this;

		// Get the option selected in the real select    	
    	var $selected_option = self.$select.find(':selected');

		// Show the options
      	this.$fakeSelectOptions.show();
      	
      	// Highlight the selected options
      	// Note : This must be called after showing the options or the
      	// Scrolling to the hilighted item will not word properly
      	self.highlightItem($selected_option.val());
      	
      	// When the mouse is over an item, highlight it !
      	this.$fakeSelectOptions.find('li').mouseenter(function() {
      		self.highlightItem($(this), false);
      	});
      	
      	$(window).unbind('keydown.niceselect');
      	
      	var letters = "";
      	var lastTimeStamp = 0;
      	
      	// Close the list of options when escape is down
	    $(window).bind('keydown.niceselect', function(e){
	      if( e.keyCode == 27 ) { // ESC
	      	//e.preventDefault();
	      	//e.stopImmediatePropagation();
	      	e.stopPropagation();
	        $('#'+self.$fakeSelect.attr('id')+'_options').hide();
	        return false;
	      }
	      
			
	      if( e.keyCode == 40 ) { // Bottom
	      	self.highlightNextItem();
	      	return false;
	      	
	      } else if( e.keyCode == 38 ) { // TOP
	      	self.highlightPreviousItem();
	      	return false;
	      	
	      }
          
          if( e.keyCode >= 65 && e.keyCode <= 90 ) {
      			var letter = String.fromCharCode(e.keyCode);
      			
      			if( e.timeStamp - lastTimeStamp > 800 ) {
      				letters = "";
      			}
      			
      			letters += ""+letter.toLowerCase();
      			
      			var $item = null;
      			
      			self.$fakeSelectOptions.find("li").each(function() {
      				if( $(this).text().substr(0, letters.length) == letters ) {
      					$item = $(this);
      					return false;
      				}
      			});
      			
      			if( $item != null ) {
      				self.highlightItem($item, false);
      				self.scrollToTop($item);
      			}
      			
      			lastTimeStamp = e.timeStamp;
      		}
	      
	    });
    },
    /**
     * Highlights the given item
     * @param valOrItem : can be a string (the value) or the item
     * @param scrollToItem : if scroll must be automatically done avec highlighting
     */
    highlightItem: function(valOrItem, scrollToItem) {
    	
    	// Get the item
    	var $item = null;
    	if( typeof(valOrItem) == 'string' ) {
    		$item = this.$fakeSelectOptions.find('[rel="'+valOrItem+'"]');
    	} else {
    		$item = valOrItem;
    	}
    	
    	// Checks that the item exists and has been found
    	if( $item == null || $item.length == 0 ) {
    		return false;
    	}
    	
    	// Remove the hightlight on the previous highlighted item
    	this.$fakeSelectOptions.find('.'+this.options.highlightClass).removeClass(this.options.highlightClass);
    	
    	// Highlight the new item
    	$item.addClass(this.options.highlightClass);
    	
    	if( typeof(scrollToItem) == 'undefined' ) {
    		scrollToItem = true;
    	}
    	
    	// Scroll to item if needed
    	if( scrollToItem ) {
    		this.scrollToMiddle($item);
    	}
    	
    	return true;
    },
    /**
     * Gets The Highlighted item
     * @return the <li> corresponding to the highlighted item
     */
    getHighlightedItem: function() {
    	return this.$fakeSelectOptions.find('.'+this.options.highlightClass);
    },
    /**
     * Gets The next item after the highlighted item
     * @return the next item or null
     */
    getNextItem: function() {
    	var $current = this.getHighlightedItem();
    	
    	var $next = $current.next('li');
    	return ($next.length > 0) ? $next : null;
    },
    /**
     * Gets The previous item after the highlighted item
     * @return the next item or null
     */
    getPrevItem: function() {
    	var $current = this.getHighlightedItem();
    	var $prev = $current.prev('li');
    	
    	return ($prev.length > 0 ) ? $prev : null;
    },
    /**
     * Highlights the Next Item and scroll to it
     */
    highlightNextItem: function() {
    	var $next = this.getNextItem();
    	
    	if( $next ) {
    		this.highlightItem($next, false);
    		this.scrollToBottom($next);
   		}
    },
    /**
     * Highlights the previous Item and scroll to it
     */
    highlightPreviousItem: function() {
    	var $prev = this.getPrevItem();
    	
    	if( $prev ) {
    		this.highlightItem($prev, false);
    		this.scrollToTop($prev);
   		}
    },
    /**
     * Scrolls the list to the given item so that the item item is visible at the bottom of the list
     * @param $item : the item to which to scroll
     */
    scrollToBottom: function($item) {
    	if( !this.isItemVisible($item) ) {
   			var scrollTop = this.$fakeSelectOptions.scrollTop() + $item.position().top  - this.$fakeSelectOptions.height() + $item.height();
   			this.$fakeSelectOptions.scrollTop(scrollTop);
   		}
    },
    /**
     * Scrolls the list to the given item so that the item item is visible at the top of the list
     * @param $item : the item to which to scroll
     */
    scrollToTop: function($item) {
    	if( !this.isItemVisible($item) ) {
    		var scrollTop = this.$fakeSelectOptions.scrollTop() + $item.position().top;
   			this.$fakeSelectOptions.scrollTop(scrollTop);
    	}
    },
    /**
     * Scrolls the list to the given item so that the item item is visible in the middle of the list
     * @param $item : the item to which to scroll
     */
    scrollToMiddle: function($item) {
    	if( !this.isItemVisible($item) ) {
    		var scrollTop = this.$fakeSelectOptions.scrollTop() + $item.position().top  - 0.5 * this.$fakeSelectOptions.height() + $item.height();
   			this.$fakeSelectOptions.scrollTop(scrollTop);
    	}
    },
    /**
     * Gets if the given item is visible in the list
     * @param $item : the item to test
     */
    isItemVisible: function($item) {
    	var container = {
  			scrollTop: parseInt(this.$fakeSelectOptions.scrollTop()),
  			height: parseInt(this.$fakeSelectOptions.height())
  		};
  		
  		var item = {
  			top: parseInt($item.position().top),
  			height: parseInt($item.height())
  		};
  		
  		return (item.top < container.height && item.top >= 0)
  		
  		/*if( item.top >= container.height ) {
  			return false;
  		}
  		if( item.top < 0 ) {
  			return false;
  		}
  		return true;*/
    },
    /**
     * Gets the selected item of the real select
     * @return the selected <option>
     */
    getSelectedItem: function() {
    	return this.$select.children(':selected');
    },
    /**
     * Alias of getSelectedItem() : deprecated
     */
    selectedItem: function() {
      return this.getSelectedItem()
    },
    /**
     * Selects the given item
     * @param $item : the item
     */
    selectItem: function($item) {
    	this.$select.val($item.attr('rel'));
        this.$select.trigger('change');
    },
    /**
     * Selects the item highlighted in the fake list
     */
    selectHighlightedItem: function() {
    	this.selectItem(this.getHighlightedItem());
    },
    /**
     * Gets the selected item value
     * @return the value
     */
    val: function() {
      return this.getSelectedItem().val();
    },
    /**
     * Gets the label of the selected item
     * @return the label 
     */
    label: function() {
      return this.getSelectedItem().html();
    }
  };
  
  
  $.fn.niceselect.defaults = {
    labelClass: 'niceselect_label',
    optionsClass: 'niceselect_options',
    highlightClass: 'highlight'
  };

})(jQuery);