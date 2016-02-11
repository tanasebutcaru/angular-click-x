'use strict';

/*
 * angular-click-x v1.0.0
 * (c) 2016 Tanase Butcaru, http://www.butcaru.com
 * License: MIT
 * 
 * GitHub: https://github.com/TanaseButcaru/angular-click-x
 */

if (typeof module !== 'undefined' && typeof exports !== 'undefined' && module.exports === exports) {
	module.exports = 'tb.clickX';
}

angular.module('tb.clickX', [])
	
	.provider('clickXConfig', function() {
		window.clickX = {};
		this.isMobile = getDeviceType();
		this.activeClass = 'click-x-active';
		this.swipeConfig = {
			//required min distance traveled to be considered swipe (px)
			threshold: 50,
			//max distance allowed at the same time in perpendicular direction (px)
			restraint: 50,
			//max time allowed to travel that distance (ms)
			allowedTime: 400
		};
		
		this.setActiveClass = function(className) {
			if (angular.isString(className)) {
				this.activeClass = className;
			}
		}

		this.setSwipeConfig = function(swipeOptions) {
			if (angular.isObject(swipeOptions)) {
				angular.forEach(swipeOptions, function(optionValue, optionName) {
					if (this.swipeConfig.hasOwnProperty(optionName) && angular.isNumber(optionValue)) {
						this.swipeConfig[optionName] = optionValue;
					}
				}, this);
			}
		}

		this.$get = function() {
			return this;
		}

		//helperFn: getDeviceType
		//source: https://github.com/kaimallea/isMobile/blob/master/isMobile.js
		function getDeviceType() {
			var isMobile = false,
				mobileList = {
					apple_phone: /iPhone/i,
					apple_ipod: /iPod/i,
					apple_tablet: /iPad/i,
					android_phone: /(?=.*\bAndroid\b)(?=.*\bMobile\b)/i, // Match 'Android' AND 'Mobile'
					android_tablet: /Android/i,
					amazon_phone: /(?=.*\bAndroid\b)(?=.*\bSD4930UR\b)/i,
					amazon_tablet: /(?=.*\bAndroid\b)(?=.*\b(?:KFOT|KFTT|KFJWI|KFJWA|KFSOWI|KFTHWI|KFTHWA|KFAPWI|KFAPWA|KFARWI|KFASWI|KFSAWI|KFSAWA)\b)/i,
					windows_phone: /IEMobile/i,
					windows_tablet: /(?=.*\bWindows\b)(?=.*\bARM\b)/i, // Match 'Windows' AND 'ARM'
					other_blackberry: /BlackBerry/i,
					other_blackberry_10: /BB10/i,
					other_opera: /Opera Mini/i,
					other_chrome: /(CriOS|Chrome)(?=.*\bMobile\b)/i,
					other_firefox: /(?=.*\bFirefox\b)(?=.*\bMobile\b)/i, // Match 'Firefox' AND 'Mobile'
				};
			
				angular.forEach(mobileList, function(regex, type) {
					if (isMobile) return false;
					else isMobile = regex.test(navigator.userAgent);
				});

		   	return isMobile;
		}
	})

	.directive('clickX', ['$parse', '$window', 'clickXConfig', function($parse, $window, cx) {
		return {
			priority: 0,
			restrict: 'A',
			
			link: function(scope, el, attrs) {
				var element = el[0],
					action = $parse(attrs.clickX);

				if (cx.isMobile) {
					element.addEventListener('touchstart', actionPrepare);
					element.addEventListener('touchend', actionLaunch);
					element.addEventListener('touchcancel', actionCancel);
				}
				else {
					element.addEventListener('mousedown', actionPrepare);
					element.addEventListener('mouseup', actionLaunch);
					$window.addEventListener('mouseup', bindWindowMouseUp);
					element.addEventListener('mouseenter', bindElementMouseEnter);
					element.addEventListener('mouseleave', bindElementMouseLeave);
				}
				
				element.addEventListener('click', bindElementClick);

				//fn: actionPrepare
				//desc: on target press
				function actionPrepare(e) {
					//`touchstart`
					if (cx.isMobile) {
						setTarget(e);
					}
					//`mousedown`
					else if ( ! $window.clickX.hasOwnProperty('startTarget')) {
						setTarget(e);
					}
					//`mouseenter` after a `mouseleave`
					else if ( ! isSameTarget(e)) {
						return false;
					}

					if ( ! isDisabled()) {
						element.classList.add(cx.activeClass);
					}
					else {
						resetClickXData();
					}
				}

				//fn: actionLaunch
				//desc: on target release
				function actionLaunch(e) {
					//set final target & remove active class
					setTarget(e, 'end');
					element.classList.remove(cx.activeClass);

					//check things before action launch
					if ( ! isSwipe().active && ! isDisabled() && isSameTarget()) {
						//finally, launch desired action :)
						scope.$apply(function() {
							action(scope, {$event: e});
						});
					}

					//reset clickX data
					resetClickXData();
				}

				//fn: actionCancel
				//desc: on target cancel
				function actionCancel(e) {
					element.classList.remove(cx.activeClass);
				}

				//helperFn: bindWindowMouseUp
				function bindWindowMouseUp(e) {
					if ($window.clickX.hasOwnProperty('startTarget')) {
						if ( ! isSameTarget(e)) {
							resetClickXData();
						}
					}
				}

				//helperFn: bindElementMouseEnter
				function bindElementMouseEnter(e) {
					if ($window.clickX.hasOwnProperty('startTarget')) {
						actionPrepare(e);
					}
				}

				//helperFn: bindElementMouseLeave
				function bindElementMouseLeave(e) {
					if ($window.clickX.hasOwnProperty('startTarget')) {
						actionCancel(e);
					}
				}

				//helperFn: bindElementClick
				function bindElementClick(e) {
					e.preventDefault();
					e.stopPropagation();
				}

				//helperFn: setTarget
				//desc: get element & calculate its position
				function setTarget(e, type) {
					var clientX, clientY, pageX, pageY,
						target, position, swipe;

					//get coords
					if (cx.isMobile) {
						clientX = e.changedTouches[0].clientX;
						clientY = e.changedTouches[0].clientY;
						pageX = e.changedTouches[0].pageX;
						pageY = e.changedTouches[0].pageY;
					}
					else {
						clientX = e.clientX;
						clientY = e.clientY;
						pageX = e.pageX;
						pageY = e.pageY;
					}

					//set target data keys
					if (type == 'end') {
						target = 'endTarget';
						position = 'endPosition';
						swipe = 'endSwipe';
					}
					else {
						target = 'startTarget';
						position = 'startPosition';
						swipe = 'startSwipe';
					}

					//get & register target data to clickX
					$window.clickX[target] = getClickXTarget(clientX, clientY);
					//do we have a target?
					if ($window.clickX[target] === false) {
						resetClickXData();
					}
					//good, set the rest now!
					else {
						$window.clickX[position] = getTargetPosition($window.clickX[target]);
						$window.clickX[swipe] = { x: pageX, y: pageY, time: new Date().getTime() };
					}
				}

				//helperFn: getClickXTarget
				//desc: determine the (parent) node with click-x attr
				function getClickXTarget(x, y) {
					var target = false;
					var targetFromCoords = document.elementFromPoint(x, y);

					//do we have a valid target?
					if (targetFromCoords === null || ! angular.isFunction(targetFromCoords.hasAttribute)) {
						target = false;
					}
					//good, check if this is the element itself
					else if (targetFromCoords.hasAttribute('click-x') === true) {
						target = targetFromCoords;
					}
					//nope. go up thru all parent nodes until we find it
					else {
						target = targetFromCoords.parentNode;
						while (target !== null && angular.isFunction(target.hasAttribute) && target.hasAttribute('click-x') === false) {
							target = target.parentNode;
						}

						//check if we reached the #document
						if (target === null || ! angular.isFunction(target.hasAttribute)) {
							target = false;
						}
					}

					return target;
				}

				//helperFn: getTargetPosition
				//desc: get target position
				function getTargetPosition(elem) {
					return {
						top: elem.getBoundingClientRect().top,
						left: elem.getBoundingClientRect().left,
						right: elem.getBoundingClientRect().right
					};
				}

				//helperFn: isSameTarget
				//desc: check if two targets (start & end) are the same
				function isSameTarget(customEvent) {
					var startTarget, endTarget, startPosition, endPosition,
						isSameTarget = false;

					//get custom end target & its position
					if (angular.isDefined(customEvent)) {
						if (cx.isMobile) {
							var endClientX = customEvent.changedTouches[0].clientX;
							var endClientY = customEvent.changedTouches[0].clientY;
						}
						else {
							var endClientX = customEvent.clientX;
							var endClientY = customEvent.clientY;
						}

						//get custom end target
						endTarget = getClickXTarget(endClientX, endClientY);
						//do we have a final target?
						if (endTarget === false) {
							return false;
						}
						//good, get position now!
						else {
							endPosition = getTargetPosition(endTarget);
						}
					}
					else if ($window.clickX.hasOwnProperty('endTarget')) {
						endTarget = $window.clickX.endTarget;
						endPosition = $window.clickX.endPosition;
					}
					else {
						return false;
					}

					//set start target directly from clickX, if defined
					if ($window.clickX.hasOwnProperty('startTarget')) {
						startTarget = $window.clickX.startTarget;
						startPosition = $window.clickX.startPosition;
					}
					else {
						return false;
					}

					//get targets equality
					isSameTarget = startTarget.isEqualNode(endTarget);

					//check if target position remained the same
					//if diff, then a scroll happend
					if (isSameTarget && ! angular.equals(startPosition, endPosition)) {
						isSameTarget = false;
					}

					return isSameTarget;
				}

				//helperFn: isSwipe
				//source: http://www.javascriptkit.com/javatutors/touchevents2.shtml
				function isSwipe() {
					var distX, distY, elapsedTime,
						isSwipe = { active: false, dir: 'none'};

					//check if we have targets
					if ( ! $window.clickX.hasOwnProperty('endTarget') ||  ! $window.clickX.hasOwnProperty('startTarget')) {
						return isSwipe;
					}

					//get horizontal & vertical dist traveled by finger while in contact with surface
					distX = $window.clickX.endSwipe.x - $window.clickX.startSwipe.x; 
					distY = $window.clickX.endSwipe.y - $window.clickX.startSwipe.y;
					elapsedTime = $window.clickX.endSwipe.time - $window.clickX.startSwipe.time;

					//check...
					if (elapsedTime <= cx.swipeConfig.allowedTime) {
						//... horizontal swipe condition
						if (Math.abs(distX) >= cx.swipeConfig.threshold && Math.abs(distY) <= cx.swipeConfig.restraint) {
							//if dist traveled is negative, it indicates left swipe
							isSwipe.dir = (distX < 0) ? 'left' : 'right';
							isSwipe.active = true;
						}
						//..vertical swipe condition
						else if (Math.abs(distY) >= cx.swipeConfig.threshold && Math.abs(distX) <= cx.swipeConfig.restraint) {
							//if dist traveled is negative, it indicates up swipe
							isSwipe.dir = (distY < 0)? 'up' : 'down';
							isSwipe.active = true;
						}
					}

					return isSwipe;
				}

				//helperFn: isDisabled
				function isDisabled() {
					var isDisabled = false;

					//if this is called before launch,
					//check if the final target is disabled
					if ($window.clickX.hasOwnProperty('endTarget')) {
						isDisabled = $window.clickX.endTarget.getAttribute('disabled');
					}
					else if ($window.clickX.hasOwnProperty('startTarget')) {
						isDisabled = $window.clickX.startTarget.getAttribute('disabled');
					}
					else {
						isDisabled = false;
					}

					return isDisabled;
				}

				//helperFn: resetClickXData
				function resetClickXData() {
					for (var prop in $window.clickX) {
						delete $window.clickX[prop];
					}
				}

				//clean up!
				scope.$on('$destroy', function() {
					if (cx.isMobile) {
						element.removeEventListener('touchstart', actionPrepare);
						element.removeEventListener('touchend', actionLaunch);
						element.removeEventListener('touchcancel', actionCancel);
					}
					else {
						element.removeEventListener('mousedown', actionPrepare);
						element.removeEventListener('mouseup', actionLaunch);
						$window.removeEventListener('mouseup', bindWindowMouseUp);
						element.removeEventListener('mouseenter', bindElementMouseEnter);
						element.removeEventListener('mouseleave', bindElementMouseLeave);
					}

					element.removeEventListener('click', bindElementClick);
					resetClickXData();
				});
			}
		}
	}]);
