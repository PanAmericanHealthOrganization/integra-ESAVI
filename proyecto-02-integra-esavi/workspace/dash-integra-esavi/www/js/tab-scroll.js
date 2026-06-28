// Solución 1: Detectar clics en los elementos del menú principal (no los tabBox internos)
$(document).on('click', '.sidebar-menu a', function() {
  // Pequeño retraso para asegurar que el cambio de pestaña se complete
  setTimeout(function() {
    window.scrollTo(0, 0);
  }, 100);
});

// Solución 2: Observar cambios en las pestañas activas, excluyendo TabPanels dentro de TabBoxes
$(document).ready(function() {
  // También observar cualquier cambio en la clase 'active' de los tab-panes
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'class' && 
          mutation.target.classList.contains('active') &&
          mutation.target.classList.contains('tab-pane')) {
        
        // Verificar si el tab-pane es parte de un tabBox anidado
        // Un tabBox anidado normalmente está dentro de otro tab-pane o tiene un ancestro con clase específica
        const isNestedTabPanel = isNestedTabPane(mutation.target);
        
        // Solo hacer scroll al inicio si NO es un tabPanel anidado
        if (!isNestedTabPanel) {
          window.scrollTo(0, 0);
        }
      }
    });
  });

  // Función para determinar si un tab-pane está anidado dentro de otro tabBox
  function isNestedTabPane(element) {
    // Podemos identificar tabPanels anidados de varias formas:
    
    // 1. Verificar si está dentro de un contenedor con clase específica de tabBox interno
    // (ajusta estas clases según la estructura de tu aplicación)
    let parent = element.parentElement;
    while (parent) {
      if (parent.classList.contains('tab-pane') && parent !== element) {
        // Si el elemento está dentro de otro tab-pane, es anidado
        return true;
      }
      // Alternativa: buscar clase específica que identifique tus tabBoxes internos
      if (parent.classList.contains('inner-tabbox') || 
          parent.classList.contains('nested-tabs') ||
          parent.hasAttribute('data-nested-tabbox')) {
        return true;
      }
      parent = parent.parentElement;
    }
    
    // 2. Verificar por profundidad de anidamiento (opcional)
    // Contar cuántos tab-panes hay en la jerarquía
    let tabPaneCount = 0;
    parent = element.parentElement;
    while (parent) {
      if (parent.classList.contains('tab-pane')) {
        tabPaneCount++;
      }
      parent = parent.parentElement;
    }
    // Si hay más de 1 tab-pane en la jerarquía, considerarlo anidado
    if (tabPaneCount > 0) {
      return true;
    }
    
    // No es un tabPanel anidado
    return false;
  }

  // Configuración del observador: qué observar y cómo
  const config = { attributes: true, childList: false, subtree: false };
  
  // Una vez que el DOM está cargado, iniciar observación de todos los tab-panes
  setTimeout(function() {
    document.querySelectorAll('.tab-pane').forEach(function(tabPane) {
      observer.observe(tabPane, config);
    });
  }, 1000); // Esperar 1 segundo para asegurar que todos los elementos están cargados
});

// Solución 3: Backup - observar cambios en la URL hash (si tu dashboard lo usa)
window.addEventListener('hashchange', function() {
  // Cuando cambia el hash, normalmente es navegación entre secciones principales
  window.scrollTo(0, 0);
});