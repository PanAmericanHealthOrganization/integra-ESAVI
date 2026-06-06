package com.ec.medrawhodrug.dao;

import java.util.List;

import com.ec.medrawhodrug.model.DatosWhodrug;
import com.ec.medrawhodrug.model.MapeoMedraCie10;
import com.ecmedrawhodrug.bean.BeanDataSearch;

public interface MedraToCie10Dao {
	public abstract MapeoMedraCie10 agregaActualizaMedraToCie10(MapeoMedraCie10 mapeoMedraCie10);

	public abstract List<MapeoMedraCie10> obtenerMapeoPorCodigoMedra(String codigoMedra);

	public abstract List<MapeoMedraCie10> obtenerMapeoPorCodigoCie10(String codigoCie10);

	public abstract List<BeanDataSearch> obtenerAbreviatura();
	
	public abstract List<BeanDataSearch> obtenerAbreviatura(String code);
	
	public abstract List<BeanDataSearch> obtenerAbreviaturaCovid(String code);

	public abstract List<BeanDataSearch> obtenerDrugsByAbreviature(String code);

	public abstract List<BeanDataSearch> obtenerMaholderByDrugCode(String code);

	public abstract List<BeanDataSearch> obtenerFormByMaholderCode(String code);

	public abstract List<BeanDataSearch> obtenerStrengthByFormCode(String code);

	public abstract DatosWhodrug agregaActualizaWhodrug(DatosWhodrug datos);
	public abstract boolean DeleteWhodrugData();
}
