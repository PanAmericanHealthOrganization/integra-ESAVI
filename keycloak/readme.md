# Instrucciones
### REALM
Crear un nuevo realm, esta configuración debería ser la básica
   
    tokens -> Refresh tokens -> Default Signature Algorithm -> RS256
    tokens -> Refresh tokens -> Revoke Refresh Token -> false

### REALM ROLES
Los siguente roles son los identificados en el sistema

    ESAVI_ADMIN, prioridad 1
    ESAVI_USER, prioridad 2
    ESAVI_LECTURA, prioridad 3

### USUARIOS 

Crear los usuarios para administrador, usuario, lectura.

    - administrador (esavi.admin)
    - usuario (esavi.user)
    - lectura (esavi.lectura)

Para crearlos seguimos los sugientes pasos
1.  Con el realm **integra-esavi-realm**, seleccionado ingresamos a la opción de usuarios.
2.  Creamos uno nuevo
3.  Ingresamos la siguiente información en las pestañas
    
    En la pestaña **Details**
    - Username: esavi.lectura
    - Email: esavi.lectura@gmail.com
    - Email verified: true, para que solicite la confirmación, falso solicita la confirmación enviada por correo electrónico
    - Name: Lectura
    - Last: Esavi
    
    En la pestaña **Credenciales**
    - Agregar la contraseña
    - No marcar como temporal
    
    En la pestaña **Roles**
    - Asignar el rol que le corresponde a su perfil 
      - ESAVI_LECTURA

### CLIENTE - WEB 

Crea un nuevo cliente con las configuraciones siguientes.
  - Client ID: integra_esavi_web
  - Root URL: http://localhost:3000/
  - Home URL: http://localhost:3000/
  - Valid redirect URIs: http://localhost:3000/*
  - Valid post logout redirect URIs: http://localhost:3000/*
  - Web origins: *