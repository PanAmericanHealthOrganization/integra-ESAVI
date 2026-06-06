package com.ec.medrawhodrug.service;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import org.primefaces.shaded.json.JSONObject;

import com.ec.medrawhodrug.singleton.ConexionBaseDatosSingleton;
import com.ecmedrawhodrug.bean.BeanDataSearch;

@Path("/whodrug")
public class ServiceWhoDrug implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	ConexionBaseDatosSingleton db = ConexionBaseDatosSingleton.GetInstance();
	@Context
	private HttpServletRequest request;
	Logger logger = Logger.getLogger(ServiceWhoDrug.class.getName());

	@POST
	@Path("/abbreviation")
	@Produces(MediaType.APPLICATION_JSON + "; charset=UTF-8")
	@Consumes(MediaType.APPLICATION_JSON + "; charset=UTF-8")
	public List<BeanDataSearch> abbreviation(String requerimiento, @Context HttpServletRequest request) {
		logger.info("abbreviation: " + requerimiento);
		List<BeanDataSearch> datos = new ArrayList<BeanDataSearch>();
		try {
			JSONObject required = new JSONObject(requerimiento);
			datos = db.getMedraToCie10Dao().obtenerAbreviatura(required.has("Code")?required.getString("Code"):"");
		} catch (Exception e) {
			e.printStackTrace();
		}
		return datos;
	}
	
	@POST
	@Path("/abbreviationCovid")
	@Produces(MediaType.APPLICATION_JSON + "; charset=UTF-8")
	@Consumes(MediaType.APPLICATION_JSON + "; charset=UTF-8")
	public List<BeanDataSearch> abbreviationCovid(String requerimiento, @Context HttpServletRequest request) {
		logger.info("abbreviation: " + requerimiento);
		List<BeanDataSearch> datos = new ArrayList<BeanDataSearch>();
		try {
			JSONObject required = new JSONObject(requerimiento);
			datos = db.getMedraToCie10Dao().obtenerAbreviaturaCovid(required.has("Code")?required.getString("Code"):"");
		} catch (Exception e) {
			e.printStackTrace();
		}
		return datos;
	}

	@POST
	@Path("/drugByAbbreviation")
	@Produces(MediaType.APPLICATION_JSON + "; charset=UTF-8")
	@Consumes(MediaType.APPLICATION_JSON + "; charset=UTF-8")
	public List<BeanDataSearch> drugByAbbreviation(String requerimiento, @Context HttpServletRequest request) {
		logger.info("drugByAbbreviation: " + requerimiento);
		List<BeanDataSearch> datos = new ArrayList<BeanDataSearch>();
		try {
			JSONObject required = new JSONObject(requerimiento);
			datos = db.getMedraToCie10Dao().obtenerDrugsByAbreviature(required.getString("Code"));
		} catch (Exception e) {
			e.printStackTrace();
		}
		return datos;
	}

	@POST
	@Path("/maholderBydrugCode")
	@Produces(MediaType.APPLICATION_JSON + "; charset=UTF-8")
	@Consumes(MediaType.APPLICATION_JSON + "; charset=UTF-8")
	public List<BeanDataSearch> maholderBydrugCode(String requerimiento, @Context HttpServletRequest request) {
		logger.info("maholderBydrugCode: " + requerimiento);
		List<BeanDataSearch> datos = new ArrayList<BeanDataSearch>();
		try {
			JSONObject required = new JSONObject(requerimiento);
			datos = db.getMedraToCie10Dao().obtenerMaholderByDrugCode(required.getString("Code"));
		} catch (Exception e) {
			e.printStackTrace();
		}
		return datos;
	}

	@POST
	@Path("/formByMaholder")
	@Produces(MediaType.APPLICATION_JSON + "; charset=UTF-8")
	@Consumes(MediaType.APPLICATION_JSON + "; charset=UTF-8")
	public List<BeanDataSearch> formByMalholder(String requerimiento, @Context HttpServletRequest request) {
		logger.info("formByMalholder: " + requerimiento);
		List<BeanDataSearch> datos = new ArrayList<BeanDataSearch>();
		try {
			JSONObject required = new JSONObject(requerimiento);
			datos = db.getMedraToCie10Dao().obtenerFormByMaholderCode(required.getString("Code"));
		} catch (Exception e) {
			e.printStackTrace();
		}
		return datos;
	}

	@POST
	@Path("/strengthByForm")
	@Produces(MediaType.APPLICATION_JSON + "; charset=UTF-8")
	@Consumes(MediaType.APPLICATION_JSON + "; charset=UTF-8")
	public List<BeanDataSearch> stressByForm(String requerimiento, @Context HttpServletRequest request) {
		logger.info("stressByForm: " + requerimiento);
		List<BeanDataSearch> datos = new ArrayList<BeanDataSearch>();
		try {
			JSONObject required = new JSONObject(requerimiento);
			datos = db.getMedraToCie10Dao().obtenerStrengthByFormCode(required.getString("Code"));
		} catch (Exception e) {
			e.printStackTrace();
		}
		return datos;
	}
}
