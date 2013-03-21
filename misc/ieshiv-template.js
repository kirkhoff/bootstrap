// READ: http://docs-next.angularjs.org/guide/ie
// element tags are statically defined in order to accommodate lazy-loading whereby directives are also unknown

// The ieshiv takes care of our ui.directives and AngularJS's ng-view, ng-include, ng-pluralize, ng-switch.
// However, IF you have custom directives that can be used as html tags (yours or someone else's) then
// add list of directives into <code>window.myCustomTags</code>

// <!--[if lte IE 8]>
//    <script>
//    window.myCustomTags = [ 'yourCustomDirective', 'somebodyElsesDirective' ]; // optional
//    </script>
//    <script src="build/angular-ui-ieshiv.js"></script>
// <![endif]-->
//
// Version: <%= version %>
//

(function (exports) {

  var debug = window.ieShivDebug || false,
      tags = ["ngInclude", "ngPluralize", "ngView", "ngSwitch", <%= directives %>];

  window.myCustomTags =  window.myCustomTags || []; // externally defined by developer using angular-ui directives
  tags.push.apply(tags, window.myCustomTags);

  var toCustomElements = function (str) {
    var result = [];
    var dashed = str.replace(/([A-Z])/g, function ($1) {
      return " " + $1.toLowerCase();
    });
    var tokens = dashed.split(' ');
    var dirname = tokens.join('-');
    
    result.push(dirname);
    result.push("x-" + dirname);
    result.push("data-" + dirname);
    return result;
    
/* for now, ui-bootstrap doesn't have a prefix...
 *
    var ns = tokens[0];
    var dirname = tokens.slice(1).join('-');

    // this is finite list and it seemed senseless to create a custom method
    result.push(ns + ":" + dirname);
    result.push(ns + "-" + dirname);
    result.push("x-" + ns + "-" + dirname);
    result.push("data-" + ns + "-" + dirname);
    return result;
*/
  };

  for (var i = 0, tlen = tags.length; i < tlen; i++) {
    var customElements = toCustomElements(tags[i]);
    for (var j = 0, clen = customElements.length; j < clen; j++) {
      var customElement = customElements[j];
      document.createElement(customElement);
    }
  }
  
  /**
   * Polyfill for Array.indexOf()
   * Taken from: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf
   */
  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
        "use strict";
        if (this == null) {
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = 0;
        if (arguments.length > 1) {
            n = Number(arguments[1]);
            if (n != n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n != 0 && n != Infinity && n != -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    }
  }

})(window);