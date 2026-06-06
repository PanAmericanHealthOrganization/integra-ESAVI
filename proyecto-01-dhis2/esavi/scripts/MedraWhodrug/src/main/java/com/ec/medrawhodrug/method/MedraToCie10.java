package com.ec.medrawhodrug.method;

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

import com.ec.medrawhodrug.model.MapeoMedraCie10;
import com.ec.medrawhodrug.singleton.ConexionBaseDatosSingleton;
import com.ecmedrawhodrug.bean.BeanCie10ToMedra;

@Path("/medratocie10")
public class MedraToCie10 implements Serializable {
	ConexionBaseDatosSingleton db = ConexionBaseDatosSingleton.GetInstance();
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	@Context
	private HttpServletRequest request;
	Logger logger = Logger.getLogger(MedraToCie10.class.getName());

	@POST
	@Path("/bymedracode")
	@Produces(MediaType.APPLICATION_JSON + "; charset=UTF-8")
	@Consumes(MediaType.APPLICATION_JSON + "; charset=UTF-8")
	public List<BeanCie10ToMedra> consultaTerminoPorCodigoMedra(String requerimiento,
			@Context HttpServletRequest request) {
		logger.info("consultaTerminoPorCodigoMedra: "+requerimiento);
		List<BeanCie10ToMedra> lista = new ArrayList<BeanCie10ToMedra>();
		try {
			JSONObject required = new JSONObject(requerimiento);
			List<MapeoMedraCie10> registros = db.getMedraToCie10Dao()
					.obtenerMapeoPorCodigoMedra(required.has("CodigoMedra") ? required.getString("CodigoMedra") : "");
			for (MapeoMedraCie10 m : registros) {
				lista.add(new BeanCie10ToMedra(m.getMapeoMedraCie10PK().getCodigoCie10(), m.getTerminoCie10(),
						m.getMapeoMedraCie10PK().getCodigoLltMeddra()));
				break;
			}
		} catch (Exception e) {
			logger.info(e.getMessage());
		}
		logger.info("Registros devueltos " + lista.size());
		return lista;
	}

	@POST
	@Path("/ByCie10Code")
	@Produces(MediaType.APPLICATION_JSON + "; charset=UTF-8")
	@Consumes(MediaType.APPLICATION_JSON + "; charset=UTF-8")
	public List<BeanCie10ToMedra> consultaTerminoPorCodigoCie10(String requerimiento,
			@Context HttpServletRequest request) {
		logger.info("consultaTerminoPorCodigoCie10: "+requerimiento);
		List<BeanCie10ToMedra> lista = new ArrayList<BeanCie10ToMedra>();
		try {
			JSONObject required = new JSONObject(requerimiento);
			List<MapeoMedraCie10> registros = db.getMedraToCie10Dao()
					.obtenerMapeoPorCodigoCie10(required.has("CodigoCie10") ? required.getString("CodigoCie10") : "");
			for (MapeoMedraCie10 m : registros) {
				lista.add(new BeanCie10ToMedra(m.getMapeoMedraCie10PK().getCodigoCie10(), m.getTerminoCie10(),
						m.getMapeoMedraCie10PK().getCodigoLltMeddra()));
			}
		} catch (Exception e) {
			logger.info(e.getMessage());
		}
		logger.info("Registros devueltos " + lista.size());
		return lista;
	}
}
