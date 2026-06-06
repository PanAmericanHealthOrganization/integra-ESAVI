package com.ec.medrawhodrug.implement;

import java.util.ArrayList;
import java.util.List;

import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;

import com.ec.medrawhodrug.dao.MedraToCie10Dao;
import com.ec.medrawhodrug.model.DatosWhodrug;
import com.ec.medrawhodrug.model.MapeoMedraCie10;
import com.ec.medrawhodrug.util.Utils;
import com.ecmedrawhodrug.bean.BeanDataSearch;

@Stateless
public class MedraToCie10DaoImp implements MedraToCie10Dao {
	@PersistenceContext(unitName = Utils.conexionDataSource)
	private EntityManager em;

	@Override
	public MapeoMedraCie10 agregaActualizaMedraToCie10(MapeoMedraCie10 mapeoMedraCie10) {
		return em.merge(mapeoMedraCie10);
	}

	@SuppressWarnings("unchecked")
	@Override
	public List<MapeoMedraCie10> obtenerMapeoPorCodigoMedra(String codigoMedra) {
		Query q = em.createNamedQuery("MapeoMedraCie10.findByCodigoLltMeddra");
		q.setParameter("codigoLltMeddra", codigoMedra);
		return q.getResultList();
	}

	@SuppressWarnings("unchecked")
	@Override
	public List<MapeoMedraCie10> obtenerMapeoPorCodigoCie10(String codigoCie10) {
		Query q = em.createNamedQuery("MapeoMedraCie10.findByCodigoCie10");
		q.setParameter("codigoCie10", codigoCie10);
		return q.getResultList();
	}

	@SuppressWarnings("unchecked")
	@Override
	public List<BeanDataSearch> obtenerAbreviatura() {
		Query q = em.createNamedQuery("DatosWhodrug.findAllAbbreviation");
		List<Object[]> lista = q.getResultList();
		List<BeanDataSearch> datos = new ArrayList<BeanDataSearch>();
		for (Object[] fila : lista) {
			try {
				BeanDataSearch d = new BeanDataSearch();
				d.setCode(fila[0].toString());
				d.setName(fila[1].toString());
				datos.add(d);
			} catch (NullPointerException e) {

			}
		}
		return datos;
	}

	@SuppressWarnings("unchecked")
	@Override
	public List<BeanDataSearch> obtenerDrugsByAbreviature(String code) {
		Query q = em.createNamedQuery("DatosWhodrug.findDrugNameByAbbreviation");
		q.setParameter("abbreviation", code);
		List<Object[]> lista = q.getResultList();
		List<BeanDataSearch> datos = new ArrayList<BeanDataSearch>();
		for (Object[] fila : lista) {
			try {
				BeanDataSearch d = new BeanDataSearch();
				d.setCode("NULL".equalsIgnoreCase(fila[0].toString()) ? "" : fila[0].toString());
				d.setName("NULL".equalsIgnoreCase(fila[1].toString()) ? "" : fila[1].toString());
				d.setCountryMedicinalProductID("NULL".equalsIgnoreCase(fila[2].toString()) ? "" : fila[2].toString());
				d.setMedicinalProductID("NULL".equalsIgnoreCase(fila[3].toString()) ? "" : fila[3].toString());
				datos.add(d);
			} catch (NullPointerException e) {

			}
		}
		return datos;
	}

	@SuppressWarnings("unchecked")
	@Override
	public List<BeanDataSearch> obtenerMaholderByDrugCode(String code) {
		Query q = em.createNamedQuery("DatosWhodrug.findMaholderByDrugCode");
		q.setParameter("drugCode", code);
		List<Object[]> lista = q.getResultList();
		List<BeanDataSearch> datos = new ArrayList<BeanDataSearch>();
		for (Object[] fila : lista) {
			try {
				BeanDataSearch d = new BeanDataSearch();
				d.setCode("NULL".equalsIgnoreCase(fila[0].toString()) ? "" : fila[0].toString());
				d.setName("NULL".equalsIgnoreCase(fila[1].toString()) ? "" : fila[1].toString());
				if (!(d.getCode().isEmpty() && d.getName().isEmpty()))
					datos.add(d);
			} catch (NullPointerException e) {

			}
		}
		return datos;
	}

