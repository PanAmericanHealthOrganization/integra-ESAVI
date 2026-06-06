package com.ec.medrawhodrug.singleton;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import javax.annotation.PostConstruct;
import javax.ejb.DependsOn;
import javax.ejb.Singleton;
import javax.ejb.Startup;

import com.ec.medrawhodrug.model.DatosWhodrug;
import com.ec.medrawhodrug.model.MapeoMedraCie10;
import com.ec.medrawhodrug.model.MapeoMedraCie10PK;

@Singleton
@Startup
@DependsOn("ConexionBaseDatosSingleton")
public class ExcelReaderSingleton {
	Logger logger = Logger.getLogger(ExcelReaderSingleton.class.getName());
	private String FILE_PATH;
	private String FILE_PATH_WHO_DRUG;
	ConexionBaseDatosSingleton db = ConexionBaseDatosSingleton.GetInstance();

	@PostConstruct
	public void init() {
		FILE_PATH = System.getProperty("jboss.home.dir") + File.separator + "data-medra";
		FILE_PATH_WHO_DRUG = System.getProperty("jboss.home.dir") + File.separator + "data-whodrug";
		logger.info("data medra ---> " + FILE_PATH);
		logger.info("data who.drug ---> " + FILE_PATH_WHO_DRUG);
		processExcelIfExists();
		processExcelIfExistsWhodrug();
	}

	public void processExcelIfExists() {
		File file = new File(FILE_PATH);

		if (file.listFiles().length != 0) {
			for (File f : file.listFiles()) {
				logger.info("Archivo encontrado: " + f.getName());
				readContentData(f);
				boolean deleted = f.delete();
				if (deleted) {
					logger.info("Archivo eliminado correctamente.");
				} else {
					logger.info("Error al eliminar el archivo.");
				}
			}
		} else {
			if (!file.exists())
				file.mkdir();
			System.out.println("No existe el archivo en el path.");
		}
	}

	public void processExcelIfExistsWhodrug() {
		File file = new File(FILE_PATH_WHO_DRUG);

		if (file.listFiles().length != 0) {
			for (File f : file.listFiles()) {
				logger.info("Archivo encontrado whodrug: " + f.getName());
				readContentDataWhodrug(f);
				boolean deleted = f.delete();
				if (deleted) {
					logger.info("Archivo eliminado correctamente whodrug.");
				} else {
					logger.info("Error al eliminar el archivo whodrug.");
				}
			}
		} else {
			if (!file.exists())
				file.mkdir();
			System.out.println("No existe el archivo en el path whodrug.");
		}
	}

	// Método para leer el archivo XLS
	private void readContentData(File file) {
		BufferedReader br = null;
		FileReader fr = null;
		try {
			fr = new FileReader(file);
			br = new BufferedReader(fr);
			String linea;

			// Leer línea por línea hasta que no haya más líneas
			int count = 0;
			while ((linea = br.readLine()) != null) {
				count++;
				if (count == 1) {
					continue;
				}
				try {
					String[] splitStr = linea.split(";");
					MapeoMedraCie10 mm = new MapeoMedraCie10();
					mm.setMapeoMedraCie10PK(new MapeoMedraCie10PK(splitStr[0], splitStr[2]));
					mm.setTerminoCie10(splitStr[1]);
					db.getMedraToCie10Dao().agregaActualizaMedraToCie10(mm);
				} catch (Exception e) {
					logger.info("linea con problemas.. " + linea);
				}
			}
		} catch (IOException e) {
			System.err.println("Error al leer el archivo: " + e.getMessage());
		} finally {
			// Es importante cerrar los flujos en un bloque try-catch o finally
			try {
				if (br != null) {
					br.close();
				}
				if (fr != null) {
					fr.close();
				}
			} catch (IOException e2) {
				System.out.println("Error al cerrar los flujos: " + e2.getMessage());
			}
		}
	}

