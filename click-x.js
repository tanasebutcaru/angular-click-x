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
		this.activeClass = 'click-x-active';
		this.isMobile = getDeviceType();
		this.swipeDetect = {
			threshold: 50, //required min distance traveled to be considered swipe (px)
			restraint: 50, //max distance allowed at the same time in perpendicular direction (px)
			allowedTime: 400 //max time allowed to travel that distance (ms)
		};
		
		this.setActiveClass = function(className) {
			if (angular.isString(className)) {
				this.activeClass = className;
			}
		}

		this.configSwipeDetection = function(swipeOptions) {
			if (angular.isObject(swipeOptions)) {
				angular.forEach(swipeOptions, function(optionValue, optionName) {
					if (this.swipeDetect.hasOwnProperty(optionName) && angular.isNumber(optionValue)) {
						this.swipeDetect[optionName] = optionValue;
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
					action = $parse(attrs.clickX),
					activeClass = cx.activeClass,
					swipe = cx.swipeDetect;

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
				
				element.addEventListener('click', stopClickAction);

				//fn: actionPrepare
				//desc: on mouse button / finger press.
				function actionPrepare(e) {
					if (attrs.disabled === true || angular.isDefined(attrs.disabled)) {
						e.preventDefault();
					}

					if (cx.isMobile) {
						element.classList.add(activeClass);
						setElemenetStart(e.changedTouches[0]);
					}
					else {
						if ($window.clickX.hasOwnProperty('startTarget')) {
							if (isSameTarget(e, true)) {
								element.classList.add(activeClass);
							}
						}
						else {
							element.classList.add(activeClass);
							setElemenetStart(e);
						}
					}
				}

				//fn: actionLaunch
				//desc: on mouse button / finger release.
				function actionLaunch(e) {
					element.classList.remove(activeClass);

					if (isSwipe(e)) {
						return false;
					}
					else if ( ! isSameTarget(e)) {
						return false;
					}
					else if ((attrs.disabled === false || ! angular.isDefined(attrs.disabled))) {
						scope.$apply(function() {
							action(scope, {$event: e});
						});
					}
				}

				//fn: actionCancel
				//desc: on mousel leave / touch cancel.
				function actionCancel(e) {
					element.classList.remove(activeClass);
				}

				//helperFn: isSameTarget
				//desc: before launch, check if the action is released upon same target or its child nodes.
				function isSameTarget(e, justCheck) {
					var startTarget, endClientX, endClientY, endTarget,
						isChild = false, isEqual = false, isSameTarget = false,
						startPosition,  endPosition;

					if (cx.isMobile) {
						endClientX = e.changedTouches[0].clientX;
						endClientY = e.changedTouches[0].clientY;
						startTarget = element;
					}
					else if ($window.hasOwnProperty('clickX')) {
						endClientX = e.clientX;
						endClientY = e.clientY;
						startTarget = $window.clickX.startTarget;
					}
					else {
						return isSameTarget;
					}

					endTarget = document.elementFromPoint(endClientX, endClientY);
					isChild = startTarget.contains(endTarget);
					isEqual = startTarget.isEqualNode(endTarget);
					isSameTarget = isChild || isEqual;

					//check if target position remains the same
					//if diff, then a scroll happend
					if (isSameTarget) {
						startPosition = $window.clickX.startPosition;
						endPosition = getElementPosition($window.clickX.startTarget);

						if ( ! angular.equals(startPosition, endPosition)) {
							isSameTarget = false;
						}
					}

					if ( ! justCheck) {
						clickXWindowClean();
					}

					return isSameTarget;
				}

				//helperFn: isSwipe
				//source: http://www.javascriptkit.com/javatutors/touchevents2.shtml
				function isSwipe(e) {
					var pageX, pageY, distX, distY,
						elapsedTime, swipedir = 'none', isSwipe = false;

					if (cx.isMobile) {
						pageX = e.changedTouches[0].pageX;
						pageY = e.changedTouches[0].pageY;
					}
					else {
						pageX = e.pageX;
						pageY = e.pageY;
					}

					//get horizontal & vertical dist traveled by finger while in contact with surface
					distX = pageX - $window.clickX.swipePosition.startX; 
					distY = pageY - $window.clickX.swipePosition.startY;
					elapsedTime = new Date().getTime() - $window.clickX.swipePosition.startTime;

					//check...
					if (elapsedTime <= swipe.allowedTime) {
						//... horizontal swipe condition
						if (Math.abs(distX) >= swipe.threshold && Math.abs(distY) <= swipe.restraint){
							//if dist traveled is negative, it indicates left swipe
							//swipedir = (distX < 0) ? 'left' : 'right';
							isSwipe = true;
						}
						//..vertical swipe condition
						else if (Math.abs(distY) >= swipe.threshold && Math.abs(distX) <= swipe.restraint){
							//if dist traveled is negative, it indicates up swipe
							//swipedir = (distY < 0)? 'up' : 'down';
							isSwipe = true;
						}
					}

					return isSwipe;
				}

				//helperFn: bindWindowMouseUp
				function bindWindowMouseUp(e){
					if ($window.clickX.hasOwnProperty('startTarget')) {
						if ( ! isSameTarget(e, true)) {
							clickXWindowClean();
						}
					}
				}

				//helperFn: bindElementMouseEnter
				function bindElementMouseEnter(e){
					if ($window.clickX.hasOwnProperty('startTarget')) {
						actionPrepare(e);
					}
				}

				//helperFn: bindElementMouseLeave
				function bindElementMouseLeave(e){
					if($window.clickX.hasOwnProperty('startTarget')) {
						actionCancel(e);
					}
				}

				//helperFn: stopClickAction
				function stopClickAction(e) {
					e.preventDefault();
				}

				//helperFn: clickXClean
				function clickXWindowClean() {
					for (var prop in $window.clickX) {
						delete $window.clickX[prop];
					}
				}

				//helperFn: getElementPosition
				function getElementPosition(elem) {
					return {
						top: elem.getBoundingClientRect().top,
						left: elem.getBoundingClientRect().left,
						right: elem.getBoundingClientRect().right
					};
				}

				//helperFn: setElemenetStart
				//desc: get element & calculate/get its position
				function setElemenetStart(position){
					$window.clickX.startTarget = document.elementFromPoint(position.clientX, position.clientY);
					$window.clickX.startPosition = getElementPosition($window.clickX.startTarget);
					$window.clickX.swipePosition = {
						startX: position.pageX,
						startY: position.pageY,
						startTime: new Date().getTime()
					};
				}

				//helperFn: getClickXParent
				//desc: determine the parent node with click-x attr
				function getClickXParent(childEl) {
					var parentEl = childEl.parentNode;

					while (parentEl.hasAttribute('click-x') === false) {
						parentEl = parentEl.parentNode;
					}

					return parentEl;
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

					element.removeEventListener('click', stopClickAction);
					clickXWindowClean();
				});
			}
		}
	}]);
