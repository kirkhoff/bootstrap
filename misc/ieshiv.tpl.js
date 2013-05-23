// READ: http://docs.angularjs.org/guide/ie

// The ieshiv takes care of ui.bootstrap.* directives; it's dynamically generated
// using the current version of the framework

//  <!--[if lt IE 9]>
//      <script src="ieshiv-<%= version %>.min.js"></script>
//  <![endif]-->
//
// Version: <%= version %>
//

(function () {

  var tags = [<%= directives %>];

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
  };

  for (var i = 0, tlen = tags.length; i < tlen; i++) {
    var customElements = toCustomElements(tags[i]);
    for (var j = 0, clen = customElements.length; j < clen; j++) {
      var customElement = customElements[j];
      document.createElement(customElement);
    }
  }

})();