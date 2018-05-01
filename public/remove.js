var elem = document.querySelector('#jk--chrome--extension');
document.querySelector('#jk--chrome--extension').parentNode.removeChild(elem);

var elem = document.querySelector('#jk--chrome--extension--target');
elem.parentNode.removeChild(elem);

var elem = document.querySelector('.jk--chrome--extension--wrapper');
elem.classList.remove('jk--chrome--extension--wrapper');

document.body.id = "";
