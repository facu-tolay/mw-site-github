$(document).on('click', '.megamenu', function (e) {
  e.stopPropagation();
});
/*
$('.dropdown-item').click(function() {
    $('a.dropdown-item').removeClass('active'); // remove from all other <SPAN>s
    $(this).addClass('active'); // add onto current
});
*/

$('.megamenu-li').hover(function() {
  var elems = $(this)[0].querySelector('.megamenu-element').getElementsByClassName('active');
  if (elems.length == 0) {
    $($(this)[0].querySelector('a.dropdown-item')).addClass('active');
    $($(this)[0].querySelector('div.megamenu-item-tab')).addClass('active');
  }
});

$('.dropdown-item').hover(function() {
  $('a.dropdown-item').removeClass('active'); 
  $('div.megamenu-item-tab').removeClass('active'); 
  $(this).addClass('active');
  $(document.getElementById('item-'.concat($(this)[0].id))).addClass('active');
});

$('.megamenu-desktop').hover(function() {
  var item = document.querySelector('div.dropdown-item#'.concat($(this)[0].id));
  var elems = $(item)[0].getElementsByClassName('active');
  if (elems.length == 0) {
    var newItem = $(item)[0].querySelector('a.dropdown-item');
    $(newItem).addClass('active');
    $(document.getElementById('item-'.concat($(newItem)[0].id))).addClass('active');
  }
});



