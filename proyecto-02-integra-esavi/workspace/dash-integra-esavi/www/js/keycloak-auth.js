// keycloak-js 26 es ESM y ya no se sirve desde el servidor Keycloak
// (http://<kc>/js/keycloak.js devuelve 404 desde la v25), así que el adapter
// va versionado en www/js/keycloak.js y se importa como módulo.
import Keycloak from "./keycloak.js";

(function () {
  var cfg = window.KEYCLOAK_CONFIG;
  if (!cfg || !cfg.url) return; // Sin config → sin auth (desarrollo local)

  var kc = new Keycloak({ url: cfg.url, realm: cfg.realm, clientId: cfg.clientId });

  // Exponer logout global para el botón del sidebar.
  //
  // Se define ANTES de kc.init() y sin depender de él: si init falla (p. ej.
  // el origen del dashboard no está en los "Web origins" del cliente y el
  // navegador bloquea por CORS el intercambio del code por el token), el
  // .then() nunca corre y el botón se quedaría sin handler — clic sin efecto.
  // Por lo mismo se arma la URL de end-session a mano en vez de usar
  // kc.logout(), que revienta si el adapter no llegó a inicializarse.
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
  //        Solo existe la sesión de Keycloak: se va directo al end-session.
  //
  // Cuál aplica se detecta preguntando por /oauth2/auth: oauth2-proxy
  // responde (202/401/403) y Shiny devuelve 404.
  window.keycloakLogout = function () {
    var origin = window.location.origin;

    // id_token_hint es imprescindible: sin él, Keycloak 26 no cierra la
    // sesión de una, muestra una pantalla de confirmación (así lo define OIDC
    // RP-Initiated Logout). Solo existe si init terminó bien; si no, se manda
    // client_id, que al menos lleva a esa pantalla de confirmación.
    var kcLogout = cfg.url + "/realms/" + cfg.realm +
      "/protocol/openid-connect/logout" +
      "?post_logout_redirect_uri=" + encodeURIComponent(origin) +
      (kc.idToken
        ? "&id_token_hint=" + encodeURIComponent(kc.idToken)
        : "&client_id=" + encodeURIComponent(cfg.clientId));

    fetch("/oauth2/auth", { method: "GET", credentials: "include" })
      .then(function (r) {
        window.location.href = (r.status === 404)
          ? kcLogout                                   // acceso directo
          : "/oauth2/sign_out?rd=" + encodeURIComponent(kcLogout);
      })
      .catch(function () {
        window.location.href = kcLogout;               // sin red: al menos Keycloak
      });
  };


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
          '<button onclick="window.keycloakLogout()">Cerrar sesión</button>' +
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


    })
    .catch(function (e) {
      console.error("[ESAVI] Error al inicializar Keycloak:", e);
      console.error(
        "[ESAVI] Revisa que " + window.location.origin + " esté en los " +
        "'Web origins' y en los 'Valid redirect URIs' del cliente " +
        cfg.clientId + " del realm " + cfg.realm + "."
      );
    });
})();
