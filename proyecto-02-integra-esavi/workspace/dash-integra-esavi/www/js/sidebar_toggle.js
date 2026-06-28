$(document).ready(function() {
  $('.sidebar-toggle').on('click', function() {
    $('#dynamic-header').html(`
      <a href="https://www.salud.gob.ec/" target="_blank" class="navbar-brand">
        <h5 style="display: inline;">  
        <img src="images/logoMSP.png" style="width:28%; margin-right: 3px;"/>  <!-- Margen para separación -->
        Pan American<br>Health<br>Organization</h5>
      </a>
    `);
  });
});