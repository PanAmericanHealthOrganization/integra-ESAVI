(function () {
  var cfg = window.KEYCLOAK_CONFIG;
  if (!cfg || !cfg.url) return; // Sin config → sin auth (desarrollo local)

  var kc = new Keycloak({ url: cfg.url, realm: cfg.realm, clientId: cfg.clientId });

  kc.init({ onLoad: "login-required", pkceMethod: "S256", checkLoginIframe: false })
    .then(function (authenticated) {

      if (!authenticated) { kc.login(); return; }

      // Verificar rol requerido
      if (!kc.hasRealmRole(cfg.requiredRole)) {
        document.open();
        document.write(
          '<html><head><meta charset="utf-8">' +
          '<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f4f6f9}' +
          '.box{text-align:center;padding:40px;background:#fff;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.1);max-width:420px}' +
          '.icon{font-size:48px;color:#d62728;margin-bottom:16px}' +
          'h2{color:#333;margin:0 0 8px}p{color:#666;margin:0 0 24px}' +
          'button{padding:10px 24px;background:#1f77b4;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px}' +
          'button:hover{background:#155a8a}</style></head><body>' +
          '<div class="box"><div class="icon">⛔</div>' +
          "<h2>Acceso denegado</h2>" +
          "<p>Tu cuenta no tiene el rol <strong>" + cfg.requiredRole + "</strong> necesario para acceder a esta aplicación.</p>" +
          '<button onclick="window.location.href=\'' + cfg.url + '/realms/' + cfg.realm + '/protocol/openid-connect/logout?redirect_uri=' + encodeURIComponent(window.location.origin) + '\'">Cerrar sesión</button>' +
          "</div></body></html>"
        );
        document.close();
        return;
      }

      // Autenticado y con rol → notificar a Shiny cuando la sesión esté lista
      $(document).on("shiny:connected", function () {
        Shiny.setInputValue("kc_authenticated", true, { priority: "event" });
        Shiny.setInputValue("kc_user", kc.tokenParsed.preferred_username, { priority: "event" });
        Shiny.setInputValue("kc_name",  kc.tokenParsed.name || kc.tokenParsed.preferred_username, { priority: "event" });
      });

      // Renovar token cada 4 minutos (expira en 5 por defecto)
      setInterval(function () {
        kc.updateToken(70).catch(function () { kc.login(); });
      }, 4 * 60 * 1000);

      // Exponer logout global para el botón del sidebar
      window.keycloakLogout = function () {
        kc.logout({ redirectUri: window.location.origin });
      };

    })
    .catch(function () {
      console.error("[ESAVI] Error al inicializar Keycloak");
    });
})();
