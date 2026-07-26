// keycloak-js 26 es ESM y ya no se sirve desde el servidor Keycloak
// (http://<kc>/js/keycloak.js devuelve 404 desde la v25), así que el adapter
// va versionado en www/js/keycloak.js y se importa como módulo.
import Keycloak from "./keycloak.js";

(function () {
  var cfg = window.KEYCLOAK_CONFIG;
  if (!cfg || !cfg.url) return; // Sin config → sin auth (desarrollo local)

  var kc = new Keycloak({ url: cfg.url, realm: cfg.realm, clientId: cfg.clientId });

  kc.init({ onLoad: "login-required", pkceMethod: "S256", checkLoginIframe: false })
    .then(function (authenticated) {

      if (!authenticated) { kc.login(); return; }

      // Verificar rol requerido. requiredRole admite varios separados por coma
      // (KC_REQUIRED_ROLE="analitic,arcsa,dhis,paho"): basta con tener uno.
      var required = (cfg.requiredRole || "").split(",")
        .map(function (r) { return r.trim(); })
        .filter(function (r) { return r.length > 0; });

      var permitido = required.length === 0 || required.some(function (r) {
        return kc.hasRealmRole(r);
      });

      if (!permitido) {
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
          "<p>Tu cuenta no tiene ninguno de los roles necesarios (<strong>" +
            required.join(", ") + "</strong>) para acceder a esta aplicación.</p>" +
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

      // Exponer logout global para el botón del sidebar.
      //
      // El dashboard es alcanzable por dos caminos y cada uno deja su propia
      // sesión, así que hay que cerrar la que corresponda:
      //
      //   https://localhost/  → nginx → oauth2-proxy → dashboard
      //        oauth2-proxy guarda la cookie _esavi_session (168 h). Cerrar
      //        sesión solo en Keycloak la dejaría viva y se seguiría entrando.
      //        Se pasa por /oauth2/sign_out y desde ahí (rd=) al end-session.
      //
      //   http://localhost:3838 → directo al Shiny, sin proxy
      //        Solo existe la sesión de Keycloak: basta kc.logout().
      //
      // Cuál aplica se detecta preguntando por /oauth2/auth: oauth2-proxy
      // responde (202/401/403) y Shiny devuelve 404.
      window.keycloakLogout = function () {
        var origin = window.location.origin;

        // id_token_hint es imprescindible: sin él, Keycloak 26 no cierra la
        // sesión, muestra una pantalla de confirmación (así lo define OIDC
        // RP-Initiated Logout) y la sesión SSO sobrevive. kc.logout() lo añade
        // solo; aquí, que se construye a mano, hay que ponerlo.
        var kcLogout = cfg.url + "/realms/" + cfg.realm +
          "/protocol/openid-connect/logout" +
          "?post_logout_redirect_uri=" + encodeURIComponent(origin) +
          (kc.idToken
            ? "&id_token_hint=" + encodeURIComponent(kc.idToken)
            : "&client_id=" + encodeURIComponent(cfg.clientId));

        fetch("/oauth2/auth", { method: "GET", credentials: "include" })
          .then(function (r) {
            if (r.status === 404) {
              kc.logout({ redirectUri: origin });          // acceso directo
            } else {
              window.location.href =                        // detrás del proxy
                "/oauth2/sign_out?rd=" + encodeURIComponent(kcLogout);
            }
          })
          .catch(function () {
            kc.logout({ redirectUri: origin });             // sin red: al menos Keycloak
          });
      };

    })
    .catch(function () {
      console.error("[ESAVI] Error al inicializar Keycloak");
    });
})();
