package com.ec.medrawhodrug.singleton;

import java.util.logging.Logger;

import javax.ejb.EJB;
import javax.ejb.Singleton;
import javax.ejb.Startup;

import com.ec.medrawhodrug.dao.MedraToCie10Dao;

@Singleton
@Startup
public class ConexionBaseDatosSingleton {
	Logger logger = Logger.getLogger(ConexionBaseDatosSingleton.class.getName());
	public ConexionBaseDatosSingleton() {
		logger.info("creado constructor");
		instance = this;
	}

	@EJB
	private MedraToCie10Dao medraToCie10Dao;
	private static ConexionBaseDatosSingleton instance;

	public static ConexionBaseDatosSingleton GetInstance() {
		if (instance == null)
			instance = new ConexionBaseDatosSingleton();
		return instance;
	}

	public MedraToCie10Dao getMedraToCie10Dao() {
		return medraToCie10Dao;
	}

}
