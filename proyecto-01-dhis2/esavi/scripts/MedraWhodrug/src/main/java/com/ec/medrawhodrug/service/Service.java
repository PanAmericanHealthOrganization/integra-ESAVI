package com.ec.medrawhodrug.service;

import java.util.HashSet;
import java.util.Set;

import javax.ws.rs.ApplicationPath;
import javax.ws.rs.core.Application;

import com.ec.medrawhodrug.method.MedraToCie10;

@ApplicationPath(value ="/api")
public class Service extends Application{
	@Override
	public Set<Object> getSingletons() {
		Set<Object> singletons = new HashSet<>();
		singletons.add(new MedraToCie10());
		singletons.add(new ServiceWhoDrug());
		return singletons;
	}
}
