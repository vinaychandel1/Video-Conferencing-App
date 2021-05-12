// (function() {

//   var actionBar = document.querySelector('.con');
//   var actionBar1 = document.querySelector('.header-div');
//   var actionBar2 = document.querySelector('.header-divHide');


//   function showDiv() {
//    actionBar1.classList.add('header-div')
//   }

//   // function hideDiv() {
//   //  actionBar2.classList.add('header-divHide')
//   // }

//   actionBar.onmouseover = showDiv;
//   // actionBar.onmouseleave = hideDiv;

// })();



$(document).ready(function(){
  $(".hide").click(function(){
    $(".penCanvas").hide();
  });
  $(".show").click(function(){
    $(".penCanvas").show();
  });
});


$(".but").click (function(){
  // Close all open windows
  $(".content").stop().slideUp(300); 
  // Toggle this window open/close
  $(this).next(".content").stop().slideToggle(300);
  //hitter test// 
  $(".hitter").show()
});

$(".hitter").click (function(){
  // Close all open windows
  $(".content").stop().slideUp(300); 
});


 



