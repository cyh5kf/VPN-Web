import './index.less';
import './index.html';


var navbar_toggle = $("header .navbar-toggle");
var navbar_collapse = $("header .navbar-collapse");

navbar_toggle.click(function () {
    navbar_collapse.toggle('fast');
});
