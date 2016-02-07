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
		this.activeClass = 'click-x-active';
		this.isMobile = getDeviceType();
		window.clickX = {};

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
			   	}; //https://github.com/kaimallea/isMobile/blob/master/isMobile.js, 20160207
			
		   	angular.forEach(mobileList, function(regex, type) {
		   		if (isMobile) return false;
		   		else isMobile = regex.test(navigator.userAgent);
		   	});

		   	return isMobile;
		}

		this.setActiveClass = function(className) {
			this.activeClass = className;
		}

		this.$get = function() {
			return this;
		}
	})

	.directive('clickX', ['$parse', '$window', 'clickXConfig', function($parse, $window, cx) {
		return {
			restrict: 'A',
			
			link: function(scope, el, attrs) {
				var element = el[0],
					action = $parse(attrs.clickX),
					activeClass = cx.activeClass;

				if (cx.isMobile) {
					element.addEventListener('touchstart', actionPrepare);
					element.addEventListener('touchend', actionLaunch);
					element.addEventListener('touchcancel', actionCancel);
				}
				else {
					element.addEventListener('mousedown', function(e) {
						$window.clickX.startTarget = document.elementFromPoint(e.clientX, e.clientY);
						actionPrepare(e);
					});
					element.addEventListener('mouseup', actionLaunch);
					$window.addEventListener('mouseup', function(e){
						if ($window.clickX.hasOwnProperty('startTarget')) {
							if ( ! isSameTarget(e, true)) {
								for (var prop in $window.clickX) {
									delete $window.clickX[prop];
								}
							}
						}
					});
					element.addEventListener('mouseenter', actionPrepare);
					element.addEventListener('mouseleave', function(e){
						if($window.clickX.hasOwnProperty('startTarget')) {
							actionCancel(e);
						}
					});
				}
				element.addEventListener('click', function(e) {
					return false;
				});

				//fn: actionPrepare
				//desc: on mouse button / finger press.
				function actionPrepare(e) {
					if (attrs.disabled === true || angular.isDefined(attrs.disabled)) {
						e.preventDefault();
					}

					if (cx.isMobile) {
						element.classList.add(activeClass);
					}
					else if ($window.clickX.hasOwnProperty('startTarget')) {
						if (isSameTarget(e, true)) {
							element.classList.add(activeClass);
						}
					}
				}

				//fn: actionLaunch
				//desc: on mouse button / finger release.
				function actionLaunch(e) {
					element.classList.remove(activeClass);
					
					if ((attrs.disabled === false || ! angular.isDefined(attrs.disabled)) && isSameTarget(e)) {
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

				//fn: isSameTarget
				//desc: before launch, check if the action is released upon same target or its child nodes.
				function isSameTarget(e, justCheck) {
					var startTarget, endClientX, endClientY, endTarget,
						isSameTarget = false;

					if (cx.isMobile) {
						endClientX = e.changedTouches[0].clientX;
						endClientY = e.changedTouches[0].clientY;
						startTarget = element;
					}
					else if ($window.hasOwnProperty('clickX')) {
						endClientX = e.clientX;
						endClientY = e.clientY;
						startTarget = $window.clickX.startTarget;

						if ( ! justCheck) {
							for (var prop in $window.clickX) {
								delete $window.clickX[prop];
							}
						}
					}
					else {
						return isSameTarget;
					}

					endTarget = document.elementFromPoint(endClientX, endClientY);
					isSameTarget = startTarget.contains(endTarget) || startTarget.isEqualNode(endTarget);

					return isSameTarget;
				}

			}
		}
	}]);
