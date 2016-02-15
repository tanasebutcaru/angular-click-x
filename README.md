Angular Click X
===============

**clickX** is an alternative to core ``ngClick`` directive provided by ``ngTouch`` module.  
Simple, configurable & lightweight!

##### _Why?_
> DEPRECATION NOTICE: Beginning with Angular 1.5, this directive is deprecated and by default disabled. The directive will receive no further support and might be removed from future releases. If you need the directive, you can enable it with the [$touchProvider#ngClickOverrideEnabled](https://docs.angularjs.org/api/ngTouch/provider/$touchProvider) function. We also recommend that you migrate to [FastClick](https://github.com/ftlabs/fastclick). To learn more about the 300ms delay, this [Telerik](http://developer.telerik.com/featured/300-ms-click-delay-ios-8/) article gives a good overview. 


[More info in this commit](https://github.com/angular/angular.js/commit/0dfc1dfebf26af7f951f301c4e3848ac46f05d7f).

Install
----

Include the `click-x.js` / `click-x.min.js` script provided by this component in your app.

You can also use a CDN: `https://cdn.rawgit.com/TanaseButcaru/angular-click-x/1.1.0/click-x.min.js`

Make sure to add `tb.clickX` to your app’s module dependencies.

```js
angular.module('yourApp', ['tb.clickX']);
````

Configuration
-------
Inject the ``clickXConfigProvider`` provider in your ``config`` block and configure ``clickX`` as follows:

* change default active class name (defaults to ``click-x-active``)

```js
clickXConfigProvider.setActiveClass('myNewClass');
```
* adjust swipe detection process
```js
clickXConfigProvider.setSwipeConfig({
  //required min distance traveled to be considered swipe (px)
  threshold: 50,
  //max distance allowed at the same time in perpendicular direction (px)
  restraint: 50,
  //max time allowed to travel that distance (ms)
  allowedTime: 400
});
```

Usage
---


as attribute
```html
  <button click-x="doSomethingAwesone()">
  	...
  </button>
```

Support
----

Should work fine on all devices.  
Tested on:
- mobile browsers;
- desktop browsers (Firefox, Chromium, Safari) with & without touch emulation active;
- a Cordova hybrid mobile app on Android (4.4, 5.x, Crosswalk webview) and iOS (9, Safari UIWebView);


Known issues
-------

* _none._

Demo
--

*Coming soon*
