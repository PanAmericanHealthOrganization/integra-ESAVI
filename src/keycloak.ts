import Keycloak from "keycloak-js"

const keyCloakOptions = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM as string,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string,
}
console.log(keyCloakOptions)
const keycloak = new Keycloak(keyCloakOptions)

export default keycloak