	@SuppressWarnings("unchecked")
	@Override
	public List<BeanDataSearch> obtenerFormByMaholderCode(String code) {
		Query q = em.createNamedQuery("DatosWhodrug.findFormBymaHoldersmedicinalProductID");
		q.setParameter("maHoldersmedicinalProductID", code);
		List<Object[]> lista = q.getResultList();
		List<BeanDataSearch> datos = new ArrayList<BeanDataSearch>();
		for (Object[] fila : lista) {
			try {
				BeanDataSearch d = new BeanDataSearch();
				d.setCode("NULL".equalsIgnoreCase(fila[0].toString()) ? "" : fila[0].toString());
				d.setName("NULL".equalsIgnoreCase(fila[1].toString()) ? "" : fila[1].toString());
				if (!(d.getCode().isEmpty() && d.getName().isEmpty()))
					datos.add(d);
			} catch (NullPointerException e) {

			}
		}
		return datos;
	}

	@SuppressWarnings("unchecked")
	@Override
	public List<BeanDataSearch> obtenerStrengthByFormCode(String code) {
		Query q = em.createNamedQuery("DatosWhodrug.findStrengthByFormsmedicinalProductID");
		q.setParameter("formsmedicinalProductID", code);
		List<Object[]> lista = q.getResultList();
		List<BeanDataSearch> datos = new ArrayList<BeanDataSearch>();
		for (Object[] fila : lista) {
			try {
				BeanDataSearch d = new BeanDataSearch();
				d.setCode("NULL".equalsIgnoreCase(fila[0].toString()) ? "" : fila[0].toString());
				d.setName("NULL".equalsIgnoreCase(fila[1].toString()) ? "" : fila[1].toString());
				if (!(d.getCode().isEmpty() && d.getName().isEmpty()))
					datos.add(d);
			} catch (NullPointerException e) {

			}
		}
		return datos;
	}

	@Override
	public DatosWhodrug agregaActualizaWhodrug(DatosWhodrug datos) {
		return em.merge(datos);
	}

	@Override
	public boolean DeleteWhodrugData() {
		boolean deleted = false;
		Query q = em.createQuery("DELETE FROM DatosWhodrug");
		int rows = q.executeUpdate();
		deleted = rows != 0;
		return deleted;
	}

	@SuppressWarnings("unchecked")
	@Override
	public List<BeanDataSearch> obtenerAbreviatura(String code) {
		Query q = em.createNamedQuery("DatosWhodrug.findAllAbbreviationByCode");
		q.setParameter("abbreviation", code + "%");
		List<Object[]> lista = q.getResultList();
		List<BeanDataSearch> datos = new ArrayList<BeanDataSearch>();
		for (Object[] fila : lista) {
			try {
				BeanDataSearch d = new BeanDataSearch();
				d.setCode("NULL".equalsIgnoreCase(fila[0].toString()) ? "" : fila[0].toString());
				d.setName("NULL".equalsIgnoreCase(fila[1].toString()) ? "" : fila[1].toString());
				if (!(d.getCode().isEmpty() && d.getName().isEmpty()))
					datos.add(d);
			} catch (NullPointerException e) {

			}
		}
		return datos;
	}
	
	@SuppressWarnings("unchecked")
	@Override
	public List<BeanDataSearch> obtenerAbreviaturaCovid(String code) {
		Query q = em.createNamedQuery("DatosWhodrug.findAllAbbreviationByCodeCovid");
		q.setParameter("abbreviation", code + "%");
		List<Object[]> lista = q.getResultList();
		List<BeanDataSearch> datos = new ArrayList<BeanDataSearch>();
		for (Object[] fila : lista) {
			try {
				BeanDataSearch d = new BeanDataSearch();
				d.setCode("NULL".equalsIgnoreCase(fila[0].toString()) ? "" : fila[0].toString());
				d.setName("NULL".equalsIgnoreCase(fila[1].toString()) ? "" : fila[1].toString());
				if (!(d.getCode().isEmpty() && d.getName().isEmpty()))
					datos.add(d);
			} catch (NullPointerException e) {

			}
		}
		return datos;
	}

}
