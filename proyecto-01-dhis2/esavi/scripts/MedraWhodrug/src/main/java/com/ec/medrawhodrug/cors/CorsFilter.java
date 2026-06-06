package com.ec.medrawhodrug.cors;

import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.ext.Provider;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.logging.Logger;

@Provider
public class CorsFilter implements ContainerRequestFilter, ContainerResponseFilter {
	Logger logger = Logger.getLogger(CorsFilter.class.getName());
	private static final Set<String> allowedOrigins = new HashSet<>(Arrays.asList("http://145.223.73.234:8050","http://145.223.73.234:8060" ));
	
	@Override
	public void filter(ContainerRequestContext requestContext) throws IOException {
		logger.info("enra a Validacion de options");
		// Si es preflight OPTIONS → responder antes de llegar al endpoint
		if ("OPTIONS".equalsIgnoreCase(requestContext.getMethod())) {
			requestContext.abortWith(javax.ws.rs.core.Response.ok().build());
		}
	}

	@Override
	public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext)
			throws IOException {
		logger.info("enra a Validacion de llamada de datos");
		String origin = requestContext.getHeaderString("Origin");

		if (origin != null && allowedOrigins.contains(origin)) {
			responseContext.getHeaders().add("Access-Control-Allow-Origin", origin);
			responseContext.getHeaders().add("Vary", "Origin");
		}

		responseContext.getHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
		responseContext.getHeaders().add("Access-Control-Allow-Headers",
				"Origin, Content-Type, Accept, Authorization, X-Requested-With");
		responseContext.getHeaders().add("Access-Control-Allow-Credentials", "true");
		responseContext.getHeaders().add("Access-Control-Max-Age", "3600");
	}
}
