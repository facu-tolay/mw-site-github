$(document).ready( function() {
  $("#submitbutton").click( function() {
    $.post("https://0lsny8552e.execute-api.us-east-1.amazonaws.com/dev/crm",$("#contact-form").serialize(),function(res){
      $("#contact-form").fadeOut("slow");
      if(res == null){
        $("#success").delay(500).fadeIn("slow");
      } else {
        $("#error").delay(500).fadeIn("slow");
      }
      window.location.replace('/contact/succesful/');
    });
  });
});