	// Método para leer el archivo CSV
	private void readContentDataWhodrug(File file) {
		BufferedReader br = null;
		InputStreamReader isr = null;
		FileInputStream fis = null;
		try {
			fis = new FileInputStream(file);
			isr = new InputStreamReader(fis, StandardCharsets.UTF_8);
			br = new BufferedReader(isr);
			String linea;

			// Leer línea por línea hasta que no haya más líneas
			int count = 0;
			List<String> columnName = new ArrayList<String>();
			logger.info("Eliminado.. " + db.getMedraToCie10Dao().DeleteWhodrugData());
			while ((linea = br.readLine()) != null) {
				// linea = linea.replace("\uFEFF", "");

				try {
					String[] splitStr = linea.split("\\|", -1);
					if (count == 0) {
						for (String cname : splitStr) {
							columnName.add(cname);
						}
						count++;
						continue;
					}
					// logger.info("numero columnas: " + columnName.size());

					DatosWhodrug m = new DatosWhodrug();

					Map<String, String> rowMap = new HashMap<>();
					for (int i = 0; i < columnName.size(); i++) {
						String col = columnName.get(i).trim();
						String val = (i < splitStr.length) ? splitStr[i].trim() : "";
						rowMap.put(col, val);
					}

					/*
					 * try { m.setId(Long.parseLong(splitStr[0])); m.setDrugCode(splitStr[1]);
					 * m.setDrugName(splitStr[2]); m.setMedicinalProductID(splitStr[3]);
					 * m.setAtcs(splitStr[4]); m.setAbbreviation(splitStr[5]);
					 * m.setIngredient(splitStr[6]); m.setIngredientTranslations(splitStr[7]);
					 * m.setLanguageCode(splitStr[8]); m.setIso3Code(splitStr[9]);
					 * m.setCountrymedicinalProductID(splitStr[10]); m.setMaHolders(splitStr[11]);
					 * m.setMaHoldersmedicinalProductID(splitStr[12]); m.setForm(splitStr[13]);
					 * m.setFormTranslations(splitStr[14]);
					 * m.setFormsmedicinalProductID(splitStr[15]); m.setStrength(splitStr[16]);
					 * m.setStrengthsmedicinalProductID(splitStr[17]); m.setIsGeneric(splitStr[18]);
					 * m.setIsV(splitStr[19]); } catch (IndexOutOfBoundsException e) {
					 * logger.info("Errror en linea " + linea); }
					 */
					// 🔍 Mostrar columna y valor
					// System.out.println("-------- FILA --------");

					for (String col : rowMap.keySet()) {
						// System.out.println(col + " = " + rowMap.get(col));
						if (col.equalsIgnoreCase("drugCode")) {
							m.setDrugCode(rowMap.get(col));
						} else if (col.equalsIgnoreCase("drugName")) {
							m.setDrugName(rowMap.get(col));
						} else if (col.equalsIgnoreCase("medicinalProductID")) {
							m.setMedicinalProductID(rowMap.get(col));
						} else if (col.equalsIgnoreCase("atcs")) {
							m.setAtcs(rowMap.get(col));
						} else if (col.equalsIgnoreCase("abbreviation")) {
							m.setAbbreviation(rowMap.get(col));
						} else if (col.equalsIgnoreCase("ingredient")) {
							m.setIngredient(rowMap.get(col));
						} else if (col.equalsIgnoreCase("ingredientTranslations")) {
							m.setIngredientTranslations(rowMap.get(col));
						} else if (col.equalsIgnoreCase("languageCode")) {
							m.setLanguageCode(rowMap.get(col));
						} else if (col.equalsIgnoreCase("iso3Code")) {
							m.setIso3Code(rowMap.get(col));
						} else if (col.equalsIgnoreCase("country_medicinalProductID")) {
							m.setCountrymedicinalProductID(rowMap.get(col));
						} else if (col.equalsIgnoreCase("maHolders")) {
							m.setMaHolders(rowMap.get(col));
						} else if (col.equalsIgnoreCase("maHolders_medicinalProductID")) {
							m.setMaHoldersmedicinalProductID(rowMap.get(col));
						} else if (col.equalsIgnoreCase("form")) {
							m.setForm(rowMap.get(col));
						} else if (col.equalsIgnoreCase("formTranslations")) {
							m.setFormTranslations(rowMap.get(col));
						} else if (col.equalsIgnoreCase("forms_medicinalProductID")) {
							m.setFormsmedicinalProductID(rowMap.get(col));
						} else if (col.equalsIgnoreCase("strength")) {
							m.setStrength(rowMap.get(col));
						} else if (col.equalsIgnoreCase("strengths_medicinalProductID")) {
							m.setStrengthsmedicinalProductID(rowMap.get(col));
						} else if (col.equalsIgnoreCase("isGeneric")) {
							m.setIsGeneric(rowMap.get(col));
						} else if (col.equalsIgnoreCase("isPreferred")) {
							m.setIsV(rowMap.get(col));
						} else if (col.equalsIgnoreCase("id")) {
							m.setId(Long.parseLong(rowMap.get(col).toString()));
						}
					}
					if (m.getId() == null)
						m.setId((long) count);
					count++;
					db.getMedraToCie10Dao().agregaActualizaWhodrug(m);
				} catch (Exception e) {
					logger.info("linea con problemas.. " + linea);
				}
				count++;
			}
		} catch (IOException e) {
			System.err.println("Error al leer el archivo: " + e.getMessage());
		} finally {
			try {
				if (br != null)
					br.close();
				if (isr != null)
					isr.close();
				if (fis != null)
					fis.close();
			} catch (IOException e) {
				System.err.println("Error al cerrar flujos: " + e.getMessage());
			}
		}
	}
}
