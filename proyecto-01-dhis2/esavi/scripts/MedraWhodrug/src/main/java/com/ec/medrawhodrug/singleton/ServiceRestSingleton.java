package com.ec.medrawhodrug.singleton;

import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

import javax.annotation.PostConstruct;
import javax.ejb.DependsOn;
import javax.ejb.Singleton;
import javax.ejb.Startup;
import javax.enterprise.context.Destroyed;
import javax.persistence.PostRemove;

import org.jboss.resteasy.plugins.server.netty.NettyJaxrsServer;
import org.jboss.resteasy.spi.ResteasyDeployment;
import org.jboss.resteasy.test.TestPortProvider;

import com.ec.medrawhodrug.service.Service;

@Singleton
@Startup
@DependsOn("ConexionBaseDatosSingleton")
public class ServiceRestSingleton {
	Logger logger = Logger.getLogger(ServiceRestSingleton.class.getName());
	NettyJaxrsServer netty = new NettyJaxrsServer();

	@PostConstruct
	public void init() {
		logger.info("Inicializando....");

		ResteasyDeployment deployment = new ResteasyDeployment();
		Map<String, String> mediaTypeMappings = new HashMap<String, String>();
		mediaTypeMappings.put("xml", "application/xml");
		mediaTypeMappings.put("json", "application/json");
		deployment.setMediaTypeMappings(mediaTypeMappings);
		deployment.setApplication(new Service());
		// registrar el filtro CORS
		deployment.getProviderClasses().add("cors.medrawhodrug.com.ec.CorsFilter");
		
		netty.setDeployment(deployment);
		// netty.setPort(TestPortProvider.getPort());
		netty.setPort(8899);
		// netty.setRootResourcePath("/");
		netty.setSecurityDomain(null);
		netty.start();
		logger.info("escuchando.... " + TestPortProvider.getPort());
	}

	@PostRemove
	public void remove() {
		logger.info("detener netty");
		netty.stop();
	}
	
}
